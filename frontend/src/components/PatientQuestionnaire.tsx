"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

// Type for question + answer
type QuestionAnswer = {
  question: string;
  answer: string;
};

const PatientQuestionnaire: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  const [qaList, setQaList] = useState<QuestionAnswer[]>(
    questionList.map((q) => ({ question: q, answer: "" }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string>("");

  // Use auth.currentUser if patientId is not provided
  const uid = patientId || auth.currentUser?.uid || null;

  // Load existing answers from the new collection
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!uid) {
        setBanner("Please sign in to view or edit the questionnaire.");
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "questionnaires", uid));
        if (mounted && snap.exists()) {
          const data = snap.data();
          if (data?.answers) {
            setQaList(
              questionList.map((q) => ({
                question: q,
                answer: data.answers[q] || "",
              }))
            );
          }
        }
      } catch (err: any) {
        if (mounted) setBanner(`Failed to load: ${err.message || err.code}`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [uid]);

  const handleChange = (index: number) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQaList((prev) => {
      const next = [...prev];
      next[index].answer = e.target.value;
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBanner("");

    if (!uid) {
      setBanner("You must be signed in to save.");
      return;
    }

    setSaving(true);
    try {
      // Convert array to object { question: answer }
      const payload: Record<string, string> = {};
      qaList.forEach((qa) => {
        payload[qa.question] = qa.answer;
      });

      await setDoc(
        doc(db, "questionnaires", uid),
        { answers: payload, updatedAt: serverTimestamp() },
        { merge: true }
      );

      setBanner("✅ Questionnaire saved successfully!");
      navigate("/patientdashboard");
    } catch (err: any) {
      setBanner(`Failed to save: ${err?.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="font-bold">Patient Questionnaire</CardTitle>
          <CardDescription>Answer the questions below</CardDescription>
        </CardHeader>

        <CardContent>
          {banner && (
            <div
              className="mb-4 rounded-md border p-3 text-sm"
              style={{
                borderColor: banner.startsWith("✅") ? "#22c55e33" : "#ef444433",
                background: banner.startsWith("✅") ? "#22c55e11" : "#ef444411",
              }}
            >
              {banner}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-8">
              {qaList.map((qa, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`question-${index}`}>{qa.question}</Label>
                  <textarea
                    id={`question-${index}`}
                    rows={4}
                    value={qa.answer}
                    onChange={handleChange(index)}
                    className="border rounded-md px-3 py-2 w-full"
                  />
                </div>
              ))}
              <CardFooter>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? "Saving..." : "Save Answers"}
                </Button>
              </CardFooter>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientQuestionnaire;
