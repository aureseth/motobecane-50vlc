# Référentiel Technique & Sécurité — Motobécane 50 VLC (AV7)

> **Lien architecture :** Ce fichier complète `CLAUDE.md` (qui régit le code, `currentProfile` et le simulateur `#speed-torque-canvas`).
> **Gestion des questions :** Toute nouvelle question technique non bloquante identifiée lors de l'utilisation de ce référentiel doit être ajoutée dans `claude/questions-utilisateur.md` (section « En attente »).

## 1. Profil Utilisateur, Sécurité & Hiérarchie des Sources
- **Utilisateur :** Mécanicien de niveau moyen à guider. Poser des questions si une info manque ; s'il ne sait pas répondre, rechercher puis proposer des options. Priorités : fiabilité, confort, sécurité (légalité traitée dans l'onglet `securite`).
- **Avertissements obligatoires :**
  - Toute opération dangereuse (freins, allumage, garnitures anciennes contenant potentiellement de l'amiante : **jamais de ponçage à sec**, masque FFP3).
  - Modification lourde ou coûteuse (ex. changement moteur) : vérifier freins et solidité du cadre, et rappeler l'interdiction de circuler sur la voie publique en cas de dépassement du cadre légal.
- **RÈGLE STRICTE — Zéro invention :** Ne jamais inventer un chiffre (couple, gicleur, cote, intervalle). Si non sourcé : écrire « ❓ non confirmé ». Distinguer systématiquement un **calcul pur** (formule, géométrie, cinématique : intégrable avec légende explicite) d'une **donnée empirique** non vérifiable.
- **Hiérarchie des sources :**
  1. **Documents primaires (font foi) :** `RTM spéciale cyclomoteurs (36 p.)`, `Le Vario MBK`, `Fiche des Mines PDF MCF`. Ils l'emportent sur tout document IA ou forum.
  2. **Documents d'autres IA / extraits de forums :** Hypothèses à évaluer, jamais des vérités. Croiser la cohérence interne avec les sources primaires et les valeurs déjà calculées sur le site. Une valeur identique entre deux documents IA déjà écartés = origine commune probable, pas une confirmation.
  3. **Certification :** Ne jamais étiqueter une valeur « Certifié Mines/RTM » sur la seule affirmation d'un document — vérifier directement dans le PDF source cité, sinon refuser explicitement et expliquer en direct.
- **Questions utilisateur :** Non bloquantes → `claude/questions-utilisateur.md`. Bloquantes (danger, coût important, choix irréversible) → en direct, groupées, avec une option recommandée.

## 2. Configuration Réelle de la Moto (50 VLC)
- **Identification & Usage :** Motobécane `50 VLC` (confirmé sur carte grise et plaque constructeur — « variateur, luxe, clignotant »), usage route.
- **Moteur & Carburation :** Carburateur Dell'Orto `SHA 15` (**gicleur 68**, relevé par l'utilisateur), allumage à rupteurs, pot d'origine, freins et pneus neufs.
- **Transmission & Variateur :** Pignon/couronne `11×54`, cage 3 galets F.D.V. `12×15` (montage à sec), masselottes d'embrayage Transval `36 g`, cage à aiguilles RSM `15×19×22.5`, courroie Hutchinson `822×14×8` (marquage réel à confirmer par l'utilisateur).
- **Éclairage & Signalisation (ampoules confirmées) :**
  - Phare avant : `6V 6W` (culot `E10`).
  - Feu arrière : `6V 4W` ou `1,8W` (`BA15S` ou `E10` selon cabochon).
  - Clignotants : `12V 21W` (`BA15S`).
  - Feu stop : `12V 21W` ou `4W` (`BA15S`).

## 3. Faits Techniques Validés (Ne Pas Contredire)

### Moteur, Cinématique & Simulateur
- **Cylindrée & Régimes :** Moteur AV7 `49,93 cm³` (alésage `39,0 mm` × course `41,8 mm`). **Couple max à `~3 000 tr/min`, puissance max à `~4 700 tr/min`** (Fiche des Mines). Aucune valeur en N·m n'est fiable (`3,04 N·m` / `2,94 N·m` des forums/IA = non vérifié) → jamais de courbe de couple chiffrée.
- **Poulies & Variateur :** Poulie réceptrice `207,5 mm`, diamètre primitif variateur `49,5 mm` (fermé) à `87,5 mm` (ouvert) selon RTM. Remplace l'ancien calcul `210 / 50–95 mm` (`4,20–2,21`).
- **Circonférence pneu `2 1/4 × 17` :** Le site utilise `1,76 m` ; le PDF MCF donne `1,665 m` sous charge → écart `~6 %` non résolu, à trancher.
- **Chaîne secondaire :** Flèche `~1 cm` (RTM), tolérée jusqu'à `1,5 cm` si étirée.

### Variateur, Embrayage & Couples de Serrage
- **Graisseur de vilebrequin :** Situé en bout de vilebrequin, à retirer **avant** d'extraire le tambour avec une **clé à pipe de `6 mm`** (filetage `4×75` avant fin 1976, `5×80` après).
- **Ordre de démontage du variateur :**
  1. Tambour d'embrayage : **clé à pipe de `14 mm`**, pas à droite (après retrait du graisseur).
  2. Circlips et rondelles de calage.
  3. Écrou de joue fixe : **pas à gauche** (desserrage sens **HORAIRE**), **clé à œil ou plate de `35 mm`** (jamais une douille).
  4. Joue fixe : **pas à droite** (filetage classique).
  5. Billes ou galets (galets F.D.V. montés **à sec**).
- **Blocage du canon de variateur :** Outil-support d'origine réf. `1322` (serré à l'étau) ou alternative maison : deux boulons `M8` dans les trous de fixation serrés à l'étau.
- **Rotor du volant magnétique :** **Pas à gauche**, **clé carrée mâle de `10 mm`**, couple **`5 m.kg` (`≈ 49 N·m`)** (RTM).
- **Couples RTM confirmés :** Culasse **`1,2 m.kg` (`≈ 11,8 N·m`)** en croix ; pipe d'admission **`1 m.kg` (`≈ 9,8 N·m`)**.
- **Couples non sourcés :** Écrou de variateur, écrou d'embrayage, collerette d'échappement, collier de carburateur → indiquer un serrage ferme raisonnable, sans valeur chiffrée inventée.

### Allumage, Carburation & Mélange
- **Avance à l'allumage :** Valeur constructeur **`2 mm` avant PMH** (RTM). Protocole du site : démarrer à `1,8 mm` et ajuster entre `1,7` et `2 mm` selon comportement (piste plausible pour SHA 15 + carburant moderne, non confirmée). Ne pas descendre à `1,5 mm` (valeur d'infographie IA erronée pour l'AV7).
- **Rupteurs :** Écartement **`0,35 mm`** (RTM).
- **Bougie & Antiparasite :** Bougie **NGK B6HS**, écartement électrodes **`0,6 mm`** (RTM — ne pas confondre avec les rupteurs) ; antiparasite **NGK LB05E** (`0,3–0,4 mm`) ; clé à bougie de `21 mm`.
- **Gicleur :** Pas de chiffre universel → relever l'existant (`68` sur le SHA 15 actuel), varier d'un seul cran à la fois, relire la bougie. Gain de section `Ø12 → Ø15` : `+56 %` (calcul géométrique pur, pas une mesure de puissance).
- **Mélange & Carburant :** Huile 100 % synthèse moderne **`2–3 %`** (PDF MCF), `3 %` en rodage ; huile minérale d'époque **`5 %`** (RTM, BP Zoom) ; `1,5 %` = risque de serrage. `SP98` conseillé (protection des joints anciens contre l'éthanol).

### Électricité & Réglementation
- **Circuits électriques :** Circuit `6V` éclairage régulé par diode Zener ; circuit `12V` clignotants indépendant (**sans Zener**). Test pratique de la Zener : **`6,5–8 V` entre `3 000` et `4 500 tr/min`** (tension d'écrêtage exacte non confirmée). La bobine d'allumage possède une masse externe via le circuit d'éclairage : ne pas tout débrancher sans schéma exact (info N° 10133).
- **Cadre légal (novembre 2026) :** Catégorie `L1e` (`50 cm³`, `4 kW`, vitesse homologuée `44–45 km/h`). Permis AM obligatoire pour les personnes nées à partir de 1988. Contrôle technique 2 roues en vigueur depuis le 1er mars 2026 (céléromètre, `50–80 €`). Débridage : amende de `135 €` et déchéance de garantie d'assurance.

## 4. Zones Grises (Ne Jamais Présenter Comme Données Constructeur)
- **Cotes non sourcées :** Squish de culasse AV7 (fourchette généraliste 2T `1,0–1,4/1,5 mm` mentionnée à titre indicatif uniquement), modifications du pot d'échappement (`-15 mm`, trous `Ø5 mm`, gain `+3–5 km/h`) et rabotage/pistes de culasse → présenter uniquement comme pratiques courantes non confirmées, par petits incréments, en signalant le caractère irréversible.
- **Recherches épuisées :** Ne pas relancer de recherche web ou PDF sur le squish, le pot, les couples manquants ou la valeur N·m du couple moteur tant qu'une nouvelle source primaire ou un extrait de forum exploitable n'est pas fourni.
