# 🚀 Plan d'Amélioration - Atlas NMS Revolution

**Date**: 1 mai 2026  
**Statut**: PHASE 1 ✅ COMPLÉTÉE | PHASE 2-4 ⏳ En attente

---

## 📊 Vue d'ensemble

### Résumé des phases

- **PHASE 1** : Modularisation & qualité code (Fondations)
- **PHASE 2** : Tests & CI/CD (Testabilité)
- **PHASE 3** : UX & Fonctionnalités (Utilisateur)
- **PHASE 4** : Robustesse données (Solidité)

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

- [ ] **P2.2** - Tests unitaires modules
  - Tests `data-loader.js` (chargement JSON, erreurs)
  - Tests `filters.js` (logique filtres)
  - Tests `state.js` (state management)
  - Coverage cible: 70%+
  - **Impact**: Confiance refactoring
  - **Effort**: 4-5h

- [ ] **P2.3** - Tests e2e (Playwright - déjà en roadmap)
  - Créer `tests/e2e/` structure
  - Test scénarios: Monde → Carte → Sous-carte
  - Test filtres, navigation, tooltips
  - **Impact**: Validation flux utilisateur
  - **Effort**: 5-6h

- [ ] **P2.4** - GitHub Actions CI/CD
  - Créer `.github/workflows/build.yml`
  - Auto-build sur push tag (release)
  - Auto-build exe + zip release assets
  - Linter + tests dans CI
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

- [ ] **P3.1** - Ajouter recherche (fuzzy find)
  - Ajouter champ recherche monde/carte
  - Implémenter fuzzy match sur noms POI
  - Highlight résultats
  - **Impact**: Trouvable parmi 100+ POI
  - **Effort**: 2-3h

- [ ] **P3.2** - Système favoris (localStorage)
  - Ajouter bouton ⭐ sur POI
  - Sauvegarder favoris dans localStorage
  - Vue "Mes favoris"
  - **Impact**: Utilisateur crée sa propre carte
  - **Effort**: 2-3h

- [ ] **P3.3** - Indicateurs complétude régions
  - Ajouter % POI calibrés par région
  - Badge "Complet / En cours / Incomplet" sur cartes
  - Tooltip statistiques
  - **Impact**: Transparence sur contenu
  - **Effort**: 1-2h

- [ ] **P3.4** - Améliorer accessibilité
  - Ajouter aria-labels manquants
  - Vérifier contraste texte (WCAG AA)
  - Navigation clavier complète (Tab, Enter, Esc)
  - Test lecteur d'écran
  - **Impact**: Utilisateurs malvoyants
  - **Effort**: 2-3h

- [ ] **P3.5** - Responsive design (mobile)
  - Media queries tablet + mobile
  - Touch-friendly (zones cliquables 44x44px min)
  - Test iPhone/Android
  - **Impact**: Utilisable sur téléphone
  - **Effort**: 3-4h

---

## PHASE 4 - Robustesse Données 🟢

### Objectif

Solidifier intégrité & documentation données

### Tâches

- [ ] **P4.1** - Schéma validation données (Zod)
  - Créer schema POI, sous-carte, région
  - Valider au chargement JSON
  - Afficher erreurs détaillées
  - **Impact**: Zéro données cassées
  - **Effort**: 2-3h

- [ ] **P4.2** - Changelog & versioning données
  - Ajouter `data/CHANGELOG.md`
  - Formater: "## v1.0.0 - 2026-05-01"
  - Log changements: POI ajoutés, calibration
  - **Impact**: Traçabilité contenu
  - **Effort**: 1h (ongoing)

- [ ] **P4.3** - Schéma JSON (générer avec JSON Schema)
  - Créer `schema/map.schema.json`
  - Créer `schema/poi.schema.json`
  - Valider avec `ajv` ou Zod
  - **Impact**: Documentation + validation
  - **Effort**: 2h

- [ ] **P4.4** - Documentation POI (CONTRIBUTING.md)
  - Clarifier format POI (id, name, coords, type, wikiUrl, etc.)
  - Ajouter exemples complets
  - Templates pour PR new POI
  - **Impact**: Contributeurs ne se trompent pas
  - **Effort**: 1-2h

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
- Équipe C: P4 (Documentation données)
  → puis P3 ensemble

---

## 📈 Impact estimé par phase

| Phase | Effort | Impact utilisateur    | Impact dev                  |
| ----- | ------ | --------------------- | --------------------------- |
| P1    | 10-14h | ⭐⭐ (responsif)      | ⭐⭐⭐⭐⭐ (maintenabilité) |
| P2    | 13-17h | ⭐ (confiance)        | ⭐⭐⭐⭐⭐ (zéro bugs)      |
| P3    | 10-15h | ⭐⭐⭐⭐⭐ (features) | ⭐⭐ (maintenance)          |
| P4    | 6-8h   | ⭐⭐⭐ (qualité)      | ⭐⭐⭐ (données)            |

---

## 🚦 Priorité recommandée

**Court terme** (semaines 1-2):

1. ✅ P1.1 - ESLint + Prettier
2. ✅ P1.2 - Modules
3. ✅ P3.1 - Recherche

**Moyen terme** (semaines 3-4): 4. ✅ P2 - Tests (complet) 5. ✅ P2.4 - GitHub Actions

**Long terme** (semaines 5+): 6. ✅ P3 - UX complète 7. ✅ P4 - Données robustes

---

## Notes

- Chaque ✅ complétée = mise à jour ce fichier
- Copilot exécutera `.\build.bat` après chaque modification
- Commiter avec message: `feat: [PHASE] description (✅ P1.2)`
