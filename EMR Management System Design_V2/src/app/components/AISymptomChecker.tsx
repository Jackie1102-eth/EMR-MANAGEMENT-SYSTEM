import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Brain, Send, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
// API_CALL: Import API functions
import { aiSymptomScreening } from "../services/api";

interface AISymptomCheckerProps {
  language: 'en' | 'vn';
}

const translations = {
  en: {
    title: "AI Symptom Screening",
    description: "Describe symptoms for AI-powered preliminary assessment",
    placeholder: "Enter patient symptoms (e.g., fever, headache, cough...)",
    analyze: "Analyze Symptoms",
    analyzing: "Analyzing...",
    results: "AI Assessment Results",
    severity: "Severity Level",
    recommendations: "Recommended Actions",
    disclaimer: "This is a preliminary AI assessment. Always consult with a healthcare professional for accurate diagnosis.",
    possibleConditions: "Possible Conditions",
    urgency: "Urgency",
    high: "High",
    medium: "Medium",
    low: "Low"
  },
  vn: {
    title: "Sàng Lọc Triệu Chứng AI",
    description: "Mô tả triệu chứng để AI đánh giá sơ bộ",
    placeholder: "Nhập triệu chứng bệnh nhân (VD: sốt, đau đầu, ho...)",
    analyze: "Phân Tích Triệu Chứng",
    analyzing: "Đang phân tích...",
    results: "Kết Quả Đánh Giá AI",
    severity: "Mức Độ Nghiêm Trọng",
    recommendations: "Hành Động Được Đề Xuất",
    disclaimer: "Đây là đánh giá sơ bộ của AI. Luôn tham khảo ý kiến bác sĩ chuyên khoa để chẩn đoán chính xác.",
    possibleConditions: "Tình Trạng Có Thể",
    urgency: "Mức Độ Khẩn Cấp",
    high: "Cao",
    medium: "Trung Bình",
    low: "Thấp"
  }
};

const mockAnalysis = {
  en: {
    conditions: ["Upper Respiratory Infection", "Seasonal Influenza", "COVID-19 (requires testing)"],
    recommendations: [
      "Schedule in-person consultation within 24 hours",
      "Order COVID-19 rapid test",
      "Monitor temperature every 4 hours",
      "Recommend rest and hydration",
      "Consider antipyretic medication if fever >38.5°C"
    ],
    severity: "medium",
    urgencyLevel: "Medium"
  },
  vn: {
    conditions: ["Nhiễm Trùng Đường Hô Hấp Trên", "Cúm Mùa", "COVID-19 (cần xét nghiệm)"],
    recommendations: [
      "Đặt lịch khám trực tiếp trong vòng 24 giờ",
      "Yêu cầu xét nghiệm nhanh COVID-19",
      "Theo dõi nhiệt độ mỗi 4 giờ",
      "Khuyên nghỉ ngơi và uống nhiều nước",
      "Cân nhắc dùng thuốc hạ sốt nếu sốt >38.5°C"
    ],
    severity: "medium",
    urgencyLevel: "Trung Bình"
  }
};

export function AISymptomChecker({ language }: AISymptomCheckerProps) {
  const t = translations[language];
  const [symptoms, setSymptoms] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<typeof mockAnalysis.en | null>(null);

  // API_CALL: Gọi AI API để phân tích triệu chứng
  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      // Uncomment khi có backend API với AI model
      // const response = await aiSymptomScreening(symptoms);
      // setResults({
      //   conditions: response.predictions.map(p => p.disease),
      //   recommendations: response.recommendedTests,
      //   severity: response.severity,
      //   urgencyLevel: response.urgency
      // });

      // Mock - xóa dòng này khi có API
      setTimeout(() => {
        setResults(mockAnalysis[language]);
        setAnalyzing(false);
      }, 2000);

      /*
       * API_CALL CHÚ THÍCH:
       * Backend sẽ nhận symptoms và gọi AI model đã train
       *
       * Request body:
       * {
       *   "symptoms": "string - triệu chứng người dùng nhập",
       *   "patientId": "string (optional) - ID bệnh nhân"
       * }
       *
       * Response structure:
       * {
       *   "predictions": [
       *     {
       *       "disease": "Tên bệnh",
       *       "confidence": 0.85,
       *       "icd10Code": "A00"
       *     }
       *   ],
       *   "severity": "low|medium|high|critical",
       *   "urgency": "Mô tả mức độ khẩn cấp",
       *   "recommendedTests": ["Xét nghiệm 1", "Xét nghiệm 2"],
       *   "recommendedSpecialty": "Tên chuyên khoa"
       * }
       *
       * SQL queries trong backend:
       * 1. INSERT INTO AIScreenings (PatientId, Symptoms, PredictedDiseases, Severity, CreatedAt)
       *    VALUES (@patientId, @symptoms, @predictions, @severity, GETDATE())
       * 2. Gọi AI model endpoint để lấy predictions
       */
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high": return <AlertTriangle className="h-4 w-4" />;
      case "medium": return <Info className="h-4 w-4" />;
      case "low": return <CheckCircle2 className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={t.placeholder}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <Button
            onClick={handleAnalyze}
            disabled={!symptoms || analyzing}
            className="w-full"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t.analyzing}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                {t.analyze}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              {t.results}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t.urgency}:</span>
                <Badge variant={getSeverityColor(results.severity)} className="flex items-center gap-1">
                  {getSeverityIcon(results.severity)}
                  {results.urgencyLevel}
                </Badge>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                {t.possibleConditions}
              </h4>
              <div className="flex flex-wrap gap-2">
                {results.conditions.map((condition, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t.recommendations}
              </h4>
              <ul className="space-y-2">
                {results.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{t.disclaimer}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
