# Curso "Monta tu Agente de IA en 7 Días" · Contexto para Claude (Cowork)

> Léelo completo antes de trabajar. Resume todo lo decidido hasta el 6 de octubre de 2026.
> Dueño: **Andrés Carreño** (andycarrenofx@gmail.com). Habla ES/EN. Quiere entregables completos, no instrucciones.

---

## 1. Qué es el proyecto

Un curso digital en español que enseña a dueños de negocio (LATAM, España e hispanos en EE. UU.) a montar su propio **agente de voz con IA** que contesta llamadas, resuelve dudas y agenda citas 24/7. En 7 días y sin programar.

- **Marca del curso:** Andrés.IA (marca personal: su cara y su voz).
- **Back-end:** AI Staff (meetaistaff.com), la agencia de Andrés, que vende el servicio hecho para ti en Quebec.
- **Por qué no se canibalizan:** quien compra el curso tiene tiempo y poco presupuesto. El cliente de AI Staff tiene dinero y no tiene tiempo. El curso genera autoridad y prospectos para AI Staff.

### Precios actuales de AI Staff (no son los del curso)
397 / 597 / 797 CAD al mes + impuestos, mes a mes, sin contrato. Fuente: `docs/precios-y-costos.md` en la rama `main` del repo `andresfcarreno/aistaff-website`. AI Staff ya **no usa Retell**: usa voz propia (Twilio + Claude + Cloudflare Worker). El curso sí usa Retell porque es la ruta sin código para el alumno.

---

## 2. Precios del curso (decididos el 6 oct. 2026)

**Los precios se muestran en la página y se compra directo.** Nada de esconder el precio ni hacer esperar días por correo.

| Plan | Precio de fundador | Precio normal | Neto por venta (~10% Hotmart) | Qué incluye |
|---|---|---|---|---|
| Esencial | **$117** | $147 | ~$104 | Día 0 + 7 días, kit de plantillas, Prompt Maestro v2, kit legal, actualizaciones |
| **Pro** (el que se empuja) | **$197** | $297 | ~$176 | Esencial + pack 12 industrias, WhatsApp, "Vende este servicio", Claude copiloto, comunidad 90 días + en vivos |
| VIP | **$497** | $497 | ~$447 (cuesta ~4–6 h de Andrés) | Pro + sesión 1 a 1 de 90 min, configuración con AI Staff, revisión de llamadas, 30 días de soporte. 5 cupos/mes |
| Laboratorio (desde el mes 4) | $29/mes | $29/mes | ~$26 | Comunidad, plantillas nuevas, en vivos mensuales |

- Pago único, en cuotas por Hotmart.
- **Garantía doble:** (1) si mantener el agente cuesta más de $50/mes con la configuración del curso, se devuelve el dinero; (2) 30 días si siguió los 7 días y el agente no funciona. Letra pequeña: hasta ~100 llamadas de 3 min al mes, operación de voz + número.
- **Regalo de entrada (lead magnet):** el Prompt Maestro gratis a cambio del correo, para quien no compra en el momento. Solo correos de personas que se apuntan; **nunca correos ni llamadas en frío**.
- **Después de comprar:** oferta de un clic en Hotmart (pack de industrias $27 al Esencial, o subir a VIP).
- **Fechas límite reales:** cupón de Hotmart que vence de verdad. Nunca contadores falsos.

### Números del negocio (estimados, a validar)
- Venta promedio (40% Esencial, 50% Pro, 10% VIP): **~$200 neto**.
- Costos fijos: ~$15–35/mes (ElevenLabs, Skool $9, dominio). Hotmart y Netlify: $0 fijo.
- Punto de equilibrio con $450/mes de anuncios: ~3 ventas al mes.
- Lo que decide todo: costo por correo < $2 y 2–3% de compra. Se valida en 2 semanas con $150–200.

---

## 3. Estrategia de distribución

**Motor principal: orgánico.** Andrés se comprometió a publicar **2 o 3 videos diarios** (Reels, TikTok, Shorts), incluidos formatos tipo stop motion. Anuncios de Meta solo para amplificar lo que ya funciona.

Reglas para que sea sostenible:
- Grabar por lotes (1–2 días a la semana), publicar todos los días.
- 4 formatos que rotan: **demos de llamadas** ("le pido descuento a una IA"), **educativos** ("cuánto cuesta un agente"), **detrás de escena**, **por industria**.
- Cada video lleva una llamada a la acción: "comenta AGENTE" → mensaje automático con el link (ManyChat).
- Medir cada semana qué formato trae más clics al link, y repetir ese.
- Lista de 30 ideas y guion de la clase en vivo: `05_EMAILS_Y_ANUNCIOS.md`.

---

## 4. Dónde se vende y se entrega

| Pieza | Herramienta | Costo |
|---|---|---|
| Página de ventas | `curso/index.html` en Netlify (meetaistaff.com/curso) o dominio propio | $0 |
| Cobro + área de alumnos + cuotas + afiliados | Hotmart | ~9.9% + fijo por venta |
| Correos (regalo, secuencias) | MailerLite (gratis hasta ~1,000 contactos) | $0 al inicio |
| Comunidad del plan Pro | Skool Hobby, solo por invitación (el cobro lo hace Hotmart) | $9/mes |
| Voz de los videos | ElevenLabs con la voz clonada de Andrés | plan de pago más barato |

---

## 5. Estado actual (qué está hecho)

- [x] **Página de ventas** (`curso/index.html`): diseño de nebulosa con esfera que reacciona como voz, apertura animada, escena de llamada que avanza con el scroll, calculadora, método de 7 días, diagrama de todo lo que incluye, garantía, 3 planes con precio visible, FAQ y regalo de entrada.
  - Config pendiente dentro del archivo: `FORMSPREE_URL` (o cambiarlo por el formulario de MailerLite) y `CHECKOUT` (links de Hotmart por plan).
  - Falta la foto real de Andrés en "Quién te enseña" (hoy hay iniciales "AC").
- [x] **Contenido del curso** en `curso/contenido/`:
  - `01_TEMARIO_COMPLETO.md`: Día 0, 7 días y módulos extra con entregables. (Su tabla de precios es anterior; manda la sección 2 de este archivo.)
  - `02_GUIONES_DIAS_2-7.md`: guiones listos para grabar. El del Día 1 está en `fuentes-originales/guion-dia-1.md`.
  - `03_PROMPT_MAESTRO_v2.md`: el activo del Día 2 y el regalo de entrada.
  - `04_PACK_INDUSTRIAS.md`: 12 fichas de industria.
  - `05_EMAILS_Y_ANUNCIOS.md`: secuencias de correo, 5 anuncios, 30 ideas de videos y guion de la clase en vivo.
- [x] **Producción automática de video** (`curso/contenido/produccion/dia-1/`): diapositivas + narración con IA + subtítulos → MP4 y SRT. Hay una muestra de 88 s del Día 1 (bloques 1–4).
  - Bloqueo: ElevenLabs desactivó la capa gratuita por "actividad inusual" (se usó desde un servidor). Faltan los audios de los bloques 5–12.
- [x] **Plan maestro** (`plan-maestro.html`): plataformas, escalera de precios (versión anterior: VIP a $997, ya corregido aquí a $497), lanzamiento en 30 días, métricas y riesgos.

---

## 6. Próximos pasos, en orden

1. **Andrés:** pasar ElevenLabs a plan de pago y clonar su voz (Voices → Add voice → Instant Voice Clone) con 2–3 min de voz limpia, sin música.
2. Generar los 12 audios del Día 1 con su voz y renderizar el video completo (`manifest-completo.json` + `build.py`).
3. Crear las diapositivas y manifiestos de los Días 0 y 2–7 con el mismo sistema (los guiones ya existen).
4. Crear los 9 descargables (PDF/Doc/Sheets) a partir del temario.
5. Cuenta de Hotmart: 3 ofertas, cuotas, garantía, cupón de fundador, oferta de un clic. Pegar links en `CHECKOUT`.
6. MailerLite: formulario del regalo + automatización que envía el Prompt Maestro + secuencia de 5 correos.
7. Publicar la página (merge a la rama principal del repo y desplegar).
8. Empezar los 2–3 videos diarios y medir cada semana.

---

## 7. Reglas que no se rompen

- El curso enseña **agentes que contestan (inbound)**. Llamadas salientes solo a clientes con consentimiento. **Nunca llamadas en frío con IA** (en EE. UU. está prohibido por la FCC desde feb. 2024, multas de $500–1,500 por llamada).
- Nada de testimonios inventados ni cifras sin fuente. Las estimaciones se dicen como estimaciones.
- El agente dice que es una IA al inicio de la llamada.
- No prometer ingresos al alumno: se promete un agente funcionando.
- Andrés da la cara en intros y cierres; la IA (su voz clonada) narra las demos de pantalla para poder actualizar sin regrabar.
- Escribir en español claro, sin jerga.

---

## 8. Identidad visual del curso

- Fondo `#04050B`, texto `#F3F5FF`, gris `#8C93B8`.
- Degradado de marca: cian `#5CF2FF` → violeta `#8B5CFF` → magenta `#FF4FB8`. Verde de éxito `#6BFFB8`.
- Tipografías: **Unbounded** (títulos), **Geist** (texto), **Geist Mono** (etiquetas).
- Elemento firma: esfera geométrica (icosfera) con barras de voz alrededor y nebulosa de fondo.
- La estética anterior (negro + dorado `#F5B544`, Bricolage Grotesque) quedó **descartada**: el dueño la sintió anticuada.
