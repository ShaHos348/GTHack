// src/components/StorageTest.tsx
import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  signInWithGoogle,
  logout,
  uploadFile,
  signInWithEmail,
  signUpWithEmail,
} from "./firebase";

const StorageTest: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<string>("Not signed in.");
  const [file, setFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  // email/password fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setStatus(u ? `Signed in as ${u.email || u.uid}` : "Not signed in.");
      setDownloadUrl("");
    });
    return () => unsub();
  }, []);

  const handleEmailSignIn = async () => {
    setStatus("Signing in…");
    try {
      await signInWithEmail(email.trim(), password);
      setStatus("✅ Signed in");
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
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Sign-up failed: ${err.code || err.message}`);
    }
  };

  const handleUpload = async () => {
    if (!user || !file) return;
    setStatus("Uploading…");
    try {
      const url = await uploadFile(user.uid, file);
      setDownloadUrl(url);
      setStatus("✅ Uploaded!");
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Upload failed: ${err?.code || err?.message || String(err)}`);
    }
  };

  return (
    <div style={{ fontFamily: "system-ui", padding: "1rem", maxWidth: 640, margin: "0 auto" }}>
      <h2>Login + Upload</h2>
      <p style={{ marginBottom: 12 }}>{status}</p>

      {!user ? (
        <>
          {/* Email/Password auth */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1, padding: 6 }}
            />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ flex: 1, padding: 6 }}
            />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button onClick={handleEmailSignIn} disabled={!email || !password}>Sign in</button>
            <button onClick={handleEmailSignUp} disabled={!email || !password}>Sign up</button>
            <button onClick={signInWithGoogle}>Sign in with Google</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button onClick={handleUpload} disabled={!file}>Upload File</button>
            <button onClick={logout}>Sign out</button>
          </div>

          {downloadUrl && (
            <div>
              <strong>File URL:</strong>{" "}
              <a href={downloadUrl} target="_blank" rel="noreferrer">
                {downloadUrl}
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StorageTest;
