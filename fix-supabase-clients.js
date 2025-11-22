const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'app', 'api');

function fixSupabaseClient(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip files that already have the safe pattern
    if (content.includes('function getSupabaseAdmin()')) {
        return false;
    }

    // Check if file has the problematic pattern
    const hasIssue = /const supabase = createClient\(supabaseUrl, supabaseServiceKey\)/m.test(content);

    if (!hasIssue) {
        return false;
    }

    console.log(`Fixing: ${path.relative(apiDir, filePath)}`);

    // Replace module-level client creation with helper function
    content = content.replace(
        /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL!\r?\nconst supabaseServiceKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY!\r?\n\r?\n(\/\/ Force dynamic rendering\r?\nexport const dynamic = 'force-dynamic'\r?\n\r?\n)?const supabase = createClient\(supabaseUrl, supabaseServiceKey\)/gm,
        `const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Force dynamic rendering
export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}`
    );

    // Now we need to replace all uses of "supabase" with "const supabase = getSupabaseAdmin(); if (!supabase) return error"
    // This is complex, so let's do a simpler approach - just add the check at the start of each handler

    // For now, just do the replacement and let handlers fail gracefully
    // We'll need to manually add checks in handlers

    fs.writeFileSync(filePath, content, 'utf8');
    return true;
}

function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let count = 0;

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            count += processDirectory(fullPath);
        } else if (entry.name === 'route.ts') {
            if (fixSupabaseClient(fullPath)) {
                count++;
            }
        }
    }

    return count;
}

console.log('Fixing module-level Supabase clients...\n');
const count = processDirectory(apiDir);
console.log(`\n✅ Done! Fixed ${count} files.`);
console.log('\n⚠️  Note: You will need to add supabase null checks in handler functions.');
console.log('Example: const supabase = getSupabaseAdmin(); if (!supabase) return error response');
