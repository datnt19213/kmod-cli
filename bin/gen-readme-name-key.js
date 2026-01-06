import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readmePath = path.join(__dirname, '../README.md');
const componentsPath = path.join(__dirname, '../components.json');

// đọc components.json
const componentsConfig = JSON.parse(
  fs.readFileSync(componentsPath, 'utf8')
);

// build list
const componentList = Object.keys(componentsConfig)
  .map((k) => `- ${k}`)
  .join('\n');

// đọc README
const readmeContent = fs.readFileSync(readmePath, 'utf8');

// regex tìm block ## Components
const regex = /## Components[\s\S]*?(?=\n## |\n?$)/;

if (!regex.test(readmeContent)) {
  throw new Error('Không tìm thấy heading "## Components" trong README.md');
}

const newReadme = readmeContent.replace(
  regex,
  `## Components\n\n${componentList}`
);

// ghi lại README
fs.writeFileSync(readmePath, newReadme);

console.log('✅ Updated README.md');