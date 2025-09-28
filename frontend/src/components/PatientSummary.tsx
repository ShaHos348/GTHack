import React, { useState, useEffect, useCallback } from "react";
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
} from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useAuth } from "../hooks/useAuth";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

interface PatientSummaryProps {
  pid: string | null;
}

interface MedicationAlternative {
  medicationName: string;
  formularyTier: string;
  estimatedCopay: string;
  rationale: string;
}

interface GeminiResponse {
  querySummary: {
    insuranceProvider: string;
    memberId: string;
    diagnosis: string;
  };
  prescribedMedicationDetails: {
    medicationName: string;
    activeIngredient: string;
    typicalTier: string;
    estimatedCopay: string;
  };
  costEffectiveAlternatives: MedicationAlternative[];
}

interface Treatment {
  id: string;
  treatmentName: string;
  coverage: "Full Coverage" | "Copay" | "No Coverage";
  alternatives: MedicationAlternative[];
  originalPrescription: string;
}

// This will be replaced with dynamic treatments from database
const initialTreatments: Treatment[] = [];

const PatientSummary: React.FC<PatientSummaryProps> = ({ pid }) => {
  const { currentUser } = useAuth();
  const [doctorInsight, setDoctorInsight] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  
  // Treatment management state
  const [treatments, setTreatments] = useState<Treatment[]>(initialTreatments);
  const [showAddTreatmentDialog, setShowAddTreatmentDialog] = useState(false);
  const [newTreatmentName, setNewTreatmentName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [patientData, setPatientData] = useState<{ 
    insuranceProvider?: string; 
    insuranceMemberId?: string;
    firstName?: string;
    lastName?: string;
  } | null>(null);
  const [questionnaireSummary, setQuestionnaireSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const loadDoctorInsight = useCallback(async () => {
    if (!pid) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/patient/${pid}/insights`);
      
      if (response.ok) {
        const data = await response.json();
        setDoctorInsight(data.doctorInsight || "");
      } else if (response.status === 404) {
        // Patient doesn't exist yet, that's fine
        setDoctorInsight("");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error loading doctor's insight:", error);
      setDoctorInsight(""); // Set empty on error
    } finally {
      setIsLoading(false);
    }
  }, [pid]);

  // Load patient data for insurance information
  const loadPatientData = useCallback(async () => {
    if (!pid) return;
    
    try {
      const response = await fetch(`http://localhost:3000/patient/${pid}/data`);
      if (response.ok) {
        const data = await response.json();
        setPatientData(data);
      } else if (response.status === 404) {
        console.log("Patient data not found, patient may need to complete their profile");
        setPatientData(null);
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
      setPatientData(null);
    }
  }, [pid]);

  // Load questionnaire summary
  const loadQuestionnaireSummary = useCallback(async () => {
    if (!pid) return;
    
    setIsLoadingSummary(true);
    try {
      const response = await fetch(`http://localhost:3000/patient/${pid}/summary`);
      if (response.ok) {
        const data = await response.json();
        setQuestionnaireSummary(data.latestSummary || "No questionnaire summary available yet.");
      } else if (response.status === 404) {
        setQuestionnaireSummary("No questionnaire summary available yet.");
      }
    } catch (error) {
      console.error("Error loading questionnaire summary:", error);
      setQuestionnaireSummary("Failed to load questionnaire summary.");
    } finally {
      setIsLoadingSummary(false);
    }
  }, [pid]);

  // Load existing doctor's insight when component mounts
  useEffect(() => {
    if (pid && currentUser) {
      loadDoctorInsight();
      loadPatientData();
      loadQuestionnaireSummary();
    }
  }, [pid, currentUser, loadDoctorInsight, loadPatientData, loadQuestionnaireSummary]);

  const saveDoctorInsight = async () => {
    if (!pid || !currentUser) return;
    
    setIsSaving(true);
    setSaveStatus("idle");
    
    try {
      const response = await fetch(`http://localhost:3000/patient/${pid}/insights`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorInsight,
          doctorId: currentUser.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000); // Clear success message after 3 seconds
      
    } catch (error) {
      console.error("Error saving doctor's insight:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 5000); // Clear error message after 5 seconds
    } finally {
      setIsSaving(false);
    }
  };

  // Add treatment with AI analysis
  const addTreatment = async () => {
    if (!newTreatmentName.trim() || !doctorInsight) {
      alert("Please enter a treatment name and ensure doctor's insight is available.");
      return;
    }

    if (!patientData?.insuranceProvider || !patientData?.insuranceMemberId) {
      alert("Patient insurance information is missing. Please ensure the patient has completed their insurance details in their profile.");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Get insurance data from patient record
      const insuranceProvider = patientData.insuranceProvider;
      const memberId = patientData.insuranceMemberId;
      
      const response = await fetch('http://localhost:3000/analyze-medication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insuranceProvider,
          memberId,
          diagnosis: doctorInsight, // Use doctor's insight as diagnosis
          prescription: newTreatmentName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const aiAnalysis: GeminiResponse = await response.json();
      
      // Determine coverage based on estimated copay
      const determineCoverage = (copay: string): "Full Coverage" | "Copay" | "No Coverage" => {
        const amount = copay.toLowerCase();
        if (amount.includes('$0') || amount.includes('free')) return "Full Coverage";
        if (amount.includes('$') && !amount.includes('not covered')) return "Copay";
        return "No Coverage";
      };

      const newTreatment: Treatment = {
        id: Date.now().toString(),
        treatmentName: newTreatmentName,
        coverage: determineCoverage(aiAnalysis.prescribedMedicationDetails.estimatedCopay),
        alternatives: aiAnalysis.costEffectiveAlternatives,
        originalPrescription: newTreatmentName,
      };

      setTreatments(prev => [...prev, newTreatment]);
      setNewTreatmentName("");
      setShowAddTreatmentDialog(false);
      
    } catch (error) {
      console.error("Error analyzing treatment:", error);
      alert("Failed to analyze treatment alternatives. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
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
                  {isLoadingSummary ? (
                    <div className="flex items-center justify-center h-16">
                      <span className="text-gray-500">Loading questionnaire summary...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {questionnaireSummary}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Doctor's Insight</CardTitle>
                <div className="flex items-center gap-2">
                  {saveStatus === "success" && (
                    <span className="text-green-600 text-xs">✅ Saved</span>
                  )}
                  {saveStatus === "error" && (
                    <span className="text-red-600 text-xs">❌ Error saving</span>
                  )}
                  <Button 
                    onClick={saveDoctorInsight}
                    disabled={isSaving}
                    className="text-xs px-3 py-1 h-auto"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-sm">
                <textarea
                  value={doctorInsight}
                  onChange={(e) => setDoctorInsight(e.target.value)}
                  placeholder="Enter your insights about the patient's condition, probable causes, differential diagnosis, or any clinical observations..."
                  className="w-full h-32 p-3 border rounded-md bg-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                {isLoading && (
                  <div className="text-center text-gray-500 mt-2">
                    <span className="text-xs">Loading previous insights...</span>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  💡 Your insights will be saved and can be updated anytime. This helps track your clinical reasoning for future reference.
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
                  {treatments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                        No treatments added yet. Click "Add Treatment" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    treatments.map((treatment) => (
                      <TableRow key={treatment.id}>
                        <TableCell className="w-1/2 font-medium">
                          {treatment.treatmentName}
                        </TableCell>
                        <TableCell className="w-1/2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            treatment.coverage === "Full Coverage" 
                              ? "bg-green-100 text-green-800" 
                              : treatment.coverage === "Copay"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {treatment.coverage}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Alternative Treatments */}
          <Card>
            <CardHeader className="w-full flex justify-between items-center">
              <CardTitle className="text-lg">Alternative Treatments</CardTitle>
              <Dialog open={showAddTreatmentDialog} onOpenChange={setShowAddTreatmentDialog}>
                <DialogTrigger asChild>
                  <Button className="text-sm">Add Treatment</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add New Treatment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="treatment-name">Treatment/Medication Name</Label>
                      <Input
                        id="treatment-name"
                        value={newTreatmentName}
                        onChange={(e) => setNewTreatmentName(e.target.value)}
                        placeholder="e.g., Lipitor 20mg, Metformin 500mg"
                        disabled={isAnalyzing}
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      💡 Our AI will analyze this medication and suggest cost-effective alternatives based on the patient's insurance plan.
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddTreatmentDialog(false)}
                        disabled={isAnalyzing}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={addTreatment}
                        disabled={isAnalyzing || !newTreatmentName.trim()}
                      >
                        {isAnalyzing ? "Analyzing..." : "Analyze & Add"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
                  {treatments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                        No treatments with alternatives yet. Add a treatment to see AI-generated alternatives.
                      </TableCell>
                    </TableRow>
                  ) : (
                    treatments.flatMap((treatment) =>
                      treatment.alternatives.map((alternative, index) => (
                        <TableRow key={`${treatment.id}-${index}`}>
                          <TableCell className="w-1/3 font-medium">
                            <div className="space-y-1">
                              <div>{alternative.medicationName}</div>
                              <div className="text-xs text-gray-500">
                                Alternative to: {treatment.treatmentName}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="w-1/3">
                            <div className="space-y-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                alternative.formularyTier.includes("Tier 1") || alternative.estimatedCopay.includes("$0")
                                  ? "bg-green-100 text-green-800" 
                                  : alternative.estimatedCopay.includes("$") && !alternative.estimatedCopay.includes("No")
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {alternative.formularyTier.includes("Tier 1") || alternative.estimatedCopay.includes("$0")
                                  ? "Full Coverage" 
                                  : alternative.estimatedCopay.includes("$") && !alternative.estimatedCopay.includes("No")
                                  ? "Copay"
                                  : "No Coverage"}
                              </span>
                              <div className="text-xs text-gray-600">{alternative.estimatedCopay}</div>
                            </div>
                          </TableCell>
                          <TableCell className="w-1/3">
                            <div className="text-sm">
                              <div className="font-medium text-blue-600">{alternative.formularyTier}</div>
                              <div className="text-xs text-gray-600 mt-1">{alternative.rationale}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  )}
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
    </div>
  );
};

export default PatientSummary;
