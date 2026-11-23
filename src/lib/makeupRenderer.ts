import {
  getShadeById,
  type LightingMode,
  type MakeupLookState,
} from '../data/makeupCatalog';
import { LANDMARK_INDICES, type FaceLandmarkPoint } from './faceMeshEngine';

interface Point2D {
  x: number;
  y: number;
}

export class MakeupCanvasRenderer {
  private layerCanvas: HTMLCanvasElement;
  private layerCtx: CanvasRenderingContext2D;
  private smoothCanvas: HTMLCanvasElement;
  private smoothCtx: CanvasRenderingContext2D;

  constructor() {
    this.layerCanvas = document.createElement('canvas');
    this.layerCtx = this.layerCanvas.getContext('2d')!;
    this.smoothCanvas = document.createElement('canvas');
    this.smoothCtx = this.smoothCanvas.getContext('2d')!;
  }

  private ensureSize(width: number, height: number) {
    if (this.layerCanvas.width !== width || this.layerCanvas.height !== height) {
      this.layerCanvas.width = width;
      this.layerCanvas.height = height;
      this.smoothCanvas.width = width;
      this.smoothCanvas.height = height;
    }
  }

  public render(opts: {
    targetCanvas: HTMLCanvasElement;
    source: HTMLVideoElement | HTMLImageElement;
    sourceWidth: number;
    sourceHeight: number;
    landmarks: FaceLandmarkPoint[] | null;
    look: MakeupLookState;
    mirrorHorizontal: boolean;
    splitEnabled: boolean;
    splitRatio: number; // 0 to 1
    lighting: LightingMode;
  }) {
    const {
      targetCanvas,
      source,
      sourceWidth,
      sourceHeight,
      landmarks,
      look,
      mirrorHorizontal,
      splitEnabled,
      splitRatio,
      lighting,
    } = opts;

    if (!sourceWidth || !sourceHeight) return;

    if (targetCanvas.width !== sourceWidth || targetCanvas.height !== sourceHeight) {
      targetCanvas.width = sourceWidth;
      targetCanvas.height = sourceHeight;
    }

    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    this.ensureSize(sourceWidth, sourceHeight);

    // 1. Draw base source image/video frame (mirrored if front camera)
    ctx.save();
    ctx.clearRect(0, 0, sourceWidth, sourceHeight);
    if (mirrorHorizontal) {
      ctx.translate(sourceWidth, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight);
    ctx.restore();

    // Optional studio lighting warmth/mood tint across the frame
    if (lighting !== 'Daylight') {
      ctx.save();
      if (lighting === 'Golden Hour') {
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = 'rgba(246, 186, 122, 0.16)';
        ctx.fillRect(0, 0, sourceWidth, sourceHeight);
      } else if (lighting === 'Candlelight') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(245, 224, 200, 0.22)';
        ctx.fillRect(0, 0, sourceWidth, sourceHeight);
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = 'rgba(255, 178, 108, 0.18)';
        ctx.fillRect(0, 0, sourceWidth, sourceHeight);
      }
      ctx.restore();
    }

    if (!landmarks || landmarks.length < 468) {
      return;
    }

    const pts: Point2D[] = landmarks.map((lm) => ({
      x: (mirrorHorizontal ? 1 - lm.x : lm.x) * sourceWidth,
      y: lm.y * sourceHeight,
    }));

    // Prepare clipped region if split comparison is enabled
    ctx.save();
    if (splitEnabled) {
      const splitX = Math.max(0, Math.min(sourceWidth, splitRatio * sourceWidth));
      ctx.beginPath();
      ctx.rect(splitX, 0, sourceWidth - splitX, sourceHeight);
      ctx.clip();
    }

    // 2. Render Makeup Layers in natural cosmetic application order
    if (look.foundation.enabled && look.foundation.intensity > 0) {
      this.drawFoundation(ctx, targetCanvas, pts, look, sourceWidth, sourceHeight);
    }

    if (look.blush.enabled && look.blush.intensity > 0) {
      this.drawBlush(ctx, pts, look, sourceWidth);
    }

    if (look.highlighter.enabled && look.highlighter.intensity > 0) {
      this.drawHighlighter(ctx, pts, look, sourceWidth);
    }

    if (look.eyeshadow.enabled && look.eyeshadow.intensity > 0) {
      this.drawEyeshadow(ctx, pts, look, sourceWidth);
    }

    if (look.kajal.enabled && look.kajal.intensity > 0) {
      this.drawKajal(ctx, pts, look);
    }

    if (look.eyeliner.enabled && look.eyeliner.intensity > 0) {
      this.drawEyeliner(ctx, pts, look);
    }

    if (look.lipstick.enabled && look.lipstick.intensity > 0) {
      this.drawLipstick(ctx, pts, look, sourceWidth);
    }

    ctx.restore();
  }

  private drawSmoothClosedPath(ctx: CanvasRenderingContext2D, points: Point2D[]) {
    if (points.length < 3) return;
    const len = points.length;
    const mid0x = (points[len - 1].x + points[0].x) / 2;
    const mid0y = (points[len - 1].y + points[0].y) / 2;
    ctx.moveTo(mid0x, mid0y);
    for (let i = 0; i < len; i++) {
      const curr = points[i];
      const next = points[(i + 1) % len];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
    }
    ctx.closePath();
  }

  private drawSmoothOpenPath(ctx: CanvasRenderingContext2D, points: Point2D[]) {
    if (points.length < 2) return;
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  private getPoints(pts: Point2D[], indices: number[]): Point2D[] {
    return indices.map((idx) => pts[idx]);
  }

  private createFaceMaskPath(ctx: CanvasRenderingContext2D, pts: Point2D[]) {
    ctx.beginPath();
    this.drawSmoothClosedPath(ctx, this.getPoints(pts, LANDMARK_INDICES.FACE_OVAL));
    this.drawSmoothClosedPath(ctx, this.getPoints(pts, LANDMARK_INDICES.LEFT_EYE));
    this.drawSmoothClosedPath(ctx, this.getPoints(pts, LANDMARK_INDICES.RIGHT_EYE));
    this.drawSmoothClosedPath(ctx, this.getPoints(pts, LANDMARK_INDICES.OUTER_LIP));
    this.drawSmoothClosedPath(ctx, this.getPoints(pts, LANDMARK_INDICES.LEFT_BROW));
    this.drawSmoothClosedPath(ctx, this.getPoints(pts, LANDMARK_INDICES.RIGHT_BROW));
  }

  private drawFoundation(
    ctx: CanvasRenderingContext2D,
    baseCanvas: HTMLCanvasElement,
    pts: Point2D[],
    look: MakeupLookState,
    w: number,
    h: number
  ) {
    const shade = getShadeById(look.foundation.shadeId);
    if (!shade) return;

    const alpha = (look.foundation.intensity / 100) * 0.42;
    const faceWidth = Math.hypot(pts[454].x - pts[234].x, pts[454].y - pts[234].y);
    const featherPx = Math.max(8, faceWidth * 0.055);

    this.smoothCtx.clearRect(0, 0, w, h);
    this.smoothCtx.save();
    this.createFaceMaskPath(this.smoothCtx, pts);
    this.smoothCtx.clip('evenodd');
    this.smoothCtx.filter = `blur(${Math.max(2, faceWidth * 0.012).toFixed(1)}px)`;
    this.smoothCtx.drawImage(baseCanvas, 0, 0);
    this.smoothCtx.restore();

    ctx.save();
    ctx.globalAlpha = Math.min(0.42, (look.foundation.intensity / 100) * 0.45);
    ctx.drawImage(this.smoothCanvas, 0, 0);
    ctx.restore();

    this.layerCtx.clearRect(0, 0, w, h);
    this.layerCtx.save();
    this.layerCtx.filter = `blur(${featherPx.toFixed(1)}px)`;
    this.createFaceMaskPath(this.layerCtx, pts);
    this.layerCtx.fillStyle = shade.hex;
    this.layerCtx.fill('evenodd');
    this.layerCtx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = alpha * 1.15;
    ctx.drawImage(this.layerCanvas, 0, 0);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha * 0.38;
    ctx.drawImage(this.layerCanvas, 0, 0);

    if (look.foundation.finish === 'Radiant Dew') {
      const highlightPoints = [
        pts[LANDMARK_INDICES.FOREHEAD_CENTER],
        pts[LANDMARK_INDICES.NOSE_BRIDGE[2]],
        pts[LANDMARK_INDICES.LEFT_CHEEK_TOP],
        pts[LANDMARK_INDICES.RIGHT_CHEEK_TOP],
      ];
      ctx.globalCompositeOperation = 'screen';
      highlightPoints.forEach((hp, idx) => {
        const radius = idx < 2 ? faceWidth * 0.14 : faceWidth * 0.11;
        const grad = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, radius);
        grad.addColorStop(
          0,
          `rgba(255, 246, 236, ${(look.foundation.intensity / 100) * 0.16})`
        );
        grad.addColorStop(1, 'rgba(255, 246, 236, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (look.foundation.finish === 'Soft Matte') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = (look.foundation.intensity / 100) * 0.08;
      ctx.drawImage(this.layerCanvas, 0, 0);
    }

    ctx.restore();
  }

  private drawBlush(
    ctx: CanvasRenderingContext2D,
    pts: Point2D[],
    look: MakeupLookState,
    w: number
  ) {
    const shade = getShadeById(look.blush.shadeId);
    if (!shade) return;

    const faceWidth = Math.hypot(pts[454].x - pts[234].x, pts[454].y - pts[234].y);
    const intensity = look.blush.intensity / 100;

    const drawSingleCheek = (
      innerIdx: number,
      outerIdx: number,
      topIdx: number,
      lowerIdx: number
    ) => {
      const pInner = pts[innerIdx];
      const pOuter = pts[outerIdx];
      const pTop = pts[topIdx];
      const pLower = pts[lowerIdx];

      const cx = pInner.x * 0.35 + pOuter.x * 0.35 + pTop.x * 0.2 + pLower.x * 0.1;
      const cy = pInner.y * 0.3 + pOuter.y * 0.3 + pTop.y * 0.25 + pLower.y * 0.15;

      const angle = Math.atan2(pOuter.y - pInner.y, pOuter.x - pInner.x);
      const rx = faceWidth * 0.145;
      const ry = faceWidth * 0.092;

      this.layerCtx.clearRect(0, 0, w, this.layerCanvas.height);
      this.layerCtx.save();
      this.layerCtx.translate(cx, cy);
      this.layerCtx.rotate(angle);
      this.layerCtx.scale(1, ry / rx);

      const grad = this.layerCtx.createRadialGradient(0, 0, 0, 0, 0, rx);
      grad.addColorStop(0, shade.hex);
      grad.addColorStop(0.55, shade.hex + '88');
      grad.addColorStop(1, shade.hex + '00');
      this.layerCtx.fillStyle = grad;
      this.layerCtx.beginPath();
      this.layerCtx.arc(0, 0, rx, 0, Math.PI * 2);
      this.layerCtx.fill();
      this.layerCtx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha =
        intensity * (look.blush.finish === 'Velvet Powder' ? 0.56 : 0.44);
      ctx.drawImage(this.layerCanvas, 0, 0);

      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = intensity * 0.36;
      ctx.drawImage(this.layerCanvas, 0, 0);

      if (
        look.blush.finish === 'Cream Dew' ||
        look.blush.finish === 'Radiant Veil'
      ) {
        ctx.globalCompositeOperation = 'screen';
        const glowRadius = faceWidth * 0.08;
        const glowGrad = ctx.createRadialGradient(
          pTop.x,
          pTop.y,
          0,
          pTop.x,
          pTop.y,
          glowRadius
        );
        const sheenAlpha =
          look.blush.finish === 'Radiant Veil' ? intensity * 0.24 : intensity * 0.16;
        glowGrad.addColorStop(0, `rgba(255, 244, 238, ${sheenAlpha})`);
        glowGrad.addColorStop(1, 'rgba(255, 244, 238, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(pTop.x, pTop.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    drawSingleCheek(
      LANDMARK_INDICES.LEFT_CHEEK_INNER,
      LANDMARK_INDICES.LEFT_CHEEK_OUTER,
      LANDMARK_INDICES.LEFT_CHEEK_TOP,
      LANDMARK_INDICES.LEFT_CHEEK_LOWER
    );
    drawSingleCheek(
      LANDMARK_INDICES.RIGHT_CHEEK_INNER,
      LANDMARK_INDICES.RIGHT_CHEEK_OUTER,
      LANDMARK_INDICES.RIGHT_CHEEK_TOP,
      LANDMARK_INDICES.RIGHT_CHEEK_LOWER
    );
  }

  private drawHighlighter(
    ctx: CanvasRenderingContext2D,
    pts: Point2D[],
    look: MakeupLookState,
    _w: number
  ) {
    const shade = getShadeById(look.highlighter.shadeId);
    if (!shade) return;

    const faceWidth = Math.hypot(pts[454].x - pts[234].x, pts[454].y - pts[234].y);
    const intensity = look.highlighter.intensity / 100;
    const boost =
      look.highlighter.finish === 'Glass Glow'
        ? 0.42
        : look.highlighter.finish === 'Pearl Sheen'
          ? 0.34
          : 0.24;

    const drawGlowSpot = (
      center: Point2D,
      rx: number,
      ry: number,
      angle: number,
      alphaScale: number
    ) => {
      ctx.save();
      ctx.translate(center.x, center.y);
      ctx.rotate(angle);
      ctx.scale(1, ry / rx);
      ctx.globalCompositeOperation = 'screen';
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      grad.addColorStop(0, shade.hex);
      grad.addColorStop(0.5, shade.hex + '66');
      grad.addColorStop(1, shade.hex + '00');
      ctx.globalAlpha = intensity * boost * alphaScale;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // High cheekbones (angled toward temples)
    const leftAngle = Math.atan2(
      pts[LANDMARK_INDICES.LEFT_CHEEK_OUTER].y - pts[LANDMARK_INDICES.LEFT_CHEEK_TOP].y,
      pts[LANDMARK_INDICES.LEFT_CHEEK_OUTER].x - pts[LANDMARK_INDICES.LEFT_CHEEK_TOP].x
    );
    const rightAngle = Math.atan2(
      pts[LANDMARK_INDICES.RIGHT_CHEEK_OUTER].y - pts[LANDMARK_INDICES.RIGHT_CHEEK_TOP].y,
      pts[LANDMARK_INDICES.RIGHT_CHEEK_OUTER].x - pts[LANDMARK_INDICES.RIGHT_CHEEK_TOP].x
    );

    drawGlowSpot(
      pts[LANDMARK_INDICES.LEFT_CHEEK_TOP],
      faceWidth * 0.11,
      faceWidth * 0.045,
      leftAngle,
      1.0
    );
    drawGlowSpot(
      pts[LANDMARK_INDICES.RIGHT_CHEEK_TOP],
      faceWidth * 0.11,
      faceWidth * 0.045,
      rightAngle,
      1.0
    );

    // Nose bridge + tip + Cupid's bow subtle touches
    drawGlowSpot(
      pts[LANDMARK_INDICES.NOSE_TIP],
      faceWidth * 0.045,
      faceWidth * 0.045,
      0,
      0.75
    );
    drawGlowSpot(
      pts[LANDMARK_INDICES.CUPIDS_BOW],
      faceWidth * 0.04,
      faceWidth * 0.025,
      0,
      0.6
    );
  }

  private drawEyeshadow(
    ctx: CanvasRenderingContext2D,
    pts: Point2D[],
    look: MakeupLookState,
    w: number
  ) {
    const shade = getShadeById(look.eyeshadow.shadeId);
    if (!shade) return;

    const intensity = look.eyeshadow.intensity / 100;
    const faceWidth = Math.hypot(pts[454].x - pts[234].x, pts[454].y - pts[234].y);
    const featherPx = Math.max(3, faceWidth * 0.018);

    const drawSingleLid = (
      lidIndices: number[],
      eyeCutoutIndices: number[],
      lidCenterIdx: number
    ) => {
      const lidPts = this.getPoints(pts, lidIndices);
      const eyeCutoutPts = this.getPoints(pts, eyeCutoutIndices);

      this.layerCtx.clearRect(0, 0, w, this.layerCanvas.height);
      this.layerCtx.save();
      this.layerCtx.filter = `blur(${featherPx.toFixed(1)}px)`;
      this.layerCtx.beginPath();
      this.drawSmoothClosedPath(this.layerCtx, lidPts);
      this.drawSmoothClosedPath(this.layerCtx, eyeCutoutPts);
      this.layerCtx.fillStyle = shade.hex;
      this.layerCtx.fill('evenodd');
      this.layerCtx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = intensity * 0.62;
      ctx.drawImage(this.layerCanvas, 0, 0);

      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = intensity * 0.45;
      ctx.drawImage(this.layerCanvas, 0, 0);

      if (
        look.eyeshadow.finish === 'Silk Shimmer' ||
        look.eyeshadow.finish === 'Metallic Foil'
      ) {
        const centerPt = pts[lidCenterIdx];
        const rx = faceWidth * 0.055;
        ctx.globalCompositeOperation = 'screen';
        const sheenGrad = ctx.createRadialGradient(
          centerPt.x,
          centerPt.y - faceWidth * 0.012,
          0,
          centerPt.x,
          centerPt.y - faceWidth * 0.012,
          rx
        );
        const sheenOpacity =
          look.eyeshadow.finish === 'Metallic Foil'
            ? intensity * 0.42
            : intensity * 0.26;
        sheenGrad.addColorStop(0, `rgba(255, 245, 236, ${sheenOpacity})`);
        sheenGrad.addColorStop(1, 'rgba(255, 245, 236, 0)');
        ctx.fillStyle = sheenGrad;
        ctx.beginPath();
        ctx.arc(centerPt.x, centerPt.y - faceWidth * 0.012, rx, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    drawSingleLid(LANDMARK_INDICES.LEFT_EYELID_SHADE, LANDMARK_INDICES.LEFT_EYE, 159);
    drawSingleLid(LANDMARK_INDICES.RIGHT_EYELID_SHADE, LANDMARK_INDICES.RIGHT_EYE, 386);
  }

  private drawKajal(
    ctx: CanvasRenderingContext2D,
    pts: Point2D[],
    look: MakeupLookState
  ) {
    const shade = getShadeById(look.kajal.shadeId);
    if (!shade) return;

    const intensity = look.kajal.intensity / 100;
    const thicknessScale = 0.35 + (look.kajal.thickness / 10) * 0.65;

    const drawLowerLash = (
      lowerIndices: number[],
      outerIdx: number,
      innerIdx: number
    ) => {
      const lowerPts = this.getPoints(pts, lowerIndices);
      const outerPt = pts[outerIdx];
      const innerPt = pts[innerIdx];
      const eyeWidth = Math.hypot(outerPt.x - innerPt.x, outerPt.y - innerPt.y);
      const strokeW = Math.max(1.2, eyeWidth * 0.055 * thicknessScale);

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = shade.hex;

      if (look.kajal.style === 'Smoky Lower') {
        // Soft smudged lower-lash halo
        ctx.filter = `blur(${Math.max(1.4, strokeW * 0.85).toFixed(1)}px)`;
        ctx.globalAlpha = intensity * 0.62;
        ctx.lineWidth = strokeW * 2.1;
        ctx.beginPath();
        this.drawSmoothOpenPath(ctx, lowerPts);
        ctx.stroke();
      }

      // Crisp waterline / lower lash kohl line
      ctx.filter = `blur(${Math.max(0.4, strokeW * 0.25).toFixed(1)}px)`;
      ctx.globalAlpha =
        intensity * (look.kajal.style === 'Tight Waterline' ? 0.78 : 0.9);
      ctx.lineWidth =
        look.kajal.style === 'Tight Waterline' ? strokeW * 0.78 : strokeW * 1.05;
      ctx.beginPath();
      this.drawSmoothOpenPath(ctx, lowerPts);
      ctx.stroke();

      ctx.restore();
    };

    drawLowerLash(LANDMARK_INDICES.LEFT_LOWER_LASH, 33, 133);
    drawLowerLash(LANDMARK_INDICES.RIGHT_LOWER_LASH, 263, 362);
  }

  private drawEyeliner(
    ctx: CanvasRenderingContext2D,
    pts: Point2D[],
    look: MakeupLookState
  ) {
    const shade = getShadeById(look.eyeliner.shadeId);
    if (!shade) return;

    const intensity = look.eyeliner.intensity / 100;
    const thicknessRatio = 0.25 + (look.eyeliner.thickness / 10) * 0.75;

    const drawEye = (
      upperIndices: number[],
      outerCornerIdx: number,
      innerCornerIdx: number,
      lowerOuterNeighborIdx: number
    ) => {
      const upperPts = this.getPoints(pts, upperIndices);
      const outerPt = pts[outerCornerIdx];
      const innerPt = pts[innerCornerIdx];
      const lowerNeighbor = pts[lowerOuterNeighborIdx];

      const eyeWidth = Math.hypot(outerPt.x - innerPt.x, outerPt.y - innerPt.y);
      const baseStroke = Math.max(1.4, eyeWidth * 0.068 * thicknessRatio);

      const dxLower = outerPt.x - lowerNeighbor.x;
      const dyLower = outerPt.y - lowerNeighbor.y;
      const wingLen = eyeWidth * (0.24 + (look.eyeliner.thickness / 10) * 0.22);
      const wingAngle = Math.atan2(dyLower - eyeWidth * 0.14, dxLower);
      const wingTip: Point2D = {
        x: outerPt.x + Math.cos(wingAngle) * wingLen,
        y: outerPt.y + Math.sin(wingAngle) * wingLen,
      };

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = shade.hex;
      ctx.fillStyle = shade.hex;

      if (look.eyeliner.style === 'Smudged Kohl') {
        ctx.filter = `blur(${Math.max(1.5, baseStroke * 0.9).toFixed(1)}px)`;
        ctx.globalAlpha = intensity * 0.65;
        ctx.lineWidth = baseStroke * 2.1;
        ctx.beginPath();
        this.drawSmoothOpenPath(ctx, upperPts);
        ctx.stroke();

        ctx.filter = `blur(${Math.max(0.6, baseStroke * 0.25).toFixed(1)}px)`;
        ctx.globalAlpha = intensity * 0.85;
        ctx.lineWidth = baseStroke * 1.15;
        ctx.beginPath();
        this.drawSmoothOpenPath(ctx, upperPts);
        ctx.stroke();
      } else {
        ctx.filter = 'blur(0.5px)';
        ctx.globalAlpha = intensity * 0.92;
        ctx.lineWidth =
          look.eyeliner.style === 'Tightline' ? baseStroke * 0.82 : baseStroke * 1.12;
        ctx.beginPath();
        this.drawSmoothOpenPath(ctx, upperPts);
        ctx.stroke();

        if (look.eyeliner.style === 'Classic Wing') {
          const anchorUpper = upperPts[1] ?? outerPt;
          ctx.beginPath();
          ctx.moveTo(anchorUpper.x, anchorUpper.y - baseStroke * 0.45);
          ctx.quadraticCurveTo(
            outerPt.x + (wingTip.x - outerPt.x) * 0.35,
            outerPt.y + (wingTip.y - outerPt.y) * 0.3 - baseStroke * 0.2,
            wingTip.x,
            wingTip.y
          );
          ctx.lineTo(outerPt.x, outerPt.y + baseStroke * 0.3);
          ctx.closePath();
          ctx.fill();
        }
      }

      ctx.restore();
    };

    drawEye(LANDMARK_INDICES.LEFT_UPPER_LASH, 33, 133, 7);
    drawEye([...LANDMARK_INDICES.RIGHT_UPPER_LASH].reverse(), 263, 362, 249);
  }

  private drawLipstick(
    ctx: CanvasRenderingContext2D,
    pts: Point2D[],
    look: MakeupLookState,
    w: number
  ) {
    const shade = getShadeById(look.lipstick.shadeId);
    if (!shade) return;

    const outerLip = this.getPoints(pts, LANDMARK_INDICES.OUTER_LIP);
    const innerLip = this.getPoints(pts, LANDMARK_INDICES.INNER_LIP);
    const mouthWidth = Math.hypot(pts[291].x - pts[61].x, pts[291].y - pts[61].y);
    const intensity = look.lipstick.intensity / 100;

    this.layerCtx.clearRect(0, 0, w, this.layerCanvas.height);
    this.layerCtx.save();
    this.layerCtx.filter = `blur(${Math.max(1.0, mouthWidth * 0.016).toFixed(1)}px)`;
    this.layerCtx.beginPath();
    this.drawSmoothClosedPath(this.layerCtx, outerLip);
    this.drawSmoothClosedPath(this.layerCtx, innerLip);
    this.layerCtx.fillStyle = shade.hex;
    this.layerCtx.fill('evenodd');
    this.layerCtx.restore();

    ctx.save();

    if (look.lipstick.finish === 'Matte') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = intensity * 0.72;
      ctx.drawImage(this.layerCanvas, 0, 0);

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = intensity * 0.56;
      ctx.drawImage(this.layerCanvas, 0, 0);
    } else if (look.lipstick.finish === 'Satin') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = intensity * 0.62;
      ctx.drawImage(this.layerCanvas, 0, 0);

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = intensity * 0.45;
      ctx.drawImage(this.layerCanvas, 0, 0);

      this.drawLipSheen(ctx, pts, mouthWidth, intensity * 0.24, false);
    } else {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = intensity * 0.46;
      ctx.drawImage(this.layerCanvas, 0, 0);

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = intensity * 0.34;
      ctx.drawImage(this.layerCanvas, 0, 0);

      this.drawLipSheen(ctx, pts, mouthWidth, intensity * 0.48, true);
    }

    ctx.restore();
  }

  private drawLipSheen(
    ctx: CanvasRenderingContext2D,
    pts: Point2D[],
    mouthWidth: number,
    opacity: number,
    isGloss: boolean
  ) {
    const lowerCenter: Point2D = {
      x: (pts[14].x + pts[17].x) / 2,
      y: (pts[14].y + pts[17].y) / 2,
    };

    ctx.save();
    ctx.beginPath();
    this.drawSmoothClosedPath(ctx, this.getPoints(pts, LANDMARK_INDICES.OUTER_LIP));
    this.drawSmoothClosedPath(ctx, this.getPoints(pts, LANDMARK_INDICES.INNER_LIP));
    ctx.clip('evenodd');

    ctx.globalCompositeOperation = 'screen';
    const rx = mouthWidth * (isGloss ? 0.24 : 0.28);
    const ry = mouthWidth * (isGloss ? 0.065 : 0.08);
    const grad = ctx.createRadialGradient(
      lowerCenter.x,
      lowerCenter.y,
      0,
      lowerCenter.x,
      lowerCenter.y,
      rx
    );
    grad.addColorStop(0, `rgba(255, 250, 248, ${opacity})`);
    grad.addColorStop(0.6, `rgba(255, 244, 244, ${opacity * 0.45})`);
    grad.addColorStop(1, 'rgba(255, 244, 244, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(lowerCenter.x, lowerCenter.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isGloss) {
      const bowLeft = pts[37];
      const bowRight = pts[267];
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.65})`;
      ctx.filter = 'blur(1px)';
      ctx.beginPath();
      ctx.ellipse(
        lowerCenter.x - mouthWidth * 0.09,
        lowerCenter.y - mouthWidth * 0.01,
        mouthWidth * 0.05,
        mouthWidth * 0.016,
        -0.1,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        lowerCenter.x + mouthWidth * 0.08,
        lowerCenter.y - mouthWidth * 0.008,
        mouthWidth * 0.035,
        mouthWidth * 0.014,
        0.1,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.fillStyle = `rgba(255, 252, 250, ${opacity * 0.35})`;
      ctx.beginPath();
      ctx.arc(bowLeft.x, bowLeft.y + 1, mouthWidth * 0.025, 0, Math.PI * 2);
      ctx.arc(bowRight.x, bowRight.y + 1, mouthWidth * 0.025, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
