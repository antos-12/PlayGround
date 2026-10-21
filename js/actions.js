'use strict';

let lastViewportWidth = window.innerWidth;
let resizeRenderTimer = null;

function closeMore() {
  $('#more-sheet').hidden = true;
  $('#more-backdrop').hidden = true;
}

function openMore() {
  $('#more-sheet').hidden = false;
  $('#more-backdrop').hidden = false;
}

function routeFromHash() {
  const route = location.hash.replace('#', '').trim();
  return ROUTE_META[route] ? route : 'inicio';
}

function showRoute(route, { scroll = true } = {}) {
  const next = ROUTE_META[route] ? route : 'inicio';
  const changed = next !== currentRoute;
  currentRoute = next;
  $$('.view').forEach((view) => {
    view.classList.toggle('is-active', view.dataset.view === next);
  });
  $$('.nav-item').forEach((item) => item.classList.toggle('is-active', item.dataset.route === next));
  const primaryRoutes = ['inicio', 'generador', 'calendario', 'analiticas'];
  $$('.bottom-item[data-route]').forEach((item) => item.classList.toggle('is-active', item.dataset.route === next));
  const moreButton = $('.bottom-item[data-action="open-more"]');
  if (moreButton) moreButton.classList.toggle('is-active', !primaryRoutes.includes(next));
  const meta = ROUTE_META[next];
  const title = $('#topbar-title');
  if (title) title.textContent = meta.title;
  document.title = `${meta.doc} · Centro de Control Creator IA`;
  closeMore();
  closeModal();
  renderAll();
  if (changed && scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function navigate(route) {
  if (!ROUTE_META[route]) route = 'inicio';
  if (location.hash !== `#${route}`) {
    location.hash = route;
  }
  showRoute(route);
}

function scrollToOutput(selector) {
  const element = $(selector);
  if (!element) return;
  if (window.matchMedia('(max-width: 1024px)').matches) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function selectedRadio(name) {
  return $(`input[name="${name}"]:checked`)?.value;
}

function submitGenerator(event) {
  event.preventDefault();
  const topicField = $('#gen-topic');
  const topic = topicField.value.trim();
  if (topic.length < 4) {
    topicField.classList.add('is-invalid');
    topicField.focus();
    toast('Describe el tema con al menos 4 caracteres.', 'error');
    return;
  }
  topicField.classList.remove('is-invalid');
  const input = {
    platform: selectedRadio('gen-platform') || 'TikTok',
    niche: $('#gen-niche').value,
    topic,
    duration: Number(selectedRadio('gen-duration') || 30),
    tone: $('#gen-tone').value,
    objective: $('#gen-objective').value,
    audience: $('#gen-audience').value
  };
  const result = generateContent(input);
  state.lastGenerator = result;
  saveState();
  renderGeneratorResult(result);
  renderAll();
  scrollToOutput('#generator-output-panel');
  toast('Contenido generado. Revísalo y ajústalo a tu voz.');
}

function submitAvatar(event) {
  event.preventDefault();
  if (ui.avatarBusy) return;
  if (ui.avatarCooldownUntil > Date.now()) {
    const remaining = Math.ceil((ui.avatarCooldownUntil - Date.now()) / 1000);
    toast(`Espera ${remaining} s para generar otra imagen o conecta tu clave en Ajustes.`, 'error');
    return;
  }
  const nameField = $('#avatar-name');
  const productField = $('#avatar-product');
  const ageField = $('#avatar-age');
  const name = nameField.value.trim();
  const product = productField.value.trim();
  const age = Number(ageField.value);
  nameField.classList.toggle('is-invalid', name.length < 2);
  productField.classList.toggle('is-invalid', product.length < 2);
  ageField.classList.toggle('is-invalid', !Number.isFinite(age) || age < 20 || age > 55);
  if (name.length < 2) {
    toast('Escribe un nombre para tu avatar.', 'error');
    nameField.focus();
    return;
  }
  if (product.length < 2) {
    toast('Escribe el producto que va a vender.', 'error');
    productField.focus();
    return;
  }
  if (!Number.isFinite(age) || age < 20 || age > 55) {
    toast('La edad aparente debe estar entre 20 y 55 años.', 'error');
    ageField.focus();
    return;
  }
  document.activeElement?.blur();
  generateAvatarFromInput({
    name,
    product,
    age,
    niche: $('#avatar-niche').value,
    presentation: $('#avatar-presentation').value,
    look: $('#avatar-look').value,
    personality: $('#avatar-personality').value,
    setting: $('#avatar-setting').value,
    outfit: $('#avatar-outfit').value,
    format: $('#avatar-format').value,
    notes: $('#avatar-notes').value.trim()
  });
}

function submitStudio(event) {
  event.preventDefault();
  const topicField = $('#studio-topic');
  const topic = topicField.value.trim();
  if (topic.length < 4) {
    topicField.classList.add('is-invalid');
    topicField.focus();
    toast('Describe el concepto del video con al menos 4 caracteres.', 'error');
    return;
  }
  topicField.classList.remove('is-invalid');
  const input = {
    topic,
    platform: $('#studio-platform').value,
    duration: Number($('#studio-duration').value),
    style: $('#studio-style').value,
    format: $('#studio-format').value,
    art: $('#studio-art').value.trim() || 'Fondo oscuro, luz suave, acento verde lima'
  };
  const result = generateStoryboard(input);
  state.lastStoryboard = result;
  saveState();
  renderStoryboardResult(result);
  renderAll();
  scrollToOutput('.studio-output-panel');
  toast('Storyboard creado con prompts de animación.');
}

function generatorBody(result) {
  return `PLATAFORMA: ${result.input.platform}
NICHO: ${result.input.niche}
DURACIÓN: ${result.input.duration} s
OBJETIVO: ${result.input.objective}
TONO: ${result.input.tone}

GANCHO
${result.hook}

GANCHOS ALTERNATIVOS
${result.hooks.map((hook, index) => `${index + 1}. ${hook}`).join('\n')}

GUION
${result.script.map((beat) => `[${beat.time}] ${beat.label}\n${beat.text}\nNota visual: ${beat.note}`).join('\n\n')}

TÍTULOS
${result.titles.map((title, index) => `${index + 1}. ${title}`).join('\n')}

ESCENAS
${result.scenes.map((scene) => `${scene.number}. ${scene.title} (${scene.time})\n${scene.description}`).join('\n\n')}

DESCRIPCIÓN
${result.description}

HASHTAGS
${result.hashtags.map((tag) => `#${tag}`).join(' ')}`;
}

function saveGeneratorToLibrary() {
  const result = state.lastGenerator;
  if (!result) return;
  const now = new Date().toISOString();
  state.library.unshift({
    id: uid('lib'),
    type: 'guion',
    title: result.titles[0],
    platform: result.input.platform,
    tags: [result.input.niche, result.input.tone, result.input.objective],
    body: generatorBody(result),
    createdAt: now,
    updatedAt: now,
    sample: false
  });
  saveState();
  renderAll();
  toast('Guion guardado en la biblioteca.');
}

function scheduleGenerator() {
  const result = state.lastGenerator;
  if (!result) return;
  openPublicationModal({
    title: result.titles[0],
    platform: result.input.platform,
    date: addDaysISO(todayISO(), 2),
    status: 'Programado'
  });
}

function copyGenerator() {
  const result = state.lastGenerator;
  if (!result) return;
  copyText(generatorBody(result), 'Contenido completo copiado.');
}

function storyboardBody(result) {
  return `STORYBOARD · ${result.input.topic}
Plataforma: ${result.input.platform}
Duración: ${result.input.duration} s
Estilo: ${result.input.style}
Formato: ${result.input.format}
Dirección de arte: ${result.input.art}

PROMPT MAESTRO
${result.masterPrompt}

${result.scenes.map((scene) => `ESCENA ${scene.number} · ${scene.title} · ${scene.time}
Fotograma inicial: ${scene.startFrame}
Fotograma final: ${scene.endFrame}
Acción: ${scene.action}
Cámara: ${scene.camera}
Encuadre: ${scene.framing}
Transición: ${scene.transition}
Prompt de animación: ${scene.animationPrompt}`).join('\n\n')}`;
}

function saveStoryboardToLibrary() {
  const result = state.lastStoryboard;
  if (!result) return;
  const now = new Date().toISOString();
  state.library.unshift({
    id: uid('lib'),
    type: 'prompt',
    title: `Storyboard · ${compactTitle(result.input.topic, 60)}`,
    platform: result.input.platform,
    tags: ['storyboard', result.input.style, result.input.format],
    body: storyboardBody(result),
    createdAt: now,
    updatedAt: now,
    sample: false
  });
  saveState();
  renderAll();
  toast('Prompts del storyboard guardados en la biblioteca.');
}

function copyStoryboard() {
  const result = state.lastStoryboard;
  if (!result) return;
  copyText(storyboardBody(result), 'Storyboard y prompts copiados.');
}

function handleAction(action, element) {
  const id = element?.dataset?.id || '';
  switch (action) {
    case 'open-settings':
      closeMore();
      openSettings();
      break;
    case 'global-search':
      closeMore();
      openGlobalSearch();
      break;
    case 'open-more':
      openMore();
      break;
    case 'close-more':
      closeMore();
      break;
    case 'close-modal':
      closeModal();
      break;
    case 'register-metric':
      openMetricModal();
      break;
    case 'add-income':
      openIncomeModal();
      break;
    case 'open-calendar-new':
      openPublicationModal();
      break;
    case 'calendar-today':
      ui.calendarDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      renderCalendar();
      break;
    case 'prev-month':
      ui.calendarDate = new Date(ui.calendarDate.getFullYear(), ui.calendarDate.getMonth() - 1, 1);
      renderCalendar();
      break;
    case 'next-month':
      ui.calendarDate = new Date(ui.calendarDate.getFullYear(), ui.calendarDate.getMonth() + 1, 1);
      renderCalendar();
      break;
    case 'open-day':
      openDayAgenda(element.dataset.date);
      break;
    case 'new-publication-for-day':
      openPublicationModal({ date: element.dataset.date });
      break;
    case 'edit-publication':
      openPublicationModal({ id });
      break;
    case 'delete-metric': {
      const metric = state.metrics.find((item) => item.id === id);
      if (!metric) return;
      openConfirm({
        title: 'Eliminar métrica',
        message: `Se eliminará el registro de “${metric.title}” del ${formatDateFull(metric.date)}.`,
        label: 'Eliminar',
        onConfirm: () => {
          state.metrics = state.metrics.filter((item) => item.id !== id);
          saveState();
          renderAll();
          toast('Registro eliminado.');
        }
      });
      break;
    }
    case 'edit-metric':
      openMetricModal(id);
      break;
    case 'delete-income': {
      const income = state.incomes.find((item) => item.id === id);
      if (!income) return;
      openConfirm({
        title: 'Eliminar ingreso',
        message: `Se eliminará “${income.concept}” por ${formatMoney(income.amount)}.`,
        label: 'Eliminar',
        onConfirm: () => {
          state.incomes = state.incomes.filter((item) => item.id !== id);
          saveState();
          renderAll();
          toast('Ingreso eliminado.');
        }
      });
      break;
    }
    case 'edit-income':
      openIncomeModal(id);
      break;
    case 'copy-generator':
      copyGenerator();
      break;
    case 'save-generator':
      saveGeneratorToLibrary();
      break;
    case 'schedule-generator':
      scheduleGenerator();
      break;
    case 'copy-description':
      if (state.lastGenerator) copyText(state.lastGenerator.description, 'Descripción copiada.');
      break;
    case 'copy-storyboard':
      copyStoryboard();
      break;
    case 'copy-avatar-kit':
      copyAvatarKit();
      break;
    case 'download-avatar':
      downloadAvatarImage(id);
      break;
    case 'save-avatar-library':
      saveAvatarToLibrary();
      break;
    case 'use-avatar-profile':
      useAvatarAsProfile();
      break;
    case 'select-avatar':
      selectAvatar(id);
      break;
    case 'delete-avatar':
      deleteAvatar(id);
      break;
    case 'retry-avatar':
    case 'variate-avatar':
      $('#avatar-form')?.requestSubmit();
      break;
    case 'save-storyboard':
      saveStoryboardToLibrary();
      break;
    case 'copy-scene': {
      const index = Number(element.dataset.index);
      const scene = state.lastStoryboard?.scenes?.[index];
      if (scene) copyText(scene.animationPrompt, `Prompt de la escena ${scene.number} copiado.`);
      break;
    }
    case 'new-library':
      openLibraryModal('', 'idea');
      break;
    case 'view-library':
      viewLibraryItem(id);
      break;
    case 'edit-library':
      closeModal();
      openLibraryModal(id);
      break;
    case 'duplicate-library':
      duplicateLibraryItem(id);
      break;
    case 'delete-library':
      deleteLibraryItem(id);
      break;
    case 'clear-library-filters':
      ui.librarySearch = '';
      ui.libraryType = 'all';
      ui.libraryPlatform = 'all';
      ui.librarySort = 'recent';
      $('#library-search').value = '';
      $('#library-platform-filter').value = 'all';
      $('#library-sort').value = 'recent';
      renderLibrary();
      break;
    case 'load-sample':
      if (countUserRecords() > 0) {
        openConfirm({
          title: 'Cargar datos de ejemplo',
          message: 'Se agregarán registros ficticios marcados como ejemplo junto a tus datos actuales. Podrás quitarlos después sin borrar tu información.',
          label: 'Cargar demo',
          danger: false,
          onConfirm: applySampleData
        });
      } else {
        applySampleData();
        closeModal();
      }
      break;
    case 'clear-sample':
      clearSampleData();
      break;
    case 'export-data':
      exportData();
      break;
    case 'import-data':
      $('#import-file')?.click();
      break;
    case 'clear-data':
      clearAllData();
      break;
    case 'save-settings':
      saveSettings();
      break;
    case 'income-help':
      openIncomeHelp();
      break;
    case 'show-pwa-help':
      showPwaHelp();
      break;
    case 'install-app':
      installApp();
      break;
    case 'go-generator':
      navigate('generador');
      break;
    case 'search-result':
      handleSearchResult(element.dataset.kind, id);
      break;
    default:
      break;
  }
}

function handleSearchResult(kind, id) {
  closeModal();
  if (kind === 'library') {
    navigate('biblioteca');
    window.setTimeout(() => viewLibraryItem(id), 120);
  } else if (kind === 'publication') {
    navigate('calendario');
    window.setTimeout(() => openPublicationModal({ id }), 120);
  }
}

async function installApp() {
  if (!deferredInstallPrompt) {
    showPwaHelp();
    return;
  }
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  if (choice.outcome === 'accepted') toast('Aplicación instalada.');
  deferredInstallPrompt = null;
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const routeElement = event.target.closest('[data-route]');
    if (routeElement) {
      event.preventDefault();
      navigate(routeElement.dataset.route);
      return;
    }
    const actionElement = event.target.closest('[data-action]');
    if (actionElement) {
      const action = actionElement.dataset.action;
      if (action === 'open-day' && event.target.closest('[data-action="edit-publication"]')) return;
      event.preventDefault();
      handleAction(action, actionElement);
    }
  });

  $('#modal-backdrop').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeModal();
  });
  $('#more-backdrop').addEventListener('click', closeMore);
  $('#generator-form').addEventListener('submit', submitGenerator);
  $('#avatar-form').addEventListener('submit', submitAvatar);
  $('#studio-form').addEventListener('submit', submitStudio);

  $('#gen-topic').addEventListener('input', (event) => {
    const count = $('#gen-topic-count');
    if (count) count.textContent = `${event.target.value.length}/140`;
  });

  $$('input[name="analytics-range"]').forEach((input) => {
    input.addEventListener('change', () => {
      ui.analyticsRange = Number(input.value);
      renderAnalytics();
    });
  });
  $('#analytics-platform-filter').addEventListener('change', (event) => {
    ui.analyticsPlatform = event.target.value;
    renderAnalytics();
  });

  $$('input[name="income-range"]').forEach((input) => {
    input.addEventListener('change', () => {
      ui.incomeRange = input.value === 'all' ? 'all' : Number(input.value);
      renderMonetization();
    });
  });

  $('#calendar-platform-filter').addEventListener('change', (event) => {
    ui.calendarPlatform = event.target.value;
    renderCalendar();
  });
  $('#calendar-status-filter').addEventListener('change', (event) => {
    ui.calendarStatus = event.target.value;
    renderCalendar();
  });

  $('#calendar-grid').addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.calendar-cell')) {
      event.preventDefault();
      openDayAgenda(event.target.dataset.date);
    }
  });

  $$('#library-tabs button').forEach((button) => {
    button.addEventListener('click', () => {
      ui.libraryType = button.dataset.libraryType;
      renderLibrary();
    });
  });
  $('#library-search').addEventListener('input', (event) => {
    ui.librarySearch = event.target.value;
    renderLibrary();
  });
  $('#library-platform-filter').addEventListener('change', (event) => {
    ui.libraryPlatform = event.target.value;
    renderLibrary();
  });
  $('#library-sort').addEventListener('change', (event) => {
    ui.librarySort = event.target.value;
    renderLibrary();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!$('#modal-backdrop').hidden) closeModal();
      else if (!$('#more-sheet').hidden) closeMore();
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openGlobalSearch();
    }
  });

  window.addEventListener('hashchange', () => showRoute(routeFromHash()));
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    toast('Aplicación instalada en este dispositivo.');
  });
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastViewportWidth) < 40) return;
    lastViewportWidth = window.innerWidth;
    window.clearTimeout(resizeRenderTimer);
    resizeRenderTimer = window.setTimeout(renderAll, 180);
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
  navigator.serviceWorker.register('./sw.js').catch(() => undefined);
}

function init() {
  bindEvents();
  fillAvatarForm(state.lastAvatar?.input);
  const route = routeFromHash();
  if (!location.hash) history.replaceState(null, '', '#inicio');
  showRoute(route, { scroll: false });
  registerServiceWorker();
}

init();
