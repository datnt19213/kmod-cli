#!/usr/bin/env node
import { execSync } from 'child_process';
import { Command } from 'commander';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';

const program = new Command();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, "..");
const templatesDir = path.join(rootDir, "templates");
const componentsConfig = fs.readJsonSync(
  path.join(rootDir, "components.json")
);

// ====================== Helpers ======================
function detectPackageManager() {
  if (fs.existsSync("pnpm-lock.yaml")) return "pnpm";
  if (fs.existsSync("yarn.lock")) return "yarn";
  return "npm";
}

function installDeps(deps, dev = false) {
  if (!deps || deps.length === 0) return;

  const pm = detectPackageManager();
  const cmd =
    pm === "yarn"
      ? `yarn add ${deps.join(" ")} ${dev ? "-D" : ""}`
      : pm === "pnpm"
      ? `pnpm add ${deps.join(" ")} ${dev ? "-D" : ""}`
      : `npm install ${deps.join(" ")} ${dev ? "--save-dev" : ""}`;

  console.log(`📦 Installing: ${deps.join(", ")} ...`);
  execSync(cmd, { stdio: "inherit" });
}

function getUserPackageJson() {
  const pjPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(pjPath)) return null;
  return fs.readJsonSync(pjPath);
}

function getMissingDeps(userPkg, deps = [], devDeps = []) {
  const installed = {
    ...userPkg.dependencies,
    ...userPkg.devDependencies,
  };

  const missingDeps = deps.filter((d) => !installed[d]);
  const missingDevDeps = devDeps.filter((d) => !installed[d]);

  return { missingDeps, missingDevDeps };
}

async function copyComponent(name, collectedDeps) {
  const comp = componentsConfig[name];
  if (!comp) {
    console.error(`❌ Component not found: ${name}`);
    return;
  }

  const src = path.join(rootDir, comp.path);

  // Base: src/custom
  const destBase = path.join(process.cwd(), "src", "custom");
  await fs.ensureDir(destBase);

  // Giữ nguyên cấu trúc bên trong component-templates
  const relPath = comp.path.replace(/^component-templates[\\/]/, "");
  const dest = path.join(destBase, relPath);

  await fs.copy(src, dest, { overwrite: false });
  console.log(`✅ Copied to src/custom/${relPath}`);

  // Collect deps
  const userPkg = getUserPackageJson();
  if (!userPkg) return;

  const { missingDeps, missingDevDeps } = getMissingDeps(
    userPkg,
    comp.dependencies,
    comp.devDependencies
  );

  if (missingDeps.length) collectedDeps.deps.push(...missingDeps);
  if (missingDevDeps.length) collectedDeps.devDeps.push(...missingDevDeps);
}

async function addComponents() {
  const choices = Object.keys(componentsConfig);

  const answers = await inquirer.prompt([
    {
      type: "checkbox",
      name: "selected",
      message: "Select components to add:",
      choices: [{ name: "✨ All", value: "--all" }, ...choices],
    },
  ]);

  const collectedDeps = { deps: [], devDeps: [] };

  if (answers.selected.includes("--all")) {
    for (const c of choices) {
      await copyComponent(c, collectedDeps);
    }
  } else {
    for (const c of answers.selected) {
      await copyComponent(c, collectedDeps);
    }
  }

  // Remove duplicates
  collectedDeps.deps = [...new Set(collectedDeps.deps)];
  collectedDeps.devDeps = [...new Set(collectedDeps.devDeps)];

  if (collectedDeps.deps.length || collectedDeps.devDeps.length) {
    console.log(`⚠️ Missing packages detected:`);

    if (collectedDeps.deps.length)
      console.log("  - deps:", collectedDeps.deps.join(", "));
    if (collectedDeps.devDeps.length)
      console.log("  - devDeps:", collectedDeps.devDeps.join(", "));

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Install all missing packages now?",
        default: true,
      },
    ]);

    if (confirm) {
      if (collectedDeps.deps.length) installDeps(collectedDeps.deps, false);
      if (collectedDeps.devDeps.length) installDeps(collectedDeps.devDeps, true);
    }
  }
}

async function addComponentsByName(names) {
  const collectedDeps = { deps: [], devDeps: [] };

  for (const name of names) {
    await copyComponent(name, collectedDeps);
  }

  collectedDeps.deps = [...new Set(collectedDeps.deps)];
  collectedDeps.devDeps = [...new Set(collectedDeps.devDeps)];

  if (collectedDeps.deps.length || collectedDeps.devDeps.length) {
    console.log(`⚠️ Missing packages detected:`);

    if (collectedDeps.deps.length)
      console.log("  - deps:", collectedDeps.deps.join(", "));
    if (collectedDeps.devDeps.length)
      console.log("  - devDeps:", collectedDeps.devDeps.join(", "));

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Install all missing packages now?",
        default: true,
      },
    ]);

    if (confirm) {
      if (collectedDeps.deps.length) installDeps(collectedDeps.deps, false);
      if (collectedDeps.devDeps.length) installDeps(collectedDeps.devDeps, true);
    }
  }
}


// ====================== CLI Commands ======================
program
  .name("kumod")
  .description("CLI to copy component/templates into project")
  .version("1.0.0");

program.command("add").description("Select components to add").action(addComponents);
program
  .command("add [components...]")
  .description("Add components by name or select interactively")
  .action(async (components) => {
    if (components.length > 0) {
      await addComponentsByName(components);
    } else {
      await addComponents();
    }
  });


program.parse(process.argv);
