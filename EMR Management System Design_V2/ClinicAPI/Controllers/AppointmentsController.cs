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
        // ─────────────────────────────────────────
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAppointments()
        {
            var appointments = await _context.Appointments
                .AsNoTracking()
                .OrderByDescending(a => a.AppointmentDate)
                .Select(a => new
                {
                    id              = a.Id,
                    patientId       = a.PatientId,
                    patientName     = a.PatientName ?? "",
                    patientPhone    = a.Phone ?? "",
                    doctorId        = a.DoctorId,
                    departmentId    = a.DepartmentId,
                    department      = MapDeptToVn(a.DepartmentId),
                    appointmentDate = a.AppointmentDate.ToString("yyyy-MM-dd"),
                    timeSlot        = a.TimeSlot,
                    status          = a.Status.ToLower(),
                    notes           = a.Notes ?? "",
                    createdAt       = a.CreatedAt.ToString("yyyy-MM-dd")
                })
                .ToListAsync();

            return Ok(appointments);
        }

        // ─────────────────────────────────────────
        // GET /api/appointments/today
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

        // ─────────────────────────────────────────
        // GET /api/appointments/my  (Patient)
        // ─────────────────────────────────────────
        [HttpGet("my")]
        public async Task<ActionResult<object>> GetMyAppointments([FromQuery] string userId = "")
        {
            if (string.IsNullOrEmpty(userId))
                userId = Request.Headers["X-User-Id"].FirstOrDefault() ?? "";

            if (!Guid.TryParse(userId, out Guid userGuid))
                return BadRequest(new { message = "userId không hợp lệ." });

var patient = await _context.Patients
    .AsNoTracking()
    .FirstOrDefaultAsync(p => p.UserId == userGuid);

if (patient == null)
    return Ok(new List<object>());

            var appointments = await _context.Appointments
                .AsNoTracking()
                .Where(a => a.PatientId == patient.Id)
                .OrderByDescending(a => a.AppointmentDate)
                .Select(a => new
                {
                    id         = a.Id,
                    date       = a.AppointmentDate.ToString("yyyy-MM-dd"),
                    timeSlot   = a.TimeSlot,
                    department = MapDeptToVn(a.DepartmentId),
                    doctor     = _context.Users
                                    .Where(u => u.Id == a.DoctorId)
                                    .Select(u => "BS. " + u.FullName)
                                    .FirstOrDefault() ?? "",
                    status    = a.Status.ToLower(),
                    notes     = a.Notes ?? "",
                    createdAt = a.CreatedAt.ToString("yyyy-MM-dd")
                })
                .ToListAsync();

            return Ok(appointments);
        }

        [HttpGet("patient")]
        public async Task<ActionResult<object>> GetPatientAppointments([FromQuery] string userId = "")
            => await GetMyAppointments(userId);

        // ─────────────────────────────────────────
        // GET /api/appointments/departments
        // Trả về danh sách khoa từ Users.Department
        // Department trong DB = "cardiology", "general"...
        // ─────────────────────────────────────────
        [HttpGet("departments")]
        public async Task<ActionResult<IEnumerable<object>>> GetDepartments()
        {
            var deptKeys = await _context.Users
                .AsNoTracking()
                .Where(u => u.Role == "doctor"
                         && u.Department != null
                         && u.Department != "")
                .Select(u => u.Department!)
                .Distinct()
                .ToListAsync();

            // Map key → { id, name (VN), nameEn (EN) }
            var result = deptKeys.Select(key => new
            {
                id     = key,
                name   = MapDeptToVn(key),    // hiển thị tiếng Việt
                nameEn = MapDeptToEn(key)      // hiển thị tiếng Anh
            }).OrderBy(d => d.nameEn).ToList();

            if (!result.Any())
            {
                return Ok(new[]
                {
                    new { id = "cardiology",  name = "Tim Mạch",    nameEn = "Cardiology" },
                    new { id = "general",     name = "Đa Khoa",     nameEn = "General Medicine" },
                    new { id = "neurology",   name = "Thần Kinh",   nameEn = "Neurology" },
                    new { id = "orthopedics", name = "Chỉnh Hình",  nameEn = "Orthopedics" },
                    new { id = "pediatrics",  name = "Nhi Khoa",    nameEn = "Pediatrics" },
                });
            }

            return Ok(result);
        }

        // ─────────────────────────────────────────
        // GET /api/appointments/doctors?departmentId=cardiology
        // departmentId = key trong DB ("cardiology", "general"...)
        // ─────────────────────────────────────────
        [HttpGet("doctors")]
        public async Task<ActionResult<IEnumerable<object>>> GetDoctorsByDepartment(
            [FromQuery] string departmentId = "")
        {
            var query = _context.Users
                .AsNoTracking()
                .Where(u => u.Role == "doctor" && u.Status == "active");

            if (!string.IsNullOrEmpty(departmentId))
                query = query.Where(u => u.Department == departmentId);

            var doctors = await query
                .Select(u => new
                {
                    id             = u.Id,
                    fullName       = u.FullName,
                    specialization = MapDeptToVn(u.Department ?? "")
                })
                .ToListAsync();

            return Ok(doctors);
        }

        // ─────────────────────────────────────────
        // GET /api/appointments/available-slots
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

            return Ok(allSlots.Where(s => !bookedSlots.Contains(s)).ToList());
        }

        // ─────────────────────────────────────────
        // GET /api/appointments/check-availability
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
        // POST /api/appointments  (Patient đặt lịch)
        // ─────────────────────────────────────────
        [HttpPost]
        public async Task<ActionResult<object>> BookAppointment([FromBody] BookAppointmentDto dto)
        {
            var rawId = !string.IsNullOrEmpty(dto.UserId) ? dto.UserId : dto.PatientId;

            if (!Guid.TryParse(rawId, out Guid patientGuid))
                return BadRequest(new { message = "userId/patientId không hợp lệ." });

            if (!Guid.TryParse(dto.DoctorId, out Guid doctorGuid))
                return BadRequest(new { message = "doctorId không hợp lệ." });

            if (!DateTime.TryParse(dto.Date, out DateTime appointmentDate))
                return BadRequest(new { message = "date không hợp lệ." });

            appointmentDate = DateTime.SpecifyKind(appointmentDate.Date, DateTimeKind.Utc);

            if (appointmentDate.Date < DateTime.UtcNow.Date)
                return BadRequest(new { message = "Không thể đặt lịch cho ngày trong quá khứ." });

            var conflict = await _context.Appointments.AnyAsync(a =>
                a.DoctorId == doctorGuid &&
                a.AppointmentDate.Date == appointmentDate.Date &&
                a.TimeSlot == dto.TimeSlot &&
                a.Status != "cancelled");

            if (conflict)
                return Conflict(new { message = "Giờ khám này đã có người đặt." });

                // Tìm theo UserId trước, nếu không có thì thử Patient.Id
                var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == patientGuid)
                        ?? await _context.Patients.FindAsync(patientGuid);

                if (patient == null)
                    return NotFound(new { message = "Không tìm thấy hồ sơ bệnh nhân." });

                var appointment = new Appointment
                {
                    
                Id              = Guid.NewGuid(),
                PatientId       = patient.Id,
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
        // PATCH + PUT /api/appointments/{id}/status
        // ─────────────────────────────────────────
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto dto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
                return NotFound(new { message = "Không tìm thấy lịch hẹn." });

            appointment.Status = dto.Status.ToLower();
            if (!string.IsNullOrEmpty(dto.Notes))
                appointment.Notes = dto.Notes;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công.", status = appointment.Status });
        }

            [HttpPut("{id}/status")]
            public async Task<IActionResult> UpdateStatusPut(Guid id, [FromBody] object body)
            {
                var dto = body?.ToString()?.Trim('"') is string s && s.Length > 0
                    ? new UpdateStatusDto { Status = s }
                    : System.Text.Json.JsonSerializer.Deserialize<UpdateStatusDto>(body!.ToString()!);
                return await UpdateStatus(id, dto!);
            }

        // ─────────────────────────────────────────
        // PUT /api/appointments/{id}/cancel  (Patient hủy)
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

                // Tìm Patient từ UserId
            var patient = await _context.Patients
                .FirstOrDefaultAsync(p => p.UserId == userGuid);

            if (patient == null || appointment.PatientId != patient.Id)
                return StatusCode(403, new { message = "Bạn không có quyền hủy lịch hẹn này." });
            if (appointment.Status == "completed" || appointment.Status == "cancelled")
                return BadRequest(new { message = "Không thể hủy lịch hẹn này." });

            var appointmentDateTime = appointment.AppointmentDate.Date
                .Add(TimeSpan.Parse(appointment.TimeSlot));
            var hoursUntil = (appointmentDateTime - DateTime.Now).TotalHours;

            if (hoursUntil > 0 && hoursUntil < 2)
                return BadRequest(new { message = "Không thể hủy trong vòng 2 giờ trước giờ khám." });

            appointment.Status      = "cancelled";
            appointment.CancelledAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Hủy lịch hẹn thành công." });
        }

        // ─────────────────────────────────────────
        // DELETE /api/appointments/{id}  (Admin)
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

        // ─────────────────────────────────────────
        // Helpers — DB lưu key tiếng Anh thường
        // cardiology | general | neurology | orthopedics | pediatrics
        // ─────────────────────────────────────────
        private static string MapDeptToVn(string key) => key switch
        {
            "cardiology"  => "Tim Mạch",
            "general"     => "Đa Khoa",
            "neurology"   => "Thần Kinh",
            "orthopedics" => "Chỉnh Hình",
            "pediatrics"  => "Nhi Khoa",
            "dermatology" => "Da Liễu",
            "ophthalmology" => "Mắt",
            "ent"         => "Tai Mũi Họng",
            _             => key
        };

        private static string MapDeptToEn(string key) => key switch
        {
            "cardiology"  => "Cardiology",
            "general"     => "General Medicine",
            "neurology"   => "Neurology",
            "orthopedics" => "Orthopedics",
            "pediatrics"  => "Pediatrics",
            "dermatology" => "Dermatology",
            "ophthalmology" => "Ophthalmology",
            "ent"         => "ENT",
            _             => key
        };
    }

    // ─────────────────────────────────────────
    // DTOs
    // ─────────────────────────────────────────
    public class BookAppointmentDto
    {
        public string? UserId       { get; set; }
        public string? PatientId    { get; set; }
        public string  DoctorId     { get; set; } = "";
        public string? DepartmentId { get; set; }
        public string  Date         { get; set; } = "";
        public string  TimeSlot     { get; set; } = "";
        public string? Notes        { get; set; }
    }

    public class UpdateStatusDto
    {
        public string  Status { get; set; } = "";
        public string? Notes  { get; set; }
    }

    public class CancelDto
    {
        public string? Reason { get; set; }
    }
}