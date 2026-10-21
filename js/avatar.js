'use strict';

const AVATAR_NICHES = {
  'Belleza y skincare': {
    en: 'beauty and skincare',
    bio: 'Rutinas de skincare explicadas sin vueltas.',
    benefit: 'una piel más luminosa sin complicarte',
    audience: 'personas que buscan una rutina sencilla',
    tags: ['skincare', 'beautytips', 'rutinafacial']
  },
  'Fitness y bienestar': {
    en: 'fitness and wellness',
    bio: 'Hábitos realistas para sentirte mejor.',
    benefit: 'entrenar sin quemarte en la primera semana',
    audience: 'personas que quieren empezar desde cero',
    tags: ['fitness', 'bienestar', 'rutina']
  },
  'Moda y accesorios': {
    en: 'fashion and accessories',
    bio: 'Outfits que sí se ven bien en la vida real.',
    benefit: 'armar looks que combinen sin gastar de más',
    audience: 'personas que buscan verse bien sin esfuerzo',
    tags: ['moda', 'outfit', 'style']
  },
  'Hogar y organización': {
    en: 'home organization and decor',
    bio: 'Ideas simples para vivir en un espacio más tranquilo.',
    benefit: 'organizar tu casa en poco tiempo',
    audience: 'personas que quieren orden sin complicaciones',
    tags: ['hogar', 'organizacion', 'decoracion']
  },
  'Tecnología y gadgets': {
    en: 'technology and gadgets',
    bio: 'Gadgets que valen la pena, explicados fácil.',
    benefit: 'elegir tecnología útil y no solo bonita',
    audience: 'personas que comparan antes de comprar',
    tags: ['tecnologia', 'gadgets', 'reviews']
  },
  'Cocina y alimentos': {
    en: 'food and cooking',
    bio: 'Recetas ricas con ingredientes que ya tienes.',
    benefit: 'resolver la comida sin pasar horas en la cocina',
    audience: 'personas que buscan recetas prácticas',
    tags: ['recetas', 'cocina', 'comidafacil']
  },
  'Finanzas personales': {
    en: 'personal finance',
    bio: 'Dinero claro, decisiones más tranquilas.',
    benefit: 'entender tus finanzas sin lenguaje complicado',
    audience: 'personas que quieren ordenar su dinero',
    tags: ['finanzas', 'ahorro', 'dinero']
  },
  'Emprendimiento': {
    en: 'entrepreneurship',
    bio: 'Negocios pequeños, decisiones grandes.',
    benefit: 'vender mejor sin depender de la suerte',
    audience: 'emprendedores que están empezando',
    tags: ['emprendimiento', 'negocio', 'ventas']
  }
};

const AVATAR_LOOKS = {
  'Latina mexicana': 'Mexican Latina with warm brown skin and mestiza features',
  'Mestiza': 'mestiza Latina with warm olive skin',
  'Afrodescendiente': 'Afro-Latina with deep brown skin and natural hair',
  'Asiática': 'East Asian with warm light skin',
  'Europea': 'European with fair skin and natural texture'
};

const AVATAR_PRESENTATIONS = {
  'Mujer': 'woman',
  'Hombre': 'man',
  'Persona no binaria': 'androgynous person'
};

const AVATAR_PERSONALITIES = {
  'Cercana y cálida': {
    expression: 'a warm, approachable smile and kind eyes',
    angle: 'Recomendación de alguien cercano que ya probó el producto.',
    bio: 'Cercana, honesta y sin poses.',
    cta: 'Toca el carrito y llévate {product} con una recomendación honesta.'
  },
  'Segura y directa': {
    expression: 'a confident, direct gaze and subtle smile',
    angle: 'Autoridad tranquila: explica el beneficio y elimina la duda.',
    bio: 'Directa, segura y sin rodeos.',
    cta: 'Revisa {product} en el carrito. Si te resuelve la duda, ya ganaste.'
  },
  'Divertida y espontánea': {
    expression: 'a playful, natural smile and expressive eyes',
    angle: 'Descubrimiento espontáneo con humor ligero y mucha energía.',
    bio: 'Curiosa, divertida y cero aburrida.',
    cta: 'Ve a la canasta por {product} antes de que se te olvide.'
  },
  'Premium y elegante': {
    expression: 'an elegant, composed expression and soft smile',
    angle: 'Rutina premium: textura, detalle y experiencia de uso.',
    bio: 'Curaduría premium para elecciones más conscientes.',
    cta: 'Descubre {product} en el carrito y eleva tu rutina.'
  },
  'Experta y tranquila': {
    expression: 'a calm, trustworthy expression and focused eyes',
    angle: 'Explicación experta: criterios, ingredientes y uso realista.',
    bio: 'Explica el porqué antes de recomendar.',
    cta: 'Consulta {product} en el carrito y decide con información clara.'
  }
};

const AVATAR_SETTINGS = {
  'Cocina luminosa': 'a bright modern kitchen with soft plants and natural textures',
  'Estudio limpio': 'a clean minimal photo studio with a soft neutral backdrop',
  'Oficina moderna': 'a modern home office with warm lamp light and subtle depth',
  'Sala acogedora': 'a cozy living room with warm textiles and soft daylight',
  'Exterior urbano': 'a sunlit urban street with softly blurred buildings',
  'Fondo neutro': 'a seamless warm neutral backdrop with soft studio light'
};

const AVATAR_OUTFITS = {
  'Casual premium': 'a well-fitted cream knit top',
  'Blazer editorial': 'a structured neutral blazer over a simple top',
  'Deportivo': 'a fitted charcoal athletic top',
  'Delantal de cocina': 'a clean linen apron over a casual shirt',
  'Camisa de lino': 'a relaxed olive linen shirt'
};

const AVATAR_FORMATS = {
  '9:16': { label: 'Vertical 9:16', width: 1080, height: 1920, className: 'ratio-9-16' },
  '4:5': { label: 'Feed 4:5', width: 1080, height: 1350, className: 'ratio-4-5' },
  '1:1': { label: 'Perfil 1:1', width: 1080, height: 1080, className: 'ratio-1-1' }
};

const AVATAR_LOADING_MESSAGES = [
  {
    title: 'Interpretando el brief de tu influencer…',
    sub: 'Ajustando edad, rasgos, personalidad y contexto de marca.'
  },
  {
    title: 'Construyendo un rostro coherente…',
    sub: 'La IA trabaja textura de piel, mirada, cabello y lenguaje corporal.'
  },
  {
    title: 'Ajustando luz y encuadre vertical…',
    sub: 'Buscando una estética natural que funcione en TikTok.'
  },
  {
    title: 'Preparando el kit de ventas…',
    sub: 'Bio, ganchos y llamado a la acción para acompañar el retrato.'
  }
];

const AVATAR_EMPTY_MARKUP = $('#avatar-output')?.innerHTML || '';

function buildAvatarPrompt(input) {
  const niche = AVATAR_NICHES[input.niche] || AVATAR_NICHES['Belleza y skincare'];
  const look = AVATAR_LOOKS[input.look] || AVATAR_LOOKS['Latina mexicana'];
  const presentation = AVATAR_PRESENTATIONS[input.presentation] || AVATAR_PRESENTATIONS['Mujer'];
  const personality = AVATAR_PERSONALITIES[input.personality] || AVATAR_PERSONALITIES['Cercana y cálida'];
  const setting = AVATAR_SETTINGS[input.setting] || AVATAR_SETTINGS['Cocina luminosa'];
  const outfit = AVATAR_OUTFITS[input.outfit] || AVATAR_OUTFITS['Casual premium'];
  const age = clamp(Number(input.age) || 28, 20, 55);
  const details = input.notes ? ` Additional natural details: ${input.notes.trim()}.` : '';
  return `Ultra realistic RAW candid lifestyle portrait photograph of a ${age}-year-old ${look} ${presentation}, ${personality.expression}, wearing ${outfit}, in ${setting}, upper body, centered composition, looking directly at camera, ${niche.en} creator context, natural skin texture with visible pores and subtle imperfections, realistic eyes and hair, soft diffused window light, 85mm lens at f/2, shallow depth of field, true-to-life colors, authentic TikTok creator aesthetic, photorealistic, editorial quality, high detail, no text, no logo, no watermark, hands out of frame, no product in hands.${details}`;
}

function buildAvatarNegativePrompt() {
  return 'cartoon, anime, illustration, painting, 3d render, cgi, doll, plastic skin, airbrushed, overdone makeup, heavy filter, deformed hands, extra fingers, bad anatomy, watermark, text, logo, low quality, oversaturated, artificial smile, uncanny face';
}

function buildAvatarSalesKit(input) {
  const niche = AVATAR_NICHES[input.niche] || AVATAR_NICHES['Belleza y skincare'];
  const personality = AVATAR_PERSONALITIES[input.personality] || AVATAR_PERSONALITIES['Cercana y cálida'];
  const name = input.name.trim();
  const product = input.product.trim();
  const hooks = [
    `Nadie te cuenta esto sobre ${product}…`,
    `Si quieres ${niche.benefit}, así lo usaría en tu rutina.`,
    `3 señales para elegir ${product} sin arrepentirte.`
  ];
  return {
    bio: `${name} · ${niche.bio} Probando ${product} para ${niche.audience}.`,
    angle: personality.angle,
    hooks,
    cta: personality.cta.replaceAll('{product}', product),
    caption: `${hooks[0]} ${product} para ${niche.audience}. ${personality.cta.replaceAll('{product}', product)}`,
    hashtags: [...new Set(['tiktokshop', ...niche.tags, 'creadormexico', 'recomendaciones'])].slice(0, 6)
  };
}

function avatarKitBody(result) {
  const kit = result.kit || buildAvatarSalesKit(result.input);
  return `AVATAR: ${result.input.name}
NICHO: ${result.input.niche}
PRODUCTO: ${result.input.product}
FORMATO: ${result.input.format}

BIO
${kit.bio}

ÁNGULO DE VENTA
${kit.angle}

GANCHOS
${kit.hooks.map((hook, index) => `${index + 1}. ${hook}`).join('\n')}

CTA
${kit.cta}

DESCRIPCIÓN
${kit.caption}

HASHTAGS
${kit.hashtags.map((tag) => `#${tag}`).join(' ')}`;
}

function avatarFormat(input) {
  return AVATAR_FORMATS[input.format] || AVATAR_FORMATS['9:16'];
}

function avatarResultMarkup(result) {
  const input = result.input;
  const kit = result.kit || buildAvatarSalesKit(input);
  const format = avatarFormat(input);
  const providerLabel = result.provider === 'pixelster' ? 'Flux · gratis' : (result.provider === 'pollinations-key' ? 'Clave personal' : 'Respaldo gratis');
  const providerNote = result.provider === 'pixelster'
    ? 'Generado con Flux Dev. Sin marca de agua.'
    : (result.provider === 'pollinations-key'
      ? 'Generado sin marca de agua con tu clave de Pollinations.'
      : 'Generado con el respaldo gratuito de Pollinations. Puede incluir marca de agua.');
  return `<div class="avatar-result">
    <div class="avatar-stage">
      <div class="avatar-photo ${format.className}">
        <img src="${result.image}" alt="Retrato sintético de ${esc(input.name)}, avatar de ${esc(input.niche)}">
        <div class="avatar-photo-top">
          <span class="avatar-photo-chip accent"><i></i>Avatar IA</span>
          <span class="avatar-photo-chip">${esc(format.label)}</span>
        </div>
        <div class="avatar-photo-foot"><strong>${esc(input.name)}</strong><span>${esc(providerLabel)}</span></div>
      </div>
      <div class="avatar-result-info">
        <h3>${esc(input.name)}</h3>
        <p>${esc(input.niche)} · ${esc(input.presentation)} · ${esc(String(input.age))} años</p>
        <div class="avatar-meta-chips">
          <span>${esc(input.personality)}</span>
          <span>${esc(input.setting)}</span>
          <span>${esc(input.outfit)}</span>
        </div>
        <button class="btn btn-small btn-ghost avatar-profile-button" type="button" data-action="use-avatar-profile" data-id="${esc(result.id)}">${icon('i-users')}Usar en mi perfil</button>
        <p class="fine-print">${icon('i-info')}${esc(providerNote)} Imagen sintética: no representa a una persona real ni debe usarse como testimonio real.</p>
      </div>
    </div>
    <div class="avatar-kit">
      <div class="avatar-kit-head"><h4>Kit de ventas</h4><span>Listo para adaptar</span></div>
      <div class="avatar-kit-block"><span>Bio</span><p>${esc(kit.bio)}</p></div>
      <div class="avatar-kit-block"><span>Ángulo de venta</span><p>${esc(kit.angle)}</p></div>
      <div class="avatar-kit-block"><span>3 ganchos</span><ol>${kit.hooks.map((hook) => `<li>${esc(hook)}</li>`).join('')}</ol></div>
      <div class="avatar-kit-block"><span>CTA</span><p>${esc(kit.cta)}</p></div>
      <div class="avatar-kit-block"><span>Hashtags</span><div class="avatar-kit-tags">${kit.hashtags.map((tag) => `<span>#${esc(tag)}</span>`).join('')}</div></div>
      <details class="avatar-prompt-details"><summary>Prompt usado</summary><p>${esc(result.prompt)}</p></details>
    </div>
  </div>`;
}

function renderAvatarHistory() {
  const container = $('#avatar-history');
  const count = $('#avatar-history-count');
  if (!container) return;
  if (count) count.textContent = `${state.avatars.length}/8`;
  if (!state.avatars.length) {
    container.innerHTML = `<div class="avatar-history-empty">${icon('i-users')}<span>Genera tu primer avatar para guardarlo aquí. Se conservarán los últimos 8 en este dispositivo.</span></div>`;
    return;
  }
  container.innerHTML = state.avatars.map((avatar) => {
    const selected = state.lastAvatar?.id === avatar.id;
    return `<article class="avatar-history-card${selected ? ' is-selected' : ''}">
      <button class="avatar-history-photo" type="button" data-action="select-avatar" data-id="${esc(avatar.id)}" aria-label="Abrir avatar ${esc(avatar.input.name)}">
        <img src="${avatar.image}" alt="Avatar ${esc(avatar.input.name)}" loading="lazy">
        <span>${esc(avatar.input.format || '9:16')}</span>
      </button>
      <div class="avatar-history-info"><strong>${esc(avatar.input.name)}</strong><small>${esc(avatar.input.niche)} · ${esc(formatDateShort(avatar.createdAt))}</small></div>
      <div class="avatar-history-actions">
        <button type="button" data-action="select-avatar" data-id="${esc(avatar.id)}">Abrir</button>
        <button type="button" data-action="download-avatar" data-id="${esc(avatar.id)}" aria-label="Descargar avatar">${icon('i-download')}</button>
        <button class="danger" type="button" data-action="delete-avatar" data-id="${esc(avatar.id)}" aria-label="Eliminar avatar">${icon('i-trash')}</button>
      </div>
    </article>`;
  }).join('');
}

function updateAvatarEngineNote() {
  const note = $('#avatar-engine-note');
  if (!note) return;
  const hasKey = Boolean(state.settings.pollinationsKey);
  note.classList.toggle('has-key', hasKey);
  note.innerHTML = hasKey
    ? `${icon('i-check')}Flux Dev activo. Tu clave de Pollinations queda como respaldo si el motor principal está ocupado.`
    : `${icon('i-info')}Generación gratuita con Flux Dev en un servicio externo. Si está ocupado, se usará un respaldo automático.`;
}

function renderAvatarFromState() {
  if (ui.avatarBusy) return;
  const result = state.lastAvatar;
  const actions = $('#avatar-actions');
  const output = $('#avatar-output');
  const title = $('#avatar-result-title');
  updateAvatarEngineNote();
  renderAvatarHistory();
  if (!output) return;
  if (!result) {
    if (actions) actions.hidden = true;
    if (title) title.textContent = 'Tu influencer aparecerá aquí';
    output.innerHTML = AVATAR_EMPTY_MARKUP;
    return;
  }
  if (actions) actions.hidden = false;
  if (title) title.textContent = `Avatar · ${result.input.name}`;
  output.innerHTML = avatarResultMarkup(result);
}

function showAvatarLoading() {
  ui.avatarBusy = true;
  const button = $('#avatar-submit');
  if (button) {
    button.disabled = true;
    button.innerHTML = `${icon('i-refresh')}Generando retrato…`;
  }
  const actions = $('#avatar-actions');
  if (actions) actions.hidden = true;
  const title = $('#avatar-result-title');
  if (title) title.textContent = 'Creando tu influencer…';
  const output = $('#avatar-output');
  if (!output) return;
  const started = Date.now();
  let index = 0;
  const paint = () => {
    const message = AVATAR_LOADING_MESSAGES[index % AVATAR_LOADING_MESSAGES.length];
    const elapsed = Math.round((Date.now() - started) / 1000);
    output.innerHTML = `<div class="avatar-loading">
      <div class="avatar-loading-frame"><span class="avatar-loading-scan"></span><span class="avatar-loading-label">Generando retrato · ${elapsed} s</span></div>
      <div class="avatar-loading-copy">
        <p class="eyebrow">Motor de imagen IA</p>
        <h3>${esc(message.title)}</h3>
        <p>${esc(message.sub)}</p>
        <div class="avatar-loading-steps">
          <span class="is-done">Brief y prompt traducidos</span>
          <span class="${index >= 1 ? 'is-done' : ''}">Rasgos y contexto definidos</span>
          <span class="${index >= 2 ? 'is-done' : ''}">Luz y encuadre ajustados</span>
          <span class="${index >= 3 ? 'is-done' : ''}">Kit de ventas preparado</span>
        </div>
        <p class="fine-print">La generación puede tardar entre 15 y 60 segundos. No cierres esta pestaña.</p>
      </div>
    </div>`;
    index += 1;
  };
  paint();
  window.clearInterval(ui.avatarLoadingTimer);
  ui.avatarLoadingTimer = window.setInterval(paint, 4200);
}

function stopAvatarLoading() {
  window.clearInterval(ui.avatarLoadingTimer);
  ui.avatarLoadingTimer = null;
  ui.avatarBusy = false;
  const button = $('#avatar-submit');
  if (!button) return;
  if (ui.avatarCooldownUntil > Date.now()) return;
  button.disabled = false;
  button.innerHTML = `${icon('i-sparkles')}Generar avatar con IA`;
}

function showAvatarError(error) {
  const output = $('#avatar-output');
  const title = $('#avatar-result-title');
  const actions = $('#avatar-actions');
  if (actions) actions.hidden = true;
  if (title) title.textContent = 'No se pudo generar el avatar';
  if (!output) return;
  const message = error?.message || 'La generación no respondió. Revisa tu conexión e inténtalo de nuevo.';
  output.innerHTML = `<div class="avatar-error">
    <span class="avatar-error-icon">${icon('i-image')}</span>
    <h3>La IA no terminó el retrato</h3>
    <p>${esc(message)}</p>
    <div class="avatar-error-actions">
      <button class="btn btn-primary" type="button" data-action="retry-avatar">${icon('i-refresh')}Reintentar</button>
      <button class="btn btn-ghost" type="button" data-action="open-settings">${icon('i-settings')}Abrir ajustes</button>
    </div>
    <p class="fine-print">${icon('i-info')}Si usas el modo gratuito, espera el tiempo indicado o conecta tu clave de Pollinations.</p>
  </div>`;
}

function startAvatarCooldown(seconds) {
  const wait = Math.max(5, Math.ceil(seconds || 45));
  ui.avatarCooldownUntil = Date.now() + wait * 1000;
  window.clearInterval(ui.avatarCooldownTimer);
  const button = $('#avatar-submit');
  const note = $('#avatar-cooldown');
  const tick = () => {
    const remaining = Math.ceil((ui.avatarCooldownUntil - Date.now()) / 1000);
    if (remaining <= 0) {
      window.clearInterval(ui.avatarCooldownTimer);
      ui.avatarCooldownTimer = null;
      ui.avatarCooldownUntil = 0;
      if (button) {
        button.disabled = false;
        button.innerHTML = `${icon('i-sparkles')}Generar avatar con IA`;
      }
      if (note) note.hidden = true;
      return;
    }
    if (button) {
      button.disabled = true;
      button.innerHTML = `${icon('i-clock')}Reintentar en ${remaining} s`;
    }
    if (note) {
      note.hidden = false;
      note.textContent = `Límite gratuito alcanzado. Espera ${remaining} s o conecta tu clave en Ajustes.`;
    }
  };
  tick();
  ui.avatarCooldownTimer = window.setInterval(tick, 1000);
}

function loadImageFromSource(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('La imagen generada no se pudo leer.'));
    image.src = source;
  });
}

async function normalizeAvatarBlob(blob) {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImageFromSource(objectUrl);
    const scale = Math.min(1, 640 / image.naturalWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext('2d');
    context.fillStyle = '#0a0d13';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function requestPixelSterImage(prompt, format) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch('https://ahm7xmakki.com/api/tti', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ prompt, ratio: format }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`El motor principal respondió ${response.status}.`);
    const data = await response.json();
    if (!data?.success || !data?.imageUrl) throw new Error('El motor principal no devolvió una imagen.');
    const imageResponse = await fetch(data.imageUrl, { signal: controller.signal, cache: 'no-store' });
    if (!imageResponse.ok) throw new Error('No se pudo descargar la imagen generada.');
    const blob = await imageResponse.blob();
    if (!blob.type.startsWith('image/')) throw new Error('El motor principal devolvió un archivo no válido.');
    return { image: await normalizeAvatarBlob(blob), provider: 'pixelster' };
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('El motor principal tardó demasiado.');
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function requestPollinationsImage(prompt, negativePrompt, seed) {
  const key = String(state.settings.pollinationsKey || '').trim();
  const headers = { Accept: 'image/jpeg,image/*' };
  let url;
  let provider;
  if (key) {
    provider = 'pollinations-key';
    url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=flux&width=768&height=1024&seed=${seed}&nologo=true&enhance=false&negative_prompt=${encodeURIComponent(negativePrompt)}`;
    headers.Authorization = `Bearer ${key}`;
  } else {
    provider = 'pollinations-free';
    url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=1024&seed=${seed}&nologo=true&enhance=true&negative_prompt=${encodeURIComponent(negativePrompt)}`;
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(url, { headers, signal: controller.signal, cache: 'no-store' });
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.startsWith('image/')) {
      const raw = await response.text();
      let message = raw.slice(0, 240);
      let retryAfter = 0;
      try {
        const data = JSON.parse(raw);
        message = data?.error?.message || data?.message || message;
      } catch {
        const retryMatch = raw.match(/Retry after (\d+)s/i);
        if (retryMatch) retryAfter = Number(retryMatch[1]);
      }
      const retryMatch = String(message).match(/Retry after (\d+)s/i);
      if (retryMatch) retryAfter = Number(retryMatch[1]);
      if (response.status === 402) retryAfter = retryAfter || 45;
      const error = new Error(message || 'El proveedor de imagen rechazó la solicitud.');
      error.retryAfter = retryAfter;
      throw error;
    }
    const blob = await response.blob();
    if (!blob.type.startsWith('image/')) throw new Error('El proveedor devolvió un archivo que no es una imagen.');
    return { image: await normalizeAvatarBlob(blob), provider };
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('El respaldo tardó demasiado. Inténtalo de nuevo.');
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function requestAvatarImage(prompt, negativePrompt, seed, format) {
  try {
    return await requestPixelSterImage(prompt, format);
  } catch (primaryError) {
    try {
      return await requestPollinationsImage(prompt, negativePrompt, seed);
    } catch (fallbackError) {
      const error = new Error('No se pudo generar el retrato. Los motores de imagen no respondieron o están ocupados. Espera un poco e inténtalo de nuevo.');
      error.retryAfter = fallbackError.retryAfter || 0;
      throw error;
    }
  }
}

async function generateAvatarFromInput(input) {
  const seed = Math.floor(Math.random() * 1000000000);
  const prompt = buildAvatarPrompt(input);
  const negativePrompt = buildAvatarNegativePrompt();
  showAvatarLoading();
  try {
    const image = await requestAvatarImage(prompt, negativePrompt, seed, input.format);
    const result = {
      id: uid('avatar'),
      input,
      prompt,
      negativePrompt,
      seed,
      image: image.image,
      provider: image.provider,
      kit: buildAvatarSalesKit(input),
      createdAt: new Date().toISOString()
    };
    state.lastAvatar = result;
    state.avatars = [result, ...state.avatars].slice(0, 8);
    saveState();
    stopAvatarLoading();
    renderAll();
    scrollToOutput('.avatar-output-panel');
    toast('Avatar generado con IA. Revisa el retrato y adapta el kit a tu voz.');
  } catch (error) {
    stopAvatarLoading();
    showAvatarError(error);
    if (error.retryAfter) startAvatarCooldown(error.retryAfter);
  }
}

function getAvatarById(id) {
  if (!id) return state.lastAvatar;
  return state.avatars.find((avatar) => avatar.id === id) || state.lastAvatar;
}

async function downloadAvatarImage(id) {
  const avatar = getAvatarById(id);
  if (!avatar) return;
  try {
    const image = await loadImageFromSource(avatar.image);
    const format = avatarFormat(avatar.input);
    const canvas = document.createElement('canvas');
    canvas.width = format.width;
    canvas.height = format.height;
    const context = canvas.getContext('2d');
    const sourceRatio = image.naturalWidth / image.naturalHeight;
    const targetRatio = format.width / format.height;
    let sx = 0;
    let sy = 0;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;
    if (sourceRatio > targetRatio) {
      sw = image.naturalHeight * targetRatio;
      sx = (image.naturalWidth - sw) / 2;
    } else {
      sh = image.naturalWidth / targetRatio;
      sy = (image.naturalHeight - sh) / 2;
    }
    context.fillStyle = '#0a0d13';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) throw new Error('No se pudo preparar la descarga.');
    const url = URL.createObjectURL(blob);
    const safeName = String(avatar.input.name || 'avatar').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'avatar';
    const link = document.createElement('a');
    link.href = url;
    link.download = `avatar-${safeName}-${format.width}x${format.height}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast('Avatar descargado en formato ' + format.label + '.');
  } catch {
    toast('No se pudo descargar la imagen. Inténtalo de nuevo.', 'error');
  }
}

function saveAvatarToLibrary() {
  const avatar = state.lastAvatar;
  if (!avatar) return;
  if (state.library.some((item) => item.sourceAvatarId === avatar.id)) {
    toast('Este avatar ya está en tu biblioteca.');
    return;
  }
  const now = new Date().toISOString();
  state.library.unshift({
    id: uid('lib'),
    type: 'avatar',
    title: `Avatar · ${avatar.input.name}`,
    platform: 'TikTok',
    tags: ['avatar IA', avatar.input.niche, avatar.input.personality],
    body: avatarKitBody(avatar),
    imageUrl: avatar.image,
    sourceAvatarId: avatar.id,
    createdAt: now,
    updatedAt: now,
    sample: false
  });
  saveState();
  renderAll();
  toast('Avatar y kit de ventas guardados en la biblioteca.');
}

function copyAvatarKit() {
  const avatar = state.lastAvatar;
  if (!avatar) return;
  copyText(avatarKitBody(avatar), 'Kit de ventas copiado.');
}

function useAvatarAsProfile() {
  const avatar = state.lastAvatar;
  if (!avatar) return;
  state.profile.avatarUrl = avatar.image;
  saveState();
  renderProfile();
  toast('Avatar aplicado a tu perfil local.');
}

function fillAvatarForm(input) {
  if (!input) return;
  const fields = {
    'avatar-name': input.name,
    'avatar-age': input.age,
    'avatar-product': input.product,
    'avatar-niche': input.niche,
    'avatar-presentation': input.presentation,
    'avatar-look': input.look,
    'avatar-personality': input.personality,
    'avatar-setting': input.setting,
    'avatar-outfit': input.outfit,
    'avatar-format': input.format,
    'avatar-notes': input.notes
  };
  Object.entries(fields).forEach(([id, value]) => {
    const field = $(`#${id}`);
    if (!field) return;
    field.classList.remove('is-invalid');
    if (value !== undefined && value !== null) field.value = value;
  });
}

function selectAvatar(id) {
  const avatar = getAvatarById(id);
  if (!avatar) return;
  state.lastAvatar = avatar;
  fillAvatarForm(avatar.input);
  saveState();
  renderAvatarFromState();
  scrollToOutput('.avatar-output-panel');
}

function deleteAvatar(id) {
  const avatar = state.avatars.find((item) => item.id === id);
  if (!avatar) return;
  openConfirm({
    title: 'Eliminar avatar',
    message: `Se eliminará “${avatar.input.name}” y su kit de ventas del historial de este dispositivo. Si lo guardaste en la biblioteca, esa copia se conserva.`,
    label: 'Eliminar avatar',
    onConfirm: () => {
      state.avatars = state.avatars.filter((item) => item.id !== id);
      if (state.lastAvatar?.id === id) {
        state.lastAvatar = state.avatars[0] || null;
        fillAvatarForm(state.lastAvatar?.input);
      }
      saveState();
      renderAll();
      toast('Avatar eliminado del historial.');
    }
  });
}
