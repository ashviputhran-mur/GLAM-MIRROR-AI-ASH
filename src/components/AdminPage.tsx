import React, { useState } from 'react';
import {
  Camera,
  LayoutDashboard,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import {
  COSMETIC_BRANDS,
  EDITORIAL_PRESETS,
  type AiConsultationRecord,
  type BrandShootBooking,
  type CosmeticBrand,
  type MakeupCategory,
  type MakeupShade,
  type StudioModel,
  type UserOrder,
} from '../data/makeupCatalog';

type AdminSection = 'overview' | 'products' | 'models' | 'shoots' | 'orders';

interface MerchandisingBrief {
  headline: string;
  topTrend: string;
  assortmentAction: string;
  recommendedLaunchCategory: string;
}

interface AdminPageProps {
  shades: MakeupShade[];
  archivedProductIds: string[];
  models: StudioModel[];
  orders: UserOrder[];
  consultations: AiConsultationRecord[];
  brandShoots: BrandShootBooking[];
  savedLooksCount: number;
  onAddProduct: (product: Omit<MakeupShade, 'id'>) => Promise<void>;
  onUpdateProduct: (id: string, patch: { price?: number; inStock?: boolean }) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAddModel: (model: Omit<StudioModel, 'id'>) => Promise<void>;
  onDeleteModel: (id: string) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: UserOrder['status']) => Promise<void>;
  onAddBrandShoot: (
    shoot: Omit<BrandShootBooking, 'id'>
  ) => Promise<void>;
  onUpdateBrandShoot: (
    id: string,
    patch: { status?: BrandShootBooking['status']; deliverablesCount?: number }
  ) => Promise<void>;
  onDeleteBrandShoot: (id: string) => Promise<void>;
  onLaunchShootInStudio: (modelId: string, presetName: string) => void;
  onTestInUserStudio: (shade: MakeupShade) => void;
}

const CATEGORIES: MakeupCategory[] = [
  'foundation',
  'lipstick',
  'eyeliner',
  'kajal',
  'eyeshadow',
  'blush',
  'highlighter',
];

export const AdminPage: React.FC<AdminPageProps> = ({
  shades,
  archivedProductIds,
  models,
  orders,
  consultations,
  brandShoots,
  savedLooksCount,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddModel,
  onDeleteModel,
  onUpdateOrderStatus,
  onAddBrandShoot,
  onUpdateBrandShoot,
  onDeleteBrandShoot,
  onLaunchShootInStudio,
  onTestInUserStudio,
}) => {
  const [section, setSection] = useState<AdminSection>('overview');
  const [productQuery, setProductQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<'all' | CosmeticBrand>('all');
  const [shootStatusFilter, setShootStatusFilter] = useState<
    'all' | BrandShootBooking['status']
  >('all');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [isAddingShoot, setIsAddingShoot] = useState(false);

  // Add Product Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdBrand, setNewProdBrand] = useState<CosmeticBrand>('Maison Velours');
  const [newProdCategory, setNewProdCategory] = useState<MakeupCategory>('lipstick');
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdHex, setNewProdHex] = useState('#8B2635');
  const [newProdUndertone, setNewProdUndertone] = useState('Neutral Rose');
  const [newProdPrice, setNewProdPrice] = useState('42');
  const [newProdDesc, setNewProdDesc] = useState('');

  // Add Model Form State
  const [newModelName, setNewModelName] = useState('');
  const [newModelGender, setNewModelGender] = useState<'Female' | 'Male'>('Female');
  const [newModelComplexion, setNewModelComplexion] = useState('Medium-Tan');
  const [newModelUndertone, setNewModelUndertone] = useState('Warm Golden');
  const [newModelShape, setNewModelShape] = useState<StudioModel['faceShape']>('Oval');
  const [newModelImage, setNewModelImage] = useState('');

  // Add Brand Shoot Form State
  const [newShootCampaign, setNewShootCampaign] = useState('');
  const [newShootBrand, setNewShootBrand] = useState<CosmeticBrand>('Maison Velours');
  const [newShootModelId, setNewShootModelId] = useState<string>(
    models[0]?.id || 'model-25'
  );
  const [newShootPreset, setNewShootPreset] = useState<string>(
    EDITORIAL_PRESETS[0]?.name || 'Parisian Matte'
  );
  const [newShootDate, setNewShootDate] = useState<string>('2026-11-18');
  const [newShootDeliverables, setNewShootDeliverables] = useState<string>('12');
  const [newShootNotes, setNewShootNotes] = useState<string>('');

  // Gemini AI Merchandising Brief
  const [brief, setBrief] = useState<MerchandisingBrief | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  const filteredProducts = shades.filter((s) => {
    const matchesBrand = brandFilter === 'all' || s.brand === brandFilter;
    const q = productQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.brand.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q);
    return matchesBrand && matchesQuery;
  });

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;
    await onAddProduct({
      name: newProdName.trim(),
      brand: newProdBrand,
      category: newProdCategory,
      code: newProdCode.trim() || `C-${shades.length + 1}`,
      hex: newProdHex,
      undertone: newProdUndertone.trim() || 'Neutral',
      description:
        newProdDesc.trim() ||
        'Atelier-calibrated pigment formula synced directly to the User Studio.',
      price: Math.max(10, Number(newProdPrice) || 38),
      isCustom: true,
    });
    setNewProdName('');
    setNewProdCode('');
    setNewProdDesc('');
    setIsAddingProduct(false);
  };

  const handleSubmitModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || !newModelImage.trim()) return;
    await onAddModel({
      name: newModelName.trim(),
      gender: newModelGender,
      complexion: newModelComplexion.trim() || 'Medium',
      undertone: newModelUndertone.trim() || 'Neutral',
      faceShape: newModelShape,
      imageUrl: newModelImage.trim(),
      recommendedFoundationId: 'fnd-sand',
      isCustom: true,
    });
    setNewModelName('');
    setNewModelImage('');
    setIsAddingModel(false);
  };

  const handleModelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewModelImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGenerateBrief = async () => {
    setIsGeneratingBrief(true);
    setBriefError(null);
    try {
      const res = await fetch('/api/admin/merchandising-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalProducts: shades.length,
          totalModels: models.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate merchandising brief.');
      }
      setBrief(data as MerchandisingBrief);
    } catch (err: unknown) {
      setBriefError(
        err instanceof Error ? err.message : 'Unable to generate AI brief.'
      );
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const filteredShoots = brandShoots.filter(
    (s) => shootStatusFilter === 'all' || s.status === shootStatusFilter
  );

  const handleSubmitShoot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShootCampaign.trim()) return;
    const assignedModel = models.find((m) => m.id === newShootModelId) || models[0];
    await onAddBrandShoot({
      campaignTitle: newShootCampaign.trim(),
      brand: newShootBrand,
      modelId: assignedModel?.id || newShootModelId,
      modelName: assignedModel?.name || 'Studio Model',
      presetName: newShootPreset,
      shootDate: newShootDate,
      status: 'Scheduled',
      deliverablesCount: Math.max(1, Number(newShootDeliverables) || 12),
      notes: newShootNotes.trim(),
    });
    setNewShootCampaign('');
    setNewShootNotes('');
    setIsAddingShoot(false);
  };

  const NAV_ITEMS: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'products',
      label: `Product Catalog (${shades.length})`,
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: 'models',
      label: `Model Roster (${models.length})`,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'shoots',
      label: `Brand Shoot Tracker (${brandShoots.length})`,
      icon: <Camera className="w-4 h-4" />,
    },
    {
      id: 'orders',
      label: `Orders & AI Log (${orders.length})`,
      icon: <ShoppingBag className="w-4 h-4" />,
    },
  ];

  return (
    <div className="py-8">
      {/* Admin Top Breadcrumb Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#191615]/10">
        <div>
          <div className="text-xs text-[#6E6560]">
            Glam Mirror / Admin Console /{' '}
            <span className="text-[#191615] font-medium capitalize">
              {section === 'shoots' ? 'Brand Shoot Tracker' : section}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#191615] mt-1">
            Atelier Operations &amp; Inventory
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSection('shoots');
              setIsAddingShoot(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B2635] hover:bg-[#6E1D2A] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Schedule Brand Shoot
          </button>
          <button
            type="button"
            onClick={() => {
              setSection('products');
              setIsAddingProduct(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#191615] hover:bg-[#2F2A28] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </button>
          <button
            type="button"
            onClick={() => {
              setSection('models');
              setIsAddingModel(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F3EFEA] text-[#191615] border border-[#191615]/15 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Model
          </button>
        </div>
      </div>

      {/* Sidebar + Main Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-start">
        {/* Sidebar Navigation (240px equivalent on desktop) */}
        <aside className="lg:col-span-3 flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer ${
                section === item.id
                  ? 'bg-[#191615] text-[#FAF8F6]'
                  : 'text-[#5C534E] hover:bg-[#EFEAE4] hover:text-[#191615]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Main Workspace */}
        <div className="lg:col-span-9 flex flex-col gap-6 min-w-0">
          {section === 'overview' && (
            <>
              {/* Flat Tabular Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-[#191615]/10 p-5">
                  <div className="text-xs text-[#6E6560]">Active Shades</div>
                  <div className="font-mono tabular-nums text-2xl font-semibold text-[#191615] mt-1">
                    {shades.length - archivedProductIds.length}
                  </div>
                  <div className="text-[11px] text-[#8E837D] mt-1">
                    {archivedProductIds.length} paused
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#191615]/10 p-5">
                  <div className="text-xs text-[#6E6560]">Studio Models</div>
                  <div className="font-mono tabular-nums text-2xl font-semibold text-[#191615] mt-1">
                    {models.length}
                  </div>
                  <div className="text-[11px] text-[#8E837D] mt-1">
                    {models.filter((m) => m.gender === 'Female').length}F ·{' '}
                    {models.filter((m) => m.gender === 'Male').length}M
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#191615]/10 p-5">
                  <div className="text-xs text-[#6E6560]">Vanity Orders</div>
                  <div className="font-mono tabular-nums text-2xl font-semibold text-[#191615] mt-1">
                    {orders.length}
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-[#8E837D] mt-1">
                    ${totalRevenue} gross
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#191615]/10 p-5">
                  <div className="text-xs text-[#6E6560]">Brand Shoots</div>
                  <div className="font-mono tabular-nums text-2xl font-semibold text-[#191615] mt-1">
                    {brandShoots.length}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSection('shoots')}
                    className="text-[11px] font-medium text-[#8B2635] hover:underline mt-1 cursor-pointer"
                  >
                    Open Shoot Tracker ({brandShoots.filter((s) => s.status !== 'Delivered').length} active) →
                  </button>
                </div>
              </div>

              {/* AI Merchandising Brief Card */}
              <div className="bg-white rounded-xl border border-[#191615]/10 p-6 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium text-[#8B2635]">
                      Gemini Merchandising Intelligence
                    </span>
                    <h2 className="font-display text-2xl font-semibold text-[#191615] mt-0.5">
                      Catalog &amp; Consultation Brief
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateBrief}
                    disabled={isGeneratingBrief}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#8B2635] hover:bg-[#6E1D2A] disabled:opacity-50 text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    {isGeneratingBrief ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {isGeneratingBrief ? 'Analyzing Store…' : 'Generate AI Brief'}
                  </button>
                </div>

                {briefError && (
                  <p className="text-xs text-[#8B2635]">{briefError}</p>
                )}

                {brief ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-[#191615]/10 text-sm">
                    <div>
                      <div className="text-xs font-semibold text-[#191615]">
                        Executive Headline
                      </div>
                      <p className="text-[#5C534E] mt-1">{brief.headline}</p>
                      <div className="text-xs font-semibold text-[#191615] mt-4">
                        Observed Undertone Trend
                      </div>
                      <p className="text-[#5C534E] mt-1">{brief.topTrend}</p>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#191615]">
                        Recommended Assortment Action
                      </div>
                      <p className="text-[#5C534E] mt-1">{brief.assortmentAction}</p>
                      <div className="text-xs font-semibold text-[#191615] mt-4">
                        Priority Launch Category
                      </div>
                      <p className="text-[#8B2635] font-medium mt-1">
                        {brief.recommendedLaunchCategory}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#6E6560] leading-relaxed">
                    Run the Gemini brief to synthesize current product counts, Vanity Bag order items, and recent user AI Shade Match undertones into an executive merchandising recommendation.
                  </p>
                )}
              </div>
            </>
          )}

          {section === 'products' && (
            <div className="flex flex-col gap-5">
              {/* Add Product Form */}
              {isAddingProduct && (
                <form
                  onSubmit={handleSubmitProduct}
                  className="bg-white rounded-xl border border-[#191615]/15 p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-semibold text-[#191615]">
                      Add New Cosmetic Shade
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsAddingProduct(false)}
                      className="text-xs text-[#6E6560] hover:text-[#191615] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Shade Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        placeholder="e.g., Velvet Terracotta"
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Brand House
                      </label>
                      <select
                        value={newProdBrand}
                        onChange={(e) =>
                          setNewProdBrand(e.target.value as CosmeticBrand)
                        }
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm bg-white"
                      >
                        {COSMETIC_BRANDS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Category
                      </label>
                      <select
                        value={newProdCategory}
                        onChange={(e) =>
                          setNewProdCategory(e.target.value as MakeupCategory)
                        }
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm bg-white capitalize"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Pigment Hex
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newProdHex}
                          onChange={(e) => setNewProdHex(e.target.value)}
                          className="w-10 h-9 rounded border border-[#191615]/15 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={newProdHex}
                          onChange={(e) => setNewProdHex(e.target.value)}
                          className="w-full px-2.5 py-2 border border-[#191615]/15 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        SKU Code
                      </label>
                      <input
                        type="text"
                        value={newProdCode}
                        onChange={(e) => setNewProdCode(e.target.value)}
                        placeholder="e.g., MV-99"
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Undertone
                      </label>
                      <input
                        type="text"
                        value={newProdUndertone}
                        onChange={(e) => setNewProdUndertone(e.target.value)}
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={250}
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#5C534E] mb-1">
                      Formulation Description
                    </label>
                    <input
                      type="text"
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      placeholder="Short editorial description shown in User Studio…"
                      className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#8B2635] hover:bg-[#6E1D2A] text-[#FAF8F6] text-xs font-medium rounded-lg cursor-pointer"
                    >
                      Save &amp; Publish to User Studio
                    </button>
                  </div>
                </form>
              )}

              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="search"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search shades, codes, categories…"
                  className="px-3.5 py-2 bg-white border border-[#191615]/15 rounded-lg text-xs w-full sm:w-64"
                />
                <div className="flex items-center gap-1 p-1 bg-[#EFEAE4] rounded-lg overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setBrandFilter('all')}
                    className={`px-2.5 py-1 text-xs rounded cursor-pointer ${
                      brandFilter === 'all'
                        ? 'bg-white text-[#191615] shadow-sm'
                        : 'text-[#6E6560]'
                    }`}
                  >
                    All Brands
                  </button>
                  {COSMETIC_BRANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBrandFilter(b)}
                      className={`px-2.5 py-1 text-xs rounded whitespace-nowrap cursor-pointer ${
                        brandFilter === b
                          ? 'bg-white text-[#191615] shadow-sm'
                          : 'text-[#6E6560]'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Admin Inventory Table */}
              <div className="bg-white rounded-xl border border-[#191615]/10 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#191615]/10 text-[11px] font-medium text-[#6E6560]">
                      <th className="py-3 px-4">Shade</th>
                      <th className="py-3 px-3">Brand</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3 text-right">Price</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#191615]/8 text-xs">
                    {filteredProducts.map((shade) => {
                      const isArchived = archivedProductIds.includes(shade.id);
                      return (
                        <tr key={shade.id} className="hover:bg-[#FAF8F6]">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-5 h-5 rounded-full border border-[#191615]/15 shrink-0"
                                style={{ backgroundColor: shade.hex }}
                              />
                              <div>
                                <div className="font-medium text-[#191615]">
                                  {shade.name}
                                </div>
                                <div className="text-[11px] font-mono text-[#6E6560]">
                                  {shade.code} · {shade.undertone}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-[#5C534E]">
                            {shade.brand}
                          </td>
                          <td className="py-2.5 px-3 capitalize text-[#5C534E]">
                            {shade.category}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                            <input
                              type="number"
                              min={10}
                              max={300}
                              defaultValue={shade.price}
                              onBlur={(e) => {
                                const next = Number(e.target.value);
                                if (next >= 10 && next !== shade.price) {
                                  onUpdateProduct(shade.id, { price: next });
                                }
                              }}
                              aria-label={`Price for ${shade.name}`}
                              className="w-16 text-right px-1.5 py-1 border border-[#191615]/12 rounded bg-white"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateProduct(shade.id, {
                                  inStock: isArchived,
                                })
                              }
                              className={`text-xs font-medium cursor-pointer ${
                                isArchived ? 'text-[#8B2635]' : 'text-[#166534]'
                              }`}
                            >
                              {isArchived ? 'Paused' : 'Active'}
                            </button>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onTestInUserStudio(shade)}
                                className="text-xs font-medium text-[#191615] hover:underline cursor-pointer"
                              >
                                Try
                              </button>
                              {shade.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteProduct(shade.id)}
                                  aria-label={`Delete ${shade.name}`}
                                  className="text-[#8B2635] hover:opacity-75 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'models' && (
            <div className="flex flex-col gap-5">
              {isAddingModel && (
                <form
                  onSubmit={handleSubmitModel}
                  className="bg-white rounded-xl border border-[#191615]/15 p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-semibold text-[#191615]">
                      Register Studio Shoot Model
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsAddingModel(false)}
                      className="text-xs text-[#6E6560] hover:text-[#191615] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Model Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        placeholder="e.g., Model 28 · Sofia"
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Gender
                      </label>
                      <select
                        value={newModelGender}
                        onChange={(e) =>
                          setNewModelGender(e.target.value as 'Female' | 'Male')
                        }
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm bg-white"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Face Shape
                      </label>
                      <select
                        value={newModelShape}
                        onChange={(e) =>
                          setNewModelShape(
                            e.target.value as StudioModel['faceShape']
                          )
                        }
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm bg-white"
                      >
                        {(['Oval', 'Heart', 'Square', 'Diamond', 'Round'] as const).map(
                          (shape) => (
                            <option key={shape} value={shape}>
                              {shape}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Skin Tone / Complexion
                      </label>
                      <input
                        type="text"
                        value={newModelComplexion}
                        onChange={(e) => setNewModelComplexion(e.target.value)}
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Undertone
                      </label>
                      <input
                        type="text"
                        value={newModelUndertone}
                        onChange={(e) => setNewModelUndertone(e.target.value)}
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#5C534E] mb-1">
                      Portrait Image (Upload or URL)
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleModelFileUpload}
                        className="text-xs text-[#5C534E]"
                      />
                      <input
                        type="url"
                        value={newModelImage.startsWith('data:') ? '' : newModelImage}
                        onChange={(e) => setNewModelImage(e.target.value)}
                        placeholder="Or paste portrait URL…"
                        className="flex-1 px-3 py-2 border border-[#191615]/15 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newModelImage}
                      className="px-5 py-2.5 bg-[#8B2635] hover:bg-[#6E1D2A] disabled:opacity-40 text-[#FAF8F6] text-xs font-medium rounded-lg cursor-pointer"
                    >
                      Save Model to Roster
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className="bg-white rounded-xl border border-[#191615]/10 p-4 flex items-center gap-4"
                  >
                    <img
                      src={model.imageUrl}
                      alt={model.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-20 object-cover rounded-lg bg-[#EFEAE4] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-[#191615] truncate">
                        {model.name}
                      </div>
                      <div className="text-xs text-[#5C534E] mt-0.5">
                        {model.gender} · {model.faceShape} Face
                      </div>
                      <div className="text-xs text-[#6E6560]">
                        {model.complexion} · {model.undertone}
                      </div>
                      {model.isCustom && (
                        <button
                          type="button"
                          onClick={() => onDeleteModel(model.id)}
                          className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#8B2635] hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Remove Model
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'shoots' && (
            <div className="flex flex-col gap-5">
              {isAddingShoot && (
                <form
                  onSubmit={handleSubmitShoot}
                  className="bg-white rounded-xl border border-[#191615]/15 p-6 flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-semibold text-[#191615]">
                      Schedule Brand Shoot Assignment
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsAddingShoot(false)}
                      className="text-xs text-[#6E6560] hover:text-[#191615] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Campaign Title
                      </label>
                      <input
                        type="text"
                        required
                        value={newShootCampaign}
                        onChange={(e) => setNewShootCampaign(e.target.value)}
                        placeholder="e.g., Winter Silk Matte Campaign"
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Cosmetic Brand House
                      </label>
                      <select
                        value={newShootBrand}
                        onChange={(e) =>
                          setNewShootBrand(e.target.value as CosmeticBrand)
                        }
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm bg-white"
                      >
                        {COSMETIC_BRANDS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Assigned Studio Model
                      </label>
                      <select
                        value={newShootModelId}
                        onChange={(e) => setNewShootModelId(e.target.value)}
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm bg-white"
                      >
                        {models.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.gender} · {m.complexion})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Editorial Look Preset
                      </label>
                      <select
                        value={newShootPreset}
                        onChange={(e) => setNewShootPreset(e.target.value)}
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm bg-white"
                      >
                        {EDITORIAL_PRESETS.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Shoot Date
                      </label>
                      <input
                        type="date"
                        value={newShootDate}
                        onChange={(e) => setNewShootDate(e.target.value)}
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5C534E] mb-1">
                        Deliverable Portraits
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={newShootDeliverables}
                        onChange={(e) => setNewShootDeliverables(e.target.value)}
                        className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#5C534E] mb-1">
                      Shoot Lighting &amp; Shade Notes
                    </label>
                    <input
                      type="text"
                      value={newShootNotes}
                      onChange={(e) => setNewShootNotes(e.target.value)}
                      placeholder="e.g., Golden Hour strobe with Bordeaux Velvet finish check…"
                      className="w-full px-3 py-2 border border-[#191615]/15 rounded-lg text-sm"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#8B2635] hover:bg-[#6E1D2A] text-[#FAF8F6] text-xs font-medium rounded-lg cursor-pointer"
                    >
                      Save Brand Shoot Booking
                    </button>
                  </div>
                </form>
              )}

              {/* Shoot Status Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 bg-[#EFEAE4] rounded-lg overflow-x-auto">
                  {(
                    [
                      'all',
                      'Scheduled',
                      'In Studio',
                      'Editing',
                      'Delivered',
                    ] as const
                  ).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setShootStatusFilter(st)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                        shootStatusFilter === st
                          ? 'bg-white text-[#191615] shadow-sm'
                          : 'text-[#6E6560] hover:text-[#191615]'
                      }`}
                    >
                      {st === 'all' ? `All Shoots (${brandShoots.length})` : st}
                    </button>
                  ))}
                </div>

                <span className="text-xs font-mono tabular-nums text-[#6E6560]">
                  {brandShoots.reduce((sum, s) => sum + s.deliverablesCount, 0)}{' '}
                  total deliverables scheduled · {savedLooksCount} saved studio frames ·{' '}
                  {consultations.length} AI consultations
                </span>
              </div>

              {/* Brand Shoot Tracker Table */}
              <div className="bg-white rounded-xl border border-[#191615]/10 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#191615]/10 text-[11px] font-medium text-[#6E6560]">
                      <th className="py-3 px-4">Campaign &amp; Brand</th>
                      <th className="py-3 px-3">Assigned Model</th>
                      <th className="py-3 px-3">Look &amp; Shoot Date</th>
                      <th className="py-3 px-3 text-right">Shots</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Mirror &amp; Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#191615]/8 text-xs">
                    {filteredShoots.map((shoot) => {
                      const matchedModel = models.find(
                        (m) => m.id === shoot.modelId
                      );
                      return (
                        <tr key={shoot.id} className="hover:bg-[#FAF8F6]">
                          <td className="py-3 px-4">
                            <div className="font-mono text-[11px] text-[#6E6560]">
                              {shoot.id} · {shoot.brand}
                            </div>
                            <div className="font-semibold text-[#191615] mt-0.5">
                              {shoot.campaignTitle}
                            </div>
                            {shoot.notes && (
                              <div className="text-[11px] text-[#6E6560] max-w-xs truncate mt-0.5">
                                {shoot.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {matchedModel && (
                                <img
                                  src={matchedModel.imageUrl}
                                  alt={shoot.modelName}
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-11 object-cover rounded bg-[#EFEAE4] shrink-0"
                                />
                              )}
                              <div>
                                <div className="font-medium text-[#191615]">
                                  {shoot.modelName}
                                </div>
                                {matchedModel && (
                                  <div className="text-[11px] text-[#6E6560]">
                                    {matchedModel.complexion}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-[#191615]">
                              {shoot.presetName}
                            </div>
                            <div className="text-[11px] font-mono tabular-nums text-[#6E6560]">
                              {shoot.shootDate}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              defaultValue={shoot.deliverablesCount}
                              aria-label={`Deliverables for ${shoot.campaignTitle}`}
                              onBlur={(e) => {
                                const val = Number(e.target.value);
                                if (val >= 1 && val !== shoot.deliverablesCount) {
                                  onUpdateBrandShoot(shoot.id, {
                                    deliverablesCount: val,
                                  });
                                }
                              }}
                              className="w-14 text-right px-1.5 py-1 border border-[#191615]/12 rounded bg-white"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={shoot.status}
                              onChange={(e) =>
                                onUpdateBrandShoot(shoot.id, {
                                  status: e.target
                                    .value as BrandShootBooking['status'],
                                })
                              }
                              aria-label={`Status for ${shoot.campaignTitle}`}
                              className="px-2.5 py-1 border border-[#191615]/15 rounded bg-white text-xs"
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="In Studio">In Studio</option>
                              <option value="Editing">Editing</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  onLaunchShootInStudio(
                                    shoot.modelId,
                                    shoot.presetName
                                  )
                                }
                                className="text-xs font-medium text-[#8B2635] hover:text-[#6E1D2A] whitespace-nowrap cursor-pointer"
                              >
                                Launch Shoot →
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteBrandShoot(shoot.id)}
                                aria-label={`Delete ${shoot.campaignTitle}`}
                                className="text-[#6E6560] hover:text-[#8B2635] cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'orders' && (
            <div className="flex flex-col gap-6">
              {/* Vanity Bag Orders Table */}
              <div className="bg-white rounded-xl border border-[#191615]/10 overflow-x-auto">
                <div className="px-5 py-4 border-b border-[#191615]/10 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-semibold text-[#191615]">
                    Customer Vanity Bag Orders
                  </h2>
                  <span className="text-xs font-mono tabular-nums text-[#6E6560]">
                    {orders.length} total
                  </span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#191615]/10 text-[11px] font-medium text-[#6E6560]">
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Items</th>
                      <th className="py-3 px-3 text-right">Total</th>
                      <th className="py-3 px-4 text-right">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#191615]/8 text-xs">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAF8F6]">
                        <td className="py-3 px-4 font-mono tabular-nums font-medium text-[#191615]">
                          {order.id}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-[#191615]">
                            {order.customerName}
                          </div>
                          <div className="text-[11px] text-[#6E6560]">
                            {order.customerEmail}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-[#5C534E]">
                          {order.items
                            .map((i) => `${i.name} (×${i.quantity})`)
                            .join(', ')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-medium text-[#191615]">
                          ${order.total}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              onUpdateOrderStatus(
                                order.id,
                                e.target.value as UserOrder['status']
                              )
                            }
                            aria-label={`Order status for ${order.id}`}
                            className="px-2.5 py-1 border border-[#191615]/15 rounded bg-white text-xs"
                          >
                            <option value="Preparing">Preparing</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AI Consultation Log Table */}
              <div className="bg-white rounded-xl border border-[#191615]/10 overflow-x-auto">
                <div className="px-5 py-4 border-b border-[#191615]/10 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-semibold text-[#191615]">
                    AI Shade Match Consultations
                  </h2>
                  <span className="text-xs font-mono tabular-nums text-[#6E6560]">
                    {consultations.length} logged
                  </span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#191615]/10 text-[11px] font-medium text-[#6E6560]">
                      <th className="py-3 px-4">Look Prescribed</th>
                      <th className="py-3 px-3">Complexion</th>
                      <th className="py-3 px-3">Undertone</th>
                      <th className="py-3 px-3">Occasion</th>
                      <th className="py-3 px-4 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#191615]/8 text-xs">
                    {consultations.map((c) => (
                      <tr key={c.id} className="hover:bg-[#FAF8F6]">
                        <td className="py-3 px-4 font-medium text-[#191615]">
                          {c.lookTitle}
                        </td>
                        <td className="py-3 px-3 text-[#5C534E]">
                          {c.complexionDepth}
                        </td>
                        <td className="py-3 px-3 text-[#5C534E]">
                          {c.undertone}
                        </td>
                        <td className="py-3 px-3 text-[#6E6560]">
                          {c.occasion}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-[#6E6560]">
                          {new Date(c.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
