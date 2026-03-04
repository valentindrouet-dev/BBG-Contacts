/* ═══════════════════════════════════════════════════
   BBG CONTACTS — APPLICATION
═══════════════════════════════════════════════════ */

'use strict';

// ── STATE ──────────────────────────────────────────
let state = {
  contacts:   [],
  prototypes: [],
  activePage: 'contacts',
  contactsFilter:   'all',
  prototypesFilter: 'all',
  contactsSearch:   '',
  prototypesSearch: ''
};

// ── STORAGE ────────────────────────────────────────
function saveState() {
  localStorage.setItem('bbg-contacts',   JSON.stringify(state.contacts));
  localStorage.setItem('bbg-prototypes', JSON.stringify(state.prototypes));
}

function loadState() {
  const contacts   = localStorage.getItem('bbg-contacts');
  const prototypes = localStorage.getItem('bbg-prototypes');
  if (contacts)   state.contacts   = JSON.parse(contacts);
  if (prototypes) state.prototypes = JSON.parse(prototypes);

  // Premier lancement → injecter les données de démo
  if (!contacts)   { state.contacts   = SEED_CONTACTS;   saveState(); }
  if (!prototypes) { state.prototypes = SEED_PROTOTYPES;  saveState(); }
}

// ── UTILS ──────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function initials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ── NAVIGATION ─────────────────────────────────────
function switchPage(page) {
  state.activePage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page);
  });

  renderAll();
}

// ── RENDER CONTACTS ────────────────────────────────
function filteredContacts() {
  let list = state.contacts;
  if (state.contactsFilter !== 'all') {
    list = list.filter(c => c.category === state.contactsFilter);
  }
  const q = state.contactsSearch.toLowerCase().trim();
  if (q) {
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.email   || '').toLowerCase().includes(q)
    );
  }
  return list;
}

function renderContacts() {
  const list  = filteredContacts();
  const grid  = document.getElementById('contacts-grid');
  const empty = document.getElementById('contacts-empty');
  const count = document.getElementById('contacts-count');

  count.textContent = state.contacts.length;

  if (list.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  grid.innerHTML = list.map(contactCard).join('');
}

function contactCard(c) {
  const emailRow = c.email
    ? `<div class="meta-item">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
        <span>${escHtml(c.email)}</span>
       </div>` : '';
  const phoneRow = c.phone
    ? `<div class="meta-item">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.1-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
        <span>${escHtml(c.phone)}</span>
       </div>` : '';
  const webRow = c.website
    ? `<div class="meta-item">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        <a href="${escHtml(c.website)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${escHtml(c.website.replace(/^https?:\/\//, ''))}</a>
       </div>` : '';

  return `
  <div class="contact-card" onclick="openDetail('contact','${c.id}')">
    <div class="contact-card-top">
      <div class="avatar avatar-${c.category}">${initials(c.name)}</div>
      <div class="contact-info">
        <div class="contact-name">${escHtml(c.name)}</div>
        ${c.company ? `<div class="contact-company">${escHtml(c.company)}</div>` : ''}
      </div>
      <span class="badge badge-${c.category}">${escHtml(c.category)}</span>
    </div>
    <div class="contact-card-meta">
      ${emailRow}${phoneRow}${webRow}
    </div>
    <div class="contact-card-footer">
      <span class="status-dot status-${c.status}">${c.status}</span>
      <div class="card-actions">
        <button class="card-action-btn" title="Modifier" onclick="event.stopPropagation(); editContact('${c.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="card-action-btn danger" title="Supprimer" onclick="event.stopPropagation(); confirmDelete('contact','${c.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4h6v2"></path></svg>
        </button>
      </div>
    </div>
  </div>`;
}

// ── RENDER PROTOTYPES ──────────────────────────────
function filteredPrototypes() {
  let list = state.prototypes;
  if (state.prototypesFilter !== 'all') {
    list = list.filter(p => p.status === state.prototypesFilter);
  }
  const q = state.prototypesSearch.toLowerCase().trim();
  if (q) {
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.genre       || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }
  return list;
}

function renderPrototypes() {
  const list  = filteredPrototypes();
  const grid  = document.getElementById('prototypes-grid');
  const empty = document.getElementById('prototypes-empty');
  const count = document.getElementById('prototypes-count');

  count.textContent = state.prototypes.length;

  if (list.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  grid.innerHTML = list.map(prototypeCard).join('');
}

function prototypeCard(p) {
  const players  = p.players  ? `<span class="spec-chip"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>${escHtml(p.players)} joueurs</span>` : '';
  const duration = p.duration ? `<span class="spec-chip"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>${escHtml(p.duration)}</span>` : '';
  const age      = p.age      ? `<span class="spec-chip"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"></circle><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path></svg>${escHtml(p.age)}</span>` : '';
  const contactsPreview = p.contacts
    ? `<span>Avec : ${escHtml(p.contacts)}</span>`
    : `<span style="font-style:italic">Aucun contact associé</span>`;

  return `
  <div class="prototype-card" onclick="openDetail('prototype','${p.id}')">
    <div class="proto-card-banner banner-${p.status.replace(/ /g, '-')}"></div>
    <div class="proto-card-body">
      <div class="proto-card-top">
        <div>
          <div class="proto-title">${escHtml(p.title)}</div>
          ${p.genre ? `<div class="proto-genre">${escHtml(p.genre)}</div>` : ''}
        </div>
        <span class="status-badge status-${p.status}">${escHtml(p.status)}</span>
      </div>
      ${p.description ? `<p class="proto-description">${escHtml(p.description)}</p>` : ''}
      ${(players || duration || age) ? `<div class="proto-specs">${players}${duration}${age}</div>` : ''}
    </div>
    <div class="proto-card-footer">
      <div class="proto-contacts-preview">${contactsPreview}</div>
      <div class="card-actions">
        <button class="card-action-btn" title="Modifier" onclick="event.stopPropagation(); editPrototype('${p.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="card-action-btn danger" title="Supprimer" onclick="event.stopPropagation(); confirmDelete('prototype','${p.id}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4h6v2"></path></svg>
        </button>
      </div>
    </div>
  </div>`;
}

// ── RENDER ALL ─────────────────────────────────────
function renderAll() {
  if (state.activePage === 'contacts')   renderContacts();
  if (state.activePage === 'prototypes') renderPrototypes();
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

// Click outside to close
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      const id = overlay.id.replace('modal-', '');
      closeModal(id);
    }
  });
});

// ── CONTACT FORM ───────────────────────────────────
function resetContactForm() {
  document.getElementById('contact-id').value      = '';
  document.getElementById('contact-name').value    = '';
  document.getElementById('contact-category').value = '';
  document.getElementById('contact-email').value   = '';
  document.getElementById('contact-phone').value   = '';
  document.getElementById('contact-company').value = '';
  document.getElementById('contact-website').value = '';
  document.getElementById('contact-notes').value   = '';
  document.querySelector('input[name="contact-status"][value="actif"]').checked = true;
  document.getElementById('modal-contact-title').textContent = 'Nouveau contact';
}

function editContact(id) {
  const c = state.contacts.find(x => x.id === id);
  if (!c) return;
  document.getElementById('contact-id').value       = c.id;
  document.getElementById('contact-name').value     = c.name;
  document.getElementById('contact-category').value = c.category;
  document.getElementById('contact-email').value    = c.email   || '';
  document.getElementById('contact-phone').value    = c.phone   || '';
  document.getElementById('contact-company').value  = c.company || '';
  document.getElementById('contact-website').value  = c.website || '';
  document.getElementById('contact-notes').value    = c.notes   || '';
  const radioBtn = document.querySelector(`input[name="contact-status"][value="${c.status}"]`);
  if (radioBtn) radioBtn.checked = true;
  document.getElementById('modal-contact-title').textContent = 'Modifier le contact';
  openModal('contact');
}

function submitContact(e) {
  e.preventDefault();
  const id = document.getElementById('contact-id').value;
  const status = document.querySelector('input[name="contact-status"]:checked').value;
  const data = {
    name:     document.getElementById('contact-name').value.trim(),
    category: document.getElementById('contact-category').value,
    email:    document.getElementById('contact-email').value.trim(),
    phone:    document.getElementById('contact-phone').value.trim(),
    company:  document.getElementById('contact-company').value.trim(),
    website:  document.getElementById('contact-website').value.trim(),
    notes:    document.getElementById('contact-notes').value.trim(),
    status
  };
  if (id) {
    const idx = state.contacts.findIndex(x => x.id === id);
    state.contacts[idx] = { ...state.contacts[idx], ...data };
  } else {
    state.contacts.unshift({ id: uid(), createdAt: today(), ...data });
  }
  saveState();
  closeModal('contact');
  renderContacts();
}

// ── PROTOTYPE FORM ─────────────────────────────────
function resetPrototypeForm() {
  document.getElementById('prototype-id').value          = '';
  document.getElementById('prototype-title').value       = '';
  document.getElementById('prototype-status').value      = '';
  document.getElementById('prototype-genre').value       = '';
  document.getElementById('prototype-players').value     = '';
  document.getElementById('prototype-duration').value    = '';
  document.getElementById('prototype-age').value         = '';
  document.getElementById('prototype-description').value = '';
  document.getElementById('prototype-contacts').value    = '';
  document.getElementById('prototype-notes').value       = '';
  document.getElementById('modal-prototype-title').textContent = 'Nouveau prototype';
}

function editPrototype(id) {
  const p = state.prototypes.find(x => x.id === id);
  if (!p) return;
  document.getElementById('prototype-id').value          = p.id;
  document.getElementById('prototype-title').value       = p.title;
  document.getElementById('prototype-status').value      = p.status;
  document.getElementById('prototype-genre').value       = p.genre       || '';
  document.getElementById('prototype-players').value     = p.players     || '';
  document.getElementById('prototype-duration').value    = p.duration    || '';
  document.getElementById('prototype-age').value         = p.age         || '';
  document.getElementById('prototype-description').value = p.description || '';
  document.getElementById('prototype-contacts').value    = p.contacts    || '';
  document.getElementById('prototype-notes').value       = p.notes       || '';
  document.getElementById('modal-prototype-title').textContent = 'Modifier le prototype';
  openModal('prototype');
}

function submitPrototype(e) {
  e.preventDefault();
  const id = document.getElementById('prototype-id').value;
  const data = {
    title:       document.getElementById('prototype-title').value.trim(),
    status:      document.getElementById('prototype-status').value,
    genre:       document.getElementById('prototype-genre').value.trim(),
    players:     document.getElementById('prototype-players').value.trim(),
    duration:    document.getElementById('prototype-duration').value.trim(),
    age:         document.getElementById('prototype-age').value.trim(),
    description: document.getElementById('prototype-description').value.trim(),
    contacts:    document.getElementById('prototype-contacts').value.trim(),
    notes:       document.getElementById('prototype-notes').value.trim()
  };
  if (id) {
    const idx = state.prototypes.findIndex(x => x.id === id);
    state.prototypes[idx] = { ...state.prototypes[idx], ...data };
  } else {
    state.prototypes.unshift({ id: uid(), createdAt: today(), ...data });
  }
  saveState();
  closeModal('prototype');
  renderPrototypes();
}

// ── DELETE ─────────────────────────────────────────
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

// ── DETAIL ─────────────────────────────────────────
function openDetail(type, id) {
  const overlay = document.getElementById('modal-detail');
  const content = document.getElementById('modal-detail-content');
  if (type === 'contact') {
    const c = state.contacts.find(x => x.id === id);
    if (!c) return;
    content.innerHTML = `
      <div class="modal-header">
        <h2>${escHtml(c.name)}</h2>
        <button class="modal-close" onclick="closeModal('detail')">✕</button>
      </div>
      <div class="detail-modal-inner">
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.25rem">
          <div class="avatar avatar-${c.category}" style="width:52px;height:52px;font-size:1.2rem">${initials(c.name)}</div>
          <div>
            <div style="font-size:1.15rem;font-weight:700">${escHtml(c.name)}</div>
            ${c.company ? `<div style="color:var(--text-secondary);font-size:.85rem">${escHtml(c.company)}</div>` : ''}
          </div>
          <span class="badge badge-${c.category}" style="margin-left:auto">${escHtml(c.category)}</span>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">Coordonnées</div>
          <div class="detail-row">
            ${c.email ? `<div class="detail-field"><label>Email</label><span>${escHtml(c.email)}</span></div>` : ''}
            ${c.phone ? `<div class="detail-field"><label>Téléphone</label><span>${escHtml(c.phone)}</span></div>` : ''}
            ${c.website ? `<div class="detail-field"><label>Site web</label><a href="${escHtml(c.website)}" target="_blank" rel="noopener">${escHtml(c.website.replace(/^https?:\/\//,''))}</a></div>` : ''}
            <div class="detail-field"><label>Statut</label><span class="status-dot status-${c.status}">${c.status}</span></div>
          </div>
        </div>
        ${c.notes ? `<div class="detail-section"><div class="detail-section-title">Notes</div><div class="detail-notes">${escHtml(c.notes)}</div></div>` : ''}
        <div class="detail-actions">
          <button class="btn-save" onclick="closeModal('detail'); editContact('${c.id}')">Modifier</button>
          <button class="btn-cancel" onclick="confirmDelete('contact','${c.id}'); closeModal('detail')">Supprimer</button>
        </div>
      </div>`;
  } else {
    const p = state.prototypes.find(x => x.id === id);
    if (!p) return;
    content.innerHTML = `
      <div class="proto-card-banner banner-${p.status}" style="border-radius:var(--radius) var(--radius) 0 0;height:6px"></div>
      <div class="modal-header" style="border-top:none">
        <div>
          <h2>${escHtml(p.title)}</h2>
          ${p.genre ? `<div style="font-size:.8rem;color:var(--text-secondary);margin-top:.2rem">${escHtml(p.genre)}</div>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:.75rem">
          <span class="status-badge status-${p.status}">${escHtml(p.status)}</span>
          <button class="modal-close" onclick="closeModal('detail')">✕</button>
        </div>
      </div>
      <div class="detail-modal-inner" style="padding-top:.75rem">
        ${p.description ? `<div class="detail-section"><div class="detail-section-title">Description</div><div class="detail-notes">${escHtml(p.description)}</div></div>` : ''}
        <div class="detail-section">
          <div class="detail-section-title">Caractéristiques</div>
          <div class="detail-row">
            ${p.players  ? `<div class="detail-field"><label>Joueurs</label><span>${escHtml(p.players)}</span></div>` : ''}
            ${p.duration ? `<div class="detail-field"><label>Durée</label><span>${escHtml(p.duration)}</span></div>` : ''}
            ${p.age      ? `<div class="detail-field"><label>Âge</label><span>${escHtml(p.age)}</span></div>` : ''}
          </div>
        </div>
        ${p.contacts ? `<div class="detail-section"><div class="detail-section-title">Contacts associés</div><div class="detail-notes">${escHtml(p.contacts)}</div></div>` : ''}
        ${p.notes    ? `<div class="detail-section"><div class="detail-section-title">Notes de développement</div><div class="detail-notes">${escHtml(p.notes)}</div></div>` : ''}
        <div class="detail-actions">
          <button class="btn-save" onclick="closeModal('detail'); editPrototype('${p.id}')">Modifier</button>
          <button class="btn-cancel" onclick="confirmDelete('prototype','${p.id}'); closeModal('detail')">Supprimer</button>
        </div>
      </div>`;
  }
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// ═══════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════

// Nav
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchPage(btn.dataset.page));
});

// Global "Ajouter"
document.getElementById('btn-add').addEventListener('click', () => {
  openModal(state.activePage === 'contacts' ? 'contact' : 'prototype');
});

// Filters — contacts
document.getElementById('contacts-filters').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('#contacts-filters .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.contactsFilter = btn.dataset.filter;
  renderContacts();
});

// Filters — prototypes
document.getElementById('prototypes-filters').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('#prototypes-filters .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.prototypesFilter = btn.dataset.filter;
  renderPrototypes();
});

// Search — contacts
document.getElementById('contacts-search').addEventListener('input', e => {
  state.contactsSearch = e.target.value;
  renderContacts();
});

// Search — prototypes
document.getElementById('prototypes-search').addEventListener('input', e => {
  state.prototypesSearch = e.target.value;
  renderPrototypes();
});

// Keyboard ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['contact', 'prototype', 'detail', 'confirm'].forEach(t => {
      document.getElementById('modal-' + t)?.classList.add('hidden');
    });
    document.body.style.overflow = '';
  }
});

// ── INIT ───────────────────────────────────────────
loadState();
switchPage('contacts');
