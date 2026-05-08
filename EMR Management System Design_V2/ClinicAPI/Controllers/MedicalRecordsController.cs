using Microsoft.AspNetCore.Mvc;
using ClinicAPI.Data;
using ClinicAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ClinicAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MedicalRecordsController : ControllerBase
    {
        private readonly EMRDbContext _context;

        public MedicalRecordsController(EMRDbContext context)
        {
            _context = context;
        }

        // GET /api/medicalrecords — lấy tất cả (dùng cho Dashboard count)
        [HttpGet]
        public async Task<ActionResult<object>> GetAll()
        {
            var count = await _context.MedicalRecords.CountAsync();
            return Ok(new { count });
        }

        [HttpPost]
        public async Task<IActionResult> CreateRecord([FromBody] MedicalRecord record)
        {
            try
            {
                if (record == null)
                    return BadRequest(new { message = "Body rỗng hoặc JSON không hợp lệ." });

                if (record.PatientId == Guid.Empty)
                    return BadRequest(new { message = "PatientId không hợp lệ." });

                record.Id = Guid.NewGuid();
                record.VisitDate = DateTime.Now;

                _context.MedicalRecords.Add(record);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Lưu hồ sơ thành công!", recordId = record.Id });
            }
            catch (DbUpdateException ex)
            {
                var detail = ex.InnerException?.Message ?? ex.Message;
                return StatusCode(500, new { message = "Lỗi database.", detail });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server.", detail = ex.Message });
            }
        }

        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<IEnumerable<MedicalRecord>>> GetByPatient(string patientId)
        {
            if (!Guid.TryParse(patientId, out Guid patientGuid))
                return BadRequest(new { message = "PatientId không đúng định dạng GUID." });

            var records = await _context.MedicalRecords
                .AsNoTracking()
                .Where(m => m.PatientId == patientGuid)
                .OrderByDescending(m => m.VisitDate)
                .ToListAsync();

            return Ok(records);
        }

        [HttpPut("lock/{id}")]
        public async Task<IActionResult> LockRecord(Guid id)
        {
            var record = await _context.MedicalRecords.FindAsync(id);
            if (record == null) return NotFound();
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}