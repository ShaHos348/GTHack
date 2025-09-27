import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PatientTests = () => {
  return (
    <div className="flex items-center justify-center py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="font-bold">Patient Test</CardTitle>
          <CardDescription>Upload New and See Past Tests</CardDescription>
        </CardHeader>

        <CardContent>
          <form>
            <div className="flex flex-col gap-8"></div>
          </form>
        </CardContent>

        <CardFooter>
          <Button type="submit">Continue </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PatientTests;
