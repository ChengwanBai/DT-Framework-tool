const scoringConfig = {
  metadata: {
    toolkitName: "Bioprocess Digital Twin Deployment Readiness Toolkit",
    frameworkName: "TRL–DRL–α framework",
    articleTitle:
      "Digital Twins That Deliver: A Role-Based Deployment Readiness Framework for Biomanufacturing Systems",
    articleAuthors: "Chengwan Bai, Rachel L Gomes, Oliver J Fisher",
    version: "3.0.0",
    lastUpdated: "2026-10-02"
  },

  warnings: [],

  // Section 3.1, Table 3. Section 4.1: the specification "fixes the system boundary,
  // operating envelope, task and target role against which all subsequent scores are interpreted".
  specification: [
    {
      id: "systemBoundary",
      label: "System boundary",
      status: "required",
      definition:
        "The physical and digital components included in the assessment: relevant process units, instrumentation, data systems, model services, user interfaces and actuators, where applicable.",
      placeholder: "e.g. digester with feed, mixing, heating and biogas systems; SCADA historian; laboratory records; process model"
    },
    {
      id: "deploymentContext",
      label: "Deployment context",
      status: "recommended",
      definition: "The specific site, scale and operational environment in which the system operates.",
      placeholder: "e.g. full-scale municipal sludge digester; pilot-scale fermenter"
    },
    {
      id: "operatingEnvelope",
      label: "Operating envelope",
      status: "required",
      definition:
        "The range of process and environmental conditions over which the system is expected to remain valid, including feedstocks, loading rates, process states, disturbances and equipment configurations.",
      placeholder: "e.g. covered feedstocks, loading rates, process states and disturbances"
    },
    {
      id: "operationalTask",
      label: "Task",
      status: "required",
      definition:
        "The process variable, state or outcome to be monitored, predicted, optimised or controlled, and the operational decision or action supported.",
      placeholder: "e.g. VFA prediction and feed-rate recommendations to the operator"
    },
    {
      id: "modelConfiguration",
      label: "Model configuration",
      status: "recommended",
      definition:
        "The model implementation assessed: model type and version, required inputs, generated outputs, training or calibration status, and the conditions over which acceptable performance has been demonstrated.",
      placeholder: "e.g. ADM1 calibrated on site data, v2.1; inputs, outputs, validated range"
    },
    {
      id: "temporalRequirements",
      label: "Temporal requirements",
      status: "recommended",
      definition:
        "Required frequency and timing of data acquisition, model updating and output generation, the time available for decision-making, and the expected delay between an intervention and the process response.",
      placeholder: "e.g. hourly data, daily model update, decision within one shift, response over days"
    },
    {
      id: "decisionPathway",
      label: "Decision pathway and authority",
      status: "recommended",
      definition:
        "The route by which model outputs reach an operator, supervisory system or controller, and the authority assigned to review, approve, modify or automatically execute the resulting action.",
      placeholder: "e.g. HMI advisory; operator approves all setpoint changes"
    }
  ],

  // Section 3.2. TRL is assigned to the physical process configuration defined in the
  // system boundary. It is reported in the profile but is not a Table 5 role threshold.
  trl: {
    sourceNote:
      "Nine-level TRL scale (Mankins, 1995; Héder, 2017), assigned to the physical process configuration defined in the system boundary (Section 3.2).",
    roleUse:
      "TRL is reported in the TRL–DRL–α profile but is not a role threshold in Table 5. A higher TRL does not imply greater data readiness.",
    levels: {
      1: {
        label: "Basic principles observed",
        description:
          "The biological or chemical principle underlying the process has been observed and reported."
      },
      2: {
        label: "Technology concept formulated",
        description:
          "A process concept applying the principle has been formulated, but it has not yet been tested experimentally."
      },
      3: {
        label: "Experimental proof of concept",
        description:
          "Critical process functions, such as conversion, yield or separation, have been demonstrated experimentally for individual steps."
      },
      4: {
        label: "Technology validated in the laboratory",
        description:
          "The process steps within the system boundary have been integrated and operated together at laboratory scale under controlled conditions."
      },
      5: {
        label: "Technology validated in a relevant environment",
        description:
          "The integrated process configuration has been validated with representative feedstocks, biological matrices and operating conditions, typically at bench or pilot scale."
      },
      6: {
        label: "Technology demonstrated in a relevant environment",
        description:
          "A representative pilot-scale configuration, including its main equipment, has operated under conditions approximating the intended application, including scale-dependent mixing, mass transfer and feedstock variation."
      },
      7: {
        label: "System prototype demonstrated in an operational environment",
        description:
          "A prototype or near-full-scale process configuration has operated in the intended operational environment with its equipment, utilities and existing control system."
      },
      8: {
        label: "System complete and qualified",
        description:
          "The complete process configuration has been commissioned and qualified at full scale within the defined operating envelope."
      },
      9: {
        label: "Actual system proven in an operational environment",
        description:
          "The process configuration is established in routine full-scale operation under industrial conditions."
      }
    }
  },

  // Section 3.3, Table 4 (Lawrence, 2017). Bands are assigned hierarchically.
  drl: {
    sourceNote: "Lawrence's Data Readiness Level bands as applied in Table 4.",
    order: ["C", "B", "A"],
    bands: {
      C: {
        label: "Band C",
        shortLabel: "Accessibility",
        question: "Can the data be obtained?",
        interpretation:
          "Data existence, access, format, ownership, and legal or ethical restrictions.",
        outcome: "The required data are available in a machine-readable form.",
        includes: [],
        cumulativeNote: "Foundation band."
      },
      B: {
        label: "Band B",
        shortLabel: "Faithfulness and representation",
        question: "Do the records represent the process?",
        interpretation:
          "Missing values, measurement errors, units, time stamps, provenance, integration and links to the relevant batch or operating phase.",
        outcome: "The quality and limitations of the records are known.",
        includes: ["C"],
        cumulativeNote: "Requires all Band C conditions."
      },
      A: {
        label: "Band A",
        shortLabel: "Data in context",
        question: "Does the data support the stated task?",
        interpretation:
          "Required variables, sampling frequency, annotation, data volume and coverage of relevant operating conditions.",
        outcome: "The dataset is suitable for the stated modelling or decision task.",
        includes: ["B", "C"],
        cumulativeNote: "Requires all Band B and Band C conditions."
      }
    },
    rank: { C: 1, B: 2, A: 3 }
  },

  // Section 4.2 and Section 4.4: meaning of the five-point anchor scale.
  anchorScale: {
    1: "Major mismatch with the stated task and target role.",
    2: "Partial alignment with known limitations.",
    3: "Alignment adequate for the stated task under normal operating conditions.",
    4: "Alignment maintained across the operating envelope, including foreseeable disturbances.",
    5: "Consistent alignment across the specified operating envelope, update and decision intervals and level of decision authority."
  },

  // Section 3.4. Criterion anchors follow Supplementary Table S1.
  alpha: {
    sourceNote: "Criterion definitions from Section 3.4; five-point anchors from Supplementary Table S1.",
    TD: {
      title: "Technology–data alignment",
      shortDefinition:
        "Whether the sensors and data-acquisition system capture relevant process changes at the required frequency and locations, including changes in feedstock characteristics.",
      responsibility: "Instrumentation and laboratory practice",
      constraintFocus:
        "Sensing and sampling: measurement frequency, coverage, sensor placement and feedstock characterisation.",
      criteria: [
        {
          id: "TD1",
          label: "Temporal alignment",
          definition:
            "Whether the sampling interval and sensor response time suit the process changes the DT must detect, given the process dynamics and the timing of the supported decision.",
          action:
            "Match sampling intervals and sensor response times to the process dynamics and the timing of the supported decision.",
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
          label: "Feedstock alignment",
          definition:
            "Whether important changes in influent or substrate characteristics, such as solids content, biodegradability, nutrient balance and inhibitory compounds, are recorded.",
          action:
            "Characterise the feed more frequently, or add in-line sensing, spectroscopy or validated soft sensors that give time-stamped measurements of feedstock changes.",
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
          label: "Spatial alignment",
          definition:
            "Whether sensor locations represent the parts of the process that affect its performance, given gradients, dead zones, recirculation, phase separation or short-circuiting.",
          action:
            "Review sensor and sampling locations, use multi-position sensing where feasible, or confirm representativeness with tracer studies or validated estimation methods.",
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
      title: "Data–modelling alignment",
      shortDefinition:
        "Whether the available data contain the variables, time resolution and operating conditions required to develop, calibrate and update the selected model.",
      responsibility: "Data management and modelling",
      constraintFocus:
        "Model inputs, data resolution and synchronisation, coverage of the intended operating range and data for model validation.",
      criteria: [
        {
          id: "DM1",
          label: "Representational alignment",
          definition:
            "Whether the variables required by the model are measured or can be estimated from validated proxies, so that each required model input and output links to a measured variable or validated soft sensor.",
          action:
            "Measure, or estimate with validated soft sensors, the model-required inputs and states so that each links to a measured variable.",
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
          label: "Granularity and synchronisation alignment",
          definition:
            "Whether sensor measurements, laboratory assays and operating records can be combined at the model's time resolution and linked to the correct batch, stage and time point without implying unmeasured changes.",
          action:
            "Store laboratory, online and operating records synchronously, linked to batch, process stage and time point, and limit interpolation to changes the original measurements support.",
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
          label: "Operating-condition coverage and structural alignment",
          definition:
            "Whether the data represent the conditions in which the model will be used, and whether records are organised consistently across equipment, batches and data sources.",
          action:
            "Extend calibration and validation data across the feedstocks, loading conditions and operating regimes in the intended envelope, and harmonise units, tag names, equipment identifiers and batch definitions.",
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
      title: "Modelling–technology alignment",
      shortDefinition:
        "Whether model outputs are available within the required decision time and whether recommended actions can be implemented using the plant's existing control system and actuators within their operating limits. Model accuracy is not reassessed here.",
      responsibility: "Automation and operations",
      constraintFocus:
        "How model outputs are used in operation: operator interfaces, control actions and operating limits.",
      criteria: [
        {
          id: "MT1",
          label: "Decision-structure alignment",
          definition:
            "Whether outputs map onto the plant's control and decision layers at the level of the automation hierarchy the role requires. A gap arises when outputs require a more closely coupled pathway than the site provides; an under-used pathway does not constrain the role.",
          action:
            "Deliver outputs, within the decision time, to the decision layer the role requires: the operator interface for R2, or the supervisory control layer for R3.",
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
          label: "Actuation-constraint alignment",
          definition:
            "Whether proposed changes can be made with the available equipment, within equipment capacity, response time, safety requirements and the permitted operating range.",
          action:
            "Map recommendations to available manipulated variables within capacity, response time, safety limits and permitted ranges. For R3, also define and test actuator limits, decision authority, safety constraints, failure responses, fallback states and operator-intervention procedures.",
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

  // Section 2.1, Figure 2 and Table 5.
  roleDefinitions: {
    none: {
      title: "No role ceiling assigned",
      shortTitle: "None",
      description:
        "No role at or below the target meets every applicable threshold within the stated assessment boundary."
    },
    R1: {
      title: "Offline analysis and open-loop decision support",
      shortTitle: "Offline / open-loop",
      description:
        "Model outputs support offline analysis or open-loop decisions. No live data or operational integration is required."
    },
    R2: {
      title: "Online monitoring, soft sensing and operator-mediated decision support",
      shortTitle: "Operator-mediated",
      description:
        "Online support from monitoring and soft sensing to operator-mediated recommendations. Decision authority remains with the operator."
    },
    R3: {
      title: "Automated closed-loop optimisation or control",
      shortTitle: "Automated",
      description:
        "Model outputs can directly influence process operation. Operator oversight, supervisory approval, intervention thresholds or fail-safe mechanisms may still be required."
    }
  },

  // Conditions in the note to Table 5.
  conditions: {
    feedstockVariability: {
      criterion: "TD2",
      question: "Can feedstock or material variability affect the assessed task?",
      yes: "Yes: include in the role test (R2 ≥ 2, R3 ≥ 4)",
      no: "No: scored and reported, not used as a requirement"
    },
    spatialEffects: {
      criterion: "TD3",
      question:
        "Can spatial gradients, phase distribution, scale effects or differences between operating units affect the task?",
      yes: "Yes: include in the role test (R2 ≥ 2, R3 ≥ 4)",
      no: "No: scored and reported, not used as a requirement"
    },
    recommendedActions: {
      criterion: "MT2",
      question:
        "Do R2 outputs include recommended operational actions, such as a change to a setpoint, feed rate or mixing intensity for the operator to review and implement?",
      yes: "Yes: required for R2 (≥ 2) as well as R3 (≥ 4)",
      no: "No: not required for R2; still required for R3 (≥ 4)"
    }
  },

  // Table 5. Thresholds apply to individual criterion scores, not to dimension means,
  // and are non-compensatory. Roles are tested from the target role downwards.
  roleRequirements: {
    R1: {
      minimumBand: "B",
      taskPerformanceRequired: true,
      criteria: []
    },
    R2: {
      minimumBand: "B",
      taskPerformanceRequired: false,
      criteria: [
        { id: "TD1", minimum: 3 },
        { id: "TD2", minimum: 2, condition: "feedstockVariability" },
        { id: "TD3", minimum: 2, condition: "spatialEffects" },
        { id: "DM1", minimum: 3 },
        { id: "DM2", minimum: 3 },
        { id: "DM3", minimum: 2 },
        { id: "MT1", minimum: 3 },
        { id: "MT2", minimum: 2, condition: "recommendedActions" }
      ]
    },
    R3: {
      minimumBand: "A",
      taskPerformanceRequired: false,
      criteria: [
        { id: "TD1", minimum: 4 },
        { id: "TD2", minimum: 4, condition: "feedstockVariability" },
        { id: "TD3", minimum: 4, condition: "spatialEffects" },
        { id: "DM1", minimum: 4 },
        { id: "DM2", minimum: 4 },
        { id: "DM3", minimum: 4 },
        { id: "MT1", minimum: 4 },
        { id: "MT2", minimum: 4 }
      ]
    }
  },

  // Section 4.5.
  constraintGuidance: {
    band: {
      B: {
        focus: "Data quality and representational faithfulness",
        action:
          "Establish data quality and representational faithfulness: quantify missing values and measurement errors, and record units, time stamps and provenance with links to the relevant batch or operating phase."
      },
      A: {
        focus: "Task-specific preparation and suitability",
        action:
          "Prepare the data for the stated task: integrate SCADA, laboratory and manual records with consistent timestamps, units, variable definitions and equipment identifiers, and retain calibration records, quality flags, interventions and setpoint changes with the measurements."
      }
    },
    task: {
      focus: "Demonstrated task performance",
      action:
        "Demonstrate and document the specified offline or open-loop task using the available data and model within the assessment boundary."
    },
    rankingNote:
      "The framework identifies constraints but does not rank them. Priority depends on technical dependencies, cost, safety, implementation time, operational disruption and likely benefit.",
    reassessment:
      "Reassess the full TRL–DRL–α profile only after a change has been implemented and tested. Compare results only if the system boundary, operating conditions, task and target role are unchanged; otherwise treat it as a new assessment."
  },

  // Section 5: literature-grounded full-scale anaerobic digestion reference scenario (Table 6).
  workedExample: {
    title: "Full-scale anaerobic digestion reference scenario (Section 5, Table 6)",
    specification: {
      systemBoundary:
        "Continuously operated full-scale sludge digester with its feed, mixing, recirculation, heating and biogas-handling systems; online measurements, laboratory results, operating events and setpoint changes; dynamic process model.",
      deploymentContext:
        "Literature-grounded reference scenario: conventional full-scale sludge anaerobic digestion with SCADA, machine-readable historian, periodic laboratory analysis and manual operating records.",
      operatingEnvelope:
        "Feedstocks, loading conditions and operating regimes encountered during routine full-scale operation, including seasonal feedstock changes.",
      operationalTask:
        "Automated closed-loop optimisation or control of digester operation using predicted biogas flow and composition, pH, VFA, alkalinity and ammonium.",
      modelConfiguration:
        "Dynamic process model calibrated using site data (ADM1, data-driven or hybrid). Inputs: influent flow, COD fractions, inorganic carbon and nitrogen, digester temperature. Outputs: biogas flow and composition, pH, VFAs, alkalinity, ammonium, effluent COD.",
      temporalRequirements:
        "Feed flow, temperature, pH and biogas measured online; influent COD fractionation, VFAs and alkalinity from periodic laboratory analysis or validated estimation; relatively slow AD response.",
      decisionPathway:
        "Model-based functions integrated at the supervisory level of the existing automation platform; manipulated variables limited by plant-specific actuation and configuration constraints."
    },
    targetRole: "R3",
    trl: "9",
    band: "B",
    offlineTaskDemonstrated: "yes",
    applicability: {
      feedstockVariability: "yes",
      spatialEffects: "yes",
      recommendedActions: "yes"
    },
    scores: {
      TD: { TD1: 4, TD2: 2, TD3: 2 },
      DM: { DM1: 3, DM2: 3, DM3: 2 },
      MT: { MT1: 4, MT2: 3 }
    }
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = scoringConfig;
}
