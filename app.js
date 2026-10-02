const CONDITION_IDS = ["feedstockVariability", "spatialEffects", "recommendedActions"];
const DIMENSIONS = ["TD", "DM", "MT"];
const RADAR_ORDER = ["TD1", "TD2", "TD3", "DM1", "DM2", "DM3", "MT1", "MT2"];

const state = {
  specification: Object.fromEntries(scoringConfig.specification.map((field) => [field.id, ""])),
  targetRole: "",
  trl: "",
  band: "",
  offlineTaskDemonstrated: "",
  applicability: Object.fromEntries(CONDITION_IDS.map((id) => [id, ""])),
  alpha: { TD: {}, DM: {}, MT: {} },
  result: null
};

document.addEventListener("DOMContentLoaded", () => {
  renderSpecificationFields();
  loadTRL();
  loadBands();
  renderAnchorScale();
  renderAlphaCriteria();
  renderConditionFields();
  bindInputs();
  bindControls();
  renderWarnings();
  renderTRLDescription();
  renderBandDescription();
  renderResults();
});

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

function renderSpecificationFields() {
  const target = document.getElementById("specificationFields");
  target.innerHTML = scoringConfig.specification
    .map((field) => `
      <div class="field">
        <label for="${field.id}">${escapeHTML(field.label)} <span class="field-status ${field.status}">${field.status === "required" ? "Required" : "Recommended"}</span></label>
        <textarea id="${field.id}" rows="3" ${field.status === "required" ? 'required aria-required="true"' : ""} placeholder="${escapeHTML(field.placeholder)}" aria-describedby="${field.id}-help"></textarea>
        <p class="field-help" id="${field.id}-help">${escapeHTML(field.definition)}</p>
      </div>
    `)
    .join("");
  // Keep the target role inside the same grid as the other Table 3 elements.
  target.appendChild(document.getElementById("targetRoleField"));
}

function loadTRL() {
  const select = document.getElementById("trlSelect");
  Object.entries(scoringConfig.trl.levels).forEach(([level, item]) => {
    const option = document.createElement("option");
    option.value = level;
    option.textContent = `TRL ${level}: ${item.label}`;
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
    option.textContent = `${item.label}: ${item.shortLabel}`;
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
    target.innerHTML = `<p>Select a TRL to view its definition.</p><p><small>${escapeHTML(scoringConfig.trl.roleUse)}</small></p>`;
    return;
  }

  const item = scoringConfig.trl.levels[state.trl];
  target.innerHTML = `
    <p><strong>TRL ${state.trl}: ${escapeHTML(item.label)}</strong></p>
    <p>${escapeHTML(item.description)}</p>
    <p><small>${escapeHTML(scoringConfig.trl.roleUse)}</small></p>
  `;
}

function renderBandDescription() {
  const target = document.getElementById("bandDescription");
  if (!state.band) {
    target.innerHTML = "<p>Select Band A, B or C to view its interpretation.</p>";
    return;
  }

  const item = scoringConfig.drl.bands[state.band];
  const roles = ["R1", "R2", "R3"].filter(
    (role) => scoringConfig.drl.rank[state.band] >= scoringConfig.drl.rank[scoringConfig.roleRequirements[role].minimumBand]
  );
  const roleText = roles.length
    ? `Meets the minimum DRL band for ${roles.join(", ")}. All other Table 5 requirements must also be met.`
    : "Below the minimum DRL band (Band B) for every role.";
  target.innerHTML = `
    <p><strong>${escapeHTML(item.label)}: ${escapeHTML(item.shortLabel)}</strong>
      <span class="badge ${bandBadgeClass(state.band)}">${escapeHTML(item.question)}</span></p>
    <p><strong>Assessed:</strong> ${escapeHTML(item.interpretation)}</p>
    <p><strong>Outcome:</strong> ${escapeHTML(item.outcome)}</p>
    <p><small>${escapeHTML(item.cumulativeNote)} ${escapeHTML(roleText)}</small></p>
  `;
}

function renderAnchorScale() {
  const target = document.getElementById("anchorScale");
  target.innerHTML = Object.entries(scoringConfig.anchorScale)
    .map(([score, meaning]) => `
      <div class="scale-item">
        <span class="rating-score">${score}</span>
        <span>${escapeHTML(meaning)}</span>
      </div>
    `)
    .join("");
}

function renderAlphaCriteria() {
  const target = document.getElementById("alphaCriteria");
  target.innerHTML = DIMENSIONS.map((dimensionKey) => {
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
    <article class="criterion-card" id="criterion-${criterion.id}">
      <div class="criterion-topline">
        <div>
          <h3>${alphaCriterionNotation(criterion.id)} ${escapeHTML(criterion.label)}</h3>
          <p class="criterion-definition">${escapeHTML(criterion.definition)}</p>
        </div>
        <div class="threshold-chips">${renderThresholdChips(criterion.id)}</div>
      </div>
      <p class="applicability-note" id="applicability-${criterion.id}" hidden></p>
      <div class="rating-list" role="group" aria-label="α ${criterion.id} ${escapeHTML(criterion.label)} rating options">
        ${options}
      </div>
    </article>
  `;
}

function requirementFor(role, criterionId) {
  return scoringConfig.roleRequirements[role].criteria.find((item) => item.id === criterionId) || null;
}

function renderThresholdChips(criterionId) {
  return ["R2", "R3"]
    .map((role) => {
      const requirement = requirementFor(role, criterionId);
      if (!requirement) return "";
      const flag = requirement.condition === "recommendedActions" ? "if recommended actions" : "if applicable";
      const conditional = requirement.condition ? `<span class="chip-flag">${flag}</span>` : "";
      return `<span class="threshold-chip chip-${role.toLowerCase()}">${role} ≥ ${requirement.minimum}${conditional}</span>`;
    })
    .join("") + '<span class="threshold-chip chip-r1">R1: no α threshold</span>';
}

function renderConditionFields() {
  CONDITION_IDS.forEach((id) => {
    const condition = scoringConfig.conditions[id];
    document.getElementById(`${id}Label`).innerHTML =
      `${alphaCriterionNotation(condition.criterion)} condition: ${escapeHTML(condition.question)}`;
    document.getElementById(id).innerHTML = `
      <option value="">Choose an answer</option>
      <option value="yes">${escapeHTML(condition.yes)}</option>
      <option value="no">${escapeHTML(condition.no)}</option>
    `;
  });
}

function updateApplicabilityNotes() {
  CONDITION_IDS.forEach((id) => {
    const condition = scoringConfig.conditions[id];
    const note = document.getElementById(`applicability-${condition.criterion}`);
    const value = state.applicability[id];
    if (!value) {
      note.hidden = true;
      return;
    }
    note.hidden = false;
    if (id === "recommendedActions") {
      note.textContent = value === "yes"
        ? "Applies to this task: required for R2 (≥ 2) because outputs include recommended actions; always required for R3 (≥ 4)."
        : "Not required for R2 because outputs do not include recommended actions; still required for R3 (≥ 4).";
    } else {
      note.textContent = value === "yes"
        ? "Applies to this task: enters the role test (R2 ≥ 2, R3 ≥ 4)."
        : "Does not affect this task: scored and reported, but not used as a requirement.";
    }
    note.className = `applicability-note ${value === "yes" ? "is-applicable" : "is-inactive"}`;
  });
}

function handleRatingClick(event) {
  const button = event.target.closest(".rating-option");
  if (!button) return;

  const { dimension, criterion, score } = button.dataset;
  setScore(dimension, criterion, Number(score));
  renderDimensionBadges();
  renderResults();
}

function setScore(dimension, criterion, score) {
  state.alpha[dimension][criterion] = score;
  document
    .querySelectorAll(`.rating-option[data-dimension="${dimension}"][data-criterion="${criterion}"]`)
    .forEach((option) => {
      const selected = Number(option.dataset.score) === score;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-pressed", String(selected));
    });
}

function renderDimensionBadges() {
  const means = FrameworkEngine.calculateDimensionMeans(scoringConfig, state.alpha);
  DIMENSIONS.forEach((dimension) => {
    const badge = document.getElementById(`${dimension}-score`);
    const value = means[dimension];
    badge.innerHTML = Number.isFinite(value)
      ? `<span>Mean ${alphaNotation(dimension)}&nbsp;=&nbsp;${formatMean(value)} (descriptive)</span>`
      : "Incomplete";
  });
}

function bindInputs() {
  scoringConfig.specification.forEach(({ id }) => {
    document.getElementById(id).addEventListener("input", (event) => {
      state.specification[id] = event.target.value;
      renderResults();
    });
  });

  document.getElementById("targetRole").addEventListener("change", (event) => {
    state.targetRole = event.target.value;
    renderResults();
  });

  document.getElementById("offlineTaskDemonstrated").addEventListener("change", (event) => {
    state.offlineTaskDemonstrated = event.target.value;
    renderResults();
  });

  CONDITION_IDS.forEach((id) => {
    document.getElementById(id).addEventListener("change", (event) => {
      state.applicability[id] = event.target.value;
      updateApplicabilityNotes();
      renderResults();
    });
  });
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

function buildEngineAssessment() {
  return {
    targetRole: state.targetRole,
    band: state.band,
    offlineTaskDemonstrated: state.offlineTaskDemonstrated === "yes",
    applicability: Object.fromEntries(CONDITION_IDS.map((id) => [id, state.applicability[id] === "yes"])),
    scores: state.alpha
  };
}

function getMissingInputs() {
  const missing = [];
  scoringConfig.specification.forEach(({ id, label, status }) => {
    if (status === "required" && !state.specification[id].trim()) missing.push(label);
  });
  if (!state.targetRole) missing.push("Target role");
  if (!state.trl) missing.push("TRL");
  if (!state.band) missing.push("DRL band");
  getAllCriteria().forEach(({ dimension, criterion }) => {
    if (!Number.isFinite(state.alpha[dimension][criterion.id])) missing.push(`α_${criterion.id}`);
  });
  if (state.targetRole !== "R1") {
    CONDITION_IDS.forEach((id) => {
      if (!state.applicability[id]) missing.push(`α_${scoringConfig.conditions[id].criterion} condition`);
    });
  }
  if (!state.offlineTaskDemonstrated) missing.push("R1 task evidence");
  return missing;
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
        <h3>Complete the inputs to run the role test.</h3>
        <p>Still needed: ${renderAlphaText(missing.join(", "))}.</p>
        <p>The role test runs once the required specification, the target role, TRL, DRL, all eight α scores, the role-test conditions and the R1 task evidence are recorded.</p>
      </div>
    `;
    return;
  }

  const assessment = buildEngineAssessment();
  const evaluation = FrameworkEngine.evaluateAssessment(scoringConfig, assessment);
  const means = FrameworkEngine.calculateDimensionMeans(scoringConfig, state.alpha);
  const limiting = FrameworkEngine.findLimitingCriteria(scoringConfig, assessment.targetRole, assessment.applicability, state.alpha);
  const margins = FrameworkEngine.thresholdMargins(evaluation);
  const constraints = FrameworkEngine.deploymentConstraints(scoringConfig, evaluation);
  const trlItem = scoringConfig.trl.levels[state.trl];
  const bandItem = scoringConfig.drl.bands[state.band];
  const roleDef = scoringConfig.roleDefinitions[evaluation.finalRole];
  const targetDef = scoringConfig.roleDefinitions[assessment.targetRole];
  const explanation = generateExplanation(evaluation, limiting);

  state.result = buildResultRecord({ assessment, evaluation, means, limiting, margins, constraints, trlItem, bandItem, roleDef, explanation });

  panel.innerHTML = `
    <div class="result-grid">
      ${renderMetric(
        "Role ceiling",
        evaluation.finalRole === "none" ? "No role ceiling assigned" : `${evaluation.finalRole}: ${roleDef.title}`,
        roleDef.description,
        roleBadgeClass(evaluation.finalRole)
      )}
      ${renderMetric(
        "Target role",
        `${assessment.targetRole}: ${targetDef.title}`,
        evaluation.targetMet
          ? "Every applicable Table 5 threshold for the target role is met."
          : `${evaluation.targetEvaluation.failures.length} threshold(s) for the target role are not met.`,
        evaluation.targetMet ? "badge-high" : "badge-low"
      )}
      ${renderMetric(
        "Role test path",
        renderTestPath(evaluation),
        "Roles are tested from the target downwards until every applicable threshold is met.",
        "badge-r1",
        true
      )}
      ${renderMetric(
        "TRL",
        `TRL ${state.trl}: ${trlItem.label}`,
        "Demonstrated maturity of the physical process configuration. Not a role threshold."
      )}
      ${renderMetric(
        "DRL",
        `${bandItem.label}: ${bandItem.shortLabel}`,
        bandItem.outcome,
        bandBadgeClass(state.band)
      )}
      ${renderMetric(
        "Dimension means",
        formatMeansHTML(means),
        "Arithmetic means of all criteria in each dimension (Equation 1). Descriptive only; never used as thresholds.",
        "badge-r1",
        true
      )}
    </div>

    <div class="detail-section profile-section">
      <div class="profile-table-wrap">
        <h3>TRL–DRL–α profile</h3>
        ${renderProfileTable(assessment, limiting)}
        <p class="table-note">* Limiting criterion within its dimension for the target role (${assessment.targetRole}). “Not required” marks a criterion whose condition does not apply to the task.</p>
      </div>
      <figure class="radar-figure">
        ${renderRadar(assessment, limiting)}
        <figcaption>Alignment profile against the minimum criterion scores for R2 and R3 (cf. Figure 7).</figcaption>
      </figure>
    </div>

    <div class="detail-section">
      <h3>Role test (Table 5)</h3>
      ${renderRoleChecks(evaluation)}
    </div>

    <div class="detail-section">
      <h3>Limiting criteria for ${assessment.targetRole}</h3>
      ${renderLimitingCriteria(limiting, assessment.targetRole)}
    </div>

    <div class="detail-section">
      <h3>Threshold margins</h3>
      ${renderMargins(margins, evaluation)}
    </div>

    <div class="detail-section">
      <h3>Deployment constraints and candidate actions</h3>
      ${renderConstraints(constraints)}
    </div>

    <div class="detail-section">
      <h3>Interpretation</h3>
      <p>${renderAlphaText(explanation)}</p>
      <p class="reassessment-note"><strong>Reassessment (Section 4.5):</strong> ${escapeHTML(scoringConfig.constraintGuidance.reassessment)}</p>
    </div>
  `;
}

function renderTestPath(evaluation) {
  return evaluation.consideredRoles
    .map((role) => `${role} ${evaluation.evaluations[role].passed ? "✓" : "✗"}`)
    .join(" → ");
}

function renderProfileTable(assessment, limiting) {
  const limitingIds = new Set(limiting.map((item) => item.criterion));
  const bandRow = `
    <tr>
      <th scope="row">DRL</th>
      <td><strong>Band ${escapeHTML(state.band)}</strong></td>
      <td>${requirementCell(scoringConfig.drl.rank[state.band] >= scoringConfig.drl.rank.B, "Band B")}</td>
      <td>${requirementCell(scoringConfig.drl.rank[state.band] >= scoringConfig.drl.rank.A, "Band A")}</td>
    </tr>
  `;
  const trlRow = `
    <tr>
      <th scope="row">TRL</th>
      <td><strong>${escapeHTML(state.trl)}</strong></td>
      <td class="muted" colspan="2">Reported; not a role threshold</td>
    </tr>
  `;
  const criterionRows = FrameworkEngine.allCriterionIds(scoringConfig)
    .map((id) => {
      const score = state.alpha[id.slice(0, 2)][id];
      const cells = ["R2", "R3"].map((role) => {
        const applies = FrameworkEngine.getRequirements(scoringConfig, role, assessment.applicability).find((item) => item.id === id);
        if (!applies) return '<td class="muted">Not required</td>';
        return `<td>${requirementCell(score >= applies.minimum, `≥ ${applies.minimum}`)}</td>`;
      });
      return `
        <tr>
          <th scope="row">${alphaCriterionNotation(id)}${limitingIds.has(id) ? '<span class="limiting-mark" title="Limiting criterion">*</span>' : ""}</th>
          <td><strong>${score}</strong></td>
          ${cells.join("")}
        </tr>
      `;
    })
    .join("");

  return `
    <table class="profile-table">
      <thead>
        <tr><th scope="col">Dimension</th><th scope="col">Score</th><th scope="col">R2 minimum</th><th scope="col">R3 minimum</th></tr>
      </thead>
      <tbody>${trlRow}${bandRow}${criterionRows}</tbody>
    </table>
  `;
}

function requirementCell(met, text) {
  return `<span class="req ${met ? "req-met" : "req-unmet"}">${met ? "✓" : "✗"} ${escapeHTML(text)}</span>`;
}

function renderRadar(assessment, limiting) {
  const size = 400;
  const centre = size / 2;
  const radius = 122;
  const limitingIds = new Set(limiting.map((item) => item.criterion));
  const angle = (index) => (-Math.PI / 2) + (index * 2 * Math.PI) / RADAR_ORDER.length;
  const point = (index, value) => [
    centre + Math.cos(angle(index)) * (radius * value) / 5,
    centre + Math.sin(angle(index)) * (radius * value) / 5
  ];
  const polygon = (values) => values.map((value, index) => point(index, value).map((n) => n.toFixed(1)).join(",")).join(" ");
  const minimumFor = (role, id) =>
    FrameworkEngine.getRequirements(scoringConfig, role, assessment.applicability).find((item) => item.id === id)?.minimum ?? null;

  const scores = RADAR_ORDER.map((id) => state.alpha[id.slice(0, 2)][id]);
  const r2 = RADAR_ORDER.map((id) => minimumFor("R2", id));
  const r3 = RADAR_ORDER.map((id) => minimumFor("R3", id));

  const rings = [1, 2, 3, 4, 5]
    .map((level) => `<polygon class="radar-ring" points="${polygon(RADAR_ORDER.map(() => level))}"></polygon>`)
    .join("");
  const spokes = RADAR_ORDER.map((_, index) => {
    const [x, y] = point(index, 5);
    return `<line class="radar-spoke" x1="${centre}" y1="${centre}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"></line>`;
  }).join("");
  const ringLabels = [1, 2, 3, 4, 5]
    .map((level) => {
      const [x, y] = point(4.5, level);
      return `<text class="radar-ring-label" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${level}</text>`;
    })
    .join("");
  const labels = RADAR_ORDER.map((id, index) => {
    const [x, y] = point(index, 6.05);
    const anchor = Math.abs(x - centre) < 4 ? "middle" : x > centre ? "start" : "end";
    return `<text class="radar-label radar-${id.slice(0, 2).toLowerCase()}" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}">α<tspan baseline-shift="sub" font-size="9">${id}</tspan>${limitingIds.has(id) ? "*" : ""}</text>`;
  }).join("");
  const r2Markers = r2
    .map((value, index) => {
      if (value === null) return "";
      const [x, y] = point(index, value);
      return `<rect class="radar-r2-marker" x="${(x - 3.5).toFixed(1)}" y="${(y - 3.5).toFixed(1)}" width="7" height="7" transform="rotate(45 ${x.toFixed(1)} ${y.toFixed(1)})"></rect>`;
    })
    .join("");
  const scoreMarkers = scores
    .map((value, index) => {
      const [x, y] = point(index, value);
      return `<circle class="radar-score-marker" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"><title>${RADAR_ORDER[index]}: ${value}</title></circle>`;
    })
    .join("");
  // Criteria that are not required by a role are drawn at 1 (no requirement).
  const r2Line = polygon(r2.map((value) => value ?? 1));
  const r3Line = polygon(r3.map((value) => value ?? 1));

  return `
    <svg class="radar" viewBox="0 0 ${size} ${size}" role="img" aria-label="Radar chart of the eight α scores against R2 and R3 minimum scores">
      ${rings}${spokes}${ringLabels}
      <polygon class="radar-r3" points="${r3Line}"></polygon>
      <polygon class="radar-r2" points="${r2Line}"></polygon>
      ${r2Markers}
      <polygon class="radar-score" points="${polygon(scores)}"></polygon>
      ${scoreMarkers}
      ${labels}
    </svg>
    <div class="radar-legend" aria-hidden="true">
      <span><i class="legend-score"></i>Assessment</span>
      <span><i class="legend-r2"></i>R2 minimum</span>
      <span><i class="legend-r3"></i>R3 minimum</span>
    </div>
  `;
}

function renderRoleChecks(evaluation) {
  const tested = evaluation.consideredRoles.map((role) => {
    const result = evaluation.evaluations[role];
    const requirements = scoringConfig.roleRequirements[role];
    const summary = [
      `DRL ≥ Band ${requirements.minimumBand}`,
      requirements.taskPerformanceRequired ? "offline/open-loop task demonstrated" : null,
      result.requirements.length
        ? result.requirements.map((item) => `α_${item.id} ≥ ${item.minimum}`).join(", ")
        : "no fixed α threshold"
    ].filter(Boolean).join("; ");
    const details = result.passed
      ? "<p>Every applicable threshold is met.</p>"
      : `<ul>${result.failures.map((failure) => `<li>${renderAlphaText(failure.message)}</li>`).join("")}</ul>`;
    return `
      <article class="role-check">
        <h4><span class="badge ${result.passed ? "badge-high" : "badge-low"}">${role}: ${result.passed ? "met" : "not met"}</span></h4>
        <p class="role-requirements">Requirements tested: ${renderAlphaText(summary)}.</p>
        ${details}
      </article>
    `;
  });

  const untested = ["R3", "R2", "R1"]
    .filter((role) => !evaluation.consideredRoles.includes(role) && roleRankOf(role) < roleRankOf(evaluation.targetRole))
    .map((role) => `<p class="muted">${role} was not tested because a higher role met every applicable threshold.</p>`);

  return tested.join("") + untested.join("");
}

function renderLimitingCriteria(items, targetRole) {
  if (targetRole === "R1") {
    return "<p>R1 has no fixed α threshold, so no limiting α criterion is reported. All eight criteria remain scored in the profile.</p>";
  }
  const grouped = DIMENSIONS.map((dimension) => {
    const matches = items.filter((item) => item.dimension === dimension);
    if (!matches.length) return "";
    const labels = matches
      .map((item) => `${alphaCriterionNotation(item.criterion)} ${escapeHTML(item.label)} (${item.score})`)
      .join("; ");
    return `<li>${alphaNotation(dimension)}: ${labels}</li>`;
  }).join("");
  return `
    <p>The lowest-scoring criterion required for ${targetRole} in each dimension. Ties are reported together. This shows weaknesses that a dimension mean can hide.</p>
    <ul>${grouped}</ul>
  `;
}

function renderMargins(margins, evaluation) {
  const parts = [];
  if (margins.ceilingRole === "none") {
    parts.push("<p>No role ceiling is assigned, so there is no margin to report.</p>");
  } else if (margins.atThreshold.length) {
    const list = margins.atThreshold
      .map((item) => `${alphaCriterionNotation(item.criterion)} = ${item.actual}`)
      .join(", ");
    parts.push(`<p><strong>${margins.atThreshold.length}</strong> of 8 criteria meet the ${margins.ceilingRole} threshold exactly (${list}). A one-point reduction in any of them would lower the ceiling below ${margins.ceilingRole}.</p>`);
  } else if (evaluation.evaluations[margins.ceilingRole].requirements.length) {
    parts.push(`<p>Every criterion required for ${margins.ceilingRole} is at least one point above its threshold.</p>`);
  } else {
    parts.push(`<p>${margins.ceilingRole} has no fixed α threshold, so its ceiling does not depend on α scores.</p>`);
  }

  if (margins.nextRole) {
    const criteria = margins.nextRoleFailures.filter((failure) => failure.type === "criterion");
    const pieces = [];
    if (criteria.length) {
      pieces.push(`improvement in <strong>${criteria.length}</strong> criterion score${criteria.length === 1 ? "" : "s"} (${criteria.map((item) => `${alphaCriterionNotation(item.criterion)} ${item.actual} → ${item.required}`).join(", ")})`);
    }
    if (margins.nextRoleNeedsBand) pieces.push(`a DRL move to Band ${margins.nextRoleNeedsBand}`);
    if (margins.nextRoleFailures.some((failure) => failure.type === "task")) pieces.push("demonstrated offline or open-loop task performance");
    parts.push(`<p>Reaching ${margins.nextRole} would require ${pieces.join(" and ")}.</p>`);
  } else if (evaluation.targetMet) {
    parts.push("<p>The target role is met, so higher roles were not tested.</p>");
  }
  return parts.join("");
}

function renderConstraints(constraints) {
  if (!constraints.length) {
    return "<p>No deployment constraint is recorded: the target role meets every applicable threshold.</p>";
  }
  const groups = [
    ["DRL", "Data readiness (DRL)"],
    ["Task", "R1 task evidence"],
    ["TD", null],
    ["DM", null],
    ["MT", null]
  ];
  const html = groups.map(([key, title]) => {
    const items = constraints.filter((item) => item.interface === key);
    if (!items.length) return "";
    const dimension = scoringConfig.alpha[key];
    const heading = dimension
      ? `${alphaNotation(key)} ${escapeHTML(dimension.title)} <span class="muted">· ${escapeHTML(dimension.responsibility)}</span>`
      : escapeHTML(title);
    const focus = dimension ? `<p class="constraint-focus">${escapeHTML(dimension.constraintFocus)}</p>` : "";
    const rows = items.map((item) => {
      const needs = item.requirements
        .map((requirement) => (requirement.required === null ? requirement.role : `${requirement.role} needs ${item.type === "band" ? "Band " : "≥ "}${requirement.required}`))
        .join("; ");
      const name = item.type === "criterion"
        ? `${alphaCriterionNotation(item.criterion)} ${escapeHTML(item.label)}`
        : escapeHTML(item.label);
      const current = item.type === "criterion" ? `score ${item.actual}` : item.type === "band" ? `Band ${escapeHTML(item.actual)}` : escapeHTML(item.actual);
      return `
        <li>
          <p><strong>${name}</strong>: ${current}; ${escapeHTML(needs)}.${item.type === "band" ? ` <span class="muted">${escapeHTML(item.focus)}.</span>` : ""}</p>
          <p class="candidate-action">Candidate action: ${escapeHTML(item.action)}</p>
        </li>
      `;
    }).join("");
    return `<div class="constraint-group"><h4>${heading}</h4>${focus}<ul>${rows}</ul></div>`;
  }).join("");
  return `${html}<p class="muted">${escapeHTML(scoringConfig.constraintGuidance.rankingNote)}</p>`;
}

function generateExplanation(evaluation, limiting) {
  const ceiling = evaluation.finalRole;
  const target = evaluation.targetRole;
  const trlText = `TRL ${state.trl} describes the maturity of the physical process configuration; it does not raise or lower the role ceiling.`;
  const limitingText = limiting.length
    ? ` The limiting criteria for ${target} are ${limiting.map((item) => `α_${item.criterion}`).join(", ")}.`
    : "";

  if (ceiling === "none") {
    return `No role ceiling is assigned because no role at or below ${target} meets every applicable threshold. The unmet thresholds above are the deployment constraints.${limitingText} ${trlText}`;
  }
  if (evaluation.targetMet) {
    return `The target role ${target} is supported: DRL Band ${state.band} meets the minimum band and every applicable criterion meets its Table 5 threshold.${limitingText} ${trlText}`;
  }
  return `The target role ${target} is not supported, so lower roles were tested in turn. ${ceiling} is the highest role for which every applicable threshold is met. The unmet ${target} thresholds are reported as deployment constraints and are not ranked.${limitingText} ${trlText}`;
}

function buildResultRecord({ assessment, evaluation, means, limiting, margins, constraints, trlItem, bandItem, roleDef, explanation }) {
  return {
    toolkit: scoringConfig.metadata.toolkitName,
    toolkitVersion: scoringConfig.metadata.version,
    framework: scoringConfig.metadata.frameworkName,
    article: scoringConfig.metadata.articleTitle,
    generatedAt: new Date().toISOString(),
    specification: { ...state.specification, targetRole: assessment.targetRole },
    trl: {
      level: Number(state.trl),
      label: trlItem.label,
      description: trlItem.description,
      roleUse: scoringConfig.trl.roleUse
    },
    drl: {
      band: state.band,
      label: bandItem.shortLabel,
      question: bandItem.question,
      outcome: bandItem.outcome,
      includes: bandItem.includes
    },
    roleTestConditions: {
      ...assessment.applicability,
      offlineTaskDemonstrated: assessment.offlineTaskDemonstrated
    },
    alpha: {
      scores: getSubCriterionResults(),
      dimensionMeans: means,
      dimensionMeansNote: "Arithmetic means of all criteria per dimension (Equation 1); descriptive only."
    },
    targetRole: assessment.targetRole,
    targetMet: evaluation.targetMet,
    roleCeiling: evaluation.finalRole === "none" ? null : evaluation.finalRole,
    roleCeilingTitle: roleDef.title,
    roleTests: evaluation.consideredRoles.map((role) => evaluation.evaluations[role]),
    limitingCriteria: limiting,
    thresholdMargins: margins,
    deploymentConstraints: constraints,
    constraintRankingNote: scoringConfig.constraintGuidance.rankingNote,
    reassessment: scoringConfig.constraintGuidance.reassessment,
    interpretation: explanation
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

function getAllCriteria() {
  return DIMENSIONS.flatMap((dimension) =>
    scoringConfig.alpha[dimension].criteria.map((criterion) => ({ dimension, criterion }))
  );
}

function getSubCriterionResults() {
  return getAllCriteria().map(({ dimension, criterion }) => {
    const score = state.alpha[dimension][criterion.id];
    return {
      dimension,
      id: criterion.id,
      label: criterion.label,
      score,
      anchor: criterion.options.find((option) => option.score === score)?.description || ""
    };
  });
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function resetAssessment() {
  scoringConfig.specification.forEach(({ id }) => {
    state.specification[id] = "";
    document.getElementById(id).value = "";
  });
  state.targetRole = "";
  state.trl = "";
  state.band = "";
  state.offlineTaskDemonstrated = "";
  state.applicability = Object.fromEntries(CONDITION_IDS.map((id) => [id, ""]));
  state.alpha = { TD: {}, DM: {}, MT: {} };
  state.result = null;

  ["targetRole", "trlSelect", "bandSelect", "offlineTaskDemonstrated", ...CONDITION_IDS].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.querySelectorAll(".rating-option").forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  });
  updateApplicabilityNotes();
  renderTRLDescription();
  renderBandDescription();
  renderDimensionBadges();
  renderResults();
}

function loadWorkedExample() {
  const example = scoringConfig.workedExample;
  Object.entries(example.specification).forEach(([id, value]) => {
    state.specification[id] = value;
    document.getElementById(id).value = value;
  });
  state.targetRole = example.targetRole;
  state.trl = example.trl;
  state.band = example.band;
  state.offlineTaskDemonstrated = example.offlineTaskDemonstrated;
  state.applicability = { ...example.applicability };
  document.getElementById("targetRole").value = example.targetRole;
  document.getElementById("trlSelect").value = example.trl;
  document.getElementById("bandSelect").value = example.band;
  document.getElementById("offlineTaskDemonstrated").value = example.offlineTaskDemonstrated;
  CONDITION_IDS.forEach((id) => {
    document.getElementById(id).value = example.applicability[id];
  });
  DIMENSIONS.forEach((dimension) => {
    Object.entries(example.scores[dimension]).forEach(([criterion, score]) => setScore(dimension, criterion, score));
  });
  updateApplicabilityNotes();
  renderTRLDescription();
  renderBandDescription();
  renderDimensionBadges();
  renderResults();
  showToast("Loaded the Section 5 anaerobic digestion reference scenario.");
  document.getElementById("results-title").scrollIntoView({ behavior: "smooth", block: "start" });
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
  link.download = "trl-drl-alpha-assessment.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildSummaryText(result) {
  const ceiling = result.roleCeiling ? `${result.roleCeiling} (${result.roleCeilingTitle})` : "no role ceiling assigned";
  const scores = result.alpha.scores.map((item) => `α_${item.id} = ${item.score}`).join(", ");
  const means = DIMENSIONS.map((dimension) => `α_${dimension} = ${formatMean(result.alpha.dimensionMeans[dimension])}`).join(", ");
  const limiting = result.limitingCriteria.length
    ? result.limitingCriteria.map((item) => `α_${item.criterion} (${item.score})`).join(", ")
    : "none (R1 has no fixed α threshold)";
  const constraints = result.deploymentConstraints.length
    ? result.deploymentConstraints
        .map((item) => {
          const needs = item.requirements
            .map((requirement) => (requirement.required === null ? requirement.role : `${requirement.role} ${item.type === "band" ? "Band " : "≥ "}${requirement.required}`))
            .join(", ");
          return `${item.type === "criterion" ? `α_${item.criterion}` : item.label} (${needs})`;
        })
        .join("; ")
    : "none";
  return [
    `TRL–DRL–α assessment. Target role ${result.targetRole}: ${result.targetMet ? "met" : "not met"}. Role ceiling: ${ceiling}.`,
    `TRL ${result.trl.level}; DRL Band ${result.drl.band}.`,
    `α scores: ${scores}.`,
    `Dimension means (descriptive): ${means}.`,
    `Limiting criteria for ${result.targetRole}: ${limiting}.`,
    `Deployment constraints (not ranked): ${constraints}.`
  ].join(" ");
}

function bindControls() {
  document.getElementById("resetButton").addEventListener("click", resetAssessment);
  document.getElementById("copyButton").addEventListener("click", copySummary);
  document.getElementById("downloadButton").addEventListener("click", downloadJSON);
  document.getElementById("exampleButton").addEventListener("click", loadWorkedExample);
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roleRankOf(role) {
  return { R1: 1, R2: 2, R3: 3 }[role] || 0;
}

function roleBadgeClass(role) {
  return { none: "badge-low", R1: "badge-r1", R2: "badge-r2", R3: "badge-r3" }[role] || "badge-r1";
}

function bandBadgeClass(band) {
  return { C: "badge-low", B: "badge-medium", A: "badge-high" }[band] || "badge-r1";
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2400);
}

function formatMean(value) {
  // Means are reported to one decimal place, as in Section 5.1.
  return Number.isFinite(value) ? value.toFixed(1) : "–";
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
  // Wrapped in one span so the inline-flex badge keeps the spaces.
  const items = DIMENSIONS
    .map((dimension) => `${alphaNotation(dimension)}&nbsp;=&nbsp;${formatMean(means[dimension])}`)
    .join(" &nbsp;·&nbsp; ");
  return `<span>${items}</span>`;
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
