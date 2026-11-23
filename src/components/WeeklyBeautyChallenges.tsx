import React, { useMemo, useState } from 'react';
import { Award, Check, Flame, RotateCcw } from 'lucide-react';
import {
  WEEKLY_CHALLENGES,
  type ClaimedChallengeEntry,
  type MakeupCategory,
  type WaterIntakeEntry,
  type WeeklyChallengeId,
} from '../data/makeupCatalog';
import type { SavedLookSnapshot } from './LookbookDrawer';

interface WeeklyBeautyChallengesProps {
  snapshots: SavedLookSnapshot[];
  waterIntakeLogs: WaterIntakeEntry[];
  challengeCheckIns: Record<string, string[]>;
  claimedChallenges: ClaimedChallengeEntry[];
  onCheckInChallenge: (
    challengeId: WeeklyChallengeId,
    action?: 'add' | 'undo'
  ) => Promise<void>;
  onClaimChallenge: (challengeId: WeeklyChallengeId) => Promise<void>;
  onResetChallenges: () => Promise<void>;
  onPracticeInMirror: (category: MakeupCategory) => void;
  onScrollToHydration: () => void;
  onScrollToRewards: () => void;
}

export const WeeklyBeautyChallenges: React.FC<WeeklyBeautyChallengesProps> = ({
  snapshots,
  waterIntakeLogs,
  challengeCheckIns,
  claimedChallenges,
  onCheckInChallenge,
  onClaimChallenge,
  onResetChallenges,
  onPracticeInMirror,
  onScrollToHydration,
  onScrollToRewards,
}) => {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const challengeRows = useMemo(() => {
    return WEEKLY_CHALLENGES.map((def) => {
      let autoCount = 0;
      let autoSourceLabel = '';

      if (def.id === 'perfect-base-week') {
        autoCount = snapshots.filter((s) => s.look.foundation?.enabled).length;
        autoSourceLabel = `${autoCount} saved base ${autoCount === 1 ? 'look' : 'looks'}`;
      } else if (def.id === 'eyeliner-mastery') {
        autoCount = snapshots.filter(
          (s) => s.look.eyeliner?.enabled || s.look.kajal?.enabled
        ).length;
        autoSourceLabel = `${autoCount} saved eye ${autoCount === 1 ? 'look' : 'looks'}`;
      } else if (def.id === 'glass-skin-hydration') {
        autoCount = waterIntakeLogs.filter((w) => w.ml >= 2000).length;
        autoSourceLabel = `${autoCount} logged 2L+ ${autoCount === 1 ? 'day' : 'days'}`;
      } else if (def.id === 'editorial-full-face') {
        autoCount = snapshots.filter((s) => {
          const activeLayers = [
            s.look.lipstick?.enabled,
            s.look.eyeshadow?.enabled,
            s.look.blush?.enabled,
            s.look.highlighter?.enabled,
          ].filter(Boolean).length;
          return activeLayers >= 3;
        }).length;
        autoSourceLabel = `${autoCount} multi-layer ${autoCount === 1 ? 'look' : 'looks'}`;
      }

      const manualList = challengeCheckIns[def.id] || [];
      const manualCount = manualList.length;
      const rawTotal = autoCount + manualCount;
      const progressCount = Math.min(def.targetCount, rawTotal);
      const progressPct = Math.round((progressCount / def.targetCount) * 100);
      const isComplete = rawTotal >= def.targetCount;
      const claimed = claimedChallenges.find((c) => c.challengeId === def.id);

      return {
        def,
        autoCount,
        manualCount,
        autoSourceLabel,
        progressCount,
        progressPct,
        isComplete,
        claimed,
      };
    });
  }, [snapshots, waterIntakeLogs, challengeCheckIns, claimedChallenges]);

  const totalBonusEarned = claimedChallenges.reduce(
    (sum, c) => sum + c.bonusPoints,
    0
  );
  const completedCount = challengeRows.filter((r) => r.isComplete).length;
  const readyToClaimCount = challengeRows.filter(
    (r) => r.isComplete && !r.claimed
  ).length;

  const handleCheckIn = async (
    challengeId: WeeklyChallengeId,
    action: 'add' | 'undo' = 'add'
  ) => {
    if (busyId) return;
    setBusyId(`${challengeId}-${action}`);
    try {
      await onCheckInChallenge(challengeId, action);
    } finally {
      setBusyId(null);
    }
  };

  const handleClaim = async (challengeId: WeeklyChallengeId) => {
    if (busyId) return;
    setBusyId(`claim-${challengeId}`);
    try {
      await onClaimChallenge(challengeId);
    } finally {
      setBusyId(null);
    }
  };

  const handleReset = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      await onResetChallenges();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <section
      id="weekly-challenges"
      className="border-t border-[#191615]/10 py-14 flex flex-col gap-8"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#8B2635]">
            <span>Weekly Streak Challenges</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              +470 Glam Points Available
            </span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#191615] mt-1">
            Weekly Beauty Challenges
          </h2>
          <p className="text-sm text-[#5C534E] mt-2 max-w-2xl leading-relaxed">
            Build consistent studio habits across complexion, precision eye work, hydration, and full-face capsules. Complete any weekly streak to unlock bonus Glam Points toward your membership tier.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 bg-white border border-[#191615]/10 rounded-xl px-5 py-3.5 shrink-0">
          <div>
            <div className="text-[11px] text-[#6E6560]">Streak Bonus Earned</div>
            <div className="font-mono tabular-nums text-2xl font-semibold text-[#191615]">
              +{totalBonusEarned.toLocaleString()}{' '}
              <span className="text-xs font-normal text-[#6E6560]">pts</span>
            </div>
          </div>
          <div className="h-8 w-px bg-[#191615]/10" />
          <div>
            <div className="text-[11px] text-[#6E6560]">Streaks Completed</div>
            <div className="font-mono tabular-nums text-sm font-semibold text-[#191615]">
              {completedCount} / {WEEKLY_CHALLENGES.length}
              {readyToClaimCount > 0 && (
                <span className="text-[#8B2635] ml-1.5 font-sans">
                  ({readyToClaimCount} ready to claim)
                </span>
              )}
            </div>
          </div>
          <div className="h-8 w-px bg-[#191615]/10 hidden sm:block" />
          <button
            type="button"
            onClick={onScrollToRewards}
            className="text-xs font-medium text-[#8B2635] hover:text-[#6E1D2A] whitespace-nowrap shrink-0 cursor-pointer"
          >
            View Glam Rewards ↓
          </button>
        </div>
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challengeRows.map(
          ({
            def,
            autoSourceLabel,
            manualCount,
            progressCount,
            progressPct,
            isComplete,
            claimed,
          }) => {
            const isAdding = busyId === `${def.id}-add`;
            const isUndoing = busyId === `${def.id}-undo`;
            const isClaiming = busyId === `claim-${def.id}`;

            return (
              <div
                key={def.id}
                className="bg-white rounded-xl border border-[#191615]/10 p-6 flex flex-col justify-between gap-5"
              >
                <div className="flex flex-col gap-4">
                  {/* Top Title & Counter */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#6E6560]">
                        <span className="font-medium text-[#191615]">
                          {def.subtitle}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums font-semibold text-[#8B2635]">
                          +{def.bonusPoints} Glam Points
                        </span>
                      </div>
                      <h3 className="font-display text-2xl font-semibold text-[#191615] mt-1">
                        {def.title}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono tabular-nums text-xl font-semibold text-[#191615]">
                        {progressCount} / {def.targetCount}
                      </div>
                      <div className="text-[11px] text-[#6E6560]">
                        {def.unitLabel}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#5C534E] leading-relaxed">
                    {def.description}
                  </p>

                  {/* Streak Progress Visualizer */}
                  <div className="flex flex-col gap-2.5">
                    <div className="h-2 bg-[#F3EFEA] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          claimed || isComplete
                            ? 'bg-[#2E6F73]'
                            : 'bg-[#8B2635]'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Discrete Step / Day Streak Blocks */}
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${def.targetCount}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: def.targetCount }).map((_, idx) => {
                        const filled = idx < progressCount;
                        return (
                          <div
                            key={`${def.id}-step-${idx}`}
                            className={`py-2 px-1.5 rounded-lg border text-center flex flex-col items-center justify-center gap-0.5 transition-colors ${
                              filled
                                ? claimed || isComplete
                                  ? 'bg-[#2E6F73]/10 border-[#2E6F73]/30 text-[#2E6F73]'
                                  : 'bg-[#8B2635]/8 border-[#8B2635]/25 text-[#8B2635]'
                                : 'bg-[#FAF8F6] border-[#191615]/10 text-[#6E6560]'
                            }`}
                          >
                            {filled ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Flame className="w-3 h-3 opacity-45" />
                            )}
                            <span className="font-mono tabular-nums text-[10px] font-medium">
                              Step {idx + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6E6560] pt-0.5">
                      <span className="font-mono tabular-nums">
                        {autoSourceLabel} · {manualCount} practice{' '}
                        {manualCount === 1 ? 'check-in' : 'check-ins'}
                      </span>
                      <span>{def.trackingNote}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="pt-4 border-t border-[#191615]/8 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (def.mirrorTab) {
                        onPracticeInMirror(def.mirrorTab);
                      } else {
                        onScrollToHydration();
                      }
                    }}
                    className="text-xs font-medium text-[#8B2635] hover:text-[#6E1D2A] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {def.actionLabel} →
                  </button>

                  <div className="flex items-center gap-2 ml-auto">
                    {claimed ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2E6F73]">
                        <Check className="w-3.5 h-3.5" />
                        <span>
                          Reward Claimed ({claimed.claimedAt}) · +
                          {claimed.bonusPoints} pts
                        </span>
                      </div>
                    ) : isComplete ? (
                      <button
                        type="button"
                        disabled={Boolean(busyId)}
                        onClick={() => handleClaim(def.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8B2635] hover:bg-[#6E1D2A] disabled:opacity-50 text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>
                          {isClaiming
                            ? 'Crediting Points…'
                            : `Claim +${def.bonusPoints} Glam Points`}
                        </span>
                      </button>
                    ) : (
                      <>
                        {manualCount > 0 && (
                          <button
                            type="button"
                            disabled={Boolean(busyId)}
                            onClick={() => handleCheckIn(def.id, 'undo')}
                            className="px-2.5 py-2 text-[11px] font-medium text-[#6E6560] hover:text-[#191615] disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            {isUndoing ? 'Updating…' : 'Undo'}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => handleCheckIn(def.id, 'add')}
                          className="px-3.5 py-2 bg-[#191615] hover:bg-[#2F2A28] disabled:opacity-50 text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {isAdding ? 'Logging…' : 'Log Streak Step (+1)'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Footer Utility Line */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#6E6560]">
        <span>
          Streak progress updates automatically whenever you capture looks in Photo Studio or record 2,000+ ml hydration logs.
        </span>
        <button
          type="button"
          disabled={isResetting}
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6560] hover:text-[#191615] disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{isResetting ? 'Resetting Week…' : 'Reset Weekly Board'}</span>
        </button>
      </div>
    </section>
  );
};
