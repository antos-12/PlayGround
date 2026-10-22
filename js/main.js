import { Game } from './world.js';
import { SoundEngine } from './audio.js';
import { InputController } from './input.js';
import { UI } from './ui.js';

const canvas = document.getElementById('scene');
const audio = new SoundEngine();
let ui = null;

try {
  const game = new Game(canvas, audio);
  const input = new InputController({
    canvas,
    boostButton: document.getElementById('boost-button'),
    joystick: document.getElementById('joystick'),
    joystickThumb: document.getElementById('joystick-thumb'),
    aimRing: document.getElementById('aim-ring'),
    onPause: () => ui?.togglePause()
  });
  game.attachInput(input);
  ui = new UI(game, audio, input);

  window.__wormate = {
    game,
    ui,
    input,
    audio,
    getDebugState: () => game.getDebugState()
  };

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = '<span>El renderizador 3D se ha detenido. Recarga la página.</span>';
      loading.classList.remove('hidden');
    }
  });
} catch (error) {
  console.error(error);
  const loading = document.getElementById('loading');
  if (loading) {
    loading.innerHTML = `<span>No se pudo iniciar el juego 3D.<br>${String(error.message || error)}</span>`;
    loading.classList.remove('hidden');
  }
}
