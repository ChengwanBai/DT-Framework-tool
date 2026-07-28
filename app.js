const state = {
  specification: {
    systemBoundary: "",
    deploymentSetting: "",
    operatingEnvelope: "",
    operationalTask: "",
    modelConfiguration: "",
    decisionInterval: "",
    targetRole: ""
  },
  trl: "",
  band: "",
  offlineTaskDemonstrated: "",
  applicability: {
    feedstockVariability: "",
    spatialEffects: "",
    operationGuidance: ""
  },
  alpha: {
    TD: {},
    DM: {},
    MT: {}
  },
  result: null
};

const specificationFields = [
  ["systemBoundary", "System boundary", false],
  ["deploymentSetting", "Deployment setting", false],
  ["operatingEnvelope", "Operating envelope", false],
  ["operationalTask", "Operational task", true],
  ["modelConfiguration", "Model configuration", false],
  ["decisionInterval", "Update and decision interval", false]
];

document.addEventListener("DOMContentLoaded", () => {
  loadTRL();
  loadBands();
  renderAlphaCriteria();
  bindInputs();
  bindControls();
  renderWarnings();
  renderResults();
});

function loadTRL() {
  const select = document.getElementById("trlSelect");
  Object.entries(scoringConfig.trl.levels).forEach(([level, item]) => {
    const option = document.createElement("option");
    option.value = level;
    option.textContent = `TRL ${level} — ${item.label}`;
    select.appendChild(option);
  });

  select.addEventListener("change", (event) => {
    state.trl = event.target.value;
    renderTRLDescription();
    renderResults();
  });
}

function loadBands() {
  const select = document.getElementById("bandSelect");
  ["A", "B", "C"].forEach((band) => {
    const item = scoringConfig.drl.bands[band];
    const option = document.createElement("option");
    option.value = band;
    option.textContent = `${item.label} — ${item.shortLabel}`;
    select.appendChild(option);
  });

  select.addEventListener("change", (event) => {
    state.band = event.target.value;
    renderBandDescription();
    renderResults();
  });
}

function renderTRLDescription() {
  const target = document.getElementById("trlDescription");
  if (!state.trl) {
    target.innerHTML = "<p>Select a TRL to view its definition.</p>";
    return;
  }

  const item = scoringConfig.trl.levels[state.trl];
  target.innerHTML = `
    <p><strong>TRL ${state.trl}: ${escapeHTML(item.label)}</strong></p>
    <p>${escapeHTML(item.description)}</p>
    <p><small>Record this context when transferring the result to another scale or operating condition.</small></p>
  `;
}

function renderBandDescription() {
  const target = document.getElementById("bandDescription");
  if (!state.band) {
    target.innerHTML = "<p>Select Band A, B, or C to view its role implication.</p>";
    return;
  }

  const item = scoringConfig.drl.bands[state.band];
  const roleText = item.maximumRole
    ? `Can support roles up to ${item.maximumRole}, subject to all task and α requirements.`
    : "Confirms data availability but is insufficient for assigning a role ceiling.";
  target.innerHTML = `
    <p><strong>${escapeHTML(item.label)}: ${escapeHTML(item.shortLabel)}</strong></p>
    <p><span class="badge ${bandBadgeClass(state.band)}">${escapeHTML(item.primaryDimension)}</span></p>
    <p>${escapeHTML(item.description)}</p>
    <p><strong>${escapeHTML(item.cumulativeNote)}</strong></p>
    <p><small>${escapeHTML(roleText)}</small></p>
  `;
}

function renderAlphaCriteria() {
  const target = document.getElementById("alphaCriteria");
  target.innerHTML = ["TD", "DM", "MT"].map((dimensionKey) => {
    const dimension = scoringConfig.alpha[dimensionKey];
    const criteria = dimension.criteria.map((criterion) => renderCriterion(dimensionKey, criterion)).join("");

    return `
      <article class="alpha-dimension" aria-labelledby="${dimensionKey}-title">
        <div class="dimension-header">
          <div>
            <h3 id="${dimensionKey}-title">${alphaNotation(dimensionKey)}: ${escapeHTML(dimension.title)}</h3>
            <p>${escapeHTML(dimension.shortDefinition)}</p>
          </div>
          <span class="badge badge-r1" id="${dimensionKey}-score">Incomplete</span>
        </div>
        <div class="criteria-grid">${criteria}</div>
      </article>
    `;
  }).join("");

  target.addEventListener("click", handleRatingClick);
  target.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target.classList.contains("rating-option")) {
      event.preventDefault();
      event.target.click();
    }
  });
}

function renderCriterion(dimensionKey, criterion) {
  const options = criterion.options.map((option) => `
    <button
      class="rating-option"
      type="button"
      data-dimension="${dimensionKey}"
      data-criterion="${criterion.id}"
      data-score="${option.score}"
      aria-pressed="false"
    >
      <span class="rating-score">${option.score}</span>
      <span class="rating-text">${escapeHTML(option.description)}</span>
    </button>
  `).join("");

  return `
    <article class="criterion-card">
      <div class="criterion-topline">
        <div>
          <h3>${escapeHTML(criterion.label)}</h3>
          <p class="gate-note">${renderAlphaText(getGateNote(criterion.id))}</p>
        </div>
        <span class="criterion-id">${alphaCriterionNotation(criterion.id)}</span>
      </div>
      <div class="rating-list" role="group" aria-label="α_${criterion.id} ${escapeHTML(criterion.label)} rating options">
        ${options}
      </div>
    </article>
  `;
}

function getGateNote(criterionId) {
  if (criterionId === "TD2" || criterionId === "TD3") {
    return `Conditional: when applicable, α_${criterionId} enters the R2 α_TD mean and must be at least 2; R3 requires α_${criterionId} ≥ 4.`;
  }
  if (criterionId.startsWith("TD")) {
    return `R2: included in the α_TD mean and must be at least 2. R3: α_${criterionId} must be at least 4.`;
  }
  if (criterionId.startsWith("DM")) {
    return `R2: included in the α_DM mean and must be at least 2. R3: α_${criterionId} must be at least 4.`;
  }
  return `R2: included in the α_MT mean only when outputs guide operation, and must then be at least 2. R3: α_${criterionId} is always applicable and must be at least 4.`;
}

function handleRatingClick(event) {
  const button = event.target.closest(".rating-option");
  if (!button) return;

  const { dimension, criterion, score } = button.dataset;
  state.alpha[dimension][criterion] = Number(score);

  document
    .querySelectorAll(`.rating-option[data-dimension="${dimension}"][data-criterion="${criterion}"]`)
    .forEach((option) => {
      const selected = option === button;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-pressed", String(selected));
    });

  renderDimensionBadges();
  renderResults();
}

function renderDimensionBadges() {
  const means = FrameworkEngine.calculateDimensionMeans(scoringConfig, state.alpha);
  ["TD", "DM", "MT"].forEach((dimension) => {
    const badge = document.getElementById(`${dimension}-score`);
    const value = means[dimension];
    badge.innerHTML = Number.isFinite(value)
      ? `${alphaNotation(dimension)} mean ${value.toFixed(2)}`
      : "Incomplete";
    badge.className = "badge badge-r1";
  });
}

function bindInputs() {
  specificationFields.forEach(([id]) => {
    document.getElementById(id).addEventListener("input", (event) => {
      state.specification[id] = event.target.value;
      renderResults();
    });
  });

  document.getElementById("targetRole").addEventListener("change", (event) => {
    state.specification.targetRole = event.target.value;
    renderResults();
  });

  document.getElementById("offlineTaskDemonstrated").addEventListener("change", (event) => {
    state.offlineTaskDemonstrated = event.target.value;
    renderResults();
  });

  ["feedstockVariability", "spatialEffects", "operationGuidance"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (event) => {
      state.applicability[id] = event.target.value;
      renderResults();
    });
  });
}

function renderResults() {
  const panel = document.getElementById("resultPanel");
  const missing = getMissingInputs();
  const complete = missing.length === 0;
  document.getElementById("copyButton").disabled = !complete;
  document.getElementById("downloadButton").disabled = !complete;

  if (!complete) {
    state.result = null;
    panel.innerHTML = `
      <div class="result-empty">
        <h3>Complete all inputs to calculate the role ceiling.</h3>
        <p>Missing inputs: ${renderAlphaText(missing.join(", "))}.</p>
        <p>The result appears only after the assessment boundary, TRL, data band, applicability decisions, and all eight α criteria are complete.</p>
      </div>
    `;
    return;
  }

  const assessment = buildEngineAssessment();
  const evaluation = FrameworkEngine.evaluateAssessment(scoringConfig, assessment);
  const diagnosticMeans = FrameworkEngine.calculateDimensionMeans(scoringConfig, state.alpha);
  const r2RoleMappingMeans = FrameworkEngine.calculateRoleMappingMeans(scoringConfig, "R2", assessment);
  const r2ApplicableCriteria = FrameworkEngine.getApplicableCriteria(scoringConfig, "R2", assessment.applicability);
  const targetFailures = evaluation.targetEvaluation.failures;
  const allFailures = evaluation.consideredRoles.flatMap((role) => evaluation.evaluations[role].failures);
  const diagnosticLimitingCriteria = FrameworkEngine.findDiagnosticLimitingCriteria(scoringConfig, state.alpha);
  const improvementActions = FrameworkEngine.improvementActions(targetFailures);
  const trlItem = scoringConfig.trl.levels[state.trl];
  const bandItem = scoringConfig.drl.bands[state.band];
  const roleDef = scoringConfig.roleDefinitions[evaluation.finalRole];
  const explanation = generateExplanation(evaluation, trlItem, bandItem);
  const failedConditions = uniqueByMessage(allFailures);

  state.result = {
    toolkit: scoringConfig.metadata.toolkitName,
    frameworkVersion: scoringConfig.metadata.version,
    specification: {
      ...state.specification,
      targetRole: assessment.targetRole
    },
    trl: {
      score: Number(state.trl),
      label: trlItem.label,
      description: trlItem.description,
      roleMappingUse: "Contextual maturity descriptor; not an independent role gate in this procedure."
    },
    dataReadiness: {
      band: state.band,
      label: bandItem.label,
      description: bandItem.description,
      cumulativeIncludes: bandItem.includes,
      cumulativeNote: bandItem.cumulativeNote
    },
    offlineTaskDemonstrated: assessment.offlineTaskDemonstrated,
    applicability: assessment.applicability,
    alpha: {
      diagnosticMeans,
      roleMappingMeans: {
        R2: r2RoleMappingMeans,
        targetRole: evaluation.targetEvaluation.roleMappingMeans
      },
      applicableCriteria: {
        R2: r2ApplicableCriteria,
        targetRole: evaluation.targetEvaluation.applicableCriteria
      },
      subCriteria: getSubCriterionResults(),
      notation: "α_TD, α_DM, α_MT, and criterion identifiers are formatted with subscripts in the interface."
    },
    targetRole: assessment.targetRole,
    targetMet: evaluation.targetMet,
    finalRole: evaluation.finalRole === "none" ? null : evaluation.finalRole,
    finalRoleTitle: roleDef.title,
    roleChecks: evaluation.consideredRoles.map((role) => evaluation.evaluations[role]),
    targetFailedConditions: targetFailures,
    failedConditions,
    diagnosticLimitingCriteria,
    improvementActions,
    explanation
  };

  panel.innerHTML = `
    <div class="result-grid">
      ${renderMetric(
        "Supported role ceiling",
        evaluation.finalRole === "none" ? "None assigned" : `${evaluation.finalRole}: ${roleDef.title}`,
        roleDef.description,
        roleBadgeClass(evaluation.finalRole)
      )}
      ${renderMetric(
        "Target role",
        `${assessment.targetRole}: ${scoringConfig.roleDefinitions[assessment.targetRole].title}`,
        evaluation.targetMet ? "All applicable target-role conditions are met." : `${targetFailures.length} target-role condition(s) are not met.`,
        evaluation.targetMet ? "badge-high" : "badge-low"
      )}
      ${renderMetric(
        "Data readiness",
        bandItem.label,
        bandItem.description,
        bandBadgeClass(state.band)
      )}
      ${renderMetric(
        "TRL context",
        `TRL ${state.trl}: ${trlItem.label}`,
        "TRL records the maturity and covered conditions; it does not independently raise or lower the role in this procedure."
      )}
      ${renderMetric(
        "Diagnostic means",
        formatMeansHTML(diagnosticMeans),
        "Complete-interface means across all eight scored criteria.",
        "badge-r1",
        true
      )}
      ${renderMetric(
        "Means used for R2 mapping",
        formatMeansHTML(r2RoleMappingMeans),
        "Calculated only from criteria applicable to R2 for the stated task.",
        "badge-r1",
        true
      )}
    </div>

    <div class="detail-section">
      <h3>Unmet role requirements and fallback checks</h3>
      ${renderRoleChecks(evaluation)}
    </div>

    <div class="detail-section">
      <h3>Diagnostic limiting criteria</h3>
      ${renderDiagnosticLimitingCriteria(diagnosticLimitingCriteria)}
    </div>

    <div class="detail-section">
      <h3>Candidate improvement actions</h3>
      ${improvementActions.length
        ? `<ul>${improvementActions.map((item) => `<li>${renderAlphaText(item)}</li>`).join("")}</ul>`
        : "<p>No improvement action is required to meet the selected target role.</p>"}
    </div>

    <div class="detail-section">
      <h3>Eight-criterion breakdown</h3>
      <ul>${getSubCriterionResults().map((item) => `
        <li>${alphaCriterionNotation(item.id)} ${escapeHTML(item.label)}: <strong>${item.score}</strong></li>
      `).join("")}</ul>
    </div>

    <div class="detail-section">
      <h3>Interpretation</h3>
      <p>${escapeHTML(explanation)}</p>
    </div>
  `;
}

function renderRoleChecks(evaluation) {
  return evaluation.consideredRoles.map((role) => {
    const result = evaluation.evaluations[role];
    const status = result.passed ? "Met" : "Not met";
    const details = result.passed
      ? "<p>All applicable conditions are met.</p>"
      : `<ul>${result.failures.map((failure) => `<li>${renderAlphaText(failure.message)}</li>`).join("")}</ul>`;
    return `
      <article class="role-check">
        <h4><span class="badge ${result.passed ? "badge-high" : "badge-low"}">${role} — ${status}</span></h4>
        ${details}
      </article>
    `;
  }).join("");
}

function renderDiagnosticLimitingCriteria(items) {
  const grouped = ["TD", "DM", "MT"].map((dimension) => {
    const matches = items.filter((item) => item.dimension === dimension);
    if (!matches.length) return "";
    const labels = matches
      .map((item) => `${alphaCriterionNotation(item.criterion)} ${escapeHTML(item.label)} (${item.score})`)
      .join("; ");
    return `<li>${alphaNotation(dimension)}: ${labels}</li>`;
  }).join("");
  return `<ul>${grouped}</ul>`;
}

function generateExplanation(evaluation, trlItem, bandItem) {
  const trlContext = `The assessment records TRL ${state.trl} (${trlItem.label}) for the stated scale and conditions; transfer outside that boundary requires reassessment.`;

  if (evaluation.finalRole === "none") {
    return `No role ceiling can be assigned because none of the roles at or below the ${evaluation.targetRole} target meets every applicable condition. ${bandItem.label} and the individual failed conditions above identify the immediate evidence gaps. ${trlContext}`;
  }

  if (evaluation.targetMet) {
    return `The selected target ${evaluation.targetRole} is supported because its cumulative minimum data band and all applicable role-mapping conditions are met. R2 uses applicable interface means plus a criterion floor; R3 requires every applicable criterion to reach 4. ${trlContext}`;
  }

  return `The target ${evaluation.targetRole} is not supported, so lower roles were tested in descending order. ${evaluation.finalRole} is the highest role meeting every applicable condition. The unmet mean, criterion-floor, task, or data-band requirements above determine the gap. ${trlContext}`;
}

function buildEngineAssessment() {
  return {
    targetRole: state.specification.targetRole,
    band: state.band,
    offlineTaskDemonstrated: state.offlineTaskDemonstrated === "yes",
    applicability: {
      feedstockVariability: state.applicability.feedstockVariability === "yes",
      spatialEffects: state.applicability.spatialEffects === "yes",
      operationGuidance: state.applicability.operationGuidance === "yes"
    },
    scores: state.alpha
  };
}

function renderMetric(label, value, description, badgeClass = "badge-r1", valueIsHTML = false) {
  return `
    <article class="metric">
      <div class="metric-label">${escapeHTML(label)}</div>
      <div class="metric-value"><span class="badge ${badgeClass}">${valueIsHTML ? value : escapeHTML(value)}</span></div>
      <p>${escapeHTML(description)}</p>
    </article>
  `;
}

function getMissingInputs() {
  const missing = [];
  specificationFields.forEach(([id, label, required]) => {
    if (required && !state.specification[id].trim()) missing.push(label);
  });
  if (!state.specification.targetRole) missing.push("Target role");
  if (!state.offlineTaskDemonstrated) missing.push("Offline/open-loop task evidence");
  if (!state.trl) missing.push("TRL");
  if (!state.band) missing.push("Data readiness band");
  if (!state.applicability.feedstockVariability) missing.push("α_TD2 applicability");
  if (!state.applicability.spatialEffects) missing.push("α_TD3 applicability");
  if (!state.applicability.operationGuidance) missing.push("α_MT applicability for R2");

  getAllCriteria().forEach(({ dimension, criterion }) => {
    if (!Number.isFinite(state.alpha[dimension][criterion.id])) missing.push(`α_${criterion.id}`);
  });
  return missing;
}

function getAllCriteria() {
  return ["TD", "DM", "MT"].flatMap((dimension) =>
    scoringConfig.alpha[dimension].criteria.map((criterion) => ({ dimension, criterion }))
  );
}

function getSubCriterionResults() {
  return getAllCriteria().map(({ dimension, criterion }) => {
    const score = state.alpha[dimension][criterion.id];
    return {
      dimension: `α_${dimension}`,
      id: criterion.id,
      notation: `α_${criterion.id}`,
      label: criterion.label,
      score,
      description: criterion.options.find((option) => option.score === score)?.description || ""
    };
  });
}

function resetAssessment() {
  specificationFields.forEach(([id]) => {
    state.specification[id] = "";
    document.getElementById(id).value = "";
  });
  state.specification.targetRole = "";
  state.trl = "";
  state.band = "";
  state.offlineTaskDemonstrated = "";
  state.applicability = { feedstockVariability: "", spatialEffects: "", operationGuidance: "" };
  state.alpha = { TD: {}, DM: {}, MT: {} };
  state.result = null;

  ["targetRole", "trlSelect", "bandSelect", "offlineTaskDemonstrated", "feedstockVariability", "spatialEffects", "operationGuidance"]
    .forEach((id) => {
      document.getElementById(id).value = "";
    });
  document.querySelectorAll(".rating-option").forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  });
  renderTRLDescription();
  renderBandDescription();
  renderDimensionBadges();
  renderResults();
}

function copySummary() {
  if (!state.result) return;
  const summary = buildSummaryText(state.result);

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(summary).then(() => showToast("Summary copied."));
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = summary;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  showToast("Summary copied.");
}

function downloadJSON() {
  if (!state.result) return;
  const blob = new Blob([JSON.stringify(state.result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dt-readiness-assessment.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildSummaryText(result) {
  const finalRole = result.finalRole || "no assigned role";
  const targetStatus = result.targetMet ? "met" : "not met";
  const failures = result.targetFailedConditions.length
    ? result.targetFailedConditions.map((item) => item.message).join(" ")
    : "No target-role conditions failed.";
  const diagnostic = result.alpha.diagnosticMeans;
  const r2Means = result.alpha.roleMappingMeans.R2;
  const r2Applicable = Object.values(result.alpha.applicableCriteria.R2)
    .flat()
    .map((id) => `α_${id}`)
    .join(", ");
  const mappingMeanText = ["TD", "DM", "MT"]
    .map((dimension) => `α_${dimension} = ${Number.isFinite(r2Means[dimension]) ? r2Means[dimension].toFixed(2) : "not applicable"}`)
    .join(", ");
  return `Assessment summary: target ${result.targetRole} ${targetStatus}; supported role ceiling = ${finalRole}. TRL = ${result.trl.score}; cumulative data readiness = Band ${result.dataReadiness.band}. Diagnostic means: α_TD = ${diagnostic.TD.toFixed(2)}, α_DM = ${diagnostic.DM.toFixed(2)}, α_MT = ${diagnostic.MT.toFixed(2)}. R2 applicable criteria: ${r2Applicable}. R2 role-mapping means: ${mappingMeanText}. Target-role findings: ${failures}`;
}

function bindControls() {
  document.getElementById("resetButton").addEventListener("click", resetAssessment);
  document.getElementById("copyButton").addEventListener("click", copySummary);
  document.getElementById("downloadButton").addEventListener("click", downloadJSON);
}

function renderWarnings() {
  const target = document.getElementById("configWarnings");
  if (!scoringConfig.warnings.length) {
    target.hidden = true;
    return;
  }
  target.hidden = false;
  target.innerHTML = scoringConfig.warnings
    .map((warning) => `<div class="warning" role="status">${escapeHTML(warning)}</div>`)
    .join("");
}

function roleBadgeClass(role) {
  return {
    none: "badge-low",
    R1: "badge-r1",
    R2: "badge-r2",
    R3: "badge-r3"
  }[role] || "badge-r1";
}

function bandBadgeClass(band) {
  return {
    C: "badge-low",
    B: "badge-medium",
    A: "badge-high"
  }[band] || "badge-r1";
}

function uniqueByMessage(items) {
  const messages = new Set();
  return items.filter((item) => {
    if (messages.has(item.message)) return false;
    messages.add(item.message);
    return true;
  });
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2400);
}

function alphaNotation(dimension) {
  return `<span class="alpha-symbol">α<sub>${escapeHTML(dimension)}</sub></span>`;
}

function alphaCriterionNotation(criterionId) {
  return `<span class="alpha-symbol">α<sub>${escapeHTML(criterionId)}</sub></span>`;
}

function renderAlphaText(value) {
  return escapeHTML(value).replace(
    /α_(TD|DM|MT)([123])?/g,
    (_, dimension, criterionNumber = "") =>
      `<span class="alpha-symbol">α<sub>${dimension}${criterionNumber}</sub></span>`
  );
}

function formatMeansHTML(means) {
  return ["TD", "DM", "MT"]
    .map((dimension) => {
      const value = means[dimension];
      return `${alphaNotation(dimension)} ${Number.isFinite(value) ? value.toFixed(2) : "not applicable"}`;
    })
    .join(" | ");
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
