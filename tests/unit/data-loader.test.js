import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadMapsData, loadMapsFromFiles, loadWorldsData } from "../../js/modules/data-loader.js";

beforeEach(() => {
  vi.restoreAllMocks();
  delete window.desktopAPI;
});

// Helper pour mocker fetch
function mockFetch(data, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 404,
    json: () => Promise.resolve(data),
  });
}

describe("loadMapsData - format ancien (maps direct)", () => {
  it("retourne les donnees si maps.json contient maps[]", async () => {
    const mockData = { maps: [{ id: "arakas", name: "Arakas" }] };
    mockFetch(mockData);

    const result = await loadMapsData();

    expect(result.maps).toEqual(mockData.maps);
    expect(fetch).toHaveBeenCalledWith("data/maps.json");
  });

  it("retourne null si maps.json est vide ou invalide", async () => {
    mockFetch({});

    const result = await loadMapsData();

    expect(result).toBeNull();
  });
});

describe("loadMapsData - format nouveau (mapFiles index)", () => {
  it("charge les cartes depuis les fichiers regionaux", async () => {
    const mapData = { map: { id: "arakas", name: "Arakas" } };
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ mapFiles: ["data/maps/arakas.json"] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mapData),
      });

    const result = await loadMapsData();

    expect(result.maps).toHaveLength(1);
    expect(result.maps[0].id).toBe("arakas");
  });
});

describe("loadMapsData - fallback desktopAPI", () => {
  it("utilise desktopAPI.readMapsData si fetch echoue", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const mockMaps = { maps: [{ id: "stoneheim" }] };
    window.desktopAPI = { readMapsData: vi.fn().mockResolvedValue(mockMaps) };

    const result = await loadMapsData();

    expect(result).toEqual(mockMaps);
    expect(window.desktopAPI.readMapsData).toHaveBeenCalled();
  });

  it("retourne null si fetch echoue et pas de desktopAPI", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await loadMapsData();

    expect(result).toBeNull();
  });

  it("retourne null si fetch repond HTTP 404", async () => {
    mockFetch({}, false);

    const result = await loadMapsData();

    expect(result).toBeNull();
  });
});

describe("loadMapsFromFiles", () => {
  it("charge et filtre les cartes valides", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ map: { id: "arakas" } }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ map: { id: "drake-island" } }) });

    const result = await loadMapsFromFiles(["arakas.json", "drake.json"]);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("arakas");
  });

  it("filtre les entrees sans propriete map", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ map: { id: "stoneheim" } }) });

    const result = await loadMapsFromFiles(["vide.json", "stoneheim.json"]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("stoneheim");
  });

  it("rejette si un fichier repond HTTP 500", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(loadMapsFromFiles(["bad.json"])).rejects.toThrow("HTTP 500");
  });

  it("retourne un tableau vide si aucun fichier fourni", async () => {
    const result = await loadMapsFromFiles([]);
    expect(result).toEqual([]);
  });
});

// ─── Tests P4 : loadWorldsData ───────────────────────────────────────────────
describe("loadWorldsData (P4)", () => {
  it("retourne le tableau worlds si worlds.json est valide", async () => {
    const worldsData = { worlds: [{ worldId: 0, name: "Arakas" }, { worldId: 3, name: "Drake" }] };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(worldsData) });

    const result = await loadWorldsData("data/worlds.json");

    expect(result).toHaveLength(2);
    expect(result[0].worldId).toBe(0);
    expect(result[1].worldId).toBe(3);
  });

  it("retourne null si worlds.json ne contient pas de tableau worlds", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    const result = await loadWorldsData("data/worlds.json");

    expect(result).toBeNull();
  });

  it("retourne null si fetch échoue", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await loadWorldsData("data/worlds.json");

    expect(result).toBeNull();
  });

  it("retourne null si HTTP 404", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

    const result = await loadWorldsData("data/worlds.json");

    expect(result).toBeNull();
  });
});

// ─── Tests P4 : enrichissement _world dans loadMapsFromFiles ─────────────────
describe("loadMapsFromFiles - enrichissement world (P4)", () => {
  const worlds = [
    { worldId: 0, name: "Arakas", imageLocalPath: "data/images/worlds/world-0-arakas.png", imageWidth: 6144, imageHeight: 3072, imageUrl: "https://example.com/arakas.png" },
    { worldId: 3, name: "Drake Island", imageLocalPath: null, imageWidth: null, imageHeight: null, imageUrl: "https://example.com/drake.png" },
  ];

  it("enrichit la carte avec _world si worldId correspond", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ map: { id: "arakas", worldId: 0 } }),
    });

    const result = await loadMapsFromFiles(["arakas.json"], worlds);

    expect(result[0]._world).toMatchObject({ worldId: 0, name: "Arakas" });
  });

  it("attache hdImage depuis imageLocalPath du monde", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ map: { id: "arakas", worldId: 0 } }),
    });

    const result = await loadMapsFromFiles(["arakas.json"], worlds);

    expect(result[0].hdImage).toBe("data/images/worlds/world-0-arakas.png");
  });

  it("tombe en fallback imageUrl si imageLocalPath est null", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ map: { id: "drake-island", worldId: 3 } }),
    });

    const result = await loadMapsFromFiles(["drake-island.json"], worlds);

    expect(result[0].hdImage).toBe("https://example.com/drake.png");
  });

  it("priorise hdImage déjà présent dans la carte sur celui du monde", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ map: { id: "arakas", worldId: 0, hdImage: "custom.png" } }),
    });

    const result = await loadMapsFromFiles(["arakas.json"], worlds);

    expect(result[0].hdImage).toBe("custom.png");
  });

  it("ne crash pas si worldId inconnu dans le registre", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ map: { id: "unknown", worldId: 99 } }),
    });

    const result = await loadMapsFromFiles(["unknown.json"], worlds);

    expect(result[0]._world).toBeUndefined();
    expect(result[0].hdImage).toBeUndefined();
  });
});