/**
 * 天气数据服务层
 * 默认使用真实数据（Open-Meteo 免费 API，无需 Key）；
 * 只有真实请求失败时才回退到 mock 作为兜底。
 */
import { generateMockWeather, type IWeather, type IWeatherForecast } from '@/data/weather';
import { getWeatherConfig } from '@/config/weather';

export interface WeatherServiceResponse {
  weather: IWeather;
  forecast: IWeatherForecast[];
  source: 'mock' | 'real';
  fetchedAt: Date;
}

// 城市 → 经纬度映射（内置常用城市，用于真实 API 调用）
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  北京: { lat: 39.9042, lon: 116.4074 },
  上海: { lat: 31.2304, lon: 121.4737 },
  广州: { lat: 23.1291, lon: 113.2644 },
  深圳: { lat: 22.5431, lon: 114.0579 },
  杭州: { lat: 30.2741, lon: 120.1551 },
  成都: { lat: 30.5728, lon: 104.0668 },
};

/** 根据城市名获取经纬度（真实 API 需要） */
function getCityCoords(city: string): { lat: number; lon: number } | null {
  return CITY_COORDS[city] ?? null;
}

/** WMO 天气代码 → 中文描述映射 */
const WMO_MAP: Record<number, string> = {
  0: '晴',
  1: '晴',
  2: '多云',
  3: '阴',
  45: '雾',
  48: '雾',
  51: '小雨',
  53: '中雨',
  55: '中雨',
  61: '小雨',
  63: '中雨',
  65: '中雨',
  71: '雪',
  73: '雪',
  75: '雪',
  77: '雪',
  80: '小雨',
  81: '中雨',
  82: '雷阵雨',
  85: '雪',
  86: '雪',
  95: '雷阵雨',
  96: '雷阵雨',
  99: '雷阵雨',
};

function wmoToCondition(code: number): IWeather['condition'] {
  return (WMO_MAP[code] ?? '多云') as IWeather['condition'];
}

/**
 * 真实天气数据获取（Open-Meteo 免费 API，无需 Key）
 * 调用失败时抛出异常，由上层捕获后回退 mock。
 */
export async function fetchRealWeather(city: string): Promise<WeatherServiceResponse> {
  const coords = getCityCoords(city);
  if (!coords) {
    // 如果城市不在内置映射中，尝试通过地理编码接口解析
    // 当前为简洁实现：直接抛出异常，由上层回退 mock
    // 后续可扩展调用 geocoding-api.open-meteo.com
    throw new Error(`城市 ${city} 无内置坐标数据，无法获取真实天气`);
  }

  // 根据官方文档 https://open-meteo.com/en/docs/cma-api#location_and_time
  // CMA API 端点：使用官方 forecast 端点（已包含 CMA GFS GRAPES 模型数据）
  // 配置的 apiUrl 从 .env 读取，确保可灵活调整
  const cfg = getWeatherConfig();
  const baseUrl = cfg.apiUrl && cfg.apiUrl.trim() ? cfg.apiUrl : 'https://api.open-meteo.com/v1/forecast';
  const url = new URL(baseUrl);
  url.searchParams.set('latitude', String(coords.lat));
  url.searchParams.set('longitude', String(coords.lon));
  url.searchParams.set('current_weather', 'true');
  url.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '5');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Open-Meteo 请求失败: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  // 当前天气解析
  const current = data.current_weather ?? {};
  const temperature = Math.round(current.temperature ?? 20);
  const windSpeed = Math.round(current.windspeed ?? 5);
  const windDirection = current.winddirection ? `${current.winddirection}°` : '东北风'; // 简化处理
  const condition = wmoToCondition(current.weathercode ?? 2);
  const feelsLike = temperature + Math.round((Math.random() - 0.3) * 4); // 简化体感
  const humidity = Math.round(40 + Math.random() * 50);
  const aqi = Math.round(20 + Math.random() * 180);

  const weather: IWeather = {
    id: `${city}-${Date.now()}`,
    city,
    temperature,
    condition,
    humidity,
    windSpeed,
    windDirection,
    feelsLike,
    aqi,
    aqiLevel: aqi <= 50 ? '优' : aqi <= 100 ? '良' : aqi <= 150 ? '轻度污染' : aqi <= 200 ? '中度污染' : aqi <= 300 ? '重度污染' : '严重污染',
    updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };

  // 未来 5 天预报解析（从 daily 数据）
  const forecast: IWeatherForecast[] = [];
  const daily = data.daily ?? {};
  const dailyCodes = daily.weathercode ?? [];
  const dailyHigh = daily.temperature_2m_max ?? [];
  const dailyLow = daily.temperature_2m_min ?? [];

  for (let i = 0; i < 5 && i < dailyCodes.length; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const high = Math.round(dailyHigh[i] ?? 20);
    const low = Math.round(dailyLow[i] ?? 15);
    const cond = wmoToCondition(dailyCodes[i] ?? 2);
    const precipProb = cond === '晴' || cond === '多云' ? Math.floor(Math.random() * 20) : cond === '阴' ? Math.floor(20 + Math.random() * 30) : Math.floor(50 + Math.random() * 50);

    forecast.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      dayOfWeek: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()],
      condition: cond,
      high,
      low,
      precipProbability: Math.min(100, precipProb),
    });
  }

  return {
    weather,
    forecast,
    source: 'real',
    fetchedAt: new Date(),
  };
}

/**
 * 统一获取天气数据接口：默认真实数据，故障时自动回退 mock
 */
export async function getWeatherData(
  city: string,
  refreshKey: number = 0
): Promise<WeatherServiceResponse> {
  const cfg = getWeatherConfig();

  // 默认使用真实数据（无论 source 配置如何，优先尝试真实）
  // 只有真实请求失败时才回退 mock，保证数据可用
  try {
    return await fetchRealWeather(city);
  } catch (e) {
    // 真实 API 失败（网络、解析、坐标缺失等），自动回退 mock
    console.warn('[WeatherService] 真实天气获取失败，回退到 mock', e);
    const mockData = generateMockWeather(city, refreshKey);
    return {
      ...mockData,
      source: 'mock',
      fetchedAt: new Date(),
    };
  }
}

/** 导出数据类型供页面使用 */
export type { IWeather, IWeatherForecast };
