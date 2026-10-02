# Precios y costos (octubre de 2026)

## Los planes
| Plan | Precio/mes + impuestos | Con TPS y TVQ (14,975 %) |
|---|---|---|
| Essentiel / Essential / Esencial | 397 $ | 456,45 $ |
| Pro | 597 $ | 686,40 $ |
| Complet / Complete / Completo | 797 $ | 916,31 $ |

Decisión del dueño: tres precios sin plan "destacado", sin humano de respaldo, correo fuera de los planes, instalación gratis en el lanzamiento y mes a mes.

## Costos reales con la voz propia (3 oct. 2026)
La voz que atiende hoy es el servicio `voice-relay` (Cloudflare Worker, Twilio ConversationRelay, Deepgram, ElevenLabs y Claude Haiku 4.5). Cifras de **fuentes de segunda mano**, salvo la del modelo, que viene de la lista de precios de Anthropic. Confirmarlas en las facturas propias.

| Pieza | Costo | Fuente |
|---|---|---|
| Twilio ConversationRelay | **0,07 $/min** | [Twilio](https://www.twilio.com/en-us/products/conversational-ai/pricing), [HappyRobot](https://www.happyrobot.ai/hub/twilio-reviews-and-pricing) |
| Llamada entrante a número local de Canadá | **0,0085 $/min** y **1,15 $/mes** por número | [Twilio Canadá](https://www.twilio.com/en-us/voice/pricing/ca) |
| Claude Haiku 4.5 (modelo del servicio) | 1 $ por millón de tokens de entrada y 5 $ por millón de salida | Lista de precios de Anthropic |
| Cloudflare, Supabase, Make | Dentro de sus planes gratuitos hoy (ver "Fijos") | |
| WhatsApp (Meta) | ≈ 0,0034 $ por mensaje en Canadá, 1 000 de servicio gratis por número; el proveedor suma su tarifa | [Drag](https://www.dragapp.com/blog/whatsapp-business-api-pricing/) |
| Instagram y Facebook (ManyChat Pro) | ≈ 39 $/mes por cliente | [Featurebase](https://www.featurebase.app/blog/manychat-pricing) |

**Costo por minuto de llamada ≈ 0,09 a 0,11 $**
- Twilio (ConversationRelay + línea entrante): 0,0785 $/min. Es cerca del 85 % del costo.
- Claude Haiku 4.5: estimado en 0,01 a 0,02 $/min. Sale de una llamada de 3 minutos con unos 12 turnos, un prompt de unos 1 800 tokens y respuestas cortas, más el análisis posterior. **Es una estimación del código, no una medición.**
- Sin verificar: si los 0,07 $ de ConversationRelay ya incluyen las voces de ElevenLabs y el reconocimiento de Deepgram. Si no, hay que sumarlas.

## Cálculo de margen por plan (con 0,09 a 0,11 $/min)
| Plan | Uso típico | Uso máximo del plan | Costo/mes | % del precio |
|---|---|---|---|---|
| Essentiel 397 $ | 375 min → 35 a 42 $ | 400 min incluidos → hasta 45 $ | 35 a 45 $ | 9 a 11 % |
| Pro 597 $ | 500 min + 3 llamadas programadas al día (unos 180 min) → 66 a 80 $ | 1 000 min + programadas + WhatsApp → hasta 140 $ | 66 a 140 $ | 11 a 23 % |
| Complet 797 $ | Pro + ManyChat 39 $ → 105 a 120 $ | máximo del Pro + ManyChat → hasta 180 $ | 105 a 180 $ | 13 a 23 % |

- Las llamadas salientes (programadas) cuestan algo más en Twilio; el cálculo usa una aproximación sin verificar.
- Incluso en el peor caso, los tres planes quedan por debajo del 25 % de costo variable. **Los precios 397 / 597 / 797 se sostienen.**
- El excedente a 0,25 $/min sigue dando más del doble del costo.
- La línea demo gratuita cuesta unos 0,40 $ por prospecto de 4 minutos; el tope del servicio es de 40 turnos por llamada.

## Costos fijos (aproximados, sin verificar)
- El proyecto de Supabase en plan Free puede pausarse por inactividad y tiene límites bajos. Para clientes que pagan conviene el plan de pago (alrededor de 25 $/mes).
- Make: el plan actual permite solo 2 escenarios activos; por eso el escenario de Gmail está apagado.
- Cloudflare Workers: el plan gratuito alcanza para empezar.
- Con uno o dos clientes, los fijos quedan cubiertos de sobra.

## Dos cosas a vigilar
1. **Qué voz está activa.** El documento `docs/voz-propia.md` describe la versión anterior en Supabase (Opus 5.5, `<Gather>` y voces Polly). El servicio `voice-relay` usa Haiku 4.5. Si Twilio todavía apunta a la función de Supabase con Opus 5.5 (4 $ y 20 $ por millón de tokens), el costo del modelo sube a cerca de 0,045 $/min. Conviene apuntar Twilio al Worker.
2. **Medir, no estimar.** Después de una semana de llamadas, comparar la factura de Twilio y el consumo de Anthropic con la suma de `duration_sec` de la tabla `calls`, y ajustar este cálculo.

## Argumento de venta
Una asistente humana cuesta alrededor de 3 500 a 4 500 $ al mes (**estimación**; no se presenta como cifra con fuente). Con 4 000 $ de referencia, el plan Esencial equivale a cerca del 10 %, el Pro a cerca del 15 % y el Completo a cerca del 20 %.

## Impuestos y facturación (consultar a un contador)
- Se vende **+ impuestos**. Si el precio fuera "todo incluido", el ingreso neto bajaría cerca del 13 %.
- Los clientes empresariales registrados recuperan la TPS y la TVQ, así que para ellos no son un costo real.
- Para cobrar impuestos hay que estar registrado: es obligatorio al pasar de 30 000 $ de ventas en 4 trimestres consecutivos y se puede hacer antes de forma voluntaria. La factura debe llevar los números de registro.
- Formalizar el negocio (nombre registrado o empresa) facilita facturar y protege el patrimonio personal.

## Pendiente de construir antes de vender cada promesa
1. Cada llamada llega a Supabase y el dashboard lee datos reales (plan Esencial).
2. La asistente reconoce al dueño cuando llama y le da sus reportes (plan Esencial).
3. Llamadas programadas de la asistente al dueño y WhatsApp por Twilio (plan Pro).
4. Instagram y Facebook, por ManyChat, y métricas de redes (plan Completo).
