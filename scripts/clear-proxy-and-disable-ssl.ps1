<#
PowerShell script to remove commonly set HTTP(S) proxy environment variables and to temporarily disable Node.js TLS certificate validation.

WARNING: Disabling TLS certificate validation is insecure and should only be used temporarily for troubleshooting in a trusted environment.
#>

param(
    [switch]$Permanent
)

Write-Host "Removing npm proxy config values (if configured)" -ForegroundColor Yellow
npm config delete proxy 2>$null
npm config delete https-proxy 2>$null

Write-Host "Removing environment variables HTTP_PROXY, HTTPS_PROXY, NO_PROXY if currently set" -ForegroundColor Yellow
Remove-Item Env:HTTP_PROXY -ErrorAction SilentlyContinue
Remove-Item Env:HTTPS_PROXY -ErrorAction SilentlyContinue
Remove-Item Env:http_proxy -ErrorAction SilentlyContinue
Remove-Item Env:https_proxy -ErrorAction SilentlyContinue
Remove-Item Env:NO_PROXY -ErrorAction SilentlyContinue
Remove-Item Env:no_proxy -ErrorAction SilentlyContinue

Write-Host "Resetting WinHTTP proxy settings" -ForegroundColor Yellow
netsh winhttp reset proxy | Out-Null

if ($Permanent) {
    Write-Host "Setting NODE_TLS_REJECT_UNAUTHORIZED=0 permanently for current user (security risk)" -ForegroundColor Yellow
    setx NODE_TLS_REJECT_UNAUTHORIZED 0 | Out-Null
    Write-Host "NOTE: This will take effect in new shells and may persist across restarts. Use with caution." -ForegroundColor Red
} else {
    Write-Host "Disabling Node.js TLS certificate validation for the current PowerShell session (temporary)" -ForegroundColor Yellow
    $env:NODE_TLS_REJECT_UNAUTHORIZED = "0"
    Write-Host "The variable will be active in this PowerShell window only. Close to restore normal behavior." -ForegroundColor Green
}

Write-Host "Done. Run 'npm config list' or 'npm config get proxy' to verify no npm proxy settings remain. Use 'echo %NODE_TLS_REJECT_UNAUTHORIZED%' in CMD or $env:NODE_TLS_REJECT_UNAUTHORIZED in PowerShell to verify TLS behavior." -ForegroundColor Green
