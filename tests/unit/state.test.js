import { describe, it, expect, beforeEach } from "vitest";
import state, { updateState, getState, getAllState } from "../../js/modules/state.js";

describe("state", () => {
  beforeEach(() => {
    // Réinitialiser l'état entre les tests
    updateState("maps", []);
    updateState("activeMap", null);
    updateState("activeSubMap", null);
    updateState("activeFilter", "lieux");
    updateState("activeSubmapFilter", "lieux");
    updateState("showPoiTitles", true);
    updateState("showSubmapPoiTitles", true);
    updateState("showGridCoords", false);
    updateState("showSubmapGridCoords", false);
  });

  it("retourne la valeur initiale de activeFilter", () => {
    expect(getState("activeFilter")).toBe("lieux");
  });

  it("met à jour une valeur avec updateState", () => {
    updateState("activeFilter", "pnj");
    expect(getState("activeFilter")).toBe("pnj");
  });

  it("getAllState retourne l'objet d'état complet", () => {
    const s = getAllState();
    expect(s).toHaveProperty("maps");
    expect(s).toHaveProperty("activeMap");
    expect(s).toHaveProperty("activeFilter");
  });

  it("l'état est partagé (référence commune)", () => {
    updateState("activeFilter", "monstres");
    expect(state.activeFilter).toBe("monstres");
  });

  it("showPoiTitles est true par défaut", () => {
    expect(getState("showPoiTitles")).toBe(true);
  });

  it("showGridCoords est false par défaut", () => {
    expect(getState("showGridCoords")).toBe(false);
  });

  it("maps est un tableau vide par défaut", () => {
    expect(getState("maps")).toEqual([]);
  });
});
