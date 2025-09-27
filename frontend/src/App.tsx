import { Link } from "react-router-dom";
import Login from "./components/login";

function App() {
  return (
    <div>
      <Login />

      {/* Simple navigation link */}
      <div className="text-3xl text-amber-200 mt-6">
        <Link to="/patienthistory">Go to PatientHistory</Link>
        <Link to="/doctordashboard">Go to Doctor Homepage</Link>
      </div>
    </div>
  );
}

export default App;
