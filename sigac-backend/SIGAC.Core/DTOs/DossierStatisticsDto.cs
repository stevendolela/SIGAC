namespace SIGAC.Core.DTOs;

public class DossierStatisticsDto
{
    public int TotalDossiers { get; set; }
    public int NouveauxDossiers { get; set; }
    public int EnCours { get; set; }
    public int EnValidation { get; set; }
    public int Valides { get; set; }
    public int Termines { get; set; }
    public Dictionary<string, int> ParType { get; set; } = new();
    public Dictionary<string, int> ParPriorite { get; set; } = new();
}

public class DossierStatistics
{
    public int TotalDossiers { get; set; }
    public int NouveauxDossiers { get; set; }
    public int EnCours { get; set; }
    public int EnValidation { get; set; }
    public int Valides { get; set; }
    public int Termines { get; set; }
    public Dictionary<string, int> ParType { get; set; } = new();
    public Dictionary<string, int> ParPriorite { get; set; } = new();
}
