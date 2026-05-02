/**
 * Tests e2e — Lancement de l''application et vue monde.
 */
import { test, expect, _electron as electron } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

test.describe("Lancement de l''application", () => {
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

  test("affiche la vue monde avec les cartes", async () => {
    const worldView = window.locator("#world-view");
    await expect(worldView).toBeVisible();

    await window.waitForSelector("#map-cards .map-card", { timeout: 10000 });
    const cards = window.locator("#map-cards .map-card");
    await expect(cards).toHaveCount(4);
  });

  test("les vues carte et sous-carte sont masquees au demarrage", async () => {
    await expect(window.locator("#map-view")).toHaveClass(/hidden/);
    await expect(window.locator("#submap-view")).toHaveClass(/hidden/);
  });

  test("affiche la version dans le footer", async () => {
    const versionEl = window.locator("#app-version");
    await expect(versionEl).toBeVisible();
    const text = await versionEl.textContent();
    expect(text).toMatch(/^v/);
  });

  test("affiche les noms des 4 regions", async () => {
    await window.waitForSelector("#map-cards .map-card", { timeout: 10000 });
    const cardTitles = await window.locator("#map-cards .map-card h3").allTextContents();
    expect(cardTitles).toContain("Arakas");
    expect(cardTitles.some((t) => t.includes("Raven"))).toBe(true);
    expect(cardTitles).toContain("Stoneheim");
    expect(cardTitles).toContain("Drake Island");
  });
});