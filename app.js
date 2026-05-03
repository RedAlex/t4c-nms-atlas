/**
 * Point d'entrée principal de l'application Atlas NMS Revolution
 * Orchestration des modules et initialisation
 * @module app
 */

import { loadMapsData } from "./js/modules/data-loader.js";
import state, { updateState } from "./js/modules/state.js";
import { renderWorldTabs } from "./js/modules/world-view.js";
import { openMap, updateZoneLayerLayout, handleMapStageMouseMove } from "./js/modules/map-view.js";
import {
  updateSubmapZoneLayerLayout,
  handleSubmapStageMouseMove,
  handleSubmapStageClick,
} from "./js/modules/submap-view.js";
import {
  toggleFilter,
  toggleSubmapFilter,
  togglePoiTitles,
  toggleSubmapPoiTitles,
  toggleGridCoords,
  toggleSubmapGridCoords,
  updateFilterButtons,
} from "./js/modules/filters.js";
import { updateDevLabel, applyDevUiVisibility } from "./js/modules/ui-helpers.js";
import { handleCalibrationClickCopy } from "./js/modules/poi-renderer.js";
import { loadFavoritesFromStorage, showFavoritesView } from "./js/modules/favorites.js";
import { validateData } from "./js/modules/validator.js";

/**
 * Synchronise la hauteur de viewport réelle (utile sur desktop et mobile)
 */
function syncViewportHeight() {
  const vh = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty("--app-vh", `${Math.round(vh)}px`);
}

/**
 * Observe les changements de taille d'un stage pour recalculer son layer
 * @param {string} stageId - ID de l'élément stage à observer
 * @param {Function} onResize - Callback de recalcul
 * @returns {ResizeObserver|null}
 */
function observeStageResize(stageId, onResize) {
  const stage = document.getElementById(stageId);
  if (!stage || typeof ResizeObserver === "undefined") {
    return null;
  }

  const ro = new ResizeObserver(() => {
    onResize();
  });
  ro.observe(stage);
  return ro;
}

init();

/**
 * Initialise l'application - point d'entrée
 */
async function init() {
  syncViewportHeight();

  const data = await loadMapsData();
  if (!data?.maps?.length) {
    return;
  }
  updateState("maps", data.maps);
  if (Array.isArray(data.worlds)) {
    updateState("worlds", data.worlds);
  }
  validateData(data.maps, data.worlds || null);
  loadFavoritesFromStorage();
  renderWorldTabs();

  // Affiche la version de l'application
  const appVersionEl = document.getElementById("app-version");
  if (appVersionEl) {
    const version = window.desktopAPI?.appVersion || "dev";
    appVersionEl.textContent = `v${version}`;
  }

  // Récupère les éléments DOM
  const backToMap = document.getElementById("back-to-map");
  const openFavoritesBtn = document.getElementById("open-favorites");
  const backToWorldFromFavorites = document.getElementById("back-to-world-from-favorites");
  const filterLieux = document.getElementById("filter-lieux");
  const filterPnj = document.getElementById("filter-pnj");
  const filterMonstres = document.getElementById("filter-monstres");
  const filterFavoris = document.getElementById("filter-favoris");
  const togglePoiTitlesBtn = document.getElementById("toggle-poi-titles");
  const submapFilterLieux = document.getElementById("submap-filter-lieux");
  const submapFilterPnj = document.getElementById("submap-filter-pnj");
  const submapFilterMonstres = document.getElementById("submap-filter-monstres");
  const submapFilterFavoris = document.getElementById("submap-filter-favoris");
  const submapTogglePoiTitlesBtn = document.getElementById("submap-toggle-poi-titles");
  const submapToggleGridCoordsBtn = document.getElementById("submap-toggle-grid-coords");
  const submapStage = document.getElementById("submap-stage");
  const mapStage = document.getElementById("map-stage");
  const mapBgImg = document.getElementById("map-bg-img");
  const submapBgImg = document.getElementById("submap-bg-img");
  const toggleGridCoordsBtn = document.getElementById("toggle-grid-coords");
  const mapSearchInput = document.getElementById("map-search-input");
  const submapSearchInput = document.getElementById("submap-search-input");

  // Événements - Favoris
  openFavoritesBtn?.addEventListener("click", showFavoritesView);
  backToWorldFromFavorites?.addEventListener("click", () => openMap(state.activeMap?.id ?? data.maps[0].id));

  // Événements - Vue Carte Principale
  backToMap.addEventListener("click", async () => {
    const { getState } = await import("./js/modules/state.js");
    openMap(getState("activeMap").id);
  });
  filterLieux.addEventListener("click", async () => {
    toggleFilter("lieux");
    const { renderInteractivePoints } = await import("./js/modules/poi-renderer.js");
    renderInteractivePoints();
  });
  filterPnj.addEventListener("click", async () => {
    toggleFilter("pnj");
    const { renderInteractivePoints } = await import("./js/modules/poi-renderer.js");
    renderInteractivePoints();
  });
  filterMonstres.addEventListener("click", async () => {
    toggleFilter("monstres");
    const { renderInteractivePoints } = await import("./js/modules/poi-renderer.js");
    renderInteractivePoints();
  });
  filterFavoris.addEventListener("click", async () => {
    toggleFilter("favoris");
    const { renderInteractivePoints } = await import("./js/modules/poi-renderer.js");
    renderInteractivePoints();
  });
  togglePoiTitlesBtn.addEventListener("click", async () => {
    togglePoiTitles();
    const { renderInteractivePoints } = await import("./js/modules/poi-renderer.js");
    renderInteractivePoints();
  });
  mapStage.addEventListener("mousemove", handleMapStageMouseMove);
  mapStage.addEventListener("mouseleave", async () => {
    const mapDevCoords = document.getElementById("map-dev-coords");
    if (mapDevCoords) {
      mapDevCoords.classList.add("hidden");
    }
  });
  mapStage.addEventListener("click", handleCalibrationClickCopy);
  mapBgImg.addEventListener("load", updateZoneLayerLayout);
  window.addEventListener("resize", () => {
    syncViewportHeight();
    updateZoneLayerLayout();
    updateSubmapZoneLayerLayout();
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncViewportHeight);
  }
  if (toggleGridCoordsBtn) {
    toggleGridCoordsBtn.addEventListener("click", async () => {
      toggleGridCoords();
      const { renderInteractivePoints } = await import("./js/modules/poi-renderer.js");
      renderInteractivePoints();
    });
  }

  // Événements - Vue Sous-Carte
  if (submapFilterLieux) {
    submapFilterLieux.addEventListener("click", async () => {
      toggleSubmapFilter("lieux");
      const { renderSubmapPois } = await import("./js/modules/poi-renderer.js");
      renderSubmapPois();
    });
  }
  if (submapFilterPnj) {
    submapFilterPnj.addEventListener("click", async () => {
      toggleSubmapFilter("pnj");
      const { renderSubmapPois } = await import("./js/modules/poi-renderer.js");
      renderSubmapPois();
    });
  }
  if (submapFilterMonstres) {
    submapFilterMonstres.addEventListener("click", async () => {
      toggleSubmapFilter("monstres");
      const { renderSubmapPois } = await import("./js/modules/poi-renderer.js");
      renderSubmapPois();
    });
  }
  if (submapFilterFavoris) {
    submapFilterFavoris.addEventListener("click", async () => {
      toggleSubmapFilter("favoris");
      const { renderSubmapPois } = await import("./js/modules/poi-renderer.js");
      renderSubmapPois();
    });
  }
  if (submapTogglePoiTitlesBtn) {
    submapTogglePoiTitlesBtn.addEventListener("click", async () => {
      toggleSubmapPoiTitles();
      const { renderSubmapPois } = await import("./js/modules/poi-renderer.js");
      renderSubmapPois();
    });
  }
  if (submapToggleGridCoordsBtn) {
    submapToggleGridCoordsBtn.addEventListener("click", async () => {
      toggleSubmapGridCoords();
      const { renderSubmapPois } = await import("./js/modules/poi-renderer.js");
      renderSubmapPois();
    });
  }
  if (submapStage) {
    submapStage.addEventListener("mousemove", handleSubmapStageMouseMove);
    submapStage.addEventListener("mouseleave", async () => {
      const submapDevCoords = document.getElementById("submap-dev-coords");
      if (submapDevCoords) {
        submapDevCoords.classList.add("hidden");
      }
    });
    submapStage.addEventListener("click", handleSubmapStageClick);
  }
  if (submapBgImg) {
    submapBgImg.addEventListener("load", updateSubmapZoneLayerLayout);
  }

  observeStageResize("map-stage-wrap", updateZoneLayerLayout);
  observeStageResize("submap-stage-wrap", updateSubmapZoneLayerLayout);

  if (mapSearchInput) {
    mapSearchInput.addEventListener("input", async () => {
      updateState("mapSearchQuery", mapSearchInput.value || "");
      const { renderInteractivePoints } = await import("./js/modules/poi-renderer.js");
      renderInteractivePoints();
    });
  }
  if (submapSearchInput) {
    submapSearchInput.addEventListener("input", async () => {
      updateState("submapSearchQuery", submapSearchInput.value || "");
      const { renderSubmapPois } = await import("./js/modules/poi-renderer.js");
      renderSubmapPois();
    });
  }

  window.addEventListener("resize", updateSubmapZoneLayerLayout);

  // Navigation clavier — Esc pour revenir en arrière
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }
    const submapView = document.getElementById("submap-view");
    const mapView = document.getElementById("map-view");
    const favoritesView = document.getElementById("favorites-view");
    if (submapView && !submapView.classList.contains("hidden")) {
      openMap(state.activeMap.id);
    } else if (favoritesView && !favoritesView.classList.contains("hidden")) {
      openMap(state.activeMap?.id ?? data.maps[0].id);
    }
  });

  // Ouvrir la première carte une fois les listeners en place
  if (data.maps.length > 0) {
    openMap(data.maps[0].id);
  }

  applyDevUiVisibility();
  updateFilterButtons();
  updateDevLabel("world-view");
}
