import { describe, it, expect } from "vitest";
import {
  normalizeUrlCandidate,
  buildWikiSearchUrl,
  normalizeSearchText,
  fuzzyMatchText,
  getDisplayedImageRect,
  percentToDisplayCoords,
} from "../../js/modules/utils.js";

describe("normalizeUrlCandidate", () => {
  it("retourne null pour une valeur non-string", () => {
    expect(normalizeUrlCandidate(null)).toBeNull();
    expect(normalizeUrlCandidate(42)).toBeNull();
    expect(normalizeUrlCandidate({})).toBeNull();
  });

  it("retourne null pour une chaîne vide", () => {
    expect(normalizeUrlCandidate("")).toBeNull();
    expect(normalizeUrlCandidate("   ")).toBeNull();
  });

  it("retourne null pour un protocole non autorisé", () => {
    expect(normalizeUrlCandidate("ftp://example.com")).toBeNull();
    expect(normalizeUrlCandidate("javascript:alert(1)")).toBeNull();
  });

  it("retourne l'URL normalisée pour http", () => {
    expect(normalizeUrlCandidate("http://example.com")).toBe("http://example.com/");
  });

  it("retourne l'URL normalisée pour https", () => {
    expect(normalizeUrlCandidate("https://t4c.fandom.com/fr/wiki/")).toBe(
      "https://t4c.fandom.com/fr/wiki/"
    );
  });

  it("retourne null pour une URL invalide", () => {
    expect(normalizeUrlCandidate("pas-une-url")).toBeNull();
  });
});

describe("buildWikiSearchUrl", () => {
  it("retourne null pour une valeur non-string", () => {
    expect(buildWikiSearchUrl(null)).toBeNull();
  });

  it("retourne null pour une chaîne vide", () => {
    expect(buildWikiSearchUrl("")).toBeNull();
    expect(buildWikiSearchUrl("   ")).toBeNull();
  });

  it("construit une URL de recherche encodée", () => {
    const url = buildWikiSearchUrl("Arakas");
    expect(url).toContain("t4c.fandom.com");
    expect(url).toContain("Arakas");
  });

  it("encode les caractères spéciaux", () => {
    const url = buildWikiSearchUrl("Le Château du Roi");
    expect(url).toContain(encodeURIComponent("Le Château du Roi"));
  });
});

describe("getDisplayedImageRect", () => {
  it("retourne dimensions du conteneur si image invalide", () => {
    const rect = getDisplayedImageRect(800, 600, 0, 0);
    expect(rect).toEqual({ left: 0, top: 0, width: 800, height: 600 });
  });

  it("calcule correctement le ratio pour une image plus large", () => {
    // Image 1000x500 dans conteneur 800x600 → scale = 0.8 (limité par width)
    const rect = getDisplayedImageRect(800, 600, 1000, 500);
    expect(rect.width).toBeCloseTo(800);
    expect(rect.height).toBeCloseTo(400);
    expect(rect.left).toBeCloseTo(0);
    expect(rect.top).toBeCloseTo(100); // (600-400)/2
  });

  it("calcule correctement le ratio pour une image plus haute", () => {
    // Image 500x1000 dans conteneur 800x600 → scale = 0.6 (limité par height)
    const rect = getDisplayedImageRect(800, 600, 500, 1000);
    expect(rect.width).toBeCloseTo(300);
    expect(rect.height).toBeCloseTo(600);
    expect(rect.left).toBeCloseTo(250); // (800-300)/2
    expect(rect.top).toBeCloseTo(0);
  });
});

describe("percentToDisplayCoords", () => {
  it("convertit 50% en coordonnée 2500", () => {
    const coords = percentToDisplayCoords({ x: 50, y: 50 });
    expect(coords.x).toBe(2500);
    expect(coords.y).toBe(2500);
  });

  it("convertit 0% en 0", () => {
    const coords = percentToDisplayCoords({ x: 0, y: 0 });
    expect(coords.x).toBe(0);
    expect(coords.y).toBe(0);
  });

  it("convertit 100% en 5000", () => {
    const coords = percentToDisplayCoords({ x: 100, y: 100 });
    expect(coords.x).toBe(5000);
    expect(coords.y).toBe(5000);
  });
});

describe("normalizeSearchText", () => {
  it("retourne une chaine vide pour une valeur non string", () => {
    expect(normalizeSearchText(null)).toBe("");
    expect(normalizeSearchText(12)).toBe("");
  });

  it("retire les accents et normalise les espaces", () => {
    expect(normalizeSearchText("  Templé   du   Späwn ")).toBe("temple du spawn");
  });
});

describe("fuzzyMatchText", () => {
  it("match en mode includes", () => {
    expect(fuzzyMatchText("Temple du spawn", "spawn")).toBe(true);
  });

  it("match en mode fuzzy subsequence", () => {
    expect(fuzzyMatchText("marchand general", "mrg")).toBe(true);
  });

  it("retourne false si la recherche ne match pas", () => {
    expect(fuzzyMatchText("forgeron", "xyz")).toBe(false);
  });

  it("retourne true si query vide", () => {
    expect(fuzzyMatchText("forgeron", "")).toBe(true);
  });
});
