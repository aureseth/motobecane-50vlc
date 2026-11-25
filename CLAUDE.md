# CLAUDE.md — Guide Motobécane 50 VLC (moteur AV7)

> **Dernière mise à jour :** 25/11/2026
> **Démarrage de session (ordre strict) :**
> 1. Lire `claude/questions-utilisateur.md` : appliquer les réponses de la section « En attente », puis les déplacer vers « Journal » (`- [JJ/MM/AAAA] question : action`).
> 2. Lire `claude/checklist-ameliorations.md` pour l'état du chantier en cours (notamment `claude/audit-web-review-24-11-2026.md`).
> 3. **Appel référentiel mécanique :** Pour toute tâche touchant au contenu technique, aux réglages, au simulateur ou aux sources, charger impérativement `claude/faits-techniques-av7.md` (`@claude/faits-techniques-av7.md`).

## 1. Architecture & Contraintes Code
- **Stack :** Site statique pur (`index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `service-worker.js`, `icons/`). Zéro build, zéro framework. Déployé sur GitHub Pages (`aureseth.github.io/motobecane-50vlc/` — non vérifiable depuis le bac à sable, demander à l'utilisateur).
- **Navigation (16 onglets `data-tab`) :** `overview`, `securite`, `glossaire`, `diagnostic`, `tutos`, `atelier`, `variateur`, `embrayage`, `carburation`, `melangeur`, `electricite`, `sleeper`, `simulateur`, `carnet`, `references`, `archives` (5 groupes : Démarrer / Je répare / Je règle / J'améliore / Suivi & achats).
- **RÈGLE STRICTE — Stockage :** Toujours passer par le wrapper `store` (try/catch) dans `app.js`. Jamais d'appel direct à `localStorage`.
- **RÈGLE STRICTE — Thème sombre :** Toujours cibler `body.theme-dark` (jamais `data-theme`). Vérifier via `Grep` avant tout ajout CSS.
- **Profil Véhicule (`currentProfile`, clé `motobecane_50vcl_vehicle_profile`) :** Pilote bandeau, pied de page, simulateur, calculateur de galets, mentions du gicleur (Carburation + Mécano IA) et Fiche Mémo. Toute valeur véhicule affichée doit lire `currentProfile` (jamais de chiffre en dur). Déclarer les variables partagées en tête d'`app.js` (`galetsProfileMin/Max`, `transmissionProfileLabel`, `transmissionProfileRatio`) pour éviter toute *temporal dead zone* au chargement.
- **Simulateur (`#speed-torque-canvas`, `drawSpeedTorqueChart()`) :**
  - Constantes RTM uniques : `PULLEY_DIAM_MM = 207.5`, `VARIO_MIN_MM = 49.5`, `VARIO_MAX_MM = 87.5`, fonction partagée `speedAtVarioPct()`.
  - Mode « Auto variateur » : modèle centrifuge billes (`varioPercentFromRPM()`, `F ∝ m·ω²`, simplifié, avertissement affiché).
  - Graphique : vitesse = cinématique fiable ; couple = courbe qualitative **sans unité** (pic `3 000 tr/min`, repères `3 000 / 4 700 / 6 000`). Redessiner au clic sur l'onglet (un canvas masqué vaut `0×0`).
- **Composants & Accessibilité :**
  - Tutoriels (6) : handler générique `.tuto-pill-btn[data-tuto]` et cases `data-tuto-task` (ne pas ajouter de code spécifique par tuto).
  - Références : budget lu uniquement depuis `.ref-card` (jamais `.ref-table-row` → double comptage), aucun prix dupliqué.
  - Carnet : kilométrage, rappels et entrées datées 100 % saisis par l'utilisateur (aucun intervalle inventé).
  - Export PDF : `window.print()` + `@media print` uniquement.
  - Accessibilité : modales via `openModalWithFocusTrap` (`role="dialog"`, `aria-modal`), `skip-link`, canvas `role="img"`.
  - Archives : mettre à jour « Sources et Niveau de Confiance » à chaque ajout ou correction de source.

## 2. Workflow, Pièges Connus & Tests
- **Économie de tokens :** Ne jamais lire les 3 gros fichiers en entier (`index.html` ~385 Ko). Toujours `Grep` sur un mot-clé → `Read` (offset/limit) → `Edit` ciblé.
- **Cache & Sources externes :** Réutiliser les rendus PDF déjà extraits dans le scratchpad (`img/`, `ocr/`). Forums MCF/Tobec/MobCustom/Ventilxp bloqués (ne pas relancer `WebFetch`). Liens Gemini : demander le texte collé à l'utilisateur.
- **Projet claude.ai :** `project_delete` peut supprimer la mauvaise entrée en cas de doublon de chemin → sauvegarder avant suppression.
- **Pièges CSS/JS :**
  - Calques `position:fixed` masqués (`.nav-overlay`) : exiger `pointer-events:none` au repos.
  - Enfants directs de grilles CSS : ajouter `min-width:0` pour éviter le débordement horizontal mobile.
  - Modales (`.memo-modal-card`) : conserver `max-height` + `overflow-y:auto` sur petits écrans.
  - Playwright : attendre `500–1000 ms` après le clic burger ; capturer un `data-*` stable plutôt que réutiliser `locator().first()` sur une liste qui se re-rend.
- **PWA & Validation fin de lot (une seule passe globale) :**
  - `CACHE_VERSION` actuel : `'v17'` (`skipWaiting()` uniquement dans le handler `message` du bandeau `#pwa-update-banner`). Incrémenter à chaque évolution notable.
  - Serveur local obligatoire (SW bloqué en `file://`) : `python3 -m http.server 8080 &` → balance div/p + `node --check app.js` → smoke test Playwright (`320/375/414/768/1280 px`, 16 onglets × 2 thèmes, `context.setOffline(true)`, audit axe-core depuis le scratchpad) → `pkill -f "http.server 8080"`.
- **Clôture de lot :** Mettre à jour `claude/checklist-ameliorations.md` (et la date en tête de `CLAUDE.md` si une règle permanente change).
