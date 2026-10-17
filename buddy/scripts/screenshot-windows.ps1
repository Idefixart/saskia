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
Add-Type -IgnoreWarnings -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class LaurinBuddyDpi
{
    private const int SRCCOPY = 0x00CC0020;
    private const int CAPTUREBLT = 0x40000000;

    [DllImport("user32.dll")]
    private static extern bool SetProcessDpiAwarenessContext(IntPtr value);

    [DllImport("user32.dll")]
    private static extern bool SetProcessDPIAware();

    [DllImport("user32.dll")]
    private static extern IntPtr GetDC(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

    [DllImport("gdi32.dll", SetLastError = true)]
    private static extern bool BitBlt(IntPtr hdcDest, int xDest, int yDest, int width, int height, IntPtr hdcSrc, int xSrc, int ySrc, int rop);

    // Copies the screen rectangle starting at (left, top) into the bitmap, including layered
    // windows (menus, tooltips). Calls BitBlt directly because Graphics.CopyFromScreen rejects
    // SourceCopy | CaptureBlt as an invalid CopyPixelOperation value.
    public static void CopyScreen(System.Drawing.Bitmap target, int left, int top)
    {
        IntPtr screen = GetDC(IntPtr.Zero);
        try
        {
            using (System.Drawing.Graphics graphics = System.Drawing.Graphics.FromImage(target))
            {
                IntPtr dest = graphics.GetHdc();
                try
                {
                    if (!BitBlt(dest, 0, 0, target.Width, target.Height, screen, left, top, SRCCOPY | CAPTUREBLT))
                    {
                        throw new InvalidOperationException("BitBlt failed with Win32 error " + Marshal.GetLastWin32Error());
                    }
                }
                finally
                {
                    graphics.ReleaseHdc(dest);
                }
            }
        }
        finally
        {
            ReleaseDC(IntPtr.Zero, screen);
        }
    }

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
[LaurinBuddyDpi]::CopyScreen($full, $bounds.Left, $bounds.Top)

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
