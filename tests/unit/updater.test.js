import { describe, it, expect } from "vitest";
import { createRequire } from "module";

// updater.cjs est un module CommonJS Electron — on importe uniquement isNewer
// (le reste dépend de l'API Electron non disponible en environnement test)
const require = createRequire(import.meta.url);
const { isNewer } = require("../../electron/updater.cjs");

describe("isNewer", () => {
  it("retourne true si la release est plus récente (patch)", () => {
    expect(isNewer("0.3.1", "v0.3.2")).toBe(true);
  });

  it("retourne true si la release est plus récente (minor)", () => {
    expect(isNewer("0.3.1", "v0.4.0")).toBe(true);
  });

  it("retourne true si la release est plus récente (major)", () => {
    expect(isNewer("0.3.1", "v1.0.0")).toBe(true);
  });

  it("retourne false si même version", () => {
    expect(isNewer("0.3.1", "v0.3.1")).toBe(false);
  });

  it("retourne false si version locale plus récente", () => {
    expect(isNewer("0.3.1", "v0.2.9")).toBe(false);
  });

  it("gère les versions sans préfixe v", () => {
    expect(isNewer("1.0.0", "1.0.1")).toBe(true);
    expect(isNewer("1.0.0", "1.0.0")).toBe(false);
  });

  it("gère correctement les composants manquants (ex: v1.0)", () => {
    expect(isNewer("0.9.9", "v1.0")).toBe(true);
    expect(isNewer("1.0.0", "v1.0")).toBe(false);
  });
});
