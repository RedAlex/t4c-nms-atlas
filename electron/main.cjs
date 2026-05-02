const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { checkForUpdates } = require("./updater.cjs");

const isDev = process.argv.includes("--dev");

function isExternalHttpUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_err) {
    return false;
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isExternalHttpUrl(url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isExternalHttpUrl(url)) return;
    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.loadFile(path.join(__dirname, "..", "index.html"), {
    query: isDev ? { dev: "1" } : {},
  });

  mainWindow.webContents.once("did-finish-load", () => {
    checkForUpdates(mainWindow);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
