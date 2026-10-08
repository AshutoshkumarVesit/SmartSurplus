# SmartSurplus: AI-Driven Food Surplus Prediction & Redistribution Documentation

> [!NOTE]
> This document provides a comprehensive analysis and detailed documentation of the SmartSurplus system based on the implemented FastAPI backend, Next.js frontend, machine learning services, and matching capabilities.

## 1. Proposed Design
The SmartSurplus platform is designed to seamlessly connect food providers (restaurants, cloud kitchens, hospitals, events) with nearby Non-Governmental Organizations (NGOs). Its primary objective is to predict food surplus using historical data and to dynamically assign the predicted surplus to the optimal NGO using an intelligent matching engine. 
The system operates on an architecture that consists of:
- **Provider Interface:** Allows food businesses to log daily prepared meals, specific items, batch sizes, and events.
- **NGO Interface:** Empowers NGOs to monitor available surplus food based on proximity and urgency.
- **Admin Dashboard:** Enables tracking of platform-wide statistics like total waste saved, successful deliveries, and prediction accuracies.
- **AI Core (Machine Learning):** Uses a `RandomForestRegressor` to estimate food surplus ratios based on item type, total quantity, and risk classification, delivering actionable recommendations such as batch reduction.
- **Dynamic Matching Engine:** Recommends the optimal NGO match using distance (Haversine formula), perishability, available capacity, and expiration constraints.

---

## 2. Block Diagram Representation

### Description
The block diagram highlights the key functional blocks of the SmartSurplus application and the interaction between the food producers, the central processing unit (AI algorithms), and the food distributors.
1. **Input Data Block:** Handles inputs from providers (preparation data, events) and NGOs (capacities, locations).
2. **AI & ML Engine:** Runs the prediction algorithm (RandomForest) to classify surplus food risk.
3. **Distribution & Matching Engine:** Sorts and allocates surplus food based on proximity and urgency.
4. **Database Block:** Stores structured data handling users, food data, predictions, and match logs.

### Diagram Prompt
**Prompt for Gemini Nano Banana:**
> "Generate a professional block diagram for a food surplus prediction system. The diagram should include three main columns. Left column: 'Data Sources' containing 'Food Providers (Restaurants/Caterers)' and 'NGOs/Food Banks'. Middle column: 'SmartSurplus Core' containing 'FastAPI Services', 'ML Prediction Engine (Random Forest)', 'Matching Engine', and 'In-memory Database'. Right column: 'Outputs' containing 'Admin Analytics', 'Surplus Risk Alerts', and 'Delivery Routes'. Connect 'Data Sources' to 'SmartSurplus Core', and 'SmartSurplus Core' to 'Outputs' with appropriate directional arrows to show data flow."

---

## 3. Modular Diagram Representation

### Description
The system is divided into logically distinct modules allowing separation of concerns in the codebase:
- **Authentication & User Management Module:** Registers Providers, NGOs, and Admins (`auth_routes.py`).
- **Prediction Module:** Featurizes data and trains/predicts using `RandomForestRegressor` (`prediction_service.py`).
- **Matching Module:** Calculates geo-distances, perishability urgency, and candidate scoring to generate top routes (`matching_service.py`).
- **Analytics & Admin Module:** Aggregates delivery data, tracks waste saved, and computes prediction accuracy metrics (`analytics_service.py`, `admin_routes.py`).

### Diagram Prompt
**Prompt for Gemini Nano Banana:**
> "Generate a modular architecture visualization for the SmartSurplus backend. Display a central 'API Gateway' connected to the following distinct functional modules: 'Auth Module', 'Provider Module', 'NGO Module', 'Prediction Module', 'Matching Module', and 'Analytics Module'. Add brief sub-items under 'Prediction Module' (Random Forest, Feature Extraction) and 'Matching Module' (Haversine Distance, Priority Scoring). Ensure the design is modern, tech-oriented, and clearly indicates how these modules interact."

---

## 4. Design of the Proposed System

### A. Data Flow Diagram (DFD)
**Explanation:** Identifies how data streams move from the UI (Providers entering food logs), handled by the backend routing into ML processing, generating predictions, distributing alerts to matching services, pushing to NGOs, then finally logging metrics for the Admin.

**Prompt for Gemini Nano Banana:**
> "Create a Level 1 Data Flow Diagram (DFD) for a food surplus redistribution app. Show 'Provider' sending 'Food Preparation Data' to 'Log Manager'. From 'Log Manager', data goes to 'Prediction Engine', which sends 'Surplus Prediction Data' to 'Matching Engine'. Also show 'NGO' sending 'Location & Capacity Data' to the 'Matching Engine'. The 'Matching Engine' sends 'Allocation Alert' back to the 'NGO'. Include a 'Database' entity to which all processes read/write."

### B. Use Case Diagram
**Explanation:** Details the actors and their specific capabilities. Providers log food and view surplus risks. NGOs view assigned matches and update delivery statuses (pending, accepted, picked_up, delivered). Admins monitor the entire ecosystem.

**Prompt for Gemini Nano Banana:**
> "Draw a UML Use Case Diagram for the SmartSurplus system with three actors: 'Provider', 'NGO', and 'Admin'. Show 'Provider' associated with use cases: 'Log Food Data', 'View Predictions', and 'Review Recommendations'. Show 'NGO' associated with 'View Matched Surplus', 'Accept/Decline Matches', and 'Update Delivery Status'. Show 'Admin' associated with 'View Total Waste Saved', 'Monitor Prediction Accuracy', and 'Manage Users'."

### C. Flowchart
**Explanation:** Displays the step-by-step logic triggered when a provider enters daily food preparations. The flow diverges based on predicted surplus risk (Low vs. High risk) and whether matches are successfully distributed.

**Prompt for Gemini Nano Banana:**
> "Generate a flowchart detailing the SmartSurplus lifecycle. Start -> 'Provider logs food' -> 'ML model predicts surplus' -> Decision block: 'Is Surplus Risk High?' If No -> 'End/Log as optimal'. If Yes -> 'Calculate NGO Distances & Urgency' -> 'Generate Top 3 Matches' -> 'NGO accepts request?' If No -> 'Offer to next NGO'. If Yes -> 'Update status to En Route' -> 'Delivery Confirmed' -> 'Log waste saved' -> End."

### D. System State Transition / Activity Diagram
**Explanation:** Showcases the lifecycle of a single "Match Object", starting from `pending` -> `accepted` -> `picked_up` -> `delivered`. It transitions states based on operations taken by the assigned NGO.

**Prompt for Gemini Nano Banana:**
> "Create an Activity Diagram or State Transition Diagram mimicking a package delivery system, specifically for a 'Food Match' object. States: 'Pending', 'Accepted', 'Picked Up', and 'Delivered'. Show transitions based on NGO interactions, starting from the 'Pending' creation triggered by the Matching Engine, all the way to 'Delivered', which updates system-wide analytics."

### E. Entity-Relationship (ER) Diagram
**Explanation:** Outlines the core data structures utilized: Users (sub-classed as Admin/Provider/NGO), FoodData, Predictions, and Matches. Demonstrates foreign keys like `provider_id` tying food to specific users.

**Prompt for Gemini Nano Banana:**
> "Design an ER Diagram for the SmartSurplus database. Include four tables: 1. 'Users' (id, role, name, location [lat/long], capacity). 2. 'Food_Data' (id, provider_id, food_type, quantity_kg, expiry_hours). 3. 'Predictions' (id, food_id, provider_id, predicted_surplus, waste_risk). 4. 'Matches' (id, prediction_id, ngo_id, distance_km, status). Map relationships: Users(Provider) 1-to-M Food_Data. Food_Data 1-to-1 Predictions. Predictions 1-to-M Matches. Users(NGO) 1-to-M Matches."

---

## 5. Algorithms Utilized in Existing System

1. **Surplus Prediction Algorithm (Machine Learning):**
   - **Algorithm:** `RandomForestRegressor` from `scikit-learn` package.
   - **Explanation:** Uses ensemble learning (multiple decision trees) acting over extracted numerical features to guess the amount of continuous surplus `kg` expected. A confidence score and risk profile (high/medium/low) are generated from the ratio of surplus to initial preparation quantity. 

2. **Priority Match Scoring Engine:**
   - **Algorithm:** Weighted priority heuristic combined with Haversine spherical distance calculation.
   - **Explanation:** 
     - **Distance:** Computes geometric surface distance between Provider coordinates and NGO coordinates.
     - **Urgency Formula:** Maps expiry hours inversely against a 0-10 scale (where items close to expiry get up to 10), factoring a 1.3 multiplier to `is_perishable`. 
     - **Constraint Enforcement:** Penalizes match probabilities by 50% if the NGO's current active jobs exceed their listed static capacity limits.
     - **Priority Score:** calculated via `(urgency * quantity) / max(distance, 0.1)`. 

---

## 6. Project Scheduling & Tracking

### Explanation
To manage development, tasks are typically grouped into setup, backend modeling, frontend development, integration, and testing phases.

**Prompt for Gemini Nano Banana:**
> "Generate a visual Timeline or Gantt Chart indicating the project schedule for 'SmartSurplus Platform'. Break it down by weeks over a 6-week timeframe: Week 1: 'System Design & Database Schema'. Week 2: 'Core Backend & Fast API Setup'. Week 3: 'Machine Learning Model Training & Optimization'. Week 4: 'Frontend Next.js Development & UI Integration'. Week 5: 'Matching logic and Map plotting Integration'. Week 6: 'System Testing, Analytics Dashboard, and Final Bug Fixes'."

---

## 7. Implementation Results and Discussions
Using the central `analytics_service.py` functions based on the mocked demo constraints:
- **Accuracy Measurements:** The system dynamically captures accuracy metrics by checking the calculated surplus delta vs expected deltas (`1 - abs(predicted - actual * 0.3) / actual`). Typical simulations average a confidence variance of 70% to 95%.
- **Deliverables:** Translates complex JSON configurations connecting backend maps to frontend components into localized distance approximations. Shows substantial efficiency when NGOs are clustered closely to the Cloud Kitchens / Event Halls generating high metrics in the `total_waste_saved_kg` property.
- **Recommendations Generation:** Automatically generates contextual English recommendations guiding providers (e.g., "Reduce preparation of Dal by 30%").

---

## 8. Data Collection / Acquisition
- **Format:** In the current demo state, historical preparation logs operate entirely in memory (`database.py` seed function), synthesizing up to 250 realistic logs. 
- **Features Handled:** Captures the `food_type`, absolute preparations in `quantity_kg`, timestamps indicating `prepared_at`, hours till expiration, and specific meta-tags like `event_type` constraints. Event types commonly correlate to higher variance in surplus (like weddings or conferences).

---

## 9. Data Preprocessing Techniques
In order to pass raw provider logs to the Scikit-learn regressors:
- **Categorical Encoding:** Employs static dictionary lookups, directly mapping categories into numerical representations (e.g. `{"rice": 0, "dal": 1, ... "dosa": 14}`).
- **Time/Binary Mapping:** Meals are given scalar weights (`breakfast: 0, lunch: 1`). Perishability flags shift boolean variables to `0` or `1`.
- **Target Value Computation:** Because historical targets for surplus might be unknown organically, the system infers a surrogate target relying on past ratios (approx 15% - 55% variable offsets) during training.

---

## 10. Experimental Setup
- **Backend:** Python Fast API running on a standardized single thread setup. Data operates persistently inside instantiated memory logic (`InMemoryDB`).
- **Machine Learning Tooling:** `numpy` arrays driving `scikit-learn` algorithms (RandomForest parameterizations utilizing 50 estimators capped at 8 depth layers).
- **Frontend Visualization:** Developed entirely with Next.js + React. Uses styling through Tailwind CSS frameworks connecting directly to CORS unified backend ports.

---

## 11. Evaluation Metrics
The system benchmarks its effectiveness using an aggregated matrix inside the admin dashboard:
- **`total_waste_saved_kg`:** Total summation of quantities routed through 'delivered' Match states.
- **`avg_prediction_accuracy`:** Evaluates the fitness of the estimator’s output vs the final delta consumed.
- **Urgency Optimization Index:** The ratio proving matched items have shorter distance thresholds favoring higher perishability vectors.
- **Provider Analytics:** The platform identifies providers consistently hitting 'High Risk' profiles.

---

## 12. Gap Analysis of Existing Systems
**Traditional Methods vs SmartSurplus**
- **Existing Systems Check:** General food banks act reactively. They await phone calls or direct portal uploads indicating surplus *after* the event finishes, often losing valuable time impacting perishable items.
- **Gaps Identified:** Lack of proactive prediction tools and absence of automated location-based logistics.
- **SmartSurplus Bridging:** Uses historical tracking to proactively warn providers during *preparation* phases about potential excess. It entirely automates the logistical mapping problem via the Match Engine score rather than relying on manual NGO intervention, closing the timeframe loop substantially.
