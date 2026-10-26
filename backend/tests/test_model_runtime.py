"""Regression checks for saved-estimator dependency drift and API failures."""
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from fastapi.testclient import TestClient
from app.main import app
from app.ml.model_runtime import MODEL_RUNTIME, validate_model_runtime
from app.services import measured_waste_service, ngo_ranking_service


class ModelRuntimeTests(unittest.TestCase):
    def test_installed_environment_matches_saved_model_contract(self):
        validate_model_runtime()
        pins = dict(
            line.strip().split('==', 1)
            for line in (BACKEND / 'requirements-models.txt').read_text().splitlines()
            if line.strip() and not line.startswith('#')
        )
        self.assertEqual(pins, MODEL_RUNTIME)

    def test_wrong_version_returns_503_before_either_model_is_loaded(self):
        client = TestClient(app)
        token = client.post('/api/login', json={
            'username': 'tajhotel', 'password': 'pass123',
        }).json()['access_token']
        headers = {
            'Authorization': 'Bearer ' + token,
            'Origin': 'http://127.0.0.1:3000',
        }
        measured_waste_service.assets.cache_clear()
        ngo_ranking_service.assets.cache_clear()
        try:
            with patch('app.ml.model_runtime.installed_version', side_effect=lambda package:
                       '1.9.0' if package == 'scikit-learn' else MODEL_RUNTIME[package]), \
                    patch('joblib.load') as deserialize:
                for endpoint in ['/api/research/waste/info', '/api/research/ngo-matching/info']:
                    with self.subTest(endpoint=endpoint):
                        response = client.get(endpoint, headers=headers)
                        self.assertEqual(response.status_code, 503, response.text)
                        self.assertIn('scikit-learn: expected 1.5.2, found 1.9.0', response.json()['detail'])
                        self.assertIn('restart', response.json()['detail'])
                        self.assertEqual(response.headers['access-control-allow-origin'], headers['Origin'])
                deserialize.assert_not_called()
        finally:
            measured_waste_service.assets.cache_clear()
            ngo_ranking_service.assets.cache_clear()
            client.close()


if __name__ == '__main__':
    unittest.main()
