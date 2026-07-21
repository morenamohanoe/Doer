import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  if (file.endsWith('logger.ts')) continue;

  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace calls
  let hasChanges = false;
  
  if (content.includes('console.error') || content.includes('console.warn') || content.includes('console.info')) {
    content = content.replace(/console\.error/g, 'logError');
    content = content.replace(/console\.warn/g, 'logWarn');
    content = content.replace(/console\.info/g, 'logInfo');
    hasChanges = true;
  }
  
  if (hasChanges) {
    // Add import statement at the top if it doesn't exist
    if (!content.includes('import { logError, logWarn, logInfo } from')) {
      const isComponent = file.includes('/components/') || file.includes('/context/') || file.includes('/hooks/');
      const isRootLevel = file === path.join(srcDir, 'App.tsx') || file === path.join(srcDir, 'main.tsx') || file === path.join(srcDir, 'types.ts');
      
      let importPath = '';
      if (isRootLevel) {
        importPath = './lib/logger';
      } else if (file.includes('/components/auth/') || file.includes('/components/admin/')) {
        importPath = '../../lib/logger';
      } else if (file.includes('/lib/')) {
        importPath = './logger';
      } else {
        importPath = '../lib/logger';
      }

      // We should check exactly what is needed to avoid unused imports, but for simplicity we can import all if they are used.
      const usedImports = [];
      if (content.includes('logError')) usedImports.push('logError');
      if (content.includes('logWarn')) usedImports.push('logWarn');
      if (content.includes('logInfo')) usedImports.push('logInfo');
      
      if (usedImports.length > 0) {
        const importLine = `import { ${usedImports.join(', ')} } from '${importPath}';\n`;
        // insert after the last import, or at the top
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
          const endOfLine = content.indexOf('\n', lastImportIndex);
          content = content.substring(0, endOfLine + 1) + importLine + content.substring(endOfLine + 1);
        } else {
          content = importLine + content;
        }
      }
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
