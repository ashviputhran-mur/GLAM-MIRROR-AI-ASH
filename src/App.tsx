import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import {
  DEFAULT_LOOK_STATE,
  DEFAULT_MUA_KIT_IDS,
  EDITORIAL_PRESETS,
  MAKEUP_SHADES,
  STUDIO_MODELS,
  getShadeById,
  syncCatalogRegistry,
  type AiConsultationRecord,
  type BrandShootBooking,
  type ClaimedChallengeEntry,
  type EditorialPreset,
  type LightingMode,
  type MakeupCategory,
  type MakeupLookState,
  type MakeupShade,
  type MuaKitProduct,
  type RedeemedRewardEntry,
  type StudioModel,
  type UserOrder,
  type WaterIntakeEntry,
  type WeeklyChallengeId,
} from './data/makeupCatalog';
import { HomePage } from './components/HomePage';
import { UserPage } from './components/UserPage';
import { AdminPage } from './components/AdminPage';
import type { MirrorSourceMode } from './components/MirrorViewport';
import type { AtelierTab } from './components/AtelierControls';
import type { AiAnalysisResult } from './components/AiConsultationSection';
import { VanityBagDrawer, type BagItem } from './components/VanityBagDrawer';
import {
  LookbookDrawer,
  type SavedLookSnapshot,
  type SharedSocialPost,
} from './components/LookbookDrawer';
import { QuickStartModal } from './components/QuickStartModal';

type AppRoute = 'home' | 'user' | 'admin';

interface BootstrapPayload {
  customProducts: MakeupShade[];
  productOverrides: Record<string, { price?: number; inStock?: boolean }>;
  archivedProductIds: string[];
  customModels: StudioModel[];
  savedLooks: SavedLookSnapshot[];
  orders: UserOrder[];
  aiConsultations: AiConsultationRecord[];
  waterIntakeLogs: WaterIntakeEntry[];
  brandShoots: BrandShootBooking[];
  redeemedRewards?: RedeemedRewardEntry[];
  challengeCheckIns?: Record<string, string[]>;
  claimedChallengeRewards?: ClaimedChallengeEntry[];
  socialPosts?: SharedSocialPost[];
  selectedKitIds?: string[];
  bagItems?: BagItem[];
}

function routeFromPathname(pathname: string): AppRoute {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/user')) return 'user';
  return 'home';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window !== 'undefined'
      ? routeFromPathname(window.location.pathname)
      : 'home'
  );

  // Full-stack persisted state hydrated from /api/bootstrap
  const [customProducts, setCustomProducts] = useState<MakeupShade[]>([]);
  const [productOverrides, setProductOverrides] = useState<
    Record<string, { price?: number; inStock?: boolean }>
  >({});
  const [archivedProductIds, setArchivedProductIds] = useState<string[]>([]);
  const [customModels, setCustomModels] = useState<StudioModel[]>([]);
  const [snapshots, setSnapshots] = useState<SavedLookSnapshot[]>([]);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [consultations, setConsultations] = useState<AiConsultationRecord[]>([]);
  const [waterIntakeLogs, setWaterIntakeLogs] = useState<WaterIntakeEntry[]>([]);
  const [brandShoots, setBrandShoots] = useState<BrandShootBooking[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedRewardEntry[]>(
    []
  );
  const [challengeCheckIns, setChallengeCheckIns] = useState<
    Record<string, string[]>
  >({});
  const [claimedChallenges, setClaimedChallenges] = useState<
    ClaimedChallengeEntry[]
  >([]);
  const [socialPosts, setSocialPosts] = useState<SharedSocialPost[]>([]);

  // Studio UI state
  const [sourceMode, setSourceMode] = useState<MirrorSourceMode>('model');
  const [selectedModelId, setSelectedModelId] = useState<string>(
    STUDIO_MODELS[0].id
  );
  const [lighting, setLighting] = useState<LightingMode>('Daylight');
  const [look, setLook] = useState<MakeupLookState>(DEFAULT_LOOK_STATE);
  const [selectedKitIds, setSelectedKitIds] =
    useState<string[]>(DEFAULT_MUA_KIT_IDS);
  const [activeTab, setActiveTab] = useState<AtelierTab>('lipstick');

  // AI Shade Consultation state
  const [occasion, setOccasion] = useState('Signature Everyday');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);

  // Vanity Bag & Photo Studio Drawers
  const [bagItems, setBagItems] = useState<BagItem[]>([]);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isLookbookOpen, setIsLookbookOpen] = useState(false);
  const [initialShareSnapshotId, setInitialShareSnapshotId] = useState<
    string | null
  >(null);
  const [isQuickStartOpen, setIsQuickStartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    setRoute(nextRoute);
    const targetPath =
      nextRoute === 'home' ? '/' : nextRoute === 'user' ? '/user' : '/admin';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setRoute(routeFromPathname(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const refreshBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) return;
      const data = (await res.json()) as BootstrapPayload;
      setCustomProducts(data.customProducts || []);
      setProductOverrides(data.productOverrides || {});
      setArchivedProductIds(data.archivedProductIds || []);
      setCustomModels(data.customModels || []);
      setSnapshots(data.savedLooks || []);
      setOrders(data.orders || []);
      setConsultations(data.aiConsultations || []);
      setWaterIntakeLogs(data.waterIntakeLogs || []);
      setBrandShoots(data.brandShoots || []);
      setRedeemedRewards(data.redeemedRewards || []);
      setChallengeCheckIns(data.challengeCheckIns || {});
      setClaimedChallenges(data.claimedChallengeRewards || []);
      setSocialPosts(data.socialPosts || []);
      if (Array.isArray(data.selectedKitIds)) {
        setSelectedKitIds(data.selectedKitIds);
      }
      if (Array.isArray(data.bagItems)) {
        setBagItems(data.bagItems);
      }
    } catch {
      // Keep default local catalog if network unavailable
    }
  }, []);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  // Merged catalog with Admin overrides
  const allShades = useMemo(() => {
    const merged = [...customProducts, ...MAKEUP_SHADES].map((shade) => {
      const ov = productOverrides[shade.id];
      return {
        ...shade,
        price: ov?.price ?? shade.price,
        inStock: !archivedProductIds.includes(shade.id),
      };
    });
    syncCatalogRegistry(merged);
    return merged;
  }, [customProducts, productOverrides, archivedProductIds]);

  const activeUserShades = useMemo(
    () => allShades.filter((s) => !archivedProductIds.includes(s.id)),
    [allShades, archivedProductIds]
  );

  const allModels = useMemo(
    () => [...STUDIO_MODELS, ...customModels],
    [customModels]
  );

  const selectedModel = useMemo(
    () => allModels.find((m) => m.id === selectedModelId) || allModels[0],
    [allModels, selectedModelId]
  );

  const handleSelectModel = (model: StudioModel) => {
    setSelectedModelId(model.id);
    setLook((prev) => ({
      ...prev,
      foundation: {
        ...prev.foundation,
        shadeId: model.recommendedFoundationId,
      },
    }));
  };

  const handleApplyPreset = (preset: EditorialPreset) => {
    setLook((prev) => ({
      foundation: {
        ...prev.foundation,
        enabled: true,
        finish: preset.foundationFinish,
        intensity: preset.foundationIntensity,
      },
      lipstick: {
        enabled: true,
        shadeId: preset.lipstickId,
        finish: preset.lipstickFinish,
        intensity: preset.lipstickIntensity,
      },
      eyeliner: {
        enabled: true,
        shadeId: preset.eyelinerId,
        style: preset.eyelinerStyle,
        intensity: preset.eyelinerIntensity,
        thickness: preset.eyelinerThickness,
      },
      kajal: {
        enabled: true,
        shadeId: preset.kajalId,
        style: preset.kajalStyle,
        intensity: preset.kajalIntensity,
        thickness: 4,
      },
      eyeshadow: {
        enabled: true,
        shadeId: preset.eyeshadowId,
        finish: preset.eyeshadowFinish,
        intensity: preset.eyeshadowIntensity,
      },
      blush: {
        enabled: true,
        shadeId: preset.blushId,
        finish: preset.blushFinish,
        intensity: preset.blushIntensity,
      },
      highlighter: {
        enabled: true,
        shadeId: preset.highlighterId,
        finish: preset.highlighterFinish,
        intensity: preset.highlighterIntensity,
      },
    }));
    showToast(`Applied "${preset.name}" to mirror`);
  };

  const handleResetLook = () => {
    setLook((prev) => ({
      foundation: { ...prev.foundation, enabled: false },
      lipstick: { ...prev.lipstick, enabled: false },
      eyeliner: { ...prev.eyeliner, enabled: false },
      kajal: { ...prev.kajal, enabled: false },
      eyeshadow: { ...prev.eyeshadow, enabled: false },
      blush: { ...prev.blush, enabled: false },
      highlighter: { ...prev.highlighter, enabled: false },
    }));
    showToast('Reset to bare complexion');
  };

  const syncBagToServer = useCallback(async (nextItems: BagItem[]) => {
    try {
      await fetch('/api/bag', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bagItems: nextItems }),
      });
    } catch {
      // Keep local cart responsive
    }
  }, []);

  const addShadeToBag = useCallback(
    (shade: MakeupShade, finishLabel: string) => {
      setBagItems((prev) => {
        const existing = prev.find((item) => item.shade.id === shade.id);
        const next = existing
          ? prev.map((item) =>
              item.shade.id === shade.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : [...prev, { shade, finishLabel, quantity: 1 }];
        syncBagToServer(next);
        return next;
      });
    },
    [syncBagToServer]
  );

  const handleAddActiveLookToBag = () => {
    const categories: MakeupCategory[] = [
      'foundation',
      'lipstick',
      'eyeliner',
      'kajal',
      'eyeshadow',
      'blush',
      'highlighter',
    ];
    let addedCount = 0;

    categories.forEach((cat) => {
      if (look[cat].enabled && look[cat].intensity > 0) {
        const shade = getShadeById(look[cat].shadeId);
        if (shade) {
          const finishLabel =
            cat === 'eyeliner'
              ? look.eyeliner.style
              : cat === 'kajal'
                ? look.kajal.style
                : look[cat].finish;
          addShadeToBag(shade, finishLabel);
          addedCount += 1;
        }
      }
    });

    if (addedCount > 0) {
      setIsBagOpen(true);
    }
  };

  const handleTryShadeInMirror = (shade: MakeupShade) => {
    setLook((prev) => {
      if (shade.category === 'lipstick') {
        return {
          ...prev,
          lipstick: {
            ...prev.lipstick,
            enabled: true,
            shadeId: shade.id,
            intensity: Math.max(55, prev.lipstick.intensity),
            finish:
              (shade.defaultFinish as typeof prev.lipstick.finish) ||
              prev.lipstick.finish,
          },
        };
      }
      if (shade.category === 'eyeshadow') {
        return {
          ...prev,
          eyeshadow: {
            ...prev.eyeshadow,
            enabled: true,
            shadeId: shade.id,
            intensity: Math.max(45, prev.eyeshadow.intensity),
            finish:
              (shade.defaultFinish as typeof prev.eyeshadow.finish) ||
              prev.eyeshadow.finish,
          },
        };
      }
      if (shade.category === 'blush') {
        return {
          ...prev,
          blush: {
            ...prev.blush,
            enabled: true,
            shadeId: shade.id,
            intensity: Math.max(45, prev.blush.intensity),
            finish:
              (shade.defaultFinish as typeof prev.blush.finish) ||
              prev.blush.finish,
          },
        };
      }
      if (shade.category === 'highlighter') {
        return {
          ...prev,
          highlighter: {
            ...prev.highlighter,
            enabled: true,
            shadeId: shade.id,
            intensity: Math.max(42, prev.highlighter.intensity),
            finish:
              (shade.defaultFinish as typeof prev.highlighter.finish) ||
              prev.highlighter.finish,
          },
        };
      }
      return {
        ...prev,
        [shade.category]: {
          ...prev[shade.category],
          enabled: true,
          shadeId: shade.id,
          intensity: Math.max(45, prev[shade.category].intensity),
        },
      };
    });
    setActiveTab(shade.category);
    if (route === 'admin') {
      navigate('user');
    } else {
      document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
    }
    showToast(`Testing ${shade.name} in mirror`);
  };

  const handleAddSingleShadeToBag = (shade: MakeupShade) => {
    const finishLabel =
      shade.defaultFinish ||
      (shade.category === 'eyeliner' || shade.category === 'kajal'
        ? 'Precision Kohl'
        : 'Natural Satin');
    addShadeToBag(shade, finishLabel);
    showToast(`Added ${shade.name} to Vanity Bag`);
  };

  const handleToggleKitItem = useCallback((kitId: string) => {
    setSelectedKitIds((prev) => {
      const next = prev.includes(kitId)
        ? prev.filter((id) => id !== kitId)
        : [...prev, kitId];
      fetch('/api/kit-selection', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedKitIds: next }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const handleAddKitProductToBag = (product: MuaKitProduct) => {
    const shadeLike: MakeupShade = {
      id: product.id,
      category: product.tryOnCategory || 'foundation',
      brand: product.brand,
      name: `${product.itemName} · ${product.productTitle}`,
      code: product.code,
      hex: product.hex,
      undertone: product.division,
      description: product.description,
      price: product.price,
      defaultFinish: product.finishNote,
    };
    addShadeToBag(shadeLike, product.finishNote);
    showToast(`Added ${product.itemName} to Vanity Bag`);
  };

  const handleCaptureLook = async (dataUrl: string, modelLabel: string) => {
    const snapshot: SavedLookSnapshot = {
      id: `${Date.now()}`,
      imageUrl: dataUrl,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      modelLabel,
      look: structuredClone(look),
      kitItemIds: [...selectedKitIds],
    };
    setSnapshots((prev) => [snapshot, ...prev]);
    setIsLookbookOpen(true);
    showToast('Saved glamour photo to Photo Studio');

    try {
      await fetch('/api/saved-looks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });
    } catch {
      // Keep local snapshot even if network save fails
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    await fetch(`/api/saved-looks/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const handleRunAiAnalysis = async (bareImageBase64: string) => {
    setIsAnalyzingAi(true);
    setAiError(null);
    document.getElementById('ai-consultation')?.scrollIntoView({
      behavior: 'smooth',
    });

    try {
      const response = await fetch('/api/analyze-look', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: bareImageBase64,
          mimeType: 'image/jpeg',
          occasion,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to complete shade match analysis.');
      }

      setAiResult(data as AiAnalysisResult);
      refreshBootstrap();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Unable to connect to AI colorist.';
      setAiError(msg);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleApplyAiRecommendation = (rec: AiAnalysisResult) => {
    setLook({
      foundation: {
        enabled: true,
        shadeId: rec.foundationId,
        finish: rec.foundationFinish,
        intensity: rec.foundationIntensity,
      },
      lipstick: {
        enabled: true,
        shadeId: rec.lipstickId,
        finish: rec.lipstickFinish,
        intensity: rec.lipstickIntensity,
      },
      eyeliner: {
        enabled: true,
        shadeId: rec.eyelinerId,
        style: rec.eyelinerStyle,
        intensity: rec.eyelinerIntensity,
        thickness: rec.eyelinerThickness,
      },
      kajal: {
        enabled: true,
        shadeId: rec.kajalId,
        style: rec.kajalStyle,
        intensity: rec.kajalIntensity,
        thickness: 4,
      },
      eyeshadow: {
        enabled: true,
        shadeId: rec.eyeshadowId,
        finish: rec.eyeshadowFinish,
        intensity: rec.eyeshadowIntensity,
      },
      blush: {
        enabled: true,
        shadeId: rec.blushId,
        finish: rec.blushFinish,
        intensity: rec.blushIntensity,
      },
      highlighter: {
        enabled: true,
        shadeId: rec.highlighterId,
        finish: rec.highlighterFinish,
        intensity: rec.highlighterIntensity,
      },
    });
    document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
    showToast(`Applied "${rec.lookTitle}" to live mirror`);
  };

  // Full-stack Order Submission
  const handleSubmitOrder = async (
    customerName: string,
    customerEmail: string
  ): Promise<UserOrder> => {
    const subtotal = bagItems.reduce(
      (sum, item) => sum + item.shade.price * item.quantity,
      0
    );
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        customerEmail,
        items: bagItems.map((i) => ({
          shadeId: i.shade.id,
          name: i.shade.name,
          brand: i.shade.brand,
          category: i.shade.category,
          finishLabel: i.finishLabel,
          price: i.shade.price,
          quantity: i.quantity,
        })),
        total: subtotal,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to place order.');
    }
    const created = data as UserOrder;
    setOrders((prev) => [created, ...prev]);
    setBagItems([]);
    showToast(`Order ${created.id} submitted`);
    return created;
  };

  // Admin Mutations
  const handleAddProduct = async (product: Omit<MakeupShade, 'id'>) => {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (res.ok) {
      await refreshBootstrap();
      showToast(`Published "${product.name}" to User Studio`);
    }
  };

  const handleUpdateProduct = async (
    id: string,
    patch: { price?: number; inStock?: boolean }
  ) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      await refreshBootstrap();
      showToast('Updated product catalog');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await refreshBootstrap();
      showToast('Removed custom product');
    }
  };

  const handleAddModel = async (model: Omit<StudioModel, 'id'>) => {
    const res = await fetch('/api/admin/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model),
    });
    if (res.ok) {
      await refreshBootstrap();
      showToast(`Added "${model.name}" to studio roster`);
    }
  };

  const handleDeleteModel = async (id: string) => {
    const res = await fetch(`/api/admin/models/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await refreshBootstrap();
      showToast('Removed model from roster');
    }
  };

  const handleUpdateOrderStatus = async (
    id: string,
    status: UserOrder['status']
  ) => {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await refreshBootstrap();
      showToast(`Order ${id} marked ${status}`);
    }
  };

  const handleLogWaterIntake = async (payload: {
    date: string;
    glasses: number;
    ml: number;
    note?: string;
  }) => {
    const res = await fetch('/api/water-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setWaterIntakeLogs(data.waterIntakeLogs || []);
      if (data.aiConsultations) {
        setConsultations(data.aiConsultations);
      }
      showToast(
        `Logged ${payload.ml} ml · Hydration Score ${data.entry?.hydrationScore}/100`
      );
    }
  };

  const handleRedeemReward = async (payload: {
    id: string;
    title: string;
    cost: number;
    codePrefix: string;
  }) => {
    const res = await fetch('/api/rewards/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setRedeemedRewards(data.redeemedRewards || []);
      showToast(`Claimed ${data.voucher?.voucherCode} · ${payload.title}`);
    } else if (data.error) {
      showToast(data.error);
    }
  };

  const handleClearRedeemedRewards = async () => {
    const res = await fetch('/api/rewards/redeemed', { method: 'DELETE' });
    if (res.ok) {
      setRedeemedRewards([]);
      showToast('Cleared claimed rewards');
    }
  };

  const handleCheckInChallenge = async (
    challengeId: WeeklyChallengeId,
    action: 'add' | 'undo' = 'add'
  ) => {
    const res = await fetch('/api/challenges/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, action }),
    });
    const data = await res.json();
    if (res.ok) {
      setChallengeCheckIns(data.challengeCheckIns || {});
      showToast(
        action === 'undo'
          ? 'Removed last practice check-in'
          : 'Logged beauty challenge streak step'
      );
    } else if (data.error) {
      showToast(data.error);
    }
  };

  const handleClaimChallenge = async (challengeId: WeeklyChallengeId) => {
    const res = await fetch('/api/challenges/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId }),
    });
    const data = await res.json();
    if (res.ok) {
      setClaimedChallenges(data.claimedChallengeRewards || []);
      showToast(
        `Claimed +${data.claimed?.bonusPoints || ''} Glam Points from ${data.claimed?.title || 'Weekly Challenge'}`
      );
    } else if (data.error) {
      showToast(data.error);
    }
  };

  const handleResetChallenges = async () => {
    const res = await fetch('/api/challenges/reset', { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      setChallengeCheckIns(data.challengeCheckIns || {});
      setClaimedChallenges(data.claimedChallengeRewards || []);
      showToast('Reset Weekly Beauty Challenges board');
    }
  };

  const handlePublishSocialPost = async (
    post: Omit<SharedSocialPost, 'id' | 'sharedAt'>
  ): Promise<SharedSocialPost | null> => {
    const res = await fetch('/api/social-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    const data = await res.json();
    if (res.ok && data.post) {
      setSocialPosts(data.socialPosts || []);
      return data.post as SharedSocialPost;
    }
    return null;
  };

  const handleDeleteSocialPost = async (postId: string) => {
    const res = await fetch(`/api/social-posts/${postId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (res.ok) {
      setSocialPosts(data.socialPosts || []);
    }
  };

  const handleAddBrandShoot = async (
    shoot: Omit<BrandShootBooking, 'id'>
  ) => {
    const res = await fetch('/api/admin/shoots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shoot),
    });
    if (res.ok) {
      await refreshBootstrap();
      showToast(`Scheduled "${shoot.campaignTitle}" for ${shoot.modelName}`);
    }
  };

  const handleUpdateBrandShoot = async (
    id: string,
    patch: { status?: BrandShootBooking['status']; deliverablesCount?: number }
  ) => {
    const res = await fetch(`/api/admin/shoots/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      await refreshBootstrap();
      showToast(`Updated shoot ${id}`);
    }
  };

  const handleDeleteBrandShoot = async (id: string) => {
    const res = await fetch(`/api/admin/shoots/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await refreshBootstrap();
      showToast(`Removed shoot ${id}`);
    }
  };

  const handleLaunchShootInStudio = (modelId: string, presetName: string) => {
    const foundModel = allModels.find((m) => m.id === modelId);
    if (foundModel) handleSelectModel(foundModel);
    const foundPreset = EDITORIAL_PRESETS.find((p) => p.name === presetName);
    if (foundPreset) handleApplyPreset(foundPreset);
    setSourceMode('model');
    if (route === 'admin') {
      navigate('user');
    } else {
      document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth' });
    }
    showToast(`Loaded ${foundModel?.name || 'Model'} · ${presetName}`);
  };

  const totalBagCount = bagItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FAF8F6] text-[#191615] flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-[#FAF8F6]/92 backdrop-blur-md border-b border-[#191615]/10">
        <div className="max-w-[1320px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="font-display text-2xl font-semibold tracking-tight text-[#191615] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Glam Mirror
          </button>

          <nav className="flex items-center gap-5 sm:gap-7 text-sm font-medium text-[#5C534E] overflow-x-auto">
            <button
              type="button"
              onClick={() => navigate('home')}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                route === 'home'
                  ? 'text-[#191615] border-b-2 border-[#8B2635]'
                  : 'hover:text-[#191615]'
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => navigate('user')}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                route === 'user'
                  ? 'text-[#191615] border-b-2 border-[#8B2635]'
                  : 'hover:text-[#191615]'
              }`}
            >
              User Studio
            </button>
            <button
              type="button"
              onClick={() => navigate('admin')}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 ${
                route === 'admin'
                  ? 'text-[#191615] border-b-2 border-[#8B2635]'
                  : 'hover:text-[#191615]'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setIsQuickStartOpen(true)}
              className="hover:text-[#191615] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5"
            >
              Quick Start
            </button>
            <button
              type="button"
              onClick={() => setIsLookbookOpen(true)}
              className="hidden sm:inline-block hover:text-[#191615] transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5"
            >
              Photo Studio ({snapshots.length})
            </button>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsBagOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#191615] hover:bg-[#2F2A28] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vanity Bag</span>
              <span className="font-mono tabular-nums opacity-85">
                ({totalBagCount})
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1320px] w-full mx-auto px-6">
        {route === 'home' && (
          <div className="flex flex-col">
            <HomePage
              models={allModels}
              shades={activeUserShades}
              savedLooksCount={snapshots.length}
              ordersCount={orders.length}
              latestConsultation={consultations[0] || null}
              latestAiResult={aiResult}
              selectedModel={selectedModel}
              activeLook={look}
              savedLooks={snapshots}
              onNavigateUserStudio={(initialSource, modelId) => {
                if (initialSource) setSourceMode(initialSource);
                if (modelId) {
                  const found = allModels.find((m) => m.id === modelId);
                  if (found) handleSelectModel(found);
                }
                document
                  .getElementById('studio')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              onNavigateAdmin={() =>
                document
                  .getElementById('admin-console')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              onJumpToSection={(sectionId) =>
                document
                  .getElementById(sectionId)
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              onOpenQuickStart={() => setIsQuickStartOpen(true)}
            />

            <div className="border-t border-[#191615]/10">
              <UserPage
                models={allModels}
                shades={activeUserShades}
                consultations={consultations}
                waterIntakeLogs={waterIntakeLogs}
                onLogWaterIntake={handleLogWaterIntake}
                sourceMode={sourceMode}
                onSourceModeChange={setSourceMode}
                selectedModel={selectedModel}
                onSelectModel={handleSelectModel}
                lighting={lighting}
                onLightingChange={setLighting}
                look={look}
                onUpdateLook={setLook}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onApplyPreset={handleApplyPreset}
                onResetLook={handleResetLook}
                onAddActiveLookToBag={handleAddActiveLookToBag}
                onCaptureLook={handleCaptureLook}
                onRunAiAnalysis={handleRunAiAnalysis}
                isAnalyzingAi={isAnalyzingAi}
                occasion={occasion}
                onOccasionChange={setOccasion}
                aiError={aiError}
                aiResult={aiResult}
                onApplyAiRecommendation={handleApplyAiRecommendation}
                onTryShadeInMirror={handleTryShadeInMirror}
                onAddSingleShadeToBag={handleAddSingleShadeToBag}
                selectedKitIds={selectedKitIds}
                onToggleKitItem={handleToggleKitItem}
                onAddKitProductToBag={handleAddKitProductToBag}
                snapshots={snapshots}
                orders={orders}
                redeemedRewards={redeemedRewards}
                challengeCheckIns={challengeCheckIns}
                claimedChallenges={claimedChallenges}
                onCheckInChallenge={handleCheckInChallenge}
                onClaimChallenge={handleClaimChallenge}
                onResetChallenges={handleResetChallenges}
                onRedeemReward={handleRedeemReward}
                onClearRedeemedRewards={handleClearRedeemedRewards}
                onApplySavedLook={(savedLook) => {
                  setLook(savedLook);
                  document
                    .getElementById('studio')
                    ?.scrollIntoView({ behavior: 'smooth' });
                  showToast('Loaded saved shades into mirror');
                }}
                onShareSnapshot={(snapshotId) => {
                  setInitialShareSnapshotId(snapshotId);
                  setIsLookbookOpen(true);
                }}
              />
            </div>

            <section
              id="admin-console"
              className="border-t border-[#191615]/10 pt-8"
            >
              <AdminPage
                shades={allShades}
                archivedProductIds={archivedProductIds}
                models={allModels}
                orders={orders}
                consultations={consultations}
                brandShoots={brandShoots}
                savedLooksCount={snapshots.length}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onAddModel={handleAddModel}
                onDeleteModel={handleDeleteModel}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onAddBrandShoot={handleAddBrandShoot}
                onUpdateBrandShoot={handleUpdateBrandShoot}
                onDeleteBrandShoot={handleDeleteBrandShoot}
                onLaunchShootInStudio={handleLaunchShootInStudio}
                onTestInUserStudio={handleTryShadeInMirror}
              />
            </section>
          </div>
        )}

        {route === 'user' && (
          <UserPage
            models={allModels}
            shades={activeUserShades}
            consultations={consultations}
            waterIntakeLogs={waterIntakeLogs}
            onLogWaterIntake={handleLogWaterIntake}
            sourceMode={sourceMode}
            onSourceModeChange={setSourceMode}
            selectedModel={selectedModel}
            onSelectModel={handleSelectModel}
            lighting={lighting}
            onLightingChange={setLighting}
            look={look}
            onUpdateLook={setLook}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onApplyPreset={handleApplyPreset}
            onResetLook={handleResetLook}
            onAddActiveLookToBag={handleAddActiveLookToBag}
            onCaptureLook={handleCaptureLook}
            onRunAiAnalysis={handleRunAiAnalysis}
            isAnalyzingAi={isAnalyzingAi}
            occasion={occasion}
            onOccasionChange={setOccasion}
            aiError={aiError}
            aiResult={aiResult}
            onApplyAiRecommendation={handleApplyAiRecommendation}
            onTryShadeInMirror={handleTryShadeInMirror}
            onAddSingleShadeToBag={handleAddSingleShadeToBag}
            selectedKitIds={selectedKitIds}
            onToggleKitItem={handleToggleKitItem}
            onAddKitProductToBag={handleAddKitProductToBag}
            snapshots={snapshots}
            orders={orders}
            redeemedRewards={redeemedRewards}
            challengeCheckIns={challengeCheckIns}
            claimedChallenges={claimedChallenges}
            onCheckInChallenge={handleCheckInChallenge}
            onClaimChallenge={handleClaimChallenge}
            onResetChallenges={handleResetChallenges}
            onRedeemReward={handleRedeemReward}
            onClearRedeemedRewards={handleClearRedeemedRewards}
            onApplySavedLook={(savedLook) => {
              setLook(savedLook);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              showToast('Loaded saved shades into mirror');
            }}
            onShareSnapshot={(snapshotId) => {
              setInitialShareSnapshotId(snapshotId);
              setIsLookbookOpen(true);
            }}
          />
        )}

        {route === 'admin' && (
          <AdminPage
            shades={allShades}
            archivedProductIds={archivedProductIds}
            models={allModels}
            orders={orders}
            consultations={consultations}
            brandShoots={brandShoots}
            savedLooksCount={snapshots.length}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddModel={handleAddModel}
            onDeleteModel={handleDeleteModel}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onAddBrandShoot={handleAddBrandShoot}
            onUpdateBrandShoot={handleUpdateBrandShoot}
            onDeleteBrandShoot={handleDeleteBrandShoot}
            onLaunchShootInStudio={handleLaunchShootInStudio}
            onTestInUserStudio={handleTryShadeInMirror}
          />
        )}
      </main>

      <footer className="border-t border-[#191615]/10 py-8 mt-6">
        <div className="max-w-[1320px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6E6560]">
          <span>Glam Mirror AI · Full-Stack Virtual Beauty Platform</span>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => navigate('home')}
              className="hover:text-[#191615] transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => navigate('user')}
              className="hover:text-[#191615] transition-colors cursor-pointer"
            >
              User Studio
            </button>
            <button
              type="button"
              onClick={() => navigate('admin')}
              className="hover:text-[#191615] transition-colors cursor-pointer"
            >
              Admin Console
            </button>
          </div>
        </div>
      </footer>

      <VanityBagDrawer
        isOpen={isBagOpen}
        onClose={() => setIsBagOpen(false)}
        items={bagItems}
        onUpdateQuantity={(shadeId, delta) => {
          setBagItems((prev) => {
            const next = prev
              .map((item) =>
                item.shade.id === shadeId
                  ? { ...item, quantity: item.quantity + delta }
                  : item
              )
              .filter((item) => item.quantity > 0);
            syncBagToServer(next);
            return next;
          });
        }}
        onRemoveItem={(shadeId) => {
          setBagItems((prev) => {
            const next = prev.filter((i) => i.shade.id !== shadeId);
            syncBagToServer(next);
            return next;
          });
        }}
        onSubmitOrder={handleSubmitOrder}
      />

      <LookbookDrawer
        isOpen={isLookbookOpen}
        onClose={() => {
          setIsLookbookOpen(false);
          setInitialShareSnapshotId(null);
        }}
        snapshots={snapshots}
        sharedPosts={socialPosts}
        activeKitIds={selectedKitIds}
        initialShareSnapshotId={initialShareSnapshotId}
        onClearInitialShare={() => setInitialShareSnapshotId(null)}
        onApplySavedLook={(savedLook) => {
          setLook(savedLook);
          if (route === 'admin') {
            navigate('user');
          } else {
            document
              .getElementById('studio')
              ?.scrollIntoView({ behavior: 'smooth' });
          }
          showToast('Loaded saved shades into mirror');
        }}
        onDeleteSnapshot={handleDeleteSnapshot}
        onPublishSocialPost={handlePublishSocialPost}
        onDeleteSocialPost={handleDeleteSocialPost}
        onNotify={showToast}
      />

      <QuickStartModal
        isOpen={isQuickStartOpen}
        onClose={() => setIsQuickStartOpen(false)}
        onLaunchStudio={(mode) => {
          setSourceMode(mode);
          if (route === 'admin') {
            navigate('user');
          } else {
            document
              .getElementById('studio')
              ?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-40 bg-[#191615] text-[#FAF8F6] text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
