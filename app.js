/* ═══════════════════════════════════════════════════
   BBG CONTACTS — app.js
═══════════════════════════════════════════════════ */
'use strict';

// ── STATE ──────────────────────────────────────────
const state = {
  contacts:   [],
  prototypes: [],
  festivals:  [],
  activePage: 'home',

  contactsSearch:    '',
  contactsCat:       '',
  contactsUrgency:   '',
  contactsSort:      'category',
  contactsSortAsc:   true,
  contactsView:      'grid',
  contactsZoom:      1,

  prototypesSearch:  '',
  prototypesStatus:  '',
  prototypesInterest:'',
  prototypesTag:     '',
  prototypesSort:    'status',
  prototypesSortAsc: true,
  prototypesView:    'grid',
  prototypesZoom:    1,

  festivalsSearch:        '',
  festivalsCategory:      '',
  festivalsParticipating: '',
  festivalsSort:          'dateStart',
  festivalsSortAsc:       true,
  festivalsView:          'grid',
  festivalsZoom:          1,

  standaloneTasks:    [],
  adminCards:         [],
  actifs:             [],
  appointments:       [],
  adminCatFilter:     '',
  compareMode:        false,
  selectedForCompare: [],
  tasksFilter:        'all',
  tasksSourceFilter:  [],   // [] = tout, 'contacts', 'jeux'
  contactsFavoriteOnly: false,
  agendaSortAsc:      false,
  agendaTypeFilters:   [],   // [] = tous types
  agendaSourceFilter: [],   // [] = tout, 'contacts', 'jeux', 'rdv'
};

// ── STORAGE ────────────────────────────────────────
function saveState() {
  localStorage.setItem('bbg-contacts',         JSON.stringify(state.contacts));
  localStorage.setItem('bbg-prototypes',       JSON.stringify(state.prototypes));
  localStorage.setItem('bbg-festivals',        JSON.stringify(state.festivals));
  localStorage.setItem('bbg-standalone-tasks', JSON.stringify(state.standaloneTasks));
  localStorage.setItem('bbg-admin-cards',      JSON.stringify(state.adminCards));
  localStorage.setItem('bbg-actifs',           JSON.stringify(state.actifs));
  localStorage.setItem('bbg-appointments',     JSON.stringify(state.appointments));
}
// ── Data migration ──────────────────────────────
function migrateContact(c) {
  // task/taskUrgency/taskDone → tasks[]
  if (!Array.isArray(c.tasks)) {
    c.tasks = c.task
      ? [{ id: uid(), text: c.task, urgency: c.taskUrgency || 'normal', done: c.taskDone || false }]
      : [];
  }
  // lastMeeting → exchanges[]
  if (!Array.isArray(c.exchanges)) {
    c.exchanges = c.lastMeeting
      ? [{ id: uid(), date: c.lastMeeting, type: 'rencontre', note: c.lastMeetingNote || '' }]
      : [];
  }
  if (!Array.isArray(c.socials))  c.socials  = [];
  if (!Array.isArray(c.videos))   c.videos   = [];
  if (typeof c.favorite === 'undefined') c.favorite = false;
  return c;
}
const STATUS_MIGRATE = { concept: 'tester', test: 'tester', proto: 'tester', signé: 'développement', finalisation: 'production', publié: 'sorti' };

function migrateFestival(f) {
  if (!Array.isArray(f.contactLinks)) f.contactLinks = [];
  if (!Array.isArray(f.gameLinks))    f.gameLinks    = [];
  if (!Array.isArray(f.presences))    f.presences    = [];
  if (!Array.isArray(f.tasks))        f.tasks        = [];
  if (!Array.isArray(f.photos))       f.photos       = [];
  if (!f.costs || typeof f.costs !== 'object') f.costs = {};
  if (typeof f.participating === 'undefined')  f.participating = false;
  if (typeof f.protos === 'undefined')         f.protos = false;
  if (!f.category) f.category = 'festival';
  return f;
}

function migratePrototype(p) {
  if (!Array.isArray(p.tasks)) {
    p.tasks = p.task
      ? [{ id: uid(), text: p.task, urgency: p.taskUrgency || 'normal', done: p.taskDone || false }]
      : [];
  }
  if (!Array.isArray(p.contactLinks)) {
    p.contactLinks = [];
  }
  if (STATUS_MIGRATE[p.status]) p.status = STATUS_MIGRATE[p.status];
  if (!Array.isArray(p.devLog))  p.devLog  = [];
  if (!Array.isArray(p.photos))  p.photos  = [];
  if (!Array.isArray(p.tags))    p.tags    = [];
  if (!Array.isArray(p.videos))  p.videos  = [];
  if (!Array.isArray(p.costs))        p.costs        = [];
  if (!Array.isArray(p.testSessions)) p.testSessions = [];
  return p;
}

function migrateAdminCard(card) {
  if (!card.urgency)           card.urgency           = 'normal';
  if (!card.recurrence)        card.recurrence        = null;
  if (card.dayOfMonth == null) card.dayOfMonth        = null;
  if (!Array.isArray(card.completionHistory)) card.completionHistory = [];
  return card;
}

function loadState() {
  // SAFE load: never overwrite localStorage on error to avoid data loss
  let c, p, f, s;
  try { c = localStorage.getItem('bbg-contacts'); } catch(e) {}
  try { p = localStorage.getItem('bbg-prototypes'); } catch(e) {}
  try { f = localStorage.getItem('bbg-festivals'); } catch(e) {}
  try { s = localStorage.getItem('bbg-standalone-tasks'); } catch(e) {}
  let a, act, appt;
  try { a    = localStorage.getItem('bbg-admin-cards'); } catch(e) {}
  try { act  = localStorage.getItem('bbg-actifs');      } catch(e) {}
  try { appt = localStorage.getItem('bbg-appointments'); } catch(e) {}

  try {
    state.contacts = (c ? JSON.parse(c) : SEED_CONTACTS).map(migrateContact);
  } catch(e) {
    console.error('Contacts parse error', e);
    state.contacts = SEED_CONTACTS.map(migrateContact);
  }
  try {
    state.prototypes = (p ? JSON.parse(p) : SEED_PROTOTYPES).map(migratePrototype);
  } catch(e) {
    console.error('Prototypes parse error', e);
    state.prototypes = SEED_PROTOTYPES.map(migratePrototype);
  }
  try {
    state.festivals = (f ? JSON.parse(f) : []).map(migrateFestival);
  } catch(e) {
    console.error('Festivals parse error', e);
    state.festivals = [];
  }
  try {
    state.standaloneTasks = s ? JSON.parse(s) : [];
  } catch(e) {
    state.standaloneTasks = [];
  }
  try {
    state.adminCards = a ? JSON.parse(a).map(migrateAdminCard) : [];
  } catch(e) {
    state.adminCards = [];
  }
  try {
    state.actifs = act ? JSON.parse(act) : [];
  } catch(e) {
    state.actifs = [];
  }
  try {
    state.appointments = appt ? JSON.parse(appt) : [];
  } catch(e) {
    state.appointments = [];
  }
  // Only seed if truly empty (no existing localStorage data)
  if (!c) saveState();
}

// ── UTILS ──────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function initials(name) {
  return (name || '').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function today() { return new Date().toISOString().split('T')[0]; }

const URGENCY_ORDER = { critique: 0, urgent: 1, normal: 2, faible: 3, '': 4 };

/* ── Card dimension formula (Kicktraquer CampagneCard) ── */
function cardDims(zoom) {
  const isMin = zoom <= 1;
  return {
    isMin,
    width:  isMin ? (80 + zoom * 40) : (150 + zoom * 30),
    mediaH: isMin ? (80 + zoom * 40) : (100 + zoom * 25),
  };
}

/* ── SVG Icons ── */
const ICONS = {
  pencil:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  extLink: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  mail:    `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  phone:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.1-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  clock:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  users:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  chevUp:  `<polyline points="18 15 12 9 6 15"/>`,
  chevDown:`<polyline points="6 9 12 15 18 9"/>`,
};

const PROTO_ICONS = {
  pnp: '⏳', imprimer: '🖨️', tester: '🧪', 'test-à-venir': '📅', évalué: '✅',
  développement: '🔧', production: '🏭', standby: '💤', sorti: '🚀', abandonné: '❌', 'non-retenu': '🚫'
};
const STATUS_LABELS = {
  pnp: 'En attente de Règles / PNP', imprimer: 'À Imprimer', tester: 'À tester', 'test-à-venir': 'Test à Venir', évalué: 'Évalué',
  développement: 'En Développement', production: 'En Production', standby: 'Standby', sorti: 'Sorti', abandonné: 'Abandonné', 'non-retenu': 'Non Retenu'
};

const URGENCY_EMOJI = { faible: '💤', normal: '📌', urgent: '⚠️', critique: '🚨' };

const CAT_LABELS = {
  auteur: 'Auteurs', illustrateur: 'Illustrateurs', editeur: 'Éditeurs',
  distributeur: 'Distributeurs', fabricant: 'Fabricants'
};

const INTEREST_LABELS = ['', 'Faible', 'Moyen', 'Fort', 'Très fort', 'Exceptionnel'];

const SOCIAL_TYPES = ['LinkedIn', 'Facebook', 'Twitter/X', 'Instagram', 'BGG', 'Site web', 'Autre'];
const EXCHANGE_TYPES = ['rencontre', 'email', 'appel', 'salon', 'message', 'developpement', 'autre'];
const STATUS_ORDER = ['développement', 'test-à-venir', 'tester', 'évalué', 'imprimer', 'pnp', 'production', 'standby', 'sorti', 'abandonné', 'non-retenu'];

// ── Task helpers ───────────────────────────────────
// Returns display text for a task, adding "X/N" progress for test_counter tasks.
// sessionCount: current number of test sessions (pass for prototype context).
function taskLabel(t, sessionCount) {
  if (t.subtype === 'test_counter' && t.targetCount) {
    const cur = sessionCount != null ? sessionCount : (t._sessionCount || 0);
    return `${t.text} — ${cur}/${t.targetCount}`;
  }
  return t.text;
}

function getTopTask(item) {
  const pending = (item.tasks || []).filter(t => !t.done);
  if (!pending.length) return null;
  return pending.reduce((best, t) =>
    (URGENCY_ORDER[t.urgency || 'normal'] < URGENCY_ORDER[best.urgency || 'normal']) ? t : best
  , pending[0]);
}

function getTopUrgency(item) {
  const top = getTopTask(item);
  return top ? (top.urgency || 'normal') : '';
}

// ── PDF helper ────────────────────────────────────
function getPdfEmbedUrl(url) {
  // Google Drive: /file/d/ID/view → /file/d/ID/preview
  const gd = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
  if (gd) return `https://drive.google.com/file/d/${gd[1]}/preview`;
  // Dropbox: ?dl=0 → ?raw=1  (direct download, embeddable)
  if (url.includes('dropbox.com')) return url.replace(/[?&]dl=\d/, '').replace(/(\?.*)$/, '$1&raw=1').replace(/^([^?]+)$/, '$1?raw=1');
  // Fallback: Google Docs viewer
  return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
}
function openPdfBlob(protoId) {
  const p = state.prototypes.find(x => x.id === protoId);
  if (!p?.pdf) return;
  try {
    const dataUrl = p.pdf;
    const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch(e) {
    window.open(p.pdf, '_blank');
  }
}

function injectPdfViewer(protoId) {
  const p = state.prototypes.find(x => x.id === protoId);
  if (!p?.pdf) return;
  const frame = document.getElementById('pdf-preview-frame-' + protoId);
  if (!frame) return;
  try {
    const dataUrl = p.pdf;
    const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: 'application/pdf' });
    frame.src = URL.createObjectURL(blob);
  } catch(e) {
    frame.src = p.pdf;
  }
}

// ═══════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════
function switchPage(page) {
  state.activePage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.page === page)
  );
  if (page === 'home')       renderDashboard();
  if (page === 'contacts')   renderContacts();
  if (page === 'prototypes') renderPrototypes();
  if (page === 'tasks')      renderTasks();
  if (page === 'agenda')     renderAgenda();
  if (page === 'festivals')  renderFestivals();
  if (page === 'admin')      renderAdmin();
  if (page === 'stats')      renderStats();
}

// ═══════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════
function renderDashboard() {
  const el = document.getElementById('dashboard-content');
  if (!el) return;

  const today_str = today();
  const pendingTasks = [
    ...state.contacts.flatMap(c => (c.tasks||[]).filter(t => !t.done).map(t => ({...t, _from:'contact', _name: c.name, _id: c.id}))),
    ...state.prototypes.flatMap(p => {
      const _sc = (p.testSessions||[]).filter(s => s.date||s.comments||s.rating).length;
      return (p.tasks||[]).filter(t => !t.done).map(t => ({...t, _from:'prototype', _name: p.title, _id: p.id, _sessionCount: _sc, _status: p.status, _emoji: p.emoji}));
    }),
    ...(state.standaloneTasks||[]).filter(t => !t.done).map(t => ({...t, _from:'standalone', _name:'Tâche libre', _id:t.id})),
    ...state.festivals.flatMap(f => [
      ...(f.presences||[]).filter(p => !p.done).map(p => {
        const ds = p.dateStart || p.date || '';
        const de = p.dateEnd || '';
        const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}) : null;
        const period = (fmt(ds) && fmt(de) && fmt(ds) !== fmt(de)) ? `${fmt(ds)} → ${fmt(de)}` : (fmt(ds) || '');
        return {...p, text: `Présence${period ? ' · ' + period : ''}${p.note ? ' — ' + p.note : ''}`, _from:'festival', _name: f.name, _id: f.id, urgency: p.urgency||'normal', dueDate: ds};
      }),
      ...(f.tasks||[]).filter(t => !t.done).map(t => ({...t, _from:'festival-task', _name: f.name, _id: f.id})),
    ]),
    ...(state.adminCards||[]).filter(c => !isAdminCardDone(c)).map(c => adminCardToTask(c)),
  ].sort((a,b) => {
    const oa = URGENCY_ORDER[a.urgency||'normal'] ?? 99;
    const ob = URGENCY_ORDER[b.urgency||'normal'] ?? 99;
    return oa - ob;
  });

  const urgentTasks = pendingTasks.filter(t => t.urgency === 'critique' || t.urgency === 'urgent');

  // Recent exchanges (last 5)
  const allExchanges = state.contacts.flatMap(c =>
    (c.exchanges||[]).map(e => ({...e, _name: c.name, _id: c.id, _cat: c.category}))
  ).sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Due today/overdue tasks
  const dueNow = pendingTasks.filter(t => t.dueDate && t.dueDate <= today_str)
    .sort((a,b) => a.dueDate.localeCompare(b.dueDate));

  // Upcoming tasks (future due dates)
  const upcomingTasks = pendingTasks
    .filter(t => t.dueDate && t.dueDate > today_str)
    .sort((a,b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8);

  // Test counter tasks — triés par statut : En développement, À tester, À imprimer
  // On prend tous les protos avec une tâche test_counter (done ou non) pour ne pas les perdre
  const TEST_STATUS_ORDER = { développement: 0, tester: 1, imprimer: 2 };
  const testCounterTasks = state.prototypes
    .filter(p => p.status !== 'abandonné' && p.status !== 'non-retenu')
    .filter(p => (p.tasks||[]).some(t => t.subtype === 'test_counter' && !t.done))
    .map(p => {
      const sc = (p.testSessions||[]).filter(s => s.date||s.comments||s.rating).length;
      const counterTask = (p.tasks||[]).find(t => t.subtype === 'test_counter');
      return { ...counterTask, _from: 'prototype', _name: p.title, _id: p.id, _sessionCount: sc, _status: p.status, _emoji: p.emoji };
    })
    .sort((a,b) => {
      const da = a.dueDate || '', db = b.dueDate || '';
      if (!da && !db) return (a._name||'').localeCompare(b._name||'', 'fr');
      if (!da) return 1;
      if (!db) return -1;
      return da.localeCompare(db);
    });

  // Top protos (by interest, not sorti)
  const topProtos = [...state.prototypes]
    .filter(p => p.status !== 'sorti' && p.status !== 'non-retenu')
    .sort((a,b) => (b.interest||3) - (a.interest||3))
    .slice(0, 4);

  const EXCH_EMOJI = { rencontre:'🤝', email:'📧', appel:'📞', salon:'🎪', message:'💬', developpement:'🛠️', autre:'📝' };
  const totalExch = state.contacts.reduce((n,c) => n + (c.exchanges||[]).length, 0);

  el.innerHTML = `
    <div class="dash-header">
      <div>
        <h2 class="dash-title">Bonjour 👋</h2>
        <p class="dash-date">${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
      </div>
    </div>

    <div class="dash-stats">
      <div class="dash-stat-card" onclick="switchPage('contacts')">
        <div class="dash-stat-num">${state.contacts.length}</div>
        <div class="dash-stat-label">Contacts</div>
      </div>
      <div class="dash-stat-card" onclick="switchPage('prototypes')">
        <div class="dash-stat-num">${state.prototypes.length}</div>
        <div class="dash-stat-label">Prototypes</div>
      </div>
      <div class="dash-stat-card${urgentTasks.length > 0 ? ' dash-stat-alert' : ''}" onclick="switchPage('tasks')">
        <div class="dash-stat-num">${pendingTasks.length}</div>
        <div class="dash-stat-label">Tâches en attente</div>
      </div>
      <div class="dash-stat-card" onclick="switchPage('agenda')">
        <div class="dash-stat-num">${totalExch}</div>
        <div class="dash-stat-label">Échanges</div>
      </div>
    </div>

    <div class="dash-cols">
      ${dueNow.length > 0 ? `
      <div class="dash-section" style="flex:1;min-width:0">
        <div class="dash-section-title">🔔 Échéances dépassées ou du jour</div>
        ${dueNow.map(t => {
          const nav = t._from === 'standalone'
            ? "switchPage('tasks')"
            : (t._from === 'festival-task' || t._from === 'festival')
              ? `switchPage('festivals');openFestivalDetail('${t._id}')`
              : t._from === 'admin'
                ? "switchPage('admin')"
                : `switchPage('${t._from === 'contact' ? 'contacts' : 'prototypes'}');openDetail('${t._from}','${t._id}')`;
          const diffDays = Math.floor((new Date(today_str) - new Date(t.dueDate)) / 86400000);
          const lateLabel = diffDays === 0 ? "Aujourd'hui" : diffDays === 1 ? '1j de retard' : `${diffDays}j de retard`;
          const lateColor = diffDays === 0 ? '#7c3aed' : '#dc2626';
          return `
          <div class="dash-task-row dash-task-due">
            <input type="checkbox" class="task-check" onclick="event.stopPropagation();toggleTaskDone('${t._from}','${t._id}','${t.id}')" />
            <div style="flex:1;display:flex;align-items:center;gap:.5rem;min-width:0;cursor:pointer" onclick="${nav}">
              <span class="badge badge-urgence-${t.urgency||'normal'}">${URGENCY_EMOJI[t.urgency||'normal']||''} ${t.urgency||'normal'}</span>
              <span class="dash-task-text">${esc(taskLabel(t))}</span>
              <span class="dash-task-source">${esc(t._name)}</span>
              <span class="dash-task-date dash-task-date-editable" style="color:${lateColor}" data-date="${t.dueDate}" onclick="event.stopPropagation();openTaskDatePicker(this,'${t._from}','${t._id}','${t.id}')" title="Modifier la date">${new Date(t.dueDate).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'})}</span>
              <span class="dash-days-badge" style="color:${lateColor};background:${lateColor}1a">${lateLabel}</span>
            </div>
          </div>`;
        }).join('')}
      </div>` : ''}

      ${upcomingTasks.length > 0 ? `
      <div class="dash-section" style="flex:1;min-width:0">
        <div class="dash-section-title">📆 Tâches à venir</div>
        ${upcomingTasks.map(t => {
          const days = Math.ceil((new Date(t.dueDate) - new Date(today_str)) / 86400000);
          const dayLabel = days === 1 ? 'demain' : `dans ${days} j`;
          const dayColor = days <= 3 ? '#ea580c' : days <= 7 ? '#ca8a04' : '#16a34a';
          const dateLabel = new Date(t.dueDate).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'});
          const nav = t._from === 'standalone'
            ? "switchPage('tasks')"
            : (t._from === 'festival-task' || t._from === 'festival')
              ? `switchPage('festivals');openFestivalDetail('${t._id}')`
              : t._from === 'admin'
                ? "switchPage('admin')"
                : `switchPage('${t._from === 'contact' ? 'contacts' : 'prototypes'}');openDetail('${t._from}','${t._id}')`;
          return `
          <div class="dash-task-row">
            <input type="checkbox" class="task-check" onclick="event.stopPropagation();toggleTaskDone('${t._from}','${t._id}','${t.id}')" />
            <div style="flex:1;display:flex;align-items:center;gap:.5rem;min-width:0;cursor:pointer" onclick="${nav}">
              <span class="badge badge-urgence-${t.urgency||'normal'}">${URGENCY_EMOJI[t.urgency||'normal']||''} ${t.urgency||'normal'}</span>
              <span class="dash-task-text">${esc(taskLabel(t))}</span>
              <span class="dash-task-source">${esc(t._name)}</span>
              <span class="dash-task-date dash-task-date-editable" data-date="${t.dueDate}" onclick="event.stopPropagation();openTaskDatePicker(this,'${t._from}','${t._id}','${t.id}')" title="Modifier la date">${dateLabel}</span>
              <span class="dash-days-badge" style="color:${dayColor};background:${dayColor}1a">${dayLabel}</span>
            </div>
          </div>`;
        }).join('')}
      </div>` : ''}
    </div>

    <div class="dash-cols">
      ${testCounterTasks.length > 0 ? `
      <div class="dash-section" style="flex:1;min-width:0">
        <div class="dash-section-title">🧪 Sessions de test</div>
        ${testCounterTasks.map(t => {
          const cur = t._sessionCount || 0;
          const target = t.targetCount || 1;
          const pct = Math.min(100, Math.round(cur / target * 100));
          const barColor = pct >= 100 ? '#16a34a' : pct >= 50 ? '#ca8a04' : '#ea580c';
          const statusBadge = t._emoji ? `<span style="font-size:1.2rem;flex-shrink:0">${t._emoji}</span>` : '';
          let daysBadge = '';
          if (t.dueDate) {
            const days = Math.ceil((new Date(t.dueDate) - new Date(today_str)) / 86400000);
            const dayLabel = days < 0 ? `${Math.abs(days)}j de retard` : days === 0 ? "Aujourd'hui" : days === 1 ? 'demain' : `dans ${days}j`;
            const dayColor = days < 0 ? '#dc2626' : days <= 7 ? '#ea580c' : days <= 30 ? '#ca8a04' : '#16a34a';
            const dateLabel = new Date(t.dueDate).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'});
            daysBadge = `<span class="dash-task-date">${dateLabel}</span><span class="dash-days-badge" style="color:${dayColor};background:${dayColor}1a">${dayLabel}</span>`;
          }
          return `
          <div class="dash-task-row" style="cursor:pointer" onclick="switchPage('prototypes');openDetail('prototype','${t._id}')">
            <div style="flex:1;display:flex;align-items:center;gap:.5rem;min-width:0">
              ${statusBadge}<span class="dash-task-text"><strong>${esc(t._name)}</strong> — ${esc(t.text)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:.5rem;flex-shrink:0">
              <div style="width:80px;height:6px;background:var(--border-input);border-radius:3px;overflow:hidden">
                <div style="width:${pct}%;height:100%;background:${barColor};border-radius:3px;transition:width .3s"></div>
              </div>
              <span style="font-size:.8rem;font-weight:600;color:${barColor};white-space:nowrap">${cur}/${target}</span>
              ${daysBadge}
            </div>
          </div>`;
        }).join('')}
      </div>` : ''}

      ${(() => {
        const upcomingFests = [...state.festivals]
          .filter(f => f.dateStart && f.dateStart > today_str)
          .sort((a,b) => a.dateStart.localeCompare(b.dateStart))
          .slice(0, 5);
        if (!upcomingFests.length) return `<div class="dash-section" style="flex:1;min-width:0"><p style="color:var(--text-500);font-size:.875rem">🎪 Aucun festival à venir.</p></div>`;
        return `<div class="dash-section" style="flex:1;min-width:0">
          <div class="dash-section-title">🎪 Festivals à venir</div>
          ${upcomingFests.map(f => {
            const days = Math.ceil((new Date(f.dateStart) - new Date(today_str)) / 86400000);
            const dayLabel = days === 1 ? 'demain' : `dans ${days} j`;
            const dayColor = days <= 7 ? '#ea580c' : days <= 30 ? '#ca8a04' : '#16a34a';
            const dateLabel = new Date(f.dateStart).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'});
            return `<div class="dash-task-row" onclick="switchPage('festivals');openFestivalDetail('${f.id}')">
              <span class="badge badge-fest-${f.category}" style="font-size:.7rem">${FEST_ICONS[f.category]||'🎪'} ${esc(FEST_LABELS[f.category]||'')}</span>
              <span class="dash-task-text">${esc(f.name)}</span>
              ${f.city ? `<span class="dash-task-source">📍 ${esc(f.city)}</span>` : ''}
              <span class="dash-task-date">${dateLabel}</span>
              <span class="dash-days-badge" style="color:${dayColor};background:${dayColor}1a">${dayLabel}</span>
            </div>`;
          }).join('')}
        </div>`;
      })()}
    </div>

    <div class="dash-cols">
      <div class="dash-section" style="flex:1;min-width:0">
        <div class="dash-section-title">📅 Derniers échanges</div>
        ${allExchanges.length === 0 ? `<p style="color:var(--text-500);font-size:.875rem">Aucun échange enregistré.</p>` :
          allExchanges.map(e => `
          <div class="dash-task-row" onclick="openDetail('contact','${e._id}')">
            <span class="badge" style="background:var(--bg);border:1px solid var(--border-input);font-size:.7rem">${EXCH_EMOJI[e.type]||'📝'} ${esc(e.type||'autre')}</span>
            <span class="dash-task-text agenda-contact-name badge-${e._cat}">${esc(e._name)}</span>
            <span class="dash-task-date">${e.date}</span>
          </div>`).join('')}
      </div>

      <div class="dash-section" style="flex:1;min-width:0">
        <div class="dash-section-title">🎮 Jeux à suivre</div>
        ${topProtos.length === 0 ? `<p style="color:var(--text-500);font-size:.875rem">Aucun prototype.</p>` :
          topProtos.map(p => `
          <div class="dash-task-row" onclick="openDetail('prototype','${p.id}')">
            <span class="badge badge-${p.status}" style="font-size:.7rem">${PROTO_ICONS[p.status]||'🎮'} ${esc(STATUS_LABELS[p.status]||p.status)}</span>
            <span class="dash-task-text">${esc(p.title)}</span>
            <span class="dash-task-date">${'⭐'.repeat(p.interest||3)}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

// ═══════════════════════════════════════════════════
// FILTER + SORT
// ═══════════════════════════════════════════════════
function filteredContacts() {
  let list = [...state.contacts];
  const q = state.contactsSearch.toLowerCase().trim();
  if (q) list = list.filter(c =>
    c.name.toLowerCase().includes(q) ||
    (c.company || '').toLowerCase().includes(q) ||
    (c.email   || '').toLowerCase().includes(q)
  );
  if (state.contactsCat) list = list.filter(c => c.category === state.contactsCat);
  if (state.contactsFavoriteOnly) list = list.filter(c => c.favorite);
  if (state.contactsUrgency === 'none') {
    list = list.filter(c => !(c.tasks || []).some(t => !t.done));
  } else if (state.contactsUrgency) {
    list = list.filter(c => getTopUrgency(c) === state.contactsUrgency);
  }
  list.sort((a, b) => {
    let cmp = 0;
    switch (state.contactsSort) {
      case 'name':        cmp = a.name.localeCompare(b.name, 'fr'); break;
      case 'category': {
        cmp = a.category.localeCompare(b.category, 'fr');
        if (cmp === 0) {
          const da = (a.exchanges || []).map(e => e.date).filter(Boolean).sort().pop() || '';
          const db = (b.exchanges || []).map(e => e.date).filter(Boolean).sort().pop() || '';
          // most recent first; contacts with no exchange go last
          if (da && db) cmp = db.localeCompare(da);
          else if (da)  cmp = -1;
          else if (db)  cmp = 1;
          else          cmp = a.name.localeCompare(b.name, 'fr');
        }
        break;
      }
      case 'company':     cmp = (a.company||'').localeCompare(b.company||'', 'fr'); break;
      case 'lastMeeting': cmp = (a.lastMeeting||'').localeCompare(b.lastMeeting||''); break;
      case 'urgency': {
        const ua = getTopTask(a) ? URGENCY_ORDER[getTopUrgency(a)] : 99;
        const ub = getTopTask(b) ? URGENCY_ORDER[getTopUrgency(b)] : 99;
        cmp = ua - ub; break;
      }
    }
    return state.contactsSortAsc ? cmp : -cmp;
  });
  return list;
}

function filteredPrototypes() {
  let list = [...state.prototypes];
  const q = state.prototypesSearch.toLowerCase().trim();
  if (q) list = list.filter(p =>
    p.title.toLowerCase().includes(q) ||
    (p.genre       || '').toLowerCase().includes(q) ||
    (p.description || '').toLowerCase().includes(q)
  );
  if (state.prototypesStatus) list = list.filter(p => p.status === state.prototypesStatus);
  if (state.prototypesInterest) list = list.filter(p => String(p.interest||3) === state.prototypesInterest);
  if (state.prototypesTag) {
    const tagQ = state.prototypesTag.toLowerCase().trim();
    list = list.filter(p => (p.tags || []).some(t => t.toLowerCase().includes(tagQ)));
  }
  list.sort((a, b) => {
    let cmp = 0;
    switch (state.prototypesSort) {
      case 'title':     cmp = a.title.localeCompare(b.title, 'fr'); break;
      case 'status': {
        const sa = STATUS_ORDER.indexOf(a.status); const sb = STATUS_ORDER.indexOf(b.status);
        cmp = (sa === -1 ? 99 : sa) - (sb === -1 ? 99 : sb); break;
      }
      case 'createdAt': cmp = (a.createdAt||'').localeCompare(b.createdAt||''); break;
      case 'interest':  cmp = (b.interest||3) - (a.interest||3); break;
      case 'urgency': {
        const ua = getTopTask(a) ? URGENCY_ORDER[getTopUrgency(a)] : 99;
        const ub = getTopTask(b) ? URGENCY_ORDER[getTopUrgency(b)] : 99;
        cmp = ua - ub; break;
      }
    }
    return state.prototypesSortAsc ? cmp : -cmp;
  });
  return list;
}

function sortContactsBy(field) {
  if (state.contactsSort === field) state.contactsSortAsc = !state.contactsSortAsc;
  else { state.contactsSort = field; state.contactsSortAsc = true; }
  document.getElementById('contacts-sort').value = field;
  const ico = document.getElementById('contacts-sort-icon');
  ico.innerHTML = state.contactsSortAsc ? ICONS.chevUp : ICONS.chevDown;
  renderContacts();
}
function sortPrototypesBy(field) {
  if (state.prototypesSort === field) state.prototypesSortAsc = !state.prototypesSortAsc;
  else { state.prototypesSort = field; state.prototypesSortAsc = true; }
  document.getElementById('prototypes-sort').value = field;
  const ico = document.getElementById('prototypes-sort-icon');
  ico.innerHTML = state.prototypesSortAsc ? ICONS.chevUp : ICONS.chevDown;
  renderPrototypes();
}

// ═══════════════════════════════════════════════════
// ZOOM
// ═══════════════════════════════════════════════════
function zoomPage(page, delta) {
  const key  = page + 'Zoom';
  const slider = document.getElementById(page + '-zoom');
  state[key] = Math.max(0, Math.min(4, state[key] + delta));
  slider.value = state[key];
  if (page === 'contacts')   renderContacts();
  if (page === 'prototypes') renderPrototypes();
  if (page === 'festivals')  renderFestivals();
}

// ═══════════════════════════════════════════════════
// RENDER — CONTACTS STATS
// ═══════════════════════════════════════════════════
function renderContactsStats() {
  const el = document.getElementById('contacts-stats');
  if (!el) return;
  const all = state.contacts;
  if (!all.length) { el.innerHTML = ''; return; }

  const total    = all.length;
  const favorites= all.filter(c => c.favorite).length;
  const withTasks= all.filter(c => (c.tasks||[]).some(t => !t.done)).length;

  // Par catégorie
  const catIcons = { auteur:'✍️', illustrateur:'🎨', editeur:'📚', distributeur:'🚚', fabricant:'🏭' };

  // Par statut
  const statusIcons = { actif:'✅', inactif:'💤', prospect:'🔍' };
  const statusLabels = { actif:'Actif', inactif:'Inactif', prospect:'Prospect' };

  // Échanges total
  const totalExchanges = all.reduce((s, c) => s + (c.exchanges||[]).length, 0);

  el.innerHTML = `
    <div class="fstat-block">
      <div class="fstat-title">Contacts</div>
      <div class="fstat-big">${total}</div>
      ${favorites ? `<div class="fstat-sub">⭐ ${favorites} favori${favorites > 1 ? 's' : ''}</div>` : ''}
    </div>

    <div class="fstat-block">
      <div class="fstat-title">Par catégorie</div>
      ${Object.entries(CAT_LABELS).map(([cat, label]) => {
        const n = all.filter(c => c.category === cat).length;
        if (!n) return '';
        return `<div class="fstat-row"><span>${catIcons[cat]||'👤'} ${label}</span><span class="fstat-row-val">${n}</span></div>`;
      }).join('')}
    </div>

    <div class="fstat-block">
      <div class="fstat-title">Par statut</div>
      ${['actif','prospect','inactif'].map(s => {
        const n = all.filter(c => (c.status||'actif') === s).length;
        if (!n) return '';
        return `<div class="fstat-row"><span>${statusIcons[s]} ${statusLabels[s]}</span><span class="fstat-row-val">${n}</span></div>`;
      }).join('')}
    </div>

    ${totalExchanges > 0 ? `
    <div class="fstat-block">
      <div class="fstat-title">Activité</div>
      <div class="fstat-row"><span>📝 Échanges</span><span class="fstat-row-val">${totalExchanges}</span></div>
      ${withTasks ? `<div class="fstat-row"><span>📌 Avec tâches</span><span class="fstat-row-val">${withTasks}</span></div>` : ''}
    </div>` : ''}
  `;
}

// ═══════════════════════════════════════════════════
// RENDER — CONTACTS
// ═══════════════════════════════════════════════════
function renderContacts() {
  renderContactsStats();
  const list    = filteredContacts();
  const gridEl  = document.getElementById('contacts-grid');
  const listEl  = document.getElementById('contacts-list');
  const kanbanEl= document.getElementById('contacts-kanban');
  const empty   = document.getElementById('contacts-empty');

  document.getElementById('nav-contacts-count').textContent = state.contacts.length;
  document.getElementById('contacts-count').textContent =
    `${list.length} contact${list.length !== 1 ? 's' : ''}`;

  updateFilterCount('contacts');

  // helper: hide all three
  const hideAll = () => {
    gridEl.style.display = 'none';
    listEl.style.display = 'none';
    kanbanEl.style.display = 'none';
  };

  if (list.length === 0) {
    hideAll();
    gridEl.innerHTML = ''; listEl.innerHTML = ''; kanbanEl.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  if (state.contactsView === 'list') {
    hideAll();
    listEl.style.display = '';
    listEl.innerHTML = buildContactsTable(list);
  } else if (state.contactsView === 'kanban') {
    hideAll();
    kanbanEl.style.display = '';
    kanbanEl.innerHTML = buildContactsKanban(list);
  } else {
    hideAll();
    gridEl.style.display = '';
    gridEl.dataset.zoom = state.contactsZoom;
    if (state.contactsSort === 'category') {
      let html = '';
      let curCat = null;
      for (const c of list) {
        if (c.category !== curCat) {
          curCat = c.category;
          html += `<div class="cat-group-header">${CAT_LABELS[curCat] || curCat}</div>`;
        }
        html += contactCard(c, state.contactsZoom);
      }
      gridEl.innerHTML = html;
    } else {
      gridEl.innerHTML = list.map(c => contactCard(c, state.contactsZoom)).join('');
    }
  }
}

/* ── Contacts kanban ── */
function buildContactsKanban(list) {
  const cats = Object.keys(CAT_LABELS);
  return `<div class="kanban-board">${cats.map(cat => {
    const cols = list.filter(c => c.category === cat);
    return `<div class="kanban-col">
      <div class="kanban-col-header">
        ${CAT_LABELS[cat]}
        <span class="badge badge-${cat}" style="font-size:.65rem">${cols.length}</span>
      </div>
      ${cols.length === 0 ? '<div class="kanban-empty">—</div>' :
        cols.map(c => {
          const topTask = getTopTask(c);
          const urg = topTask ? (topTask.urgency || 'normal') : null;
              const urgBadge = urg ? `<span class="badge badge-urgence-${urg}" style="font-size:.65rem">${URGENCY_EMOJI[urg]}</span>` : '';
          return `<div class="kanban-card" onclick="openDetail('contact','${c.id}')">
            <div class="kanban-card-name">${esc(c.name)}</div>
            ${c.company ? `<div class="kanban-card-sub">${esc(c.company)}</div>` : ''}
            <div class="kanban-card-foot">${urgBadge}</div>
          </div>`;
        }).join('')}
    </div>`;
  }).join('')}</div>`;
}

/* ── Contact card ── */
function contactCard(c, zoom) {
  const isMin = zoom <= 1;
  const cat   = c.category || 'auteur';
  const topTask = getTopTask(c);
  const urg   = topTask ? (topTask.urgency || 'normal') : 'normal';
  const hasUrgentTask = topTask && (urg === 'urgent' || urg === 'critique');

  const mediaContent = c.photo
    ? `<img src="${esc(c.photo)}" class="card-photo" alt="" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.parentElement.querySelector('.card-avatar-fallback').style.display=''" />
       <div class="card-avatar card-avatar-${cat} card-avatar-fallback" style="display:none">${initials(c.name)}</div>`
    : `<div class="card-avatar card-avatar-${cat}">${initials(c.name)}</div>`;

  // Top-left: company logo if set, otherwise category letter badge
  const badge = c.companyLogo
    ? `<img src="${esc(c.companyLogo)}" class="card-company-logo"
        alt="${esc(c.company||'')}"
        onerror="this.style.display='none'" />`
    : `<span class="badge badge-${cat} card-badge"
        style="${isMin ? 'font-size:.6rem;padding:.1rem .35rem' : ''}">${
          isMin ? (cat.charAt(0)||'?').toUpperCase() : esc(cat)
        }</span>`;

  // Urgency bubble — only for urgent/critique
  const urgEmoji = (topTask && (urg === 'urgent' || urg === 'critique'))
    ? `<span class="card-urg-emoji" data-urg="${urg}" title="Tâche ${urg}">${URGENCY_EMOJI[urg] || ''}</span>`
    : '';

  // Favorite star button
  const favBtn = `<button class="card-fav-btn${c.favorite ? ' active' : ''}"
    onclick="event.stopPropagation();toggleFavorite('${c.id}')" title="${c.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${c.favorite ? '⭐' : '☆'}</button>`;

  // Video badge
  const videoBadge = (c.videos||[]).length > 0
    ? `<span class="card-video-badge">🎬 ${c.videos.length}</span>` : '';

  const extLink = !isMin && c.website
    ? `<a class="card-ext-link" href="${esc(c.website)}" target="_blank" rel="noopener"
         onclick="event.stopPropagation()">${ICONS.extLink}</a>`
    : '';

  const editBtn = `<button class="card-edit-btn"
    onclick="event.stopPropagation();editContact('${c.id}')">${ICONS.pencil}</button>`;

  // Reminder badge (no exchange in 60 days)
  const reminderBadge = (() => {
    if (isMin || !c.exchanges || !c.exchanges.length) return '';
    const lastDate = c.exchanges.reduce((max, e) => e.date > max ? e.date : max, '');
    if (!lastDate) return '';
    const daysDiff = Math.floor((Date.now() - new Date(lastDate)) / 86400000);
    return daysDiff >= 60 ? `<span class="reminder-badge">🔔 Relancer</span>` : '';
  })();

  // Social icons
  const socialsHtml = !isMin && (c.socials || []).length > 0
    ? `<div class="social-links">${(c.socials||[]).map(s =>
        `<a class="social-icon" href="${esc(s.url)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(s.type)}</a>`
      ).join('')}</div>`
    : '';

  // Show urgency pill instead of status
  const pendingCount = (c.tasks || []).filter(t => !t.done).length;
  const urgPill = topTask
    ? `<span class="badge badge-urgence-${urg}" style="${isMin ? 'font-size:.6rem' : ''}">${
        isMin ? urg[0].toUpperCase() : esc(urg)
      }</span>${pendingCount > 1 ? `<span class="card-task-count">${pendingCount}</span>` : ''}`
    : '';

  // Name always visible — compact at min zoom, full body otherwise
  let body = `<div class="card-min-name" title="${esc(c.name)}">${esc(c.name)}</div>`;
  if (!isMin) {
    const subtitle = c.company || c.email || '';
    let extra = '';
    if (zoom >= 3) {
      if (c.email) extra += `<p class="card-detail-row">${ICONS.mail} ${esc(c.email)}<button class="btn-copy-inline" onclick="event.stopPropagation();copyText('${esc(c.email)}',this)" title="Copier l'email">⎘</button></p>`;
      if (c.phone) extra += `<p class="card-detail-row">${ICONS.phone} ${esc(c.phone)}</p>`;
    }
    if (zoom >= 4 && topTask) {
      extra += `<div class="card-task">
        <span class="badge badge-urgence-${urg}">${esc(urg)}</span>
        <span class="card-task-text">${esc(topTask.text)}</span>
      </div>`;
    }
    body = `<div class="card-body">
      <h3 class="card-title">${esc(c.name)}</h3>
      ${subtitle ? `<p class="card-subtitle">${esc(subtitle)}</p>` : ''}
      ${extra}
      ${socialsHtml}
      <div class="card-footer">
        ${urgPill}
        ${reminderBadge}
      </div>
    </div>`;
  }

  const allDone = (c.tasks||[]).every(t => t.done);
  const allDoneEmoji = allDone ? `<span class="card-urg-emoji" data-urg="done" title="Toutes les tâches terminées">✅</span>` : '';

  return `<div class="card card-hover card-bg-${cat}"
    onclick="openDetail('contact','${c.id}')" title="${esc(c.name)}">
    <div class="card-media card-media-${cat}">
      ${favBtn}${mediaContent}${badge}${urgEmoji}${allDoneEmoji}${videoBadge}${extLink}${editBtn}
    </div>
    ${body}
  </div>`;
}

/* ── Contacts list table ── */
function buildContactsTable(list) {
  const sort = state.contactsSort;
  const asc  = state.contactsSortAsc;
  const th = (field, label, w) => {
    const active = sort === field;
    const arrow  = active ? (asc ? '↑' : '↓') : '↕';
    return `<th class="sortable${active ? ' th-active' : ''}" ${w ? `style="width:${w}"` : ''}
      onclick="sortContactsBy('${field}')">${label}<span class="sort-arrow">${arrow}</span></th>`;
  };
  return `<div class="list-table-wrap"><table class="list-table">
    <thead><tr>
      <th class="col-avatar"></th>
      ${th('name',        'Nom',         '22%')}
      ${th('category',    'Catégorie',   '13%')}
      ${th('urgency',     'Tâche',       '18%')}
      ${th('company',     'Entreprise',  '15%')}
      <th>Email</th>
      ${th('lastMeeting', 'Dernière rencontre', '13%')}
      <th class="col-actions"></th>
    </tr></thead>
    <tbody>${(() => {
      let rows = '';
      let curCat = null;
      for (const c of list) {
        if (sort === 'category' && c.category !== curCat) {
          curCat = c.category;
          rows += `<tr class="cat-group-row"><td colspan="8">${CAT_LABELS[curCat] || curCat}</td></tr>`;
        }
        const topTask = getTopTask(c);
        const urg = topTask ? (topTask.urgency || 'normal') : 'normal';
        const pendingCount = (c.tasks || []).filter(t => !t.done).length;
        const avatar = c.photo
          ? `<img src="${esc(c.photo)}" class="list-photo" alt="" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display=''" />
             <div class="list-avatar list-avatar-${c.category}" style="display:none">${initials(c.name)}</div>`
          : `<div class="list-avatar list-avatar-${c.category}">${initials(c.name)}</div>`;
        const taskCell = topTask
          ? `<div class="td-task">
              <span style="flex-shrink:0">${URGENCY_EMOJI[urg]||''}</span>
              <span class="badge badge-urgence-${urg}" style="flex-shrink:0">${esc(urg)}</span>
              <span class="td-task-text">${esc(topTask.text)}</span>
              ${pendingCount > 1 ? `<span class="card-task-count">${pendingCount}</span>` : ''}
            </div>` : '';
        const meetDate = c.lastMeeting
          ? new Date(c.lastMeeting).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'2-digit' })
          : '';
        rows += `<tr onclick="openDetail('contact','${c.id}')">
          <td class="col-avatar">${avatar}</td>
          <td class="td-fw">${esc(c.name)}</td>
          <td><span class="badge badge-${c.category}">${esc(c.category)}</span></td>
          <td>${taskCell}</td>
          <td class="td-muted">${esc(c.company||'')}</td>
          <td class="td-muted">${esc(c.email||'')}</td>
          <td class="td-muted">${meetDate}</td>
          <td class="col-actions">
            <button class="list-row-btn" onclick="event.stopPropagation();editContact('${c.id}')"
              title="Modifier">${ICONS.pencil}</button>
          </td>
        </tr>`;
      }
      return rows;
    })()}</tbody>
  </table></div>`;
}

// ═══════════════════════════════════════════════════
// RENDER — PROTOTYPES STATS
// ═══════════════════════════════════════════════════
function renderPrototypesStats() {
  const el = document.getElementById('prototypes-stats');
  if (!el) return;
  const all = state.prototypes;
  if (!all.length) { el.innerHTML = ''; return; }

  const total    = all.length;
  const withTasks= all.filter(p => (p.tasks||[]).some(t => !t.done)).length;

  // Intérêt moyen (hors sans intérêt défini)
  const withInterest = all.filter(p => p.interest);
  const avgInterest  = withInterest.length
    ? (withInterest.reduce((s, p) => s + p.interest, 0) / withInterest.length).toFixed(1)
    : null;

  // Contacts liés
  const contactIds = new Set(all.flatMap(p => (p.contactLinks||[]).map(l => l.contactId)));

  // Par statut (dans l'ordre)
  const statusCounts = STATUS_ORDER.map(s => ({
    s, n: all.filter(p => p.status === s).length
  })).filter(x => x.n > 0);

  // Sessions test — jeux avec tâches test_counter, triés par statut : En développement, À tester, À imprimer
  const TEST_STATUS_ORDER_STATS = { développement: 0, tester: 1, imprimer: 2 };
  const testProtos = all
    .filter(p => (p.tasks||[]).some(t => t.subtype === 'test_counter'))
    .map(p => {
      const sc = (p.testSessions||[]).filter(s => s.date||s.comments||s.rating).length;
      const counterTask = (p.tasks||[]).find(t => t.subtype === 'test_counter');
      const target = counterTask ? (counterTask.targetCount || 1) : 1;
      return { title: p.title, count: sc, target, status: p.status };
    })
    .sort((a, b) => {
      const sa = TEST_STATUS_ORDER_STATS[a.status] ?? 99;
      const sb = TEST_STATUS_ORDER_STATS[b.status] ?? 99;
      return sa - sb;
    });
  const totalTests = testProtos.reduce((s, p) => s + p.count, 0);

  el.innerHTML = `
    <div class="fstat-block">
      <div class="fstat-title">Jeux</div>
      <div class="fstat-big">${total}</div>
      ${avgInterest ? `<div class="fstat-sub">Intérêt moy. ${'⭐'.repeat(Math.round(avgInterest))} ${avgInterest}/5</div>` : ''}
    </div>

    <div class="fstat-block">
      <div class="fstat-title">Par statut</div>
      ${statusCounts.map(({s, n}) =>
        `<div class="fstat-row"><span>${PROTO_ICONS[s]||''} ${STATUS_LABELS[s]||s}</span><span class="fstat-row-val">${n}</span></div>`
      ).join('')}
    </div>

    ${testProtos.length ? `
    <div class="fstat-block">
      <div class="fstat-title">🧪 Sessions test</div>
      ${testProtos.map(p => {
        const pct = Math.min(100, Math.round(p.count / p.target * 100));
        const barColor = pct >= 100 ? '#16a34a' : pct >= 50 ? '#ca8a04' : '#ea580c';
        const sIcon = p.status ? (PROTO_ICONS[p.status]||'') : '';
        return `<div class="fstat-row" style="flex-wrap:wrap;gap:.2rem .5rem">
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(STATUS_LABELS[p.status]||p.status||'')}">${sIcon ? sIcon+' ' : ''}${esc(p.title)}</span>
          <div style="display:flex;align-items:center;gap:.35rem;flex-shrink:0">
            <div style="width:52px;height:5px;background:var(--border-input);border-radius:3px;overflow:hidden">
              <div style="width:${pct}%;height:100%;background:${barColor};border-radius:3px"></div>
            </div>
            <span class="fstat-row-val" style="color:${barColor}">${p.count}/${p.target}</span>
          </div>
        </div>`;
      }).join('')}
      ${totalTests ? `<div class="fstat-total-row"><span>Total</span><span>${totalTests}</span></div>` : ''}
    </div>` : ''}

    <div class="fstat-block">
      <div class="fstat-title">Liens</div>
      ${contactIds.size ? `<div class="fstat-row"><span>🤝 Contacts liés</span><span class="fstat-row-val">${contactIds.size}</span></div>` : ''}
      ${withTasks ? `<div class="fstat-row"><span>📌 Avec tâches</span><span class="fstat-row-val">${withTasks}</span></div>` : ''}
    </div>
  `;
}

// ═══════════════════════════════════════════════════
// RENDER — PROTOTYPES
// ═══════════════════════════════════════════════════
function renderPrototypes() {
  renderPrototypesStats();
  const list      = filteredPrototypes();
  const gridEl    = document.getElementById('prototypes-grid');
  const listEl    = document.getElementById('prototypes-list');
  const timelineEl= document.getElementById('prototypes-timeline');
  const empty     = document.getElementById('prototypes-empty');

  document.getElementById('nav-prototypes-count').textContent = state.prototypes.length;
  document.getElementById('prototypes-count').textContent =
    `${list.length} jeu${list.length !== 1 ? 'x' : ''}`;

  updateFilterCount('prototypes');

  const hideAll = () => {
    gridEl.style.display = 'none';
    listEl.style.display = 'none';
    timelineEl.style.display = 'none';
  };

  if (list.length === 0) {
    hideAll();
    gridEl.innerHTML = ''; listEl.innerHTML = ''; timelineEl.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  if (state.prototypesView === 'list') {
    hideAll();
    listEl.style.display = '';
    listEl.innerHTML = buildPrototypesTable(list);
  } else if (state.prototypesView === 'timeline') {
    hideAll();
    timelineEl.style.display = '';
    timelineEl.innerHTML = buildPrototypesTimeline(list);
  } else {
    hideAll();
    gridEl.style.display = '';
    gridEl.dataset.zoom = state.prototypesZoom;
    if (state.prototypesSort === 'status') {
      let html = '';
      let curStatus = null;
      for (const p of list) {
        if (p.status !== curStatus) {
          curStatus = p.status;
          const icon = PROTO_ICONS[curStatus] || '🎮';
          html += `<div class="cat-group-header">${icon} ${STATUS_LABELS[curStatus] || curStatus}</div>`;
        }
        html += prototypeCard(p, state.prototypesZoom);
      }
      gridEl.innerHTML = html;
    } else {
      gridEl.innerHTML = list.map(p => prototypeCard(p, state.prototypesZoom)).join('');
    }
  }
}

/* ── Prototypes timeline / roadmap ── */
function buildPrototypesTimeline(list) {
  return `<div class="timeline-board">${STATUS_ORDER.map(status => {
    const items = list.filter(p => p.status === status);
    const icon  = PROTO_ICONS[status] || '🎮';
    return `<div class="timeline-col">
      <div class="timeline-col-header" style="background:var(--card-media-${status},#f1f5f9)">
        <span>${icon}</span><span>${STATUS_LABELS[status] || status}</span>
        <span class="badge badge-${status}" style="font-size:.65rem;margin-left:auto">${items.length}</span>
      </div>
      ${items.length === 0 ? '<div class="timeline-empty">—</div>' :
        items.map(p => {
          const stars = '⭐'.repeat(p.interest || 3);
          const topTask = getTopTask(p);
          const urg  = topTask ? (topTask.urgency || 'normal') : null;
          const tagsHtml = (p.tags||[]).slice(0,2).map(t => `<span class="tag-chip" style="font-size:.6rem">${esc(t)}</span>`).join('');
          return `<div class="timeline-card" onclick="openDetail('prototype','${p.id}')">
            <div class="timeline-card-title">${esc(p.title)}</div>
            ${p.genre ? `<div class="timeline-card-genre">${esc(p.genre)}</div>` : ''}
            ${tagsHtml ? `<div class="tags-cloud" style="margin-top:.3rem">${tagsHtml}</div>` : ''}
            <div class="timeline-card-foot">
              <span style="font-size:.75rem;opacity:.7">${stars}</span>
              ${urg ? `<span class="badge badge-urgence-${urg}" style="font-size:.65rem">${URGENCY_EMOJI[urg]}</span>` : ''}
            </div>
          </div>`;
        }).join('')}
    </div>`;
  }).join('')}</div>`;
}

/* ── Prototype card ── */
function prototypeCard(p, zoom) {
  const isMin = zoom <= 1;
  const icon = PROTO_ICONS[p.status] || '🎮';
  const topTask = getTopTask(p);
  const urg  = topTask ? (topTask.urgency || 'normal') : 'normal';
  const stars = '⭐'.repeat(p.interest || 3);
  const hasUrgentTask = topTask && (urg === 'urgent' || urg === 'critique');

  const statusLabel = STATUS_LABELS[p.status] || p.status;
  const badge = isMin
    ? `<span class="badge badge-${p.status} card-badge" style="font-size:.6rem;padding:.1rem .35rem">${icon}</span>`
    : `<span class="badge badge-${p.status} card-badge">${icon} ${esc(statusLabel)}</span>`;

  const editBtn = `<button class="card-edit-btn" ${isMin ? 'style="padding:.2rem"' : ''}
    onclick="event.stopPropagation();editPrototype('${p.id}')" title="Modifier">${ICONS.pencil}</button>`;

  const displayIcon = p.emoji || icon;
  const mediaContent = p.photo
    ? `<img src="${esc(p.photo)}" class="card-photo" alt="" />`
    : `<span class="card-game-icon">${displayIcon}</span>`;

  const urgEmoji = (topTask && (urg === 'urgent' || urg === 'critique'))
    ? `<span class="card-urg-emoji" data-urg="${urg}" title="Tâche ${urg}">${URGENCY_EMOJI[urg] || ''}</span>`
    : '';

  const pVideoBadge = (p.videos||[]).length > 0
    ? `<span class="card-video-badge">🎬 ${p.videos.length}</span>` : '';

  // Title always visible
  let body = `<div class="card-min-name" title="${esc(p.title)}">${esc(p.title)}</div>`;
  if (!isMin) {
    let chips = '';
    if (zoom >= 3) {
      if (p.players)  chips += `<span class="spec-chip">${ICONS.users} ${esc(p.players)}</span>`;
      if (p.duration) chips += `<span class="spec-chip">${ICONS.clock} ${esc(p.duration)}</span>`;
    }
    const pendingCount = (p.tasks || []).filter(t => !t.done).length;
    const urgPill = topTask
      ? `<span class="badge badge-urgence-${urg}" style="font-size:.65rem">${esc(zoom >= 3 ? urg : urg[0].toUpperCase())}</span>${pendingCount > 1 ? `<span class="card-task-count">${pendingCount}</span>` : ''}`
      : '';
    const tagsHtml = (p.tags||[]).slice(0,3).map(t => `<span class="tag-chip">${esc(t)}</span>`).join('');
    body = `<div class="card-body">
      <h3 class="card-title">${esc(p.title)}</h3>
      ${p.genre ? `<p class="card-subtitle">${esc(p.genre)}</p>` : ''}
      ${chips ? `<div class="card-specs">${chips}</div>` : ''}
      ${tagsHtml && zoom >= 3 ? `<div class="tags-cloud">${tagsHtml}</div>` : ''}
      <div class="card-footer">
        <span style="font-size:.75rem;opacity:.7">${stars}</span>
        ${urgPill}
      </div>
    </div>`;
  }

  const allDoneP = (p.tasks||[]).length > 0 && (p.tasks||[]).every(t => t.done);
  const allDoneEmoji = allDoneP ? `<span class="card-urg-emoji" data-urg="done" title="Toutes les tâches terminées">✅</span>` : '';

  const compareCheck = state.compareMode
    ? `<input type="checkbox" class="card-compare-check"
        ${state.selectedForCompare.includes(p.id) ? 'checked' : ''}
        onclick="event.stopPropagation();toggleCompareSelect('${p.id}',this)" />`
    : '';

  return `<div class="card card-hover"
    onclick="${state.compareMode ? '' : `openDetail('prototype','${p.id}')`}" title="${esc(p.title)}" style="${state.compareMode ? 'cursor:default' : ''}">
    <div class="card-media card-media-${p.status}">
      ${compareCheck}${mediaContent}${badge}${urgEmoji}${allDoneEmoji}${pVideoBadge}${editBtn}
    </div>
    ${body}
  </div>`;
}

/* ── Prototypes list table ── */
function buildPrototypesTable(list) {
  const sort = state.prototypesSort;
  const asc  = state.prototypesSortAsc;
  const th = (field, label, w) => {
    const active = sort === field;
    const arrow  = active ? (asc ? '↑' : '↓') : '↕';
    return `<th class="sortable${active ? ' th-active' : ''}" ${w ? `style="width:${w}"` : ''}
      onclick="sortPrototypesBy('${field}')">${label}<span class="sort-arrow">${arrow}</span></th>`;
  };
  return `<div class="list-table-wrap"><table class="list-table">
    <thead><tr>
      <th class="col-avatar"></th>
      ${th('title',    'Titre',    '25%')}
      ${th('status',   'Statut',   '13%')}
      ${th('interest', 'Intérêt',  '11%')}
      ${th('urgency',  'Tâche',    '18%')}
      <th>Genre</th><th>Joueurs</th>
      ${th('createdAt', 'Ajouté',  '9%')}
      <th class="col-actions"></th>
    </tr></thead>
    <tbody>${list.map(p => {
      const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'2-digit' }) : '';
      const topTask = getTopTask(p);
      const urg  = topTask ? (topTask.urgency || 'normal') : 'normal';
      const pendingCount = (p.tasks || []).filter(t => !t.done).length;
      const _pSC = (p.testSessions||[]).filter(s => s.date||s.comments||s.rating).length;
      const taskCell = topTask
        ? `<div class="td-task">
            <span class="badge badge-urgence-${urg}" style="flex-shrink:0">${esc(urg)}</span>
            <span class="td-task-text">${esc(taskLabel(topTask, _pSC))}</span>
            ${pendingCount > 1 ? `<span class="card-task-count">${pendingCount}</span>` : ''}
          </div>` : '';
      return `<tr onclick="openDetail('prototype','${p.id}')">
        <td class="col-avatar"><span class="list-proto-icon">${p.emoji || PROTO_ICONS[p.status]||'🎮'}</span></td>
        <td class="td-fw">${esc(p.title)}</td>
        <td><span class="badge badge-${p.status}">${PROTO_ICONS[p.status]||'🎮'} ${esc(STATUS_LABELS[p.status]||p.status)}</span></td>
        <td style="font-size:.85rem">${'⭐'.repeat(p.interest||3)}</td>
        <td>${taskCell}</td>
        <td class="td-muted">${esc(p.genre||'')}</td>
        <td class="td-muted">${esc(p.players||'')}</td>
        <td class="td-muted">${date}</td>
        <td class="col-actions">
          <button class="list-row-btn" onclick="event.stopPropagation();editPrototype('${p.id}')"
            title="Modifier">${ICONS.pencil}</button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ═══════════════════════════════════════════════════
// RENDER — TASKS STATS
// ═══════════════════════════════════════════════════
function renderTasksStats(allTasks) {
  const el = document.getElementById('tasks-stats');
  if (!el) return;
  if (!allTasks.length) { el.innerHTML = ''; return; }

  const total   = allTasks.length;
  const pending = allTasks.filter(t => !t.done).length;
  const done    = allTasks.filter(t => t.done).length;
  const todayStr = today();
  const overdue = allTasks.filter(t => !t.done && t.dueDate && t.dueDate < todayStr).length;

  // Par urgence (tâches en cours uniquement)
  const urgLevels = ['critique', 'urgent', 'normal', 'faible'];
  const urgLabels = { critique: '🚨 Critique', urgent: '⚠️ Urgent', normal: '📌 Normal', faible: '💤 Faible' };
  const urgCounts = {};
  urgLevels.forEach(u => { urgCounts[u] = allTasks.filter(t => !t.done && (t.urgency||'normal') === u).length; });

  // Par source
  const srcCounts = {
    contact:    allTasks.filter(t => t.type === 'contact').length,
    prototype:  allTasks.filter(t => t.type === 'prototype').length,
    festival:   allTasks.filter(t => t.type === 'festival').length,
    standalone: allTasks.filter(t => t.type === 'standalone').length,
    admin:      allTasks.filter(t => t.type === 'admin').length,
  };

  el.innerHTML = `
    <div class="fstat-block">
      <div class="fstat-title">Tâches</div>
      <div class="fstat-big">${pending}</div>
      <div class="fstat-sub">en cours · ${done} terminée${done !== 1 ? 's' : ''}</div>
      ${overdue ? `<div class="fstat-sub" style="color:var(--danger,#dc2626);margin-top:.2rem">⏰ ${overdue} en retard</div>` : ''}
    </div>

    <div class="fstat-block">
      <div class="fstat-title">Par urgence</div>
      ${urgLevels.filter(u => urgCounts[u] > 0).map(u =>
        `<div class="fstat-row"><span>${urgLabels[u]}</span><span class="fstat-row-val">${urgCounts[u]}</span></div>`
      ).join('')}
    </div>

    <div class="fstat-block">
      <div class="fstat-title">Par source</div>
      ${srcCounts.contact    ? `<div class="fstat-row"><span>👤 Contacts</span><span class="fstat-row-val">${srcCounts.contact}</span></div>` : ''}
      ${srcCounts.prototype  ? `<div class="fstat-row"><span>🎮 Jeux</span><span class="fstat-row-val">${srcCounts.prototype}</span></div>` : ''}
      ${srcCounts.festival   ? `<div class="fstat-row"><span>🎪 Festivals</span><span class="fstat-row-val">${srcCounts.festival}</span></div>` : ''}
      ${srcCounts.standalone ? `<div class="fstat-row"><span>✨ Libres</span><span class="fstat-row-val">${srcCounts.standalone}</span></div>` : ''}
      ${srcCounts.admin      ? `<div class="fstat-row"><span>🗂️ Admin</span><span class="fstat-row-val">${srcCounts.admin}</span></div>` : ''}
    </div>
  `;
}

// ═══════════════════════════════════════════════════
// RENDER — TASKS
// ═══════════════════════════════════════════════════
function renderTasks() {
  const sortBy   = document.getElementById('tasks-sort')?.value || 'urgency';
  const showDone = document.getElementById('tasks-show-done')?.checked || false;
  const listEl   = document.getElementById('tasks-list');
  const emptyEl  = document.getElementById('tasks-empty');
  const todayStr = today();

  // Gather all tasks
  let tasks = [];
  state.contacts.forEach(c => {
    (c.tasks || []).forEach(t => {
      tasks.push({ itemId: c.id, taskId: t.id, type: 'contact', name: c.name,
        category: c.category || 'auteur',
        task: t.text, urgency: t.urgency || 'normal', done: t.done || false, dueDate: t.dueDate, doneAt: t.doneAt });
    });
  });
  state.prototypes.forEach(p => {
    const sessionCount = (p.testSessions || []).filter(s => s.date || s.comments || s.rating).length;
    (p.tasks || []).forEach(t => {
      tasks.push({ itemId: p.id, taskId: t.id, type: 'prototype', name: p.title,
        category: 'prototype',
        task: t.text, urgency: t.urgency || 'normal', done: t.done || false, dueDate: t.dueDate, doneAt: t.doneAt,
        subtype: t.subtype, targetCount: t.targetCount,
        currentCount: t.subtype === 'test_counter' ? sessionCount : undefined,
        protoStatus: p.status,
      });
    });
  });
  (state.standaloneTasks || []).forEach(t => {
    tasks.push({ itemId: t.id, taskId: t.id, type: 'standalone', name: 'Tâche libre',
      category: 'standalone',
      task: t.text, urgency: t.urgency || 'normal', done: t.done || false, dueDate: t.dueDate, doneAt: t.doneAt });
  });
  (state.festivals || []).forEach(f => {
    (f.presences || []).forEach(p => {
      const ds = p.dateStart || p.date || '';
      const de = p.dateEnd || '';
      const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}) : null;
      const period = (fmt(ds) && fmt(de) && fmt(ds) !== fmt(de)) ? `${fmt(ds)} → ${fmt(de)}` : (fmt(ds) || '');
      tasks.push({ itemId: f.id, taskId: p.id, type: 'festival', name: f.name,
        category: 'festival',
        task: `Présence${period ? ' · ' + period : ''}${p.note ? ' — ' + p.note : ''}`,
        urgency: 'normal', done: p.done || false, dueDate: ds, doneAt: p.doneAt });
    });
    (f.tasks || []).forEach(t => {
      tasks.push({ itemId: f.id, taskId: t.id, type: 'festival-task', name: f.name,
        category: 'festival',
        task: t.text, urgency: t.urgency || 'normal', done: t.done || false, dueDate: t.dueDate, doneAt: t.doneAt });
    });
  });
  (state.adminCards || []).forEach(card => {
    tasks.push({ itemId: card.id, taskId: card.id, type: 'admin', name: adminCatInfo(card.category).label,
      category: 'admin',
      task: card.title, urgency: card.urgency || 'normal',
      done: isAdminCardDone(card), dueDate: adminCardDueDate(card), doneAt: null,
      _recurrence: card.recurrence });
  });

  // Stats sidebar (always on full dataset, before any filter)
  renderTasksStats(tasks);

  // Nav count: always total pending, regardless of source filter
  const totalPending = tasks.filter(t => !t.done).length;
  document.getElementById('nav-tasks-count').textContent = totalPending;

  // Source filter (state-based)
  const srcFilter = state.tasksSourceFilter || [];
  if (srcFilter.length > 0) {
    tasks = tasks.filter(t => {
      if (srcFilter.includes('contacts') && (t.type === 'contact' || t.type === 'standalone')) return true;
      if (srcFilter.includes('jeux') && t.type === 'prototype') return true;
      if (srcFilter.includes('festivals') && (t.type === 'festival' || t.type === 'festival-task')) return true;
      if (srcFilter.includes('admin') && t.type === 'admin') return true;
      return false;
    });
  }

  const total   = tasks.length;
  const pending = tasks.filter(t => !t.done).length;
  document.getElementById('tasks-count').textContent =
    `${pending} tâche${pending !== 1 ? 's' : ''} en cours${total !== pending ? ` · ${total - pending} terminée${total - pending !== 1 ? 's' : ''}` : ''}`;

  // Weekly recap
  const critCount  = tasks.filter(t => !t.done && (t.urgency === 'critique' || t.urgency === 'urgent')).length;
  const doneCount  = tasks.filter(t => t.done).length;
  const recapEl    = document.getElementById('tasks-recap-bar');
  if (recapEl) {
    recapEl.innerHTML = `<div class="tasks-recap">
      <div class="tasks-recap-stat">
        <span class="tasks-recap-num">${total}</span>
        <span class="tasks-recap-label">Total</span>
      </div>
      <div class="tasks-recap-divider"></div>
      <div class="tasks-recap-stat">
        <span class="tasks-recap-num">${pending}</span>
        <span class="tasks-recap-label">En cours</span>
      </div>
      <div class="tasks-recap-divider"></div>
      <div class="tasks-recap-stat">
        <span class="tasks-recap-num num-critique">${critCount}</span>
        <span class="tasks-recap-label">Urgentes</span>
      </div>
      <div class="tasks-recap-divider"></div>
      <div class="tasks-recap-stat">
        <span class="tasks-recap-num num-done">${doneCount}</span>
        <span class="tasks-recap-label">Terminées</span>
      </div>
    </div>`;
  }

  // Quick filter
  const filter = state.tasksFilter || 'all';
  if (filter === 'done') {
    tasks = tasks.filter(t => t.done);
  } else if (filter === 'urgent') {
    tasks = tasks.filter(t => !t.done && (t.urgency === 'critique' || t.urgency === 'urgent'));
  } else if (filter === 'tests') {
    tasks = tasks.filter(t => t.subtype === 'test_counter' && !t.done
      && t.protoStatus !== 'abandonné' && t.protoStatus !== 'non-retenu');
  } else {
    if (!showDone) tasks = tasks.filter(t => !t.done);
    tasks = tasks.filter(t => !(t.subtype === 'test_counter'
      && (t.protoStatus === 'abandonné' || t.protoStatus === 'non-retenu')));
  }

  if (tasks.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  const CAT_TASK_ORDER = ['editeur', 'distributeur', 'auteur', 'fabricant', 'illustrateur', 'prototype', 'festival', 'standalone', 'admin'];
  const CAT_TASK_LABELS = { ...CAT_LABELS, prototype: 'Prototypes', festival: 'Festivals', standalone: 'Tâches libres', admin: 'Admin' };

  // Sort
  tasks.sort((a, b) => {
    if (sortBy === 'date') {
      const da = a.dueDate || '', db = b.dueDate || '';
      if (!da && !db) return a.name.localeCompare(b.name, 'fr');
      if (!da) return 1;
      if (!db) return -1;
      return da.localeCompare(db);
    }
    if (sortBy === 'urgency')  return (URGENCY_ORDER[a.urgency] ?? 99) - (URGENCY_ORDER[b.urgency] ?? 99);
    if (sortBy === 'source')   return a.type.localeCompare(b.type) || a.name.localeCompare(b.name, 'fr');
    if (sortBy === 'category') {
      const ca = CAT_TASK_ORDER.indexOf(a.category), cb = CAT_TASK_ORDER.indexOf(b.category);
      return ca - cb || a.name.localeCompare(b.name, 'fr');
    }
    return a.name.localeCompare(b.name, 'fr');
  });

  // Group
  if (sortBy === 'urgency' && filter !== 'done') {
    const groups = {};
    tasks.forEach(t => { (groups[t.urgency] = groups[t.urgency] || []).push(t); });
    const urgOrder = ['critique', 'urgent', 'normal', 'faible'];
    listEl.innerHTML = urgOrder
      .filter(u => groups[u])
      .map(u => `
        <div class="task-group-header">
          <span class="badge badge-urgence-${u}">${u}</span>
        </div>
        ${groups[u].map(t => taskCard(t)).join('')}
      `).join('');
  } else if (sortBy === 'source') {
    // Group by source name
    const groups = {};
    tasks.forEach(t => {
      const key = `${t.type}__${t.name}__${t.itemId}`;
      (groups[key] = groups[key] || { type: t.type, name: t.name, itemId: t.itemId, tasks: [] }).tasks.push(t);
    });
    listEl.innerHTML = Object.values(groups).map(g => `
      <div class="task-source-group-header">
        <span>${g.type === 'contact' ? '👤' : (g.type === 'festival' || g.type === 'festival-task') ? '🎪' : '🎲'}</span>
        <span style="color:var(--text-700);font-size:.78rem">${esc(g.name)}</span>
      </div>
      ${g.tasks.map(t => taskCard(t)).join('')}
    `).join('');
  } else if (sortBy === 'category') {
    // Group by contact category or prototype
    const groups = {};
    tasks.forEach(t => { (groups[t.category] = groups[t.category] || []).push(t); });
    listEl.innerHTML = CAT_TASK_ORDER
      .filter(cat => groups[cat])
      .map(cat => `
        <div class="task-group-header">
          <span>${CAT_TASK_LABELS[cat] || cat}</span>
        </div>
        ${groups[cat].map(t => taskCard(t)).join('')}
      `).join('');
  } else {
    listEl.innerHTML = tasks.map(t => taskCard(t)).join('');
  }
}

function taskCard(t) {
  const typeEmoji = t.type === 'standalone' ? '📋' : t.type === 'contact' ? '👤' : (t.type === 'festival' || t.type === 'festival-task') ? '🎪' : t.type === 'admin' ? '🗂️' : '🎲';
  const dueBadge = t.dueDate
    ? `<span class="task-due task-due-editable${t.dueDate < today() ? ' overdue' : ''}" data-date="${t.dueDate}" onclick="event.stopPropagation();openTaskDatePicker(this,'${t.type}','${t.itemId}','${t.taskId}')" title="Modifier la date">${t.dueDate}</span>`
    : `<span class="task-due task-due-add" data-date="" onclick="event.stopPropagation();openTaskDatePicker(this,'${t.type}','${t.itemId}','${t.taskId}')" title="Ajouter une date">+ date</span>`;
  const doneAtBadge = (t.done && t.doneAt)
    ? `<span class="task-done-at" title="Terminée le ${new Date(t.doneAt).toLocaleString('fr-FR')}">✓ ${new Date(t.doneAt).toLocaleDateString('fr-FR', {day:'2-digit',month:'short'})}</span>`
    : '';
  const clickBody = t.type === 'standalone'
    ? `onclick="editStandaloneTask('${t.itemId}')"`
    : (t.type === 'festival' || t.type === 'festival-task')
      ? `onclick="openFestivalDetail('${t.itemId}')"`
      : t.type === 'admin'
        ? `onclick="openAdminModal('${t.itemId}')"`
        : `onclick="openDetail('${t.type}','${t.itemId}')"`;
  const delBtn = t.type === 'standalone'
    ? `<button class="task-del-btn" onclick="event.stopPropagation();deleteStandaloneTask('${t.itemId}')" title="Supprimer">✕</button>`
    : t.type === 'festival'
      ? `<button class="task-del-btn" onclick="event.stopPropagation();removeFestivalPresence('${t.itemId}','${t.taskId}')" title="Supprimer">✕</button>`
      : t.type === 'festival-task'
        ? `<button class="task-del-btn" onclick="event.stopPropagation();deleteFestivalTask('${t.itemId}','${t.taskId}')" title="Supprimer">✕</button>`
        : t.type === 'admin'
          ? `<button class="task-del-btn" onclick="event.stopPropagation();deleteAdminCard('${t.itemId}')" title="Supprimer">✕</button>`
          : '';
  const recurBadge = t._recurrence === 'monthly' ? `<span class="badge" style="background:var(--bg);border:1px solid var(--border-input);font-size:.7rem;flex-shrink:0">🔄 Mensuel</span>` : '';
  let taskTextHtml = `<span class="task-text">${esc(t.task)}</span>${recurBadge}`;
  if (t.subtype === 'test_counter' && t.targetCount) {
    const cur = t.currentCount || 0;
    const pct = Math.min(100, Math.round(cur / t.targetCount * 100));
    taskTextHtml = `<span style="display:flex;align-items:center;gap:.4rem;min-width:0;overflow:hidden">
      <span class="task-text" style="flex-shrink:0">${esc(t.task)}</span>
      <span class="test-counter-badge">${cur}/${t.targetCount}</span>
      <span class="test-counter-bar-wrap"><span class="test-counter-bar-fill" style="width:${pct}%"></span></span>
    </span>`;
  }
  return `<div class="task-card${t.done ? ' done' : ''}">
    <input type="checkbox" class="task-check" ${t.done ? 'checked' : ''}
      onclick="event.stopPropagation();toggleTaskDone('${t.type}','${t.itemId}','${t.taskId}')" />
    <div class="task-body" ${clickBody}>
      <span class="task-source">${typeEmoji} ${esc(t.name)}</span>
      ${taskTextHtml}
      <span class="task-meta">${dueBadge}${doneAtBadge}<span class="badge badge-urgence-${t.urgency}">${esc(t.urgency)}</span></span>
    </div>
    ${delBtn}
  </div>`;
}

function setTaskDone(t, done) {
  t.done = done;
  t.doneAt = done ? new Date().toISOString() : undefined;
}

function toggleTaskDone(type, itemId, taskId) {
  if (type === 'standalone') {
    const t = (state.standaloneTasks || []).find(x => x.id === itemId);
    if (t) setTaskDone(t, !t.done);
    saveState();
  } else if (type === 'contact') {
    const c = state.contacts.find(x => x.id === itemId);
    if (c) {
      const t = (c.tasks || []).find(x => x.id === taskId);
      if (t) setTaskDone(t, !t.done);
    }
    saveState();
    renderContacts();
  } else if (type === 'festival') {
    const f = state.festivals.find(x => x.id === itemId);
    if (f) {
      const pres = (f.presences || []).find(x => x.id === taskId);
      if (pres) setTaskDone(pres, !pres.done);
    }
    saveState();
    renderFestivals();
  } else if (type === 'festival-task') {
    const f = state.festivals.find(x => x.id === itemId);
    if (f) {
      const t = (f.tasks || []).find(x => x.id === taskId);
      if (t) setTaskDone(t, !t.done);
    }
    saveState();
    renderFestivals();
  } else if (type === 'admin') {
    const card = (state.adminCards || []).find(x => x.id === itemId);
    if (card) {
      if (card.recurrence === 'monthly') {
        const ym = currentYearMonth();
        const alreadyDone = (card.completionHistory || []).some(h => h.month === ym);
        if (alreadyDone) {
          card.completionHistory = card.completionHistory.filter(h => h.month !== ym);
        } else {
          if (!card.completionHistory) card.completionHistory = [];
          card.completionHistory.push({ month: ym, doneAt: new Date().toISOString() });
        }
      } else {
        card.status = card.status === 'fait' ? 'todo' : 'fait';
        if (card.status === 'fait') card.doneAt = new Date().toISOString();
        else delete card.doneAt;
      }
    }
    saveState();
    if (state.activePage === 'admin') renderAdmin();
  } else {
    const p = state.prototypes.find(x => x.id === itemId);
    if (p) {
      const t = (p.tasks || []).find(x => x.id === taskId);
      if (t) setTaskDone(t, !t.done);
    }
    saveState();
    renderPrototypes();
  }
  if (state.activePage === 'tasks') renderTasks();
  if (state.activePage === 'home') renderDashboard();
}

function openTaskDatePicker(el, type, itemId, taskId) {
  const input = document.createElement('input');
  input.type = 'date';
  input.value = el.dataset.date || '';
  input.className = 'task-date-inline-input';
  el.replaceWith(input);
  input.addEventListener('change', () => {
    setTaskDueDateInline(type, itemId, taskId, input.value || undefined);
  });
  input.addEventListener('blur', () => { if (document.contains(input)) input.remove(); });
  try { input.showPicker(); } catch(e) {}
}

function setTaskDueDateInline(type, itemId, taskId, newDate) {
  if (type === 'standalone') {
    const t = (state.standaloneTasks || []).find(x => x.id === itemId);
    if (t) t.dueDate = newDate;
  } else if (type === 'contact') {
    const c = state.contacts.find(x => x.id === itemId);
    if (c) { const t = (c.tasks || []).find(x => x.id === taskId); if (t) t.dueDate = newDate; }
  } else if (type === 'festival') {
    const f = state.festivals.find(x => x.id === itemId);
    if (f) { const p = (f.presences || []).find(x => x.id === taskId); if (p) p.dateStart = newDate; }
  } else if (type === 'festival-task') {
    const f = state.festivals.find(x => x.id === itemId);
    if (f) { const t = (f.tasks || []).find(x => x.id === taskId); if (t) t.dueDate = newDate; }
  } else if (type === 'admin') {
    const card = (state.adminCards || []).find(x => x.id === itemId);
    if (card && card.recurrence !== 'monthly') card.dueDate = newDate;
  } else {
    const p = state.prototypes.find(x => x.id === itemId);
    if (p) { const t = (p.tasks || []).find(x => x.id === taskId); if (t) t.dueDate = newDate; }
  }
  saveState();
  if (state.activePage === 'tasks') renderTasks();
  if (state.activePage === 'home') renderDashboard();
}

function updateTestCounterTasks(p) {
  const sessionCount = (p.testSessions || []).filter(s => s.date || s.comments || s.rating).length;
  (p.tasks || []).forEach(t => {
    if (t.subtype === 'test_counter' && t.targetCount) {
      if (sessionCount >= t.targetCount) {
        if (!t.done) {
          t.done = true;
          t.doneAt = new Date().toISOString();
        }
      } else {
        // Objectif augmenté ou sessions supprimées : la tâche repasse en "à faire"
        t.done = false;
        t.doneAt = undefined;
      }
    }
  });
}

function saveQuickTestSession(protoId) {
  const date     = document.getElementById('qts-date')?.value || today();
  const version  = document.getElementById('qts-version')?.value.trim() || '';
  const players  = parseInt(document.getElementById('qts-players')?.value) || null;
  const rating   = parseInt(document.getElementById('qts-rating')?.value) || 0;
  const comments = document.getElementById('qts-comments')?.value.trim() || '';
  const session  = { id: uid(), date, version, players, rating, comments };
  const p = state.prototypes.find(x => x.id === protoId);
  if (!p) return;
  p.testSessions = p.testSessions || [];
  p.testSessions.unshift(session);
  updateTestCounterTasks(p);
  saveState();
  renderPrototypes();
  if (state.activePage === 'agenda') renderAgenda();
  openDetail('prototype', protoId);
}

function saveQuickExchange(contactId) {
  const date    = document.getElementById('qe-date')?.value || today();
  const type    = document.getElementById('qe-type')?.value || 'rencontre';
  const note    = document.getElementById('qe-note')?.value.trim() || '';
  const exchange = { id: uid(), date, type, note };
  const c = state.contacts.find(x => x.id === contactId);
  if (!c) return;
  c.exchanges = c.exchanges || [];
  c.exchanges.unshift(exchange);
  saveState();
  renderContacts();
  if (state.activePage === 'home') renderDashboard();
  if (state.activePage === 'agenda') renderAgenda();
  openDetail('contact', contactId);
}

function saveQuickTask(type, id) {
  const prefix = type === 'contact' ? 'qt-c' : 'qt-p';
  const text = document.getElementById(prefix + '-text')?.value.trim();
  if (!text) { document.getElementById(prefix + '-text')?.focus(); return; }
  const urgency = document.getElementById(prefix + '-urg')?.value || 'normal';
  const due = document.getElementById(prefix + '-date')?.value || undefined;
  const task = { id: uid(), text, urgency, dueDate: due || undefined, done: false };
  if (type === 'contact') {
    const c = state.contacts.find(x => x.id === id);
    if (c) { c.tasks = c.tasks || []; c.tasks.unshift(task); }
    renderContacts();
  } else {
    const p = state.prototypes.find(x => x.id === id);
    if (p) { p.tasks = p.tasks || []; p.tasks.unshift(task); }
    renderPrototypes();
  }
  saveState();
  if (state.activePage === 'home') renderDashboard();
  openDetail(type, id);
}

function deleteStandaloneTask(id) {
  state.standaloneTasks = (state.standaloneTasks || []).filter(t => t.id !== id);
  saveState();
  renderTasks();
}

function saveQuickFestivalTask(festId) {
  const text = document.getElementById('qt-f-text')?.value.trim();
  if (!text) { document.getElementById('qt-f-text')?.focus(); return; }
  const urgency = document.getElementById('qt-f-urg')?.value || 'normal';
  const due = document.getElementById('qt-f-date')?.value || undefined;
  const task = { id: uid(), text, urgency, dueDate: due || undefined, done: false };
  const f = state.festivals.find(x => x.id === festId);
  if (!f) return;
  f.tasks = f.tasks || [];
  f.tasks.unshift(task);
  saveState();
  if (state.activePage === 'home') renderDashboard();
  if (state.activePage === 'tasks') renderTasks();
  openFestivalDetail(festId);
}

function deleteFestivalTask(festId, taskId) {
  const f = state.festivals.find(x => x.id === festId);
  if (!f) return;
  f.tasks = (f.tasks || []).filter(t => t.id !== taskId);
  saveState();
  if (state.activePage === 'tasks') renderTasks();
  if (state.activePage === 'home') renderDashboard();
}

function editStandaloneTask(id) {
  const t = (state.standaloneTasks || []).find(x => x.id === id);
  if (!t) return;
  openStandaloneTaskModal(t);
}

function openStandaloneTaskModal(task = null) {
  const modal = document.getElementById('modal-standalone-task');
  if (!modal) return;
  const isEdit = task && task.id;
  document.getElementById('standalone-task-id').value    = isEdit ? task.id : '';
  document.getElementById('standalone-task-text').value  = isEdit ? (task.text || '') : '';
  document.getElementById('standalone-task-urgency').value = isEdit ? (task.urgency || 'normal') : 'normal';
  document.getElementById('standalone-task-due').value   = isEdit ? (task.dueDate || '') : '';
  document.getElementById('standalone-task-modal-title').textContent = isEdit ? 'Modifier la tâche' : 'Nouvelle tâche';
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('standalone-task-text').focus();
}

function submitStandaloneTask(e) {
  e.preventDefault();
  const id      = document.getElementById('standalone-task-id').value;
  const text    = document.getElementById('standalone-task-text').value.trim();
  const urgency = document.getElementById('standalone-task-urgency').value;
  const dueDate = document.getElementById('standalone-task-due').value || undefined;
  if (!text) return;
  if (id) {
    const t = (state.standaloneTasks || []).find(x => x.id === id);
    if (t) { t.text = text; t.urgency = urgency; t.dueDate = dueDate; }
  } else {
    state.standaloneTasks = state.standaloneTasks || [];
    state.standaloneTasks.unshift({ id: uid(), text, urgency, dueDate, done: false });
  }
  saveState();
  closeModal('standalone-task');
  renderTasks();
  if (state.activePage === 'home') renderDashboard();
}

// ═══════════════════════════════════════════════════
// FILTER PANEL
// ═══════════════════════════════════════════════════
function toggleFilterPanel(page) {
  const body    = document.getElementById(`${page}-filter-body`);
  const chevron = document.getElementById(`${page}-chevron`);
  const open    = body.style.display === 'block';
  body.style.display = open ? 'none' : 'block';
  chevron.classList.toggle('open', !open);
}

function updateFilterCount(page) {
  let active = 0;
  if (page === 'contacts') {
    if (state.contactsCat)          active++;
    if (state.contactsUrgency)      active++;
    if (state.contactsFavoriteOnly) active++;
  } else {
    if (state.prototypesStatus)   active++;
    if (state.prototypesInterest) active++;
    if (state.prototypesTag)      active++;
  }
  const badge = document.getElementById(`${page}-filter-count`);
  const reset = document.getElementById(`${page}-filter-reset`);
  badge.textContent = `${active} actif${active > 1 ? 's' : ''}`;
  badge.classList.toggle('hidden', active === 0);
  reset?.classList.toggle('hidden', active === 0);
}

// ═══════════════════════════════════════════════════
// PHOTO — CONTACT
// ═══════════════════════════════════════════════════
function previewContactPhoto() {
  const url = document.getElementById('contact-photo-url').value.trim();
  _updatePhotoPreview('contact', url);
}
function uploadContactPhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('contact-photo-url').value = e.target.result;
    _updatePhotoPreview('contact', e.target.result);
  };
  reader.readAsDataURL(file);
}
function clearContactPhoto() {
  document.getElementById('contact-photo-url').value = '';
  document.getElementById('contact-photo-file').value = '';
  _updatePhotoPreview('contact', '');
}
function _updatePhotoPreview(prefix, src) {
  const wrap = document.getElementById(`${prefix}-photo-preview`);
  const placeholder = prefix === 'contact' ? '👤' : '🎮';
  if (src) {
    wrap.innerHTML = `<img src="${esc(src)}" class="photo-preview" alt=""
      onerror="this.parentElement.innerHTML='<div class=\\'photo-placeholder\\'>${placeholder}</div>'" />`;
  } else {
    wrap.innerHTML = `<div class="photo-placeholder">${placeholder}</div>`;
  }
}

// ═══════════════════════════════════════════════════
// PHOTO — PROTOTYPE
// ═══════════════════════════════════════════════════
function previewProtoPhoto() {
  const url = document.getElementById('proto-photo-url').value.trim();
  _updatePhotoPreview('proto', url);
}
function uploadProtoPhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('proto-photo-url').value = e.target.result;
    _updatePhotoPreview('proto', e.target.result);
  };
  reader.readAsDataURL(file);
}
function clearProtoPhoto() {
  document.getElementById('proto-photo-url').value = '';
  document.getElementById('proto-photo-file').value = '';
  _updatePhotoPreview('proto', '');
}
function previewProtoEmoji() {
  const emoji = document.getElementById('proto-emoji')?.value.trim() || '';
  const wrap = document.getElementById('proto-photo-preview');
  const photoUrl = document.getElementById('proto-photo-url')?.value.trim() || '';
  if (!photoUrl && emoji && wrap) {
    wrap.innerHTML = `<div class="photo-placeholder" style="font-size:2rem">${emoji}</div>`;
  }
}

// ═══════════════════════════════════════════════════
// PDF — PROTOTYPE
// ═══════════════════════════════════════════════════
let _protoPdfData = null; // base64 data URL

function uploadProtoPdf(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    _protoPdfData = e.target.result;
    document.getElementById('proto-pdf-name').textContent = file.name;
    const link = document.getElementById('proto-pdf-link');
    link.href = _protoPdfData;
    link.style.display = '';
  };
  reader.readAsDataURL(file);
}
function clearProtoPdf() {
  _protoPdfData = null;
  document.getElementById('proto-pdf-file').value = '';
  document.getElementById('proto-pdf-name').textContent = 'Aucun fichier';
  document.getElementById('proto-pdf-link').style.display = 'none';
  const urlEl = document.getElementById('proto-pdf-url');
  if (urlEl) urlEl.value = '';
}

function onProtoPdfUrlInput() {
  const url = document.getElementById('proto-pdf-url').value.trim();
  const nameEl = document.getElementById('proto-pdf-name');
  if (url) {
    nameEl.textContent = 'Lien externe';
  } else if (!_protoPdfData) {
    nameEl.textContent = 'Aucun fichier';
  }
}

// ═══════════════════════════════════════════════════
// INTEREST STARS (prototype form)
// ═══════════════════════════════════════════════════
function updateInterestUI(val) {
  const stars = document.querySelectorAll('.interest-star');
  const n = parseInt(val) || 3;
  stars.forEach((s, i) => s.classList.toggle('lit', i < n));
  const lbl = document.getElementById('interest-label-text');
  if (lbl) lbl.textContent = INTEREST_LABELS[n] || '';
}

document.querySelectorAll('.interest-radio').forEach(r => {
  r.addEventListener('change', () => updateInterestUI(r.value));
});

// ═══════════════════════════════════════════════════
// GAME LIST
// ═══════════════════════════════════════════════════
let _gameRowId = 0;

function addGameRow(game = {}) {
  const tbody = document.getElementById('contact-games-body');
  const tr = document.createElement('tr');
  const statuts = ['', 'Prototype', 'Jeu Édité'];
  const opts = statuts.map(s =>
    `<option value="${s}" ${(game.statut||'') === s ? 'selected':''}>${s || '— Statut —'}</option>`
  ).join('');
  tr.innerHTML = `
    <td><input type="text" placeholder="Titre du jeu" value="${esc(game.title||'')}" /></td>
    <td><select>${opts}</select></td>
    <td><input type="text" placeholder="Notes"        value="${esc(game.notes||'')}" /></td>
    <td><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
  _gameRowId++;
}

function getGamesFromForm() {
  return Array.from(document.querySelectorAll('#contact-games-body tr')).map(tr => {
    const inputs = tr.querySelectorAll('input, select');
    return {
      title:  inputs[0].value.trim(),
      statut: inputs[1].value,
      notes:  inputs[2].value.trim(),
    };
  }).filter(g => g.title);
}

function populateGamesForm(games = []) {
  document.getElementById('contact-games-body').innerHTML = '';
  _gameRowId = 0;
  games.forEach(g => addGameRow(g));
}

// ═══════════════════════════════════════════════════
// TASK LIST (forms)
// ═══════════════════════════════════════════════════
function addTaskRow(prefix, task = {}) {
  const tbody = document.getElementById(`${prefix}-tasks-body`);
  if (!tbody) return;
  const tr = document.createElement('tr');
  const urgencies = ['faible', 'normal', 'urgent', 'critique'];
  const opts = urgencies.map(u =>
    `<option value="${u}" ${(task.urgency || 'normal') === u ? 'selected' : ''}>${u.charAt(0).toUpperCase() + u.slice(1)}</option>`
  ).join('');
  const tid = task.id || uid();
  tr.dataset.taskId = tid;
  tr.innerHTML = `
    <td><input type="text" placeholder="Description de la tâche…" value="${esc(task.text || '')}" /></td>
    <td><select>${opts}</select></td>
    <td><input type="date" value="${esc(task.dueDate || '')}" style="font-size:.75rem;padding:.25rem .3rem;border:1px solid var(--border-input);border-radius:var(--rx);width:100%;font-family:inherit" /></td>
    <td><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}

function addTestCounterRow(prefix, task = {}) {
  const tbody = document.getElementById(`${prefix}-tasks-body`);
  if (!tbody) return;
  const tr = document.createElement('tr');
  const urgencies = ['faible', 'normal', 'urgent', 'critique'];
  const opts = urgencies.map(u =>
    `<option value="${u}" ${(task.urgency || 'normal') === u ? 'selected' : ''}>${u.charAt(0).toUpperCase() + u.slice(1)}</option>`
  ).join('');
  const tid = task.id || uid();
  tr.dataset.taskId = tid;
  tr.dataset.subtype = 'test_counter';
  tr.innerHTML = `
    <td><label style="display:flex;align-items:center;gap:.4rem;font-size:.82rem;white-space:nowrap">
      🧪 Tester
      <input type="number" class="test-counter-target" min="1" value="${task.targetCount || 5}"
        style="width:3.5rem;padding:.2rem .3rem;border:1px solid var(--border-input);border-radius:var(--rx);font-size:.82rem;font-family:inherit" />
      fois
    </label></td>
    <td><select>${opts}</select></td>
    <td><input type="date" value="${esc(task.dueDate || '')}" style="font-size:.75rem;padding:.25rem .3rem;border:1px solid var(--border-input);border-radius:var(--rx);width:100%;font-family:inherit" /></td>
    <td><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}

function getTasksFromForm(prefix) {
  const tbody = document.getElementById(`${prefix}-tasks-body`);
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr')).map(tr => {
    const subtype = tr.dataset.subtype || '';
    const urgency = tr.querySelector('select')?.value || 'normal';
    const dueDate = tr.querySelector('input[type="date"]')?.value || '';
    if (subtype === 'test_counter') {
      const targetCount = parseInt(tr.querySelector('.test-counter-target')?.value) || 1;
      return {
        id: tr.dataset.taskId || uid(),
        text: `Tester ${targetCount} fois`,
        urgency,
        dueDate: dueDate || undefined,
        done: false,
        subtype: 'test_counter',
        targetCount,
      };
    }
    const text = tr.querySelector('input[type="text"]')?.value.trim() || '';
    return {
      id:      tr.dataset.taskId || uid(),
      text,
      urgency,
      dueDate: dueDate || undefined,
      done:    false,
    };
  }).filter(t => t.text || t.subtype === 'test_counter');
}

function populateTasksForm(prefix, tasks = []) {
  const tbody = document.getElementById(`${prefix}-tasks-body`);
  if (!tbody) return;
  tbody.innerHTML = '';
  tasks.forEach(t => {
    if (t.subtype === 'test_counter') addTestCounterRow(prefix, t);
    else addTaskRow(prefix, t);
  });
}

// ═══════════════════════════════════════════════════
// CONTACT LINKS (prototype form)
// ═══════════════════════════════════════════════════
function addContactLinkRow(link = {}) {
  const tbody = document.getElementById('proto-contacts-body');
  if (!tbody) return;
  const tr = document.createElement('tr');
  const opts = state.contacts.map(c =>
    `<option value="${c.id}" ${link.contactId === c.id ? 'selected' : ''}>${esc(c.name)}${c.company ? ' – ' + esc(c.company) : ''}</option>`
  ).join('');
  tr.innerHTML = `
    <td><select><option value="">— Choisir un contact —</option>${opts}</select></td>
    <td><input type="text" placeholder="ex : auteur, illustrateur…" value="${esc(link.role || '')}" /></td>
    <td><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}

function getContactLinksFromForm() {
  const tbody = document.getElementById('proto-contacts-body');
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr')).map(tr => {
    const sel  = tr.querySelector('select');
    const inp  = tr.querySelector('input[type="text"]');
    return { contactId: sel?.value || '', role: inp?.value.trim() || '' };
  }).filter(l => l.contactId);
}

function populateContactLinksForm(links = []) {
  const tbody = document.getElementById('proto-contacts-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  links.forEach(l => addContactLinkRow(l));
}

// ═══════════════════════════════════════════════════
// EXCHANGE HISTORY (contact form)
// ═══════════════════════════════════════════════════
function addExchangeRow(ex = {}) {
  const tbody = document.getElementById('contact-exchanges-body');
  if (!tbody) return;
  const tr = document.createElement('tr');
  const typeOpts = EXCHANGE_TYPES.map(t =>
    `<option value="${t}" ${(ex.type || 'rencontre') === t ? 'selected' : ''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`
  ).join('');
  const eid = ex.id || uid();
  tr.dataset.exchId = eid;
  tr.innerHTML = `
    <td><input type="date" value="${esc(ex.date || today())}" /></td>
    <td><select>${typeOpts}</select></td>
    <td><input type="text" placeholder="Note sur l'échange…" value="${esc(ex.note || '')}" /></td>
    <td><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}
function getExchangesFromForm() {
  const tbody = document.getElementById('contact-exchanges-body');
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr')).map(tr => ({
    id:   tr.dataset.exchId || uid(),
    date: tr.querySelector('input[type="date"]')?.value || '',
    type: tr.querySelector('select')?.value || 'rencontre',
    note: tr.querySelector('input[type="text"]')?.value.trim() || '',
  })).filter(e => e.date);
}
function populateExchangesForm(exchanges = []) {
  const tbody = document.getElementById('contact-exchanges-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  exchanges.forEach(e => addExchangeRow(e));
}

// ═══════════════════════════════════════════════════
// SOCIAL LINKS (contact form)
// ═══════════════════════════════════════════════════
function addSocialRow(social = {}) {
  const tbody = document.getElementById('contact-socials-body');
  if (!tbody) return;
  const tr = document.createElement('tr');
  const typeOpts = SOCIAL_TYPES.map(t =>
    `<option value="${t}" ${(social.type || '') === t ? 'selected' : ''}>${t}</option>`
  ).join('');
  tr.innerHTML = `
    <td><select><option value="">— Réseau —</option>${typeOpts}</select></td>
    <td><input type="text" placeholder="https://…" value="${esc(social.url || '')}" /></td>
    <td><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}
function getSocialsFromForm() {
  const tbody = document.getElementById('contact-socials-body');
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr')).map(tr => ({
    type: tr.querySelector('select')?.value || '',
    url:  tr.querySelector('input[type="text"]')?.value.trim() || '',
  })).filter(s => s.type && s.url);
}
function populateSocialsForm(socials = []) {
  const tbody = document.getElementById('contact-socials-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  socials.forEach(s => addSocialRow(s));
}

// ═══════════════════════════════════════════════════
// DEV LOG (prototype form)
// ═══════════════════════════════════════════════════
function addDevLogRow(entry = {}) {
  const tbody = document.getElementById('proto-devlog-body');
  if (!tbody) return;
  const tr = document.createElement('tr');
  const eid = entry.id || uid();
  tr.dataset.entryId = eid;
  tr.innerHTML = `
    <td style="vertical-align:top;padding-top:.45rem"><input type="date" value="${esc(entry.date || today())}" /></td>
    <td>
      <input type="text" class="devlog-title-input" placeholder="Titre de l'entrée…" value="${esc(entry.note || '')}" />
      <textarea class="devlog-details-input" placeholder="Idées, modifications, détails…" rows="3">${esc(entry.details || '')}</textarea>
    </td>
    <td style="vertical-align:top"><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}
function getDevLogFromForm() {
  const tbody = document.getElementById('proto-devlog-body');
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr')).map(tr => ({
    id:      tr.dataset.entryId || uid(),
    date:    tr.querySelector('input[type="date"]')?.value || '',
    note:    tr.querySelector('.devlog-title-input')?.value.trim() || '',
    details: tr.querySelector('.devlog-details-input')?.value.trim() || '',
  })).filter(e => e.note);
}
function populateDevLogForm(devLog = []) {
  const tbody = document.getElementById('proto-devlog-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  devLog.forEach(e => addDevLogRow(e));
}

// ═══════════════════════════════════════════════════
// FAVORITES
// ═══════════════════════════════════════════════════
function toggleFavorite(id) {
  const c = state.contacts.find(x => x.id === id);
  if (!c) return;
  c.favorite = !c.favorite;
  saveState();
  renderContacts();
}

function onFavoriteFilterChange() {
  const cb = document.getElementById('contacts-favorite-filter');
  state.contactsFavoriteOnly = cb ? cb.checked : false;
  updateFilterCount('contacts');
  renderContacts();
}

// ═══════════════════════════════════════════════════
// VIDEO HELPERS (contacts + prototypes)
// ═══════════════════════════════════════════════════
function getYoutubeId(url) {
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function addVideoRow(prefix, video = {}) {
  const tbody = document.getElementById(`${prefix}-videos-body`);
  if (!tbody) return;
  const tr = document.createElement('tr');
  const vid = video.id || uid();
  tr.dataset.videoId = vid;
  tr.innerHTML = `
    <td><input type="text" placeholder="https://youtube.com/watch?v=…" value="${esc(video.url || '')}" /></td>
    <td><input type="text" placeholder="Titre de la vidéo" value="${esc(video.title || '')}" /></td>
    <td><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}

function getVideosFromForm(prefix) {
  const tbody = document.getElementById(`${prefix}-videos-body`);
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr')).map(tr => {
    const inputs = tr.querySelectorAll('input[type="text"]');
    return {
      id:    tr.dataset.videoId || uid(),
      url:   inputs[0]?.value.trim() || '',
      title: inputs[1]?.value.trim() || '',
    };
  }).filter(v => v.url);
}

function populateVideosForm(prefix, videos = []) {
  const tbody = document.getElementById(`${prefix}-videos-body`);
  if (!tbody) return;
  tbody.innerHTML = '';
  videos.forEach(v => addVideoRow(prefix, v));
}

// ═══════════════════════════════════════════════════
// COSTS HELPERS (prototype)
// ═══════════════════════════════════════════════════
function addCostRow(cost = {}) {
  const tbody = document.getElementById('proto-costs-body');
  if (!tbody) return;
  const tr = document.createElement('tr');
  const cid = cost.id || uid();
  tr.dataset.costId = cid;
  tr.innerHTML = `
    <td><input type="text" placeholder="ex : illustration, impression…" value="${esc(cost.description || '')}" /></td>
    <td><input type="number" min="0" step="0.01" placeholder="0.00" value="${cost.price != null ? cost.price : ''}" style="width:100%" /></td>
    <td><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}

function getCostsFromForm() {
  const tbody = document.getElementById('proto-costs-body');
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr')).map(tr => ({
    id:          tr.dataset.costId || uid(),
    description: tr.querySelector('input[type="text"]')?.value.trim() || '',
    price:       parseFloat(tr.querySelector('input[type="number"]')?.value) || 0,
  })).filter(c => c.description);
}

function populateCostsForm(costs = []) {
  const tbody = document.getElementById('proto-costs-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  costs.forEach(c => addCostRow(c));
}

// ═══════════════════════════════════════════════════
// TEST SESSIONS (prototype)
// ═══════════════════════════════════════════════════
function addTestRow(session = {}) {
  const tbody = document.getElementById('proto-test-body');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.dataset.testId = session.id || uid();
  const ratingOpts = [1,2,3,4,5].map(n =>
    `<option value="${n}" ${(session.rating||0) === n ? 'selected':''}>${'⭐'.repeat(n)}</option>`
  ).join('');
  tr.innerHTML = `
    <td><input type="date" value="${esc(session.date || '')}" style="font-size:.75rem;padding:.25rem .3rem;border:1px solid var(--border-input);border-radius:var(--rx);width:100%;font-family:inherit" /></td>
    <td><input type="text" class="test-version" placeholder="v1.0" value="${esc(session.version || '')}" style="font-size:.75rem;padding:.25rem .3rem;border:1px solid var(--border-input);border-radius:var(--rx);width:100%;font-family:inherit" /></td>
    <td><input type="number" min="1" max="99" placeholder="nb" value="${session.players != null ? session.players : ''}" style="font-size:.8rem;padding:.25rem .35rem;border:1px solid var(--border-input);border-radius:var(--rx);width:100%;font-family:inherit" /></td>
    <td><select style="font-size:.75rem;padding:.25rem .3rem;border:1px solid var(--border-input);border-radius:var(--rx);width:100%;font-family:inherit"><option value="">—</option>${ratingOpts}</select></td>
    <td><input type="text" class="test-comments" placeholder="Retours, impressions…" value="${esc(session.comments || '')}" /></td>
    <td><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}

function getTestSessionsFromForm() {
  const tbody = document.getElementById('proto-test-body');
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr')).map(tr => ({
    id:       tr.dataset.testId || uid(),
    date:     tr.querySelector('input[type="date"]')?.value || '',
    version:  tr.querySelector('.test-version')?.value.trim() || '',
    players:  parseInt(tr.querySelector('input[type="number"]')?.value) || null,
    rating:   parseInt(tr.querySelector('select')?.value) || null,
    comments: tr.querySelector('.test-comments')?.value.trim() || '',
  })).filter(s => s.date || s.comments);
}

function populateTestSessionsForm(sessions = []) {
  const tbody = document.getElementById('proto-test-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  sessions.forEach(s => addTestRow(s));
}

// ═══════════════════════════════════════════════════
// FESTIVALS
// ═══════════════════════════════════════════════════

const FEST_ICONS = { 'festival': '🎪', 'festival-pro': '🤝', 'micro-festival': '🏠' };
const FEST_LABELS = { 'festival': 'Festival', 'festival-pro': 'Festival Pro', 'micro-festival': 'Micro-Festival' };

function festivalTotalCost(f) {
  const c = f.costs || {};
  return (c.transport||0) + (c.parking||0) + (c.ticket||0) + (c.food||0) + (c.lodging||0);
}

function festivalDuration(f) {
  if (!f.dateStart || !f.dateEnd) return null;
  const d0 = new Date(f.dateStart), d1 = new Date(f.dateEnd);
  if (isNaN(d0) || isNaN(d1) || d1 < d0) return null;
  const days = Math.round((d1 - d0) / 86400000) + 1;
  const nights = days - 1;
  return `${days} jour${days > 1 ? 's' : ''}${nights > 0 ? ` + ${nights} nuit${nights > 1 ? 's' : ''}` : ''}`;
}

function festDateRange(f) {
  const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : null;
  const s = fmt(f.dateStart), e = fmt(f.dateEnd);
  if (s && e && s !== e) return `${s} → ${e}`;
  return s || e || '—';
}

function filteredFestivals() {
  let list = [...state.festivals];
  const q = state.festivalsSearch.toLowerCase().trim();
  if (q) list = list.filter(f =>
    (f.name   || '').toLowerCase().includes(q) ||
    (f.city   || '').toLowerCase().includes(q) ||
    (f.notes  || '').toLowerCase().includes(q)
  );
  if (state.festivalsCategory) list = list.filter(f => f.category === state.festivalsCategory);
  if (state.festivalsParticipating === 'yes') list = list.filter(f => f.participating);
  if (state.festivalsParticipating === 'no')  list = list.filter(f => !f.participating);
  list.sort((a, b) => {
    let cmp = 0;
    switch (state.festivalsSort) {
      case 'dateStart': cmp = (a.dateStart||'').localeCompare(b.dateStart||''); break;
      case 'name':      cmp = (a.name||'').localeCompare(b.name||'', 'fr'); break;
      case 'city':      cmp = (a.city||'').localeCompare(b.city||'', 'fr'); break;
    }
    return state.festivalsSortAsc ? cmp : -cmp;
  });
  return list;
}

function festivalCard(f, zoom) {
  const isMin = zoom <= 1;
  const icon = FEST_ICONS[f.category] || '🎪';
  const label = FEST_LABELS[f.category] || f.category;
  const participating = f.participating
    ? `<span style="position:absolute;top:.4rem;right:.4rem;background:rgba(22,163,74,.9);color:#fff;border-radius:var(--rx);padding:.1rem .4rem;font-size:.65rem;font-weight:700">✓ Participe</span>`
    : '';
  const dateBadge = f.dateStart
    ? `<span style="position:absolute;bottom:.35rem;left:.35rem;background:rgba(255,255,255,.9);border-radius:var(--rx);padding:.1rem .4rem;font-size:.65rem;font-weight:600;color:var(--text-700)">${new Date(f.dateStart).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}</span>`
    : '';
  const editBtn = `<button class="card-edit-btn" onclick="event.stopPropagation();editFestival('${f.id}')" title="Modifier">${ICONS.pencil}</button>`;
  const mediaContent = f.posterUrl
    ? `<img src="${esc(f.posterUrl)}" class="card-photo" alt="" onerror="this.style.display='none'" />`
    : `<span class="card-game-icon">${icon}</span>`;
  const badge = isMin
    ? `<span class="badge badge-fest-${f.category} card-badge" style="font-size:.6rem;padding:.1rem .35rem">${icon}</span>`
    : `<span class="badge badge-fest-${f.category} card-badge">${icon} ${esc(label)}</span>`;

  let body;
  if (isMin) {
    body = `<div class="card-min-name" title="${esc(f.name)}">${esc(f.name)}</div>`;
  } else {
    const total = festivalTotalCost(f);
    const dur = festivalDuration(f);
    body = `<div class="card-body">
      <h3 class="card-title">${esc(f.name)}</h3>
      ${f.city ? `<p class="card-subtitle">📍 ${esc(f.city)}</p>` : ''}
      ${zoom >= 2 && (f.dateStart || f.dateEnd) ? `<p style="font-size:.72rem;color:var(--text-500);margin:.15rem 0">${festDateRange(f)}</p>` : ''}
      ${zoom >= 3 && dur ? `<p style="font-size:.7rem;color:var(--text-400);margin:.1rem 0">${dur}</p>` : ''}
      <div class="card-footer">
        ${total > 0 ? `<span style="font-size:.72rem;color:var(--text-500)">💶 ${total.toFixed(0)} €</span>` : '<span></span>'}
        ${zoom >= 3 && f.distance ? `<span style="font-size:.7rem;color:var(--text-400)">🔄 ${esc(f.distance)}</span>` : ''}
      </div>
    </div>`;
  }

  return `<div class="card card-hover"
    onclick="openFestivalDetail('${f.id}')" title="${esc(f.name)}">
    <div class="card-media card-media-fest-${f.category}">
      ${mediaContent}${badge}${participating}${dateBadge}${editBtn}
    </div>
    ${body}
  </div>`;
}

function buildFestivalsTimeline(list) {
  if (!list.length) return '<div class="timeline-empty" style="text-align:center;padding:2rem;color:var(--text-400)">Aucun festival à afficher</div>';
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = list.filter(f => (f.dateEnd || f.dateStart || '') >= today || !f.dateStart);
  const past     = list.filter(f => f.dateStart && (f.dateEnd || f.dateStart) < today);

  function timelineCard(f) {
    const icon = FEST_ICONS[f.category] || '🎪';
    const total = festivalTotalCost(f);
    const dur = festivalDuration(f);
    return `<div class="fest-timeline-card${f.participating ? ' fest-participating' : ''}" onclick="openFestivalDetail('${f.id}')">
      <div class="fest-timeline-date">${f.dateStart ? new Date(f.dateStart).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}) : '—'}</div>
      <div class="fest-timeline-body">
        <div class="fest-timeline-name">${f.participating ? '✓ ' : ''}${esc(f.name)}</div>
        ${f.city ? `<div class="fest-timeline-city">📍 ${esc(f.city)}</div>` : ''}
        <div class="fest-timeline-meta">
          <span class="badge badge-fest-${f.category}" style="font-size:.65rem">${icon} ${esc(FEST_LABELS[f.category]||'')}</span>
          ${f.protos ? `<span style="font-size:.68rem;color:var(--primary-600);font-weight:600">🎲 Protos</span>` : ''}
          ${dur ? `<span style="font-size:.68rem;color:var(--text-400)">${dur}</span>` : ''}
          ${total > 0 ? `<span style="font-size:.68rem;color:var(--text-500)">💶 ${total.toFixed(0)} €</span>` : ''}
        </div>
      </div>
      <button class="card-edit-btn" style="position:static;opacity:1;margin-left:auto;flex-shrink:0" onclick="event.stopPropagation();editFestival('${f.id}')" title="Modifier">${ICONS.pencil}</button>
    </div>`;
  }

  function byYearBlock(items, asc) {
    const byYear = {};
    items.forEach(f => {
      const y = f.dateStart ? f.dateStart.slice(0, 4) : 'Sans date';
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(f);
    });
    const years = Object.keys(byYear).sort((a, b) => asc ? a.localeCompare(b) : b.localeCompare(a));
    return years.map(year => {
      const sorted = byYear[year].slice().sort((a, b) => (a.dateStart||'').localeCompare(b.dateStart||''));
      return `<div class="fest-timeline-year">
        <div class="fest-timeline-year-header">${year}</div>
        <div class="fest-timeline-items">${sorted.map(timelineCard).join('')}</div>
      </div>`;
    }).join('');
  }

  let html = '<div class="fest-timeline">';
  if (upcoming.length) {
    html += `<div class="fest-timeline-section-label" style="font-size:.72rem;font-weight:700;color:var(--text-500);text-transform:uppercase;letter-spacing:.05em;padding:.5rem .25rem .25rem;display:flex;align-items:center;gap:.6rem">
      <span style="white-space:nowrap">À venir · ${upcoming.length}</span>
      <span style="flex:1;height:1px;background:var(--border)"></span>
    </div>`;
    html += byYearBlock(upcoming, true);
  }
  if (past.length) {
    html += `<div class="fest-timeline-section-label" style="font-size:.72rem;font-weight:700;color:var(--text-400);text-transform:uppercase;letter-spacing:.05em;padding:${upcoming.length ? '1rem' : '.5rem'} .25rem .25rem;display:flex;align-items:center;gap:.6rem">
      <span style="white-space:nowrap">Passés · ${past.length}</span>
      <span style="flex:1;height:1px;background:var(--border)"></span>
    </div>`;
    html += byYearBlock(past, false);
  }
  html += '</div>';
  return html;
}

function renderFestivalsStats() {
  const el = document.getElementById('festivals-stats');
  if (!el) return;
  const all = state.festivals;
  if (!all.length) { el.innerHTML = ''; return; }

  const today_str = today();

  // Counts
  const total     = all.length;
  const past      = all.filter(f => f.dateStart && (f.dateEnd || f.dateStart) < today_str).length;
  const upcoming  = all.filter(f => (f.dateEnd || f.dateStart || '') >= today_str || !f.dateStart).length;
  const withPart  = all.filter(f => f.participating).length;
  const withProtos= all.filter(f => f.protos).length;

  // Unique contacts met across all festivals
  const contactIds = new Set(all.flatMap(f => (f.contactLinks||[]).map(l => l.contactId)));
  const authorsCount = contactIds.size;

  // Costs
  const costKeys = ['transport','parking','ticket','food','lodging'];
  const costLabels = { transport:'🚗 Transport', parking:'🅿️ Parking', ticket:'🎟️ Billet/Stand', food:'🍔 Nourriture', lodging:'🛏️ Logement' };
  const totalCosts = { transport:0, parking:0, ticket:0, food:0, lodging:0 };
  let grandTotal = 0;
  all.forEach(f => {
    const c = f.costs || {};
    costKeys.forEach(k => { totalCosts[k] += (+c[k]||0); });
    grandTotal += festivalTotalCost(f);
  });

  // Cost by category
  const catCosts = {};
  Object.keys(FEST_LABELS).forEach(cat => {
    catCosts[cat] = all.filter(f => f.category === cat).reduce((s,f) => s + festivalTotalCost(f), 0);
  });

  // Avg cost per festival with costs
  const withCosts = all.filter(f => festivalTotalCost(f) > 0);
  const avgCost = withCosts.length ? grandTotal / withCosts.length : 0;

  el.innerHTML = `
    <div class="fstat-block">
      <div class="fstat-title">Festivals</div>
      <div class="fstat-big">${total}</div>
      <div class="fstat-sub">dont ${upcoming} à venir · ${past} passés</div>
    </div>

    <div class="fstat-block">
      <div class="fstat-title">Par catégorie</div>
      ${Object.entries(FEST_LABELS).map(([cat, label]) => {
        const n = all.filter(f => f.category === cat).length;
        if (!n) return '';
        return `<div class="fstat-row"><span>${FEST_ICONS[cat]||'🎪'} ${label}</span><span class="fstat-row-val">${n}</span></div>`;
      }).join('')}
    </div>

    <div class="fstat-block">
      <div class="fstat-title">Participation</div>
      <div class="fstat-row"><span>✅ Je participe</span><span class="fstat-row-val">${withPart}</span></div>
      <div class="fstat-row"><span>🎲 Avec protos</span><span class="fstat-row-val">${withProtos}</span></div>
      ${authorsCount ? `<div class="fstat-row"><span>🤝 Auteurs rencontrés</span><span class="fstat-row-val">${authorsCount}</span></div>` : ''}
    </div>

    ${grandTotal > 0 ? `
    <div class="fstat-block">
      <div class="fstat-title">Coûts totaux</div>
      ${costKeys.filter(k => totalCosts[k] > 0).map(k =>
        `<div class="fstat-row"><span>${costLabels[k]}</span><span class="fstat-row-val">${totalCosts[k].toFixed(0)} €</span></div>`
      ).join('')}
      <div class="fstat-total-row"><span>💶 Total</span><span>${grandTotal.toFixed(0)} €</span></div>
      ${avgCost > 0 ? `<div class="fstat-sub" style="margin-top:.35rem">Moy. ${avgCost.toFixed(0)} €/festival</div>` : ''}
    </div>

    <div class="fstat-block">
      <div class="fstat-title">Coûts par catégorie</div>
      ${Object.entries(catCosts).filter(([,v]) => v > 0).map(([cat, v]) =>
        `<div class="fstat-row"><span>${FEST_ICONS[cat]||'🎪'} ${FEST_LABELS[cat]}</span><span class="fstat-row-val">${v.toFixed(0)} €</span></div>`
      ).join('')}
    </div>` : ''}
  `;
}

function renderFestivals() {
  renderFestivalsStats();
  const list   = filteredFestivals();
  const gridEl = document.getElementById('festivals-grid');
  const tlEl   = document.getElementById('festivals-timeline');
  const empty  = document.getElementById('festivals-empty');

  document.getElementById('nav-festivals-count').textContent = state.festivals.length;
  const n = list.length;
  document.getElementById('festivals-count').textContent = `${n} festival${n > 1 ? 's' : ''}`;

  const zoom = state.festivalsZoom;
  gridEl.dataset.zoom = zoom;

  const isGrid = state.festivalsView === 'grid';
  gridEl.style.display     = isGrid ? '' : 'none';
  tlEl.style.display       = isGrid ? 'none' : '';
  document.getElementById('festivals-view-grid').classList.toggle('active', isGrid);
  document.getElementById('festivals-view-timeline').classList.toggle('active', !isGrid);

  if (isGrid) {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = list.filter(f => (f.dateEnd || f.dateStart || '') >= today || !f.dateStart);
    const past     = list.filter(f => f.dateStart && (f.dateEnd || f.dateStart) < today);
    let html = '';
    if (upcoming.length) {
      html += `<div class="fest-section-separator" style="grid-column:1/-1;display:flex;align-items:center;gap:.6rem;padding:.25rem 0;margin-bottom:.25rem">
        <span style="font-size:.72rem;font-weight:700;color:var(--text-500);white-space:nowrap;text-transform:uppercase;letter-spacing:.05em">À venir · ${upcoming.length}</span>
        <span style="flex:1;height:1px;background:var(--border)"></span>
      </div>`;
      html += upcoming.map(f => festivalCard(f, zoom)).join('');
    }
    if (past.length) {
      html += `<div class="fest-section-separator" style="grid-column:1/-1;display:flex;align-items:center;gap:.6rem;padding:.25rem 0;margin-top:${upcoming.length ? '.75rem' : '.25rem'};margin-bottom:.25rem">
        <span style="font-size:.72rem;font-weight:700;color:var(--text-400);white-space:nowrap;text-transform:uppercase;letter-spacing:.05em">Passés · ${past.length}</span>
        <span style="flex:1;height:1px;background:var(--border)"></span>
      </div>`;
      html += past.map(f => festivalCard(f, zoom)).join('');
    }
    gridEl.innerHTML = html;
  } else {
    tlEl.innerHTML = buildFestivalsTimeline(list);
  }

  empty.classList.toggle('hidden', n > 0);

  // Update filter badge
  const activeFilters = [state.festivalsCategory, state.festivalsParticipating].filter(Boolean).length;
  const fc = document.getElementById('festivals-filter-count');
  if (fc) {
    fc.textContent = `${activeFilters} actif(s)`;
    fc.classList.toggle('hidden', activeFilters === 0);
  }
  const resetBtn = document.getElementById('festivals-filter-reset');
  if (resetBtn) resetBtn.classList.toggle('hidden', activeFilters === 0);
}

// ── Festival detail (simple panel) ────────────────
function toggleDevLogItem(el) {
  const item = el.closest('.devlog-item');
  const body = item.querySelector('.devlog-item-body');
  const open = item.classList.toggle('devlog-open');
  body.style.display = open ? 'block' : 'none';
}

function openFestivalDetail(id) {
  const f = state.festivals.find(x => x.id === id);
  if (!f) return;
  const icon = FEST_ICONS[f.category] || '🎪';
  const dur = festivalDuration(f);
  const total = festivalTotalCost(f);
  const costs = f.costs || {};

  const el = document.getElementById('modal-detail-content');
  const _fList = filteredFestivals();
  const _fIdx  = _fList.findIndex(x => x.id === id);
  _detailType = 'festival';
  _detailId   = id;

  el.innerHTML = `
    <div class="modal-header">
      <div style="display:flex;align-items:center;gap:.75rem;flex:1;min-width:0">
        ${f.posterUrl
          ? `<img src="${esc(f.posterUrl)}" style="width:48px;height:48px;border-radius:var(--rx-lg);object-fit:cover;border:2px solid var(--border)" alt="" onerror="this.style.display='none'" />`
          : `<span style="font-size:1.75rem;line-height:1">${icon}</span>`}
        <div style="min-width:0">
          <div style="font-size:1.05rem;font-weight:700;color:var(--text-800);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.name)}</div>
          ${f.city ? `<div style="font-size:.8rem;color:var(--text-500)">📍 ${esc(f.city)}</div>` : ''}
        </div>
        <span class="badge badge-fest-${f.category}" style="margin-left:auto;flex-shrink:0">${icon} ${esc(FEST_LABELS[f.category]||f.category)}</span>
      </div>
      <button class="btn-edit-detail" onclick="closeModal('detail');editFestival('${f.id}')" title="Modifier">${ICONS.pencil}</button>
      <button class="modal-close" onclick="closeModal('detail')" style="flex-shrink:0;margin-left:.5rem">✕</button>
    </div>
    <div class="detail-inner">
      <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.6rem">
        ${f.participating ? `<span style="background:#dcfce7;color:#15803d;border-radius:var(--rx);padding:.2rem .55rem;font-size:.78rem;font-weight:600">✅ Je participe</span>` : `<span style="background:var(--bg);color:var(--text-400);border-radius:var(--rx);padding:.2rem .55rem;font-size:.78rem;border:1px solid var(--border)">✗ Ne participe pas</span>`}
        ${f.protos ? `<span style="background:#ede9fe;color:#6d28d9;border-radius:var(--rx);padding:.2rem .55rem;font-size:.78rem;font-weight:600">🎲 Protos</span>` : ''}
        ${(f.dateStart || f.dateEnd) ? `<span style="background:var(--bg);border:1px solid var(--border);border-radius:var(--rx);padding:.2rem .55rem;font-size:.78rem;color:var(--text-700)">📅 ${festDateRange(f)}${dur ? ` · ${dur}` : ''}</span>` : ''}
        ${f.distance ? `<span style="background:var(--bg);border:1px solid var(--border);border-radius:var(--rx);padding:.2rem .55rem;font-size:.78rem;color:var(--text-700)">🔄 ${esc(f.distance)}</span>` : ''}
        ${f.address ? `<span style="background:var(--bg);border:1px solid var(--border);border-radius:var(--rx);padding:.2rem .55rem;font-size:.78rem;color:var(--text-700)">📍 ${esc(f.address)}</span>` : ''}
      </div>

      ${(total > 0) ? `<div class="detail-section-title">Coûts</div>
      <table style="width:100%;border-collapse:collapse;font-size:.82rem">
        ${costs.transport ? `<tr><td style="padding:.2rem .4rem;color:var(--text-500)">🚗 Transport</td><td style="padding:.2rem .4rem;text-align:right">${(+costs.transport).toFixed(2)} €</td></tr>` : ''}
        ${costs.parking   ? `<tr><td style="padding:.2rem .4rem;color:var(--text-500)">🅿️ Parking</td><td style="padding:.2rem .4rem;text-align:right">${(+costs.parking).toFixed(2)} €</td></tr>` : ''}
        ${costs.ticket    ? `<tr><td style="padding:.2rem .4rem;color:var(--text-500)">🎟️ Billet/Stand</td><td style="padding:.2rem .4rem;text-align:right">${(+costs.ticket).toFixed(2)} €</td></tr>` : ''}
        ${costs.food      ? `<tr><td style="padding:.2rem .4rem;color:var(--text-500)">🍔 Nourriture</td><td style="padding:.2rem .4rem;text-align:right">${(+costs.food).toFixed(2)} €</td></tr>` : ''}
        ${costs.lodging   ? `<tr><td style="padding:.2rem .4rem;color:var(--text-500)">🛏️ Logement</td><td style="padding:.2rem .4rem;text-align:right">${(+costs.lodging).toFixed(2)} €</td></tr>` : ''}
        <tr style="border-top:1px solid var(--border);font-weight:700"><td style="padding:.3rem .4rem">💶 Total</td><td style="padding:.3rem .4rem;text-align:right">${total.toFixed(2)} €</td></tr>
      </table>` : ''}

      ${(f.contactLinks||[]).length ? `<div class="detail-section-title">RDV sur place</div>
      <div>${(f.contactLinks||[]).map(l => {
        const c = state.contacts.find(x => x.id === l.contactId);
        if (!c) return '';
        return `<div style="display:flex;align-items:center;gap:.5rem;padding:.3rem 0;cursor:pointer" onclick="closeModal('detail');openDetail('contact','${c.id}')">
          <span style="font-size:.875rem;font-weight:600;color:var(--primary-600)">${esc(c.name)}</span>
          ${l.note ? `<span style="font-size:.75rem;color:var(--text-500)">${esc(l.note)}</span>` : ''}
          ${c.category ? `<span class="badge badge-${c.category}" style="margin-left:auto">${esc(c.category)}</span>` : ''}
        </div>`;
      }).filter(Boolean).join('')}</div>` : ''}

      ${(f.gameLinks||[]).length ? `<div class="detail-section-title">Jeux sur place</div>
      <div>${(f.gameLinks||[]).map(l => {
        const p = state.prototypes.find(x => x.id === l.protoId);
        if (!p) return '';
        const pIcon = PROTO_ICONS[p.status] || '🎮';
        return `<div style="display:flex;align-items:center;gap:.5rem;padding:.3rem 0;cursor:pointer" onclick="closeModal('detail');openDetail('prototype','${p.id}')">
          <span>${pIcon}</span>
          <span style="font-size:.875rem;font-weight:600;color:var(--primary-600)">${esc(p.title)}</span>
          ${l.note ? `<span style="font-size:.75rem;color:var(--text-500)">${esc(l.note)}</span>` : ''}
          <span class="badge badge-${p.status}" style="margin-left:auto">${esc(STATUS_LABELS[p.status]||p.status)}</span>
        </div>`;
      }).filter(Boolean).join('')}</div>` : ''}

      ${(f.photos||[]).length ? `<div class="detail-section-title">📷 Photos sur place</div>
      <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:.5rem">
        ${(f.photos||[]).map(url => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">
          <img src="${esc(url)}" alt="" style="width:140px;height:140px;object-fit:cover;border-radius:var(--rx);border:1px solid var(--border);cursor:pointer"
            onerror="this.closest('a').style.display='none'" />
        </a>`).join('')}
      </div>` : ''}

      <div class="detail-section-title" style="display:flex;align-items:center;gap:.6rem">
        Présences
        ${(f.presences||[]).length ? `<span style="font-size:.72rem;color:var(--text-400)">${(f.presences||[]).length} jour${(f.presences||[]).length > 1 ? 's' : ''}</span>` : ''}
      </div>
      <div id="fest-presences-list-${f.id}">
        ${(f.presences||[]).length
          ? `<table style="width:100%;border-collapse:collapse;font-size:.82rem;margin-bottom:.4rem">
              ${[...(f.presences||[])].sort((a,b) => (a.dateStart||a.date||'').localeCompare(b.dateStart||b.date||'')).map(p => {
                const fmtP = d => d ? new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}) : null;
                const ds = fmtP(p.dateStart||p.date), de = fmtP(p.dateEnd);
                const period = ds && de && ds !== de ? `${ds} → ${de}` : (ds || '—');
                return `<tr>
                  <td style="padding:.2rem .4rem;white-space:nowrap;font-weight:600">${period}</td>
                  <td style="padding:.2rem .4rem;color:var(--text-500)">${esc(p.note||'')}</td>
                  <td style="padding:.2rem .4rem;text-align:right"><button class="btn-del-row" onclick="removeFestivalPresence('${f.id}','${p.id}')" title="Supprimer">✕</button></td>
                </tr>`;
              }).join('')}
            </table>`
          : `<p style="font-size:.82rem;color:var(--text-400);margin:.2rem 0 .5rem">Aucune présence enregistrée.</p>`}
      </div>
      <div style="display:flex;gap:.4rem;align-items:center;flex-wrap:wrap">
        <input type="date" id="fest-pres-start-${f.id}" style="font-size:.8rem;padding:.3rem .5rem;border:1px solid var(--border-input);border-radius:var(--rx);font-family:inherit" />
        <span style="font-size:.8rem;color:var(--text-400)">→</span>
        <input type="date" id="fest-pres-end-${f.id}" style="font-size:.8rem;padding:.3rem .5rem;border:1px solid var(--border-input);border-radius:var(--rx);font-family:inherit" />
        <input type="text" id="fest-pres-note-${f.id}" placeholder="Note…" style="flex:1;min-width:100px;font-size:.8rem;padding:.3rem .5rem;border:1px solid var(--border-input);border-radius:var(--rx);font-family:inherit" />
        <button class="btn-primary" style="padding:.3rem .7rem;font-size:.8rem" onclick="addFestivalPresence('${f.id}')">+ Présence</button>
      </div>

      ${(() => {
        const fTasks = f.tasks || [];
        const pending = fTasks.filter(t => !t.done);
        const done = fTasks.filter(t => t.done);
        const row = t => {
          const dueBadge = t.dueDate
            ? `<span class="task-due task-due-editable${t.dueDate < today() ? ' overdue' : ''}" style="font-size:.75rem;cursor:pointer" data-date="${t.dueDate}" onclick="openTaskDatePicker(this,'festival-task','${f.id}','${t.id}')" title="Modifier la date">${t.dueDate}</span>`
            : `<span class="task-due task-due-add" style="font-size:.75rem;cursor:pointer" data-date="" onclick="openTaskDatePicker(this,'festival-task','${f.id}','${t.id}')" title="Ajouter une date">+ date</span>`;
          return `<div class="task-card${t.done ? ' done' : ''}" style="margin-bottom:.25rem">
            <input type="checkbox" class="task-check" ${t.done ? 'checked' : ''} onclick="toggleTaskDone('festival-task','${f.id}','${t.id}');openFestivalDetail('${f.id}')" />
            <div class="task-body" style="flex:1;min-width:0">
              <span class="task-text">${esc(t.text)}</span>
              <span class="task-meta">${dueBadge}<span class="badge badge-urgence-${t.urgency||'normal'}">${esc(t.urgency||'normal')}</span></span>
            </div>
            <button class="task-del-btn" onclick="deleteFestivalTask('${f.id}','${t.id}');openFestivalDetail('${f.id}')" title="Supprimer">✕</button>
          </div>`;
        };
        const n = done.length;
        const showLbl = `Afficher ${n} tâche${n>1?'s':''} terminée${n>1?'s':''}`;
        return `<div class="detail-section-title" style="display:flex;align-items:center;justify-content:space-between;margin-top:.75rem">Tâches
            <button class="btn-quick-task-toggle" onclick="var f=document.getElementById('qt-f');f.classList.toggle('hidden');f.querySelector('input[type=text]').focus()">+ Tâche</button>
          </div>
          <div id="qt-f" class="quick-task-form hidden">
            <input type="text" id="qt-f-text" placeholder="Description de la tâche…" class="form-input" style="flex:1;min-width:100px" />
            <select id="qt-f-urg" class="form-select" style="width:auto">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="critique">Critique</option>
              <option value="faible">Faible</option>
            </select>
            <input type="date" id="qt-f-date" class="form-input" style="width:auto" />
            <button onclick="saveQuickFestivalTask('${f.id}')" class="btn-save" style="padding:.25rem .75rem;font-size:.8rem">Ajouter</button>
            <button onclick="document.getElementById('qt-f').classList.add('hidden')" class="btn-cancel" style="padding:.25rem .5rem;font-size:.8rem">✕</button>
          </div>
          ${pending.length ? pending.map(row).join('') : '<p style="font-size:.82rem;color:var(--text-400);margin:.2rem 0 .5rem">Aucune tâche en cours.</p>'}
          ${n ? `<button class="btn-show-done" onclick="var d=document.getElementById('done-f-${f.id}');d.classList.toggle('hidden');this.textContent=d.classList.contains('hidden')?'${showLbl}':'Masquer les terminées'">${showLbl}</button>
          <div id="done-f-${f.id}" class="hidden">${done.map(row).join('')}</div>` : ''}`;
      })()}

      ${f.notes ? `<div class="detail-section-title" style="margin-top:.75rem">Notes</div><div class="detail-notes">${esc(f.notes)}</div>` : ''}

      <div class="detail-actions">
        <button class="btn-cancel" onclick="closeModal('detail');confirmDeleteFestival('${f.id}')">Supprimer</button>
      </div>
    </div>`;

  document.getElementById('detail-nav-prev').disabled = _fIdx <= 0;
  document.getElementById('detail-nav-next').disabled = _fIdx >= _fList.length - 1;
  document.getElementById('modal-detail').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  el.scrollTop = 0;
}

function confirmDeleteFestival(id) {
  _pendingDelete = { type: 'festival', id };
  openModal('confirm');
}

function addFestivalPresence(festId) {
  const f = state.festivals.find(x => x.id === festId);
  if (!f) return;
  const dateStart = document.getElementById(`fest-pres-start-${festId}`)?.value || '';
  const dateEnd   = document.getElementById(`fest-pres-end-${festId}`)?.value   || '';
  const note = document.getElementById(`fest-pres-note-${festId}`)?.value.trim() || '';
  if (!dateStart) { alert('Veuillez sélectionner une date de début.'); return; }
  if (!Array.isArray(f.presences)) f.presences = [];
  f.presences.push({ id: uid(), dateStart, dateEnd, note, done: false });
  saveState();
  renderTasks();
  openFestivalDetail(festId);
}

function removeFestivalPresence(festId, presId) {
  const f = state.festivals.find(x => x.id === festId);
  if (!f) return;
  f.presences = (f.presences || []).filter(p => p.id !== presId);
  saveState();
  renderTasks();
  openFestivalDetail(festId);
}

// ── Festival form linking ──────────────────────────
function addFestContactRow(link = {}) {
  const tbody = document.getElementById('fest-contacts-body');
  if (!tbody) return;
  const tr = document.createElement('tr');
  const opts = state.contacts.map(c =>
    `<option value="${c.id}" ${link.contactId === c.id ? 'selected' : ''}>${esc(c.name)}${c.company ? ' – ' + esc(c.company) : ''}</option>`
  ).join('');
  tr.innerHTML = `
    <td><select><option value="">— Choisir un contact —</option>${opts}</select></td>
    <td><input type="text" placeholder="Note…" value="${esc(link.note || '')}" /></td>
    <td><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}

function getFestContactLinksFromForm() {
  const tbody = document.getElementById('fest-contacts-body');
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr')).map(tr => ({
    contactId: tr.querySelector('select')?.value || '',
    note:      tr.querySelector('input[type="text"]')?.value.trim() || '',
  })).filter(l => l.contactId);
}

function populateFestContactLinksForm(links = []) {
  const tbody = document.getElementById('fest-contacts-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  links.forEach(l => addFestContactRow(l));
}

function addFestGameRow(link = {}) {
  const tbody = document.getElementById('fest-games-body');
  if (!tbody) return;
  const tr = document.createElement('tr');
  const opts = state.prototypes.map(p =>
    `<option value="${p.id}" ${link.protoId === p.id ? 'selected' : ''}>${esc(p.title)}</option>`
  ).join('');
  tr.innerHTML = `
    <td><select><option value="">— Choisir un jeu —</option>${opts}</select></td>
    <td><input type="text" placeholder="Note…" value="${esc(link.note || '')}" /></td>
    <td><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}

function getFestGameLinksFromForm() {
  const tbody = document.getElementById('fest-games-body');
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr')).map(tr => ({
    protoId: tr.querySelector('select')?.value || '',
    note:    tr.querySelector('input[type="text"]')?.value.trim() || '',
  })).filter(l => l.protoId);
}

function populateFestGameLinksForm(links = []) {
  const tbody = document.getElementById('fest-games-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  links.forEach(l => addFestGameRow(l));
}

function addFestPhotoRow(url = '') {
  const tbody = document.getElementById('fest-photos-body');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="url" placeholder="https://…" value="${esc(url)}" style="width:100%" /></td>
    <td style="width:36px;text-align:center"><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}

function getFestPhotosFromForm() {
  const tbody = document.getElementById('fest-photos-body');
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr'))
    .map(tr => tr.querySelector('input')?.value.trim() || '')
    .filter(Boolean);
}

function populateFestPhotosForm(photos = []) {
  const tbody = document.getElementById('fest-photos-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  photos.forEach(url => addFestPhotoRow(url));
}

// ── Festival CRUD ──────────────────────────────────
function resetFestivalForm() {
  document.getElementById('festival-id').value          = '';
  document.getElementById('festival-name').value        = '';
  document.getElementById('festival-city').value        = '';
  document.getElementById('festival-address').value     = '';
  document.getElementById('festival-distance').value    = '';
  document.getElementById('festival-poster-url').value  = '';
  document.getElementById('festival-date-start').value  = '';
  document.getElementById('festival-date-end').value    = '';
  document.getElementById('festival-notes').value       = '';
  document.getElementById('festival-category').value    = 'festival';
  document.getElementById('festival-participating').checked = false;
  document.getElementById('festival-protos').checked    = false;
  document.getElementById('festival-cost-transport').value = '';
  document.getElementById('festival-cost-parking').value   = '';
  document.getElementById('festival-cost-ticket').value    = '';
  document.getElementById('festival-cost-food').value      = '';
  document.getElementById('festival-cost-lodging').value   = '';
  populateFestContactLinksForm([]);
  populateFestGameLinksForm([]);
  populateFestPhotosForm([]);
  document.getElementById('modal-festival-title').textContent = 'Nouveau festival';
}

function editFestival(id) {
  const f = state.festivals.find(x => x.id === id);
  if (!f) return;
  const c = f.costs || {};
  document.getElementById('festival-id').value          = f.id;
  document.getElementById('festival-name').value        = f.name        || '';
  document.getElementById('festival-city').value        = f.city        || '';
  document.getElementById('festival-address').value     = f.address     || '';
  document.getElementById('festival-distance').value    = f.distance    || '';
  document.getElementById('festival-poster-url').value  = f.posterUrl   || '';
  document.getElementById('festival-date-start').value  = f.dateStart   || '';
  document.getElementById('festival-date-end').value    = f.dateEnd     || '';
  document.getElementById('festival-notes').value       = f.notes       || '';
  document.getElementById('festival-category').value    = f.category    || 'festival';
  document.getElementById('festival-participating').checked = !!f.participating;
  document.getElementById('festival-protos').checked    = !!f.protos;
  document.getElementById('festival-cost-transport').value = c.transport || '';
  document.getElementById('festival-cost-parking').value   = c.parking   || '';
  document.getElementById('festival-cost-ticket').value    = c.ticket    || '';
  document.getElementById('festival-cost-food').value      = c.food      || '';
  document.getElementById('festival-cost-lodging').value   = c.lodging   || '';
  populateFestContactLinksForm(f.contactLinks || []);
  populateFestGameLinksForm(f.gameLinks || []);
  populateFestPhotosForm(f.photos || []);
  document.getElementById('modal-festival-title').textContent = 'Modifier le festival';
  openModal('festival');
}

function submitFestival(e) {
  e.preventDefault();
  const id = document.getElementById('festival-id').value;
  const data = {
    name:          document.getElementById('festival-name').value.trim(),
    city:          document.getElementById('festival-city').value.trim(),
    address:       document.getElementById('festival-address').value.trim(),
    distance:      document.getElementById('festival-distance').value.trim(),
    posterUrl:     document.getElementById('festival-poster-url').value.trim(),
    dateStart:     document.getElementById('festival-date-start').value,
    dateEnd:       document.getElementById('festival-date-end').value,
    notes:         document.getElementById('festival-notes').value.trim(),
    category:      document.getElementById('festival-category').value,
    participating: document.getElementById('festival-participating').checked,
    protos:        document.getElementById('festival-protos').checked,
    costs: {
      transport: parseFloat(document.getElementById('festival-cost-transport').value) || 0,
      parking:   parseFloat(document.getElementById('festival-cost-parking').value)   || 0,
      ticket:    parseFloat(document.getElementById('festival-cost-ticket').value)    || 0,
      food:      parseFloat(document.getElementById('festival-cost-food').value)      || 0,
      lodging:   parseFloat(document.getElementById('festival-cost-lodging').value)   || 0,
    },
    contactLinks: getFestContactLinksFromForm(),
    gameLinks:    getFestGameLinksFromForm(),
    photos:       getFestPhotosFromForm(),
  };
  if (id) {
    const i = state.festivals.findIndex(x => x.id === id);
    state.festivals[i] = { ...state.festivals[i], ...data };
  } else {
    state.festivals.unshift({ id: uid(), createdAt: today(), ...data });
  }
  saveState();
  closeModal('festival');
  renderFestivals();
}

// ── Festivals filters init ─────────────────────────
(function initFestivalsFilters() {
  // Search
  document.getElementById('festivals-search')?.addEventListener('input', e => {
    state.festivalsSearch = e.target.value;
    renderFestivals();
  });

  // Filter panel toggle
  document.getElementById('festivals-filter-toggle')?.addEventListener('click', () => {
    const body = document.getElementById('festivals-filter-body');
    const chev = document.getElementById('festivals-chevron');
    const panel = document.getElementById('festivals-filter-panel');
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : '';
    chev?.classList.toggle('open', !open);
    panel?.classList.toggle('expanded', !open);
  });

  // Category filter
  document.getElementById('festivals-category-filter')?.addEventListener('change', e => {
    state.festivalsCategory = e.target.value;
    renderFestivals();
  });

  // Participating filter
  document.getElementById('festivals-participating-filter')?.addEventListener('change', e => {
    state.festivalsParticipating = e.target.value;
    renderFestivals();
  });

  // Sort select
  document.getElementById('festivals-sort')?.addEventListener('change', e => {
    state.festivalsSort = e.target.value;
    renderFestivals();
  });

  // Sort order button
  document.getElementById('festivals-sort-order')?.addEventListener('click', () => {
    state.festivalsSortAsc = !state.festivalsSortAsc;
    const ico = document.getElementById('festivals-sort-icon');
    if (ico) ico.innerHTML = state.festivalsSortAsc ? ICONS.chevUp : ICONS.chevDown;
    renderFestivals();
  });

  // View toggle
  document.getElementById('festivals-view-grid')?.addEventListener('click', () => {
    state.festivalsView = 'grid';
    renderFestivals();
  });
  document.getElementById('festivals-view-timeline')?.addEventListener('click', () => {
    state.festivalsView = 'timeline';
    renderFestivals();
  });

  // Zoom slider
  document.getElementById('festivals-zoom')?.addEventListener('input', e => {
    state.festivalsZoom = parseInt(e.target.value);
    renderFestivals();
  });

  // Filter reset
  document.getElementById('festivals-filter-reset')?.addEventListener('click', () => {
    state.festivalsCategory = '';
    state.festivalsParticipating = '';
    document.getElementById('festivals-category-filter').value = '';
    document.getElementById('festivals-participating-filter').value = '';
    renderFestivals();
  });
})();

// ═══════════════════════════════════════════════════
// RENDEZ-VOUS (APPOINTMENTS)
// ═══════════════════════════════════════════════════
function openRdvModal(apptId = null) {
  const modal = document.getElementById('modal-rdv');
  if (!modal) return;

  const appt = apptId ? state.appointments.find(a => a.id === apptId) : null;
  const isEdit = !!appt;

  document.getElementById('rdv-modal-title').textContent = isEdit ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous';
  document.getElementById('rdv-id').value   = appt?.id   || '';
  document.getElementById('rdv-date').value = appt?.date || today();
  document.getElementById('rdv-time').value = appt?.time || '';
  document.getElementById('rdv-lieu').value = appt?.lieu || '';
  document.getElementById('rdv-note').value = appt?.note || '';

  const deleteBtn = document.getElementById('rdv-delete-btn');
  if (deleteBtn) deleteBtn.style.display = isEdit ? '' : 'none';

  // Contact select
  const selContact = document.getElementById('rdv-contact');
  if (selContact) {
    const cur = appt?.contactId || '';
    const sorted = [...state.contacts].sort((a, b) => (a.name||'').localeCompare(b.name||'', 'fr'));
    selContact.innerHTML = `<option value="">— Aucun contact —</option>` +
      sorted.map(c => `<option value="${esc(c.id)}" ${cur === c.id ? 'selected' : ''}>${esc(c.name)}${c.company ? ' – ' + esc(c.company) : ''}</option>`).join('');
  }

  // Game select
  const selGame = document.getElementById('rdv-game');
  if (selGame) {
    const cur = appt?.gameId || '';
    const sorted = [...state.prototypes]
      .filter(p => p.status !== 'non-retenu' && p.status !== 'abandonné')
      .sort((a, b) => (a.title||'').localeCompare(b.title||'', 'fr'));
    selGame.innerHTML = `<option value="">— Aucun jeu —</option>` +
      sorted.map(p => `<option value="${esc(p.id)}" ${cur === p.id ? 'selected' : ''}>🎲 ${esc(p.title)}</option>`).join('');
  }

  openModal('rdv');
  document.getElementById('rdv-date').focus();
}

function submitRdv(e) {
  e.preventDefault();
  const id        = document.getElementById('rdv-id').value;
  const date      = document.getElementById('rdv-date').value;
  const time      = document.getElementById('rdv-time').value;
  const lieu      = document.getElementById('rdv-lieu').value.trim();
  const note      = document.getElementById('rdv-note').value.trim();
  const contactId = document.getElementById('rdv-contact').value;
  const gameId    = document.getElementById('rdv-game').value;

  if (id) {
    const appt = state.appointments.find(a => a.id === id);
    if (appt) {
      appt.date = date; appt.time = time; appt.lieu = lieu;
      appt.note = note; appt.contactId = contactId; appt.gameId = gameId;
    }
  } else {
    state.appointments.push({ id: uid(), date, time, lieu, note, contactId, gameId, createdAt: new Date().toISOString() });
  }

  saveState();
  closeModal('rdv');
  renderAgenda();
}

function deleteRdv() {
  const id = document.getElementById('rdv-id').value;
  if (!id) return;
  state.appointments = state.appointments.filter(a => a.id !== id);
  saveState();
  closeModal('rdv');
  renderAgenda();
}

// ═══════════════════════════════════════════════════
// AGENDA
// ═══════════════════════════════════════════════════
function renderAgendaStats(entries) {
  const el = document.getElementById('agenda-stats-sidebar');
  if (!el) return;
  if (!entries.length) { el.innerHTML = ''; return; }

  const total = entries.length;
  const contactEntries  = entries.filter(e => e._source === 'contact');
  const festivalEntries = entries.filter(e => e._source === 'festival');
  const jeuxEntries     = entries.filter(e => e._source === 'jeux');
  const rdvEntries      = entries.filter(e => e._source === 'rdv');

  // Par type d'échange (contacts uniquement)
  const EXCH_EMOJI = { rencontre: '🤝', email: '📧', appel: '📞', salon: '🎪', message: '💬', autre: '📝' };
  const typeCounts = {};
  contactEntries.forEach(e => {
    const t = e.type || 'autre';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  // Cette année / ce mois
  const now = new Date();
  const thisYear  = `${now.getFullYear()}`;
  const thisMonth = `${thisYear}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const countYear  = entries.filter(e => (e.date||'').startsWith(thisYear)).length;
  const countMonth = entries.filter(e => (e.date||'').startsWith(thisMonth)).length;
  const rdvUpcoming = rdvEntries.filter(e => e.date > new Date().toISOString().split('T')[0]).length;

  el.innerHTML = `
    <div class="fstat-block">
      <div class="fstat-title">Échanges</div>
      <div class="fstat-big">${total}</div>
      ${countMonth ? `<div class="fstat-sub">Ce mois · ${countMonth}</div>` : ''}
      ${countYear  ? `<div class="fstat-sub">${thisYear} · ${countYear}</div>` : ''}
    </div>

    ${rdvEntries.length ? `
    <div class="fstat-block">
      <div class="fstat-title">Rendez-vous</div>
      <div class="fstat-big">${rdvEntries.length}</div>
      ${rdvUpcoming ? `<div class="fstat-sub" style="color:#6d28d9">À venir · ${rdvUpcoming}</div>` : ''}
    </div>` : ''}

    <div class="fstat-block">
      <div class="fstat-title">Par source</div>
      ${contactEntries.length  ? `<div class="fstat-row"><span>👤 Contacts</span><span class="fstat-row-val">${contactEntries.length}</span></div>` : ''}
      ${jeuxEntries.length     ? `<div class="fstat-row"><span>🎲 Jeux</span><span class="fstat-row-val">${jeuxEntries.length}</span></div>` : ''}
      ${festivalEntries.length ? `<div class="fstat-row"><span>🎪 Festivals</span><span class="fstat-row-val">${festivalEntries.length}</span></div>` : ''}
    </div>

    ${Object.keys(typeCounts).length ? `
    <div class="fstat-block">
      <div class="fstat-title">Par type</div>
      ${Object.entries(EXCHANGE_TYPES.reduce((acc, t) => { if (typeCounts[t]) acc[t] = typeCounts[t]; return acc; }, {})).map(([t, n]) =>
        `<div class="fstat-row"><span>${EXCH_EMOJI[t]||'📝'} ${t.charAt(0).toUpperCase()+t.slice(1)}</span><span class="fstat-row-val">${n}</span></div>`
      ).join('')}
    </div>` : ''}
  `;
}

function renderAgenda() {
  const listEl  = document.getElementById('agenda-list');
  const emptyEl = document.getElementById('agenda-empty');

  // Gather all exchanges
  const entries = [];
  state.contacts.forEach(c => {
    (c.exchanges || []).forEach(e => {
      entries.push({
        ...e,
        _source: 'contact',
        contactId:   c.id,
        contactName: c.name,
        contactCat:  c.category,
        contactPhoto: c.photo,
      });
    });
  });
  // Festival presences
  (state.festivals || []).forEach(f => {
    (f.presences || []).forEach(p => {
      entries.push({
        id: p.id,
        date: p.dateStart || p.date || '',
        dateEnd: p.dateEnd || '',
        note: p.note,
        _source: 'festival',
        festivalId:   f.id,
        festivalName: f.name,
        festivalCat:  f.category,
      });
    });
  });
  // Prototype devLog entries
  (state.prototypes || []).forEach(p => {
    (p.devLog || []).forEach(e => {
      entries.push({
        ...e,
        _source: 'jeux',
        protoId:    p.id,
        protoTitle: p.title,
        protoStatus: p.status,
      });
    });
    // Evaluation date
    const evalDate = p.evaluation?.date;
    if (evalDate) {
      entries.push({
        id:         `eval-${p.id}`,
        date:       evalDate,
        _source:    'evals',
        protoId:    p.id,
        protoTitle: p.title,
        protoStatus: p.status,
      });
    }
    // Test sessions
    (p.testSessions || []).forEach(s => {
      entries.push({
        id:          `test-${s.id}`,
        date:        s.date || today(),
        _source:     'tests',
        protoId:     p.id,
        protoTitle:  p.title,
        testPlayers: s.players,
        testRating:  s.rating,
      });
    });
  });
  // Done tasks (contacts + prototypes) — only tasks with a real doneAt date
  state.contacts.forEach(c => {
    (c.tasks || []).filter(t => t.done && t.doneAt).forEach(t => {
      entries.push({
        id: t.id,
        date: t.doneAt.slice(0, 10),
        _source: 'tasks',
        taskText:     t.text,
        taskUrgency:  t.urgency || 'normal',
        taskFrom:     'contact',
        taskFromId:   c.id,
        taskFromName: c.name,
        taskFromCat:  c.category,
        taskFromPhoto: c.photo,
      });
    });
  });
  (state.prototypes || []).forEach(p => {
    (p.tasks || []).filter(t => t.done && t.doneAt).forEach(t => {
      entries.push({
        id: t.id,
        date: t.doneAt.slice(0, 10),
        _source: 'tasks',
        taskText:     t.text,
        taskUrgency:  t.urgency || 'normal',
        taskFrom:     'prototype',
        taskFromId:   p.id,
        taskFromName: p.title,
      });
    });
  });
  (state.festivals || []).forEach(f => {
    (f.tasks || []).filter(t => t.done && t.doneAt).forEach(t => {
      entries.push({
        id: t.id,
        date: t.doneAt.slice(0, 10),
        _source: 'tasks',
        taskText:     t.text,
        taskUrgency:  t.urgency || 'normal',
        taskFrom:     'festival',
        taskFromId:   f.id,
        taskFromName: f.name,
      });
    });
  });
  // Admin card completions (monthly history + punctual doneAt)
  (state.adminCards || []).forEach(card => {
    const catLabel = adminCatInfo(card.category).label;
    if (card.recurrence === 'monthly') {
      (card.completionHistory || []).forEach(h => {
        if (h.doneAt) {
          entries.push({
            id:           `admin-${card.id}-${h.month}`,
            date:         h.doneAt.slice(0, 10),
            _source:      'tasks',
            taskText:     card.title,
            taskUrgency:  card.urgency || 'normal',
            taskFrom:     'admin',
            taskFromId:   card.id,
            taskFromName: catLabel,
          });
        }
      });
    } else if (card.status === 'fait' && card.doneAt) {
      entries.push({
        id:           `admin-${card.id}`,
        date:         card.doneAt.slice(0, 10),
        _source:      'tasks',
        taskText:     card.title,
        taskUrgency:  card.urgency || 'normal',
        taskFrom:     'admin',
        taskFromId:   card.id,
        taskFromName: catLabel,
      });
    }
  });

  // Appointments (RDVs) — included regardless of date (past AND future)
  (state.appointments || []).forEach(a => {
    entries.push({
      id:         a.id,
      date:       a.date,
      time:       a.time || '',
      _source:    'rdv',
      rdvId:      a.id,
      rdvLieu:    a.lieu || '',
      rdvNote:    a.note || '',
      rdvContactId: a.contactId || '',
      rdvGameId:    a.gameId    || '',
    });
  });

  // Exclude future events (date strictly after today) — RDV entries bypass this filter
  const todayStr = today();
  const pastEntries = entries.filter(e => e._source === 'rdv' || !e.date || e.date <= todayStr);

  document.getElementById('nav-agenda-count').textContent = pastEntries.length;

  // Source filter (Contacts / Jeux / Festivals / Tâches / RDV)
  const activeSrc = state.agendaSourceFilter || [];
  const showRdv       = activeSrc.length === 0 || activeSrc.includes('rdv');
  const showContacts  = activeSrc.length === 0 || activeSrc.includes('contacts');
  const showJeux      = activeSrc.length === 0 || activeSrc.includes('jeux');
  const showFestivals = activeSrc.length === 0 || activeSrc.includes('festivals');
  const showTasks     = activeSrc.length === 0 || activeSrc.includes('tasks');
  const showEvals     = activeSrc.length === 0 || activeSrc.includes('evals');
  const showTests     = activeSrc.length === 0 || activeSrc.includes('tests');

  // Type filter — applies to contact exchanges
  const activeTypes = state.agendaTypeFilters || [];
  let filtered = pastEntries.filter(e => {
    if (e._source === 'rdv')     return showRdv;
    if (e._source === 'festival') return showFestivals;
    if (e._source === 'jeux')    return showJeux;
    if (e._source === 'evals')   return showEvals;
    if (e._source === 'tests')   return showTests;
    if (e._source === 'tasks')   return showTasks;
    if (!showContacts) return false;
    if (activeTypes.length === 0) return true;
    const t = e.type || 'autre';
    return activeTypes.some(f => {
      if (f === 'message') return t === 'message' || t === 'email';
      return t === f;
    });
  });

  document.getElementById('agenda-count').textContent =
    `${filtered.length} échange${filtered.length !== 1 ? 's' : ''}${activeTypes.length || activeSrc.length ? ' (filtré)' : ''}`;

  renderAgendaStats(pastEntries);  // stats on past/present events only

  if (filtered.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  // Sort (use date+time for RDV to get proper ordering within same day)
  const sortKey = e => e.date + (e.time ? 'T' + e.time : '');
  filtered.sort((a, b) => state.agendaSortAsc
    ? sortKey(a).localeCompare(sortKey(b))
    : sortKey(b).localeCompare(sortKey(a))
  );

  // Group by month
  const groups = {};
  filtered.forEach(e => {
    const d = new Date(e.date);
    const key = isNaN(d) ? 'Date inconnue' : d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    (groups[key] = groups[key] || []).push(e);
  });

  const EXCH_EMOJI = { rencontre: '🤝', email: '📧', appel: '📞', salon: '🎪', message: '💬', autre: '📝' };

  const isoWeekInfo = dateStr => {
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const day = d.getDay() || 7;
    const mon = new Date(d); mon.setDate(d.getDate() - day + 1);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const jan4 = new Date(mon.getFullYear(), 0, 4);
    const w1mon = new Date(jan4); w1mon.setDate(jan4.getDate() - (jan4.getDay() || 7) + 1);
    const weekNum = Math.round((mon - w1mon) / 604800000) + 1;
    const key = `${mon.getFullYear()}-W${String(weekNum).padStart(2,'0')}`;
    const monDay = mon.toLocaleDateString('fr-FR', { day: 'numeric' });
    const sunStr = mon.getMonth() === sun.getMonth()
      ? sun.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
      : sun.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return { key, label: `Semaine ${weekNum} — ${monDay} au ${sunStr}` };
  };

  let html = '';

  for (const [month, evts] of Object.entries(groups)) {
    html += `<div class="agenda-month-header">${month}</div>`;
    let lastWeekKey = null;
    evts.forEach(e => {
      const d = new Date(e.date);
      const dateStr = isNaN(d) ? e.date : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
      if (!isNaN(d)) {
        const wi = isoWeekInfo(e.date);
        if (wi && wi.key !== lastWeekKey) {
          html += `<div class="agenda-week-header">${wi.label}</div>`;
          lastWeekKey = wi.key;
        }
      }
      if (e._source === 'rdv') {
        const isFuture  = e.date > todayStr;
        const timeStr   = e.time ? ` à ${e.time}` : '';
        const contact   = e.rdvContactId ? state.contacts.find(c => c.id === e.rdvContactId) : null;
        const game      = e.rdvGameId    ? state.prototypes.find(p => p.id === e.rdvGameId)  : null;
        const lieuStr   = e.rdvLieu ? ` — ${esc(e.rdvLieu)}` : '';
        const avatarHtml = contact
          ? `<div class="list-avatar list-avatar-${contact.category}" style="width:22px;height:22px;font-size:.6rem;flex-shrink:0">${initials(contact.name)}</div>`
          : '';
        const contactLabel = contact
          ? `${esc(contact.name)}${contact.company ? ' <span style="color:var(--text-500);font-weight:400">— ' + esc(contact.company) + '</span>' : ''}`
          : '<span style="color:var(--text-400);font-style:italic">Sans contact</span>';
        const gameLabel = game ? `<span class="agenda-note" style="margin-left:.5rem">🎲 ${esc(game.title)}</span>` : '';
        html += `<div class="agenda-entry${isFuture ? ' agenda-entry-future' : ''}" onclick="openRdvModal('${e.rdvId}')">
          <span class="agenda-date">${dateStr}${timeStr}</span>
          <span class="agenda-type-badge"><span class="badge" style="background:#ede9fe;border:1px solid #c4b5fd;color:#6d28d9;font-size:.7rem">📅 RDV</span></span>
          <div class="agenda-contact-wrap">${avatarHtml}<span class="agenda-contact-name">${contactLabel}</span>${gameLabel}</div>
          ${lieuStr || e.rdvNote ? `<span class="agenda-note">${lieuStr}${e.rdvNote ? (lieuStr ? ' · ' : '— ') + esc(e.rdvNote) : ''}</span>` : ''}
        </div>`;
      } else if (e._source === 'evals') {
        html += `<div class="agenda-entry" onclick="openDetail('prototype','${e.protoId}')">
          <span class="agenda-date">${dateStr}</span>
          <span class="agenda-type-badge"><span class="badge" style="background:#fef9c3;border:1px solid #fde047;color:#854d0e;font-size:.7rem">⭐ Éval</span></span>
          <div class="agenda-contact-wrap">
            <span class="agenda-contact-name" style="color:var(--text-700);font-weight:600">🎲 ${esc(e.protoTitle)}</span>
          </div>
        </div>`;
      } else if (e._source === 'tests') {
        const playersStr = e.testPlayers ? `— Test à ${e.testPlayers} joueur${e.testPlayers > 1 ? 's' : ''}` : '';
        const starsStr   = e.testRating  ? ' ' + '⭐'.repeat(e.testRating) : '';
        html += `<div class="agenda-entry" onclick="openDetail('prototype','${e.protoId}')">
          <span class="agenda-date">${dateStr}</span>
          <span class="agenda-type-badge"><span class="badge" style="background:#dbeafe;border:1px solid #93c5fd;color:#1d4ed8;font-size:.7rem">🧪 Session</span></span>
          <div class="agenda-contact-wrap">
            <span class="agenda-contact-name" style="color:var(--text-700);font-weight:600">🎲 ${esc(e.protoTitle)}</span>
          </div>
          ${playersStr || starsStr ? `<span class="agenda-note">${playersStr}${starsStr}</span>` : ''}
        </div>`;
      } else if (e._source === 'jeux') {
        html += `<div class="agenda-entry" onclick="openDetail('prototype','${e.protoId}')">
          <span class="agenda-date">${dateStr}</span>
          <span class="agenda-type-badge"><span class="badge" style="background:var(--bg);border:1px solid var(--border-input);font-size:.7rem">🎲 Dev</span></span>
          <div class="agenda-contact-wrap">
            <span class="agenda-contact-name" style="color:var(--text-700);font-weight:600">🎲 ${esc(e.protoTitle)}</span>
          </div>
          ${e.note ? `<span class="agenda-note">— ${esc(e.note)}</span>` : ''}
        </div>`;
      } else if (e._source === 'festival') {
        const festIcon = FEST_ICONS[e.festivalCat] || '🎪';
        const fmtAg = d => d ? new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}) : null;
        const endStr = fmtAg(e.dateEnd);
        const periodStr = endStr && endStr !== dateStr ? `${dateStr} → ${endStr}` : dateStr;
        html += `<div class="agenda-entry" onclick="openFestivalDetail('${e.festivalId}')">
          <span class="agenda-date">${periodStr}</span>
          <span class="agenda-type-badge"><span class="badge badge-fest-${e.festivalCat}" style="font-size:.7rem">${festIcon} Présence</span></span>
          <div class="agenda-contact-wrap">
            <span style="font-size:.95rem">${festIcon}</span>
            <span class="agenda-contact-name" style="color:var(--text-700);font-weight:600">${esc(e.festivalName)}</span>
          </div>
          ${e.note ? `<span class="agenda-note">— ${esc(e.note)}</span>` : ''}
        </div>`;
      } else if (e._source === 'tasks') {
        const nav = e.taskFrom === 'contact'
          ? `openDetail('contact','${e.taskFromId}')`
          : e.taskFrom === 'festival'
            ? `openFestivalDetail('${e.taskFromId}')`
            : e.taskFrom === 'admin'
              ? `switchPage('admin')`
              : `openDetail('prototype','${e.taskFromId}')`;
        const fromIcon = e.taskFrom === 'contact' ? '👤' : e.taskFrom === 'festival' ? '🎪' : e.taskFrom === 'admin' ? '🗂️' : '🎲';
        const avatarHtml = e.taskFromPhoto
          ? `<img src="${esc(e.taskFromPhoto)}" class="agenda-avatar" alt="" />`
          : e.taskFromCat
            ? `<div class="list-avatar list-avatar-${e.taskFromCat}" style="width:24px;height:24px;font-size:.6rem;flex-shrink:0">${initials(e.taskFromName)}</div>`
            : `<span style="font-size:.95rem">${fromIcon}</span>`;
        html += `<div class="agenda-entry" onclick="${nav}">
          <span class="agenda-date">${dateStr}</span>
          <span class="agenda-type-badge"><span class="badge" style="background:#dcfce7;border:1px solid #86efac;color:#15803d;font-size:.7rem">✅ Tâche</span></span>
          <div class="agenda-contact-wrap">${avatarHtml}<span class="agenda-contact-name${e.taskFromCat ? ' badge-'+e.taskFromCat : ''}">${esc(e.taskFromName)}</span></div>
          <span class="agenda-note">— ${esc(e.taskText)}</span>
        </div>`;
      } else {
        const avatarHtml = e.contactPhoto
          ? `<img src="${esc(e.contactPhoto)}" class="agenda-avatar" alt="" />`
          : `<div class="list-avatar list-avatar-${e.contactCat}" style="width:24px;height:24px;font-size:.6rem;flex-shrink:0">${initials(e.contactName)}</div>`;
        const emoji = EXCH_EMOJI[e.type] || '📝';
        html += `<div class="agenda-entry" onclick="openDetail('contact','${e.contactId}')">
          <span class="agenda-date">${dateStr}</span>
          <span class="agenda-type-badge"><span class="badge" style="background:var(--bg);border:1px solid var(--border-input);font-size:.7rem">${emoji} ${esc(e.type||'autre')}</span></span>
          <div class="agenda-contact-wrap">${avatarHtml}<span class="agenda-contact-name badge-${e.contactCat}">${esc(e.contactName)}</span></div>
          ${e.note ? `<span class="agenda-note">— ${esc(e.note)}</span>` : ''}
        </div>`;
      }
    });
  }
  listEl.innerHTML = html;
}

function onTasksSourceFilter(checkbox) {
  const val = checkbox.value;
  if (checkbox.checked) {
    if (!state.tasksSourceFilter.includes(val)) state.tasksSourceFilter.push(val);
  } else {
    state.tasksSourceFilter = state.tasksSourceFilter.filter(v => v !== val);
  }
  renderTasks();
}

function onAgendaSourceFilter(checkbox) {
  const val = checkbox.value;
  if (checkbox.checked) {
    if (!state.agendaSourceFilter.includes(val)) state.agendaSourceFilter.push(val);
  } else {
    state.agendaSourceFilter = state.agendaSourceFilter.filter(v => v !== val);
  }
  renderAgenda();
}

function onAgendaTypeFilter(checkbox) {
  const val = checkbox.value;
  if (checkbox.checked) {
    if (!state.agendaTypeFilters.includes(val)) state.agendaTypeFilters.push(val);
  } else {
    state.agendaTypeFilters = state.agendaTypeFilters.filter(v => v !== val);
  }
  renderAgenda();
}

function toggleAgendaSort() {
  state.agendaSortAsc = !state.agendaSortAsc;
  const ico = document.getElementById('agenda-sort-icon');
  if (ico) ico.innerHTML = state.agendaSortAsc ? '<polyline points="18 15 12 9 6 15"/>' : '<polyline points="6 9 12 15 18 9"/>';
  renderAgenda();
}

// ═══════════════════════════════════════════════════
// COMPARATOR
// ═══════════════════════════════════════════════════
function toggleCompareMode() {
  state.compareMode = !state.compareMode;
  state.selectedForCompare = [];
  const btn = document.getElementById('prototypes-compare-toggle');
  if (btn) btn.style.background = state.compareMode ? 'var(--primary-100)' : '';
  const bar = document.getElementById('compare-bar');
  if (bar) bar.style.display = state.compareMode ? '' : 'none';
  renderPrototypes();
}
function exitCompareMode() {
  state.compareMode = false;
  state.selectedForCompare = [];
  const btn = document.getElementById('prototypes-compare-toggle');
  if (btn) btn.style.background = '';
  const bar = document.getElementById('compare-bar');
  if (bar) bar.style.display = 'none';
  renderPrototypes();
}
function toggleCompareSelect(protoId, checkbox) {
  const idx = state.selectedForCompare.indexOf(protoId);
  if (checkbox.checked && idx === -1) {
    if (state.selectedForCompare.length >= 3) {
      checkbox.checked = false;
      return;
    }
    state.selectedForCompare.push(protoId);
  } else if (!checkbox.checked && idx !== -1) {
    state.selectedForCompare.splice(idx, 1);
  }
  updateCompareBar();
}
function updateCompareBar() {
  const slots = document.getElementById('compare-bar-slots');
  const goBtn = document.getElementById('compare-bar-go');
  if (!slots || !goBtn) return;
  const items = state.selectedForCompare.map(id => {
    const p = state.prototypes.find(x => x.id === id);
    return `<div class="compare-bar-slot filled" title="${esc(p?.title||'')}">${PROTO_ICONS[p?.status]||'🎮'}</div>`;
  });
  while (items.length < 2) items.push('<div class="compare-bar-slot">?</div>');
  slots.innerHTML = items.join('');
  goBtn.disabled = state.selectedForCompare.length < 2;
}
function openCompareModal() {
  if (state.selectedForCompare.length < 2) return;
  const protos = state.selectedForCompare.map(id => state.prototypes.find(x => x.id === id)).filter(Boolean);
  const fields = [
    ['Statut', p => `<span class="badge badge-${p.status}">${esc(p.status)}</span>`],
    ['Intérêt', p => '⭐'.repeat(p.interest||3)],
    ['Genre', p => esc(p.genre||'—')],
    ['Joueurs', p => esc(p.players||'—')],
    ['Durée', p => esc(p.duration||'—')],
    ['Âge', p => esc(p.age||'—')],
    ['Tags', p => (p.tags||[]).map(t=>`<span class="tag-chip">${esc(t)}</span>`).join(' ')||'—'],
    ['Tâches en cours', p => String((p.tasks||[]).filter(t=>!t.done).length)],
    ['Contacts liés', p => String((p.contactLinks||[]).length)],
  ];
  const headerRow = `<th style="width:20%">Critère</th>${protos.map(p => `<th>${PROTO_ICONS[p.status]||'🎮'} ${esc(p.title)}</th>`).join('')}`;
  const rows = fields.map(([label, fn]) =>
    `<tr><td style="font-weight:600;font-size:.8rem;color:var(--text-600)">${label}</td>${protos.map(p=>`<td>${fn(p)}</td>`).join('')}</tr>`
  ).join('');
  document.getElementById('compare-modal-content').innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:.85rem">
      <thead><tr style="background:var(--bg)">${headerRow}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  document.getElementById('modal-compare').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// ═══════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════
function openModal(type) {
  document.getElementById('modal-' + type).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeModal(type) {
  document.getElementById('modal-' + type).classList.add('hidden');
  document.body.style.overflow = '';
  if (type === 'contact')   resetContactForm();
  if (type === 'prototype') resetPrototypeForm();
  if (type === 'festival')  resetFestivalForm();
}

document.querySelectorAll('.modal-overlay').forEach(ov =>
  ov.addEventListener('click', e => {
    if (e.target === ov) closeModal(ov.id.replace('modal-', ''));
  })
);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['contact','prototype','festival','detail','confirm','compare','standalone-task','rdv'].forEach(t =>
      document.getElementById('modal-' + t)?.classList.add('hidden')
    );
    document.body.style.overflow = '';
  }
  if (e.key === 'ArrowLeft'  && !document.getElementById('modal-detail').classList.contains('hidden')) navigateDetail(-1);
  if (e.key === 'ArrowRight' && !document.getElementById('modal-detail').classList.contains('hidden')) navigateDetail(1);
});

// ── Contact form ──────────────────────────────────
function resetContactForm() {
  ['contact-id','contact-name','contact-email','contact-phone',
   'contact-company','contact-company-logo','contact-website','contact-notes',
   'contact-photo-url'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('contact-photo-file').value = '';
  document.getElementById('contact-category').value = '';
  _updatePhotoPreview('contact', '');
  populateTasksForm('contact', []);
  populateGamesForm([]);
  populateExchangesForm([]);
  populateSocialsForm([]);
  populateVideosForm('contact', []);
  const favEl = document.getElementById('contact-favorite');
  if (favEl) favEl.checked = false;
  document.getElementById('modal-contact-title').textContent = 'Nouveau contact';
}

function editContact(id) {
  const c = state.contacts.find(x => x.id === id);
  if (!c) return;
  document.getElementById('contact-id').value        = c.id;
  document.getElementById('contact-name').value      = c.name;
  document.getElementById('contact-category').value  = c.category;
  document.getElementById('contact-email').value     = c.email    || '';
  document.getElementById('contact-phone').value     = c.phone    || '';
  document.getElementById('contact-company').value      = c.company      || '';
  document.getElementById('contact-company-logo').value = c.companyLogo  || '';
  document.getElementById('contact-website').value      = c.website      || '';
  document.getElementById('contact-notes').value     = c.notes    || '';
  document.getElementById('contact-photo-url').value = c.photo    || '';
  _updatePhotoPreview('contact', c.photo || '');
  populateTasksForm('contact', c.tasks || []);
  populateGamesForm(c.games || []);
  populateExchangesForm(c.exchanges || []);
  populateSocialsForm(c.socials || []);
  populateVideosForm('contact', c.videos || []);
  const favEl = document.getElementById('contact-favorite');
  if (favEl) favEl.checked = !!c.favorite;
  document.getElementById('modal-contact-title').textContent = 'Modifier le contact';
  openModal('contact');
}

function submitContact(e) {
  e.preventDefault();
  const id  = document.getElementById('contact-id').value;
  const newTasks = getTasksFromForm('contact');
  const data = {
    name:           document.getElementById('contact-name').value.trim(),
    category:       document.getElementById('contact-category').value,
    email:          document.getElementById('contact-email').value.trim(),
    phone:          document.getElementById('contact-phone').value.trim(),
    company:        document.getElementById('contact-company').value.trim(),
    companyLogo:    document.getElementById('contact-company-logo').value.trim(),
    website:        document.getElementById('contact-website').value.trim(),
    notes:          document.getElementById('contact-notes').value.trim(),
    photo:     document.getElementById('contact-photo-url').value.trim(),
    exchanges: getExchangesFromForm(),
    socials:   getSocialsFromForm(),
    videos:    getVideosFromForm('contact'),
    games:     getGamesFromForm(),
    favorite:  document.getElementById('contact-favorite')?.checked || false,
  };
  if (id) {
    const i = state.contacts.findIndex(x => x.id === id);
    const existing = state.contacts[i];
    // Preserve done state for tasks that already exist
    data.tasks = newTasks.map(t => {
      const old = (existing.tasks || []).find(o => o.id === t.id);
      return old ? { ...t, done: old.done, doneAt: old.doneAt } : t;
    });
    state.contacts[i] = { ...existing, ...data };
  } else {
    state.contacts.unshift({ id: uid(), createdAt: today(), tasks: newTasks, ...data });
  }
  saveState(); closeModal('contact'); renderContacts();
}

// ── Prototype form ────────────────────────────────
function resetPrototypeForm() {
  ['prototype-id','prototype-title','prototype-genre','prototype-players',
   'prototype-duration','prototype-age','prototype-description',
   'prototype-notes','proto-photo-url','proto-emoji'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('prototype-status').value = '';
  document.getElementById('proto-photo-file').value = '';
  _updatePhotoPreview('proto', '');
  clearProtoPdf(); // also clears proto-pdf-url
  const intEl = document.querySelector('input[name="proto-interest"][value="3"]');
  if (intEl) { intEl.checked = true; updateInterestUI(3); }
  populateTasksForm('proto', []);
  populateContactLinksForm([]);
  populateDevLogForm([]);
  populateVideosForm('proto', []);
  populateCostsForm([]);
  populateTestSessionsForm([]);
  const tagsEl = document.getElementById('prototype-tags');
  if (tagsEl) tagsEl.value = '';
  document.getElementById('modal-prototype-title').textContent = 'Nouveau prototype';
}

function editPrototype(id) {
  const p = state.prototypes.find(x => x.id === id);
  if (!p) return;
  document.getElementById('prototype-id').value          = p.id;
  document.getElementById('prototype-title').value       = p.title;
  document.getElementById('prototype-status').value      = p.status;
  document.getElementById('prototype-genre').value       = p.genre        || '';
  document.getElementById('prototype-players').value     = p.players      || '';
  document.getElementById('prototype-duration').value    = p.duration     || '';
  document.getElementById('prototype-age').value         = p.age          || '';
  document.getElementById('prototype-description').value = p.description  || '';
  document.getElementById('prototype-notes').value       = p.notes        || '';
  document.getElementById('proto-photo-url').value       = p.photo        || '';
  _updatePhotoPreview('proto', p.photo || '');
  const emojiEl = document.getElementById('proto-emoji');
  if (emojiEl) emojiEl.value = p.emoji || '';

  const intVal = p.interest || 3;
  const intEl = document.querySelector(`input[name="proto-interest"][value="${intVal}"]`);
  if (intEl) { intEl.checked = true; updateInterestUI(intVal); }

  populateTasksForm('proto', p.tasks || []);
  populateContactLinksForm(p.contactLinks || []);
  populateDevLogForm(p.devLog || []);
  populateVideosForm('proto', p.videos || []);
  populateCostsForm(p.costs || []);
  populateTestSessionsForm(p.testSessions || []);

  const tagsEl = document.getElementById('prototype-tags');
  if (tagsEl) tagsEl.value = (p.tags || []).join(', ');

  // PDF
  _protoPdfData = p.pdf || null;
  const pdfUrlEl = document.getElementById('proto-pdf-url');
  if (pdfUrlEl) pdfUrlEl.value = p.pdfUrl || '';
  document.getElementById('proto-pdf-name').textContent =
    p.pdfUrl ? 'Lien externe' : (p.pdfName || (p.pdf ? 'Règles.pdf' : 'Aucun fichier'));
  const link = document.getElementById('proto-pdf-link');
  if (p.pdf) { link.href = p.pdf; link.style.display = ''; }
  else        { link.style.display = 'none'; }

  document.getElementById('modal-prototype-title').textContent = 'Modifier le prototype';
  openModal('prototype');
}

function submitPrototype(e) {
  e.preventDefault();
  const id      = document.getElementById('prototype-id').value;
  const intVal  = parseInt(document.querySelector('input[name="proto-interest"]:checked')?.value || 3);
  const pdfUrl  = document.getElementById('proto-pdf-url')?.value.trim() || null;
  const pdfName = _protoPdfData
    ? (document.getElementById('proto-pdf-name').textContent || 'Règles.pdf')
    : null;
  const newTasks = getTasksFromForm('proto');
  const newLinks = getContactLinksFromForm();
  const tagsRaw = document.getElementById('prototype-tags')?.value.trim() || '';
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
  const data = {
    title:        document.getElementById('prototype-title').value.trim(),
    status:       document.getElementById('prototype-status').value,
    genre:        document.getElementById('prototype-genre').value.trim(),
    players:      document.getElementById('prototype-players').value.trim(),
    duration:     document.getElementById('prototype-duration').value.trim(),
    age:          document.getElementById('prototype-age').value.trim(),
    description:  document.getElementById('prototype-description').value.trim(),
    contactLinks: newLinks,
    notes:        document.getElementById('prototype-notes').value.trim(),
    interest:     intVal,
    photo:        document.getElementById('proto-photo-url').value.trim(),
    emoji:        document.getElementById('proto-emoji')?.value.trim() || '',
    pdf:          _protoPdfData,
    pdfName,
    pdfUrl,
    tags,
    devLog:       getDevLogFromForm(),
    videos:       getVideosFromForm('proto'),
    costs:        getCostsFromForm(),
    testSessions: getTestSessionsFromForm(),
  };
  if (id) {
    const i = state.prototypes.findIndex(x => x.id === id);
    const existing = state.prototypes[i];
    data.tasks = newTasks.map(t => {
      const old = (existing.tasks || []).find(o => o.id === t.id);
      return old ? { ...t, done: old.done, doneAt: old.doneAt } : t;
    });
    state.prototypes[i] = { ...existing, ...data };
    updateTestCounterTasks(state.prototypes[i]);
  } else {
    state.prototypes.unshift({ id: uid(), createdAt: today(), tasks: newTasks, ...data });
    updateTestCounterTasks(state.prototypes[0]);
  }
  saveState(); closeModal('prototype'); renderPrototypes();
}

// ── Delete ────────────────────────────────────────
let _pendingDelete = null;

function confirmDelete(type, id) {
  _pendingDelete = { type, id };
  openModal('confirm');
}

document.getElementById('btn-confirm-delete').addEventListener('click', () => {
  if (!_pendingDelete) return;
  const { type, id } = _pendingDelete;
  if (type === 'contact') {
    state.contacts = state.contacts.filter(x => x.id !== id);
    saveState(); renderContacts();
  } else if (type === 'festival') {
    state.festivals = state.festivals.filter(x => x.id !== id);
    saveState(); renderFestivals();
  } else {
    state.prototypes = state.prototypes.filter(x => x.id !== id);
    saveState(); renderPrototypes();
  }
  _pendingDelete = null;
  closeModal('confirm');
  document.getElementById('modal-detail').classList.add('hidden');
  document.body.style.overflow = '';
});

// ── Detail view ───────────────────────────────────
let _detailType = null, _detailId = null, _detailTab = 'fiche';

// ── Evaluation constants ──────────────────────────
const EVAL_PRIMARY = [
  'Originalité de la mécanique',
  'Potentiel commercial',
  'Rejouabilité',
  'Adéquation ligne éditoriale BBG',
  'Durée de partie adaptée',
];
const EVAL_SECONDARY = [
  'Qualité du matériel/proto',
  'Clarté des règles',
  'Équilibre',
  'Interaction entre joueurs',
  'Thématique',
];

function getEval(p) {
  const ev = p.evaluation || {};
  return {
    primary:     Array.isArray(ev.primary)   ? ev.primary   : EVAL_PRIMARY.map(() => ({ score: 0, comment: '' })),
    secondary:   Array.isArray(ev.secondary) ? ev.secondary : EVAL_SECONDARY.map(() => ({ score: 0, comment: '' })),
    strengths:   ev.strengths   || '',
    improvements:ev.improvements|| '',
    questions:   ev.questions   || '',
    suggestions: ev.suggestions || '',
    status:      ev.status      || '',
    nextSteps:   ev.nextSteps   || '',
    date:        ev.date        || '',
  };
}

function setEvalScore(protoId, type, idx, score) {
  const p = state.prototypes.find(x => x.id === protoId);
  if (!p) return;
  if (!p.evaluation) p.evaluation = {};
  const key = type === 'primary' ? 'primary' : 'secondary';
  const defs = type === 'primary' ? EVAL_PRIMARY : EVAL_SECONDARY;
  if (!Array.isArray(p.evaluation[key])) p.evaluation[key] = defs.map(() => ({ score: 0, comment: '' }));
  const cur = p.evaluation[key][idx]?.score || 0;
  p.evaluation[key][idx].score = cur === score ? 0 : score;
  saveState();
  renderEvalPanel(protoId);
}

function saveEvalField(protoId, path, value) {
  const p = state.prototypes.find(x => x.id === protoId);
  if (!p) return;
  if (!p.evaluation) p.evaluation = {};
  const ev = p.evaluation;
  const parts = path.split('.');
  if (parts.length === 3) {
    const key = parts[0], idx = parseInt(parts[1]), field = parts[2];
    const defs = key === 'primary' ? EVAL_PRIMARY : EVAL_SECONDARY;
    if (!Array.isArray(ev[key])) ev[key] = defs.map(() => ({ score: 0, comment: '' }));
    if (!ev[key][idx]) ev[key][idx] = { score: 0, comment: '' };
    ev[key][idx][field] = value;
  } else {
    ev[path] = value;
  }
  saveState();
}

function renderEvalPanel(protoId) {
  const panel = document.getElementById('detail-panel-test');
  const p = state.prototypes.find(x => x.id === protoId);
  if (panel && p) panel.innerHTML = buildEvalPanel(p);
}

function switchDetailTab(tab) {
  _detailTab = tab;
  const fiche = document.getElementById('detail-panel-fiche');
  const test  = document.getElementById('detail-panel-test');
  if (fiche) fiche.classList.toggle('hidden', tab !== 'fiche');
  if (test)  test.classList.toggle('hidden', tab !== 'test');
  document.querySelectorAll('.detail-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );
}

function buildEvalPanel(p) {
  const ev = getEval(p);
  const total = ev.primary.reduce((s, c) => s + (c.score || 0), 0);
  const pct = Math.round(total / 25 * 100);
  const authors = (p.contactLinks || []).map(l => {
    const c = state.contacts.find(x => x.id === l.contactId);
    return c ? c.name : '';
  }).filter(Boolean).join(', ');

  const stars = (type, idx, score) =>
    [1,2,3,4,5].map(n =>
      `<button class="eval-star-btn${(score||0) >= n ? ' on' : ''}" onclick="setEvalScore('${p.id}','${type}',${idx},${n})">★</button>`
    ).join('');

  const trows = (names, arr, type) => names.map((name, i) => `
    <tr>
      <td class="eval-td-name">${esc(name)}</td>
      <td><div class="eval-star-row">${stars(type, i, arr[i]?.score || 0)}</div></td>
      <td><input type="text" class="eval-comment-input" value="${esc(arr[i]?.comment || '')}"
        onblur="saveEvalField('${p.id}','${type}.${i}.comment',this.value)" placeholder="Commentaire…" /></td>
    </tr>`).join('');

  const ta = (field, val, rows) =>
    `<textarea class="eval-textarea" rows="${rows}"
      onblur="saveEvalField('${p.id}','${field}',this.value)">${esc(val || '')}</textarea>`;

  return `<div class="eval-panel">
    <div class="eval-panel-title">GRILLE D'ÉVALUATION DE PROTOTYPE — BIG BUDI GAMES</div>

    <div class="eval-block-title">INFORMATIONS DU PROTOTYPE</div>
    <div class="eval-info-grid">
      <span class="eval-info-label">Titre du jeu</span><span>${esc(p.title)}</span>
      ${authors  ? `<span class="eval-info-label">Auteur(s)</span><span>${esc(authors)}</span>`  : ''}
      ${p.genre  ? `<span class="eval-info-label">Type de jeu</span><span>${esc(p.genre)}</span>` : ''}
      ${p.players? `<span class="eval-info-label">Joueurs</span><span>${esc(p.players)}</span>`   : ''}
      ${p.duration?`<span class="eval-info-label">Durée</span><span>${esc(p.duration)}</span>`    : ''}
      ${p.age    ? `<span class="eval-info-label">Âge</span><span>${esc(p.age)} ans+</span>`      : ''}
      <span class="eval-info-label">Date d'évaluation</span>
      <span><input type="date" class="form-input" style="padding:.15rem .4rem;font-size:.8rem;width:auto"
        value="${esc(ev.date)}" onchange="saveEvalField('${p.id}','date',this.value)" /></span>
    </div>

    <div class="eval-block-title">CRITÈRES D'ÉVALUATION <span style="font-weight:400;font-size:.7rem">(1 à 5 étoiles)</span></div>
    <table class="eval-table">
      <thead><tr><th>Critère</th><th style="width:115px">Note (/5)</th><th>Commentaires</th></tr></thead>
      <tbody>${trows(EVAL_PRIMARY, ev.primary, 'primary')}</tbody>
    </table>
    <div class="eval-score-bar">
      <span class="eval-score-label">SCORE TOTAL</span>
      <span class="eval-score-num">${total}</span>
      <span class="eval-score-max">/25 points</span>
      <span class="eval-score-pct">${pct}%</span>
    </div>

    <div class="eval-block-title">CRITÈRES SECONDAIRES <span style="font-weight:400;font-size:.7rem">(Optionnel)</span></div>
    <table class="eval-table">
      <thead><tr><th>Critère</th><th style="width:115px">Note (/5)</th><th>Commentaires</th></tr></thead>
      <tbody>${trows(EVAL_SECONDARY, ev.secondary, 'secondary')}</tbody>
    </table>

    <div class="eval-block-title">ANALYSE DÉTAILLÉE</div>
    <div class="eval-analysis-grid">
      <div><label class="eval-label">Points forts</label>${ta('strengths', ev.strengths, 4)}</div>
      <div><label class="eval-label">Points à améliorer</label>${ta('improvements', ev.improvements, 4)}</div>
      <div><label class="eval-label">Questions pour l'auteur</label>${ta('questions', ev.questions, 3)}</div>
      <div><label class="eval-label">Suggestions d'amélioration</label>${ta('suggestions', ev.suggestions, 3)}</div>
    </div>

    <div class="eval-block-title">DÉCISION FINALE</div>
    <div class="eval-decision-grid">
      <div>
        <label class="eval-label">Statut</label>
        <select class="form-select" style="width:100%;font-size:.82rem"
          onchange="saveEvalField('${p.id}','status',this.value)">
          <option value="">— Choisir —</option>
          ${["Intéressant – à suivre","En attente de modifications","Refusé","Accepté pour publication"].map(o =>
            `<option value="${o}"${ev.status === o ? ' selected' : ''}>${o}</option>`
          ).join('')}
        </select>
      </div>
      <div>
        <label class="eval-label">Prochaines étapes</label>
        ${ta('nextSteps', ev.nextSteps, 2)}
      </div>
    </div>

    <div style="margin-top:1.25rem;display:flex;gap:.6rem;flex-wrap:wrap">
      <button class="btn-save" onclick="openEvalReport('${p.id}')">📄 Générer le rapport auteur</button>
      <button class="btn-evaluated${p.status==='évalué'?' active':''}" onclick="markProtoEvalued('${p.id}')">${p.status==='évalué' ? '↩ Repasser en À évaluer' : '✅ Jeu Évalué'}</button>
    </div>
  </div>`;
}

function openEvalReport(protoId) {
  const p = state.prototypes.find(x => x.id === protoId);
  if (!p) return;
  const ev = getEval(p);
  const authors = (p.contactLinks || []).map(l => {
    const c = state.contacts.find(x => x.id === l.contactId);
    return c ? c.name : '';
  }).filter(Boolean).join(', ');
  const dateStr = ev.date
    ? new Date(ev.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })
    : new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });
  const total = ev.primary.reduce((s, c) => s + (c.score || 0), 0);
  const pct = Math.round(total / 25 * 100);

  const sec = (title, body) => body
    ? `<div class="eval-report-section"><div class="eval-report-section-title">${title}</div><div class="eval-report-section-body">${esc(body).replace(/\n/g,'<br>')}</div></div>`
    : '';

  const content = document.getElementById('eval-report-content');
  if (!content) return;
  content.innerHTML = `<div class="eval-report">
    <div class="eval-report-header">RAPPORT D'ÉVALUATION — BIG BUDI GAMES</div>
    <div class="eval-report-meta">
      <div><strong>Date :</strong> ${esc(dateStr)}</div>
      <div><strong>Titre du jeu :</strong> ${esc(p.title)}</div>
      ${authors ? `<div><strong>Auteur :</strong> ${esc(authors)}</div>` : ''}
    </div>
    <p class="eval-report-salut">Madame, Monsieur,</p>
    <p class="eval-report-intro">Nous avons eu le plaisir d'analyser votre prototype <em>« ${esc(p.title)} »</em>. Veuillez trouver ci-dessous notre retour détaillé :</p>
    ${sec('POINTS FORTS', ev.strengths)}
    ${sec("SUGGESTIONS D'AMÉLIORATION", ev.improvements)}
    ${sec('QUESTIONS', ev.questions)}
    <div class="eval-report-section">
      <div class="eval-report-section-title">CONCLUSION</div>
      <div class="eval-report-section-body">
        ${ev.suggestions ? esc(ev.suggestions).replace(/\n/g,'<br>') + '<br><br>' : ''}
        ${ev.status   ? `<strong>Décision :</strong> ${esc(ev.status)}<br>`                                    : ''}
        ${ev.nextSteps? `<strong>Prochaines étapes :</strong> ${esc(ev.nextSteps).replace(/\n/g,'<br>')}` : ''}
      </div>
    </div>
    <div class="eval-report-footer">
      <p>Cordialement,</p>
      <p><strong>L'équipe Big Budi Games</strong></p>
    </div>
  </div>`;
  document.getElementById('eval-report-overlay').classList.remove('hidden');
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '✓';
    btn.style.color = 'var(--success, #16a34a)';
    setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; }, 2000);
  });
}

function copyEvalReport() {
  const content = document.getElementById('eval-report-content');
  if (!content) return;
  navigator.clipboard.writeText(content.innerText).then(() => {
    const btn = document.getElementById('eval-copy-btn');
    const orig = btn.textContent;
    btn.textContent = '✓ Copié !';
    setTimeout(() => btn.textContent = orig, 2000);
  });
}

function markProtoEvalued(protoId) {
  const p = state.prototypes.find(x => x.id === protoId);
  if (!p) return;
  p.status = p.status === 'évalué' ? 'tester' : 'évalué'; // toggle
  saveState();
  renderPrototypes();
  if (state.activePage === 'home') renderDashboard();
  openDetail('prototype', protoId);
}

function navigateDetail(dir) {
  if (!_detailType || !_detailId) return;
  if (_detailType === 'festival') {
    const list = filteredFestivals();
    const ids = list.map(x => x.id);
    const idx = ids.indexOf(_detailId);
    if (idx === -1) return;
    const next = idx + dir;
    if (next < 0 || next >= ids.length) return;
    openFestivalDetail(ids[next]);
    return;
  }
  const list = _detailType === 'contact'
    ? filteredContacts()
    : filteredPrototypes();
  const ids = list.map(x => x.id || x.itemId);
  const idx = ids.indexOf(_detailId);
  if (idx === -1) return;
  const next = idx + dir;
  if (next < 0 || next >= ids.length) return;
  openDetail(_detailType, ids[next]);
}

function openDetail(type, id) {
  _detailType = type;
  _detailId = id;
  const el = document.getElementById('modal-detail-content');

  if (type === 'contact') {
    const c = state.contacts.find(x => x.id === id);
    if (!c) return;
    const avatar = c.photo
      ? `<img src="${esc(c.photo)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--border)" alt="" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display=''" />
         <div class="card-avatar card-avatar-${c.category}" style="position:static;transform:none;width:44px;height:44px;font-size:1rem;display:none">${initials(c.name)}</div>`
      : `<div class="card-avatar card-avatar-${c.category}" style="position:static;transform:none;width:44px;height:44px;font-size:1rem">${initials(c.name)}</div>`;

    const gamesHtml = (c.games || []).length > 0
      ? `<div class="detail-section-title">Jeux associés</div>
         <div class="game-list-wrap"><table class="game-list-table">
           <thead><tr><th>Jeu</th><th>Statut</th><th>Notes</th></tr></thead>
           <tbody>${c.games.map(g => `<tr>
             <td>${esc(g.title||'')}</td><td>${esc(g.statut||'')}</td><td>${esc(g.notes||'')}</td>
           </tr>`).join('')}</tbody>
         </table></div>`
      : '';

    // Exchanges timeline
    const EXCH_EMOJI_LOC = { rencontre:'🤝', email:'📧', appel:'📞', salon:'🎪', message:'💬', developpement:'🛠️', autre:'📝' };
    const exchSorted = [...(c.exchanges||[])].sort((a,b) => b.date.localeCompare(a.date));
    const typeOpts = EXCHANGE_TYPES.map(t =>
      `<option value="${t}">${(EXCH_EMOJI_LOC[t]||'📝')} ${t.charAt(0).toUpperCase()+t.slice(1)}</option>`
    ).join('');
    const meetHtml = `<div class="detail-section-title" style="display:flex;align-items:center;justify-content:space-between">Historique des échanges
        <button class="btn-quick-task-toggle" onclick="var f=document.getElementById('qe-form');f.classList.toggle('hidden');f.querySelector('select').focus()">+ Échange</button>
      </div>
      <div id="qe-form" class="quick-task-form hidden">
        <input type="date" id="qe-date" class="form-input" value="${today()}" style="width:auto" />
        <select id="qe-type" class="form-select" style="width:auto">${typeOpts}</select>
        <input type="text" id="qe-note" placeholder="Note…" class="form-input" style="flex:1;min-width:100px" />
        <button onclick="saveQuickExchange('${c.id}')" class="btn-save" style="padding:.25rem .75rem;font-size:.8rem">Ajouter</button>
        <button onclick="document.getElementById('qe-form').classList.add('hidden')" class="btn-cancel" style="padding:.25rem .5rem;font-size:.8rem">✕</button>
      </div>
      ${exchSorted.length > 0 ? `<div class="exchange-list">${exchSorted.map(e => `
        <div class="exchange-item">
          <span class="exchange-date">${e.date}</span>
          <span class="exchange-type">${esc(e.type||'rencontre')}</span>
          <span class="exchange-note">${esc(e.note||'')}</span>
        </div>`).join('')}
      </div>` : ''}`;

    // Socials
    const socialsDetailHtml = (c.socials||[]).length > 0
      ? `<div class="detail-section-title">Réseaux sociaux</div>
         <div class="social-links">${(c.socials||[]).map(s =>
           `<a class="social-icon" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.type)} ↗</a>`
         ).join('')}</div>`
      : '';

    // Videos
    const videosDetailHtml = (c.videos||[]).length > 0
      ? `<div class="detail-section-title">Vidéos</div>
         <div class="video-list">${(c.videos||[]).map(v => {
           const ytId = getYoutubeId(v.url);
           const thumb = ytId
             ? `<img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" class="video-thumb" alt="" />`
             : `<div class="video-thumb-placeholder">🎬</div>`;
           return `<div class="video-item">
             <a href="${esc(v.url)}" target="_blank" rel="noopener">${thumb}</a>
             <div class="video-info">
               <span class="video-title">${esc(v.title || v.url)}</span>
               <a class="video-link" href="${esc(v.url)}" target="_blank" rel="noopener">Ouvrir ↗</a>
             </div>
           </div>`;
         }).join('')}</div>`
      : '';

    const _cList = filteredContacts();
    const _cIdx  = _cList.findIndex(x => x.id === id);

    el.innerHTML = `
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:.75rem;flex:1;min-width:0">
          ${avatar}
          <div style="min-width:0">
            <div style="font-size:1.05rem;font-weight:700;color:var(--text-800)">${esc(c.name)}</div>
            ${c.company ? `<div style="font-size:.8rem;color:var(--text-500)">${esc(c.company)}</div>` : ''}
          </div>
          <span class="badge badge-${c.category}" style="margin-left:auto;flex-shrink:0">${esc(c.category)}</span>
        </div>
        <button class="btn-pdf-detail" onclick="exportContactPdf('${c.id}')" title="Exporter en PDF">📄 PDF</button>
        <button class="btn-edit-detail" onclick="closeModal('detail');editContact('${c.id}')" title="Modifier">${ICONS.pencil}</button>
        <button class="modal-close" onclick="closeModal('detail')" style="flex-shrink:0;margin-left:.5rem">✕</button>
      </div>
      <div class="detail-inner">
        <div class="detail-section-title">Coordonnées</div>
        <div class="detail-kv-grid">
          ${c.email  ? `<div class="detail-kv"><label>Email</label><span style="display:flex;align-items:center;gap:.4rem">${esc(c.email)}<button class="btn-copy-inline" onclick="copyText('${esc(c.email)}',this)" title="Copier l'email">⎘</button></span></div>` : ''}
          ${c.phone  ? `<div class="detail-kv"><label>Téléphone</label><span>${esc(c.phone)}</span></div>` : ''}
          ${c.website? `<div class="detail-kv"><label>Site web</label>
            <a href="${esc(c.website)}" target="_blank" rel="noopener">${esc(c.website.replace(/^https?:\/\//,''))}</a></div>` : ''}
        </div>
        ${(() => {
          const allT = c.tasks||[];
          const pending = allT.filter(t => !t.done);
          const done    = allT.filter(t => t.done);
          const row = t => `
            <div class="detail-task-row">
              <input type="checkbox" ${t.done?'checked':''} style="width:14px;height:14px;cursor:pointer;accent-color:var(--primary-600)"
                onchange="toggleTaskDone('contact','${c.id}','${t.id}');openDetail('contact','${c.id}')" />
              <span class="badge badge-urgence-${t.urgency||'normal'}">${esc(t.urgency||'normal')}</span>
              <span style="font-size:.875rem;color:var(--text-700);${t.done?'text-decoration:line-through;opacity:.5':''}">${esc(t.text)}</span>
              ${(t.done && t.doneAt) ? `<span class="task-done-at" title="Terminée le ${new Date(t.doneAt).toLocaleString('fr-FR')}">✓ ${new Date(t.doneAt).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</span>` : ''}
            </div>`;
          const n = done.length;
          const showLbl = `Afficher ${n} tâche${n>1?'s':''} terminée${n>1?'s':''}`;
          return `<div class="detail-section-title" style="display:flex;align-items:center;justify-content:space-between">Tâches
              <button class="btn-quick-task-toggle" onclick="var f=document.getElementById('qt-c');f.classList.toggle('hidden');f.querySelector('input[type=text]').focus()">+ Tâche</button>
            </div>
            <div id="qt-c" class="quick-task-form hidden">
              <input type="text" id="qt-c-text" placeholder="Description de la tâche…" class="form-input" style="flex:1;min-width:100px" />
              <select id="qt-c-urg" class="form-select" style="width:auto">
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critique">Critique</option>
                <option value="faible">Faible</option>
              </select>
              <input type="date" id="qt-c-date" class="form-input" style="width:auto" />
              <button onclick="saveQuickTask('contact','${c.id}')" class="btn-save" style="padding:.25rem .75rem;font-size:.8rem">Ajouter</button>
              <button onclick="document.getElementById('qt-c').classList.add('hidden')" class="btn-cancel" style="padding:.25rem .5rem;font-size:.8rem">✕</button>
            </div>
            ${pending.map(row).join('')}
            ${n ? `<button class="btn-show-done" onclick="var d=document.getElementById('done-c-${c.id}');d.classList.toggle('hidden');this.textContent=d.classList.contains('hidden')?'${showLbl}':'Masquer les terminées'">${showLbl}</button>
            <div id="done-c-${c.id}" class="hidden">${done.map(row).join('')}</div>` : ''}`;
        })()}
        ${socialsDetailHtml}
        ${videosDetailHtml}
        ${meetHtml}
        ${gamesHtml}
        ${c.notes ? `<div class="detail-section-title">Notes</div>
          <div class="detail-notes">${esc(c.notes)}</div>` : ''}
        ${(() => {
          const linked = state.prototypes.filter(p =>
            (p.contactLinks || []).some(l => l.contactId === c.id)
          );
          if (!linked.length) return '';
          return `<div class="detail-section-title">Prototypes liés</div>
            <div style="display:flex;flex-direction:column;gap:.35rem;margin-top:.25rem">
              ${linked.map(p => {
                const role = (p.contactLinks||[]).find(l=>l.contactId===c.id)?.role || '';
                return `<div style="display:flex;align-items:center;gap:.5rem;cursor:pointer"
                  onclick="closeModal('detail');openDetail('prototype','${p.id}')">
                  <span style="font-size:1rem">${PROTO_ICONS[p.status]||'🎮'}</span>
                  <span style="font-size:.875rem;font-weight:600;color:var(--primary-600)">${esc(p.title)}</span>
                  ${role ? `<span style="font-size:.75rem;color:var(--text-500)">(${esc(role)})</span>` : ''}
                  <span class="badge badge-${p.status}" style="margin-left:auto">${PROTO_ICONS[p.status]||'🎮'} ${esc(STATUS_LABELS[p.status]||p.status)}</span>
                </div>`;
              }).join('')}
            </div>`;
        })()}
        <div class="detail-actions">
          <button class="btn-cancel" onclick="closeModal('detail');confirmDelete('contact','${c.id}')">Supprimer</button>
        </div>
      </div>`;
    document.getElementById('detail-nav-prev').disabled = _cIdx <= 0;
    document.getElementById('detail-nav-next').disabled = _cIdx >= _cList.length - 1;

  } else {
    const p = state.prototypes.find(x => x.id === id);
    if (!p) return;
    const icon = PROTO_ICONS[p.status] || '🎮';
    const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' }) : '';

    // Build contact links section
    const contactLinksHtml = (() => {
      const links = (p.contactLinks || []);
      if (!links.length) return '';
      const rows = links.map(l => {
        const contact = state.contacts.find(x => x.id === l.contactId);
        if (!contact) return '';
        return `<div style="display:flex;align-items:center;gap:.5rem;cursor:pointer;margin-top:.3rem"
          onclick="closeModal('detail');openDetail('contact','${contact.id}')">
          ${contact.photo
            ? `<img src="${esc(contact.photo)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display=''" />
               <div class="card-avatar card-avatar-${contact.category}" style="position:static;transform:none;width:28px;height:28px;font-size:.65rem;flex-shrink:0;display:none">${initials(contact.name)}</div>`
            : `<div class="card-avatar card-avatar-${contact.category}" style="position:static;transform:none;width:28px;height:28px;font-size:.65rem;flex-shrink:0">${initials(contact.name)}</div>`}
          <span style="font-size:.875rem;font-weight:600;color:var(--primary-600)">${esc(contact.name)}</span>
          ${l.role ? `<span style="font-size:.75rem;color:var(--text-500)">(${esc(l.role)})</span>` : ''}
          ${contact.category ? `<span class="badge badge-${contact.category}" style="margin-left:auto">${esc(contact.category)}</span>` : ''}
        </div>`;
      }).filter(Boolean).join('');
      return rows ? `<div class="detail-section-title">Contacts associés</div>${rows}` : '';
    })();

    const _pList = filteredPrototypes();
    const _pIdx  = _pList.findIndex(x => x.id === id);

    el.innerHTML = `
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:.75rem;flex:1;min-width:0">
          ${p.photo
            ? `<img src="${esc(p.photo)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--border)" alt="" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display=''" />
               <span style="font-size:1.75rem;line-height:1;display:none">${icon}</span>`
            : `<span style="font-size:1.75rem;line-height:1">${icon}</span>`}
          <div style="min-width:0">
            <div style="font-size:1.05rem;font-weight:700;color:var(--text-800);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.title)}</div>
            ${p.genre ? `<div style="font-size:.8rem;color:var(--text-500)">${esc(p.genre)}</div>` : ''}
          </div>
          <span class="badge badge-${p.status}" style="margin-left:auto;flex-shrink:0">${icon} ${esc(STATUS_LABELS[p.status]||p.status)}</span>
        </div>
        <button class="btn-pdf-detail" onclick="exportPrototypePdf('${p.id}')" title="Exporter en PDF">📄 PDF</button>
        <button class="btn-edit-detail" onclick="closeModal('detail');editPrototype('${p.id}')" title="Modifier">${ICONS.pencil}</button>
        <button class="modal-close" onclick="closeModal('detail')" style="flex-shrink:0;margin-left:.5rem">✕</button>
      </div>
      ${(() => {
        const ev = getEval(p);
        const done = ev.primary.some(c => (c.score||0) > 0) || ev.status !== '';
        const testLabel = done
          ? `<span style="color:#16a34a;font-size:.72rem">✅ (Fait)</span>`
          : `<span style="color:#dc2626;font-size:.72rem">🔴 (À Faire)</span>`;
        return `<div class="detail-tab-bar">
          <button class="detail-tab${_detailTab==='fiche'?' active':''}" data-tab="fiche" onclick="switchDetailTab('fiche')">📋 Fiche</button>
          <button class="detail-tab${_detailTab==='test'?' active':''}" data-tab="test" onclick="switchDetailTab('test')">🧪 Test Proto ${testLabel}</button>
        </div>`;
      })()}
      <div id="detail-panel-fiche"${_detailTab!=='fiche'?' class="hidden"':''}>
      <div class="detail-inner">
        ${p.description ? `<div class="detail-section-title">Description</div>
          <div class="detail-notes">${esc(p.description)}</div>` : ''}
        <div class="detail-section-title">Caractéristiques</div>
        <div class="detail-specs-inline">
          ${p.players  ? `<span class="spec-chip">${ICONS.users} ${esc(p.players)} joueurs</span>` : ''}
          ${p.duration ? `<span class="spec-chip">${ICONS.clock} ${esc(p.duration)}</span>` : ''}
          ${p.age      ? `<span class="spec-chip">👶 dès ${esc(p.age)} ans</span>` : ''}
          <span class="spec-chip">${'⭐'.repeat(p.interest||3)} ${INTEREST_LABELS[p.interest||3]}</span>
        </div>
        ${(() => {
          const allT = p.tasks||[];
          if (!allT.length) return '';
          const pending = allT.filter(t => !t.done);
          const done    = allT.filter(t => t.done);
          const sessionCount = (p.testSessions || []).filter(s => s.date || s.comments || s.rating).length;
          const row = t => {
            const isCounter = t.subtype === 'test_counter' && t.targetCount;
            const progressHtml = isCounter ? (() => {
              const pct = Math.min(100, Math.round(sessionCount / t.targetCount * 100));
              return `<span class="test-counter-badge">${sessionCount}/${t.targetCount}</span>
                <span class="test-counter-bar-wrap"><span class="test-counter-bar-fill" style="width:${pct}%"></span></span>`;
            })() : '';
            return `
            <div class="detail-task-row">
              <input type="checkbox" ${t.done?'checked':''} style="width:14px;height:14px;cursor:pointer;accent-color:var(--primary-600)"
                onchange="toggleTaskDone('prototype','${p.id}','${t.id}');openDetail('prototype','${p.id}')" />
              <span class="badge badge-urgence-${t.urgency||'normal'}">${esc(t.urgency||'normal')}</span>
              <span style="font-size:.875rem;color:var(--text-700);${t.done?'text-decoration:line-through;opacity:.5':''}">${esc(t.text)}</span>
              ${progressHtml}
              ${(t.done && t.doneAt) ? `<span class="task-done-at" title="Terminée le ${new Date(t.doneAt).toLocaleString('fr-FR')}">✓ ${new Date(t.doneAt).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</span>` : ''}
            </div>`;
          };
          const n = done.length;
          const showLbl = `Afficher ${n} tâche${n>1?'s':''} terminée${n>1?'s':''}`;
          return `<div class="detail-section-title" style="display:flex;align-items:center;justify-content:space-between">Tâches
              <button class="btn-quick-task-toggle" onclick="var f=document.getElementById('qt-p');f.classList.toggle('hidden');f.querySelector('input[type=text]').focus()">+ Tâche</button>
            </div>
            <div id="qt-p" class="quick-task-form hidden">
              <input type="text" id="qt-p-text" placeholder="Description de la tâche…" class="form-input" style="flex:1;min-width:100px" />
              <select id="qt-p-urg" class="form-select" style="width:auto">
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critique">Critique</option>
                <option value="faible">Faible</option>
              </select>
              <input type="date" id="qt-p-date" class="form-input" style="width:auto" />
              <button onclick="saveQuickTask('prototype','${p.id}')" class="btn-save" style="padding:.25rem .75rem;font-size:.8rem">Ajouter</button>
              <button onclick="document.getElementById('qt-p').classList.add('hidden')" class="btn-cancel" style="padding:.25rem .5rem;font-size:.8rem">✕</button>
            </div>
            ${pending.map(row).join('')}
            ${n ? `<button class="btn-show-done" onclick="var d=document.getElementById('done-p-${p.id}');d.classList.toggle('hidden');this.textContent=d.classList.contains('hidden')?'${showLbl}':'Masquer les terminées'">${showLbl}</button>
            <div id="done-p-${p.id}" class="hidden">${done.map(row).join('')}</div>` : ''}`;
        })()}
        ${contactLinksHtml}
        ${(p.tags||[]).length > 0 ? `<div class="detail-section-title">Tags mécaniques</div>
          <div class="tags-cloud">${(p.tags||[]).map(t=>`<span class="tag-chip">${esc(t)}</span>`).join('')}</div>` : ''}
        ${p.notes ? `<div class="detail-section-title">Notes de développement</div>
          <div class="detail-notes">${esc(p.notes)}</div>` : ''}
        ${(p.devLog||[]).length > 0 ? (() => {
          const renderDevEntry = e => `
            <div class="devlog-item${e.details ? '' : ' devlog-no-body'}">
              <div class="devlog-item-header" onclick="${e.details ? 'toggleDevLogItem(this)' : ''}">
                <span class="devlog-date">${new Date(e.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}</span>
                <span class="devlog-note">${esc(e.note)}</span>
                ${e.details ? `<span class="devlog-info-hint">💡</span><span class="devlog-chevron">▸</span>` : ''}
              </div>
              ${e.details ? `<div class="devlog-item-body" style="display:none">${esc(e.details).replace(/\n/g,'<br>')}</div>` : ''}
            </div>`;
          const sorted  = [...(p.devLog||[])].sort((a,b)=>b.date.localeCompare(a.date));
          const visible  = sorted.slice(0, 5);
          const hiddenEntries = sorted.slice(5);
          const hiddenId = `devlog-hidden-${p.id}`;
          const n = hiddenEntries.length;
          return `<div class="detail-section-title">Journal de développement</div>
            <div class="devlog-list">
              ${visible.map(renderDevEntry).join('')}
              ${n > 0 ? `
                <button class="btn-show-done devlog-show-more" onclick="var d=document.getElementById('${hiddenId}');d.classList.toggle('hidden');this.textContent=d.classList.contains('hidden')?'Voir ${n} entr${n>1?'ées':'ée'} plus ancienne${n>1?'s':''}…':'Masquer les anciennes'">Voir ${n} entr${n>1?'ées':'ée'} plus ancienne${n>1?'s':''}…</button>
                <div id="${hiddenId}" class="hidden">${hiddenEntries.map(renderDevEntry).join('')}</div>` : ''}
            </div>`;
        })() : ''}
        ${(p.videos||[]).length > 0 ? `<div class="detail-section-title">Vidéos</div>
          <div class="video-list">${(p.videos||[]).map(v => {
            const ytId = getYoutubeId(v.url);
            const thumb = ytId
              ? `<img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg" class="video-thumb" alt="" />`
              : `<div class="video-thumb-placeholder">🎬</div>`;
            return `<div class="video-item">
              <a href="${esc(v.url)}" target="_blank" rel="noopener">${thumb}</a>
              <div class="video-info">
                <span class="video-title">${esc(v.title || v.url)}</span>
                <a class="video-link" href="${esc(v.url)}" target="_blank" rel="noopener">Ouvrir ↗</a>
              </div>
            </div>`;
          }).join('')}</div>` : ''}
        ${(() => {
          const costs = p.costs || [];
          if (!costs.length) return '';
          const total = costs.reduce((s, c) => s + (c.price || 0), 0);
          return `<div class="detail-section-title">Coûts</div>
            <table style="width:100%;border-collapse:collapse;font-size:.82rem;margin-top:.3rem">
              <thead><tr style="color:var(--text-500)">
                <th style="text-align:left;padding:.2rem .4rem;width:70%">Description</th>
                <th style="text-align:right;padding:.2rem .4rem">Prix</th>
              </tr></thead>
              <tbody>${costs.map(c => `<tr>
                <td style="padding:.25rem .4rem">${esc(c.description)}</td>
                <td style="padding:.25rem .4rem;text-align:right">${c.price != null ? Number(c.price).toFixed(2) + ' €' : '—'}</td>
              </tr>`).join('')}
              <tr class="costs-total-row">
                <td style="padding:.25rem .4rem;font-weight:700">Total</td>
                <td style="padding:.25rem .4rem;text-align:right;font-weight:700">${total.toFixed(2)} €</td>
              </tr></tbody>
            </table>`;
        })()}
        ${(() => {
          const sessions = (p.testSessions||[]);
          const rated = sessions.filter(s => s.rating);
          const avg = rated.length ? (rated.reduce((sum,s) => sum + s.rating, 0) / rated.length) : null;
          const avgStars = avg !== null
            ? `<span class="test-avg-badge" title="${avg.toFixed(1)}/5">${'⭐'.repeat(Math.round(avg))} <span style="font-size:.72rem;color:var(--text-500)">${avg.toFixed(1)}/5 (${rated.length} noté${rated.length>1?'s':''})</span></span>`
            : '';
          const ratingOpts = [0,1,2,3,4,5].map(n =>
            `<option value="${n}">${n === 0 ? '— sans note' : '⭐'.repeat(n)}</option>`
          ).join('');
          // Group by version
          const byVersion = {};
          sessions.forEach(s => {
            const v = (s.version||'').trim();
            if (!byVersion[v]) byVersion[v] = [];
            byVersion[v].push(s);
          });
          const versionKeys = Object.keys(byVersion).sort((a, b) => {
            if (!a && b) return 1;
            if (a && !b) return -1;
            return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
          });
          const rows = versionKeys.map(v => {
            const groupSessions = [...byVersion[v]].sort((a,b) => b.date.localeCompare(a.date));
            const sep = `<tr><td colspan="4" style="padding:.35rem .4rem .1rem;border-top:1px solid var(--border)">
              <span style="font-size:.7rem;font-weight:700;color:var(--text-400);text-transform:uppercase;letter-spacing:.06em">${v ? esc(v) : 'Sans version'}</span>
            </td></tr>`;
            const dataRows = groupSessions.map(s => `<tr>
              <td style="padding:.25rem .4rem;white-space:nowrap">${s.date ? new Date(s.date).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
              <td style="padding:.25rem .4rem;text-align:center">${s.players != null ? s.players + '👤' : '—'}</td>
              <td style="padding:.25rem .4rem;text-align:center">${s.rating ? '⭐'.repeat(s.rating) : '—'}</td>
              <td style="padding:.25rem .4rem">${esc(s.comments||'')}</td>
            </tr>`).join('');
            return sep + dataRows;
          }).join('');
          return `<div class="detail-section-title" style="display:flex;align-items:center;justify-content:space-between">
              <span style="display:flex;align-items:center;gap:.6rem">Sessions de test ${avgStars}</span>
              <button class="btn-quick-task-toggle" onclick="var f=document.getElementById('qts-form');f.classList.toggle('hidden');f.querySelector('input[type=date]').focus()">+ Session</button>
            </div>
            <div id="qts-form" class="quick-task-form hidden">
              <input type="date" id="qts-date" class="form-input" value="${today()}" style="width:auto" />
              <input type="text" id="qts-version" class="form-input" placeholder="Version" style="width:6rem" />
              <input type="number" id="qts-players" class="form-input" placeholder="Joueurs" min="1" max="99" style="width:5.5rem" />
              <select id="qts-rating" class="form-select" style="width:auto">${ratingOpts}</select>
              <input type="text" id="qts-comments" class="form-input" placeholder="Commentaires…" style="flex:1;min-width:80px" />
              <button onclick="saveQuickTestSession('${p.id}')" class="btn-save" style="padding:.25rem .75rem;font-size:.8rem">Ajouter</button>
              <button onclick="document.getElementById('qts-form').classList.add('hidden')" class="btn-cancel" style="padding:.25rem .5rem;font-size:.8rem">✕</button>
            </div>
            ${sessions.length > 0 ? `<table style="width:100%;border-collapse:collapse;font-size:.82rem;margin-top:.3rem">
            <thead><tr style="color:var(--text-500)">
              <th style="text-align:left;padding:.2rem .4rem">Date</th>
              <th style="text-align:center;padding:.2rem .4rem">Joueurs</th>
              <th style="text-align:center;padding:.2rem .4rem">Note</th>
              <th style="text-align:left;padding:.2rem .4rem">Commentaires</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>` : ''}`;
        })()}
        ${(p.pdf || p.pdfUrl) ? `<div class="detail-section-title">Règles du jeu</div>
          <div class="pdf-viewer-wrap">
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem">
              <span class="pdf-name">📄 ${esc(p.pdfUrl ? 'Lien externe' : (p.pdfName||'Règles.pdf'))}</span>
              ${p.pdfUrl
                ? `<a class="pdf-open-btn" href="${esc(p.pdfUrl)}" target="_blank" rel="noopener">Ouvrir le lien ↗</a>`
                : `<button class="pdf-open-btn" onclick="openPdfBlob('${p.id}')">Ouvrir dans un onglet</button>`}
            </div>
            ${p.pdfUrl
              ? `<iframe src="${esc(getPdfEmbedUrl(p.pdfUrl))}" class="pdf-viewer-frame" title="Règles du jeu" allowfullscreen></iframe>`
              : `<iframe id="pdf-preview-frame-${p.id}" class="pdf-viewer-frame" title="Règles du jeu"></iframe>`}
          </div>` : ''}
        <div class="detail-actions">
          <button class="btn-cancel" onclick="closeModal('detail');confirmDelete('prototype','${p.id}')">Supprimer</button>
        </div>
      </div>
      </div>
      <div id="detail-panel-test"${_detailTab!=='test'?' class="hidden"':''}>
        ${buildEvalPanel(p)}
      </div>`;
    document.getElementById('detail-nav-prev').disabled = _pIdx <= 0;
    document.getElementById('detail-nav-next').disabled = _pIdx >= _pList.length - 1;
  }

  document.getElementById('modal-detail').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  el.scrollTop = 0;
  // Load PDF inline after DOM update
  const openId = type === 'prototype' ? id : null;
  if (openId) {
    const proto = state.prototypes.find(x => x.id === openId);
    if (proto?.pdf) requestAnimationFrame(() => injectPdfViewer(openId));
  }
}

// ═══════════════════════════════════════════════════
// EXPORT PDF (impression navigateur)
// ═══════════════════════════════════════════════════

function _pdfOpenWindow(html, title) {
  const win = window.open('', '_blank', 'width=900,height=1200');
  if (!win) { alert('Veuillez autoriser les popups pour exporter en PDF.'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  win.addEventListener('load', () => setTimeout(() => win.print(), 300));
}

function exportContactPdf(id) {
  const c = state.contacts.find(x => x.id === id);
  if (!c) return;

  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const allTasks    = (c.tasks || []).slice().sort((a, b) => (URGENCY_ORDER[a.urgency||'normal']||2) - (URGENCY_ORDER[b.urgency||'normal']||2));
  const pendingTasks = allTasks.filter(t => !t.done);
  const doneTasks    = allTasks.filter(t =>  t.done);
  const allExchanges = [...(c.exchanges || [])].sort((a, b) => b.date.localeCompare(a.date));
  const linkedProtos = state.prototypes.filter(p => (p.contactLinks || []).some(l => l.contactId === c.id));

  const catColors = { auteur: '#4f46e5', illustrateur: '#0891b2', editeur: '#b45309', distributeur: '#16a34a', fabricant: '#dc2626' };
  const ac = catColors[c.category] || '#6b7280';
  const avatarHtml = c.photo
    ? `<div class="avatar" style="background-image:url('${c.photo}');background-size:cover;background-position:center"></div>`
    : `<div class="avatar av-letter">${(c.name || '').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}</div>`;

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Fiche Contact — ${c.name.replace(/</g,'&lt;')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;color:#1a1a2e;background:#fff}
@page{size:A4;margin:12mm 15mm}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.page{min-height:267mm;display:flex;flex-direction:column}
.hdr{display:flex;align-items:center;gap:12px;padding-bottom:10px;border-bottom:3px solid ${ac};margin-bottom:12px}
.avatar{width:54px;height:54px;border-radius:50%;flex-shrink:0;border:2px solid ${ac}}
.av-letter{background:${ac};display:flex;align-items:center;justify-content:center;font-size:1.15rem;font-weight:700;color:#fff}
.hdr-info{flex:1}
.hdr-info h1{font-size:15pt;font-weight:700;color:#1e1b4b}
.hdr-info .sub{font-size:9pt;color:#6b7280;margin-top:2px}
.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:8pt;font-weight:700;background:${ac}20;color:${ac};border:1px solid ${ac}40}
.hdr-right{text-align:right;font-size:8pt;color:#9ca3af;flex-shrink:0}
.sec{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:${ac};margin:9px 0 4px;border-bottom:1px solid ${ac}30;padding-bottom:2px}
.kv-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px 14px}
.kv label{display:block;font-size:7pt;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.kv span,.kv a{font-size:9pt;color:#1e1b4b;text-decoration:none;word-break:break-all}
.task{display:flex;align-items:flex-start;gap:6px;padding:2.5px 0;font-size:9pt}
.tbadge{font-size:7pt;font-weight:700;padding:1px 5px;border-radius:10px;white-space:nowrap}
.tc{background:#fee2e2;color:#dc2626}.tu{background:#fef3c7;color:#d97706}
.tn{background:#e0f2fe;color:#0284c7}.tf{background:#f1f5f9;color:#64748b}
.exch{display:flex;align-items:flex-start;gap:8px;padding:2.5px 0;font-size:9pt;border-bottom:1px solid #f1f5f9}
.exch-date{color:#6b7280;font-size:8pt;white-space:nowrap;min-width:72px}
.exch-type{color:${ac};font-weight:600;white-space:nowrap;min-width:72px}
.exch-note{color:#374151}
.two{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}
.proto{display:flex;align-items:center;gap:5px;padding:2px 0;font-size:9pt}
.pstt{font-size:7.5pt;padding:1px 5px;border-radius:10px;background:#f0fdf4;color:#16a34a;margin-left:auto;white-space:nowrap}
.notes{font-size:9pt;color:#374151;white-space:pre-wrap;background:#f9fafb;border-radius:4px;padding:6px 8px;margin-top:3px;border:1px solid #e5e7eb}
.socials{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}
.schip{font-size:8pt;padding:2px 8px;background:#f1f5f9;border-radius:10px;color:#374151}
.footer{margin-top:auto;padding-top:8px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:7pt;color:#9ca3af}
</style></head>
<body><div class="page">
<div class="hdr">
  ${avatarHtml}
  <div class="hdr-info">
    <h1>${esc(c.name)}</h1>
    <div class="sub">${c.company ? esc(c.company) + ' &nbsp;·&nbsp; ' : ''}<span class="badge">${esc(c.category)}</span>${c.favorite ? ' &nbsp;⭐' : ''}</div>
  </div>
  <div class="hdr-right">Fiche générée le<br>${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
</div>

<div class="sec">Coordonnées</div>
<div class="kv-grid">
  ${c.email ? `<div class="kv"><label>Email</label><span>${esc(c.email)}</span></div>` : ''}
  ${c.phone ? `<div class="kv"><label>Téléphone</label><span>${esc(c.phone)}</span></div>` : ''}
  ${c.website ? `<div class="kv"><label>Site web</label><a href="${esc(c.website)}">${esc(c.website.replace(/^https?:\/\//, ''))}</a></div>` : ''}
</div>

${(c.socials || []).length > 0 ? `<div class="sec">Réseaux sociaux</div>
<div class="socials">${(c.socials || []).map(s => `<span class="schip">${esc(s.type)}: ${esc(s.url)}</span>`).join('')}</div>` : ''}

${pendingTasks.length > 0 ? `<div class="sec">Tâches en cours (${pendingTasks.length})</div>
${pendingTasks.map(t => `<div class="task">
  <span class="tbadge t${(t.urgency || 'n')[0]}">${esc(t.urgency || 'normal')}</span>
  <span>${esc(t.text)}</span>
  ${t.dueDate ? `<span style="margin-left:auto;font-size:8pt;color:#9ca3af">📅 ${fmtDate(t.dueDate)}</span>` : ''}
</div>`).join('')}` : ''}

${doneTasks.length > 0 ? `<div class="sec" style="color:#6b7280">Tâches terminées (${doneTasks.length})</div>
${doneTasks.map(t => `<div class="task" style="opacity:.6;text-decoration:line-through">
  <span class="tbadge tf">✓</span>
  <span>${esc(t.text)}</span>
</div>`).join('')}` : ''}

<div class="two">
<div>
${allExchanges.length > 0 ? `<div class="sec">Échanges (${allExchanges.length})</div>
${allExchanges.map(e => `<div class="exch">
  <span class="exch-date">${fmtDate(e.date)}</span>
  <span class="exch-type">${esc(e.type || '')}</span>
  <span class="exch-note">${esc(e.note || '')}</span>
</div>`).join('')}` : ''}
</div>
<div>
${linkedProtos.length > 0 ? `<div class="sec">Prototypes liés (${linkedProtos.length})</div>
${linkedProtos.map(p => {
    const role = (p.contactLinks || []).find(l => l.contactId === c.id)?.role || '';
    return `<div class="proto">
  <span>${PROTO_ICONS[p.status] || '🎮'} ${esc(p.title)}</span>
  ${role ? `<span style="font-size:8pt;color:#6b7280">(${esc(role)})</span>` : ''}
  <span class="pstt">${esc(STATUS_LABELS[p.status] || p.status)}</span>
</div>`;
  }).join('')}` : ''}
</div>
</div>

${c.notes ? `<div class="sec">Notes</div><div class="notes">${esc(c.notes)}</div>` : ''}

<div class="footer">
  <span>BBG Contacts</span>
  <span>${esc(c.name)} · ${new Date().toLocaleDateString('fr-FR')}</span>
</div>
</div>
</body></html>`;

  _pdfOpenWindow(html);
}

function exportPrototypePdf(id) {
  const p = state.prototypes.find(x => x.id === id);
  if (!p) return;

  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const icon = PROTO_ICONS[p.status] || '🎮';
  const statusLabel = STATUS_LABELS[p.status] || p.status;
  const pendingTasks = (p.tasks || []).filter(t => !t.done);
  const doneTasks = (p.tasks || []).filter(t => t.done);
  const recentDevLog = [...(p.devLog || [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const linkedContacts = (p.contactLinks || []).map(l => {
    const contact = state.contacts.find(x => x.id === l.contactId);
    return contact ? { contact, role: l.role } : null;
  }).filter(Boolean);
  const costs = p.costs || [];
  const totalCost = costs.reduce((s, c) => s + (c.price || 0), 0);
  const testSessions = [...(p.testSessions || [])].filter(s => s.date || s.comments || s.rating).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const ratedSessions = testSessions.filter(s => s.rating);
  const avgRating = ratedSessions.length ? (ratedSessions.reduce((s, x) => s + x.rating, 0) / ratedSessions.length) : null;

  const avatarHtml = p.photo
    ? `<div class="avatar" style="background-image:url('${p.photo}');background-size:cover;background-position:center"></div>`
    : `<div class="avatar av-icon">${icon}</div>`;

  const statusColors = {
    développement: '#4f46e5', 'test-à-venir': '#0e7490', tester: '#0891b2', évalué: '#16a34a', imprimer: '#d97706',
    pnp: '#6b7280', production: '#7c3aed', standby: '#9ca3af', sorti: '#f59e0b',
    abandonné: '#ef4444', 'non-retenu': '#ef4444'
  };
  const stColor = statusColors[p.status] || '#6b7280';

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>Fiche Jeu — ${p.title.replace(/</g,'&lt;')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:10pt;color:#1a1a2e;background:#fff}
@page{size:A4;margin:12mm 15mm}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
.page{min-height:267mm;display:flex;flex-direction:column}
.hdr{display:flex;align-items:center;gap:12px;padding-bottom:10px;border-bottom:3px solid ${stColor};margin-bottom:12px}
.avatar{width:54px;height:54px;border-radius:8px;flex-shrink:0;border:2px solid ${stColor}}
.av-icon{background:${stColor}20;display:flex;align-items:center;justify-content:center;font-size:1.6rem}
.hdr-info{flex:1}
.hdr-info h1{font-size:15pt;font-weight:700;color:#1e1b4b}
.hdr-info .sub{font-size:9pt;color:#6b7280;margin-top:2px}
.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:8pt;font-weight:700;background:${stColor}20;color:${stColor};border:1px solid ${stColor}40}
.hdr-right{text-align:right;font-size:8pt;color:#9ca3af;flex-shrink:0}
.sec{font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:${stColor};margin:9px 0 4px;border-bottom:1px solid ${stColor}30;padding-bottom:2px}
.specs{display:flex;flex-wrap:wrap;gap:5px;margin-top:3px}
.spec{font-size:8.5pt;padding:2px 8px;background:#f1f5f9;border-radius:10px;color:#374151;border:1px solid #e5e7eb}
.tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}
.tag{font-size:8pt;padding:2px 7px;background:${stColor}15;border-radius:10px;color:${stColor};border:1px solid ${stColor}30}
.task{display:flex;align-items:flex-start;gap:6px;padding:2.5px 0;font-size:9pt}
.tbadge{font-size:7pt;font-weight:700;padding:1px 5px;border-radius:10px;white-space:nowrap}
.tc{background:#fee2e2;color:#dc2626}.tu{background:#fef3c7;color:#d97706}
.tn{background:#e0f2fe;color:#0284c7}.tf{background:#f1f5f9;color:#64748b}
.contact-row{display:flex;align-items:center;gap:6px;padding:2.5px 0;font-size:9pt}
.cat-badge{font-size:7.5pt;padding:1px 5px;border-radius:10px;background:#e0e7ff;color:#3730a3;margin-left:auto;white-space:nowrap}
.devlog{display:flex;align-items:flex-start;gap:8px;padding:2.5px 0;font-size:9pt;border-bottom:1px solid #f1f5f9}
.dl-date{color:#6b7280;font-size:8pt;white-space:nowrap;min-width:72px}
.dl-note{color:#374151}
.two{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}
.notes{font-size:9pt;color:#374151;white-space:pre-wrap;background:#f9fafb;border-radius:4px;padding:6px 8px;margin-top:3px;border:1px solid #e5e7eb}
.eval-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-top:4px}
.eval-cell{text-align:center;padding:4px;background:#f9fafb;border-radius:4px;border:1px solid #e5e7eb}
.eval-name{font-size:6.5pt;color:#6b7280;margin-bottom:2px}
.eval-score{font-size:11pt;font-weight:700;color:${stColor}}
.eval-score-sub{font-size:7pt;color:#9ca3af}
.score-bar-wrap{margin-top:5px;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden}
.score-bar{height:100%;background:${stColor};border-radius:3px}
.costs-tbl{width:100%;border-collapse:collapse;font-size:9pt;margin-top:3px}
.costs-tbl th{text-align:left;padding:2px 4px;font-size:7.5pt;color:#9ca3af;font-weight:700;border-bottom:1px solid #e5e7eb}
.costs-tbl td{padding:2.5px 4px;border-bottom:1px solid #f1f5f9}
.costs-tbl .total td{font-weight:700;border-top:2px solid #e5e7eb;border-bottom:none}
.task-done{display:flex;align-items:flex-start;gap:6px;padding:2px 0;font-size:9pt;color:#6b7280;text-decoration:line-through}
.test-tbl{width:100%;border-collapse:collapse;font-size:9pt;margin-top:3px}
.test-tbl th{text-align:left;padding:2px 4px;font-size:7.5pt;color:#9ca3af;font-weight:700;border-bottom:1px solid #e5e7eb}
.test-tbl td{padding:3px 4px;border-bottom:1px solid #f1f5f9;vertical-align:top}
.stars{color:#f59e0b;letter-spacing:1px}
.footer{margin-top:auto;padding-top:8px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:7pt;color:#9ca3af}
</style></head>
<body><div class="page">
<div class="hdr">
  ${avatarHtml}
  <div class="hdr-info">
    <h1>${esc(p.title)}</h1>
    <div class="sub">${p.genre ? esc(p.genre) + ' &nbsp;·&nbsp; ' : ''}<span class="badge">${icon} ${esc(statusLabel)}</span></div>
  </div>
  <div class="hdr-right">Fiche générée le<br>${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
    ${avgRating !== null ? `<br><span style="font-size:9pt">⭐ ${avgRating.toFixed(1)}/5 moy.</span>` : ''}
  </div>
</div>

<div class="sec">Caractéristiques</div>
<div class="specs">
  ${p.players ? `<span class="spec">👥 ${esc(p.players)} joueurs</span>` : ''}
  ${p.duration ? `<span class="spec">⏱ ${esc(p.duration)}</span>` : ''}
  ${p.age ? `<span class="spec">👶 dès ${esc(p.age)} ans</span>` : ''}
  ${p.interest ? `<span class="spec">${'⭐'.repeat(p.interest)} ${INTEREST_LABELS[p.interest] || ''}</span>` : ''}
  ${p.createdAt ? `<span class="spec">📅 Créé le ${new Date(p.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>` : ''}
</div>

${(p.tags || []).length > 0 ? `<div class="tags">${(p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}

${p.description ? `<div class="sec">Description</div><div class="notes">${esc(p.description)}</div>` : ''}

<div class="two">
<div>
${linkedContacts.length > 0 ? `<div class="sec">Contacts (${linkedContacts.length})</div>
${linkedContacts.map(({ contact, role }) => `<div class="contact-row">
  <span style="font-size:10pt">${(contact.name || '').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()}</span>
  <span>${esc(contact.name)}</span>
  ${role ? `<span style="font-size:8pt;color:#6b7280">(${esc(role)})</span>` : ''}
  <span class="cat-badge">${esc(contact.category)}</span>
</div>`).join('')}` : ''}

${pendingTasks.length > 0 ? `<div class="sec">Tâches en cours (${pendingTasks.length})</div>
${pendingTasks.map(t => `<div class="task">
  <span class="tbadge t${(t.urgency || 'n')[0]}">${esc(t.urgency || 'normal')}</span>
  <span>${esc(t.text)}${t.dueDate ? ` <span style="font-size:7.5pt;color:#9ca3af">— échéance ${fmtDate(t.dueDate)}</span>` : ''}</span>
</div>`).join('')}` : ''}
${doneTasks.length > 0 ? `<div class="sec">Tâches accomplies (${doneTasks.length})</div>
${doneTasks.map(t => `<div class="task-done">
  <span style="font-size:9pt">✓</span>
  <span>${esc(t.text)}</span>
</div>`).join('')}` : ''}
</div>

<div>
${recentDevLog.length > 0 ? `<div class="sec">Journal de développement</div>
${recentDevLog.map(e => `<div class="devlog">
  <span class="dl-date">${fmtDate(e.date)}</span>
  <span class="dl-note">${esc(e.note)}</span>
</div>`).join('')}` : ''}

${costs.length > 0 ? `<div class="sec">Coûts</div>
<table class="costs-tbl">
  <thead><tr><th>Description</th><th style="text-align:right">Prix</th></tr></thead>
  <tbody>
    ${costs.map(c => `<tr><td>${esc(c.description)}</td><td style="text-align:right">${c.price != null ? Number(c.price).toFixed(2) + ' €' : '—'}</td></tr>`).join('')}
    <tr class="total"><td>Total</td><td style="text-align:right">${totalCost.toFixed(2)} €</td></tr>
  </tbody>
</table>` : ''}
</div>
</div>

${testSessions.length > 0 ? `<div class="sec">Sessions de test (${testSessions.length}${avgRating !== null ? ` — moy. ⭐ ${avgRating.toFixed(1)}/5` : ''})</div>
<table class="test-tbl">
  <thead><tr><th>Date</th><th>Version</th><th>Joueurs</th><th>Note</th><th>Commentaires</th></tr></thead>
  <tbody>
    ${testSessions.map(s => `<tr>
      <td style="white-space:nowrap">${s.date ? fmtDate(s.date) : '—'}</td>
      <td>${s.version ? esc(s.version) : '—'}</td>
      <td style="text-align:center">${s.players || '—'}</td>
      <td style="white-space:nowrap"><span class="stars">${s.rating ? '★'.repeat(s.rating) + '<span style="color:#d1d5db">' + '★'.repeat(5 - s.rating) + '</span>' : '—'}</span></td>
      <td>${s.comments ? esc(s.comments) : ''}</td>
    </tr>`).join('')}
  </tbody>
</table>` : ''}

${p.notes ? `<div class="sec">Notes de développement</div><div class="notes">${esc(p.notes)}</div>` : ''}

<div class="footer">
  <span>BBG Contacts</span>
  <span>${esc(p.title)} · ${new Date().toLocaleDateString('fr-FR')}</span>
</div>
</div>
</body></html>`;

  _pdfOpenWindow(html);
}

// ═══════════════════════════════════════════════════
// PDF — LISTES (pages entières)
// ═══════════════════════════════════════════════════

const _PDF_PAGE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:9.5pt;color:#1a1a2e;background:#fff}
@page{size:A4 landscape;margin:10mm 12mm}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
h1{font-size:14pt;font-weight:700;color:#1e1b4b;margin-bottom:2px}
.meta{font-size:8pt;color:#6b7280;margin-bottom:10px}
table{width:100%;border-collapse:collapse;font-size:8.5pt}
th{text-align:left;padding:4px 6px;font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;border-bottom:2px solid #e5e7eb;white-space:nowrap}
td{padding:4px 6px;border-bottom:1px solid #f1f5f9;vertical-align:top;max-width:220px;word-break:break-word}
tr:nth-child(even) td{background:#fafafa}
.badge{display:inline-block;padding:1px 6px;border-radius:10px;font-size:7pt;font-weight:700;white-space:nowrap}
.footer{margin-top:8px;font-size:7pt;color:#9ca3af;display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:4px}
`;

function exportContactsListPdf() {
  const list = state.contacts.slice().sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fr'));
  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
  const catColors = { auteur: '#4f46e5', illustrateur: '#0891b2', editeur: '#b45309', distributeur: '#16a34a', fabricant: '#dc2626' };

  const rows = list.map(c => {
    const ac = catColors[c.category] || '#6b7280';
    const lastEx = [...(c.exchanges || [])].filter(e => e.date).sort((a, b) => b.date.localeCompare(a.date))[0];
    const pendingTasks = (c.tasks || []).filter(t => !t.done).length;
    return `<tr>
      <td><strong>${esc(c.name)}</strong>${c.favorite ? ' ⭐' : ''}</td>
      <td><span class="badge" style="background:${ac}18;color:${ac};border:1px solid ${ac}30">${esc(CAT_LABELS[c.category] || c.category)}</span></td>
      <td>${esc(c.company || '—')}</td>
      <td>${c.email ? `<a href="mailto:${esc(c.email)}" style="color:#1e1b4b">${esc(c.email)}</a>` : '—'}</td>
      <td>${esc(c.phone || '—')}</td>
      <td>${esc(c.relationStatus || '—')}</td>
      <td>${lastEx ? fmtDate(lastEx.date) : '—'}</td>
      <td>${pendingTasks > 0 ? `<span style="color:#dc2626;font-weight:700">${pendingTasks}</span>` : '—'}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Contacts BBG</title>
<style>${_PDF_PAGE_CSS}</style></head><body>
<h1>📇 Carnet de Contacts BBG</h1>
<div class="meta">${list.length} contact${list.length > 1 ? 's' : ''} · Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
<table>
  <thead><tr><th>Nom</th><th>Catégorie</th><th>Entreprise</th><th>Email</th><th>Téléphone</th><th>Relation</th><th>Dernier échange</th><th>Tâches</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer"><span>BBG Contacts</span><span>Contacts · ${new Date().toLocaleDateString('fr-FR')}</span></div>
</body></html>`;
  _pdfOpenWindow(html, 'Contacts BBG');
}

function exportPrototypesListPdf() {
  const list = state.prototypes.slice().sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fr'));
  const statusColors = {
    développement: '#4f46e5', 'test-à-venir': '#0e7490', tester: '#0891b2', évalué: '#16a34a', imprimer: '#d97706',
    pnp: '#6b7280', production: '#7c3aed', standby: '#9ca3af', sorti: '#f59e0b',
    abandonné: '#ef4444', 'non-retenu': '#ef4444'
  };
  const interestStars = n => n ? '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n)) : '—';

  const rows = list.map(p => {
    const sc = statusColors[p.status] || '#6b7280';
    const icon = PROTO_ICONS[p.status] || '🎮';
    const pendingTasks = (p.tasks || []).filter(t => !t.done).length;
    const tags = (p.tags || []).slice(0, 4).map(t => `<span style="font-size:7pt;padding:1px 5px;background:#f1f5f9;border-radius:8px;margin-right:2px">${esc(t)}</span>`).join('');
    return `<tr>
      <td><strong>${esc(p.title)}</strong></td>
      <td><span class="badge" style="background:${sc}18;color:${sc};border:1px solid ${sc}30">${icon} ${esc(STATUS_LABELS[p.status] || p.status)}</span></td>
      <td>${esc(p.genre || '—')}</td>
      <td>${p.players ? esc(p.players) + ' j.' : '—'}</td>
      <td>${esc(p.duration || '—')}</td>
      <td>${p.age ? esc(p.age) + '+' : '—'}</td>
      <td style="color:#f59e0b;letter-spacing:1px">${interestStars(p.interest)}</td>
      <td>${tags || '—'}</td>
      <td>${pendingTasks > 0 ? `<span style="color:#dc2626;font-weight:700">${pendingTasks}</span>` : '—'}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Jeux BBG</title>
<style>${_PDF_PAGE_CSS}</style></head><body>
<h1>🎲 Catalogue des Jeux BBG</h1>
<div class="meta">${list.length} jeu${list.length > 1 ? 'x' : ''} · Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
<table>
  <thead><tr><th>Titre</th><th>Statut</th><th>Genre</th><th>Joueurs</th><th>Durée</th><th>Âge</th><th>Intérêt</th><th>Tags</th><th>Tâches</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer"><span>BBG Contacts</span><span>Jeux · ${new Date().toLocaleDateString('fr-FR')}</span></div>
</body></html>`;
  _pdfOpenWindow(html, 'Jeux BBG');
}

function exportFestivalsListPdf() {
  const list = [...(state.festivals || [])].sort((a, b) => (a.dateStart || '').localeCompare(b.dateStart || ''));
  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }) : '';

  const rows = list.map(f => {
    const icon = FEST_ICONS[f.category] || '🎪';
    const dateStr = f.dateStart
      ? (f.dateEnd && f.dateEnd !== f.dateStart ? `${fmtDate(f.dateStart)} → ${fmtDate(f.dateEnd)}` : fmtDate(f.dateStart))
      : '—';
    const partBadge = f.participating
      ? `<span class="badge" style="background:#dcfce7;color:#16a34a;border:1px solid #86efac">✓ Participe</span>`
      : `<span class="badge" style="background:#f1f5f9;color:#6b7280;border:1px solid #e5e7eb">—</span>`;
    const presences = (f.presences || []).filter(p => !p.done).length;
    return `<tr>
      <td><strong>${esc(f.name)}</strong></td>
      <td>${icon} ${esc(FEST_LABELS[f.category] || f.category || '—')}</td>
      <td>${esc(f.city || '—')}</td>
      <td>${dateStr}</td>
      <td>${f.distance ? esc(String(f.distance)) + ' km' : '—'}</td>
      <td>${partBadge}</td>
      <td>${presences > 0 ? presences + ' présence(s)' : '—'}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Festivals BBG</title>
<style>${_PDF_PAGE_CSS}</style></head><body>
<h1>🎪 Festivals BBG</h1>
<div class="meta">${list.length} festival${list.length > 1 ? 's' : ''} · Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
<table>
  <thead><tr><th>Nom</th><th>Type</th><th>Ville</th><th>Dates</th><th>Distance</th><th>Participation</th><th>Présences à venir</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer"><span>BBG Contacts</span><span>Festivals · ${new Date().toLocaleDateString('fr-FR')}</span></div>
</body></html>`;
  _pdfOpenWindow(html, 'Festivals BBG');
}

function exportAgendaListPdf() {
  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
  const EXCH_EMOJI = { rencontre: '🤝', email: '📧', appel: '📞', salon: '🎪', message: '💬', developpement: '🛠️', autre: '📝' };

  // Gather all entries (same logic as renderAgenda)
  const entries = [];
  state.contacts.forEach(c => {
    (c.exchanges || []).forEach(e => {
      entries.push({ date: e.date, source: '👤 ' + esc(c.name), type: (EXCH_EMOJI[e.type] || '📝') + ' ' + esc(e.type || 'autre'), note: esc(e.note || '') });
    });
  });
  (state.festivals || []).forEach(f => {
    (f.presences || []).forEach(p => {
      const d2 = p.dateEnd && p.dateEnd !== p.dateStart ? ` → ${fmtDate(p.dateEnd)}` : '';
      entries.push({ date: p.dateStart || p.date || '', source: '🎪 ' + esc(f.name), type: 'Présence', note: esc(p.note || '') + d2 });
    });
  });
  (state.prototypes || []).forEach(p => {
    (p.devLog || []).forEach(e => {
      entries.push({ date: e.date, source: '🎮 ' + esc(p.title), type: '🛠️ Dev log', note: esc(e.note || '') });
    });
    if (p.evaluation?.date) entries.push({ date: p.evaluation.date, source: '🎮 ' + esc(p.title), type: '⭐ Évaluation', note: '' });
    (p.testSessions || []).forEach(s => {
      entries.push({ date: s.date || '', source: '🎮 ' + esc(p.title), type: '🧪 Session test', note: s.rating ? `${s.rating}/5` : '' });
    });
  });
  entries.sort((a, b) => b.date.localeCompare(a.date));

  const rows = entries.map(e => `<tr>
    <td style="white-space:nowrap">${fmtDate(e.date)}</td>
    <td>${e.source}</td>
    <td>${e.type}</td>
    <td>${e.note}</td>
  </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Agenda BBG</title>
<style>${_PDF_PAGE_CSS}</style></head><body>
<h1>📅 Agenda BBG</h1>
<div class="meta">${entries.length} entrée${entries.length > 1 ? 's' : ''} · Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
<table>
  <thead><tr><th>Date</th><th>Source</th><th>Type</th><th>Note</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer"><span>BBG Contacts</span><span>Agenda · ${new Date().toLocaleDateString('fr-FR')}</span></div>
</body></html>`;
  _pdfOpenWindow(html, 'Agenda BBG');
}

function exportTasksListPdf() {
  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
  const urgencyLabel = { critique: '🔴 Critique', haute: '🟠 Haute', normal: '🔵 Normale', basse: '⚪ Basse' };
  const urgencyColor = { critique: '#dc2626', haute: '#d97706', normal: '#0284c7', basse: '#6b7280' };

  let tasks = [];
  state.contacts.forEach(c => {
    (c.tasks || []).filter(t => !t.done).forEach(t => {
      tasks.push({ urgency: t.urgency || 'normal', text: t.text, source: '👤 ' + c.name, dueDate: t.dueDate });
    });
  });
  state.prototypes.forEach(p => {
    (p.tasks || []).filter(t => !t.done).forEach(t => {
      tasks.push({ urgency: t.urgency || 'normal', text: t.text, source: '🎮 ' + p.title, dueDate: t.dueDate });
    });
  });
  (state.standaloneTasks || []).filter(t => !t.done).forEach(t => {
    tasks.push({ urgency: t.urgency || 'normal', text: t.text, source: '📌 Tâche libre', dueDate: t.dueDate });
  });
  (state.festivals || []).forEach(f => {
    (f.presences || []).filter(p => !p.done).forEach(p => {
      tasks.push({ urgency: 'normal', text: `Présence${p.note ? ' — ' + p.note : ''}`, source: '🎪 ' + f.name, dueDate: p.dateStart || p.date });
    });
  });

  const URGENCY_ORDER = { critique: 0, haute: 1, normal: 2, basse: 3 };
  tasks.sort((a, b) => (URGENCY_ORDER[a.urgency] || 2) - (URGENCY_ORDER[b.urgency] || 2));

  const rows = tasks.map(t => {
    const uc = urgencyColor[t.urgency] || '#6b7280';
    return `<tr>
      <td><span class="badge" style="background:${uc}15;color:${uc};border:1px solid ${uc}30">${urgencyLabel[t.urgency] || t.urgency}</span></td>
      <td>${esc(t.text)}</td>
      <td>${esc(t.source)}</td>
      <td style="white-space:nowrap">${fmtDate(t.dueDate)}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Tâches BBG</title>
<style>${_PDF_PAGE_CSS}</style></head><body>
<h1>✅ Tâches en cours — BBG</h1>
<div class="meta">${tasks.length} tâche${tasks.length > 1 ? 's' : ''} en cours · Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
<table>
  <thead><tr><th>Urgence</th><th>Tâche</th><th>Source</th><th>Échéance</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer"><span>BBG Contacts</span><span>Tâches · ${new Date().toLocaleDateString('fr-FR')}</span></div>
</body></html>`;
  _pdfOpenWindow(html, 'Tâches BBG');
}

// ═══════════════════════════════════════════════════
// IMPORT / EXPORT EXCEL
// ═══════════════════════════════════════════════════
function toggleImportExport() {
  const panel = document.getElementById('import-export-panel');
  panel.style.display = panel.style.display === 'none' ? '' : 'none';
}

function exportBackup() {
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    contacts:        state.contacts,
    prototypes:      state.prototypes,
    festivals:       state.festivals,
    standaloneTasks: state.standaloneTasks,
    adminCards:      state.adminCards,
    actifs:          state.actifs,
    appointments:    state.appointments,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `BBG-sauvegarde-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data.contacts) || !Array.isArray(data.prototypes)) {
        alert('Fichier invalide : contacts ou prototypes manquants.');
        return;
      }
      const festCount  = Array.isArray(data.festivals)  ? data.festivals.length  : 0;
      const adminCount = Array.isArray(data.adminCards)  ? data.adminCards.length : 0;
      const rdvCount   = Array.isArray(data.appointments)? data.appointments.length: 0;
      if (!confirm(
        `Restaurer la sauvegarde du ${data.exportedAt ? new Date(data.exportedAt).toLocaleString('fr-FR') : 'date inconnue'} ?\n\n` +
        `${data.contacts.length} contact(s), ${data.prototypes.length} prototype(s), ${festCount} festival(s), ${adminCount} vignette(s) admin, ${rdvCount} rendez-vous.\n\n` +
        `ATTENTION : les données actuelles seront remplacées.`
      )) return;
      state.contacts        = data.contacts.map(migrateContact);
      state.prototypes      = data.prototypes.map(migratePrototype);
      state.festivals       = Array.isArray(data.festivals)    ? data.festivals.map(migrateFestival)       : [];
      state.standaloneTasks = Array.isArray(data.standaloneTasks) ? data.standaloneTasks                   : [];
      state.adminCards      = Array.isArray(data.adminCards)   ? data.adminCards.map(migrateAdminCard)     : [];
      state.actifs          = Array.isArray(data.actifs)       ? data.actifs                               : [];
      state.appointments    = Array.isArray(data.appointments) ? data.appointments                         : [];
      saveState();
      switchPage(state.activePage);
      alert('Restauration effectuée avec succès !');
    } catch(e) {
      alert('Erreur lors de la lecture du fichier : ' + e.message);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function exportExcel(type) {
  if (typeof XLSX === 'undefined') { alert('La bibliothèque XLSX n\'est pas chargée.'); return; }
  try {
    const data = type === 'contacts' ? state.contacts : state.prototypes;
    const ws   = XLSX.utils.json_to_sheet(data.map(item => {
      if (type === 'contacts') {
        const topT = getTopTask(item);
        return {
          Nom: item.name||'', Catégorie: item.category||'',
          Favori: item.favorite ? 'oui' : 'non',
          Email: item.email||'', Téléphone: item.phone||'',
          Entreprise: item.company||'', 'Site web': item.website||'',
          'Photo': item.photo ? 'oui' : 'non',
          'Tâche principale': topT ? topT.text : '',
          'Urgence principale': topT ? topT.urgency : '',
          'Nombre de tâches': (item.tasks||[]).length,
          'Nombre d\'échanges': (item.exchanges||[]).length,
          Notes: (item.notes||'').slice(0, 1000),
          Réseaux: (item.socials||[]).map(s => `${s.type}: ${s.url}`).join(' | '),
        };
      } else {
        const topT = getTopTask(item);
        const contactNames = (item.contactLinks||[]).map(l => {
          const c = state.contacts.find(x => x.id === l.contactId);
          return c ? `${c.name}${l.role ? ' ('+l.role+')' : ''}` : '';
        }).filter(Boolean).join(', ');
        const totalCost = (item.costs||[]).reduce((s,c) => s + (c.price||0), 0);
        return {
          Titre: item.title||'', Statut: item.status||'',
          Genre: item.genre||'', Joueurs: item.players||'',
          Durée: item.duration||'', Âge: item.age||'',
          Intérêt: item.interest||3,
          'Tâche principale': topT ? topT.text : '',
          'Urgence principale': topT ? topT.urgency : '',
          'Nombre de tâches': (item.tasks||[]).length,
          Description: (item.description||'').slice(0, 1000),
          Notes: (item.notes||'').slice(0, 1000),
          Tags: (item.tags||[]).join(', '),
          Contacts: contactNames,
          'Coût total (€)': totalCost.toFixed(2),
          'Photo': item.photo ? 'oui' : 'non',
          'Sessions test': (item.testSessions||[]).length,
        };
      }
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type === 'contacts' ? 'Contacts' : 'Prototypes');
    XLSX.writeFile(wb, `bbg-${type}-${today()}.xlsx`);
  } catch(err) {
    alert('Erreur lors de l\'export Excel : ' + err.message);
    console.error('exportExcel error:', err);
  }
}

function importExcel(event, type) {
  if (typeof XLSX === 'undefined') { alert('La bibliothèque XLSX n\'est pas chargée.'); return; }
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb   = XLSX.read(e.target.result, { type: 'binary' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      const tryParseJSON = (s, fallback=[]) => { try { return JSON.parse(s) || fallback; } catch { return fallback; } };
      if (type === 'contacts') {
        const imported = rows.map(r => {
          const tasks = [];
          if (r['Tâche principale']) tasks.push({ id: uid(), text: r['Tâche principale'], urgency: r['Urgence principale']||'normal', done: false });
          return {
            id: uid(), createdAt: today(),
            name: r['Nom']||'', category: r['Catégorie']||'auteur',
            favorite: r['Favori'] === 'oui',
            email: r['Email']||'', phone: r['Téléphone']||'',
            company: r['Entreprise']||'', website: r['Site web']||'',
            photo: r['Photo']||'',
            tasks,
            exchanges: tryParseJSON(r['Échanges']),
            socials: tryParseJSON(r['Réseaux']),
            videos: tryParseJSON(r['Vidéos']),
            notes: r['Notes']||'', games: [],
          };
        });
        state.contacts = [...imported, ...state.contacts];
        saveState(); renderContacts();
      } else {
        const imported = rows.map(r => {
          const tasks = [];
          if (r['Tâche principale']) tasks.push({ id: uid(), text: r['Tâche principale'], urgency: r['Urgence principale']||'normal', done: false });
          return {
            id: uid(), createdAt: today(),
            title: r['Titre']||'', status: r['Statut']||'proto',
            genre: r['Genre']||'', players: r['Joueurs']||'',
            duration: r['Durée']||'', age: r['Âge']||'',
            interest: parseInt(r['Intérêt'])||3,
            tasks, contactLinks: [],
            description: r['Description']||'',
            notes: r['Notes']||'',
            tags: r['Tags'] ? r['Tags'].split(',').map(t=>t.trim()).filter(Boolean) : [],
            photo: r['Photo']||'',
            videos: tryParseJSON(r['Vidéos']),
            costs: tryParseJSON(r['Coûts']),
            devLog: tryParseJSON(r['Journal dev']),
          };
        });
        state.prototypes = [...imported, ...state.prototypes];
        saveState(); renderPrototypes();
      }
      alert(`Import réussi : ${rows.length} ligne(s) importée(s).`);
    } catch(err) {
      alert('Erreur lors de l\'import : ' + err.message);
    }
    event.target.value = '';
  };
  reader.readAsBinaryString(file);
}

// ═══════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════

// Nav tabs
document.querySelectorAll('.nav-tab').forEach(btn =>
  btn.addEventListener('click', () => switchPage(btn.dataset.page))
);


// ── Contacts ──────────────────────────────────────
document.getElementById('contacts-search').addEventListener('input', e => {
  state.contactsSearch = e.target.value; renderContacts();
});
// Filter panel removed; cat/urgency inputs kept hidden for JS compat
document.getElementById('contacts-cat-filter')?.addEventListener('change', e => {
  state.contactsCat = e.target.value; renderContacts();
});
document.getElementById('contacts-urgency-filter')?.addEventListener('change', e => {
  state.contactsUrgency = e.target.value; renderContacts();
});
document.getElementById('contacts-filter-reset').addEventListener('click', () => {
  state.contactsCat = ''; state.contactsUrgency = ''; state.contactsFavoriteOnly = false;
  document.getElementById('contacts-cat-filter').value = '';
  document.getElementById('contacts-urgency-filter').value = '';
  const favEl = document.getElementById('contacts-favorite-filter');
  if (favEl) favEl.checked = false;
  updateFilterCount('contacts');
  renderContacts();
});
document.getElementById('contacts-sort').addEventListener('change', e => {
  state.contactsSort = e.target.value; renderContacts();
});
document.getElementById('contacts-sort-order').addEventListener('click', () => {
  state.contactsSortAsc = !state.contactsSortAsc;
  document.getElementById('contacts-sort-icon').innerHTML =
    state.contactsSortAsc ? ICONS.chevUp : ICONS.chevDown;
  renderContacts();
});
document.getElementById('contacts-zoom').addEventListener('input', e => {
  state.contactsZoom = parseInt(e.target.value); renderContacts();
});
document.getElementById('contacts-view-grid').addEventListener('click', () => {
  state.contactsView = 'grid';
  document.getElementById('contacts-view-grid').classList.add('active');
  document.getElementById('contacts-view-list').classList.remove('active');
  document.getElementById('contacts-view-kanban').classList.remove('active');
  document.getElementById('contacts-zoom-wrap').style.display = '';
  renderContacts();
});
document.getElementById('contacts-view-list').addEventListener('click', () => {
  state.contactsView = 'list';
  document.getElementById('contacts-view-list').classList.add('active');
  document.getElementById('contacts-view-grid').classList.remove('active');
  document.getElementById('contacts-view-kanban').classList.remove('active');
  document.getElementById('contacts-zoom-wrap').style.display = 'none';
  renderContacts();
});
document.getElementById('contacts-view-kanban').addEventListener('click', () => {
  state.contactsView = 'kanban';
  document.getElementById('contacts-view-kanban').classList.add('active');
  document.getElementById('contacts-view-grid').classList.remove('active');
  document.getElementById('contacts-view-list').classList.remove('active');
  document.getElementById('contacts-zoom-wrap').style.display = 'none';
  renderContacts();
});

// ── Prototypes ────────────────────────────────────
document.getElementById('prototypes-search').addEventListener('input', e => {
  state.prototypesSearch = e.target.value; renderPrototypes();
});
document.getElementById('prototypes-filter-toggle').addEventListener('click', () =>
  toggleFilterPanel('prototypes')
);
document.getElementById('prototypes-status-filter').addEventListener('change', e => {
  state.prototypesStatus = e.target.value; renderPrototypes();
});
document.getElementById('prototypes-interest-filter').addEventListener('change', e => {
  state.prototypesInterest = e.target.value; renderPrototypes();
});
document.getElementById('prototypes-filter-reset').addEventListener('click', () => {
  state.prototypesStatus = ''; state.prototypesInterest = ''; state.prototypesTag = '';
  document.getElementById('prototypes-status-filter').value = '';
  document.getElementById('prototypes-interest-filter').value = '';
  document.getElementById('prototypes-tag-filter').value = '';
  renderPrototypes();
});
document.getElementById('prototypes-sort').addEventListener('change', e => {
  state.prototypesSort = e.target.value; renderPrototypes();
});
document.getElementById('prototypes-sort-order').addEventListener('click', () => {
  state.prototypesSortAsc = !state.prototypesSortAsc;
  document.getElementById('prototypes-sort-icon').innerHTML =
    state.prototypesSortAsc ? ICONS.chevUp : ICONS.chevDown;
  renderPrototypes();
});
document.getElementById('prototypes-zoom').addEventListener('input', e => {
  state.prototypesZoom = parseInt(e.target.value); renderPrototypes();
});
document.getElementById('prototypes-view-grid').addEventListener('click', () => {
  state.prototypesView = 'grid';
  document.getElementById('prototypes-view-grid').classList.add('active');
  document.getElementById('prototypes-view-list').classList.remove('active');
  document.getElementById('prototypes-view-timeline').classList.remove('active');
  document.getElementById('prototypes-zoom-wrap').style.display = '';
  renderPrototypes();
});
document.getElementById('prototypes-view-list').addEventListener('click', () => {
  state.prototypesView = 'list';
  document.getElementById('prototypes-view-list').classList.add('active');
  document.getElementById('prototypes-view-grid').classList.remove('active');
  document.getElementById('prototypes-view-timeline').classList.remove('active');
  document.getElementById('prototypes-zoom-wrap').style.display = 'none';
  renderPrototypes();
});
document.getElementById('prototypes-view-timeline').addEventListener('click', () => {
  state.prototypesView = 'timeline';
  document.getElementById('prototypes-view-timeline').classList.add('active');
  document.getElementById('prototypes-view-grid').classList.remove('active');
  document.getElementById('prototypes-view-list').classList.remove('active');
  document.getElementById('prototypes-zoom-wrap').style.display = 'none';
  renderPrototypes();
});
document.getElementById('prototypes-compare-toggle').addEventListener('click', toggleCompareMode);
document.getElementById('prototypes-tag-filter').addEventListener('input', e => {
  state.prototypesTag = e.target.value; renderPrototypes();
});

// Task quick filter pills
document.querySelectorAll('.task-filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    state.tasksFilter = btn.dataset.filter;
    document.querySelectorAll('.task-filter-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // also toggle showDone checkbox if needed
    const showDoneEl = document.getElementById('tasks-show-done');
    if (state.tasksFilter === 'done' && showDoneEl) showDoneEl.checked = true;
    else if (showDoneEl) showDoneEl.checked = false;
    renderTasks();
  });
});

// Compare modal close on overlay click
document.getElementById('modal-compare')?.addEventListener('click', e => {
  if (e.target === document.getElementById('modal-compare')) closeModal('compare');
});

// ═══════════════════════════════════════════════════
// RENDER — STATISTIQUES
// ═══════════════════════════════════════════════════
function renderStats() {
  const el = document.getElementById('stats-content');
  if (!el) return;

  const EXCH_EMOJI = {
    rencontre: '🤝', email: '📧', appel: '📞', salon: '🎪',
    message: '💬', developpement: '🛠️', autre: '📝',
    festival: '🎪', évaluation: '⭐', test: '🧪'
  };
  const SRC_LABELS = {
    contact: '👤 Contacts', prototype: '🎮 Jeux',
    standalone: '✨ Libres', festival: '🎪 Festivals'
  };
  const EXCH_TYPE_LABELS = {
    rencontre: 'Rencontre', email: 'Email', appel: 'Appel', salon: 'Salon',
    message: 'Message', developpement: 'Développement', autre: 'Autre', festival: 'Festival'
  };
  const TEST_TYPE_LABELS = {
    test: 'Session de test', évaluation: 'Évaluation', developpement: 'Dev / Note'
  };

  // ── Collect exchanges : contacts & festivals (interactions humaines) ──
  const echanges = [];

  state.contacts.forEach(c => {
    (c.exchanges || []).forEach(e => {
      if (!e.date) return;
      echanges.push({ date: e.date, type: e.type || 'autre', label: c.name });
    });
  });

  (state.festivals || []).forEach(f => {
    (f.presences || []).forEach(p => {
      const d = p.dateStart || p.date || '';
      if (!d) return;
      echanges.push({ date: d, type: 'festival', label: f.name });
    });
  });

  // ── Collect game tests & prototype activities ──
  const testsJeux = [];

  (state.prototypes || []).forEach(p => {
    (p.testSessions || []).forEach(s => {
      if (!s.date) return;
      testsJeux.push({ date: s.date, type: 'test', label: p.title });
    });
    if (p.evaluation?.date) {
      testsJeux.push({ date: p.evaluation.date, type: 'évaluation', label: p.title });
    }
    (p.devLog || []).forEach(e => {
      if (!e.date) return;
      testsJeux.push({ date: e.date, type: 'developpement', label: p.title });
    });
  });

  // ── Collect all completed tasks (by doneAt) ──
  const completedTasks = [];

  state.contacts.forEach(c => {
    (c.tasks || []).filter(t => t.done && t.doneAt).forEach(t => {
      completedTasks.push({ date: t.doneAt.slice(0, 10), source: 'contact', name: c.name, text: t.text });
    });
  });

  (state.prototypes || []).forEach(p => {
    (p.tasks || []).filter(t => t.done && t.doneAt).forEach(t => {
      completedTasks.push({ date: t.doneAt.slice(0, 10), source: 'prototype', name: p.title, text: t.text });
    });
  });

  (state.standaloneTasks || []).filter(t => t.done && t.doneAt).forEach(t => {
    completedTasks.push({ date: t.doneAt.slice(0, 10), source: 'standalone', name: 'Tâche libre', text: t.text });
  });

  (state.festivals || []).forEach(f => {
    (f.presences || []).filter(p => p.done && p.doneAt).forEach(p => {
      completedTasks.push({ date: p.doneAt.slice(0, 10), source: 'festival', name: f.name, text: 'Présence festival' });
    });
  });

  // ── Group by YYYY-MM ──
  const months = {};
  const ensureMonth = key => {
    if (!months[key]) months[key] = { echanges: [], testsJeux: [], tasks: [] };
  };
  echanges.forEach(e => {
    const key = e.date.slice(0, 7);
    ensureMonth(key);
    months[key].echanges.push(e);
  });
  testsJeux.forEach(e => {
    const key = e.date.slice(0, 7);
    ensureMonth(key);
    months[key].testsJeux.push(e);
  });
  completedTasks.forEach(t => {
    const key = t.date.slice(0, 7);
    ensureMonth(key);
    months[key].tasks.push(t);
  });

  const allMonths = Object.keys(months).sort().reverse();

  if (allMonths.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>Aucune donnée</h3>
        <p>Ajoutez des échanges et des tâches pour voir vos statistiques.</p>
      </div>`;
    return;
  }

  // ── Global summary ──
  const totalEchanges = echanges.length;
  const totalTests = testsJeux.length;
  const totalTasks = completedTasks.length;
  const activeMonths = allMonths.length;

  // Find most active month (by combined activity)
  let busiest = allMonths[0];
  allMonths.forEach(k => {
    if ((months[k].echanges.length + months[k].testsJeux.length + months[k].tasks.length) >
        (months[busiest].echanges.length + months[busiest].testsJeux.length + months[busiest].tasks.length)) {
      busiest = k;
    }
  });
  const busiestLabel = (() => {
    const [y, m] = busiest.split('-');
    const lbl = new Date(+y, +m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return lbl.charAt(0).toUpperCase() + lbl.slice(1);
  })();

  let html = `
    <div class="stats-summary-bar">
      <div class="stats-summary-item">
        <div class="stats-summary-num">${totalEchanges}</div>
        <div class="stats-summary-label">📅 échanges</div>
      </div>
      <div class="stats-summary-item stats-summary-item--tests">
        <div class="stats-summary-num">${totalTests}</div>
        <div class="stats-summary-label">🧪 tests de jeux</div>
      </div>
      <div class="stats-summary-item">
        <div class="stats-summary-num">${totalTasks}</div>
        <div class="stats-summary-label">tâches terminées</div>
      </div>
      <div class="stats-summary-item">
        <div class="stats-summary-num">${activeMonths}</div>
        <div class="stats-summary-label">mois d'activité</div>
      </div>
      <div class="stats-summary-item stats-summary-item--highlight">
        <div class="stats-summary-num stats-summary-num--sm">${busiestLabel}</div>
        <div class="stats-summary-label">mois le plus actif</div>
      </div>
    </div>
    <div class="stats-months-list">
  `;

  allMonths.forEach(key => {
    const m = months[key];
    const [year, month] = key.split('-');
    const monthLabel = (() => {
      const lbl = new Date(+year, +month - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      return lbl.charAt(0).toUpperCase() + lbl.slice(1);
    })();

    // Échanges breakdown by type
    const exchByType = {};
    m.echanges.forEach(e => {
      const k = e.type || 'autre';
      exchByType[k] = (exchByType[k] || 0) + 1;
    });

    // Tests de jeux breakdown by type
    const testsByType = {};
    m.testsJeux.forEach(e => {
      const k = e.type || 'test';
      testsByType[k] = (testsByType[k] || 0) + 1;
    });

    // Task breakdown by source
    const tasksBySrc = {};
    m.tasks.forEach(t => {
      tasksBySrc[t.source] = (tasksBySrc[t.source] || 0) + 1;
    });

    const exchRows = Object.entries(exchByType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) =>
        `<div class="stats-month-row">
          <span>${EXCH_EMOJI[type] || '📝'} ${EXCH_TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1)}</span>
          <span class="stats-month-val">${count}</span>
        </div>`
      ).join('');

    const testRows = Object.entries(testsByType)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) =>
        `<div class="stats-month-row">
          <span>${EXCH_EMOJI[type] || '🎮'} ${TEST_TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1)}</span>
          <span class="stats-month-val">${count}</span>
        </div>`
      ).join('');

    const taskRows = Object.entries(tasksBySrc)
      .sort((a, b) => b[1] - a[1])
      .map(([src, count]) =>
        `<div class="stats-month-row">
          <span>${SRC_LABELS[src] || src}</span>
          <span class="stats-month-val">${count}</span>
        </div>`
      ).join('');

    html += `
      <div class="stats-month-card">
        <div class="stats-month-header">
          <span class="stats-month-title">${monthLabel}</span>
          <div class="stats-month-totals">
            ${m.echanges.length ? `<span class="stats-month-chip">📅 ${m.echanges.length} échange${m.echanges.length > 1 ? 's' : ''}</span>` : ''}
            ${m.testsJeux.length ? `<span class="stats-month-chip stats-chip-test">🧪 ${m.testsJeux.length} test${m.testsJeux.length > 1 ? 's' : ''} de jeu${m.testsJeux.length > 1 ? 'x' : ''}</span>` : ''}
            ${m.tasks.length ? `<span class="stats-month-chip stats-chip-done">✅ ${m.tasks.length} tâche${m.tasks.length > 1 ? 's' : ''} terminée${m.tasks.length > 1 ? 's' : ''}</span>` : ''}
          </div>
        </div>
        <div class="stats-month-body stats-month-body--3col">
          <div class="stats-month-col">
            <div class="stats-col-title">📅 Échanges</div>
            ${exchRows || '<div class="stats-empty-col">—</div>'}
          </div>
          <div class="stats-month-col">
            <div class="stats-col-title">🧪 Tests de jeux</div>
            ${testRows || '<div class="stats-empty-col">—</div>'}
          </div>
          <div class="stats-month-col">
            <div class="stats-col-title">✅ Tâches terminées</div>
            ${taskRows || '<div class="stats-empty-col">—</div>'}
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  el.innerHTML = html;
}

// ═══════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════
// ─── Admin helpers ───────────────────────────────────
function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function isAdminCardDone(card) {
  if (card.recurrence === 'monthly') {
    const ym = currentYearMonth();
    return (card.completionHistory || []).some(h => h.month === ym);
  }
  return card.status === 'fait';
}

function adminCardDueDate(card) {
  if (card.recurrence === 'monthly' && card.dayOfMonth) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth()+1).padStart(2,'0');
    const day = String(Math.min(card.dayOfMonth, 28)).padStart(2,'0');
    return `${year}-${month}-${day}`;
  }
  return card.dueDate || '';
}

function adminCardToTask(card) {
  return {
    id: card.id, _from: 'admin', _name: adminCatInfo(card.category).label, _id: card.id,
    text: card.title, urgency: card.urgency || 'normal',
    done: isAdminCardDone(card), dueDate: adminCardDueDate(card), doneAt: null,
  };
}

function onAdminRecurrenceChange(val) {
  const isMonthly = val === 'monthly';
  document.getElementById('admin-status-group').classList.toggle('hidden', isMonthly);
  document.getElementById('admin-dayofmonth-group').classList.toggle('hidden', !isMonthly);
  document.getElementById('admin-due-group').classList.toggle('hidden', isMonthly);
}

const ADMIN_CATEGORIES = [
  { value: 'comptabilite',  label: 'Comptabilité',  color: '#6366f1' },
  { value: 'contrats',      label: 'Contrats',       color: '#f59e0b' },
  { value: 'impots',        label: 'Impôts',         color: '#ef4444' },
  { value: 'communication', label: 'Communication',  color: '#10b981' },
  { value: 'juridique',     label: 'Juridique',      color: '#8b5cf6' },
  { value: 'autre',         label: 'Autre',          color: '#64748b' },
];

function adminCatInfo(val) {
  return ADMIN_CATEGORIES.find(c => c.value === val) || ADMIN_CATEGORIES[ADMIN_CATEGORIES.length - 1];
}

function adminDaysUntil(card) {
  const due = adminCardDueDate(card);
  if (!due) return null;
  const todayMs = new Date(today()).getTime();
  const dueMs   = new Date(due).getTime();
  return Math.round((dueMs - todayMs) / 86400000);
}

function adminJBadge(days, isDone) {
  if (isDone || days === null) return '';
  if (days < 0)  return `<span class="admin-j-badge admin-j-late">+${-days}j</span>`;
  if (days === 0) return `<span class="admin-j-badge admin-j-today">Aujourd'hui</span>`;
  if (days <= 7) return `<span class="admin-j-badge admin-j-soon">J-${days}</span>`;
  if (days <= 30) return `<span class="admin-j-badge admin-j-month">J-${days}</span>`;
  return `<span class="admin-j-badge admin-j-far">J-${days}</span>`;
}

function renderAdminCard(card, ym, MONTH_NAMES) {
  const cat = adminCatInfo(card.category);
  const isDone = isAdminCardDone(card);
  const isMonthly = card.recurrence === 'monthly';
  const statusClass = isDone ? 'admin-card-done' : card.status === 'en-cours' ? 'admin-card-inprogress' : '';
  const urgencyColors = { critique: '#dc2626', urgent: '#ea580c', normal: '#6366f1', faible: '#94a3b8' };
  const urgColor = urgencyColors[card.urgency || 'normal'] || urgencyColors.normal;

  const effectiveDue = adminCardDueDate(card);
  const days = adminDaysUntil(card);
  const dueFmt = effectiveDue
    ? new Date(effectiveDue).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: isMonthly ? undefined : 'numeric' })
    : '';
  const overdue = effectiveDue && effectiveDue < today() && !isDone;

  let historyHtml = '';
  if (isMonthly) {
    const history = card.completionHistory || [];
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
      const m = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = MONTH_NAMES[d.getMonth()];
      const wasDone = history.some(h => h.month === m);
      const isCurrent = m === ym;
      months.push({ m, label, wasDone, isCurrent });
    }
    historyHtml = `<div class="admin-history">${months.map(mo =>
      `<span class="admin-history-dot ${mo.wasDone ? 'done' : ''} ${mo.isCurrent ? 'current' : ''}" title="${mo.wasDone ? 'Marquer non fait' : 'Marquer fait'} — ${mo.m}" onclick="event.stopPropagation();toggleAdminMonth('${card.id}','${mo.m}')" style="cursor:pointer">${mo.label}</span>`
    ).join('')}</div>`;
  }

  let statusLabel;
  if (isMonthly) {
    statusLabel = isDone ? '✓ Fait ce mois' : '○ À faire ce mois';
  } else {
    statusLabel = isDone ? '✓ Fait' : card.status === 'en-cours' ? '⏳ En cours' : '○ À faire';
  }

  return `
    <div class="admin-card ${statusClass}" data-id="${card.id}">
      <div class="admin-card-top" style="background:${cat.color}">
        <span class="admin-card-cat">${cat.label}</span>
        <div class="admin-card-actions">
          ${isMonthly ? '<span class="admin-recur-badge">🔄</span>' : ''}
          <span class="admin-urgency-dot" style="background:${urgColor}" title="${card.urgency||'normal'}"></span>
          <button class="admin-btn-edit" onclick="openAdminModal('${card.id}')" title="Modifier">✎</button>
          <button class="admin-btn-del" onclick="deleteAdminCard('${card.id}')" title="Supprimer">✕</button>
        </div>
      </div>
      <div class="admin-card-body">
        <div class="admin-card-title ${isDone ? 'admin-title-done' : ''}">${esc(card.title)}</div>
        ${card.url ? `<div class="admin-card-url"><a href="${esc(card.url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" title="${esc(card.url)}">🔗 ${esc((() => { try { return new URL(card.url).hostname.replace(/^www\./,''); } catch(e) { return card.url; } })())}</a></div>` : ''}
        ${card.note ? `<div class="admin-card-note">${esc(card.note)}</div>` : ''}
        ${dueFmt ? `<div class="admin-card-due ${overdue ? 'admin-due-overdue' : ''}">📅 ${dueFmt}${adminJBadge(days, isDone)}${overdue ? ' — En retard' : ''}${isMonthly ? ' (chaque mois)' : ''}</div>` : ''}
        ${historyHtml}
        <div class="admin-card-footer">
          <button class="admin-status-btn ${isDone ? 'admin-status-btn-done' : ''}" onclick="cycleAdminStatus('${card.id}')">${statusLabel}</button>
        </div>
      </div>
    </div>`;
}

function renderAdminSection(label, icon, cards, ym, MONTH_NAMES, extraClass) {
  if (!cards.length) return '';
  return `
    <div class="admin-section${extraClass ? ' ' + extraClass : ''}">
      <div class="admin-section-header">
        <span class="admin-section-icon">${icon}</span>
        <span class="admin-section-label">${label}</span>
        <span class="admin-section-count">${cards.length}</span>
      </div>
      <div class="admin-grid">${cards.map(c => renderAdminCard(c, ym, MONTH_NAMES)).join('')}</div>
    </div>`;
}

function renderAdmin() {
  const el = document.getElementById('admin-content');
  if (!el) return;
  const cards = state.adminCards || [];
  const ym = currentYearMonth();

  const total   = cards.length;
  const pending = cards.filter(c => !isAdminCardDone(c)).length;
  const done    = cards.filter(c => isAdminCardDone(c)).length;

  const filterCat = state.adminCatFilter || '';
  const filtered = filterCat ? cards.filter(c => c.category === filterCat) : cards;

  const catOptions = ADMIN_CATEGORIES.map(c =>
    `<option value="${c.value}" ${filterCat === c.value ? 'selected' : ''}>${c.label}</option>`
  ).join('');

  const MONTH_NAMES = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];

  // Separate done from pending
  const pendingCards = filtered.filter(c => !isAdminCardDone(c));
  const doneCards    = filtered.filter(c => isAdminCardDone(c));

  // Among pending: separate monthly from punctual
  const monthlyCards   = pendingCards.filter(c => c.recurrence === 'monthly');
  const punctualCards  = pendingCards.filter(c => c.recurrence !== 'monthly');

  // Sort punctual by due date ascending (null/empty last)
  const sortByDue = (a, b) => {
    const da = adminCardDueDate(a), db = adminCardDueDate(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da < db ? -1 : da > db ? 1 : 0;
  };
  punctualCards.sort(sortByDue);

  // Sort monthly by dayOfMonth ascending
  monthlyCards.sort((a, b) => (a.dayOfMonth || 99) - (b.dayOfMonth || 99));

  // Group punctual into time buckets
  const overdue   = punctualCards.filter(c => { const d = adminDaysUntil(c); return d !== null && d < 0; });
  const thisWeek  = punctualCards.filter(c => { const d = adminDaysUntil(c); return d !== null && d >= 0 && d <= 7; });
  const thisMonth = punctualCards.filter(c => { const d = adminDaysUntil(c); return d !== null && d > 7 && d <= 30; });
  const later     = punctualCards.filter(c => { const d = adminDaysUntil(c); return d === null || d > 30; });

  const sectionsHtml = [
    renderAdminSection('En retard',      '🔴', overdue,    ym, MONTH_NAMES, 'admin-section-overdue'),
    renderAdminSection('Cette semaine',  '⚡', thisWeek,   ym, MONTH_NAMES, 'admin-section-week'),
    renderAdminSection('Ce mois',        '📅', thisMonth,  ym, MONTH_NAMES, 'admin-section-month'),
    renderAdminSection('À venir',        '📋', later,      ym, MONTH_NAMES, ''),
    renderAdminSection('Tâches mensuelles', '🔄', monthlyCards, ym, MONTH_NAMES, 'admin-section-monthly'),
    renderAdminSection('Terminées',      '✓',  doneCards,  ym, MONTH_NAMES, 'admin-section-done'),
  ].join('');

  el.innerHTML = `
    <div class="admin-toolbar">
      <div class="admin-summary">
        <span class="admin-summary-stat"><strong>${total}</strong> vignette${total !== 1 ? 's' : ''}</span>
        <span class="admin-summary-sep">·</span>
        <span class="admin-summary-stat"><strong>${pending}</strong> en cours</span>
        <span class="admin-summary-sep">·</span>
        <span class="admin-summary-stat admin-done-count"><strong>${done}</strong> terminée${done !== 1 ? 's' : ''}</span>
      </div>
      <div class="admin-toolbar-right">
        <select class="sort-select" onchange="state.adminCatFilter=this.value;renderAdmin()">
          <option value="">Toutes catégories</option>
          ${catOptions}
        </select>
        <button class="btn-primary" onclick="openAdminModal(null)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouvelle vignette
        </button>
      </div>
    </div>
    ${filtered.length === 0
      ? `<div class="empty-state"><div class="empty-icon">🗂️</div><h3>${filterCat ? 'Aucune vignette dans cette catégorie' : 'Aucune vignette'}</h3><p>Ajoutez vos tâches administratives.</p><button class="btn-primary" onclick="openAdminModal(null)">Ajouter une vignette</button></div>`
      : sectionsHtml
    }
    ${renderActifsSection()}
    ${renderFestivalCostsSection()}
  `;
}

function openAdminModal(id) {
  const card = id ? (state.adminCards || []).find(c => c.id === id) : null;
  document.getElementById('admin-modal-title').textContent = card ? 'Modifier la vignette' : 'Nouvelle vignette';
  document.getElementById('admin-card-id').value          = card ? card.id : '';
  document.getElementById('admin-card-title').value       = card ? card.title : '';
  document.getElementById('admin-card-note').value        = card ? (card.note || '') : '';
  document.getElementById('admin-card-due').value         = card ? (card.dueDate || '') : '';
  document.getElementById('admin-card-status').value      = card ? (card.status || 'todo') : 'todo';
  document.getElementById('admin-card-category').value    = card ? (card.category || 'autre') : 'autre';
  document.getElementById('admin-card-urgency').value     = card ? (card.urgency || 'normal') : 'normal';
  document.getElementById('admin-card-recurrence').value  = card ? (card.recurrence || '') : '';
  document.getElementById('admin-card-dayofmonth').value  = card ? (card.dayOfMonth || '') : '';
  document.getElementById('admin-card-url').value         = card ? (card.url || '') : '';
  onAdminRecurrenceChange(card ? (card.recurrence || '') : '');
  document.getElementById('modal-admin').classList.remove('hidden');
  setTimeout(() => document.getElementById('admin-card-title').focus(), 50);
}

function closeAdminModal() {
  document.getElementById('modal-admin').classList.add('hidden');
}

function submitAdminCard(e) {
  e.preventDefault();
  const id        = document.getElementById('admin-card-id').value;
  const title     = document.getElementById('admin-card-title').value.trim();
  if (!title) return;
  const recurrence = document.getElementById('admin-card-recurrence').value || null;
  const existing   = id ? (state.adminCards || []).find(c => c.id === id) : null;
  const card = {
    id:                id || uid(),
    title,
    note:              document.getElementById('admin-card-note').value.trim(),
    dueDate:           recurrence === 'monthly' ? '' : (document.getElementById('admin-card-due').value || ''),
    status:            recurrence === 'monthly' ? 'todo' : (document.getElementById('admin-card-status').value || 'todo'),
    category:          document.getElementById('admin-card-category').value || 'autre',
    urgency:           document.getElementById('admin-card-urgency').value || 'normal',
    recurrence,
    dayOfMonth:        recurrence === 'monthly' ? (parseInt(document.getElementById('admin-card-dayofmonth').value) || null) : null,
    url:               document.getElementById('admin-card-url').value.trim(),
    completionHistory: existing ? (existing.completionHistory || []) : [],
    createdAt:         existing ? (existing.createdAt || today()) : today(),
  };
  if (!state.adminCards) state.adminCards = [];
  if (id) {
    const idx = state.adminCards.findIndex(c => c.id === id);
    if (idx >= 0) state.adminCards[idx] = card;
  } else {
    state.adminCards.unshift(card);
  }
  saveState();
  closeAdminModal();
  renderAdmin();
}

function deleteAdminCard(id) {
  if (!confirm('Supprimer cette vignette ?')) return;
  state.adminCards = (state.adminCards || []).filter(c => c.id !== id);
  saveState();
  renderAdmin();
}

function cycleAdminStatus(id) {
  const card = (state.adminCards || []).find(c => c.id === id);
  if (!card) return;
  if (card.recurrence === 'monthly') {
    const ym = currentYearMonth();
    const alreadyDone = (card.completionHistory || []).some(h => h.month === ym);
    if (alreadyDone) {
      card.completionHistory = card.completionHistory.filter(h => h.month !== ym);
    } else {
      if (!card.completionHistory) card.completionHistory = [];
      card.completionHistory.push({ month: ym, doneAt: new Date().toISOString() });
    }
  } else {
    const cycle = ['todo', 'en-cours', 'fait'];
    card.status = cycle[(cycle.indexOf(card.status || 'todo') + 1) % cycle.length];
    if (card.status === 'fait') card.doneAt = new Date().toISOString();
    else delete card.doneAt;
  }
  saveState();
  renderAdmin();
  if (state.activePage === 'tasks') renderTasks();
  if (state.activePage === 'home') renderDashboard();
}

function toggleAdminMonth(cardId, ym) {
  const card = (state.adminCards || []).find(c => c.id === cardId);
  if (!card || card.recurrence !== 'monthly') return;
  if (!card.completionHistory) card.completionHistory = [];
  const alreadyDone = card.completionHistory.some(h => h.month === ym);
  if (alreadyDone) {
    card.completionHistory = card.completionHistory.filter(h => h.month !== ym);
  } else {
    card.completionHistory.push({ month: ym, doneAt: new Date().toISOString() });
  }
  saveState();
  renderAdmin();
  if (state.activePage === 'tasks') renderTasks();
  if (state.activePage === 'home') renderDashboard();
}

// ═══════════════════════════════════════════════════
// ACTIFS DE LA SOCIÉTÉ
// ═══════════════════════════════════════════════════

const ACTIF_CATEGORIES = [
  { value: 'immobilisations', label: 'Immobilisations', color: '#6366f1' },
  { value: 'charges',         label: 'Charges',         color: '#ef4444' },
  { value: 'amortissements',  label: 'Amortissements',  color: '#f59e0b' },
  { value: 'autre',           label: 'Autre',           color: '#64748b' },
];

function formatEur(v) {
  const n = parseFloat(v);
  if (isNaN(n) || v === '' || v === null || v === undefined) return '—';
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function renderActifsSection() {
  const actifs = state.actifs || [];
  const totalTTC = actifs.reduce((s, a) => s + (parseFloat(a.prixTTC) || 0) * (parseFloat(a.quantite) || 1), 0);

  const groups = ACTIF_CATEGORIES.map(cat => ({
    ...cat,
    items: actifs.filter(a => a.categorie === cat.value),
  })).filter(g => g.items.length > 0);

  const tableRows = items => items.map(a => `
    <tr>
      <td>${esc(a.nom)}</td>
      <td class="actif-td-num">${a.quantite ?? '—'}</td>
      <td class="actif-td-num">${formatEur(a.prixHT)}</td>
      <td class="actif-td-num">${formatEur(a.prixTTC)}</td>
      <td>${esc(a.emplacement || '—')}</td>
      <td class="actif-td-actions">
        <button class="actif-btn-edit" onclick="openActifModal('${a.id}')" title="Modifier">✎</button>
        <button class="actif-btn-del" onclick="deleteActif('${a.id}')" title="Supprimer">✕</button>
      </td>
    </tr>`).join('');

  const body = groups.length
    ? groups.map(g => `
      <div class="actif-cat-block">
        <div class="actif-cat-header" style="border-left-color:${g.color}">
          <span class="actif-cat-label" style="color:${g.color}">${g.label}</span>
          <span class="actif-cat-count">${g.items.length} actif${g.items.length > 1 ? 's' : ''}</span>
        </div>
        <table class="actif-table">
          <thead><tr><th>Nom</th><th>Qté</th><th>Prix HT</th><th>Prix TTC</th><th>Emplacement</th><th></th></tr></thead>
          <tbody>${tableRows(g.items)}</tbody>
        </table>
      </div>`).join('')
    : `<div class="actif-empty">Aucun actif enregistré. Ajoutez vos biens, charges et amortissements.</div>`;

  return `
    <div class="actifs-section">
      <div class="actifs-header">
        <div class="actifs-title">
          <span class="actifs-icon">🏢</span>
          <h3>Actifs de la société</h3>
          ${actifs.length ? `<span class="actifs-total">Total TTC : <strong>${formatEur(totalTTC)}</strong></span>` : ''}
        </div>
        <button class="btn-primary btn-sm" onclick="openActifModal(null)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un actif
        </button>
      </div>
      ${body}
    </div>`;
}

function renderFestivalCostsSection() {
  const COST_KEYS   = ['transport', 'parking', 'ticket', 'food', 'lodging'];
  const COST_LABELS = {
    transport: '🚗 Transport',
    parking:   '🅿️ Parking',
    ticket:    '🎟️ Billet/Stand',
    food:      '🍔 Nourriture',
    lodging:   '🛏️ Logement',
  };

  const festivals = (state.festivals || [])
    .filter(f => festivalTotalCost(f) > 0)
    .sort((a, b) => (a.dateStart || '').localeCompare(b.dateStart || ''));

  const catTotals = {};
  COST_KEYS.forEach(k => { catTotals[k] = 0; });
  let grandTotal = 0;
  festivals.forEach(f => {
    const c = f.costs || {};
    COST_KEYS.forEach(k => { catTotals[k] += (+c[k] || 0); });
    grandTotal += festivalTotalCost(f);
  });

  const body = festivals.length === 0
    ? `<div class="actif-empty">Aucun festival avec des coûts enregistrés.</div>`
    : `<div style="overflow-x:auto">
        <table class="actif-table fest-costs-table">
          <thead>
            <tr>
              <th>Festival</th>
              ${COST_KEYS.map(k => `<th class="actif-td-num">${COST_LABELS[k]}</th>`).join('')}
              <th class="actif-td-num">Total</th>
            </tr>
          </thead>
          <tbody>
            ${festivals.map(f => {
              const c = f.costs || {};
              const total = festivalTotalCost(f);
              const fIcon = FEST_ICONS[f.category] || '🎪';
              const dateLabel = f.dateStart
                ? new Date(f.dateStart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                : '';
              return `<tr>
                <td>
                  <span class="fest-costs-name" onclick="openFestivalDetail('${f.id}')">${fIcon} ${esc(f.name)}</span>
                  ${dateLabel ? `<br><span class="fest-costs-date">${dateLabel}</span>` : ''}
                </td>
                ${COST_KEYS.map(k => `<td class="actif-td-num">${(+c[k] || 0) > 0 ? formatEur(+c[k]) : '<span class="fest-costs-zero">—</span>'}</td>`).join('')}
                <td class="actif-td-num fest-costs-row-total">${formatEur(total)}</td>
              </tr>`;
            }).join('')}
          </tbody>
          <tfoot>
            <tr class="fest-costs-grand-total">
              <td>💶 Grand total</td>
              ${COST_KEYS.map(k => `<td class="actif-td-num">${catTotals[k] > 0 ? formatEur(catTotals[k]) : '<span class="fest-costs-zero">—</span>'}</td>`).join('')}
              <td class="actif-td-num">${formatEur(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>`;

  return `
    <div class="actifs-section">
      <div class="actifs-header">
        <div class="actifs-title">
          <span class="actifs-icon">🎪</span>
          <h3>Coûts des Festivals</h3>
          ${festivals.length ? `<span class="actifs-total">${festivals.length} festival${festivals.length > 1 ? 's' : ''} · Grand total&nbsp;: <strong>${formatEur(grandTotal)}</strong></span>` : ''}
        </div>
      </div>
      ${body}
    </div>`;
}

function openActifModal(id) {
  const a = id ? (state.actifs || []).find(x => x.id === id) : null;
  document.getElementById('actif-modal-title').textContent = a ? "Modifier l'actif" : 'Nouvel actif';
  document.getElementById('actif-id').value          = a ? a.id : '';
  document.getElementById('actif-nom').value         = a ? a.nom : '';
  document.getElementById('actif-categorie').value   = a ? (a.categorie || 'immobilisations') : 'immobilisations';
  document.getElementById('actif-quantite').value    = a ? (a.quantite ?? 1) : 1;
  document.getElementById('actif-prixHT').value      = a ? (a.prixHT ?? '') : '';
  document.getElementById('actif-prixTTC').value     = a ? (a.prixTTC ?? '') : '';
  document.getElementById('actif-emplacement').value = a ? (a.emplacement || '') : '';
  document.getElementById('actif-note').value        = a ? (a.note || '') : '';
  document.getElementById('modal-actif').classList.remove('hidden');
}

function closeActifModal() {
  document.getElementById('modal-actif').classList.add('hidden');
}

function submitActif(event) {
  event.preventDefault();
  const id = document.getElementById('actif-id').value;
  const existing = id ? (state.actifs || []).find(x => x.id === id) : null;
  const data = {
    id:          id || uid(),
    nom:         document.getElementById('actif-nom').value.trim(),
    categorie:   document.getElementById('actif-categorie').value,
    quantite:    parseFloat(document.getElementById('actif-quantite').value) || 1,
    prixHT:      document.getElementById('actif-prixHT').value !== '' ? parseFloat(document.getElementById('actif-prixHT').value) : '',
    prixTTC:     document.getElementById('actif-prixTTC').value !== '' ? parseFloat(document.getElementById('actif-prixTTC').value) : '',
    emplacement: document.getElementById('actif-emplacement').value.trim(),
    note:        document.getElementById('actif-note').value.trim(),
    createdAt:   existing ? existing.createdAt : new Date().toISOString(),
  };
  if (!data.nom) return;
  if (!state.actifs) state.actifs = [];
  if (existing) {
    const idx = state.actifs.findIndex(x => x.id === id);
    state.actifs[idx] = data;
  } else {
    state.actifs.push(data);
  }
  saveState();
  closeActifModal();
  renderAdmin();
}

function deleteActif(id) {
  if (!confirm('Supprimer cet actif ?')) return;
  state.actifs = (state.actifs || []).filter(x => x.id !== id);
  saveState();
  renderAdmin();
}

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
loadState();
updateInterestUI(3);
// Update all nav counts immediately so they show correct numbers before tab switch
(function updateAllNavCounts() {
  document.getElementById('nav-contacts-count').textContent = state.contacts.length;
  document.getElementById('nav-prototypes-count').textContent = state.prototypes.length;
  const pendingTasks = state.contacts.reduce((n, c) => n + (c.tasks||[]).filter(t => !t.done).length, 0)
    + state.prototypes.reduce((n, p) => n + (p.tasks||[]).filter(t => !t.done).length, 0)
    + (state.standaloneTasks||[]).filter(t => !t.done).length
    + (state.adminCards||[]).filter(c => !isAdminCardDone(c)).length
    + (state.festivals||[]).reduce((n, f) => n + (f.presences||[]).filter(p => !p.done).length + (f.tasks||[]).filter(t => !t.done).length, 0);
  document.getElementById('nav-tasks-count').textContent = pendingTasks;
  const agendaCount = state.contacts.reduce((n, c) => n + (c.exchanges||[]).length, 0);
  document.getElementById('nav-agenda-count').textContent = agendaCount;
  document.getElementById('nav-festivals-count').textContent = (state.festivals||[]).length;
})();
// Sync UI controls to default state
document.getElementById('contacts-sort').value = state.contactsSort;
document.getElementById('contacts-zoom').value = state.contactsZoom;
document.getElementById('prototypes-sort').value = state.prototypesSort;
document.getElementById('prototypes-zoom').value = state.prototypesZoom;
switchPage('home');
