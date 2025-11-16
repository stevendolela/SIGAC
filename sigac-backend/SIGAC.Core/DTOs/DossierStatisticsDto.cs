namespace SIGAC.Core.DTOs;

public class DossierStatisticsDto
{
    public int TotalDossiers { get; set; }
    public int NouveauxDossiers { get; set; }
    public int EnInstruction { get; set; }
    public int EnDelibere { get; set; }
    public int Juges { get; set; }
    public int Classes { get; set; }
    public Dictionary<string, int> ParType { get; set; } = new();
    public Dictionary<string, int> ParPriorite { get; set; } = new();
}

public class DossierStatistics
{
    public int TotalDossiers { get; set; }
    public int NouveauxDossiers { get; set; }
    public int EnInstruction { get; set; }
    public int EnDelibere { get; set; }
    public int Juges { get; set; }
    public int Classes { get; set; }
    public Dictionary<string, int> ParType { get; set; } = new();
    public Dictionary<string, int> ParPriorite { get; set; } = new();
}
