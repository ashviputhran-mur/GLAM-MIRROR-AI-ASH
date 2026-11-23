import React, { useMemo, useState } from 'react';
import { Check, Eye, Plus, Search } from 'lucide-react';
import {
  COSMETIC_BRANDS,
  MUA_KIT_DIVISIONS,
  PRO_MUA_PRODUCTS,
  SHOWCASE_PRODUCT_IMAGE,
  type CosmeticBrand,
  type MakeupCategory,
  type MakeupShade,
  type MuaKitDivision,
  type MuaKitProduct,
} from '../data/makeupCatalog';

interface CollectionSectionProps {
  shades: MakeupShade[];
  selectedKitIds: string[];
  onToggleKitItem: (kitId: string) => void;
  onAddKitProductToBag: (product: MuaKitProduct) => void;
  onTryShadeInMirror: (shade: MakeupShade) => void;
  onAddToBag: (shade: MakeupShade) => void;
}

const SHADE_CATEGORY_TABS: { id: 'all' | MakeupCategory; label: string }[] = [
  { id: 'all', label: 'All Swatches' },
  { id: 'foundation', label: 'Foundation' },
  { id: 'lipstick', label: 'Lipstick' },
  { id: 'eyeliner', label: 'Eyeliner' },
  { id: 'kajal', label: 'Kajal' },
  { id: 'eyeshadow', label: 'Eyeshadow' },
  { id: 'blush', label: 'Blush' },
  { id: 'highlighter', label: 'Highlighter' },
];

export const CollectionSection: React.FC<CollectionSectionProps> = ({
  shades,
  selectedKitIds,
  onToggleKitItem,
  onAddKitProductToBag,
  onTryShadeInMirror,
  onAddToBag,
}) => {
  const [catalogMode, setCatalogMode] = useState<'mua-kit' | 'shades'>(
    'mua-kit'
  );
  const [divisionFilter, setDivisionFilter] = useState<'all' | MuaKitDivision>(
    'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<'all' | MakeupCategory>(
    'all'
  );
  const [brandFilter, setBrandFilter] = useState<'all' | CosmeticBrand>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredKitProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PRO_MUA_PRODUCTS.filter((item) => {
      const matchDivision =
        divisionFilter === 'all' || item.division === divisionFilter;
      const matchBrand = brandFilter === 'all' || item.brand === brandFilter;
      const matchQuery =
        !q ||
        item.itemName.toLowerCase().includes(q) ||
        item.productTitle.toLowerCase().includes(q) ||
        item.division.toLowerCase().includes(q) ||
        item.finishNote.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q);
      return matchDivision && matchBrand && matchQuery;
    });
  }, [divisionFilter, brandFilter, searchQuery]);

  const filteredShades = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return shades.filter((shade) => {
      const matchCategory =
        categoryFilter === 'all' || shade.category === categoryFilter;
      const matchBrand = brandFilter === 'all' || shade.brand === brandFilter;
      const matchQuery =
        !q ||
        shade.name.toLowerCase().includes(q) ||
        shade.category.toLowerCase().includes(q) ||
        shade.brand.toLowerCase().includes(q) ||
        shade.undertone.toLowerCase().includes(q);
      return matchCategory && matchBrand && matchQuery;
    });
  }, [shades, categoryFilter, brandFilter, searchQuery]);

  const visibleShades =
    categoryFilter === 'all' && brandFilter === 'all' && !searchQuery.trim()
      ? filteredShades.slice(0, 12)
      : filteredShades;

  const handleTryKitProduct = (item: MuaKitProduct) => {
    if (!item.tryOnShadeId) return;
    const matched = shades.find((s) => s.id === item.tryOnShadeId);
    if (matched) {
      onTryShadeInMirror(matched);
    }
  };

  return (
    <section
      id="collection"
      className="border-t border-[#191615]/10 py-14 flex flex-col gap-10"
    >
      {/* Editorial Product Lead */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-5 flex flex-col justify-center gap-4">
          <span className="text-xs font-medium text-[#8B2635]">
            Cosmetic Houses, Model Kit &amp; Prep Formulations
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#191615] text-balance">
            Complete MUA &amp; Model Product Kit
          </h2>
          <p className="text-sm text-[#5C534E] leading-relaxed">
            Browse all {PRO_MUA_PRODUCTS.length} artist and model essentials across Face Makeup, Eye Makeup, Lip Makeup, Skincare &amp; Preparation, Makeup Tools, and Body &amp; Professional Makeup alongside our 46+ live mirror pigment swatches. Add items to your Vanity Bag or tag them into your look kit for social sharing.
          </p>
        </div>

        <div className="lg:col-span-7 rounded-xl overflow-hidden bg-[#EFEAE4] border border-[#191615]/10 aspect-[4/3] lg:aspect-auto lg:h-[340px]">
          <img
            src={SHOWCASE_PRODUCT_IMAGE}
            alt="Minimalist champagne gold lipsticks and pressed powder compact on travertine stone"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Mode Switcher + Search + Brand Filter */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-display text-2xl font-semibold text-[#191615]">
              {catalogMode === 'mua-kit'
                ? `MUA & Model Kit (${filteredKitProducts.length})`
                : `Try-On Shades (${visibleShades.length})`}
            </h3>

            {/* Catalog View Switcher */}
            <div className="flex items-center gap-1 p-1 bg-[#EFEAE4] rounded-lg">
              <button
                type="button"
                onClick={() => setCatalogMode('mua-kit')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  catalogMode === 'mua-kit'
                    ? 'bg-white text-[#191615] shadow-sm'
                    : 'text-[#6E6560] hover:text-[#191615]'
                }`}
              >
                Full MUA Kit ({PRO_MUA_PRODUCTS.length})
              </button>
              <button
                type="button"
                onClick={() => setCatalogMode('shades')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  catalogMode === 'shades'
                    ? 'bg-white text-[#191615] shadow-sm'
                    : 'text-[#6E6560] hover:text-[#191615]'
                }`}
              >
                Live Mirror Shades ({shades.length})
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6E6560] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search primer, kajal, lip gloss…"
                className="pl-8 pr-3 py-1.5 bg-white border border-[#191615]/15 rounded-lg text-xs text-[#191615] placeholder:text-[#8E837D] w-56 focus:outline-none focus:border-[#8B2635]"
              />
            </div>

            {/* Brand Filter */}
            <div className="flex items-center gap-1 p-1 bg-[#EFEAE4] rounded-lg overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setBrandFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  brandFilter === 'all'
                    ? 'bg-[#191615] text-[#FAF8F6] shadow-sm'
                    : 'text-[#6E6560] hover:text-[#191615]'
                }`}
              >
                All Brands
              </button>
              {COSMETIC_BRANDS.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setBrandFilter(brand)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    brandFilter === brand
                      ? 'bg-[#191615] text-[#FAF8F6] shadow-sm'
                      : 'text-[#6E6560] hover:text-[#191615]'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Division or Shade Category Tabs */}
        {catalogMode === 'mua-kit' ? (
          <div className="flex items-center gap-1 p-1 bg-[#EFEAE4] rounded-lg overflow-x-auto self-start max-w-full">
            <button
              type="button"
              onClick={() => setDivisionFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                divisionFilter === 'all'
                  ? 'bg-white text-[#191615] shadow-sm'
                  : 'text-[#6E6560] hover:text-[#191615]'
              }`}
            >
              All Divisions ({PRO_MUA_PRODUCTS.length})
            </button>
            {MUA_KIT_DIVISIONS.map((div) => {
              const count = PRO_MUA_PRODUCTS.filter(
                (p) => p.division === div
              ).length;
              return (
                <button
                  key={div}
                  type="button"
                  onClick={() => setDivisionFilter(div)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    divisionFilter === div
                      ? 'bg-white text-[#191615] shadow-sm'
                      : 'text-[#6E6560] hover:text-[#191615]'
                  }`}
                >
                  {div} ({count})
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1 p-1 bg-[#EFEAE4] rounded-lg overflow-x-auto self-start max-w-full">
            {SHADE_CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-white text-[#191615] shadow-sm'
                    : 'text-[#6E6560] hover:text-[#191615]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Grid */}
      {catalogMode === 'mua-kit' ? (
        filteredKitProducts.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-xl border border-[#191615]/10">
            <p className="font-display text-2xl text-[#191615]">
              No MUA kit products match these filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setBrandFilter('all');
                setDivisionFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-[#191615] text-[#FAF8F6] text-xs font-medium rounded-lg cursor-pointer"
            >
              Show All {PRO_MUA_PRODUCTS.length} Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKitProducts.map((item) => {
              const inKit = selectedKitIds.includes(item.id);
              const canTryOn = Boolean(item.tryOnShadeId);
              return (
                <article
                  key={item.id}
                  className="bg-white rounded-xl border border-[#191615]/10 p-5 flex flex-col justify-between gap-4 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150"
                >
                  <div>
                    <div className="h-32 rounded-lg bg-[#F5F1EC] flex items-center justify-center relative overflow-hidden mb-4">
                      <div
                        className="w-16 h-16 rounded-full shadow-inner border border-[#191615]/12"
                        style={{ backgroundColor: item.hex }}
                      />
                      <span className="absolute top-2.5 left-3 text-[11px] font-medium text-[#5C534E]">
                        {item.brand}
                      </span>
                      <span className="absolute bottom-2.5 right-3 text-[11px] font-mono tabular-nums text-[#6E6560]">
                        {item.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#6E6560]">
                      <span className="font-medium text-[#8B2635]">
                        {item.division}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.finishNote}</span>
                    </div>

                    <div className="flex items-baseline justify-between gap-4 mt-1">
                      <h4 className="text-base font-semibold text-[#191615]">
                        {item.itemName}
                      </h4>
                      <span className="text-[15px] font-mono tabular-nums text-[#191615] shrink-0">
                        ${item.price}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-[#5C534E] mt-0.5">
                      {item.productTitle}
                    </div>

                    <p className="text-xs text-[#6E6560] mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-[#191615]/8">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleKitItem(item.id)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          inKit
                            ? 'bg-[#EFEAE4] border-[#191615]/25 text-[#191615]'
                            : 'bg-[#FAF8F6] hover:bg-[#EFEAE4] border-[#191615]/12 text-[#5C534E]'
                        }`}
                      >
                        {inKit ? (
                          <Check className="w-3.5 h-3.5 text-[#8B2635]" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>{inKit ? 'In Look Kit' : 'Tag in Kit'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onAddKitProductToBag(item)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#191615] hover:bg-[#2F2A28] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Bag</span>
                      </button>
                    </div>

                    {canTryOn && (
                      <button
                        type="button"
                        onClick={() => handleTryKitProduct(item)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-[#FAF8F6] text-[#8B2635] border border-[#8B2635]/20 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview in Live Mirror</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : visibleShades.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-[#191615]/10">
          <p className="font-display text-2xl text-[#191615]">
            No products match this brand and category combination.
          </p>
          <button
            type="button"
            onClick={() => {
              setBrandFilter('all');
              setCategoryFilter('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-[#191615] text-[#FAF8F6] text-xs font-medium rounded-lg cursor-pointer"
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleShades.map((shade) => (
            <article
              key={shade.id}
              className="bg-white rounded-xl border border-[#191615]/10 p-5 flex flex-col justify-between gap-5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150"
            >
              <div>
                <div className="h-36 rounded-lg bg-[#F5F1EC] flex items-center justify-center relative overflow-hidden mb-4">
                  <div
                    className="w-20 h-20 rounded-full shadow-inner border border-[#191615]/10"
                    style={{ backgroundColor: shade.hex }}
                  />
                  <span className="absolute top-2.5 left-3 text-[11px] font-medium text-[#5C534E]">
                    {shade.brand}
                  </span>
                  <span className="absolute bottom-2.5 right-3 text-[11px] font-mono tabular-nums text-[#6E6560]">
                    {shade.code}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#6E6560] capitalize">
                  <span>{shade.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{shade.undertone}</span>
                  {shade.defaultFinish && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{shade.defaultFinish}</span>
                    </>
                  )}
                </div>

                <div className="flex items-baseline justify-between gap-4 mt-1">
                  <h4 className="text-base font-semibold text-[#191615]">
                    {shade.name}
                  </h4>
                  <span className="text-[15px] font-mono tabular-nums text-[#191615] shrink-0">
                    ${shade.price}
                  </span>
                </div>

                <p className="text-xs text-[#6E6560] mt-2 leading-relaxed">
                  {shade.description}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#191615]/8">
                <button
                  type="button"
                  onClick={() => onTryShadeInMirror(shade)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#FAF8F6] hover:bg-[#EFEAE4] text-[#191615] border border-[#191615]/12 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Try on Model
                </button>
                <button
                  type="button"
                  onClick={() => onAddToBag(shade)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#191615] hover:bg-[#2F2A28] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Bag
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
