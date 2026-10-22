# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/antos-12/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/antos-12/PlayGround)

- 🎮 [Open the project](https://omgithub.com/antos-12/PlayGround).
- ✨ [Remix this project](https://omgithub.com/?remix=antos-12%2FPlayGround).
- 💻 [Explore the source](https://github.com/antos-12/PlayGround).
- 🛠️ [Check build runs](https://github.com/antos-12/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/antos-12/PlayGround/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/antos-12).
- 🌍 [Create with OMGithub](https://omgithub.com).
<!-- omgithub:readme:end -->

---

# Wormate.3D

Una reinterpretación en 3D de la clásica arena de gusanos para **móvil y tablet**. Come corazones y orbes, haz crecer tu gusano, activa el turbo y esquiva la cabeza de tus rivales.

## Cómo jugar

| Plataforma | Controles |
| --- | --- |
| Móvil / tablet | Arrastra el joystick izquierdo para girar. Mantén el botón **Turbo** (o el lado derecho de la pantalla) para acelerar. |
| Escritorio | Mueve el ratón para girar. Mantén pulsado el botón izquierdo, `Espacio` o `Shift` para acelerar. |
| Pausa | Botón de pausa del HUD o `Esc`. |

- Tu gusano espera inmóvil hasta que muevas por primera vez, así que puedes leer la pantalla sin riesgo.
- Al acelerar gastas longitud. Necesitas al menos 26 de longitud para usar el turbo.
- Si tu cabeza toca el cuerpo de otro gusano, pierdes. Si otro choca contra ti, se convierte en comida.

## Características

- Arena 3D con iluminación, cielo procedural, suelo generado y partículas.
- 9 rivales con IA que buscan comida, crecen y reaparecen.
- Los gusanos destruidos dejan sus restos como comida para que puedas seguir creciendo.
- Dos arenas (**Jardín de Amor** y **Noche Neón**) y 8 skins desbloqueadas.
- Clasificación en vivo, minimapa, récord personal y preferencias guardadas en `localStorage`.
- Efectos de sonido sintetizados con Web Audio (sin archivos externos).
- Interfaz responsive para móvil, tablet, landscape y escritorio.
- Renderizado instanciado y geometría de baja poligonización para mantener el juego fluido.

## Desarrollo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev       # servidor de desarrollo
npm test          # pruebas de la lógica pura
npm run build     # build de producción en dist/
npm run preview   # sirve el build
```

## Estructura

```
index.html          Estructura de menú, HUD y overlays
src/main.js         Controlador de interfaz, modales y persistencia
src/game.js         Estado de partida, IA, colisiones, cámara y controles
src/world.js        Escena Three.js, cielo, suelo, comida y partículas
src/worm.js         Gusano instanciado (cuerpo, ojos, corona y etiqueta)
src/logic.js        Matemáticas, rutas y constantes compartidas
src/theme.js        Arenas, skins y nombres de bots
src/audio.js        Efectos de sonido procedurales
tests/              Pruebas con node:test
```
