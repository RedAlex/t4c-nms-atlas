import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadMapsData, loadMapsFromFiles } from "../../js/modules/data-loader.js";

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

    expect(result).toEqual(mockData);
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