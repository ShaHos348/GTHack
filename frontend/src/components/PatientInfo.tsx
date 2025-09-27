import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import PHDoctorView from "./PHDoctorView";
import PQResults from "./PQResults";
import PTestsDoctorView from "./PTestsDoctorView";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { logout } from "./firebase";

export default function PatientInfo() {
  const navigate = useNavigate();
  const pid = React.useMemo(() => {
    const parts = window.location.pathname.split("/");
    return parts[parts.length - 1]; // this is the UID
  }, []);

  const uid = useMemo(() => auth.currentUser?.uid ?? null, [auth.currentUser]);

  const [activeTab, setActiveTab] = React.useState("patient-history");
  const [confirmSignout, setConfirmSignout] = React.useState(false);
  const [displayedTab, setDisplayedTab] = React.useState(activeTab);
  const [fade, setFade] = React.useState(true);
  const [patientFound, setPatientFound] = useState(false);
  const [banner, setBanner] = useState<string>("");

  const handleTabChange = (tab: string) => {
    setFade(false); // start fade out
    setTimeout(() => {
      setFade(true); // fade in
      setActiveTab(tab);
    }, 200); // duration matches CSS fade
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setBanner("");
      if (!pid) {
        setPatientFound(false);
        setBanner("Unable to find patient");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "patients", pid));
        if (mounted) {
          if (snap.exists()) {
            if ((snap.data() as Partial<any>).doctor !== uid) {
              setPatientFound(false);
              setBanner("Unable to find patient");
            } else {
              setPatientFound(true);
            }
          } else {
            setPatientFound(false);
            setBanner("Unable to find patient");
          }
        }
      } catch (e: any) {
        if (mounted) setBanner(`Failed to load: ${e.message || e.code}`);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [pid]);
  const handleSignout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex flex-col items-center bg-transparent py-30">
      <NavigationMenu
        viewport={false}
        className="bg-card text-card-foreground shadow-sm sticky top-4 z-50 mx-auto w-3/4 border-gray-200 border w-md rounded-full flex items-center justify-center px-4 py-3"
      >
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={`w-full font-semibold rounded-full transition-colors bg-transparent "
  ${activeTab === "patient-history" ? "text-primary " : "text-black"}`}
              onClick={() => handleTabChange("patient-history")}
            >
              Patient History
            </NavigationMenuTrigger>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={`w-full font-semibold rounded-full transition-colors bg-transparent "
  ${
    activeTab === "patient-questionnaire-results"
      ? "text-primary "
      : "text-black"
  }`}
              onClick={() => handleTabChange("patient-questionnaire-results")}
            >
              Questionnaire Results
            </NavigationMenuTrigger>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={`w-full font-semibold rounded-full transition-colors bg-transparent "
  ${activeTab === "patient-test-reports" ? "text-primary " : "text-black"}`}
              onClick={() => handleTabChange("patient-test-reports")}
            >
              Test Reports
            </NavigationMenuTrigger>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={`w-full font-semibold rounded-full transition-colors bg-transparent "
  ${activeTab === "patient-prescriptions" ? "text-primary " : "text-black"}`}
              onClick={() => handleTabChange("patient-prescriptions")}
            >
              Prescriptions
            </NavigationMenuTrigger>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={`w-full font-semibold rounded-full transition-colors bg-transparent "
  ${activeTab === "sign-out" ? "text-primary " : "text-black"}`}
              onClick={() => setConfirmSignout(true)}
            >
              Sign Out
            </NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
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

      {/* Dynamic content area */}
      {!patientFound ? (
        <div
          className="mb-4 rounded-md border p-3 text-sm"
          style={{
            borderColor: banner.startsWith("✅") ? "#22c55e33" : "#ef444433",
            background: banner.startsWith("✅") ? "#22c55e11" : "#ef444411",
          }}
        >
          {banner}
        </div>
      ) : (
        <div
          className={`flex-1 w-3/4 transition-opacity duration-200 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {activeTab === "patient-history" && <PHDoctorView pid={pid} />}
          {activeTab === "patient-questionnaire-results" && <PQResults pid={pid} />}
          {activeTab === "patient-test-reports" && <PTestsDoctorView pid={pid}/>}
          {activeTab === "patient-prescriptions" && (
            <div>To be done: patient-prescriptions</div>
          )}
        </div>
      )}
    </div>
  );
}
