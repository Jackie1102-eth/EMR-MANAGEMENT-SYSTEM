import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { User, Mail, Phone, MapPin, Calendar, FileText, Pill, Activity } from "lucide-react";
// API_CALL: Import API functions
import { getPatientProfile, updatePatientProfile } from "../../services/api";

interface PatientProfileProps {
  language: 'en' | 'vn';
}
const translations = {
  en: {
    title: "My Profile",
    description: "View and update your personal information",
    personalInfo: "Personal Information",
    fullName: "Full Name",
    email: "Email",
    phone: "Phone Number",
    dateOfBirth: "Date of Birth",
    gender: "Gender",
    address: "Address",
    idCard: "ID Card Number",
    medicalInfo: "Medical Information",
    bloodType: "Blood Type",
    allergies: "Allergies",
    chronicConditions: "Chronic Conditions",
    currentMedications: "Current Medications",
    emergencyContact: "Emergency Contact",
    contactName: "Contact Name",
    contactPhone: "Contact Phone",
    relationship: "Relationship",
    edit: "Edit Profile",
    save: "Save Changes",
    cancel: "Cancel",
    updateSuccess: "Profile updated successfully",
    male: "Male",
    female: "Female",
    other: "Other"
  },
  vn: {
    title: "Hồ Sơ Của Tôi",
    description: "Xem và cập nhật thông tin cá nhân",
    personalInfo: "Thông Tin Cá Nhân",
    fullName: "Họ và Tên",
    email: "Email",
    phone: "Số Điện Thoại",
    dateOfBirth: "Ngày Sinh",
    gender: "Giới Tính",
    address: "Địa Chỉ",
    idCard: "Số CCCD",
    medicalInfo: "Thông Tin Y Tế",
    bloodType: "Nhóm Máu",
    allergies: "Dị Ứng",
    chronicConditions: "Bệnh Mãn Tính",
    currentMedications: "Thuốc Đang Dùng",
    emergencyContact: "Liên Hệ Khẩn Cấp",
    contactName: "Tên Người Liên Hệ",
    contactPhone: "Số Điện Thoại",
    relationship: "Mối Quan Hệ",
    edit: "Chỉnh Sửa",
    save: "Lưu Thay Đổi",
    cancel: "Hủy",
    updateSuccess: "Cập nhật hồ sơ thành công",
    male: "Nam",
    female: "Nữ",
    other: "Khác"
  }
};

// Mock profile data
export function PatientProfile({ language }: PatientProfileProps) {
  const t = translations[language];

  // --- PHẦN CẦN THÊM/SỬA Ở ĐÂY ---
  const [profile, setProfile] = useState<any>(null); // Lưu dữ liệu gốc từ SQL
  const [editedProfile, setEditedProfile] = useState<any>(null); // Lưu dữ liệu khi đang chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true); // Để mặc định là true để hiện vòng xoay khi đang tải
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // --- KẾT THÚC PHẦN THÊM ---

  // API_CALL: Load profile khi component mount
  useEffect(() => {
    loadProfile();
  }, []);

    
const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await getPatientProfile(); 
      setProfile(profileData);
      setEditedProfile(profileData);
    } catch (error) {
      console.error('Lỗi khi tải hồ sơ:', error);
    } finally {
      setLoading(false);
    }
  }
if (loading || !profile) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="ml-3">Đang lấy dữ liệu từ SQL Server...</p>
      </div>
    );
  }
  // API_CALL: Lưu thông tin profile
  const handleSave = async () => {
    try {
      setLoading(true);

      // Uncomment khi có backend API
      // await updatePatientProfile(editedProfile);

      // Mock - xóa dòng này khi có API
      setProfile(editedProfile);

      setIsEditing(false);
      setAlert({ message: t.updateSuccess, type: 'success' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setAlert({ message: 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                {t.title}
              </CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                {t.edit}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              {t.personalInfo}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.fullName}</Label>
                {isEditing ? (
                  <Input
                    value={editedProfile.fullName}
                    onChange={(e) => setEditedProfile({ ...editedProfile, fullName: e.target.value })}
                  />
                ) : (
                  <div className="p-2 bg-muted rounded">{profile.fullName}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.idCard}</Label>
                <div className="p-2 bg-muted rounded">{profile.idCard}</div>
              </div>

              <div className="space-y-2">
                <Label>{t.email}</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                  />
                ) : (
                  <div className="p-2 bg-muted rounded flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.phone}</Label>
                {isEditing ? (
                  <Input
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                  />
                ) : (
                  <div className="p-2 bg-muted rounded flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.dateOfBirth}</Label>
                <div className="p-2 bg-muted rounded flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(profile.dateOfBirth).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.gender}</Label>
                <div className="p-2 bg-muted rounded">
                  {profile.gender === 'male' ? t.male : profile.gender === 'female' ? t.female : t.other}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>{t.address}</Label>
                {isEditing ? (
                  <Input
                    value={editedProfile.address}
                    onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                  />
                ) : (
                  <div className="p-2 bg-muted rounded flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {profile.address}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t.medicalInfo}
            </h3>
            <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
              <div>
                <Label className="mb-2 block">{t.bloodType}</Label>
                <Badge variant="outline" className="text-base">
                  {profile.bloodType}
                </Badge>
              </div>

              <div>
                <Label className="mb-2 block">{t.allergies}</Label>
                <div className="flex flex-wrap gap-2">
                  {(profile?.allergies || []).map((allergy: any, i: number) => (
                    <Badge key={i} variant="destructive">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">{t.chronicConditions}</Label>
                <div className="flex flex-wrap gap-2">
                  {(profile?.chronicConditions || []).map((condition: any, i: number) => (
                    <Badge key={i} variant="secondary">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">{t.currentMedications}</Label>
                <div className="space-y-2">
                  {(profile?.currentMedications || []).map((med: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Pill className="h-4 w-4 mt-0.5" />
                      {med}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="font-semibold mb-4">{t.emergencyContact}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="space-y-2">
                <Label>{t.contactName}</Label>
                {isEditing ? (
                  <Input
                    value={editedProfile.emergencyContact.name}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      emergencyContact: { ...editedProfile.emergencyContact, name: e.target.value }
                    })}
                  />
                ) : (
                  <div className="font-medium">{profile.emergencyContact.name}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.contactPhone}</Label>
                {isEditing ? (
                  <Input
                    value={editedProfile.emergencyContact.phone}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      emergencyContact: { ...editedProfile.emergencyContact, phone: e.target.value }
                    })}
                  />
                ) : (
                  <div className="font-medium">{profile.emergencyContact.phone}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.relationship}</Label>
                {isEditing ? (
                  <Input
                    value={editedProfile.emergencyContact.relationship}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      emergencyContact: { ...editedProfile.emergencyContact, relationship: e.target.value }
                    })}
                  />
                ) : (
                  <div className="font-medium">{profile.emergencyContact.relationship}</div>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (language === 'en' ? 'Saving...' : 'Đang lưu...') : t.save}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                {t.cancel}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
