/**
 * Script de verification des mises a jour du wiki et du site officiel.
 *
 * Utilisation :
 *   node scripts/check-updates.cjs
 *
 * Pour chaque carte dans data/maps.json, ce script effectue des requetes HEAD
 * sur les URLs definies dans `_meta.checkUrls` et compare le header
 * `Last-Modified` ou `ETag` avec la valeur stockee dans maps.json.
 *
 * Si un changement est detecte, le rapport liste les cartes a verifier manuellement.
 * Quand aucun changement n'est detecte, les dates sont mises a jour dans maps.json.
 *
 * Automatisation : planifier ce script via une tache cron ou une GitHub Action.
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const mapsPath = path.resolve(__dirname, "..", "data", "maps.json");
const data = JSON.parse(fs.readFileSync(mapsPath, "utf-8"));
const today = new Date().toISOString().slice(0, 10);

const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

async function main() {
  console.log(`\n${BOLD}=== Verification des mises a jour NMS Revolution ===${RESET}`);
  console.log(`Date du rapport : ${today}\n`);

  const updates = [];
  let unchanged = 0;
  let errors = 0;

  for (const map of data.maps) {
    const meta = map._meta;
    if (!meta?.checkUrls?.length) {
      continue;
    }

    console.log(`${CYAN}[${map.name}]${RESET} Verification de ${meta.checkUrls.length} source(s)...`);

    for (const url of meta.checkUrls) {
      let result;

      try {
        result = await headRequest(url);
      } catch (err) {
        console.log(`  ${YELLOW}⚠ Inaccessible${RESET} : ${url} (${err.message})`);
        errors++;
        continue;
      }

      const newLastModified = result.headers["last-modified"] || null;
      const newEtag = result.headers["etag"] || null;

      const changed =
        (newLastModified && newLastModified !== meta.lastModified) ||
        (newEtag && newEtag !== meta.etag);

      const firstCheck = !meta.lastModified && !meta.etag;

      if (firstCheck) {
        console.log(`  ${GREEN}✓ Premiere verification enregistree${RESET} : ${url}`);
        meta.lastModified = newLastModified;
        meta.etag = newEtag;
        meta.checkedAt = today;
      } else if (changed) {
        console.log(`  ${RED}✗ CHANGEMENT DETECTE${RESET} : ${url}`);
        if (newLastModified) {
          console.log(`    Ancienne date : ${meta.lastModified}`);
          console.log(`    Nouvelle date : ${newLastModified}`);
        }
        updates.push({ map: map.name, url, newLastModified, newEtag });
        meta.lastModified = newLastModified;
        meta.etag = newEtag;
        meta.checkedAt = today;
      } else {
        console.log(`  ${GREEN}✓ Aucun changement${RESET} : ${url}`);
        meta.checkedAt = today;
        unchanged++;
      }
    }
  }

  fs.writeFileSync(mapsPath, JSON.stringify(data, null, 2), "utf-8");

  console.log(`\n${BOLD}=== Rapport final ===${RESET}`);
  console.log(`Sources inchangees : ${unchanged}`);
  console.log(`Erreurs reseau     : ${errors}`);

  if (updates.length > 0) {
    console.log(`\n${RED}${BOLD}Sources modifiees (${updates.length}) — verifier manuellement :${RESET}`);
    for (const u of updates) {
      console.log(`  • ${u.map} — ${u.url}`);
      if (u.newLastModified) {
        console.log(`    Derniere modification : ${u.newLastModified}`);
      }
    }
    process.exit(2);
  } else {
    console.log(`\n${GREEN}Tout est a jour.${RESET}`);
    process.exit(0);
  }
}

function headRequest(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const timeout = 10_000;

    const req = lib.request(url, { method: "HEAD", timeout }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        headRequest(res.headers.location).then(resolve).catch(reject);
        return;
      }
      resolve({ status: res.statusCode, headers: res.headers });
    });

    req.on("timeout", () => {
      req.destroy(new Error("Timeout"));
    });

    req.on("error", reject);
    req.end();
  });
}

main().catch((err) => {
  console.error("Erreur inattendue :", err);
  process.exit(1);
});
