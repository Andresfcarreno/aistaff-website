/* ==========================================================================
   Prime Ménage — interactions
   ========================================================================== */
(() => {
'use strict';

/* ---------------- Configuration (à modifier ici) ---------------- */
const CONFIG = {
  whatsapp: '15145550100',          // TODO: vrai numéro WhatsApp (format international, sans +)
  phone: '+15145550100',            // TODO: vrai numéro de téléphone
  phoneLabel: '(514) 555-0100',
  email: 'reservation@primemenage.ca',
};

/* Grille tarifaire — toute la logique de prix vit ici. */
const PRICING = {
  base: 85, perBed: 35, perBath: 25, house: 30,
  minimum: 140,                     // minimum par visite résidentielle
  bundle: 70,                       // four + frigo + vitres + lessive (88 $ à la carte)
  freq: { once: 0, monthly: 5, biweekly: 8, weekly: 12 },   // rabais $ par visite
  comFreqPct: { once: 0, monthly: .05, biweekly: .08, weekly: .12 },
  commercial: { perSqft: .24, min: 260 },
  extremeFrom: 450,
  airbnbLinen: 25,
  extras: [
    { id: 'oven', price: 22, core: true },
    { id: 'fridge', price: 18, core: true },
    { id: 'windows', price: 26, core: true },
    { id: 'laundry', price: 22, core: true },
    { id: 'cabinets', price: 35 },
    { id: 'balcony', price: 25 },
    { id: 'pets', price: 20 },
    { id: 'organize', price: 40 },
  ],
  services: {
    signature:  { kind: 'res', mult: 1,   recurring: true },
    deep:       { kind: 'res', mult: 1,   recurring: true, bundle: true },
    premove:    { kind: 'res', mult: 1.3, recurring: false, bundle: true, cabinets: true },
    postmove:   { kind: 'res', mult: 1.5, recurring: false, bundle: true, cabinets: true },
    reno:       { kind: 'res', mult: 2.1, recurring: false, bundle: true, cabinets: true },
    airbnb:     { kind: 'res', mult: 1,   recurring: true, linen: true },
    commercial: { kind: 'com', recurring: true },
    extreme:    { kind: 'quote', recurring: false },
  },
};

/* ---------------- i18n ---------------- */
const EN = {
  'nav.services': 'Services', 'nav.pricing': 'Pricing', 'nav.gift': 'The Gift Box', 'nav.details': 'Signatures', 'nav.standards': 'Standards', 'nav.book': 'Book',
  'hero.eyebrow': 'Cleaning house · Montreal',
  'hero.l1': 'The luxury of', 'hero.l2': 'a flawless', 'hero.l3': 'home.',
  'hero.sub': 'A trained, vetted and uniformed team cares for your home like a five-star hotel suite. Signature details, a complimentary Prime Gift Box — and nothing to supply on your end.',
  'hero.cta1': 'Get my price', 'hero.cta2': 'Discover the experience',
  'hero.t1': 'Trained at the Prime Academy', 'hero.t2': 'Always in uniform', 'hero.t3': 'Eco-biodegradable products',
  'hero.alt': 'Prime Ménage team member in uniform with gloves and spray bottle', 'hero.scroll': 'Scroll',
  'fc.1b': 'Prime Gift Box', 'fc.1s': 'complimentary on 1st visit', 'fc.2b': '72 points', 'fc.2s': 'quality checklist', 'fc.3b': '24-hour guarantee', 'fc.3s': "we come back, free",
  'mq.1': 'Signature upkeep', 'mq.2': 'Deep clean', 'mq.3': 'Move-out', 'mq.4': 'Move-in', 'mq.5': 'Post-renovation', 'mq.6': 'Offices &amp; retail', 'mq.7': 'Restoration', 'mq.8': 'Airbnb &amp; rentals',
  'man.eyebrow': 'Our philosophy',
  'man.text': "We are not the cheapest cleaning service in Montreal. We are the one <em>you will never have to think about again.</em> Every visit is prepared, performed and inspected like in a grand hotel — because your home deserves it.",
  'man.noh': "If you're looking for…", 'man.no1': 'The lowest possible price', 'man.no2': 'A rushed 45-minute visit', 'man.no3': 'A different person every time', 'man.no4': 'Supplying your own products and vacuum',
  'man.noend': "… this isn't the place. And that's perfectly fine.",
  'man.yesh': 'What you get', 'man.yes1': 'A trained, vetted, uniformed team', 'man.yes2': 'The time it takes — never a cut-rate stopwatch', 'man.yes3': 'The same person, who knows your home', 'man.yes4': 'Eco-luxury products, pro equipment and hotel details', 'man.yes5': 'A complimentary Prime Gift Box and a 24-hour guarantee',
  'svc.eyebrow': 'Our services', 'svc.h2': 'A service for every <em>moment</em> of your life.',
  'svc.p': 'From weekly upkeep to the July 1st move, all the way to construction sites and offices. Click a service to get your price instantly.',
  'svc.pop': 'Most loved', 'svc.from': 'From', 'svc.eval': 'On assessment',
  's.signature': 'Signature Upkeep', 's.signature.p': 'Recurring cleaning, hotel-style: kitchen, bathrooms, bedrooms, floors, dusting — and our signature details every visit.',
  's.deep': 'Deep Clean', 's.deep.p': 'Top-to-bottom cleaning: inside the oven and fridge, interior windows, laundry, baseboards and forgotten corners — all included.',
  's.premove': 'Move-in Clean', 's.premove.p': 'Your new home sanitized from top to bottom before the boxes arrive: cabinets, appliances, bathroom. You walk into brand new.',
  's.postmove': 'Move-out · End of Lease', 's.postmove.p': 'Built for Montreal’s July 1st: we leave the unit spotless for the inspection, the landlord or the next tenant.',
  's.reno': 'Post-Renovation', 's.reno.p': 'Drywall dust, paint residue, tile grout: we turn the job site back into a livable home, ready for its close-up.',
  's.commercial': 'Offices &amp; Retail', 's.commercial.p': 'Offices, clinics, boutiques and showrooms. Discreet after-hours cleaning, a dedicated team and a report after every visit.',
  's.extreme': 'Restoration · Extreme Cases', 's.extreme.p': 'Water damage, post-party, neglected units, hoarding: a reinforced, discreet and judgment-free team.',
  's.airbnb': 'Airbnb &amp; Rentals', 's.airbnb.p': 'Turnovers between stays: hotel bedding, folded towels, restocked supplies and inspection photos sent to the host.',
  'calc.eyebrow': 'Transparent pricing', 'calc.h2': 'Your price, <em class="gold-text">in 30 seconds.</em>',
  'calc.p': 'A clear price, no surprises on the invoice. Adjust to your home — final confirmation happens before the visit.',
  'calc.service': 'Service', 't.signature': 'Signature', 't.deep': 'Deep clean', 't.premove': 'Move-in', 't.postmove': 'Move-out', 't.reno': 'Post-reno', 't.commercial': 'Commercial', 't.extreme': 'Restoration', 't.airbnb': 'Airbnb',
  'calc.type': 'Home type', 'calc.apt': 'Apartment / Condo', 'calc.house': 'House',
  'calc.beds': 'Bedrooms', 'calc.bedsUnit': 'bedrooms', 'calc.baths': 'Bathrooms', 'calc.bathsUnit': 'bathroom(s)',
  'calc.sqft': 'Floor area', 'calc.sqftUnit': 'sq ft',
  'calc.quote': 'Every situation is different. We assess for free (on site or by photos/video) and give you a <b>firm price within the hour</b>. Intervention possible within 24–48 h.',
  'calc.freq': 'Frequency', 'calc.freqHint': 'the more regular, the better the rate',
  'f.once': 'One time', 'f.monthly': 'Monthly', 'f.biweekly': 'Every 2 weeks', 'f.weekly': 'Weekly',
  'calc.extras': 'À la carte services', 'calc.estimate': 'Your estimate',
  'calc.gift': '<b>Complimentary Prime Gift Box</b> on your first visit — antibacterial gel, signature mist, and more.',
  'calc.book': 'Book this price', 'calc.fine': 'Indicative estimate · final price confirmed before the visit · pay after the service',
  'mq2.1': 'Trained at the Prime Academy', 'mq2.2': 'Always in uniform', 'mq2.3': 'Same team, every visit', 'mq2.4': '24-hour guarantee', 'mq2.5': 'Eco-luxury products', 'mq2.6': 'Bilingual FR · EN · ES',
  'kit.eyebrow': 'The Prime Gift Box', 'kit.h2': 'A gift, <em>because first impressions matter.</em>',
  'kit.p': 'On your first visit, we leave a Prime Ménage signature box in your home, presented like in a grand hotel.',
  'kit.1': 'Prime antibacterial gel', 'kit.1p': 'Travel size, 70% alcohol, eucalyptus scent — for your bag or entryway.',
  'kit.2': 'Room mist N°1', 'kit.2p': 'Our scent signature: white linen and bergamot, the same one we leave after every visit.',
  'kit.3': 'Cotton candle &amp; microfibre cloth', 'kit.3p': 'To make that fresh-clean feeling last between visits.',
  'kit.4': 'Gold seals &amp; handwritten card', 'kit.4p': 'The Prime seals that close the toilet paper fold, and a note handwritten by your team.',
  'kit.note': 'Included with every first residential booking. Recurring clients receive a refreshed seasonal box.',
  'sig.eyebrow': 'Prime Signatures', 'sig.h2': 'Five-star hotel details, <em class="gold-text">at home.</em>',
  'sig.p': "These little things are how you'll know Prime Ménage was here. They're included in every visit, no exceptions.",
  'sig.1': 'The signature fold', 'sig.1p': 'Toilet paper folded to a point and sealed with a gold Prime sticker — the gesture that says “this bathroom was just sanitized.”',
  'sig.2': 'The Prime Seal', 'sig.2p': 'A gold seal placed on the toilet and bathroom glasses: visible proof that every surface was sanitized and inspected.',
  'sig.3': 'Hotel-style towels', 'sig.3p': 'Towels folded in thirds, beds made with hotel corners, cushions aligned. Your bedroom looks like a suite again.',
  'sig.4': 'Handwritten card &amp; photo report', 'sig.4p': 'At the end of every visit, your team leaves a handwritten note — what was done, what was noticed (darkening grout, a burnt-out bulb). You also receive inspection photos by text or WhatsApp.',
  'sig.5': 'The scent signature', 'sig.5p': 'A discreet mist of white linen and bergamot on the way out. Fragrance-free on request for sensitive households.',
  'wipe.eyebrow': 'Try it yourself', 'wipe.h2': 'Wipe it. <em>See the difference.</em>',
  'wipe.p': "Slide your finger or mouse across the surface. That's exactly what our team feels every visit — and what you'll feel walking through your door.",
  'wipe.reset': '↺ Make it dirty again', 'wipe.clean': 'Spotless.', 'wipe.small': 'The Prime standard', 'wipe.hint': 'Swipe to clean',
  'std.eyebrow': 'The Prime standard', 'std.h2': "A team you'll be <em>proud</em> to welcome.",
  'std.p': 'We run Prime Ménage like a luxury house: selective hiring, training, uniforms, written protocols and quality control. Nobody enters your home without passing every step.',
  'std.alt': 'Prime Ménage professional in uniform', 'std.badge': 'Prime Academy certified', 'std.badges': 'Trained · vetted · uniformed',
  'std.s1': 'checkpoints on every visit', 'std.s2': 'of training before the first home', 'std.s3': 'of staff vetted (background &amp; references)', 'std.s4': 'to come back for touch-ups, free',
  'std.1': 'The Prime Academy', 'std.1p': 'Surface-specific techniques (marble, hardwood, stainless, quartz), top-to-bottom workflow, colour-coded cloths to prevent cross-contamination.',
  'std.2': 'Uniform &amp; presentation', 'std.2p': 'Embroidered polo and apron, shoe covers at the door, gloves. Punctuality, discretion and courtesy — in French, English or Spanish.',
  'std.3': 'Always the same person', 'std.3p': 'Your dedicated professional learns your preferences, delicate rooms and habits. Your keys and codes are kept under a confidential protocol.',
  'std.4': 'Eco-luxury, all supplied', 'std.4p': 'Biodegradable products safe for kids and pets, HEPA vacuum and professional microfibres. You have nothing to provide.',
  'proc.eyebrow': 'How it works', 'proc.h2': 'Simple, from the first message <em>to the final touch.</em>',
  'proc.1': 'Your price', 'proc.1p': 'Calculate in 30 seconds or message us on WhatsApp. Personal reply in under 2 hours.',
  'proc.2': 'Confirmation', 'proc.2p': 'Date, time and access confirmed. You receive a Wave invoice that serves as the agreement — nothing to pay upfront.',
  'proc.3': 'The visit', 'proc.3p': 'Your team arrives in uniform with all the equipment. 72-point protocol, signature details, Prime Gift Box.',
  'proc.4': 'Follow-up', 'proc.4p': "Inspection photos, handwritten card, payment by Interac or card. Something not right? We're back within 24 h.",
  'rev.eyebrow': 'They trust us with their homes', 'rev.h2': 'In our <em>clients’</em> words.', 'rev.rating': 'Satisfaction guaranteed, visit after visit',
  'rev.1': '“The little gold seal on the toilet paper made me smile. It feels like a hotel — every single time.”',
  'rev.2': '“End of lease on July 1st, total chaos. My landlord returned my full deposit without a single comment.”',
  'rev.3': '“Same person every two weeks, always in uniform, always on time. I stopped thinking about cleaning altogether.”',
  'rev.4': '“After our renovations there was drywall dust everywhere. Two days later the house was ready for its photo shoot.”',
  'rev.5': '“More expensive than my old company, yes. But I never have to redo anything. Worth every dollar.”',
  'rev.6': '“Our Airbnb reviews went from “clean” to “spotless” in a month. The photo report after each turnover is gold.”',
  'zone.eyebrow': 'Service area', 'zone.h2': 'In the heart of <em>Montreal.</em>',
  'zone.p': "We deliberately keep a compact territory: our teams arrive on time, with no travel fees. Your neighbourhood isn't listed? Message us.",
  'faq.eyebrow': 'Frequently asked', 'faq.h2': 'Everything you need <em>to know.</em>',
  'faq.p': 'Another question? We reply personally, in French, English or Spanish.', 'faq.cta': 'Message on WhatsApp',
  'q1': 'Why are you more expensive than other services?', 'a1': "Because we never cut corners on time. Our professionals are trained, vetted, well paid and uniformed; we supply eco-luxury products and professional equipment; and every visit follows a 72-point protocol with our signature details. The result: you never have to redo anything after us.",
  'q2': 'Do I need to be home during the visit?', 'a2': "No. Most of our clients give us a key or a code. They're kept under a confidential protocol and you get a message when your team arrives and leaves, with the inspection photos.",
  'q3': 'Do I need to supply products or a vacuum?', 'a3': "Nothing at all. We bring everything: biodegradable products safe for kids and pets, HEPA vacuum, professional microfibres. If you prefer your own products, we'll gladly use them.",
  'q4': "What if I'm not satisfied?", 'a4': "Let us know within 24 hours and we'll come back to touch up the area, free of charge. That's our Prime Guarantee.",
  'q5': 'How does payment work?', 'a5': 'You receive a Wave invoice on confirmation. Payment happens after the service, by Interac e-transfer or card. The receipt is sent automatically.',
  'q6': 'When should I book for July 1st?', 'a6': 'As early as possible — ideally in April or May. Dates around July 1st are limited and our recurring clients get priority.',
  'q7': 'What is your cancellation policy?', 'a7': 'Free cancellation or rescheduling up to 48 hours before the visit. After that, a 50% fee may apply, since the time slot was reserved for you.',
  'final.h2': 'Come home.<br><em class="gold-text">Everything is ready.</em>',
  'final.p': 'Limited spots each week to protect our standard. Book your first visit — your Prime Gift Box is waiting.',
  'foot.tag': 'Cleaning worthy of its name. High-end residential and commercial cleaning in Montreal.',
  'foot.svc': 'Services', 'foot.house': 'The house', 'foot.zones': 'Service area', 'foot.contact': 'Contact', 'foot.hours': 'Mon – Sat · 8 am – 7 pm', 'foot.made': 'Bilingual service · FR · EN · ES',
  'bk.h': 'Book your visit', 'bk.sub': 'We confirm personally within 2 hours.',
  'bk.name': 'Name', 'bk.phone': 'Phone', 'bk.addr': 'Address / neighbourhood', 'bk.date': 'Preferred date', 'bk.time': 'Time of day',
  'bk.am': 'Morning', 'bk.pm': 'Afternoon', 'bk.flex': 'Flexible', 'bk.notes': 'Details (pets, access, priorities…)', 'bk.email': 'Email',
  'bk.fine': 'No payment now. You pay after the service, by Interac or card.',
};

/* Strings used only from JS */
const S = {
  fr: {
    extras: { oven: 'Four', fridge: 'Frigo', windows: 'Vitres int.', laundry: 'Lessive', cabinets: 'Intérieur armoires', balcony: 'Balcon', pets: 'Poils d’animaux', organize: 'Rangement' },
    included: 'inclus', perVisit: 'par visite', once: 'visite unique', from: 'dès',
    freqPer: { once: 'visite unique', monthly: 'par visite · mensuel', biweekly: 'par visite · aux 2 semaines', weekly: 'par visite · hebdomadaire' },
    turnover: 'par rotation', save: (n) => `Vous économisez ${n} $ par visite`,
    apt: 'Appartement', house: 'Maison', studio: 'Studio', bed: (n) => n === 1 ? '1 chambre' : `${n} chambres`, bath: (n) => n === 1 ? '1 salle de bain' : `${n} salles de bain`,
    bedsUnit: (n) => n === 0 ? 'studio' : n === 1 ? 'chambre' : 'chambres',
    duration: (h, t) => `Durée estimée ~${h} h · ${t === 1 ? '1 professionnelle' : t + ' professionnelles'}`,
    sqft: 'pi²', quoteFrom: 'dès', quotePer: 'prix ferme après évaluation gratuite',
    comPer: { once: 'par passage', monthly: 'par passage · mensuel', biweekly: 'par passage · aux 2 semaines', weekly: 'par passage · hebdomadaire' },
    names: { signature: 'Entretien Signature', deep: 'Grand Ménage', premove: 'Pré-emménagement', postmove: 'Fin de bail', reno: 'Après-rénovation', commercial: 'Bureaux & Commerces', extreme: 'Remise en état', airbnb: 'Airbnb & Locations' },
    incl: {
      base: ['Cuisine, salles de bain, chambres et salon', 'Planchers aspirés et lavés, poussière partout', 'Le pli signature & le Sceau Prime', 'Produits éco-luxe et équipement fournis'],
      deep: ['Four, frigo, vitres intérieures et lessive inclus', 'Plinthes, cadres de portes, dessus d’armoires', 'Détartrage complet salle de bain'],
      move: ['Intérieur des armoires et tiroirs', 'Électroménagers dedans et dehors', 'Prêt pour l’inspection ou l’état des lieux'],
      reno: ['Double aspiration HEPA, murs et plafonds', 'Résidus de peinture, joints et vitres', 'Équipe renforcée'],
      airbnb: ['Changement de literie & serviettes hôtelières', 'Consommables regarnis', 'Photos de contrôle envoyées à l’hôte'],
      com: ['Équipe dédiée, hors des heures d’ouverture', 'Postes de travail, cuisinette, toilettes', 'Rapport après chaque passage', 'Contrat flexible, sans engagement long'],
      ext: ['Évaluation gratuite sur place ou par vidéo', 'Équipe renforcée, discrète, sans jugement', 'Désinfection et désodorisation'],
    },
    wa: 'Bonjour Prime Ménage ! J’aimerais réserver une visite.',
    bkTitle: 'Nouvelle réservation — Prime Ménage',
    bkLines: { svc: 'Service', det: 'Détails', price: 'Estimation', name: 'Nom', phone: 'Téléphone', addr: 'Adresse', date: 'Date', time: 'Moment', notes: 'Notes' },
    need: 'Merci d’indiquer votre nom et votre téléphone.',
    ready: 'Votre demande est prête. Si rien ne s’est ouvert, utilisez ce bouton :', openWa: 'Ouvrir WhatsApp', openMail: 'Ouvrir le courriel',
    wipeDone: 'Impeccable ✦',
    zoneHint: '+ quartiers voisins',
  },
  en: {
    extras: { oven: 'Oven', fridge: 'Fridge', windows: 'Inside windows', laundry: 'Laundry', cabinets: 'Inside cabinets', balcony: 'Balcony', pets: 'Pet hair', organize: 'Organizing' },
    included: 'included', perVisit: 'per visit', once: 'one-time visit', from: 'from',
    freqPer: { once: 'one-time visit', monthly: 'per visit · monthly', biweekly: 'per visit · every 2 weeks', weekly: 'per visit · weekly' },
    turnover: 'per turnover', save: (n) => `You save $${n} per visit`,
    apt: 'Apartment', house: 'House', studio: 'Studio', bed: (n) => n === 1 ? '1 bedroom' : `${n} bedrooms`, bath: (n) => n === 1 ? '1 bathroom' : `${n} bathrooms`,
    bedsUnit: (n) => n === 0 ? 'studio' : n === 1 ? 'bedroom' : 'bedrooms',
    duration: (h, t) => `Estimated ~${h} h · ${t === 1 ? '1 professional' : t + ' professionals'}`,
    sqft: 'sq ft', quoteFrom: 'from', quotePer: 'firm price after a free assessment',
    comPer: { once: 'per visit', monthly: 'per visit · monthly', biweekly: 'per visit · every 2 weeks', weekly: 'per visit · weekly' },
    names: { signature: 'Signature Upkeep', deep: 'Deep Clean', premove: 'Move-in Clean', postmove: 'Move-out Clean', reno: 'Post-Renovation', commercial: 'Offices & Retail', extreme: 'Restoration', airbnb: 'Airbnb & Rentals' },
    incl: {
      base: ['Kitchen, bathrooms, bedrooms and living room', 'Floors vacuumed and mopped, dusting throughout', 'The signature fold & the Prime Seal', 'Eco-luxury products and equipment supplied'],
      deep: ['Oven, fridge, inside windows and laundry included', 'Baseboards, door frames, cabinet tops', 'Full bathroom descaling'],
      move: ['Inside all cabinets and drawers', 'Appliances inside and out', 'Ready for inspection or move-in report'],
      reno: ['Double HEPA vacuuming, walls and ceilings', 'Paint residue, grout and windows', 'Reinforced team'],
      airbnb: ['Hotel bedding & towel change', 'Supplies restocked', 'Inspection photos sent to the host'],
      com: ['Dedicated team, after business hours', 'Workstations, kitchenette, washrooms', 'Report after every visit', 'Flexible contract, no long commitment'],
      ext: ['Free on-site or video assessment', 'Reinforced, discreet, judgment-free team', 'Disinfection and deodorizing'],
    },
    wa: 'Hello Prime Ménage! I would like to book a visit.',
    bkTitle: 'New booking — Prime Ménage',
    bkLines: { svc: 'Service', det: 'Details', price: 'Estimate', name: 'Name', phone: 'Phone', addr: 'Address', date: 'Date', time: 'Time', notes: 'Notes' },
    need: 'Please enter your name and phone number.',
    ready: 'Your request is ready. If nothing opened, use this button:', openWa: 'Open WhatsApp', openMail: 'Open email',
    wipeDone: 'Spotless ✦',
    zoneHint: '+ nearby areas',
  },
};

const ZONES = [
  { n: 'Plateau-Mont-Royal', x: 363, y: 225 },
  { n: 'Mile End', x: 313, y: 216 },
  { n: 'Outremont', x: 290, y: 239 },
  { n: 'Rosemont', x: 350, y: 144 },
  { n: 'Villeray', x: 258, y: 146 },
  { n: 'Hochelaga', x: 451, y: 135 },
  { n: 'Ville-Marie', x: 388, y: 302 },
  { n: 'Vieux-Montréal', x: 429, y: 279 },
  { n: 'Griffintown', x: 407, y: 331 },
  { n: 'Westmount', x: 318, y: 364 },
  { n: 'NDG', x: 262, y: 407 },
  { n: 'Verdun', x: 388, y: 457 },
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
};

let lang = store.get('pm-lang') || ((navigator.language || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr');
const t = () => S[lang];
const money = (n) => lang === 'fr' ? `${n} $` : `$${n}`;

/* Save the FR originals once so we can switch back and forth. */
const FR = {};
$$('[data-i18n]').forEach((el) => { const k = el.dataset.i18n; if (!(k in FR)) FR[k] = el.innerHTML; });
const FR_ALT = {};
$$('[data-i18n-alt]').forEach((el) => { FR_ALT[el.dataset.i18nAlt] = el.alt; });

function applyLang() {
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach((el) => {
    const k = el.dataset.i18n;
    const v = lang === 'en' ? EN[k] : FR[k];
    if (v != null) el.innerHTML = v;
  });
  $$('[data-i18n-alt]').forEach((el) => {
    const k = el.dataset.i18nAlt; el.alt = lang === 'en' ? (EN[k] || FR_ALT[k]) : FR_ALT[k];
  });
  $$('#lang-toggle span').forEach((s, i) => s.classList.toggle('on', (i === 0) === (lang === 'fr')));
  splitManifesto();
  renderChips();
  renderFromPrices();
  updateWaLinks();
  calcUpdate(false);
}

$('#lang-toggle').addEventListener('click', () => {
  lang = lang === 'fr' ? 'en' : 'fr';
  store.set('pm-lang', lang);
  applyLang();
});

/* ---------------- Contact links ---------------- */
function updateWaLinks() {
  const href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t().wa)}`;
  $$('.js-wa').forEach((a) => { a.href = href; a.target = '_blank'; a.rel = 'noopener'; });
  $$('.js-tel').forEach((a) => { a.href = `tel:${CONFIG.phone}`; });
  $$('.js-tel-label').forEach((s) => { s.textContent = CONFIG.phoneLabel; });
}

/* ---------------- Calculator ---------------- */
const state = { svc: 'signature', type: 'apt', beds: 2, baths: 1, freq: 'biweekly', sqft: 2000, extras: new Set() };
let shownPrice = 0;

function priceFor(st) {
  const cfg = PRICING.services[st.svc];
  const freq = cfg.recurring ? st.freq : 'once';
  if (cfg.kind === 'quote') return { total: PRICING.extremeFrom, from: true, freq };
  if (cfg.kind === 'com') {
    const raw = Math.max(PRICING.commercial.min, st.sqft * PRICING.commercial.perSqft);
    const disc = raw * PRICING.comFreqPct[freq];
    return { total: Math.round((raw - disc) / 5) * 5, saved: Math.round(disc), freq };
  }
  let home = PRICING.base + st.beds * PRICING.perBed + st.baths * PRICING.perBath + (st.type === 'house' ? PRICING.house : 0);
  let total = home * cfg.mult;
  if (cfg.bundle) total += PRICING.bundle;
  if (cfg.cabinets) total += PRICING.extras.find((e) => e.id === 'cabinets').price;
  if (cfg.linen) total += PRICING.airbnbLinen;
  PRICING.extras.forEach((e) => {
    if (!st.extras.has(e.id)) return;
    if (cfg.bundle && e.core) return;
    if (cfg.cabinets && e.id === 'cabinets') return;
    total += e.price;
  });
  const saved = PRICING.freq[freq];
  total = Math.max(PRICING.minimum, Math.round(total - saved));
  return { total, saved, freq };
}

function renderChips() {
  const wrap = $('#chips');
  const cfg = PRICING.services[state.svc];
  wrap.innerHTML = '';
  PRICING.extras.forEach((e) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.id = e.id;
    const incl = (cfg.bundle && e.core) || (cfg.cabinets && e.id === 'cabinets');
    if (incl) { b.classList.add('incl'); b.dataset.incl = t().included; b.disabled = true; b.textContent = t().extras[e.id]; }
    else {
      b.textContent = `${t().extras[e.id]} +${money(e.price)}`;
      if (state.extras.has(e.id)) b.classList.add('on');
      b.addEventListener('click', () => {
        state.extras.has(e.id) ? state.extras.delete(e.id) : state.extras.add(e.id);
        b.classList.toggle('on'); calcUpdate(true);
      });
    }
    wrap.appendChild(b);
  });
}

function renderFromPrices() {
  $$('[data-from]').forEach((el) => {
    const svc = el.dataset.from;
    const cfg = PRICING.services[svc];
    let p;
    if (cfg.kind === 'quote') p = PRICING.extremeFrom;
    else if (cfg.kind === 'com') p = PRICING.commercial.min;
    else p = priceFor({ svc, type: 'apt', beds: 0, baths: 1, freq: 'weekly', sqft: 0, extras: new Set() }).total;
    el.textContent = (cfg.kind === 'quote' ? t().quoteFrom + ' ' : '') + money(p);
  });
  $$('[data-disc]').forEach((el) => { el.textContent = `−${money(PRICING.freq[el.dataset.disc])}`; });
}

function aptSize(beds) { return beds === 0 ? '1½' : `${beds + 2}½`; }

function animatePrice(to) {
  const el = $('#res-amt');
  const from = shownPrice;
  shownPrice = to;
  if (reduced || from === to) { el.textContent = to; return; }
  const start = performance.now(); const dur = 650;
  const step = (now) => {
    const k = Math.min(1, (now - start) / dur); const e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  const big = $('#price-big'); big.classList.remove('bump'); void big.offsetWidth; big.classList.add('bump');
}

function calcUpdate(bump = true) {
  const cfg = PRICING.services[state.svc];
  const L = t();
  $$('.svc-tab').forEach((b) => b.classList.toggle('on', b.dataset.svc === state.svc));
  $('#opt-res').hidden = cfg.kind !== 'res';
  $('#opt-res').style.display = cfg.kind === 'res' ? 'grid' : 'none';
  $('#opt-com').hidden = cfg.kind !== 'com';
  $('#opt-quote').hidden = cfg.kind !== 'quote';
  $('#opt-freq').hidden = !cfg.recurring;
  $('#opt-extras').hidden = cfg.kind !== 'res';

  $('#beds-val').textContent = state.beds === 0 ? '0' : state.beds;
  $('#beds-lbl').textContent = L.bedsUnit(state.beds);
  $('#baths-val').textContent = state.baths;
  $('#apt-size').textContent = state.type === 'apt' ? aptSize(state.beds) : '';
  $$('#seg-type button').forEach((b) => b.classList.toggle('on', b.dataset.val === state.type));
  $$('#seg-freq button').forEach((b) => b.classList.toggle('on', b.dataset.val === state.freq));

  const r = priceFor(state);
  $('#res-service').textContent = L.names[state.svc];
  let home = '';
  if (cfg.kind === 'res') {
    const kind = state.type === 'apt' ? `${L.apt} ${aptSize(state.beds)}` : L.house;
    home = `${kind} · ${state.beds === 0 ? L.studio : L.bed(state.beds)} · ${L.bath(state.baths)}`;
  } else if (cfg.kind === 'com') {
    home = `${state.sqft.toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA')} ${L.sqft}`;
  }
  $('#res-home').textContent = home;

  const from = $('#res-from');
  from.hidden = !r.from; from.textContent = L.quoteFrom;
  if (bump) animatePrice(r.total); else { shownPrice = r.total; $('#res-amt').textContent = r.total; }

  let per;
  if (cfg.kind === 'quote') per = L.quotePer;
  else if (cfg.kind === 'com') per = L.comPer[r.freq];
  else if (cfg.linen) per = L.turnover + (r.freq !== 'once' ? ' · ' + L.freqPer[r.freq].split('· ')[1] : '');
  else per = L.freqPer[r.freq];
  if (cfg.kind === 'res') {
    const hours = Math.max(2, Math.round((r.total / 58) * 2) / 2);
    const team = hours > 4.5 ? 2 : 1;
    per += ' — ' + L.duration(String(Math.round((hours / team) * 2) / 2).replace('.', lang === 'fr' ? ',' : '.'), team);
  }
  $('#res-per').textContent = per;

  const save = $('#res-save');
  if (r.saved) { save.hidden = false; save.textContent = L.save(r.saved); } else save.hidden = true;

  let items;
  if (cfg.kind === 'com') items = L.incl.com;
  else if (cfg.kind === 'quote') items = L.incl.ext;
  else {
    items = [...L.incl.base];
    if (state.svc === 'deep') items = items.slice(0, 3).concat(L.incl.deep);
    if (state.svc === 'premove' || state.svc === 'postmove') items = items.slice(0, 2).concat(L.incl.deep.slice(0, 1), L.incl.move);
    if (state.svc === 'reno') items = L.incl.reno.concat(L.incl.deep.slice(0, 1), L.incl.move.slice(0, 1));
    if (state.svc === 'airbnb') items = items.slice(0, 2).concat(L.incl.airbnb);
  }
  $('#res-list').innerHTML = items.map((s) => `<li><svg><use href="#i-check"/></svg><span>${s}</span></li>`).join('');
  $('#res-gift').style.display = cfg.kind === 'res' ? 'flex' : 'none';

  const range = $('#sqft');
  range.style.setProperty('--p', ((state.sqft - range.min) / (range.max - range.min)) * 100 + '%');
  $('#sqft-val').textContent = state.sqft.toLocaleString(lang === 'fr' ? 'fr-CA' : 'en-CA');
}

function selectService(svc, scroll) {
  state.svc = svc;
  const cfg = PRICING.services[svc];
  if (!cfg.recurring) state.freq = 'once';
  else if (state.freq === 'once' && svc !== 'deep') state.freq = 'biweekly';
  renderChips(); calcUpdate(true);
  if (scroll) $('#tarifs').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}

$$('.svc-tab').forEach((b) => b.addEventListener('click', () => selectService(b.dataset.svc)));
$$('.svc-card').forEach((c) => {
  c.addEventListener('click', () => selectService(c.dataset.svc, true));
  c.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectService(c.dataset.svc, true); } });
});
$$('[data-svc-link]').forEach((a) => a.addEventListener('click', () => selectService(a.dataset.svcLink)));
$$('#seg-type button').forEach((b) => b.addEventListener('click', () => { state.type = b.dataset.val; calcUpdate(true); }));
$$('#seg-freq button').forEach((b) => b.addEventListener('click', () => { state.freq = b.dataset.val; calcUpdate(true); }));
$$('[data-step]').forEach((b) => b.addEventListener('click', () => {
  const k = b.dataset.step; const d = +b.dataset.dir;
  const lim = k === 'beds' ? [0, 7] : [1, 5];
  state[k] = Math.min(lim[1], Math.max(lim[0], state[k] + d));
  calcUpdate(true);
}));
$('#sqft').addEventListener('input', (e) => { state.sqft = +e.target.value; calcUpdate(false); });
$('#sqft').addEventListener('change', () => calcUpdate(true));

/* ---------------- Booking modal ---------------- */
const modal = $('#modal');
function summaryText() {
  const cfg = PRICING.services[state.svc];
  const r = priceFor(state);
  const det = [$('#res-home').textContent, $('#res-per').textContent.split(' — ')[0]].filter(Boolean);
  const extras = cfg.kind === 'res' ? [...state.extras].filter((id) => {
    const e = PRICING.extras.find((x) => x.id === id);
    return !((cfg.bundle && e.core) || (cfg.cabinets && id === 'cabinets'));
  }).map((id) => t().extras[id]) : [];
  if (extras.length) det.push('+ ' + extras.join(', '));
  return { svc: t().names[state.svc], det: det.join(' · '), price: (r.from ? t().quoteFrom + ' ' : '') + money(r.total) };
}
function openModal() {
  const s = summaryText();
  $('#bk-svc').textContent = s.svc; $('#bk-det').textContent = s.det; $('#bk-price').textContent = s.price;
  modal.classList.add('open'); document.body.classList.add('locked');
  setTimeout(() => $('#f-name').focus(), 350);
}
function closeModal() { modal.classList.remove('open'); document.body.classList.remove('locked'); }
$('#book-btn').addEventListener('click', openModal);
$$('[data-close]', modal).forEach((el) => el.addEventListener('click', closeModal));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeMenu(); } });

let via = 'wa';
$$('#bk-form [data-via]').forEach((b) => b.addEventListener('click', () => { via = b.dataset.via; }));
$('#bk-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const name = f.name.value.trim(); const phone = f.phone.value.trim();
  const msg = $('#bk-msg');
  if (!name || !phone) { msg.hidden = false; msg.className = 'bk-msg err'; msg.textContent = t().need; (name ? f.phone : f.name).focus(); return; }
  const s = summaryText(); const L = t().bkLines;
  const timeSel = f.time.options[f.time.selectedIndex].textContent;
  const lines = [
    t().bkTitle, '',
    `${L.svc}: ${s.svc}`, `${L.det}: ${s.det}`, `${L.price}: ${s.price}`, '',
    `${L.name}: ${name}`, `${L.phone}: ${phone}`,
    f.addr.value.trim() ? `${L.addr}: ${f.addr.value.trim()}` : null,
    f.date.value ? `${L.date}: ${f.date.value}` : null,
    `${L.time}: ${timeSel}`,
    f.notes.value.trim() ? `${L.notes}: ${f.notes.value.trim()}` : null,
  ].filter((x) => x !== null).join('\n');
  const url = via === 'mail'
    ? `mailto:${CONFIG.email}?subject=${encodeURIComponent(t().bkTitle + ' · ' + s.svc)}&body=${encodeURIComponent(lines)}`
    : `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(lines)}`;
  let opened = null;
  if (via === 'mail') { window.location.href = url; } else { try { opened = window.open(url, '_blank', 'noopener'); } catch (err) { opened = null; } }
  // Fallback when pop-ups are blocked: a real link plus the message to copy.
  msg.hidden = false; msg.className = 'bk-msg';
  msg.innerHTML = `<span>${t().ready}</span><a class="btn btn-gold btn-sm" href="${url}" target="_blank" rel="noopener">${via === 'mail' ? t().openMail : t().openWa}</a><pre></pre>`;
  $('pre', msg).textContent = lines;
});

/* ---------------- Mobile menu ---------------- */
const menu = $('#mobile-menu');
function closeMenu() { menu.classList.remove('open'); document.body.classList.remove('locked'); }
$('#menu-open').addEventListener('click', () => { menu.classList.add('open'); document.body.classList.add('locked'); });
$('#menu-close').addEventListener('click', closeMenu);
$$('a', menu).forEach((a) => a.addEventListener('click', closeMenu));
$$('.mm-link', menu).forEach((a, i) => { a.style.transitionDelay = (0.15 + i * 0.05) + 's'; });

/* ---------------- Manifesto word reveal ---------------- */
let manifestoWords = [];
function splitManifesto() {
  const p = $('#manifesto');
  const walk = (node) => {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(p);
  manifestoWords = $$('.w', p);
  if (reduced) manifestoWords.forEach((w) => w.classList.add('lit'));
}
function updateManifesto() {
  if (reduced || !manifestoWords.length) return;
  const p = $('#manifesto'); const r = p.getBoundingClientRect(); const vh = innerHeight;
  const k = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
  const n = Math.round(k * manifestoWords.length);
  manifestoWords.forEach((w, i) => w.classList.toggle('lit', i < n));
}

/* ---------------- Scroll effects ---------------- */
const header = $('#header'); const progress = $('#progress'); const fab = $('#fab');
let lastY = 0; let ticking = false;
const parallaxEls = $$('[data-parallax]');
function onScroll() {
  const y = scrollY; const h = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  header.classList.toggle('scrolled', y > 40);
  header.classList.toggle('hide', y > 500 && y > lastY && !menu.classList.contains('open'));
  fab.classList.toggle('show', y > innerHeight * 0.7);
  lastY = y;
  updateManifesto();
  if (!reduced) parallaxEls.forEach((el) => {
    const r = el.parentElement.getBoundingClientRect();
    const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
    el.style.transform = `translate3d(0, ${(-k * 100 * +el.dataset.parallax) - 6}%, 0)`;
  });
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

/* Reveal on view */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    io.unobserve(en.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
$$('.reveal, #steps').forEach((el) => io.observe(el));

/* Kit opens when in view */
const kitIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('open'); kitIO.unobserve(en.target); } });
}, { threshold: 0.35 });
kitIO.observe($('#kit-stage'));

/* Counters */
const countIO = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target; const to = +el.dataset.count; countIO.unobserve(el);
    if (reduced) { el.textContent = to; return; }
    const start = performance.now(); const dur = 1800;
    const step = (now) => {
      const k = Math.min(1, (now - start) / dur); const e = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(to * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.6 });
$$('[data-count]').forEach((el) => countIO.observe(el));

/* Marquees: duplicate content for a seamless loop */
$$('[data-marquee], #rev-track').forEach((track) => {
  Array.from(track.children).forEach((c) => { const cl = c.cloneNode(true); cl.setAttribute('aria-hidden', 'true'); track.appendChild(cl); });
});

/* ---------------- Pointer effects ---------------- */
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (finePointer && !reduced) {
  const glow = $('#cursor-glow'); document.body.classList.add('has-cursor');
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function loop() { gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12; glow.style.transform = `translate(${gx - 180}px, ${gy - 180}px)`; requestAnimationFrame(loop); })();

  $$('.magnetic').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}
$$('.svc-card, .sig-card').forEach((c) => {
  c.addEventListener('pointermove', (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`); c.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

/* Gold sparkle burst on primary buttons */
function burst(x, y, n = 12) {
  if (reduced) return;
  const b = document.createElement('div'); b.className = 'burst'; b.style.left = x + 'px'; b.style.top = y + 'px';
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i'); const a = (Math.PI * 2 * i) / n + Math.random() * 0.4; const d = 40 + Math.random() * 50;
    s.style.setProperty('--x', Math.cos(a) * d + 'px'); s.style.setProperty('--y', Math.sin(a) * d + 'px');
    b.appendChild(s);
  }
  document.body.appendChild(b); setTimeout(() => b.remove(), 1000);
}
$$('.btn-gold').forEach((btn) => btn.addEventListener('click', (e) => burst(e.clientX, e.clientY)));

/* ---------------- FAQ ---------------- */
$$('.faq-item').forEach((it) => {
  $('.faq-q', it).addEventListener('click', () => {
    const open = it.classList.contains('open');
    $$('.faq-item').forEach((o) => o.classList.remove('open'));
    if (!open) it.classList.add('open');
  });
});

/* ---------------- Zones + map ---------------- */
(function zones() {
  const list = $('#zone-list'); const pins = $('#pins'); const NS = 'http://www.w3.org/2000/svg';
  const pinEls = []; const chipEls = [];
  ZONES.forEach((z, i) => {
    const chip = document.createElement('span'); chip.className = 'zone'; chip.textContent = z.n; list.appendChild(chip); chipEls.push(chip);
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'pin');
    g.innerHTML = `<circle class="pulse" cx="${z.x}" cy="${z.y}" r="7" fill="#e5c46a" opacity=".6" style="animation-delay:${-(i * 0.37)}s"/><circle class="core" cx="${z.x}" cy="${z.y}" r="4.5" fill="#e5c46a"/><text x="${z.x + 10}" y="${z.y + 4}">${z.n}</text>`;
    pins.appendChild(g); pinEls.push(g);
    const on = () => { stopCycle(); hl(i); }; const off = () => { hl(-1); startCycle(); };
    chip.addEventListener('pointerenter', on); chip.addEventListener('pointerleave', off);
    g.addEventListener('pointerenter', on); g.addEventListener('pointerleave', off);
  });
  function hl(i) { pinEls.forEach((p, j) => p.classList.toggle('hl', j === i)); chipEls.forEach((c, j) => c.classList.toggle('hl', j === i)); }
  let idx = 0, timer = null;
  function startCycle() { if (reduced || timer) return; timer = setInterval(() => { hl(idx % ZONES.length); idx++; }, 1700); }
  function stopCycle() { clearInterval(timer); timer = null; }
  const mio = new IntersectionObserver((en) => { en[0].isIntersecting ? startCycle() : stopCycle(); }, { threshold: 0.3 });
  mio.observe($('#map-svg'));
})();

/* ---------------- Hero bubbles ---------------- */
(function bubbles() {
  const c = $('#bubbles'); if (!c || reduced) return;
  const ctx = c.getContext('2d'); let W, H, dpr; let items = []; let visible = true;
  const mouse = { x: -999, y: -999 };
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1); W = c.clientWidth; H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(30, W / 48));
    items = Array.from({ length: n }, () => make(true));
  }
  function make(init) {
    const sparkle = Math.random() < 0.35;
    return { x: Math.random() * W, y: init ? Math.random() * H : H + 40, r: sparkle ? 1 + Math.random() * 1.8 : 4 + Math.random() * 16,
      vy: 0.15 + Math.random() * 0.45, ph: Math.random() * 6.28, sw: 0.3 + Math.random() * 0.8, sparkle, hue: Math.random() * 360 };
  }
  c.parentElement.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  c.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) requestAnimationFrame(draw); }).observe(c);
  let tm = 0;
  function draw() {
    if (!visible) return;
    tm += 0.016; ctx.clearRect(0, 0, W, H);
    items.forEach((b, i) => {
      b.y -= b.vy; b.x += Math.sin(tm * b.sw + b.ph) * 0.35;
      const dx = b.x - mouse.x, dy = b.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 120 && d > 0) { b.x += (dx / d) * 1.6; b.y += (dy / d) * 1.2; }
      if (b.y < -60) items[i] = make(false);
      if (b.sparkle) {
        const a = 0.35 + 0.65 * Math.abs(Math.sin(tm * 2 + b.ph));
        ctx.fillStyle = `rgba(244,226,173,${a})`; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
      } else {
        const g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.1, b.x, b.y, b.r);
        g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(0.75, 'rgba(255,255,255,0.02)');
        g.addColorStop(0.92, `hsla(${(b.hue + tm * 40) % 360},80%,75%,0.22)`); g.addColorStop(1, 'rgba(229,196,106,0.35)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(b.x - b.r * 0.4, b.y - b.r * 0.45, b.r * 0.18, b.r * 0.1, -0.7, 0, 6.283); ctx.fill();
      }
    });
    requestAnimationFrame(draw);
  }
  size(); addEventListener('resize', size); requestAnimationFrame(draw);
})();

/* ---------------- Wipe-to-clean ---------------- */
(function wipe() {
  const box = $('#wipe-box'); const c = $('#wipe-canvas'); const ctx = c.getContext('2d', { willReadFrequently: true });
  const bar = $('#wipe-bar'); const pct = $('#wipe-pct');
  let W, H, dpr, down = false, last = null, moves = 0, done = false;
  function paintDirt() {
    dpr = Math.min(2, devicePixelRatio || 1); W = c.clientWidth; H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#8b7d68'); g.addColorStop(0.5, '#6f6454'); g.addColorStop(1, '#857761');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) {
      const v = 45 + Math.random() * 55;
      ctx.fillStyle = `rgba(${v + 18},${v + 10},${v},${Math.random() * 0.3})`;
      ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 10, 0, 6.283); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(60,50,38,.35)'; ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath(); const x = Math.random() * W, y = Math.random() * H; ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + 40, y + Math.random() * 40, x + 80, y - 30, x + 140 * Math.random(), y + 20); ctx.stroke();
    }
    for (let i = 0; i < 6; i++) { // coffee rings
      ctx.strokeStyle = 'rgba(70,45,25,.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * H, 18 + Math.random() * 20, 0, 6.283); ctx.stroke();
    }
  }
  function reset() {
    done = false; moves = 0; box.classList.remove('done', 'started'); paintDirt();
    bar.style.width = '0%'; pct.textContent = '0 %';
  }
  function scrub(x, y) {
    ctx.globalCompositeOperation = 'destination-out';
    const r = Math.max(34, W / 14);
    const pts = last ? Math.ceil(Math.hypot(x - last.x, y - last.y) / (r / 3)) : 1;
    for (let i = 1; i <= pts; i++) {
      const px = last ? last.x + ((x - last.x) * i) / pts : x; const py = last ? last.y + ((y - last.y) * i) / pts : y;
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, 6.283); ctx.fill();
    }
    last = { x, y };
    if (++moves % 6 === 0) measure();
  }
  function measure() {
    const step = 12 * dpr; const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let clear = 0, total = 0;
    for (let y = 0; y < c.height; y += step) for (let x = 0; x < c.width; x += step) { total++; if (data[(y * c.width + x) * 4 + 3] < 60) clear++; }
    const k = clear / total; const shown = Math.min(100, Math.round((k / 0.6) * 100));
    bar.style.width = shown + '%'; pct.textContent = shown + ' %';
    if (k >= 0.6 && !done) {
      done = true; box.classList.add('done'); bar.style.width = '100%'; pct.textContent = '100 %';
      const r = box.getBoundingClientRect();
      for (let i = 0; i < 5; i++) setTimeout(() => burst(r.left + r.width * (0.2 + Math.random() * 0.6), r.top + r.height * (0.2 + Math.random() * 0.6), 14), i * 140);
    }
  }
  const pos = (e) => { const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  c.addEventListener('pointerdown', (e) => { down = true; last = null; box.classList.add('started'); c.setPointerCapture(e.pointerId); const p = pos(e); scrub(p.x, p.y); });
  // Mouse wipes on hover; touch and pen wipe while pressed.
  c.addEventListener('pointermove', (e) => { if (!down && e.pointerType !== 'mouse') return; box.classList.add('started'); const p = pos(e); scrub(p.x, p.y); });
  c.addEventListener('pointerup', () => { down = false; last = null; measure(); });
  c.addEventListener('pointerleave', () => { last = null; });
  $('#wipe-reset').addEventListener('click', reset);
  let rw = 0; addEventListener('resize', () => { if (Math.abs(c.clientWidth - rw) > 40) { rw = c.clientWidth; if (!box.classList.contains('started')) paintDirt(); } });
  rw = c.clientWidth; paintDirt();
})();

/* ---------------- Boot ---------------- */
$('#year').textContent = new Date().getFullYear();
selectService('signature');
applyLang();
onScroll();

function ready() {
  const pl = $('#preloader');
  pl.classList.add('done');
  document.body.classList.add('ready');
  setTimeout(() => pl.remove(), 1200);
}
if (reduced) ready();
else {
  const minDelay = new Promise((r) => setTimeout(r, 1500));
  const loaded = new Promise((r) => { if (document.readyState === 'complete') r(); else addEventListener('load', r, { once: true }); });
  Promise.race([Promise.all([minDelay, loaded]), new Promise((r) => setTimeout(r, 3500))]).then(ready);
}
})();
