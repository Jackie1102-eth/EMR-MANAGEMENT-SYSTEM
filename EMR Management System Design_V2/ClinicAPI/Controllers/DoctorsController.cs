using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClinicAPI.Data;
using ClinicAPI.Models;

namespace ClinicAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DoctorsController : ControllerBase
    {
        private readonly EMRDbContext _context;

        public DoctorsController(EMRDbContext context)
        {
            _context = context;
        }

        // ─────────────────────────────────────────
        // GET /api/doctors?department=cardiology
        // Lấy danh sách bác sĩ theo khoa
        // ─────────────────────────────────────────
        [HttpGet]
        public async Task<ActionResult<object>> GetDoctors([FromQuery] string department = "")
        {
            var query = _context.Users
                .Where(u => u.Role == "doctor" && u.Status == "active");

            // ✅ Filter theo department nếu có
            if (!string.IsNullOrEmpty(department))
                query = query.Where(u => u.Department == department);

            var users = await query.ToListAsync();

            var result = users.Select(u => new
            {
                id        = u.Id,
                name      = "BS. " + u.FullName,
                specialty = DepartmentToSpecialty(u.Department ?? "")
            });

            return Ok(result);
        }

        private static string DepartmentToSpecialty(string dept) => dept switch
        {
            "cardiology"   => "Bác Sĩ Tim Mạch",
            "neurology"    => "Bác Sĩ Thần Kinh",
            "orthopedics"  => "Bác Sĩ Chỉnh Hình",
            "pediatrics"   => "Bác Sĩ Nhi Khoa",
            "general"      => "Bác Sĩ Đa Khoa",
            _              => "Bác Sĩ"
        };

    }
}