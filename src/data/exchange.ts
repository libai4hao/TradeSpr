// EXPORTS: IExchangeRate, MOCK_EXCHANGE_RATES, generateMockExchangeRate, generateMockRateHistory

export interface IExchangeRate {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  pair: string;
  rate: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down';
  updatedAt: string;
}

export interface IRateHistoryPoint {
  date: string;
  rate: number;
}

const CURRENCY_NAMES: Record<string, string> = {
  USD: '美元',
  EUR: '欧元',
  JPY: '日元',
  GBP: '英镑',
  HKD: '港币',
  CNY: '人民币',
  AUD: '澳元',
  CAD: '加元',
  SGD: '新加坡元',
  KRW: '韩元',
};

// 各货币对基准汇率（相对真实值近似）
const BASE_RATES: Record<string, number> = {
  'USD-CNY': 7.2456,
  'EUR-CNY': 7.8932,
  'JPY-CNY': 0.0486,
  'GBP-CNY': 9.1234,
  'HKD-CNY': 0.9285,
  'AUD-CNY': 4.762,
  'CAD-CNY': 5.3218,
  'SGD-CNY': 5.38,
  'KRW-CNY': 0.0053,
  'USD-EUR': 0.918,
  'USD-JPY': 149.0,
  'USD-GBP': 0.794,
  'EUR-USD': 1.089,
  'GBP-USD': 1.259,
};

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

function getBaseRate(base: string, target: string): number {
  const key = `${base}-${target}`;
  if (BASE_RATES[key]) return BASE_RATES[key];
  // 反向
  const reverseKey = `${target}-${base}`;
  if (BASE_RATES[reverseKey]) return 1 / BASE_RATES[reverseKey];
  // 通过 CNY 中转
  const baseToCNY = BASE_RATES[`${base}-CNY`] ?? (BASE_RATES[`CNY-${base}`] ? 1 / BASE_RATES[`CNY-${base}`] : 1);
  const cnyToTarget = BASE_RATES[`CNY-${target}`] ?? (BASE_RATES[`${target}-CNY`] ? 1 / BASE_RATES[`${target}-CNY`] : 1);
  return baseToCNY * cnyToTarget || 1;
}

export function generateMockExchangeRate(
  baseCurrency: string,
  targetCurrency: string,
  refreshKey: number = 0,
): IExchangeRate {
  const baseRate = getBaseRate(baseCurrency, targetCurrency);
  const seed =
    baseCurrency.charCodeAt(0) * 256 + targetCurrency.charCodeAt(0) + refreshKey * 7;
  const rand = seededRandom(seed);

  // ±0.8% 波动
  const fluctuation = (rand() - 0.5) * 0.016;
  const rate = baseRate * (1 + fluctuation);
  const change = rate - baseRate;
  const changePercent = (change / baseRate) * 100;
  const trend = change >= 0 ? 'up' : 'down';

  const baseName = CURRENCY_NAMES[baseCurrency] ?? baseCurrency;
  const targetName = CURRENCY_NAMES[targetCurrency] ?? targetCurrency;

  return {
    id: `${baseCurrency}-${targetCurrency}-${refreshKey}`,
    baseCurrency,
    targetCurrency,
    pair: `${baseName}/${targetName}`,
    rate: +rate.toFixed(4),
    change: +change.toFixed(4),
    changePercent: +Math.abs(changePercent).toFixed(2),
    trend,
    updatedAt: formatTime(new Date()),
  };
}

export function generateMockRateHistory(
  baseCurrency: string,
  targetCurrency: string,
  days: number,
  refreshKey: number = 0,
): IRateHistoryPoint[] {
  const baseRate = getBaseRate(baseCurrency, targetCurrency);
  const seed =
    baseCurrency.charCodeAt(1) * 1000 + targetCurrency.charCodeAt(1) + refreshKey * 13;
  const rand = seededRandom(seed);

  const points: IRateHistoryPoint[] = [];
  let rate = baseRate * (1 - 0.02 + rand() * 0.01); // 起始略低

  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    // 每天 ±0.5% 随机游走
    const dayChange = (rand() - 0.48) * 0.01;
    rate = rate * (1 + dayChange);
    points.push({
      date: formatDate(d),
      rate: +rate.toFixed(4),
    });
  }

  return points;
}

export const MOCK_EXCHANGE_RATES: IExchangeRate[] = [
  {
    id: '1',
    baseCurrency: 'USD',
    targetCurrency: 'CNY',
    pair: '美元/人民币',
    rate: 7.2456,
    change: 0.0123,
    changePercent: 0.17,
    trend: 'up',
    updatedAt: '2024-01-15 14:30:00',
  },
  {
    id: '2',
    baseCurrency: 'EUR',
    targetCurrency: 'CNY',
    pair: '欧元/人民币',
    rate: 7.8932,
    change: -0.0245,
    changePercent: 0.31,
    trend: 'down',
    updatedAt: '2024-01-15 14:30:00',
  },
  {
    id: '3',
    baseCurrency: 'JPY',
    targetCurrency: 'CNY',
    pair: '日元/人民币',
    rate: 0.0486,
    change: 0.0003,
    changePercent: 0.62,
    trend: 'up',
    updatedAt: '2024-01-15 14:30:00',
  },
];
