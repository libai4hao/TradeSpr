// EXPORTS: IGoldPrice, MOCK_GOLD_PRICES, generateMockGoldPrices, generateMockGoldHistory

export interface IGoldPrice {
  id: string;
  name: string;
  unit: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  updateTime: string;
}

export interface IGoldHistoryPoint {
  date: string;
  price: number;
}

const GOLD_BASE: Array<{ name: string; unit: string; basePrice: number }> = [
  { name: '国际现货黄金', unit: '美元/盎司', basePrice: 2345.68 },
  { name: '人民币计价金价', unit: '元/克', basePrice: 568.25 },
  { name: '黄金T+D', unit: '元/克', basePrice: 571.8 },
  { name: '纸黄金', unit: '元/克', basePrice: 566.5 },
];

function formatTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateMockGoldPrices(refreshKey: number = 0): IGoldPrice[] {
  return GOLD_BASE.map((item, idx) => {
    const seed = idx * 1000 + refreshKey * 7;
    const rand = seededRandom(seed);

    // ±0.6% 波动
    const fluctuation = (rand() - 0.5) * 0.012;
    const price = item.basePrice * (1 + fluctuation);
    const open = item.basePrice * (1 + (rand() - 0.55) * 0.006);
    const change = price - open;
    const changePercent = (change / open) * 100;
    const high = Math.max(price, open) * (1 + rand() * 0.004);
    const low = Math.min(price, open) * (1 - rand() * 0.004);

    const decimals = item.basePrice > 1000 ? 2 : 2;

    return {
      id: `gold-${idx}-${refreshKey}`,
      name: item.name,
      unit: item.unit,
      price: +price.toFixed(decimals),
      change: +change.toFixed(decimals),
      changePercent: +changePercent.toFixed(2),
      high: +high.toFixed(decimals),
      low: +low.toFixed(decimals),
      open: +open.toFixed(decimals),
      updateTime: formatTime(new Date()),
    };
  });
}

export function generateMockGoldHistory(
  index: number,
  days: number,
  refreshKey: number = 0,
): IGoldHistoryPoint[] {
  const basePrice = GOLD_BASE[index]?.basePrice ?? 2345.68;
  const seed = index * 100 + refreshKey * 13;
  const rand = seededRandom(seed);

  const points: IGoldHistoryPoint[] = [];
  let price = basePrice * (1 - 0.015 + rand() * 0.008);

  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayChange = (rand() - 0.48) * 0.008;
    price = price * (1 + dayChange);
    const decimals = basePrice > 1000 ? 2 : 2;
    points.push({
      date: formatDate(d),
      price: +price.toFixed(decimals),
    });
  }

  return points;
}

export const MOCK_GOLD_PRICES: IGoldPrice[] = [
  {
    id: '1',
    name: '国际现货黄金',
    unit: '美元/盎司',
    price: 2345.68,
    change: 12.35,
    changePercent: 0.53,
    high: 2352.1,
    low: 2330.2,
    open: 2333.33,
    updateTime: '2024-01-15 14:30:00',
  },
  {
    id: '2',
    name: '人民币计价金价',
    unit: '元/克',
    price: 568.25,
    change: -2.15,
    changePercent: -0.38,
    high: 572.8,
    low: 565.3,
    open: 570.4,
    updateTime: '2024-01-15 14:30:00',
  },
  {
    id: '3',
    name: '黄金T+D',
    unit: '元/克',
    price: 571.8,
    change: 3.6,
    changePercent: 0.63,
    high: 575.0,
    low: 567.5,
    open: 568.2,
    updateTime: '2024-01-15 14:30:00',
  },
];
