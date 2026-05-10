import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { FileText, Upload, Brain, Lock } from "lucide-react";

interface MedicalRecordFormProps {
  language: 'en' | 'vn';
  patientId?: string;
}

const translations = {
  en: {
    title: "Electronic Medical Record",
    description: "Create and manage patient medical records",
    patientId: "Patient ID",
    symptoms: "Symptoms",
    diagnosis: "Diagnosis",
    conclusion: "Medical Conclusion",
    aiSuggestions: "AI Diagnostic Suggestions",
    getAiSuggestions: "Get AI Suggestions",
    attachments: "Medical Documents",
    uploadFile: "Upload File (PDF, JPG, PNG)",
    save: "Save Record",
    finalize: "Finalize & Lock",
    locked: "Record Locked",
    lockedMessage: "This record has been finalized and cannot be edited",
    successSaved: "Medical record saved successfully",
    successFinalized: "Medical record finalized and locked",
    aiAnalyzing: "AI is analyzing symptoms...",
    possibleDiagnoses: "Possible Diagnoses",
    recommendedTests: "Recommended Tests",
    urgency: "Urgency Level"
  },
  vn: {
    title: "Bệnh Án Điện Tử",
    description: "Tạo và quản lý bệnh án bệnh nhân",
    patientId: "Mã Bệnh Nhân",
    symptoms: "Triệu Chứng",
    diagnosis: "Chẩn Đoán",
    conclusion: "Kết Luận",
    aiSuggestions: "Gợi Ý Chẩn Đoán AI",
    getAiSuggestions: "Lấy Gợi Ý AI",
    attachments: "Tài Liệu Y Tế",
    uploadFile: "Tải Lên File (PDF, JPG, PNG)",
    save: "Lưu Bệnh Án",
    finalize: "Hoàn Thành & Khóa",
    locked: "Bệnh Án Đã Khóa",
    lockedMessage: "Bệnh án này đã được hoàn thành và không thể chỉnh sửa",
    successSaved: "Lưu bệnh án thành công",
    successFinalized: "Bệnh án đã được hoàn thành và khóa",
    aiAnalyzing: "AI đang phân tích triệu chứng...",
    possibleDiagnoses: "Chẩn Đoán Có Thể",
    recommendedTests: "Xét Nghiệm Đề Xuất",
    urgency: "Mức Độ Khẩn Cấp"
  }
};

const mockAISuggestions = {
  en: {
    diagnoses: ["Upper Respiratory Infection", "Acute Bronchitis", "Influenza"],
    tests: ["Complete Blood Count", "Chest X-Ray", "COVID-19 PCR Test"],
    urgency: "Medium - Schedule follow-up within 48 hours"
  },
  vn: {
    diagnoses: ["Nhiễm Trùng Đường Hô Hấp Trên", "Viêm Phế Quản Cấp", "Cúm"],
    tests: ["Xét Nghiệm Máu Tổng Quát", "Chụp X-Quang Phổi", "Xét Nghiệm COVID-19 PCR"],
    urgency: "Trung Bình - Đặt lịch tái khám trong 48 giờ"
  }
};

// Key để lưu draft data vào sessionStorage (tồn tại trong tab, mất khi đóng tab)
const SESSION_DRAFT_KEY = "emr_form_draft";

export function MedicalRecordForm({ language, patientId }: MedicalRecordFormProps) {
  const t = translations[language];

  // --- KHỞI TẠO STATE TỪ SESSION STORAGE (giữ data khi chuyển tab) ---
  const getInitialFormData = () => {
    try {
      const saved = sessionStorage.getItem(SESSION_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          patientId: patientId || parsed.patientId || "",
          symptoms: parsed.symptoms || "",
          diagnosis: parsed.diagnosis || "",
          conclusion: parsed.conclusion || ""
        };
      }
    } catch (_) {}
    return {
      patientId: patientId || "",
      symptoms: "",
      diagnosis: "",
      conclusion: ""
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [files, setFiles] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  // Đọc lock state ngay khi khởi tạo — giữ trạng thái lock khi chuyển tab
  const getInitialLocked = () => {
    try {
      const draft = sessionStorage.getItem(SESSION_DRAFT_KEY);
      const pid = patientId || (draft ? JSON.parse(draft).patientId : "");
      if (pid) return sessionStorage.getItem(`locked_${pid}`) === 'true';
    } catch (_) {}
    return false;
  };
  const [isLocked, setIsLocked] = useState(getInitialLocked);
  const [aiLoading, setAiLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Ref để track lần đầu load dữ liệu từ server (tránh fetch lại nhiều lần)
  const hasFetchedRef = useRef<string | null>(null);

  // --- FIX 1: AUTO-SAVE DRAFT VÀO SESSION STORAGE KHI FORM THAY ĐỔI ---
  // Data sẽ được giữ lại khi chuyển tab, mất khi đóng trình duyệt
  useEffect(() => {
    // Không lưu draft khi đang locked (tránh ghi đè data đã finalize)
    if (!isLocked) {
      try {
        sessionStorage.setItem(SESSION_DRAFT_KEY, JSON.stringify(formData));
      } catch (_) {}
    }
  }, [formData, isLocked]);

  // --- FIX 2: CHỈ CHECK LOCK VÀ FETCH DATA KHI PATIENT ID HỢP LỆ VÀ THAY ĐỔI ---
  // Tách logic "check lock" và "fetch server" khỏi nhau, không auto-lock khi gõ ID
  useEffect(() => {
    const pid = formData.patientId;
    
    // Bỏ qua nếu ID chưa đủ dài hoặc đã fetch rồi
    if (!pid || pid.length < 30) {
      setIsLocked(false);
      return;
    }
    if (hasFetchedRef.current === pid) return;
    hasFetchedRef.current = pid;

    const loadPatientData = async () => {
      // KHÔNG tự động lock ở đây — chỉ lock khi user bấm nút "Finalize & Lock"
      // Chỉ restore lock state nếu user đã từng finalize trong session này
      const savedLockStatus = sessionStorage.getItem(`locked_${pid}`);
      if (savedLockStatus === 'true') {
        setIsLocked(true);
      }

      // Gọi API lấy dữ liệu cũ từ server
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/medicalrecords/patient/${pid}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const lastRecord = data[0];
            // Chỉ điền nếu field đang trống (không ghi đè data user đang nhập)
            setFormData(prev => ({
              ...prev,
              symptoms: prev.symptoms || lastRecord.symptoms || "",
              diagnosis: prev.diagnosis || lastRecord.diagnosis || "",
              conclusion: prev.conclusion || lastRecord.treatmentPlan || ""
            }));
          }
        }
      } catch (error) {
        // Server lỗi → giữ nguyên data hiện tại
        console.error("Server error - keeping current data.");
      }
    };

    loadPatientData();
  }, [formData.patientId]);

  const applyDiagnosis = (suggestion: string) => {
    if (!isLocked) {
      setFormData(prev => ({ ...prev, diagnosis: suggestion }));
    }
  };

  const handleGetAiSuggestions = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiSuggestions(mockAISuggestions[language]);
      setAiLoading(false);
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      const newFiles = Array.from(fileList).map(f => f.name);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleSave = async () => {
    // Validate Patient ID trước
    if (!formData.patientId || formData.patientId.length < 30) {
      setAlert({ message: language === 'en' ? "Please enter a valid Patient ID (GUID)" : "Vui lòng nhập Mã Bệnh Nhân hợp lệ (GUID)", type: 'error' });
      return false;
    }

    // Lấy DoctorId — nếu chưa login thì dùng empty GUID, không block nút Save
    const doctorIdStr = localStorage.getItem('userId') || '00000000-0000-0000-0000-000000000000';

    const recordData = {
      PatientId: formData.patientId,
      DoctorId: doctorIdStr,
      Symptoms: formData.symptoms,
      Diagnosis: formData.diagnosis,
      TreatmentPlan: formData.conclusion,
      Notes: ""
    };

    try {
      const response = await fetch('${import.meta.env.VITE_API_URL}/medicalrecords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });

      if (response.ok) {
        setAlert({ message: t.successSaved, type: 'success' });
        setTimeout(() => setAlert(null), 3000);
        return true;
      }

      // Hiện lỗi chi tiết từ server
      const errData = await response.json().catch(() => null);
      const errMsg = errData?.message || errData?.detail || `Server error: ${response.status}`;
      setAlert({ message: errMsg, type: 'error' });
      return false;
    } catch (error) {
      setAlert({ 
        message: language === 'en' 
          ? "Cannot connect to server. Is the backend running?" 
          : "Không kết nối được server. Backend có đang chạy không?", 
        type: 'error' 
      });
      return false;
    }
  };

const handleFinalize = () => {
  setIsLocked(true); // Cập nhật giao diện ngay [cite: 25]
  localStorage.setItem(`locked_${formData.patientId}`, 'true'); // Lưu trạng thái vào máy [cite: 25]
  setAlert({ message: t.successFinalized, type: 'success' }); // Hiển thị thông báo [cite: 26]
};
  const handleUnlock = () => {
    setIsLocked(false);
    sessionStorage.removeItem(`locked_${formData.patientId}`);
    setAlert({ message: language === 'en' ? "Record unlocked" : "Đã mở khóa bệnh án", type: 'success' });
    setTimeout(() => setAlert(null), 2000);
  };

  // --- FIX 3: XÓA DRAFT KHI ĐỔI PATIENT ID (tránh data lẫn lộn giữa các bệnh nhân) ---
  const handlePatientIdChange = (newId: string) => {
    if (newId !== formData.patientId) {
      // Reset fetch tracker để có thể fetch data của bệnh nhân mới
      hasFetchedRef.current = null;
      setIsLocked(false);
      setAiSuggestions(null);
      // Reset form, xóa draft cũ
      const freshData = { patientId: newId, symptoms: "", diagnosis: "", conclusion: "" };
      setFormData(freshData);
      sessionStorage.setItem(SESSION_DRAFT_KEY, JSON.stringify(freshData));
    }
  };

  return (
    <div className="space-y-6">
      {alert && (
        <Alert variant={alert.type === 'success' ? 'default' : 'destructive'}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {isLocked && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>{t.lockedMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            {t.title}
            {isLocked && <Badge variant="secondary" className="ml-2">{t.locked}</Badge>}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.patientId}</Label>
              <Input
                value={formData.patientId}
                disabled={isLocked}
                onChange={(e) => handlePatientIdChange(e.target.value)}
                placeholder="Nhập mã Guid bệnh nhân..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.symptoms}</Label>
            <Textarea
              value={formData.symptoms}
              onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
              rows={4}
              disabled={isLocked}
              placeholder={language === 'en' ? 'Describe patient symptoms...' : 'Mô tả triệu chứng bệnh nhân...'}
            />
            {!isLocked && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetAiSuggestions}
                disabled={!formData.symptoms || aiLoading}
              >
                <Brain className="h-4 w-4 mr-2" />
                {aiLoading ? t.aiAnalyzing : t.getAiSuggestions}
              </Button>
            )}
          </div>

          {aiSuggestions && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  {t.aiSuggestions}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-2">{t.possibleDiagnoses}:</div>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.diagnoses.map((d: string, i: number) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer hover:bg-purple-100 transition-colors"
                        onClick={() => applyDiagnosis(d)}
                      >
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">{t.recommendedTests}:</div>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.tests.map((test: string, i: number) => (
                      <Badge key={i} variant="secondary">{test}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">{t.urgency}:</div>
                  <p className="text-sm text-muted-foreground">{aiSuggestions.urgency}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label>{t.diagnosis}</Label>
            <Textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
              rows={3}
              disabled={isLocked}
              placeholder={language === 'en' ? 'Enter diagnosis...' : 'Nhập chẩn đoán...'}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.conclusion}</Label>
            <Textarea
              value={formData.conclusion}
              onChange={(e) => setFormData(prev => ({ ...prev, conclusion: e.target.value }))}
              rows={3}
              disabled={isLocked}
              placeholder={language === 'en' ? 'Medical conclusion and treatment plan...' : 'Kết luận và phương án điều trị...'}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.attachments}</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              {!isLocked && (
                <div className="flex items-center gap-2 mb-3">
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="flex-1"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                      <FileText className="h-4 w-4" />
                      <span>{file}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {isLocked ? (
            <div className="flex gap-2">
              <Button onClick={handleUnlock} variant="destructive">
                <Upload className="h-4 w-4 mr-2 rotate-180" />
                {language === 'en' ? "Unlock Record" : "Mở Khóa Bệnh Án"}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} variant="outline">
                {t.save}
              </Button>
              <Button onClick={handleFinalize} className="bg-green-600 hover:bg-green-700">
                <Lock className="h-4 w-4 mr-2" />
                {t.finalize}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}