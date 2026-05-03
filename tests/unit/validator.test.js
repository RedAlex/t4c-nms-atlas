import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateData } from "../../js/modules/validator.js";

describe("validateData", () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("ne produit aucun avertissement pour des données valides", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [
          { type: "lieux", name: "LightHaven", gx: 2850, gy: 1080 },
          { type: "portal", name: "Portail", gx: 2500, gy: 500, targetMapId: "drake-island" },
        ],
        subMaps: [
          {
            id: "lighthaven",
            name: "LightHaven",
            image: "data/images/lighthaven.jpg",
            pois: [{ type: "lieux", name: "Entrée", x: 50, y: 48 }],
          },
        ],
      },
      { id: "drake-island", name: "Drake Island", worldId: 3, pois: [], subMaps: [] },
    ];
    const errors = validateData(maps, null);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errors).toHaveLength(0);
  });

  it("retourne un tableau vide si maps est vide", () => {
    const errors = validateData([], null);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errors).toEqual([]);
  });

  it("retourne un tableau vide si maps est null", () => {
    const errors = validateData(null, null);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errors).toEqual([]);
  });

  it("signale un POI sans coordonnées", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [{ type: "lieux", name: "Sans coords" }],
        subMaps: [],
      },
    ];
    validateData(maps, null);
    expect(warnSpy).toHaveBeenCalled();
    const messages = warnSpy.mock.calls.flat().join(" ");
    expect(messages).toContain("aucune coordonnée");
  });

  it("signale un POI avec type invalide", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [{ type: "inconnu", name: "POI", gx: 100, gy: 100 }],
        subMaps: [],
      },
    ];
    validateData(maps, null);
    expect(warnSpy).toHaveBeenCalled();
    const messages = warnSpy.mock.calls.flat().join(" ");
    expect(messages).toContain("type invalide");
  });

  it("signale un portail avec targetMapId inexistant", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [{ type: "portal", name: "Portail cassé", gx: 100, gy: 100, targetMapId: "carte-inexistante" }],
        subMaps: [],
      },
    ];
    validateData(maps, null);
    expect(warnSpy).toHaveBeenCalled();
    const messages = warnSpy.mock.calls.flat().join(" ");
    expect(messages).toContain("targetMapId");
    expect(messages).toContain("carte-inexistante");
  });

  it("signale un portail sans targetMapId", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [{ type: "portal", name: "Portail sans cible", gx: 100, gy: 100 }],
        subMaps: [],
      },
    ];
    validateData(maps, null);
    expect(warnSpy).toHaveBeenCalled();
    const messages = warnSpy.mock.calls.flat().join(" ");
    expect(messages).toContain("portail sans targetMapId");
  });

  it("signale un openSubMapId référençant une sous-carte inexistante", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [{ type: "lieux", name: "LightHaven", gx: 2850, gy: 1080, openSubMapId: "inexistante" }],
        subMaps: [],
      },
    ];
    validateData(maps, null);
    expect(warnSpy).toHaveBeenCalled();
    const messages = warnSpy.mock.calls.flat().join(" ");
    expect(messages).toContain("openSubMapId");
    expect(messages).toContain("inexistante");
  });

  it("accepte un openSubMapId valide", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [{ type: "lieux", name: "LightHaven", gx: 2850, gy: 1080, openSubMapId: "lighthaven" }],
        subMaps: [
          { id: "lighthaven", name: "LightHaven", image: "data/lh.jpg", pois: [] },
        ],
      },
    ];
    validateData(maps, null);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("signale une carte sans worldId", () => {
    const maps = [{ id: "arakas", name: "Arakas", pois: [], subMaps: [] }];
    validateData(maps, null);
    expect(warnSpy).toHaveBeenCalled();
    const messages = warnSpy.mock.calls.flat().join(" ");
    expect(messages).toContain("worldId manquant");
  });

  it("signale un worldId absent du registre worlds", () => {
    const maps = [{ id: "arakas", name: "Arakas", worldId: 99, pois: [], subMaps: [] }];
    const worlds = [{ worldId: 0, name: "Arakas" }];
    validateData(maps, worlds);
    expect(warnSpy).toHaveBeenCalled();
    const messages = warnSpy.mock.calls.flat().join(" ");
    expect(messages).toContain("worldId 99");
  });

  it("signale une sous-carte sans image", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [],
        subMaps: [{ id: "lighthaven", name: "LightHaven", pois: [] }],
      },
    ];
    validateData(maps, null);
    expect(warnSpy).toHaveBeenCalled();
    const messages = warnSpy.mock.calls.flat().join(" ");
    expect(messages).toContain("image manquante");
  });

  // --- Type "lien" ---

  it("accepte un lien valide vers une carte existante", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [{ type: "lien", name: "Lien vers DI", gx: 100, gy: 100, targetMapId: "drake-island" }],
        subMaps: [],
      },
      { id: "drake-island", name: "Drake Island", worldId: 3, pois: [], subMaps: [] },
    ];
    const errors = validateData(maps, null);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errors).toHaveLength(0);
  });

  it("signale un lien sans targetMapId", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [{ type: "lien", name: "Lien sans cible", gx: 100, gy: 100 }],
        subMaps: [],
      },
    ];
    validateData(maps, null);
    expect(warnSpy).toHaveBeenCalled();
    const messages = warnSpy.mock.calls.flat().join(" ");
    expect(messages).toContain("lien sans targetMapId");
  });

  it("signale un lien avec targetMapId inexistant", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [{ type: "lien", name: "Lien cassé", gx: 100, gy: 100, targetMapId: "carte-fantome" }],
        subMaps: [],
      },
    ];
    validateData(maps, null);
    const messages = warnSpy.mock.calls.flat().join(" ");
    expect(messages).toContain("carte-fantome");
  });

  it("accepte un lien avec targetPoiId valide", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [
          {
            type: "lien",
            name: "Lien vers POI",
            gx: 100,
            gy: 100,
            targetMapId: "drake-island",
            targetPoiId: "poi-abysses",
          },
        ],
        subMaps: [],
      },
      {
        id: "drake-island",
        name: "Drake Island",
        worldId: 3,
        pois: [{ id: "poi-abysses", type: "lieux", name: "Les Abysses", gx: 500, gy: 500 }],
        subMaps: [],
      },
    ];
    const errors = validateData(maps, null);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errors).toHaveLength(0);
  });

  it("signale un lien avec targetPoiId introuvable dans la carte cible", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [
          {
            type: "lien",
            name: "Lien cassé",
            gx: 100,
            gy: 100,
            targetMapId: "drake-island",
            targetPoiId: "poi-inexistant",
          },
        ],
        subMaps: [],
      },
      { id: "drake-island", name: "Drake Island", worldId: 3, pois: [], subMaps: [] },
    ];
    validateData(maps, null);
    const messages = warnSpy.mock.calls.flat().join(" ");
    expect(messages).toContain("targetPoiId");
    expect(messages).toContain("poi-inexistant");
    expect(messages).toContain("drake-island");
  });

  // --- _sourceFile dans les erreurs ---

  it("inclut le chemin source dans les erreurs si _sourceFile est défini", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        _sourceFile: "data/maps/arakas.json",
        pois: [{ type: "lieux", name: "Sans coords" }],
        subMaps: [],
      },
    ];
    validateData(maps, null);
    const messages = warnSpy.mock.calls.flat().join(" ");
    expect(messages).toContain("data/maps/arakas.json");
  });

  it("retourne le tableau de toutes les erreurs détectées", () => {
    const maps = [
      {
        id: "arakas",
        name: "Arakas",
        worldId: 0,
        pois: [
          { type: "lieux", name: "Sans coords" },
          { type: "portal", name: "Portail cassé", gx: 0, gy: 0, targetMapId: "inexistant" },
        ],
        subMaps: [],
      },
    ];
    const errors = validateData(maps, null);
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});
