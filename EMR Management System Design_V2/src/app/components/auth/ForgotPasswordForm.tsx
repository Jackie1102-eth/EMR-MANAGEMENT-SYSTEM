import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { KeyRound, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import {
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  resetPassword,
} from "../../services/api";

interface ForgotPasswordFormProps {
  language: "en" | "vn";
  onBackToLogin: () => void;
}

const translations = {
  en: {
    title: "Forgot Password",
    subtitle: "Reset your password",
    emailOrPhone: "Email or Phone Number",
    sendOtp: "Send OTP",
    sending: "Sending...",
    enterOtp: "Enter OTP Code",
    otpSent: "OTP code has been sent to your email / phone",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    resetPassword: "Reset Password",
    resetting: "Resetting...",
    backToLogin: "Back to login",
    emailRequired: "Email or phone number is required",
    passwordMinLength: "Password must be at least 8 characters",
    passwordMismatch: "Passwords do not match",
    invalidOtp: "Invalid OTP code. Please try again.",
    verifying: "Verifying...",
    verify: "Verify OTP",
    resendOtp: "Resend OTP",
    success: "Password reset successful! Redirecting to login...",
    otpValidFor: "Valid for 5 minutes",
  },
  vn: {
    title: "Quên mật khẩu",
    subtitle: "Đặt lại mật khẩu của bạn",
    emailOrPhone: "Email hoặc Số điện thoại",
    sendOtp: "Gửi OTP",
    sending: "Đang gửi...",
    enterOtp: "Nhập mã OTP",
    otpSent: "Mã OTP đã được gửi đến email / số điện thoại của bạn",
    newPassword: "Mật khẩu mới",
    confirmPassword: "Xác nhận mật khẩu mới",
    resetPassword: "Đặt lại mật khẩu",
    resetting: "Đang đặt lại...",
    backToLogin: "Quay lại đăng nhập",
    emailRequired: "Email hoặc số điện thoại là bắt buộc",
    passwordMinLength: "Mật khẩu phải có ít nhất 8 ký tự",
    passwordMismatch: "Mật khẩu không khớp",
    invalidOtp: "Mã OTP không đúng. Vui lòng thử lại.",
    verifying: "Đang xác thực...",
    verify: "Xác thực OTP",
    resendOtp: "Gửi lại OTP",
    success: "Đặt lại mật khẩu thành công! Đang chuyển đến đăng nhập...",
    otpValidFor: "Có hiệu lực 5 phút",
  },
};

export function ForgotPasswordForm({ language, onBackToLogin }: ForgotPasswordFormProps) {
  const t = translations[language];

  const [step, setStep] = useState<"email" | "otp" | "password" | "success">("email");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Bước 1: Gửi OTP ──────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!emailOrPhone.trim()) {
      setError(t.emailRequired);
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordSendOtp(emailOrPhone.trim());
      setStep("otp");
    } catch (err: any) {
      setError(err?.message ?? "Không thể gửi OTP. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // ── Gửi lại OTP ───────────────────────────────────────────────
  const handleResendOtp = async () => {
    setError("");
    setOtp("");
    setLoading(true);
    try {
      await forgotPasswordSendOtp(emailOrPhone.trim());
    } catch (err: any) {
      setError(err?.message ?? "Không thể gửi lại OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ── Bước 2: Xác thực OTP ─────────────────────────────────────
  const handleVerifyOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await forgotPasswordVerifyOtp(emailOrPhone.trim(), otp);
      // Backend trả về resetToken để dùng ở bước 3
      setResetToken(result.resetToken ?? "");
      setStep("password");
    } catch (err: any) {
      setError(err?.message ?? t.invalidOtp);
    } finally {
      setLoading(false);
    }
  };

  // ── Bước 3: Đặt mật khẩu mới ─────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError(t.passwordMinLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      setStep("success");
      setTimeout(() => onBackToLogin(), 2000);
    } catch (err: any) {
      setError(err?.message ?? "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success ───────────────────────────────────────────────────
  if (step === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">{t.success}</h3>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Bước 3: Form đặt mật khẩu mới ────────────────────────────
  if (step === "password") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t.newPassword}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.resetting}
                </>
              ) : (
                t.resetPassword
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

  // ── Bước 2: Form nhập OTP ─────────────────────────────────────
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

  // ── Bước 1: Form nhập email/phone ─────────────────────────────
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendOtp} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="emailOrPhone">{t.emailOrPhone}</Label>
            <Input
              id="emailOrPhone"
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="email@example.com"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.sending}
              </>
            ) : (
              t.sendOtp
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