import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { CreditCard, QrCode, CheckCircle2, XCircle, RefreshCcw, Download } from "lucide-react";

interface PaymentSystemProps {
  language: 'en' | 'vn';
}

const translations = {
  en: {
    title: "Payment & Insurance",
    description: "Process payments and insurance claims",
    insuranceCheck: "Insurance Verification",
    insuranceId: "Insurance ID",
    checkInsurance: "Check Insurance",
    insuranceValid: "Insurance is valid",
    insuranceInvalid: "Insurance is invalid or expired",
    correctRoute: "Correct healthcare route",
    incorrectRoute: "Incorrect healthcare route",
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
    paymentSuccess: "Payment successful! Invoice generated.",
    paymentFailed: "Payment failed. Please try again.",
    retry: "Retry",
    downloadInvoice: "Download Invoice",
    consultation: "Medical Consultation",
    labTests: "Laboratory Tests",
    medication: "Medication",
    examinationFee: "Examination Fee"
  },
  vn: {
    title: "Thanh Toán & BHYT",
    description: "Xử lý thanh toán và bảo hiểm y tế",
    insuranceCheck: "Kiểm Tra BHYT",
    insuranceId: "Mã Thẻ BHYT",
    checkInsurance: "Kiểm Tra BHYT",
    insuranceValid: "Thẻ BHYT còn hiệu lực",
    insuranceInvalid: "Thẻ BHYT không hợp lệ hoặc hết hạn",
    correctRoute: "Đúng tuyến khám chữa bệnh",
    incorrectRoute: "Không đúng tuyến khám chữa bệnh",
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
    paymentSuccess: "Thanh toán thành công! Hóa đơn đã được tạo.",
    paymentFailed: "Thanh toán thất bại. Vui lòng thử lại.",
    retry: "Thử Lại",
    downloadInvoice: "Tải Hóa Đơn",
    consultation: "Khám Bệnh",
    labTests: "Xét Nghiệm",
    medication: "Thuốc",
    examinationFee: "Phí Khám"
  }
};

const mockInvoiceItems = {
  en: [
    { service: "Medical Consultation", amount: 200000 },
    { service: "Laboratory Tests", amount: 350000 },
    { service: "Medication", amount: 150000 }
  ],
  vn: [
    { service: "Khám Bệnh", amount: 200000 },
    { service: "Xét Nghiệm", amount: 350000 },
    { service: "Thuốc", amount: 150000 }
  ]
};

export function PaymentSystem({ language }: PaymentSystemProps) {
  const t = translations[language];
  const [insuranceId, setInsuranceId] = useState("");
  const [insuranceStatus, setInsuranceStatus] = useState<'valid' | 'invalid' | null>(null);
  const [insuranceCoverage] = useState(0.8); // 80% coverage
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'qr' | 'vnpay' | 'card'>('qr');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const invoiceItems = mockInvoiceItems[language];
  const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  const insurancePayment = insuranceStatus === 'valid' ? Math.floor(totalAmount * insuranceCoverage) : 0;
  const patientPayment = totalAmount - insurancePayment;

  const handleCheckInsurance = () => {
    // Mock insurance check
    if (insuranceId.length > 0) {
      setInsuranceStatus(insuranceId.startsWith("BH") ? 'valid' : 'invalid');
    }
  };

  const handleProcessPayment = () => {
    setAlert(null);
    // Simulate payment processing
    setTimeout(() => {
      const success = Math.random() > 0.1; // 90% success rate
      if (success) {
        setPaymentStatus('success');
        setAlert({ message: t.paymentSuccess, type: 'success' });
      } else {
        setPaymentStatus('failed');
        setAlert({ message: t.paymentFailed, type: 'error' });
      }
    }, 2000);
  };

  const handleRetry = () => {
    setPaymentStatus('pending');
    setAlert(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
          {alert.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.insuranceCheck}</CardTitle>
          <CardDescription>{language === 'en' ? 'Verify health insurance coverage' : 'Kiểm tra bảo hiểm y tế'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t.insuranceId}
              value={insuranceId}
              onChange={(e) => setInsuranceId(e.target.value)}
            />
            <Button onClick={handleCheckInsurance}>{t.checkInsurance}</Button>
          </div>

          {insuranceStatus && (
            <Alert variant={insuranceStatus === 'valid' ? 'default' : 'destructive'}>
              {insuranceStatus === 'valid' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertDescription>
                <div className="font-semibold">
                  {insuranceStatus === 'valid' ? t.insuranceValid : t.insuranceInvalid}
                </div>
                {insuranceStatus === 'valid' && (
                  <div className="mt-1">
                    <Badge variant="outline" className="bg-green-50">
                      {t.correctRoute}
                    </Badge>
                    <div className="mt-2 text-sm">
                      {language === 'en' ? 'Coverage: 80%' : 'Tỷ lệ chi trả: 80%'}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                  {invoiceItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.service}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell>{t.totalAmount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
                  </TableRow>
                  {insuranceStatus === 'valid' && (
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

          <div>
            <Label className="mb-3 block">{t.paymentMethod}</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={selectedPaymentMethod === 'qr' ? 'default' : 'outline'}
                onClick={() => setSelectedPaymentMethod('qr')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <QrCode className="h-6 w-6" />
                <span>{t.qrCode}</span>
              </Button>
              <Button
                variant={selectedPaymentMethod === 'vnpay' ? 'default' : 'outline'}
                onClick={() => setSelectedPaymentMethod('vnpay')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <CreditCard className="h-6 w-6" />
                <span>{t.vnpay}</span>
              </Button>
              <Button
                variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setSelectedPaymentMethod('card')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <CreditCard className="h-6 w-6" />
                <span>{t.creditCard}</span>
              </Button>
            </div>
          </div>

          {paymentStatus === 'pending' && (
            <Button className="w-full" onClick={handleProcessPayment}>
              <CreditCard className="h-4 w-4 mr-2" />
              {t.processPayment} - {formatCurrency(patientPayment)}
            </Button>
          )}

          {paymentStatus === 'success' && (
            <div className="space-y-2">
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {t.downloadInvoice}
              </Button>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <Button className="w-full" variant="destructive" onClick={handleRetry}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              {t.retry}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
