param(
  [Parameter(Mandatory = $true)][string]$Step02Source,
  [Parameter(Mandatory = $true)][string]$Step03Source,
  [Parameter(Mandatory = $true)][string]$Step06Source,
  [Parameter(Mandatory = $true)][string]$Step08SettingsSource,
  [Parameter(Mandatory = $true)][string]$Step08LanguageSource,
  [Parameter(Mandatory = $true)][string]$Step08SelectSource,
  [Parameter(Mandatory = $true)][string]$Step08SaveSource,
  [Parameter(Mandatory = $true)][string]$Step13Source,
  [string]$OutputDirectory
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

function New-DetachedBitmap {
  param([Parameter(Mandatory = $true)][string]$Path)

  $source = [System.Drawing.Image]::FromFile($Path)
  try {
    return [System.Drawing.Bitmap]::new($source)
  }
  finally {
    $source.Dispose()
  }
}

function Add-Redaction {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Bitmap]$Bitmap,
    [Parameter(Mandatory = $true)][System.Drawing.Rectangle]$Rectangle,
    [Parameter(Mandatory = $true)][string]$Label,
    [Parameter(Mandatory = $true)][System.Drawing.Color]$Background,
    [Parameter(Mandatory = $true)][System.Drawing.Color]$Foreground,
    [float]$FontSize = 14,
    [switch]$Center
  )

  $graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
  $backgroundBrush = [System.Drawing.SolidBrush]::new($Background)
  $foregroundBrush = [System.Drawing.SolidBrush]::new($Foreground)
  $font = [System.Drawing.Font]::new("Segoe UI", $FontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = [System.Drawing.StringFormat]::new()

  try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $graphics.FillRectangle($backgroundBrush, $Rectangle)

    if ($Center) {
      $format.Alignment = [System.Drawing.StringAlignment]::Center
      $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    }
    else {
      $format.Alignment = [System.Drawing.StringAlignment]::Near
      $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    }

    $inset = if ($Center) {
      [System.Drawing.RectangleF]::new($Rectangle.X, $Rectangle.Y, $Rectangle.Width, $Rectangle.Height)
    }
    else {
      [System.Drawing.RectangleF]::new($Rectangle.X + 10, $Rectangle.Y, $Rectangle.Width - 20, $Rectangle.Height)
    }
    $graphics.DrawString($Label, $font, $foregroundBrush, $inset, $format)
  }
  finally {
    $format.Dispose()
    $font.Dispose()
    $foregroundBrush.Dispose()
    $backgroundBrush.Dispose()
    $graphics.Dispose()
  }
}

function Save-Png {
  param(
    [Parameter(Mandatory = $true)][System.Drawing.Bitmap]$Bitmap,
    [Parameter(Mandatory = $true)][string]$Name
  )

  $destination = Join-Path $OutputDirectory $Name
  $Bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Output $destination
}

function Copy-AsPng {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Name
  )

  $bitmap = New-DetachedBitmap -Path $Source
  try {
    Save-Png -Bitmap $bitmap -Name $Name
  }
  finally {
    $bitmap.Dispose()
  }
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
  $OutputDirectory = Join-Path $projectRoot "public\tutorial"
}

[System.IO.Directory]::CreateDirectory($OutputDirectory) | Out-Null
$OutputDirectory = (Resolve-Path $OutputDirectory).Path

$step02 = New-DetachedBitmap -Path $Step02Source
try {
  Add-Redaction -Bitmap $step02 -Rectangle ([System.Drawing.Rectangle]::new(119, 496, 258, 44)) -Label "EUR-XXXXXXXX" -Background ([System.Drawing.Color]::FromArgb(12, 12, 24)) -Foreground ([System.Drawing.Color]::White) -FontSize 17
  Save-Png -Bitmap $step02 -Name "step-02-redeem-form.png"
}
finally {
  $step02.Dispose()
}

$step03 = New-DetachedBitmap -Path $Step03Source
try {
  Add-Redaction -Bitmap $step03 -Rectangle ([System.Drawing.Rectangle]::new(140, 156, 484, 34)) -Label "1 UNIT - KODE CONTOH - REDEEM BERHASIL" -Background ([System.Drawing.Color]::FromArgb(19, 19, 30)) -Foreground ([System.Drawing.Color]::White) -FontSize 12 -Center
  Add-Redaction -Bitmap $step03 -Rectangle ([System.Drawing.Rectangle]::new(162, 533, 158, 44)) -Label "AKUN CONTOH" -Background ([System.Drawing.Color]::FromArgb(30, 31, 43)) -Foreground ([System.Drawing.Color]::White) -FontSize 11 -Center
  Add-Redaction -Bitmap $step03 -Rectangle ([System.Drawing.Rectangle]::new(318, 533, 150, 44)) -Label "DISAMARKAN" -Background ([System.Drawing.Color]::FromArgb(30, 31, 43)) -Foreground ([System.Drawing.Color]::White) -FontSize 11 -Center
  Add-Redaction -Bitmap $step03 -Rectangle ([System.Drawing.Rectangle]::new(467, 533, 158, 44)) -Label "DISAMARKAN" -Background ([System.Drawing.Color]::FromArgb(30, 31, 43)) -Foreground ([System.Drawing.Color]::White) -FontSize 11 -Center
  Save-Png -Bitmap $step03 -Name "step-03-redeem-result.png"
}
finally {
  $step03.Dispose()
}

$step06 = New-DetachedBitmap -Path $Step06Source
try {
  Add-Redaction -Bitmap $step06 -Rectangle ([System.Drawing.Rectangle]::new(106, 155, 310, 36)) -Label "akun-contoh@outlook.com" -Background ([System.Drawing.Color]::White) -Foreground ([System.Drawing.Color]::FromArgb(32, 32, 32)) -FontSize 17
  Save-Png -Bitmap $step06 -Name "step-06-recovery-email.png"
}
finally {
  $step06.Dispose()
}

$step08Settings = New-DetachedBitmap -Path $Step08SettingsSource
try {
  $cropped = [System.Drawing.Bitmap]::new($step08Settings.Width, 326)
  $graphics = [System.Drawing.Graphics]::FromImage($cropped)
  try {
    $graphics.DrawImage($step08Settings, [System.Drawing.Rectangle]::new(0, 0, $cropped.Width, $cropped.Height), [System.Drawing.Rectangle]::new(0, 0, $cropped.Width, $cropped.Height), [System.Drawing.GraphicsUnit]::Pixel)
  }
  finally {
    $graphics.Dispose()
  }

  try {
    Add-Redaction -Bitmap $cropped -Rectangle ([System.Drawing.Rectangle]::new(45, 0, 280, 44)) -Label "OUTLOOK" -Background ([System.Drawing.Color]::FromArgb(48, 48, 48)) -Foreground ([System.Drawing.Color]::White) -FontSize 12 -Center
    Save-Png -Bitmap $cropped -Name "step-08-01-open-settings.png"
  }
  finally {
    $cropped.Dispose()
  }
}
finally {
  $step08Settings.Dispose()
}

$step08Language = New-DetachedBitmap -Path $Step08LanguageSource
try {
  Add-Redaction -Bitmap $step08Language -Rectangle ([System.Drawing.Rectangle]::new(45, 0, 280, 44)) -Label "OUTLOOK" -Background ([System.Drawing.Color]::FromArgb(48, 48, 48)) -Foreground ([System.Drawing.Color]::White) -FontSize 12 -Center
  Save-Png -Bitmap $step08Language -Name "step-08-02-language-menu.png"
}
finally {
  $step08Language.Dispose()
}

Copy-AsPng -Source $Step08SelectSource -Name "step-08-03-select-indonesian.png"
Copy-AsPng -Source $Step08SaveSource -Name "step-08-04-save-language.png"

$step13 = New-DetachedBitmap -Path $Step13Source
try {
  Add-Redaction -Bitmap $step13 -Rectangle ([System.Drawing.Rectangle]::new(205, 258, 225, 225)) -Label "QR MFA`nDISAMARKAN" -Background ([System.Drawing.Color]::FromArgb(20, 20, 20)) -Foreground ([System.Drawing.Color]::White) -FontSize 18 -Center
  Save-Png -Bitmap $step13 -Name "step-13-open-manual-key.png"
}
finally {
  $step13.Dispose()
}
