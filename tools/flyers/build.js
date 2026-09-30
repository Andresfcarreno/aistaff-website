// Builds AI Staff flyers (HTML) then renders PNG + PDF with Playwright.
// Usage: NODE_PATH=<dir with playwright + qrcode> node tools/flyers/build.js
const fs = require("fs"), path = require("path");
const QR = require("qrcode");
const { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "marketing/flyers");
fs.mkdirSync(OUT, { recursive: true });

// same silhouettes as the site (reused from /onboarding/)
const ob = fs.readFileSync(path.join(ROOT, "onboarding/index.html"), "utf8");
const avatar = new Function(ob.slice(ob.indexOf("function avatar(id){"), ob.indexOf("/* ---------- steps")).trim() + "\nreturn avatar;")();

const PHONE = "+1 (438) 805-8804";
const C = {
  general: {
    persona: "sofia", q: "",
    fr: { eyebrow: "Adjointe personnelle IA · Montréal", h1: "Votre prochaine employée est <em>une IA.</em>",
      lead: "Elle répond à vos appels jour et nuit, prend vos rendez-vous et vous texte l'essentiel. Vous travaillez, elle s'occupe du reste.",
      caller: "Bonjour! Est-ce que je peux prendre rendez-vous jeudi?", ai: "Bien sûr! J'ai 10 h ou 14 h 30. Laquelle vous convient?", notif: "Rendez-vous confirmé · jeudi 14 h 30", notifIc: "📅",
      name: "Sofía", role: "Adjointe IA · en ligne",
      feats: [["📞", "Appels 24/7", "Plus d'appel manqué, même le soir et la fin de semaine."], ["📅", "Votre agenda", "Elle propose vos plages libres et réserve directement."], ["💬", "SMS de suivi", "Confirmations et rappels envoyés pour vous."], ["🌐", "Trilingue", "Français, anglais, espagnol. D'autres langues selon le plan."]],
      phases: "Par phases : courriel, WhatsApp, messages privés et briefings vocaux.",
      from: "À partir de", price: "997 $", per: "/mois", terms: "Mois à mois · sans contrat · installation offerte au lancement",
      callL: "Appelez Sofía maintenant", qrT: "Votre démo gratuite", qrS: "Faite avec le nom de votre entreprise. 8 minutes, aucun mot de passe.",
      note: "Déploiement progressif : les canaux s'activent par phases et sont confirmés lors de l'appel découverte. Prix en CAD, taxes en sus." },
    en: { eyebrow: "AI personal assistant · Montreal", h1: "Your next employee is <em>an AI.</em>",
      lead: "She answers your calls day and night, books your appointments and texts you what matters. You work; she handles the rest.",
      caller: "Hi! Can I book an appointment on Thursday?", ai: "Of course! I have 10 AM or 2:30 PM. Which works best?", notif: "Appointment confirmed · Thu 2:30 PM", notifIc: "📅",
      name: "Sofía", role: "AI assistant · online",
      feats: [["📞", "Calls 24/7", "No more missed calls, even evenings and weekends."], ["📅", "Your calendar", "She offers your open slots and books directly."], ["💬", "Follow-up texts", "Confirmations and reminders sent for you."], ["🌐", "Trilingual", "French, English, Spanish. More languages by plan."]],
      phases: "In phases: email, WhatsApp, direct messages and voice briefings.",
      from: "From", price: "$997", per: "/month", terms: "Month-to-month · no contract · free setup at launch",
      callL: "Call Sofía now", qrT: "Your free demo", qrS: "Built with your business name. 8 minutes, no passwords.",
      note: "Phased rollout: channels are activated in phases and confirmed during the discovery call. Prices in CAD, plus taxes." },
  },
  immobilier: {
    persona: "alex", q: "secteur=immobilier&",
    fr: { eyebrow: "Pour les courtiers immobiliers du Québec", h1: "Ne laissez plus un acheteur tomber <em>sur votre boîte vocale.</em>",
      lead: "Pendant vos visites, Alex, votre adjoint·e IA, répond, qualifie les acheteurs et vendeurs, et réserve les visites dans votre agenda.",
      caller: "Bonjour, la maison sur la rue Fleury est-elle encore disponible?", ai: "Oui! Je peux vous proposer une visite samedi à 11 h. Avez-vous une préapprobation?", notif: "Visite réservée · samedi 11 h · acheteur préapprouvé", notifIc: "🏡",
      name: "Alex", role: "Adjoint·e IA · en ligne",
      feats: [["📞", "Pendant vos visites", "Chaque appel reçoit une réponse, même quand vous êtes occupé·e."], ["✅", "Qualification", "Budget, préapprobation, délai, secteur : tout est noté."], ["📅", "Visites à l'agenda", "Réservées selon vos disponibilités."], ["🌐", "FR · EN · ES", "Pour les acheteurs d'ici et de partout."]],
      phases: "OACIQ : Alex ne donne jamais de conseil de courtage. Prix, offres et contrats vous sont transférés.",
      from: "À partir de", price: "997 $", per: "/mois", terms: "Mois à mois · sans contrat · installation offerte au lancement",
      callL: "Essayez la démo", qrT: "Votre démo gratuite", qrS: "Avec votre nom et vos inscriptions. 8 minutes, aucun mot de passe.",
      note: "Déploiement progressif : les canaux s'activent par phases et sont confirmés lors de l'appel découverte. Prix en CAD, taxes en sus." },
    en: { eyebrow: "For Quebec real estate brokers", h1: "Stop sending buyers <em>to your voicemail.</em>",
      lead: "While you're at showings, Alex, your AI assistant, answers, qualifies buyers and sellers, and books showings in your calendar.",
      caller: "Hi, is the house on Fleury Street still available?", ai: "Yes! I can offer you a showing Saturday at 11 AM. Are you pre-approved?", notif: "Showing booked · Sat 11 AM · pre-approved buyer", notifIc: "🏡",
      name: "Alex", role: "AI assistant · online",
      feats: [["📞", "During showings", "Every call gets answered, even when you're busy."], ["✅", "Qualification", "Budget, pre-approval, timeline, area: all logged."], ["📅", "Showings booked", "Scheduled around your availability."], ["🌐", "FR · EN · ES", "For buyers from here and everywhere."]],
      phases: "OACIQ: Alex never gives brokerage advice. Price, offer and contract questions go to you.",
      from: "From", price: "$997", per: "/month", terms: "Month-to-month · no contract · free setup at launch",
      callL: "Try the demo", qrT: "Your free demo", qrS: "With your name and listings. 8 minutes, no passwords.",
      note: "Phased rollout: channels are activated in phases and confirmed during the discovery call. Prices in CAD, plus taxes." },
  },
};

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#050B18}
body{font-family:"Inter",-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#EAF1FF;-webkit-font-smoothing:antialiased}
.page{position:relative;overflow:hidden;background:radial-gradient(120% 80% at 80% 10%,#123061 0%,#0A1A33 38%,#050B18 75%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(127,168,245,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(127,168,245,.07) 1px,transparent 1px);background-size:32px 32px;mask-image:radial-gradient(70% 55% at 70% 30%,#000 20%,transparent 75%)}
.stars i{position:absolute;width:2px;height:2px;border-radius:50%;background:#BFD3FA;opacity:.5}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;letter-spacing:-.01em}
.mk{width:34px;height:34px;border-radius:11px;background:linear-gradient(135deg,#1F6FEB,#22B8E6);display:grid;place-items:center;font-size:13px;font-weight:800;box-shadow:0 0 24px rgba(34,184,230,.5)}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#7FB3FF}
.eyebrow::before{content:"";width:8px;height:8px;border-radius:50%;background:#22E6A0;box-shadow:0 0 12px #22E6A0}
h1{font-weight:850;letter-spacing:-.035em;line-height:1.02}
h1 em{font-style:normal;background:linear-gradient(100deg,#7FB3FF 0%,#22B8E6 45%,#B28FFF 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{color:#B9C8E2;line-height:1.5}
/* orb */
.orb{position:absolute;border-radius:50%}
.orb .core{position:absolute;inset:0;border-radius:50%;background:
  radial-gradient(circle at 35% 30%,rgba(255,255,255,.95) 0%,rgba(190,225,255,.7) 8%,transparent 22%),
  radial-gradient(circle at 60% 65%,rgba(178,143,255,.9) 0%,transparent 45%),
  radial-gradient(circle at 30% 70%,rgba(34,230,200,.75) 0%,transparent 42%),
  radial-gradient(circle at 50% 50%,#2F7BFF 0%,#1446B8 45%,#0A1A55 70%,transparent 72%);
  filter:saturate(1.15);box-shadow:0 0 120px 30px rgba(47,123,255,.45),0 0 260px 80px rgba(120,80,255,.22),inset 0 0 60px rgba(255,255,255,.25)}
.orb .swirl{position:absolute;inset:6%;border-radius:50%;background:conic-gradient(from 20deg,transparent 0 12%,rgba(127,211,255,.55) 18%,transparent 30%,rgba(178,143,255,.5) 52%,transparent 64%,rgba(34,230,200,.45) 80%,transparent 92%);filter:blur(14px);mix-blend-mode:screen}
.orb svg.ring{position:absolute;inset:-16%;width:132%;height:132%}
.orb .glow{position:absolute;inset:-40%;border-radius:50%;background:radial-gradient(circle,rgba(47,123,255,.25),transparent 60%)}
/* chat */
.chat{position:absolute;display:grid;gap:12px}
.head{display:flex;align-items:center;gap:12px;padding:10px 14px 10px 10px;border-radius:999px;background:#0C1D3A;border:1px solid rgba(127,168,245,.25);backdrop-filter:blur(10px);width:max-content}
.head .av{width:42px;height:42px;display:block}
.head b{display:block;font-size:16px}
.head small{font-size:12px;color:#7FE8B8;font-weight:700}
.wave{display:flex;gap:3px;align-items:center;margin-left:8px}
.wave i{width:3px;border-radius:3px;background:linear-gradient(#7FB3FF,#22B8E6)}
.b{max-width:100%;padding:13px 16px;border-radius:18px;font-size:15px;line-height:1.4;font-weight:550}
.b.in{background:#16294A;border:1px solid rgba(234,241,255,.16);border-bottom-left-radius:6px;color:#DCE7FB}
.b.ai{background:linear-gradient(135deg,#1F6FEB,#2E5BDB);border-bottom-right-radius:6px;justify-self:end;box-shadow:0 12px 30px rgba(31,111,235,.45)}
.b small{display:block;font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.65;margin-bottom:3px}
.notif{display:flex;gap:12px;align-items:center;padding:12px 16px;border-radius:16px;background:#fff;color:#0B1B33;font-weight:750;font-size:14.5px;box-shadow:0 18px 40px rgba(0,0,0,.35)}
.notif span{width:34px;height:34px;border-radius:10px;background:#E7F8EF;display:grid;place-items:center;font-size:18px}
/* features */
.feats{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.feat{padding:16px 16px 15px;border-radius:18px;background:linear-gradient(180deg,rgba(127,168,245,.1),rgba(127,168,245,.04));border:1px solid rgba(127,168,245,.18)}
.feat .ic{font-size:22px;margin-bottom:6px}
.feat b{display:block;font-size:16.5px;margin-bottom:3px}
.feat p{font-size:13px;color:#A9BAD6;line-height:1.42}
.phases{font-size:12.5px;color:#9FB3D6;display:flex;gap:8px;align-items:flex-start;line-height:1.45}
.phases::before{content:"◆";color:#B28FFF}
/* bottom */
.bottom{display:grid;grid-template-columns:1.25fr 1fr;gap:16px}
.card{border-radius:22px;padding:20px 22px}
.call{background:linear-gradient(135deg,#1F6FEB,#1446B8 60%,#3A2B9E);box-shadow:0 20px 50px rgba(31,111,235,.4);position:relative;overflow:hidden}
.call::after{content:"";position:absolute;right:-60px;top:-60px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.25),transparent 70%)}
.call .l{font-size:13px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.85}
.call .n{font-size:31px;font-weight:850;letter-spacing:-.02em;margin:4px 0 10px;white-space:nowrap}
.price{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.price .f{font-size:13px;opacity:.85}
.price .p{font-size:26px;font-weight:850}
.price .pm{font-size:14px;opacity:.85}
.terms{font-size:12px;opacity:.85;margin-top:2px}
.qr{background:#fff;color:#0B1B33;display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center}
.qr .code{width:112px;height:112px;flex-shrink:0}
.qr b{display:block;font-size:17px;letter-spacing:-.01em;margin-bottom:4px}
.qr p{font-size:12.5px;color:#4A5A74;line-height:1.4}
.qr .u{font-size:11.5px;white-space:nowrap;font-weight:800;color:#1F6FEB;margin-top:6px;word-break:break-all}
.foot{display:flex;justify-content:space-between;gap:16px;font-size:12px;color:#8FA3C4;align-items:flex-end}
.foot .note{max-width:70%;font-size:10.5px;line-height:1.45;opacity:.85}
.foot .site{font-weight:800;color:#EAF1FF;font-size:14px;text-align:right}
`;

function ringSVG(id) {
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = i / 72 * Math.PI * 2, r1 = 49, r2 = i % 6 === 0 ? 45.5 : 47.4;
    return `<line x1="${50 + r1 * Math.cos(a)}" y1="${50 + r1 * Math.sin(a)}" x2="${50 + r2 * Math.cos(a)}" y2="${50 + r2 * Math.sin(a)}" stroke="rgba(127,179,255,${i % 6 === 0 ? .7 : .3})" stroke-width="${i % 6 === 0 ? .5 : .3}"/>`;
  }).join("");
  const bars = Array.from({ length: 96 }, (_, i) => {
    const a = i / 96 * Math.PI * 2, h = 2 + Math.abs(Math.sin(i * .7) * 3.2 + Math.sin(i * 1.9) * 1.6), r1 = 40.5;
    return `<line x1="${50 + r1 * Math.cos(a)}" y1="${50 + r1 * Math.sin(a)}" x2="${50 + (r1 + h) * Math.cos(a)}" y2="${50 + (r1 + h) * Math.sin(a)}" stroke="url(#g${id})" stroke-width=".7" stroke-linecap="round"/>`;
  }).join("");
  return `<svg class="ring" viewBox="0 0 100 100"><defs><linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FD3FF"/><stop offset=".5" stop-color="#2F7BFF"/><stop offset="1" stop-color="#B28FFF"/></linearGradient></defs>
  ${ticks}${bars}<circle cx="50" cy="50" r="38.6" fill="none" stroke="rgba(127,211,255,.35)" stroke-width=".25" stroke-dasharray="1 1.4"/>
  <path d="M50 2 A48 48 0 0 1 91.6 26" fill="none" stroke="#22B8E6" stroke-width=".8" stroke-linecap="round"/><path d="M8.4 74 A48 48 0 0 1 4 50" fill="none" stroke="#B28FFF" stroke-width=".8" stroke-linecap="round"/></svg>`;
}
function stars(n, seed) {
  let s = seed, rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  return `<div class="stars">${Array.from({ length: n }, () => `<i style="left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 100).toFixed(1)}%;opacity:${(.2 + rnd() * .6).toFixed(2)};transform:scale(${(.6 + rnd() * 1.2).toFixed(2)})"></i>`).join("")}</div>`;
}
const wave = () => `<span class="wave">${[6, 12, 18, 10, 20, 14, 8, 16, 11, 6].map(h => `<i style="height:${h}px"></i>`).join("")}</span>`;

function letter(v, lang, qrSvg, url) {
  const c = C[v], t = c[lang];
  return `<div class="page" style="width:816px;height:1056px;padding:44px 48px 32px;display:flex;flex-direction:column">
  <div class="grid"></div>${stars(70, v.length * 7 + lang.length)}
  <div class="orb" style="width:330px;height:330px;right:-50px;top:118px"><div class="glow"></div><div class="core"></div><div class="swirl"></div>${ringSVG("L")}</div>
  <div style="position:relative;display:flex;justify-content:space-between;align-items:center">
    <div class="brand"><span class="mk">AI</span>AI Staff</div><div class="eyebrow">${t.eyebrow}</div></div>
  <h1 style="position:relative;font-size:${v === "general" ? 64 : 52}px;max-width:${v === "general" ? 470 : 500}px;margin-top:${v === "general" ? 58 : 54}px">${t.h1}</h1>
  <p class="lead" style="position:relative;font-size:16.5px;max-width:430px;margin-top:16px">${t.lead}</p>
  <div style="flex:.8"></div>
  <div style="position:relative;display:grid;grid-template-columns:318px 1fr;gap:28px;margin-top:26px;align-items:start">
    <div class="feats" style="grid-template-columns:1fr;gap:9px">
      ${t.feats.map(f => `<div class="feat" style="display:grid;grid-template-columns:30px 1fr;gap:8px;padding:10px 13px;border-radius:15px"><div class="ic" style="margin:0;font-size:20px">${f[0]}</div><div><b style="font-size:15px">${f[1]}</b><p style="font-size:12px">${f[2]}</p></div></div>`).join("")}
    </div>
    <div class="chat" style="position:relative;gap:10px">
      <div class="head">${avatar(c.persona)}<div><b>${t.name}</b><small>● ${t.role}</small></div>${wave()}</div>
      <div class="b in" style="font-size:14px;margin-right:30px">${t.caller}</div>
      <div class="b ai" style="font-size:14px;margin-left:24px"><small>${t.name}</small>${t.ai}</div>
      <div class="notif" style="font-size:13px">${"<span>" + t.notifIc + "</span>" + t.notif}</div>
    </div>
  </div>
  <div style="flex:1"></div>
  <div style="position:relative;display:grid;gap:14px">
    <div class="phases">${t.phases}</div>
    <div class="bottom">
      <div class="card call"><div class="l">${t.callL}</div><div class="n">📞 ${PHONE}</div>
        <div class="price"><span class="f">${t.from}</span><span class="p">${t.price}</span><span class="pm">${t.per}</span></div><div class="terms">${t.terms}</div></div>
      <div class="card qr"><div class="code">${qrSvg}</div><div><b>${t.qrT}</b><p>${t.qrS}</p><div class="u">meetaistaff.com/onboarding</div></div></div>
    </div>
    <div class="foot"><div class="note">${t.note}</div><div class="site">meetaistaff.com<br><span style="font-weight:600;color:#8FA3C4;font-size:12px">hello@meetaistaff.com</span></div></div>
  </div></div>`;
}

function square(v, lang, qrSvg) {
  const c = C[v], t = c[lang];
  return `<div class="page" style="width:1080px;height:1080px;padding:64px">
  <div class="grid"></div>${stars(90, 11 + lang.length)}
  <div class="orb" style="width:470px;height:470px;right:-30px;top:250px"><div class="glow"></div><div class="core"></div><div class="swirl"></div>${ringSVG("S")}</div>
  <div style="position:relative;display:flex;justify-content:space-between;align-items:center"><div class="brand" style="font-size:26px"><span class="mk" style="width:44px;height:44px;font-size:16px">AI</span>AI Staff</div><div class="eyebrow" style="font-size:15px">${t.eyebrow}</div></div>
  <h1 style="position:relative;font-size:${v === "general" ? 92 : 72}px;max-width:${v === "general" ? 600 : 610}px;margin-top:60px">${t.h1}</h1>
  <div class="chat" style="left:64px;top:${v === "general" ? 560 : 590}px;width:520px">
    <div class="head">${avatar(c.persona)}<div><b>${t.name}</b><small>● ${t.role}</small></div>${wave()}</div>
    <div class="b ai" style="font-size:19px;justify-self:start"><small>${t.name}</small>${t.ai}</div>
    <div class="notif" style="font-size:17px;width:max-content"><span>${t.notifIc}</span>${t.notif}</div>
  </div>
  <div style="position:absolute;left:64px;right:64px;bottom:56px;display:grid;grid-template-columns:1fr auto;gap:20px;align-items:end">
    <div class="card call" style="padding:22px 26px"><div class="l" style="font-size:15px">${t.callL}</div><div class="n" style="font-size:40px;margin-bottom:6px">📞 ${PHONE}</div><div class="terms" style="font-size:15px">${t.from} ${t.price}${t.per} · ${t.terms.split(" · ").slice(0, 2).join(" · ")}</div></div>
    <div class="card qr" style="grid-template-columns:auto;justify-items:center;padding:14px;gap:4px"><div class="code" style="width:132px;height:132px">${qrSvg}</div><b style="font-size:13px;margin:0">meetaistaff.com</b></div>
  </div></div>`;
}

(async () => {
  const b = await chromium.launch();
  const made = [];
  for (const v of ["general", "immobilier"]) for (const lang of ["fr", "en"]) {
    const url = `https://meetaistaff.com/onboarding/?${C[v].q}${lang === "en" ? "lang=en&" : ""}ref=flyer`;
    const qrSvg = await QR.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0A1A33", light: "#FFFFFF" } });
    for (const fmt of ["letter", "square"]) {
      const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>AI Staff flyer</title><style>${CSS}@page{size:${fmt === "letter" ? "8.5in 11in" : "1080px 1080px"};margin:0}</style></head><body>${fmt === "letter" ? letter(v, lang, qrSvg, url) : square(v, lang, qrSvg)}</body></html>`;
      const name = `AI-Staff_${v === "general" ? "flyer" : "flyer-immobilier"}_${lang.toUpperCase()}${fmt === "square" ? "_carre-1080" : ""}`;
      const htmlPath = path.join(OUT, "src", name + ".html");
      fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
      fs.writeFileSync(htmlPath, html);
      const W = fmt === "letter" ? 816 : 1080, H = fmt === "letter" ? 1056 : 1080;
      const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: fmt === "letter" ? 3 : 2 });
      await p.goto("file://" + htmlPath, { waitUntil: "load" });
      await p.waitForTimeout(200);
      const overflow = await p.evaluate(() => [...document.querySelectorAll(".page *")].filter(e => { const r = e.getBoundingClientRect(); return (r.right > innerWidth + 1 || r.bottom > innerHeight + 1) && !e.closest(".orb") && !e.closest(".stars"); }).map(e => e.className).slice(0, 5));
      if (overflow.length) console.log("overflow", name, overflow);
      await p.screenshot({ path: path.join(OUT, name + ".png") });
      if (fmt === "letter") await p.pdf({ path: path.join(OUT, name + ".pdf"), width: "8.5in", height: "11in", printBackground: true, pageRanges: "1" });
      await p.close(); made.push(name);
    }
  }
  await b.close(); console.log(made.join("\n"));
})();
