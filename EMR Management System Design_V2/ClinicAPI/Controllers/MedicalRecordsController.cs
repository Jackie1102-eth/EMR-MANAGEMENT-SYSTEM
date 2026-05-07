using Microsoft.AspNetCore.Mvc;
using ClinicAPI.Data;
using ClinicAPI.Models;

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

        // Lưu hồ sơ khám bệnh mới
        [HttpPost]
        public async Task<IActionResult> CreateRecord([FromBody] MedicalRecord record)
        {
            record.VisitDate = DateTime.Now;
            _context.MedicalRecords.Add(record);
            await _context.SaveChangesAsync();
            
            return Ok(new { message = "Lưu hồ sơ thành công!", recordId = record.Id });
        }
    }
}