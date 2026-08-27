# Script Helper: Memicu Build iOS dari Windows menggunakan GitHub Actions / CLI
Param(
    [string]$Branch = "development",
    [switch]$Signed = $false
)

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "   BERSEKA Mobile - Trigger iOS Build from Windows    " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Cek apakah Git dan GitHub CLI (gh) terinstall
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghInstalled) {
    Write-Host "[INFO] GitHub CLI ('gh') belum terpasang." -ForegroundColor Yellow
    Write-Host "Anda dapat memicu build iOS dengan 2 cara:" -ForegroundColor White
    Write-Host "1. Buka repositori GitHub di Browser -> Menu 'Actions' -> 'BERSEKA Mobile — iOS Build Pipeline' -> 'Run workflow'." -ForegroundColor Green
    Write-Host "2. Atau install GitHub CLI: 'winget install GitHub.cli' lalu jalankan ulang script ini." -ForegroundColor White
    exit 0
}

# 2. Trigger workflow via GitHub CLI
Write-Host "[1/2] Memicu GitHub Actions macOS Runner..." -ForegroundColor Cyan
$signFlag = if ($Signed) { "true" } else { "false" }

gh workflow run build_ios.yml --ref $Branch -f sign_ipa=$signFlag

if ($LASTEXITCODE -eq 0) {
    Write-Host "[2/2] Workflow berhasil dipicu! Memantau status build..." -ForegroundColor Green
    Start-Sleep -Seconds 3
    gh run list --workflow=build_ios.yml --limit 1
    Write-Host ""
    Write-Host "[SELESAI] Hasil build .ipa dapat diunduh pada tab Artifacts di GitHub Actions setelah selesai (~5-10 menit)." -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Gagal memicu workflow. Pastikan sudah login: 'gh auth login'" -ForegroundColor Red
}
