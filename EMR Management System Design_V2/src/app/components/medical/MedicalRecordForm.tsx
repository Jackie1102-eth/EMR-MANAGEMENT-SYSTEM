import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { FileText, Upload, Brain, Lock, AlertCircle } from "lucide-react";

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

export function MedicalRecordForm({ language, patientId = "P001" }: MedicalRecordFormProps) {
  const t = translations[language];
  const [formData, setFormData] = useState({
    patientId,
    symptoms: "",
    diagnosis: "",
    conclusion: ""
  });
  const [files, setFiles] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleGetAiSuggestions = () => {
    setAiLoading(true);
    setTimeout(() => {
      setAiSuggestions(mockAISuggestions[language]);
      setAiLoading(false);
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      const newFiles = Array.from(fileList).map(f => f.name);
      setFiles([...files, ...newFiles]);
    }
  };

  const handleSave = () => {
    setAlert({ message: t.successSaved, type: 'success' });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleFinalize = () => {
    setIsLocked(true);
    setAlert({ message: t.successFinalized, type: 'success' });
    setTimeout(() => setAlert(null), 3000);
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
              <Input value={formData.patientId} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t.symptoms}</Label>
            <Textarea
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
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
                      <Badge key={i} variant="outline">{d}</Badge>
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
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              rows={3}
              disabled={isLocked}
              placeholder={language === 'en' ? 'Enter diagnosis...' : 'Nhập chẩn đoán...'}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.conclusion}</Label>
            <Textarea
              value={formData.conclusion}
              onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
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

          {!isLocked && (
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
