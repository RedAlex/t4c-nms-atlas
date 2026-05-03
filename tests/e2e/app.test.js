/**
 * Tests e2e — Lancement de l'application et vue carte par défaut.
 */
import { test, expect, _electron as electron } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

test.describe("Lancement de l'application", () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: [ROOT] });
    window = await electronApp.firstWindow();
    await window.waitForLoadState("networkidle");
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test("affiche le titre principal", async () => {
    await expect(window.locator("h1")).toContainText("Atlas NMS Revolution");
  });

  test("affiche la vue carte au démarrage", async () => {
    const mapView = window.locator("#map-view");
    await expect(mapView).toBeVisible();
    await expect(mapView).not.toHaveClass(/hidden/);

    const worldView = window.locator("#world-view");
    await expect(worldView).toHaveClass(/hidden/);
  });

  test("la vue sous-carte est masquée au démarrage", async () => {
    await expect(window.locator("#submap-view")).toHaveClass(/hidden/);
  });

  test("affiche la version dans le footer", async () => {
    const versionEl = window.locator("#app-version");
    await expect(versionEl).toBeVisible();
    const text = await versionEl.textContent();
    expect(text).toMatch(/^v/);
  });

  test("affiche un titre de carte active", async () => {
    const title = window.locator("#active-map-title");
    await expect(title).toBeVisible();
    const text = await title.textContent();
    expect((text || "").trim().length).toBeGreaterThan(0);
  });
});