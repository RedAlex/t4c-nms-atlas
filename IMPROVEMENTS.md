# 🚀 Roadmap — Atlas NMS Revolution

**Dernière mise à jour**: 15 mai 2026  
**Version courante**: v0.3.1  
**Statut global**: Phases 1→6 ✅ COMPLÉTÉES | Phase 7 🆕 Enrichissement contenu | Phase 8 🆕 UX avancée | Phase 9 🆕 Communauté

---

## 📊 Bilan technique — État au 15 mai 2026

### Architecture (✅ solide)

| Module | Rôle | Statut |
|---|---|---|
| `calibration.js` | Résolution positions POI (Gobeline + legacy) | ✅ |
| `config.js` | Configuration globale | ✅ |
| `data-loader.js` | Chargement JSON cartes + mondes | ✅ |
| `favorites.js` | Favoris persistants (localStorage) | ✅ |
| `filters.js` | Logique filtres POI | ✅ |
| `graph.js` | Graphe navigation + BFS pathfinding | ✅ |
| `itinerary.js` | UI panneau itinéraire A→B | ✅ |
| `map-view.js` | Vue carte principale | ✅ |
| `poi-renderer.js` | Rendu POI sur canvas carte | ✅ |
| `router.js` | Routing entre vues | ✅ |
| `state.js` | State management centralisé | ✅ |
| `submap-view.js` | Vue sous-carte (villes, grottes) | ✅ |
| `ui-helpers.js` | Helpers UI (tooltips, modals) | ✅ |
| `utils.js` | Utilitaires généraux | ✅ |
| `validator.js` | Validation données JSON | ✅ |
| `world-view.js` | Vue monde (onglets, liste cartes) | ✅ |
| `zoom-pan.js` | Moteur zoom/pan réutilisable | ✅ |

### Tests (✅ stables)

- **150/150 tests unitaires** passants (Vitest 3.2)
- **17/17 tests e2e** passants (Playwright)
- CI/CD GitHub Actions opérationnel

### Données cartographiques (⚠️ inégales)

| Carte | worldId | POI | Sous-cartes | Statut |
|---|---|---|---|---|
| Arakas | 0 | 147 | 2 | ✅ Bonne base |
| Raven-Dust | 0 | 111 | 5 | ✅ Bonne base |
| Stoneheim | 0 | 80 | 4 | ✅ Bonne base |
| Drake Island | 3 | 5 | 2 | ⚠️ À compléter |
| Ile de Lune / Nieve | 4 | 2 | 0 | ⚠️ À compléter |
| Leoworld | 1 | 0 | 0 | 🔴 Vide |
| Underworld | 2 | 0 | 0 | 🔴 Vide |
| Extension 4 | 5 | 0 | 0 | 🔴 Vide |
| Extension 5 | 6 | 0 | 0 | 🔴 Vide |
| Extension 6 | 7 | 0 | 0 | 🔴 Vide |

### Assets manquants (⚠️ optionnels, signalés par data:lint)

- Images abetsic : `arakas-abetsic.gif`, `raven-dust-abetsic.gif`, `stoneheim-abetsic.jpg`, `drake-island-abetsic.jpg`
- Images sous-cartes : `chateau-royal.jpg`, `cave-anrak.jpg`, `cave-humterre.jpg`, `donjon-beholder.jpg`, `redwall.jpg`

---

## Phases historiques (✅ complétées)

- **Phase 1** — Modularisation & qualité code (ESLint, Prettier, JSDoc)
- **Phase 2** — Tests & CI/CD (Vitest, Playwright, GitHub Actions, auto-versioning)
- **Phase 3** — UX & Fonctionnalités (recherche floue, favoris, accessibilité, responsive)
- **Phase 4** — Migration Gobeline + moteur multi-carte (8 worldIds, portails, transitions)
- **Phase 5** — Consolidation post-migration données (validation stricte, data-lint CI)
- **Phase 6** — Zoom/pan + système itinéraire A→B (graphe BFS, panneau UI)

---

## PHASE 7 — Enrichissement contenu cartographique 🆕

### Objectif

Combler les cartes vides ou partielles, importer les assets manquants, enrichir la qualité des POI existants.

### Tâches

- [ ] **P7.1** — Compléter Drake Island (worldId 3)
  - [ ] Importer les POI principaux (villes, grottes, donjons)
  - [ ] Ajouter les sous-cartes manquantes avec images
  - [ ] Récupérer / capturer l'image `redwall.jpg`
  - **Effort**: 3-5h

- [ ] **P7.2** — Compléter Ile de Lune / Nieve (worldId 4)
  - [ ] Importer les POI (zones, quêtes, PNJ importants)
  - [ ] Ajouter les sous-cartes si applicable
  - **Effort**: 3-5h

- [ ] **P7.3** — Leoworld (worldId 1) — premier contenu
  - [ ] Rechercher sources (wiki T4C, Gobeline Dev)
  - [ ] Créer les premiers POI (spawn, villes principales)
  - [ ] Ajouter l'image HD depuis Gobeline si disponible
  - **Effort**: 4-6h

- [ ] **P7.4** — Underworld (worldId 2) — premier contenu
  - [ ] Même démarche que P7.3
  - **Effort**: 4-6h

- [ ] **P7.5** — Extensions 4, 5, 6 (worldId 5, 6, 7) — squelette minimal
  - [ ] Ajouter au moins les zones principales si données disponibles
  - [ ] Marquer `"status": "wip"` dans le JSON pour les cartes incomplètes
  - **Effort**: 2-4h par extension

- [ ] **P7.6** — Assets images manquants
  - [ ] Récupérer / capturer les 4 images abetsic
  - [ ] Récupérer les 5 images sous-cartes manquantes
  - [ ] Objectif : `npm run data:lint` → 0 avertissement
  - **Effort**: 2-4h

- [ ] **P7.7** — Enrichir qualité POI existants (Arakas, Raven-Dust, Stoneheim)
  - [ ] Ajouter champ `level` (niveau requis) sur POI donjons/monstres
  - [ ] Ajouter `wikiUrl` manquants
  - [ ] Corriger descriptions incomplètes ou génériques
  - **Effort**: 3-5h

---

## PHASE 8 — UX avancée 🆕

### Objectif

Améliorer la navigation sur la carte et enrichir les fonctionnalités joueur.

### Tâches

- [ ] **P8.1** — Visualisation itinéraire sur carte
  - [ ] Tracer le chemin (flèche ou ligne SVG) entre les POI d'étape sur la carte active
  - [ ] Mise en évidence visuelle des POI de passage
  - [ ] Synchronisation panneau itinéraire ↔ vue carte (scroll vers POI actif)
  - **Impact**: Itinéraire vraiment exploitable visuellement
  - **Effort**: 4-6h

- [ ] **P8.2** — Clustering POI
  - [ ] Regrouper les POI proches à faible zoom (ex: badge `+5`)
  - [ ] Éclatement automatique au zoom pour afficher les POI individuels
  - [ ] Prioritaire sur Arakas (147 POI, zones très denses)
  - **Impact**: Lisibilité des cartes denses
  - **Effort**: 4-6h

- [ ] **P8.3** — Minimap / vue d'ensemble
  - [ ] Aperçu miniature de la carte HD avec indicateur de zone visible
  - [ ] Clic sur la minimap → repositionne le viewport
  - **Impact**: Navigation rapide sur grandes cartes
  - **Effort**: 3-5h

- [ ] **P8.4** — Export itinéraire
  - [ ] Générer un résumé textuel copiable des étapes (noms, cartes, portails)
  - **Impact**: Partage entre joueurs
  - **Effort**: 2-3h

- [ ] **P8.5** — Filtre par niveau requis
  - [ ] Filtrer les POI par tranche de niveau (ex: "Afficher zones niv. 1-30")
  - [ ] Dépend de P7.7 (ajout du champ `level` sur les POI)
  - **Impact**: Guidage selon progression joueur
  - **Effort**: 2-3h

- [ ] **P8.6** — Panneau détail POI enrichi
  - [ ] Panneau latéral fixe (non tooltip) pour POI complexes (donjons, villes)
  - [ ] Contenu : nom, type, description, niveau, lien wiki, portails liés
  - **Impact**: Information accessible sans surcharger la carte
  - **Effort**: 3-4h

---

## PHASE 9 — Communauté & maintenabilité 🆕

### Objectif

Faciliter les contributions, améliorer la visibilité open source, préparer la distribution.

### Tâches

- [ ] **P9.1** — GitHub issue templates
  - [ ] Template "Bug report"
  - [ ] Template "Feature request"
  - [ ] Template "Contribution données / POI"
  - **Effort**: 30-45min

- [ ] **P9.2** — Labels GitHub
  - [ ] `good-first-issue`, `help-wanted`, `documentation`
  - [ ] `type:bug`, `type:feature`, `type:data`, `type:test`
  - **Effort**: 20min

- [ ] **P9.3** — Wiki GitHub
  - [ ] Guide contributeur détaillé (POI, cartes, images)
  - [ ] FAQ joueurs (utilisation, raccourcis, itinéraire)
  - [ ] Documentation architecture système
  - **Effort**: 3-4h

- [ ] **P9.4** — README enrichi
  - [ ] Captures d'écran de l'interface
  - [ ] GIF de démonstration (navigation, itinéraire)
  - [ ] Badges CI, version, license
  - **Effort**: 1-2h

- [ ] **P9.5** — Vérificateur de mise à jour données
  - [ ] Comparer la version `data/maps.json` locale avec le dépôt GitHub
  - [ ] Notifier si une mise à jour cartographique est disponible
  - [ ] Étendre `updater.cjs` existant pour les données
  - **Effort**: 2-3h

- [ ] **P9.6** — Import automatisé depuis Gobeline Dev
  - [ ] Finaliser `scripts/import-gobeline-pois.cjs` (ciblage par worldId)
  - [ ] Intégrer dans le workflow : `data:import` → `data:lint` → commit
  - **Effort**: 3-5h

---

## 📋 Maintenance courante

- [ ] **S4** — Mettre à jour `electron` (41.4.0 → dernière stable)
- [ ] **S5** — Vérifier compatibilité Node 24 en local (CI utilise Node 24)
- [ ] **S6** — Audit `npm audit` périodique (objectif : 0 vulnérabilité)

---

## 🎯 Priorité recommandée

### Court terme (prochaine session)

1. **P7.6** — Assets manquants → `data:lint` silencieux
2. **P7.1** — Compléter Drake Island
3. **P9.1 + P9.2** — Templates + labels GitHub (rapide)

### Moyen terme

4. **P7.2** — Ile de Lune / Nieve
5. **P8.1** — Itinéraire tracé sur carte
6. **P8.2** — Clustering POI (Arakas surtout)
7. **P7.7** — Enrichir qualité POI existants

### Long terme

8. **P7.3 + P7.4** — Leoworld + Underworld (données à sourcer)
9. **P8.3** — Minimap
10. **P9.3** — Wiki GitHub
11. **P7.5** — Extensions 4/5/6

---

## 📈 Impact estimé

| Phase | Effort total | Impact joueur | Impact contributeur |
|---|---|---|---|
| P7 — Contenu | 25-40h | ⭐⭐⭐⭐⭐ (cartes utilisables) | ⭐⭐⭐ (données à saisir) |
| P8 — UX avancée | 18-27h | ⭐⭐⭐⭐⭐ (navigation fluide) | ⭐⭐ (code front) |
| P9 — Communauté | 10-15h | ⭐⭐ (indirect) | ⭐⭐⭐⭐⭐ (contribution facilitée) |

---

## Notes

- Chaque tâche complétée = mise à jour de ce fichier (case cochée → ✅)
- Copilot exécute `.\build.bat` après chaque modification de code ou données
- Messages de commit en français : `feat:`, `fix:`, `chore:`, `data:`, `docs:`
