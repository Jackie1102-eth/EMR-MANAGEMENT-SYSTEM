import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { KeyRound, AlertCircle, CheckCircle2 } from "lucide-react";

interface ForgotPasswordFormProps {
  language: 'en' | 'vn';
  onBackToLogin: () => void;
}

const translations = {
  en: {
    title: "Forgot Password",
    subtitle: "Reset your password",
    email: "Email or Phone Number",
    sendOtp: "Send OTP",
    enterOtp: "Enter OTP Code",
    otpSent: "OTP code has been sent",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    resetPassword: "Reset Password",
    backToLogin: "Back to login",
    emailRequired: "Email or phone number is required",
    passwordMinLength: "Password must be at least 8 characters",
    passwordMismatch: "Passwords do not match",
    invalidOtp: "Invalid OTP code",
    success: "Password reset successful! Redirecting to login...",
    resendOtp: "Resend OTP"
  },
  vn: {
    title: "Quên mật khẩu",
    subtitle: "Đặt lại mật khẩu của bạn",
    email: "Email hoặc Số điện thoại",
    sendOtp: "Gửi OTP",
    enterOtp: "Nhập mã OTP",
    otpSent: "Mã OTP đã được gửi",
    newPassword: "Mật khẩu mới",
    confirmPassword: "Xác nhận mật khẩu mới",
    resetPassword: "Đặt lại mật khẩu",
    backToLogin: "Quay lại đăng nhập",
    emailRequired: "Email hoặc số điện thoại là bắt buộc",
    passwordMinLength: "Mật khẩu phải có ít nhất 8 ký tự",
    passwordMismatch: "Mật khẩu không khớp",
    invalidOtp: "Mã OTP không đúng",
    success: "Đặt lại mật khẩu thành công! Đang chuyển đến đăng nhập...",
    resendOtp: "Gửi lại OTP"
  }
};

export function ForgotPasswordForm({ language, onBackToLogin }: ForgotPasswordFormProps) {
  const t = translations[language];
  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'success'>('email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError(t.emailRequired);
      return;
    }

    // Mock send OTP
    setStep('otp');
  };

  const handleVerifyOtp = () => {
    setError("");

    if (otp === "123456") {
      setStep('password');
    } else {
      setError(t.invalidOtp);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
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

    setStep('success');
    setTimeout(() => {
      onBackToLogin();
    }, 2000);
  };

  if (step === 'success') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{t.success}</h3>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'password') {
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full">
              {t.resetPassword}
            </Button>

            <Button type="button" variant="ghost" onClick={onBackToLogin} className="w-full">
              {t.backToLogin}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === 'otp') {
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
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="text-center text-2xl tracking-widest"
            />
          </div>

          <Button onClick={handleVerifyOtp} className="w-full" disabled={otp.length !== 6}>
            {language === 'en' ? 'Verify' : 'Xác thực'}
          </Button>

          <Button variant="outline" onClick={() => setStep('email')} className="w-full">
            {t.resendOtp}
          </Button>

          <Button variant="ghost" onClick={onBackToLogin} className="w-full">
            {t.backToLogin}
          </Button>
        </CardContent>
      </Card>
    );
  }

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
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          <Button type="submit" className="w-full">
            {t.sendOtp}
          </Button>

          <Button type="button" variant="ghost" onClick={onBackToLogin} className="w-full">
            {t.backToLogin}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
