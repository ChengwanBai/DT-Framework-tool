const FrameworkEngine = (() => {
  const roleRank = { R1: 1, R2: 2, R3: 3 };
  const rankRole = { 1: "R1", 2: "R2", 3: "R3" };

  function getCriterion(config, criterionId) {
    for (const dimension of ["TD", "DM", "MT"]) {
      const criterion = config.alpha[dimension].criteria.find((item) => item.id === criterionId);
      if (criterion) return { dimension, criterion };
    }
    return null;
  }

  function getScore(scores, criterionId) {
    const dimension = criterionId.slice(0, 2);
    return scores[dimension]?.[criterionId];
  }

  function mean(values) {
    if (!values.length || values.some((value) => !Number.isFinite(value))) return null;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
  }

  function alphaPlain(id) {
    return `α_${id}`;
  }

  function getApplicableCriteria(config, role, applicability) {
    if (role === "R1") return { TD: [], DM: [], MT: [] };

    const rules = config.roleRules.applicableCriteria;
    const applicable = {
      TD: [...rules.TD.always],
      DM: [...rules.DM.always],
      MT: []
    };

    Object.entries(rules.TD.conditional).forEach(([condition, criterionId]) => {
      if (applicability[condition]) applicable.TD.push(criterionId);
    });

    if (rules.MT.alwaysFor.includes(role)) {
      applicable.MT.push(...rules.MT.criteria);
    } else if (
      rules.MT.conditionalFor[role] &&
      applicability[rules.MT.conditionalFor[role]]
    ) {
      applicable.MT.push(...rules.MT.criteria);
    }

    return applicable;
  }

  function calculateRoleMappingMeans(config, role, assessment) {
    const applicableCriteria = getApplicableCriteria(config, role, assessment.applicability);
    return Object.fromEntries(
      ["TD", "DM", "MT"].map((dimension) => {
        const criteria = applicableCriteria[dimension];
        const values = criteria.map((criterionId) => getScore(assessment.scores, criterionId));
        return [dimension, criteria.length ? mean(values) : null];
      })
    );
  }

  function evaluateRole(config, role, assessment) {
    const failures = [];
    const minimumBand = config.roleRules.minimumBand[role];
    const actualBandRank = config.roleRules.bandRank[assessment.band];
    const minimumBandRank = config.roleRules.bandRank[minimumBand];

    if (actualBandRank < minimumBandRank) {
      failures.push({
        type: "band",
        required: minimumBand,
        actual: assessment.band,
        message: `${role} requires at least Band ${minimumBand}; Band ${assessment.band} is selected.`
      });
    }

    if (role === "R1" && assessment.offlineTaskDemonstrated !== true) {
      failures.push({
        type: "task",
        message:
          "R1 requires demonstrated performance of the specified offline or open-loop task within the assessment boundary."
      });
    }

    const applicableCriteria = getApplicableCriteria(config, role, assessment.applicability);
    const roleMappingMeans = calculateRoleMappingMeans(config, role, assessment);

    if (role === "R2") {
      const dimensionMinimums = { ...config.roleRules.R2.dimensionMinimums };
      Object.entries(config.roleRules.R2.conditionalDimensionMinimums).forEach(
        ([condition, rule]) => {
          if (assessment.applicability[condition]) {
            dimensionMinimums[rule.dimension] = rule.minimum;
          }
        }
      );

      Object.entries(dimensionMinimums).forEach(([dimension, required]) => {
        const actual = roleMappingMeans[dimension];
        if (!Number.isFinite(actual) || actual < required) {
          failures.push({
            type: "dimensionMean",
            dimension,
            required,
            actual,
            criteria: applicableCriteria[dimension],
            message: `${alphaPlain(dimension)} role-mapping mean must be at least ${required}; the calculated mean is ${Number.isFinite(actual) ? actual.toFixed(2) : "not applicable"}.`
          });
        }
      });

      const criterionFloor = config.roleRules.R2.criterionFloor;
      Object.values(applicableCriteria).flat().forEach((criterionId) => {
        const actual = getScore(assessment.scores, criterionId);
        if (!Number.isFinite(actual) || actual < criterionFloor) {
          const match = getCriterion(config, criterionId);
          failures.push({
            type: "criterion",
            criterion: criterionId,
            label: match?.criterion.label || criterionId,
            required: criterionFloor,
            actual,
            message: `${alphaPlain(criterionId)} must be at least ${criterionFloor}; the selected score is ${Number.isFinite(actual) ? actual : "unresolved"}.`
          });
        }
      });
    }

    if (role === "R3") {
      const criterionFloor = config.roleRules.R3.criterionFloor;
      Object.values(applicableCriteria).flat().forEach((criterionId) => {
        const actual = getScore(assessment.scores, criterionId);
        if (!Number.isFinite(actual) || actual < criterionFloor) {
          const match = getCriterion(config, criterionId);
          failures.push({
            type: "criterion",
            criterion: criterionId,
            label: match?.criterion.label || criterionId,
            required: criterionFloor,
            actual,
            message: `${alphaPlain(criterionId)} must be at least ${criterionFloor}; the selected score is ${Number.isFinite(actual) ? actual : "unresolved"}.`
          });
        }
      });
    }

    return {
      role,
      passed: failures.length === 0,
      failures,
      applicableCriteria,
      roleMappingMeans
    };
  }

  function evaluateAssessment(config, assessment) {
    const targetRank = roleRank[assessment.targetRole];
    const consideredRoles = [];
    const evaluations = {};
    let finalRole = "none";

    for (let rank = targetRank; rank >= 1; rank -= 1) {
      const role = rankRole[rank];
      const evaluation = evaluateRole(config, role, assessment);
      consideredRoles.push(role);
      evaluations[role] = evaluation;
      if (evaluation.passed) {
        finalRole = role;
        break;
      }
    }

    return {
      targetRole: assessment.targetRole,
      finalRole,
      targetMet: finalRole === assessment.targetRole,
      consideredRoles,
      evaluations,
      targetEvaluation: evaluations[assessment.targetRole]
    };
  }

  function calculateDimensionMeans(config, scores) {
    return Object.fromEntries(
      ["TD", "DM", "MT"].map((dimension) => {
        const values = config.alpha[dimension].criteria
          .map((criterion) => scores[dimension]?.[criterion.id]);
        return [dimension, mean(values)];
      })
    );
  }

  function findDiagnosticLimitingCriteria(config, scores) {
    return ["TD", "DM", "MT"].flatMap((dimension) => {
      const candidates = config.alpha[dimension].criteria.map((criterion) => ({
        dimension,
        criterion: criterion.id,
        label: criterion.label,
        score: scores[dimension]?.[criterion.id]
      }));
      const minimumScore = Math.min(...candidates.map((item) => item.score));
      return candidates.filter((item) => item.score === minimumScore);
    });
  }

  function improvementActions(failures) {
    const actions = failures.map((failure) => {
      if (failure.type === "band") {
        return `Develop and document the cumulative data evidence needed to reach Band ${failure.required}.`;
      }
      if (failure.type === "task") {
        return "Demonstrate and document the specified offline or open-loop task within the stated boundary.";
      }
      if (failure.type === "dimensionMean") {
        return `Raise the ${alphaPlain(failure.dimension)} applicable-criteria mean from ${Number.isFinite(failure.actual) ? failure.actual.toFixed(2) : "not applicable"} to at least ${failure.required}.`;
      }
      return `Raise ${alphaPlain(failure.criterion)} (${failure.label}) from ${failure.actual} to at least ${failure.required} for the target role.`;
    });
    return [...new Set(actions)];
  }

  return {
    calculateDimensionMeans,
    calculateRoleMappingMeans,
    evaluateAssessment,
    evaluateRole,
    findDiagnosticLimitingCriteria,
    getApplicableCriteria,
    improvementActions
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = FrameworkEngine;
}
