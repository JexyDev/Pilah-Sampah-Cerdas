$base = "d:\collab\Pilah-Sampah-Cerdas\lib\app\modules"
if (Test-Path "$base\main") { Rename-Item "$base\main" "main_shell" -Force }
if (Test-Path "$base\kkn") { Rename-Item "$base\kkn" "monitoring_warga" -Force }
if (Test-Path "$base\petugas") { Rename-Item "$base\petugas" "petugas_residu" -Force }
Write-Output "Directories renamed"
