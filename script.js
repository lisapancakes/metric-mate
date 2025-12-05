// ============================================================================
// STATE
// ============================================================================
const project = {
  currentStep: 1,
  totalSteps: 4,
  info: {
    name: '',
    clientId: null,
    pmId: null,
    designerId: null,
    devId: null,
    otherContributors: ''
  },
  businessGoals: [],
  productGoals: [],
  userGoals: [],
  userPains: []
};

// Directory for dropdowns
const directory = {
  clients: ['Chatsworth', 'Sabbatical Homes', 'WGAW'],
  pms: ['Josh', 'Corbin'],
  designers: ['Lisa', 'Amanda'],
  devs: ['Roberto', 'Nisa']
};

// Default options for goals and pains
const defaultBusinessGoals = [
  'Increase qualified leads',
  'Improve conversion rate',
  'Increase self-serve adoption',
  'Reduce support tickets',
  'Shorten sales cycle',
  'Increase average contract value',
  'Improve client retention / renewal',
  'Strengthen brand trust / perception',
  'Reduce internal content / ops overhead'
];

const defaultProductGoals = [
  'Improve onboarding flow',
  'Clarify navigation / IA',
  'Modernize UI / visual language',
  'Improve mobile experience',
  'Make content more scannable',
  'Improve empty / error states',
  'Increase engagement with key feature(s)',
  'Simplify data-heavy / table views'
];

const defaultUserGoals = [
  'Understand what this site/product actually does',
  'Complete key tasks without getting stuck',
  'Find the right option / product / plan',
  'Self-serve instead of contacting support',
  'Feel confident they made the right choice'
];

const defaultUserPains = [
  "I don't know where to start",
  "There's too much text / jargon",
  "I get stuck and don't know what to do next",
  "I don't understand what this means for me",
  "I'm not sure I can trust this"
];

// ============================================================================
// DOM ELEMENTS
// ============================================================================

// Kickoff page uses #app, midterm uses #surveyForm.
// Try surveyForm first, then fall back to app.
const form = document.getElementById('surveyForm') || document.getElementById('app');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');

// ============================================================================
// HELPERS
// ============================================================================
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Clipboard helper (modern + fallback)
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Copy failed', err);
  }
  document.body.removeChild(textarea);
}

// ============================================================================
// INIT
// ============================================================================
function init() {
  // Initialize default goals and pains
  project.businessGoals = defaultBusinessGoals.map(label => ({
    id: generateId(),
    label,
    selected: false,
    currentScore: 3,
    notes: '',
    isCustom: false
  }));

  project.productGoals = defaultProductGoals.map(label => ({
    id: generateId(),
    label,
    selected: false,
    currentScore: 3,
    notes: '',
    isCustom: false
  }));

  project.userGoals = defaultUserGoals.map(label => ({
    id: generateId(),
    label,
    selected: false,
    severity: 3,
    notes: '',
    type: 'goal',
    isCustom: false
  }));

  project.userPains = defaultUserPains.map(label => ({
    id: generateId(),
    label,
    selected: false,
    severity: 3,
    notes: '',
    type: 'pain',
    isCustom: false
  }));

  // Navigation buttons
  if (prevBtn) prevBtn.addEventListener('click', goToPreviousStep);
  if (nextBtn) nextBtn.addEventListener('click', goToNextStep);

  // Form events
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      goToNextStep();
    });

    form.addEventListener('change', handleFormChange);
    form.addEventListener('input', handleFormInput);
    form.addEventListener('click', handleFormClick);
  }

  // Initial render
  renderStep(project.currentStep);
  updateProgressBar();
}

// ============================================================================
// NAVIGATION
// ============================================================================
function goToNextStep() {
  if (!validateCurrentStep()) return;

  if (project.currentStep < project.totalSteps) {
    project.currentStep++;
    renderStep(project.currentStep);
    updateProgressBar();
    window.scrollTo(0, 0);
  } else {
    // We're already on the last step (summary).
    // Just hide the Next button — no separate thank-you page.
    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.style.display = "none";
    }
  }
}

function goToPreviousStep() {
  if (project.currentStep > 1) {
    project.currentStep--;
    renderStep(project.currentStep);
    updateProgressBar();
    window.scrollTo(0, 0);
  }
}

function updateProgressBar() {
  if (!progressBar) return;
  const progress = ((project.currentStep - 1) / (project.totalSteps - 1)) * 100;
  progressBar.style.width = `${progress}%`;
}

// ============================================================================
// VALIDATION
// ============================================================================
function validateCurrentStep() {
  if (project.currentStep === 1) {
    if (!project.info.name?.trim()) {
      alert('Please enter a project name');
      return false;
    }
    if (project.info.clientId === null) {
      alert('Please select or add a client');
      return false;
    }
    if (project.info.pmId === null) {
      alert('Please select or add a project manager');
      return false;
    }
  } else if (project.currentStep === 2) {
    const hasSelectedBusinessGoal = project.businessGoals.some(goal => goal.selected);
    if (!hasSelectedBusinessGoal) {
      alert('Please select at least one business goal');
      return false;
    }
    const hasSelectedProductGoal = project.productGoals.some(goal => goal.selected);
    if (!hasSelectedProductGoal) {
      if (!confirm('No product goals selected. Are you sure you want to continue?')) {
        return false;
      }
    }
  } else if (project.currentStep === 3) {
    // User goals/pains are optional; no additional validation.
  }
  // Step 4 is summary only
  return true;
}

// ============================================================================
// RENDERING
// ============================================================================
function renderStep(stepNumber) {
  if (!form) return;

  // Clear previous content
  form.innerHTML = '';

  // Create and insert the step section
  const stepElement = createStepElement(stepNumber);
  stepElement.classList.add('active');
  form.appendChild(stepElement);

  // ---- Navigation buttons ----
  if (prevBtn) {
    prevBtn.disabled = stepNumber === 1;
    prevBtn.style.display = stepNumber === 1 ? 'none' : 'inline-flex';
  }

  if (nextBtn) {
    if (stepNumber === project.totalSteps) {
      // On the summary step, we don’t show a Finish button.
      nextBtn.style.display = 'none';
      nextBtn.disabled = true;
    } else {
      nextBtn.style.display = 'inline-flex';
      nextBtn.disabled = false;
      nextBtn.textContent = 'Next';
    }
  }

  // When we land on the summary step, wire up the summary buttons
  if (stepNumber === project.totalSteps) {
    setupSummaryActions();
  }
}

function createStepElement(stepNumber) {
  const step = document.createElement('section');
  step.className = 'step';
  step.id = `step-${stepNumber}`;
  step.dataset.step = stepNumber;

  switch (stepNumber) {
    case 1:
      step.innerHTML = renderProjectInfoStep();
      break;
    case 2:
      step.innerHTML = renderBusinessGoalsStep() + renderProductGoalsStep();
      break;
    case 3:
      step.innerHTML = renderUserGoalsStep();
      break;
    case 4:
      step.innerHTML = renderSummaryStep();
      break;
  }

  return step;
}

// ============================================================================
// STEP 1: PROJECT INFO
// ============================================================================
function renderProjectInfoStep() {
  return `
    <h2>Project Information</h2>
    <div class="form-group">
      <label for="projectName">Project Name</label>
      <input type="text" id="projectName" value="${project.info.name || ''}" required>
    </div>
    
    ${renderDropdown('client', 'Client', directory.clients, project.info.clientId)}
    ${renderDropdown('pm', 'Project Manager', directory.pms, project.info.pmId)}
    ${renderDropdown('designer', 'Designer', directory.designers, project.info.designerId)}
    ${renderDropdown('dev', 'Lead Developer', directory.devs, project.info.devId)}
    
    <div class="form-group">
      <label for="otherContributors">Other Contributors</label>
      <input type="text" id="otherContributors" 
             placeholder="Comma-separated names" 
             value="${project.info.otherContributors || ''}">
      <p class="help-text">Separate names with commas</p>
    </div>
  `;
}

function renderDropdown(type, label, options, selectedId) {
  const selected = typeof selectedId === 'number' ? options[selectedId] : '';
  const cap = type.charAt(0).toUpperCase() + type.slice(1);

  return `
    <div class="form-group">
      <label for="${type}">${label}</label>
      <div class="select-wrapper">
        <select id="${type}" required>
<option value="" disabled ${!selected ? 'selected' : ''}>Select ${label}</option>
        ${options.map((item, index) => `
            <option value="${index}" ${selectedId === index ? 'selected' : ''}>${item}</option>
          `).join('')}
          <option value="__add_new__">➕ Add New ${label}...</option>
        </select>
      </div>
      <div id="new${cap}Container" 
           class="new-item-container" 
           style="display: none; margin-top: 0.5rem;">
        <div style="display: flex; gap: 0.5rem;">
          <input type="text" id="new${cap}Input" 
                 placeholder="Enter New ${label} Name" 
                 style="flex: 1;">
          <button type="button" id="add${cap}Btn" class="btn btn-secondary">Add</button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// STEP 2: BUSINESS GOALS
// ============================================================================
function renderBusinessGoalsStep() {
  return `
    <h2>Business Goals</h2>
    <p>Select all that apply</p>
    <div id="businessGoalsList">
      ${project.businessGoals.map(goal => `
        <div class="form-group checkbox-group">
          <label class="checkbox-container">
            <input type="checkbox" 
                   id="bg-${goal.id}" 
                   ${goal.selected ? 'checked' : ''}
                   data-id="${goal.id}">
            <span>${goal.label}${goal.isCustom ? ' (Custom)' : ''}</span>
          </label>
          ${goal.selected ? renderGoalDetails(goal, 'business') : ''}
        </div>
      `).join('')}
      <div class="form-group" style="margin-top: 2rem;">
        <button type="button" id="addCustomBusinessGoalBtn" class="btn btn-secondary">
  <i class="fa-solid fa-plus"></i>
  Add Business Goal        </button>
        <div id="newBusinessGoalContainer" class="new-item-container" style="display:none; margin-top:0.75rem;">
          <div style="display:flex; gap:0.5rem;">
            <input type="text" id="newBusinessGoalInput" placeholder="Enter new Business Goal" style="flex:1;">
            <button type="button" id="submitCustomBusinessGoalBtn" class="btn btn-secondary btn-sm">Add</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderGoalDetails(goal, type) {
  const namePrefix = type === 'business' ? 'rating-' : 'product-rating-';
  const notesId = type === 'business' ? `notes-${goal.id}` : `product-notes-${goal.id}`;

  return `
    <div class="card" data-goal-id="${goal.id}">
      <div class="form-group">
        <label>Current State</label>
        <div class="rating">
          <div class="rating-label">Needs Work</div>
          <div class="rating-scale">
            ${[1, 2, 3, 4, 5].map(num => `
              <label class="rating-option">
                <input type="radio" 
                       name="${namePrefix}${goal.id}" 
                       value="${num}" 
                       ${goal.currentScore === num ? 'checked' : ''}
                       data-id="${goal.id}">
                <span>${num}</span>
              </label>
            `).join('')}
          </div>
          <div class="rating-label">Excellent</div>
        </div>
      </div>
      <div class="form-group">
        <label for="${notesId}">Notes</label>
        <textarea id="${notesId}" 
                  rows="3" 
                  placeholder="Add any additional details...">${goal.notes || ''}</textarea>
      </div>
    </div>
  `;
}

// ============================================================================
// STEP 3: PRODUCT GOALS
// ============================================================================
function renderProductGoalsStep() {
  return `
    <h2>Product Goals</h2>
    <p>Select all that apply</p>
    <div id="productGoalsList">
      ${project.productGoals.map(goal => `
        <div class="form-group checkbox-group">
          <label class="checkbox-container">
            <input type="checkbox" 
                   id="pg-${goal.id}" 
                   ${goal.selected ? 'checked' : ''}
                   data-id="${goal.id}">
            <span>${goal.label}${goal.isCustom ? ' (Custom)' : ''}</span>
          </label>
          ${goal.selected ? renderGoalDetails(goal, 'product') : ''}
        </div>
      `).join('')}
      <div class="form-group" style="margin-top: 2rem;">
        <button type="button" id="addCustomProductGoalBtn" class="btn btn-secondary">
          <i class="fa-solid fa-plus"></i>
  Add Product Goal
        </button>
        <div id="newProductGoalContainer" class="new-item-container" style="display:none; margin-top:0.75rem;">
          <div style="display:flex; gap:0.5rem;">
            <input type="text" id="newProductGoalInput" placeholder="Enter new Product Goal" style="flex:1;">
            <button type="button" id="submitCustomProductGoalBtn" class="btn btn-secondary btn-sm">Add</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================================
// STEP 4: USER GOALS & PAIN POINTS
// ============================================================================
function renderUserGoalsStep() {
  return `
    <h2>User Goals and Pain Points</h2>
    <p>Select all that apply in each section</p>
    
    <div class="section">
      <h3>User Goals</h3>
      <div id="userGoalsList">
        ${project.userGoals.map(goal => `
          <div class="form-group checkbox-group">
            <label class="checkbox-container">
              <input type="checkbox" 
                     id="ug-${goal.id}" 
                     ${goal.selected ? 'checked' : ''}
                     data-id="${goal.id}">
              <span>${goal.label}${goal.isCustom ? ' (Custom)' : ''}</span>
            </label>
            ${goal.selected ? renderUserItemDetails(goal, 'goal') : ''}
          </div>
        `).join('')}
        <div class="form-group" style="margin-top: 1rem;">
          <button type="button" id="addUserGoalBtn" class="btn btn-secondary btn-sm">
<i class="fa-solid fa-plus"></i>
  Add User Goal
          </button>
          <div id="newGoalContainer" class="new-item-container" style="display:none; margin-top:0.75rem;">
            <div style="display:flex; gap:0.5rem;">
              <input type="text" id="newGoalInput" placeholder="Enter new User Goal" style="flex:1;">
              <button type="button" id="submitUserGoalBtn" class="btn btn-secondary btn-sm">Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section" style="margin-top: 2rem;">
      <h3>User Pain Points</h3>
      <div id="userPainsList">
        ${project.userPains.map(pain => `
          <div class="form-group checkbox-group">
            <label class="checkbox-container">
              <input type="checkbox" 
                     id="up-${pain.id}" 
                     ${pain.selected ? 'checked' : ''}
                     data-id="${pain.id}">
              <span>${pain.label}${pain.isCustom ? ' (Custom)' : ''}</span>
            </label>
            ${pain.selected ? renderUserItemDetails(pain, 'pain') : ''}
          </div>
        `).join('')}
        <div class="form-group" style="margin-top: 1rem;">
          <button type="button" id="addUserPainBtn" class="btn btn-secondary btn-sm">
<i class="fa-solid fa-plus"></i>
  Add Pain Point
          </button>
          <div id="newPainContainer" class="new-item-container" style="display:none; margin-top:0.75rem;">
            <div style="display:flex; gap:0.5rem;">
              <input type="text" id="newPainInput" placeholder="Enter new Pain Point" style="flex:1;">
              <button type="button" id="submitUserPainBtn" class="btn btn-secondary btn-sm">Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderUserItemDetails(item, type) {
  const label = type === 'goal' ? 'Importance' : 'Severity';
  const notesId = `${type}-notes-${item.id}`;
  const namePrefix = `${type}-severity-${item.id}`;

  return `
    <div class="card" data-item-id="${item.id}">
      <div class="form-group">
        <label>${label} Today</label>
        <div class="rating">
          <div class="rating-label">Low</div>
          <div class="rating-scale">
            ${[1, 2, 3, 4, 5].map(num => `
              <label class="rating-option">
                <input type="radio" 
                       name="${namePrefix}" 
                       value="${num}" 
                       ${item.severity === num ? 'checked' : ''}
                       data-id="${item.id}"
                       data-type="${type}">
                <span>${num}</span>
              </label>
            `).join('')}
          </div>
          <div class="rating-label">High</div>
        </div>
      </div>
      <div class="form-group">
        <label for="${notesId}">Notes</label>
        <textarea id="${notesId}" 
                  rows="3" 
                  placeholder="Add any additional details...">${item.notes || ''}</textarea>
      </div>
    </div>
  `;
}

// ============================================================================
// STEP 5: SUMMARY
// ============================================================================
function renderSummaryStep() {
  const selectedBusinessGoals = project.businessGoals.filter(g => g.selected);
  const selectedProductGoals = project.productGoals.filter(g => g.selected);
  const selectedUserGoals = project.userGoals.filter(g => g.selected);
  const selectedUserPains = project.userPains.filter(p => p.selected);

  const internalSummary = buildInternalSummary(project, directory);
  const clientSummary = buildClientSummary(project, directory);
  const goalNarratives = buildGoalNarratives(
    selectedBusinessGoals,
    selectedProductGoals,
    selectedUserGoals,
    selectedUserPains
  );

  return `
    <h2>Review & Share</h2>
    <p class="help-text">
      Here’s a summary you can share with your team and client. You can also set a mid-project review reminder.
    </p>

    <section class="summary-section">
      <h3>1. Internal Team Kickoff Summary</h3>
      <p class="help-text">Use this in Asana, Slack, or your internal kickoff doc.</p>
      <textarea id="internalSummary" rows="10" readonly>${internalSummary}</textarea>
      <div class="form-actions" style="margin-top: 0.75rem;">
        <button type="button" id="copyInternalSummary" class="btn btn-secondary">
          <i class="fa-solid fa-copy"></i>
          Copy Internal Summary
        </button>
      </div>
    </section>

    <section class="summary-section">
      <h3>2. Client-Friendly Summary</h3>
      <p class="help-text">Use this in a follow-up email or slide for the client to confirm project goals.</p>
      <textarea id="clientSummary" rows="10" readonly>${clientSummary}</textarea>
      <div class="form-actions" style="margin-top: 0.75rem;">
        <button type="button" id="copyClientSummary" class="btn btn-secondary">
          <i class="fa-solid fa-copy"></i>
          Copy Client Summary
        </button>
      </div>
    </section>

        <section class="summary-section">
      <h3>3. Goal Narratives</h3>
      <p class="help-text">
        These sentences connect business, product, and user goals. Great for PM notes or future case studies.
      </p>
      <textarea id="goalNarratives" rows="12" readonly>${goalNarratives}</textarea>
      <div class="form-actions" style="margin-top: 0.75rem;">
        <button type="button" id="copyGoalNarratives" class="btn btn-secondary">
          <i class="fa-solid fa-copy"></i>
          Copy Goal Narratives
        </button>
        <button type="button" id="copyChatGPTPromptBtn" class="btn btn-secondary btn-sm">
          <i class="fa-solid fa-robot"></i>
          Refine with ChatGPT
        </button>
      </div>
    </section>

    <section class="summary-section">
      <h3>4. Mid-Project Review Reminder</h3>
      <p class="help-text">
        Create a calendar event ~3 weeks from today with your internal summary in the description.
      </p>
      <div class="form-actions">
        <button type="button" id="createCalendarEventBtn" class="btn btn-primary">
                <i class="fa-solid fa-calendar"></i>
          Add Mid-Project Review to Google Calendar
        </button>
      </div>
    </section>

    <section class="summary-section">
  <h3>5. Project Dashboard</h3>
  <p class="help-text">
    Open the evolving project dashboard based on completed surveys.  
    Kickoff-only data appears now — midterm and final reviews will enrich it.
  </p>

  <div class="form-actions" style="display:flex; gap:0.75rem; margin-top:1rem;">
    <button
      type="button"
      class="btn btn-primary"
      onclick="openDashboardFromKickoff()"
    >
      <i class="fa-solid fa-chart-line"></i>
      View Dashboard
    </button>
  </div>
</section>
  `;
}

// ============================================================================
// SUMMARY HELPERS
// ============================================================================
function buildInternalSummary(project, directory) {
  const clientName = project.info.clientId != null
    ? directory.clients[project.info.clientId]
    : 'N/A';
  const pmName = project.info.pmId != null
    ? directory.pms[project.info.pmId]
    : 'N/A';
  const designerName = project.info.designerId != null
    ? directory.designers[project.info.designerId]
    : 'N/A';
  const devName = project.info.devId != null
    ? directory.devs[project.info.devId]
    : 'N/A';

  const selectedBusinessGoals = project.businessGoals.filter(g => g.selected);
  const selectedProductGoals = project.productGoals.filter(g => g.selected);
  const selectedUserGoals = project.userGoals.filter(g => g.selected);
  const selectedUserPains = project.userPains.filter(p => p.selected);

  let lines = [];

  lines.push(`PROJECT KICKOFF SUMMARY — INTERNAL`);
  lines.push(`----------------------------------`);
  lines.push(`Project: ${project.info.name || 'Untitled project'}`);
  lines.push(`Client: ${clientName}`);
  lines.push(`PM: ${pmName}`);
  lines.push(`Product Designer: ${designerName}`);
  lines.push(`Lead Developer: ${devName}`);
  if (project.info.otherContributors?.trim()) {
    lines.push(`Other Contributors: ${project.info.otherContributors.trim()}`);
  }
  lines.push('');

  if (selectedBusinessGoals.length) {
    lines.push(`Business Goals:`);
    selectedBusinessGoals.forEach(g => {
      lines.push(`• ${g.label} (current state: ${g.currentScore}/5)`);
    });
    lines.push('');
  }

  if (selectedProductGoals.length) {
    lines.push(`Product / Experience Goals:`);
    selectedProductGoals.forEach(g => {
      lines.push(`• ${g.label} (current state: ${g.currentScore}/5)`);
    });
    lines.push('');
  }

  if (selectedUserGoals.length) {
    lines.push(`User Goals:`);
    selectedUserGoals.forEach(g => {
      lines.push(`• ${g.label} (importance today: ${g.severity}/5)`);
    });
    lines.push('');
  }

  if (selectedUserPains.length) {
    lines.push(`User Pain Points:`);
    selectedUserPains.forEach(p => {
      lines.push(`• ${p.label} (severity today: ${p.severity}/5)`);
    });
    lines.push('');
  }


  return lines.join('\n');
}

function buildClientSummary(project, directory) {
  const clientName = project.info.clientId != null
    ? directory.clients[project.info.clientId]
    : 'your organization';
  const selectedBusinessGoals = project.businessGoals.filter(g => g.selected);
  const selectedProductGoals = project.productGoals.filter(g => g.selected);
  const selectedUserGoals = project.userGoals.filter(g => g.selected);
  const selectedUserPains = project.userPains.filter(p => p.selected);

  const projectName = project.info.name || 'this project';

  let lines = [];

  lines.push(`Hi ${clientName},`);
  lines.push('');
  lines.push(`Here’s a quick summary of what we aligned on for ${projectName}:`);
  lines.push('');

  if (selectedBusinessGoals.length) {
    lines.push(`Business goals we’re focusing on:`);
    selectedBusinessGoals.forEach(g => {
      lines.push(`• ${g.label}`);
    });
    lines.push('');
  }

  if (selectedProductGoals.length) {
    lines.push(`Product / experience improvements:`);
    selectedProductGoals.forEach(g => {
      lines.push(`• ${g.label}`);
    });
    lines.push('');
  }

  if (selectedUserGoals.length || selectedUserPains.length) {
    lines.push(`What this means for your users:`);
    if (selectedUserGoals.length) {
      selectedUserGoals.forEach(g => {
        lines.push(`• Help users ${g.label}`);
      });
    }
    if (selectedUserPains.length) {
      selectedUserPains.forEach(p => {
        lines.push(`• Reduce friction around “${p.label}”`);
      });
    }
    lines.push('');
  }

  lines.push(
    `If anything here feels off or incomplete, we’d love your feedback before we move deeper into design and implementation.`
  );
  lines.push('');
  lines.push(`Best,`);
  lines.push(`The Thinklogic team`);

  return lines.join('\n');
}

function buildGoalNarratives(businessGoals, productGoals, userGoals, userPains) {
  let lines = [];

  lines.push(`GOAL NARRATIVES`);
  lines.push(`----------------`);
  lines.push('');

  if (businessGoals.length) {
    lines.push(`Business impact statements:`);
    businessGoals.forEach(g => {
      lines.push(
        `• By focusing on “${g.label}” (currently rated ${g.currentScore}/5), ` +
        `we expect to move the needle on core business outcomes for this project.`
      );
    });
    lines.push('');
  }

  if (productGoals.length) {
    lines.push(`Product/UX alignment:`);
    productGoals.forEach(g => {
      lines.push(
        `• Improving “${g.label}” (current state ${g.currentScore}/5) is a key lever ` +
        `to support the business goals above.`
      );
    });
    lines.push('');
  }

  if (userGoals.length) {
    lines.push(`User goals:`);
    userGoals.forEach(g => {
      lines.push(
        `• Users want to “${g.label}” (importance ${g.severity}/5), ` +
        `and this project is designed to make that significantly easier.`
      );
    });
    lines.push('');
  }

  if (userPains.length) {
    lines.push(`User pains:`);
    userPains.forEach(p => {
      lines.push(
        `• Users are currently blocked by “${p.label}” (severity ${p.severity}/5); ` +
        `we are explicitly targeting this friction to reduce drop-off and frustration.`
      );
    });
    lines.push('');
  }

  if (!businessGoals.length && !productGoals.length && !userGoals.length && !userPains.length) {
    lines.push(`No goals selected yet. Once you’ve selected goals in previous steps, narratives will appear here.`);
  }

  return lines.join('\n');
}

function setupSummaryActions() {
  const internalBtn = document.getElementById('copyInternalSummary');
  const clientBtn = document.getElementById('copyClientSummary');
  const narrativeBtn = document.getElementById('copyGoalNarratives');
  const jsonBtn = document.getElementById('copyJsonBtn');
  const calendarBtn = document.getElementById('createCalendarEventBtn');
  const statusEl = document.getElementById('copyStatus');
const chatGPTBtn = document.getElementById('copyChatGPTPromptBtn');

  function showStatus(message) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 2500);
  }

  if (internalBtn) {
    internalBtn.addEventListener('click', () => {
      const textArea = document.getElementById('internalSummary');
      if (textArea) {
        copyToClipboard(textArea.value);
        showStatus('✅ Internal summary copied to clipboard');
      }
    });
  }

  if (clientBtn) {
    clientBtn.addEventListener('click', () => {
      const textArea = document.getElementById('clientSummary');
      if (textArea) {
        copyToClipboard(textArea.value);
        showStatus('✅ Client summary copied to clipboard');
      }
    });
  }

  if (narrativeBtn) {
    narrativeBtn.addEventListener('click', () => {
      const textArea = document.getElementById('goalNarratives');
      if (textArea) {
        copyToClipboard(textArea.value);
        showStatus('✅ Goal narratives copied to clipboard');
      }
    });
  }

  if (jsonBtn) {
    jsonBtn.addEventListener('click', () => {
      copyToClipboard(JSON.stringify(project, null, 2));
      showStatus('✅ Raw JSON copied to clipboard');
    });
  }

if (calendarBtn) {
  calendarBtn.addEventListener('click', () => {
    // Save full kickoff data for the midterm survey
    try {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const payload = {
        info: {
          ...project.info,
          kickoffDate: project.info.kickoffDate || today,
          lastUpdated: today
        },
        directory,
        businessGoals: project.businessGoals,
        productGoals: project.productGoals,
        userGoals: project.userGoals,
        userPains: project.userPains,
        kickoffDate: project.info.kickoffDate || today,
        lastUpdated: today
      };
      localStorage.setItem('metricMateKickoff', JSON.stringify(payload));
    } catch (e) {
      console.warn('Could not save kickoff data to localStorage', e);
    }

    const url = buildCalendarUrl(project, directory);
    window.open(url, '_blank');
  });
}

    if (chatGPTBtn) {
    chatGPTBtn.addEventListener('click', () => {
      const narrativesEl = document.getElementById('goalNarratives');
      const narratives = narrativesEl ? narrativesEl.value : '';

      const prompt = `
You are a Product Designer and PM collaborating on a project kickoff.

Rewrite and tighten the following goal narratives so they:
- stay true to the intent
- are clear and client-friendly
- are concise enough to paste into Asana or a project brief

Keep them as bullet points.

Here are the current narratives:
${narratives}
      `.trim();

      copyToClipboard(prompt);
      showStatus('✨ ChatGPT prompt copied to clipboard');
    });
  }
}

function buildCalendarUrl(project, directory) {
  const projectName = project.info.name || 'Project';
  const clientName =
    project.info.clientId != null
      ? directory.clients[project.info.clientId]
      : 'Client';

  const internalSummary = buildInternalSummary(project, directory);

  // Build a local file URL for the midterm survey (fallback to current origin)
  const midtermUrl =
    window.location.protocol === 'file:'
      ? new URL('midterm.html', window.location.href).href
      : 'file:///Users/lisa/Code/metric-mate/midterm.html';

  // Date ~21 days from now, 9–10am local
  const start = new Date();
  start.setDate(start.getDate() + 21);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start.getTime());
  end.setHours(10);

  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${mins}${secs}`;
  };

  const startStr = formatDate(start);
  const endStr = formatDate(end);

  const title = `Mid-project review: ${projectName} (${clientName})`;

  const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const params = new URLSearchParams({
    text: title,
    details: `${internalSummary}\n\nMid-project review form:\n${midtermUrl}`,
    dates: `${startStr}/${endStr}`,
  });

  return `${base}&${params.toString()}`;
}

// ============================================================================
// FORM EVENT HANDLERS
// ============================================================================
function handleFormChange(e) {
  const target = e.target;

  // 1) DROPDOWNS
  if (target.tagName === 'SELECT') {
    handleDropdownChange(target);
    return;
  }

  // 2) CHECKBOXES (business / product / user-goals / user-pains)
  if (target.type === 'checkbox') {
    // Business goals (ids: bg-<id>)
    if (target.id.startsWith('bg-')) {
      const goalId = target.dataset.id;
      const goal = project.businessGoals.find(g => g.id === goalId);
      if (goal) {
        goal.selected = target.checked;
        renderStep(project.currentStep); // re-render to show/hide card
      }
      return;
    }

    // Product goals (ids: pg-<id>)
    if (target.id.startsWith('pg-')) {
      const goalId = target.dataset.id;
      const goal = project.productGoals.find(g => g.id === goalId);
      if (goal) {
        goal.selected = target.checked;
        renderStep(project.currentStep);
      }
      return;
    }

    // User goals (ids: ug-<id>)
    if (target.id.startsWith('ug-')) {
      const goalId = target.dataset.id;
      const goal = project.userGoals.find(g => g.id === goalId);
      if (goal) {
        goal.selected = target.checked;
        renderStep(project.currentStep);
      }
      return;
    }

    // User pains (ids: up-<id>)
    if (target.id.startsWith('up-')) {
      const painId = target.dataset.id;
      const pain = project.userPains.find(p => p.id === painId);
      if (pain) {
        pain.selected = target.checked;
        renderStep(project.currentStep);
      }
      return;
    }
  }

  // 3) RADIO BUTTONS (ratings)

  // Business goal rating: name="rating-<goalId>"
  if (target.type === 'radio' && target.name.startsWith('rating-')) {
    const goalId = target.dataset.id;
    const score = parseInt(target.value, 10);
    const goal = project.businessGoals.find(g => g.id === goalId);
    if (goal) {
      goal.currentScore = score;
    }
    return;
  }

  // Product goal rating: name="product-rating-<goalId>"
  if (target.type === 'radio' && target.name.startsWith('product-rating-')) {
    const goalId = target.dataset.id;
    const score = parseInt(target.value, 10);
    const goal = project.productGoals.find(g => g.id === goalId);
    if (goal) {
      goal.currentScore = score;
    }
    return;
  }

  // User goals / pains severity: name="goal-severity-..." or "pain-severity-..."
  if (target.type === 'radio' && target.name.includes('-severity-')) {
    const itemId = target.dataset.id;
    const itemType = target.dataset.type; // 'goal' or 'pain'
    const severity = parseInt(target.value, 10);
    const collection = itemType === 'goal' ? project.userGoals : project.userPains;
    const item = collection.find(i => i.id === itemId);
    if (item) {
      item.severity = severity;
    }
  }
}

function handleFormInput(e) {
  const target = e.target;

  if (target.id === 'projectName') {
    project.info.name = target.value;
    return;
  }

  if (target.id === 'otherContributors') {
    project.info.otherContributors = target.value;
    return;
  }

  // Business goal notes
  if (target.matches('#businessGoalsList textarea')) {
    const goalId = target.id.replace('notes-', '');
    const goal = project.businessGoals.find(g => g.id === goalId);
    if (goal) goal.notes = target.value;
    return;
  }

  // Product goal notes
  if (target.matches('#productGoalsList textarea')) {
    const goalId = target.id.replace('product-notes-', '');
    const goal = project.productGoals.find(g => g.id === goalId);
    if (goal) goal.notes = target.value;
    return;
  }

  // User goal notes
  if (target.matches('#userGoalsList textarea')) {
    const goalId = target.id.replace('goal-notes-', '');
    const goal = project.userGoals.find(g => g.id === goalId);
    if (goal) goal.notes = target.value;
    return;
  }

  // User pain notes
  if (target.matches('#userPainsList textarea')) {
    const painId = target.id.replace('pain-notes-', '');
    const pain = project.userPains.find(p => p.id === painId);
    if (pain) pain.notes = target.value;
  }
}

function handleFormClick(e) {
  const target = e.target;
  const id = target.id;

  // New directory items (client/pm/designer/dev)
  if (id.startsWith('add') && id.endsWith('Btn') &&
      id !== 'addCustomBusinessGoalBtn' &&
      id !== 'addCustomProductGoalBtn' &&
      id !== 'addUserGoalBtn' &&
      id !== 'addUserPainBtn') {
    handleAddNewItem(target);
    return;
  }

  // Custom business goal
  if (id === 'addCustomBusinessGoalBtn') {
    toggleCustomGoalForm('business');
    return;
  }

  if (id === 'submitCustomBusinessGoalBtn') {
    addCustomGoalFromInput('business');
    return;
  }

  // Custom product goal
  if (id === 'addCustomProductGoalBtn') {
    toggleCustomGoalForm('product');
    return;
  }

  if (id === 'submitCustomProductGoalBtn') {
    addCustomGoalFromInput('product');
    return;
  }

  // Custom user goal
  if (id === 'addUserGoalBtn') {
    toggleCustomUserForm('goal');
    return;
  }

  if (id === 'submitUserGoalBtn') {
    addCustomUserItemFromInput('goal');
    return;
  }

  // Custom user pain
  if (id === 'addUserPainBtn') {
    toggleCustomUserForm('pain');
    return;
  }

  if (id === 'submitUserPainBtn') {
    addCustomUserItemFromInput('pain');
    return;
  }
}

// ============================================================================
// DROPDOWNS + CUSTOM ITEMS
// ============================================================================

function handleDropdownChange(select) {
  const type = select.id;
  const value = select.value;

  if (value === '__add_new__') {
    const cap = type.charAt(0).toUpperCase() + type.slice(1);
    const container = document.getElementById(`new${cap}Container`);
    if (container) {
      container.style.display = 'block';
      const input = container.querySelector('input');
      if (input) input.focus();
    }
    select.value = '';
  } else if (value) {
    const index = parseInt(value, 10);
    if (!isNaN(index)) {
      const typeMap = {
        client: 'clientId',
        pm: 'pmId',
        designer: 'designerId',
        dev: 'devId'
      };
      const key = typeMap[type];
      if (key) project.info[key] = index;
    }
  }
}

function handleAddNewItem(button) {
  const rawType = button.id.replace('add', '').replace('Btn', '');
  const type = rawType.charAt(0).toLowerCase() + rawType.slice(1);
  const cap = rawType.charAt(0).toUpperCase() + rawType.slice(1);
  const input = document.getElementById(`new${cap}Input`);

  if (!input || !input.value.trim()) return;

  const newItem = input.value.trim();
  const typeMap = {
    client: 'clients',
    pm: 'pms',
    designer: 'designers',
    dev: 'devs'
  };

  const arrayKey = typeMap[type];
  if (arrayKey) {
    const index = directory[arrayKey].length;
    directory[arrayKey].push(newItem);

    const infoKey = `${type}Id`;
    project.info[infoKey] = index;

    // Clear the input and hide the adder
    input.value = '';
    const container = document.getElementById(`new${cap}Container`);
    if (container) container.style.display = 'none';

    renderStep(project.currentStep);
  }
}

function toggleCustomGoalForm(type) {
  const cap = type === 'business' ? 'Business' : 'Product';
  const container = document.getElementById(`new${cap}GoalContainer`);
  if (container) {
    const isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      const input = document.getElementById(`new${cap}GoalInput`);
      if (input) input.focus();
    }
  }
}

function addCustomGoalFromInput(type) {
  const cap = type === 'business' ? 'Business' : 'Product';
  const input = document.getElementById(`new${cap}GoalInput`);
  if (!input || !input.value.trim()) return;

  const newGoal = input.value.trim();

  const goal = {
    id: generateId(),
    label: newGoal,
    selected: true,
    currentScore: 3,
    notes: '',
    isCustom: true
  };

  if (type === 'business') {
    project.businessGoals.push(goal);
  } else {
    project.productGoals.push(goal);
  }

  renderStep(project.currentStep);
  input.value = '';
  const container = document.getElementById(`new${cap}GoalContainer`);
  if (container) container.style.display = 'none';
}

function toggleCustomUserForm(type) {
  const containerId = type === 'goal' ? 'newGoalContainer' : 'newPainContainer';
  const inputId = type === 'goal' ? 'newGoalInput' : 'newPainInput';
  const container = document.getElementById(containerId);
  if (container) {
    const isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
      const input = document.getElementById(inputId);
      if (input) input.focus();
    }
  }
}

function addCustomUserItemFromInput(type) {
  const label = type === 'goal' ? 'user goal' : 'pain point';
  const inputId = type === 'goal' ? 'newGoalInput' : 'newPainInput';
  const containerId = type === 'goal' ? 'newGoalContainer' : 'newPainContainer';
  const input = document.getElementById(inputId);
  if (!input || !input.value.trim()) return;

  const newItem = input.value.trim();

  const item = {
    id: generateId(),
    label: newItem,
    selected: true,
    severity: 3,
    notes: '',
    type,
    isCustom: true
  };

  if (type === 'goal') {
    project.userGoals.push(item);
  } else {
    project.userPains.push(item);
  }

  renderStep(project.currentStep);
  input.value = '';
  const container = document.getElementById(containerId);
  if (container) container.style.display = 'none';
}

// ============================================================================
// DASHBOARD LAUNCHER – KICKOFF → DASHBOARD PAYLOAD
// ============================================================================

function buildDashboardPayloadFromKickoff() {
  // Stamp a simple kickoff date if you like; otherwise omit this
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const kickoff = {
    info: {
      ...project.info,
      kickoffDate: project.info.kickoffDate || today,
      lastUpdated: today
    },
    directory: { ...directory },
    businessGoals: project.businessGoals,
    productGoals: project.productGoals,
    userGoals: project.userGoals,
    userPains: project.userPains,
    lastUpdated: today
  };

  const proj = {
    name: project.info.name || '',
    clientId: project.info.clientId,
    pmId: project.info.pmId,
    designerId: project.info.designerId,
    devId: project.info.devId,
    kickoffDate: kickoff.info.kickoffDate,
    lastUpdated: today
  };

  return {
    kickoff,
    project: proj,
    midterm: null,
    final: null,
    finalSummary: ''
  };
}

// Open dashboard with kickoff-only data
function openDashboardFromKickoff() {
  const lastUpdated = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Build a kickoff payload that includes all the goals & pains
  const kickoffPayload = {
    info: {
      ...project.info,
      kickoffDate: project.info.kickoffDate || lastUpdated,
      lastUpdated
    },
    directory,
    businessGoals: project.businessGoals,
    productGoals: project.productGoals,
    userGoals: project.userGoals,
    userPains: project.userPains,
    kickoffDate: project.info.kickoffDate || lastUpdated,
    lastUpdated
  };

  // Dashboard expects an object like { kickoff: {...}, project?: {...}, ... }
  const data = {
    kickoff: kickoffPayload
    // we don't need to pass project here;
    // dashboard-data.js derives project meta from kickoff.info + directory
  };

  // Persist for other pages (and as a fallback if the dashboard opens without ?data=)
  try {
    localStorage.setItem('metricMateKickoff', JSON.stringify(kickoffPayload));
    localStorage.setItem('metricMateDashboard', JSON.stringify(data));
    console.log('[dashboard-launch] Saved metricMateKickoff + metricMateDashboard', {
      kickoffPayload,
      data
    });
  } catch (e) {
    console.warn('Could not save kickoff data to localStorage before opening dashboard', e);
  }

  const url = `dashboard.html?data=${encodeURIComponent(JSON.stringify(data))}`;
  window.open(url, "_blank");
}

// ============================================================================
// BOOTSTRAP
// ============================================================================
document.addEventListener('DOMContentLoaded', init);
