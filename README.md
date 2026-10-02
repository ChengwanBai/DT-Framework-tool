# Bioprocess Digital Twin Deployment Readiness Toolkit

A static, GitHub Pages-ready toolkit that applies the scoring and role-mapping rules of the TRL–DRL–α framework described in:

> Bai C, Gomes RL, Fisher OJ. *Digital Twins That Deliver: A Role-Based Deployment Readiness Framework for Biomanufacturing Systems.*

The toolkit reports the **role ceiling**: the highest operational role that the complete system can currently support within a defined system boundary and deployment context. Every unmet requirement is reported as a deployment constraint. The toolkit does not calculate a composite readiness score.

## Operational roles (Section 2.1, Figure 2)

- **R1: Offline analysis and open-loop decision support.** No live data or operational integration is required.
- **R2: Online monitoring, soft sensing and operator-mediated decision support.** Decision authority remains with the operator.
- **R3: Automated closed-loop optimisation or control.** Model outputs can directly influence process operation. Operator oversight, supervisory approval, intervention thresholds or fail-safe mechanisms may still be required.

## Assessment workflow (Section 4.1, Figure 6)

1. **Assessment specification (Section 3.1, Table 3).** Record the system boundary, deployment context, operating envelope, task and target role, model configuration, temporal requirements, and decision pathway and authority. The system boundary, operating envelope, task and target role are required.
2. **Component readiness.**
   - (a) Assign a TRL to the physical process configuration in the system boundary (Section 3.2).
   - (b) Assign the DRL band (Section 3.3, Table 4).
3. **Alignment scoring (Sections 3.4 and 4.2).** Score all eight α criteria with an integer from 1 to 5.
4. **Role test (Section 4.4, Table 5).** Test the target role first, then each lower role in turn, until every applicable threshold is met.
5. **Assessment output.** The toolkit reports:
   - the TRL–DRL–α profile and the role ceiling;
   - the limiting criteria and threshold margins;
   - the deployment constraints and candidate actions.
6. **Reassessment (Section 4.5).** Reassess only after a change has been implemented and tested. Compare results only when the specification is unchanged; otherwise the result is a new assessment.

## TRL (Section 3.2)

TRL is assigned to the physical process configuration defined in the system boundary. It reflects:

- what has been built and tested;
- the scale of operation;
- the equipment included;
- the conditions under which the process has been demonstrated.

TRL is reported in the profile but is not a Table 5 role threshold. A higher TRL does not imply greater data readiness.

## Data Readiness Level bands (Section 3.3, Table 4)

DRL is assigned hierarchically: Band A requires Bands B and C, and Band B requires Band C.

| Band | Focus | Assessed | Outcome |
| --- | --- | --- | --- |
| C | Can the data be obtained? | Data existence, access, format, ownership, and legal or ethical restrictions | The required data are available in a machine-readable form |
| B | Do the records represent the process? | Missing values, measurement errors, units, time stamps, provenance, integration and links to the relevant batch or operating phase | The quality and limitations of the records are known |
| A | Does the data support the stated task? | Required variables, sampling frequency, annotation, data volume and coverage of relevant operating conditions | The dataset is suitable for the stated modelling or decision task |

## Alignment criteria (Section 3.4)

| Dimension | Criterion |
| --- | --- |
| α<sub>TD</sub> Technology–data alignment | α<sub>TD1</sub> temporal alignment; α<sub>TD2</sub> feedstock alignment; α<sub>TD3</sub> spatial alignment |
| α<sub>DM</sub> Data–modelling alignment | α<sub>DM1</sub> representational alignment; α<sub>DM2</sub> granularity and synchronisation alignment; α<sub>DM3</sub> operating-condition coverage and structural alignment |
| α<sub>MT</sub> Modelling–technology alignment | α<sub>MT1</sub> decision-structure alignment; α<sub>MT2</sub> actuation-constraint alignment |

Meaning of the anchor scale (Section 4.4):

- **1:** major mismatch with the stated task and target role.
- **2:** partial alignment with known limitations.
- **3:** alignment adequate for the stated task under normal operating conditions.
- **4:** alignment maintained across the operating envelope, including foreseeable disturbances.
- **5:** consistent alignment across the operating envelope, update and decision intervals and level of decision authority.

The criterion-specific anchors follow Supplementary Table S1.

**Dimension means (Equation 1)** are the arithmetic means of *all* criteria in each dimension: three for α<sub>TD</sub>, three for α<sub>DM</sub> and two for α<sub>MT</sub>. They are descriptive only and never used as thresholds.

**Limiting criteria (Section 4.3).** Within each dimension, the lowest-scoring criterion required for the target role is the limiting criterion. Ties are reported together.

## Role-specific mapping (Section 4.4, Table 5)

The thresholds apply to individual criterion scores, not to the dimension means. They are non-compensatory: a high score in one criterion cannot offset a failed requirement elsewhere.

| Role | Minimum DRL | Role-specific requirements |
| --- | --- | --- |
| R1 | Band B | No fixed α threshold; demonstrated performance of the specified offline or open-loop task using the available data and model within the assessment boundary |
| R2 | Band B | α<sub>TD1</sub>, α<sub>DM1</sub>, α<sub>DM2</sub> and α<sub>MT1</sub> ≥ 3; α<sub>DM3</sub> ≥ 2; α<sub>MT2</sub> ≥ 2 where outputs include recommended actions |
| R3 | Band A | α<sub>TD1</sub>, α<sub>DM1</sub>, α<sub>DM2</sub>, α<sub>DM3</sub>, α<sub>MT1</sub> and α<sub>MT2</sub> ≥ 4 |

Some criteria enter the role test only under conditions:

- **α<sub>TD2</sub>** enters when feedstock or material variability can affect the task. Its minimum is 2 for R2 and 4 for R3.
- **α<sub>TD3</sub>** enters when spatial gradients, phase distribution, scale effects or differences between operating units can affect the task. Its minimum is 2 for R2 and 4 for R3.
- **α<sub>MT2</sub>** enters the R2 test only when R2 outputs include recommended operational actions. It is always required for R3.

Criteria that do not enter the role test are still scored and reported. If R1 is not supported, no role ceiling is assigned.

## Deployment constraints (Section 4.5)

Every unmet threshold of a tested role is reported as a deployment constraint, grouped by interface:

| Interface | Constraint focus | Responsible group (Section 6.2) |
| --- | --- | --- |
| DRL Band B | Data quality and representational faithfulness | – |
| DRL Band A | Task-specific preparation and suitability | – |
| α<sub>TD</sub> | Sensing and sampling | Instrumentation and laboratory practice |
| α<sub>DM</sub> | Model inputs, resolution and synchronisation, operating-range coverage | Data management and modelling |
| α<sub>MT</sub> | Operator interfaces, control actions and operating limits | Automation and operations |

Constraints are not ranked; their priority depends on:

- technical dependencies;
- cost and safety;
- implementation time and operational disruption;
- likely benefit.

The toolkit also reports **threshold margins** (Section 5.2):

- the criteria that meet the ceiling role's thresholds exactly;
- what the next higher role would require.

## Worked example (Section 5)

**Load AD reference scenario** pre-fills the full-scale anaerobic digestion reference scenario from Table 6. It reproduces the published result:

- TRL 9 and DRL Band B;
- α<sub>TD</sub> = 2.7, α<sub>DM</sub> = 2.7, α<sub>MT</sub> = 3.5;
- limiting criteria α<sub>TD2</sub>, α<sub>TD3</sub>, α<sub>DM3</sub> and α<sub>MT2</sub>;
- role ceiling R2 for target R3;
- five criteria at the R2 threshold;
- six criteria and Band A needed for R3.

## Run and test locally

No build or package installation is required. Open `index.html` directly in a browser.

```sh
node --test tests/frameworkEngine.test.js
```

## Files

- `scoringConfig.js`: specification elements, TRL scale, DRL bands, α criteria and anchors, Table 5 role requirements, constraint guidance and the Section 5 worked example
- `frameworkEngine.js`: role test, descriptive means, limiting criteria, threshold margins and deployment constraints
- `index.html`, `app.js` and `styles.css`: assessment interface and reporting
- `assets/`: logo, operational-role diagram (Figure 2) and assessment workflow (Figure 6)
- `tests/frameworkEngine.test.js`: Table 5 rules, conditional criteria, limiting criteria and the Section 5 reference scenario

## Disclaimer

This toolkit is a structured academic assessment aid. The Table 5 thresholds are proposed deployment rules that remain open to empirical calibration, and criterion scores depend on expert judgement. Site-specific validation, safety assessment and regulatory review are still required.
