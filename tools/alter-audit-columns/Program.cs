using Microsoft.Extensions.Configuration;
using Npgsql;
using System;

var config = new ConfigurationBuilder()
    .AddJsonFile("/Users/steve/Projects/SIGAC/sigac-backend/SIGAC.API/appsettings.json", optional: false)
    .Build();

var connString = config.GetConnectionString("DefaultConnection");
Console.WriteLine($"Using connection: {connString}");

await using var conn = new NpgsqlConnection(connString);
await conn.OpenAsync();
// Rechercher et supprimer les index GIN sur la table AuditLogs (si présents)
await using (var idxCmd = new NpgsqlCommand(@"SELECT indexname, indexdef FROM pg_indexes WHERE lower(tablename) = 'auditlogs';", conn))
{
    await using var reader = await idxCmd.ExecuteReaderAsync();
    var indexes = new List<string>();
    while (await reader.ReadAsync())
    {
        var indexName = reader.GetString(0);
        var indexDef = reader.GetString(1).ToLowerInvariant();
        Console.WriteLine($"Found index: {indexName} -> {indexDef}");
        if (indexDef.Contains(" using gin ") || indexDef.Contains(" using gin("))
        {
            indexes.Add(indexName);
        }
    }
    await reader.CloseAsync();

    foreach (var idx in indexes)
    {
        Console.WriteLine($"Dropping index {idx}...");
        await using var dropCmd = new NpgsqlCommand($"DROP INDEX IF EXISTS \"{idx}\";", conn);
        await dropCmd.ExecuteNonQueryAsync();
        Console.WriteLine($"Dropped {idx}");
    }
}

// Maintenant altérer les colonnes vers text
var sql = @"ALTER TABLE ""AuditLogs"" ALTER COLUMN ""NewValues"" TYPE text USING ""NewValues""::text; 
ALTER TABLE ""AuditLogs"" ALTER COLUMN ""OldValues"" TYPE text USING ""OldValues""::text;";

await using var cmd = new NpgsqlCommand(sql, conn);
try
{
    var res = await cmd.ExecuteNonQueryAsync();
    Console.WriteLine("Columns altered successfully.");
}
catch (Exception ex)
{
    Console.WriteLine("Failed to alter columns: " + ex.Message);
}

await conn.CloseAsync();
return 0;