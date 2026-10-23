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

## Centro de Control Creator IA

Aplicación web/PWA local para planificar contenido, generar guiones, avatares y storyboards verticales 9:16.

### Ejecutar

```bash
./start.sh
```

El servidor escucha en `PORT` (por defecto `3000`) y sirve la app y la API de imágenes desde el mismo origen:

- `GET /api/studio/health`
- `POST /api/studio/image`

No hay dependencias npm ni claves en el navegador. Todo el contenido del usuario se guarda en `localStorage`.

### Proveedor de imágenes

El modo por defecto es `auto`: intenta FLUX.1 Schnell en un Space público de Hugging Face y, si no está disponible, usa Pollinations. El respaldo gratuito de Pollinations tiene una cuota aproximada de una imagen cada 45 segundos.

Variables de entorno del servidor:

```bash
IMAGE_PROVIDER=auto            # auto | huggingface | pollinations | openai | pixelster
HF_TOKEN=                      # opcional para el Space de Hugging Face
HF_IMAGE_SPACE_URL=            # opcional, Space compatible con la API /infer
POLLINATIONS_MODEL=flux        # opcional; el modo anónimo devuelve Sana
OPENAI_API_KEY=                # recomendado para producción y referencias visuales
OPENAI_IMAGE_MODEL=gpt-image-1
OPENAI_IMAGE_SIZE=1024x1536
OPENAI_IMAGE_QUALITY=medium
```

Con `IMAGE_PROVIDER=openai` y `OPENAI_API_KEY`, el servidor usa `/v1/images/generations` y `/v1/images/edits` para reutilizar la imagen inicial como referencia del fotograma final. Esa ruta requiere una clave válida y no se ha validado en este entorno sin clave.

### Probar desde el teléfono

1. Ejecuta `./start.sh` en la computadora.
2. Abre `http://IP-DE-TU-COMPUTADORA:3000` desde el teléfono en la misma red.
3. Entra a **Estudio de video**, completa la ficha maestra y crea el storyboard.
4. Genera una imagen, revisa el estado del backend y descarga o exporta el proyecto.

Si el backend no responde, el storyboard y los prompts siguen funcionando; los botones de imagen muestran el error y permiten reintentar.
