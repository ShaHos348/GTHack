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

export default function Navigation() {
  const [activeTab, setActiveTab] = React.useState("patient-questionnaire");
  const [confirmSignout, setConfirmSignout] = React.useState(false);
  const navigate = useNavigate();

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
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              onClick={() => setActiveTab("patient-questionnaire")}
            >
              Patient Questionnaire
            </NavigationMenuTrigger>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger
              onClick={() => setActiveTab("patient-history")}
            >
              Patient History
            </NavigationMenuTrigger>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger
              onClick={() => setActiveTab("patient-tests")}
            >
              Test Reports
            </NavigationMenuTrigger>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger
              onClick={() => setActiveTab("dynamic-questionnaire")}
            >
              Dynamic Questionnaire
            </NavigationMenuTrigger>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger onClick={() => setConfirmSignout(true)}>
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

      <div className="flex-1 w-3/4 bg-red-600">
        {activeTab === "patient-questionnaire" && <PatientQuestionnaire />}
        {activeTab === "patient-history" && <PatientHistory />}
        {activeTab === "patient-tests" && <PatientTests />}
        {activeTab === "dynamic-questionnaire" && <DynamicQuestionnaire />}
      </div>
    </div>
  );
}
