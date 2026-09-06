$base = "d:\collab\Pilah-Sampah-Cerdas\lib\app\modules"

# 1. Move reset_bin_view.dart to auth module
if (Test-Path "$base\reset\views\reset_bin_view.dart") {
    Move-Item "$base\reset\views\reset_bin_view.dart" "$base\auth\views\reset_bin_view.dart" -Force
    Remove-Item "$base\reset" -Recurse -Force
}

# 2. Flatten single-file modules
$modulesToFlatten = @("beranda", "main", "petugas", "poin", "profil", "splash", "tentang")

foreach ($mod in $modulesToFlatten) {
    if (Test-Path "$base\$mod\views") {
        $files = Get-ChildItem "$base\$mod\views" -File
        if ($files.Count -eq 1) {
            Move-Item $files[0].FullName "$base\$mod\$($files[0].Name)" -Force
            Remove-Item "$base\$mod\views" -Force
        }
    }
}
Write-Output "Flattening complete."
