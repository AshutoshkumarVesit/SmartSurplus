"""API inference/parity checks using only the distributed serving artifacts."""
import copy
import csv
from pathlib import Path
import sys
import unittest

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import db


class ResearchInferenceTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        response = self.client.post('/api/login', json={
            'username': 'tajhotel', 'password': 'pass123',
        })
        self.assertEqual(response.status_code, 200, response.text)
        self.headers = {'Authorization': 'Bearer ' + response.json()['access_token']}

    def tearDown(self):
        self.client.close()

    def get(self, endpoint):
        response = self.client.get(endpoint, headers=self.headers)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_measured_forecasts_reproduce_all_frozen_holdout_predictions(self):
        before = copy.deepcopy((db.food_data, db.predictions, db.matches, db.redistribution_logs))
        info = self.get('/api/research/waste/info')
        self.assertFalse(info['target_boundaries']['donatable_quantity'])
        benchmark = self.get('/api/research/waste/benchmark')
        with (BACKEND / 'app/ml/artifacts/measured_waste/test_predictions.csv').open(newline='') as handle:
            frozen = list(csv.DictReader(handle))
        dates = sorted({row['date'] for row in frozen})
        self.assertEqual(len(dates), 30)
        self.assertEqual(len(benchmark['predictions']), len(frozen))
        for date in dates:
            sample = self.get('/api/research/waste/example?service_date=' + date)
            response = self.client.post('/api/research/waste/forecast', headers=self.headers,
                                        json=sample['request'])
            self.assertEqual(response.status_code, 200, response.text)
            result = response.json()
            self.assertFalse(result['donation_eligible'])
            for row in frozen:
                if row['date'] == date:
                    self.assertAlmostEqual(result['comparison'][row['method']],
                                           float(row['predicted_kg']), places=6)
        self.assertEqual(before, (db.food_data, db.predictions, db.matches, db.redistribution_logs))

    def test_both_ngo_model_families_return_stateless_feasible_proposals(self):
        before = copy.deepcopy((db.food_data, db.predictions, db.matches, db.redistribution_logs))
        self.get('/api/research/ngo-matching/info')
        first = self.get('/api/research/ngo-matching/example')
        found_feasible = False
        for index in range(first['examples']):
            sample = first if index == 0 else self.get('/api/research/ngo-matching/example?index=' + str(index))
            for method in ['default', 'LightGBM', 'RandomForest', 'NearestFeasible']:
                payload = {**sample['request'], 'method': method}
                response = self.client.post('/api/research/ngo-matching/rank',
                                            headers=self.headers, json=payload)
                self.assertEqual(response.status_code, 200, response.text)
                result = response.json()
                self.assertFalse(result['allocation_reserved'])
                self.assertFalse(result['food_safety_validated'])
                if result['ranked']:
                    found_feasible = True
                    self.assertEqual(result['selected_candidate_id'], result['ranked'][0]['candidate_id'])
                    for candidate in result['ranked']:
                        self.assertTrue(candidate['eligible'])
                        self.assertEqual(candidate['rejection_reasons'], [])
                        if candidate['estimated_received_kg'] is not None:
                            self.assertGreaterEqual(candidate['estimated_received_kg'], 0)
                            self.assertLessEqual(candidate['estimated_received_kg'], result['confirmed_quantity_kg'])
            if found_feasible:
                break
        self.assertTrue(found_feasible, 'Expected a documented example with a feasible candidate')
        self.assertEqual(before, (db.food_data, db.predictions, db.matches, db.redistribution_logs))


if __name__ == '__main__':
    unittest.main()
