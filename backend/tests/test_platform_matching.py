"""Registered identities, model integration, profile ownership and feasibility."""
from pathlib import Path
import copy
from datetime import datetime, timezone, timedelta
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import db
from app.models.platform_matching import RegisteredMatchRequest
from app.services import platform_matching_service as service


def offer(**overrides):
    return dict(food_name='Confirmed rice', confirmed_quantity_kg=10, quality_confirmed=True,
                food_category='grain', dietary_type='veg', required_storage='ambient',
                pickup_within_minutes=60, delivery_within_minutes=120,
                vehicle_capacity_kg=30, transport_storage=['ambient'], **overrides)


class PlatformMatchingTests(unittest.TestCase):
    def setUp(self):
        self.state = copy.deepcopy((db.users, db.food_data, db.predictions, db.matches, db.redistribution_logs))
        self.client = TestClient(app)
        self.provider = db.get_user_by_username('tajhotel')
        self.ngo = db.get_user_by_username('feedindia')
        self.provider_headers = self.login('tajhotel')
        self.ngo_headers = self.login('feedindia')

    def login(self, username):
        response = self.client.post('/api/login', json={'username':username,'password':'pass123'})
        self.assertEqual(response.status_code,200,response.text)
        return {'Authorization':'Bearer '+response.json()['access_token']}

    def tearDown(self):
        db.users, db.food_data, db.predictions, db.matches, db.redistribution_logs = self.state
        self.client.close()

    def rank(self, payload=None):
        response = self.client.post('/api/provider/ngo-matching/rank', headers=self.provider_headers, json=payload or offer())
        self.assertEqual(response.status_code,200,response.text)
        return response.json()

    def test_registry_uses_registered_identities_and_never_exposes_credentials(self):
        response = self.client.get('/api/provider/ngo-matching',headers=self.provider_headers)
        self.assertEqual(response.status_code,200,response.text)
        result=response.json()
        self.assertEqual(result['directory_source'],'platform_registry')
        self.assertEqual({n['ngo_id'] for n in result['ngos']},{n['id'] for n in db.get_users_by_role('ngo')})
        self.assertTrue(any(n['ngo_name']=='Feed India Foundation' for n in result['ngos']))
        for ngo in result['ngos']:
            self.assertNotIn('password',ngo)
            self.assertNotIn('email',ngo)
        self.assertNotEqual(self.ngo['capacity'], self.ngo['donation_availability']['available_capacity_kg'])

    def test_model_scores_registered_ngos_and_does_not_write_matches(self):
        before=copy.deepcopy((db.food_data,db.predictions,db.matches,db.redistribution_logs))
        with patch('app.services.platform_matching_service.rank',wraps=service.rank) as model_rank:
            result=self.rank()
            self.assertTrue(model_rank.called)
            candidates=model_rank.call_args.args[0].candidates
            self.assertEqual({c.ngo_id for c in candidates},{n['id'] for n in db.get_users_by_role('ngo')})
        self.assertEqual(result['method'],'LightGBM')
        self.assertTrue(result['ranked'])
        self.assertEqual(result['recommended_ngo_id'],result['ranked'][0]['ngo_id'])
        scores=[n['ranking_score'] for n in result['ranked']]
        self.assertEqual(scores,sorted(scores,reverse=True))
        self.assertFalse(result['allocation_reserved'])
        for candidate in result['ranked']:
            self.assertTrue(candidate['eligible'])
            self.assertFalse(candidate['model_eta_exceeds_window'])
            self.assertGreaterEqual(candidate['estimated_delivery_minutes'],candidate['nominal_elapsed_minutes'])
            self.assertLessEqual(candidate['estimated_delivery_minutes'],120)
        self.assertEqual(before,(db.food_data,db.predictions,db.matches,db.redistribution_logs))
        payload=offer();payload['method']='RandomForest'
        self.assertEqual(self.rank(payload)['method'],'RandomForest')

    def test_new_registration_appears_but_unknown_kg_capacity_is_not_invented(self):
        response=self.client.post('/api/register',json=dict(username='newngo',password='pass123',email='test@example.org',role='ngo',name='New Registry NGO',capacity=1000,latitude=18.94,longitude=72.84))
        self.assertEqual(response.status_code,200,response.text)
        result=self.rank()
        rejected=next(n for n in result['rejected'] if n['ngo_name']=='New Registry NGO')
        self.assertIn('availability_not_reported',rejected['rejection_reasons'])
        self.assertIsNone(rejected['availability'])
        self.assertEqual(result['total_registered_ngos'],11)

    def test_reports_are_saved_only_for_current_ngo_and_refresh_timestamp(self):
        now=datetime.now(timezone.utc)
        profile=dict(accepting=True,available_capacity_kg=4,demand_kg=4,accepted_categories=['grain'],
            vegetarian_only=True,storage_capabilities=['ambient'],receiving_start_at=now.isoformat(),
            receiving_end_at=(now+timedelta(hours=3)).isoformat(),unloading_minutes=5)
        response=self.client.put('/api/ngo/availability',headers=self.ngo_headers,json=profile)
        self.assertEqual(response.status_code,200,response.text)
        self.assertEqual(response.json()['availability']['source'],'ngo_reported')
        self.assertGreaterEqual(datetime.fromisoformat(response.json()['availability']['report_updated_at']),now)
        rejected=next(n for n in self.rank()['rejected'] if n['ngo_id']==self.ngo['id'])
        self.assertIn('capacity_insufficient',rejected['rejection_reasons'])
        other=db.get_user_by_username('robinhood')
        self.assertEqual(other['donation_availability']['source'],'seeded_demo')
        spoof={**profile,'ngo_id':other['id']}
        self.assertEqual(self.client.put('/api/ngo/availability',headers=self.ngo_headers,json=spoof).status_code,422)
        profile['receiving_end_at']=(now-timedelta(minutes=1)).isoformat()
        self.assertEqual(self.client.put('/api/ngo/availability',headers=self.ngo_headers,json=profile).status_code,422)

    def test_stale_compatibility_and_model_eta_constraints_cannot_be_overridden(self):
        self.ngo['donation_availability']['report_updated_at']=(datetime.now(timezone.utc)-timedelta(hours=3)).isoformat()
        result=self.rank()
        rejected=next(n for n in result['rejected'] if n['ngo_id']==self.ngo['id'])
        self.assertIn('capacity_report_stale_or_future',rejected['rejection_reasons'])
        payload=offer();payload.update(required_storage='cold_storage',transport_storage=['ambient'])
        result=self.rank(payload)
        self.assertIsNone(result['recommended_ngo_id'])
        self.assertTrue(all('transport_storage_incompatible' in n['rejection_reasons'] for n in result['rejected']))
        payload=offer();payload.update(delivery_within_minutes=1,pickup_within_minutes=1)
        self.assertIsNone(self.rank(payload)['recommended_ngo_id'])
        def unsafe_model(request):
            candidate=request.candidates[0]
            return dict(ranked=[dict(ngo_id=candidate.ngo_id,candidate_id=candidate.candidate_id,eligible=True,
                ranking_score=1,nominal_elapsed_minutes=5,predicted_elapsed_minutes=300,
                model_eta_exceeds_window=True,rejection_reasons=[])],rejected=[])
        with patch('app.services.platform_matching_service.rank',side_effect=unsafe_model):
            result=self.rank()
            self.assertIsNone(result['recommended_ngo_id'])
            self.assertIn('model_eta_exceeds_declared_window',result['rejected'][0]['rejection_reasons'])

    def test_role_ownership_confirmed_food_and_no_client_supplied_candidates(self):
        for path in ['/api/provider/ngo-matching','/api/ngo/availability']:
            self.assertEqual(self.client.get(path).status_code,401)
        self.assertEqual(self.client.get('/api/provider/ngo-matching',headers=self.ngo_headers).status_code,403)
        self.assertEqual(self.client.put('/api/ngo/availability',headers=self.provider_headers,json={}).status_code,403)
        cases=[]
        payload=offer();payload['quality_confirmed']=False;cases.append(payload)
        payload=offer();payload['candidates']=[];cases.append(payload)
        payload=offer();payload['confirmed_quantity_kg']=float('inf');cases.append(payload)
        payload=offer();payload['food_id']='not-owned';cases.append(payload)
        for payload in cases:
            if payload['confirmed_quantity_kg']==float('inf'):
                with self.assertRaises(ValueError): RegisteredMatchRequest(**payload)
            else:
                response=self.client.post('/api/provider/ngo-matching/rank',headers=self.provider_headers,json=payload)
                self.assertEqual(response.status_code,422,response.text)
        self.provider['latitude']=None
        response=self.client.post('/api/provider/ngo-matching/rank',headers=self.provider_headers,json=offer())
        self.assertEqual(response.status_code,422)
        self.assertTrue(service.located({'latitude':0,'longitude':0}))

    def test_empty_directory_and_more_than_one_hundred_registered_ngos(self):
        base=copy.deepcopy(self.ngo)
        db.users={key:value for key,value in db.users.items() if value['role']!='ngo'}
        self.assertEqual(self.rank()['total_registered_ngos'],0)
        self.assertEqual(self.rank()['ranked'],[])
        for index in range(105):
            item=copy.deepcopy(base);item['id']=f'ngo-{index}';item['name']=f'Registered NGO {index}'
            db.users[item['id']]=item
        result=self.rank()
        self.assertEqual(result['total_registered_ngos'],105)
        self.assertEqual(len(result['ranked'])+len(result['rejected']),105)


if __name__=='__main__': unittest.main()
