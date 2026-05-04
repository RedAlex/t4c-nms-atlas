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
import { renderWorldTabs } from "./world-view.js";
import { createZoomPanController } from "./zoom-pan.js";

let mapZoomController = null;
const mapViewportCache = new Map();

function getActiveMapZoomLimits() {
  const zoom = state.activeMap?.zoom || {};
  return {
    min: Number.isFinite(zoom.min) ? zoom.min : 1,
    max: Number.isFinite(zoom.max) ? zoom.max : 4,
    step: Number.isFinite(zoom.step) ? zoom.step : 0.2,
  };
}

function updateMapZoomButtons({ scale, limits }) {
  const btnIn = document.getElementById("map-zoom-in");
  const btnOut = document.getElementById("map-zoom-out");
  if (btnIn) {
    btnIn.disabled = scale >= limits.max - 0.001;
  }
  if (btnOut) {
    btnOut.disabled = scale <= limits.min + 0.001;
  }
  const badge = document.getElementById("map-zoom-level");
  if (badge) {
    badge.textContent = `x${scale.toFixed(1)}`;
    badge.classList.toggle("hidden", scale <= limits.min + 0.001);
  }
}

function ensureMapZoomController() {
  if (mapZoomController) {
    return mapZoomController;
  }

  mapZoomController = createZoomPanController({
    wrapId: "map-stage-wrap",
    stageId: "map-stage",
    getLimits: getActiveMapZoomLimits,
    onScaleChange: updateMapZoomButtons,
  });

  return mapZoomController;
}

function fitMapStageToImage() {
  const mapStageWrap = document.getElementById("map-stage-wrap");
  const mapStage = document.getElementById("map-stage");
  const mapBgImg = document.getElementById("map-bg-img");
  if (!mapStageWrap || !mapStage || !mapBgImg?.naturalWidth || !mapBgImg?.naturalHeight) {
    return;
  }

  const frameWidth = mapStageWrap.clientWidth;
  if (!frameWidth) {
    return;
  }

  const imageRatio = mapBgImg.naturalWidth / mapBgImg.naturalHeight;
  const stageWidth = frameWidth;
  const stageHeight = stageWidth / imageRatio;

  mapStage.style.width = `${stageWidth}px`;
  mapStage.style.height = `${stageHeight}px`;
}

/**
 * Ouvre une carte
 * @param {string} mapId - ID de la carte
 */
export function openMap(mapId) {
  const worldView = document.getElementById("world-view");
  const mapView = document.getElementById("map-view");
  const submapView = document.getElementById("submap-view");
  const favoritesView = document.getElementById("favorites-view");
  const mapBgImg = document.getElementById("map-bg-img");
  const activeMapTitle = document.getElementById("active-map-title");
  const activeMapCaption = document.getElementById("active-map-caption");

  // Sauvegarder le viewport de la carte actuelle avant de changer
  if (state.activeMap?.id && mapZoomController) {
    mapViewportCache.set(state.activeMap.id, mapZoomController.getViewport());
  }

  updateState("activeMap", state.maps.find((m) => m.id === mapId) || null);
  updateState("activeSubMap", null);
  updateState("mapSearchQuery", "");
  updateState("submapSearchQuery", "");
  if (state.activeMap && typeof state.activeMap.worldId === "number") {
    updateState("activeWorldId", state.activeMap.worldId);
  }
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

  worldView?.classList.add("hidden");
  submapView.classList.add("hidden");
  favoritesView?.classList.add("hidden");
  mapView.classList.remove("hidden");
  updateDevLabel("map-view", state.activeMap.name);

  // Mettre à jour les onglets de sélection de carte
  renderWorldTabs();

  // Breadcrumb monde actif
  const world = state.activeMap._world || (state.worlds || []).find((w) => w.worldId === state.activeMap.worldId) || null;
  const mapBreadcrumb = document.getElementById("map-breadcrumb");
  if (mapBreadcrumb) {
    mapBreadcrumb.textContent = world ? `${world.name.split(" / ")[0]} · ${state.activeMap.name}` : state.activeMap.name;
    mapBreadcrumb.classList.remove("hidden");
  }

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

  // Image prioritaire : HD locale/Gobeline → Abetsic → image de base
  const mapImage = state.activeMap.hdImage || state.activeMap.image || state.activeMap.abetsicImage;
  if (mapImage) {
    mapBgImg.src = mapImage;
    mapBgImg.alt = `Carte ${state.activeMap.name}`;
  }

  ensureMapZoomController()?.reset();

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

  fitMapStageToImage();

  const rect = { width: mapStage.clientWidth, height: mapStage.clientHeight };
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

  ensureMapZoomController()?.refresh();
}

export function zoomInMap() {
  ensureMapZoomController()?.zoomIn();
}

export function zoomOutMap() {
  ensureMapZoomController()?.zoomOut();
}

export function resetMapZoom() {
  ensureMapZoomController()?.reset();
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
