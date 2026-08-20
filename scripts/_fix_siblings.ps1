$filesDepth4 = @(
    "d:\collab\Pilah-Sampah-Cerdas\lib\app\modules\dashboard\dashboard_view.dart",
    "d:\collab\Pilah-Sampah-Cerdas\lib\app\modules\beranda\beranda_view.dart",
    "d:\collab\Pilah-Sampah-Cerdas\lib\app\modules\poin\poin_view.dart",
    "d:\collab\Pilah-Sampah-Cerdas\lib\app\modules\profil\profil_view.dart",
    "d:\collab\Pilah-Sampah-Cerdas\lib\app\modules\splash\splash_view.dart",
    "d:\collab\Pilah-Sampah-Cerdas\lib\app\modules\tentang\tentang_aplikasi_view.dart",
    "d:\collab\Pilah-Sampah-Cerdas\lib\app\modules\petugas_residu\timbangan_residu_view.dart"
)

foreach ($file in $filesDepth4) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        # Match import '../../(any folder EXCEPT core|data|routes)
        $content = [regex]::Replace($content, "import '\.\./\.\./(?!core|data|routes)([^']+)'", "import '../`$1'")
        Set-Content $file $content
    }
}
Write-Output "Sibling imports fixed"
