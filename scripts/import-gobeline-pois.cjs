/**
 * Import des POI depuis les sources Gobeline Dev (npcs.json + bestiary.json)
 * Format coordonnées Gobeline : "gameX.gameY.level"
 *
 * Usage : node scripts/import-gobeline-pois.cjs
 */

"use strict";

const https = require("https");
const fs = require("fs");
const path = require("path");

// ─── Configuration ────────────────────────────────────────────────────────────

const GOBELINE_BASE = "https://raw.githubusercontent.com/gobeline-dev/t4c-nms-overview/main/public/data";
const MAPS_DIR = path.join(__dirname, "../data/maps");

/** Mapping zone Gobeline → mapId local */
const ZONE_TO_MAP = {
  "Arakas": "arakas",
  "Raven's Dust": "raven-dust",
  "Stoneheim": "stoneheim",
  "Drake Island": "drake-island",
  "Niève": "ile-lune-nieve",
};

/** Zones ignorées (zones spécifiques serveur non cartographiées) */
const SKIP_ZONES = new Set([
  "Add-on 1.25",
  "Zone Seraph",
  "Urtanar",
  "Cerberus",
  "Inconnue",
  "Inconnu",
  "Ile spécifique au serveur",
  "Leoworld",
]);

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error(`JSON parse error for ${url}: ${e.message}`)); }
      });
    }).on("error", reject);
  });
}

/**
 * Parse les coordonnées Gobeline "gameX.gameY.level" → { gameX, gameY, level }
 * Retourne null si le format est invalide ou vide.
 */
function parseCoords(raw) {
  if (!raw || typeof raw !== "string" || raw.trim() === "") {
    return null;
  }
  const parts = raw.trim().split(".");
  if (parts.length < 2) {
    return null;
  }
  const gameX = parseFloat(parts[0]);
  const gameY = parseFloat(parts[1]);
  const level = parts.length >= 3 ? parseInt(parts[2], 10) : 0;
  if (!Number.isFinite(gameX) || !Number.isFinite(gameY)) {
    return null;
  }
  return { gameX, gameY, level };
}

/**
 * Charge un fichier JSON de carte et retourne son objet map.
 * Gère le BOM UTF-8 éventuel.
 */
function loadMap(mapId) {
  const file = path.join(MAPS_DIR, `${mapId}.json`);
  if (!fs.existsSync(file)) {
    return null;
  }
  let raw = fs.readFileSync(file, "utf8");
  // Supprimer le BOM UTF-8 éventuel
  if (raw.charCodeAt(0) === 0xFEFF) {
    raw = raw.slice(1);
  }
  const parsed = JSON.parse(raw);
  return { file, data: parsed };
}

/**
 * Sauvegarde un fichier JSON de carte (indenté 2 espaces).
 */
function saveMap(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/**
 * Vérifie si un POI existe déjà dans la liste (même nom + même type).
 */
function isDuplicate(pois, name, type) {
  return pois.some((p) => p.name === name && p.type === type);
}

// ─── Import PNJ ───────────────────────────────────────────────────────────────

function processNpcs(npcs, mapBuckets) {
  let total = 0;
  let skipped = 0;

  for (const npc of npcs) {
    const zones = Array.isArray(npc.zone) ? npc.zone : [npc.zone];

    for (const zone of zones) {
      if (SKIP_ZONES.has(zone)) {
        skipped++;
        continue;
      }
      const mapId = ZONE_TO_MAP[zone];
      if (!mapId) {
        // Zone inconnue — on note mais on continue
        continue;
      }

      const coords = parseCoords(npc.coordinates);
      if (!coords) {
        continue; // Pas de coordonnées
      }
      if (coords.level !== 0) {
        continue; // Sous-terrain — à traiter ultérieurement avec les sous-cartes
      }

      if (!mapBuckets[mapId]) {
        mapBuckets[mapId] = [];
      }

      mapBuckets[mapId].push({
        type: "pnj",
        name: npc.name,
        gameX: coords.gameX,
        gameY: coords.gameY,
        description: npc.locationPrecision || "",
        wikiUrl: "",
      });
      total++;
    }
  }
  console.log(`  PNJ traités : ${total} ajoutables, ${skipped} ignorés (zones hors périmètre)`);
}

// ─── Import Monstres ──────────────────────────────────────────────────────────

/**
 * Format bestiary Gobeline :
 *   { name, location: [zone, ...], coordinates: ["x.y.level", ...], drops, exp, gold }
 * On calcule le centroïde de tous les points de surface (level=0) par zone.
 */
function processBestiary(bestiary, mapBuckets) {
  let total = 0;

  for (const monster of bestiary) {
    const zones = Array.isArray(monster.location) ? monster.location : [monster.location];
    const allCoords = Array.isArray(monster.coordinates) ? monster.coordinates : [];

    // Filtrer les coordonnées de surface (level=0)
    const surfaceCoords = allCoords
      .map(parseCoords)
      .filter((c) => c !== null && c.level === 0);

    if (surfaceCoords.length === 0) {
      continue; // Aucun spawn en surface → pas de POI principal
    }

    // Centroïde de tous les spawns de surface
    const avgX = Math.round(surfaceCoords.reduce((s, c) => s + c.gameX, 0) / surfaceCoords.length);
    const avgY = Math.round(surfaceCoords.reduce((s, c) => s + c.gameY, 0) / surfaceCoords.length);

    for (const zone of zones) {
      if (SKIP_ZONES.has(zone)) {
        continue;
      }
      const mapId = ZONE_TO_MAP[zone];
      if (!mapId) {
        continue;
      }
      if (!mapBuckets[mapId]) {
        mapBuckets[mapId] = [];
      }
      mapBuckets[mapId].push({
        type: "monstres",
        name: monster.name,
        gameX: avgX,
        gameY: avgY,
        description: `${surfaceCoords.length} point(s) de spawn`,
        wikiUrl: "",
      });
      total++;
    }
  }
  console.log(`  Monstres traités : ${total} ajoutables`);
}

// ─── Fusion dans les JSON ─────────────────────────────────────────────────────

function mergeIntoMaps(mapBuckets) {
  const stats = {};

  for (const [mapId, newPois] of Object.entries(mapBuckets)) {
    const loaded = loadMap(mapId);
    if (!loaded) {
      console.warn(`  ⚠ Carte "${mapId}" non trouvée, POI ignorés.`);
      continue;
    }

    const existing = loaded.data.map.pois || [];
    let added = 0;
    let dup = 0;

    for (const poi of newPois) {
      if (isDuplicate(existing, poi.name, poi.type)) {
        dup++;
      } else {
        existing.push(poi);
        added++;
      }
    }

    loaded.data.map.pois = existing;
    saveMap(loaded.file, loaded.data);
    stats[mapId] = { added, dup };
    console.log(`  ${mapId}: +${added} POI ajoutés, ${dup} doublons ignorés`);
  }

  return stats;
}

// ─── Rapport de zones inconnues ───────────────────────────────────────────────

function reportUnknownZones(npcs) {
  const unknown = new Set();
  for (const npc of npcs) {
    const zones = Array.isArray(npc.zone) ? npc.zone : [npc.zone];
    for (const z of zones) {
      if (!ZONE_TO_MAP[z] && !SKIP_ZONES.has(z)) {
        unknown.add(z);
      }
    }
  }
  if (unknown.size > 0) {
    console.log(`\n  Zones non mappées (à traiter manuellement) :`);
    for (const z of [...unknown].sort()) {
      console.log(`    - "${z}"`);
    }
  }
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

async function main() {
  console.log("=== Import POI depuis Gobeline Dev ===\n");
  const mapBuckets = {};

  // ── PNJ
  console.log("► Téléchargement npcs.json...");
  try {
    const npcs = await fetchJson(`${GOBELINE_BASE}/npcs.json`);
    console.log(`  ${npcs.length} PNJ trouvés`);
    reportUnknownZones(npcs);
    processNpcs(npcs, mapBuckets);
  } catch (e) {
    console.error(`  Erreur npcs.json : ${e.message}`);
  }

  // ── Monstres (bestiary)
  console.log("\n► Téléchargement bestiary.json...");
  try {
    const bestiary = await fetchJson(`${GOBELINE_BASE}/bestiary.json`);
    console.log(`  ${bestiary.length} entrées bestiary trouvées`);
    processBestiary(bestiary, mapBuckets);
  } catch (e) {
    console.error(`  Erreur bestiary.json : ${e.message}`);
  }

  // ── Fusion
  console.log("\n► Fusion dans les fichiers JSON de cartes...");
  mergeIntoMaps(mapBuckets);

  console.log("\n✓ Import terminé.");
}

main().catch((e) => {
  console.error("Erreur fatale :", e);
  process.exit(1);
});
