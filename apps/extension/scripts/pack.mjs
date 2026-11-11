import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scripts = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scripts, "..");
const output = path.resolve(root, "../web/public/downloads/scopebomb-mv3-extension.zip");
execFileSync(process.execPath, [path.join(scripts, "build.mjs")], { stdio: "inherit" });
mkdirSync(path.dirname(output), { recursive: true });
// Fixed timestamps and sorted entries make the committed download reproducible.
execFileSync("python3", ["-c", `
import pathlib, sys, zipfile
root, output = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
files = [root / name for name in ["manifest.json", "background.js", "content.js", "guard.html", "guard.js", "popup.html", "popup.js", "shared.js", "styles.css"]]
files += list((root / "icons").glob("*.png")) + list((root / "engine").glob("*.js"))
with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(files):
        info = zipfile.ZipInfo(file.relative_to(root).as_posix(), (2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, file.read_bytes())
print(f"Packaged {len(files)} extension files")
`, root, output], { stdio: "inherit" });
