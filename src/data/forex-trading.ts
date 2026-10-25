// EXPORTS:
//   IForexPair, IAccount, IPosition, IClosedTrade,
//   ISimulationReport, ITimeline, ILoan, ITimeNews,
//   FOREX_PAIRS, TIMELINES, MUSIC_TRACKS,
//   getInitialAccount, createLoan, calculateFloatingPnL,
//   getBasePriceForYear, generatePriceSeriesTimeline, getPriceAtTime

export interface IForexPair {
  symbol: string;
  base: string;
  quote: string;
  name: string;
  basePrice: number; // 当前基准价
  pip: number; // 1 个点的值
}

export interface IPosition {
  id: string;
  pair: IForexPair;
  direction: 'buy' | 'sell';
  amount: number; // 交易金额（基础货币单位）
  openPrice: number;
  currentPrice: number;
  openTime: string;
  floatingPnL: number; // 以美元计
}

export interface IClosedTrade {
  id: string;
  pair: IForexPair;
  direction: 'buy' | 'sell';
  amount: number;
  openPrice: number;
  closePrice: number;
  pnl: number;
  openTime: string;
  closeTime: string;
}

export interface IAccount {
  initialBalance: number; // 初始资金（美元）
  balance: number; // 余额（已实现盈亏结算后）
  equity: number; // 净值 = 余额 + 浮动盈亏
  realizedPnL: number;
  floatingPnL: number;
  currency: string;
}

export interface ILoan {
  id: string;
  principal: number; // 贷款本金
  rate: number; // 年化利率（小数，如 0.08 表示 8%）
  totalRepay: number; // 应还总额 = 本金 × (1 + 利率)
  borrowedTime: string; // 贷款时间（模拟时间）
}

export interface ITimeNews {
  id: string;
  timelineId: string;
  dayOffset: number; // 从时间线起点算起的第几天触发
  headline: string;
  summary: string;
  impact: 'bullish' | 'bearish' | 'neutral';
  source: string;
}

export interface ISimulationReport {
  id: string;
  startTime: string;
  endTime: string;
  simStartTime: string; // 模拟时间起点
  simEndTime: string; // 模拟时间终点
  timeline: string; // 时间线名称
  initialBalance: number;
  finalBalance: number;
  finalEquity: number;
  totalPnL: number;
  totalReturn: number; // 百分比
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number; // 最大回撤百分比
  reason: 'manual' | 'margin_call'; // 结束原因
}

export interface ITimeline {
  id: string;
  name: string;
  description: string;
  startYear: number;
  volatility: number; // 波动率系数
  trendBias: number; // 趋势偏向 -1 ~ 1，正偏多，正偏空
  regime: 'ranging' | 'trending' | 'volatile' | 'crisis';
  durationDays: number; // 时间线总时长（天），模拟推进到此时自动结束
  musicId: string; // 对应主题音乐
  musicMoodText: string; // 进入时的氛围提示文案
  news: ITimeNews[]; // 该时间线的关键节点新闻
}

export interface IMusicTrack {
  id: string;
  name: string;
  style: string;
  url: string;
}

export const FOREX_PAIRS: IForexPair[] = [
  { symbol: 'EUR/USD', base: 'EUR', quote: 'USD', name: '欧元/美元', basePrice: 1.0856, pip: 0.0001 },
  { symbol: 'USD/JPY', base: 'USD', quote: 'JPY', name: '美元/日元', basePrice: 149.85, pip: 0.01 },
  { symbol: 'GBP/USD', base: 'GBP', quote: 'USD', name: '英镑/美元', basePrice: 1.2634, pip: 0.0001 },
  { symbol: 'USD/CHF', base: 'USD', quote: 'CHF', name: '美元/瑞郎', basePrice: 0.8923, pip: 0.0001 },
  { symbol: 'AUD/USD', base: 'AUD', quote: 'USD', name: '澳元/美元', basePrice: 0.6623, pip: 0.0001 },
  { symbol: 'USD/CAD', base: 'USD', quote: 'CAD', name: '美元/加元', basePrice: 1.3587, pip: 0.0001 },
];

export const TIMELINES: ITimeline[] = [
  {
    id: 'current',
    name: '当前时间线',
    description: '当前市场环境，价格温和波动，适合新手入门',
    startYear: 2024,
    volatility: 1,
    trendBias: 0,
    regime: 'ranging',
    durationDays: 720, // 约 2 年模拟时长
    musicId: 'ambient',
    musicMoodText: '进入当前时间线 · 此时一段宁静的氛围音乐缓缓响起',
    news: [
      { id: 'cur-1', timelineId: 'current', dayOffset: 3, headline: '美联储维持利率不变，符合市场预期', summary: '美联储决议维持联邦基金利率区间不变，市场解读为鸽派，美元指数小幅走弱。', impact: 'bearish', source: '美联社' },
      { id: 'cur-2', timelineId: 'current', dayOffset: 15, headline: '非农就业数据超预期', summary: '上月新增非农就业人数远超预期，市场对降息预期降温，美元走强。', impact: 'bullish', source: '路透社' },
      { id: 'cur-3', timelineId: 'current', dayOffset: 30, headline: '通胀数据温和回落', summary: '核心 CPI 同比继续放缓，市场押注年内仍有降息空间。', impact: 'neutral', source: '彭博' },
      { id: 'cur-4', timelineId: 'current', dayOffset: 60, headline: '地缘局势缓和，风险偏好回升', summary: '地缘政治紧张局势出现缓和迹象，避险货币回落，商品货币走强。', impact: 'bullish', source: '华尔街日报' },
    ],
  },
  {
    id: 'fx-warrior',
    name: 'FX 战士时间线',
    description: '2008 金融危机前后，大波动大机会，考验持仓勇气',
    startYear: 2008,
    volatility: 2.5,
    trendBias: -0.3,
    regime: 'crisis',
    durationDays: 540, // 约 1.5 年，覆盖危机爆发到量化宽松
    musicId: 'electronic',
    musicMoodText: '进入 FX 战士时间线 · 此时一段激昂的电子背景音乐响起',
    news: [
      { id: 'war-1', timelineId: 'fx-warrior', dayOffset: 0, headline: '贝尔斯登轰然倒下，市场恐慌加剧', summary: '美国第五大投行贝尔斯登因次贷危机濒临破产，被摩根大通低价收购，全球金融市场剧烈震荡。', impact: 'bearish', source: '纽约时报' },
      { id: 'war-2', timelineId: 'fx-warrior', dayOffset: 45, headline: '美联储紧急降息 75 个基点', summary: '为应对信贷危机蔓延，美联储宣布紧急降息 75bp，美元指数创历史新低。', impact: 'bearish', source: '美联储官网' },
      { id: 'war-3', timelineId: 'fx-warrior', dayOffset: 180, headline: '雷曼兄弟破产，金融危机全面爆发', summary: '拥有 158 年历史的雷曼兄弟宣布破产，引发全球金融海啸，VIX 恐慌指数飙升至历史极值。', impact: 'bearish', source: '华尔街日报' },
      { id: 'war-4', timelineId: 'fx-warrior', dayOffset: 200, headline: 'TARP 救市计划通过，市场短暂反弹', summary: '美国国会通过 7000 亿美元不良资产救助计划，金融股报复性反弹，美元获得喘息。', impact: 'bullish', source: '路透社' },
      { id: 'war-5', timelineId: 'fx-warrior', dayOffset: 365, headline: '全球央行联手量化宽松', summary: '美联储、欧央行、日央行同步开启量化宽松，流动性洪峰推动市场见底反弹。', impact: 'bullish', source: '彭博' },
    ],
  },
  {
    id: 'trend-hunter',
    name: '趋势猎手时间线',
    description: '2014-2015 美元大牛市，清晰单边趋势，顺势者昌',
    startYear: 2014,
    volatility: 1.5,
    trendBias: 0.6,
    regime: 'trending',
    durationDays: 600, // 约 2 年，覆盖 Taper 到首次加息
    musicId: 'piano',
    musicMoodText: '进入趋势猎手时间线 · 此时一段沉稳的钢琴背景音乐响起',
    news: [
      { id: 'trend-1', timelineId: 'trend-hunter', dayOffset: 0, headline: '美联储宣布缩减 QE，美元强势启动', summary: '美联储正式启动 Taper，每月缩减 100 亿美元购债规模，美元指数开启一轮波澜壮阔的牛市。', impact: 'bullish', source: '美联储官网' },
      { id: 'trend-2', timelineId: 'trend-hunter', dayOffset: 90, headline: '欧央行推出负利率政策', summary: '欧洲央行为对抗通缩将存款利率降至 -0.1%，欧元承压大幅贬值，EUR/USD 跌破 1.30。', impact: 'bearish', source: '欧央行' },
      { id: 'trend-3', timelineId: 'trend-hunter', dayOffset: 200, headline: '日元贬值至七年新低', summary: '安倍经济学持续发力，日央行加码宽松，USD/JPY 突破 120，创七年新高。', impact: 'bullish', source: '日经新闻' },
      { id: 'trend-4', timelineId: 'trend-hunter', dayOffset: 300, headline: '瑞士央行突然放弃汇率下限，瑞郎暴涨 30%', summary: '瑞士央行毫无预警地放弃欧元兑瑞郎 1.20 汇率下限，瑞郎瞬间暴涨，多家外汇经纪商爆仓。', impact: 'neutral', source: '瑞士央行' },
      { id: 'trend-5', timelineId: 'trend-hunter', dayOffset: 420, headline: '美联储首次加息落地，美元牛市顶点', summary: '美联储近十年来首次加息 25bp，靴子落地后美元指数见顶回落，趋势行情告一段落。', impact: 'neutral', source: '彭博' },
    ],
  },
  {
    id: 'volatility-king',
    name: '波动之王时间线',
    description: '2020 疫情冲击，极端波动，多空快速翻转',
    startYear: 2020,
    volatility: 3,
    trendBias: 0,
    regime: 'volatile',
    durationDays: 450, // 约 15 个月，疫情爆发到疫苗后复苏
    musicId: 'fastbeat',
    musicMoodText: '进入波动之王时间线 · 此时一段紧张的快节奏背景音乐响起',
    news: [
      { id: 'vol-1', timelineId: 'volatility-king', dayOffset: 0, headline: '新冠疫情全球大流行，市场恐慌抛售', summary: 'WHO 宣布新冠疫情为全球大流行，美股一周内三次熔断，VIX 突破 2008 年高点，美元流动性危机爆发。', impact: 'bearish', source: 'WHO' },
      { id: 'vol-2', timelineId: 'volatility-king', dayOffset: 20, headline: '美联储无限量 QE，市场剧烈反弹', summary: '美联储宣布不限量购买国债和 MBS，史无前例的宽松政策推动风险资产暴力反弹，美元指数回落。', impact: 'bullish', source: '美联储官网' },
      { id: 'vol-3', timelineId: 'volatility-king', dayOffset: 50, headline: '原油期货史无前例跌至负值', summary: 'WTI 5月原油期货结算价暴跌至 -37.63 美元/桶，为历史首次跌入负值，商品货币全线承压。', impact: 'bearish', source: '彭博' },
      { id: 'vol-4', timelineId: 'volatility-king', dayOffset: 150, headline: '疫苗研发突破，风险情绪全面回暖', summary: '辉瑞宣布新冠疫苗有效率超 90%，全球风险资产集体狂欢，美元加速走弱，非美货币普涨。', impact: 'bullish', source: '辉瑞官网' },
      { id: 'vol-5', timelineId: 'volatility-king', dayOffset: 300, headline: '美国国会通过 1.9 万亿纾困法案', summary: '拜登政府 1.9 万亿美元经济刺激计划落地，通胀预期升温，美元短期反弹后继续走弱。', impact: 'neutral', source: '白宫' },
    ],
  },
  {
    id: 'post-covid',
    name: '后疫情复苏',
    description: '2021-2022 通胀加息周期，商品货币走强',
    startYear: 2021,
    volatility: 1.8,
    trendBias: 0.2,
    regime: 'trending',
    durationDays: 720, // 约 2 年，覆盖复苏到加息周期
    musicId: 'lofi',
    musicMoodText: '进入后疫情复苏 · 此时一段慵懒的 Lo-Fi 背景音乐缓缓流淌',
    news: [
      { id: 'post-1', timelineId: 'post-covid', dayOffset: 0, headline: '全球经济复苏预期升温，大宗商品牛市启动', summary: '疫苗接种推进 + 各国财政刺激齐发力，市场押注后疫情时代全球经济强劲复苏，商品货币领涨。', impact: 'bullish', source: 'IMF' },
      { id: 'post-2', timelineId: 'post-covid', dayOffset: 120, headline: '通胀数据超预期，美联储改口"暂时性"', summary: '美国 CPI 同比突破 5%，创十三年新高，鲍威尔承认通胀"比预期更高更持久"，加息预期提前。', impact: 'neutral', source: '美国劳工部' },
      { id: 'post-3', timelineId: 'post-covid', dayOffset: 250, headline: '美联储加速 Taper，美元指数走强', summary: '美联储宣布将缩债速度翻倍，点阵图显示 2022 年加息三次，美元创一年新高，黄金承压。', impact: 'bullish', source: '美联储官网' },
      { id: 'post-4', timelineId: 'post-covid', dayOffset: 365, headline: '俄乌冲突爆发，全球市场剧烈震荡', summary: '俄乌地缘冲突骤然升级，能源价格暴涨，欧洲货币暴跌，避险资金涌入美元和日元。', impact: 'bearish', source: '路透社' },
      { id: 'post-5', timelineId: 'post-covid', dayOffset: 500, headline: '美联储连续加息 75bp，创近 30 年最大幅度', summary: '为压制四十年一遇的高通胀，美联储连续两次加息 75bp，美元指数突破 110，创二十年新高。', impact: 'bullish', source: '彭博' },
    ],
  },
];

export const MUSIC_TRACKS: IMusicTrack[] = [
  {
    id: 'ambient',
    name: '深空氛围',
    style: '氛围',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  },
  {
    id: 'electronic',
    name: '霓虹战场',
    style: '电子',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=energetic-rock-122841.mp3',
  },
  {
    id: 'piano',
    name: '静谧时光',
    style: '钢琴',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946e6d88d4.mp3?filename=relaxing-piano-113152.mp3',
  },
  {
    id: 'fastbeat',
    name: '心跳加速',
    style: '快节奏',
    url: 'https://cdn.pixabay.com/download/audio/2022/08/23/audio_2dde668c47.mp3?filename=sport-energetic-electronic-116270.mp3',
  },
  {
    id: 'lofi',
    name: '午后 Lofi',
    style: 'Lo-Fi',
    url: 'https://cdn.pixabay.com/download/audio/2023/06/05/audio_95b2e6e3f5.mp3?filename=lofi-chill-medium-version-159456.mp3',
  },
];

// 各货币对在不同年份的近似基准价（基于历史真实水平，模拟用）
const YEARLY_BASE_PRICES: Record<string, Record<number, number>> = {
  'EUR/USD': {
    2005: 1.24, 2006: 1.27, 2008: 1.47, 2010: 1.33,
    2012: 1.28, 2014: 1.30, 2015: 1.10, 2016: 1.10,
    2018: 1.18, 2020: 1.10, 2021: 1.18, 2022: 1.05,
    2023: 1.08, 2024: 1.09,
  },
  'USD/JPY': {
    2005: 118, 2006: 117, 2008: 105, 2010: 92,
    2012: 82, 2014: 105, 2015: 120, 2016: 110,
    2018: 112, 2020: 107, 2021: 110, 2022: 135,
    2023: 145, 2024: 150,
  },
  'GBP/USD': {
    2005: 1.8, 2006: 1.84, 2008: 1.85, 2010: 1.54,
    2012: 1.58, 2014: 1.65, 2015: 1.53, 2016: 1.35,
    2018: 1.34, 2020: 1.26, 2021: 1.38, 2022: 1.20,
    2023: 1.27, 2024: 1.27,
  },
  'USD/CHF': {
    2005: 1.24, 2006: 1.24, 2008: 1.10, 2010: 1.04,
    2012: 0.94, 2014: 0.90, 2015: 0.95, 2016: 0.99,
    2018: 0.99, 2020: 0.96, 2021: 0.91, 2022: 0.96,
    2023: 0.87, 2024: 0.90,
  },
  'AUD/USD': {
    2005: 0.76, 2006: 0.77, 2008: 0.85, 2010: 0.90,
    2012: 1.02, 2014: 0.87, 2015: 0.73, 2016: 0.74,
    2018: 0.75, 2020: 0.65, 2021: 0.75, 2022: 0.67,
    2023: 0.67, 2024: 0.67,
  },
  'USD/CAD': {
    2005: 1.22, 2006: 1.16, 2008: 1.06, 2010: 1.04,
    2012: 1.00, 2014: 1.09, 2015: 1.30, 2016: 1.32,
    2018: 1.30, 2020: 1.38, 2021: 1.25, 2022: 1.36,
    2023: 1.35, 2024: 1.36,
  },
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * 获取指定年份的基准价，使用线性插值
 */
export function getBasePriceForYear(pair: IForexPair, year: number): number {
  const yearly = YEARLY_BASE_PRICES[pair.symbol];
  if (!yearly) return pair.basePrice;

  // 找到最近的两个年份
  const years = Object.keys(yearly)
    .map(Number)
    .sort((a, b) => a - b);

  if (year <= years[0]) return yearly[years[0]];
  if (year >= years[years.length - 1]) return yearly[years[years.length - 1]];

  for (let i = 0; i < years.length - 1; i++) {
    const y0 = years[i];
    const y1 = years[i + 1];
    if (year >= y0 && year <= y1) {
      const t = (year - y0) / (y1 - y0);
      return yearly[y0] + (yearly[y1] - yearly[y0]) * t;
    }
  }
  return pair.basePrice;
}

/**
 * 计算指定模拟时间的价格（基于时间线 + 年份基准价 + 随机游走）
 */
export function getPriceAtTime(
  pair: IForexPair,
  simTime: Date,
  timeline: ITimeline,
): number {
  const year = simTime.getFullYear() + simTime.getMonth() / 12 + simTime.getDate() / 365;
  const basePrice = getBasePriceForYear(pair, simTime.getFullYear());

  // 用时间作种子，生成随机游走
  // 每 4 小时一个价格点，保证价格不会跳变太快
  const timeStep = Math.floor(simTime.getTime() / (4 * 3600 * 1000));
  const seedBase =
    pair.symbol.charCodeAt(0) * 1000 +
    pair.symbol.charCodeAt(3) * 10 +
    timeStep +
    timeline.id.charCodeAt(0) * 100;

  const rand = seededRandom(seedBase);

  // 基于波动率系数和趋势偏向生成偏移
  // 每日波动幅度（百分比）
  const dailyVolatility = 0.005 * timeline.volatility;
  // 距离时间线起点的天数
  const daysFromStart = (simTime.getTime() - new Date(timeline.startYear, 0, 1).getTime()) / 86400000;

  // 累积游走：使用多个随机步的累积（近似，但用确定性公式）
  const steps = Math.min(Math.floor(Math.abs(daysFromStart) / 2), 500);
  let walk = 0;
  for (let i = 0; i < steps; i++) {
    walk += (rand() - 0.5 + timeline.trendBias * 0.1) * dailyVolatility;
  }

  // 加上短期波动
  const shortTerm = (rand() - 0.5) * dailyVolatility * 3;

  let price = basePrice * (1 + walk + shortTerm);

  // 危机模式下偶尔有跳空
  if (timeline.regime === 'crisis' && rand() > 0.9) {
    price *= 1 + (rand() - 0.6) * 0.03;
  }

  const decimals = pair.pip >= 0.01 ? 2 : 4;
  return +price.toFixed(decimals);
}

/**
 * 生成价格序列（用于迷你走势图）
 */
export function generatePriceSeriesTimeline(
  pair: IForexPair,
  days: number,
  simTime: Date,
  timeline: ITimeline,
): Array<{ date: string; value: number }> {
  const series: Array<{ date: string; value: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(simTime.getTime() - i * 86400000);
    const price = getPriceAtTime(pair, d, timeline);
    series.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      value: price,
    });
  }

  return series;
}

export function getInitialAccount(initialBalance = 10000): IAccount {
  return {
    initialBalance,
    balance: initialBalance,
    equity: initialBalance,
    realizedPnL: 0,
    floatingPnL: 0,
    currency: 'USD',
  };
}

/**
 * 创建一笔虚拟银行贷款
 */
export function createLoan(principal: number, rate: number, simTime: Date): ILoan {
  const totalRepay = principal * (1 + rate);
  return {
    id: `loan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    principal,
    rate,
    totalRepay,
    borrowedTime: simTime.toISOString(),
  };
}

/**
 * 计算浮动盈亏（统一以美元计）
 */
export function calculateFloatingPnL(
  direction: 'buy' | 'sell',
  amount: number,
  openPrice: number,
  currentPrice: number,
  pair: IForexPair,
): number {
  const sign = direction === 'buy' ? 1 : -1;

  if (pair.quote === 'USD') {
    return (currentPrice - openPrice) * amount * sign;
  }
  if (pair.base === 'USD') {
    const pnlQuote = (currentPrice - openPrice) * amount * sign;
    return -pnlQuote / currentPrice;
  }
  return (currentPrice - openPrice) * amount * sign;
}

/**
 * 生成结算报告
 */
export function generateReport(
  account: IAccount,
  closedTrades: IClosedTrade[],
  startTime: Date,
  endTime: Date,
  simStart: Date,
  simEnd: Date,
  timeline: ITimeline,
  reason: 'manual' | 'margin_call',
): ISimulationReport {
  const totalTrades = closedTrades.length;
  const winningTrades = closedTrades.filter((t) => t.pnl > 0).length;
  const losingTrades = closedTrades.filter((t) => t.pnl <= 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalPnL = account.equity - account.initialBalance;
  const totalReturn = (totalPnL / account.initialBalance) * 100;

  // 简单最大回撤估算（基于账户净值波动）
  let peak = account.initialBalance;
  let maxDrawdown = 0;
  let runningEquity = account.initialBalance;
  for (const trade of closedTrades) {
    runningEquity += trade.pnl;
    if (runningEquity > peak) peak = runningEquity;
    const dd = ((peak - runningEquity) / peak) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }
  // 当前浮动盈亏也算入
  const currentEquity = account.equity;
  if (currentEquity > peak) peak = currentEquity;
  const ddCurrent = ((peak - currentEquity) / peak) * 100;
  if (ddCurrent > maxDrawdown) maxDrawdown = ddCurrent;

  function formatDate(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  return {
    id: `report-${Date.now()}`,
    startTime: formatDate(startTime),
    endTime: formatDate(endTime),
    simStartTime: formatDate(simStart),
    simEndTime: formatDate(simEnd),
    timeline: timeline.name,
    initialBalance: account.initialBalance,
    finalBalance: account.balance,
    finalEquity: account.equity,
    totalPnL,
    totalReturn,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    maxDrawdown,
    reason,
  };
}
