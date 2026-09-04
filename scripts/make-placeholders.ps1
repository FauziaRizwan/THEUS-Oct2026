Add-Type -AssemblyName System.Drawing

$outDir = Join-Path $PSScriptRoot "..\images\projects"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

$projects = @(
  @{ slug = "faisal-town-islamabad";     c1 = "#4a4640"; c2 = "#6b655a" },
  @{ slug = "aviation-city-kamra";       c1 = "#3f4a48"; c2 = "#5c6b66" },
  @{ slug = "dha-quetta";                c1 = "#463f3a"; c2 = "#6b5f54" },
  @{ slug = "city-housing";              c1 = "#3d4246"; c2 = "#5a6268" },
  @{ slug = "rahman-enclave-cda-noc";    c1 = "#443f46"; c2 = "#665e6b" }
)

$W = 1920
$H = 1080

function Get-Color($hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($hex)
}

foreach ($p in $projects) {
  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $color1 = Get-Color $p.c1
  $color2 = Get-Color $p.c2
  $rect = New-Object System.Drawing.Rectangle 0, 0, $W, $H
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $color1, $color2, 35)
  $g.FillRectangle($brush, $rect)

  # Subtle diagonal blueprint-style lines for architectural texture
  $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(18, 255, 255, 255), 1)
  for ($x = -$H; $x -lt $W; $x += 64) {
    $g.DrawLine($linePen, $x, $H, $x + $H, 0)
  }

  # Soft vignette at top for depth
  $vRect = New-Object System.Drawing.Rectangle(0, 0, $W, [int]($H * 0.45))
  $vBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($vRect, [System.Drawing.Color]::FromArgb(60,0,0,0), [System.Drawing.Color]::FromArgb(0,0,0,0), 90)
  $g.FillRectangle($vBrush, $vRect)

  # Centered placeholder watermark text
  $font = New-Object System.Drawing.Font("Segoe UI", 28, [System.Drawing.FontStyle]::Bold)
  $textColor = [System.Drawing.Color]::FromArgb(60, 255, 255, 255)
  $textBrush = New-Object System.Drawing.SolidBrush($textColor)
  $text = "PLACEHOLDER - REPLACE WITH PROJECT PHOTO"
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString($text, $font, $textBrush, [System.Drawing.PointF]::new($W/2, $H/2), $sf)

  $g.Dispose()

  # Encode as JPEG at moderate quality to keep file size small
  $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
  $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]68)

  $outPath = Join-Path $outDir ($p.slug + ".jpg")
  $bmp.Save($outPath, $jpegCodec, $encParams)
  $bmp.Dispose()

  $sizeKB = [math]::Round((Get-Item $outPath).Length / 1KB, 1)
  Write-Output "$($p.slug).jpg -> $sizeKB KB"
}
