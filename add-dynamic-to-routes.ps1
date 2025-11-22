# Script to add dynamic export to all API routes
$apiDir = "c:\Users\Giuliano\Documents\Dev\dashboardfaculdades\app\api"
$routeFiles = Get-ChildItem -Path $apiDir -Filter "route.ts" -Recurse

foreach ($file in $routeFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if already has dynamic export
    if ($content -notmatch "export const dynamic") {
        Write-Host "Processing: $($file.FullName)"
        
        # Find the first import or the start of the file
        $lines = Get-Content $file.FullName
        $insertIndex = 0
        
        # Find last import line
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "^import ") {
                $insertIndex = $i + 1
            }
        }
        
        # If no imports found, insert after first line (usually 'use server' or similar)
        if ($insertIndex -eq 0 -and $lines.Count -gt 0) {
            $insertIndex = 1
        }
        
        # Insert the dynamic export
        $newLines = @()
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $newLines += $lines[$i]
            if ($i -eq $insertIndex - 1) {
                $newLines += ""
                $newLines += "// Force dynamic rendering"
                $newLines += "export const dynamic = 'force-dynamic'"
            }
        }
        
        # Write back to file
        $newLines | Set-Content $file.FullName -Encoding UTF8
        Write-Host "  ✓ Added dynamic export"
    } else {
        Write-Host "Skipping (already has dynamic): $($file.FullName)"
    }
}

Write-Host "`nDone! Processed $($routeFiles.Count) files."
