import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Search, Plus, Edit, Lock, Unlock, Trash2, Users } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
// API_CALL: Import API functions
import { getUsers, createUser, updateUser, toggleUserLock, deleteUser } from "../../services/api";
// Thêm cái này để định nghĩa cấu trúc dữ liệu người dùng
interface User {
  id: string;
  fullName: string;
  email: string;
  idCard: string;
  role: string;
  status: string;
  phone?: string;
}

interface UserManagementProps {
  language: 'en' | 'vn';
}


const translations = {
  en: {
    title: "User Management",
    description: "Manage system users and roles",
    searchPlaceholder: "Search by name, email, or ID card...",
    addUser: "Add User",
    id: "ID",
    name: "Name",
    email: "Email",
    idCard: "ID Card",
    role: "Role",
    status: "Status",
    actions: "Actions",
    edit: "Edit",
    lock: "Lock",
    unlock: "Unlock",
    delete: "Delete",
    active: "Active",
    locked: "Locked",
    admin: "Admin",
    doctor: "Doctor",
    nurse: "Nurse",
    patient: "Patient",
    editUser: "Edit User",
    fullName: "Full Name",
    phone: "Phone",
    save: "Save",
    cancel: "Cancel",
    confirmDelete: "Are you sure you want to delete this user?",
    userLocked: "User account has been locked",
    userUnlocked: "User account has been unlocked"
  },
  vn: {
    title: "Quản Lý Người Dùng",
    description: "Quản lý người dùng và phân quyền hệ thống",
    searchPlaceholder: "Tìm kiếm theo tên, email, hoặc CCCD...",
    addUser: "Thêm Người Dùng",
    id: "Mã",
    name: "Họ Tên",
    email: "Email",
    idCard: "CCCD",
    role: "Vai Trò",
    status: "Trạng Thái",
    actions: "Thao Tác",
    edit: "Sửa",
    lock: "Khóa",
    unlock: "Mở Khóa",
    delete: "Xóa",
    active: "Hoạt Động",
    locked: "Đã Khóa",
    admin: "Quản Trị Viên",
    doctor: "Bác Sĩ",
    nurse: "Điều Dưỡng",
    patient: "Bệnh Nhân",
    editUser: "Chỉnh Sửa Người Dùng",
    fullName: "Họ và Tên",
    phone: "Số Điện Thoại",
    save: "Lưu",
    cancel: "Hủy",
    confirmDelete: "Bạn có chắc chắn muốn xóa người dùng này?",
    userLocked: "Tài khoản người dùng đã bị khóa",
    userUnlocked: "Tài khoản người dùng đã được mở khóa"
  }
};


export function UserManagement({ language }: UserManagementProps) {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    idCard: "",
    phone: "",
    role: "patient",
    password: ""
  });
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // API_CALL: Lấy danh sách người dùng khi component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // API_CALL: Function để gọi API lấy users
const loadUsers = async () => {
  try {
    // Gọi API lấy danh sách từ Backend :5041 [cite: 4]
    const data = await getUsers(); 
    
    // QUAN TRỌNG: Phải set lại State để React vẽ lại giao diện
    setUsers(data); 
    setFilteredUsers(data); 
  } catch (error) {
    console.error("Không thể load dữ liệu từ SQL", error);
  }
};
  useEffect(() => {
    // Lọc trực tiếp trên mảng 'users' (dữ liệu thật từ database)
    const filtered = users.filter(user => {
      const query = searchQuery.toLowerCase();
      return (
        user.fullName.toLowerCase().includes(query) || // Dùng fullName thay vì name
        user.email.toLowerCase().includes(query) ||
        user.idCard.includes(query)
      );
    });
    setFilteredUsers(filtered);
  }, [searchQuery, users]); // Theo dõi 'users' thay vì 'language'

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-500",
      doctor: "bg-blue-500",
      nurse: "bg-green-500",
      patient: "bg-gray-500"
    };
    return <Badge className={colors[role]}>{t[role as keyof typeof t] as string}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge variant="default" className="bg-green-500">{t.active}</Badge>
    ) : (
      <Badge variant="destructive">{t.locked}</Badge>
    );
  };

  // API_CALL: Thêm người dùng mới
 const handleAddUser = async () => {
  try {
    setLoading(true);
    // Map dữ liệu để gửi lên Backend .NET
    const userToPost = {
      fullName: newUser.fullName, // Sử dụng fullName thay vì name
      email: newUser.email,
      idCard: newUser.idCard,
      phone: newUser.phone,
      role: newUser.role,
      passwordHash: newUser.password, // Gửi vào PasswordHash trong SQL
      status: 'active'
    };

    await createUser(userToPost); // API_CALL thực tế 

    setAlert({ message: language === 'en' ? 'User created successfully' : 'Tạo người dùng thành công', type: 'success' });
    setIsAddDialogOpen(false);
    loadUsers(); // Tải lại danh sách từ SQL Server [cite: 18]
    setNewUser({ fullName: "", email: "", idCard: "", phone: "", role: "patient", password: "" });
  } catch (error) { /* ... */ }
};

  // API_CALL: Khóa/Mở khóa tài khoản
const handleToggleLock = async (user: User) => {
  try {
    setLoading(true);
    // 1. Gọi API thực tế để đổi trạng thái trong SQL Server
    await toggleUserLock(user.id); 

    // 2. Thông báo cho Admin biết kết quả
    const isNowLocked = user.status === "active";
    setAlert({
      message: isNowLocked ? t.userLocked : t.userUnlocked,
      type: 'success'
    });

    // 3. Tải lại danh sách để giao diện cập nhật Badge mới nhất từ DB
    await loadUsers(); 

    setTimeout(() => setAlert(null), 3000);
  } catch (error) {
    console.error('Error:', error);
    setAlert({ message: 'Không thể cập nhật trạng thái', type: 'error' });
  } finally {
    setLoading(false);
  }
};

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  // API_CALL: Cập nhật thông tin người dùng
const handleSaveEdit = async () => {
  try {
    setLoading(true);

    // Chuẩn bị dữ liệu gửi đi khớp 100% với Model C# [cite: 14, 15]
    const dataToSend = {
      id: selectedUser.id,
      fullName: selectedUser.fullName, // Nếu Backend dùng FullName thì ở đây phải gửi fullName
      email: selectedUser.email,
      phone: selectedUser.phone,
      idCard: selectedUser.idCard,     // Đảm bảo khớp với user.IDCard ở Backend 
      role: selectedUser.role,
      status: selectedUser.status
    };

    // Gọi API với data đã chuẩn hóa
    await updateUser(selectedUser.id, dataToSend);
    
    await loadUsers(); // Tải lại từ SQL 
    setIsEditDialogOpen(false);
    setAlert({ message: 'Cập nhật SQL thành công', type: 'success' });
  } catch (error) {
    setAlert({ message: 'Lỗi đồng bộ dữ liệu', type: 'error' });
  } finally {
    setLoading(false);
  }
};
  // API_CALL: Xóa người dùng
const handleDelete = async (user: User) => {
  if (window.confirm(`Xóa ${user.fullName}?`)) {
    try {
      // 1. Gọi đúng hàm đã sửa ở trên
      await deleteUser(user.id); 
      
      // 2. Load lại để đồng bộ với SQL
      await loadUsers(); 
      
      setAlert({ message: "Đã xóa vĩnh viễn", type: 'success' });
    } catch (err) {
      console.error(err);
      setAlert({ message: "Lỗi kết nối API", type: 'error' });
    }
  }
};

  return (
    <div className="space-y-6">
      {alert && (
        <Alert variant={alert.type === 'success' ? 'default' : 'destructive'}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
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
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t.addUser}
            </Button>
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
                  <TableHead>{t.email}</TableHead>
                  <TableHead>{t.idCard}</TableHead>
                  <TableHead>{t.role}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {language === 'en' ? 'No users found' : 'Không tìm thấy người dùng'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.idCard}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleLock(user)}
                        >
                          {user.status === "active" ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <Unlock className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(user)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.addUser}</DialogTitle>
            <DialogDescription>
              {language === 'en' ? 'Create a new user account' : 'Tạo tài khoản người dùng mới'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.fullName}</Label>
              <Input
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder={language === 'en' ? 'Full name' : 'Họ và tên'}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.email}</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.idCard}</Label>
              <Input
                value={newUser.idCard}
                onChange={(e) => setNewUser({ ...newUser, idCard: e.target.value })}
                placeholder="001234567890"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.phone}</Label>
              <Input
                value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="+84 900 000 000"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.role}</Label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t.admin}</SelectItem>
                  <SelectItem value="doctor">{t.doctor}</SelectItem>
                  <SelectItem value="nurse">{t.nurse}</SelectItem>
                  <SelectItem value="patient">{t.patient}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === 'en' ? 'Password' : 'Mật khẩu'}</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="********"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleAddUser} disabled={loading}>
              {loading ? (language === 'en' ? 'Creating...' : 'Đang tạo...') : t.addUser}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editUser}</DialogTitle>
            <DialogDescription>{selectedUser?.id}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t.fullName}</Label>
                <Input
                  value={selectedUser.fullName}
                  onChange={(e) => setSelectedUser({ ...selectedUser, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.email}</Label>
                <Input
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.phone}</Label>
                <Input
                  value={selectedUser.phone}
                  onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.role}</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t.admin}</SelectItem>
                    <SelectItem value="doctor">{t.doctor}</SelectItem>
                    <SelectItem value="nurse">{t.nurse}</SelectItem>
                    <SelectItem value="patient">{t.patient}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSaveEdit}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
