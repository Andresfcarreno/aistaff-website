const { build } = require("./lib");
const OUT = process.argv[2];
const body = [
["title", "Contrat de service", "Adjointe personnelle IA · Mois à mois · Version 1.0 (septembre 2026)"],
["h", "Entre"],
["fields", [
  ["Le fournisseur", "[Nom légal] faisant affaire sous le nom **AI Staff**, NEQ [__________], [adresse], Montréal (Québec). Courriel : hello@meetaistaff.com · Tél. : +1 (438) 805-8804. Ci-après « **AI Staff** »."],
  ["Le client", "Nom légal : ______________________________\nNEQ : ______________\nReprésenté par : ______________________\nAdresse : ________________________________\nCourriel : ____________________\nTél. : ________________\nCi-après le « **Client** »."],
]],
["note", "**En résumé (non contractuel).** AI Staff configure et exploite pour vous une adjointe IA qui répond à vos appels et messages et gère votre agenda. C'est mois à mois, sans contrat à long terme : vous pouvez arrêter avec 30 jours d'avis. Les canaux s'activent par phases. L'IA peut se tromper; vous gardez la supervision. Vos données restent les vôtres."],

["art", "Définitions"],
["c", "**Adjointe** : l'agent conversationnel à base d'intelligence artificielle configuré par AI Staff pour le Client (persona Sofía, Alex, Tomás ou autre)."],
["c", "**Service** : la configuration, l'hébergement, l'exploitation et le soutien de l'Adjointe, du numéro de téléphone et du tableau de bord, selon le plan choisi à l'Annexe A."],
["c", "**Canaux** : les moyens par lesquels l'Adjointe communique (appels, SMS, agenda, courriel, WhatsApp, messages privés des réseaux sociaux, briefings)."],
["c", "**Données du Client** : toute information que le Client ou ses propres clients fournissent dans le cadre du Service, y compris les appels, messages, enregistrements, transcriptions, rendez-vous et coordonnées."],
["c", "**Renseignements personnels** : tout renseignement qui concerne une personne physique et permet de l'identifier, au sens de la ~Loi sur la protection des renseignements personnels dans le secteur privé~ (RLRQ, c. P-39.1)."],

["art", "Objet et documents contractuels"],
["c", "AI Staff fournit le Service au Client, qui l'accepte, aux conditions du présent contrat."],
["c", "Font partie du contrat : **l'Annexe A** (bon de commande : plan, prix, canaux), **l'Annexe B** (entente de traitement des renseignements personnels) et, le cas échéant, **l'Annexe C** (autorisation de transfert de numéro). En cas de contradiction, l'ordre de priorité est : Annexe B, Annexe A, présent contrat, Annexe C."],
["c", "Le Client agit dans le cadre de son entreprise. Le présent contrat n'est pas un contrat de consommation."],

["art", "Description du Service et déploiement progressif"],
["c", "Selon le plan choisi, l'Adjointe peut notamment : répondre aux appels entrants, prendre des messages, répondre aux questions approuvées par le Client, proposer et réserver des rendez-vous, envoyer des SMS de suivi, transférer les appels urgents et produire des résumés dans le tableau de bord."],
["c", "**Déploiement progressif : les canaux s'activent par phases et sont confirmés lors de l'appel découverte.** À la signature, les canaux actifs sont ceux cochés à l'Annexe A. Tout autre canal (par exemple courriel, WhatsApp, messages privés, briefings vocaux) est activé seulement après confirmation écrite (courriel) d'AI Staff."],
["c", "AI Staff ne garantit aucune date d'activation d'un canal. Si un canal prévu au plan n'est pas encore offert, les parties peuvent convenir par écrit d'un ajustement du prix."],
["c", "Les appels sortants se limitent aux personnes qui ont un lien d'affaires existant avec le Client ou qui y ont consenti (par exemple : rappel de rendez-vous, suivi d'une demande, briefing du Client). **Aucun appel ou message non sollicité (« à froid ») n'est fait par le Service.**"],

["art", "Installation, démo et mise en service"],
["c", "Les frais d'installation sont indiqués à l'Annexe A (offerts pendant la période de lancement, le cas échéant)."],
["c", "AI Staff prépare la configuration à partir des renseignements fournis par le Client (questionnaire d'accueil, site web, services, heures, réponses types). Le Client révise et **approuve le message d'accueil, les réponses types et les règles de transfert** avant la mise en service."],
["c", "Le Client fournit les accès nécessaires (par exemple : agenda) par les mécanismes d'autorisation prévus par le fournisseur concerné, sans jamais transmettre ses mots de passe en clair. Ces accès sont révocables en tout temps par le Client."],

["art", "Numéro de téléphone"],
["c", "Le Client choisit l'une des options suivantes à l'Annexe A : **(a) transfert (portage)** de son numéro existant vers la plateforme d'AI Staff; **(b) nouveau numéro** fourni par AI Staff; ou **(c) renvoi d'appel** de sa ligne existante vers le numéro de l'Adjointe."],
["c", "**Numéro transféré (option a).** Le Client demeure le titulaire du numéro. Le transfert dépend des fournisseurs de télécommunications; AI Staff ne peut garantir sa date. Le Client signe l'Annexe C et fournit les documents exigés par les fournisseurs. À la fin du contrat, AI Staff collabore au transfert du numéro vers le fournisseur choisi par le Client, sur demande écrite reçue dans les 30 jours suivant la fin, pourvu que les sommes dues soient payées."],
["c", "**Nouveau numéro (option b).** Le numéro est attribué au Client pour la durée du contrat. À la fin du contrat, le Client peut demander son transfert vers un autre fournisseur dans les 30 jours; après ce délai, le numéro peut être libéré."],
["c", "**Renvoi d'appel (option c).** Le Client configure et maintient le renvoi auprès de son propre fournisseur, et peut l'annuler en tout temps."],

["art", "Obligations du Client"],
["c", "Fournir des renseignements exacts et à jour (services, prix, heures, politiques) et informer AI Staff de tout changement."],
["c", "**Transparence envers ses clients.** Le Client accepte que l'Adjointe s'identifie comme une assistante IA en début de conversation et annonce que l'appel peut être enregistré. Le Client ne demande jamais à l'Adjointe de se faire passer pour un être humain."],
["c", "**Consentements et lois applicables.** Le Client est responsable d'obtenir les consentements requis pour les messages commerciaux électroniques (~Loi canadienne anti-pourriel~), de respecter les Règles sur les télécommunications non sollicitées du CRTC et la Liste nationale de numéros de télécommunication exclus, ainsi que les lois sur la protection des renseignements personnels applicables à ses activités."],
["c", "**Obligations professionnelles.** Si le Client exerce une profession réglementée (par exemple : courtage immobilier (OACIQ), soins dentaires, santé, droit), il configure l'Adjointe pour qu'elle **ne donne aucun conseil professionnel** et transfère ces questions à une personne qualifiée. Le Client demeure seul responsable du respect de ses obligations déontologiques."],
["c", "**Pas un service d'urgence.** Le Service ne remplace pas le 911 ni un service d'urgence. L'Adjointe invite toute personne en situation d'urgence à composer le 911."],
["c", "Le Client n'utilise pas le Service à des fins illégales, trompeuses, diffamatoires, discriminatoires ou pour du harcèlement, et ne tente pas de contourner les mesures de sécurité du Service."],

["art", "Limites de l'intelligence artificielle"],
["c", "Le Client reconnaît que l'Adjointe repose sur des modèles d'IA qui peuvent mal comprendre, se tromper ou fournir une réponse incomplète. Le Client consulte régulièrement le tableau de bord et signale toute erreur afin qu'AI Staff ajuste la configuration."],
["c", "L'Adjointe ne prend aucune décision ayant un effet juridique ou important pour une personne. Les situations sensibles, urgentes ou hors des règles approuvées sont transférées au Client ou consignées pour suivi humain."],
["c", "AI Staff ne garantit aucun résultat commercial (nombre de clients, revenus, taux de conversion)."],

["art", "Prix, taxes et paiement"],
["c", "Le Client paie le prix mensuel du plan choisi à l'Annexe A, en dollars canadiens, **d'avance, le premier jour de chaque période mensuelle**. Le premier mois peut être calculé au prorata."],
["c", "Les prix excluent les taxes. La TPS (5 %) et la TVQ (9,975 %) s'ajoutent. N° TPS : [__________]  ·  N° TVQ : [__________]."],
["c", "Le paiement se fait par carte de crédit ou débit préautorisé. Les frais de tiers expressément prévus à l'Annexe A (par exemple : frais de transfert de numéro facturés par un fournisseur, utilisation au-delà des limites raisonnables indiquées) sont facturés au coût, après avis au Client."],
["c", "En cas de retard de plus de 15 jours après un avis écrit, AI Staff peut suspendre le Service jusqu'au paiement. Toute somme impayée porte intérêt au taux de [____] % par mois."],
["c", "AI Staff peut modifier ses prix avec un **préavis écrit de 30 jours**. Le Client qui refuse la modification peut résilier le contrat sans frais avant la date d'entrée en vigueur."],

["art", "Durée et résiliation"],
["c", "Le contrat débute à la date de signature et se renouvelle automatiquement **de mois en mois**, sans durée minimale."],
["c", "Chaque partie peut y mettre fin en tout temps par avis écrit (courriel) de **30 jours**. Aucune pénalité ne s'applique. Les sommes payées pour un mois entamé ne sont pas remboursées, sauf entente contraire."],
["c", "Une partie peut résilier immédiatement par avis écrit si l'autre partie commet un manquement important et n'y remédie pas dans les 10 jours suivant un avis écrit, ou devient insolvable. AI Staff peut suspendre immédiatement le Service en cas d'usage illégal ou d'atteinte à la sécurité."],
["c", "**À la fin du contrat** : (a) le Client peut exporter ses Données (fichier CSV ou JSON) pendant 30 jours; (b) AI Staff détruit ensuite les Données du Client, sauf celles qu'elle doit conserver en vertu de la loi, et le confirme par écrit sur demande; (c) l'article 5 s'applique au numéro."],

["art", "Renseignements personnels"],
["c", "À l'égard des Renseignements personnels des clients du Client, **AI Staff agit comme prestataire de services** du Client, qui détermine les fins de leur utilisation. Les obligations des parties sont précisées à l'Annexe B, qui fait partie intégrante du contrat."],
["c", "AI Staff traite les Renseignements personnels du Client lui-même (personne-ressource, facturation) conformément à sa politique de confidentialité publiée sur meetaistaff.com/confidentialite."],
["c", "AI Staff ne vend ni ne loue aucun Renseignement personnel et n'utilise pas les Données du Client pour entraîner des modèles d'IA."],

["art", "Propriété intellectuelle"],
["c", "Le Client demeure propriétaire de ses Données, de ses marques et de son contenu. Il accorde à AI Staff une licence non exclusive, limitée à la durée du contrat, pour les utiliser uniquement afin de fournir le Service."],
["c", "AI Staff demeure propriétaire de sa plateforme, de ses gabarits, de ses méthodes de configuration, du tableau de bord et de toute amélioration générale de ceux-ci."],
["c", "AI Staff n'utilise le nom ou le logo du Client à des fins promotionnelles (par exemple : témoignage) qu'avec son consentement écrit."],

["art", "Confidentialité"],
["c", "Chaque partie garde confidentielles les informations non publiques de l'autre partie, ne les utilise que pour l'exécution du contrat et ne les divulgue qu'aux personnes qui doivent les connaître et sont tenues à une obligation équivalente. Cette obligation survit 3 ans à la fin du contrat (sans limite pour les Renseignements personnels)."],

["art", "Disponibilité et fournisseurs tiers"],
["c", "AI Staff déploie des efforts commercialement raisonnables pour que le Service soit disponible en tout temps, mais ne garantit pas un fonctionnement ininterrompu ou exempt d'erreurs. Le Service dépend de fournisseurs tiers (téléphonie, voix, modèles d'IA, hébergement) et des réseaux de télécommunications."],
["c", "AI Staff peut faire appel à des sous-traitants pour fournir le Service. La liste à jour est publiée dans sa politique de confidentialité. AI Staff demeure responsable envers le Client de l'exécution de ses obligations."],
["c", "AI Staff avise le Client dans un délai raisonnable de toute interruption importante et de toute maintenance planifiée susceptible d'affecter le Service."],

["art", "Responsabilité"],
["c", "Sauf en cas de faute intentionnelle ou de faute lourde, et sauf pour le préjudice corporel ou moral, la responsabilité totale d'AI Staff découlant du contrat est limitée au montant payé par le Client pour le Service au cours des **3 mois** précédant l'événement à l'origine de la réclamation."],
["c", "Dans la même mesure, aucune partie n'est responsable des pertes indirectes, notamment la perte de profits, de revenus, de clientèle ou de données qui ne découle pas directement de sa faute."],
["c", "Le Client indemnise AI Staff pour toute réclamation d'un tiers découlant du non-respect des articles 6.2 à 6.6 (par exemple : message envoyé sans consentement, conseil professionnel configuré à la demande du Client)."],

["art", "Force majeure"],
["c", "Aucune partie n'est responsable d'un retard ou d'un défaut d'exécution causé par une force majeure au sens de l'article 1470 du ~Code civil du Québec~, y compris une panne généralisée d'un fournisseur de télécommunications ou d'infonuagique. La partie touchée avise l'autre promptement."],

["art", "Dispositions générales"],
["c", "**Avis.** Les avis sont valablement donnés par courriel aux adresses indiquées ci-dessus (pour AI Staff : hello@meetaistaff.com)."],
["c", "**Intégralité et modifications.** Le contrat et ses annexes constituent l'entente complète entre les parties. Toute modification doit être faite par écrit (courriel accepté par les deux parties)."],
["c", "**Cession.** Le Client ne peut céder le contrat sans le consentement écrit d'AI Staff, qui ne peut le refuser sans motif raisonnable. AI Staff peut le céder à une entité qui poursuit ses activités, sur avis au Client."],
["c", "**Signature électronique.** Le contrat peut être signé électroniquement et en plusieurs exemplaires, conformément à la ~Loi concernant le cadre juridique des technologies de l'information~."],
["c", "**Survie.** Les articles 9.4, 10, 11, 12, 14 et 16 survivent à la fin du contrat."],
["c", "**Langue.** Le présent contrat a d'abord été remis au Client en français. Les parties ont exigé qu'il soit rédigé en français. ~(Si le Client préfère la version anglaise après avoir pris connaissance de la version française, cocher :)~ ☐ Après avoir reçu la version française, le Client choisit expressément d'être lié par la version anglaise."],
["c", "**Droit applicable.** Le contrat est régi par les lois du Québec et les lois fédérales du Canada qui s'y appliquent. Les tribunaux du district judiciaire de Montréal ont compétence exclusive."],

["sig", [
  { title: "AI Staff", lines: ["Par : Andrés Carreño", "Titre : Fondateur"] },
  { title: "Le Client", lines: ["Par : ____________________________", "Titre : ___________________________"] },
]],

// ---------------- Annexe A
["annex", "Annexe A · Bon de commande", "Plan, prix, canaux et numéro. Tous les prix sont en dollars canadiens, par mois, taxes en sus."],
["h", "1. Plan choisi (cocher)"],
["table", [
  ["", "Plan", "Prix / mois", "Comprend"],
  ["☐", "**Essentiel**", "397 $", "Numéro dédié et appels 24/7 (FR, EN, ES), SMS, rendez-vous dans votre agenda, tableau de bord privé, appels à l'adjointe pour demander vos rapports"],
  ["☐", "**Pro**", "597 $", "Tout Essentiel + WhatsApp, appels programmés de l'adjointe vers vous (jusqu'à 3 par jour), appels illimités (usage raisonnable)"],
  ["☐", "**Complet**", "797 $", "Tout Pro + messages Instagram et Facebook, statistiques de vos réseaux sociaux, accès prioritaire"],
], { w: [6, 24, 16, 54], header: true }],
["fields", [
  ["Frais d'installation", "☐ 0 $ (offre de lancement)   ☐ ________ $"],
  ["Date de mise en service visée", "________________ (indicative, non garantie)"],
  ["Limites d'utilisation raisonnables", "________ minutes d'appel / mois; ________ SMS / mois. Au-delà : ________ $ / minute, ________ $ / SMS, après avis."],
  ["Mode de paiement", "☐ Carte de crédit   ☐ Débit préautorisé"],
]],
["h", "2. Adjointe"],
["fields", [
  ["Persona", "☐ Sofía   ☐ Alex   ☐ Tomás   ☐ Autre : __________"],
  ["Langues", "________________________________________ (FR, EN, ES)"],
  ["Message d'accueil approuvé", "________________________________________________"],
  ["Transfert des urgences vers", "Nom : ______________   Tél. : ______________"],
]],
["h", "3. Canaux actifs à la signature"],
["note", "Déploiement progressif : les canaux s'activent par phases et sont confirmés lors de l'appel découverte."],
["table", [
  ["Canal", "Statut à la signature", "Activé le (confirmé par courriel)"],
  ["Appels entrants", "☐ Actif", ""],
  ["SMS", "☐ Actif", ""],
  ["Agenda (Google / Outlook / Apple / autre)", "☐ Actif", ""],
  ["WhatsApp", "☐ Par phases", ""],
  ["Messages privés (Instagram / Facebook)", "☐ Par phases", ""],
  ["Briefings vocaux (appel sortant au Client)", "☐ Par phases", ""],
], { w: [42, 24, 34], header: true }],
["h", "4. Numéro de téléphone"],
["check", [
  "**(a) Transfert** de mon numéro existant : (____) ____-______  →  remplir l'Annexe C",
  "**(b) Nouveau numéro** fourni par AI Staff (indicatif souhaité : ______)",
  "**(c) Renvoi d'appel** de ma ligne existante vers le numéro de l'Adjointe",
]],
["sig", [
  { title: "AI Staff", lines: ["Par : Andrés Carreño"] },
  { title: "Le Client", lines: ["Par : ____________________________"] },
]],

// ---------------- Annexe B
["annex", "Annexe B · Entente de traitement des renseignements personnels", "Prestataire de services au sens de la Loi sur la protection des renseignements personnels dans le secteur privé (Québec)."],
["art", "Rôles et objet"],
["c", "Le Client est responsable des Renseignements personnels de ses propres clients. AI Staff les recueille, les utilise et les conserve **pour le compte du Client et uniquement selon ses instructions**, dans le seul but de fournir le Service."],
["c", "Catégories de personnes : clients et prospects du Client, personnes qui communiquent avec lui. Catégories de renseignements : nom, numéro de téléphone, courriel, contenu des appels et messages, enregistrements et transcriptions, rendez-vous, et tout autre renseignement que ces personnes choisissent de communiquer."],
["art", "Obligations d'AI Staff"],
["c", "N'utiliser les renseignements qu'aux fins du Service; ne pas les vendre, les louer ni les utiliser pour entraîner des modèles d'IA."],
["c", "Limiter l'accès aux seules personnes qui en ont besoin, tenues à la confidentialité."],
["c", "Mettre en place des mesures de sécurité raisonnables compte tenu de la sensibilité des renseignements : chiffrement en transit, séparation des données par client, contrôle et révocation des accès, aucune clé d'accès dans le code public."],
["c", "Encadrer chaque sous-traitant par une entente écrite offrant une protection équivalente. Liste actuelle : Twilio (téléphonie, SMS, reconnaissance et synthèse vocales), Anthropic (modèle de langage), Make.com (automatisations), Supabase (base de données), Resend (courriels), et Google si le Client connecte ces services. AI Staff avise le Client de tout ajout ou remplacement; le Client peut s'y opposer pour un motif raisonnable en résiliant sans frais."],
["c", "**Communication hors Québec.** Certains sous-traitants traitent des renseignements à l'extérieur du Québec (principalement aux États-Unis). AI Staff a réalisé une évaluation des facteurs relatifs à la vie privée et la remet au Client sur demande, pour l'aider à s'acquitter de ses propres obligations."],
["c", "**Incidents de confidentialité.** Aviser le Client **sans délai, et au plus tard dans les 72 heures**, de tout incident de confidentialité touchant ses renseignements; prendre les mesures raisonnables pour diminuer le risque de préjudice; fournir les informations nécessaires pour que le Client évalue le risque, tienne son registre et, s'il y a lieu, avise la Commission d'accès à l'information et les personnes concernées."],
["c", "Aider le Client, dans une mesure raisonnable, à répondre aux demandes d'accès, de rectification ou de retrait de consentement de ses clients, en lui transmettant sans délai toute demande reçue directement."],
["c", "À la fin du contrat, remettre ou permettre l'export des renseignements pendant 30 jours, puis les détruire de façon sécuritaire, sauf conservation exigée par la loi."],
["c", "Fournir au Client, sur demande raisonnable, l'information nécessaire pour démontrer le respect de la présente annexe."],
["art", "Obligations du Client"],
["c", "Informer ses clients, au moment de la collecte, qu'une assistante IA répond, que les communications peuvent être enregistrées et que les renseignements peuvent être traités par un prestataire, y compris à l'extérieur du Québec (par exemple dans sa propre politique de confidentialité)."],
["c", "Donner à AI Staff des instructions conformes à la loi et désigner la personne responsable de la protection des renseignements personnels de son entreprise : Nom : __________________  Courriel : __________________."],
["art", "Conservation des enregistrements"],
["c", "Sauf instruction écrite contraire du Client, les enregistrements et transcriptions sont conservés pendant la durée du contrat et accessibles dans le tableau de bord. Le Client peut demander une durée plus courte : ☐ 30 jours  ☐ 90 jours  ☐ 12 mois  ☐ Durée du contrat."],

// ---------------- Annexe C
["annex", "Annexe C · Autorisation de transfert de numéro", "À remplir seulement si le Client choisit l'option (a). Les renseignements doivent correspondre exactement à la facture du fournisseur actuel."],
["p", "Je, soussigné(e), autorise AI Staff et ses fournisseurs de télécommunications à agir en mon nom pour transférer le(s) numéro(s) ci-dessous vers leur réseau. Je confirme être le titulaire du compte ou être autorisé(e) à agir pour lui. Je comprends que le transfert peut mettre fin au service de mon fournisseur actuel pour ce(s) numéro(s) et que les frais ou engagements auprès de celui-ci demeurent ma responsabilité."],
["fields", [
  ["Numéro(s) à transférer", ""],
  ["Fournisseur actuel", ""],
  ["Nom du titulaire (tel que sur la facture)", ""],
  ["Adresse de service (telle que sur la facture)", ""],
  ["Numéro de compte", ""],
  ["NIP / code de transfert (si exigé)", "À transmettre seulement par téléphone à AI Staff, jamais par courriel non chiffré."],
  ["Date souhaitée", "(indicative, non garantie)"],
]],
["note", "Joindre une copie récente de la facture du fournisseur actuel (moins de 30 jours). Ne pas annuler le service actuel avant la confirmation du transfert."],
["sig", [
  { title: "Titulaire du compte", lines: ["Nom : ____________________________"] },
  { title: "Reçu par AI Staff", lines: ["Nom : ____________________________"] },
]],
];
build({ out: OUT, body, docTitle: "AI Staff — Contrat de service", short: "Contrat de service", footer: "Contrat de service AI Staff v1.0", artWord: "Article", pageWord: "page", initWord: "Initiales", sigWord: "Signature", dateWord: "Date" });
