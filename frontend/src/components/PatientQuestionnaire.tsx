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

const PatientQuestionnaire = () => {
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

  return (
    <div className="flex items-center justify-center py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="font-bold">Patient Questionnaire</CardTitle>
          <CardDescription>Answer the Questions Below</CardDescription>
        </CardHeader>

        <CardContent>
          <form>
            <div className="flex flex-col gap-8">
              {questionList.map((question, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`question-${index}`}>{question}</Label>
                  <textarea
                    id={`question-${index}`}
                    rows={4}
                    className="border rounded-md px-3 py-2 w-full"
                  />
                </div>
              ))}
            </div>
          </form>
        </CardContent>

        <CardFooter>
          <Button type="submit">Continue </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PatientQuestionnaire;
