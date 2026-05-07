# API DOCUMENTATION - HƯỚNG DẪN KẾT NỐI SQL SERVER

## 📋 Tổng Quan

Tài liệu này hướng dẫn chi tiết cách kết nối hệ thống EMR Frontend với SQL Server Backend.

Tất cả các API calls đã được chuẩn bị sẵn trong file: **`src/app/services/api.ts`**

## 🔧 Cấu Hình Backend

### 1. Thiết lập URL Backend

Trong file `src/app/services/api.ts`, thay đổi `API_BASE_URL`:

```typescript
const API_BASE_URL = 'http://localhost:5000/api'; // Development
// hoặc
const API_BASE_URL = 'https://your-domain.com/api'; // Production
```

Hoặc sử dụng environment variable:
```bash
# .env file
REACT_APP_API_URL=http://localhost:5000/api
```

### 2. Cấu Trúc SQL Server Database

#### Các bảng chính cần tạo:

```sql
-- Users Table
CREATE TABLE Users (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    FullName NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    IDCard NVARCHAR(50) UNIQUE NOT NULL,
    Phone NVARCHAR(20),
    DateOfBirth DATE,
    Gender NVARCHAR(10),
    PasswordHash NVARCHAR(500) NOT NULL,
    Role NVARCHAR(50) NOT NULL, -- admin, doctor, nurse, patient
    Status NVARCHAR(20) DEFAULT 'active', -- active, locked
    FailedLoginAttempts INT DEFAULT 0,
    LockedUntil DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- OTP Codes Table
CREATE TABLE OTPCodes (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Email NVARCHAR(255) NOT NULL,
    Code NVARCHAR(10) NOT NULL,
    ExpiresAt DATETIME NOT NULL,
    Used BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Patients Table
CREATE TABLE Patients (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    PatientId NVARCHAR(50) UNIQUE NOT NULL,
    BloodType NVARCHAR(5),
    Address NVARCHAR(500),
    EmergencyContactName NVARCHAR(255),
    EmergencyContactPhone NVARCHAR(20),
    EmergencyContactRelationship NVARCHAR(100),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Patient Allergies
CREATE TABLE PatientAllergies (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PatientId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Patients(Id),
    AllergyName NVARCHAR(255) NOT NULL,
    Severity NVARCHAR(50), -- mild, moderate, severe
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Chronic Conditions
CREATE TABLE ChronicConditions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PatientId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Patients(Id),
    ConditionName NVARCHAR(255) NOT NULL,
    DiagnosedDate DATE,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Current Medications
CREATE TABLE CurrentMedications (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PatientId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Patients(Id),
    MedicationName NVARCHAR(255) NOT NULL,
    Dosage NVARCHAR(100),
    Frequency NVARCHAR(100),
    StartDate DATE,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Medical Records
CREATE TABLE MedicalRecords (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PatientId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Patients(Id),
    DoctorId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    Symptoms NVARCHAR(MAX),
    Diagnosis NVARCHAR(MAX),
    Conclusion NVARCHAR(MAX),
    IsFinalized BIT DEFAULT 0,
    FinalizedAt DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Medical Attachments
CREATE TABLE MedicalAttachments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RecordId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES MedicalRecords(Id),
    FileName NVARCHAR(255) NOT NULL,
    FilePath NVARCHAR(500) NOT NULL,
    FileType NVARCHAR(50), -- pdf, jpg, png
    FileSize BIGINT,
    UploadedAt DATETIME DEFAULT GETDATE()
);

-- Medicines
CREATE TABLE Medicines (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255) NOT NULL,
    Type NVARCHAR(100), -- Antibiotic, Analgesic, etc.
    ContainsPenicillin BIT DEFAULT 0,
    Unit NVARCHAR(50),
    Description NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Prescriptions
CREATE TABLE Prescriptions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PatientId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Patients(Id),
    DoctorId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    MedicalRecordId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES MedicalRecords(Id),
    QRCode NVARCHAR(500),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Prescription Items
CREATE TABLE PrescriptionItems (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PrescriptionId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Prescriptions(Id),
    MedicineId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Medicines(Id),
    Dosage NVARCHAR(100),
    Frequency NVARCHAR(100),
    Duration INT, -- days
    Notes NVARCHAR(500)
);

-- Departments
CREATE TABLE Departments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255) NOT NULL,
    NameVN NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Doctors
CREATE TABLE Doctors (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    DepartmentId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Departments(Id),
    Specialty NVARCHAR(255),
    SpecialtyVN NVARCHAR(255),
    LicenseNumber NVARCHAR(100),
    Status NVARCHAR(20) DEFAULT 'active',
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Appointments
CREATE TABLE Appointments (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PatientId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Patients(Id),
    DoctorId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Doctors(Id),
    DepartmentId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Departments(Id),
    AppointmentDate DATE NOT NULL,
    TimeSlot NVARCHAR(10) NOT NULL, -- "09:00"
    Status NVARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    Notes NVARCHAR(MAX),
    CancelledAt DATETIME NULL,
    CancellationReason NVARCHAR(500),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Insurance Cards
CREATE TABLE InsuranceCards (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PatientId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Patients(Id),
    CardNumber NVARCHAR(100) UNIQUE NOT NULL,
    IssueDate DATE,
    ExpiryDate DATE,
    CoverageRate DECIMAL(3,2), -- 0.80 for 80%
    IsCorrectRoute BIT DEFAULT 1,
    Status NVARCHAR(20) DEFAULT 'active',
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Invoices
CREATE TABLE Invoices (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PatientId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Patients(Id),
    AppointmentId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Appointments(Id),
    TotalAmount DECIMAL(18,2) NOT NULL,
    InsuranceAmount DECIMAL(18,2) DEFAULT 0,
    PatientAmount DECIMAL(18,2) NOT NULL,
    PaymentMethod NVARCHAR(50), -- qr, vnpay, card
    PaymentStatus NVARCHAR(50) DEFAULT 'pending', -- pending, paid, failed
    PaidAt DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Invoice Items
CREATE TABLE InvoiceItems (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    InvoiceId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Invoices(Id),
    Service NVARCHAR(255) NOT NULL,
    Amount DECIMAL(18,2) NOT NULL
);

-- AI Screenings
CREATE TABLE AIScreenings (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PatientId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Patients(Id) NULL,
    Symptoms NVARCHAR(MAX) NOT NULL,
    PredictedDiseases NVARCHAR(MAX), -- JSON array
    Severity NVARCHAR(50), -- low, medium, high, critical
    Urgency NVARCHAR(500),
    RecommendedActions NVARCHAR(MAX), -- JSON array
    RecommendedSpecialty NVARCHAR(255),
    Confidence DECIMAL(3,2),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Chat History
CREATE TABLE ChatHistory (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    Message NVARCHAR(MAX) NOT NULL,
    Response NVARCHAR(MAX) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Audit Logs
CREATE TABLE AuditLogs (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id) NULL,
    Action NVARCHAR(255) NOT NULL, -- login, create, update, delete
    EntityType NVARCHAR(100), -- user, patient, appointment
    EntityId UNIQUEIDENTIFIER NULL,
    Details NVARCHAR(MAX), -- JSON
    IPAddress NVARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- Notifications
CREATE TABLE Notifications (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER FOREIGN KEY REFERENCES Users(Id),
    Type NVARCHAR(50), -- email, sms, push
    Subject NVARCHAR(255),
    Message NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
    SentAt DATETIME NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
```

## 📡 API Endpoints Backend Cần Implement

### 1. AUTHENTICATION (`/api/auth/*`)

#### POST `/api/auth/login`
```csharp
// Request
{
  "email": "string",
  "password": "string",
  "remember": boolean
}

// Response
{
  "success": true,
  "token": "jwt_token_string",
  "user": {
    "id": "guid",
    "email": "string",
    "name": "string",
    "role": "admin|doctor|nurse|patient"
  },
  "expiresIn": 604800
}

// SQL Query
SELECT Id, FullName, Email, Role, PasswordHash, FailedLoginAttempts, LockedUntil, Status
FROM Users
WHERE Email = @email

-- Validate password
-- If success: UPDATE Users SET FailedLoginAttempts = 0 WHERE Id = @id
-- If fail: UPDATE Users SET FailedLoginAttempts = FailedLoginAttempts + 1 WHERE Id = @id
-- If FailedLoginAttempts >= 5: UPDATE Users SET LockedUntil = DATEADD(MINUTE, 15, GETDATE())

-- Insert audit log
INSERT INTO AuditLogs (UserId, Action, IPAddress, CreatedAt)
VALUES (@userId, 'login', @ipAddress, GETDATE())
```

#### POST `/api/auth/register`
```csharp
// Request
{
  "fullName": "string",
  "idCard": "string",
  "email": "string",
  "phone": "string",
  "dateOfBirth": "date",
  "gender": "male|female|other",
  "password": "string"
}

// SQL Query
INSERT INTO Users (FullName, IDCard, Email, Phone, DateOfBirth, Gender, PasswordHash, Role, Status)
VALUES (@fullName, @idCard, @email, @phone, @dob, @gender, @passwordHash, 'patient', 'inactive')

-- Generate OTP
INSERT INTO OTPCodes (Email, Code, ExpiresAt)
VALUES (@email, @otpCode, DATEADD(MINUTE, 5, GETDATE()))

-- Send OTP email
```

#### POST `/api/auth/verify-otp`
```csharp
// SQL Query
SELECT * FROM OTPCodes
WHERE Email = @email AND Code = @code AND ExpiresAt > GETDATE() AND Used = 0

-- If valid
UPDATE OTPCodes SET Used = 1 WHERE Id = @otpId
UPDATE Users SET Status = 'active' WHERE Email = @email
```

### 2. USER MANAGEMENT (`/api/users/*`)

#### GET `/api/users?search=&page=1&limit=10`
```csharp
// SQL Query
SELECT Id, FullName, Email, IDCard, Phone, Role, Status
FROM Users
WHERE (FullName LIKE '%' + @search + '%' OR Email LIKE '%' + @search + '%' OR IDCard LIKE '%' + @search + '%')
ORDER BY CreatedAt DESC
OFFSET (@page - 1) * @limit ROWS
FETCH NEXT @limit ROWS ONLY

-- Count total
SELECT COUNT(*) FROM Users WHERE (...)
```

#### POST `/api/users`
```csharp
// SQL Query
INSERT INTO Users (FullName, Email, IDCard, Phone, Role, PasswordHash, Status)
VALUES (@name, @email, @idCard, @phone, @role, @passwordHash, 'active')
```

### 3. PATIENT RECORDS (`/api/patients/*`)

#### GET `/api/patients?search=`
```csharp
// SQL Query
SELECT p.*, u.FullName, u.Email, u.Phone, u.DateOfBirth, u.Gender, u.IDCard
FROM Patients p
JOIN Users u ON p.UserId = u.Id
WHERE u.FullName LIKE '%' + @search + '%'
   OR p.PatientId LIKE '%' + @search + '%'
   OR u.IDCard LIKE '%' + @search + '%'
ORDER BY p.CreatedAt DESC
```

#### GET `/api/patients/{id}`
```csharp
// SQL Query - Get patient info
SELECT p.*, u.* FROM Patients p
JOIN Users u ON p.UserId = u.Id
WHERE p.Id = @id

-- Get allergies
SELECT AllergyName, Severity FROM PatientAllergies WHERE PatientId = @id

-- Get chronic conditions
SELECT ConditionName, DiagnosedDate FROM ChronicConditions WHERE PatientId = @id

-- Get current medications
SELECT MedicationName, Dosage, Frequency FROM CurrentMedications WHERE PatientId = @id

-- Get recent visits
SELECT TOP 10 * FROM MedicalRecords WHERE PatientId = @id ORDER BY CreatedAt DESC
```

### 4. AI SCREENING (`/api/ai/*`)

#### POST `/api/ai/symptom-screening`
```csharp
// Request
{
  "symptoms": "string - mô tả triệu chứng",
  "patientId": "guid (optional)"
}

// Backend xử lý:
// 1. Gọi AI Model API (Flask/FastAPI Python service)
// 2. Nhận predictions từ model
// 3. Lưu vào database

// SQL Query
INSERT INTO AIScreenings (PatientId, Symptoms, PredictedDiseases, Severity, Urgency, RecommendedActions, Confidence, CreatedAt)
VALUES (@patientId, @symptoms, @predictionsJson, @severity, @urgency, @actionsJson, @confidence, GETDATE())

// Response
{
  "predictions": [
    {
      "disease": "Tên bệnh",
      "confidence": 0.85,
      "icd10Code": "A00"
    }
  ],
  "severity": "medium",
  "urgency": "Schedule within 48 hours",
  "recommendedTests": ["Test 1", "Test 2"],
  "recommendedSpecialty": "Cardiology"
}
```

### 5. APPOINTMENTS (`/api/appointments/*`)

#### POST `/api/appointments`
```csharp
// Request
{
  "departmentId": "guid",
  "doctorId": "guid",
  "date": "2026-05-10",
  "timeSlot": "09:00"
}

// SQL Query
BEGIN TRANSACTION

-- Check availability
SELECT COUNT(*) FROM Appointments
WHERE DoctorId = @doctorId AND AppointmentDate = @date AND TimeSlot = @timeSlot AND Status != 'cancelled'

-- If available
INSERT INTO Appointments (PatientId, DoctorId, DepartmentId, AppointmentDate, TimeSlot, Status)
VALUES (@patientId, @doctorId, @deptId, @date, @timeSlot, 'pending')

-- Send notification email
INSERT INTO Notifications (UserId, Type, Subject, Message, Status)
VALUES (@patientId, 'email', 'Appointment Confirmation', @emailBody, 'pending')

COMMIT TRANSACTION
```

#### GET `/api/appointments/doctor?from=&to=`
```csharp
// SQL Query
SELECT a.*, p.PatientId, u.FullName AS PatientName, u.Phone AS PatientPhone, d.Name AS DepartmentName
FROM Appointments a
JOIN Patients p ON a.PatientId = p.Id
JOIN Users u ON p.UserId = u.Id
JOIN Departments d ON a.DepartmentId = d.Id
WHERE a.DoctorId = @doctorId
  AND a.AppointmentDate >= @fromDate
  AND a.AppointmentDate <= @toDate
ORDER BY a.AppointmentDate, a.TimeSlot
```

## 🤖 Kết Nối AI Model

### Python Flask/FastAPI Service cho AI

```python
# app.py (Flask example)
from flask import Flask, request, jsonify
import pickle
import numpy as np

app = Flask(__name__)

# Load trained model
with open('disease_prediction_model.pkl', 'rb') as f:
    model = pickle.load(f)

@app.route('/api/ai/predict', methods=['POST'])
def predict():
    data = request.json
    symptoms = data['symptoms']

    # Preprocess symptoms
    # ... your preprocessing code

    # Make prediction
    predictions = model.predict_proba([processed_symptoms])

    # Get top 3 predictions
    top_3 = predictions[0].argsort()[-3:][::-1]

    results = []
    for idx in top_3:
        results.append({
            'disease': disease_names[idx],
            'confidence': float(predictions[0][idx]),
            'icd10Code': icd10_codes[idx]
        })

    # Determine severity
    max_confidence = results[0]['confidence']
    if max_confidence > 0.8:
        severity = 'high'
    elif max_confidence > 0.5:
        severity = 'medium'
    else:
        severity = 'low'

    return jsonify({
        'predictions': results,
        'severity': severity,
        'urgency': get_urgency(severity),
        'recommendedTests': get_recommended_tests(results[0]['disease']),
        'recommendedSpecialty': get_specialty(results[0]['disease'])
    })

if __name__ == '__main__':
    app.run(port=5001)
```

### C# Backend gọi Python AI Service

```csharp
public async Task<AIScreeningResult> CallAIModel(string symptoms)
{
    using var client = new HttpClient();
    var content = new StringContent(
        JsonConvert.SerializeObject(new { symptoms }),
        Encoding.UTF8,
        "application/json"
    );

    var response = await client.PostAsync("http://localhost:5001/api/ai/predict", content);
    var result = await response.Content.ReadAsStringAsync();

    return JsonConvert.DeserializeObject<AIScreeningResult>(result);
}
```

## 🔐 Authentication & Security

### JWT Token Implementation

```csharp
// Generate JWT Token
public string GenerateJwtToken(User user, bool remember)
{
    var tokenHandler = new JwtSecurityTokenHandler();
    var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Secret"]);

    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        }),
        Expires = remember ? DateTime.UtcNow.AddDays(7) : DateTime.UtcNow.AddHours(24),
        SigningCredentials = new SigningCredentials(
            new SymmetricSecurityKey(key),
            SecurityAlgorithms.HmacSha256Signature
        )
    };

    var token = tokenHandler.CreateToken(tokenDescriptor);
    return tokenHandler.WriteToken(token);
}
```

## 📝 Cách Sử Dụng

### 1. Uncomment API Calls trong Frontend

Trong file `src/app/services/api.ts`, tìm các dòng:

```typescript
// Uncomment khi có backend API
// const response = await getUsers(searchQuery);

// Mock data - xóa dòng này khi có API
setFilteredUsers(mockUsers[language]);
```

Thay thành:

```typescript
// API call
const response = await getUsers(searchQuery);
setFilteredUsers(response.users);
```

### 2. Test API

```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@emr.com","password":"admin123","remember":false}'

# Test get users (với token)
curl -X GET http://localhost:5000/api/users?search= \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 Database Indexes để Tối Ưu

```sql
-- Users
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_IDCard ON Users(IDCard);
CREATE INDEX IX_Users_Role_Status ON Users(Role, Status);

-- Appointments
CREATE INDEX IX_Appointments_Doctor_Date ON Appointments(DoctorId, AppointmentDate);
CREATE INDEX IX_Appointments_Patient ON Appointments(PatientId);

-- Medical Records
CREATE INDEX IX_MedicalRecords_Patient ON MedicalRecords(PatientId);
CREATE INDEX IX_MedicalRecords_Doctor ON MedicalRecords(DoctorId);
```

## 🚀 Next Steps

1. ✅ Tạo SQL Server database với schema trên
2. ✅ Implement C# .NET Core Web API backend
3. ✅ Implement Python Flask/FastAPI cho AI model
4. ✅ Deploy backend services
5. ✅ Uncomment các API calls trong frontend
6. ✅ Test toàn bộ hệ thống

---

**LƯU Ý QUAN TRỌNG**: 
- Tất cả các API endpoint đã được document chi tiết với SQL queries
- Mọi chỗ cần gọi API đều có comment `// API_CALL:` để dễ tìm kiếm
- Mock data có thể xóa sau khi có backend API thực
