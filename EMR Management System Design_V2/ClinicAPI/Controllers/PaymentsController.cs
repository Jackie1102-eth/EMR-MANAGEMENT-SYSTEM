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
                return Ok(new { valid = false, message = "Thẻ BHYT không tồn tại.", coverage = 0 });

            var isValid = insurance.ExpiryDate >= DateTime.Today;

            return Ok(new
            {
                valid        = isValid,
                message      = isValid ? "Thẻ BHYT còn hiệu lực." : "Thẻ BHYT đã hết hạn.",
                correctRoute = isValid,
                coverage     = isValid ? insurance.CoverageRate : 0,
                holderName   = insurance.HolderName,
                expiryDate   = insurance.ExpiryDate.ToString("dd/MM/yyyy")
            });
        }

        // ─────────────────────────────────────────
        // POST /api/payments/bill
        // Bác sĩ tạo hóa đơn — status = "pending"
        // Bệnh nhân sẽ thanh toán sau qua POST /api/payments/{id}/pay
        // ─────────────────────────────────────────
        [HttpPost("bill")]
        public async Task<ActionResult<object>> CreateBill([FromBody] CreateBillDto dto)
        {
            if (!Guid.TryParse(dto.PatientId, out Guid patientGuid))
                return BadRequest(new { message = "patientId không hợp lệ." });

            if (dto.Items == null || !dto.Items.Any())
                return BadRequest(new { message = "Hóa đơn phải có ít nhất 1 dịch vụ." });

            var patient = await _context.Patients.FindAsync(patientGuid);
            if (patient == null)
                return NotFound(new { message = "Không tìm thấy bệnh nhân." });

            var totalAmount = dto.Items.Sum(i => i.Amount);

            var payment = new Payment
            {
                Id            = Guid.NewGuid(),
                PatientId     = patientGuid,
                AppointmentId = Guid.TryParse(dto.AppointmentId, out Guid aptGuid) ? aptGuid : null,
                DoctorId      = Guid.TryParse(dto.DoctorId, out Guid docGuid) ? docGuid : null,
                TotalAmount   = totalAmount,
                InsuranceAmount = 0,
                PatientAmount = totalAmount,
                PaymentMethod = dto.PaymentMethod ?? "cash",
                Notes         = dto.Notes ?? "",
                Status        = "pending",   // chờ bệnh nhân thanh toán
                CreatedAt     = DateTime.UtcNow,
                Items         = dto.Items.Select(i => new PaymentItem
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
                id          = payment.Id,
                totalAmount,
                status      = "pending",
                message     = "Tạo hóa đơn thành công. Bệnh nhân có thể thanh toán tại quầy."
            });
        }

        // ─────────────────────────────────────────
        // GET /api/payments/pending?patientId=xxx
        // Lấy hóa đơn đang chờ thanh toán của bệnh nhân
        // (PaymentSystem.tsx dùng để hiện hóa đơn bác sĩ đã tạo)
        // ─────────────────────────────────────────
        [HttpGet("pending")]
        public async Task<ActionResult<object>> GetPendingBill([FromQuery] string patientId)
        {
            if (!Guid.TryParse(patientId, out Guid patientGuid))
                return BadRequest(new { message = "patientId không hợp lệ." });

            // ✅ Thêm: tìm Patient.Id từ UserId
            var patient = await _context.Patients
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == patientGuid);

            // Nếu không tìm được theo UserId thì thử coi luôn là Patient.Id
            var realPatientId = patient?.Id ?? patientGuid;

            var payment = await _context.Payments
                .AsNoTracking()
                .Include(p => p.Items)
                .Where(p => p.PatientId == realPatientId && p.Status == "pending")
                .OrderByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();

            if (payment == null)
                return Ok(null);

            return Ok(new
            {
                id          = payment.Id,
                totalAmount = payment.TotalAmount,
                status      = payment.Status,
                createdAt   = payment.CreatedAt.ToLocalTime().ToString("dd/MM/yyyy HH:mm"),
                items       = payment.Items.Select(i => new
                {
                    serviceName = i.ServiceName,
                    amount      = i.Amount
                })
            });
        }

        // ─────────────────────────────────────────
        // POST /api/payments/{id}/pay
        // Bệnh nhân thanh toán hóa đơn đã có
        // ─────────────────────────────────────────
        [HttpPost("{id}/pay")]
        public async Task<ActionResult<object>> PayBill(Guid id, [FromBody] PayBillDto dto)
        {
            var payment = await _context.Payments
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (payment == null)
                return NotFound(new { message = "Không tìm thấy hóa đơn." });

            if (payment.Status == "completed")
                return BadRequest(new { message = "Hóa đơn này đã được thanh toán." });

            var insurancePayment = 0m;

            // Tính BHYT nếu có
            if (!string.IsNullOrEmpty(dto.InsuranceCode))
            {
                var insurance = await _context.InsuranceCards
                    .FirstOrDefaultAsync(i =>
                        i.Code == dto.InsuranceCode.ToUpper().Trim() &&
                        i.ExpiryDate >= DateTime.Today);

                if (insurance != null)
                    insurancePayment = Math.Floor(payment.TotalAmount * (decimal)insurance.CoverageRate);
            }

            payment.InsuranceCode   = dto.InsuranceCode ?? "";
            payment.InsuranceAmount = insurancePayment;
            payment.PatientAmount   = payment.TotalAmount - insurancePayment;
            payment.PaymentMethod   = dto.PaymentMethod ?? payment.PaymentMethod;
            payment.Status          = "completed";
            payment.PaidAt          = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id              = payment.Id,
                totalAmount     = payment.TotalAmount,
                insuranceAmount = payment.InsuranceAmount,
                patientAmount   = payment.PatientAmount,
                status          = "completed",
                message         = "Thanh toán thành công. Hóa đơn đã được lưu."
            });
        }

        // ─────────────────────────────────────────
        // POST /api/payments  (giữ lại tương thích cũ)
        // ─────────────────────────────────────────
        [HttpPost]
        public async Task<ActionResult<object>> CreatePayment([FromBody] CreatePaymentDto dto)
        {
            if (!Guid.TryParse(dto.PatientId, out Guid patientGuid))
                return BadRequest(new { message = "patientId không hợp lệ." });

            var patient = await _context.Patients.FindAsync(patientGuid);
            if (patient == null)
                return NotFound(new { message = "Không tìm thấy bệnh nhân." });

            var totalAmount      = dto.Items.Sum(i => i.Amount);
            var insurancePayment = 0m;

            if (!string.IsNullOrEmpty(dto.InsuranceCode))
            {
                var insurance = await _context.InsuranceCards
                    .FirstOrDefaultAsync(i =>
                        i.Code == dto.InsuranceCode.ToUpper().Trim() &&
                        i.ExpiryDate >= DateTime.Today);
                if (insurance != null)
                    insurancePayment = Math.Floor(totalAmount * (decimal)insurance.CoverageRate);
            }

            var payment = new Payment
            {
                Id              = Guid.NewGuid(),
                PatientId       = patientGuid,
                AppointmentId   = Guid.TryParse(dto.AppointmentId, out Guid aptGuid) ? aptGuid : null,
                InsuranceCode   = dto.InsuranceCode ?? "",
                TotalAmount     = totalAmount,
                InsuranceAmount = insurancePayment,
                PatientAmount   = totalAmount - insurancePayment,
                PaymentMethod   = dto.PaymentMethod,
                Status          = "completed",
                CreatedAt       = DateTime.UtcNow,
                PaidAt          = DateTime.UtcNow,
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
                id              = payment.Id,
                totalAmount,
                insuranceAmount = insurancePayment,
                patientAmount   = totalAmount - insurancePayment,
                status          = payment.Status,
                message         = "Thanh toán thành công."
            });
        }

        // ─────────────────────────────────────────
        // GET /api/payments/{id}/invoice
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

    // Bác sĩ tạo bill
    public class CreateBillDto
    {
        public string  PatientId     { get; set; } = "";
        public string? AppointmentId { get; set; }
        public string? DoctorId      { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Notes         { get; set; }
        public List<PaymentItemDto> Items { get; set; } = new();
    }

    // Bệnh nhân thanh toán bill đã có
    public class PayBillDto
    {
        public string? InsuranceCode { get; set; }
        public string? PaymentMethod { get; set; }
    }

    // Tạo payment trực tiếp (cũ)
    public class CreatePaymentDto
    {
        public string  PatientId     { get; set; } = "";
        public string? AppointmentId { get; set; }
        public string? InsuranceCode { get; set; }
        public string  PaymentMethod { get; set; } = "cash";
        public List<PaymentItemDto> Items { get; set; } = new();
    }

    public class PaymentItemDto
    {
        public string  ServiceName { get; set; } = "";
        public decimal Amount      { get; set; }
    }
}