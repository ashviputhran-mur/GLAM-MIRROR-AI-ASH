import React from 'react';
import { Check, RotateCcw, ShoppingBag } from 'lucide-react';
import {
  EDITORIAL_PRESETS,
  getShadeById,
  getShadesByCategory,
  type BlushFinish,
  type EditorialPreset,
  type EyelinerStyle,
  type EyeshadowFinish,
  type FoundationFinish,
  type HighlighterFinish,
  type KajalStyle,
  type LipstickFinish,
  type MakeupCategory,
  type MakeupLookState,
  type MakeupShade,
} from '../data/makeupCatalog';

export type AtelierTab = MakeupCategory | 'looks';

interface AtelierControlsProps {
  shades: MakeupShade[];
  activeTab: AtelierTab;
  onTabChange: (tab: AtelierTab) => void;
  look: MakeupLookState;
  onUpdateLook: (updater: (prev: MakeupLookState) => MakeupLookState) => void;
  onApplyPreset: (preset: EditorialPreset) => void;
  onResetLook: () => void;
  onAddActiveLookToBag: () => void;
}

const TABS: { id: AtelierTab; label: string }[] = [
  { id: 'foundation', label: 'Foundation' },
  { id: 'lipstick', label: 'Lipstick' },
  { id: 'eyeliner', label: 'Eyeliner' },
  { id: 'kajal', label: 'Kajal' },
  { id: 'eyeshadow', label: 'Eyeshadow' },
  { id: 'blush', label: 'Blush' },
  { id: 'highlighter', label: 'Highlighter' },
  { id: 'looks', label: 'Curated Looks' },
];

export const AtelierControls: React.FC<AtelierControlsProps> = ({
  shades: catalogShades,
  activeTab,
  onTabChange,
  look,
  onUpdateLook,
  onApplyPreset,
  onResetLook,
  onAddActiveLookToBag,
}) => {
  const renderShadeSelector = (category: MakeupCategory) => {
    const shades = getShadesByCategory(category, catalogShades);
    const activeShadeId = look[category].shadeId;
    const activeShade = getShadeById(activeShadeId);
    const isEnabled = look[category].enabled;

    return (
      <div className="flex flex-col gap-5">
        {/* Category Header + Enable Toggle */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#191615]/10">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#191615] capitalize">
              {category}
            </h2>
            {activeShade && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#6E6560] mt-1">
                <span className="font-medium text-[#191615]">{activeShade.name}</span>
                <span aria-hidden="true">·</span>
                <span>{activeShade.brand}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{activeShade.code}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              onUpdateLook((prev) => ({
                ...prev,
                [category]: {
                  ...prev[category],
                  enabled: !prev[category].enabled,
                },
              }))
            }
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isEnabled
                ? 'bg-[#191615] text-[#FAF8F6] border-[#191615]'
                : 'bg-transparent text-[#6E6560] border-[#191615]/20 hover:border-[#191615]/40'
            }`}
          >
            {isEnabled ? 'Applied' : 'Off'}
          </button>
        </div>

        {/* Pigment Swatch Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[#5C534E]">
              Select Shade ({shades.length})
            </span>
            {activeShade && (
              <span className="text-xs font-mono tabular-nums text-[#6E6560]">
                {activeShade.undertone} · ${activeShade.price}
              </span>
            )}
          </div>

          <div className="grid grid-cols-5 gap-3">
            {shades.map((shade) => {
              const selected = shade.id === activeShadeId;
              return (
                <button
                  key={shade.id}
                  type="button"
                  title={`${shade.name} by ${shade.brand}`}
                  onClick={() =>
                    onUpdateLook((prev) => {
                      if (category === 'lipstick' && shade.defaultFinish) {
                        return {
                          ...prev,
                          lipstick: {
                            ...prev.lipstick,
                            enabled: true,
                            shadeId: shade.id,
                            finish: shade.defaultFinish as LipstickFinish,
                          },
                        };
                      }
                      if (category === 'eyeshadow' && shade.defaultFinish) {
                        return {
                          ...prev,
                          eyeshadow: {
                            ...prev.eyeshadow,
                            enabled: true,
                            shadeId: shade.id,
                            finish: shade.defaultFinish as EyeshadowFinish,
                          },
                        };
                      }
                      if (category === 'blush' && shade.defaultFinish) {
                        return {
                          ...prev,
                          blush: {
                            ...prev.blush,
                            enabled: true,
                            shadeId: shade.id,
                            finish: shade.defaultFinish as BlushFinish,
                          },
                        };
                      }
                      if (category === 'highlighter' && shade.defaultFinish) {
                        return {
                          ...prev,
                          highlighter: {
                            ...prev.highlighter,
                            enabled: true,
                            shadeId: shade.id,
                            finish: shade.defaultFinish as HighlighterFinish,
                          },
                        };
                      }
                      return {
                        ...prev,
                        [category]: {
                          ...prev[category],
                          enabled: true,
                          shadeId: shade.id,
                        },
                      };
                    })
                  }
                  className="group flex flex-col items-center gap-1.5 cursor-pointer"
                >
                  <div
                    className={`relative w-10 h-10 rounded-full transition-transform duration-150 ${
                      selected
                        ? 'ring-2 ring-[#191615] ring-offset-2 ring-offset-white scale-105'
                        : 'ring-1 ring-[#191615]/15 group-hover:scale-105'
                    }`}
                    style={{ backgroundColor: shade.hex }}
                  >
                    {selected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check
                          className={`w-4 h-4 ${
                            (category === 'foundation' &&
                              ['fnd-porcelain', 'fnd-ivory', 'fnd-sand'].includes(
                                shade.id
                              )) ||
                            category === 'highlighter'
                              ? 'text-[#191615]'
                              : 'text-white'
                          }`}
                        />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#5C534E] text-center leading-tight line-clamp-1 max-w-full">
                    {shade.name.replace(/^\d+\s+/, '')}
                  </span>
                </button>
              );
            })}
          </div>

          {activeShade && (
            <p className="text-xs text-[#6E6560] mt-3.5 leading-relaxed">
              {activeShade.description}
            </p>
          )}
        </div>

        {/* Finish or Style Segmented Control */}
        <div>
          <span className="block text-xs font-medium text-[#5C534E] mb-2">
            {category === 'eyeliner' || category === 'kajal'
              ? 'Application Style'
              : 'Finish'}
          </span>

          {category === 'foundation' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F3EFEA] rounded-lg">
              {(
                ['Natural Satin', 'Soft Matte', 'Radiant Dew'] as FoundationFinish[]
              ).map((finish) => (
                <button
                  key={finish}
                  type="button"
                  onClick={() =>
                    onUpdateLook((prev) => ({
                      ...prev,
                      foundation: { ...prev.foundation, enabled: true, finish },
                    }))
                  }
                  className={`py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    look.foundation.finish === finish
                      ? 'bg-white text-[#191615] shadow-sm'
                      : 'text-[#6E6560] hover:text-[#191615]'
                  }`}
                >
                  {finish}
                </button>
              ))}
            </div>
          )}

          {category === 'lipstick' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F3EFEA] rounded-lg">
              {(['Matte', 'Satin', 'Gloss'] as LipstickFinish[]).map((finish) => (
                <button
                  key={finish}
                  type="button"
                  onClick={() =>
                    onUpdateLook((prev) => ({
                      ...prev,
                      lipstick: { ...prev.lipstick, enabled: true, finish },
                    }))
                  }
                  className={`py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    look.lipstick.finish === finish
                      ? 'bg-white text-[#191615] shadow-sm'
                      : 'text-[#6E6560] hover:text-[#191615]'
                  }`}
                >
                  {finish}
                </button>
              ))}
            </div>
          )}

          {category === 'eyeliner' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F3EFEA] rounded-lg">
              {(['Tightline', 'Classic Wing', 'Smudged Kohl'] as EyelinerStyle[]).map(
                (style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() =>
                      onUpdateLook((prev) => ({
                        ...prev,
                        eyeliner: { ...prev.eyeliner, enabled: true, style },
                      }))
                    }
                    className={`py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      look.eyeliner.style === style
                        ? 'bg-white text-[#191615] shadow-sm'
                        : 'text-[#6E6560] hover:text-[#191615]'
                    }`}
                  >
                    {style}
                  </button>
                )
              )}
            </div>
          )}

          {category === 'kajal' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F3EFEA] rounded-lg">
              {(
                ['Tight Waterline', 'Classic Kohl', 'Smoky Lower'] as KajalStyle[]
              ).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() =>
                    onUpdateLook((prev) => ({
                      ...prev,
                      kajal: { ...prev.kajal, enabled: true, style },
                    }))
                  }
                  className={`py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    look.kajal.style === style
                      ? 'bg-white text-[#191615] shadow-sm'
                      : 'text-[#6E6560] hover:text-[#191615]'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          )}

          {category === 'eyeshadow' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F3EFEA] rounded-lg">
              {(
                ['Soft Matte', 'Silk Shimmer', 'Metallic Foil'] as EyeshadowFinish[]
              ).map((finish) => (
                <button
                  key={finish}
                  type="button"
                  onClick={() =>
                    onUpdateLook((prev) => ({
                      ...prev,
                      eyeshadow: { ...prev.eyeshadow, enabled: true, finish },
                    }))
                  }
                  className={`py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    look.eyeshadow.finish === finish
                      ? 'bg-white text-[#191615] shadow-sm'
                      : 'text-[#6E6560] hover:text-[#191615]'
                  }`}
                >
                  {finish}
                </button>
              ))}
            </div>
          )}

          {category === 'blush' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F3EFEA] rounded-lg">
              {(['Cream Dew', 'Velvet Powder', 'Radiant Veil'] as BlushFinish[]).map(
                (finish) => (
                  <button
                    key={finish}
                    type="button"
                    onClick={() =>
                      onUpdateLook((prev) => ({
                        ...prev,
                        blush: { ...prev.blush, enabled: true, finish },
                      }))
                    }
                    className={`py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      look.blush.finish === finish
                        ? 'bg-white text-[#191615] shadow-sm'
                        : 'text-[#6E6560] hover:text-[#191615]'
                    }`}
                  >
                    {finish}
                  </button>
                )
              )}
            </div>
          )}

          {category === 'highlighter' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F3EFEA] rounded-lg">
              {(['Soft Lit', 'Pearl Sheen', 'Glass Glow'] as HighlighterFinish[]).map(
                (finish) => (
                  <button
                    key={finish}
                    type="button"
                    onClick={() =>
                      onUpdateLook((prev) => ({
                        ...prev,
                        highlighter: { ...prev.highlighter, enabled: true, finish },
                      }))
                    }
                    className={`py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      look.highlighter.finish === finish
                        ? 'bg-white text-[#191615] shadow-sm'
                        : 'text-[#6E6560] hover:text-[#191615]'
                    }`}
                  >
                    {finish}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Intensity Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor={`intensity-${category}`}
              className="text-xs font-medium text-[#5C534E]"
            >
              {category === 'foundation' ? 'Coverage Veil' : 'Pigment Intensity'}
            </label>
            <span className="text-xs font-mono tabular-nums text-[#191615]">
              {look[category].intensity}%
            </span>
          </div>
          <input
            id={`intensity-${category}`}
            type="range"
            min={0}
            max={100}
            value={look[category].intensity}
            onChange={(e) => {
              const val = Number(e.target.value);
              onUpdateLook((prev) => ({
                ...prev,
                [category]: {
                  ...prev[category],
                  enabled: val > 0,
                  intensity: val,
                },
              }));
            }}
            className="atelier-slider"
          />
        </div>

        {/* Weight Slider for Eyeliner & Kajal */}
        {(category === 'eyeliner' || category === 'kajal') && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor={`${category}-thickness`}
                className="text-xs font-medium text-[#5C534E]"
              >
                {category === 'kajal' ? 'Kohl Line Weight' : 'Liner Precision Weight'}
              </label>
              <span className="text-xs font-mono tabular-nums text-[#191615]">
                {look[category].thickness} / 10
              </span>
            </div>
            <input
              id={`${category}-thickness`}
              type="range"
              min={1}
              max={10}
              value={look[category].thickness}
              onChange={(e) =>
                onUpdateLook((prev) => ({
                  ...prev,
                  [category]: {
                    ...prev[category],
                    enabled: true,
                    thickness: Number(e.target.value),
                  },
                }))
              }
              className="atelier-slider"
            />
          </div>
        )}
      </div>
    );
  };

  const activeCategories: MakeupCategory[] = (
    [
      'foundation',
      'lipstick',
      'eyeliner',
      'kajal',
      'eyeshadow',
      'blush',
      'highlighter',
    ] as MakeupCategory[]
  ).filter((cat) => look[cat].enabled && look[cat].intensity > 0);

  const totalPrice = activeCategories.reduce((sum, cat) => {
    const shade = getShadeById(look[cat].shadeId);
    return sum + (shade ? shade.price : 0);
  }, 0);

  return (
    <div className="bg-white rounded-xl border border-[#191615]/10 p-6 flex flex-col justify-between gap-6 h-full">
      <div className="flex flex-col gap-5">
        {/* 2-Row 4x2 Category Grid Tabs */}
        <div
          className="grid grid-cols-4 gap-1 p-1 bg-[#F3EFEA] rounded-lg"
          role="tablist"
        >
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            const isActiveLayer =
              tab.id !== 'looks' &&
              look[tab.id].enabled &&
              look[tab.id].intensity > 0;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onTabChange(tab.id)}
                className={`py-2 px-2 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap truncate cursor-pointer ${
                  isSelected
                    ? 'bg-white text-[#191615] shadow-sm'
                    : 'text-[#6E6560] hover:text-[#191615]'
                }`}
              >
                {tab.label}
                {isActiveLayer && !isSelected ? ' ·' : ''}
              </button>
            );
          })}
        </div>

        {/* Active Panel Body */}
        {activeTab === 'looks' ? (
          <div className="flex flex-col gap-4">
            <div className="pb-3 border-b border-[#191615]/10">
              <h2 className="font-display text-2xl font-semibold text-[#191615]">
                Curated Atelier Looks
              </h2>
              <p className="text-xs text-[#6E6560] mt-1">
                Apply a complete seven-piece pairing across complexion, eyes, kajal, cheeks, and lips.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {EDITORIAL_PRESETS.map((preset) => {
                const lip = getShadeById(preset.lipstickId);
                const eye = getShadeById(preset.eyelinerId);
                const shd = getShadeById(preset.eyeshadowId);
                const blush = getShadeById(preset.blushId);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onApplyPreset(preset)}
                    className="w-full text-left p-3.5 rounded-lg border border-[#191615]/10 bg-[#FAF8F6] hover:bg-[#F3EFEA] hover:border-[#191615]/25 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="font-display text-lg font-semibold text-[#191615]">
                        {preset.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {[lip?.hex, shd?.hex, eye?.hex, blush?.hex].map(
                          (hex, idx) =>
                            hex && (
                              <span
                                key={idx}
                                className="w-3.5 h-3.5 rounded-full border border-[#191615]/15"
                                style={{ backgroundColor: hex }}
                              />
                            )
                        )}
                      </div>
                    </div>
                    <div className="text-[11px] text-[#8B2635] font-medium mb-1">
                      {preset.mood}
                    </div>
                    <p className="text-xs text-[#6E6560] leading-relaxed">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          renderShadeSelector(activeTab)
        )}
      </div>

      {/* Currently Wearing Summary & Actions */}
      <div className="pt-5 border-t border-[#191615]/10 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#191615]">
            Currently Wearing ({activeCategories.length}/7)
          </span>
          <button
            type="button"
            onClick={onResetLook}
            className="inline-flex items-center gap-1.5 text-xs text-[#6E6560] hover:text-[#191615] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Bare Face
          </button>
        </div>

        {activeCategories.length === 0 ? (
          <p className="text-xs text-[#6E6560] py-2">
            No makeup applied. Choose a product category above or select a curated look.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {activeCategories.map((cat) => {
              const shade = getShadeById(look[cat].shadeId);
              if (!shade) return null;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onTabChange(cat)}
                  className="flex items-center gap-2 p-2 rounded-md bg-[#FAF8F6] hover:bg-[#F3EFEA] border border-[#191615]/8 text-left transition-colors cursor-pointer"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-[#191615]/15"
                    style={{ backgroundColor: shade.hex }}
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] text-[#6E6560] capitalize leading-none">
                      {cat} · {shade.brand}
                    </div>
                    <div className="text-xs font-medium text-[#191615] truncate mt-0.5">
                      {shade.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          disabled={activeCategories.length === 0}
          onClick={onAddActiveLookToBag}
          className="w-full py-3 px-4 bg-[#191615] text-[#FAF8F6] hover:bg-[#2F2A28] disabled:opacity-40 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Add Active Shades to Bag</span>
          {activeCategories.length > 0 && (
            <span className="font-mono tabular-nums opacity-85">
              · ${totalPrice}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
