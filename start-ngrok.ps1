Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Ngrok Tunneling for pilahsampah.id " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if ngrok is installed/in PATH
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue

if (-not $ngrokPath) {
    Write-Host "`n[Peringatan] ngrok tidak ditemukan di environment PATH Anda." -ForegroundColor Yellow
    Write-Host "Silakan install ngrok (https://ngrok.com/download) terlebih dahulu." -ForegroundColor Yellow
    Write-Host "Jika sudah terinstall, jalankan perintah berikut secara manual di terminal Anda:" -ForegroundColor Green
    Write-Host "  ngrok http 3000`n" -ForegroundColor Green
    exit 1
}

Write-Host "Menghubungkan port lokal 3000 ke domain publik HTTPS..." -ForegroundColor Green
Start-Process ngrok -ArgumentList "http 3000" -NoNewWindow
Write-Host "`nNgrok berhasil dijalankan!" -ForegroundColor Green
Write-Host "Salin domain HTTPS yang digenerate oleh Ngrok dan tempelkan ke konfigurasi Flutter mobile Anda." -ForegroundColor Yellow
