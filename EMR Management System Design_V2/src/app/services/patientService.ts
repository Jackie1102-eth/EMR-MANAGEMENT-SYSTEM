import axios from 'axios';

// Đây là địa chỉ Backend .NET của bạn
const API_BASE_URL = 'http://localhost:5041/api/patients';

export const getPatients = async () => {
    try {
        const response = await axios.get(API_BASE_URL);
        return response.data; // Trả về danh sách bệnh nhân từ SQL
    } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        return [];
    }
};