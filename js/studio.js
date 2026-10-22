'use strict';

const STUDIO_ASPECT_RATIO = '9:16';
const STUDIO_MAX_IMAGE_WIDTH = 900;
const STUDIO_MAX_REFERENCE_WIDTH = 720;

function studioSceneKey(index, kind) {
  return `${index}-${kind}`;
}

function studioProviderName(provider) {
  if (provider === 'openai') return 'OpenAI';
  if (provider === 'gemini') return 'Gemini';
  if (provider === 'pollinations') return 'Pollinations público';
  if (provider === 'pixelster') return 'Flux público';
  return provider || 'Servidor';
}

function renderStudioImageStatus() {
  const badge = $('#studio-engine-badge');
  const note = $('#studio-api-note');
  const status = ui.imageStatus;
  if (badge) {
    if (ui.imageStatusError) badge.innerHTML = '<span class="pulse-dot error"></span>Imágenes IA · sin conexión';
    else if (!status) badge.innerHTML = '<span class="pulse-dot"></span>Imágenes IA · conectando';
    else if (!status.configured) badge.innerHTML = '<span class="pulse-dot error"></span>Imágenes IA · falta configurar';
    else badge.innerHTML = `<span class="pulse-dot"></span>Imágenes IA · ${esc(status.primary?.label || 'listo')}`;
  }
  if (!note) return;
  if (ui.imageStatusError) {
    note.classList.add('is-error');
    note.innerHTML = `${icon('i-info')}<span><strong>Sin conexión con el generador.</strong> Inicia la app con <code>node server.mjs</code> o <code>./start.sh</code>; las imágenes no se generan en un hosting puramente estático.</span>`;
    return;
  }
  if (!status) {
    note.classList.remove('is-error');
    note.innerHTML = `${icon('i-info')}<span>Comprobando el motor de imágenes del servidor…</span>`;
    return;
  }
  if (!status.configured) {
    note.classList.add('is-error');
    note.innerHTML = `${icon('i-info')}<span><strong>Falta configuración.</strong> ${esc(status.error || 'Añade una clave en .env para generar imágenes.')} El resto del estudio sigue funcionando.</span>`;
    return;
  }
  note.classList.remove('is-error');
  const referenceText = status.supportsReference
    ? 'Las imágenes de referencia se reutilizan para mantener continuidad.'
    : 'Este motor no admite referencias. Añade <code>GEMINI_API_KEY</code> u <code>OPENAI_API_KEY</code> en <code>.env</code> para activarlas.';
  const fallback = status.fallback ? ` Respaldo: ${esc(status.fallback.label)}.` : '';
  const bestEffort = status.bestEffort ? ' Motor público best-effort: aproximadamente 1 imagen cada 45 s; puede tardar, limitar solicitudes o añadir marca de agua.' : '';
  note.innerHTML = `${icon('i-lock')}<span><strong>${esc(status.primary.label)} (${esc(status.primary.model)})</strong> configurado en el servidor.${fallback}${bestEffort} ${referenceText}</span>`;
}

async function loadStudioImageStatus(force = false) {
  if (!force && ui.imageStatus && Date.now() - (ui.imageStatus.loadedAt || 0) < 30000) {
    renderStudioImageStatus();
    return ui.imageStatus;
  }
  try {
    const response = await fetch('/api/image-status', { cache: 'no-store' });
    if (!response.ok) throw new Error('No se pudo consultar el servidor.');
    const status = await response.json();
    ui.imageStatus = { ...status, loadedAt: Date.now() };
    ui.imageStatusError = '';
  } catch {
    ui.imageStatus = null;
    ui.imageStatusError = 'Sin conexión con el servidor de imágenes.';
  }
  renderStudioImageStatus();
  if (typeof updateAvatarEngineNote === 'function') updateAvatarEngineNote();
  return ui.imageStatus;
}

function renderStudioReferencePreview() {
  const preview = $('#studio-reference-preview');
  const clear = $('#studio-reference-clear');
  if (!preview) return;
  if (!ui.studioReference) {
    preview.hidden = true;
    preview.innerHTML = '';
    if (clear) clear.hidden = true;
    return;
  }
  preview.hidden = false;
  preview.innerHTML = `<img src="${ui.studioReference}" alt="Imagen de referencia"><div><strong>${esc(ui.studioReferenceName || 'Referencia visual')}</strong><span>Se usará para continuidad cuando el motor lo permita.</span></div>`;
  if (clear) clear.hidden = false;
}

function setStudioReference(image, name = '') {
  ui.studioReference = image || null;
  ui.studioReferenceName = name || '';
  renderStudioReferencePreview();
}

function clearStudioReference() {
  setStudioReference(null, '');
  const input = $('#studio-reference');
  if (input) input.value = '';
}

function fillStudioForm(input) {
  if (!input) return;
  const fields = {
    'studio-topic': input.topic,
    'studio-platform': input.platform,
    'studio-duration': input.duration,
    'studio-style': input.style,
    'studio-format': input.format,
    'studio-art': input.art,
    'studio-characters': input.characters,
    'studio-wardrobe': input.wardrobe,
    'studio-locations': input.locations,
    'studio-lighting': input.lighting
  };
  Object.entries(fields).forEach(([id, value]) => {
    const field = $(`#${id}`);
    if (!field || value === undefined || value === null) return;
    field.value = value;
  });
  setStudioReference(input.referenceImage || null, input.referenceName || '');
}

function readStudioForm() {
  return {
    topic: $('#studio-topic').value.trim(),
    platform: $('#studio-platform').value,
    duration: Number($('#studio-duration').value),
    style: $('#studio-style').value,
    format: $('#studio-format').value,
    art: $('#studio-art').value.trim() || 'Fondo oscuro, luz suave, acento verde lima',
    characters: $('#studio-characters').value.trim() || 'Una creadora mexicana de 29 años, expresión cercana',
    wardrobe: $('#studio-wardrobe').value.trim() || 'Vestuario neutro y coherente',
    locations: $('#studio-locations').value.trim() || 'Un espacio luminoso y coherente con la marca',
    lighting: $('#studio-lighting').value.trim() || 'Luz suave de ventana y sombras controladas',
    referenceImage: ui.studioReference || null,
    referenceName: ui.studioReferenceName || ''
  };
}

function loadImageSource(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    image.src = source;
  });
}

async function normalizeStudioImage(source, options = {}) {
  const image = await loadImageSource(source);
  const targetRatio = options.keepRatio ? image.naturalWidth / image.naturalHeight : 9 / 16;
  const maxWidth = options.maxWidth || STUDIO_MAX_IMAGE_WIDTH;
  let width = Math.min(maxWidth, image.naturalWidth);
  let height = Math.round(width / targetRatio);
  if (height > image.naturalHeight && !options.keepRatio) {
    height = image.naturalHeight;
    width = Math.round(height * targetRatio);
  }
  if (options.keepRatio) height = Math.round(width / targetRatio);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext('2d');
  context.fillStyle = '#07090f';
  context.fillRect(0, 0, canvas.width, canvas.height);
  let sx = 0;
  let sy = 0;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;
  if (!options.keepRatio) {
    if (sw / sh > targetRatio) {
      sw = sh * targetRatio;
      sx = (image.naturalWidth - sw) / 2;
    } else {
      sh = sw / targetRatio;
      sy = (image.naturalHeight - sh) / 2;
    }
  }
  context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const mime = options.keepRatio ? 'image/jpeg' : 'image/jpeg';
  return canvas.toDataURL(mime, options.quality || 0.82);
}

async function handleStudioReferenceFile(file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast('Usa una imagen JPG, PNG o WebP.', 'error');
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    toast('La referencia debe pesar menos de 8 MB.', 'error');
    return;
  }
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.readAsDataURL(file);
    });
    const normalized = await normalizeStudioImage(dataUrl, { keepRatio: true, maxWidth: STUDIO_MAX_REFERENCE_WIDTH, quality: 0.8 });
    setStudioReference(normalized, file.name);
    toast('Referencia visual lista para usarse.');
  } catch {
    toast('No se pudo procesar la referencia visual.', 'error');
  }
}

function studioReferencesFor(result, index, kind) {
  if (!ui.imageStatus?.supportsReference) return [];
  const references = [];
  if (result.input.referenceImage) references.push(result.input.referenceImage);
  const scene = result.scenes[index];
  let continuity = null;
  if (kind === 'end') {
    continuity = scene.images?.start?.image || null;
  } else if (index > 0) {
    const previous = result.scenes[index - 1];
    continuity = previous.images?.end?.image || previous.images?.start?.image || null;
  }
  if (continuity) references.push(continuity);
  return references.slice(0, 3);
}

async function requestStudioImage(prompt, references = []) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 180000);
  try {
    const response = await fetch('/api/images/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspectRatio: STUDIO_ASPECT_RATIO, references }),
      signal: controller.signal
    });
    let data = null;
    try {
      data = await response.json();
    } catch {}
    if (!response.ok) {
      const error = new Error(data?.error || 'El servidor no pudo generar la imagen.');
      error.code = data?.code || 'http_error';
      error.status = response.status;
      error.attempts = data?.attempts || [];
      throw error;
    }
    if (!data?.image || !String(data.image).startsWith('data:image/')) {
      throw new Error('El servidor no devolvió una imagen válida.');
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeout = new Error('La generación tardó demasiado. Inténtalo de nuevo.');
      timeout.code = 'timeout';
      throw timeout;
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

async function requestStudioImageWithRetry(prompt, references) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await requestStudioImage(prompt, references);
    } catch (error) {
      lastError = error;
      const retryable = !['not_configured', 'invalid_prompt', 'invalid_reference', 'rate_limited'].includes(error.code);
      if (!retryable || attempt === 1) break;
      await new Promise((resolve) => window.setTimeout(resolve, 1400));
    }
  }
  throw lastError;
}

function studioRenderPreservingScroll() {
  const output = $('#studio-output');
  const scrollTop = output?.scrollTop || 0;
  renderStoryboardResult(state.lastStoryboard, false);
  if (output) output.scrollTop = scrollTop;
}

function updateStudioActionState() {
  const running = Boolean(ui.studioBatch?.running);
  ['generate-all-images', 'generate-animation-prompts'].forEach((action) => {
    $$(`[data-action="${action}"]`).forEach((button) => {
      button.disabled = running;
    });
  });
  const generateAll = $('[data-action="generate-all-images"]');
  if (generateAll) {
    generateAll.innerHTML = running
      ? `${icon('i-refresh')}Generando ${ui.studioBatch.done}/${ui.studioBatch.total}…`
      : `${icon('i-image')}Generar imágenes`;
  }
}

async function generateSceneImage(index, kind, options = {}) {
  const result = state.lastStoryboard;
  if (!result || ui.studioBatch?.running && !options.fromBatch) return;
  const scene = result.scenes[index];
  if (!scene) return;
  const key = studioSceneKey(index, kind);
  const prompt = kind === 'end' ? scene.endPrompt : scene.startPrompt;
  if (!prompt) {
    toast('Esta escena no tiene prompt para ese frame.', 'error');
    return;
  }
  if (ui.studioImageBusy.has(key)) return;
  ui.studioImageBusy.add(key);
  delete ui.studioImageErrors[key];
  if (!options.fromBatch) studioRenderPreservingScroll();
  else updateStudioActionState();
  try {
    const references = studioReferencesFor(result, index, kind);
    const data = await requestStudioImageWithRetry(prompt, references);
    const image = await normalizeStudioImage(data.image);
    scene.images = scene.images || { start: null, end: null };
    scene.images[kind] = {
      image,
      provider: data.provider,
      model: data.model,
      referenceUsed: Boolean(data.referenceUsed),
      fallback: Boolean(data.fallback),
      createdAt: new Date().toISOString()
    };
    result.updatedAt = new Date().toISOString();
    saveState();
    if (!options.fromBatch) toast(`Imagen ${kind === 'end' ? 'final' : 'inicial'} de la escena ${scene.number} lista.`);
    return data;
  } catch (error) {
    ui.studioImageErrors[key] = error.message || 'No se pudo generar la imagen.';
    if (!options.fromBatch) toast(ui.studioImageErrors[key], 'error');
    throw error;
  } finally {
    ui.studioImageBusy.delete(key);
    if (!options.fromBatch) studioRenderPreservingScroll();
  }
}

function studioBatchJobs(result, onlyKeys = null) {
  const jobs = [];
  result.scenes.forEach((scene, index) => {
    const keys = onlyKeys ? new Set(onlyKeys) : null;
    const startKey = studioSceneKey(index, 'start');
    const endKey = studioSceneKey(index, 'end');
    if ((!keys || keys.has(startKey)) && scene.startPrompt) jobs.push({ index, kind: 'start' });
    if (scene.includeEnd && (!keys || keys.has(endKey)) && scene.endPrompt) jobs.push({ index, kind: 'end' });
  });
  return jobs;
}

async function runStudioImageBatch(jobs, options = {}) {
  const result = state.lastStoryboard;
  if (!result || !jobs.length) {
    toast('No hay imágenes pendientes por generar.', 'error');
    return;
  }
  if (ui.studioBatch?.running) return;
  ui.studioImageErrors = {};
  ui.studioBatch = { running: true, total: jobs.length, done: 0, errors: [], current: 'Preparando la primera imagen…' };
  studioRenderPreservingScroll();
  for (const job of jobs) {
    const scene = result.scenes[job.index];
    ui.studioBatch.current = `Escena ${scene.number} · imagen ${job.kind === 'end' ? 'final' : 'inicial'}`;
    studioRenderPreservingScroll();
    try {
      await generateSceneImage(job.index, job.kind, { fromBatch: true });
    } catch (error) {
      ui.studioBatch.errors.push({ key: studioSceneKey(job.index, job.kind), message: error.message });
    }
    ui.studioBatch.done += 1;
    studioRenderPreservingScroll();
  }
  ui.studioBatch.running = false;
  ui.studioBatch.current = '';
  saveState();
  studioRenderPreservingScroll();
  if (ui.studioBatch.errors.length) {
    toast(`${ui.studioBatch.done - ui.studioBatch.errors.length} de ${ui.studioBatch.total} imágenes listas. Revisa los errores y reintenta.`, 'error');
  } else {
    toast(options.retry ? 'Imágenes fallidas recuperadas.' : 'Todas las imágenes del storyboard están listas.');
  }
}

async function generateAllStoryboardImages() {
  const result = state.lastStoryboard;
  if (!result) return;
  if (ui.studioBatch?.running) return;
  await loadStudioImageStatus();
  const jobs = studioBatchJobs(result).filter((job) => !result.scenes[job.index].images?.[job.kind]);
  if (!jobs.length) {
    toast('Todas las imágenes ya están generadas. Usa Regenerar en cada frame para cambiarlas.');
    return;
  }
  await runStudioImageBatch(jobs);
}

async function retryFailedStoryboardImages() {
  const result = state.lastStoryboard;
  if (!result || !ui.studioBatch?.errors?.length) return;
  const keys = ui.studioBatch.errors.map((error) => error.key);
  const jobs = studioBatchJobs(result, keys).filter((job) => !result.scenes[job.index].images?.[job.kind]);
  await runStudioImageBatch(jobs, { retry: true });
}

function regenerateAnimationPrompts(index = null) {
  const result = state.lastStoryboard;
  if (!result) return;
  const scenes = index === null ? result.scenes : [result.scenes[index]].filter(Boolean);
  scenes.forEach((scene) => {
    scene.promptRevision = Number(scene.promptRevision || 0) + 1;
    scene.animationPrompt = buildSceneAnimationPrompt(result, scene);
  });
  result.updatedAt = new Date().toISOString();
  saveState();
  studioRenderPreservingScroll();
  toast(index === null ? 'Prompts de animación regenerados.' : `Prompt de animación de la escena ${index + 1} regenerado.`);
}

function updateSceneDuration(index, value) {
  const result = state.lastStoryboard;
  const scene = result?.scenes?.[index];
  if (!scene) return;
  const duration = Math.max(2, Math.min(20, Math.round(Number(value) || scene.duration)));
  if (duration === scene.duration) return;
  scene.duration = duration;
  recalculateSceneTiming(result);
  scene.promptRevision = Number(scene.promptRevision || 0) + 1;
  scene.animationPrompt = buildSceneAnimationPrompt(result, scene);
  result.updatedAt = new Date().toISOString();
  saveState();
  studioRenderPreservingScroll();
  toast(`Escena ${index + 1}: ${duration} s. Total: ${storyboardTotalDuration(result)} s.`);
}

function toggleSceneEnd(index) {
  const result = state.lastStoryboard;
  const scene = result?.scenes?.[index];
  if (!scene) return;
  scene.includeEnd = !scene.includeEnd;
  result.updatedAt = new Date().toISOString();
  saveState();
  studioRenderPreservingScroll();
  toast(scene.includeEnd ? 'Frame final activado para esta escena.' : 'Frame final omitido en esta escena.');
}

function sanitizeStudioSlug(value) {
  return String(value || 'storyboard')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60) || 'storyboard';
}

function dataUrlBytes(dataUrl) {
  const parts = String(dataUrl).split(',');
  const binary = atob(parts[1] || '');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function downloadSceneImage(index, kind) {
  const result = state.lastStoryboard;
  const scene = result?.scenes?.[index];
  const image = scene?.images?.[kind];
  if (!image?.image) return;
  const slug = sanitizeStudioSlug(result.input.topic);
  const link = document.createElement('a');
  link.href = image.image;
  link.download = `${slug}-escena-${String(scene.number).padStart(2, '0')}-${kind === 'end' ? 'final' : 'inicial'}.jpg`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  toast('Imagen descargada.');
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let value = 0xffffffff;
  for (let index = 0; index < bytes.length; index += 1) value = CRC_TABLE[(value ^ bytes[index]) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}

function zipStore(files) {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;
  const now = new Date();
  const dosTime = ((now.getHours() & 0x1f) << 11) | ((now.getMinutes() & 0x3f) << 5) | (Math.floor(now.getSeconds() / 2) & 0x1f);
  const dosDate = (((now.getFullYear() - 1980) & 0x7f) << 9) | (((now.getMonth() + 1) & 0xf) << 5) | (now.getDate() & 0x1f);
  const u16 = (value) => { const buffer = new Uint8Array(2); new DataView(buffer.buffer).setUint16(0, value, true); return buffer; };
  const u32 = (value) => { const buffer = new Uint8Array(4); new DataView(buffer.buffer).setUint32(0, value, true); return buffer; };
  const concat = (...parts) => {
    const length = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(length);
    let cursor = 0;
    parts.forEach((part) => { output.set(part, cursor); cursor += part.length; });
    return output;
  };
  files.forEach((file) => {
    const nameBytes = new TextEncoder().encode(file.name);
    const data = file.data;
    const crc = crc32(data);
    const local = concat(
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(dosTime), u16(dosDate),
      u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), nameBytes, data
    );
    localChunks.push(local);
    const central = concat(
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(dosTime), u16(dosDate),
      u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), nameBytes
    );
    centralChunks.push(central);
    offset += local.length;
  });
  const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = concat(
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(centralSize), u32(offset), u16(0)
  );
  return new Blob([...localChunks, ...centralChunks, end], { type: 'application/zip' });
}

function storyboardImageFiles(result) {
  const slug = sanitizeStudioSlug(result.input.topic);
  const files = [];
  result.scenes.forEach((scene) => {
    ['start', 'end'].forEach((kind) => {
      const image = scene.images?.[kind];
      if (!image?.image) return;
      files.push({
        name: `${slug}-escena-${String(scene.number).padStart(2, '0')}-${kind === 'end' ? 'final' : 'inicial'}.jpg`,
        data: dataUrlBytes(image.image)
      });
    });
  });
  return files;
}

function downloadStoryboardImages() {
  const result = state.lastStoryboard;
  if (!result) return;
  const files = storyboardImageFiles(result);
  if (!files.length) {
    toast('Genera al menos una imagen antes de descargar el ZIP.', 'error');
    return;
  }
  const manifest = [
    `STORYBOARD: ${result.input.topic}`,
    `Duración total: ${storyboardTotalDuration(result)} s`,
    `Formato: 9:16`,
    '',
    ...result.scenes.map((scene) => `Escena ${scene.number} · ${scene.title} · ${scene.duration} s\n${scene.visual}\nInicial: ${scene.startPrompt}\nFinal: ${scene.includeEnd ? scene.endPrompt : 'omitido'}\nAnimación: ${scene.animationPrompt}`)
  ].join('\n\n');
  files.push({ name: 'prompts.txt', data: new TextEncoder().encode(manifest) });
  downloadBlob(zipStore(files), `storyboard-${sanitizeStudioSlug(result.input.topic)}.zip`);
  toast(`ZIP descargado con ${files.length - 1} imágenes y los prompts.`);
}

function exportStoryboardProject() {
  const result = state.lastStoryboard;
  if (!result) return;
  const payload = {
    app: 'Centro de Control Creator IA · Estudio de videos IA',
    format: 'creator-ia-storyboard',
    version: 1,
    exportedAt: new Date().toISOString(),
    storyboard: result
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `storyboard-${sanitizeStudioSlug(result.input.topic)}-${todayISO()}.json`);
  toast('Proyecto exportado con imágenes y prompts.');
}
