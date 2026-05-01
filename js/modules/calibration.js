/**
 * Logique de calibration et transformation de coordonnées
 * @module calibration
 */

/**
 * Crée une transformation de coordonnées de jeu en pourcentage
 * @param {Object} calibration - Données de calibration
 * @returns {Function|null} Fonction de transformation ou null
 */
export function createGameToPercentTransform(calibration) {
  const gamePoints = calibration?.gamePoints;
  if (!Array.isArray(gamePoints)) {
    return null;
  }

  const pairedPoints = gamePoints
    .filter(
      (point) =>
        typeof point?.gameX === "number" &&
        typeof point?.gameY === "number" &&
        typeof point?.mapX === "number" &&
        typeof point?.mapY === "number" &&
        !(point.gameX === 0 && point.gameY === 0 && point.mapX === 0 && point.mapY === 0)
    )
    .map((point) => ({
      gameX: point.gameX,
      gameY: point.gameY,
      x: (point.mapX / 5000) * 100,
      y: (point.mapY / 5000) * 100,
    }));

  if (pairedPoints.length < 3) {
    return null;
  }
  return createAffineTransform(pairedPoints, "gameX", "gameY", "x", "y");
}

/**
 * Crée une transformation affine
 * @param {Object[]} anchors - Points d'ancrage (min 3)
 * @param {string} sxKey - Clé X source
 * @param {string} syKey - Clé Y source
 * @param {string} txKey - Clé X cible
 * @param {string} tyKey - Clé Y cible
 * @returns {Function|null} Fonction de transformation ou null
 */
export function createAffineTransform(anchors, sxKey, syKey, txKey, tyKey) {
  const [p1, p2, p3] = anchors;

  const valid = [p1, p2, p3].every(
    (p) =>
      typeof p[sxKey] === "number" &&
      typeof p[syKey] === "number" &&
      typeof p[txKey] === "number" &&
      typeof p[tyKey] === "number"
  );
  if (!valid) {
    return null;
  }

  const det =
    p1[sxKey] * (p2[syKey] - p3[syKey]) +
    p2[sxKey] * (p3[syKey] - p1[syKey]) +
    p3[sxKey] * (p1[syKey] - p2[syKey]);
  if (Math.abs(det) < 1e-9) {
    return null;
  }

  const a =
    (p1[txKey] * (p2[syKey] - p3[syKey]) +
      p2[txKey] * (p3[syKey] - p1[syKey]) +
      p3[txKey] * (p1[syKey] - p2[syKey])) /
    det;
  const b =
    (p1[txKey] * (p3[sxKey] - p2[sxKey]) +
      p2[txKey] * (p1[sxKey] - p3[sxKey]) +
      p3[txKey] * (p2[sxKey] - p1[sxKey])) /
    det;
  const c =
    (p1[txKey] * (p2[sxKey] * p3[syKey] - p3[sxKey] * p2[syKey]) +
      p2[txKey] * (p3[sxKey] * p1[syKey] - p1[sxKey] * p3[syKey]) +
      p3[txKey] * (p1[sxKey] * p2[syKey] - p2[sxKey] * p1[syKey])) /
    det;

  const d =
    (p1[tyKey] * (p2[syKey] - p3[syKey]) +
      p2[tyKey] * (p3[syKey] - p1[syKey]) +
      p3[tyKey] * (p1[syKey] - p2[syKey])) /
    det;
  const e =
    (p1[tyKey] * (p3[sxKey] - p2[sxKey]) +
      p2[tyKey] * (p1[sxKey] - p3[sxKey]) +
      p3[tyKey] * (p2[sxKey] - p1[sxKey])) /
    det;
  const f =
    (p1[tyKey] * (p2[sxKey] * p3[syKey] - p3[sxKey] * p2[syKey]) +
      p2[tyKey] * (p3[sxKey] * p1[syKey] - p1[sxKey] * p3[syKey]) +
      p3[tyKey] * (p1[sxKey] * p2[syKey] - p2[sxKey] * p1[syKey])) /
    det;

  return (sx, sy) => ({
    x: a * sx + b * sy + c,
    y: d * sx + e * sy + f,
  });
}

/**
 * Résout la position d'un POI
 * @param {Object} poi - Point d'intérêt
 * @param {Function} gameToPercent - Fonction de transformation
 * @returns {Object|null} Position en pourcentage ou null
 */
export function resolvePoiPosition(poi, gameToPercent) {
  if (typeof poi.gameX === "number" && typeof poi.gameY === "number" && gameToPercent) {
    return gameToPercent(poi.gameX, poi.gameY);
  }

  if (typeof poi.gx === "number" && typeof poi.gy === "number" && gameToPercent) {
    return gameToPercent(poi.gx, poi.gy);
  }

  if (typeof poi.x === "number" && typeof poi.y === "number") {
    return { x: poi.x, y: poi.y };
  }

  return null;
}
