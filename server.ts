import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '16mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function extractCleanGeminiError(err: unknown, fallbackMsg: string): string {
  if (!(err instanceof Error)) return fallbackMsg;
  const raw = err.message || fallbackMsg;
  try {
    const parsed = JSON.parse(raw);
    const nestedMsg = parsed?.error?.message;
    if (typeof nestedMsg === 'string' && nestedMsg.trim()) {
      return nestedMsg;
    }
  } catch {
    // Not JSON
  }
  return raw;
}

async function generateBeautyTipsWithRetry(
  prompt: string,
  schema: Record<string, unknown>
) {
  const modelsToTry: Array<{ model: string; useThinking: boolean }> = [
    { model: 'gemini-4-hydrogen', useThinking: true },
    { model: 'gemini-4-hydrogen', useThinking: true },
    { model: 'gemini-3.1-flash-lite', useThinking: false },
  ];

  let lastErr: unknown;
  for (let i = 0; i < modelsToTry.length; i++) {
    const attempt = modelsToTry[i];
    try {
      return await ai.models.generateContent({
        model: attempt.model,
        contents: prompt,
        config: {
          ...(attempt.useThinking
            ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
            : {}),
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });
    } catch (err: unknown) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : '';
      const isTransient =
        msg.includes('503') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('429') ||
        msg.includes('high demand');
      if (!isTransient || i === modelsToTry.length - 1) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
  throw lastErr;
}

interface StoredProduct {
  id: string;
  category: string;
  brand: string;
  name: string;
  code: string;
  hex: string;
  undertone: string;
  description: string;
  price: number;
  defaultFinish?: string;
  isCustom?: boolean;
}

interface ProductOverride {
  price?: number;
  inStock?: boolean;
}

interface StoredModel {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  complexion: string;
  undertone: string;
  faceShape: 'Oval' | 'Heart' | 'Square' | 'Diamond' | 'Round';
  imageUrl: string;
  recommendedFoundationId: string;
  isCustom?: boolean;
}

interface StoredSavedLook {
  id: string;
  imageUrl: string;
  timestamp: string;
  modelLabel: string;
  look: Record<string, unknown>;
  kitItemIds?: string[];
}

interface StoredOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  items: {
    shadeId: string;
    name: string;
    brand: string;
    category: string;
    finishLabel: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  status: 'Preparing' | 'Dispatched' | 'Delivered';
  createdAt: string;
}

interface StoredConsultation {
  id: string;
  createdAt: string;
  occasion: string;
  undertone: string;
  complexionDepth: string;
  lookTitle: string;
  hydrationScore: number;
  brightnessScore: number;
  textureScore: number;
  faceNotes?: string;
}

interface StoredWaterIntake {
  id: string;
  date: string;
  glasses: number;
  ml: number;
  hydrationScore: number;
  note?: string;
}

interface StoredBrandShoot {
  id: string;
  campaignTitle: string;
  brand: string;
  modelId: string;
  modelName: string;
  presetName: string;
  shootDate: string;
  status: 'Scheduled' | 'In Studio' | 'Editing' | 'Delivered';
  deliverablesCount: number;
  notes?: string;
}

interface StoredRedeemedReward {
  id: string;
  title: string;
  cost: number;
  voucherCode: string;
  redeemedAt: string;
}

interface StoredClaimedChallenge {
  id: string;
  challengeId: string;
  title: string;
  bonusPoints: number;
  claimedAt: string;
}

interface StoredSocialPost {
  id: string;
  snapshotId: string;
  platform: 'instagram' | 'tiktok' | 'pinterest' | 'x';
  imageUrl: string;
  modelLabel: string;
  summaryLine: string;
  caption: string;
  hashtags: string[];
  products: Record<string, unknown>[];
  kitProducts?: Record<string, unknown>[];
  sharedAt: string;
  handle: string;
}

interface StoredBagItem {
  shade: StoredProduct;
  finishLabel: string;
  quantity: number;
}

interface AtelierStore {
  customProducts: StoredProduct[];
  productOverrides: Record<string, ProductOverride>;
  archivedProductIds: string[];
  customModels: StoredModel[];
  savedLooks: StoredSavedLook[];
  orders: StoredOrder[];
  aiConsultations: StoredConsultation[];
  waterIntakeLogs: StoredWaterIntake[];
  brandShoots: StoredBrandShoot[];
  redeemedRewards: StoredRedeemedReward[];
  challengeCheckIns: Record<string, string[]>;
  claimedChallengeRewards: StoredClaimedChallenge[];
  socialPosts: StoredSocialPost[];
  selectedKitIds: string[];
  bagItems: StoredBagItem[];
}

const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'atelier-store.json');

const DEFAULT_STORE: AtelierStore = {
  customProducts: [],
  productOverrides: {},
  archivedProductIds: [],
  customModels: [],
  savedLooks: [],
  orders: [
    {
      id: 'GM-1038',
      customerName: 'Elena Vance',
      customerEmail: 'elena.vance@example.com',
      items: [
        {
          shadeId: 'fnd-sand',
          name: '03 Golden Sand',
          brand: 'Maison Velours',
          category: 'foundation',
          finishLabel: 'Natural Satin',
          price: 56,
          quantity: 1,
        },
        {
          shadeId: 'lip-rosewood',
          name: 'Rosewood Whisper',
          brand: 'Maison Velours',
          category: 'lipstick',
          finishLabel: 'Satin',
          price: 38,
          quantity: 1,
        },
      ],
      total: 94,
      status: 'Dispatched',
      createdAt: '2026-11-12T16:40:00Z',
    },
    {
      id: 'GM-1041',
      customerName: 'Aarav Mehta',
      customerEmail: 'aarav.m@example.com',
      items: [
        {
          shadeId: 'kaj-soot',
          name: 'Royal Charcoal Kajal',
          brand: 'Atelier Kōhl',
          category: 'kajal',
          finishLabel: 'Tight Waterline',
          price: 28,
          quantity: 1,
        },
        {
          shadeId: 'hlt-gold',
          name: 'Sunlit Amber',
          brand: 'Lumière Privée',
          category: 'highlighter',
          finishLabel: 'Pearl Sheen',
          price: 46,
          quantity: 1,
        },
      ],
      total: 74,
      status: 'Preparing',
      createdAt: '2026-11-13T08:15:00Z',
    },
  ],
  aiConsultations: [
    {
      id: 'ai-seed-5',
      createdAt: '2026-11-13T08:22:00Z',
      occasion: 'Signature Everyday',
      undertone: 'Neutral Shoot',
      complexionDepth: 'Light-Medium',
      lookTitle: 'Soft Rosewood Satin',
      hydrationScore: 84,
      brightnessScore: 81,
      textureScore: 86,
      faceNotes: 'Supple cheek barrier hydration and refined pore smoothness along T-zone.',
    },
    {
      id: 'ai-seed-4',
      createdAt: '2026-11-06T11:10:00Z',
      occasion: 'Sunlit Editorial',
      undertone: 'Neutral Shoot',
      complexionDepth: 'Light-Medium',
      lookTitle: 'Sunlit Sienna',
      hydrationScore: 79,
      brightnessScore: 78,
      textureScore: 82,
      faceNotes: 'Balanced mid-cheek luminosity with steady barrier recovery.',
    },
    {
      id: 'ai-seed-3',
      createdAt: '2026-10-29T15:40:00Z',
      occasion: 'Candlelit Evening',
      undertone: 'Neutral Shoot',
      complexionDepth: 'Light-Medium',
      lookTitle: 'Parisian Matte',
      hydrationScore: 75,
      brightnessScore: 73,
      textureScore: 79,
      faceNotes: 'Subtle surface grain visible around wings of nose; mild dryness near jawline.',
    },
    {
      id: 'ai-seed-2',
      createdAt: '2026-10-21T09:15:00Z',
      occasion: 'Signature Everyday',
      undertone: 'Warm-Neutral',
      complexionDepth: 'Light-Medium',
      lookTitle: 'Rosewater Dew',
      hydrationScore: 71,
      brightnessScore: 70,
      textureScore: 76,
      faceNotes: 'Even skin tone with slight seasonal moisture depletion.',
    },
    {
      id: 'ai-seed-1',
      createdAt: '2026-10-14T14:05:00Z',
      occasion: 'Baseline Scan',
      undertone: 'Warm-Neutral',
      complexionDepth: 'Light-Medium',
      lookTitle: 'Atelier Baseline',
      hydrationScore: 66,
      brightnessScore: 67,
      textureScore: 72,
      faceNotes: 'Initial barrier baseline prior to targeted humectant prep protocol.',
    },
  ],
  waterIntakeLogs: [
    {
      id: 'water-2026-11-13',
      date: '2026-11-13',
      glasses: 9,
      ml: 2250,
      hydrationScore: 84,
      note: 'Morning electrolytes + steady mineral water throughout shoot',
    },
    {
      id: 'water-2026-11-06',
      date: '2026-11-06',
      glasses: 8,
      ml: 2000,
      hydrationScore: 79,
      note: '2.0 L daily hydration goal achieved',
    },
    {
      id: 'water-2026-10-29',
      date: '2026-10-29',
      glasses: 7,
      ml: 1750,
      hydrationScore: 75,
      note: 'Afternoon herbal tea + water refill',
    },
    {
      id: 'water-2026-10-21',
      date: '2026-10-21',
      glasses: 6,
      ml: 1500,
      hydrationScore: 71,
      note: 'Mild seasonal dehydration',
    },
    {
      id: 'water-2026-10-14',
      date: '2026-10-14',
      glasses: 5,
      ml: 1250,
      hydrationScore: 66,
      note: 'Starting fluid baseline before hydration challenge',
    },
  ],
  brandShoots: [
    {
      id: 'SH-204',
      campaignTitle: 'Autumn Velvet Editorial',
      brand: 'Maison Velours',
      modelId: 'model-25',
      modelName: 'Model 25',
      presetName: 'Parisian Matte',
      shootDate: '2026-11-13',
      status: 'In Studio',
      deliverablesCount: 16,
      notes: 'Primary campaign shoot on Model 25 with Rosewood Whisper & Bordeaux Velvet.',
    },
    {
      id: 'SH-203',
      campaignTitle: 'Glass Glow Sunlit Series',
      brand: 'Lumière Privée',
      modelId: 'ananya',
      modelName: 'Ananya',
      presetName: 'Sunlit Sienna',
      shootDate: '2026-11-15',
      status: 'Scheduled',
      deliverablesCount: 12,
      notes: 'Golden Hour lighting setup featuring Sunlit Amber highlighter.',
    },
    {
      id: 'SH-202',
      campaignTitle: 'Evening Noir Kōhl Capsule',
      brand: 'Atelier Kōhl',
      modelId: 'marcus',
      modelName: 'Marcus',
      presetName: 'Evening Noir Kōhl',
      shootDate: '2026-11-10',
      status: 'Editing',
      deliverablesCount: 10,
      notes: 'Minimalist tightline kajal framing and satin complexion check.',
    },
    {
      id: 'SH-201',
      campaignTitle: 'Rosewater Botanical Drop',
      brand: 'Soraia Botanics',
      modelId: 'clara',
      modelName: 'Clara',
      presetName: 'Rosewater Dew',
      shootDate: '2026-11-04',
      status: 'Delivered',
      deliverablesCount: 14,
      notes: 'Final high-res studio portraits approved and archived.',
    },
  ],
  redeemedRewards: [],
  challengeCheckIns: {
    'perfect-base-week': ['2026-11-10', '2026-11-11', '2026-11-12'],
    'eyeliner-mastery': ['2026-11-11', '2026-11-12'],
    'glass-skin-hydration': [],
    'editorial-full-face': ['2026-11-12'],
  },
  claimedChallengeRewards: [],
  socialPosts: [],
  selectedKitIds: [
    'mua-cleanser',
    'mua-moisturizer',
    'mua-face-primer',
    'mua-concealer',
    'mua-setting-powder',
    'mua-mascara',
    'mua-eyebrow-gel',
    'mua-lip-liner',
    'mua-setting-spray',
  ],
  bagItems: [],
};

function readStore(): AtelierStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2));
      return structuredClone(DEFAULT_STORE);
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AtelierStore>;
    const rawConsultations = Array.isArray(parsed.aiConsultations)
      ? parsed.aiConsultations
      : [];
    const hasOnlyInitialSingleStub =
      rawConsultations.length === 0 ||
      (rawConsultations.length === 1 && rawConsultations[0]?.id === 'ai-seed-1');
    const normalizedConsultations: StoredConsultation[] = hasOnlyInitialSingleStub
      ? structuredClone(DEFAULT_STORE.aiConsultations)
      : rawConsultations.map((c, idx) => ({
          ...c,
          hydrationScore:
            typeof c.hydrationScore === 'number'
              ? c.hydrationScore
              : Math.min(92, 72 + (rawConsultations.length - idx) * 2),
          brightnessScore:
            typeof c.brightnessScore === 'number'
              ? c.brightnessScore
              : Math.min(90, 70 + (rawConsultations.length - idx) * 2),
          textureScore:
            typeof c.textureScore === 'number'
              ? c.textureScore
              : Math.min(93, 74 + (rawConsultations.length - idx) * 2),
        }));

    return {
      customProducts: Array.isArray(parsed.customProducts) ? parsed.customProducts : [],
      productOverrides: parsed.productOverrides ?? {},
      archivedProductIds: Array.isArray(parsed.archivedProductIds) ? parsed.archivedProductIds : [],
      customModels: Array.isArray(parsed.customModels) ? parsed.customModels : [],
      savedLooks: Array.isArray(parsed.savedLooks) ? parsed.savedLooks : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : DEFAULT_STORE.orders,
      aiConsultations: normalizedConsultations,
      waterIntakeLogs:
        Array.isArray(parsed.waterIntakeLogs) && parsed.waterIntakeLogs.length > 0
          ? parsed.waterIntakeLogs
          : structuredClone(DEFAULT_STORE.waterIntakeLogs),
      brandShoots:
        Array.isArray(parsed.brandShoots) && parsed.brandShoots.length > 0
          ? parsed.brandShoots
          : structuredClone(DEFAULT_STORE.brandShoots),
      redeemedRewards: Array.isArray(parsed.redeemedRewards)
        ? parsed.redeemedRewards
        : [],
      challengeCheckIns:
        parsed.challengeCheckIns && typeof parsed.challengeCheckIns === 'object'
          ? parsed.challengeCheckIns
          : structuredClone(DEFAULT_STORE.challengeCheckIns),
      claimedChallengeRewards: Array.isArray(parsed.claimedChallengeRewards)
        ? parsed.claimedChallengeRewards
        : [],
      socialPosts: Array.isArray(parsed.socialPosts) ? parsed.socialPosts : [],
      selectedKitIds: Array.isArray(parsed.selectedKitIds)
        ? parsed.selectedKitIds
        : structuredClone(DEFAULT_STORE.selectedKitIds),
      bagItems: Array.isArray(parsed.bagItems) ? parsed.bagItems : [],
    };
  } catch {
    return structuredClone(DEFAULT_STORE);
  }
}

function writeStore(store: AtelierStore) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

const VALID_FOUNDATION_IDS = [
  'fnd-porcelain',
  'fnd-ivory',
  'fnd-sand',
  'fnd-honey',
  'fnd-amber',
  'fnd-caramel',
  'fnd-mahogany',
  'fnd-espresso',
];

const VALID_LIPSTICK_IDS = [
  'lip-rosewood',
  'lip-bordeaux',
  'lip-crimson',
  'lip-terracotta',
  'lip-petal',
  'lip-chai',
  'lip-plum',
  'lip-coral',
  'lip-cocoa',
  'lip-nectar',
];

const VALID_EYELINER_IDS = [
  'eye-obsidian',
  'eye-espresso',
  'eye-plum',
  'eye-bronze',
  'eye-navy',
];

const VALID_KAJAL_IDS = [
  'kaj-soot',
  'kaj-umber',
  'kaj-emerald',
  'kaj-indigo',
  'kaj-burgundy',
];

const VALID_EYESHADOW_IDS = [
  'shd-taupe',
  'shd-champagne',
  'shd-bronze',
  'shd-rose',
  'shd-plum',
  'shd-onyx',
];

const VALID_BLUSH_IDS = [
  'blush-rose',
  'blush-peach',
  'blush-berry',
  'blush-terracotta',
  'blush-guava',
  'blush-plum',
  'blush-champagne',
  'blush-hibiscus',
];

const VALID_HIGHLIGHTER_IDS = [
  'hlt-champagne',
  'hlt-rose',
  'hlt-gold',
  'hlt-bronze',
];

// Server Health & Bootstrap full-stack state for Home, User, and Admin pages
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/bootstrap', (_req: Request, res: Response) => {
  const store = readStore();
  res.json(store);
});

// Social Feed Posts (Share to Social full-stack persistence)
app.post('/api/social-posts', (req: Request, res: Response) => {
  const body = req.body as Partial<StoredSocialPost>;
  if (!body.snapshotId || !body.platform || !body.imageUrl || !body.caption) {
    res.status(400).json({ error: 'Snapshot, platform, image, and caption are required.' });
    return;
  }
  const store = readStore();
  const newPost: StoredSocialPost = {
    id: body.id || `post-${Date.now()}`,
    snapshotId: body.snapshotId,
    platform: body.platform,
    imageUrl: body.imageUrl,
    modelLabel: body.modelLabel || 'Studio Model',
    summaryLine: body.summaryLine || '',
    caption: body.caption,
    hashtags: Array.isArray(body.hashtags) ? body.hashtags : [],
    products: Array.isArray(body.products) ? body.products : [],
    kitProducts: Array.isArray(body.kitProducts) ? body.kitProducts : [],
    sharedAt:
      body.sharedAt ||
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    handle: body.handle || '@glam.atelier',
  };
  store.socialPosts = [newPost, ...store.socialPosts].slice(0, 30);
  writeStore(store);
  res.status(201).json({ post: newPost, socialPosts: store.socialPosts });
});

app.delete('/api/social-posts/:id', (req: Request, res: Response) => {
  const store = readStore();
  store.socialPosts = store.socialPosts.filter((p) => p.id !== req.params.id);
  writeStore(store);
  res.json({ ok: true, socialPosts: store.socialPosts });
});

// MUA Kit Selection Persistence
app.put('/api/kit-selection', (req: Request, res: Response) => {
  const { selectedKitIds } = req.body as { selectedKitIds?: string[] };
  if (!Array.isArray(selectedKitIds)) {
    res.status(400).json({ error: 'selectedKitIds array is required.' });
    return;
  }
  const store = readStore();
  store.selectedKitIds = selectedKitIds.filter((x) => typeof x === 'string');
  writeStore(store);
  res.json({ selectedKitIds: store.selectedKitIds });
});

// Vanity Bag Cart Persistence
app.put('/api/bag', (req: Request, res: Response) => {
  const { bagItems } = req.body as { bagItems?: StoredBagItem[] };
  if (!Array.isArray(bagItems)) {
    res.status(400).json({ error: 'bagItems array is required.' });
    return;
  }
  const store = readStore();
  store.bagItems = bagItems;
  writeStore(store);
  res.json({ bagItems: store.bagItems });
});

// User Photo Studio Saved Looks
app.post('/api/saved-looks', (req: Request, res: Response) => {
  const { id, imageUrl, timestamp, modelLabel, look, kitItemIds } =
    req.body as StoredSavedLook;
  if (!imageUrl || !look) {
    res.status(400).json({ error: 'Snapshot image and look data are required.' });
    return;
  }
  const store = readStore();
  const nextLook: StoredSavedLook = {
    id: id || `${Date.now()}`,
    imageUrl,
    timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    modelLabel: modelLabel || 'Studio Model',
    look,
    kitItemIds: Array.isArray(kitItemIds) ? kitItemIds : undefined,
  };
  store.savedLooks = [nextLook, ...store.savedLooks].slice(0, 24);
  writeStore(store);
  res.status(201).json(nextLook);
});

app.delete('/api/saved-looks/:id', (req: Request, res: Response) => {
  const store = readStore();
  store.savedLooks = store.savedLooks.filter((s) => s.id !== req.params.id);
  writeStore(store);
  res.json({ ok: true });
});

// Log daily water intake & recalculate calibrated Hydration Score
app.post('/api/water-intake', (req: Request, res: Response) => {
  const { date, glasses, ml, note } = req.body as {
    date?: string;
    glasses?: number;
    ml?: number;
    note?: string;
  };
  const resolvedDate =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : new Date().toISOString().slice(0, 10);

  const resolvedGlasses = Math.min(
    18,
    Math.max(1, Math.round(Number(glasses) || Math.round((Number(ml) || 2000) / 250)))
  );
  const resolvedMl = Math.min(
    4500,
    Math.max(250, Math.round(Number(ml) || resolvedGlasses * 250))
  );

  // Calibrate hydration score (48..98 scale centered at 2,500ml goal -> ~88)
  const hydrationScore = Math.min(
    98,
    Math.max(48, Math.round(46 + (resolvedMl / 2500) * 42))
  );

  const store = readStore();
  const entry: StoredWaterIntake = {
    id: `water-${resolvedDate}`,
    date: resolvedDate,
    glasses: resolvedGlasses,
    ml: resolvedMl,
    hydrationScore,
    note: note?.trim() || `${resolvedGlasses} glasses (${resolvedMl} ml) logged`,
  };

  const remaining = store.waterIntakeLogs.filter((w) => w.date !== resolvedDate);
  store.waterIntakeLogs = [entry, ...remaining]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  // Keep matching date's AI consultation hydration score & correlated brightness aligned
  const matchingConsultation = store.aiConsultations.find((c) =>
    c.createdAt.startsWith(resolvedDate)
  );
  if (matchingConsultation) {
    matchingConsultation.hydrationScore = hydrationScore;
    matchingConsultation.brightnessScore = Math.min(
      98,
      Math.max(50, Math.round(hydrationScore * 0.92 + 4))
    );
  }

  writeStore(store);
  res.status(201).json({
    entry,
    waterIntakeLogs: store.waterIntakeLogs,
    aiConsultations: store.aiConsultations,
  });
});

// User Orders
app.post('/api/orders', (req: Request, res: Response) => {
  const { customerName, customerEmail, items, total } = req.body as {
    customerName?: string;
    customerEmail?: string;
    items?: StoredOrder['items'];
    total?: number;
  };
  if (!customerName?.trim() || !customerEmail?.trim() || !items || items.length === 0) {
    res.status(400).json({ error: 'Customer name, email, and at least one item are required.' });
    return;
  }
  const store = readStore();
  const orderNumber = 1042 + store.orders.length;
  const order: StoredOrder = {
    id: `GM-${orderNumber}`,
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim(),
    items,
    total: Number(total) || items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    status: 'Preparing',
    createdAt: new Date().toISOString(),
  };
  store.orders = [order, ...store.orders];
  store.bagItems = [];
  writeStore(store);
  res.status(201).json(order);
});

// User Glam Rewards: Redeem points & manage vouchers
function computeLifetimeGlamPoints(store: AtelierStore): number {
  const savedLooksPoints = store.savedLooks.length * 45;
  const totalSpend = store.orders.reduce((sum, o) => sum + o.total, 0);
  const orderPoints = store.orders.length * 120 + Math.round(totalSpend * 0.5);
  const consistentDays = store.waterIntakeLogs.filter((w) => w.ml >= 2000).length;
  const standardDays = Math.max(0, store.waterIntakeLogs.length - consistentDays);
  const streakBonus = consistentDays >= 3 ? 60 : 0;
  const hydrationPoints = consistentDays * 35 + standardDays * 15 + streakBonus;
  const challengeBonusPoints = (store.claimedChallengeRewards || []).reduce(
    (sum, c) => sum + c.bonusPoints,
    0
  );
  return savedLooksPoints + orderPoints + hydrationPoints + challengeBonusPoints;
}

const CHALLENGE_RULES: Record<
  string,
  { title: string; targetCount: number; bonusPoints: number }
> = {
  'perfect-base-week': {
    title: 'Perfect Base Week',
    targetCount: 5,
    bonusPoints: 120,
  },
  'eyeliner-mastery': {
    title: 'Eyeliner Mastery',
    targetCount: 4,
    bonusPoints: 100,
  },
  'glass-skin-hydration': {
    title: 'Glass-Skin Hydration Streak',
    targetCount: 5,
    bonusPoints: 140,
  },
  'editorial-full-face': {
    title: 'Editorial Capsule Streak',
    targetCount: 3,
    bonusPoints: 110,
  },
};

function computeAutoChallengeCount(
  store: AtelierStore,
  challengeId: string
): number {
  if (challengeId === 'perfect-base-week') {
    return store.savedLooks.filter((s) => {
      const f = (s.look as Record<string, { enabled?: boolean } | undefined>)
        ?.foundation;
      return Boolean(f?.enabled);
    }).length;
  }
  if (challengeId === 'eyeliner-mastery') {
    return store.savedLooks.filter((s) => {
      const lookObj = s.look as Record<
        string,
        { enabled?: boolean } | undefined
      >;
      return Boolean(lookObj?.eyeliner?.enabled || lookObj?.kajal?.enabled);
    }).length;
  }
  if (challengeId === 'glass-skin-hydration') {
    return store.waterIntakeLogs.filter((w) => w.ml >= 2000).length;
  }
  if (challengeId === 'editorial-full-face') {
    return store.savedLooks.filter((s) => {
      const lookObj = s.look as Record<
        string,
        { enabled?: boolean } | undefined
      >;
      const activeCount = [
        'lipstick',
        'eyeshadow',
        'blush',
        'highlighter',
      ].filter((cat) => Boolean(lookObj?.[cat]?.enabled)).length;
      return activeCount >= 3;
    }).length;
  }
  return 0;
}

app.post('/api/challenges/checkin', (req: Request, res: Response) => {
  const { challengeId, action } = req.body as {
    challengeId?: string;
    action?: 'add' | 'undo';
  };
  if (!challengeId || !CHALLENGE_RULES[challengeId]) {
    res.status(400).json({ error: 'Valid weekly challenge ID is required.' });
    return;
  }
  const store = readStore();
  const rule = CHALLENGE_RULES[challengeId];
  const existing = Array.isArray(store.challengeCheckIns[challengeId])
    ? [...store.challengeCheckIns[challengeId]]
    : [];

  if (action === 'undo') {
    const alreadyClaimed = store.claimedChallengeRewards.some(
      (c) => c.challengeId === challengeId
    );
    if (alreadyClaimed) {
      res
        .status(400)
        .json({ error: 'Cannot undo sessions after challenge bonus is claimed.' });
      return;
    }
    if (existing.length > 0) {
      existing.pop();
    }
  } else {
    const autoCount = computeAutoChallengeCount(store, challengeId);
    if (autoCount + existing.length < rule.targetCount) {
      existing.push(new Date().toISOString().slice(0, 10));
    }
  }

  store.challengeCheckIns = {
    ...store.challengeCheckIns,
    [challengeId]: existing,
  };
  writeStore(store);
  res.status(201).json({
    challengeId,
    challengeCheckIns: store.challengeCheckIns,
  });
});

app.post('/api/challenges/claim', (req: Request, res: Response) => {
  const { challengeId } = req.body as { challengeId?: string };
  if (!challengeId || !CHALLENGE_RULES[challengeId]) {
    res.status(400).json({ error: 'Valid weekly challenge ID is required.' });
    return;
  }
  const store = readStore();
  const rule = CHALLENGE_RULES[challengeId];

  if (
    store.claimedChallengeRewards.some((c) => c.challengeId === challengeId)
  ) {
    res.status(400).json({ error: 'This weekly streak reward is already claimed.' });
    return;
  }

  const autoCount = computeAutoChallengeCount(store, challengeId);
  const manualCount = (store.challengeCheckIns[challengeId] || []).length;
  if (autoCount + manualCount < rule.targetCount) {
    res.status(400).json({
      error: `Complete all ${rule.targetCount} streak steps before claiming +${rule.bonusPoints} Glam Points.`,
    });
    return;
  }

  const claimed: StoredClaimedChallenge = {
    id: `chg-${challengeId}-${Date.now()}`,
    challengeId,
    title: rule.title,
    bonusPoints: rule.bonusPoints,
    claimedAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  };

  store.claimedChallengeRewards = [claimed, ...store.claimedChallengeRewards];
  writeStore(store);
  res.status(201).json({
    claimed,
    claimedChallengeRewards: store.claimedChallengeRewards,
  });
});

app.delete('/api/challenges/reset', (_req: Request, res: Response) => {
  const store = readStore();
  store.challengeCheckIns = structuredClone(DEFAULT_STORE.challengeCheckIns);
  store.claimedChallengeRewards = [];
  writeStore(store);
  res.json({
    ok: true,
    challengeCheckIns: store.challengeCheckIns,
    claimedChallengeRewards: [],
  });
});

app.post('/api/rewards/redeem', (req: Request, res: Response) => {
  const { id, title, cost, codePrefix } = req.body as {
    id?: string;
    title?: string;
    cost?: number;
    codePrefix?: string;
  };
  const numericCost = Number(cost);
  if (!title?.trim() || !Number.isFinite(numericCost) || numericCost <= 0) {
    res.status(400).json({ error: 'Valid reward title and points cost are required.' });
    return;
  }
  const store = readStore();
  const lifetime = computeLifetimeGlamPoints(store);
  const spent = store.redeemedRewards.reduce((sum, r) => sum + r.cost, 0);
  const available = Math.max(0, lifetime - spent);

  if (available < numericCost) {
    res.status(400).json({ error: 'Insufficient available Glam Points for this reward.' });
    return;
  }

  const suffix = Math.floor(1000 + Math.random() * 9000);
  const prefix = (codePrefix || 'GLAM').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const voucher: StoredRedeemedReward = {
    id: `${id || 'perk'}-${Date.now()}`,
    title: title.trim(),
    cost: numericCost,
    voucherCode: `${prefix}-${suffix}`,
    redeemedAt: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  };

  store.redeemedRewards = [voucher, ...store.redeemedRewards].slice(0, 30);
  writeStore(store);
  res.status(201).json({
    voucher,
    redeemedRewards: store.redeemedRewards,
  });
});

app.delete('/api/rewards/redeemed', (_req: Request, res: Response) => {
  const store = readStore();
  store.redeemedRewards = [];
  writeStore(store);
  res.json({ ok: true, redeemedRewards: [] });
});

// Admin: Update order status
app.patch('/api/admin/orders/:id', (req: Request, res: Response) => {
  const { status } = req.body as { status?: StoredOrder['status'] };
  if (!status || !['Preparing', 'Dispatched', 'Delivered'].includes(status)) {
    res.status(400).json({ error: 'Valid order status is required.' });
    return;
  }
  const store = readStore();
  const target = store.orders.find((o) => o.id === req.params.id);
  if (!target) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }
  target.status = status;
  writeStore(store);
  res.json(target);
});

// Admin: Add custom cosmetic product
app.post('/api/admin/products', (req: Request, res: Response) => {
  const body = req.body as Partial<StoredProduct>;
  if (!body.name?.trim() || !body.category || !body.brand || !body.hex) {
    res.status(400).json({ error: 'Name, brand, category, and hex swatch are required.' });
    return;
  }
  const store = readStore();
  const newProduct: StoredProduct = {
    id: `custom-${Date.now()}`,
    category: body.category,
    brand: body.brand,
    name: body.name.trim(),
    code: body.code?.trim() || `C-${store.customProducts.length + 1}`,
    hex: body.hex,
    undertone: body.undertone?.trim() || 'Neutral',
    description:
      body.description?.trim() ||
      'Atelier-curated pigment formulated for seamless live mirror blending.',
    price: Math.max(10, Number(body.price) || 38),
    defaultFinish: body.defaultFinish,
    isCustom: true,
  };
  store.customProducts = [newProduct, ...store.customProducts];
  writeStore(store);
  res.status(201).json(newProduct);
});

// Admin: Update price / stock override for any built-in or custom product
app.patch('/api/admin/products/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { price, inStock } = req.body as { price?: number; inStock?: boolean };
  const store = readStore();

  const custom = store.customProducts.find((p) => p.id === id);
  if (custom && typeof price === 'number' && price > 0) {
    custom.price = price;
  }

  store.productOverrides[id] = {
    ...store.productOverrides[id],
    ...(typeof price === 'number' && price > 0 ? { price } : {}),
    ...(typeof inStock === 'boolean' ? { inStock } : {}),
  };

  if (inStock === false) {
    if (!store.archivedProductIds.includes(id)) {
      store.archivedProductIds.push(id);
    }
  } else if (inStock === true) {
    store.archivedProductIds = store.archivedProductIds.filter((x) => x !== id);
  }

  writeStore(store);
  res.json({ id, override: store.productOverrides[id], archived: store.archivedProductIds.includes(id) });
});

app.delete('/api/admin/products/:id', (req: Request, res: Response) => {
  const store = readStore();
  store.customProducts = store.customProducts.filter((p) => p.id !== req.params.id);
  delete store.productOverrides[String(req.params.id)];
  store.archivedProductIds = store.archivedProductIds.filter((x) => x !== req.params.id);
  writeStore(store);
  res.json({ ok: true });
});

// Admin: Add / remove studio models
app.post('/api/admin/models', (req: Request, res: Response) => {
  const body = req.body as Partial<StoredModel>;
  if (!body.name?.trim() || !body.imageUrl?.trim()) {
    res.status(400).json({ error: 'Model name and portrait image URL are required.' });
    return;
  }
  const store = readStore();
  const newModel: StoredModel = {
    id: `model-${Date.now()}`,
    name: body.name.trim(),
    gender: body.gender === 'Male' ? 'Male' : 'Female',
    complexion: body.complexion?.trim() || 'Medium',
    undertone: body.undertone?.trim() || 'Neutral',
    faceShape: body.faceShape || 'Oval',
    imageUrl: body.imageUrl.trim(),
    recommendedFoundationId: body.recommendedFoundationId || 'fnd-sand',
    isCustom: true,
  };
  store.customModels = [...store.customModels, newModel];
  writeStore(store);
  res.status(201).json(newModel);
});

app.delete('/api/admin/models/:id', (req: Request, res: Response) => {
  const store = readStore();
  store.customModels = store.customModels.filter((m) => m.id !== req.params.id);
  writeStore(store);
  res.json({ ok: true });
});

// Admin: Brand Shoot Model Tracker CRUD
app.post('/api/admin/shoots', (req: Request, res: Response) => {
  const body = req.body as Partial<StoredBrandShoot>;
  if (!body.campaignTitle?.trim() || !body.brand || !body.modelId) {
    res
      .status(400)
      .json({ error: 'Campaign title, brand, and studio model are required.' });
    return;
  }
  const store = readStore();
  const nextNumber = 205 + store.brandShoots.length;
  const newShoot: StoredBrandShoot = {
    id: `SH-${nextNumber}`,
    campaignTitle: body.campaignTitle.trim(),
    brand: body.brand,
    modelId: body.modelId,
    modelName: body.modelName?.trim() || 'Studio Model',
    presetName: body.presetName?.trim() || 'Parisian Matte',
    shootDate:
      body.shootDate && /^\d{4}-\d{2}-\d{2}$/.test(body.shootDate)
        ? body.shootDate
        : new Date().toISOString().slice(0, 10),
    status: body.status || 'Scheduled',
    deliverablesCount: Math.max(1, Number(body.deliverablesCount) || 12),
    notes: body.notes?.trim() || '',
  };
  store.brandShoots = [newShoot, ...store.brandShoots];
  writeStore(store);
  res.status(201).json(newShoot);
});

app.patch('/api/admin/shoots/:id', (req: Request, res: Response) => {
  const { status, deliverablesCount } = req.body as {
    status?: StoredBrandShoot['status'];
    deliverablesCount?: number;
  };
  const store = readStore();
  const target = store.brandShoots.find((s) => s.id === req.params.id);
  if (!target) {
    res.status(404).json({ error: 'Brand shoot not found.' });
    return;
  }
  if (
    status &&
    ['Scheduled', 'In Studio', 'Editing', 'Delivered'].includes(status)
  ) {
    target.status = status;
  }
  if (typeof deliverablesCount === 'number' && deliverablesCount >= 1) {
    target.deliverablesCount = deliverablesCount;
  }
  writeStore(store);
  res.json(target);
});

app.delete('/api/admin/shoots/:id', (req: Request, res: Response) => {
  const store = readStore();
  store.brandShoots = store.brandShoots.filter((s) => s.id !== req.params.id);
  writeStore(store);
  res.json({ ok: true });
});

// Admin AI Merchandising Brief
app.post('/api/admin/merchandising-brief', async (req: Request, res: Response) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
      return;
    }

    const { totalProducts, totalModels } = req.body as {
      totalProducts?: number;
      totalModels?: number;
    };
    const store = readStore();

    const summaryContext = {
      totalProducts: totalProducts || 46,
      totalModels: totalModels || 8,
      archivedCount: store.archivedProductIds.length,
      recentOrders: store.orders.slice(0, 6).map((o) => ({
        total: o.total,
        status: o.status,
        items: o.items.map((i) => `${i.brand} ${i.name} (${i.category})`),
      })),
      recentConsultations: store.aiConsultations.slice(0, 8),
    };

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `You are the Head of Merchandising & Color Science at Glam Mirror AI.
Review these live studio operations metrics and return a concise, actionable executive brief in JSON:
${JSON.stringify(summaryContext)}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            topTrend: { type: Type.STRING },
            assortmentAction: { type: Type.STRING },
            recommendedLaunchCategory: { type: Type.STRING },
          },
          required: ['headline', 'topTrend', 'assortmentAction', 'recommendedLaunchCategory'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (err: unknown) {
    console.error('Error in /api/admin/merchandising-brief:', err);
    const msg = err instanceof Error ? err.message : 'Unable to generate merchandising brief.';
    res.status(500).json({ error: msg });
  }
});

// User Gemini Vision Shade Match
app.post('/api/analyze-look', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, occasion } = req.body as {
      imageBase64?: string;
      mimeType?: string;
      occasion?: string;
    };

    if (!imageBase64) {
      res
        .status(400)
        .json({ error: 'Snapshot image data is required for shade analysis.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res
        .status(500)
        .json({ error: 'Gemini API key is not configured on the server.' });
      return;
    }

    const cleanBase64 = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const occasionPrompt = occasion?.trim()
      ? `The user requested a look tailored for: "${occasion.trim()}".`
      : 'The user wants an elevated, flattering signature look matched to their natural coloring and face shape.';

    const catalogGuide = `
Catalog IDs you MUST choose from:
Foundation IDs: fnd-porcelain (Fair Cool), fnd-ivory (Light Warm), fnd-sand (Light-Medium Warm), fnd-honey (Medium Olive-Neutral), fnd-amber (Medium-Tan Warm), fnd-caramel (Tan-Deep Neutral), fnd-mahogany (Deep Warm), fnd-espresso (Deepest Cool-Neutral)
Lipstick IDs: lip-rosewood, lip-bordeaux, lip-crimson, lip-terracotta, lip-petal, lip-chai, lip-plum, lip-coral, lip-cocoa, lip-nectar
Eyeliner IDs: eye-obsidian, eye-espresso, eye-plum, eye-bronze, eye-navy
Kajal IDs: kaj-soot, kaj-umber, kaj-emerald, kaj-indigo, kaj-burgundy
Eyeshadow IDs: shd-taupe, shd-champagne, shd-bronze, shd-rose, shd-plum, shd-onyx
Blush IDs: blush-rose, blush-peach, blush-berry, blush-terracotta, blush-guava, blush-plum, blush-champagne, blush-hibiscus
Highlighter IDs: hlt-champagne, hlt-rose, hlt-gold, hlt-bronze
`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: cleanBase64,
            },
          },
          {
            text: `You are a master editorial makeup artist and colorist at Glam Mirror Atelier.
Examine the person's portrait closely: evaluate their skin depth, undertone (cool, warm, neutral, olive), face shape (Oval, Heart, Square, Diamond, Round), natural lip pigment, eye framing, and visible skin health indicators on a 40-98 scale: hydrationScore (barrier moisture & plumpness), brightnessScore (radiance & tone evenness), and textureScore (surface smoothness & pore refinement).
${occasionPrompt}
Select the most flattering foundation, lipstick, eyeliner, kajal, eyeshadow, blush, and highlighter from the exact catalog IDs below, along with finishes and natural intensities (0-100). If the portrait is masculine or minimalist grooming is requested, keep lip/eye pigments subtle and skin-authentic.
${catalogGuide}`,
          },
        ],
      },
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            undertone: { type: Type.STRING },
            complexionDepth: { type: Type.STRING },
            faceNotes: { type: Type.STRING },
            lookTitle: { type: Type.STRING },
            artistNote: { type: Type.STRING },
            hydrationScore: { type: Type.INTEGER },
            brightnessScore: { type: Type.INTEGER },
            textureScore: { type: Type.INTEGER },
            foundationId: { type: Type.STRING },
            foundationFinish: { type: Type.STRING },
            foundationIntensity: { type: Type.INTEGER },
            lipstickId: { type: Type.STRING },
            lipstickFinish: { type: Type.STRING },
            lipstickIntensity: { type: Type.INTEGER },
            eyelinerId: { type: Type.STRING },
            eyelinerStyle: { type: Type.STRING },
            eyelinerIntensity: { type: Type.INTEGER },
            eyelinerThickness: { type: Type.INTEGER },
            kajalId: { type: Type.STRING },
            kajalStyle: { type: Type.STRING },
            kajalIntensity: { type: Type.INTEGER },
            eyeshadowId: { type: Type.STRING },
            eyeshadowFinish: { type: Type.STRING },
            eyeshadowIntensity: { type: Type.INTEGER },
            blushId: { type: Type.STRING },
            blushFinish: { type: Type.STRING },
            blushIntensity: { type: Type.INTEGER },
            highlighterId: { type: Type.STRING },
            highlighterFinish: { type: Type.STRING },
            highlighterIntensity: { type: Type.INTEGER },
          },
          required: [
            'undertone',
            'complexionDepth',
            'faceNotes',
            'lookTitle',
            'artistNote',
            'hydrationScore',
            'brightnessScore',
            'textureScore',
            'foundationId',
            'foundationFinish',
            'foundationIntensity',
            'lipstickId',
            'lipstickFinish',
            'lipstickIntensity',
            'eyelinerId',
            'eyelinerStyle',
            'eyelinerIntensity',
            'eyelinerThickness',
            'kajalId',
            'kajalStyle',
            'kajalIntensity',
            'eyeshadowId',
            'eyeshadowFinish',
            'eyeshadowIntensity',
            'blushId',
            'blushFinish',
            'blushIntensity',
            'highlighterId',
            'highlighterFinish',
            'highlighterIntensity',
          ],
        },
      },
    });

    const rawText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(rawText);

    const sanitized = {
      undertone: parsed.undertone || 'Balanced Neutral',
      complexionDepth: parsed.complexionDepth || 'Medium',
      faceNotes:
        parsed.faceNotes ||
        'Even skin texture with balanced natural undertones.',
      lookTitle: parsed.lookTitle || 'Signature Atelier Edit',
      artistNote:
        parsed.artistNote ||
        'Layer sheer foundation across the T-zone, press blush high on the cheekbones, and finish with sculpted lip pigment.',
      hydrationScore: Math.min(
        98,
        Math.max(40, Math.round(Number(parsed.hydrationScore) || 79))
      ),
      brightnessScore: Math.min(
        98,
        Math.max(40, Math.round(Number(parsed.brightnessScore) || 81))
      ),
      textureScore: Math.min(
        98,
        Math.max(40, Math.round(Number(parsed.textureScore) || 82))
      ),
      foundationId: VALID_FOUNDATION_IDS.includes(parsed.foundationId)
        ? parsed.foundationId
        : 'fnd-sand',
      foundationFinish: [
        'Natural Satin',
        'Soft Matte',
        'Radiant Dew',
      ].includes(parsed.foundationFinish)
        ? parsed.foundationFinish
        : 'Natural Satin',
      foundationIntensity: Math.min(
        85,
        Math.max(20, Number(parsed.foundationIntensity) || 42)
      ),
      lipstickId: VALID_LIPSTICK_IDS.includes(parsed.lipstickId)
        ? parsed.lipstickId
        : 'lip-rosewood',
      lipstickFinish: ['Matte', 'Satin', 'Gloss'].includes(
        parsed.lipstickFinish
      )
        ? parsed.lipstickFinish
        : 'Satin',
      lipstickIntensity: Math.min(
        95,
        Math.max(20, Number(parsed.lipstickIntensity) || 68)
      ),
      eyelinerId: VALID_EYELINER_IDS.includes(parsed.eyelinerId)
        ? parsed.eyelinerId
        : 'eye-obsidian',
      eyelinerStyle: ['Tightline', 'Classic Wing', 'Smudged Kohl'].includes(
        parsed.eyelinerStyle
      )
        ? parsed.eyelinerStyle
        : 'Tightline',
      eyelinerIntensity: Math.min(
        95,
        Math.max(25, Number(parsed.eyelinerIntensity) || 70)
      ),
      eyelinerThickness: Math.min(
        9,
        Math.max(2, Number(parsed.eyelinerThickness) || 5)
      ),
      kajalId: VALID_KAJAL_IDS.includes(parsed.kajalId)
        ? parsed.kajalId
        : 'kaj-soot',
      kajalStyle: ['Tight Waterline', 'Classic Kohl', 'Smoky Lower'].includes(
        parsed.kajalStyle
      )
        ? parsed.kajalStyle
        : 'Tight Waterline',
      kajalIntensity: Math.min(
        90,
        Math.max(15, Number(parsed.kajalIntensity) || 45)
      ),
      eyeshadowId: VALID_EYESHADOW_IDS.includes(parsed.eyeshadowId)
        ? parsed.eyeshadowId
        : 'shd-taupe',
      eyeshadowFinish: ['Soft Matte', 'Silk Shimmer', 'Metallic Foil'].includes(
        parsed.eyeshadowFinish
      )
        ? parsed.eyeshadowFinish
        : 'Silk Shimmer',
      eyeshadowIntensity: Math.min(
        85,
        Math.max(20, Number(parsed.eyeshadowIntensity) || 45)
      ),
      blushId: VALID_BLUSH_IDS.includes(parsed.blushId)
        ? parsed.blushId
        : 'blush-rose',
      blushFinish: ['Cream Dew', 'Velvet Powder', 'Radiant Veil'].includes(
        parsed.blushFinish
      )
        ? parsed.blushFinish
        : 'Cream Dew',
      blushIntensity: Math.min(
        80,
        Math.max(15, Number(parsed.blushIntensity) || 46)
      ),
      highlighterId: VALID_HIGHLIGHTER_IDS.includes(parsed.highlighterId)
        ? parsed.highlighterId
        : 'hlt-champagne',
      highlighterFinish: ['Soft Lit', 'Pearl Sheen', 'Glass Glow'].includes(
        parsed.highlighterFinish
      )
        ? parsed.highlighterFinish
        : 'Soft Lit',
      highlighterIntensity: Math.min(
        80,
        Math.max(15, Number(parsed.highlighterIntensity) || 42)
      ),
    };

    // Persist consultation record for User & Admin history
    const store = readStore();
    store.aiConsultations = [
      {
        id: `ai-${Date.now()}`,
        createdAt: new Date().toISOString(),
        occasion: occasion?.trim() || 'Signature Everyday',
        undertone: sanitized.undertone,
        complexionDepth: sanitized.complexionDepth,
        lookTitle: sanitized.lookTitle,
        hydrationScore: sanitized.hydrationScore,
        brightnessScore: sanitized.brightnessScore,
        textureScore: sanitized.textureScore,
        faceNotes: sanitized.faceNotes,
      },
      ...store.aiConsultations,
    ].slice(0, 40);
    writeStore(store);

    res.json(sanitized);
  } catch (err: unknown) {
    console.error('Error in /api/analyze-look:', err);
    const message = extractCleanGeminiError(
      err,
      'Unable to analyze portrait right now.'
    );
    res.status(500).json({ error: message });
  }
});

// Expert Beauty Tips grounded in analyzed skin profile + recent look preferences
app.post('/api/beauty-tips', async (req: Request, res: Response) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      res
        .status(500)
        .json({ error: 'Gemini API key is not configured on the server.' });
      return;
    }

    const {
      skinType = 'Balanced',
      focusArea = 'Balanced Daily',
      seasonalTrend = 'Autumn Velvet',
      skinProfile,
      recentLookPreferences,
    } = req.body as {
      skinType?: string;
      focusArea?: string;
      seasonalTrend?: string;
      skinProfile?: {
        complexionDepth?: string;
        undertone?: string;
        occasion?: string;
        lookTitle?: string;
        sourceLabel?: string;
      };
      recentLookPreferences?: {
        finishes?: string[];
        activeShades?: string[];
        savedSnapshotCount?: number;
      };
    };

    const store = readStore();
    const latestConsultation = store.aiConsultations[0];
    const latestSnapshot = store.savedLooks[0];

    const resolvedDepth =
      skinProfile?.complexionDepth ||
      latestConsultation?.complexionDepth ||
      'Light-Medium';
    const resolvedUndertone =
      skinProfile?.undertone ||
      latestConsultation?.undertone ||
      'Neutral Shoot';
    const resolvedLookTitle =
      skinProfile?.lookTitle ||
      latestConsultation?.lookTitle ||
      'Soft Rosewood Satin';
    const resolvedOccasion =
      skinProfile?.occasion ||
      latestConsultation?.occasion ||
      'Signature Everyday';

    const finishesList =
      recentLookPreferences?.finishes && recentLookPreferences.finishes.length > 0
        ? recentLookPreferences.finishes
        : ['Natural Satin Foundation', 'Satin Lipstick', 'Classic Wing Eyeliner'];
    const activeShadesList =
      recentLookPreferences?.activeShades && recentLookPreferences.activeShades.length > 0
        ? recentLookPreferences.activeShades
        : ['03 Golden Sand', 'Rosewood Whisper', 'Petal Flush'];

    const contextPayload = {
      skinType,
      focusArea,
      seasonalTrend,
      analyzedComplexion: {
        depth: resolvedDepth,
        undertone: resolvedUndertone,
        occasion: resolvedOccasion,
        recentAiLookTitle: resolvedLookTitle,
      },
      recentLookPreferences: {
        preferredFinishes: finishesList,
        activeShades: activeShadesList,
        latestPhotoStudioModel: latestSnapshot?.modelLabel || 'Model 25',
        savedLookCount: store.savedLooks.length,
      },
    };

    const prompt = `You are a Master Aesthetician and Editorial Beauty Director at Glam Mirror Atelier.
Using the client's specific skin undertone, skin type, recent virtual look preferences, and chosen seasonal trend below, author personalized skincare and makeup advice:
1) A 3-step skincare prep protocol calibrated for their skin type, climate/season, and active makeup finishes.
2) 3 targeted makeup techniques referencing their undertone, complexion depth, and recent shades/finishes.
3) 2 concise seasonal palette tips showing how to adapt the seasonal trend ("${seasonalTrend}") to their exact undertone ("${resolvedUndertone}").
Keep advice concrete, practical, ingredient-aware, and free of buzzwords.
Client context:
${JSON.stringify(contextPayload)}`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        profileSummary: { type: Type.STRING },
        headline: { type: Type.STRING },
        seasonalNote: { type: Type.STRING },
        skincareRoutine: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              step: { type: Type.STRING },
              timing: { type: Type.STRING },
              title: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              keyIngredient: { type: Type.STRING },
            },
            required: ['step', 'timing', 'title', 'recommendation', 'keyIngredient'],
          },
        },
        makeupTechniques: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              title: { type: Type.STRING },
              technique: { type: Type.STRING },
              whyItWorks: { type: Type.STRING },
            },
            required: ['category', 'title', 'technique', 'whyItWorks'],
          },
        },
        seasonalPaletteTips: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              trendName: { type: Type.STRING },
              shadeDirection: { type: Type.STRING },
              applicationTip: { type: Type.STRING },
            },
            required: ['trendName', 'shadeDirection', 'applicationTip'],
          },
        },
        proPairingNote: { type: Type.STRING },
      },
      required: [
        'profileSummary',
        'headline',
        'seasonalNote',
        'skincareRoutine',
        'makeupTechniques',
        'seasonalPaletteTips',
        'proPairingNote',
      ],
    };

    const response = await generateBeautyTipsWithRetry(prompt, schema);

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({
      ...parsed,
      generatedAt: new Date().toISOString(),
      usedConsultation: Boolean(latestConsultation),
    });
  } catch (err: unknown) {
    console.error('Error in /api/beauty-tips:', err);
    const message = extractCleanGeminiError(
      err,
      'Unable to generate personalized beauty tips right now.'
    );
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Glam Mirror AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
