/**
 * Chargement et gestion des données de cartes
 * @module data-loader
 */

/**
 * Charge les données des cartes
 * @returns {Promise<Object|null>} Données des cartes
 */
export async function loadMapsData() {
  try {
    const response = await fetch("data/maps.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();

    // Nouveau format: index avec fichiers regionaux
    if (Array.isArray(data?.mapFiles) && data.mapFiles.length) {
      const maps = await loadMapsFromFiles(data.mapFiles);
      return { _source: data._source, maps };
    }

    // Ancien format: toutes les cartes dans maps.json
    if (Array.isArray(data?.maps)) {
      return data;
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
 * Charge les cartes depuis des fichiers
 * @param {string[]} mapFiles - Chemins des fichiers de cartes
 * @returns {Promise<Object[]>} Données des cartes
 */
export async function loadMapsFromFiles(mapFiles) {
  const requests = mapFiles.map(async (filePath) => {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} on ${filePath}`);
    }
    const data = await response.json();
    return data?.map || null;
  });

  const maps = await Promise.all(requests);
  return maps.filter(Boolean);
}
