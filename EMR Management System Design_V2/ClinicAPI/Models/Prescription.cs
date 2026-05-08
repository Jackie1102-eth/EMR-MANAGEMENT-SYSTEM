using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ClinicAPI.Models
{
    public class Prescription
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid PatientId { get; set; }

        [Required]
        public Guid DoctorId { get; set; }

        public DateTime PrescriptionDate { get; set; } = DateTime.Now;

        // Thêm dấu ? để cho phép NULL nếu bác sĩ không nhập ghi chú 
        public string? Notes { get; set; }

        // Navigation property: Danh sách thuốc chi tiết của đơn này
        public List<PrescriptionDetail> MedicationDetails { get; set; } = new List<PrescriptionDetail>();
    }
}