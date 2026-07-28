const scoringConfig = {
  metadata: {
    toolkitName: "Bioprocess Digital Twin Deployment Readiness Toolkit",
    frameworkName: "TRL-DRL-α Digital Twin Deployment Framework",
    version: "2.1.0",
    lastUpdated: "2026-07-28"
  },

  warnings: [],

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
        label: "Integrated bioprocess DT validated in laboratory conditions",
        description:
          "The integrated sensing, data pipeline, model, and intended interface have been validated together using laboratory bioprocess equipment or representative experimental data."
      },
      5: {
        label: "Integrated bioprocess DT validated in a relevant environment",
        description:
          "The integrated digital twin has been validated at bench or pilot scale using relevant biological matrices, process variability, and operating conditions."
      },
      6: {
        label: "Integrated bioprocess DT demonstrated in a relevant environment",
        description:
          "A representative digital twin prototype has operated with an integrated bioprocess system at bench or pilot scale under conditions that approximate the intended application."
      },
      7: {
        label: "Bioprocess DT prototype demonstrated operationally",
        description:
          "The integrated prototype has been demonstrated with an operational bioprocess, including the intended data flows, update cycle, users, and operating constraints."
      },
      8: {
        label: "Bioprocess DT system complete and qualified",
        description:
          "The complete digital twin system and its operational interfaces have been qualified for use within a defined bioprocess operating envelope."
      },
      9: {
        label: "Bioprocess DT proven in routine operation",
        description:
          "The complete digital twin has demonstrated sustained, routine operational use across the expected bioprocess conditions and decision cycles."
      }
    }
  },

  drl: {
    sourceNote: "Band-based data-readiness classification supplied in the operational framework.",
    bands: {
      C: {
        label: "Band C",
        shortLabel: "Accessible data foundation",
        description:
          "Data existence, accessibility, machine readability, and basic governance clearance are established. Band C confirms that a usable data foundation exists, but does not establish sufficient quality or task fitness for assigning a digital twin role ceiling.",
        primaryDimension: "Availability and accessibility",
        maximumRole: null,
        includes: [],
        cumulativeNote: "Foundation band; no lower band is required."
      },
      B: {
        label: "Band B",
        shortLabel: "Quality-assured data",
        description:
          "All Band C conditions are met, and data quality, consistency, traceability, continuity, and representativeness have been demonstrated sufficiently for the assessed task. Band B can support R1 or R2 when the relevant task and alignment requirements are met.",
        primaryDimension: "Data quality",
        maximumRole: "R2",
        includes: ["C"],
        cumulativeNote: "Cumulative: includes every Band C requirement."
      },
      A: {
        label: "Band A",
        shortLabel: "Task-ready",
        description:
          "All Band B and Band C conditions are met, and the data have demonstrated contextual relevance, sufficient coverage and temporal depth, and fitness for the specified modelling or decision task and operating envelope. Band A allows R3 to be considered when all applicable alignment requirements are met.",
        primaryDimension: "Task fitness",
        maximumRole: "R3",
        includes: ["B", "C"],
        cumulativeNote: "Cumulative: includes every Band B and Band C requirement."
      }
    }
  },

  alpha: {
    sourceNote: "Based only on the user-uploaded α scoring standard.",
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
          label: "Measurement–model correspondence",
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
          label: "Granularity and synchronisation",
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
          label: "Operating-domain and data-structure coverage",
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
      title: "Model-Technology alignment",
      shortDefinition:
        "Assesses whether the model role, recommended actions, and constraints are compatible with real operational decision mechanisms.",
      criteria: [
        {
          id: "MT1",
          label: "Decision integration",
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
          label: "Action and constraint compatibility",
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
    none: {
      title: "No role ceiling assigned",
      description:
        "The minimum data-readiness or demonstrated-task conditions are not met within the stated assessment boundary."
    },
    R1: {
      title: "Offline analysis and open-loop decision support",
      description:
        "The available data and model have demonstrated the specified offline or open-loop task within the assessment boundary."
    },
    R2: {
      title: "Online monitoring and operator-supervised support",
      description:
        "The system supports online monitoring or decision support while outputs remain subject to operator review."
    },
    R3: {
      title: "Automated closed-loop optimisation or control",
      description:
        "The system supports automated optimisation or control within the specified operating envelope and level of decision authority."
    }
  },

  roleRules: {
    notes: [
      "The data-readiness bands are cumulative: Band A includes Bands B and C, and Band B includes Band C.",
      "R2 uses means calculated from the criteria applicable to the assessed task, together with a minimum score for every applicable criterion.",
      "R3 requires every applicable criterion to reach the required score; no averaging compensation is allowed.",
      "TRL records process maturity, scale, and operating conditions; it does not independently change the role in this operational procedure.",
      "The highest role at or below the stated target that meets every applicable condition is reported."
    ],
    bandRank: {
      C: 1,
      B: 2,
      A: 3
    },
    minimumBand: {
      R1: "B",
      R2: "B",
      R3: "A"
    },
    applicableCriteria: {
      TD: {
        always: ["TD1"],
        conditional: {
          feedstockVariability: "TD2",
          spatialEffects: "TD3"
        }
      },
      DM: {
        always: ["DM1", "DM2", "DM3"]
      },
      MT: {
        alwaysFor: ["R3"],
        conditionalFor: {
          R2: "operationGuidance"
        },
        criteria: ["MT1", "MT2"]
      }
    },
    R1: {
      taskPerformanceRequired: true
    },
    R2: {
      dimensionMinimums: {
        TD: 3,
        DM: 3
      },
      criterionFloor: 2,
      conditionalDimensionMinimums: {
        operationGuidance: {
          dimension: "MT",
          minimum: 3
        }
      }
    },
    R3: {
      criterionFloor: 4
    }
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = scoringConfig;
}
