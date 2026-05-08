using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ClinicAPI.Models; // Thay bằng namespace của bạn
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

        // 2. Thêm người dùng mới với ID là Guid
        [HttpPost]
        public async Task<ActionResult<User>> PostUser(User user)
        {
            // Tự động tạo mã Guid mới cho User
            user.Id = Guid.NewGuid(); 
            user.CreatedAt = DateTime.Now;

            // Nếu Status hoặc Role bị trống thì gán mặc định
            if (string.IsNullOrEmpty(user.Status)) user.Status = "Active";
            if (string.IsNullOrEmpty(user.Role)) user.Role = "Doctor";

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(user);
        }
// Đường dẫn sẽ là: PUT /api/users/{id}/toggle-lock
 [HttpPut("{id}/toggle-lock")]
public async Task<IActionResult> ToggleLock(Guid id)
{
    var user = await _context.Users.FindAsync(id);
    if (user == null) return NotFound();

    if (user.Status == "active") 
    {
        // Nếu đang hoạt động thì Khóa lại
        user.Status = "locked";
    }
    else 
    {
        // Nếu đang bị khóa thì Mở ra và RESET toàn bộ hình phạt tự động
        user.Status = "active";
        user.FailedLoginAttempts = 0; // Reset số lần nhập sai
        user.LockedUntil = null;      // Xóa thời gian chờ 15 phút
    }

    user.UpdatedAt = DateTime.Now;
    await _context.SaveChangesAsync();
    
    return Ok(new { status = user.Status });
}
[HttpPut("{id}")]
public async Task<IActionResult> UpdateUser(Guid id, [FromBody] User updatedUser)
{
    var user = await _context.Users.FindAsync(id);
    if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

    // Cập nhật các trường thông tin - Lưu ý viết đúng hoa thường của thuộc tính
    user.FullName = updatedUser.FullName;
    user.Email = updatedUser.Email;
    user.IDCard = updatedUser.IDCard; // Kiểm tra xem trong Model là IdCard hay IDCard
    user.Phone = updatedUser.Phone;
    user.Role = updatedUser.Role;
    user.Status = updatedUser.Status;
    user.UpdatedAt = DateTime.Now;

    await _context.SaveChangesAsync(); // Dòng này cực kỳ quan trọng để lưu vào SQL
    return Ok(user);
}
// Đường dẫn: DELETE /api/users/{id}
            [HttpDelete("{id}")]
            public async Task<IActionResult> DeleteUser(Guid id)
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null) return NotFound();

                _context.Users.Remove(user);
                
                // THIẾU DÒNG NÀY LÀ REFRESH SẼ BỊ HIỆN LẠI
                await _context.SaveChangesAsync(); 

                return Ok(new { message = "Xóa thành công" });
            }
            
    }
}