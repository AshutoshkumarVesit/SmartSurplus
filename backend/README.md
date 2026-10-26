# Backend runtime

The saved measured-waste and NGO-ranking estimators were exported with scikit-learn 1.5.2. Loading them with 1.9.0 breaks their preprocessing objects. `requirements-models.txt` pins the complete numerical/model runtime to the original experiment versions; both serving and training requirements include it.

Use a clean Python 3.12 virtual environment. From the repository root on Windows:

```powershell
py -3.12 -m venv backend/.venv
backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt
./backend/start.ps1
```

On other platforms:

```sh
python3.12 -m venv backend/.venv
backend/.venv/bin/python -m pip install -r backend/requirements.txt
cd backend
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Run the frontend separately on port 3000. Restart any existing API process after changing dependencies; a process retains previously imported modules. The older `backend/venv` environment is not used by `start.ps1`.

Research artifact loaders check package versions before deserialization and return a readable 503 error when incompatible. Artifact SHA-256 checks, trained parameters, model selection, published metrics and holdout data are preserved. This repair requires no retraining and makes no new accuracy claim.

For backend tests, install `requirements-training.txt` into the same environment and run from the repository root:

```powershell
backend/.venv/Scripts/python.exe -m unittest discover -s backend/tests -p 'test_*.py' -v
```

Some parity tests also require the existing local `DataSet/` research inputs. These inputs are not replaced by the runtime fix. The API's in-memory demo data resets on server restart.
