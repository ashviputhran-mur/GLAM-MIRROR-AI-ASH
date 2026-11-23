import React from 'react';
import { Download, Share2 } from 'lucide-react';
import type {
  AiConsultationRecord,
  ClaimedChallengeEntry,
  EditorialPreset,
  LightingMode,
  MakeupCategory,
  MakeupLookState,
  MakeupShade,
  MuaKitProduct,
  RedeemedRewardEntry,
  StudioModel,
  UserOrder,
  WaterIntakeEntry,
  WeeklyChallengeId,
} from '../data/makeupCatalog';
import {
  MirrorViewport,
  type MirrorSourceMode,
} from './MirrorViewport';
import { AtelierControls, type AtelierTab } from './AtelierControls';
import {
  AiConsultationSection,
  type AiAnalysisResult,
} from './AiConsultationSection';
import { AdvancedSkinProfile } from './AdvancedSkinProfile';
import { WeeklyBeautyChallenges } from './WeeklyBeautyChallenges';
import { GlamRewardsSection } from './GlamRewardsSection';
import { CollectionSection } from './CollectionSection';
import type { SavedLookSnapshot } from './LookbookDrawer';

interface UserPageProps {
  models: StudioModel[];
  shades: MakeupShade[];
  consultations: AiConsultationRecord[];
  waterIntakeLogs: WaterIntakeEntry[];
  onLogWaterIntake: (payload: {
    date: string;
    glasses: number;
    ml: number;
    note?: string;
  }) => Promise<void>;
  sourceMode: MirrorSourceMode;
  onSourceModeChange: (mode: MirrorSourceMode) => void;
  selectedModel: StudioModel;
  onSelectModel: (model: StudioModel) => void;
  lighting: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
  look: MakeupLookState;
  onUpdateLook: (updater: (prev: MakeupLookState) => MakeupLookState) => void;
  activeTab: AtelierTab;
  onTabChange: (tab: AtelierTab) => void;
  onApplyPreset: (preset: EditorialPreset) => void;
  onResetLook: () => void;
  onAddActiveLookToBag: () => void;
  onCaptureLook: (dataUrl: string, modelLabel: string) => void;
  onRunAiAnalysis: (bareImageBase64: string) => void;
  isAnalyzingAi: boolean;
  occasion: string;
  onOccasionChange: (val: string) => void;
  aiError: string | null;
  aiResult: AiAnalysisResult | null;
  onApplyAiRecommendation: (result: AiAnalysisResult) => void;
  onTryShadeInMirror: (shade: MakeupShade) => void;
  onAddSingleShadeToBag: (shade: MakeupShade) => void;
  selectedKitIds: string[];
  onToggleKitItem: (kitId: string) => void;
  onAddKitProductToBag: (product: MuaKitProduct) => void;
  snapshots: SavedLookSnapshot[];
  orders: UserOrder[];
  redeemedRewards: RedeemedRewardEntry[];
  challengeCheckIns: Record<string, string[]>;
  claimedChallenges: ClaimedChallengeEntry[];
  onCheckInChallenge: (
    challengeId: WeeklyChallengeId,
    action?: 'add' | 'undo'
  ) => Promise<void>;
  onClaimChallenge: (challengeId: WeeklyChallengeId) => Promise<void>;
  onResetChallenges: () => Promise<void>;
  onRedeemReward: (payload: {
    id: string;
    title: string;
    cost: number;
    codePrefix: string;
  }) => Promise<void>;
  onClearRedeemedRewards: () => Promise<void>;
  onApplySavedLook: (look: MakeupLookState) => void;
  onShareSnapshot: (snapshotId: string) => void;
}

export const UserPage: React.FC<UserPageProps> = ({
  models,
  shades,
  consultations,
  waterIntakeLogs,
  onLogWaterIntake,
  sourceMode,
  onSourceModeChange,
  selectedModel,
  onSelectModel,
  lighting,
  onLightingChange,
  look,
  onUpdateLook,
  activeTab,
  onTabChange,
  onApplyPreset,
  onResetLook,
  onAddActiveLookToBag,
  onCaptureLook,
  onRunAiAnalysis,
  isAnalyzingAi,
  occasion,
  onOccasionChange,
  aiError,
  aiResult,
  onApplyAiRecommendation,
  onTryShadeInMirror,
  onAddSingleShadeToBag,
  selectedKitIds,
  onToggleKitItem,
  onAddKitProductToBag,
  snapshots,
  orders,
  redeemedRewards,
  challengeCheckIns,
  claimedChallenges,
  onCheckInChallenge,
  onClaimChallenge,
  onResetChallenges,
  onRedeemReward,
  onClearRedeemedRewards,
  onApplySavedLook,
  onShareSnapshot,
}) => {
  const handleDownloadSnapshot = (snap: SavedLookSnapshot) => {
    const link = document.createElement('a');
    link.href = snap.imageUrl;
    link.download = `glam-mirror-${snap.id}.jpg`;
    link.click();
  };

  return (
    <div>
      {/* Main Studio Try-On Workspace */}
      <section id="studio" className="pt-8 pb-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <div className="text-xs font-medium text-[#8B2635]">
              User Studio · Interactive Try-On
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#191615] tracking-tight text-balance mt-1">
              Virtual Makeup &amp; Photo Studio
            </h1>
            <p className="text-sm sm:text-base text-[#5C534E] mt-2.5 leading-relaxed">
              Test lipstick, foundation, eyeliner, kajal, eyeshadow, blush, and highlighter across female and male models, custom uploads, or live camera.
            </p>
          </div>
          {sourceMode !== 'camera' && (
            <button
              type="button"
              onClick={() => onSourceModeChange('camera')}
              className="self-start md:self-auto px-4 py-2.5 bg-[#8B2635] hover:bg-[#6E1D2A] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Enable Live Camera Try-On
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <MirrorViewport
              models={models}
              look={look}
              lighting={lighting}
              onLightingChange={onLightingChange}
              sourceMode={sourceMode}
              onSourceModeChange={onSourceModeChange}
              selectedModel={selectedModel}
              onSelectModel={onSelectModel}
              onCaptureLook={onCaptureLook}
              onRunAiAnalysis={onRunAiAnalysis}
              isAnalyzingAi={isAnalyzingAi}
            />
          </div>

          <div className="lg:col-span-5">
            <AtelierControls
              shades={shades}
              activeTab={activeTab}
              onTabChange={onTabChange}
              look={look}
              onUpdateLook={onUpdateLook}
              onApplyPreset={onApplyPreset}
              onResetLook={onResetLook}
              onAddActiveLookToBag={onAddActiveLookToBag}
            />
          </div>
        </div>
      </section>

      {/* AI Shade Consultation */}
      <AiConsultationSection
        occasion={occasion}
        onOccasionChange={onOccasionChange}
        isAnalyzing={isAnalyzingAi}
        error={aiError}
        result={aiResult}
        onApplyRecommendation={onApplyAiRecommendation}
      />

      {/* Long-Term AI Skin Health Progression (Recharts) */}
      <AdvancedSkinProfile
        consultations={consultations}
        waterIntakeLogs={waterIntakeLogs}
        onLogWaterIntake={onLogWaterIntake}
        onScrollToMirror={() =>
          document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' })
        }
      />

      {/* Brand & Shade Product Collection */}
      <CollectionSection
        shades={shades}
        selectedKitIds={selectedKitIds}
        onToggleKitItem={onToggleKitItem}
        onAddKitProductToBag={onAddKitProductToBag}
        onTryShadeInMirror={onTryShadeInMirror}
        onAddToBag={onAddSingleShadeToBag}
      />

      {/* Weekly Beauty Challenges & Streak Tracker */}
      <WeeklyBeautyChallenges
        snapshots={snapshots}
        waterIntakeLogs={waterIntakeLogs}
        challengeCheckIns={challengeCheckIns}
        claimedChallenges={claimedChallenges}
        onCheckInChallenge={onCheckInChallenge}
        onClaimChallenge={onClaimChallenge}
        onResetChallenges={onResetChallenges}
        onPracticeInMirror={(category: MakeupCategory) => {
          onTabChange(category);
          document
            .getElementById('studio')
            ?.scrollIntoView({ behavior: 'smooth' });
        }}
        onScrollToHydration={() =>
          document
            .getElementById('advanced-skin-profile')
            ?.scrollIntoView({ behavior: 'smooth' })
        }
        onScrollToRewards={() =>
          document
            .getElementById('glam-rewards')
            ?.scrollIntoView({ behavior: 'smooth' })
        }
      />

      {/* Glam Rewards Program & Tier Progress Visualizer */}
      <GlamRewardsSection
        snapshots={snapshots}
        orders={orders}
        waterIntakeLogs={waterIntakeLogs}
        redeemedRewards={redeemedRewards}
        claimedChallenges={claimedChallenges}
        onRedeemReward={onRedeemReward}
        onClearRedeemedRewards={onClearRedeemedRewards}
        onScrollToStudio={() =>
          document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' })
        }
        onScrollToHydration={() =>
          document
            .getElementById('advanced-skin-profile')
            ?.scrollIntoView({ behavior: 'smooth' })
        }
        onScrollToCollection={() =>
          document
            .getElementById('collection')
            ?.scrollIntoView({ behavior: 'smooth' })
        }
      />

      {/* User Saved Glamour Photos & Order History */}
      <section
        id="user-account"
        className="border-t border-[#191615]/10 py-14 grid grid-cols-1 lg:grid-cols-12 gap-10"
      >
        {/* Saved Photo Studio Shots */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div>
            <span className="text-xs font-medium text-[#8B2635]">
              My Photo Studio
            </span>
            <h2 className="font-display text-3xl font-semibold text-[#191615] mt-1">
              Saved Glamour Shots ({snapshots.length})
            </h2>
          </div>

          {snapshots.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#191615]/10 p-8 text-sm text-[#6E6560]">
              Click <strong className="text-[#191615]">Click Photo</strong> inside the mirror above to save and download your finished looks here.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {snapshots.slice(0, 6).map((snap) => (
                <div
                  key={snap.id}
                  className="bg-white rounded-xl border border-[#191615]/10 overflow-hidden flex flex-col"
                >
                  <img
                    src={snap.imageUrl}
                    alt={snap.modelLabel}
                    className="w-full aspect-[3/4] object-cover"
                  />
                  <div className="p-3 flex flex-col gap-2">
                    <div className="text-xs font-medium text-[#191615] truncate">
                      {snap.modelLabel}
                    </div>
                    <button
                      type="button"
                      onClick={() => onShareSnapshot(snap.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#8B2635] hover:bg-[#6E1D2A] text-[#FAF8F6] text-[11px] font-medium rounded whitespace-nowrap cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Share to Social</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadSnapshot(snap)}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-[#191615] text-[#FAF8F6] text-[11px] font-medium rounded whitespace-nowrap cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => onApplySavedLook(snap.look)}
                        className="py-1.5 px-2 bg-[#F3EFEA] text-[#191615] text-[11px] font-medium rounded whitespace-nowrap cursor-pointer"
                      >
                        Reload
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Order Tracking */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div>
            <span className="text-xs font-medium text-[#8B2635]">
              Order Tracking
            </span>
            <h2 className="font-display text-3xl font-semibold text-[#191615] mt-1">
              Recent Vanity Bag Orders ({orders.length})
            </h2>
          </div>

          <div className="bg-white rounded-xl border border-[#191615]/10 divide-y divide-[#191615]/10">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-medium text-[#191615]">
                      {order.id}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#5C534E]">{order.customerName}</span>
                  </div>
                  <div className="text-xs text-[#6E6560] truncate mt-0.5">
                    {order.items.map((i) => i.name).join(', ')}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono tabular-nums text-sm font-semibold text-[#191615]">
                    ${order.total}
                  </div>
                  <div className="text-[11px] text-[#8B2635] font-medium">
                    {order.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
