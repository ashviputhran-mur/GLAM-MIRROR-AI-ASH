import React, { useState } from 'react';
import { ArrowRight, Camera, Layers, PanelRightOpen, Play, Sparkles, UserCheck } from 'lucide-react';
import {
  COSMETIC_BRANDS,
  SHOWCASE_PRODUCT_IMAGE,
  type AiConsultationRecord,
  type MakeupLookState,
  type MakeupShade,
  type StudioModel,
} from '../data/makeupCatalog';
import type { AiAnalysisResult } from './AiConsultationSection';
import type { SavedLookSnapshot } from './LookbookDrawer';
import { ExpertBeautyTips } from './ExpertBeautyTips';

interface HomePageProps {
  models: StudioModel[];
  shades: MakeupShade[];
  savedLooksCount: number;
  ordersCount: number;
  latestConsultation: AiConsultationRecord | null;
  latestAiResult: AiAnalysisResult | null;
  selectedModel: StudioModel;
  activeLook: MakeupLookState;
  savedLooks: SavedLookSnapshot[];
  onNavigateUserStudio: (initialSource?: 'model' | 'camera', modelId?: string) => void;
  onNavigateAdmin: () => void;
  onJumpToSection?: (sectionId: string) => void;
  onOpenQuickStart?: () => void;
}

const ONE_PAGE_SECTIONS = [
  { id: 'studio', label: '01 · Mirror Studio' },
  { id: 'ai-consultation', label: '02 · AI Shade Match' },
  { id: 'advanced-skin-profile', label: '03 · Skin Profile & Hydration' },
  { id: 'collection', label: '04 · 63-Product Catalog' },
  { id: 'weekly-challenges', label: '05 · Weekly Challenges' },
  { id: 'glam-rewards', label: '06 · Glam Rewards' },
  { id: 'user-account', label: '07 · Saved Photos & Orders' },
  { id: 'admin-console', label: '08 · Admin & Brand Shoots' },
];

export const HomePage: React.FC<HomePageProps> = ({
  models,
  shades,
  savedLooksCount,
  ordersCount,
  latestConsultation,
  latestAiResult,
  selectedModel,
  activeLook,
  savedLooks,
  onNavigateUserStudio,
  onNavigateAdmin,
  onJumpToSection,
  onOpenQuickStart,
}) => {
  const [isTipsDrawerOpen, setIsTipsDrawerOpen] = useState(false);
  const featuredModel = models[0];
  const featuredShades = shades.filter((s) =>
    ['lip-rosewood', 'lip-bordeaux', 'blush-rose', 'shd-bronze'].includes(s.id)
  );

  return (
    <div className="flex flex-col">
      {/* Editorial Hero Split */}
      <section className="pt-10 pb-16 border-b border-[#191615]/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between gap-8 py-4">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2 text-xs font-medium text-[#8B2635]">
                <span>Real-Time Virtual Try-On Atelier</span>
                <span aria-hidden="true">·</span>
                <span>468-Point Facial Tracking</span>
              </div>

              <h1
                className="font-display font-semibold text-[#191615] tracking-tight leading-[1.05] text-balance"
                style={{ fontSize: 'clamp(2.5rem, 4.2vw, 3.85rem)' }}
              >
                True-to-Skin Virtual Makeup Built for Live Light
              </h1>

              <p className="text-base text-[#5C534E] leading-relaxed max-w-xl">
                Test lipstick, foundation, eyeliner, kajal, eyeshadow, blush, and highlighter in real time on your camera feed, across female and male studio models, or on your own uploaded portrait.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateUserStudio('model')}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#191615] hover:bg-[#2F2A28] text-[#FAF8F6] text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Enter User Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateUserStudio('camera')}
                  className="inline-flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-[#F3EFEA] text-[#191615] border border-[#191615]/15 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Test on Live Camera</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-5">
                {onOpenQuickStart && (
                  <button
                    type="button"
                    onClick={onOpenQuickStart}
                    className="inline-flex items-center gap-2 text-xs font-medium text-[#8B2635] hover:text-[#6E1D2A] transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch Quick Start Video Tour (0:14)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsTipsDrawerOpen(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#191615] hover:text-[#8B2635] transition-colors cursor-pointer"
                >
                  <PanelRightOpen className="w-3.5 h-3.5" />
                  <span>Open Expert Beauty Tips Sidebar</span>
                </button>
              </div>
            </div>

            {/* Live Full-Stack Proof Strip */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-[#191615]/10">
              <div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-[#191615]">
                  {shades.length}
                </div>
                <div className="text-xs text-[#6E6560] mt-0.5">
                  Active Shades Across 4 Brands
                </div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-[#191615]">
                  {models.length}
                </div>
                <div className="text-xs text-[#6E6560] mt-0.5">
                  Female &amp; Male Studio Models
                </div>
              </div>
              <div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-[#191615]">
                  {savedLooksCount + ordersCount}
                </div>
                <div className="text-xs text-[#6E6560] mt-0.5">
                  Studio Captures &amp; Orders
                </div>
              </div>
            </div>
          </div>

          {/* Dominant Visual Focal Anchor */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
            {featuredModel && (
              <div className="sm:col-span-8 relative rounded-xl overflow-hidden bg-[#EFEAE4] border border-[#191615]/10 min-h-[420px]">
                <img
                  src={featuredModel.imageUrl}
                  alt={`${featuredModel.name} — ${featuredModel.complexion}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#191615]/80 via-[#191615]/35 to-transparent text-[#FAF8F6]">
                  <div className="text-xs opacity-85">
                    Featured Shoot Profile · {featuredModel.complexion} · {featuredModel.faceShape} Face
                  </div>
                  <div className="flex items-center justify-between gap-4 mt-1">
                    <span className="font-display text-2xl font-semibold">
                      {featuredModel.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigateUserStudio('model', featuredModel.id)}
                      className="px-3.5 py-1.5 bg-[#FAF8F6] text-[#191615] text-xs font-medium rounded-md hover:bg-[#EFEAE4] transition-colors cursor-pointer"
                    >
                      Try Makeup on Model
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="sm:col-span-4 flex flex-col justify-between gap-3">
              <div className="bg-white rounded-xl border border-[#191615]/10 p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-[#191615]">
                    Quick Shade Preview
                  </div>
                  <p className="text-xs text-[#6E6560] mt-1">
                    Tap any signature pigment to open it live in User Studio.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 my-4">
                  {featuredShades.map((shade) => (
                    <button
                      key={shade.id}
                      type="button"
                      onClick={() => onNavigateUserStudio('model', featuredModel?.id)}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-[#FAF8F6] hover:bg-[#F3EFEA] border border-[#191615]/8 text-left transition-colors cursor-pointer"
                    >
                      <span
                        className="w-5 h-5 rounded-full shrink-0 border border-[#191615]/15"
                        style={{ backgroundColor: shade.hex }}
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-[#191615] truncate">
                          {shade.name}
                        </div>
                        <div className="text-[10px] text-[#6E6560] truncate">
                          {shade.brand}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onNavigateAdmin}
                  className="text-xs font-medium text-[#8B2635] hover:text-[#6E1D2A] text-left cursor-pointer"
                >
                  Manage Catalog in Admin →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* All-In-One Page Section Jump Strip */}
        {onJumpToSection && (
          <div className="mt-10 pt-6 border-t border-[#191615]/10 flex flex-wrap items-center gap-2">
            {ONE_PAGE_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => onJumpToSection(sec.id)}
                className="px-3.5 py-2 bg-white hover:bg-[#EFEAE4] border border-[#191615]/10 rounded-lg text-xs font-medium text-[#191615] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {sec.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Editorial Content + Sticky Interactive Expert Beauty Tips Sidebar */}
      <div className="py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 flex flex-col gap-14">
          {/* Numbered Platform Architecture */}
          <section className="pb-14 border-b border-[#191615]/10">
            <div className="mb-8">
              <span className="text-xs font-medium text-[#8B2635]">
                Full-Stack Atelier Architecture
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#191615] mt-1.5 text-balance">
                From Real-Time Try-On to Brand Inventory Control
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-[#191615]/10 p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-[#6E6560]">
                  <span className="font-mono">01</span>
                  <UserCheck className="w-4 h-4 text-[#191615]" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-[#191615]">
                  Model &amp; Custom Portraits
                </h3>
                <p className="text-sm text-[#5C534E] leading-relaxed">
                  Switch between diverse female and male studio models by skin tone and face shape, connect a live webcam, or upload your own photo.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[#191615]/10 p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-[#6E6560]">
                  <span className="font-mono">02</span>
                  <Layers className="w-4 h-4 text-[#191615]" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-[#191615]">
                  Seven Glam Categories
                </h3>
                <p className="text-sm text-[#5C534E] leading-relaxed">
                  Layer foundation, lipstick, eyeliner, kajal, eyeshadow, blush, and highlighter with realistic matte, satin, gloss, and shimmer physics.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[#191615]/10 p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-[#6E6560]">
                  <span className="font-mono">03</span>
                  <Sparkles className="w-4 h-4 text-[#8B2635]" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-[#191615]">
                  AI Shade Consultation
                </h3>
                <p className="text-sm text-[#5C534E] leading-relaxed">
                  Server-side Gemini vision analyzes skin depth, undertone, and features to recommend and apply an instant seven-piece shade recipe.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-[#191615]/10 p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-[#6E6560]">
                  <span className="font-mono">04</span>
                  <Camera className="w-4 h-4 text-[#191615]" />
                </div>
                <h3 className="font-display text-2xl font-semibold text-[#191615]">
                  Photo Studio &amp; Admin
                </h3>
                <p className="text-sm text-[#5C534E] leading-relaxed">
                  Capture and download glamour portraits, compare before/after looks, place Vanity Bag orders, and manage shades and models in Admin.
                </p>
              </div>
            </div>
          </section>

          {/* Cosmetic Houses & Dual Entry Section */}
          <section>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
              <div className="xl:col-span-5 rounded-xl overflow-hidden bg-[#EFEAE4] border border-[#191615]/10 aspect-[4/3] xl:aspect-auto xl:min-h-[340px]">
                <img
                  src={SHOWCASE_PRODUCT_IMAGE}
                  alt="Luxury cosmetics on travertine stone slab"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="xl:col-span-7 flex flex-col justify-between gap-6 py-1">
                <div>
                  <span className="text-xs font-medium text-[#8B2635]">
                    Four Curated Cosmetic Houses
                  </span>
                  <h2 className="font-display text-3xl font-semibold text-[#191615] mt-1.5 text-balance">
                    Unified Experience for Shoppers &amp; Brand Merchandisers
                  </h2>
                  <p className="text-sm text-[#5C534E] mt-3 leading-relaxed">
                    Every product added or repriced inside the Admin Console propagates immediately to the User Studio mirror and Product Collection.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    {COSMETIC_BRANDS.map((brand) => {
                      const count = shades.filter((s) => s.brand === brand).length;
                      return (
                        <div
                          key={brand}
                          className="p-3.5 rounded-lg bg-white border border-[#191615]/10"
                        >
                          <div className="text-sm font-semibold text-[#191615]">
                            {brand}
                          </div>
                          <div className="text-xs font-mono tabular-nums text-[#6E6560] mt-0.5">
                            {count} active shades
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigateUserStudio('model')}
                    className="px-5 py-3 bg-[#8B2635] hover:bg-[#6E1D2A] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Launch User Studio
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateAdmin}
                    className="px-5 py-3 bg-white hover:bg-[#F3EFEA] text-[#191615] border border-[#191615]/15 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    Open Admin Console
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Docked Sticky Interactive Sidebar Column */}
        <div className="lg:col-span-4">
          <ExpertBeautyTips
            latestConsultation={latestConsultation}
            latestAiResult={latestAiResult}
            selectedModel={selectedModel}
            activeLook={activeLook}
            savedLooks={savedLooks}
            onOpenUserStudio={() => onNavigateUserStudio('model')}
            isDrawerOpen={isTipsDrawerOpen}
            onOpenDrawer={() => setIsTipsDrawerOpen(true)}
            onCloseDrawer={() => setIsTipsDrawerOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};
