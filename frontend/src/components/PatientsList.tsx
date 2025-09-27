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
import { db } from "./firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";

export function PatientsList() {
  const [patients, setPatients] = useState<any[]>([]);
  const navigate = useNavigate();

  const fetchPatients = async () => {
    const querySnapshot = await getDocs(collection(db, "patients"));
    const data = querySnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
    setPatients(data);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDelete = async (uid: string) => {
    await deleteDoc(doc(db, "patients", uid));
    setPatients((prev) => prev.filter((p) => p.uid !== uid));
  };

  return (
    <Card className="w-4/5 mx-auto p-4">
      <CardHeader>
        <CardTitle>A list of all your current patients.</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/5">Patient ID</TableHead>
              <TableHead className="w-2/5">Name</TableHead>
              <TableHead className="w-2/5">Email</TableHead>
              <TableHead className="text-right">Remove</TableHead>
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
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(patient.uid);
                    }}
                  >
                    X
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
