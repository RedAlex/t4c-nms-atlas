// ── Auto-updater ─────────────────────────────────────────────────────────────
// Vérifie la dernière release GitHub et propose une mise à jour si disponible.
// Configure GITHUB_REPO avec le dépôt cible avant publication.

const { app, dialog } = require("electron");
const https  = require("https");
const fs     = require("fs");
const path   = require("path");
const { execFile } = require("child_process");

// ── Configuration ─────────────────────────────────────────────────────────────
const GITHUB_REPO = "RedAlex/t4c-nms-atlas";
const ZIP_ASSET_NAME = "atlas-nms-revolution.zip";

// ── Utilitaires ───────────────────────────────────────────────────────────────

/**
 * Retourne true si versionB est plus récente que versionA.
 * Supporte le préfixe "v" (ex: "v0.2.0").
 */
function isNewer(versionA, versionB) {
  const parse = (v) => v.replace(/^v/, "").split(".").map(Number);
  const a = parse(versionA);
  const b = parse(versionB);
  for (let i = 0; i < 3; i++) {
    if ((b[i] || 0) > (a[i] || 0)) return true;
    if ((b[i] || 0) < (a[i] || 0)) return false;
  }
  return false;
}

/**
 * Requête HTTPS GET → JSON. Suit les redirections.
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "AtlasNMSRevolution-Updater" } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
  });
}

/**
 * Télécharge un fichier en suivant les redirections.
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const get = (targetUrl) => {
      https.get(targetUrl, { headers: { "User-Agent": "AtlasNMSRevolution-Updater" } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Download HTTP ${res.statusCode}`));
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
        file.on("error", (err) => { fs.unlink(dest, () => {}); reject(err); });
      }).on("error", reject);
    };
    get(url);
  });
}

// ── Mise à jour ────────────────────────────────────────────────────────────────

/**
 * Vérifie GitHub et déclenche la mise à jour si une version plus récente existe.
 * @param {Electron.BrowserWindow} mainWindow
 */
async function checkForUpdates(mainWindow) {
  // Ne pas tourner en mode dev (app non packagée)
  if (!app.isPackaged) return;

  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
  let release;

  try {
    release = await fetchJson(apiUrl);
  } catch (_err) {
    // Pas de connexion ou repo introuvable → échec silencieux
    return;
  }

  const latestVersion = release?.tag_name;
  const currentVersion = app.getVersion();

  if (!latestVersion || !isNewer(currentVersion, latestVersion)) return;

  const asset = (release.assets || []).find((a) => a.name === ZIP_ASSET_NAME);
  if (!asset?.browser_download_url) return;

  // ── Dialogue de confirmation ──
  const { response } = await dialog.showMessageBox(mainWindow, {
    type:      "info",
    title:     "Mise à jour disponible",
    message:   `Atlas NMS Revolution ${latestVersion} est disponible`,
    detail:    `Version actuelle : v${currentVersion}\n\nVoulez-vous mettre à jour maintenant ? L'application va redémarrer automatiquement.`,
    buttons:   ["Mettre à jour", "Plus tard"],
    defaultId: 0,
    cancelId:  1,
  });

  if (response !== 0) return;

  // ── Téléchargement ──
  const tmpDir    = app.getPath("temp");
  const zipPath   = path.join(tmpDir, "atlas-nms-update.zip");
  const extractTo = path.join(tmpDir, "atlas-nms-update");
  const appDir    = path.dirname(app.getPath("exe"));
  const exePath   = app.getPath("exe");
  const scriptPath = path.join(tmpDir, "atlas-nms-update.bat");

  try {
    await downloadFile(asset.browser_download_url, zipPath);
  } catch (err) {
    await dialog.showMessageBox(mainWindow, {
      type:    "error",
      title:   "Erreur de mise à jour",
      message: "Impossible de télécharger la mise à jour.",
      detail:  err.message,
      buttons: ["OK"],
    });
    return;
  }

  // ── Script de remplacement (s'exécute après la fermeture de l'app) ──
  // Séquence : attend fermeture → extrait ZIP → copie avec robocopy → relance
  // robocopy retourne 0-7 = succès (0=rien copié, 1=OK, 3=OK+extra…), ≥8 = erreur
  const errorLog = path.join(tmpDir, "atlas-update-error.log");
  const script = [
    "@echo off",
    "timeout /t 3 /nobreak > nul",
    `powershell -Command "if (Test-Path '${extractTo}') { Remove-Item -Recurse -Force '${extractTo}' }"`,
    `powershell -Command "Expand-Archive -Force -LiteralPath '${zipPath}' -DestinationPath '${extractTo}'"`,
    `if %errorlevel% neq 0 (`,
    `  echo [%date% %time%] Echec extraction ZIP (code %errorlevel%) > "${errorLog}"`,
    `  goto :cleanup`,
    `)`,
    `robocopy "${extractTo}\\Atlas NMS Revolution-win32-x64" "${appDir}" /E /IS /IT /NFL /NDL /NJH /NJS`,
    `if %errorlevel% geq 8 (`,
    `  echo [%date% %time%] Echec copie fichiers (code %errorlevel%) > "${errorLog}"`,
    `  goto :cleanup`,
    `)`,
    `start "" "${exePath}"`,
    `:cleanup`,
    `if exist "${extractTo}" rmdir /S /Q "${extractTo}"`,
    `if exist "${zipPath}" del "${zipPath}"`,
    `del "%~f0"`,
  ].join("\r\n");

  fs.writeFileSync(scriptPath, script, "utf8");

  execFile("cmd.exe", ["/c", scriptPath], {
    detached: true,
    stdio:    "ignore",
    windowsHide: true,
  }).unref();

  app.quit();
}

module.exports = { checkForUpdates, isNewer };
