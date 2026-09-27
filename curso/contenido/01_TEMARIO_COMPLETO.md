# Monta tu Agente de IA en 7 Días — Temario completo v2

> Marca: **Andrés.IA** (curso) · Back-end: **AI Staff** (hecho para ti)
> Formato: 1 módulo por día (drip), videos de 15–25 min, pantalla + cara de Andrés.
> Regla de oro: **cada día termina con algo funcionando.** Nada de teoría sin entregable.

---

## Resumen de la oferta

| Plan | Precio fundador | Precio normal | Qué incluye |
|---|---|---|---|
| Esencial | $117 | $147 | Día 0 + 7 días + kit de 8 plantillas + kit legal |
| **Pro** (ancla) | **$197** | $297 | Esencial + 5 módulos extra + comunidad 90 días + 4 sesiones en vivo |
| VIP | $997 | $997 | Pro + 1:1 de 90 min + AI Staff lo configura contigo + 30 días de soporte (5 cupos/mes) |

Después de 90 días, la comunidad sigue como **Laboratorio Andrés.IA: $29/mes** (opcional).

---

## DÍA 0 — Arranque sin sustos (12 min) · todos los planes

**Objetivo:** que nadie abandone el Día 3 por un problema de tarjeta o de cuenta.

- 0.1 Cómo funciona el curso (drip, comunidad, garantía, cómo pedir ayuda)
- 0.2 Las 5 cuentas que vas a crear y en qué orden: Claude Pro, Retell AI, Cal.com, Make.com, Google (Sheets)
- 0.3 Cuánto vas a pagar al mes (tabla de costos real, ver `costos` en la landing)
- 0.4 Tu "número de negocio": comprar número en Retell vs. importar de Twilio vs. desviar tu línea actual
- 0.5 La regla de los 45 minutos: bloque diario en tu calendario

**Entregable:** las 5 cuentas creadas y el Checklist de 7 días impreso.

---

## DÍA 1 — Define el trabajo del agente (10–12 min)

Guion ya escrito: ver `guion-dia-1.md` (paquete original). Mejoras v2:

- 1.1 El error del 90%: un agente que "hace todo"
- 1.2 **Auditoría de 48 horas** (nuevo): durante 2 días anota cada llamada/mensaje en una hoja: motivo, hora, ¿se contestó? Esto da el caso de uso con datos, no con intuición.
- 1.3 Las 3 preguntas: ¿qué conversación se repite?, ¿por qué canal?, ¿qué resultado quieres?
- 1.4 Los 4 tipos de agente para empezar (elegir uno):
  1. **Recepcionista-agenda** (agenda citas) ← el más común y el que mejor ROI muestra
  2. **Resolutor de FAQs** (precios, horarios, ubicación)
  3. **Capturador de leads** (toma datos y avisa al dueño)
  4. **Confirmador/recordatorio** (llama a clientes que YA dieron consentimiento para confirmar su cita)
- 1.5 La métrica de éxito: "citas agendadas por semana" o "leads capturados"

**Entregable:** Descripción de puesto del agente (plantilla + 3 ejemplos llenos: clínica dental, taller mecánico, salón de belleza).

---

## DÍA 2 — El cerebro, con Claude (18–22 min)

- 2.1 Qué es un prompt de sistema (explicado como "el manual de entrenamiento de un empleado nuevo")
- 2.2 Abrir Claude → pegar el **Prompt Maestro v2** (`03_PROMPT_MAESTRO_v2.md`)
- 2.3 Responder las 12 preguntas en vivo con el ejemplo de la clínica
- 2.4 Anatomía del prompt resultante: Identidad → Objetivo → Estilo de voz → Flujo → Herramientas → Límites → Base de conocimiento
- 2.5 **Reglas de voz** que casi nadie conoce (nuevo): frases cortas, nunca listas ni emojis, números y horas escritos como se dicen ("nueve de la mañana"), una pregunta por turno, confirmar deletreando correos
- 2.6 Guardar en un Proyecto de Claude para iterar en los días 5 y 6

**Entregable:** el prompt del agente listo para pegar + tabla de descripción de puesto.

---

## DÍA 3 — Lo construyes (20–25 min)

- 3.1 Tour de Retell AI en 3 minutos (solo lo que importa)
- 3.2 Crear agente → tipo "Single Prompt" (no Conversation Flow todavía: simple primero)
- 3.3 Elegir modelo de lenguaje (recomendación: un modelo rápido para voz; explicar latencia vs. inteligencia)
- 3.4 Pegar el prompt del Día 2 y el mensaje de bienvenida
- 3.5 Elegir voz en español: probar 3, criterio "¿le confiarías tu negocio a esa voz?"
- 3.6 Idioma y detección: español (o multilingüe si tus clientes cambian de idioma)
- 3.7 **Primera prueba en el navegador** (momento "wow": grabar la reacción para redes)
- 3.8 Los 5 errores de la primera prueba y cómo corregirlos en 1 minuto

**Entregable:** agente conversando en el navegador. Video de 30 s de la prueba (bonus: publícalo y etiquétame).

---

## DÍA 4 — Lo conectas al mundo real (22–25 min)

- 4.1 Cal.com: crear tipo de evento ("Primera consulta · 30 min"), horarios, buffer entre citas
- 4.2 Conectar las funciones de calendario en Retell: *consultar disponibilidad* y *reservar cita* (API key de Cal.com + ID del evento)
- 4.3 Ajustar el prompt: cuándo llamar a cada función y qué decir mientras espera ("déjame revisar la agenda…")
- 4.4 Número telefónico: comprar en Retell o importar Twilio; asignar el agente
- 4.5 Opción "no cambio mi número": desvío condicional desde tu línea actual (si no contestas en 20 s o fuera de horario → agente)
- 4.6 Make.com: webhook de "llamada terminada" → Google Sheets + email/WhatsApp al dueño con resumen
- 4.7 **Prueba real:** llamar desde tu celular y ver la cita aparecer

**Entregable:** número real que contesta, agenda y te avisa.

---

## DÍA 5 — Lo haces inteligente (18–22 min)

- 5.1 Base de conocimiento: la plantilla de **40 preguntas** que todo cliente hace (servicios, precios, pagos, ubicación, parqueo, garantías, cancelaciones…)
- 5.2 Dónde va cada cosa: datos cortos en el prompt, documentos largos en la base de conocimiento de Retell
- 5.3 Objeciones: "está caro", "déjame pensarlo", "¿eres un robot?", "quiero hablar con una persona"
- 5.4 **Transferencia a humano**: a qué número, en qué casos, y qué dice el agente antes de transferir
- 5.5 La regla anti-inventos: "si no está en tu información, no lo sabes"
- 5.6 Variables dinámicas: saludar distinto según la hora ("buenas noches")

**Entregable:** base de conocimiento cargada + 5 objeciones entrenadas + transferencia configurada.

---

## DÍA 6 — Lo pules hasta que suene humano (20 min)

- 6.1 Voz: velocidad, temperatura, estabilidad; cuándo usar sonidos de fondo de oficina
- 6.2 Interrupciones y silencios: sensibilidad, tiempo de espera, qué hacer si el cliente se queda callado
- 6.3 **Batería de 20 llamadas de prueba** (activo PDF): cliente enojado, cliente que habla mucho, ruido de calle, pregunta fuera de tema, pide descuento, da un correo difícil, cambia de idioma, intenta que el agente diga algo indebido…
- 6.4 Lectura de transcripciones: marcar fallas y pedirle a Claude la corrección del prompt
- 6.5 Aviso legal de IA en el saludo + aviso de grabación (ver Kit legal)

**Entregable:** 20/20 pruebas superadas y prompt v2 guardado.

---

## DÍA 7 — Lanzas y mides (18–20 min)

- 7.1 Checklist de lanzamiento (10 puntos)
- 7.2 Activar desvío de llamadas en producción; avisar a tu equipo
- 7.3 Tablero en Google Sheets: llamadas atendidas, % resueltas, citas agendadas, **dinero recuperado** (citas × ticket)
- 7.4 Revisión semanal de 15 minutos: 5 transcripciones + 1 mejora de prompt
- 7.5 Qué hacer cuando falla: caída de proveedor, número mal configurado, agente que "alucina"
- 7.6 Siguiente paso: WhatsApp, segundo agente, o vender el servicio

**Entregable:** agente en vivo + tablero + primera revisión semanal agendada.

---

## MÓDULOS EXTRA

### Kit legal y de confianza (todos los planes) · 15 min
- Decir que es IA al inicio de la llamada (buena práctica y cada vez más obligatorio)
- Aviso de grabación de llamadas
- Datos personales: Colombia (Ley 1581 de 2012, Habeas Data), México (LFPDPPP), España/UE (RGPD y AI Act: obligación de transparencia en sistemas que interactúan con personas)
- EE. UU.: la FCC (feb. 2024) considera las voces generadas por IA como "voz artificial" bajo la TCPA → **prohibido llamar en frío con IA sin consentimiento previo por escrito.** Multas de $500–$1,500 por llamada.
- Qué SÍ se puede: agentes inbound, recordatorios a clientes con consentimiento
- *Disclaimer: esto es orientación, no asesoría legal.*

### Pack de 12 industrias (Pro)
Ver `04_PACK_INDUSTRIAS.md`.

### Tu agente en WhatsApp (Pro) · 25 min
- Opciones: agente de chat de Retell + Twilio WhatsApp, o Make.com como puente
- Reutilizar el mismo cerebro (adaptando reglas de chat: aquí sí listas cortas y links)
- Recordatorio automático 24 h antes de la cita → baja inasistencias
- Enviar ubicación de Google Maps y link de pago

### Vende este servicio (Pro) · 40 min
- A quién venderle: negocios con citas y ticket > $50 (clínicas, estética, talleres, inmobiliarias, abogados)
- La demo que vende sola: montar un agente con el nombre del negocio del prospecto ANTES de la reunión (30 min con el pack de industrias) y llamarlo delante de él
- Precios sugeridos: implementación $300–$1,500 + mensualidad $97–$300 (incluye consumo y mejoras)
- Guion de reunión de 20 minutos, propuesta de 1 página, contrato simple, onboarding
- Prospección legal: red caliente, grupos de Facebook, LinkedIn, email frío con CAN-SPAM. **Nunca** llamadas en frío con IA.

### Claude como tu copiloto (Pro) · 20 min
- Proyecto de Claude con el prompt, la base de conocimiento y las transcripciones de la semana
- Pedidos semanales listos: "¿Qué preguntas nuevas hicieron los clientes?", "¿Dónde se equivocó el agente?", "Reescribe la sección de objeciones"
- Conectores (MCP) cuando existan para tus herramientas; si no, exportar CSV y subirlo

---

## Activos descargables (kit de 8)

| # | Activo | Formato | Día |
|---|---|---|---|
| 1 | Descripción de puesto del agente + 3 ejemplos | Google Doc / PDF | 1 |
| 2 | Prompt Maestro v2 | TXT | 2 |
| 3 | Agente base para Retell | JSON exportado | 3 |
| 4 | Escenario de alertas Make.com | Blueprint JSON | 4 |
| 5 | Base de conocimiento: 40 preguntas | Google Doc | 5 |
| 6 | Batería de 20 pruebas | PDF | 6 |
| 7 | Tablero de resultados | Google Sheets | 7 |
| 8 | Checklist de 7 días | PDF imprimible | 0 |

> Regla de escalonamiento: en el curso va la versión BASE. Las versiones afinadas por cliente se quedan para AI Staff.
