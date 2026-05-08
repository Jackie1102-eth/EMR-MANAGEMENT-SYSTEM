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

        // ─────────────────────────────────────────
        // GET /api/appointments
        // Lấy toàn bộ lịch hẹn (Admin)
        // ─────────────────────────────────────────
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointments()
        {
            return await _context.Appointments
                .OrderByDescending(a => a.AppointmentDate)
                .ToListAsync();
        }

        // ─────────────────────────────────────────
        // GET /api/appointments/today
        // Số lịch hẹn hôm nay (Dashboard)
        // ─────────────────────────────────────────
        [HttpGet("today")]
        public async Task<ActionResult<object>> GetTodayCount()
        {
            var today = DateTime.Today;
            var count = await _context.Appointments
                .Where(a => a.AppointmentDate.Date == today)
                .CountAsync();

            return Ok(new { count });
        }
        private static string MapDepartmentName(string deptId) => deptId switch
        {
            "cardiology"  => "Tim Mạch",
            "neurology"   => "Thần Kinh",
            "orthopedics" => "Chỉnh Hình",
            "pediatrics"  => "Nhi Khoa",
            "general"     => "Đa Khoa",
            _             => deptId
        };
        // ─────────────────────────────────────────
        // GET /api/appointments/my
        // Lịch hẹn của bệnh nhân đang đăng nhập
        // Patient.Id == UserId (cùng Guid)
        // ─────────────────────────────────────────
        [HttpGet("my")]
        public async Task<ActionResult<object>> GetMyAppointments([FromQuery] string userId = "")
        {
            if (string.IsNullOrEmpty(userId))
                userId = Request.Headers["X-User-Id"].FirstOrDefault() ?? "";

            if (!Guid.TryParse(userId, out Guid userGuid))
                return BadRequest(new { message = "userId không hợp lệ." });

            // Patient.Id == UserId — không cần JOIN
            var appointments = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.PatientId == userGuid)
                .OrderByDescending(a => a.AppointmentDate)
                    .Select(a => new
                    {
                        id         = a.Id,
                        date       = a.AppointmentDate.ToString("yyyy-MM-dd"),
                        timeSlot   = a.TimeSlot,
                        department = MapDepartmentName(a.DepartmentId),
                        // Nếu có bảng Users:
                        doctor     = _context.Users
                                        .Where(u => u.Id == a.DoctorId)
                                        .Select(u => u.FullName)
                                        .FirstOrDefault() ?? "",
                        // Hoặc nếu có bảng Doctors:
                        // doctor  = _context.Doctors
                        //               .Where(doc => doc.Id == a.DoctorId)
                        //               .Select(doc => "BS. " + doc.FullName)
                        //               .FirstOrDefault() ?? "",
                        status     = a.Status.ToLower(),
                        notes      = a.Notes ?? "",
                        createdAt  = a.CreatedAt.ToString("yyyy-MM-dd")
})
                .ToListAsync();

            return Ok(appointments);
        }

        // ─────────────────────────────────────────
        // GET /api/appointments/patient?userId=xxx
        // Giữ lại cho tương thích ngược
        // ─────────────────────────────────────────
        [HttpGet("patient")]
        public async Task<ActionResult<object>> GetPatientAppointments([FromQuery] string userId = "")
        {
            return await GetMyAppointments(userId);
        }

        // ─────────────────────────────────────────
        // GET /api/appointments/doctor?from=&to=
        // Lịch hẹn của bác sĩ đang đăng nhập
        // ─────────────────────────────────────────
        [HttpGet("doctor")]
        public async Task<ActionResult<object>> GetDoctorAppointments(
            [FromQuery] string userId = "",
            [FromQuery] string from = "",
            [FromQuery] string to = "")
        {
            if (string.IsNullOrEmpty(userId))
                userId = Request.Headers["X-User-Id"].FirstOrDefault() ?? "";

            if (!Guid.TryParse(userId, out Guid doctorGuid))
                return BadRequest(new { message = "userId không hợp lệ." });

            var query = _context.Appointments
                .Where(a => a.DoctorId == doctorGuid);

            if (DateTime.TryParse(from, out DateTime fromDate))
                query = query.Where(a => a.AppointmentDate >= fromDate);

            if (DateTime.TryParse(to, out DateTime toDate))
                query = query.Where(a => a.AppointmentDate <= toDate);

            var appointments = await query
                .OrderBy(a => a.AppointmentDate)
                .ThenBy(a => a.TimeSlot)
                .ToListAsync();

            return Ok(appointments);
        }

        // ─────────────────────────────────────────
        // GET /api/appointments/check-availability
        // Kiểm tra slot còn trống
        // ─────────────────────────────────────────
        [HttpGet("check-availability")]
        public async Task<ActionResult<object>> CheckAvailability(
            [FromQuery] string doctorId,
            [FromQuery] string date,
            [FromQuery] string timeSlot)
        {
            if (!Guid.TryParse(doctorId, out Guid doctorGuid))
                return BadRequest(new { message = "doctorId không hợp lệ." });

            if (!DateTime.TryParse(date, out DateTime appointmentDate))
                return BadRequest(new { message = "date không hợp lệ." });

            var exists = await _context.Appointments.AnyAsync(a =>
                a.DoctorId == doctorGuid &&
                a.AppointmentDate.Date == appointmentDate.Date &&
                a.TimeSlot == timeSlot &&
                a.Status != "cancelled");

            return Ok(new { available = !exists });
        }

        // ─────────────────────────────────────────
        // GET /api/appointments/available-slots
        // Slot còn trống của bác sĩ trong ngày
        // ─────────────────────────────────────────
        [HttpGet("available-slots")]
        public async Task<ActionResult<IEnumerable<string>>> GetAvailableSlots(
            [FromQuery] string doctorId,
            [FromQuery] string date)
        {
            if (!Guid.TryParse(doctorId, out Guid doctorGuid))
                return BadRequest(new { message = "doctorId không hợp lệ." });

            if (!DateTime.TryParse(date, out DateTime appointmentDate))
                return BadRequest(new { message = "Ngày không hợp lệ." });

            // Tất cả slot: 07:00 - 16:30, cách 30 phút
            var allSlots = new List<string>();
            for (int h = 7; h <= 16; h++)
            {
                allSlots.Add($"{h:D2}:00");
                if (h < 16) allSlots.Add($"{h:D2}:30");
            }
            allSlots.Add("16:30");

            var bookedSlots = await _context.Appointments
                .AsNoTracking()
                .Where(a =>
                    a.DoctorId == doctorGuid &&
                    a.AppointmentDate.Date == appointmentDate.Date &&
                    a.Status != "cancelled")
                .Select(a => a.TimeSlot)
                .ToListAsync();

            var available = allSlots.Where(s => !bookedSlots.Contains(s)).ToList();
            return Ok(available);
        }

        // ─────────────────────────────────────────
        // POST /api/appointments
        // Đặt lịch hẹn mới
        // Nhận userId — tự tìm Patient vì Patient.Id == UserId
        // ─────────────────────────────────────────
        [HttpPost]
        public async Task<ActionResult<object>> BookAppointment([FromBody] BookAppointmentDto dto)
        {
            // Hỗ trợ cả PatientId (cũ) lẫn UserId (mới)
            var rawId = !string.IsNullOrEmpty(dto.UserId) ? dto.UserId : dto.PatientId;

            if (!Guid.TryParse(rawId, out Guid patientGuid))
                return BadRequest(new { message = "userId/patientId không hợp lệ." });

            if (!Guid.TryParse(dto.DoctorId, out Guid doctorGuid))
                return BadRequest(new { message = "doctorId không hợp lệ." });

            if (!DateTime.TryParse(dto.Date, out DateTime appointmentDate))
                return BadRequest(new { message = "date không hợp lệ." });

            appointmentDate = DateTime.SpecifyKind(appointmentDate.Date, DateTimeKind.Utc);

            if (appointmentDate.Date < DateTime.Now.Date)
                return BadRequest(new { message = "Không thể đặt lịch cho ngày trong quá khứ." });

            // Kiểm tra slot trùng
            var conflict = await _context.Appointments.AnyAsync(a =>
                a.DoctorId == doctorGuid &&
                a.AppointmentDate.Date == appointmentDate.Date &&
                a.TimeSlot == dto.TimeSlot &&
                a.Status != "cancelled");

            if (conflict)
                return Conflict(new { message = "Giờ khám này đã có người đặt." });

            // Patient.Id == UserId — tìm thông tin bệnh nhân
            var patient = await _context.Patients.FindAsync(patientGuid);
            if (patient == null)
                return NotFound(new { message = "Không tìm thấy hồ sơ bệnh nhân." });

            var appointment = new Appointment
            {
                Id              = Guid.NewGuid(),
                PatientId       = patientGuid,
                DoctorId        = doctorGuid,
                DepartmentId    = dto.DepartmentId ?? "",
                AppointmentDate = appointmentDate,
                TimeSlot        = dto.TimeSlot,
                Status          = "pending",
                PatientName     = patient.FullName,
                Phone           = patient.Phone,
                Notes           = dto.Notes ?? "",
                CreatedAt       = DateTime.UtcNow
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                id      = appointment.Id,
                message = "Đặt lịch hẹn thành công. Vui lòng chờ xác nhận.",
                status  = "pending"
            });
        }

        // ─────────────────────────────────────────
        // PATCH /api/appointments/{id}/status
        // Cập nhật trạng thái (Doctor confirm/complete)
        // ─────────────────────────────────────────
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto dto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
                return NotFound(new { message = "Không tìm thấy lịch hẹn." });

            appointment.Status = dto.Status;
            if (!string.IsNullOrEmpty(dto.Notes))
                appointment.Notes = dto.Notes;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công.", status = dto.Status });
        }

        // ─────────────────────────────────────────
        // PUT /api/appointments/{id}/cancel
        // Hủy lịch hẹn (bệnh nhân tự hủy)
        // ─────────────────────────────────────────
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelByPatient(Guid id, [FromQuery] string userId = "")
        {
            if (string.IsNullOrEmpty(userId))
                userId = Request.Headers["X-User-Id"].FirstOrDefault() ?? "";

            if (!Guid.TryParse(userId, out Guid userGuid))
                return BadRequest(new { message = "userId không hợp lệ." });

            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
                return NotFound(new { message = "Không tìm thấy lịch hẹn." });

            // Kiểm tra lịch hẹn có thuộc về bệnh nhân này không
            // Patient.Id == UserId nên so sánh trực tiếp
            if (appointment.PatientId != userGuid)
                return StatusCode(403, new { message = "Bạn không có quyền hủy lịch hẹn này." });

            if (appointment.Status == "completed" || appointment.Status == "cancelled")
                return BadRequest(new { message = "Không thể hủy lịch hẹn này." });

            // Kiểm tra 2 giờ trước giờ khám
            var appointmentDateTime = appointment.AppointmentDate.Date
                .Add(TimeSpan.Parse(appointment.TimeSlot));
            var hoursUntil = (appointmentDateTime - DateTime.Now).TotalHours;

            if (hoursUntil > 0 && hoursUntil < 2)
                return BadRequest(new { message = "Không thể hủy lịch hẹn trong vòng 2 giờ trước giờ khám." });

            appointment.Status      = "cancelled";
            appointment.CancelledAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Hủy lịch hẹn thành công." });
        }

        // ─────────────────────────────────────────
        // DELETE /api/appointments/{id}
        // Hủy lịch hẹn (Admin / giữ tương thích cũ)
        // ─────────────────────────────────────────
        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelAppointment(Guid id, [FromBody] CancelDto? dto = null)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
                return NotFound(new { message = "Không tìm thấy lịch hẹn." });

            appointment.Status       = "cancelled";
            appointment.CancelledAt  = DateTime.UtcNow;
            appointment.CancelReason = dto?.Reason ?? "";

            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã hủy lịch hẹn." });
        }
    }

    // ─────────────────────────────────────────
    // DTOs
    // ─────────────────────────────────────────
    public class BookAppointmentDto
    {
        public string? UserId      { get; set; }   // mới — Patient.Id == UserId
        public string? PatientId   { get; set; }   // cũ — giữ tương thích
        public string DoctorId     { get; set; } = "";
        public string? DepartmentId { get; set; }
        public string Date         { get; set; } = "";
        public string TimeSlot     { get; set; } = "";
        public string? Notes       { get; set; }
    }

    public class UpdateStatusDto
    {
        public string Status { get; set; } = "";
        public string? Notes { get; set; }
    }

    public class CancelDto
    {
        public string? Reason { get; set; }
    }
}