'use strict';

const STUDIO_IMAGE_WIDTH = 864;
const STUDIO_IMAGE_HEIGHT = 1536;

function studioProviderHealth() {
  return ui.studioProvider || {
    ok: false,
    configured: false,
    provider: 'desconocido',
    model: '',
    reference: false,
    mode: 'unknown',
    message: 'Comprobando el backend de imágenes…',
    setup: 'Inicia la app con `node server.mjs` para habilitar la generación real.'
  };
}

function studioProviderLabel() {
  const health = studioProviderHealth();
  if (!health.configured) return 'Imágenes IA sin configurar';
  return `Imágenes IA · ${health.model || health.provider}`;
}

function studioProviderSetupText() {
  const health = studioProviderHealth();
  if (health.configured) return health.message || '';
  return health.setup || health.message || 'Configura el backend de imágenes en el servidor.';
}

function renderStudioProviderStatus() {
  const health = studioProviderHealth();
  const label = $('#studio-engine-label');
  const badge = $('#studio-engine-badge');
  const note = $('#studio-engine-note');
  if (label) label.textContent = studioProviderLabel();
  if (badge) badge.classList.toggle('is-offline', !health.configured);
  if (note) {
    const message = health.configured
      ? `${health.message} ${health.reference ? 'El proveedor puede usar imágenes de referencia.' : 'La continuidad se mantiene con la ficha maestra.'}`
      : `${health.message} ${health.setup || ''}`;
    note.innerHTML = `${icon('i-info')}${esc(message)}`;
  }
  const settingsStatus = $('#settings-studio-status');
  if (settingsStatus) {
    settingsStatus.innerHTML = health.configured
      ? `<strong>${esc(health.model || health.provider)}</strong> · ${esc(health.message)}${health.setup ? `<br><span>${esc(health.setup)}</span>` : ''}`
      : `<strong>Sin configurar</strong> · ${esc(health.message)}<br><span>${esc(health.setup || '')}</span>`;
  }
}

async function loadStudioProvider() {
  if (ui.studioProviderLoading) return;
  ui.studioProviderLoading = true;
  try {
    const response = await fetch('/api/studio/health', { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Backend ${response.status}`);
    ui.studioProvider = await response.json();
  } catch {
    ui.studioProvider = {
      ok: false,
      configured: false,
      provider: 'backend',
      model: '',
      reference: false,
      mode: 'unavailable',
      message: 'No se pudo conectar con el backend de imágenes.',
      setup: 'Sirve la aplicación con `node server.mjs` y revisa que el endpoint /api/studio/health responda.'
    };
  } finally {
    ui.studioProviderLoading = false;
  }
  renderStudioProviderStatus();
  if (state.lastStoryboard && !ui.studioBusy) renderStoryboardResult(state.lastStoryboard, false);
}

function studioSceneById(id) {
  return state.lastStoryboard?.scenes?.find((scene) => scene.id === id) || null;
}

function studioTotalDuration(result) {
  return (result?.scenes || []).reduce((total, scene) => total + (Number(scene.duration) || 0), 0);
}

function studioFormatTime(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  return Number.isInteger(value) ? `${value} s` : `${value.toFixed(1)} s`;
}

function studioFormatRange(start, duration) {
  return `${start}–${start + duration} s`;
}

function studioRecomputeTimeline(result) {
  let cursor = 0;
  result.scenes.forEach((scene) => {
    scene.duration = Math.max(1, Math.round(Number(scene.duration) || 1));
    scene.time = studioFormatRange(cursor, scene.duration);
    cursor += scene.duration;
  });
  result.totalDuration = cursor;
  return cursor;
}

function studioAllocateDurations(target, count) {
  const ratios = count === 4 ? [0.16, 0.27, 0.33, 0.24] : [0.12, 0.18, 0.24, 0.24, 0.22];
  const durations = ratios.slice(0, count).map((ratio) => Math.max(1, Math.round(target * ratio)));
  let difference = target - durations.reduce((total, value) => total + value, 0);
  let index = durations.length - 1;
  while (difference !== 0) {
    if (difference > 0) {
      durations[index] += 1;
      difference -= 1;
    } else if (durations[index] > 1) {
      durations[index] -= 1;
      difference += 1;
    } else {
      index = (index - 1 + durations.length) % durations.length;
    }
  }
  return durations;
}

function studioMasterPrompt(input, style) {
  return `Vertical 9:16 cinematic photorealistic still for ${input.platform}. Story: "${input.topic}". Master continuity sheet — character: ${input.cast}. Wardrobe: ${input.wardrobe}. Location: ${input.location}. Lighting: ${input.lighting}. Visual style: ${input.style}, ${style.palette}, ${style.texture}, ${style.camera}, ${style.motion}. Art direction: ${input.art}. Keep the same identity, clothing, set and light in every frame. No text overlays, no logos, no watermarks.`;
}

function studioStartPrompt(result, scene) {
  return `${result.masterPrompt} Scene ${scene.number} start frame: ${scene.description} Framing: ${scene.framing}. Action begins: ${scene.action} Camera: ${scene.camera}. Photorealistic vertical 9:16 still, natural skin texture, realistic eyes and hair, no text, no logo, no watermark.`;
}

function studioEndPrompt(result, scene) {
  return `${result.masterPrompt} Scene ${scene.number} end frame after the action: ${scene.action} The movement or beat is complete, composition is slightly more closed and clean. Same character, wardrobe, location and light. Photorealistic vertical 9:16 still, natural skin texture, no text, no logo, no watermark.`;
}

function studioAnimationPrompt(result, scene) {
  return `Vertical 9:16, ${scene.duration}s. ${scene.camera}. ${scene.action} Transition: ${scene.transition}. Keep ${result.input.cast} and the wardrobe, location and lighting from the master sheet consistent. Subtle realistic motion, no morphing, no text, no logo, no watermark.`;
}

function generateStoryboard(input) {
  const style = STYLE_DATA[input.style] || STYLE_DATA['Cinemático'];
  const beats = FORMAT_BEATS[input.format] || FORMAT_BEATS['Tutorial paso a paso'];
  const sceneCount = input.duration <= 15 ? 4 : 5;
  const selectedBeats = sceneCount === 4 ? [beats[0], beats[1], beats[2], beats[4]] : beats.slice(0, sceneCount);
  const durations = studioAllocateDurations(input.duration, sceneCount);
  const framings = ['Primer plano vertical', 'Plano medio', 'Plano detalle', 'Plano medio con movimiento', 'Plano general del resultado'];
  const cameras = ['Acercamiento lento', 'Paneo lateral suave', 'Seguimiento a mano', 'Órbita controlada', 'Alejamiento lento'];
  const transitions = ['Corte directo al compás', 'Transición por movimiento', 'Match cut', 'Fundido corto', 'Corte limpio al CTA'];
  const topic = input.topic.trim().replace(/[.!?]+$/, '');
  const topicLower = topic.charAt(0).toLowerCase() + topic.slice(1);
  let cursor = 0;
  const masterPrompt = studioMasterPrompt(input, style);
  const scenes = selectedBeats.map((beat, index) => {
    const duration = durations[index];
    const framing = framings[index] || framings[framings.length - 1];
    const camera = cameras[index] || cameras[cameras.length - 1];
    const transition = transitions[index] || transitions[transitions.length - 1];
    const isFirst = index === 0;
    const isLast = index === selectedBeats.length - 1;
    const description = isFirst
      ? `Apertura visual de ${topicLower}: ${input.cast} entra en cuadro en ${input.location.toLowerCase()}, con ${input.lighting.toLowerCase()}.`
      : isLast
        ? `Cierre visual de ${topicLower}: el resultado se muestra con claridad en ${input.location.toLowerCase()}, manteniendo ${input.wardrobe.toLowerCase()}.`
        : `Escena de apoyo para ${topicLower}: ${beat.toLowerCase()} se explica con un recurso visual concreto en ${input.location.toLowerCase()}.`;
    const action = isFirst
      ? `Presenta el gancho visual de ${topicLower} mirando a cámara y comienza el gesto principal.`
      : isLast
        ? 'Completa el gesto final, muestra el resultado y deja aire para el CTA.'
        : `Ejecuta el paso “${beat.toLowerCase()}” con un movimiento claro y controlado.`;
    const scene = {
      id: uid('scene'),
      number: index + 1,
      title: beat,
      time: studioFormatRange(cursor, duration),
      duration,
      description,
      framing,
      action,
      camera,
      transition,
      startPrompt: '',
      endPrompt: '',
      animationPrompt: '',
      startImage: null,
      startStatus: 'idle',
      startError: '',
      startReference: false,
      startProvider: '',
      endImage: null,
      endStatus: 'idle',
      endError: '',
      endReference: false,
      endProvider: ''
    };
    scene.startPrompt = studioStartPrompt({ masterPrompt, input }, scene);
    scene.endPrompt = studioEndPrompt({ masterPrompt, input }, scene);
    scene.animationPrompt = studioAnimationPrompt({ input }, scene);
    cursor += duration;
    return scene;
  });
  const result = {
    id: uid('story'),
    createdAt: new Date().toISOString(),
    input,
    style,
    master: {
      cast: input.cast,
      wardrobe: input.wardrobe,
      location: input.location,
      lighting: input.lighting,
      art: input.art,
      style: input.style,
      palette: style.palette,
      texture: style.texture
    },
    masterPrompt,
    promptsUpdatedAt: new Date().toISOString(),
    totalDuration: cursor,
    scenes
  };
  scenes.forEach((scene) => {
    scene.animationPrompt = studioAnimationPrompt(result, scene);
  });
  return result;
}

function studioImageStats(result) {
  const scenes = result?.scenes || [];
  const total = scenes.length * 2;
  let ready = 0;
  scenes.forEach((scene) => {
    if (scene.startImage) ready += 1;
    if (scene.endImage) ready += 1;
  });
  return { total, ready, pending: total - ready, scenes: scenes.length };
}

function studioFrameMarkup(result, scene, kind) {
  const isStart = kind === 'start';
  const label = isStart ? 'Inicio' : 'Final';
  const image = isStart ? scene.startImage : scene.endImage;
  const status = isStart ? scene.startStatus : scene.endStatus;
  const error = isStart ? scene.startError : scene.endError;
  const prompt = isStart ? scene.startPrompt : scene.endPrompt;
  const reference = isStart ? scene.startReference : scene.endReference;
  const busy = ui.studioBusy || status === 'loading';
  const provider = studioProviderHealth();
  const disabled = busy || !provider.ok || !prompt ? 'disabled' : '';
  const actionLabel = image ? 'Regenerar' : 'Generar';
  const safeId = esc(scene.id);
  const kindLabel = isStart ? 'inicial' : 'final';
  const statusMarkup = status === 'loading'
    ? `<div class="frame-status is-loading"><span class="mini-spinner"></span><strong>Generando ${kindLabel}…</strong><small>El backend está creando la imagen.</small></div>`
    : status === 'error'
      ? `<div class="frame-status is-error"><strong>No se pudo generar</strong><small>${esc((error || 'Error del proveedor.').slice(0, 180))}</small><button type="button" data-action="retry-scene-image" data-id="${safeId}" data-kind="${kind}">Reintentar</button></div>`
      : '';
  return `<div class="frame-block ${isStart ? '' : 'end'} ${image ? 'has-image' : ''}">
    <div class="frame-visual">
      ${image ? `<img src="${esc(image)}" alt="Fotograma ${kindLabel} de la escena ${scene.number}: ${esc(scene.title)}">` : ''}
      <span class="frame-label">${label}</span>
      <span class="frame-ratio">9:16</span>
      ${statusMarkup}
    </div>
    <div class="frame-caption">
      <strong>Imagen ${kindLabel}</strong>
      <span>${image ? (reference ? 'Referencia aplicada' : 'Lista') : prompt ? 'Pendiente' : 'Opcional'}</span>
    </div>
    <div class="frame-actions">
      <button class="btn btn-mini btn-ghost" type="button" data-action="generate-scene-image" data-id="${safeId}" data-kind="${kind}" ${disabled}>${icon('i-image')}${actionLabel}</button>
      ${image ? `<button class="btn btn-mini btn-ghost" type="button" data-action="download-scene-image" data-id="${safeId}" data-kind="${kind}" aria-label="Descargar imagen ${kindLabel}">${icon('i-download')}</button>` : ''}
      <button class="btn btn-mini btn-ghost" type="button" data-action="copy-scene-prompt" data-id="${safeId}" data-kind="${kind}" ${prompt ? '' : 'disabled'}>${icon('i-copy')}</button>
    </div>
    <details class="frame-prompt">
      <summary>Prompt ${kindLabel}</summary>
      <p>${esc(prompt || 'Sin prompt final para esta escena.')}</p>
      <button type="button" data-action="copy-scene-prompt" data-id="${safeId}" data-kind="${kind}" ${prompt ? '' : 'disabled'}>${icon('i-copy')}Copiar prompt ${kindLabel}</button>
    </details>
  </div>`;
}

function storyboardSceneMarkup(result, scene) {
  const busy = ui.studioBusy || scene.startStatus === 'loading' || scene.endStatus === 'loading';
  const provider = studioProviderHealth();
  return `<article class="storyboard-card" data-scene-id="${esc(scene.id)}">
    <div class="storyboard-top">
      <span class="scene-number">${scene.number}</span>
      <strong>${esc(scene.title)}</strong>
      <span class="scene-time">${esc(scene.time)}</span>
      <label class="scene-duration"><span>Duración</span><input type="number" min="1" max="30" step="1" value="${scene.duration}" data-scene-duration="${esc(scene.id)}" aria-label="Duración de la escena ${scene.number} en segundos"><span>s</span></label>
    </div>
    <p class="scene-description">${esc(scene.description)}</p>
    <div class="storyboard-frames">
      ${studioFrameMarkup(result, scene, 'start')}
      ${studioFrameMarkup(result, scene, 'end')}
    </div>
    <div class="storyboard-details">
      <div class="storyboard-detail"><span>Acción</span><p>${esc(scene.action)}</p></div>
      <div class="storyboard-detail"><span>Cámara</span><p>${esc(scene.camera)}</p></div>
      <div class="storyboard-detail"><span>Encuadre</span><p>${esc(scene.framing)}</p></div>
      <div class="storyboard-detail"><span>Transición</span><p>${esc(scene.transition)}</p></div>
    </div>
    <div class="prompt-box animation-prompt-box">
      <div class="prompt-box-head">
        <small>${icon('i-wand')}Prompt de animación independiente</small>
        <div class="prompt-box-actions">
          <button type="button" data-action="regenerate-scene-animation" data-id="${esc(scene.id)}" aria-label="Actualizar prompt de animación de la escena ${scene.number}">${icon('i-refresh')}Actualizar</button>
          <button type="button" data-action="copy-scene-prompt" data-id="${esc(scene.id)}" data-kind="animation" aria-label="Copiar prompt de animación de la escena ${scene.number}">${icon('i-copy')}</button>
        </div>
      </div>
      <p>${esc(scene.animationPrompt)}</p>
    </div>
    <div class="scene-continuity ${provider.reference ? 'has-reference' : ''}">
      ${icon(provider.reference ? 'i-layers' : 'i-lock')}
      ${provider.reference
        ? `El proveedor puede usar la imagen inicial como referencia para el final${scene.number > 1 ? ' y la escena anterior para el inicio' : ''}.`
        : 'Continuidad asegurada por la ficha maestra y los prompts; este proveedor no acepta imágenes de referencia.'}
    </div>
    ${busy ? '<span class="scene-busy-note">Trabajo de imagen en curso…</span>' : ''}
  </article>`;
}

function storyboardResultMarkup(result) {
  const total = studioTotalDuration(result);
  const stats = studioImageStats(result);
  const provider = studioProviderHealth();
  const progressDone = ui.studioProgress.total ? ui.studioProgress.done : stats.ready;
  const progressTotal = ui.studioProgress.total || stats.total;
  const progressPercent = progressTotal ? Math.round((progressDone / progressTotal) * 100) : 0;
  const progressLabel = ui.studioBusy
    ? ui.studioProgress.label || 'Generando imágenes…'
    : stats.ready === stats.total && stats.total
      ? 'Todas las imágenes están listas.'
      : `${stats.ready} de ${stats.total} imágenes listas.`;
  const generateDisabled = ui.studioBusy || !provider.ok || !stats.pending ? 'disabled' : '';
  return `<div class="studio-command">
    <div class="studio-command-copy">
      <div class="studio-command-head"><span class="eyebrow">Galería del storyboard</span><span class="studio-command-status">${esc(provider.model || 'Sin motor')}</span></div>
      <strong>${esc(progressLabel)}</strong>
      <div class="studio-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${progressTotal || 0}" aria-valuenow="${progressDone}" aria-label="Progreso de imágenes"><i style="width:${progressPercent}%"></i></div>
      <small>${provider.ok ? (provider.reference ? 'Referencias visuales activas en el proveedor.' : 'Continuidad por ficha maestra. El proveedor actual no acepta referencias.') : esc(studioProviderSetupText())}</small>
    </div>
    <div class="studio-command-actions">
      <button class="btn btn-small btn-primary" type="button" data-action="generate-studio-images" ${generateDisabled}>${icon('i-image')}${ui.studioBusy ? 'Generando…' : 'Generar todas las imágenes'}</button>
      <button class="btn btn-small btn-ghost" type="button" data-action="generate-animation-prompts" ${ui.studioBusy ? 'disabled' : ''}>${icon('i-wand')}Generar prompts</button>
    </div>
  </div>
  <div class="result-meta">
    <span class="meta-badge">${platformDot(result.input.platform)}${esc(result.input.platform)}</span>
    <span class="meta-badge">${icon('i-clock')}${esc(total)} s calculados</span>
    <span class="meta-badge">${icon('i-target')}${esc(result.input.duration)} s objetivo</span>
    <span class="meta-badge">${icon('i-image')}${esc(result.input.style)}</span>
    <span class="meta-badge">${icon('i-layers')}${result.scenes.length} escenas</span>
  </div>
  <div class="studio-master-summary">
    <div class="studio-master-summary-head"><h4>${icon('i-lock')}Ficha maestra de continuidad</h4><span>${provider.reference ? 'Con referencias' : 'Prompt persistente'}</span></div>
    <div class="studio-master-grid">
      <div><span>Personaje</span><p>${esc(result.master.cast)}</p></div>
      <div><span>Vestuario</span><p>${esc(result.master.wardrobe)}</p></div>
      <div><span>Escenario</span><p>${esc(result.master.location)}</p></div>
      <div><span>Iluminación</span><p>${esc(result.master.lighting)}</p></div>
    </div>
    <details class="master-prompt-details">
      <summary>Prompt maestro usado por todas las escenas</summary>
      <p>${esc(result.masterPrompt)}</p>
      <button type="button" data-action="copy-master-prompt">${icon('i-copy')}Copiar prompt maestro</button>
    </details>
  </div>
  <div class="storyboard-list">${result.scenes.map((scene) => storyboardSceneMarkup(result, scene)).join('')}</div>
  <div class="studio-export-row">
    <span>${icon('i-lock')}Las imágenes se guardan como data URLs comprimidas en este dispositivo.</span>
    <div class="studio-export-actions">
      <button class="btn btn-small btn-ghost" type="button" data-action="download-studio-images" ${stats.ready ? '' : 'disabled'}>${icon('i-image')}Descargar imágenes (${stats.ready})</button>
      <button class="btn btn-small btn-ghost" type="button" data-action="export-studio">${icon('i-download')}Exportar proyecto</button>
    </div>
  </div>`;
}

function renderStoryboardResult(result, scroll = true) {
  const output = $('#studio-output');
  const title = $('#studio-result-title');
  if (!output || !result) return;
  const previousScroll = output.scrollTop;
  output.classList.add('has-result');
  output.innerHTML = storyboardResultMarkup(result);
  if (title) title.textContent = compactTitle(result.input.topic, 72);
  setStudioActions(true);
  renderStudioProviderStatus();
  if (scroll) output.scrollTop = 0;
  else output.scrollTop = previousScroll;
}

function studioSetSceneStatus(scene, kind, status, error = '') {
  if (kind === 'start') {
    scene.startStatus = status;
    scene.startError = error;
  } else {
    scene.endStatus = status;
    scene.endError = error;
  }
}

function studioReferenceFor(result, scene, kind) {
  const provider = studioProviderHealth();
  if (!provider.reference) return null;
  if (kind === 'end') return scene.startImage || null;
  const index = result.scenes.findIndex((item) => item.id === scene.id);
  return index > 0 ? result.scenes[index - 1].startImage || null : null;
}

async function studioRequestImage(prompt, referenceImage) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 200000);
  try {
    const body = { prompt, ratio: '9:16' };
    if (referenceImage) body.referenceImage = referenceImage;
    const response = await fetch('/api/studio/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error || `El backend respondió ${response.status}.`);
    if (!payload?.image) throw new Error('El backend no devolvió una imagen.');
    return payload;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('La generación tardó demasiado. Inténtalo de nuevo.');
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

function studioLoadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('La imagen del proveedor no se pudo cargar.'));
    image.src = src;
  });
}

async function studioNormalizeImage(src, trimBottom = 0) {
  const image = await studioLoadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = STUDIO_IMAGE_WIDTH;
  canvas.height = STUDIO_IMAGE_HEIGHT;
  const context = canvas.getContext('2d');
  const targetRatio = STUDIO_IMAGE_WIDTH / STUDIO_IMAGE_HEIGHT;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight * (1 - trimBottom);
  let sx = 0;
  let sy = 0;
  if (sw / sh > targetRatio) {
    sw = sh * targetRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = sw / targetRatio;
    sy = 0;
  }
  context.fillStyle = '#0a0d13';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

async function requestStudioSceneImage(sceneId, kind, options = {}) {
  const result = state.lastStoryboard;
  const scene = studioSceneById(sceneId);
  if (!result || !scene) return false;
  const isStart = kind === 'start';
  const prompt = isStart ? scene.startPrompt : scene.endPrompt;
  if (!prompt) throw new Error('Esta escena no tiene prompt para esa imagen.');
  const provider = studioProviderHealth();
  if (!provider.ok) throw new Error(studioProviderSetupText());
  studioSetSceneStatus(scene, kind, 'loading');
  scene[isStart ? 'startReference' : 'endReference'] = false;
  if (!options.silentRender) renderStoryboardResult(result, false);
  try {
    const referenceImage = studioReferenceFor(result, scene, kind);
    const payload = await studioRequestImage(prompt, referenceImage);
    const normalized = await studioNormalizeImage(payload.image, payload.provider === 'pollinations' ? 0.06 : 0);
    if (kind === 'start') scene.startImage = normalized;
    else scene.endImage = normalized;
    scene[isStart ? 'startReference' : 'endReference'] = Boolean(payload.referenceApplied);
    scene[isStart ? 'startProvider' : 'endProvider'] = payload.provider || '';
    studioSetSceneStatus(scene, kind, 'done');
    saveState();
    return true;
  } catch (error) {
    studioSetSceneStatus(scene, kind, 'error', error.message || 'Error del proveedor.');
    saveState();
    if (options.rethrow) throw error;
    return false;
  } finally {
    if (!options.silentRender) renderStoryboardResult(result, false);
  }
}

async function generateSceneImage(sceneId, kind) {
  if (ui.studioBusy) {
    toast('Espera a que termine el trabajo de imágenes actual.', 'error');
    return;
  }
  const scene = studioSceneById(sceneId);
  if (!scene) return;
  const isStart = kind === 'start';
  ui.studioBusy = true;
  ui.studioProgress = { done: 0, total: 1, label: `Escena ${scene.number}: imagen ${isStart ? 'inicial' : 'final'}…` };
  renderStoryboardResult(state.lastStoryboard, false);
  try {
    const ok = await requestStudioSceneImage(sceneId, kind, { rethrow: false });
    toast(ok ? `Imagen ${isStart ? 'inicial' : 'final'} de la escena ${scene.number} lista.` : `No se pudo generar la imagen de la escena ${scene.number}.`, ok ? 'success' : 'error');
  } finally {
    ui.studioBusy = false;
    ui.studioProgress = { done: 0, total: 0, label: '' };
    renderStoryboardResult(state.lastStoryboard, false);
  }
}

async function generateAllStudioImages() {
  if (ui.studioBusy) {
    toast('Espera a que termine el trabajo de imágenes actual.', 'error');
    return;
  }
  const result = state.lastStoryboard;
  if (!result) return;
  const provider = studioProviderHealth();
  if (!provider.ok) {
    toast(studioProviderSetupText(), 'error');
    return;
  }
  const tasks = [];
  result.scenes.forEach((scene) => {
    if (!scene.startImage) tasks.push({ scene, kind: 'start' });
    if (scene.endPrompt && !scene.endImage) tasks.push({ scene, kind: 'end' });
  });
  if (!tasks.length) {
    toast('Todas las imágenes ya están listas. Usa Regenerar en una escena para cambiar una.');
    return;
  }
  ui.studioBusy = true;
  ui.studioJobId += 1;
  ui.studioProgress = { done: 0, total: tasks.length, label: `0 de ${tasks.length} imágenes…` };
  renderStoryboardResult(result, false);
  let errors = 0;
  try {
    for (let index = 0; index < tasks.length; index += 1) {
      const task = tasks[index];
      ui.studioProgress = {
        done: index,
        total: tasks.length,
        label: `Escena ${task.scene.number}: imagen ${task.kind === 'start' ? 'inicial' : 'final'} · ${index + 1}/${tasks.length}`
      };
      renderStoryboardResult(result, false);
      try {
        await requestStudioSceneImage(task.scene.id, task.kind, { silentRender: true, rethrow: true });
      } catch {
        errors += 1;
      }
      ui.studioProgress = { done: index + 1, total: tasks.length, label: `Escena ${task.scene.number} procesada · ${index + 1}/${tasks.length}` };
      saveState();
      renderStoryboardResult(result, false);
    }
  } finally {
    ui.studioBusy = false;
    ui.studioProgress = { done: 0, total: 0, label: '' };
    saveState();
    renderStoryboardResult(result, false);
  }
  if (errors) {
    toast(`${tasks.length - errors} imágenes listas y ${errors} con error. Revisa cada escena para reintentar.`, 'error');
  } else {
    toast(`${tasks.length} imágenes generadas con el proveedor real.`);
  }
}

function regenerateAnimationPrompts() {
  const result = state.lastStoryboard;
  if (!result) return;
  result.scenes.forEach((scene) => {
    scene.animationPrompt = studioAnimationPrompt(result, scene);
  });
  result.promptsUpdatedAt = new Date().toISOString();
  saveState();
  renderStoryboardResult(result, false);
  toast('Prompts de animación actualizados sin repetir el storyboard completo.');
}

function regenerateSceneAnimation(sceneId) {
  const result = state.lastStoryboard;
  const scene = studioSceneById(sceneId);
  if (!result || !scene) return;
  scene.animationPrompt = studioAnimationPrompt(result, scene);
  result.promptsUpdatedAt = new Date().toISOString();
  saveState();
  renderStoryboardResult(result, false);
  toast(`Prompt de animación de la escena ${scene.number} actualizado.`);
}

function updateSceneDuration(sceneId, value) {
  const result = state.lastStoryboard;
  const scene = studioSceneById(sceneId);
  if (!result || !scene) return;
  const duration = Math.min(30, Math.max(1, Math.round(Number(value) || 1)));
  scene.duration = duration;
  studioRecomputeTimeline(result);
  scene.animationPrompt = studioAnimationPrompt(result, scene);
  saveState();
  renderStoryboardResult(result, false);
}

function studioSafeName(value, fallback) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || fallback;
}

async function studioDownloadPayload(result, scene, kind) {
  const source = kind === 'start' ? scene.startImage : scene.endImage;
  if (!source) return null;
  const image = await studioLoadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  if (!blob) throw new Error('No se pudo preparar la descarga.');
  return {
    blob,
    filename: `storyboard-${studioSafeName(result.input.topic, 'video')}-escena-${scene.number}-${kind === 'start' ? 'inicial' : 'final'}-1080x1920.jpg`
  };
}

function studioTriggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function downloadStudioImage(sceneId, kind) {
  const result = state.lastStoryboard;
  const scene = studioSceneById(sceneId);
  if (!result || !scene) return;
  try {
    const item = await studioDownloadPayload(result, scene, kind);
    if (!item) {
      toast('Esa imagen todavía no está lista.', 'error');
      return;
    }
    studioTriggerDownload(item.blob, item.filename);
    toast(`Imagen ${kind === 'start' ? 'inicial' : 'final'} descargada en 1080x1920.`);
  } catch {
    toast('No se pudo descargar la imagen. Inténtalo de nuevo.', 'error');
  }
}

async function downloadAllStudioImages() {
  const result = state.lastStoryboard;
  if (!result) {
    toast('Primero genera un storyboard.', 'error');
    return;
  }
  const items = result.scenes.flatMap((scene) => [
    scene.startImage ? { scene, kind: 'start' } : null,
    scene.endImage ? { scene, kind: 'end' } : null
  ]).filter(Boolean);
  if (!items.length) {
    toast('Todavía no hay imágenes listas para descargar.', 'error');
    return;
  }
  let downloaded = 0;
  for (const item of items) {
    try {
      const payload = await studioDownloadPayload(result, item.scene, item.kind);
      if (payload) {
        studioTriggerDownload(payload.blob, payload.filename);
        downloaded += 1;
        await new Promise((resolve) => window.setTimeout(resolve, 320));
      }
    } catch {
      continue;
    }
  }
  toast(downloaded === 1 ? '1 imagen descargada en 1080x1920.' : `${downloaded} imágenes descargadas en 1080x1920.`, downloaded ? 'success' : 'error');
}

function exportStudioProject() {
  const result = state.lastStoryboard;
  if (!result) {
    toast('Primero genera un storyboard.', 'error');
    return;
  }
  const payload = {
    app: 'Centro de Control Creator IA',
    type: 'studio-storyboard',
    exportedAt: new Date().toISOString(),
    project: result
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `storyboard-${studioSafeName(result.input.topic, 'proyecto')}-${todayISO()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast('Proyecto exportado con prompts e imágenes.');
}
