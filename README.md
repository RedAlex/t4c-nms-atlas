# Atlas NMS Revolution

Projet open source pour construire une carte interactive telechargeable de l'univers T4C NMS Revolution, a partir des informations publiques du wiki officiel et du site officiel.

## Version alpha 0.1

Application bureau Windows (Electron) telechargeable. Toutes les cartes sont en lecture seule.

## Fonctionnalites actuelles

- Page monde avec les 4 regions : Arakas, Raven's Dust, Stoneheim, Drake Island
- (En cours)Vue carte principale (image Abetsic) avec points d'interet positionnés par coordonnées de jeu 
- Filtres exclusifs : Lieux / PNJ / Monstres
- Tooltip au survol d'un POI (nom, description, type)
- Clic gauche sur un POI : ouvre la sous-carte associee
- Clic droit sur un POI : ouvre la page wiki correspondante dans le navigateur
- (En cours)Vue sous-carte avec image détaillée et lien wiki 
- Affichage/masquage des titres de POI
- Navigation 3 niveaux : Monde > Carte > Sous-carte
- (En test) Mise à jour automatique au démarrage : vérifie la dernière Release GitHub et propose la mise à jour si une version plus récente est disponible 
- Version bureau compilable en `.exe` (Windows)

## Lancer le projet en développement

```bash
npm install
npm run dev
```

## Compiler en EXE (Windows)

Prerequis : Node.js 20+ et npm

```bash
npm install
npm run build:win
```

Resultat dans `release/` :
- `Atlas NMS Revolution-win32-x64/` — dossier executables
- `atlas-nms-revolution.zip` — archive distribuable

## Structure

```
app.js          logique principale
index.html      interface
styles.css      styles
data/
  maps.json     index des regions
  maps/         données par region (arakas.json, ...)
  images/       assets cartographiques
electron/       main et preload Electron
scripts/        scripts de build
```

## Ajouter des POI

Guide pratique: voir `CONTRIBUTING.md` (section "Ajouter un POI").

## Données et attribution

- Ce projet ne contient que des informations publiques issues du wiki officiel t4c.fandom.com/fr.
- Les assets cartographiques proviennent du wiki officiel T4C NMS Revolution.
- Les assets proprietaires ne doivent pas etre commites sans autorisation explicite.

## Roadmap

- Calibration et ajout de POI pour Raven's Dust, Stoneheim, Drake Island
- Ajout de POI reels (PNJ, monstres, quetes) pour toutes les regions
- Export image (PNG/SVG)
- Tests front (Playwright)

## Licence

MIT. Voir `LICENSE`.
