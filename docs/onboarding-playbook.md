# Playbook de onboarding: del "me interesa" al cliente que paga

Objetivo: que un prospecto pase de **"me interesa"** a **cliente activo a 997–2 497 $/mes**, con el menor trabajo posible de tu lado y sin prometer nada que no esté listo.

```
1. Interés → 2. Link /onboarding/ → 3. Demo construida → 4. Llamada de descubrimiento
→ 5. Contrato firmado + 1er pago → 6. Número (transferir / nuevo / desvío) → 7. Go-live por fases → 8. Seguimiento
```

---

## 1. Interés (día 0)
Fuentes: flyers (QR), sitio, Instagram, referidos, llamadas a la línea demo.
- **Respuesta en menos de 1 hora hábil** con la plantilla A (abajo).
- Si llega por una página de sector, manda el link con el sector ya puesto: `https://meetaistaff.com/onboarding/?secteur=cvc`
- Valores de `secteur`: `immobilier`, `cvc`, `paysagement`, `deneigement`, `garages`, `nettoyage`, `barbiers`, `dental`, `sante`, `pro`, `coach`, `metiers`, `autre`
- Para saber de dónde vino, añade `&ref=flyer-laval` o `&ref=instagram`. Llega en el JSON.

## 2. El prospecto llena `/onboarding/` (unos 8 min)
- **Pide:** quién es, su negocio, sus servicios, su horario, sus redes (links públicos), cómo contesta hoy, la persona (Sofía, Alex o Tomás), idiomas, preguntas frecuentes, lo que la asistente nunca debe decir y sus objetivos.
- **No pide** contraseñas, accesos ni pagos. Lo dice en tres lugares distintos.
- Guarda un borrador en el navegador, así que puede cerrar y volver.

**Cómo te llegan las respuestas.**
- **Hoy, sin configurar nada:** el prospecto pulsa "Envoyer par courriel" y te llega un correo a hello@meetaistaff.com con todas las respuestas. También puede descargar un JSON.
- **Mejor (5 min en Make):**
  1. Crea un escenario con **Webhooks → Custom webhook**.
  2. Copia la URL en `onboarding/index.html`, en la constante `ONBOARDING_WEBHOOK = ""`, y haz commit.
  3. En Make, añade tres módulos:
     - **Supabase** (o Google Sheets): guardar la fila;
     - **Resend**: te avisa a ti;
     - **Resend**: le confirma al prospecto con la plantilla B.
  - La URL del webhook no es una clave secreta: solo recibe datos. Aun así, en Make activa "Restrict by IP / data structure" para que ignore basura.

## 3. Construir la demo (48 h hábiles como meta interna; no la prometas al prospecto)
1. Duplica la voz de la línea demo (`supabase/functions/voice/`) y personaliza su prompt con el negocio del prospecto.
2. Cambia el nombre del negocio, el saludo, la persona, los idiomas, los servicios, el horario, las FAQ y la lista de "nunca".
3. Revisa sus links públicos (web, Google, Instagram) para afinar el tono.
4. Prepara el dashboard:
   - `/demo/?n=Nombre&a=sofia&lang=fr` ya muestra su nombre;
   - para un sector: `/immobilier/demo/`.
5. Haz 3 llamadas de prueba tú mismo: una normal, una urgente y una fuera de horario.
6. Mándale la plantilla C con el número de demo y el link para agendar la llamada.

## 4. Llamada de descubrimiento (20–30 min, idealmente en video)
Guion:
1. **2 min.** Qué le quita el sueño (llamadas perdidas, noches, idiomas).
2. **8 min.** Que llame a la demo en vivo, delante de ti. Luego enséñale el dashboard.
3. **5 min.** Qué canales se activan hoy (llamadas, SMS, agenda) y cuáles **por fases**. Sé claro: *"Déploiement progressif : les canaux s'activent par phases et sont confirmés lors de l'appel découverte."*
4. **5 min.** Plan y precio. Recomienda Exécutive (1 497 $) si tiene más de 1 empleado o recibe más de 20 llamadas por semana. No uses estadísticas sin fuente. El costo de una asistente humana es una **estimación** (≈ 3 500–4 500 $/mes).
5. **3 min.** Número: ¿transferir el suyo, uno nuevo o desvío? (ver sección 6).
6. **Cierre:** "¿Te mando el contrato hoy?" Llena el **Anexo A** con él en la llamada.

## 5. Contrato y primer pago (mismo día)
1. Envía la **plantilla D** con el PDF del contrato en francés (y el inglés si lo pide, siempre después del francés).
2. Firma electrónica (Docusign, Dropbox Sign o PDF firmado).
3. Primer pago: Stripe (link de pago mensual) o débito preautorizado. Factura con TPS y TVQ.
4. Crea el tenant en Supabase (`owner_profiles`, `dashboard_token`) y guarda el contrato en su carpeta.

## 6. El número: tres opciones
| Opción | Cuándo | Plazo | Qué necesitas |
|---|---|---|---|
| **(c) Desvío de llamadas** | Para arrancar ya, sin riesgo | El mismo día | Que el cliente active "renvoi d'appel" (sin respuesta o siempre) hacia el número Twilio |
| **(b) Número nuevo** | No tiene línea o quiere una aparte | El mismo día | Comprar el número en Twilio (indicativo 514/438/450/418…) |
| **(a) Transferir (portage)** | Quiere que la IA conteste su número de siempre | Días o semanas, según el operador. **No prometas fecha.** | Anexo C firmado + factura reciente del operador. En Twilio: *Port & Host → Port a number*. |

**Consejo:** empieza siempre con **(c)** mientras se procesa el **(a)**. Así el cliente ve valor desde el día 1.

⚠️ El NIP de portabilidad se pide **solo por teléfono**, nunca por correo.

## 7. Go-live por fases
- **Fase 1 (al firmar):** llamadas, SMS y agenda. Envía la plantilla E.
- **Fases siguientes** (correo, WhatsApp, DMs, briefings):
  - se activan cuando estén listas y probadas;
  - se confirman **por correo** con la plantilla F, porque así lo exige el contrato (art. 3.2);
  - anota la fecha en el Anexo A.
- Los accesos (Google Calendar, etc.) se dan por OAuth, "Connecter avec Google". **Nunca por contraseña.**

## 8. Seguimiento
- **Día 3 y día 14:** llamada corta. ¿Qué respuesta corregimos?
- **Día 30:** resumen del mes (llamadas atendidas, citas tomadas) y pregunta por un testimonio. Para usar su logo o nombre necesitas su consentimiento **por escrito** (art. 11.3).
- **Si quiere irse:** 30 días de preaviso, export de datos, devolución del número si lo pide (arts. 5 y 9.4). Sin fricción. Un cliente que se va bien vuelve o te recomienda.

---

## Plantillas (FR primero; EN debajo)

### A. Primera respuesta al interés
**FR.** Objet : Votre démo AI Staff
> Bonjour {prénom},
> Merci de votre intérêt! Pour préparer une démo avec le nom de votre entreprise et vos services, répondez à quelques questions (environ 8 minutes, aucun mot de passe demandé) :
> 👉 https://meetaistaff.com/onboarding/?secteur={secteur}
> Dès que c'est fait, on prépare votre adjointe et on vous revient pour vous la présenter.
> Andrés · AI Staff · +1 (438) 805-8804

**EN.** Subject: Your AI Staff demo
> Hi {first name},
> Thanks for your interest! To prepare a demo with your business name and services, please answer a few questions (about 8 minutes, no passwords needed):
> 👉 https://meetaistaff.com/onboarding/?lang=en&secteur={sector}
> Once it's done, we'll set up your assistant and get back to you to show it.
> Andrés · AI Staff · +1 (438) 805-8804

**SMS FR.** Bonjour {prénom}, ici Andrés d'AI Staff. Pour préparer votre démo (8 min, aucun mot de passe) : meetaistaff.com/onboarding. Répondez STOP pour ne plus recevoir de textos.

### B. Confirmación automática (Make → Resend)
**FR.** Merci {prénom}! On a bien reçu vos réponses pour {entreprise}. On prépare votre démo et on vous contacte pour planifier l'appel découverte. Rien d'autre à faire pour l'instant.
**EN.** Thanks {first name}! We received your answers for {business}. We're preparing your demo and will contact you to schedule the discovery call. Nothing else to do for now.

### C. La demo está lista
**FR.** Objet : {adjointe} est prête à vous répondre
> Bonjour {prénom}, votre démo est prête. Appelez {adjointe} au +1 (438) 805-8804 et posez-lui les questions de vos clients. Voici aussi un aperçu de votre tableau de bord : {lien}.
> Quand pouvez-vous prendre 20 minutes pour qu'on la regarde ensemble? {lien calendrier}

**EN.** Subject: {assistant} is ready to answer you
> Hi {first name}, your demo is ready. Call {assistant} at +1 (438) 805-8804 and ask the questions your customers ask. Here's a preview of your dashboard: {link}.
> When can you take 20 minutes so we can go through it together? {calendar link}

### D. Envío del contrato
**FR.** Objet : Votre contrat AI Staff
> Bonjour {prénom}, comme convenu, voici le contrat de service (mois à mois, 30 jours d'avis, aucune pénalité) avec le bon de commande rempli : plan {plan}, {prix} $/mois + taxes, installation {frais}. Les canaux s'activent par phases : on commence par les appels, les SMS et l'agenda. Dès la signature et le premier paiement, on branche votre numéro.

**EN.** Subject: Your AI Staff agreement
> Hi {first name}, as discussed, here is the service agreement (month-to-month, 30 days' notice, no penalty) with the completed order form: {plan} plan, ${price}/month + taxes, setup {fee}. Channels are activated in phases: we start with calls, texts and calendar. As soon as it's signed and the first payment is made, we connect your number. The French version is attached first, as required by Quebec law.

### E. Go-live, fase 1
**FR.** {adjointe} répond maintenant à vos appels au {numéro}. Actifs aujourd'hui : appels, SMS, agenda. Votre tableau de bord : {lien}. Dites-nous toute réponse à corriger : on l'ajuste le jour même.
**EN.** {assistant} is now answering your calls at {number}. Active today: calls, texts, calendar. Your dashboard: {link}. Tell us about any answer to fix and we'll adjust it the same day.

### F. Activación de un canal nuevo (confirmación escrita)
**FR.** Bonne nouvelle : le canal **{canal}** est maintenant actif pour {entreprise}, en date du {date}. Rien à changer de votre côté.
**EN.** Good news: the **{channel}** channel is now active for {business}, as of {date}. Nothing to change on your side.
