/**
 * Gestion de la vue Monde
 * @module world-view
 */

import state, { updateState } from "./state.js";
import { normalizeUrlCandidate } from "./utils.js";
import { updateDevLabel } from "./ui-helpers.js";
import config from "./config.js";

function computeCompletion(map) {
  const allPois = [
    ...(map.pois || []),
    ...(map.subMaps || []).flatMap((sub) => sub.pois || []),
  ];
  const total = allPois.length;
  const documented = allPois.filter((p) => p.name && p.name !== "TODO").length;

  if (total === 0) {
    return { documented, total, status: "vide" };
  }
  if (documented === total) {
    return { documented, total, status: "complet" };
  }
  return { documented, total, status: "en-cours" };
}

function renderMapTabsInContainer(container) {
  if (!container) {
    return;
  }
  container.innerHTML = "";

  const maps = state.maps || [];
  const worlds = state.worlds || [];

  // Toujours regrouper par monde (worldId) pour eviter les doublons de cartes
  // comme Raven's Dust / Stoneheim qui partagent la meme carte monde qu'Arakas.
  const worldEntries = [];

  if (worlds.length > 0) {
    worlds.forEach((world) => {
      const firstMap = maps.find((m) => m.worldId === world.worldId) || null;
      worldEntries.push({
        worldId: world.worldId,
        label: (world.name || "Monde").split(" / ")[0],
        title: world.name || "Monde",
        targetMapId: firstMap?.id || null,
      });
    });
  } else {
    const uniqueWorldIds = Array.from(new Set(
      maps
        .filter((m) => typeof m.worldId === "number")
        .map((m) => m.worldId),
    ));

    uniqueWorldIds.forEach((worldId) => {
      const firstMap = maps.find((m) => m.worldId === worldId) || null;
      if (!firstMap) {
        return;
      }
      worldEntries.push({
        worldId,
        label: firstMap.name || `Monde ${worldId}`,
        title: firstMap.name || `Monde ${worldId}`,
        targetMapId: firstMap.id,
      });
    });
  }

  worldEntries.forEach((entry) => {
    const isActive = state.activeMap?.worldId === entry.worldId;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "world-tab" + (isActive ? " active" : "");
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
    btn.title = entry.title;
    btn.textContent = entry.label;

    if (!entry.targetMapId) {
      btn.classList.add("world-tab--empty");
      btn.disabled = true;
    }

    btn.addEventListener("click", () => {
      if (!entry.targetMapId) {
        updateState("activeWorldId", entry.worldId);
        return;
      }
      import("./map-view.js").then(({ openMap }) => openMap(entry.targetMapId));
    });

    container.appendChild(btn);
  });
}

/**
 * Construit les boutons de cartes dans la vue accueil ET la vue carte.
 */
export function renderWorldTabs() {
  renderMapTabsInContainer(document.getElementById("map-tabs"));
}

/**
 * Rend les cartes de l'accueil (liste cliquable)
 */
export function renderWorldCards() {
  const mapCardsGrid = document.getElementById("map-cards-grid");
  const mapCards = document.getElementById("map-cards");
  const worldEmpty = document.getElementById("world-empty");
  const container = mapCardsGrid || mapCards;
  if (!container) {
    return;
  }

  container.innerHTML = "";
  const maps = state.maps || [];
  const worlds = state.worlds || [];

  // Dédupliquer par worldId : 1 carte représentante par monde
  let representativeMaps;
  if (worlds.length > 0) {
    representativeMaps = worlds
      .map((w) => maps.find((m) => m.worldId === w.worldId))
      .filter(Boolean);
  } else {
    const seen = new Set();
    representativeMaps = maps.filter((m) => {
      const key = m.worldId ?? m.id;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  const filteredMaps = representativeMaps;

  if (worldEmpty) {
    worldEmpty.classList.toggle("hidden", filteredMaps.length > 0);
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
      completionBadge.title = "Aucun point d'interet n'a encore ete saisi pour cette carte.";
    } else {
      completionBadge.textContent = `${completion.documented} POI documentes`;
      completionBadge.title = `${completion.documented} POI avec un nom sur ${completion.total} entrees au total.`;
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
    meta.textContent = `${(map.subMaps || []).length} sous-cartes � verifie ${checkedAt}`;
    body.appendChild(meta);

    card.appendChild(body);
    card.addEventListener("click", () => {
      import("./map-view.js").then(({ openMap }) => openMap(map.id));
    });

    container.appendChild(card);
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

  submapView?.classList.add("hidden");
  mapView?.classList.add("hidden");
  favoritesView?.classList.add("hidden");
  worldView?.classList.remove("hidden");
  updateDevLabel("world-view");
}
