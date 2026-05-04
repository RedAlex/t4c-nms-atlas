/**
 * Graphe de navigation inter-cartes
 * @module graph
 */

/**
 * Construit le graphe de navigation à partir des cartes chargées.
 * Nœuds : cartes principales + sous-cartes
 * Arêtes : portails, transitions, ouvertures de sous-cartes
 *
 * @param {Array} maps - Liste des objets carte (avec subMaps et pois)
 * @returns {{ nodes: Map<string, Object>, adjacency: Map<string, Array> }}
 */
export function buildMapGraph(maps) {
  const nodes = new Map();
  const adjacency = new Map();

  function addNode(id, node) {
    if (!nodes.has(id)) {
      nodes.set(id, node);
      adjacency.set(id, []);
    }
  }

  function addEdge(fromId, toId, edgeData) {
    if (!adjacency.has(fromId)) {
      adjacency.set(fromId, []);
    }
    const edges = adjacency.get(fromId);
    const duplicate = edges.some((e) => e.toId === toId && e.poiName === edgeData.poiName);
    if (!duplicate) {
      edges.push({ toId, ...edgeData });
    }
  }

  for (const map of maps) {
    const mapId = map.id;
    addNode(mapId, { id: mapId, type: "map", name: map.name, mapId });

    for (const sub of map.subMaps || []) {
      const subNodeId = `${mapId}::${sub.id}`;
      addNode(subNodeId, { id: subNodeId, type: "submap", name: sub.name, mapId, submapId: sub.id });
    }

    for (const poi of map.pois || []) {
      if (poi.targetMapId) {
        addEdge(mapId, poi.targetMapId, {
          poiName: poi.name,
          poiType: poi.type,
          poiId: poi.id || null,
        });
      }
      if (poi.openSubMapId) {
        const subNodeId = `${mapId}::${poi.openSubMapId}`;
        addEdge(mapId, subNodeId, {
          poiName: poi.name,
          poiType: poi.type,
          poiId: poi.id || null,
        });
      }
    }

    for (const sub of map.subMaps || []) {
      const subNodeId = `${mapId}::${sub.id}`;
      for (const poi of sub.pois || []) {
        if (poi.targetMapId) {
          const targetSubNodeId = poi.openSubMapId
            ? `${poi.targetMapId}::${poi.openSubMapId}`
            : poi.targetMapId;
          addEdge(subNodeId, targetSubNodeId, {
            poiName: poi.name,
            poiType: poi.type,
            poiId: poi.id || null,
          });
        }
        if (poi.openSubMapId && !poi.targetMapId) {
          const targetSubNodeId = `${mapId}::${poi.openSubMapId}`;
          addEdge(subNodeId, targetSubNodeId, {
            poiName: poi.name,
            poiType: poi.type,
            poiId: poi.id || null,
          });
        }
      }
    }
  }

  return { nodes, adjacency };
}

/**
 * Trouve le chemin le plus court entre deux nœuds (BFS).
 *
 * @param {{ nodes: Map, adjacency: Map }} graph
 * @param {string} fromId - ID du nœud de départ
 * @param {string} toId - ID du nœud d'arrivée
 * @returns {Array|null} Tableau d'étapes `{ node, via }` ou null si aucun chemin
 */
export function findPath(graph, fromId, toId) {
  const { nodes, adjacency } = graph;
  if (!nodes.has(fromId) || !nodes.has(toId)) {
    return null;
  }
  if (fromId === toId) {
    return [{ node: nodes.get(fromId), via: null }];
  }

  const visited = new Set([fromId]);
  const queue = [{ id: fromId, path: [{ node: nodes.get(fromId), via: null }] }];

  while (queue.length > 0) {
    const { id, path } = queue.shift();
    for (const edge of (adjacency.get(id) || [])) {
      if (visited.has(edge.toId) || !nodes.has(edge.toId)) {
        continue;
      }
      const nextNode = nodes.get(edge.toId);
      const nextPath = [
        ...path,
        {
          node: nextNode,
          via: { poiName: edge.poiName, poiType: edge.poiType, poiId: edge.poiId },
        },
      ];
      if (edge.toId === toId) {
        return nextPath;
      }
      visited.add(edge.toId);
      queue.push({ id: edge.toId, path: nextPath });
    }
  }
  return null;
}

/**
 * Retourne la liste de tous les nœuds triés par nom pour alimenter un sélecteur.
 *
 * @param {{ nodes: Map }} graph
 * @returns {Array<{ id: string, label: string, type: string }>}
 */
export function getGraphNodeList(graph) {
  return Array.from(graph.nodes.values())
    .map((n) => ({
      id: n.id,
      label: n.type === "submap" ? `${n.name} (sous-carte)` : n.name,
      type: n.type,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));
}
