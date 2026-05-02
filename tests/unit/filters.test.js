import { describe, it, expect, beforeEach } from "vitest";
import {
  toggleFilter,
  toggleSubmapFilter,
  togglePoiTitles,
  toggleSubmapPoiTitles,
  toggleGridCoords,
  toggleSubmapGridCoords,
  updateFilterButtons,
  updateSubmapFilterButtons,
  updateFilterDisplay,
} from "../../js/modules/filters.js";
import state, { updateState } from "../../js/modules/state.js";

function addEl(id, tag = "div") {
  const el = document.createElement(tag);
  el.id = id;
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = "";
  updateState("activeFilter", "lieux");
  updateState("activeSubmapFilter", "lieux");
  updateState("showPoiTitles", true);
  updateState("showSubmapPoiTitles", true);
  updateState("showGridCoords", false);
  updateState("showSubmapGridCoords", false);
});

describe("toggleFilter", () => {
  it("met a jour activeFilter", () => {
    toggleFilter("pnj");
    expect(state.activeFilter).toBe("pnj");
  });
  it("met a jour activeFilter a monstres", () => {
    toggleFilter("monstres");
    expect(state.activeFilter).toBe("monstres");
  });
  it("revient a lieux", () => {
    toggleFilter("pnj");
    toggleFilter("lieux");
    expect(state.activeFilter).toBe("lieux");
  });
});

describe("toggleFilter + updateFilterButtons", () => {
  it("marque le bouton actif avec la classe active", () => {
    const btn = addEl("filter-pnj", "button");
    addEl("filter-lieux", "button");
    addEl("filter-monstres", "button");
    toggleFilter("pnj");
    expect(btn.classList.contains("active")).toBe(true);
  });
  it("retire la classe active des autres boutons", () => {
    const lieux = addEl("filter-lieux", "button");
    const pnj = addEl("filter-pnj", "button");
    addEl("filter-monstres", "button");
    toggleFilter("lieux");
    expect(lieux.classList.contains("active")).toBe(true);
    expect(pnj.classList.contains("active")).toBe(false);
    toggleFilter("pnj");
    expect(lieux.classList.contains("active")).toBe(false);
    expect(pnj.classList.contains("active")).toBe(true);
  });
});

describe("toggleSubmapFilter", () => {
  it("met a jour activeSubmapFilter", () => {
    toggleSubmapFilter("monstres");
    expect(state.activeSubmapFilter).toBe("monstres");
  });
  it("marque le bouton sous-carte actif", () => {
    const btn = addEl("submap-filter-monstres", "button");
    addEl("submap-filter-lieux", "button");
    addEl("submap-filter-pnj", "button");
    toggleSubmapFilter("monstres");
    expect(btn.classList.contains("active")).toBe(true);
  });
});

describe("updateFilterDisplay", () => {
  it("affiche map-img-source si filtre lieux", () => {
    const el = addEl("map-img-source");
    el.style.display = "none";
    updateState("activeFilter", "lieux");
    updateFilterDisplay();
    expect(el.style.display).toBe("");
  });
  it("cache map-img-source si filtre pnj", () => {
    const el = addEl("map-img-source");
    updateState("activeFilter", "pnj");
    updateFilterDisplay();
    expect(el.style.display).toBe("none");
  });
  it("ne plante pas si element absent", () => {
    expect(() => updateFilterDisplay()).not.toThrow();
  });
});

describe("togglePoiTitles", () => {
  it("bascule showPoiTitles de true a false", () => {
    const btn = addEl("toggle-poi-titles", "button");
    btn.textContent = "Titres ON";
    togglePoiTitles();
    expect(btn.textContent).toBe("Titres OFF");
    expect(btn.classList.contains("active")).toBe(false);
    expect(state.showPoiTitles).toBe(false);
  });
  it("bascule showPoiTitles de false a true", () => {
    updateState("showPoiTitles", false);
    const btn = addEl("toggle-poi-titles", "button");
    togglePoiTitles();
    expect(btn.textContent).toBe("Titres ON");
    expect(btn.classList.contains("active")).toBe(true);
    expect(state.showPoiTitles).toBe(true);
  });
  it("ne plante pas si bouton absent", () => {
    expect(() => togglePoiTitles()).not.toThrow();
  });
});

describe("toggleSubmapPoiTitles", () => {
  it("bascule showSubmapPoiTitles de true a false", () => {
    const btn = addEl("submap-toggle-poi-titles", "button");
    btn.textContent = "Titres ON";
    toggleSubmapPoiTitles();
    expect(btn.textContent).toBe("Titres OFF");
    expect(state.showSubmapPoiTitles).toBe(false);
  });
  it("ne plante pas si bouton absent", () => {
    expect(() => toggleSubmapPoiTitles()).not.toThrow();
  });
});

describe("toggleGridCoords", () => {
  it("bascule showGridCoords de false a true", () => {
    const btn = addEl("toggle-grid-coords", "button");
    toggleGridCoords();
    expect(btn.textContent).toBe("Calibration ON");
    expect(btn.classList.contains("active")).toBe(true);
    expect(state.showGridCoords).toBe(true);
  });
  it("cache map-dev-coords quand on desactive", () => {
    updateState("showGridCoords", true);
    addEl("toggle-grid-coords", "button");
    const coords = addEl("map-dev-coords");
    coords.classList.remove("hidden");
    toggleGridCoords();
    expect(coords.classList.contains("hidden")).toBe(true);
  });
  it("ne plante pas si bouton absent", () => {
    expect(() => toggleGridCoords()).not.toThrow();
  });
});

describe("toggleSubmapGridCoords", () => {
  it("bascule showSubmapGridCoords de false a true", () => {
    const btn = addEl("submap-toggle-grid-coords", "button");
    toggleSubmapGridCoords();
    expect(btn.textContent).toBe("Calibration ON");
    expect(state.showSubmapGridCoords).toBe(true);
  });
  it("cache submap-dev-coords quand on desactive", () => {
    updateState("showSubmapGridCoords", true);
    addEl("submap-toggle-grid-coords", "button");
    const coords = addEl("submap-dev-coords");
    coords.classList.remove("hidden");
    toggleSubmapGridCoords();
    expect(coords.classList.contains("hidden")).toBe(true);
  });
  it("ne plante pas si bouton absent", () => {
    expect(() => toggleSubmapGridCoords()).not.toThrow();
  });
});

describe("updateFilterButtons sans DOM", () => {
  it("ne plante pas si boutons absents", () => {
    expect(() => updateFilterButtons()).not.toThrow();
  });
});

describe("updateSubmapFilterButtons sans DOM", () => {
  it("ne plante pas si boutons absents", () => {
    expect(() => updateSubmapFilterButtons()).not.toThrow();
  });
});