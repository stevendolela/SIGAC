namespace SIGAC.Core.Entities;

/// <summary>
/// Configuration système globale (singleton)
/// </summary>
public class SystemSetting
{
    public Guid Id { get; set; }
    
    /// <summary>
    /// Logo système encodé en base64 avec data URI (ex: "data:image/png;base64,...")
    /// </summary>
    public string? LogoBase64 { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
}
