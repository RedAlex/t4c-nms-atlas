/**
 * Panneau itinéraire inter-cartes
 * @module itinerary
 */

import { findPath, getGraphNodeList } from "./graph.js";

let graphRef = null;

/**
 * Initialise le panneau itinéraire avec le graphe chargé.
 * @param {{ nodes: Map, adjacency: Map }} graph
 */
export function initItineraryPanel(graph) {
  graphRef = graph;

  const fromSelect = document.getElementById("itinerary-from");
  const toSelect = document.getElementById("itinerary-to");
  if (!fromSelect || !toSelect) {
    return;
  }

  const nodeList = getGraphNodeList(graph);
  const options = nodeList.map((n) => {
    const opt = document.createElement("option");
    opt.value = n.id;
    opt.textContent = n.label;
    opt.dataset.type = n.type;
    return opt;
  });

  fromSelect.innerHTML = "";
  toSelect.innerHTML = "";
  const emptyFrom = document.createElement("option");
  emptyFrom.value = "";
  emptyFrom.textContent = "— Départ —";
  const emptyTo = document.createElement("option");
  emptyTo.value = "";
  emptyTo.textContent = "— Arrivée —";
  fromSelect.appendChild(emptyFrom);
  toSelect.appendChild(emptyTo);
  options.forEach((opt) => {
    fromSelect.appendChild(opt.cloneNode(true));
    toSelect.appendChild(opt.cloneNode(true));
  });
}

/**
 * Calcule et affiche l'itinéraire entre les deux nœuds sélectionnés.
 */
export function computeItinerary() {
  const fromId = document.getElementById("itinerary-from")?.value;
  const toId = document.getElementById("itinerary-to")?.value;
  const resultEl = document.getElementById("itinerary-result");
  if (!resultEl) {
    return;
  }

  if (!fromId || !toId) {
    resultEl.innerHTML = "<p class=\"itinerary-error\">Sélectionnez un départ et une arrivée.</p>";
    return;
  }
  if (fromId === toId) {
    resultEl.innerHTML = "<p class=\"itinerary-error\">Le départ et l'arrivée sont identiques.</p>";
    return;
  }
  if (!graphRef) {
    return;
  }

  const path = findPath(graphRef, fromId, toId);
  if (!path) {
    resultEl.innerHTML = "<p class=\"itinerary-error\">Aucun itinéraire trouvé entre ces deux lieux.</p>";
    return;
  }

  renderRoute(resultEl, path);
}

/**
 * Affiche la liste des étapes de l'itinéraire dans le conteneur.
 * @param {HTMLElement} container
 * @param {Array} path
 */
function renderRoute(container, path) {
  const stepTypeIcon = {
    portal: "⬡",
    transition: "⬇",
    lieux: "📍",
  };

  const items = path.map((step, index) => {
    const icon = step.node.type === "submap" ? "🗺" : "🌍";
    let viaHtml = "";
    if (step.via) {
      const icon2 = stepTypeIcon[step.via.poiType] || "→";
      viaHtml = `<div class="itinerary-via">${icon2} ${step.via.poiName || step.via.poiType}</div>`;
    }
    return `<li class="itinerary-step${index === 0 ? " itinerary-step-first" : index === path.length - 1 ? " itinerary-step-last" : ""}">
      ${viaHtml}<div class="itinerary-node">${icon} ${step.node.name}</div>
    </li>`;
  });

  container.innerHTML = `
    <p class="itinerary-summary">${path.length - 1} étape${path.length - 1 > 1 ? "s" : ""}</p>
    <ol class="itinerary-steps">${items.join("")}</ol>
  `;
}

/**
 * Ouvre le panneau itinéraire.
 */
export function openItineraryPanel() {
  document.getElementById("itinerary-panel")?.classList.remove("hidden");
}

/**
 * Ferme le panneau itinéraire.
 */
export function closeItineraryPanel() {
  document.getElementById("itinerary-panel")?.classList.add("hidden");
}
