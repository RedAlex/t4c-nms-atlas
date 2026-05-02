/**
 * Chargement et gestion des données de cartes
 * @module data-loader
 */

/**
 * Charge les données des cartes et des mondes
 * @returns {Promise<Object|null>} Données des cartes avec worlds optionnel
 */
export async function loadMapsData() {
  try {
    const response = await fetch("data/maps.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();

    // Charger le registre des mondes si référencé (format v2)
    let worlds = null;
    if (data?.worldsFile) {
      worlds = await loadWorldsData(data.worldsFile);
    }

    // Nouveau format v2+: index avec fichiers régionaux
    if (Array.isArray(data?.mapFiles) && data.mapFiles.length) {
      const maps = await loadMapsFromFiles(data.mapFiles, worlds);
      return { _source: data._source, _version: data._version || 1, maps, worlds };
    }

    // Ancien format: toutes les cartes dans maps.json
    if (Array.isArray(data?.maps)) {
      return { ...data, worlds };
    }

    return null;
  } catch (_err) {
    if (window.desktopAPI?.readMapsData) {
      return window.desktopAPI.readMapsData();
    }
    return null;
  }
}

/**
 * Charge le registre des mondes Gobeline
 * @param {string} worldsFile - Chemin vers worlds.json
 * @returns {Promise<Object[]|null>} Liste des mondes ou null
 */
export async function loadWorldsData(worldsFile) {
  try {
    const response = await fetch(worldsFile);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} on ${worldsFile}`);
    }
    const data = await response.json();
    return Array.isArray(data?.worlds) ? data.worlds : null;
  } catch (_err) {
    // Fallback via API desktop (Electron) si fetch échoue
    if (window.desktopAPI?.readWorldsData) {
      return window.desktopAPI.readWorldsData();
    }
    return null;
  }
}

/**
 * Charge les cartes depuis des fichiers et les enrichit avec les données de leur monde
 * @param {string[]} mapFiles - Chemins des fichiers de cartes
 * @param {Object[]|null} worlds - Registre des mondes (pour enrichissement)
 * @returns {Promise<Object[]>} Données des cartes enrichies
 */
export async function loadMapsFromFiles(mapFiles, worlds = null) {
  const requests = mapFiles.map(async (filePath) => {
    let data;
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} on ${filePath}`);
      }
      data = await response.json();
    } catch (_err) {
      // Fallback via API desktop (Electron) si fetch échoue
      if (window.desktopAPI?.readMapFile) {
        data = await window.desktopAPI.readMapFile(filePath);
      } else {
        throw _err;
      }
    }
    const map = data?.map || null;
    if (!map) return null;

    // Enrichissement : attacher les données du monde (image HD, dimensions)
    if (worlds && typeof map.worldId === "number") {
      const world = worlds.find((w) => w.worldId === map.worldId) || null;
      if (world) {
        map._world = world;
        // Image prioritaire : locale d'abord, puis URL Gobeline
        map.hdImage = map.hdImage || world.imageLocalPath || world.imageUrl || null;
      }
    }
    return map;
  });

  const maps = await Promise.all(requests);
  return maps.filter(Boolean);
}
