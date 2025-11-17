# View Latest Test Results
# This script opens the most recent test report

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TEMPLE PLATFORM - View Latest Test Results" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

$testResultsDir = "test-results"

# Check if test-results directory exists
if (-not (Test-Path $testResultsDir)) {
    Write-Host "[ERROR] No test results found!" -ForegroundColor Red
    Write-Host "Run tests first with: npm run test:all`n" -ForegroundColor Yellow
    pause
    exit 1
}

# Get the latest test report
$latestReport = Get-ChildItem "$testResultsDir\test-report-*.txt" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $latestReport) {
    Write-Host "[ERROR] No test reports found!" -ForegroundColor Red
    Write-Host "Run tests first with: npm run test:all`n" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "[INFO] Opening latest test report:" -ForegroundColor Green
Write-Host "      $($latestReport.Name)`n" -ForegroundColor White

# Open in notepad
notepad $latestReport.FullName

# Also show summary
Write-Host "`n[INFO] Test Results Summary:" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$latestSummary = Get-ChildItem "$testResultsDir\test-summary-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestSummary) {
    $summary = Get-Content $latestSummary.FullName | ConvertFrom-Json
    
    Write-Host "Total Tests:  $($summary.totalTests)" -ForegroundColor White
    Write-Host "Passed:       " -NoNewline -ForegroundColor White
    Write-Host "$($summary.passed)" -ForegroundColor Green
    Write-Host "Failed:       " -NoNewline -ForegroundColor White
    Write-Host "$($summary.failed)" -ForegroundColor Red
    Write-Host "Errors:       " -NoNewline -ForegroundColor White
    Write-Host "$($summary.errors)" -ForegroundColor Yellow
    Write-Host "Skipped:      " -NoNewline -ForegroundColor White
    Write-Host "$($summary.skipped)" -ForegroundColor Gray
    Write-Host "Duration:     $([math]::Round($summary.duration / 1000, 2))s" -ForegroundColor White
    Write-Host "Generated:    $($summary.timestamp)" -ForegroundColor Gray
}

Write-Host "============================================================`n" -ForegroundColor Cyan

# Ask if user wants to see issues
$latestIssues = Get-ChildItem "$testResultsDir\test-issues-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($latestIssues) {
    $issues = Get-Content $latestIssues.FullName | ConvertFrom-Json
    $issueCount = $issues.Count
    
    if ($issueCount -gt 0) {
        Write-Host "[INFO] Found $issueCount issues that need fixing" -ForegroundColor Yellow
        $response = Read-Host "Do you want to view the issues file? (Y/N)"
        
        if ($response -eq 'Y' -or $response -eq 'y') {
            notepad $latestIssues.FullName
        }
    } else {
        Write-Host "[SUCCESS] All tests passed! No issues found." -ForegroundColor Green
    }
}

# Ask if user wants to open dashboard
Write-Host "`n[INFO] You can also view results in the interactive dashboard" -ForegroundColor Cyan
$response = Read-Host "Do you want to open the dashboard? (Y/N)"

if ($response -eq 'Y' -or $response -eq 'y') {
    $dashboardPath = "test-suite\dashboard.html"
    if (Test-Path $dashboardPath) {
        Start-Process $dashboardPath
        Write-Host "`n[INFO] Dashboard opened in browser" -ForegroundColor Green
        Write-Host "      Click 'Load Test Results' and select:" -ForegroundColor White
        $latestResults = Get-ChildItem "$testResultsDir\test-results-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        Write-Host "      $($latestResults.Name)" -ForegroundColor Yellow
    }
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
