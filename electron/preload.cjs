const { contextBridge } = require("electron");
const fs = require("fs/promises");
const path = require("path");

async function readMapsData() {
  const mapsPath = path.join(__dirname, "..", "data", "maps.json");
  const raw = await fs.readFile(mapsPath, "utf-8");
  return JSON.parse(raw);
}

contextBridge.exposeInMainWorld("desktopAPI", {
  readMapsData,
});
