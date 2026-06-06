/* ============================================================
   BharatFlow — dashboard.js
   ============================================================ */

'use strict';

// ========================
// SAMPLE DATA
// ========================
const SAMPLE_FILTERS = [
  { id: 1, name: 'SDE Job Alerts', type: 'job',     keywords: ['SDE', 'Backend', 'Python', 'remote'], domain: 'linkedin.com, naukri.com', priority: 'high',   active: true,  hits: 42, created: '2025-05-20' },
  { id: 2, name: 'GitHub PRs',     type: 'code',    keywords: ['PR', 'review', 'merge'],              domain: 'github.com',               priority: 'high',   active: true,  hits: 18, created: '2025-05-22' },
  { id: 3, name: 'Tech News',      type: 'news',    keywords: ['AI', 'LLM', 'startup'],               domain: 'techcrunch.com, hn.com',   priority: 'medium', active: true,  hits: 31, created: '2025-05-25' },
  { id: 4, name: 'AWS Alerts',     type: 'monitor', keywords: ['CPU', 'spike', 'alarm', 'EC2'],       domain: 'aws.amazon.com',           priority: 'high',   active: true,  hits: 9,  created: '2025-06-01' },
  { id: 5, name: 'Courses',        type: 'learning',keywords: ['course', 'certification', 'free'],    domain: 'coursera.com, udemy.com',  priority: 'low',    active: false, hits: 5,  created: '2025-06-03' },
];

const SAMPLE_FEED = [
  { id: 1,  type: 'sent',     icon: '💼', color: '#06D6A0', title: 'SDE-2 Opening at Flipkart',           source: 'LinkedIn',    time: '2 min ago',  filter: 'SDE Job Alerts' },
  { id: 2,  type: 'filtered', icon: '🚫', color: '#FF4D6D', title: '50% off — Sale ends midnight!',        source: 'Spam',        time: '5 min ago',  filter: 'Blocked' },
  { id: 3,  type: 'sent',     icon: '🐙', color: '#6C3BF5', title: 'PR #142 Review Requested',             source: 'GitHub',      time: '8 min ago',  filter: 'GitHub PRs' },
  { id: 4,  type: 'queued',   icon: '⏳', color: '#F5A623', title: 'AWS CPU Spike 89% — us-east-1',        source: 'AWS Monitor', time: '12 min ago', filter: 'AWS Alerts' },
  { id: 5,  type: 'sent',     icon: '📰', color: '#4F8EF7', title: 'OpenAI releases GPT-5 — TechCrunch',   source: 'TechCrunch',  time: '18 min ago', filter: 'Tech News' },
  { id: 6,  type: 'filtered', icon: '🚫', color: '#FF4D6D', title: 'You\'ve been selected as a winner!',   source: 'Spam',        time: '25 min ago', filter: 'Blocked' },
  { id: 7,  type: 'sent',     icon: '💼', color: '#06D6A0', title: 'Backend Engineer at Zepto (remote)',   source: 'Naukri',      time: '32 min ago', filter: 'SDE Job Alerts' },
  { id: 8,  type: 'sent',     icon: '🐙', color: '#6C3BF5', title: 'Merged: Fix auth token expiry #138',   source: 'GitHub',      time: '41 min ago', filter: 'GitHub PRs' },
  { id: 9,  type: 'queued',   icon: '⏳', color: '#F5A623', title: 'LeetCode contest starting in 30 min',  source: 'LeetCode',    time: '50 min ago', filter: 'Custom' },
  { id: 10, type: 'sent',     icon: '📰', color: '#4F8EF7', title: 'Mistral 3 crushes benchmarks — HN',    source: 'HN',          time: '1 hr ago',   filter: 'Tech News' },
];

let filtersData = [...SAMPLE_FILTERS];
let feedData    = [...SAMPLE_FEED];
let systemActive = true;
let editingFilterId = null;

// ========================
// SECTION NAVIGATION
// ========================
function showSection(name, navEl) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`section-${name}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const clicked = navEl || document.querySelector(`[data-section="${name}"]`);
  if (clicked) clicked.classList.add('active');

  // Close mobile sidebar
  closeSidebar();

  // Lazy-render sections
  if (name === 'overview') renderOverview();
  if (name === 'filters')  renderFilters();
  if (name === 'feed')     renderFeed();
  if (name === 'analytics') renderAnalytics();
  if (name === 'settings') {} // static
}

// ========================
// SIDEBAR (MOBILE)
// ========================
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
}

// ========================
// OVERVIEW RENDER
// ========================
function renderOverview() {
  renderRecentFeed();
  renderQuickFilters();
}

function renderRecentFeed() {
  const list = document.getElementById('feed-list');
  if (!list) return;
  const items = feedData.filter(f => f.type === 'sent').slice(0, 4);
  list.innerHTML = items.map(item => `
    <div class="feed-item">
      <div class="feed-item-icon" style="background:${item.color}22">${item.icon}</div>
      <div class="feed-item-body">
        <div class="feed-item-title">${item.title}</div>
        <div class="feed-item-meta">${item.source} · ${item.time}</div>
      </div>
      <span class="tag tag-green" style="font-size:0.72rem">Sent</span>
    </div>
  `).join('');
}

function renderQuickFilters() {
  const list = document.getElementById('quick-filters-list');
  if (!list) return;
  const active = filtersData.filter(f => f.active).slice(0, 4);
  list.innerHTML = active.map(f => `
    <div class="qfilter-item">
      <span class="status-dot active"></span>
      <span class="qfilter-name">${f.name}</span>
      <span class="qfilter-hits">${f.hits} hits</span>
      <span class="tag ${priorityTagClass(f.priority)}">${f.priority}</span>
    </div>
  `).join('');
}

// ========================
// FILTERS RENDER
// ========================
function renderFilters(filterVal = '', sortVal = 'active') {
  const grid = document.getElementById('filters-grid');
  if (!grid) return;

  let data = [...filtersData];

  // Filter by search
  if (filterVal) {
    const q = filterVal.toLowerCase();
    data = data.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.keywords.some(k => k.toLowerCase().includes(q))
    );
  }

  // Sort
  const sorts = {
    active:  (a, b) => b.active - a.active,
    recent:  (a, b) => new Date(b.created) - new Date(a.created),
    name:    (a, b) => a.name.localeCompare(b.name),
    hits:    (a, b) => b.hits - a.hits,
  };
  data.sort(sorts[sortVal] || sorts.active);

  if (!data.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p>No filters found. Create one to get started!</p>
      </div>`;
    return;
  }

  grid.innerHTML = data.map(f => `
    <div class="glass-card filter-card" id="fc-${f.id}">
      <div class="filter-card-header">
        <div>
          <div class="filter-card-name">${typeEmoji(f.type)} ${f.name}</div>
          <div class="filter-card-type">${f.domain}</div>
        </div>
        <div class="filter-card-actions">
          <button class="filter-action-btn" onclick="toggleFilter(${f.id})" title="${f.active ? 'Pause' : 'Resume'}">
            ${f.active
              ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
              : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
            }
          </button>
          <button class="filter-action-btn" onclick="openFilterModal(${f.id})" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="filter-action-btn delete" onclick="deleteFilter(${f.id})" title="Delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          </button>
        </div>
      </div>
      <div class="filter-keywords">
        ${f.keywords.map(k => `<span class="tag tag-primary">${k}</span>`).join('')}
        ${!f.active ? '<span class="tag tag-gold">Paused</span>' : ''}
      </div>
      <div class="filter-stats-row">
        <span class="filter-stat"><b>${f.hits}</b> hits total</span>
        <span class="tag ${priorityTagClass(f.priority)}">${f.priority} priority</span>
        <span class="filter-stat">Since ${f.created}</span>
      </div>
    </div>
  `).join('');
}

function searchFilters(val) {
  const sort = document.getElementById('filter-sort')?.value || 'active';
  renderFilters(val, sort);
}

function sortFilters(val) {
  const search = document.getElementById('filter-search')?.value || '';
  renderFilters(search, val);
}

function toggleFilter(id) {
  const f = filtersData.find(f => f.id === id);
  if (!f) return;
  f.active = !f.active;
  renderFilters();
  renderQuickFilters();
  updateStatsUI();
  showToast(`Filter "${f.name}" ${f.active ? 'resumed' : 'paused'}`, f.active ? 'success' : 'info');
}

function deleteFilter(id) {
  const f = filtersData.find(f => f.id === id);
  if (!f) return;
  if (!confirm(`Delete filter "${f.name}"? This cannot be undone.`)) return;
  filtersData = filtersData.filter(f => f.id !== id);
  renderFilters();
  updateStatsUI();
  showToast(`Filter "${f.name}" deleted`, 'info');
}

// ========================
// FILTER MODAL
// ========================
function openFilterModal(id = null) {
  editingFilterId = id;
  const overlay = document.getElementById('filter-modal-overlay');
  const modal   = document.getElementById('filter-modal');
  const title   = document.getElementById('filter-modal-title');

  if (id) {
    const f = filtersData.find(f => f.id === id);
    if (f) {
      document.getElementById('f-name').value     = f.name;
      document.getElementById('f-keywords').value = f.keywords.join(', ');
      document.getElementById('f-sender').value   = f.domain;
      document.getElementById('f-priority').value = f.priority;
      document.getElementById('f-type').value     = f.type;
      if (title) title.textContent = 'Edit Filter';
    }
  } else {
    document.getElementById('filter-form').reset();
    if (title) title.textContent = 'New Filter';
  }

  overlay.classList.add('open');
  modal.style.display = 'block';
  requestAnimationFrame(() => modal.classList.add('open'));
  document.body.style.overflow = 'hidden';
}

function closeFilterModal() {
  const overlay = document.getElementById('filter-modal-overlay');
  const modal   = document.getElementById('filter-modal');
  overlay.classList.remove('open');
  modal.classList.remove('open');
  setTimeout(() => { modal.style.display = 'none'; }, 300);
  document.body.style.overflow = '';
  editingFilterId = null;
}

function saveFilter(e) {
  e.preventDefault();
  const name     = document.getElementById('f-name').value.trim();
  const keywords = document.getElementById('f-keywords').value.split(',').map(k => k.trim()).filter(Boolean);
  const domain   = document.getElementById('f-sender').value.trim();
  const priority = document.getElementById('f-priority').value;
  const type     = document.getElementById('f-type').value;
  const active   = document.getElementById('f-active').checked;

  if (!name) { showToast('Filter name is required', 'warning'); return; }

  if (editingFilterId) {
    const f = filtersData.find(f => f.id === editingFilterId);
    if (f) { Object.assign(f, { name, keywords, domain, priority, type, active }); }
    showToast(`Filter "${name}" updated!`, 'success');
  } else {
    const newFilter = {
      id: Date.now(), name, keywords, domain, priority, type, active,
      hits: 0, created: new Date().toISOString().split('T')[0],
    };
    filtersData.unshift(newFilter);
    showToast(`Filter "${name}" created!`, 'success');
  }

  closeFilterModal();
  renderFilters();
  renderQuickFilters();
  updateStatsUI();
}

// ========================
// LIVE FEED RENDER
// ========================
function renderFeed(typeFilter = 'all') {
  const container = document.getElementById('feed-full');
  if (!container) return;

  const data = typeFilter === 'all' ? feedData : feedData.filter(f => f.type === typeFilter);

  container.innerHTML = data.map(item => {
    const tagMap = { sent: 'tag-green', filtered: 'tag-red', queued: 'tag-gold' };
    return `
      <div class="feed-full-item">
        <div class="feed-item-icon" style="background:${item.color}22; border-radius:10px">${item.icon}</div>
        <div class="feed-item-body">
          <div class="feed-item-title">${item.title}</div>
          <div class="feed-item-meta">${item.source} · Filter: ${item.filter}</div>
        </div>
        <span class="tag ${tagMap[item.type]} feed-time">${item.type}</span>
        <span class="feed-time">${item.time}</span>
      </div>
    `;
  }).join('') || `<div class="empty-state"><div class="empty-state-icon">📭</div><p>No items for this filter</p></div>`;
}

function filterFeed(type) { renderFeed(type); }

function refreshFeed() {
  const btn = document.getElementById('btn-refresh-feed');
  if (btn) btn.disabled = true;
  showToast('Refreshing feed…', 'info');

  // Simulate new item
  setTimeout(() => {
    feedData.unshift({
      id: Date.now(), type: 'sent', icon: '💡', color: '#4F8EF7',
      title: 'New: AI-Powered tools for developers — Hacker News',
      source: 'HN', time: 'Just now', filter: 'Tech News'
    });
    renderFeed(document.getElementById('feed-filter-type')?.value || 'all');
    if (btn) btn.disabled = false;
    showToast('Feed refreshed!', 'success');
  }, 1000);
}

// ========================
// ANALYTICS RENDER
// ========================
function renderAnalytics() {
  drawBarChart('canvas-processed', [120,145,98,180,210,165,243], ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);
  drawLineChart('canvas-delivery', [88,92,85,94,96,90,97], ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']);
  renderKeywordStats();
  renderSourceBreakdown();
}

function drawBarChart(canvasId, data, labels) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !canvas.getContext) return;
  canvas.width  = canvas.parentElement.clientWidth || 300;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  const max = Math.max(...data);
  const barW = (canvas.width - 40) / data.length - 6;
  const h = canvas.height - 30;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  data.forEach((val, i) => {
    const x   = 20 + i * (barW + 6);
    const barH = (val / max) * h;
    const y   = h - barH;

    // Gradient bar
    const grad = ctx.createLinearGradient(0, y, 0, h);
    grad.addColorStop(0, '#6C3BF5');
    grad.addColorStop(1, '#4F8EF7');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(160,158,201,0.7)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x + barW / 2, canvas.height - 6);
  });
}

function drawLineChart(canvasId, data, labels) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || !canvas.getContext) return;
  canvas.width  = canvas.parentElement.clientWidth || 300;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  const max = 100;
  const h = canvas.height - 30;
  const stepX = (canvas.width - 40) / (data.length - 1);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Area fill
  const areaGrad = ctx.createLinearGradient(0, 0, 0, h);
  areaGrad.addColorStop(0, 'rgba(108,59,245,0.3)');
  areaGrad.addColorStop(1, 'rgba(108,59,245,0)');
  ctx.fillStyle = areaGrad;
  ctx.beginPath();
  data.forEach((val, i) => {
    const x = 20 + i * stepX;
    const y = h - (val / max) * h;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(20 + (data.length - 1) * stepX, h);
  ctx.lineTo(20, h);
  ctx.closePath();
  ctx.fill();

  // Line
  ctx.strokeStyle = '#6C3BF5';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  data.forEach((val, i) => {
    const x = 20 + i * stepX;
    const y = h - (val / max) * h;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots + labels
  data.forEach((val, i) => {
    const x = 20 + i * stepX;
    const y = h - (val / max) * h;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#6C3BF5';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(160,158,201,0.7)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], x, canvas.height - 6);
  });
}

function renderKeywordStats() {
  const el = document.getElementById('keyword-stats');
  if (!el) return;
  const kws = [
    { name: 'SDE',     count: 42, pct: 100 },
    { name: 'Python',  count: 31, pct: 74 },
    { name: 'AI',      count: 28, pct: 67 },
    { name: 'React',   count: 19, pct: 45 },
    { name: 'remote',  count: 15, pct: 36 },
  ];
  el.innerHTML = kws.map(k => `
    <div class="kw-item">
      <span class="kw-name">${k.name}</span>
      <div class="kw-bar-wrap"><div class="kw-bar" style="width:${k.pct}%"></div></div>
      <span class="kw-count">${k.count}</span>
    </div>
  `).join('');
}

function renderSourceBreakdown() {
  const el = document.getElementById('source-breakdown');
  if (!el) return;
  const sources = [
    { icon: '💼', name: 'LinkedIn',    pct: '38%' },
    { icon: '🐙', name: 'GitHub',      pct: '24%' },
    { icon: '📰', name: 'TechCrunch',  pct: '18%' },
    { icon: '🖥️', name: 'AWS Monitor', pct: '12%' },
    { icon: '📚', name: 'Naukri',      pct: '8%'  },
  ];
  el.innerHTML = sources.map(s => `
    <div class="src-item">
      <div class="src-icon">${s.icon}</div>
      <span class="src-name">${s.name}</span>
      <span class="src-pct">${s.pct}</span>
    </div>
  `).join('');
}

function setDateRange(range, btn) {
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  renderAnalytics();
}

// ========================
// SYSTEM PAUSE / RESUME
// ========================
function pauseSystem() {
  systemActive = !systemActive;
  const btn    = document.getElementById('btn-pause');
  const status = document.getElementById('system-status');

  if (systemActive) {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
    status.classList.remove('paused');
    status.innerHTML = `<span class="status-dot active"></span><span class="status-text">System Active</span>`;
    showToast('BharatFlow resumed — monitoring emails 🚀', 'success');
  } else {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume`;
    status.classList.add('paused');
    status.innerHTML = `<span class="status-dot inactive" style="background:var(--warning)"></span><span class="status-text">System Paused</span>`;
    showToast('BharatFlow paused — no new notifications will be sent', 'warning');
  }
}

// ========================
// SETTINGS
// ========================
function saveSettings(section) {
  showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved!`, 'success');
}

function toggleSetting(key, checkbox) {
  const state = checkbox.checked;
  const toggle = checkbox.nextElementSibling;
  toggle.classList.toggle('active', state);
  showToast(`${key} notifications ${state ? 'enabled' : 'disabled'}`, state ? 'success' : 'info');
}

function syncGmail() {
  showToast('Syncing Gmail…', 'info');
  setTimeout(() => showToast('Gmail synced! 47 new emails processed.', 'success'), 1800);
}

function disconnectGmail() {
  if (confirm('Disconnect Gmail? BharatFlow will stop monitoring your emails.')) {
    showToast('Gmail disconnected', 'info');
  }
}

function clearAllFilters() {
  if (confirm('Clear ALL filters? This cannot be undone.')) {
    filtersData = [];
    renderFilters();
    renderQuickFilters();
    updateStatsUI();
    showToast('All filters cleared', 'warning');
  }
}

function deleteAccount() {
  if (confirm('Delete your account? All data will be permanently removed.')) {
    localStorage.clear();
    showToast('Account deleted. Goodbye 👋', 'info');
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
  }
}

// ========================
// STATS UI UPDATE
// ========================
function updateStatsUI() {
  const active = filtersData.filter(f => f.active).length;
  document.getElementById('stat-filters').textContent = active;
  document.getElementById('nav-badge').textContent = filtersData.filter(f => f.active && f.priority === 'high').length;
}

// ========================
// HELPERS
// ========================
function typeEmoji(type) {
  const map = { job: '💼', code: '🐙', news: '📰', monitor: '🖥️', learning: '🎓', client: '🤝', custom: '⚙️' };
  return map[type] || '📌';
}

function priorityTagClass(p) {
  return { high: 'tag-red', medium: 'tag-gold', low: 'tag-green' }[p] || 'tag-primary';
}

// ========================
// LIVE COUNTER ANIMATION
// ========================
function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const step  = (target - start) / 30;
  let current = start;
  const interval = setInterval(() => {
    current += step;
    if ((step > 0 && current >= target) || (step < 0 && current <= target)) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = Math.round(current);
  }, 16);
}

// ========================
// REAL-TIME SIMULATION
// ========================
function startLiveSimulation() {
  setInterval(() => {
    const sentEl = document.getElementById('stat-sent');
    if (sentEl) {
      const current = parseInt(sentEl.textContent);
      if (Math.random() > 0.7) {
        sentEl.textContent = current + 1;
        // Add item to feed
        const items = ['New SDE role at Razorpay', 'PR merged: feature/auth-refresh', 'Infosys Q4 earnings beat estimates'];
        const icons  = ['💼', '🐙', '📈'];
        const colors = ['#06D6A0', '#6C3BF5', '#4F8EF7'];
        const idx = Math.floor(Math.random() * items.length);
        feedData.unshift({
          id: Date.now(), type: 'sent', icon: icons[idx], color: colors[idx],
          title: items[idx], source: 'Live', time: 'Just now', filter: 'Auto'
        });
      }
    }
  }, 8000);
}

// ========================
// INIT
// ========================
document.addEventListener('DOMContentLoaded', () => {
  renderOverview();
  renderFilters();
  updateStatsUI();
  startLiveSimulation();

  // Animate counters
  animateCounter('stat-sent',     47);
  animateCounter('stat-filtered', 384);
});
