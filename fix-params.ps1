# Fix Next.js 15 params issue in all route files
$routeFiles = Get-ChildItem -Path "app/api" -Filter "route.ts" -Recurse

foreach ($file in $routeFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace params type definition and add await
    $content = $content -replace '{ params }: \{ params: \{ ([^}]+) \} \}', '{ params }: { params: Promise<{ $1 }> }'
    
    # Add const resolvedParams = await params; after function declaration
    $content = $content -replace '(export async function (?:GET|POST|PUT|DELETE)\(\s*request: Request,\s*\{ params \}[^\)]*\)\s*\{)\s*', '$1`n  const resolvedParams = await params;`n  '
    
    # Replace params. with resolvedParams.
    $content = $content -replace '(?<!resolved)params\.', 'resolvedParams.'
    
    Set-Content $file.FullName -Value $content -NoNewline
    Write-Host "Fixed: $($file.FullName)"
}

Write-Host "Done fixing params in all route files"
