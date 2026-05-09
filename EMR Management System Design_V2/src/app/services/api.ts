/**
 * API SERVICE
 * Login → backend thật
 * Register/ForgotPassword → EmailJS gửi email + backend lưu OTP + backend tạo tài khoản
 */

const API_BASE_URL = 'http://localhost:5041/api';

const EMAILJS_SERVICE_ID       = 'service_aoi034g';
const EMAILJS_TEMPLATE_ID      = 'template_5mo81mr';      // quên mật khẩu
const EMAILJS_TEMPLATE_REGISTER = 'template_08b9wvs';     // ← ID template mới của đăng ký
const EMAILJS_PUBLIC_KEY       = 'sVSCLgHBuLmVpVWQ6';

// ==================== HELPER ====================

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API call failed');
  }
  return response.json();
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== OTP STORE (frontend, chỉ để verify) ====================
// Backend là nơi xác thực thật, frontend chỉ giữ OTP tạm để gửi lên
const _localOtpStore: Record<string, string> = {};

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ==================== GỬI EMAIL QUA EMAILJS ====================

async function sendOtpEmail(
  toEmail: string, 
  otp: string, 
  subject: string,
  templateId: string = EMAILJS_TEMPLATE_ID  // mặc định dùng template quên mật khẩu
): Promise<void> {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:  EMAILJS_SERVICE_ID,
      template_id: templateId,
      user_id:     EMAILJS_PUBLIC_KEY,
      template_params: {
        email:    toEmail,   // {{email}} trong template EmailJS
        to_name:  toEmail,
        subject:  subject,
        otp:      otp,
      },
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Không thể gửi email OTP: ${msg}`);
  }
}

// ==================== AUTHENTICATION ====================

export const login = async (email: string, password: string) => {
  return await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ Email: email, Password: password }),
  });
};

// ==================== ĐĂNG KÝ ====================

export interface RegisterPayload {
  fullName: string;
  idNumber: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  password: string;
}

/**
 * Bước 1:
 * 1. Tạo OTP
 * 2. EmailJS gửi email thật đến người dùng
 * 3. Backend lưu OTP để xác thực sau
 */
export const registerSendOtp = async (payload: RegisterPayload): Promise<void> => {
  const otp = generateOtp();
  _localOtpStore[`register:${payload.email}`] = otp;

  // Gửi email thật qua EmailJS
  await sendOtpEmail(payload.email, otp, 'Mã OTP xác thực đăng ký tài khoản EMR', EMAILJS_TEMPLATE_REGISTER);

  // Gửi OTP lên backend để lưu (backend sẽ dùng để xác thực bước 2)
  await apiCall('/auth/register/save-otp', {
    method: 'POST',
    body: JSON.stringify({ email: payload.email, otp }),
  });

  // Lưu tạm payload để dùng ở bước 2
  sessionStorage.setItem(`pending_reg:${payload.email}`, JSON.stringify(payload));
};

/**
 * Bước 2:
 * Frontend gửi OTP + thông tin đăng ký lên backend
 * Backend xác thực OTP và tạo tài khoản trong database
 */
export const registerVerifyOtp = async (email: string, otp: string): Promise<void> => {
  const raw = sessionStorage.getItem(`pending_reg:${email}`);
  if (!raw) throw new Error('Không tìm thấy thông tin đăng ký. Vui lòng thử lại.');

  const payload: RegisterPayload = JSON.parse(raw);

  // Backend xác thực OTP và tạo tài khoản
  await apiCall('/auth/register/verify-otp', {
    method: 'POST',
    body: JSON.stringify({
      fullName:  payload.fullName,
      idNumber:  payload.idNumber,
      email:     payload.email,
      phone:     payload.phone,
      password:  payload.password,
      otp:       otp,
    }),
  });

  sessionStorage.removeItem(`pending_reg:${email}`);
  delete _localOtpStore[`register:${email}`];
};

// ==================== QUÊN MẬT KHẨU ====================

/**
 * Bước 1: Tạo OTP → EmailJS gửi email → backend lưu OTP
 */
export const forgotPasswordSendOtp = async (emailOrPhone: string): Promise<void> => {
  const otp = generateOtp();

  await sendOtpEmail(emailOrPhone, otp, 'Mã OTP đặt lại mật khẩu EMR');

  await apiCall('/auth/forgot-password/save-otp', {
    method: 'POST',
    body: JSON.stringify({ email: emailOrPhone, otp }),
  });
};

/**
 * Bước 2: Xác thực OTP → backend trả về resetToken
 */
export const forgotPasswordVerifyOtp = async (
  emailOrPhone: string,
  otp: string
): Promise<{ resetToken: string }> => {
  return await apiCall('/auth/forgot-password/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ emailOrPhone, otp }),
  });
};

/**
 * Bước 3: Đặt mật khẩu mới trong database
 */
export const resetPassword = async (resetToken: string, newPassword: string): Promise<void> => {
  await apiCall('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ resetToken, newPassword }),
  });
};

// ==================== USER MANAGEMENT (ADMIN) ====================

export const addPatient = async (patientData: any) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5041/api/patients', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData),
  });
  return response.json();
};

export const getUsers = async (search: string = '', page: number = 1, limit: number = 10) => {
  const params = new URLSearchParams({ search, page: page.toString(), limit: limit.toString() });
  return apiCall(`/users?${params}`);
};

export const createUser = async (userData: any) => {
  const response = await fetch('http://localhost:5041/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return response.json();
};

export const updateUser = async (id: string, userData: any) => {
  const response = await fetch(`http://localhost:5041/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Cập nhật thất bại');
  }
  return response.json();
};

export const toggleUserLock = async (id: string) => {
  const response = await fetch(`http://localhost:5041/api/users/${id}/toggle-lock`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to toggle lock status');
  return response.json();
};

export const deleteUser = async (id: string) => {
  const response = await fetch(`http://localhost:5041/api/users/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Xóa thất bại');
  }
  return response.json();
};

// ==================== PATIENT RECORDS ====================

export const getPatients = async (search: string = '') => {
  const params = new URLSearchParams({ search });
  return apiCall(`/patients?${params}`);
};

export const getPatientDetails = async (id: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5041/api/patients/${id}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Không tìm thấy bệnh nhân');
  return response.json();
};

export const getPatientProfile = async () => {
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || '';
  if (!userId) throw new Error('Chưa đăng nhập. Không tìm thấy userId trong localStorage.');

  const response = await fetch(`http://localhost:5041/api/patients/profile?userId=${userId}`, {
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || `Lỗi ${response.status}`);
  }
  const data = await response.json();
  return {
    id: data.id,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    address: data.address,
    idCard: data.idCard,
    bloodType: data.bloodType,
    allergies: data.allergies ? data.allergies.split(',').map((s: string) => s.trim()) : [],
    chronicConditions: data.chronicConditions ? data.chronicConditions.split(',').map((s: string) => s.trim()) : [],
    currentMedications: data.currentMedications ? data.currentMedications.split(',').map((s: string) => s.trim()) : [],
    emergencyContact: { name: '', phone: '', relationship: '' },
  };
};

export const updatePatientProfile = async (profileData: any) => {
  const userId = localStorage.getItem('userId') || '';
  if (!userId) throw new Error('Chưa đăng nhập.');
  const response = await fetch(`http://localhost:5041/api/patients/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      FullName: profileData.fullName,
      Phone:    profileData.phone,
      Email:    profileData.email,
      Address:  profileData.address,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.message || 'Cập nhật thất bại');
  }
  return response.json();
};

// ==================== MEDICAL RECORDS ====================

export const createMedicalRecord  = async (recordData: any) =>
  apiCall('/medical-records', { method: 'POST', body: JSON.stringify(recordData) });

export const finalizeMedicalRecord = async (recordId: string) =>
  apiCall(`/medical-records/${recordId}/finalize`, { method: 'PATCH' });

export const uploadMedicalFile = async (recordId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}/attachments`, {
    method: 'POST',
    headers: { 'Authorization': token ? `Bearer ${token}` : '' },
    body: formData,
  });
  return response.json();
};

// ==================== AI SCREENING ====================

export const aiSymptomScreening = async (symptoms: string, patientId?: string) =>
  apiCall('/ai/symptom-screening', { method: 'POST', body: JSON.stringify({ symptoms, patientId }) });

export const aiDiagnosisSuggestion = async (symptoms: string, medicalHistory: any) =>
  apiCall('/ai/diagnosis-suggestion', { method: 'POST', body: JSON.stringify({ symptoms, medicalHistory }) });

// ==================== PRESCRIPTIONS ====================

export const createPrescription   = async (data: any) =>
  apiCall('/prescriptions', { method: 'POST', body: JSON.stringify(data) });

export const checkDrugInteractions = async (patientId: string, medicineIds: string[]) =>
  apiCall('/prescriptions/check-interactions', { method: 'POST', body: JSON.stringify({ patientId, medicineIds }) });

export const generatePrescriptionQR = async (prescriptionId: string) =>
  apiCall(`/prescriptions/${prescriptionId}/qr-code`, { method: 'POST' });

export const searchMedicines = async (search: string) =>
  apiCall(`/medicines?${new URLSearchParams({ search })}`);

// ==================== APPOINTMENTS ====================

export const bookAppointment = async (data: any) =>
  apiCall('/appointments', { method: 'POST', body: JSON.stringify(data) });

export const getPatientAppointments = async () => {
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || '';
  if (!userId) throw new Error('Chưa đăng nhập.');
  return apiCall(`/appointments/my?userId=${userId}`);
};

export const getDoctorAppointments = async (fromDate?: string, toDate?: string) => {
  const params = new URLSearchParams();
  if (fromDate) params.append('from', fromDate);
  if (toDate)   params.append('to', toDate);
  return apiCall(`/appointments/doctor?${params}`);
};

export const updateAppointmentStatus = async (appointmentId: string, status: string, notes?: string) =>
  apiCall(`/appointments/${appointmentId}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) });

export const cancelAppointment = async (appointmentId: string, reason?: string) => {
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id') || '';
  return apiCall(`/appointments/${appointmentId}/cancel?userId=${userId}`, { method: 'PUT', body: JSON.stringify({ reason }) });
};

export const checkAppointmentAvailability = async (doctorId: string, date: string, timeSlot: string) =>
  apiCall(`/appointments/check-availability?${new URLSearchParams({ doctorId, date, timeSlot })}`);

export const getDoctorsByDepartment = async (departmentId: string) =>
  apiCall(`/doctors?${new URLSearchParams({ department: departmentId })}`);

export const getAvailableSlots = async (doctorId: string, date: string): Promise<string[]> =>
  apiCall(`/appointments/available-slots?doctorId=${doctorId}&date=${date}`);

// ==================== PAYMENT & INSURANCE ====================

export const verifyInsurance = async (insuranceId: string) =>
  apiCall('/insurance/verify', { method: 'POST', body: JSON.stringify({ insuranceId }) });

export const createInvoice = async (invoiceData: any) =>
  apiCall('/invoices', { method: 'POST', body: JSON.stringify(invoiceData) });

export const processPayment = async (invoiceId: string, paymentMethod: string, paymentData: any) =>
  apiCall('/payments/process', { method: 'POST', body: JSON.stringify({ invoiceId, paymentMethod, paymentData }) });

// ==================== CHATBOT ====================

export const sendChatMessage = async (message: string) =>
  apiCall('/chatbot/message', { method: 'POST', body: JSON.stringify({ message }) });

export const getChatHistory = async () => apiCall('/chatbot/history');

// ==================== REPORTS (ADMIN) ====================

export const getDashboardStats = async (fromDate?: string, toDate?: string) => {
  const params = new URLSearchParams();
  if (fromDate) params.append('from', fromDate);
  if (toDate)   params.append('to', toDate);
  return apiCall(`/reports/dashboard?${params}`);
};

export const getRevenueReport = async (fromDate: string, toDate: string) =>
  apiCall(`/reports/revenue?${new URLSearchParams({ from: fromDate, to: toDate })}`);

export const exportReport = async (reportType: string, format: 'excel' | 'pdf') => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}/reports/export?type=${reportType}&format=${format}`, {
    headers: { 'Authorization': token ? `Bearer ${token}` : '' },
  });
  return response.blob();
};

// ==================== AUDIT LOG ====================

export const logActivity = async (action: string, entityType: string, entityId: string, details: any) =>
  apiCall('/audit/log', { method: 'POST', body: JSON.stringify({ action, entityType, entityId, details }) });

export const getAuditLogs = async (userId?: string, fromDate?: string, toDate?: string) => {
  const params = new URLSearchParams();
  if (userId)   params.append('userId', userId);
  if (fromDate) params.append('from', fromDate);
  if (toDate)   params.append('to', toDate);
  return apiCall(`/audit/logs?${params}`);
};