// Windows end-to-end check, run on GitHub Actions windows-latest: real server, real overlay, real desktop.
//   bildschirm_ansehen -> zeigen(centre, 'Hier klicken, Saskia!') -> wait 1.5 s -> full-desktop capture
//   -> ausblenden -> capture again.
// Exit 0 only if every tool call succeeded, the overlay acknowledged point + hide, and arrow pixels
// sit at the target while the buddy is shown (and not once it is hidden).
// Artifacts (in buddy/): buddy-e2e.png (desktop), buddy-e2e-zoom.png (8x around the target, green frame =
// target pixel), buddy-e2e-hidden.png, buddy-e2e-shot.jpg (what Claude saw).
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// `node --test` collects every file under test/; this one is a script, not a unit test.
if (process.env.NODE_TEST_CONTEXT) process.exit(0);
if (process.platform !== 'win32') {
  console.log('e2e-windows: skipped, needs Windows');
  process.exit(0);
}

const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUBBLE = 'Hier klicken, Saskia!';
const SETTLE_MS = 1500;
const MIN_ARROW_PIXELS = 20;
const failures = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fail = (message) => {
  failures.push(message);
  console.log(`FAIL: ${message}`);
};

// Full virtual-desktop capture (DPI aware, CaptureBlt so layered windows are included), plus a count of
// arrow-coloured pixels in a 25x25 box around the target, which is mapped like geometry.js toScreen().
function captureDesktop({ out, zoomOut, imgX, imgY, imgW, imgH }) {
  const quote = (s) => `'${String(s).replaceAll("'", "''")}'`;
  const script = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type -IgnoreWarnings -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class E2eDpi {
  [DllImport("user32.dll")] static extern bool SetProcessDpiAwarenessContext(IntPtr v);
  [DllImport("user32.dll")] static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] static extern IntPtr GetDC(IntPtr h);
  [DllImport("user32.dll")] static extern int ReleaseDC(IntPtr h, IntPtr dc);
  [DllImport("gdi32.dll")] static extern bool BitBlt(IntPtr d, int x, int y, int w, int h, IntPtr s, int sx, int sy, int rop);
  public static void Enable() {
    try { if (SetProcessDpiAwarenessContext(new IntPtr(-4))) return; } catch (Exception) { }
    try { SetProcessDPIAware(); } catch (Exception) { }
  }
  // SRCCOPY | CAPTUREBLT via BitBlt: CopyFromScreen rejects the combined enum value.
  public static void Copy(System.Drawing.Bitmap bmp, int left, int top) {
    IntPtr screen = GetDC(IntPtr.Zero);
    using (System.Drawing.Graphics g = System.Drawing.Graphics.FromImage(bmp)) {
      IntPtr dest = g.GetHdc();
      BitBlt(dest, 0, 0, bmp.Width, bmp.Height, screen, left, top, 0x00CC0020 | 0x40000000);
      g.ReleaseHdc(dest);
    }
    ReleaseDC(IntPtr.Zero, screen);
  }
}
"@
[E2eDpi]::Enable()
$vs = [System.Windows.Forms.SystemInformation]::VirtualScreen
$mon = [System.Windows.Forms.Screen]::FromPoint([System.Windows.Forms.Cursor]::Position).Bounds
$tx = [Math]::Min([Math]::Max($mon.Left + [int][Math]::Floor(${imgX} * $mon.Width / ${imgW} + 0.5), $mon.Left), $mon.Right - 1)
$ty = [Math]::Min([Math]::Max($mon.Top + [int][Math]::Floor(${imgY} * $mon.Height / ${imgH} + 0.5), $mon.Top), $mon.Bottom - 1)
$bmp = New-Object System.Drawing.Bitmap $vs.Width, $vs.Height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
[E2eDpi]::Copy($bmp, $vs.Left, $vs.Top)
$bmp.Save(${quote(out)}, [System.Drawing.Imaging.ImageFormat]::Png)
$cx = $tx - $vs.Left
$cy = $ty - $vs.Top
$colors = @(@(0x2A,0x20,0x19), @(0xD9,0x77,0x57), @(0xB8,0x5C,0x3E))
$hits = 0
for ($dy = -12; $dy -le 12; $dy++) {
  for ($dx = -12; $dx -le 12; $dx++) {
    $px = $cx + $dx; $py = $cy + $dy
    if ($px -lt 0 -or $py -lt 0 -or $px -ge $vs.Width -or $py -ge $vs.Height) { continue }
    $c = $bmp.GetPixel($px, $py)
    foreach ($k in $colors) {
      if ([Math]::Abs($c.R - $k[0]) -le 10 -and [Math]::Abs($c.G - $k[1]) -le 10 -and [Math]::Abs($c.B - $k[2]) -le 10) { $hits++; break }
    }
  }
}
$zoomOut = ${quote(zoomOut ?? '')}
if ($zoomOut) {
  $r = 24; $s = 8
  $zoom = New-Object System.Drawing.Bitmap (2 * $r * $s), (2 * $r * $s)
  $zg = [System.Drawing.Graphics]::FromImage($zoom)
  $zg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $zg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $src = New-Object System.Drawing.Rectangle ($cx - $r), ($cy - $r), (2 * $r), (2 * $r)
  $dst = New-Object System.Drawing.Rectangle 0, 0, (2 * $r * $s), (2 * $r * $s)
  $zg.DrawImage($bmp, $dst, $src, [System.Drawing.GraphicsUnit]::Pixel)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Lime), 2
  $zg.DrawRectangle($pen, $r * $s - 1, $r * $s - 1, $s + 1, $s + 1)
  $pen.Dispose(); $zg.Dispose()
  $zoom.Save($zoomOut, [System.Drawing.Imaging.ImageFormat]::Png)
  $zoom.Dispose()
}
$bmp.Dispose()
$result = [ordered]@{
  target = [ordered]@{ x = [int]$tx; y = [int]$ty }
  monitor = [ordered]@{ left = $mon.Left; top = $mon.Top; width = $mon.Width; height = $mon.Height }
  virtualScreen = [ordered]@{ left = $vs.Left; top = $vs.Top; width = $vs.Width; height = $vs.Height }
  arrowPixelsNearTarget = $hits
}
Write-Output ($result | ConvertTo-Json -Compress)
`;
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  const res = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
    { encoding: 'utf8', windowsHide: true, timeout: 60000 },
  );
  if (res.status !== 0) throw new Error(`desktop capture failed (${res.status}): ${res.stderr || res.error}`);
  const line = res.stdout
    .split(/\r?\n/)
    .filter((l) => l.trim().startsWith('{'))
    .at(-1);
  return JSON.parse(line);
}

const acks = [];
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [join(root, 'server', 'index.js')],
  cwd: root,
  env: Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('BUDDY_'))),
  stderr: 'pipe',
});
let stderrBuffer = '';
transport.stderr.on('data', (chunk) => {
  stderrBuffer += chunk.toString('utf8');
  const lines = stderrBuffer.split(/\r?\n/);
  stderrBuffer = lines.pop();
  for (const line of lines) {
    console.log(`server| ${line}`);
    const ack = /\[overlay\] (\{.*"ok".*\})/.exec(line);
    if (ack) acks.push(JSON.parse(ack[1]));
  }
});

const client = new Client({ name: 'buddy-e2e', version: '1.0.0' });
await client.connect(transport);

async function call(name, args) {
  const started = Date.now();
  const res = await client.callTool({ name, arguments: args }, undefined, { timeout: 90000 });
  const text = res.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join(' ');
  console.log(`${name}(${JSON.stringify(args)}) -> ${res.isError ? 'ERROR: ' : ''}${text} [${Date.now() - started} ms]`);
  if (res.isError) fail(`${name} returned isError`);
  return { res, text };
}

try {
  const { tools } = await client.listTools();
  console.log(`tools: ${tools.map((t) => t.name).join(', ')}`);

  const { res: shotRes, text: shotText } = await call('bildschirm_ansehen', {});
  const image = shotRes.content.find((c) => c.type === 'image');
  if (image) writeFileSync(join(root, 'buddy-e2e-shot.jpg'), Buffer.from(image.data, 'base64'));
  else fail('bildschirm_ansehen returned no image');
  const size = /Screenshot (\d+)x(\d+)/.exec(shotText);
  if (!size) throw new Error(`no image size in "${shotText}"`);
  const imgW = Number(size[1]);
  const imgH = Number(size[2]);
  const x = Math.round(imgW / 2);
  const y = Math.round(imgH / 2);

  await call('zeigen', { x, y, text: BUBBLE });
  await sleep(SETTLE_MS);
  const shown = captureDesktop({ out: join(root, 'buddy-e2e.png'), zoomOut: join(root, 'buddy-e2e-zoom.png'), imgX: x, imgY: y, imgW, imgH });
  console.log(`shown:  ${JSON.stringify(shown)}`);

  await call('ausblenden', {});
  await sleep(500);
  const hidden = captureDesktop({ out: join(root, 'buddy-e2e-hidden.png'), imgX: x, imgY: y, imgW, imgH });
  console.log(`hidden: ${JSON.stringify(hidden)}`);

  const arrowPixels = shown.arrowPixelsNearTarget - hidden.arrowPixelsNearTarget;
  if (arrowPixels < MIN_ARROW_PIXELS) {
    fail(`only ${arrowPixels} arrow pixels around the target (need ${MIN_ARROW_PIXELS}); see buddy-e2e-zoom.png`);
  }
  for (const cmd of ['ready', 'point', 'hide']) {
    if (!acks.some((a) => a.ok && a.cmd === cmd)) fail(`no {"ok":true,"cmd":"${cmd}"} from the overlay`);
  }
  console.log(`overlay acks: ${acks.map((a) => JSON.stringify(a)).join(' ')}`);
} catch (error) {
  fail(error.stack || String(error));
} finally {
  await client.close();
  await sleep(1500); // let the server tell the overlay to quit and log its exit
}

if (failures.length) {
  console.log(`\ne2e-windows: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('\ne2e-windows: ok, Pixel-Laurin points at the screen centre');
process.exit(0);
