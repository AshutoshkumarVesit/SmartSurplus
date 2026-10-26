# SmartSurplus frontend

Responsive Next.js interface for food providers, NGOs and network coordinators. The app includes surplus forecasting screens, food preparation forms, NGO collection workflows, administration, a Leaflet network map and separate research workspaces.

## Run locally

Use Node.js 20 or newer and npm. Start the FastAPI backend on port 8000, then:

```sh
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env.local` instead of `cp` if preferred. Open `http://localhost:3000`.

`NEXT_PUBLIC_API_URL` is the full API base URL, including `/api`. It defaults to `http://localhost:8000/api`. The backend must allow the frontend origin through CORS. This variable is embedded in the browser bundle at build time; never put secrets in it.

## Validation

```sh
npm run typecheck
npm run build
```

The production build also runs the Next.js core web vitals lint checks. Preview a production build using `npm start`. Leaflet map tiles require access to OpenStreetMap tile services.

## Workspaces

- `/`: public introduction and workflow overview.
- `/login`, `/register`: authentication, role selection and account creation.
- `/dashboard/provider`: preparation records, experimental predictions and recent activity.
- `/dashboard/provider/upload`: food preparation form, with optional demand history when supported by the API.
- `/dashboard/provider/predictions`: surplus estimates and synthetic calibration intervals.
- `/dashboard/provider/research`: separate real measured kitchen + serving waste benchmark.
- `/dashboard/provider/matching`: separate NGO ranking experiment using confirmed donation inputs.
- `/dashboard/ngo`: offers, responses and actual received quantity confirmation.
- `/dashboard/ngo/matches`: match history.
- `/dashboard/admin`: network summary, partners and redistribution logs.
- `/map`: reported provider/NGO locations and surplus hotspots.

The shared `AppShell` and sidebar handle navigation, small-screen drawers and session/role redirects. Backend authorization remains authoritative. Client redirects are a presentation convenience, not an access-control boundary.

## Backend compatibility

The existing basic API supports sign-in, food records, surplus predictions, NGO actions, administration and map data. When `/api/model-info` returns 404, food entry uses the basic food-item form instead of requiring the newer catalog.

The backend now includes the independent research routes and their frozen serving artifacts. Install the pinned backend requirements and launch `backend/start.ps1`; see `backend/README.md`. The optional operational surplus catalog/history API remains a separate backend feature. The UI reports unavailable modules explicitly. Training datasets and unrelated backend work are not included.

Surplus and NGO-ranking experiments use synthetic data. The real measured-waste and parcel ETA studies have different targets; their results do not establish field performance for donatable food or certify food safety. Existing limitations remain visible in the interface.

## Demo access

The sign-in page can fill the seeded local demo account credentials for provider, NGO and admin roles. These are development accounts. The backend uses in-memory data; changes reset when it restarts. Do not use demo credentials or the backend's development configuration for a public production installation.

## UI organization

- `src/components`: brand, SVG icons, navigation, feedback and reusable cards.
- `src/app/globals.css`: shared colors, typography, responsive layouts and compatibility classes for retained research screens.
- `src/lib/api.ts`: existing endpoint contracts, session handling and readable request errors.
- `src/lib/auth.tsx`: authentication state and JWT profile decoding.

The interface uses bundled Geist fonts and a cream/forest-green palette. It includes keyboard focus styles, a skip link, labelled form controls, reduced-motion support and a mobile drawer with focus trapping and inert off-screen navigation.
