import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  signInWithEmail,
  signUpWithEmail,
  getUserRole,
  setUserRole,
  type UserRole,
} from "./firebase";

import { Button } from "@/components/ui/button";
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
import { Link, useNavigate } from "react-router-dom";
import loginImage from "../assets/LoginImage.png";
import hospitalBackgroundBlur from "../assets/hospitalbackgroundblur.jpg";
import { Toast } from "./ui/toast";

const StorageTest: React.FC = () => {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [toastInfo, setToastInfo] = useState<[string, string]>(["", ""]);
  const [user, setUser] = useState<any>(null);

  // email/password fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // role
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const ROUTES: Record<UserRole, string> = {
    patient: "/patientdashboard",
    doctor: "/doctordashboard",
  };
  const routeForRole = (r: UserRole | null | undefined) =>
    r && ROUTES[r] ? ROUTES[r] : null;

  // toast helper function
  const showToastMessage = (message: string, color: string = "green") => {
    setToastInfo([message, color]);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (!u) {
        showToastMessage("Not signed in.", "red");
        setRoleState(null);
        setShowRoleModal(false);
        return;
      }

      showToastMessage(`Signed in as ${u.email || u.uid}`, "green");
      const existing = await getUserRole(u.uid);
      if (existing) {
        setRoleState(existing);
        setShowRoleModal(false);
      } else {
        // prompt for role on first sign-in
        setRoleState(null);
        setShowRoleModal(true);
      }
    });
    return () => unsub();
  }, []);

  const handleEmailSignIn = async () => {
    showToastMessage("Signing in…", "green");
    try {
      await signInWithEmail(email.trim(), password);
      const u = auth.currentUser;
      if (!u) {
        showToastMessage("Sign-in failed: no user.", "red");
        return;
      }

      const r = await getUserRole(u.uid);
      const dest = routeForRole(r);
      if (dest) {
        showToastMessage("Signed in", "green");
        navigate(dest);
      } else {
        showToastMessage("Signed in — choose your role", "green");
        setShowRoleModal(true);
      }
    } catch (err: any) {
      console.error(err);
      showToastMessage(`Sign-in failed: ${err.code || err.message}`, "red");
    }
  };

  const handleEmailSignUp = async () => {
    showToastMessage("Creating account…", "green");
    try {
      await signUpWithEmail(email.trim(), password);
      showToastMessage("Account created & signed in", "green");
    } catch (err: any) {
      console.error(err);
      showToastMessage(`Sign-up failed: ${err.code || err.message}`, "red");
    }
  };

  const handleChooseRole = async (r: UserRole) => {
    if (!user) return;
    try {
      await setUserRole(user.uid, r);
      setRoleState(r);
      setShowRoleModal(false);
      showToastMessage(`Role set: ${r}`, "green");
    } catch (e: any) {
      console.error(e);
      showToastMessage(`Failed to set role: ${e.message || e.code}`, "red");
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen py-14 "
      style={{
        backgroundImage: `url(${hospitalBackgroundBlur})`,
        backgroundSize: "cover",
      }}
    >
      <Card className="w-5/6 flex">
        <CardContent className="flex gap-4">
          <Card
            className="w-3/5 bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${loginImage})`,
              backgroundSize: "cover",
            }}
          ></Card>
          <Card className="w-2/5 ">
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      placeholder="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                type="submit"
                className="w-full"
                onClick={handleEmailSignIn}
                disabled={!email || !password}
              >
                Login
              </Button>
              <Button
                type="submit"
                className="w-full"
                onClick={handleEmailSignUp}
                disabled={!email || !password}
              >
                Sign Up
              </Button>
            </CardFooter>
          </Card>
        </CardContent>
      </Card>

      {showToast && <Toast message={toastInfo[0]} color={toastInfo[1]} />}

      {showRoleModal && user && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 8,
              width: 360,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Choose your role</h3>
            <p>This will be tied to your account.</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <Link
                to={"patienthistory"}
                onClick={() => handleChooseRole("patient")}
                style={{ flex: 1 }}
              >
                Patient
              </Link>
              <Link
                to="doctordashboard"
                onClick={() => handleChooseRole("doctor")}
                style={{ flex: 1 }}
              >
                Doctor
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageTest;
