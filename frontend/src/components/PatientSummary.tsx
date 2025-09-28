import React from "react";
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
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";

interface PatientSummaryProps {
  pid: string | null;
}

const treatments = [
  {
    treatmentName: "INV001",
    coverage: "Paid",
    alternatives: ["bananas, apples"],
  },
  {
    treatmentName: "INV002",
    coverage: "Pending",
    alternatives: "$150.00",
  },
  {
    treatmentName: "INV003",
    coverage: "Unpaid",
    alternatives: "$350.00",
  },
  {
    treatmentName: "INV004",
    coverage: "Paid",
    alternatives: "$450.00",
  },
  {
    treatmentName: "INV005",
    coverage: "Paid",
    alternatives: "$550.00",
  },
];

const PatientSummary: React.FC<PatientSummaryProps> = ({ pid }) => {
  return (
    <div className="flex items-center justify-center py-8">
      {/* 1. Main Card: Keep it clean, let CardHeader/Content handle padding */}
      <Card className="flex w-full max-w-4xl">
        {/* The CardHeader here already has the necessary px-6 */}
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
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  asdasdasdasdsad asdasdsadada. asdasdasd asdadasd asdasdaas
                  asdaadas asdada asdasdasdasdada asdadasasdasd
                  asdasdasdasdsadasdadaad asdasdasasd Vivamus luctus urna sed
                  urna ultricies ac tempor dui sagittis. In condimentum
                  facilisis porta. Sed nec diam eu diam mattis viverra. Nulla
                  fringilla, orci ac euismod semper. Aenean sit amet erat nunc.
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="text-lg">Last Visit Summary</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="max-h-[12rem] overflow-y-auto border rounded-md p-2 bg-slate-50 scrollbar-hide">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  asdasdasdasdsad asdasdsadada. asdasdasd asdadasd asdasdaas
                  asdaadas asdada asdasdasdasdada asdadasasdasd
                  asdasdasdasdsadasdadaad asdasdasasd Vivamus luctus urna sed
                  urna ultricies ac tempor dui sagittis. In condimentum
                  facilisis porta. Sed nec diam eu diam mattis viverra. Nulla
                  fringilla, orci ac euismod semper. Aenean sit amet erat nunc.
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
                  {treatments.map((treatmentName) => (
                    <TableRow key={treatmentName.treatmentName}>
                      <TableCell className="w-1/2 font-medium">
                        {treatmentName.treatmentName}
                      </TableCell>
                      <TableCell className="w-1/2">
                        {treatmentName.coverage}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="w-full flex justify-between items-center">
              <CardTitle className="text-lg">Alternative Treatments</CardTitle>
              <Button className="text-sm">Add Treatment</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Treatment Name</TableHead>
                    <TableHead className="w-1/3">Coverage Option</TableHead>
                    <TableHead className="w-1/3">Alternative Plans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatments.map((treatmentName) => (
                    <TableRow key={treatmentName.treatmentName}>
                      <TableCell className="w-1/3 font-medium">
                        {treatmentName.treatmentName}
                      </TableCell>
                      <TableCell className="w-1/3">
                        {treatmentName.coverage}
                      </TableCell>
                      <TableCell className="w-1/3">
                        <select className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-gray-200 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none md:text-sm">
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientSummary;
