using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ClinicAPI.Models
{
    public class PrescriptionDetail
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid PrescriptionId { get; set; }

        [Required]
        public string MedicineName { get; set; } = string.Empty;

        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        public string? Duration { get; set; }

        // FIX: Bỏ qua khi serialize JSON để tránh circular reference
        [JsonIgnore]
        [ForeignKey("PrescriptionId")]
        public Prescription? Prescription { get; set; }
    }
}