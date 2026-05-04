import { describe, it, expect } from "vitest";
import { buildMapGraph, findPath, getGraphNodeList } from "../../js/modules/graph.js";

/** Données de cartes minimales pour les tests */
const MAPS_FIXTURE = [
  {
    id: "map-a",
    name: "Carte A",
    pois: [
      { type: "portal", name: "Portail vers B", targetMapId: "map-b" },
      { id: "entry-sub", type: "lieux", name: "Village", openSubMapId: "sub-a1" },
    ],
    subMaps: [
      {
        id: "sub-a1",
        name: "Village Intérieur",
        pois: [
          { id: "exit-sub", type: "transition", name: "Sortie village", targetMapId: "map-a" },
        ],
      },
    ],
  },
  {
    id: "map-b",
    name: "Carte B",
    pois: [
      { type: "portal", name: "Portail vers C", targetMapId: "map-c" },
    ],
    subMaps: [],
  },
  {
    id: "map-c",
    name: "Carte C",
    pois: [],
    subMaps: [],
  },
];

describe("buildMapGraph", () => {
  it("crée les nœuds pour chaque carte et sous-carte", () => {
    const graph = buildMapGraph(MAPS_FIXTURE);
    expect(graph.nodes.has("map-a")).toBe(true);
    expect(graph.nodes.has("map-b")).toBe(true);
    expect(graph.nodes.has("map-c")).toBe(true);
    expect(graph.nodes.has("map-a::sub-a1")).toBe(true);
  });

  it("identifie correctement le type des nœuds", () => {
    const graph = buildMapGraph(MAPS_FIXTURE);
    expect(graph.nodes.get("map-a").type).toBe("map");
    expect(graph.nodes.get("map-a::sub-a1").type).toBe("submap");
  });

  it("crée une arête portal map-a → map-b", () => {
    const graph = buildMapGraph(MAPS_FIXTURE);
    const edges = graph.adjacency.get("map-a");
    expect(edges.some((e) => e.toId === "map-b")).toBe(true);
  });

  it("crée une arête map-a → sous-carte sub-a1", () => {
    const graph = buildMapGraph(MAPS_FIXTURE);
    const edges = graph.adjacency.get("map-a");
    expect(edges.some((e) => e.toId === "map-a::sub-a1")).toBe(true);
  });

  it("crée une arête retour sous-carte → map-a", () => {
    const graph = buildMapGraph(MAPS_FIXTURE);
    const edges = graph.adjacency.get("map-a::sub-a1");
    expect(edges.some((e) => e.toId === "map-a")).toBe(true);
  });

  it("ne crée pas de doublons d'arêtes", () => {
    const graph = buildMapGraph(MAPS_FIXTURE);
    const edges = graph.adjacency.get("map-a");
    const toBCount = edges.filter((e) => e.toId === "map-b").length;
    expect(toBCount).toBe(1);
  });

  it("retourne un graphe vide pour un tableau vide", () => {
    const graph = buildMapGraph([]);
    expect(graph.nodes.size).toBe(0);
    expect(graph.adjacency.size).toBe(0);
  });
});

describe("findPath", () => {
  const graph = buildMapGraph(MAPS_FIXTURE);

  it("retourne [nœud] pour un chemin vers soi-même", () => {
    const path = findPath(graph, "map-a", "map-a");
    expect(path).toHaveLength(1);
    expect(path[0].node.id).toBe("map-a");
    expect(path[0].via).toBeNull();
  });

  it("trouve le chemin direct map-a → map-b", () => {
    const path = findPath(graph, "map-a", "map-b");
    expect(path).not.toBeNull();
    expect(path.map((s) => s.node.id)).toEqual(["map-a", "map-b"]);
  });

  it("trouve le chemin indirect map-a → map-c (via map-b)", () => {
    const path = findPath(graph, "map-a", "map-c");
    expect(path).not.toBeNull();
    expect(path.map((s) => s.node.id)).toEqual(["map-a", "map-b", "map-c"]);
  });

  it("trouve le chemin map-a → sous-carte sub-a1", () => {
    const path = findPath(graph, "map-a", "map-a::sub-a1");
    expect(path).not.toBeNull();
    expect(path).toHaveLength(2);
    expect(path[1].node.id).toBe("map-a::sub-a1");
    expect(path[1].via.poiName).toBe("Village");
  });

  it("retourne null si aucun chemin n'existe", () => {
    const path = findPath(graph, "map-c", "map-a");
    expect(path).toBeNull();
  });

  it("retourne null si un nœud est inconnu", () => {
    expect(findPath(graph, "unknown", "map-b")).toBeNull();
    expect(findPath(graph, "map-a", "unknown")).toBeNull();
  });
});

describe("getGraphNodeList", () => {
  it("retourne une liste triée par label", () => {
    const graph = buildMapGraph(MAPS_FIXTURE);
    const list = getGraphNodeList(graph);
    const labels = list.map((n) => n.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, "fr")));
  });

  it("suffixe les sous-cartes avec '(sous-carte)'", () => {
    const graph = buildMapGraph(MAPS_FIXTURE);
    const list = getGraphNodeList(graph);
    const subEntry = list.find((n) => n.id === "map-a::sub-a1");
    expect(subEntry).toBeDefined();
    expect(subEntry.label).toContain("(sous-carte)");
  });

  it("retourne autant d'entrées que de nœuds dans le graphe", () => {
    const graph = buildMapGraph(MAPS_FIXTURE);
    const list = getGraphNodeList(graph);
    expect(list).toHaveLength(graph.nodes.size);
  });
});
