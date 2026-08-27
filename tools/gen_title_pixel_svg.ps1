# Pixel-style game title generator v2 (SVG master pipeline)
# NOTE: ASCII-only comments on purpose - this PS host reads scripts as ANSI/GBK,
# and a UTF-8 multibyte char right before LF would swallow the newline.
#
# Pipeline:
#   1) tools\game_title_pixel.svg  = editable vector master (UTF-8, CJK text OK)
#   2) Microsoft Edge headless rasterizes the SVG to a SMALL PNG (213x48,
#      transparent background via --default-background-color=00000000)
#   3) Small raster is posterized to 3 colors (transparent / white fill /
#      dark outline #281E3C) so every edge is a hard 0<->255 alpha transition
#   4) System.Drawing nearest-neighbor upscale x3 (no smoothing) -> 639x144,
#      centered on the fixed 640x160 canvas (transparent margins as needed)
#      => each small pixel becomes a chunky 3x3 block -> pixel-font look
#
# Output: assets\resources\images\ui\game_title_pixel.png (overwritten)
# Idempotent: safe to re-run. The old gen_title_pixel.ps1 (GDI+) stays as v1;
# the SVG master is now the source of truth.
Add-Type -AssemblyName System.Drawing
# 'Continue' on purpose: Edge writes harmless noise to stderr (e.g. importer
# warnings) which PS 5.1 would turn into terminating errors under 'Stop'.
# Real failures are caught by explicit Test-Path checks + throw below.
$ErrorActionPreference = 'Continue'

# ---- config (edit here) ----
$edgeExe = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$smallW  = 213
$smallH  = 48
$scale   = 3
$outW    = 640                                # final canvas width (fixed)
$outH    = 160                                # final canvas height (fixed)
$strokeR = 40; $strokeG = 30; $strokeB = 60   # dark outline #281E3C (40,30,60)
$whiteTol = 24                                # posterize snap: near-white -> fill

$root    = Split-Path -Parent $PSScriptRoot
$svgFile = Join-Path $root 'tools\game_title_pixel.svg'
$outDir  = Join-Path $root 'assets\resources\images\ui'
$outFile = Join-Path $outDir 'game_title_pixel.png'

if (-not (Test-Path $edgeExe)) { throw "Edge executable not found: $edgeExe" }
if (-not (Test-Path $svgFile)) { throw "SVG master not found: $svgFile" }
if (-not (Test-Path $outDir))  { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

# unique temp dir (ASCII path) so the file:// URL carries no CJK chars to encode
$tmpDir = Join-Path $env:TEMP ('title_svg_' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmpDir | Out-Null
$tmpSvg = Join-Path $tmpDir 'title.svg'
$tmpPng = Join-Path $tmpDir 'small.png'
Copy-Item -LiteralPath $svgFile -Destination $tmpSvg -Force

# ---- 1) rasterize SVG via Edge headless (transparent bg) ----
# NOTE: use Start-Process, NOT "& exe ... 2>$null | Out-Null". PS 5.1 stderr
# redirection keeps a pipe open while Edge's child processes inherit the
# handle, which hangs the script.
# Edge headless on this machine is flaky: the renderer sometimes hangs and
# never writes the screenshot (~50% per attempt). So we retry up to
# $edgeRetries times, polling for the PNG FILE (not the process exit - the
# PNG appears once the capture is done). Leftover processes of THIS run are
# swept via Stop-MyEdge (exact parent-PID tree + unique temp token), so the
# user's own Edge is never touched.
$fileUrl = 'file:///' + ($tmpSvg.Replace('\', '/'))
$edgeArgs = @(
    '--headless', '--disable-gpu', '--force-device-scale-factor=1', '--hide-scrollbars',
    "--user-data-dir=$tmpDir\profile",
    "--screenshot=$tmpPng",
    "--window-size=$smallW,$smallH",
    '--default-background-color=00000000',
    $fileUrl
)
$edgeRetries   = 4
$edgeTimeoutMs = 25000
$pngReady = $false

# Kill every msedge process belonging to THIS run: walk the child tree of
# the browser process we spawned (exact parent-PID match), plus any process
# whose command line contains the unique temp token (catches reparented
# stragglers). The user's own Edge is never matched, so it is untouched.
function Stop-MyEdge([int]$rootPid, [string]$token) {
    $all = @(Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" -ErrorAction SilentlyContinue)
    $targets = @{}
    foreach ($pr in $all) {
        if ($pr.CommandLine -and $pr.CommandLine.Contains($token)) { $targets[$pr.ProcessId] = $true }
    }
    $queue = New-Object System.Collections.Queue
    $queue.Enqueue($rootPid)
    while ($queue.Count -gt 0) {
        $cur = $queue.Dequeue()
        $targets[$cur] = $true
        foreach ($pr in $all) {
            if ($pr.ParentProcessId -eq $cur -and -not $targets.ContainsKey($pr.ProcessId)) {
                $targets[$pr.ProcessId] = $true
                $queue.Enqueue($pr.ProcessId)
            }
        }
    }
    foreach ($id in @($targets.Keys)) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
}

for ($attempt = 1; $attempt -le $edgeRetries; $attempt++) {
    if ($attempt -gt 1) { Write-Host "Edge attempt $attempt of $edgeRetries ..." }
    $edgeProc = Start-Process -FilePath $edgeExe -ArgumentList $edgeArgs -PassThru -NoNewWindow

    $deadline = (Get-Date).AddMilliseconds($edgeTimeoutMs)
    while ((Get-Date) -lt $deadline) {
        if (Test-Path $tmpPng) { break }
        Start-Sleep -Milliseconds 500
    }
    # capture the child tree while the browser process is still alive, then kill
    Stop-MyEdge $edgeProc.Id (Split-Path -Leaf $tmpDir)

    if (Test-Path $tmpPng) {
        try {
            $check = New-Object System.Drawing.Bitmap -ArgumentList $tmpPng
            $valid = ($check.Width -eq $smallW -and $check.Height -eq $smallH)
            $check.Dispose()
            if ($valid) { $pngReady = $true; break }
        } catch {
            # partial/corrupt file: pretend not ready and retry
        }
    }
}
if (-not $pngReady) { throw "Edge headless produced no valid screenshot after $edgeRetries attempts" }

$small = New-Object System.Drawing.Bitmap -ArgumentList $tmpPng
if ($small.Width -ne $smallW -or $small.Height -ne $smallH) {
    throw ("Unexpected raster size {0}x{1}, expected {2}x{3}" -f $small.Width, $small.Height, $smallW, $smallH)
}

# ---- 2) white-bg fallback if the transparency flag was ignored ----
$corner = $small.GetPixel(0, 0)
if ($corner.A -ne 0) {
    Write-Host 'WARN: --default-background-color ignored; converting white bg to transparent'
    for ($y = 0; $y -lt $smallH; $y++) {
        for ($x = 0; $x -lt $smallW; $x++) {
            $c = $small.GetPixel($x, $y)
            if ($c.R -eq 255 -and $c.G -eq 255 -and $c.B -eq 255) {
                $small.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
            }
        }
    }
}

# ---- 3) posterize: transparent / white fill / dark outline (hard 0<->255 edges) ----
for ($y = 0; $y -lt $smallH; $y++) {
    for ($x = 0; $x -lt $smallW; $x++) {
        $c = $small.GetPixel($x, $y)
        if ($c.A -lt 128) {
            $small.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($c.R -ge (255 - $whiteTol) -and $c.G -ge (255 - $whiteTol) -and $c.B -ge (255 - $whiteTol)) {
            $small.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
        } else {
            $small.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $strokeR, $strokeG, $strokeB))
        }
    }
}

# ---- 4) nearest-neighbor x$scale upscale, centered on the 640x160 canvas ----
$bigW = $smallW * $scale
$bigH = $smallH * $scale
$big = New-Object System.Drawing.Bitmap -ArgumentList $bigW, $bigH
$g = [System.Drawing.Graphics]::FromImage($big)
$g.Clear([System.Drawing.Color]::Transparent)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$g.DrawImage($small, 0, 0, $bigW, $bigH)

# compose the upscaled image centered on the fixed canvas; leftover area
# stays transparent (integer offsets, exact 1:1 pixel copy, no smoothing)
$out = New-Object System.Drawing.Bitmap -ArgumentList $outW, $outH
$g2 = [System.Drawing.Graphics]::FromImage($out)
$g2.Clear([System.Drawing.Color]::Transparent)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$offsetX = [int][Math]::Floor(($outW - $bigW) / 2)
$offsetY = [int][Math]::Floor(($outH - $bigH) / 2)
$g2.DrawImage($big, $offsetX, $offsetY, $bigW, $bigH)
$out.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)

# ---- 5) cleanup ----
$g.Dispose(); $g2.Dispose(); $big.Dispose(); $small.Dispose(); $out.Dispose()
# final sweep for late-spawned Edge children of this run
Stop-MyEdge $edgeProc.Id (Split-Path -Leaf $tmpDir)
Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue

$len = (Get-Item -LiteralPath $outFile).Length
Write-Host "OK: $outFile  $outW x $outH, $len bytes"
