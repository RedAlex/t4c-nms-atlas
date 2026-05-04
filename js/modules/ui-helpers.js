/**
 * Helpers pour manipuler le DOM et les éléments UI
 * @module ui-helpers
 */

import { normalizeUrlCandidate } from "./utils.js";
import config from "./config.js";

/**
 * Crée un lien source dans un conteneur
 * @param {HTMLElement} container - Conteneur DOM
 * @param {string} url - URL
 */
export function setSourceLink(container, url) {
  if (!container) {
    return;
  }
  const safeUrl = normalizeUrlCandidate(url);
  if (!safeUrl) {
    container.textContent = "";
    return;
  }

  container.textContent = "";
  container.append("Source : ");
  const link = document.createElement("a");
  link.href = safeUrl;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "t4c.fandom.com";
  container.appendChild(link);
}

/**
 * Met à jour le label de développement
 * @param {string} pageName - Nom de la page
 * @param {string} [specificName] - Nom spécifique
 */
export function updateDevLabel(pageName, specificName) {
  const devLabel = document.getElementById("dev-label");
  if (!config.isDev || !devLabel) {
    return;
  }

  const pageLabels = {
    "world-view": "Monde",
    "map-view": "Carte",
    "submap-view": "Sous-carte",
  };

  const baseTitle = pageLabels[pageName] || "Inconnu";
  const fullTitle = specificName ? `${baseTitle}: ${specificName}` : baseTitle;
  devLabel.textContent = fullTitle;
  devLabel.style.display = "block";
}

/**
 * Applique la visibilité des éléments de dev UI
 */
export function applyDevUiVisibility() {
  const toggleGridCoordsBtn = document.getElementById("toggle-grid-coords");
  const submapToggleGridCoordsBtn = document.getElementById("submap-toggle-grid-coords");

  if (toggleGridCoordsBtn) {
    if (config.isDev) {
      toggleGridCoordsBtn.classList.remove("hidden");
    } else {
      toggleGridCoordsBtn.classList.add("hidden");
    }
  }

  if (submapToggleGridCoordsBtn) {
    if (config.isDev) {
      submapToggleGridCoordsBtn.classList.remove("hidden");
    } else {
      submapToggleGridCoordsBtn.classList.add("hidden");
    }
  }
}

/**
 * Affiche une carte de survol (hover card)
 * @param {HTMLElement} hoverCard - Élément carte de survol
 * @param {HTMLElement} stage - Élément stage
 * @param {Object} poi - Point d'intérêt
 * @param {MouseEvent} event - Événement souris
 * @param {string} hintText - Texte d'indice
 */
export function showHoverCard(hoverCard, stage, poi, event, hintText) {
  if (!hoverCard || !stage) {
    return;
  }

  hoverCard.textContent = "";

  const type = document.createElement("p");
  type.className = "map-hover-type";
  type.textContent = String(poi.type || "").toUpperCase();
  hoverCard.appendChild(type);

  const title = document.createElement("h4");
  title.textContent = poi.name || "Point d'interet";
  hoverCard.appendChild(title);

  const description = document.createElement("p");
  description.textContent = poi.description || "Aucune description";
  hoverCard.appendChild(description);

  // Affichage de la destination pour les portails
  if (poi.type === "portal" && poi.targetMapId) {
    const dest = document.createElement("p");
    dest.className = "map-hover-portal-dest";
    dest.textContent = `➜ ${poi.targetMapId}`;
    hoverCard.appendChild(dest);
  }

  const hint = document.createElement("p");
  hint.className = "map-hover-hint";
  hint.textContent = hintText || "Survol pour plus d'info";
  hoverCard.appendChild(hint);

  const rect = stage.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Le stage est transformé (zoom/pan). Les coordonnées souris sont en pixels écran,
  // alors que left/top de la card sont en coordonnées locales du stage.
  const poiScaleRaw = Number.parseFloat(
    getComputedStyle(stage).getPropertyValue("--poi-scale")
  );
  const zoomScale = Number.isFinite(poiScaleRaw) && poiScaleRaw > 0
    ? 1 / poiScaleRaw
    : 1;
  const localX = x / zoomScale;
  const localY = y / zoomScale;
  const localWidth = rect.width / zoomScale;
  const localHeight = rect.height / zoomScale;

  // Positionnement robuste: utiliser la taille réelle de la card et rester dans le stage.
  const cardWidth = hoverCard.offsetWidth || 220;
  const cardHeight = hoverCard.offsetHeight || 130;
  const margin = 12;
  const maxLeft = Math.max(margin, localWidth - cardWidth - margin);
  const maxTop = Math.max(margin, localHeight - cardHeight - margin);
  const left = Math.min(Math.max(localX + 14, margin), maxLeft);
  const top = Math.min(Math.max(localY + 14, margin), maxTop);

  hoverCard.style.left = `${left}px`;
  hoverCard.style.top = `${top}px`;
  hoverCard.classList.add("visible");
}

/**
 * Masque une carte de survol
 * @param {HTMLElement} hoverCard - Élément carte de survol
 */
export function hideHoverCard(hoverCard) {
  if (!hoverCard) {
    return;
  }
  hoverCard.classList.remove("visible");
}


