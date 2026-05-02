/**
 * Gestion de la vue Monde
 * @module world-view
 */

import state from "./state.js";
import { normalizeUrlCandidate, fuzzyMatchText } from "./utils.js";
import { updateDevLabel } from "./ui-helpers.js";

/**
 * Calcule le taux de complétude d'une carte (POI non-TODO / total POI)
 * @param {Object} map - Objet carte
 * @returns {{ named: number, total: number, pct: number, status: string }}
 */
function computeCompletion(map) {
  const allPois = [
    ...(map.pois || []),
    ...(map.subMaps || []).flatMap((sub) => sub.pois || []),
  ];
  const total = allPois.length;
  const named = allPois.filter((p) => p.name && p.name !== "TODO").length;
  const pct = total === 0 ? 0 : Math.round((named / total) * 100);
  let status;
  if (total === 0 || pct === 0) {
    status = "vide";
  } else if (pct === 100) {
    status = "complet";
  } else {
    status = "en-cours";
  }
  return { named, total, pct, status };
}


export function renderWorldCards() {
  const mapCards = document.getElementById("map-cards");
  const searchCount = document.getElementById("world-search-count");
  if (!mapCards) {
    return;
  }

  mapCards.innerHTML = "";
  const query = state.worldSearchQuery || "";
  const filteredMaps = state.maps.filter((map) => {
    const haystack = `${map.name || ""} ${map.summary || ""}`;
    return fuzzyMatchText(haystack, query);
  });

  if (searchCount) {
    searchCount.textContent = query
      ? `${filteredMaps.length} resultat(s) sur ${state.maps.length}`
      : "";
  }

  filteredMaps.forEach((map, index) => {
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

    const completion = computeCompletion(map);
    const completionBadge = document.createElement("span");
    completionBadge.className = `badge completion-badge completion-${completion.status}`;
    completionBadge.textContent =
      completion.status === "complet"
        ? `Complet (${completion.total} POI)`
        : completion.status === "en-cours"
          ? `En cours ${completion.pct}% (${completion.named}/${completion.total})`
          : `Incomplet (${completion.total} POI)`;
    completionBadge.title =
      `${completion.named} POI nommés sur ${completion.total} total` +
      (completion.total === 0 ? " — aucun POI défini" : "");
    badges.appendChild(completionBadge);

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
  const favoritesView = document.getElementById("favorites-view");

  submapView.classList.add("hidden");
  mapView.classList.add("hidden");
  favoritesView?.classList.add("hidden");
  worldView.classList.remove("hidden");
  updateDevLabel("world-view");
}
