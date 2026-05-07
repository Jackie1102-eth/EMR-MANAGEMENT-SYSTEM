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
    }
}