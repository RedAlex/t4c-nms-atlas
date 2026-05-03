import { describe, it, expect } from "vitest";
import { buildGraph, findPath, nodeKey, summarizeRoute, TRANSITION_COST } from "../../js/modules/router.js";

// ─── Données de test ──────────────────────────────────────────────────────────

const mapsSimple = [
  {
    id: "arakas",
    pois: [
      { id: "lh", type: "lieux", name: "LightHaven", gx: 2850, gy: 1080 },
      { id: "wh", type: "lieux", name: "WindHowl", gx: 1700, gy: 1290 },
      {
        id: "arakas-cave-entry",
        type: "transition",
        transitionType: "cave",
        name: "Entrée grotte",
        gx: 2870,
        gy: 1120,
        openSubMapId: "lighthaven",
        targetPoiId: "lh-cave-exit",
      },
    ],
    subMaps: [
      {
        id: "lighthaven",
        pois: [
          { id: "lh-spawn", type: "lieux", name: "Spawn LH", x: 62, y: 35 },
          {
            id: "lh-cave-exit",
            type: "transition",
            transitionType: "cave",
            name: "Sortie grotte",
            x: 48,
            y: 80,
            targetMapId: "arakas",
            targetPoiId: "arakas-cave-entry",
          },
        ],
      },
    ],
  },
];

const mapsMultiMap = [
  {
    id: "arakas",
    pois: [
      { id: "lh", type: "lieux", name: "LightHaven", gx: 2850, gy: 1080 },
      {
        id: "arakas-portal",
        type: "portal",
        name: "Portail vers DI",
        gx: 2500,
        gy: 500,
        targetMapId: "drake-island",
        targetPoiId: "di-entry",
      },
    ],
    subMaps: [],
  },
  {
    id: "drake-island",
    pois: [
      { id: "di-entry", type: "lieux", name: "Entrée Drake Island", gx: 500, gy: 500 },
      { id: "di-boss", type: "lieux", name: "Boss Drake", gx: 1000, gy: 800 },
    ],
    subMaps: [],
  },
];

// ─── Tests : buildGraph ───────────────────────────────────────────────────────

describe("buildGraph", () => {
  it("crée un noeud par POI ayant un id", () => {
    const { nodes } = buildGraph(mapsSimple);
    expect(nodes.has(nodeKey("arakas", "lh"))).toBe(true);
    expect(nodes.has(nodeKey("arakas", "wh"))).toBe(true);
    expect(nodes.has(nodeKey("arakas", "arakas-cave-entry"))).toBe(true);
    expect(nodes.has(nodeKey("lighthaven", "lh-spawn"))).toBe(true);
    expect(nodes.has(nodeKey("lighthaven", "lh-cave-exit"))).toBe(true);
  });

  it("ignore les POIs sans id", () => {
    const maps = [
      {
        id: "arakas",
        pois: [
          { type: "lieux", name: "Sans ID", gx: 100, gy: 100 },
          { id: "avec-id", type: "lieux", name: "Avec ID", gx: 200, gy: 200 },
        ],
        subMaps: [],
      },
    ];
    const { nodes } = buildGraph(maps);
    expect(nodes.size).toBe(1);
    expect(nodes.has(nodeKey("arakas", "avec-id"))).toBe(true);
  });

  it("ajoute des arêtes intra-contexte entre POIs du même contexte", () => {
    const { graph } = buildGraph(mapsSimple);
    const lhKey = nodeKey("arakas", "lh");
    const whKey = nodeKey("arakas", "wh");
    const edges = graph.get(lhKey);
    expect(edges.some((e) => e.to === whKey && e.edgeType === "walk")).toBe(true);
  });

  it("les arêtes intra-contexte sont bidirectionnelles", () => {
    const { graph } = buildGraph(mapsSimple);
    const lhKey = nodeKey("arakas", "lh");
    const whKey = nodeKey("arakas", "wh");
    expect(graph.get(lhKey).some((e) => e.to === whKey)).toBe(true);
    expect(graph.get(whKey).some((e) => e.to === lhKey)).toBe(true);
  });

  it("ajoute une arête de transition carte→sous-carte via openSubMapId+targetPoiId", () => {
    const { graph } = buildGraph(mapsSimple);
    const entryKey = nodeKey("arakas", "arakas-cave-entry");
    const exitKey = nodeKey("lighthaven", "lh-cave-exit");
    const edges = graph.get(entryKey);
    expect(edges.some((e) => e.to === exitKey && e.weight === TRANSITION_COST)).toBe(true);
  });

  it("la transition est bidirectionnelle par défaut", () => {
    const { graph } = buildGraph(mapsSimple);
    const entryKey = nodeKey("arakas", "arakas-cave-entry");
    const exitKey = nodeKey("lighthaven", "lh-cave-exit");
    expect(graph.get(exitKey).some((e) => e.to === entryKey)).toBe(true);
  });

  it("ajoute une arête de transition inter-cartes via portal", () => {
    const { graph } = buildGraph(mapsMultiMap);
    const portalKey = nodeKey("arakas", "arakas-portal");
    const diKey = nodeKey("drake-island", "di-entry");
    expect(graph.get(portalKey).some((e) => e.to === diKey && e.weight === TRANSITION_COST)).toBe(true);
  });

  it("n'ajoute pas d'arête si targetPoiId est inconnu", () => {
    const maps = [
      {
        id: "arakas",
        pois: [
          {
            id: "bad-portal",
            type: "portal",
            name: "Portail cassé",
            gx: 100,
            gy: 100,
            targetMapId: "arakas",
            targetPoiId: "inexistant",
          },
        ],
        subMaps: [],
      },
    ];
    const { graph } = buildGraph(maps);
    const portalKey = nodeKey("arakas", "bad-portal");
    // Seule arête possible = vers elle-même via intra-contexte (mais pas de transition)
    const transitionEdges = graph.get(portalKey).filter((e) => e.edgeType !== "walk");
    expect(transitionEdges).toHaveLength(0);
  });

  it("stocke transitionType dans les métadonnées du noeud", () => {
    const { nodes } = buildGraph(mapsSimple);
    const node = nodes.get(nodeKey("arakas", "arakas-cave-entry"));
    expect(node.transitionType).toBe("cave");
  });
});

// ─── Tests : findPath ─────────────────────────────────────────────────────────

describe("findPath", () => {
  it("retourne null si le noeud de départ est inconnu", () => {
    const { graph, nodes } = buildGraph(mapsSimple);
    expect(findPath(graph, nodes, "inconnu::poi", nodeKey("arakas", "lh"))).toBeNull();
  });

  it("retourne null si le noeud d'arrivée est inconnu", () => {
    const { graph, nodes } = buildGraph(mapsSimple);
    expect(findPath(graph, nodes, nodeKey("arakas", "lh"), "inconnu::poi")).toBeNull();
  });

  it("retourne une étape unique si départ = arrivée", () => {
    const { graph, nodes } = buildGraph(mapsSimple);
    const key = nodeKey("arakas", "lh");
    const result = findPath(graph, nodes, key, key);
    expect(result).not.toBeNull();
    expect(result.steps).toHaveLength(1);
    expect(result.totalWeight).toBe(0);
  });

  it("trouve un chemin intra-contexte (même carte)", () => {
    const { graph, nodes } = buildGraph(mapsSimple);
    const from = nodeKey("arakas", "lh");
    const to = nodeKey("arakas", "wh");
    const result = findPath(graph, nodes, from, to);
    expect(result).not.toBeNull();
    expect(result.steps.length).toBeGreaterThanOrEqual(2);
    expect(result.steps[0].nodeKey).toBe(from);
    expect(result.steps[result.steps.length - 1].nodeKey).toBe(to);
  });

  it("traverse une transition grotte (carte → sous-carte)", () => {
    const { graph, nodes } = buildGraph(mapsSimple);
    const from = nodeKey("arakas", "lh");
    const to = nodeKey("lighthaven", "lh-spawn");
    const result = findPath(graph, nodes, from, to);
    expect(result).not.toBeNull();
    // Le chemin doit passer par l'entrée et la sortie de la grotte
    const keys = result.steps.map((s) => s.nodeKey);
    expect(keys).toContain(nodeKey("arakas", "arakas-cave-entry"));
    expect(keys).toContain(nodeKey("lighthaven", "lh-cave-exit"));
    expect(keys[keys.length - 1]).toBe(to);
  });

  it("traverse un portail inter-cartes (arakas → drake-island)", () => {
    const { graph, nodes } = buildGraph(mapsMultiMap);
    const from = nodeKey("arakas", "lh");
    const to = nodeKey("drake-island", "di-boss");
    const result = findPath(graph, nodes, from, to);
    expect(result).not.toBeNull();
    const keys = result.steps.map((s) => s.nodeKey);
    expect(keys).toContain(nodeKey("arakas", "arakas-portal"));
    expect(keys[keys.length - 1]).toBe(to);
  });

  it("le poids total d'une transition seule vaut TRANSITION_COST", () => {
    const { graph, nodes } = buildGraph(mapsSimple);
    const from = nodeKey("arakas", "arakas-cave-entry");
    const to = nodeKey("lighthaven", "lh-cave-exit");
    const result = findPath(graph, nodes, from, to);
    expect(result).not.toBeNull();
    expect(result.totalWeight).toBe(TRANSITION_COST);
  });

  it("le chemin retour traverse la même transition en sens inverse", () => {
    const { graph, nodes } = buildGraph(mapsSimple);
    const from = nodeKey("lighthaven", "lh-spawn");
    const to = nodeKey("arakas", "wh");
    const result = findPath(graph, nodes, from, to);
    expect(result).not.toBeNull();
    const keys = result.steps.map((s) => s.nodeKey);
    // Doit passer par la sortie (sens inverse = exit → entry)
    expect(keys).toContain(nodeKey("lighthaven", "lh-cave-exit"));
  });

  it("signale le type d'arête de transition dans les étapes", () => {
    const { graph, nodes } = buildGraph(mapsSimple);
    const from = nodeKey("arakas", "arakas-cave-entry");
    const to = nodeKey("lighthaven", "lh-cave-exit");
    const result = findPath(graph, nodes, from, to);
    // L'étape d'entrée doit avoir edgeType = "transition"
    const entryStep = result.steps.find((s) => s.nodeKey === nodeKey("arakas", "arakas-cave-entry"));
    expect(entryStep.edgeType).toBe("transition");
  });
});

// ─── Tests : summarizeRoute ───────────────────────────────────────────────────

describe("summarizeRoute", () => {
  it("retourne un message d'erreur si null", () => {
    const lines = summarizeRoute(null);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Aucun chemin");
  });

  it("retourne une ligne par étape", () => {
    const { graph, nodes } = buildGraph(mapsSimple);
    const from = nodeKey("arakas", "lh");
    const to = nodeKey("arakas", "wh");
    const route = findPath(graph, nodes, from, to);
    const lines = summarizeRoute(route);
    expect(lines.length).toBe(route.steps.length);
  });

  it("la première ligne commence par 'Départ'", () => {
    const { graph, nodes } = buildGraph(mapsSimple);
    const route = findPath(graph, nodes, nodeKey("arakas", "lh"), nodeKey("arakas", "wh"));
    expect(summarizeRoute(route)[0]).toMatch(/^Départ/);
  });

  it("la dernière ligne commence par 'Arrivée'", () => {
    const { graph, nodes } = buildGraph(mapsSimple);
    const route = findPath(graph, nodes, nodeKey("arakas", "lh"), nodeKey("arakas", "wh"));
    const lines = summarizeRoute(route);
    expect(lines[lines.length - 1]).toMatch(/^Arrivée/);
  });
});
