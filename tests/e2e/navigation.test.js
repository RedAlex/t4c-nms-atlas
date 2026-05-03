/**
 * Tests e2e — Navigation Carte → Sous-carte → Retour + Favoris.
 */
import { test, expect, _electron as electron } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

test.describe("Navigation Carte → Sous-carte", () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: [ROOT] });
    window = await electronApp.firstWindow();
    await window.waitForLoadState("networkidle");
    await window.waitForSelector("#map-view:not(.hidden)", { timeout: 10000 });
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test("la vue carte est ouverte par défaut", async () => {
    await expect(window.locator("#map-view")).not.toHaveClass(/hidden/);
  });

  test("le titre de la carte est mis a jour", async () => {
    const title = window.locator("#active-map-title");
    await expect(title).not.toHaveText("Carte");
  });

  test("cliquer sur une sous-carte ouvre la vue sous-carte", async () => {
    await window.waitForSelector("#zone-layer [data-submap-id]", { timeout: 10000 });
    await window.locator("#zone-layer [data-submap-id]").first().click({ force: true });
    await window.waitForSelector("#submap-view:not(.hidden)", { timeout: 10000 });

    await expect(window.locator("#submap-view")).not.toHaveClass(/hidden/);
    await expect(window.locator("#map-view")).toHaveClass(/hidden/);
  });

  test("le bouton Retour Carte ramene a la vue carte", async () => {
    await window.locator("#back-to-map").click();

    await expect(window.locator("#map-view")).not.toHaveClass(/hidden/);
    await expect(window.locator("#submap-view")).toHaveClass(/hidden/);
  });

  test("ouvrir puis quitter les favoris revient à la vue carte", async () => {
    await window.locator("#open-favorites").click();
    await expect(window.locator("#favorites-view")).not.toHaveClass(/hidden/);

    await window.locator("#back-to-world-from-favorites").click();
    await expect(window.locator("#favorites-view")).toHaveClass(/hidden/);
    await expect(window.locator("#map-view")).not.toHaveClass(/hidden/);
  });
});