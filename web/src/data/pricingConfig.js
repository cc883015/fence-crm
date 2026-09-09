/**
 * Unified default / reference prices for Quick Quote.
 *
 * These numbers are INITIAL defaults only. Sales can override any price
 * on the Quick Quote page. Quote math always uses effectivePrice
 * (customPrice if set, otherwise defaultPrice). Never hardcode prices in UI.
 */
export const pricingConfig = {
  gstRate: 0.1,

  fence: {
    horizontal: {
      name: "Horizontal",
      nameZh: "横板",
      defaultPrice: 399,
      unit: "m",
      defaultSize: "2400 x 1800",
      panelPrice: 399,
    },
    blade: {
      name: "Blade",
      nameZh: "刀片",
      defaultPrice: 429,
      unit: "m",
      defaultSize: "2400 x 1800",
      panelPrice: 429,
    },
    wave: {
      name: "Wave",
      nameZh: "波浪",
      defaultPrice: 449,
      unit: "m",
      defaultSize: "2400 x 1800",
      panelPrice: 449,
    },
    custom: {
      name: "Custom",
      nameZh: "自定义",
      defaultPrice: 0,
      unit: "m",
      defaultSize: "",
      panelPrice: 0,
    },
  },

  pedestrianGate: {
    horizontal: { name: "Horizontal", nameZh: "横板", defaultPrice: 890, unit: "ea", defaultSize: "900 x 1800" },
    blade: { name: "Blade", nameZh: "刀片", defaultPrice: 950, unit: "ea", defaultSize: "900 x 1800" },
    wave: { name: "Wave", nameZh: "波浪", defaultPrice: 990, unit: "ea", defaultSize: "900 x 1800" },
    custom: { name: "Custom", nameZh: "自定义", defaultPrice: 0, unit: "ea", defaultSize: "" },
  },

  slidingGate: {
    widths: ["4.5", "5", "5.5", "6"],
    heights: ["1.2", "1.8", "2"],
    horizontal: { name: "Horizontal", nameZh: "横板", defaultPrice: 3200, unit: "ea" },
    blade: { name: "Blade", nameZh: "刀片", defaultPrice: 3600, unit: "ea" },
    wave: { name: "Wave", nameZh: "波浪", defaultPrice: 3800, unit: "ea" },
    custom: { name: "Custom", nameZh: "自定义", defaultPrice: 0, unit: "ea" },
  },

  motor: {
    standard: { name: "Standard", nameZh: "标准", defaultPrice: 1850, unit: "ea" },
    largeGate: { name: "Large Gate", nameZh: "大门电机", defaultPrice: 2450, unit: "ea" },
    solar: { name: "Solar", nameZh: "太阳能", defaultPrice: 2650, unit: "ea" },
    custom: { name: "Custom", nameZh: "自定义", defaultPrice: 0, unit: "ea" },
  },

  posts: {
    "65x65": { name: "65×65", nameZh: "65×65", defaultPrice: 85, unit: "ea" },
    "100x100": { name: "100×100", nameZh: "100×100", defaultPrice: 145, unit: "ea" },
    custom: { name: "Custom", nameZh: "自定义", defaultPrice: 0, unit: "ea" },
  },

  brickWall: {
    defaultPerMetre: 1200,
    unit: "m",
  },

  brickPillars: {
    defaultPerMetre: 700,
    defaultPerPillar: 850,
    unitMetre: "m",
    unitPillar: "ea",
  },

  colorbond: {
    defaultPerMetre: 160,
    unit: "m",
  },

  installation: {
    fence: { name: "Fence Installation", nameZh: "围栏安装", defaultPrice: 80, unit: "m" },
    pedestrianGate: { name: "Pedestrian Gate Installation", nameZh: "行人门安装", defaultPrice: 180, unit: "ea" },
    slidingGate: { name: "Sliding Gate Installation", nameZh: "滑动门安装", defaultPrice: 480, unit: "ea" },
    concreteTrack: { name: "Concrete Track", nameZh: "水泥轨道", defaultPrice: 160, unit: "m" },
    custom: { name: "Custom Installation", nameZh: "自定义安装", defaultPrice: 0, unit: "ea" },
  },

  accessories: {
    slidingGateKit: { name: "Sliding Gate Kit", nameZh: "滑动门配件包", defaultPrice: 320, unit: "ea" },
    pedestrianGateKit: { name: "Pedestrian Gate Kit", nameZh: "行人门配件包", defaultPrice: 140, unit: "ea" },
    fenceFixingPack: { name: "Fence Fixing Pack", nameZh: "围栏固定包", defaultPrice: 55, unit: "pack" },
    custom: { name: "Custom", nameZh: "自定义", defaultPrice: 0, unit: "ea" },
  },

  retaining: {
    board: { name: "Retaining Board", nameZh: "挡土板", defaultPrice: 95, unit: "m" },
    custom: { name: "Custom", nameZh: "自定义", defaultPrice: 0, unit: "m" },
  },

  removal: {
    oldFence: { name: "Old fence removal", nameZh: "旧围栏拆除", defaultPrice: 40, unit: "m" },
    rubbish: { name: "Rubbish removal", nameZh: "垃圾清运", defaultPrice: 280, unit: "load" },
    custom: { name: "Custom", nameZh: "自定义", defaultPrice: 0, unit: "ea" },
  },

  other: {
    custom: { name: "Other", nameZh: "其他", defaultPrice: 0, unit: "ea" },
  },
};

export const FENCE_TYPES = ["horizontal", "blade", "wave", "custom"];
export const GATE_TYPES = ["horizontal", "blade", "wave", "custom"];
export const MOTOR_TYPES = ["standard", "largeGate", "solar", "custom"];
export const POST_TYPES = ["65x65", "100x100", "custom"];
export const INSTALL_TYPES = ["fence", "pedestrianGate", "slidingGate", "concreteTrack", "custom"];
export const ACCESSORY_TYPES = ["slidingGateKit", "pedestrianGateKit", "fenceFixingPack", "custom"];
export const RETAINING_TYPES = ["board", "custom"];
export const REMOVAL_TYPES = ["oldFence", "rubbish", "custom"];
