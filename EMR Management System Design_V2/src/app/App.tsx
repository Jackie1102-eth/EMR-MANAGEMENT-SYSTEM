import { useState } from "react";
import { useState as useStateReact } from "react";
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { ForgotPasswordForm } from "./components/auth/ForgotPasswordForm";
import { Dashboard } from "./components/Dashboard";
import { AISymptomChecker } from "./components/AISymptomChecker";
import { PatientRecords } from "./components/PatientRecords";
import { UserManagement } from "./components/admin/UserManagement";
import { MedicalRecordForm } from "./components/medical/MedicalRecordForm";
import { PrescriptionManagement } from "./components/medical/PrescriptionManagement";
import { AppointmentBooking } from "./components/appointments/AppointmentBooking";
import { DoctorAppointments } from "./components/doctor/DoctorAppointments";
import { PatientProfile } from "./components/patient/PatientProfile";
import { PatientAppointmentHistory } from "./components/patient/PatientAppointmentHistory";
import { PaymentSystem } from "./components/payment/PaymentSystem";
import { MedicalChatbot } from "./components/chatbot/MedicalChatbot";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import axios from 'axios';
// Thêm dòng này để kết nối với file api.ts
import { login } from './services/api';
import {
  LayoutDashboard,
  Brain,
  FileText,
  Settings,
  Languages,
  Menu,
  X,
  Users,
  Stethoscope,
  Pill,
  Calendar,
  CreditCard,
  MessageCircle,
  LogOut,
  BarChart3,
  UserCircle
} from "lucide-react";

type Language = 'en' | 'vn';
type UserRole = 'admin' | 'doctor' | 'patient' | null;
type AuthView = 'login' | 'register' | 'forgot-password';

const translations = {
  en: {
    appTitle: "EMR System",
    appSubtitle: "AI-Powered Healthcare Management",
    dashboard: "Dashboard",
    aiScreening: "AI Screening",
    patientRecords: "Patient Records",
    userManagement: "User Management",
    medicalRecords: "Medical Records",
    prescriptions: "Prescriptions",
    appointments: "Appointments",
    myAppointments: "My Appointments",
    payment: "Payment & Insurance",
    chatbot: "Medical Assistant",
    reports: "Reports",
    settings: "Settings",
    myProfile: "My Profile",
    logout: "Logout",
    loggedInAs: "Logged in as",
    admin: "Administrator",
    doctor: "Doctor",
    patient: "Patient",
    settingsTitle: "System Settings",
    languagePreference: "Language Preference",
    english: "English",
    vietnamese: "Vietnamese"
  },
  vn: {
    appTitle: "Hệ Thống EMR",
    appSubtitle: "Quản Lý Y Tế Tích Hợp AI",
    dashboard: "Tổng Quan",
    aiScreening: "Sàng Lọc AI",
    patientRecords: "Hồ Sơ Bệnh Nhân",
    userManagement: "Quản Lý Người Dùng",
    medicalRecords: "Bệnh Án Điện Tử",
    prescriptions: "Đơn Thuốc",
    appointments: "Lịch Khám",
    myAppointments: "Lịch Hẹn Của Tôi",
    payment: "Thanh Toán & BHYT",
    chatbot: "Trợ Lý Y Tế",
    reports: "Báo Cáo",
    settings: "Cài Đặt",
    myProfile: "Hồ Sơ Cá Nhân",
    logout: "Đăng Xuất",
    loggedInAs: "Đăng nhập với",
    admin: "Quản Trị Viên",
    doctor: "Bác Sĩ",
    patient: "Bệnh Nhân",
    settingsTitle: "Cài Đặt Hệ Thống",
    languagePreference: "Ngôn Ngữ Hiển Thị",
    english: "Tiếng Anh",
    vietnamese: "Tiếng Việt"
  }
};

// Navigation items per role
const getNavigationItems = (role: UserRole, t: typeof translations.en) => {
  const baseItems = {
    admin: [
      { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
      { id: 'user-management', label: t.userManagement, icon: Users },
      { id: 'patient-records', label: t.patientRecords, icon: FileText },
      { id: 'reports', label: t.reports, icon: BarChart3 },
      { id: 'settings', label: t.settings, icon: Settings }
    ],
    doctor: [
      { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
      { id: 'appointments', label: t.myAppointments, icon: Calendar },
      { id: 'patient-records', label: t.patientRecords, icon: FileText },
      { id: 'medical-records', label: t.medicalRecords, icon: Stethoscope },
      { id: 'prescriptions', label: t.prescriptions, icon: Pill },
      { id: 'ai-screening', label: t.aiScreening, icon: Brain },
      { id: 'settings', label: t.settings, icon: Settings }
    ],
    patient: [
      { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
      { id: 'my-profile', label: t.myProfile, icon: UserCircle },
      { id: 'appointments', label: t.appointments, icon: Calendar },
      { id: 'payment', label: t.payment, icon: CreditCard },
      { id: 'chatbot', label: t.chatbot, icon: MessageCircle },
      { id: 'settings', label: t.settings, icon: Settings }
    ]
  };

  return role ? baseItems[role] : [];
};

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: "", email: "" });

  const t = translations[language];

// Sửa hàm handleLogin của bạn thành thế này:
const handleLogin = async (email: string, password: string, remember: boolean) => {
  try {
    const response = await login(email, password, remember);

    console.log('Login response:', response); // ← xem backend trả về gì

    // Có thể backend trả response.user.id hoặc response.userId hoặc response.id
    const userId = response.user?.id || response.userId || response.id || '';
    
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('userId', userId); // ← đảm bảo đây là Guid đầy đủ
    localStorage.setItem('userRole', response.user?.role || response.role);

    setUserRole((response.user?.role || response.role) as UserRole);
    setCurrentUser({ 
        name: response.user?.fullName || response.fullName || '', 
        email: email,
    });
    setActiveTab('dashboard');
  } catch (err) {
    console.error('Login failed:', err);
    throw err;
  }
};
const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    setUserRole(null);
    setCurrentUser({ name: "", email: "" });
    setAuthView('login');
};

  const navigationItems = getNavigationItems(userRole, t);

  const [appointmentRefreshKey, setAppointmentRefreshKey] = useState(0);

  const handleAppointmentBooked = () => {
    setAppointmentRefreshKey(prev => prev + 1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard language={language} />;
      case 'ai-screening':
        return <AISymptomChecker language={language} />;
      case 'patient-records':
        return <PatientRecords language={language} />;
      case 'user-management':
        return <UserManagement language={language} />;
      case 'medical-records':
        return <MedicalRecordForm language={language} />;
      case 'prescriptions':
        return <PrescriptionManagement language={language} />;
      case 'appointments':
        // Doctor: xem lịch hẹn bệnh nhân đặt
        if (userRole === 'doctor') {
          return <DoctorAppointments language={language} />;
        }
        // Patient: đặt lịch và xem lịch đã đặt
        if (userRole === 'patient') {
          return (
            <div className="space-y-6">
              <AppointmentBooking language={language} onAppointmentBooked={handleAppointmentBooked} />
              <PatientAppointmentHistory key={appointmentRefreshKey} language={language} />
            </div>
          );
        }
        return <AppointmentBooking language={language} />;
      case 'my-profile':
        return <PatientProfile language={language} />;
      case 'payment':
        return <PaymentSystem language={language} />;
      case 'chatbot':
        return <MedicalChatbot language={language} />;
      case 'reports':
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">{t.reports}</h2>
            <p className="text-muted-foreground">
              {language === 'en'
                ? 'Reports and analytics dashboard coming soon...'
                : 'Báo cáo và phân tích sẽ có sớm...'}
            </p>
          </Card>
        );
      case 'settings':
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-2">{t.settingsTitle}</h2>
            <div className="space-y-4 mt-6">
              <div>
                <label className="text-sm font-medium mb-2 block">{t.languagePreference}</label>
                <div className="flex gap-2">
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    onClick={() => setLanguage('en')}
                  >
                    🇺🇸 {t.english}
                  </Button>
                  <Button
                    variant={language === 'vn' ? 'default' : 'outline'}
                    onClick={() => setLanguage('vn')}
                  >
                    🇻🇳 {t.vietnamese}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  // Auth screen
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {language === 'en' ? 'EMR System' : 'Hệ Thống EMR'}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {language === 'en'
                ? 'AI-Powered Healthcare Management'
                : 'Quản Lý Y Tế Tích Hợp AI'}
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'en' ? 'vn' : 'en')}
              >
                <Languages className="h-4 w-4 mr-2" />
                {language === 'en' ? '🇺🇸 EN' : '🇻🇳 VN'}
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            {authView === 'login' && (
              <LoginForm
                language={language}
                onLogin={handleLogin}
                onForgotPassword={() => setAuthView('forgot-password')}
                onRegister={() => setAuthView('register')}
              />
            )}
            {authView === 'register' && (
              <RegisterForm
                language={language}
                onRegister={() => setAuthView('login')}
                onBackToLogin={() => setAuthView('login')}
              />
            )}
            {authView === 'forgot-password' && (
              <ForgotPasswordForm
                language={language}
                onBackToLogin={() => setAuthView('login')}
              />
            )}
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>{language === 'en' ? 'Demo Accounts:' : 'Tài khoản demo:'}</p>
            <div className="mt-2 space-y-1">
              <p>Admin: admin@emr.com / admin123</p>
              <p>{language === 'en' ? 'Doctor' : 'Bác sĩ'}: doctor@emr.com / doctor123</p>
              <p>{language === 'en' ? 'Patient' : 'Bệnh nhân'}: patient@emr.com / patient123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t.appTitle}</h1>
                <p className="text-xs text-muted-foreground">{t.appSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm font-medium">{currentUser.name}</div>
                  <Badge variant="outline" className="text-xs">
                    {userRole === 'admin' ? t.admin : userRole === 'doctor' ? t.doctor : t.patient}
                  </Badge>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'en' ? 'vn' : 'en')}
                className="hidden sm:flex"
              >
                <Languages className="h-4 w-4 mr-2" />
                {language === 'en' ? '🇺🇸 EN' : '🇻🇳 VN'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t.logout}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="sm:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <Card className="p-4 sticky top-24">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setActiveTab(item.id)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            </Card>
          </aside>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
              <Card className="absolute top-20 left-4 right-4 p-4 bg-white" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 pb-4 border-b">
                  <div className="text-sm font-medium">{currentUser.name}</div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {userRole === 'admin' ? t.admin : userRole === 'doctor' ? t.doctor : t.patient}
                  </Badge>
                </div>
                <nav className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.id}
                        variant={activeTab === item.id ? 'default' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Button>
                    );
                  })}
                  <div className="pt-2 border-t space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setLanguage(language === 'en' ? 'vn' : 'en')}
                    >
                      <Languages className="h-4 w-4 mr-2" />
                      {language === 'en' ? '🇺🇸 English' : '🇻🇳 Tiếng Việt'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t.logout}
                    </Button>
                  </div>
                </nav>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}