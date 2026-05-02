const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs/promises");
const path = require("path");
const { version } = require("../package.json");

async function readMapsData() {
  const mapsPath = path.join(__dirname, "..", "data", "maps.json");
  const raw = await fs.readFile(mapsPath, "utf-8");
  const index = JSON.parse(raw);

  // Format v2 : lire chaque fichier de carte individuellement
  if (Array.isArray(index.mapFiles)) {
    const maps = [];
    for (const relPath of index.mapFiles) {
      try {
        const filePath = path.join(__dirname, "..", relPath);
        const mapRaw = await fs.readFile(filePath, "utf-8");
        const mapData = JSON.parse(mapRaw);
        if (mapData.map) maps.push(mapData.map);
      } catch (_e) { /* ignorer les fichiers manquants */ }
    }

    let worlds = null;
    if (index.worldsFile) {
      try {
        const worldsPath = path.join(__dirname, "..", index.worldsFile);
        const worldsRaw = await fs.readFile(worldsPath, "utf-8");
        const worldsData = JSON.parse(worldsRaw);
        worlds = Array.isArray(worldsData.worlds) ? worldsData.worlds : null;
      } catch (_e) { /* ignorer */ }
    }

    return { maps, worlds, _version: index._version || 2 };
  }

  // Ancien format : maps[] directement dans maps.json
  return index;
}

async function readWorldsData() {
  const worldsPath = path.join(__dirname, "..", "data", "worlds.json");
  const raw = await fs.readFile(worldsPath, "utf-8");
  const data = JSON.parse(raw);
  return Array.isArray(data?.worlds) ? data.worlds : null;
}

async function readMapFile(relPath) {
  const filePath = path.join(__dirname, "..", relPath);
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

contextBridge.exposeInMainWorld("desktopAPI", {
  readMapsData,
  readWorldsData,
  readMapFile,
  appVersion: version,
});
