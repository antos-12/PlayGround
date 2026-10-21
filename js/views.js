'use strict';

function setGeneratorActions(visible) {
  const actions = $('#generator-actions');
  if (actions) actions.hidden = !visible;
}

function setStudioActions(visible) {
  const actions = $('#studio-actions');
  if (actions) actions.hidden = !visible;
}

function renderGeneratorFromState() {
  if (state.lastGenerator) renderGeneratorResult(state.lastGenerator, false);
}

function renderStudioFromState() {
  if (state.lastStoryboard) renderStoryboardResult(state.lastStoryboard, false);
}

function renderDashboard() {
  const now = new Date();
  const hour = now.getHours();
  const greetingWord = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = (state.profile.name || 'Creador').trim().split(/\s+/)[0];
  const greeting = $('#greeting');
  if (greeting) greeting.textContent = `${greetingWord}, ${firstName}.`;
  const today = $('#today-label');
  if (today) {
    today.textContent = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);
  }
  const current = monthRange(now);
  const previous = previousMonthRange(now);
  const monthPublications = state.publications.filter((item) => withinRange(item.date, current.start, current.end));
  const previousPublications = state.publications.filter((item) => withinRange(item.date, previous.start, previous.end));
  const published = monthPublications.filter((item) => item.status === 'Publicado');
  const previousPublished = previousPublications.filter((item) => item.status === 'Publicado');
  const monthMetrics = getMetrics(current.start, current.end);
  const previousMetrics = getMetrics(previous.start, previous.end);
  const monthIncomes = getIncomes(current.start, current.end);
  const previousIncomes = getIncomes(previous.start, previous.end);
  const views = sum(monthMetrics, 'views');
  const previousViews = sum(previousMetrics, 'views');
  const income = incomeTotal(monthIncomes, 'Cobrado');
  const previousIncome = incomeTotal(previousIncomes, 'Cobrado');
  const lastSeven = Array.from({ length: 7 }, (_, index) => addDaysISO(todayISO(), index - 6));
  const sparkValues = lastSeven.map((date) => {
    const records = state.metrics.filter((item) => item.date === date);
    return records.length ? sum(records, 'views') : null;
  }).filter((value) => value !== null);

  const publicationDelta = deltaInfo(monthPublications.length, previousPublications.length);
  const publishedDelta = deltaInfo(published.length, previousPublished.length);
  const viewsDelta = deltaInfo(views, previousViews);
  const incomeDelta = deltaInfo(income, previousIncome);

  const kpis = [
    {
      label: 'Publicaciones',
      value: formatNumber(monthPublications.length),
      unit: 'este mes',
      icon: 'i-calendar',
      color: '#9a8cff',
      bg: 'rgba(154,140,255,.12)',
      glow: 'rgba(154,140,255,.1)',
      delta: publicationDelta.text,
      deltaClass: publicationDelta.cls,
      period: 'Calendario'
    },
    {
      label: 'Videos publicados',
      value: formatNumber(published.length),
      unit: 'este mes',
      icon: 'i-video',
      color: '#4bd9ff',
      bg: 'rgba(75,217,255,.1)',
      glow: 'rgba(75,217,255,.09)',
      delta: publishedDelta.text,
      deltaClass: publishedDelta.cls,
      period: 'Marcados por ti'
    },
    {
      label: 'Vistas',
      value: monthMetrics.length ? formatNumber(views) : '—',
      unit: monthMetrics.length ? 'registradas' : 'sin registros',
      icon: 'i-eye',
      color: '#c8ff4a',
      bg: 'rgba(200,255,74,.1)',
      glow: 'rgba(200,255,74,.09)',
      delta: monthMetrics.length ? viewsDelta.text : 'Sin datos todavía',
      deltaClass: monthMetrics.length ? viewsDelta.cls : 'neutral',
      period: 'Manual',
      spark: sparkValues.length > 1 ? sparkline(sparkValues, '#c8ff4a') : ''
    },
    {
      label: 'Ingresos cobrados',
      value: monthIncomes.length ? formatMoney(income) : '—',
      unit: monthIncomes.length ? 'MXN' : 'sin registros',
      icon: 'i-wallet',
      color: '#ffb15c',
      bg: 'rgba(255,177,92,.1)',
      glow: 'rgba(255,177,92,.09)',
      delta: monthIncomes.length ? incomeDelta.text : 'Sin datos todavía',
      deltaClass: monthIncomes.length ? incomeDelta.cls : 'neutral',
      period: 'Este mes'
    }
  ];
  const kpiContainer = $('#dashboard-kpis');
  if (kpiContainer) kpiContainer.innerHTML = kpis.map(kpiCard).join('');
  renderWeeklyChart(lastSeven);
  renderUpcoming();
  renderDashboardRevenue(monthIncomes);
  renderChannels(monthMetrics);
  renderSetup();
  const banner = $('#sample-banner');
  if (banner) banner.hidden = !hasSampleData();
  renderProfile();
}

function renderWeeklyChart(dates) {
  const container = $('#weekly-chart');
  if (!container) return;
  const currentMetrics = state.metrics.filter((item) => dates.includes(item.date));
  const labels = dates.map(formatDateAxis);
  const values = dates.map((date) => {
    const records = state.metrics.filter((item) => item.date === date);
    return records.length ? sum(records, 'views') : null;
  });
  const caption = $('#weekly-caption');
  if (!values.some((value) => value > 0)) {
    container.innerHTML = emptyChart('Aún no hay vistas registradas en los últimos 7 días.', 'Registrar ahora', 'register-metric');
    if (caption) caption.textContent = 'Sin registros en los últimos 7 días.';
    return;
  }
  container.innerHTML = lineChart({
    labels,
    series: [{ name: 'Vistas', color: '#c8ff4a', values }],
    height: 205,
    width: container.clientWidth || 760,
    area: true
  });
  if (caption) caption.textContent = `${formatNumber(sum(currentMetrics, 'views'))} vistas · ${currentMetrics.length} ${currentMetrics.length === 1 ? 'registro' : 'registros'} manuales.`;
}

function renderUpcoming() {
  const container = $('#upcoming-list');
  if (!container) return;
  const upcoming = state.publications
    .filter((item) => item.date >= todayISO())
    .sort((a, b) => `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`))
    .slice(0, 4);
  if (!upcoming.length) {
    container.innerHTML = `<div class="compact-empty">
      <span>${icon('i-calendar')}</span>
      <strong>Tu agenda está libre</strong>
      <p>Agrega una publicación para empezar a planear la semana.</p>
    </div>`;
    return;
  }
  container.innerHTML = upcoming.map((item) => {
    const date = parseISO(item.date);
    return `<button class="compact-item" type="button" data-action="edit-publication" data-id="${esc(item.id)}">
      <span class="compact-date"><strong>${date.getDate()}</strong><small>${new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(date).replace('.', '')}</small></span>
      <span class="compact-main"><strong>${esc(compactTitle(item.title, 34))}</strong><span>${platformDot(item.platform)}${esc(PLATFORM_META[item.platform]?.label || item.platform)} · ${esc(item.time || '18:00')}</span></span>
      ${statusPill(item.status)}
    </button>`;
  }).join('');
}

function renderDashboardRevenue(incomes) {
  const container = $('#dashboard-revenue');
  if (!container) return;
  const collected = incomeTotal(incomes, 'Cobrado');
  const pending = incomeTotal(incomes, 'Pendiente');
  const projected = incomeTotal(incomes, 'Proyectado');
  const hasIncomes = incomes.length > 0;
  container.innerHTML = `<div class="revenue-spotlight">
    <span class="revenue-icon">${icon('i-dollar')}</span>
    <div><strong>${hasIncomes ? formatMoney(collected) : '—'}</strong><span>${hasIncomes ? 'Cobrado este mes · registros manuales' : 'Sin ingresos registrados este mes'}</span></div>
  </div>
  <div class="revenue-mini-grid">
    <div class="revenue-mini"><span>Pendiente</span><strong>${hasIncomes ? formatMoney(pending) : '—'}</strong></div>
    <div class="revenue-mini"><span>Proyectado</span><strong>${hasIncomes ? formatMoney(projected) : '—'}</strong></div>
  </div>
  <button class="panel-add" type="button" data-action="add-income">${icon('i-plus')}Registrar ingreso</button>`;
}

function renderChannels(metrics) {
  const container = $('#channel-overview');
  if (!container) return;
  container.innerHTML = Object.keys(PLATFORM_META).map((platform) => {
    const count = metrics.filter((item) => item.platform === platform).length;
    const meta = PLATFORM_META[platform];
    return `<div class="channel-item">
      ${channelLogo(platform)}
      <div class="channel-main"><strong>${esc(meta.label)}</strong><span>${count} ${count === 1 ? 'registro manual' : 'registros manuales'} este mes</span></div>
      <span class="channel-status"><i></i>No conectada</span>
    </div>`;
  }).join('');
}

function renderSetup() {
  const tasks = [
    { key: 'publication', label: 'Agrega tu primera publicación', done: state.publications.length > 0, action: 'open-calendar-new' },
    { key: 'metrics', label: 'Registra métricas reales', done: state.metrics.length > 0, action: 'register-metric' },
    { key: 'content', label: 'Genera un guion o storyboard', done: state.library.length > 0 || Boolean(state.lastGenerator) || Boolean(state.lastStoryboard), action: 'go-generator' },
    { key: 'income', label: 'Registra tu primer ingreso', done: state.incomes.length > 0, action: 'add-income' }
  ];
  const complete = tasks.filter((item) => item.done).length;
  const label = $('#setup-progress-label');
  if (label) label.textContent = `${complete}/4`;
  const bar = $('#setup-progress-bar');
  if (bar) bar.style.width = `${(complete / tasks.length) * 100}%`;
  const list = $('#setup-list');
  if (!list) return;
  list.innerHTML = tasks.map((task) => `<button class="setup-item ${task.done ? 'is-done' : ''}" type="button" data-action="${task.action}">
    <span class="setup-check">${icon('i-check')}</span>
    <span>${esc(task.label)}</span>
    ${icon('i-arrow-right', 'setup-arrow')}
  </button>`).join('');
}

function renderCalendar() {
  const grid = $('#calendar-grid');
  if (!grid) return;
  const monthDate = ui.calendarDate;
  const label = $('#calendar-month-label');
  if (label) {
    const text = formatMonth(monthDate);
    label.textContent = text.charAt(0).toUpperCase() + text.slice(1);
  }
  const first = startOfMonth(monthDate);
  const start = startOfWeek(first);
  const offset = (first.getDay() + 6) % 7;
  const cellCount = Math.ceil((offset + endOfMonth(first).getDate()) / 7) * 7;
  const days = Array.from({ length: cellCount }, (_, index) => addDays(start, index));
  const filtered = state.publications
    .filter((item) => ui.calendarPlatform === 'all' || item.platform === ui.calendarPlatform)
    .filter((item) => ui.calendarStatus === 'all' || item.status === ui.calendarStatus);
  grid.innerHTML = days.map((date) => {
    const iso = isoDate(date);
    const dayEvents = filtered.filter((item) => item.date === iso).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const muted = date.getMonth() !== monthDate.getMonth();
    const today = iso === todayISO();
    const visible = dayEvents.slice(0, 3);
    return `<div class="calendar-cell ${muted ? 'is-muted' : ''} ${today ? 'is-today' : ''}" data-action="open-day" data-date="${iso}" role="button" tabindex="0" aria-label="${esc(formatDateLong(date))}, ${dayEvents.length} publicaciones">
      <div class="day-head"><span class="day-number">${date.getDate()}</span>${dayEvents.length ? `<span class="day-count">${dayEvents.length}</span>` : ''}</div>
      <div class="calendar-events">${visible.map((item) => {
        const platform = publicationPlatform(item);
        return `<button class="calendar-event ${platform.key}" type="button" data-action="edit-publication" data-id="${esc(item.id)}" title="${esc(item.title)} · ${esc(item.status)}"><i></i><span>${esc(item.title)}</span></button>`;
      }).join('')}${dayEvents.length > 3 ? `<span class="more-events">+${dayEvents.length - 3}</span>` : ''}</div>
    </div>`;
  }).join('');
  renderWeekAgenda();
  renderPipeline();
}

function renderWeekAgenda() {
  const container = $('#week-agenda');
  if (!container) return;
  const weekStart = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, index) => isoDate(addDays(weekStart, index)));
  const items = state.publications
    .filter((item) => weekDays.includes(item.date))
    .sort((a, b) => `${a.date}T${a.time || '00:00'}`.localeCompare(`${b.date}T${b.time || '00:00'}`));
  const count = $('#week-count');
  if (count) count.textContent = `${items.length} ${items.length === 1 ? 'publicación' : 'publicaciones'}`;
  if (!items.length) {
    container.innerHTML = '<div class="agenda-empty">No hay publicaciones esta semana. Usa “Nueva publicación” para planear la siguiente.</div>';
    return;
  }
  container.innerHTML = items.map((item) => {
    const date = parseISO(item.date);
    return `<button class="agenda-item" type="button" data-action="edit-publication" data-id="${esc(item.id)}">
      <span class="agenda-day"><strong>${date.getDate()}</strong>${new Intl.DateTimeFormat('es-MX', { weekday: 'short' }).format(date).replace('.', '')}</span>
      <span class="agenda-main"><strong>${esc(item.title)}</strong><span>${platformDot(item.platform)}${esc(item.platform)} · ${esc(item.time || '18:00')}</span></span>
      ${statusPill(item.status)}
    </button>`;
  }).join('');
}

function renderPipeline() {
  const container = $('#pipeline-stats');
  if (!container) return;
  const statuses = Object.keys(STATUS_META);
  const total = state.publications.length;
  container.innerHTML = statuses.map((status) => {
    const count = state.publications.filter((item) => item.status === status).length;
    const width = total ? Math.max(3, (count / total) * 100) : 0;
    return `<div class="pipeline-row"><span>${esc(status)}</span><div class="pipeline-bar"><i style="width:${width}%;--bar-color:${STATUS_META[status].color}"></i></div><strong>${count}</strong></div>`;
  }).join('');
}

function openDayAgenda(dateISO) {
  const items = state.publications
    .filter((item) => item.date === dateISO)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const title = formatDateLong(dateISO);
  const body = items.length
    ? `<div class="day-agenda">${items.map((item) => `<button class="day-event" type="button" data-action="edit-publication" data-id="${esc(item.id)}">
        <span class="day-event-time">${esc(item.time || '18:00')}</span>
        <span class="day-event-main"><strong>${esc(item.title)}</strong><span>${platformDot(item.platform)}${esc(item.platform)} · ${esc(item.status)}</span></span>
        ${statusPill(item.status)}
      </button>`).join('')}</div>`
    : `<div class="agenda-empty" style="margin-bottom:14px">No hay publicaciones para este día. Puedes crear la primera ahora.</div>`;
  openModal({
    title,
    eyebrow: 'Agenda del día',
    body,
    foot: `<button class="btn btn-ghost" type="button" data-action="close-modal">Cerrar</button><button class="btn btn-primary" type="button" data-action="new-publication-for-day" data-date="${esc(dateISO)}">${icon('i-plus')}Nueva publicación</button>`
  });
}
