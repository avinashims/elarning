# Start backend + mobile app for phone testing (same Wi-Fi)
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $projectRoot "backend"
$mobilePath = Join-Path $projectRoot "mobile"

# Get LAN IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
  $_.InterfaceAlias -notmatch "Loopback" -and $_.IPAddress -notlike "169.254*"
} | Select-Object -First 1).IPAddress

if (-not $ip) {
  $ip = "192.168.1.5"
  Write-Host "Could not detect IP. Using placeholder: $ip" -ForegroundColor Yellow
}

$apiUrl = "http://${ip}:5000/api"
$envFile = Join-Path $mobilePath ".env"

@"
EXPO_PUBLIC_API_URL=$apiUrl
"@ | Set-Content -Path $envFile -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Udemy Mobile App Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API URL saved to mobile/.env:" -ForegroundColor Green
Write-Host "  $apiUrl" -ForegroundColor White
Write-Host ""
Write-Host "1. Install Expo Go on your phone" -ForegroundColor Yellow
Write-Host "2. Phone and PC must be on SAME Wi-Fi" -ForegroundColor Yellow
Write-Host "3. Scan QR code when Expo starts" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting backend in new window..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "Starting Expo..." -ForegroundColor Cyan
Set-Location $mobilePath
npm start
