import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Columns2,
  EyeOff,
  RefreshCw,
  Sparkles,
  Upload,
  UserCheck,
} from 'lucide-react';
import {
  type LightingMode,
  type MakeupLookState,
  type StudioModel,
} from '../data/makeupCatalog';
import {
  getImageFaceLandmarker,
  getVideoFaceLandmarker,
  smoothLandmarks,
  type FaceLandmarkPoint,
} from '../lib/faceMeshEngine';
import { MakeupCanvasRenderer } from '../lib/makeupRenderer';

export type MirrorSourceMode = 'camera' | 'model' | 'upload';

interface MirrorViewportProps {
  models: StudioModel[];
  look: MakeupLookState;
  lighting: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
  sourceMode: MirrorSourceMode;
  onSourceModeChange: (mode: MirrorSourceMode) => void;
  selectedModel: StudioModel;
  onSelectModel: (model: StudioModel) => void;
  onCaptureLook: (dataUrl: string, modelLabel: string) => void;
  onRunAiAnalysis: (bareImageBase64: string) => void;
  isAnalyzingAi: boolean;
}

export const MirrorViewport: React.FC<MirrorViewportProps> = ({
  models,
  look,
  lighting,
  onLightingChange,
  sourceMode,
  onSourceModeChange,
  selectedModel,
  onSelectModel,
  onCaptureLook,
  onRunAiAnalysis,
  isAnalyzingAi,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const rendererRef = useRef<MakeupCanvasRenderer | null>(null);
  const landmarksRef = useRef<FaceLandmarkPoint[] | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [holdBare, setHoldBare] = useState(false);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'All' | 'Female' | 'Male'>('All');

  const [cameraStatus, setCameraStatus] = useState<
    'idle' | 'starting' | 'active' | 'error'
  >('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [trackingState, setTrackingState] = useState<
    'loading' | 'detected' | 'no-face' | 'error'
  >('loading');

  const lookRef = useRef(look);
  lookRef.current = look;
  const lightingRef = useRef(lighting);
  lightingRef.current = lighting;
  const splitEnabledRef = useRef(splitEnabled);
  splitEnabledRef.current = splitEnabled;
  const splitRatioRef = useRef(splitRatio);
  splitRatioRef.current = splitRatio;
  const holdBareRef = useRef(holdBare);
  holdBareRef.current = holdBare;

  if (!rendererRef.current) {
    rendererRef.current = new MakeupCanvasRenderer();
  }

  const getEffectiveLook = useCallback((): MakeupLookState => {
    if (!holdBareRef.current) return lookRef.current;
    return {
      foundation: { ...lookRef.current.foundation, enabled: false },
      lipstick: { ...lookRef.current.lipstick, enabled: false },
      eyeliner: { ...lookRef.current.eyeliner, enabled: false },
      kajal: { ...lookRef.current.kajal, enabled: false },
      eyeshadow: { ...lookRef.current.eyeshadow, enabled: false },
      blush: { ...lookRef.current.blush, enabled: false },
      highlighter: { ...lookRef.current.highlighter, enabled: false },
    };
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStatus('idle');
  }, []);

  const renderStaticFrame = useCallback(() => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!img || !canvas || !renderer || !img.complete || img.naturalWidth === 0) {
      return;
    }
    renderer.render({
      targetCanvas: canvas,
      source: img,
      sourceWidth: img.naturalWidth,
      sourceHeight: img.naturalHeight,
      landmarks: landmarksRef.current,
      look: getEffectiveLook(),
      mirrorHorizontal: false,
      splitEnabled: splitEnabledRef.current && !holdBareRef.current,
      splitRatio: splitRatioRef.current,
      lighting: lightingRef.current,
    });
  }, [getEffectiveLook]);

  useEffect(() => {
    if (sourceMode !== 'camera') {
      renderStaticFrame();
    }
  }, [sourceMode, look, lighting, splitEnabled, splitRatio, holdBare, renderStaticFrame]);

  useEffect(() => {
    if (sourceMode === 'camera') return;

    stopCamera();
    const targetUrl =
      sourceMode === 'upload' && uploadedUrl ? uploadedUrl : selectedModel.imageUrl;

    let cancelled = false;
    setTrackingState('loading');
    landmarksRef.current = null;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = targetUrl;

    img.onload = async () => {
      if (cancelled) return;
      imageRef.current = img;
      renderStaticFrame();

      try {
        const landmarker = await getImageFaceLandmarker();
        if (cancelled) return;
        const result = landmarker.detect(img);
        if (cancelled) return;
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          landmarksRef.current = result.faceLandmarks[0];
          setTrackingState('detected');
        } else {
          landmarksRef.current = null;
          setTrackingState('no-face');
        }
        renderStaticFrame();
      } catch (err) {
        console.error('Face landmark detection error on image:', err);
        if (!cancelled) {
          setTrackingState('error');
        }
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        setTrackingState('error');
      }
    };

    return () => {
      cancelled = true;
    };
  }, [sourceMode, selectedModel, uploadedUrl, stopCamera, renderStaticFrame]);

  useEffect(() => {
    if (sourceMode !== 'camera') return;

    let cancelled = false;
    landmarksRef.current = null;
    setCameraStatus('starting');
    setCameraError(null);
    setTrackingState('loading');

    const startCameraLoop = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported in this browser environment.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 960 },
            height: { ideal: 1280 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();
        if (cancelled) return;

        setCameraStatus('active');

        const landmarker = await getVideoFaceLandmarker();
        if (cancelled) return;

        let lastVideoTime = -1;

        const tick = () => {
          if (cancelled) return;
          const v = videoRef.current;
          const canvas = canvasRef.current;
          const renderer = rendererRef.current;

          if (v && canvas && renderer && v.readyState >= 2 && v.videoWidth > 0) {
            if (v.currentTime !== lastVideoTime) {
              lastVideoTime = v.currentTime;
              try {
                const result = landmarker.detectForVideo(v, performance.now());
                if (result.faceLandmarks && result.faceLandmarks.length > 0) {
                  landmarksRef.current = smoothLandmarks(
                    landmarksRef.current,
                    result.faceLandmarks[0],
                    0.62
                  );
                  setTrackingState((prev) => (prev === 'detected' ? prev : 'detected'));
                } else {
                  landmarksRef.current = null;
                  setTrackingState((prev) => (prev === 'no-face' ? prev : 'no-face'));
                }
              } catch {
                // Keep rendering frame
              }
            }

            renderer.render({
              targetCanvas: canvas,
              source: v,
              sourceWidth: v.videoWidth,
              sourceHeight: v.videoHeight,
              landmarks: landmarksRef.current,
              look: getEffectiveLook(),
              mirrorHorizontal: true,
              splitEnabled: splitEnabledRef.current && !holdBareRef.current,
              splitRatio: splitRatioRef.current,
              lighting: lightingRef.current,
            });
          }

          rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Unable to access camera. Please check browser permissions.';
        setCameraError(msg);
        setCameraStatus('error');
        setTrackingState('error');
      }
    };

    startCameraLoop();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [sourceMode, stopCamera, getEffectiveLook]);

  const updateSplitFromClientX = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = (clientX - rect.left) / rect.width;
    setSplitRatio(Math.max(0.08, Math.min(0.92, ratio)));
  };

  const handlePointerDownSplit = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!splitEnabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingSplit(true);
    updateSplitFromClientX(e.clientX);
  };

  const handlePointerMoveSplit = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSplit || !splitEnabled) return;
    updateSplitFromClientX(e.clientX);
  };

  const handlePointerUpSplit = () => {
    setIsDraggingSplit(false);
  };

  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    setUploadedUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextUrl;
    });
    onSourceModeChange('upload');
    e.target.value = '';
  };

  const handlePhotoStudioClick = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    setShutterFlash(true);
    window.setTimeout(() => setShutterFlash(false), 180);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
    const modelLabel =
      sourceMode === 'camera'
        ? 'Live Camera'
        : sourceMode === 'upload'
          ? 'Custom Model'
          : `${selectedModel.name} (${selectedModel.faceShape})`;
    onCaptureLook(dataUrl, modelLabel);
  };

  const handleTriggerAiAnalysis = () => {
    const offscreen = document.createElement('canvas');
    if (sourceMode === 'camera' && videoRef.current && videoRef.current.videoWidth > 0) {
      const v = videoRef.current;
      offscreen.width = v.videoWidth;
      offscreen.height = v.videoHeight;
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        ctx.translate(offscreen.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(v, 0, 0);
      }
    } else if (imageRef.current && imageRef.current.naturalWidth > 0) {
      const img = imageRef.current;
      offscreen.width = img.naturalWidth;
      offscreen.height = img.naturalHeight;
      const ctx = offscreen.getContext('2d');
      ctx?.drawImage(img, 0, 0);
    } else if (canvasRef.current && canvasRef.current.width > 0) {
      onRunAiAnalysis(canvasRef.current.toDataURL('image/jpeg', 0.88));
      return;
    } else {
      return;
    }

    onRunAiAnalysis(offscreen.toDataURL('image/jpeg', 0.88));
  };

  const filteredModels = models.filter((m) =>
    genderFilter === 'All' ? true : m.gender === genderFilter
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Top Mirror Toolbar: Source Switcher + Lighting */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex items-center p-1 bg-[#EFEAE4] rounded-lg border border-[#191615]/8"
          role="tablist"
          aria-label="Mirror input source"
        >
          <button
            type="button"
            onClick={() => onSourceModeChange('model')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              sourceMode === 'model'
                ? 'bg-[#191615] text-[#FAF8F6] shadow-sm'
                : 'text-[#5C534E] hover:text-[#191615]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Model Collection
          </button>
          <button
            type="button"
            onClick={() => onSourceModeChange('camera')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              sourceMode === 'camera'
                ? 'bg-[#191615] text-[#FAF8F6] shadow-sm'
                : 'text-[#5C534E] hover:text-[#191615]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Live Camera
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              sourceMode === 'upload'
                ? 'bg-[#191615] text-[#FAF8F6] shadow-sm'
                : 'text-[#5C534E] hover:text-[#191615]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Custom Model
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadChange}
            className="hidden"
          />
        </div>

        {/* Studio Lighting Selector */}
        <div className="inline-flex items-center p-1 bg-[#EFEAE4] rounded-lg border border-[#191615]/8">
          {(['Daylight', 'Golden Hour', 'Candlelight'] as LightingMode[]).map(
            (mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onLightingChange(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  lighting === mode
                    ? 'bg-white text-[#191615] shadow-sm'
                    : 'text-[#5C534E] hover:text-[#191615]'
                }`}
              >
                {mode}
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Mirror Viewport Frame */}
      <div
        className="relative w-full aspect-[3/4] max-h-[680px] bg-[#ECE6DF] rounded-xl overflow-hidden border border-[#191615]/10 select-none"
        onPointerDown={handlePointerDownSplit}
        onPointerMove={handlePointerMoveSplit}
        onPointerUp={handlePointerUpSplit}
        onPointerCancel={handlePointerUpSplit}
        style={{ touchAction: splitEnabled ? 'none' : 'auto' }}
      >
        <video ref={videoRef} playsInline muted className="hidden" />

        <canvas ref={canvasRef} className="w-full h-full object-cover block" />

        {/* Photo Studio Shutter Flash */}
        {shutterFlash && (
          <div className="absolute inset-0 bg-white/85 pointer-events-none transition-opacity duration-150" />
        )}

        {/* Active Bare Hold Badge */}
        {holdBare && (
          <div className="absolute top-4 left-4 bg-[#191615]/80 text-[#FAF8F6] text-[11px] font-medium px-3 py-1.5 rounded backdrop-blur-sm pointer-events-none">
            Viewing Bare Complexion
          </div>
        )}

        {/* Split Before / After Draggable Divider */}
        {splitEnabled && !holdBare && cameraStatus !== 'error' && (
          <>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.35)] pointer-events-none"
              style={{ left: `${splitRatio * 100}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-[#191615] shadow-md flex items-center justify-center border border-[#191615]/10 cursor-ew-resize">
                <Columns2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="absolute top-4 left-4 bg-[#191615]/75 text-[#FAF8F6] text-[11px] font-medium px-2.5 py-1 rounded backdrop-blur-sm pointer-events-none">
              Before
            </div>
            <div className="absolute top-4 right-4 bg-[#191615]/75 text-[#FAF8F6] text-[11px] font-medium px-2.5 py-1 rounded backdrop-blur-sm pointer-events-none">
              After
            </div>
          </>
        )}

        {/* Camera Error Fallback */}
        {sourceMode === 'camera' && cameraStatus === 'error' && (
          <div className="absolute inset-0 bg-[#F3EFEA] flex flex-col items-center justify-center p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E5DDD4] flex items-center justify-center mb-4 text-[#191615]">
              <CameraOff className="w-5 h-5" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-[#191615] mb-2">
              Camera Access Unavailable
            </h3>
            <p className="text-sm text-[#5C534E] max-w-sm mb-6 leading-relaxed">
              {cameraError ||
                'Allow camera permission in your browser to test makeup live, or choose a model from our studio collection.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onSourceModeChange('model')}
                className="px-4 py-2.5 bg-[#191615] text-[#FAF8F6] text-xs font-medium rounded-lg hover:bg-[#2F2A28] transition-colors cursor-pointer"
              >
                Browse Model Collection
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-white text-[#191615] border border-[#191615]/15 text-xs font-medium rounded-lg hover:bg-[#FAF8F6] transition-colors cursor-pointer"
              >
                Upload Custom Model
              </button>
            </div>
          </div>
        )}

        {/* Subtle Tracking Guidance */}
        {cameraStatus !== 'error' && trackingState !== 'detected' && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#191615]/80 text-[#FAF8F6] text-xs px-3.5 py-2 rounded-lg backdrop-blur-sm whitespace-nowrap">
            {trackingState === 'loading'
              ? sourceMode === 'camera' && cameraStatus === 'starting'
                ? 'Starting live camera…'
                : 'Calibrating facial contours…'
              : trackingState === 'no-face'
                ? 'Center your face clearly in the frame'
                : 'Facial tracking unavailable for this image'}
          </div>
        )}

        {/* Bottom Mirror Photo Studio & Compare Bar */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#191615]/70 via-[#191615]/28 to-transparent flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSplitEnabled((s) => !s)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                splitEnabled
                  ? 'bg-[#FAF8F6] text-[#191615]'
                  : 'bg-[#191615]/70 text-[#FAF8F6] hover:bg-[#191615]/90 backdrop-blur-sm'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5" />
              {splitEnabled ? 'Exit Split' : 'Compare Split'}
            </button>

            <button
              type="button"
              onPointerDown={() => setHoldBare(true)}
              onPointerUp={() => setHoldBare(false)}
              onPointerLeave={() => setHoldBare(false)}
              onPointerCancel={() => setHoldBare(false)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                holdBare
                  ? 'bg-[#FAF8F6] text-[#191615]'
                  : 'bg-[#191615]/70 text-[#FAF8F6] hover:bg-[#191615]/90 backdrop-blur-sm'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              Hold Before
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePhotoStudioClick}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FAF8F6] text-[#191615] hover:bg-[#EFEAE4] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              Click Photo
            </button>
            <button
              type="button"
              onClick={handleTriggerAiAnalysis}
              disabled={
                isAnalyzingAi ||
                (sourceMode === 'camera' && cameraStatus !== 'active')
              }
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#8B2635] text-[#FAF8F6] hover:bg-[#6E1D2A] disabled:opacity-50 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isAnalyzingAi ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {isAnalyzingAi ? 'Matching…' : 'AI Shade Match'}
            </button>
          </div>
        </div>
      </div>

      {/* Model Collection Roster (Female & Male Models with Skin Tone & Face Shape) */}
      {sourceMode === 'model' && (
        <div className="flex flex-col gap-3 pt-1">
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs font-medium text-[#5C534E]">
              Model Collection · {filteredModels.length} profiles
            </div>
            <div className="inline-flex items-center p-0.5 bg-[#EFEAE4] rounded-md border border-[#191615]/8">
              {(['All', 'Female', 'Male'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderFilter(g)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                    genderFilter === g
                      ? 'bg-white text-[#191615] shadow-sm'
                      : 'text-[#6E6560] hover:text-[#191615]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {filteredModels.map((model) => {
              const isSelected = selectedModel.id === model.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => onSelectModel(model)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#191615] shadow-sm'
                      : 'bg-[#F3EFEA] border-[#191615]/8 hover:border-[#191615]/25'
                  }`}
                >
                  <img
                    src={model.imageUrl}
                    alt={`${model.name} — ${model.complexion}, ${model.faceShape} face`}
                    referrerPolicy="no-referrer"
                    className="w-10 h-13 object-cover rounded bg-[#E4DDD5] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#191615] truncate">
                      {model.name}
                    </div>
                    <div className="text-[11px] text-[#6E6560] truncate">
                      {model.complexion}
                    </div>
                    <div className="text-[10px] text-[#8E837D] truncate">
                      {model.faceShape} · {model.gender}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
