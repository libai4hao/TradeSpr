import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  CloudFog,
  Droplets,
  Wind,
  Thermometer,
  MapPin,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AnimatedNumber from '@/components/AnimatedNumber';
import { WeatherSkeleton } from '@/components/Skeleton';
import { generateMockWeather, type IWeather, type IWeatherForecast } from '@/data/weather';

const WEATHER_ICONS: Record<IWeather['condition'], typeof Sun> = {
  晴: Sun,
  多云: Cloud,
  阴: Cloud,
  小雨: CloudRain,
  中雨: CloudRain,
  雷阵雨: CloudLightning,
  雪: Snowflake,
  雾: CloudFog,
};

const HOT_CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都'];

const AQI_COLORS: Record<string, string> = {
  优: 'text-emerald-600 bg-emerald-500/10 border-emerald-200',
  良: 'text-lime-600 bg-lime-500/10 border-lime-200',
  轻度污染: 'text-yellow-600 bg-yellow-500/10 border-yellow-200',
  中度污染: 'text-orange-600 bg-orange-500/10 border-orange-200',
  重度污染: 'text-rose-600 bg-rose-500/10 border-rose-200',
  严重污染: 'text-purple-600 bg-purple-500/10 border-purple-200',
};

interface WeatherSectionProps {
  onRefresh: () => void;
  city?: string;
  onCityChange?: (city: string) => void;
  defaultExpanded?: boolean;
  onLocate?: () => void;
  locating?: boolean;
  isLocated?: boolean;
}

export default function WeatherSection({
  onRefresh,
  city,
  onCityChange,
  defaultExpanded = false,
  onLocate,
  locating = false,
  isLocated = false,
}: WeatherSectionProps) {
  const [keyword, setKeyword] = useState('');
  const [internalCity, setInternalCity] = useState('上海');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const activeCity = city ?? internalCity;

  const handleCityChange = (newCity: string) => {
    setLoading(true);
    setInternalCity(newCity);
    onCityChange?.(newCity);
    window.setTimeout(() => setLoading(false), 400);
  };

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(t);
  }, []);

  const { weather, forecast } = useMemo(() => {
    return generateMockWeather(activeCity, refreshKey);
  }, [activeCity, refreshKey]);

  const WeatherIcon = WEATHER_ICONS[weather.condition] ?? Sun;
  const aqiColor = AQI_COLORS[weather.aqiLevel] ?? AQI_COLORS['良'];

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const cityName = keyword.trim();
    if (cityName) {
      handleCityChange(cityName);
      setExpanded(true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    onRefresh();
    await new Promise((r) => setTimeout(r, 500));
    setRefreshing(false);
  };

  const handleToggle = () => {
    setExpanded((e) => !e);
  };

  // 生成一句简短天气摘要
  const weatherSummary = useMemo(() => {
    const { condition, temperature, feelsLike, aqiLevel } = weather;
    const feelDiff = Math.abs(feelsLike - temperature);
    let tip = `${condition}，${temperature}°C`;
    if (feelDiff >= 3) {
      tip += feelsLike > temperature ? '，体感偏热' : '，体感偏冷';
    }
    if (aqiLevel === '重度污染' || aqiLevel === '严重污染') {
      tip += '，空气较差';
    } else if (aqiLevel === '优' || aqiLevel === '良') {
      tip += '，空气不错';
    }
    return tip;
  }, [weather]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="border-border/40 bg-card/70 backdrop-blur-sm shadow-sm overflow-hidden">
        {/* 紧凑模式：点击可展开 */}
        <button
          type="button"
          onClick={handleToggle}
          className="w-full text-left"
        >
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 md:px-5 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="size-10 md:size-11 rounded-lg bg-gradient-to-br from-primary/15 to-warning/15 text-primary flex items-center justify-center">
                <WeatherIcon className="size-5 md:size-6" strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-semibold truncate">{weather.city}</span>
                  {isLocated && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-200 shrink-0">
                      已定位
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  {loading ? (
                    <div className="h-7 w-16 bg-accent/50 rounded animate-pulse" />
                  ) : (
                    <AnimatedNumber
                      value={weather.temperature}
                      decimals={0}
                      className="text-2xl md:text-3xl font-bold tracking-tight"
                    />
                  )}
                  <span className="text-base text-muted-foreground">°C</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary border-primary/20"
                  >
                    {weather.condition}
                  </Badge>
                </div>
                {!loading && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
                    {weatherSummary}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onLocate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLocate();
                  }}
                  disabled={locating}
                  className="text-xs h-8 hidden sm:flex"
                >
                  <MapPin className="size-3.5 mr-1" />
                  {locating ? '定位中...' : '定位'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRefresh();
                }}
                aria-label="刷新天气"
                className="size-8"
              >
                <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <div className="text-muted-foreground">
                {expanded ? (
                  <ChevronUp className="size-5" />
                ) : (
                  <ChevronDown className="size-5" />
                )}
              </div>
            </div>
          </CardHeader>
        </button>

        {/* 展开详情 */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <CardContent className="space-y-4 pt-0">
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="skeleton"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <WeatherSkeleton />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      {/* 搜索框 + 热门城市 */}
                      <div className="space-y-3">
                        <form onSubmit={handleSearch} className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="search"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="输入城市名称查询天气..."
                            className="bg-background pl-9 h-10"
                          />
                        </form>
                        <div className="flex flex-wrap gap-2">
                          {HOT_CITIES.map((c) => (
                            <Badge
                              key={c}
                              variant={activeCity === c ? 'default' : 'outline'}
                              className="cursor-pointer transition-all text-xs"
                              onClick={() => handleCityChange(c)}
                            >
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* 详细指标网格 */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                        {[
                          { icon: Droplets, label: '湿度', value: `${weather.humidity}%` },
                          { icon: Wind, label: '风速', value: `${weather.windSpeed} km/h` },
                          { icon: Thermometer, label: '体感', value: `${weather.feelsLike}°C` },
                          { icon: Wind, label: '风向', value: weather.windDirection },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.label}
                              className="rounded-lg bg-muted/30 p-2.5 border border-border/20"
                            >
                              <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                                <Icon className="size-3" />
                                <span className="text-[11px]">{item.label}</span>
                              </div>
                              <div className="text-sm font-semibold tabular-nums">
                                {item.value}
                              </div>
                            </div>
                          );
                        })}
                        {/* 空气质量 */}
                        <div className="rounded-lg bg-muted/30 p-2.5 border border-border/20">
                          <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                            <Wind className="size-3" />
                            <span className="text-[11px]">空气质量</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold tabular-nums">
                              {weather.aqi}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${aqiColor}`}
                            >
                              {weather.aqiLevel}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* 未来 5 天预报 */}
                      <div>
                        <div className="flex items-center gap-1.5 text-sm font-medium mb-2">
                          <Calendar className="size-4 text-muted-foreground" />
                          <span>未来 5 天预报</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {forecast.map((day, i) => (
                            <ForecastDay key={day.date} day={day} index={i} />
                          ))}
                        </div>
                      </div>

                      <div className="text-[11px] text-muted-foreground text-right">
                        更新于 {weather.updateTime}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 移动端定位按钮（紧凑模式下在底部显示） */}
        {onLocate && !expanded && (
          <div className="sm:hidden px-4 pb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onLocate}
              disabled={locating}
              className="w-full text-xs h-8"
            >
              <MapPin className="size-3.5 mr-1.5" />
              {locating ? '正在定位当前城市...' : isLocated ? '重新定位当前城市' : '定位当前城市'}
            </Button>
          </div>
        )}
      </Card>
    </motion.section>
  );
}

function ForecastDay({ day, index }: { day: IWeatherForecast; index: number }) {
  const Icon = WEATHER_ICONS[day.condition] ?? Sun;
  const isRainy = ['小雨', '中雨', '雷阵雨'].includes(day.condition);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/20 border border-border/15"
    >
      <span className="text-[11px] font-medium">{day.dayOfWeek}</span>
      <Icon className="size-4 text-primary" strokeWidth={1.5} />
      <div className="flex items-center gap-0.5 text-[11px] tabular-nums">
        <span className="font-semibold">{Math.round(day.high)}°</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{Math.round(day.low)}°</span>
      </div>
      <div className={`text-[10px] flex items-center gap-0.5 ${isRainy ? 'text-blue-500' : 'text-muted-foreground'}`}>
        <Droplets className="size-2.5" />
        {day.precipProbability}%
      </div>
    </motion.div>
  );
}
