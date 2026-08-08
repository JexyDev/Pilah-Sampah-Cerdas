$srcPath = "C:\Users\USER\.gemini\antigravity-ide\brain\b363358b-675d-4863-a01e-b6ab748a6e90\media__1786192656985.jpg"
$destPath1 = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\web\public\image\kkn-hero-sorting-v2.png"
$destPath2 = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\web\public\image\kkn-hero-sorting.png"

Add-Type -AssemblyName System.Drawing

$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)

$scale = 3.84
$targetW = [int]($srcImg.Width * $scale)
$targetH = [int]($srcImg.Height * $scale)

$destBmp = New-Object System.Drawing.Bitmap($targetW, $targetH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($destBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$g.DrawImage($srcImg, 0, 0, $targetW, $targetH)
$g.Dispose()
$srcImg.Dispose()

$destBmp.Save($destPath1, [System.Drawing.Imaging.ImageFormat]::Png)
$destBmp.Save($destPath2, [System.Drawing.Imaging.ImageFormat]::Png)
$destBmp.Dispose()

Write-Host "✅ Created kkn-hero-sorting-v2.png ($targetW x $targetH) to bust browser cache!"
