import asyncio, os, html
from playwright.async_api import async_playwright

D = os.path.dirname(os.path.abspath(__file__))
F = f"file://{D}/node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin"

ADS = [
    # name, w, h, lang, headline, sub, chips, cta, foot, bubbles
    ("aistaff_fr_general_4x5", 1080, 1350, "fr",
     "Vous manquez des appels pendant que vous travaillez?",
     "Votre réceptionniste IA répond 24/7 en français, en anglais et en espagnol.",
     ["Français", "English", "Español"], "Essayez-la : 438-805-8804",
     "AI Staff · meetaistaff.com · Dès 397 $/mois + taxes", None),
    ("aistaff_fr_garage_4x5", 1080, 1350, "fr",
     "Les mains dans le moteur? Elle répond pour vous.",
     "Elle prend les demandes de rendez-vous et vous envoie un résumé par texto.",
     ["24/7", "Sans contrat", "FR · EN · ES"], "Appelez-la : 438-805-8804",
     "AI Staff · meetaistaff.com · Dès 397 $/mois + taxes", None),
    ("aistaff_fr_appelez_4x5", 1080, 1350, "fr",
     "Appelez-la. Dites-lui le nom de votre entreprise.",
     "Elle devient votre réceptionniste, en direct.",
     [], "438-805-8804",
     "AI Staff · meetaistaff.com · Dès 397 $/mois + taxes",
     ["Bonjour, ici votre réceptionniste.", "Comment puis-je vous aider?"]),
    ("aistaff_en_general_4x5", 1080, 1350, "en",
     "Missing calls while you work?",
     "Your AI receptionist answers 24/7 in English, French and Spanish.",
     ["English", "Français", "Español"], "Try her now: 438-805-8804",
     "AI Staff · meetaistaff.com · From $397/month + taxes", None),
    ("aistaff_es_general_story", 1080, 1920, "es",
     "¿Pierdes llamadas mientras trabajas?",
     "Ella contesta 24/7 en francés, inglés y español.",
     ["Francés", "Inglés", "Español"], "Llama y pruébala: 438-805-8804",
     "AI Staff · Desde 397 $/mes + impuestos", None),
    ("aistaff_fr_general_story", 1080, 1920, "fr",
     "Elle répond pendant que vous travaillez.",
     "24/7, en français, en anglais et en espagnol.",
     ["Français", "English", "Español"], "Essayez-la : 438-805-8804",
     "AI Staff · Dès 397 $/mois + taxes", None),
    ("aistaff_es_idiomas_story", 1080, 1920, "es",
     "Ellos hablan francés e inglés. Tú, español.",
     "Tu asistente con IA atiende a todos y te reporta en español.",
     [], "Pruébala: 438-805-8804",
     "AI Staff · meetaistaff.com",
     ["Bonjour, je voudrais un rendez-vous", "Hi, do you have time today?", "Jefe: 2 citas nuevas para mañana ✓"]),
    ("aistaff_fr_deneigement_story", 1080, 1920, "fr",
     "Déneigement : ne manquez plus un client.",
     "Votre adjointe IA répond pendant la tempête, 24/7.",
     ["Noms", "Adresses", "Numéros"], "Essayez-la : 438-805-8804",
     "AI Staff · Dès 397 $/mois + taxes", "snow"),
]

def page(w, h, lang, head, sub, chips, cta, foot, bubbles):
    story = h > 1500
    e = html.escape
    chips_html = "".join(f'<span class="chip">{e(c)}</span>' for c in chips)
    if isinstance(bubbles, list):
        visual = '<div class="bubbles">' + "".join(
            f'<div class="bub{" me" if i == len(bubbles)-1 and len(bubbles) > 2 else ""}">{e(b)}</div>' for i, b in enumerate(bubbles)
        ) + '</div><div class="orb solo"><div class="wave">' + "<i></i>" * 9 + "</div></div>"
    else:
        visual = f'''<div class="orb"></div>
        <div class="phone"><div class="notch"></div>
          <div class="callorb"><div class="wave">{"<i></i>"*9}</div></div>
          <div class="who">Sofía · AI Staff</div>
          <div class="sub2">{ {"fr":"Appel entrant","en":"Incoming call","es":"Llamada entrante"}[lang] }</div>
          <div class="btns"><span class="no">✕</span><span class="yes">✆</span></div>
        </div>'''
    snow = '<div class="snow"></div>' if bubbles == "snow" else ""
    pad_top = 210 if story else 80
    pad_bot = 300 if story else 60
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:J;font-weight:500;src:url({F}-500-normal.woff2)}}
@font-face{{font-family:J;font-weight:700;src:url({F}-700-normal.woff2)}}
@font-face{{font-family:J;font-weight:800;src:url({F}-800-normal.woff2)}}
:root{{--navy:#0A1A33;--blue:#1F6FEB;--ice:#9CC3FF}}
*{{box-sizing:border-box;margin:0}}
body{{width:{w}px;height:{h}px;overflow:hidden;font-family:J,sans-serif;color:#fff;
 background:radial-gradient(ellipse 90% 55% at 50% {58 if story else 62}%,#163a7a 0%,#0d2550 35%,var(--navy) 70%),var(--navy);
 display:flex;flex-direction:column;align-items:center;padding:{pad_top}px 72px {pad_bot}px;position:relative}}
.snow{{position:absolute;inset:0;background-image:radial-gradient(2px 2px at 20px 30px,#fff8,transparent),radial-gradient(3px 3px at 120px 90px,#fffa,transparent),radial-gradient(2px 2px at 200px 160px,#fff7,transparent),radial-gradient(1.5px 1.5px at 60px 200px,#fff9,transparent);background-size:240px 240px;opacity:.7}}
.brand{{font-weight:800;letter-spacing:.12em;font-size:26px;color:var(--ice);text-transform:uppercase;margin-bottom:{36 if story else 28}px}}
h1{{font-weight:800;font-size:{88 if story else 76}px;line-height:1.04;text-align:center;letter-spacing:-.02em;text-wrap:balance}}
p.sub{{font-weight:500;font-size:{40 if story else 34}px;line-height:1.3;text-align:center;color:#d8e6ff;margin-top:26px;max-width:900px;text-wrap:balance}}
.chips{{display:flex;gap:14px;margin-top:28px;flex-wrap:wrap;justify-content:center}}
.chip{{border:2px solid #3d6bc4;background:#0f2a5a;border-radius:999px;padding:10px 26px;font-weight:700;font-size:26px;color:#cfe0ff}}
.visual{{flex:1;position:relative;width:100%;margin:24px 0;display:flex;align-items:center;justify-content:center;min-height:0}}
.orb{{position:absolute;width:{760 if story else 620}px;height:{760 if story else 620}px;border-radius:50%;
 background:radial-gradient(circle,#2f7dff55 0%,#1F6FEB22 45%,transparent 70%);box-shadow:0 0 0 2px #2f7dff33,0 0 160px 40px #1F6FEB33}}
.orb.solo{{position:relative;width:340px;height:340px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,#4d8fff 0%,#1F6FEB 45%,#0d2a66 75%);box-shadow:0 0 120px 40px #1F6FEB66}}
.phone{{position:relative;width:{330 if story else 270}px;height:{600 if story else 470}px;border-radius:56px;background:linear-gradient(180deg,#0b1730,#061022);
 border:10px solid #1d2b47;box-shadow:0 0 0 2px #4a5f86,0 30px 80px #000a;display:flex;flex-direction:column;align-items:center;padding-top:{80 if story else 50}px}}
.notch{{position:absolute;top:16px;width:110px;height:30px;border-radius:20px;background:#000}}
.callorb{{width:{160 if story else 140}px;height:{160 if story else 140}px;border-radius:50%;background:radial-gradient(circle,#4d8fff 0%,#1F6FEB 50%,#0d2a66 80%);box-shadow:0 0 70px 14px #1F6FEB88;display:flex;align-items:center;justify-content:center}}
.wave{{display:flex;gap:7px;align-items:center;height:80px}}
.wave i{{display:block;width:7px;border-radius:4px;background:#fff}}
.wave i:nth-child(1),.wave i:nth-child(9){{height:18px}} .wave i:nth-child(2),.wave i:nth-child(8){{height:34px}}
.wave i:nth-child(3),.wave i:nth-child(7){{height:52px}} .wave i:nth-child(4),.wave i:nth-child(6){{height:66px}} .wave i:nth-child(5){{height:78px}}
.who{{font-weight:800;font-size:{34 if story else 28}px;margin-top:{34 if story else 28}px}}
.sub2{{font-weight:500;font-size:{26 if story else 20}px;color:#9fb6dd;margin-top:8px}}
.btns{{margin-top:auto;margin-bottom:{60 if story else 36}px;display:flex;gap:{90 if story else 60}px}}
.btns span{{width:{96 if story else 70}px;height:{96 if story else 70}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:800}}
.no{{background:#e5484d}} .yes{{background:#2fbf71}}
.bubbles{{display:flex;flex-direction:column;gap:22px;align-items:center;margin-right:0;position:absolute;top:{80 if story else 30}px;width:100%}}
.bub{{background:#13305f;border:2px solid #3d6bc4;border-radius:28px 28px 28px 8px;padding:20px 30px;font-weight:700;font-size:{36 if story else 32}px;max-width:88%}}
.bub.me{{background:var(--blue);border-color:#6ea2ff;border-radius:28px 28px 8px 28px}}
.bubbles + .orb.solo{{margin-top:{360 if story else 200}px}}
.cta{{background:linear-gradient(180deg,#2f80ff,#1F6FEB);border-radius:26px;padding:30px 40px;font-weight:800;font-size:{50 if story else 46}px;box-shadow:0 14px 40px #1F6FEB66;text-align:center;width:100%}}
.foot{{font-weight:500;font-size:{28 if story else 24}px;color:#a9bde0;margin-top:22px;text-align:center}}
</style></head><body>{snow}
<div class="brand">AI Staff</div>
<h1>{e(head)}</h1><p class="sub">{e(sub)}</p>
{f'<div class="chips">{chips_html}</div>' if chips else ''}
<div class="visual">{visual}</div>
<div class="cta">{e(cta)}</div><div class="foot">{e(foot)}</div>
</body></html>'''

async def main():
    os.makedirs(f"{D}/out", exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for name, w, h, lang, *rest in ADS:
            pg = await b.new_page(viewport={"width": w, "height": h})
            await pg.set_content(page(w, h, lang, *rest))
            await pg.wait_for_timeout(300)
            await pg.screenshot(path=f"{D}/out/{name}.png")
            await pg.close()
        await b.close()
    print("ok")

asyncio.run(main())
