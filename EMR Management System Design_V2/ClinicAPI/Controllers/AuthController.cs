using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClinicAPI.Data;
using ClinicAPI.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ClinicAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly EMRDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(EMRDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

 [HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
    if (user == null) return Unauthorized(new { message = "Email không tồn tại" });

    if (user.LockedUntil > DateTime.Now)
        return BadRequest(new { message = $"Tài khoản bị khóa đến {user.LockedUntil}" });

    // BỎ HOÀN TOÀN BCRYPT - SO SÁNH TRỰC TIẾP
    if (request.Password != user.PasswordHash) 
    {
        user.FailedLoginAttempts++;
        if (user.FailedLoginAttempts >= 5)
        {
            user.LockedUntil = DateTime.Now.AddMinutes(15);
            await _context.SaveChangesAsync();
            return BadRequest(new { message = "Sai quá 5 lần. Tài khoản bị khóa 15 phút." });
        }
        await _context.SaveChangesAsync();
        return Unauthorized(new { message = "Sai mật khẩu" });
    }

    // Nếu đúng mật khẩu, tiếp tục xử lý...

            user.FailedLoginAttempts = 0;
            user.LockedUntil = null;
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            return Ok(new { token, user = new { user.Id, user.FullName, user.Role } });
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var claims = new[] {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                _configuration["Jwt:Issuer"],
                _configuration["Jwt:Audience"],
                claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class LoginRequest { public string Email { get; set; } = ""; public string Password { get; set; } = ""; }
}