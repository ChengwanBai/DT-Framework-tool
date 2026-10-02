const test = require("node:test");
const assert = require("node:assert/strict");

const config = require("../scoringConfig.js");
const engine = require("../frameworkEngine.js");

function scores(value = 4) {
  return {
    TD: { TD1: value, TD2: value, TD3: value },
    DM: { DM1: value, DM2: value, DM3: value },
    MT: { MT1: value, MT2: value }
  };
}

function assessment(overrides = {}) {
  return {
    targetRole: "R3",
    band: "A",
    offlineTaskDemonstrated: true,
    applicability: {
      feedstockVariability: false,
      spatialEffects: false,
      recommendedActions: false
    },
    scores: scores(),
    ...overrides
  };
}

function withScores(changes, base = 4) {
  const result = scores(base);
  Object.entries(changes).forEach(([id, value]) => {
    result[id.slice(0, 2)][id] = value;
  });
  return result;
}

function adScenario() {
  const example = config.workedExample;
  return {
    targetRole: example.targetRole,
    band: example.band,
    offlineTaskDemonstrated: example.offlineTaskDemonstrated === "yes",
    applicability: Object.fromEntries(
      Object.entries(example.applicability).map(([key, value]) => [key, value === "yes"])
    ),
    scores: example.scores
  };
}

// ---- Table 5: R3 ---------------------------------------------------------

test("R3: Band A and every applicable criterion at 4 support R3", () => {
  const result = engine.evaluateAssessment(config, assessment());
  assert.equal(result.finalRole, "R3");
  assert.equal(result.targetMet, true);
});

test("R3: Band B cannot support R3 but can support R2", () => {
  const result = engine.evaluateAssessment(config, assessment({ band: "B" }));
  assert.equal(result.finalRole, "R2");
  assert.equal(result.targetMet, false);
  assert.equal(result.targetEvaluation.failures[0].type, "band");
  assert.equal(result.targetEvaluation.failures[0].required, "A");
});

test("R3: α_MT2 is always required, even when R2 outputs have no recommended actions", () => {
  const result = engine.evaluateAssessment(config, assessment({ scores: withScores({ MT2: 3 }) }));
  assert.equal(result.finalRole, "R2");
  assert.ok(result.targetEvaluation.failures.some((failure) => failure.criterion === "MT2"));
});

test("R3: α_TD2 is checked against 4 only when feedstock variability applies", () => {
  const input = assessment({ scores: withScores({ TD2: 3 }) });
  assert.equal(engine.evaluateAssessment(config, input).finalRole, "R3");

  input.applicability = { ...input.applicability, feedstockVariability: true };
  const result = engine.evaluateAssessment(config, input);
  assert.equal(result.finalRole, "R2");
  assert.ok(result.targetEvaluation.failures.some((failure) => failure.criterion === "TD2"));
});

test("R3: dimension means do not compensate for a single criterion below 4", () => {
  const result = engine.evaluateAssessment(config, assessment({ scores: withScores({ DM1: 5, DM2: 5, DM3: 3 }) }));
  assert.equal(engine.calculateDimensionMeans(config, withScores({ DM1: 5, DM2: 5, DM3: 3 })).DM, 4.33);
  assert.equal(result.finalRole, "R2");
});

// ---- Table 5: R2 ---------------------------------------------------------

test("R2: thresholds are criterion-level (TD1, DM1, DM2, MT1 ≥ 3; DM3 ≥ 2)", () => {
  const base = { targetRole: "R2", band: "B" };
  for (const id of ["TD1", "DM1", "DM2", "MT1"]) {
    const result = engine.evaluateAssessment(config, assessment({ ...base, scores: withScores({ [id]: 2 }) }));
    assert.equal(result.finalRole, "R1", `${id} = 2 should fail R2`);
    assert.ok(result.targetEvaluation.failures.some((failure) => failure.criterion === id && failure.required === 3));
  }
  const dm3 = engine.evaluateAssessment(config, assessment({ ...base, scores: withScores({ DM3: 2 }) }));
  assert.equal(dm3.finalRole, "R2");
  const dm3Fail = engine.evaluateAssessment(config, assessment({ ...base, scores: withScores({ DM3: 1 }) }));
  assert.equal(dm3Fail.finalRole, "R1");
});

test("R2: a high dimension mean cannot offset α_DM1 below 3", () => {
  const selected = withScores({ DM1: 2, DM2: 5, DM3: 5 });
  const result = engine.evaluateAssessment(config, assessment({ targetRole: "R2", band: "B", scores: selected }));
  assert.equal(engine.calculateDimensionMeans(config, selected).DM, 4);
  assert.equal(result.finalRole, "R1");
});

test("R2: α_TD2 and α_TD3 are not required when their conditions do not apply", () => {
  const selected = withScores({ TD2: 1, TD3: 1 });
  const result = engine.evaluateAssessment(config, assessment({ targetRole: "R2", band: "B", scores: selected }));
  assert.equal(result.finalRole, "R2");
  assert.deepEqual(
    result.targetEvaluation.requirements.map((item) => item.id),
    ["TD1", "DM1", "DM2", "DM3", "MT1"]
  );
});

test("R2: applicable α_TD2 and α_TD3 must reach 2", () => {
  const applicability = { feedstockVariability: true, spatialEffects: true, recommendedActions: false };
  const pass = engine.evaluateAssessment(
    config,
    assessment({ targetRole: "R2", band: "B", applicability, scores: withScores({ TD2: 2, TD3: 2 }) })
  );
  assert.equal(pass.finalRole, "R2");
  const fail = engine.evaluateAssessment(
    config,
    assessment({ targetRole: "R2", band: "B", applicability, scores: withScores({ TD3: 1 }) })
  );
  assert.equal(fail.finalRole, "R1");
});

test("R2: α_MT2 ≥ 2 is required only when outputs include recommended actions", () => {
  const selected = withScores({ MT2: 1 });
  const noActions = engine.evaluateAssessment(config, assessment({ targetRole: "R2", band: "B", scores: selected }));
  assert.equal(noActions.finalRole, "R2");

  const withActions = engine.evaluateAssessment(
    config,
    assessment({
      targetRole: "R2",
      band: "B",
      applicability: { feedstockVariability: false, spatialEffects: false, recommendedActions: true },
      scores: selected
    })
  );
  assert.equal(withActions.finalRole, "R1");
  assert.ok(withActions.targetEvaluation.failures.some((failure) => failure.criterion === "MT2" && failure.required === 2));
});

test("R2: Band C fails R2 and R1, so no role ceiling is assigned", () => {
  const result = engine.evaluateAssessment(config, assessment({ band: "C" }));
  assert.equal(result.finalRole, "none");
  assert.deepEqual(result.consideredRoles, ["R3", "R2", "R1"]);
});

// ---- Table 5: R1 ---------------------------------------------------------

test("R1: requires Band B and demonstrated offline task, with no α threshold", () => {
  const pass = engine.evaluateAssessment(config, assessment({ targetRole: "R1", band: "B", scores: scores(1) }));
  assert.equal(pass.finalRole, "R1");

  const fail = engine.evaluateAssessment(
    config,
    assessment({ targetRole: "R1", band: "B", offlineTaskDemonstrated: false })
  );
  assert.equal(fail.finalRole, "none");
  assert.equal(fail.targetEvaluation.failures[0].type, "task");
});

test("Roles are tested from the target downwards only", () => {
  const result = engine.evaluateAssessment(config, assessment({ targetRole: "R2" }));
  assert.equal(result.finalRole, "R2");
  assert.deepEqual(result.consideredRoles, ["R2"]);
});

// ---- Section 4.3: descriptive means and limiting criteria ------------------

test("Dimension means use all criteria in each dimension (Equation 1)", () => {
  const means = engine.calculateDimensionMeans(config, withScores({ TD2: 1, TD3: 1, MT2: 2 }));
  assert.equal(means.TD, 2);
  assert.equal(means.DM, 4);
  assert.equal(means.MT, 3);
});

test("Limiting criteria use only criteria required for the target role", () => {
  const selected = withScores({ TD2: 1, DM3: 2, MT2: 1 });
  const limits = engine.findLimitingCriteria(
    config,
    "R2",
    { feedstockVariability: false, spatialEffects: false, recommendedActions: false },
    selected
  );
  const ids = limits.map((item) => item.criterion);
  assert.ok(!ids.includes("TD2"), "inapplicable α_TD2 is not limiting");
  assert.ok(!ids.includes("MT2"), "α_MT2 is not required for R2 without recommended actions");
  assert.ok(ids.includes("DM3"));
  assert.ok(ids.includes("TD1"));
  assert.ok(ids.includes("MT1"));
});

test("R1 target has no limiting α criteria", () => {
  const limits = engine.findLimitingCriteria(config, "R1", {}, scores(2));
  assert.deepEqual(limits, []);
});

// ---- Section 5: full-scale anaerobic digestion reference scenario ---------

test("AD scenario (Table 6): TRL 9, Band B and the Table 6 scores give an R2 ceiling", () => {
  const result = engine.evaluateAssessment(config, adScenario());
  assert.equal(result.targetRole, "R3");
  assert.equal(result.finalRole, "R2");
  assert.deepEqual(result.consideredRoles, ["R3", "R2"]);
});

test("AD scenario: means are 2.7, 2.7 and 3.5 (Section 5.1)", () => {
  const means = engine.calculateDimensionMeans(config, config.workedExample.scores);
  assert.equal(means.TD.toFixed(1), "2.7");
  assert.equal(means.DM.toFixed(1), "2.7");
  assert.equal(means.MT.toFixed(1), "3.5");
});

test("AD scenario: limiting criteria are α_TD2, α_TD3, α_DM3 and α_MT2 (Table 6 asterisks)", () => {
  const input = adScenario();
  const limits = engine.findLimitingCriteria(config, input.targetRole, input.applicability, input.scores);
  assert.deepEqual(limits.map((item) => item.criterion), ["TD2", "TD3", "DM3", "MT2"]);
});

test("AD scenario: five criteria meet R2 exactly; R3 needs six criteria and Band A (Section 5.2)", () => {
  const evaluation = engine.evaluateAssessment(config, adScenario());
  const margins = engine.thresholdMargins(evaluation);
  assert.deepEqual(margins.atThreshold.map((item) => item.criterion), ["TD2", "TD3", "DM1", "DM2", "DM3"]);
  assert.equal(margins.nextRole, "R3");
  assert.equal(margins.nextRoleCriterionCount, 6);
  assert.equal(margins.nextRoleNeedsBand, "A");
});

test("AD scenario: deployment constraints cover the DRL band and six criteria", () => {
  const evaluation = engine.evaluateAssessment(config, adScenario());
  const constraints = engine.deploymentConstraints(config, evaluation);
  assert.deepEqual(
    constraints.map((item) => item.key),
    ["band-A", "TD2", "TD3", "DM1", "DM2", "DM3", "MT2"]
  );
  assert.ok(constraints.every((item) => item.action.length > 0));
});
