## [0.3.1] — 2026-05-04

### Nouveautés

- ajout de nouveaux POI pour Stoneheim et mise à jour des fichiers de carte feat: ajout de la gestion des clics gauche pour les PNJ et monstres chore: ajout d'un script pour importer les POI depuis Gobeline Dev style: amélioration du positionnement des cartes de survol
- ajout d'un panneau d'itinéraire et d'un système de navigation entre cartes feat: implémentation des contrôles de zoom pour la carte principale et la sous-carte feat: création d'un moteur de zoom/pan réutilisable pour les cartes test: ajout de tests unitaires pour le module de graphe de navigation style: amélioration du style du panneau d'itinéraire et des contrôles de zoom

### Documentation

- mise à jour du CHANGELOG pour v0.3.0

## [0.3.0] — 2026-05-03

### Nouveautés

- ajout d'un contrôle de qualité des données pour la cohérence cartographique
- ajout de la synchronisation de la hauteur de viewport et amélioration de la réactivité des éléments de la carte
- ajout du système de validation des données pour les cartes et POIs test: ajout de tests unitaires pour la validation des données test: ajout de tests pour la navigation des cibles POI test: ajout de tests pour le routage entre POIs
- ajout de la recherche et des onglets de sélection de monde feat: amélioration de la gestion des coordonnées Gobeline pour les POI feat: chargement des données des mondes et enrichissement des cartes style: mise à jour du style des onglets et des messages pour les mondes vides test: ajout de tests pour la gestion des mondes et des cartes
- mettre à jour les instructions de Copilot et le README pour clarifier les règles de contribution et les sources d'information
- mettre à jour le script de génération du CHANGELOG pour inclure des exemples de messages de commits

### Corrections

- corriger le chemin du zip dans le job release CI/CD

### Refactorisation

- réorganisation de l'initialisation des cartes et amélioration de la gestion des éléments de la carte
- simplification de la vue monde et amélioration de la gestion des événements

### Documentation

- mise à jour de la documentation sur le modèle multi-carte et les transitions POI

### Maintenance

- audit sécurité : validation du chemin d'accès dans `readMapFile` (protection path traversal)
- audit qualité : correction lint ESLint sur `data-loader.js`, `poi-renderer.js`, `router.js`, `validator.js`, `world-view.js`
- suppression du dossier `coverage/` du suivi git (ajout au `.gitignore`)
- migrer Node.js 20 vers 24 dans le workflow CI/CD et supprimer FORCE_JAVASCRIPT_ACTIONS_TO_NODE24

## [0.2.0] — 2026-05-01

### Nouveautés

- **p3.5** : ajout du système de favoris avec persistance localStorage, icône étoile et filtre dédié
- **p3.4** : badges de calibration sur les vues monde, carte et sous-carte
- **p3.3** : badges de complétion, améliorations d'accessibilité et interface adaptée au tactile
- **p3.2** : première implémentation du système de favoris
- **p3.1** : ajout de la recherche floue sur toutes les vues
- mise à jour du workflow CI avec les dernières versions des actions GitHub
- ajout du CHANGELOG.md avec les notes de version 0.1.0, 0.1.1 et 0.1.2

### Style

- refonte de l'affichage des cartes pour une meilleure lisibilité

## [0.1.2] — 2026-05-01

### Nouveautés

- mise à jour du workflow CI pour exécuter les vérifications sur Windows et normaliser le lint

## [0.1.1] — 2026-05-01

### Nouveautés

- ajout du workflow GitHub Actions CI/CD pour automatiser les builds et releases
- ajout des tests e2e Playwright pour le lancement de l'application, la navigation et les filtres
- ajout des tests unitaires pour les modules de chargement des données et de filtres
- ajout du framework de test et des premiers cas de test
- mise à jour de .gitignore, ajout de la configuration JSDoc et mise à jour des dépendances
- refactorisation des gestionnaires d'événements souris dans les modules carte et sous-carte pour améliorer les performances
- ajout des modules de base pour la gestion des cartes et sous-cartes
- ajout des scripts de linting/formatage et mise à jour des dépendances

## [0.1.0] — 2026-05-01

### Nouveautés

- version initiale du projet Atlas NMS Revolution

