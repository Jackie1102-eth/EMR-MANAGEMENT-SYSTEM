import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { CheckCircle2, Plus, Trash2, Loader2, Receipt } from "lucide-react";

interface DoctorBillingProps {
  language: 'en' | 'vn';
  patientId: string;        // bệnh nhân đang được khám
  appointmentId?: string;
}

interface Service {
  id: string;
  name: string;
  nameEn: string;
  defaultPrice: number;
}

interface BillItem {
  serviceId: string;
  serviceName: string;
  amount: number;
}

const API_BASE = "http://localhost:5041/api";

export function DoctorBilling({ language, patientId, appointmentId }: DoctorBillingProps) {
  const isEn = language === 'en';

  const [services, setServices]   = useState<Service[]>([]);
  const [items, setItems]         = useState<BillItem[]>([]);
  const [notes, setNotes]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [alert, setAlert]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/payments/services`)
      .then(r => r.json())
      .then(setServices)
      .catch(() => {});
  }, []);

  const addService = (svc: Service) => {
    // Nếu đã có thì tăng số lượng (cộng giá)
    const exists = items.findIndex(i => i.serviceId === svc.id);
    if (exists >= 0) {
      setItems(prev => prev.map((i, idx) =>
        idx === exists ? { ...i, amount: i.amount + svc.defaultPrice } : i
      ));
    } else {
      setItems(prev => [...prev, {
        serviceId:   svc.id,
        serviceName: isEn ? svc.nameEn : svc.name,
        amount:      svc.defaultPrice
      }]);
    }
  };

  const updateAmount = (idx: number, val: string) => {
    const num = parseInt(val.replace(/\D/g, '')) || 0;
    setItems(prev => prev.map((i, j) => j === idx ? { ...i, amount: num } : i));
  };

  const removeItem = (idx: number) =>
    setItems(prev => prev.filter((_, j) => j !== idx));

  const totalAmount = items.reduce((s, i) => s + i.amount, 0);

  const handleSubmit = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setAlert(null);
    try {
      const doctorId = localStorage.getItem('userId') || '';
      const res = await fetch(`${API_BASE}/payments/bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          patientId,
          appointmentId: appointmentId ?? null,
          notes,
          items: items.map(i => ({ serviceName: i.serviceName, amount: i.amount }))
        })
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setAlert({ msg: isEn ? "Bill created successfully!" : "Đã tạo hóa đơn thành công!", type: 'success' });
      setItems([]);
      setNotes("");
    } catch (err: any) {
      setAlert({ msg: err.message || 'Lỗi tạo hóa đơn', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-blue-600" />
          {isEn ? "Create Bill" : "Tạo Hóa Đơn"}
        </CardTitle>
        <CardDescription>
          {isEn ? "Add services for this patient visit" : "Thêm dịch vụ cho lượt khám này"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {alert && (
          <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{alert.msg}</AlertDescription>
          </Alert>
        )}

        {/* Danh sách dịch vụ có sẵn */}
        <div>
          <Label className="mb-2 block">{isEn ? "Available Services" : "Dịch Vụ"}</Label>
          <div className="flex flex-wrap gap-2">
            {services.map(svc => (
              <Badge
                key={svc.id}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50 hover:border-blue-400 py-1.5 px-3 text-sm"
                onClick={() => addService(svc)}
              >
                <Plus className="h-3 w-3 mr-1" />
                {isEn ? svc.nameEn : svc.name} — {fmt(svc.defaultPrice)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Bảng dịch vụ đã chọn */}
        {items.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isEn ? "Service" : "Dịch Vụ"}</TableHead>
                  <TableHead className="w-40">{isEn ? "Amount (VND)" : "Số Tiền (VND)"}</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.serviceName}</TableCell>
                    <TableCell>
                      <Input
                        value={item.amount.toLocaleString('vi-VN')}
                        onChange={e => updateAmount(idx, e.target.value)}
                        className="w-36 text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>{isEn ? "Total" : "Tổng Cộng"}</TableCell>
                  <TableCell className="text-right">{fmt(totalAmount)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}

        {/* Ghi chú */}
        <div className="space-y-1">
          <Label>{isEn ? "Notes (optional)" : "Ghi Chú (tuỳ chọn)"}</Label>
          <Input
            placeholder={isEn ? "Diagnosis, instructions..." : "Chẩn đoán, hướng dẫn dùng thuốc..."}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <Button
          className="w-full"
          disabled={items.length === 0 || loading}
          onClick={handleSubmit}
        >
          {loading
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isEn ? "Creating..." : "Đang tạo..."}</>
            : <><Receipt className="h-4 w-4 mr-2" />{isEn ? `Create Bill — ${fmt(totalAmount)}` : `Tạo Hóa Đơn — ${fmt(totalAmount)}`}</>
          }
        </Button>

      </CardContent>
    </Card>
  );
}