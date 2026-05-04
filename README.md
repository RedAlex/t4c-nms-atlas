# Atlas NMS Revolution

Projet open source pour construire une carte interactive telechargeable de l'univers T4C NMS Revolution, a partir des informations publiques du wiki officiel et du site officiel.

## Version alpha 0.1

Application bureau Windows (Electron) telechargeable. Toutes les cartes sont en lecture seule.

## Fonctionnalites actuelles

- Page monde avec les 4 regions : Arakas, Raven's Dust, Stoneheim, Drake Island
- (En cours)Vue carte principale (image Abetsic) avec points d'interet positionnés par coordonnées de jeu
- Filtres exclusifs : Lieux / PNJ / Monstres
- Tooltip au survol d'un POI (nom, description, type)
- Clic gauche sur un POI : ouvre la sous-carte associee (configurable ; PNJ/monstres peuvent etre non navigables)
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

- **The 4th Coming (T4C)** est une marque déposée et une propriété intellectuelle de **Dialsoft LLC**. Les noms d'objets, statistiques de sorts, caractéristiques de monstres et tout autre élément issu de l'univers du jeu sont la propriété exclusive de leurs auteurs respectifs.
- Ce projet est une Fan-App non officielle à but purement informatif. Il n'est en aucun cas affilié, approuvé ou soutenu par Dialsoft LLC ou les exploitants officiels des serveurs T4C.
- Les informations publiques proviennent du [wiki officiel T4C NMS](https://t4c.fandom.com/fr) et du site [T4C NMS Révolution](https://nmsrevolution.com/).
- Les assets cartographiques utilisés sont issus des sources publiques du wiki officiel T4C NMS Revolution.
- Les assets propriétaires ne doivent pas être commités sans autorisation explicite.

## Roadmap

- Calibration et ajout de POI pour Raven's Dust, Stoneheim, Drake Island
- Ajout de POI reels (PNJ, monstres, quetes) pour toutes les regions
- Export image (PNG/SVG)
- Tests front (Playwright)

## Licence

MIT. Voir `LICENSE`.

## Credits des sources d'information

- [Wiki officiel T4C (fr)](https://t4c.fandom.com/fr)
- [Site officiel NMS Revolution](https://www.nms-revolution.com)
- [t4c-nms-overview par Bignole (code source)](https://github.com/gobeline-dev/t4c-nms-overview)
- [t4c-nms-overview par Bignole (site)](https://gobeline-dev.github.io/t4c-nms-overview/)
