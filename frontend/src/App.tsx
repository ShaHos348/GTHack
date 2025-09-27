import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

function App() {
  return (
    <div>
      <div className=" text-3xl text-amber-200">
        <Link to="/patienthistory">Go to PatientHistory</Link>
      </div>
      <div className="flex min-h-svh flex-col items-center justify-center">
        <Button>Click me</Button>
      </div>
    </div>
  );
}

export default App;
