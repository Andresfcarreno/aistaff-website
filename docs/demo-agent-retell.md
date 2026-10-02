# Línea demo que se adapta al negocio de quien llama

> Idea tomada de un video de entrevista con un dueño de agencia de IA de voz (white label). Su demo en vivo es lo que más convierte: el prospecto llama, el bot le pregunta por su negocio y luego **cambia de papel** y contesta como la asistente de ese negocio, mientras el prospecto hace de cliente. No hay que construir una demo a mano para cada prospecto: se arma en tiempo real.
>
> Para AI Staff es el siguiente paso natural. Ya tenemos la línea +1 (438) 805-8804, la página `/onboarding/` y los contratos. Esto convierte la línea en un vendedor que trabaja 24/7.

## 1. Qué aprendimos del video y qué hacemos con cada cosa

| En el video | Para AI Staff | Estado |
|---|---|---|
| Demo que se arma sola en la llamada | **Es el núcleo de este documento.** | Por construir |
| Video corto + teléfono visibles en el sitio | Poner el teléfono como acción principal junto al video corto. Los guiones ya están en `docs/guiones-video.md`. | Teléfono sí, video pendiente |
| Después de la llamada, envía enlace de registro | Enviar por texto el enlace a `/onboarding/` con el sector y el nombre del negocio ya puestos | Por construir |
| Primeros clientes: contactos propios, 30 días constantes, publicando en su perfil personal | Entra al playbook como "Fase 0" (sección 6) | Documentado aquí |
| Cámara de comercio local y referidos | Entra al playbook (sección 6) | Documentado aquí |
| Garantía de 30 días | **Decisión tuya.** Hoy el contrato dice que no se reembolsa el mes empezado. Si la quieres, hay que cambiar el art. 8.2, el sitio y los flyers, y que lo vea el abogado. | Pendiente de decidir |
| Precio plano de 297 $ + 1 centavo por minuto | **No aplica.** Ellos venden a agencias; nosotros vendemos una asistente personal hecha a medida desde 997 $. Se mantiene nuestro modelo. | Descartado |
| "Es como un humano que nunca tiene un mal día" y "contesta varias llamadas a la vez" | Útil como argumento, pero **hay que comprobar el límite de llamadas simultáneas de Retell** antes de prometerlo en el sitio. Y siempre con honestidad: la IA puede equivocarse. | Verificar |

## 2. Flujo de la llamada

```
Llamada a +1 438 805 8804
  1. Saludo + aviso (IA, llamada grabada, uso de los datos)   ← obligatorio
  2. Descubrimiento (60–90 s): nombre, negocio, qué hace, qué preguntan sus clientes, horario
  3. Cambio de papel: "Ahora soy la asistente de {negocio}. Hazme las preguntas de tus clientes."
  4. Role-play (2–4 min): responde con lo que acaba de aprender; lo que no sabe, lo dice y toma el mensaje
  5. Cierre: "¿Quieres que te mande por texto el enlace para armar tu demo completa?"
       sí → Make envía el SMS con el enlace; no → se despide sin insistir
Fin de llamada → Retell envía webhook call_ended a Make → fila en Supabase (demo_calls) → aviso a Andrés
```

## 3. Agente de Retell: estructura

Usar un agente de **Conversation Flow** (nodos), porque el cambio de papel es una transición clara. Verifica los nombres exactos de las opciones en la documentación de Retell antes de configurarlo.

| Nodo | Qué hace | Salida |
|---|---|---|
| `bienvenida` | Saludo, aviso de IA y grabación, idioma | → `descubrimiento` |
| `descubrimiento` | Hace las preguntas (una a la vez), guarda las respuestas | → `cambio` cuando tiene al menos: negocio, qué hace y 2 preguntas típicas |
| `cambio` | Anuncia el cambio de papel | → `roleplay` |
| `roleplay` | Actúa como asistente del negocio | → `cierre` cuando el prospecto lo pida o pasen unos 4 minutos |
| `cierre` | Ofrece el SMS; llama a la función `send_onboarding_sms` solo si dijo que sí | → fin |

**Función personalizada** `send_onboarding_sms` (apunta a un webhook de Make): recibe `biz_name`, `sector`, `lang` y el número de quien llama. Make envía el SMS con Twilio. El enlace tiene esta forma:

```
https://meetaistaff.com/onboarding/?ref=demo-call&secteur={sector}&biz={biz_name_urlencoded}&lang={lang}
```

> Hoy `/onboarding/` lee `secteur`, `ref` y `lang`. Falta que lea también `biz` y lo ponga en el nombre del negocio. Es un cambio pequeño en la página y lo puedo hacer en cuanto confirmes que seguimos con este plan.

**Análisis posterior a la llamada** (campos que Retell extrae al terminar): `biz_name`, `sector`, `biz_summary`, `customer_questions`, `hours`, `services`, `caller_name`, `lang`, `sms_consent`. Make los inserta en `demo_calls` (`backend/supabase/002_demo_calls.sql`).

## 4. Prompt del agente (base, para pegar y ajustar)

Idioma de trabajo: el del llamante. Francés por defecto (Quebec). Cambia a inglés o español si el llamante lo usa.

```
Eres Sofía, la asistente de demostración de AI Staff, una empresa de Montreal que crea asistentes personales con IA para dueños de negocio ocupados.

IDIOMA
Empieza en francés de Quebec. Si la persona habla inglés o español, cambia a ese idioma y quédate en él. Frases cortas, naturales, de a una pregunta por vez. Nunca leas listas.

REGLAS FIJAS
- Al inicio di siempre, con tus palabras: eres una asistente de IA, la llamada se graba, y la información que te den se usa solo para preparar su demo. Si la persona no está de acuerdo con la grabación, despídete con amabilidad y termina la llamada.
- Nunca digas que eres una persona.
- No inventes precios, horarios, servicios ni políticas. Si no lo sabes, dilo y ofrece tomar el mensaje.
- No des consejo médico, legal, financiero ni de corretaje inmobiliario. Si te lo piden, di que eso lo responde el profesional y ofrece tomar el mensaje.
- Si hay una emergencia, di que marquen el 911.
- Nunca pidas contraseñas, números de tarjeta ni datos de acceso.
- Precios de AI Staff, solo si te los piden: desde 997 $ al mes, mes a mes, sin contrato; los canales se activan por fases y se confirman en la llamada de descubrimiento. No prometas plazos.
- No prometas resultados ni cifras de ahorro.

FASE 1: DESCUBRIMIENTO (máximo 90 segundos)
Pregunta, una a la vez:
1. Cómo se llama la persona.
2. Cómo se llama su negocio y a qué se dedica.
3. Qué te preguntan sus clientes cuando llaman (pide 2 o 3 ejemplos).
4. Sus horarios y sus servicios principales.
Repite en una frase lo que entendiste. No hables de AI Staff todavía, salvo que pregunten.

FASE 2: CAMBIO DE PAPEL
Di algo como: "Perfecto. Ahora voy a ser la asistente de {negocio}. Tú eres un cliente que llama. Hazme las preguntas que te hacen normalmente."

FASE 3: ROLE-PLAY
Contesta como la asistente de ese negocio, solo con lo que te dijeron. Saluda con el nombre del negocio. Si piden una cita, ofrece dos horarios dentro del horario que te dieron y confírmalo sin inventar la agenda real. Si no sabes algo, di que tomas el mensaje. Si la persona te pide salir del papel, vuelve a ser Sofía de AI Staff.

FASE 4: CIERRE
Pregunta qué le pareció. Luego ofrece: "¿Quieres que te mande por texto el enlace para armar tu demo completa? Son unos 8 minutos y no pide contraseñas." Solo si dice que sí, llama a send_onboarding_sms. Si dice que no, agradece y despídete sin insistir.
```

## 5. Make: escenario nuevo "Demo call → Supabase"

1. **Webhook** (Custom webhook) que recibe `call_ended` de Retell.
2. **Filtro**: solo llamadas del agente demo.
3. **Supabase → Create/Upsert row** en `demo_calls`, usando `retell_call_id` como clave para no duplicar.
4. **Resend**: correo a hello@meetaistaff.com con el resumen. Asunto sugerido: `Nueva demo: {biz_name} ({sector})`.
5. **Escenario aparte** (webhook de la función `send_onboarding_sms`): **Twilio → Send SMS** al número de quien llamó, con el enlace de la sección 3. Después, `update` de `sms_consent=true` y `sms_sent_at`.

Las claves (Retell, Twilio, Supabase service role, Anthropic) viven **solo dentro de Make y de Retell**. Nunca en el HTML ni en el chat.

## 6. Cómo conseguir los primeros clientes (sacado del video, adaptado a Quebec)

Lo que hizo el entrevistado: contó a sus contactos que lanzaba esto, **todos los días durante unos 30 días**, desde su perfil personal. Después de unos 30 días ya tenía varios clientes, y más adelante llegaron referidos y contactos de la cámara de comercio local. Es un resultado individual, no una promesa para AI Staff.

1. **Fase 0 (30 días).** Publicar cada día algo corto desde el perfil personal de Andrés: un caso, una llamada de la demo, una pregunta. Siempre con el enlace a `/onboarding/?ref=personal` y el número de la demo.
2. **Pedir presentaciones.** Mensaje a 20 contactos: "¿Conoces a algún dueño de negocio que pierda llamadas?"
3. **Cámara de comercio local.** Hacerse miembro de la de su zona y asistir a los eventos de networking.
4. **Flyers** con el QR (`?ref=flyer`) en esos eventos.
5. **Medir:** el parámetro `ref` ya viaja con las respuestas del formulario, así que se sabe de dónde viene cada prospecto.

## 7. Lo que hay que cuidar (Quebec)

- **Es una llamada que el prospecto inicia**, así que no es llamada en frío. Aun así hay que avisar que es IA y que se graba, como dice el prompt.
- **El SMS** solo se manda si la persona dijo que sí en la llamada. Debe llevar el nombre de AI Staff, y a quien responda STOP no se le escribe más (CASL).
- **Datos:** se guardan solo lo necesario, durante un máximo de 12 meses, como dice `/confidentialite/`. Quien lo pida se borra a mano.
- **No grabar ni guardar** nada que la persona diga que no quiere que se guarde.
- **Si Retell o Twilio cambian algo** que afecte esto, actualizar la tabla de proveedores de la política de privacidad.

## 8. Plan por fases

| Fase | Qué | Quién | Esfuerzo |
|---|---|---|---|
| 1 | Cambiar el agente de la línea demo al flujo de esta guía (también resuelve el pendiente de que hoy se presenta como recepcionista inmobiliario) | Andrés en Retell; yo dejo el prompt listo | 1–2 h |
| 2 | Crear la tabla `demo_calls` y el escenario de Make | Yo, con Make y Supabase conectados | 1–2 h |
| 3 | `/onboarding/` lee `biz` del enlace del SMS | Yo | 15 min |
| 4 | En la home y las páginas de sector, un bloque "Pruébala ahora: llama y dile qué negocio tienes" junto al teléfono | Yo | 1 h |
| 5 | Video corto (30–45 s) mostrando la llamada, con los guiones de `guiones-video.md` | Andrés | Aparte |
| 6 | Decidir lo de la garantía de 30 días | Andrés | Decisión |
