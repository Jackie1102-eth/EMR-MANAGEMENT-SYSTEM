import { useState, useEffect } from "react";
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

interface BillItem { serviceName: string; amount: number; }
interface PendingBill {
  id: string;
  notes: string;
  createdAt: string;
  items: BillItem[];
  totalAmount: number;
}
interface InsuranceResult {
  valid: boolean;
  message: string;
  correctRoute: boolean;
  coverage: number;
  holderName?: string;
  expiryDate?: string;
}

const API_BASE = "http://localhost:5041/api";

const t = {
  en: {
    title: "Payment & Insurance", desc: "Process payments and insurance claims",
    insCheck: "Insurance Verification", insPlaceholder: "Insurance ID (e.g. BH123456789)",
    verify: "Verify", checking: "Checking...",
    insValid: "Insurance is valid", insInvalid: "Insurance is invalid or expired",
    correctRoute: "Correct healthcare route", incorrectRoute: "Incorrect route",
    coverage: "Coverage", holder: "Holder", expiry: "Expiry",
    invoiceDetails: "Invoice Details", service: "Service", amount: "Amount",
    insCoverage: "Insurance Coverage", patientPay: "Patient Payment", total: "Total Amount",
    payMethod: "Payment Method", qr: "QR Code", vnpay: "VNPay", card: "Credit Card",
    pay: "Process Payment", processing: "Processing...",
    success: "Payment successful! Invoice has been saved.",
    failed: "Payment failed. Please try again.",
    retry: "Retry", download: "Download Invoice", newPayment: "+ New Payment",
    noBill: "No pending bill. Please see the doctor first.",
    loadingBill: "Loading your bill...", notes: "Doctor's notes",
    doctor: "Created by doctor at",
  },
  vn: {
    title: "Thanh Toán & BHYT", desc: "Xử lý thanh toán và bảo hiểm y tế",
    insCheck: "Kiểm Tra BHYT", insPlaceholder: "Mã Thẻ BHYT (vd: BH123456789)",
    verify: "Kiểm Tra", checking: "Đang kiểm tra...",
    insValid: "Thẻ BHYT còn hiệu lực", insInvalid: "Thẻ BHYT không hợp lệ hoặc hết hạn",
    correctRoute: "Đúng tuyến khám chữa bệnh", incorrectRoute: "Không đúng tuyến",
    coverage: "Tỷ lệ chi trả", holder: "Chủ thẻ", expiry: "Hạn dùng",
    invoiceDetails: "Chi Tiết Hóa Đơn", service: "Dịch Vụ", amount: "Số Tiền",
    insCoverage: "BHYT Chi Trả", patientPay: "Bệnh Nhân Trả", total: "Tổng Tiền",
    payMethod: "Phương Thức Thanh Toán", qr: "Mã QR", vnpay: "VNPay", card: "Thẻ Tín Dụng",
    pay: "Thanh Toán", processing: "Đang xử lý...",
    success: "Thanh toán thành công! Hóa đơn đã được lưu.",
    failed: "Thanh toán thất bại. Vui lòng thử lại.",
    retry: "Thử Lại", download: "Tải Hóa Đơn", newPayment: "+ Thanh Toán Mới",
    noBill: "Chưa có hóa đơn. Vui lòng khám bệnh trước.",
    loadingBill: "Đang tải hóa đơn...", notes: "Ghi chú của bác sĩ",
    doctor: "Bác sĩ tạo lúc",
  }
};

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export function PaymentSystem({ language }: PaymentSystemProps) {
  const tx = t[language];

  const [pendingBill, setPendingBill]           = useState<PendingBill | null>(null);
  const [loadingBill, setLoadingBill]           = useState(true);

  const [insuranceId, setInsuranceId]           = useState("");
  const [insuranceResult, setInsuranceResult]   = useState<InsuranceResult | null>(null);
  const [checkingIns, setCheckingIns]           = useState(false);
  const [readyToPay, setReadyToPay]             = useState(false);

  const [payMethod, setPayMethod]               = useState<'qr' | 'vnpay' | 'card'>('qr');
  const [payStatus, setPayStatus]               = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [paymentId, setPaymentId]               = useState<string | null>(null);
  const [alertMsg, setAlertMsg]                 = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ── Load hóa đơn pending từ bác sĩ ──────────
  useEffect(() => { loadBill(); }, []);

  const loadBill = async () => {
    setLoadingBill(true);
    try {
      const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || '';
      const res    = await fetch(`${API_BASE}/payments/pending?patientId=${userId}`);
      const data   = await res.json();
      setPendingBill(data);  // null nếu chưa có
    } catch {
      setPendingBill(null);
    } finally {
      setLoadingBill(false);
    }
  };

  const insurancePayment = insuranceResult?.valid && pendingBill
    ? Math.floor(pendingBill.totalAmount * insuranceResult.coverage)
    : 0;
  const patientPayment = (pendingBill?.totalAmount ?? 0) - insurancePayment;

  // ── Kiểm tra BHYT ────────────────────────────
  const handleCheckInsurance = async () => {
    if (!insuranceId.trim()) return;
    setCheckingIns(true);
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
      setCheckingIns(false);
    }
  };

  // ── Thanh toán ───────────────────────────────
  const handlePay = async () => {
    if (!pendingBill) return;
    setAlertMsg(null);
    setPayStatus('processing');
    try {
      const res = await fetch(`${API_BASE}/payments/${pendingBill.id}/pay`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insuranceCode: insuranceResult?.valid ? insuranceId : "",
          paymentMethod: payMethod
        })
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const data = await res.json();
      setPaymentId(data.id ?? pendingBill.id);
      setPayStatus('success');
      setAlertMsg({ msg: tx.success, type: 'success' });
      setTimeout(() => {
        setPendingBill(null);
        setInsuranceId("");
        setInsuranceResult(null);
        setReadyToPay(false);
      }, 3000);
    } catch (err: any) {
      setPayStatus('failed');
      setAlertMsg({ msg: err.message || tx.failed, type: 'error' });
    }
  };

  // ── Download hóa đơn ─────────────────────────
  const handleDownload = async () => {
    const id = paymentId ?? pendingBill?.id;
    if (!id) return;
    try {
      const res  = await fetch(`${API_BASE}/payments/${id}/invoice`);
      const data = await res.json();
      const html = `<html><head><meta charset="utf-8"/>
        <style>body{font-family:Arial,sans-serif;padding:32px}h1{color:#1d4ed8}
        table{width:100%;border-collapse:collapse;margin-top:16px}
        th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f3f4f6}
        .bold{font-weight:bold}</style></head><body>
        <h1>🏥 HÓA ĐƠN THANH TOÁN</h1>
        <p><b>Bệnh nhân:</b> ${data.patientName}</p>
        <p><b>Ngày khám:</b> ${data.createdAt}</p>
        <p><b>Thanh toán lúc:</b> ${data.paidAt || '---'}</p>
        <p><b>Phương thức:</b> ${data.paymentMethod?.toUpperCase() || '---'}</p>
        ${data.notes ? `<p><b>Ghi chú:</b> ${data.notes}</p>` : ''}
        <table>
          <tr><th>Dịch vụ</th><th>Số tiền</th></tr>
          ${data.items.map((i: any) => `<tr><td>${i.serviceName}</td><td>${i.amount.toLocaleString('vi-VN')} ₫</td></tr>`).join('')}
          <tr class="bold"><td>Tổng cộng</td><td>${data.totalAmount.toLocaleString('vi-VN')} ₫</td></tr>
          ${data.insuranceAmount > 0 ? `<tr style="color:green"><td>BHYT chi trả</td><td>-${data.insuranceAmount.toLocaleString('vi-VN')} ₫</td></tr>` : ''}
          <tr class="bold"><td>Bệnh nhân trả</td><td>${data.patientAmount.toLocaleString('vi-VN')} ₫</td></tr>
        </table>
        <p style="margin-top:24px;color:#6b7280;font-size:12px">Mã hóa đơn: ${data.invoiceId}</p>
        </body></html>`;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); w.print(); }
    } catch { window.alert("Không thể tải hóa đơn."); }
  };

  const handleRetry = () => { setPayStatus('idle'); setAlertMsg(null); setPaymentId(null); };

  const resetAll = () => {
    setPayStatus('idle'); setAlertMsg(null); setPaymentId(null);
    setReadyToPay(false); setInsuranceId(""); setInsuranceResult(null);
    loadBill();
  };

  return (
    <div className="space-y-6">
      {alertMsg && (
        <Alert variant={alertMsg.type === 'error' ? 'destructive' : 'default'}>
          {alertMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertDescription>{alertMsg.msg}</AlertDescription>
        </Alert>
      )}

      {/* ── BHYT ── */}
      <Card>
        <CardHeader>
          <CardTitle>{tx.insCheck}</CardTitle>
          <CardDescription>
            {language === 'en' ? 'Verify health insurance coverage' : 'Kiểm tra thẻ bảo hiểm y tế'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={tx.insPlaceholder}
              value={insuranceId}
              onChange={e => setInsuranceId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheckInsurance()}
            />
            <Button onClick={handleCheckInsurance} disabled={checkingIns || !insuranceId.trim()}>
              {checkingIns
                ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{tx.checking}</>
                : tx.verify}
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
                        {insuranceResult.correctRoute ? tx.correctRoute : tx.incorrectRoute}
                      </Badge>
                      <Badge variant="outline">
                        {tx.coverage}: {(insuranceResult.coverage * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    {insuranceResult.holderName && <div>{tx.holder}: <b>{insuranceResult.holderName}</b></div>}
                    {insuranceResult.expiryDate  && <div>{tx.expiry}: <b>{insuranceResult.expiryDate}</b></div>}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ── Hóa đơn + Thanh toán ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            {tx.title}
          </CardTitle>
          <CardDescription>{tx.desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {loadingBill ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />{tx.loadingBill}
            </div>
          ) : !pendingBill ? (
            <div className="text-center py-8 text-muted-foreground">{tx.noBill}</div>
          ) : (
            <>
              {/* Thông tin hóa đơn từ bác sĩ */}
              <div className="text-sm text-muted-foreground">
                {tx.doctor}: <b>{pendingBill.createdAt}</b>
              </div>
              {pendingBill.notes && (
                <div className="p-3 bg-muted rounded-md text-sm">
                  <span className="font-semibold">{tx.notes}: </span>{pendingBill.notes}
                </div>
              )}

              {/* Bảng dịch vụ */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{tx.service}</TableHead>
                      <TableHead className="text-right">{tx.amount}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingBill.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.serviceName}</TableCell>
                        <TableCell className="text-right">{fmt(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold">
                      <TableCell>{tx.total}</TableCell>
                      <TableCell className="text-right">{fmt(pendingBill.totalAmount)}</TableCell>
                    </TableRow>
                    {insuranceResult?.valid && (
                      <>
                        <TableRow className="text-green-600">
                          <TableCell>{tx.insCoverage}</TableCell>
                          <TableCell className="text-right">-{fmt(insurancePayment)}</TableCell>
                        </TableRow>
                        <TableRow className="font-bold">
                          <TableCell>{tx.patientPay}</TableCell>
                          <TableCell className="text-right">{fmt(patientPayment)}</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Payment Method + nút — chỉ hiện sau khi verify BHYT */}
              {readyToPay && (
                <>
                  <div>
                    <Label className="mb-3 block">{tx.payMethod}</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['qr', 'vnpay', 'card'] as const).map(m => (
                        <Button
                          key={m}
                          variant={payMethod === m ? 'default' : 'outline'}
                          onClick={() => setPayMethod(m)}
                          className="flex flex-col items-center gap-2 h-auto py-4"
                          disabled={payStatus === 'success'}
                        >
                          {m === 'qr' ? <ScanLine className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
                          <span>{m === 'qr' ? tx.qr : m === 'vnpay' ? tx.vnpay : tx.card}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {payStatus !== 'success' && payStatus !== 'failed' && (
                    <Button className="w-full" onClick={handlePay} disabled={payStatus === 'processing'}>
                      {payStatus === 'processing'
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{tx.processing}</>
                        : <><CreditCard className="h-4 w-4 mr-2" />{tx.pay} — {fmt(patientPayment)}</>
                      }
                    </Button>
                  )}

                  {payStatus === 'success' && (
                    <div className="space-y-2">
                      <Button className="w-full" variant="outline" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />{tx.download}
                      </Button>
                      <Button className="w-full" variant="ghost" onClick={resetAll}>
                        {tx.newPayment}
                      </Button>
                    </div>
                  )}

                  {payStatus === 'failed' && (
                    <Button className="w-full" variant="destructive" onClick={handleRetry}>
                      <RefreshCcw className="h-4 w-4 mr-2" />{tx.retry}
                    </Button>
                  )}
                </>
              )}

              {/* Nếu chưa verify BHYT thì vẫn cho phép bỏ qua và thanh toán thẳng */}
              {!readyToPay && (
                <Button variant="ghost" className="w-full" onClick={() => setReadyToPay(true)}>
                  {language === 'en' ? 'Skip insurance check → Pay now' : 'Bỏ qua kiểm tra BHYT → Thanh toán ngay'}
                </Button>
              )}
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}