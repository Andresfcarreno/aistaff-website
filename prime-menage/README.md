# Prime Ménage — site web

Site statique bilingue (FR/EN), sans build : `index.html` + `styles.css` + `app.js` + `assets/`.

## À modifier avant la mise en ligne

- **Téléphone / WhatsApp** : objet `CONFIG` en haut de `app.js` (les numéros actuels sont des placeholders).
- **Prix** : objet `PRICING` dans `app.js` — base 85 $ + 35 $/chambre + 25 $/salle de bain + 30 $ maison,
  minimum 140 $, multiplicateurs par service (fin de bail ×1,5, après-réno ×2,1, etc.), rabais de fréquence.
- **Témoignages** : ce sont des exemples (section `.reviews` dans `index.html`) — remplacez-les par de vrais avis.
- **Chiffres du « Standard Prime »** (72 points, 40 h de formation, garantie 24 h) : ajustez-les à la réalité.

## Déploiement (Netlify, glisser-déposer)

Glissez le dossier `prime-menage/` complet (pas seulement `index.html`) dans l'onglet **Deploys** du projet Netlify.
