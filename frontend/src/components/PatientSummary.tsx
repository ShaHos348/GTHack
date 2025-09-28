import React, { useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

interface PatientSummaryProps {
  pid: string | null;
}

const PatientSummary: React.FC<PatientSummaryProps> = ({ pid }) => {
  const [treatments, setTreatments] = useState([
    {
      treatmentName: "INV001",
      coverage: "Paid",
      alternatives: ["bananas", "apples"],
    },
    {
      treatmentName: "INV002",
      coverage: "Pending",
      alternatives: ["oranges", "grapes"],
    },
  ]);

  const [showPopup, setShowPopup] = useState(false);
  const [treatmentName, setTreatmentName] = useState("");

  const addNewTreatment = () => {
    const newTreatment = {
      treatmentName,
      coverage: "Pending",
      alternatives: [],
    };
    setTreatments((prev) => [...prev, newTreatment]);
    setTreatmentName("");
    setShowPopup(false);
  };

  return (
    <div className="flex items-center justify-center py-8">
      <Card className="flex w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="font-bold">Patient Summary</CardTitle>
          <CardDescription>
            Summary of Information from Last Patient Visit
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          <div className="flex gap-x-4">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg">Questionnaire Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="max-h-[12rem] overflow-y-auto border rounded-md p-2 bg-slate-50 scrollbar-hide">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit...
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg">Last Visit Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="max-h-[12rem] overflow-y-auto border rounded-md p-2 bg-slate-50 scrollbar-hide">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit...
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="w-full flex justify-between items-center">
              <CardTitle className="text-lg">Treatment Plan Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">Treatment Name</TableHead>
                    <TableHead className="w-1/2">Coverage Option</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatments.map((treatment) => (
                    <TableRow key={treatment.treatmentName}>
                      <TableCell className="w-1/2 font-medium">
                        {treatment.treatmentName}
                      </TableCell>
                      <TableCell className="w-1/2">
                        {treatment.coverage}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Alternative Treatments */}
          <Card>
            <CardHeader className="w-full flex justify-between items-center">
              <CardTitle className="text-lg">Alternative Treatments</CardTitle>
              <Button className="text-sm" onClick={() => setShowPopup(true)}>
                Add Treatment
              </Button>
            </CardHeader>
            <CardContent>
              <Table id="alt-treatments">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Treatment Name</TableHead>
                    <TableHead className="w-1/3">Coverage Option</TableHead>
                    <TableHead className="w-1/3">Alternative Plans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatments.map((treatment) => (
                    <TableRow key={treatment.treatmentName}>
                      <TableCell className="w-1/3 font-medium">
                        {treatment.treatmentName}
                      </TableCell>
                      <TableCell className="w-1/3">
                        {treatment.coverage}
                      </TableCell>
                      <TableCell className="w-1/3">
                        <select className="border-gray-200 h-9 w-full rounded-md border px-3 py-1 text-base shadow-xs outline-none md:text-sm">
                          <option value="">Select</option>
                          {treatment.alternatives.map((alt) => (
                            <option key={alt} value={alt}>
                              {alt}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Button
            className="text-sm"
            onClick={async () => {
              if (!pid) return; // Use patient id

              try {
                const rows = document.querySelectorAll<HTMLTableRowElement>(
                  "#alt-treatments tbody tr"
                );

                const entriesToSave = Array.from(rows).map((row, i) => {
                  const select = row.querySelector<HTMLSelectElement>("select");
                  const alternative = select?.value;
                  return {
                    treatmentName: alternative || treatments[i].treatmentName,
                    coverage: treatments[i].coverage,
                  };
                });

                await setDoc(doc(db, `prescription/${pid}`), {
                  entries: entriesToSave,
                });
                alert("Prescriptions saved!");
              } catch (err) {
                console.error("Failed to save prescriptions:", err);
                alert("Failed to save prescriptions.");
              }
            }}
          >
            Save
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Treatment</DialogTitle>
            <DialogDescription>
              Fill in new treatment option name
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Treatment Name
            </label>
            <Input
              type="text"
              placeholder="Enter treatment name"
              value={treatmentName}
              onChange={(e) => setTreatmentName(e.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPopup(false)}>
              Cancel
            </Button>
            <Button onClick={addNewTreatment}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientSummary;
