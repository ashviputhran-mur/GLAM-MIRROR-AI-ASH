import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import {
  DEFAULT_LOOK_STATE,
  STUDIO_MODELS,
  getShadeById,
  type MakeupLookState,
} from '../data/makeupCatalog';
import {
  LANDMARK_INDICES,
  getImageFaceLandmarker,
  type FaceLandmarkPoint,
} from '../lib/faceMeshEngine';
import { MakeupCanvasRenderer } from '../lib/makeupRenderer';

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchStudio: (mode: 'model' | 'camera') => void;
}

const TOTAL_DURATION_SEC = 14;

const CHAPTERS = [
  {
    id: 1,
    start: 0,
    end: 3.5,
    index: '01',
    title: 'Choose Camera or Model',
    subtitle: '468-Point Facial Calibration',
    caption:
      'Start with Live Camera, pick a Female or Male studio model by skin tone and face shape, or upload a custom portrait.',
  },
  {
    id: 2,
    start: 3.5,
    end: 7.5,
    index: '02',
    title: 'Layer Seven Glam Products',
    subtitle: 'Foundation · Lipstick · Liner · Kajal · Blush',
    caption:
      'Switch shades and finishes in real time—from Velvet Matte lips and Classic Wing liner to Cream Dew blush and Highlighter.',
  },
  {
    id: 3,
    start: 7.5,
    end: 11.0,
    index: '03',
    title: 'Compare & AI Shade Match',
    subtitle: 'Gemini Undertone Consultation',
    caption:
      'Drag the Before / After split slider or click AI Shade Match to detect your undertone and apply a bespoke formula.',
  },
  {
    id: 4,
    start: 11.0,
    end: 14.0,
    index: '04',
    title: 'Photo Studio & Download',
    subtitle: 'Capture · Save · Shop Shades',
    caption:
      'Click Photo to capture high-resolution glamour portraits, download them instantly, or add your active shades to Vanity Bag.',
  },
];

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(val: number): number {
  return Math.max(0, Math.min(1, val));
}

export const QuickStartModal: React.FC<QuickStartModalProps> = ({
  isOpen,
  onClose,
  onLaunchStudio,
}) => {
  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenMirrorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<MakeupCanvasRenderer | null>(null);
  const modelImgRef = useRef<HTMLImageElement | null>(null);
  const landmarksRef = useRef<FaceLandmarkPoint[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTsRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  if (!rendererRef.current) {
    rendererRef.current = new MakeupCanvasRenderer();
  }
  if (!offscreenMirrorCanvasRef.current && typeof document !== 'undefined') {
    offscreenMirrorCanvasRef.current = document.createElement('canvas');
  }

  const drawPromoFrame = useCallback((tSec: number) => {
    const stage = stageCanvasRef.current;
    const mirrorCanvas = offscreenMirrorCanvasRef.current;
    const renderer = rendererRef.current;
    const img = modelImgRef.current;
    if (!stage || !mirrorCanvas || !renderer || !img || !img.complete) return;

    const W = 1280;
    const H = 720;
    if (stage.width !== W || stage.height !== H) {
      stage.width = W;
      stage.height = H;
    }
    const ctx = stage.getContext('2d');
    if (!ctx) return;

    // Determine animated makeup state based on timeline tSec (0..14)
    const fndProgress = clamp01((tSec - 2.0) / 1.4);
    const lipProgress = clamp01((tSec - 3.6) / 1.2);
    const eyeProgress = clamp01((tSec - 4.7) / 1.2);
    const blushProgress = clamp01((tSec - 5.7) / 1.2);

    const lipShadeId = tSec >= 6.4 ? 'lip-bordeaux' : 'lip-rosewood';
    const lipFinish = tSec >= 6.4 ? 'Matte' : 'Satin';

    const animatedLook: MakeupLookState = {
      ...DEFAULT_LOOK_STATE,
      foundation: {
        enabled: fndProgress > 0.02,
        shadeId: 'fnd-sand',
        intensity: Math.round(44 * easeInOutCubic(fndProgress)),
        finish: 'Natural Satin',
      },
      lipstick: {
        enabled: lipProgress > 0.02,
        shadeId: lipShadeId,
        intensity: Math.round(78 * easeInOutCubic(lipProgress)),
        finish: lipFinish,
      },
      eyeliner: {
        enabled: eyeProgress > 0.02,
        shadeId: 'eye-obsidian',
        intensity: Math.round(80 * easeInOutCubic(eyeProgress)),
        thickness: 5,
        style: 'Classic Wing',
      },
      kajal: {
        enabled: eyeProgress > 0.2,
        shadeId: 'kaj-soot',
        intensity: Math.round(48 * easeInOutCubic(eyeProgress)),
        thickness: 4,
        style: 'Tight Waterline',
      },
      eyeshadow: {
        enabled: eyeProgress > 0.1,
        shadeId: 'shd-bronze',
        intensity: Math.round(46 * easeInOutCubic(eyeProgress)),
        finish: 'Silk Shimmer',
      },
      blush: {
        enabled: blushProgress > 0.02,
        shadeId: 'blush-rose',
        intensity: Math.round(52 * easeInOutCubic(blushProgress)),
        finish: 'Cream Dew',
      },
      highlighter: {
        enabled: blushProgress > 0.2,
        shadeId: 'hlt-champagne',
        intensity: Math.round(48 * easeInOutCubic(blushProgress)),
        finish: 'Glass Glow',
      },
    };

    // Split comparison animation during Scene 3 (7.5s -> 10.6s)
    const inSplitScene = tSec >= 7.5 && tSec <= 10.8;
    const splitPhase = clamp01((tSec - 7.5) / 3.1);
    const splitRatio = 0.5 + Math.sin(splitPhase * Math.PI * 2) * 0.34;

    renderer.render({
      targetCanvas: mirrorCanvas,
      source: img,
      sourceWidth: img.naturalWidth,
      sourceHeight: img.naturalHeight,
      landmarks: landmarksRef.current,
      look: animatedLook,
      mirrorHorizontal: false,
      splitEnabled: inSplitScene,
      splitRatio,
      lighting: tSec >= 9.2 && tSec <= 11.2 ? 'Golden Hour' : 'Daylight',
    });

    // Clear 16:9 stage
    ctx.fillStyle = '#FAF8F6';
    ctx.fillRect(0, 0, W, H);

    // Left Mirror Panel (700px wide, full height 720px)
    const leftW = 700;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, leftW, H);
    ctx.clip();

    // Subtle smooth Ken Burns zoom
    const zoom = 1.02 + Math.sin((tSec / TOTAL_DURATION_SEC) * Math.PI) * 0.035;
    const drawH = H * zoom;
    const drawW = (mirrorCanvas.width / mirrorCanvas.height) * drawH;
    const dx = (leftW - drawW) / 2;
    const dy = (H - drawH) * 0.18;
    ctx.drawImage(mirrorCanvas, dx, dy, drawW, drawH);

    // Scene 1: Brief geometric facial contour calibration overlay (0.5s -> 2.8s)
    if (tSec >= 0.4 && tSec <= 2.9 && landmarksRef.current) {
      const scanAlpha =
        tSec < 1.0
          ? clamp01((tSec - 0.4) / 0.6)
          : clamp01(1 - (tSec - 2.2) / 0.7);
      const lms = landmarksRef.current;
      const toStage = (idx: number) => ({
        x: dx + lms[idx].x * drawW,
        y: dy + lms[idx].y * drawH,
      });

      ctx.save();
      ctx.globalAlpha = scanAlpha * 0.78;
      ctx.strokeStyle = '#FAF8F6';
      ctx.lineWidth = 1.4;

      const drawLoop = (indices: number[]) => {
        ctx.beginPath();
        indices.forEach((id, idx) => {
          const p = toStage(id);
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        ctx.stroke();
      };

      drawLoop(LANDMARK_INDICES.FACE_OVAL);
      drawLoop(LANDMARK_INDICES.OUTER_LIP);
      drawLoop(LANDMARK_INDICES.LEFT_EYE);
      drawLoop(LANDMARK_INDICES.RIGHT_EYE);
      ctx.restore();
    }

    // Scene 3: Split Divider Line on stage
    if (inSplitScene) {
      const splitX = dx + splitRatio * drawW;
      ctx.save();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, H);
      ctx.stroke();

      ctx.fillStyle = 'rgba(25, 22, 21, 0.78)';
      ctx.fillRect(24, 24, 90, 30);
      ctx.fillRect(leftW - 114, 24, 90, 30);
      ctx.fillStyle = '#FAF8F6';
      ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Bare Skin', 69, 44);
      ctx.fillText('Virtual Look', leftW - 69, 44);
      ctx.restore();
    }

    // Scene 4: Studio Shutter Flash at t = 11.4s
    if (tSec >= 11.35 && tSec <= 11.75) {
      const flashAlpha = 1 - clamp01((tSec - 11.35) / 0.4);
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.85})`;
      ctx.fillRect(0, 0, leftW, H);
    }

    // Bottom subtle gradient scrim on left mirror panel
    const scrim = ctx.createLinearGradient(0, H - 120, 0, H);
    scrim.addColorStop(0, 'rgba(25, 22, 21, 0)');
    scrim.addColorStop(1, 'rgba(25, 22, 21, 0.72)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H - 120, leftW, 120);

    ctx.fillStyle = '#FAF8F6';
    ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Model 25 · Light-Medium · Neutral Shoot', 28, H - 28);
    ctx.restore();

    // Right Editorial Storyboard Panel (x = 700..1280)
    const rightX = 700;
    const rightW = W - rightX;
    ctx.fillStyle = '#191615';
    ctx.fillRect(rightX, 0, rightW, H);

    const activeChapter =
      CHAPTERS.find((c) => tSec >= c.start && tSec < c.end) ??
      CHAPTERS[CHAPTERS.length - 1];

    // Chapter Header
    ctx.fillStyle = '#D98B95';
    ctx.font = '500 14px "JetBrains Mono", monospace';
    ctx.fillText(`STEP ${activeChapter.index} / 04`, rightX + 48, 86);

    ctx.fillStyle = '#FAF8F6';
    ctx.font = '600 40px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(activeChapter.title, rightX + 48, 138);

    ctx.fillStyle = '#B8AEA8';
    ctx.font = '400 15px "Plus Jakarta Sans", sans-serif';
    const words = activeChapter.caption.split(' ');
    let line = '';
    let yLine = 182;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > rightW - 96) {
        ctx.fillText(line, rightX + 48, yLine);
        line = w;
        yLine += 24;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, rightX + 48, yLine);

    // Interactive Live Swatch Readout Cards inside Promo Video
    const displayRows = [
      {
        label: 'Foundation',
        shade: getShadeById('fnd-sand'),
        pct: animatedLook.foundation.intensity,
      },
      {
        label: 'Lipstick',
        shade: getShadeById(lipShadeId),
        pct: animatedLook.lipstick.intensity,
      },
      {
        label: 'Eyeliner & Kajal',
        shade: getShadeById('eye-obsidian'),
        pct: animatedLook.eyeliner.intensity,
      },
      {
        label: 'Blush & Glow',
        shade: getShadeById('blush-rose'),
        pct: animatedLook.blush.intensity,
      },
    ];

    let cardY = 285;
    displayRows.forEach((row) => {
      const active = row.pct > 0;
      ctx.fillStyle = active ? '#26211F' : '#1F1B1A';
      ctx.beginPath();
      ctx.roundRect(rightX + 48, cardY, rightW - 96, 62, 10);
      ctx.fill();

      // Swatch circle
      ctx.fillStyle = row.shade?.hex || '#A8585E';
      ctx.beginPath();
      ctx.arc(rightX + 80, cardY + 31, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#9E948E';
      ctx.font = '500 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(row.label.toUpperCase(), rightX + 110, cardY + 24);

      ctx.fillStyle = active ? '#FAF8F6' : '#7D736E';
      ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(row.shade?.name || '', rightX + 110, cardY + 45);

      ctx.fillStyle = active ? '#FAF8F6' : '#6E6560';
      ctx.font = '500 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${row.pct}%`, rightX + rightW - 68, cardY + 36);
      ctx.textAlign = 'left';

      cardY += 74;
    });

    // AI Shade Match Badge Card in Scenes 3 & 4
    if (tSec >= 8.4) {
      const aiAlpha = clamp01((tSec - 8.4) / 0.5);
      ctx.save();
      ctx.globalAlpha = aiAlpha;
      ctx.fillStyle = '#8B2635';
      ctx.beginPath();
      ctx.roundRect(rightX + 48, 594, rightW - 96, 76, 10);
      ctx.fill();

      ctx.fillStyle = '#F5D5D9';
      ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('AI SHADE MATCH · GEMINI COLORIST', rightX + 68, 622);

      ctx.fillStyle = '#FAF8F6';
      ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        tSec >= 11.4
          ? 'Glamour Portrait Saved · Ready to Download'
          : 'Detected: Light-Medium · Neutral Shoot',
        rightX + 68,
        650
      );
      ctx.restore();
    }
  }, []);

  // Load Model 25 + MediaPipe landmarks when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setIsReady(false);
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      if (cancelled) return;
      modelImgRef.current = img;
      try {
        const landmarker = await getImageFaceLandmarker();
        if (cancelled) return;
        const result = landmarker.detect(img);
        if (!cancelled && result.faceLandmarks?.[0]) {
          landmarksRef.current = result.faceLandmarks[0];
        }
      } catch {
        // Render gracefully even if landmark check falls back
      }
      if (!cancelled) {
        setIsReady(true);
        drawPromoFrame(0);
      }
    };
    img.onerror = () => {
      if (!cancelled) setIsReady(true);
    };
    img.src = STUDIO_MODELS[0].imageUrl;

    return () => {
      cancelled = true;
    };
  }, [isOpen, drawPromoFrame]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // 60fps Promo Playback Loop
  useEffect(() => {
    if (!isOpen || !isReady) return;

    if (!isPlaying) {
      drawPromoFrame(currentTimeRef.current);
      return;
    }

    lastFrameTsRef.current = performance.now();

    const step = (now: number) => {
      const prevTs = lastFrameTsRef.current ?? now;
      const dt = Math.min(0.1, (now - prevTs) / 1000);
      lastFrameTsRef.current = now;

      let nextTime = currentTimeRef.current + dt;
      if (nextTime >= TOTAL_DURATION_SEC) {
        nextTime = 0;
      }
      currentTimeRef.current = nextTime;
      setCurrentTime(nextTime);
      drawPromoFrame(nextTime);

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isOpen, isReady, isPlaying, drawPromoFrame]);

  if (!isOpen) return null;

  const activeChapter =
    CHAPTERS.find((c) => currentTime >= c.start && currentTime < c.end) ??
    CHAPTERS[0];

  const handleSeek = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_DURATION_SEC - 0.01, targetSec));
    currentTimeRef.current = clamped;
    setCurrentTime(clamped);
    drawPromoFrame(clamped);
  };

  const formatSec = (s: number) => {
    const whole = Math.floor(s);
    return `00:${whole < 10 ? `0${whole}` : whole}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-start-title"
    >
      <div
        className="fixed inset-0 bg-[#191615]/65 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-5xl bg-[#FAF8F6] rounded-2xl border border-[#191615]/15 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#191615]/10 bg-white">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-[#8B2635]" />
            <div>
              <h2
                id="quick-start-title"
                className="font-display text-2xl font-semibold text-[#191615] leading-none"
              >
                Quick Start Studio Reel
              </h2>
              <p className="text-xs text-[#6E6560] mt-1">
                Live mirror calibration, seven-layer shade application, and AI shade matching
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Quick Start modal"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#5C534E] hover:text-[#191615] hover:bg-[#EFEAE4] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 16:9 High-Resolution Promotional Reel Stage */}
        <div className="relative w-full aspect-video bg-[#191615]">
          <canvas
            ref={stageCanvasRef}
            className="w-full h-full object-contain block"
          />
          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#191615] text-[#FAF8F6] text-xs">
              Preparing studio demonstration reel…
            </div>
          )}
        </div>

        {/* Video Transport & Chapter Controls */}
        <div className="px-6 py-4 bg-white border-t border-[#191615]/10 flex flex-col gap-3">
          {/* Interactive Progress Scrubber */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              className="w-9 h-9 rounded-lg bg-[#191615] text-[#FAF8F6] hover:bg-[#2F2A28] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                handleSeek(0);
                setIsPlaying(true);
              }}
              aria-label="Restart video"
              className="w-9 h-9 rounded-lg bg-[#F3EFEA] text-[#191615] hover:bg-[#E4DDD5] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="flex-1 flex flex-col gap-1">
              <input
                type="range"
                min={0}
                max={TOTAL_DURATION_SEC}
                step={0.05}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                aria-label="Video timeline"
                className="atelier-slider"
              />
            </div>

            <span className="text-xs font-mono tabular-nums text-[#5C534E] shrink-0">
              {formatSec(currentTime)} / {formatSec(TOTAL_DURATION_SEC)}
            </span>
          </div>

          {/* Chapter Pills & Launch Studio Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {CHAPTERS.map((chap) => {
                const isActive = activeChapter.id === chap.id;
                return (
                  <button
                    key={chap.id}
                    type="button"
                    onClick={() => handleSeek(chap.start + 0.05)}
                    className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#191615] text-[#FAF8F6]'
                        : 'bg-[#F3EFEA] text-[#5C534E] hover:text-[#191615]'
                    }`}
                  >
                    {chap.index}. {chap.title}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLaunchStudio('model');
                }}
                className="px-4 py-2 bg-[#F3EFEA] hover:bg-[#E4DDD5] text-[#191615] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Try on Studio Models
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLaunchStudio('camera');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B2635] hover:bg-[#6E1D2A] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                Open Live Camera
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
