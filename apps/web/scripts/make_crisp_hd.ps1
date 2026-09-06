Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\USER\.gemini\antigravity-ide\brain\b363358b-675d-4863-a01e-b6ab748a6e90\media__1786192982006.jpg"
$destPath1 = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\web\public\image\kkn-hero-sorting-v3.png"
$destPath2 = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\web\public\image\kkn-hero-sorting.png"

$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Source Dimensions:" $srcImg.Width "x" $srcImg.Height

# Crop out outer blurry padding
$cropX = [int]($srcImg.Width * 0.05)
$cropY = [int]($srcImg.Height * 0.02)
$cropW = [int]($srcImg.Width * 0.93)
$cropH = [int]($srcImg.Height * 0.94)

$cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$croppedBmp = $srcImg.Clone($cropRect, $srcImg.PixelFormat)
$srcImg.Dispose()

# Scale 4X to 4K Ultra HD
$scale = 4.0
$targetW = [int]($cropW * $scale)
$targetH = [int]($cropH * $scale)

$destBmp = New-Object System.Drawing.Bitmap($targetW, $targetH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($destBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$g.DrawImage($croppedBmp, 0, 0, $targetW, $targetH)
$g.Dispose()
$croppedBmp.Dispose()

$destBmp.Save($destPath1, [System.Drawing.Imaging.ImageFormat]::Png)
$destBmp.Save($destPath2, [System.Drawing.Imaging.ImageFormat]::Png)
$destBmp.Dispose()

Write-Host "✅ Created Crisp 4K HD Images ($targetW x $targetH): kkn-hero-sorting-v3.png & kkn-hero-sorting.png"
