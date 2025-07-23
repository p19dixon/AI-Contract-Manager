// Node.js script to verify our resize handle implementation
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Resize Handle Implementation...\n');

// Files to check
const filesToCheck = [
  'src/components/ui/data-table.tsx',
  'src/pages/ContractsPage.tsx',
  'src/pages/ResellersPage.tsx'
];

// Expected patterns
const patterns = {
  inlineStyles: /backgroundColor: '#d1d5db'/,
  mouseEvents: /onMouseEnter.*onMouseLeave/,
  positioning: /right: '-4px'/,
  width: /width: '8px'/,
  zIndex: /zIndex: 10/
};

let allGood = true;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    allGood = false;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`📁 Checking ${file}:`);
  
  Object.entries(patterns).forEach(([name, pattern]) => {
    const found = pattern.test(content);
    console.log(`  ${found ? '✅' : '❌'} ${name}: ${found ? 'Found' : 'Missing'}`);
    if (!found) allGood = false;
  });
  
  // Count resize handles
  const handleMatches = content.match(/title="Drag to resize column"/g);
  const handleCount = handleMatches ? handleMatches.length : 0;
  console.log(`  📊 Resize handles found: ${handleCount}`);
  
  console.log('');
});

// Check test file
const testFile = 'src/components/ui/data-table.test.tsx';
const testPath = path.join(__dirname, testFile);

if (fs.existsSync(testPath)) {
  const testContent = fs.readFileSync(testPath, 'utf8');
  console.log(`🧪 Checking ${testFile}:`);
  
  const hasUpdatedTest = /toHaveStyle.*background-color.*#d1d5db/.test(testContent);
  console.log(`  ${hasUpdatedTest ? '✅' : '❌'} Updated test for inline styles: ${hasUpdatedTest ? 'Found' : 'Missing'}`);
  
  if (!hasUpdatedTest) allGood = false;
} else {
  console.log(`❌ Test file not found: ${testFile}`);
  allGood = false;
}

console.log('\n' + '='.repeat(50));
console.log(`🎯 Overall Status: ${allGood ? '✅ ALL CHECKS PASSED' : '❌ SOME ISSUES FOUND'}`);

if (allGood) {
  console.log('✨ Implementation looks correct!');
  console.log('📍 Next steps:');
  console.log('  1. Open http://localhost:3000/contracts');
  console.log('  2. Look for grey resize handles between column headers');
  console.log('  3. Try dragging the handles to resize columns');
  console.log('  4. Check that handles become darker on hover');
} else {
  console.log('⚠️  Please review and fix the issues above.');
}

console.log('='.repeat(50));