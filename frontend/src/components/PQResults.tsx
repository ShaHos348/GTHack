import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// List of questions
const questionList = [
  "What brings you in today?",
  "How long have you had this problem?",
  "Is this a new or recurring issue?",
  "Describe the symptoms (location, intensity, triggers, alleviating/worsening factors)",
  "Have you tried any treatments or remedies?",
  "Are there associated symptoms (fever, nausea, pain, etc.)?",
  "Has there been any recent injury or trauma?",
  "Are your symptoms intermittent or constant?",
  "Have you recently started any new medications or supplements?",
];

type QuestionAnswer = {
  question: string;
  answer: string;
};

interface PQResultsProps {
  pid: string | null;
}

const PQResults: React.FC<PQResultsProps> = ({ pid }) => {
  const [qaList, setQaList] = useState<QuestionAnswer[]>(
    questionList.map((q) => ({ question: q, answer: "" }))
  );
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<string>("");
  const [updatedDate, setUpdatedDate] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setBanner("");
      if (!pid) {
        setLoading(false);
        setBanner("Unable to find patient");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "questionnaires", pid));
        if (mounted) {
          if (snap.exists()) {
            const data = snap.data() as {
              answers?: Record<string, string>;
              updatedAt?: Timestamp;
            };

            const updatedQaList = questionList.map((q) => ({
              question: q,
              answer: data.answers?.[q] || "",
            }));
            setQaList(updatedQaList);

            if (data.updatedAt) {
              setUpdatedDate(data.updatedAt.toDate());
            }
          } else {
            setBanner("No questionnaire found for this patient");
          }
        }
      } catch (e: any) {
        if (mounted) setBanner(`Failed to load: ${e.message || e.code}`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pid]);

  return (
    <div className="flex items-center justify-center py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="font-bold">Patient Questionnaire</CardTitle>
          <CardDescription>
            Patient Questionaire submitted on:{" "}
            {updatedDate && (
              <span className="text-gray-500">
                {updatedDate.toLocaleString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {banner && (
            <div
              className="mb-4 rounded-md border p-3 text-sm"
              style={{
                borderColor: banner.startsWith("✅")
                  ? "#22c55e33"
                  : "#ef444433",
                background: banner.startsWith("✅") ? "#22c55e11" : "#ef444411",
              }}
            >
              {banner}
            </div>
          )}

          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="flex flex-col gap-8">
              {qaList.map((qa, index) => (
                <div key={index} className="space-y-2">
                  <Label className="font-semibold">{qa.question}</Label>
                  <div className="border rounded-md px-3 py-2 bg-gray-50">
                    {qa.answer || (
                      <span className="italic text-gray-400">No answer</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PQResults;