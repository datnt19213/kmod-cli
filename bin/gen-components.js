#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.join(__dirname, "../component-templates");
const outPath = path.join(__dirname, "../components.json");

// ================= Helpers =================
function extractDepsFromFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  const deps = new Set();
  let match;
  while ((match = importRegex.exec(content))) {
    const dep = match[1];
    if (!dep.startsWith(".") && !dep.startsWith("/")) {
        if (dep === "react" || dep.startsWith("next") || dep === "@/lib/utils") {
          continue;
        }
      deps.add(dep);
    }
  }
  return [...deps];
  
}


function normalizePath(p) {
  return p.split(path.sep).join("/"); // thay \ bằng /
}

function scanTemplates(dir, base = "component-templates") {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const results = {};

  for (const item of items) {
    const relPath = normalizePath(path.join(base, item.name));
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      // đệ quy scan folder con
      Object.assign(results, scanTemplates(fullPath, relPath));
    } else if (item.isFile() && (item.name.endsWith(".tsx") || item.name.endsWith(".ts"))) {
      // mỗi file = 1 component
      const compName = path.parse(item.name).name;
      const deps = extractDepsFromFile(fullPath);

      results[compName] = {
        path: relPath,
        dependencies: deps,
        devDependencies: [],
      };
    }
  }

  return results;
}

// ================= Run =================
const components = scanTemplates(templatesDir);

fs.writeFileSync(outPath, JSON.stringify(components, null, 2));



console.log(`✅ Generated components.json with ${Object.keys(components).length} entries`);
