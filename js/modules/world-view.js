/**
 * Gestion de la vue Monde
 * @module world-view
 */

import state from "./state.js";
import { normalizeUrlCandidate, fuzzyMatchText } from "./utils.js";
import { updateDevLabel } from "./ui-helpers.js";
import config from "./config.js";

/**
 * Calcule les statistiques de documentation d'une carte (POI saisis / total définis)
 * @param {Object} map - Objet carte
 * @returns {{ documented: number, total: number, status: string }}
 */
function computeCompletion(map) {
  const allPois = [
    ...(map.pois || []),
    ...(map.subMaps || []).flatMap((sub) => sub.pois || []),
  ];
  const total = allPois.length;
  const documented = allPois.filter((p) => p.name && p.name !== "TODO").length;
  let status;
  if (total === 0) {
    status = "vide";
  } else if (documented === total) {
    status = "complet";
  } else {
    status = "en-cours";
  }
  return { documented, total, status };
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
    summary.className = "card-summary";
    summary.textContent = map.summary || "";
    body.appendChild(summary);

    const completion = computeCompletion(map);
    const completionBadge = document.createElement("span");
    completionBadge.className = `completion-badge completion-${completion.status}`;
    if (completion.total === 0) {
      completionBadge.textContent = "Aucun POI saisi";
      completionBadge.title = "Aucun point d'intérêt n'a encore été saisi pour cette carte.";
    } else {
      completionBadge.textContent = `${completion.documented} POI documentés`;
      completionBadge.title =
        `${completion.documented} POI avec un nom sur ${completion.total} entrées au total.` +
        (completion.total !== completion.documented
          ? ` (${completion.total - completion.documented} marqueurs TODO restants)`
          : " — tous les marqueurs sont renseignés.");
    }
    body.appendChild(completionBadge);
    if (config.isDev) {
      const calibPoints = (map.calibration?.gamePoints || []).filter(
        (p) => p.gameX !== 0 || p.gameY !== 0 || p.mapX !== 0 || p.mapY !== 0,
      ).length;
      const calibMax = 3;
      const calibBadge = document.createElement("span");
      calibBadge.className = `completion-badge calib-badge calib-${calibPoints === calibMax ? "ok" : calibPoints === 0 ? "none" : "partial"}`;
      calibBadge.textContent = `Calib. ${calibPoints}/${calibMax}`;
      calibBadge.title = `Calibration carte principale : ${calibPoints} point(s) sur ${calibMax} requis.`;
      body.appendChild(calibBadge);
    }
    const meta = document.createElement("p");
    meta.className = "card-meta";
    meta.textContent = `${(map.subMaps || []).length} sous-cartes · vérifié ${checkedAt}`;
    body.appendChild(meta);
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
