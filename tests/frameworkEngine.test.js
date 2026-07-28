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
      operationGuidance: false
    },
    scores: scores(),
    ...overrides
  };
}

test("Band A and every R3-applicable criterion at 4 support R3", () => {
  const result = engine.evaluateAssessment(config, assessment());
  assert.equal(result.finalRole, "R3");
  assert.equal(result.targetMet, true);
});

test("Band B cannot support R3 but can support R2", () => {
  const result = engine.evaluateAssessment(config, assessment({ band: "B" }));
  assert.equal(result.finalRole, "R2");
  assert.equal(result.targetMet, false);
  assert.match(result.targetEvaluation.failures[0].message, /requires at least Band A/);
});

test("Band C cannot assign any role ceiling", () => {
  const result = engine.evaluateAssessment(config, assessment({ band: "C" }));
  assert.equal(result.finalRole, "none");
  assert.deepEqual(result.consideredRoles, ["R3", "R2", "R1"]);
});

test("R2 is downgraded when the alpha_DM mean is 2.67", () => {
  const selectedScores = scores(4);
  Object.assign(selectedScores.DM, { DM1: 3, DM2: 3, DM3: 2 });
  const result = engine.evaluateAssessment(
    config,
    assessment({ targetRole: "R2", band: "B", scores: selectedScores })
  );

  assert.equal(result.targetEvaluation.roleMappingMeans.DM, 2.67);
  assert.equal(result.finalRole, "R1");
});

test("a criterion at 1 fails R2 even when its applicable dimension mean is 3", () => {
  const selectedScores = scores(4);
  Object.assign(selectedScores.TD, { TD1: 1, TD2: 4, TD3: 4 });
  const input = assessment({
    targetRole: "R2",
    band: "B",
    applicability: {
      feedstockVariability: true,
      spatialEffects: true,
      operationGuidance: false
    },
    scores: selectedScores
  });
  const result = engine.evaluateAssessment(config, input);

  assert.equal(result.targetEvaluation.roleMappingMeans.TD, 3);
  assert.equal(result.finalRole, "R1");
  assert.ok(result.targetEvaluation.failures.some((failure) => failure.criterion === "TD1"));
});

test("a criterion at 2 can pass R2 when the applicable dimension mean reaches 3", () => {
  const selectedScores = scores(4);
  Object.assign(selectedScores.TD, { TD1: 2, TD2: 3, TD3: 4 });
  const result = engine.evaluateAssessment(
    config,
    assessment({
      targetRole: "R2",
      band: "B",
      applicability: {
        feedstockVariability: true,
        spatialEffects: true,
        operationGuidance: false
      },
      scores: selectedScores
    })
  );

  assert.equal(result.targetEvaluation.roleMappingMeans.TD, 3);
  assert.equal(result.finalRole, "R2");
});

test("inapplicable alpha_TD2 and alpha_TD3 do not enter the R2 mean", () => {
  const selectedScores = scores(4);
  Object.assign(selectedScores.TD, { TD1: 3, TD2: 1, TD3: 1 });
  const input = assessment({ targetRole: "R2", band: "B", scores: selectedScores });
  const result = engine.evaluateAssessment(config, input);

  assert.deepEqual(result.targetEvaluation.applicableCriteria.TD, ["TD1"]);
  assert.equal(result.targetEvaluation.roleMappingMeans.TD, 3);
  assert.equal(result.finalRole, "R2");
});

test("alpha_MT does not constrain R2 when operation guidance is false", () => {
  const selectedScores = scores(4);
  Object.assign(selectedScores.MT, { MT1: 1, MT2: 1 });
  const result = engine.evaluateAssessment(
    config,
    assessment({ targetRole: "R2", band: "B", scores: selectedScores })
  );

  assert.deepEqual(result.targetEvaluation.applicableCriteria.MT, []);
  assert.equal(result.targetEvaluation.roleMappingMeans.MT, null);
  assert.equal(result.finalRole, "R2");
});

test("alpha_MT must average at least 3 when operation guidance applies to R2", () => {
  const selectedScores = scores(4);
  Object.assign(selectedScores.MT, { MT1: 2, MT2: 3 });
  const result = engine.evaluateAssessment(
    config,
    assessment({
      targetRole: "R2",
      band: "B",
      applicability: {
        feedstockVariability: false,
        spatialEffects: false,
        operationGuidance: true
      },
      scores: selectedScores
    })
  );

  assert.equal(result.targetEvaluation.roleMappingMeans.MT, 2.5);
  assert.equal(result.finalRole, "R1");
  assert.ok(result.targetEvaluation.failures.some((failure) => failure.type === "dimensionMean"));
});

test("alpha_MT scores 2 and 4 pass R2 when operation guidance applies", () => {
  const selectedScores = scores(4);
  Object.assign(selectedScores.MT, { MT1: 2, MT2: 4 });
  const result = engine.evaluateAssessment(
    config,
    assessment({
      targetRole: "R2",
      band: "B",
      applicability: {
        feedstockVariability: false,
        spatialEffects: false,
        operationGuidance: true
      },
      scores: selectedScores
    })
  );

  assert.equal(result.targetEvaluation.roleMappingMeans.MT, 3);
  assert.equal(result.finalRole, "R2");
});

test("R3 always checks alpha_MT1 and alpha_MT2", () => {
  const selectedScores = scores(4);
  selectedScores.MT.MT1 = 3;
  const result = engine.evaluateAssessment(config, assessment({ scores: selectedScores }));

  assert.equal(result.finalRole, "R2");
  assert.ok(result.targetEvaluation.failures.some((failure) => failure.criterion === "MT1"));
});

test("R3 checks conditional alpha_TD2 when feedstock variability applies", () => {
  const selectedScores = scores(4);
  selectedScores.TD.TD2 = 3;
  const result = engine.evaluateAssessment(
    config,
    assessment({
      applicability: {
        feedstockVariability: true,
        spatialEffects: false,
        operationGuidance: false
      },
      scores: selectedScores
    })
  );

  assert.equal(result.finalRole, "R2");
  assert.ok(result.targetEvaluation.failures.some((failure) => failure.criterion === "TD2"));
});

test("R1 requires demonstrated task performance and at least Band B", () => {
  const result = engine.evaluateAssessment(
    config,
    assessment({
      targetRole: "R1",
      band: "B",
      offlineTaskDemonstrated: false
    })
  );
  assert.equal(result.finalRole, "none");
  assert.equal(result.targetEvaluation.failures[0].type, "task");
});

test("diagnostic limiting criteria use all eight scored criteria", () => {
  const selectedScores = scores(5);
  selectedScores.TD.TD2 = 1;
  selectedScores.DM.DM1 = 3;
  selectedScores.DM.DM2 = 3;
  const limits = engine.findDiagnosticLimitingCriteria(config, selectedScores);
  const identifiers = limits.map((item) => item.criterion);

  assert.ok(identifiers.includes("TD2"));
  assert.ok(identifiers.includes("DM1"));
  assert.ok(identifiers.includes("DM2"));
});
