# Parte legal de AI Staff: qué hay y qué te toca hacer

> ⚠️ **Estos documentos son borradores sólidos, no asesoría legal.** Antes de firmar el primer cliente, pide a un abogado de Quebec que los revise. Una revisión de un contrato ya redactado suele costar mucho menos que redactarlo desde cero. Pregunta en el Barreau du Québec o en la clínica de PME de tu zona.

## Los documentos

| Archivo | Para qué | Cuándo se usa |
|---|---|---|
| `AI-Staff_Entente-demo_FR` / `_Demo-Agreement_EN` | Entente de démo y confidencialidad (2 páginas) | Opcional. El formulario `/onboarding/` ya pide el consentimiento con casillas. Úsala si el prospecto quiere algo firmado. |
| `AI-Staff_Contrat-de-service_FR` / `_Service-Agreement_EN` | Contrato de servicio mes a mes | Después de la llamada de descubrimiento, cuando el cliente dice que sí |
| Anexo A (dentro del contrato) | Bon de commande: plan, precio, canales activos, opción de número | Se llena con el cliente en la llamada |
| Anexo B | Entente de traitement (Ley 25): AI Staff es *prestataire de services* | Siempre, forma parte del contrato |
| Anexo C | Autorización de portabilidad del número (LOA) | Solo si el cliente transfiere su número |

Cada documento viene en `.docx` (para editar) y `.pdf` (para mirar). Se generan con `tools/legal/` (`node contrat_fr.js salida.docx`). Si cambias el texto, cámbialo en el `.js` y vuelve a generar el archivo, para que el FR y el EN no se desalineen.

**Rellena antes de usar:** `[Nom légal]`, `NEQ`, `[adresse]`, los números TPS/TVQ y el interés por retraso (`[____] %`). Si todavía no tienes empresa registrada, pon "Andrés Carreño, faisant affaire sous le nom AI Staff" y registra el nombre en el Registraire des entreprises.

## Idioma (Ley 96)
- El contrato es de adhesión, así que **siempre se entrega primero en francés**.
- Si el cliente prefiere el inglés, marca la casilla del artículo 16.6 **después** de haberle dado la versión francesa.
- Envía los dos PDF en el mismo correo, el francés primero.

## Lo que el contrato protege
- **Mes a mes y 30 días de preaviso.** Así lo dice el sitio, así que el contrato no puede decir otra cosa.
- **Déploiement progressif**, con la nota obligatoria, y sin fechas de activación garantizadas.
- **Límites de la IA:** puede equivocarse, no da consejo profesional (OACIQ, salud, derecho) y no es un servicio de emergencia (911).
- **Transparencia:** la asistente dice que es una IA y que la llamada puede grabarse.
- **Nada de llamadas en frío.** Las salientes van solo a personas con relación existente o consentimiento (CRTC, LNNTE, CASL). El cliente responde por los consentimientos de sus propios mensajes.
- **Tope de responsabilidad:** lo pagado en los últimos 3 meses. El Código Civil no deja excluir la culpa intencional o grave (art. 1474), y eso ya está previsto.
- **Número:** si se transfiere, sigue siendo del cliente y se le devuelve si lo pide en los 30 días siguientes al fin del contrato.
- **Datos:** el cliente puede exportarlos durante 30 días al terminar y luego se borran. No se venden ni se usan para entrenar modelos.

## Checklist Ley 25 (lo que tienes que *hacer*, no solo escribir)
La política `/confidentialite/` y el Anexo B **prometen** estas cosas. Tienen que ser verdad:

1. **Persona responsable:** tú (ya publicado en `/confidentialite/`).
2. **Evaluación de factores de privacidad (EFVP)** para la transferencia fuera de Quebec (Retell, Twilio, Anthropic, Make, Supabase, Resend). Es un documento interno de 2 o 3 páginas: qué datos, qué proveedor, dónde, qué protecciones (su DPA, cifrado, SOC 2). La Commission d'accès à l'information publica una guía y una plantilla.
3. **Aceptar los DPA de cada proveedor.** Retell, Twilio, Anthropic, Make, Supabase y Resend tienen un Data Processing Addendum en su panel o en su web. Descárgalos y guárdalos.
4. **Supabase:** si puedes, elige la región `ca-central-1` (Canadá) al crear el proyecto de producción y actualiza la tabla de la política.
5. **Registro de incidentes:** una hoja simple con fecha, qué pasó, datos afectados, riesgo y medidas. Aunque esté vacío, tiene que existir.
6. **Retención:** borra los prospectos sin seguimiento a los 12 meses (así lo dice la política). Pon un recordatorio trimestral.
7. **Políticas del cliente:** recuerda a cada cliente que su propia política de confidentialité mencione a la asistente IA y la grabación (Anexo B, art. 3.1).

## Otras cosas prácticas
- **TPS/TVQ:** es obligatorio registrarse cuando superas 30 000 $ en 4 trimestres. Con 3 clientes llegas en pocos meses, así que regístrate desde el inicio para cobrar las taxes desde la primera factura.
- **Seguro de responsabilidad profesional (E&O / cyber):** muy recomendable para un servicio que contesta llamadas de terceros. Pide cotización.
- **Firma electrónica:** en Quebec es válida. Sirven Docusign, Dropbox Sign o incluso un PDF firmado y devuelto por correo.
- **Grabación de llamadas:** en Canadá basta el consentimiento de una parte, pero el contrato obliga a anunciarla igual. Configura el mensaje de Retell para que lo diga siempre.
