namespace ClinicAPI.Models;

public class MedicalRecord
{
    public Guid Id { get; set; }
    public Guid PatientId { get; set; }
    public Guid DoctorId { get; set; }
    public string Diagnosis { get; set; } = string.Empty; // Chẩn đoán
    public string Symptoms { get; set; } = string.Empty;  // Triệu chứng
    public string? TreatmentPlan { get; set; }          // Hướng điều trị
    public string? Notes { get; set; }
    public DateTime VisitDate { get; set; } = DateTime.UtcNow;
}