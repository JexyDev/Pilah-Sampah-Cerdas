Add-Type -AssemblyName System.IO.Compression.FileSystem
$docxPath = "c:\Users\USER\.gemini\antigravity-ide\scratch\berseka\main\docs\Laporan Eksekutif Pelaksanaan KKN dan Tata Kelola Sampah 2026.docx"
$zip = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
$entry = $zip.GetEntry("word/document.xml")
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlText = $reader.ReadToEnd()
$stream.Close()
$zip.Dispose()

# Also get headers and footers if any
$zip2 = [System.IO.Compression.ZipFile]::OpenRead($docxPath)
$otherTexts = ""
foreach ($e in $zip2.Entries) {
    if ($e.FullName -like "word/header*.xml" -or $e.FullName -like "word/footer*.xml") {
        $s = $e.Open()
        $r = New-Object System.IO.StreamReader($s)
        $otherTexts += "`n--- " + $e.FullName + " ---`n" + $r.ReadToEnd()
        $s.Close()
    }
}
$zip2.Dispose()

$cleanText = [System.Text.RegularExpressions.Regex]::Replace($xmlText, '<w:p[ >]', "`n`n")
$cleanText = [System.Text.RegularExpressions.Regex]::Replace($cleanText, '<w:tab/>', "`t")
$cleanText = [System.Text.RegularExpressions.Regex]::Replace($cleanText, '<[^>]+>', '')
$cleanOther = [System.Text.RegularExpressions.Regex]::Replace($otherTexts, '<[^>]+>', ' ')

$allText = "=== DOCUMENT BODY ===`n" + $cleanText + "`n`n=== HEADERS / FOOTERS ===`n" + $cleanOther
Set-Content -Path "c:\Users\USER\.gemini\antigravity-ide\scratch\berseka\main\docs\docx_extracted_text.txt" -Value $allText -Encoding UTF8
Write-Output "Done. Extracted $($allText.Length) characters."
