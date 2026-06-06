/* ============================================================
   BharatFlow — onboarding.js
   ============================================================ */

'use strict';

let currentStep = 1;
const totalSteps = 4;

// Keywords / block / domain arrays
const keywords = [];
const blockWords = [];
const domains = [];

// ========================
// STEP NAVIGATION
// ========================
function nextStep(e, targetStep) {
  if (e) e.preventDefault();
  if (!validateStep(currentStep)) return;

  // Save current step data
  saveStepData(currentStep);

  transitionToStep(targetStep);
}

function prevStep(targetStep) {
  transitionToStep(targetStep);
}

function transitionToStep(step) {
  const current = document.getElementById(`step-${currentStep}`);
  const next    = document.getElementById(`step-${step}`);
  if (!next) return;

  current.classList.remove('active');
  next.classList.add('active');
  currentStep = step;
  updateProgressUI();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressUI() {
  const dots  = document.querySelectorAll('.step-dot');
  const lines = document.querySelectorAll('.step-line');
  const label = document.getElementById('step-label');

  const stepLabels = ['Your Profile', 'Your Goals', 'Filter Settings', 'Connect Gmail'];

  dots.forEach((dot, i) => {
    const step = i + 1;
    dot.classList.remove('active', 'done');
    if (step < currentStep) dot.classList.add('done');
    if (step === currentStep) dot.classList.add('active');
  });

  lines.forEach((line, i) => {
    line.classList.toggle('done', i + 1 < currentStep);
  });

  if (label) label.textContent = `Step ${currentStep} of ${totalSteps} — ${stepLabels[currentStep - 1]}`;
}

// ========================
// VALIDATION
// ========================
function validateStep(step) {
  if (step === 1) {
    const fname = document.getElementById('p-fname')?.value.trim();
    const email = document.getElementById('p-email')?.value.trim();
    const phone = document.getElementById('p-phone')?.value.trim();
    const prof  = document.getElementById('p-profession')?.value;

    if (!fname) { showToast('Please enter your first name', 'warning'); return false; }
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) { showToast('Enter a valid email address', 'warning'); return false; }
    if (!phone || !/^\d{10}$/.test(phone)) { showToast('Enter a valid 10-digit mobile number', 'warning'); return false; }
    if (!prof) { showToast('Please select your profession', 'warning'); return false; }
    return true;
  }

  if (step === 2) {
    const selected = document.querySelectorAll('input[name="goals"]:checked');
    if (selected.length === 0) { showToast('Please select at least one goal', 'warning'); return false; }
    return true;
  }

  return true; // Steps 3 & 4 are optional
}

// ========================
// SAVE STEP DATA
// ========================
function saveStepData(step) {
  const profile = JSON.parse(localStorage.getItem('bf_profile') || '{}');

  if (step === 1) {
    profile.firstName   = document.getElementById('p-fname')?.value.trim();
    profile.lastName    = document.getElementById('p-lname')?.value.trim();
    profile.email       = document.getElementById('p-email')?.value.trim();
    profile.phone       = '+91' + document.getElementById('p-phone')?.value.trim();
    profile.profession  = document.getElementById('p-profession')?.value;
    profile.timezone    = document.getElementById('p-timezone')?.value;
    profile.frequency   = document.querySelector('input[name="frequency"]:checked')?.value;
  }

  if (step === 2) {
    profile.goals = Array.from(document.querySelectorAll('input[name="goals"]:checked')).map(i => i.value);
  }

  if (step === 3) {
    profile.keywords   = [...keywords];
    profile.blockWords = [...blockWords];
    profile.domains    = [...domains];
    profile.threshold  = document.getElementById('relevance-slider')?.value;
    profile.quietFrom  = document.getElementById('quiet-from')?.value;
    profile.quietTo    = document.getElementById('quiet-to')?.value;
  }

  localStorage.setItem('bf_profile', JSON.stringify(profile));
}

// ========================
// TAG INPUT MANAGEMENT
// ========================
function setupTagInput(inputId, displayId, arr, type = 'primary') {
  const input   = document.getElementById(inputId);
  const display = document.getElementById(displayId);
  if (!input || !display) return;

  input.addEventListener('keydown', (e) => {
    if (['Enter', ',', 'Tab'].includes(e.key)) {
      e.preventDefault();
      const val = input.value.trim().replace(/,$/,'').trim();
      if (val && !arr.includes(val)) {
        arr.push(val);
        renderTags(display, arr, type);
        input.value = '';
      }
    }
    // Backspace to remove last tag
    if (e.key === 'Backspace' && !input.value && arr.length) {
      arr.pop();
      renderTags(display, arr, type);
    }
  });
}

function renderTags(display, arr, type = 'primary') {
  display.innerHTML = arr.map((t, i) => `
    <span class="tag tag-${type}">
      ${t}
      <span class="tag-remove" onclick="removeTag(${i}, '${display.id}')">✕</span>
    </span>
  `).join('');
}

function removeTag(index, displayId) {
  const map = {
    'keywords-display': keywords,
    'block-display':    blockWords,
    'domain-display':   domains,
  };
  const arr = map[displayId];
  if (!arr) return;
  arr.splice(index, 1);
  renderTags(document.getElementById(displayId), arr,
    displayId === 'block-display' ? 'red' : displayId === 'domain-display' ? 'accent' : 'primary');
}

function addQuickTag(word) { if (!keywords.includes(word)) { keywords.push(word); renderTags(document.getElementById('keywords-display'), keywords, 'primary'); } }
function addQuickBlock(word) { if (!blockWords.includes(word)) { blockWords.push(word); renderTags(document.getElementById('block-display'), blockWords, 'red'); } }
function addQuickDomain(word) { if (!domains.includes(word)) { domains.push(word); renderTags(document.getElementById('domain-display'), domains, 'accent'); } }

// ========================
// RANGE SLIDER
// ========================
function updateSlider(input) {
  const val = input.value;
  document.getElementById('range-val').textContent = val + '%';
  const pct = val + '%';
  input.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${pct}, var(--border) ${pct}, var(--border) 100%)`;
}

// ========================
// GMAIL CONNECT
// ========================
function connectGmail() {
  const btn  = document.getElementById('btn-gmail');
  const card = document.getElementById('gmail-connect-card');
  if (!btn) return;

  btn.textContent = 'Connecting…';
  btn.disabled = true;

  // Simulate OAuth
  setTimeout(() => {
    card.classList.add('connected');
    btn.textContent = '✓ Connected';
    btn.classList.remove('btn-outline');
    btn.classList.add('btn-sm');
    btn.style.background = 'rgba(6,214,160,0.15)';
    btn.style.color = 'var(--accent2)';
    btn.style.border = '1px solid rgba(6,214,160,0.3)';
    btn.disabled = true;

    // Pre-fill WA number from profile
    const profile = JSON.parse(localStorage.getItem('bf_profile') || '{}');
    const waInput = document.getElementById('wa-test-num');
    if (waInput && profile.phone) waInput.value = profile.phone;

    showToast('Gmail connected successfully! 🎉', 'success');
  }, 1800);
}

// ========================
// WA TEST MESSAGE
// ========================
function sendWATest() {
  const num = document.getElementById('wa-test-num')?.value.trim();
  const btn = document.getElementById('btn-wa-test');
  if (!num) { showToast('Enter a WhatsApp number first', 'warning'); return; }
  if (btn) btn.disabled = true;

  showToast('Sending test message via WhatsApp…', 'info');
  setTimeout(() => {
    showToast('✅ Test message sent! Check your WhatsApp.', 'success');
    if (btn) btn.disabled = false;
  }, 2000);
}

// ========================
// COMPLETE ONBOARDING
// ========================
function completeOnboarding() {
  saveStepData(4);
  localStorage.setItem('bf_onboarded', '1');
  showToast('🚀 You\'re all set! Launching your dashboard…', 'success');
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
}

function skipOnboarding() {
  localStorage.setItem('bf_onboarded', '1');
  window.location.href = 'dashboard.html';
}

// ========================
// INIT
// ========================
document.addEventListener('DOMContentLoaded', () => {
  setupTagInput('keyword-input', 'keywords-display', keywords, 'primary');
  setupTagInput('block-input',   'block-display',    blockWords, 'red');
  setupTagInput('domain-input',  'domain-display',   domains, 'accent');

  // Frequency cards click
  document.querySelectorAll('.freq-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.freq-card').forEach(c => c.style.borderColor = '');
    });
  });

  // Goal cards click feedback
  document.querySelectorAll('.goal-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
    });
  });

  updateProgressUI();
});
