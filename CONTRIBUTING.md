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

## Convention donnees

Le projet utilise un index + des fichiers regionaux:

- `data/maps.json`: contient `_source` et `mapFiles[]`
- `data/maps/<region>.json`: contient l'objet `map` complet de la region

Dans chaque `map` regional:

- `id`: identifiant stable en kebab-case
- `image`: image affichee sur la page region
- `nmsImage`: image de la carte monde (tuile de la page d'accueil)
- `calibration.gamePoints[]`: au moins 3 points valides (`gameX`, `gameY`, `mapX`, `mapY`)
- `pois[]`: points d'interet filtres par `type` parmi `lieux`, `pnj`, `monstres`

## Ajouter un POI

1. Ouvrir le fichier region dans `data/maps/`.
2. Ajouter une entree dans `map.pois[]` avec les champs suivants:
   - `type`: `lieux`, `pnj` ou `monstres`
   - `name`: nom affiche
   - `description`: texte du tooltip
   - Position:
     - soit `gameX` + `gameY` (recommande, base sur la calibration)
     - soit `x` + `y` (pourcentage direct 0-100)
   - `openSubMapId`: id d'une sous-carte existante dans `map.subMaps[]`
   - `wikiUrl`: lien wiki a ouvrir au clic droit
3. Verifier que `openSubMapId` reference bien une sous-carte presente dans `subMaps`.
4. Verifier l'affichage dans l'app (filtre, tooltip, clic gauche, clic droit).

Exemple minimal:

```json
{
  "type": "pnj",
  "name": "Marchand",
  "description": "Vendeur principal de la ville.",
  "gameX": 2850,
  "gameY": 1080,
  "openSubMapId": "arakas-general",
  "wikiUrl": "https://t4c.fandom.com/fr/wiki/LightHaven"
}
```

## Verification manuelle

- Ouvrir `index.html`
- Verifier le filtre `Lieux / Pnj / Monstres`
- Verifier le tooltip au survol d'un POI
- Verifier le clic gauche POI -> sous-carte
- Verifier le clic droit POI -> wiki externe
