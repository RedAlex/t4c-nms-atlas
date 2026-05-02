# 🚀 Plan d'Amélioration - Atlas NMS Revolution

**Date**: 2 mai 2026  
**Statut**: PHASE 1, 2 & 3 ✅ COMPLÉTÉES | PHASE 4 & 6 🆕 Planifiées | PHASE 5 ♻️ À refaire après P4

---

## 📊 Vue d'ensemble

### Résumé des phases

- **PHASE 1** : Modularisation & qualité code (Fondations)
- **PHASE 2** : Tests & CI/CD (Testabilité)
- **PHASE 3** : UX & Fonctionnalités (Utilisateur)
- **PHASE 4** : Migration cartographique Gobeline + moteur multi-carte (Architecture map)
- **PHASE 6** : Navigation avancée (Zoom + Itinéraire)
- **PHASE 5** : Consolidation post-migration données (Stabilisation)

---

## 🔎 Analyse projet (mai 2026)

### Constats techniques

- L'architecture modulaire actuelle est saine: séparation claire des responsabilités (`data-loader`, `map-view`, `submap-view`, `poi-renderer`, `state`).
- Le modèle actuel est orienté "régions fixes" (4 cartes principales), ce qui limite l'extension vers des réseaux de cartes plus fins.
- L'état applicatif distingue surtout `activeMap` et `activeSubMap`; il manque une notion de graphe de navigation inter-cartes.
- Le format POI est adapté à l'affichage mais pas encore aux transitions spatiales (entrée/sortie, portail, cave, sous-sol).
- La base de tests (unitaires + e2e) permet de sécuriser une migration structurante sans refonte totale.

### Risques identifiés

- Migration de données: risque de rupture compatibilité si on supprime trop vite le modèle région/sous-carte.
- UX: risque de complexifier la navigation si le multi-carte n'est pas accompagné d'un fil d'Ariane clair.
- Performance: zoom + itinéraires peuvent alourdir le rendu si le calcul est fait à chaque frame.

### Opportunités

- Réutiliser les cartes et la granularité de `t4c-nms-overview` pour une base plus riche et plus maintenable.
- Introduire un graphe de POI et de transitions qui servira à la fois au routing et à la navigation immersive.
- Poser les fondations d'un futur mode "guidage" (trajets optimisés, étapes, estimation distance).

---

## PHASE 1 - Modularisation & Qualité Code ✅

### Objectif

Transformer `app.js` monolithique en modules spécialisés + ajouter linting

### Tâches

- [x] **P1.1** - Ajouter ESLint + Prettier ✅
  - ✅ Créer `.eslintrc.json` (config recommandée ESLint)
  - ✅ Créer `.prettierrc` (CRLF Windows, 100 printWidth)
  - ✅ Ajouter scripts npm: `lint`, `lint:fix`, `format`
  - ✅ Installer eslint 8.56.0 + prettier 3.1.1
  - ✅ Corriger 70 erreurs curly braces (if statements)
  - **Impact**: ✅ Détecte erreurs, cohérence code
  - **Effort**: ~1.5h

- [x] **P1.2** - Refactoriser app.js en modules ✅
  - ✅ Créer `js/modules/world-view.js` - Vue Monde
  - ✅ Créer `js/modules/map-view.js` - Vue Carte
  - ✅ Créer `js/modules/submap-view.js` - Vue Sous-carte
  - ✅ Créer `js/modules/data-loader.js` - Chargement données
  - ✅ Créer `js/modules/filters.js` - Logique filtres
  - ✅ Créer `js/modules/poi-renderer.js` - Rendu POI
  - ✅ Créer `js/modules/state.js` - State management centralisé
  - ✅ Corriger tous les imports/exports (0 erreurs ESLint)
  - ✅ Build & lancement réussis
  - **Impact**: Code maintenable, testable
  - **Effort**: 6-8h

- [x] **P1.3** - Ajouter JSDoc complet ✅
  - ✅ Tous les modules documentés avec @param, @returns
  - ✅ Types JSDoc sur toutes les fonctions publiques
  - ✅ Imports dynamiques inutiles remplacés par imports statiques (map-view, submap-view)
  - **Impact**: Code autodocumenté, meilleure IDE support
  - **Effort**: 2-3h

- [x] **P1.4** - Nettoyer dependencies package.json ✅
  - ✅ electron 41.3.0 → 41.4.0 (patch update)
  - ✅ eslint 8.57.1 installé (8.x maintenu, 10.x = changement majeur)
  - ✅ Ajout `jsdoc ^4.0.4` en devDependencies
  - ✅ Ajout script npm `docs` (jsdoc -c jsdoc.json)
  - ✅ Ajout `jsdoc.json` config + `docs/` dans .gitignore
  - ✅ 0 vulnérabilités (`npm audit`)
  - **Impact**: Dépendances à jour, outils de dev
  - **Effort**: 1h

---

## PHASE 2 - Tests & CI/CD 🟡

### Objectif

Couvrir tests unitaires + e2e + automatiser builds

### Tâches

- [x] **P2.1** - Setup tests unitaires (Vitest) ✅
  - ✅ Installer Vitest 3.2.0 + @vitest/coverage-v8 + happy-dom 20.9.0
  - ✅ Créer `vitest.config.js` (environment happy-dom, coverage v8, seuils 70%)
  - ✅ Créer `tests/unit/state.test.js` (7 tests)
  - ✅ Créer `tests/unit/utils.test.js` (16 tests)
  - ✅ Créer `tests/unit/calibration.test.js` (11 tests)
  - ✅ Scripts npm: `test`, `test:watch`, `test:coverage`
  - ✅ 34/34 tests passent — 0 vulnérabilités
  - **Impact**: Testabilité modules
  - **Effort**: 2-3h

- [x] **P2.2** - Tests unitaires modules (67 tests, 94% coverage — state, utils, calibration, filters, data-loader)
  - Tests `data-loader.js` (chargement JSON, erreurs)
  - Tests `filters.js` (logique filtres)
  - Tests `state.js` (state management)
  - Coverage cible: 70%+
  - **Impact**: Confiance refactoring
  - **Effort**: 4-5h

- [x] **P2.3** - Tests e2e (Playwright - déjà en roadmap)
  - ✅ Installer `@playwright/test` + `playwright.config.js` (workers: 1, reporter html)
  - ✅ `tests/e2e/app.test.js` — lancement, titre, 4 cartes, version footer (5 tests)
  - ✅ `tests/e2e/navigation.test.js` — Monde→Carte→Sous-carte→Retour (5 tests)
  - ✅ `tests/e2e/filters.test.js` — filtres carte + sous-carte, Titres ON/OFF (7 tests)
  - ✅ Ajout `data-submap-id` sur markers POI (ouverture sous-carte testable)
  - ✅ `"type": "module"` ajouté dans `package.json` (cohérence ESM)
  - ✅ 17/17 tests e2e passent — scénarios: lancement, navigation complète, filtres
  - Script npm: `test:e2e`
  - **Impact**: Validation flux utilisateur complet
  - **Effort**: 5-6h

- [x] **P2.4** - GitHub Actions CI/CD
  - ✅ `.github/workflows/build.yml` créé
  - ✅ Auto-build sur push/PR + publication release sur tag `v*`
  - ✅ Upload artefacts Windows (`atlas-nms-revolution.zip` + dossier packagé)
  - ✅ Publication release assets (ZIP + `Atlas NMS Revolution.exe`)
  - ✅ Linter + tests unitaires dans CI
  - **Impact**: Zéro builds manuels
  - **Effort**: 2-3h

- [x] **P2.5** - Auto-versioning ✅
  - ✅ Version exposée via `preload.cjs` (`window.desktopAPI.appVersion`)
  - ✅ Version affichée dans le footer (`#app-version`, style `.app-version`)
  - ✅ Version injectée au build via `appVersion` dans `electron-packager`
  - ✅ Script `scripts/changelog.mjs` — génère `CHANGELOG.md` depuis commits conventionnels (sans dépendance externe)
  - ✅ Scripts npm: `changelog`, `release:patch`, `release:minor`, `release:major`
  - ✅ `.eslintignore` créé pour exclure `docs/` et `release/`
  - **Impact**: Version toujours à jour, traçabilité des releases
  - **Effort**: 2-3h

---

## PHASE 3 - UX & Fonctionnalités 🟡

### Objectif

Enrichir l'expérience utilisateur avec features manquantes

### Tâches

- [x] **P3.1** - Ajouter recherche (fuzzy find)
  - ✅ Champs recherche ajoutés (Monde, Carte, Sous-carte)
  - ✅ Fuzzy match implémenté sur noms POI (+ recherche monde)
  - ✅ Highlight visuel des résultats (`.poi.search-match`) + compteur de résultats
  - ✅ Fonctions utilitaires testées (`normalizeSearchText`, `fuzzyMatchText`)
  - **Impact**: Trouvable parmi 100+ POI
  - **Effort**: 2-3h

- [x] **P3.2** - Système favoris (localStorage) ✅
  - ✅ Bouton ⭐ sur chaque POI (carte et sous-carte), visible au survol
  - ✅ Sauvegarde favoris dans localStorage (clé `atlasFavorites`)
  - ✅ Vue "Mes favoris" avec liste, bouton Ouvrir / Retirer
  - ✅ `js/modules/favorites.js` — module complet (load, toggle, render)
  - **Impact**: Utilisateur crée sa propre carte
  - **Effort**: 2-3h

- [x] **P3.3** - Indicateurs complétude régions
  - ✅ Ajouter % POI calibrés par région
  - ✅ Badge "Complet / En cours / Incomplet" sur cartes
  - ✅ Tooltip statistiques
  - **Impact**: Transparence sur contenu
  - **Effort**: 1-2h

- [x] **P3.4** - Améliorer accessibilité
  - ✅ Ajouter aria-labels manquants
  - ✅ Vérifier contraste texte (WCAG AA)
  - ✅ Navigation clavier complète (Tab, Enter, Esc)
  - ✅ Test lecteur d'écran
  - **Impact**: Utilisateurs malvoyants
  - **Effort**: 2-3h

- [x] **P3.5** - Responsive design (mobile)
  - ✅ Media queries tablet + mobile
  - ✅ Touch-friendly (zones cliquables 44x44px min)
  - ✅ Test iPhone/Android
  - **Impact**: Utilisable sur téléphone
  - **Effort**: 3-4h

---

## PHASE 4 - Migration Cartes Gobeline + Multi-carte 🆕

### Objectif

Passer d'un modèle "régions fixes" à un modèle multi-carte connecté, en utilisant les cartes issues du projet Gobeline, et permettre les transitions de POI à POI entre cartes.

### Tâches

- [ ] **P4.1** - Audit des assets cartographiques Gobeline
  - Inventorier cartes, résolutions, projections, nomenclature
  - Vérifier droits d'usage et crédit des sources
  - Définir mapping ancien ID -> nouveau ID carte
  - **Impact**: Migration cadrée
  - **Effort**: 1-2h

- [ ] **P4.2** - Nouveau modèle de données multi-carte
  - Remplacer la logique région/sous-carte par `maps[]` + `links[]`
  - Introduire un type `portal` (entrée, sortie, escalier, grotte, sous-sol)
  - Ajouter `targetMapId` + `targetPoiId` sur POI de transition
  - **Impact**: Base technique évolutive
  - **Effort**: 3-4h

- [ ] **P4.3** - Migration JSON et compatibilité ascendante
  - Créer un script de migration des anciens fichiers vers le nouveau schéma
  - Conserver un mode fallback pour anciennes données pendant transition
  - Ajouter validations des références croisées (POI cible existant)
  - **Impact**: Transition sans casse
  - **Effort**: 3-5h

- [ ] **P4.4** - Refonte navigation multi-carte
  - Remplacer "Monde > Carte > Sous-carte" par navigation par graphe de cartes
  - Ajouter breadcrumb dynamique de contexte (zone, carte, étage)
  - Ajouter historique des transitions (retour entrée/sortie)
  - **Impact**: Navigation cohérente malgré complexité
  - **Effort**: 3-4h

- [ ] **P4.5** - POI de transition coordonnée-à-coordonnée
  - Un POI peut pointer vers les coordonnées d'un autre POI (ex: entrée grotte -> sortie intérieure)
  - Gérer transitions bidirectionnelles quand applicable
  - Afficher type de transition et confirmation utilisateur avant téléport navigation
  - **Impact**: Cas d'usage grottes/sous-sols enfin natifs
  - **Effort**: 2-3h

- [ ] **P4.6** - Tests de non-régression migration carto
  - Unit tests: résolution de liens inter-cartes
  - E2E: enchaînement entrée -> intérieur -> sortie
  - Vérifier filtres, favoris, recherche dans nouveau modèle
  - **Impact**: Migration fiable
  - **Effort**: 3-4h

---

## PHASE 5 - Consolidation Post-Migration Données ♻️

### Objectif

Stabiliser et industrialiser la donnée après migration multi-carte (P4), en supprimant la dette de compatibilité temporaire.

### Tâches

- [ ] **P5.1** - Retirer le mode legacy région/sous-carte
  - Supprimer les adaptateurs temporaires introduits pendant P4
  - Uniformiser le code sur le modèle `maps[]` + transitions POI
  - Ajouter garde-fous si anciennes données détectées
  - **Impact**: Base code simplifiée et lisible
  - **Effort**: 2-3h

- [ ] **P5.2** - Validation stricte du nouveau modèle
  - Créer schémas Zod pour carte, POI, portail, lien et graphe de navigation
  - Valider au chargement avec erreurs actionnables (fichier + identifiant)
  - Refuser les références cassées (`targetMapId`, `targetPoiId` inexistants)
  - **Impact**: Zéro données cassées en production
  - **Effort**: 3-4h

- [ ] **P5.3** - Outillage data QA et versioning
  - Ajouter `data/CHANGELOG.md` avec version des datasets
  - Créer script de vérification des données (lint data)
  - Ajouter contrôle CI sur cohérence cartographique
  - **Impact**: Régressions détectées avant merge
  - **Effort**: 2-3h

- [ ] **P5.4** - Documentation finale contributeurs
  - Mettre à jour `CONTRIBUTING.md` sur le modèle multi-carte
  - Documenter les transitions entrée/sortie POI -> POI
  - Ajouter exemples de PR: nouvelle carte, nouveau portail, correction lien
  - **Impact**: Contributions plus rapides et fiables
  - **Effort**: 1-2h

- [ ] **P5.5** - Campagne de stabilisation fonctionnelle
  - Rejouer scénarios clés: navigation, filtres, favoris, recherche, itinéraire
  - Vérifier performance chargement sur gros jeux de cartes
  - Corriger les écarts UX résiduels post-migration
  - **Impact**: Livraison robuste et stable
  - **Effort**: 2-3h

---

## PHASE 6 - Zoom & Itinéraire 🆕

### Objectif

Ajouter une navigation spatiale avancée avec zoom fluide et calcul d'itinéraires exploitant le graphe multi-carte de la PHASE 4.

### Tâches

- [ ] **P6.1** - Moteur zoom/pan unifié
  - Zoom molette + boutons + tactile pinch
  - Pan avec contraintes de limites (pas de sortie de carte)
  - Niveaux de zoom min/max configurables par carte
  - **Impact**: Lecture précise des zones denses
  - **Effort**: 3-4h

- [ ] **P6.2** - Expérience utilisateur du zoom
  - Sauvegarder viewport (position + niveau) par carte
  - Ajouter bouton "Recentrer" et mini-indicateur d'échelle
  - Adapter taille/visibilité des POI selon niveau de zoom
  - **Impact**: Confort d'usage élevé
  - **Effort**: 2-3h

- [ ] **P6.3** - Modèle itinéraire et graphe de déplacement
  - Construire un graphe navigable avec noeuds POI + arêtes de transition
  - Pondérer les arêtes (distance, type de transition, coût)
  - Préparer stratégie simple: Dijkstra/BFS selon disponibilité des poids
  - **Impact**: Fondation du routing
  - **Effort**: 2-3h

- [ ] **P6.4** - UI itinéraire (point A -> point B)
  - Sélection du départ/arrivée via recherche ou clic POI
  - Affichage du chemin sur carte (segments + étapes)
  - Liste textuelle des instructions (ex: "Entrer dans Grotte X")
  - **Impact**: Feature majeure orientée joueur
  - **Effort**: 3-4h

- [ ] **P6.5** - Tests et performance
  - Bench du calcul d'itinéraire sur gros graphes
  - Tests e2e de scénarios inter-cartes et transitions complexes
  - Optimiser recalculs (memoization / cache trajets récents)
  - **Impact**: Fiabilité en production
  - **Effort**: 2-3h

---

## 📋 Tâches Support

- [ ] **S1** - Créer GitHub issue templates
  - Bug report template
  - Feature request template
  - **Effort**: 30min

- [ ] **S2** - Ajouter labels issues
  - `good-first-issue`, `help-wanted`, `documentation`
  - `type:bug`, `type:feature`, `type:data`
  - **Effort**: 30min

- [ ] **S3** - Wiki GitHub
  - Guide contributeur détaillé
  - FAQ utilisateurs
  - Architecture système
  - **Effort**: 2-3h

---

## 🎯 Recommandations par profil

### Si vous êtes seul (peu de temps)

1. P1.1 - ESLint (30min) → détecte bugs
2. P1.2 - Modules (6-8h) → base solide
3. P3.1 - Recherche (2-3h) → feature immédiate
4. P2.4 - GitHub Actions (2-3h) → zéro travail manuel

**Total PHASE 1 + début PHASE 3**: ~13-14h

### Si vous avez une équipe

Paralléliser:

- Équipe A: P1 (Modularisation)
- Équipe B: P2 (Tests)
- Équipe C: P4 (Migration cartographique)
  → puis P3 ensemble

---

## 📈 Impact estimé par phase

| Phase | Effort | Impact utilisateur    | Impact dev                  |
| ----- | ------ | --------------------- | --------------------------- |
| P1    | 10-14h | ⭐⭐ (responsif)      | ⭐⭐⭐⭐⭐ (maintenabilité) |
| P2    | 13-17h | ⭐ (confiance)        | ⭐⭐⭐⭐⭐ (zéro bugs)      |
| P3    | 10-15h | ⭐⭐⭐⭐⭐ (features) | ⭐⭐ (maintenance)          |
| P4    | 15-22h | ⭐⭐⭐⭐ (navigation riche) | ⭐⭐⭐⭐ (architecture map) |
| P6    | 12-17h | ⭐⭐⭐⭐⭐ (guidage)   | ⭐⭐⭐ (algo + perf)         |
| P5    | 10-15h | ⭐⭐⭐⭐ (stabilité)  | ⭐⭐⭐⭐ (qualité données)  |

---

## 🚦 Priorité recommandée

**Court terme** (semaines 1-2):

1. ✅ P1.1 - ESLint + Prettier
2. ✅ P1.2 - Modules
3. ✅ P3.1 - Recherche

**Moyen terme** (semaines 3-4): 4. ✅ P2 - Tests (complet) 5. ✅ P2.4 - GitHub Actions

**Long terme** (semaines 5+):
6. 🆕 P4 - Migration cartes Gobeline + modèle multi-carte
7. 🆕 P6 - Zoom + itinéraire
8. ♻️ P5 - Consolidation post-migration (après P4)

---

## Notes

- Chaque ✅ complétée = mise à jour ce fichier
- Copilot exécutera `.\build.bat` après chaque modification
- Commiter avec message: `feat: [PHASE] description (✅ P1.2)`
