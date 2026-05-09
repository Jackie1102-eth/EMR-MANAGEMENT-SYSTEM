import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { UserPlus, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { registerSendOtp, registerVerifyOtp } from "../../services/api";

interface RegisterFormProps {
  language: "en" | "vn";
  onRegister: (data: any) => void;
  onBackToLogin: () => void;
}

const translations = {
  en: {
    title: "Register",
    subtitle: "Create your account",
    fullName: "Full Name",
    idNumber: "ID Card Number (CCCD)",
    email: "Email",
    phone: "Phone Number",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    password: "Password",
    confirmPassword: "Confirm Password",
    register: "Register",
    backToLogin: "Back to login",
    sending: "Sending OTP...",
    verifying: "Verifying...",
    otpSent: "OTP code has been sent to your email",
    enterOtp: "Enter OTP Code",
    otpPlaceholder: "Enter 6-digit code",
    verify: "Verify OTP",
    resendOtp: "Resend OTP",
    passwordMinLength: "Password must be at least 8 characters",
    passwordMismatch: "Passwords do not match",
    allFieldsRequired: "All fields are required",
    invalidOtp: "Invalid OTP code",
    registrationSuccess: "Registration successful! Redirecting to login...",
    otpValidFor: "Valid for 5 minutes",
    otpResent: "OTP resent to your email",
  },
  vn: {
    title: "Đăng ký",
    subtitle: "Tạo tài khoản mới",
    fullName: "Họ và tên",
    idNumber: "Số CCCD",
    email: "Email",
    phone: "Số điện thoại",
    dateOfBirth: "Ngày sinh",
    gender: "Giới tính",
    male: "Nam",
    female: "Nữ",
    other: "Khác",
    password: "Mật khẩu",
    confirmPassword: "Xác nhận mật khẩu",
    register: "Đăng ký",
    backToLogin: "Quay lại đăng nhập",
    sending: "Đang gửi OTP...",
    verifying: "Đang xác thực...",
    otpSent: "Mã OTP đã được gửi đến email của bạn",
    enterOtp: "Nhập mã OTP",
    otpPlaceholder: "Nhập mã 6 số",
    verify: "Xác thực OTP",
    resendOtp: "Gửi lại OTP",
    passwordMinLength: "Mật khẩu phải có ít nhất 8 ký tự",
    passwordMismatch: "Mật khẩu không khớp",
    allFieldsRequired: "Vui lòng điền đầy đủ thông tin",
    invalidOtp: "Mã OTP không đúng",
    registrationSuccess: "Đăng ký thành công! Đang chuyển đến đăng nhập...",
    otpValidFor: "Có hiệu lực 5 phút",
    otpResent: "Đã gửi lại mã OTP đến email của bạn",
  },
};

export function RegisterForm({ language, onRegister, onBackToLogin }: RegisterFormProps) {
  const t = translations[language];

  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [formData, setFormData] = useState({
    fullName: "",
    idNumber: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Bước 1: Gửi OTP ──────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { fullName, idNumber, email, phone, dateOfBirth, gender, password, confirmPassword } = formData;

    if (!fullName || !idNumber || !email || !phone || !dateOfBirth || !gender || !password || !confirmPassword) {
      setError(t.allFieldsRequired);
      return;
    }
    if (password.length < 8) {
      setError(t.passwordMinLength);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      await registerSendOtp({ fullName, idNumber, email, phone, dateOfBirth, gender, password });
      setStep("otp");
    } catch (err: any) {
      setError(err?.message ?? "Đã xảy ra lỗi, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // ── Bước 2: Xác thực OTP ─────────────────────────────────────
  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await registerVerifyOtp(formData.email, otp);
      setStep("success");
      setTimeout(() => onRegister(formData), 2000);
    } catch (err: any) {
      setError(err?.message ?? t.invalidOtp);
    } finally {
      setLoading(false);
    }
  };

  // ── Gửi lại OTP ───────────────────────────────────────────────
  const handleResendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const { fullName, idNumber, email, phone, dateOfBirth, gender, password } = formData;
      await registerSendOtp({ fullName, idNumber, email, phone, dateOfBirth, gender, password });
      setOtp("");
      alert(t.otpResent);
    } catch (err: any) {
      setError(err?.message ?? "Không thể gửi lại OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────
  if (step === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">{t.registrationSuccess}</h3>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── OTP screen ───────────────────────────────────────────────
  if (step === "otp") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t.enterOtp}</CardTitle>
          <CardDescription>{t.otpSent}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>{t.otpPlaceholder}</Label>
            <Input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="text-center text-2xl tracking-widest"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground text-center">{t.otpValidFor}</p>
          </div>

          <Button onClick={handleVerifyOtp} className="w-full" disabled={otp.length !== 6 || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.verifying}
              </>
            ) : (
              t.verify
            )}
          </Button>

          <Button variant="outline" onClick={handleResendOtp} className="w-full" disabled={loading}>
            {t.resendOtp}
          </Button>

          <Button variant="ghost" onClick={onBackToLogin} className="w-full" disabled={loading}>
            {t.backToLogin}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Registration form ─────────────────────────────────────────
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t.fullName}</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">{t.idNumber}</Label>
              <Input
                id="idNumber"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t.phone}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">{t.dateOfBirth}</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">{t.gender}</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t.male}</SelectItem>
                  <SelectItem value="female">{t.female}</SelectItem>
                  <SelectItem value="other">{t.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.sending}
              </>
            ) : (
              t.register
            )}
          </Button>

          <Button type="button" variant="ghost" onClick={onBackToLogin} className="w-full" disabled={loading}>
            {t.backToLogin}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}