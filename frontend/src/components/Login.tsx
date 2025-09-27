// src/components/StorageTest.tsx
import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signInWithGoogle, logout, uploadFile } from "./firebase";

const StorageTest: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<string>("Not signed in.");
  const [file, setFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setStatus(u ? `Signed in as ${u.email || u.uid}` : "Not signed in.");
      setDownloadUrl("");
    });
    return () => unsub();
  }, []);

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
      <h2>Login + Upload (Firestore URL flow)</h2>
      <p style={{ marginBottom: 12 }}>{status}</p>

      {!user ? (
        <button onClick={signInWithGoogle}>Sign in with Google</button>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button onClick={handleUpload} disabled={!file}>
              Upload File
            </button>
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
