namespace ClinicAPI.Models
{
    public class MedicalRecord
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid PatientId { get; set; }
        public Guid DoctorId { get; set; }  // THÊM MỚI - Frontend đang gửi field này
 
        public string? Symptoms { get; set; }
        public string? Diagnosis { get; set; }
        public string? TreatmentPlan { get; set; }
        public string? Notes { get; set; } = string.Empty;
        public DateTime VisitDate { get; set; } = DateTime.Now;
    }
}
 