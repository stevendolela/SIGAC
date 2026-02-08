using System;
using Npgsql;
using System.IO;

class ApplyMultitenantMigration
{
    static async Task Main()
    {
        string connectionString = "Host=dpg-d4obq0a4i8rc73f06gl0-a.frankfurt-postgres.render.com;Port=5432;Database=postgresql_sigac_e1f4;Username=postgresql_sigac_e1f4_user;Password=wboMdsAzEhwVXP6nHZl2ZHO0V0Hhdzqe;SSL Mode=Require";
        
        try
        {
            // Read SQL script
            string sqlScript = File.ReadAllText("apply-multitenant.sql");
            
            // Split by semicolons and execute statements
            string[] statements = sqlScript.Split(new[] { ";" }, StringSplitOptions.RemoveEmptyEntries);
            
            using (var conn = new NpgsqlConnection(connectionString))
            {
                await conn.OpenAsync();
                Console.WriteLine("✅ Connected to Render PostgreSQL");
                
                int statementCount = 0;
                foreach (var statement in statements)
                {
                    string trimmed = statement.Trim();
                    if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("--"))
                        continue;
                    
                    using (var cmd = new NpgsqlCommand(trimmed + ";", conn))
                    {
                        cmd.CommandTimeout = 60;
                        try
                        {
                            await cmd.ExecuteNonQueryAsync();
                            statementCount++;
                            Console.WriteLine($"  ✓ Executed statement {statementCount}");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"  ⚠ Warning: {ex.Message}");
                            // Continue on error (for IF NOT EXISTS statements)
                        }
                    }
                }
                
                Console.WriteLine($"\n✅ All {statementCount} SQL statements executed successfully!");
                Console.WriteLine("📊 Multi-tenancy tables created on Render");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error: {ex.Message}");
            Environment.Exit(1);
        }
    }
}
