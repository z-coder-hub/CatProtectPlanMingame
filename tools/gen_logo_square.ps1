# Square pixel-art game logo generator
# Draws on a 128x128 pixel canvas (no anti-aliasing), then upscales x4/x8
# with nearest-neighbor for crisp chunky pixels. Palette sampled from the
# actual game assets (dark olive bg, cream panels, orange cat, gray mouse).
# Also exports an editable SVG (shape-rendering crispEdges).
# Output: assets/textures/game_logo_square.png (512)
#         assets/textures/game_logo_square_1024.png (1024)
#         tools/game_logo_square.svg (editable source)
Add-Type -AssemblyName System.Drawing

$CSIZE = 128
$canvas = New-Object 'string[,]' $CSIZE, $CSIZE   # null = transparent

# ---------- pixel helpers ----------
function SetPix($x, $y, $color) {
    if ($x -ge 0 -and $x -lt $CSIZE -and $y -ge 0 -and $y -lt $CSIZE) { $canvas[$x, $y] = $color }
}

function RowSpan($y, $x1, $x2, $color) {
    if ($x2 -lt $x1) { return }
    for ($xx = $x1; $xx -le $x2; $xx++) { SetPix $xx $y $color }
}

function FillRect($x, $y, $w, $h, $color) {
    for ($yy = $y; $yy -lt $y + $h; $yy++) { RowSpan $yy $x ($x + $w - 1) $color }
}

function CircleSpans($cx, $cy, $r) {
    # filled circle rows -> list of @(y, x1, x2)
    $spans = @()
    for ($yy = -$r; $yy -le $r; $yy++) {
        $hw = [math]::Floor([math]::Sqrt([double]($r * $r - $yy * $yy)))
        $sy = $cy + $yy
        $sx1 = $cx - $hw
        $sx2 = $cx + $hw
        $spans += ,@($sy, $sx1, $sx2)
    }
    return $spans
}

function TriangleSpans($ax, $ay, $bx1, $by, $bx2) {
    # apex (ax,ay), base (bx1,by)-(bx2,by)
    $spans = @()
    $den = $by - $ay
    if ($den -le 0) { return $spans }
    for ($y = $ay; $y -le $by; $y++) {
        $t = ($y - $ay) / [double]$den
        $lx = [math]::Round($ax + ($bx1 - $ax) * $t)
        $rx = [math]::Round($ax + ($bx2 - $ax) * $t)
        $spans += ,@($y, $lx, $rx)
    }
    return $spans
}

function StampSpans($spans, $fill, $outline) {
    if ($outline -and $spans.Count -gt 0) {
        $first = $spans[0]
        $last = $spans[$spans.Count - 1]
        $fy = $first[0]; $fx1 = $first[1]; $fx2 = $first[2]
        $ly = $last[0];  $lx1 = $last[1];  $lx2 = $last[2]
        RowSpan ($fy - 1) ($fx1 - 1) ($fx2 + 1) $outline
        RowSpan ($ly + 1) ($lx1 - 1) ($lx2 + 1) $outline
        foreach ($sp in $spans) {
            RowSpan $sp[0] ($sp[1] - 1) ($sp[2] + 1) $outline
        }
    }
    foreach ($sp in $spans) {
        RowSpan $sp[0] $sp[1] $sp[2] $fill
    }
}

function StampRect($x, $y, $w, $h, $fill, $outline) {
    if ($outline) { FillRect ($x - 1) ($y - 1) ($w + 2) ($h + 2) $outline }
    FillRect $x $y $w $h $fill
}

# ---------- palette (sampled from game assets) ----------
$BG      = '#345717'   # battlefield dark olive
$GROUND  = '#466417'   # lighter olive ground
$FRAME   = '#522913'   # dark brown wood frame
$CREAM   = '#FFDAB9'   # cream panels / castle walls
$LIT     = '#FFF3E0'   # lit window glow
$ROOF    = '#FF9722'   # orange roof / cat body
$ROOF_ED = '#602513'   # dark reddish-brown outline
$WALL_ED = '#522913'   # brown outline for castle
$RED     = '#C0392B'   # flags / collar
$GOLD    = '#FFC93C'   # gold coins / bell / studs
$GOLD_ED = '#B45309'
$DARK    = '#602513'   # face details
$SHADE   = '#E4570C'   # darker orange (nose / inner ear)
$MOUSE   = '#8D9694'   # gray mouse
$MOUSE_E = '#5B6367'
$PINK    = '#E8A0A0'   # mouse inner ear / nose
$EYE     = '#27282A'   # charcoal

# ---------- 1. background + ground ----------
FillRect 0 0 $CSIZE $CSIZE $BG
FillRect 0 100 $CSIZE 28 $GROUND

# ---------- 2. castle ----------
# center tower body
StampRect 55 40 18 58 $CREAM $WALL_ED

# center cat-ear roof (signature): hand-crafted pixel rows
$roofSpans = @(
    ,@(22, 58, 58)
    ,@(22, 70, 70)
    ,@(24, 58, 60)
    ,@(24, 68, 70)
    ,@(26, 58, 61)
    ,@(26, 67, 70)
    ,@(28, 59, 62)
    ,@(28, 66, 69)
    ,@(30, 60, 63)
    ,@(30, 65, 68)
    ,@(32, 60, 68)
    ,@(34, 58, 70)
    ,@(36, 56, 72)
    ,@(38, 54, 74)
    ,@(40, 52, 76)
)
StampSpans $roofSpans $ROOF $ROOF_ED

# lit center window
StampRect 60 57 8 10 $LIT $WALL_ED

# side towers
StampRect 23 56 16 42 $CREAM $WALL_ED
StampRect 89 56 16 42 $CREAM $WALL_ED

# side roofs (triangles)
$lRoof = TriangleSpans 32 42 22 56 42
StampSpans $lRoof $ROOF $ROOF_ED
$rRoof = TriangleSpans 96 42 86 56 106
StampSpans $rRoof $ROOF $ROOF_ED

# flags
FillRect 31 36 1 6 $WALL_ED
FillRect 33 37 5 4 $RED
FillRect 96 36 1 6 $WALL_ED
FillRect 90 37 5 4 $RED

# side tower windows (dark)
FillRect 28 66 4 6 $WALL_ED
FillRect 96 66 4 6 $WALL_ED

# main wall
StampRect 21 88 86 10 $CREAM $WALL_ED

# battlements (only where the cat does not cover)
StampRect 21 80 8 8 $CREAM $WALL_ED
StampRect 34 80 8 8 $CREAM $WALL_ED
StampRect 86 80 8 8 $CREAM $WALL_ED
StampRect 99 80 8 8 $CREAM $WALL_ED

# ---------- 3. cat mascot ----------
# ears
$lEar = TriangleSpans 52 74 48 86 62 86
StampSpans $lEar $ROOF $ROOF_ED
$rEar = TriangleSpans 76 74 66 86 80 86
StampSpans $rEar $ROOF $ROOF_ED
# inner ears (darker orange)
$lIn = TriangleSpans 53 78 50 84 58 84
StampSpans $lIn $SHADE $null
$rIn = TriangleSpans 75 78 70 84 78 84
StampSpans $rIn $SHADE $null

# face (circle r16 at 64,102)
$face = CircleSpans 64 102 16
StampSpans $face $ROOF $ROOF_ED

# happy closed eyes (upside-down U)
SetPix 56 98 $DARK; SetPix 60 98 $DARK
SetPix 57 100 $DARK; SetPix 59 100 $DARK
SetPix 58 102 $DARK
SetPix 68 98 $DARK; SetPix 72 98 $DARK
SetPix 69 100 $DARK; SetPix 71 100 $DARK
SetPix 70 102 $DARK

# muzzle
RowSpan 104 60 68 $CREAM
RowSpan 106 58 70 $CREAM
RowSpan 108 58 70 $CREAM
RowSpan 110 60 68 $CREAM

# nose
RowSpan 104 62 66 $SHADE
RowSpan 105 63 65 $SHADE
RowSpan 106 64 64 $SHADE

# mouth (smile)
SetPix 62 108 $DARK; SetPix 66 108 $DARK; SetPix 64 110 $DARK

# whiskers
SetPix 46 99 $DARK; SetPix 42 98 $DARK; SetPix 38 97 $DARK
SetPix 46 103 $DARK; SetPix 42 103 $DARK; SetPix 38 102 $DARK
SetPix 82 99 $DARK; SetPix 86 98 $DARK; SetPix 90 97 $DARK
SetPix 82 103 $DARK; SetPix 86 103 $DARK; SetPix 90 102 $DARK

# collar + bell
FillRect 52 112 25 2 $RED
RowSpan 113 53 75 $RED
FillRect 62 113 5 4 $GOLD

# ---------- 4. mouse enemy (bottom right) ----------
$mBody = @(
    ,@(106, 96, 102)
    ,@(108, 93, 104)
    ,@(110, 92, 105)
    ,@(112, 92, 105)
    ,@(114, 93, 104)
    ,@(116, 95, 103)
    ,@(118, 97, 101)
)
StampSpans $mBody $MOUSE $MOUSE_E
# ears
$mEarL = CircleSpans 95 103 2
StampSpans $mEarL $MOUSE $MOUSE_E
$mEarR = CircleSpans 99 103 2
StampSpans $mEarR $MOUSE $MOUSE_E
$mInL = CircleSpans 95 103 1
StampSpans $mInL $PINK $null
$mInR = CircleSpans 99 103 1
StampSpans $mInR $PINK $null
# eye / nose
SetPix 96 110 $EYE
SetPix 92 111 $PINK
# tail
SetPix 105 113 $MOUSE
SetPix 108 112 $MOUSE
SetPix 111 113 $MOUSE

# ---------- 5. coins + sparkles (sky) ----------
$c1 = CircleSpans 16 16 5
StampSpans $c1 $GOLD $GOLD_ED
$c2 = CircleSpans 26 15 5
StampSpans $c2 $GOLD $GOLD_ED
$c3 = CircleSpans 21 24 5
StampSpans $c3 $GOLD $GOLD_ED
# sparkle plus shapes
SetPix 104 11 $GOLD; SetPix 103 12 $GOLD; SetPix 104 12 $GOLD; SetPix 105 12 $GOLD; SetPix 104 13 $GOLD
SetPix 114 21 $GOLD; SetPix 113 22 $GOLD; SetPix 114 22 $GOLD; SetPix 115 22 $GOLD; SetPix 114 23 $GOLD

# ---------- 6. frame (on top) ----------
FillRect 0 0 $CSIZE 4 $FRAME
FillRect 0 124 $CSIZE 4 $FRAME
FillRect 0 4 4 120 $FRAME
FillRect 124 4 4 120 $FRAME
FillRect 4 4 120 2 $CREAM
FillRect 4 122 120 2 $CREAM
FillRect 4 4 2 120 $CREAM
FillRect 122 4 2 120 $CREAM
# corner studs
FillRect 8 8 2 2 $GOLD
FillRect 112 8 2 2 $GOLD
FillRect 8 112 2 2 $GOLD
FillRect 112 112 2 2 $GOLD

# ---------- render PNG 128 ----------
$bmp = New-Object System.Drawing.Bitmap -ArgumentList $CSIZE, $CSIZE
for ($y = 0; $y -lt $CSIZE; $y++) {
    for ($x = 0; $x -lt $CSIZE; $x++) {
        $c = $canvas[$x, $y]
        if ($c) { $bmp.SetPixel($x, $y, [System.Drawing.ColorTranslator]::FromHtml($c)) }
    }
}

function Upscale($src, [int]$factor) {
    $size = $CSIZE * $factor
    $out = New-Object System.Drawing.Bitmap -ArgumentList $size, $size
    $g = [System.Drawing.Graphics]::FromImage($out)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $g.DrawImage($src, 0, 0, $size, $size)
    $g.Dispose()
    return $out
}

$root = Split-Path -Parent $PSScriptRoot
$texDir = Join-Path $root "assets\textures"
$b512 = Upscale $bmp 4
$b512.Save((Join-Path $texDir "game_logo_square.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$b512.Dispose()
$b1024 = Upscale $bmp 8
$b1024.Save((Join-Path $texDir "game_logo_square_1024.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$b1024.Dispose()
$bmp.Dispose()

# ---------- export editable SVG (run-merged rects, crispEdges) ----------
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$sb.AppendLine('<!-- Square pixel-art game logo - editable source (128x128 logical grid, crispEdges) -->')
[void]$sb.AppendLine('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="1024" height="1024" shape-rendering="crispEdges">')
for ($y = 0; $y -lt $CSIZE; $y++) {
    $x = 0
    while ($x -lt $CSIZE) {
        $c = $canvas[$x, $y]
        if (-not $c) { $x++; continue }
        $x2 = $x
        while ($x2 + 1 -lt $CSIZE -and $canvas[($x2 + 1), $y] -eq $c) { $x2++ }
        [void]$sb.AppendLine(('<rect x="{0}" y="{1}" width="{2}" height="1" fill="{3}"/>' -f $x, $y, ($x2 - $x + 1), $c))
        $x = $x2 + 1
    }
}
[void]$sb.AppendLine('</svg>')
$svgPath = Join-Path $root "tools\game_logo_square.svg"
[System.IO.File]::WriteAllText($svgPath, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
Write-Host "OK square logo PNG 512/1024 + SVG"
