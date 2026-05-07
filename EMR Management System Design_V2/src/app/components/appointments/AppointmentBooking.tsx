import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Calendar } from "../ui/calendar";
import { Badge } from "../ui/badge";
import { Calendar as CalendarIcon, Clock, User, CheckCircle2, AlertTriangle } from "lucide-react";
// API_CALL: Import API functions
import { bookAppointment, checkAppointmentAvailability, getDoctorsByDepartment } from "../../services/api";

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
    bookingSuccess: "Appointment booked successfully! Confirmation email sent.",
    bookingConflict: "This time slot is no longer available",
    holidayWarning: "Selected date is a public holiday",
    bookingTooLate: "Cannot book appointments less than 2 hours in advance",
    cardiology: "Cardiology",
    neurology: "Neurology",
    orthopedics: "Orthopedics",
    pediatrics: "Pediatrics",
    generalMedicine: "General Medicine"
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
    bookingSuccess: "Đặt lịch thành công! Email xác nhận đã được gửi.",
    bookingConflict: "Giờ khám này không còn trống",
    holidayWarning: "Ngày được chọn là ngày lễ",
    bookingTooLate: "Không thể đặt lịch trong vòng 2 giờ tới",
    cardiology: "Tim Mạch",
    neurology: "Thần Kinh",
    orthopedics: "Chỉnh Hình",
    pediatrics: "Nhi Khoa",
    generalMedicine: "Đa Khoa"
  }
};

const departments = {
  en: [
    { id: "cardiology", name: "Cardiology" },
    { id: "neurology", name: "Neurology" },
    { id: "orthopedics", name: "Orthopedics" },
    { id: "pediatrics", name: "Pediatrics" },
    { id: "general", name: "General Medicine" }
  ],
  vn: [
    { id: "cardiology", name: "Tim Mạch" },
    { id: "neurology", name: "Thần Kinh" },
    { id: "orthopedics", name: "Chỉnh Hình" },
    { id: "pediatrics", name: "Nhi Khoa" },
    { id: "general", name: "Đa Khoa" }
  ]
};

const doctors = {
  en: {
    cardiology: [
      { id: "D001", name: "Dr. Nguyen Minh", specialty: "Cardiologist" },
      { id: "D002", name: "Dr. Tran Lan", specialty: "Cardiologist" }
    ],
    neurology: [
      { id: "D003", name: "Dr. Le Hung", specialty: "Neurologist" }
    ],
    orthopedics: [
      { id: "D004", name: "Dr. Pham Mai", specialty: "Orthopedic Surgeon" }
    ],
    pediatrics: [
      { id: "D005", name: "Dr. Vo Anh", specialty: "Pediatrician" }
    ],
    general: [
      { id: "D006", name: "Dr. Hoang Binh", specialty: "General Practitioner" }
    ]
  },
  vn: {
    cardiology: [
      { id: "D001", name: "BS. Nguyễn Minh", specialty: "Bác Sĩ Tim Mạch" },
      { id: "D002", name: "BS. Trần Lan", specialty: "Bác Sĩ Tim Mạch" }
    ],
    neurology: [
      { id: "D003", name: "BS. Lê Hùng", specialty: "Bác Sĩ Thần Kinh" }
    ],
    orthopedics: [
      { id: "D004", name: "BS. Phạm Mai", specialty: "Bác Sĩ Chỉnh Hình" }
    ],
    pediatrics: [
      { id: "D005", name: "BS. Võ Anh", specialty: "Bác Sĩ Nhi Khoa" }
    ],
    general: [
      { id: "D006", name: "BS. Hoàng Bình", specialty: "Bác Sĩ Đa Khoa" }
    ]
  }
};

const timeSlots = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"
];

export function AppointmentBooking({ language, onAppointmentBooked }: AppointmentBookingProps) {
  const t = translations[language];
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState("");
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [bookedSlots] = useState(["09:00", "14:00"]); // Mock booked slots

  const availableDoctors = selectedDepartment
    ? doctors[language][selectedDepartment as keyof typeof doctors.en]
    : [];

  // API_CALL: Xác nhận đặt lịch khám
  const handleConfirmBooking = async () => {
    setAlert(null);

    if (!selectedDepartment || !selectedDoctor || !selectedDate || !selectedSlot) {
      return;
    }

    // Check if booking is within 2 hours
    const now = new Date();
    const appointmentTime = new Date(selectedDate);
    const [hours, minutes] = selectedSlot.split(':');
    appointmentTime.setHours(parseInt(hours), parseInt(minutes));

    const timeDiff = appointmentTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 2 && hoursDiff > 0) {
      setAlert({ message: t.bookingTooLate, type: 'error' });
      return;
    }

    try {
      // API_CALL: Kiểm tra slot còn trống
      // Uncomment khi có backend API
      // const availability = await checkAppointmentAvailability(
      //   selectedDoctor,
      //   selectedDate.toISOString().split('T')[0],
      //   selectedSlot
      // );
      // if (!availability.available) {
      //   setAlert({ message: t.bookingConflict, type: 'error' });
      //   return;
      // }

      // Check for conflicts (mock)
      if (bookedSlots.includes(selectedSlot)) {
        setAlert({ message: t.bookingConflict, type: 'error' });
        return;
      }

      // API_CALL: Tạo appointment mới
      // Uncomment khi có backend API
      // await bookAppointment({
      //   departmentId: selectedDepartment,
      //   doctorId: selectedDoctor,
      //   date: selectedDate.toISOString().split('T')[0],
      //   timeSlot: selectedSlot
      // });

      /*
       * API_CALL CHÚ THÍCH:
       * Backend sẽ:
       * 1. Validate slot availability
       * 2. Tạo appointment record
       * 3. Gửi email xác nhận
       *
       * SQL queries:
       * 1. BEGIN TRANSACTION
       * 2. INSERT INTO Appointments (PatientId, DoctorId, DepartmentId, AppointmentDate, TimeSlot, Status, CreatedAt)
       *    VALUES (@patientId, @doctorId, @deptId, @date, @time, 'pending', GETDATE())
       * 3. INSERT INTO Notifications (UserId, Type, Message, CreatedAt)
       *    VALUES (@patientId, 'email', 'Appointment confirmation', GETDATE())
       * 4. COMMIT TRANSACTION
       */

      // Success
      setAlert({ message: t.bookingSuccess, type: 'success' });

      // Callback để refresh danh sách lịch hẹn
      if (onAppointmentBooked) {
        onAppointmentBooked();
      }

      setTimeout(() => {
        setSelectedDepartment("");
        setSelectedDoctor("");
        setSelectedDate(undefined);
        setSelectedSlot("");
        setAlert(null);
      }, 3000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      setAlert({ message: 'Failed to book appointment', type: 'error' });
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
            <div className="space-y-2">
              <Label>{t.department}</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
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

            <div className="space-y-2">
              <Label>{t.doctor}</Label>
              <Select
                value={selectedDoctor}
                onValueChange={setSelectedDoctor}
                disabled={!selectedDepartment}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'en' ? 'Select doctor' : 'Chọn bác sĩ'} />
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

          {selectedDepartment && selectedDoctor && selectedDate && selectedSlot && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="font-semibold">{language === 'en' ? 'Appointment Summary' : 'Thông Tin Lịch Hẹn'}</div>
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
                  <span className="text-muted-foreground">{language === 'en' ? 'Date' : 'Ngày'}: </span>
                  {selectedDate.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                </div>
                <div>
                  <span className="text-muted-foreground">{language === 'en' ? 'Time' : 'Giờ'}: </span>
                  {selectedSlot}
                </div>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!selectedDepartment || !selectedDoctor || !selectedDate || !selectedSlot}
            onClick={handleConfirmBooking}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t.confirmBooking}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
