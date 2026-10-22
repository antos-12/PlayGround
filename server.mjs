import { createServer } from 'node:http';
import { createReadStream, existsSync, readdirSync, watch } from 'node:fs';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.env.PORT || 3002);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_BODY = 14 * 1024 * 1024;
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_REFERENCES = 3;
const RATE_LIMIT = 40;
const RATE_WINDOW = 60_000;

try {
  process.loadEnvFile(join(ROOT, '.env'));
} catch {}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const livePreviewScript = `<script data-omgithub-live-preview>
(() => {
  const events = new EventSource('/__omgithub/live');
  events.addEventListener('change', () => {
    if (window.parent !== window) window.parent.postMessage({ type: 'omgithub:live-change' }, '*');
    else window.location.reload();
  });
  window.addEventListener('pagehide', () => events.close(), { once: true });
})();
</script>`;

const IGNORED_WATCH = new Set(['.git', '.agents', '.agentsweb', '.github', '.opencode', '.opencode-ssh', '.opencode-web', '.playwright-cli', 'node_modules', 'screenshots']);
const liveClients = new Set();
let watchTimer;

function watchProject() {
  const watchers = new Map();
  const scan = (directory) => {
    try {
      if (!watchers.has(directory)) {
        watchers.set(directory, watch(directory, () => {
          clearTimeout(watchTimer);
          watchTimer = setTimeout(() => {
            scan(directory);
            for (const client of liveClients) client.write('event: change\ndata: changed\n\n');
          }, 250);
        }));
      }
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (entry.isDirectory() && !IGNORED_WATCH.has(entry.name) && !entry.name.startsWith('.')) scan(join(directory, entry.name));
      }
    } catch {}
  };
  scan(ROOT);
  return () => {
    clearTimeout(watchTimer);
    for (const watcher of watchers.values()) watcher.close();
  };
}

const cleanupWatchers = watchProject();
const rateBuckets = new Map();

function safeMessage(value) {
  return String(value || 'Error del proveedor.')
    .replace(/key=[^\s&"']+/gi, 'key=[redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/\bAIza[0-9A-Za-z_-]{20,}\b/g, '[redacted]')
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, '[redacted]')
    .slice(0, 400);
}

function providerConfig() {
  const requested = String(process.env.IMAGE_PROVIDER || '').trim().toLowerCase();
  const allowPublicFallback = String(process.env.ALLOW_PUBLIC_FALLBACK || 'true').toLowerCase() !== 'false';
  const openai = {
    id: 'openai',
    label: 'OpenAI Images',
    model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
    supportsReference: true,
    configured: Boolean(process.env.OPENAI_API_KEY)
  };
  const gemini = {
    id: 'gemini',
    label: 'Gemini Image',
    model: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
    supportsReference: true,
    configured: Boolean(process.env.GEMINI_API_KEY)
  };
  const pollinationsToken = String(process.env.POLLINATIONS_TOKEN || '').trim();
  const pollinations = {
    id: 'pollinations',
    label: 'Pollinations público',
    model: pollinationsToken ? process.env.POLLINATIONS_MODEL || 'flux' : 'sana',
    supportsReference: false,
    configured: true
  };
  const pixelster = {
    id: 'pixelster',
    label: 'PixelSter público',
    model: 'flux',
    supportsReference: false,
    configured: true
  };
  const available = [openai, gemini].filter((provider) => provider.configured);
  const publicFallback = allowPublicFallback ? pollinations : null;

  if (requested && requested !== 'auto') {
    const selected = [openai, gemini, pollinations, pixelster].find((provider) => provider.id === requested);
    if (!selected) {
      return { configured: false, primary: null, fallback: null, error: `IMAGE_PROVIDER no reconocido: ${requested}` };
    }
    if (!selected.configured) {
      return {
        configured: false,
        primary: selected,
        fallback: allowPublicFallback && selected.id !== 'pollinations' ? pollinations : null,
        error: `Falta la clave de ${selected.label}.`
      };
    }
    const fallback = selected.id === 'pollinations' ? null : publicFallback;
    return { configured: true, primary: selected, fallback, error: '' };
  }

  if (available.length) {
    return { configured: true, primary: available[0], fallback: publicFallback, error: '' };
  }
  return { configured: true, primary: pollinations, fallback: null, error: '' };
}

function publicProvider(provider) {
  if (!provider) return null;
  return {
    id: provider.id,
    label: provider.label,
    model: provider.model,
    supportsReference: provider.supportsReference,
    keyless: ['pollinations', 'pixelster'].includes(provider.id)
  };
}

function statusPayload() {
  const config = providerConfig();
  return {
    configured: config.configured,
    primary: publicProvider(config.primary),
    fallback: publicProvider(config.fallback),
    supportsReference: Boolean(config.primary?.supportsReference),
    bestEffort: ['pollinations', 'pixelster'].includes(config.primary?.id),
    publicFallbackEnabled: ['pollinations', 'pixelster'].includes(config.fallback?.id) || ['pollinations', 'pixelster'].includes(config.primary?.id),
    error: config.error || ''
  };
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

function apiError(status, code, message, extra = {}) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.extra = extra;
  return error;
}

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw apiError(413, 'payload_too_large', 'La solicitud supera el tamaño permitido.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    throw apiError(400, 'invalid_json', 'La solicitud no contiene JSON válido.');
  }
}

function parseDataImage(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  const mime = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
  const buffer = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE) return null;
  return { mime, buffer, data: buffer.toString('base64') };
}

function responseImage(buffer, mime, provider, model, referenceUsed, fallback) {
  if (!buffer.length || buffer.length > MAX_IMAGE) throw apiError(502, 'invalid_image', 'El proveedor devolvió una imagen vacía o demasiado grande.');
  const type = mime && mime.startsWith('image/') ? mime : 'image/jpeg';
  return {
    image: `data:${type};base64,${buffer.toString('base64')}`,
    mimeType: type,
    provider,
    model,
    referenceUsed,
    fallback
  };
}

async function fetchWithTimeout(url, options = {}, timeout = 120_000) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeout) });
  return response;
}

async function readProviderError(response) {
  const mime = String(response.headers.get('content-type') || '').toLowerCase();
  const status = Number(response.status) || 502;
  if (mime.startsWith('image/')) {
    return `El proveedor respondió HTTP ${status} sin una imagen utilizable. Inténtalo de nuevo en unos minutos.`;
  }
  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw);
    return safeMessage(parsed?.error?.message || parsed?.message || parsed?.detail || raw);
  } catch {
    return safeMessage(raw) || `El proveedor respondió HTTP ${status}.`;
  }
}

async function generatePollinations(prompt, aspectRatio) {
  const token = String(process.env.POLLINATIONS_TOKEN || '').trim();
  const model = token ? process.env.POLLINATIONS_MODEL || 'flux' : 'sana';
  const size = aspectRatio === '4:5' ? [1024, 1280] : aspectRatio === '1:1' ? [1024, 1024] : [864, 1536];
  const negative = 'cartoon, anime, illustration, 3d render, cgi, plastic skin, text, logo, watermark, low quality, deformed hands, bad anatomy';
  const query = token
    ? `width=${size[0]}&height=${size[1]}&model=${encodeURIComponent(model)}&seed=${Math.floor(Math.random() * 1_000_000_000)}&nologo=true&enhance=true&negative_prompt=${encodeURIComponent(negative)}`
    : `width=${size[0]}&height=${size[1]}`;
  const url = token
    ? `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${query}`
    : `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${query}`;
  const headers = { Accept: 'image/jpeg,image/*' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let response = await fetchWithTimeout(url, { headers, cache: 'no-store' }, 150_000);
  if (response.status === 402 && !token) {
    await new Promise((resolve) => setTimeout(resolve, 46000));
    response = await fetchWithTimeout(url, { headers, cache: 'no-store' }, 150_000);
  }
  const mime = response.headers.get('content-type') || '';
  if (!response.ok || !mime.startsWith('image/')) {
    throw apiError(502, 'provider_error', await readProviderError(response));
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return responseImage(buffer, mime, 'pollinations', model, false, false);
}

async function generatePixelster(prompt, aspectRatio) {
  const ratio = ['9:16', '4:5', '1:1'].includes(aspectRatio) ? aspectRatio : '9:16';
  const response = await fetchWithTimeout('https://ahm7xmakki.com/api/tti', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ratio })
  });
  if (!response.ok) throw apiError(502, 'provider_error', await readProviderError(response));
  let data;
  try {
    data = await response.json();
  } catch {
    throw apiError(502, 'provider_error', 'El motor público no devolvió JSON válido.');
  }
  if (!data?.success || !data?.imageUrl) throw apiError(502, 'provider_error', 'El motor público no devolvió una imagen.');
  const imageResponse = await fetchWithTimeout(data.imageUrl, { cache: 'no-store' });
  if (!imageResponse.ok) throw apiError(502, 'provider_error', 'No se pudo descargar la imagen del motor público.');
  const mime = imageResponse.headers.get('content-type') || 'image/jpeg';
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  return responseImage(buffer, mime, 'pixelster', 'flux', false, false);
}

function referenceParts(references) {
  return references.map((reference) => ({
    inlineData: {
      mimeType: reference.mime,
      data: reference.data
    }
  }));
}

async function generateGemini(prompt, aspectRatio, references) {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
  const instruction = references.length
    ? `${prompt}\n\nUse the reference images to preserve the same person, wardrobe, location and lighting. Do not copy their composition.`
    : prompt;
  const response = await fetchWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': key
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: `${instruction}\n\nOutput aspect ratio: ${aspectRatio}.` }, ...referenceParts(references)]
      }],
      generationConfig: {
        candidateCount: 1,
        responseModalities: ['IMAGE']
      }
    })
  });
  if (!response.ok) throw apiError(502, 'provider_error', await readProviderError(response));
  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((part) => part?.inlineData?.data || part?.inline_data?.data);
  const inline = imagePart?.inlineData || imagePart?.inline_data;
  if (!inline?.data) {
    const text = parts.map((part) => part.text).filter(Boolean).join(' ').slice(0, 400);
    throw apiError(502, 'provider_error', text || 'Gemini no devolvió una imagen. Revisa la seguridad del prompt o la cuota.');
  }
  return responseImage(Buffer.from(inline.data, 'base64'), inline.mimeType || inline.mime_type || 'image/png', 'gemini', model, references.length > 0, false);
}

async function generateOpenAI(prompt, aspectRatio, references) {
  const key = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
  const size = aspectRatio === '9:16' ? '1024x1536' : aspectRatio === '4:5' ? '1024x1536' : '1024x1024';
  const quality = process.env.OPENAI_IMAGE_QUALITY || 'medium';
  let response;
  if (references.length) {
    const form = new FormData();
    form.set('model', model);
    form.set('prompt', `${prompt}\n\nUse the reference images to preserve the same person, wardrobe, location and lighting. Do not copy their composition.`);
    form.set('size', size);
    form.set('quality', quality);
    form.set('output_format', 'jpeg');
    references.forEach((reference, index) => {
      const extension = reference.mime === 'image/png' ? 'png' : reference.mime === 'image/webp' ? 'webp' : 'jpg';
      form.append('image[]', new Blob([reference.buffer], { type: reference.mime }), `reference-${index + 1}.${extension}`);
    });
    response = await fetchWithTimeout('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form
    });
  } else {
    response = await fetchWithTimeout('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, prompt, size, quality, output_format: 'jpeg', n: 1 })
    });
  }
  if (!response.ok) throw apiError(502, 'provider_error', await readProviderError(response));
  const data = await response.json();
  const first = data?.data?.[0];
  if (first?.b64_json) {
    return responseImage(Buffer.from(first.b64_json, 'base64'), 'image/jpeg', 'openai', model, references.length > 0, false);
  }
  if (first?.url) {
    const imageResponse = await fetchWithTimeout(first.url, { cache: 'no-store' });
    if (!imageResponse.ok) throw apiError(502, 'provider_error', 'No se pudo descargar la imagen de OpenAI.');
    const mime = imageResponse.headers.get('content-type') || 'image/png';
    return responseImage(Buffer.from(await imageResponse.arrayBuffer()), mime, 'openai', model, references.length > 0, false);
  }
  throw apiError(502, 'provider_error', 'OpenAI no devolvió una imagen.');
}

async function generateImage({ prompt, aspectRatio, references }) {
  const config = providerConfig();
  if (!config.configured) throw apiError(503, 'not_configured', config.error || 'El generador de imágenes no está configurado.');
  const attempts = [config.primary, config.fallback].filter((provider) => provider?.configured);
  const failures = [];
  for (let index = 0; index < attempts.length; index += 1) {
    const provider = attempts[index];
    try {
      let result;
      if (provider.id === 'openai') result = await generateOpenAI(prompt, aspectRatio, references);
      else if (provider.id === 'gemini') result = await generateGemini(prompt, aspectRatio, references);
      else if (provider.id === 'pollinations') result = await generatePollinations(prompt, aspectRatio);
      else result = await generatePixelster(prompt, aspectRatio);
      return { ...result, fallback: index > 0 || result.fallback };
    } catch (error) {
      failures.push({ provider: provider.id, message: safeMessage(error.message) });
      if (provider.id === 'pixelster') break;
    }
  }
  const message = failures.length
    ? `No se pudo generar la imagen. ${failures[0].message}`
    : 'No se pudo generar la imagen. Revisa la configuración del proveedor.';
  throw apiError(502, 'all_providers_failed', message, { attempts: failures });
}

function rateLimit(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local').split(',')[0].trim();
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.reset <= now) {
    rateBuckets.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return true;
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT) return false;
  return true;
}

async function serveStatic(req, res, pathname, search) {
  let target = resolve(ROOT, '.' + decodeURIComponent(pathname));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    let info = await stat(target);
    if (info.isDirectory()) {
      target = join(target, 'index.html');
      info = await stat(target);
    }
    if (!info.isFile()) throw new Error('not a file');
    const type = MIME[extname(target).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    if (extname(target) === '.html' && new URLSearchParams(search).get('omgithub_live') === '1') {
      const html = await readFile(target, 'utf8');
      res.end(/<\/body\s*>/i.test(html) ? html.replace(/<\/body\s*>/i, `${livePreviewScript}</body>`) : html + livePreviewScript);
      return;
    }
    createReadStream(target).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  if (pathname === '/__omgithub/live') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive'
    });
    res.write(': connected\n\n');
    liveClients.add(res);
    req.on('close', () => liveClients.delete(res));
    return;
  }

  if (pathname === '/api/health' && req.method === 'GET') {
    json(res, 200, { ok: true, service: 'creator-ia-image-api' });
    return;
  }

  if (pathname === '/api/image-status' && req.method === 'GET') {
    json(res, 200, statusPayload());
    return;
  }

  if (pathname === '/api/images/generate' && req.method === 'POST') {
    if (!rateLimit(req)) {
      json(res, 429, { error: 'Demasiadas solicitudes. Espera un minuto e inténtalo de nuevo.', code: 'rate_limited' });
      return;
    }
    const started = Date.now();
    try {
      const body = await readJsonBody(req);
      const prompt = String(body.prompt || '').trim();
      if (prompt.length < 10 || prompt.length > 4500) {
        throw apiError(400, 'invalid_prompt', 'El prompt debe tener entre 10 y 4500 caracteres.');
      }
      const aspectRatio = ['9:16', '4:5', '1:1'].includes(body.aspectRatio) ? body.aspectRatio : '9:16';
      const rawReferences = Array.isArray(body.references) ? body.references.slice(0, MAX_REFERENCES) : [];
      const references = rawReferences.map(parseDataImage).filter(Boolean);
      if (rawReferences.length && references.length !== rawReferences.length) {
        throw apiError(400, 'invalid_reference', 'Una imagen de referencia no es válida o supera 10 MB.');
      }
      const result = await generateImage({ prompt, aspectRatio, references });
      json(res, 200, { ...result, elapsedMs: Date.now() - started });
    } catch (error) {
      const status = error.status || 500;
      const code = error.code || 'server_error';
      const message = status === 500 ? 'Error interno del generador de imágenes.' : safeMessage(error.message);
      if (status === 500) console.error('[image-api]', safeMessage(error.message));
      json(res, status, { error: message, code, ...error.extra });
    }
    return;
  }

  if (pathname.startsWith('/api/')) {
    json(res, 404, { error: 'Ruta de API no encontrada.', code: 'not_found' });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end('Method not allowed');
    return;
  }

  await serveStatic(req, res, pathname, url.search);
});

server.listen(PORT, HOST, () => {
  const status = statusPayload();
  const provider = status.primary ? `${status.primary.id}/${status.primary.model}` : 'sin configurar';
  console.log(`Creator IA en http://localhost:${PORT} · motor: ${provider}`);
  if (process.env.OPENCODE_WEB_DIR) {
    try {
      mkdir(process.env.OPENCODE_WEB_DIR, { recursive: true }).catch(() => {});
      writeFile(join(process.env.OPENCODE_WEB_DIR, 'deployment-output.json'), JSON.stringify({ project: ROOT, directory: ROOT })).catch(() => {});
    } catch {}
  }
});

function shutdown() {
  cleanupWatchers();
  for (const client of liveClients) client.end();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
