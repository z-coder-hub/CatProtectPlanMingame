# Pixel-style game title bitmap generator
# NOTE: ASCII-only comments on purpose - this PS host reads scripts as ANSI/GBK,
# and a UTF-8 multibyte char right before LF would swallow the newline.
# Title text is built from Unicode code points, NOT raw CJK literals.
# Rendering: SingleBitPerPixelGridFit (no anti-aliasing) -> naturally pixelated glyphs.
# White main text + 1px dark outline via 4 offset passes (fill-only, one path per pass).
# Output: assets/resources/images/ui/game_title_pixel.png
Add-Type -AssemblyName System.Drawing

# title chars: Qi=0x67D2 Hua=0x5A73 Ai=0x7231 Qu=0x8DA3 Wan=0x73A9 Er=0x513F
$title = -join ([char]0x67D2,[char]0x5A73,[char]0x7231,[char]0x8DA3,[char]0x73A9,[char]0x513F)

$W = 640
$H = 160
$fontSize = 84.0

$bmp = New-Object System.Drawing.Bitmap -ArgumentList $W, $H
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::SingleBitPerPixelGridFit

$font = New-Object System.Drawing.Font("Microsoft YaHei", [single]$fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

# centered layout
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

# dark purple outline matches the old label outline (40,30,60) on the dark-blue bg
$darkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 40, 30, 60))
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))

# 1px dark outline: 4 offset passes, then white main pass on top
$offsets = @(@(-1, 0), @(1, 0), @(0, -1), @(0, 1))
foreach ($o in $offsets) {
    $r = New-Object System.Drawing.RectangleF([single]$o[0], [single]$o[1], [single]$W, [single]$H)
    $g.DrawString($title, $font, $darkBrush, $r, $sf)
}
$rMain = New-Object System.Drawing.RectangleF(0.0, 0.0, [single]$W, [single]$H)
$g.DrawString($title, $font, $whiteBrush, $rMain, $sf)

# output
$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "assets\resources\images\ui"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}
$outFile = Join-Path $outDir "game_title_pixel.png"
$bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$bmp.Dispose()
$font.Dispose()
$darkBrush.Dispose()
$whiteBrush.Dispose()
$sf.Dispose()

Write-Host "OK: $outFile"
