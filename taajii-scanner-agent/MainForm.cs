using System;
using System.Drawing;
using System.Windows.Forms;
using System.Net;
using System.Threading;

namespace TaajiiScannerAgent
{
    public class MainForm : Form
    {
        private NotifyIcon trayIcon;
        private ContextMenuStrip trayMenu;
        private HttpListener httpListener;
        private Thread listenerThread;
        private bool isRunning = true;
        private const int PORT = 5588;
        private Label statusLabel;
        private ListBox logList;

        public MainForm()
        {
            InitializeComponent();
            InitializeTrayIcon();
            StartHttpServer();
        }

        private void InitializeComponent()
        {
            this.Text = "Taajii Scanner Agent";
            this.Size = new Size(500, 400);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.Icon = SystemIcons.Application;

            // Panel Header
            var headerPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 80,
                BackColor = Color.FromArgb(99, 102, 241) // Violet Taajii
            };

            var titleLabel = new Label
            {
                Text = "🖨️ Taajii Scanner Agent",
                Font = new Font("Segoe UI", 18, FontStyle.Bold),
                ForeColor = Color.White,
                AutoSize = true,
                Location = new Point(20, 15)
            };

            var subtitleLabel = new Label
            {
                Text = "Connectez votre scanner à Taajii",
                Font = new Font("Segoe UI", 10),
                ForeColor = Color.FromArgb(200, 200, 255),
                AutoSize = true,
                Location = new Point(20, 50)
            };

            headerPanel.Controls.Add(titleLabel);
            headerPanel.Controls.Add(subtitleLabel);

            // Status Panel
            var statusPanel = new Panel
            {
                Location = new Point(20, 100),
                Size = new Size(445, 60),
                BackColor = Color.FromArgb(236, 253, 245),
                BorderStyle = BorderStyle.FixedSingle
            };

            statusLabel = new Label
            {
                Text = $"✅ Serveur actif sur le port {PORT}",
                Font = new Font("Segoe UI", 11),
                ForeColor = Color.FromArgb(6, 95, 70),
                AutoSize = true,
                Location = new Point(15, 20)
            };
            statusPanel.Controls.Add(statusLabel);

            // Instructions
            var instructionsLabel = new Label
            {
                Text = "📋 Instructions:\n" +
                       "1. Gardez cette application ouverte (ou minimisez-la)\n" +
                       "2. Allez sur taajii.fr → Documents → Scanner\n" +
                       "3. Cliquez sur 'Scanner Local' pour numériser",
                Font = new Font("Segoe UI", 10),
                ForeColor = Color.FromArgb(55, 65, 81),
                Location = new Point(20, 175),
                Size = new Size(445, 80)
            };

            // Log List
            var logLabel = new Label
            {
                Text = "📜 Activité:",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                Location = new Point(20, 260),
                AutoSize = true
            };

            logList = new ListBox
            {
                Location = new Point(20, 285),
                Size = new Size(445, 70),
                Font = new Font("Consolas", 9),
                BorderStyle = BorderStyle.FixedSingle
            };

            this.Controls.Add(headerPanel);
            this.Controls.Add(statusPanel);
            this.Controls.Add(instructionsLabel);
            this.Controls.Add(logLabel);
            this.Controls.Add(logList);

            // Events
            this.Resize += MainForm_Resize;
            this.FormClosing += MainForm_FormClosing;

            AddLog("Agent démarré");
        }

        private void InitializeTrayIcon()
        {
            trayMenu = new ContextMenuStrip();
            trayMenu.Items.Add("Ouvrir", null, (s, e) => ShowMainWindow());
            trayMenu.Items.Add("-");
            trayMenu.Items.Add("Quitter", null, (s, e) => ExitApplication());

            trayIcon = new NotifyIcon
            {
                Text = "Taajii Scanner Agent",
                Icon = SystemIcons.Application,
                ContextMenuStrip = trayMenu,
                Visible = true
            };

            trayIcon.DoubleClick += (s, e) => ShowMainWindow();
        }

        private void StartHttpServer()
        {
            try
            {
                httpListener = new HttpListener();
                httpListener.Prefixes.Add($"http://localhost:{PORT}/");
                httpListener.Start();

                listenerThread = new Thread(ListenForRequests)
                {
                    IsBackground = true
                };
                listenerThread.Start();

                AddLog($"Serveur HTTP démarré sur le port {PORT}");
            }
            catch (Exception ex)
            {
                statusLabel.Text = $"❌ Erreur: {ex.Message}";
                statusLabel.ForeColor = Color.Red;
                AddLog($"ERREUR: {ex.Message}");
            }
        }

        private void ListenForRequests()
        {
            while (isRunning && httpListener.IsListening)
            {
                try
                {
                    var context = httpListener.GetContext();
                    ThreadPool.QueueUserWorkItem(o => HandleRequest(context));
                }
                catch (Exception ex)
                {
                    if (isRunning)
                        AddLog($"Erreur listener: {ex.Message}");
                }
            }
        }

        private void HandleRequest(HttpListenerContext context)
        {
            var request = context.Request;
            var response = context.Response;

            // CORS Headers pour permettre les requêtes depuis taajii.fr
            response.Headers.Add("Access-Control-Allow-Origin", "*");
            response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");

            string responseString = "";
            response.ContentType = "application/json";

            try
            {
                // Handle preflight
                if (request.HttpMethod == "OPTIONS")
                {
                    response.StatusCode = 200;
                    response.Close();
                    return;
                }

                var path = request.Url?.AbsolutePath ?? "";
                AddLog($"{request.HttpMethod} {path}");

                switch (path)
                {
                    case "/status":
                        responseString = HandleStatus();
                        break;

                    case "/scanners":
                        responseString = HandleListScanners();
                        break;

                    case "/scan":
                        responseString = HandleScan(request);
                        break;

                    default:
                        response.StatusCode = 404;
                        responseString = "{\"error\": \"Endpoint non trouvé\"}";
                        break;
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = 500;
                responseString = $"{{\"error\": \"{ex.Message.Replace("\"", "\\\"").Replace("\n", " ")}\"}}";
                AddLog($"ERREUR: {ex.Message}");
            }

            byte[] buffer = System.Text.Encoding.UTF8.GetBytes(responseString);
            response.ContentLength64 = buffer.Length;
            response.OutputStream.Write(buffer, 0, buffer.Length);
            response.Close();
        }

        private string HandleStatus()
        {
            return "{\"status\": \"online\", \"version\": \"1.0.0\", \"port\": " + PORT + "}";
        }

        private string HandleListScanners()
        {
            try
            {
                var scanners = ScannerService.GetAvailableScanners();
                var scannersJson = string.Join(",", scanners.Select(s => 
                    $"{{\"id\": \"{s.Id}\", \"name\": \"{s.Name.Replace("\"", "\\\"")}\"}}"));
                
                AddLog($"Scanners trouvés: {scanners.Count}");
                return $"{{\"scanners\": [{scannersJson}], \"count\": {scanners.Count}}}";
            }
            catch (Exception ex)
            {
                AddLog($"Erreur liste scanners: {ex.Message}");
                return $"{{\"scanners\": [], \"count\": 0, \"error\": \"{ex.Message.Replace("\"", "\\\"")}\"}}";
            }
        }

        private string HandleScan(HttpListenerRequest request)
        {
            try
            {
                AddLog("Scan en cours...");
                
                // Récupérer le scanner ID depuis les paramètres (optionnel)
                string? scannerId = request.QueryString["scannerId"];
                
                var imageBase64 = ScannerService.ScanDocument(scannerId);
                
                if (string.IsNullOrEmpty(imageBase64))
                {
                    AddLog("Aucune image scannée");
                    return "{\"success\": false, \"error\": \"Aucune image scannée\"}";
                }

                AddLog("Scan réussi!");
                return $"{{\"success\": true, \"image\": \"{imageBase64}\", \"mimeType\": \"image/png\"}}";
            }
            catch (Exception ex)
            {
                AddLog($"Erreur scan: {ex.Message}");
                return $"{{\"success\": false, \"error\": \"{ex.Message.Replace("\"", "\\\"")}\"}}";
            }
        }

        private void AddLog(string message)
        {
            if (InvokeRequired)
            {
                Invoke(new Action(() => AddLog(message)));
                return;
            }

            var timestamp = DateTime.Now.ToString("HH:mm:ss");
            logList.Items.Insert(0, $"[{timestamp}] {message}");
            
            // Garder seulement les 50 derniers logs
            while (logList.Items.Count > 50)
                logList.Items.RemoveAt(logList.Items.Count - 1);
        }

        private void MainForm_Resize(object? sender, EventArgs e)
        {
            if (WindowState == FormWindowState.Minimized)
            {
                this.Hide();
                trayIcon.ShowBalloonTip(1000, "Taajii Scanner", 
                    "L'agent continue de fonctionner en arrière-plan", ToolTipIcon.Info);
            }
        }

        private void MainForm_FormClosing(object? sender, FormClosingEventArgs e)
        {
            if (e.CloseReason == CloseReason.UserClosing)
            {
                e.Cancel = true;
                this.Hide();
                trayIcon.ShowBalloonTip(1000, "Taajii Scanner", 
                    "L'agent continue de fonctionner en arrière-plan", ToolTipIcon.Info);
            }
        }

        private void ShowMainWindow()
        {
            this.Show();
            this.WindowState = FormWindowState.Normal;
            this.Activate();
        }

        private void ExitApplication()
        {
            isRunning = false;
            httpListener?.Stop();
            trayIcon.Visible = false;
            Application.Exit();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                isRunning = false;
                httpListener?.Stop();
                trayIcon?.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
