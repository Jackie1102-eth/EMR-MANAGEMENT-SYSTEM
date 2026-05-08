using System.ComponentModel.DataAnnotations;

namespace ClinicAPI.Models
{
    public class Appointment
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        // Foreign keys
        public Guid PatientId { get; set; }
        public Guid DoctorId { get; set; }

        // Thông tin lịch hẹn
        public string DepartmentId { get; set; } = string.Empty;  // "cardiology", "neurology"...
        public DateTime AppointmentDate { get; set; }
        public string TimeSlot { get; set; } = string.Empty;       // "08:00", "09:30"...
        public string Status { get; set; } = "pending";            // pending/confirmed/cancelled/completed

        // Thông tin hiển thị (denormalized để tránh JOIN phức tạp)
        public string PatientName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CancelledAt { get; set; }
        public string? CancelReason { get; set; }
    }
}