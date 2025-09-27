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
  CardAction,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function PatientsList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [newId, setNewId] = useState("");

  // --- API placeholder ---
  const fetchPatients = async () => {
    try {
      // TODO: Replace with real API call
      // const res = await fetch("/api/patients");
      // const data = await res.json();
      // setPatients(data);
      
      // Temporary hardcoded mock
      setPatients([
        { patientId: "P001", firstName: "John", lastName: "Doe" },
        { patientId: "P002", firstName: "Alice", lastName: "Smith" },
        { patientId: "P003", firstName: "Michael", lastName: "Johnson" },
        { patientId: "P004", firstName: "Sophia", lastName: "Williams" },
        { patientId: "P005", firstName: "David", lastName: "Brown" },
      ]);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
    }
  };

  // --- Run once when component mounts ---
  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSubmit = () => {
    if (!newId.trim()) return;
    // TODO: replace with API call
    console.log("Submitting new patient:", newId);
    setOpen(false);
    setNewId("");
  };

  const handleDelete = (id: string) => {
    console.log("Delete patient:", id);
    // TODO: remove patient from state or call API
  };

  return (
    <Card className="w-1/2 mx-auto p-4">
      <CardHeader>
        <CardTitle>A list of all your current patients.</CardTitle>
        <CardAction>
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Add Patient
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/5">Patient ID</TableHead>
              <TableHead className="w-2/5">Name</TableHead>
              <TableHead className="text-right">Remove</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow
                key={patient.patientId}
                className="cursor-pointer hover:bg-gray-100"
                onClick={() => navigate(`/patient/${patient.patientId}`)}
              >
                <TableCell className="font-medium">
                  {patient.patientId}
                </TableCell>
                <TableCell>
                  {patient.firstName} {patient.lastName}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(patient.patientId);
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

      {/* Dialog for Add Patient */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Patient</DialogTitle>
          </DialogHeader>
          <Input
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="Enter Patient ID"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
