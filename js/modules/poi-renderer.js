/**
 * Rendu et gestion des Points d'Intérêt (POI)
 * @module poi-renderer
 */

import state, { updateState } from "./state.js";
import { createGameToPercentTransform, resolvePoiPosition } from "./calibration.js";
import { getDisplayedImageRect, copyTextToClipboard, percentToDisplayCoords, normalizeUrlCandidate, buildWikiSearchUrl, fuzzyMatchText } from "./utils.js";
import { showHoverCard, hideHoverCard } from "./ui-helpers.js";
import { isPoiFavorite, togglePoiFavorite } from "./favorites.js";

/**
 * Rend les points d'intérêt interactifs (carte principale)
 */
export function renderInteractivePoints() {
  const zoneLayer = document.getElementById("zone-layer");
  const mapSearchCount = document.getElementById("map-search-count");
  if (!zoneLayer) {
    return;
  }
  zoneLayer.innerHTML = "";
  zoneLayer.classList.toggle("titles-hidden", !state.showPoiTitles);
  hideHoverCard(document.getElementById("map-hover-card"));

  const gameToPercent = createGameToPercentTransform(state.activeMap?.calibration);
  const world = state.activeMap?._world || null;
  const pois = state.activeMap?.pois || [];
  const query = state.mapSearchQuery || "";
  const typedPois =
    state.activeFilter === "favoris"
      ? pois.filter((poi) => isPoiFavorite(poi))
      : pois.filter((poi) => {
          if (state.activeFilter === "lieux") {
            // Les transitions et portails sont assimilés aux lieux pour rester visibles.
            return poi.type === "lieux" || poi.type === "portal" || poi.type === "transition";
          }
          return poi.type === state.activeFilter;
        });
  const visiblePois = typedPois.filter((poi) => fuzzyMatchText(poi.name || "", query));

  if (mapSearchCount) {
    mapSearchCount.textContent = query ? `${visiblePois.length} resultat(s)` : "";
  }

  visiblePois.forEach((poi) => {
    const position = resolvePoiPosition(poi, gameToPercent, world);
    if (!position) {
      return;
    }

    const marker = document.createElement("div");
    marker.className = `poi ${poi.type}`;
    if (query) {
      marker.classList.add("search-match");
    }
    marker.setAttribute("role", "button");
    marker.tabIndex = 0;
    marker.style.left = `${position.x}%`;
    marker.style.top = `${position.y}%`;
    marker.setAttribute("aria-label", poi.name || poi.type);
    if (poi.id) {
      marker.dataset.poiId = poi.id;
    }
    if (poi.openSubMapId) {
      marker.dataset.submapId = poi.openSubMapId;
    }
    marker.classList.toggle("favorite", isPoiFavorite(poi));
    if (poi.name) {
      const title = document.createElement("span");
      title.className = "poi-title";
      title.textContent = poi.name;
      marker.appendChild(title);
    }

    const mapStage = document.getElementById("map-stage");
    const mapHoverCard = document.getElementById("map-hover-card");

    const hasTargetPoi = typeof poi.targetPoiId === "string" && poi.targetPoiId.length > 0;
    const isPortal = poi.type === "portal";
    const hintText = isPortal
      ? `Clic: aller vers ${poi.targetMapId || "carte liée"}`
      : hasTargetPoi
        ? "Clic: teleporter vers POI cible | Shift+Clic: favori | Clic droit: wiki"
      : "Clic: ouvrir carte | Shift+Clic: favori | Clic droit: wiki";

    if (isPortal && poi.targetMapId) {
      marker.dataset.targetMapId = poi.targetMapId;
    }

    marker.addEventListener("mouseenter", (event) => {
      showHoverCard(mapHoverCard, mapStage, poi, event, hintText);
    });
    marker.addEventListener("mousemove", (event) => {
      showHoverCard(mapHoverCard, mapStage, poi, event, hintText);
    });
    marker.addEventListener("mouseleave", () => hideHoverCard(mapHoverCard));
    marker.addEventListener("blur", () => hideHoverCard(mapHoverCard));
    marker.addEventListener("click", async (event) => {
      if (event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        const added = togglePoiFavorite(poi);
        marker.classList.toggle("favorite", added);
        if (state.activeFilter === "favoris") {
          renderInteractivePoints();
        }
        return;
      }
      if (await handleCalibrationClickCopy(event)) {
        event.stopPropagation();
        return;
      }
      handlePoiOpenMap(poi);
    });
    marker.addEventListener("keydown", async (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      if (await handleCalibrationClickCopy(event)) {
        return;
      }
      handlePoiOpenMap(poi);
    });
    marker.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      handlePoiOpenWiki(poi);
    });

    zoneLayer.appendChild(marker);
  });

  if (state.showGridCoords) {
    renderCalibrationMarkers(gameToPercent);
  }
}

/**
 * Rend les points de calibration (carte principale)
 * @param {Function} gameToPercent - Fonction de transformation
 */
export function renderCalibrationMarkers(gameToPercent) {
  const zoneLayer = document.getElementById("zone-layer");
  const points = state.activeMap?.calibration?.gamePoints || [];
  if (!Array.isArray(points) || !gameToPercent || !zoneLayer) {
    return;
  }

  points.forEach((point, index) => {
    if (typeof point?.gameX !== "number" || typeof point?.gameY !== "number") {
      return;
    }
    const position = gameToPercent(point.gameX, point.gameY);
    if (!position) {
      return;
    }

    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "poi calibration-point";
    marker.style.left = `${position.x}%`;
    marker.style.top = `${position.y}%`;
    marker.setAttribute("aria-label", point.name || `Calibration ${index + 1}`);
    const title = document.createElement("span");
    title.className = "poi-title";
    title.textContent = `CAL ${index + 1}${point.name ? ` — ${point.name}` : ""}`;
    marker.appendChild(title);

    const copyCalibrationPoint = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const coords = { x: point.mapX ?? 0, y: point.mapY ?? 0 };
      const mapDevCoords = document.getElementById("map-dev-coords");
      const copied = await copyTextToClipboard(
        `${coords.x.toFixed(2)},${coords.y.toFixed(2)}`
      );
      if (copied && mapDevCoords) {
        mapDevCoords.textContent = `GX ${coords.x.toFixed(2)} | GY ${coords.y.toFixed(2)} (copie)`;
        mapDevCoords.classList.remove("hidden");
      }
    };

    marker.addEventListener("click", copyCalibrationPoint);
    marker.addEventListener("contextmenu", copyCalibrationPoint);
    zoneLayer.appendChild(marker);
  });
}

/**
 * Rend les points d'intérêt (sous-carte)
 */
export function renderSubmapPois() {
  const submapZoneLayer = document.getElementById("submap-zone-layer");
  const submapSearchCount = document.getElementById("submap-search-count");
  if (!submapZoneLayer) {
    return;
  }
  submapZoneLayer.innerHTML = "";
  submapZoneLayer.classList.toggle("titles-hidden", !state.showSubmapPoiTitles);
  hideHoverCard(document.getElementById("submap-hover-card"));

  const gameToPercent = createGameToPercentTransform(state.activeSubMap?.calibration);
  const pois = state.activeSubMap?.pois || [];
  const query = state.submapSearchQuery || "";
  const typedPois =
    state.activeSubmapFilter === "favoris"
      ? pois.filter((poi) => isPoiFavorite(poi))
      : pois.filter((poi) => {
          if (state.activeSubmapFilter === "lieux") {
            return poi.type === "lieux" || poi.type === "portal" || poi.type === "transition";
          }
          return poi.type === state.activeSubmapFilter;
        });
  const visiblePois = typedPois.filter((poi) => fuzzyMatchText(poi.name || "", query));

  if (submapSearchCount) {
    submapSearchCount.textContent = query ? `${visiblePois.length} resultat(s)` : "";
  }

  visiblePois.forEach((poi) => {
    const position = resolvePoiPosition(poi, gameToPercent);
    if (!position) {
      return;
    }

    const marker = document.createElement("div");
    marker.className = `poi ${poi.type}`;
    if (query) {
      marker.classList.add("search-match");
    }
    marker.setAttribute("role", "button");
    marker.tabIndex = 0;
    marker.style.left = `${position.x}%`;
    marker.style.top = `${position.y}%`;
    marker.setAttribute("aria-label", poi.name || poi.type);
    if (poi.id) {
      marker.dataset.poiId = poi.id;
    }
    marker.classList.toggle("favorite", isPoiFavorite(poi));

    if (poi.name) {
      const title = document.createElement("span");
      title.className = "poi-title";
      title.textContent = poi.name;
      marker.appendChild(title);
    }

    const submapStage = document.getElementById("submap-stage");
    const submapHoverCard = document.getElementById("submap-hover-card");

    marker.addEventListener("mouseenter", (event) => {
      showHoverCard(
        submapHoverCard,
        submapStage,
        poi,
        event,
        "Shift+Clic: favori | Clic droit: wiki"
      );
    });
    marker.addEventListener("mousemove", (event) => {
      showHoverCard(
        submapHoverCard,
        submapStage,
        poi,
        event,
        "Shift+Clic: favori | Clic droit: wiki"
      );
    });
    marker.addEventListener("mouseleave", () => hideHoverCard(submapHoverCard));
    marker.addEventListener("blur", () => hideHoverCard(submapHoverCard));
    marker.addEventListener("click", (event) => {
      if (!event.shiftKey) {
        handlePoiOpenMap(poi);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const added = togglePoiFavorite(poi);
      marker.classList.toggle("favorite", added);
      if (state.activeSubmapFilter === "favoris") {
        renderSubmapPois();
      }
    });
    marker.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      const wikiUrl =
        normalizeUrlCandidate(poi.wikiUrl) ||
        buildWikiSearchUrl(poi.name) ||
        normalizeUrlCandidate(state.activeSubMap?._meta?.checkUrls?.[0]);
      if (wikiUrl) {
        window.open(wikiUrl, "_blank", "noopener");
      }
    });

    submapZoneLayer.appendChild(marker);
  });

  if (state.showSubmapGridCoords) {
    renderSubmapCalibrationMarkers(gameToPercent);
  }
}

/**
 * Rend les points de calibration (sous-carte)
 * @param {Function} gameToPercent - Fonction de transformation
 */
export function renderSubmapCalibrationMarkers(gameToPercent) {
  const submapZoneLayer = document.getElementById("submap-zone-layer");
  const points = state.activeSubMap?.calibration?.gamePoints || [];
  if (!Array.isArray(points) || !gameToPercent || !submapZoneLayer) {
    return;
  }

  points.forEach((point, index) => {
    if (typeof point?.gameX !== "number" || typeof point?.gameY !== "number") {
      return;
    }
    const position = gameToPercent(point.gameX, point.gameY);
    if (!position) {
      return;
    }

    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "poi calibration-point";
    marker.style.left = `${position.x}%`;
    marker.style.top = `${position.y}%`;
    marker.setAttribute("aria-label", point.name || `Calibration ${index + 1}`);
    const title = document.createElement("span");
    title.className = "poi-title";
    title.textContent = `CAL ${index + 1}${point.name ? ` — ${point.name}` : ""}`;
    marker.appendChild(title);

    const copyCalibrationPoint = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const coords = { x: point.mapX ?? 0, y: point.mapY ?? 0 };
      const submapDevCoords = document.getElementById("submap-dev-coords");
      const copied = await copyTextToClipboard(
        `${coords.x.toFixed(2)},${coords.y.toFixed(2)}`
      );
      if (copied && submapDevCoords) {
        submapDevCoords.textContent = `GX ${coords.x.toFixed(2)} | GY ${coords.y.toFixed(2)} (copie)`;
        submapDevCoords.classList.remove("hidden");
      }
    };

    marker.addEventListener("click", copyCalibrationPoint);
    marker.addEventListener("contextmenu", copyCalibrationPoint);
    submapZoneLayer.appendChild(marker);
  });
}

/**
 * Gère le clic sur un POI pour ouvrir la sous-carte
 * @param {Object} poi - Point d'intérêt
 */
export function handlePoiOpenMap(poi) {
  if (!state.activeMap) {
    return;
  }

  // Navigation prioritaire : un POI explicitement ciblé.
  if (poi.targetPoiId) {
    navigateToTargetPoi(poi);
    return;
  }

  // Type portal : navigation vers une autre carte
  if (poi.type === "portal" && poi.targetMapId) {
    import("./map-view.js").then(({ openMap }) => {
      openMap(poi.targetMapId);
    });
    return;
  }

  const subMaps = state.activeMap.subMaps || [];
  const targetSubMapId = poi.openSubMapId || subMaps[0]?.id;
  if (!targetSubMapId) {
    return;
  }

  // Importé dynamiquement pour éviter la dépendance circulaire
  import("./submap-view.js").then(({ openSubMap }) => {
    openSubMap(targetSubMapId);
  });
}

/**
 * Trouve le POI cible d'une transition.
 * @param {Object} poi - POI source cliqué
 * @returns {{ mapId: string, subMapId: string|null, targetPoi: Object }|null}
 */
export function resolvePoiTargetLocation(poi) {
  if (!poi?.targetPoiId || !state.maps?.length) {
    return null;
  }

  // Cas 1: cible explicitement sur une carte donnée
  if (poi.targetMapId) {
    const targetMap = state.maps.find((m) => m.id === poi.targetMapId);
    if (!targetMap) {
      return null;
    }
    const mapPoi = (targetMap.pois || []).find((p) => p.id === poi.targetPoiId);
    if (mapPoi) {
      return { mapId: targetMap.id, subMapId: null, targetPoi: mapPoi };
    }
    for (const subMap of targetMap.subMaps || []) {
      const subPoi = (subMap.pois || []).find((p) => p.id === poi.targetPoiId);
      if (subPoi) {
        return { mapId: targetMap.id, subMapId: subMap.id, targetPoi: subPoi };
      }
    }
  }

  // Cas 2: cible explicitement sur une sous-carte de la carte active
  if (poi.openSubMapId && state.activeMap) {
    const targetSubMap = (state.activeMap.subMaps || []).find((s) => s.id === poi.openSubMapId);
    const subPoi = (targetSubMap?.pois || []).find((p) => p.id === poi.targetPoiId);
    if (subPoi) {
      return { mapId: state.activeMap.id, subMapId: targetSubMap.id, targetPoi: subPoi };
    }
  }

  // Cas 3: fallback global (recherche sur toutes les cartes/sous-cartes)
  for (const map of state.maps) {
    const mapPoi = (map.pois || []).find((p) => p.id === poi.targetPoiId);
    if (mapPoi) {
      return { mapId: map.id, subMapId: null, targetPoi: mapPoi };
    }
    for (const subMap of map.subMaps || []) {
      const subPoi = (subMap.pois || []).find((p) => p.id === poi.targetPoiId);
      if (subPoi) {
        return { mapId: map.id, subMapId: subMap.id, targetPoi: subPoi };
      }
    }
  }

  return null;
}

/**
 * Attend l'apparition d'un marqueur POI dans un layer.
 * @param {string} layerId - ID du layer DOM
 * @param {string} poiId - ID du POI
 * @returns {Promise<HTMLElement|null>}
 */
async function waitForPoiMarker(layerId, poiId) {
  const escapedPoiId = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(poiId) : poiId;
  const selector = `.poi[data-poi-id="${escapedPoiId}"]`;
  for (let i = 0; i < 12; i++) {
    const layer = document.getElementById(layerId);
    const marker = layer?.querySelector(selector);
    if (marker) {
      return marker;
    }
    await new Promise((resolve) => window.setTimeout(resolve, 30));
  }
  return null;
}

/**
 * Centre visuellement la vue sur un marqueur POI (si présent).
 * @param {string} layerId - ID du layer contenant les POIs
 * @param {string} stageId - ID du stage (viewport)
 * @param {string} poiId - ID du POI
 */
async function centerViewOnPoi(layerId, stageId, poiId) {
  const marker = await waitForPoiMarker(layerId, poiId);
  if (!marker) {
    return;
  }

  marker.classList.add("poi-target-focus");
  marker.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

  const stage = document.getElementById(stageId);
  stage?.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

  window.setTimeout(() => {
    marker.classList.remove("poi-target-focus");
  }, 1700);
}

/**
 * Navigue vers un POI cible et centre la vue dessus.
 * @param {Object} poi - POI source cliqué
 */
async function navigateToTargetPoi(poi) {
  const target = resolvePoiTargetLocation(poi);
  if (!target) {
    return;
  }

  const { openMap } = await import("./map-view.js");
  openMap(target.mapId);

  // Forcer un filtre compatible avec la cible pour garantir son rendu.
  if (target.targetPoi?.type === "pnj" || target.targetPoi?.type === "monstres") {
    updateState("activeFilter", target.targetPoi.type);
  } else {
    updateState("activeFilter", "lieux");
  }
  renderInteractivePoints();

  if (target.subMapId) {
    const { openSubMap } = await import("./submap-view.js");
    openSubMap(target.subMapId);

    if (target.targetPoi?.type === "pnj" || target.targetPoi?.type === "monstres") {
      updateState("activeSubmapFilter", target.targetPoi.type);
    } else {
      updateState("activeSubmapFilter", "lieux");
    }
    renderSubmapPois();
    await centerViewOnPoi("submap-zone-layer", "submap-stage", target.targetPoi.id);
    return;
  }

  await centerViewOnPoi("zone-layer", "map-stage", target.targetPoi.id);
}

/**
 * Gère le clic droit sur un POI pour ouvrir le wiki
 * @param {Object} poi - Point d'intérêt
 */
export function handlePoiOpenWiki(poi) {
  const wikiUrl =
    normalizeUrlCandidate(poi?.wikiUrl) ||
    buildWikiSearchUrl(poi?.name) ||
    normalizeUrlCandidate(state.activeMap?._meta?.checkUrls?.[0]);
  if (!wikiUrl) {
    return;
  }

  window.open(wikiUrl, "_blank", "noopener");
}

/**
 * Gère le clic de calibration et copie les coordonnées
 * @param {MouseEvent} event - Événement souris
 * @returns {Promise<boolean>} Vrai si calibration copiée
 */
export async function handleCalibrationClickCopy(event) {
  const config = (await import("./config.js")).default;
  if (!config.isDev || !state.showGridCoords) {
    return false;
  }
  if (event.button !== 0) {
    return false;
  }

  const percent = getPointerPercentOnMap(event);
  if (!percent) {
    return false;
  }

  const coords = percentToDisplayCoords(percent);
  const text = `${coords.x.toFixed(2)},${coords.y.toFixed(2)}`;
  const copied = await copyTextToClipboard(text);
  if (!copied) {
    return false;
  }

  const mapDevCoords = document.getElementById("map-dev-coords");
  if (mapDevCoords) {
    mapDevCoords.textContent = `GX ${coords.x.toFixed(2)} | GY ${coords.y.toFixed(2)} (copie)`;
    mapDevCoords.classList.remove("hidden");
  }

  return true;
}

/**
 * Obtient le pourcentage du pointeur sur la carte principale
 * @param {MouseEvent} event - Événement souris
 * @returns {Object|null} Coordonnées en % ou null
 */
export function getPointerPercentOnMap(event) {
  const mapStage = document.getElementById("map-stage");
  const mapBgImg = document.getElementById("map-bg-img");
  if (!mapStage) {
    return null;
  }

  const rect = mapStage.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }

  const displayRect = getDisplayedImageRect(
    rect.width,
    rect.height,
    mapBgImg?.naturalWidth || 0,
    mapBgImg?.naturalHeight || 0
  );

  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;

  if (
    px < displayRect.left ||
    py < displayRect.top ||
    px > displayRect.left + displayRect.width ||
    py > displayRect.top + displayRect.height
  ) {
    return null;
  }

  const x = ((px - displayRect.left) / displayRect.width) * 100;
  const y = ((py - displayRect.top) / displayRect.height) * 100;
  return { x, y };
}

/**
 * Obtient le pourcentage du pointeur sur la sous-carte
 * @param {MouseEvent} event - Événement souris
 * @returns {Object|null} Coordonnées en % ou null
 */
export function getPointerPercentOnSubmap(event) {
  const submapStage = document.getElementById("submap-stage");
  const submapBgImg = document.getElementById("submap-bg-img");
  if (!submapStage) {
    return null;
  }

  const rect = submapStage.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }

  const displayRect = getDisplayedImageRect(
    rect.width,
    rect.height,
    submapBgImg?.naturalWidth || 0,
    submapBgImg?.naturalHeight || 0
  );

  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;

  if (
    px < displayRect.left ||
    py < displayRect.top ||
    px > displayRect.left + displayRect.width ||
    py > displayRect.top + displayRect.height
  ) {
    return null;
  }

  const x = ((px - displayRect.left) / displayRect.width) * 100;
  const y = ((py - displayRect.top) / displayRect.height) * 100;
  return { x, y };
}
