import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Activity, Users, Calendar, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
interface DashboardProps {
  language: 'en' | 'vn';
}

const translations = {
  en: {
    title: "Dashboard Overview",
    patients: "Total Patients",
    appointments: "Today's Appointments",
    records: "Medical Records",
    aiScreenings: "AI Screenings Today",
    recentActivity: "Recent Activity",
    criticalAlerts: "Critical Alerts",
    trends: "Health Trends",
    activities: [

    ],
    alerts: [
      "3 patients require follow-up consultation",
      "2 lab results pending review",
      "1 critical medication interaction detected"
    ]
  },
  vn: {
    title: "Tổng Quan Hệ Thống",
    patients: "Tổng Số Bệnh Nhân",
    appointments: "Lịch Hẹn Hôm Nay",
    records: "Hồ Sơ Bệnh Án",
    aiScreenings: "Sàng Lọc AI Hôm Nay",
    recentActivity: "Hoạt Động Gần Đây",
    criticalAlerts: "Cảnh Báo Quan Trọng",
    trends: "Xu Hướng Sức Khỏe",
    activities: [
    ],
    alerts: [
      "3 bệnh nhân cần tái khám",
      "2 kết quả xét nghiệm đang chờ xem xét",
      "1 tương tác thuốc nghiêm trọng được phát hiện"
    ]
  }
};

export function Dashboard({ language }: DashboardProps) {
  const t = translations[language];
  const [realAlerts, setRealAlerts] = useState<{ type: string; message_vn: string; message_en: string }[]>([]);
  // Khai báo các State bên trong hàm Dashboard
  const [recentPatients, setRecentPatients] = useState<string[]>([]);
  const [realStats, setRealStats] = useState({
    totalPatients: "0",
    appointments: "0",
    records: "0"
  });

// ============================================================
// THAY THẾ toàn bộ khối useEffect trong Dashboard.tsx
// (từ dòng useEffect(() => { ... }, [language]);)
// ============================================================

useEffect(() => {
  const loadDashboardData = async () => {
    const token = localStorage.getItem('authToken'); // ← đúng key
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      // Fetch song song 3 API cùng lúc cho nhanh
const [patientsRes, recordsRes, appointmentsRes, alertsRes] = await Promise.allSettled([
fetch(`${import.meta.env.VITE_API_URL}/patients`, { headers }),
fetch(`${import.meta.env.VITE_API_URL}/medicalrecords`, { headers }),
fetch(`${import.meta.env.VITE_API_URL}/appointments/today`, { headers }),
fetch(`${import.meta.env.VITE_API_URL}/dashboard/alerts`, { headers }),
]);
if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
  const data = await alertsRes.value.json();
  setRealAlerts(data);
}


      // --- Patients ---
      if (patientsRes.status === 'fulfilled' && patientsRes.value.ok) {
        const data = await patientsRes.value.json();
        const names = data.slice(0, 4).map((p: any) =>
          language === 'vn'
            ? `Bệnh nhân mới đăng ký: ${p.fullName}`
            : `New patient registered: ${p.fullName}`
        );
        setRecentPatients(names);
        setRealStats(prev => ({ ...prev, totalPatients: data.length.toString() }));
      }

      // --- Medical Records ---
      if (recordsRes.status === 'fulfilled' && recordsRes.value.ok) {
        const data = await recordsRes.value.json();
        const count = Array.isArray(data) ? data.length : (data.count ?? 0);
        setRealStats(prev => ({ ...prev, records: count.toString() }));
      }

      // --- Today's Appointments ---
      if (appointmentsRes.status === 'fulfilled' && appointmentsRes.value.ok) {
        const data = await appointmentsRes.value.json();
        setRealStats(prev => ({ ...prev, appointments: (data.count ?? 0).toString() }));
      }

    } catch (error) {
      console.error("Lỗi lấy dữ liệu Dashboard:", error);
    }
  };

  loadDashboardData();
}, [language]);// Thêm language để cập nhật câu thông báo khi đổi ngôn ngữ
  // SỬA: Cấu trúc lại mảng stats để dùng dữ liệu thật
const stats = [
  { title: t.patients,     value: realStats.totalPatients, icon: Users,    trend: "+0%", color: "text-blue-600"   },
  { title: t.appointments, value: realStats.appointments,  icon: Calendar, trend: "+0%", color: "text-green-600"  },
  { title: t.records,      value: realStats.records,       icon: FileText, trend: "+0%", color: "text-purple-600" },
  { title: t.aiScreenings, value: "0",                     icon: Activity, trend: "+0%", color: "text-orange-600" },
];





  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t.title}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {stat.trend} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.recentActivity}</CardTitle>
            <CardDescription>Latest updates in the system</CardDescription>
          </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Thay vì dùng t.activities (giả), ta dùng recentPatients (thật từ SQL) */}
                {recentPatients.length > 0 ? (
                  recentPatients.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                      <p className="text-sm">{activity}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Chưa có hoạt động mới từ SQL.</p>
                )}
              </div>
            </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              {t.criticalAlerts}
            </CardTitle>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                {realAlerts.length > 0 ? (
                  realAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-md border border-orange-200">
                      <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                        alert.type === 'warning' ? 'text-red-600' : 
                        alert.type === 'success' ? 'text-green-600' : 'text-orange-600'
                      }`} />
                      <p className="text-sm">{language === 'vn' ? alert.message_vn : alert.message_en}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Đang tải cảnh báo...</p>
                )}

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
