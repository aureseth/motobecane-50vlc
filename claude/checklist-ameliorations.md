# Checklist de suivi — Guide Motobécane 50 VLC (AV7)

Version du 7 novembre 2026. À cocher au fil du travail.

Légende : ✅ confirmé par une source · ⚠️ contradiction à corriger · ❓ non vérifié, ne pas laisser tel quel sans source

## Contexte retenu
- Usage : route. Monté : SHA 15, rupteurs, pot « patate » d'origine, freins et pneus neufs.
- Priorités : fiabilité, confort, sécurité, puis légalité (légalité mise de côté dans cette analyse, comme demandé).
- Sources : les 3 PDF du projet (lus par OCR) et une recherche web. **Les forums Motobécane (MCF, Tobec, Mobcustom, Ventilxp) bloquent mon accès** : tout ce qui dépend d'eux reste ❓.
- Réserve : « L'Énigme électrique » et « Manuel de Restauration » sont des infographies générées (pied de page « Gemini Notebook »). Elles sont utiles mais pas officielles. L'article « le vario MBK » est une vraie page de magazine (variateur MBK 51 à billes, proche mais pas identique à la 50 VLC).

---

## A. Ce que la vérification a trouvé (par ordre de gravité)

### A1. ⚠️ Électricité : l'onglet du site contredit tes PDF (sécurité + fiabilité)
| Le site dit | Tes PDF disent |
|---|---|
| Volant « Novi » qui fait du 12 V pour les clignotants ; la Zener protège des ampoules 12 V 21 W | Éclairage en **6 V** ; la Zener écrête les surtensions du circuit 6 V ; les clignotants ont **leur propre bobine 12 V indépendante** |
| « Débranchez formellement la Zener » (conversion Moryama) | Test de régulation : moteur entre 3 000 et 4 500 tr/min, la tension doit se stabiliser **entre 6,5 V et 8 V**. Au-delà, la Zener est HS et les ampoules grillent |
| Pas de notion de boucle de masse | Sur la VLC, la bobine d'allumage a une **masse externe** : le courant doit traverser les ampoules ou le commutateur pour revenir à la masse du cadre. **Pas de boucle = pas d'étincelle** |
| Rien sur le feu stop | Contacteur de stop **3 fils**. De jour, phares éteints, **ampoule de stop grillée + freinage = le moteur cale** |

À faire sur le site :
- [ ] Réécrire l'onglet Électricité (schémas, avertissement Zener, ampoules 6 V, test 6,5–8 V, boucle de masse, contacteur 3 fils).
- [ ] Corriger les cartes « Ampoules qui grillent », « Clignotants fixes » et « Cale quand on allume le phare » (onglet Diagnostic et Mécano).
- [ ] Ajouter la **matrice de diagnostic rapide** (PDF Énigme, p. 13) : relier la sortie 6 V jaune à la masse du moteur. Si ça démarre, le défaut est dans le faisceau externe ; sinon, il est dans le moteur.
- [ ] Mettre un **avertissement** : ne rien débrancher ni modifier avant d'avoir le schéma exact de TON faisceau (le PDF cite l'« Information N° 10133 »).
- [ ] Retirer ou différer le contenu Moryama : tu as gardé les rupteurs, et la conversion 12 V n'est pas validée par tes PDF.
- ❓ Vérifier sur la moto : puissance de l'ampoule de phare (un PDF dit 6 V 15 W, un autre 6 V 6 W) et ampoules arrière (6 V 2–4 W).

### A2. ⚠️ Démontage du variateur (tutoriel 1) : sens de filetage et outils
| Le site dit | Tes PDF disent |
|---|---|
| Écrou « M10 », clé de 14, **sens anti-horaire**, « pas à droite » | **Écrou de joue fixe = pas à gauche : on desserre dans le sens horaire**. La joue fixe elle-même est à pas à droite. Douille de **35 mm** (le manuel dit « écrou de 35 mm ») |
| Arrache « 24x100 » sur le variateur | L'article : on dépose d'abord le **tambour d'embrayage** (bloquer le moteur, retirer le graisseur, extracteur), puis circlips et rondelles de calage, puis le variateur |
| Couple « 3,8 m.daN » | Aucune valeur dans les sources lues → ❓ |

- [ ] Réécrire le tutoriel 1 dans l'ordre : embrayage → circlips et rondelles → variateur → écrou de joue fixe (pas à gauche).
- [ ] Ajouter un avertissement : forcer dans le mauvais sens abîme l'outil et le filetage.
- [ ] Noter l'astuce « maison » du manuel : deux vis dans l'étau, ou une clé à chaîne, pour bloquer le canon.
- [ ] Supprimer les couples non sourcés (M10 3,8 m.daN, M32 3,2 m.daN, etc.) ou les marquer « à confirmer au manuel d'atelier ».
- Le web confirme seulement que des douilles de 35 et 36 mm existent pour cet écrou (selon les catalogues lamobylette.net et AV88&Cie). Vérifier laquelle va sur ta pièce.

### A3. ⚠️ « Montage à sec » du variateur : en contradiction avec tes sources
- Le site répète plusieurs fois « jamais de graisse » (onglet Variateur, tutoriel 1, fiche 18362A, mémo). L'article MBK dit de graisser la cage à aiguilles et les rampes de la joue mobile au remontage (variateur à billes). Le manuel dit de passer par le graisseur du vilebrequin.
- Pour **ta cage à galets F.D.V.**, je n'ai trouvé aucune notice. C'est une décision qui peut coûter cher (patinage ou usure).
- [ ] Question pour toi : as-tu la notice du vendeur de la cage 18362A / des galets M60 ? Sinon on écrit : « suivre la notice du fabricant ; en tout cas, jamais de graisse sur les flancs de joues ni sur la courroie ».

### A4. ✅ Allumage à rupteurs : à compléter (utile pour ta moto)
- ✅ Avance **1,5 mm avant le PMH** (confirmé par le manuel).
- ❓ Manquant sur le site : **écartement des rupteurs 0,35 mm** (manuel, p. 11 et 14), méthode de la pige, **papier à cigarette** pour caler la came, serrage de la came.
- [ ] Ajouter le tutoriel « Rupteurs + calage 1,5 mm » en 3 phases (écartement, point mort haut, papier à cigarette) + checklist finale.
- [ ] Ajouter la mention « un condensateur fatigué = panne des 10 minutes » avec le test d'étincelle, sans pourcentage de certitude.

### A5. ❓ Carburation : deux affirmations clés non vérifiées
- Le site affirme que l'AV7 n'a pas de clapets (admission par la jupe du piston) et que tout gicleur **≥ 68 est « strictement trop riche »**, avec **62 comme cible**. Je n'ai pas pu le confirmer : les forums bloquent l'accès. Une infographie de ton manuel écrit même « admission par clapets » sur sa couverture, donc elle contredit le site. Ce PDF est peu fiable, mais le doute est réel.
- Risque : un gicleur trop petit appauvrit le mélange et peut serrer le moteur.
- [ ] Remplacer « cible 62 » par un protocole prudent : partir plus riche, réduire par lecture de bougie, sans promettre de chiffre unique.
- [ ] Remplacer « ≥ 68 strictement trop riche » par « à ne monter que si la bougie le justifie ».
- [ ] À faire par toi si possible : relever le gicleur actuellement monté dans ton SHA 15 et la référence gravée sur le carburateur.
- [ ] Corriger le texte « blanche = montez de 2 à 4 points » par « montez d'un cran à la fois et vérifiez la prise d'air avant ».

### A6. ⚠️ Modifications irréversibles ou risquées à encadrer
- [ ] Rabotage de culasse : retirer « sans aucun risque pour le bas-moteur », « couple décuplé », « +15 % » ; ajouter les risques (cliquetis, serrage), la vérification au fil d'étain et un avertissement coût.
- [ ] Raccourcir le tube de fuite du pot, percer des trous Ø 5 mm, **chauffer la chicane au chalumeau** : irréversibles. Retirer « +3 à +5 km/h » et « 20 % plus vite », qui n'ont pas de source. Ajouter un avertissement feu et essence.
- [ ] Limer la jupe du piston de 1,5 mm : irréversible, chiffre non sourcé, avertissement coût.
- [ ] « Stop carburation » : retirer « débrayer » (pas de levier d'embrayage) et « couper le décompresseur ». Ajouter : terrain privé, casque, gants.
- [ ] Les garnitures d'embrayage et de frein anciennes peuvent contenir de l'amiante : pas de ponçage à sec, masque FFP3, humidifier.

### A7. ❓ Autres chiffres à sourcer ou retirer
- [ ] Remplacer « Certitude 98 % » du « Mécano IA » : c'est un filtre par mots-clés. Renommer en « Assistant de diagnostic » et supprimer les pourcentages.
- [ ] Supprimer « Fiabilité 4,9/5 », « Livraison 48 h », « Qualité aérospatiale », « 100 % compatibilité garantie ».
- [ ] SP98 « exclusivement » : l'éthanol est un vrai sujet pour les joints anciens, mais « vaporise à 78 °C » et « mortel » sont exagérés. Reformuler et sourcer.
- [ ] Dosage 2 % : à confirmer avec la fiche de l'huile choisie. Garder 3 % pour le rodage.
- [ ] Fiche des Mines : le site affiche des numéros et un tampon « PV N° 45.892 ». Marquer clairement « document de synthèse non officiel ».
- [ ] « Plage de rendement 5 000–6 200 tr/min », « 11x54 = +9 % de couple » : à confirmer ou présenter comme estimation.
- [ ] Nom du modèle : « VCL » sur le site, « VLC » dans le projet et tes PDF. Harmoniser (à vérifier sur la plaque ou la carte grise).

---

## B. Plan de travail (ordre accepté)

### Étape 1 — Bugs bloquants (code)
- [ ] Tutoriels 2 à 5 inaccessibles : aucun code pour les boutons `.tuto-pill-btn`.
- [ ] Cases « Étape réalisée » sans effet (pas de sauvegarde, la carte ne passe jamais en « terminé »).
- [ ] Flèches des schémas absentes : `marker-end="url(#arrow)"` sans définition du marqueur.
- [ ] Formule `\(F = m \cdot \omega^2 \cdot r\)` affichée en code brut : écrire F = m × ω² × r.
- [ ] CSS : `--transition-fast` non définie ; classes manquantes `.btn-primary`, `.btn-xs`, `.w-100`, `.mt-2`, `.text-orange`, `.text-xs`.
- [ ] Mode sombre : `--motobecane-blue` devient blanc, donc texte blanc sur fond blanc (boutons actifs, menu mobile).
- [ ] Impression : « Imprimer » sort tous les onglets ; « Imprimer ce mémo » imprime tout le guide.
- [ ] Compteurs du catalogue : transmission (7 → 8), outillage (2 → 3), « 88,10 € déjà acheté » → **110,00 €** (8 pièces). Badge « 8 composants identifiés » pour 5 lignes.
- [ ] Bécher du mélangeur : graduations 150/100/50 mL non alignées sur le niveau.
- [ ] Recherche rapide : sans gestion des accents, sans message « rien trouvé », « variateur » absent des mots-clés.
- [ ] `localStorage` sans `try/catch` (plante en navigation privée).
- [ ] Règles responsive qui visent des classes inexistantes (`.sim-grid`, `.speed-gauge-row`, `.memo-modal-box`, etc.).

### Étape 2 — Sécurité et coûts
- [ ] Badge de risque par opération (sécurité, coût, réversible ou non).
- [ ] Page « Règles d'or d'atelier » : lunettes, gants, extincteur, ventilation, moto stable, bougie débranchée.
- [ ] Alerte vitesse dans le simulateur et le calculateur de galets (freins, pneus, cadre, transmission).
- [ ] Encadré « Avant de continuer » pour les opérations lourdes (moteur, cylindre, piston).
- [ ] Amiante, essence et feu, électricité (fusible, pas de moteur sans régulation).

### Étape 3 — Chiffres et contradictions
- [ ] Tout le bloc A ci-dessus.
- [ ] Vitesses : 11×56 « bridé à 45 km/h » dans la vue d'ensemble contre 56,3 km/h dans le simulateur.
- [ ] Galets « 15x12 » ou « 12x15 » selon les pages.
- [ ] Mélange : « jamais l'huile directement dans le réservoir » contre « versez d'abord l'huile » (fiche éprouvette).
- [ ] Ajouter une section « Sources et niveau de confiance ».

### Étape 4 — Navigation et mobile
- [ ] Regrouper les 13 onglets en 4 ou 5 familles.
- [ ] Navigation par URL (`#tab-…`), glossaire, `<h1>`, ARIA des onglets, schéma accessible au clavier.
- [ ] Revoir les points de rupture mobiles.

### Étape 5 — PWA (hors ligne)
- [ ] Manifest, service worker, polices en local, mode atelier (écran allumé, gros boutons).

### Étape 6 — Vérification finale
- [ ] Ouvrir chaque onglet (bureau et mobile), console sans erreur, calculs refaits, liens marchands testés.

---

## C. Questions pour toi
1. Peux-tu **rattacher `index.html`, `app.js` et `styles.css`** dans la conversation ? Mon espace de travail n'a pas de copie du site, donc je ne peux pas encore les modifier proprement.
2. Ta moto a-t-elle bien des **clignotants** ? Quelles ampoules de phare et de feu arrière (valeurs inscrites sur les culots) ?
3. As-tu une **notice** de la cage à galets F.D.V. (vendeur) ?
4. Quel **gicleur** est monté dans ton SHA 15 aujourd'hui ?
5. Sais-tu si ta moto a un **graisseur** en bout de vilebrequin ?
