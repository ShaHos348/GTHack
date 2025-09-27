import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db, auth } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where,
} from "firebase/firestore";

export function PatientsList() {
  const [patients, setPatients] = useState<any[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [patientIdInput, setPatientIdInput] = useState("");
  const navigate = useNavigate();

  const uid = auth.currentUser?.uid; // current doctor ID

  const fetchPatients = async () => {
    if (!uid) return;
    const q = query(collection(db, "patients"), where("doctor", "==", uid));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
    setPatients(data);
  };

  useEffect(() => {
    fetchPatients();
  }, [uid]);

  const handleAssignPatient = async () => {
    if (!uid || !patientIdInput) return;

    const ref = doc(db, "patients", patientIdInput);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      alert("❌ Patient not found.");
      return;
    }

    const data = snap.data();
    if (!data.doctor || data.doctor === null) {
      // assign doctor if unassigned
      await updateDoc(ref, { doctor: uid });
      alert("✅ Patient assigned!");
      fetchPatients();
    } else {
      alert("⚠️ Patient already assigned to a doctor.");
    }

    setShowPopup(false);
    setPatientIdInput("");
  };

  return (
    <Card className="w-4/5 mx-auto p-4">
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Your Patients</CardTitle>
        <Button onClick={() => setShowPopup(true)}>+ Add Patient</Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/5">Patient ID</TableHead>
              <TableHead className="w-2/5">Name</TableHead>
              <TableHead className="w-2/5">Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow
                key={patient.uid}
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => navigate(`/patient/${patient.uid}`)}
              >
                <TableCell className="font-medium">{patient.uid}</TableCell>
                <TableCell>
                  {patient.firstName} {patient.lastName}
                </TableCell>
                <TableCell>{patient.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Popup modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Assign Patient</h2>
            <input
              type="text"
              value={patientIdInput}
              onChange={(e) => setPatientIdInput(e.target.value)}
              placeholder="Enter patient ID"
              className="border p-2 w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowPopup(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignPatient}>Assign</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
