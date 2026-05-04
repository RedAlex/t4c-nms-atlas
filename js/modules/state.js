/**
 * State management centralisé
 * @module state
 */

const state = {
  maps: [],
  worlds: [],
  activeWorldId: 0,
  activeMap: null,
  activeSubMap: null,
  activeFilter: "lieux",
  activeSubmapFilter: "lieux",
  // Si false, le clic gauche sur PNJ/monstres ne déclenche pas de navigation.
  enableLeftClickNavigationOnNpcMonsters: false,
  showPoiTitles: true,
  showSubmapPoiTitles: true,
  showGridCoords: false,
  showSubmapGridCoords: false,
  worldSearchQuery: "",
  mapSearchQuery: "",
  submapSearchQuery: "",
  favorites: [],
};

/**
 * Met à jour l'état global
 * @param {string} key - Clé de l'état
 * @param {*} value - Nouvelle valeur
 */
export function updateState(key, value) {
  state[key] = value;
}

/**
 * Récupère une valeur de l'état
 * @param {string} key - Clé de l'état
 * @returns {*} Valeur de l'état
 */
export function getState(key) {
  return state[key];
}

/**
 * Récupère l'état complet
 * @returns {Object} État global
 */
export function getAllState() {
  return state;
}

export default state;
