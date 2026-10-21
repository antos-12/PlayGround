'use strict';

const STORAGE_KEY = 'creatorIA.v1';
const APP_VERSION = 1;

const PLATFORM_META = {
  'TikTok': { key: 'tiktok', short: 'TikTok', label: 'TikTok', color: '#5ce1e6' },
  'Facebook Reels': { key: 'facebook', short: 'Reels', label: 'Facebook Reels', color: '#5b8dff' },
  'YouTube Shorts': { key: 'youtube', short: 'Shorts', label: 'YouTube Shorts', color: '#ff5f6d' }
};

const SOURCE_META = [
  { name: 'Anuncios', color: '#c8ff4a' },
  { name: 'Afiliados', color: '#9a8cff' },
  { name: 'Comisiones', color: '#4bd9ff' },
  { name: 'Patrocinios', color: '#ffb15c' },
  { name: 'Productos digitales', color: '#ff79a8' }
];

const STATUS_META = {
  'Idea': { color: '#8992a5', cls: 'neutral' },
  'Guion': { color: '#9a8cff', cls: 'violet' },
  'Grabación': { color: '#ffb15c', cls: 'orange' },
  'Edición': { color: '#4bd9ff', cls: 'violet' },
  'Programado': { color: '#c8ff4a', cls: 'green' },
  'Publicado': { color: '#4ee6a1', cls: 'green' }
};

const LIBRARY_META = {
  idea: { label: 'Idea', plural: 'Ideas', icon: 'i-sparkles', cls: 'idea', glow: 'rgba(255,177,92,.08)' },
  guion: { label: 'Guion', plural: 'Guiones', icon: 'i-file', cls: 'guion', glow: 'rgba(200,255,74,.08)' },
  prompt: { label: 'Prompt', plural: 'Prompts', icon: 'i-wand', cls: 'prompt', glow: 'rgba(154,140,255,.09)' },
  publicacion: { label: 'Publicación', plural: 'Publicaciones', icon: 'i-send', cls: 'publicacion', glow: 'rgba(75,217,255,.08)' },
  avatar: { label: 'Avatar', plural: 'Avatares', icon: 'i-users', cls: 'avatar', glow: 'rgba(255,121,168,.08)' }
};

const ROUTE_META = {
  inicio: { title: 'Inicio', doc: 'Inicio' },
  generador: { title: 'Generador de contenido', doc: 'Generador' },
  avatar: { title: 'Avatar IA para ventas', doc: 'Avatar IA' },
  estudio: { title: 'Estudio de videos IA', doc: 'Estudio de video' },
  calendario: { title: 'Calendario', doc: 'Calendario' },
  analiticas: { title: 'Analíticas', doc: 'Analíticas' },
  monetizacion: { title: 'Monetización', doc: 'Monetización' },
  biblioteca: { title: 'Biblioteca', doc: 'Biblioteca' }
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const ui = {
  analyticsRange: 30,
  analyticsPlatform: 'all',
  incomeRange: 30,
  calendarDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  calendarPlatform: 'all',
  calendarStatus: 'all',
  libraryType: 'all',
  librarySearch: '',
  libraryPlatform: 'all',
  librarySort: 'recent',
  avatarBusy: false,
  avatarCooldownUntil: 0,
  avatarLoadingTimer: null,
  avatarCooldownTimer: null
};

let state = loadState();
let storageAvailable = testStorage();
let currentRoute = 'inicio';
let deferredInstallPrompt = null;
let chartSequence = 0;

const fmtNumber = new Intl.NumberFormat('es-MX');
const fmtCompact = new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 });
const fmtMoney = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function icon(name, className = '') {
  return `<svg${className ? ` class="${className}"` : ''}><use href="#${name}"></use></svg>`;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function isoDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseISO(value) {
  if (!value) return new Date();
  const parts = String(value).split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

function todayISO() {
  return isoDate(new Date());
}

function addDaysISO(value, days) {
  const date = parseISO(value);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(12, 0, 0, 0);
  return copy;
}

function formatDateShort(value) {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(date).replace('.', '');
}

function formatDateLong(value) {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

function formatDateFull(value) {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(date).replace('.', '');
}

function formatMonth(date) {
  return new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(date);
}

function formatDateAxis(value) {
  return formatDateShort(value);
}

function formatMoney(value) {
  return fmtMoney.format(Number(value) || 0);
}

function formatCompact(value) {
  return fmtCompact.format(Number(value) || 0);
}

function formatNumber(value) {
  return fmtNumber.format(Number(value) || 0);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatPct(value) {
  const number = Number(value) || 0;
  return `${number.toLocaleString('es-MX', { maximumFractionDigits: 1 })}%`;
}

function normalizeText(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function hashtagify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function defaultState() {
  return {
    version: APP_VERSION,
    profile: { name: 'Creador', country: 'México' },
    settings: { sampleMode: false, pollinationsKey: '' },
    publications: [],
    metrics: [],
    incomes: [],
    library: [],
    lastGenerator: null,
    lastStoryboard: null,
    lastAvatar: null,
    avatars: []
  };
}

function testStorage() {
  try {
    const key = '__creator_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function loadState() {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    return {
      ...base,
      ...parsed,
      profile: { ...base.profile, ...(parsed.profile || {}) },
      settings: { ...base.settings, ...(parsed.settings || {}) },
      publications: Array.isArray(parsed.publications) ? parsed.publications : [],
      metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
      incomes: Array.isArray(parsed.incomes) ? parsed.incomes : [],
      library: Array.isArray(parsed.library) ? parsed.library : [],
      avatars: Array.isArray(parsed.avatars) ? parsed.avatars : []
    };
  } catch {
    return base;
  }
}

function saveState() {
  const indicator = $('#save-state');
  if (indicator) {
    indicator.classList.add('is-saving');
    const text = indicator.querySelector('span:last-child');
    if (text) text.textContent = 'Guardando…';
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageAvailable = true;
    window.setTimeout(() => {
      if (!indicator) return;
      indicator.classList.remove('is-saving');
      const text = indicator.querySelector('span:last-child');
      if (text) text.textContent = hasSampleData() ? 'Demo local' : 'Guardado local';
    }, 280);
  } catch {
    storageAvailable = false;
    if (indicator) {
      indicator.classList.remove('is-saving');
      const text = indicator.querySelector('span:last-child');
      if (text) text.textContent = 'Solo esta sesión';
    }
    toast('No se pudo guardar en el navegador. Los cambios se conservarán solo en esta sesión.', 'error');
  }
}

function hasSampleData() {
  return state.settings.sampleMode
    || state.metrics.some((item) => item.sample)
    || state.incomes.some((item) => item.sample)
    || state.publications.some((item) => item.sample)
    || state.library.some((item) => item.sample);
}

function countUserRecords() {
  return state.metrics.filter((item) => !item.sample).length
    + state.incomes.filter((item) => !item.sample).length
    + state.publications.filter((item) => !item.sample).length
    + state.library.filter((item) => !item.sample).length;
}

function withinRange(iso, start, end) {
  return iso >= start && iso <= end;
}

function getMetrics(start, end, platform = 'all') {
  return state.metrics.filter((item) => withinRange(item.date, start, end) && (platform === 'all' || item.platform === platform));
}

function getIncomes(start, end, platform = 'all') {
  return state.incomes.filter((item) => withinRange(item.date, start, end) && (platform === 'all' || item.platform === platform));
}

function sum(list, key) {
  return list.reduce((total, item) => total + (Number(item[key]) || 0), 0);
}

function averageRetention(list) {
  const totalViews = sum(list, 'views');
  if (!totalViews) {
    if (!list.length) return 0;
    return list.reduce((total, item) => total + (Number(item.retention) || 0), 0) / list.length;
  }
  return list.reduce((total, item) => total + (Number(item.retention) || 0) * (Number(item.views) || 0), 0) / totalViews;
}

function deltaInfo(current, previous) {
  if (!previous && !current) return { text: 'Sin datos previos', cls: 'neutral' };
  if (!previous) return { text: 'Nuevo registro', cls: 'neutral' };
  const pct = ((current - previous) / previous) * 100;
  if (!Number.isFinite(pct)) return { text: 'Sin comparación', cls: 'neutral' };
  return {
    text: `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}% vs. periodo anterior`,
    cls: pct >= 0 ? '' : 'negative'
  };
}

function monthRange(date = new Date()) {
  return { start: isoDate(startOfMonth(date)), end: isoDate(endOfMonth(date)) };
}

function previousMonthRange(date = new Date()) {
  const previous = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return monthRange(previous);
}

function incomeTotal(list, status) {
  return list
    .filter((item) => !status || item.status === status)
    .reduce((total, item) => total + (Number(item.amount) || 0), 0);
}

function publicationPlatform(pub) {
  return PLATFORM_META[pub.platform] || { key: 'general', short: pub.platform || 'General', label: pub.platform || 'General', color: '#8992a5' };
}

function statusPill(status) {
  const meta = STATUS_META[status] || { cls: 'neutral' };
  return `<span class="status-pill ${meta.cls}">${esc(status)}</span>`;
}

function toast(message, type = 'success') {
  const region = $('#toast-region');
  if (!region) return;
  const toastEl = document.createElement('div');
  toastEl.className = `toast ${type}`;
  const iconName = type === 'error' ? 'i-x' : type === 'info' ? 'i-info' : 'i-check';
  toastEl.innerHTML = `<span class="toast-icon">${icon(iconName)}</span><span>${esc(message)}</span><button type="button" class="toast-close" aria-label="Cerrar aviso">${icon('i-x')}</button>`;
  region.appendChild(toastEl);
  const remove = () => {
    toastEl.classList.add('is-out');
    window.setTimeout(() => toastEl.remove(), 220);
  };
  toastEl.querySelector('.toast-close').addEventListener('click', remove);
  window.setTimeout(remove, 3200);
  while (region.children.length > 2) region.firstElementChild.remove();
}

async function copyText(text, successMessage = 'Copiado al portapapeles.') {
  try {
    await navigator.clipboard.writeText(text);
    toast(successMessage);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
      toast(successMessage);
    } catch {
      toast('No se pudo copiar automáticamente.', 'error');
    }
    area.remove();
  }
}

function openModal({ title, eyebrow = 'Creator IA', body = '', foot = '', size = '' }) {
  const backdrop = $('#modal-backdrop');
  $('#modal-title').textContent = title;
  $('#modal-eyebrow').textContent = eyebrow;
  $('#modal-body').innerHTML = body;
  $('#modal-foot').innerHTML = foot;
  const modal = $('#modal');
  modal.className = `modal ${size}`.trim();
  backdrop.hidden = false;
  document.body.classList.add('modal-open');
  window.setTimeout(() => {
    const focusable = $('#modal-body input, #modal-body select, #modal-body textarea, #modal-foot button');
    if (focusable) focusable.focus({ preventScroll: true });
  }, 60);
}

function closeModal() {
  $('#modal-backdrop').hidden = true;
  document.body.classList.remove('modal-open');
  $('#modal-body').innerHTML = '';
  $('#modal-foot').innerHTML = '';
}

function openConfirm({ title, message, label = 'Confirmar', danger = true, onConfirm }) {
  openModal({
    title,
    eyebrow: 'Confirmación',
    body: `<p style="color:var(--muted);font-size:11px;line-height:1.65">${esc(message)}</p>`,
    foot: `<button class="btn btn-ghost" type="button" data-action="close-modal">Cancelar</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" type="button" id="confirm-action">${esc(label)}</button>`
  });
  $('#confirm-action').addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}

function platformDot(platform) {
  const meta = PLATFORM_META[platform] || { key: 'general' };
  return `<span class="platform-dot ${meta.key}"></span>`;
}

function channelLogo(platform) {
  const meta = PLATFORM_META[platform] || { key: 'general' };
  const letters = platform === 'TikTok' ? 'TT' : platform === 'Facebook Reels' ? 'Re' : platform === 'YouTube Shorts' ? 'Sh' : '—';
  return `<span class="channel-logo ${meta.key}">${letters}</span>`;
}

function kpiCard(config) {
  return `<article class="kpi-card" style="--kpi-color:${config.color};--kpi-bg:${config.bg};--kpi-glow:${config.glow || 'rgba(200,255,74,.07)'}">
    <div class="kpi-top">
      <span class="kpi-icon">${icon(config.icon)}</span>
      <span class="data-chip"><span></span>${esc(config.chip || 'Manual')}</span>
    </div>
    <div class="kpi-label">${esc(config.label)}</div>
    <div class="kpi-value">${config.value}${config.unit ? `<small>${esc(config.unit)}</small>` : ''}</div>
    <div class="kpi-bottom">
      <span class="kpi-delta ${config.deltaClass || ''}">${config.delta || ''}</span>
      <span class="kpi-period">${esc(config.period || '')}</span>
    </div>
    ${config.spark || ''}
  </article>`;
}

function sparkline(values, color = '#c8ff4a') {
  if (!values.length) return '';
  const width = 64;
  const height = 26;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - 2 - ((value - min) / range) * (height - 4);
    return [x, y];
  });
  const path = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  return `<svg class="kpi-sparkline" viewBox="0 0 ${width} ${height}" aria-hidden="true"><path d="${path}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/></svg>`;
}

function smoothPath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index - 1] || points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return path;
}

function niceCeil(value) {
  if (!value || value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / (10 ** exponent);
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * (10 ** exponent);
}

function emptyChart(message, actionLabel = '', action = '', actionData = '') {
  return `<div class="chart-empty">
    ${icon('i-chart')}
    <strong>Sin datos para graficar</strong>
    <p>${esc(message)}</p>
    ${actionLabel ? `<button class="btn btn-small btn-ghost" type="button" data-action="${action}"${actionData}>${esc(actionLabel)}</button>` : ''}
  </div>`;
}

function chartLegend(series) {
  return `<div class="chart-legend">${series.map((item) => `<span><i style="background:${item.color}"></i>${esc(item.name)}</span>`).join('')}</div>`;
}

function lineChart({ labels, series, height = 245, yFormat = formatCompact, area = false, width: widthOverride = 760, emptyText = 'Registra datos manuales para ver la evolución.', emptyAction = 'register-metric', emptyLabel = 'Registrar métricas' }) {
  const hasValue = (value) => value !== null && value !== undefined && Number.isFinite(Number(value));
  const validSeries = series.filter((item) => item.values.some(hasValue));
  const allValues = series.flatMap((item) => item.values.filter(hasValue).map(Number));
  if (!labels.length || !validSeries.length || !allValues.some((value) => value !== 0)) {
    return emptyChart(emptyText, emptyLabel, emptyAction);
  }
  const width = Math.max(300, Math.min(760, Number(widthOverride) || 760));
  const plot = { left: 44, right: 14, top: 14, bottom: 28 };
  const innerWidth = width - plot.left - plot.right;
  const innerHeight = height - plot.top - plot.bottom;
  const minValue = Math.min(0, ...allValues);
  const maxValue = Math.max(1, ...allValues);
  const yMax = niceCeil(maxValue * 1.08);
  const yMin = minValue < 0 ? -niceCeil(Math.abs(minValue) * 1.08) : 0;
  const yRange = yMax - yMin || 1;
  const xFor = (index) => labels.length === 1 ? plot.left + innerWidth / 2 : plot.left + (index / (labels.length - 1)) * innerWidth;
  const yFor = (value) => plot.top + ((yMax - value) / yRange) * innerHeight;
  const ticks = 4;
  const grid = Array.from({ length: ticks + 1 }, (_, index) => {
    const value = yMin + (yRange * index) / ticks;
    const y = yFor(value);
    return `<line class="chart-grid-line" x1="${plot.left}" x2="${width - plot.right}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"></line>
      <text class="chart-axis-text" x="${plot.left - 8}" y="${(y + 3).toFixed(1)}" text-anchor="end">${esc(yFormat(value))}</text>`;
  }).join('');
  const step = Math.max(1, Math.ceil(labels.length / 6));
  const xLabels = labels.map((label, index) => {
    if (index !== 0 && index !== labels.length - 1 && index % step !== 0) return '';
    return `<text class="chart-axis-text" x="${xFor(index).toFixed(1)}" y="${height - 8}" text-anchor="${index === 0 ? 'start' : index === labels.length - 1 ? 'end' : 'middle'}">${esc(label)}</text>`;
  }).join('');
  const defs = [];
  const paths = series.map((item, seriesIndex) => {
    const color = item.color;
    const points = item.values.map((value, index) => hasValue(value) ? { x: xFor(index), y: yFor(Number(value)), value: Number(value), index } : null);
    const dataPoints = points.filter(Boolean);
    let areaPath = '';
    if (area && seriesIndex === 0 && dataPoints.length === labels.length) {
      const gradientId = `area-${++chartSequence}`;
      defs.push(`<linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".2"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient>`);
      areaPath = `<path d="${smoothPath(dataPoints)} L ${dataPoints[dataPoints.length - 1].x.toFixed(1)} ${yFor(0).toFixed(1)} L ${dataPoints[0].x.toFixed(1)} ${yFor(0).toFixed(1)} Z" fill="url(#${gradientId})"></path>`;
    }
    const linePath = dataPoints.length ? `<path d="${smoothPath(dataPoints)}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>` : '';
    const dots = points.map((point) => {
      if (!point) return '';
      if (labels.length > 20 && point.index !== labels.length - 1 && point.index % Math.ceil(labels.length / 8) !== 0) return '';
      return `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${labels.length > 30 ? 2 : 2.7}" fill="#0d111a" stroke="${color}" stroke-width="1.7"><title>${esc(item.name)} · ${esc(labels[point.index])}: ${esc(formatCompact(point.value))}</title></circle>`;
    }).join('');
    return `${areaPath}${linePath}${dots}`;
  }).join('');
  return `${chartLegend(series)}<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfico de líneas comparativo">${defs.length ? `<defs>${defs.join('')}</defs>` : ''}${grid}${xLabels}${paths}</svg>`;
}

function barChart({ labels, series, height = 245, yFormat = formatCompact, width: widthOverride = 760, emptyText = 'Registra datos manuales para ver la comparación.', emptyAction = 'register-metric', emptyLabel = 'Registrar métricas' }) {
  const values = series.flatMap((item) => item.values.map((value) => Number(value) || 0));
  if (!labels.length || !values.some((value) => value !== 0)) {
    return emptyChart(emptyText, emptyLabel, emptyAction);
  }
  const width = Math.max(300, Math.min(760, Number(widthOverride) || 760));
  const plot = { left: 44, right: 14, top: 14, bottom: 30 };
  const innerWidth = width - plot.left - plot.right;
  const innerHeight = height - plot.top - plot.bottom;
  const yMax = niceCeil(Math.max(1, ...values) * 1.08);
  const yFor = (value) => plot.top + ((yMax - value) / yMax) * innerHeight;
  const groupWidth = innerWidth / labels.length;
  const barWidth = Math.min(24, (groupWidth * 0.58) / series.length);
  const gap = 4;
  const totalBars = series.length * barWidth + (series.length - 1) * gap;
  const ticks = 4;
  const grid = Array.from({ length: ticks + 1 }, (_, index) => {
    const value = (yMax * index) / ticks;
    const y = yFor(value);
    return `<line class="chart-grid-line" x1="${plot.left}" x2="${width - plot.right}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"></line>
      <text class="chart-axis-text" x="${plot.left - 8}" y="${(y + 3).toFixed(1)}" text-anchor="end">${esc(yFormat(value))}</text>`;
  }).join('');
  const bars = labels.map((label, labelIndex) => {
    const groupStart = plot.left + labelIndex * groupWidth + (groupWidth - totalBars) / 2;
    const barsHtml = series.map((item, seriesIndex) => {
      const value = Number(item.values[labelIndex]) || 0;
      const barHeight = Math.max(value > 0 ? 2 : 0, (value / yMax) * innerHeight);
      const x = groupStart + seriesIndex * (barWidth + gap);
      const y = yFor(value);
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${barHeight.toFixed(1)}" rx="3" fill="${item.color}" opacity=".9"><title>${esc(item.name)} · ${esc(label)}: ${esc(formatCompact(value))}</title></rect>`;
    }).join('');
    return `${barsHtml}<text class="chart-axis-text" x="${(plot.left + labelIndex * groupWidth + groupWidth / 2).toFixed(1)}" y="${height - 9}" text-anchor="middle">${esc(label)}</text>`;
  }).join('');
  return `${chartLegend(series)}<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Gráfico de barras comparativo">${grid}${bars}</svg>`;
}

function renderProfile() {
  const name = (state.profile.name || 'Creador').trim();
  const initial = name.charAt(0).toUpperCase() || 'C';
  const sidebarName = $('#sidebar-user-name');
  const sidebarProfile = $('#sidebar-profile-name');
  if (sidebarName) sidebarName.textContent = name;
  if (sidebarProfile) sidebarProfile.textContent = `Mi estudio · ${name.split(' ')[0]}`;
  ['#workspace-avatar', '#sidebar-avatar', '#topbar-avatar'].forEach((selector) => {
    const element = $(selector);
    if (!element) return;
    const avatarUrl = state.profile.avatarUrl;
    element.classList.toggle('has-image', Boolean(avatarUrl));
    element.innerHTML = avatarUrl
      ? `<img src="${esc(avatarUrl)}" alt="">`
      : esc(initial);
  });
  const save = $('#save-state');
  if (save) {
    const text = save.querySelector('span:last-child');
    if (text) text.textContent = storageAvailable ? (hasSampleData() ? 'Demo local' : 'Guardado local') : 'Solo esta sesión';
  }
}

function compactTitle(title, length = 42) {
  const clean = String(title || 'Sin título').trim();
  if (clean.length <= length) return clean;
  const cut = clean.slice(0, length - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > length * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}
