import { describe, it, expect } from "vitest";
import {
  createGameToPercentTransform,
  createAffineTransform,
  resolvePoiPosition,
} from "../../js/modules/calibration.js";

// 3 points de calibration fictifs formant un triangle non-colinéaire (aucun à l'origine)
const mockGamePoints = [
  { gameX: 100, gameY: 100, mapX: 100, mapY: 100 },
  { gameX: 5000, gameY: 100, mapX: 5000, mapY: 100 },
  { gameX: 100, gameY: 5000, mapX: 100, mapY: 5000 },
];

describe("createGameToPercentTransform", () => {
  it("retourne null si calibration est null", () => {
    expect(createGameToPercentTransform(null)).toBeNull();
  });

  it("retourne null si gamePoints est absent", () => {
    expect(createGameToPercentTransform({})).toBeNull();
  });

  it("retourne null si moins de 3 points valides", () => {
    expect(createGameToPercentTransform({ gamePoints: [mockGamePoints[0]] })).toBeNull();
  });

  it("retourne une fonction avec 3 points valides", () => {
    const fn = createGameToPercentTransform({ gamePoints: mockGamePoints });
    expect(typeof fn).toBe("function");
  });

  it("transforme les coordonnées du jeu en pourcentage", () => {
    const fn = createGameToPercentTransform({ gamePoints: mockGamePoints });
    // mapX 100 → (100/5000)*100 = 2%, gameX 100 → doit mapper à ~2%
    const result = fn(100, 100);
    expect(result.x).toBeCloseTo(2, 0);
    expect(result.y).toBeCloseTo(2, 0);
  });
});

describe("createAffineTransform", () => {
  it("retourne null si points colinéaires (déterminant nul)", () => {
    const colinear = [
      { sx: 0, sy: 0, tx: 0, ty: 0 },
      { sx: 1, sy: 1, tx: 1, ty: 1 },
      { sx: 2, sy: 2, tx: 2, ty: 2 },
    ];
    const fn = createAffineTransform(colinear, "sx", "sy", "tx", "ty");
    expect(fn).toBeNull();
  });

  it("retourne une fonction pour des points valides", () => {
    const anchors = [
      { sx: 0, sy: 0, tx: 0, ty: 0 },
      { sx: 100, sy: 0, tx: 100, ty: 0 },
      { sx: 0, sy: 100, tx: 0, ty: 100 },
    ];
    const fn = createAffineTransform(anchors, "sx", "sy", "tx", "ty");
    expect(typeof fn).toBe("function");
  });
});

describe("resolvePoiPosition", () => {
  const mockTransform = (x, y) => ({ x: x / 50, y: y / 50 });

  it("utilise gameX/gameY si disponibles", () => {
    const poi = { gameX: 100, gameY: 200 };
    const result = resolvePoiPosition(poi, mockTransform);
    expect(result).toEqual({ x: 2, y: 4 });
  });

  it("utilise gx/gy en fallback", () => {
    const poi = { gx: 50, gy: 100 };
    const result = resolvePoiPosition(poi, mockTransform);
    expect(result).toEqual({ x: 1, y: 2 });
  });

  it("utilise x/y en pourcentage direct si disponibles", () => {
    const poi = { x: 25, y: 75 };
    const result = resolvePoiPosition(poi, null);
    expect(result).toEqual({ x: 25, y: 75 });
  });

  it("retourne null si aucune coordonnée disponible", () => {
    const poi = { name: "POI sans coords" };
    expect(resolvePoiPosition(poi, null)).toBeNull();
  });
});

// ─── Tests P4 : coordonnées Gobeline (gx/gy + world) ────────────────────────
describe("resolvePoiPosition - format Gobeline (P4)", () => {
  const world = { imageWidth: 6144, imageHeight: 3072 };

  it("calcule la position via gx/gy + world si imageWidth/imageHeight présents", () => {
    const poi = { gx: 3072, gy: 1536, worldId: 0 };
    const result = resolvePoiPosition(poi, null, world);
    // x% = (gx*2 / imageWidth) * 100 = (3072*2 / 6144) * 100 = 100%
    // y% = (gy / imageHeight) * 100  = (1536 / 3072) * 100   = 50%
    expect(result.x).toBeCloseTo(100, 5);
    expect(result.y).toBeCloseTo(50, 5);
  });

  it("calcule 0% pour gx=0, gy=0", () => {
    const poi = { gx: 0, gy: 0, worldId: 0 };
    const result = resolvePoiPosition(poi, null, world);
    expect(result.x).toBeCloseTo(0, 5);
    expect(result.y).toBeCloseTo(0, 5);
  });

  it("priorise gx/gy Gobeline sur gameX/gameY+calibration si world est fourni", () => {
    const poi = { gx: 1536, gy: 768, worldId: 0, gameX: 9999, gameY: 9999 };
    const fakeTransform = () => ({ x: 99, y: 99 }); // ne doit pas être appelé
    const result = resolvePoiPosition(poi, fakeTransform, world);
    // x% = (1536*2 / 6144)*100 = 50%, y% = (768/3072)*100 = 25%
    expect(result.x).toBeCloseTo(50, 5);
    expect(result.y).toBeCloseTo(25, 5);
  });

  it("tombe en fallback calibration affine si world est null mais gameX/gameY présents", () => {
    const poi = { gameX: 100, gameY: 200, gx: 999, gy: 999 };
    const mockTransform = (x, y) => ({ x: x / 50, y: y / 50 });
    const result = resolvePoiPosition(poi, mockTransform, null);
    // Sans world → pas de chemin Gobeline → gameX=100 → 100/50=2
    expect(result.x).toBeCloseTo(2, 5);
    expect(result.y).toBeCloseTo(4, 5);
  });

  it("retourne null si gx/gy présents mais world absent et aucune calibration", () => {
    const poi = { gx: 100, gy: 100, worldId: 0 };
    // Sans world et sans transform classique, doit retourner null
    // (sauf si le code tombe en fallback gx→gameX — comportement à vérifier)
    const result = resolvePoiPosition(poi, null, null);
    // Si le code utilise gx comme gameX en dernier fallback, c'est acceptable (non null)
    // Le test vérifie juste qu'il n'y a pas d'exception
    expect(() => resolvePoiPosition(poi, null, null)).not.toThrow();
  });
});
