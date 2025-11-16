namespace SIGAC.Core.DTOs;

public class HistoriqueDto
{
    public Guid Id { get; set; }
    public Guid DossierId { get; set; }
    public DateTime DateAction { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Details { get; set; }
    public Guid UserId { get; set; }
    public string? UserName { get; set; }
}
