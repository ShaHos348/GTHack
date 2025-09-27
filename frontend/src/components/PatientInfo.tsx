"use client";

import * as React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import PatientHistory from "./PatientHistory";

export default function PatientInfo() {
  const [activeTab, setActiveTab] = React.useState("home");

  return (
    <div className="flex flex-col align-middle bg-transparent items-center py-30">
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger onClick={() => setActiveTab("home")}>
              Home
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
        {activeTab === "home" && <div>Welcome to Home</div>}
        {activeTab === "patient-history" && <PatientHistory />}
        {activeTab === "about" && <div>About Us</div>}
      </div>
    </div>
  );
}