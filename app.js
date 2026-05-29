const state = {
  trl: "",
  drl: "",
  alpha: {
    TD: {},
    DM: {},
    MT: {}
  },
  result: null
};

const roleRank = { R1: 1, R2: 2, R3: 3 };
const rankRole = { 1: "R1", 2: "R2", 3: "R3" };

document.addEventListener("DOMContentLoaded", () => {
  loadTRL();
  loadDRL();
  renderAlphaCriteria();
  renderWarnings();
  bindControls();
  renderResults();
});

function loadTRL() {
  const select = document.getElementById("trlSelect");
  Object.entries(scoringConfig.trl.levels).forEach(([level, item]) => {
    const option = document.createElement("option");
    option.value = level;
    option.textContent = `TRL ${level} - ${item.label}`;
    select.appendChild(option);
  });

  select.addEventListener("change", (event) => {
    state.trl = event.target.value;
    renderTRLDescription();
    renderResults();
  });
}

function loadDRL() {
  const select = document.getElementById("drlSelect");
  Object.entries(scoringConfig.drl.levels).forEach(([level, item]) => {
    const option = document.createElement("option");
    option.value = level;
    option.textContent = `DRL ${level} - ${item.label}`;
    select.appendChild(option);
  });

  select.addEventListener("change", (event) => {
    state.drl = event.target.value;
    renderDRLDescription();
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
  `;
}

function renderDRLDescription() {
  const target = document.getElementById("drlDescription");
  if (!state.drl) {
    target.innerHTML = "<p>Select a DRL to view its definition.</p>";
    return;
  }

  const item = scoringConfig.drl.levels[state.drl];
  target.innerHTML = `
    <p><strong>DRL ${state.drl}: ${escapeHTML(item.label)}</strong></p>
    <p><span class="badge badge-medium">${escapeHTML(item.band)}</span></p>
    <p>${escapeHTML(item.description)}</p>
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
            <h3 id="${dimensionKey}-title">${dimensionKey}: ${escapeHTML(dimension.title)}</h3>
            <p>${escapeHTML(dimension.shortDefinition)}</p>
          </div>
          <span class="badge badge-r1" id="${dimensionKey}-score">Incomplete</span>
        </div>
        <div class="criteria-grid">
          ${criteria}
        </div>
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
        <h3>${escapeHTML(criterion.label)}</h3>
        <span class="criterion-id">${criterion.id}</span>
      </div>
      <div class="rating-list" role="group" aria-label="${criterion.id} ${escapeHTML(criterion.label)} rating options">
        ${options}
      </div>
    </article>
  `;
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
  const scores = calculateAlphaScores();
  ["TD", "DM", "MT"].forEach((dimension) => {
    const badge = document.getElementById(`${dimension}-score`);
    if (!scores[dimension].complete) {
      badge.textContent = "Incomplete";
      badge.className = "badge badge-r1";
      return;
    }
    badge.textContent = `${scores[dimension].average.toFixed(2)}`;
    badge.className = `badge ${alignmentBadgeClass(scores[dimension].average)}`;
  });
}

function calculateAlphaScores() {
  const scores = {};
  ["TD", "DM", "MT"].forEach((dimensionKey) => {
    const criteria = scoringConfig.alpha[dimensionKey].criteria;
    const selectedScores = criteria
      .map((criterion) => state.alpha[dimensionKey][criterion.id])
      .filter((score) => Number.isFinite(score));
    const complete = selectedScores.length === criteria.length;
    const average = complete ? mean(selectedScores) : null;
    scores[dimensionKey] = { complete, average, selectedScores };
  });
  return scores;
}

function determineAlphaCandidateRole(alphaScores) {
  const thresholds = scoringConfig.alpha.thresholds;
  const moderate = thresholds.weakBelow;
  const strong = thresholds.strongAtOrAbove;
  const dimensions = {
    TD: alphaScores.TD.average,
    DM: alphaScores.DM.average,
    MT: alphaScores.MT.average
  };
  const r2CriticalMet = criticalCriteriaMet(scoringConfig.alpha.criticalCriteria.R2, moderate);
  const r3CriticalMet = criticalCriteriaMet(scoringConfig.alpha.criticalCriteria.R3, strong);

  if (
    dimensions.TD >= strong &&
    dimensions.DM >= strong &&
    dimensions.MT >= strong &&
    r3CriticalMet
  ) {
    return { role: "R3", reason: "All α dimensions and configured R3 critical criteria meet the strong-alignment threshold." };
  }

  if (dimensions.TD >= moderate && dimensions.DM >= moderate && r2CriticalMet) {
    return { role: "R2", reason: "Technology-data and data-model alignment meet the moderate threshold for online monitoring or soft sensing." };
  }

  return { role: "R1", reason: "The configured α gates do not yet support a defensible online monitoring role." };
}

function applyTRLBoundary(candidateRole, trl, drl) {
  const boundary = scoringConfig.roleRules.trlBoundary[trl];
  let maxRole = boundary.maxRole;

  if (boundary.conditionalR3 && candidateRole === "R3" && drl >= scoringConfig.roleRules.minimumDrlForR3) {
    maxRole = "R3";
  }

  const finalRank = Math.min(roleRank[candidateRole], roleRank[maxRole]);
  return {
    role: rankRole[finalRank],
    maxRole,
    capped: roleRank[candidateRole] > finalRank,
    note: boundary.note
  };
}

function applyDRLConfidence(role, drl) {
  const confidence = Object.values(scoringConfig.roleRules.drlConfidence)
    .find((item) => item.levels.includes(drl));
  let adjustedRole = role;
  let capped = false;

  if (role === "R3" && drl < scoringConfig.roleRules.minimumDrlForR3) {
    adjustedRole = "R2";
    capped = true;
  }

  return {
    role: adjustedRole,
    capped,
    label: confidence.label,
    level: confidence.label.toLowerCase().split(" ")[0],
    note: confidence.note
  };
}

function identifyLimitingDimensions(context) {
  const limits = [];
  const weakCriteria = [];
  const thresholds = scoringConfig.alpha.thresholds;
  const alphaAverages = context.alphaAverages;
  const minAlpha = Math.min(alphaAverages.TD, alphaAverages.DM, alphaAverages.MT);
  const weakest = Object.entries(alphaAverages)
    .filter(([, score]) => score === minAlpha)
    .map(([dimension]) => `α${dimension}`);

  limits.push(`Weakest α dimension: ${weakest.join(", ")} (${minAlpha.toFixed(2)}).`);

  getAllCriteria().forEach(({ dimension, criterion }) => {
    const score = state.alpha[dimension][criterion.id];
    if (score < thresholds.weakBelow) {
      weakCriteria.push(`${criterion.id} ${criterion.label} (${score})`);
    }
  });

  if (weakCriteria.length > 0) {
    limits.push(`Weak sub-criteria below ${thresholds.weakBelow}: ${weakCriteria.join("; ")}.`);
  }

  if (context.trlBoundary.capped) {
      limits.push(`TRL constrains the α-based candidate role ${context.alphaCandidate.role} to ${context.trlBoundary.role}.`);
  }

  if (context.drlConfidence.capped) {
    limits.push(`DRL is below the configured minimum for R3 evidence support.`);
  }

  if (context.drlConfidence.level !== "high") {
    limits.push(`DRL provides ${context.drlConfidence.label.toLowerCase()} rather than high confidence.`);
  }

  if (context.finalRole !== "R3") {
    const belowStrong = Object.entries(alphaAverages)
      .filter(([, score]) => score < thresholds.strongAtOrAbove)
      .map(([dimension]) => `α${dimension}`);
    if (belowStrong.length > 0) {
      limits.push(`Progression to R3 is limited by ${belowStrong.join(", ")} relative to the strong-alignment threshold.`);
    }
  }

  return {
    limitingDimensions: unique(limits),
    weakCriteria
  };
}

function generateExplanation(context) {
  const finalRole = context.finalRole;
  const trlPrefix = context.trlBoundary.capped
    ? ` The TRL boundary prevents the stronger α-based candidate role (${context.alphaCandidate.role}) from being claimed as a current deployment role.`
    : "";
  const drlSuffix = ` DRL ${context.drl} provides ${context.drlConfidence.label.toLowerCase()} for the assignment.`;

  if (finalRole === "R1") {
    return `The assessment indicates an R1 role ceiling. The system can support offline or open-loop analysis, but the current alignment among technology, data, model, and operational task is insufficient for routine online monitoring or closed-loop deployment.${trlPrefix}${drlSuffix}`;
  }

  if (finalRole === "R2") {
    return `The assessment indicates an R2 role ceiling. The system has sufficient technology-data and data-model alignment for online monitoring or soft sensing, but remaining limitations in model-task alignment, validation, actuation, or data confidence constrain progression to robust advisory or closed-loop use.${trlPrefix}${drlSuffix}`;
  }

  return `The assessment indicates an R3 role ceiling. Technology-data, data-model, and model-task alignment are sufficiently strong to support bounded advisory or closed-loop use, provided that deployment remains within the validated operating envelope and appropriate governance constraints.${drlSuffix}`;
}

function renderResults() {
  const panel = document.getElementById("resultPanel");
  const complete = isAssessmentComplete();
  document.getElementById("copyButton").disabled = !complete;
  document.getElementById("downloadButton").disabled = !complete;

  if (!complete) {
    state.result = null;
    const missing = getMissingInputs();
    panel.innerHTML = `
      <div class="result-empty">
        <h3>Complete all inputs to calculate the role ceiling.</h3>
        <p>Missing inputs: ${escapeHTML(missing.join(", "))}.</p>
        <p>The final role ceiling is not displayed until TRL, DRL, and all α sub-criteria are selected.</p>
      </div>
    `;
    return;
  }

  const trl = Number(state.trl);
  const drl = Number(state.drl);
  const trlItem = scoringConfig.trl.levels[trl];
  const drlItem = scoringConfig.drl.levels[drl];
  const alphaScores = calculateAlphaScores();
  const alphaAverages = {
    TD: round2(alphaScores.TD.average),
    DM: round2(alphaScores.DM.average),
    MT: round2(alphaScores.MT.average)
  };
  const alphaCandidate = determineAlphaCandidateRole(alphaScores);
  const trlBoundary = applyTRLBoundary(alphaCandidate.role, trl, drl);
  const drlConfidence = applyDRLConfidence(trlBoundary.role, drl);
  const finalRole = drlConfidence.role;
  const context = {
    trl,
    drl,
    alphaAverages,
    alphaCandidate,
    trlBoundary,
    drlConfidence,
    finalRole
  };
  const limits = identifyLimitingDimensions(context);
  const explanation = generateExplanation(context);
  const roleDef = scoringConfig.roleDefinitions[finalRole];

  state.result = {
    toolkit: scoringConfig.metadata.toolkitName,
    trl: { score: trl, label: trlItem.label, description: trlItem.description },
    drl: { score: drl, band: drlItem.band, label: drlItem.label, description: drlItem.description },
    alpha: {
      TD: alphaAverages.TD,
      DM: alphaAverages.DM,
      MT: alphaAverages.MT,
      subCriteria: getSubCriterionResults()
    },
    alphaCandidateRole: alphaCandidate.role,
    finalRole,
    finalRoleTitle: roleDef.title,
    confidence: drlConfidence.label,
    limitingDimensions: limits.limitingDimensions,
    weakSubCriteria: limits.weakCriteria,
    explanation
  };

  panel.innerHTML = `
    <div class="result-grid">
      ${renderMetric("Final DT role ceiling", `${finalRole}: ${roleDef.title}`, roleDef.description, roleBadgeClass(finalRole))}
      ${renderMetric("Confidence level", drlConfidence.label, drlConfidence.note, confidenceBadgeClass(drlConfidence.level))}
      ${renderMetric("α candidate role", alphaCandidate.role, alphaCandidate.reason, roleBadgeClass(alphaCandidate.role))}
      ${renderMetric("TRL", `TRL ${trl}: ${escapeHTML(trlItem.label)}`, trlItem.description)}
      ${renderMetric("DRL", `DRL ${drl}: ${escapeHTML(drlItem.label)}`, `${drlItem.band}. ${drlItem.description}`)}
      ${renderMetric("α averages", `αTD ${alphaAverages.TD.toFixed(2)} | αDM ${alphaAverages.DM.toFixed(2)} | αMT ${alphaAverages.MT.toFixed(2)}`, scoringConfig.alpha.thresholds.note)}
    </div>

    <div class="detail-section">
      <h3>Sub-Criterion Breakdown</h3>
      <ul>${getSubCriterionResults().map((item) => `<li>${escapeHTML(item.id)} ${escapeHTML(item.label)}: <strong>${item.score}</strong></li>`).join("")}</ul>
    </div>

    <div class="detail-section">
      <h3>Limiting Dimensions</h3>
      <ul>${limits.limitingDimensions.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>
    </div>

    <div class="detail-section">
      <h3>Weak Sub-Criteria</h3>
      <p>${limits.weakCriteria.length ? escapeHTML(limits.weakCriteria.join("; ")) : "No selected sub-criterion is below the configured weak-alignment threshold."}</p>
    </div>

    <div class="detail-section">
      <h3>Explanation</h3>
      <p>${escapeHTML(explanation)}</p>
    </div>
  `;
}

function renderMetric(label, value, description, badgeClass = "badge-r1") {
  return `
    <article class="metric">
      <div class="metric-label">${escapeHTML(label)}</div>
      <div class="metric-value"><span class="badge ${badgeClass}">${value}</span></div>
      <p>${escapeHTML(description)}</p>
    </article>
  `;
}

function resetAssessment() {
  state.trl = "";
  state.drl = "";
  state.alpha = { TD: {}, DM: {}, MT: {} };
  state.result = null;

  document.getElementById("trlSelect").value = "";
  document.getElementById("drlSelect").value = "";
  document.querySelectorAll(".rating-option").forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  });
  renderTRLDescription();
  renderDRLDescription();
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
  const limits = result.limitingDimensions
    .map((item) => item.replace(/\.$/, ""))
    .join("; ");
  const roleDefinition = scoringConfig.roleDefinitions[result.finalRole].description;
  const contrast = result.finalRole === "R3"
    ? "a lower-confidence or narrower deployment claim"
    : result.finalRole === "R2"
      ? "robust advisory or closed-loop deployment"
      : "routine online monitoring or closed-loop deployment";

  return `Assessment summary: TRL = ${result.trl.score}, DRL = ${result.drl.score}. αTD = ${result.alpha.TD.toFixed(2)}, αDM = ${result.alpha.DM.toFixed(2)}, αMT = ${result.alpha.MT.toFixed(2)}. The current DT role ceiling is ${result.finalRole}. The main limiting dimensions are ${limits}. This indicates that the system is currently most defensibly suited to ${roleDefinition.toLowerCase()} rather than ${contrast}.`;
}

function bindControls() {
  document.getElementById("resetButton").addEventListener("click", resetAssessment);
  document.getElementById("copyButton").addEventListener("click", copySummary);
  document.getElementById("downloadButton").addEventListener("click", downloadJSON);
}

function renderWarnings() {
  const target = document.getElementById("configWarnings");
  const warnings = [
    ...scoringConfig.warnings,
    scoringConfig.alpha.thresholds.note
  ];

  target.innerHTML = warnings.map((warning) => `
    <div class="warning" role="status">${escapeHTML(warning)}</div>
  `).join("");
}

function isAssessmentComplete() {
  return getMissingInputs().length === 0;
}

function getMissingInputs() {
  const missing = [];
  if (!state.trl) missing.push("TRL");
  if (!state.drl) missing.push("DRL");

  getAllCriteria().forEach(({ dimension, criterion }) => {
    if (!Number.isFinite(state.alpha[dimension][criterion.id])) {
      missing.push(criterion.id);
    }
  });

  return missing;
}

function getAllCriteria() {
  return ["TD", "DM", "MT"].flatMap((dimension) =>
    scoringConfig.alpha[dimension].criteria.map((criterion) => ({ dimension, criterion }))
  );
}

function getSubCriterionResults() {
  return getAllCriteria().map(({ dimension, criterion }) => ({
    dimension,
    id: criterion.id,
    label: criterion.label,
    score: state.alpha[dimension][criterion.id],
    description: criterion.options.find((option) => option.score === state.alpha[dimension][criterion.id]).description
  }));
}

function criticalCriteriaMet(criteriaIds, threshold) {
  return criteriaIds.every((id) => {
    const match = getAllCriteria().find(({ criterion }) => criterion.id === id);
    if (!match) return false;
    return state.alpha[match.dimension][id] >= threshold;
  });
}

function alignmentBadgeClass(score) {
  const thresholds = scoringConfig.alpha.thresholds;
  if (score < thresholds.weakBelow) return "badge-low";
  if (score >= thresholds.strongAtOrAbove) return "badge-high";
  return "badge-medium";
}

function roleBadgeClass(role) {
  return {
    R1: "badge-r1",
    R2: "badge-r2",
    R3: "badge-r3"
  }[role];
}

function confidenceBadgeClass(level) {
  return {
    low: "badge-low",
    moderate: "badge-medium",
    high: "badge-high"
  }[level];
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

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function unique(items) {
  return [...new Set(items)];
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
