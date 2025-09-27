import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  signInWithGoogle,
  logout,
  uploadFile,
  signInWithEmail,
  signUpWithEmail,
  getUserRole,
  setUserRole,
  type UserRole,
} from "./firebase";

import { Button } from "@/components/ui/button";
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
import { Link, useNavigate } from "react-router-dom";

const StorageTest: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<string>("Not signed in.");
  const [file, setFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  // email/password fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // role
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const ROUTES: Record<UserRole, string> = {
    patient: "/navigation",       // or "/patientdashboard" if you prefer
    doctor: "/doctordashboard",
  };
  const routeForRole = (r: UserRole | null | undefined) =>
    r && ROUTES[r] ? ROUTES[r] : null;


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setDownloadUrl("");

      if (!u) {
        setStatus("Not signed in.");
        setRoleState(null);
        setShowRoleModal(false);
        return;
      }

      setStatus(`Signed in as ${u.email || u.uid}`);
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
  setStatus("Signing in…");
  try {
    await signInWithEmail(email.trim(), password);
    const u = auth.currentUser;
    if (!u) {
      setStatus("❌ Sign-in failed: no user.");
      return;
    }

    // fetch stored role
    const r = await getUserRole(u.uid);

    // if role exists → route; otherwise show the modal to set a role
    const dest = routeForRole(r);
    if (dest) {
      setStatus("✅ Signed in");
      navigate(dest);
    } else {
      setStatus("✅ Signed in — choose your role");
      setShowRoleModal(true);
    }
  } catch (err: any) {
    console.error(err);
    setStatus(`❌ Sign-in failed: ${err.code || err.message}`);
  }
};


  const handleEmailSignUp = async () => {
    setStatus("Creating account…");
    try {
      await signUpWithEmail(email.trim(), password);
      setStatus("✅ Account created & signed in");
      // role will be collected by modal after state change
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Sign-up failed: ${err.code || err.message}`);
    }
  };

  const handleChooseRole = async (r: UserRole) => {
    if (!user) return;
    try {
      await setUserRole(user.uid, r);
      setRoleState(r);
      setShowRoleModal(false);
      setStatus(`✅ Role set: ${r}`);
    } catch (e: any) {
      console.error(e);
      setStatus(`❌ Failed to set role: ${e.message || e.code}`);
    }
  };

  const handleUpload = async () => {
    if (!user || !file) return;
    if (!role) {
      setStatus("Please choose a role first.");
      setShowRoleModal(true);
      return;
    }
    setStatus("Uploading…");
    try {
      const url = await uploadFile(user.uid, file);
      setDownloadUrl(url);
      setStatus("✅ Uploaded!");
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setStatus(
        `❌ Upload failed: ${err?.code || err?.message || String(err)}`
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-14">
      <Card className="w-full max-w-sm">
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
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
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
          <Button
            variant="outline"
            className="w-full"
            onClick={signInWithGoogle}
          >
            Login with Google
          </Button>
        </CardFooter>
      </Card>

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

    // <div style={{ fontFamily: "system-ui", padding: "1rem", maxWidth: 640, margin: "0 auto" }}>
    //   <h2>Login + Role + Upload</h2>
    //   <p style={{ marginBottom: 12 }}>{status}</p>

    //   {!user ? (
    //     <>
    //       {/* Email/Password auth */}
    //       <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
    //         <input
    //           type="email"
    //           placeholder="email@example.com"
    //           value={email}
    //           onChange={(e) => setEmail(e.target.value)}
    //           style={{ flex: 1, padding: 6 }}
    //         />
    //         <input
    //           type="password"
    //           placeholder="password"
    //           value={password}
    //           onChange={(e) => setPassword(e.target.value)}
    //           style={{ flex: 1, padding: 6 }}
    //         />
    //       </div>
    //       <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
    //         <button onClick={handleEmailSignIn} disabled={!email || !password}>Sign in</button>
    //         <button onClick={handleEmailSignUp} disabled={!email || !password}>Sign up</button>
    //         <button onClick={signInWithGoogle}>Sign in with Google</button>
    //       </div>
    //     </>
    //   ) : (
    //     <>
    //       <div style={{ marginBottom: 8 }}>
    //         <strong>Role:</strong> {role ?? "(not set)"}{" "}
    //         {role && <span style={{ opacity: 0.7 }}>(stored in Firestore)</span>}
    //       </div>

    //       <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
    //         <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
    //         <button onClick={handleUpload} disabled={!file}>Upload File</button>
    //         <button onClick={logout}>Sign out</button>
    //       </div>

    //       {downloadUrl && (
    //         <div>
    //           <strong>File URL:</strong>{" "}
    //           <a href={downloadUrl} target="_blank" rel="noreferrer">
    //             {downloadUrl}
    //           </a>
    //         </div>
    //       )}
    //     </>
    //   )}

    //   {/* Simple role modal */}
    //   {showRoleModal && user && (
    //     <div
    //       role="dialog"
    //       aria-modal="true"
    //       style={{
    //         position: "fixed",
    //         inset: 0,
    //         background: "rgba(0,0,0,.5)",
    //         display: "flex",
    //         alignItems: "center",
    //         justifyContent: "center",
    //         zIndex: 50,
    //       }}
    //     >
    //       <div style={{ background: "#fff", padding: 16, borderRadius: 8, width: 360 }}>
    //         <h3 style={{ marginTop: 0 }}>Choose your role</h3>
    //         <p>This will be tied to your account.</p>
    //         <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
    //           <button onClick={() => handleChooseRole("patient")} style={{ flex: 1 }}>
    //             Patient
    //           </button>
    //           <button onClick={() => handleChooseRole("doctor")} style={{ flex: 1 }}>
    //             Doctor
    //           </button>
    //         </div>
    //       </div>
    //     </div>
    //   )}
    // </div>
  );
};

export default StorageTest;
