/**
 * Génère le CHANGELOG.md depuis les commits conventionnels (git log)
 * Usage: node scripts/changelog.mjs
 *
 * IMPORTANT : Les messages de commits DOIVENT être rédigés en français.
 * Format attendu : <type>[(<scope>)]: <sujet en français>
 * Exemples :
 *   feat: ajouter le système de favoris
 *   fix(carte): corriger l'affichage des badges de calibration
 *   chore: mettre à jour les dépendances
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { version } = require("../package.json");
const outputPath = path.resolve(__dirname, "..", "CHANGELOG.md");

const TYPES = {
  feat: "Nouveautés",
  fix: "Corrections",
  perf: "Performance",
  refactor: "Refactorisation",
  docs: "Documentation",
  test: "Tests",
  chore: "Maintenance",
  style: "Style",
};

function getCommits(fromTag) {
  const range = fromTag ? `${fromTag}..HEAD` : "HEAD";
  try {
    const log = execSync(
      `git log ${range} --pretty=format:"%s" --no-merges`,
      { encoding: "utf-8" }
    ).trim();
    return log ? log.split("\n") : [];
  } catch {
    return [];
  }
}

function getLatestTag() {
  try {
    const tag = execSync("git describe --tags --abbrev=0", { encoding: "utf-8" }).trim();
    // Si le tag pointe exactement sur HEAD (cas "npm version" vient d'être exécuté),
    // on cherche le tag précédent pour avoir une plage de commits non vide.
    const tagCommit = execSync(`git rev-list -n 1 "${tag}"`, { encoding: "utf-8" }).trim();
    const headCommit = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
    if (tagCommit === headCommit) {
      try {
        return execSync(`git describe --tags --abbrev=0 "${tag}^"`, { encoding: "utf-8" }).trim();
      } catch {
        return null; // pas de tag précédent → prend tous les commits
      }
    }
    return tag;
  } catch {
    return null;
  }
}

function parseCommit(msg) {
  const match = msg.match(/^(\w+)(?:\(([^)]+)\))?!?: (.+)/);
  if (!match) return null;
  return { type: match[1], scope: match[2] || null, subject: match[3] };
}

function buildChangelog() {
  const latestTag = getLatestTag();
  const commits = getCommits(latestTag);
  const parsed = commits.map(parseCommit).filter(Boolean);

  if (!parsed.length) {
    console.log("Aucun commit conventionnel trouvé depuis le dernier tag.");
    return;
  }

  const grouped = {};
  for (const c of parsed) {
    if (!TYPES[c.type]) continue;
    if (!grouped[c.type]) grouped[c.type] = [];
    grouped[c.type].push(c);
  }

  const date = new Date().toISOString().split("T")[0];
  let content = `## [${version}] — ${date}\n\n`;

  for (const [type, label] of Object.entries(TYPES)) {
    if (!grouped[type]?.length) continue;
    content += `### ${label}\n\n`;
    for (const c of grouped[type]) {
      const scope = c.scope ? `**${c.scope}**: ` : "";
      content += `- ${scope}${c.subject}\n`;
    }
    content += "\n";
  }

  let existing = "";
  if (fs.existsSync(outputPath)) {
    existing = fs.readFileSync(outputPath, "utf-8");
    // Évite les doublons si la version existe déjà
    if (existing.includes(`## [${version}]`)) {
      console.log(`CHANGELOG.md déjà à jour pour v${version}.`);
      return;
    }
  }

  fs.writeFileSync(outputPath, content + existing, "utf-8");
  console.log(`CHANGELOG.md mis à jour pour v${version} : ${outputPath}`);
}

buildChangelog();
