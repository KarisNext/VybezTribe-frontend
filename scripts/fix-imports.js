
/**
 * FRONTEND Import Fixer - Prebuild Script
 * Fixes TypeScript/React component import casing issues only
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Frontend TypeScript Imports...\n');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Build map of actual React component files
function buildComponentMap(dir, map = {}) {
  if (!fs.existsSync(dir)) return map;
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  items.forEach(item => {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      buildComponentMap(fullPath, map);
    } else if (item.isFile() && /\.(tsx|ts|jsx|js)$/.test(item.name)) {
      // This is a React component or TypeScript file
      const relativePath = path.relative(SRC_DIR, fullPath);
      const withoutExt = relativePath.replace(/\.(tsx|ts|jsx|js)$/, '');
      const key = withoutExt.toLowerCase();
      map[key] = withoutExt; // Store actual case
    }
  });
  
  return map;
}

// Fix import statements in TypeScript/React files
function fixImportsInFile(filePath, componentMap) {
  if (!filePath.includes('.ts') && !filePath.includes('.js')) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix @/ alias imports (frontend components only)
  const importRegex = /from\s+['"]@\/([^'"]+)['"]/g;
  
  content = content.replace(importRegex, (match, importPath) => {
    const key = importPath.toLowerCase();
    
    if (componentMap[key] && componentMap[key] !== importPath) {
      console.log(`  ✓ Fixed import: @/${importPath} → @/${componentMap[key]}`);
      modified = true;
      return `from '@/${componentMap[key]}'`;
    }
    
    return match;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  return modified;
}

// Scan and fix all TypeScript/React files
function scanAndFixFiles(dir, componentMap) {
  if (!fs.existsSync(dir)) return 0;
  
  let fixedCount = 0;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  items.forEach(item => {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory() && !item.name.startsWith('.')) {
      fixedCount += scanAndFixFiles(fullPath, componentMap);
    } else if (item.isFile() && /\.(tsx|ts|jsx|js)$/.test(item.name)) {
      if (fixImportsInFile(fullPath, componentMap)) {
        fixedCount++;
      }
    }
  });
  
  return fixedCount;
}

// Main execution - FRONTEND ONLY
try {
  console.log('📂 Scanning React components...');
  const componentMap = buildComponentMap(SRC_DIR);
  console.log(`✓ Found ${Object.keys(componentMap).length} component files\n`);
  
  console.log('🔍 Checking import statements...\n');
  const fixedCount = scanAndFixFiles(SRC_DIR, componentMap);
  
  console.log(`\n✅ Frontend import fixer complete!`);
  console.log(`   Fixed ${fixedCount} files with import casing issues`);
  console.log(`   Ready for build! 🚀\n`);
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Import fixer error:', error.message);
  console.log('   Continuing build...\n');
  process.exit(0);
}
