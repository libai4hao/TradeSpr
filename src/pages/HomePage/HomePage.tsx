import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Gem,
  Sun,
  ArrowRightLeft,
  MapPin,
  LineChart,
  Play,
  Pause,
  Clock,
  RotateCcw,
  CalendarClock,
  Rocket,
  Sparkles,
  Globe,
  FastForward,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit-lite';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import WeatherSection from './sections/WeatherSection';
import WeatherAlertSection from './sections/WeatherAlertSection';
import ExchangeSection from './sections/ExchangeSection';
import GoldSection from './sections/GoldSection';
import ForexTradingSection from './sections/ForexTradingSection';
import { generateMockWeather, type IWeather } from '@/data/weather';
import { TIMELINES } from '@/data/forex-trading';

function formatTime(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDateTimeShort(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateTimeFull(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  北京: { lat: 39.9042, lon: 116.4074 },
  上海: { lat: 31.2304, lon: 121.4737 },
  广州: { lat: 23.1291, lon: 113.2644 },
  深圳: { lat: 22.5431, lon: 114.0579 },
  杭州: { lat: 30.2741, lon: 120.1551 },
  成都: { lat: 30.5728, lon: 104.0668 },
};

function findNearestCity(lat: number, lon: number): string {
  let bestCity = '上海';
  let bestDist = Infinity;
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    const dLat = lat - coords.lat;
    const dLon = lon - coords.lon;
    const dist = dLat * dLat + dLon * dLon;
    if (dist < bestDist) {
      bestDist = dist;
      bestCity = city;
    }
  }
  return bestCity;
}

function getWeatherByCity(city: string): IWeather {
  return generateMockWeather(city, 0).weather;
}

const DEFAULT_CITY = '上海';

type TabId = 'weather' | 'exchange' | 'gold' | 'forex';

const TABS: { id: TabId; label: string; icon: typeof Sun }[] = [
  { id: 'weather', label: '天气', icon: Sun },
  { id: 'exchange', label: '汇率', icon: ArrowRightLeft },
  { id: 'gold', label: '黄金', icon: Gem },
  { id: 'forex', label: 'FX 模拟', icon: LineChart },
];

// 时光机：可选的历史节点（近期 + 年份级）
const TIME_MACHINE_NODES = [
  // { id: '1h', label: '1 小时前', offsetHours: -1, group: '近期' },
  // { id: '6h', label: '6 小时前', offsetHours: -6, group: '近期' },
  { id: '1d', label: '1 天前', offsetHours: -24, group: '近期' },
  { id: '7d', label: '7 天前', offsetHours: -168, group: '近期' },
  { id: '15d', label: '15 天前', offsetDays: -15, group: '近期' },
  { id: '1m', label: '1 个月前', offsetDays: -30, group: '近期' },
  { id: '2m', label: '2 个月前', offsetDays: -60, group: '中期' },
  { id: '3m', label: '3 个月前', offsetDays: -90, group: '中期' },
  { id: '6m', label: '半年前', offsetDays: -180, group: '中期' },
  { id: '1y', label: '1 年前', offsetDays: -365, group: '历史' },
  { id: 'y5y', label: '5 年前', offsetDays: -5 * 365, group: '历史深处' },
  { id: 'y10y', label: '10 年前', offsetDays: -10 * 365, group: '历史深处' },
  { id: 'y2020', label: '2020 年', offsetHours: -(2024 - 2020) * 365 * 24, group: '历史深处' },
  { id: 'y2015', label: '2015 年', offsetHours: -(2024 - 2015) * 365 * 24, group: '历史深处' },
  { id: 'y2015', label: '2012 年', offsetHours: -(2024 - 2012) * 365 * 24, group: '历史深处' },
  { id: 'y2010', label: '2010 年', offsetHours: -(2024 - 2010) * 365 * 24, group: '历史深处' },
  { id: 'y2006', label: '2006 年', offsetHours: -(2024 - 2006) * 365 * 24, group: '历史深处' },
];

const SPEED_OPTIONS = [
  { value: 1, label: '1x', type: 'normal' },
  { value: 2, label: '2x', type: 'normal' },
  { value: 5, label: '5x', type: 'normal' },
  { value: 10, label: '10x', type: 'normal' },
  { value: 30, label: '30x', type: 'normal' },
  { value: 60, label: '60x', type: 'normal' },
  { value: 525600, label: '一眼一年', type: 'hyper' },
  { value: 5256000, label: '一眼万年', type: 'warp' },
];

function getSpeedLabel(val: number): string {
  const opt = SPEED_OPTIONS.find((o) => o.value === val);
  return opt ? opt.label : `${val}x`;
}

function isHyperSpeed(val: number): boolean {
  return val >= 525600;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>('weather');
  const [lastUpdate, setLastUpdate] = useState(() => formatTime(new Date()));
  const [refreshing, setRefreshing] = useState(false);

  // 定位相关
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState(DEFAULT_CITY);
  const [isLocated, setIsLocated] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // FX 时间加速 & 时光机
  const [simTime, setSimTime] = useState(() => new Date(Date.now() - 7 * 86400000));
  const [speed, setSpeed] = useState(1);
  const [isRunning, setIsRunning] = useState(false); // 初始不运行
  const [simStarted, setSimStarted] = useState(false); // 是否已开始模拟
  const [initialBalance, setInitialBalance] = useState(10000);
  const [timeMachineId, setTimeMachineId] = useState('7d');
  const [timelineId, setTimelineId] = useState('current');
  const simTimeRef = useRef(simTime);
  simTimeRef.current = simTime;

  // 当前时间线对象与起止时间（current 终点=now）
  const currentTimeline = useMemo(
    () => TIMELINES.find((t) => t.id === timelineId) ?? TIMELINES[0],
    [timelineId],
  );
  const { timelineStartMs, timelineEndMs } = useMemo(() => {
    const start = new Date(currentTimeline.startYear, 0, 1).getTime();
    if (timelineId === 'current') {
      return { timelineStartMs: start, timelineEndMs: Date.now() };
    }
    return { timelineStartMs: start, timelineEndMs: start + currentTimeline.durationDays * 86400000 };
  }, [currentTimeline, timelineId]);
  const timelineProgress = useMemo(() => {
    const total = timelineEndMs - timelineStartMs;
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, ((simTime.getTime() - timelineStartMs) / total) * 100));
  }, [simTime, timelineStartMs, timelineEndMs]);

  // 当前天气
  const currentWeather = useMemo(() => getWeatherByCity(activeCity), [activeCity]);

  // 全局时间每 60s 更新
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdate(formatTime(new Date()));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // FX 模拟时间推进
  useEffect(() => {
    if (!isRunning || speed === 0 || !simStarted) return;
    const baseInterval = 2000; // 基础每 2 秒
    const tickMs = Math.max(4, baseInterval / speed);

    const timer = setInterval(() => {
      setSimTime((prev) => {
        const next = new Date(prev.getTime() + 2000); // 每 tick 模拟时间前进 2 秒真实时间 × speed
        return next;
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, [isRunning, speed]);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    setLastUpdate(formatTime(new Date()));
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  };

  const handleWeatherRefresh = () => {
    setLastUpdate(formatTime(new Date()));
  };

  const handleCityChange = useCallback((city: string) => {
    setActiveCity(city);
    setIsLocated(false);
    setLocationError(null);
    setAlertDismissed(false);
  }, []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('您的浏览器不支持定位功能');
      return;
    }
    setLocating(true);
    setLocationError(null);
    setAlertDismissed(false);

    const timeoutId = window.setTimeout(() => {
      setLocating(false);
      setLocationError('定位超时，请稍后重试或手动选择城市。');
    }, 8000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timeoutId);
        try {
          const { latitude, longitude } = position.coords;
          const city = findNearestCity(latitude, longitude);
          setActiveCity(city);
          setIsLocated(true);
          setLocationError(null);
          setLocating(false);
          logger.info('定位成功，当前城市:', city);
        } catch (err) {
          setLocationError('无法解析当前位置，请稍后重试。');
          setLocating(false);
        }
      },
      (error) => {
        window.clearTimeout(timeoutId);
        let msg = '定位失败，请稍后重试。';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = '您已拒绝定位授权，可在浏览器设置中开启后重试。';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = '位置信息不可用，请稍后重试。';
            break;
          case error.TIMEOUT:
            msg = '定位超时，请稍后重试。';
            break;
        }
        setLocationError(msg);
        setLocating(false);
        logger.warn('定位失败:', error.message);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  }, []);

  const handleDismissAlert = useCallback(() => {
    setAlertDismissed(true);
  }, []);

  const handleManualSelect = useCallback(() => {
    setLocationError(null);
    // 自动切到天气 tab 并展开
    setActiveTab('weather');
  }, []);

  const showAlert = !alertDismissed || locating || !!locationError;

  // 时光机：跳转到指定历史节点
  const handleTimeTravel = (nodeId: string) => {
    const node = TIME_MACHINE_NODES.find((n) => n.id === nodeId);
    if (!node) return;
    setTimeMachineId(nodeId);
    // 当前时间线节点（近期/中期/1年内）= current 时间线
    const currentTlIds = new Set(['1h', '6h', '1d', '7d', '15d', '1m', '2m', '3m', '6m', '1y']);
    // 历史深处节点 → 对应虚拟时间线
    const tlMap: Record<string, string> = {
      y5y: 'fx-warrior',
      y10y: 'fx-warrior',
      y2006: 'fx-warrior',
      y2010: 'trend-hunter',
      y2015: 'trend-hunter',
      y2020: 'volatility-king',
    };
    const isCurrent = currentTlIds.has(nodeId);
    const newTlId = isCurrent ? 'current' : tlMap[nodeId] ?? 'fx-warrior';

    // 计算 simTime
    if (newTlId === 'current') {
      // 当前时间线：时光机节点对应真实过去时间
      const now = new Date();
      const offsetMs = node.offsetHours
        ? node.offsetHours * 3600 * 1000
        : (node.offsetDays ?? 0) * 86400000;
      const target = new Date(now.getTime() + offsetMs);
      setSimTime(target);
    } else {
      // 虚拟时间线：从该时间线终点倒数第 7 天开始
      const tl = TIMELINES.find((t) => t.id === newTlId);
      if (tl) {
        const startDate = new Date(tl.startYear, 0, 1);
        const endDate = new Date(startDate.getTime() + tl.durationDays * 86400000);
        const sevenDaysBeforeEnd = new Date(endDate.getTime() - 7 * 86400000);
        setSimTime(sevenDaysBeforeEnd);
      }
    }

    // 联动时间线
    if (newTlId !== timelineId) {
      setTimelineId(newTlId);
    }
  };

  const handleReturnToNow = () => {
    // 回到最近的过去节点（7 天前）+ 当前时间线
    setTimeMachineId('7d');
    const now = new Date();
    setSimTime(new Date(now.getTime() - 7 * 24 * 3600 * 1000));
    if (timelineId !== 'current') {
      setTimelineId('current');
    }
  };

  const isTimeTraveling = timeMachineId !== 'now';
  const handleSkipToEnd = () => {
    const tl = TIMELINES.find((t) => t.id === timelineId);
    if (!tl) return;
    let endDate: Date;
    if (timelineId === 'current') {
      endDate = new Date();
    } else {
      const startDate = new Date(tl.startYear, 0, 1);
      endDate = new Date(startDate.getTime() + tl.durationDays * 86400000);
    }
    setSimTime(endDate);
    if (!isRunning && simStarted) setIsRunning(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-info/5">
      {/* 顶部 Header */}
      <header className="sticky top-0 z-50 w-full bg-background/70 backdrop-blur-md border-b border-border/30">
        <div className="max-w-5xl mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex items-center gap-3"
          >
            <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-warning text-primary-foreground flex items-center justify-center shadow-sm">
              <Gem className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-tight">股真人</h1>
              <p className="text-xs text-muted-foreground leading-tight">实时数据查询</p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Tab 导航 */}
      <nav className="sticky top-16 z-40 w-full bg-background/70 backdrop-blur-md border-b border-border/30">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 天气提醒横幅（只在天气 tab 且有提醒时显示） */}
        {activeTab === 'weather' && showAlert && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <WeatherAlertSection
              weather={!locating && !locationError ? currentWeather : null}
              locating={locating}
              locationError={locationError}
              locationCity={
                !locating && !locationError && isLocated ? activeCity : null
              }
              onDismiss={handleDismissAlert}
              onManualSelect={handleManualSelect}
              onRetryLocate={handleLocate}
            />
          </motion.div>
        )}

        {/* Tab 内容区 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {activeTab === 'weather' && (
              <WeatherSection
                onRefresh={handleWeatherRefresh}
                city={activeCity}
                onCityChange={handleCityChange}
                onLocate={handleLocate}
                locating={locating}
                isLocated={isLocated}
              />
            )}
            {activeTab === 'exchange' && <ExchangeSection />}
            {activeTab === 'gold' && <GoldSection />}
            {activeTab === 'forex' && (
              <div className="space-y-4">
                {/* 时间控制条 */}
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/40 bg-card/70 backdrop-blur-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">模拟时间</span>
                    {isTimeTraveling && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-200"
                      >
                        时光机模式
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm tabular-nums font-semibold ml-1">
                    {formatDateTimeFull(simTime)}
                  </div>

                  <br/>

                  <div className="ml-auto flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">时间加速</span>
                      <span className="text-sm font-semibold text-primary tabular-nums">
                        ×{getSpeedLabel(speed).replace('x', '')}
                      </span>
                    </div>

                    <div className="flex items-center bg-muted/40 rounded-md p-0.5 flex-wrap">
                      {SPEED_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => setSpeed(s.value)}
                          className={`h-7 px-2 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                            speed === s.value
                              ? s.type === 'normal'
                                ? 'bg-background text-foreground shadow-sm'
                                : s.type === 'hyper'
                                  ? 'bg-orange-500 text-white shadow-sm'
                                  : 'bg-purple-600 text-white shadow-sm'
                              : s.type === 'normal'
                                ? 'text-muted-foreground hover:text-foreground'
                                : s.type === 'hyper'
                                  ? 'text-orange-600 hover:bg-orange-500/10'
                                  : 'text-purple-600 hover:bg-purple-500/10'
                          }`}
                        >
                          {s.type === 'hyper' && <Rocket className="size-3" />}
                          {s.type === 'warp' && <Sparkles className="size-3" />}
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                   <div className="w-full space-y-2">
                     <div className="flex items-center gap-2">
                       <Clock className="size-3.5 text-muted-foreground shrink-0" />
                       <span className="text-xs text-muted-foreground">模拟起点</span>
                       {/* 本次模拟开始时间 */}
                       <span className="text-xs">{simTime ? formatDateTimeFull(simTime) : '--'}</span>
                       
                       <Select value={timeMachineId} onValueChange={handleTimeTravel}>
                         <SelectTrigger className="h-8 w-[130px] text-xs ml-auto">
                           <SelectValue placeholder="选择时间节点" />
                         </SelectTrigger>
                         <SelectContent>
                           {TIME_MACHINE_NODES.map((n) => (
                             <SelectItem key={n.id} value={n.id} className="text-xs">
                               {n.label}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>

                       {isTimeTraveling && (
                         <Button
                           variant="outline"
                           size="sm"
                           className="h-8 text-xs gap-1"
                           onClick={handleReturnToNow}
                         >
                           <RotateCcw className="size-3.5" />
                           回到现在
                         </Button>
                       )}
                     </div>
                   </div>

                    {/* 时间线选择 + 进度条 */}
                    <div className="w-full flex flex-wrap items-center gap-3 pt-2 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        <Globe className="size-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">时间线</span>
                      </div>
                      <Select
                        value={timelineId}
                        onValueChange={setTimelineId}
                        disabled={simStarted && isRunning}
                      >
                        <SelectTrigger className="h-8 w-[200px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMELINES.map((tl) => (
                            <SelectItem key={tl.id} value={tl.id} className="text-xs">
                              {tl.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                          <span>时间线进度</span>
                          <span className="tabular-nums font-medium">{timelineProgress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
                            style={{ width: `${timelineProgress}%` }}
                          />
                        </div>
                      </div>

                      {simStarted && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={handleSkipToEnd}
                        >
                          <FastForward className="size-3.5" />
                          到达终点
                        </Button>
                      )}
                    </div>
                </div>

                <ForexTradingSection
                  simTime={simTime}
                  speed={speed}
                  isRunning={isRunning}
                  isTimeTraveling={isTimeTraveling}
                  timelineId={timelineId}
                  simStarted={simStarted}
                  initialBalance={initialBalance}
                  onTimelineChange={setTimelineId}
                  onStartSimulation={() => {
                    if (!(simTime instanceof Date) || isNaN(simTime.getTime()) || simTime.getTime() === 0) {
                      import('sonner').then(({ toast }) => {
                        toast.error('模拟起点时间无效，请重新选择时间节点');
                      });
                      return;
                    }
                    setSimStarted(true);
                    setIsRunning(true);
                  }}
                  onPauseSimulation={() => setIsRunning(false)}
                  onEndSimulation={() => {
                    setIsRunning(false);
                    setSimStarted(false);
                  }}
                  onInitialBalanceChange={(val) => setInitialBalance(Math.max(100, val))}
                  onSkipToEnd={handleSkipToEnd}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <footer className="text-center text-xs text-muted-foreground pt-8 pb-4 mt-8 border-t border-border/30">
          <p>© 2024 股真人 · 数据仅供参考，不构成投资建议</p>
          <p className="mt-1">面向个人用户的轻量数据查询工具站</p>
          <p className="mt-1">外汇模拟交易使用虚拟资金，仅供学习体验</p>
          <p className="mt-2 text-[11px] text-muted-foreground/70 font-mono">股真人 v1.0.0</p>
        </footer>
      </main>
    </div>
  );
}
