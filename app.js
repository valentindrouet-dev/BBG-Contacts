/* ═══════════════════════════════════════════════════
   BBG CONTACTS — app.js
═══════════════════════════════════════════════════ */
'use strict';

// ── STATE ──────────────────────────────────────────
const state = {
  contacts:   [],
  prototypes: [],
  activePage: 'contacts',

  contactsSearch:    '',
  contactsCat:       '',
  contactsUrgency:   '',
  contactsSort:      'category',
  contactsSortAsc:   true,
  contactsView:      'grid',
  contactsZoom:      2,

  prototypesSearch:  '',
  prototypesStatus:  '',
  prototypesInterest:'',
  prototypesTag:     '',
  prototypesSort:    'status',
  prototypesSortAsc: true,
  prototypesView:    'grid',
  prototypesZoom:    1,

  compareMode:        false,
  selectedForCompare: [],
  tasksFilter:        'all',
};

// ── STORAGE ────────────────────────────────────────
function saveState() {
  localStorage.setItem('bbg-contacts',   JSON.stringify(state.contacts));
  localStorage.setItem('bbg-prototypes', JSON.stringify(state.prototypes));
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
  if (!Array.isArray(c.socials)) c.socials = [];
  return c;
}
const STATUS_MIGRATE = { concept: 'proto', test: 'proto', finalisation: 'production', publié: 'sorti' };

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
  return p;
}

function loadState() {
  // SAFE load: never overwrite localStorage on error to avoid data loss
  let c, p;
  try { c = localStorage.getItem('bbg-contacts'); } catch(e) {}
  try { p = localStorage.getItem('bbg-prototypes'); } catch(e) {}

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
  proto: '🧩', signé: '✍️', développement: '🔧', production: '🏭', sorti: '🚀'
};

const URGENCY_EMOJI = { faible: '💤', normal: '📌', urgent: '⚠️', critique: '🚨' };

const CAT_LABELS = {
  auteur: 'Auteurs', illustrateur: 'Illustrateurs', editeur: 'Éditeurs',
  distributeur: 'Distributeurs', fabricant: 'Fabricants'
};

const INTEREST_LABELS = ['', 'Faible', 'Moyen', 'Fort', 'Très fort', 'Exceptionnel'];

const SOCIAL_TYPES = ['LinkedIn', 'Twitter/X', 'Instagram', 'BGG', 'Site web', 'Autre'];
const EXCHANGE_TYPES = ['rencontre', 'email', 'appel', 'salon', 'message', 'autre'];
const STATUS_ORDER = ['proto', 'signé', 'développement', 'production', 'sorti'];

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
  // Show/hide Ajouter button (not relevant on tasks page)
  document.getElementById('btn-add').style.display = page === 'tasks' ? 'none' : '';
  if (page === 'contacts')   renderContacts();
  if (page === 'prototypes') renderPrototypes();
  if (page === 'tasks')      renderTasks();
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
  if (state.contactsUrgency === 'none') {
    list = list.filter(c => !(c.tasks || []).some(t => !t.done));
  } else if (state.contactsUrgency) {
    list = list.filter(c => getTopUrgency(c) === state.contactsUrgency);
  }
  list.sort((a, b) => {
    let cmp = 0;
    switch (state.contactsSort) {
      case 'name':        cmp = a.name.localeCompare(b.name, 'fr'); break;
      case 'category':    cmp = a.category.localeCompare(b.category, 'fr'); break;
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
      case 'status':    cmp = a.status.localeCompare(b.status, 'fr'); break;
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
}

// ═══════════════════════════════════════════════════
// RENDER — CONTACTS
// ═══════════════════════════════════════════════════
function renderContacts() {
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

  const badge = `<span class="badge badge-${cat} card-badge"
    style="${isMin ? 'font-size:.6rem;padding:.1rem .35rem' : ''}">${
      isMin ? (cat.charAt(0)||'?').toUpperCase() : esc(cat)
    }</span>`;

  // Urgency emoji visible on all cards with pending tasks
  const urgEmoji = topTask
    ? `<span class="card-urg-emoji" title="Tâche ${urg}">${URGENCY_EMOJI[urg] || ''}</span>`
    : '';

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
      if (c.email) extra += `<p class="card-detail-row">${ICONS.mail} ${esc(c.email)}</p>`;
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

  const allDone = (c.tasks||[]).length > 0 && (c.tasks||[]).every(t => t.done);
  const doneClass = allDone ? ' card-task-done' : '';

  return `<div class="card card-hover card-bg-${cat}${doneClass}"
    onclick="openDetail('contact','${c.id}')" title="${esc(c.name)}">
    <div class="card-media card-media-${cat}">
      ${mediaContent}${badge}${urgEmoji}${extLink}${editBtn}
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
// RENDER — PROTOTYPES
// ═══════════════════════════════════════════════════
function renderPrototypes() {
  const list      = filteredPrototypes();
  const gridEl    = document.getElementById('prototypes-grid');
  const listEl    = document.getElementById('prototypes-list');
  const timelineEl= document.getElementById('prototypes-timeline');
  const empty     = document.getElementById('prototypes-empty');

  document.getElementById('nav-prototypes-count').textContent = state.prototypes.length;
  document.getElementById('prototypes-count').textContent =
    `${list.length} prototype${list.length !== 1 ? 's' : ''}`;

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
    gridEl.innerHTML = list.map(p => prototypeCard(p, state.prototypesZoom)).join('');
  }
}

/* ── Prototypes timeline / roadmap ── */
function buildPrototypesTimeline(list) {
  return `<div class="timeline-board">${STATUS_ORDER.map(status => {
    const items = list.filter(p => p.status === status);
    const icon  = PROTO_ICONS[status] || '🎮';
    return `<div class="timeline-col">
      <div class="timeline-col-header" style="background:var(--card-media-${status},#f1f5f9)">
        <span>${icon}</span><span>${status}</span>
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

  const badge = isMin
    ? `<span class="badge badge-${p.status} card-badge" style="font-size:.6rem;padding:.1rem .35rem">${esc(p.status.charAt(0).toUpperCase())}</span>`
    : `<span class="badge badge-${p.status} card-badge">${esc(p.status)}</span>`;

  const editBtn = `<button class="card-edit-btn" ${isMin ? 'style="padding:.2rem"' : ''}
    onclick="event.stopPropagation();editPrototype('${p.id}')" title="Modifier">${ICONS.pencil}</button>`;

  const mediaContent = p.photo
    ? `<img src="${esc(p.photo)}" class="card-photo" alt="" />`
    : `<span class="card-game-icon">${icon}</span>`;

  const urgEmoji = topTask
    ? `<span class="card-urg-emoji" title="Tâche ${urg}">${URGENCY_EMOJI[urg] || ''}</span>`
    : '';

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
  const doneClass = allDoneP ? ' card-task-done' : '';

  const compareCheck = state.compareMode
    ? `<input type="checkbox" class="card-compare-check"
        ${state.selectedForCompare.includes(p.id) ? 'checked' : ''}
        onclick="event.stopPropagation();toggleCompareSelect('${p.id}',this)" />`
    : '';

  return `<div class="card card-hover${doneClass}"
    onclick="${state.compareMode ? '' : `openDetail('prototype','${p.id}')`}" title="${esc(p.title)}" style="${state.compareMode ? 'cursor:default' : ''}">
    <div class="card-media card-media-${p.status}">
      ${compareCheck}${mediaContent}${badge}${urgEmoji}${editBtn}
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
        <td><span class="badge badge-${p.status}">${esc(p.status)}</span></td>
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
        task: t.text, urgency: t.urgency || 'normal', done: t.done || false });
    });
  });
  state.prototypes.forEach(p => {
    (p.tasks || []).forEach(t => {
      tasks.push({ itemId: p.id, taskId: t.id, type: 'prototype', name: p.title,
        task: t.text, urgency: t.urgency || 'normal', done: t.done || false });
    });
  });

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

  // Sort
  tasks.sort((a, b) => {
    if (sortBy === 'urgency') return URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (sortBy === 'source')  return a.type.localeCompare(b.type) || a.name.localeCompare(b.name, 'fr');
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
  } else {
    listEl.innerHTML = tasks.map(t => taskCard(t)).join('');
  }
}

function taskCard(t) {
  const typeEmoji = t.type === 'contact' ? '👤' : '🎲';
  return `<div class="task-card${t.done ? ' done' : ''}">
    <input type="checkbox" class="task-check" ${t.done ? 'checked' : ''}
      onclick="event.stopPropagation();toggleTaskDone('${t.type}','${t.itemId}','${t.taskId}')" />
    <div class="task-body" onclick="openDetail('${t.type}','${t.itemId}')">
      <span class="task-source">${typeEmoji} ${esc(t.name)}</span>
      <span class="task-text">${esc(t.task)}</span>
      <span class="task-meta"><span class="badge badge-urgence-${t.urgency}">${esc(t.urgency)}</span></span>
    </div>
  </div>`;
}

function toggleTaskDone(type, itemId, taskId) {
  if (type === 'contact') {
    const c = state.contacts.find(x => x.id === itemId);
    if (c) {
      const t = (c.tasks || []).find(x => x.id === taskId);
      if (t) t.done = !t.done;
    }
    saveState();
    renderContacts();
  } else {
    const p = state.prototypes.find(x => x.id === itemId);
    if (p) {
      const t = (p.tasks || []).find(x => x.id === taskId);
      if (t) t.done = !t.done;
    }
    saveState();
    renderPrototypes();
  }
  if (state.activePage === 'tasks') renderTasks();
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
    if (state.contactsCat)     active++;
    if (state.contactsUrgency) active++;
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
    <td><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}

function getTasksFromForm(prefix) {
  const tbody = document.getElementById(`${prefix}-tasks-body`);
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr')).map(tr => {
    const inputs = tr.querySelectorAll('input[type="text"], select');
    return {
      id:      tr.dataset.taskId || uid(),
      text:    inputs[0]?.value.trim() || '',
      urgency: inputs[1]?.value || 'normal',
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
    <td><input type="date" value="${esc(entry.date || today())}" /></td>
    <td><input type="text" placeholder="Note de développement…" value="${esc(entry.note || '')}" /></td>
    <td><button type="button" class="btn-del-row" onclick="this.closest('tr').remove()" title="Supprimer">✕</button></td>`;
  tbody.appendChild(tr);
}
function getDevLogFromForm() {
  const tbody = document.getElementById('proto-devlog-body');
  if (!tbody) return [];
  return Array.from(tbody.querySelectorAll('tr')).map(tr => ({
    id:   tr.dataset.entryId || uid(),
    date: tr.querySelector('input[type="date"]')?.value || '',
    note: tr.querySelector('input[type="text"]')?.value.trim() || '',
  })).filter(e => e.note);
}
function populateDevLogForm(devLog = []) {
  const tbody = document.getElementById('proto-devlog-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  devLog.forEach(e => addDevLogRow(e));
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
}

document.querySelectorAll('.modal-overlay').forEach(ov =>
  ov.addEventListener('click', e => {
    if (e.target === ov) closeModal(ov.id.replace('modal-', ''));
  })
);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['contact','prototype','detail','confirm','compare'].forEach(t =>
      document.getElementById('modal-' + t)?.classList.add('hidden')
    );
    document.body.style.overflow = '';
  }
});

// ── Contact form ──────────────────────────────────
function resetContactForm() {
  ['contact-id','contact-name','contact-email','contact-phone',
   'contact-company','contact-website','contact-notes',
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
  document.getElementById('contact-company').value   = c.company  || '';
  document.getElementById('contact-website').value   = c.website  || '';
  document.getElementById('contact-notes').value     = c.notes    || '';
  document.getElementById('contact-photo-url').value = c.photo    || '';
  _updatePhotoPreview('contact', c.photo || '');
  populateTasksForm('contact', c.tasks || []);
  populateGamesForm(c.games || []);
  populateExchangesForm(c.exchanges || []);
  populateSocialsForm(c.socials || []);
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
    website:        document.getElementById('contact-website').value.trim(),
    notes:          document.getElementById('contact-notes').value.trim(),
    photo:     document.getElementById('contact-photo-url').value.trim(),
    exchanges: getExchangesFromForm(),
    socials:        getSocialsFromForm(),
    games:          getGamesFromForm(),
  };
  if (id) {
    const i = state.contacts.findIndex(x => x.id === id);
    const existing = state.contacts[i];
    // Preserve done state for tasks that already exist
    data.tasks = newTasks.map(t => {
      const old = (existing.tasks || []).find(o => o.id === t.id);
      return old ? { ...t, done: old.done } : t;
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
  clearProtoPdf();
  const intEl = document.querySelector('input[name="proto-interest"][value="3"]');
  if (intEl) { intEl.checked = true; updateInterestUI(3); }
  populateTasksForm('proto', []);
  populateContactLinksForm([]);
  populateDevLogForm([]);
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

  const tagsEl = document.getElementById('prototype-tags');
  if (tagsEl) tagsEl.value = (p.tags || []).join(', ');

  // PDF
  _protoPdfData = p.pdf || null;
  document.getElementById('proto-pdf-name').textContent = p.pdfName || (p.pdf ? 'Règles.pdf' : 'Aucun fichier');
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
    tags,
    devLog:       getDevLogFromForm(),
  };
  if (id) {
    const i = state.prototypes.findIndex(x => x.id === id);
    const existing = state.prototypes[i];
    data.tasks = newTasks.map(t => {
      const old = (existing.tasks || []).find(o => o.id === t.id);
      return old ? { ...t, done: old.done } : t;
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
function openDetail(type, id) {
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
    const exchSorted = [...(c.exchanges||[])].sort((a,b) => b.date.localeCompare(a.date));
    const meetHtml = exchSorted.length > 0
      ? `<div class="detail-section-title">Historique des échanges</div>
         <div class="exchange-list">${exchSorted.map(e => `
           <div class="exchange-item">
             <span class="exchange-date">${e.date}</span>
             <span class="exchange-type">${esc(e.type||'rencontre')}</span>
             <span class="exchange-note">${esc(e.note||'')}</span>
           </div>`).join('')}
         </div>`
      : '';

    // Socials
    const socialsDetailHtml = (c.socials||[]).length > 0
      ? `<div class="detail-section-title">Réseaux sociaux</div>
         <div class="social-links">${(c.socials||[]).map(s =>
           `<a class="social-icon" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.type)} ↗</a>`
         ).join('')}</div>`
      : '';

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
        <button class="modal-close" onclick="closeModal('detail')" style="flex-shrink:0;margin-left:.5rem">✕</button>
      </div>
      <div class="detail-inner">
        <div class="detail-section-title">Coordonnées</div>
        <div class="detail-kv-grid">
          ${c.email  ? `<div class="detail-kv"><label>Email</label><span>${esc(c.email)}</span></div>` : ''}
          ${c.phone  ? `<div class="detail-kv"><label>Téléphone</label><span>${esc(c.phone)}</span></div>` : ''}
          ${c.website? `<div class="detail-kv"><label>Site web</label>
            <a href="${esc(c.website)}" target="_blank" rel="noopener">${esc(c.website.replace(/^https?:\/\//,''))}</a></div>` : ''}
        </div>
        ${(c.tasks||[]).length > 0 ? `<div class="detail-section-title">Tâches</div>
          ${(c.tasks||[]).map(t => `
          <div style="display:flex;align-items:center;gap:.5rem;margin-top:.35rem;flex-wrap:wrap">
            <input type="checkbox" ${t.done?'checked':''} style="width:14px;height:14px;cursor:pointer;accent-color:var(--primary-600)"
              onchange="toggleTaskDone('contact','${c.id}','${t.id}');openDetail('contact','${c.id}')" />
            <span class="badge badge-urgence-${t.urgency||'normal'}">${esc(t.urgency||'normal')}</span>
            <span style="font-size:.875rem;color:var(--text-700);${t.done?'text-decoration:line-through;opacity:.5':''}">${esc(t.text)}</span>
          </div>`).join('')}` : ''}
        ${socialsDetailHtml}
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
                  <span class="badge badge-${p.status}" style="margin-left:auto">${esc(p.status)}</span>
                </div>`;
              }).join('')}
            </div>`;
        })()}
        <div class="detail-actions">
          <button class="btn-save" onclick="closeModal('detail');editContact('${c.id}')">Modifier</button>
          <button class="btn-cancel" onclick="closeModal('detail');confirmDelete('contact','${c.id}')">Supprimer</button>
        </div>
      </div>`;

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
          <span class="badge badge-${p.status}" style="margin-left:auto;flex-shrink:0">${esc(p.status)}</span>
        </div>
        <button class="modal-close" onclick="closeModal('detail')" style="flex-shrink:0;margin-left:.5rem">✕</button>
      </div>
      <div class="detail-inner">
        ${p.description ? `<div class="detail-section-title">Description</div>
          <div class="detail-notes">${esc(p.description)}</div>` : ''}
        <div class="detail-section-title">Caractéristiques</div>
        <div class="detail-kv-grid">
          ${p.players  ? `<div class="detail-kv"><label>Joueurs</label><span>${esc(p.players)}</span></div>`  : ''}
          ${p.duration ? `<div class="detail-kv"><label>Durée</label><span>${esc(p.duration)}</span></div>`   : ''}
          ${p.age      ? `<div class="detail-kv"><label>Âge</label><span>${esc(p.age)}</span></div>`          : ''}
          ${date       ? `<div class="detail-kv"><label>Date d'ajout</label><span>${date}</span></div>`        : ''}
          <div class="detail-kv"><label>Intérêt</label><span>${'⭐'.repeat(p.interest||3)} ${INTEREST_LABELS[p.interest||3]}</span></div>
        </div>
        ${(p.tasks||[]).length > 0 ? `<div class="detail-section-title">Tâches</div>
          ${(p.tasks||[]).map(t => `
          <div style="display:flex;align-items:center;gap:.5rem;margin-top:.35rem;flex-wrap:wrap">
            <input type="checkbox" ${t.done?'checked':''} style="width:14px;height:14px;cursor:pointer;accent-color:var(--primary-600)"
              onchange="toggleTaskDone('prototype','${p.id}','${t.id}');openDetail('prototype','${p.id}')" />
            <span class="badge badge-urgence-${t.urgency||'normal'}">${esc(t.urgency||'normal')}</span>
            <span style="font-size:.875rem;color:var(--text-700);${t.done?'text-decoration:line-through;opacity:.5':''}">${esc(t.text)}</span>
          </div>`).join('')}` : ''}
        ${contactLinksHtml}
        ${(p.tags||[]).length > 0 ? `<div class="detail-section-title">Tags mécaniques</div>
          <div class="tags-cloud">${(p.tags||[]).map(t=>`<span class="tag-chip">${esc(t)}</span>`).join('')}</div>` : ''}
        ${p.notes ? `<div class="detail-section-title">Notes de développement</div>
          <div class="detail-notes">${esc(p.notes)}</div>` : ''}
        ${(p.devLog||[]).length > 0 ? `<div class="detail-section-title">Journal de développement</div>
          <div class="devlog-list">${[...(p.devLog||[])].sort((a,b)=>b.date.localeCompare(a.date)).map(e => `
            <div class="devlog-item">
              <div class="devlog-date">${e.date}</div>
              <div class="devlog-note">${esc(e.note)}</div>
            </div>`).join('')}</div>` : ''}
        ${p.pdf ? `<div class="detail-section-title">Règles du jeu</div>
          <div class="pdf-viewer-wrap">
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem">
              <span class="pdf-name">📄 ${esc(p.pdfName||'Règles.pdf')}</span>
              <button class="pdf-open-btn" onclick="openPdfBlob('${p.id}')">Ouvrir dans un onglet</button>
            </div>
            <iframe id="pdf-preview-frame-${p.id}" class="pdf-viewer-frame" title="Règles du jeu"></iframe>
          </div>` : ''}
        <div class="detail-actions">
          <button class="btn-save" onclick="closeModal('detail');editPrototype('${p.id}')">Modifier</button>
          <button class="btn-cancel" onclick="closeModal('detail');confirmDelete('prototype','${p.id}')">Supprimer</button>
        </div>
      </div>`;
  }

  document.getElementById('modal-detail').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
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

function exportExcel(type) {
  if (typeof XLSX === 'undefined') { alert('La bibliothèque XLSX n\'est pas chargée.'); return; }
  const data = type === 'contacts' ? state.contacts : state.prototypes;
  const ws   = XLSX.utils.json_to_sheet(data.map(item => {
    if (type === 'contacts') {
      const topT = getTopTask(item);
      return {
        Nom: item.name, Catégorie: item.category,
        Email: item.email||'', Téléphone: item.phone||'',
        Entreprise: item.company||'', 'Site web': item.website||'',
        'Tâche principale': topT ? topT.text : '',
        'Urgence principale': topT ? topT.urgency : '',
        'Nombre de tâches': (item.tasks||[]).length,
        'Dernière rencontre': item.lastMeeting||'',
        'Note rencontre': item.lastMeetingNote||'',
        Notes: item.notes||'',
      };
    } else {
      const topT = getTopTask(item);
      const contactNames = (item.contactLinks||[]).map(l => {
        const c = state.contacts.find(x => x.id === l.contactId);
        return c ? `${c.name}${l.role ? ' ('+l.role+')' : ''}` : '';
      }).filter(Boolean).join(', ');
      return {
        Titre: item.title, Statut: item.status,
        Genre: item.genre||'', Joueurs: item.players||'',
        Durée: item.duration||'', Âge: item.age||'',
        Intérêt: item.interest||3,
        'Tâche principale': topT ? topT.text : '',
        'Urgence principale': topT ? topT.urgency : '',
        'Nombre de tâches': (item.tasks||[]).length,
        Description: item.description||'',
        Contacts: contactNames, Notes: item.notes||'',
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
      if (type === 'contacts') {
        const imported = rows.map(r => {
          const tasks = [];
          if (r['Tâche principale']) tasks.push({ id: uid(), text: r['Tâche principale'], urgency: r['Urgence principale']||'normal', done: false });
          return {
            id: uid(), createdAt: today(),
            name: r['Nom']||'', category: r['Catégorie']||'auteur',
            email: r['Email']||'', phone: r['Téléphone']||'',
            company: r['Entreprise']||'', website: r['Site web']||'',
            tasks,
            lastMeeting: r['Dernière rencontre']||'',
            lastMeetingNote: r['Note rencontre']||'',
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
            title: r['Titre']||'', status: r['Statut']||'concept',
            genre: r['Genre']||'', players: r['Joueurs']||'',
            duration: r['Durée']||'', age: r['Âge']||'',
            interest: parseInt(r['Intérêt'])||3,
            tasks, contactLinks: [],
            description: r['Description']||'',
            notes: r['Notes']||'',
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

// Add button
document.getElementById('btn-add').addEventListener('click', () =>
  openModal(state.activePage === 'contacts' ? 'contact' : 'prototype')
);

// ── Contacts ──────────────────────────────────────
document.getElementById('contacts-search').addEventListener('input', e => {
  state.contactsSearch = e.target.value; renderContacts();
});
document.getElementById('contacts-filter-toggle').addEventListener('click', () =>
  toggleFilterPanel('contacts')
);
document.getElementById('contacts-cat-filter').addEventListener('change', e => {
  state.contactsCat = e.target.value; renderContacts();
});
document.getElementById('contacts-urgency-filter').addEventListener('change', e => {
  state.contactsUrgency = e.target.value; renderContacts();
});
document.getElementById('contacts-filter-reset').addEventListener('click', () => {
  state.contactsCat = ''; state.contactsUrgency = '';
  document.getElementById('contacts-cat-filter').value = '';
  document.getElementById('contacts-urgency-filter').value = '';
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
// Sync UI controls to default state
document.getElementById('contacts-sort').value = state.contactsSort;
document.getElementById('contacts-zoom').value = state.contactsZoom;
document.getElementById('prototypes-sort').value = state.prototypesSort;
document.getElementById('prototypes-zoom').value = state.prototypesZoom;
switchPage('contacts');
