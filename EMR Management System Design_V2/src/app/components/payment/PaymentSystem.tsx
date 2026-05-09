import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { CreditCard, ScanLine, CheckCircle2, XCircle, RefreshCcw, Download, Loader2 } from "lucide-react";

interface PaymentSystemProps {
  language: 'en' | 'vn';
}

const translations = {
  en: {
    title: "Payment & Insurance",
    description: "Process payments and insurance claims",
    insuranceCheck: "Insurance Verification",
    insuranceId: "Insurance ID (e.g. BH123456789)",
    checkInsurance: "Verify",
    insuranceValid: "Insurance is valid",
    insuranceInvalid: "Insurance is invalid or expired",
    correctRoute: "Correct healthcare route",
    incorrectRoute: "Incorrect healthcare route",
    coverage: "Coverage",
    holder: "Holder",
    expiry: "Expiry",
    invoiceDetails: "Invoice Details",
    service: "Service",
    amount: "Amount",
    insuranceCoverage: "Insurance Coverage",
    patientPayment: "Patient Payment",
    totalAmount: "Total Amount",
    paymentMethod: "Payment Method",
    qrCode: "QR Code",
    vnpay: "VNPay",
    creditCard: "Credit Card",
    processPayment: "Process Payment",
    processing: "Processing...",
    checking: "Checking...",
    paymentSuccess: "Payment successful! Invoice has been saved.",
    paymentFailed: "Payment failed. Please try again.",
    retry: "Retry",
    downloadInvoice: "Download Invoice",
  },
  vn: {
    title: "Thanh Toán & BHYT",
    description: "Xử lý thanh toán và bảo hiểm y tế",
    insuranceCheck: "Kiểm Tra BHYT",
    insuranceId: "Mã Thẻ BHYT (vd: BH123456789)",
    checkInsurance: "Kiểm Tra",
    insuranceValid: "Thẻ BHYT còn hiệu lực",
    insuranceInvalid: "Thẻ BHYT không hợp lệ hoặc hết hạn",
    correctRoute: "Đúng tuyến khám chữa bệnh",
    incorrectRoute: "Không đúng tuyến",
    coverage: "Tỷ lệ chi trả",
    holder: "Chủ thẻ",
    expiry: "Hạn dùng",
    invoiceDetails: "Chi Tiết Hóa Đơn",
    service: "Dịch Vụ",
    amount: "Số Tiền",
    insuranceCoverage: "BHYT Chi Trả",
    patientPayment: "Bệnh Nhân Trả",
    totalAmount: "Tổng Tiền",
    paymentMethod: "Phương Thức Thanh Toán",
    qrCode: "Mã QR",
    vnpay: "VNPay",
    creditCard: "Thẻ Tín Dụng",
    processPayment: "Thanh Toán",
    processing: "Đang xử lý...",
    checking: "Đang kiểm tra...",
    paymentSuccess: "Thanh toán thành công! Hóa đơn đã được lưu.",
    paymentFailed: "Thanh toán thất bại. Vui lòng thử lại.",
    retry: "Thử Lại",
    downloadInvoice: "Tải Hóa Đơn",
  }
};

// ✅ Bỏ defaultItems ở ngoài — chuyển vào trong component để dùng được language
const API_BASE = "http://localhost:5041/api";

interface InsuranceResult {
  valid: boolean;
  message: string;
  correctRoute: boolean;
  coverage: number;
  holderName?: string;
  expiryDate?: string;
}

export function PaymentSystem({ language }: PaymentSystemProps) {
  const t = translations[language];

  const [insuranceId, setInsuranceId]             = useState("");
  const [insuranceResult, setInsuranceResult]     = useState<InsuranceResult | null>(null);
  const [checkingInsurance, setCheckingInsurance] = useState(false);
  const [readyToPay, setReadyToPay]               = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'qr' | 'vnpay' | 'card'>('qr');
  const [paymentStatus, setPaymentStatus]         = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentId, setPaymentId]                 = useState<string | null>(null);
  const [alert, setAlert]                         = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ✅ Khai báo 1 lần duy nhất, trong component, dùng được language
  const defaultItems = [
    { serviceName: language === 'en' ? "Medical Consultation" : "Khám Bệnh",  amount: 200000 },
    { serviceName: language === 'en' ? "Laboratory Tests"     : "Xét Nghiệm", amount: 350000 },
    { serviceName: language === 'en' ? "Medication"           : "Thuốc",       amount: 150000 },
  ];

  // ✅ Tính totalAmount ngay sau defaultItems
  const totalAmount      = defaultItems.reduce((s, i) => s + i.amount, 0);
  const insurancePayment = insuranceResult?.valid
    ? Math.floor(totalAmount * insuranceResult.coverage)
    : 0;
  const patientPayment   = totalAmount - insurancePayment;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handleCheckInsurance = async () => {
    if (!insuranceId.trim()) return;
    setCheckingInsurance(true);
    setInsuranceResult(null);
    try {
      const res  = await fetch(`${API_BASE}/payments/insurance/check?code=${encodeURIComponent(insuranceId)}`);
      const data = await res.json();
      setInsuranceResult(data);
      setReadyToPay(true);
    } catch {
      setInsuranceResult({ valid: false, message: "Không thể kết nối server.", correctRoute: false, coverage: 0 });
      setReadyToPay(true);
    } finally {
      setCheckingInsurance(false);
    }
  };

  const handleProcessPayment = async () => {
    setAlert(null);
    setPaymentStatus('processing');
    const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || '';
    try {
      const res = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId:     userId,
          insuranceCode: insuranceResult?.valid ? insuranceId : "",
          paymentMethod: selectedPaymentMethod,
          items:         defaultItems.map(i => ({ serviceName: i.serviceName, amount: i.amount }))
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || t.paymentFailed);
      }
      const data = await res.json();
      setPaymentId(data.id);
      setPaymentStatus('success');
      setAlert({ message: t.paymentSuccess, type: 'success' });

      // Khoá form sau 3 giây, chỉ còn nút Download
      setTimeout(() => {
        setReadyToPay(false);
        setInsuranceId("");
        setInsuranceResult(null);
      }, 3000);
    } catch (err: any) {
      setPaymentStatus('failed');
      setAlert({ message: err.message || t.paymentFailed, type: 'error' });
    }
  };

  const handleDownloadInvoice = async () => {
    if (!paymentId) return;
    try {
      const res  = await fetch(`${API_BASE}/payments/${paymentId}/invoice`);
      const data = await res.json();
      const html = `
        <html><head><meta charset="utf-8"/>
        <style>
          body{font-family:Arial,sans-serif;padding:32px}
          h1{color:#1d4ed8}
          table{width:100%;border-collapse:collapse;margin-top:16px}
          th,td{border:1px solid #ddd;padding:8px;text-align:left}
          th{background:#f3f4f6}
          .total{font-weight:bold}
        </style></head><body>
        <h1>🏥 HÓA ĐƠN THANH TOÁN</h1>
        <p><b>Bệnh nhân:</b> ${data.patientName}</p>
        <p><b>Ngày:</b> ${data.createdAt}</p>
        <p><b>Phương thức:</b> ${data.paymentMethod.toUpperCase()}</p>
        <table>
          <tr><th>Dịch vụ</th><th>Số tiền</th></tr>
          ${data.items.map((i: any) => `<tr><td>${i.serviceName}</td><td>${i.amount.toLocaleString('vi-VN')} ₫</td></tr>`).join('')}
          <tr class="total"><td>Tổng cộng</td><td>${data.totalAmount.toLocaleString('vi-VN')} ₫</td></tr>
          ${data.insuranceAmount > 0 ? `<tr style="color:green"><td>BHYT chi trả</td><td>-${data.insuranceAmount.toLocaleString('vi-VN')} ₫</td></tr>` : ''}
          <tr class="total"><td>Bệnh nhân trả</td><td>${data.patientAmount.toLocaleString('vi-VN')} ₫</td></tr>
        </table>
        <p style="margin-top:24px;color:#6b7280;font-size:12px">Mã hóa đơn: ${data.invoiceId}</p>
        </body></html>`;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); w.print(); }
    } catch {
      window.alert("Không thể tải hóa đơn.");
    }
  };

  const handleRetry = () => {
    setPaymentStatus('idle');
    setAlert(null);
    setPaymentId(null);
  };

  return (
    <div className="space-y-6">
      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
          {alert.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* ── BHYT ── */}
      <Card>
        <CardHeader>
          <CardTitle>{t.insuranceCheck}</CardTitle>
          <CardDescription>
            {language === 'en' ? 'Verify health insurance coverage' : 'Kiểm tra thẻ bảo hiểm y tế'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t.insuranceId}
              value={insuranceId}
              onChange={e => setInsuranceId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheckInsurance()}
            />
            <Button onClick={handleCheckInsurance} disabled={checkingInsurance || !insuranceId.trim()}>
              {checkingInsurance
                ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{t.checking}</>
                : t.checkInsurance}
            </Button>
          </div>

          {insuranceResult && (
            <Alert variant={insuranceResult.valid ? 'default' : 'destructive'}>
              {insuranceResult.valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertDescription>
                <div className="font-semibold">{insuranceResult.message}</div>
                {insuranceResult.valid && (
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="bg-green-50">
                        {insuranceResult.correctRoute ? t.correctRoute : t.incorrectRoute}
                      </Badge>
                      <Badge variant="outline">
                        {t.coverage}: {(insuranceResult.coverage * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    {insuranceResult.holderName && <div>{t.holder}: <b>{insuranceResult.holderName}</b></div>}
                    {insuranceResult.expiryDate  && <div>{t.expiry}: <b>{insuranceResult.expiryDate}</b></div>}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ── Thanh toán ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Hóa đơn */}
          <div>
            <h3 className="font-semibold mb-3">{t.invoiceDetails}</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.service}</TableHead>
                    <TableHead className="text-right">{t.amount}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defaultItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.serviceName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell>{t.totalAmount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
                  </TableRow>
                  {insuranceResult?.valid && (
                    <>
                      <TableRow className="text-green-600">
                        <TableCell>{t.insuranceCoverage}</TableCell>
                        <TableCell className="text-right">-{formatCurrency(insurancePayment)}</TableCell>
                      </TableRow>
                      <TableRow className="font-bold">
                        <TableCell>{t.patientPayment}</TableCell>
                        <TableCell className="text-right">{formatCurrency(patientPayment)}</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Payment Method + nút — chỉ hiện sau khi đã nhấn Verify */}
          {readyToPay && (
            <>
              <div>
                <Label className="mb-3 block">{t.paymentMethod}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['qr', 'vnpay', 'card'] as const).map(method => (
                    <Button
                      key={method}
                      variant={selectedPaymentMethod === method ? 'default' : 'outline'}
                      onClick={() => setSelectedPaymentMethod(method)}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      disabled={paymentStatus === 'success'}
                    >
                      {method === 'qr'
                        ? <ScanLine className="h-6 w-6" />
                        : <CreditCard className="h-6 w-6" />}
                      <span>{method === 'qr' ? t.qrCode : method === 'vnpay' ? t.vnpay : t.creditCard}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {paymentStatus !== 'success' && paymentStatus !== 'failed' && (
                <Button className="w-full" onClick={handleProcessPayment} disabled={paymentStatus === 'processing'}>
                  {paymentStatus === 'processing'
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t.processing}</>
                    : <><CreditCard className="h-4 w-4 mr-2" />{t.processPayment} — {formatCurrency(patientPayment)}</>
                  }
                </Button>
              )}

              {paymentStatus === 'success' && (
                <div className="space-y-2">
                  <Button className="w-full" variant="outline" onClick={handleDownloadInvoice}>
                    <Download className="h-4 w-4 mr-2" />{t.downloadInvoice}
                  </Button>
                  <Button
                    className="w-full"
                    variant="ghost"
                    onClick={() => {
                      setPaymentStatus('idle');
                      setPaymentId(null);
                      setAlert(null);
                      setReadyToPay(false);
                      setInsuranceId("");
                      setInsuranceResult(null);
                    }}
                  >
                    {language === 'en' ? '+ New Payment' : '+ Thanh Toán Mới'}
                  </Button>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <Button className="w-full" variant="destructive" onClick={handleRetry}>
                  <RefreshCcw className="h-4 w-4 mr-2" />{t.retry}
                </Button>
              )}
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}