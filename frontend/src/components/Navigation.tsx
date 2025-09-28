"use client";

import * as React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import PatientHistory from "./PatientHistory";
import PatientQuestionnaire from "./PatientQuestionnaire";
import PatientTests from "./PatientTests";
import DynamicQuestionnaire from "./DynamicQuestionnaire";
import { logout } from "./firebase";
import { useNavigate } from "react-router-dom";
import MeetingSearch from "./MeetingSearch";
import Logo from "../../public/Logo.png"

export default function Navigation() {
  const [activeTab, setActiveTab] = React.useState("patient-questionnaire");
  const [confirmSignout, setConfirmSignout] = React.useState(false);
  const [displayedTab, setDisplayedTab] = React.useState(activeTab);
  const navigate = useNavigate();

  const [fade, setFade] = React.useState(true);

  const handleTabChange = (tab: string) => {
    setFade(false); // start fade out
    setTimeout(() => {
      setDisplayedTab(tab); // swap component
      setFade(true); // fade in
      setActiveTab(tab);
    }, 200); // duration matches CSS fade
  };
  const handleSignout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex flex-col align-middle bg-transparent items-center">
      <NavigationMenu
        viewport={false}
        className="sticky top-4 z-50 mx-auto w-3/4 bg-purple-100 text-card-foreground border border-gray-200 rounded-full shadow-sm flex items-center justify-center px-4 py-3"
      >
        <NavigationMenuList>
           <NavigationMenuItem>
              <img 
                src={Logo} 
                alt="Logo" 
                className="h-8 w-8 object-contain" 
              />
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={`w-full font-semibold rounded-full transition-colors bg-transparent "
  ${activeTab === "patient-questionnaire" ? "text-primary " : "text-black"}`}
              onClick={() => handleTabChange("patient-questionnaire")}
            >
              Patient Questionnaire
            </NavigationMenuTrigger>
          </NavigationMenuItem>

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
  ${activeTab === "meeting-search" ? "text-primary " : "text-black"}`}
              onClick={() => handleTabChange("meeting-search")}
            >
              Meeting Search
            </NavigationMenuTrigger>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={`w-full font-semibold rounded-full transition-colors bg-transparent "
  ${activeTab === "patient-tests" ? "text-primary " : "text-black"}`}
              onClick={() => handleTabChange("patient-tests")}
            >
              Test Reports
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
      </NavigationMenu>

      <div
        className={`flex-1 w-3/4 transition-opacity duration-200 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {activeTab === "meeting-search" && <MeetingSearch />}
        {activeTab === "patient-questionnaire" && (
          <PatientQuestionnaire
            onComplete={() => handleTabChange("dynamic-questionnaire")}
          />
        )}
        {activeTab === "patient-history" && <PatientHistory />}
        {activeTab === "patient-tests" && <PatientTests />}
        {activeTab === "dynamic-questionnaire" && <DynamicQuestionnaire />}
      </div>
    </div>
  );
}
