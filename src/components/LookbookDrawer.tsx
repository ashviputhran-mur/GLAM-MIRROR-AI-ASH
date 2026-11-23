import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  RefreshCw,
  Send,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import {
  DEFAULT_MUA_KIT_IDS,
  MUA_KIT_DIVISIONS,
  PRO_MUA_PRODUCTS,
  getKitProductById,
  getShadeById,
  type MakeupLookState,
  type MakeupShade,
  type MuaKitDivision,
  type MuaKitProduct,
} from '../data/makeupCatalog';

export interface SavedLookSnapshot {
  id: string;
  imageUrl: string;
  timestamp: string;
  modelLabel: string;
  look: MakeupLookState;
  kitItemIds?: string[];
}

export type SocialPlatform = 'instagram' | 'tiktok' | 'pinterest' | 'x';

type CaptionTone = 0 | 1 | 2;

export interface ActiveProductEntry {
  categoryLabel: string;
  shade: MakeupShade;
  detail: string;
}

export interface SharedSocialPost {
  id: string;
  snapshotId: string;
  platform: SocialPlatform;
  imageUrl: string;
  modelLabel: string;
  summaryLine: string;
  caption: string;
  hashtags: string[];
  products: ActiveProductEntry[];
  kitProducts?: MuaKitProduct[];
  sharedAt: string;
  handle: string;
}

interface LookbookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: SavedLookSnapshot[];
  sharedPosts: SharedSocialPost[];
  activeKitIds?: string[];
  initialShareSnapshotId?: string | null;
  onClearInitialShare?: () => void;
  onApplySavedLook: (look: MakeupLookState) => void;
  onDeleteSnapshot: (id: string) => void;
  onPublishSocialPost: (
    post: Omit<SharedSocialPost, 'id' | 'sharedAt'>
  ) => Promise<SharedSocialPost | null>;
  onDeleteSocialPost: (postId: string) => Promise<void>;
  onNotify?: (message: string) => void;
}

const PLATFORM_META: Record<
  SocialPlatform,
  {
    label: string;
    handle: string;
    formatLabel: string;
    aspectLabel: string;
    canvasWidth: number;
    canvasHeight: number;
  }
> = {
  instagram: {
    label: 'Instagram',
    handle: '@glam.atelier',
    formatLabel: 'Editorial Carousel',
    aspectLabel: '4:5 Portrait Card',
    canvasWidth: 1080,
    canvasHeight: 1350,
  },
  tiktok: {
    label: 'TikTok',
    handle: '@glammirror.studio',
    formatLabel: 'GRWM Shade Card',
    aspectLabel: '9:16 Vertical Card',
    canvasWidth: 1080,
    canvasHeight: 1920,
  },
  pinterest: {
    label: 'Pinterest',
    handle: 'Glam Mirror Studio',
    formatLabel: 'Curated Beauty Pin',
    aspectLabel: '2:3 Pin Board',
    canvasWidth: 1000,
    canvasHeight: 1500,
  },
  x: {
    label: 'X',
    handle: '@glammirrorai',
    formatLabel: 'Studio Dispatch',
    aspectLabel: '4:3 Landscape Card',
    canvasWidth: 1200,
    canvasHeight: 900,
  },
};

function extractActiveProducts(look: MakeupLookState): ActiveProductEntry[] {
  const entries: ActiveProductEntry[] = [];

  if (look.foundation.enabled) {
    const shade = getShadeById(look.foundation.shadeId);
    if (shade) {
      entries.push({
        categoryLabel: 'Foundation',
        shade,
        detail: `${look.foundation.finish} · ${look.foundation.intensity}%`,
      });
    }
  }
  if (look.eyeshadow.enabled) {
    const shade = getShadeById(look.eyeshadow.shadeId);
    if (shade) {
      entries.push({
        categoryLabel: 'Eyeshadow',
        shade,
        detail: `${look.eyeshadow.finish} · ${look.eyeshadow.intensity}%`,
      });
    }
  }
  if (look.eyeliner.enabled) {
    const shade = getShadeById(look.eyeliner.shadeId);
    if (shade) {
      entries.push({
        categoryLabel: 'Eyeliner',
        shade,
        detail: `${look.eyeliner.style} · ${look.eyeliner.intensity}%`,
      });
    }
  }
  if (look.kajal.enabled) {
    const shade = getShadeById(look.kajal.shadeId);
    if (shade) {
      entries.push({
        categoryLabel: 'Kajal',
        shade,
        detail: `${look.kajal.style} · ${look.kajal.intensity}%`,
      });
    }
  }
  if (look.blush.enabled) {
    const shade = getShadeById(look.blush.shadeId);
    if (shade) {
      entries.push({
        categoryLabel: 'Blush',
        shade,
        detail: `${look.blush.finish} · ${look.blush.intensity}%`,
      });
    }
  }
  if (look.highlighter.enabled) {
    const shade = getShadeById(look.highlighter.shadeId);
    if (shade) {
      entries.push({
        categoryLabel: 'Highlighter',
        shade,
        detail: `${look.highlighter.finish} · ${look.highlighter.intensity}%`,
      });
    }
  }
  if (look.lipstick.enabled) {
    const shade = getShadeById(look.lipstick.shadeId);
    if (shade) {
      entries.push({
        categoryLabel: 'Lipstick',
        shade,
        detail: `${look.lipstick.finish} · ${look.lipstick.intensity}%`,
      });
    }
  }

  return entries;
}

function toHashtagToken(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function generateBeautyHashtags(
  products: ActiveProductEntry[],
  kitProducts: MuaKitProduct[],
  look: MakeupLookState,
  platform: SocialPlatform,
  includeBrandTags: boolean
): string[] {
  const tags = new Set<string>(['#GlamMirrorStudio', '#VirtualBeautyTryOn']);

  if (platform === 'tiktok') {
    tags.add('#GRWMMakeup');
    tags.add('#MUAKit');
  } else if (platform === 'pinterest') {
    tags.add('#EditorialMakeupInspo');
    tags.add('#BeautyShadeBoard');
  } else if (platform === 'instagram') {
    tags.add('#EditorialGlam');
    tags.add('#MakeupArtistKit');
  } else {
    tags.add('#BeautyTech');
  }

  if (look.foundation.enabled) tags.add(`#${toHashtagToken(look.foundation.finish)}Base`);
  if (look.eyeshadow.enabled) tags.add(`#${toHashtagToken(look.eyeshadow.finish)}Lids`);
  if (look.eyeliner.enabled) tags.add(`#${toHashtagToken(look.eyeliner.style)}Liner`);
  if (look.kajal.enabled) tags.add('#KajalTightline');
  if (look.blush.enabled) tags.add(`#${toHashtagToken(look.blush.finish)}Blush`);
  if (look.highlighter.enabled) tags.add(`#${toHashtagToken(look.highlighter.finish)}Glow`);
  if (look.lipstick.enabled) tags.add(`#${toHashtagToken(look.lipstick.finish)}Lips`);

  // Add tags for included Face, Eye, Lip & Skincare Prep MUA products
  kitProducts.forEach((item) => {
    tags.add(`#${toHashtagToken(item.itemName)}`);
  });

  if (includeBrandTags) {
    products.forEach((entry) => {
      tags.add(`#${toHashtagToken(entry.shade.brand)}`);
    });
    kitProducts.forEach((item) => {
      tags.add(`#${toHashtagToken(item.brand)}`);
    });
  }

  products.slice(0, 3).forEach((entry) => {
    tags.add(`#${toHashtagToken(entry.shade.name)}`);
  });

  const maxTags = platform === 'x' ? 9 : 16;
  return Array.from(tags).slice(0, maxTags);
}

function generateSocialCaption(
  snap: SavedLookSnapshot,
  products: ActiveProductEntry[],
  kitProducts: MuaKitProduct[],
  look: MakeupLookState,
  platform: SocialPlatform,
  tone: CaptionTone,
  includeBreakdown: boolean,
  hashtags: string[]
): { summaryLine: string; fullCaption: string } {
  const totalCount = products.length + kitProducts.length;
  const focusParts = products.map(
    (entry) => `${entry.shade.name} ${entry.categoryLabel.toLowerCase()}`
  );

  const summaryLine =
    totalCount > 0
      ? `${snap.modelLabel} · ${totalCount}-Product Look & Kit`
      : `${snap.modelLabel} · Bare Complexion Calibration`;

  const lipName = look.lipstick.enabled
    ? getShadeById(look.lipstick.shadeId)?.name
    : null;
  const heroHighlight =
    focusParts.length > 0
      ? focusParts.slice(0, 4).join(', ')
      : 'bare-skin finish calibration';

  const openersByPlatform: Record<SocialPlatform, string[]> = {
    instagram: [
      `Studio Portrait Capture on ${snap.modelLabel} — ${totalCount}-product artist routine featuring ${heroHighlight}.`,
      `Golden hour lighting test on ${snap.modelLabel} crafted with skincare prep, base, eye, cheek & lip layers.`,
      `Full shade & kit breakdown with ${lipName || 'balanced complexion'} tone and studio-calibrated finishes.`,
    ],
    tiktok: [
      `GRWM from Skincare Prep to Setting Spray — testing ${totalCount} products on ${snap.modelLabel}.`,
      `Every step in real time on ${snap.modelLabel}: ${kitProducts.slice(0, 3).map((k) => k.itemName).join(', ')} + ${products.slice(0, 3).map((p) => p.shade.name).join(', ')}.`,
      `Backstage ${totalCount}-product virtual mirror breakdown on ${snap.modelLabel}:`,
    ],
    pinterest: [
      `Complete ${totalCount}-Product MUA Routine Board for ${snap.modelLabel}. Save every shade, prep step, and finish.`,
      `Editorial Face, Eye, Lip & Skincare Prep Kit — calibrated across ${totalCount} items on ${snap.modelLabel}.`,
      `Curated Artist Formula: ${products.map((p) => p.shade.name).join(' · ')}${kitProducts.length ? ` + ${kitProducts.map((k) => k.itemName).join(', ')}` : ''}.`,
    ],
    x: [
      `${snap.modelLabel} ${totalCount}-product mirror look (${snap.timestamp}): ${products.map((p) => p.shade.name).join(', ')}.`,
      `Studio look & kit breakdown on ${snap.modelLabel} across Skincare Prep, Face, Eye & Lip layers:`,
      `Tested ${heroHighlight} + ${kitProducts.slice(0, 4).map((k) => k.itemName).join(', ')} in Glam Mirror.`,
    ],
  };

  const opener = openersByPlatform[platform][tone];

  const blocks: string[] = [opener];

  if (includeBreakdown) {
    if (products.length > 0) {
      const shadeLines = products.map(
        (p) =>
          `• ${p.categoryLabel}: ${p.shade.name} (${p.shade.brand}) — ${p.detail}`
      );
      blocks.push(`Mirror Shades:\n${shadeLines.join('\n')}`);
    }
    if (kitProducts.length > 0) {
      const grouped = MUA_KIT_DIVISIONS.map((div) => {
        const items = kitProducts.filter((k) => k.division === div);
        if (items.length === 0) return null;
        return `• ${div}: ${items.map((i) => `${i.itemName} (${i.productTitle})`).join(', ')}`;
      }).filter(Boolean) as string[];

      if (grouped.length > 0) {
        blocks.push(`Pro MUA & Prep Kit:\n${grouped.join('\n')}`);
      }
    }
  }

  if (hashtags.length > 0) {
    blocks.push(hashtags.join(' '));
  }

  return {
    summaryLine,
    fullCaption: blocks.join('\n\n'),
  };
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

async function renderBrandedSocialCard(
  snap: SavedLookSnapshot,
  products: ActiveProductEntry[],
  kitProducts: MuaKitProduct[],
  platform: SocialPlatform,
  summaryLine: string,
  hashtags: string[]
): Promise<string> {
  const meta = PLATFORM_META[platform];
  const canvas = document.createElement('canvas');
  canvas.width = meta.canvasWidth;
  canvas.height = meta.canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return snap.imageUrl;

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Image load failed'));
    el.src = snap.imageUrl;
  });

  ctx.fillStyle = '#191615';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const footerHeight = Math.round(canvas.height * 0.3);
  const photoAreaH = canvas.height - footerHeight;
  const scale = Math.max(canvas.width / img.width, photoAreaH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const drawX = (canvas.width - drawW) / 2;
  const drawY = (photoAreaH - drawH) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, photoAreaH);
  ctx.clip();
  ctx.drawImage(img, drawX, drawY, drawW, drawH);

  const scrim = ctx.createLinearGradient(0, photoAreaH - 130, 0, photoAreaH);
  scrim.addColorStop(0, 'rgba(25, 22, 21, 0)');
  scrim.addColorStop(1, 'rgba(25, 22, 21, 0.96)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, photoAreaH - 130, canvas.width, 130);
  ctx.restore();

  ctx.fillStyle = '#191615';
  ctx.fillRect(0, photoAreaH, canvas.width, footerHeight);

  const padX = Math.round(canvas.width * 0.06);
  const contentWidth = canvas.width - padX * 2;
  let cursorY = photoAreaH + 28;

  ctx.fillStyle = '#D9C7BE';
  ctx.font = '500 19px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    `${meta.label.toUpperCase()} EDITION  ·  ${meta.handle}  ·  ${snap.timestamp}`,
    padX,
    cursorY
  );

  // Swatch palette strip (rendered shades + kit items)
  cursorY += 22;
  const swatchSize = 28;
  const swatchGap = 12;
  const allSwatches = [
    ...products.map((p) => p.shade.hex),
    ...kitProducts.map((k) => k.hex),
  ];
  allSwatches.forEach((hex, idx) => {
    const sx = padX + idx * (swatchSize + swatchGap);
    if (sx + swatchSize > canvas.width - padX) return;
    ctx.fillStyle = hex;
    ctx.beginPath();
    ctx.arc(
      sx + swatchSize / 2,
      cursorY + swatchSize / 2,
      swatchSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = 'rgba(250, 248, 246, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  cursorY += swatchSize + 34;
  ctx.fillStyle = '#FAF8F6';
  ctx.font = '600 28px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(
    summaryLine.length > 62 ? `${summaryLine.slice(0, 59)}…` : summaryLine,
    padX,
    cursorY
  );

  // Full wrapped product summary across rendered shades + MUA kit
  cursorY += 30;
  ctx.fillStyle = '#C9BFB8';
  ctx.font = '400 17px "Plus Jakarta Sans", sans-serif';
  const combinedItems = [
    ...products.map((p) => `${p.categoryLabel}: ${p.shade.name}`),
    ...kitProducts.map((k) => k.itemName),
  ].join(' · ');
  const itemLines = wrapCanvasText(
    ctx,
    combinedItems || 'Bespoke Studio Look',
    contentWidth,
    2
  );
  itemLines.forEach((line) => {
    ctx.fillText(line, padX, cursorY);
    cursorY += 23;
  });

  cursorY += 10;
  ctx.fillStyle = '#E6A6B0';
  ctx.font = '500 17px "JetBrains Mono", monospace';
  const tagLines = wrapCanvasText(
    ctx,
    hashtags.slice(0, 7).join('  '),
    contentWidth,
    2
  );
  tagLines.forEach((line) => {
    ctx.fillText(line, padX, cursorY);
    cursorY += 22;
  });

  return canvas.toDataURL('image/jpeg', 0.92);
}

export const LookbookDrawer: React.FC<LookbookDrawerProps> = ({
  isOpen,
  onClose,
  snapshots,
  sharedPosts,
  activeKitIds = DEFAULT_MUA_KIT_IDS,
  initialShareSnapshotId,
  onClearInitialShare,
  onApplySavedLook,
  onDeleteSnapshot,
  onPublishSocialPost,
  onDeleteSocialPost,
  onNotify,
}) => {
  const [drawerTab, setDrawerTab] = useState<'gallery' | 'feed'>('gallery');
  const [sharingSnapshotId, setSharingSnapshotId] = useState<string | null>(
    null
  );
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [tone, setTone] = useState<CaptionTone>(0);
  const [includeBreakdown, setIncludeBreakdown] = useState(true);
  const [includeBrandTags, setIncludeBrandTags] = useState(true);
  const [composerKitIds, setComposerKitIds] = useState<string[]>(activeKitIds);
  const [kitDivisionTab, setKitDivisionTab] =
    useState<MuaKitDivision>('Face Makeup');
  const [customCaption, setCustomCaption] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isExportingCard, setIsExportingCard] = useState(false);
  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const [justPublishedId, setJustPublishedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialShareSnapshotId) {
      setSharingSnapshotId(initialShareSnapshotId);
      setJustPublishedId(null);
      onClearInitialShare?.();
    }
  }, [isOpen, initialShareSnapshotId, onClearInitialShare]);

  const sharingSnapshot = useMemo(
    () => snapshots.find((s) => s.id === sharingSnapshotId) || null,
    [snapshots, sharingSnapshotId]
  );

  // Sync composer kit selections whenever switching snapshot
  useEffect(() => {
    if (sharingSnapshot) {
      setComposerKitIds(
        sharingSnapshot.kitItemIds && sharingSnapshot.kitItemIds.length > 0
          ? sharingSnapshot.kitItemIds
          : activeKitIds
      );
    }
  }, [sharingSnapshot, activeKitIds]);

  const activeProducts = useMemo(
    () => (sharingSnapshot ? extractActiveProducts(sharingSnapshot.look) : []),
    [sharingSnapshot]
  );

  const activeKitProducts = useMemo(
    () =>
      composerKitIds
        .map((id) => getKitProductById(id))
        .filter((p): p is MuaKitProduct => Boolean(p)),
    [composerKitIds]
  );

  const generatedHashtags = useMemo(
    () =>
      sharingSnapshot
        ? generateBeautyHashtags(
            activeProducts,
            activeKitProducts,
            sharingSnapshot.look,
            platform,
            includeBrandTags
          )
        : [],
    [
      sharingSnapshot,
      activeProducts,
      activeKitProducts,
      platform,
      includeBrandTags,
    ]
  );

  const generatedCopy = useMemo(() => {
    if (!sharingSnapshot) return { summaryLine: '', fullCaption: '' };
    return generateSocialCaption(
      sharingSnapshot,
      activeProducts,
      activeKitProducts,
      sharingSnapshot.look,
      platform,
      tone,
      includeBreakdown,
      generatedHashtags
    );
  }, [
    sharingSnapshot,
    activeProducts,
    activeKitProducts,
    platform,
    tone,
    includeBreakdown,
    generatedHashtags,
  ]);

  useEffect(() => {
    if (sharingSnapshot) {
      setCustomCaption(generatedCopy.fullCaption);
    }
  }, [sharingSnapshot, generatedCopy.fullCaption]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (sharingSnapshotId) {
          setSharingSnapshotId(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, sharingSnapshotId, onClose]);

  if (!isOpen) return null;

  const toggleComposerKitItem = (kitId: string) => {
    setComposerKitIds((prev) =>
      prev.includes(kitId)
        ? prev.filter((id) => id !== kitId)
        : [...prev, kitId]
    );
  };

  const handleDownload = (snap: SavedLookSnapshot) => {
    const link = document.createElement('a');
    link.href = snap.imageUrl;
    link.download = `glam-mirror-${snap.id}.jpg`;
    link.click();
  };

  const handleCopyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onNotify?.('Copied look summary & beauty hashtags');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      onNotify?.('Copy unavailable in this browser');
    }
  };

  const handleDownloadSocialCard = async (
    snap: SavedLookSnapshot,
    products: ActiveProductEntry[],
    kitProducts: MuaKitProduct[],
    targetPlatform: SocialPlatform,
    summaryLine: string,
    hashtags: string[]
  ) => {
    setIsExportingCard(true);
    try {
      const cardDataUrl = await renderBrandedSocialCard(
        snap,
        products,
        kitProducts,
        targetPlatform,
        summaryLine,
        hashtags
      );
      const link = document.createElement('a');
      link.href = cardDataUrl;
      link.download = `glam-mirror-${targetPlatform}-${snap.id}.jpg`;
      link.click();
      onNotify?.(
        `Exported ${PLATFORM_META[targetPlatform].label} social card`
      );
    } catch {
      handleDownload(snap);
      onNotify?.('Downloaded original portrait snapshot');
    } finally {
      setIsExportingCard(false);
    }
  };

  const handlePublishToSimulatedSocial = async () => {
    if (!sharingSnapshot || isPublishingPost) return;
    setIsPublishingPost(true);
    try {
      const meta = PLATFORM_META[platform];
      const created = await onPublishSocialPost({
        snapshotId: sharingSnapshot.id,
        platform,
        imageUrl: sharingSnapshot.imageUrl,
        modelLabel: sharingSnapshot.modelLabel,
        summaryLine: generatedCopy.summaryLine,
        caption: customCaption.trim() || generatedCopy.fullCaption,
        hashtags: generatedHashtags,
        products: activeProducts,
        kitProducts: activeKitProducts,
        handle: meta.handle,
      });
      if (created) {
        setJustPublishedId(created.id);
        onNotify?.(`Exported look to ${meta.label} (${meta.handle})`);
      }
    } finally {
      setIsPublishingPost(false);
    }
  };

  const handleDeleteSharedPost = async (postId: string) => {
    await onDeleteSocialPost(postId);
  };

  const platformMeta = PLATFORM_META[platform];
  const divisionItems = PRO_MUA_PRODUCTS.filter(
    (item) => item.division === kitDivisionTab
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#191615]/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside className="relative z-10 w-full max-w-lg bg-[#FAF8F6] h-full flex flex-col border-l border-[#191615]/12 shadow-2xl">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-[#191615]/10 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              {sharingSnapshot ? (
                <button
                  type="button"
                  onClick={() => {
                    setSharingSnapshotId(null);
                    setJustPublishedId(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8B2635] hover:text-[#6E1D2A] mb-1 cursor-pointer whitespace-nowrap"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Gallery</span>
                </button>
              ) : null}
              <h2 className="font-display text-2xl font-semibold text-[#191615]">
                {sharingSnapshot ? 'Share to Social' : 'Photo Studio Gallery'}
              </h2>
              <p className="text-xs text-[#6E6560]">
                {sharingSnapshot
                  ? `${sharingSnapshot.modelLabel} · ${
                      activeProducts.length + activeKitProducts.length
                    } tagged products · ${platformMeta.aspectLabel}`
                  : `${snapshots.length} captured ${
                      snapshots.length === 1 ? 'portrait' : 'portraits'
                    } · ${sharedPosts.length} shared social ${
                      sharedPosts.length === 1 ? 'post' : 'posts'
                    }`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close photo gallery"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-[#5C534E] hover:text-[#191615] hover:bg-[#EFEAE4] transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!sharingSnapshot && (
            <div className="flex items-center gap-1 p-1 bg-[#EFEAE4] rounded-lg">
              <button
                type="button"
                onClick={() => setDrawerTab('gallery')}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  drawerTab === 'gallery'
                    ? 'bg-white text-[#191615] shadow-sm'
                    : 'text-[#5C534E] hover:text-[#191615]'
                }`}
              >
                Saved Photos ({snapshots.length})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('feed')}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  drawerTab === 'feed'
                    ? 'bg-white text-[#191615] shadow-sm'
                    : 'text-[#5C534E] hover:text-[#191615]'
                }`}
              >
                Social Feed ({sharedPosts.length})
              </button>
            </div>
          )}
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {sharingSnapshot ? (
            <div className="flex flex-col gap-5">
              {/* Target Social Platform Selector */}
              <div>
                <div className="text-xs font-medium text-[#5C534E] mb-2">
                  Target Social Platform
                </div>
                <div className="grid grid-cols-4 gap-1 p-1 bg-[#EFEAE4] rounded-lg">
                  {(
                    ['instagram', 'tiktok', 'pinterest', 'x'] as SocialPlatform[]
                  ).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPlatform(p);
                        setJustPublishedId(null);
                      }}
                      className={`py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        platform === p
                          ? 'bg-white text-[#191615] shadow-sm'
                          : 'text-[#5C534E] hover:text-[#191615]'
                      }`}
                    >
                      {PLATFORM_META[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated Social Post Preview Card */}
              <div className="bg-white rounded-xl border border-[#191615]/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#191615]/8 flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <span className="font-semibold text-[#191615]">
                      {platformMeta.handle}
                    </span>
                    <span className="text-[#6E6560] mx-1.5">·</span>
                    <span className="text-[#6E6560]">
                      {platformMeta.formatLabel}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#6E6560] whitespace-nowrap">
                    {platformMeta.aspectLabel}
                  </span>
                </div>

                <div className="relative bg-[#191615]">
                  <img
                    src={sharingSnapshot.imageUrl}
                    alt={`Social preview for ${sharingSnapshot.modelLabel}`}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-[280px] object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#191615]/90 via-[#191615]/45 to-transparent px-4 pt-10 pb-3 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] text-[#E6DCD5] truncate">
                        {generatedCopy.summaryLine}
                      </div>
                      {(activeProducts.length > 0 ||
                        activeKitProducts.length > 0) && (
                        <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
                          {activeProducts.map((entry) => (
                            <span
                              key={`${entry.categoryLabel}-${entry.shade.id}`}
                              title={`${entry.categoryLabel}: ${entry.shade.name}`}
                              className="w-4 h-4 rounded-full border border-white/50 shrink-0"
                              style={{ backgroundColor: entry.shade.hex }}
                            />
                          ))}
                          {activeKitProducts.slice(0, 6).map((item) => (
                            <span
                              key={item.id}
                              title={`${item.division}: ${item.itemName}`}
                              className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0"
                              style={{ backgroundColor: item.hex }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3">
                  {/* Caption Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 text-[#5C534E] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeBreakdown}
                          onChange={(e) =>
                            setIncludeBreakdown(e.target.checked)
                          }
                          className="accent-[#8B2635]"
                        />
                        <span>Full Product Breakdown</span>
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-[#5C534E] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeBrandTags}
                          onChange={(e) =>
                            setIncludeBrandTags(e.target.checked)
                          }
                          className="accent-[#8B2635]"
                        />
                        <span>Brand Hashtags</span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTone((t) => ((t + 1) % 3) as CaptionTone)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#8B2635] hover:text-[#6E1D2A] cursor-pointer whitespace-nowrap"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate Copy</span>
                    </button>
                  </div>

                  {/* Editable Look Summary + Beauty Hashtags */}
                  <div>
                    <label
                      htmlFor="social-caption-editor"
                      className="block text-[11px] font-medium text-[#6E6560] mb-1"
                    >
                      Auto-Generated Look Summary &amp; Beauty Hashtags
                    </label>
                    <textarea
                      id="social-caption-editor"
                      rows={6}
                      value={customCaption}
                      onChange={(e) => setCustomCaption(e.target.value)}
                      className="w-full px-3 py-2.5 bg-[#FAF8F6] border border-[#191615]/15 rounded-lg text-xs text-[#191615] leading-relaxed focus:outline-none focus:border-[#8B2635]"
                    />
                  </div>

                  {/* Unboxed Hashtag Preview Line */}
                  <div className="text-xs text-[#8B2635] font-medium leading-relaxed">
                    {generatedHashtags.join('  ')}
                  </div>
                </div>
              </div>

              {/* Pro MUA & Model Kit Selector (All 6 Divisions / 63 Items) */}
              <div className="bg-white rounded-xl border border-[#191615]/10 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-[#191615]">
                      Tag Full MUA &amp; Prep Kit ({composerKitIds.length}/
                      {PRO_MUA_PRODUCTS.length})
                    </div>
                    <div className="text-[11px] text-[#6E6560]">
                      Select across Face, Eye, Lip, Skincare Prep, Tools &amp; Body Pro
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setComposerKitIds(
                        composerKitIds.length === PRO_MUA_PRODUCTS.length
                          ? DEFAULT_MUA_KIT_IDS
                          : PRO_MUA_PRODUCTS.map((p) => p.id)
                      )
                    }
                    className="text-[11px] font-medium text-[#8B2635] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {composerKitIds.length === PRO_MUA_PRODUCTS.length
                      ? 'Reset Default'
                      : `Select All ${PRO_MUA_PRODUCTS.length}`}
                  </button>
                </div>

                {/* 6 MUA Division Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-[#EFEAE4] rounded-lg overflow-x-auto">
                  {MUA_KIT_DIVISIONS.map((div) => (
                    <button
                      key={div}
                      type="button"
                      onClick={() => setKitDivisionTab(div)}
                      className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        kitDivisionTab === div
                          ? 'bg-white text-[#191615] shadow-sm'
                          : 'text-[#5C534E] hover:text-[#191615]'
                      }`}
                    >
                      {div === 'Skincare & Preparation'
                        ? 'Skincare & Prep'
                        : div === 'Body & Professional Makeup'
                          ? 'Body & Pro'
                          : div}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {divisionItems.map((item) => {
                    const checked = composerKitIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleComposerKitItem(item.id)}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                          checked
                            ? 'bg-[#FAF8F6] border-[#8B2635]/40 text-[#191615]'
                            : 'bg-white border-[#191615]/10 text-[#6E6560] hover:border-[#191615]/25'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-[#191615]/15 shrink-0"
                          style={{ backgroundColor: item.hex }}
                        />
                        <span className="truncate flex-1 font-medium">
                          {item.itemName}
                        </span>
                        {checked && (
                          <Check className="w-3 h-3 text-[#8B2635] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Shade Summary Table across 7 rendered layers */}
              {activeProducts.length > 0 && (
                <div className="bg-white rounded-xl border border-[#191615]/10 p-4 flex flex-col gap-2">
                  <div className="text-xs font-semibold text-[#191615]">
                    Rendered Mirror Shades ({activeProducts.length} Active)
                  </div>
                  <div className="divide-y divide-[#191615]/8 text-xs">
                    {activeProducts.map((entry) => (
                      <div
                        key={`${entry.categoryLabel}-${entry.shade.id}`}
                        className="py-2 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-[#191615]/15 shrink-0"
                            style={{ backgroundColor: entry.shade.hex }}
                          />
                          <div className="min-w-0 truncate">
                            <span className="text-[#6E6560]">
                              {entry.categoryLabel}:{' '}
                            </span>
                            <span className="font-medium text-[#191615]">
                              {entry.shade.name}
                            </span>
                            <span className="text-[#6E6560]">
                              {' '}
                              · {entry.shade.brand}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono tabular-nums text-[#6E6560] whitespace-nowrap shrink-0">
                          {entry.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Publish Confirmation Banner */}
              {justPublishedId && (
                <div className="bg-white rounded-xl border border-[#2E6F73]/30 p-4 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-[#191615]">
                      Published to {platformMeta.label} Feed
                    </div>
                    <div className="text-[#5C534E] mt-0.5">
                      Saved under {platformMeta.handle} with hashtags &amp; complete MUA kit summary.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSharingSnapshotId(null);
                      setDrawerTab('feed');
                    }}
                    className="px-3 py-1.5 bg-[#191615] text-[#FAF8F6] text-xs font-medium rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    View Feed
                  </button>
                </div>
              )}

              {/* Primary Export & Simulated Publish Actions */}
              <div className="flex flex-col gap-2.5 pb-2">
                <button
                  type="button"
                  onClick={handlePublishToSimulatedSocial}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#8B2635] hover:bg-[#6E1D2A] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post to {platformMeta.label}</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isExportingCard}
                    onClick={() =>
                      handleDownloadSocialCard(
                        sharingSnapshot,
                        activeProducts,
                        activeKitProducts,
                        platform,
                        generatedCopy.summaryLine,
                        generatedHashtags
                      )
                    }
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#191615] hover:bg-[#2F2A28] disabled:opacity-60 text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {isExportingCard ? 'Rendering…' : 'Export Card'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        customCaption || generatedCopy.fullCaption,
                        'composer'
                      )
                    }
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#EFEAE4] hover:bg-[#E4DDD5] text-[#191615] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'composer' ? (
                      <Check className="w-3.5 h-3.5 text-[#2E6F73]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {copiedKey === 'composer' ? 'Copied' : 'Copy Caption'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : drawerTab === 'feed' ? (
            /* Simulated Social Platform Feed History */
            sharedPosts.length === 0 ? (
              <div className="py-16 text-center">
                <p className="font-display text-2xl text-[#191615] mb-2">
                  No Shared Social Posts Yet
                </p>
                <p className="text-xs text-[#6E6560] max-w-xs mx-auto leading-relaxed">
                  Select <strong className="font-medium text-[#191615]">Share to Social</strong> on any saved portrait in your gallery to generate beauty hashtags, full MUA kit summaries, and branded social cards.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {sharedPosts.map((post) => {
                  const meta = PLATFORM_META[post.platform];
                  const fallbackProducts =
                    post.products && post.products.length > 0
                      ? post.products
                      : [];
                  const fallbackKit =
                    post.kitProducts && post.kitProducts.length > 0
                      ? post.kitProducts
                      : [];
                  return (
                    <div
                      key={post.id}
                      className="bg-white rounded-xl border border-[#191615]/10 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-[#191615]/8 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0 truncate">
                          <span className="font-semibold text-[#191615]">
                            {meta.label}
                          </span>
                          <span className="text-[#6E6560] mx-1.5">·</span>
                          <span className="text-[#5C534E]">{post.handle}</span>
                        </div>
                        <span className="font-mono tabular-nums text-[11px] text-[#6E6560] shrink-0">
                          {post.sharedAt}
                        </span>
                      </div>

                      <div className="p-4 flex gap-3.5">
                        <img
                          src={post.imageUrl}
                          alt={`Shared ${meta.label} look for ${post.modelLabel}`}
                          referrerPolicy="no-referrer"
                          className="w-20 h-24 object-cover rounded-lg bg-[#EFEAE4] shrink-0"
                        />
                        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                          <div className="text-xs font-semibold text-[#191615]">
                            {post.summaryLine}
                          </div>
                          <p className="text-xs text-[#5C534E] whitespace-pre-line line-clamp-4 leading-relaxed">
                            {post.caption}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 pb-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadSocialCard(
                              {
                                id: post.snapshotId,
                                imageUrl: post.imageUrl,
                                timestamp: post.sharedAt,
                                modelLabel: post.modelLabel,
                                look: snapshots.find(
                                  (s) => s.id === post.snapshotId
                                )?.look as MakeupLookState,
                              },
                              fallbackProducts,
                              fallbackKit,
                              post.platform,
                              post.summaryLine,
                              post.hashtags
                            )
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#191615] hover:bg-[#2F2A28] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Card</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(post.caption, post.id)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#F3EFEA] hover:bg-[#E4DDD5] text-[#191615] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {copiedKey === post.id ? (
                            <Check className="w-3.5 h-3.5 text-[#2E6F73]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {copiedKey === post.id ? 'Copied' : 'Copy Caption'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSharedPost(post.id)}
                          aria-label="Delete shared post"
                          className="py-2 px-3 bg-[#F3EFEA] hover:bg-[#E4DDD5] text-[#8B2635] text-xs font-medium rounded-lg transition-colors shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : snapshots.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display text-2xl text-[#191615] mb-2">
                No Glamour Photos Captured Yet
              </p>
              <p className="text-xs text-[#6E6560] max-w-xs mx-auto leading-relaxed">
                Click <strong className="font-medium text-[#191615]">Click Photo</strong> inside the studio mirror to capture, export, and share your finished looks across Face, Eye, Lip, Skincare Prep, Tools &amp; Body Pro products.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {snapshots.map((snap) => {
                const active = extractActiveProducts(snap.look);
                const snapKitIds =
                  snap.kitItemIds && snap.kitItemIds.length > 0
                    ? snap.kitItemIds
                    : activeKitIds;
                const snapKitProducts = snapKitIds
                  .map((id) => getKitProductById(id))
                  .filter((p): p is MuaKitProduct => Boolean(p));
                const previewTags = generateBeautyHashtags(
                  active,
                  snapKitProducts,
                  snap.look,
                  'instagram',
                  true
                ).slice(0, 4);

                return (
                  <div
                    key={snap.id}
                    className="bg-white rounded-xl border border-[#191615]/10 overflow-hidden"
                  >
                    <img
                      src={snap.imageUrl}
                      alt={`Captured glamour shot at ${snap.timestamp}`}
                      referrerPolicy="no-referrer"
                      className="w-full aspect-[3/4] object-cover"
                    />
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2 text-xs text-[#6E6560]">
                        <span className="font-medium text-[#191615]">
                          {snap.modelLabel}
                        </span>
                        <span className="font-mono tabular-nums">
                          {snap.timestamp} · {active.length + snapKitProducts.length} products
                        </span>
                      </div>

                      {active.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          {active.map((entry) => (
                            <span
                              key={`${entry.categoryLabel}-${entry.shade.id}`}
                              title={`${entry.categoryLabel}: ${entry.shade.name} (${entry.shade.brand})`}
                              className="w-3.5 h-3.5 rounded-full border border-[#191615]/15 shrink-0"
                              style={{ backgroundColor: entry.shade.hex }}
                            />
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-[#5C534E] leading-relaxed">
                        {[
                          ...active.map(
                            (a) => `${a.categoryLabel}: ${a.shade.name}`
                          ),
                          ...snapKitProducts.slice(0, 4).map((k) => k.itemName),
                        ].join(' · ') || 'Bare Complexion Study'}
                      </div>
                      <div className="text-[11px] text-[#8B2635] truncate">
                        {previewTags.join('  ')}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSharingSnapshotId(snap.id)}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#8B2635] hover:bg-[#6E1D2A] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share to Social</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(snap)}
                          className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-[#191615] hover:bg-[#2F2A28] text-[#FAF8F6] text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Photo</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onApplySavedLook(snap.look);
                            onClose();
                          }}
                          className="flex-1 py-2 px-3 bg-[#F3EFEA] text-[#191615] text-xs font-medium rounded-lg hover:bg-[#E4DDD5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Reload Shades
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSnapshot(snap.id)}
                          aria-label="Delete photo"
                          className="py-2 px-3 bg-[#F3EFEA] text-[#8B2635] text-xs font-medium rounded-lg hover:bg-[#E4DDD5] transition-colors shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
