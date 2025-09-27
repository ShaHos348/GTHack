import { Link } from "react-router-dom";

function App() {
  return (
    <div>
      <div className=" text-3xl text-amber-200">
        <Link to="/patienthistory">Go to PatientHistory</Link>
      </div>
    </div>
  );
}

export default App;
