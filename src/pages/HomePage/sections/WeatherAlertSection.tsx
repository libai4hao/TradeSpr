import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Umbrella,
  Sun,
  Thermometer,
  Wind,
  Snowflake,
  CloudFog,
  AlertCircle,
  Shirt,
  Sparkles,
  MapPin,
  Loader2,
  X,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import type { IWeather } from '@/data/weather';

export interface WeatherAlert {
  id: string;
  icon: typeof Sun;
  title: string;
  description: string;
  level: 'info' | 'warning' | 'tip';
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

interface WeatherAlertSectionProps {
  weather: IWeather | null;
  locating: boolean;
  locationError: string | null;
  locationCity: string | null;
  onDismiss?: () => void;
  onManualSelect?: () => void;
  onRetryLocate?: () => void;
}

function generateAlerts(weather: IWeather): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const { condition, temperature, humidity, windSpeed, feelsLike, aqi, aqiLevel } = weather;

  // 降雨提醒
  const rainyConditions: IWeather['condition'][] = ['小雨', '中雨', '雷阵雨'];
  if (rainyConditions.includes(condition)) {
    alerts.push({
      id: 'rain',
      icon: Umbrella,
      title: '今日有雨',
      description:
        condition === '雷阵雨'
          ? '可能伴有雷电，请尽量减少外出，外出请携带雨具并注意防雷。'
          : '出门记得带伞，注意路滑，建议穿防水鞋。',
      level: 'warning',
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-500/10',
      borderClass: 'border-blue-200',
    });
  }

  // 高温提醒
  if (temperature >= 33) {
    alerts.push({
      id: 'hot',
      icon: Thermometer,
      title: '高温天气',
      description: `当前气温 ${temperature}°C，体感温度 ${feelsLike}°C。注意防暑防晒，多喝水，避免正午时段户外活动。`,
      level: 'warning',
      colorClass: 'text-orange-600',
      bgClass: 'bg-orange-500/10',
      borderClass: 'border-orange-200',
    });
  }

  // 寒冷提醒
  if (temperature <= 8) {
    alerts.push({
      id: 'cold',
      icon: Shirt,
      title: '天气寒冷',
      description: `气温较低（${temperature}°C），出门请添衣保暖，注意防寒。`,
      level: 'tip',
      colorClass: 'text-sky-600',
      bgClass: 'bg-sky-500/10',
      borderClass: 'border-sky-200',
    });
  }

  // 降温提醒（体感明显低于气温 3 度以上）
  if (feelsLike < temperature - 3) {
    alerts.push({
      id: 'feels-cold',
      icon: Shirt,
      title: '体感偏冷',
      description: `体感温度 ${feelsLike}°C，比实际气温低 ${Math.round(temperature - feelsLike)}°C，建议适当增添衣物。`,
      level: 'tip',
      colorClass: 'text-indigo-600',
      bgClass: 'bg-indigo-500/10',
      borderClass: 'border-indigo-200',
    });
  }

  // 大风提醒
  if (windSpeed >= 20) {
    alerts.push({
      id: 'wind',
      icon: Wind,
      title: '风力较大',
      description: `当前风速 ${windSpeed} km/h，外出请注意防风，小心高空坠物。`,
      level: 'warning',
      colorClass: 'text-cyan-600',
      bgClass: 'bg-cyan-500/10',
      borderClass: 'border-cyan-200',
    });
  }

  // 大雾提醒
  if (condition === '雾') {
    alerts.push({
      id: 'fog',
      icon: CloudFog,
      title: '大雾天气',
      description: '能见度较低，驾车请注意减速慢行，开启雾灯。',
      level: 'warning',
      colorClass: 'text-slate-600',
      bgClass: 'bg-slate-500/10',
      borderClass: 'border-slate-200',
    });
  }

  // 降雪提醒
  if (condition === '雪') {
    alerts.push({
      id: 'snow',
      icon: Snowflake,
      title: '今日有雪',
      description: '路面湿滑，出行请注意防滑和保暖，驾车请减速慢行。',
      level: 'warning',
      colorClass: 'text-sky-600',
      bgClass: 'bg-sky-500/10',
      borderClass: 'border-sky-200',
    });
  }

  // 空气质量提醒
  if (aqi >= 150) {
    const isSevere = aqi >= 200;
    alerts.push({
      id: 'aqi',
      icon: AlertTriangle,
      title: isSevere ? '空气污染严重' : '空气质量不佳',
      description: isSevere
        ? `当前 AQI ${aqi}（${aqiLevel}），应尽量减少户外活动，外出请佩戴 N95 口罩。`
        : `当前 AQI ${aqi}（${aqiLevel}），敏感人群减少户外活动，外出建议佩戴口罩。`,
      level: 'warning',
      colorClass: 'text-rose-600',
      bgClass: 'bg-rose-500/10',
      borderClass: 'border-rose-200',
    });
  }

  // 高湿度提醒
  if (humidity >= 80 && temperature >= 28) {
    alerts.push({
      id: 'humid',
      icon: Sparkles,
      title: '闷热潮湿',
      description: `湿度 ${humidity}% 偏高，体感闷热，注意通风降温，补充水分。`,
      level: 'tip',
      colorClass: 'text-teal-600',
      bgClass: 'bg-teal-500/10',
      borderClass: 'border-teal-200',
    });
  }

  // 好天气提醒（兜底）
  if (alerts.length === 0) {
    const sunnyMessages = [
      { title: '天气宜人', desc: '适合外出活动，享受好天气吧！' },
      { title: '天气不错', desc: '温度适宜，体感舒适，适合出行。' },
    ];
    const pick = sunnyMessages[Math.abs(Math.round(weather.temperature)) % sunnyMessages.length];
    alerts.push({
      id: 'nice',
      icon: Sparkles,
      title: pick.title,
      description: pick.desc,
      level: 'info',
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-200',
    });
  }

  return alerts;
}

export default function WeatherAlertSection({
  weather,
  locating,
  locationError,
  locationCity,
  onDismiss,
  onManualSelect,
  onRetryLocate,
}: WeatherAlertSectionProps) {
  const alerts = useMemo(() => (weather ? generateAlerts(weather) : []), [weather]);

  // 定位中
  if (locating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-border/40 bg-card/70 backdrop-blur-sm shadow-sm p-4"
      >
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Loader2 className="size-5 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">正在定位您的位置...</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              定位成功后将自动为您展示当地天气与生活提醒
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // 定位失败 / 未授权
  if (locationError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-amber-200 bg-amber-500/10 backdrop-blur-sm shadow-sm p-4"
      >
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-amber-800">无法获取您的位置</div>
            <div className="text-xs text-amber-700/80 mt-0.5">{locationError}</div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={onRetryLocate}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-700 hover:bg-amber-500/30 transition-colors font-medium"
              >
                <RefreshCw className="size-3" />
                重新定位
              </button>
              <button
                type="button"
                onClick={onManualSelect}
                className="text-xs px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 transition-colors font-medium border border-amber-300/40"
              >
                手动选择城市
              </button>
            </div>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="shrink-0 size-7 rounded-md flex items-center justify-center text-amber-600/60 hover:text-amber-700 hover:bg-amber-500/10 transition-colors"
              aria-label="关闭提醒"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // 无天气数据
  if (!weather) return null;

  const primaryAlert = alerts[0];
  const restAlerts = alerts.slice(1);
  const PrimaryIcon = primaryAlert.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border ${primaryAlert.borderClass} ${primaryAlert.bgClass} backdrop-blur-sm shadow-sm p-4 md:p-5`}
    >
      <div className="flex items-start gap-3 md:gap-4">
        <div
          className={`size-10 md:size-11 rounded-lg ${primaryAlert.bgClass} ${primaryAlert.colorClass} flex items-center justify-center shrink-0`}
        >
          <PrimaryIcon className="size-5 md:size-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-base md:text-lg font-semibold ${primaryAlert.colorClass}`}>
              {primaryAlert.title}
            </h3>
            {locationCity && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                {locationCity}
              </span>
            )}
          </div>
          <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
            {primaryAlert.description}
          </p>

          {/* 其他提醒标签 */}
          {restAlerts.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {restAlerts.map((a) => {
                const Icon = a.icon;
                return (
                  <span
                    key={a.id}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${a.colorClass} ${a.bgClass} border ${a.borderClass}`}
                    title={a.description}
                  >
                    <Icon className="size-3.5" />
                    {a.title}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className={`shrink-0 size-7 rounded-md flex items-center justify-center ${primaryAlert.colorClass}/60 hover:${primaryAlert.colorClass} hover:bg-white/40 transition-colors`}
            aria-label="关闭提醒"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
