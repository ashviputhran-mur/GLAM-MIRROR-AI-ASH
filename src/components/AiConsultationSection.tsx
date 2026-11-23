import React from 'react';
import { RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import {
  getShadeById,
  type BlushFinish,
  type EyelinerStyle,
  type EyeshadowFinish,
  type FoundationFinish,
  type HighlighterFinish,
  type KajalStyle,
  type LipstickFinish,
} from '../data/makeupCatalog';

export interface AiAnalysisResult {
  undertone: string;
  complexionDepth: string;
  faceNotes: string;
  lookTitle: string;
  artistNote: string;
  hydrationScore?: number;
  brightnessScore?: number;
  textureScore?: number;
  foundationId: string;
  foundationFinish: FoundationFinish;
  foundationIntensity: number;
  lipstickId: string;
  lipstickFinish: LipstickFinish;
  lipstickIntensity: number;
  eyelinerId: string;
  eyelinerStyle: EyelinerStyle;
  eyelinerIntensity: number;
  eyelinerThickness: number;
  kajalId: string;
  kajalStyle: KajalStyle;
  kajalIntensity: number;
  eyeshadowId: string;
  eyeshadowFinish: EyeshadowFinish;
  eyeshadowIntensity: number;
  blushId: string;
  blushFinish: BlushFinish;
  blushIntensity: number;
  highlighterId: string;
  highlighterFinish: HighlighterFinish;
  highlighterIntensity: number;
}

interface AiConsultationSectionProps {
  occasion: string;
  onOccasionChange: (val: string) => void;
  isAnalyzing: boolean;
  error: string | null;
  result: AiAnalysisResult | null;
  onApplyRecommendation: (result: AiAnalysisResult) => void;
}

const OCCASION_SUGGESTIONS = [
  'Signature Everyday',
  'Candlelit Evening',
  'Sunlit Editorial',
  'Minimalist Grooming',
];

export const AiConsultationSection: React.FC<AiConsultationSectionProps> = ({
  occasion,
  onOccasionChange,
  isAnalyzing,
  error,
  result,
  onApplyRecommendation,
}) => {
  const recommendedItems = result
    ? [
        {
          category: 'Foundation',
          shade: getShadeById(result.foundationId),
          detail: `${result.foundationFinish} · ${result.foundationIntensity}%`,
        },
        {
          category: 'Lipstick',
          shade: getShadeById(result.lipstickId),
          detail: `${result.lipstickFinish} · ${result.lipstickIntensity}%`,
        },
        {
          category: 'Eyeliner',
          shade: getShadeById(result.eyelinerId),
          detail: `${result.eyelinerStyle} · Weight ${result.eyelinerThickness}`,
        },
        {
          category: 'Kajal',
          shade: getShadeById(result.kajalId),
          detail: `${result.kajalStyle} · ${result.kajalIntensity}%`,
        },
        {
          category: 'Eyeshadow',
          shade: getShadeById(result.eyeshadowId),
          detail: `${result.eyeshadowFinish} · ${result.eyeshadowIntensity}%`,
        },
        {
          category: 'Blush',
          shade: getShadeById(result.blushId),
          detail: `${result.blushFinish} · ${result.blushIntensity}%`,
        },
        {
          category: 'Highlighter',
          shade: getShadeById(result.highlighterId),
          detail: `${result.highlighterFinish} · ${result.highlighterIntensity}%`,
        },
      ]
    : [];

  return (
    <section
      id="ai-consultation"
      className="border-t border-[#191615]/10 py-14"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div>
            <span className="text-xs font-medium text-[#8B2635]">
              Bespoke Colorist Consultation
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#191615] mt-1.5 text-balance">
              AI Undertone &amp; Shade Match
            </h2>
            <p className="text-sm text-[#5C534E] mt-3 leading-relaxed max-w-md">
              Capture a frame from your selected model, custom upload, or live camera using{' '}
              <strong className="font-medium text-[#191615]">AI Shade Match</strong>. Our colorist evaluates skin depth, undertone, and face shape to build a full seven-piece formula.
            </p>
          </div>

          <div>
            <label
              htmlFor="occasion-input"
              className="block text-xs font-medium text-[#5C534E] mb-2"
            >
              Occasion or Shoot Direction
            </label>
            <input
              id="occasion-input"
              type="text"
              value={occasion}
              onChange={(e) => onOccasionChange(e.target.value)}
              placeholder="e.g., Warm autumn dinner, editorial shoot…"
              className="w-full px-3.5 py-2.5 bg-white border border-[#191615]/15 rounded-lg text-sm text-[#191615] placeholder:text-[#9A8F89] focus:outline-none focus:border-[#191615]"
            />
            <div className="flex flex-wrap gap-2 mt-2.5">
              {OCCASION_SUGGESTIONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onOccasionChange(preset)}
                  className={`px-3 py-1.5 text-xs rounded-md border transition-colors cursor-pointer ${
                    occasion === preset
                      ? 'bg-[#191615] text-[#FAF8F6] border-[#191615]'
                      : 'bg-[#F3EFEA] text-[#5C534E] border-transparent hover:border-[#191615]/20'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white rounded-xl border border-[#191615]/10 p-6 sm:p-8">
          {isAnalyzing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <RefreshCw className="w-6 h-6 text-[#8B2635] animate-spin" />
              <p className="font-display text-2xl text-[#191615]">
                Reading Undertone &amp; Facial Structure…
              </p>
              <p className="text-xs text-[#6E6560] max-w-sm">
                Matching foundation, lip pigment, kajal, eyeshadow, blush, and highlighter harmonies.
              </p>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col gap-2">
              <h3 className="font-display text-2xl font-semibold text-[#8B2635]">
                Consultation Interrupted
              </h3>
              <p className="text-sm text-[#5C534E]">{error}</p>
            </div>
          ) : !result ? (
            <div className="py-10 flex flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F3EFEA] flex items-center justify-center text-[#8B2635]">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-[#191615]">
                Ready for Your Complexion Read
              </h3>
              <p className="text-sm text-[#5C534E] max-w-lg leading-relaxed">
                Choose your shoot direction above and click{' '}
                <strong className="font-medium text-[#191615]">AI Shade Match</strong>{' '}
                inside the mirror viewport for a tailored recommendation across all seven categories.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#191615]/10">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#8B2635] font-medium">
                    <span>{result.complexionDepth}</span>
                    <span aria-hidden="true">·</span>
                    <span>{result.undertone}</span>
                  </div>
                  <h3 className="font-display text-3xl font-semibold text-[#191615] mt-1">
                    {result.lookTitle}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => onApplyRecommendation(result)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#8B2635] text-[#FAF8F6] hover:bg-[#6E1D2A] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Apply Look to Mirror
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-[#5C534E] leading-relaxed">
                <div>
                  <div className="text-xs font-semibold text-[#191615] mb-1">
                    Complexion Observation
                  </div>
                  <p>{result.faceNotes}</p>
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#191615] mb-1">
                    Artist Technique
                  </div>
                  <p>{result.artistNote}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {recommendedItems.map(
                  (item) =>
                    item.shade && (
                      <div
                        key={item.category}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#FAF8F6] border border-[#191615]/8"
                      >
                        <span
                          className="w-8 h-8 rounded-full shrink-0 border border-[#191615]/15"
                          style={{ backgroundColor: item.shade.hex }}
                        />
                        <div className="min-w-0">
                          <div className="text-[11px] text-[#6E6560] truncate">
                            {item.category} · {item.shade.brand} · {item.detail}
                          </div>
                          <div className="text-sm font-semibold text-[#191615] truncate">
                            {item.shade.name}
                          </div>
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
