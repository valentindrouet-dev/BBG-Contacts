/* ═══════════════════════════════════════════════════
   BBG CONTACTS — app.js
   Logic matching Kicktraquer's page.tsx patterns:
   collapsible filters, sort, search, CRUD, modals
═══════════════════════════════════════════════════ */
'use strict';

// ── STATE ──────────────────────────────────────────
const state = {
  contacts:   [],
  prototypes: [],
  activePage: 'contacts',

  contactsSearch:   '',
  contactsCat:      '',
  contactsStatus:   '',
  contactsSort:     'name',
  contactsSortAsc:  true,

  prototypesSearch: '',
  prototypesStatus: '',
  prototypesSort:   'title',
  prototypesSortAsc: true,
};

// ── STORAGE ────────────────────────────────────────
function saveState() {
  localStorage.setItem('bbg-contacts',   JSON.stringify(state.contacts));
  localStorage.setItem('bbg-prototypes', JSON.stringify(state.prototypes));
}

function loadState() {
  const c = localStorage.getItem('bbg-contacts');
  const p = localStorage.getItem('bbg-prototypes');
  state.contacts   = c ? JSON.parse(c) : SEED_CONTACTS;
  state.prototypes = p ? JSON.parse(p) : SEED_PROTOTYPES;
  if (!c || !p) saveState();
}

// ── UTILS ──────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function initials(name) {
  return (name || '').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function today() { return new Date().toISOString().split('T')[0]; }

/* SVG icons (lucide-style) */
const ICONS = {
  pencil: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  extLink: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  users: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  mail: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  phone: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.1-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  clock: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  chevUp: `<polyline points="18 15 12 9 6 15"/>`,
  chevDown: `<polyline points="6 9 12 15 18 9"/>`,
};

// ═══════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════
function switchPage(page) {
  state.activePage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');

  document.querySelectorAll('.nav-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });

  if (page === 'contacts')   renderContacts();
  if (page === 'prototypes') renderPrototypes();
}

// ═══════════════════════════════════════════════════
// FILTER + SORT HELPERS
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
      case 'name':     cmp = a.name.localeCompare(b.name); break;
      case 'category': cmp = a.category.localeCompare(b.category); break;
      case 'status':   cmp = a.status.localeCompare(b.status); break;
      case 'company':  cmp = (a.company||'').localeCompare(b.company||''); break;
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
      case 'title':     cmp = a.title.localeCompare(b.title); break;
      case 'status':    cmp = a.status.localeCompare(b.status); break;
      case 'createdAt': cmp = (a.createdAt||'').localeCompare(b.createdAt||''); break;
    }
    return state.prototypesSortAsc ? cmp : -cmp;
  });
  return list;
}

// ═══════════════════════════════════════════════════
// RENDER — CONTACTS
// ═══════════════════════════════════════════════════
function renderContacts() {
  const list  = filteredContacts();
  const grid  = document.getElementById('contacts-grid');
  const empty = document.getElementById('contacts-empty');
  const count = document.getElementById('contacts-count');
  const navCount = document.getElementById('nav-contacts-count');

  const total = state.contacts.length;
  navCount.textContent = total;
  count.textContent = `${list.length} contact${list.length > 1 ? 's' : ''}`;

  if (list.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  grid.innerHTML = list.map(contactCard).join('');
  updateFilterCount('contacts');
}

function contactCard(c) {
  const extLink = c.website
    ? `<a class="card-ext-link" href="${esc(c.website)}" target="_blank" rel="noopener"
         onclick="event.stopPropagation()" title="Ouvrir le site">${ICONS.extLink}</a>`
    : '';

  const subtitle = c.company || c.email || '';

  return `
<div class="card card-hover card-bg-${c.category}"
     onclick="openDetail('contact','${c.id}')" title="${esc(c.name)}">
  <div class="card-media card-media-${c.category}">
    <div class="card-avatar card-avatar-${c.category}">${initials(c.name)}</div>
    <span class="badge badge-${c.category} card-badge">${esc(c.category)}</span>
    ${extLink}
    <button class="card-edit-btn" title="Modifier"
            onclick="event.stopPropagation(); editContact('${c.id}')">${ICONS.pencil}</button>
  </div>
  <div class="card-body">
    <h3 class="card-title">${esc(c.name)}</h3>
    ${subtitle ? `<p class="card-subtitle">${esc(subtitle)}</p>` : ''}
    <div class="card-footer">
      <span class="badge badge-${c.status}">${esc(c.status)}</span>
    </div>
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════
// RENDER — PROTOTYPES
// ═══════════════════════════════════════════════════
function renderPrototypes() {
  const list  = filteredPrototypes();
  const grid  = document.getElementById('prototypes-grid');
  const empty = document.getElementById('prototypes-empty');
  const count = document.getElementById('prototypes-count');
  const navCount = document.getElementById('nav-prototypes-count');

  const total = state.prototypes.length;
  navCount.textContent = total;
  count.textContent = `${list.length} prototype${list.length > 1 ? 's' : ''}`;

  if (list.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  grid.innerHTML = list.map(prototypeCard).join('');
  updateFilterCount('prototypes');
}

const PROTO_ICONS = {
  concept: '💡', développement: '🔧', test: '🧪', finalisation: '✨', publié: '🚀'
};

function prototypeCard(p) {
  const icon = PROTO_ICONS[p.status] || '🎮';
  const specs = [
    p.players  ? `${ICONS.users} ${esc(p.players)} joueurs` : '',
    p.duration ? `${ICONS.clock} ${esc(p.duration)}` : '',
  ].filter(Boolean);

  const specsHtml = specs.length
    ? `<div class="card-specs">${specs.map(s => `<span class="spec-chip">${s}</span>`).join('')}</div>`
    : '';

  return `
<div class="card card-hover"
     onclick="openDetail('prototype','${p.id}')" title="${esc(p.title)}">
  <div class="card-media card-media-${p.status}">
    <span class="card-game-icon">${icon}</span>
    <span class="badge badge-${p.status} card-badge">${esc(p.status)}</span>
    <button class="card-edit-btn" title="Modifier"
            onclick="event.stopPropagation(); editPrototype('${p.id}')">${ICONS.pencil}</button>
  </div>
  <div class="card-body">
    <h3 class="card-title">${esc(p.title)}</h3>
    ${p.genre ? `<p class="card-subtitle">${esc(p.genre)}</p>` : ''}
    ${specsHtml}
  </div>
</div>`;
}

// ═══════════════════════════════════════════════════
// FILTER PANEL — collapse / expand
// ═══════════════════════════════════════════════════
function toggleFilterPanel(page) {
  const body    = document.getElementById(`${page}-filter-body`);
  const chevron = document.getElementById(`${page}-chevron`);
  const open    = body.style.display === 'block';
  body.style.display    = open ? 'none' : 'block';
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
  if (active > 0) {
    badge.textContent = `${active} actif${active > 1 ? 's' : ''}`;
    badge.classList.remove('hidden');
    reset?.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
    reset?.classList.add('hidden');
  }
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

document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', e => {
    if (e.target === ov) closeModal(ov.id.replace('modal-', ''));
  });
});
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
  ['contact-id','contact-name','contact-email','contact-phone','contact-company','contact-website','contact-notes']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('contact-category').value = '';
  document.querySelector('input[name="contact-status"][value="actif"]').checked = true;
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
  const r = document.querySelector(`input[name="contact-status"][value="${c.status}"]`);
  if (r) r.checked = true;
  document.getElementById('modal-contact-title').textContent = 'Modifier le contact';
  openModal('contact');
}

function submitContact(e) {
  e.preventDefault();
  const id     = document.getElementById('contact-id').value;
  const status = document.querySelector('input[name="contact-status"]:checked').value;
  const data   = {
    name:     document.getElementById('contact-name').value.trim(),
    category: document.getElementById('contact-category').value,
    email:    document.getElementById('contact-email').value.trim(),
    phone:    document.getElementById('contact-phone').value.trim(),
    company:  document.getElementById('contact-company').value.trim(),
    website:  document.getElementById('contact-website').value.trim(),
    notes:    document.getElementById('contact-notes').value.trim(),
    status,
  };
  if (id) {
    const i = state.contacts.findIndex(x => x.id === id);
    state.contacts[i] = { ...state.contacts[i], ...data };
  } else {
    state.contacts.unshift({ id: uid(), createdAt: today(), ...data });
  }
  saveState();
  closeModal('contact');
  renderContacts();
}

// ── Prototype form ────────────────────────────────
function resetPrototypeForm() {
  ['prototype-id','prototype-title','prototype-genre','prototype-players',
   'prototype-duration','prototype-age','prototype-description','prototype-contacts','prototype-notes']
    .forEach(id => document.getElementById(id).value = '');
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
  saveState();
  closeModal('prototype');
  renderPrototypes();
}

// ── Delete ────────────────────────────────────────
let pendingDelete = null;

function confirmDelete(type, id) {
  pendingDelete = { type, id };
  openModal('confirm');
}

document.getElementById('btn-confirm-delete').addEventListener('click', () => {
  if (!pendingDelete) return;
  const { type, id } = pendingDelete;
  if (type === 'contact') {
    state.contacts = state.contacts.filter(x => x.id !== id);
    saveState(); renderContacts();
  } else {
    state.prototypes = state.prototypes.filter(x => x.id !== id);
    saveState(); renderPrototypes();
  }
  pendingDelete = null;
  closeModal('confirm');
});

// ── Detail view ───────────────────────────────────
function openDetail(type, id) {
  const el = document.getElementById('modal-detail-content');

  if (type === 'contact') {
    const c = state.contacts.find(x => x.id === id);
    if (!c) return;
    el.innerHTML = `
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:.75rem">
          <div class="card-avatar card-avatar-${c.category}"
               style="position:static;transform:none;width:44px;height:44px;font-size:1rem">
            ${initials(c.name)}</div>
          <div>
            <div style="font-size:1.05rem;font-weight:700;color:var(--text-800)">${esc(c.name)}</div>
            ${c.company ? `<div style="font-size:.8rem;color:var(--text-500)">${esc(c.company)}</div>` : ''}
          </div>
          <span class="badge badge-${c.category}" style="margin-left:auto">${esc(c.category)}</span>
        </div>
        <button class="modal-close" onclick="closeModal('detail')">✕</button>
      </div>
      <div class="detail-inner">
        <div class="detail-section-title">Coordonnées</div>
        <div class="detail-kv-grid">
          ${c.email   ? `<div class="detail-kv"><label>Email</label><span>${esc(c.email)}</span></div>` : ''}
          ${c.phone   ? `<div class="detail-kv"><label>Téléphone</label><span>${esc(c.phone)}</span></div>` : ''}
          ${c.website ? `<div class="detail-kv"><label>Site web</label>
            <a href="${esc(c.website)}" target="_blank" rel="noopener">${esc(c.website.replace(/^https?:\/\//,''))}</a></div>` : ''}
          <div class="detail-kv"><label>Statut</label>
            <span class="badge badge-${c.status}">${esc(c.status)}</span></div>
        </div>
        ${c.notes ? `<div class="detail-section-title">Notes</div>
          <div class="detail-notes">${esc(c.notes)}</div>` : ''}
        <div class="detail-actions">
          <button class="btn-save" onclick="closeModal('detail'); editContact('${c.id}')">Modifier</button>
          <button class="btn-cancel" onclick="closeModal('detail'); confirmDelete('contact','${c.id}')">Supprimer</button>
        </div>
      </div>`;

  } else {
    const p = state.prototypes.find(x => x.id === id);
    if (!p) return;
    const icon = PROTO_ICONS[p.status] || '🎮';
    el.innerHTML = `
      <div class="modal-header">
        <div style="display:flex;align-items:center;gap:.75rem;flex:1;min-width:0">
          <span style="font-size:1.75rem;line-height:1">${icon}</span>
          <div style="min-width:0">
            <div style="font-size:1.05rem;font-weight:700;color:var(--text-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${esc(p.title)}</div>
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
          ${p.players  ? `<div class="detail-kv"><label>Joueurs</label><span>${esc(p.players)}</span></div>` : ''}
          ${p.duration ? `<div class="detail-kv"><label>Durée</label><span>${esc(p.duration)}</span></div>` : ''}
          ${p.age      ? `<div class="detail-kv"><label>Âge</label><span>${esc(p.age)}</span></div>` : ''}
        </div>
        ${p.contacts ? `<div class="detail-section-title">Contacts associés</div>
          <div class="detail-notes">${esc(p.contacts)}</div>` : ''}
        ${p.notes    ? `<div class="detail-section-title">Notes de développement</div>
          <div class="detail-notes">${esc(p.notes)}</div>` : ''}
        <div class="detail-actions">
          <button class="btn-save" onclick="closeModal('detail'); editPrototype('${p.id}')">Modifier</button>
          <button class="btn-cancel" onclick="closeModal('detail'); confirmDelete('prototype','${p.id}')">Supprimer</button>
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

// "Ajouter" button — contextual
document.getElementById('btn-add').addEventListener('click', () =>
  openModal(state.activePage === 'contacts' ? 'contact' : 'prototype')
);

// ── Contacts ──────────────────────────────────────
document.getElementById('contacts-search').addEventListener('input', e => {
  state.contactsSearch = e.target.value;
  renderContacts();
});
document.getElementById('contacts-filter-toggle').addEventListener('click', () =>
  toggleFilterPanel('contacts')
);
document.getElementById('contacts-cat-filter').addEventListener('change', e => {
  state.contactsCat = e.target.value;
  renderContacts();
});
document.getElementById('contacts-status-filter').addEventListener('change', e => {
  state.contactsStatus = e.target.value;
  renderContacts();
});
document.getElementById('contacts-filter-reset').addEventListener('click', () => {
  state.contactsCat = '';
  state.contactsStatus = '';
  document.getElementById('contacts-cat-filter').value    = '';
  document.getElementById('contacts-status-filter').value = '';
  renderContacts();
});
document.getElementById('contacts-sort').addEventListener('change', e => {
  state.contactsSort = e.target.value;
  renderContacts();
});
document.getElementById('contacts-sort-order').addEventListener('click', () => {
  state.contactsSortAsc = !state.contactsSortAsc;
  const icon = document.getElementById('contacts-sort-icon');
  icon.innerHTML = state.contactsSortAsc ? ICONS.chevUp : ICONS.chevDown;
  renderContacts();
});

// ── Prototypes ────────────────────────────────────
document.getElementById('prototypes-search').addEventListener('input', e => {
  state.prototypesSearch = e.target.value;
  renderPrototypes();
});
document.getElementById('prototypes-filter-toggle').addEventListener('click', () =>
  toggleFilterPanel('prototypes')
);
document.getElementById('prototypes-status-filter').addEventListener('change', e => {
  state.prototypesStatus = e.target.value;
  renderPrototypes();
});
document.getElementById('prototypes-filter-reset').addEventListener('click', () => {
  state.prototypesStatus = '';
  document.getElementById('prototypes-status-filter').value = '';
  renderPrototypes();
});
document.getElementById('prototypes-sort').addEventListener('change', e => {
  state.prototypesSort = e.target.value;
  renderPrototypes();
});
document.getElementById('prototypes-sort-order').addEventListener('click', () => {
  state.prototypesSortAsc = !state.prototypesSortAsc;
  const icon = document.getElementById('prototypes-sort-icon');
  icon.innerHTML = state.prototypesSortAsc ? ICONS.chevUp : ICONS.chevDown;
  renderPrototypes();
});

// ═══════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════
loadState();
switchPage('contacts');
