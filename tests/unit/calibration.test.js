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
