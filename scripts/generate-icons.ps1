param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\public")
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function New-FgStoreIcon {
  param(
    [int]$Size,
    [string]$Path
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.Color]::FromArgb(7, 9, 20))

  $inset = [Math]::Round($Size * 0.08)
  $diameter = $Size - ($inset * 2)
  $bounds = New-Object System.Drawing.Rectangle($inset, $inset, $diameter, $diameter)
  $background = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $bounds,
    [System.Drawing.Color]::FromArgb(14, 28, 49),
    [System.Drawing.Color]::FromArgb(31, 20, 66),
    45
  )
  $graphics.FillEllipse($background, $bounds)

  $borderWidth = [Math]::Max(2, [Math]::Round($Size * 0.018))
  $border = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $bounds,
    [System.Drawing.Color]::FromArgb(34, 211, 238),
    [System.Drawing.Color]::FromArgb(139, 92, 246),
    45
  )
  $pen = New-Object System.Drawing.Pen($border, $borderWidth)
  $graphics.DrawEllipse($pen, $bounds)

  $fontSize = [Math]::Round($Size * 0.3)
  $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(247, 248, 255))
  $textBounds = New-Object System.Drawing.RectangleF(
    [single]$bounds.X,
    [single]$bounds.Y,
    [single]$bounds.Width,
    [single]$bounds.Height
  )
  $graphics.DrawString("FG", $font, $textBrush, $textBounds, $format)

  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $textBrush.Dispose()
  $format.Dispose()
  $font.Dispose()
  $pen.Dispose()
  $border.Dispose()
  $background.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
[System.IO.Directory]::CreateDirectory($resolvedOutput) | Out-Null

New-FgStoreIcon -Size 192 -Path (Join-Path $resolvedOutput "icon-192.png")
New-FgStoreIcon -Size 512 -Path (Join-Path $resolvedOutput "icon-512.png")

Write-Output "Generated PWA icons in $resolvedOutput"
