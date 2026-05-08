using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClinicAPI.Data;
using ClinicAPI.Models;
 
namespace ClinicAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrescriptionsController : ControllerBase
    {
        private readonly EMRDbContext _context;
 
        public PrescriptionsController(EMRDbContext context)
        {
            _context = context;
        }
 
        // 1. LẤY DANH SÁCH ĐƠN THUỐC CỦA BỆNH NHÂN
        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<IEnumerable<Prescription>>> GetByPatient(Guid patientId)
        {
            var prescriptions = await _context.Prescriptions
                .Include(p => p.MedicationDetails)
                .Where(p => p.PatientId == patientId)
                .OrderByDescending(p => p.PrescriptionDate)
                .ToListAsync();
 
            return Ok(prescriptions);
        }
 
        // 2. TẠO ĐƠN THUỐC MỚI
        [HttpPost]
        public async Task<ActionResult<Prescription>> CreatePrescription([FromBody] Prescription prescription)
        {
            try
            {
                // FIX 1: Luôn tạo Id mới, không dùng Guid từ frontend (tránh duplicate)
                prescription.Id = Guid.NewGuid();
 
                // FIX 2: Validate PatientId và DoctorId
                if (prescription.PatientId == Guid.Empty)
                    return BadRequest(new { message = "Mã bệnh nhân không hợp lệ." });
 
                if (prescription.DoctorId == Guid.Empty)
                    return BadRequest(new { message = "Mã bác sĩ không hợp lệ." });
 
                // FIX 3: Set ngày nếu không có
                if (prescription.PrescriptionDate == default)
                    prescription.PrescriptionDate = DateTime.Now;
 
                // FIX 4: Gán PrescriptionId cho từng detail + tạo Id mới
                if (prescription.MedicationDetails != null)
                {
                    foreach (var detail in prescription.MedicationDetails)
                    {
                        detail.Id = Guid.NewGuid();
                        detail.PrescriptionId = prescription.Id;
                    }
                }
 
                _context.Prescriptions.Add(prescription);
                await _context.SaveChangesAsync();
 
                return CreatedAtAction(nameof(GetById), new { id = prescription.Id }, prescription);
            }
            catch (DbUpdateException ex)
            {
                return StatusCode(500, new { 
                    message = "Lỗi lưu database.", 
                    detail = ex.InnerException?.Message ?? ex.Message 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Lỗi hệ thống.", 
                    detail = ex.Message 
                });
            }
        }
 
        // 3. LẤY CHI TIẾT 1 ĐƠN THUỐC
        [HttpGet("{id}")]
        public async Task<ActionResult<Prescription>> GetById(Guid id)
        {
            var prescription = await _context.Prescriptions
                .Include(p => p.MedicationDetails)
                .FirstOrDefaultAsync(p => p.Id == id);
 
            if (prescription == null) return NotFound();
            return Ok(prescription);
        }
 
        // 4. XÓA ĐƠN THUỐC (cascade xóa cả details)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePrescription(Guid id)
        {
            var prescription = await _context.Prescriptions
                .Include(p => p.MedicationDetails)
                .FirstOrDefaultAsync(p => p.Id == id);
 
            if (prescription == null) return NotFound();
 
            _context.Prescriptions.Remove(prescription);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
