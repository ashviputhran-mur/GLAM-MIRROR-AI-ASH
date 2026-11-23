export type MakeupCategory =
  | 'foundation'
  | 'lipstick'
  | 'eyeliner'
  | 'kajal'
  | 'eyeshadow'
  | 'blush'
  | 'highlighter';

export type CosmeticBrand =
  | 'Maison Velours'
  | 'Atelier Kōhl'
  | 'Soraia Botanics'
  | 'Lumière Privée';

export type FoundationFinish = 'Natural Satin' | 'Soft Matte' | 'Radiant Dew';
export type LipstickFinish = 'Matte' | 'Satin' | 'Gloss';
export type EyelinerStyle = 'Tightline' | 'Classic Wing' | 'Smudged Kohl';
export type KajalStyle = 'Tight Waterline' | 'Classic Kohl' | 'Smoky Lower';
export type EyeshadowFinish = 'Soft Matte' | 'Silk Shimmer' | 'Metallic Foil';
export type BlushFinish = 'Cream Dew' | 'Velvet Powder' | 'Radiant Veil';
export type HighlighterFinish = 'Soft Lit' | 'Pearl Sheen' | 'Glass Glow';
export type LightingMode = 'Daylight' | 'Golden Hour' | 'Candlelight';

export interface MakeupShade {
  id: string;
  category: MakeupCategory;
  brand: CosmeticBrand;
  name: string;
  code: string;
  hex: string;
  undertone: string;
  description: string;
  price: number;
  defaultFinish?: string;
  isCustom?: boolean;
  inStock?: boolean;
}

export interface MakeupLookState {
  foundation: {
    enabled: boolean;
    shadeId: string;
    intensity: number;
    finish: FoundationFinish;
  };
  lipstick: {
    enabled: boolean;
    shadeId: string;
    intensity: number;
    finish: LipstickFinish;
  };
  eyeliner: {
    enabled: boolean;
    shadeId: string;
    intensity: number;
    thickness: number;
    style: EyelinerStyle;
  };
  kajal: {
    enabled: boolean;
    shadeId: string;
    intensity: number;
    thickness: number;
    style: KajalStyle;
  };
  eyeshadow: {
    enabled: boolean;
    shadeId: string;
    intensity: number;
    finish: EyeshadowFinish;
  };
  blush: {
    enabled: boolean;
    shadeId: string;
    intensity: number;
    finish: BlushFinish;
  };
  highlighter: {
    enabled: boolean;
    shadeId: string;
    intensity: number;
    finish: HighlighterFinish;
  };
}

export interface StudioModel {
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

export interface EditorialPreset {
  id: string;
  name: string;
  mood: string;
  description: string;
  lipstickId: string;
  lipstickFinish: LipstickFinish;
  lipstickIntensity: number;
  eyelinerId: string;
  eyelinerStyle: EyelinerStyle;
  eyelinerIntensity: number;
  eyelinerThickness: number;
  kajalId: string;
  kajalStyle: KajalStyle;
  kajalIntensity: number;
  eyeshadowId: string;
  eyeshadowFinish: EyeshadowFinish;
  eyeshadowIntensity: number;
  blushId: string;
  blushFinish: BlushFinish;
  blushIntensity: number;
  highlighterId: string;
  highlighterFinish: HighlighterFinish;
  highlighterIntensity: number;
  foundationFinish: FoundationFinish;
  foundationIntensity: number;
}

export const SHOWCASE_PRODUCT_IMAGE =
  '/src/assets/images/product_lipstick_trio_1794563465073.jpg';

export const COSMETIC_BRANDS: CosmeticBrand[] = [
  'Maison Velours',
  'Atelier Kōhl',
  'Soraia Botanics',
  'Lumière Privée',
];

export const STUDIO_MODELS: StudioModel[] = [
  {
    id: 'model-25',
    name: 'Model 25',
    gender: 'Female',
    complexion: 'Light-Medium',
    undertone: 'Neutral Shoot',
    faceShape: 'Oval',
    imageUrl: '/src/assets/images/model_portrait_shoot_25_1794564047239.jpg',
    recommendedFoundationId: 'fnd-sand',
  },
  {
    id: 'clara',
    name: 'Clara',
    gender: 'Female',
    complexion: 'Fair Porcelain',
    undertone: 'Cool-Neutral',
    faceShape: 'Heart',
    imageUrl: '/src/assets/images/model_portrait_fair_1794563463366.jpg',
    recommendedFoundationId: 'fnd-porcelain',
  },
  {
    id: 'ananya',
    name: 'Ananya',
    gender: 'Female',
    complexion: 'Golden Bronze',
    undertone: 'Warm Honey',
    faceShape: 'Heart',
    imageUrl: '/src/assets/images/model_female_bronze_1794564299035.jpg',
    recommendedFoundationId: 'fnd-amber',
  },
  {
    id: 'maya',
    name: 'Maya',
    gender: 'Female',
    complexion: 'Medium-Tan',
    undertone: 'Warm Olive',
    faceShape: 'Oval',
    imageUrl: '/src/assets/images/model_portrait_warm_1794563464070.jpg',
    recommendedFoundationId: 'fnd-honey',
  },
  {
    id: 'nia',
    name: 'Nia',
    gender: 'Female',
    complexion: 'Rich Espresso',
    undertone: 'Warm-Neutral',
    faceShape: 'Round',
    imageUrl: '/src/assets/images/model_portrait_deep_1794563464122.jpg',
    recommendedFoundationId: 'fnd-mahogany',
  },
  {
    id: 'julian',
    name: 'Julian',
    gender: 'Male',
    complexion: 'Fair Cool',
    undertone: 'Cool-Neutral',
    faceShape: 'Square',
    imageUrl: '/src/assets/images/model_male_fair_1794564297298.jpg',
    recommendedFoundationId: 'fnd-ivory',
  },
  {
    id: 'mateo',
    name: 'Mateo',
    gender: 'Male',
    complexion: 'Warm Olive',
    undertone: 'Golden-Tan',
    faceShape: 'Diamond',
    imageUrl: '/src/assets/images/model_male_warm_1794564297492.jpg',
    recommendedFoundationId: 'fnd-honey',
  },
  {
    id: 'marcus',
    name: 'Marcus',
    gender: 'Male',
    complexion: 'Rich Espresso',
    undertone: 'Deep Neutral',
    faceShape: 'Oval',
    imageUrl: '/src/assets/images/model_male_deep_1794564298660.jpg',
    recommendedFoundationId: 'fnd-espresso',
  },
];

export const MAKEUP_SHADES: MakeupShade[] = [
  // Foundation (8 shades)
  {
    id: 'fnd-porcelain',
    category: 'foundation',
    brand: 'Soraia Botanics',
    name: '01 Alabaster Silk',
    code: '110C',
    hex: '#F2DDD0',
    undertone: 'Cool Rose',
    description: 'Sheer-to-medium skin-evening veil for fair cool complexions.',
    price: 54,
  },
  {
    id: 'fnd-ivory',
    category: 'foundation',
    brand: 'Soraia Botanics',
    name: '02 Warm Ivory',
    code: '140W',
    hex: '#EDD4BB',
    undertone: 'Warm Peach',
    description: 'Weightless serum foundation with subtle golden warmth.',
    price: 54,
  },
  {
    id: 'fnd-sand',
    category: 'foundation',
    brand: 'Maison Velours',
    name: '03 Golden Sand',
    code: '220W',
    hex: '#DFB892',
    undertone: 'Warm Golden',
    description: 'Flexible pigment suspension that melts seamlessly into light-medium skin.',
    price: 56,
  },
  {
    id: 'fnd-honey',
    category: 'foundation',
    brand: 'Maison Velours',
    name: '04 Olive Honey',
    code: '270N',
    hex: '#CDA078',
    undertone: 'Neutral Olive',
    description: 'Balanced olive-neutral tone engineered to neutralize redness.',
    price: 56,
  },
  {
    id: 'fnd-amber',
    category: 'foundation',
    brand: 'Lumière Privée',
    name: '05 Spiced Amber',
    code: '330W',
    hex: '#B37E56',
    undertone: 'Warm Terracotta',
    description: 'Luminous medium-tan coverage with zero ashiness.',
    price: 58,
  },
  {
    id: 'fnd-caramel',
    category: 'foundation',
    brand: 'Maison Velours',
    name: '06 Roasted Caramel',
    code: '380N',
    hex: '#93603E',
    undertone: 'Neutral Bronze',
    description: 'Velvet mineral fluid that blurs pores and refines tone.',
    price: 56,
  },
  {
    id: 'fnd-mahogany',
    category: 'foundation',
    brand: 'Lumière Privée',
    name: '07 Deep Mahogany',
    code: '440W',
    hex: '#6D422B',
    undertone: 'Warm Umber',
    description: 'Rich red-gold undertone designed for deep warm complexions.',
    price: 58,
  },
  {
    id: 'fnd-espresso',
    category: 'foundation',
    brand: 'Maison Velours',
    name: '08 Velvet Espresso',
    code: '490C',
    hex: '#4D2D1E',
    undertone: 'Cool Neutral',
    description: 'True deep espresso pigment with natural skin-like reflection.',
    price: 56,
  },

  // Lipstick (10 shades)
  {
    id: 'lip-rosewood',
    category: 'lipstick',
    brand: 'Maison Velours',
    name: 'Rosewood Whisper',
    code: 'L-01',
    hex: '#A8585E',
    undertone: 'Neutral Rose',
    description: 'Everyday dusty rosewood with balanced muted depth.',
    price: 38,
    defaultFinish: 'Satin',
  },
  {
    id: 'lip-bordeaux',
    category: 'lipstick',
    brand: 'Maison Velours',
    name: 'Bordeaux Velvet',
    code: 'L-02',
    hex: '#6E1D2A',
    undertone: 'Deep Cool Wine',
    description: 'High-pigment Parisian oxblood with plush velvet cushion.',
    price: 38,
    defaultFinish: 'Matte',
  },
  {
    id: 'lip-crimson',
    category: 'lipstick',
    brand: 'Lumière Privée',
    name: 'Atelier Crimson',
    code: 'L-03',
    hex: '#A61E2B',
    undertone: 'Blue-Red',
    description: 'Iconic true crimson engineered to brighten every complexion.',
    price: 40,
    defaultFinish: 'Satin',
  },
  {
    id: 'lip-terracotta',
    category: 'lipstick',
    brand: 'Soraia Botanics',
    name: 'Burnt Sienna',
    code: 'L-04',
    hex: '#A94C38',
    undertone: 'Warm Rust',
    description: 'Sun-baked terracotta spiced with warm cinnamon undertones.',
    price: 36,
    defaultFinish: 'Matte',
  },
  {
    id: 'lip-petal',
    category: 'lipstick',
    brand: 'Soraia Botanics',
    name: 'Peony Veil',
    code: 'L-05',
    hex: '#C8767D',
    undertone: 'Soft Cool Pink',
    description: 'Translucent petal pink formulated for glassy daytime shine.',
    price: 34,
    defaultFinish: 'Gloss',
  },
  {
    id: 'lip-chai',
    category: 'lipstick',
    brand: 'Maison Velours',
    name: 'Spiced Chai',
    code: 'L-06',
    hex: '#8C5647',
    undertone: 'Warm Nude',
    description: 'Sculpting brown-rose nude tailored for medium to deep tones.',
    price: 38,
    defaultFinish: 'Satin',
  },
  {
    id: 'lip-plum',
    category: 'lipstick',
    brand: 'Atelier Kōhl',
    name: 'Blackberry Wine',
    code: 'L-07',
    hex: '#572132',
    undertone: 'Cool Berry',
    description: 'Editorial crushed blackberry stain with buildable opacity.',
    price: 39,
    defaultFinish: 'Matte',
  },
  {
    id: 'lip-coral',
    category: 'lipstick',
    brand: 'Soraia Botanics',
    name: 'Cannes Coral',
    code: 'L-08',
    hex: '#CA5245',
    undertone: 'Warm Vermilion',
    description: 'Luminous poppy coral that wakes up warm and olive skin.',
    price: 36,
    defaultFinish: 'Gloss',
  },
  {
    id: 'lip-cocoa',
    category: 'lipstick',
    brand: 'Maison Velours',
    name: 'Toasted Cocoa',
    code: 'L-09',
    hex: '#6B3E33',
    undertone: 'Neutral Espresso',
    description: 'Rich espresso-nude with effortless satin glide.',
    price: 38,
    defaultFinish: 'Satin',
  },
  {
    id: 'lip-nectar',
    category: 'lipstick',
    brand: 'Lumière Privée',
    name: 'Fig Nectar',
    code: 'L-10',
    hex: '#93434E',
    undertone: 'Warm Berry',
    description: 'Juicy crushed fig tint with mirror-gloss luminosity.',
    price: 36,
    defaultFinish: 'Gloss',
  },

  // Eyeliner (5 pigments)
  {
    id: 'eye-obsidian',
    category: 'eyeliner',
    brand: 'Atelier Kōhl',
    name: 'Obsidian Ink',
    code: 'E-01',
    hex: '#161414',
    undertone: 'True Carbon Black',
    description: 'Waterproof micro-precision calligraphy liner in deepest black.',
    price: 32,
  },
  {
    id: 'eye-espresso',
    category: 'eyeliner',
    brand: 'Soraia Botanics',
    name: 'Roast Espresso',
    code: 'E-02',
    hex: '#38251D',
    undertone: 'Warm Umber',
    description: 'Soft-focus dark brown for effortless daytime lash definition.',
    price: 32,
  },
  {
    id: 'eye-plum',
    category: 'eyeliner',
    brand: 'Maison Velours',
    name: 'Aubergine Noir',
    code: 'E-03',
    hex: '#3D1E2A',
    undertone: 'Cool Violet-Black',
    description: 'Subtle plum-black pigment that makes hazel and brown eyes pop.',
    price: 34,
  },
  {
    id: 'eye-bronze',
    category: 'eyeliner',
    brand: 'Lumière Privée',
    name: 'Burnished Bronze',
    code: 'E-04',
    hex: '#634430',
    undertone: 'Warm Metallic',
    description: 'Smoky bronze kohl for sunlit editorial definition.',
    price: 34,
  },
  {
    id: 'eye-navy',
    category: 'eyeliner',
    brand: 'Atelier Kōhl',
    name: 'Midnight Sapphire',
    code: 'E-05',
    hex: '#1C2740',
    undertone: 'Deep Ink Blue',
    description: 'Inky navy liner that brightens the whites of the eyes.',
    price: 32,
  },

  // Kajal (5 pigments)
  {
    id: 'kaj-soot',
    category: 'kajal',
    brand: 'Atelier Kōhl',
    name: 'Royal Charcoal Kajal',
    code: 'K-01',
    hex: '#121010',
    undertone: 'Velvet Carbon',
    description: 'Traditional ultra-creamy waterline kajal that defines lower lashes softly.',
    price: 28,
  },
  {
    id: 'kaj-umber',
    category: 'kajal',
    brand: 'Soraia Botanics',
    name: 'Smoked Umber',
    code: 'K-02',
    hex: '#3B2821',
    undertone: 'Warm Brown',
    description: 'Botanical wax kohl pencil in rich roasted coffee for natural framing.',
    price: 28,
  },
  {
    id: 'kaj-emerald',
    category: 'kajal',
    brand: 'Atelier Kōhl',
    name: 'Forest Pine Kohl',
    code: 'K-03',
    hex: '#1F362C',
    undertone: 'Deep Olive-Green',
    description: 'Muted jewel-toned forest kajal for editorial lower-lash depth.',
    price: 30,
  },
  {
    id: 'kaj-indigo',
    category: 'kajal',
    brand: 'Atelier Kōhl',
    name: 'Indigo Slate',
    code: 'K-04',
    hex: '#202A40',
    undertone: 'Cool Slate Blue',
    description: 'Soft-smudge slate indigo kajal for bright, rested eyes.',
    price: 30,
  },
  {
    id: 'kaj-burgundy',
    category: 'kajal',
    brand: 'Maison Velours',
    name: 'Garnet Smoke',
    code: 'K-05',
    hex: '#4A212B',
    undertone: 'Warm Wine',
    description: 'Deep garnet-brown waterline kohl that flatters green and brown eyes.',
    price: 30,
  },

  // Eyeshadow (6 shades)
  {
    id: 'shd-taupe',
    category: 'eyeshadow',
    brand: 'Maison Velours',
    name: 'Cashmere Taupe',
    code: 'S-01',
    hex: '#8C7568',
    undertone: 'Cool Neutral',
    description: 'Soft sculpting lid wash that builds effortless crease dimension.',
    price: 36,
    defaultFinish: 'Soft Matte',
  },
  {
    id: 'shd-champagne',
    category: 'eyeshadow',
    brand: 'Lumière Privée',
    name: 'Champagne Silk',
    code: 'S-02',
    hex: '#CFAF94',
    undertone: 'Warm Pearl',
    description: 'Luminous crushed-pearl eyeshadow that catches studio flash.',
    price: 38,
    defaultFinish: 'Silk Shimmer',
  },
  {
    id: 'shd-bronze',
    category: 'eyeshadow',
    brand: 'Lumière Privée',
    name: 'Gilded Bronze',
    code: 'S-03',
    hex: '#8F6243',
    undertone: 'Warm Metallic',
    description: 'Molten bronze lid pigment engineered for rich warm depth.',
    price: 38,
    defaultFinish: 'Metallic Foil',
  },
  {
    id: 'shd-rose',
    category: 'eyeshadow',
    brand: 'Soraia Botanics',
    name: 'Antique Rose',
    code: 'S-04',
    hex: '#A86E70',
    undertone: 'Muted Mauve-Rose',
    description: 'Romantic dusty rose lid wash with translucent satin blend.',
    price: 36,
    defaultFinish: 'Silk Shimmer',
  },
  {
    id: 'shd-plum',
    category: 'eyeshadow',
    brand: 'Atelier Kōhl',
    name: 'Velvet Aubergine',
    code: 'S-05',
    hex: '#573645',
    undertone: 'Smoky Plum',
    description: 'Buildable smoky violet-brown for evening depth.',
    price: 36,
    defaultFinish: 'Soft Matte',
  },
  {
    id: 'shd-onyx',
    category: 'eyeshadow',
    brand: 'Atelier Kōhl',
    name: 'Smoked Espresso',
    code: 'S-06',
    hex: '#3F2D27',
    undertone: 'Deep Neutral',
    description: 'Rich espresso shadow ideal for sculpted outer-V framing.',
    price: 36,
    defaultFinish: 'Soft Matte',
  },

  // Blush (8 shades)
  {
    id: 'blush-rose',
    category: 'blush',
    brand: 'Soraia Botanics',
    name: 'Petal Flush',
    code: 'B-01',
    hex: '#D4727A',
    undertone: 'Soft Rose',
    description: 'Weightless serum cheek tint for a fresh post-walk flush.',
    price: 42,
    defaultFinish: 'Cream Dew',
  },
  {
    id: 'blush-peach',
    category: 'blush',
    brand: 'Soraia Botanics',
    name: 'Apricot Sun',
    code: 'B-02',
    hex: '#DE856B',
    undertone: 'Warm Peach',
    description: 'Golden-hour apricot veil that melts seamlessly into skin.',
    price: 42,
    defaultFinish: 'Cream Dew',
  },
  {
    id: 'blush-berry',
    category: 'blush',
    brand: 'Maison Velours',
    name: 'Crushed Mulberry',
    code: 'B-03',
    hex: '#9E3E52',
    undertone: 'Cool Berry',
    description: 'Sculpting cool-toned berry for dimensional cheekbone depth.',
    price: 42,
    defaultFinish: 'Velvet Powder',
  },
  {
    id: 'blush-terracotta',
    category: 'blush',
    brand: 'Maison Velours',
    name: 'Desert Clay',
    code: 'B-04',
    hex: '#BA6350',
    undertone: 'Warm Cinnamon',
    description: 'Sun-draped terracotta blush-bronzer hybrid.',
    price: 42,
    defaultFinish: 'Velvet Powder',
  },
  {
    id: 'blush-guava',
    category: 'blush',
    brand: 'Soraia Botanics',
    name: 'Pink Guava',
    code: 'B-05',
    hex: '#D95F72',
    undertone: 'Bright Coral-Pink',
    description: 'Vibrant tropical pink that lifts medium and deep complexions.',
    price: 42,
    defaultFinish: 'Cream Dew',
  },
  {
    id: 'blush-plum',
    category: 'blush',
    brand: 'Atelier Kōhl',
    name: 'Damson Haze',
    code: 'B-06',
    hex: '#7F3B4D',
    undertone: 'Deep Plum',
    description: 'Rich editorial plum with sheer buildable translucency.',
    price: 44,
    defaultFinish: 'Velvet Powder',
  },
  {
    id: 'blush-champagne',
    category: 'blush',
    brand: 'Lumière Privée',
    name: 'Nectarine Glow',
    code: 'B-07',
    hex: '#D8967B',
    undertone: 'Luminous Nude',
    description: 'Soft-focus pearlescent peach for sculpted radiance.',
    price: 44,
    defaultFinish: 'Radiant Veil',
  },
  {
    id: 'blush-hibiscus',
    category: 'blush',
    brand: 'Maison Velours',
    name: 'Crimson Hibiscus',
    code: 'B-08',
    hex: '#B33447',
    undertone: 'True Red',
    description: 'Editorial watercolour red that gives an effortless windblown flush.',
    price: 42,
    defaultFinish: 'Cream Dew',
  },

  // Highlighter (4 shades)
  {
    id: 'hlt-champagne',
    category: 'highlighter',
    brand: 'Lumière Privée',
    name: 'Moonlit Champagne',
    code: 'H-01',
    hex: '#F4DFC8',
    undertone: 'Neutral Pearl',
    description: 'Zero-glitter liquid glass radiance for high cheekbones and nose bridge.',
    price: 46,
    defaultFinish: 'Glass Glow',
  },
  {
    id: 'hlt-rose',
    category: 'highlighter',
    brand: 'Soraia Botanics',
    name: 'Rose Quartz Dew',
    code: 'H-02',
    hex: '#F1D0CF',
    undertone: 'Cool Pink Pearl',
    description: 'Soft opalescent rose sheen tailored for fair and cool complexions.',
    price: 46,
    defaultFinish: 'Soft Lit',
  },
  {
    id: 'hlt-gold',
    category: 'highlighter',
    brand: 'Lumière Privée',
    name: 'Sunlit Amber',
    code: 'H-03',
    hex: '#E6BD8A',
    undertone: 'Warm Honey Gold',
    description: 'Warm molten-gold gleam engineered for tan and deep skin tones.',
    price: 46,
    defaultFinish: 'Pearl Sheen',
  },
  {
    id: 'hlt-bronze',
    category: 'highlighter',
    brand: 'Lumière Privée',
    name: 'Copper Soleil',
    code: 'H-04',
    hex: '#C98E67',
    undertone: 'Rich Bronze',
    description: 'Burnished copper-rose highlight with zero chalky cast.',
    price: 46,
    defaultFinish: 'Pearl Sheen',
  },
];

export const EDITORIAL_PRESETS: EditorialPreset[] = [
  {
    id: 'parisian-matte',
    name: 'Parisian Matte',
    mood: 'Sculpted · Timeless',
    description:
      'Velvet Bordeaux lip, cashmere taupe shadow, tightlined lashes, and crushed mulberry cheeks.',
    lipstickId: 'lip-bordeaux',
    lipstickFinish: 'Matte',
    lipstickIntensity: 78,
    eyelinerId: 'eye-obsidian',
    eyelinerStyle: 'Tightline',
    eyelinerIntensity: 75,
    eyelinerThickness: 4,
    kajalId: 'kaj-soot',
    kajalStyle: 'Tight Waterline',
    kajalIntensity: 35,
    eyeshadowId: 'shd-taupe',
    eyeshadowFinish: 'Soft Matte',
    eyeshadowIntensity: 48,
    blushId: 'blush-berry',
    blushFinish: 'Velvet Powder',
    blushIntensity: 48,
    highlighterId: 'hlt-champagne',
    highlighterFinish: 'Soft Lit',
    highlighterIntensity: 35,
    foundationFinish: 'Soft Matte',
    foundationIntensity: 45,
  },
  {
    id: 'rosewater-dew',
    name: 'Rosewater Dew',
    mood: 'Fresh · Daylight',
    description:
      'Sheer peony gloss, antique rose shimmer, soft espresso liner, and petal cheeks.',
    lipstickId: 'lip-petal',
    lipstickFinish: 'Gloss',
    lipstickIntensity: 62,
    eyelinerId: 'eye-espresso',
    eyelinerStyle: 'Tightline',
    eyelinerIntensity: 55,
    eyelinerThickness: 3,
    kajalId: 'kaj-umber',
    kajalStyle: 'Tight Waterline',
    kajalIntensity: 25,
    eyeshadowId: 'shd-rose',
    eyeshadowFinish: 'Silk Shimmer',
    eyeshadowIntensity: 42,
    blushId: 'blush-rose',
    blushFinish: 'Cream Dew',
    blushIntensity: 52,
    highlighterId: 'hlt-rose',
    highlighterFinish: 'Glass Glow',
    highlighterIntensity: 50,
    foundationFinish: 'Radiant Dew',
    foundationIntensity: 38,
  },
  {
    id: 'sunlit-bronze',
    name: 'Sunlit Sienna',
    mood: 'Warm · Golden Hour',
    description:
      'Burnt sienna matte lips, gilded bronze lid, smoked umber kajal, and desert clay blush.',
    lipstickId: 'lip-terracotta',
    lipstickFinish: 'Matte',
    lipstickIntensity: 72,
    eyelinerId: 'eye-bronze',
    eyelinerStyle: 'Classic Wing',
    eyelinerIntensity: 70,
    eyelinerThickness: 5,
    kajalId: 'kaj-umber',
    kajalStyle: 'Classic Kohl',
    kajalIntensity: 55,
    eyeshadowId: 'shd-bronze',
    eyeshadowFinish: 'Metallic Foil',
    eyeshadowIntensity: 54,
    blushId: 'blush-terracotta',
    blushFinish: 'Velvet Powder',
    blushIntensity: 56,
    highlighterId: 'hlt-gold',
    highlighterFinish: 'Pearl Sheen',
    highlighterIntensity: 52,
    foundationFinish: 'Natural Satin',
    foundationIntensity: 45,
  },
  {
    id: 'evening-noir',
    name: 'Evening Noir Kōhl',
    mood: 'High Contrast · Gala',
    description:
      'Atelier crimson lip, smoky kajal waterline, obsidian wing, and velvet aubergine shadow.',
    lipstickId: 'lip-crimson',
    lipstickFinish: 'Satin',
    lipstickIntensity: 84,
    eyelinerId: 'eye-obsidian',
    eyelinerStyle: 'Classic Wing',
    eyelinerIntensity: 88,
    eyelinerThickness: 6,
    kajalId: 'kaj-soot',
    kajalStyle: 'Smoky Lower',
    kajalIntensity: 72,
    eyeshadowId: 'shd-plum',
    eyeshadowFinish: 'Soft Matte',
    eyeshadowIntensity: 58,
    blushId: 'blush-hibiscus',
    blushFinish: 'Cream Dew',
    blushIntensity: 44,
    highlighterId: 'hlt-champagne',
    highlighterFinish: 'Glass Glow',
    highlighterIntensity: 56,
    foundationFinish: 'Natural Satin',
    foundationIntensity: 52,
  },
];

export const DEFAULT_LOOK_STATE: MakeupLookState = {
  foundation: {
    enabled: true,
    shadeId: 'fnd-sand',
    intensity: 40,
    finish: 'Natural Satin',
  },
  lipstick: {
    enabled: true,
    shadeId: 'lip-rosewood',
    intensity: 68,
    finish: 'Satin',
  },
  eyeliner: {
    enabled: true,
    shadeId: 'eye-obsidian',
    intensity: 75,
    thickness: 5,
    style: 'Classic Wing',
  },
  kajal: {
    enabled: true,
    shadeId: 'kaj-soot',
    intensity: 45,
    thickness: 4,
    style: 'Tight Waterline',
  },
  eyeshadow: {
    enabled: true,
    shadeId: 'shd-champagne',
    intensity: 45,
    finish: 'Silk Shimmer',
  },
  blush: {
    enabled: true,
    shadeId: 'blush-rose',
    intensity: 48,
    finish: 'Cream Dew',
  },
  highlighter: {
    enabled: true,
    shadeId: 'hlt-champagne',
    intensity: 42,
    finish: 'Soft Lit',
  },
};

let dynamicShadesRegistry: MakeupShade[] = [...MAKEUP_SHADES];

export interface UserOrder {
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

export interface AiConsultationRecord {
  id: string;
  createdAt: string;
  occasion: string;
  undertone: string;
  complexionDepth: string;
  lookTitle: string;
  hydrationScore?: number;
  brightnessScore?: number;
  textureScore?: number;
  faceNotes?: string;
}

export interface WaterIntakeEntry {
  id: string;
  date: string;
  glasses: number;
  ml: number;
  hydrationScore: number;
  note?: string;
}

export interface BrandShootBooking {
  id: string;
  campaignTitle: string;
  brand: CosmeticBrand;
  modelId: string;
  modelName: string;
  presetName: string;
  shootDate: string;
  status: 'Scheduled' | 'In Studio' | 'Editing' | 'Delivered';
  deliverablesCount: number;
  notes?: string;
}

export function syncCatalogRegistry(shades: MakeupShade[]) {
  dynamicShadesRegistry = shades;
}

export function getShadeById(id: string): MakeupShade | undefined {
  return (
    dynamicShadesRegistry.find((s) => s.id === id) ??
    MAKEUP_SHADES.find((s) => s.id === id)
  );
}

export function getShadesByCategory(
  category: MakeupCategory,
  sourceShades: MakeupShade[] = dynamicShadesRegistry
): MakeupShade[] {
  return sourceShades.filter((s) => s.category === category);
}

export interface RedeemedRewardEntry {
  id: string;
  title: string;
  cost: number;
  voucherCode: string;
  redeemedAt: string;
}

export type WeeklyChallengeId =
  | 'perfect-base-week'
  | 'eyeliner-mastery'
  | 'glass-skin-hydration'
  | 'editorial-full-face';

export interface ClaimedChallengeEntry {
  id: string;
  challengeId: WeeklyChallengeId;
  title: string;
  bonusPoints: number;
  claimedAt: string;
}

export interface WeeklyChallengeDefinition {
  id: WeeklyChallengeId;
  title: string;
  subtitle: string;
  description: string;
  targetCount: number;
  unitLabel: string;
  bonusPoints: number;
  mirrorTab?: MakeupCategory;
  actionLabel: string;
  trackingNote: string;
}

export const WEEKLY_CHALLENGES: WeeklyChallengeDefinition[] = [
  {
    id: 'perfect-base-week',
    title: 'Perfect Base Week',
    subtitle: 'Complexion & Prep',
    description:
      'Build a seamless satin or matte base in the studio with Foundation & prep across 5 weekly sessions.',
    targetCount: 5,
    unitLabel: 'days',
    bonusPoints: 120,
    mirrorTab: 'foundation',
    actionLabel: 'Practice Base in Mirror',
    trackingNote: 'Auto-tracks saved looks with Foundation + studio check-ins',
  },
  {
    id: 'eyeliner-mastery',
    title: 'Eyeliner Mastery',
    subtitle: 'Precision Wing & Kajal',
    description:
      'Complete 4 studio eye studies testing Tightline, Classic Wing, or Smoky Lower Kajal finishes.',
    targetCount: 4,
    unitLabel: 'looks',
    bonusPoints: 100,
    mirrorTab: 'eyeliner',
    actionLabel: 'Practice Eyeliner in Mirror',
    trackingNote: 'Auto-tracks saved looks with Eyeliner or Kajal + check-ins',
  },
  {
    id: 'glass-skin-hydration',
    title: 'Glass-Skin Hydration Streak',
    subtitle: 'Daily Water Intake',
    description:
      'Hit 2,000+ ml of daily hydration across 5 logged days to maintain supple skin barrier luminosity.',
    targetCount: 5,
    unitLabel: 'days',
    bonusPoints: 140,
    actionLabel: 'Log Water Intake',
    trackingNote: 'Synced with Daily Water Intake logs (>= 2,000 ml) + check-ins',
  },
  {
    id: 'editorial-full-face',
    title: 'Editorial Capsule Streak',
    subtitle: 'Lips, Cheeks & Glow',
    description:
      'Create 3 cohesive multi-layer looks pairing Lipstick with Eyeshadow, Blush, or Highlighter.',
    targetCount: 3,
    unitLabel: 'looks',
    bonusPoints: 110,
    mirrorTab: 'lipstick',
    actionLabel: 'Build Look in Mirror',
    trackingNote: 'Auto-tracks saved 3+ layer looks + studio check-ins',
  },
];

export type MuaKitDivision =
  | 'Face Makeup'
  | 'Eye Makeup'
  | 'Lip Makeup'
  | 'Skincare & Preparation'
  | 'Makeup Tools'
  | 'Body & Professional Makeup';

export interface MuaKitProduct {
  id: string;
  itemName: string;
  productTitle: string;
  division: MuaKitDivision;
  brand: CosmeticBrand;
  code: string;
  hex: string;
  finishNote: string;
  description: string;
  price: number;
  tryOnCategory?: MakeupCategory;
  tryOnShadeId?: string;
}

export const MUA_KIT_DIVISIONS: MuaKitDivision[] = [
  'Face Makeup',
  'Eye Makeup',
  'Lip Makeup',
  'Skincare & Preparation',
  'Makeup Tools',
  'Body & Professional Makeup',
];

export const PRO_MUA_PRODUCTS: MuaKitProduct[] = [
  // 1. Face Makeup (14 products)
  {
    id: 'mua-face-primer',
    itemName: 'Face Primer',
    productTitle: 'Silk Pore-Blur Grip Primer',
    division: 'Face Makeup',
    brand: 'Soraia Botanics',
    code: 'FM-01',
    hex: '#F3E5DA',
    finishNote: 'Velvet Grip',
    description: 'Silicone-free smoothing canvas primer that grips complexions for 14-hour studio lighting.',
    price: 42,
    tryOnCategory: 'foundation',
    tryOnShadeId: 'fnd-sand',
  },
  {
    id: 'mua-foundation',
    itemName: 'Foundation',
    productTitle: 'Luminous Silk Skin Foundation',
    division: 'Face Makeup',
    brand: 'Maison Velours',
    code: 'FM-02',
    hex: '#DFB695',
    finishNote: 'Natural Satin',
    description: 'Medium-buildable fluid pigment calibrated across cool, neutral, warm, and olive undertones.',
    price: 54,
    tryOnCategory: 'foundation',
    tryOnShadeId: 'fnd-sand',
  },
  {
    id: 'mua-bb-cream',
    itemName: 'BB Cream',
    productTitle: 'Botanical Dew BB Balm',
    division: 'Face Makeup',
    brand: 'Soraia Botanics',
    code: 'FM-03',
    hex: '#E6C2A5',
    finishNote: 'Sheer Dew',
    description: 'Hyaluronic beauty balm evening redness while preserving natural skin grain.',
    price: 38,
    tryOnCategory: 'foundation',
    tryOnShadeId: 'fnd-ivory',
  },
  {
    id: 'mua-cc-cream',
    itemName: 'CC Cream',
    productTitle: 'Tone-Correcting CC Fluid',
    division: 'Face Makeup',
    brand: 'Lumière Privée',
    code: 'FM-04',
    hex: '#DFBD9E',
    finishNote: 'Neutralizing Veil',
    description: 'Smart color-correcting complex neutralizing dullness and uneven pigmentation.',
    price: 44,
    tryOnCategory: 'foundation',
    tryOnShadeId: 'fnd-honey',
  },
  {
    id: 'mua-concealer',
    itemName: 'Concealer',
    productTitle: 'Studio Micro-Cream Concealer',
    division: 'Face Makeup',
    brand: 'Maison Velours',
    code: 'FM-05',
    hex: '#EBD0B6',
    finishNote: 'Crease-Proof Soft Matte',
    description: 'High-coverage under-eye and blemish perfector that never flashes back under strobes.',
    price: 34,
    tryOnCategory: 'foundation',
    tryOnShadeId: 'fnd-ivory',
  },
  {
    id: 'mua-color-corrector',
    itemName: 'Color Corrector',
    productTitle: 'Peach & Olive Neutralizing Pen',
    division: 'Face Makeup',
    brand: 'Atelier Kōhl',
    code: 'FM-06',
    hex: '#E8A589',
    finishNote: 'Color Balance',
    description: 'Undertone-targeted corrector erasing dark circles and redness before base application.',
    price: 32,
    tryOnCategory: 'blush',
    tryOnShadeId: 'blush-peach',
  },
  {
    id: 'mua-contour-stick',
    itemName: 'Contour Stick',
    productTitle: 'Cool Taupe Sculpting Stick',
    division: 'Face Makeup',
    brand: 'Atelier Kōhl',
    code: 'FM-07',
    hex: '#8C6B5B',
    finishNote: 'Shadow Matte',
    description: 'Shadow-toned cream contour carving cheekbones, jawline, and nose bridge cleanly.',
    price: 40,
    tryOnCategory: 'blush',
    tryOnShadeId: 'blush-terracotta',
  },
  {
    id: 'mua-bronzer',
    itemName: 'Bronzer',
    productTitle: 'Sunlit Baked Bronzer',
    division: 'Face Makeup',
    brand: 'Lumière Privée',
    code: 'FM-08',
    hex: '#B97E58',
    finishNote: 'Golden Warmth',
    description: 'Micro-milled golden terracotta powder imparting sun-warmed runway dimension.',
    price: 46,
    tryOnCategory: 'blush',
    tryOnShadeId: 'blush-terracotta',
  },
  {
    id: 'mua-blush',
    itemName: 'Blush',
    productTitle: 'Petal Flush Cheek Veil',
    division: 'Face Makeup',
    brand: 'Soraia Botanics',
    code: 'FM-09',
    hex: '#D4727A',
    finishNote: 'Cream Dew',
    description: 'Weightless serum blush melting seamlessly into skin for a diffused cheek flush.',
    price: 42,
    tryOnCategory: 'blush',
    tryOnShadeId: 'blush-rose',
  },
  {
    id: 'mua-highlighter',
    itemName: 'Highlighter',
    productTitle: 'Moonlit Champagne Fluid Glow',
    division: 'Face Makeup',
    brand: 'Lumière Privée',
    code: 'FM-10',
    hex: '#F4DFC8',
    finishNote: 'Glass Glow',
    description: 'Zero-glitter pearl luminizer catching studio highlights across high cheekbones.',
    price: 46,
    tryOnCategory: 'highlighter',
    tryOnShadeId: 'hlt-champagne',
  },
  {
    id: 'mua-loose-powder',
    itemName: 'Loose Powder',
    productTitle: 'Silk Veil Translucent Loose Powder',
    division: 'Face Makeup',
    brand: 'Maison Velours',
    code: 'FM-11',
    hex: '#F2E5D7',
    finishNote: 'Airbrush Matte',
    description: 'Talc-free ultra-fine loose powder for T-zone baking and zero camera flashback.',
    price: 44,
    tryOnCategory: 'foundation',
    tryOnShadeId: 'fnd-sand',
  },
  {
    id: 'mua-compact-powder',
    itemName: 'Compact Powder',
    productTitle: 'Velour Touch-Up Pressed Compact',
    division: 'Face Makeup',
    brand: 'Maison Velours',
    code: 'FM-12',
    hex: '#E5CBB3',
    finishNote: 'Velvet Press',
    description: 'Refillable pressed complexion compact for on-set shine control between takes.',
    price: 48,
    tryOnCategory: 'foundation',
    tryOnShadeId: 'fnd-sand',
  },
  {
    id: 'mua-setting-powder',
    itemName: 'Setting Powder',
    productTitle: 'Photo-Lock Micro Setting Powder',
    division: 'Face Makeup',
    brand: 'Lumière Privée',
    code: 'FM-13',
    hex: '#EFE0D0',
    finishNote: 'Soft Focus Lock',
    description: 'Blurs pores and seals cream blush and concealer without flattening natural dew.',
    price: 42,
    tryOnCategory: 'foundation',
    tryOnShadeId: 'fnd-ivory',
  },
  {
    id: 'mua-setting-spray',
    itemName: 'Setting Spray',
    productTitle: 'Atelier All-Night Fixing Mist',
    division: 'Face Makeup',
    brand: 'Soraia Botanics',
    code: 'FM-14',
    hex: '#DDE8E7',
    finishNote: 'Dewy Transfer-Lock',
    description: 'Micro-fine botanical mist fusing powder and cream layers into second-skin finish.',
    price: 36,
    tryOnCategory: 'highlighter',
    tryOnShadeId: 'hlt-champagne',
  },

  // 2. Eye Makeup (11 products)
  {
    id: 'mua-kajal',
    itemName: 'Kajal',
    productTitle: 'Charcoal Soot Gel Kajal',
    division: 'Eye Makeup',
    brand: 'Atelier Kōhl',
    code: 'EM-01',
    hex: '#191615',
    finishNote: 'Smoky Waterline',
    description: 'Safe waterproof waterline pencil calibrated for intense carbon depth or soft smoke.',
    price: 26,
    tryOnCategory: 'kajal',
    tryOnShadeId: 'kaj-soot',
  },
  {
    id: 'mua-eyeliner',
    itemName: 'Eyeliner',
    productTitle: 'Obsidian Blade Liquid Liner',
    division: 'Eye Makeup',
    brand: 'Atelier Kōhl',
    code: 'EM-02',
    hex: '#141312',
    finishNote: 'Precision Wing',
    description: 'Micro-felt calligraphy nib delivering razor-sharp tightlines and graphic wings.',
    price: 28,
    tryOnCategory: 'eyeliner',
    tryOnShadeId: 'eye-obsidian',
  },
  {
    id: 'mua-mascara',
    itemName: 'Mascara',
    productTitle: 'Panoramic Lash Lift Mascara',
    division: 'Eye Makeup',
    brand: 'Atelier Kōhl',
    code: 'EM-03',
    hex: '#1D1B1A',
    finishNote: 'Tubing Volume',
    description: 'Carbon-black tubing polymers fanning lashes upward without smudging lower lids.',
    price: 32,
    tryOnCategory: 'eyeliner',
    tryOnShadeId: 'eye-obsidian',
  },
  {
    id: 'mua-eyeshadow-palette',
    itemName: 'Eyeshadow Palette',
    productTitle: 'Cashmere & Bronze 9-Pan Palette',
    division: 'Eye Makeup',
    brand: 'Maison Velours',
    code: 'EM-04',
    hex: '#8C7568',
    finishNote: 'Matte & Silk Shimmer',
    description: 'Curated editorial lid transitions from cool cashmere taupe to molten gilded bronze.',
    price: 68,
    tryOnCategory: 'eyeshadow',
    tryOnShadeId: 'shd-champagne',
  },
  {
    id: 'mua-eye-primer',
    itemName: 'Eye Primer',
    productTitle: 'Smooth Canvas Lid Primer',
    division: 'Eye Makeup',
    brand: 'Lumière Privée',
    code: 'EM-05',
    hex: '#EBD3C0',
    finishNote: 'Zero-Crease Lock',
    description: 'Neutralizes eyelid veining and locks metallic foils and mattes for 16 hours.',
    price: 28,
    tryOnCategory: 'eyeshadow',
    tryOnShadeId: 'shd-taupe',
  },
  {
    id: 'mua-eyebrow-pencil',
    itemName: 'Eyebrow Pencil',
    productTitle: 'Micro-Blade Feather Brow Pencil',
    division: 'Eye Makeup',
    brand: 'Atelier Kōhl',
    code: 'EM-06',
    hex: '#4A362C',
    finishNote: 'Hair-Like Strokes',
    description: '1mm oval tip recreating crisp individual brow hairs tailored to hair undertone.',
    price: 26,
    tryOnCategory: 'kajal',
    tryOnShadeId: 'kaj-umber',
  },
  {
    id: 'mua-eyebrow-gel',
    itemName: 'Eyebrow Gel',
    productTitle: 'Sculpt & Hold Feather Brow Gel',
    division: 'Eye Makeup',
    brand: 'Soraia Botanics',
    code: 'EM-07',
    hex: '#6B5549',
    finishNote: 'Fluffy Hold',
    description: 'Clear botanical peptide wax lifting brow arches smoothly without stiffness or flaking.',
    price: 25,
    tryOnCategory: 'eyeshadow',
    tryOnShadeId: 'shd-taupe',
  },
  {
    id: 'mua-false-eyelashes',
    itemName: 'False Eyelashes',
    productTitle: 'Silk Wispy Editorial Individuals',
    division: 'Eye Makeup',
    brand: 'Maison Velours',
    code: 'EM-08',
    hex: '#221E1D',
    finishNote: 'Featherlight Cluster',
    description: 'Knot-free tapered silk lash clusters engineered for invisible close-up camera seams.',
    price: 24,
    tryOnCategory: 'eyeliner',
    tryOnShadeId: 'eye-obsidian',
  },
  {
    id: 'mua-lash-glue',
    itemName: 'Lash Glue',
    productTitle: 'Clear Botanical Bond Lash Adhesive',
    division: 'Eye Makeup',
    brand: 'Soraia Botanics',
    code: 'EM-09',
    hex: '#EAECEF',
    finishNote: 'Latex-Free Clear Dry',
    description: 'Chamomile-infused waterproof lash bond drying completely invisible within 15 seconds.',
    price: 16,
  },
  {
    id: 'mua-glitter',
    itemName: 'Glitter',
    productTitle: 'Crushed Champagne Eye Sparkle',
    division: 'Eye Makeup',
    brand: 'Lumière Privée',
    code: 'EM-10',
    hex: '#E6C9A8',
    finishNote: 'Metallic Foil',
    description: 'Biodegradable micro-pearl pressed glitter catching spotlight brilliance on center lids.',
    price: 30,
    tryOnCategory: 'eyeshadow',
    tryOnShadeId: 'shd-bronze',
  },
  {
    id: 'mua-eye-brush',
    itemName: 'Eye Brush',
    productTitle: 'Artisan Crease & Liner Brush Duo',
    division: 'Eye Makeup',
    brand: 'Maison Velours',
    code: 'EM-11',
    hex: '#C49A83',
    finishNote: 'Pro Vegan Bristle',
    description: 'Hand-shaped dome blender and bent wing detailer from our backstage kit.',
    price: 38,
  },

  // 3. Lip Makeup (7 products)
  {
    id: 'mua-lipstick',
    itemName: 'Lipstick',
    productTitle: 'Rosewood Whisper Couture Lipstick',
    division: 'Lip Makeup',
    brand: 'Maison Velours',
    code: 'LM-01',
    hex: '#9E4B56',
    finishNote: 'Velvet Satin',
    description: 'Cushiony full-pigment couture bullet gliding smoothly in a single studio swipe.',
    price: 38,
    tryOnCategory: 'lipstick',
    tryOnShadeId: 'lip-rosewood',
  },
  {
    id: 'mua-liquid-lipstick',
    itemName: 'Liquid Lipstick',
    productTitle: 'Bordeaux Transfer-Proof Liquid Lip',
    division: 'Lip Makeup',
    brand: 'Maison Velours',
    code: 'LM-02',
    hex: '#6E1D2A',
    finishNote: 'Matte',
    description: 'Whipped weightless liquid matte drying down to zero-transfer runway intensity.',
    price: 36,
    tryOnCategory: 'lipstick',
    tryOnShadeId: 'lip-bordeaux',
  },
  {
    id: 'mua-lip-gloss',
    itemName: 'Lip Gloss',
    productTitle: 'Peony Petal Glass Shine Gloss',
    division: 'Lip Makeup',
    brand: 'Lumière Privée',
    code: 'LM-03',
    hex: '#D67D89',
    finishNote: 'Gloss',
    description: 'Mirror-lacquer peptide gloss delivering cushiony optical fullness without tackiness.',
    price: 32,
    tryOnCategory: 'lipstick',
    tryOnShadeId: 'lip-petal',
  },
  {
    id: 'mua-lip-balm',
    itemName: 'Lip Balm',
    productTitle: 'Nectar Sheer Barrier Lip Balm',
    division: 'Lip Makeup',
    brand: 'Soraia Botanics',
    code: 'LM-04',
    hex: '#D47B6A',
    finishNote: 'Conditioning Sheen',
    description: 'Ceramide & rosehip conditioning balm worn bare or as matte lipstick prep.',
    price: 26,
    tryOnCategory: 'lipstick',
    tryOnShadeId: 'lip-nectar',
  },
  {
    id: 'mua-lip-liner',
    itemName: 'Lip Liner',
    productTitle: 'Spiced Chai Precision Lip Pencil',
    division: 'Lip Makeup',
    brand: 'Atelier Kōhl',
    code: 'LM-05',
    hex: '#9A6356',
    finishNote: 'Contour Matte',
    description: 'Creamy glide wooden lip pencil defining cupid’s bow and preventing feathering.',
    price: 24,
    tryOnCategory: 'lipstick',
    tryOnShadeId: 'lip-chai',
  },
  {
    id: 'mua-lip-tint',
    itemName: 'Lip Tint',
    productTitle: 'Water-Stain Apricot Lip Tint',
    division: 'Lip Makeup',
    brand: 'Soraia Botanics',
    code: 'LM-06',
    hex: '#CC5B50',
    finishNote: 'Weightless Stain',
    description: 'Breathable botanical lip & cheek water stain leaving a bitten-lip flush.',
    price: 29,
    tryOnCategory: 'lipstick',
    tryOnShadeId: 'lip-coral',
  },
  {
    id: 'mua-lip-plumper',
    itemName: 'Lip Plumper',
    productTitle: 'Tri-Peptide Volume Lip Plumper',
    division: 'Lip Makeup',
    brand: 'Lumière Privée',
    code: 'LM-07',
    hex: '#C46874',
    finishNote: 'Glossy Plump',
    description: 'Gentle ginger-peptide infusion visibly smoothing vertical lip lines on camera.',
    price: 34,
    tryOnCategory: 'lipstick',
    tryOnShadeId: 'lip-petal',
  },

  // 4. Skincare & Preparation (10 products)
  {
    id: 'mua-face-wash',
    itemName: 'Face Wash',
    productTitle: 'Amino Cloud Conditioning Face Wash',
    division: 'Skincare & Preparation',
    brand: 'Soraia Botanics',
    code: 'SP-01',
    hex: '#EAE5DF',
    finishNote: 'pH-Balanced Rinse',
    description: 'Sulfate-free amino cleanser removing excess oil while keeping moisture intact.',
    price: 30,
  },
  {
    id: 'mua-cleanser',
    itemName: 'Cleanser',
    productTitle: 'Oat Lipid Creamy Milk Cleanser',
    division: 'Skincare & Preparation',
    brand: 'Soraia Botanics',
    code: 'SP-02',
    hex: '#F2ECE4',
    finishNote: 'Barrier Cleanse',
    description: 'Soothing cream cleanser pre-calibrating dry and sensitized skin before pigment.',
    price: 34,
  },
  {
    id: 'mua-toner',
    itemName: 'Toner',
    productTitle: 'Rosewater & PHA Essence Toner',
    division: 'Skincare & Preparation',
    brand: 'Soraia Botanics',
    code: 'SP-03',
    hex: '#F4E3E5',
    finishNote: 'Hydrating Bounce',
    description: 'Micro-exfoliating essence toner refining texture for smoother foundation slip.',
    price: 32,
  },
  {
    id: 'mua-moisturizer',
    itemName: 'Moisturizer',
    productTitle: 'Ceramide Silk Barrier Cream',
    division: 'Skincare & Preparation',
    brand: 'Soraia Botanics',
    code: 'SP-04',
    hex: '#F7F3ED',
    finishNote: 'Plump Satin Canvas',
    description: 'Lightweight whipped ceramide cream absorbing cleanly without pilling under primer.',
    price: 48,
  },
  {
    id: 'mua-sunscreen',
    itemName: 'Sunscreen',
    productTitle: 'Invisible Fluid SPF 50 Veil',
    division: 'Skincare & Preparation',
    brand: 'Lumière Privée',
    code: 'SP-05',
    hex: '#FBF6EE',
    finishNote: 'Zero White-Cast',
    description: 'Flash-friendly transparent UV shield leaving zero chalky undertone across deep skin.',
    price: 38,
  },
  {
    id: 'mua-face-serum',
    itemName: 'Face Serum',
    productTitle: 'Niacinamide Glass-Skin Drops',
    division: 'Skincare & Preparation',
    brand: 'Lumière Privée',
    code: 'SP-06',
    hex: '#EFE6DC',
    finishNote: 'Instant Radiance',
    description: 'Multi-weight hyaluronic + B3 drops boosting studio brightness and barrier bounce.',
    price: 52,
  },
  {
    id: 'mua-eye-cream',
    itemName: 'Eye Cream',
    productTitle: 'Caffeine Peptide Under-Eye Gel Cream',
    division: 'Skincare & Preparation',
    brand: 'Maison Velours',
    code: 'SP-07',
    hex: '#EDE8E2',
    finishNote: 'De-Puff Smooth',
    description: 'Tightens and hydrates under-eye skin so concealer glides without creasing.',
    price: 44,
  },
  {
    id: 'mua-prep-primer',
    itemName: 'Face Primer',
    productTitle: 'Barrier Hydro-Lock Prep Primer',
    division: 'Skincare & Preparation',
    brand: 'Lumière Privée',
    code: 'SP-08',
    hex: '#F5EDE4',
    finishNote: 'Hydra Prep Coat',
    description: 'Bridges morning skincare to full complexion makeup with balanced slip and grip.',
    price: 42,
    tryOnCategory: 'foundation',
    tryOnShadeId: 'fnd-sand',
  },
  {
    id: 'mua-makeup-remover',
    itemName: 'Makeup Remover',
    productTitle: 'Camellia Melting Cleansing Balm',
    division: 'Skincare & Preparation',
    brand: 'Atelier Kōhl',
    code: 'SP-09',
    hex: '#EFE5D8',
    finishNote: 'Instant Dissolve',
    description: 'Silky botanical oil-balm dissolving waterproof kajal, wing liner, and matte lipsticks.',
    price: 36,
  },
  {
    id: 'mua-micellar-water',
    itemName: 'Micellar Water',
    productTitle: 'No-Rinse Cotton Micellar Water',
    division: 'Skincare & Preparation',
    brand: 'Soraia Botanics',
    code: 'SP-10',
    hex: '#EBF0F0',
    finishNote: 'Clean Reset',
    description: 'Backstage quick-change micellar rinse for crisp eyeliner correction and shoot resets.',
    price: 24,
  },

  // 5. Makeup Tools (12 products)
  {
    id: 'mua-beauty-blender',
    itemName: 'Beauty Blender',
    productTitle: 'Teardrop Hydro-Bounce Sponge',
    division: 'Makeup Tools',
    brand: 'Maison Velours',
    code: 'MT-01',
    hex: '#D7A39E',
    finishNote: 'Latex-Free Bounce',
    description: 'Open-cell teardrop sponge expanding with water to stipple foundation without streaks.',
    price: 22,
  },
  {
    id: 'mua-foundation-brush',
    itemName: 'Foundation Brush',
    productTitle: 'Dense Cabuki Stipple Brush #01',
    division: 'Makeup Tools',
    brand: 'Maison Velours',
    code: 'MT-02',
    hex: '#C49A83',
    finishNote: 'Airbrush Buff',
    description: 'Angled ultra-dense vegan synthetic bristles buffering fluid foundation around nose and jaw.',
    price: 42,
  },
  {
    id: 'mua-powder-brush',
    itemName: 'Powder Brush',
    productTitle: 'Cloud-Dome Finishing Powder Brush',
    division: 'Makeup Tools',
    brand: 'Maison Velours',
    code: 'MT-03',
    hex: '#D6C4B5',
    finishNote: 'Feather Diffusion',
    description: 'Plush domed brush sweeping loose or setting powder evenly without disturbing base.',
    price: 44,
  },
  {
    id: 'mua-blush-brush',
    itemName: 'Blush Brush',
    productTitle: 'Tapered Cheek Tulip Brush #04',
    division: 'Makeup Tools',
    brand: 'Lumière Privée',
    code: 'MT-04',
    hex: '#D49A9A',
    finishNote: 'Soft Sculpt Blend',
    description: 'Tulip-shaped cheek brush placing cream-powder blush precisely onto cheekbone apples.',
    price: 38,
  },
  {
    id: 'mua-contour-brush',
    itemName: 'Contour Brush',
    productTitle: 'Chiseled Hollow Angle Brush #05',
    division: 'Makeup Tools',
    brand: 'Atelier Kōhl',
    code: 'MT-05',
    hex: '#8C7062',
    finishNote: 'Precision Hollow',
    description: 'Firm sloped sculpting brush carving jawline and cheekbone depth cleanly.',
    price: 38,
  },
  {
    id: 'mua-fan-brush',
    itemName: 'Fan Brush',
    productTitle: 'Featherweight Highlight Fan Brush',
    division: 'Makeup Tools',
    brand: 'Lumière Privée',
    code: 'MT-06',
    hex: '#EADBC8',
    finishNote: 'Diffused Gleam',
    description: 'Whisk-light fan brush dusting pearl highlighter across cheekbones and collarbones.',
    price: 32,
  },
  {
    id: 'mua-eyeshadow-brush',
    itemName: 'Eyeshadow Brush',
    productTitle: 'Flat Shader & Tapered Blend Brush',
    division: 'Makeup Tools',
    brand: 'Atelier Kōhl',
    code: 'MT-07',
    hex: '#B39382',
    finishNote: 'Crease Packing',
    description: 'Squirrel-soft synthetic bristles packing lid foil pigments and diffusing smoky creases.',
    price: 34,
  },
  {
    id: 'mua-eyelash-curler',
    itemName: 'Eyelash Curler',
    productTitle: 'Matte Brass Studio Lash Curler',
    division: 'Makeup Tools',
    brand: 'Atelier Kōhl',
    code: 'MT-08',
    hex: '#3A3532',
    finishNote: 'Wide-Aperture Lift',
    description: 'Zero-pinch wide arc frame with cushion silicone pads lifting inner to outer lashes.',
    price: 28,
  },
  {
    id: 'mua-tweezers',
    itemName: 'Tweezers',
    productTitle: 'Micro-Slant Atelier Point Tweezers',
    division: 'Makeup Tools',
    brand: 'Atelier Kōhl',
    code: 'MT-09',
    hex: '#57524E',
    finishNote: 'Aligned Calibrated Tip',
    description: 'Surgical-grade hand-aligned slant tip for brow shaping and placing individual lashes.',
    price: 26,
  },
  {
    id: 'mua-makeup-sponge',
    itemName: 'Makeup Sponge',
    productTitle: 'Velvet Bevel Precision Wedge',
    division: 'Makeup Tools',
    brand: 'Soraia Botanics',
    code: 'MT-10',
    hex: '#E6D6C7',
    finishNote: 'Dual-Edge Press',
    description: 'Flat-bevel damp blender designed for under-eye baking and crisp contour cleanup.',
    price: 18,
  },
  {
    id: 'mua-makeup-palette',
    itemName: 'Makeup Palette',
    productTitle: 'Brushed Steel Mixing Palette & Spatula',
    division: 'Makeup Tools',
    brand: 'Maison Velours',
    code: 'MT-11',
    hex: '#C8C9CB',
    finishNote: 'Hygienic Backstage Prep',
    description: 'Sanitizable stainless steel blending plate for custom-mixing foundation and lip tones.',
    price: 30,
  },
  {
    id: 'mua-makeup-pouch',
    itemName: 'Makeup Pouch',
    productTitle: 'Pebbled Linen Pro Travel Kit Pouch',
    division: 'Makeup Tools',
    brand: 'Maison Velours',
    code: 'MT-12',
    hex: '#DFD6CC',
    finishNote: 'Wipe-Clean Liner',
    description: 'Structured wipeable travel organizer holding full-size brushes, compacts, and vials.',
    price: 58,
  },

  // 6. Body & Professional Makeup (9 products)
  {
    id: 'mua-body-foundation',
    itemName: 'Body Foundation',
    productTitle: 'Seamless Runway Body Perfector',
    division: 'Body & Professional Makeup',
    brand: 'Maison Velours',
    code: 'BP-01',
    hex: '#D29E79',
    finishNote: 'Transfer-Resistant Satin',
    description: 'Waterproof full-body tonal fluid evening décolletage, shoulders, and legs on set.',
    price: 58,
    tryOnCategory: 'foundation',
    tryOnShadeId: 'fnd-caramel',
  },
  {
    id: 'mua-body-shimmer',
    itemName: 'Body Shimmer',
    productTitle: 'Satin Soleil Whipped Body Shimmer',
    division: 'Body & Professional Makeup',
    brand: 'Lumière Privée',
    code: 'BP-02',
    hex: '#DFB387',
    finishNote: 'Dry-Oil Satin',
    description: 'Dry-touch botanical body illuminator imparting editorial collarbone luster without transfer.',
    price: 52,
    tryOnCategory: 'highlighter',
    tryOnShadeId: 'hlt-gold',
  },
  {
    id: 'mua-body-highlighter',
    itemName: 'Body Highlighter',
    productTitle: 'Molten Amber Liquid Body Glow',
    division: 'Body & Professional Makeup',
    brand: 'Lumière Privée',
    code: 'BP-03',
    hex: '#E6BD8A',
    finishNote: 'Glass Sheen',
    description: 'Liquid pearl spotlight glaze catching strobe highlights on shoulders and arms.',
    price: 54,
    tryOnCategory: 'highlighter',
    tryOnShadeId: 'hlt-champagne',
  },
  {
    id: 'mua-body-glitter',
    itemName: 'Body Glitter',
    productTitle: 'Prismatic Stage Body Sparkle Gel',
    division: 'Body & Professional Makeup',
    brand: 'Lumière Privée',
    code: 'BP-04',
    hex: '#ECD3B8',
    finishNote: 'Suspended Foil Gel',
    description: 'Zero-fallout suspended pearl body gel formulated for editorial concerts and shoots.',
    price: 36,
    tryOnCategory: 'eyeshadow',
    tryOnShadeId: 'shd-champagne',
  },
  {
    id: 'mua-makeup-fixer',
    itemName: 'Makeup Fixer',
    productTitle: 'Backstage 24H Micro-Seal Fixer',
    division: 'Body & Professional Makeup',
    brand: 'Atelier Kōhl',
    code: 'BP-05',
    hex: '#E3EAEB',
    finishNote: 'Humidity-Proof Seal',
    description: 'Pro-grade breathable polymer mist shielding full looks under hot studio lamps.',
    price: 44,
  },
  {
    id: 'mua-bridal-kit',
    itemName: 'Bridal Makeup Kit',
    productTitle: 'Couture Atelier Bridal Vault (8-Piece)',
    division: 'Body & Professional Makeup',
    brand: 'Maison Velours',
    code: 'BP-06',
    hex: '#C46874',
    finishNote: 'Longwear Editorial Set',
    description: 'Complete bridal curation pairing luminous base, waterproof liner, rosewood lip, and fixer.',
    price: 210,
    tryOnCategory: 'lipstick',
    tryOnShadeId: 'lip-rosewood',
  },
  {
    id: 'mua-hd-makeup',
    itemName: 'HD Makeup Products',
    productTitle: '4K Optical Diffusing HD Complexion Trio',
    division: 'Body & Professional Makeup',
    brand: 'Maison Velours',
    code: 'BP-07',
    hex: '#E2BA9A',
    finishNote: '4K Camera Invisible',
    description: 'Sub-micron coated pigments invisible to macro lenses and harsh cinema lighting.',
    price: 128,
    tryOnCategory: 'foundation',
    tryOnShadeId: 'fnd-sand',
  },
  {
    id: 'mua-airbrush-makeup',
    itemName: 'Airbrush Makeup',
    productTitle: 'Silicone-Free Airbrush Pigment Drops',
    division: 'Body & Professional Makeup',
    brand: 'Lumière Privée',
    code: 'BP-08',
    hex: '#D9AE8B',
    finishNote: 'Mist Atomized',
    description: 'Ultra-fluid water-based pigment formulated for fine compressor airbrush needles.',
    price: 64,
    tryOnCategory: 'foundation',
    tryOnShadeId: 'fnd-honey',
  },
  {
    id: 'mua-waterproof-makeup',
    itemName: 'Waterproof Makeup',
    productTitle: 'Rain & Studio Sweatproof Sealant Duo',
    division: 'Body & Professional Makeup',
    brand: 'Atelier Kōhl',
    code: 'BP-09',
    hex: '#2C2827',
    finishNote: 'Aqua-Barrier Hold',
    description: 'Hydrophobic converting drops transforming powders, kajal, and foundation waterproof.',
    price: 46,
    tryOnCategory: 'kajal',
    tryOnShadeId: 'kaj-soot',
  },
];

export const DEFAULT_MUA_KIT_IDS: string[] = [
  'mua-cleanser',
  'mua-moisturizer',
  'mua-face-primer',
  'mua-concealer',
  'mua-setting-powder',
  'mua-mascara',
  'mua-eyebrow-gel',
  'mua-lip-liner',
  'mua-setting-spray',
];

export function getKitProductById(id: string): MuaKitProduct | undefined {
  return PRO_MUA_PRODUCTS.find((p) => p.id === id);
}


