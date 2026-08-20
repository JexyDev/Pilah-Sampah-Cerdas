Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\USER\Downloads\WhatsApp Image 2026-08-19 at 12.03.29.jpeg"
$webPublicDir = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\web\public"
$webImgDir = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\web\public\image"
$mobileAssetsDir = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\mobile\assets"
$uploadsDir = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\uploads"

# 0. Ensure directory and copy bereseka.jpeg
$beresekaPublicPath = Join-Path $webPublicDir "bereseka.jpeg"
Copy-Item -Path $srcPath -Destination $beresekaPublicPath -Force
Copy-Item -Path $srcPath -Destination (Join-Path $uploadsDir "bereseka.jpeg") -Force
Write-Host "Copied original to $beresekaPublicPath"

$srcImg = [System.Drawing.Bitmap]::FromFile($beresekaPublicPath)
Write-Host "Source dimensions:" $srcImg.Width "x" $srcImg.Height

# -------------------------------------------------------------
# 1. Trim Full Logo (Emblem + BERSEKA text + subtitle)
# -------------------------------------------------------------
$fullMinX = $srcImg.Width
$fullMinY = $srcImg.Height
$fullMaxX = 0
$fullMaxY = 0

for ($y = 0; $y -lt $srcImg.Height; $y += 3) {
    for ($x = 0; $x -lt $srcImg.Width; $x += 3) {
        $c = $srcImg.GetPixel($x, $y)
        if ($c.R -lt 240 -or $c.G -lt 240 -or $c.B -lt 240) {
            if ($x -lt $fullMinX) { $fullMinX = $x }
            if ($x -gt $fullMaxX) { $fullMaxX = $x }
            if ($y -lt $fullMinY) { $fullMinY = $y }
            if ($y -gt $fullMaxY) { $fullMaxY = $y }
        }
    }
}

$fullPad = 10
$fCropX = [math]::Max(0, $fullMinX - $fullPad)
$fCropY = [math]::Max(0, $fullMinY - $fullPad)
$fCropW = [math]::Min($srcImg.Width - $fCropX, ($fullMaxX - $fullMinX) + ($fullPad * 2))
$fCropH = [math]::Min($srcImg.Height - $fCropY, ($fullMaxY - $fullMinY) + ($fullPad * 2))

$fullCropRect = New-Object System.Drawing.Rectangle($fCropX, $fCropY, $fCropW, $fCropH)
$fullCroppedBmp = $srcImg.Clone($fullCropRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Save trimmed full logos
$fullLogoPath = Join-Path $webImgDir "berseka-logo.png"
$legacyLogoPath = Join-Path $webImgDir "trashcare-logo.png"
$mobileLogoPath1 = Join-Path $mobileAssetsDir "berseka-logo.png"
$mobileLogoPath2 = Join-Path $mobileAssetsDir "logo_berseka.png"
$mobileLogoPath3 = Join-Path $mobileAssetsDir "logo.png"

$fullCroppedBmp.Save($fullLogoPath, [System.Drawing.Imaging.ImageFormat]::Png)
$fullCroppedBmp.Save($legacyLogoPath, [System.Drawing.Imaging.ImageFormat]::Png)
$fullCroppedBmp.Save($mobileLogoPath1, [System.Drawing.Imaging.ImageFormat]::Png)
$fullCroppedBmp.Save($mobileLogoPath2, [System.Drawing.Imaging.ImageFormat]::Png)
$fullCroppedBmp.Save($mobileLogoPath3, [System.Drawing.Imaging.ImageFormat]::Png)
$fullCroppedBmp.Dispose()
Write-Host "Full Logo Trimmed and Saved ($fCropW x $fCropH)"

# -------------------------------------------------------------
# 2. Trim & Square Emblem Icon (Left B mark)
# -------------------------------------------------------------
$iconMinX = $srcImg.Width
$iconMinY = $srcImg.Height
$iconMaxX = 0
$iconMaxY = 0
$emblemBoundaryX = [int]($srcImg.Width * 0.40)

for ($y = 0; $y -lt $srcImg.Height; $y += 3) {
    for ($x = 0; $x -lt $emblemBoundaryX; $x += 3) {
        $c = $srcImg.GetPixel($x, $y)
        if ($c.R -lt 240 -or $c.G -lt 240 -or $c.B -lt 240) {
            if ($x -lt $iconMinX) { $iconMinX = $x }
            if ($x -gt $iconMaxX) { $iconMaxX = $x }
            if ($y -lt $iconMinY) { $iconMinY = $y }
            if ($y -gt $iconMaxY) { $iconMaxY = $y }
        }
    }
}

$iconPad = 12
$iCropX = [math]::Max(0, $iconMinX - $iconPad)
$iCropY = [math]::Max(0, $iconMinY - $iconPad)
$iCropW = [math]::Min($srcImg.Width - $iCropX, ($iconMaxX - $iconMinX) + ($iconPad * 2))
$iCropH = [math]::Min($srcImg.Height - $iCropY, ($iconMaxY - $iconMinY) + ($iconPad * 2))

$maxDim = [math]::Max($iCropW, $iCropH)
$sqBmp = New-Object System.Drawing.Bitmap($maxDim, $maxDim, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($sqBmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$offsetX = [int](($maxDim - $iCropW) / 2)
$offsetY = [int](($maxDim - $iCropH) / 2)

$srcRect = New-Object System.Drawing.Rectangle($iCropX, $iCropY, $iCropW, $iCropH)
$destRect = New-Object System.Drawing.Rectangle($offsetX, $offsetY, $iCropW, $iCropH)

$g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$srcImg.Dispose()

# Save icon files
$iconPath = Join-Path $webImgDir "berseka-icon.png"
$faviconPngPath = Join-Path $webPublicDir "favicon.png"
$legacyIconPath = Join-Path $webImgDir "trashcare-icon.png"
$mobileIconPath1 = Join-Path $mobileAssetsDir "berseka-icon.png"
$mobileIconPath2 = Join-Path $mobileAssetsDir "logo_berseka_icon.png"
$mobileIconPath3 = Join-Path $mobileAssetsDir "logos.jpeg"

$sqBmp.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$sqBmp.Save($faviconPngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$sqBmp.Save($legacyIconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$sqBmp.Save($mobileIconPath1, [System.Drawing.Imaging.ImageFormat]::Png)
$sqBmp.Save($mobileIconPath2, [System.Drawing.Imaging.ImageFormat]::Png)
$sqBmp.Save($mobileIconPath3, [System.Drawing.Imaging.ImageFormat]::Jpeg)

# Also generate favicon.ico from 64x64 scaled version
$icoBmp = New-Object System.Drawing.Bitmap(64, 64, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gIco = [System.Drawing.Graphics]::FromImage($icoBmp)
$gIco.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gIco.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gIco.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gIco.DrawImage($sqBmp, (New-Object System.Drawing.Rectangle(0, 0, 64, 64)))
$gIco.Dispose()

$icoPath = Join-Path $webPublicDir "favicon.ico"
$hIcon = $icoBmp.GetHicon()
$iconObj = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream($icoPath, [System.IO.FileMode]::Create)
$iconObj.Save($fs)
$fs.Close()
$iconObj.Dispose()
$icoBmp.Dispose()
$sqBmp.Dispose()

Write-Host "Emblem Icon Cropped and Saved ($maxDim x $maxDim) to all web and mobile assets + favicon.ico!"
