/**
 * Gestion de la vue Carte principale
 * @module map-view
 */

import state, { updateState } from "./state.js";
import { getDisplayedImageRect } from "./utils.js";
import { setSourceLink, updateDevLabel } from "./ui-helpers.js";
import { renderInteractivePoints, getPointerPercentOnMap } from "./poi-renderer.js";
import { updateFilterDisplay, updateFilterButtons } from "./filters.js";
import config from "./config.js";
import { isPoiFavorite } from "./favorites.js";

/**
 * Ouvre une carte
 * @param {string} mapId - ID de la carte
 */
export function openMap(mapId) {
  const worldView = document.getElementById("world-view");
  const mapView = document.getElementById("map-view");
  const submapView = document.getElementById("submap-view");
  const mapBgImg = document.getElementById("map-bg-img");
  const activeMapTitle = document.getElementById("active-map-title");
  const activeMapCaption = document.getElementById("active-map-caption");

  updateState("activeMap", state.maps.find((m) => m.id === mapId) || null);
  updateState("activeSubMap", null);
  updateState("mapSearchQuery", "");
  updateState("submapSearchQuery", "");
  if (!state.activeMap) {
    return;
  }

  const mapSearchInput = document.getElementById("map-search-input");
  if (mapSearchInput) {
    mapSearchInput.value = "";
  }
  const mapSearchCount = document.getElementById("map-search-count");
  if (mapSearchCount) {
    mapSearchCount.textContent = "";
  }

  const mapPois = state.activeMap.pois || [];
  const hasFavoriteOnMap = mapPois.some((poi) => isPoiFavorite(poi));
  updateState("activeFilter", hasFavoriteOnMap ? "favoris" : "lieux");

  worldView.classList.add("hidden");
  submapView.classList.add("hidden");
  mapView.classList.remove("hidden");
  updateDevLabel("map-view", state.activeMap.name);

  activeMapTitle.textContent = state.activeMap.name;
  activeMapCaption.textContent = `Version Abetsic — ${(state.activeMap.subMaps || []).length} sous-cartes disponibles`;

  const mapCalibBadge = document.getElementById("map-calib-badge");
  if (mapCalibBadge) {
    if (config.isDev) {
      const calibPoints = (state.activeMap.calibration?.gamePoints || []).filter(
        (p) => p.gameX !== 0 || p.gameY !== 0 || p.mapX !== 0 || p.mapY !== 0,
      ).length;
      const calibMax = 3;
      mapCalibBadge.className = `completion-badge calib-badge calib-${
        calibPoints === calibMax ? "ok" : calibPoints === 0 ? "none" : "partial"
      }`;
      mapCalibBadge.textContent = `Calib. ${calibPoints}/${calibMax}`;
      mapCalibBadge.title = `Calibration : ${calibPoints} point(s) valide(s) sur ${calibMax} requis.`;
      mapCalibBadge.classList.remove("hidden");
    } else {
      mapCalibBadge.classList.add("hidden");
    }
  }

  const mapImage = state.activeMap.image || state.activeMap.abetsicImage;
  if (mapImage) {
    mapBgImg.src = mapImage;
    mapBgImg.alt = `Carte ${state.activeMap.name}`;
  }

  updateZoneLayerLayout();

  renderInteractivePoints();

  const mapImgSource = document.getElementById("map-img-source");
  const wikiUrl =
    state.activeMap._meta?.abetsicSourceUrl || state.activeMap._meta?.checkUrls?.[0] || "#";
  setSourceLink(mapImgSource, wikiUrl);

  updateFilterDisplay();
  updateFilterButtons();

  const mapDevCoords = document.getElementById("map-dev-coords");
  if (mapDevCoords) {
    mapDevCoords.classList.add("hidden");
  }
}

/**
 * Met à jour la disposition de la zone de layer (carte)
 */
export function updateZoneLayerLayout() {
  const mapStage = document.getElementById("map-stage");
  const zoneLayer = document.getElementById("zone-layer");
  const mapBgImg = document.getElementById("map-bg-img");
  if (!mapStage || !zoneLayer) {
    return;
  }

  const rect = mapStage.getBoundingClientRect();
  const displayRect = getDisplayedImageRect(
    rect.width,
    rect.height,
    mapBgImg?.naturalWidth || 0,
    mapBgImg?.naturalHeight || 0
  );

  zoneLayer.style.left = `${displayRect.left}px`;
  zoneLayer.style.top = `${displayRect.top}px`;
  zoneLayer.style.width = `${displayRect.width}px`;
  zoneLayer.style.height = `${displayRect.height}px`;
}

/**
 * Gère le mouvement de la souris sur la carte
 * @param {MouseEvent} event - Événement souris
 */
export function handleMapStageMouseMove(event) {
  if (!config.isDev || !state.showGridCoords) {
    return;
  }

  const percent = getPointerPercentOnMap(event);
  if (!percent) {
    const mapDevCoords = document.getElementById("map-dev-coords");
    if (mapDevCoords) {
      mapDevCoords.classList.add("hidden");
    }
    return;
  }

  const mapDevCoords = document.getElementById("map-dev-coords");
  if (!mapDevCoords) {
    return;
  }
  const displayX = (percent.x / 100) * 5000;
  const displayY = (percent.y / 100) * 5000;
  mapDevCoords.textContent = `GX ${displayX.toFixed(2)} | GY ${displayY.toFixed(2)}`;
  mapDevCoords.classList.remove("hidden");
}
