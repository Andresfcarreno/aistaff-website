# Andrés Carreño — Biblioteca + IO

Una sola página que une la **Biblioteca** (10 libros gratis en PDF) con **IO**, el lector de patrones.
Vive en `/andres-carreno/` y funciona como sitio estático más tres funciones de Netlify.

## Qué hay en la página

| Sección | Qué hace |
|---|---|
| Intro | El sigilo de IO se traza solo y se abre en círculo (una vez por sesión) |
| Cosmos (fondo) | 15 000 partículas en WebGL que cambian de forma al bajar: galaxia → libro abierto → sigilo de IO → flor de la vida → cielo |
| Hero | Título letra por letra en 3D que sigue al ratón |
| Manifiesto | Cinta de temas y un texto que se ilumina palabra por palabra |
| Biblioteca | Estantería de libros 3D con filtros; cada libro abre un modal donde la tapa se abre |
| IO | Calculadora pitagórica en vivo + la experiencia inmersiva de once preguntas |
| Sobre mí | Retrato con anillos que giran, cita y línea de vida |
| Novedades | Correo para avisar de libros nuevos |

Todo se desactiva con `prefers-reduced-motion`. Sin WebGL hay un cielo de respaldo en CSS.

## IO: el flujo

1. Once preguntas (la 10 y la 11 no se tocan: son el producto). Cada respuesta enciende una estrella.
2. El navegador envía las respuestas a `analizar-background` y consulta `lectura` cada 3 s.
3. El análisis sale con 7 capítulos + **tus tres libros**, cada uno conectado a lo que la persona escribió.
4. El correo se pide **después** del análisis (`entregar`), y los tres PDF quedan descargables al momento.
5. La lectura queda guardada con enlace propio (`?lectura=ID#io`) y en el dispositivo.

Si el servidor no responde (vista previa, sin clave), IO genera una **lectura base** en el navegador
con los mismos números y el mapa de recomendación del brief, y lo dice abiertamente.

## Funciones (`/netlify/functions`)

| Función | Para qué |
|---|---|
| `analizar-background` | Llama a Claude (hasta 15 min, sin el tope de 10 s). Un GET responde "Método no permitido": así se confirma que está viva |
| `lectura` | Devuelve el estado de una lectura: `pendiente`, `listo`, `error` o `limite` |
| `entregar` | Guarda el correo con sus etiquetas (área, camino de vida, libros) y envía los PDF si hay proveedor |

Los números pitagóricos se calculan en código (`assets/js/numerologia.js`, compartido con el servidor) y se le pasan a Claude ya hechos, para que nunca se equivoque sumando.

## Variables de entorno en Netlify

| Variable | Obligatoria | Valor |
|---|---|---|
| `ANTHROPIC_API_KEY` | sí | La clave de platform.claude.com. **Nunca en el HTML.** |
| `IO_MODELO` | no | Por defecto `claude-sonnet-5`, como pide el brief |
| `IO_LECTURAS_POR_DIA` | no | Lecturas por conexión y día. Por defecto 2 |
| `IO_SAL` | no | Texto secreto cualquiera para anonimizar IPs y correos |
| `RESEND_API_KEY` | no | Para enviar los libros por correo (resend.com) |
| `EMAIL_FROM` | no | Remitente verificado, p. ej. `Andrés Carreño <libros@tudominio.com>` |
| `EMAIL_ADMIN` | no | A dónde avisar cada vez que alguien deja su correo |

Los correos y las lecturas se guardan en **Netlify Blobs** (`biblioteca-correos`, `io-lecturas`), sin base de datos aparte.

Pon también un tope de gasto en platform.claude.com.

## Desplegar

El repositorio ya trae `netlify.toml` y `package.json` en la raíz. Al desplegar desde Git, Netlify instala
las dependencias y publica. Desde la línea de comandos:

```bash
npm install
netlify deploy --prod
```

Rutas cortas: `/andres` → la página, `/io` → abre IO directamente.

## Editar

- **Libros**: `assets/js/catalogo.js` (título, texto, PDF, tema, color del lomo). Portadas en `assets/img/portadas/libroN.{jpg,webp}`.
- **Mapa de recomendación**: `AREAS` y `SENALES` en el mismo archivo.
- **El prompt de IO**: `netlify/lib/prompt.mjs`. Si el análisis sale genérico, ahí se ajusta.
- **Lectura base**: `assets/js/lectura-local.js`.
