import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Alert, AlertDescription } from "../ui/alert";
import { Lock, Mail, AlertCircle } from "lucide-react";

interface LoginFormProps {
  language: 'en' | 'vn';
  // Dòng 12 — sửa void → Promise<void>
  onLogin: (email: string, password: string, remember: boolean) => Promise<void>;
  onForgotPassword: () => void;
  onRegister: () => void;
}

const translations = {
  en: {
    title: "Login",
    subtitle: "Access your medical records system",
    email: "Email or Phone Number",
    password: "Password",
    rememberMe: "Remember me for 7 days",
    login: "Login",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    register: "Register now",
    emailRequired: "Email or phone number is required",
    passwordRequired: "Password is required",
    invalidCredentials: "Invalid email or password",
    accountLocked: "Account locked due to too many failed attempts. Please try again in 15 minutes.",
    attemptsRemaining: "attempts remaining"
  },
  vn: {
    title: "Đăng nhập",
    subtitle: "Truy cập hệ thống hồ sơ bệnh án",
    email: "Email hoặc Số điện thoại",
    password: "Mật khẩu",
    rememberMe: "Ghi nhớ đăng nhập 7 ngày",
    login: "Đăng nhập",
    forgotPassword: "Quên mật khẩu?",
    noAccount: "Chưa có tài khoản?",
    register: "Đăng ký ngay",
    emailRequired: "Email hoặc số điện thoại là bắt buộc",
    passwordRequired: "Mật khẩu là bắt buộc",
    invalidCredentials: "Email hoặc mật khẩu không đúng",
    accountLocked: "Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.",
    attemptsRemaining: "lần thử còn lại"
  }
};

export function LoginForm({ language, onLogin, onForgotPassword, onRegister }: LoginFormProps) {
  const t = translations[language];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  if (isLocked) { setError(t.accountLocked); return; }
  if (!email)    { setError(t.emailRequired); return; }
  if (!password) { setError(t.passwordRequired); return; }

  try {
    // Delegate hoàn toàn cho App.tsx — backend quyết định đúng/sai
    await onLogin(email, password, remember);
  } catch (err: any) {
    const msg: string = err?.message ?? "";

    // Backend trả "locked" → khóa UI 15 phút
    if (msg.toLowerCase().includes("lock") || msg.toLowerCase().includes("khóa")) {
      setIsLocked(true);
      setError(t.accountLocked);
      setTimeout(() => { setIsLocked(false); setFailedAttempts(0); }, 15 * 60 * 1000);
      return;
    }

    // Sai credentials → tăng counter
    const newFailed = failedAttempts + 1;
    setFailedAttempts(newFailed);
    if (newFailed >= 5) {
      setIsLocked(true);
      setError(t.accountLocked);
      setTimeout(() => { setIsLocked(false); setFailedAttempts(0); }, 15 * 60 * 1000);
    } else {
      setError(msg || `${t.invalidCredentials} (${5 - newFailed} ${t.attemptsRemaining})`);
    }
  }
};

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Lock className="h-5 w-5" />
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

          <div className="space-y-2">
            <Label htmlFor="email">{t.email}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="text"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLocked}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t.password}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLocked}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked as boolean)}
                disabled={isLocked}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer"
              >
                {t.rememberMe}
              </Label>
            </div>
            <Button
              type="button"
              variant="link"
              className="px-0"
              onClick={onForgotPassword}
            >
              {t.forgotPassword}
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={isLocked}>
            {t.login}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">{t.noAccount} </span>
            <Button
              type="button"
              variant="link"
              className="px-0"
              onClick={onRegister}
            >
              {t.register}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
