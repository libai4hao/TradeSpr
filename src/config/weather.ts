import type { IWeather, IWeatherForecast } from '@/data/weather';

/**
 * 天气配置抽离模块
 * 所有与外部天气数据源相关的配置统一管理，保证安全性与可维护性。
 */
export interface WeatherConfig {
  /** 数据源类型：mock（默认，安全无依赖）或 real（真实 API） */
  source: 'mock' | 'real';
  /** 真实天气 API 基础地址（仅 source=real 时使用） */
  apiUrl: string;
  /** 真实天气 API 密钥（仅 source=real 时使用） */
  apiKey: string;
  /** 定时自动刷新间隔（分钟） */
  refreshIntervalMinutes: number;
}

function readEnv(key: string, defaultValue: string): string {
  try {
    // Vite 提供的 import.meta.env 在构建时被内联
    const env = (import.meta as { env?: Record<string, string | undefined> }).env;
    return (env?.[key] as string | undefined) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * 从环境变量读取天气配置，安全抽离：
 * - 不暴露真实 API Key 到源码
 * - 默认使用 mock 避免外部依赖失效
 */
export function getWeatherConfig(): WeatherConfig {
  const sourceRaw = readEnv('VITE_WEATHER_SOURCE', 'real');
  const source = sourceRaw === 'real' ? 'real' : 'mock';

  const apiUrl = readEnv('VITE_WEATHER_API_URL', '');
  const apiKey = readEnv('VITE_WEATHER_API_KEY', '');

  const intervalRaw = readEnv('VITE_WEATHER_REFRESH_INTERVAL_MINUTES', '30');
  const refreshIntervalMinutes = parseInt(intervalRaw, 10) || 30;

  return {
    source,
    apiUrl,
    apiKey,
    refreshIntervalMinutes,
  };
}

/** 当前天气模块的配置单例 */
export const weatherConfig = getWeatherConfig();
