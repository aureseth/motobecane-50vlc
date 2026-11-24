/**
 * ===================================================================
 * APPLICATION INTERACTIVE - MOTOBÉCANE 50 VLC (MOTEUR AV7)
 * ===================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  /* Accès sécurisé au stockage local (peut échouer en navigation privée ou si bloqué) */
  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, val) { try { localStorage.setItem(key, val); } catch (e) { /* ignoré */ } },
    remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignoré */ } }
  };

  /* Valeurs du Profil Véhicule partagées entre calculateurs (voir section 5c plus bas).
   * Déclarées ici avec des valeurs par défaut sûres pour être utilisables dès le premier
   * rendu du calculateur de galets (section 2), avant que le profil ne soit chargé. */
  let galetsProfileMin = 5.4;
  let galetsProfileMax = 5.6;
  let transmissionProfileRatio = 54 / 11;
  let transmissionProfileLabel = '11x54';

  /* -----------------------------------------------------------------
   * CONSTANTES CINÉMATIQUES RTM — Motobécane 50V (Pantin)
   * Source : Revue Technique Motocycliste d'époque
   * Déclarées ici une seule fois pour éviter toute dérive silencieuse
   * entre updateSpeedSimulation() et drawSpeedTorqueChart().
   * ----------------------------------------------------------------- */
  const PULLEY_DIAM_MM = 207.5;  // diamètre effectif d'enroulement, poulie motrice
  const VARIO_MIN_MM   = 49.5;   // diamètre primitif variateur gorge fermée (vario 0%)
  const VARIO_MAX_MM   = 87.5;   // diamètre primitif variateur joues sorties (vario 100%)

  /**
   * Calcule la vitesse sol (km/h) pour un régime, une position de variateur,
   * un rapport secondaire et une circonférence de pneu donnés.
   * Fonction partagée entre updateSpeedSimulation() et drawSpeedTorqueChart()
   * pour garantir l'unicité de la cinématique (source RTM).
   */
  function speedAtVarioPct(rpm, varioPct, transRatioArg, tireCircArg) {
    const dVario = VARIO_MIN_MM + (varioPct / 100) * (VARIO_MAX_MM - VARIO_MIN_MM);
    const primaryRatio = PULLEY_DIAM_MM / dVario;
    const totalRatio = primaryRatio * transRatioArg;
    const wheelRpm = rpm / totalRatio;
    return (wheelRpm * tireCircArg * 60) / 1000;
  }

  /* -----------------------------------------------------------------
   * 1. GESTION DES ONGLETS (NAVIGATION)
   * ----------------------------------------------------------------- */
  const navButtons = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTabId = button.getAttribute('data-tab');

      // Update button states
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Centrer en douceur le bouton actif dans le carrousel d'onglets
      button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

      // Update tab panes
      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === targetTabId) {
          pane.classList.add('active');
        }
      });

      // N'ajuster le défilement que si l'utilisateur est descendu plus bas que le haut du contenu
      const mainContent = document.querySelector('.main-content');
      if (mainContent && window.scrollY > mainContent.offsetTop - 30) {
        window.scrollTo({
          top: mainContent.offsetTop - 85,
          behavior: 'smooth'
        });
      }
    });
  });

  /* -----------------------------------------------------------------
   * 2. CALCULATEUR INTERACTIF DE POIDS DE GALETS
   * ----------------------------------------------------------------- */
  const weightSlider = document.getElementById('calc-weight');
  const weightValueLabel = document.getElementById('val-weight');
  const reliefSelect = document.getElementById('calc-relief');
  const engineSelect = document.getElementById('calc-engine');

  const resultSingle = document.getElementById('recommended-roller-weight');
  const resultTotal = document.getElementById('recommended-total-weight');
  const adviceText = document.getElementById('roller-advice-text');

  function calculateRollerWeight() {
    const riderWeight = parseInt(weightSlider.value, 10);
    weightValueLabel.textContent = `${riderWeight} kg`;

    const relief = reliefSelect.value;
    const engine = engineSelect.value;

    // Base weight = centre de la fourchette cible de votre Profil Véhicule
    // (par défaut 5,4-5,6g pour 11x54 ; remplacé si vous modifiez votre profil)
    const profileCenter = (galetsProfileMin + galetsProfileMax) / 2;
    let weight = profileCenter;

    // Rider weight adjustment
    if (riderWeight > 90) {
      weight -= 0.3; // slightly lighter to help climb
    } else if (riderWeight < 65) {
      weight += 0.2; // can pull a slightly heavier roller
    }

    // Terrain adjustment
    if (relief === 'vallonne') {
      weight -= 0.3;
    } else if (relief === 'plat') {
      weight += 0.2;
    }

    // Engine prep adjustment
    if (engine === 'stock') {
      weight += 0.3; // stock AV7 has very low peak RPM, needs to close earlier
    } else if (engine === 'kit') {
      weight -= 0.3; // prepared engine revs higher
    }

    // Clamp dans une plage raisonnable autour du centre de votre profil
    weight = Math.max(profileCenter - 0.7, Math.min(profileCenter + 0.7, weight));
    const singleWeightStr = weight.toFixed(1);
    const totalWeightStr = (weight * 3).toFixed(1);

    resultSingle.textContent = `${singleWeightStr} g`;
    resultTotal.textContent = `${totalWeightStr} g`;

    // Dynamic advice
    if (weight <= profileCenter - 0.5) {
      adviceText.textContent = `Réglage orienté nervosité et fortes côtes. Idéal pour pilote lourd ou trajets de montagne. Veillez à ce que le variateur s'ouvre à fond en descente.`;
    } else if (weight >= profileCenter + 0.3) {
      adviceText.textContent = `Réglage axé sur le couple bas et la vitesse de pointe sur le plat. Le moteur tourne à bas régime, très économique et feutré.`;
    } else {
      adviceText.textContent = `LE "SWEET SPOT" AV7 : Compromis entre vivacité au feu rouge, maintien de la vitesse en faux-plat et allonge en pointe — pour votre transmission ${transmissionProfileLabel} déclarée dans le Profil Véhicule.`;
    }
  }

  if (weightSlider && reliefSelect && engineSelect) {
    weightSlider.addEventListener('input', calculateRollerWeight);
    reliefSelect.addEventListener('change', calculateRollerWeight);
    engineSelect.addEventListener('change', calculateRollerWeight);
    calculateRollerWeight();
  }

  /* -----------------------------------------------------------------
   * 3. SCHÉMA DIDACTIQUE INTERACTIF DU VARIATEUR (SVG)
   * ----------------------------------------------------------------- */
  const schematicParts = document.querySelectorAll('.schematic-part');
  const infoTitle = document.getElementById('info-title');
  const infoDesc = document.getElementById('info-desc');

  const partDetails = {
    'canon': {
      title: 'Canon de Variateur (Arbre de transmission)',
      desc: 'Pièce rectifiée montée sur le vilebrequin. Doit être exempte de rayures. Nettoyer méticuleusement avant repose. L\'écrou de joue fixe est à pas à gauche (desserrage dans le sens horaire) — couple de serrage non confirmé par mes sources, à défaut du manuel d\'atelier serrez fermement à la douille de 35 mm.'
    },
    'aiguilles': {
      title: 'Cage à Aiguilles RSM (15 x 19 x 22.5 mm)',
      desc: 'Assure la rotation libre du tambour d\'embrayage au ralenti. À garnir de graisse lithium haute température lors du montage.'
    },
    'joue-fixe': {
      title: 'Joue Fixe de Variateur',
      desc: 'Flasque métallique immobile. Vérifier la planéité et l\'absence de calamine ou de sillons creusés par d\'anciennes courroies.'
    },
    'courroie': {
      title: 'Courroie Crantée Hutchinson (822 x 14 x 8 mm)',
      desc: 'Largeur 14 mm calibrée. Au repos, elle descend au fond de la gorge. En pleine variation, elle doit affleurer le sommet extérieur des joues.'
    },
    'joue-mobile': {
      title: 'Joue Mobile',
      desc: 'Coulisse le long du canon sous la poussée centrifuge des 3 galets. Vérifier l\'état des colonnettes de guidage.'
    },
    'cage-galets': {
      title: 'Cage à 3 Galets Mobymatic (F.D.V. Bleus 12x15)',
      desc: 'Remplace les 4 billes d\'origine. Montage impérativement À SEC (sans graisse classique). Poids recommandé : 5,5g par galet.'
    },
    'fermeture': {
      title: 'Coupelle d\'arrêt & Circlip de fermeture',
      desc: 'Assure le maintien de la cage. Veillez à ce que le circlip soit bien encliqueté dans sa gorge (écoutez le "clic" franc !).'
    },
    'cloche': {
      title: 'Tambour Dimoby & Masselottes Allégées 36g',
      desc: 'Embrayage centrifuge d\'accroche moteur. Déglacer le tambour au papier grain 120 et toiler les garnitures 36g. Collage vers 3 000 tr/min.'
    }
  };

  schematicParts.forEach(part => {
    part.addEventListener('mouseenter', () => {
      const partKey = part.getAttribute('data-part');
      if (partDetails[partKey]) {
        infoTitle.textContent = partDetails[partKey].title;
        infoDesc.textContent = partDetails[partKey].desc;
      }
    });

    part.addEventListener('click', () => {
      const partKey = part.getAttribute('data-part');
      if (partDetails[partKey]) {
        infoTitle.textContent = partDetails[partKey].title;
        infoDesc.textContent = partDetails[partKey].desc;
      }
    });
  });

  /* -----------------------------------------------------------------
   * 4. DIAGNOSTIC BOUGIE & ARRÊT CARBURATION
   * ----------------------------------------------------------------- */
  const plugButtons = document.querySelectorAll('.plug-btn');
  const diagBadge = document.getElementById('diag-badge');
  const diagTitle = document.getElementById('diag-title');
  const diagText = document.getElementById('diag-text');
  const diagActionText = document.getElementById('diag-action-text');
  const diagCard = document.getElementById('plug-diagnosis-card');

  const plugDiagnostics = {
    'chocolat': {
      badge: 'Mélange Idéal',
      badgeClass: 'status-ok',
      borderStyle: '#16A34A',
      title: 'Combustion Optimale (Marron Chocolat au Lait)',
      text: 'La céramique de l\'électrode présente une couleur café au lait / brique. Le ratio stœchiométrique air/essence est idéal.',
      action: 'Conservez le gicleur actuellement monté : ne changez rien.'
    },
    'blanche': {
      badge: 'DANGER IMMINENT',
      badgeClass: 'status-danger',
      borderStyle: '#DC2626',
      title: 'Carburation Trop Pauvre (Blanche / Sèche)',
      text: 'Mélange pauvre en essence ou prise d\'air (pipe, joints spys). Risque de surchauffe et de SERRAGE MOTEUR en pleine charge !',
      action: 'Montez d\'UN SEUL cran de gicleur dans votre boîte Polini par rapport à celui actuellement monté, puis refaites un essai avant de remonter davantage. Vérifiez aussi l\'étanchéité du carbu sur la pipe (une prise d\'air donne le même symptôme qu\'un gicleur trop petit).'
    },
    'noire-seche': {
      badge: 'Trop Riche',
      badgeClass: 'status-warning',
      borderStyle: '#F59E0B',
      title: 'Mélange Trop Riche (Suie Noire Mate)',
      text: 'Excès de carburant. Le moteur broute à haut régime, a des ratés ("effet 4 temps") et manque de pointe.',
      action: 'Descendez d\'UN SEUL cran de gicleur par rapport à celui actuellement monté, puis refaites un essai avant de descendre davantage. Vérifiez aussi la propreté des grilles du filtre à air.'
    },
    'noire-grasse': {
      badge: 'Encrassement',
      badgeClass: 'status-warning',
      borderStyle: '#F59E0B',
      title: 'Bougie Huileuse / Trempée',
      text: 'Excès d\'huile dans le mélange (dosage à vérifier sur la fiche du fabricant de votre huile, un léger surdosage à 3% en rodage est courant mais pas plus), ou indice thermique de bougie inadapté à vérifier sur votre notice.',
      action: 'Vérifiez le dosage de votre mélange sur la fiche du fabricant de l\'huile et vérifiez l\'étincelle à l\'allumage.'
    }
  };

  plugButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      plugButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const condition = btn.getAttribute('data-condition');
      const diag = plugDiagnostics[condition];

      if (diag) {
        diagBadge.textContent = diag.badge;
        diagBadge.className = `diag-status ${diag.badgeClass}`;
        diagTitle.textContent = diag.title;
        diagText.textContent = diag.text;
        diagActionText.textContent = diag.action;
        diagCard.style.borderLeftColor = diag.borderStyle;
      }
    });
  });

  /* -----------------------------------------------------------------
   * 5. CHECKLIST D'ATELIER INTERACTIVE & SAUVEGARDE LOCALSTORAGE
   * ----------------------------------------------------------------- */
  const checkboxes = document.querySelectorAll('.task-item input[type="checkbox"]');
  const progressBar = document.getElementById('checklist-progress-bar');
  const progressText = document.getElementById('tracker-summary');
  const btnReset = document.getElementById('btn-reset-checklist');

  const STORAGE_KEY = 'motobecane_50vcl_checklist';

  function updateChecklistProgress() {
    let completedCount = 0;
    const totalCount = checkboxes.length;
    const savedState = {};

    checkboxes.forEach(cb => {
      const taskId = cb.getAttribute('data-task');
      const parentLabel = cb.closest('.task-item');

      if (cb.checked) {
        completedCount++;
        parentLabel.classList.add('completed');
        savedState[taskId] = true;
      } else {
        parentLabel.classList.remove('completed');
        savedState[taskId] = false;
      }
    });

    const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressText) progressText.textContent = `${completedCount} sur ${totalCount} étapes validées (${percent}%)`;

    // Persist
    store.set(STORAGE_KEY, JSON.stringify(savedState));
  }

  function loadChecklistState() {
    const raw = store.get(STORAGE_KEY);
    if (!raw) return;

    try {
      const savedState = JSON.parse(raw);
      checkboxes.forEach(cb => {
        const taskId = cb.getAttribute('data-task');
        if (savedState[taskId]) {
          cb.checked = true;
          cb.closest('.task-item').classList.add('completed');
        }
      });
      updateChecklistProgress();
    } catch (e) {
      console.error('Error loading checklist state', e);
    }
  }

  checkboxes.forEach(cb => {
    cb.addEventListener('change', updateChecklistProgress);
  });

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Voulez-vous réinitialiser toutes les étapes de la checklist ?')) {
        checkboxes.forEach(cb => {
          cb.checked = false;
          cb.closest('.task-item').classList.remove('completed');
        });
        store.remove(STORAGE_KEY);
        updateChecklistProgress();
      }
    });
  }

  loadChecklistState();

  /* -----------------------------------------------------------------
   * 5b. TUTORIELS IMAGÉS : SÉLECTEUR + ÉTAPES RÉALISÉES (mémorisées)
   * ----------------------------------------------------------------- */
  const tutoPills = document.querySelectorAll('.tuto-pill-btn[data-tuto]');
  const tutoPanels = document.querySelectorAll('.tutorial-panel');
  const tutoChecks = document.querySelectorAll('input[data-tuto-task]');
  const TUTO_KEY = 'motobecane_50vcl_tutos';
  const TUTO_ACTIVE_KEY = 'motobecane_50vcl_tuto_actif';

  function showTutorial(id) {
    let found = false;
    tutoPanels.forEach(p => {
      const on = p.id === id;
      p.classList.toggle('active', on);
      if (on) found = true;
    });
    if (!found) return;
    tutoPills.forEach(b => b.classList.toggle('active', b.getAttribute('data-tuto') === id));
    store.set(TUTO_ACTIVE_KEY, id);
  }

  tutoPills.forEach(btn => {
    btn.addEventListener('click', () => showTutorial(btn.getAttribute('data-tuto')));
  });

  function saveTutoState() {
    const state = {};
    tutoChecks.forEach(cb => { if (cb.checked) state[cb.getAttribute('data-tuto-task')] = true; });
    store.set(TUTO_KEY, JSON.stringify(state));
  }

  tutoChecks.forEach(cb => {
    cb.addEventListener('change', () => {
      const card = cb.closest('.tuto-step-card');
      if (card) card.classList.toggle('step-done', cb.checked);
      saveTutoState();
    });
  });

  (function restoreTutoState() {
    try {
      const raw = store.get(TUTO_KEY);
      const state = raw ? JSON.parse(raw) : {};
      tutoChecks.forEach(cb => {
        if (state[cb.getAttribute('data-tuto-task')]) {
          cb.checked = true;
          const card = cb.closest('.tuto-step-card');
          if (card) card.classList.add('step-done');
        }
      });
    } catch (e) { /* état illisible : on repart de zéro */ }
    const last = store.get(TUTO_ACTIVE_KEY);
    if (last) showTutorial(last);
  })();

  /* -----------------------------------------------------------------
   * 6. IMPRESSION DE LA FICHE D'ÉTABLI
   * ----------------------------------------------------------------- */
  const btnPrint = document.getElementById('btn-print');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      document.body.classList.remove('print-mode-memo');
      window.print();
      showToast('Fiche d\'établi envoyée à l\'impression.');
    });
  }

  // Illustration de l'onglet Archives : réutilise l'image de la bannière
  // « Première visite » pour ne pas dupliquer ~20 Ko de données base64.
  (function () {
    const art = document.querySelector('.archives-art');
    const src = document.querySelector('.beginner-banner-art');
    if (art && src && src.getAttribute('src')) art.src = src.getAttribute('src');
  })();

  window.addEventListener('afterprint', () => {
    document.body.classList.remove('print-mode-memo');
  });

  /* -----------------------------------------------------------------
   * 7. MODE ÉTABLI (THÈME SOMBRE HAUTE VISIBILITÉ)
   * ----------------------------------------------------------------- */
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const THEME_KEY = 'motobecane_50vcl_theme';

  function setTheme(isDark) {
    if (isDark) {
      document.body.classList.add('theme-dark');
      if (themeIcon) themeIcon.textContent = '☀️';
      if (btnThemeToggle) {
        const textSpan = btnThemeToggle.querySelector('.theme-text');
        if (textSpan) textSpan.textContent = 'Mode Jour';
      }
      store.set(THEME_KEY, 'dark');
      if (typeof drawSpeedTorqueChart === 'function') window.requestAnimationFrame(drawSpeedTorqueChart);
    } else {
      document.body.classList.remove('theme-dark');
      if (themeIcon) themeIcon.textContent = '🌙';
      if (btnThemeToggle) {
        const textSpan = btnThemeToggle.querySelector('.theme-text');
        if (textSpan) textSpan.textContent = 'Mode Établi';
      }
      store.set(THEME_KEY, 'light');
      if (typeof drawSpeedTorqueChart === 'function') window.requestAnimationFrame(drawSpeedTorqueChart);
    }
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const isCurrentlyDark = document.body.classList.contains('theme-dark');
      setTheme(!isCurrentlyDark);
    });

    const savedTheme = store.get(THEME_KEY);
    if (savedTheme === 'dark') {
      setTheme(true);
    }
  }

  /* -----------------------------------------------------------------
   * 8. RECHERCHE RAPIDE INSTANTANÉE DANS LE MANUEL
   * ----------------------------------------------------------------- */
  const quickSearchInput = document.getElementById('quick-search');
  const quickSearchFeedback = document.getElementById('quick-search-feedback');

  // Normalise les accents (é, è, ê, à... -> e, e, e, a...) pour que la recherche
  // fonctionne même si l'utilisateur ou le contenu n'utilise pas les mêmes accents.
  function normalizeSearch(str) {
    return (str || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  function showSearchFeedback(message) {
    if (!quickSearchFeedback) return;
    quickSearchFeedback.textContent = message;
    quickSearchFeedback.style.display = 'block';
    clearTimeout(showSearchFeedback._t);
    showSearchFeedback._t = setTimeout(() => {
      quickSearchFeedback.style.display = 'none';
    }, 3000);
  }

  if (quickSearchInput) {
    quickSearchInput.addEventListener('input', () => {
      if (quickSearchFeedback) quickSearchFeedback.style.display = 'none';
    });

    quickSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = normalizeSearch(quickSearchInput.value.trim());
        if (!query) return;

        // Keywords mapping to tabs
        const topicMap = [
          { keywords: ['vitesse', 'chrono', 'huret', 'cinematique', 'compteur', 'regime', 'rpm', 'simulateur', 'developpe'], tab: 'tab-simulateur' },
          { keywords: ['zener', 'clignotant', 'moryama', 'bobine', 'faisceau', 'masse', 'phare', 'ampoule', 'centrale', 'electricite'], tab: 'tab-electricite' },
          { keywords: ['panne', 'diagnostic', 'broute', '4 temps', '10 minutes', 'cale', 'castagnette', 'emballe', 'fumee'], tab: 'tab-diagnostic' },
          { keywords: ['mine', 'mines', 'ants', 'pantin', 'pv', 'carte grise', 'homologation', 'chassis', 'reference'], tab: 'tab-archives' },
          { keywords: ['tuto', 'tutoriel', 'arrache', 'pot', 'tromblon', 'squish', 'rabotage', 'marbre'], tab: 'tab-tutos' },
          { keywords: ['galet', 'bille', 'dimoby', 'vario', 'variateur', 'joue'], tab: 'tab-variateur' },
          { keywords: ['gicleur', 'polini', 'sha', 'carbu', 'carburateur', 'dellorto'], tab: 'tab-carburation' },
          { keywords: ['melange', 'huile', 'essence', 'plein', 'bidon', 'sp98', 'synthese', 'dosette', 'beaker', '5.2', '5,2'], tab: 'tab-melangeur' },
          { keywords: ['masselotte', 'transval', 'courroie', 'hutchinson', 'silentbloc', 'embrayage'], tab: 'tab-embrayage' },
          { keywords: ['reference', 'prix', 'marchand', 'achat', 'magasin', 'boutique', 'piece', 'catalogue', 'tarif'], tab: 'tab-references' }
        ].map(item => ({ ...item, keywords: item.keywords.map(normalizeSearch) }));

        for (const item of topicMap) {
          if (item.keywords.some(k => query.includes(k))) {
            const targetBtn = document.querySelector(`.nav-btn[data-tab="${item.tab}"]`);
            if (targetBtn) {
              targetBtn.click();
              quickSearchInput.blur();
              return;
            }
          }
        }

        // Noms des onglets et des groupes du menu (ex. « carnet », « glossaire »,
        // « je répare ») : on ouvre l'onglet, ou on déplie le groupe correspondant.
        if (query.length >= 3) {
          const navLabel = (el) => normalizeSearch(el.textContent.replace(/[▾▼]/g, '').trim());
          const tabBtn = Array.from(document.querySelectorAll('.nav-btn[data-tab]'))
            .find(btn => navLabel(btn).includes(query));
          if (tabBtn) {
            tabBtn.click();
            quickSearchInput.blur();
            return;
          }
          const groupBtn = Array.from(document.querySelectorAll('.nav-group-toggle'))
            .find(btn => navLabel(btn).includes(query));
          if (groupBtn) {
            quickSearchInput.blur();
            if (groupBtn.getAttribute('aria-expanded') !== 'true') groupBtn.click();
            showSearchFeedback('Groupe « ' + groupBtn.textContent.replace(/[▾▼]/g, '').trim() + ' » ouvert dans le menu.');
            return;
          }
        }

        // Generic text search in active page (accents ignorés)
        const contentArea = document.querySelector('.main-content');
        if (contentArea) {
          const walker = document.createTreeWalker(contentArea, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            const hitEl = node.parentElement;
            // Un résultat dans une section repliée (<details>) de l'onglet affiché compte aussi : on la déplie.
            const closedParent = hitEl.closest('details:not([open])');
            const inActiveTab = !!hitEl.closest('.tab-pane.active');
            if (normalizeSearch(node.nodeValue).includes(query) && (hitEl.offsetParent !== null || (closedParent && inActiveTab))) {
              let det = hitEl.closest('details');
              while (det) { det.open = true; det = det.parentElement ? det.parentElement.closest('details') : null; }
              node.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              node.parentElement.style.outline = '3px solid #E65100';
              setTimeout(() => { node.parentElement.style.outline = ''; }, 2500);
              quickSearchInput.blur();
              return;
            }
          }
        }

        // Rien trouvé : le dire plutôt que de rester silencieux
        showSearchFeedback('Aucun résultat pour « ' + quickSearchInput.value.trim() + ' ». Essayez un autre mot-clé (zener, galet, gicleur, rupteurs...).');
      }
    });
  }

  /* -----------------------------------------------------------------
   * 9. SIMULATEUR DYNAMIQUE DE VITESSE & DÉMULTIPLICATION PANTIN
   * ----------------------------------------------------------------- */
  const simRpm = document.getElementById('sim-rpm');
  const simRpmVal = document.getElementById('sim-rpm-val');
  const simVario = document.getElementById('sim-vario');
  const simVarioVal = document.getElementById('sim-vario-val');
  const simTrans = document.getElementById('sim-trans');
  const simTire = document.getElementById('sim-tire');

  // Mode auto variateur (modèle centrifuge billes Mobymatic)
  const simAutoMode       = document.getElementById('sim-auto-mode');
  const simGaletMass      = document.getElementById('sim-galet-mass');
  const simGaletMassVal   = document.getElementById('sim-galet-mass-val');
  const simVarioManualRow = document.getElementById('sim-vario-manual-row');
  const simGaletMassRow   = document.getElementById('sim-galet-mass-row');
  const simAutoPredictions = document.getElementById('sim-auto-predictions');
  const predRpmOpen       = document.getElementById('pred-rpm-open');
  const predRpmFull       = document.getElementById('pred-rpm-full');
  const predVarioPct      = document.getElementById('pred-vario-pct');

  const simSpeedGps = document.getElementById('sim-speed-gps');
  const simSpeedHuret = document.getElementById('sim-speed-huret');
  const barValCurrent = document.getElementById('bar-val-current');
  const barValOrigin = document.getElementById('bar-val-origin');
  const barValMountain = document.getElementById('bar-val-mountain');
  const barFillCurrent = document.getElementById('bar-fill-current');
  const barFillOrigin = document.getElementById('bar-fill-origin');
  const barFillMountain = document.getElementById('bar-fill-mountain');

  // Télémétrie cinématique en direct
  const telemetryVario = document.getElementById('telemetry-vario');
  const telemetryRatioPrim = document.getElementById('telemetry-ratio-prim');
  const telemetryRatioTot = document.getElementById('telemetry-ratio-tot');
  const telemetryRpmWheel = document.getElementById('telemetry-rpm-wheel');

  function updateSpeedSimulation() {
    if (!simRpm || !simVario || !simTrans || !simTire) return;

    const rpm = parseInt(simRpm.value, 10);
    let varioPercent = parseInt(simVario.value, 10);
    const transRatio = parseFloat(simTrans.value);
    const tireCirc = parseFloat(simTire.value);

    simRpmVal.textContent = `${rpm.toLocaleString('fr-FR')} tr/min`;

    // MODE AUTO variateur : modèle centrifuge billes Mobymatic
    if (simAutoMode && simAutoMode.checked && simGaletMass) {
      const galetMassG = parseFloat(simGaletMass.value) || 5.5;
      const autoResult = varioPercentFromRPM(rpm, galetMassG);
      varioPercent = autoResult.pct;
      if (simVario) simVario.value = varioPercent;  // refléter dans le slider (lecture seule en mode auto)
      simVarioVal.textContent = `${varioPercent}% (Modèle centrifuge)`;
      if (predRpmOpen) predRpmOpen.textContent = `${autoResult.rpmOpen.toLocaleString('fr-FR')} tr/min`;
      if (predRpmFull) predRpmFull.textContent = `${autoResult.rpmFull.toLocaleString('fr-FR')} tr/min`;
      if (predVarioPct) predVarioPct.textContent = `${varioPercent} %`;
    } else {
      simVarioVal.textContent = `${varioPercent}% ${varioPercent === 100 ? '(Plein sommet)' : varioPercent === 0 ? '(Gorge fermée)' : '(En montée)'}`;
    }

    // Cinématique réelle d'époque Motobécane 50V (Pantin) :
    // 1. Transmission primaire par courroie trapézoïdale :
    //    - Poulie motrice / plateau récepteur : Diamètre effectif d'enroulement = 207,5 mm (RTM)
    //    - Variateur Mobymatic :
    //      * 0% (courroie en fond de gorge) : diamètre primitif = 49,5 mm -> Ratio primaire = 207,5 / 49,5 = 4,19
    //      * 100% (courroie à fleur des joues) : diamètre primitif = 87,5 mm -> Ratio primaire = 207,5 / 87,5 = 2,37
    // (Constantes RTM PULLEY_DIAM_MM / VARIO_MIN_MM / VARIO_MAX_MM déclarées au niveau du scope)
    const dVario = VARIO_MIN_MM + (varioPercent / 100) * (VARIO_MAX_MM - VARIO_MIN_MM);
    const primaryRatio = PULLEY_DIAM_MM / dVario;

    // 2. Rapport global de démultiplication (Moteur vers Roue arrière) :
    //    Rapport total = Rapport primaire (courroie) × Rapport secondaire (chaîne)
    const totalRatio = primaryRatio * transRatio;

    // 3. Vitesse de rotation de la roue arrière en tours/min :
    const wheelRpm = rpm / totalRatio;

    // 4. Vitesse réelle au sol (GPS) en km/h :
    //    Vitesse = (tours/min × circonférence en mètres × 60 min) / 1000 m
    const speedKmH = (wheelRpm * tireCirc * 60) / 1000;
    const speedGpsStr = speedKmH.toFixed(1);

    // 5. Compteur mécanique Huret vintage (+7% d'optimisme mécanique d'époque) :
    const huretSpeed = Math.round(speedKmH * 1.07);

    if (simSpeedGps) simSpeedGps.textContent = speedGpsStr;
    if (simSpeedHuret) simSpeedHuret.textContent = huretSpeed;

    // Alerte sécurité : une vitesse simulée élevée n'a de sens que si les
    // freins, pneus, cadre et transmission suivent. On ne donne aucun verdict
    // définitif, juste un rappel à vérifier avant de viser ces vitesses en vrai.
    const simSpeedAlert = document.getElementById('sim-speed-alert');
    const simSpeedAlertText = document.getElementById('sim-speed-alert-text');
    if (simSpeedAlert && simSpeedAlertText) {
      if (speedKmH >= 60) {
        simSpeedAlert.style.display = 'block';
        simSpeedAlertText.textContent = "Au-delà de 60 km/h simulés, le cadre, la fourche, les roulements de direction et la transmission d'origine (plus de 50 ans) sont sollicités bien au-delà de leur usage prévu. Avant d'y viser en conditions réelles : freins (état des mâchoires/câbles), pneus (pression, usure, âge de la gomme) et jeux de direction/roues à vérifier sérieusement. Cette vitesse dépasse aussi largement le cadre légal d'un cyclomoteur (voir l'onglet Archives & Mines).";
      } else if (speedKmH >= 50) {
        simSpeedAlert.style.display = 'block';
        simSpeedAlertText.textContent = "À cette vitesse simulée, vérifiez que vos freins et pneus neufs sont bien en bon état et que le cadre ne présente ni jeu ni corrosion avant de reproduire ce régime sur route. Rappel : au-delà de 45 km/h, vous sortez du cadre légal d'un cyclomoteur (voir l'onglet Archives & Mines).";
      } else {
        simSpeedAlert.style.display = 'none';
      }
    }

    // Mise à jour de la télémétrie cinématique en direct
    if (telemetryVario) telemetryVario.textContent = `${Math.round(dVario)} mm`;
    if (telemetryRatioPrim) telemetryRatioPrim.textContent = `${primaryRatio.toFixed(2)} : 1`;
    if (telemetryRatioTot) telemetryRatioTot.textContent = `${totalRatio.toFixed(2)} : 1`;
    if (telemetryRpmWheel) telemetryRpmWheel.textContent = `${Math.round(wheelRpm)} tr/min`;

    // Comparatif du développé à pleine variation (100% vario = dVarioMax 87,5 mm) au même régime
    // CORRECTIF : utilise transRatio (live du sélecteur) au lieu d'un ratio hardcodé
    // vario 100% = VARIO_MAX_MM → vitesse de pointe (courroie à fleur des joues)
    const speedAtPeak = (trans) => speedAtVarioPct(rpm, 100, trans, tireCirc);

    const speedCurrent = speedAtPeak(transRatio);   // ← votre transmission (live depuis le sélecteur)
    const speedOrigin = speedAtPeak(4.500);          // 11x49,5 (origine Pantin)
    const speedMountain = speedAtPeak(5.091);        // 11x56 (montagne)

    if (barValCurrent) barValCurrent.textContent = `${speedCurrent.toFixed(1)} km/h`;
    if (barValOrigin) barValOrigin.textContent = `${speedOrigin.toFixed(1)} km/h`;
    if (barValMountain) barValMountain.textContent = `${speedMountain.toFixed(1)} km/h`;

    const maxSpeedGraph = 80;
    if (barFillCurrent) barFillCurrent.style.width = `${Math.min(100, (speedCurrent / maxSpeedGraph) * 100)}%`;
    if (barFillOrigin) barFillOrigin.style.width = `${Math.min(100, (speedOrigin / maxSpeedGraph) * 100)}%`;
    if (barFillMountain) barFillMountain.style.width = `${Math.min(100, (speedMountain / maxSpeedGraph) * 100)}%`;

    if (typeof drawSpeedTorqueChart === 'function') drawSpeedTorqueChart();
  }

  /* -----------------------------------------------------------------
   * 10b. GRAPHIQUE DYNAMIQUE VITESSE / RÉGIME + FORME DE COUPLE INDICATIVE
   * -----------------------------------------------------------------
   * La courbe de VITESSE réutilise exactement la même cinématique que
   * updateSpeedSimulation() ci-dessus (poulies 207,5/49,5-87,5 mm, source RTM)
   * — c'est du calcul, pas une estimation.
   * La courbe de COUPLE est volontairement SANS UNITÉ : seule la FORME est
   * indicative (où le moteur pousse le plus). Les régimes repères sont issus
   * de sources primaires : couple max ~3 000 tr/min (RTM + Fiche des Mines),
   * puissance max ~4 700 tr/min (Fiche des Mines).
   * ----------------------------------------------------------------- */
  const speedTorqueCanvas = document.getElementById('speed-torque-canvas');
  const speedTorqueCtx = speedTorqueCanvas ? speedTorqueCanvas.getContext('2d') : null;

  function drawSpeedTorqueChart() {
    if (!speedTorqueCtx || !simRpm || !simVario || !simTrans || !simTire) return;

    const canvas = speedTorqueCanvas;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    if (cssWidth === 0 || cssHeight === 0) return; // onglet masqué, pas encore dimensionné

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    const ctx = speedTorqueCtx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const isDark = document.body.classList.contains('theme-dark');
    const colGrid = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.10)';
    const colAxisText = isDark ? '#CBD5E1' : '#475569';
    const colEnvelopeFill = 'rgba(217, 72, 15, 0.12)';
    const colEnvelopeLine = 'rgba(217, 72, 15, 0.55)';
    const colCurrent = '#D9480F';
    const colTorque = isDark ? '#94A3B8' : '#64748B';

    // --- Cinématique (constantes RTM partagées : PULLEY_DIAM_MM / VARIO_MIN_MM / VARIO_MAX_MM) ---
    const transRatio = parseFloat(simTrans.value) || transmissionProfileRatio;
    const tireCirc = parseFloat(simTire.value) || 1.76;
    const currentVarioPct = parseInt(simVario.value, 10);
    const currentRpm = parseInt(simRpm.value, 10);

    // Alias local vers speedAtVarioPct() avec les paramètres transRatio/tireCirc de cet appel
    const speedAt = (rpm, varioPct) => speedAtVarioPct(rpm, varioPct, transRatio, tireCirc);

    // Forme de couple qualitative : cloche asymétrique, pic ~3 000 tr/min
    // (RTM + Fiche des Mines AV7), montée progressive dès 2 000 tr/min,
    // descente douce jusqu'à 6 000 tr/min (moteur 2T à distribution) — Sans unité.
    function torqueShapeAt(rpm) {
      const peak = 3000;
      const sigma = rpm < peak ? 800 : 1500;
      return Math.exp(-((rpm - peak) ** 2) / (2 * sigma * sigma)) * 100;
    }

    const rpmMin = 2000;
    const rpmMax = 7500;
    const step = 50;
    const points = [];
    for (let rpm = rpmMin; rpm <= rpmMax; rpm += step) {
      points.push({
        rpm,
        sClosed: speedAt(rpm, 0),
        sOpen: speedAt(rpm, 100),
        sCurrent: (simAutoMode && simAutoMode.checked && simGaletMass)
          ? speedAt(rpm, varioPercentFromRPM(rpm, parseFloat(simGaletMass.value) || 5.5).pct)
          : speedAt(rpm, currentVarioPct),
        torque: torqueShapeAt(rpm)
      });
    }

    const maxSpeed = Math.max(...points.map((p) => Math.max(p.sClosed, p.sOpen, p.sCurrent)));
    const yMaxSpeed = Math.max(40, Math.ceil((maxSpeed * 1.1) / 10) * 10);

    const padLeft = 40;
    const padRight = 12;
    const padTop = 12;
    const padBottom = 28;
    const plotW = cssWidth - padLeft - padRight;
    const plotH = cssHeight - padTop - padBottom;
    if (plotW <= 0 || plotH <= 0) return;

    const xForRpm = (rpm) => padLeft + ((rpm - rpmMin) / (rpmMax - rpmMin)) * plotW;
    const yForSpeed = (speed) => padTop + plotH - (speed / yMaxSpeed) * plotH;
    const yForTorque = (t) => padTop + plotH - (t / 100) * plotH;

    // Grille horizontale + graduations vitesse
    ctx.font = '10px sans-serif';
    ctx.lineWidth = 1;
    const speedStep = yMaxSpeed <= 60 ? 10 : 20;
    for (let s = 0; s <= yMaxSpeed; s += speedStep) {
      const y = yForSpeed(s);
      ctx.strokeStyle = colGrid;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(cssWidth - padRight, y);
      ctx.stroke();
      ctx.fillStyle = colAxisText;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${s}`, padLeft - 6, y);
    }

    // Graduations régime (axe X)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let rpm = rpmMin; rpm <= rpmMax; rpm += 1000) {
      const x = xForRpm(rpm);
      ctx.fillStyle = colAxisText;
      ctx.fillText(`${Math.round(rpm / 100) / 10}k`, x, cssHeight - padBottom + 6);
    }

    // Repères verticaux : couple max ~3 000 tr/min (RTM), puissance max ~4 700 tr/min (Fiche des Mines)
    [3000, 4700, 6000].forEach((rpm) => {
      const x = xForRpm(rpm);
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.15)';
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, cssHeight - padBottom);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Enveloppe vario fermé ↔ ouvert (zone remplie)
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = xForRpm(p.rpm);
      const y = yForSpeed(p.sOpen);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    for (let i = points.length - 1; i >= 0; i--) {
      const x = xForRpm(points[i].rpm);
      const y = yForSpeed(points[i].sClosed);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = colEnvelopeFill;
    ctx.fill();

    // Lignes enveloppe pointillées
    ctx.strokeStyle = colEnvelopeLine;
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.3;
    ['sClosed', 'sOpen'].forEach((key) => {
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = xForRpm(p.rpm);
        const y = yForSpeed(p[key]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Forme de couple indicative (axe secondaire 0-100%, pointillés gris)
    ctx.strokeStyle = colTorque;
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = xForRpm(p.rpm);
      const y = yForTorque(p.torque);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Courbe vitesse à la position ACTUELLE du variateur (pleine, orange)
    ctx.strokeStyle = colCurrent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = xForRpm(p.rpm);
      const y = yForSpeed(p.sCurrent);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Point + ligne verticale sur le régime sélectionné par le slider
    const clampedRpm = Math.min(rpmMax, Math.max(rpmMin, currentRpm));
    const curX = xForRpm(clampedRpm);
    const curY = yForSpeed(speedAt(currentRpm, currentVarioPct));
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.3)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(curX, padTop);
    ctx.lineTo(curX, cssHeight - padBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.fillStyle = colCurrent;
    ctx.arc(curX, curY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isDark ? '#0E2841' : '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Libellé axe Y (vitesse)
    ctx.save();
    ctx.translate(11, padTop + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colAxisText;
    ctx.font = '10px sans-serif';
    ctx.fillText('km/h', 0, 0);
    ctx.restore();

    // Libellé axe X (régime)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = colAxisText;
    ctx.fillText('Régime moteur (tr/min)', padLeft + plotW / 2, cssHeight - 4);
  }

  /* -----------------------------------------------------------------
   * MODÈLE PHYSIQUE : Variateur à billes Mobymatic → Vario%
   * Source confirmée : "Le Variateur Embrayage MBK" (revue technique 1990s)
   * Architecture : 3 ou 4 billes sphériques sur rampes inclinées,
   * sans ressort de rappel de joue mobile (retour = seule tension courroie).
   * Loi centrifuge : F ∝ m × ω²  →  RPM_équilibre ∝ 1/√m
   * Calibration RTM : couple max à ~3 000 tr/min avec galets 5g standard
   * ----------------------------------------------------------------- */
  function varioPercentFromRPM(rpm, galetMassG) {
    const REF_MASS     = 5.0;   // g : galets d'origine AV7
    const RPM_OPEN_REF = 2500;  // tr/min : début déplacement courroie (zone couple max RTM)
    const RPM_FULL_REF = 5000;  // tr/min : courroie en haut des joues (plein régime)
    // Scaling masse → régime d'équilibre (loi centrifuge)
    const massRatio = Math.sqrt(REF_MASS / galetMassG);
    const rpmOpen   = Math.round(RPM_OPEN_REF * massRatio);
    const rpmFull   = Math.round(RPM_FULL_REF * massRatio);
    if (rpm <= rpmOpen) return { pct: 0,   rpmOpen, rpmFull };
    if (rpm >= rpmFull) return { pct: 100, rpmOpen, rpmFull };
    // Progression quadratique entre ouverture et pleine ouverture (∝ n²)
    const ratio = (rpm * rpm - rpmOpen * rpmOpen) / (rpmFull * rpmFull - rpmOpen * rpmOpen);
    return { pct: Math.round(ratio * 100), rpmOpen, rpmFull };
  }

  if (simRpm) {
    simRpm.addEventListener('input', updateSpeedSimulation);
    simVario.addEventListener('input', () => {
      // En mode manuel uniquement (en mode auto le slider est piloté par le modèle)
      if (!simAutoMode || !simAutoMode.checked) updateSpeedSimulation();
    });
    simTrans.addEventListener('change', updateSpeedSimulation);
    simTire.addEventListener('change', updateSpeedSimulation);

    // Basculement mode Auto / Manuel
    if (simAutoMode) {
      simAutoMode.addEventListener('change', () => {
        const isAuto = simAutoMode.checked;
        if (simVarioManualRow)   simVarioManualRow.style.display   = isAuto ? 'none' : '';
        if (simGaletMassRow)     simGaletMassRow.style.display     = isAuto ? ''     : 'none';
        if (simAutoPredictions)  simAutoPredictions.style.display  = isAuto ? ''     : 'none';
        updateSpeedSimulation();
      });
    }

    // Curseur poids galets (visible uniquement en mode auto)
    if (simGaletMass) {
      simGaletMass.addEventListener('input', () => {
        const g = parseFloat(simGaletMass.value).toFixed(1).replace('.', ',');
        if (simGaletMassVal) simGaletMassVal.textContent = `${g} g`;
        if (simAutoMode && simAutoMode.checked) updateSpeedSimulation();
      });
    }

    updateSpeedSimulation();
  }

  if (speedTorqueCanvas) {
    let chartResizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(chartResizeTimer);
      chartResizeTimer = setTimeout(drawSpeedTorqueChart, 100);
    });
    // Le canvas est à 0×0 tant que l'onglet Simulateur n'est pas affiché :
    // redessiner au clic sur son bouton de navigation.
    document.querySelectorAll('.nav-btn[data-tab="tab-simulateur"]').forEach((btn) => {
      btn.addEventListener('click', () => window.requestAnimationFrame(drawSpeedTorqueChart));
    });
  }

  /* -----------------------------------------------------------------
   * 10. COMMUTATEUR BIFACE ÉLECTRIQUE (NOVI 6V/12V VS MORYAMA 12V)
   * ----------------------------------------------------------------- */
  const bifaceButtons = document.querySelectorAll('.biface-btn');
  const electricPanels = document.querySelectorAll('.electric-panel');

  bifaceButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetElecId = btn.getAttribute('data-elec');

      bifaceButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      electricPanels.forEach(p => {
        p.classList.remove('active');
        if (p.id === targetElecId) {
          p.classList.add('active');
        }
      });
    });
  });

  /* -----------------------------------------------------------------
   * 11. ARBRE DE DIAGNOSTIC & FILTRE DES PANNES
   * ----------------------------------------------------------------- */
  const diagFilterButtons = document.querySelectorAll('.diag-filter-btn');
  const diagCards = document.querySelectorAll('.diag-symptom-card');

  diagFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-diag-filter');

      diagFilterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      diagCards.forEach(card => {
        const cat = card.getAttribute('data-diag-cat');
        if (filter === 'all' || cat === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* -----------------------------------------------------------------
   * 12. MODAL DU MÉMO DE RÉGLAGES PERSONNALISÉS
   * ----------------------------------------------------------------- */
  const btnMemo = document.getElementById('btn-memo');
  const memoModal = document.getElementById('memo-modal');
  const btnCloseMemo = document.getElementById('btn-close-memo');
  const btnCopyMemo = document.getElementById('btn-copy-memo');
  const btnPrintMemo = document.getElementById('btn-print-memo');

  /* ---- Utilitaire focus-trap ----------------------------------------- */
  /**
   * Ouvre une modale ARIA dialog :
   *   - ajoute la classe 'active'
   *   - mémorise l'élément qui avait le focus avant l'ouverture
   *   - déplace le focus sur le premier élément focalisable de la carte
   *   - installe un gestionnaire de touche Tab pour piéger le focus à l'intérieur
   * Retourne une fonction de nettoyage à appeler à la fermeture.
   */
  function openModalWithFocusTrap(backdropEl) {
    if (!backdropEl) return () => {};
    backdropEl.classList.add('active');

    // Mémoriser le déclencheur pour restaurer le focus à la fermeture
    const previousFocus = document.activeElement;

    // Sélecteur des éléments focalisables standard
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const card = backdropEl.querySelector('.memo-modal-card');

    // Déplacer le focus sur le premier élément de la carte
    if (card) {
      const first = card.querySelector(FOCUSABLE);
      if (first) first.focus();
    }

    // Gestionnaire Tab pour piéger le focus
    function trapTab(e) {
      if (e.key !== 'Tab') return;
      if (!backdropEl.classList.contains('active')) return;

      const focusables = card ? Array.from(card.querySelectorAll(FOCUSABLE)).filter((el) => !el.closest('[hidden]')) : [];
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', trapTab);

    // Retourner la fonction de nettoyage
    return function cleanup() {
      document.removeEventListener('keydown', trapTab);
      backdropEl.classList.remove('active');
      // Restaurer le focus sur le déclencheur
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    };
  }
  /* -------------------------------------------------------------------- */

  let _closeMemoCleanup = null;

  function openMemo() {
    if (memoModal) {
      _closeMemoCleanup = openModalWithFocusTrap(memoModal);
    }
  }

  function closeMemo() {
    if (_closeMemoCleanup) {
      _closeMemoCleanup();
      _closeMemoCleanup = null;
    } else if (memoModal) {
      memoModal.classList.remove('active');
    }
  }

  if (btnMemo) btnMemo.addEventListener('click', openMemo);
  if (btnCloseMemo) btnCloseMemo.addEventListener('click', closeMemo);

  if (memoModal) {
    memoModal.addEventListener('click', (e) => {
      if (e.target === memoModal) closeMemo();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && memoModal && memoModal.classList.contains('active')) {
      closeMemo();
    }
  });

  if (btnCopyMemo) {
    btnCopyMemo.addEventListener('click', () => {
      const p = currentProfile;
      const ratio = (p.couronne / p.pignon).toFixed(2).replace('.', ',');
      const memoText = `--- FICHE MÉMO MOTOBÉCANE 50 VLC (AV7) ---
• Transmission : Pignon ${p.pignon} dents / Couronne ${p.couronne} dents (Rapport ${ratio})
• Variateur : ${p.variateur} (cible ${formatDecimal(p.galetsMin)} à ${formatDecimal(p.galetsMax)} g, montage à sec)
• Embrayage : Masselottes ${p.masselottes} g
• Cage de guidage : RSM 15x19x22.5 graissée au lithium
• Courroie : Hutchinson Crantée 822x14x8 mm
• Carburation : Dell'Orto SHA, gicleur ${p.gicleur} (déclaré par vous — surveillez la bougie après tout changement)
• Allumage AV7 : débutez à 1,8 mm avant PMH (2 mm = valeur RTM d'origine, ajustez 1,7-2 mm selon comportement), écartement rupteurs 0,35 mm
• Mélange 2T : dosage selon fiche du fabricant (3% en rodage) + SP98
• Pneus : pression à vérifier sur le flanc du pneu monté
-------------------------------------------`;

      navigator.clipboard.writeText(memoText).then(() => {
        btnCopyMemo.textContent = '✓ Copié dans le presse-papier !';
        setTimeout(() => {
          btnCopyMemo.textContent = '📋 Copier le résumé';
        }, 2500);
      }).catch(err => {
        console.error('Erreur copie', err);
      });
    });
  }

  if (btnPrintMemo) {
    btnPrintMemo.addEventListener('click', () => {
      document.body.classList.add('print-mode-memo');
      window.print();
    });
  }

  /* -----------------------------------------------------------------
   * 5c. PROFIL VÉHICULE ÉDITABLE
   * Permet de modifier transmission / variateur / galets cible / embrayage
   * affichés dans le bandeau d'en-tête, et de répercuter la transmission
   * choisie dans le simulateur de vitesse pour tester d'autres hypothèses.
   * Base pour une évolution future : relier aussi les autres calculateurs
   * (galets, carburation...) à ce même profil.
   * ----------------------------------------------------------------- */
  const PROFILE_KEY = 'motobecane_50vcl_vehicle_profile';
  const DEFAULT_PROFILE = {
    pignon: 11,
    couronne: 54,
    variateur: '3 Galets F.D.V.',
    galetsMin: 5.4,
    galetsMax: 5.6,
    masselottes: 36,
    gicleur: 68
  };

  const profileModal = document.getElementById('profile-modal');
  const btnEditProfile = document.getElementById('btn-edit-profile');
  const btnCloseProfile = document.getElementById('btn-close-profile');
  const btnSaveProfile = document.getElementById('btn-save-profile');
  const btnResetProfile = document.getElementById('btn-reset-profile');
  const profilePignon = document.getElementById('profile-pignon');
  const profileCouronne = document.getElementById('profile-couronne');
  const profileVariateur = document.getElementById('profile-variateur');
  const profileGaletsMin = document.getElementById('profile-galets-min');
  const profileGaletsMax = document.getElementById('profile-galets-max');
  const profileMasselottes = document.getElementById('profile-masselottes');
  const profileGicleur = document.getElementById('profile-gicleur');
  const profileRatioPreview = document.getElementById('profile-ratio-preview');

  function loadProfile() {
    try {
      const raw = store.get(PROFILE_KEY);
      if (!raw) return { ...DEFAULT_PROFILE };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PROFILE, ...parsed };
    } catch (e) {
      return { ...DEFAULT_PROFILE };
    }
  }

  function formatDecimal(n) {
    return n.toFixed(1).replace('.', ',');
  }

  function applyProfileToRibbon(profile) {
    const elTransmission = document.getElementById('ribbon-val-transmission');
    const elVariateur = document.getElementById('ribbon-val-variateur');
    const elGalets = document.getElementById('ribbon-val-galets');
    const elEmbrayage = document.getElementById('ribbon-val-embrayage');
    if (elTransmission) elTransmission.textContent = `${profile.pignon}×${profile.couronne}`;
    if (elVariateur) elVariateur.textContent = profile.variateur;
    if (elGalets) elGalets.textContent = `${formatDecimal(profile.galetsMin)}–${formatDecimal(profile.galetsMax)} g`;
    if (elEmbrayage) elEmbrayage.textContent = `Masselottes ${profile.masselottes} g`;

    const footerTransmission = document.getElementById('footer-badge-transmission');
    const footerGalets = document.getElementById('footer-badge-galets');
    const footerMasselottes = document.getElementById('footer-badge-masselottes');
    const footerGicleur = document.getElementById('footer-badge-gicleur');
    if (footerTransmission) footerTransmission.textContent = `Transmission ${profile.pignon}x${profile.couronne}`;
    if (footerGalets) footerGalets.textContent = `Galets ${formatDecimal((profile.galetsMin + profile.galetsMax) / 2)}g`;
    if (footerMasselottes) footerMasselottes.textContent = `Masselottes ${profile.masselottes}g`;
    if (footerGicleur) footerGicleur.textContent = `Gicleur ${profile.gicleur} SHA`;
  }

  function applyProfileToCarburation(profile) {
    document.querySelectorAll('#carbu-val-gicleur-1, #carbu-val-gicleur-2').forEach((el) => {
      el.textContent = profile.gicleur;
    });
  }

  function applyProfileToMemo(profile) {
    const elTransmission = document.getElementById('memo-val-transmission');
    const elVariateur = document.getElementById('memo-val-variateur');
    const elEmbrayage = document.getElementById('memo-val-embrayage');
    const elGicleur = document.getElementById('memo-val-gicleur');
    const ratio = (profile.couronne / profile.pignon).toFixed(2).replace('.', ',');
    if (elTransmission) elTransmission.textContent = `${profile.pignon} x ${profile.couronne} dents (Rapport ${ratio})`;
    if (elVariateur) elVariateur.textContent = `${profile.variateur} — cible ${formatDecimal(profile.galetsMin)} à ${formatDecimal(profile.galetsMax)} g (MONTAGE À SEC)`;
    if (elEmbrayage) elEmbrayage.textContent = `Masselottes ${profile.masselottes}g (Accroche selon réglage d'origine)`;
    if (elGicleur) elGicleur.textContent = `Gicleur ${profile.gicleur} (déclaré par vous sur le SHA 15 — relevez la bougie si vous changez de cran)`;
  }

  function applyProfileToSimulator(profile) {
    if (!simTrans) return;
    const ratio = profile.couronne / profile.pignon;
    let customOption = simTrans.querySelector('option[data-profile-custom="1"]');
    const isDefault = profile.pignon === DEFAULT_PROFILE.pignon && profile.couronne === DEFAULT_PROFILE.couronne;
    if (isDefault) {
      // La config par défaut correspond déjà à une option existante (11x54) : pas besoin d'option custom.
      if (customOption) customOption.remove();
      return;
    }
    if (!customOption) {
      customOption = document.createElement('option');
      customOption.setAttribute('data-profile-custom', '1');
      simTrans.insertBefore(customOption, simTrans.firstChild);
    }
    customOption.value = ratio.toFixed(3);
    customOption.textContent = `${profile.pignon} x ${profile.couronne} (Votre profil — Rapport ${ratio.toFixed(2).replace('.', ',')})`;
    simTrans.value = ratio.toFixed(3);
    if (typeof updateSpeedSimulation === 'function') updateSpeedSimulation();
  }

  function applyProfile(profile) {
    applyProfileToRibbon(profile);
    applyProfileToSimulator(profile);
    applyProfileToCarburation(profile);
    applyProfileToMemo(profile);
    galetsProfileMin = profile.galetsMin;
    galetsProfileMax = profile.galetsMax;
    transmissionProfileRatio = profile.couronne / profile.pignon;
    transmissionProfileLabel = `${profile.pignon}x${profile.couronne}`;
    const calcTransEl = document.getElementById('calc-profile-transmission');
    const calcGaletsEl = document.getElementById('calc-profile-galets-range');
    if (calcTransEl) calcTransEl.textContent = transmissionProfileLabel;
    if (calcGaletsEl) calcGaletsEl.textContent = `${formatDecimal(profile.galetsMin)}–${formatDecimal(profile.galetsMax)} g`;
    if (typeof calculateRollerWeight === 'function') calculateRollerWeight();
  }

  function fillProfileForm(profile) {
    if (profilePignon) profilePignon.value = profile.pignon;
    if (profileCouronne) profileCouronne.value = profile.couronne;
    if (profileVariateur) profileVariateur.value = profile.variateur;
    if (profileGaletsMin) profileGaletsMin.value = profile.galetsMin;
    if (profileGaletsMax) profileGaletsMax.value = profile.galetsMax;
    if (profileMasselottes) profileMasselottes.value = profile.masselottes;
    if (profileGicleur) profileGicleur.value = profile.gicleur;
    updateRatioPreview();
  }

  function updateRatioPreview() {
    if (!profileRatioPreview || !profilePignon || !profileCouronne) return;
    const pignon = parseFloat(profilePignon.value) || DEFAULT_PROFILE.pignon;
    const couronne = parseFloat(profileCouronne.value) || DEFAULT_PROFILE.couronne;
    profileRatioPreview.textContent = (couronne / pignon).toFixed(2).replace('.', ',');
  }

  let currentProfile = loadProfile();
  applyProfile(currentProfile);

  let _closeProfileCleanup = null;

  function openProfileModal() {
    fillProfileForm(currentProfile);
    if (profileModal) {
      _closeProfileCleanup = openModalWithFocusTrap(profileModal);
    }
  }

  function closeProfileModal() {
    if (_closeProfileCleanup) {
      _closeProfileCleanup();
      _closeProfileCleanup = null;
    } else if (profileModal) {
      profileModal.classList.remove('active');
    }
  }

  if (btnEditProfile) btnEditProfile.addEventListener('click', openProfileModal);
  if (btnCloseProfile) btnCloseProfile.addEventListener('click', closeProfileModal);
  if (profileModal) {
    profileModal.addEventListener('click', (e) => {
      if (e.target === profileModal) closeProfileModal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && profileModal && profileModal.classList.contains('active')) {
      closeProfileModal();
    }
  });
  [profilePignon, profileCouronne].forEach((input) => {
    if (input) input.addEventListener('input', updateRatioPreview);
  });

  if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', () => {
      const newProfile = {
        pignon: parseFloat(profilePignon ? profilePignon.value : DEFAULT_PROFILE.pignon) || DEFAULT_PROFILE.pignon,
        couronne: parseFloat(profileCouronne ? profileCouronne.value : DEFAULT_PROFILE.couronne) || DEFAULT_PROFILE.couronne,
        variateur: profileVariateur ? profileVariateur.value : DEFAULT_PROFILE.variateur,
        galetsMin: parseFloat(profileGaletsMin ? profileGaletsMin.value : DEFAULT_PROFILE.galetsMin) || DEFAULT_PROFILE.galetsMin,
        galetsMax: parseFloat(profileGaletsMax ? profileGaletsMax.value : DEFAULT_PROFILE.galetsMax) || DEFAULT_PROFILE.galetsMax,
        masselottes: parseFloat(profileMasselottes ? profileMasselottes.value : DEFAULT_PROFILE.masselottes) || DEFAULT_PROFILE.masselottes,
        gicleur: parseFloat(profileGicleur ? profileGicleur.value : DEFAULT_PROFILE.gicleur) || DEFAULT_PROFILE.gicleur
      };
      currentProfile = newProfile;
      store.set(PROFILE_KEY, JSON.stringify(newProfile));
      applyProfile(newProfile);
      closeProfileModal();
    });
  }

  if (btnResetProfile) {
    btnResetProfile.addEventListener('click', () => {
      currentProfile = { ...DEFAULT_PROFILE };
      store.remove(PROFILE_KEY);
      applyProfile(currentProfile);
      fillProfileForm(currentProfile);
    });
  }

  /* -----------------------------------------------------------------
   * 13. MOTEUR EXPERT MÉCANO VIRTUEL (DIAGNOSTIC EN LANGAGE NATUREL)
   * ----------------------------------------------------------------- */
  const mecanoInput = document.getElementById('mecano-input');
  const btnAskMecano = document.getElementById('btn-ask-mecano');
  const btnClearMecano = document.getElementById('btn-clear-mecano');
  const mecanoResultsArea = document.getElementById('mecano-results-area');
  const mecanoPills = document.querySelectorAll('.mecano-pill-btn');

  // Base de données experte Motobécane AV7
  const mecanoKnowledgeBase = [
    {
      id: 'panne-10min',
      keywords: ['10 min', 'dix min', '10min', 'chaud', 'cale net', 'coupe net', 's arrete net', 'arrete apres', 'condensateur', 'etincelle', 'rupteur', 'refroidisse', 'attend 15', 'plus d etincelle', 'panne des 10'],
      title: '« La Panne des 10 Minutes » : Coupure Nette à Chaud',
      scoreBadgeClass: '',
      cause: 'L\'isolant interne du vieux condensateur d\'origine NOVI se dilate sous l\'effet de la chaleur du cylindre. Il perd sa capacité diélectrique et met brutalement l\'allumage à la masse. Une fois le moteur refroidi (10 à 15 minutes), l\'étincelle réapparaît mystérieusement.',
      test30s: 'Dès que le moteur s\'arrête net, démontez la bougie, posez son culot métallique contre les ailettes de la culasse et donnez un coup de pédale : AUCUNE étincelle ne jaillit. Attendez 10 minutes que le cylindre tiédisse : l\'étincelle bleue revient aussitôt.',
      solution: 'Remplacer impérativement le condensateur par un modèle électronique externe auto-cicatrisant (type Fluky) ou moderniser avec l\'allumage Moryama 12V.',
      actionTab: 'tab-sleeper',
      actionText: 'Voir la solution Allumage Électronique Furtif'
    },
    {
      id: 'broute-4temps',
      keywords: ['broute', '4 temps', 'quatre temps', 'engorge', 'trop riche', 'fume bleu', 'plein gaz', 'a fond', 'poignee a fond', 'poignee essoree', 'gicleur trop', 'ratatouille', 'regule', 'fume'],
      title: 'Engorgement Carburation / « Effet 4-Temps » à Plein Régime',
      scoreBadgeClass: '',
      cause: 'Piste probable : gicleur principal Dell\'Orto trop gros pour votre configuration. Vous avez déclaré un gicleur {{GICLEUR}}, à comparer à la fourchette Polini (60-78) pour un AV7 sans clapets — c\'est un candidat plausible si vous observez ces symptômes. Le mélange trop riche noie le moteur à pleine ouverture.',
      test30s: 'Roulez poignée essorée à fond en palier : si le moteur refuse de prendre ses tours en faisant un bruit saccadé de "4-temps" avec fumée bleue, mais reprend un peu de vitesse dès que vous relâchez légèrement l\'accélérateur, le gicleur est probablement trop gros.',
      solution: 'Ne sautez pas de cran : partez de votre gicleur {{GICLEUR}} actuel et descendez d\'UN SEUL cran à la fois en relisant la bougie à chaque essai (voir le protocole détaillé dans l\'onglet Carburation). Un gicleur trop petit appauvrit le mélange et peut serrer le moteur : n\'allez jamais trop bas sans vérifier la bougie.',
      actionTab: 'tab-carburation',
      actionText: 'Voir le protocole de réglage prudent du gicleur'
    },
    {
      id: 'trou-demarrage',
      keywords: ['trou', 'demarrage', 'feu rouge', 'pedaler', 'part pas', 'mollasson', 'lente au demarrage', 'mou au depart', 'decollage', 'patine pas', 'au depart'],
      title: 'Trou au Démarrage & Départ Poussif au Feu Rouge',
      scoreBadgeClass: '',
      cause: 'Les masselottes de première friction d\'origine sont trop lourdes (~45g) et collent dès 2 100 tr/min. À ce régime trop bas, le moteur AV7 n\'a pas encore de couple d\'admission et s\'effondre sous le poids de la mobylette.',
      test30s: 'À l\'arrêt sur sol plat, ouvrez les gaz en grand d\'un coup sans pédaler : si le moteur s\'assied immédiatement dans un son étouffé avant de prendre laborieusement ses tours au bout de 15 mètres, l\'embrayage colle beaucoup trop tôt.',
      solution: 'Monter vos masselottes Transval 36g neuves. Elles repoussent l\'accroche à 3 000 tr/min : le moteur est déjà dans sa zone de puissance quand la roue est entraînée.',
      actionTab: 'tab-tutos',
      actionText: 'Voir le tutoriel de pose des masselottes 36g'
    },
    {
      id: 'ampoules-grillent',
      keywords: ['grille', 'ampoule', 'ampoules', 'phare', 'clignotant grille', 'feu grille', 'tension', 'zener', 'survolte', 'explose', 'survoltage', '24v', 'eclairage claque', 'claquent'],
      title: 'Surtension & Ampoules du Phare/Feu Arrière Qui Grillent (Circuit 6V)',
      scoreBadgeClass: '',
      cause: 'Sur la 50 VLC, le phare et le feu arrière sont alimentés en 6V par le volant magnétique ; la diode Zener régule ce circuit 6V. Si elle est coupée, oxydée ou débranchée, la tension du circuit 6V monte trop haut en régime et grille les ampoules. Les clignotants, eux, ont leur propre bobine 12V indépendante : ils ne passent pas par la Zener.',
      test30s: 'Moteur tournant entre 3 000 et 4 500 tr/min, mesurez au multimètre la tension aux bornes du phare : elle doit se stabiliser entre 6,5 V et 8 V. Si elle continue de monter au-delà, la Zener est très probablement hors service.',
      solution: '⚠️ Avant toute intervention : ne débranchez rien tant que vous n\'avez pas le schéma électrique exact de VOTRE faisceau (les variantes existent selon les années). Si le test ci-dessus confirme une Zener morte, remplacez-la par une pièce équivalente plutôt que de la supprimer purement et simplement.',
      actionTab: 'tab-electricite',
      actionText: 'Voir le schéma électrique et le protocole de test'
    },
    {
      id: 'ralenti-emballe',
      keywords: ['emballe', 'ralenti haut', 'reste haut', 'prise d air', 'pipe', 'tourne vite tout seul', 'ne descend pas', 'bague teflon', 'joint spi', 'carbu monte haut', 's emballe'],
      title: 'Ralenti Anormal qui s\'Emballe tout seul (Prise d\'Air)',
      scoreBadgeClass: '',
      cause: 'Prise d\'air parasite en aval du boisseau du carburateur (bague plastique téflon d\'emmanchement sur la pipe de 15 mm, joint torique fendu, ou joint spi de vilebrequin côté allumage).',
      test30s: 'Moteur tournant au ralenti sur la béquille, vaporisez un coup rapide de dégraissant frein (ou passez un pinceau imbibé d\'essence) autour de l\'emmanchement de la pipe : si le régime moteur chute instantanément ou cale, la prise d\'air est localisée !',
      solution: 'Remplacer la bague téflon d\'emmanchement du carbu SHA et resserrer modérément le collier à 0,6 m.daN sans écraser la pipe.',
      actionTab: 'tab-carburation',
      actionText: 'Voir le montage discret du carbu SHA 15'
    },
    {
      id: 'castagnettes-vario',
      keywords: ['castagnette', 'cliquetis', 'bruit vario', 'bruit metallique', 'claquement ralenti', 'aiguille', 'jeu radial', 'canon', 'cliquete', 'bruit tambour'],
      title: 'Cliquetis Métallique & Bruit de Castagnettes au Ralenti',
      scoreBadgeClass: '',
      cause: 'La cage à aiguilles intérieure du canon de variateur (15x19x22.5) a ses rouleaux usés ou aplatis. Au ralenti au feu rouge, le tambour d\'embrayage prend du jeu radial et bat contre le canon métallique.',
      test30s: 'Moteur éteint, saisissez le tambour d\'embrayage à deux mains et secouez-le de haut en bas : vous constaterez un jeu radial perceptible d\'un demi-millimètre avec un claquement métallique.',
      solution: 'Monter votre cage à aiguilles RSM (réf 14712RSM) neuve garnie de graisse lithium. Les 3 galets élimineront aussi le tintement des 4 billes d\'origine.',
      actionTab: 'tab-tutos',
      actionText: 'Voir le tutoriel de pose de la cage à aiguilles'
    },
    {
      id: 'plafonne-vibrations',
      keywords: ['plafonne', '45 km', 'vibre', 'vibrations', 'avance pas', 'mouline', 'silentbloc', 'en travers', 'vitesse max', 'ne depasse pas', 'hurle'],
      title: 'Plafonnement à 45 km/h & Fortes Vibrations Châssis',
      scoreBadgeClass: '',
      cause: 'Silentblocs de culasse craquelés ou courroie usée (< 13 mm de large). Lorsque le moteur recule sous l\'effet du variateur, il se met en diagonale : la courroie s\'use de biais sur les joues et ne peut plus monter au sommet.',
      test30s: 'Moteur coupé, prenez la culasse à la main et tirez-la latéralement de gauche à droite : si le bloc bouge de plus de 2 mm dans son support de cadre, les silentblocs élastiques sont morts.',
      solution: 'Remplacer les 2 silentblocs de culasse et vérifier que votre courroie Hutchinson crantée neuve mesure bien 14 mm de large.',
      actionTab: 'tab-embrayage',
      actionText: 'Voir les vérifications Silentblocs & Courroie'
    },
    {
      id: 'clignotants-fixes',
      keywords: ['clignotant', 'clignotants', 'reste fixe', 'reste allume', 'ne clignote pas', 'clignote plus', 'centrale', 'comodo', 'clignotent pas'],
      title: 'Clignotants Allumés Fixes sans Aucun Clignotement',
      scoreBadgeClass: '',
      cause: 'Les clignotants de la 50 VLC ont leur propre bobine 12V indépendante (pas liée au circuit 6V d\'éclairage). La centrale clignotante thermique a besoin d\'une intensité assez proche de celle prévue (ampoules 12V 21W) et d\'une masse franche pour chauffer et ouvrir le contact.',
      test30s: 'Vérifiez la puissance gravée sur le culot de vos ampoules de clignotants : des ampoules trop faibles (5W, 10W) ou une mauvaise masse peuvent empêcher la centrale de chauffer, donc de clignoter.',
      solution: 'Conservez des ampoules 12V 21W à filaments et vérifiez la masse (cosses propres, pas de rouille) entre la centrale, le comodo et le cadre.',
      actionTab: 'tab-electricite',
      actionText: 'Voir le câblage de la centrale clignotante'
    },
    {
      id: 'courroie-patine',
      keywords: ['couine', 'patine', 'glisse', 'courroie', 'cirer', 'siffle', 'odeur caoutchouc', 'sifflement', 'glissement'],
      title: 'Sifflement Aigu & Patinage de la Courroie au Démarrage',
      scoreBadgeClass: '',
      cause: 'Graisse liquide projetée sur les flancs de la courroie (souvent suite à un graissage excessif du variateur) ou ressorts moteur détendus ne maintenant pas assez la contre-pression.',
      test30s: 'Passez un chiffon blanc propre sur les flancs intérieurs en biseau de votre courroie : si le chiffon ressort noir et huileux, vos joues de variateur sont contaminées.',
      solution: 'Dégraisser intégralement les joues du variateur et de la poulie au nettoyant frein. Rappel : la joue à galets se monte STRICTEMENT À SEC ! Poser vos ressorts moteur zingués neufs.',
      actionTab: 'tab-variateur',
      actionText: 'Voir les consignes de montage à sec du variateur'
    }
  ];

  // Nettoyage et normalisation de texte (accents, ponctuation)
  function normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .trim();
  }

  // Moteur d'analyse lexicale & calcul de score
  function analyzeUserSymptom(queryText) {
    const cleanQuery = normalizeText(queryText);
    if (!cleanQuery) {
      showEmptyMecanoState();
      return;
    }

    const words = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    const scoredResults = [];

    mecanoKnowledgeBase.forEach(item => {
      let score = 0;
      item.keywords.forEach(kw => {
        const cleanKw = normalizeText(kw);
        // Correspondance de phrase exacte
        if (cleanQuery.includes(cleanKw)) {
          score += 30;
        } else {
          // Correspondance par mot
          const kwWords = cleanKw.split(/\s+/);
          kwWords.forEach(kww => {
            if (words.includes(kww)) {
              score += 10;
            }
          });
        }
      });

      if (score > 0) {
        scoredResults.push({ item, score });
      }
    });

    scoredResults.sort((a, b) => b.score - a.score);

    if (scoredResults.length > 0 && scoredResults[0].score >= 15) {
      renderMecanoResults(scoredResults.slice(0, 2));
    } else {
      renderMecanoFallback(cleanQuery);
    }
  }

  function showEmptyMecanoState() {
    if (!mecanoResultsArea) return;
    mecanoResultsArea.innerHTML = `
      <div class="mecano-empty-state">
        <span class="mecano-empty-icon">🔧</span>
        <p>Tapez votre problème ci-dessus ou cliquez sur une suggestion pour lancer le diagnostic instantané.</p>
      </div>
    `;
    if (btnClearMecano) btnClearMecano.style.display = 'none';
  }

  function renderMecanoResults(results) {
    if (!mecanoResultsArea) return;
    if (btnClearMecano) btnClearMecano.style.display = 'block';

    let html = '';
    results.forEach(({ item, score }, index) => {
      const isTop = index === 0;
      const badgeClass = isTop ? '' : 'score-medium';

      html += `
        <div class="mecano-result-card">
          <div class="result-card-header">
            <span class="result-score-badge ${badgeClass}">
              <span>🎯</span>
              <span>${isTop ? 'Piste la plus probable (mots-clés les plus proches)' : 'Autre piste possible'}</span>
            </span>
          </div>

          <h4 class="result-title">${item.title}</h4>

          <div style="font-size: 0.88rem; line-height: 1.5; margin-bottom: 8px;">
            <strong style="color: var(--primary-orange); text-transform: uppercase; font-size: 0.78rem; display: block;">Cause Mécanique Constatée (hypothèse à vérifier) :</strong>
            ${item.cause.replace(/\{\{GICLEUR\}\}/g, currentProfile.gicleur)}
          </div>

          <div class="test-30s-box">
            <strong>⏱️ Le Test Rapide de 30 Secondes (Sans Outil) :</strong>
            ${item.test30s}
          </div>

          <div style="font-size: 0.86rem; color: var(--text-main); margin-bottom: 10px;">
            <strong style="color: #16A34A; text-transform: uppercase; font-size: 0.78rem; display: block;">Remède d'Atelier Immédiat :</strong>
            ${item.solution.replace(/\{\{GICLEUR\}\}/g, currentProfile.gicleur)}
          </div>

          <div class="mecano-action-row">
            <button class="btn-goto-solution" data-goto-tab="${item.actionTab}">
              <span>${item.actionText}</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      `;
    });

    mecanoResultsArea.innerHTML = html;

    // Attachement des clics sur les boutons d'action
    const gotoButtons = mecanoResultsArea.querySelectorAll('.btn-goto-solution');
    gotoButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-goto-tab');
        const navBtn = document.querySelector(`.nav-btn[data-tab="${targetTab}"]`);
        if (navBtn) {
          navBtn.click();
        }
      });
    });
  }

  function renderMecanoFallback(query) {
    if (!mecanoResultsArea) return;
    if (btnClearMecano) btnClearMecano.style.display = 'block';

    mecanoResultsArea.innerHTML = `
      <div class="mecano-result-card" style="border-color: #F59E0B;">
        <div class="result-card-header">
          <span class="result-score-badge score-medium">
            <span>🔍</span>
            <span>Diagnostic Général (Termes non discriminants : "${query}")</span>
          </span>
        </div>
        <h4 class="result-title">Guide d'Élimination Méthodique AV7</h4>
        <p style="font-size: 0.88rem; margin-bottom: 12px;">
          Votre description ne correspond pas à un mot-clé unique. Sur une Motobécane 50V, 90% des pannes se résument à l'un de ces 3 contrôles rapides :
        </p>
        <ul class="bullet-list" style="font-size: 0.85rem; margin-bottom: 14px;">
          <li><strong>1. Allumage :</strong> Démontez la bougie, vérifiez si l'étincelle est bleue et franche (si jaune/faible = condensateur fatigué).</li>
          <li><strong>2. Carburation :</strong> Inspectez la couleur de la bougie après roulage (marron chocolat = bon | blanche = gicleur trop petit | noire huileuse = trop riche).</li>
          <li><strong>3. Prise d'air :</strong> Vérifiez le serrage du carburateur sur sa pipe et l'état du joint spi de vilebrequin.</li>
        </ul>
        <div class="mecano-action-row">
          <button class="btn-goto-solution" data-goto-tab="tab-carburation">
            <span>Vérifier la Carburation ➔</span>
          </button>
        </div>
      </div>
    `;

    const gotoBtn = mecanoResultsArea.querySelector('.btn-goto-solution');
    if (gotoBtn) {
      gotoBtn.addEventListener('click', () => {
        const navBtn = document.querySelector(`.nav-btn[data-tab="tab-carburation"]`);
        if (navBtn) navBtn.click();
      });
    }
  }

  // Écouteurs d'événements pour le Mécano IA
  if (mecanoInput && btnAskMecano) {
    btnAskMecano.addEventListener('click', () => {
      analyzeUserSymptom(mecanoInput.value);
    });

    mecanoInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        analyzeUserSymptom(mecanoInput.value);
      }
    });

    mecanoInput.addEventListener('input', () => {
      if (mecanoInput.value.trim().length > 0) {
        if (btnClearMecano) btnClearMecano.style.display = 'block';
      } else {
        showEmptyMecanoState();
      }
    });
  }

  if (btnClearMecano) {
    btnClearMecano.addEventListener('click', () => {
      if (mecanoInput) mecanoInput.value = '';
      showEmptyMecanoState();
      mecanoInput.focus();
    });
  }

  // Clic sur les pills d'exemples fréquents
  mecanoPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const query = pill.getAttribute('data-query');
      if (mecanoInput) {
        mecanoInput.value = query;
        analyzeUserSymptom(query);
      }
    });
  });

  /* -----------------------------------------------------------------
   * 14. CALCULATEUR & MÉLANGEUR 2-TEMPS INTELLIGENT
   * ----------------------------------------------------------------- */
  const oilFuelSlider = document.getElementById('oil-fuel-slider');
  const oilFuelVal = document.getElementById('oil-fuel-val');
  const oilPriceSlider = document.getElementById('oil-price-slider');
  const oilPriceVal = document.getElementById('oil-price-val');
  const oilTotalCost = document.getElementById('oil-total-cost');
  const oilShortcuts = document.querySelectorAll('.oil-shortcut-btn');
  const oilRatioButtons = document.querySelectorAll('.oil-ratio-btn');
  const oilVolumeMl = document.getElementById('oil-volume-ml');
  const oilVolumeEquiv = document.getElementById('oil-volume-equiv');
  const oilLevelRect = document.getElementById('oil-level-rect');
  const oilAdviceBanner = document.getElementById('oil-advice-banner');

  let currentOilRatio = 2.0;

  function updateOilCalculation() {
    if (!oilFuelSlider || !oilVolumeMl) return;

    const fuelLiters = parseFloat(oilFuelSlider.value);
    const isFullTank = Math.abs(fuelLiters - 5.2) < 0.05;

    if (oilFuelVal) {
      oilFuelVal.textContent = isFullTank ? '5,2 Litres (Plein 50V)' : `${fuelLiters.toFixed(1)} Litres`;
    }

    // Prix du carburant
    let pricePerLiter = 1.85;
    if (oilPriceSlider) {
      pricePerLiter = parseFloat(oilPriceSlider.value);
      if (oilPriceVal) oilPriceVal.textContent = `${pricePerLiter.toFixed(2)} € / L`;
    }

    if (oilTotalCost) {
      const totalCost = (fuelLiters * pricePerLiter).toFixed(2);
      oilTotalCost.textContent = `${totalCost.replace('.', ',')} €`;
    }

    // Volume d'huile en mL = Litres d'essence * Pourcentage * 10
    const oilMl = Math.round(fuelLiters * currentOilRatio * 10);
    oilVolumeMl.textContent = `${oilMl} mL`;

    // Équivalences pratiques en bouchons et graduations
    const capsCount = Math.round(oilMl / 10);
    if (oilVolumeEquiv) {
      oilVolumeEquiv.innerHTML = `Soit environ <strong>${capsCount} bouchons</strong> de bidon 1L (~10 mL) ou <strong>${oilMl} cm³</strong>`;
    }

    // Animation du niveau dans l'éprouvette graduée SVG.
    // Échelle alignée sur les graduations réellement dessinées dans le SVG
    // (50 mL → y=115, 100 mL → y=80, 150 mL → y=45, soit 0,7 px/mL), pour
    // que le niveau de remplissage corresponde vraiment aux repères affichés.
    if (oilLevelRect) {
      const beakerBottomY = 168;
      const topY = Math.max(20, 150 - 0.7 * oilMl);
      oilLevelRect.setAttribute('y', topY);
      oilLevelRect.setAttribute('height', Math.max(2, beakerBottomY - topY));
    }

    // Conseils techniques dynamiques
    if (oilAdviceBanner) {
      if (currentOilRatio === 1.5) {
        oilAdviceBanner.innerHTML = '🚨 <strong style="color: #EF4444;">DANGER SERRAGE :</strong> Dosage trop faible pour un AV7 refroidi par air ! Risque d\'échauffement destructeur.';
      } else if (currentOilRatio === 2.0) {
        oilAdviceBanner.innerHTML = '✨ <strong style="color: #10B981;">DOSAGE PARFAIT :</strong> Ratio optimal avec de l\'huile 100% synthèse. Zéro fumée, lubrification impeccable du pied de bielle.';
      } else if (currentOilRatio === 2.5) {
        oilAdviceBanner.innerHTML = '👍 <strong>Standard Motobécane :</strong> Idéal si vous utilisez de l\'huile semi-synthèse standard de station-service.';
      } else if (currentOilRatio === 3.0) {
        oilAdviceBanner.innerHTML = '🔧 <strong>Plein de Rodage :</strong> Recommandé pendant les 100 premiers kilomètres après changement de piston, segments ou cylindre.';
      }
    }
  }

  if (oilFuelSlider) {
    oilFuelSlider.addEventListener('input', () => {
      const currentVal = parseFloat(oilFuelSlider.value);
      oilShortcuts.forEach(btn => {
        const btnVal = parseFloat(btn.getAttribute('data-fuel'));
        if (Math.abs(btnVal - currentVal) < 0.05) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      updateOilCalculation();
    });
  }

  if (oilPriceSlider) {
    oilPriceSlider.addEventListener('input', updateOilCalculation);
  }

  oilShortcuts.forEach(btn => {
    btn.addEventListener('click', () => {
      const fuelVal = parseFloat(btn.getAttribute('data-fuel'));
      if (oilFuelSlider) {
        oilFuelSlider.value = fuelVal;
      }
      oilShortcuts.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateOilCalculation();
    });
  });

  oilRatioButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      currentOilRatio = parseFloat(btn.getAttribute('data-ratio'));
      oilRatioButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateOilCalculation();
    });
  });

  // Boutons génériques de saut d'onglet (ex: dans carburation vers melangeur)
  const tabJumpButtons = document.querySelectorAll('.btn-goto-tab');
  tabJumpButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-target-tab');
      const navBtn = document.querySelector(`.nav-btn[data-tab="${targetTab}"]`);
      if (navBtn) navBtn.click();
    });
  });

  /* -----------------------------------------------------------------
   * 15. CATALOGUE RÉFÉRENCES, PRIX & MARCHANDS SPÉCIALISÉS
   * ----------------------------------------------------------------- */
  const refSearchInput = document.getElementById('ref-search-input');
  const refSearchClear = document.getElementById('ref-search-clear');
  const refMerchantSelect = document.getElementById('ref-merchant-select');
  const refFilterPills = document.querySelectorAll('.ref-filter-pill');
  const refCards = document.querySelectorAll('.ref-card');
  const refTableRows = document.querySelectorAll('.ref-table-row');
  const refNoResults = document.getElementById('ref-no-results');
  const btnResetRefFilters = document.getElementById('btn-reset-ref-filters');

  const refViewCardsBtn = document.getElementById('ref-view-cards');
  const refViewTableBtn = document.getElementById('ref-view-table');
  const refCardsGrid = document.getElementById('ref-cards-grid');
  const refTableView = document.getElementById('ref-table-view');

  let activeRefCategory = 'all';
  let activeRefMerchant = 'all';
  let activeRefQuery = '';

  function filterReferences() {
    let matchCount = 0;

    refCards.forEach(card => {
      const categories = card.getAttribute('data-category') || '';
      const merchants = card.getAttribute('data-merchants') || '';
      const searchData = (card.getAttribute('data-search') || '').toLowerCase();

      const matchesCat = activeRefCategory === 'all' || categories.includes(activeRefCategory);
      const matchesMerchant = activeRefMerchant === 'all' || merchants.includes(activeRefMerchant);
      const matchesQuery = !activeRefQuery || searchData.includes(activeRefQuery);

      if (matchesCat && matchesMerchant && matchesQuery) {
        card.style.display = 'flex';
        matchCount++;
      } else {
        card.style.display = 'none';
      }
    });

    refTableRows.forEach(row => {
      const categories = row.getAttribute('data-category') || '';
      const merchants = row.getAttribute('data-merchants') || '';
      const searchData = (row.getAttribute('data-search') || '').toLowerCase();

      const matchesCat = activeRefCategory === 'all' || categories.includes(activeRefCategory);
      const matchesMerchant = activeRefMerchant === 'all' || merchants.includes(activeRefMerchant);
      const matchesQuery = !activeRefQuery || searchData.includes(activeRefQuery);

      if (matchesCat && matchesMerchant && matchesQuery) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });

    if (refNoResults) {
      refNoResults.style.display = matchCount === 0 ? 'block' : 'none';
    }

    if (refSearchClear) {
      refSearchClear.style.display = activeRefQuery ? 'block' : 'none';
    }
  }

  if (refSearchInput) {
    refSearchInput.addEventListener('input', (e) => {
      activeRefQuery = e.target.value.trim().toLowerCase();
      filterReferences();
    });
  }

  if (refSearchClear) {
    refSearchClear.addEventListener('click', () => {
      if (refSearchInput) refSearchInput.value = '';
      activeRefQuery = '';
      filterReferences();
    });
  }

  if (refMerchantSelect) {
    refMerchantSelect.addEventListener('change', (e) => {
      activeRefMerchant = e.target.value;
      filterReferences();
    });
  }

  refFilterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      refFilterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeRefCategory = pill.getAttribute('data-category') || 'all';
      filterReferences();
    });
  });

  if (btnResetRefFilters) {
    btnResetRefFilters.addEventListener('click', () => {
      activeRefCategory = 'all';
      activeRefMerchant = 'all';
      activeRefQuery = '';
      if (refSearchInput) refSearchInput.value = '';
      if (refMerchantSelect) refMerchantSelect.value = 'all';
      refFilterPills.forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-category') === 'all');
      });
      filterReferences();
    });
  }

  // Toggle View: Cartes vs Tableau
  if (refViewCardsBtn && refViewTableBtn && refCardsGrid && refTableView) {
    refViewCardsBtn.addEventListener('click', () => {
      refViewCardsBtn.classList.add('active');
      refViewTableBtn.classList.remove('active');
      refCardsGrid.style.display = 'grid';
      refTableView.style.display = 'none';
    });

    refViewTableBtn.addEventListener('click', () => {
      refViewTableBtn.classList.add('active');
      refViewCardsBtn.classList.remove('active');
      refCardsGrid.style.display = 'none';
      refTableView.style.display = 'block';
    });
  }

  // Boutons "Voir dans le guide ➔" depuis les cartes références
  const jumpGuideButtons = document.querySelectorAll('.btn-jump-guide');
  jumpGuideButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-jump-tab');
      if (targetTab) {
        const navBtn = document.querySelector(`.nav-btn[data-tab="${targetTab}"]`);
        if (navBtn) {
          navBtn.click();
        }
      }
    });
  });

  // Fonction globale de saut vers une référence depuis n'importe où dans le site
  function jumpToRef(refCode) {
    if (!refCode) return;

    // Basculer vers l'onglet Références
    const refNavBtn = document.querySelector('.nav-btn[data-tab="tab-references"]');
    if (refNavBtn) refNavBtn.click();

    // Réinitialiser les filtres pour s'assurer que la carte est visible
    activeRefCategory = 'all';
    activeRefMerchant = 'all';
    activeRefQuery = '';
    if (refSearchInput) refSearchInput.value = '';
    if (refMerchantSelect) refMerchantSelect.value = 'all';
    refFilterPills.forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-category') === 'all');
    });
    filterReferences();

    // S'assurer de la vue cartes
    if (refViewCardsBtn) refViewCardsBtn.click();

    // Rechercher la carte correspondante (par id ou data-search)
    setTimeout(() => {
      let targetCard = document.getElementById(`ref-${refCode}`);
      if (!targetCard) {
        refCards.forEach(c => {
          const searchData = (c.getAttribute('data-search') || '').toLowerCase();
          if (searchData.includes(refCode.toLowerCase())) {
            targetCard = c;
          }
        });
      }

      if (targetCard) {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetCard.classList.add('ref-highlight-pulse');
        setTimeout(() => {
          targetCard.classList.remove('ref-highlight-pulse');
        }, 2600);
      }
    }, 120);
  }

  window.jumpToRef = jumpToRef;

  // Écouteur sur tous les boutons de saut de référence (.ref-jump-pill)
  document.querySelectorAll('.ref-jump-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const code = pill.getAttribute('data-ref');
      jumpToRef(code);
    });
  });

  updateOilCalculation();

  /* -----------------------------------------------------------------
   * BURGER MENU — Navigation mobile (drawer latéral)
   * ----------------------------------------------------------------- */
  const btnBurger   = document.getElementById('btn-burger');
  const btnCloseNav = document.getElementById('btn-close-nav');
  const navDrawer   = document.getElementById('nav-drawer');
  const navOverlay  = document.getElementById('nav-overlay');
  const mainNavMenu = document.getElementById('main-nav-menu');

  function openMobileNav() {
    if (!navDrawer) return;
    navDrawer.classList.add('open');
    navOverlay.classList.add('visible');
    btnBurger.classList.add('open');
    btnBurger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // évite le scroll du fond
  }

  function closeMobileNav() {
    if (!navDrawer) return;
    navDrawer.classList.remove('open');
    navOverlay.classList.remove('visible');
    btnBurger.classList.remove('open');
    btnBurger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (btnBurger)   btnBurger.addEventListener('click', openMobileNav);
  if (btnCloseNav) btnCloseNav.addEventListener('click', closeMobileNav);
  if (navOverlay)  navOverlay.addEventListener('click', closeMobileNav);

  // Fermer le drawer quand on choisit un onglet
  if (mainNavMenu) {
    mainNavMenu.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        // Fermer le drawer si on est en mode mobile (drawer visible)
        if (navDrawer && navDrawer.classList.contains('open')) {
          closeMobileNav();
        }
      });
    });
  }

  // Fermer avec la touche Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navDrawer && navDrawer.classList.contains('open')) {
      closeMobileNav();
    }
  });

  /* -----------------------------------------------------------------
   * 16. PWA — INSTALLATION & FONCTIONNEMENT HORS LIGNE (SERVICE WORKER)
   * -----------------------------------------------------------------
   * Ne fonctionne que si le site est servi en http(s) (ou localhost) : les
   * navigateurs refusent les service workers sur une page ouverte en
   * file:// (double-clic sur index.html). Voir CLAUDE.md pour le détail.
   * ----------------------------------------------------------------- */
  const pwaBanner = document.getElementById('pwa-update-banner');
  const btnPwaReload = document.getElementById('btn-pwa-reload');
  const btnPwaDismiss = document.getElementById('btn-pwa-dismiss');
  let pwaWaitingWorker = null;

  function showPwaUpdateBanner(worker) {
    pwaWaitingWorker = worker;
    if (pwaBanner) pwaBanner.hidden = false;
  }

  if (btnPwaReload) {
    btnPwaReload.addEventListener('click', () => {
      if (pwaWaitingWorker) pwaWaitingWorker.postMessage('SKIP_WAITING');
    });
  }
  if (btnPwaDismiss) {
    btnPwaDismiss.addEventListener('click', () => {
      if (pwaBanner) pwaBanner.hidden = true;
    });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').then((registration) => {
        // Une version déjà en attente (onglet resté ouvert pendant une mise à jour)
        if (registration.waiting) showPwaUpdateBanner(registration.waiting);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // "installed" + un controller déjà actif = vraie mise à jour (pas la 1ère installation)
              showPwaUpdateBanner(newWorker);
            }
          });
        });
      }).catch((err) => {
        console.warn('[PWA] Enregistrement du service worker impossible :', err);
      });

      // Une fois le nouveau SW activé (après clic sur "Actualiser"), recharger la page
      let hasReloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hasReloaded) return;
        hasReloaded = true;
        window.location.reload();
      });
    });
  }

  /* -----------------------------------------------------------------
   * 17. CARNET D'ENTRETIEN & SUIVI KILOMÉTRIQUE
   * -----------------------------------------------------------------
   * Tout est fourni par l'utilisateur (relevé compteur, intervalles de
   * rappel, entrées de carnet) : aucune valeur par défaut n'est inventée
   * ici, conformément à la règle du projet de ne jamais deviner un chiffre
   * non sourcé. Persisté via `store` (localStorage), propre à ce navigateur.
   * ----------------------------------------------------------------- */
  const ODO_KEY = 'motobecane_50vcl_odometer';
  const RAPPELS_KEY = 'motobecane_50vcl_rappels';
  const CARNET_KEY = 'motobecane_50vcl_carnet';

  const odoInput = document.getElementById('odo-input');
  const btnOdoSave = document.getElementById('btn-odo-save');
  const odoStatus = document.getElementById('odo-status');

  const rappelsList = document.getElementById('rappels-list');
  const rappelLabelInput = document.getElementById('rappel-label-input');
  const rappelIntervalInput = document.getElementById('rappel-interval-input');
  const btnRappelAdd = document.getElementById('btn-rappel-add');

  const carnetDateInput = document.getElementById('carnet-date-input');
  const carnetKmInput = document.getElementById('carnet-km-input');
  const carnetTitreInput = document.getElementById('carnet-titre-input');
  const carnetNoteInput = document.getElementById('carnet-note-input');
  const btnCarnetAdd = document.getElementById('btn-carnet-add');
  const carnetEntriesList = document.getElementById('carnet-entries-list');
  const carnetEmptyMsg = document.getElementById('carnet-empty-msg');

  function genId() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function formatDateFr(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-');
    if (!y || !m || !d) return isoDate;
    return `${d}/${m}/${y}`;
  }

  // --- Kilométrage ---
  function loadOdo() {
    try {
      const raw = store.get(ODO_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function saveOdo(km) {
    const data = { km, updatedAt: new Date().toISOString().slice(0, 10) };
    store.set(ODO_KEY, JSON.stringify(data));
    return data;
  }

  function renderOdoStatus() {
    if (!odoStatus) return;
    const odo = loadOdo();
    if (!odo) {
      odoStatus.textContent = 'Aucun relevé enregistré pour l\'instant.';
      if (odoInput) odoInput.value = '';
    } else {
      odoStatus.textContent = `Dernier relevé : ${odo.km.toLocaleString('fr-FR')} km (le ${formatDateFr(odo.updatedAt)}).`;
      if (odoInput) odoInput.value = odo.km;
    }
    renderRappels(); // les seuils dépendent du kilométrage actuel
  }

  if (btnOdoSave) {
    btnOdoSave.addEventListener('click', () => {
      const val = parseInt(odoInput.value, 10);
      if (isNaN(val) || val < 0) {
        alert('Entrez un kilométrage valide (nombre positif).');
        return;
      }
      saveOdo(val);
      renderOdoStatus();
    });
  }

  // --- Rappels d'entretien ---
  function loadRappels() {
    try {
      const raw = store.get(RAPPELS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveRappels(list) {
    store.set(RAPPELS_KEY, JSON.stringify(list));
  }

  function renderRappels() {
    if (!rappelsList) return;
    const rappels = loadRappels();
    const odo = loadOdo();
    const currentKm = odo ? odo.km : null;

    if (rappels.length === 0) {
      rappelsList.innerHTML = '<p class="text-sm text-muted">Aucun rappel défini pour l\'instant.</p>';
      return;
    }

    rappelsList.innerHTML = rappels.map((r) => {
      const lastDone = typeof r.lastDoneKm === 'number' ? r.lastDoneKm : null;
      const nextDueKm = lastDone !== null ? lastDone + r.intervalKm : null;
      let statusText = 'Jamais marqué comme fait — pas de seuil calculable.';
      let isDue = false;

      if (lastDone !== null) {
        statusText = `Dernier fait à ${lastDone.toLocaleString('fr-FR')} km · Prochain vers ${nextDueKm.toLocaleString('fr-FR')} km`;
        if (currentKm !== null && currentKm >= nextDueKm) {
          isDue = true;
          statusText += ` · ⚠️ dépassé de ${(currentKm - nextDueKm).toLocaleString('fr-FR')} km`;
        } else if (currentKm !== null) {
          statusText += ` (reste ${(nextDueKm - currentKm).toLocaleString('fr-FR')} km)`;
        }
      }

      return `
        <div class="rappel-item${isDue ? ' rappel-due' : ''}" data-rappel-id="${r.id}">
          <div class="rappel-item-main">
            <strong>${isDue ? '🔴 ' : ''}${r.label}</strong>
            <span class="rappel-item-sub">Intervalle : ${r.intervalKm.toLocaleString('fr-FR')} km — ${statusText}</span>
          </div>
          <div style="display:flex; gap:4px; flex-shrink:0;">
            <button class="btn btn-outline btn-sm btn-rappel-done" data-rappel-id="${r.id}" type="button" title="Marquer comme fait au kilométrage actuel">✓ Fait</button>
            <button class="btn-icon-delete btn-rappel-delete" data-rappel-id="${r.id}" type="button" title="Supprimer ce rappel">✕</button>
          </div>
        </div>
      `;
    }).join('');
  }

  if (btnRappelAdd) {
    btnRappelAdd.addEventListener('click', () => {
      const label = rappelLabelInput.value.trim();
      const interval = parseInt(rappelIntervalInput.value, 10);
      if (!label) {
        alert('Donnez un nom à ce rappel.');
        return;
      }
      if (isNaN(interval) || interval <= 0) {
        alert('Entrez un intervalle en km valide (nombre positif).');
        return;
      }
      const rappels = loadRappels();
      rappels.push({ id: genId(), label, intervalKm: interval, lastDoneKm: null });
      saveRappels(rappels);
      rappelLabelInput.value = '';
      rappelIntervalInput.value = '';
      renderRappels();
    });
  }

  if (rappelsList) {
    rappelsList.addEventListener('click', (e) => {
      const doneBtn = e.target.closest('.btn-rappel-done');
      const delBtn = e.target.closest('.btn-rappel-delete');
      if (doneBtn) {
        const id = doneBtn.getAttribute('data-rappel-id');
        const odo = loadOdo();
        if (!odo) {
          alert('Enregistrez d\'abord un relevé de kilométrage ci-dessus.');
          return;
        }
        const rappels = loadRappels();
        const r = rappels.find((x) => x.id === id);
        if (r) {
          r.lastDoneKm = odo.km;
          saveRappels(rappels);
          renderRappels();
        }
      } else if (delBtn) {
        const id = delBtn.getAttribute('data-rappel-id');
        if (confirm('Supprimer ce rappel ?')) {
          const rappels = loadRappels().filter((x) => x.id !== id);
          saveRappels(rappels);
          renderRappels();
        }
      }
    });
  }

  // --- Carnet d'entretien ---
  function loadCarnet() {
    try {
      const raw = store.get(CARNET_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveCarnet(list) {
    store.set(CARNET_KEY, JSON.stringify(list));
  }

  function renderCarnet() {
    if (!carnetEntriesList) return;
    const entries = loadCarnet().slice().sort((a, b) => (a.date < b.date ? 1 : -1));

    if (entries.length === 0) {
      carnetEntriesList.innerHTML = '';
      if (carnetEmptyMsg) carnetEmptyMsg.style.display = 'block';
      return;
    }
    if (carnetEmptyMsg) carnetEmptyMsg.style.display = 'none';

    carnetEntriesList.innerHTML = entries.map((entry) => `
      <div class="carnet-entry" data-entry-id="${entry.id}">
        <div class="carnet-entry-main">
          <strong>${entry.titre || '(Sans titre)'}</strong>
          <span class="carnet-entry-sub">${formatDateFr(entry.date)}${entry.km ? ' · ' + Number(entry.km).toLocaleString('fr-FR') + ' km' : ''}</span>
          ${entry.note ? `<div class="carnet-entry-note">${entry.note.replace(/</g, '&lt;')}</div>` : ''}
        </div>
        <button class="btn-icon-delete btn-carnet-delete" data-entry-id="${entry.id}" type="button" title="Supprimer cette entrée">✕</button>
      </div>
    `).join('');
  }

  if (btnCarnetAdd) {
    btnCarnetAdd.addEventListener('click', () => {
      const date = carnetDateInput.value || new Date().toISOString().slice(0, 10);
      const km = carnetKmInput.value ? parseInt(carnetKmInput.value, 10) : null;
      const titre = carnetTitreInput.value.trim();
      const note = carnetNoteInput.value.trim();

      if (!titre) {
        alert('Décrivez brièvement l\'intervention (champ "Intervention").');
        return;
      }

      const entries = loadCarnet();
      entries.push({ id: genId(), date, km, titre, note });
      saveCarnet(entries);

      carnetDateInput.value = '';
      carnetKmInput.value = '';
      carnetTitreInput.value = '';
      carnetNoteInput.value = '';
      renderCarnet();
    });
  }

  if (carnetEntriesList) {
    carnetEntriesList.addEventListener('click', (e) => {
      const delBtn = e.target.closest('.btn-carnet-delete');
      if (delBtn) {
        const id = delBtn.getAttribute('data-entry-id');
        if (confirm('Supprimer cette entrée du carnet ?')) {
          const entries = loadCarnet().filter((x) => x.id !== id);
          saveCarnet(entries);
          renderCarnet();
        }
      }
    });
  }

  if (odoInput || rappelsList || carnetEntriesList) {
    renderOdoStatus();
    renderRappels();
    renderCarnet();
  }

  /* -----------------------------------------------------------------
   * 18. CALCULATEUR DE BUDGET (ONGLET RÉFÉRENCES)
   * -----------------------------------------------------------------
   * Construit dynamiquement à partir des .ref-card déjà présentes dans le
   * DOM (catalogue de l'onglet Références) : aucun prix n'est dupliqué ou
   * ressaisi ici, pour ne jamais désynchroniser le budget du catalogue.
   * ----------------------------------------------------------------- */
  const BUDGET_KEY = 'motobecane_50vcl_budget_owned';
  const budgetChecklist = document.getElementById('budget-checklist');
  const budgetTotalOwned = document.getElementById('budget-total-owned');
  const budgetTotalRemaining = document.getElementById('budget-total-remaining');
  const budgetTotalAll = document.getElementById('budget-total-all');
  const budgetNote = document.getElementById('budget-note');
  const btnBudgetReset = document.getElementById('btn-budget-reset');

  function formatEuro(n) {
    return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  }

  function getBudgetItems() {
    const cards = document.querySelectorAll('.ref-card');
    let hasPerUnit = false;
    const items = Array.from(cards).map((card) => {
      const id = card.id || genId();
      const titleEl = card.querySelector('.ref-card-title');
      const priceEl = card.querySelector('.ref-price-tag');
      const statusEl = card.querySelector('.ref-status-badge');
      const title = titleEl ? titleEl.textContent.trim() : '(Sans nom)';
      const priceRaw = priceEl ? priceEl.textContent.trim() : '';
      const perUnit = /\/\s*L\b/i.test(priceRaw);
      if (perUnit) hasPerUnit = true;
      const match = priceRaw.replace(/\s/g, '').match(/([\d]+,[\d]+)/);
      const priceValue = match ? parseFloat(match[1].replace(',', '.')) : 0;
      const ownedByDefault = !!statusEl && /status-(achete|installe)/.test(statusEl.className);
      return { id, title, priceRaw, priceValue, ownedByDefault, perUnit };
    });
    return { items, hasPerUnit };
  }

  function loadBudgetOverrides() {
    try {
      const raw = store.get(BUDGET_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function saveBudgetOverrides(overrides) {
    store.set(BUDGET_KEY, JSON.stringify(overrides));
  }

  function renderBudget() {
    if (!budgetChecklist) return;
    const { items, hasPerUnit } = getBudgetItems();
    if (items.length === 0) return;

    const overrides = loadBudgetOverrides();

    budgetChecklist.innerHTML = items.map((item) => {
      const checked = Object.prototype.hasOwnProperty.call(overrides, item.id) ? overrides[item.id] : item.ownedByDefault;
      return `
        <div class="budget-item">
          <label>
            <input type="checkbox" class="budget-item-checkbox" data-budget-id="${item.id}" ${checked ? 'checked' : ''}>
            <span class="budget-item-name">${item.title}</span>
          </label>
          <span class="budget-item-price">${item.priceRaw || '—'}</span>
        </div>
      `;
    }).join('');

    let ownedTotal = 0;
    let allTotal = 0;
    items.forEach((item) => {
      const checked = Object.prototype.hasOwnProperty.call(overrides, item.id) ? overrides[item.id] : item.ownedByDefault;
      allTotal += item.priceValue;
      if (checked) ownedTotal += item.priceValue;
    });
    const remainingTotal = allTotal - ownedTotal;

    if (budgetTotalOwned) budgetTotalOwned.textContent = formatEuro(ownedTotal);
    if (budgetTotalRemaining) budgetTotalRemaining.textContent = formatEuro(remainingTotal);
    if (budgetTotalAll) budgetTotalAll.textContent = formatEuro(allTotal);
    if (budgetNote) {
      budgetNote.textContent = hasPerUnit
        ? 'Remarque : un ou plusieurs prix sont au litre (ex. huile 2T) et comptés ici pour une unité — ajustez mentalement selon votre consommation réelle.'
        : '';
    }
  }

  if (budgetChecklist) {
    budgetChecklist.addEventListener('change', (e) => {
      const cb = e.target.closest('.budget-item-checkbox');
      if (!cb) return;
      const id = cb.getAttribute('data-budget-id');
      const overrides = loadBudgetOverrides();
      overrides[id] = cb.checked;
      saveBudgetOverrides(overrides);
      renderBudget();
    });
  }

  if (btnBudgetReset) {
    btnBudgetReset.addEventListener('click', () => {
      if (confirm('Réinitialiser toutes les cases aux statuts par défaut du catalogue ?')) {
        saveBudgetOverrides({});
        renderBudget();
      }
    });
  }

  if (budgetChecklist) {
    renderBudget();
  }

  /* -----------------------------------------------------------------
   * 19. GLOSSAIRE DES TERMES TECHNIQUES
   * ----------------------------------------------------------------- */
  const glossaireSearch = document.getElementById('glossaire-search');
  const glossaireList = document.getElementById('glossaire-list');
  const glossaireEmptyMsg = document.getElementById('glossaire-empty-msg');

  function normalizeForSearch(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  if (glossaireSearch && glossaireList) {
    const glossaireItems = Array.from(glossaireList.querySelectorAll('.glossaire-item'));
    glossaireSearch.addEventListener('input', () => {
      const query = normalizeForSearch(glossaireSearch.value.trim());
      let visibleCount = 0;
      glossaireItems.forEach((item) => {
        const haystack = normalizeForSearch(item.textContent || '');
        const match = query === '' || haystack.includes(query);
        item.style.display = match ? '' : 'none';
        if (match) visibleCount += 1;
      });
      if (glossaireEmptyMsg) {
        glossaireEmptyMsg.style.display = visibleCount === 0 ? '' : 'none';
      }
    });
  }

  /* -----------------------------------------------------------------
   * 20. EXPORT PDF UNIFIÉ
   * -----------------------------------------------------------------
   * Construit une vue imprimable consolidée (profil, valeurs confirmées,
   * carnet, rappels, budget) à partir des données déjà présentes sur le
   * site (profil véhicule, store localStorage, DOM du budget) — aucune
   * donnée n'est dupliquée en dur ici, et aucune valeur non confirmée
   * n'est présentée comme certaine (voir CLAUDE.md §2 et §4).
   * ----------------------------------------------------------------- */
  const btnExportPdf = document.getElementById('btn-export-pdf');
  const printExportView = document.getElementById('print-export-view');

  function esc(str) {
    const div = document.createElement('div');
    div.textContent = String(str == null ? '' : str);
    return div.innerHTML;
  }

  function buildPrintExportView() {
    if (!printExportView) return;
    const profile = (typeof currentProfile !== 'undefined' && currentProfile) ? currentProfile : null;
    const todayStr = new Date().toLocaleDateString('fr-FR');

    let html = '';
    html += `<div class="print-section"><h1>Motobécane 50 VLC (AV7) — Résumé d'atelier</h1>`;
    html += `<p>Généré le ${esc(todayStr)} depuis le guide d'atelier interactif. Les valeurs marquées ⚠️ ne sont pas confirmées par une source fiable — voir l'onglet Archives du site pour le détail.</p></div>`;

    // --- Profil véhicule ---
    html += `<div class="print-section"><h2>Profil véhicule</h2>`;
    if (profile) {
      html += `<table><tbody>`;
      html += `<tr><td>Transmission (pignon × couronne)</td><td>${esc(profile.pignon)} × ${esc(profile.couronne)}</td></tr>`;
      html += `<tr><td>Variateur</td><td>${esc(profile.variateur || '—')}</td></tr>`;
      html += `<tr><td>Galets</td><td>${esc(profile.galetsMin)}–${esc(profile.galetsMax)} g</td></tr>`;
      html += `<tr><td>Masselottes</td><td>${esc(profile.masselottes)} g</td></tr>`;
      html += `<tr><td>Gicleur</td><td>${esc(profile.gicleur)}</td></tr>`;
      html += `</tbody></table>`;
    } else {
      html += `<p>Profil non renseigné.</p>`;
    }
    html += `</div>`;

    // --- Valeurs techniques confirmées (statique, honnête : uniquement ce qui est marqué ✅ ailleurs sur le site) ---
    html += `<div class="print-section"><h2>Valeurs techniques confirmées (✅ RTM)</h2>`;
    html += `<table><thead><tr><th>Élément</th><th>Valeur</th><th>Statut</th></tr></thead><tbody>`;
    html += `<tr><td>Couple écrou de rotor du volant</td><td>5 m.kg (≈49 N·m)</td><td class="print-badge">✅ RTM</td></tr>`;
    html += `<tr><td>Couple écrous de culasse</td><td>1,2 m.kg (≈11,8 N·m)</td><td class="print-badge">✅ RTM</td></tr>`;
    html += `<tr><td>Couple écrous pipe d'admission</td><td>1 m.kg (≈9,8 N·m)</td><td class="print-badge">✅ RTM</td></tr>`;
    html += `<tr><td>Écartement bougie</td><td>0,6 mm</td><td class="print-badge">✅ RTM</td></tr>`;
    html += `<tr><td>Écartement rupteurs</td><td>0,35 mm</td><td class="print-badge">✅ RTM + 2 sources</td></tr>`;
    html += `<tr><td>Avance à l'allumage (origine)</td><td>2 mm avant PMH</td><td class="print-badge">✅ RTM</td></tr>`;
    html += `<tr><td>Avance à l'allumage (protocole recommandé)</td><td>Démarrer à 1,8 mm, ajuster 1,7–2 mm</td><td class="print-badge">⚠️ non confirmé, piste plausible</td></tr>`;
    html += `<tr><td>Couple moteur AV7, rapport de variateur réel, circonférence pneu exacte</td><td>Voir onglet Archives</td><td class="print-badge">❓ non confirmé — ne pas utiliser de chiffre précis</td></tr>`;
    html += `</tbody></table></div>`;

    // --- Kilométrage et rappels ---
    try {
      const odoRaw = store.get('motobecane_50vcl_odometer');
      const odo = odoRaw ? JSON.parse(odoRaw) : null;
      const rappelsRaw = store.get('motobecane_50vcl_rappels');
      const rappels = rappelsRaw ? JSON.parse(rappelsRaw) : [];
      html += `<div class="print-section"><h2>Kilométrage &amp; rappels d'entretien</h2>`;
      html += `<p>Kilométrage actuel : <strong>${odo && odo.km != null ? esc(odo.km) + ' km' : 'non renseigné'}</strong></p>`;
      if (rappels.length) {
        html += `<table><thead><tr><th>Rappel</th><th>Intervalle (km)</th><th>Dernier fait (km)</th><th>Prochaine échéance</th><th>Statut</th></tr></thead><tbody>`;
        rappels.forEach((r) => {
          const nextDue = (r.lastDoneKm || 0) + (r.intervalKm || 0);
          const currentKm = odo && odo.km != null ? odo.km : 0;
          const due = currentKm >= nextDue;
          html += `<tr><td>${esc(r.label)}</td><td>${esc(r.intervalKm)}</td><td>${esc(r.lastDoneKm || 0)}</td><td>${esc(nextDue)}</td><td class="print-badge">${due ? '🔴 À faire' : '🟢 OK'}</td></tr>`;
        });
        html += `</tbody></table>`;
      } else {
        html += `<p>Aucun rappel configuré.</p>`;
      }
      html += `</div>`;
    } catch (e) { /* ignore */ }

    // --- Carnet d'entretien ---
    try {
      const carnetRaw = store.get('motobecane_50vcl_carnet');
      const carnet = carnetRaw ? JSON.parse(carnetRaw) : [];
      html += `<div class="print-section"><h2>Carnet d'entretien</h2>`;
      if (carnet.length) {
        html += `<table><thead><tr><th>Date</th><th>Km</th><th>Intervention</th><th>Notes</th></tr></thead><tbody>`;
        carnet
          .slice()
          .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
          .forEach((entry) => {
            html += `<tr><td>${esc(entry.date)}</td><td>${entry.km != null ? esc(entry.km) : '—'}</td><td>${esc(entry.titre)}</td><td>${esc(entry.note || '')}</td></tr>`;
          });
        html += `</tbody></table>`;
      } else {
        html += `<p>Aucune intervention enregistrée.</p>`;
      }
      html += `</div>`;
    } catch (e) { /* ignore */ }

    // --- Budget ---
    const budgetOwnedEl = document.getElementById('budget-total-owned');
    const budgetRemainingEl = document.getElementById('budget-total-remaining');
    const budgetAllEl = document.getElementById('budget-total-all');
    if (budgetOwnedEl && budgetRemainingEl && budgetAllEl) {
      html += `<div class="print-section"><h2>Budget du projet</h2>`;
      html += `<table><tbody>`;
      html += `<tr><td>Déjà en main</td><td>${esc(budgetOwnedEl.textContent)}</td></tr>`;
      html += `<tr><td>Reste à acheter</td><td>${esc(budgetRemainingEl.textContent)}</td></tr>`;
      html += `<tr><td>Total du projet (catalogue)</td><td>${esc(budgetAllEl.textContent)}</td></tr>`;
      html += `</tbody></table></div>`;
    }

    printExportView.innerHTML = html;
  }

  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => {
      buildPrintExportView();
      window.setTimeout(() => window.print(), 50);
    });
  }

  /* ----------------------------------------------------------------
   * NAVIGATION PAR GROUPES (UX-01)
   * Les .nav-btn[data-tab] gardent leur logique d'onglets (section 1) ;
   * ici on ne gère que l'ouverture des groupes et le groupe "actif".
   * ---------------------------------------------------------------- */
  const navGroups = document.querySelectorAll('.nav-group');

  function syncNavGroups() {
    navGroups.forEach(group => {
      group.classList.toggle('has-active', !!group.querySelector('.nav-btn.active'));
    });
  }

  function closeNavGroups(except) {
    navGroups.forEach(group => {
      if (group === except) return;
      group.classList.remove('open');
      const t = group.querySelector('.nav-group-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }

  navGroups.forEach(group => {
    const toggle = group.querySelector('.nav-group-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !group.classList.contains('open');
      group.classList.toggle('open', willOpen);
      toggle.setAttribute('aria-expanded', String(willOpen));
      // Sur ordinateur, un seul menu déroulant à la fois
      if (willOpen && window.matchMedia('(min-width: 769px)').matches) closeNavGroups(group);
    });
  });

  // Après le choix d'un onglet : mettre à jour le groupe actif et refermer les menus (ordinateur)
  document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      syncNavGroups();
      if (window.matchMedia('(min-width: 769px)').matches) closeNavGroups();
    });
  });

  // Clic ailleurs ou Échap : fermer les menus déroulants (ordinateur)
  document.addEventListener('click', (e) => {
    if (window.matchMedia('(min-width: 769px)').matches && !e.target.closest('.nav-group')) closeNavGroups();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNavGroups();
  });

  // À l'ouverture du tiroir mobile, déplier le groupe de l'onglet affiché
  if (btnBurger) {
    btnBurger.addEventListener('click', () => {
      const activeGroup = document.querySelector('.nav-group.has-active');
      if (activeGroup) {
        activeGroup.classList.add('open');
        const t = activeGroup.querySelector('.nav-group-toggle');
        if (t) t.setAttribute('aria-expanded', 'true');
      }
    });
  }

  syncNavGroups();

  /* ----------------------------------------------------------------
   * TOASTS RÉUTILISABLES (UX-10) + RAPPEL MODE ÉTABLI (UX-09)
   * ---------------------------------------------------------------- */
  const toastRegion = document.createElement('div');
  toastRegion.className = 'toast-region';
  toastRegion.setAttribute('role', 'status');
  toastRegion.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastRegion);

  /**
   * Affiche une notification courte.
   * options : { type: 'success'|'info', duration: ms (0 = reste jusqu'à fermeture),
   *             actionLabel, onAction }
   */
  function showToast(message, options) {
    const opts = options || {};
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + (opts.type || 'success');

    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    function dismiss() {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 250);
    }

    if (opts.actionLabel && typeof opts.onAction === 'function') {
      const actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = 'toast-action';
      actionBtn.textContent = opts.actionLabel;
      actionBtn.addEventListener('click', () => { opts.onAction(); dismiss(); });
      toast.appendChild(actionBtn);
    }

    if (opts.duration === 0) {
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'toast-close';
      closeBtn.setAttribute('aria-label', 'Fermer');
      closeBtn.textContent = '✕';
      closeBtn.addEventListener('click', dismiss);
      toast.appendChild(closeBtn);
    }

    toastRegion.appendChild(toast);
    window.requestAnimationFrame(() => toast.classList.add('visible'));
    if (opts.duration !== 0) setTimeout(dismiss, opts.duration || 2500);
    return toast;
  }

  // UX-09 : à la première visite, signaler le Mode Établi (une seule fois)
  const THEME_HINT_KEY = 'motobecane_50vcl_theme_hint_seen';
  if (!store.get(THEME_KEY) && !store.get(THEME_HINT_KEY) && btnThemeToggle) {
    setTimeout(() => {
      store.set(THEME_HINT_KEY, '1');
      showToast('En atelier ? Le Mode Établi (fond sombre) se lit mieux avec des mains sales et peu de lumière.', {
        type: 'info',
        duration: 0,
        actionLabel: 'Activer 🌙',
        onAction: () => setTheme(true)
      });
    }, 2500);
  }

  // UX-10 : confirmations après les actions clés
  if (btnExportPdf) {
    btnExportPdf.addEventListener('click', () => {
      showToast('Résumé prêt : choisissez « Enregistrer au format PDF » dans la fenêtre d\'impression.', { type: 'info', duration: 4500 });
    });
  }
  if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', () => showToast('Profil véhicule enregistré.'));
  }
  if (btnResetProfile) {
    btnResetProfile.addEventListener('click', () => showToast('Profil remis aux valeurs par défaut.'));
  }
  if (btnOdoSave) {
    btnOdoSave.addEventListener('click', () => {
      const saved = loadOdo();
      if (saved && saved.km === parseInt(odoInput.value, 10)) showToast('Kilométrage enregistré.');
    });
  }
  // Toast seulement si l'ajout a réussi : on compare le nombre d'éléments avant/après
  // (écouteur "capture" = exécuté avant le gestionnaire d'origine du bouton).
  function toastOnAdd(btn, countFn, message) {
    if (!btn) return;
    let before = 0;
    btn.addEventListener('click', () => { before = countFn(); }, true);
    btn.addEventListener('click', () => { if (countFn() > before) showToast(message); });
  }
  toastOnAdd(btnCarnetAdd, () => loadCarnet().length, 'Intervention ajoutée au carnet.');
  toastOnAdd(btnRappelAdd, () => loadRappels().length, 'Rappel ajouté.');

  // UX-10 : validation d'une étape de tutoriel (animation + message, bravo en fin de tutoriel)
  tutoChecks.forEach(cb => {
    cb.addEventListener('change', () => {
      if (!cb.checked) return;
      const card = cb.closest('.tuto-step-card');
      if (card) {
        card.classList.add('just-done');
        card.addEventListener('animationend', () => card.classList.remove('just-done'), { once: true });
      }
      const panel = cb.closest('.tutorial-panel');
      const boxes = panel ? panel.querySelectorAll('input[data-tuto-task]') : [];
      const allDone = boxes.length > 0 && Array.from(boxes).every(b => b.checked);
      showToast(allDone ? 'Tutoriel terminé, bravo !' : 'Étape validée ✓', { duration: allDone ? 3500 : 1800 });
    });
  });

  // UX-10 : petite pulsation quand un résultat de calcul change
  ['recommended-roller-weight', 'oil-volume-ml', 'sim-speed-gps', 'sim-speed-huret'].forEach(id => {
    const el = document.getElementById(id);
    if (!el || typeof MutationObserver === 'undefined') return;
    let lastText = el.textContent;
    new MutationObserver(() => {
      if (el.textContent === lastText) return;
      lastText = el.textContent;
      el.classList.remove('value-pulse');
      void el.offsetWidth; // relance l'animation
      el.classList.add('value-pulse');
    }).observe(el, { childList: true, characterData: true, subtree: true });
  });

  /* ----------------------------------------------------------------
   * SOMMAIRES D'ONGLET & SECTIONS REPLIABLES (UX-05)
   * ---------------------------------------------------------------- */
  document.querySelectorAll('.tab-toc a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.getElementById(link.getAttribute('href').slice(1));
      if (!target) return;
      e.preventDefault();
      // Si la cible est une carte repliable, on la déplie avant de s'y rendre
      const det = target.querySelector(':scope > details.collapsible');
      if (det) det.open = true;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Impression : tout déplier pour ne rien perdre, puis restaurer l'état d'avant
  let detailsClosedBeforePrint = [];
  window.addEventListener('beforeprint', () => {
    detailsClosedBeforePrint = Array.from(document.querySelectorAll('details.collapsible:not([open])'));
    detailsClosedBeforePrint.forEach(d => { d.open = true; });
  });
  window.addEventListener('afterprint', () => {
    detailsClosedBeforePrint.forEach(d => { d.open = false; });
    detailsClosedBeforePrint = [];
  });

  /* ----------------------------------------------------------------
   * BOUTON RETOUR EN HAUT (UX-13)
   * Apparaît après 400 px de défilement, disparaît en haut de page.
   * ---------------------------------------------------------------- */
  const btnScrollTop = document.getElementById('btn-scroll-top');
  if (btnScrollTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        btnScrollTop.classList.add('visible');
      } else {
        btnScrollTop.classList.remove('visible');
      }
    }, { passive: true });

    btnScrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

});
