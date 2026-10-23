import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.env.PORT || 3000);
const PROVIDER = (process.env.IMAGE_PROVIDER || 'auto').toLowerCase();
const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 120000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function providerStatus() {
  if (PROVIDER === 'auto') {
    return {
      ok: true,
      configured: true,
      provider: 'auto',
      model: 'FLUX.1 Schnell + Pollinations',
      reference: false,
      mode: 'fallback',
      message: 'Se intenta FLUX.1 Schnell y, si el Space no responde, se usa Pollinations como respaldo real.',
      setup: 'La cuota gratuita de Pollinations permite aproximadamente una imagen cada 45 segundos. Para referencias visuales, define IMAGE_PROVIDER=openai y OPENAI_API_KEY.'
    };
  }
  if (PROVIDER === 'openai') {
    const configured = Boolean(process.env.OPENAI_API_KEY);
    return {
      ok: configured,
      configured,
      provider: 'openai',
      model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
      reference: true,
      mode: 'api-key',
      message: configured
        ? 'Imágenes con OpenAI desde el backend. La clave nunca llega al navegador.'
        : 'Falta OPENAI_API_KEY en el servidor.',
      setup: configured
        ? null
        : 'Define IMAGE_PROVIDER=openai y OPENAI_API_KEY en el entorno del servidor. Reinicia la app después de guardar la variable.'
    };
  }
  if (PROVIDER === 'huggingface') {
    return {
      ok: true,
      configured: true,
      provider: 'huggingface',
      model: 'FLUX.1 Schnell',
      reference: false,
      mode: process.env.HF_TOKEN ? 'huggingface-token' : 'public-space',
      message: 'Generación real con FLUX.1 Schnell mediante un Space público, sujeta a la disponibilidad y cuota del Space.',
      setup: 'Opcional: define HF_TOKEN para más cuota. Para referencias visuales, define IMAGE_PROVIDER=openai y OPENAI_API_KEY.'
    };
  }
  if (PROVIDER === 'pollinations') {
    return {
      ok: true,
      configured: true,
      provider: 'pollinations',
      model: 'Sana (Pollinations)',
      reference: false,
      mode: 'keyless',
      message: 'Generación real keyless con Pollinations. La cuota gratuita permite aproximadamente una imagen cada 45 segundos.',
      setup: 'Para más velocidad y referencias visuales, define IMAGE_PROVIDER=openai y OPENAI_API_KEY en el servidor.'
    };
  }
  if (PROVIDER === 'pixelster') {
    return {
      ok: true,
      configured: true,
      provider: 'pixelster',
      model: 'Flux Dev',
      reference: false,
      mode: 'keyless',
      message: 'Generación real con Flux Dev mediante un proveedor público, siempre desde el backend.',
      setup: 'Para usar OpenAI y referencias visuales, define IMAGE_PROVIDER=openai y OPENAI_API_KEY en el servidor.'
    };
  }
  return {
    ok: false,
    configured: false,
    provider: PROVIDER,
    model: null,
    reference: false,
    mode: 'unknown',
    message: `Proveedor de imágenes no compatible: ${PROVIDER}.`,
    setup: 'Usa IMAGE_PROVIDER=auto, huggingface, pollinations, pixelster u openai.'
  };
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

async function readJsonBody(req) {
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > MAX_BODY_BYTES) throw Object.assign(new Error('Solicitud demasiado grande.'), { status: 413 });
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('Solicitud demasiado grande.'), { status: 413 });
    chunks.push(chunk);
  }
  if (!size) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('JSON no válido.'), { status: 400 });
  }
}

function dataUrlToBuffer(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return null;
  return { mime: match[1].replace('image/jpg', 'image/jpeg'), buffer };
}

async function fetchWithTimeout(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}

async function imageFromResponse(response, provider, model, referenceApplied) {
  if (!response.ok) {
    let detail = '';
    try {
      const payload = await response.json();
      detail = payload?.error?.message || payload?.message || payload?.error || '';
    } catch {
      detail = '';
    }
    throw Object.assign(new Error(detail ? `${provider}: ${detail}` : `${provider} respondió ${response.status}.`), { status: 502 });
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) throw Object.assign(new Error('El proveedor no devolvió una imagen.'), { status: 502 });
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_IMAGE_BYTES) throw Object.assign(new Error('La imagen supera el tamaño permitido.'), { status: 502 });
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw Object.assign(new Error('La imagen está vacía o es demasiado grande.'), { status: 502 });
  const mime = contentType.split(';')[0] === 'image/jpg' ? 'image/jpeg' : contentType.split(';')[0];
  return {
    image: `data:${mime};base64,${buffer.toString('base64')}`,
    mime,
    provider,
    model,
    referenceApplied: Boolean(referenceApplied)
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let pollinationsQueue = Promise.resolve();
let pollinationsNextAt = 0;

async function generatePollinations({ prompt, ratio }) {
  const width = ratio === '4:5' ? 960 : ratio === '1:1' ? 1024 : 864;
  const height = ratio === '4:5' ? 1200 : ratio === '1:1' ? 1024 : 1536;
  const model = process.env.POLLINATIONS_MODEL || 'flux';
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${Math.floor(Math.random() * 2147483646)}&model=${encodeURIComponent(model)}&nologo=true`;
  const run = async () => {
    const wait = Math.max(0, pollinationsNextAt - Date.now());
    if (wait) await delay(wait);
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      let response;
      try {
        response = await fetchWithTimeout(url);
      } catch (error) {
        pollinationsNextAt = Date.now() + 46000;
        throw error;
      }
      if (response.ok) {
        pollinationsNextAt = Date.now() + 46000;
        return imageFromResponse(response, 'pollinations', 'Sana', false);
      }
      let text = '';
      try {
        text = await response.text();
      } catch {
        text = '';
      }
      let detail = '';
      try {
        const payload = JSON.parse(text);
        detail = payload?.error?.message || payload?.message || '';
      } catch {
        detail = text.slice(0, 180);
      }
      lastError = Object.assign(new Error(detail ? `Pollinations: ${detail}` : `Pollinations respondió ${response.status}.`), { status: 502 });
      if (response.status === 402 || response.status === 429) {
        const match = text.match(/Retry after\s+(\d+)\s*s/i);
        const retryMs = Math.min(65000, (Number(match?.[1]) || 45) * 1000 + 1500);
        pollinationsNextAt = Date.now() + retryMs;
        if (attempt < 2) {
          await delay(retryMs);
          continue;
        }
      }
      break;
    }
    pollinationsNextAt = Date.now() + 46000;
    throw lastError;
  };
  const task = pollinationsQueue.then(run, run);
  pollinationsQueue = task.catch(() => undefined);
  return task;
}

async function generatePixelster({ prompt, ratio }) {
  const url = process.env.PIXELSTER_API_URL || 'https://ahm7xmakki.com/api/tti';
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ prompt, ratio })
  });
  if (!response.ok) {
    throw Object.assign(new Error(`El proveedor de imágenes respondió ${response.status}.`), { status: 502 });
  }
  const payload = await response.json().catch(() => null);
  if (!payload?.success || !payload?.imageUrl) {
    throw Object.assign(new Error(payload?.error || payload?.message || 'El proveedor no devolvió una imagen válida.'), { status: 502 });
  }
  const imageResponse = await fetchWithTimeout(payload.imageUrl);
  return imageFromResponse(imageResponse, 'pixelster', 'Flux Dev', false);
}


async function generateHuggingFace({ prompt, ratio }) {
  const base = (process.env.HF_IMAGE_SPACE_URL || 'https://black-forest-labs-flux-1-schnell.hf.space').replace(/\/+$/, '');
  const width = ratio === '4:5' ? 960 : ratio === '1:1' ? 1024 : 864;
  const height = ratio === '4:5' ? 1200 : ratio === '1:1' ? 1024 : 1536;
  const seed = Math.floor(Math.random() * 2147483646);
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.HF_TOKEN) headers.Authorization = `Bearer ${process.env.HF_TOKEN}`;
  const submit = await fetchWithTimeout(`${base}/gradio_api/call/infer`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data: [prompt, seed, false, width, height, 4] })
  });
  if (!submit.ok) {
    throw Object.assign(new Error(`El espacio de imágenes respondió ${submit.status}.`), { status: 502 });
  }
  const { event_id: eventId } = await submit.json();
  if (!eventId) throw Object.assign(new Error('El espacio de imágenes no devolvió un identificador de trabajo.'), { status: 502 });
  const stream = await fetchWithTimeout(`${base}/gradio_api/call/infer/${eventId}`, { headers });
  if (!stream.ok) throw Object.assign(new Error(`El trabajo de imagen respondió ${stream.status}.`), { status: 502 });
  const text = await stream.text();
  const lines = text.split(/\r?\n/);
  let fileData = null;
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].startsWith('event: error')) {
      throw Object.assign(new Error('El espacio de imágenes reportó un error en la generación.'), { status: 502 });
    }
    if (lines[index].startsWith('event: complete')) {
      const dataLine = lines.slice(index + 1).find((line) => line.startsWith('data: '));
      if (dataLine) {
        try {
          const payload = JSON.parse(dataLine.slice(6));
          const candidate = Array.isArray(payload) ? payload[0] : payload;
          if (candidate?.url) fileData = candidate;
        } catch {
          fileData = null;
        }
      }
    }
  }
  if (!fileData?.url) throw Object.assign(new Error('El espacio de imágenes no devolvió una imagen utilizable.'), { status: 502 });
  const imageResponse = await fetchWithTimeout(fileData.url, { headers: process.env.HF_TOKEN ? { Authorization: `Bearer ${process.env.HF_TOKEN}` } : {} });
  return imageFromResponse(imageResponse, 'huggingface', 'FLUX.1 Schnell', false);
}

async function generateOpenAI({ prompt, ratio, referenceImage }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('Falta OPENAI_API_KEY en el servidor.'), { status: 503 });
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  const size = process.env.OPENAI_IMAGE_SIZE || '1024x1536';
  const quality = process.env.OPENAI_IMAGE_QUALITY || 'medium';
  const reference = dataUrlToBuffer(referenceImage);
  let response;
  if (reference) {
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', prompt);
    form.append('size', size);
    form.append('quality', quality);
    form.append('output_format', 'jpeg');
    form.append('image', new Blob([reference.buffer], { type: reference.mime }), 'reference.jpg');
    response = await fetchWithTimeout('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form
    });
  } else {
    response = await fetchWithTimeout('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, size, quality, n: 1, output_format: 'jpeg' })
    });
  }
  if (!response.ok) {
    let detail = '';
    try {
      const payload = await response.json();
      detail = payload?.error?.message || '';
    } catch {
      detail = '';
    }
    throw Object.assign(new Error(detail ? `OpenAI: ${detail}` : `OpenAI respondió ${response.status}.`), { status: 502 });
  }
  const payload = await response.json();
  const item = payload?.data?.[0];
  if (item?.b64_json) {
    const mime = 'image/jpeg';
    const buffer = Buffer.from(item.b64_json, 'base64');
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) throw Object.assign(new Error('La imagen de OpenAI está vacía o es demasiado grande.'), { status: 502 });
    return {
      image: `data:${mime};base64,${buffer.toString('base64')}`,
      mime,
      provider: 'openai',
      model,
      referenceApplied: Boolean(reference)
    };
  }
  if (item?.url) {
    const imageResponse = await fetchWithTimeout(item.url);
    return imageFromResponse(imageResponse, 'openai', model, Boolean(reference));
  }
  throw Object.assign(new Error('OpenAI no devolvió una imagen utilizable.'), { status: 502 });
}

async function generateImage(body) {
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const ratio = typeof body.ratio === 'string' ? body.ratio : '9:16';
  if (prompt.length < 12) throw Object.assign(new Error('El prompt de imagen es demasiado corto.'), { status: 400 });
  if (prompt.length > 2400) throw Object.assign(new Error('El prompt de imagen es demasiado largo.'), { status: 400 });
  if (!['9:16', '4:5', '1:1'].includes(ratio)) throw Object.assign(new Error('Formato de imagen no válido.'), { status: 400 });
  if (PROVIDER === 'openai') return generateOpenAI({ prompt, ratio, referenceImage: body.referenceImage });
  if (PROVIDER === 'huggingface') return generateHuggingFace({ prompt, ratio });
  if (PROVIDER === 'pollinations') return generatePollinations({ prompt, ratio });
  if (PROVIDER === 'pixelster') return generatePixelster({ prompt, ratio });
  if (PROVIDER === 'auto') {
    let primaryError = null;
    try {
      return await generateHuggingFace({ prompt, ratio });
    } catch (error) {
      primaryError = error;
      console.warn(`[studio-image] FLUX no disponible, usando respaldo: ${error.message}`);
    }
    try {
      return await generatePollinations({ prompt, ratio });
    } catch (error) {
      throw Object.assign(new Error(`No se pudo generar la imagen. FLUX: ${primaryError.message} Respaldo: ${error.message}`), { status: 502 });
    }
  }
  throw Object.assign(new Error('No hay un proveedor de imágenes configurado.'), { status: 503 });
}

async function serveStatic(req, res, pathname) {
  const decoded = decodeURIComponent(pathname);
  const target = resolve(ROOT, `.${decoded === '/' ? '/index.html' : decoded}`);
  if (target !== ROOT && !target.startsWith(`${ROOT}/`)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  let file = target;
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const content = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname === '/api/studio/health') {
      if (req.method !== 'GET') {
        json(res, 405, { error: 'Método no permitido.' });
        return;
      }
      json(res, 200, providerStatus());
      return;
    }
    if (url.pathname === '/api/studio/image') {
      if (req.method !== 'POST') {
        json(res, 405, { error: 'Método no permitido.' });
        return;
      }
      const body = await readJsonBody(req);
      const result = await generateImage(body);
      json(res, 200, result);
      return;
    }
    if (url.pathname.startsWith('/api/')) {
      json(res, 404, { error: 'Ruta de API no encontrada.' });
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405);
      res.end();
      return;
    }
    await serveStatic(req, res, url.pathname);
  } catch (error) {
    const status = Number(error?.status) || 500;
    if (status >= 500) console.error(`[studio-image] ${status}: ${error.message}`);
    json(res, status, {
      error: status >= 500 ? error.message : error.message,
      provider: providerStatus().provider
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Creator IA server listening on http://0.0.0.0:${PORT} (image provider: ${PROVIDER})`);
});
