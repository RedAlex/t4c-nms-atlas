/**
 * Gestion de la vue Sous-carte
 * @module submap-view
 */

import state, { updateState } from "./state.js";
import { normalizeUrlCandidate, getDisplayedImageRect, copyTextToClipboard } from "./utils.js";
import config from "./config.js";
import { setSourceLink, updateDevLabel } from "./ui-helpers.js";
import { renderSubmapPois, getPointerPercentOnSubmap } from "./poi-renderer.js";
import { updateSubmapFilterButtons } from "./filters.js";
import { isPoiFavorite } from "./favorites.js";

function fitSubmapStageToImage() {
  const submapStageWrap = document.getElementById("submap-stage-wrap");
  const submapStage = document.getElementById("submap-stage");
  const submapBgImg = document.getElementById("submap-bg-img");
  if (!submapStageWrap || !submapStage || !submapBgImg?.naturalWidth || !submapBgImg?.naturalHeight) {
    return;
  }

  const frameWidth = submapStageWrap.clientWidth;
  if (!frameWidth) {
    return;
  }

  const imageRatio = submapBgImg.naturalWidth / submapBgImg.naturalHeight;
  const stageWidth = frameWidth;
  const stageHeight = stageWidth / imageRatio;

  submapStage.style.width = `${stageWidth}px`;
  submapStage.style.height = `${stageHeight}px`;
}

/**
 * Ouvre une sous-carte
 * @param {string} subMapId - ID de la sous-carte
 */
export function openSubMap(subMapId) {
  const mapView = document.getElementById("map-view");
  const submapView = document.getElementById("submap-view");
  const submapBgImg = document.getElementById("submap-bg-img");
  const activeSubmapTitle = document.getElementById("active-submap-title");
  const activeSubmapCaption = document.getElementById("active-submap-caption");
  const submapWikiLink = document.getElementById("submap-wiki-link");

  const subMaps = state.activeMap.subMaps || [];
  updateState("activeSubMap", subMaps.find((s) => s.id === subMapId) || null);
  updateState("submapSearchQuery", "");
  if (!state.activeSubMap) {
    return;
  }

  const submapSearchInput = document.getElementById("submap-search-input");
  if (submapSearchInput) {
    submapSearchInput.value = "";
  }
  const submapSearchCount = document.getElementById("submap-search-count");
  if (submapSearchCount) {
    submapSearchCount.textContent = "";
  }

  const submapPois = state.activeSubMap.pois || [];
  const hasFavoriteOnSubmap = submapPois.some((poi) => isPoiFavorite(poi));
  updateState("activeSubmapFilter", hasFavoriteOnSubmap ? "favoris" : "lieux");

  mapView.classList.add("hidden");
  submapView.classList.remove("hidden");
  updateDevLabel("submap-view", state.activeSubMap.name);

  const mapHoverCard = document.getElementById("map-hover-card");
  if (mapHoverCard) {
    mapHoverCard.classList.remove("visible");
  }

  activeSubmapTitle.textContent = state.activeSubMap.name;
  activeSubmapCaption.textContent = state.activeMap.name;

  const submapCalibBadge = document.getElementById("submap-calib-badge");
  if (submapCalibBadge) {
    if (config.isDev) {
      const calibPoints = (state.activeSubMap.calibration?.gamePoints || []).filter(
        (p) => p.gameX !== 0 || p.gameY !== 0 || p.mapX !== 0 || p.mapY !== 0,
      ).length;
      const calibMax = 3;
      submapCalibBadge.className = `completion-badge calib-badge calib-${
        calibPoints === calibMax ? "ok" : calibPoints === 0 ? "none" : "partial"
      }`;
      submapCalibBadge.textContent = `Calib. ${calibPoints}/${calibMax}`;
      submapCalibBadge.title = `Calibration sous-carte : ${calibPoints} point(s) valide(s) sur ${calibMax} requis.`;
      submapCalibBadge.classList.remove("hidden");
    } else {
      submapCalibBadge.classList.add("hidden");
    }
  }
  submapBgImg.src = state.activeSubMap.image;
  submapBgImg.alt = state.activeSubMap.name;

  const submapImgSource = document.getElementById("submap-img-source");
  const safeSubmapWikiUrl = normalizeUrlCandidate(state.activeSubMap.wikiUrl);
  if (safeSubmapWikiUrl) {
    submapWikiLink.href = safeSubmapWikiUrl;
    submapWikiLink.style.display = "";
    setSourceLink(submapImgSource, safeSubmapWikiUrl);
  } else {
    submapWikiLink.style.display = "none";
    submapImgSource.textContent = "";
  }

  updateSubmapFilterButtons();
  renderSubmapPois();
}

/**
 * Met à jour la disposition de la zone de layer (sous-carte)
 */
export function updateSubmapZoneLayerLayout() {
  const submapStage = document.getElementById("submap-stage");
  const submapZoneLayer = document.getElementById("submap-zone-layer");
  const submapBgImg = document.getElementById("submap-bg-img");
  if (!submapStage || !submapZoneLayer) {
    return;
  }

  fitSubmapStageToImage();

  const rect = submapStage.getBoundingClientRect();
  const displayRect = getDisplayedImageRect(
    rect.width,
    rect.height,
    submapBgImg?.naturalWidth || 0,
    submapBgImg?.naturalHeight || 0
  );

  submapZoneLayer.style.left = `${displayRect.left}px`;
  submapZoneLayer.style.top = `${displayRect.top}px`;
  submapZoneLayer.style.width = `${displayRect.width}px`;
  submapZoneLayer.style.height = `${displayRect.height}px`;
}

/**
 * Gère le mouvement de la souris sur la sous-carte
 * @param {MouseEvent} event - Événement souris
 */
export function handleSubmapStageMouseMove(event) {
  if (!config.isDev || !state.showSubmapGridCoords) {
    return;
  }

  const percent = getPointerPercentOnSubmap(event);
  if (!percent) {
    const submapDevCoords = document.getElementById("submap-dev-coords");
    if (submapDevCoords) {
      submapDevCoords.classList.add("hidden");
    }
    return;
  }

  const submapDevCoords = document.getElementById("submap-dev-coords");
  if (!submapDevCoords) {
    return;
  }
  submapDevCoords.textContent = `X ${percent.x.toFixed(2)}% | Y ${percent.y.toFixed(2)}%`;
  submapDevCoords.classList.remove("hidden");
}

/**
 * Gère le clic sur la sous-carte
 * @param {MouseEvent} event - Événement souris
 */
export function handleSubmapStageClick(event) {
  if (!config.isDev || !state.showSubmapGridCoords) {
    return;
  }
  if (event.button !== 0) {
    return;
  }

  const percent = getPointerPercentOnSubmap(event);
  if (!percent) {
    return;
  }

  const text = `${percent.x.toFixed(2)},${percent.y.toFixed(2)}`;
  const submapDevCoords = document.getElementById("submap-dev-coords");
  copyTextToClipboard(text).then((copied) => {
    if (copied && submapDevCoords) {
      submapDevCoords.textContent = `X ${percent.x.toFixed(2)}% | Y ${percent.y.toFixed(2)}% (copie)`;
      submapDevCoords.classList.remove("hidden");
    }
  });
}
