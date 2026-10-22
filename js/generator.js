'use strict';

const NICHE_DATA = {
  'Finanzas personales': {
    keyword: 'finanzas personales',
    hashtags: ['FinanzasPersonales', 'DineroInteligente', 'Ahorro'],
    myth: 'no es falta de ingresos: casi siempre es falta de un sistema visible.',
    context: 'Cuando tus números viven en la cabeza, cualquier gasto inesperado se siente como una emergencia.',
    tips: [
      'separa una cantidad pequeña apenas recibas dinero y automatiza la transferencia.',
      'revisa suscripciones y gastos hormiga durante cinco minutos antes de dormir.'
    ],
    cta: 'Guarda este video y aplica solo el primer paso hoy.'
  },
  'Tecnología': {
    keyword: 'tecnología',
    hashtags: ['Tecnologia', 'TutorialTech', 'Productividad'],
    myth: 'la herramienta más cara no siempre es la que te ahorra más tiempo.',
    context: 'La diferencia entre una buena herramienta y una distracción es el problema que resuelve.',
    tips: [
      'define una sola tarea que quieras automatizar y mide cuánto tiempo te toma hoy.',
      'configura un flujo simple antes de agregar otra aplicación a tu teléfono.'
    ],
    cta: 'Comenta qué herramienta quieres probar y guarda esto para tu próxima compra.'
  },
  'Cocina': {
    keyword: 'cocina',
    hashtags: ['CocinaFacil', 'RecetasMexicanas', 'ComidaCasera'],
    myth: 'una receta rica no necesita veinte ingredientes ni una cocina profesional.',
    context: 'El secreto está en preparar los básicos una vez y combinarlos durante la semana.',
    tips: [
      'prepara una base que puedas reutilizar en dos o tres comidas.',
      'mide las especias antes de encender el fuego para no improvisar de más.'
    ],
    cta: 'Guarda la receta y cuéntame cómo te quedó en los comentarios.'
  },
  'Fitness': {
    keyword: 'fitness',
    hashtags: ['FitnessMexico', 'RutinaEnCasa', 'Salud'],
    myth: 'no necesitas dos horas en el gimnasio para empezar a notar progreso.',
    context: 'La constancia con una rutina corta suele vencer al entusiasmo de una semana intensa.',
    tips: [
      'elige tres movimientos básicos y repítelos con una técnica que puedas controlar.',
      'agenda tu sesión como una cita y registra cómo te sientes al terminar.'
    ],
    cta: 'Guarda esta rutina y hazla conmigo mañana.'
  },
  'Belleza': {
    keyword: 'belleza',
    hashtags: ['Belleza', 'SkincareMexico', 'Maquillaje'],
    myth: 'más producto no siempre significa mejor resultado: la técnica y la constancia importan más.',
    context: 'Una rutina que puedes sostener es más poderosa que diez pasos que abandonas en una semana.',
    tips: [
      'empieza con menos productos y observa cómo responde tu piel durante varios días.',
      'aplica el producto en capas finas para controlar el acabado.'
    ],
    cta: 'Cuéntame tu paso favorito y guarda esto para tu próxima rutina.'
  },
  'Emprendimiento': {
    keyword: 'emprendimiento',
    hashtags: ['Emprendimiento', 'Negocios', 'MarcaPersonal'],
    myth: 'lanzar no exige tener todo perfecto; exige resolver un problema real para alguien.',
    context: 'La primera versión sirve para aprender, no para demostrar que nunca te equivocas.',
    tips: [
      'escribe en una frase el problema y el resultado que prometes.',
      'habla con tres personas antes de sumar una función nueva a tu producto.'
    ],
    cta: 'Sígueme para más decisiones prácticas de negocio.'
  },
  'Educación': {
    keyword: 'educación',
    hashtags: ['AprendeConmigo', 'Educacion', 'EstudiaMejor'],
    myth: 'estudiar más horas no siempre funciona si no tienes una forma activa de recuperar lo aprendido.',
    context: 'Explicar una idea con tus palabras revela rápido qué entendiste y qué solo reconoces.',
    tips: [
      'cierra el material y explica el concepto en voz alta durante un minuto.',
      'haz una pregunta de práctica antes de volver a leer la teoría.'
    ],
    cta: 'Guarda este método y pruébalo en tu próxima sesión de estudio.'
  },
  'Humor': {
    keyword: 'humor',
    hashtags: ['Humor', 'Comedia', 'Mexico'],
    myth: 'lo que realmente conecta es el detalle cotidiano que todos reconocen al instante.',
    context: 'Una situación exagerada solo funciona si se siente verdadera durante los primeros segundos.',
    tips: [
      'empieza con una acción clara y deja el remate para el final.',
      'usa un detalle visual específico en lugar de explicar el chiste.'
    ],
    cta: 'Etiqueta a la persona que hace exactamente esto.'
  },
  'Viajes': {
    keyword: 'viajes',
    hashtags: ['Viajes', 'Mochilero', 'MexicoTravel'],
    myth: 'viajar más barato no depende solo del destino, sino de cuándo y cómo reservas.',
    context: 'Un poco de planeación puede liberar presupuesto para la parte que realmente disfrutas.',
    tips: [
      'define primero el presupuesto total y después elige fechas flexibles.',
      'reserva lo importante con anticipación y deja margen para lo improvisado.'
    ],
    cta: 'Guarda esto para tu próximo viaje y cuéntame tu destino.'
  },
  'Hogar': {
    keyword: 'hogar',
    hashtags: ['Hogar', 'Organizacion', 'CasaOrdenada'],
    myth: 'organizar no es tener más cosas, es decidir dónde vive cada cosa.',
    context: 'Un sistema sencillo que puedes mantener vale más que una limpieza perfecta de un día.',
    tips: [
      'despeja una sola superficie y dale un lugar fijo a cada objeto.',
      'dedica cinco minutos diarios en lugar de esperar la maratón del fin de semana.'
    ],
    cta: 'Guarda este tip y etiqueta a quien necesita ordenar su espacio.'
  }
};

const STYLE_DATA = {
  'Cinemático': {
    palette: 'paleta de azul profundo, destellos verde lima y sombras suaves',
    lighting: 'luz lateral cálida con un contorno frío',
    camera: 'lente de 35 mm, profundidad de campo media',
    motion: 'movimiento lento y estabilizado',
    texture: 'grano fino y contraste cinematográfico'
  },
  'Minimalista': {
    palette: 'fondo beige oscuro, acentos blancos y un solo color de marca',
    lighting: 'luz difusa y pareja, sombras mínimas',
    camera: 'lente de 50 mm, composición centrada',
    motion: 'paneos cortos y transiciones limpias',
    texture: 'superficies planas y acabado nítido'
  },
  'Documental': {
    palette: 'tonos tierra, piel natural y acentos neutros',
    lighting: 'luz práctica de ventana, sin artificios',
    camera: 'cámara en mano sutil, lente de 28 mm',
    motion: 'seguimiento orgánico y pausas reales',
    texture: 'textura de cámara digital y color natural'
  },
  'Neón / futurista': {
    palette: 'negro azulado, violeta eléctrico y cian',
    lighting: 'luces de neón y reflejos húmedos',
    camera: 'lente anamórfica, flares controlados',
    motion: 'dolly lento con parallax de profundidad',
    texture: 'brillo limpio y atmósfera con neblina'
  },
  'Analógico / vintage': {
    palette: 'ámbar, verde oliva y rojo desaturado',
    lighting: 'luz cálida con ligera dominante amarilla',
    camera: 'lente vintage de 40 mm, bordes suaves',
    motion: 'zoom mecánico y transiciones con fundido',
    texture: 'grano de película, polvo sutil y halación'
  },
  '3D limpio': {
    palette: 'fondo gris carbón, superficies mate y acento lima',
    lighting: 'estudio de tres puntos, reflejos suaves',
    camera: 'perspectiva isométrica y órbita controlada',
    motion: 'animación fluida con curvas suaves',
    texture: 'acabado plástico mate y bordes definidos'
  }
};

const FORMAT_BEATS = {
  'Tutorial paso a paso': ['El problema', 'La preparación', 'Primer paso', 'Segundo paso', 'Resultado final'],
  'Historia personal': ['El detalle cotidiano', 'El punto de quiebre', 'La decisión', 'El cambio', 'La reflexión'],
  'Antes y después': ['El estado inicial', 'La chispa', 'La transformación', 'El detalle clave', 'El resultado'],
  'Demostración de producto': ['El gancho visual', 'El producto en contexto', 'La función clave', 'La prueba', 'El cierre'],
  'Lista rápida': ['La promesa', 'Punto uno', 'Punto dos', 'Punto tres', 'El resumen']
};

function generateContent(input) {
  const niche = NICHE_DATA[input.niche] || NICHE_DATA['Finanzas personales'];
  const topic = input.topic.trim().replace(/[.!?]+$/, '');
  const topicLower = topic.charAt(0).toLowerCase() + topic.slice(1);
  const topicCore = topicLower.replace(/^c[oó]mo\s+/i, '').replace(/^por qu[eé]\s+/i, '');
  const objectiveCta = {
    'Más vistas': 'Comparte esto si te sirvió y guarda el video para volver a verlo.',
    'Más seguidores': 'Sígueme para más contenido práctico sobre este tema.',
    'Más comentarios': 'Cuéntame en comentarios qué parte te cuesta más y lo resolvemos.',
    'Vender un producto': 'Escríbeme “quiero” y te comparto los siguientes pasos, sin compromiso.',
    'Educar a la audiencia': 'Guarda esta explicación para tu próxima práctica.'
  }[input.objective] || niche.cta;
  const tonePrefix = {
    'Directo y cercano': 'sin rodeos',
    'Educativo': 'con un ejemplo claro',
    'Entretenido': 'con una historia que se siente real',
    'Inspirador': 'desde lo que sí está en tus manos',
    'Polémico y responsable': 'con una opinión que invita a pensar'
  }[input.tone] || 'sin rodeos';
  const hooks = [
    `“${topic}” no se trata de hacer más: se trata de hacerlo con intención.`,
    `Si estás atorado con ${topicCore}, esto te va a ahorrar semanas.`,
    `Nadie te cuenta lo que realmente hay detrás de ${topicCore}.`,
    `Esto es lo que cambió mi forma de abordar ${topicCore}.`,
    `${topic}: tres decisiones que cambian el resultado.`
  ];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];
  const titles = [
    /\bsin\b/i.test(topic) ? `${topic}: 3 claves para aplicarlo` : `${topic} sin complicarte`,
    `La forma más simple de ${topicCore}`,
    `${topic}: 3 claves que casi nadie aplica`,
    `Deja de fallar con ${topicCore}. Empieza por esto.`,
    `${input.niche} en práctica: ${topic}`
  ];
  const beatLabels = input.duration <= 30
    ? ['Gancho', 'Contexto', 'Desarrollo', 'Cierre']
    : ['Gancho', 'Contexto', 'Valor 1', 'Valor 2', 'Cierre'];
  const ratios = input.duration <= 30 ? [0.18, 0.2, 0.42, 0.2] : [0.14, 0.16, 0.23, 0.23, 0.24];
  const descriptions = [
    hook,
    `La mayoría comete este error con ${topicCore}: ${niche.myth} ${niche.context}`,
    `Primero: ${niche.tips[0]} La clave es hacerlo ${tonePrefix}.`,
    `Segundo: ${niche.tips[1]} No necesitas hacerlo perfecto para empezar.`,
    `${objectiveCta} ${niche.cta}`
  ];
  let elapsed = 0;
  const script = beatLabels.map((label, index) => {
    const start = Math.round(elapsed);
    const length = Math.max(2, Math.round(input.duration * ratios[index]));
    elapsed += input.duration * ratios[index];
    const end = index === beatLabels.length - 1 ? input.duration : Math.round(elapsed);
    const notes = [
      'Primer plano, mirada a cámara y texto breve en pantalla.',
      'Plano medio. Muestra el contexto o el problema en una imagen concreta.',
      'B-roll del proceso. Cortes rápidos y un detalle visual que explique el paso.',
      'Plano detalle del resultado o de la herramienta que estás usando.',
      'Plano medio final. Repite la idea central y deja espacio para el CTA.'
    ];
    return {
      time: `${start}–${Math.max(end, start + 2)} s`,
      length,
      label,
      text: descriptions[index] || descriptions[descriptions.length - 1],
      note: notes[index] || notes[notes.length - 1]
    };
  });
  const shots = ['primer plano a cámara', 'plano medio con objeto en mano', 'b-roll del proceso', 'plano detalle del resultado', 'plano medio con texto final'];
  const scenes = script.map((beat, index) => ({
    number: index + 1,
    title: beat.label,
    time: beat.time,
    description: `${shots[index]}. ${beat.label === 'Gancho' ? `Abre con una frase visual sobre ${topicCore}.` : `Ilustra ${beat.label.toLowerCase()} con un recurso concreto del tema.`}`,
    shot: index === 0 ? 'Primer plano vertical, sujeto centrado' : index === script.length - 1 ? 'Plano medio final, espacio para CTA' : 'Plano detalle con movimiento controlado'
  }));
  const platformTag = input.platform === 'TikTok' ? 'TikTokMexico' : input.platform === 'Facebook Reels' ? 'Reels' : 'Shorts';
  const textTags = topic.split(/\s+/).filter((word) => word.length > 3).slice(0, 2).map(hashtagify).filter(Boolean);
  const hashtags = Array.from(new Set([
    ...niche.hashtags,
    platformTag,
    'CreadoresMexicanos',
    'CreatorIA',
    ...textTags
  ])).slice(0, 12);
  const platformCta = input.platform === 'YouTube Shorts'
    ? 'Suscríbete si quieres más videos prácticos.'
    : input.platform === 'Facebook Reels'
      ? 'Comparte este Reel con alguien que lo necesite.'
      : 'Guarda este video y cuéntame tu resultado en comentarios.';
  const description = `${topic} — te explico lo que sí puedes aplicar ${tonePrefix}.\n\n${objectiveCta}\n\n${platformCta}\n\n${hashtags.map((tag) => `#${tag}`).join(' ')}`;
  return {
    id: uid('gen'),
    createdAt: new Date().toISOString(),
    input,
    hook,
    titles,
    hooks,
    script,
    scenes,
    description,
    hashtags,
    objectiveCta,
    selectedTitle: titles[0]
  };
}

function generatorResultHTML(result) {
  return `<div class="result-meta">
    <span class="meta-badge">${platformDot(result.input.platform)}${esc(result.input.platform)}</span>
    <span class="meta-badge">${icon('i-clock')}${esc(result.input.duration)} s</span>
    <span class="meta-badge">${icon('i-layers')}${esc(result.input.niche)}</span>
    <span class="meta-badge">${icon('i-wand')}Plantilla local</span>
    <span class="meta-badge">${esc(formatDateShort(new Date(result.createdAt)))}</span>
  </div>
  <div class="result-section">
    <div class="result-section-head"><h4>${icon('i-target')}Ganchos de apertura</h4><span>Elige uno</span></div>
    <div class="result-list">${result.hooks.map((hook, index) => `<div class="result-line"><span class="line-index">${index + 1}</span><span>${esc(hook)}</span></div>`).join('')}</div>
  </div>
  <div class="result-section">
    <div class="result-section-head"><h4>${icon('i-file')}Guion por bloques</h4><span>${esc(result.input.duration)} s</span></div>
    <div class="script-timeline">${result.script.map((beat) => `<div class="script-block">
      <span class="script-time">${esc(beat.time)}</span>
      <div class="script-content"><strong><span></span>${esc(beat.label)}</strong><p>${esc(beat.text)}</p><small>${esc(beat.note)}</small></div>
    </div>`).join('')}</div>
  </div>
  <div class="result-section">
    <div class="result-section-head"><h4>${icon('i-image')}Escenas sugeridas</h4><span>Storyboard rápido</span></div>
    <div class="scene-mini-grid">${result.scenes.map((scene) => `<div class="scene-mini"><span>${icon('i-play')}Escena ${scene.number}</span><strong>${esc(scene.title)}</strong><p>${esc(scene.description)}</p></div>`).join('')}</div>
  </div>
  <div class="result-section">
    <div class="result-section-head"><h4>${icon('i-trending')}Títulos para probar</h4><span>5 variantes</span></div>
    <div class="result-list">${result.titles.map((title, index) => `<div class="result-line"><span class="line-index">${index + 1}</span><span>${esc(title)}</span></div>`).join('')}</div>
  </div>
  <div class="result-section">
    <div class="result-section-head"><h4>${icon('i-send')}Descripción</h4><span>Lista para editar</span></div>
    <div class="copy-line">${esc(result.description).replaceAll('\n', '<br>')}<button type="button" data-action="copy-description" aria-label="Copiar descripción">${icon('i-copy')}</button></div>
  </div>
  <div class="result-section">
    <div class="result-section-head"><h4>${icon('i-hash')}Hashtags</h4><span>${result.hashtags.length} etiquetas</span></div>
    <div class="tag-list">${result.hashtags.map((tag) => `<span class="tag accent">#${esc(tag)}</span>`).join('')}</div>
  </div>`;
}

function renderGeneratorResult(result, scroll = true) {
  const output = $('#generator-output');
  const title = $('#generator-result-title');
  if (!output) return;
  output.classList.add('has-result');
  output.innerHTML = generatorResultHTML(result);
  if (title) title.textContent = result.selectedTitle || result.titles[0] || 'Contenido generado';
  setGeneratorActions(true);
  if (scroll) output.scrollTop = 0;
}

function distributeSceneDurations(total, weights) {
  const values = weights.map((weight) => Math.max(2, Math.round(total * weight)));
  let difference = total - values.reduce((sum, value) => sum + value, 0);
  let guard = 0;
  while (difference !== 0 && guard < 500) {
    const index = difference > 0 ? guard % values.length : values.length - 1 - (guard % values.length);
    if (difference < 0 && values[index] <= 2) {
      guard += 1;
      continue;
    }
    values[index] += difference > 0 ? 1 : -1;
    difference += difference > 0 ? -1 : 1;
    guard += 1;
  }
  return values;
}

function storyboardTotalDuration(result) {
  return (result?.scenes || []).reduce((total, scene) => total + Number(scene.duration || 0), 0);
}

function recalculateSceneTiming(result) {
  let elapsed = 0;
  result.scenes.forEach((scene) => {
    const duration = Math.max(2, Math.min(20, Math.round(Number(scene.duration) || 2)));
    scene.duration = duration;
    scene.start = elapsed;
    scene.end = elapsed + duration;
    scene.time = `${elapsed}–${elapsed + duration} s`;
    elapsed += duration;
  });
  result.totalDuration = elapsed;
  return elapsed;
}

function masterSubject(input) {
  return `${input.characters || 'una creadora'} con ${input.wardrobe || 'vestuario coherente'}`;
}

function sceneLocation(input) {
  return input.locations || 'un espacio coherente con la marca';
}

function buildSceneImagePrompt(result, scene, kind = 'start') {
  const input = result.input;
  const style = result.style || STYLE_DATA[input.style] || STYLE_DATA['Cinemático'];
  const base = kind === 'start'
    ? scene.visual
    : `${scene.visual} En el punto final del movimiento: ${scene.action}`;
  return `Vertical 9:16 cinematic still for ${input.platform}. Scene ${scene.number}, ${base} Character: ${input.characters}. Wardrobe: ${input.wardrobe}. Location: ${input.locations}. Lighting: ${input.lighting}. Style: ${input.style}, ${style.palette}, ${style.texture}. Composition: ${scene.framing}. Keep the master sheet consistent. Natural realistic detail, no text, no logo, no watermark, no collage, no split screen.`;
}

function buildSceneAnimationPrompt(result, scene) {
  const style = result.style || STYLE_DATA[result.input.style] || STYLE_DATA['Cinemático'];
  const motions = [
    'subtle natural movement with a stable, controlled pace',
    'gentle weight shift and small environmental motion',
    'smooth continuous motion with a soft settle at the end',
    'quiet realistic movement, keeping the framing clean'
  ];
  const revision = Number(scene.promptRevision || 0);
  const character = (result.input.characters || 'the creator').split(',')[0].trim();
  return `${scene.camera}. ${scene.action} ${character} stays visually consistent. ${motions[revision % motions.length]}. ${scene.duration}s single continuous vertical 9:16 shot from the initial frame to the final frame; ${style.motion}; no cuts, no text, no logos.`;
}

function generateStoryboard(input) {
  const style = STYLE_DATA[input.style] || STYLE_DATA['Cinemático'];
  const beats = FORMAT_BEATS[input.format] || FORMAT_BEATS['Tutorial paso a paso'];
  const sceneCount = input.duration <= 15 ? 4 : 5;
  const selectedBeats = beats.slice(0, sceneCount);
  const weights = sceneCount === 4 ? [0.16, 0.27, 0.33, 0.24] : [0.12, 0.18, 0.24, 0.24, 0.22];
  const durations = distributeSceneDurations(input.duration, weights);
  const framings = ['Primer plano vertical', 'Plano medio', 'Plano detalle', 'Plano medio con movimiento', 'Plano general del resultado'];
  const cameras = ['Acercamiento lento', 'Paneo lateral suave', 'Seguimiento a mano', 'Órbita controlada', 'Alejamiento lento'];
  const transitions = ['Corte directo al compás', 'Transición por movimiento', 'Match cut', 'Fundido corto', 'Corte limpio al CTA'];
  const shots = ['primer plano a cámara', 'plano medio con el producto en contexto', 'b-roll del proceso', 'plano detalle del resultado', 'plano medio final con espacio para CTA'];
  const subject = input.topic.trim().replace(/[.!?]+$/, '');
  let elapsed = 0;
  const scenes = selectedBeats.map((beat, index) => {
    const duration = durations[index];
    const start = elapsed;
    const end = start + duration;
    elapsed = end;
    const framing = framings[index] || framings[framings.length - 1];
    const camera = cameras[index] || cameras[cameras.length - 1];
    const transition = transitions[index] || transitions[transitions.length - 1];
    const visual = `${shots[index] || shots[shots.length - 1]} de ${subject.toLowerCase()}. ${index === 0 ? `Abre con una imagen clara de ${input.characters || 'la persona principal'} en ${input.locations || 'el escenario principal'}.` : `Ilustra ${beat.toLowerCase()} en ${input.locations || 'el escenario principal'} sin perder la continuidad.`}`;
    const action = index === 0
      ? `Presenta el gancho visual con ${subject.toLowerCase()} y mira a cámara al final del plano.`
      : index === selectedBeats.length - 1
        ? 'Cierra con el resultado visible y deja aire para el texto final.'
        : `Muestra ${beat.toLowerCase()} con un recurso visual concreto y un gesto natural.`;
    const scene = {
      number: index + 1,
      title: beat,
      duration,
      start,
      end,
      time: `${start}–${end} s`,
      framing,
      visual,
      action,
      camera,
      transition,
      includeEnd: true,
      promptRevision: 0,
      images: { start: null, end: null }
    };
    scene.startPrompt = buildSceneImagePrompt({ input, style }, scene, 'start');
    scene.endPrompt = buildSceneImagePrompt({ input, style }, scene, 'end');
    scene.animationPrompt = buildSceneAnimationPrompt({ input, style }, scene);
    return scene;
  });
  const result = {
    id: uid('story'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    input,
    style,
    scenes,
    masterPrompt: `Create a cohesive ${input.style.toLowerCase()} vertical 9:16 video for ${input.platform} about "${subject}". Master sheet — characters: ${input.characters}. Wardrobe: ${input.wardrobe}. Locations: ${input.locations}. Lighting: ${input.lighting}. Visual direction: ${input.art}. Palette: ${style.palette}. Camera: ${style.camera}. Motion: ${style.motion}. Texture: ${style.texture}. Keep character, wardrobe and location consistent across all scenes. No text overlays, no logos, no watermarks.`
  };
  recalculateSceneTiming(result);
  return result;
}

function sceneImageMeta(image) {
  if (!image) return '';
  const names = { pollinations: 'Pollinations', pixelster: 'Flux', gemini: 'Gemini', openai: 'OpenAI' };
  const provider = names[image.provider] || image.provider || 'IA';
  return `${provider}${image.referenceUsed ? ' · referencia' : ''}`;
}

function sceneFrameHTML(result, scene, kind) {
  const index = scene.number - 1;
  const key = `${index}-${kind}`;
  const isEnd = kind === 'end';
  const prompt = isEnd ? scene.endPrompt : scene.startPrompt;
  const image = scene.images?.[kind] || null;
  const busy = ui.studioImageBusy.has(key);
  const error = ui.studioImageErrors[key];
  const label = isEnd ? 'Imagen final' : 'Imagen inicial';
  if (isEnd && !scene.includeEnd) {
    return `<div class="studio-frame is-off">
      <div class="studio-frame-head"><span>${label} · opcional</span><span>Omitido</span></div>
      <div class="studio-frame-omitted"><span>Sin frame final</span><button class="btn btn-tiny btn-ghost" type="button" data-action="toggle-scene-end" data-index="${index}">Añadir final</button></div>
    </div>`;
  }
  return `<div class="studio-frame ${isEnd ? 'is-end' : ''}">
    <div class="studio-frame-head"><span>${label}</span><span>${image ? esc(sceneImageMeta(image)) : 'Pendiente'}</span></div>
    <div class="studio-frame-media ${image ? 'has-image' : ''}">
      ${image
        ? `<img src="${image.image}" alt="${esc(label)} de la escena ${scene.number}: ${esc(scene.title)}" loading="lazy">`
        : `<div class="studio-frame-placeholder">${icon('i-image')}<span>${prompt ? 'Lista para generar' : 'Sin prompt'}</span></div>`}
      ${busy ? `<div class="studio-frame-busy"><span class="spinner"></span><small>Generando…</small></div>` : ''}
      <span class="studio-frame-ratio">9:16</span>
    </div>
    ${error ? `<p class="studio-frame-error">${icon('i-info')}${esc(error)} <button type="button" data-action="generate-scene-image" data-index="${index}" data-kind="${kind}">Reintentar</button></p>` : ''}
    <div class="studio-frame-actions">
      <button class="btn btn-tiny ${image ? 'btn-ghost' : 'btn-primary'}" type="button" data-action="generate-scene-image" data-index="${index}" data-kind="${kind}" ${busy || !prompt ? 'disabled' : ''}>${icon('i-refresh')}${image ? 'Regenerar' : 'Generar'}</button>
      ${image ? `<button class="btn btn-tiny btn-ghost" type="button" data-action="download-scene-image" data-index="${index}" data-kind="${kind}">${icon('i-download')}Descargar</button>` : ''}
      ${isEnd ? `<button class="btn btn-tiny btn-ghost" type="button" data-action="toggle-scene-end" data-index="${index}">${icon('i-x')}Quitar final</button>` : ''}
    </div>
    <details class="studio-frame-prompt">
      <summary>Prompt de imagen <span>${prompt ? `${prompt.length} caracteres` : 'sin prompt'}</span></summary>
      <p>${esc(prompt || 'Sin prompt para este frame.')}</p>
      <button type="button" data-action="copy-scene-image-prompt" data-index="${index}" data-kind="${kind}" aria-label="Copiar prompt de imagen">${icon('i-copy')}Copiar prompt</button>
    </details>
  </div>`;
}

function studioMasterHTML(result) {
  const input = result.input;
  return `<div class="studio-master">
    <div class="studio-master-head">
      <div><p class="eyebrow">Ficha maestra</p><h4>Continuidad visual del proyecto</h4></div>
      <span class="meta-badge">${icon('i-lock')}9:16</span>
    </div>
    <div class="studio-master-grid">
      <div><span>Personajes</span><p>${esc(input.characters || 'Sin definir')}</p></div>
      <div><span>Vestuario</span><p>${esc(input.wardrobe || 'Sin definir')}</p></div>
      <div><span>Escenarios</span><p>${esc(input.locations || 'Sin definir')}</p></div>
      <div><span>Iluminación</span><p>${esc(input.lighting || 'Sin definir')}</p></div>
    </div>
    <div class="studio-master-foot">
      <p><span>Dirección de arte</span>${esc(input.art)}</p>
      ${input.referenceImage ? `<div class="studio-reference-thumb"><img src="${input.referenceImage}" alt="Referencia visual del proyecto"><span>Referencia visual</span></div>` : '<span class="studio-reference-none">Sin imagen de referencia</span>'}
    </div>
  </div>`;
}

function studioProgressHTML() {
  const batch = ui.studioBatch;
  if (!batch) return '';
  const percent = batch.total ? Math.round((batch.done / batch.total) * 100) : 0;
  return `<div class="studio-progress" id="studio-image-progress" role="status">
    <div class="studio-progress-top"><strong>${batch.running ? 'Generando imágenes' : batch.errors.length ? 'Generación con errores' : 'Imágenes listas'}</strong><span>${batch.done}/${batch.total}</span></div>
    <div class="studio-progress-bar"><span style="width:${percent}%"></span></div>
    <div class="studio-progress-foot">
      <span>${batch.running ? esc(batch.current || 'Preparando la siguiente imagen…') : batch.errors.length ? `${batch.errors.length} imagen(es) necesitan reintento.` : 'Todos los frames se generaron correctamente.'}</span>
      ${batch.errors.length && !batch.running ? `<button class="btn btn-tiny btn-ghost" type="button" data-action="retry-failed-images">${icon('i-refresh')}Reintentar fallidas</button>` : ''}
    </div>
  </div>`;
}

function storyboardSceneHTML(result, scene) {
  const index = scene.number - 1;
  return `<article class="storyboard-card" data-scene="${index}">
    <div class="storyboard-top">
      <span class="scene-number">${scene.number}</span>
      <strong>${esc(scene.title)}</strong>
      <span>${esc(scene.time)} · ${esc(scene.duration)} s</span>
    </div>
    <div class="scene-visual">
      <span>Descripción visual</span>
      <p>${esc(scene.visual)}</p>
    </div>
    <div class="studio-frame-grid">${sceneFrameHTML(result, scene, 'start')}${sceneFrameHTML(result, scene, 'end')}</div>
    <div class="storyboard-details studio-scene-details">
      <div class="storyboard-detail"><span>Duración individual</span><p><input class="scene-duration-input" type="number" min="2" max="20" step="1" value="${scene.duration}" data-scene-duration="${index}" aria-label="Duración de la escena ${scene.number} en segundos"> s</p></div>
      <div class="storyboard-detail"><span>Movimiento de cámara</span><p>${esc(scene.camera)}</p></div>
      <div class="storyboard-detail"><span>Acción</span><p>${esc(scene.action)}</p></div>
      <div class="storyboard-detail"><span>Transición</span><p>${esc(scene.transition)}</p></div>
      <div class="storyboard-detail"><span>Encuadre</span><p>${esc(scene.framing)}</p></div>
    </div>
    <div class="prompt-box">
      <div class="prompt-box-head"><small>${icon('i-wand')}Prompt de animación independiente</small><span>${esc(scene.duration)} s</span></div>
      <p>${esc(scene.animationPrompt)}</p>
      <div class="prompt-box-actions">
        <button type="button" data-action="regenerate-animation-prompt" data-index="${index}" aria-label="Regenerar prompt de animación">${icon('i-refresh')}Regenerar</button>
        <button type="button" data-action="copy-scene" data-index="${index}" aria-label="Copiar prompt de animación">${icon('i-copy')}Copiar</button>
      </div>
    </div>
  </article>`;
}

function renderStoryboardResult(result, scroll = true) {
  const output = $('#studio-output');
  const title = $('#studio-result-title');
  if (!output) return;
  recalculateSceneTiming(result);
  output.classList.add('has-result');
  const total = storyboardTotalDuration(result);
  output.innerHTML = `<div class="result-meta">
    <span class="meta-badge">${platformDot(result.input.platform)}${esc(result.input.platform)}</span>
    <span class="meta-badge">${icon('i-clock')}${total} s en ${result.scenes.length} escenas</span>
    <span class="meta-badge">${icon('i-image')}${esc(result.input.style)}</span>
    <span class="meta-badge">${icon('i-layers')}9:16</span>
  </div>
  ${studioProgressHTML()}
  ${studioMasterHTML(result)}
  <div class="studio-summary">
    <h4>${icon('i-wand')}Prompt maestro de consistencia</h4>
    <p>${esc(result.masterPrompt)}</p>
  </div>
  <div class="storyboard-list">${result.scenes.map((scene) => storyboardSceneHTML(result, scene)).join('')}</div>`;
  if (title) title.textContent = compactTitle(result.input.topic, 72);
  setStudioActions(true);
  if (typeof updateStudioActionState === 'function') updateStudioActionState();
  if (scroll) output.scrollTop = 0;
}
