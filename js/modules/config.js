/**
 * Configuration globale de l'application
 * @module config
 */

const config = {
  /** Mode développement pour outils de calibration */
  isDev:
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("dev") === "1",
};

export default config;
