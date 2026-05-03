#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateData } from "../js/modules/validator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function asPosix(input) {
  return input.replaceAll("\\", "/");
}

async function readJson(relativePath) {
  const absolutePath = path.resolve(repoRoot, relativePath);
  const raw = await readFile(absolutePath, "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}

async function fileExists(relativePath) {
  try {
    await access(path.resolve(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

function isLocalAssetPath(assetPath) {
  if (typeof assetPath !== "string" || !assetPath.trim()) {
    return false;
  }
  const value = assetPath.trim();
  return !/^https?:\/\//i.test(value) && !/^data:/i.test(value);
}

function collectLocalAssets(map) {
  const required = [];
  const optional = [];

  if (isLocalAssetPath(map.image)) {
    required.push({ path: map.image, label: "map.image" });
  }
  if (isLocalAssetPath(map.hdImage)) {
    required.push({ path: map.hdImage, label: "map.hdImage" });
  }

  [
    { path: map.nmsImage, label: "map.nmsImage" },
    { path: map.abetsicImage, label: "map.abetsicImage" },
  ].forEach((asset) => {
    if (isLocalAssetPath(asset.path)) {
      optional.push(asset);
    }
  });

  (map.subMaps || []).forEach((subMap) => {
    if (isLocalAssetPath(subMap.image)) {
      optional.push({ path: subMap.image, label: `subMap(${subMap.id || "unknown"}).image` });
    }
  });

  return { required, optional };
}

async function main() {
  const errors = [];
  const warnings = [];

  let mapsIndex;
  try {
    mapsIndex = await readJson("data/maps.json");
  } catch (error) {
    console.error(`[data-lint] Impossible de lire data/maps.json: ${error.message}`);
    process.exit(1);
  }

  const mapFiles = Array.isArray(mapsIndex?.mapFiles) ? mapsIndex.mapFiles : [];
  if (mapFiles.length === 0) {
    errors.push("data/maps.json: mapFiles est vide ou absent.");
  }

  const worldsFile = mapsIndex?.worldsFile;
  let worlds = null;
  if (typeof worldsFile === "string" && worldsFile.trim()) {
    if (!(await fileExists(worldsFile))) {
      errors.push(`data/maps.json: worldsFile introuvable (${worldsFile}).`);
    } else {
      try {
        const worldsData = await readJson(worldsFile);
        worlds = Array.isArray(worldsData?.worlds) ? worldsData.worlds : null;
      } catch (error) {
        errors.push(`${worldsFile}: JSON invalide (${error.message}).`);
      }
    }
  }

  const maps = [];
  for (const relativeMapFile of mapFiles) {
    const normalizedPath = asPosix(relativeMapFile);
    if (!(await fileExists(normalizedPath))) {
      errors.push(`Fichier carte manquant: ${normalizedPath}`);
      continue;
    }

    try {
      const mapData = await readJson(normalizedPath);
      if (!mapData?.map || typeof mapData.map !== "object") {
        errors.push(`${normalizedPath}: propriété map manquante.`);
        continue;
      }

      const map = mapData.map;
      map._sourceFile = normalizedPath;
      maps.push(map);

      const localAssets = collectLocalAssets(map);
      for (const asset of localAssets.required) {
        const normalizedAsset = asPosix(asset.path);
        if (!(await fileExists(normalizedAsset))) {
          errors.push(
            `${normalizedPath}: asset requis introuvable ${asset.label} (${normalizedAsset}).`
          );
        }
      }
      for (const asset of localAssets.optional) {
        const normalizedAsset = asPosix(asset.path);
        if (!(await fileExists(normalizedAsset))) {
          warnings.push(
            `${normalizedPath}: asset optionnel introuvable ${asset.label} (${normalizedAsset}).`
          );
        }
      }
    } catch (error) {
      errors.push(`${normalizedPath}: JSON invalide (${error.message}).`);
    }
  }

  const mapIds = maps.map((map) => map.id).filter(Boolean);
  const duplicateMapIds = mapIds.filter((id, index) => mapIds.indexOf(id) !== index);
  if (duplicateMapIds.length > 0) {
    errors.push(`IDs de carte dupliqués: ${Array.from(new Set(duplicateMapIds)).join(", ")}`);
  }

  if (Array.isArray(worlds)) {
    const worldIds = worlds.map((world) => world.worldId).filter((id) => typeof id === "number");
    const duplicateWorldIds = worldIds.filter((id, index) => worldIds.indexOf(id) !== index);
    if (duplicateWorldIds.length > 0) {
      errors.push(`worldId dupliqués dans worlds.json: ${Array.from(new Set(duplicateWorldIds)).join(", ")}`);
    }

    const indexMapFiles = new Set(mapFiles.map((filePath) => asPosix(filePath)));
    const mapById = new Map(maps.map((map) => [map.id, map]));

    worlds.forEach((world) => {
      const worldMapFiles = Array.isArray(world?.mapFiles) ? world.mapFiles.map((p) => asPosix(p)) : [];
      worldMapFiles.forEach((worldMapFile) => {
        if (!indexMapFiles.has(worldMapFile)) {
          errors.push(`world ${world.worldId}: mapFiles contient ${worldMapFile} absent de data/maps.json.`);
        }
      });

      const mapsForWorld = maps.filter((map) => map.worldId === world.worldId);
      if (mapsForWorld.length === 0) {
        warnings.push(`world ${world.worldId}: aucune carte chargée associée.`);
      }

      mapsForWorld.forEach((map) => {
        if (!worldMapFiles.includes(map._sourceFile)) {
          warnings.push(
            `${map.id}: présent dans data/maps.json mais absent de worlds[${world.worldId}].mapFiles.`
          );
        }
      });
    });

    mapById.forEach((map) => {
      const world = worlds.find((item) => item.worldId === map.worldId);
      if (!world) {
        errors.push(`${map.id}: worldId ${map.worldId} absent de ${worldsFile}.`);
      }
    });
  }

  const validationErrors = validateData(maps, worlds);
  errors.push(...validationErrors);

  console.log(`[data-lint] Cartes analysées: ${maps.length}`);
  if (warnings.length > 0) {
    console.warn(`[data-lint] ${warnings.length} avertissement(s):`);
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (errors.length > 0) {
    console.error(`[data-lint] ${errors.length} erreur(s) bloquante(s):`);
    errors.forEach((error) => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log("[data-lint] ✅ Cohérence cartographique valide.");
}

main().catch((error) => {
  console.error(`[data-lint] Échec inattendu: ${error.message}`);
  process.exit(1);
});
