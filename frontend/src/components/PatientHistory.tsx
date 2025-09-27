import React from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

const PatientHistory = () => {
  return (
    <div className="flex items-center justify-center min-h-screen py-14">
      <Card className="w-2/3">
        <CardHeader>
          <CardTitle className="font-bold">Patient History</CardTitle>
          <CardDescription>Fill Out the Form Below</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-8">
              <div className="flex gap-x-4">
                <div className="flex-[40%] flex flex-col gap-2">
                  <Label htmlFor="first-name">Enter your first name:</Label>
                  <Input id="first-name" type="text" required />
                </div>
                <div className="flex-[40%] flex flex-col gap-2">
                  <Label htmlFor="last-name">Enter your last name:</Label>
                  <Input id="last-name" type="text" required />
                </div>

                <div className="flex-[20%] flex-1 flex flex-col gap-2">
                  <Label htmlFor="Birthday">Enter your birthday:</Label>
                  <Input
                    id="birthday"
                    type="date"
                    required
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div className="flex gap-x-4">
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="Phone Number">
                    Enter your phone number (Ex: 999-999-9999):
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    pattern="\d{3}-\d{3}-\d{4}"
                    required
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="email">Enter your email:</Label>
                  <Input id="email" type="email" required />
                </div>
              </div>
              <div className="flex gap-x-4">
                <div className="flex-[70%] flex-1 flex flex-col gap-2">
                  <Label htmlFor="address">
                    Enter your address (Ex: Street Address, Apartment/Suite,
                    City, State, ZIP Code, Country):
                  </Label>
                  <Input id="address" type="text" required />
                </div>
                <div className="flex-[30%] flex flex-col gap-2">
                  <Label htmlFor="sex">Select Sex:</Label>
                  <select
                    id="sex"
                    required
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-gray-200 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-x-4">
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="emergency-name">
                    Enter your emergency contact name:
                  </Label>
                  <Input id="emergency-name" type="text" required />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="relationship">
                    Enter contact relationship to patient:
                  </Label>
                  <Input id="relationship" type="text" required />
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <Label htmlFor="emergency-phone">
                    Enter contact phone number:
                  </Label>
                  <Input id="emergency-phone" type="tel" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="insurance">
                  Enter your insurance provider and policy number (Ex: Insurance
                  Provider, Policy Number):
                </Label>
                <Input id="insurance" type="text" required />
              </div>
              {/* Family & Lifestyle */}
              <div className="grid gap-2">
                <Label htmlFor="current-medications">
                  Enter your current medications (including supplements and
                  OTC):
                </Label>
                <textarea
                  id="current-medications"
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-gray-200 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  rows={4}
                  placeholder="List your current medications here"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="allergies">
                  Enter your allergies (medications, food, environmental – and
                  reactions):
                </Label>
                <textarea
                  id="allergies"
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-gray-200 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  rows={4}
                  placeholder="List your allergies and reactions here"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="past-surgeries">
                  Enter your past surgeries/procedures (types, dates):
                </Label>
                <textarea
                  id="past-surgeries"
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-gray-200 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  rows={4}
                  placeholder="List past surgeries or procedures here"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="family-history">
                  Family History (major diseases: cancer, diabetes, heart
                  disease, etc. with relationship and age):
                </Label>
                <textarea
                  id="family-history"
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-gray-200 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  placeholder="List specifics in family history here"
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lifestyle">
                  Lifestyle Information (smoking, alcohol, drug use, exercise):
                </Label>
                <textarea
                  id="lifestyle"
                  className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-gray-200 w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  placeholder="List lifestyle information here"
                  rows={4}
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Link to="/patientdashboard">
            <Button type="submit" className="w-full">
              Save Patient History
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PatientHistory;
