import React, { useEffect, useMemo, useState } from 'react';
import { Award, Check, Copy, Droplets, Camera, ShoppingBag } from 'lucide-react';
import type {
  ClaimedChallengeEntry,
  RedeemedRewardEntry,
  UserOrder,
  WaterIntakeEntry,
} from '../data/makeupCatalog';
import type { SavedLookSnapshot } from './LookbookDrawer';

interface GlamRewardsSectionProps {
  snapshots: SavedLookSnapshot[];
  orders: UserOrder[];
  waterIntakeLogs: WaterIntakeEntry[];
  redeemedRewards: RedeemedRewardEntry[];
  claimedChallenges: ClaimedChallengeEntry[];
  onRedeemReward: (payload: {
    id: string;
    title: string;
    cost: number;
    codePrefix: string;
  }) => Promise<void>;
  onClearRedeemedRewards: () => Promise<void>;
  onScrollToStudio: () => void;
  onScrollToHydration: () => void;
  onScrollToCollection: () => void;
}

interface RewardTier {
  id: 'rosewater' | 'velvet' | 'lumiere' | 'prive';
  name: string;
  minPoints: number;
  maxPoints: number | null;
  tagline: string;
  perks: string[];
}

interface RedeemableReward {
  id: string;
  title: string;
  description: string;
  cost: number;
  codePrefix: string;
}

const REWARD_TIERS: RewardTier[] = [
  {
    id: 'rosewater',
    name: 'Rosewater Member',
    minPoints: 0,
    maxPoints: 499,
    tagline: 'Entry Atelier Status · Welcome Benefits',
    perks: [
      '45 Glam Points per captured & saved mirror look',
      'Complimentary sample vial with every Vanity Bag order',
      'Synced Photo Studio lookbook & social card export',
    ],
  },
  {
    id: 'velvet',
    name: 'Velvet Insider',
    minPoints: 500,
    maxPoints: 999,
    tagline: 'Consistent Routine · Mid-Tier Privileges',
    perks: [
      'Early 48-hour access to seasonal Maison Velours drops',
      '10% member privilege across Skincare Prep & Makeup Tools',
      'Priority shade restock alerts from Atelier Kōhl',
    ],
  },
  {
    id: 'lumiere',
    name: 'Lumière Icon',
    minPoints: 1000,
    maxPoints: 1799,
    tagline: 'Dedicated Collector · Studio Priority',
    perks: [
      'Complimentary express dispatch on all studio orders',
      '1.25× Glam Points multiplier on consistent 2L hydration streaks',
      'Curated Lumière Privée glow miniature with every capsule',
    ],
  },
  {
    id: 'prive',
    name: 'Atelier Privé',
    minPoints: 1800,
    maxPoints: null,
    tagline: 'Highest Patron Tier · Bespoke Concierge',
    perks: [
      'Bespoke monogram engraving on Maison Velours compacts',
      'Complimentary annual bridal or editorial kit consultation',
      'VIP runway shoot look previews & private archive access',
    ],
  },
];

const REDEEMABLE_PERKS: RedeemableReward[] = [
  {
    id: 'perk-courier',
    title: 'Express Studio Dispatch Pass',
    description: 'Complimentary priority shipping on your next Vanity Bag checkout.',
    cost: 250,
    codePrefix: 'DISPATCH',
  },
  {
    id: 'perk-micellar',
    title: 'Travel Micellar Water (100 ml)',
    description: 'Soraia Botanics backstage quick-change cleanser gift.',
    cost: 420,
    codePrefix: 'BOTANIC',
  },
  {
    id: 'perk-velours',
    title: '$25 Maison Velours Shade Credit',
    description: 'Redeem toward any Lipstick, Foundation, or Eyeshadow Palette.',
    cost: 650,
    codePrefix: 'VELOURS',
  },
];

const CONSISTENT_WATER_THRESHOLD_ML = 2000;

export const GlamRewardsSection: React.FC<GlamRewardsSectionProps> = ({
  snapshots,
  orders,
  waterIntakeLogs,
  redeemedRewards,
  claimedChallenges,
  onRedeemReward,
  onClearRedeemedRewards,
  onScrollToStudio,
  onScrollToHydration,
  onScrollToCollection,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const pointsBreakdown = useMemo(() => {
    const savedLooksCount = snapshots.length;
    const savedLooksPoints = savedLooksCount * 45;

    const ordersCount = orders.length;
    const totalSpend = orders.reduce((sum, o) => sum + o.total, 0);
    const orderPoints = ordersCount * 120 + Math.round(totalSpend * 0.5);

    const consistentDays = waterIntakeLogs.filter(
      (w) => w.ml >= CONSISTENT_WATER_THRESHOLD_ML
    ).length;
    const standardDays = Math.max(0, waterIntakeLogs.length - consistentDays);
    const streakBonus = consistentDays >= 3 ? 60 : 0;
    const hydrationPoints =
      consistentDays * 35 + standardDays * 15 + streakBonus;

    const challengeBonusPoints = claimedChallenges.reduce(
      (sum, c) => sum + c.bonusPoints,
      0
    );

    const lifetimePoints =
      savedLooksPoints + orderPoints + hydrationPoints + challengeBonusPoints;
    const spentPoints = redeemedRewards.reduce((sum, r) => sum + r.cost, 0);
    const availablePoints = Math.max(0, lifetimePoints - spentPoints);

    const activeTierIndex = REWARD_TIERS.reduce((acc, tier, idx) => {
      return lifetimePoints >= tier.minPoints ? idx : acc;
    }, 0);
    const activeTier = REWARD_TIERS[activeTierIndex];
    const nextTier = REWARD_TIERS[activeTierIndex + 1] || null;

    const maxScale = 1800;
    const overallProgressPct = Math.min(
      100,
      Math.round((lifetimePoints / maxScale) * 100)
    );

    const tierProgressPct = nextTier
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((lifetimePoints - activeTier.minPoints) /
                (nextTier.minPoints - activeTier.minPoints)) *
                100
            )
          )
        )
      : 100;

    return {
      savedLooksCount,
      savedLooksPoints,
      ordersCount,
      totalSpend,
      orderPoints,
      totalWaterLogs: waterIntakeLogs.length,
      consistentDays,
      streakBonus,
      hydrationPoints,
      challengeBonusPoints,
      claimedChallengesCount: claimedChallenges.length,
      lifetimePoints,
      spentPoints,
      availablePoints,
      activeTier,
      activeTierIndex,
      nextTier,
      overallProgressPct,
      tierProgressPct,
      pointsToNextTier: nextTier
        ? Math.max(0, nextTier.minPoints - lifetimePoints)
        : 0,
    };
  }, [
    snapshots,
    orders,
    waterIntakeLogs,
    redeemedRewards,
    claimedChallenges,
  ]);

  const [inspectedTierId, setInspectedTierId] = useState<RewardTier['id']>(
    pointsBreakdown.activeTier.id
  );

  useEffect(() => {
    setInspectedTierId(pointsBreakdown.activeTier.id);
  }, [pointsBreakdown.activeTier.id]);

  const inspectedTier =
    REWARD_TIERS.find((t) => t.id === inspectedTierId) ||
    pointsBreakdown.activeTier;

  const handleRedeem = async (reward: RedeemableReward) => {
    if (pointsBreakdown.availablePoints < reward.cost || redeemingId) return;
    setRedeemingId(reward.id);
    try {
      await onRedeemReward({
        id: reward.id,
        title: reward.title,
        cost: reward.cost,
        codePrefix: reward.codePrefix,
      });
    } finally {
      setRedeemingId(null);
    }
  };

  const handleCopyVoucher = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <section
      id="glam-rewards"
      className="border-t border-[#191615]/10 py-14 flex flex-col gap-8"
    >
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-[#8B2635]">
            Atelier Membership &amp; Consistency Program
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#191615] mt-1">
            Glam Rewards
          </h2>
          <p className="text-sm text-[#5C534E] mt-2 max-w-2xl leading-relaxed">
            Earn Glam Points automatically every time you capture and save a studio look, place a Vanity Bag order, hit consistent daily water intake targets (2,000+ ml), or claim Weekly Beauty Challenge streaks.
          </p>
        </div>

        <div className="flex items-center gap-6 bg-white border border-[#191615]/10 rounded-xl px-5 py-3.5 shrink-0">
          <div>
            <div className="text-[11px] text-[#6E6560]">Available Balance</div>
            <div className="font-mono tabular-nums text-2xl font-semibold text-[#191615]">
              {pointsBreakdown.availablePoints.toLocaleString()}{' '}
              <span className="text-xs font-normal text-[#6E6560]">pts</span>
            </div>
          </div>
          <div className="h-8 w-px bg-[#191615]/10" />
          <div>
            <div className="text-[11px] text-[#6E6560]">Current Tier</div>
            <div className="text-sm font-semibold text-[#8B2635]">
              {pointsBreakdown.activeTier.name}
            </div>
          </div>
        </div>
      </div>

      {/* Main Single-Elevation Tier & Breakdown Card */}
      <div className="bg-white rounded-xl border border-[#191615]/10 p-6 sm:p-8 flex flex-col gap-8">
        {/* Tier Progress Visualizer */}
        <div className="flex flex-col gap-5 pb-7 border-b border-[#191615]/10">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6560]">
                <Award className="w-4 h-4 text-[#8B2635]" />
                <span>Tier Progress Visualizer</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-[#191615] font-medium">
                  {pointsBreakdown.lifetimePoints.toLocaleString()} lifetime pts
                </span>
                {pointsBreakdown.challengeBonusPoints > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-[#2E6F73] font-medium">
                      +{pointsBreakdown.challengeBonusPoints} challenge streak bonus
                    </span>
                  </>
                )}
              </div>
              <h3 className="font-display text-2xl font-semibold text-[#191615] mt-1">
                {pointsBreakdown.nextTier
                  ? `${pointsBreakdown.pointsToNextTier.toLocaleString()} Glam Points to ${pointsBreakdown.nextTier.name}`
                  : 'Top Atelier Privé Tier Unlocked'}
              </h3>
            </div>

            <div className="text-xs font-mono tabular-nums text-[#5C534E]">
              {pointsBreakdown.nextTier
                ? `Tier Progress: ${pointsBreakdown.tierProgressPct}%`
                : 'Maximum Tier Reached (100%)'}
            </div>
          </div>

          {/* Segmented Tier Progress Track */}
          <div className="flex flex-col gap-3">
            <div className="relative h-3 bg-[#F3EFEA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#8B2635] transition-all duration-300"
                style={{ width: `${pointsBreakdown.overallProgressPct}%` }}
              />
            </div>

            {/* Interactive 4-Tier Milestone Selector */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {REWARD_TIERS.map((tier, idx) => {
                const isUnlocked =
                  pointsBreakdown.lifetimePoints >= tier.minPoints;
                const isCurrent = pointsBreakdown.activeTier.id === tier.id;
                const isInspected = inspectedTierId === tier.id;

                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setInspectedTierId(tier.id)}
                    className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                      isInspected
                        ? 'bg-[#FAF8F6] border-[#191615]'
                        : 'bg-white border-[#191615]/10 hover:border-[#191615]/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                      <span
                        className={
                          isCurrent
                            ? 'text-[#8B2635] font-semibold'
                            : isUnlocked
                              ? 'text-[#2E6F73] font-medium'
                              : 'text-[#6E6560]'
                        }
                      >
                        0{idx + 1} · {tier.minPoints.toLocaleString()}+ pts
                      </span>
                      <span className="text-[#6E6560]">
                        {isCurrent
                          ? 'Active'
                          : isUnlocked
                            ? 'Unlocked'
                            : 'Locked'}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#191615] mt-1">
                      {tier.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Tier Privileges Line */}
            <div className="bg-[#FAF8F6] rounded-lg px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-semibold text-[#191615]">
                  {inspectedTier.name} — {inspectedTier.tagline}
                </div>
                <div className="text-[#5C534E] mt-1">
                  {inspectedTier.perks.join(' · ')}
                </div>
              </div>
              <span className="font-mono tabular-nums text-[11px] text-[#6E6560] whitespace-nowrap shrink-0">
                {inspectedTier.maxPoints
                  ? `${inspectedTier.minPoints}–${inspectedTier.maxPoints} pts`
                  : `${inspectedTier.minPoints}+ pts`}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Earning Sources Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-7 border-b border-[#191615]/10">
          {/* Source 1: Saved Looks */}
          <div className="flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-[#6E6560]">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#191615]">
                  <Camera className="w-3.5 h-3.5 text-[#8B2635]" />
                  Saved Studio Looks
                </span>
                <span className="font-mono tabular-nums">+45 pts / look</span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-mono tabular-nums text-3xl font-semibold text-[#191615]">
                  {pointsBreakdown.savedLooksPoints}
                </span>
                <span className="text-xs text-[#6E6560] font-mono tabular-nums">
                  pts ({pointsBreakdown.savedLooksCount} saved)
                </span>
              </div>
              <p className="text-xs text-[#6E6560] mt-1.5 leading-relaxed">
                Captured portraits saved into your Photo Studio Gallery.
              </p>
            </div>
            <button
              type="button"
              onClick={onScrollToStudio}
              className="self-start text-xs font-medium text-[#8B2635] hover:text-[#6E1D2A] cursor-pointer"
            >
              Capture New Look →
            </button>
          </div>

          {/* Source 2: Orders Placed */}
          <div className="flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-[#6E6560]">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#191615]">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#B8863B]" />
                  Vanity Bag Orders
                </span>
                <span className="font-mono tabular-nums">
                  +120 / order + spend
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-mono tabular-nums text-3xl font-semibold text-[#191615]">
                  {pointsBreakdown.orderPoints}
                </span>
                <span className="text-xs text-[#6E6560] font-mono tabular-nums">
                  pts ({pointsBreakdown.ordersCount} orders · $
                  {pointsBreakdown.totalSpend})
                </span>
              </div>
              <p className="text-xs text-[#6E6560] mt-1.5 leading-relaxed">
                Earned automatically on every Beauty Bag checkout order.
              </p>
            </div>
            <button
              type="button"
              onClick={onScrollToCollection}
              className="self-start text-xs font-medium text-[#8B2635] hover:text-[#6E1D2A] cursor-pointer"
            >
              Browse MUA Kit &amp; Shades →
            </button>
          </div>

          {/* Source 3: Consistent Daily Water Intake */}
          <div className="flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-[#6E6560]">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#191615]">
                  <Droplets className="w-3.5 h-3.5 text-[#2E6F73]" />
                  Daily Water Consistency
                </span>
                <span className="font-mono tabular-nums">+35 pts / 2L+ day</span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-mono tabular-nums text-3xl font-semibold text-[#191615]">
                  {pointsBreakdown.hydrationPoints}
                </span>
                <span className="text-xs text-[#6E6560] font-mono tabular-nums">
                  pts ({pointsBreakdown.consistentDays}/
                  {pointsBreakdown.totalWaterLogs} days ≥ 2L)
                </span>
              </div>
              <p className="text-xs text-[#6E6560] mt-1.5 leading-relaxed">
                {pointsBreakdown.streakBonus > 0
                  ? `Includes +${pointsBreakdown.streakBonus} pts 3-day hydration streak bonus.`
                  : 'Log 3+ days at 2,000+ ml to unlock a +60 pts streak bonus.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onScrollToHydration}
              className="self-start text-xs font-medium text-[#8B2635] hover:text-[#6E1D2A] cursor-pointer"
            >
              Log Daily Water Intake →
            </button>
          </div>
        </div>

        {/* Redeemable Perks & Active Vouchers */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="text-xs font-semibold text-[#191615]">
              Redeem Available Glam Points ({pointsBreakdown.availablePoints}{' '}
              pts)
            </div>
            <div className="divide-y divide-[#191615]/8 border-t border-b border-[#191615]/10">
              {REDEEMABLE_PERKS.map((perk) => {
                const canRedeem = pointsBreakdown.availablePoints >= perk.cost;
                const isBusy = redeemingId === perk.id;
                return (
                  <div
                    key={perk.id}
                    className="py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#191615]">
                        {perk.title}
                      </div>
                      <div className="text-xs text-[#6E6560] mt-0.5">
                        {perk.description}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canRedeem || isBusy}
                      onClick={() => handleRedeem(perk)}
                      className="px-3.5 py-2 bg-[#191615] hover:bg-[#2F2A28] disabled:opacity-40 text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {isBusy ? (
                        'Claiming…'
                      ) : (
                        <>
                          Redeem ·{' '}
                          <span className="font-mono tabular-nums">
                            {perk.cost}
                          </span>{' '}
                          pts
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#191615]">
                Claimed Atelier Vouchers ({redeemedRewards.length})
              </span>
              {redeemedRewards.length > 0 && (
                <button
                  type="button"
                  onClick={() => onClearRedeemedRewards()}
                  className="text-[11px] text-[#6E6560] hover:text-[#191615] cursor-pointer"
                >
                  Clear Vouchers
                </button>
              )}
            </div>

            {redeemedRewards.length === 0 ? (
              <div className="bg-[#FAF8F6] rounded-lg p-5 text-xs text-[#6E6560] leading-relaxed">
                Redeem unlocked points on the left to generate server-saved studio checkout voucher codes without affecting your lifetime tier status.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-52 overflow-y-auto pr-1">
                {redeemedRewards.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#FAF8F6] rounded-lg px-4 py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#191615] truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-[#6E6560] mt-0.5">
                        {item.voucherCode} · {item.redeemedAt}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyVoucher(item.voucherCode)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#191615]/12 rounded text-[11px] font-medium text-[#191615] hover:bg-[#EFEAE4] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copiedCode === item.voucherCode ? (
                        <Check className="w-3 h-3 text-[#2E6F73]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>
                        {copiedCode === item.voucherCode ? 'Copied' : 'Copy'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
