using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClinicAPI.Data;

namespace ClinicAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly EMRDbContext _context;

        public DashboardController(EMRDbContext context)
        {
            _context = context;
        }

        // GET /api/dashboard/alerts
        // Trả về danh sách cảnh báo thật từ DB
        [HttpGet("alerts")]
        public async Task<ActionResult<object>> GetAlerts()
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var alerts = new List<object>();

            // 1. Lịch hẹn PENDING quá hạn (ngày < hôm nay mà chưa xử lý)
            var overdueCount = await _context.Appointments
                .Where(a => a.AppointmentDate < today && a.Status == "Pending")
                .CountAsync();

            if (overdueCount > 0)
                alerts.Add(new
                {
                    type = "warning",
                    message_vn = $"{overdueCount} lịch hẹn quá hạn chưa được xử lý",
                    message_en = $"{overdueCount} overdue appointment(s) pending action"
                });

            // 2. Lịch hẹn hôm nay chưa confirm
            var todayPendingCount = await _context.Appointments
                .Where(a => a.AppointmentDate >= today && a.AppointmentDate < tomorrow && a.Status == "Pending")
                .CountAsync();

            if (todayPendingCount > 0)
                alerts.Add(new
                {
                    type = "info",
                    message_vn = $"{todayPendingCount} lịch hẹn hôm nay chưa được xác nhận",
                    message_en = $"{todayPendingCount} appointment(s) today awaiting confirmation"
                });

            // 3. Hồ sơ bệnh án được tạo hôm nay
            var recordsTodayCount = await _context.MedicalRecords
                .Where(r => r.VisitDate >= today && r.VisitDate < tomorrow)
                .CountAsync();

            if (recordsTodayCount > 0)
                alerts.Add(new
                {
                    type = "info",
                    message_vn = $"{recordsTodayCount} hồ sơ bệnh án mới được tạo hôm nay",
                    message_en = $"{recordsTodayCount} new medical record(s) created today"
                });

            // 4. Đơn thuốc được kê hôm nay
            var prescriptionsTodayCount = await _context.Prescriptions
                .Where(p => p.PrescriptionDate >= today && p.PrescriptionDate < tomorrow)
                .CountAsync();

            if (prescriptionsTodayCount > 0)
                alerts.Add(new
                {
                    type = "info",
                    message_vn = $"{prescriptionsTodayCount} đơn thuốc mới được kê hôm nay",
                    message_en = $"{prescriptionsTodayCount} new prescription(s) issued today"
                });

            // Nếu không có gì thì trả về thông báo hệ thống ổn
            if (alerts.Count == 0)
                alerts.Add(new
                {
                    type = "success",
                    message_vn = "Hệ thống hoạt động bình thường, không có cảnh báo",
                    message_en = "System running normally, no alerts"
                });

            return Ok(alerts);
        }
    }
}