/**
 * Tests e2e — Filtres et boutons de la vue carte.
 */
import { test, expect, _electron as electron } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

test.describe("Filtres vue carte", () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: [ROOT] });
    window = await electronApp.firstWindow();
    await window.waitForLoadState("networkidle");
    await window.waitForSelector("#map-cards .map-card", { timeout: 10000 });
    await window.locator("#map-cards .map-card").first().click();
    await expect(window.locator("#map-view")).not.toHaveClass(/hidden/);
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test("filtre Lieux est actif par defaut", async () => {
    await expect(window.locator("#filter-lieux")).toHaveClass(/active/);
    await expect(window.locator("#filter-pnj")).not.toHaveClass(/active/);
    await expect(window.locator("#filter-monstres")).not.toHaveClass(/active/);
  });

  test("cliquer sur Pnj active le filtre Pnj", async () => {
    await window.locator("#filter-pnj").click();
    await expect(window.locator("#filter-pnj")).toHaveClass(/active/);
    await expect(window.locator("#filter-lieux")).not.toHaveClass(/active/);
    // Remettre lieux pour le prochain test
    await window.locator("#filter-lieux").click();
  });

  test("cliquer sur Monstres active le filtre Monstres", async () => {
    await window.locator("#filter-monstres").click();
    await expect(window.locator("#filter-monstres")).toHaveClass(/active/);
    await expect(window.locator("#filter-lieux")).not.toHaveClass(/active/);
    await window.locator("#filter-lieux").click();
  });

  test("le bouton Titres ON bascule le texte", async () => {
    const btn = window.locator("#toggle-poi-titles");
    await expect(btn).toContainText("ON");

    await btn.click();
    await expect(btn).toContainText("OFF");

    await btn.click();
    await expect(btn).toContainText("ON");
  });
});

test.describe("Filtres vue sous-carte", () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await electron.launch({ args: [ROOT] });
    window = await electronApp.firstWindow();
    await window.waitForLoadState("networkidle");
    await window.waitForSelector("#map-cards .map-card", { timeout: 10000 });
    await window.locator("#map-cards .map-card").first().click();
    await window.waitForSelector("#zone-layer [data-submap-id]", { timeout: 10000 });
    await window.locator("#zone-layer [data-submap-id]").first().click();
    await window.waitForSelector("#submap-view:not(.hidden)", { timeout: 10000 });
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test("filtre Lieux sous-carte est actif par defaut", async () => {
    await expect(window.locator("#submap-filter-lieux")).toHaveClass(/active/);
  });

  test("cliquer sur Pnj sous-carte active le filtre", async () => {
    await window.locator("#submap-filter-pnj").click();
    await expect(window.locator("#submap-filter-pnj")).toHaveClass(/active/);
    await expect(window.locator("#submap-filter-lieux")).not.toHaveClass(/active/);
    await window.locator("#submap-filter-lieux").click();
  });

  test("le bouton Titres ON sous-carte bascule", async () => {
    const btn = window.locator("#submap-toggle-poi-titles");
    await expect(btn).toContainText("ON");
    await btn.click();
    await expect(btn).toContainText("OFF");
  });
});