import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { MessageCircle, Send, Bot, User } from "lucide-react";

interface MedicalChatbotProps {
  language: 'en' | 'vn';
}

const translations = {
  en: {
    title: "Medical Assistant Chatbot",
    description: "Ask questions and get help",
    placeholder: "Type your question...",
    send: "Send",
    suggestedQuestions: "Suggested Questions",
    suggestions: [
      "How do I book an appointment?",
      "Check my test results",
      "What are your operating hours?",
      "How to access my medical records?"
    ]
  },
  vn: {
    title: "Trợ Lý Y Tế AI",
    description: "Đặt câu hỏi và nhận trợ giúp",
    placeholder: "Nhập câu hỏi của bạn...",
    send: "Gửi",
    suggestedQuestions: "Câu Hỏi Gợi Ý",
    suggestions: [
      "Làm thế nào để đặt lịch khám?",
      "Kiểm tra kết quả xét nghiệm",
      "Giờ làm việc của bệnh viện?",
      "Cách truy cập hồ sơ bệnh án?"
    ]
  }
};

const mockResponses = {
  en: {
    appointment: "To book an appointment: 1) Go to 'Book Appointment' section, 2) Select your department and doctor, 3) Choose a date and time slot, 4) Confirm your booking. You'll receive a confirmation email.",
    results: "You can view your test results in the 'Patient Records' section. Navigate to your profile and click on 'Recent Visits' to see all test results.",
    hours: "Our hospital operates 24/7 for emergencies. Regular consultation hours are Monday-Saturday: 8:00 AM - 5:00 PM. Sunday: Emergency only.",
    records: "Access your medical records by logging into your account and navigating to the 'Patient Records' section. All your consultation history and prescriptions are available there.",
    default: "I can help you with booking appointments, checking test results, accessing medical records, and general hospital information. How can I assist you today?"
  },
  vn: {
    appointment: "Để đặt lịch khám: 1) Vào mục 'Đặt Lịch Khám', 2) Chọn chuyên khoa và bác sĩ, 3) Chọn ngày và giờ khám, 4) Xác nhận đặt lịch. Bạn sẽ nhận email xác nhận.",
    results: "Bạn có thể xem kết quả xét nghiệm trong mục 'Hồ Sơ Bệnh Nhân'. Vào hồ sơ cá nhân và nhấn 'Lần Khám Gần Đây' để xem tất cả kết quả.",
    hours: "Bệnh viện hoạt động 24/7 cho cấp cứu. Giờ khám bệnh thường: Thứ 2-7: 8:00 - 17:00. Chủ nhật: Chỉ cấp cứu.",
    records: "Truy cập hồ sơ bệnh án bằng cách đăng nhập và vào mục 'Hồ Sơ Bệnh Nhân'. Tất cả lịch sử khám và đơn thuốc đều có sẵn.",
    default: "Tôi có thể giúp bạn đặt lịch khám, kiểm tra kết quả xét nghiệm, truy cập hồ sơ bệnh án và thông tin chung về bệnh viện. Tôi có thể giúp gì cho bạn?"
  }
};

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function MedicalChatbot({ language }: MedicalChatbotProps) {
  const t = translations[language];
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: mockResponses[language].default,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    const responses = mockResponses[language];

    if (message.includes('appointment') || message.includes('đặt lịch') || message.includes('book')) {
      return responses.appointment;
    }
    if (message.includes('result') || message.includes('xét nghiệm') || message.includes('test')) {
      return responses.results;
    }
    if (message.includes('hour') || message.includes('giờ') || message.includes('time')) {
      return responses.hours;
    }
    if (message.includes('record') || message.includes('hồ sơ') || message.includes('history')) {
      return responses.records;
    }

    return responses.default;
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputMessage("");

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        text: generateResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-purple-600" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4 bg-muted/30">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-purple-600" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white border'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString(language === 'en' ? 'en-US' : 'vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {message.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">{t.suggestedQuestions}</p>
            <div className="flex flex-wrap gap-2">
              {t.suggestions.map((suggestion, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={t.placeholder}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
