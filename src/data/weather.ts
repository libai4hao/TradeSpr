// EXPORTS: IWeather, IWeatherForecast, IMockWeatherData, MOCK_WEATHERS, generateMockWeather

export interface IWeather {
  id: string;
  city: string;
  temperature: number;
  condition:
    | '晴'
    | '多云'
    | '阴'
    | '小雨'
    | '中雨'
    | '雷阵雨'
    | '雪'
    | '雾';
  humidity: number;
  windSpeed: number;
  windDirection: string;
  feelsLike: number;
  aqi: number;
  aqiLevel: string;
  updateTime: string;
}

export interface IWeatherForecast {
  date: string;
  dayOfWeek: string;
  condition: IWeather['condition'];
  high: number;
  low: number;
  precipProbability: number;
}

interface IMockWeatherData {
  weather: IWeather;
  forecast: IWeatherForecast[];
}

const CONDITIONS: IWeather['condition'][] = [
  '晴',
  '多云',
  '阴',
  '小雨',
  '中雨',
  '雷阵雨',
  '雾',
];

const WIND_DIRECTIONS = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];

const AQI_LEVELS = [
  { min: 0, max: 50, level: '优' },
  { min: 51, max: 100, level: '良' },
  { min: 101, max: 150, level: '轻度污染' },
  { min: 151, max: 200, level: '中度污染' },
  { min: 201, max: 300, level: '重度污染' },
  { min: 301, max: 500, level: '严重污染' },
];

function getAqiLevel(aqi: number): string {
  const found = AQI_LEVELS.find((l) => aqi >= l.min && aqi <= l.max);
  return found?.level ?? '良';
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function hashCity(city: string): number {
  let h = 0;
  for (let i = 0; i < city.length; i++) {
    h = (h << 5) - h + city.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function formatTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
}

function getDayOfWeek(date: Date): string {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
}

/**
 * TODO 先生成fake数据
 * 根据城市名 + 基准日期生成"看似合理"的天气数据。
 * 同一城市同一天结果稳定（便于用户对比），刷新时会有小幅波动。
 */
export function generateMockWeather(city: string, refreshKey: number = 0): IMockWeatherData {
  const seed = hashCity(city) + refreshKey * 1000;
  const rand = seededRandom(seed);

  // 基础温度：按城市名 hash 出一个 15~35 度的基准
  const baseTemp = 15 + (hashCity(city) % 200) / 10; // 15 ~ 35
  const temperature = Math.round((baseTemp + (rand() - 0.5) * 2) * 10) / 10;
  const feelsLike = Math.round((temperature + (rand() - 0.3) * 4) * 10) / 10;
  const humidity = Math.round(30 + rand() * 60);
  const windSpeed = Math.round(5 + rand() * 25);
  const windDirection = WIND_DIRECTIONS[Math.floor(rand() * WIND_DIRECTIONS.length)];
  const condition = CONDITIONS[Math.floor(rand() * CONDITIONS.length)];
  const aqi = Math.round(20 + rand() * 180);

  const weather: IWeather = {
    id: `${city}-${refreshKey}`,
    city,
    temperature,
    condition,
    humidity,
    windSpeed,
    windDirection,
    feelsLike,
    aqi,
    aqiLevel: getAqiLevel(aqi),
    updateTime: formatTime(new Date()),
  };

  // 未来 5 天预报
  const forecast: IWeatherForecast[] = [];
  const today = new Date();
  for (let i = 1; i <= 5; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const daySeed = seed + i * 7919;
    const dayRand = seededRandom(daySeed);
    const high = Math.round((baseTemp + 2 + dayRand() * 4) * 10) / 10;
    const low = Math.round((baseTemp - 5 + dayRand() * 3) * 10) / 10;
    const cond = CONDITIONS[Math.floor(dayRand() * CONDITIONS.length)];
    const precipProb =
      cond === '晴' || cond === '多云'
        ? Math.floor(dayRand() * 20)
        : cond === '阴'
          ? Math.floor(20 + dayRand() * 30)
          : Math.floor(50 + dayRand() * 50);

    forecast.push({
      date: formatDate(d),
      dayOfWeek: getDayOfWeek(d),
      condition: cond,
      high,
      low,
      precipProbability: Math.min(100, precipProb),
    });
  }

  return { weather, forecast };
}

export const MOCK_WEATHERS: IWeather[] = [
  {
    id: '1',
    city: '北京',
    temperature: 28,
    condition: '晴',
    humidity: 45,
    windSpeed: 12,
    windDirection: '东北风',
    feelsLike: 30,
    aqi: 78,
    aqiLevel: '良',
    updateTime: '2024-06-15 14:30:00',
  },
  {
    id: '2',
    city: '上海',
    temperature: 32,
    condition: '多云',
    humidity: 72,
    windSpeed: 8,
    windDirection: '东南风',
    feelsLike: 35,
    aqi: 62,
    aqiLevel: '良',
    updateTime: '2024-06-15 14:30:00',
  },
  {
    id: '3',
    city: '广州',
    temperature: 33,
    condition: '雷阵雨',
    humidity: 85,
    windSpeed: 15,
    windDirection: '南风',
    feelsLike: 38,
    aqi: 45,
    aqiLevel: '优',
    updateTime: '2024-06-15 14:30:00',
  },
];
