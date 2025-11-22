const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'app', 'api');

function addDynamicExport(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if already has dynamic export
    if (content.includes('export const dynamic')) {
        console.log(`✓ Skip: ${path.relative(apiDir, filePath)}`);
        return false;
    }

    // Add after imports, before any other code
    // Find the last import statement
    const lines = content.split(/\r?\n/);
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('import{')) {
            lastImportIndex = i;
        }
    }

    // If we found imports, insert after them
    if (lastImportIndex >= 0) {
        const insertLines = [
            '',
            '// Force dynamic rendering',
            "export const dynamic = 'force-dynamic'"
        ];

        lines.splice(lastImportIndex + 1, 0, ...insertLines);

        // Write back with original line endings
        const newContent = lines.join('\r\n');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✓ Added: ${path.relative(apiDir, filePath)}`);
        return true;
    } else {
        console.log(`⚠ No imports found: ${path.relative(apiDir, filePath)}`);
        return false;
    }
}

function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let count = 0;

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            count += processDirectory(fullPath);
        } else if (entry.name === 'route.ts') {
            if (addDynamicExport(fullPath)) {
                count++;
            }
        }
    }

    return count;
}

console.log('Adding dynamic export to API routes...\n');
const count = processDirectory(apiDir);
console.log(`\n✅ Done! Modified ${count} files.`);
