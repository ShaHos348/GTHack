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
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from "firebase/firestore";

export function PatientsList() {
  const [patients, setPatients] = useState<any[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [patientIdInput, setPatientIdInput] = useState("");
  const [confirmRemovePatient, setConfirmRemovePatient] = useState<any>(null); // patient object to confirm removal
  const navigate = useNavigate();

  const uid = auth.currentUser?.uid;

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
      await updateDoc(ref, { doctor: uid });
      alert("✅ Patient assigned!");
      fetchPatients();
    } else {
      alert("⚠️ Patient already assigned to a doctor.");
    }

    setShowPopup(false);
    setPatientIdInput("");
  };

  const handleRemovePatient = async (patientUid: string) => {
    try {
      await updateDoc(doc(db, "patients", patientUid), { doctor: null });
      setPatients((prev) => prev.filter((p) => p.uid !== patientUid));
      setConfirmRemovePatient(null);
    } catch (err) {
      console.error("Error removing patient:", err);
      alert("❌ Failed to remove patient. Check Firestore rules.");
    }
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
              <TableHead className="w-1/5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.uid} className="hover:bg-gray-100">
                <TableCell
                  className="font-medium cursor-pointer"
                  onClick={() => navigate(`/patient/${patient.uid}`)}
                >
                  {patient.uid}
                </TableCell>
                <TableCell
                  className="cursor-pointer"
                  onClick={() => navigate(`/patient/${patient.uid}`)}
                >
                  {patient.firstName} {patient.lastName}
                </TableCell>
                <TableCell
                  className="cursor-pointer"
                  onClick={() => navigate(`/patient/${patient.uid}`)}
                >
                  {patient.email}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmRemovePatient(patient)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Popup modal for assigning patient */}
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

      {/* Full-screen modal for remove confirmation */}
      {confirmRemovePatient && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-bold mb-4">Confirm Remove</h2>
            <p className="mb-6">
              Are you sure you want to remove{" "}
              <strong>
                {confirmRemovePatient.firstName} {confirmRemovePatient.lastName}
              </strong>{" "}
              from your patients?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmRemovePatient(null)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemovePatient(confirmRemovePatient.uid)}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
