/**
 * Gestion des favoris utilisateur (localStorage)
 * @module favorites
 */

import state, { updateState } from "./state.js";
import { normalizeSearchText } from "./utils.js";

const STORAGE_KEY = "atlasFavorites";

function safeReadStorage() {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteStorage(favorites) {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Ignore erreurs storage (mode privé, quota, etc.)
  }
}

function buildFavoriteId(poi) {
  const mapId = state.activeMap?.id || "unknown-map";
  const subMapId = state.activeSubMap?.id || "world-map";
  const nameKey = normalizeSearchText(poi?.name || "poi");
  return `${mapId}|${subMapId}|${poi?.type || "unknown"}|${nameKey}`;
}

function buildFavoriteEntry(poi) {
  return {
    id: buildFavoriteId(poi),
    mapId: state.activeMap?.id || null,
    mapName: state.activeMap?.name || "Carte",
    subMapId: state.activeSubMap?.id || null,
    subMapName: state.activeSubMap?.name || null,
    type: poi?.type || "lieux",
    name: poi?.name || "Point d'interet",
    description: poi?.description || "",
  };
}

export function loadFavoritesFromStorage() {
  updateState("favorites", safeReadStorage());
}

export function isPoiFavorite(poi) {
  const id = buildFavoriteId(poi);
  return state.favorites.some((fav) => fav.id === id);
}

export function togglePoiFavorite(poi) {
  const entry = buildFavoriteEntry(poi);
  const favorites = [...state.favorites];
  const index = favorites.findIndex((fav) => fav.id === entry.id);

  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.unshift(entry);
  }

  updateState("favorites", favorites);
  safeWriteStorage(favorites);
  renderFavoritesView();

  return index < 0;
}

export function showFavoritesView() {
  const worldView = document.getElementById("world-view");
  const mapView = document.getElementById("map-view");
  const submapView = document.getElementById("submap-view");
  const favoritesView = document.getElementById("favorites-view");

  if (!favoritesView) {
    return;
  }

  worldView?.classList.add("hidden");
  mapView?.classList.add("hidden");
  submapView?.classList.add("hidden");
  favoritesView.classList.remove("hidden");

  renderFavoritesView();
}

export function renderFavoritesView() {
  const favoritesList = document.getElementById("favorites-list");
  const favoritesCount = document.getElementById("favorites-count");

  if (!favoritesList) {
    return;
  }

  favoritesList.innerHTML = "";

  if (favoritesCount) {
    favoritesCount.textContent = `${state.favorites.length} favori(s)`;
  }

  if (!state.favorites.length) {
    const empty = document.createElement("p");
    empty.className = "favorites-empty";
    empty.textContent = "Aucun favori pour le moment.";
    favoritesList.appendChild(empty);
    return;
  }

  state.favorites.forEach((fav) => {
    const card = document.createElement("article");
    card.className = "favorite-item";

    const title = document.createElement("h3");
    title.textContent = fav.name;
    card.appendChild(title);

    const meta = document.createElement("p");
    const place = fav.subMapName ? `${fav.mapName} > ${fav.subMapName}` : fav.mapName;
    meta.textContent = `${String(fav.type || "").toUpperCase()} · ${place}`;
    card.appendChild(meta);

    if (fav.description) {
      const description = document.createElement("p");
      description.className = "favorite-description";
      description.textContent = fav.description;
      card.appendChild(description);
    }

    const actions = document.createElement("div");
    actions.className = "favorite-actions";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "btn primary";
    openButton.textContent = "Ouvrir";
    openButton.addEventListener("click", async () => {
      if (!fav.mapId) {
        return;
      }
      const { openMap } = await import("./map-view.js");
      openMap(fav.mapId);
      if (fav.subMapId) {
        const { openSubMap } = await import("./submap-view.js");
        openSubMap(fav.subMapId);
      }
    });
    actions.appendChild(openButton);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn ghost";
    removeButton.textContent = "Retirer";
    removeButton.addEventListener("click", () => {
      const favorites = state.favorites.filter((item) => item.id !== fav.id);
      updateState("favorites", favorites);
      safeWriteStorage(favorites);
      renderFavoritesView();
    });
    actions.appendChild(removeButton);

    card.appendChild(actions);
    favoritesList.appendChild(card);
  });
}
