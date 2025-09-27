"use client";

import * as React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import PatientHistory from "./PatientHistory";
import PatientQuestionaire from "./PatientQuestionaire";

export default function Navigation() {
  const [activeTab, setActiveTab] = React.useState("patient-questionaire");

  return (
    <div className="flex flex-col align-middle bg-transparent items-center py-30">
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger
              onClick={() => setActiveTab("patient-questionaire")}
            >
              Patient Questionaire
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
            <NavigationMenuTrigger onClick={() => setActiveTab("about")}>
              About
            </NavigationMenuTrigger>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      {/* Dynamic content area */}
      <div className="flex-1 w-3/4 bg-red-600">
        {activeTab === "patient-questionaire" && <PatientQuestionaire />}
        {activeTab === "patient-history" && <PatientHistory />}
        {activeTab === "about" && <div>About Us</div>}
      </div>
    </div>
  );
}
