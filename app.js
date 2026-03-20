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
  compareMode:        false,
  selectedForCompare: [],
  tasksFilter:        'all',
  tasksSourceFilter:  [],   // [] = tout, 'contacts', 'jeux'
  contactsFavoriteOnly: false,
  agendaSortAsc:      false,
  agendaTypeFilters:   [],   // [] = tous types
  agendaSourceFilter: [],   // [] = tout, 'contacts', 'jeux'
};

// ── STORAGE ────────────────────────────────────────
function saveState() {
  localStorage.setItem('bbg-contacts',         JSON.stringify(state.contacts));
  localStorage.setItem('bbg-prototypes',       JSON.stringify(state.prototypes));
  localStorage.setItem('bbg-festivals',        JSON.stringify(state.festivals));
  localStorage.setItem('bbg-standalone-tasks', JSON.stringify(state.standaloneTasks));
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

function loadState() {
  // SAFE load: never overwrite localStorage on error to avoid data loss
  let c, p, f, s;
  try { c = localStorage.getItem('bbg-contacts'); } catch(e) {}
  try { p = localStorage.getItem('bbg-prototypes'); } catch(e) {}
  try { f = localStorage.getItem('bbg-festivals'); } catch(e) {}
  try { s = localStorage.getItem('bbg-standalone-tasks'); } catch(e) {}

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
  pnp: '⏳', imprimer: '🖨️', tester: '🧪', évalué: '✅',
  développement: '🔧', production: '🏭', standby: '💤', sorti: '🚀', abandonné: '❌', 'non-retenu': '🚫'
};
const STATUS_LABELS = {
  pnp: 'En attente de Règles / PNP', imprimer: 'À Imprimer', tester: 'À tester', évalué: 'Évalué',
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
const STATUS_ORDER = ['développement', 'tester', 'évalué', 'imprimer', 'pnp', 'production', 'standby', 'sorti', 'abandonné', 'non-retenu'];

// ── Task helpers ───────────────────────────────────
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
    ...state.prototypes.flatMap(p => (p.tasks||[]).filter(t => !t.done).map(t => ({...t, _from:'prototype', _name: p.title, _id: p.id}))),
    ...(state.standaloneTasks||[]).filter(t => !t.done).map(t => ({...t, _from:'standalone', _name:'Tâche libre', _id:t.id})),
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

    ${dueNow.length > 0 ? `
    <div class="dash-section">
      <div class="dash-section-title">🔔 Échéances dépassées ou du jour</div>
      ${dueNow.map(t => {
        const nav = t._from === 'standalone'
          ? "switchPage('tasks')"
          : `switchPage('${t._from === 'contact' ? 'contacts' : 'prototypes'}');openDetail('${t._from}','${t._id}')`;
        const diffDays = Math.floor((new Date(today_str) - new Date(t.dueDate)) / 86400000);
        const lateLabel = diffDays === 0 ? "Aujourd'hui" : diffDays === 1 ? '1j de retard' : `${diffDays}j de retard`;
        const lateColor = diffDays === 0 ? '#7c3aed' : '#dc2626';
        return `
        <div class="dash-task-row dash-task-due">
          <input type="checkbox" class="task-check" onclick="event.stopPropagation();toggleTaskDone('${t._from}','${t._id}','${t.id}')" />
          <div style="flex:1;display:flex;align-items:center;gap:.5rem;min-width:0;cursor:pointer" onclick="${nav}">
            <span class="badge badge-urgence-${t.urgency||'normal'}">${URGENCY_EMOJI[t.urgency||'normal']||''} ${t.urgency||'normal'}</span>
            <span class="dash-task-text">${esc(t.text)}</span>
            <span class="dash-task-source">${esc(t._name)}</span>
            <span class="dash-task-date dash-task-date-editable" style="color:${lateColor}" data-date="${t.dueDate}" onclick="event.stopPropagation();openTaskDatePicker(this,'${t._from}','${t._id}','${t.id}')" title="Modifier la date">${new Date(t.dueDate).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'})}</span>
            <span class="dash-days-badge" style="color:${lateColor};background:${lateColor}1a">${lateLabel}</span>
          </div>
        </div>`;
      }).join('')}
    </div>` : ''}

    ${upcomingTasks.length > 0 ? `
    <div class="dash-section">
      <div class="dash-section-title">📆 Tâches à venir</div>
      ${upcomingTasks.map(t => {
        const days = Math.ceil((new Date(t.dueDate) - new Date(today_str)) / 86400000);
        const dayLabel = days === 1 ? 'demain' : `dans ${days} j`;
        const dayColor = days <= 3 ? '#ea580c' : days <= 7 ? '#ca8a04' : '#16a34a';
        const dateLabel = new Date(t.dueDate).toLocaleDateString('fr-FR', {day:'2-digit', month:'short'});
        const nav = t._from === 'standalone'
          ? "switchPage('tasks')"
          : `switchPage('${t._from === 'contact' ? 'contacts' : 'prototypes'}');openDetail('${t._from}','${t._id}')`;
        return `
        <div class="dash-task-row">
          <input type="checkbox" class="task-check" onclick="event.stopPropagation();toggleTaskDone('${t._from}','${t._id}','${t.id}')" />
          <div style="flex:1;display:flex;align-items:center;gap:.5rem;min-width:0;cursor:pointer" onclick="${nav}">
            <span class="badge badge-urgence-${t.urgency||'normal'}">${URGENCY_EMOJI[t.urgency||'normal']||''} ${t.urgency||'normal'}</span>
            <span class="dash-task-text">${esc(t.text)}</span>
            <span class="dash-task-source">${esc(t._name)}</span>
            <span class="dash-task-date dash-task-date-editable" data-date="${t.dueDate}" onclick="event.stopPropagation();openTaskDatePicker(this,'${t._from}','${t._id}','${t.id}')" title="Modifier la date">${dateLabel}</span>
            <span class="dash-days-badge" style="color:${dayColor};background:${dayColor}1a">${dayLabel}</span>
          </div>
        </div>`;
      }).join('')}
    </div>` : ''}

    ${(() => {
      const upcomingFests = [...state.festivals]
        .filter(f => f.dateStart && f.dateStart > today_str)
        .sort((a,b) => a.dateStart.localeCompare(b.dateStart))
        .slice(0, 5);
      if (!upcomingFests.length) return `<div class="dash-section"><p style="color:var(--text-500);font-size:.875rem">🎪 Aucun festival à venir.</p></div>`;
      return `<div class="dash-section">
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
      case 'category':    cmp = a.category.localeCompare(b.category, 'fr') || a.name.localeCompare(b.name, 'fr'); break;
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
    ? `<img src="${esc(c.photo)}" class="card-photo" alt="" />`
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
          ? `<img src="${esc(c.photo)}" class="list-photo" alt="" />`
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

  const mediaContent = p.photo
    ? `<img src="${esc(p.photo)}" class="card-photo" alt="" />`
    : `<span class="card-game-icon">${icon}</span>`;

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
      const taskCell = topTask
        ? `<div class="td-task">
            <span class="badge badge-urgence-${urg}" style="flex-shrink:0">${esc(urg)}</span>
            <span class="td-task-text">${esc(topTask.text)}</span>
            ${pendingCount > 1 ? `<span class="card-task-count">${pendingCount}</span>` : ''}
          </div>` : '';
      return `<tr onclick="openDetail('prototype','${p.id}')">
        <td class="col-avatar"><span class="list-proto-icon">${PROTO_ICONS[p.status]||'🎮'}</span></td>
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
    (p.tasks || []).forEach(t => {
      tasks.push({ itemId: p.id, taskId: t.id, type: 'prototype', name: p.title,
        category: 'prototype',
        task: t.text, urgency: t.urgency || 'normal', done: t.done || false, dueDate: t.dueDate, doneAt: t.doneAt });
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
  });

  // Stats sidebar (always on full dataset, before any filter)
  renderTasksStats(tasks);

  // Source filter (state-based)
  const srcFilter = state.tasksSourceFilter || [];
  if (srcFilter.length > 0) {
    tasks = tasks.filter(t => {
      if (srcFilter.includes('contacts') && (t.type === 'contact' || t.type === 'standalone')) return true;
      if (srcFilter.includes('jeux') && t.type === 'prototype') return true;
      return false;
    });
  }

  const total   = tasks.length;
  const pending = tasks.filter(t => !t.done).length;
  document.getElementById('nav-tasks-count').textContent = pending;
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
  } else {
    if (!showDone) tasks = tasks.filter(t => !t.done);
  }

  if (tasks.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  const CAT_TASK_ORDER = ['editeur', 'distributeur', 'auteur', 'fabricant', 'illustrateur', 'prototype', 'standalone'];
  const CAT_TASK_LABELS = { ...CAT_LABELS, prototype: 'Prototypes', standalone: 'Tâches libres' };

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
        <span>${g.type === 'contact' ? '👤' : '🎲'}</span>
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
  const typeEmoji = t.type === 'standalone' ? '📋' : t.type === 'contact' ? '👤' : t.type === 'festival' ? '🎪' : '🎲';
  const dueBadge = t.dueDate
    ? `<span class="task-due task-due-editable${t.dueDate < today() ? ' overdue' : ''}" data-date="${t.dueDate}" onclick="event.stopPropagation();openTaskDatePicker(this,'${t.type}','${t.itemId}','${t.taskId}')" title="Modifier la date">${t.dueDate}</span>`
    : `<span class="task-due task-due-add" data-date="" onclick="event.stopPropagation();openTaskDatePicker(this,'${t.type}','${t.itemId}','${t.taskId}')" title="Ajouter une date">+ date</span>`;
  const doneAtBadge = (t.done && t.doneAt)
    ? `<span class="task-done-at" title="Terminée le ${new Date(t.doneAt).toLocaleString('fr-FR')}">✓ ${new Date(t.doneAt).toLocaleDateString('fr-FR', {day:'2-digit',month:'short'})}</span>`
    : '';
  const clickBody = t.type === 'standalone'
    ? `onclick="editStandaloneTask('${t.itemId}')"`
    : t.type === 'festival'
      ? `onclick="openFestivalDetail('${t.itemId}')"`
      : `onclick="openDetail('${t.type}','${t.itemId}')"`;
  const delBtn = t.type === 'standalone'
    ? `<button class="task-del-btn" onclick="event.stopPropagation();deleteStandaloneTask('${t.itemId}')" title="Supprimer">✕</button>`
    : t.type === 'festival'
      ? `<button class="task-del-btn" onclick="event.stopPropagation();removeFestivalPresence('${t.itemId}','${t.taskId}')" title="Supprimer">✕</button>`
      : '';
  return `<div class="task-card${t.done ? ' done' : ''}">
    <input type="checkbox" class="task-check" ${t.done ? 'checked' : ''}
      onclick="event.stopPropagation();toggleTaskDone('${t.type}','${t.itemId}','${t.taskId}')" />
    <div class="task-body" ${clickBody}>
      <span class="task-source">${typeEmoji} ${esc(t.name)}</span>
      <span class="task-text">${esc(t.task)}</span>
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
  } else {
    const p = state.prototypes.find(x => x.id === itemId);
    if (p) { const t = (p.tasks || []).find(x => x.id === taskId); if (t) t.dueDate = newDate; }
  }
  saveState();
  if (state.activePage === 'tasks') renderTasks();
  if (state.activePage === 'home') renderDashboard();
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

function getTasksFromForm(prefix) {
  const tbody = document.getElementById(`${prefix}-tasks-body`);
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr')).map(tr => {
    const text    = tr.querySelector('input[type="text"]')?.value.trim() || '';
    const urgency = tr.querySelector('select')?.value || 'normal';
    const dueDate = tr.querySelector('input[type="date"]')?.value || '';
    return {
      id:      tr.dataset.taskId || uid(),
      text,
      urgency,
      dueDate: dueDate || undefined,
      done:    false,
    };
  }).filter(t => t.text);
}

function populateTasksForm(prefix, tasks = []) {
  const tbody = document.getElementById(`${prefix}-tasks-body`);
  if (!tbody) return;
  tbody.innerHTML = '';
  tasks.forEach(t => addTaskRow(prefix, t));
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

  el.innerHTML = `
    <div class="fstat-block">
      <div class="fstat-title">Échanges</div>
      <div class="fstat-big">${total}</div>
      ${countMonth ? `<div class="fstat-sub">Ce mois · ${countMonth}</div>` : ''}
      ${countYear  ? `<div class="fstat-sub">${thisYear} · ${countYear}</div>` : ''}
    </div>

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

  document.getElementById('nav-agenda-count').textContent = entries.length;

  // Source filter (Contacts / Jeux / Festivals / Tâches)
  const activeSrc = state.agendaSourceFilter || [];
  const showContacts  = activeSrc.length === 0 || activeSrc.includes('contacts');
  const showJeux      = activeSrc.length === 0 || activeSrc.includes('jeux');
  const showFestivals = activeSrc.length === 0 || activeSrc.includes('festivals');
  const showTasks     = activeSrc.length === 0 || activeSrc.includes('tasks');
  const showEvals     = activeSrc.length === 0 || activeSrc.includes('evals');

  // Type filter — applies to contact exchanges and jeux devlog
  const activeTypes = state.agendaTypeFilters || [];
  let filtered = entries.filter(e => {
    if (e._source === 'festival') return showFestivals;
    if (e._source === 'jeux')    return showJeux;
    if (e._source === 'evals')   return showEvals;
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

  renderAgendaStats(entries);  // stats always on full dataset

  if (filtered.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  // Sort
  filtered.sort((a, b) => state.agendaSortAsc
    ? a.date.localeCompare(b.date)
    : b.date.localeCompare(a.date)
  );

  // Group by month
  const groups = {};
  filtered.forEach(e => {
    const d = new Date(e.date);
    const key = isNaN(d) ? 'Date inconnue' : d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    (groups[key] = groups[key] || []).push(e);
  });

  const EXCH_EMOJI = { rencontre: '🤝', email: '📧', appel: '📞', salon: '🎪', message: '💬', autre: '📝' };

  let html = '';

  for (const [month, evts] of Object.entries(groups)) {
    html += `<div class="agenda-month-header">${month}</div>`;
    evts.forEach(e => {
      const d = new Date(e.date);
      const dateStr = isNaN(d) ? e.date : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
      if (e._source === 'evals') {
        html += `<div class="agenda-entry" onclick="openDetail('prototype','${e.protoId}')">
          <span class="agenda-date">${dateStr}</span>
          <span class="agenda-type-badge"><span class="badge" style="background:#fef9c3;border:1px solid #fde047;color:#854d0e;font-size:.7rem">⭐ Éval</span></span>
          <div class="agenda-contact-wrap">
            <span class="agenda-contact-name" style="color:var(--text-700);font-weight:600">🎲 ${esc(e.protoTitle)}</span>
          </div>
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
          : `openDetail('prototype','${e.taskFromId}')`;
        const fromIcon = e.taskFrom === 'contact' ? '👤' : '🎲';
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
    ['contact','prototype','festival','detail','confirm','compare','standalone-task'].forEach(t =>
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
   'prototype-notes','proto-photo-url'].forEach(id => {
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
  } else {
    state.prototypes.unshift({ id: uid(), createdAt: today(), tasks: newTasks, ...data });
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
      ? `<img src="${esc(c.photo)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--border)" alt="" />`
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
            ? `<img src="${esc(contact.photo)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0" />`
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
            ? `<img src="${esc(p.photo)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--border)" alt="" />`
            : `<span style="font-size:1.75rem;line-height:1">${icon}</span>`}
          <div style="min-width:0">
            <div style="font-size:1.05rem;font-weight:700;color:var(--text-800);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.title)}</div>
            ${p.genre ? `<div style="font-size:.8rem;color:var(--text-500)">${esc(p.genre)}</div>` : ''}
          </div>
          <span class="badge badge-${p.status}" style="margin-left:auto;flex-shrink:0">${icon} ${esc(STATUS_LABELS[p.status]||p.status)}</span>
        </div>
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
          const row = t => `
            <div class="detail-task-row">
              <input type="checkbox" ${t.done?'checked':''} style="width:14px;height:14px;cursor:pointer;accent-color:var(--primary-600)"
                onchange="toggleTaskDone('prototype','${p.id}','${t.id}');openDetail('prototype','${p.id}')" />
              <span class="badge badge-urgence-${t.urgency||'normal'}">${esc(t.urgency||'normal')}</span>
              <span style="font-size:.875rem;color:var(--text-700);${t.done?'text-decoration:line-through;opacity:.5':''}">${esc(t.text)}</span>
              ${(t.done && t.doneAt) ? `<span class="task-done-at" title="Terminée le ${new Date(t.doneAt).toLocaleString('fr-FR')}">✓ ${new Date(t.doneAt).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</span>` : ''}
            </div>`;
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
          if (!sessions.length) return '';
          const rated = sessions.filter(s => s.rating);
          const avg = rated.length ? (rated.reduce((sum,s) => sum + s.rating, 0) / rated.length) : null;
          const avgStars = avg !== null
            ? `<span class="test-avg-badge" title="${avg.toFixed(1)}/5">${'⭐'.repeat(Math.round(avg))} <span style="font-size:.72rem;color:var(--text-500)">${avg.toFixed(1)}/5 (${rated.length} noté${rated.length>1?'s':''})</span></span>`
            : '';
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
            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
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
          return `<div class="detail-section-title" style="display:flex;align-items:center;gap:.6rem">Sessions de test ${avgStars}</div>
          <table style="width:100%;border-collapse:collapse;font-size:.82rem;margin-top:.3rem">
            <thead><tr style="color:var(--text-500)">
              <th style="text-align:left;padding:.2rem .4rem">Date</th>
              <th style="text-align:center;padding:.2rem .4rem">Joueurs</th>
              <th style="text-align:center;padding:.2rem .4rem">Note</th>
              <th style="text-align:left;padding:.2rem .4rem">Commentaires</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>`;
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
// IMPORT / EXPORT EXCEL
// ═══════════════════════════════════════════════════
function toggleImportExport() {
  const panel = document.getElementById('import-export-panel');
  panel.style.display = panel.style.display === 'none' ? '' : 'none';
}

function exportBackup() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    contacts:        state.contacts,
    prototypes:      state.prototypes,
    standaloneTasks: state.standaloneTasks,
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
      if (!confirm(`Restaurer la sauvegarde du ${data.exportedAt ? new Date(data.exportedAt).toLocaleString('fr-FR') : 'date inconnue'} ?\n\n${data.contacts.length} contact(s), ${data.prototypes.length} prototype(s).\n\nATTENTION : les données actuelles seront remplacées.`)) return;
      state.contacts        = data.contacts.map(migrateContact);
      state.prototypes      = data.prototypes.map(migratePrototype);
      state.standaloneTasks = Array.isArray(data.standaloneTasks) ? data.standaloneTasks : [];
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
  const data = type === 'contacts' ? state.contacts : state.prototypes;
  const ws   = XLSX.utils.json_to_sheet(data.map(item => {
    if (type === 'contacts') {
      const topT = getTopTask(item);
      return {
        Nom: item.name, Catégorie: item.category,
        Favori: item.favorite ? 'oui' : 'non',
        Email: item.email||'', Téléphone: item.phone||'',
        Entreprise: item.company||'', 'Site web': item.website||'',
        Photo: item.photo||'',
        'Tâche principale': topT ? topT.text : '',
        'Urgence principale': topT ? topT.urgency : '',
        'Nombre de tâches': (item.tasks||[]).length,
        Notes: item.notes||'',
        Échanges: JSON.stringify(item.exchanges||[]),
        Réseaux: JSON.stringify(item.socials||[]),
        Vidéos: JSON.stringify(item.videos||[]),
      };
    } else {
      const topT = getTopTask(item);
      const contactNames = (item.contactLinks||[]).map(l => {
        const c = state.contacts.find(x => x.id === l.contactId);
        return c ? `${c.name}${l.role ? ' ('+l.role+')' : ''}` : '';
      }).filter(Boolean).join(', ');
      const totalCost = (item.costs||[]).reduce((s,c) => s + (c.price||0), 0);
      return {
        Titre: item.title, Statut: item.status,
        Genre: item.genre||'', Joueurs: item.players||'',
        Durée: item.duration||'', Âge: item.age||'',
        Intérêt: item.interest||3,
        'Tâche principale': topT ? topT.text : '',
        'Urgence principale': topT ? topT.urgency : '',
        'Nombre de tâches': (item.tasks||[]).length,
        Description: item.description||'',
        Notes: item.notes||'',
        Tags: (item.tags||[]).join(', '),
        Contacts: contactNames,
        'Coût total (€)': totalCost.toFixed(2),
        Photo: item.photo||'',
        Vidéos: JSON.stringify(item.videos||[]),
        Coûts: JSON.stringify(item.costs||[]),
        'Journal dev': JSON.stringify(item.devLog||[]),
      };
    }
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, type === 'contacts' ? 'Contacts' : 'Prototypes');
  XLSX.writeFile(wb, `bbg-${type}-${today()}.xlsx`);
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
    + (state.standaloneTasks||[]).filter(t => !t.done).length;
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
