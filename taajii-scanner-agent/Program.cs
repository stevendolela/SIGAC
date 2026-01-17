using System;
using System.Windows.Forms;

namespace TaajiiScannerAgent
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            // Vérifier qu'une seule instance tourne
            bool createdNew;
            using var mutex = new System.Threading.Mutex(true, "TaajiiScannerAgentMutex", out createdNew);
            
            if (!createdNew)
            {
                MessageBox.Show("Taajii Scanner Agent est déjà en cours d'exécution.", 
                    "Taajii Scanner", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
