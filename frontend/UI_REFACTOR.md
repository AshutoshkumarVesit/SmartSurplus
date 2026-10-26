# UI refactor — 26 October 2026

The interface now uses one cream/forest-green design system across the landing page, authentication, dashboards, research views and network map. A shared application shell replaces duplicated sidebars and fixed page offsets. The mobile drawer supports Escape, focus trapping and inert hidden navigation.

The provider overview includes data-driven summaries, charts, recent estimates and clear empty/error states. The NGO workspace separates pending offers from collection history and asks for actual received kilograms before delivery confirmation. Admin tables keep role filters and horizontal scrolling on small screens. Research descriptions and limitations are retained.

The map now uses OpenStreetMap tiles because the previous CARTO URL returned an API-key placeholder. Layer updates wait for asynchronous map initialization, fixing missing markers on first load. Partner text is escaped before insertion into Leaflet popups. Local fonts and SVG icons avoid external font/icon requests.

The frontend is stored as regular source files in the repository, replacing an embedded Git pointer that did not contain the application code. Runtime secrets, dependency directories, generated output, research datasets and unrelated backend changes are excluded.

## Verification

- Next.js production build, including its lint/type checks.
- Standalone `npm run typecheck`.
- Browser review of desktop and narrow mobile layouts.
- Seeded provider, NGO and administrator sign-in; incorrect-password feedback remains inline.
- Provider food form submission generated a 2.475 kg experimental estimate for a 12 kg demo preparation record and displayed it on the predictions screen. This is a functional check, not a model evaluation.
- NGO empty state and client redirect when an NGO visits a provider-only route.
- Admin role filtering showed 10 NGO records from the 26 seeded accounts.
- Mobile drawer opened and closed with Escape; a narrow admin table remained within a scrollable container.
- Map loaded 25 partner markers and 12 tiles. Hiding providers reduced marker count to 10.
- Research metadata/comparison screens and example loading were inspected; research inference could not be fully verified because of the backend issue below.

## Remaining backend limitation

The active local environment uses scikit-learn 1.9.0, while saved research estimators were exported with 1.5.2. Measured-waste loading failed on `_RemainderColsList`; NGO ranking inference failed on `SimpleImputer._fill_dtype`. The UI exposes the failed request. Repairing or re-exporting those model artifacts belongs to the backend/research work and is not included in this UI commit.

The original GitHub backend does not expose the newer research routes. Basic food entry falls back when `/model-info` is absent; research workspaces explain an unavailable module. Delivery write actions could not be exercised against the current local seed because it has no NGO matches.
