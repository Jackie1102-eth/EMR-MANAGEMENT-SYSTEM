using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClinicAPI.Data;
using ClinicAPI.Models;

namespace ClinicAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    // [Authorize] // Sau này bạn hãy bỏ comment dòng này để bảo mật
    public class PatientsController : ControllerBase
    {
        private readonly EMRDbContext _context;

        public PatientsController(EMRDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách toàn bộ bệnh nhân
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Patient>>> GetPatients()
        {
            return await _context.Patients.ToListAsync();
        }

        // 2. Thêm bệnh nhân mới
        [HttpPost]
        public async Task<ActionResult<Patient>> CreatePatient(Patient patient)
        {
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();
            return Ok(patient);
        }
        [HttpGet("{id}")]
        public async Task<ActionResult<Patient>> GetPatient(Guid id)
        {
            var patient = await _context.Patients.FindAsync(id);

            if (patient == null)
            {
                return NotFound();
            }

            return Ok(patient); // Backend phải trả về Ok kèm dữ liệu JSON
        }
    }
}