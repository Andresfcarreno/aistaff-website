# Guiones de grabación — Días 2 a 7

> Formato igual al Día 1: gancho a cámara → contenido en pantalla → ejercicio → puente al día siguiente.
> Duración objetivo por video: 15–25 min. Energía alta en los primeros 10 segundos.
> **Tip de producción:** graba el gancho y el cierre a cámara en una sola sesión para los 6 días (misma luz, misma ropa); luego graba las pantallas por bloques.

---

## DÍA 2 — El cerebro, con Claude

**Gancho (0:00–0:40) · cámara**
> "Ayer definiste QUÉ hace tu agente. Hoy le vamos a dar un cerebro. Y no lo vas a escribir tú: lo va a escribir Claude, entrevistándote como lo haría un consultor de mil dólares. En 15 minutos vas a tener el mismo tipo de prompt que yo entrego a clientes en mi agencia."

**1. Qué es un prompt (0:40–3:00) · cámara**
- Analogía: el primer día de un empleado nuevo. Le das un manual: quién es, qué hace, cómo habla, qué no puede hacer, qué hacer si no sabe.
- "Un agente sin prompt es un empleado sin manual: improvisa. Y la improvisación en un negocio cuesta clientes."

**2. Manos a la obra (3:00–12:00) · pantalla**
- Abrir claude.ai → crear un **Proyecto** llamado "Agente [Negocio]".
- Pegar el Prompt Maestro v2. Enviar.
- Responder en vivo con el ejemplo de la Clínica Dental Sonrisa (tener las respuestas escritas al lado para no dudar).
- Mostrar cómo Claude pregunta una cosa a la vez y confirma.

**3. Anatomía del resultado (12:00–17:00) · pantalla**
- Recorrer las secciones: Identidad, Objetivo, Estilo de voz, Flujo, Herramientas, Límites, Base de conocimiento.
- Resaltar las **reglas de voz**: "Esto es lo que separa un agente que suena a robot de uno que suena a recepcionista."
- Mostrar un antes/después: frase escrita para leer vs. frase escrita para decir.

**4. Cierre (17:00–18:30) · cámara**
- "Guarda el prompt en tu proyecto de Claude. Mañana lo metemos en una voz. Y mañana es el día que más me gusta, porque tu agente va a hablarte por primera vez."
- Tarea: pega tu prompt en la comunidad para feedback (plan Pro).

---

## DÍA 3 — Lo construyes

**Gancho · cámara**
> "Hoy es el día. Al final de este video, vas a tener una conversación con tu agente. Con el nombre de tu negocio. Con tu forma de atender. Graba tu cara cuando pase, en serio, porque es un momento que no se olvida."

**1. Retell en 3 minutos · pantalla**
- Solo 3 zonas: Agentes, Números, Historial de llamadas. "Todo lo demás lo ignoramos por ahora."

**2. Crear el agente · pantalla**
- Nuevo agente → Single Prompt. Pegar el prompt. Escribir el mensaje de bienvenida.
- Elegir modelo (explicar en 20 segundos: más rápido = más natural en voz).
- Elegir voz: probar 3 voces en voz alta. Criterio: "¿Le confiarías tu negocio?"

**3. Primera llamada · pantalla + cámara (picture in picture)**
- Botón de prueba en el navegador. Hablar con el agente como si fueras un cliente.
- Dejar que cometa un error a propósito y mostrar la corrección en el prompt en 1 minuto.

**4. Los 5 errores de la primera prueba · pantalla**
1. Habla demasiado → reducir longitud de respuestas en el prompt.
2. Lee listas o símbolos → reglas de voz.
3. Dice horas raras ("09:00") → escribir horas como se dicen.
4. No sabe cuándo terminar → paso de cierre explícito.
5. Inventa datos → regla anti-inventos.

**Cierre · cámara**
> "Tu agente ya habla. Mañana le damos un teléfono y un calendario. Mañana deja de ser un juguete y empieza a trabajar."

---

## DÍA 4 — Lo conectas al mundo real

**Gancho · cámara**
> "Un agente que habla bonito pero no agenda es un contestador caro. Hoy lo conectamos a tu calendario y a un número de teléfono real. Al final del video me vas a ver llamarlo desde mi celular y ver la cita aparecer sola."

**1. Cal.com (5 min) · pantalla**
- Tipo de evento, duración, horarios, buffer, preguntas del formulario (nombre, teléfono, motivo).
- Copiar API key e ID del evento.

**2. Funciones de calendario en Retell (6 min) · pantalla**
- Agregar "consultar disponibilidad" y "reservar cita" con los datos de Cal.com.
- Editar el prompt: cuándo usar cada una + frase puente ("dame un segundo, reviso la agenda").

**3. Número (4 min) · pantalla**
- Opción A: comprar número en Retell. Opción B: importar Twilio. Opción C: desviar tu línea actual.
- Recomendación según país.

**4. Avisos con Make.com (5 min) · pantalla**
- Importar el blueprint del kit. Pegar URL del webhook en Retell. Probar.

**5. Prueba real (3 min) · celular en cámara**
- Llamar, agendar, mostrar la cita en Cal.com y el email de aviso. **Grabar este clip aparte: es el anuncio.**

**Cierre · cámara**
> "Ya tienes un empleado que contesta y agenda. Mañana lo hacemos inteligente: que sepa tus precios, tus políticas, y que maneje a los clientes difíciles."

---

## DÍA 5 — Lo haces inteligente

**Gancho · cámara**
> "Tu agente ya agenda. Pero ¿qué pasa cuando le preguntan si aceptas tarjeta, si hay parqueadero o por qué eres más caro que el de la esquina? Hoy le enseñamos tu negocio. Y le enseñamos a decir 'no sé' de forma elegante."

**Contenido · pantalla**
1. Llenar la plantilla de 40 preguntas con el ejemplo (mostrar solo 10, el resto está en el PDF).
2. Qué va en el prompt (lo corto y crítico) vs. base de conocimiento (lo largo).
3. Cargar la base de conocimiento en Retell.
4. Objeciones: mostrar las 5 y cómo quedan escritas.
5. Transferencia a humano: configurar número y frase de transferencia.
6. Probar: "¿Aceptan Sistecrédito?" (algo que no está) → el agente debe derivar, no inventar.

**Cierre · cámara**
> "Mañana lo ponemos a prueba de verdad. Te voy a dar 20 llamadas diseñadas para romper agentes. Si pasa las 20, está listo para tus clientes."

---

## DÍA 6 — Lo pules hasta que suene humano

**Gancho · cámara**
> "Hay una diferencia entre un agente que funciona y uno al que le confías tu negocio. Esa diferencia está en los detalles de hoy: cómo respira, cómo se deja interrumpir, qué hace cuando alguien le grita."

**Contenido · pantalla**
1. Ajustes de voz: velocidad, estabilidad, sonido ambiente. Antes/después en audio.
2. Interrupciones y silencios.
3. **Batería de 20 pruebas**: hacer 5 en vivo (cliente enojado, ruido de calle, correo difícil, "¿eres un robot?", intento de descuento).
4. Leer la transcripción en Retell → copiarla a Claude → "¿qué debería cambiar en el prompt?" → aplicar.
5. Agregar aviso de IA y de grabación al saludo.

**Cierre · cámara**
> "Mañana lanzamos. Mañana tu agente atiende a su primer cliente real."

---

## DÍA 7 — Lanzas y mides

**Gancho · cámara**
> "Hace seis días tenías una idea. Hoy tienes un empleado. Vamos a ponerlo a trabajar y, más importante, a medir cuánto dinero te está recuperando."

**Contenido · pantalla**
1. Checklist de lanzamiento de 10 puntos.
2. Activar desvío/número en producción. Aviso al equipo.
3. Tablero en Sheets: importar plantilla, conectar con el escenario de Make del Día 4.
4. Fórmula de "dinero recuperado": citas agendadas por el agente × valor promedio.
5. Rutina semanal de 15 minutos con Claude.
6. Qué hacer cuando falla (3 escenarios).

**Cierre y siguientes pasos · cámara**
> "Terminaste. Tienes algo que la mayoría de negocios de tu ciudad no tiene. Ahora tienes tres caminos: sumar WhatsApp, montar un segundo agente, o hacer lo que hago yo: ofrecerle esto a otros negocios. Todo eso está en los módulos extra. Y si en algún momento prefieres que mi equipo lo lleve al siguiente nivel, AI Staff está a una llamada."
- Pedir testimonio en video (30 s) a cambio de 1 mes gratis de Laboratorio.
