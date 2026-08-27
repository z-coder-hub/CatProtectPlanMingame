# Game logo generator v3 (circular badge: cat-ear castle + crowned orange cat)
# NOTE: ASCII-only comments on purpose - this PS host reads scripts as ANSI/GBK,
# and a UTF-8 multibyte char right before LF would swallow the newline.
# Every shape is a single GraphicsPath: fill + stroke on the same path.
# Output: assets/textures/game_logo_1024.png (1024px master)
#         assets/textures/game_logo.png    (512px game use)
Add-Type -AssemblyName System.Drawing

function C([string]$hex) { return [System.Drawing.ColorTranslator]::FromHtml($hex) }
function CA([int]$a, [System.Drawing.Color]$base) { return [System.Drawing.Color]::FromArgb($a, $base) }

# ---- path builders ----
function New-PolyPath([double[]]$coords) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $n = [int]($coords.Count / 2)
    $arr = New-Object 'System.Drawing.PointF[]' $n
    for ($i = 0; $i -lt $n; $i++) {
        $arr[$i] = New-Object System.Drawing.PointF([single]$coords[2 * $i], [single]$coords[2 * $i + 1])
    }
    $p.AddPolygon($arr)
    $p.CloseFigure()
    return $p
}

function New-RoundedRectPath([double]$x, [double]$y, [double]$w, [double]$h, [double]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = 2 * $r
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

function New-CirclePath([double]$x, [double]$y, [double]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p.AddEllipse($x, $y, 2 * $r, 2 * $r)
    $p.CloseFigure()
    return $p
}

function New-EllipsePath([double]$x, [double]$y, [double]$w, [double]$h) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p.AddEllipse($x, $y, $w, $h)
    $p.CloseFigure()
    return $p
}

function New-ArcPath([double]$x, [double]$y, [double]$w, [double]$h, [double]$sa, [double]$sw) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $p.AddArc($x, $y, $w, $h, $sa, $sw)
    return $p
}

# ---- draw: fill + stroke on one path ----
function Draw-Path($g, $path, $fill, $outline, [double]$ow) {
    if ($fill) {
        $b = New-Object System.Drawing.SolidBrush($fill)
        $g.FillPath($b, $path)
        $b.Dispose()
    }
    if ($outline) {
        $pen = New-Object System.Drawing.Pen($outline, $ow)
        $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
        $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $g.DrawPath($pen, $path)
        $pen.Dispose()
    }
}

function Draw-Line($g, [double]$x1, [double]$y1, [double]$x2, [double]$y2, $color, [double]$w) {
    $pen = New-Object System.Drawing.Pen($color, $w)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($pen, [single]$x1, [single]$y1, [single]$x2, [single]$y2)
    $pen.Dispose()
}

$W = 1024
$bmp = New-Object System.Drawing.Bitmap -ArgumentList $W, $W
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# ---------- 1. badge base ----------
$outerRing = C '#D84315'
$edgePen   = C '#9A3412'
$sepColor  = CA 210 (C '#FFF3E0')
$dotFill   = C '#FFD54F'
$dotEdge   = C '#9A3412'

$b = New-Object System.Drawing.SolidBrush($outerRing)
$g.FillEllipse($b, 40, 40, 944, 944)
$b.Dispose()

$gradRect = New-Object System.Drawing.Rectangle(40, 40, 944, 944)
$grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush($gradRect, (C '#FFD54F'), (C '#FF8F00'), 90.0)
$g.FillEllipse($grad, 76, 76, 872, 872)
$grad.Dispose()

$pen = New-Object System.Drawing.Pen($sepColor, 5)
$g.DrawEllipse($pen, 76, 76, 872, 872)
$pen.Dispose()
$pen = New-Object System.Drawing.Pen($edgePen, 6)
$g.DrawEllipse($pen, 40, 40, 944, 944)
$pen.Dispose()

# 8 gold rivet dots
for ($i = 0; $i -lt 8; $i++) {
    $ang = $i * 45 * [math]::PI / 180.0
    $dx = 512 + 454 * [math]::Cos($ang)
    $dy = 512 + 454 * [math]::Sin($ang)
    $dot = New-CirclePath ($dx - 13) ($dy - 13) 13
    Draw-Path $g $dot $dotFill $dotEdge 4
}

# ---------- 2. castle ----------
$wallFill = C '#FFF8E1'
$wallEdge = C '#6D4C41'
$roofFill = C '#FB8C00'
$roofEdge = C '#9A3412'
$winFill  = C '#FFF3E0'
$winEdge  = C '#8D6E63'
$flagFill = C '#E53935'
$poleCol  = C '#8D6E63'

# side tower bodies
$p = New-RoundedRectPath 300 480 80 100 10
Draw-Path $g $p $wallFill $wallEdge 10
$p = New-RoundedRectPath 644 480 80 100 10
Draw-Path $g $p $wallFill $wallEdge 10

# side tower roofs (triangle)
$p = New-PolyPath @(300,480, 380,480, 340,395)
Draw-Path $g $p $roofFill $roofEdge 9
$p = New-PolyPath @(644,480, 724,480, 684,395)
Draw-Path $g $p $roofFill $roofEdge 9

# flag poles + red flags
Draw-Line $g 340 395 340 345 $poleCol 6
$p = New-PolyPath @(340,347, 378,362, 340,377)
Draw-Path $g $p $flagFill $null 0
Draw-Line $g 684 395 684 345 $poleCol 6
$p = New-PolyPath @(684,347, 646,362, 684,377)
Draw-Path $g $p $flagFill $null 0

# side tower round windows + cross
$p = New-CirclePath 325 495 15
Draw-Path $g $p $winFill $winEdge 6
Draw-Line $g 340 495 340 525 $winEdge 5
Draw-Line $g 325 510 355 510 $winEdge 5
$p = New-CirclePath 669 495 15
Draw-Path $g $p $winFill $winEdge 6
Draw-Line $g 684 495 684 525 $winEdge 5
Draw-Line $g 669 510 699 510 $winEdge 5

# center tower body
$p = New-RoundedRectPath 452 410 120 150 10
Draw-Path $g $p $wallFill $wallEdge 10

# center tower cat-ear roof (signature)
$p = New-PolyPath @(436,420, 588,420, 552,300, 566,220, 520,300, 504,300, 458,220, 472,300)
Draw-Path $g $p $roofFill $roofEdge 9

# center tower round window
$p = New-CirclePath 486 429 26
Draw-Path $g $p $winFill $winEdge 7
Draw-Line $g 512 429 512 481 $winEdge 6
Draw-Line $g 486 455 538 455 $winEdge 6

# main wall + battlements
$p = New-RoundedRectPath 380 560 264 100 8
Draw-Path $g $p $wallFill $wallEdge 10
for ($i = 0; $i -lt 8; $i++) {
    $bx = 380 + $i * 34
    $p = New-RoundedRectPath $bx 535 26 25 4
    Draw-Path $g $p $wallFill $wallEdge 8
}

# ---------- 3. orange cat mascot (crowned) ----------
$catFill  = C '#F57C00'
$catEdge  = C '#D84315'
$earInner = C '#FFAB91'
$faceC    = C '#4E342E'
$muzzle   = C '#FFF3E0'
$nose     = C '#F06292'
$blush    = CA 170 (C '#FF8A80')
$crownF   = C '#FFD54F'
$crownE   = C '#B45309'

# ears + inner ears
$p = New-PolyPath @(398,625, 424,505, 468,600)
Draw-Path $g $p $catFill $catEdge 10
$p = New-PolyPath @(556,600, 600,505, 626,625)
Draw-Path $g $p $catFill $catEdge 10
$p = New-PolyPath @(414,590, 432,525, 452,585)
Draw-Path $g $p $earInner $null 0
$p = New-PolyPath @(572,585, 592,525, 610,590)
Draw-Path $g $p $earInner $null 0

# face
$p = New-CirclePath 372 560 140
Draw-Path $g $p $catFill $catEdge 12

# crown + jewels
$p = New-PolyPath @(452,560, 452,532, 478,548, 512,524, 546,548, 572,532, 572,560)
Draw-Path $g $p $crownF $crownE 8
$p = New-CirclePath 471 541 7
Draw-Path $g $p (C '#E53935') $null 0
$p = New-CirclePath 504 522 8
Draw-Path $g $p (C '#42A5F5') $null 0
$p = New-CirclePath 539 541 7
Draw-Path $g $p (C '#E53935') $null 0

# eyes (happy closed)
$p = New-ArcPath 438 668 64 42 20 140
Draw-Path $g $p $null $faceC 13
$p = New-ArcPath 522 668 64 42 20 140
Draw-Path $g $p $null $faceC 13

# muzzle / nose / mouth
$p = New-CirclePath 466 720 46
Draw-Path $g $p $muzzle $null 0
$p = New-PolyPath @(498,724, 526,724, 512,740)
Draw-Path $g $p $nose $null 0
$p = New-ArcPath 494 742 36 16 20 160
Draw-Path $g $p $null $faceC 7

# whiskers
Draw-Line $g 436 690 330 672 $faceC 6
Draw-Line $g 436 706 332 716 $faceC 6
Draw-Line $g 588 690 694 672 $faceC 6
Draw-Line $g 588 706 692 716 $faceC 6

# blush
$p = New-CirclePath 450 706 18
Draw-Path $g $p $blush $null 0
$p = New-CirclePath 538 706 18
Draw-Path $g $p $blush $null 0

# collar (flat ellipse) + bell
$p = New-EllipsePath 474 812 76 22
Draw-Path $g $p (C '#E53935') (C '#B71C1C') 4
$p = New-CirclePath 500 812 12
Draw-Path $g $p $crownF $crownE 4

# ---------- 4. sparkles ----------
$starColor = CA 230 (C '#FFF3E0')
$stars = @(
    @(300,240,16), @(724,220,14), @(210,430,12),
    @(800,390,13), @(512,140,18)
)
foreach ($s in $stars) {
    $cx = $s[0]; $cy = $s[1]; $r = $s[2]
    $q  = 0.28 * $r
    # precompute every coordinate - no arithmetic allowed inside array literals
    $x1 = $cx;       $y1 = $cy - $r
    $x2 = $cx + $q;  $y2 = $cy - $q
    $x3 = $cx + $r;  $y3 = $cy
    $x4 = $cx + $q;  $y4 = $cy + $q
    $x5 = $cx;       $y5 = $cy + $r
    $x6 = $cx - $q;  $y6 = $cy + $q
    $x7 = $cx - $r;  $y7 = $cy
    $x8 = $cx - $q;  $y8 = $cy - $q
    $coords = @($x1,$y1, $x2,$y2, $x3,$y3, $x4,$y4, $x5,$y5, $x6,$y6, $x7,$y7, $x8,$y8)
    $p = New-PolyPath $coords
    Draw-Path $g $p $starColor $null 0
}

# ---------- output ----------
$root = Split-Path -Parent $PSScriptRoot
$texDir = Join-Path $root "assets\textures"
$out1024 = Join-Path $texDir "game_logo_1024.png"
$bmp.Save($out1024, [System.Drawing.Imaging.ImageFormat]::Png)

$bmp512 = New-Object System.Drawing.Bitmap -ArgumentList 512, 512
$g2 = [System.Drawing.Graphics]::FromImage($bmp512)
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.DrawImage($bmp, 0, 0, 512, 512)
$out512 = Join-Path $texDir "game_logo.png"
$bmp512.Save($out512, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose()
$g2.Dispose()
$bmp.Dispose()
$bmp512.Dispose()
Write-Host "OK: $out1024"
Write-Host "OK: $out512"
