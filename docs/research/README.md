# Research evidence index

These compact files were copied from the existing local experiment records for the project README. **No models were retrained, test populations regenerated or reported metrics changed for this documentation task.** The files identify which experiment each claim belongs to; they are not a substitute for a full training-data/code release.

## Inventory and feature definitions

- [dataset_index.csv](dataset_index.csv): existing research CSV export inventory, sizes, provenance, source and export SHA-256 values.
- [column_dictionary.csv](column_dictionary.csv): column definitions, predictor roles, types and missing counts for the research CSV exports.
- [ngo_feature_schema.json](ngo_feature_schema.json): frozen 28-feature numeric matching contract and two targets.
- [source_manifest.json](source_manifest.json): original local paths, copy hashes and the transformation used for the operational summary.

The inventory's `train_rows`/`split` information can describe inherited generator labels rather than experiment usage for a fresh-population file. Specifically, **all 10,000 rows of the fresh NGO export are a fresh evaluation population**, even though its generator labels/index retain a training partition. Do not use that inherited label to add fresh evaluation observations to training.

The inventory covers the smaller research exports. The operational catalog corpus is separate and contains 12,356,298 item-day rows; it is not included in that CSV ZIP.

## Operational catalog model

- [operational_catalog_summary.json](operational_catalog_summary.json): selected fields from the existing operational LightGBM metrics and full-data RF comparison. Includes 20 input names, periods, row counts, complete test metrics, missing-history results, empirical interval coverage and risk-category agreement.

This summary is a **derived documentation record**, not a serving manifest. Its two source-file hashes are in `source_manifest.json`. The target is the catalog's post-reuse/pre-disposal `surplus_kg`. Its training environment differs from the pinned joblib research environment; the serving LightGBM artifact uses native text format.

The RF comparison followed the original LightGBM evaluation and does not constitute a new untouched model-selection study. Test MAE, interval coverage and risk-category agreement are different quantities; none is a general percentage accuracy.

## Paper surplus experiment

- [surplus_selection.json](surplus_selection.json): validation-selected model settings, original-test reuse status and frozen choice information.
- [surplus_comparison.csv](surplus_comparison.csv): metrics on the reused test and separate fresh seed 88421.

Target: synthetic unserved surplus kg per item-service. Forty-six predictors. This is not the operational 20-input catalog model. IDs, current outcomes and downstream matching labels are not model features.

## NGO candidate ranking

- [ngo_selection.json](ngo_selection.json): frozen validation choices.
- [ngo_policy_comparison.csv](ngo_policy_comparison.csv): chronological and fresh-population received-share results, unmatched offers and modeled constraint violations.

Target: synthetic received fraction and actual elapsed minutes for one offer/candidate alternative. The unfiltered-nearest row is a deliberately invalid diagnostic; it is not a deployable policy. Snapshot evaluation has no shared-resource reservations. The platform adapter adds a learned-ETA exclusion beyond the generic research route's warning; do not assume those two serving contexts have identical final eligibility.

## Measured benchmarks

- [measured_waste_protocol.json](measured_waste_protocol.json): frozen Finnish school forecasting protocol.
- [measured_waste_comparison.csv](measured_waste_comparison.csv): 30-day overall and baseline/intervention segment results.
- [parcel_eta_comparison.csv](parcel_eta_comparison.csv): separate real parcel completion-time benchmark.

Measured school KSW combines kitchen and serving waste; it is not a pure unserved donation label. Parcel acceptance-to-completion includes queue/batch time; it is not food-delivery validation. Neither record validates safe redistribution in the field.

## Repeated simulation and batch study

- [validation_overview.json](validation_overview.json): totals, frozen-protocol identifier and paired effects.
- [seed_summaries.csv](seed_summaries.csv): means and descriptive seed-bootstrap intervals by scenario/method.
- [paired_comparisons.csv](paired_comparisons.csv): paired policy/model effects with direction, unit and intervals.

The original study scored 198,000 surplus rows, 24,000 NGO offers and 120 batch cases. Full models stayed fixed; feature controls were fitted on original training data. Intervals describe simulator-seed variability, not uncertainty across real kitchens. Some surplus stresses have only three seeds. Batch optimization is offline research with reported solver gaps, not deployed dispatch.

## Attribution and reproduction

The local source metadata attributes the Finnish measurements to Arja Kuusisto, Jenni Latva and Ella Wilén, DOI [10.5281/zenodo.20825233](https://doi.org/10.5281/zenodo.20825233), CC BY 4.0. The parcel source is [Cainiao-AI LaDe-D](https://huggingface.co/datasets/Cainiao-AI/LaDe-D); retain applicable source attribution and terms for any raw-data release.

To reproduce training, obtain the original research workspace, source data, generator code, frozen protocols and appropriate environment. These small evidence copies alone support inspection of reported values, not full end-to-end retraining. For app behavior, inspect the current source and serving artifacts; the documentation copies do not modify them.
