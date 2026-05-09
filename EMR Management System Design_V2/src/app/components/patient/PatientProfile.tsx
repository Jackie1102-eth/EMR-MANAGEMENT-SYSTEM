import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { User, Mail, Phone, MapPin, Calendar, Pill, Activity } from "lucide-react";
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
    allergiesHint: "Separate by comma (e.g. Penicillin, Aspirin)",
    chronicConditions: "Chronic Conditions",
    chronicHint: "Separate by comma (e.g. Diabetes, Hypertension)",
    currentMedications: "Current Medications",
    medsHint: "Separate by comma",
    edit: "Edit Profile",
    save: "Save Changes",
    cancel: "Cancel",
    updateSuccess: "Profile updated successfully",
    male: "Male",
    female: "Female",
    other: "Other",
    saving: "Saving...",
    noData: "—",
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
    allergiesHint: "Phân cách bằng dấu phẩy (vd: Penicillin, Aspirin)",
    chronicConditions: "Bệnh Mãn Tính",
    chronicHint: "Phân cách bằng dấu phẩy (vd: Tiểu đường, Huyết áp)",
    currentMedications: "Thuốc Đang Dùng",
    medsHint: "Phân cách bằng dấu phẩy",
    edit: "Chỉnh Sửa",
    save: "Lưu Thay Đổi",
    cancel: "Hủy",
    updateSuccess: "Cập nhật hồ sơ thành công",
    male: "Nam",
    female: "Nữ",
    other: "Khác",
    saving: "Đang lưu...",
    noData: "—",
  }
};

export function PatientProfile({ language }: PatientProfileProps) {
  const t = translations[language];

  const [profile, setProfile]           = useState<any>(null);
  const [editedProfile, setEditedProfile] = useState<any>(null);
  const [isEditing, setIsEditing]       = useState(false);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [alert, setAlert]               = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getPatientProfile();
      setProfile(data);
      setEditedProfile(data);
    } catch (error) {
      console.error('Lỗi khi tải hồ sơ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePatientProfile(editedProfile);
      setProfile(editedProfile);
      setIsEditing(false);
      setAlert({ message: t.updateSuccess, type: 'success' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error: any) {
      setAlert({ message: error.message || 'Cập nhật thất bại', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  // Helper: array → comma string cho edit, string → array cho hiển thị
  const arrToStr = (arr: string[] | undefined) => (arr ?? []).join(', ');
  const strToArr = (str: string) => str.split(',').map(s => s.trim()).filter(Boolean);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        <p className="ml-3">Đang lấy dữ liệu từ SQL Server...</p>
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
              <Button onClick={() => setIsEditing(true)}>{t.edit}</Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* ── Personal Information ── */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-4 w-4" /> {t.personalInfo}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label>{t.fullName}</Label>
                {isEditing ? (
                  <Input value={editedProfile.fullName}
                    onChange={e => setEditedProfile({ ...editedProfile, fullName: e.target.value })} />
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
                  <Input type="email" value={editedProfile.email}
                    onChange={e => setEditedProfile({ ...editedProfile, email: e.target.value })} />
                ) : (
                  <div className="p-2 bg-muted rounded flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {profile.email}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t.phone}</Label>
                {isEditing ? (
                  <Input value={editedProfile.phone}
                    onChange={e => setEditedProfile({ ...editedProfile, phone: e.target.value })} />
                ) : (
                  <div className="p-2 bg-muted rounded flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {profile.phone}
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
                  <Input value={editedProfile.address ?? ''}
                    onChange={e => setEditedProfile({ ...editedProfile, address: e.target.value })} />
                ) : (
                  <div className="p-2 bg-muted rounded flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {profile.address || t.noData}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── Medical Information ── */}
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" /> {t.medicalInfo}
            </h3>
            <div className="space-y-4 bg-muted/50 p-4 rounded-lg">

              {/* Blood Type */}
              <div className="space-y-2">
                <Label>{t.bloodType}</Label>
                {isEditing ? (
                  <select
                    className="w-full border rounded px-3 py-2 text-sm bg-background"
                    value={editedProfile.bloodType ?? ''}
                    onChange={e => setEditedProfile({ ...editedProfile, bloodType: e.target.value })}
                  >
                    <option value="">-- Chọn nhóm máu --</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                ) : (
                  <Badge variant="outline" className="text-base">
                    {profile.bloodType || t.noData}
                  </Badge>
                )}
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <Label>{t.allergies}</Label>
                {isEditing ? (
                  <>
                    <Input
                      placeholder={t.allergiesHint}
                      value={arrToStr(editedProfile.allergies)}
                      onChange={e => setEditedProfile({
                        ...editedProfile,
                        allergies: strToArr(e.target.value)
                      })}
                    />
                    <p className="text-xs text-muted-foreground">{t.allergiesHint}</p>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(profile.allergies ?? []).length > 0
                      ? profile.allergies.map((a: string, i: number) => (
                          <Badge key={i} variant="destructive">{a}</Badge>
                        ))
                      : <span className="text-sm text-muted-foreground">{t.noData}</span>
                    }
                  </div>
                )}
              </div>

              {/* Chronic Conditions */}
              <div className="space-y-2">
                <Label>{t.chronicConditions}</Label>
                {isEditing ? (
                  <>
                    <Input
                      placeholder={t.chronicHint}
                      value={arrToStr(editedProfile.chronicConditions)}
                      onChange={e => setEditedProfile({
                        ...editedProfile,
                        chronicConditions: strToArr(e.target.value)
                      })}
                    />
                    <p className="text-xs text-muted-foreground">{t.chronicHint}</p>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(profile.chronicConditions ?? []).length > 0
                      ? profile.chronicConditions.map((c: string, i: number) => (
                          <Badge key={i} variant="secondary">{c}</Badge>
                        ))
                      : <span className="text-sm text-muted-foreground">{t.noData}</span>
                    }
                  </div>
                )}
              </div>

              {/* Current Medications */}
              <div className="space-y-2">
                <Label>{t.currentMedications}</Label>
                {isEditing ? (
                  <>
                    <Input
                      placeholder={t.medsHint}
                      value={arrToStr(editedProfile.currentMedications)}
                      onChange={e => setEditedProfile({
                        ...editedProfile,
                        currentMedications: strToArr(e.target.value)
                      })}
                    />
                    <p className="text-xs text-muted-foreground">{t.medsHint}</p>
                  </>
                ) : (
                  <div className="space-y-1">
                    {(profile.currentMedications ?? []).length > 0
                      ? profile.currentMedications.map((m: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Pill className="h-4 w-4" /> {m}
                          </div>
                        ))
                      : <span className="text-sm text-muted-foreground">{t.noData}</span>
                    }
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── Action buttons ── */}
          {isEditing && (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? t.saving : t.save}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                {t.cancel}
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}