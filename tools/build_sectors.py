# -*- coding: utf-8 -*-
"""Génère les pages sectorielles (/cvc/, /paysagement/, /immobilier/, ...) à partir d'un gabarit commun.

Usage :  python3 tools/build_sectors.py
- Le style, l'orbe 3D, les avatars et les logos sont repris de index.html (source unique).
- Le contenu vient de tools/sectors_fr.py, sectors_en.py, sectors_es.py et generic_text.py.
- Met aussi à jour le bloc des secteurs dans index.html (menu, onglets « Pour qui », bande défilante).
"""
import json, os, re, sys, html
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from sectors_fr import FR
from sectors_en import EN
from sectors_es import ES
from generic_text import G

ORDER = ["immobilier", "cvc", "paysagement", "deneigement", "garages", "nettoyage", "barbiers", "dental"]
SLUG = {"immobilier": "immobilier", "cvc": "cvc", "paysagement": "paysagement", "deneigement": "deneigement",
        "garages": "garages", "nettoyage": "nettoyage", "barbiers": "barbiers", "dental": "dental"}
NUMERIC = ["ic", "ints", "persona"]

home = open(os.path.join(ROOT, "tools", "home_source.html"), encoding="utf-8").read()  # fuente de estilos y efectos (la home pública es otra, más simple)

def between(src, start, end):
    a = src.index(start); b = src.index(end, a)
    return src[a:b]

CSS = between(home, "<style>", "</style>")[len("<style>"):]
LOGOS_ALL = json.loads(re.search(r"const LOGOS=(\{.*?\});\n", home).group(1))
JS_AVATAR = between(home, "function avatarSVG(id){", "function paintAvatars(){")
JS_LOGO = between(home, "function logoSVG(k, forceColor){", "function marqueeHTML(items)")
JS_ORB = between(home, "const orbState = {", "/* niches auto-rotate")
JS_REVEAL = between(home, "/* reveal sections on scroll */", "\n</script>")
JS_REVEAL = JS_REVEAL[:JS_REVEAL.rindex("}") + 1]
# keep only the reveal function (stop before the next top-level statement)
JS_REVEAL = JS_REVEAL[:JS_REVEAL.index("\n}\n") + 3] if "\n}\n" in JS_REVEAL else JS_REVEAL

EXTRA_LOGOS = {
 "google": ["Google", "4285F4"], "googlemaps": ["Google Maps", "4285F4"], "yelp": ["Yelp", "FF1A1A"]}

def load_icon(key):
    p = os.path.join(sys.argv[1] if len(sys.argv) > 1 else "", key + ".svg")
    return None

def sector(k, lang):
    base = dict(FR[k])
    if lang == "en": base.update(EN[k])
    if lang == "es": base.update(ES[k])
    # calc numbers always from FR
    calc = dict(FR[k]["calc"]); calc.update(base["calc"]); base["calc"] = calc
    for n in NUMERIC:
        if n in FR[k]: base[n] = FR[k][n]
    return base

def sector_list():
    out = {}
    for lang in ["fr", "en", "es"]:
        out[lang] = [{"id": k, "slug": SLUG[k], "ic": FR[k]["ic"], "name": sector(k, lang)["name"]} for k in ORDER]
    return out

TEMPLATE = r"""<!DOCTYPE html>
<html lang="fr" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<script>
(function(){try{var t=localStorage.getItem("aistaff-theme");if(!t){t=(window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","light");}})();
</script>
<title>__TITLE__</title>
<meta name="description" content="__DESC__">
<meta property="og:title" content="__TITLE__">
<meta property="og:description" content="__DESC__">
<meta property="og:url" content="https://meetaistaff.com/__SLUG__/">
<link rel="canonical" href="https://meetaistaff.com/__SLUG__/">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%230A1A33'/%3E%3Cstop offset='1' stop-color='%231F6FEB'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='64' height='64' rx='18' fill='url(%23g)'/%3E%3Ctext x='32' y='42' font-family='Arial' font-weight='800' font-size='26' fill='white' text-anchor='middle'%3EAI%3C/text%3E%3C/svg%3E">
<style>
__CSS__
/* ---------- sector page additions ---------- */
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;}
@media(max-width:900px){.steps{grid-template-columns:1fr 1fr;}}
@media(max-width:520px){.steps{grid-template-columns:1fr;}}
.step{padding:24px 20px;}
.step .num{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--blue));color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:15px;margin-bottom:14px;box-shadow:0 6px 14px rgba(31,111,235,.35);}
.step h3{font-size:15.5px;font-weight:800;margin-bottom:6px;}
.step p{font-size:13.8px;color:var(--muted);line-height:1.55;}
.calc{padding:30px 28px;}
.calc-grid{display:grid;grid-template-columns:1fr 1fr;gap:28px;}
@media(max-width:760px){.calc-grid{grid-template-columns:1fr;}}
.calc label{display:block;font-size:13.5px;font-weight:700;margin-bottom:6px;}
.calc label .v{color:var(--accent-ink);font-weight:800;}
.calc input[type=range]{width:100%;margin:6px 0 20px;accent-color:var(--blue);height:28px;}
.calc-out{background:linear-gradient(135deg,var(--navy),#14315e);border-radius:18px;padding:28px 26px;color:#fff;display:flex;flex-direction:column;justify-content:center;box-shadow:var(--shadow-lg);}
.calc-out .big{font-size:52px;font-weight:800;letter-spacing:-1.5px;line-height:1;}
.calc-out .cap{font-size:14.5px;color:rgba(255,255,255,.85);margin-top:8px;line-height:1.55;}
.calc-out .note{font-size:12px;color:rgba(255,255,255,.6);margin-top:14px;line-height:1.5;}
.calc-disc{font-size:12.5px;color:var(--muted);margin-top:16px;line-height:1.6;}
.note-card{padding:22px 24px;display:flex;gap:14px;align-items:flex-start;background:var(--blue-soft);margin-top:18px;}
.note-card .ic{font-size:24px;flex-shrink:0;}
.note-card p{font-size:14px;color:var(--muted);line-height:1.65;}
.note-card b{color:var(--ink);}
.logo-grid{display:flex;flex-wrap:wrap;gap:10px;}
.fcard.s0{left:-34px;top:60px;}.fcard.s1{right:-92px;top:250px;}.fcard.s2{left:-44px;top:470px;}
.hero-ic{font-size:15px;}
@media(max-width:640px){.calc-out .big{font-size:42px;}.calc{padding:24px 18px;}}
</style>
</head>
<body>
<nav>
  <div class="nav-in">
    <a class="brand" href="/"><span class="mk">AI</span>AI Staff</a>
    <div class="nav-links">
      <details class="dd" id="ddSectors"><summary data-i18n="nav.sectors">Secteurs</summary><div class="dd-menu" id="ddMenu"></div></details>
      <a class="nl" href="#demo" data-i18n="nav.demo">Démo</a>
      <a class="nl" href="#tarifs" data-i18n="nav.pricing">Tarifs</a>
      <a class="nl" href="#faq" data-i18n="nav.faq">FAQ</a>
      <div class="seg" id="langSeg"><button data-lang="fr" class="active">FR</button><button data-lang="en">EN</button><button data-lang="es">ES</button></div>
      <button class="tbtn" id="themeToggle" aria-label="Mode clair / sombre">🌙</button>
      <a href="tel:+14388058804" class="btn btn-blue btn-sm nav-cta" data-i18n="nav.cta"></a>
    </div>
  </div>
</nav>

<div class="wrap">
  <header class="hero" id="top">
    <div class="hero-bg" aria-hidden="true"><div class="dots"></div><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div></div>
    <div class="hero-grid">
      <div>
        <span class="eyebrow rise" style="--d:.05s"><span class="hero-ic" id="heroIc"></span><span data-s="eyebrow"></span></span>
        <h1 id="heroTitle" data-s="h1"></h1>
        <p class="lead rise" style="--d:.7s;margin-top:18px" data-s="lead"></p>
        <div class="pick rise" style="--d:.85s">
          <span class="pl" data-i18n="hero.pick"></span>
          <button class="persona" data-persona="sofia"><span class="av" data-av="sofia"></span><span class="pn">Sofía<small data-i18n="p.sofia"></small></span></button>
          <button class="persona" data-persona="alex"><span class="av" data-av="alex"></span><span class="pn">Alex<small data-i18n="p.alex"></small></span></button>
          <button class="persona" data-persona="tomas"><span class="av" data-av="tomas"></span><span class="pn">Tomás<small data-i18n="p.tomas"></small></span></button>
        </div>
        <div class="hero-ctas rise" style="--d:1s">
          <a href="mailto:hello@meetaistaff.com" class="btn btn-blue glow mailcta" data-i18n="hero.cta1"></a>
          <a href="tel:+14388058804" class="btn btn-ghost" data-i18n="hero.cta2"></a>
        </div>
        <div class="trust rise" style="--d:1.12s" id="trust"></div>
      </div>
      <div class="stage" id="stage">
        <canvas id="orbGL" aria-hidden="true"></canvas>
        <div class="fcards" id="fcards" aria-hidden="true"></div>
        <div class="phone-wrap">
          <div class="phone">
            <div class="screen">
              <div class="notch"></div>
              <div class="call-head">
                <div class="call-av" id="callAv"></div>
                <div class="nm" id="phoneName"></div>
                <div class="st" id="callStatus"></div>
                <div class="eq" id="eq"><i></i><i></i><i></i><i></i><i></i></div>
              </div>
              <div class="transcript" id="transcript"></div>
              <div class="call-foot"><button class="call-btn" id="callBtn"></button></div>
            </div>
          </div>
        </div>
        <div class="phone-hint"><a href="tel:+14388058804">+1 (438) 805-8804</a> · <span data-i18n="phone.hint"></span></div>
      </div>
    </div>
  </header>

  <section class="block" id="probleme" style="padding-top:26px;">
    <div class="card niche">
      <div class="niche-pain"><div class="k" data-i18n="pain.k"></div><h3 data-s="painH"></h3><p data-s="painP"></p></div>
      <div class="niche-do"><div class="k" data-i18n="does.k"></div><ul id="doesList"></ul></div>
    </div>
  </section>

  <section class="block" id="fonctions" style="padding-top:0;">
    <div class="sec-eyebrow" data-i18n="feat.eyebrow"></div>
    <h2 class="sec-title" data-i18n="feat.title"></h2>
    <div class="feat-grid" id="featGrid" style="grid-template-columns:repeat(2,1fr)"></div>
  </section>

  <section class="block" id="calcul" style="padding-top:0;">
    <div class="sec-eyebrow" data-i18n="calc.eyebrow"></div>
    <h2 class="sec-title" data-i18n="calc.title"></h2>
    <p class="sec-lead" data-i18n="calc.lead"></p>
    <div class="card calc">
      <div class="calc-grid">
        <div>
          <label><span id="cl1"></span> : <span class="v" id="cv1"></span></label><input type="range" id="cr1">
          <label><span id="cl2"></span> : <span class="v" id="cv2"></span></label><input type="range" id="cr2">
          <label><span id="cl3"></span> : <span class="v" id="cv3"></span></label><input type="range" id="cr3">
        </div>
        <div class="calc-out"><div class="big" id="calcBig"></div><div class="cap" data-i18n="calc.cap"></div><div class="note" data-i18n="calc.note"></div></div>
      </div>
      <p class="calc-disc" id="calcDisc"></p>
    </div>
  </section>

  <section class="block" id="comment" style="padding-top:0;">
    <div class="sec-eyebrow" data-i18n="how.eyebrow"></div>
    <h2 class="sec-title" data-i18n="how.title"></h2>
    <div class="steps" id="steps"></div>
  </section>

  <section class="block" id="demo" style="padding-top:0;">
    <div class="sec-eyebrow" data-i18n="dash.eyebrow"></div>
    <h2 class="sec-title" data-i18n="dash.title"></h2>
    <p class="sec-lead" data-i18n="dash.lead"></p>
    <span class="demo-badge" data-i18n="dash.badge"></span>
    <div class="card dash">
      <div class="dash-top">
        <div class="dash-av" id="dashAv"></div>
        <div><div class="nm" data-i18n="dash.name"></div><div class="sb" data-i18n="dash.sub"></div></div>
        <a class="full" href="/demo/" id="dashMore" data-i18n="dash.more"></a>
      </div>
      <div class="dpane active" style="display:block">
        <div class="stats" id="stats"></div>
        <div id="calls"></div>
      </div>
    </div>
  </section>

  <section class="block" id="integrations" style="padding-top:0;">
    <div class="sec-eyebrow" data-i18n="int.eyebrow"></div>
    <h2 class="sec-title" data-i18n="int.title"></h2>
    <div class="logo-grid" id="logoGrid"></div>
    <p class="fine" data-i18n="int.note"></p>
  </section>

  <section class="block" id="tarifs" style="padding-top:0;">
    <div class="sec-eyebrow" data-i18n="price.eyebrow"></div>
    <h2 class="sec-title" data-i18n="price.title"></h2>
    <p class="sec-lead" data-i18n="price.lead"></p>
    <div class="price-top" id="priceTop"></div>
    <div class="price-grid" id="priceGrid"></div>
    <p class="center-note" data-i18n="rollout"></p>
  </section>

  <section class="block" id="faq" style="padding-top:0;">
    <div class="sec-eyebrow" data-i18n="faq.eyebrow"></div>
    <h2 class="sec-title" data-i18n="faq.title"></h2>
    <div id="faqList" style="margin-top:26px;"></div>
    <div class="card note-card" id="noteCard" style="display:none"><div class="ic">⚖️</div><p id="noteText"></p></div>
  </section>

  <section class="block" style="padding-top:10px;">
    <div class="final">
      <h2 data-i18n="final.title"></h2>
      <p data-i18n="final.lead"></p>
      <div class="final-ctas">
        <a href="mailto:hello@meetaistaff.com" class="btn btn-white mailcta" data-i18n="final.cta1"></a>
        <a href="tel:+14388058804" class="btn btn-blue" data-i18n="final.cta2"></a>
      </div>
      <a class="tel" href="tel:+14388058804">+1 (438) 805-8804</a>
    </div>
  </section>

  <footer>
    <div><b>AI Staff</b> · <span data-i18n="footer.tag"></span></div>
    <div class="links" id="footLinks"></div>
    <div><a href="mailto:hello@meetaistaff.com" style="color:inherit;">hello@meetaistaff.com</a> · <a href="tel:+14388058804" style="color:inherit;">+1 (438) 805-8804</a></div>
    <div>meetaistaff.com · © 2026 AI Staff</div>
    <div><span class="demo" data-i18n="footer.line"></span></div>
  </footer>
</div>

<div class="sticky-cta">
  <a href="mailto:hello@meetaistaff.com" class="btn btn-ghost mailcta" data-i18n="sticky.demo"></a>
  <a href="tel:+14388058804" class="btn btn-blue" data-i18n="sticky.call"></a>
</div>

<div class="modal-bg" id="priceModal">
  <div class="modal">
    <div class="ok">✦</div>
    <h3 data-i18n="prM.title"></h3>
    <p data-i18n="prM.lead"></p>
    <a class="btn btn-blue" style="width:100%;text-decoration:none;" id="priceMailto" href="mailto:hello@meetaistaff.com" data-i18n="prM.cta"></a>
    <div style="margin-top:12px;"><a href="#" id="priceLater" style="font-size:13px;color:var(--muted);" data-i18n="prM.later"></a></div>
  </div>
</div>
<div class="toast" id="toast"></div>

<script>
(function(){
"use strict";
const SECTOR_ID = __ID__;
const SEC = __SEC__;
const G = __G__;
const SECTORS = __SECTORS__;
const LOGOS = __LOGOS__;
const PERSONAS = {sofia:{name:"Sofía",ini:"S"}, alex:{name:"Alex",ini:"A"}, tomas:{name:"Tomás",ini:"T"}};
const GENDER = {sofia:"f", alex:"n", tomas:"m"};
const qs = new URLSearchParams(location.search);
let lang = ["fr","en","es"].includes(qs.get("lang")) ? qs.get("lang") : "fr";
let persona = PERSONAS[qs.get("a")] ? qs.get("a") : (SEC.fr.persona || "sofia");
let callTimers = [];

function S(){ return SEC[lang]; }
function g(k){ return G[lang][k] !== undefined ? G[lang][k] : G.fr[k]; }
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function aName(){ return PERSONAS[persona].name; }
function fill(s){ return String(s).split("{a}").join(aName()).split("{aud}").join(S().aud); }
function money(n){ return lang==="en" ? "$"+Math.round(n).toLocaleString("en-CA") : Math.round(n).toLocaleString("fr-CA").replace(/ | /g," ")+" $"; }

__AVATAR__
__LOGO__
ICON.sms = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#1F6FEB" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2zm3 6.5a1.5 1.5 0 1 0 0 .01zm5 0a1.5 1.5 0 1 0 0 .01zm5 0a1.5 1.5 0 1 0 0 .01z"/></svg>';
__ORB__
__REVEAL__

/* ---------- theme ---------- */
const themeBtn = document.getElementById("themeToggle");
function paintTheme(){ themeBtn.textContent = document.documentElement.getAttribute("data-theme")==="dark" ? "☀️" : "🌙"; }
themeBtn.addEventListener("click", ()=>{
  const next = document.documentElement.getAttribute("data-theme")==="dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try{ localStorage.setItem("aistaff-theme", next); }catch(e){}
  paintTheme();
});
paintTheme();

function splitTitle(){
  const h = document.getElementById("heroTitle"); let i = 0;
  const walk = node=>{ [...node.childNodes].forEach(ch=>{
    if(ch.nodeType===3){ const frag = document.createDocumentFragment();
      ch.textContent.split(/( )/).forEach(part=>{ if(part===" "){ frag.appendChild(document.createTextNode(" ")); return; } if(!part) return;
        const s = document.createElement("span"); s.className = "w"; s.style.setProperty("--i", i++); s.textContent = part; frag.appendChild(s); });
      ch.replaceWith(frag);
    } else if(ch.nodeType===1){ walk(ch); } }); };
  walk(h);
}

function render(){
  const s = S();
  document.documentElement.lang = lang;
  document.title = s.title;
  document.querySelectorAll("[data-i18n]").forEach(el=>{ const v = g(el.dataset.i18n); if(typeof v === "string") el.innerHTML = fill(v); });
  document.querySelectorAll("[data-s]").forEach(el=>{ el.innerHTML = fill(s[el.dataset.s]); });
  document.getElementById("heroIc").textContent = SEC.fr.ic;
  splitTitle();
  document.querySelectorAll("#langSeg button").forEach(b=>b.classList.toggle("active", b.dataset.lang===lang));
  document.querySelectorAll(".persona").forEach(b=>b.classList.toggle("active", b.dataset.persona===persona));
  const subj = encodeURIComponent("AI Staff — "+s.name);
  document.querySelectorAll(".mailcta").forEach(a=>a.href = "/onboarding/?secteur="+SECTOR_ID+(lang==="fr"?"":"&lang="+lang));
  document.getElementById("trust").innerHTML = s.trust.map(t=>`<div><div class="n">${esc(t[0])}</div><div class="l">${esc(fill(t[1]))}</div></div>`).join("");
  document.getElementById("doesList").innerHTML = s.does.map(d=>`<li>${esc(fill(d))}</li>`).join("");
  document.getElementById("featGrid").innerHTML = s.features.map(f=>`<div class="card feat"><div class="top"><div class="ic">${f[0]}</div></div><h3>${esc(fill(f[1]))}</h3><p>${esc(fill(f[2]))}</p></div>`).join("");
  document.getElementById("steps").innerHTML = s.steps.map((st,i)=>`<div class="card step"><div class="num">${i+1}</div><h3>${esc(fill(st[0]))}</h3><p>${esc(fill(st[1]))}</p></div>`).join("");
  document.getElementById("stats").innerHTML = s.stats.map(x=>`<div class="stat-tile"><div class="lbl">${esc(x[0])}</div><div class="val">${esc(x[1])}</div><div class="delta">${esc(x[2])}</div></div>`).join("");
  const T = g("tags");
  document.getElementById("calls").innerHTML = s.calls.map(c=>{ const ini = c[0].replace(/[^A-Za-zÀ-ÿ ]/g,"").split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase() || "@";
    return `<div class="call-card"><div class="who"><div class="ini" style="background:linear-gradient(135deg,#3B82F6,#1858C4)">${esc(ini)}</div><div><div class="nm">${esc(c[0])}</div><div class="mt">${esc(c[1])}</div></div><span class="tag ${c[3]}" style="margin-left:auto;">${esc(T[c[3]])}</span></div><div class="sm">${esc(fill(c[2]))}</div><div class="nx">→ ${esc(g("dash.next"))} : ${esc(fill(c[4]))}</div></div>`; }).join("");
  document.getElementById("dashAv").innerHTML = SEC.fr.ic;
  document.getElementById("logoGrid").innerHTML = s.ints.filter(k=>LOGOS[k]).map(k=>`<div class="logo-tile"><span class="lg">${logoSVG(k)}</span><span>${esc(LOGOS[k][0])}</span></div>`).join("");
  const faqs = s.faq.concat(g("faqGen"));
  document.getElementById("faqList").innerHTML = faqs.map((f,i)=>`<div class="faq-item"><button class="faq-q" data-faq="${i}" aria-expanded="false"><span>${esc(fill(f[0]))}</span><span class="pl">+</span></button><div class="faq-a" id="faq-${i}"><p>${esc(fill(f[1]))}</p></div></div>`).join("");
  document.querySelectorAll("[data-faq]").forEach(b=>b.addEventListener("click",()=>{ const it = b.parentElement, a = document.getElementById("faq-"+b.dataset.faq), open = it.classList.toggle("open"); b.setAttribute("aria-expanded", open); a.style.maxHeight = open ? a.scrollHeight+"px" : "0"; }));
  const note = document.getElementById("noteCard");
  if(s.note){ note.style.display = "flex"; document.getElementById("noteText").innerHTML = fill(s.note); } else note.style.display = "none";
  document.getElementById("priceTop").innerHTML = g("priceTop").map(x=>`<span>${esc(x)}</span>`).join("");
  document.getElementById("priceGrid").innerHTML = g("plans").map((p,i)=>`<div class="card plan${p.featured?" featured":""}">`+(p.featured?`<span class="ribbon">⭐ ${esc(g("price.feat"))}</span>`:"")+
    `<div class="pname">${esc(p.name)}</div><div class="ptag">${esc(p.tag)}</div><div><span class="pnum">${money(p.price)}</span> <span class="pper">${esc(g("price.per"))}</span></div>`+
    `<ul>${p.feat.map((f,j)=>`<li class="${j===0&&i>0?"inc":""}"><span class="ck">${j===0&&i>0?"＋":"✓"}</span><span>${esc(fill(f))}</span></li>`).join("")}</ul>`+
    `<button class="btn ${p.featured?"btn-blue":"btn-ghost"}" data-plan="${esc(p.name)}">${esc(p.cta)}</button></div>`).join("");
  document.querySelectorAll("[data-plan]").forEach(b=>b.addEventListener("click",()=>{ document.getElementById("priceMailto").href = "mailto:hello@meetaistaff.com?subject="+encodeURIComponent("AI Staff — "+s.name+" — "+b.dataset.plan); document.getElementById("priceModal").classList.add("show"); }));
  /* sectors menu + footer */
  const list = SECTORS[lang];
  const q = lang==="fr" ? "" : "?lang="+lang;
  document.getElementById("ddMenu").innerHTML = `<a href="/${q}"><span>🏠</span>${esc(g("nav.home"))}</a>`+list.map(x=>`<a href="/${x.slug}/${q}"${x.id===SECTOR_ID?' class="cur"':""}><span>${x.ic}</span>${esc(x.name)}</a>`).join("");
  document.getElementById("footLinks").innerHTML = `<a href="/${q}">${esc(g("nav.home"))}</a>`+list.map(x=>`<a href="/${x.slug}/${q}">${esc(x.name)}</a>`).join("")+`<a href="/demo/${q}">Demo</a><a href="/confidentialite/${q}">${({fr:"Confidentialité",en:"Privacy",es:"Privacidad"})[lang]}</a>`;
  document.getElementById("dashMore").href = "/demo/"+q;
  buildCalc(); buildFcards(); resetPhone();
}

/* ---------- calculator ---------- */
function buildCalc(){
  const c = S().calc;
  [1,2,3].forEach(i=>{ document.getElementById("cl"+i).textContent = c["l"+i]; const r = document.getElementById("cr"+i), rg = c.r[i-1];
    r.min = rg[0]; r.max = rg[1]; r.step = rg[2]; if(!r.dataset.init){ r.value = c.v[i-1]; r.dataset.init = 1; } });
  document.getElementById("calcDisc").textContent = c.disc;
  updateCalc();
}
function updateCalc(){
  const a = +document.getElementById("cr1").value, b = +document.getElementById("cr2").value, v = +document.getElementById("cr3").value;
  document.getElementById("cv1").textContent = a;
  document.getElementById("cv2").textContent = b+" %";
  document.getElementById("cv3").textContent = money(v);
  document.getElementById("calcBig").textContent = "≈ "+money(a*4.33*(b/100)*v);
}
["cr1","cr2","cr3"].forEach(id=>document.getElementById(id).addEventListener("input", updateCalc));

/* ---------- floating cards ---------- */
function buildFcards(){
  document.getElementById("fcards").innerHTML = S().fcards.map((c,i)=>`<div class="fcard s${i}"><span class="fi">${ICON[c[0]]||logoSVG(c[0])}</span><span><b>${esc(fill(c[1]))}</b><span>${esc(fill(c[2]))}</span></span><span class="ok">✓</span></div>`).join("");
  document.querySelectorAll(".fcard").forEach((c,i)=>setTimeout(()=>c.classList.add("show","bob"), 1400+i*350));
}

/* ---------- phone: a customer call for this trade ---------- */
const callBtn = document.getElementById("callBtn"), callStatus = document.getElementById("callStatus"), transcriptEl = document.getElementById("transcript");
const callAv = document.getElementById("callAv"), eqEl = document.getElementById("eq");
function setTalking(on){ callAv.classList.toggle("talking", on); eqEl.classList.toggle("on", on); orbState.talking = on; }
function resetPhone(){
  callTimers.forEach(clearTimeout); callTimers = [];
  transcriptEl.innerHTML = ""; setTalking(false);
  callAv.innerHTML = avatarSVG(persona);
  document.getElementById("phoneName").textContent = aName()+" · AI Staff";
  orbState.mode = persona==="sofia" ? 0 : persona==="alex" ? 1 : 2;
  callBtn.textContent = g("phone.call"); callBtn.classList.remove("hang"); callBtn.disabled = false;
  callStatus.textContent = g("phone.idle"); callStatus.classList.remove("live");
  callBtn.onclick = startCall;
}
function startCall(){
  callBtn.disabled = true; callStatus.textContent = fill(g("phone.connecting")); transcriptEl.innerHTML = "";
  callTimers.push(setTimeout(()=>{
    callStatus.textContent = g("phone.live"); callStatus.classList.add("live"); setTalking(true);
    callBtn.textContent = g("phone.hangup"); callBtn.classList.add("hang"); callBtn.disabled = false; callBtn.onclick = ()=>endCall(false);
    const lines = S().script;
    lines.forEach((ln,i)=>callTimers.push(setTimeout(()=>{
      const ty = document.createElement("div"); ty.className = "typing"; if(ln[0]==="lead") ty.style.alignSelf = "flex-end";
      ty.innerHTML = "<i></i><i></i><i></i>"; transcriptEl.appendChild(ty); transcriptEl.scrollTop = transcriptEl.scrollHeight;
      callTimers.push(setTimeout(()=>{ ty.remove(); const d = document.createElement("div"); d.className = "bubble "+(ln[0]==="agent"?"agent":"user"); d.textContent = fill(ln[1]); transcriptEl.appendChild(d); transcriptEl.scrollTop = transcriptEl.scrollHeight; }, 850));
    }, i*2400)));
    callTimers.push(setTimeout(()=>endCall(true), lines.length*2400+900));
  }, 1200));
}
function endCall(done){
  callTimers.forEach(clearTimeout); callTimers = []; setTalking(false);
  callStatus.textContent = done ? S().ended : g("phone.idle"); callStatus.classList.remove("live");
  callBtn.textContent = g("phone.call"); callBtn.classList.remove("hang"); callBtn.disabled = false; callBtn.onclick = startCall;
}

/* ---------- controls ---------- */
function syncUrl(){ try{ const p = new URLSearchParams(location.search); lang==="fr" ? p.delete("lang") : p.set("lang", lang); p.delete("a"); if(persona !== (SEC.fr.persona||"sofia")) p.set("a", persona); const q = p.toString(); history.replaceState(null,"",location.pathname+(q?"?"+q:"")+location.hash); }catch(e){} }
document.querySelectorAll("#langSeg button").forEach(b=>b.addEventListener("click",()=>{ lang = b.dataset.lang; render(); syncUrl(); }));
document.querySelectorAll(".persona").forEach(b=>b.addEventListener("click",()=>{ persona = b.dataset.persona; render(); syncUrl(); toast(g("your")[GENDER[persona]]+aName()+" ✓"); }));
document.querySelectorAll(".modal-bg").forEach(m=>m.addEventListener("click", e=>{ if(e.target===m) m.classList.remove("show"); }));
document.getElementById("priceLater").addEventListener("click", e=>{ e.preventDefault(); document.getElementById("priceModal").classList.remove("show"); });
document.addEventListener("click", e=>{ const dd = document.getElementById("ddSectors"); if(dd.open && !dd.contains(e.target)) dd.open = false; });
let toastT;
function toast(msg){ const el = document.getElementById("toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(()=>el.classList.remove("show"), 2400); }

document.querySelectorAll("[data-av]").forEach(el=>{ el.outerHTML = avatarSVG(el.dataset.av); });
render();
initOrb(); initTilt(); initReveal();
requestAnimationFrame(()=>document.documentElement.classList.add("ready"));
if("IntersectionObserver" in window){
  const io = new IntersectionObserver(es=>{ if(es.some(e=>e.isIntersecting)){ io.disconnect(); setTimeout(()=>{ if(!callTimers.length && !transcriptEl.children.length) startCall(); }, 900); } }, {threshold:.6});
  io.observe(document.querySelector(".phone"));
}
})();
</script>
</body>
</html>
"""

def build():
    logos = {k: v for k, v in LOGOS_ALL.items()}
    si_dir = os.environ.get("SIMPLE_ICONS_DIR")
    for k, (title, color) in EXTRA_LOGOS.items():
        if k in logos: continue
        path = os.path.join(si_dir, k + ".svg") if si_dir else None
        if path and os.path.exists(path):
            d = re.search(r' d="([^"]+)"', open(path, encoding="utf-8").read()).group(1)
            logos[k] = [title, color, d]
    sectors = sector_list()
    for k in ORDER:
        sec = {lang: sector(k, lang) for lang in ["fr", "en", "es"]}
        used = set()
        for lang in sec: used.update(sec[lang]["ints"]); used.update(c[0] for c in sec[lang]["fcards"])
        sub_logos = {x: logos[x] for x in used if x in logos}
        page = TEMPLATE
        rep = {
            "__TITLE__": html.escape(sec["fr"]["title"]), "__DESC__": html.escape(sec["fr"]["desc"]), "__SLUG__": SLUG[k],
            "__CSS__": CSS, "__ID__": json.dumps(k), "__SEC__": json.dumps(sec, ensure_ascii=False),
            "__G__": json.dumps(G, ensure_ascii=False), "__SECTORS__": json.dumps(sectors, ensure_ascii=False),
            "__LOGOS__": json.dumps(sub_logos, ensure_ascii=False), "__AVATAR__": JS_AVATAR, "__LOGO__": JS_LOGO,
            "__ORB__": JS_ORB, "__REVEAL__": JS_REVEAL,
        }
        for a, b in rep.items(): page = page.replace(a, b)
        out = os.path.join(ROOT, SLUG[k], "index.html")
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "w", encoding="utf-8").write(page)
        print("wrote", out, len(page))
    # sectors block for the home page
    home_sectors = {}
    for lang in ["fr", "en", "es"]:
        home_sectors[lang] = []
        for k in ORDER:
            s = sector(k, lang)
            quote = s["script"][4][1]
            home_sectors[lang].append({"id": k, "slug": SLUG[k], "ic": s["ic"], "name": s["name"], "tab": s["tab"],
                "h": s["painH"], "pain": s["painP"], "does": s["does"][:3], "line": "« " + quote + " »" if lang == "fr" else ("“" + quote + "”" if lang == "en" else "«" + quote + "»")})
    block = "/*SECTORS:start*/const HOME_SECTORS=" + json.dumps(home_sectors, ensure_ascii=False) + ";/*SECTORS:end*/"
    h = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    if "/*SECTORS:start*/" in h:
        h = re.sub(r"/\*SECTORS:start\*/.*?/\*SECTORS:end\*/", lambda m: block, h, flags=re.S)
        open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8").write(h)
        print("updated HOME_SECTORS in index.html")
    else:
        print("NOTE: add /*SECTORS:start*//*SECTORS:end*/ marker to index.html to inject sectors")

if __name__ == "__main__":
    build()
