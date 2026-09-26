# Deploy de meetaistaff.com: de Netlify a GitHub Pages

**Por qué GitHub Pages y no Cloudflare Pages.** El repo es público, así que GitHub Pages es gratis y no tiene límite de créditos. Además solo hay que tocar **los registros del sitio web** en Ionos. Cloudflare Pages, para usar el dominio raíz (`meetaistaff.com` sin `www`), obliga a mover los *nameservers* a Cloudflare. Eso implica recrear también los registros de correo (MX) y arriesgar `hello@meetaistaff.com`. Con GitHub Pages el correo no se toca.

Cada vez que se haga merge a `main`, el sitio se publica solo, sin arrastrar archivos.

---

## Paso 1: Publicar el código en `main` (2 min)

Los cambios están en la rama `claude/new-session-tnxmad`.

1. Abre https://github.com/Andresfcarreno/aistaff-website
2. Crea el Pull Request de `claude/new-session-tnxmad` hacia `main`. Si quieres, Claude lo abre por ti.
3. Haz clic en **Merge**.

## Paso 2: Activar GitHub Pages (2 min)

1. En el repo: **Settings → Pages**.
2. En **Build and deployment → Source**, elige **Deploy from a branch**.
3. En **Branch**, elige `main` y la carpeta `/ (root)`. Luego **Save**.
4. En **Custom domain**, escribe `meetaistaff.com` y dale **Save**. El archivo `CNAME` ya está en el repo.
5. Espera 1–2 minutos. En esa misma página aparecerá "Your site is live at…".

## Paso 3: Cambiar el DNS en Ionos (5 min)

Entra en Ionos, ve a **Dominios y SSL → meetaistaff.com → DNS**.

### 3a. BORRAR estos registros

| Tipo | Host / Nombre | Valor | Por qué |
|---|---|---|---|
| A | `@` | `75.2.60.5` | Es Netlify |
| AAAA | `@` | *(cualquiera, si existe)* | Si Ionos puso uno por defecto, choca con GitHub |
| CNAME o A | `www` | *(lo que apunte a Netlify o a Ionos)* | Lo reemplazamos abajo |

> ⚠️ **NO borres** los registros **MX**, **TXT** (SPF/DKIM/DMARC) ni los relacionados con el correo. Son los de `hello@meetaistaff.com` y de Resend.

### 3b. AGREGAR estos registros (copiar exactamente)

| Tipo | Host / Nombre | Valor | TTL |
|---|---|---|---|
| A | `@` | `185.199.108.153` | 1 hora |
| A | `@` | `185.199.109.153` | 1 hora |
| A | `@` | `185.199.110.153` | 1 hora |
| A | `@` | `185.199.111.153` | 1 hora |
| AAAA | `@` | `2606:50c0:8000::153` | 1 hora |
| AAAA | `@` | `2606:50c0:8001::153` | 1 hora |
| AAAA | `@` | `2606:50c0:8002::153` | 1 hora |
| AAAA | `@` | `2606:50c0:8003::153` | 1 hora |
| CNAME | `www` | `andresfcarreno.github.io` | 1 hora |

Los 4 AAAA son para IPv6. Son recomendados pero no obligatorios. Si Ionos no te deja crearlos, los A bastan.

## Paso 4: Activar HTTPS (espera de 15 min a 24 h)

1. Vuelve a **Settings → Pages** en GitHub.
2. Cuando el chequeo del dominio salga en verde ("DNS check successful"), marca **Enforce HTTPS**.
3. Si la casilla aparece gris, GitHub todavía está generando el certificado. Vuelve en una hora.

## Paso 5: Verificar

- https://meetaistaff.com: la nueva home (FR por defecto)
- https://meetaistaff.com/?lang=es&a=tomas: en español, con Tomás
- https://meetaistaff.com/demo/: el dashboard generalizado
- https://meetaistaff.com/immobilier/: la landing para courtiers
- https://meetaistaff.com/immobilier/demo/: el dashboard inmobiliario

Cuando todo funcione, puedes borrar el sitio en Netlify.

---

## ⚠️ Antes de cambiar el DNS: páginas que faltan

La home enlaza a `/dental/`, `/barbiers/` y `/garages/`, pero **esos HTML no están en el repo**: solo existen en Netlify. En cuanto cambie el DNS, esas URLs mostrarán la página `404.html`, que tiene un enlace a la home.

Para no perderlas:
1. Descarga los 3 HTML desde Netlify (Deploys → el último deploy → *Download*), o búscalos en tu carpeta local `humanAISTAFF/website`.
2. Pásaselos a Claude. Él los pone en `/dental/index.html`, `/barbiers/index.html` y `/garages/index.html` y unifica la marca y los precios.

## Opcional: verificar el dominio en GitHub (recomendado)

Evita que otra cuenta de GitHub pueda "tomar" tu dominio.

1. Ve a tu foto (arriba a la derecha) → **Settings → Pages → Add a domain** → `meetaistaff.com`.
2. GitHub te da un registro **TXT** con nombre `_github-pages-challenge-Andresfcarreno` y un valor único. Cópialo en Ionos tal cual.
3. Vuelve a GitHub y dale **Verify**.

## Parámetros de URL útiles (para anuncios y videos)

| Parámetro | Ejemplo | Efecto |
|---|---|---|
| `lang` | `?lang=es` | Idioma (fr por defecto, en, es) |
| `a` | `?a=alex` | Persona: `sofia` (por defecto), `alex`, `tomas` |
| `niche` | `?niche=dentiste` | Pestaña "Pour qui" preseleccionada: `dentiste`, `immobilier`, `pro`, `createur`, `metiers`, `maison` |
| `n` | `?n=Julie` | Nombre del visitante en el briefing y el dashboard |

Ejemplo para un anuncio de dentistas en español: `https://meetaistaff.com/?lang=es&niche=dentiste&n=Andrea#pour-qui`

En `/demo/` funcionan `lang`, `a` y `n`, y además `#briefings`, `#messages`, etc. para abrir una pestaña directamente. `/demo/?v=immobilier` redirige a la versión inmobiliaria.
