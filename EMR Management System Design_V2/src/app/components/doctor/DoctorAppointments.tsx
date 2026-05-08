import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar } from "../ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Calendar as CalendarIcon, User, Phone, Clock, CheckCircle2, XCircle, Clock3 } from "lucide-react";
// API_CALL: Import API functions
import { getDoctorAppointments, updateAppointmentStatus } from "../../services/api";

interface DoctorAppointmentsProps {
  language: 'en' | 'vn';
}

const translations = {
  en: {
    title: "My Appointments",
    description: "View and manage patient appointments",
    selectDate: "Select Date",
    appointmentsFor: "Appointments for",
    noAppointments: "No appointments for this date",
    patientName: "Patient Name",
    phone: "Phone",
    time: "Time",
    department: "Department",
    status: "Status",
    actions: "Actions",
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    updateStatus: "Update Status",
    notes: "Notes",
    save: "Save",
    cancel: "Cancel",
    statusUpdated: "Appointment status updated successfully"
  },
  vn: {
    title: "Lịch Hẹn Của Tôi",
    description: "Xem và quản lý lịch hẹn bệnh nhân",
    selectDate: "Chọn Ngày",
    appointmentsFor: "Lịch hẹn ngày",
    noAppointments: "Không có lịch hẹn trong ngày này",
    patientName: "Tên Bệnh Nhân",
    phone: "Điện Thoại",
    time: "Giờ",
    department: "Khoa",
    status: "Trạng Thái",
    actions: "Thao Tác",
    pending: "Chờ Xác Nhận",
    confirmed: "Đã Xác Nhận",
    completed: "Hoàn Thành",
    cancelled: "Đã Hủy",
    updateStatus: "Cập Nhật Trạng Thái",
    notes: "Ghi Chú",
    save: "Lưu",
    cancel: "Hủy",
    statusUpdated: "Cập nhật trạng thái thành công"
  }
};


export function DoctorAppointments({ language }: DoctorAppointmentsProps) {
  const t = translations[language];
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // API_CALL: Load appointments khi chọn ngày
  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  // API_CALL: Function để gọi API lấy lịch hẹn của bác sĩ
const loadAppointments = async () => {
  try {
    setLoading(true);
    // Chuyển ngày được chọn thành định dạng YYYY-MM-DD để khớp với SQL
    const dateStr = selectedDate.toISOString().split('T')[0];

    // Gọi API lấy dữ liệu từ Backend (localhost:5041)
    const response = await fetch(`http://localhost:5041/api/appointments`);
    const data = await response.json();

    // Lọc dữ liệu: Chỉ lấy các lịch hẹn có ngày trùng với ngày đang chọn trên Calendar
    const filtered = data.filter((apt: any) => {
        // Chuyển đổi AppointmentDate từ Backend về dạng YYYY-MM-DD để so sánh
        const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
        return aptDate === dateStr;
    });

    setAppointments(filtered);
  } catch (error) {
    console.error('Error loading appointments:', error);
  } finally {
    setLoading(false);
  }
};

  // API_CALL: Cập nhật trạng thái lịch hẹn
const handleUpdateStatus = async () => {
  if (selectedAppointment && newStatus) {
    try {
      setLoading(true);
      
      // Gọi API PUT để cập nhật trạng thái trong SQL [cite: 21]
      const response = await fetch(`http://localhost:5041/api/appointments/${selectedAppointment.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatus) // Gửi string trạng thái mới xuống [cite: 22]
      });

      if (response.ok) {
        setIsDialogOpen(false);
        // Tải lại danh sách để cập nhật giao diện ngay lập tức
        await loadAppointments();
        setSelectedAppointment(null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  }
};

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: t.pending },
      confirmed: { variant: "default", label: t.confirmed },
      completed: { variant: "default", label: t.completed },
      cancelled: { variant: "destructive", label: t.cancelled }
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <Badge
        variant={statusInfo.variant}
        className={status === 'completed' ? 'bg-green-500' : ''}
      >
        {statusInfo.label}
      </Badge>
    );
  };

  const handleOpenDialog = (appointment: any) => {
    setSelectedAppointment(appointment);
    setNewStatus(appointment.status);
    setNotes(appointment.notes || "");
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-2 block">{t.selectDate}</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </div>

          <div>
            <h3 className="font-semibold mb-4">
              {t.appointmentsFor} {selectedDate.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
            </h3>

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
                      <TableHead>{t.time}</TableHead>
                      <TableHead>{t.patientName}</TableHead>
                      <TableHead>{t.phone}</TableHead>
                      <TableHead>{t.department}</TableHead>
                      <TableHead>{t.status}</TableHead>
                      <TableHead>{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {apt.timeSlot}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {apt.patientName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {apt.patientPhone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{apt.department}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(apt)}
                          >
                            {t.updateStatus}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.updateStatus}</DialogTitle>
            <DialogDescription>
              {selectedAppointment?.patientName} - {selectedAppointment?.timeSlot}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.status}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={newStatus === 'pending' ? 'default' : 'outline'}
                  onClick={() => setNewStatus('pending')}
                >
                  <Clock3 className="h-4 w-4 mr-2" />
                  {t.pending}
                </Button>
                <Button
                  variant={newStatus === 'confirmed' ? 'default' : 'outline'}
                  onClick={() => setNewStatus('confirmed')}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t.confirmed}
                </Button>
                <Button
                  variant={newStatus === 'completed' ? 'default' : 'outline'}
                  onClick={() => setNewStatus('completed')}
                  className={newStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {t.completed}
                </Button>
                <Button
                  variant={newStatus === 'cancelled' ? 'destructive' : 'outline'}
                  onClick={() => setNewStatus('cancelled')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {t.cancelled}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t.notes}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={language === 'en' ? 'Add notes...' : 'Thêm ghi chú...'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleUpdateStatus} disabled={loading}>
              {loading ? (language === 'en' ? 'Saving...' : 'Đang lưu...') : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
