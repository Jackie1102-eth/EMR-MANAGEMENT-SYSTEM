namespace ClinicAPI.Models
{
    public class Appointment
    {
        public Guid Id { get; set; }
        public string PatientName { get; set; } = string.Empty; // Thêm giá trị mặc định
        public string Phone { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public DateTime AppointmentDate { get; set; }
        public string Department { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public Guid DoctorId { get; set; }
    }
}