/* ═══════════════════════════════════════════════════════════════
   LOCK IN — backend.js
   Pure Vanilla JS | localStorage | Gemini AI | Custom Habits
═══════════════════════════════════════════════════════════════ */

'use strict';

// ─────────────────────────────────────── QUOTES
const QUOTES = [
  "The pain you feel today will be the strength you feel tomorrow.",
  "Discipline is the bridge between goals and accomplishment.",
  "We do not rise to our expectations. We fall to our level of training.",
  "Hard work beats talent when talent doesn't work hard.",
  "Do it now. Sometimes 'later' becomes 'never'.",
  "Great things never come from comfort zones.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Push yourself, because no one else is going to do it for you.",
  "Prove them wrong. Then stay quiet and keep working.",
  "Every champion was once a contender who refused to give up.",
  "You don't get what you wish for. You get what you work for.",
  "Suffer the pain of discipline or suffer the pain of regret.",
  "God doesn't give you what you can handle — He helps you handle what you're given.",
  "Consistency is what transforms average into excellence.",
  "Your future self is watching. Don't disappoint him.",
  "Iron sharpens iron. Surround yourself with warriors.",
  "Be grateful for what you have while pursuing what you want.",
  "The grind never stops. Neither should you.",
  "Stay humble. Work hard. Be kind.",
  "Prove yourself every single day.",
];

// ─────────────────────────────────────── PRESET HABITS LIBRARY
// Each entry: { id, name, icon, type ('yesno'|'hours'|'minutes'), points, ptsPerUnit, defaultSelected, required }
const PRESET_HABITS = [
  { id: 'study',        name: 'Study / Exam Prep',     icon: '📚', type: 'hours',   points: 30, ptsPerUnit: 10, defaultSelected: true,  required: true  },
  { id: 'exercise',     name: 'Physical Training',      icon: '💪', type: 'yesno',  points: 20, ptsPerUnit: 20, defaultSelected: true,  required: true  },
  { id: 'meditation',   name: 'Meditation',             icon: '🧘', type: 'minutes',points: 10, ptsPerUnit: 2,  defaultSelected: true,  required: true  },
  { id: 'cold_shower',  name: 'Cold Shower',            icon: '🚿', type: 'yesno',  points: 10, ptsPerUnit: 10, defaultSelected: true                   },
  { id: 'diet',         name: 'Diet Plan',              icon: '🥗', type: 'yesno',  points: 15, ptsPerUnit: 15, defaultSelected: true                   },
  { id: 'sleep',        name: 'Sleep Schedule',         icon: '😴', type: 'yesno',  points: 15, ptsPerUnit: 15, defaultSelected: true                   },
  { id: 'gratitude',    name: 'Gratitude / Prayer',     icon: '🙏', type: 'yesno',  points: 10, ptsPerUnit: 10, defaultSelected: true                   },
  { id: 'reading',      name: 'Reading',                icon: '📖', type: 'minutes',points: 10, ptsPerUnit: 2,  defaultSelected: false                  },
  { id: 'no_sm',        name: 'No Social Media',        icon: '📵', type: 'yesno',  points: 10, ptsPerUnit: 10, defaultSelected: false                  },
  { id: 'journaling',   name: 'Journaling',             icon: '📓', type: 'yesno',  points: 10, ptsPerUnit: 10, defaultSelected: false                  },
  { id: 'coding',       name: 'Coding / Projects',      icon: '💻', type: 'hours',  points: 20, ptsPerUnit: 10, defaultSelected: false                  },
  { id: 'revision',     name: 'Revision / Notes',       icon: '📝', type: 'yesno',  points: 10, ptsPerUnit: 10, defaultSelected: false                  },
  { id: 'run',          name: 'Running / Cardio',       icon: '🏃', type: 'yesno',  points: 15, ptsPerUnit: 15, defaultSelected: false                  },
  { id: 'no_junk',      name: 'No Junk Food',           icon: '🚫', type: 'yesno',  points: 10, ptsPerUnit: 10, defaultSelected: false                  },
  { id: 'water',        name: '8 Glasses of Water',     icon: '💧', type: 'yesno',  points: 5,  ptsPerUnit: 5,  defaultSelected: false                  },
  { id: 'early_wake',   name: 'Wake Up Early',          icon: '⏰', type: 'yesno',  points: 10, ptsPerUnit: 10, defaultSelected: false                  },
  { id: 'no_porn',      name: 'No Porn / No Lust',      icon: '🛡️', type: 'yesno',  points: 15, ptsPerUnit: 15, defaultSelected: false                  },
  { id: 'language',     name: 'Language Learning',      icon: '🌍', type: 'minutes',points: 10, ptsPerUnit: 2,  defaultSelected: false                  },
  { id: 'stretching',   name: 'Stretching / Yoga',      icon: '🤸', type: 'yesno',  points: 8,  ptsPerUnit: 8,  defaultSelected: false                  },
  { id: 'creative',     name: 'Creative Work / Art',    icon: '🎨', type: 'hours',  points: 15, ptsPerUnit: 8,  defaultSelected: false                  },
];

const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ─────────────────────────────────────── STATE
let selectedHabitIds = new Set();      // for habit picker during group creation
let customHabits = [];                 // custom habits added by user in picker
let customHabitType = 'yesno';        // type for the custom habit being created
let proofImageBase64 = null;
let cameraStream = null;

// ─────────────────────────────────────── INIT
function initApp() {
  loadApiKey();
  const user = getCurrentUser();
  if (user) {
    showDashboard();
  } else {
    showPage('landing');
  }
}

// ─────────────────────────────────────── PAGE / TAB NAVIGATION
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + id);
  if (el) el.classList.add('active');
}

function showDashboard() {
  showPage('dashboard');
  const user = getCurrentUser();
  if (!user) return;
  const groups = getGroups();
  const grp = groups[user.groupCode] || {};
  document.getElementById('topbar-user').textContent = user.name;
  document.getElementById('topbar-group-name').textContent = grp.name || user.groupCode;
  switchTab('home');
}

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const btn = document.getElementById('tab-' + name);
  const content = document.getElementById('tab-content-' + name);
  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');
  if (name === 'home')        renderHome();
  else if (name === 'report') renderReport();
  else if (name === 'leaderboard') renderLeaderboard();
  else if (name === 'profile') renderProfile();
  else if (name === 'ai')     { document.getElementById('ai-result').innerHTML = ''; refreshAITabKeyStatus(); }
}

function switchAuthTab(tab) {
  ['join','create'].forEach(t => {
    document.getElementById('auth-' + t).classList.remove('active');
    document.getElementById('tab-' + t + '-btn').classList.remove('active');
  });
  document.getElementById('auth-' + tab).classList.add('active');
  document.getElementById('tab-' + tab + '-btn').classList.add('active');
}

// ─────────────────────────────────────── API KEY
function loadApiKey() {
  const key = localStorage.getItem('geminiKey');
  if (key) {
    const landingInput = document.getElementById('api-key-input');
    if (landingInput) landingInput.value = key;
    const statusEl = document.getElementById('api-key-status');
    if (statusEl) statusEl.textContent = '✓ Key saved';
  }
}

function refreshAITabKeyStatus() {
  const key   = localStorage.getItem('geminiKey');
  const input = document.getElementById('ai-tab-key-input');
  const status = document.getElementById('ai-tab-key-status');
  const box    = document.getElementById('ai-key-box');
  if (!input) return;
  if (key) {
    input.value      = key;
    if (status) status.textContent = '✓ Key saved — ready to analyze';
    if (box)    box.classList.add('key-saved');
  } else {
    if (status) status.textContent = '⚠️ No key saved yet. Paste it above and click Save.';
    if (box)    box.classList.remove('key-saved');
  }
}

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key) { document.getElementById('api-key-status').textContent = '✗ Enter a key'; return; }
  localStorage.setItem('geminiKey', key);
  document.getElementById('api-key-status').textContent = '✓ Key saved!';
}

function saveApiKeyFromDashboard() {
  const input  = document.getElementById('ai-tab-key-input');
  const status = document.getElementById('ai-tab-key-status');
  const box    = document.getElementById('ai-key-box');
  const key    = input ? input.value.trim() : '';
  if (!key) { if (status) status.textContent = '✗ Paste your API key first.'; return; }
  localStorage.setItem('geminiKey', key);
  if (status) status.textContent = '✓ Key saved! You can now analyze your progress.';
  if (box)    box.classList.add('key-saved');
}

// ─────────────────────────────────────── STORAGE HELPERS
function getGroups()  { try { return JSON.parse(localStorage.getItem('lockin_groups')  || '{}'); } catch { return {}; } }
function saveGroups(g){ localStorage.setItem('lockin_groups', JSON.stringify(g)); }

function getUsers()   { try { return JSON.parse(localStorage.getItem('lockin_users')   || '{}'); } catch { return {}; } }
function saveUsers(u) { localStorage.setItem('lockin_users',  JSON.stringify(u)); }

function getReports() { try { return JSON.parse(localStorage.getItem('lockin_reports') || '{}'); } catch { return {}; } }
function saveReports(r){ localStorage.setItem('lockin_reports', JSON.stringify(r)); }

function getCurrentUser()  { try { return JSON.parse(localStorage.getItem('lockin_current') || 'null'); } catch { return null; } }
function saveCurrentUser(u){ localStorage.setItem('lockin_current', JSON.stringify(u)); }

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
function generateUserId() { return 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }
function todayStr()       { return new Date().toISOString().slice(0, 10); }
function escHtml(s)       { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ─────────────────────────────────────── HABIT PICKER (Create Group Flow)

function goToHabitPicker() {
  const name      = document.getElementById('create-name').value.trim();
  const groupName = document.getElementById('create-group-name').value.trim();
  const errEl     = document.getElementById('create-error');
  errEl.textContent = '';
  if (!name)      { errEl.textContent = 'Enter your name.'; return; }
  if (!groupName) { errEl.textContent = 'Enter a group name.'; return; }

  // Initialize selection with defaults
  selectedHabitIds = new Set(PRESET_HABITS.filter(h => h.defaultSelected).map(h => h.id));
  customHabits = [];

  document.getElementById('create-step-1').style.display = 'none';
  document.getElementById('create-step-2').style.display = 'block';
  renderHabitPicker();
}

function backToStep1() {
  document.getElementById('create-step-2').style.display = 'none';
  document.getElementById('create-step-1').style.display = 'block';
}

function renderHabitPicker() {
  const grid = document.getElementById('habit-presets-grid');
  grid.innerHTML = '';

  // Render preset habits
  PRESET_HABITS.forEach(h => {
    const card = document.createElement('div');
    card.className = 'habit-card' + (selectedHabitIds.has(h.id) ? ' selected' : '');
    card.onclick = () => togglePresetHabit(h.id, card);
    const typeLabel = h.type === 'hours' ? 'Hours tracked' : h.type === 'minutes' ? 'Minutes tracked' : 'Yes / No';
    card.innerHTML = `
      <div class="habit-card-icon">${h.icon}</div>
      <div class="habit-card-info">
        <div class="habit-card-name">${escHtml(h.name)}</div>
        <div class="habit-card-meta">${typeLabel} · ${h.points}pts</div>
      </div>
      <div class="habit-card-check">✓</div>`;
    grid.appendChild(card);
  });

  // Render custom habits already added
  customHabits.forEach((h, i) => {
    const card = document.createElement('div');
    card.className = 'habit-card custom-card selected';
    const typeLabel = h.type === 'hours' ? 'Hours tracked' : h.type === 'minutes' ? 'Minutes tracked' : 'Yes / No';
    card.innerHTML = `
      <div class="habit-card-icon">${h.icon}</div>
      <div class="habit-card-info">
        <div class="habit-card-name">${escHtml(h.name)}</div>
        <div class="habit-card-meta">${typeLabel} · ${h.points}pts · custom</div>
      </div>
      <div class="habit-card-check" onclick="removeCustomHabit(${i})" title="Remove" style="cursor:pointer;color:#ff6b6b">✕</div>`;
    grid.appendChild(card);
  });

  updateSelectedCount();
}

function togglePresetHabit(id, cardEl) {
  if (selectedHabitIds.has(id)) {
    selectedHabitIds.delete(id);
    cardEl.classList.remove('selected');
  } else {
    selectedHabitIds.add(id);
    cardEl.classList.add('selected');
  }
  updateSelectedCount();
}

function updateSelectedCount() {
  const total = selectedHabitIds.size + customHabits.length;
  const el = document.getElementById('selected-count-label');
  el.innerHTML = `<strong>${total}</strong> habit${total !== 1 ? 's' : ''} selected`;
}

function showCustomHabitForm() {
  const f = document.getElementById('custom-habit-form');
  f.style.display = f.style.display === 'none' ? 'flex' : 'none';
  f.style.flexDirection = 'column';
}

function setCustomType(type) {
  customHabitType = type;
  ['yesno','hours','minutes'].forEach(t => {
    document.getElementById('ch-' + t).classList.toggle('active', t === type);
  });
}

function addCustomHabit() {
  const name = document.getElementById('custom-habit-name').value.trim();
  const pts  = Math.min(30, Math.max(1, parseInt(document.getElementById('custom-habit-pts').value) || 10));
  if (!name) { alert('Enter a habit name.'); return; }

  const icons = { yesno: '⭐', hours: '⏱️', minutes: '⏳' };
  const ptsPerUnit = customHabitType === 'hours' ? Math.round(pts / 3) : customHabitType === 'minutes' ? Math.round(pts / 5) : pts;

  customHabits.push({
    id:        'custom_' + Date.now(),
    name,
    icon:      icons[customHabitType],
    type:      customHabitType,
    points:    pts,
    ptsPerUnit,
    required:  false,
    isCustom:  true,
  });

  document.getElementById('custom-habit-name').value = '';
  document.getElementById('custom-habit-pts').value  = '10';
  document.getElementById('custom-habit-form').style.display = 'none';
  renderHabitPicker();
}

function removeCustomHabit(index) {
  customHabits.splice(index, 1);
  renderHabitPicker();
}

// Build final habits array from selection
function buildSelectedHabits() {
  const presets = PRESET_HABITS.filter(h => selectedHabitIds.has(h.id));
  return [...presets, ...customHabits];
}

function getGroupHabits(groupCode) {
  const groups = getGroups();
  const grp = groups[groupCode];
  if (!grp || !grp.habits || !grp.habits.length) return PRESET_HABITS.filter(h => h.defaultSelected);
  return grp.habits;
}

function getTotalMaxScore(habits) {
  return habits.reduce((sum, h) => sum + h.points, 0);
}

// ─────────────────────────────────────── CREATE GROUP
function createGroup() {
  const name      = document.getElementById('create-name').value.trim();
  const groupName = document.getElementById('create-group-name').value.trim();
  const errEl     = document.getElementById('create-error-2');
  errEl.textContent = '';

  const habits = buildSelectedHabits();
  if (!habits.length) { errEl.textContent = 'Select at least one habit.'; return; }

  const groups = getGroups();
  let code = generateCode();
  while (groups[code]) code = generateCode();

  const userId = generateUserId();
  const now    = new Date().toISOString();

  groups[code] = { name: groupName, code, createdAt: now, members: [userId], habits };
  saveGroups(groups);

  const users = getUsers();
  users[userId] = { name, groupCode: code, role: 'Monitor', joinedAt: now };
  saveUsers(users);

  saveCurrentUser({ userId, name, groupCode: code, role: 'Monitor' });
  showDashboard();
}

// ─────────────────────────────────────── JOIN GROUP
function joinGroup() {
  const name  = document.getElementById('join-name').value.trim();
  const code  = document.getElementById('join-code').value.trim().toUpperCase();
  const errEl = document.getElementById('join-error');
  errEl.textContent = '';

  if (!name)           { errEl.textContent = 'Enter your name.'; return; }
  if (code.length < 3) { errEl.textContent = 'Enter the group code.'; return; }

  const groups = getGroups();
  if (!groups[code]) { errEl.textContent = '✗ Group not found. Check the code.'; return; }

  const users = getUsers();
  const existingId = groups[code].members.find(id => users[id] && users[id].name.toLowerCase() === name.toLowerCase());

  let userId = existingId;
  if (!existingId) {
    userId = generateUserId();
    users[userId] = { name, groupCode: code, role: 'Member', joinedAt: new Date().toISOString() };
    saveUsers(users);
    groups[code].members.push(userId);
    saveGroups(groups);
  }

  const u = users[userId];
  saveCurrentUser({ userId, name: u.name, groupCode: code, role: u.role });
  showDashboard();
}

// ─────────────────────────────────────── LOGOUT
function logout() {
  localStorage.removeItem('lockin_current');
  showPage('landing');
}

// ─────────────────────────────────────── SCORE CALCULATION (dynamic)
function calculateScore(report, habits) {
  let score = 0;
  habits.forEach(h => {
    const val = report.values ? report.values[h.id] : undefined;
    if (val === undefined || val === null) return;
    if (h.type === 'yesno') {
      if (val === 'yes') score += h.points;
    } else if (h.type === 'hours') {
      score += Math.min(h.points, (parseFloat(val) || 0) * (h.ptsPerUnit || 10));
    } else if (h.type === 'minutes') {
      score += Math.min(h.points, (parseInt(val) || 0) * (h.ptsPerUnit || 2));
    }
  });
  return Math.round(score);
}

// Check minimum day: study >= 1h + exercise + meditation >= 5min (from selected habits)
function meetsMinimumDay(report, habits) {
  const vals = report.values || {};
  const studyH  = habits.find(h => h.id === 'study');
  const exerciseH = habits.find(h => h.id === 'exercise');
  const medH    = habits.find(h => h.id === 'meditation');
  const studyOk    = !studyH    || (parseFloat(vals['study'])      || 0) >= 1;
  const exerciseOk = !exerciseH || vals['exercise'] === 'yes';
  const medOk      = !medH      || (parseInt(vals['meditation'])   || 0) >= 5;
  return studyOk && exerciseOk && medOk;
}

// ─────────────────────────────────────── REPORT DATA HELPERS
function getUserReports(userId, days = 7) {
  const reports = getReports();
  const result  = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    result.push({ date: dateKey, report: reports[userId + '_' + dateKey] || null });
  }
  return result.reverse();
}

function getStreak(userId) {
  const reports = getReports();
  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (reports[userId + '_' + d.toISOString().slice(0, 10)]) streak++;
    else break;
  }
  return streak;
}

function getWeeklyAvg(userId) {
  const rpts   = getUserReports(userId, 7);
  const filled = rpts.filter(r => r.report);
  if (!filled.length) return 0;
  return Math.round(filled.reduce((s, r) => s + (r.report.score || 0), 0) / filled.length);
}

function getUserStats(userId) {
  const rpts    = getUserReports(userId, 30);
  const filled  = rpts.filter(r => r.report);
  const streak  = getStreak(userId);
  const days    = filled.length;
  const avg     = getWeeklyAvg(userId);
  const bestDay = filled.reduce((best, r) => Math.max(best, r.report.score || 0), 0);
  return { streak, days, avg, bestDay };
}

// ─────────────────────────────────────── LEADERBOARD DATA
function getLeaderboard() {
  const user = getCurrentUser();
  if (!user) return [];
  const groups = getGroups();
  const grp    = groups[user.groupCode];
  if (!grp) return [];
  const users  = getUsers();
  const habits = getGroupHabits(user.groupCode);
  const maxScore = getTotalMaxScore(habits);

  return grp.members.map(uid => {
    const u = users[uid] || { name: 'Unknown', role: 'Member' };
    const avg    = getWeeklyAvg(uid);
    const streak = getStreak(uid);
    const todayR = getReports()[uid + '_' + todayStr()] || null;
    return { userId: uid, name: u.name, role: u.role, weeklyAvg: avg, streak, todayScore: todayR ? todayR.score : null, maxScore, isYou: uid === user.userId };
  }).sort((a, b) => b.weeklyAvg - a.weeklyAvg || b.streak - a.streak);
}

function updateMonitor(groupCode) {
  const groups = getGroups();
  const grp    = groups[groupCode];
  if (!grp || grp.members.length < 2) return;
  const users  = getUsers();
  let best = null, bestAvg = -1;
  grp.members.forEach(uid => {
    const avg = getWeeklyAvg(uid);
    if (avg > bestAvg) { bestAvg = avg; best = uid; }
  });
  grp.members.forEach(uid => { if (users[uid]) users[uid].role = (uid === best ? 'Monitor' : 'Member'); });
  saveUsers(users);
  saveGroups(groups);
  const cur = getCurrentUser();
  if (cur && cur.groupCode === groupCode && users[cur.userId]) {
    cur.role = users[cur.userId].role;
    saveCurrentUser(cur);
  }
}

// ─────────────────────────────────────── RENDER HOME
function renderHome() {
  const user = getCurrentUser();
  if (!user) return;
  const groups = getGroups();
  const users  = getUsers();
  const grp    = groups[user.groupCode] || { members: [], habits: [] };
  const habits = getGroupHabits(user.groupCode);
  const maxScore = getTotalMaxScore(habits);

  // Daily quote
  const dayIdx = Math.floor(Date.now() / 86400000) % QUOTES.length;
  document.getElementById('daily-quote').textContent = '"' + QUOTES[dayIdx] + '"';

  // Group code
  document.getElementById('home-group-code').textContent = user.groupCode;

  // Today's score
  const myReport = getReports()[user.userId + '_' + todayStr()];
  document.getElementById('home-today-score').textContent = myReport ? myReport.score : '—';
  document.getElementById('home-today-max').textContent   = 'out of ' + maxScore;

  // Discipline warning
  let missed = 0;
  for (let i = 1; i <= 2; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    if (!getReports()[user.userId + '_' + d.toISOString().slice(0, 10)]) missed++;
  }
  document.getElementById('discipline-warning').style.display = missed >= 2 ? 'block' : 'none';

  // Members list
  const membersEl = document.getElementById('home-members-list');
  membersEl.innerHTML = '';
  const reports = getReports();
  grp.members.forEach(uid => {
    const u = users[uid];
    if (!u) return;
    const r       = reports[uid + '_' + todayStr()];
    const score   = r ? r.score : null;
    const isYou   = uid === user.userId;
    const isMonitor = u.role === 'Monitor';
    const minMet  = r ? meetsMinimumDay(r, habits) : null;
    const pct     = score !== null ? Math.round((score / maxScore) * 100) : 0;
    const barCls  = score === null ? '' : pct >= 70 ? 'bar-green' : pct >= 40 ? 'bar-yellow' : 'bar-red';

    const row = document.createElement('div');
    row.className = 'member-row';
    row.innerHTML = `
      <div class="member-avatar${isYou ? ' is-you' : ''}">${u.name.charAt(0).toUpperCase()}</div>
      <div class="member-info">
        <div class="member-name">${escHtml(u.name)}${isYou ? ' <span style="color:var(--text-muted);font-size:.62rem">(you)</span>' : ''}</div>
        <div class="member-sub">${isMonitor ? '👑 Monitor' : 'Member'} · 🔥 ${getStreak(uid)}d streak</div>
        <div class="member-badges">
          ${isMonitor  ? '<span class="badge badge-monitor">Monitor</span>' : ''}
          ${r          ? '<span class="badge badge-done">✓ Done</span>' : '<span class="badge badge-pending">Pending</span>'}
          ${r && !minMet ? '<span class="badge badge-min">Min Not Met</span>' : ''}
        </div>
      </div>
      <div class="score-bar-wrap">
        <div style="font-size:.68rem;text-align:right;color:var(--text-dim);margin-bottom:3px">${score !== null ? score + '/' + maxScore : '—'}</div>
        <div class="score-bar"><div class="score-bar-fill ${barCls}" style="width:${pct}%"></div></div>
      </div>`;
    membersEl.appendChild(row);
  });

  // Group habits summary chips
  const habitsEl = document.getElementById('home-habits-list');
  habitsEl.innerHTML = '';
  habits.forEach(h => {
    const chip = document.createElement('div');
    chip.className = 'habit-chip';
    chip.innerHTML = `<span class="habit-chip-icon">${h.icon}</span>${escHtml(h.name)}<br><span class="habit-chip-pts">${h.points}pts</span>`;
    habitsEl.appendChild(chip);
  });
}

// ─────────────────────────────────────── RENDER REPORT (dynamic form)
function renderReport() {
  const user = getCurrentUser();
  if (!user) return;
  const habits  = getGroupHabits(user.groupCode);
  const maxScore = getTotalMaxScore(habits);
  const key     = user.userId + '_' + todayStr();
  const r       = getReports()[key];
  const banner  = document.getElementById('already-submitted-banner');
  const formWrap = document.getElementById('report-form-wrap');

  if (r) {
    banner.style.display = 'block';
    formWrap.style.display = 'none';
    document.getElementById('today-score-display').textContent = r.score + ' / ' + maxScore;
    return;
  }

  banner.style.display  = 'none';
  formWrap.style.display = 'block';
  document.getElementById('min-day-warning').style.display = 'none';

  // Build dynamic form fields
  const container = document.getElementById('dynamic-report-fields');
  container.innerHTML = '';

  habits.forEach((h, i) => {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'report-field';

    const label = `<label class="field-label">${h.icon} ${escHtml(h.name)} <span class="req">(${h.points}pts)</span></label>`;

    let input = '';
    if (h.type === 'yesno') {
      input = `
        <div class="toggle-group">
          <button class="toggle-btn active" id="tog-${h.id}-yes" onclick="setHabitToggle('${h.id}','yes')">YES ✓</button>
          <button class="toggle-btn"        id="tog-${h.id}-no"  onclick="setHabitToggle('${h.id}','no')">NO ✕</button>
        </div>`;
      // Special sub-field for exercise type
      if (h.id === 'exercise') {
        input += `<input type="text" id="field-exercise-type" class="input-field" placeholder="What did you do? (push-ups, run, gym...)" style="margin-top:0.4rem" />`;
      }
    } else if (h.type === 'hours') {
      input = `<input type="number" id="field-${h.id}" class="input-field" min="0" max="24" step="0.5" placeholder="e.g. 2.5 hours" />`;
    } else if (h.type === 'minutes') {
      input = `<input type="number" id="field-${h.id}" class="input-field" min="0" max="300" placeholder="e.g. 10 minutes" />`;
    }

    const num = i + 1;
    fieldDiv.innerHTML = label.replace('<label', `<label`).replace('>', `><span style="color:var(--text-muted);margin-right:0.3rem">${num}.</span>`);
    fieldDiv.innerHTML += input;
    container.appendChild(fieldDiv);
  });
}

// Toggle state stored on DOM elements (avoids a global map keyed by habit id)
function setHabitToggle(habitId, val) {
  const yes = document.getElementById('tog-' + habitId + '-yes');
  const no  = document.getElementById('tog-' + habitId + '-no');
  if (!yes || !no) return;
  yes.classList.toggle('active', val === 'yes');
  no.classList.toggle('active',  val === 'no');
}

function getHabitToggleValue(habitId) {
  const yes = document.getElementById('tog-' + habitId + '-yes');
  if (!yes) return null;
  return yes.classList.contains('active') ? 'yes' : 'no';
}

// ─────────────────────────────────────── CAMERA
function openCamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
    .then(stream => {
      cameraStream = stream;
      document.getElementById('camera-video').srcObject = stream;
      document.getElementById('camera-container').style.display = 'block';
      document.getElementById('open-camera-btn').style.display   = 'none';
      document.getElementById('proof-preview-wrap').style.display = 'none';
    })
    .catch(() => alert('Camera access denied. You can still submit without photo proof.'));
}

function capturePhoto() {
  const video  = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  proofImageBase64 = canvas.toDataURL('image/jpeg', 0.7);
  document.getElementById('proof-preview').src = proofImageBase64;
  document.getElementById('proof-preview-wrap').style.display = 'block';
  stopCamera();
}

function stopCamera() {
  if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
  document.getElementById('camera-container').style.display = 'none';
  if (!proofImageBase64) document.getElementById('open-camera-btn').style.display = 'block';
}

function retakePhoto() {
  proofImageBase64 = null;
  document.getElementById('proof-preview-wrap').style.display = 'none';
  document.getElementById('open-camera-btn').style.display    = 'block';
}

// ─────────────────────────────────────── SUBMIT REPORT
function submitReport() {
  const user   = getCurrentUser();
  if (!user) return;
  const habits = getGroupHabits(user.groupCode);

  // Collect values for each habit from the dynamic form
  const values = {};
  habits.forEach(h => {
    if (h.type === 'yesno') {
      values[h.id] = getHabitToggleValue(h.id) || 'yes'; // default yes
    } else {
      const el = document.getElementById('field-' + h.id);
      values[h.id] = el ? (el.value || '0') : '0';
    }
  });

  // Extra: exercise type text
  const exerciseTypeEl = document.getElementById('field-exercise-type');
  const exerciseType   = exerciseTypeEl ? exerciseTypeEl.value.trim() : '';

  const report = {
    values,
    exerciseType,
    proofImage:   proofImageBase64 || null,
    submittedAt:  new Date().toISOString(),
    score:        0,
  };
  report.score = calculateScore(report, habits);

  const minMet = meetsMinimumDay(report, habits);
  document.getElementById('min-day-warning').style.display = minMet ? 'none' : 'block';

  const reports = getReports();
  reports[user.userId + '_' + todayStr()] = report;
  saveReports(reports);
  updateMonitor(user.groupCode);

  renderReport();
  renderHome();
}

// ─────────────────────────────────────── RENDER LEADERBOARD
function renderLeaderboard() {
  const board     = getLeaderboard();
  const user      = getCurrentUser();
  const container = document.getElementById('leaderboard-list');
  container.innerHTML = '';

  const medals = ['🥇','🥈','🥉'];
  const rankCls = ['rank-1','rank-2','rank-3'];
  const rankCol = ['rank-gold','rank-silver','rank-bronze'];

  board.forEach((m, i) => {
    const row = document.createElement('div');
    row.className = `lb-row ${rankCls[i] || ''} ${m.isYou ? 'is-you' : ''}`;
    const monBadge = m.role === 'Monitor' ? '<span class="badge badge-monitor">👑 Monitor</span>' : '';
    const streak   = m.streak > 0 ? `<span class="streak-badge">🔥 ${m.streak}d</span>` : '';
    row.innerHTML = `
      <div class="lb-rank ${rankCol[i] || 'rank-num'}">${medals[i] || (i + 1)}</div>
      <div class="lb-info">
        <div class="lb-name">${escHtml(m.name)} ${m.isYou ? '<span style="color:var(--text-muted);font-size:.62rem">(you)</span>' : ''}</div>
        <div class="lb-sub" style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:center">
          ${monBadge} ${streak}
          <span style="font-size:.68rem;color:var(--text-muted)">Today: ${m.todayScore !== null ? m.todayScore + '/' + m.maxScore : '—'}</span>
        </div>
      </div>
      <div class="lb-score-block">
        <div class="lb-score">${m.weeklyAvg}</div>
        <div class="lb-score-label">weekly avg</div>
      </div>`;
    container.appendChild(row);
  });

  if (!board.length) {
    container.innerHTML = '<div style="color:var(--text-muted);padding:1rem;text-align:center">No members yet. Share your group code!</div>';
  }

  // Score breakdown for this group
  if (user) {
    const habits   = getGroupHabits(user.groupCode);
    const maxScore = getTotalMaxScore(habits);
    const brkEl    = document.getElementById('score-breakdown-card');
    brkEl.innerHTML = `<div class="legend-title">SCORE BREAKDOWN · Max ${maxScore} pts/day</div>
      <div class="legend-grid">${habits.map(h => `<span>${h.icon} ${escHtml(h.name)}: ${h.points}pts</span>`).join('')}</div>`;
  }
}

// ─────────────────────────────────────── RENDER PROFILE
function renderProfile() {
  const user = getCurrentUser();
  if (!user) return;
  const users  = getUsers();
  const u      = users[user.userId] || user;
  const groups = getGroups();
  const grp    = groups[user.groupCode] || {};
  const habits = getGroupHabits(user.groupCode);
  const maxScore = getTotalMaxScore(habits);

  document.getElementById('profile-avatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('profile-name').textContent   = user.name;
  document.getElementById('profile-role').textContent   = u.role === 'Monitor' ? '👑 Monitor' : '👤 Member';
  document.getElementById('profile-group').textContent  = '🔒 ' + (grp.name || user.groupCode) + '  ·  Code: ' + user.groupCode;

  const { streak, days, avg, bestDay } = getUserStats(user.userId);
  document.getElementById('stat-streak').textContent = streak;
  document.getElementById('stat-avg').textContent    = avg;
  document.getElementById('stat-days').textContent   = days;
  document.getElementById('stat-top').textContent    = bestDay || '—';

  // 7-day history grid
  const histGrid = document.getElementById('history-grid');
  histGrid.innerHTML = '';
  getUserReports(user.userId, 7).forEach(({ date, report }) => {
    const score = report ? report.score : null;
    const pct   = score !== null ? Math.round((score / maxScore) * 100) : null;
    let cls = 'score-none';
    if (pct !== null) cls = pct >= 70 ? 'score-high' : pct >= 40 ? 'score-mid' : 'score-low';
    const d = new Date(date + 'T00:00:00');
    const div = document.createElement('div');
    div.className = 'history-day ' + cls;
    div.title     = date + (report ? ' · Score: ' + score + '/' + maxScore : ' · No report');
    div.innerHTML = `<span class="day-label">${d.toLocaleDateString('en',{weekday:'short'})} ${d.getDate()}</span>
                     <span class="day-score">${score !== null ? score : '—'}</span>`;
    histGrid.appendChild(div);
  });

  // Habit breakdown — per-habit completion rate over last 7 days
  const hbEl   = document.getElementById('habit-breakdown');
  hbEl.innerHTML = '';
  const last7  = getUserReports(user.userId, 7).filter(r => r.report);

  habits.forEach(h => {
    let completions = 0;
    let totalPossible = 0;
    last7.forEach(({ report }) => {
      const val = (report.values || {})[h.id];
      if (val !== undefined) {
        totalPossible++;
        if (h.type === 'yesno' && val === 'yes') completions++;
        else if (h.type === 'hours'   && (parseFloat(val) || 0) >= 1) completions++;
        else if (h.type === 'minutes' && (parseInt(val)   || 0) >= 5) completions++;
      }
    });
    const rate = totalPossible ? Math.round((completions / totalPossible) * 100) : 0;
    const row  = document.createElement('div');
    row.className = 'habit-breakdown-row';
    row.innerHTML = `
      <div class="hb-icon">${h.icon}</div>
      <div class="hb-info">
        <div class="hb-name">${escHtml(h.name)}</div>
        <div class="hb-bar-wrap">
          <div class="hb-bar"><div class="hb-bar-fill" style="width:${rate}%"></div></div>
        </div>
        <div class="hb-sub">${completions}/${totalPossible || 7} days · ${rate}% completion</div>
      </div>
      <div class="hb-rate">${rate}%</div>`;
    hbEl.appendChild(row);
  });

  // Proof gallery
  const gallery = document.getElementById('proof-gallery');
  gallery.innerHTML = '';
  let hasProof = false;
  getUserReports(user.userId, 7).forEach(({ report }) => {
    if (report && report.proofImage) {
      hasProof = true;
      const img = document.createElement('img');
      img.className = 'proof-thumb';
      img.src = report.proofImage;
      gallery.appendChild(img);
    }
  });
  if (!hasProof) gallery.innerHTML = '<span class="no-proof">No proof photos yet. Submit reports with camera proof!</span>';
}

// ─────────────────────────────────────── AI ANALYSIS
async function runAIAnalysis() {
  const user   = getCurrentUser();
  if (!user) return;
  const apiKey = localStorage.getItem('geminiKey');
  if (!apiKey) {
    document.getElementById('ai-result').innerHTML = aiErrorCard('🔑 No API key found. Enter your Gemini API key on the landing page.');
    return;
  }

  const habits = getGroupHabits(user.groupCode);
  const last7  = getUserReports(user.userId, 7);
  const hasData = last7.some(r => r.report !== null);
  if (!hasData) {
    document.getElementById('ai-result').innerHTML = aiErrorCard('📋 No reports yet. Submit at least one daily report first.');
    return;
  }

  const habitNames = habits.map(h => h.name).join(', ');
  const maxScore   = getTotalMaxScore(habits);

  const reportLines = last7.map(({ date, report }) => {
    if (!report) return `${date}: NO REPORT`;
    const vals = habits.map(h => {
      const v = (report.values || {})[h.id];
      if (v === undefined) return '';
      const label = h.type === 'yesno' ? (v === 'yes' ? '✓' : '✗') : v + (h.type === 'hours' ? 'h' : 'min');
      return `${h.name}=${label}`;
    }).filter(Boolean).join(', ');
    return `${date}: [Score: ${report.score}/${maxScore}] ${vals}`;
  }).join('\n');

  const prompt = `You are a strict but empathetic discipline coach and sports psychologist for "LOCK IN" — a high-performance student accountability group.

User: ${user.name}
Tracked habits: ${habitNames}
Max daily score: ${maxScore} pts

Last 7 days data:
${reportLines}

Provide a detailed analysis with EXACTLY these section headers:

## OVERALL ASSESSMENT
[2–3 sentences on their discipline level and consistency]

## TOP 3 WEAKNESSES
[Their 3 biggest failure areas with specific corrective action and deadline for each]

## SWOT ANALYSIS
Strengths: [what they do consistently well]
Weaknesses: [specific behavioral gaps]
Opportunities: [areas for quick improvement]
Threats: [habits or patterns that could derail them]

## ABC ANALYSIS
A (Critical — must do every day): [list]
B (Important — most days): [list]
C (Low priority — nice to have): [list]

## PSYCHOLOGICAL INSIGHTS & SOLUTIONS
[3–4 specific psychology-backed techniques tailored to their actual data pattern. Reference real numbers.]

## 7-DAY ACTION PLAN
[Day-by-day specific targets for next 7 days based on their weaknesses]

## MOTIVATIONAL MESSAGE
[2–3 sentences as a coach/mentor. Reference their spiritual commitment if gratitude/prayer is tracked.]

Be direct, honest, ruthless but constructive. Use their actual data.`;

  const loadEl  = document.getElementById('ai-loading');
  const resultEl = document.getElementById('ai-result');
  loadEl.style.display  = 'flex';
  resultEl.innerHTML    = '';

  try {
    const resp = await fetch(GEMINI_ENDPOINT + '?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.75, maxOutputTokens: 2000 }
      })
    });
    loadEl.style.display = 'none';

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      resultEl.innerHTML = aiErrorCard('⚠️ API error: ' + (err?.error?.message || resp.status));
      return;
    }
    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) { resultEl.innerHTML = aiErrorCard('Empty response. Try again.'); return; }
    renderAIResult(text, resultEl);
  } catch (e) {
    loadEl.style.display = 'none';
    resultEl.innerHTML   = aiErrorCard('Network error: ' + e.message);
  }
}

function renderAIResult(text, container) {
  const sections = [
    { header: '## OVERALL ASSESSMENT',              icon: '📊', color: 'blue',   title: 'OVERALL ASSESSMENT' },
    { header: '## TOP 3 WEAKNESSES',                icon: '⚠️', color: 'red',    title: 'TOP 3 WEAKNESSES' },
    { header: '## SWOT ANALYSIS',                   icon: '🔍', color: 'gold',   title: 'SWOT ANALYSIS' },
    { header: '## ABC ANALYSIS',                    icon: '📋', color: 'purple', title: 'ABC ANALYSIS' },
    { header: '## PSYCHOLOGICAL INSIGHTS & SOLUTIONS', icon: '🧠', color: 'green', title: 'PSYCHOLOGICAL INSIGHTS & SOLUTIONS' },
    { header: '## 7-DAY ACTION PLAN',               icon: '📅', color: 'white',  title: '7-DAY ACTION PLAN' },
    { header: '## MOTIVATIONAL MESSAGE',            icon: '🔥', color: 'gold',   title: 'MOTIVATIONAL MESSAGE' },
  ];

  let html = '';
  sections.forEach((sec, i) => {
    const nextHeader = sections[i + 1] ? sections[i + 1].header : null;
    let start = text.indexOf(sec.header);
    if (start === -1) return;
    start += sec.header.length;
    let end = nextHeader ? text.indexOf(nextHeader) : text.length;
    if (end === -1) end = text.length;
    let body = text.slice(start, end).trim()
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em>$1</em>')
      .replace(/^- /gm, '• ')
      .replace(/\n/g, '<br>');
    html += `<div class="ai-section-card">
      <div class="ai-section-title ${sec.color}">${sec.icon} ${sec.title}</div>
      <div class="ai-section-body">${body}</div>
    </div>`;
  });

  if (!html) {
    const body = text.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
    html = `<div class="ai-section-card"><div class="ai-section-title white">🤖 Analysis</div><div class="ai-section-body">${body}</div></div>`;
  }
  container.innerHTML = html;
}

function aiErrorCard(msg) {
  return `<div class="ai-section-card" style="border-color:var(--red)">
    <div class="ai-section-title red">⚠️ ERROR</div>
    <div class="ai-section-body">${escHtml(msg)}</div>
  </div>`;
}

// ─────────────────────────────────────── COPY CODE
function copyCode() {
  const code = getCurrentUser()?.groupCode;
  if (!code) return;
  navigator.clipboard.writeText(code).then(() => {
    const btn = document.querySelector('.group-code-card .btn-ghost');
    if (btn) { const o = btn.textContent; btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = o, 1500); }
  }).catch(() => prompt('Copy this code:', code));
}

// ─────────────────────────────────────── BOOT
document.addEventListener('DOMContentLoaded', initApp);
