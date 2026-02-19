using System;
using System.Threading.Tasks;
using AutoMapper;
using Moq;
using NUnit.Framework;
using SIGAC.Core.DTOs;
using SIGAC.Core.Entities;
using SIGAC.Core.Enums;
using SIGAC.Core.Interfaces;
using SIGAC.Core.Services;

namespace SIGAC.Tests.Unit.Services;

[TestFixture]
public class DossierServiceTests
{
    private Mock<IDossierRepository> _dossierRepo = null!;
    private Mock<IUserRepository> _userRepo = null!;
    private Mock<IAuditLogRepository> _auditRepo = null!;
    private Mock<INotificationService> _notifService = null!;
    private Mock<IEmailService> _emailService = null!;
    private Mock<IEmailNotificationService> _emailNotificationService = null!;
    private Mock<IMapper> _mapper = null!;

    private DossierService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _dossierRepo = new Mock<IDossierRepository>(MockBehavior.Strict);
        _userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        _auditRepo = new Mock<IAuditLogRepository>(MockBehavior.Loose); // not used in these tests
        _notifService = new Mock<INotificationService>(MockBehavior.Strict);
        _emailService = new Mock<IEmailService>(MockBehavior.Strict);
        _emailNotificationService = new Mock<IEmailNotificationService>(MockBehavior.Loose);
        _mapper = new Mock<IMapper>(MockBehavior.Loose);

        _service = new DossierService(
            _dossierRepo.Object,
            _userRepo.Object,
            _auditRepo.Object,
            _notifService.Object,
            _emailService.Object,
            _emailNotificationService.Object,
            _mapper.Object
        );
    }

    [Test]
    public async Task AttribuerRapporteurAsync_HappyPath_CreatesNotificationAndSendsEmail()
    {
        // Arrange
        var dossierId = Guid.NewGuid();
        var rapporteurId = Guid.NewGuid();
        var actorId = Guid.NewGuid();
        var typeAffaireId = Guid.NewGuid();

        var dossier = new Dossier
        {
            Id = dossierId,
            NumeroDossier = "CC-2025-001",
            Titre = "Test dossier pour attribution",
            TypeAffaireId = typeAffaireId,
            Priorite = PrioriteDossier.Normale
        };

        var rapporteur = new User
        {
            Id = rapporteurId,
            NomComplet = "Juge Mbala",
            Email = "juge.mbala@example.com",
            Role = UserRole.Collaborateur
        };

        _dossierRepo.Setup(r => r.GetByIdAsync(dossierId)).ReturnsAsync(dossier);
        _userRepo.Setup(r => r.GetByIdAsync(rapporteurId)).ReturnsAsync(rapporteur);
        _dossierRepo.Setup(r => r.AddHistoriqueAsync(It.IsAny<Historique>())).Returns(Task.CompletedTask);
        _dossierRepo.Setup(r => r.SaveChangesAsync()).ReturnsAsync(1);

        _notifService
            .Setup(s => s.CreateAsync(It.Is<CreateNotificationDto>(n =>
                n.UserId == rapporteurId &&
                n.Titre.Contains("Nouveau dossier assigné") &&
                n.Lien == $"/dossiers/{dossierId}"), actorId))
            .ReturnsAsync(new NotificationDto { Id = Guid.NewGuid(), UserId = rapporteurId, Titre = "ok" });

        _emailService
            .Setup(s => s.SendAsync(
                rapporteur.Email!,
                It.Is<string>(sub => sub.Contains("attribué")),
                It.Is<string>(body => body.Contains(dossier.NumeroDossier) && body.Contains($"/dossiers/{dossierId}")),
                It.IsAny<string?>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _service.AttribuerRapporteurAsync(dossierId, rapporteurId, actorId);

        // Assert
        Assert.That(result, Is.True);
        _notifService.VerifyAll();
        _emailService.VerifyAll();
        _dossierRepo.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Test]
    public void AttribuerRapporteurAsync_InvalidRapporteurRole_Throws()
    {
        // Arrange
        var dossierId = Guid.NewGuid();
        var rapporteurId = Guid.NewGuid();
        var actorId = Guid.NewGuid();

        var dossier = new Dossier { Id = dossierId, NumeroDossier = "CC-2025-002", Titre = "X", TypeAffaireId = Guid.NewGuid(), Priorite = PrioriteDossier.Normale };
        // Assistant n'est pas autorisé comme responsable
        var nonJudgeUser = new User { Id = rapporteurId, NomComplet = "Assistant", Role = UserRole.Assistant };

        _dossierRepo.Setup(r => r.GetByIdAsync(dossierId)).ReturnsAsync(dossier);
        _userRepo.Setup(r => r.GetByIdAsync(rapporteurId)).ReturnsAsync(nonJudgeUser);

        // Act + Assert
        Assert.ThrowsAsync<ArgumentException>(() => _service.AttribuerRapporteurAsync(dossierId, rapporteurId, actorId));
    }

    [Test]
    public async Task AttribuerRapporteurAsync_DossierNotFound_ReturnsFalse()
    {
        // Arrange
        var dossierId = Guid.NewGuid();
        var rapporteurId = Guid.NewGuid();
        var actorId = Guid.NewGuid();

        _dossierRepo.Setup(r => r.GetByIdAsync(dossierId)).ReturnsAsync((Dossier?)null);

        // Act
        var result = await _service.AttribuerRapporteurAsync(dossierId, rapporteurId, actorId);

        // Assert
        Assert.That(result, Is.False);
    }
}
