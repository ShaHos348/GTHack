import { Link } from "react-router-dom";
import { PatientsList } from "../components/doctor/PatientsList";

function DoctorDashboard() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-start">
      <div className=" text-3xl text-amber-200">
        <Link to="/">Go to App</Link>
      </div>
      <PatientsList />
    </div>
  );
}

export default DoctorDashboard;
