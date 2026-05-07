import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Calendar, Clock, User, MapPin, XCircle, CheckCircle2 } from "lucide-react";
// API_CALL: Import API functions
import { getPatientAppointments, cancelAppointment } from "../../services/api";

interface PatientAppointmentHistoryProps {
  language: 'en' | 'vn';
}

const translations = {
  en: {
    title: "My Appointments",
    description: "View your appointment history",
    date: "Date",
    time: "Time",
    department: "Department",
    doctor: "Doctor",
    status: "Status",
    actions: "Actions",
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    cancel: "Cancel",
    noAppointments: "You have no appointments",
    confirmCancel: "Are you sure you want to cancel this appointment?",
    cancelSuccess: "Appointment cancelled successfully",
    cannotCancel: "Cannot cancel appointment less than 2 hours before scheduled time"
  },
  vn: {
    title: "Lịch Hẹn Của Tôi",
    description: "Xem lịch sử lịch hẹn",
    date: "Ngày",
    time: "Giờ",
    department: "Khoa",
    doctor: "Bác Sĩ",
    status: "Trạng Thái",
    actions: "Thao Tác",
    pending: "Chờ Xác Nhận",
    confirmed: "Đã Xác Nhận",
    completed: "Hoàn Thành",
    cancelled: "Đã Hủy",
    cancel: "Hủy Lịch",
    noAppointments: "Bạn chưa có lịch hẹn nào",
    confirmCancel: "Bạn có chắc chắn muốn hủy lịch hẹn này?",
    cancelSuccess: "Hủy lịch hẹn thành công",
    cannotCancel: "Không thể hủy lịch hẹn trong vòng 2 giờ trước giờ khám"
  }
};

// Mock appointments
const mockAppointments = {
  en: [
    {
      id: "APT001",
      date: "2026-05-10",
      timeSlot: "09:00",
      department: "Cardiology",
      doctor: "Dr. Nguyen Minh",
      status: "confirmed",
      createdAt: "2026-05-01"
    },
    {
      id: "APT002",
      date: "2026-04-25",
      timeSlot: "14:00",
      department: "General Medicine",
      doctor: "Dr. Tran Lan",
      status: "completed",
      createdAt: "2026-04-20"
    },
    {
      id: "APT003",
      date: "2026-05-15",
      timeSlot: "10:30",
      department: "Neurology",
      doctor: "Dr. Le Hung",
      status: "pending",
      createdAt: "2026-05-05"
    }
  ],
  vn: [
    {
      id: "APT001",
      date: "2026-05-10",
      timeSlot: "09:00",
      department: "Tim Mạch",
      doctor: "BS. Nguyễn Minh",
      status: "confirmed",
      createdAt: "2026-05-01"
    },
    {
      id: "APT002",
      date: "2026-04-25",
      timeSlot: "14:00",
      department: "Đa Khoa",
      doctor: "BS. Trần Lan",
      status: "completed",
      createdAt: "2026-04-20"
    },
    {
      id: "APT003",
      date: "2026-05-15",
      timeSlot: "10:30",
      department: "Thần Kinh",
      doctor: "BS. Lê Hùng",
      status: "pending",
      createdAt: "2026-05-05"
    }
  ]
};

export function PatientAppointmentHistory({ language }: PatientAppointmentHistoryProps) {
  const t = translations[language];
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // API_CALL: Load appointments khi component mount
  useEffect(() => {
    loadAppointments();
  }, []);

  // API_CALL: Function để gọi API lấy lịch hẹn của bệnh nhân
  const loadAppointments = async () => {
    try {
      setLoading(true);

      // Uncomment khi có backend API
      // const response = await getPatientAppointments();
      // setAppointments(response.appointments);

      // Mock - xóa dòng này khi có API
      setAppointments(mockAppointments[language]);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // API_CALL: Hủy lịch hẹn
  const handleCancel = async (appointment: any) => {
    // Check if cancellation is allowed (2 hours before)
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.timeSlot}`);
    const now = new Date();
    const hoursUntil = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil < 2 && hoursUntil > 0) {
      alert(t.cannotCancel);
      return;
    }

    if (confirm(t.confirmCancel)) {
      try {
        setLoading(true);

        // Uncomment khi có backend API
        // await cancelAppointment(appointment.id);

        // Mock - xóa dòng này khi có API
        setAppointments(appointments.map(apt =>
          apt.id === appointment.id ? { ...apt, status: 'cancelled' } : apt
        ));

        alert(t.cancelSuccess);
      } catch (error) {
        console.error('Error cancelling appointment:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string; className?: string }> = {
      pending: { variant: "secondary", label: t.pending },
      confirmed: { variant: "default", label: t.confirmed },
      completed: { variant: "default", label: t.completed, className: "bg-green-500" },
      cancelled: { variant: "destructive", label: t.cancelled }
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <Badge variant={statusInfo.variant} className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const canCancelAppointment = (appointment: any) => {
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return false;
    }
    return true;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t.noAppointments}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.date}</TableHead>
                  <TableHead>{t.time}</TableHead>
                  <TableHead>{t.department}</TableHead>
                  <TableHead>{t.doctor}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(apt.date).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {apt.timeSlot}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{apt.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {apt.doctor}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(apt.status)}</TableCell>
                    <TableCell>
                      {canCancelAppointment(apt) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(apt)}
                          disabled={loading}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          {t.cancel}
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
