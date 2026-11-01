# Real browser demonstration captures

All JPEGs in this directory were captured on **1 November 2026** using **ChatGPT's built-in browser**, from the actual local Next.js application at `http://127.0.0.1:3000` backed by FastAPI at port 8000. They are not generated mockups or screenshots of a reconstructed interface. Images preserve browser-rendered app content; no result values or DOM content were changed for capture.

## Version and data context

The running source is the full local capstone workspace, which has additional operational surplus/receipt changes compared with the previously published GitHub commit `a36deab`. The [root README](../../README.md#project-status-and-version-scope) explains this boundary. Capturing a feature does not publish its code to another checkout.

The backend started with seeded provider/NGO accounts, 250 food records, zero predictions and zero matches. Demo account names/coordinates and reported NGO kg are fixtures, not verified partner data. During capture, one illustrative preparation record was saved through the UI and one actual prediction was generated. Recommendations and research forecasts did not create deliveries or reserve capacity. The NGO/admin views correctly retain zero assigned/completed matches.

Browser layout followed the app panel's normal viewport. Some captures are wider desktop views; later captures show the app's responsive compact layout as the available panel changed. No fixed viewport override was used. Full-page images preserve long forms and result tables; smaller captures focus on a visible result.

## Capture index

| Image | Route | What it verifies |
|---|---|---|
| [01-homepage.jpg](01-homepage.jpg) | `/` | Actual landing page and project introduction |
| [02-login.jpg](02-login.jpg) | `/login` | Account entry and role-based demo credential controls |
| [03-food-preparation.jpg](03-food-preparation.jpg) | `/dashboard/provider/upload` | Trained catalog item selection, kg inputs and optional history form |
| [04-surplus-prediction.jpg](04-surplus-prediction.jpg) | `/dashboard/provider/predictions` | Saved-model inference for the entered rice scenario |
| [05-provider-overview.jpg](05-provider-overview.jpg) | `/dashboard/provider` | One saved estimate reflected in the provider workspace |
| [06-ngo-matching-full.jpg](06-ngo-matching-full.jpg) | `/dashboard/provider/matching` | Complete confirmed-offer form, registered directory and ranked result |
| [07-ngo-recommendation.jpg](07-ngo-recommendation.jpg) | Same matching route | Focused recommended-recipient card and estimated quantities |
| [08-measured-waste-research.jpg](08-measured-waste-research.jpg) | `/dashboard/provider/research` | Published test table, history inputs and source-school forecast replay |
| [09-matching-research-lab.jpg](09-matching-research-lab.jpg) | `/dashboard/provider/matching/research` | Frozen synthetic example, policy comparison, selected option and exclusions |
| [10-network-map.jpg](10-network-map.jpg) | `/map` | Actual map tiles and 15 provider / 10 NGO fixture locations |
| [11-ngo-overview.jpg](11-ngo-overview.jpg) | `/dashboard/ngo` | Genuine empty assigned-match state after proposal-only ranking |
| [12-ngo-availability.jpg](12-ngo-availability.jpg) | `/dashboard/ngo/availability` | Explicit kg, receiving hours and category/storage controls, labeled demo availability |
| [13-admin-overview.jpg](13-admin-overview.jpg) | `/dashboard/admin` | 251 food records, one prediction, zero deliveries and labeled offline synthetic MAE |

## Exact demonstration inputs and outputs

### Operational surplus

Logged in using the Provider demo control (`tajhotel`). Selected Steamed Rice, kept Mumbai/Restaurant/Business District, and entered 30 kg prepared, zero carry-in and a six-hour pickup window. Date: 1 November 2026.

Illustrative history inputs: expected demand 24 kg; prior 7-day average 23 kg; prior 28-day average 22 kg; previous-day sales 24 kg; sales seven days ago 23 kg; prior 7-day surplus ratio 0.20; prior 28-day surplus ratio 0.22. These numbers are a demonstration scenario, not field measurements.

The actual running model returned 7.886 kg surplus, medium risk and a displayed 5.17–10.60 kg interval. The interval comes from absolute errors on synthetic validation data. It is not a verified field confidence claim. A future model/contract change may produce a different result.

### Registered NGO recommendation

Entered a separate offer named `Demo rice donation`, 10 confirmed kg, grain, vegetarian, ambient storage and a 120-minute delivery deadline. Kept the form's default provider-arranged transport assumptions, explicitly selected the quality/quantity confirmation and clicked Find best NGO. No catalog prediction was automatically treated as confirmed donation.

The result had nine eligible NGOs out of ten and proposed Meals on Wheels India, approximately 25 minutes, 2.6 estimated road km, 45 kg reported demo capacity and 8.51 kg estimated receipt. Partner identity and capacity are seeded fixtures. No NGO was contacted and no actual receipt occurred. The response reserves no resources.

### Measured school replay

Loaded the real source example for 3 March 2025 with its 20 prior observations and menu code 1. The actual LightGBM research request returned 4.340 kg/day combined kitchen + serving waste, compared with the preserved observation of 2.050 kg and displayed absolute error 2.290 kg. This is one replay of an existing test date, not a newly collected test or pure unserved-food prediction.

### Synthetic matching lab

Loaded the preserved first example, offer `FRESH-O00000`, 6.362 confirmed kg. The actual LightGBM proposal selected candidate `FRESH-O00000-C8` / NGO `FRESH-N036` / courier `FRESH-C060`, with estimated receipt 5.766 kg and elapsed time about 30.9 minutes. Two options were excluded for storage incompatibility. These are synthetic research identifiers, separate from registered platform NGO identities.

## Repeating the demo

Start both local servers using the root README. Use the three public demo-role controls, then repeat the steps above. Refresh NGO availability if more than two hours have elapsed since backend startup. Registry recommendation winners depend on current reports and inputs; do not alter gates to force a selected NGO.

To refresh this documentation, capture the actual running pages through the browser after the UI has loaded. Record version, date, fixture status and inputs, preserve map attribution, avoid capturing credentials/tokens/private account data, and regenerate image hashes in the capture manifest. Keep correct empty operational states instead of fabricating deliveries to fill a dashboard.

Image dimensions and SHA-256 hashes are recorded in [capture_manifest.json](capture_manifest.json).
