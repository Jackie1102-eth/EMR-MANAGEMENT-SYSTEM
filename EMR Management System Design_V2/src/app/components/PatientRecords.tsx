import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Search, Eye, FileText, Calendar, User, Phone, Mail, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
// API_CALL: Import API functions
import { getPatients, getPatientDetails } from "../services/api";

interface PatientRecordsProps {
  language: 'en' | 'vn';
}

const translations = {
  en: {
    title: "Patient Records",
    description: "Search and manage patient medical records",
    searchPlaceholder: "Search by name, ID, or phone number...",
    id: "ID",
    name: "Patient Name",
    age: "Age",
    gender: "Gender",
    lastVisit: "Last Visit",
    status: "Status",
    actions: "Actions",
    view: "View Details",
    active: "Active",
    followUp: "Follow-up",
    critical: "Critical",
    male: "Male",
    female: "Female",
    patientDetails: "Patient Details",
    personalInfo: "Personal Information",
    medicalHistory: "Medical History",
    recentVisits: "Recent Visits",
    phone: "Phone",
    email: "Email",
    address: "Address",
    bloodType: "Blood Type",
    allergies: "Allergies",
    chronicConditions: "Chronic Conditions",
    currentMedications: "Current Medications",
    visitDate: "Visit Date",
    diagnosis: "Diagnosis",
    doctor: "Doctor"
  },
  vn: {
    title: "Hồ Sơ Bệnh Nhân",
    description: "Tìm kiếm và quản lý hồ sơ bệnh án",
    searchPlaceholder: "Tìm kiếm theo tên, ID, hoặc số điện thoại...",
    id: "Mã",
    name: "Tên Bệnh Nhân",
    age: "Tuổi",
    gender: "Giới Tính",
    lastVisit: "Lần Khám Cuối",
    status: "Trạng Thái",
    actions: "Thao Tác",
    view: "Xem Chi Tiết",
    active: "Đang Điều Trị",
    followUp: "Tái Khám",
    critical: "Nghiêm Trọng",
    male: "Nam",
    female: "Nữ",
    patientDetails: "Chi Tiết Bệnh Nhân",
    personalInfo: "Thông Tin Cá Nhân",
    medicalHistory: "Lịch Sử Bệnh Án",
    recentVisits: "Lần Khám Gần Đây",
    phone: "Điện Thoại",
    email: "Email",
    address: "Địa Chỉ",
    bloodType: "Nhóm Máu",
    allergies: "Dị Ứng",
    chronicConditions: "Bệnh Mãn Tính",
    currentMedications: "Thuốc Đang Dùng",
    visitDate: "Ngày Khám",
    diagnosis: "Chẩn Đoán",
    doctor: "Bác Sĩ"
  }
};
export function PatientRecords({ language }: PatientRecordsProps) {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
const [filteredPatients, setFilteredPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  //const patientDetails = mockPatientDetails[language];

  // API_CALL: Load patients khi component mount
  useEffect(() => {
    loadPatients();
  }, []);

  // API_CALL: Function để gọi API lấy danh sách bệnh nhân
const loadPatients = async () => {
  try {
    setLoading(true);
    // Mở khóa gọi API thật từ services/api.ts
    const response = await getPatients(searchQuery); 
    setPatients(response); // Cập nhật mảng patients từ SQL
    setFilteredPatients(response);
  } catch (error) {
    console.error('Error loading patients:', error);
  } finally {
    setLoading(false);
  }
};

  // Xử lý search local (thay bằng API call khi có backend)
useEffect(() => {
  // Thay vì lọc local từ mockPatients, hãy gọi lại API khi searchQuery thay đổi
  const delayDebounceFn = setTimeout(() => {
    loadPatients(); // Gọi hàm load thực tế từ SQL [cite: 19]
  }, 300); // Đợi người dùng gõ xong 300ms rồi mới gọi API

  return () => clearTimeout(delayDebounceFn);
}, [searchQuery, language]);

  // API_CALL: Lấy chi tiết bệnh nhân khi click vào
const handleViewDetails = (patient: any) => {
  // Không gọi API nữa, dùng trực tiếp dữ liệu 'patient' có sẵn từ danh sách
  setSelectedPatient(patient); 
};
const getStatusBadge = (status: string) => {
  const s = status?.toLowerCase(); // Chuyển "Active" hoặc "active" thành "active" để so sánh
  switch (s) {
    case "active":
      return <Badge variant="default" className="bg-green-500">{t.active}</Badge>;
    case "followup":
      return <Badge variant="default" className="bg-blue-500">{t.followUp}</Badge>;
    case "critical":
      return <Badge variant="destructive">{t.critical}</Badge>;
    default:
      return <Badge>{status || "N/A"}</Badge>;
  }
};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.id}</TableHead>
                  <TableHead>{t.name}</TableHead>
                  <TableHead>{t.age}</TableHead>
                  <TableHead>{t.gender}</TableHead>
                  <TableHead>{t.lastVisit}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {language === 'en' ? 'No patients found' : 'Không tìm thấy bệnh nhân'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    {/* Hiển thị ID ngắn gọn cho đẹp */}
                    <TableCell className="font-medium">{patient.id.substring(0, 8)}...</TableCell>
                    
                    {/* Tên bệnh nhân lấy từ cột FullName trong SQL */}
                    <TableCell>{patient.fullName}</TableCell>
                    
                    {/* Tính tuổi dựa trên cột DateOfBirth */}
                    <TableCell>
                      {patient.dateOfBirth 
                        ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() 
                        : "N/A"}
                    </TableCell>
                    
                    <TableCell>{patient.gender}</TableCell>
                    
                    {/* Hiển thị ngày khám cuối nếu có */}
                    <TableCell>
                      {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString('vi-VN') : "-"}
                    </TableCell>
                                        
                                        {/* Hiển thị Badge màu sắc dựa trên Status */}
                    <TableCell>{getStatusBadge(patient.status)}</TableCell>
                    
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewDetails(patient)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t.view}
                      </Button>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t.patientDetails}
            </DialogTitle>
            <DialogDescription>
              {selectedPatient?.name} - {selectedPatient?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                {t.personalInfo}
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t.phone}</div>
                    <div className="text-sm font-medium">{selectedPatient?.phone || "N/A"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t.email}</div>
                    <div className="text-sm font-medium">{selectedPatient?.email || "N/A"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2 col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t.address}</div>
                    <div className="text-sm font-medium">{selectedPatient?.address || "N/A"}</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t.medicalHistory}
              </h3>
              <div className="space-y-3 bg-muted p-4 rounded-lg">
                <div>
                  <div className="text-sm font-medium mb-1">{t.bloodType}</div>
                  <Badge variant="outline">{selectedPatient?.bloodType || "N/A"}</Badge>
                </div>
                    <div className="text-sm font-medium mb-2">{t.allergies}</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedPatient?.allergies ? (
                          // Hiển thị trực tiếp nội dung chuỗi từ SQL
                          <Badge variant="destructive">
                            {selectedPatient.allergies}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            Không có dữ liệu dị ứng
                          </span>
                        )}
                      </div>
                        <div>
                          <div className="text-sm font-medium mb-2">{t.chronicConditions}</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedPatient?.chronicConditions ? (
                              // Hiển thị trực tiếp chuỗi văn bản từ SQL
                              <div className="text-sm p-2 bg-muted rounded-md w-full">
                                {selectedPatient.chronicConditions}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">
                                Không có tiền sử bệnh mãn tính
                              </span>
                            )}
                          </div>
                        </div>
                  <div>
                            <div className="text-sm font-medium mb-2">{t.currentMedications}</div>
                            <div className="flex flex-wrap gap-2">
                              {selectedPatient?.currentMedications ? (
                                // Hiển thị trực tiếp tên thuốc từ SQL (ví dụ: "Amlodipine")
                                <div className="text-sm p-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-md w-full font-medium">
                                  {selectedPatient.currentMedications}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">
                                  Không có thông tin đơn thuốc hiện tại
                                </span>
                              )}
                            </div>
                  </div>
              </div>
            </div>

            <div>
  <h3 className="font-semibold mb-3 flex items-center gap-2">
    <Calendar className="h-4 w-4" />
    {t.recentVisits}
          </h3>
            <div className="space-y-3">
              {selectedPatient?.visits && selectedPatient.visits.length > 0 ? (
                selectedPatient.visits.map((visit: any, i: number) => (
                  <div key={i} className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm font-medium">{visit.date}</div>
                      <Badge variant="outline">{visit.doctor}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{visit.diagnosis}</div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">Chưa có lịch sử khám bệnh trong SQL.</p>
              )}
            </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
