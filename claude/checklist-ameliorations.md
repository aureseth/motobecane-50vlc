# Checklist de suivi — Guide Motobécane 50 VLC (AV7)

Mise à jour du 12 novembre 2026. Fichiers corrigés : `index.html`, `app.js`, `styles.css`, plus nouveaux `manifest.webmanifest`, `service-worker.js`, `icons/` (copies de travail — fichiers livrés à l'utilisateur à chaque étape terminée).

Légende : ✅ confirmé par une source · ⚠️ contradiction à corriger · ❓ non vérifié, ne pas laisser tel quel sans source · 🟢 corrigé dans le site

## Contexte retenu
- Usage : route. Monté : Dell'Orto SHA 15 (gicleur **68**, déclaré dans ton profil), rupteurs, pot « patate » d'origine, freins et pneus neufs. Modèle **50 VLC** (confirmé par toi).
- Priorités : fiabilité, confort, sécurité, puis légalité.
- Sources : 4 PDF du projet, recherche web, et désormais aussi des réponses d'autres assistants IA / extraits de forums que tu me transmets en pièce jointe — traités comme une source à évaluer, jamais comme une vérité automatique.
- **Les forums Motobécane (MCF, Tobec, MobCustom, Ventilxp) bloquent toujours mon accès direct.** Si tu as un compte sur l'un d'eux, c'est la meilleure piste pour combler les dernières zones grises (squish/culasse, pot d'échappement, couples de serrage, couple moteur, rapport de variateur réel, circonférence pneu exacte).
- `claude/questions-utilisateur.md` — fichier dédié pour les échanges de questions non bloquantes entre deux sessions. Tu peux y répondre à ton rythme ; je lis et applique en début de session suivante.

---

## A. Ce que la vérification a trouvé (par ordre de gravité) — TOUT TRAITÉ

### A1 à A12 : TERMINÉS (voir historique précédent — électricité/Zener, variateur, graissage, rupteurs, carburation, modifications risquées, pot/culasse, avance à l'allumage affinée, section Sources, graphique vitesse/couple, navigation mobile + 3 bugs corrigés).

### A13. 🟢 Nouveau le 12/11 — Site installable et utilisable hors ligne (PWA)
- Ajouté : `manifest.webmanifest` (nom, icônes, couleurs), un jeu d'icônes dans `icons/` (logo du site réutilisé, y compris une version « maskable » pour Android), et `service-worker.js` qui met en cache le site (HTML/CSS/JS/icônes) pour qu'il continue de fonctionner sans connexion.
- Un petit bandeau discret apparaît en bas de l'écran quand une nouvelle version du site est disponible, avec un bouton « Actualiser ».
- **Point important à connaître** : ça ne fonctionne PAS si tu ouvres juste le fichier `index.html` en double-cliquant dessus (ton navigateur bloque cette fonctionnalité sur un fichier local, par sécurité — ce n'est pas un bug du site). Pour que l'installation et le hors-ligne marchent vraiment, le site doit être servi via une adresse web (hébergement en ligne, ou même un serveur local pour tester). Si tu veux, je peux t'aider à héberger le site quelque part simplement (ex. GitHub Pages, Netlify — souvent gratuit) le jour où tu le souhaites — dis-le moi, je ne le ferai pas sans que tu me le demandes.
- Testé par mes soins en servant le site localement : installation, mise en cache, rechargement complet de la page avec le réseau coupé, et le bandeau de mise à jour — tout fonctionne comme prévu.

---

## B. Plan de travail (ordre accepté)

### Étape 1 — Bugs bloquants (code) — ✅ TERMINÉE
### Étape 2 — Sécurité et coûts — ✅ TERMINÉE
### Étape 3 — Chiffres et contradictions — ✅ TERMINÉE (A1 à A11 traités, section Sources + graphique vitesse/couple ajoutés)
### Étape 4 — Navigation et mobile — ✅ TERMINÉE (A12 : audit + 3 bugs corrigés)
### Étape 5 — PWA (hors ligne) — ✅ TERMINÉE (A13 : manifest + service worker + icônes, voir ci-dessus et l'avertissement sur l'hébergement)

### Étape 6 — Vérification finale
- [x] Vérifications faites au fil des étapes 3 à 5 (Playwright, 13 onglets, plusieurs largeurs d'écran, mode hors ligne) : aucune erreur, aucun débordement.
- [ ] Un dernier passage global peut être refait si tu ajoutes encore quelque chose, mais rien n'est bloquant à ce stade.

---

## D. Fonctionnalité : Profil Véhicule éditable — ✅ TERMINÉE
- Pilote le bandeau, le pied de page, le simulateur, le calculateur de galets, la carburation + Mécano IA, la Fiche Mémo, et le graphique vitesse/régime.

---

## C. Questions en attente
Aucune question bloquante en direct. Pour les questions non bloquantes, voir désormais `claude/questions-utilisateur.md`. Points à ta discrétion :
1. **Les 5 étapes prévues sont maintenant toutes terminées.** Le site a tout ce qui était initialement prévu (chiffres fiabilisés, navigation mobile, hors-ligne). Dis-moi s'il y a autre chose que tu veux ajouter, ou si tu veux qu'on héberge le site quelque part pour profiter du mode hors-ligne/installation.
2. Si tu as ou obtiens un accès aux forums MCF/TobecOnline, ou si tu peux me coller des extraits plus complets et cohérents entre eux (sur l'avance à l'allumage, le squish, le pot d'échappement, le couple moteur, le rapport de variateur réel ou la circonférence pneu), je peux revenir affiner ces points avec de meilleures sources — pas besoin de me le redemander explicitement, tu peux juste coller l'extrait quand tu l'as.
