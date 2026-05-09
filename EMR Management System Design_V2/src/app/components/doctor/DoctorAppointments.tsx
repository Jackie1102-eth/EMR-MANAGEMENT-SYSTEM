import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar } from "../ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Calendar as CalendarIcon, User, Phone, Clock,
  CheckCircle2, XCircle, Clock3, Receipt, ScanLine, CreditCard, Banknote
} from "lucide-react";

interface DoctorAppointmentsProps {
  language: "en" | "vn";
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
    save: "Save Status",
    cancel: "Cancel",
    statusUpdated: "Status updated successfully",
    tabStatus: "Status",
    tabBilling: "Create Invoice",
    billingTitle: "Invoice",
    billingDesc: "Select services provided to patient",
    services: "Services",
    qty: "Qty",
    price: "Price",
    total: "Total",
    addService: "Add",
    createBill: "Create Invoice",
    billCreated: "Invoice created successfully",
    paymentMethod: "Payment Method",
    cash: "Cash",
    card: "Card",
    qr: "QR Code",
    billingNote: "Invoice will be sent to patient's payment page",
    noServicesSelected: "Please select at least one service",
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
    updateStatus: "Xử Lý",
    notes: "Ghi Chú",
    save: "Lưu Trạng Thái",
    cancel: "Đóng",
    statusUpdated: "Cập nhật trạng thái thành công",
    tabStatus: "Trạng Thái",
    tabBilling: "Tạo Hóa Đơn",
    billingTitle: "Hóa Đơn",
    billingDesc: "Chọn các dịch vụ đã thực hiện cho bệnh nhân",
    services: "Dịch Vụ",
    qty: "SL",
    price: "Đơn Giá",
    total: "Tổng",
    addService: "Thêm",
    createBill: "Tạo Hóa Đơn",
    billCreated: "Tạo hóa đơn thành công",
    paymentMethod: "Phương Thức Thanh Toán",
    cash: "Tiền Mặt",
    card: "Thẻ",
    qr: "QR Code",
    billingNote: "Hóa đơn sẽ được gửi sang trang thanh toán của bệnh nhân",
    noServicesSelected: "Vui lòng chọn ít nhất một dịch vụ",
  },
};

// Danh sách dịch vụ cố định
const SERVICE_CATALOG = [
  { id: "consult",  nameVn: "Khám Bệnh",           nameEn: "Medical Consultation",  price: 200000 },
  { id: "lab",      nameVn: "Xét Nghiệm Máu",       nameEn: "Blood Test",            price: 250000 },
  { id: "xray",     nameVn: "Chụp X-Quang",         nameEn: "X-Ray",                 price: 350000 },
  { id: "ultra",    nameVn: "Siêu Âm",              nameEn: "Ultrasound",            price: 400000 },
  { id: "ecg",      nameVn: "Điện Tâm Đồ",          nameEn: "ECG",                   price: 150000 },
  { id: "mri",      nameVn: "Chụp MRI",             nameEn: "MRI Scan",              price: 1500000 },
  { id: "drug",     nameVn: "Thuốc",                nameEn: "Medication",            price: 150000 },
  { id: "vaccine",  nameVn: "Tiêm Vắc-Xin",        nameEn: "Vaccination",           price: 300000 },
  { id: "physio",   nameVn: "Vật Lý Trị Liệu",     nameEn: "Physiotherapy",         price: 200000 },
  { id: "dental",   nameVn: "Nha Khoa",             nameEn: "Dental Care",           price: 500000 },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const toLocalDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

interface BillItem {
  serviceId: string;
  nameVn: string;
  nameEn: string;
  price: number;
  qty: number;
}

export function DoctorAppointments({ language }: DoctorAppointmentsProps) {
  const t = translations[language];

  // Calendar & appointments
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("status");

  // Status tab
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Billing tab
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr">("cash");
  const [creatingBill, setCreatingBill] = useState(false);
  const [billCreated, setBillCreated] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const dateStr = toLocalDateStr(selectedDate);
      const response = await fetch(`http://localhost:5041/api/appointments`);
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      const filtered = data.filter((apt: any) => {
        const aptDate = apt.appointmentDate
          ? apt.appointmentDate.split("T")[0]
          : apt.date;
        return aptDate === dateStr;
      });
      setAppointments(filtered);
    } catch (error) {
      console.error("Error loading appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedAppointment || !newStatus) return;
    try {
      setSavingStatus(true);
      const response = await fetch(
        `http://localhost:5041/api/appointments/${selectedAppointment.id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newStatus),
        }
      );
      if (response.ok) {
        await loadAppointments();
        // Nếu chuyển sang completed → gợi ý tạo hóa đơn
        if (newStatus === "completed") {
          setActiveTab("billing");
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setSavingStatus(false);
    }
  };

  // ---- Billing helpers ----
  const toggleService = (svc: typeof SERVICE_CATALOG[0]) => {
    setBillItems((prev) => {
      const exists = prev.find((i) => i.serviceId === svc.id);
      if (exists) return prev.filter((i) => i.serviceId !== svc.id);
      return [...prev, { serviceId: svc.id, nameVn: svc.nameVn, nameEn: svc.nameEn, price: svc.price, qty: 1 }];
    });
  };

  const updateQty = (serviceId: string, qty: number) => {
    if (qty < 1) return;
    setBillItems((prev) =>
      prev.map((i) => (i.serviceId === serviceId ? { ...i, qty } : i))
    );
  };

  const billTotal = billItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  const handleCreateBill = async () => {
    if (billItems.length === 0) {
      setBillError(t.noServicesSelected);
      return;
    }
    setBillError(null);
    try {
      setCreatingBill(true);
      const userId = localStorage.getItem("userId") || "";
      const response = await fetch(`http://localhost:5041/api/payments/bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedAppointment.patientId,
          appointmentId: selectedAppointment.id,
          doctorId: userId,
          paymentMethod,
          items: billItems.map((i) => ({
            serviceName: language === "en" ? i.nameEn : i.nameVn,
            amount: i.price * i.qty,
          })),
        }),
      });
  console.log("patientId gửi lên:", selectedAppointment.patientId);
  console.log("appointment data:", selectedAppointment);
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.message || "Lỗi tạo hóa đơn");
      }

      setBillCreated(true);
    } catch (err: any) {
      setBillError(err?.message || "Không thể tạo hóa đơn");
    } finally {
      setCreatingBill(false);
    }
  };

  const handleOpenDialog = (apt: any) => {
    setSelectedAppointment(apt);
    setNewStatus(apt.status);
    setNotes(apt.notes || "");
    setActiveTab("status");
    setBillItems([]);
    setBillCreated(false);
    setBillError(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAppointment(null);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { className: string; label: string }> = {
      pending:   { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: t.pending },
      confirmed: { className: "bg-blue-100 text-blue-800 border-blue-200",       label: t.confirmed },
      completed: { className: "bg-green-100 text-green-800 border-green-200",    label: t.completed },
      cancelled: { className: "bg-red-100 text-red-800 border-red-200",          label: t.cancelled },
    };
    const info = map[status] ?? map.pending;
    return <Badge variant="outline" className={info.className}>{info.label}</Badge>;
  };

  // ----------------------------------------------------------------
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
              {t.appointmentsFor}{" "}
              {selectedDate.toLocaleDateString(language === "en" ? "en-US" : "vi-VN")}
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">{t.noAppointments}</div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
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
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {apt.timeSlot}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {apt.patientName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {apt.patientPhone ?? "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{apt.department}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(apt.status)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleOpenDialog(apt)}>
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

      {/* ---- DIALOG ---- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedAppointment?.patientName}
            </DialogTitle>
            <DialogDescription>
              <Clock className="h-3 w-3 inline mr-1" />
              {selectedAppointment?.timeSlot} &nbsp;|&nbsp;
              <span>{selectedAppointment?.department}</span>
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="status" className="flex-1">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {t.tabStatus}
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex-1">
                <Receipt className="h-4 w-4 mr-1" />
                {t.tabBilling}
              </TabsTrigger>
            </TabsList>

            {/* ===== TAB STATUS ===== */}
            <TabsContent value="status" className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>{t.status}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pending", "confirmed", "completed", "cancelled"] as const).map((s) => {
                    const icons = {
                      pending: <Clock3 className="h-4 w-4 mr-2" />,
                      confirmed: <CheckCircle2 className="h-4 w-4 mr-2" />,
                      completed: <CheckCircle2 className="h-4 w-4 mr-2" />,
                      cancelled: <XCircle className="h-4 w-4 mr-2" />,
                    };
                    const labels = {
                      pending: t.pending, confirmed: t.confirmed,
                      completed: t.completed, cancelled: t.cancelled,
                    };
                    return (
                      <Button
                        key={s}
                        variant={newStatus === s ? "default" : "outline"}
                        onClick={() => setNewStatus(s)}
                        className={
                          newStatus === s && s === "completed"
                            ? "bg-green-600 hover:bg-green-700"
                            : newStatus === s && s === "cancelled"
                            ? "bg-red-600 hover:bg-red-700"
                            : ""
                        }
                      >
                        {icons[s]}
                        {labels[s]}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.notes}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={language === "en" ? "Add notes..." : "Thêm ghi chú..."}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleCloseDialog}>{t.cancel}</Button>
                <Button onClick={handleUpdateStatus} disabled={savingStatus}>
                  {savingStatus
                    ? language === "en" ? "Saving..." : "Đang lưu..."
                    : t.save}
                </Button>
              </div>

              {newStatus === "completed" && (
                <p className="text-sm text-blue-600 text-center">
                  💡 {language === "en"
                    ? 'After saving, switch to "Create Invoice" tab to bill the patient.'
                    : 'Sau khi lưu, chuyển sang tab "Tạo Hóa Đơn" để thanh toán cho bệnh nhân.'}
                </p>
              )}
            </TabsContent>

            {/* ===== TAB BILLING ===== */}
            <TabsContent value="billing" className="space-y-5 pt-2">
              {billCreated ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-lg">{t.billCreated}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t.billingNote}</p>
                  <Button className="mt-6" onClick={handleCloseDialog}>{t.cancel}</Button>
                </div>
              ) : (
                <>
                  {/* Chọn dịch vụ */}
                  <div>
                    <Label className="mb-3 block">{t.services}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {SERVICE_CATALOG.map((svc) => {
                        const selected = billItems.some((i) => i.serviceId === svc.id);
                        return (
                          <button
                            key={svc.id}
                            onClick={() => toggleService(svc)}
                            className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                              selected
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-border hover:border-blue-300 hover:bg-blue-50/50"
                            }`}
                          >
                            <p className="font-medium">
                              {language === "en" ? svc.nameEn : svc.nameVn}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatCurrency(svc.price)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Danh sách đã chọn */}
                  {billItems.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left px-3 py-2">{t.services}</th>
                            <th className="text-center px-3 py-2 w-20">{t.qty}</th>
                            <th className="text-right px-3 py-2">{t.total}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billItems.map((item) => (
                            <tr key={item.serviceId} className="border-t">
                              <td className="px-3 py-2">
                                {language === "en" ? item.nameEn : item.nameVn}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.qty}
                                  onChange={(e) =>
                                    updateQty(item.serviceId, parseInt(e.target.value) || 1)
                                  }
                                  className="w-16 text-center border rounded px-2 py-1 text-sm"
                                />
                              </td>
                              <td className="px-3 py-2 text-right font-medium">
                                {formatCurrency(item.price * item.qty)}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t bg-muted font-semibold">
                            <td colSpan={2} className="px-3 py-2">Total</td>
                            <td className="px-3 py-2 text-right text-blue-700">
                              {formatCurrency(billTotal)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Phương thức thanh toán */}
                  <div>
                    <Label className="mb-2 block">{t.paymentMethod}</Label>
                    <div className="flex gap-2">
                      {(["cash", "card", "qr"] as const).map((m) => {
                        const icons = {
                          cash: <Banknote className="h-4 w-4 mr-1" />,
                          card: <CreditCard className="h-4 w-4 mr-1" />,
                          qr:   <ScanLine className="h-4 w-4 mr-1" />,
                        };
                        const labels = { cash: t.cash, card: t.card, qr: t.qr };
                        return (
                          <Button
                            key={m}
                            variant={paymentMethod === m ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPaymentMethod(m)}
                          >
                            {icons[m]}{labels[m]}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {billError && (
                    <p className="text-sm text-red-500">{billError}</p>
                  )}

                  <p className="text-xs text-muted-foreground">{t.billingNote}</p>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleCloseDialog}>{t.cancel}</Button>
                    <Button onClick={handleCreateBill} disabled={creatingBill || billItems.length === 0}>
                      <Receipt className="h-4 w-4 mr-1" />
                      {creatingBill
                        ? language === "en" ? "Creating..." : "Đang tạo..."
                        : `${t.createBill} — ${formatCurrency(billTotal)}`}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}