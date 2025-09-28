import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { useAuth } from "../hooks/useAuth";

interface Video {
  id: string;
  title: string;
  description: string;
  filename: string;
  patientId: string;
  doctorId?: string;
  uploadedAt: string;
  processingStatus: 'uploading' | 'processing' | 'queued' | 'ready' | 'failed';
  processingProgress: number;
  twelveLabsVideoId?: string;
  twelveLabsTaskId: string;
}

interface SearchResult {
  videoId: string;
  score: number;
  start: number;
  end: number;
  confidence: string;
  transcript: string;
  thumbnailUrl?: string;
}

interface CombinedSearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  textAnalysis: string;
  totalResults: number;
}

const MeetingSearch = () => {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [textAnalysis, setTextAnalysis] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");


  // Get patient ID from current user (assuming patient is logged in)
  const patientId = currentUser?.uid || 'demo-patient';



  const loadPatientVideos = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3000/patient/${patientId}/videos`);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  }, [patientId]);

  const updateVideoStatuses = useCallback(async () => {
    try {
      setShowToast(true);
      setToastMessage("Checking video statuses...");
      
      const response = await fetch(`http://localhost:3000/patient/${patientId}/update-video-statuses`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Status update result:', result);
        
        // Reload videos to show updated statuses
        await loadPatientVideos();
        
        setToastMessage(`Updated ${result.updated} video statuses`);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        throw new Error('Failed to update statuses');
      }
    } catch (error) {
      console.error('Error updating video statuses:', error);
      setToastMessage("Failed to update video statuses");
      setTimeout(() => setShowToast(false), 3000);
    }
  }, [patientId, loadPatientVideos, setShowToast, setToastMessage]);

  // Load patient's videos on component mount
  useEffect(() => {
    loadPatientVideos();
  }, [loadPatientVideos]);

  // Check for processing videos and update statuses
  useEffect(() => {
    const hasProcessingVideos = videos.some(v => 
      v.processingStatus === 'queued' || 
      v.processingStatus === 'processing' || 
      v.processingStatus === 'uploading'
    );
    
    if (hasProcessingVideos && videos.length > 0) {
      // Wait a moment then update statuses
      const timer = setTimeout(updateVideoStatuses, 3000);
      return () => clearTimeout(timer);
    }
  }, [videos, updateVideoStatuses]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedVideo(e.target.files[0]);
      setVideoTitle(""); // Reset for custom input
      setVideoDescription("");
    }
  };

  const uploadVideo = async () => {
    if (!selectedVideo) {
      alert("Please select a video file first.");
      return;
    }
    if (!videoTitle.trim()) {
      alert("Please enter a video title.");
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('video', selectedVideo);
      formData.append('patientId', patientId);
      formData.append('title', videoTitle);
      formData.append('description', videoDescription);
      formData.append('doctorId', currentUser?.uid || '');

      const response = await fetch('http://localhost:3000/twelvelabs/upload-video', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Video uploaded successfully:', result);
        
        setToastMessage("Video uploaded successfully! Processing will begin shortly.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
        
        // Reload videos list
        loadPatientVideos();
        
        // Reset form
        setSelectedVideo(null);
        setVideoTitle("");
        setVideoDescription("");
        
        // Start checking processing status using task ID or video ID
        const idToTrack = result.twelveLabsTaskId || result.twelveLabsVideoId;
        if (idToTrack) {
          checkProcessingStatus(idToTrack);
        } else {
          console.log('No TwelveLabs ID returned, processing status cannot be tracked');
        }
        
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const checkProcessingStatus = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/twelvelabs/video-status/${id}`);
      if (response.ok) {
        const status = await response.json();
        console.log('Processing status:', status);
        
        if (status.status === 'ready') {
          loadPatientVideos(); // Refresh videos list
          setToastMessage("Video processing completed! You can now search through it.");
          setShowToast(true);
          setTimeout(() => setShowToast(false), 5000);
        } else if (status.status === 'processing' || status.status === 'queued' || status.status === 'uploading') {
          // Check again in 10 seconds for queued, processing, or uploading status
          setTimeout(() => checkProcessingStatus(id), 10000);
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("Please enter a search query.");
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch('http://localhost:3000/twelvelabs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          patientId: patientId,
          videoIds: selectedVideoId ? [selectedVideoId] : undefined,
        }),
      });

      if (response.ok) {
        const result: CombinedSearchResponse = await response.json();
        setSearchResults(result.results || []);
        setTextAnalysis(result.textAnalysis || '');
        console.log('Combined search results:', result);
      } else {
        const error = await response.json();
        console.log('Search failed, trying analyze-only fallback:', error);
        
        // Fallback: Try analyze-only if search fails
        const firstVideo = videos.find(v => v.twelveLabsVideoId);
        if (firstVideo?.twelveLabsVideoId) {
          const analyzeResponse = await fetch('http://localhost:3000/twelvelabs/analyze-only', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoId: firstVideo.twelveLabsVideoId,
              prompt: searchQuery,
              temperature: 0.2
            })
          });
          
          if (analyzeResponse.ok) {
            const analyzeResult = await analyzeResponse.json();
            setTextAnalysis(analyzeResult.textAnalysis || 'No analysis available');
            setSearchResults([]); // No timestamp results from analyze-only
            console.log('Analyze-only fallback successful:', analyzeResult);
          } else {
            throw new Error(error.error || 'Both search and analysis failed');
          }
        } else {
          throw new Error(error.error || 'Search failed and no video available for analysis');
        }
      }
    } catch (error) {
      console.error('Error searching videos:', error);
      alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  };



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center py-8 relative">
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle className="font-bold">Meeting Search</CardTitle>
          <CardDescription>
            Upload and search through your doctor&apos;s visit recordings
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Video Search Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label className="font-medium text-gray-700 min-w-[100px]">
                    Search Query:
                  </Label>
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask about symptoms, treatments, medications..."
                    className="flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? 'Searching & Analyzing...' : 'Search & Analyze'}
                  </Button>
                </div>
                
                {videos.length > 1 && (
                  <div className="flex items-center gap-4">
                    <Label className="font-medium text-gray-700 min-w-[100px]">
                      Search in:
                    </Label>
                    <select
                      value={selectedVideoId}
                      onChange={(e) => setSelectedVideoId(e.target.value)}
                      className="px-3 py-2 border rounded focus:outline-none focus:ring"
                    >
                      <option value="">All videos</option>
                      {videos.filter(v => v.twelveLabsVideoId).map((video) => (
                        <option key={video.id} value={video.twelveLabsVideoId}>
                          {video.title} ({video.processingStatus})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Combined Search Results */}
          {(searchResults.length > 0 || textAnalysis) && (
            <>
              {/* Text Analysis Card */}
              {textAnalysis && (
                <Card className="border border-gray-200 bg-gray-50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">AI Analysis</CardTitle>
                    <CardDescription>Generated answer from your video content</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {textAnalysis}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timestamp Results */}
              {searchResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Video Timestamps</CardTitle>
                    <CardDescription>
                      Found {searchResults.length} relevant segment(s) with timestamps
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {searchResults.map((result, index) => (
                        <div key={index} className="border p-4 rounded-lg bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-sm text-gray-600">
                              Video: {videos.find(v => v.twelveLabsVideoId === result.videoId)?.title || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatTime(result.start)} - {formatTime(result.end)}
                            </div>
                          </div>
                          <div className="text-sm mb-2">
                            <strong>Transcript:</strong> {result.transcript}
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                              Confidence: {result.confidence} | Score: {result.score.toFixed(2)}
                            </div>
                            <Button size="sm" variant="outline">
                              Jump to {formatTime(result.start)}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}



          {/* Horizontal Video Scroll */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Your Videos</CardTitle>
                  <CardDescription>
                    {videos.length === 0 ? 'No videos uploaded yet' : `${videos.length} video(s) uploaded`}
                  </CardDescription>
                </div>
                {videos.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={updateVideoStatuses}
                    className="ml-4"
                  >
                    🔄 Refresh Status
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {videos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Upload your first video to get started with semantic search
                </div>
              ) : (
                <div className="w-full overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 min-w-max py-2">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="min-w-[400px] flex-shrink-0 border p-4 rounded-lg shadow bg-white"
                      >
                        <h2 className="font-semibold mb-1">{video.title}</h2>
                        <p className="text-sm text-gray-600 mb-2">
                          {video.description}
                        </p>
                        <div className="text-xs text-gray-500 mb-2">
                          Uploaded: {new Date(video.uploadedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs mb-3">
                          Status: <span className={`px-2 py-1 rounded ${
                            video.processingStatus === 'ready' ? 'bg-green-100 text-green-800' :
                            video.processingStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            video.processingStatus === 'uploading' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {video.processingStatus}
                          </span>
                          {video.processingStatus === 'processing' && (
                            <span className="ml-2">({video.processingProgress}%)</span>
                          )}
                        </div>
                        {/* Video status display */}
                        <div className="bg-gray-100 rounded flex items-center justify-center text-gray-500" 
                             style={{ width: 368, height: 207 }}>
                          {video.processingStatus === 'ready' ? (
                            <div className="text-center">
                              <div className="text-green-600 mb-1">✅ Ready</div>
                              <div className="text-xs">Video processed successfully</div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="text-sm">Processing...</div>
                              <div className="text-xs">Video preview will be available soon</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Button */}
          <div className="flex justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" size="lg">
                  Upload New Video
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-lg w-full">
                <DialogHeader>
                  <DialogTitle>Upload your video with doctor</DialogTitle>
                </DialogHeader>
                <div className="mt-2 text-sm text-gray-600">
                  Upload a video from your doctor's visit. We'll process it to make it searchable.
                </div>
                
                <input
                  type="file"
                  accept="video/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                
                <div className="mt-4 space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    Choose Video File
                  </Button>
                  
                  {selectedVideo && (
                    <div className="space-y-4">
                      <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                        Selected file: {selectedVideo.name} ({(selectedVideo.size / 1024 / 1024).toFixed(1)} MB)
                      </div>
                      
                      <div>
                        <Label htmlFor="video-title" className="text-sm font-medium">
                          Video Title *
                        </Label>
                        <Input
                          id="video-title"
                          type="text"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          placeholder="e.g., Dr. Smith Visit - March 2024"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="video-description" className="text-sm font-medium">
                          Description (optional)
                        </Label>
                        <Input
                          id="video-description"
                          type="text"
                          value={videoDescription}
                          onChange={(e) => setVideoDescription(e.target.value)}
                          placeholder="Brief description of the visit"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <DialogFooter className="mt-6">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button 
                    onClick={uploadVideo}
                    disabled={isUploading || !selectedVideo || !videoTitle.trim()}
                  >
                    {isUploading ? 'Uploading...' : 'Upload & Process'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

        </CardContent>
      </Card>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-out max-w-sm">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default MeetingSearch;
