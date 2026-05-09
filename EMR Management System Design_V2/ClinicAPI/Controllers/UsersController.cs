using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ClinicAPI.Models;
using ClinicAPI.Data;

namespace ClinicAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly EMRDbContext _context;

        public UsersController(EMRDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách người dùng
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }

        // 2. Thêm người dùng mới
        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            user.Id        = Guid.NewGuid();
            user.CreatedAt = DateTime.Now;

            if (string.IsNullOrEmpty(user.Status)) user.Status = "Active";
            if (string.IsNullOrEmpty(user.Role))   user.Role   = "Doctor";

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(user);
        }

        // 3. Khóa / Mở khóa tài khoản
        [HttpPut("{id}/toggle-lock")]
        public async Task<IActionResult> ToggleLock(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            if (user.Status == "active")
            {
                user.Status = "locked";
            }
            else
            {
                user.Status              = "active";
                user.FailedLoginAttempts = 0;
                user.LockedUntil         = null;
            }

            user.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { status = user.Status });
        }

        // 4. Cập nhật thông tin người dùng
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] User updatedUser)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            user.FullName  = updatedUser.FullName;
            user.Email     = updatedUser.Email;
            user.IDCard    = updatedUser.IDCard;
            user.Phone     = updatedUser.Phone;
            user.Role      = updatedUser.Role;
            user.Status    = updatedUser.Status;
            user.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return Ok(user);
        }

        // 5. Xóa người dùng
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng." });

            // ✅ Xóa Patient liên kết trước để tránh lỗi FK_Patients_Users
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == id);
            if (patient != null)
                _context.Patients.Remove(patient);

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa thành công." });
        }
    }
}