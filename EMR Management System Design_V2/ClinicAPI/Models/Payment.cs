namespace ClinicAPI.Models
{
    // ─── Bảng Payments ───────────────────────────
    public class Payment
    {
        public Guid      Id              { get; set; }
        public Guid      PatientId       { get; set; }
        public Guid?     DoctorId        { get; set; }   // bác sĩ tạo bill
        public Guid?     AppointmentId   { get; set; }
        public string    InsuranceCode   { get; set; } = "";
        public decimal   TotalAmount     { get; set; }
        public decimal   InsuranceAmount { get; set; }
        public decimal   PatientAmount   { get; set; }
        public string    PaymentMethod   { get; set; } = "";  // cash | card | qr
        public string    Status          { get; set; } = "";  // pending | completed
        public string    Notes           { get; set; } = "";
        public DateTime  CreatedAt       { get; set; }
        public DateTime? PaidAt          { get; set; }        // thời điểm thanh toán

        // Navigation
        public List<PaymentItem> Items { get; set; } = new();
    }

    // ─── Bảng PaymentItems ───────────────────────
    public class PaymentItem
    {
        public Guid    Id          { get; set; }
        public Guid    PaymentId   { get; set; }
        public string  ServiceName { get; set; } = "";
        public decimal Amount      { get; set; }

        // Navigation
        public Payment? Payment { get; set; }
    }

    // ─── Bảng InsuranceCards ─────────────────────
    public class InsuranceCard
    {
        public Guid     Id                 { get; set; }
        public string   Code               { get; set; } = "";   // mã thẻ BHYT
        public string   HolderName         { get; set; } = "";
        public Guid?    PatientId          { get; set; }
        public DateTime ExpiryDate         { get; set; }
        public double   CoverageRate       { get; set; } = 0.8;  // 0.8 = 80%
        public string   RegisteredHospital { get; set; } = "";
    }
}