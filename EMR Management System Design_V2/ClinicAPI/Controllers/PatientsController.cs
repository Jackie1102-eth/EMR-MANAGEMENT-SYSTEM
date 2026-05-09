using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClinicAPI.Data;
using ClinicAPI.Models;

namespace ClinicAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PatientsController : ControllerBase
    {
        private readonly EMRDbContext _context;

        public PatientsController(EMRDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách toàn bộ bệnh nhân
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Patient>>> GetPatients([FromQuery] string search = "")
        {
            var query = _context.Patients.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p =>
                    p.FullName.Contains(search) ||
                    p.PatientCode.Contains(search) ||
                    (p.Phone != null && p.Phone.Contains(search)));
            }

            return await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        }

        // 2. Lấy profile bệnh nhân theo userId
        [HttpGet("profile")]
        public async Task<ActionResult<Patient>> GetProfile([FromQuery] string userId = "")
        {
            if (string.IsNullOrEmpty(userId))
                userId = Request.Headers["X-User-Id"].FirstOrDefault() ?? "";

            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out Guid userGuid))
                return BadRequest(new { message = "userId không hợp lệ." });

            var patient = await _context.Patients
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.UserId == userGuid);

            if (patient == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ bệnh nhân." });

            return Ok(patient);
        }

        // 3. Lấy chi tiết bệnh nhân theo Patient.Id
        [HttpGet("{id}")]
        public async Task<ActionResult<Patient>> GetPatient(Guid id)
        {
            var patient = await _context.Patients.FindAsync(id);

            if (patient == null)
                return NotFound(new { message = "Không tìm thấy bệnh nhân." });

            return Ok(patient);
        }

        // 4. Thêm bệnh nhân mới
        [HttpPost]
        public async Task<ActionResult<Patient>> CreatePatient(Patient patient)
        {
            try
            {
                patient.Id = Guid.NewGuid();
                patient.CreatedAt = DateTime.Now;
                _context.Patients.Add(patient);
                await _context.SaveChangesAsync();
                return Ok(patient);
            }
            catch (DbUpdateException ex)
            {
                var detail = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, new { message = "Lỗi lưu database.", detail });
            }
        }

        // 5. ✅ Cập nhật profile theo UserId (dùng cho trang My Profile)
        [HttpPut("by-user/{userId}")]
        public async Task<IActionResult> UpdateByUserId(Guid userId, [FromBody] UpdatePatientRequest req)
        {
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == userId);
            if (patient == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ bệnh nhân." });

            // Personal info
            patient.FullName  = req.FullName  ?? patient.FullName;
            patient.Phone     = req.Phone     ?? patient.Phone;
            patient.Email     = req.Email     ?? patient.Email;
            patient.Address   = req.Address   ?? patient.Address;

            // ✅ Medical info
            patient.BloodType          = req.BloodType          ?? patient.BloodType;
            patient.Allergies          = req.Allergies          ?? patient.Allergies;
            patient.ChronicConditions  = req.ChronicConditions  ?? patient.ChronicConditions;
            patient.CurrentMedications = req.CurrentMedications ?? patient.CurrentMedications;

            await _context.SaveChangesAsync();
            return Ok(patient);
        }

        // 6. Cập nhật thông tin bệnh nhân theo Patient.Id (dùng cho admin)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePatient(Guid id, Patient updatedPatient)
        {
            var patient = await _context.Patients.FindAsync(id);
            if (patient == null)
                return NotFound(new { message = "Không tìm thấy bệnh nhân." });

            patient.FullName  = updatedPatient.FullName;
            patient.Phone     = updatedPatient.Phone;
            patient.Email     = updatedPatient.Email;
            patient.Address   = updatedPatient.Address;
            patient.LastVisit = updatedPatient.LastVisit;

            await _context.SaveChangesAsync();
            return Ok(patient);
        }
    }

    // ✅ Request model cho update profile
    public class UpdatePatientRequest
    {
        public string? FullName          { get; set; }
        public string? Phone             { get; set; }
        public string? Email             { get; set; }
        public string? Address           { get; set; }
        public string? BloodType         { get; set; }
        public string? Allergies         { get; set; }  // lưu dạng "Penicillin, Aspirin"
        public string? ChronicConditions { get; set; }
        public string? CurrentMedications{ get; set; }
    }
}