import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Pill, Plus, AlertTriangle, QrCode, Trash2, Download } from "lucide-react";

interface PrescriptionManagementProps {
  language: 'en' | 'vn';
  patientId?: string;
}

const translations = {
  en: {
    title: "Prescription Management",
    description: "Manage patient prescriptions",
    patientId: "Patient ID",
    addMedication: "Add Medication",
    medication: "Medication",
    dosage: "Dosage",
    frequency: "Frequency",
    duration: "Duration",
    actions: "Actions",
    allergyWarning: "Allergy Warning",
    interactionWarning: "Drug Interaction Warning",
    patientAllergies: "Patient is allergic to Penicillin",
    interactionDetected: "Interaction detected between medications",
    generateQR: "Generate QR Code",
    savePrescription: "Save Prescription",
    searchMedicine: "Search medicine...",
    selectMedicine: "Select Medicine",
    days: "days",
    timesPerDay: "times/day",
    qrGenerated: "QR code generated successfully",
    prescriptionSaved: "Prescription saved successfully"
  },
  vn: {
    title: "Quản Lý Đơn Thuốc",
    description: "Quản lý đơn thuốc bệnh nhân",
    patientId: "Mã Bệnh Nhân",
    addMedication: "Thêm Thuốc",
    medication: "Thuốc",
    dosage: "Liều Lượng",
    frequency: "Tần Suất",
    duration: "Thời Gian",
    actions: "Thao Tác",
    allergyWarning: "Cảnh Báo Dị Ứng",
    interactionWarning: "Cảnh Báo Tương Tác Thuốc",
    patientAllergies: "Bệnh nhân dị ứng với Penicillin",
    interactionDetected: "Phát hiện tương tác giữa các thuốc",
    generateQR: "Tạo Mã QR",
    savePrescription: "Lưu Đơn Thuốc",
    searchMedicine: "Tìm thuốc...",
    selectMedicine: "Chọn Thuốc",
    days: "ngày",
    timesPerDay: "lần/ngày",
    qrGenerated: "Tạo mã QR thành công",
    prescriptionSaved: "Lưu đơn thuốc thành công"
  }
};

const mockMedicines = {
  en: [
    { id: "M001", name: "Paracetamol 500mg", type: "Analgesic" },
    { id: "M002", name: "Amoxicillin 500mg", type: "Antibiotic", containsPenicillin: true },
    { id: "M003", name: "Ibuprofen 400mg", type: "NSAID" },
    { id: "M004", name: "Metformin 500mg", type: "Antidiabetic" },
    { id: "M005", name: "Lisinopril 10mg", type: "Antihypertensive" }
  ],
  vn: [
    { id: "M001", name: "Paracetamol 500mg", type: "Giảm đau" },
    { id: "M002", name: "Amoxicillin 500mg", type: "Kháng sinh", containsPenicillin: true },
    { id: "M003", name: "Ibuprofen 400mg", type: "Chống viêm" },
    { id: "M004", name: "Metformin 500mg", type: "Tiểu đường" },
    { id: "M005", name: "Lisinopril 10mg", type: "Hạ huyết áp" }
  ]
};

export function PrescriptionManagement({ language, patientId = "P001" }: PrescriptionManagementProps) {
  const t = translations[language];
  const [medications, setMedications] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMed, setSelectedMed] = useState<any>(null);
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const medicines = mockMedicines[language];
  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const checkWarnings = (newMed: any) => {
    const newWarnings: string[] = [];

    // Check allergy
    if (newMed.containsPenicillin) {
      newWarnings.push(t.patientAllergies);
    }

    // Check interaction (simplified example)
    if (medications.some(m => m.id === "M003") && newMed.id === "M005") {
      newWarnings.push(t.interactionDetected);
    }

    return newWarnings;
  };

  const handleAddMedication = () => {
    if (selectedMed && dosage && frequency && duration) {
      const newWarnings = checkWarnings(selectedMed);
      setWarnings([...warnings, ...newWarnings]);

      setMedications([...medications, {
        ...selectedMed,
        dosage,
        frequency,
        duration
      }]);

      setIsDialogOpen(false);
      setSelectedMed(null);
      setDosage("");
      setFrequency("");
      setDuration("");
    }
  };

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleGenerateQR = () => {
    setAlert({ message: t.qrGenerated, type: 'success' });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSavePrescription = () => {
    setAlert({ message: t.prescriptionSaved, type: 'success' });
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <div className="space-y-6">
      {alert && (
        <Alert variant={alert.type === 'success' ? 'default' : 'destructive'}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">{t.allergyWarning}</div>
            {warnings.map((warning, i) => (
              <div key={i}>• {warning}</div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-green-600" />
            {t.title}
          </CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t.patientId}</Label>
            <Input value={patientId} disabled />
          </div>

          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.addMedication}
          </Button>

          {medications.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.medication}</TableHead>
                    <TableHead>{t.dosage}</TableHead>
                    <TableHead>{t.frequency}</TableHead>
                    <TableHead>{t.duration}</TableHead>
                    <TableHead>{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications.map((med, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{med.name}</div>
                          <Badge variant="outline" className="mt-1">{med.type}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>{med.dosage}</TableCell>
                      <TableCell>{med.frequency} {t.timesPerDay}</TableCell>
                      <TableCell>{med.duration} {t.days}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMedication(index)}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {medications.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={handleSavePrescription}>
                {t.savePrescription}
              </Button>
              <Button variant="outline" onClick={handleGenerateQR}>
                <QrCode className="h-4 w-4 mr-2" />
                {t.generateQR}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.selectMedicine}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.searchMedicine}</Label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchMedicine}
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredMedicines.map((med) => (
                <div
                  key={med.id}
                  className={`p-3 border rounded cursor-pointer hover:bg-muted ${
                    selectedMed?.id === med.id ? 'border-primary bg-muted' : ''
                  }`}
                  onClick={() => setSelectedMed(med)}
                >
                  <div className="font-medium">{med.name}</div>
                  <Badge variant="outline" className="mt-1">{med.type}</Badge>
                </div>
              ))}
            </div>

            {selectedMed && (
              <>
                <div className="space-y-2">
                  <Label>{t.dosage}</Label>
                  <Input
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder={language === 'en' ? "e.g., 1 tablet" : "VD: 1 viên"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t.frequency}</Label>
                  <Input
                    type="number"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    placeholder="2"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t.duration}</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="7"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {language === 'en' ? 'Cancel' : 'Hủy'}
            </Button>
            <Button
              onClick={handleAddMedication}
              disabled={!selectedMed || !dosage || !frequency || !duration}
            >
              {t.addMedication}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
