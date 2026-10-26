/* ═══════════════════════════════════════════════════════════════
   LOCK IN — backend.js
   Pure Vanilla JS | localStorage | Gemini AI API
═══════════════════════════════════════════════════════════════ */

'use strict';

// ─────────────────────────────────────── CONSTANTS
const QUOTES = [
  "The pain you feel today will be the strength you feel tomorrow.",
  "Discipline is the bridge between goals and accomplishment.",
  "We do not rise to the level of our expectations. We fall to the level of our training.",
  "Hard work beats talent when talent doesn't work hard.",
  "Do it now. Sometimes 'later' becomes 'never'.",
  "Great things never come from comfort zones.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "The secret of getting ahead is getting started.",
  "Push yourself, because no one else is going to do it for you.",
  "Dream it. Believe it. Build it.",
  "Your only limit is your mind.",
  "Stay humble. Work hard. Be kind.",
  "Prove them wrong. Then stay quiet and keep working.",
  "Every champion was once a contender that refused to give up.",
  "Iron sharpens iron. Surround yourself with warriors.",
  "You don't get what you wish for. You get what you work for.",
  "Suffer the pain of discipline or suffer the pain of regret.",
  "God doesn't give you what you can handle. He helps you handle what you're given.",
  "Consistency is what transforms average into excellence.",
  "The grind never stops. Neither should you.",
  "Be grateful for what you have while pursuing what you want.",
  "Your future self is watching. Don't disappoint him.",
];

const SCORE_WEIGHTS = { study: 30, exercise: 20, coldShower: 10, diet: 15, sleep: 15, meditation: 10 };
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ─────────────────────────────────────── STATE
let toggleState = { exercise: 'yes', coldShower: 'yes', diet: 'yes', sleep: 'yes' };
let proofImageBase64 = null;
let cameraStream = null;

// ─────────────────────────────────────── INIT
function initApp() {
  loadApiKey();
  const user = getCurrentUser();
  if (user) {
    showDashboard();
    renderHome();
  } else {
    showPage('landing');
  }
}

// ─────────────────────────────────────── NAVIGATION
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const p = document.getElementById('page-' + id);
  if (p) p.classList.add('active');
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

  if (name === 'home') renderHome();
  else if (name === 'report') renderReport();
  else if (name === 'leaderboard') renderLeaderboard();
  else if (name === 'profile') renderProfile();
  else if (name === 'ai') { document.getElementById('ai-result').innerHTML = ''; }
}

// ─────────────────────────────────────── AUTH TABS
function switchAuthTab(tab) {
  document.getElementById('auth-join').classList.remove('active');
  document.getElementById('auth-create').classList.remove('active');
  document.getElementById('tab-join-btn').classList.remove('active');
  document.getElementById('tab-create-btn').classList.remove('active');
  document.getElementById('auth-' + tab).classList.add('active');
  document.getElementById('tab-' + tab + '-btn').classList.add('active');
}

// ─────────────────────────────────────── API KEY
function loadApiKey() {
  const key = localStorage.getItem('geminiKey');
  if (key) {
    document.getElementById('api-key-input').value = key;
    document.getElementById('api-key-status').textContent = '✓ Key saved';
  }
}
function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key) { document.getElementById('api-key-status').textContent = '✗ Enter a key first'; return; }
  localStorage.setItem('geminiKey', key);
  document.getElementById('api-key-status').textContent = '✓ Key saved!';
}

// ─────────────────────────────────────── STORAGE HELPERS
function getGroups() { try { return JSON.parse(localStorage.getItem('lockin_groups') || '{}'); } catch { return {}; } }
function saveGroups(g) { localStorage.setItem('lockin_groups', JSON.stringify(g)); }

function getUsers() { try { return JSON.parse(localStorage.getItem('lockin_users') || '{}'); } catch { return {}; } }
function saveUsers(u) { localStorage.setItem('lockin_users', JSON.stringify(u)); }

function getReports() { try { return JSON.parse(localStorage.getItem('lockin_reports') || '{}'); } catch { return {}; } }
function saveReports(r) { localStorage.setItem('lockin_reports', JSON.stringify(r)); }

function getCurrentUser() { try { return JSON.parse(localStorage.getItem('lockin_current') || 'null'); } catch { return null; } }
function saveCurrentUser(u) { localStorage.setItem('lockin_current', JSON.stringify(u)); }

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generateUserId() { return 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }

function todayStr() { return new Date().toISOString().slice(0, 10); }

function dateLabel(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}

// ─────────────────────────────────────── CREATE GROUP
function createGroup() {
  const name = document.getElementById('create-name').value.trim();
  const groupName = document.getElementById('create-group-name').value.trim();
  const errEl = document.getElementById('create-error');
  errEl.textContent = '';

  if (!name) { errEl.textContent = 'Enter your name.'; return; }
  if (!groupName) { errEl.textContent = 'Enter a group name.'; return; }

  const groups = getGroups();
  let code = generateCode();
  while (groups[code]) code = generateCode(); // ensure unique

  const userId = generateUserId();
  const now = new Date().toISOString();

  groups[code] = {
    name: groupName,
    code: code,
    createdAt: now,
    members: [userId],
  };
  saveGroups(groups);

  const users = getUsers();
  users[userId] = { name, groupCode: code, role: 'Monitor', joinedAt: now };
  saveUsers(users);

  saveCurrentUser({ userId, name, groupCode: code, role: 'Monitor' });

  showDashboard();
  renderHome();
}

// ─────────────────────────────────────── JOIN GROUP
function joinGroup() {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  const errEl = document.getElementById('join-error');
  errEl.textContent = '';

  if (!name) { errEl.textContent = 'Enter your name.'; return; }
  if (code.length !== 5) { errEl.textContent = 'Code must be 5 characters.'; return; }

  const groups = getGroups();
  if (!groups[code]) { errEl.textContent = '✗ Group not found. Check the code.'; return; }

  // Check if this name already exists in the group (same device, re-login)
  const users = getUsers();
  const existingId = groups[code].members.find(id => users[id] && users[id].name.toLowerCase() === name.toLowerCase());

  let userId = existingId;
  if (!existingId) {
    userId = generateUserId();
    const now = new Date().toISOString();
    users[userId] = { name, groupCode: code, role: 'Member', joinedAt: now };
    saveUsers(users);
    groups[code].members.push(userId);
    saveGroups(groups);
  }

  const u = users[userId];
  saveCurrentUser({ userId, name: u.name, groupCode: code, role: u.role });
  showDashboard();
  renderHome();
}

// ─────────────────────────────────────── LOGOUT
function logout() {
  localStorage.removeItem('lockin_current');
  showPage('landing');
}

// ─────────────────────────────────────── SCORE CALCULATION
function calculateScore(report) {
  let score = 0;
  // Study: 10 pts per hour, max 30
  score += Math.min(30, (parseFloat(report.studyHours) || 0) * 10);
  // Exercise: 20 pts if yes
  if (report.exercise === 'yes') score += 20;
  // Cold shower: 10 pts
  if (report.coldShower === 'yes') score += 10;
  // Diet: 15 pts
  if (report.diet === 'yes') score += 15;
  // Sleep: 15 pts
  if (report.sleep === 'yes') score += 15;
  // Meditation: 2 pts/min, max 10
  score += Math.min(10, (parseInt(report.meditationMins) || 0) * 2);
  return Math.round(score);
}

function meetsMinimumDay(report) {
  const study = parseFloat(report.studyHours) || 0;
  const exercise = report.exercise === 'yes';
  const meditation = (parseInt(report.meditationMins) || 0) >= 5;
  return study >= 1 && exercise && meditation;
}

// ─────────────────────────────────────── GET USER REPORTS (last N days)
function getUserReports(userId, days = 7) {
  const reports = getReports();
  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const key = userId + '_' + dateKey;
    result.push({ date: dateKey, report: reports[key] || null });
  }
  return result.reverse();
}

function getStreak(userId) {
  const reports = getReports();
  let streak = 0;
  for (let i = 0; i < 90; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = userId + '_' + d.toISOString().slice(0, 10);
    if (reports[key]) streak++;
    else break;
  }
  return streak;
}

function getWeeklyAvg(userId) {
  const rpts = getUserReports(userId, 7);
  const filled = rpts.filter(r => r.report);
  if (!filled.length) return 0;
  const total = filled.reduce((s, r) => s + (r.report.score || 0), 0);
  return Math.round(total / filled.length);
}

function getTotalStats(userId) {
  const rpts = getUserReports(userId, 30);
  let totalStudy = 0, totalMed = 0, bestStreak = 0;
  rpts.forEach(r => {
    if (r.report) {
      totalStudy += parseFloat(r.report.studyHours) || 0;
      totalMed += parseInt(r.report.meditationMins) || 0;
    }
  });
  bestStreak = getStreak(userId);
  return { totalStudy: Math.round(totalStudy * 10) / 10, totalMed, bestStreak };
}

// ─────────────────────────────────────── LEADERBOARD DATA
function getLeaderboard() {
  const user = getCurrentUser();
  if (!user) return [];
  const groups = getGroups();
  const grp = groups[user.groupCode];
  if (!grp) return [];
  const users = getUsers();

  return grp.members.map(uid => {
    const u = users[uid] || { name: 'Unknown', role: 'Member' };
    const avg = getWeeklyAvg(uid);
    const streak = getStreak(uid);
    const todayReport = getReports()[uid + '_' + todayStr()] || null;
    const todayScore = todayReport ? todayReport.score : null;
    return { userId: uid, name: u.name, role: u.role, weeklyAvg: avg, streak, todayScore, isYou: uid === user.userId };
  }).sort((a, b) => b.weeklyAvg - a.weeklyAvg || b.streak - a.streak);
}

// ─────────────────────────────────────── UPDATE MONITOR
function updateMonitor(groupCode) {
  const groups = getGroups();
  const grp = groups[groupCode];
  if (!grp || grp.members.length < 2) return;
  const users = getUsers();
  let best = null, bestAvg = -1;
  grp.members.forEach(uid => {
    const avg = getWeeklyAvg(uid);
    if (avg > bestAvg) { bestAvg = avg; best = uid; }
  });
  grp.members.forEach(uid => { if (users[uid]) users[uid].role = uid === best ? 'Monitor' : 'Member'; });
  saveUsers(users);
  saveGroups(groups);
  const cur = getCurrentUser();
  if (cur && cur.groupCode === groupCode) {
    cur.role = users[cur.userId] ? users[cur.userId].role : cur.role;
    saveCurrentUser(cur);
  }
}

// ─────────────────────────────────────── RENDER HOME
function renderHome() {
  const user = getCurrentUser();
  if (!user) return;
  const groups = getGroups();
  const users = getUsers();
  const grp = groups[user.groupCode] || { members: [], name: '' };

  // Quote
  const dayOfYear = Math.floor((Date.now() / 86400000)) % QUOTES.length;
  document.getElementById('daily-quote').textContent = '"' + QUOTES[dayOfYear] + '"';

  // Group code
  document.getElementById('home-group-code').textContent = user.groupCode;

  // Today's score
  const todayKey = user.userId + '_' + todayStr();
  const myReport = getReports()[todayKey];
  document.getElementById('home-today-score').textContent = myReport ? myReport.score : '—';

  // Discipline warning (missed 2+ days)
  let missedCount = 0;
  for (let i = 1; i <= 2; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = user.userId + '_' + d.toISOString().slice(0, 10);
    if (!getReports()[k]) missedCount++;
  }
  document.getElementById('discipline-warning').style.display = missedCount >= 2 ? 'block' : 'none';

  // Members list
  const container = document.getElementById('home-members-list');
  container.innerHTML = '';
  const reports = getReports();
  grp.members.forEach(uid => {
    const u = users[uid];
    if (!u) return;
    const rKey = uid + '_' + todayStr();
    const r = reports[rKey];
    const score = r ? r.score : null;
    const isYou = uid === user.userId;
    const isMonitor = u.role === 'Monitor';
    const minMet = r ? meetsMinimumDay(r) : null;

    const barColor = score === null ? '' : score >= 70 ? 'bar-green' : score >= 40 ? 'bar-yellow' : 'bar-red';
    const barWidth = score !== null ? score : 0;

    const row = document.createElement('div');
    row.className = 'member-row';
    row.innerHTML = `
      <div class="member-avatar${isYou ? ' is-you' : ''}">${u.name.charAt(0).toUpperCase()}</div>
      <div class="member-info">
        <div class="member-name">${escHtml(u.name)}${isYou ? ' <span style="color:var(--text-muted);font-size:0.65rem">(you)</span>' : ''}</div>
        <div class="member-sub">${isMonitor ? '👑 Monitor' : 'Member'} · Streak: ${getStreak(uid)} days</div>
        <div class="member-badges">
          ${isMonitor ? '<span class="badge badge-monitor">Monitor</span>' : ''}
          ${r ? '<span class="badge badge-done">✓ Done</span>' : '<span class="badge badge-pending">Pending</span>'}
          ${r && !minMet ? '<span class="badge badge-min">Min Not Met</span>' : ''}
        </div>
      </div>
      <div class="score-bar-wrap">
        <div style="font-size:0.7rem;text-align:right;color:var(--text-dim);margin-bottom:3px">${score !== null ? score + '/100' : '—'}</div>
        <div class="score-bar"><div class="score-bar-fill ${barColor}" style="width:${barWidth}%"></div></div>
      </div>`;
    container.appendChild(row);
  });
}

// ─────────────────────────────────────── RENDER REPORT
function renderReport() {
  const user = getCurrentUser();
  if (!user) return;
  const key = user.userId + '_' + todayStr();
  const r = getReports()[key];

  const banner = document.getElementById('already-submitted-banner');
  const form = document.getElementById('report-form-wrap');
  if (r) {
    banner.style.display = 'block';
    form.style.display = 'none';
    document.getElementById('today-score-display').textContent = r.score + ' / 100';
  } else {
    banner.style.display = 'none';
    form.style.display = 'block';
    document.getElementById('min-day-warning').style.display = 'none';
  }
}

// ─────────────────────────────────────── TOGGLE BUTTONS
function setToggle(field, val) {
  toggleState[field] = val;
  const prefixMap = { exercise: 'ex', coldShower: 'cs', diet: 'dp', sleep: 'sl' };
  const p = prefixMap[field];
  document.getElementById(p + '-yes').classList.toggle('active', val === 'yes');
  document.getElementById(p + '-no').classList.toggle('active', val === 'no');
}

// ─────────────────────────────────────── CAMERA
function openCamera() {
  const constraints = { video: { facingMode: 'user' }, audio: false };
  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    cameraStream = stream;
    const video = document.getElementById('camera-video');
    video.srcObject = stream;
    document.getElementById('camera-container').style.display = 'block';
    document.getElementById('open-camera-btn').style.display = 'none';
    document.getElementById('proof-preview-wrap').style.display = 'none';
  }).catch(err => {
    alert('Camera access denied or unavailable. You can still submit without photo proof.');
    console.warn('Camera error:', err);
  });
}

function capturePhoto() {
  const video = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  canvas.width = video.videoWidth || 640;
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
  document.getElementById('open-camera-btn').style.display = 'block';
}

// ─────────────────────────────────────── SUBMIT REPORT
function submitReport() {
  const user = getCurrentUser();
  if (!user) return;
  const errEl = document.getElementById('report-error');
  errEl.textContent = '';

  const studyHours = parseFloat(document.getElementById('r-study').value) || 0;
  const meditationMins = parseInt(document.getElementById('r-meditation').value) || 0;
  const exerciseType = document.getElementById('r-exercise-type').value.trim();

  const report = {
    studyHours,
    exercise: toggleState.exercise,
    exerciseType,
    coldShower: toggleState.coldShower,
    diet: toggleState.diet,
    sleep: toggleState.sleep,
    meditationMins,
    proofImage: proofImageBase64 || null,
    submittedAt: new Date().toISOString(),
  };

  report.score = calculateScore(report);
  const minMet = meetsMinimumDay(report);

  if (!minMet) {
    document.getElementById('min-day-warning').style.display = 'block';
  }

  const key = user.userId + '_' + todayStr();
  const reports = getReports();
  reports[key] = report;
  saveReports(reports);

  // Update monitor role weekly
  updateMonitor(user.groupCode);

  // Refresh report view
  renderReport();
  renderHome();
  switchTab('report');
}

// ─────────────────────────────────────── RENDER LEADERBOARD
function renderLeaderboard() {
  const board = getLeaderboard();
  const container = document.getElementById('leaderboard-list');
  container.innerHTML = '';

  const rankEmoji = { 0: '🥇', 1: '🥈', 2: '🥉' };
  const rankClass = { 0: 'rank-1', 1: 'rank-2', 2: 'rank-3' };
  const rankColor = { 0: 'rank-gold', 1: 'rank-silver', 2: 'rank-bronze' };

  board.forEach((member, i) => {
    const row = document.createElement('div');
    row.className = `lb-row ${rankClass[i] || ''} ${member.isYou ? 'is-you' : ''}`;
    const streakHtml = member.streak > 0 ? `<span class="streak-badge">🔥 ${member.streak}d streak</span>` : '';
    const monitorBadge = member.role === 'Monitor' ? '<span class="badge badge-monitor">👑 Monitor</span>' : '';
    row.innerHTML = `
      <div class="lb-rank ${rankColor[i] || 'rank-num'}">${rankEmoji[i] || (i + 1)}</div>
      <div class="lb-info">
        <div class="lb-name">${escHtml(member.name)} ${member.isYou ? '<span style="color:var(--text-muted);font-size:0.65rem">(you)</span>' : ''}</div>
        <div class="lb-sub" style="display:flex;gap:0.4rem;flex-wrap:wrap;align-items:center">
          ${monitorBadge} ${streakHtml}
          <span style="font-size:0.68rem;color:var(--text-muted)">Today: ${member.todayScore !== null ? member.todayScore : '—'}/100</span>
        </div>
      </div>
      <div class="lb-score-block">
        <div class="lb-score">${member.weeklyAvg}</div>
        <div class="lb-score-label">weekly avg</div>
      </div>`;
    container.appendChild(row);
  });

  if (!board.length) {
    container.innerHTML = '<div style="color:var(--text-muted);padding:1rem;text-align:center">No members yet. Share your group code!</div>';
  }
}

// ─────────────────────────────────────── RENDER PROFILE
function renderProfile() {
  const user = getCurrentUser();
  if (!user) return;
  const users = getUsers();
  const u = users[user.userId] || user;
  const groups = getGroups();
  const grp = groups[user.groupCode] || {};

  document.getElementById('profile-avatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('profile-role').textContent = (u.role === 'Monitor' ? '👑 Monitor' : '👤 Member');
  document.getElementById('profile-group').textContent = '🔒 ' + (grp.name || user.groupCode) + ' · Code: ' + user.groupCode;

  const { totalStudy, totalMed, bestStreak } = getTotalStats(user.userId);
  const avg = getWeeklyAvg(user.userId);

  document.getElementById('stat-streak').textContent = bestStreak;
  document.getElementById('stat-study').textContent = totalStudy + 'h';
  document.getElementById('stat-meditation').textContent = totalMed + 'm';
  document.getElementById('stat-avg').textContent = avg;

  // 7-day history grid
  const histGrid = document.getElementById('history-grid');
  histGrid.innerHTML = '';
  const last7 = getUserReports(user.userId, 7);
  last7.forEach(({ date, report }) => {
    const div = document.createElement('div');
    const score = report ? report.score : null;
    let cls = 'score-none';
    if (score !== null) cls = score >= 70 ? 'score-high' : score >= 40 ? 'score-mid' : 'score-low';
    div.className = 'history-day ' + cls;
    const d = new Date(date + 'T00:00:00');
    const dayName = d.toLocaleDateString('en', { weekday: 'short' });
    const dayNum = d.getDate();
    div.innerHTML = `<span class="day-label">${dayName} ${dayNum}</span><span class="day-score">${score !== null ? score : '—'}</span>`;
    div.title = date + (report ? ' · Score: ' + score : ' · No report');
    histGrid.appendChild(div);
  });

  // Proof gallery
  const gallery = document.getElementById('proof-gallery');
  gallery.innerHTML = '';
  let hasProof = false;
  last7.forEach(({ report }) => {
    if (report && report.proofImage) {
      hasProof = true;
      const img = document.createElement('img');
      img.className = 'proof-thumb';
      img.src = report.proofImage;
      img.alt = 'proof';
      gallery.appendChild(img);
    }
  });
  if (!hasProof) {
    gallery.innerHTML = '<span class="no-proof">No proof photos yet. Submit your daily reports with camera proof!</span>';
  }
}

// ─────────────────────────────────────── AI ANALYSIS
async function runAIAnalysis() {
  const user = getCurrentUser();
  if (!user) return;
  const apiKey = localStorage.getItem('geminiKey');
  if (!apiKey) {
    document.getElementById('ai-result').innerHTML = aiErrorCard('🔑 No API key found. Go back to the landing page and enter your Gemini API key.');
    return;
  }

  const last7 = getUserReports(user.userId, 7);
  const hasData = last7.some(r => r.report !== null);
  if (!hasData) {
    document.getElementById('ai-result').innerHTML = aiErrorCard('📋 No reports found yet. Submit at least one daily report before running AI analysis.');
    return;
  }

  // Build prompt context
  const reportSummary = last7.map(({ date, report }) => {
    if (!report) return `${date}: NO REPORT SUBMITTED`;
    return `${date}: Study=${report.studyHours}h, Exercise=${report.exercise}(${report.exerciseType || 'unspecified'}), ColdShower=${report.coldShower}, Diet=${report.diet}, Sleep=${report.sleep}, Meditation=${report.meditationMins}min, Score=${report.score}/100`;
  }).join('\n');

  const prompt = `You are a strict but empathetic discipline coach and sports psychologist for a high-performance student accountability group called "LOCK IN".

User: ${user.name}
Last 7 days discipline data:
${reportSummary}

Scoring system: Study(max 30pts: 10/hr), Exercise(20pts), Cold Shower(10pts), Diet(15pts), Sleep(15pts), Meditation(max 10pts: 2/min).
Minimum day rule: 1hr study + exercise + 5min meditation = minimum acceptable.

Please provide a detailed analysis in EXACTLY this structure (use these exact headers):

## OVERALL ASSESSMENT
[2-3 sentences on their overall discipline level and consistency pattern]

## TOP 3 WEAKNESSES
[List the 3 biggest areas they're failing in, with specific corrective action and a deadline for each]

## SWOT ANALYSIS
Strengths: [what they're doing consistently well]
Weaknesses: [specific behavioral gaps]
Opportunities: [areas with potential for quick improvement]
Threats: [habits or patterns that could derail their progress]

## ABC ANALYSIS
A (Critical - must do every day): [list]
B (Important - do most days): [list]
C (Low priority - nice to have): [list]

## PSYCHOLOGICAL INSIGHTS & SOLUTIONS
[3-4 specific psychological techniques, mindset shifts, or habit stacking strategies tailored to their pattern. Be specific — reference their actual data.]

## 7-DAY ACTION PLAN
[Day-by-day specific targets for the next 7 days based on their weaknesses]

## MOTIVATIONAL MESSAGE
[A powerful 2-3 sentence message from a coach/mentor perspective, referencing their spiritual commitment to God as mentioned in the group rules]

Be direct, honest, and ruthless but constructive. Reference their actual numbers.`;

  const loadingEl = document.getElementById('ai-loading');
  const resultEl = document.getElementById('ai-result');
  loadingEl.style.display = 'flex';
  resultEl.innerHTML = '';

  try {
    const resp = await fetch(GEMINI_ENDPOINT + '?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1800 }
      })
    });

    loadingEl.style.display = 'none';

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      const msg = err?.error?.message || 'API error ' + resp.status;
      resultEl.innerHTML = aiErrorCard('⚠️ Gemini API error: ' + msg);
      return;
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!text) { resultEl.innerHTML = aiErrorCard('Empty response from Gemini. Try again.'); return; }

    renderAIResult(text, resultEl);
  } catch (e) {
    loadingEl.style.display = 'none';
    resultEl.innerHTML = aiErrorCard('Network error: ' + e.message + '. Make sure you have internet access and a valid API key.');
  }
}

function renderAIResult(text, container) {
  const sections = [
    { header: '## OVERALL ASSESSMENT', icon: '📊', color: 'blue', title: 'OVERALL ASSESSMENT' },
    { header: '## TOP 3 WEAKNESSES', icon: '⚠️', color: 'red', title: 'TOP 3 WEAKNESSES' },
    { header: '## SWOT ANALYSIS', icon: '🔍', color: 'gold', title: 'SWOT ANALYSIS' },
    { header: '## ABC ANALYSIS', icon: '📋', color: 'purple', title: 'ABC ANALYSIS' },
    { header: '## PSYCHOLOGICAL INSIGHTS & SOLUTIONS', icon: '🧠', color: 'green', title: 'PSYCHOLOGICAL INSIGHTS & SOLUTIONS' },
    { header: '## 7-DAY ACTION PLAN', icon: '📅', color: 'white', title: '7-DAY ACTION PLAN' },
    { header: '## MOTIVATIONAL MESSAGE', icon: '🔥', color: 'red', title: 'MOTIVATIONAL MESSAGE' },
  ];

  let html = '';
  sections.forEach((sec, i) => {
    const nextHeader = sections[i + 1] ? sections[i + 1].header : null;
    let start = text.indexOf(sec.header);
    if (start === -1) return;
    start += sec.header.length;
    let end = nextHeader ? text.indexOf(nextHeader) : text.length;
    if (end === -1) end = text.length;
    let body = text.slice(start, end).trim();
    body = body
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^[-•] /gm, '• ')
      .replace(/\n/g, '<br>');
    html += `<div class="ai-section-card">
      <div class="ai-section-title ${sec.color}">${sec.icon} ${sec.title}</div>
      <div class="ai-section-body">${body}</div>
    </div>`;
  });

  if (!html) {
    // Fallback: show raw text formatted
    const body = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    html = `<div class="ai-section-card"><div class="ai-section-title white">🤖 AI Analysis</div><div class="ai-section-body">${body}</div></div>`;
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
    if (btn) { const orig = btn.textContent; btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = orig, 1500); }
  }).catch(() => {
    prompt('Copy this code:', code);
  });
}

// ─────────────────────────────────────── UTILS
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─────────────────────────────────────── BOOT
document.addEventListener('DOMContentLoaded', initApp);
