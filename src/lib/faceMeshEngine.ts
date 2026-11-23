import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type FaceLandmarkPoint = NormalizedLandmark;

// Canonical MediaPipe 468-point facial topology indices
export const LANDMARK_INDICES = {
  FACE_OVAL: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
    378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
    162, 21, 54, 103, 67, 109,
  ],
  OUTER_LIP: [
    61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84,
    181, 91, 146,
  ],
  INNER_LIP: [
    78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14,
    87, 178, 88, 95,
  ],
  LEFT_EYE: [
    33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7,
  ],
  RIGHT_EYE: [
    362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381,
    382,
  ],
  // Upper lash line: outer -> inner for left eye; inner -> outer for right eye
  LEFT_UPPER_LASH: [33, 246, 161, 160, 159, 158, 157, 173, 133],
  RIGHT_UPPER_LASH: [362, 398, 384, 385, 386, 387, 388, 466, 263],
  // Lower lash / waterline for Kajal: outer -> inner for left; inner -> outer for right
  LEFT_LOWER_LASH: [33, 7, 163, 144, 145, 153, 154, 155, 133],
  RIGHT_LOWER_LASH: [362, 382, 381, 380, 374, 373, 390, 249, 263],
  // Upper eyelid + crease zone for Eyeshadow
  LEFT_EYELID_SHADE: [
    33, 246, 161, 160, 159, 158, 157, 173, 133, 190, 56, 28, 27, 29, 30, 247,
  ],
  RIGHT_EYELID_SHADE: [
    263, 466, 388, 387, 386, 385, 384, 398, 362, 414, 286, 258, 257, 259, 260,
    467,
  ],
  LEFT_BROW: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  RIGHT_BROW: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  // Cheekbone zones
  LEFT_CHEEK_INNER: 50,
  LEFT_CHEEK_OUTER: 123,
  LEFT_CHEEK_TOP: 118,
  LEFT_CHEEK_LOWER: 205,
  RIGHT_CHEEK_INNER: 280,
  RIGHT_CHEEK_OUTER: 352,
  RIGHT_CHEEK_TOP: 347,
  RIGHT_CHEEK_LOWER: 425,
  // Highlight anchors
  FOREHEAD_CENTER: 151,
  NOSE_BRIDGE: [6, 197, 195, 5, 4],
  NOSE_TIP: 4,
  CUPIDS_BOW: 0,
  CHIN_CENTER: 199,
};

let imageLandmarker: FaceLandmarker | null = null;
let videoLandmarker: FaceLandmarker | null = null;
let imageLoadPromise: Promise<FaceLandmarker> | null = null;
let videoLoadPromise: Promise<FaceLandmarker> | null = null;
let isLogFilterInstalled = false;

function installMediaPipeInfoFilter() {
  if (isLogFilterInstalled || typeof window === 'undefined') return;
  isLogFilterInstalled = true;
  const origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const msg = args
      .map((a) => (typeof a === 'string' ? a : ''))
      .join(' ')
      .trim();
    if (
      msg.includes('Created TensorFlow Lite XNNPACK delegate') ||
      /^INFO:\s+Created TensorFlow Lite/i.test(msg) ||
      /^I\d{4}\s+.*(?:xnnpack|tflite)/i.test(msg)
    ) {
      return;
    }
    origError(...args);
  };
}

function supportsWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

async function createLandmarker(runningMode: 'IMAGE' | 'VIDEO'): Promise<FaceLandmarker> {
  installMediaPipeInfoFilter();
  const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');
  const baseConfig = {
    runningMode,
    numFaces: 1,
    minFaceDetectionConfidence: 0.45,
    minFacePresenceConfidence: 0.45,
    minTrackingConfidence: 0.45,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  } as const;

  if (supportsWebGL2()) {
    try {
      return await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/mediapipe/face_landmarker.task',
          delegate: 'GPU',
        },
        ...baseConfig,
      });
    } catch {
      // Fall through cleanly to CPU delegate
    }
  }

  return await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/mediapipe/face_landmarker.task',
      delegate: 'CPU',
    },
    ...baseConfig,
  });
}

export async function getImageFaceLandmarker(): Promise<FaceLandmarker> {
  if (imageLandmarker) return imageLandmarker;
  if (!imageLoadPromise) {
    imageLoadPromise = createLandmarker('IMAGE').then((instance) => {
      imageLandmarker = instance;
      return instance;
    });
  }
  return imageLoadPromise;
}

export async function getVideoFaceLandmarker(): Promise<FaceLandmarker> {
  if (videoLandmarker) return videoLandmarker;
  if (!videoLoadPromise) {
    videoLoadPromise = createLandmarker('VIDEO').then((instance) => {
      videoLandmarker = instance;
      return instance;
    });
  }
  return videoLoadPromise;
}

export function smoothLandmarks(
  prev: FaceLandmarkPoint[] | null,
  next: FaceLandmarkPoint[],
  alpha = 0.58
): FaceLandmarkPoint[] {
  if (!prev || prev.length !== next.length) {
    return next.map((pt) => ({ ...pt }));
  }
  return next.map((pt, i) => {
    const p = prev[i];
    return {
      x: p.x + (pt.x - p.x) * alpha,
      y: p.y + (pt.y - p.y) * alpha,
      z: p.z + (pt.z - p.z) * alpha,
      visibility: pt.visibility,
    };
  });
}
