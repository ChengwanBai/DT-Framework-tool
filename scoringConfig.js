const scoringConfig = {
  metadata: {
    toolkitName: "Bioprocess Digital Twin Deployment Readiness Toolkit",
    frameworkName: "TRL-DRL-α Digital Twin Deployment Framework",
    version: "1.0.0",
    lastUpdated: "2026-05-29"
  },

  warnings: [
    "TODO: Confirm α role thresholds. The uploaded α scoring standard defines 1-5 anchor scores but does not define explicit role-thresholds. This toolkit uses editable default thresholds in scoringConfig.js and surfaces this warning for transparency."
  ],

  trl: {
    sourceNote:
      "TRL labels are based on the European Commission / EIC 1-9 TRL definitions, cross-checked against NASA's official TRL overview.",
    sourceUrls: [
      "https://eic.ec.europa.eu/programme-finder-13_en",
      "https://www.nasa.gov/directorates/somd/space-communications-navigation-program/technology-readiness-levels/"
    ],
    levels: {
      1: {
        label: "Basic principles observed",
        description:
          "Basic scientific principles have been observed. Work remains at an initial research stage."
      },
      2: {
        label: "Technology concept formulated",
        description:
          "A technology concept or practical application has been formulated, but experimental proof remains limited."
      },
      3: {
        label: "Experimental proof of concept",
        description:
          "Analytical or experimental proof-of-concept work has begun to demonstrate feasibility."
      },
      4: {
        label: "Technology validated in lab",
        description:
          "Components or processes have been validated in a laboratory environment."
      },
      5: {
        label: "Technology validated in relevant environment",
        description:
          "The technology has been validated in a relevant environment that approximates intended use."
      },
      6: {
        label: "Technology demonstrated in relevant environment",
        description:
          "A prototype or representative model has been demonstrated in a relevant environment."
      },
      7: {
        label: "System prototype demonstration in operational environment",
        description:
          "A system prototype has been demonstrated in an operational environment."
      },
      8: {
        label: "System complete and qualified",
        description:
          "The system is complete, qualified, and ready for operational deployment under defined conditions."
      },
      9: {
        label: "Actual system proven in operational environment",
        description:
          "The actual system has been proven in operational use under expected conditions."
      }
    }
  },

  drl: {
    sourceNote: "Based only on the user-uploaded DRL scoring standard.",
    levels: {
      1: {
        band: "Band C (C4)",
        label: "Unverified existence",
        description: "Data are believed to exist but remain unconfirmed.",
        primaryDimension: "Accessibility"
      },
      2: {
        band: "Band C (C3)",
        label: "Existence confirmed",
        description: "Data exist but are not yet accessible.",
        primaryDimension: "Accessibility"
      },
      3: {
        band: "Band C (C2)",
        label: "Partial accessibility",
        description:
          "Data are retrievable in principle but constrained by legal, ethical, or ownership barriers.",
        primaryDimension: "Accessibility"
      },
      4: {
        band: "Band C (C1)",
        label: "Machine-readable",
        description:
          "Data are accessible in machine-readable form with basic governance clearance.",
        primaryDimension: "Accessibility"
      },
      5: {
        band: "Band B (B4-B3)",
        label: "Initial cleaning",
        description:
          "Major errors, missingness, and inconsistencies have been identified and partly addressed.",
        primaryDimension: "Data quality"
      },
      6: {
        band: "Band B (B2)",
        label: "Quality improvement",
        description:
          "Data are largely cleaned and standardised, with improving consistency and sufficient continuity for preliminary analysis.",
        primaryDimension: "Data quality"
      },
      7: {
        band: "Band B (B1)",
        label: "Faithfulness achieved",
        description:
          "Data are reliable, traceable, and sufficiently representative of the main operating conditions, with documented limitations.",
        primaryDimension: "Data quality"
      },
      8: {
        band: "Band A (A4-A2)",
        label: "Contextual relevance",
        description:
          "Data are linked to a defined modelling or decision task, although coverage or depth may still be incomplete.",
        primaryDimension: "Task fitness"
      },
      9: {
        band: "Band A (A1)",
        label: "Task-ready",
        description:
          "Data are sufficient in volume, coverage, and temporal depth for the intended task and suitable for operational use.",
        primaryDimension: "Task fitness"
      }
    }
  },

  alpha: {
    sourceNote: "Based only on the user-uploaded α scoring standard.",
    thresholds: {
      weakBelow: 2.5,
      strongAtOrAbove: 3.25,
      note:
        "TODO: Confirm before publication. Editable default. The uploaded α file gives 1-5 scoring anchors but no weak/moderate/strong role thresholds. These defaults follow the threshold values requested in the project brief and should be reviewed if the framework publication specifies different 1-5 thresholds."
    },
    criticalCriteria: {
      R2: ["TD1", "DM1", "DM2"],
      R3: ["TD1", "MT1", "MT2"]
    },
    TD: {
      title: "Technology-Data alignment",
      shortDefinition:
        "Assesses whether the measurement technology captures process dynamics, feedstock variation, and operating context at a resolution usable for the intended digital twin task.",
      criteria: [
        {
          id: "TD1",
          label: "Temporal alignment",
          options: [
            { score: 1, description: "Critical dynamics/lags are under-resolved; signals largely delayed/averaged by intermittent testing." },
            { score: 2, description: "Some online signals exist, but dominant responses remain filtered or mis-timed for the stated task." },
            { score: 3, description: "Major trends are captured; transient behaviour is only partially resolved." },
            { score: 4, description: "Sampling/monitoring is broadly matched to dominant process time scales; lags can be handled." },
            { score: 5, description: "Monitoring is systematically designed around process time-scale analysis; dominant responses are consistently resolvable." }
          ]
        },
        {
          id: "TD2",
          label: "Feedstock-variability alignment",
          options: [
            { score: 1, description: "Key feedstock fluctuations are largely invisible; variability appears as unmodelled disturbance." },
            { score: 2, description: "Intermittent characterisation exists but does not reliably explain observed variability." },
            { score: 3, description: "Some drivers are captured; abrupt changes or slow drifts are partly observable." },
            { score: 4, description: "Monitoring targets main sources of feedstock variability using measurable proxies/soft sensing." },
            { score: 5, description: "Feedstock variability is consistently observable/traceable and can be used as a model input." }
          ]
        },
        {
          id: "TD3",
          label: "Spatial & operational alignment",
          options: [
            { score: 1, description: "Spatial heterogeneity and mode/phase effects are largely unobserved; substantial blind zones exist." },
            { score: 2, description: "Limited coverage; phase/mode changes are weakly reflected, causing systematic bias." },
            { score: 3, description: "Key regions/phases are partly represented; important blind spots persist." },
            { score: 4, description: "Monitoring reflects main heterogeneity and operating phases; phase-aware labelling is feasible." },
            { score: 5, description: "Spatial/operational context is consistently preserved; slow boundary/equipment-status changes do not act as hidden drift drivers." }
          ]
        }
      ]
    },
    DM: {
      title: "Data-Model alignment",
      shortDefinition:
        "Assesses whether available data can be mapped, synchronised, and structured in ways that support calibration, updating, and inference by the intended model.",
      criteria: [
        {
          id: "DM1",
          label: "Representational alignment",
          options: [
            { score: 1, description: "Measured variables do not map to model quantities/targets; modelling is constrained at the variable level." },
            { score: 2, description: "Mapping exists but is unstable or weakly justified; heavy ad hoc feature engineering is required." },
            { score: 3, description: "Workable correspondence for major variables; remaining gaps limit robustness." },
            { score: 4, description: "Key model quantities have clear counterparts; traceable links from raw signals to features/targets exist." },
            { score: 5, description: "Stable, well-understood, and traceable measurement-to-model mapping supports calibration and updating." }
          ]
        },
        {
          id: "DM2",
          label: "Temporal-structure alignment",
          options: [
            { score: 1, description: "Multi-rate streams are too asynchronous/fragmented; trajectories are largely reconstructed." },
            { score: 2, description: "Alignment relies on extensive interpolation/resampling; physical consistency is uncertain." },
            { score: 3, description: "Usable trajectories can be formed, but are sensitive to synchronisation choices." },
            { score: 4, description: "Coherent time bases can be formed with limited and transparent reconstruction." },
            { score: 5, description: "Temporal coherence is high; dynamic inference relies primarily on observed rather than reconstructed structure." }
          ]
        },
        {
          id: "DM3",
          label: "Coverage + structural/semantic consistency",
          options: [
            { score: 1, description: "Data cover a narrow region (few recipes/steady states); storage structure conflicts with modelling entities." },
            { score: 2, description: "Partial coverage; identifiers/definitions drift; aggregation masks critical variation." },
            { score: 3, description: "Major operating conditions are represented, but gaps remain; structural alignment is incomplete." },
            { score: 4, description: "Data domain largely overlaps intended application domain; structural/semantic consistency is workable." },
            { score: 5, description: "Coverage supports the intended domain; data organisation (tags vs batches/stages) is consistently mapped for modelling." }
          ]
        }
      ]
    },
    MT: {
      title: "Model-Task alignment",
      shortDefinition:
        "Assesses whether the model role, recommended actions, and constraints are compatible with real operational decision mechanisms.",
      criteria: [
        {
          id: "MT1",
          label: "Role-hierarchy congruence",
          options: [
            { score: 1, description: "Model role is incompatible with actual decision/control layers; outputs cannot enter operational mechanisms." },
            { score: 2, description: "Only episodic/offline use is realistic despite stronger claimed roles." },
            { score: 3, description: "Advisory use is feasible within existing decision cadence and interfaces." },
            { score: 4, description: "Intended role aligns with supervisory/operator workflows; embedding is practically feasible." },
            { score: 5, description: "Role is fully congruent with decision hierarchy; sustained coupling to operations is credible." }
          ]
        },
        {
          id: "MT2",
          label: "Manipulability & constraints compatibility",
          options: [
            { score: 1, description: "Recommended actions rely on non-manipulable variables or violate constraints." },
            { score: 2, description: "Partial compatibility; feasibility depends on unrealistic setpoint changes or ignored limits." },
            { score: 3, description: "Actions are feasible in a subset of conditions; constraint handling is incomplete." },
            { score: 4, description: "Recommendations map to manipulable variables and respect key constraints." },
            { score: 5, description: "Actions are consistently executable within equipment and regulatory constraints across the intended envelope." }
          ]
        }
      ]
    }
  },

  roleDefinitions: {
    R1: {
      title: "Offline / open-loop analysis",
      description:
        "The digital twin is mainly suitable for retrospective interpretation, offline scenario analysis, design-space exploration, model-based understanding, or non-operational decision support."
    },
    R2: {
      title: "Online monitoring and soft sensing",
      description:
        "The digital twin is suitable for routine online monitoring, state estimation, near-real-time interpretation, or soft-sensor support, but not necessarily for autonomous intervention or closed-loop control."
    },
    R3: {
      title: "Advisory or closed-loop use",
      description:
        "The digital twin is sufficiently aligned with operational tasks to support bounded advisory recommendations, optimisation, or closed-loop intervention within a validated operating envelope and under appropriate governance and safety constraints."
    }
  },

  roleRules: {
    notes: [
      "The role ceiling is primarily determined by α alignment.",
      "TRL constrains the feasible deployment boundary.",
      "DRL qualifies the confidence of the assignment.",
      "The final result is not a simple average of TRL, DRL, and α."
    ],
    trlBoundary: {
      1: { maxRole: "R1", note: "Basic research stage; operational deployment claims are not defensible." },
      2: { maxRole: "R1", note: "Concept stage; operational deployment claims are not defensible." },
      3: { maxRole: "R1", note: "Proof-of-concept stage; current role is exploratory." },
      4: { maxRole: "R1", note: "Laboratory validation supports offline analysis; online deployment remains future potential." },
      5: { maxRole: "R1", note: "Relevant-environment validation supports offline analysis; early R2 potential should remain qualified." },
      6: { maxRole: "R2", note: "Relevant-environment demonstration may support early online monitoring if α and DRL are sufficient." },
      7: { maxRole: "R2", conditionalR3: true, note: "Operational prototype demonstration supports R2; R3 requires strong α and high DRL." },
      8: { maxRole: "R3", note: "Complete and qualified system can support R2 or R3 if α and DRL are sufficient." },
      9: { maxRole: "R3", note: "Operationally proven system can support R2 or R3 if α and DRL are sufficient." }
    },
    drlConfidence: {
      low: { levels: [1, 2, 3, 4], label: "Low confidence", note: "Band C evidence should be interpreted as exploratory or low-confidence." },
      moderate: { levels: [5, 6, 7], label: "Moderate confidence", note: "Band B evidence can support R1 or R2 with moderate confidence; R3 requires additional validation support." },
      high: { levels: [8, 9], label: "High confidence", note: "Band A evidence can support R2 or R3 if α and TRL are also sufficient." }
    },
    minimumDrlForR3: 8
  },

  examples: [
    {
      name: "Conventional anaerobic digestion",
      trl: 9,
      drl: 7,
      alpha: { TD: 2.67, DM: 2.67, MT: 3.5 },
      expectedInterpretation: "R2 with bounded advisory potential.",
      mainLimitingDimensions:
        "αTD and αDM, especially feedstock variability, spatial representativeness, domain consistency, and data-model coverage."
    },
    {
      name: "H2AD / emerging wastewater biotechnology",
      trl: 6,
      drl: 5,
      alpha: { TD: 2.67, DM: 2.33, MT: 3.0 },
      expectedInterpretation: "R1 with early R2 potential.",
      mainLimitingDimensions: "TRL, DRL, and αDM."
    }
  ]
};
