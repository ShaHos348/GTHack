import { Link } from "react-router-dom";
import { PatientsList } from "../components/PatientsList";

function DoctorDashboard() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-12">
      <PatientsList />
    </div>
  );
}

export default DoctorDashboard;
