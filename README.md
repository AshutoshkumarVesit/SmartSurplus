# SmartSurplus

SmartSurplus is an AI-driven food surplus prediction and redistribution platform.  
It helps food providers estimate potential surplus and connects them to nearby NGOs for timely redistribution.

## What this project includes

- FastAPI backend with JWT-based authentication and role-based access (`provider`, `ngo`, `admin`)
- In-memory demo database with seeded users, food logs, predictions, and redistribution matches
- ML-based surplus prediction service using `RandomForestRegressor`
- NGO matching engine using distance + urgency + capacity-aware priority scoring
- Admin analytics endpoints for platform metrics and logs
- Map-focused endpoints for provider/NGO markers and waste hotspots

## Tech stack

- **Backend:** Python, FastAPI, Pydantic
- **Auth:** OAuth2 ****** JWT (`python-jose`, `passlib`)
- **ML/Data:** scikit-learn, numpy, pandas
- **Geo utilities:** geopy (dependency), custom distance scoring in matching logic

## Repository structure

```text
SmartSurplus/
├── backend/
│   ├── app/
│   │   ├── api/          # Route modules (auth, provider, ngo, admin, map)
│   │   ├── core/         # Config, auth utilities, in-memory database
│   │   ├── models/       # Pydantic schemas
│   │   ├── services/     # Prediction, matching, analytics services
│   │   └── main.py       # FastAPI app entrypoint
│   └── requirements.txt
└── SmartSurplus_Documentation.md
```

## Quick start (backend)

1. Move to backend:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the API:
   ```bash
   uvicorn app.main:app --reload
   ```
4. Open docs:
   - Swagger UI: `http://127.0.0.1:8000/docs`
   - Health check: `http://127.0.0.1:8000/health`

## Main API groups

- **Auth** (`/api`): register and login
- **Provider** (`/api`): upload food data, view food logs, run/view predictions
- **NGO** (`/api/ngo`): view matches, accept/reject, confirm delivery
- **Admin** (`/api/admin`): system stats, users, logs, global predictions/matches
- **Map** (`/api/map`): provider markers, NGO markers, hotspot heat data

## Seeded demo data

On startup, the in-memory database seeds:

- 1 admin account (`admin` / `admin123`)
- Multiple provider accounts
- Multiple NGO accounts
- Historical food logs, predictions, and sample redistribution matches

> Note: Data is in-memory and resets whenever the backend restarts.

## Additional documentation

See `/SmartSurplus_Documentation.md` for a deeper functional and architecture-level write-up.

## Frontend

The `frontend/` directory contains the complete Next.js UI as regular repository files. It includes a public landing page, authentication, provider/NGO/admin workspaces, responsive navigation and an OpenStreetMap partner map.

```sh
cd frontend
npm ci
npm run dev
```

Start the backend separately on port 8000. For environment configuration, production checks and research API compatibility, see [frontend/README.md](frontend/README.md).

The basic backend supports the operational pages. Catalog/history inputs and the two research workspaces require the separately developed research-enabled API and compatible model artifacts; the UI explains when a module is unavailable.
