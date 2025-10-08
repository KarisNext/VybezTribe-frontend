#!/usr/bin/env node

/**
 * Auto Import Fixer - Prebuild Script
 * This script runs before build and automatically fixes import casing issues
 * It scans all TypeScript/JavaScript files and corrects imports to match actual file names
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Running Import Fixer...\n');

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');

// Build a map of actual file names (case-sensitive)
function buildFileMap(dir, map = {}) {
  if (!fs.existsSync(dir)) return map;
  
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  items.forEach(item => {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      buildFileMap(fullPath, map);
    } else if (item.isFile() && /\.(tsx|ts|jsx|js)$/.test(item.name)) {
      const relativePath = path.relative(SRC_DIR, fullPath);
      const withoutExt = relativePath.replace(/\.(tsx|ts|jsx|js)$/, '');
      const key = withoutExt.toLowerCase();
      map[key] = withoutExt;
    }
  });
  
  return map;
}

// Fix imports in a file
function fixImportsInFile(filePath, fileMap) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Match import statements with @ aliases
  const importRegex = /from\s+['"]@\/([^'"]+)['"]/g;
  
  content = content.replace(importRegex, (match, importPath) => {
    const key = importPath.toLowerCase();
    
    if (fileMap[key] && fileMap[key] !== importPath) {
      console.log(`  ✓ Fixed: @/${importPath} → @/${fileMap[key]}`);
      modified = true;
      return `from '@/${fileMap[key]}'`;
    }
    
    return match;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Scan and fix all files
function scanAndFix(dir, fileMap) {
  if (!fs.existsSync(dir)) return 0;
  
  let fixedCount = 0;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  items.forEach(item => {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory() && !item.name.startsWith('.')) {
      fixedCount += scanAndFix(fullPath, fileMap);
    } else if (item.isFile() && /\.(tsx|ts|jsx|js)$/.test(item.name)) {
      const relativePath = path.relative(SRC_DIR, fullPath);
      console.log(`📄 Checking: ${relativePath}`);
      
      if (fixImportsInFile(fullPath, fileMap)) {
        fixedCount++;
      }
    }
  });
  
  return fixedCount;
}

// Main execution
try {
  console.log('📂 Building file map...');
  const fileMap = buildFileMap(COMPONENTS_DIR);
  console.log(`✓ Found ${Object.keys(fileMap).length} component files\n`);
  
  console.log('🔍 Scanning for import issues...\n');
  const fixedCount = scanAndFix(SRC_DIR, fileMap);
  
  console.log(`\n✅ Import fixer complete!`);
  console.log(`   Files fixed: ${fixedCount}`);
  console.log(`   Ready to build! 🚀\n`);
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Error running import fixer:', error.message);
  console.error('   Continuing with build anyway...\n');
  process.exit(0); // Don't fail the build
}
