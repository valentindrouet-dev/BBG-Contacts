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
  contactsStatus:    '',
  contactsSort:      'name',
  contactsSortAsc:   true,
  contactsView:      'grid',  // 'grid' | 'list'
  contactsZoom:      2,       // 0–4

  prototypesSearch:  '',
  prototypesStatus:  '',
  prototypesSort:    'title',
  prototypesSortAsc: true,
  prototypesView:    'grid',
  prototypesZoom:    2,
};

// ── STORAGE ────────────────────────────────────────
function saveState() {
  localStorage.setItem('bbg-contacts',   JSON.stringify(state.contacts));
  localStorage.setItem('bbg-prototypes', JSON.stringify(state.prototypes));
}
function loadState() {
  try {
    const c = localStorage.getItem('bbg-contacts');
    const p = localStorage.getItem('bbg-prototypes');
    state.contacts   = c ? JSON.parse(c) : SEED_CONTACTS;
    state.prototypes = p ? JSON.parse(p) : SEED_PROTOTYPES;
    if (!c || !p) saveState();
  } catch(e) {
    state.contacts   = SEED_CONTACTS;
    state.prototypes = SEED_PROTOTYPES;
    saveState();
  }
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

/* ── Card dimension formula (exact Kicktraquer CampagneCard) ── */
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
  upload:  `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  plus:    `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  users:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  chevUp:  `<polyline points="18 15 12 9 6 15"/>`,
  chevDown:`<polyline points="6 9 12 15 18 9"/>`,
};

const PROTO_ICONS = {
  concept: '💡', développement: '🔧', test: '🧪', finalisation: '✨', publié: '🚀'
};

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
  if (page === 'contacts')   renderContacts();
  if (page === 'prototypes') renderPrototypes();
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
  if (state.contactsCat)    list = list.filter(c => c.category === state.contactsCat);
  if (state.contactsStatus) list = list.filter(c => c.status   === state.contactsStatus);
  list.sort((a, b) => {
    let cmp = 0;
    switch (state.contactsSort) {
      case 'name':     cmp = a.name.localeCompare(b.name, 'fr'); break;
      case 'category': cmp = a.category.localeCompare(b.category, 'fr'); break;
      case 'status':   cmp = a.status.localeCompare(b.status, 'fr'); break;
      case 'company':  cmp = (a.company||'').localeCompare(b.company||'', 'fr'); break;
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
    (p.genre        || '').toLowerCase().includes(q) ||
    (p.description  || '').toLowerCase().includes(q)
  );
  if (state.prototypesStatus) list = list.filter(p => p.status === state.prototypesStatus);
  list.sort((a, b) => {
    let cmp = 0;
    switch (state.prototypesSort) {
      case 'title':     cmp = a.title.localeCompare(b.title, 'fr'); break;
      case 'status':    cmp = a.status.localeCompare(b.status, 'fr'); break;
      case 'createdAt': cmp = (a.createdAt||'').localeCompare(b.createdAt||''); break;
    }
    return state.prototypesSortAsc ? cmp : -cmp;
  });
  return list;
}

// Column sort helpers (called from table headers)
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
// RENDER — CONTACTS
// ═══════════════════════════════════════════════════
function renderContacts() {
  const list  = filteredContacts();
  const gridEl = document.getElementById('contacts-grid');
  const listEl = document.getElementById('contacts-list');
  const empty  = document.getElementById('contacts-empty');

  document.getElementById('nav-contacts-count').textContent = state.contacts.length;
  document.getElementById('contacts-count').textContent =
    `${list.length} contact${list.length !== 1 ? 's' : ''}`;

  updateFilterCount('contacts');

  if (list.length === 0) {
    gridEl.innerHTML = '';    gridEl.style.display = 'none';
    listEl.innerHTML = '';    listEl.style.display = 'none';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  if (state.contactsView === 'list') {
    gridEl.style.display = 'none';
    listEl.style.display = '';
    listEl.innerHTML = buildContactsTable(list);
  } else {
    listEl.style.display = 'none';
    gridEl.style.display = '';
    gridEl.dataset.zoom  = state.contactsZoom;   // CSS custom props handle card size
    gridEl.innerHTML = list.map(c => contactCard(c, state.contactsZoom)).join('');
  }
}

/* ── Contact card (zoom-aware — sizes come from CSS custom props on .card-grid) ── */
function contactCard(c, zoom) {
  const isMin = zoom <= 1;
  const cat   = c.category || 'auteur';
  const urg   = c.taskUrgency || 'normal';

  const mediaContent = c.photo
    ? `<img src="${c.photo}" class="card-photo" alt="" />`
    : `<div class="card-avatar card-avatar-${cat}">${initials(c.name)}</div>`;

  const badge = `<span class="badge badge-${cat} card-badge"
    style="${isMin ? 'font-size:.6rem;padding:.1rem .35rem' : ''}">${
      isMin ? (cat.charAt(0) || '?').toUpperCase() : esc(cat)
    }</span>`;

  const extLink = !isMin && c.website
    ? `<a class="card-ext-link" href="${c.website}" target="_blank" rel="noopener"
         onclick="event.stopPropagation()">${ICONS.extLink}</a>`
    : '';

  const editBtn = `<button class="card-edit-btn"
    onclick="event.stopPropagation();editContact('${c.id}')">${ICONS.pencil}</button>`;

  let body = '';
  if (!isMin) {
    const subtitle = c.company || c.email || '';
    let extra = '';
    if (zoom >= 3) {
      if (c.email) extra += `<p class="card-detail-row">${ICONS.mail} ${esc(c.email)}</p>`;
      if (c.phone) extra += `<p class="card-detail-row">${ICONS.phone} ${esc(c.phone)}</p>`;
    }
    if (zoom >= 4 && c.task) {
      extra += `<div class="card-task">
        <span class="badge badge-urgence-${urg}">${esc(urg)}</span>
        <span class="card-task-text">${esc(c.task)}</span>
      </div>`;
    }
    const taskPill = c.task && zoom < 4
      ? `<span class="badge badge-urgence-${urg}" style="font-size:.6rem">${esc(urg[0].toUpperCase())}</span>`
      : '';
    body = `<div class="card-body">
      <h3 class="card-title">${esc(c.name)}</h3>
      ${subtitle ? `<p class="card-subtitle">${esc(subtitle)}</p>` : ''}
      ${extra}
      <div class="card-footer">
        <span class="badge badge-${c.status || 'actif'}">${esc(c.status || 'actif')}</span>
        ${taskPill}
      </div>
    </div>`;
  }

  return `<div class="card card-hover card-bg-${cat}"
    onclick="openDetail('contact','${c.id}')" title="${esc(c.name)}">
    <div class="card-media card-media-${cat}">
      ${mediaContent}${badge}${extLink}${editBtn}
    </div>
    ${body}
  </div>`;
}

/* ── Contacts — list table ── */
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
      ${th('name',     'Nom',        '22%')}
      ${th('category', 'Catégorie',  '13%')}
      ${th('status',   'Statut',     '10%')}
      ${th('company',  'Entreprise', '15%')}
      <th>Email</th><th>Téléphone</th><th>Tâche</th>
      <th class="col-actions"></th>
    </tr></thead>
    <tbody>${list.map(c => {
      const urg = c.taskUrgency || 'normal';
      const avatar = c.photo
        ? `<img src="${esc(c.photo)}" class="list-photo" alt="" />`
        : `<div class="list-avatar list-avatar-${c.category}">${initials(c.name)}</div>`;
      const taskCell = c.task
        ? `<div class="td-task">
            <span class="badge badge-urgence-${urg}" style="flex-shrink:0">${esc(urg)}</span>
            <span class="td-task-text">${esc(c.task)}</span>
          </div>` : '';
      return `<tr onclick="openDetail('contact','${c.id}')">
        <td class="col-avatar">${avatar}</td>
        <td class="td-fw">${esc(c.name)}</td>
        <td><span class="badge badge-${c.category}">${esc(c.category)}</span></td>
        <td><span class="badge badge-${c.status}">${esc(c.status)}</span></td>
        <td class="td-muted">${esc(c.company||'')}</td>
        <td class="td-muted">${esc(c.email||'')}</td>
        <td class="td-muted">${esc(c.phone||'')}</td>
        <td>${taskCell}</td>
        <td class="col-actions">
          <button class="list-row-btn" onclick="event.stopPropagation();editContact('${c.id}')"
            title="Modifier">${ICONS.pencil}</button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ═══════════════════════════════════════════════════
// RENDER — PROTOTYPES
// ═══════════════════════════════════════════════════
function renderPrototypes() {
  const list   = filteredPrototypes();
  const gridEl = document.getElementById('prototypes-grid');
  const listEl = document.getElementById('prototypes-list');
  const empty  = document.getElementById('prototypes-empty');

  document.getElementById('nav-prototypes-count').textContent = state.prototypes.length;
  document.getElementById('prototypes-count').textContent =
    `${list.length} prototype${list.length !== 1 ? 's' : ''}`;

  updateFilterCount('prototypes');

  if (list.length === 0) {
    gridEl.innerHTML = '';    gridEl.style.display = 'none';
    listEl.innerHTML = '';    listEl.style.display = 'none';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  if (state.prototypesView === 'list') {
    gridEl.style.display = 'none';
    listEl.style.display = '';
    listEl.innerHTML = buildPrototypesTable(list);
  } else {
    listEl.style.display = 'none';
    gridEl.style.display = '';
    gridEl.dataset.zoom  = state.prototypesZoom;
    gridEl.innerHTML = list.map(p => prototypeCard(p, state.prototypesZoom)).join('');
  }
}

/* ── Prototype card (zoom-aware — sizes come from CSS custom props on .card-grid) ── */
function prototypeCard(p, zoom) {
  const isMin = zoom <= 1;
  const icon = PROTO_ICONS[p.status] || '🎮';

  const badge = isMin
    ? `<span class="badge badge-${p.status} card-badge" style="font-size:.6rem;padding:.1rem .35rem">${esc(p.status.charAt(0).toUpperCase())}</span>`
    : `<span class="badge badge-${p.status} card-badge">${esc(p.status)}</span>`;

  const editBtn = `<button class="card-edit-btn" ${isMin ? 'style="padding:.2rem"' : ''}
    onclick="event.stopPropagation();editPrototype('${p.id}')" title="Modifier">${ICONS.pencil}</button>`;

  let body = '';
  if (!isMin) {
    let chips = '';
    if (zoom >= 3) {
      if (p.players)  chips += `<span class="spec-chip">${ICONS.users} ${esc(p.players)}</span>`;
      if (p.duration) chips += `<span class="spec-chip">${ICONS.clock} ${esc(p.duration)}</span>`;
    }
    body = `<div class="card-body">
      <h3 class="card-title">${esc(p.title)}</h3>
      ${p.genre ? `<p class="card-subtitle">${esc(p.genre)}</p>` : ''}
      ${chips ? `<div class="card-specs">${chips}</div>` : ''}
    </div>`;
  }

  return `<div class="card card-hover"
    onclick="openDetail('prototype','${p.id}')" title="${esc(p.title)}">
    <div class="card-media card-media-${p.status}">
      <span class="card-game-icon">${icon}</span>
      ${badge}${editBtn}
    </div>
    ${body}
  </div>`;
}

/* ── Prototypes — list table ── */
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
      ${th('title',     'Titre',    '26%')}
      ${th('status',    'Statut',   '14%')}
      <th>Genre</th><th>Joueurs</th><th>Durée</th>
      ${th('createdAt', 'Ajouté',   '10%')}
      <th class="col-actions"></th>
    </tr></thead>
    <tbody>${list.map(p => {
      const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '';
      return `<tr onclick="openDetail('prototype','${p.id}')">
        <td class="col-avatar"><span class="list-proto-icon">${PROTO_ICONS[p.status]||'🎮'}</span></td>
        <td class="td-fw">${esc(p.title)}</td>
        <td><span class="badge badge-${p.status}">${esc(p.status)}</span></td>
        <td class="td-muted">${esc(p.genre||'')}</td>
        <td class="td-muted">${esc(p.players||'')}</td>
        <td class="td-muted">${esc(p.duration||'')}</td>
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
// FILTER PANEL — collapse / expand
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
    if (state.contactsCat)    active++;
    if (state.contactsStatus) active++;
  } else {
    if (state.prototypesStatus) active++;
  }
  const badge = document.getElementById(`${page}-filter-count`);
  const reset = document.getElementById(`${page}-filter-reset`);
  badge.textContent = `${active} actif${active > 1 ? 's' : ''}`;
  badge.classList.toggle('hidden', active === 0);
  reset?.classList.toggle('hidden', active === 0);
}

// ═══════════════════════════════════════════════════
// PHOTO MANAGEMENT
// ═══════════════════════════════════════════════════
function previewContactPhoto() {
  const url = document.getElementById('contact-photo-url').value.trim();
  _updatePhotoPreview(url);
}
function uploadContactPhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('contact-photo-url').value = e.target.result;
    _updatePhotoPreview(e.target.result);
  };
  reader.readAsDataURL(file);
}
function clearContactPhoto() {
  document.getElementById('contact-photo-url').value = '';
  document.getElementById('contact-photo-file').value = '';
  _updatePhotoPreview('');
}
function _updatePhotoPreview(src) {
  const wrap = document.getElementById('contact-photo-preview');
  if (src) {
    wrap.innerHTML = `<img src="${esc(src)}" class="photo-preview" alt=""
      onerror="this.parentElement.innerHTML='<div class=\\'photo-placeholder\\'>❌</div>'" />`;
  } else {
    wrap.innerHTML = '<div class="photo-placeholder">👤</div>';
  }
}

// ═══════════════════════════════════════════════════
// GAME LIST
// ═══════════════════════════════════════════════════
let _gameRowId = 0;

function addGameRow(game = {}) {
  const tbody = document.getElementById('contact-games-body');
  const tr = document.createElement('tr');
  const statuts = ['', 'En cours', 'Livré', 'Signé', 'En négociation', 'Annulé', 'Autre'];
  const opts = statuts.map(s =>
    `<option value="${s}" ${(game.statut||'') === s ? 'selected':''}>${s || '— Statut —'}</option>`
  ).join('');
  tr.innerHTML = `
    <td><input type="text" placeholder="Titre du jeu" value="${esc(game.title||'')}" /></td>
    <td><input type="text" placeholder="Éditeur"      value="${esc(game.editeur||'')}" /></td>
    <td><input type="text" placeholder="Année"        value="${esc(game.annee||'')}" style="width:58px" /></td>
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
      title:   inputs[0].value.trim(),
      editeur: inputs[1].value.trim(),
      annee:   inputs[2].value.trim(),
      statut:  inputs[3].value,
      notes:   inputs[4].value.trim(),
    };
  }).filter(g => g.title || g.editeur);
}

function populateGamesForm(games = []) {
  document.getElementById('contact-games-body').innerHTML = '';
  _gameRowId = 0;
  games.forEach(g => addGameRow(g));
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
    ['contact','prototype','detail','confirm'].forEach(t =>
      document.getElementById('modal-' + t)?.classList.add('hidden')
    );
    document.body.style.overflow = '';
  }
});

// ── Contact form ──────────────────────────────────
function resetContactForm() {
  ['contact-id','contact-name','contact-email','contact-phone',
   'contact-company','contact-website','contact-notes','contact-task',
   'contact-photo-url'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('contact-photo-file').value = '';
  document.getElementById('contact-category').value = '';
  document.querySelector('input[name="contact-status"][value="actif"]').checked = true;
  document.querySelector('input[name="contact-urgency"][value="normal"]').checked = true;
  _updatePhotoPreview('');
  populateGamesForm([]);
  document.getElementById('modal-contact-title').textContent = 'Nouveau contact';
}

function editContact(id) {
  const c = state.contacts.find(x => x.id === id);
  if (!c) return;
  document.getElementById('contact-id').value       = c.id;
  document.getElementById('contact-name').value     = c.name;
  document.getElementById('contact-category').value = c.category;
  document.getElementById('contact-email').value    = c.email    || '';
  document.getElementById('contact-phone').value    = c.phone    || '';
  document.getElementById('contact-company').value  = c.company  || '';
  document.getElementById('contact-website').value  = c.website  || '';
  document.getElementById('contact-notes').value    = c.notes    || '';
  document.getElementById('contact-task').value     = c.task     || '';
  document.getElementById('contact-photo-url').value = c.photo   || '';
  _updatePhotoPreview(c.photo || '');
  const urg = c.taskUrgency || 'normal';
  const urgEl = document.querySelector(`input[name="contact-urgency"][value="${urg}"]`);
  if (urgEl) urgEl.checked = true;
  const statusEl = document.querySelector(`input[name="contact-status"][value="${c.status}"]`);
  if (statusEl) statusEl.checked = true;
  populateGamesForm(c.games || []);
  document.getElementById('modal-contact-title').textContent = 'Modifier le contact';
  openModal('contact');
}

function submitContact(e) {
  e.preventDefault();
  const id   = document.getElementById('contact-id').value;
  const urg  = document.querySelector('input[name="contact-urgency"]:checked')?.value || 'normal';
  const data = {
    name:         document.getElementById('contact-name').value.trim(),
    category:     document.getElementById('contact-category').value,
    email:        document.getElementById('contact-email').value.trim(),
    phone:        document.getElementById('contact-phone').value.trim(),
    company:      document.getElementById('contact-company').value.trim(),
    website:      document.getElementById('contact-website').value.trim(),
    notes:        document.getElementById('contact-notes').value.trim(),
    task:         document.getElementById('contact-task').value.trim(),
    taskUrgency:  urg,
    photo:        document.getElementById('contact-photo-url').value.trim(),
    status:       document.querySelector('input[name="contact-status"]:checked').value,
    games:        getGamesFromForm(),
  };
  if (id) {
    const i = state.contacts.findIndex(x => x.id === id);
    state.contacts[i] = { ...state.contacts[i], ...data };
  } else {
    state.contacts.unshift({ id: uid(), createdAt: today(), ...data });
  }
  saveState(); closeModal('contact'); renderContacts();
}

// ── Prototype form ────────────────────────────────
function resetPrototypeForm() {
  ['prototype-id','prototype-title','prototype-genre','prototype-players',
   'prototype-duration','prototype-age','prototype-description',
   'prototype-contacts','prototype-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('prototype-status').value = '';
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
  document.getElementById('prototype-contacts').value    = p.contacts     || '';
  document.getElementById('prototype-notes').value       = p.notes        || '';
  document.getElementById('modal-prototype-title').textContent = 'Modifier le prototype';
  openModal('prototype');
}

function submitPrototype(e) {
  e.preventDefault();
  const id   = document.getElementById('prototype-id').value;
  const data = {
    title:       document.getElementById('prototype-title').value.trim(),
    status:      document.getElementById('prototype-status').value,
    genre:       document.getElementById('prototype-genre').value.trim(),
    players:     document.getElementById('prototype-players').value.trim(),
    duration:    document.getElementById('prototype-duration').value.trim(),
    age:         document.getElementById('prototype-age').value.trim(),
    description: document.getElementById('prototype-description').value.trim(),
    contacts:    document.getElementById('prototype-contacts').value.trim(),
    notes:       document.getElementById('prototype-notes').value.trim(),
  };
  if (id) {
    const i = state.prototypes.findIndex(x => x.id === id);
    state.prototypes[i] = { ...state.prototypes[i], ...data };
  } else {
    state.prototypes.unshift({ id: uid(), createdAt: today(), ...data });
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
    state.contacts   = state.contacts.filter(x => x.id !== id);
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
    const urg = c.taskUrgency || 'normal';
    const avatar = c.photo
      ? `<img src="${esc(c.photo)}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--border)" alt="" />`
      : `<div class="card-avatar card-avatar-${c.category}" style="position:static;transform:none;width:44px;height:44px;font-size:1rem">${initials(c.name)}</div>`;

    const gamesHtml = (c.games || []).length > 0
      ? `<div class="detail-section-title">Jeux associés</div>
         <div class="game-list-wrap"><table class="game-list-table">
           <thead><tr><th>Jeu</th><th>Éditeur</th><th>Année</th><th>Statut</th><th>Notes</th></tr></thead>
           <tbody>${c.games.map(g => `<tr>
             <td>${esc(g.title||'')}</td><td>${esc(g.editeur||'')}</td>
             <td>${esc(g.annee||'')}</td><td>${esc(g.statut||'')}</td><td>${esc(g.notes||'')}</td>
           </tr>`).join('')}</tbody>
         </table></div>`
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
          ${c.email  ? `<div class="detail-kv"><label>Email</label><span>${esc(c.email)}</span></div>`  : ''}
          ${c.phone  ? `<div class="detail-kv"><label>Téléphone</label><span>${esc(c.phone)}</span></div>` : ''}
          ${c.website? `<div class="detail-kv"><label>Site web</label>
            <a href="${esc(c.website)}" target="_blank" rel="noopener">${esc(c.website.replace(/^https?:\/\//,''))}</a></div>` : ''}
          <div class="detail-kv"><label>Statut</label>
            <span class="badge badge-${c.status}">${esc(c.status)}</span></div>
        </div>
        ${c.task ? `<div class="detail-section-title">Tâche en cours</div>
          <div style="display:flex;align-items:center;gap:.5rem;margin-top:.25rem">
            <span class="badge badge-urgence-${urg}">${esc(urg)}</span>
            <span style="font-size:.875rem;color:var(--text-700)">${esc(c.task)}</span>
          </div>` : ''}
        ${gamesHtml}
        ${c.notes ? `<div class="detail-section-title">Notes</div>
          <div class="detail-notes">${esc(c.notes)}</div>` : ''}
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
    el.innerHTML = `
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:.75rem;flex:1;min-width:0">
          <span style="font-size:1.75rem;line-height:1">${icon}</span>
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
        </div>
        ${p.contacts ? `<div class="detail-section-title">Contacts associés</div>
          <div class="detail-notes">${esc(p.contacts)}</div>` : ''}
        ${p.notes ? `<div class="detail-section-title">Notes de développement</div>
          <div class="detail-notes">${esc(p.notes)}</div>` : ''}
        <div class="detail-actions">
          <button class="btn-save" onclick="closeModal('detail');editPrototype('${p.id}')">Modifier</button>
          <button class="btn-cancel" onclick="closeModal('detail');confirmDelete('prototype','${p.id}')">Supprimer</button>
        </div>
      </div>`;
  }

  document.getElementById('modal-detail').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// ═══════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════

// Nav tabs
document.querySelectorAll('.nav-tab').forEach(btn =>
  btn.addEventListener('click', () => switchPage(btn.dataset.page))
);

// Add button (contextual)
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
document.getElementById('contacts-status-filter').addEventListener('change', e => {
  state.contactsStatus = e.target.value; renderContacts();
});
document.getElementById('contacts-filter-reset').addEventListener('click', () => {
  state.contactsCat = ''; state.contactsStatus = '';
  document.getElementById('contacts-cat-filter').value = '';
  document.getElementById('contacts-status-filter').value = '';
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

// Zoom & view — contacts
document.getElementById('contacts-zoom').addEventListener('input', e => {
  state.contactsZoom = parseInt(e.target.value); renderContacts();
});
document.getElementById('contacts-view-grid').addEventListener('click', () => {
  state.contactsView = 'grid';
  document.getElementById('contacts-view-grid').classList.add('active');
  document.getElementById('contacts-view-list').classList.remove('active');
  document.getElementById('contacts-zoom-wrap').style.display = '';
  renderContacts();
});
document.getElementById('contacts-view-list').addEventListener('click', () => {
  state.contactsView = 'list';
  document.getElementById('contacts-view-list').classList.add('active');
  document.getElementById('contacts-view-grid').classList.remove('active');
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
document.getElementById('prototypes-filter-reset').addEventListener('click', () => {
  state.prototypesStatus = '';
  document.getElementById('prototypes-status-filter').value = '';
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

// Zoom & view — prototypes
document.getElementById('prototypes-zoom').addEventListener('input', e => {
  state.prototypesZoom = parseInt(e.target.value); renderPrototypes();
});
document.getElementById('prototypes-view-grid').addEventListener('click', () => {
  state.prototypesView = 'grid';
  document.getElementById('prototypes-view-grid').classList.add('active');
  document.getElementById('prototypes-view-list').classList.remove('active');
  document.getElementById('prototypes-zoom-wrap').style.display = '';
  renderPrototypes();
});
document.getElementById('prototypes-view-list').addEventListener('click', () => {
  state.prototypesView = 'list';
  document.getElementById('prototypes-view-list').classList.add('active');
  document.getElementById('prototypes-view-grid').classList.remove('active');
  document.getElementById('prototypes-zoom-wrap').style.display = 'none';
  renderPrototypes();
});

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
loadState();
switchPage('contacts');
