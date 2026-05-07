/**
 * API SERVICE - KẾT NỐI SQL SERVER
 *
 * File này chứa tất cả các hàm gọi API để kết nối với SQL Server backend
 * Thay thế các mock data bằng các API calls thực tế
 */

// Base API URL - Thay đổi URL này khi deploy
const API_BASE_URL = 'http://localhost:5041/api';

// Helper function để gọi API
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('authToken');

const response = await fetch(`${API_BASE_URL}${endpoint}`, {
  ...options,
  headers: {
    'Content-Type': 'application/json', // <<-- ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT
    'Accept': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
    ...options.headers,
  },
});

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API call failed');
  }

  return response.json();
};

// ==================== AUTHENTICATION ====================

/**
 * API: Đăng nhập
 * SQL: SELECT * FROM Users WHERE Email = @email AND PasswordHash = @passwordHash
 * Backend endpoint: POST /api/auth/login
 */
// TRONG FILE api.ts
// Thêm ": string" vào sau mỗi tham số để định nghĩa "type"
// Thêm : string để định nghĩa "type", giúp VS Code hết báo đỏ
export const login = async (email: string, password: string) => {
  return await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ 
      Email: email,    // Chữ E viết HOA
      Password: password // Chữ P viết HOA
    }),
  });
};
export const addPatient = async (patientData: any) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5041/api/patients', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(patientData)
  });
  return response.json();
};
/**
 * API: Đăng ký tài khoản
 * SQL: INSERT INTO Users (FullName, IDCard, Email, Phone, DateOfBirth, Gender, PasswordHash)
 * Backend endpoint: POST /api/auth/register
 */
export const register = async (userData: any) => {
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

/**
 * API: Gửi OTP
 * SQL: INSERT INTO OTPCodes (Email, Code, ExpiresAt)
 * Backend endpoint: POST /api/auth/send-otp
 */
export const sendOTP = async (email: string) => {
  return apiCall('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

/**
 * API: Xác thực OTP
 * SQL: SELECT * FROM OTPCodes WHERE Email = @email AND Code = @code AND ExpiresAt > GETDATE()
 * Backend endpoint: POST /api/auth/verify-otp
 */
export const verifyOTP = async (email: string, code: string) => {
  return apiCall('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
};

/**
 * API: Đặt lại mật khẩu
 * SQL: UPDATE Users SET PasswordHash = @newPasswordHash WHERE Email = @email
 * Backend endpoint: POST /api/auth/reset-password
 */
export const resetPassword = async (email: string, newPassword: string, otpCode: string) => {
  return apiCall('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, newPassword, otpCode }),
  });
};

// ==================== USER MANAGEMENT (ADMIN) ====================

/**
 * API: Lấy danh sách người dùng với search và phân trang
 * SQL: SELECT * FROM Users WHERE (Name LIKE @search OR Email LIKE @search OR IDCard LIKE @search)
 *      ORDER BY CreatedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
 * Backend endpoint: GET /api/users?search=&page=&limit=
 */
export const getUsers = async (search: string = '', page: number = 1, limit: number = 10) => {
  const params = new URLSearchParams({
    search,
    page: page.toString(),
    limit: limit.toString(),
  });
  return apiCall(`/users?${params}`);

  // Response structure:
  // {
  //   users: [{ id, name, email, idCard, role, status, phone }],
  //   total: 100,
  //   page: 1,
  //   totalPages: 10
  // }
};

/**
 * API: Tạo người dùng mới
 * SQL: INSERT INTO Users (FullName, Email, IDCard, Phone, Role, Status, PasswordHash)
 * Backend endpoint: POST /api/users
 */
export const createUser = async (userData: any) => {
  const response = await fetch('http://localhost:5041/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return response.json();
};

/**
 * API: Cập nhật thông tin người dùng
 * SQL: UPDATE Users SET Name = @name, Email = @email, Phone = @phone, Role = @role WHERE Id = @id
 * Backend endpoint: PUT /api/users/:id
 */
export const updateUser = async (userId: string, userData: any) => {
  return apiCall(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

/**
 * API: Khóa/Mở khóa tài khoản
 * SQL: UPDATE Users SET Status = @status WHERE Id = @id
 * Backend endpoint: PATCH /api/users/:id/status
 */
export const toggleUserLock = async (userId: string, status: 'active' | 'locked') => {
  return apiCall(`/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

/**
 * API: Xóa người dùng
 * SQL: DELETE FROM Users WHERE Id = @id
 * Backend endpoint: DELETE /api/users/:id
 */
export const deleteUser = async (userId: string) => {
  return apiCall(`/users/${userId}`, {
    method: 'DELETE',
  });
};

// ==================== PATIENT RECORDS ====================

/**
 * API: Lấy danh sách bệnh nhân với search
 * SQL: SELECT * FROM Patients p JOIN Users u ON p.UserId = u.Id
 *      WHERE (u.Name LIKE @search OR p.PatientId LIKE @search OR u.IDCard LIKE @search)
 * Backend endpoint: GET /api/patients?search=
 */
export const getPatients = async (search: string = '') => {
  const params = new URLSearchParams({ search });
  return apiCall(`/patients?${params}`);

  // Response structure:
  // {
  //   patients: [{ id, patientId, name, age, gender, lastVisit, status, email, phone }]
  // }
};

/**
 * API: Lấy chi tiết bệnh nhân
 * SQL: SELECT * FROM Patients WHERE Id = @id
 *      INCLUDE MedicalHistory, Visits, Medications, Allergies
 * Backend endpoint: GET /api/patients/:id
 */
export const getPatientDetails = async (id: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5041/api/patients/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) throw new Error("Không tìm thấy bệnh nhân");
  
  return await response.json(); // Lỗi xảy ra tại đây nếu Backend trả về rỗng
};

/**
 * API: Lấy Profile bệnh nhân (cho role Patient)
 * SQL: SELECT * FROM Patients WHERE UserId = @userId
 * Backend endpoint: GET /api/patients/profile
 */
export const getPatientProfile = async () => {
  return apiCall('/patients/profile');
};

/**
 * API: Cập nhật profile bệnh nhân
 * SQL: UPDATE Patients SET ... WHERE UserId = @userId
 * Backend endpoint: PUT /api/patients/profile
 */
export const updatePatientProfile = async (profileData: any) => {
  return apiCall('/patients/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

// ==================== MEDICAL RECORDS ====================

/**
 * API: Tạo bệnh án điện tử
 * SQL: INSERT INTO MedicalRecords (PatientId, DoctorId, Symptoms, Diagnosis, Conclusion, IsFinalized)
 * Backend endpoint: POST /api/medical-records
 */
export const createMedicalRecord = async (recordData: any) => {
  return apiCall('/medical-records', {
    method: 'POST',
    body: JSON.stringify(recordData),
  });
};

/**
 * API: Hoàn thành và khóa bệnh án
 * SQL: UPDATE MedicalRecords SET IsFinalized = 1, FinalizedAt = GETDATE() WHERE Id = @id
 * Backend endpoint: PATCH /api/medical-records/:id/finalize
 */
export const finalizeMedicalRecord = async (recordId: string) => {
  return apiCall(`/medical-records/${recordId}/finalize`, {
    method: 'PATCH',
  });
};

/**
 * API: Upload file đính kèm
 * SQL: INSERT INTO MedicalAttachments (RecordId, FileName, FilePath, FileType)
 * Backend endpoint: POST /api/medical-records/:id/attachments
 */
export const uploadMedicalFile = async (recordId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}/medical-records/${recordId}/attachments`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  return response.json();
};

// ==================== AI SCREENING ====================

/**
 * API: Sàng lọc triệu chứng bằng AI
 * SQL: INSERT INTO AIScreenings (PatientId, Symptoms, PredictedDiseases, Severity, RecommendedActions)
 * Backend endpoint: POST /api/ai/symptom-screening
 *
 * AI Model: Kết nối với model đã train để dự đoán bệnh
 */
export const aiSymptomScreening = async (symptoms: string, patientId?: string) => {
  return apiCall('/ai/symptom-screening', {
    method: 'POST',
    body: JSON.stringify({ symptoms, patientId }),
  });

  // Response structure:
  // {
  //   predictions: [
  //     { disease: "Disease Name", confidence: 0.85, icd10Code: "A00" }
  //   ],
  //   severity: "medium", // low, medium, high, critical
  //   urgency: "Schedule within 48 hours",
  //   recommendedTests: ["Test 1", "Test 2"],
  //   recommendedSpecialty: "Cardiology"
  // }
};

/**
 * API: Lấy gợi ý chẩn đoán từ AI
 * SQL: N/A - Gọi AI model
 * Backend endpoint: POST /api/ai/diagnosis-suggestion
 */
export const aiDiagnosisSuggestion = async (symptoms: string, medicalHistory: any) => {
  return apiCall('/ai/diagnosis-suggestion', {
    method: 'POST',
    body: JSON.stringify({ symptoms, medicalHistory }),
  });
};

// ==================== PRESCRIPTIONS ====================

/**
 * API: Tạo đơn thuốc
 * SQL: INSERT INTO Prescriptions (PatientId, DoctorId, MedicalRecordId, CreatedAt)
 *      INSERT INTO PrescriptionItems (PrescriptionId, MedicineId, Dosage, Frequency, Duration)
 * Backend endpoint: POST /api/prescriptions
 */
export const createPrescription = async (prescriptionData: any) => {
  return apiCall('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(prescriptionData),
  });
};

/**
 * API: Kiểm tra tương tác thuốc và dị ứng
 * SQL: SELECT * FROM PatientAllergies WHERE PatientId = @patientId
 *      SELECT * FROM DrugInteractions WHERE (Drug1Id = @drugId OR Drug2Id = @drugId)
 * Backend endpoint: POST /api/prescriptions/check-interactions
 */
export const checkDrugInteractions = async (patientId: string, medicineIds: string[]) => {
  return apiCall('/prescriptions/check-interactions', {
    method: 'POST',
    body: JSON.stringify({ patientId, medicineIds }),
  });

  // Response structure:
  // {
  //   allergies: ["Penicillin"],
  //   interactions: [
  //     { drug1: "Medicine A", drug2: "Medicine B", severity: "high", description: "..." }
  //   ]
  // }
};

/**
 * API: Tạo mã QR cho đơn thuốc
 * SQL: UPDATE Prescriptions SET QRCode = @qrCode WHERE Id = @id
 * Backend endpoint: POST /api/prescriptions/:id/qr-code
 */
export const generatePrescriptionQR = async (prescriptionId: string) => {
  return apiCall(`/prescriptions/${prescriptionId}/qr-code`, {
    method: 'POST',
  });
};

/**
 * API: Lấy danh sách thuốc
 * SQL: SELECT * FROM Medicines WHERE Name LIKE @search
 * Backend endpoint: GET /api/medicines?search=
 */
export const searchMedicines = async (search: string) => {
  const params = new URLSearchParams({ search });
  return apiCall(`/medicines?${params}`);
};

// ==================== APPOINTMENTS ====================

/**
 * API: Đặt lịch khám (Patient)
 * SQL: INSERT INTO Appointments (PatientId, DoctorId, DepartmentId, AppointmentDate, TimeSlot, Status)
 * Backend endpoint: POST /api/appointments
 */
export const bookAppointment = async (appointmentData: any) => {
  return apiCall('/appointments', {
    method: 'POST',
    body: JSON.stringify(appointmentData),
  });
};

/**
 * API: Lấy lịch khám của bệnh nhân
 * SQL: SELECT * FROM Appointments WHERE PatientId = @patientId ORDER BY AppointmentDate DESC
 * Backend endpoint: GET /api/appointments/patient
 */
export const getPatientAppointments = async () => {
  return apiCall('/appointments/patient');

  // Response structure:
  // {
  //   appointments: [
  //     { id, department, doctor, date, timeSlot, status, createdAt }
  //   ]
  // }
};

/**
 * API: Lấy lịch khám của bác sĩ
 * SQL: SELECT * FROM Appointments WHERE DoctorId = @doctorId
 *      AND AppointmentDate >= @fromDate ORDER BY AppointmentDate, TimeSlot
 * Backend endpoint: GET /api/appointments/doctor?from=&to=
 */
export const getDoctorAppointments = async (fromDate?: string, toDate?: string) => {
  const params = new URLSearchParams();
  if (fromDate) params.append('from', fromDate);
  if (toDate) params.append('to', toDate);

  return apiCall(`/appointments/doctor?${params}`);

  // Response structure:
  // {
  //   appointments: [
  //     {
  //       id, patientId, patientName, patientPhone,
  //       department, date, timeSlot, status, notes
  //     }
  //   ]
  // }
};

/**
 * API: Cập nhật trạng thái lịch khám
 * SQL: UPDATE Appointments SET Status = @status, Notes = @notes WHERE Id = @id
 * Backend endpoint: PATCH /api/appointments/:id/status
 */
export const updateAppointmentStatus = async (appointmentId: string, status: string, notes?: string) => {
  return apiCall(`/appointments/${appointmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
};

/**
 * API: Hủy lịch khám
 * SQL: UPDATE Appointments SET Status = 'cancelled', CancelledAt = GETDATE() WHERE Id = @id
 * Backend endpoint: DELETE /api/appointments/:id
 */
export const cancelAppointment = async (appointmentId: string, reason?: string) => {
  return apiCall(`/appointments/${appointmentId}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
};

/**
 * API: Kiểm tra slot còn trống
 * SQL: SELECT COUNT(*) FROM Appointments
 *      WHERE DoctorId = @doctorId AND AppointmentDate = @date AND TimeSlot = @slot
 * Backend endpoint: GET /api/appointments/check-availability
 */
export const checkAppointmentAvailability = async (doctorId: string, date: string, timeSlot: string) => {
  const params = new URLSearchParams({ doctorId, date, timeSlot });
  return apiCall(`/appointments/check-availability?${params}`);
};

/**
 * API: Lấy danh sách bác sĩ theo khoa
 * SQL: SELECT * FROM Doctors WHERE DepartmentId = @departmentId AND Status = 'active'
 * Backend endpoint: GET /api/doctors?department=
 */
export const getDoctorsByDepartment = async (departmentId: string) => {
  const params = new URLSearchParams({ department: departmentId });
  return apiCall(`/doctors?${params}`);
};

// ==================== PAYMENT & INSURANCE ====================

/**
 * API: Kiểm tra BHYT
 * SQL: SELECT * FROM InsuranceCards WHERE CardNumber = @cardNumber AND ExpiryDate > GETDATE()
 * Backend endpoint: POST /api/insurance/verify
 */
export const verifyInsurance = async (insuranceId: string) => {
  return apiCall('/insurance/verify', {
    method: 'POST',
    body: JSON.stringify({ insuranceId }),
  });

  // Response structure:
  // {
  //   valid: true,
  //   coverageRate: 0.8, // 80%
  //   expiryDate: "2027-12-31",
  //   isCorrectRoute: true
  // }
};

/**
 * API: Tạo hóa đơn
 * SQL: INSERT INTO Invoices (PatientId, TotalAmount, InsuranceAmount, PatientAmount, PaymentMethod)
 *      INSERT INTO InvoiceItems (InvoiceId, Service, Amount)
 * Backend endpoint: POST /api/invoices
 */
export const createInvoice = async (invoiceData: any) => {
  return apiCall('/invoices', {
    method: 'POST',
    body: JSON.stringify(invoiceData),
  });
};

/**
 * API: Xử lý thanh toán
 * SQL: UPDATE Invoices SET PaymentStatus = 'paid', PaidAt = GETDATE() WHERE Id = @id
 * Backend endpoint: POST /api/payments/process
 */
export const processPayment = async (invoiceId: string, paymentMethod: string, paymentData: any) => {
  return apiCall('/payments/process', {
    method: 'POST',
    body: JSON.stringify({ invoiceId, paymentMethod, paymentData }),
  });
};

// ==================== CHATBOT ====================

/**
 * API: Gửi tin nhắn đến chatbot
 * SQL: INSERT INTO ChatHistory (UserId, Message, Response, CreatedAt)
 * Backend endpoint: POST /api/chatbot/message
 */
export const sendChatMessage = async (message: string) => {
  return apiCall('/chatbot/message', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

  // Response structure:
  // {
  //   response: "Bot response message",
  //   suggestedActions: ["Book appointment", "View records"]
  // }
};

/**
 * API: Lấy lịch sử chat
 * SQL: SELECT * FROM ChatHistory WHERE UserId = @userId ORDER BY CreatedAt DESC
 * Backend endpoint: GET /api/chatbot/history
 */
export const getChatHistory = async () => {
  return apiCall('/chatbot/history');
};

// ==================== REPORTS (ADMIN) ====================

/**
 * API: Báo cáo thống kê tổng quan
 * SQL: Multiple queries for dashboard statistics
 * Backend endpoint: GET /api/reports/dashboard
 */
export const getDashboardStats = async (fromDate?: string, toDate?: string) => {
  const params = new URLSearchParams();
  if (fromDate) params.append('from', fromDate);
  if (toDate) params.append('to', toDate);

  return apiCall(`/reports/dashboard?${params}`);
};

/**
 * API: Báo cáo doanh thu
 * SQL: SELECT SUM(TotalAmount) FROM Invoices WHERE PaidAt BETWEEN @from AND @to
 * Backend endpoint: GET /api/reports/revenue
 */
export const getRevenueReport = async (fromDate: string, toDate: string) => {
  const params = new URLSearchParams({ from: fromDate, to: toDate });
  return apiCall(`/reports/revenue?${params}`);
};

/**
 * API: Export báo cáo
 * Backend endpoint: GET /api/reports/export?type=excel|pdf
 */
export const exportReport = async (reportType: string, format: 'excel' | 'pdf') => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(
    `${API_BASE_URL}/reports/export?type=${reportType}&format=${format}`,
    {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    }
  );

  const blob = await response.blob();
  return blob;
};

// ==================== AUDIT LOG ====================

/**
 * API: Ghi log hoạt động
 * SQL: INSERT INTO AuditLogs (UserId, Action, EntityType, EntityId, Details, IPAddress)
 * Backend endpoint: POST /api/audit/log
 */
export const logActivity = async (action: string, entityType: string, entityId: string, details: any) => {
  return apiCall('/audit/log', {
    method: 'POST',
    body: JSON.stringify({ action, entityType, entityId, details }),
  });
};

/**
 * API: Lấy lịch sử audit log
 * SQL: SELECT * FROM AuditLogs ORDER BY CreatedAt DESC
 * Backend endpoint: GET /api/audit/logs
 */
export const getAuditLogs = async (userId?: string, fromDate?: string, toDate?: string) => {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (fromDate) params.append('from', fromDate);
  if (toDate) params.append('to', toDate);

  return apiCall(`/audit/logs?${params}`);
};
