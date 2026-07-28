# Bioprocess Digital Twin Deployment Readiness Toolkit

A static, GitHub Pages-ready tool for operationalising the TRL–DRL–α framework for a specified bioprocess system and digital twin task.

The tool reports the highest functional role supported at or below a stated target role. It does not calculate a composite readiness score.

## Assessment workflow
 
The evaluator:

1. defines the required operational task and target role; system boundary and operating envelope are recommended, while deployment setting, model configuration, and update/decision interval are optional;
2. assigns the integrated bioprocess digital twin's TRL;
3. selects the highest cumulative Data Readiness Band fully achieved;
4. records whether α<sub>TD2</sub>, α<sub>TD3</sub>, and α<sub>MT</sub> are applicable to the role mapping;
5. scores all eight α criteria from 1–5; and
6. reviews diagnostic means, role-mapping means, limiting criteria, unmet requirements, and candidate improvement actions.

## Cumulative Data Readiness Bands

- Band C establishes data existence, accessibility, machine readability, and basic governance clearance. It does not support assignment of a role ceiling.
- Band B includes every Band C requirement and adds demonstrated data quality, consistency, traceability, continuity, and representativeness. It is the minimum for R1 and R2.
- Band A includes every Band B and Band C requirement and adds contextual relevance, sufficient coverage and temporal depth, and fitness for the specified task and operating envelope. It is the minimum for R3.

## Alignment notation and criteria

The interface uses α with the interface identifier as a subscript:

- α<sub>TD1</sub>: temporal alignment
- α<sub>TD2</sub>: feedstock-variability alignment
- α<sub>TD3</sub>: spatial and operational alignment
- α<sub>DM1</sub>: measurement–model correspondence
- α<sub>DM2</sub>: granularity and synchronisation
- α<sub>DM3</sub>: operating-domain and data-structure coverage
- α<sub>MT1</sub>: decision integration
- α<sub>MT2</sub>: action and constraint compatibility

Complete diagnostic means are always reported for α<sub>TD</sub>, α<sub>DM</sub>, and α<sub>MT</sub>. Separate role-mapping means are calculated only from criteria applicable to the assessed role and task.

## Role mapping

### R1: Offline analysis and open-loop decision support

- minimum Band B; and
- demonstrated performance of the specified offline or open-loop task within the assessment boundary.

No fixed α threshold is applied.

### R2: Online monitoring and operator-supervised support

- minimum Band B;
- mean of applicable α<sub>TD</sub> criteria ≥ 3;
- mean of α<sub>DM1</sub>–α<sub>DM3</sub> ≥ 3; and
- every applicable criterion ≥ 2.

α<sub>TD1</sub> is always used. α<sub>TD2</sub> is included when feedstock or material variability can affect the task, and α<sub>TD3</sub> is included when spatial, phase, scale, or unit differences can affect the task.

When model outputs guide process operation, the mean of α<sub>MT1</sub>–α<sub>MT2</sub> must also be ≥ 3 and both criteria must be ≥ 2. Otherwise α<sub>MT</sub> remains diagnostic for R2.

### R3: Automated closed-loop optimisation or control

- minimum Band A; and
- every applicable criterion ≥ 4.

α<sub>TD1</sub>, α<sub>DM1</sub>–α<sub>DM3</sub>, and α<sub>MT1</sub>–α<sub>MT2</sub> are always applicable. α<sub>TD2</sub> and α<sub>TD3</sub> are added under their respective applicability conditions.

Assessment begins with the selected target role. If it is not supported, lower roles are tested in descending order. If R1 is not supported, no role ceiling is assigned.

## TRL interpretation

TRL 4–9 descriptions are specific to an integrated bioprocess digital twin: sensing, data pipeline, model, operational interface, update cycle, users, and constraints are considered together. TRL records the maturity, assessed scale, and operating conditions; it does not independently raise or lower the functional role in this procedure.

## Run and test locally

No build or package installation is required. Open `index.html` directly in a browser.

```sh
node --test tests/frameworkEngine.test.js
```

## Files

- `scoringConfig.js`: bioprocess-specific TRL definitions, cumulative data bands, α anchors, and role requirements
- `frameworkEngine.js`: applicable-criteria, role-mapping mean, diagnostic, and role-ceiling logic
- `index.html`, `app.js`, and `styles.css`: assessment interface and reporting
- `tests/frameworkEngine.test.js`: boundary, mean, criterion-floor, and conditional-applicability tests
- `archive/`: earlier method documents retained for reference but not used as the toolkit's current method basis

## Disclaimer

This toolkit is a structured academic assessment aid. It requires expert judgement, evidence within a clearly stated boundary, site-specific validation, safety assessment, and regulatory review.
