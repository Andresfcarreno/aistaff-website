# Producción automática · Día 1

Sistema que convierte el guion en video: diapositivas + narración con IA + subtítulos.

| Archivo | Qué hace |
|---|---|
| `slides.html` | Las 12 diapositivas del Día 1 (1920×1080, estética de la página) |
| `render.js` | Exporta cada diapositiva a `png/01.png` … `png/12.png` |
| `manifest.json` | Muestra de 88 s: bloques 1–4 (los que tienen narración) |
| `manifest-completo.json` | Los 12 bloques del Día 1 con el texto exacto de la narración |
| `build.py` | Une diapositiva + audio + subtítulos en un MP4 y genera el `.srt` |
| `piloto-dia1-muestra.srt` | Subtítulos de la muestra, listos para subir a Hotmart |

## Cómo se genera un módulo
1. Narración: cada bloque de `manifest-completo.json` se genera en ElevenLabs y se guarda como `audio/01.mp3` … `audio/12.mp3`.
2. Tipografías: descarga Unbounded, Geist y Geist Mono de Google Fonts en `fonts/` con un `fonts.css` local.
3. `node render.js` → crea las diapositivas en `png/`.
4. `pip install imageio-ffmpeg` y luego `python build.py manifest-completo.json dia-1.mp4`.

Para actualizar el curso cuando cambie una herramienta: edita el texto del bloque, regenera solo ese audio y vuelve a correr `build.py`.

Los audios y videos no se guardan en git (pesan mucho); se regeneran con estos archivos.
