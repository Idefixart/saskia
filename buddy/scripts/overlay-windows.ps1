# Pixel-Laurin overlay for Windows (Windows PowerShell 5.1, WinForms, nothing to install).
# A borderless, click-through, always-on-top window that never takes focus. It only points, it never clicks.
# Protocol: one JSON object per line on stdin, one ack per handled command on stdout:
#   {"cmd":"point","x":1234,"y":567,"text":"Hier auf 'Speichern'"}  -> {"ok":true,"cmd":"point"}
#   {"cmd":"hide"}                                                  -> {"ok":true,"cmd":"hide"}
#   {"cmd":"quit"}                                                  -> {"ok":true,"cmd":"quit"}
# x/y are physical screen pixels (virtual-screen coordinates). The process exits when stdin closes.
param(
  [string]$Sprite = (Join-Path $PSScriptRoot '..\server\sprite.json')
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms, System.Drawing, System.Web.Extensions
$references = @(
  [System.Windows.Forms.Form].Assembly.Location,
  [System.Drawing.Bitmap].Assembly.Location,
  [System.Web.Script.Serialization.JavaScriptSerializer].Assembly.Location
)

# C# 5 only (Windows PowerShell's Add-Type compiler): no $"", no =>-members, no ?., no nameof.
$source = @'
using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace LaurinBuddy
{
    [StructLayout(LayoutKind.Sequential)]
    internal struct NativePoint
    {
        public int X;
        public int Y;
        public NativePoint(int x, int y) { X = x; Y = y; }
    }

    internal static class Native
    {
        [DllImport("user32.dll")]
        public static extern bool SetProcessDpiAwarenessContext(IntPtr value);

        [DllImport("user32.dll")]
        public static extern bool SetProcessDPIAware();

        [DllImport("user32.dll")]
        public static extern bool SetWindowPos(IntPtr hWnd, IntPtr insertAfter, int x, int y, int cx, int cy, uint flags);

        [DllImport("user32.dll")]
        public static extern bool ShowWindow(IntPtr hWnd, int cmd);

        [DllImport("user32.dll")]
        public static extern IntPtr MonitorFromPoint(NativePoint pt, uint flags);

        [DllImport("shcore.dll")]
        public static extern int GetDpiForMonitor(IntPtr monitor, int dpiType, out uint dpiX, out uint dpiY);

        public static readonly IntPtr HwndTopmost = new IntPtr(-1);
        public const uint SwpNoSize = 0x0001;
        public const uint SwpNoZOrder = 0x0004;
        public const uint SwpNoActivate = 0x0010;
        public const int SwShowNoActivate = 4;
        public const uint MonitorDefaultToNearest = 2;
    }

    internal sealed class PixelRun
    {
        public readonly int X;
        public readonly int Y;
        public readonly int Length;
        public readonly Color Color;

        public PixelRun(int x, int y, int length, Color color)
        {
            X = x; Y = y; Length = length; Color = color;
        }
    }

    // Pixel art as horizontal runs of one colour, so painting is a handful of FillRectangle calls.
    internal sealed class PixelArt
    {
        public readonly int Cols;
        public readonly int Rows;
        public readonly int AnchorX;
        public readonly int AnchorY;
        public readonly List<PixelRun> Runs = new List<PixelRun>();

        public PixelArt(string[] rows, Dictionary<char, Color> palette, int anchorX, int anchorY)
        {
            Rows = rows.Length;
            int cols = 0;
            for (int y = 0; y < rows.Length; y++)
            {
                string row = rows[y];
                if (row.Length > cols) cols = row.Length;
                int x = 0;
                while (x < row.Length)
                {
                    char key = row[x];
                    Color color;
                    if (key == '.' || !palette.TryGetValue(key, out color))
                    {
                        x++;
                        continue;
                    }
                    int start = x;
                    while (x < row.Length && row[x] == key) x++;
                    Runs.Add(new PixelRun(start, y, x - start, color));
                }
            }
            Cols = cols;
            AnchorX = anchorX;
            AnchorY = anchorY;
        }
    }

    // Where arrow, Pixel-Laurin and the bubble go, relative to the arrow tip (= the target, 0,0).
    // Fx/Fy: +1 = buddy right of / below the target, -1 = left of / above (flipped near screen edges).
    internal sealed class BuddyLayout
    {
        public int Fx;
        public int Fy;
        public int Cell;
        public int Pad;
        public int TailTop;
        public Size TextSize;
        public Rectangle Arrow;
        public Rectangle Sprite;
        public Rectangle Bubble;
        public Rectangle Bounds;

        public static BuddyLayout Build(PixelArt sprite, int arrowCells, int cell, Size textSize, int fx, int fy)
        {
            BuddyLayout l = new BuddyLayout();
            l.Fx = fx;
            l.Fy = fy;
            l.Cell = cell;
            l.TextSize = textSize;
            int span = arrowCells * cell;
            l.Arrow = new Rectangle(fx > 0 ? 0 : 1 - span, fy > 0 ? 0 : 1 - span, span, span);

            // Pixel-Laurin's fingertip (the sprite anchor) holds the arrow's tail end.
            int handX = fx * (int)Math.Round((arrowCells - 0.5) * cell);
            int handY = fy * (arrowCells - 1) * cell;
            int anchorCol = fx > 0 ? sprite.AnchorX : sprite.Cols - 1 - sprite.AnchorX;
            int sx = handX - (anchorCol * cell + cell / 2);
            int sy = handY - (sprite.AnchorY * cell + cell / 2);
            l.Sprite = new Rectangle(sx, sy, sprite.Cols * cell, sprite.Rows * cell);
            l.Bounds = Rectangle.Union(l.Arrow, l.Sprite);

            if (textSize.Width > 0 && textSize.Height > 0)
            {
                l.Pad = 3 * cell;
                int gap = 3 * cell; // room for the bubble's pixel tail
                int bw = textSize.Width + 2 * (cell + l.Pad);
                int bh = Math.Max(textSize.Height + 2 * (cell + l.Pad), 8 * cell);
                int bx = fx > 0 ? l.Sprite.Right + gap : l.Sprite.Left - gap - bw;
                int faceY = sy + (sprite.Rows * 2 / 5) * cell;
                int by = faceY - bh / 2;
                l.Bubble = new Rectangle(bx, by, bw, bh);
                l.TailTop = Math.Min(Math.Max(faceY - 2 * cell, by + 2 * cell), by + bh - 6 * cell);
                Rectangle withTail = new Rectangle(fx > 0 ? bx - gap : bx, by, bw + gap, bh);
                l.Bounds = Rectangle.Union(l.Bounds, withTail);
            }
            return l;
        }

        // Prefer right-below; flip left and/or up when the buddy would leave the work area.
        public static BuddyLayout Choose(PixelArt sprite, int arrowCells, int cell, Size textSize, Point target, Rectangle workArea)
        {
            int[][] options = new int[][] { new int[] { 1, 1 }, new int[] { -1, 1 }, new int[] { 1, -1 }, new int[] { -1, -1 } };
            BuddyLayout best = null;
            long bestVisible = -1;
            foreach (int[] option in options)
            {
                BuddyLayout l = Build(sprite, arrowCells, cell, textSize, option[0], option[1]);
                Rectangle onScreen = l.Bounds;
                onScreen.Offset(target.X, target.Y);
                if (workArea.Contains(onScreen)) return l;
                Rectangle visible = Rectangle.Intersect(onScreen, workArea);
                long area = (long)visible.Width * visible.Height;
                if (area > bestVisible)
                {
                    bestVisible = area;
                    best = l;
                }
            }
            return best;
        }
    }

    internal sealed class BuddyForm : Form
    {
        private const int WsExLayered = 0x80000;
        private const int WsExTransparent = 0x20;
        private const int WsExToolWindow = 0x80;
        private const int WsExNoActivate = 0x8000000;
        private const int WsExTopmost = 0x8;
        private const int WmMouseActivate = 0x21;
        private const int WmNcHitTest = 0x84;
        private const int WmDpiChanged = 0x2E0;
        private const int MaNoActivate = 3;
        private const int HtTransparent = -1;

        private const int ArrowCells = 13;
        private const int BaseCell = 4;
        private const int BubbleMaxTextWidth = 260;
        private const float BubbleFontPx = 16f;
        private const double FlightBaseMs = 360;
        private const double BobPeriodMs = 1600;
        private const double BobAmplitude = 2;
        private const double AutoHideMs = 120000;
        private const int FlyingTickMs = 15;
        private const int IdleTickMs = 40;
        private const TextFormatFlags TextFlags = TextFormatFlags.WordBreak | TextFormatFlags.NoPrefix | TextFormatFlags.NoPadding | TextFormatFlags.Left | TextFormatFlags.Top;

        private static readonly Color Ink = ColorTranslator.FromHtml("#2A2019");
        private static readonly Color Paper = Color.White;
        private static readonly string[] ArrowRows = new string[]
        {
            "kkkkkkkk.....",
            "koooook......",
            "kooook.......",
            "kooook.......",
            "kooOook......",
            "kokkOook.....",
            "kk..kOook....",
            "k....kOook...",
            "......kOook..",
            ".......kOook.",
            "........kOook",
            ".........kOkk",
            "..........kk."
        };

        private readonly PixelArt sprite;
        private readonly PixelArt arrow;
        private readonly JavaScriptSerializer json = new JavaScriptSerializer();
        private readonly Stopwatch clock = Stopwatch.StartNew();
        private readonly System.Windows.Forms.Timer timer = new System.Windows.Forms.Timer();
        private readonly Dictionary<int, SolidBrush> brushes = new Dictionary<int, SolidBrush>();

        private BuddyLayout layout;
        private Font font;
        private float fontScale;
        private string bubbleText = "";
        private bool hasPosition;
        private bool flying;
        private bool landed;
        private double curX, curY, fromX, fromY, toX, toY;
        private double flightStart, flightDuration, landedAt, lastCommandAt;
        private int winX = int.MinValue;
        private int winY = int.MinValue;

        public BuddyForm(PixelArt sprite)
        {
            this.sprite = sprite;
            Dictionary<char, Color> arrowPalette = new Dictionary<char, Color>();
            arrowPalette['k'] = Ink;
            arrowPalette['o'] = ColorTranslator.FromHtml("#D97757");
            arrowPalette['O'] = ColorTranslator.FromHtml("#B85C3E");
            arrow = new PixelArt(ArrowRows, arrowPalette, 0, 0);

            FormBorderStyle = FormBorderStyle.None;
            ShowInTaskbar = false;
            StartPosition = FormStartPosition.Manual;
            TopMost = true;
            AutoScaleMode = AutoScaleMode.None;
            BackColor = Color.Magenta;
            TransparencyKey = Color.Magenta;
            DoubleBuffered = true;
            Text = "Pixel-Laurin";
            Bounds = new Rectangle(-32000, -32000, 16, 16);
            timer.Interval = FlyingTickMs;
            timer.Tick += OnTick;
        }

        protected override CreateParams CreateParams
        {
            get
            {
                CreateParams cp = base.CreateParams;
                cp.ExStyle |= WsExLayered | WsExTransparent | WsExToolWindow | WsExNoActivate | WsExTopmost;
                return cp;
            }
        }

        protected override bool ShowWithoutActivation
        {
            get { return true; }
        }

        protected override void WndProc(ref Message m)
        {
            if (m.Msg == WmMouseActivate)
            {
                m.Result = new IntPtr(MaNoActivate);
                return;
            }
            if (m.Msg == WmNcHitTest)
            {
                m.Result = new IntPtr(HtTransparent);
                return;
            }
            if (m.Msg == WmDpiChanged)
            {
                m.Result = IntPtr.Zero; // we size everything ourselves, in physical pixels
                return;
            }
            base.WndProc(ref m);
        }

        public void HandleLine(string line)
        {
            string cmd = "?";
            try
            {
                Dictionary<string, object> msg = json.DeserializeObject(line) as Dictionary<string, object>;
                if (msg == null)
                {
                    Reply(false, cmd, "expected a JSON object");
                    return;
                }
                object raw;
                if (msg.TryGetValue("cmd", out raw) && raw != null) cmd = Convert.ToString(raw, CultureInfo.InvariantCulture);
                lastCommandAt = clock.Elapsed.TotalMilliseconds;
                if (cmd == "point")
                {
                    int x = ReadInt(msg, "x");
                    int y = ReadInt(msg, "y");
                    object text;
                    string bubble = msg.TryGetValue("text", out text) && text != null ? Convert.ToString(text, CultureInfo.InvariantCulture) : "";
                    PointAt(x, y, bubble);
                    Reply(true, cmd, null);
                }
                else if (cmd == "hide")
                {
                    HideBuddy();
                    Reply(true, cmd, null);
                }
                else if (cmd == "quit")
                {
                    Reply(true, cmd, null);
                    Quit();
                }
                else
                {
                    Reply(false, cmd, "unknown cmd");
                }
            }
            catch (Exception e)
            {
                Reply(false, cmd, e.Message);
            }
        }

        public void Quit()
        {
            timer.Stop();
            Hide();
            Application.ExitThread();
        }

        private static int ReadInt(Dictionary<string, object> msg, string key)
        {
            object value;
            if (!msg.TryGetValue(key, out value) || value == null) throw new ArgumentException("missing " + key);
            return (int)Math.Round(Convert.ToDouble(value, CultureInfo.InvariantCulture));
        }

        private void Reply(bool ok, string cmd, string error)
        {
            Dictionary<string, object> reply = new Dictionary<string, object>();
            reply["ok"] = ok;
            reply["cmd"] = cmd;
            if (error != null) reply["error"] = error;
            Program.WriteLine(json.Serialize(reply));
        }

        private void PointAt(int x, int y, string text)
        {
            float scale = DpiScale(x, y);
            int cell = Math.Max(2, (int)Math.Round(BaseCell * scale));
            EnsureFont(scale);
            Size textSize = MeasureBubble(text, scale);
            Rectangle workArea = Screen.FromPoint(new Point(x, y)).WorkingArea;
            layout = BuddyLayout.Choose(sprite, ArrowCells, cell, textSize, new Point(x, y), workArea);
            bubbleText = text;

            if (!hasPosition)
            {
                // First appearance: swoop in from a little way off, on the buddy's side of the target.
                curX = x + layout.Fx * 150 * scale;
                curY = y + layout.Fy * 110 * scale;
                hasPosition = true;
            }
            fromX = curX;
            fromY = curY;
            toX = x;
            toY = y;
            double dx = toX - fromX;
            double dy = toY - fromY;
            double distance = Math.Sqrt(dx * dx + dy * dy);
            flightDuration = FlightBaseMs + Math.Min(distance, 1500) / 15.0;
            flightStart = clock.Elapsed.TotalMilliseconds;
            flying = true;
            landed = false;

            PlaceWindow(true);
            Invalidate();
            if (!Visible) Show();
            // A second ShowWindow wins even if the launcher's STARTUPINFO hid the first one.
            Native.ShowWindow(Handle, Native.SwShowNoActivate);
            PlaceWindow(true);
            timer.Interval = FlyingTickMs;
            timer.Start();
        }

        private void HideBuddy()
        {
            flying = false;
            landed = false;
            timer.Stop();
            if (Visible) Hide();
        }

        private void OnTick(object sender, EventArgs e)
        {
            double now = clock.Elapsed.TotalMilliseconds;
            if (Visible && now - lastCommandAt > AutoHideMs)
            {
                Program.Log("auto-hide after 2 minutes without commands");
                HideBuddy();
                return;
            }
            if (layout == null) return;
            if (flying)
            {
                double t = Math.Min(1.0, (now - flightStart) / flightDuration);
                double eased = 1 - Math.Pow(1 - t, 3);
                curX = fromX + (toX - fromX) * eased;
                curY = fromY + (toY - fromY) * eased;
                if (t >= 1)
                {
                    flying = false;
                    landed = true;
                    landedAt = now;
                    curX = toX;
                    curY = toY;
                    timer.Interval = IdleTickMs;
                    Invalidate(); // the speech bubble appears on landing
                }
            }
            PlaceWindow(false);
        }

        // Moves (and on resize: sizes + re-tops) the window so the arrow tip sits on the current point.
        // The idle bob shifts the whole window by up to 2 px; nothing is repainted for it.
        private void PlaceWindow(bool resize)
        {
            if (layout == null) return;
            double bob = 0;
            if (landed) bob = Math.Round(BobAmplitude * Math.Sin((clock.Elapsed.TotalMilliseconds - landedAt) * 2 * Math.PI / BobPeriodMs));
            int x = (int)Math.Round(curX) + layout.Bounds.Left;
            int y = (int)Math.Round(curY + bob) + layout.Bounds.Top;
            if (!resize && x == winX && y == winY) return;
            winX = x;
            winY = y;
            uint flags = Native.SwpNoActivate;
            if (!resize) flags |= Native.SwpNoSize | Native.SwpNoZOrder;
            Native.SetWindowPos(Handle, Native.HwndTopmost, x, y, layout.Bounds.Width, layout.Bounds.Height, flags);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            if (layout == null) return;
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.None;
            g.PixelOffsetMode = PixelOffsetMode.None;
            int tipX = -layout.Bounds.Left;
            int tipY = -layout.Bounds.Top;
            DrawArrow(g, tipX, tipY);
            DrawArt(g, sprite, tipX + layout.Sprite.Left, tipY + layout.Sprite.Top, layout.Fx < 0);
            if (landed && bubbleText.Length > 0 && layout.Bubble.Width > 0) DrawBubble(g, tipX, tipY);
        }

        // The arrow's tip pixel lands exactly on the target pixel in every flip direction.
        private void DrawArrow(Graphics g, int tipX, int tipY)
        {
            int c = layout.Cell;
            foreach (PixelRun run in arrow.Runs)
            {
                int left = layout.Fx > 0 ? tipX + run.X * c : tipX - (run.X + run.Length) * c + 1;
                int top = layout.Fy > 0 ? tipY + run.Y * c : tipY - (run.Y + 1) * c + 1;
                g.FillRectangle(BrushFor(run.Color), left, top, run.Length * c, c);
            }
        }

        private void DrawArt(Graphics g, PixelArt art, int left, int top, bool mirror)
        {
            int c = layout.Cell;
            foreach (PixelRun run in art.Runs)
            {
                int x = mirror ? art.Cols - run.X - run.Length : run.X;
                g.FillRectangle(BrushFor(run.Color), left + x * c, top + run.Y * c, run.Length * c, c);
            }
        }

        // Solid white bubble, ink border, stepped pixel corners and a pixel tail towards Pixel-Laurin.
        private void DrawBubble(Graphics g, int tipX, int tipY)
        {
            int u = layout.Cell;
            Rectangle b = layout.Bubble;
            b.Offset(tipX, tipY);
            Brush ink = BrushFor(Ink);
            Brush paper = BrushFor(Paper);
            g.FillRectangle(ink, b.X + u, b.Y, b.Width - 2 * u, b.Height);
            g.FillRectangle(ink, b.X, b.Y + u, b.Width, b.Height - 2 * u);
            g.FillRectangle(paper, b.X + 2 * u, b.Y + u, b.Width - 4 * u, b.Height - 2 * u);
            g.FillRectangle(paper, b.X + u, b.Y + 2 * u, b.Width - 2 * u, b.Height - 4 * u);

            int ty = tipY + layout.TailTop;
            int edge = layout.Fx > 0 ? b.X : b.Right - u; // the border column the tail grows out of
            int s = layout.Fx > 0 ? -u : u;               // one cell outwards
            FillCell(g, ink, edge + s, ty, u);
            FillCell(g, ink, edge + 2 * s, ty + u, u);
            FillCell(g, paper, edge + s, ty + u, u);
            FillCell(g, paper, edge, ty + u, u);
            FillCell(g, ink, edge + 3 * s, ty + 2 * u, u);
            FillCell(g, paper, edge + 2 * s, ty + 2 * u, u);
            FillCell(g, paper, edge + s, ty + 2 * u, u);
            FillCell(g, paper, edge, ty + 2 * u, u);
            FillCell(g, ink, edge + 2 * s, ty + 3 * u, u);
            FillCell(g, ink, edge + s, ty + 3 * u, u);

            Rectangle textRect = new Rectangle(b.X + u + layout.Pad, b.Y + u + layout.Pad, layout.TextSize.Width, layout.TextSize.Height);
            TextRenderer.DrawText(g, bubbleText, font, textRect, Ink, Paper, TextFlags);
        }

        private static void FillCell(Graphics g, Brush brush, int x, int y, int size)
        {
            g.FillRectangle(brush, x, y, size, size);
        }

        private SolidBrush BrushFor(Color color)
        {
            int key = color.ToArgb();
            SolidBrush brush;
            if (!brushes.TryGetValue(key, out brush))
            {
                brush = new SolidBrush(color);
                brushes[key] = brush;
            }
            return brush;
        }

        private Size MeasureBubble(string text, float scale)
        {
            if (string.IsNullOrEmpty(text)) return Size.Empty;
            int maxWidth = (int)Math.Round(BubbleMaxTextWidth * scale);
            return TextRenderer.MeasureText(text, font, new Size(maxWidth, int.MaxValue), TextFlags);
        }

        private void EnsureFont(float scale)
        {
            if (font != null && Math.Abs(fontScale - scale) < 0.01f) return;
            if (font != null) font.Dispose();
            font = MakeFont(BubbleFontPx * scale);
            fontScale = scale;
        }

        private static Font MakeFont(float px)
        {
            Font semibold = new Font("Segoe UI Semibold", px, FontStyle.Regular, GraphicsUnit.Pixel);
            if (semibold.Name == "Segoe UI Semibold") return semibold;
            semibold.Dispose();
            return new Font("Segoe UI", px, FontStyle.Bold, GraphicsUnit.Pixel);
        }

        private static float DpiScale(int x, int y)
        {
            try
            {
                IntPtr monitor = Native.MonitorFromPoint(new NativePoint(x, y), Native.MonitorDefaultToNearest);
                uint dpiX;
                uint dpiY;
                if (Native.GetDpiForMonitor(monitor, 0, out dpiX, out dpiY) == 0 && dpiX > 0) return dpiX / 96f;
            }
            catch (Exception)
            {
                // shcore.dll missing (very old Windows): stay at 100 %
            }
            return 1f;
        }
    }

    public static class Program
    {
        private static readonly object Gate = new object();
        private static StreamWriter stdout;

        public static void WriteLine(string line)
        {
            lock (Gate)
            {
                stdout.WriteLine(line);
                stdout.Flush();
            }
        }

        public static void Log(string message)
        {
            try
            {
                Console.Error.WriteLine("[overlay] " + message);
            }
            catch (Exception)
            {
                // stderr gone: nothing left to tell
            }
        }

        public static void Run(string spritePath)
        {
            EnableDpiAwareness();
            stdout = new StreamWriter(Console.OpenStandardOutput(), new UTF8Encoding(false));
            stdout.AutoFlush = true;
            stdout.NewLine = "\n";
            PixelArt sprite = LoadSprite(spritePath);
            Thread ui = new Thread(delegate() { RunUi(sprite); });
            ui.SetApartmentState(ApartmentState.STA);
            ui.Start();
            ui.Join();
            Environment.Exit(0);
        }

        // Physical pixels everywhere; must happen before any window or Screen call.
        private static void EnableDpiAwareness()
        {
            try
            {
                if (Native.SetProcessDpiAwarenessContext(new IntPtr(-4))) return; // PER_MONITOR_AWARE_V2
            }
            catch (Exception)
            {
                // older than Windows 10 1703
            }
            try
            {
                Native.SetProcessDPIAware();
            }
            catch (Exception)
            {
                // keep going unscaled
            }
        }

        private static void RunUi(PixelArt sprite)
        {
            try
            {
                Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
            }
            catch (Exception)
            {
                // a control already exists in this process; the default mode is fine too
            }
            Application.ThreadException += delegate(object sender, ThreadExceptionEventArgs e) { Log("ui error: " + e.Exception); };
            BuddyForm form = new BuddyForm(sprite);
            if (form.Handle == IntPtr.Zero) throw new InvalidOperationException("overlay window was not created");
            Thread reader = new Thread(delegate() { ReadCommands(form); });
            reader.IsBackground = true;
            reader.Start();
            WriteLine("{\"ok\":true,\"cmd\":\"ready\"}");
            Application.Run();
        }

        private static void ReadCommands(BuddyForm form)
        {
            try
            {
                StreamReader input = new StreamReader(Console.OpenStandardInput(), new UTF8Encoding(false));
                string line;
                while ((line = input.ReadLine()) != null)
                {
                    if (line.Trim().Length == 0) continue;
                    string captured = line;
                    form.BeginInvoke(new Action(delegate() { form.HandleLine(captured); }));
                }
            }
            catch (Exception e)
            {
                Log("stdin reader stopped: " + e.Message);
            }
            // stdin closed: the MCP server is gone, so Pixel-Laurin goes too.
            try
            {
                form.BeginInvoke(new Action(delegate() { form.Quit(); }));
            }
            catch (Exception)
            {
                Environment.Exit(0);
            }
        }

        private static PixelArt LoadSprite(string path)
        {
            string text = File.ReadAllText(path, Encoding.UTF8);
            Dictionary<string, object> doc = new JavaScriptSerializer().DeserializeObject(text) as Dictionary<string, object>;
            if (doc == null) throw new InvalidDataException("sprite.json is not a JSON object");
            Dictionary<string, object> rawPalette = doc["palette"] as Dictionary<string, object>;
            if (rawPalette == null) throw new InvalidDataException("sprite.json has no palette");
            Dictionary<char, Color> palette = new Dictionary<char, Color>();
            foreach (KeyValuePair<string, object> entry in rawPalette)
            {
                if (entry.Key.Length == 1) palette[entry.Key[0]] = ColorTranslator.FromHtml(Convert.ToString(entry.Value, CultureInfo.InvariantCulture));
            }
            List<string> rows = new List<string>();
            foreach (object row in (IEnumerable)doc["rows"]) rows.Add(Convert.ToString(row, CultureInfo.InvariantCulture));
            if (rows.Count == 0) throw new InvalidDataException("sprite.json has no rows");
            int anchorX = 0;
            int anchorY = rows.Count / 3;
            object rawAnchor;
            if (doc.TryGetValue("anchor", out rawAnchor))
            {
                Dictionary<string, object> anchor = rawAnchor as Dictionary<string, object>;
                if (anchor != null)
                {
                    anchorX = Convert.ToInt32(anchor["x"], CultureInfo.InvariantCulture);
                    anchorY = Convert.ToInt32(anchor["y"], CultureInfo.InvariantCulture);
                }
            }
            return new PixelArt(rows.ToArray(), palette, anchorX, anchorY);
        }
    }
}
'@

Add-Type -TypeDefinition $source -ReferencedAssemblies $references -Language CSharp -IgnoreWarnings
[LaurinBuddy.Program]::Run((Resolve-Path -LiteralPath $Sprite).ProviderPath)
