/**
 * Utilitaires génériques
 * @module utils
 */

/**
 * Normalise une URL
 * @param {*} url - URL à valider
 * @returns {string|null} URL validée ou null
 */
export function normalizeUrlCandidate(url) {
  if (typeof url !== "string") {
    return null;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch (_err) {
    return null;
  }
}

/**
 * Construit une URL de recherche wiki
 * @param {string} poiName - Nom du POI
 * @returns {string|null} URL de recherche
 */
export function buildWikiSearchUrl(poiName) {
  if (typeof poiName !== "string") {
    return null;
  }

  const trimmedName = poiName.trim();
  if (!trimmedName) {
    return null;
  }

  const baseUrl =
    "https://t4c.fandom.com/fr/wiki/Sp%C3%A9cial:Recherche?scope=internal&navigationSearch=true&query=";
  return `${baseUrl}${encodeURIComponent(trimmedName)}`;
}

/**
 * Copie du texte vers le presse-papiers
 * @param {string} text - Texte à copier
 * @returns {Promise<boolean>} Succès de la copie
 */
export async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_err) {
      // Fallback below for contexts where Clipboard API is blocked.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const result = document.execCommand("copy");
    document.body.removeChild(textarea);
    return result;
  } catch (_err) {
    document.body.removeChild(textarea);
    return false;
  }
}

/**
 * Calcule les dimensions d'une image dans un conteneur
 * @param {number} containerW - Largeur du conteneur
 * @param {number} containerH - Hauteur du conteneur
 * @param {number} imageW - Largeur de l'image
 * @param {number} imageH - Hauteur de l'image
 * @returns {Object} Position et dimensions de l'image affichée
 */
export function getDisplayedImageRect(containerW, containerH, imageW, imageH) {
  if (!imageW || !imageH) {
    return { left: 0, top: 0, width: containerW, height: containerH };
  }

  const scale = Math.min(containerW / imageW, containerH / imageH);
  const width = imageW * scale;
  const height = imageH * scale;

  return {
    left: (containerW - width) / 2,
    top: (containerH - height) / 2,
    width,
    height,
  };
}

/**
 * Convertit des coordonnées en pourcentage à des coordonnées d'affichage
 * @param {Object} percent - Coordonnées en %
 * @returns {Object} Coordonnées d'affichage (0-5000)
 */
export function percentToDisplayCoords(percent) {
  return {
    x: (percent.x / 100) * 5000,
    y: (percent.y / 100) * 5000,
  };
}
