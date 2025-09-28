import React, { useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";

interface Video {
  id: number;
  title: string;
  description: string;
  url: string;
}

const MeetingSearch = () => {
  const [videos, setVideos] = useState<Video[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedVideo(e.target.files[0]);
      setVideoTitle(""); // Reset for custom input
    }
  };

  const uploadVideo = () => {
    if (!selectedVideo) {
      alert("Please select a video file first.");
      return;
    }
    if (!videoTitle.trim()) {
      alert("Please enter a video title.");
      return;
    }
    const videoUrl = URL.createObjectURL(selectedVideo);
    const newVideo: Video = {
      id: Date.now(),
      title: videoTitle,
      description: "Uploaded video",
      url: videoUrl,
    };
    setVideos((prev) => [...prev, newVideo]);
    setSelectedVideo(null);
    setVideoTitle("");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="flex items-center justify-center py-8 relative">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="font-bold">Meeting Search</CardTitle>
          <CardDescription>
            Search Question&apos;s from your Doctor&apos;s Visit
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="w-full overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 min-w-max py-2">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="min-w-[400px] flex-shrink-0 border p-4 rounded-lg shadow bg-white"
                >
                  <h2 className="font-semibold">{video.title}</h2>
                  <p className="text-sm text-gray-600 mb-2">
                    {video.description}
                  </p>
                  <video
                    src={video.url}
                    controls
                    className="rounded"
                    style={{ width: 400, height: 225, objectFit: "contain" }}
                  />
                </div>
              ))}
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <div className="flex justify-center mt-6 mb-8">
                <Button type="button">Upload new video</Button>
              </div>
            </DialogTrigger>

            <DialogContent className="max-w-md w-full px-6">
              <DialogHeader>
                <DialogTitle>Upload Video</DialogTitle>
              </DialogHeader>
              <div className="mt-2 text-sm">Select a video file to upload.</div>
              <input
                type="file"
                accept="video/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
              <div className="mt-4 flex flex-col gap-4">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-max"
                >
                  Choose Video
                </Button>
                {selectedVideo && (
                  <>
                    <label
                      htmlFor="video-title"
                      className="text-sm font-medium mt-4"
                    >
                      Video Title
                    </label>
                    <input
                      id="video-title"
                      type="text"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Enter video title"
                      className="w-full border rounded px-3 py-2 max-w-full"
                      style={{ boxSizing: "border-box" }}
                    />
                    <div className="text-xs text-gray-600 truncate mt-2">
                      Selected file: {selectedVideo.name}
                    </div>
                  </>
                )}
              </div>
              <DialogFooter className="mt-6 flex flex-wrap justify-end gap-4">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={uploadVideo}>Upload</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card>
            <CardContent>
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-4">
                  <label className="font-medium text-gray-700 min-w-[150px]">
                    Upload Question Here:
                  </label>
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring bg-gray-50"
                  />
                </div>
                <Card className="border border-gray-200 bg-gray-50 shadow-sm">
                  <CardContent className="text-gray-800">
                    Generated answer here
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {showToast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in-out">
          Video uploaded successfully!
        </div>
      )}
    </div>
  );
};

export default MeetingSearch;
