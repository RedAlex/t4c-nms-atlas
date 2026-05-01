/**
 * Gestion de la vue Monde
 * @module world-view
 */

import state from "./state.js";
import { normalizeUrlCandidate } from "./utils.js";
import { updateDevLabel } from "./ui-helpers.js";

/**
 * Rend les cartes du monde
 */
export function renderWorldCards() {
  const mapCards = document.getElementById("map-cards");
  if (!mapCards) {
    return;
  }

  mapCards.innerHTML = "";
  state.maps.forEach((map, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "map-card";
    card.style.animationDelay = `${index * 80}ms`;
    const worldImage = map.nmsImage || map.image;
    const worldSourceUrl = map._meta?.nmsSourceUrl || map._meta?.checkUrls?.[0] || "#";
    const safeWorldSourceUrl = normalizeUrlCandidate(worldSourceUrl) || "#";

    if (worldImage) {
      const image = document.createElement("img");
      image.className = "map-card-img";
      image.src = worldImage;
      image.alt = `Carte NMS ${map.name}`;
      image.loading = "lazy";
      image.addEventListener("error", () => {
        image.style.display = "none";
      });
      card.appendChild(image);

      const source = document.createElement("p");
      source.className = "img-source card-img-source";
      source.append("Source : ");

      const link = document.createElement("a");
      link.href = safeWorldSourceUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "t4c.fandom.com";
      link.addEventListener("click", (event) => event.stopPropagation());
      source.appendChild(link);

      card.appendChild(source);
    }

    const checkedAt = map._meta?.checkedAt ?? "inconnue";
    const body = document.createElement("div");
    body.className = "map-card-body";

    const title = document.createElement("h3");
    title.textContent = map.name;
    body.appendChild(title);

    const summary = document.createElement("p");
    summary.textContent = map.summary || "";
    body.appendChild(summary);

    const badges = document.createElement("div");
    badges.className = "badges";

    const countBadge = document.createElement("span");
    countBadge.className = "badge";
    countBadge.textContent = `${(map.subMaps || []).length} sous-cartes`;
    badges.appendChild(countBadge);

    const checkedBadge = document.createElement("span");
    checkedBadge.className = "badge muted";
    checkedBadge.textContent = `verifie ${checkedAt}`;
    badges.appendChild(checkedBadge);

    body.appendChild(badges);
    card.appendChild(body);
    card.addEventListener("click", () => {
      import("./map-view.js").then(({ openMap }) => {
        openMap(map.id);
      });
    });
    mapCards.appendChild(card);
  });
}

/**
 * Affiche la vue Monde
 */
export function showWorldView() {
  const worldView = document.getElementById("world-view");
  const mapView = document.getElementById("map-view");
  const submapView = document.getElementById("submap-view");

  submapView.classList.add("hidden");
  mapView.classList.add("hidden");
  worldView.classList.remove("hidden");
  updateDevLabel("world-view");
}
