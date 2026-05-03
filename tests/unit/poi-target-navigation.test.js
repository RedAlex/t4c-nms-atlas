import { beforeEach, describe, expect, it } from "vitest";
import state, { updateState } from "../../js/modules/state.js";
import { resolvePoiTargetLocation } from "../../js/modules/poi-renderer.js";

describe("resolvePoiTargetLocation", () => {
  beforeEach(() => {
    updateState("maps", [
      {
        id: "arakas",
        pois: [{ id: "entry-map", type: "transition", targetMapId: "drake-island", targetPoiId: "di-entry" }],
        subMaps: [
          {
            id: "arakas-cave",
            pois: [{ id: "cave-exit", type: "transition", targetMapId: "arakas", targetPoiId: "entry-map" }],
          },
        ],
      },
      {
        id: "drake-island",
        pois: [{ id: "di-entry", type: "lieux", name: "Entrée DI" }],
        subMaps: [{ id: "di-dungeon", pois: [{ id: "di-boss", type: "monstres" }] }],
      },
    ]);
    updateState("activeMap", state.maps[0]);
  });

  it("résout targetMapId + targetPoiId vers un POI de carte", () => {
    const poi = { type: "portal", targetMapId: "drake-island", targetPoiId: "di-entry" };
    const target = resolvePoiTargetLocation(poi);
    expect(target).not.toBeNull();
    expect(target.mapId).toBe("drake-island");
    expect(target.subMapId).toBeNull();
    expect(target.targetPoi.id).toBe("di-entry");
  });

  it("résout targetMapId + targetPoiId vers un POI de sous-carte", () => {
    const poi = { type: "transition", targetMapId: "drake-island", targetPoiId: "di-boss" };
    const target = resolvePoiTargetLocation(poi);
    expect(target).not.toBeNull();
    expect(target.mapId).toBe("drake-island");
    expect(target.subMapId).toBe("di-dungeon");
    expect(target.targetPoi.id).toBe("di-boss");
  });

  it("résout openSubMapId + targetPoiId vers la sous-carte de la carte active", () => {
    const poi = { type: "transition", openSubMapId: "arakas-cave", targetPoiId: "cave-exit" };
    const target = resolvePoiTargetLocation(poi);
    expect(target).not.toBeNull();
    expect(target.mapId).toBe("arakas");
    expect(target.subMapId).toBe("arakas-cave");
    expect(target.targetPoi.id).toBe("cave-exit");
  });

  it("fallback: retrouve la cible globalement même sans targetMapId/openSubMapId", () => {
    const poi = { type: "lien", targetPoiId: "di-entry" };
    const target = resolvePoiTargetLocation(poi);
    expect(target).not.toBeNull();
    expect(target.mapId).toBe("drake-island");
  });

  it("retourne null si targetPoiId absent", () => {
    const target = resolvePoiTargetLocation({ type: "transition", targetMapId: "drake-island" });
    expect(target).toBeNull();
  });

  it("retourne null si la cible est introuvable", () => {
    const target = resolvePoiTargetLocation({ type: "transition", targetMapId: "drake-island", targetPoiId: "ghost" });
    expect(target).toBeNull();
  });
});
