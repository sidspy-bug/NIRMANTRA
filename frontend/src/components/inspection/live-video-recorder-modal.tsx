"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  CircleDot,
  CheckCircle2,
  RefreshCw,
  X,
  ShieldCheck,
  MapPin,
  Clock,
  UserCheck,
  AlertCircle,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveVideoEvidence } from "@/types";
import {
  saveVideoBlobLocally,
  computeVideoSha256,
} from "@/lib/video-storage";

interface LiveVideoRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingUid: string;
  buildingName: string;
  inspectionId: string;
  officerName: string;
  officerId: string;
  onVideoRecorded: (evidence: LiveVideoEvidence, videoBlob: Blob) => void;
}

export function LiveVideoRecorderModal({
  isOpen,
  onClose,
  buildingUid,
  buildingName,
  inspectionId,
  officerName,
  officerId,
  onVideoRecorded,
}: LiveVideoRecorderModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [computedHash, setComputedHash] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Live Telemetry
  const [liveCoords, setLiveCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    isSimulated?: boolean;
  }>({
    latitude: 28.5832,
    longitude: 77.0514,
    accuracy: 4.5,
    isSimulated: true,
  });
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);

  const MAX_RECORDING_SECONDS = 30;

  // Clock ticker
  useEffect(() => {
    if (!isOpen) return;
    const updateClock = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) +
          " " +
          now.toLocaleTimeString("en-IN", { hour12: false }) +
          " IST"
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Geolocation tracker
  useEffect(() => {
    if (!isOpen) return;

    if ("geolocation" in navigator) {
      geoWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setLiveCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
            isSimulated: false,
          });
        },
        (err) => {
          console.warn("Geolocation watch failed, using Delhi NCT baseline coordinates:", err);
          // Delhi NCT baseline (Dwarka institutional sector datum)
          setLiveCoords({
            latitude: 28.5832,
            longitude: 77.0514,
            accuracy: 4.5,
            isSimulated: true,
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    }

    return () => {
      if (geoWatchIdRef.current !== null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, [isOpen]);

  // Camera initializer
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    let isMounted = true;
    async function startCamera() {
      setCameraError(null);
      try {
        let mediaStream: MediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: true,
          });
        } catch {
          // Fallback to video only if audio permission fails
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        }

        if (!isMounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(mediaStream);
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error("Camera access failed:", err);
        setCameraError(
          err.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access in browser settings to conduct live video audits."
            : "No compatible camera hardware detected or camera is in use by another application."
        );
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const startRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordedSeconds(0);

    // Pick supported MIME type
    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    let selectedMime = "";
    for (const mime of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    try {
      const recorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const fullBlob = new Blob(recordedChunksRef.current, {
          type: selectedMime || "video/webm",
        });
        setRecordedBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setRecordedUrl(url);

        // Compute SHA-256 fingerprint
        const hash = await computeVideoSha256(fullBlob);
        setComputedHash(hash);
      };

      recorder.start(1000); // 1-second timeslices
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordedSeconds((prev) => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return MAX_RECORDING_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error("Failed to start MediaRecorder:", err);
      alert("Media recording is not supported in this browser mode.");
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleRetake = () => {
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setComputedHash("");
    setRecordedSeconds(0);
  };

  // Demo fallback simulation if hardware camera is not available
  const handleSimulateDemoSweep = async () => {
    // Generate a synthetic video representation
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d")!;
    const stream = canvas.captureStream(30);

    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const simBlob = new Blob(chunks, { type: "video/webm" });
      setRecordedBlob(simBlob);
      setRecordedUrl(URL.createObjectURL(simBlob));
      const hash = await computeVideoSha256(simBlob);
      setComputedHash(hash);
      setRecordedSeconds(18);
    };

    recorder.start();

    // Render 18 frames simulating a panoramic building sweep
    let frame = 0;
    const simInterval = setInterval(() => {
      frame++;
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(0, 0, 640, 360);

      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(50 + frame * 3, 80, 120, 200);
      ctx.fillStyle = "#6366f1";
      ctx.fillRect(200 + frame * 3, 50, 150, 230);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(`NIRMAANTRA LIVE AUDIT SWEEP • ${buildingUid}`, 20, 40);
      ctx.font = "12px monospace";
      ctx.fillText(`GPS: ${liveCoords.latitude.toFixed(4)}°N, ${liveCoords.longitude.toFixed(4)}°E`, 20, 320);
      ctx.fillText(`OFFICER: ${officerName} | TAPE: 00:${frame < 10 ? "0" + frame : frame}`, 20, 340);

      if (frame >= 18) {
        clearInterval(simInterval);
        recorder.stop();
      }
    }, 100);
  };

  const handleSaveAndAttach = async () => {
    if (!recordedBlob) return;
    setSaving(true);
    try {
      const storageKey = `video_${buildingUid}_${inspectionId}_${Date.now()}`;
      await saveVideoBlobLocally(storageKey, recordedBlob);

      const evidence: LiveVideoEvidence = {
        id: `vid-${Date.now()}`,
        buildingUid,
        inspectionId,
        recordedAt: new Date().toISOString(),
        durationSeconds: recordedSeconds || 20,
        officerId,
        officerName,
        videoUrl: recordedUrl || undefined,
        storageKey,
        telemetry: {
          latitude: liveCoords.latitude,
          longitude: liveCoords.longitude,
          accuracyMeters: liveCoords.accuracy,
          altitudeMeters: null,
        },
        tamperProofHash: computedHash,
        caption: `Continuous 360° Safety & Driveway Sweep - ${buildingName}`,
      };

      onVideoRecorded(evidence, recordedBlob);
      onClose();
    } catch (err) {
      console.error("Failed to save local video evidence:", err);
      alert("Failed to save video evidence locally. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-950 text-white rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  Live Field Video Audit
                </span>
                <span className="text-[10px] bg-red-950 text-red-300 font-mono font-bold px-1.5 py-0.2 rounded border border-red-800">
                  ANTI-MORPHING PROTOCOL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Building UID: <span className="font-mono text-amber-300 font-semibold">{buildingUid}</span> • {buildingName}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder / Player Container */}
        <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
          {recordedUrl ? (
            /* Review & Playback Mode */
            <div className="relative w-full h-full">
              <video
                ref={playbackRef}
                src={recordedUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono border border-emerald-500/40 text-emerald-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>VIDEO RECORDED • SHA-256 GENERATED</span>
              </div>
            </div>
          ) : cameraError ? (
            /* Camera Permission Error State with Demo Simulation Option */
            <div className="p-6 text-center space-y-3 max-w-md">
              <VideoOff className="w-10 h-10 mx-auto text-amber-500" />
              <h4 className="text-sm font-bold text-slate-200">Camera Device Inactive</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
              <div className="pt-2">
                <Button
                  onClick={handleSimulateDemoSweep}
                  className="bg-[#2a1b4e] hover:bg-[#3b185f] text-white text-xs font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Simulate Live 360° Safety Sweep (Demo Mode)
                </Button>
              </div>
            </div>
          ) : (
            /* Live Camera Feed & HUD Viewfinder */
            <div className="relative w-full h-full">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Crosshair Grid */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="w-full h-full border border-white/40 flex items-center justify-center">
                  <div className="w-16 h-16 border border-white/60 rounded-full" />
                </div>
              </div>

              {/* HUD: Top Header Strip */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-mono pointer-events-none">
                <div className="flex items-center space-x-2">
                  <div className="bg-black/70 backdrop-blur-xs px-2 py-1 rounded border border-white/20 text-white flex items-center space-x-1.5">
                    {isRecording ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
                        <span className="font-bold text-red-400">
                          REC 00:{recordedSeconds < 10 ? "0" + recordedSeconds : recordedSeconds} / 00:{MAX_RECORDING_SECONDS}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-slate-200">LIVE FEED ACTIVE</span>
                      </>
                    )}
                  </div>
                  <span className="bg-black/70 backdrop-blur-xs px-2 py-1 rounded border border-white/20 text-amber-300 font-bold">
                    UID: {buildingUid}
                  </span>
                </div>

                <div className="bg-black/70 backdrop-blur-xs px-2 py-1 rounded border border-white/20 text-slate-300">
                  OFFICER: {officerId}
                </div>
              </div>

              {/* HUD: Bottom Telemetry Strip */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/75 backdrop-blur-xs p-2 rounded-lg border border-white/20 text-[10px] font-mono text-slate-300 flex flex-wrap justify-between items-center gap-2 pointer-events-none">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center text-amber-400">
                    <MapPin className="w-3 h-3 mr-1" />
                    GPS: {liveCoords.latitude.toFixed(5)}°N, {liveCoords.longitude.toFixed(5)}°E
                  </span>
                  <span className="text-slate-400">Acc: ±{liveCoords.accuracy}m</span>
                  {liveCoords.isSimulated && (
                    <span className="text-[9px] bg-amber-900/60 text-amber-200 px-1 rounded">
                      Delhi Datum
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{currentTimeStr}</span>
                </div>
              </div>

              {/* Countdown Progress Bar while Recording */}
              {isRecording && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
                  <div
                    className="h-full bg-red-500 transition-all duration-1000 ease-linear"
                    style={{
                      width: `${(recordedSeconds / MAX_RECORDING_SECONDS) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Audit Details & Actions Footer */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 space-y-3">
          {recordedBlob ? (
            /* Review & Save Controls */
            <div className="space-y-3">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Sweep Duration: <strong className="text-white">{recordedSeconds} seconds</strong></span>
                  <span>Size: <strong className="text-white">{(recordedBlob.size / (1024 * 1024)).toFixed(2)} MB</strong></span>
                  <span>Protocol: <strong className="text-emerald-400">In-App Native Feed</strong></span>
                </div>
                <div className="text-slate-400 truncate">
                  SHA-256 Digest: <strong className="text-amber-300">{computedHash}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetake}
                  className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Retake Sweep
                </Button>

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={handleSaveAndAttach}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    {saving ? "Storing Locally..." : "Seal & Bind to Building UID"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Camera Live Capture Controls */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-400 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Anti-Morphing Active: Camera gallery uploads are locked. Pan across fire driveways & exits.
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {isRecording ? (
                  <Button
                    size="sm"
                    onClick={stopRecording}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold animate-pulse"
                  >
                    <CircleDot className="w-4 h-4 mr-1.5" /> Finish Recording
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={startRecording}
                    disabled={!stream}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                  >
                    <CircleDot className="w-4 h-4 mr-1.5" /> Start 30s Live Sweep
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
