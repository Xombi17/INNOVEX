import fs from "node:fs";
import path from "node:path";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(extRoot, "../..");
const engineSrcDir = path.join(repoRoot, "packages", "engine");
const catalogPath = path.join(repoRoot, "data", "scope_catalog.json");
const outDir = path.join(extRoot, "engine");

async function loadTranspiler() {
  try {
    stripTypeScriptTypes("const x: number = 1;", { mode: "strip" });
    return (src) => stripTypeScriptTypes(src, { mode: "strip" });
  } catch {
    const tsPath = path.join(
      repoRoot,
      "apps",
      "web",
      "node_modules",
      "typescript",
      "lib",
      "typescript.js",
    );
    const tsMod = await import(pathToFileURL(tsPath).href);
    const ts = tsMod.default ?? tsMod;
    return (src) =>
      ts.transpileModule(src, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          removeComments: false,
        },
      }).outputText;
  }
}

const transpileTs = await loadTranspiler();
fs.mkdirSync(outDir, { recursive: true });

// 1. Emit frozen scope_catalog.json as an ES module so Chrome MV3 never needs JSON import attributes.
const catalogJson = fs.readFileSync(catalogPath, "utf8");
fs.writeFileSync(
  path.join(outDir, "scope_catalog.js"),
  `// Generated from data/scope_catalog.json by scripts/build.mjs — do not edit manually.\nexport default ${catalogJson.trim()};\n`,
  "utf8",
);

// 2. Transpile packages/engine/*.ts -> apps/extension/engine/*.js
const engineFiles = [
  "catalog.ts",
  "parsers.ts",
  "graph.ts",
  "containment.ts",
  "pre-consent.ts",
  "index.ts",
];

for (const fileName of engineFiles) {
  const src = fs.readFileSync(path.join(engineSrcDir, fileName), "utf8");
  let js = transpileTs(src);
  js = js
    .replace(
      /from\s+["']\.\.\/\.\.\/data\/scope_catalog\.json["']\s*(?:with\s*\{\s*type:\s*["']json["']\s*\})?/g,
      'from "./scope_catalog.js"',
    )
    .replace(/(from\s+["']\.\/[a-zA-Z0-9_-]+)\.ts(["'])/g, "$1.js$2");

  const outFile = path.join(outDir, fileName.replace(/\.ts$/, ".js"));
  fs.writeFileSync(
    outFile,
    `// Generated from packages/engine/${fileName} by scripts/build.mjs — do not edit manually.\n${js}`,
    "utf8",
  );
}

console.log(
  `Built ${engineFiles.length + 1} MV3 engine modules into ${path.relative(repoRoot, outDir)}`,
);
