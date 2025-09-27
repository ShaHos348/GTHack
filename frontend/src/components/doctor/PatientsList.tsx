import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const patients = [
  { patientId: "P001", firstName: "John", lastName: "Doe", date: "09/15/2025" },
  {
    patientId: "P002",
    firstName: "Alice",
    lastName: "Smith",
    date: "09/20/2025",
  },
  {
    patientId: "P003",
    firstName: "Michael",
    lastName: "Johnson",
    date: "09/21/2025",
  },
  {
    patientId: "P004",
    firstName: "Sophia",
    lastName: "Williams",
    date: "09/23/2025",
  },
  {
    patientId: "P005",
    firstName: "David",
    lastName: "Brown",
    date: "09/25/2025",
  },
];

export function PatientsList() {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Card className="w-1/2 mx-auto p-4">
      <CardHeader>
        <CardTitle>A list of all your current patients.</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Header */}
        <div className="grid grid-cols-2 border-b-2 pb-2 mb-2 text-left font-semibold">
          <div>Name</div>
          <div>Date</div>
        </div>

        {/* Patient rows */}
        <div className="flex flex-col space-y-2">
          {patients.map((patient) => (
            <div
              key={patient.patientId}
              className="bg-card text-card-foreground flex flex-col cursor-pointer rounded-xl border p-4 hover:bg-gray-100"
              onClick={() => toggleExpand(patient.patientId)}
            >
              {/* Top row: Name + Date */}
              <div className="grid grid-cols-2 p-4">
                <div>
                  {patient.firstName} {patient.lastName}
                </div>
                <div>{patient.date}</div>
              </div>

              {/* Expanded buttons */}
              {expandedId === patient.patientId && (
                <div className="p-4 flex flex-wrap justify-center gap-4">
                  <Link to={`/patients/${patient.patientId}/history`}>
                    <Button className="bg-gray-900">Patient History</Button>
                  </Link>
                  <Link to={`/patients/${patient.patientId}/questionnaire`}>
                    <Button className="bg-gray-900">Questionnaire</Button>
                  </Link>
                  <Link to={`/patients/${patient.patientId}/tests`}>
                    <Button className="bg-gray-900">Test Report</Button>
                  </Link>
                  <Link to={`/patients/${patient.patientId}/prescription`}>
                    <Button className="bg-gray-900">Prescription</Button>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
