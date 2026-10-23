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
