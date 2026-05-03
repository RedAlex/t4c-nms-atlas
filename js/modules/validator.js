/**
 * Validation du modèle de données — cartes, POIs, portails, liens
 * @module validator
 *
 * Note: Zod n'est pas utilisé car le renderer Electron tourne en sandbox
 * (nodeIntegration: false) sans bundler — les node_modules sont inaccessibles.
 * La validation manuelle par schéma offre des garanties équivalentes.
 */

/** @type {string[]} Types de POI valides */
const VALID_POI_TYPES = ["lieux", "pnj", "monstres", "portal", "lien", "transition"];

/**
 * Valide un POI et retourne les erreurs trouvées
 * @param {Object} poi - POI à valider
 * @param {number} index - Index dans le tableau
 * @param {string} context - Contexte d'affichage (ex: "arakas.pois")
 * @param {Set<string>} mapIds - IDs de cartes disponibles pour vérifier targetMapId
 * @param {Set<string>} subMapIds - IDs de sous-cartes disponibles pour vérifier openSubMapId
 * @param {Map<string, Set<string>>} poiIdsByMap - Registre des ids POI par carte
 * @returns {string[]} Liste des erreurs
 */
function validatePoi(poi, index, context, mapIds, subMapIds, poiIdsByMap) {
  const errors = [];
  const ref = `${context}[${index}]`;

  if (!poi || typeof poi !== "object") {
    return [`${ref}: doit être un objet`];
  }

  if (!poi.type || !VALID_POI_TYPES.includes(poi.type)) {
    errors.push(`${ref}: type invalide "${poi.type}" (attendu: ${VALID_POI_TYPES.join(", ")})`);
  }

  // Vérification des coordonnées : au moins un système doit être présent
  const hasGobeline = typeof poi.gx === "number" && typeof poi.gy === "number";
  const hasDirect = typeof poi.x === "number" && typeof poi.y === "number";
  const hasLegacy = typeof poi.gameX === "number" && typeof poi.gameY === "number";
  if (!hasGobeline && !hasDirect && !hasLegacy) {
    errors.push(`${ref}: aucune coordonnée valide (gx/gy, x/y ou gameX/gameY requis)`);
  }

  // Vérification des références de sous-carte
  if (poi.openSubMapId && subMapIds && !subMapIds.has(poi.openSubMapId)) {
    errors.push(`${ref}: openSubMapId "${poi.openSubMapId}" ne correspond à aucune sous-carte`);
  }

  // Vérification des portails (portal)
  if (poi.type === "portal") {
    if (!poi.targetMapId) {
      errors.push(`${ref}: portail sans targetMapId`);
    } else if (mapIds && !mapIds.has(poi.targetMapId)) {
      errors.push(`${ref}: targetMapId "${poi.targetMapId}" ne correspond à aucune carte connue`);
    }
  }

  // Vérification des liens POI→POI (lien)
  if (poi.type === "lien") {
    if (!poi.targetMapId) {
      errors.push(`${ref}: lien sans targetMapId`);
    } else if (mapIds && !mapIds.has(poi.targetMapId)) {
      errors.push(`${ref}: targetMapId "${poi.targetMapId}" ne correspond à aucune carte connue`);
    }
    if (poi.targetPoiId !== undefined && poi.targetPoiId !== null) {
      const targetMap = poi.targetMapId;
      if (poiIdsByMap && targetMap && mapIds && mapIds.has(targetMap)) {
        const targetPoiSet = poiIdsByMap.get(targetMap);
        if (targetPoiSet && !targetPoiSet.has(poi.targetPoiId)) {
          errors.push(
            `${ref}: targetPoiId "${poi.targetPoiId}" introuvable dans la carte "${targetMap}"`
          );
        }
      }
    }
  }

  // Vérification des transitions spatiales (entrée/sortie grotte, escalier, etc.)
  if (poi.type === "transition") {
    if (!poi.id) {
      errors.push(`${ref}: un POI de type "transition" doit avoir un champ "id" (requis pour le routage)`);
    }
    const hasMapTarget = !!poi.targetMapId;
    const hasSubMapTarget = !!poi.openSubMapId;
    if (!hasMapTarget && !hasSubMapTarget) {
      errors.push(`${ref}: transition sans destination (targetMapId ou openSubMapId requis)`);
    }
    if (!poi.targetPoiId) {
      errors.push(`${ref}: transition sans targetPoiId (point d'arrivée requis pour le routage)`);
    }
    if (hasMapTarget && mapIds && !mapIds.has(poi.targetMapId)) {
      errors.push(`${ref}: targetMapId "${poi.targetMapId}" ne correspond à aucune carte connue`);
    }
  }

  return errors;
}

/**
 * Valide une sous-carte et retourne les erreurs trouvées
 * @param {Object} subMap - Sous-carte à valider
 * @param {number} index - Index dans le tableau
 * @param {string} mapId - ID de la carte parente
 * @param {Set<string>} mapIds - IDs de cartes disponibles
 * @param {Map<string, Set<string>>} poiIdsByMap - Registre des ids POI par carte
 * @returns {string[]} Liste des erreurs
 */
function validateSubMap(subMap, index, mapId, mapIds, poiIdsByMap) {
  const errors = [];
  const ref = `${mapId}.subMaps[${index}]`;

  if (!subMap.id || typeof subMap.id !== "string") {
    errors.push(`${ref}: id manquant ou invalide`);
  }
  if (!subMap.name || typeof subMap.name !== "string") {
    errors.push(`${ref}: name manquant`);
  }
  if (!subMap.image || typeof subMap.image !== "string") {
    errors.push(`${ref}: image manquante`);
  }

  const subMapIds = null; // sous-cartes imbriquées non supportées
  (subMap.pois || []).forEach((poi, i) => {
    errors.push(...validatePoi(poi, i, `${ref}.pois`, mapIds, subMapIds, poiIdsByMap));
  });

  return errors;
}

/**
 * Valide une carte et retourne les erreurs trouvées
 * @param {Object} map - Carte à valider
 * @param {Set<string>} mapIds - IDs de toutes les cartes chargées
 * @param {Map<string, Set<string>>} poiIdsByMap - Registre des ids POI par carte
 * @returns {string[]} Liste des erreurs
 */
function validateMap(map, mapIds, poiIdsByMap) {
  const errors = [];

  if (!map.id || typeof map.id !== "string") {
    errors.push("carte inconnue: id manquant");
    return errors;
  }

  // Préfixe de source pour les messages d'erreur
  const src = map._sourceFile ? ` (${map._sourceFile})` : "";

  if (!map.name || typeof map.name !== "string") {
    errors.push(`${map.id}${src}: name manquant`);
  }

  if (typeof map.worldId !== "number") {
    errors.push(`${map.id}${src}: worldId manquant ou non numérique`);
  }

  // Construire le set des sous-cartes disponibles pour cette carte
  const subMapIds = new Set((map.subMaps || []).map((s) => s.id).filter(Boolean));

  // Valider les POIs de la carte principale
  (map.pois || []).forEach((poi, i) => {
    const poiErrors = validatePoi(poi, i, `${map.id}.pois`, mapIds, subMapIds, poiIdsByMap);
    // Ajouter la source du fichier à chaque erreur POI
    if (src && poiErrors.length > 0) {
      errors.push(...poiErrors.map((e) => `${e}${src}`));
    } else {
      errors.push(...poiErrors);
    }
  });

  // Valider les sous-cartes
  (map.subMaps || []).forEach((subMap, i) => {
    errors.push(...validateSubMap(subMap, i, map.id, mapIds, poiIdsByMap));
  });

  return errors;
}

/**
 * Construit un registre des ids POI indexé par mapId
 * Seuls les POIs ayant un champ `id` explicite sont indexés.
 * @param {Object[]} maps - Toutes les cartes chargées
 * @returns {Map<string, Set<string>>}
 */
function buildPoiIdsByMap(maps) {
  const registry = new Map();
  maps.forEach((map) => {
    if (!map.id) {
      return;
    }
    const ids = new Set();
    (map.pois || []).forEach((poi) => {
      if (poi.id && typeof poi.id === "string") {
        ids.add(poi.id);
      }
    });
    registry.set(map.id, ids);
  });
  return registry;
}

/**
 * Valide l'ensemble des cartes et mondes chargés.
 * Affiche les erreurs en console et retourne le tableau des erreurs.
 * @param {Object[]} maps - Toutes les cartes chargées
 * @param {Object[]|null} worlds - Registre des mondes
 * @returns {string[]} Liste de toutes les erreurs détectées
 */
export function validateData(maps, worlds) {
  if (!Array.isArray(maps) || maps.length === 0) {
    return [];
  }

  const allErrors = [];
  const mapIds = new Set(maps.map((m) => m.id).filter(Boolean));
  const poiIdsByMap = buildPoiIdsByMap(maps);

  // Vérifier que chaque carte a un monde associé
  if (Array.isArray(worlds) && worlds.length > 0) {
    const worldIds = new Set(worlds.map((w) => w.worldId));
    maps.forEach((map) => {
      if (typeof map.worldId === "number" && !worldIds.has(map.worldId)) {
        const src = map._sourceFile ? ` (${map._sourceFile})` : "";
        allErrors.push(`${map.id}${src}: worldId ${map.worldId} absent du registre worlds.json`);
      }
    });
  }

  // Valider chaque carte
  maps.forEach((map) => {
    allErrors.push(...validateMap(map, mapIds, poiIdsByMap));
  });

  if (allErrors.length > 0) {
    console.warn(`[validator] ${allErrors.length} problème(s) détecté(s) dans les données :`);
    allErrors.forEach((err) => console.warn(`  ⚠ ${err}`));
  }

  return allErrors;
}
