Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\USER\.gemini\antigravity-ide\brain\b363358b-675d-4863-a01e-b6ab748a6e90\media__1786195831908.png"
$destPng = "c:\Users\USER\.gemini\antigravity-ide\scratch\pilahsampah-id\apps\web\public\image\trashcare-icon.png"

$srcImg = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Raw Image Dimensions:" $srcImg.Width "x" $srcImg.Height

# Auto trim white background padding around the circular icon mark
$minX = $srcImg.Width
$minY = $srcImg.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $srcImg.Height; $y += 2) {
    for ($x = 0; $x -lt $srcImg.Width; $x += 2) {
        $c = $srcImg.GetPixel($x, $y)
        # Check if non-white pixel
        if ($c.R -lt 240 -or $c.G -lt 240 -or $c.B -lt 240) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$pad = 10
$cropX = [math]::Max(0, $minX - $pad)
$cropY = [math]::Max(0, $minY - $pad)
$cropW = [math]::Min($srcImg.Width - $cropX, ($maxX - $minX) + ($pad * 2))
$cropH = [math]::Min($srcImg.Height - $cropY, ($maxY - $minY) + ($pad * 2))

$cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$croppedBmp = $srcImg.Clone($cropRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$srcImg.Dispose()

$croppedBmp.Save($destPng, [System.Drawing.Imaging.ImageFormat]::Png)
$croppedBmp.Dispose()

Write-Host "✅ Clean cropped icon mark saved to public/image/trashcare-icon.png ($cropW x $cropH)!"
