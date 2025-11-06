const LSKEY = 'scheduleease-appts-v1';
const THEMEKEY = 'schedulease-theme';
const MAXUNDO = 10;

const els = {
  search: document.getElementById('search'),
  dateFilter: document.getElementById('dateFilter'),
  statusFilter: document.getElementById('statusFilter'),
  sortBy: document.getElementById('sortBy'),
  themeToggle: document.getElementById('themeToggle'),
  totalAppts: document.getElementById('totalAppts'),
  upcomingCount: document.getElementById('upcomingCount'),
  completedCount: document.getElementById('completedCount'),
  cancelledCount: document.getElementById('cancelledCount'),
  weekChart: document.getElementById('weekChart'),
  chartRangeLabel: document.getElementById('chartRangeLabel'),
  weekGrid: document.getElementById('weekGrid'),
  weekLabel: document.getElementById('weekLabel'),
  prevWeek: document.getElementById('prevWeek'),
  nextWeek: document.getElementById('nextWeek'),
  todayBtn: document.getElementById('todayBtn'),
  tbody: document.getElementById('tbody'),
  resultCount: document.getElementById('resultCount'),
  importCsv: document.getElementById('importCsv'),
  exportCsv: document.getElementById('exportCsv'),
  importJson: document.getElementById('importJson'),
  exportJson: document.getElementById('exportJson'),
  newBtn: document.getElementById('newBtn'),
  formDialog: document.getElementById('formDialog'),
  apptForm: document.getElementById('apptForm'),
  formTitle: document.getElementById('formTitle'),
  aid: document.getElementById('aid'),
  title: document.getElementById('title'),
  client: document.getElementById('client'),
  date: document.getElementById('date'),
  time: document.getElementById('time'),
  duration: document.getElementById('duration'),
  status: document.getElementById('status'),
  location: document.getElementById('location'),
  notes: document.getElementById('notes'),
  confirmDialog: document.getElementById('confirmDialog'),
  confirmMsg: document.getElementById('confirmMsg'),
  qrDialog: document.getElementById('qrDialog'),
  qrTitle: document.getElementById('qrTitle'),
  qrBox: document.getElementById('qrBox'),
  emailTemplate: document.getElementById('emailTemplate'),
  copyEmail: document.getElementById('copyEmail'),
  mailtoBtn: document.getElementById('mailtoBtn'),
  printSummary: document.getElementById('printSummary'),
  qrClose: document.getElementById('qrClose')
};

let state = {
  appts: [],
  filters: { q: '', date: '', status: 'any', sort: 'datetimeasc' },
  weekStart: new Date(),
  chart: null,
  undo: [],
  redo: []
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const nowISO = () => new Date().toISOString();
const pad2 = n => String(n).padStart(2, '0');

function save() {
  localStorage.setItem(LSKEY, JSON.stringify(state.appts));
}

function load() {
  try { state.appts = JSON.parse(localStorage.getItem(LSKEY)); } catch { state.appts = []; }
  if (state.appts.length === 0) seed();
}

function seed() {
  const today = new Date();
  state.appts = [
    { id: uid(), title: 'Project Kickoff', client: 'Priya Sharma', date: today.toISOString().split('T')[0], time: '10:00', duration: 60, location: 'Office', status: 'Upcoming', notes: 'Initial meeting', createdAt: nowISO(), updatedAt: nowISO() },
    { id: uid(), title: 'Design Review', client: 'Arjun Mehra', date: new Date(today.getTime() + 2*24*60*60*1000).toISOString().split('T')[0], time: '14:30', duration: 45, location: 'Zoom', status: 'Upcoming', notes: 'Wireframes', createdAt: nowISO(), updatedAt: nowISO() }
  ];
  save();
}

function initTheme() {
  const saved = localStorage.getItem(THEMEKEY);
  if (saved === 'light') document.documentElement.classList.add('light');
  els.themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('light');
    localStorage.setItem(THEMEKEY, document.documentElement.classList.contains('light') ? 'light' : 'dark');
  });
}

function renderStats() {
  els.totalAppts.textContent = state.appts.length;
  els.upcomingCount.textContent = state.appts.filter(a => a.status === 'Upcoming').length;
  els.completedCount.textContent = state.appts.filter(a => a.status === 'Completed').length;
  els.cancelledCount.textContent = state.appts.filter(a => a.status === 'Cancelled').length;
}

function renderTable() {
  const rows = state.appts;
  els.resultCount.textContent = rows.length + ' results';
  els.tbody.innerHTML = '';
  rows.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${a.date} ${a.time}</td><td><strong>${a.title}</strong><div style="color:var(--muted)">${a.client}</div></td><td>${a.location}</td><td><span class="badge ${a.status.toLowerCase()}">${a.status}</span></td><td>${a.duration} min</td><td class="actions-col"><button class="btn" data-act="qr" data-id="${a.id}">QR</button> <button class="btn ghost" data-act="edit" data-id="${a.id}">Edit</button> <button class="btn danger" data-act="del" data-id="${a.id}">Delete</button></td>`;
    els.tbody.appendChild(tr);
  });
}

function renderAll() {
  renderStats();
  renderTable();
}

function openForm(appt) {
  els.formTitle.textContent = appt ? 'Edit Appointment' : 'New Appointment';
  els.aid.value = appt?.id || '';
  els.title.value = appt?.title || '';
  els.client.value = appt?.client || '';
  els.date.value = appt?.date || '';
  els.time.value = appt?.time || '';
  els.duration.value = appt?.duration || 30;
  els.status.value = appt?.status || 'Upcoming';
  els.location.value = appt?.location || '';
  els.notes.value = appt?.notes || '';
  els.formDialog.showModal();
}

function upsertAppt(p) {
  if (!p.title?.trim() || !p.client?.trim() || !p.date || !p.time) { alert('Fill required fields'); return false; }
  const appt = { id: p.id || uid(), title: p.title.trim(), client: p.client.trim(), date: p.date, time: p.time, duration: Number(p.duration) || 30, location: p.location?.trim(), status: p.status || 'Upcoming', notes: p.notes?.trim(), createdAt: p.createdAt || nowISO(), updatedAt: nowISO() };
  const idx = state.appts.findIndex(a => a.id === appt.id);
  if (idx !== -1) { state.appts[idx] = appt; } else { state.appts.unshift(appt); }
  save();
  renderAll();
  return true;
}

function deleteAppt(id) {
  state.appts = state.appts.filter(a => a.id !== id);
  save();
  renderAll();
}

function openQR(appt) {
  els.qrTitle.textContent = 'QR - ' + appt.title;
  els.qrBox.innerHTML = '';
  els.emailTemplate.value = `Subject: Reminder - ${appt.title}\n\nHi ${appt.client},\n\nThis is a reminder for our appointment:\n\nTitle: ${appt.title}\nDate: ${appt.date}\nTime: ${appt.time}\nDuration: ${appt.duration} minutes\nLocation: ${appt.location}\n\nBest regards,\nSchedulEase`;
  els.mailtoBtn.href = `mailto:?subject=${encodeURIComponent(appt.title)}`;
  els.qrDialog.showModal();
}

els.tbody.addEventListener('click', e => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.dataset.id;
  const act = btn.dataset.act;
  const a = state.appts.find(x => x.id === id);
  if (!a) return;
  if (act === 'edit') openForm(a);
  if (act === 'del') { if (confirm('Delete?')) deleteAppt(id); }
  if (act === 'qr') openQR(a);
});

els.newBtn.addEventListener('click', () => openForm(null));

els.apptForm.addEventListener('submit', e => {
  e.preventDefault();
  const payload = { id: els.aid.value || null, title: els.title.value, client: els.client.value, date: els.date.value, time: els.time.value, duration: els.duration.value, location: els.location.value, status: els.status.value, notes: els.notes.value };
  upsertAppt(payload);
  els.formDialog.close();
});

els.search.addEventListener('input', e => {
  state.filters.q = e.target.value;
  renderAll();
});

els.dateFilter.addEventListener('change', e => {
  state.filters.date = e.target.value;
  renderAll();
});

els.statusFilter.addEventListener('change', e => {
  state.filters.status = e.target.value;
  renderAll();
});

els.sortBy.addEventListener('change', e => {
  state.filters.sort = e.target.value;
  renderAll();
});

els.exportCsv.addEventListener('click', () => {
  const rows = state.appts.map(a => ({ title: a.title, client: a.client, date: a.date, time: a.time, status: a.status }));
  const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map(r => Object.values(r).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'appointments.csv';
  a.click();
});

els.exportJson.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state.appts, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'appointments.json';
  a.click();
});

els.copyEmail.addEventListener('click', async () => {
  await navigator.clipboard.writeText(els.emailTemplate.value);
  els.copyEmail.textContent = 'Copied!';
  setTimeout(() => els.copyEmail.textContent = 'Copy Email', 1200);
});

els.qrClose.addEventListener('click', () => els.qrDialog.close());

initTheme();
load();
renderAll();
