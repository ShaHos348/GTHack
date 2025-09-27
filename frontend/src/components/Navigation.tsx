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

export default function Navigation() {
  const [activeTab, setActiveTab] = React.useState("patient-questionnaire");

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
            <NavigationMenuTrigger onClick={() => setActiveTab("signout")}>
              Sign Out
            </NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex-1 w-3/4 bg-red-600">
        {activeTab === "patient-questionnaire" && <PatientQuestionnaire />}
        {activeTab === "patient-history" && <PatientHistory />}
        {activeTab === "patient-tests" && <PatientTests />}
        {activeTab === "dynamic-questionnaire" && <DynamicQuestionnaire />}
        {activeTab === "signout" && <div>To be done</div>}
      </div>
    </div>
  );
}
