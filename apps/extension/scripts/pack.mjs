import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(extRoot, "../..");
const publicDownloads = path.join(repoRoot, "apps", "web", "public", "downloads");
const outZip = path.join(publicDownloads, "scopebomb-mv3-extension.zip");

// 1. Build engine modules first
console.log("Building extension engine...");
execSync(`node ${path.join(__dirname, "build.mjs")}`, { stdio: "inherit" });

// 2. Package into zip via Python zipfile
fs.mkdirSync(publicDownloads, { recursive: true });
console.log(`Packaging extension into ${outZip}...`);

const pyScript = `
import zipfile, os
ext_dir = "${extRoot}"
out_zip = "${outZip}"
include_files = ["manifest.json", "background.js", "content.js", "guard.html", "guard.js", "popup.html", "popup.js", "shared.js", "styles.css"]
include_dirs = ["icons", "engine"]
with zipfile.ZipFile(out_zip, "w", zipfile.ZIP_DEFLATED) as z:
    for f in include_files:
        full_path = os.path.join(ext_dir, f)
        if os.path.exists(full_path):
            z.write(full_path, arcname=f)
    for d in include_dirs:
        dir_path = os.path.join(ext_dir, d)
        for root, dirs, files in os.walk(dir_path):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, ext_dir)
                z.write(full_path, arcname=rel_path)
print("Zip package complete")
`;

execSync(`python3 -c '${pyScript}'`, { stdio: "inherit" });
console.log("Chrome MV3 extension zip ready.");
