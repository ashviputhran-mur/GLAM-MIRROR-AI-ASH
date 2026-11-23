import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Droplets,
  Maximize2,
  RefreshCw,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import {
  getShadeById,
  type AiConsultationRecord,
  type MakeupLookState,
  type StudioModel,
} from '../data/makeupCatalog';
import type { AiAnalysisResult } from './AiConsultationSection';
import type { SavedLookSnapshot } from './LookbookDrawer';

interface SkincareTipItem {
  step: string;
  timing: string;
  title: string;
  recommendation: string;
  keyIngredient: string;
}

interface MakeupTechniqueItem {
  category: string;
  title: string;
  technique: string;
  whyItWorks: string;
}

interface SeasonalPaletteTipItem {
  trendName: string;
  shadeDirection: string;
  applicationTip: string;
}

export interface ExpertBeautyTipsResponse {
  profileSummary: string;
  headline: string;
  seasonalNote: string;
  skincareRoutine: SkincareTipItem[];
  makeupTechniques: MakeupTechniqueItem[];
  seasonalPaletteTips: SeasonalPaletteTipItem[];
  proPairingNote: string;
  generatedAt: string;
  usedConsultation?: boolean;
}

interface ExpertBeautyTipsProps {
  latestConsultation: AiConsultationRecord | null;
  latestAiResult: AiAnalysisResult | null;
  selectedModel: StudioModel;
  activeLook: MakeupLookState;
  savedLooks: SavedLookSnapshot[];
  onOpenUserStudio: () => void;
  isDrawerOpen: boolean;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
}

const SKIN_TYPES = ['Balanced', 'Dry', 'Oily', 'Combination', 'Sensitive'] as const;
const UNDERTONE_OPTIONS = ['Analyzed', 'Cool', 'Warm', 'Neutral', 'Olive'] as const;
const SEASONAL_TRENDS = [
  'Autumn Velvet',
  'Winter Satin Glow',
  'Spring Glass Skin',
  'Summer Sunlit',
] as const;

type AdviceTab = 'skincare' | 'makeup' | 'seasonal';

export const ExpertBeautyTips: React.FC<ExpertBeautyTipsProps> = ({
  latestConsultation,
  latestAiResult,
  selectedModel,
  activeLook,
  savedLooks,
  onOpenUserStudio,
  isDrawerOpen,
  onOpenDrawer,
  onCloseDrawer,
}) => {
  const [skinType, setSkinType] = useState<(typeof SKIN_TYPES)[number]>('Balanced');
  const [undertoneChoice, setUndertoneChoice] =
    useState<(typeof UNDERTONE_OPTIONS)[number]>('Analyzed');
  const [seasonalTrend, setSeasonalTrend] =
    useState<(typeof SEASONAL_TRENDS)[number]>('Autumn Velvet');
  const [activeTab, setActiveTab] = useState<AdviceTab>('skincare');

  const [tips, setTips] = useState<ExpertBeautyTipsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedSignatureRef = useRef<string | null>(null);

  const skinProfile = useMemo(() => {
    const baseDepth =
      latestAiResult?.complexionDepth ||
      latestConsultation?.complexionDepth ||
      selectedModel.complexion;
    const detectedUndertone =
      latestAiResult?.undertone ||
      latestConsultation?.undertone ||
      selectedModel.undertone;
    const effectiveUndertone =
      undertoneChoice === 'Analyzed' ? detectedUndertone : `${undertoneChoice} Undertone`;

    const sourceLabel = latestAiResult
      ? 'Latest AI Shade Match'
      : latestConsultation
        ? 'Recent AI Analysis'
        : `Active Model · ${selectedModel.name}`;

    const lookTitle =
      latestAiResult?.lookTitle ||
      latestConsultation?.lookTitle ||
      savedLooks[0]?.modelLabel ||
      'Studio Signature';

    return {
      complexionDepth: baseDepth,
      undertone: effectiveUndertone,
      detectedUndertone,
      lookTitle,
      occasion: latestConsultation?.occasion || 'Signature Everyday',
      sourceLabel,
    };
  }, [
    latestAiResult,
    latestConsultation,
    selectedModel,
    savedLooks,
    undertoneChoice,
  ]);

  const recentLookPreferences = useMemo(() => {
    const finishes: string[] = [];
    const activeShades: string[] = [];

    if (activeLook.foundation.enabled) {
      finishes.push(`${activeLook.foundation.finish} Foundation`);
      const s = getShadeById(activeLook.foundation.shadeId);
      if (s) activeShades.push(s.name);
    }
    if (activeLook.lipstick.enabled) {
      finishes.push(`${activeLook.lipstick.finish} Lip`);
      const s = getShadeById(activeLook.lipstick.shadeId);
      if (s) activeShades.push(s.name);
    }
    if (activeLook.eyeliner.enabled) {
      finishes.push(`${activeLook.eyeliner.style} Liner`);
      const s = getShadeById(activeLook.eyeliner.shadeId);
      if (s) activeShades.push(s.name);
    }
    if (activeLook.eyeshadow.enabled) {
      finishes.push(`${activeLook.eyeshadow.finish} Shadow`);
    }
    if (activeLook.blush.enabled) {
      finishes.push(`${activeLook.blush.finish} Blush`);
      const s = getShadeById(activeLook.blush.shadeId);
      if (s) activeShades.push(s.name);
    }
    if (activeLook.highlighter.enabled) {
      finishes.push(`${activeLook.highlighter.finish} Glow`);
    }

    return {
      finishes,
      activeShades,
      savedSnapshotCount: savedLooks.length,
    };
  }, [activeLook, savedLooks.length]);

  const fetchTips = useCallback(
    async (
      targetSkinType: string,
      targetSeason: string,
      targetUndertoneOverride?: string
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const effectiveProfile = {
          ...skinProfile,
          undertone:
            targetUndertoneOverride && targetUndertoneOverride !== 'Analyzed'
              ? `${targetUndertoneOverride} Undertone`
              : skinProfile.detectedUndertone,
        };
        const res = await fetch('/api/beauty-tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            skinType: targetSkinType,
            focusArea: 'Balanced Daily',
            seasonalTrend: targetSeason,
            skinProfile: effectiveProfile,
            recentLookPreferences,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Unable to generate personalized tips.');
        }
        setTips(data as ExpertBeautyTipsResponse);
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to reach AI beauty director.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [skinProfile, recentLookPreferences]
  );

  const profileSignature = `${skinProfile.complexionDepth}|${skinProfile.detectedUndertone}|${skinProfile.lookTitle}|${recentLookPreferences.activeShades.slice(0, 3).join(',')}`;

  useEffect(() => {
    if (lastFetchedSignatureRef.current === profileSignature) return;
    lastFetchedSignatureRef.current = profileSignature;
    fetchTips(skinType, seasonalTrend, undertoneChoice);
  }, [profileSignature, fetchTips, skinType, seasonalTrend, undertoneChoice]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseDrawer();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDrawerOpen, onCloseDrawer]);

  const renderControls = () => (
    <div className="flex flex-col gap-3.5 pb-4 border-b border-[#191615]/10">
      {/* Context Readout */}
      <div className="flex flex-col gap-1 text-xs text-[#6E6560]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-[#191615]">
            {skinProfile.sourceLabel}
          </span>
          <span aria-hidden="true">·</span>
          <span>{skinProfile.complexionDepth}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#8B2635] font-medium">
            {skinProfile.undertone}
          </span>
        </div>
        <div className="truncate">
          Recent Look:{' '}
          <span className="font-medium text-[#191615]">
            {skinProfile.lookTitle}
          </span>
          {recentLookPreferences.finishes.length > 0 &&
            ` · ${recentLookPreferences.finishes.slice(0, 2).join(', ')}`}
        </div>
      </div>

      {/* Undertone Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-[#6E6560]">
          Skin Undertone
        </label>
        <div className="flex flex-wrap gap-1 p-1 bg-[#F3EFEA] rounded-lg">
          {UNDERTONE_OPTIONS.map((tone) => (
            <button
              key={tone}
              type="button"
              onClick={() => {
                setUndertoneChoice(tone);
                fetchTips(skinType, seasonalTrend, tone);
              }}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                undertoneChoice === tone
                  ? 'bg-white text-[#191615] shadow-sm'
                  : 'text-[#5C534E] hover:text-[#191615]'
              }`}
            >
              {tone}
            </button>
          ))}
        </div>
      </div>

      {/* Skin Type Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-[#6E6560]">
          Skin Type
        </label>
        <div className="flex flex-wrap gap-1 p-1 bg-[#F3EFEA] rounded-lg">
          {SKIN_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setSkinType(type);
                fetchTips(type, seasonalTrend, undertoneChoice);
              }}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                skinType === type
                  ? 'bg-white text-[#191615] shadow-sm'
                  : 'text-[#5C534E] hover:text-[#191615]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Seasonal Trend Selector */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="seasonal-trend-select"
          className="text-[11px] font-medium text-[#6E6560]"
        >
          Seasonal Trend Direction
        </label>
        <div className="flex items-center gap-2">
          <select
            id="seasonal-trend-select"
            value={seasonalTrend}
            onChange={(e) => {
              const nextSeason = e.target.value as (typeof SEASONAL_TRENDS)[number];
              setSeasonalTrend(nextSeason);
              fetchTips(skinType, nextSeason, undertoneChoice);
            }}
            className="flex-1 px-3 py-2 bg-[#FAF8F6] border border-[#191615]/15 rounded-lg text-xs font-medium text-[#191615] focus:outline-none focus:border-[#191615] cursor-pointer"
          >
            {SEASONAL_TRENDS.map((season) => (
              <option key={season} value={season}>
                {season}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => fetchTips(skinType, seasonalTrend, undertoneChoice)}
            disabled={isLoading}
            aria-label="Refresh personalized beauty tips"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#8B2635] hover:bg-[#6E1D2A] disabled:opacity-60 text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Updating' : 'Refresh'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Docked Sticky Interactive Sidebar inside HomePage */}
      <aside
        id="expert-beauty-tips"
        aria-label="Expert Beauty Tips Interactive Sidebar"
        className="bg-white rounded-xl border border-[#191615]/10 p-5 sm:p-6 flex flex-col gap-4 lg:sticky lg:top-20"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs font-medium text-[#8B2635]">
              Expert Beauty Tips
            </span>
            <h2 className="font-display text-2xl font-semibold text-[#191615] mt-0.5 leading-tight">
              Personalized Atelier Sidebar
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenDrawer}
            title="Expand full-height sidebar view"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F3EFEA] hover:bg-[#E4DDD5] text-[#191615] text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Expand</span>
          </button>
        </div>

        {renderControls()}

        {/* Compact Sidebar Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-[#F3EFEA] rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('skincare')}
            className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'skincare'
                ? 'bg-white text-[#191615] shadow-sm'
                : 'text-[#5C534E] hover:text-[#191615]'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-[#8B2635]" />
            <span>Skincare</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('makeup')}
            className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'makeup'
                ? 'bg-white text-[#191615] shadow-sm'
                : 'text-[#5C534E] hover:text-[#191615]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8B2635]" />
            <span>Makeup</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seasonal')}
            className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'seasonal'
                ? 'bg-white text-[#191615] shadow-sm'
                : 'text-[#5C534E] hover:text-[#191615]'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-[#8B2635]" />
            <span>Seasonal</span>
          </button>
        </div>

        {/* Advice Content */}
        {isLoading && !tips ? (
          <div className="py-6 space-y-3 animate-pulse">
            <div className="h-4 w-3/4 bg-[#EFEAE4] rounded" />
            <div className="h-16 bg-[#FAF8F6] rounded-lg" />
            <div className="h-16 bg-[#FAF8F6] rounded-lg" />
            <div className="h-16 bg-[#FAF8F6] rounded-lg" />
          </div>
        ) : error ? (
          <div className="py-4 flex flex-col items-start gap-2.5">
            <div className="text-sm font-semibold text-[#8B2635]">
              Unable to Load Advice
            </div>
            <p className="text-xs text-[#5C534E] leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={() => fetchTips(skinType, seasonalTrend, undertoneChoice)}
              className="px-3.5 py-1.5 bg-[#191615] text-[#FAF8F6] text-xs font-medium rounded-md hover:bg-[#2F2A28] transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : tips ? (
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="font-display text-xl font-semibold text-[#191615] leading-snug">
                {tips.headline}
              </h3>
              <p className="text-[11px] text-[#6E6560] mt-1">
                {tips.profileSummary}
              </p>
            </div>

            {activeTab === 'skincare' && (
              <div className="divide-y divide-[#191615]/10">
                {tips.skincareRoutine.map((item, idx) => (
                  <div key={`${item.step}-${idx}`} className="py-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#6E6560]">
                      <span className="font-mono tabular-nums font-medium text-[#8B2635]">
                        {item.step} · {item.timing}
                      </span>
                      <span className="truncate">{item.keyIngredient}</span>
                    </div>
                    <div className="text-sm font-semibold text-[#191615]">
                      {item.title}
                    </div>
                    <p className="text-xs text-[#5C534E] leading-relaxed">
                      {item.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'makeup' && (
              <div className="divide-y divide-[#191615]/10">
                {tips.makeupTechniques.map((tip, idx) => (
                  <div key={`${tip.category}-${idx}`} className="py-3 flex flex-col gap-1">
                    <div className="text-[11px] font-medium text-[#8B2635]">
                      {tip.category}
                    </div>
                    <div className="text-sm font-semibold text-[#191615]">
                      {tip.title}
                    </div>
                    <p className="text-xs text-[#5C534E] leading-relaxed">
                      {tip.technique}
                    </p>
                    <p className="text-[11px] text-[#6E6560]">
                      Suitability: {tip.whyItWorks}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'seasonal' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-[#5C534E] leading-relaxed pt-1">
                  {tips.seasonalNote}
                </p>
                <div className="divide-y divide-[#191615]/10">
                  {tips.seasonalPaletteTips?.map((st, idx) => (
                    <div key={`${st.trendName}-${idx}`} className="py-3 flex flex-col gap-1">
                      <div className="text-[11px] font-medium text-[#8B2635]">
                        {st.trendName}
                      </div>
                      <div className="text-sm font-semibold text-[#191615]">
                        {st.shadeDirection}
                      </div>
                      <p className="text-xs text-[#5C534E] leading-relaxed">
                        {st.applicationTip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#191615]/10 flex flex-col gap-3">
              <p className="text-xs text-[#5C534E] leading-relaxed">
                <strong className="font-medium text-[#191615]">
                  Colorist Note:{' '}
                </strong>
                {tips.proPairingNote}
              </p>

              <button
                type="button"
                onClick={onOpenUserStudio}
                className="inline-flex items-center justify-between w-full px-3.5 py-2.5 bg-[#FAF8F6] hover:bg-[#F3EFEA] border border-[#191615]/10 rounded-lg text-xs font-medium text-[#191615] transition-colors cursor-pointer"
              >
                <span>Apply Advice in User Studio</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8B2635]" />
              </button>
            </div>
          </div>
        ) : null}
      </aside>

      {/* Expanded Full-Height Slide-Over Sidebar Drawer */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="beauty-sidebar-drawer-title"
        >
          <div
            className="fixed inset-0 bg-[#191615]/45 backdrop-blur-xs"
            onClick={onCloseDrawer}
          />
          <div className="relative z-10 w-full max-w-xl bg-[#FAF8F6] h-full shadow-2xl border-l border-[#191615]/10 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#191615]/10">
              <div>
                <span className="text-xs font-medium text-[#8B2635]">
                  Expert Beauty Tips
                </span>
                <h2
                  id="beauty-sidebar-drawer-title"
                  className="font-display text-2xl font-semibold text-[#191615] leading-none mt-1"
                >
                  Full Skin, Makeup &amp; Seasonal Consultation
                </h2>
              </div>
              <button
                type="button"
                onClick={onCloseDrawer}
                aria-label="Close Expert Beauty Tips sidebar"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[#5C534E] hover:text-[#191615] hover:bg-[#EFEAE4] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              <div className="bg-white rounded-xl border border-[#191615]/10 p-5">
                {renderControls()}
              </div>

              {tips ? (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-[#191615]">
                      {tips.headline}
                    </h3>
                    <p className="text-xs text-[#6E6560] mt-1">
                      {tips.profileSummary}
                    </p>
                  </div>

                  {/* Skincare Routine */}
                  <div className="bg-white rounded-xl border border-[#191615]/10 p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#191615] pb-3 border-b border-[#191615]/10">
                      <Droplets className="w-4 h-4 text-[#8B2635]" />
                      <span>Skincare Prep Protocol</span>
                    </div>
                    <div className="divide-y divide-[#191615]/10">
                      {tips.skincareRoutine.map((item, idx) => (
                        <div key={`${item.step}-${idx}`} className="py-3.5 flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs text-[#6E6560]">
                            <span className="font-mono text-[#8B2635] font-medium">
                              {item.step} · {item.timing}
                            </span>
                            <span>Active: {item.keyIngredient}</span>
                          </div>
                          <div className="text-sm font-semibold text-[#191615]">
                            {item.title}
                          </div>
                          <p className="text-xs text-[#5C534E] leading-relaxed">
                            {item.recommendation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Makeup Techniques */}
                  <div className="bg-white rounded-xl border border-[#191615]/10 p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#191615] pb-3 border-b border-[#191615]/10">
                      <Sparkles className="w-4 h-4 text-[#8B2635]" />
                      <span>Tailored Makeup Techniques</span>
                    </div>
                    <div className="divide-y divide-[#191615]/10">
                      {tips.makeupTechniques.map((tip, idx) => (
                        <div key={`${tip.category}-${idx}`} className="py-3.5 flex flex-col gap-1">
                          <div className="text-xs font-medium text-[#8B2635]">
                            {tip.category}
                          </div>
                          <div className="text-sm font-semibold text-[#191615]">
                            {tip.title}
                          </div>
                          <p className="text-xs text-[#5C534E] leading-relaxed">
                            {tip.technique}
                          </p>
                          <p className="text-[11px] text-[#6E6560]">
                            Why it works: {tip.whyItWorks}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seasonal Trends */}
                  <div className="bg-white rounded-xl border border-[#191615]/10 p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#191615] pb-3 border-b border-[#191615]/10">
                      <Sun className="w-4 h-4 text-[#8B2635]" />
                      <span>{seasonalTrend} · Undertone Adaptation</span>
                    </div>
                    <p className="text-xs text-[#5C534E] leading-relaxed py-3">
                      {tips.seasonalNote}
                    </p>
                    <div className="divide-y divide-[#191615]/10">
                      {tips.seasonalPaletteTips?.map((st, idx) => (
                        <div key={`${st.trendName}-${idx}`} className="py-3 flex flex-col gap-1">
                          <div className="text-xs font-medium text-[#8B2635]">
                            {st.trendName}
                          </div>
                          <div className="text-sm font-semibold text-[#191615]">
                            {st.shadeDirection}
                          </div>
                          <p className="text-xs text-[#5C534E] leading-relaxed">
                            {st.applicationTip}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="px-6 py-4 bg-white border-t border-[#191615]/10 flex items-center justify-between gap-4">
              <span className="text-xs text-[#6E6560]">
                {tips?.proPairingNote || 'Ready to test shades in the live mirror.'}
              </span>
              <button
                type="button"
                onClick={() => {
                  onCloseDrawer();
                  onOpenUserStudio();
                }}
                className="px-4 py-2 bg-[#191615] hover:bg-[#2F2A28] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open User Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
