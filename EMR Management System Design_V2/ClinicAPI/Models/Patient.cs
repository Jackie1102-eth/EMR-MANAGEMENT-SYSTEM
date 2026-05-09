namespace ClinicAPI.Models;

public class Patient
{
    public Guid Id { get; set; }
    public string PatientCode { get; set; } = string.Empty; // Mã BN (Ví dụ: BN001)
    public string FullName { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? IDCard { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "active";
    public Guid? UserId { get; set; }
    public User? User { get; set; }
        public string? BloodType { get; set; }

        public string? Allergies { get; set; }

        public string? ChronicConditions { get; set; }

        public string? CurrentMedications { get; set; }

        public DateTime? LastVisit { get; set; }
    public string? Email { get; set; } 

}