# Cómo se publica AI Staff (estado actual, octubre 2026)

Todo se publica con un **push a `main`** en https://github.com/Andresfcarreno/aistaff-website. No hay que arrastrar archivos ni correr comandos.

| Qué | Dónde se publica | Cómo |
|---|---|---|
| Sitio y dashboard (`meetaistaff.com`, `/demo/`, sectores, onboarding) | **GitHub Pages**, rama `main`, carpeta raíz | Automático al hacer push a `main` |
| Voz de Sofía (`voice-relay/`, Cloudflare Worker `aistaff-voice-relay`) | **Cloudflare Workers Builds**, repo conectado, rama `main`, directorio raíz `voice-relay`, comando `npx wrangler deploy` | Automático al hacer push a `main` (Cloudflare → Workers → aistaff-voice-relay → Deployments) |
| Base de datos y funciones (`supabase/`) | Proyecto Supabase `vqvdmcxkkmkyxpfnxmzo` | Migraciones y Edge Functions por el panel o el MCP de Supabase |

Netlify **ya no se usa** (los deploys estaban pausados por créditos). El sitio viejo ahí se puede borrar.

## Dominio y DNS

- Registrador y DNS: **Ionos** (nameservers `ui-dns.*`). Cloudflare no maneja el DNS de `meetaistaff.com`.
- Registros del sitio en Ionos:
  - 4 registros **A** en `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - **CNAME** `www` → `andresfcarreno.github.io`
- Opcional: 4 registros AAAA (`2606:50c0:8000::153` a `8003::153`) para IPv6. No hacen falta.
- **No tocar** los registros de correo: MX (`mx00/mx01.ionos.com`), TXT/SPF, DKIM, DMARC, ni los de Resend (`resend._domainkey`, `send`). Son los de `hello@meetaistaff.com`.
- GitHub Pages: Settings → Pages → Custom domain `meetaistaff.com` (el archivo `CNAME` del repo lo declara) y **Enforce HTTPS** marcado.

## Secretos (nunca en el código)

- Cloudflare Worker: `ANTHROPIC_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` (Workers → Settings → Variables and secrets). Variables públicas en `voice-relay/wrangler.jsonc`.
- Supabase Auth → URL Configuration: debe incluir `https://meetaistaff.com/demo/` en Redirect URLs (login con enlace mágico del dashboard).

## Si algo falla

- **Sofía no contesta o suena el mensaje de error:** mirar Cloudflare → aistaff-voice-relay → Observability (logs) y que el último deploy de Deployments esté en verde. El número de Twilio debe apuntar al Worker (`https://aistaff-voice-relay.andycarrenofx.workers.dev`).
- **El deploy del Worker falla:** abrir el build en Deployments; revisar el log. Se puede volver a una versión anterior desde esa misma pantalla (Rollback).
- **El sitio no abre:** GitHub → Actions → "pages build and deployment". Si el dominio muestra error de certificado, esperar; GitHub lo regenera solo.
- **Deploy manual de emergencia del Worker** (solo si Cloudflare está caído): desde `voice-relay/`, `npm install` y `npm run deploy`.

## Páginas por sector

`/immobilier/`, `/cvc/`, `/paysagement/`, `/deneigement/`, `/garages/`, `/nettoyage/`, `/barbiers/` y `/dental/` se **generan**; no se editan a mano. Se regeneran con `python3 tools/build_sectors.py` (contenido en `tools/sectors_*.py`). Después de regenerar, hacer commit de los HTML resultantes.

## Parámetros de URL útiles (para anuncios y videos)

| Parámetro | Dónde | Ejemplo | Efecto |
|---|---|---|---|
| `lang` | todas las páginas | `?lang=es` | Idioma (fr por defecto, en, es) |
| `a` | home, sectores, dashboard | `?a=alex` | Persona: `sofia` (por defecto), `alex`, `tomas` |
| `n` | dashboard | `?n=Julie` | Nombre del visitante en el dashboard de demo |
| `secteur` | `/onboarding/` | `?secteur=cvc` | Sector preseleccionado en el formulario |
| `ref` | `/onboarding/` | `?ref=flyer` | Origen del prospecto (viaja con sus respuestas) |

En `/demo/` funcionan `lang`, `a` y `n`, y además `#briefings`, `#messages`, etc. `/demo/?v=immobilier` redirige a la versión inmobiliaria.
