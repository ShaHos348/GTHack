import { useNavigate } from "react-router-dom";
import { PatientsList } from "../components/PatientsList";
import { logout } from "../components/firebase";
import { useState } from "react";
import { Button } from "../components/ui/button";

function DoctorDashboard() {
  const [confirmSignout, setConfirmSignout] = useState(false);
  const navigate = useNavigate();

  const handleSignout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error signing out:" + error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-12">
      <div className="w-4/5 mx-auto flex mb-1.5">
        <Button
          className="font-semibold bg-red-500"
          onClick={() => setConfirmSignout(true)}
        >
          Sign Out
        </Button>
      </div>

      <PatientsList />
      {confirmSignout && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="text-lg font-bold mb-4">Confirm Sign Out</h2>
            <p className="mb-6">Are you sure you want to sign out?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmSignout(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSignout}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
