using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClinicAPI.Data;
using ClinicAPI.Models;

namespace ClinicAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly EMRDbContext _context;

        public PaymentsController(EMRDbContext context)
        {
            _context = context;
        }

        // ─────────────────────────────────────────
        // GET /api/payments/insurance/check?code=BH123456
        // Kiểm tra mã thẻ BHYT
        // ─────────────────────────────────────────
        [HttpGet("insurance/check")]
        public async Task<ActionResult<object>> CheckInsurance([FromQuery] string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                return BadRequest(new { message = "Mã thẻ BHYT không được để trống." });

            var insurance = await _context.InsuranceCards
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Code == code.ToUpper().Trim());

            if (insurance == null)
                return Ok(new
                {
                    valid        = false,
                    message      = "Thẻ BHYT không tồn tại hoặc không hợp lệ.",
                    correctRoute = false,
                    coverage     = 0
                });

            var isValid       = insurance.ExpiryDate >= DateTime.Today;
            var correctRoute  = insurance.RegisteredHospital == "ClinicDB"; // tên bệnh viện của bạn

            return Ok(new
            {
                valid            = isValid,
                message          = isValid ? "Thẻ BHYT còn hiệu lực." : "Thẻ BHYT đã hết hạn.",
                correctRoute     = isValid && correctRoute,
                coverage         = isValid ? insurance.CoverageRate : 0,   // 0.8 = 80%
                holderName       = insurance.HolderName,
                expiryDate       = insurance.ExpiryDate.ToString("dd/MM/yyyy")
            });
        }

        // ─────────────────────────────────────────
        // POST /api/payments
        // Tạo thanh toán mới + lưu Invoice
        // ─────────────────────────────────────────
        [HttpPost]
        public async Task<ActionResult<object>> CreatePayment([FromBody] CreatePaymentDto dto)
        {
            if (!Guid.TryParse(dto.PatientId, out Guid patientGuid))
                return BadRequest(new { message = "patientId không hợp lệ." });

            // Kiểm tra patient tồn tại
            var patient = await _context.Patients.FindAsync(patientGuid);
            if (patient == null)
                return NotFound(new { message = "Không tìm thấy bệnh nhân." });

            var totalAmount      = dto.Items.Sum(i => i.Amount);
            var insurancePayment = 0m;

            // Nếu có BHYT hợp lệ thì tính phần BHYT chi trả
            if (!string.IsNullOrEmpty(dto.InsuranceCode))
            {
                var insurance = await _context.InsuranceCards
                    .FirstOrDefaultAsync(i => i.Code == dto.InsuranceCode.ToUpper().Trim()
                                           && i.ExpiryDate >= DateTime.Today);
                if (insurance != null)
                    insurancePayment = Math.Floor(totalAmount * (decimal)insurance.CoverageRate);
            }

            var patientPayment = totalAmount - insurancePayment;

            var payment = new Payment
            {
                Id              = Guid.NewGuid(),
                PatientId       = patientGuid,
                AppointmentId   = Guid.TryParse(dto.AppointmentId, out Guid aptGuid) ? aptGuid : null,
                InsuranceCode   = dto.InsuranceCode ?? "",
                TotalAmount     = totalAmount,
                InsuranceAmount = insurancePayment,
                PatientAmount   = patientPayment,
                PaymentMethod   = dto.PaymentMethod,
                Status          = "completed",   // mock: luôn thành công
                CreatedAt       = DateTime.UtcNow,
                Items           = dto.Items.Select(i => new PaymentItem
                {
                    Id          = Guid.NewGuid(),
                    ServiceName = i.ServiceName,
                    Amount      = i.Amount
                }).ToList()
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                id             = payment.Id,
                totalAmount,
                insuranceAmount = insurancePayment,
                patientAmount  = patientPayment,
                status         = payment.Status,
                message        = "Thanh toán thành công. Hóa đơn đã được lưu."
            });
        }

        // ─────────────────────────────────────────
        // GET /api/payments/{id}/invoice
        // Lấy thông tin hóa đơn để xuất PDF
        // ─────────────────────────────────────────
        [HttpGet("{id}/invoice")]
        public async Task<ActionResult<object>> GetInvoice(Guid id)
        {
            var payment = await _context.Payments
                .AsNoTracking()
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (payment == null)
                return NotFound(new { message = "Không tìm thấy hóa đơn." });

            var patient = await _context.Patients.FindAsync(payment.PatientId);

            return Ok(new
            {
                invoiceId       = payment.Id,
                patientName     = patient?.FullName ?? "",
                patientPhone    = patient?.Phone ?? "",
                createdAt       = payment.CreatedAt.ToLocalTime().ToString("dd/MM/yyyy HH:mm"),
                items           = payment.Items.Select(i => new { i.ServiceName, i.Amount }),
                totalAmount     = payment.TotalAmount,
                insuranceAmount = payment.InsuranceAmount,
                patientAmount   = payment.PatientAmount,
                paymentMethod   = payment.PaymentMethod,
                status          = payment.Status
            });
        }

        // ─────────────────────────────────────────
        // GET /api/payments/patient?userId=xxx
        // Lịch sử thanh toán của bệnh nhân
        // ─────────────────────────────────────────
        [HttpGet("patient")]
        public async Task<ActionResult<object>> GetPatientPayments([FromQuery] string userId)
        {
            if (!Guid.TryParse(userId, out Guid userGuid))
                return BadRequest(new { message = "userId không hợp lệ." });

            var payments = await _context.Payments
                .AsNoTracking()
                .Where(p => p.PatientId == userGuid)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new
                {
                    id            = p.Id,
                    createdAt     = p.CreatedAt.ToLocalTime().ToString("dd/MM/yyyy HH:mm"),
                    totalAmount   = p.TotalAmount,
                    patientAmount = p.PatientAmount,
                    paymentMethod = p.PaymentMethod,
                    status        = p.Status
                })
                .ToListAsync();

            return Ok(payments);
        }
    }

    // ─────────────────────────────────────────
    // DTOs
    // ─────────────────────────────────────────
    public class CreatePaymentDto
    {
        public string PatientId      { get; set; } = "";
        public string? AppointmentId { get; set; }
        public string? InsuranceCode { get; set; }
        public string PaymentMethod  { get; set; } = "qr";
        public List<PaymentItemDto> Items { get; set; } = new();
    }

    public class PaymentItemDto
    {
        public string ServiceName { get; set; } = "";
        public decimal Amount     { get; set; }
    }
}