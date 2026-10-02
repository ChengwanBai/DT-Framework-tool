const FrameworkEngine = (() => {
  const ROLE_ORDER = ["R1", "R2", "R3"];
  const DIMENSIONS = ["TD", "DM", "MT"];
  const roleRank = { R1: 1, R2: 2, R3: 3 };

  function dimensionOf(criterionId) {
    return criterionId.slice(0, 2);
  }

  function getScore(scores, criterionId) {
    return scores?.[dimensionOf(criterionId)]?.[criterionId];
  }

  function getCriterion(config, criterionId) {
    const dimension = dimensionOf(criterionId);
    return config.alpha[dimension]?.criteria.find((item) => item.id === criterionId) || null;
  }

  function allCriterionIds(config) {
    return DIMENSIONS.flatMap((dimension) => config.alpha[dimension].criteria.map((item) => item.id));
  }

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function mean(values) {
    if (!values.length || values.some((value) => !Number.isFinite(value))) return null;
    return round2(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  function alphaPlain(id) {
    return `α_${id}`;
  }

  /**
   * Table 5 requirements for a role. Conditional criteria (α_TD2, α_TD3 and, for R2, α_MT2)
   * enter the role test only when their condition applies to the assessed task.
   */
  function getRequirements(config, role, applicability = {}) {
    const rules = config.roleRequirements[role];
    if (!rules) return [];
    return rules.criteria
      .filter((requirement) => !requirement.condition || applicability[requirement.condition] === true)
      .map((requirement) => ({
        ...requirement,
        dimension: dimensionOf(requirement.id),
        label: getCriterion(config, requirement.id)?.label || requirement.id,
        conditional: Boolean(requirement.condition)
      }));
  }

  /**
   * Equation (1): arithmetic mean of all criteria in each dimension.
   * The means are descriptive only and are never used as role thresholds.
   */
  function calculateDimensionMeans(config, scores) {
    return Object.fromEntries(
      DIMENSIONS.map((dimension) => {
        const values = config.alpha[dimension].criteria.map((criterion) => scores?.[dimension]?.[criterion.id]);
        return [dimension, mean(values)];
      })
    );
  }

  /**
   * Test one role against Table 5. Every applicable threshold must be met;
   * a high score in one criterion cannot compensate for a failed requirement elsewhere.
   */
  function evaluateRole(config, role, assessment) {
    const rules = config.roleRequirements[role];
    const failures = [];
    const bandRank = config.drl.rank;
    const bandMet = (bandRank[assessment.band] || 0) >= bandRank[rules.minimumBand];

    if (!bandMet) {
      failures.push({
        type: "band",
        role,
        required: rules.minimumBand,
        actual: assessment.band,
        message: `${role} requires at least DRL Band ${rules.minimumBand}; Band ${assessment.band || "–"} is assigned.`
      });
    }

    if (rules.taskPerformanceRequired && assessment.offlineTaskDemonstrated !== true) {
      failures.push({
        type: "task",
        role,
        message:
          "R1 requires demonstrated performance of the specified offline or open-loop task using the available data and model within the assessment boundary."
      });
    }

    const requirements = getRequirements(config, role, assessment.applicability).map((requirement) => {
      const actual = getScore(assessment.scores, requirement.id);
      const met = Number.isFinite(actual) && actual >= requirement.minimum;
      return {
        ...requirement,
        actual: Number.isFinite(actual) ? actual : null,
        met,
        margin: Number.isFinite(actual) ? actual - requirement.minimum : null
      };
    });

    requirements
      .filter((requirement) => !requirement.met)
      .forEach((requirement) => {
        failures.push({
          type: "criterion",
          role,
          criterion: requirement.id,
          dimension: requirement.dimension,
          label: requirement.label,
          required: requirement.minimum,
          actual: requirement.actual,
          conditional: requirement.conditional,
          message: `${alphaPlain(requirement.id)} (${requirement.label}) must be at least ${requirement.minimum} for ${role}; the score is ${Number.isFinite(requirement.actual) ? requirement.actual : "unresolved"}.`
        });
      });

    return {
      role,
      passed: failures.length === 0,
      minimumBand: rules.minimumBand,
      bandMet,
      taskPerformanceRequired: Boolean(rules.taskPerformanceRequired),
      requirements,
      failures
    };
  }

  /**
   * Section 4.1 / Figure 6: start at the target role; if any threshold is unmet,
   * record the unmet thresholds and test the next lower role. The role ceiling is
   * the highest tested role for which every applicable threshold is met.
   */
  function evaluateAssessment(config, assessment) {
    const targetRank = roleRank[assessment.targetRole];
    const consideredRoles = [];
    const evaluations = {};
    let finalRole = "none";

    for (let rank = targetRank; rank >= 1; rank -= 1) {
      const role = ROLE_ORDER[rank - 1];
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

  /**
   * Section 4.3: within each dimension, the lowest-scoring criterion required for the
   * target role is the limiting criterion; ties are reported together.
   */
  function findLimitingCriteria(config, targetRole, applicability, scores) {
    const requirements = getRequirements(config, targetRole, applicability);
    return DIMENSIONS.flatMap((dimension) => {
      const candidates = requirements
        .filter((requirement) => requirement.dimension === dimension)
        .map((requirement) => ({
          dimension,
          criterion: requirement.id,
          label: requirement.label,
          score: getScore(scores, requirement.id)
        }))
        .filter((item) => Number.isFinite(item.score));
      if (!candidates.length) return [];
      const minimumScore = Math.min(...candidates.map((item) => item.score));
      return candidates.filter((item) => item.score === minimumScore);
    });
  }

  /**
   * Section 5.2: margins around the assigned ceiling. Criteria that meet the ceiling
   * role's threshold exactly would lower the ceiling after a one-point reduction; the
   * failures of the next higher tested role show what progression would require.
   */
  function thresholdMargins(evaluation) {
    const ceilingRole = evaluation.finalRole;
    const ceilingEvaluation = ceilingRole === "none" ? null : evaluation.evaluations[ceilingRole];
    const atThreshold = ceilingEvaluation
      ? ceilingEvaluation.requirements
          .filter((requirement) => requirement.met && requirement.margin === 0)
          .map(({ id, label, dimension, minimum, actual }) => ({ criterion: id, label, dimension, minimum, actual }))
      : [];

    const nextRank = ceilingRole === "none" ? 1 : roleRank[ceilingRole] + 1;
    const nextRole = ROLE_ORDER[nextRank - 1];
    const nextEvaluation = nextRole ? evaluation.evaluations[nextRole] : null;

    return {
      ceilingRole,
      atThreshold,
      nextRole: nextEvaluation ? nextRole : null,
      nextRoleFailures: nextEvaluation ? nextEvaluation.failures : [],
      nextRoleCriterionCount: nextEvaluation
        ? nextEvaluation.failures.filter((failure) => failure.type === "criterion").length
        : 0,
      nextRoleNeedsBand: nextEvaluation
        ? nextEvaluation.failures.find((failure) => failure.type === "band")?.required || null
        : null
    };
  }

  /**
   * Section 4.5: every unmet requirement of a tested role is a deployment constraint.
   * Constraints are grouped by interface and are not ranked.
   */
  function deploymentConstraints(config, evaluation) {
    const failures = evaluation.consideredRoles.flatMap((role) => evaluation.evaluations[role].failures);
    const byKey = new Map();

    failures.forEach((failure) => {
      const key = failure.type === "criterion" ? failure.criterion : failure.type === "band" ? `band-${failure.required}` : "task";
      if (!byKey.has(key)) {
        let entry;
        if (failure.type === "criterion") {
          const dimension = config.alpha[failure.dimension];
          const criterion = getCriterion(config, failure.criterion);
          entry = {
            type: "criterion",
            key,
            interface: failure.dimension,
            criterion: failure.criterion,
            label: failure.label,
            actual: failure.actual,
            focus: dimension.constraintFocus,
            responsibility: dimension.responsibility,
            action: criterion?.action || "",
            requirements: []
          };
        } else if (failure.type === "band") {
          const guidance = config.constraintGuidance.band[failure.required];
          entry = {
            type: "band",
            key,
            interface: "DRL",
            label: `DRL Band ${failure.required}`,
            actual: failure.actual,
            focus: guidance.focus,
            responsibility: null,
            action: guidance.action,
            requirements: []
          };
        } else {
          entry = {
            type: "task",
            key,
            interface: "Task",
            label: "Demonstrated offline or open-loop task",
            actual: "not demonstrated",
            focus: config.constraintGuidance.task.focus,
            responsibility: null,
            action: config.constraintGuidance.task.action,
            requirements: []
          };
        }
        byKey.set(key, entry);
      }
      byKey.get(key).requirements.push({ role: failure.role, required: failure.required ?? null });
    });

    const order = ["band-B", "band-A", "task", ...allCriterionIds(config)];
    return [...byKey.values()]
      .map((entry) => ({
        ...entry,
        requirements: entry.requirements.sort((a, b) => roleRank[a.role] - roleRank[b.role])
      }))
      .sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  }

  return {
    allCriterionIds,
    calculateDimensionMeans,
    deploymentConstraints,
    evaluateAssessment,
    evaluateRole,
    findLimitingCriteria,
    getRequirements,
    thresholdMargins
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = FrameworkEngine;
}
