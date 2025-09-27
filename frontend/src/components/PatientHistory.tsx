import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type Values = {
  firstName: string;
  lastName: string;
  birthday: string;
  phone: string;
  email: string;
  address: string;
  sex: string;
  emergencyName: string;
  relationship: string;
  emergencyPhone: string;
  insurance: string;
  currentMedications: string;
  allergies: string;
  pastSurgeries: string;
  familyHistory: string;
  lifestyle: string;
};

type Errors = Partial<Record<keyof Values | "form", string>>;

const emptyValues: Values = {
  firstName: "",
  lastName: "",
  birthday: "",
  phone: "",
  email: "",
  address: "",
  sex: "",
  emergencyName: "",
  relationship: "",
  emergencyPhone: "",
  insurance: "",
  currentMedications: "",
  allergies: "",
  pastSurgeries: "",
  familyHistory: "",
  lifestyle: "",
};

const PatientHistory: React.FC = () => {
  const [values, setValues] = useState<Values>(emptyValues);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string>("");
  const navigate = useNavigate();

  const uid = useMemo(() => auth.currentUser?.uid ?? null, [auth.currentUser]);

  // Load existing data (if any)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setBanner("");
      setErrors({});
      if (!uid) {
        setLoading(false);
        setBanner("Please sign in to view or edit your patient history.");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "patients", uid));
        if (mounted) {
          if (snap.exists()) {
            const data = snap.data() as Partial<Values>;
            setValues({ ...emptyValues, ...data });
          } else {
            setValues(emptyValues);
          }
        }
      } catch (e: any) {
        if (mounted) setBanner(`Failed to load: ${e.message || e.code}`);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [uid]);

  const update =
    (key: keyof Values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
    };

  const validate = (v: Values): Errors => {
    const req: (keyof Values)[] = [
      "firstName",
      "lastName",
      "birthday",
      "phone",
      "email",
      "address",
      "sex",
      "emergencyName",
      "relationship",
      "emergencyPhone",
      "insurance",
      "currentMedications",
      "allergies",
      "pastSurgeries",
    ];
    const next: Errors = {};
    for (const k of req) if (!v[k]) next[k] = "This field is required.";

    if (v.phone && !/^\d{3}-\d{3}-\d{4}$/.test(v.phone))
      next.phone = "Use format 999-999-9999.";
    if (v.emergencyPhone && !/^\d{3}-\d{3}-\d{4}$/.test(v.emergencyPhone))
      next.emergencyPhone = "Use format 999-999-9999.";

    return next;
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setBanner("");
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (!uid) {
      setErrors({ form: "You must be signed in to save." });
      return;
    }

    // save values into database, go to navbar
    setSaving(true);
    try {
      const payload = { ...values, uid, updatedAt: serverTimestamp() };
      await setDoc(doc(db, "patients", uid), payload, { merge: true });
      navigate("/patientdashboard");
    } catch (err: any) {
      setErrors({ form: err?.message || "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const FieldError = ({ name }: { name: keyof Values }) =>
    errors[name] ? <p className="text-sm text-red-600 mt-1">{errors[name]}</p> : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="font-bold">Patient History</CardTitle>
          <CardDescription>Fill out or update your information</CardDescription>
        </CardHeader>

        <CardContent>
          {banner && (
            <div className="mb-4 rounded-md border p-3 text-sm"
                 style={{
                   borderColor: banner.startsWith("✅") ? "#22c55e33" : "#ef444433",
                   background: banner.startsWith("✅") ? "#22c55e11" : "#ef444411",
                 }}>
              {banner}
            </div>
          )}
          {errors.form && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-8">
              <div className="flex gap-x-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input id="first-name" value={values.firstName} onChange={update("firstName")} />
                  <FieldError name="firstName" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" value={values.lastName} onChange={update("lastName")} />
                  <FieldError name="lastName" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={values.birthday}
                    onChange={update("birthday")}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  <FieldError name="birthday" />
                </div>
              </div>

              <div className="flex gap-x-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="phone">Phone (999-999-9999)</Label>
                  <Input id="phone" value={values.phone} onChange={update("phone")} />
                  <FieldError name="phone" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={values.email} onChange={update("email")} />
                  <FieldError name="email" />
                </div>
              </div>

              <div className="flex gap-x-4">
                <div className="flex-[70%] space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={values.address} onChange={update("address")} />
                  <FieldError name="address" />
                </div>
                <div className="flex-[30%] space-y-2">
                  <Label htmlFor="sex">Sex</Label>
                  <select
                    id="sex"
                    value={values.sex}
                    onChange={update("sex")}
                    className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-gray-200 h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none md:text-sm"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <FieldError name="sex" />
                </div>
              </div>

              <div className="flex gap-x-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="emergency-name">Emergency contact</Label>
                  <Input id="emergency-name" value={values.emergencyName} onChange={update("emergencyName")} />
                  <FieldError name="emergencyName" />
                </div>
                <div className="flex-1 space-y-2">
                <Label htmlFor="relationship">Relationship</Label>
                  <Input id="relationship" value={values.relationship} onChange={update("relationship")} />
                  <FieldError name="relationship" />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="emergency-phone">Emergency phone</Label>
                  <Input id="emergency-phone" value={values.emergencyPhone} onChange={update("emergencyPhone")} />
                  <FieldError name="emergencyPhone" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insurance">Insurance + policy number</Label>
                <Input id="insurance" value={values.insurance} onChange={update("insurance")} />
                <FieldError name="insurance" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current-medications">Current medications</Label>
                <textarea
                  id="current-medications"
                  value={values.currentMedications}
                  onChange={update("currentMedications")}
                  rows={4}
                  className="border rounded-md px-3 py-2 w-full"
                />
                <FieldError name="currentMedications" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <textarea
                  id="allergies"
                  value={values.allergies}
                  onChange={update("allergies")}
                  rows={4}
                  className="border rounded-md px-3 py-2 w-full"
                />
                <FieldError name="allergies" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="past-surgeries">Past surgeries/procedures</Label>
                <textarea
                  id="past-surgeries"
                  value={values.pastSurgeries}
                  onChange={update("pastSurgeries")}
                  rows={4}
                  className="border rounded-md px-3 py-2 w-full"
                />
                <FieldError name="pastSurgeries" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="family-history">Family history</Label>
                <textarea
                  id="family-history"
                  value={values.familyHistory}
                  onChange={update("familyHistory")}
                  rows={4}
                  className="border rounded-md px-3 py-2 w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lifestyle">Lifestyle</Label>
                <textarea
                  id="lifestyle"
                  value={values.lifestyle}
                  onChange={update("lifestyle")}
                  rows={4}
                  className="border rounded-md px-3 py-2 w-full"
                />
              </div>

              <CardFooter className="px-0">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Saving..." : "Save Patient History"}
                </Button>
              </CardFooter>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientHistory;
