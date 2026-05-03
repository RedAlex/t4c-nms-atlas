# Contribuer a Atlas NMS Revolution

Merci pour votre aide.

## Regles de contribution

- Le projet est en francais.
- Les informations doivent venir de sources publiques verifiables.
- Chaque PR doit decrire clairement les sources utilisees.
- Pas de contenu proprietaire sans autorisation.

## Workflow recommande

1. Fork du depot
2. Branche de travail: `feature/nom-court`
3. Commit clair et atomique
4. Pull Request avec:
  - resume du changement
  - source(s)
  - captures ecran si UI

## Modele multi-carte (phase 4+)

Le projet fonctionne avec un registre de mondes + des fichiers de cartes:

- `data/maps.json`: index principal (`mapFiles[]`, `worldsFile`)
- `data/worlds.json`: registre des mondes (`worldId`, image HD, dimensions, `mapFiles`)
- `data/maps/<carte>.json`: definition d'une carte (objet `map`)

Dans une carte:

- `id`: identifiant stable en kebab-case
- `worldId`: identifiant du monde de reference
- `image` / `hdImage`: images principales de rendu
- `subMaps[]`: sous-cartes navigables
- `pois[]`: POI de carte principale

Types de POI valides:

- `lieux`
- `pnj`
- `monstres`
- `portal`
- `lien`
- `transition`

Systemes de coordonnees supportes:

- Carte principale (mode Gobeline): `gx`, `gy` + `worldId`
- Sous-carte (mode direct): `x`, `y` (0 a 100)
- Sous-carte legacy (si necessaire): `gameX`, `gameY` + calibration

## Transitions POI -> POI (entree/sortie)

Une transition est un POI connecte a un autre POI de destination.

Champs recommandes pour `type: "transition"`:

- `id`: obligatoire (source)
- `targetPoiId`: obligatoire (destination)
- `targetMapId`: requis pour cibler une autre carte principale
- `openSubMapId`: requis pour cibler une sous-carte
- `transitionType`: optionnel (`cave`, `stairs`, `portal`, etc.)

Exemple carte principale -> sous-carte:

```json
{
  "id": "arakas-lh-cave-entry",
  "type": "transition",
  "transitionType": "cave",
  "name": "Entree grotte LightHaven",
  "gx": 2870,
  "gy": 1120,
  "worldId": 0,
  "openSubMapId": "lighthaven",
  "targetPoiId": "lh-cave-exit",
  "wikiUrl": ""
}
```

Exemple sous-carte -> carte principale:

```json
{
  "id": "lh-cave-exit",
  "type": "transition",
  "transitionType": "cave",
  "name": "Sortie grotte LightHaven",
  "x": 48,
  "y": 80,
  "targetMapId": "arakas",
  "targetPoiId": "arakas-lh-cave-entry",
  "wikiUrl": ""
}
```

## Ajouter ou modifier des donnees

1. Mettre a jour `data/maps/<carte>.json` (ou ajouter un nouveau fichier carte).
2. Mettre a jour `data/maps.json` si nouveau fichier de carte.
3. Mettre a jour `data/worlds.json` si nouveau `worldId` ou changement de registre.
4. Lancer la QA data:
  - `npm.cmd run data:lint`
5. Verifier l'app:
  - navigation carte/sous-carte
  - filtres
  - favoris
  - transitions POI -> POI

## Exemples de PR attendues

### 1) Nouvelle carte

- Ajouter `data/maps/nouvelle-carte.json`
- Referencer le fichier dans `data/maps.json`
- Associer la carte a un `worldId` existant (ou ajouter un monde dans `data/worlds.json`)
- Fournir source + capture d'ecran

### 2) Nouveau portail inter-cartes

- Ajouter un POI `type: "portal"` avec `targetMapId`
- Verifier que `targetMapId` existe dans les cartes chargees
- Tester le clic gauche dans l'application

### 3) Correction d'un lien/transition casse(e)

- Corriger `targetPoiId` et/ou `targetMapId`
- Verifier l'existence des 2 POI (`id` source + `id` cible)
- Lancer `npm.cmd run data:lint` et confirmer 0 erreur bloquante

## Verification manuelle minimale

- Ouvrir `index.html`
- Verifier recherche, filtres et tooltips POI
- Verifier ouverture sous-carte depuis un POI
- Verifier transitions POI -> POI (aller + retour)
- Verifier clic droit POI -> wiki externe
