import * as React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import PatientHistory from "./PatientHistory";
import PatientQuestionnaire from "./PatientQuestionaire";

export default function PatientInfo() {
  const [activeTab, setActiveTab] = React.useState("patient-questionnaire");
  const [displayedTab, setDisplayedTab] = React.useState(activeTab);
  const [fade, setFade] = React.useState(true);

  const handleTabChange = (tab: string) => {
    setFade(false); // start fade out
    setTimeout(() => {
      setDisplayedTab(tab); // swap component
      setFade(true); // fade in
      setActiveTab(tab);
    }, 200); // duration matches CSS fade
  };

  return (
    <div className="flex flex-col items-center bg-transparent py-30">
      <NavigationMenu
        viewport={false}
        className="sticky top-4 z-50 mx-auto w-3/4 bg-blue-900 shadow-md rounded-full flex items-center justify-center px-4 py-3"
      >
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={`w-full text-white rounded-full hover:bg-blue-500 ${
                activeTab === "patient-history" ? "bg-blue-700" : "bg-blue-900"
              }`}
              onClick={() => handleTabChange("patient-history")}
            >
              Patient History
            </NavigationMenuTrigger>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={`w-full text-white rounded-full hover:bg-blue-500 ${
                activeTab === "patient-questionaire-results"
                  ? "bg-blue-700"
                  : "bg-blue-900"
              }`}
              onClick={() => handleTabChange("patient-questionaire-results")}
            >
              Questionnaire Results
            </NavigationMenuTrigger>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={`w-full text-white rounded-full hover:bg-blue-500 ${
                activeTab === "patient-test-reports"
                  ? "bg-blue-700"
                  : "bg-blue-900"
              }`}
              onClick={() => handleTabChange("patient-test-reports")}
            >
              Test Reports
            </NavigationMenuTrigger>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={`w-full text-white rounded-full hover:bg-blue-500 ${
                activeTab === "patient-prescriptions"
                  ? "bg-blue-700"
                  : "bg-blue-900"
              }`}
              onClick={() => handleTabChange("patient-prescriptions")}
            >
              Prescriptions
            </NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      {/* Dynamic content area */}
      <div
        className={`flex-1 w-3/4 transition-opacity duration-200 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {activeTab === "patient-history" && <PatientHistory />}
        {activeTab === "patient-questionaire-results" && (
          <div>To be done: patient-questionaire-results</div>
        )}
        {activeTab === "patient-test-reports" && (
          <div>To be done: patient-test-reports</div>
        )}
        {activeTab === "patient-prescriptions" && (
          <div>To be done: patient-prescriptions</div>
        )}
      </div>
    </div>
  );
}
