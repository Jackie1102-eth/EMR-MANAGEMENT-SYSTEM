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

        // OTP store tạm thời (in-memory, đủ dùng khi chưa có Redis)
        // Key: "register:email" hoặc "forgot:email" → (otp, expiry)
        private static readonly Dictionary<string, (string Otp, DateTime Expiry)> _otpStore = new();

        public AuthController(EMRDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // ==================== LOGIN ====================

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null) return Unauthorized(new { message = "Email không tồn tại" });

            if (user.Status == "locked")
                return StatusCode(403, new { message = "Tài khoản đã bị Quản trị viên khóa vĩnh viễn." });

            if (user.LockedUntil > DateTime.Now)
                return BadRequest(new { message = $"Tài khoản bị khóa đến {user.LockedUntil}" });

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

            user.FailedLoginAttempts = 0;
            user.LockedUntil = null;
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            return Ok(new
            {
                token,
                user = new
                {
                    id = user.Id,
                    fullName = user.FullName,
                    role = user.Role
                }
            });
        }

        // ==================== ĐĂNG KÝ ====================

        // Bước 1: Frontend gửi thông tin → backend lưu OTP vào _otpStore
        // (Email thật đã được EmailJS gửi từ frontend rồi, backend chỉ cần lưu OTP để xác thực)
        [HttpPost("register/save-otp")]
        public IActionResult RegisterSaveOtp([FromBody] RegisterOtpRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Otp))
                return BadRequest(new { message = "Email và OTP là bắt buộc." });

            // Lưu OTP vào store, hiệu lực 5 phút
            _otpStore[$"register:{request.Email}"] = (request.Otp, DateTime.Now.AddMinutes(5));

            return Ok(new { message = "OTP đã được lưu." });
        }

        // Bước 2: Frontend gửi OTP người dùng nhập → backend xác thực và tạo tài khoản
        [HttpPost("register/verify-otp")]
        public async Task<IActionResult> RegisterVerifyOtp([FromBody] RegisterVerifyRequest request)
        {
            var key = $"register:{request.Email}";

            // Kiểm tra OTP
            if (!_otpStore.TryGetValue(key, out var record))
                return BadRequest(new { message = "OTP không tồn tại hoặc đã hết hạn." });

            if (DateTime.Now > record.Expiry)
            {
                _otpStore.Remove(key);
                return BadRequest(new { message = "OTP đã hết hạn. Vui lòng thử lại." });
            }

            if (record.Otp != request.Otp)
                return BadRequest(new { message = "Mã OTP không đúng." });

            // Kiểm tra email/CCCD đã tồn tại chưa
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { message = "Email này đã được đăng ký." });

            if (await _context.Users.AnyAsync(u => u.IDCard == request.IdNumber))
                return BadRequest(new { message = "Số CCCD này đã được đăng ký." });

            // Tạo user mới
            var newUser = new User
            {
                FullName = request.FullName,
                IDCard   = request.IdNumber,
                Email    = request.Email,
                Phone    = request.Phone,
                // DateOfBirth và Gender — thêm vào model nếu chưa có
                PasswordHash         = request.Password, // giữ nguyên như login hiện tại
                Role                 = "patient",
                Status               = "active",
                FailedLoginAttempts  = 0,
                CreatedAt            = DateTime.Now,
                UpdatedAt            = DateTime.Now,
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            _otpStore.Remove(key);

            return Ok(new { message = "Đăng ký thành công!" });
        }

        // ==================== QUÊN MẬT KHẨU ====================

        // Bước 1: Lưu OTP quên mật khẩu (email đã được EmailJS gửi từ frontend)
        [HttpPost("forgot-password/save-otp")]
        public IActionResult ForgotPasswordSaveOtp([FromBody] RegisterOtpRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Otp))
                return BadRequest(new { message = "Email và OTP là bắt buộc." });

            _otpStore[$"forgot:{request.Email}"] = (request.Otp, DateTime.Now.AddMinutes(5));

            return Ok(new { message = "OTP đã được lưu." });
        }

        // Bước 2: Xác thực OTP → trả về resetToken
        [HttpPost("forgot-password/verify-otp")]
        public IActionResult ForgotPasswordVerifyOtp([FromBody] VerifyOtpRequest request)
        {
            var key = $"forgot:{request.EmailOrPhone}";

            if (!_otpStore.TryGetValue(key, out var record))
                return BadRequest(new { message = "OTP không tồn tại hoặc đã hết hạn." });

            if (DateTime.Now > record.Expiry)
            {
                _otpStore.Remove(key);
                return BadRequest(new { message = "OTP đã hết hạn. Vui lòng thử lại." });
            }

            if (record.Otp != request.Otp)
                return BadRequest(new { message = "Mã OTP không đúng." });

            _otpStore.Remove(key);

            // Tạo resetToken đơn giản
            var resetToken = Convert.ToBase64String(Guid.NewGuid().ToByteArray());
            _otpStore[$"reset:{resetToken}"] = (request.EmailOrPhone, DateTime.Now.AddMinutes(10));

            return Ok(new { resetToken });
        }

        // Bước 3: Đặt mật khẩu mới
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var key = $"reset:{request.ResetToken}";

            if (!_otpStore.TryGetValue(key, out var record))
                return BadRequest(new { message = "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." });

            if (DateTime.Now > record.Expiry)
            {
                _otpStore.Remove(key);
                return BadRequest(new { message = "Phiên đã hết hạn. Vui lòng thực hiện lại." });
            }

            var emailOrPhone = record.Otp; // lúc này Otp field lưu email/phone
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email == emailOrPhone || u.Phone == emailOrPhone);

            if (user == null)
                return NotFound(new { message = "Không tìm thấy tài khoản." });

            user.PasswordHash = request.NewPassword;
            user.UpdatedAt    = DateTime.Now;
            await _context.SaveChangesAsync();

            _otpStore.Remove(key);

            return Ok(new { message = "Đặt lại mật khẩu thành công!" });
        }

        // ==================== JWT ====================

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var claims = new[]
            {
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

    // ==================== REQUEST MODELS ====================

    public class LoginRequest
    {
        public string Email    { get; set; } = "";
        public string Password { get; set; } = "";
    }

    public class RegisterOtpRequest
    {
        public string Email { get; set; } = "";
        public string Otp   { get; set; } = "";
    }

    public class RegisterVerifyRequest
    {
        public string FullName  { get; set; } = "";
        public string IdNumber  { get; set; } = "";
        public string Email     { get; set; } = "";
        public string Phone     { get; set; } = "";
        public string Password  { get; set; } = "";
        public string Otp       { get; set; } = "";
    }

    public class VerifyOtpRequest
    {
        public string EmailOrPhone { get; set; } = "";
        public string Otp          { get; set; } = "";
    }

    public class ResetPasswordRequest
    {
        public string ResetToken   { get; set; } = "";
        public string NewPassword  { get; set; } = "";
    }
}