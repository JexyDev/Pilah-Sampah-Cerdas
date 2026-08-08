$srcPath = "C:\Users\USER\.gemini\antigravity-ide\brain\b363358b-675d-4863-a01e-b6ab748a6e90\media__1786190968290.png"
$destPath = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\web\public\image\kkn-hero-sorting.png"

Add-Type -AssemblyName System.Drawing

$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)

$scale = 4
$targetW = $srcImg.Width * $scale
$targetH = $srcImg.Height * $scale

$destBmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
$g = [System.Drawing.Graphics]::FromImage($destBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$g.DrawImage($srcImg, 0, 0, $targetW, $targetH)
$g.Dispose()
$srcImg.Dispose()

$destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$destBmp.Dispose()
Write-Host "✅ Successfully upscaled PNG to 4X Ultra-HD ($targetW x $targetH)!"
