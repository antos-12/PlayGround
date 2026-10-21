'use strict';

function platformOptions(selected) {
  return Object.keys(PLATFORM_META).map((name) => `<option value="${esc(name)}"${name === selected ? ' selected' : ''}>${esc(name)}</option>`).join('');
}

function sourceOptions(selected) {
  return SOURCE_META.map((source) => `<option value="${esc(source.name)}"${source.name === selected ? ' selected' : ''}>${esc(source.name)}</option>`).join('');
}

function openMetricModal(id = '') {
  const existing = state.metrics.find((item) => item.id === id);
  const publications = [...state.publications].sort((a, b) => b.date.localeCompare(a.date));
  const publicationOptions = publications.map((item) => `<option value="${esc(item.id)}"${existing?.publicationId === item.id ? ' selected' : ''}>${esc(formatDateShort(item.date))} · ${esc(compactTitle(item.title, 44))}</option>`).join('');
  const body = `<form id="metric-form" novalidate>
    <div class="modal-note">${icon('i-info')}<span>Estas cifras las registras tú desde los paneles oficiales. La app no las descarga ni las inventa.</span></div>
    <div class="modal-form-grid">
      <label class="field"><span>Plataforma</span><select id="metric-platform" required>${platformOptions(existing?.platform || 'TikTok')}</select></label>
      <label class="field"><span>Fecha</span><input id="metric-date" type="date" value="${esc(existing?.date || todayISO())}" max="${todayISO()}" required></label>
      <label class="field full"><span>Publicación vinculada <em>Opcional</em></span><select id="metric-publication"><option value="">Sin vincular</option>${publicationOptions}</select></label>
      <label class="field full"><span>Nombre o referencia</span><input id="metric-title" type="text" maxlength="90" value="${esc(existing?.title || '')}" placeholder="Ej. Cómo ahorrar $500 al mes"></label>
      <label class="field"><span>Vistas</span><input id="metric-views" type="number" min="0" step="1" value="${esc(existing?.views ?? 0)}" required></label>
      <label class="field"><span>Retención (%)</span><input id="metric-retention" type="number" min="0" max="100" step="0.1" value="${esc(existing?.retention ?? 0)}" required></label>
      <label class="field"><span>Comentarios</span><input id="metric-comments" type="number" min="0" step="1" value="${esc(existing?.comments ?? 0)}"></label>
      <label class="field"><span>Compartidos</span><input id="metric-shares" type="number" min="0" step="1" value="${esc(existing?.shares ?? 0)}"></label>
      <label class="field"><span>Clics</span><input id="metric-clicks" type="number" min="0" step="1" value="${esc(existing?.clicks ?? 0)}"></label>
      <label class="field"><span>Seguidores netos</span><input id="metric-followers" type="number" step="1" value="${esc(existing?.followers ?? 0)}"></label>
    </div>
  </form>`;
  openModal({
    title: existing ? 'Editar métrica' : 'Registrar métricas',
    eyebrow: 'Datos manuales',
    body,
    foot: `<button class="btn btn-ghost" type="button" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit" form="metric-form">${icon('i-save')}Guardar métrica</button>`,
    size: 'modal-wide'
  });
  const publicationSelect = $('#metric-publication');
  if (publicationSelect) {
    publicationSelect.addEventListener('change', () => {
      const selected = state.publications.find((item) => item.id === publicationSelect.value);
      if (selected && !$('#metric-title').value.trim()) $('#metric-title').value = selected.title;
      if (selected) $('#metric-platform').value = selected.platform;
    });
  }
  $('#metric-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const date = $('#metric-date').value;
    if (!date) {
      $('#metric-date').classList.add('is-invalid');
      toast('Selecciona una fecha válida.', 'error');
      return;
    }
    const publication = state.publications.find((item) => item.id === $('#metric-publication').value);
    const title = $('#metric-title').value.trim() || publication?.title || `${$('#metric-platform').value} · ${formatDateFull(date)}`;
    const record = {
      id: existing?.id || uid('metric'),
      date,
      platform: $('#metric-platform').value,
      publicationId: publication?.id || '',
      title,
      views: Math.max(0, Number($('#metric-views').value) || 0),
      retention: clamp(Number($('#metric-retention').value) || 0, 0, 100),
      comments: Math.max(0, Number($('#metric-comments').value) || 0),
      shares: Math.max(0, Number($('#metric-shares').value) || 0),
      clicks: Math.max(0, Number($('#metric-clicks').value) || 0),
      followers: Number($('#metric-followers').value) || 0,
      revenue: existing?.revenue || 0,
      sample: false
    };
    if (existing) {
      Object.assign(existing, record);
    } else {
      state.metrics.push(record);
    }
    saveState();
    renderAll();
    closeModal();
    toast(existing ? 'Métrica actualizada.' : 'Métrica registrada.');
  });
}

function openIncomeModal(id = '') {
  const existing = state.incomes.find((item) => item.id === id);
  const body = `<form id="income-form" novalidate>
    <div class="modal-note">${icon('i-info')}<span>Registra solo ingresos reales. “Proyectado” es una estimación tuya y no se cuenta como cobrado.</span></div>
    <div class="modal-form-grid">
      <label class="field"><span>Fuente</span><select id="income-source" required>${sourceOptions(existing?.source || 'Anuncios')}</select></label>
      <label class="field"><span>Plataforma</span><select id="income-platform">${platformOptions(existing?.platform || 'TikTok')}<option value="General"${existing?.platform === 'General' ? ' selected' : ''}>General</option></select></label>
      <label class="field"><span>Fecha</span><input id="income-date" type="date" value="${esc(existing?.date || todayISO())}" required></label>
      <label class="field"><span>Estado</span><select id="income-status">
        <option value="Cobrado"${existing?.status === 'Cobrado' || !existing ? ' selected' : ''}>Cobrado</option>
        <option value="Pendiente"${existing?.status === 'Pendiente' ? ' selected' : ''}>Pendiente</option>
        <option value="Proyectado"${existing?.status === 'Proyectado' ? ' selected' : ''}>Proyectado</option>
      </select></label>
      <label class="field full"><span>Concepto</span><input id="income-concept" type="text" maxlength="100" value="${esc(existing?.concept || '')}" placeholder="Ej. Fondo de creador · quincena 1" required></label>
      <label class="field"><span>Monto (MXN)</span><input id="income-amount" type="number" min="0.01" step="0.01" value="${esc(existing?.amount ?? '')}" placeholder="0.00" required></label>
      <label class="field"><span>Referencia</span><input id="income-reference" type="text" maxlength="60" value="${esc(existing?.reference || '')}" placeholder="Opcional"></label>
      <label class="field full"><span>Notas</span><textarea id="income-notes" rows="2" maxlength="240" placeholder="Detalles del pago, condiciones o fecha estimada.">${esc(existing?.notes || '')}</textarea></label>
    </div>
  </form>`;
  openModal({
    title: existing ? 'Editar ingreso' : 'Registrar ingreso',
    eyebrow: 'Monetización',
    body,
    foot: `<button class="btn btn-ghost" type="button" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit" form="income-form">${icon('i-save')}Guardar ingreso</button>`,
    size: 'modal-wide'
  });
  $('#income-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const amount = Number($('#income-amount').value);
    if (!Number.isFinite(amount) || amount <= 0) {
      $('#income-amount').classList.add('is-invalid');
      toast('Ingresa un monto mayor a cero.', 'error');
      return;
    }
    const concept = $('#income-concept').value.trim();
    if (!concept) {
      $('#income-concept').classList.add('is-invalid');
      toast('Escribe un concepto para el ingreso.', 'error');
      return;
    }
    const record = {
      id: existing?.id || uid('income'),
      date: $('#income-date').value || todayISO(),
      source: $('#income-source').value,
      platform: $('#income-platform').value,
      concept,
      amount,
      status: $('#income-status').value,
      reference: $('#income-reference').value.trim(),
      notes: $('#income-notes').value.trim(),
      sample: false
    };
    if (existing) {
      Object.assign(existing, record);
    } else {
      state.incomes.push(record);
    }
    saveState();
    renderAll();
    closeModal();
    toast(existing ? 'Ingreso actualizado.' : 'Ingreso registrado.');
  });
}

function openPublicationModal({ id = '', date = '', title = '', platform = 'TikTok', status = 'Programado' } = {}) {
  const existing = state.publications.find((item) => item.id === id);
  const selectedDate = existing?.date || date || todayISO();
  const selectedPlatform = existing?.platform || platform;
  const selectedStatus = existing?.status || status;
  const formats = ['Video vertical', 'Reel', 'Short', 'Story', 'Otro'];
  const body = `<form id="publication-form" novalidate>
    <div class="modal-note">${icon('i-calendar')}<span>Esta herramienta organiza tu plan. No publica ni programa contenido en TikTok, Facebook o YouTube automáticamente.</span></div>
    <div class="modal-form-grid">
      <label class="field full"><span>Título de la publicación</span><input id="publication-title" type="text" maxlength="100" value="${esc(existing?.title || title)}" placeholder="Ej. 3 errores al presupuestar" required></label>
      <label class="field"><span>Plataforma</span><select id="publication-platform">${platformOptions(selectedPlatform)}</select></label>
      <label class="field"><span>Formato</span><select id="publication-format">${formats.map((format) => `<option value="${format}"${(existing?.format || 'Video vertical') === format ? ' selected' : ''}>${format}</option>`).join('')}</select></label>
      <label class="field"><span>Fecha</span><input id="publication-date" type="date" value="${esc(selectedDate)}" required></label>
      <label class="field"><span>Hora</span><input id="publication-time" type="time" value="${esc(existing?.time || '18:00')}"></label>
      <label class="field full"><span>Estado</span><select id="publication-status">${Object.keys(STATUS_META).map((name) => `<option value="${name}"${name === selectedStatus ? ' selected' : ''}>${name}</option>`).join('')}</select></label>
      <label class="field full"><span>Notas</span><textarea id="publication-notes" rows="3" maxlength="300" placeholder="Idea, referencias, materiales o recordatorios.">${esc(existing?.notes || '')}</textarea></label>
    </div>
  </form>`;
  openModal({
    title: existing ? 'Editar publicación' : 'Nueva publicación',
    eyebrow: 'Calendario editorial',
    body,
    foot: `${existing ? `<button class="btn btn-danger danger-left" type="button" id="delete-publication">${icon('i-trash')}Eliminar</button>` : ''}
      <button class="btn btn-ghost" type="button" data-action="close-modal">Cancelar</button>
      <button class="btn btn-primary" type="submit" form="publication-form">${icon('i-save')}Guardar</button>`,
    size: 'modal-wide'
  });
  if (existing) {
    $('#delete-publication')?.addEventListener('click', () => {
      openConfirm({
        title: 'Eliminar publicación',
        message: `Se eliminará “${existing.title}” del calendario. Esta acción no se puede deshacer.`,
        label: 'Eliminar',
        onConfirm: () => {
          state.publications = state.publications.filter((item) => item.id !== existing.id);
          saveState();
          renderAll();
          toast('Publicación eliminada.');
        }
      });
    });
  }
  $('#publication-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const titleValue = $('#publication-title').value.trim();
    if (!titleValue) {
      $('#publication-title').classList.add('is-invalid');
      toast('Escribe un título para la publicación.', 'error');
      return;
    }
    const record = {
      id: existing?.id || uid('pub'),
      title: titleValue,
      platform: $('#publication-platform').value,
      format: $('#publication-format').value,
      date: $('#publication-date').value || todayISO(),
      time: $('#publication-time').value || '18:00',
      status: $('#publication-status').value,
      notes: $('#publication-notes').value.trim(),
      sample: false
    };
    if (existing) {
      Object.assign(existing, record);
    } else {
      state.publications.push(record);
    }
    saveState();
    renderAll();
    closeModal();
    toast(existing ? 'Publicación actualizada.' : 'Publicación agregada al calendario.');
  });
}

function openLibraryModal(id = '', presetType = 'idea') {
  const existing = state.library.find((item) => item.id === id);
  const types = Object.entries(LIBRARY_META);
  const platforms = ['General', ...Object.keys(PLATFORM_META)];
  const body = `<form id="library-form" novalidate>
    <div class="modal-form-grid">
      <label class="field"><span>Tipo</span><select id="library-type">${types.map(([key, meta]) => `<option value="${key}"${(existing?.type || presetType) === key ? ' selected' : ''}>${meta.label}</option>`).join('')}</select></label>
      <label class="field"><span>Plataforma</span><select id="library-platform">${platforms.map((name) => `<option value="${esc(name)}"${(existing?.platform || 'General') === name ? ' selected' : ''}>${esc(name)}</option>`).join('')}</select></label>
      <label class="field full"><span>Título</span><input id="library-title" type="text" maxlength="100" value="${esc(existing?.title || '')}" placeholder="Un título fácil de encontrar" required></label>
      <label class="field full"><span>Etiquetas <em>Separadas por coma</em></span><input id="library-tags" type="text" maxlength="120" value="${esc((existing?.tags || []).join(', '))}" placeholder="finanzas, serie, gancho"></label>
      <label class="field full"><span>Contenido</span><textarea id="library-body" rows="9" maxlength="6000" placeholder="Escribe la idea, el guion completo, el prompt o los detalles de la publicación." required>${esc(existing?.body || '')}</textarea></label>
    </div>
  </form>`;
  openModal({
    title: existing ? 'Editar elemento' : 'Nuevo elemento',
    eyebrow: 'Biblioteca creativa',
    body,
    foot: `<button class="btn btn-ghost" type="button" data-action="close-modal">Cancelar</button><button class="btn btn-primary" type="submit" form="library-form">${icon('i-save')}Guardar</button>`,
    size: 'modal-wide'
  });
  $('#library-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const title = $('#library-title').value.trim();
    const content = $('#library-body').value.trim();
    if (!title || !content) {
      if (!title) $('#library-title').classList.add('is-invalid');
      if (!content) $('#library-body').classList.add('is-invalid');
      toast('Completa el título y el contenido.', 'error');
      return;
    }
    const now = new Date().toISOString();
    const record = {
      id: existing?.id || uid('lib'),
      type: $('#library-type').value,
      title,
      platform: $('#library-platform').value,
      tags: $('#library-tags').value.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 8),
      body: content,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      sample: false
    };
    if (existing) {
      Object.assign(existing, record);
    } else {
      state.library.push(record);
    }
    saveState();
    renderAll();
    closeModal();
    toast(existing ? 'Elemento actualizado.' : 'Elemento guardado en tu biblioteca.');
  });
}

function viewLibraryItem(id) {
  const item = state.library.find((entry) => entry.id === id);
  if (!item) return;
  const meta = LIBRARY_META[item.type] || LIBRARY_META.idea;
  openModal({
    title: item.title,
    eyebrow: meta.label,
    size: 'modal-wide',
    body: `<div class="result-meta">
      <span class="type-badge ${meta.cls}">${icon(meta.icon)}${esc(meta.label)}</span>
      <span class="meta-badge">${platformDot(item.platform || 'General')}${esc(item.platform || 'General')}</span>
      <span class="meta-badge">${icon('i-clock')}${esc(formatDateFull(item.updatedAt || item.createdAt))}</span>
      ${item.sample ? '<span class="meta-badge">Ejemplo</span>' : ''}
    </div>
    ${item.imageUrl ? `<div class="library-avatar-detail"><img src="${item.imageUrl}" alt="${esc(item.title)}"></div>` : ''}
    <div class="text-block" style="font-size:11px">${esc(item.body).replaceAll('\n', '<br>')}</div>
    <div class="tag-list" style="margin-top:14px">${(item.tags || []).map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div>`,
    foot: `<button class="btn btn-danger danger-left" type="button" data-action="delete-library" data-id="${esc(item.id)}">${icon('i-trash')}Eliminar</button>
      <button class="btn btn-ghost" type="button" data-action="duplicate-library" data-id="${esc(item.id)}">${icon('i-duplicate')}Duplicar</button>
      <button class="btn btn-primary" type="button" data-action="edit-library" data-id="${esc(item.id)}">${icon('i-edit')}Editar</button>`
  });
}

function duplicateLibraryItem(id) {
  const item = state.library.find((entry) => entry.id === id);
  if (!item) return;
  const now = new Date().toISOString();
  state.library.push({
    ...item,
    id: uid('lib'),
    title: `${item.title} (copia)`,
    createdAt: now,
    updatedAt: now,
    sample: false
  });
  saveState();
  renderAll();
  closeModal();
  toast('Elemento duplicado.');
}

function deleteLibraryItem(id) {
  const item = state.library.find((entry) => entry.id === id);
  if (!item) return;
  openConfirm({
    title: 'Eliminar elemento',
    message: `Se eliminará “${item.title}” de tu biblioteca. Esta acción no se puede deshacer.`,
    label: 'Eliminar',
    onConfirm: () => {
      state.library = state.library.filter((entry) => entry.id !== id);
      saveState();
      renderAll();
      toast('Elemento eliminado.');
    }
  });
}

function openSettings() {
  const bytes = new Blob([JSON.stringify(state)]).size;
  const kb = Math.max(1, Math.round(bytes / 1024));
  const percent = clamp((bytes / (5 * 1024 * 1024)) * 100, 1, 100);
  const counts = {
    publications: state.publications.length,
    metrics: state.metrics.length,
    incomes: state.incomes.length,
    library: state.library.length,
    avatars: state.avatars.length
  };
  const body = `<div class="settings-profile">
      <span class="profile-avatar${state.profile.avatarUrl ? ' has-image' : ''}">${state.profile.avatarUrl ? `<img src="${esc(state.profile.avatarUrl)}" alt="">` : esc((state.profile.name || 'C').charAt(0).toUpperCase())}</span>
      <div><strong>${esc(state.profile.name || 'Creador')}</strong><span>Espacio local · ${esc(state.profile.country || 'México')}</span></div>
    </div>
    <div class="settings-group">
      <h4>Perfil del creador</h4>
      <label class="field"><span>Nombre visible</span><input id="settings-name" type="text" maxlength="40" value="${esc(state.profile.name || '')}" placeholder="Tu nombre o marca"></label>
    </div>
    <div class="settings-group">
      <h4>Generador de avatares IA</h4>
      <p class="fine-print" style="margin:0 0 9px">El motor principal es Flux Dev en modo gratuito. Si está ocupado, la app intenta un respaldo con Pollinations. Puedes añadir tu propia clave de Pollinations para ese respaldo. La clave se guarda solo en este dispositivo.</p>
      <label class="field"><span>Clave de Pollinations <em>opcional</em></span><input id="settings-pollinations-key" type="password" maxlength="160" value="${esc(state.settings.pollinationsKey || '')}" placeholder="sk_… o pk_…" autocomplete="off" spellcheck="false"></label>
      <p class="fine-print"><a class="text-link" href="https://enter.pollinations.ai" target="_blank" rel="noreferrer">Obtener una clave de respaldo ${icon('i-arrow-up-right')}</a></p>
    </div>
    <div class="settings-group">
      <h4>Almacenamiento de este dispositivo</h4>
      <div class="settings-row"><span>Datos guardados</span><strong>${kb} KB</strong></div>
      <div class="storage-bar"><i style="width:${percent}%"></i></div>
      <div class="settings-row"><span>Registros</span><strong>${counts.publications} publicaciones · ${counts.metrics} métricas</strong></div>
      <div class="settings-row"><span>Monetización</span><strong>${counts.incomes} ${counts.incomes === 1 ? 'ingreso' : 'ingresos'}</strong></div>
      <div class="settings-row"><span>Biblioteca</span><strong>${counts.library} elementos</strong></div>
      <div class="settings-row"><span>Avatares IA</span><strong>${counts.avatars} de 8</strong></div>
      <div class="settings-actions" style="margin-top:10px">
        <button class="btn btn-small btn-ghost" type="button" data-action="export-data">${icon('i-download')}Exportar JSON</button>
        <button class="btn btn-small btn-ghost" type="button" data-action="import-data">${icon('i-upload')}Importar</button>
        <input id="import-file" type="file" accept="application/json,.json" hidden>
      </div>
    </div>
    <div class="settings-group">
      <h4>Aplicación</h4>
      <div class="settings-row"><span>Versión</span><strong>1.0.0 · PWA</strong></div>
      <div class="settings-row"><span>Funcionamiento</span><strong>${storageAvailable ? 'Guardado local' : 'Solo esta sesión'}</strong></div>
      <div class="settings-actions" style="margin-top:10px">
        ${deferredInstallPrompt ? `<button class="btn btn-small btn-primary" type="button" data-action="install-app">${icon('i-download')}Instalar en Android</button>` : ''}
        <button class="btn btn-small btn-ghost" type="button" data-action="show-pwa-help">${icon('i-info')}Instalar manualmente</button>
      </div>
      <p class="fine-print">${icon('i-info')}Si tu navegador no muestra la instalación, abre el menú y elige “Agregar a pantalla principal”.</p>
    </div>
    <div class="settings-group">
      <h4>Datos de demostración</h4>
      <p class="fine-print" style="margin:0 0 9px">Los datos demo son ficticios, están marcados como ejemplo y se pueden quitar sin afectar tus registros.</p>
      ${hasSampleData()
        ? `<button class="btn btn-small btn-ghost" type="button" data-action="clear-sample">${icon('i-trash')}Quitar datos demo</button>`
        : `<button class="btn btn-small btn-ghost" type="button" data-action="load-sample">${icon('i-sparkles')}Cargar datos de ejemplo</button>`}
    </div>
    <div class="settings-group">
      <h4>Eliminar datos</h4>
      <div class="settings-actions">
        <button class="btn btn-small btn-danger" type="button" data-action="clear-data">${icon('i-trash')}Borrar todo mi contenido</button>
      </div>
      <div class="limitations" style="margin-top:10px"><strong>Limitación importante:</strong> esta versión usa el almacenamiento local de tu navegador. Si borras los datos del sitio, usas modo incógnito o cambias de dispositivo, la información no estará disponible. Exporta un respaldo con frecuencia.</div>
    </div>
    <p class="fine-print">No hay conexión con TikTok, Facebook o YouTube. Las publicaciones no se envían automáticamente y las métricas no se descargan solas.</p>`;
  openModal({
    title: 'Ajustes y datos',
    eyebrow: 'Creator IA',
    body,
    foot: `<button class="btn btn-ghost" type="button" data-action="close-modal">Cerrar</button><button class="btn btn-primary" type="button" data-action="save-settings">${icon('i-check')}Guardar nombre</button>`,
    size: 'modal-wide'
  });
  $('#import-file').addEventListener('change', importDataFile);
}

function saveSettings() {
  const input = $('#settings-name');
  if (!input) return;
  const name = input.value.trim().slice(0, 40) || 'Creador';
  const keyInput = $('#settings-pollinations-key');
  state.profile.name = name;
  if (keyInput) state.settings.pollinationsKey = keyInput.value.trim().slice(0, 160);
  saveState();
  renderProfile();
  renderAvatarFromState();
  closeModal();
  toast('Perfil y preferencias actualizados.');
}

function exportData() {
  const payload = {
    app: 'Centro de Control Creator IA',
    exportedAt: new Date().toISOString(),
    version: APP_VERSION,
    data: state
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `creator-ia-respaldo-${todayISO()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast('Respaldo exportado.');
}

function importDataFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const data = parsed.data || parsed;
      if (!data || typeof data !== 'object' || !Array.isArray(data.metrics) || !Array.isArray(data.publications)) {
        throw new Error('Formato no válido');
      }
      openConfirm({
        title: 'Importar respaldo',
        message: 'Se reemplazarán los datos actuales de este dispositivo por el contenido del archivo. Exporta un respaldo antes si quieres conservar lo actual.',
        label: 'Importar datos',
        danger: false,
        onConfirm: () => {
          state = {
            ...defaultState(),
            ...data,
            profile: { ...defaultState().profile, ...(data.profile || {}) },
            settings: { ...defaultState().settings, ...(data.settings || {}) }
          };
          saveState();
          renderAll();
          closeModal();
          toast('Respaldo importado correctamente.');
        }
      });
    } catch {
      toast('El archivo no tiene un formato de respaldo válido.', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  openConfirm({
    title: 'Borrar todo el contenido',
    message: 'Se eliminarán publicaciones, métricas, ingresos, biblioteca y ajustes de este dispositivo. Esta acción no se puede deshacer.',
    label: 'Borrar todo',
    onConfirm: () => {
      state = defaultState();
      saveState();
      renderAll();
      closeModal();
      toast('Todos los datos locales fueron eliminados.');
    }
  });
}

function openIncomeHelp() {
  openModal({
    title: 'Cómo se calculan tus ingresos',
    eyebrow: 'Transparencia de datos',
    body: `<div class="text-block" style="font-size:11px">
      <p><strong style="color:var(--text)">Todo es manual.</strong> Esta versión no se conecta a TikTok, Meta o YouTube, no recibe pagos y no consulta APIs.</p><br>
      <p><strong style="color:var(--text)">Cobrado:</strong> dinero que ya recibiste y puedes verificar. Se suma al KPI de ingresos cobrados.</p><br>
      <p><strong style="color:var(--text)">Pendiente:</strong> dinero acordado o generado, pero que aún no llega a tu cuenta.</p><br>
      <p><strong style="color:var(--text)">Proyectado:</strong> una estimación tuya. No se cuenta como cobrado ni se presenta como resultado real.</p><br>
      <p><strong style="color:var(--text)">Periodos:</strong> los filtros de 30 días, 90 días, 12 meses incluyen registros con fecha dentro del rango. “Todo” muestra el historial completo.</p><br>
      <p><strong style="color:var(--text)">Moneda:</strong> todos los montos se muestran en pesos mexicanos (MXN) y no se convierten automáticamente.</p>
    </div>`,
    foot: `<button class="btn btn-primary" type="button" data-action="close-modal">Entendido</button>`,
    size: 'modal-wide'
  });
}

function showPwaHelp() {
  openModal({
    title: 'Instalar en Android',
    eyebrow: 'Aplicación web progresiva',
    body: `<div class="text-block" style="font-size:11px">
      <p>Abre este sitio en Chrome para Android.</p><br>
      <p>1. Toca el menú de tres puntos.<br>2. Elige <strong style="color:var(--text)">“Agregar a pantalla principal”</strong> o <strong style="color:var(--text)">“Instalar aplicación”</strong>.<br>3. Confirma.</p><br>
      <p>La app se abrirá en modo independiente y seguirá usando el almacenamiento local de este navegador. No requiere conexión automática a tus redes sociales.</p>
    </div>`,
    foot: `<button class="btn btn-primary" type="button" data-action="close-modal">Cerrar</button>`
  });
}

function openGlobalSearch() {
  openModal({
    title: 'Buscar en tu estudio',
    eyebrow: 'Búsqueda global',
    body: `<label class="search-modal-input">${icon('i-search')}<input id="global-search-input" type="search" placeholder="Busca guiones, ideas, prompts o publicaciones…" autocomplete="off"></label>
      <div class="search-results" id="global-search-results"></div>`,
    foot: `<span class="fine-print" style="margin-right:auto">${icon('i-lock')}Busca solo en tus datos locales</span><button class="btn btn-ghost" type="button" data-action="close-modal">Cerrar</button>`,
    size: 'modal-wide'
  });
  renderGlobalSearchResults('');
  const input = $('#global-search-input');
  input.addEventListener('input', () => renderGlobalSearchResults(input.value));
}

function renderGlobalSearchResults(query) {
  const container = $('#global-search-results');
  if (!container) return;
  const normalized = normalizeText(query.trim());
  const library = state.library
    .filter((item) => !normalized || normalizeText(`${item.title} ${item.body} ${(item.tags || []).join(' ')}`).includes(normalized))
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
    .slice(0, 5);
  const publications = state.publications
    .filter((item) => !normalized || normalizeText(`${item.title} ${item.platform} ${item.status}`).includes(normalized))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  const results = [];
  library.forEach((item) => {
    const meta = LIBRARY_META[item.type] || LIBRARY_META.idea;
    results.push(`<button class="search-result" type="button" data-action="search-result" data-kind="library" data-id="${esc(item.id)}">
      <span class="search-icon">${icon(meta.icon)}</span>
      <div><strong>${esc(item.title)}</strong><span>${esc(meta.label)} · ${esc(item.platform || 'General')}</span></div>
      ${icon('i-arrow-up-right')}
    </button>`);
  });
  publications.forEach((item) => {
    results.push(`<button class="search-result" type="button" data-action="search-result" data-kind="publication" data-id="${esc(item.id)}">
      <span class="search-icon">${icon('i-calendar')}</span>
      <div><strong>${esc(item.title)}</strong><span>${esc(item.platform)} · ${esc(formatDateFull(item.date))} · ${esc(item.status)}</span></div>
      ${icon('i-arrow-up-right')}
    </button>`);
  });
  container.innerHTML = results.length ? results.join('') : `<div class="search-empty">${normalized ? 'No encontramos coincidencias en tu biblioteca ni en el calendario.' : 'Aún no hay elementos. Crea una idea o una publicación para encontrarla aquí.'}</div>`;
}
