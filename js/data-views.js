'use strict';

function analyticsDateRange() {
  const end = todayISO();
  const start = addDaysISO(end, -(ui.analyticsRange - 1));
  const previousEnd = addDaysISO(start, -1);
  const previousStart = addDaysISO(previousEnd, -(ui.analyticsRange - 1));
  return { start, end, previousStart, previousEnd };
}

function dateLabels(start, end) {
  const labels = [];
  const dates = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    labels.push(formatDateAxis(cursor));
    cursor = addDaysISO(cursor, 1);
  }
  return { labels, dates };
}

function renderAnalytics() {
  const container = $('#analytics-kpis');
  if (!container) return;
  const { start, end, previousStart, previousEnd } = analyticsDateRange();
  const platform = ui.analyticsPlatform;
  const metrics = getMetrics(start, end, platform);
  const previousMetrics = getMetrics(previousStart, previousEnd, platform);
  const incomes = getIncomes(start, end, platform);
  const previousIncomes = getIncomes(previousStart, previousEnd, platform);
  const views = sum(metrics, 'views');
  const previousViews = sum(previousMetrics, 'views');
  const retention = averageRetention(metrics);
  const previousRetention = averageRetention(previousMetrics);
  const interactions = sum(metrics, 'comments') + sum(metrics, 'shares') + sum(metrics, 'clicks');
  const previousInteractions = sum(previousMetrics, 'comments') + sum(previousMetrics, 'shares') + sum(previousMetrics, 'clicks');
  const followers = sum(metrics, 'followers');
  const previousFollowers = sum(previousMetrics, 'followers');
  const income = incomeTotal(incomes, 'Cobrado');
  const previousIncome = incomeTotal(previousIncomes, 'Cobrado');
  const viewsDelta = deltaInfo(views, previousViews);
  const retentionDelta = deltaInfo(retention, previousRetention);
  const interactionsDelta = deltaInfo(interactions, previousInteractions);
  const followersDelta = deltaInfo(followers, previousFollowers);
  const incomeDelta = deltaInfo(income, previousIncome);

  const hasMetrics = metrics.length > 0;
  const hasIncomes = incomes.length > 0;
  const kpis = [
    { label: 'Vistas', value: hasMetrics ? formatNumber(views) : '—', unit: hasMetrics ? 'manuales' : 'sin registros', icon: 'i-eye', color: '#c8ff4a', bg: 'rgba(200,255,74,.1)', delta: hasMetrics ? viewsDelta.text : 'Sin datos todavía', deltaClass: hasMetrics ? viewsDelta.cls : 'neutral', period: 'Periodo' },
    { label: 'Retención media', value: hasMetrics ? formatPct(retention) : '—', unit: hasMetrics ? 'ponderada' : 'sin registros', icon: 'i-target', color: '#9a8cff', bg: 'rgba(154,140,255,.12)', delta: hasMetrics ? retentionDelta.text : 'Sin datos todavía', deltaClass: hasMetrics ? retentionDelta.cls : 'neutral', period: 'Periodo' },
    { label: 'Interacciones', value: hasMetrics ? formatNumber(interactions) : '—', unit: hasMetrics ? 'comentarios + compartidos + clics' : 'sin registros', icon: 'i-trending', color: '#4bd9ff', bg: 'rgba(75,217,255,.1)', delta: hasMetrics ? interactionsDelta.text : 'Sin datos todavía', deltaClass: hasMetrics ? interactionsDelta.cls : 'neutral', period: 'Periodo' },
    { label: 'Seguidores netos', value: hasMetrics ? formatNumber(followers) : '—', unit: hasMetrics ? 'ganados' : 'sin registros', icon: 'i-users', color: '#ff79a8', bg: 'rgba(255,121,168,.1)', delta: hasMetrics ? followersDelta.text : 'Sin datos todavía', deltaClass: hasMetrics ? followersDelta.cls : 'neutral', period: 'Manual' },
    { label: 'Ingresos cobrados', value: hasIncomes ? formatMoney(income) : '—', unit: hasIncomes ? 'MXN' : 'sin registros', icon: 'i-wallet', color: '#ffb15c', bg: 'rgba(255,177,92,.1)', delta: hasIncomes ? incomeDelta.text : 'Sin datos todavía', deltaClass: hasIncomes ? incomeDelta.cls : 'neutral', period: 'Periodo' }
  ];
  container.innerHTML = kpis.map(kpiCard).join('');

  const rangeLabel = $('#analytics-range-label');
  if (rangeLabel) rangeLabel.textContent = `Últimos ${ui.analyticsRange} días`;

  renderViewsChart(start, end, platform, metrics);
  renderEngagementChart(metrics);
  renderFollowersChart(start, end, platform, metrics);
  renderRevenueChart(incomes, platform);
  renderMetricsTable(metrics);
}

function renderViewsChart(start, end, platform, metrics) {
  const container = $('#views-chart');
  if (!container) return;
  const { labels, dates } = dateLabels(start, end);
  const platforms = platform === 'all'
    ? Object.keys(PLATFORM_META).filter((name) => metrics.some((item) => item.platform === name))
    : [platform];
  const series = platforms.map((name) => ({
    name,
    color: PLATFORM_META[name]?.color || '#c8ff4a',
    values: dates.map((date) => {
      const records = metrics.filter((item) => item.date === date && item.platform === name);
      return records.length ? sum(records, 'views') : null;
    })
  }));
  container.innerHTML = lineChart({
    labels,
    series,
    height: 255,
    width: container.clientWidth || 760,
    emptyText: 'Registra vistas de tus publicaciones para comparar plataformas.',
    emptyAction: 'register-metric',
    emptyLabel: 'Registrar métricas'
  });
}

function renderEngagementChart(metrics) {
  const container = $('#engagement-chart');
  if (!container) return;
  const platforms = Object.keys(PLATFORM_META).filter((name) => metrics.some((item) => item.platform === name));
  const series = [
    { name: 'Comentarios', color: '#9a8cff', values: platforms.map((name) => sum(metrics.filter((item) => item.platform === name), 'comments')) },
    { name: 'Compartidos', color: '#4bd9ff', values: platforms.map((name) => sum(metrics.filter((item) => item.platform === name), 'shares')) },
    { name: 'Clics', color: '#c8ff4a', values: platforms.map((name) => sum(metrics.filter((item) => item.platform === name), 'clicks')) }
  ];
  const labels = platforms.map((name) => PLATFORM_META[name].short);
  container.innerHTML = barChart({
    labels,
    series,
    height: 245,
    width: container.clientWidth || 760,
    emptyText: 'Agrega comentarios, compartidos y clics para ver la interacción por plataforma.',
    emptyAction: 'register-metric',
    emptyLabel: 'Registrar métricas'
  });
}

function renderFollowersChart(start, end, platform, metrics) {
  const container = $('#followers-chart');
  if (!container) return;
  const { labels, dates } = dateLabels(start, end);
  const platforms = platform === 'all'
    ? Object.keys(PLATFORM_META).filter((name) => metrics.some((item) => item.platform === name))
    : [platform];
  const series = platforms.map((name) => ({
    name,
    color: PLATFORM_META[name]?.color || '#ff79a8',
    values: dates.map((date) => {
      const records = metrics.filter((item) => item.date === date && item.platform === name);
      return records.length ? sum(records, 'followers') : null;
    })
  }));
  container.innerHTML = lineChart({
    labels,
    series,
    height: 245,
    width: container.clientWidth || 760,
    emptyText: 'Registra los seguidores ganados por publicación para ver el crecimiento neto.',
    emptyAction: 'register-metric',
    emptyLabel: 'Registrar métricas'
  });
}

function renderRevenueChart(incomes, platform) {
  const container = $('#analytics-revenue-chart');
  if (!container) return;
  const platforms = platform === 'all' ? Object.keys(PLATFORM_META) : [platform];
  const labels = platforms.map((name) => PLATFORM_META[name].short);
  const series = [
    { name: 'Cobrado', color: '#c8ff4a', values: platforms.map((name) => incomeTotal(incomes.filter((item) => item.platform === name), 'Cobrado')) },
    { name: 'Pendiente', color: '#ffb15c', values: platforms.map((name) => incomeTotal(incomes.filter((item) => item.platform === name), 'Pendiente')) },
    { name: 'Proyectado', color: '#9a8cff', values: platforms.map((name) => incomeTotal(incomes.filter((item) => item.platform === name), 'Proyectado')) }
  ];
  container.innerHTML = barChart({
    labels,
    series,
    height: 245,
    width: container.clientWidth || 760,
    yFormat: (value) => formatMoney(value),
    emptyText: 'Los ingresos que registres en Monetización aparecerán aquí.',
    emptyAction: 'add-income',
    emptyLabel: 'Registrar ingreso'
  });
}

function renderMetricsTable(metrics) {
  const body = $('#metrics-table-body');
  const empty = $('#metrics-empty');
  const count = $('#metrics-count');
  if (!body) return;
  if (count) count.textContent = `${metrics.length} ${metrics.length === 1 ? 'registro' : 'registros'}`;
  if (!metrics.length) {
    body.innerHTML = '';
    if (empty) {
      empty.hidden = false;
      empty.innerHTML = `<strong>Aún no hay métricas en este periodo</strong><p>Registra vistas, retención e interacciones desde tus paneles oficiales. Esta app no las inventa ni las descarga sola.</p><button class="btn btn-small btn-primary" type="button" data-action="register-metric">Registrar métricas</button>`;
    }
    return;
  }
  if (empty) empty.hidden = true;
  const sorted = [...metrics].sort((a, b) => b.date.localeCompare(a.date));
  body.innerHTML = sorted.map((item) => `<tr>
    <td>${esc(formatDateFull(item.date))}</td>
    <td><span class="source-pill"><i style="background:${PLATFORM_META[item.platform]?.color || '#8992a5'}"></i>${esc(item.platform)}</span></td>
    <td class="cell-title">${esc(item.title || 'Sin referencia')}${item.sample ? ' · <span class="tag">Ejemplo</span>' : ''}</td>
    <td class="num cell-strong">${formatNumber(item.views)}</td>
    <td class="num">${formatPct(item.retention)}</td>
    <td class="num">${formatNumber((Number(item.comments) || 0) + (Number(item.shares) || 0) + (Number(item.clicks) || 0))}</td>
    <td><div class="row-actions">
      <button class="row-action" type="button" data-action="edit-metric" data-id="${esc(item.id)}" aria-label="Editar métrica">${icon('i-edit')}</button>
      <button class="row-action danger" type="button" data-action="delete-metric" data-id="${esc(item.id)}" aria-label="Eliminar métrica">${icon('i-trash')}</button>
    </div></td>
  </tr>`).join('');
}

function incomePeriodRange() {
  if (ui.incomeRange === 'all') return { start: '0000-01-01', end: '9999-12-31', label: 'Todo el historial' };
  const end = todayISO();
  const start = addDaysISO(end, -(Number(ui.incomeRange) - 1));
  const label = ui.incomeRange === 365 ? 'Últimos 12 meses' : `Últimos ${ui.incomeRange} días`;
  return { start, end, label };
}

function renderMonetization() {
  const container = $('#monetization-kpis');
  if (!container) return;
  const range = incomePeriodRange();
  const incomes = state.incomes.filter((item) => withinRange(item.date, range.start, range.end));
  const total = incomeTotal(incomes);
  const collected = incomeTotal(incomes, 'Cobrado');
  const pending = incomeTotal(incomes, 'Pendiente');
  const projected = incomeTotal(incomes, 'Proyectado');
  const hasIncomes = incomes.length > 0;
  const kpis = [
    { label: 'Cobrado', value: hasIncomes ? formatMoney(collected) : '—', unit: hasIncomes ? 'MXN' : 'sin registros', icon: 'i-check', color: '#c8ff4a', bg: 'rgba(200,255,74,.1)', delta: 'Confirmado por ti', deltaClass: 'neutral', period: range.label },
    { label: 'Pendiente', value: hasIncomes ? formatMoney(pending) : '—', unit: hasIncomes ? 'MXN' : 'sin registros', icon: 'i-clock', color: '#ffb15c', bg: 'rgba(255,177,92,.1)', delta: 'Por cobrar', deltaClass: 'neutral', period: range.label },
    { label: 'Proyectado', value: hasIncomes ? formatMoney(projected) : '—', unit: hasIncomes ? 'MXN' : 'sin registros', icon: 'i-trending', color: '#9a8cff', bg: 'rgba(154,140,255,.12)', delta: 'Estimación tuya', deltaClass: 'neutral', period: range.label },
    { label: 'Total registrado', value: hasIncomes ? formatMoney(total) : '—', unit: hasIncomes ? 'MXN' : 'sin registros', icon: 'i-wallet', color: '#4bd9ff', bg: 'rgba(75,217,255,.1)', delta: 'Manual', deltaClass: 'neutral', period: `${incomes.length} registros` }
  ];
  container.innerHTML = kpis.map(kpiCard).join('');
  const label = $('#income-period-label');
  if (label) label.textContent = range.label;

  const sourceTotals = SOURCE_META.map((source) => ({
    ...source,
    total: incomes.filter((item) => item.source === source.name).reduce((acc, item) => acc + (Number(item.amount) || 0), 0)
  }));
  renderIncomeDonut(sourceTotals, total);
  renderIncomeTable(incomes);
}

function renderIncomeDonut(sourceTotals, total) {
  const donut = $('#income-donut');
  const bars = $('#income-source-bars');
  if (!donut || !bars) return;
  let cumulative = 0;
  const segments = sourceTotals.filter((item) => item.total > 0).map((item) => {
    const start = cumulative;
    cumulative += (item.total / total) * 100;
    return `${item.color} ${start.toFixed(2)}% ${cumulative.toFixed(2)}%`;
  });
  const hasIncomes = total > 0;
  const background = hasIncomes ? `conic-gradient(${segments.join(', ')})` : 'conic-gradient(rgba(255,255,255,.06) 0 100%)';
  donut.innerHTML = `<div class="donut" style="background:${background}"><div class="donut-center"><strong>${hasIncomes ? formatMoney(total) : '—'}</strong><span>${hasIncomes ? 'Total' : 'Sin registros'}</span></div></div>`;
  bars.innerHTML = sourceTotals.map((source) => {
    const percent = total ? (source.total / total) * 100 : 0;
    return `<div class="source-item">
      <div class="source-bar-head"><span><i style="background:${source.color}"></i>${esc(source.name)}</span><strong>${hasIncomes ? formatMoney(source.total) : '—'}</strong></div>
      <div class="source-bar"><i style="width:${Math.max(percent, source.total > 0 ? 2 : 0)}%;background:${source.color}"></i></div>
    </div>`;
  }).join('');
}

function renderIncomeTable(incomes) {
  const body = $('#income-table-body');
  const empty = $('#income-empty');
  const count = $('#income-count');
  if (!body) return;
  if (count) count.textContent = `${incomes.length} ${incomes.length === 1 ? 'registro' : 'registros'}`;
  if (!incomes.length) {
    body.innerHTML = '';
    if (empty) {
      empty.hidden = false;
      empty.innerHTML = `<strong>No hay ingresos en este periodo</strong><p>Registra manualmente cada pago cuando lo confirmes. No se generan cifras automáticamente.</p><button class="btn btn-small btn-primary" type="button" data-action="add-income">Registrar ingreso</button>`;
    }
    return;
  }
  if (empty) empty.hidden = true;
  const sorted = [...incomes].sort((a, b) => b.date.localeCompare(a.date));
  body.innerHTML = sorted.map((item) => {
    const source = SOURCE_META.find((entry) => entry.name === item.source) || { color: '#8992a5', name: item.source };
    const statusClass = item.status === 'Cobrado' ? 'green' : item.status === 'Pendiente' ? 'orange' : 'violet';
    return `<tr>
      <td>${esc(formatDateFull(item.date))}</td>
      <td><span class="source-pill"><i style="background:${source.color}"></i>${esc(item.source)}</span></td>
      <td class="cell-title">${esc(item.concept || 'Sin concepto')}${item.sample ? ' · <span class="tag">Ejemplo</span>' : ''}</td>
      <td>${esc(item.platform || 'General')}</td>
      <td><span class="status-pill ${statusClass}">${esc(item.status)}</span></td>
      <td class="num cell-strong">${formatMoney(item.amount)}</td>
      <td><div class="row-actions">
        <button class="row-action" type="button" data-action="edit-income" data-id="${esc(item.id)}" aria-label="Editar ingreso">${icon('i-edit')}</button>
        <button class="row-action danger" type="button" data-action="delete-income" data-id="${esc(item.id)}" aria-label="Eliminar ingreso">${icon('i-trash')}</button>
      </div></td>
    </tr>`;
  }).join('');
}

function renderIntegrationList() {
  const container = $('#integration-list');
  if (!container) return;
  container.innerHTML = Object.keys(PLATFORM_META).map((platform) => {
    const meta = PLATFORM_META[platform];
    return `<div class="integration-item">${channelLogo(platform)}<strong>${esc(meta.label)}</strong><span><i></i>No conectada</span></div>`;
  }).join('');
}

function renderLibraryStats() {
  const container = $('#library-stats');
  if (!container) return;
  const types = [
    { key: 'idea', icon: 'i-sparkles' },
    { key: 'guion', icon: 'i-file' },
    { key: 'prompt', icon: 'i-wand' },
    { key: 'publicacion', icon: 'i-send' },
    { key: 'avatar', icon: 'i-users' }
  ];
  container.innerHTML = types.map((type) => {
    const count = state.library.filter((item) => item.type === type.key).length;
    const meta = LIBRARY_META[type.key];
    return `<span class="library-stat">${icon(type.icon)}<strong>${count}</strong>${esc(count === 1 ? meta.label : meta.plural)}</span>`;
  }).join('') + `<span class="library-stat">${icon('i-library')}<strong>${state.library.length}</strong>Total</span>`;
}

function libraryFilteredItems() {
  const query = normalizeText(ui.librarySearch.trim());
  let items = [...state.library];
  if (ui.libraryType !== 'all') items = items.filter((item) => item.type === ui.libraryType);
  if (ui.libraryPlatform !== 'all') items = items.filter((item) => (item.platform || 'General') === ui.libraryPlatform);
  if (query) {
    items = items.filter((item) => normalizeText(`${item.title} ${item.body} ${(item.tags || []).join(' ')} ${item.platform}`).includes(query));
  }
  items.sort((a, b) => {
    if (ui.librarySort === 'title') return a.title.localeCompare(b.title, 'es');
    if (ui.librarySort === 'oldest') return String(a.updatedAt || a.createdAt).localeCompare(String(b.updatedAt || b.createdAt));
    return String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt));
  });
  return items;
}

function renderLibrary() {
  renderLibraryStats();
  $$('#library-tabs button').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.libraryType === ui.libraryType);
  });
  const grid = $('#library-grid');
  const empty = $('#library-empty');
  if (!grid) return;
  const items = libraryFilteredItems();
  if (!items.length) {
    grid.innerHTML = '';
    if (empty) {
      empty.hidden = false;
      const hasFilters = ui.librarySearch || ui.libraryType !== 'all' || ui.libraryPlatform !== 'all';
      empty.innerHTML = `<div class="empty-icon-sm">${icon(hasFilters ? 'i-search' : 'i-library')}</div>
        <h3>${hasFilters ? 'No encontramos coincidencias' : 'Tu biblioteca está lista para crecer'}</h3>
        <p>${hasFilters ? 'Prueba con otra búsqueda o cambia los filtros.' : 'Guarda ideas, guiones, prompts, publicaciones y avatares para reutilizarlos cuando los necesites.'}</p>
        <div class="empty-actions">
          ${hasFilters ? '<button class="btn btn-ghost" type="button" data-action="clear-library-filters">Limpiar filtros</button>' : ''}
          <button class="btn btn-primary" type="button" data-action="new-library">${icon('i-plus')}Crear elemento</button>
        </div>`;
    }
    return;
  }
  if (empty) empty.hidden = true;
  grid.innerHTML = items.map((item) => {
    const meta = LIBRARY_META[item.type] || LIBRARY_META.idea;
    const tags = (item.tags || []).slice(0, 3);
    const excerpt = item.body ? item.body.replace(/\s+/g, ' ').slice(0, 170) : 'Sin contenido todavía.';
    return `<article class="library-card" style="--card-glow:${meta.glow}">
      <div class="library-card-top">
        <span class="type-badge ${meta.cls}">${icon(meta.icon)}${esc(meta.label)}</span>
        <span class="card-menu">
          <button type="button" data-action="edit-library" data-id="${esc(item.id)}" aria-label="Editar">${icon('i-edit')}</button>
          <button type="button" data-action="duplicate-library" data-id="${esc(item.id)}" aria-label="Duplicar">${icon('i-duplicate')}</button>
          <button class="danger" type="button" data-action="delete-library" data-id="${esc(item.id)}" aria-label="Eliminar">${icon('i-trash')}</button>
        </span>
      </div>
      ${item.imageUrl ? `<button class="library-avatar-preview" type="button" data-action="view-library" data-id="${esc(item.id)}" aria-label="Ver ${esc(item.title)}"><img src="${item.imageUrl}" alt="" loading="lazy"><span>IA</span></button>` : ''}
      <h3><button class="card-title-button" type="button" data-action="view-library" data-id="${esc(item.id)}">${esc(item.title)}</button></h3>
      <p class="card-excerpt">${esc(excerpt)}</p>
      <div class="tag-list">${tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}${item.sample ? '<span class="tag">Ejemplo</span>' : ''}</div>
      <div class="library-card-foot">
        <span>${platformDot(item.platform || 'General')}${esc(item.platform || 'General')}</span>
        <span>${icon('i-clock')}${esc(formatDateShort(item.updatedAt || item.createdAt))}</span>
      </div>
    </article>`;
  }).join('');
}

function renderAll() {
  renderProfile();
  renderDashboard();
  renderGeneratorFromState();
  renderAvatarFromState();
  renderStudioFromState();
  renderCalendar();
  renderAnalytics();
  renderMonetization();
  renderIntegrationList();
  renderLibrary();
}
