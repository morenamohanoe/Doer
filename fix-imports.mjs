import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let hasChanges = false;
  // If we see "import {\nimport { log" we know it's messed up
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'import {' && lines[i+1] && lines[i+1].trim().startsWith('import { log')) {
      const logImport = lines[i+1];
      lines.splice(i+1, 1); // remove it
      lines.unshift(logImport); // put at top
      hasChanges = true;
    }
  }
  if (hasChanges) {
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    console.log('Fixed', file);
  }
}

function getTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getTsFiles(filePath, fileList);
    } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const srcDir = path.join(__dirname, 'src');
const allFiles = getTsFiles(srcDir);
for (const file of allFiles) {
  fixFile(file);
}
