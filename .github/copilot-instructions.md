# Règles générales — Atlas NMS Revolution

## Langue — Français obligatoire

**RÈGLE ABSOLUE POUR COPILOT :** Ce projet est en français. Copilot doit **toujours** :

- Générer les **messages de commit en français** (y compris via le bouton "Generate Commit Message")
- Utiliser le format : `type: description courte en français`
- Exemples acceptés :
  - `feat: ajout du système de favoris`
  - `fix: correction du calcul de calibration`
  - `chore: mise à jour des dépendances`
  - `docs: mise à jour du README`
- Ne jamais écrire de message de commit en anglais pour ce projet

---

## Build + lancement obligatoire après chaque modification

**RÈGLE ABSOLUE POUR COPILOT :** Après **toute** modification de fichier (app.js, index.html, styles.css, data/maps.json, data/images/\*, electron/\*, scripts/\*), Copilot doit **lui-même** exécuter la commande suivante dans le terminal avant de conclure sa réponse :

```bat
.\build.bat
```

> ⚠️ Ne jamais utiliser seulement `npm.cmd run build:win` — cela ne lance pas l'application.
> ⚠️ Copilot ne doit PAS demander à l'utilisateur de lancer le build — il doit le faire automatiquement via le terminal.

`.\build.bat` effectue dans l'ordre :

1. Fermeture des instances existantes
2. Build complet (electron-packager + zip)
3. Lancement automatique de l'application

Le build produit :

- `release/Atlas NMS Revolution-win32-x64/` — dossier extrait prêt à lancer
- `release/atlas-nms-revolution.zip` — archive distribuable
