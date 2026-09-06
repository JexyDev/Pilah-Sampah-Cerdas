Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\uploads\1785137726839-8c55cdb1-aa06-440e-9e9d-745ce6ec2b5e.png"
$webImgDir = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\web\public\image"
$webPublicDir = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\web\public"
$mobileAssetsDir = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\mobile\assets"

$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Source raw dimensions:" $srcImg.Width "x" $srcImg.Height

# -------------------------------------------------------------
# 1. Trim Full Logo (Emblem + Text + Subtitle)
# -------------------------------------------------------------
$fullMinX = $srcImg.Width
$fullMinY = $srcImg.Height
$fullMaxX = 0
$fullMaxY = 0

for ($y = 0; $y -lt $srcImg.Height; $y += 2) {
    for ($x = 0; $x -lt $srcImg.Width; $x += 2) {
        $c = $srcImg.GetPixel($x, $y)
        if ($c.R -lt 240 -or $c.G -lt 240 -or $c.B -lt 240) {
            if ($x -lt $fullMinX) { $fullMinX = $x }
            if ($x -gt $fullMaxX) { $fullMaxX = $x }
            if ($y -lt $fullMinY) { $fullMinY = $y }
            if ($y -gt $fullMaxY) { $fullMaxY = $y }
        }
    }
}

$fullPad = 8
$fCropX = [math]::Max(0, $fullMinX - $fullPad)
$fCropY = [math]::Max(0, $fullMinY - $fullPad)
$fCropW = [math]::Min($srcImg.Width - $fCropX, ($fullMaxX - $fullMinX) + ($fullPad * 2))
$fCropH = [math]::Min($srcImg.Height - $fCropY, ($fullMaxY - $fullMinY) + ($fullPad * 2))

$fullCropRect = New-Object System.Drawing.Rectangle($fCropX, $fCropY, $fCropW, $fCropH)
$fullCroppedBmp = $srcImg.Clone($fullCropRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

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
Write-Host "Trimmed Full Logo saved ($fCropW x $fCropH)"

# -------------------------------------------------------------
# 2. Trim Emblem Icon (Circular B mark on the left)
# -------------------------------------------------------------
$iconMinX = $srcImg.Width
$iconMinY = $srcImg.Height
$iconMaxX = 0
$iconMaxY = 0
$emblemBoundaryX = [int]($srcImg.Width * 0.35)

for ($y = 0; $y -lt $srcImg.Height; $y += 2) {
    for ($x = 0; $x -lt $emblemBoundaryX; $x += 2) {
        $c = $srcImg.GetPixel($x, $y)
        if ($c.R -lt 240 -or $c.G -lt 240 -or $c.B -lt 240) {
            if ($x -lt $iconMinX) { $iconMinX = $x }
            if ($x -gt $iconMaxX) { $iconMaxX = $x }
            if ($y -lt $iconMinY) { $iconMinY = $y }
            if ($y -gt $iconMaxY) { $iconMaxY = $y }
        }
    }
}

$iconPad = 10
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

$iconPath = Join-Path $webImgDir "berseka-icon.png"
$faviconPath = Join-Path $webPublicDir "favicon.png"
$legacyIconPath = Join-Path $webImgDir "trashcare-icon.png"
$mobileIconPath1 = Join-Path $mobileAssetsDir "berseka-icon.png"
$mobileIconPath2 = Join-Path $mobileAssetsDir "logo_berseka_icon.png"

$sqBmp.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$sqBmp.Save($faviconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$sqBmp.Save($legacyIconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$sqBmp.Save($mobileIconPath1, [System.Drawing.Imaging.ImageFormat]::Png)
$sqBmp.Save($mobileIconPath2, [System.Drawing.Imaging.ImageFormat]::Png)
$sqBmp.Dispose()

Write-Host "Trimmed Emblem Icon saved square ($maxDim x $maxDim)"
