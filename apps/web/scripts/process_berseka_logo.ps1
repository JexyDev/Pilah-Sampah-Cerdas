Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\uploads\1785137726839-8c55cdb1-aa06-440e-9e9d-745ce6ec2b5e.png"
$webImgDir = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\web\public\image"
$webPublicDir = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\web\public"

$fullLogoDest = Join-Path $webImgDir "berseka-logo.png"
$iconDest = Join-Path $webImgDir "berseka-icon.png"
$faviconDest = Join-Path $webPublicDir "favicon.png"
$legacyIconDest = Join-Path $webImgDir "trashcare-icon.png"
$legacyLogoDest = Join-Path $webImgDir "trashcare-logo.png"

# 1. Save Full Logo
Copy-Item -Path $srcPath -Destination $fullLogoDest -Force
Copy-Item -Path $srcPath -Destination $legacyLogoDest -Force
Write-Host "Full logo saved to berseka-logo.png"

# 2. Crop Icon Mark (Emblem B with leaf and hand)
$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Source dimensions:" $srcImg.Width "x" $srcImg.Height

$minX = $srcImg.Width
$minY = $srcImg.Height
$maxX = 0
$maxY = 0

$emblemMaxXBoundary = [int]($srcImg.Width * 0.35)

for ($y = 0; $y -lt $srcImg.Height; $y += 2) {
    for ($x = 0; $x -lt $emblemMaxXBoundary; $x += 2) {
        $c = $srcImg.GetPixel($x, $y)
        if ($c.R -lt 240 -or $c.G -lt 240 -or $c.B -lt 240) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$pad = 12
$cropX = [math]::Max(0, $minX - $pad)
$cropY = [math]::Max(0, $minY - $pad)
$cropW = [math]::Min($srcImg.Width - $cropX, ($maxX - $minX) + ($pad * 2))
$cropH = [math]::Min($srcImg.Height - $cropY, ($maxY - $minY) + ($pad * 2))

# Make it square
$maxDim = [math]::Max($cropW, $cropH)
$sqBmp = New-Object System.Drawing.Bitmap($maxDim, $maxDim, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($sqBmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$offsetX = [int](($maxDim - $cropW) / 2)
$offsetY = [int](($maxDim - $cropH) / 2)

$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$destRect = New-Object System.Drawing.Rectangle($offsetX, $offsetY, $cropW, $cropH)

$g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$srcImg.Dispose()

$sqBmp.Save($iconDest, [System.Drawing.Imaging.ImageFormat]::Png)
$sqBmp.Save($faviconDest, [System.Drawing.Imaging.ImageFormat]::Png)
$sqBmp.Save($legacyIconDest, [System.Drawing.Imaging.ImageFormat]::Png)
$sqBmp.Dispose()

Write-Host "Emblem icon cropped and saved to berseka-icon.png, favicon.png, trashcare-icon.png"
