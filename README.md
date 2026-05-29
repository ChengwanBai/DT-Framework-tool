# Bioprocess Digital Twin Deployment Readiness Toolkit

A GitHub Pages-ready static web toolkit for assessing digital twin deployment readiness in bioprocesses using a TRL-DRL-α framework.

The toolkit estimates the most defensible current digital twin role ceiling. It does not calculate a generic average readiness score.

## What the Toolkit Does

Evaluators select:

- Technology Readiness Level (TRL)
- Data Readiness Level (DRL)
- αTD, αDM, and αMT sub-criterion ratings

The page then reports:

- selected TRL and description
- selected DRL, band, and description
- αTD, αDM, and αMT average scores
- sub-criterion breakdown
- limiting dimensions
- weak sub-criteria
- confidence level
- final digital twin role ceiling
- concise explanation suitable for academic review notes

## Framework Logic

The role ceiling is α-driven, TRL-constrained, and DRL-qualified.

- TRL describes technology maturity and the feasible deployment boundary.
- DRL describes data maturity and the confidence of the role assignment.
- α describes alignment among technology, data, model, and operational task.
- The final role ceiling is not a simple average of TRL, DRL, and α.

A high-TRL system can still be capped at R1 or R2 if alignment is weak. A low-TRL system with promising alignment should be interpreted as future potential, not as a currently defensible operational deployment.

## Readiness Dimensions

### TRL

TRL uses a 1-9 scale. The definitions in `scoringConfig.js` are based on the European Commission / EIC TRL definitions and cross-checked against NASA's official TRL overview.

Primary source notes:

- European Commission / EIC: <https://eic.ec.europa.eu/programme-finder-13_en>
- NASA: <https://www.nasa.gov/directorates/somd/space-communications-navigation-program/technology-readiness-levels/>

### DRL

DRL uses the uploaded DRL scoring standard only. The uploaded file defines Bands C, B, and A:

- Band C: accessibility-oriented readiness
- Band B: data quality-oriented readiness
- Band A: task-fitness readiness

### αTD, αDM, and αMT

The α scoring criteria use the uploaded α scoring standard only.

- αTD: Technology-Data alignment
- αDM: Data-Model alignment
- αMT: Model-Task alignment

Each α dimension is calculated as the arithmetic mean of its selected sub-criterion scores and rounded to two decimal places.

The uploaded α file defines 1-5 scoring anchors but does not define explicit weak/moderate/strong role thresholds. The editable defaults in `scoringConfig.js` are:

- score below 2.5: weak alignment
- score from 2.5 to below 3.25: moderate alignment
- score 3.25 or above: strong alignment

These thresholds are visible in the UI as a configuration warning and should be updated if the formal framework specifies different 1-5 thresholds.

## Digital Twin Role Ceilings

### R1: Offline / open-loop analysis

The digital twin is mainly suitable for retrospective interpretation, offline scenario analysis, design-space exploration, model-based understanding, or non-operational decision support.

### R2: Online monitoring and soft sensing

The digital twin is suitable for routine online monitoring, state estimation, near-real-time interpretation, or soft-sensor support, but not necessarily for autonomous intervention or closed-loop control.

### R3: Advisory or closed-loop use

The digital twin is sufficiently aligned with operational tasks to support bounded advisory recommendations, optimisation, or closed-loop intervention within a validated operating envelope and under appropriate governance and safety constraints.

## Run Locally

No build step is required.

Open `index.html` directly in a browser:

```text
index.html
```

The toolkit has no backend, database, login system, external API dependency, or paid-service dependency.

## Deploy on GitHub Pages

1. Push the files to a GitHub repository.
2. Open repository Settings.
3. Go to Pages.
4. Select the branch and root folder that contain `index.html`.
5. Save the Pages configuration.

GitHub Pages will serve the static site directly.

## Edit Scoring Standards

All framework content and role-ceiling rules are in `scoringConfig.js`.

Update this file to:

- revise TRL definitions or source notes
- update DRL levels, bands, labels, or descriptions
- edit α sub-criteria and rating anchors
- adjust α thresholds
- change critical criteria for R2 or R3
- revise TRL deployment boundaries
- revise DRL confidence rules

Do not edit academic scoring standards inside `app.js`. That file should remain focused on rendering, calculation, and user controls.

## Example Cases

### Example 1: Conventional anaerobic digestion

- TRL: 9
- DRL: 7
- αTD: 2.67
- αDM: 2.67
- αMT: 3.50
- Expected interpretation: R2 with bounded advisory potential.
- Main limiting dimensions: αTD and αDM, especially feedstock variability, spatial representativeness, domain consistency, and data-model coverage.

Although the underlying anaerobic digestion technology is mature and data readiness is relatively strong, limitations in technology-data and data-model alignment constrain robust R3 deployment.

### Example 2: H2AD / emerging wastewater biotechnology

- TRL: 6
- DRL: 5
- αTD: 2.67
- αDM: 2.33
- αMT: 3.00
- Expected interpretation: R1 with early R2 potential.
- Main limiting dimensions: TRL, DRL, and αDM.

The technology is demonstrated but not yet mature enough for confident operational digital twin deployment. Data and model alignment are not yet sufficient for routine online monitoring or robust soft sensing.

## Files

- `index.html`: semantic page structure
- `styles.css`: responsive academic visual design
- `app.js`: rendering, calculation, reset, copy, and JSON export logic
- `scoringConfig.js`: scoring standards and editable role-ceiling rules
- `README.md`: project documentation

## Disclaimer

This toolkit is a structured academic assessment aid. It does not replace expert engineering judgement, site-specific validation, safety assessment, or regulatory review.
