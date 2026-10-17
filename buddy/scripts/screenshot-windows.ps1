# Screenshot of the monitor under the mouse for laurin-buddy (Windows PowerShell 5.1).
# DPI-aware (per-monitor v2, same as the overlay), so all numbers are physical pixels.
# Downscales to at most -MaxWidth px wide (HighQualityBicubic), saves a JPEG (quality 80) to -Out
# and prints the geometry as one JSON line: {"left","top","width","height","imgW","imgH","path"}.
param(
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$MaxWidth = 1280
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type -IgnoreWarnings -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class LaurinBuddyDpi
{
    [DllImport("user32.dll")]
    private static extern bool SetProcessDpiAwarenessContext(IntPtr value);

    [DllImport("user32.dll")]
    private static extern bool SetProcessDPIAware();

    public static void Enable()
    {
        try
        {
            if (SetProcessDpiAwarenessContext(new IntPtr(-4))) return;
        }
        catch (Exception)
        {
            // older than Windows 10 1703
        }
        try
        {
            SetProcessDPIAware();
        }
        catch (Exception)
        {
            // keep going unscaled
        }
    }
}
'@
# Must run before the first Screen/Cursor call.
[LaurinBuddyDpi]::Enable()

$cursor = [System.Windows.Forms.Cursor]::Position
$bounds = [System.Windows.Forms.Screen]::FromPoint($cursor).Bounds

$full = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$graphics = [System.Drawing.Graphics]::FromImage($full)
try {
  # CaptureBlt includes layered windows such as menus and tooltips.
  $op = [System.Drawing.CopyPixelOperation]::SourceCopy -bor [System.Drawing.CopyPixelOperation]::CaptureBlt
  $graphics.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $bounds.Size, $op)
} finally {
  $graphics.Dispose()
}

# Same rule as geometry.js fitWidth(): keep small screens, else MaxWidth wide, aspect kept (round half up).
if ($bounds.Width -le $MaxWidth) {
  $imgW = $bounds.Width
  $imgH = $bounds.Height
} else {
  $imgW = $MaxWidth
  $imgH = [int][Math]::Floor(($bounds.Height * $MaxWidth / $bounds.Width) + 0.5)
}

$small = New-Object System.Drawing.Bitmap $imgW, $imgH, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$scaler = [System.Drawing.Graphics]::FromImage($small)
$attributes = New-Object System.Drawing.Imaging.ImageAttributes
try {
  $scaler.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $scaler.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $scaler.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $scaler.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  # TileFlipXY stops the bicubic filter from darkening the image edges.
  $attributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
  $dest = New-Object System.Drawing.Rectangle 0, 0, $imgW, $imgH
  $scaler.DrawImage($full, $dest, 0, 0, $bounds.Width, $bounds.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes)
} finally {
  $attributes.Dispose()
  $scaler.Dispose()
  $full.Dispose()
}

$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]80)
try {
  $small.Save($Out, $jpeg, $encoderParams)
} finally {
  $encoderParams.Dispose()
  $small.Dispose()
}

$geometry = [ordered]@{
  left   = [int]$bounds.Left
  top    = [int]$bounds.Top
  width  = [int]$bounds.Width
  height = [int]$bounds.Height
  imgW   = [int]$imgW
  imgH   = [int]$imgH
  path   = [string]$Out
}
Write-Output ($geometry | ConvertTo-Json -Compress)
