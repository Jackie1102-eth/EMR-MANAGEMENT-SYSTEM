import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Calendar } from "../ui/calendar";
import { Badge } from "../ui/badge";
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { bookAppointment, checkAppointmentAvailability, getDoctorsByDepartment, getAvailableSlots } from "../../services/api";

interface AppointmentBookingProps {
  language: 'en' | 'vn';
  onAppointmentBooked?: () => void;
}

const translations = {
  en: {
    title: "Book Appointment",
    description: "Schedule your medical appointment",
    department: "Department",
    doctor: "Doctor",
    selectDate: "Select Date",
    availableSlots: "Available Time Slots",
    noSlotsAvailable: "No slots available for this date",
    confirmBooking: "Confirm Booking",
    booking: "Booking...",
    bookingSuccess: "Appointment booked successfully! Confirmation email sent.",
    bookingConflict: "This time slot is no longer available",
    holidayWarning: "Selected date is a public holiday",
    bookingTooLate: "Cannot book appointments less than 2 hours in advance",
    loadingDoctors: "Loading doctors...",
    summary: "Appointment Summary",
    date: "Date",
    time: "Time",
  },
  vn: {
    title: "Đặt Lịch Khám",
    description: "Đặt lịch hẹn khám bệnh",
    department: "Chuyên Khoa",
    doctor: "Bác Sĩ",
    selectDate: "Chọn Ngày",
    availableSlots: "Giờ Khám Còn Trống",
    noSlotsAvailable: "Không có giờ khám cho ngày này",
    confirmBooking: "Xác Nhận Đặt Lịch",
    booking: "Đang đặt lịch...",
    bookingSuccess: "Đặt lịch thành công! Email xác nhận đã được gửi.",
    bookingConflict: "Giờ khám này không còn trống",
    holidayWarning: "Ngày được chọn là ngày lễ",
    bookingTooLate: "Không thể đặt lịch trong vòng 2 giờ tới",
    loadingDoctors: "Đang tải danh sách bác sĩ...",
    summary: "Thông Tin Lịch Hẹn",
    date: "Ngày",
    time: "Giờ",
  }
};

const departments = {
  en: [
    { id: "cardiology",   name: "Cardiology" },
    { id: "neurology",    name: "Neurology" },
    { id: "orthopedics",  name: "Orthopedics" },
    { id: "pediatrics",   name: "Pediatrics" },
    { id: "general",      name: "General Medicine" }
  ],
  vn: [
    { id: "cardiology",   name: "Tim Mạch" },
    { id: "neurology",    name: "Thần Kinh" },
    { id: "orthopedics",  name: "Chỉnh Hình" },
    { id: "pediatrics",   name: "Nhi Khoa" },
    { id: "general",      name: "Đa Khoa" }
  ]
};

const mockDoctors = {
  en: {
    cardiology:  [{ id: "D001", name: "Dr. Nguyen Minh", specialty: "Cardiologist" }, { id: "D002", name: "Dr. Tran Lan", specialty: "Cardiologist" }],
    neurology:   [{ id: "D003", name: "Dr. Le Hung",     specialty: "Neurologist" }],
    orthopedics: [{ id: "D004", name: "Dr. Pham Mai",    specialty: "Orthopedic Surgeon" }],
    pediatrics:  [{ id: "D005", name: "Dr. Vo Anh",      specialty: "Pediatrician" }],
    general:     [{ id: "D006", name: "Dr. Hoang Binh",  specialty: "General Practitioner" }]
  },
  vn: {
    cardiology:  [{ id: "D001", name: "BS. Nguyễn Minh", specialty: "Bác Sĩ Tim Mạch" }, { id: "D002", name: "BS. Trần Lan", specialty: "Bác Sĩ Tim Mạch" }],
    neurology:   [{ id: "D003", name: "BS. Lê Hùng",     specialty: "Bác Sĩ Thần Kinh" }],
    orthopedics: [{ id: "D004", name: "BS. Phạm Mai",    specialty: "Bác Sĩ Chỉnh Hình" }],
    pediatrics:  [{ id: "D005", name: "BS. Võ Anh",      specialty: "Bác Sĩ Nhi Khoa" }],
    general:     [{ id: "D006", name: "BS. Hoàng Bình",  specialty: "Bác Sĩ Đa Khoa" }]
  }
};

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"
];

// ✅ Helper: chuyển Date → "yyyy-MM-dd" theo local timezone, tránh lệch ngày do UTC
const toLocalDateStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function AppointmentBooking({ language, onAppointmentBooked }: AppointmentBookingProps) {
  const t = translations[language];

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor]         = useState("");
  const [selectedDate, setSelectedDate]             = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot]             = useState("");
  const [alert, setAlert]                           = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [bookedSlots, setBookedSlots]               = useState<string[]>([]);
  const [availableDoctors, setAvailableDoctors]     = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors]         = useState(false);
  const [loading, setLoading]                       = useState(false);

  // Load doctors khi chọn department
  useEffect(() => {
    if (!selectedDepartment) {
      setAvailableDoctors([]);
      setSelectedDoctor("");
      return;
    }

    const loadDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const data = await getDoctorsByDepartment(selectedDepartment);
        setAvailableDoctors(data);
      } catch {
        const fallback = mockDoctors[language][selectedDepartment as keyof typeof mockDoctors.en] || [];
        setAvailableDoctors(fallback);
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, [selectedDepartment, language]);

  // Load slot đã bị book khi chọn ngày + bác sĩ
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;

    const checkSlots = async () => {
      try {
        // ✅ Dùng toLocalDateStr thay vì toISOString()
        const dateStr = toLocalDateStr(selectedDate);
        const available: string[] = await getAvailableSlots(selectedDoctor, dateStr);
        const booked = timeSlots.filter(s => !available.includes(s));
        setBookedSlots(booked);
      } catch {
        setBookedSlots([]);
      }
    };

    checkSlots();
  }, [selectedDoctor, selectedDate]);

  const handleConfirmBooking = async () => {
    setAlert(null);

    if (!selectedDepartment || !selectedDoctor || !selectedDate || !selectedSlot) return;

    // Kiểm tra 2 giờ tới — dùng local date để tránh lệch
    const [h, min] = selectedSlot.split(':').map(Number);
    const appointmentDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      h, min
    );
    const hoursDiff = (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursDiff < 2 && hoursDiff > 0) {
      setAlert({ message: t.bookingTooLate, type: 'error' });
      return;
    }

    try {
      setLoading(true);

      // ✅ Dùng toLocalDateStr thay vì toISOString()
      const dateStr = toLocalDateStr(selectedDate);

      // Kiểm tra slot còn trống
      const availability = await checkAppointmentAvailability(selectedDoctor, dateStr, selectedSlot);
      if (!availability.available) {
        setAlert({ message: t.bookingConflict, type: 'error' });
        return;
      }

      const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || '';

      // ✅ Dùng toLocalDateStr thay vì toISOString()
      await bookAppointment({
        userId,
        doctorId:     selectedDoctor,
        departmentId: selectedDepartment,
        date:         dateStr,
        timeSlot:     selectedSlot,
        notes:        ""
      });

      setAlert({ message: t.bookingSuccess, type: 'success' });
      if (onAppointmentBooked) onAppointmentBooked();

      setTimeout(() => {
        setSelectedDepartment("");
        setSelectedDoctor("");
        setSelectedDate(undefined);
        setSelectedSlot("");
        setAlert(null);
      }, 3000);

    } catch (error: any) {
      setAlert({ message: error.message || 'Đặt lịch thất bại', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
          {alert.type === 'success' && <CheckCircle2 className="h-4 w-4" />}
          {alert.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department */}
            <div className="space-y-2">
              <Label>{t.department}</Label>
              <Select
                value={selectedDepartment}
                onValueChange={(val) => {
                  setSelectedDepartment(val);
                  setSelectedDoctor("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Select department' : 'Chọn chuyên khoa'} />
                </SelectTrigger>
                <SelectContent>
                  {departments[language].map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Doctor */}
            <div className="space-y-2">
              <Label>{t.doctor}</Label>
              <Select
                value={selectedDoctor}
                onValueChange={setSelectedDoctor}
                disabled={!selectedDepartment || loadingDoctors}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingDoctors
                        ? t.loadingDoctors
                        : language === 'en' ? 'Select doctor' : 'Chọn bác sĩ'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableDoctors.map((doc: any) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name} - {doc.specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calendar */}
          <div className="space-y-2">
            <Label>{t.selectDate}</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date() || date.getDay() === 0}
              className="rounded-md border"
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t.availableSlots}
              </Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {timeSlots.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  return (
                    <Button
                      key={slot}
                      variant={selectedSlot === slot ? "default" : "outline"}
                      className={isBooked ? "opacity-50" : ""}
                      disabled={isBooked}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedDepartment && selectedDoctor && selectedDate && selectedSlot && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="font-semibold">{t.summary}</div>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">{t.department}: </span>
                  <Badge variant="outline">
                    {departments[language].find(d => d.id === selectedDepartment)?.name}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.doctor}: </span>
                  <Badge variant="outline">
                    {availableDoctors.find((d: any) => d.id === selectedDoctor)?.name}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.date}: </span>
                  {/* ✅ Dùng toLocalDateStr để hiển thị đúng ngày */}
                  {toLocalDateStr(selectedDate).split('-').reverse().join('/')}
                </div>
                <div>
                  <span className="text-muted-foreground">{t.time}: </span>
                  {selectedSlot}
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            className="w-full"
            disabled={!selectedDepartment || !selectedDoctor || !selectedDate || !selectedSlot || loading}
            onClick={handleConfirmBooking}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {loading ? t.booking : t.confirmBooking}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}