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
        $content = $content -replace "import '\.\./\.\./\.\./core", "import '../../core"
        $content = $content -replace "import '\.\./\.\./\.\./data", "import '../../data"
        $content = $content -replace "import '\.\./\.\./\.\./routes", "import '../../routes"
        $content = $content -replace "import '\.\./\.\./\.\./modules", "import '../../modules"
        Set-Content $file $content
    }
}

$widgetsDir = "d:\collab\Pilah-Sampah-Cerdas\lib\app\modules\shared\widgets"
if (Test-Path $widgetsDir) {
    $widgetFiles = Get-ChildItem $widgetsDir -Filter *.dart
    foreach ($file in $widgetFiles) {
        $content = Get-Content $file.FullName -Raw
        $content = $content -replace "import '\.\./\.\./\.\./\.\./core", "import '../../../core"
        $content = $content -replace "import '\.\./\.\./\.\./\.\./data", "import '../../../data"
        $content = $content -replace "import '\.\./\.\./\.\./\.\./routes", "import '../../../routes"
        $content = $content -replace "import '\.\./\.\./\.\./\.\./modules", "import '../../../modules"
        Set-Content $file.FullName $content
    }
}

Write-Output "Imports fixed"
