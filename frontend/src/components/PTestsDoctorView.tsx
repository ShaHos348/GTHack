import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth, fetchUserFiles, type UserFile } from "./firebase";

interface PTestsProps {
  pid: string | null;
}

const PTestsDoctorView: React.FC<PTestsProps> = ({ pid }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UserFile[]>([]);
  const [fullScreenFile, setFullScreenFile] = useState<UserFile | null>(null);
  const uid = auth.currentUser?.uid || "";

  useEffect(() => {
    if (!pid) return;

    const fetchFiles = async () => {
      try {
        const files = await fetchUserFiles(pid);
        const sortedFiles = files.sort((a, b) => (a.name > b.name ? -1 : 1));
        setUploadedFiles(sortedFiles);
      } catch (err) {
        console.error("Error fetching files:", err);
      }
    };

    fetchFiles();
  }, [pid]);

  return (
    <div className="flex items-center justify-center py-8">
      <Card className="w-full max-w-5xl">
        <CardHeader>
          <CardTitle className="font-bold text-xl">
            Patient Test Reports
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-4">
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-4">Uploaded Reports:</h3>
                <div className="w-full overflow-x-auto">
                  <div className="flex gap-4 min-w-max">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.name}
                        className="min-w-[280px] max-w-xs border rounded shadow-sm p-3 flex flex-col"
                      >
                        {/* Preview */}
                        <div className="flex-1 flex items-center justify-center bg-gray-50 rounded">
                          {file.name.endsWith(".pdf") ? (
                            <iframe
                              src={file.url}
                              title={file.name}
                              className="w-full h-48 border rounded"
                            />
                          ) : (
                            <img
                              src={file.url}
                              alt={file.name}
                              className="max-h-48 object-contain"
                            />
                          )}
                        </div>

                        {/* Filename */}
                        <p className="mt-2 text-sm text-center truncate">
                          {file.name.split("/").pop()}
                        </p>

                        {/* Buttons at bottom */}
                        <div className="mt-3 flex justify-between gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => setFullScreenFile(file)}
                          >
                            Full Screen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Full screen modal */}
      {fullScreenFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="relative w-full max-w-6xl h-full max-h-[90vh] p-4">
            <Button
              className="absolute -top-6 -right-1"
              variant="outline"
              onClick={() => setFullScreenFile(null)}
            >
              ✕ Close
            </Button>
            {fullScreenFile.name.endsWith(".pdf") ? (
              <iframe
                src={fullScreenFile.url}
                title={fullScreenFile.name}
                className="w-full h-full border rounded"
              />
            ) : (
              <img
                src={fullScreenFile.url}
                alt={fullScreenFile.name}
                className="w-full h-full object-contain border rounded"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PTestsDoctorView;
