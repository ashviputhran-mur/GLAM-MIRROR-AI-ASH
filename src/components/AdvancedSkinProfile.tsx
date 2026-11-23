import React, { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Droplets, Minus, Plus, Sparkles } from 'lucide-react';
import type {
  AiConsultationRecord,
  WaterIntakeEntry,
} from '../data/makeupCatalog';

interface AdvancedSkinProfileProps {
  consultations: AiConsultationRecord[];
  waterIntakeLogs: WaterIntakeEntry[];
  onLogWaterIntake: (payload: {
    date: string;
    glasses: number;
    ml: number;
    note?: string;
  }) => Promise<void>;
  onScrollToMirror: () => void;
}

type MetricKey = 'hydrationScore' | 'brightness' | 'texture';

interface ChartDatum {
  id: string;
  dateKey: string;
  dateLabel: string;
  fullDate: string;
  occasion: string;
  lookTitle: string;
  undertone: string;
  complexionDepth: string;
  hydrationScore: number;
  brightness: number;
  texture: number;
  waterMl: number;
  waterGlasses: number;
  note: string;
}

const DAILY_WATER_GOAL_ML = 2500;

const METRIC_META: Record<
  MetricKey,
  { label: string; color: string; description: string }
> = {
  hydrationScore: {
    label: 'Hydration Score',
    color: '#2E6F73',
    description: 'Calibrated from daily water intake and barrier scans',
  },
  brightness: {
    label: 'Brightness',
    color: '#B8863B',
    description: 'Skin radiance & clarity correlated with hydration',
  },
  texture: {
    label: 'Texture',
    color: '#8B2635',
    description: 'Pore refinement and surface smoothness',
  },
};

function formatShortDate(dateOrIso: string): string {
  const normalized =
    dateOrIso.length === 10 ? `${dateOrIso}T12:00:00Z` : dateOrIso;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return dateOrIso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatFullDate(dateOrIso: string): string {
  const normalized =
    dateOrIso.length === 10 ? `${dateOrIso}T12:00:00Z` : dateOrIso;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return dateOrIso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function computePearsonCorrelation(xs: number[], ys: number[]): number | null {
  if (xs.length < 2 || xs.length !== ys.length) return null;
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const denom = Math.sqrt(denX * denY);
  if (denom === 0) return null;
  return Math.max(-1, Math.min(1, num / denom));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value?: number;
    payload?: ChartDatum;
  }>;
}

const SkinProfileTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
}) => {
  if (!active || !payload || payload.length === 0 || !payload[0]?.payload) {
    return null;
  }
  const row = payload[0].payload;
  return (
    <div className="bg-white border border-[#191615]/15 rounded-lg p-3 shadow-lg text-xs min-w-[230px]">
      <div className="font-semibold text-[#191615]">{row.fullDate}</div>
      <div className="text-[#6E6560] mt-0.5">
        {row.lookTitle} · {row.occasion}
      </div>
      <div className="mt-2.5 pt-2 border-t border-[#191615]/10 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#5C534E]">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: METRIC_META.hydrationScore.color }}
            />
            Hydration Score
          </span>
          <span className="font-mono tabular-nums font-semibold text-[#191615]">
            {row.hydrationScore} / 100
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#5C534E]">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: METRIC_META.brightness.color }}
            />
            Brightness
          </span>
          <span className="font-mono tabular-nums font-semibold text-[#191615]">
            {row.brightness} / 100
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#5C534E]">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: METRIC_META.texture.color }}
            />
            Texture
          </span>
          <span className="font-mono tabular-nums font-semibold text-[#191615]">
            {row.texture} / 100
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#191615]/8">
          <span className="flex items-center gap-1.5 text-[#5C534E]">
            <span className="w-2 h-2 rounded-full bg-[#4B8791]" />
            Water Intake
          </span>
          <span className="font-mono tabular-nums font-medium text-[#191615]">
            {row.waterGlasses} glasses ({row.waterMl} ml)
          </span>
        </div>
      </div>
    </div>
  );
};

export const AdvancedSkinProfile: React.FC<AdvancedSkinProfileProps> = ({
  consultations,
  waterIntakeLogs,
  onLogWaterIntake,
  onScrollToMirror,
}) => {
  const defaultDate = useMemo(() => {
    if (waterIntakeLogs[0]?.date) return waterIntakeLogs[0].date;
    return new Date().toISOString().slice(0, 10);
  }, [waterIntakeLogs]);

  const [range, setRange] = useState<'recent' | 'all'>('all');
  const [showWaterSeries, setShowWaterSeries] = useState(true);
  const [visibleMetrics, setVisibleMetrics] = useState<
    Record<MetricKey, boolean>
  >({
    hydrationScore: true,
    brightness: true,
    texture: true,
  });

  // Daily water intake form state
  const [logDate, setLogDate] = useState<string>(defaultDate);
  const [glassesInput, setGlassesInput] = useState<number>(
    waterIntakeLogs[0]?.glasses || 8
  );
  const [noteInput, setNoteInput] = useState<string>('');
  const [isSavingWater, setIsSavingWater] = useState(false);

  const selectedDayWater = useMemo(
    () => waterIntakeLogs.find((w) => w.date === logDate) || waterIntakeLogs[0],
    [waterIntakeLogs, logDate]
  );

  // Merge AI consultations + Water intake logs chronologically by date (YYYY-MM-DD)
  const chronologicalData = useMemo<ChartDatum[]>(() => {
    const byDate = new Map<
      string,
      {
        consultation?: AiConsultationRecord;
        water?: WaterIntakeEntry;
      }
    >();

    consultations.forEach((c) => {
      const dateKey = c.createdAt.slice(0, 10);
      const existing = byDate.get(dateKey) || {};
      if (!existing.consultation) {
        byDate.set(dateKey, { ...existing, consultation: c });
      }
    });

    waterIntakeLogs.forEach((w) => {
      const existing = byDate.get(w.date) || {};
      byDate.set(w.date, { ...existing, water: w });
    });

    const sortedKeys = Array.from(byDate.keys()).sort((a, b) =>
      a.localeCompare(b)
    );
    const slicedKeys = range === 'recent' ? sortedKeys.slice(-5) : sortedKeys;

    return slicedKeys.map((dateKey, idx) => {
      const pair = byDate.get(dateKey)!;
      const c = pair.consultation;
      const w = pair.water;

      const waterMl = w?.ml ?? 1750;
      const waterGlasses = w?.glasses ?? Math.round(waterMl / 250);
      const baseHydration =
        c?.hydrationScore ?? Math.min(92, 68 + idx * 3);
      const hydrationScore = w
        ? c
          ? Math.round(w.hydrationScore * 0.6 + baseHydration * 0.4)
          : w.hydrationScore
        : baseHydration;

      // Correlate skin brightness cleanly with hydration score when a fresh water day is logged
      const brightness =
        c?.brightnessScore ??
        Math.min(98, Math.max(50, Math.round(hydrationScore * 0.92 + 4)));
      const texture =
        c?.textureScore ??
        Math.min(95, Math.max(52, Math.round(hydrationScore * 0.88 + 9)));

      return {
        id: c?.id || w?.id || dateKey,
        dateKey,
        dateLabel: formatShortDate(dateKey),
        fullDate: formatFullDate(dateKey),
        occasion: c?.occasion || 'Daily Hydration Log',
        lookTitle: c?.lookTitle || 'Barrier Tracking',
        undertone: c?.undertone || 'Balanced Neutral',
        complexionDepth: c?.complexionDepth || 'Light-Medium',
        hydrationScore,
        brightness,
        texture,
        waterMl,
        waterGlasses,
        note:
          w?.note ||
          c?.faceNotes ||
          'Even barrier surface measured during AI shade analysis.',
      };
    });
  }, [consultations, waterIntakeLogs, range]);

  const summary = useMemo(() => {
    if (chronologicalData.length === 0) return null;
    const first = chronologicalData[0];
    const latest = chronologicalData[chronologicalData.length - 1];
    const r = computePearsonCorrelation(
      chronologicalData.map((d) => d.hydrationScore),
      chronologicalData.map((d) => d.brightness)
    );
    return {
      latest,
      hydrationDelta: latest.hydrationScore - first.hydrationScore,
      brightnessDelta: latest.brightness - first.brightness,
      textureDelta: latest.texture - first.texture,
      correlationR: r,
    };
  }, [chronologicalData]);

  const toggleMetric = (key: MetricKey) => {
    setVisibleMetrics((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.hydrationScore && !next.brightness && !next.texture) {
        return prev;
      }
      return next;
    });
  };

  const formatDelta = (delta: number) =>
    delta > 0 ? `+${delta} pts` : delta < 0 ? `${delta} pts` : '0 pts';

  const handleSaveWater = async (
    targetDate: string,
    targetGlasses: number,
    customNote?: string
  ) => {
    setIsSavingWater(true);
    try {
      const clampedGlasses = Math.max(1, Math.min(18, targetGlasses));
      await onLogWaterIntake({
        date: targetDate,
        glasses: clampedGlasses,
        ml: clampedGlasses * 250,
        note: customNote,
      });
      setNoteInput('');
    } finally {
      setIsSavingWater(false);
    }
  };

  const currentMl = glassesInput * 250;
  const goalPct = Math.min(
    100,
    Math.round((currentMl / DAILY_WATER_GOAL_ML) * 100)
  );

  return (
    <section
      id="advanced-skin-profile"
      className="border-t border-[#191615]/10 py-14"
    >
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-medium text-[#8B2635]">
            Longitudinal Complexion &amp; Hydration Telemetry
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#191615] mt-1">
            Advanced Skin Profile
          </h2>
          <p className="text-sm text-[#5C534E] mt-2 max-w-2xl leading-relaxed">
            Log daily water intake to calibrate your Hydration Score and monitor how fluid balance correlates with skin brightness and texture across AI scans.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-1 p-1 bg-[#F3EFEA] rounded-lg">
            <button
              type="button"
              onClick={() => setRange('recent')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                range === 'recent'
                  ? 'bg-white text-[#191615] shadow-sm'
                  : 'text-[#5C534E] hover:text-[#191615]'
              }`}
            >
              Last 5 Entries
            </button>
            <button
              type="button"
              onClick={() => setRange('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                range === 'all'
                  ? 'bg-white text-[#191615] shadow-sm'
                  : 'text-[#5C534E] hover:text-[#191615]'
              }`}
            >
              All History ({chronologicalData.length})
            </button>
          </div>

          <button
            type="button"
            onClick={onScrollToMirror}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#191615] hover:bg-[#2F2A28] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Run New AI Scan</span>
          </button>
        </div>
      </div>

      {chronologicalData.length === 0 || !summary ? (
        <div className="bg-white rounded-xl border border-[#191615]/10 p-10 text-center flex flex-col items-center gap-3">
          <Activity className="w-6 h-6 text-[#8B2635]" />
          <h3 className="font-display text-2xl font-semibold text-[#191615]">
            No Skin Scans Recorded Yet
          </h3>
          <p className="text-sm text-[#5C534E] max-w-md">
            Click AI Shade Match inside the live mirror or log today&apos;s water intake to establish your hydration, brightness, and texture baseline.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#191615]/10 p-6 sm:p-8 flex flex-col gap-8">
          {/* 3-Metric Baseline & Delta Summary Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-[#191615]/10">
            {(['hydrationScore', 'brightness', 'texture'] as MetricKey[]).map(
              (key) => {
                const meta = METRIC_META[key];
                const score = summary.latest[key];
                const delta =
                  key === 'hydrationScore'
                    ? summary.hydrationDelta
                    : key === 'brightness'
                      ? summary.brightnessDelta
                      : summary.textureDelta;
                const isVisible = visibleMetrics[key];

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleMetric(key)}
                    aria-pressed={isVisible}
                    className={`text-left flex flex-col gap-1.5 transition-opacity cursor-pointer ${
                      isVisible ? 'opacity-100' : 'opacity-45'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-[#6E6560]">
                      <span className="flex items-center gap-2 font-medium text-[#191615]">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        {meta.label}
                      </span>
                      <span className="font-mono tabular-nums text-[11px]">
                        {formatDelta(delta)} vs start
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono tabular-nums text-3xl font-semibold text-[#191615]">
                        {score}
                      </span>
                      <span className="text-xs font-mono text-[#6E6560]">
                        / 100
                      </span>
                    </div>
                    <div className="text-xs text-[#6E6560]">
                      {meta.description}
                    </div>
                  </button>
                );
              }
            )}
          </div>

          {/* Daily Water Intake Logger Strip */}
          <div className="pb-6 border-b border-[#191615]/10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#191615]">
                <Droplets className="w-4 h-4 text-[#2E6F73]" />
                <span>Daily Water Intake Log</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-mono tabular-nums text-2xl font-semibold text-[#191615]">
                  {currentMl.toLocaleString()} ml
                </span>
                <span className="text-xs text-[#6E6560] font-mono tabular-nums">
                  {glassesInput} glasses · {goalPct}% of 2,500 ml goal
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-[#F3EFEA] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2E6F73] transition-all duration-200"
                  style={{ width: `${goalPct}%` }}
                />
              </div>
              <div className="text-xs text-[#6E6560]">
                {selectedDayWater ? (
                  <>
                    Latest logged ({selectedDayWater.date}):{' '}
                    <span className="font-medium text-[#191615]">
                      {selectedDayWater.ml} ml · Hydration Score{' '}
                      {selectedDayWater.hydrationScore}/100
                    </span>
                  </>
                ) : (
                  'Log today’s glasses to update your Hydration Score.'
                )}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveWater(logDate, glassesInput, noteInput);
              }}
              className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
            >
              <div className="sm:col-span-3">
                <label
                  htmlFor="water-date"
                  className="block text-[11px] font-medium text-[#6E6560] mb-1"
                >
                  Log Date
                </label>
                <input
                  id="water-date"
                  type="date"
                  value={logDate}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    setLogDate(nextDate);
                    const match = waterIntakeLogs.find(
                      (w) => w.date === nextDate
                    );
                    if (match) setGlassesInput(match.glasses);
                  }}
                  className="w-full px-2.5 py-2 bg-[#FAF8F6] border border-[#191615]/15 rounded-lg text-xs text-[#191615] font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-medium text-[#6E6560] mb-1">
                  Glasses (250ml)
                </label>
                <div className="flex items-center border border-[#191615]/15 rounded-lg bg-[#FAF8F6]">
                  <button
                    type="button"
                    aria-label="Decrease glasses by 1"
                    onClick={() =>
                      setGlassesInput((g) => Math.max(1, g - 1))
                    }
                    className="p-2 text-[#5C534E] hover:text-[#191615] cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="flex-1 text-center font-mono tabular-nums text-xs font-semibold text-[#191615]">
                    {glassesInput}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase glasses by 1"
                    onClick={() =>
                      setGlassesInput((g) => Math.min(18, g + 1))
                    }
                    className="p-2 text-[#5C534E] hover:text-[#191615] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="water-note"
                  className="block text-[11px] font-medium text-[#6E6560] mb-1"
                >
                  Intake Note
                </label>
                <input
                  id="water-note"
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="e.g. Electrolytes"
                  className="w-full px-2.5 py-2 bg-[#FAF8F6] border border-[#191615]/15 rounded-lg text-xs text-[#191615] placeholder:text-[#9A8F89]"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={isSavingWater}
                  className="w-full py-2 px-3 bg-[#8B2635] hover:bg-[#6E1D2A] disabled:opacity-60 text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isSavingWater ? 'Logging…' : 'Log Water'}
                </button>
              </div>
            </form>
          </div>

          {/* Interactive Recharts Correlation Line Chart */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#6E6560]">
                <span>
                  Active profile:{' '}
                  <strong className="font-medium text-[#191615]">
                    {summary.latest.complexionDepth} ·{' '}
                    {summary.latest.undertone}
                  </strong>
                </span>
                {summary.correlationR !== null && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-[#191615]">
                      Hydration Score ↔ Brightness Correlation: r ={' '}
                      {summary.correlationR >= 0 ? '+' : ''}
                      {summary.correlationR.toFixed(2)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#5C534E]">
                {(
                  ['hydrationScore', 'brightness', 'texture'] as MetricKey[]
                ).map((key) => (
                  <span key={key} className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-0.5 inline-block"
                      style={{ backgroundColor: METRIC_META[key].color }}
                    />
                    {METRIC_META[key].label}
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setShowWaterSeries((s) => !s)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showWaterSeries
                      ? 'bg-[#F3EFEA] border-[#191615]/15 text-[#191615]'
                      : 'bg-white border-[#191615]/10 text-[#6E6560]'
                  }`}
                >
                  {showWaterSeries ? 'Hide Water (ml)' : 'Show Water (ml)'}
                </button>
              </div>
            </div>

            <div className="w-full h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chronologicalData}
                  margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
                >
                  <CartesianGrid
                    stroke="#191615"
                    strokeOpacity={0.08}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: '#6E6560', fontSize: 12 }}
                    axisLine={{ stroke: '#191615', strokeOpacity: 0.12 }}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    yAxisId="score"
                    domain={[45, 100]}
                    tick={{ fill: '#6E6560', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  {showWaterSeries && (
                    <YAxis
                      yAxisId="water"
                      orientation="right"
                      domain={[500, 4000]}
                      tick={{ fill: '#4B8791', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(Number(v) / 1000).toFixed(1)}L`}
                      width={42}
                    />
                  )}
                  <Tooltip content={<SkinProfileTooltip />} />
                  {visibleMetrics.hydrationScore && (
                    <Line
                      yAxisId="score"
                      type="monotone"
                      dataKey="hydrationScore"
                      name="Hydration Score"
                      stroke={METRIC_META.hydrationScore.color}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#FFFFFF', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {visibleMetrics.brightness && (
                    <Line
                      yAxisId="score"
                      type="monotone"
                      dataKey="brightness"
                      name="Brightness"
                      stroke={METRIC_META.brightness.color}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#FFFFFF', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {visibleMetrics.texture && (
                    <Line
                      yAxisId="score"
                      type="monotone"
                      dataKey="texture"
                      name="Texture"
                      stroke={METRIC_META.texture.color}
                      strokeWidth={2}
                      dot={{ r: 3.5, fill: '#FFFFFF', strokeWidth: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                  {showWaterSeries && (
                    <Line
                      yAxisId="water"
                      type="monotone"
                      dataKey="waterMl"
                      name="Water Intake (ml)"
                      stroke="#4B8791"
                      strokeWidth={1.75}
                      strokeDasharray="4 4"
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recorded Water & Skin Analysis History Table */}
          <div className="pt-4 border-t border-[#191615]/10">
            <div className="text-xs font-semibold text-[#191615] mb-3">
              Water Intake &amp; Complexion History ({chronologicalData.length}{' '}
              Entries)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#191615]/10 text-[#6E6560]">
                    <th className="py-2.5 pr-4 font-medium">Date</th>
                    <th className="py-2.5 pr-4 font-medium">Daily Water Log</th>
                    <th className="py-2.5 pr-4 font-medium">Scan / Note</th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      Hydration Score
                    </th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      Brightness
                    </th>
                    <th className="py-2.5 pl-3 font-medium text-right">
                      Texture
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#191615]/8">
                  {[...chronologicalData].reverse().map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-[#FAF8F6] transition-colors"
                    >
                      <td className="py-3 pr-4 font-mono tabular-nums text-[#5C534E] whitespace-nowrap">
                        {row.fullDate}
                      </td>
                      <td className="py-3 pr-4 font-mono tabular-nums text-[#2E6F73] font-medium whitespace-nowrap">
                        {row.waterGlasses} glasses ({row.waterMl} ml)
                      </td>
                      <td className="py-3 pr-4 text-[#5C534E]">
                        <span className="font-medium text-[#191615]">
                          {row.lookTitle}
                        </span>{' '}
                        · {row.note}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-right text-[#191615] font-semibold">
                        {row.hydrationScore}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-right text-[#191615] font-medium">
                        {row.brightness}
                      </td>
                      <td className="py-3 pl-3 font-mono tabular-nums text-right text-[#191615] font-medium">
                        {row.texture}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
