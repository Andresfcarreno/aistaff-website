# Precios y costos (octubre de 2026)

## Los planes
| Plan | Precio/mes + impuestos | Con TPS y TVQ (14,975 %) |
|---|---|---|
| Essentiel / Essential / Esencial | 397 $ | 456,45 $ |
| Pro | 597 $ | 686,40 $ |
| Complet / Complete / Completo | 797 $ | 916,31 $ |

Decisión del dueño: tres precios sin plan "destacado", sin humano de respaldo, correo fuera de los planes, instalación gratis en el lanzamiento y mes a mes.

## Costos que respaldan el precio
> **Ojo (3 oct. 2026):** la voz de la línea ya no usa Retell sino la voz propia (Twilio + Anthropic, ver `docs/voz-propia.md`). La fila de Retell es solo una referencia de mercado: hay que recalcular el costo por minuto con la factura real de Twilio (voz, reconocimiento y síntesis) y los tokens de Anthropic.

Datos de **fuentes de segunda mano** (las páginas oficiales estaban bloqueadas al investigarlos). Confirmarlos en las cuentas propias antes de cambiar precios.

| Pieza | Costo | Fuente |
|---|---|---|
| Llamadas con IA (Retell) | Voz ≈ 0,07 $/min + modelo (0,025 a 0,08 $/min) + telefonía ≈ 0,015 $/min. Una configuración típica ronda **0,13 $/min** | [Retell](https://www.retellai.com/blog/ai-voice-agent-pricing-full-cost-breakdown-platform-comparison-roi-analysis), [Layer3 Labs](https://www.layer3labs.io/guides/retell-ai-pricing) |
| WhatsApp (Meta) | Desde el 1 de octubre de 2026, ≈ 0,0034 $ por mensaje de servicio o utilidad en Canadá; 1 000 mensajes de servicio gratis al mes por número. El proveedor (Twilio u otro) suma su tarifa | [Drag](https://www.dragapp.com/blog/whatsapp-business-api-pricing/) |
| Instagram y Facebook (ManyChat Pro) | ≈ 39 $/mes (29 $ si se paga por año) hasta 2 500 contactos, por cliente | [Featurebase](https://www.featurebase.app/blog/manychat-pricing) |
| Sin verificar | Números y SMS de Twilio en Canadá; precios de otros competidores | |

## Cálculo de margen (ejemplo con supuestos a reemplazar)
- Un cliente con 150 llamadas al mes de 2,5 minutos usa 375 minutos.
- A 0,13 a 0,20 $/min, eso cuesta 49 a 75 $/mes. Con el plan de 397 $ el costo variable es del 12 al 19 %.
- Regla práctica: el costo variable no debería pasar del 25 o 30 % del precio.
- "Ilimitado" siempre con **uso razonable**: tope orientativo de 1 000 minutos y 0,25 $/min de excedente (el contrato tiene el campo en el Anexo A). El plan Esencial, sin llamadas programadas ni WhatsApp, apunta a unos 400 minutos incluidos.
- El costo mayor es el tiempo de configuración y soporte, no la tecnología.

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
