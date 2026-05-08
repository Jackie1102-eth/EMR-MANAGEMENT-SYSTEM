using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClinicAPI.Data;
using ClinicAPI.Models;

namespace ClinicAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppointmentsController : ControllerBase
    {
        private readonly EMRDbContext _context;

        public AppointmentsController(EMRDbContext context)
        {
            _context = context;
        }

        // 1. Lấy toàn bộ danh sách lịch hẹn
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointments()
        {
            return await _context.Appointments.ToListAsync();
        }

        // 2. LẤY LỊCH HẸN HÔM NAY (dùng cho Dashboard)
        [HttpGet("today")]
        public async Task<ActionResult<object>> GetTodayCount()
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var count = await _context.Appointments
                .Where(a => a.AppointmentDate >= today && a.AppointmentDate < tomorrow)
                .CountAsync();

            return Ok(new { count });
        }

        // 3. Lấy lịch hẹn theo ID bác sĩ
        [HttpGet("doctor/{doctorId}")]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetByDoctor(Guid doctorId)
        {
            return await _context.Appointments
                .Where(a => a.DoctorId == doctorId)
                .ToListAsync();
        }

        // 4. Cập nhật trạng thái lịch hẹn
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] string newStatus)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
                return NotFound(new { message = "Không tìm thấy lịch hẹn" });

            appointment.Status = newStatus;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Cập nhật trạng thái thành công", status = newStatus });
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(500, "Lỗi khi cập nhật cơ sở dữ liệu");
            }
        }

        // 5. Xóa lịch hẹn
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAppointment(Guid id)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            _context.Appointments.Remove(appointment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa lịch hẹn" });
        }
    }
}