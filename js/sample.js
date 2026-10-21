'use strict';

function buildSampleData() {
  const relative = (offset) => addDaysISO(todayISO(), offset);
  const publications = [
    { offset: -18, title: '3 errores al presupuestar en México', platform: 'TikTok', format: 'Video vertical', time: '19:00', status: 'Publicado' },
    { offset: -14, title: 'Esta app me ahorra 5 horas al mes', platform: 'YouTube Shorts', format: 'Short', time: '18:30', status: 'Publicado' },
    { offset: -9, title: 'Rutina de edición en 60 segundos', platform: 'Facebook Reels', format: 'Reel', time: '20:00', status: 'Publicado' },
    { offset: -5, title: 'Cómo organizar tus finanzas con $500', platform: 'TikTok', format: 'Video vertical', time: '19:30', status: 'Publicado' },
    { offset: -2, title: 'Antes y después de mi escritorio', platform: 'Facebook Reels', format: 'Reel', time: '18:00', status: 'Publicado' },
    { offset: 1, title: '5 herramientas para creadores', platform: 'YouTube Shorts', format: 'Short', time: '18:00', status: 'Programado' },
    { offset: 3, title: 'El error de publicar sin gancho', platform: 'TikTok', format: 'Video vertical', time: '19:00', status: 'Edición' },
    { offset: 5, title: 'Cocina rápida para semana ocupada', platform: 'Facebook Reels', format: 'Reel', time: '13:00', status: 'Grabación' },
    { offset: 8, title: 'Guion: mitos de productividad', platform: 'YouTube Shorts', format: 'Short', time: '17:30', status: 'Guion' },
    { offset: 11, title: 'Idea: mi setup de grabación barato', platform: 'TikTok', format: 'Video vertical', time: '19:00', status: 'Idea' }
  ].map((item) => ({
    id: uid('sm_pub'),
    date: relative(item.offset),
    title: item.title,
    platform: item.platform,
    format: item.format,
    time: item.time,
    status: item.status,
    notes: 'Registro de demostración. No representa actividad real.',
    sample: true
  }));

  const metricSeeds = [
    { offset: -1, platform: 'TikTok', title: 'Cómo organizar tus finanzas con $500', views: 18400, retention: 41, comments: 214, shares: 389, clicks: 512, followers: 286 },
    { offset: -2, platform: 'Facebook Reels', title: 'Antes y después de mi escritorio', views: 9200, retention: 33, comments: 96, shares: 173, clicks: 221, followers: 94 },
    { offset: -3, platform: 'YouTube Shorts', title: 'Esta app me ahorra 5 horas al mes', views: 14800, retention: 52, comments: 181, shares: 266, clicks: 430, followers: 203 },
    { offset: -5, platform: 'TikTok', title: '3 errores al presupuestar en México', views: 12600, retention: 38, comments: 142, shares: 205, clicks: 318, followers: 167 },
    { offset: -6, platform: 'Facebook Reels', title: 'Rutina de edición en 60 segundos', views: 7300, retention: 29, comments: 71, shares: 102, clicks: 154, followers: 63 },
    { offset: -8, platform: 'YouTube Shorts', title: 'Cómo organizar tus finanzas con $500', views: 11200, retention: 47, comments: 128, shares: 197, clicks: 301, followers: 141 },
    { offset: -10, platform: 'TikTok', title: 'Rutina de edición en 60 segundos', views: 9800, retention: 35, comments: 118, shares: 160, clicks: 244, followers: 119 },
    { offset: -12, platform: 'Facebook Reels', title: '3 errores al presupuestar en México', views: 6100, retention: 31, comments: 54, shares: 86, clicks: 126, followers: 48 },
    { offset: -15, platform: 'YouTube Shorts', title: 'Rutina de edición en 60 segundos', views: 8600, retention: 44, comments: 91, shares: 151, clicks: 222, followers: 98 },
    { offset: -18, platform: 'TikTok', title: '3 errores al presupuestar en México', views: 15300, retention: 40, comments: 202, shares: 311, clicks: 406, followers: 238 },
    { offset: -21, platform: 'Facebook Reels', title: '5 herramientas para creadores', views: 5400, retention: 27, comments: 43, shares: 72, clicks: 101, followers: 37 },
    { offset: -25, platform: 'YouTube Shorts', title: 'Antes y después de mi escritorio', views: 7700, retention: 43, comments: 83, shares: 129, clicks: 188, followers: 86 },
    { offset: -28, platform: 'TikTok', title: 'El error de publicar sin gancho', views: 10900, retention: 39, comments: 137, shares: 218, clicks: 293, followers: 154 },
    { offset: -35, platform: 'Facebook Reels', title: 'Rutina de edición en 60 segundos', views: 4900, retention: 26, comments: 38, shares: 59, clicks: 88, followers: 29 },
    { offset: -40, platform: 'YouTube Shorts', title: 'Esta app me ahorra 5 horas al mes', views: 6800, retention: 42, comments: 73, shares: 108, clicks: 145, followers: 71 },
    { offset: -46, platform: 'TikTok', title: 'Cómo organizar tus finanzas con $500', views: 8900, retention: 37, comments: 106, shares: 162, clicks: 211, followers: 111 },
    { offset: -52, platform: 'Facebook Reels', title: '3 errores al presupuestar en México', views: 4200, retention: 24, comments: 31, shares: 47, clicks: 72, followers: 23 },
    { offset: -58, platform: 'YouTube Shorts', title: '5 herramientas para creadores', views: 5900, retention: 41, comments: 57, shares: 91, clicks: 132, followers: 59 }
  ];
  const metrics = metricSeeds.map((item) => ({
    id: uid('sm_metric'),
    date: relative(item.offset),
    platform: item.platform,
    publicationId: '',
    title: item.title,
    views: item.views,
    retention: item.retention,
    comments: item.comments,
    shares: item.shares,
    clicks: item.clicks,
    followers: item.followers,
    revenue: 0,
    sample: true
  }));

  const incomeSeeds = [
    { offset: -2, source: 'Anuncios', platform: 'TikTok', concept: 'Fondo de creador · corte quincenal', amount: 1840, status: 'Cobrado' },
    { offset: -6, source: 'Afiliados', platform: 'YouTube Shorts', concept: 'Comisión por enlace de edición', amount: 920, status: 'Cobrado' },
    { offset: -11, source: 'Patrocinios', platform: 'Facebook Reels', concept: 'Colaboración con marca de escritorio', amount: 4500, status: 'Cobrado' },
    { offset: -16, source: 'Productos digitales', platform: 'TikTok', concept: 'Plantilla de guiones · ventas', amount: 1350, status: 'Cobrado' },
    { offset: -22, source: 'Comisiones', platform: 'YouTube Shorts', concept: 'Programa de referidos', amount: 580, status: 'Cobrado' },
    { offset: 3, source: 'Patrocinios', platform: 'TikTok', concept: 'Video patrocinado de finanzas', amount: 6000, status: 'Pendiente' },
    { offset: 9, source: 'Productos digitales', platform: 'General', concept: 'Preventa de guía de edición', amount: 2500, status: 'Proyectado' },
    { offset: -34, source: 'Anuncios', platform: 'YouTube Shorts', concept: 'Fondo de creador · mes anterior', amount: 1210, status: 'Cobrado' }
  ];
  const incomes = incomeSeeds.map((item) => ({
    id: uid('sm_income'),
    date: relative(item.offset),
    source: item.source,
    platform: item.platform,
    concept: item.concept,
    amount: item.amount,
    status: item.status,
    notes: 'Registro ficticio para demostrar la interfaz.',
    sample: true
  }));

  const librarySeeds = [
    {
      type: 'idea',
      title: 'Serie: un error de dinero por semana',
      platform: 'TikTok',
      tags: ['finanzas', 'serie', 'demo'],
      body: 'Idea de serie corta: cada semana explica un error común de dinero en México con un ejemplo de 30 segundos, un ejercicio práctico y una pregunta para comentarios.\n\nFormato: gancho visual + error + corrección + CTA.'
    },
    {
      type: 'guion',
      title: 'Guion: cómo organizar tus finanzas con $500',
      platform: 'TikTok',
      tags: ['guion', 'finanzas', 'demo'],
      body: 'GANCHO\n“No necesitas ganar más para ordenar tus finanzas. Necesitas decidir dónde va cada peso.”\n\nDESARROLLO\n1. Separa una cantidad pequeña al recibir tu dinero.\n2. Revisa suscripciones y gastos hormiga.\n3. Registra lo que gastaste sin juzgarte.\n\nCIERRE\nGuarda este video y comparte tu primer paso en comentarios.'
    },
    {
      type: 'prompt',
      title: 'Storyboard: escritorio antes y después',
      platform: 'Facebook Reels',
      tags: ['prompt', 'b-roll', 'demo'],
      body: 'Vertical 9:16 cinematic shot. Start frame: messy desk, warm practical light, handheld medium shot. End frame: organized desk, same camera position, cool accent light. Camera: slow push-in. Motion: subtle parallax, no text overlays. Keep character and room consistent.'
    },
    {
      type: 'publicacion',
      title: 'Publicación: 5 herramientas para creadores',
      platform: 'YouTube Shorts',
      tags: ['herramientas', 'short', 'demo'],
      body: 'Título: 5 herramientas que uso para crear contenido desde el celular\nDescripción: Lista práctica con alternativas gratuitas y de pago. Sin patrocinios ocultos.\n\nHashtags: #Shorts #Productividad #CreadoresMexicanos'
    },
    {
      type: 'idea',
      title: 'Detrás de cámara: mi setup barato',
      platform: 'Facebook Reels',
      tags: ['behind the scenes', 'setup', 'demo'],
      body: 'Mostrar el setup real: teléfono, luz, micrófono y soporte. Explicar qué compraría primero y qué no volvería a comprar. Añadir precios aproximados y alternativas.'
    },
    {
      type: 'guion',
      title: 'Guion: mitos de productividad',
      platform: 'YouTube Shorts',
      tags: ['productividad', 'mitos', 'demo'],
      body: 'MITO 1: trabajar más horas equivale a producir más.\nMITO 2: una app resuelve toda tu organización.\nMITO 3: descansar es perder tiempo.\n\nCierre: elige un solo sistema y mide tu resultado durante 7 días.'
    }
  ];
  const library = librarySeeds.map((item) => ({
    id: uid('sm_lib'),
    type: item.type,
    title: item.title,
    platform: item.platform,
    tags: item.tags,
    body: item.body,
    createdAt: new Date(Date.now() - Math.random() * 18 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - Math.random() * 4 * 86400000).toISOString(),
    sample: true
  }));

  return { publications, metrics, incomes, library };
}

function applySampleData() {
  const sample = buildSampleData();
  state.publications = state.publications.filter((item) => !item.sample).concat(sample.publications);
  state.metrics = state.metrics.filter((item) => !item.sample).concat(sample.metrics);
  state.incomes = state.incomes.filter((item) => !item.sample).concat(sample.incomes);
  state.library = state.library.filter((item) => !item.sample).concat(sample.library);
  state.settings.sampleMode = true;
  saveState();
  renderAll();
  toast('Datos de demostración cargados. Están marcados como ejemplos ficticios.');
}

function clearSampleData(skipConfirm = false) {
  const execute = () => {
    state.publications = state.publications.filter((item) => !item.sample);
    state.metrics = state.metrics.filter((item) => !item.sample);
    state.incomes = state.incomes.filter((item) => !item.sample);
    state.library = state.library.filter((item) => !item.sample);
    state.settings.sampleMode = false;
    saveState();
    renderAll();
    toast('Datos de demostración eliminados.');
  };
  if (skipConfirm) {
    execute();
    return;
  }
  openConfirm({
    title: 'Quitar datos de demostración',
    message: 'Se eliminarán solo los registros marcados como ejemplo. Tus datos propios no se tocarán.',
    label: 'Quitar demo',
    onConfirm: execute
  });
}
