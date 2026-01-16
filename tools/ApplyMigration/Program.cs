using Npgsql;

// Utiliser l'URL externe de Render
var connectionString = "Host=dpg-cuaborlds78s73a6j92g-a.oregon-postgres.render.com;Port=5432;Database=sigac_db;Username=sigac_db_user;Password=npCyndl1c30LgReBmdcsiF1bGtvPaRoy;SslMode=Prefer";

try
{
    await using var conn = new NpgsqlConnection(connectionString);
    await conn.OpenAsync();
    Console.WriteLine("Connected to database!");

    // Add FileData column
    var sql = @"ALTER TABLE ""Documents"" ADD COLUMN IF NOT EXISTS ""FileData"" TEXT NULL;";
    
    await using var cmd = new NpgsqlCommand(sql, conn);
    await cmd.ExecuteNonQueryAsync();
    Console.WriteLine("FileData column added successfully!");

    // Register migration
    var migrationSql = @"
        INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
        SELECT '20260116215039_AddFileDataToDocument', '8.0.2'
        WHERE NOT EXISTS (
            SELECT 1 FROM ""__EFMigrationsHistory"" 
            WHERE ""MigrationId"" = '20260116215039_AddFileDataToDocument'
        );";
    
    await using var cmd2 = new NpgsqlCommand(migrationSql, conn);
    await cmd2.ExecuteNonQueryAsync();
    Console.WriteLine("Migration recorded in history!");

    // Verify
    var verifySql = @"SELECT column_name FROM information_schema.columns WHERE table_name = 'Documents' AND column_name = 'FileData';";
    await using var cmd3 = new NpgsqlCommand(verifySql, conn);
    var result = await cmd3.ExecuteScalarAsync();
    Console.WriteLine($"Verification: FileData column exists = {result != null}");
}
catch (Exception ex)
{
    Console.WriteLine($"Error: {ex.Message}");
}
