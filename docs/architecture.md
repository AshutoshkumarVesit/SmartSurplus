# Implemented architecture and diagrams

These diagrams describe the inspected **local workspace**, as of 1 November 2026. Read the [README version scope](../README.md#project-status-and-version-scope) before applying them to an older GitHub checkout. Solid arrows show implemented calls/data relationships; the offline research sections are explicitly separate from runtime operations.

## 1. Deployment blocks

```mermaid
flowchart LR
    User[Browser user] --> Web[Next.js server - port 3000]
    Web --> Assets[HTML CSS JS and local assets]
    User -->|Browser fetch with bearer token| API[FastAPI Uvicorn - port 8000]
    API --> Memory[Single-process Python dictionaries]
    API --> Files[Local model and metadata files]
    User -->|Leaflet requests| Tiles[OpenStreetMap tile service]
```

There is no deployed SQL server, Redis, task queue, microservice cluster, external courier API or live GPS stream. The two local servers run independently. Backend CORS permits frontend origins on port 3000. The frontend API base is configurable; map tiles require external network access.

## 2. Authentication and request boundaries

```mermaid
sequenceDiagram
    actor U as User
    participant UI as Next.js client
    participant Auth as FastAPI authentication
    participant DB as In-memory users
    participant Route as Protected route
    U->>UI: Enter existing credentials
    UI->>Auth: POST /api/login
    Auth->>DB: Find account and verify password hash
    Auth-->>UI: Signed JWT
    UI->>UI: Store local session
    U->>UI: Open role action
    UI->>Route: JSON request with bearer token
    Route->>Auth: Decode token and load current account
    Auth->>DB: Resolve user and role
    Auth-->>Route: Authorized account or 401/403
    Route-->>UI: Validated response
```

UI redirects are navigation conveniences. Backend dependencies enforce role and ownership. Research routes permit provider/admin; availability updates require the NGO's own account. Registration currently permits selecting admin and must be restricted before public deployment. Browser-local token storage is a prototype choice.

## 3. Food entry and saved surplus inference

```mermaid
sequenceDiagram
    actor P as Provider
    participant UI as Food preparation page
    participant API as Provider routes
    participant S as Prediction service
    participant F as Shared features
    participant M as Saved LightGBM
    participant DB as In-memory store
    UI->>API: GET /api/model-info
    API->>S: Load model metadata and catalog
    S-->>UI: Item properties and model information
    P->>UI: Enter prepared kg and optional earlier history
    UI->>API: POST /api/food-data
    API->>S: Validate estimate before creating record
    S->>F: Build allowlisted 20-input row
    F-->>S: Feature matrix with unknown history missing
    S->>M: Predict surplus
    M-->>S: Numeric estimate
    S->>S: Clip to available kg and form risk/interval
    API->>DB: Add food record
    API->>S: Save prediction for new food ID
    S->>DB: Add prediction or reuse existing food prediction
    API-->>UI: Created food record
    UI->>API: GET /api/predictions
    API-->>UI: Saved estimates and provenance
```

No model training occurs in this local inference request. The native text booster is loaded once through a cached loader. IDs, version, data source and history completeness accompany output. Missing history suppresses the validation-error interval. The separate paper experiment uses 46 inputs and does not replace this service merely by existing under `DataSet/`.

## 4. Registered NGO ranking sequence

```mermaid
sequenceDiagram
    actor P as Provider
    participant UI as Registered matching page
    participant API as Platform matching API
    participant DB as User and availability store
    participant A as Candidate adapter
    participant R as Frozen ranker
    UI->>API: GET /api/provider/ngo-matching
    API->>DB: Load registered NGO users
    API-->>UI: Public directory and report issues
    P->>UI: Confirm kg, handling and delivery assumptions
    UI->>API: POST /api/provider/ngo-matching/rank
    API->>API: Validate provider role and optional food ownership
    API->>DB: Read NGOs, kg reports and past responses
    API->>A: Build candidates from server registry
    A->>A: Estimate road/travel and retain missing histories
    A->>R: Score chunks of at most 100 candidates
    R->>R: Validate runtime and artifact hashes
    R->>R: Build 28 features and evaluate hard gates
    R->>R: Predict fraction and elapsed time
    R-->>A: Ranked and rejected candidates
    A->>A: Apply additional platform learned-ETA exclusion
    A->>A: Merge chunks and sort deterministic scores
    API-->>UI: Proposal or no feasible candidate
    UI-->>P: Recommendation, rejection reasons and assumptions
```

The registry response omits passwords and private login credentials. The recommendation does not mutate food, predictions, matches or logs. It reports `allocation_reserved=false` and `food_safety_validated=false`. NGO response history uses earlier recorded timestamps; seeded availability is explicitly labeled demo data.

## 5. Candidate feature and gate blocks

```mermaid
flowchart TB
    Inputs[Confirmed food plus NGO and transport snapshot] --> Relative[Convert aware timestamps to relative minutes]
    Inputs --> Geo[Haversine and route consistency]
    Relative --> Times[Ready queue pickup handling arrival and slack]
    Inputs --> Ratios[Capacity and demand divided by offer kg]
    Inputs --> Rules[Quality accepting food diet storage capacity freshness]
    Geo --> Rules
    Times --> Rules
    Ratios --> Features[28 numeric predictor row]
    Times --> Features
    Rules --> Eligibility{Eligible?}
    Features --> Imputer[Saved training imputer]
    Imputer --> Regressors[Fraction and elapsed regressors]
    Eligibility -->|No| Reasons[Reject with reasons]
    Eligibility -->|Yes| Score[Fraction minus 0.001 times minutes]
    Regressors --> Score
    Score --> Output[Ranked proposal and feature-support warnings]
```

The service builds/scans matrices for candidates, including candidates later excluded; final eligibility determines whether an option can be selected. Missing-feature counts and inputs outside training support are exposed as warnings. The generic research route permits explicit snapshots, while the platform route derives NGO identities and profiles itself.

## 6. Conceptual data relationships

This is a relationship model of the **in-memory objects**, not an existing SQL schema. User records represent provider/NGO/admin accounts; availability is nested in an NGO account.

```mermaid
erDiagram
    USER ||--o{ FOOD_RECORD : provider_records
    USER ||--o{ PREDICTION : provider_owns
    USER ||--o| NGO_AVAILABILITY : ngo_reports
    USER ||--o{ MATCH : provider_or_ngo_participates
    FOOD_RECORD ||--o{ PREDICTION : references
    PREDICTION ||--o{ MATCH : may_reference
    MATCH ||--o{ ACTIVITY_LOG : produces
    USER {
        string id
        string role
        string name
        float latitude
        float longitude
    }
    FOOD_RECORD {
        string id
        string provider_id
        string food_type
        float quantity_kg
        float carry_in_kg
        string prepared_at
    }
    PREDICTION {
        string id
        string food_id
        float predicted_surplus_kg
        string model_version
        bool history_complete
    }
    NGO_AVAILABILITY {
        float available_capacity_kg
        float demand_kg
        string report_updated_at
        string receiving_end_at
    }
    MATCH {
        string id
        string ngo_id
        string provider_id
        string status
        float quantity_kg
        float quantity_received_kg
    }
    ACTIVITY_LOG {
        string match_id
        string action
        float quantity_kg
        string timestamp
    }
```

Availability is currently available reported kg after commitments, not inferred people/day capacity. Forecast, confirmed offer, nominal match kg and received kg have different meanings. A stateless recommendation has no persisted MATCH identity. The local confirmation route records received kg on the match and in the activity log; analytics sums actual reported receipt for delivered records.

## 7. Implemented match response and receipt boundaries

```mermaid
flowchart TD
    Existing[Existing assigned match] --> Own{Requesting NGO owns match?}
    Own -->|No| Denied[403 or missing match 404]
    Own -->|Yes| Action{Requested action}
    Action -->|Accept or reject| Response[Update status and response timestamp]
    Action -->|Confirm receipt| State{Accepted or picked up?}
    State -->|No| Conflict[409 conflict]
    State -->|Yes| Qty{Positive received kg within offered kg?}
    Qty -->|No| Invalid[422 invalid quantity]
    Qty -->|Yes| Delivered[Set delivered and received kg]
    Response --> Log[Append activity log]
    Delivered --> Log
```

This describes the current local route, not the older publication route. Accept/reject still lacks a complete transition-state guard. The `picked_up` status exists in the contract but there is no dedicated courier pickup transition endpoint in this workflow. Neither this diagram nor the status enum establishes a complete dispatch state machine.

## 8. Offline training and evaluation blocks

```mermaid
flowchart LR
    Sources[Preserved datasets and source audits] --> Contract[Target and prediction-time feature contract]
    Contract --> Split[Chronological train validation test partitions]
    Split --> Train[Fit preprocessing and candidate models on train]
    Train --> Select[Select using validation]
    Select --> Freeze[Freeze selected settings and artifacts]
    Freeze --> Test[Score defined test populations]
    Freeze --> Repeat[Fixed-model seeds ablations and stresses]
    Test --> Evidence[Predictions metrics hashes and verification]
    Repeat --> Evidence
    Evidence --> Export[Export supported inference artifacts]
```

The operational catalog, 46-input paper surplus, NGO ranking, measured school waste and parcel time have separate contracts and result records. Public measured datasets do not automatically validate a synthetic model with a different target. The 46-input reused test is labeled previously viewed; the fresh seed and repeated simulations remain synthetic.

## Offline batch optimization

```mermaid
flowchart TB
    Batch[Known batch of confirmed offers] --> Options[Compatible NGO courier departure options]
    Options --> Learned[Predicted expected received kg]
    Learned --> Greedy[Shared-resource greedy controls]
    Learned --> MILP[Expected-receipt MILP]
    Capacities[Shared NGO kg and courier occupation constraints] --> Greedy
    Capacities --> MILP
    Greedy --> Replay[Replay simulated actual delays and receipts]
    MILP --> Replay
    Potential[Simulator potential outcomes] --> Hindsight[Separate hindsight optimizer and bound]
    Replay --> Compare[Received share violations and solver gaps]
    Hindsight --> Compare
```

An assignment chooses one whole offer, NGO, courier and departure alternative. Constraints enforce at most one action per offer, sum of full reserved offer kg within each NGO capacity, non-overlapping nominal courier occupation, compatibility and windows. Jobs return to a common donor hub. This is a small fixed-batch study with discrete departures, not continuous route optimization or online dispatch. The app's registry ranking does not call this optimizer.

## Changes needed for a persistent deployment

The following are requirements, not implemented components in the runtime diagrams:

1. Persistent account/food/availability/assignment/receipt tables and migrations.
2. Atomic kg and courier reservations, expiry/cancellation and idempotent lifecycle transitions.
3. An explicit provider-to-NGO offer/accept workflow before pickup is arranged.
4. Controlled administrator provisioning and stronger session/secret management.
5. Measured routes, timestamped actual outcomes and field evaluation under a frozen protocol.
6. Auditable measurement definitions for prepared, unserved, offered, reserved, picked-up and received mass.
