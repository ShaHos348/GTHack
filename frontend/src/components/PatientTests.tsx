import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth, uploadFile, fetchUserFiles, deleteFile, type UserFile } from "./firebase";

const PatientTests = () => {
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UserFile | null>(null); // Only one file
  const uid = auth.currentUser?.uid || "";

  // Fetch the latest file on mount
  useEffect(() => {
    if (!uid) return;

    const fetchFiles = async () => {
      try {
        const files = await fetchUserFiles(uid);
        if (files.length > 0) {
          // Keep only the newest file (based on filename timestamp if you use timestamps)
          const newest = files.sort((a, b) => (a.name > b.name ? -1 : 1))[0];
          setUploadedFile(newest);
        }
      } catch (err) {
        console.error("Error fetching files:", err);
      }
    };

    fetchFiles();
  }, [uid]);

  const handleUpload = async () => {
    if (!insuranceFile || !uid) return;

    try {
      // Delete previous file if exists
      if (uploadedFile) {
        await deleteFile(uid, uploadedFile.name);
      }

      const url = await uploadFile(uid, insuranceFile);
      setUploadedFile({ name: `uploads/${uid}/${Date.now()}-${insuranceFile.name}`, url });

      setInsuranceFile(null);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("❌ Failed to upload file.");
    }
  };

  return (
    <div className="flex items-center justify-center py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="font-bold">Patient Test</CardTitle>
          <CardDescription>
            Upload New and See Latest Test / Insurance Card
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4">
            <input
              type="file"
              accept="image/*, .pdf"
              onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)}
            />
            <Button onClick={handleUpload} disabled={!insuranceFile}>
              Upload Insurance Card
            </Button>

            {uploadedFile && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Latest File:</h3>
                {uploadedFile.name.endsWith(".pdf") ? (
                  <a
                    href={uploadedFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {uploadedFile.name}
                  </a>
                ) : (
                  <img
                    src={uploadedFile.url}
                    alt={uploadedFile.name}
                    className="max-w-xs border rounded"
                  />
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit">Continue</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PatientTests;
