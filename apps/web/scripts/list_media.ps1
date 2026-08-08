Add-Type -AssemblyName System.Drawing
$dir = "C:\Users\USER\.gemini\antigravity-ide\brain\b363358b-675d-4863-a01e-b6ab748a6e90"
$files = Get-ChildItem "$dir\media__*"

foreach ($f in $files) {
    try {
        $img = [System.Drawing.Image]::FromFile($f.FullName)
        $w = $img.Width
        $h = $img.Height
        $size = [math]::Round($f.Length / 1KB)
        Write-Host "$($f.Name) : ${w}x${h} (${size} KB)"
        $img.Dispose()
    } catch {
        Write-Host "$($f.Name) : Error"
    }
}
