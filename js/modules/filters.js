/**
 * Gestion des filtres
 * @module filters
 */

import state, { updateState } from "./state.js";

/**
 * Change le filtre actif (carte principale)
 * @param {string} filterName - Nom du filtre
 */
export function toggleFilter(filterName) {
  updateState("activeFilter", filterName);
  updateFilterButtons();
  updateFilterDisplay();
}

/**
 * Change le filtre actif (sous-carte)
 * @param {string} filterName - Nom du filtre
 */
export function toggleSubmapFilter(filterName) {
  updateState("activeSubmapFilter", filterName);
  updateSubmapFilterButtons();
}

/**
 * Met à jour les boutons de filtre (carte principale)
 */
export function updateFilterButtons() {
  ["lieux", "pnj", "monstres"].forEach((filterName) => {
    const button = document.getElementById(`filter-${filterName}`);
    if (!button) {
      return;
    }
    button.classList.toggle("active", state.activeFilter === filterName);
  });
}

/**
 * Met à jour les boutons de filtre (sous-carte)
 */
export function updateSubmapFilterButtons() {
  ["lieux", "pnj", "monstres"].forEach((filterName) => {
    const button = document.getElementById(`submap-filter-${filterName}`);
    if (!button) {
      return;
    }
    button.classList.toggle("active", state.activeSubmapFilter === filterName);
  });
}

/**
 * Met à jour l'affichage des filtres
 */
export function updateFilterDisplay() {
  const mapImgSource = document.getElementById("map-img-source");

  if (mapImgSource) {
    if (state.activeFilter === "lieux") {
      mapImgSource.style.display = "";
    } else {
      mapImgSource.style.display = "none";
    }
  }
}

/**
 * Bascule l'affichage des titres de POI (carte principale)
 */
export function togglePoiTitles() {
  updateState("showPoiTitles", !state.showPoiTitles);
  const togglePoiTitlesBtn = document.getElementById("toggle-poi-titles");
  if (togglePoiTitlesBtn) {
    togglePoiTitlesBtn.classList.toggle("active", state.showPoiTitles);
    togglePoiTitlesBtn.textContent = state.showPoiTitles ? "Titres ON" : "Titres OFF";
  }
}

/**
 * Bascule l'affichage des titres de POI (sous-carte)
 */
export function toggleSubmapPoiTitles() {
  updateState("showSubmapPoiTitles", !state.showSubmapPoiTitles);
  const submapTogglePoiTitlesBtn = document.getElementById("submap-toggle-poi-titles");
  if (submapTogglePoiTitlesBtn) {
    submapTogglePoiTitlesBtn.classList.toggle("active", state.showSubmapPoiTitles);
    submapTogglePoiTitlesBtn.textContent = state.showSubmapPoiTitles ? "Titres ON" : "Titres OFF";
  }
}

/**
 * Bascule l'affichage des coordonnées de grille (carte principale)
 */
export function toggleGridCoords() {
  updateState("showGridCoords", !state.showGridCoords);

  const toggleGridCoordsBtn = document.getElementById("toggle-grid-coords");
  if (!toggleGridCoordsBtn) {
    return;
  }
  toggleGridCoordsBtn.textContent = state.showGridCoords ? "Calibration ON" : "Calibration OFF";
  toggleGridCoordsBtn.classList.toggle("active", state.showGridCoords);

  if (!state.showGridCoords) {
    const mapDevCoords = document.getElementById("map-dev-coords");
    if (mapDevCoords) {
      mapDevCoords.classList.add("hidden");
    }
  }
}

/**
 * Bascule l'affichage des coordonnées de grille (sous-carte)
 */
export function toggleSubmapGridCoords() {
  updateState("showSubmapGridCoords", !state.showSubmapGridCoords);

  const submapToggleGridCoordsBtn = document.getElementById("submap-toggle-grid-coords");
  if (!submapToggleGridCoordsBtn) {
    return;
  }
  submapToggleGridCoordsBtn.textContent = state.showSubmapGridCoords
    ? "Calibration ON"
    : "Calibration OFF";
  submapToggleGridCoordsBtn.classList.toggle("active", state.showSubmapGridCoords);

  if (!state.showSubmapGridCoords) {
    const submapDevCoords = document.getElementById("submap-dev-coords");
    if (submapDevCoords) {
      submapDevCoords.classList.add("hidden");
    }
  }
}
