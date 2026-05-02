/**
 * Tests e2e — Navigation Monde → Carte → Sous-carte → Retour.
 */
import { test, expect, _electron as electron } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

test.describe("Navigation Monde → Carte → Sous-carte", () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: [ROOT] });
    window = await electronApp.firstWindow();
    await window.waitForLoadState("networkidle");
    await window.waitForSelector("#map-cards .map-card", { timeout: 10000 });
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test("cliquer sur une carte ouvre la vue carte", async () => {
    await window.locator("#map-cards .map-card").first().click();

    await expect(window.locator("#world-view")).toHaveClass(/hidden/);
    await expect(window.locator("#map-view")).not.toHaveClass(/hidden/);
  });

  test("le titre de la carte est mis a jour", async () => {
    const title = window.locator("#active-map-title");
    await expect(title).not.toHaveText("Carte");
  });

  test("cliquer sur une sous-carte ouvre la vue sous-carte", async () => {
    await window.waitForSelector("#zone-layer [data-submap-id]", { timeout: 10000 });
    await window.locator("#zone-layer [data-submap-id]").first().click();
    await window.waitForSelector("#submap-view:not(.hidden)", { timeout: 10000 });

    await expect(window.locator("#submap-view")).not.toHaveClass(/hidden/);
    await expect(window.locator("#map-view")).toHaveClass(/hidden/);
  });

  test("le bouton Retour Carte ramene a la vue carte", async () => {
    await window.locator("#back-to-map").click();

    await expect(window.locator("#map-view")).not.toHaveClass(/hidden/);
    await expect(window.locator("#submap-view")).toHaveClass(/hidden/);
  });

  test("le bouton Retour Mondes ramene a la vue monde", async () => {
    await window.locator("#back-to-world").click();

    await expect(window.locator("#world-view")).not.toHaveClass(/hidden/);
    await expect(window.locator("#map-view")).toHaveClass(/hidden/);
  });
});