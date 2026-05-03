const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const archiver = require("archiver");
const { version } = require("../package.json");

const projectRoot = path.resolve(__dirname, "..");
const releaseDir = path.join(projectRoot, "release");
const productName = "Atlas NMS Revolution";
const packageFolderName = `${productName}-win32-x64`;
const packageFolderPath = path.join(releaseDir, packageFolderName);
const finalArchivePath = path.join(releaseDir, "atlas-nms-revolution.zip");

async function main() {
  await cleanRelease();
  await runPackager();
  await archivePackage();

  console.log("Build termine.");
  console.log(`Dossier extrait : ${packageFolderPath}`);
  console.log(`Archive ZIP     : ${finalArchivePath}`);
}

async function cleanRelease() {
  await fsp.rm(releaseDir, { recursive: true, force: true });
  await fsp.mkdir(releaseDir, { recursive: true });
}

async function runPackager() {
  const { packager } = await import("@electron/packager");

  const appPaths = await packager({
    dir: projectRoot,
    name: productName,
    platform: "win32",
    arch: "x64",
    out: releaseDir,
    overwrite: true,
    prune: true,
    appVersion: version,
    ignore: [/^\/release$/],
    electronDownload: { unsafelyDisableChecksums: true },
  });

  if (!appPaths?.length) {
    console.error("electron-packager n'a produit aucun dossier.");
    process.exit(1);
  }
}

function archivePackage() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(finalArchivePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(packageFolderPath, packageFolderName);
    archive.finalize();
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
