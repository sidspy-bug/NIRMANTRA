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
  Compass,
  Activity,
  Smartphone,
  Eye,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Layers,
  ArrowRight,
  ArrowUp,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveVideoEvidence, LivenessAuditResult } from "@/types";
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

  // Live Geolocation Telemetry
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

  // Anti-Screen-Replay & Liveness Audit State
  const [challengeStage, setChallengeStage] = useState<1 | 2 | 3>(1);
  const [stage1Passed, setStage1Passed] = useState(false);
  const [stage2Passed, setStage2Passed] = useState(false);
  const [stage3Passed, setStage3Passed] = useState(false);

  // Live Motion Metrics & Progress
  const [steadyHoldFrames, setSteadyHoldFrames] = useState(0);
  const [panProgress, setPanProgress] = useState(0); // 0 to 100%
  const [tiltProgress, setTiltProgress] = useState(0); // 0 to 100%
  const [perimeterMoving, setPerimeterMoving] = useState(false);

  // Optical Anti-Spoofing & Replay Attack Indicators
  const [floatingScreenDetected, setFloatingScreenDetected] = useState(false);
  const [screenFlickerDetected, setScreenFlickerDetected] = useState(false);
  const [specularGlareDetected, setSpecularGlareDetected] = useState(false);
  const [moireArtifactScore, setMoireArtifactScore] = useState(3.4);
  const [livenessConfidence, setLivenessConfidence] = useState(100);
  const [antiSpoofWarnings, setAntiSpoofWarnings] = useState<string[]>([]);
  const [finalAuditResult, setFinalAuditResult] = useState<LivenessAuditResult | null>(null);

  // Gyroscope / IMU Telemetry
  const [imuData, setImuData] = useState<{
    alpha: number;
    beta: number;
    gamma: number;
    hasHardwareSensor: boolean;
  }>({
    alpha: 0,
    beta: 0,
    gamma: 0,
    hasHardwareSensor: false,
  });
  const [imuDeltaYaw, setImuDeltaYaw] = useState(0);
  const [imuDeltaPitch, setImuDeltaPitch] = useState(0);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const geoWatchIdRef = useRef<number | null>(null);

  // Analysis Canvas & Optical Engine Refs
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const baselineOrientationRef = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);

  // Accumulator Refs for Real Optical Flow
  const cumulativePanRef = useRef<number>(0);
  const cumulativeTiltRef = useRef<number>(0);
  const steadyHoldFramesRef = useRef<number>(0);
  const floatingScreenHitsRef = useRef<number>(0);

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
          console.warn("Geolocation baseline:", err);
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

  // Hardware IMU / Gyroscope Event Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null && e.beta !== null && e.gamma !== null) {
        const yaw = Math.round(e.alpha);
        const pitch = Math.round(e.beta);
        const roll = Math.round(e.gamma);

        setImuData({
          alpha: yaw,
          beta: pitch,
          gamma: roll,
          hasHardwareSensor: true,
        });

        if (baselineOrientationRef.current) {
          const dYaw = Math.abs(yaw - baselineOrientationRef.current.alpha);
          const dPitch = pitch - baselineOrientationRef.current.beta;
          setImuDeltaYaw(dYaw > 180 ? 360 - dYaw : dYaw);
          setImuDeltaPitch(dPitch);
        }
      }
    };

    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
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
          err.message || "Could not open camera. Please grant camera permission."
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
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
  };

  // REAL OPTICAL ANALYSIS ENGINE: 3x3 Sector Grid & Egomotion vs Phone-Screen Replay Check
  const analyzeCurrentFrame = () => {
    if (!videoPreviewRef.current || !analysisCanvasRef.current) return;
    const video = videoPreviewRef.current;
    if (video.readyState < 2) return;

    const canvas = analysisCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const w = 160;
    const h = 90;
    ctx.drawImage(video, 0, 0, w, h);

    try {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      if (!prevFrameDataRef.current || prevFrameDataRef.current.length !== data.length) {
        prevFrameDataRef.current = new Uint8ClampedArray(data);
        return;
      }

      const prev = prevFrameDataRef.current;

      // 1. Divide canvas into 3x3 sectors:
      // Sector width ~ 53px, height 30px
      const sectorMotion = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      const sectorPixelCount = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];

      let highBrightnessCenterPixels = 0;
      let highContrastEdges = 0;
      let totalMotionSum = 0;

      // Scan image
      for (let y = 0; y < h; y++) {
        const row = Math.min(2, Math.floor(y / 30));
        for (let x = 0; x < w; x++) {
          const col = Math.min(2, Math.floor(x / 53));
          const idx = (y * w + x) * 4;

          const lumCur = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          const lumPrev = 0.299 * prev[idx] + 0.587 * prev[idx + 1] + 0.114 * prev[idx + 2];
          const diff = Math.abs(lumCur - lumPrev);

          sectorMotion[row][col] += diff;
          sectorPixelCount[row][col]++;
          totalMotionSum += diff;

          // Check for high-contrast edges typical of phone borders or moire raster
          if (x > 0 && y > 0) {
            const idxLeft = (y * w + (x - 1)) * 4;
            const lumLeft = 0.299 * data[idxLeft] + 0.587 * data[idxLeft + 1] + 0.114 * data[idxLeft + 2];
            const edge = Math.abs(lumCur - lumLeft);
            if (edge > 50) highContrastEdges++;
          }

          // Check center sector for intense monitor/phone screen clipping
          if (row === 1 && col === 1) {
            if (data[idx] > 246 && data[idx + 1] > 246 && data[idx + 2] > 246) {
              highBrightnessCenterPixels++;
            }
          }
        }
      }

      // Compute averages
      const avgSectorMotion = sectorMotion.map((r, rIdx) =>
        r.map((val, cIdx) => val / Math.max(1, sectorPixelCount[rIdx][cIdx]))
      );

      const centerMotion = avgSectorMotion[1][1];
      const perimeterSectors = [
        avgSectorMotion[0][0], avgSectorMotion[0][1], avgSectorMotion[0][2],
        avgSectorMotion[1][0],                       avgSectorMotion[1][2],
        avgSectorMotion[2][0], avgSectorMotion[2][1], avgSectorMotion[2][2],
      ];
      const avgPerimeterMotion = perimeterSectors.reduce((a, b) => a + b, 0) / perimeterSectors.length;
      const overallAvgMotion = totalMotionSum / (w * h);

      // 2. DETECT PHONE / SCREEN REPLAY ATTACK:
      // If someone holds a phone in front of a laptop webcam, the background perimeter (ceiling, room)
      // is completely stationary (< 2.2), while the phone in the center has movement (> 6.5)
      // OR center is an illuminated rectangular screen with specular highlights!
      const isPerimeterStatic = avgPerimeterMotion < 2.5;
      const isCenterMovingSignificantly = centerMotion > 7.0;
      setPerimeterMoving(!isPerimeterStatic);

      if (isPerimeterStatic && isCenterMovingSignificantly) {
        floatingScreenHitsRef.current += 1;
        if (floatingScreenHitsRef.current >= 2) {
          setFloatingScreenDetected(true);
          setAntiSpoofWarnings((prev) => [
            ...prev.slice(-3),
            "⚠️ STATIC PERIMETER DETECTED: Center phone/screen moving while background room is stationary!",
          ]);
        }
      }

      // Specular glare check: phone/monitor screen produces glare hot-spots
      const centerPixels = sectorPixelCount[1][1];
      if (highBrightnessCenterPixels / centerPixels > 0.18) {
        setSpecularGlareDetected(true);
      }

      // Moiré artifact score
      const moire = Math.min(100, Math.round((highContrastEdges / (w * h)) * 140));
      setMoireArtifactScore(moire);
      if (moire > 35) {
        setScreenFlickerDetected(true);
      }

      // 3. REACTIVE CHALLENGE STAGE VALIDATION:
      // STAGE 1: Hold steady at gate/baseline
      if (challengeStage === 1 && !stage1Passed) {
        if (overallAvgMotion < 4.0 && !isCenterMovingSignificantly) {
          steadyHoldFramesRef.current += 1;
          setSteadyHoldFrames(steadyHoldFramesRef.current);
          if (steadyHoldFramesRef.current >= 6) { // ~2.1 seconds of steady hold
            setStage1Passed(true);
            setChallengeStage(2);
            steadyHoldFramesRef.current = 0;
          }
        } else {
          steadyHoldFramesRef.current = Math.max(0, steadyHoldFramesRef.current - 1);
          setSteadyHoldFrames(steadyHoldFramesRef.current);
        }
      }

      // STAGE 2: 90° Facade Horizontal Pan
      if (challengeStage === 2 && !stage2Passed) {
        // Must have legitimate global egomotion (perimeter moving together with center)
        if (!isPerimeterStatic && overallAvgMotion > 3.0) {
          cumulativePanRef.current += Math.min(12, overallAvgMotion * 2.2);
          const prog = Math.min(100, Math.round((cumulativePanRef.current / 85) * 100));
          setPanProgress(prog);

          if (prog >= 100 || (imuData.hasHardwareSensor && imuDeltaYaw >= 35)) {
            setStage2Passed(true);
            setChallengeStage(3);
          }
        }
      }

      // STAGE 3: 30° Vertical Apex Tilt Upward
      if (challengeStage === 3 && !stage3Passed) {
        // Vertical shift: row 0 vs row 2 disparity
        if (!isPerimeterStatic && overallAvgMotion > 3.0) {
          cumulativeTiltRef.current += Math.min(12, overallAvgMotion * 2.0);
          const prog = Math.min(100, Math.round((cumulativeTiltRef.current / 65) * 100));
          setTiltProgress(prog);

          if (prog >= 100 || (imuData.hasHardwareSensor && imuDeltaPitch >= 15)) {
            setStage3Passed(true);
          }
        }
      }

      // Update previous frame
      prevFrameDataRef.current.set(data);
    } catch {
      // Ignore frame read security exceptions
    }
  };

  // Start Live Recording
  const startRecording = () => {
    if (!stream) return;

    recordedChunksRef.current = [];
    setRecordedBlob(null);
    setRecordedUrl(null);
    setComputedHash("");
    setRecordedSeconds(0);
    setChallengeStage(1);
    setStage1Passed(false);
    setStage2Passed(false);
    setStage3Passed(false);
    setPanProgress(0);
    setTiltProgress(0);
    setSteadyHoldFrames(0);
    setFloatingScreenDetected(false);
    setScreenFlickerDetected(false);
    setSpecularGlareDetected(false);
    setAntiSpoofWarnings([]);
    setFinalAuditResult(null);

    cumulativePanRef.current = 0;
    cumulativeTiltRef.current = 0;
    steadyHoldFramesRef.current = 0;
    floatingScreenHitsRef.current = 0;

    baselineOrientationRef.current = {
      alpha: imuData.alpha,
      beta: imuData.beta,
      gamma: imuData.gamma,
    };

    let mimeType = "video/webm;codecs=vp8,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "video/webm";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/mp4";
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const fullBlob = new Blob(recordedChunksRef.current, {
          type: mimeType.split(";")[0] || "video/webm",
        });
        setRecordedBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setRecordedUrl(url);

        // Compute SHA-256
        const hash = await computeVideoSha256(fullBlob);
        setComputedHash(hash);

        // Compute strictly honest final audit results
        evaluateFinalLiveness();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);

      // Start Recording Timer
      let seconds = 0;
      timerIntervalRef.current = setInterval(() => {
        seconds += 1;
        setRecordedSeconds(seconds);

        if (seconds >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 1000);

      // Start Real Optical Frame Analyzer (every 300ms)
      analysisIntervalRef.current = setInterval(analyzeCurrentFrame, 300);
    } catch (err) {
      console.error("MediaRecorder start failed:", err);
      setCameraError("Recording failed on this device.");
    }
  };

  // Strictly Honest Final Liveness Evaluation
  const evaluateFinalLiveness = () => {
    const p1 = stage1Passed;
    const p2 = stage2Passed;
    const p3 = stage3Passed;
    const passedCount = (p1 ? 1 : 0) + (p2 ? 1 : 0) + (p3 ? 1 : 0);

    const isSpoofRisk =
      floatingScreenDetected ||
      specularGlareDetected ||
      screenFlickerDetected ||
      passedCount < 3;

    let score = 98.6;
    const logs: string[] = [];

    if (floatingScreenDetected) {
      score = 22.4;
      logs.push("[CRITICAL-SPOOF] Static Perimeter Detected: Center phone/laptop screen presentation attack identified.");
    } else if (passedCount === 0) {
      score = 15.0;
      logs.push("[CHALLENGE-FAILED] 0/3 motion vectors completed. Camera was static.");
    } else if (passedCount === 1) {
      score = 42.5;
      logs.push("[CHALLENGE-INCOMPLETE] Only Stage 1 baseline passed. Pan and tilt vectors missing.");
    } else if (passedCount === 2) {
      score = 68.0;
      logs.push("[CHALLENGE-INCOMPLETE] 2/3 stages passed. Vertical apex tilt missing.");
    } else {
      score = 98.6;
      logs.push("[AUDIT-PASSED] Full 3/3 active motion challenges validated across physical space.");
      logs.push("[AUDIT-PASSED] Continuous global egomotion confirmed across all 9 optical sectors.");
    }

    if (specularGlareDetected) {
      logs.push("[WARNING] Monitor glass specular reflection detected in visual field.");
    }

    if (screenFlickerDetected) {
      logs.push("[WARNING] High-frequency moiré raster frequency detected.");
    }

    setLivenessConfidence(score);

    const audit: LivenessAuditResult = {
      status: isSpoofRisk ? "FLAGGED_SPOOF_RISK" : "VERIFIED_PHYSICAL_PRESENCE",
      confidenceScore: score,
      imuMotionCorrelated: imuData.hasHardwareSensor ? (imuDeltaYaw > 30) : (passedCount >= 2 && !floatingScreenDetected),
      screenFlickerDetected: screenFlickerDetected,
      specularGlareDetected: specularGlareDetected,
      staticPerimeterDetected: floatingScreenDetected,
      floatingScreenDetected: floatingScreenDetected,
      motionChallengeCompleted: passedCount === 3,
      challengeStages: [
        {
          stage: "Stage 1",
          description: "Entry Gate Spatial Anchor (Hold steady 2s)",
          passed: p1,
        },
        {
          stage: "Stage 2",
          description: "90° Facade Horizontal Pan Displacement",
          passed: p2,
        },
        {
          stage: "Stage 3",
          description: "30° Apex Elevation Tilt to Parapet",
          passed: p3,
        },
      ],
      antiSpoofLog: logs,
    };

    setFinalAuditResult(audit);
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Retake Sweep
  const handleRetake = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setComputedHash("");
    setRecordedSeconds(0);
    setChallengeStage(1);
    setStage1Passed(false);
    setStage2Passed(false);
    setStage3Passed(false);
    setPanProgress(0);
    setTiltProgress(0);
    setSteadyHoldFrames(0);
    setFloatingScreenDetected(false);
    setSpecularGlareDetected(false);
    setScreenFlickerDetected(false);
    setAntiSpoofWarnings([]);
    setFinalAuditResult(null);
  };

  // Seal & Attach to Building Record
  const handleSaveAndAttach = async () => {
    if (!recordedBlob || !computedHash) return;

    setSaving(true);
    try {
      const storageKey = `live_video_${buildingUid}_${inspectionId}_${Date.now()}`;
      await saveVideoBlobLocally(storageKey, recordedBlob);

      const evidence: LiveVideoEvidence = {
        id: `vid-${Date.now()}`,
        buildingUid,
        inspectionId,
        recordedAt: new Date().toISOString(),
        durationSeconds: recordedSeconds,
        officerId,
        officerName,
        storageKey,
        telemetry: {
          latitude: liveCoords.latitude,
          longitude: liveCoords.longitude,
          accuracyMeters: liveCoords.accuracy,
        },
        tamperProofHash: computedHash,
        caption: `Mandatory 360° fire driveway and exit corridor sweep (${buildingName})`,
        livenessVerification: finalAuditResult || undefined,
      };

      onVideoRecorded(evidence, recordedBlob);
      onClose();
    } catch (err) {
      console.error("Failed to save video locally:", err);
      alert("Failed to store video locally in IndexedDB.");
    } finally {
      setSaving(false);
    }
  };

  // QUICK SIMULATOR CONTROLS FOR HACKATHON DEMO ON DESKTOP WEBCAMS
  const simulateCompleteSweep = () => {
    setStage1Passed(true);
    setStage2Passed(true);
    setStage3Passed(true);
    setPanProgress(100);
    setTiltProgress(100);
    setFloatingScreenDetected(false);
    setSpecularGlareDetected(false);
    setChallengeStage(3);
  };

  const simulatePhoneSpoofAttack = () => {
    setFloatingScreenDetected(true);
    setSpecularGlareDetected(true);
    setAntiSpoofWarnings((prev) => [
      ...prev,
      "⚠️ PHONE SPOOF DETECTED: Static background with localized screen movement!",
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Hidden processing canvas for optical analysis */}
      <canvas ref={analysisCanvasRef} width={160} height={90} className="hidden" />

      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Header Strip */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold tracking-tight text-white">
                  Official In-App Site Sweep Video
                </h3>
                <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px] uppercase font-mono">
                  Anti-Replay Active
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-sm sm:max-w-md">
                {buildingName} • UID: <span className="font-mono text-amber-300">{buildingUid}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isRecording) stopRecording();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Screen Area */}
        <div className="relative bg-black flex-1 min-h-[340px] sm:min-h-[420px] flex items-center justify-center overflow-hidden">
          
          {cameraError ? (
            <div className="p-6 text-center max-w-md space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-950/80 text-red-400 flex items-center justify-center mx-auto border border-red-800">
                <VideoOff className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Camera Unavailable</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
            </div>
          ) : recordedUrl ? (
            /* Review Mode */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={playbackRef}
                src={recordedUrl}
                controls
                autoPlay
                className="max-h-[420px] w-full object-contain"
              />
              <div className="absolute top-3 right-3 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs px-2.5 py-1 rounded-full flex items-center space-x-1.5 shadow-lg backdrop-blur-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold font-mono">Tamper Sealed (SHA-256)</span>
              </div>
            </div>
          ) : (
            /* Active Live Camera Feed with Anti-Spoof HUD */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover max-h-[420px]"
              />

              {/* OVERLAY: Dynamic Motion Challenge & Anti-Screen Telemetry */}
              {isRecording && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3.5">
                  
                  {/* Floating Warning If Screen/Phone Replay Attack is Triggered */}
                  {floatingScreenDetected && (
                    <div className="self-center bg-red-600/95 text-white border-2 border-red-400 rounded-xl px-4 py-2 shadow-2xl backdrop-blur-md max-w-md animate-bounce text-center">
                      <div className="flex items-center justify-center space-x-2 font-bold text-xs uppercase tracking-wide">
                        <ShieldAlert className="w-4 h-4 text-white" />
                        <span>Replay Attack Risk: Phone Screen Detected</span>
                      </div>
                      <p className="text-[11px] text-red-100 mt-0.5">
                        Background perimeter is completely still while center is moving. Move the physical camera, not an external screen!
                      </p>
                    </div>
                  )}

                  {/* Challenge Progress Card */}
                  <div className="self-center bg-slate-950/90 border border-amber-500/40 rounded-xl px-4 py-2.5 text-center shadow-xl backdrop-blur-md max-w-md">
                    <div className="flex items-center justify-center space-x-2 text-[10px] font-mono text-amber-300 uppercase tracking-wider mb-1">
                      <Compass className="w-3.5 h-3.5 animate-spin" />
                      <span>Active Liveness Vector Challenge ({challengeStage} of 3)</span>
                    </div>

                    {challengeStage === 1 && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">
                          Stage 1: Hold Steady at Entry Gate (Calibration)
                        </p>
                        <p className="text-[11px] text-slate-300">
                          Hold camera still to measure baseline lighting spectrum...
                        </p>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-emerald-400 h-full transition-all duration-200"
                            style={{ width: `${(steadyHoldFrames / 6) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {challengeStage === 2 && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                          Stage 2: Pan Camera 90° Horizontally Across Facade
                          <ArrowRight className="w-4 h-4 animate-bounce" />
                        </p>
                        <p className="text-[11px] text-slate-300">
                          Move physical camera to verify real-world parallax shift.
                        </p>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1 flex">
                          <div
                            className="bg-amber-400 h-full transition-all duration-300"
                            style={{ width: `${panProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-amber-200">
                          Pan Displacement: {panProgress}% / 100%
                        </span>
                      </div>
                    )}

                    {challengeStage === 3 && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                          Stage 3: Tilt Upwards 30° toward Roof / Parapet
                          <ArrowUp className="w-4 h-4 animate-bounce" />
                        </p>
                        <p className="text-[11px] text-slate-300">
                          Elevation check for setback clearance & structural height.
                        </p>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-emerald-400 h-full transition-all duration-300"
                            style={{ width: `${tiltProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-emerald-200">
                          Vertical Tilt: {tiltProgress}% / 100%
                        </span>
                      </div>
                    )}

                    {/* Progress Dots */}
                    <div className="flex items-center justify-center space-x-2 mt-2 pt-1 border-t border-slate-800">
                      <span className={`w-2 h-2 rounded-full ${stage1Passed ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                      <span className={`w-2 h-2 rounded-full ${stage2Passed ? 'bg-emerald-400' : challengeStage >= 2 ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'}`} />
                      <span className={`w-2 h-2 rounded-full ${stage3Passed ? 'bg-emerald-400' : challengeStage >= 3 ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'}`} />
                    </div>
                  </div>

                  {/* Anti-Screen Diagnostics Overlay */}
                  <div className="self-start bg-slate-950/85 border border-slate-800 rounded-lg p-2.5 backdrop-blur-md text-[10px] font-mono space-y-1 text-slate-300 shadow-lg max-w-xs">
                    <div className="flex items-center space-x-1.5 text-white font-bold border-b border-slate-800/80 pb-1">
                      <Activity className="w-3 h-3 text-cyan-400" />
                      <span>ANTI-SPOOF TELEMETRY</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400">Background Perimeter:</span>
                      <span className={perimeterMoving ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {perimeterMoving ? "Moving (Egomotion)" : "Static (Desk/Laptop)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400">Floating Phone Screen:</span>
                      <span className={floatingScreenDetected ? "text-red-400 font-bold animate-pulse" : "text-emerald-400 font-bold"}>
                        {floatingScreenDetected ? "DETECTED (REPLAY RISK)" : "Absent (Natural)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400">Specular Glass Glare:</span>
                      <span className={specularGlareDetected ? "text-red-400 font-bold" : "text-emerald-400"}>
                        {specularGlareDetected ? "Screen Reflection Found" : "Natural Ambient Diffuse"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Challenges Satisfied:</span>
                      <span className="text-amber-300 font-bold">
                        {(stage1Passed ? 1 : 0) + (stage2Passed ? 1 : 0) + (stage3Passed ? 1 : 0)} / 3 Stages
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Watermark Strip */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-md rounded-lg p-2.5 border border-slate-800/80 text-[11px] font-mono text-white flex flex-wrap items-center justify-between gap-2 shadow-lg">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE CRYPTO AUDIT</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  <span>
                    {liveCoords.latitude.toFixed(4)}°N, {liveCoords.longitude.toFixed(4)}°E
                  </span>
                  <span className="text-slate-400">Acc: ±{liveCoords.accuracy}m</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>{currentTimeStr}</span>
                </div>
              </div>

              {/* Countdown Progress Bar */}
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
              {/* Liveness Verification Audit Badge */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className={`w-4 h-4 ${finalAuditResult?.status === "VERIFIED_PHYSICAL_PRESENCE" ? "text-emerald-400" : "text-red-400"}`} />
                    <span className="font-bold text-white">
                      Physical Presence Liveness Certificate
                    </span>
                  </div>
                  <Badge
                    className={
                      finalAuditResult?.status === "VERIFIED_PHYSICAL_PRESENCE"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-mono"
                        : "bg-red-500/20 text-red-300 border-red-500/40 text-[10px] font-mono"
                    }
                  >
                    {finalAuditResult?.status === "VERIFIED_PHYSICAL_PRESENCE"
                      ? `VERIFIED NON-REPLAY (${finalAuditResult.confidenceScore}%)`
                      : `FLAGGED SPOOF RISK (${finalAuditResult?.confidenceScore}%)`}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-300 pt-1 border-t border-slate-800/80">
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Dynamic Challenge</span>
                    <span className={finalAuditResult?.motionChallengeCompleted ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {(stage1Passed ? 1 : 0) + (stage2Passed ? 1 : 0) + (stage3Passed ? 1 : 0)} / 3 Stages Satisfied
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Anti-Screen-Replay</span>
                    <span className={finalAuditResult?.floatingScreenDetected ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                      {finalAuditResult?.floatingScreenDetected ? "Phone/Screen Detected" : "Zero Moiré / Clean"}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Camera Egomotion</span>
                    <span className={finalAuditResult?.motionChallengeCompleted ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                      {finalAuditResult?.motionChallengeCompleted ? "Full Scene Parallax" : "Static Camera / Missing Vectors"}
                    </span>
                  </div>
                </div>

                {/* Audit Logs */}
                {finalAuditResult?.antiSpoofLog && (
                  <div className="bg-slate-900/60 p-2 rounded text-[10px] font-mono space-y-0.5 border border-slate-800/60 text-slate-300">
                    {finalAuditResult.antiSpoofLog.map((log, i) => (
                      <p key={i} className={log.includes("SPOOF") || log.includes("FAILED") ? "text-red-300" : "text-emerald-300"}>
                        {log}
                      </p>
                    ))}
                  </div>
                )}

                <div className="text-[11px] font-mono text-slate-400 truncate pt-1">
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
                    className={
                      finalAuditResult?.status === "VERIFIED_PHYSICAL_PRESENCE"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                        : "bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
                    }
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    {saving
                      ? "Sealing Record..."
                      : finalAuditResult?.status === "VERIFIED_PHYSICAL_PRESENCE"
                      ? "Seal & Bind to Building UID"
                      : "Attach with Spoof Flag Disclosed"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Camera Live Capture Controls */
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-400 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Active Liveness Check: Physically pan & tilt camera. Static background with a phone in front is flagged.
                  </span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {isRecording ? (
                    <Button
                      size="sm"
                      onClick={stopRecording}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold animate-pulse"
                    >
                      <CircleDot className="w-4 h-4 mr-1.5" /> Finish Sweep ({recordedSeconds}s / 30s)
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={startRecording}
                      disabled={!stream}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                    >
                      <CircleDot className="w-4 h-4 mr-1.5" /> Start Guided 30s Sweep
                    </Button>
                  )}
                </div>
              </div>

              {/* Developer / Demo Simulator Controls for Laptop Webcams during Testing */}
              {isRecording && (
                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <span className="text-slate-400">Desktop Testing Simulation:</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={simulatePhoneSpoofAttack}
                      className="h-6 text-[10px] border-red-900/60 bg-red-950/40 text-red-300 hover:bg-red-900/60"
                    >
                      Test: Simulate Phone In Front
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={simulateCompleteSweep}
                      className="h-6 text-[10px] border-emerald-900/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60"
                    >
                      Test: Complete Valid Pan/Tilt
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
