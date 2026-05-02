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

  hoverCard.style.left = `${Math.min(Math.max(x + 14, 12), rect.width - 230)}px`;
  hoverCard.style.top = `${Math.min(Math.max(y + 14, 12), rect.height - 130)}px`;
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


