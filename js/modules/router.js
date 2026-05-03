/**
 * Moteur de routage inter-cartes avec graphe de navigation
 * @module router
 *
 * Architecture :
 * - Noeud   : tout POI ayant un champ `id` explicite, sur une carte ou une sous-carte
 * - Arête intra-contexte : distance euclidienne entre POIs du même contexte (carte ou sous-carte)
 * - Arête inter-contexte : coût fixe TRANSITION_COST pour les POIs de type `transition`,
 *   `portal` ou `lien` qui déclarent (targetMapId OU openSubMapId) + targetPoiId
 *
 * Systèmes de coordonnées reconnus (par ordre de priorité) :
 *   gx/gy    — Gobeline (cartes principales, unités de jeu)
 *   gameX/Y  — Héritage (unités de jeu)
 *   x/y      — Direct (pourcentage ou pixel, sous-cartes)
 */

/** Coût fixe d'une transition inter-contexte (téléportation, entrée de grotte…) */
export const TRANSITION_COST = 1;

/** @type {string[]} Types de POI autorisés à créer des arêtes inter-contexte */
const TRANSITION_TYPES = ["transition", "portal", "lien"];

/**
 * Retourne la clé unique d'un noeud dans le graphe
 * @param {string} contextId - ID de la carte ou de la sous-carte
 * @param {string} poiId     - ID du POI
 * @returns {string}
 */
export function nodeKey(contextId, poiId) {
  return `${contextId}::${poiId}`;
}

/**
 * Extrait des coordonnées exploitables d'un POI
 * @param {Object} poi
 * @returns {{ x: number, y: number } | null}
 */
function poiCoords(poi) {
  if (typeof poi.gx === "number" && typeof poi.gy === "number") return { x: poi.gx, y: poi.gy };
  if (typeof poi.gameX === "number" && typeof poi.gameY === "number")
    return { x: poi.gameX, y: poi.gameY };
  if (typeof poi.x === "number" && typeof poi.y === "number") return { x: poi.x, y: poi.y };
  return null;
}

/**
 * Distance euclidienne entre les coordonnées de deux noeuds
 * @param {{ x: number, y: number } | null} a
 * @param {{ x: number, y: number } | null} b
 * @returns {number}
 */
function euclidean(a, b) {
  if (!a || !b) return 0;
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * Construit le graphe de navigation à partir de toutes les cartes chargées.
 *
 * Seuls les POIs portant un champ `id` explicite (string non-vide) participent
 * au graphe. Les autres POIs ne sont ni noeuds ni sources d'arêtes inter-contexte.
 *
 * @param {Object[]} maps - Cartes telles que retournées par loadMapsData()
 * @returns {{
 *   graph: Map<string, Array<{to: string, weight: number, edgeType: string}>>,
 *   nodes: Map<string, {contextId: string, poiId: string, name: string, type: string,
 *                        transitionType: string|null, coords: {x:number,y:number}|null}>
 * }}
 */
export function buildGraph(maps) {
  /** @type {Map<string, Array<{to: string, weight: number, edgeType: string}>>} */
  const graph = new Map();
  /** @type {Map<string, Object>} */
  const nodes = new Map();

  // ── 1. Enregistrer tous les noeuds ────────────────────────────────────────
  function registerNode(contextId, poi) {
    if (!poi.id || typeof poi.id !== "string") return;
    const key = nodeKey(contextId, poi.id);
    if (!nodes.has(key)) {
      nodes.set(key, {
        contextId,
        poiId: poi.id,
        name: poi.name || poi.id,
        type: poi.type || "lieux",
        transitionType: poi.transitionType || null,
        coords: poiCoords(poi),
      });
      graph.set(key, []);
    }
  }

  for (const map of maps) {
    for (const poi of map.pois || []) {
      registerNode(map.id, poi);
    }
    for (const sub of map.subMaps || []) {
      for (const poi of sub.pois || []) {
        registerNode(sub.id, poi);
      }
    }
  }

  // ── 2. Arêtes intra-contexte (marche entre POIs du même contexte) ─────────
  /** @type {Map<string, Array<{key: string, node: Object}>>} */
  const byContext = new Map();
  for (const [key, node] of nodes) {
    if (!byContext.has(node.contextId)) byContext.set(node.contextId, []);
    byContext.get(node.contextId).push({ key, node });
  }

  for (const group of byContext.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const { key: ka, node: na } = group[i];
        const { key: kb, node: nb } = group[j];
        const w = euclidean(na.coords, nb.coords);
        // Arêtes bidirectionnelles
        graph.get(ka).push({ to: kb, weight: w, edgeType: "walk" });
        graph.get(kb).push({ to: ka, weight: w, edgeType: "walk" });
      }
    }
  }

  // ── 3. Arêtes inter-contexte (transitions) ────────────────────────────────
  function addTransitionEdge(fromContextId, poi) {
    if (!poi.id || !TRANSITION_TYPES.includes(poi.type)) return;
    const fromKey = nodeKey(fromContextId, poi.id);
    if (!graph.has(fromKey)) return;

    const bidi = poi.bidirectional !== false; // bidirectionnel par défaut

    // Vers une autre CARTE principale (targetMapId + targetPoiId)
    if (poi.targetMapId && poi.targetPoiId) {
      const toKey = nodeKey(poi.targetMapId, poi.targetPoiId);
      if (nodes.has(toKey)) {
        graph.get(fromKey).push({ to: toKey, weight: TRANSITION_COST, edgeType: poi.type });
        if (bidi) {
          graph.get(toKey).push({ to: fromKey, weight: TRANSITION_COST, edgeType: poi.type });
        }
      }
    }

    // Vers une SOUS-CARTE (openSubMapId + targetPoiId)
    if (poi.openSubMapId && poi.targetPoiId) {
      const toKey = nodeKey(poi.openSubMapId, poi.targetPoiId);
      if (nodes.has(toKey)) {
        graph.get(fromKey).push({ to: toKey, weight: TRANSITION_COST, edgeType: poi.type });
        if (bidi) {
          graph.get(toKey).push({ to: fromKey, weight: TRANSITION_COST, edgeType: poi.type });
        }
      }
    }
  }

  for (const map of maps) {
    for (const poi of map.pois || []) {
      addTransitionEdge(map.id, poi);
    }
    for (const sub of map.subMaps || []) {
      for (const poi of sub.pois || []) {
        addTransitionEdge(sub.id, poi);
      }
    }
  }

  return { graph, nodes };
}

/**
 * Algorithme de Dijkstra — chemin le plus court entre deux noeuds du graphe.
 *
 * Retourne null si le chemin est impossible (noeuds inconnus ou pas de chemin).
 *
 * @param {Map} graph    - Graphe retourné par buildGraph()
 * @param {Map} nodes    - Métadonnées des noeuds
 * @param {string} startKey - Noeud de départ (`nodeKey(contextId, poiId)`)
 * @param {string} endKey   - Noeud d'arrivée
 * @returns {{ steps: Object[], totalWeight: number } | null}
 */
export function findPath(graph, nodes, startKey, endKey) {
  if (!graph.has(startKey) || !graph.has(endKey)) return null;
  if (startKey === endKey) {
    return { steps: [{ ...nodes.get(startKey), nodeKey: startKey, edgeType: null }], totalWeight: 0 };
  }

  /** @type {Map<string, number>} */
  const dist = new Map();
  /** @type {Map<string, string>} */
  const prev = new Map();
  const visited = new Set();

  for (const key of graph.keys()) {
    dist.set(key, Infinity);
  }
  dist.set(startKey, 0);

  // File de priorité minimale (acceptable pour les graphes de taille T4C)
  const queue = [{ key: startKey, weight: 0 }];

  while (queue.length > 0) {
    // Trier pour obtenir le poids minimal en tête
    queue.sort((a, b) => a.weight - b.weight);
    const { key: u } = queue.shift();

    if (visited.has(u)) continue;
    visited.add(u);

    if (u === endKey) break;

    for (const { to, weight } of graph.get(u) || []) {
      if (visited.has(to)) continue;
      const alt = dist.get(u) + weight;
      const dTo = dist.has(to) ? dist.get(to) : Infinity;
      if (alt < dTo) {
        dist.set(to, alt);
        prev.set(to, u);
        queue.push({ key: to, weight: alt });
      }
    }
  }

  if (dist.get(endKey) === Infinity) return null;

  // Reconstruction du chemin
  const path = [];
  let cur = endKey;
  while (cur !== undefined) {
    path.unshift(cur);
    cur = prev.get(cur);
  }

  // Construire les étapes avec le type d'arête vers le prochain noeud
  const steps = path.map((key, idx) => {
    const node = nodes.get(key);
    const nextKey = path[idx + 1];
    const edgeToNext = nextKey
      ? (graph.get(key) || []).find((e) => e.to === nextKey) || null
      : null;
    return {
      ...node,
      nodeKey: key,
      edgeType: edgeToNext?.edgeType || null,
    };
  });

  return { steps, totalWeight: dist.get(endKey) };
}

/**
 * Retourne un résumé textuel d'un itinéraire (pour affichage ou debug)
 * @param {{ steps: Object[], totalWeight: number }} route
 * @returns {string[]}
 */
export function summarizeRoute(route) {
  if (!route) return ["Aucun chemin trouvé."];
  return route.steps.map((step, i) => {
    const prefix = i === 0 ? "Départ" : i === route.steps.length - 1 ? "Arrivée" : `Étape ${i}`;
    const transition = step.edgeType && step.edgeType !== "walk" ? ` → [${step.transitionType || step.edgeType}]` : "";
    return `${prefix} : ${step.name} (${step.contextId})${transition}`;
  });
}
