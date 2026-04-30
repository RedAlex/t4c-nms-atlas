// ── Configuration ───────────────────────────────────────────────────────────────

const config = {
  isDev: false, // Définir à true pour activer les outils de calibration
};

const state = {
  maps: [],
  activeMap: null,
  activeSubMap: null,
  activeFilter: "lieux",
  activeSubmapFilter: "lieux",
  showPoiTitles: true,
  showSubmapPoiTitles: true,
  showGridCoords: false,
  showSubmapGridCoords: false,
};

const worldView    = document.getElementById("world-view");
const mapView      = document.getElementById("map-view");
const submapView   = document.getElementById("submap-view");
const mapCards     = document.getElementById("map-cards");
const mapStage     = document.getElementById("map-stage");
const zoneLayer    = document.getElementById("zone-layer");
const mapBgImg     = document.getElementById("map-bg-img");
const mapHoverCard = document.getElementById("map-hover-card");
const activeMapTitle   = document.getElementById("active-map-title");
const activeMapCaption = document.getElementById("active-map-caption");
const activeSubmapTitle   = document.getElementById("active-submap-title");
const activeSubmapCaption = document.getElementById("active-submap-caption");
const submapBgImg  = document.getElementById("submap-bg-img");
const submapStage  = document.getElementById("submap-stage");
const submapZoneLayer = document.getElementById("submap-zone-layer");
const submapHoverCard = document.getElementById("submap-hover-card");
const submapWikiLink = document.getElementById("submap-wiki-link");
const submapFilterLieux    = document.getElementById("submap-filter-lieux");
const submapFilterPnj      = document.getElementById("submap-filter-pnj");
const submapFilterMonstres = document.getElementById("submap-filter-monstres");
const submapTogglePoiTitlesBtn = document.getElementById("submap-toggle-poi-titles");
const submapToggleGridCoordsBtn = document.getElementById("submap-toggle-grid-coords");
const submapDevCoords = document.getElementById("submap-dev-coords");
const backToWorld  = document.getElementById("back-to-world");
const backToMap    = document.getElementById("back-to-map");
const filterLieux  = document.getElementById("filter-lieux");
const filterPnj    = document.getElementById("filter-pnj");
const filterMonstres = document.getElementById("filter-monstres");
const togglePoiTitlesBtn = document.getElementById("toggle-poi-titles");
const toggleGridCoordsBtn = document.getElementById("toggle-grid-coords");
const mapDevCoords = document.getElementById("map-dev-coords");
const devLabel     = document.getElementById("dev-label");

// Pages avec leurs titres respectifs
const pageLabels = {
  "world-view": "Monde",
  "map-view": "Carte",
  "submap-view": "Sous-carte",
};

init();

function updateDevLabel(pageName, specificName) {
  if (!config.isDev || !devLabel) return;
  const baseTitle = pageLabels[pageName] || "Inconnu";
  const fullTitle = specificName ? `${baseTitle}: ${specificName}` : baseTitle;
  devLabel.textContent = fullTitle;
  devLabel.style.display = "block";
}

async function init() {
  const data = await loadMapsData();
  if (!data?.maps?.length) return;
  state.maps = data.maps;
  renderWorldCards();
  backToWorld.addEventListener("click", showWorldView);
  backToMap.addEventListener("click", () => openMap(state.activeMap.id));
  filterLieux.addEventListener("click", () => toggleFilter("lieux"));
  filterPnj.addEventListener("click", () => toggleFilter("pnj"));
  filterMonstres.addEventListener("click", () => toggleFilter("monstres"));
  togglePoiTitlesBtn.addEventListener("click", togglePoiTitles);
  if (submapFilterLieux)    submapFilterLieux.addEventListener("click", () => toggleSubmapFilter("lieux"));
  if (submapFilterPnj)      submapFilterPnj.addEventListener("click", () => toggleSubmapFilter("pnj"));
  if (submapFilterMonstres) submapFilterMonstres.addEventListener("click", () => toggleSubmapFilter("monstres"));
  if (submapTogglePoiTitlesBtn) submapTogglePoiTitlesBtn.addEventListener("click", toggleSubmapPoiTitles);
  if (submapToggleGridCoordsBtn) submapToggleGridCoordsBtn.addEventListener("click", toggleSubmapGridCoords);
  if (submapStage) {
    submapStage.addEventListener("mousemove", handleSubmapStageMouseMove);
    submapStage.addEventListener("mouseleave", hideSubmapDevCoords);
    submapStage.addEventListener("click", handleSubmapStageClick);
  }
  mapStage.addEventListener("mousemove", handleMapStageMouseMove);
  mapStage.addEventListener("mouseleave", hideMapDevCoords);
  mapStage.addEventListener("click", handleMapStageClick);
  mapBgImg.addEventListener("load", updateZoneLayerLayout);
  window.addEventListener("resize", updateZoneLayerLayout);
  if (submapBgImg) submapBgImg.addEventListener("load", updateSubmapZoneLayerLayout);
  window.addEventListener("resize", updateSubmapZoneLayerLayout);
  if (toggleGridCoordsBtn) {
    toggleGridCoordsBtn.addEventListener("click", toggleGridCoords);
  }
  applyDevUiVisibility();
  updateFilterButtons();
  updateDevLabel("world-view");
}

async function loadMapsData() {
  try {
    const response = await fetch("data/maps.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // Nouveau format: index avec fichiers regionaux
    if (Array.isArray(data?.mapFiles) && data.mapFiles.length) {
      const maps = await loadMapsFromFiles(data.mapFiles);
      return { _source: data._source, maps };
    }

    // Ancien format: toutes les cartes dans maps.json
    if (Array.isArray(data?.maps)) return data;

    return null;
  } catch (_err) {
    if (window.desktopAPI?.readMapsData) return window.desktopAPI.readMapsData();
    return null;
  }
}

async function loadMapsFromFiles(mapFiles) {
  const requests = mapFiles.map(async (filePath) => {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`HTTP ${response.status} on ${filePath}`);
    const data = await response.json();
    return data?.map || null;
  });

  const maps = await Promise.all(requests);
  return maps.filter(Boolean);
}

// ── Monde ───────────────────────────────────────────────────────────────────

function renderWorldCards() {
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
    card.addEventListener("click", () => openMap(map.id));
    mapCards.appendChild(card);
  });
}

function showWorldView() {
  submapView.classList.add("hidden");
  mapView.classList.add("hidden");
  worldView.classList.remove("hidden");
  updateDevLabel("world-view");
}

// ── Carte principale ─────────────────────────────────────────────────────────

function openMap(mapId) {
  state.activeMap = state.maps.find((m) => m.id === mapId) || null;
  state.activeSubMap = null;
  if (!state.activeMap) return;

  worldView.classList.add("hidden");
  submapView.classList.add("hidden");
  mapView.classList.remove("hidden");
  updateDevLabel("map-view", state.activeMap.name);

  activeMapTitle.textContent = state.activeMap.name;
  activeMapCaption.textContent = `Version Abetsic — ${(state.activeMap.subMaps || []).length} sous-cartes disponibles`;

  const mapImage = state.activeMap.image || state.activeMap.abetsicImage;
  if (mapImage) {
    mapBgImg.src = mapImage;
    mapBgImg.alt = `Carte ${state.activeMap.name}`;
  }

  updateZoneLayerLayout();

  renderInteractivePoints();

  const mapImgSource = document.getElementById("map-img-source");
  const wikiUrl = state.activeMap._meta?.abetsicSourceUrl || state.activeMap._meta?.checkUrls?.[0] || "#";
  setSourceLink(mapImgSource, wikiUrl);

  updateFilterDisplay();
  hideMapDevCoords();
}

// ── Sous-carte ───────────────────────────────────────────────────────────────

function openSubMap(subMapId) {
  const subMaps = state.activeMap.subMaps || [];
  state.activeSubMap = subMaps.find((s) => s.id === subMapId) || null;
  if (!state.activeSubMap) return;

  mapView.classList.add("hidden");
  submapView.classList.remove("hidden");
  updateDevLabel("submap-view", state.activeSubMap.name);
  hideMapHoverCard();

  activeSubmapTitle.textContent = state.activeSubMap.name;
  activeSubmapCaption.textContent = state.activeMap.name;
  submapBgImg.src = state.activeSubMap.image;
  submapBgImg.alt = state.activeSubMap.name;

  const submapImgSource = document.getElementById("submap-img-source");
  const safeSubmapWikiUrl = normalizeUrlCandidate(state.activeSubMap.wikiUrl);
  if (safeSubmapWikiUrl) {
    submapWikiLink.href = safeSubmapWikiUrl;
    submapWikiLink.style.display = "";
    setSourceLink(submapImgSource, safeSubmapWikiUrl);
  } else {
    submapWikiLink.style.display = "none";
    submapImgSource.textContent = "";
  }

  updateSubmapFilterButtons();
  renderSubmapPois();
}


// ── Filtres ──────────────────────────────────────────────────────────────────

function toggleFilter(filterName) {
  state.activeFilter = filterName;
  updateFilterButtons();
  updateFilterDisplay();
}

function toggleSubmapFilter(filterName) {
  state.activeSubmapFilter = filterName;
  updateSubmapFilterButtons();
  renderSubmapPois();
}

function updateFilterButtons() {
  ["lieux", "pnj", "monstres"].forEach((filterName) => {
    const button = document.getElementById(`filter-${filterName}`);
    if (!button) return;
    button.classList.toggle("active", state.activeFilter === filterName);
  });
}

function updateSubmapFilterButtons() {
  ["lieux", "pnj", "monstres"].forEach((filterName) => {
    const button = document.getElementById(`submap-filter-${filterName}`);
    if (!button) return;
    button.classList.toggle("active", state.activeSubmapFilter === filterName);
  });
}

function togglePoiTitles() {
  state.showPoiTitles = !state.showPoiTitles;
  togglePoiTitlesBtn.classList.toggle("active", state.showPoiTitles);
  togglePoiTitlesBtn.textContent = state.showPoiTitles ? "Titres ON" : "Titres OFF";
  renderInteractivePoints();
}

function toggleSubmapPoiTitles() {
  state.showSubmapPoiTitles = !state.showSubmapPoiTitles;
  if (submapTogglePoiTitlesBtn) {
    submapTogglePoiTitlesBtn.classList.toggle("active", state.showSubmapPoiTitles);
    submapTogglePoiTitlesBtn.textContent = state.showSubmapPoiTitles ? "Titres ON" : "Titres OFF";
  }
  renderSubmapPois();
}

// ── Affichage des filtres ───────────────────────────────────────────────────

function updateFilterDisplay() {
  const mapImgSource = document.getElementById("map-img-source");
  
  // Afficher/masquer le texte source selon le filtre "lieux"
  if (mapImgSource) {
    if (state.activeFilter === "lieux") {
      mapImgSource.style.display = "";
    } else {
      mapImgSource.style.display = "none";
    }
  }

  renderInteractivePoints();
}

// ── POI interactifs ──────────────────────────────────────────────────────────

function renderInteractivePoints() {
  if (!zoneLayer) return;
  zoneLayer.innerHTML = "";
  zoneLayer.classList.toggle("titles-hidden", !state.showPoiTitles);
  hideMapHoverCard();

  const gameToPercent = createGameToPercentTransform(state.activeMap?.calibration);
  const pois = state.activeMap?.pois || [];
  const visiblePois = pois.filter((poi) => poi.type === state.activeFilter);

  visiblePois.forEach((poi) => {
    const position = resolvePoiPosition(poi, gameToPercent);
    if (!position) return;

    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `poi ${poi.type}`;
    marker.style.left = `${position.x}%`;
    marker.style.top = `${position.y}%`;
    marker.setAttribute("aria-label", poi.name || poi.type);
    if (poi.name) {
      const title = document.createElement("span");
      title.className = "poi-title";
      title.textContent = poi.name;
      marker.appendChild(title);
    }

    marker.addEventListener("mouseenter", (event) => showMapHoverCard(event, poi));
    marker.addEventListener("mousemove", (event) => showMapHoverCard(event, poi));
    marker.addEventListener("mouseleave", hideMapHoverCard);
    marker.addEventListener("focus", () => showMapHoverCardFromMarker(marker, poi));
    marker.addEventListener("blur", hideMapHoverCard);
    marker.addEventListener("click", async (event) => {
      if (await handleCalibrationClickCopy(event)) {
        event.stopPropagation();
        return;
      }
      handlePoiOpenMap(poi);
    });
    marker.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      handlePoiOpenWiki(poi);
    });

    zoneLayer.appendChild(marker);
  });

  if (state.showGridCoords) {
    renderCalibrationMarkers(gameToPercent);
  }
}

function renderCalibrationMarkers(gameToPercent) {
  const points = state.activeMap?.calibration?.gamePoints || [];
  if (!Array.isArray(points) || !gameToPercent) return;

  points.forEach((point, index) => {
    if (typeof point?.gameX !== "number" || typeof point?.gameY !== "number") return;
    const position = gameToPercent(point.gameX, point.gameY);
    if (!position) return;

    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "poi calibration-point";
    marker.style.left = `${position.x}%`;
    marker.style.top = `${position.y}%`;
    marker.setAttribute("aria-label", point.name || `Calibration ${index + 1}`);
    const title = document.createElement("span");
    title.className = "poi-title";
    title.textContent = `CAL ${index + 1}${point.name ? ` — ${point.name}` : ""}`;
    marker.appendChild(title);

    const copyCalibrationPoint = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const coords = { x: point.mapX ?? 0, y: point.mapY ?? 0 };
      const copied = await copyTextToClipboard(`${coords.x.toFixed(2)},${coords.y.toFixed(2)}`);
      if (copied && mapDevCoords) {
        mapDevCoords.textContent = `GX ${coords.x.toFixed(2)} | GY ${coords.y.toFixed(2)} (copie)`;
        mapDevCoords.classList.remove("hidden");
      }
    };

    marker.addEventListener("click", copyCalibrationPoint);
    marker.addEventListener("contextmenu", copyCalibrationPoint);
    zoneLayer.appendChild(marker);
  });
}

function updateZoneLayerLayout() {
  if (!mapStage || !zoneLayer) return;

  const rect = mapStage.getBoundingClientRect();
  const displayRect = getDisplayedImageRect(
    rect.width,
    rect.height,
    mapBgImg?.naturalWidth || 0,
    mapBgImg?.naturalHeight || 0,
  );

  zoneLayer.style.left = `${displayRect.left}px`;
  zoneLayer.style.top = `${displayRect.top}px`;
  zoneLayer.style.width = `${displayRect.width}px`;
  zoneLayer.style.height = `${displayRect.height}px`;
}

function updateSubmapZoneLayerLayout() {
  if (!submapStage || !submapZoneLayer) return;

  const rect = submapStage.getBoundingClientRect();
  const displayRect = getDisplayedImageRect(
    rect.width,
    rect.height,
    submapBgImg?.naturalWidth || 0,
    submapBgImg?.naturalHeight || 0,
  );

  submapZoneLayer.style.left = `${displayRect.left}px`;
  submapZoneLayer.style.top = `${displayRect.top}px`;
  submapZoneLayer.style.width = `${displayRect.width}px`;
  submapZoneLayer.style.height = `${displayRect.height}px`;
}

// ── POI sous-carte ────────────────────────────────────────────────────────────

function renderSubmapPois() {
  if (!submapZoneLayer) return;
  submapZoneLayer.innerHTML = "";
  submapZoneLayer.classList.toggle("titles-hidden", !state.showSubmapPoiTitles);
  hideSubmapHoverCard();

  const gameToPercent = createGameToPercentTransform(state.activeSubMap?.calibration);
  const pois = state.activeSubMap?.pois || [];
  const visiblePois = pois.filter((poi) => poi.type === state.activeSubmapFilter);

  visiblePois.forEach((poi) => {
    const position = resolvePoiPosition(poi, gameToPercent);
    if (!position) return;

    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = `poi ${poi.type}`;
    marker.style.left = `${position.x}%`;
    marker.style.top = `${position.y}%`;
    marker.setAttribute("aria-label", poi.name || poi.type);

    if (poi.name) {
      const title = document.createElement("span");
      title.className = "poi-title";
      title.textContent = poi.name;
      marker.appendChild(title);
    }

    marker.addEventListener("mouseenter", (event) => showSubmapHoverCard(event, poi));
    marker.addEventListener("mousemove", (event) => showSubmapHoverCard(event, poi));
    marker.addEventListener("mouseleave", hideSubmapHoverCard);
    marker.addEventListener("focus", () => showSubmapHoverCardFromMarker(marker, poi));
    marker.addEventListener("blur", hideSubmapHoverCard);
    marker.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      const wikiUrl = normalizeUrlCandidate(poi.wikiUrl);
      if (wikiUrl) window.open(wikiUrl, "_blank", "noopener");
    });

    submapZoneLayer.appendChild(marker);
  });

  if (state.showSubmapGridCoords) {
    renderSubmapCalibrationMarkers(gameToPercent);
  }
}

function renderSubmapCalibrationMarkers(gameToPercent) {
  const points = state.activeSubMap?.calibration?.gamePoints || [];
  if (!Array.isArray(points) || !gameToPercent) return;

  points.forEach((point, index) => {
    if (typeof point?.gameX !== "number" || typeof point?.gameY !== "number") return;
    const position = gameToPercent(point.gameX, point.gameY);
    if (!position) return;

    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "poi calibration-point";
    marker.style.left = `${position.x}%`;
    marker.style.top = `${position.y}%`;
    marker.setAttribute("aria-label", point.name || `Calibration ${index + 1}`);
    const title = document.createElement("span");
    title.className = "poi-title";
    title.textContent = `CAL ${index + 1}${point.name ? ` — ${point.name}` : ""}`;
    marker.appendChild(title);

    const copyCalibrationPoint = async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const coords = { x: point.mapX ?? 0, y: point.mapY ?? 0 };
      const copied = await copyTextToClipboard(`${coords.x.toFixed(2)},${coords.y.toFixed(2)}`);
      if (copied && submapDevCoords) {
        submapDevCoords.textContent = `GX ${coords.x.toFixed(2)} | GY ${coords.y.toFixed(2)} (copie)`;
        submapDevCoords.classList.remove("hidden");
      }
    };

    marker.addEventListener("click", copyCalibrationPoint);
    marker.addEventListener("contextmenu", copyCalibrationPoint);
    submapZoneLayer.appendChild(marker);
  });
}

function showSubmapHoverCard(event, poi) {
  if (!submapHoverCard || !submapStage) return;

  submapHoverCard.textContent = "";

  const type = document.createElement("p");
  type.className = "map-hover-type";
  type.textContent = String(poi.type || "").toUpperCase();
  submapHoverCard.appendChild(type);

  const title = document.createElement("h4");
  title.textContent = poi.name || "Point d'interet";
  submapHoverCard.appendChild(title);

  const description = document.createElement("p");
  description.textContent = poi.description || "Aucune description";
  submapHoverCard.appendChild(description);

  const hint = document.createElement("p");
  hint.className = "map-hover-hint";
  hint.textContent = "Clic droit: wiki";
  submapHoverCard.appendChild(hint);

  const rect = submapStage.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  submapHoverCard.style.left = `${Math.min(Math.max(x + 14, 12), rect.width - 230)}px`;
  submapHoverCard.style.top = `${Math.min(Math.max(y + 14, 12), rect.height - 130)}px`;
  submapHoverCard.classList.add("visible");
}

function showSubmapHoverCardFromMarker(marker, poi) {
  if (!submapStage) return;
  const markerRect = marker.getBoundingClientRect();
  showSubmapHoverCard(
    { clientX: markerRect.left + markerRect.width / 2, clientY: markerRect.top + markerRect.height / 2 },
    poi,
  );
}

function hideSubmapHoverCard() {
  if (!submapHoverCard) return;
  submapHoverCard.classList.remove("visible");
}

function hideSubmapDevCoords() {
  if (!submapDevCoords) return;
  submapDevCoords.classList.add("hidden");
}

function getPointerPercentOnSubmap(event) {
  if (!submapStage) return null;

  const rect = submapStage.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  const displayRect = getDisplayedImageRect(
    rect.width,
    rect.height,
    submapBgImg?.naturalWidth || 0,
    submapBgImg?.naturalHeight || 0,
  );

  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;

  if (
    px < displayRect.left ||
    py < displayRect.top ||
    px > displayRect.left + displayRect.width ||
    py > displayRect.top + displayRect.height
  ) {
    return null;
  }

  const x = ((px - displayRect.left) / displayRect.width) * 100;
  const y = ((py - displayRect.top) / displayRect.height) * 100;
  return { x, y };
}

function handleSubmapStageMouseMove(event) {
  if (!config.isDev || !state.showSubmapGridCoords) return;

  const percent = getPointerPercentOnSubmap(event);
  if (!percent) {
    hideSubmapDevCoords();
    return;
  }

  if (!submapDevCoords) return;
  const gameToPercent = createGameToPercentTransform(state.activeSubMap?.calibration);
  if (gameToPercent) {
    // Affichage en coordonnées brutes % si pas de calibration inverse
    submapDevCoords.textContent = `X ${percent.x.toFixed(2)}% | Y ${percent.y.toFixed(2)}%`;
  } else {
    submapDevCoords.textContent = `X ${percent.x.toFixed(2)}% | Y ${percent.y.toFixed(2)}%`;
  }
  submapDevCoords.classList.remove("hidden");
}

async function handleSubmapStageClick(event) {
  if (!config.isDev || !state.showSubmapGridCoords) return;
  if (event.button !== 0) return;

  const percent = getPointerPercentOnSubmap(event);
  if (!percent) return;

  const text = `${percent.x.toFixed(2)},${percent.y.toFixed(2)}`;
  const copied = await copyTextToClipboard(text);
  if (copied && submapDevCoords) {
    submapDevCoords.textContent = `X ${percent.x.toFixed(2)}% | Y ${percent.y.toFixed(2)}% (copie)`;
    submapDevCoords.classList.remove("hidden");
  }
}

function toggleSubmapGridCoords() {
  state.showSubmapGridCoords = !state.showSubmapGridCoords;

  if (!submapToggleGridCoordsBtn) return;
  submapToggleGridCoordsBtn.textContent = state.showSubmapGridCoords ? "Calibration ON" : "Calibration OFF";
  submapToggleGridCoordsBtn.classList.toggle("active", state.showSubmapGridCoords);

  if (!state.showSubmapGridCoords) hideSubmapDevCoords();
  renderSubmapPois();
}

function showMapHoverCard(event, poi) {
  if (!mapHoverCard || !mapStage) return;

  mapHoverCard.textContent = "";

  const type = document.createElement("p");
  type.className = "map-hover-type";
  type.textContent = String(poi.type || "").toUpperCase();
  mapHoverCard.appendChild(type);

  const title = document.createElement("h4");
  title.textContent = poi.name || "Point d'interet";
  mapHoverCard.appendChild(title);

  const description = document.createElement("p");
  description.textContent = poi.description || "Aucune description";
  mapHoverCard.appendChild(description);

  const hint = document.createElement("p");
  hint.className = "map-hover-hint";
  hint.textContent = "Clic: ouvrir carte | Clic droit: wiki";
  mapHoverCard.appendChild(hint);

  const rect = mapStage.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  mapHoverCard.style.left = `${Math.min(Math.max(x + 14, 12), rect.width - 230)}px`;
  mapHoverCard.style.top = `${Math.min(Math.max(y + 14, 12), rect.height - 130)}px`;
  mapHoverCard.classList.add("visible");
}

function showMapHoverCardFromMarker(marker, poi) {
  if (!mapStage) return;
  const markerRect = marker.getBoundingClientRect();
  const stageRect = mapStage.getBoundingClientRect();

  showMapHoverCard(
    {
      clientX: markerRect.left - 0 + (markerRect.width / 2),
      clientY: markerRect.top - 0 + (markerRect.height / 2),
    },
    poi,
  );

  if (!stageRect.width) hideMapHoverCard();
}

function hideMapHoverCard() {
  if (!mapHoverCard) return;
  mapHoverCard.classList.remove("visible");
}

function handlePoiOpenMap(poi) {
  if (!state.activeMap) return;

  const subMaps = state.activeMap.subMaps || [];
  const targetSubMapId = poi.openSubMapId || subMaps[0]?.id;
  if (!targetSubMapId) return;

  openSubMap(targetSubMapId);
}

function handlePoiOpenWiki(poi) {
  const wikiUrl =
    normalizeUrlCandidate(poi?.wikiUrl) ||
    buildWikiSearchUrl(poi?.name) ||
    normalizeUrlCandidate(state.activeMap?._meta?.checkUrls?.[0]);
  if (!wikiUrl) return;

  window.open(wikiUrl, "_blank", "noopener");
}

function normalizeUrlCandidate(url) {
  if (typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch (_err) {
    return null;
  }
}

function setSourceLink(container, url) {
  if (!container) return;
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

function buildWikiSearchUrl(poiName) {
  if (typeof poiName !== "string") return null;

  const trimmedName = poiName.trim();
  if (!trimmedName) return null;

  const baseUrl =
    "https://t4c.fandom.com/fr/wiki/Sp%C3%A9cial:Recherche?scope=internal&navigationSearch=true&query=";
  return `${baseUrl}${encodeURIComponent(trimmedName)}`;
}

function applyDevUiVisibility() {
  if (toggleGridCoordsBtn) {
    if (config.isDev) {
      toggleGridCoordsBtn.classList.remove("hidden");
    } else {
      toggleGridCoordsBtn.classList.add("hidden");
      state.showGridCoords = false;
      hideMapDevCoords();
    }
  }
  if (submapToggleGridCoordsBtn) {
    if (config.isDev) {
      submapToggleGridCoordsBtn.classList.remove("hidden");
    } else {
      submapToggleGridCoordsBtn.classList.add("hidden");
      state.showSubmapGridCoords = false;
      hideSubmapDevCoords();
    }
  }
}

function toggleGridCoords() {
  state.showGridCoords = !state.showGridCoords;

  if (!toggleGridCoordsBtn) return;
  toggleGridCoordsBtn.textContent = state.showGridCoords ? "Calibration ON" : "Calibration OFF";
  toggleGridCoordsBtn.classList.toggle("active", state.showGridCoords);

  if (!state.showGridCoords) hideMapDevCoords();
  renderInteractivePoints();
}

function handleMapStageMouseMove(event) {
  if (!config.isDev || !state.showGridCoords) return;

  const percent = getPointerPercentOnMap(event);
  if (!percent) {
    hideMapDevCoords();
    return;
  }

  if (!mapDevCoords) return;
  const displayX = (percent.x / 100) * 5000;
  const displayY = (percent.y / 100) * 5000;
  mapDevCoords.textContent = `GX ${displayX.toFixed(2)} | GY ${displayY.toFixed(2)}`;
  mapDevCoords.classList.remove("hidden");
}

async function handleMapStageClick(event) {
  await handleCalibrationClickCopy(event);
}

async function handleCalibrationClickCopy(event) {
  if (!config.isDev || !state.showGridCoords) return false;
  if (event.button !== 0) return false;

  const percent = getPointerPercentOnMap(event);
  if (!percent) return false;

  const coords = percentToDisplayCoords(percent);
  const text = `${coords.x.toFixed(2)},${coords.y.toFixed(2)}`;
  const copied = await copyTextToClipboard(text);
  if (!copied) return false;

  if (mapDevCoords) {
    mapDevCoords.textContent = `GX ${coords.x.toFixed(2)} | GY ${coords.y.toFixed(2)} (copie)`;
    mapDevCoords.classList.remove("hidden");
  }

  return true;
}

function percentToDisplayCoords(percent) {
  return {
    x: (percent.x / 100) * 5000,
    y: (percent.y / 100) * 5000,
  };
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_err) {
      // Fallback below for contexts where Clipboard API is blocked.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const result = document.execCommand("copy");
    document.body.removeChild(textarea);
    return result;
  } catch (_err) {
    document.body.removeChild(textarea);
    return false;
  }
}

function hideMapDevCoords() {
  if (!mapDevCoords) return;
  mapDevCoords.classList.add("hidden");
}

function getPointerPercentOnMap(event) {
  if (!mapStage) return null;

  const rect = mapStage.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  const displayRect = getDisplayedImageRect(
    rect.width,
    rect.height,
    mapBgImg?.naturalWidth || 0,
    mapBgImg?.naturalHeight || 0,
  );

  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;

  if (
    px < displayRect.left ||
    py < displayRect.top ||
    px > displayRect.left + displayRect.width ||
    py > displayRect.top + displayRect.height
  ) {
    return null;
  }

  const x = ((px - displayRect.left) / displayRect.width) * 100;
  const y = ((py - displayRect.top) / displayRect.height) * 100;
  return { x, y };
}

function getDisplayedImageRect(containerW, containerH, imageW, imageH) {
  if (!imageW || !imageH) {
    return { left: 0, top: 0, width: containerW, height: containerH };
  }

  const scale = Math.min(containerW / imageW, containerH / imageH);
  const width = imageW * scale;
  const height = imageH * scale;

  return {
    left: (containerW - width) / 2,
    top: (containerH - height) / 2,
    width,
    height,
  };
}

function resolvePoiPosition(poi, gameToPercent) {
  if (typeof poi.gameX === "number" && typeof poi.gameY === "number" && gameToPercent) {
    return gameToPercent(poi.gameX, poi.gameY);
  }

  if (typeof poi.gx === "number" && typeof poi.gy === "number" && gameToPercent) {
    return gameToPercent(poi.gx, poi.gy);
  }

  if (typeof poi.x === "number" && typeof poi.y === "number") {
    return { x: poi.x, y: poi.y };
  }

  return null;
}

function createGameToPercentTransform(calibration) {
  const gamePoints = calibration?.gamePoints;
  if (!Array.isArray(gamePoints)) return null;

  const pairedPoints = gamePoints
    .filter(
      (point) =>
        typeof point?.gameX === "number" &&
        typeof point?.gameY === "number" &&
        typeof point?.mapX === "number" &&
        typeof point?.mapY === "number" &&
        !(point.gameX === 0 && point.gameY === 0 && point.mapX === 0 && point.mapY === 0),
    )
    .map((point) => ({
      gameX: point.gameX,
      gameY: point.gameY,
      x: (point.mapX / 5000) * 100,
      y: (point.mapY / 5000) * 100,
    }));

  if (pairedPoints.length < 3) return null;
  return createAffineTransform(pairedPoints, "gameX", "gameY", "x", "y");
}

function createAffineTransform(anchors, sxKey, syKey, txKey, tyKey) {
  const [p1, p2, p3] = anchors;

  const valid = [p1, p2, p3].every(
    (p) =>
      typeof p[sxKey] === "number" &&
      typeof p[syKey] === "number" &&
      typeof p[txKey] === "number" &&
      typeof p[tyKey] === "number",
  );
  if (!valid) return null;

  const det =
    p1[sxKey] * (p2[syKey] - p3[syKey]) +
    p2[sxKey] * (p3[syKey] - p1[syKey]) +
    p3[sxKey] * (p1[syKey] - p2[syKey]);
  if (Math.abs(det) < 1e-9) return null;

  const a =
    (p1[txKey] * (p2[syKey] - p3[syKey]) +
      p2[txKey] * (p3[syKey] - p1[syKey]) +
      p3[txKey] * (p1[syKey] - p2[syKey])) /
    det;
  const b =
    (p1[txKey] * (p3[sxKey] - p2[sxKey]) +
      p2[txKey] * (p1[sxKey] - p3[sxKey]) +
      p3[txKey] * (p2[sxKey] - p1[sxKey])) /
    det;
  const c =
    (p1[txKey] * (p2[sxKey] * p3[syKey] - p3[sxKey] * p2[syKey]) +
      p2[txKey] * (p3[sxKey] * p1[syKey] - p1[sxKey] * p3[syKey]) +
      p3[txKey] * (p1[sxKey] * p2[syKey] - p2[sxKey] * p1[syKey])) /
    det;

  const d =
    (p1[tyKey] * (p2[syKey] - p3[syKey]) +
      p2[tyKey] * (p3[syKey] - p1[syKey]) +
      p3[tyKey] * (p1[syKey] - p2[syKey])) /
    det;
  const e =
    (p1[tyKey] * (p3[sxKey] - p2[sxKey]) +
      p2[tyKey] * (p1[sxKey] - p3[sxKey]) +
      p3[tyKey] * (p2[sxKey] - p1[sxKey])) /
    det;
  const f =
    (p1[tyKey] * (p2[sxKey] * p3[syKey] - p3[sxKey] * p2[syKey]) +
      p2[tyKey] * (p3[sxKey] * p1[syKey] - p1[sxKey] * p3[syKey]) +
      p3[tyKey] * (p1[sxKey] * p2[syKey] - p2[sxKey] * p1[syKey])) /
    det;

  return (sx, sy) => ({
    x: a * sx + b * sy + c,
    y: d * sx + e * sy + f,
  });
}
