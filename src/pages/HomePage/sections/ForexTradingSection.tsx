import { useState, useEffect, useMemo, useRef, useCallback, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  LineChart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  History,
  Layers,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Zap,
  Trophy,
  Target,
  BarChart3,
  TrendingDown as TrendingDownIcon,
  X,
  RotateCcw,
  Globe,
  Flame,
  Swords,
  Music,
  Sparkles,
  Hourglass,
  Landmark,
  Newspaper,
  PlayCircle,
  PauseCircle,
  Banknote,
  Percent,
  FastForward,
  TrendingUp as TrendingUpIcon2,
  TrendingDown as TrendingDownIcon2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import AnimatedNumber from '@/components/AnimatedNumber';
import MiniTrendChart from '@/components/MiniTrendChart';
import {
  FOREX_PAIRS,
  TIMELINES,
  MUSIC_TRACKS,
  getInitialAccount,
  createLoan,
  calculateFloatingPnL,
  getPriceAtTime,
  generatePriceSeriesTimeline,
  generateReport,
  type IAccount,
  type IPosition,
  type IClosedTrade,
  type IForexPair,
  type ITimeline,
  type ISimulationReport,
  type IMusicTrack,
  type ILoan,
  type ITimeNews,
} from '@/data/forex-trading';

function formatDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatTimeShort(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface ForexTradingSectionProps {
  simTime: Date;
  speed: number;
  isRunning: boolean;
  isTimeTraveling?: boolean;
  timelineId: string;
  simStarted: boolean; // 模拟是否已开始（用户点击开始后为 true）
  initialBalance: number;
  onTimelineChange: (id: string) => void;
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onEndSimulation: () => void;
  onInitialBalanceChange: (val: number) => void;
  onSkipToEnd?: () => void;
}

// 时间线图标映射
const TIMELINE_ICONS: Record<string, typeof Globe> = {
  current: Globe,
  'fx-warrior': Swords,
  'trend-hunter': Target,
  'volatility-king': Flame,
  'post-covid': TrendingUp,
};

export default function ForexTradingSection({
  simTime,
  speed,
  isRunning,
  isTimeTraveling = false,
  timelineId,
  simStarted,
  initialBalance,
  onTimelineChange,
  onStartSimulation,
  onPauseSimulation,
  onEndSimulation,
  onInitialBalanceChange,
  onSkipToEnd,
}: ForexTradingSectionProps) {
  const [account, setAccount] = useState<IAccount>(getInitialAccount(initialBalance));
  const [positions, setPositions] = useState<IPosition[]>([]);
  const [history, setHistory] = useState<IClosedTrade[]>([]);

  // 贷款
  const [loans, setLoans] = useState<ILoan[]>([]);
  const [loanAmount, setLoanAmount] = useState('5000');
  const [loanRate] = useState(0.08); // 固定 8% 利率
  const [showLoanDialog, setShowLoanDialog] = useState(false);

  // 新闻
  const [displayedNews, setDisplayedNews] = useState<ITimeNews[]>([]);
  const shownNewsRef = useRef<Set<string>>(new Set());

  const [selectedPairSymbol, setSelectedPairSymbol] = useState('EUR/USD');
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('1000');
  const [activeTab, setActiveTab] = useState<'positions' | 'history' | 'reports'>('positions');

  const [prices, setPrices] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    const tl = TIMELINES.find((t) => t.id === timelineId) ?? TIMELINES[0];
    FOREX_PAIRS.forEach((p) => {
      init[p.symbol] = getPriceAtTime(p, simTime, tl);
    });
    return init;
  });

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const lastTickRef = useRef<number>(simTime.getTime());

  // 结算报告
  const [reports, setReports] = useState<ISimulationReport[]>([]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [currentReport, setCurrentReport] = useState<ISimulationReport | null>(null);
  const simStartRef = useRef<Date>(new Date());
  const realStartRef = useRef<Date>(new Date());

  // 爆仓检测
  const marginCallRef = useRef(false);

  // 音乐
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [currentMusicId, setCurrentMusicId] = useState('ambient');
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 时间线切换氛围提示
  const [moodToast, setMoodToast] = useState<{ text: string; musicName?: string; musicStyle?: string } | null>(null);

  const timeline = useMemo(
    () => TIMELINES.find((t) => t.id === timelineId) ?? TIMELINES[0],
    [timelineId],
  );

  const selectedPair = useMemo(
    () => FOREX_PAIRS.find((p) => p.symbol === selectedPairSymbol) ?? FOREX_PAIRS[0],
    [selectedPairSymbol],
  );

  const currentPrice = prices[selectedPair.symbol] ?? selectedPair.basePrice;

  // 迷你走势图
  const miniChartData = useMemo(() => {
    return generatePriceSeriesTimeline(selectedPair, 30, simTime, timeline);
  }, [selectedPair, simTime, timeline]);

  // 切换时间线时重置模拟
  useEffect(() => {
    // 重置价格
    const init: Record<string, number> = {};
    FOREX_PAIRS.forEach((p) => {
      init[p.symbol] = getPriceAtTime(p, simTime, timeline);
    });
    setPrices(init);
    lastTickRef.current = simTime.getTime();
    simStartRef.current = new Date(simTime);
    realStartRef.current = new Date();
    // 重置已显示新闻
    shownNewsRef.current = new Set();
    setDisplayedNews([]);
    // 重置贷款
    setLoans([]);
    // 重置账户
    setAccount(getInitialAccount(initialBalance));
    setPositions([]);
    setHistory([]);
    marginCallRef.current = false;
    setTimelineEnded(false);
  }, [timeline, initialBalance]); // eslint-disable-line react-hooks/exhaustive-deps

  // 贷款总览
  const loanSummary = useMemo(() => {
    const totalPrincipal = loans.reduce((s, l) => s + l.principal, 0);
    const totalRepay = loans.reduce((s, l) => s + l.totalRepay, 0);
    return { totalPrincipal, totalRepay, count: loans.length };
  }, [loans]);

  // 新闻触发：根据当前模拟时间检测新的新闻（dayOffset 相对于时间线起点）
  useEffect(() => {
    if (!simStarted || !isRunning) return;
    if (!timeline.news || timeline.news.length === 0) return;

    const dayOffset = (simTime.getTime() - timelineStartMs) / 86400000;

    const newOnes = timeline.news.filter(
      (n) => n.dayOffset <= dayOffset && !shownNewsRef.current.has(n.id),
    );

    if (newOnes.length > 0) {
      newOnes.forEach((n) => shownNewsRef.current.add(n.id));
      setDisplayedNews((prev) => [...newOnes, ...prev].slice(0, 5));
    }
  }, [simTime, timeline, simStarted, isRunning]);

  // 价格随模拟时间推进而波动
  useEffect(() => {
    const timeDiff = simTime.getTime() - lastTickRef.current;
    if (Math.abs(timeDiff) < 1000) return;
    lastTickRef.current = simTime.getTime();

    setPrices((prev) => {
      const next = { ...prev };
      FOREX_PAIRS.forEach((pair) => {
        next[pair.symbol] = getPriceAtTime(pair, simTime, timeline);
      });
      return next;
    });
  }, [simTime, timeline]);

  // 持仓浮动盈亏 + 爆仓检测
  useEffect(() => {
    if (positions.length === 0) return;

    let totalFloating = 0;
    const updated = positions.map((pos) => {
      const current = prices[pos.pair.symbol] ?? pos.currentPrice;
      const pnl = calculateFloatingPnL(
        pos.direction,
        pos.amount,
        pos.openPrice,
        current,
        pos.pair,
      );
      totalFloating += pnl;
      return { ...pos, currentPrice: current, floatingPnL: pnl };
    });

    setPositions(updated);
    const newEquity = account.balance + totalFloating;
    setAccount((prev) => ({
      ...prev,
      floatingPnL: +totalFloating.toFixed(2),
      equity: +newEquity.toFixed(2),
    }));

    // 爆仓检测：净值 ≤ 初始资金的 10% 且有持仓
    if (newEquity <= account.initialBalance * 0.1 && positions.length > 0 && !marginCallRef.current) {
      marginCallRef.current = true;
      // 强制平仓所有持仓
      handleMarginCall(updated, newEquity);
    }
  }, [prices]); // eslint-disable-line react-hooks/exhaustive-deps

  // 音乐音量控制
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 当前曲目
  const currentTrack = useMemo(
    () => MUSIC_TRACKS.find((t) => t.id === currentMusicId) ?? MUSIC_TRACKS[0],
    [currentMusicId],
  );

  // 播放指定曲目
  const playMusic = useCallback((trackId: string) => {
    const track = MUSIC_TRACKS.find((t) => t.id === trackId);
    if (!track) return;

    if (audioRef.current && currentMusicId === trackId && musicPlaying) {
      return; // 已经在播放同一首
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(track.url);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    audio
      .play()
      .then(() => {
        setMusicPlaying(true);
        setMusicEnabled(true);
        setCurrentMusicId(trackId);
      })
      .catch(() => {
        setMusicPlaying(false);
        showToast('error', '音乐播放失败，请稍后重试');
      });
  }, [currentMusicId, musicPlaying, volume]);

  const handleMusicToggle = () => {
    if (!audioRef.current) {
      playMusic(currentMusicId);
      return;
    }

    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setMusicPlaying(true))
        .catch(() => showToast('error', '音乐播放失败，请稍后重试'));
    }
  };

  // 切换音乐曲目
  const handleMusicChange = (trackId: string) => {
    if (trackId === currentMusicId) return;
    if (musicPlaying) {
      playMusic(trackId);
    } else {
      setCurrentMusicId(trackId);
    }
  };

  // 时间线切换时：只显示氛围提示 + 更新当前曲目选择，不自动播放音乐
  // 音乐必须由用户点击「开始模拟」触发（浏览器自动播放策略）
  useEffect(() => {
    if (!timeline) return;

    const track = MUSIC_TRACKS.find((t) => t.id === timeline.musicId);
    setMoodToast({
      text: timeline.musicMoodText,
      musicName: track?.name,
      musicStyle: track?.style,
    });

    // 3 秒后自动隐藏
    const t = window.setTimeout(() => setMoodToast(null), 3500);

    // 只更新曲目选择，不自动播放
    if (timeline.musicId !== currentMusicId) {
      setCurrentMusicId(timeline.musicId);
    }

    return () => window.clearTimeout(t);
  }, [timelineId]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  };

  // 申请虚拟银行贷款
  const handleApplyLoan = () => {
    const amt = parseFloat(loanAmount);
    if (!amt || amt <= 0) {
      showToast('error', '请输入有效的贷款金额');
      return;
    }
    if (amt > 100000) {
      showToast('error', '单次贷款上限 $100,000');
      return;
    }
    const loan = createLoan(amt, loanRate, simTime);
    setLoans((prev) => [...prev, loan]);
    // 贷款金额打入账户
    setAccount((prev) => ({
      ...prev,
      balance: +(prev.balance + amt).toFixed(2),
      equity: +(prev.equity + amt).toFixed(2),
    }));
    setShowLoanDialog(false);
    showToast('success', `已获得 $${amt.toLocaleString()} 虚拟银行贷款`);
  };

  const handleSubmitOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!simStarted) {
      showToast('error', '请先点击「开始模拟」再进行交易');
      return;
    }
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      showToast('error', '请输入有效的交易金额');
      return;
    }

    const price = prices[selectedPair.symbol] ?? selectedPair.basePrice;
    const decimals = selectedPair.pip >= 0.01 ? 2 : 4;

    const newPosition: IPosition = {
      id: `pos-${Date.now()}`,
      pair: selectedPair,
      direction,
      amount: numAmount,
      openPrice: +price.toFixed(decimals),
      currentPrice: +price.toFixed(decimals),
      openTime: formatDateTime(simTime),
      floatingPnL: 0,
    };

    setPositions((prev) => [...prev, newPosition]);
    showToast('success', `已${direction === 'buy' ? '买入' : '卖出'} ${numAmount} ${selectedPair.base}`);
    setAmount('1000');
  };

  // 梭哈确认弹窗
  const [showAllInConfirm, setShowAllInConfirm] = useState(false);

  // 梭哈全仓买入：用全部可用余额买入当前货币对
  const handleAllInBuy = () => {
    if (!simStarted) {
      showToast('error', '请先点击「开始模拟」再进行交易');
      return;
    }
    const price = prices[selectedPair.symbol] ?? selectedPair.basePrice;
    const decimals = selectedPair.pip >= 0.01 ? 2 : 4;
    const baseAmount = account.balance / price;
    if (baseAmount <= 0) {
      showToast('error', '可用余额不足');
      return;
    }
    const newPosition: IPosition = {
      id: `pos-${Date.now()}`,
      pair: selectedPair,
      direction: 'buy',
      amount: +baseAmount.toFixed(2),
      openPrice: +price.toFixed(decimals),
      currentPrice: +price.toFixed(decimals),
      openTime: formatDateTime(simTime),
      floatingPnL: 0,
    };
    setPositions((prev) => [...prev, newPosition]);
    showToast('success', `梭哈成功：已买入 ${baseAmount.toFixed(2)} ${selectedPair.base}`);
    setShowAllInConfirm(false);
  };

  // 梭哈全部平仓：平掉所有当前持仓
  const handleAllInSell = () => {
    if (!simStarted) {
      showToast('error', '请先点击「开始模拟」再进行交易');
      return;
    }
    if (positions.length === 0) {
      showToast('success', '当前没有持仓');
      return;
    }
    let totalPnL = 0;
    const closedList: IClosedTrade[] = positions.map((pos) => {
      totalPnL += pos.floatingPnL;
      return {
        ...pos,
        closePrice: pos.currentPrice,
        pnl: +pos.floatingPnL.toFixed(2),
        closeTime: formatDateTime(simTime),
      };
    });
    setPositions([]);
    setHistory((prev) => [...closedList, ...prev]);
    setAccount((prev) => {
      const newBalance = +(prev.balance + totalPnL).toFixed(2);
      const newRealized = +(prev.realizedPnL + totalPnL).toFixed(2);
      return {
        ...prev,
        balance: newBalance,
        realizedPnL: newRealized,
        floatingPnL: 0,
        equity: newBalance,
      };
    });
    const pnlText =
      totalPnL >= 0
        ? `+$${totalPnL.toFixed(2)}`
        : `-$${Math.abs(totalPnL).toFixed(2)}`;
    showToast(totalPnL >= 0 ? 'success' : 'error', `全部平仓完成，累计盈亏 ${pnlText}`);
    setShowAllInConfirm(false);
  };

  const handleClosePosition = (posId: string) => {
    const pos = positions.find((p) => p.id === posId);
    if (!pos) return;

    const closed: IClosedTrade = {
      ...pos,
      closePrice: pos.currentPrice,
      pnl: +pos.floatingPnL.toFixed(2),
      closeTime: formatDateTime(simTime),
    };

    setPositions((prev) => prev.filter((p) => p.id !== posId));
    setHistory((prev) => [closed, ...prev]);
    setAccount((prev) => {
      const newBalance = +(prev.balance + pos.floatingPnL).toFixed(2);
      const newRealized = +(prev.realizedPnL + pos.floatingPnL).toFixed(2);
      return {
        ...prev,
        balance: newBalance,
        realizedPnL: newRealized,
        floatingPnL: prev.floatingPnL - pos.floatingPnL,
        equity: newBalance + (prev.floatingPnL - pos.floatingPnL),
      };
    });

    const pnlText =
      pos.floatingPnL >= 0
        ? `+$${pos.floatingPnL.toFixed(2)}`
        : `-$${Math.abs(pos.floatingPnL).toFixed(2)}`;
    showToast(pos.floatingPnL >= 0 ? 'success' : 'error', `已平仓，盈亏 ${pnlText}`);
  };

  const handleMarginCall = (openPositions: IPosition[], finalEquity: number) => {
    // 强制平仓所有持仓
    const closedTrades: IClosedTrade[] = openPositions.map((pos) => ({
      ...pos,
      closePrice: pos.currentPrice,
      pnl: +pos.floatingPnL.toFixed(2),
      closeTime: formatDateTime(simTime),
    }));

    setHistory((prev) => [...closedTrades, ...prev]);
    setPositions([]);

    setAccount((prev) => {
      const newBalance = +finalEquity.toFixed(2);
      return {
        ...prev,
        balance: newBalance,
        realizedPnL: newBalance - prev.initialBalance,
        floatingPnL: 0,
        equity: newBalance,
      };
    });

    // 生成爆仓报告
    setTimeout(() => {
      const report = generateReport(
        account,
        [...closedTrades, ...history],
        realStartRef.current,
        new Date(),
        simStartRef.current,
        simTime,
        timeline,
        'margin_call',
      );
      setCurrentReport(report);
      setReports((prev) => [report, ...prev]);
      setReportDialogOpen(true);
    }, 500);

    showToast('error', '⚠️ 账户已爆仓，所有持仓被强制平仓');
  };

  const handleEndSimulation = () => {
    endSimulation('manual');
  };

  const endSimulation = (reason: 'manual' | 'margin_call' | 'timeline_end') => {
    const finalAccount = { ...account };
    const report = generateReport(
      finalAccount,
      history,
      realStartRef.current,
      new Date(),
      simStartRef.current,
      simTime,
      timeline,
      reason === 'timeline_end' ? 'manual' : reason,
    );
    setCurrentReport(report);
    setReports((prev) => [report, ...prev]);
    setReportDialogOpen(true);
    setTimelineEnded(reason === 'timeline_end');
    if (reason === 'timeline_end' && timeline.id !== 'current') {
      showToast('success', `${timeline.name} 已结束，回到现实吧！`);
    }
    onEndSimulation();
    stopMusic();
  };

  const [timelineEnded, setTimelineEnded] = useState(false);

  // 时间线起止时间：current 时间线终点为当前真实时间，起点仍为 timeline.startYear 年初
  const { timelineStartMs, timelineEndMs } = useMemo(() => {
    const start = new Date(timeline.startYear, 0, 1).getTime();
    if (timeline.id === 'current') {
      return {
        timelineStartMs: start,
        timelineEndMs: Date.now(),
      };
    }
    return {
      timelineStartMs: start,
      timelineEndMs: start + timeline.durationDays * 86400000,
    };
  }, [timeline]);

  // 时间线进度：当前 simTime 在整条时间线中的百分比位置
  const timelineProgress = useMemo(() => {
    const tlTotalMs = timelineEndMs - timelineStartMs;
    const elapsedFromStart = simTime.getTime() - timelineStartMs;
    return Math.min(100, Math.max(0, (elapsedFromStart / tlTotalMs) * 100));
  }, [simTime, timelineStartMs, timelineEndMs]);

  // 时间线结束检测：到达末尾自动结束模拟
  useEffect(() => {
    if (!simStarted || !isRunning || timelineEnded) return;
    if (simTime.getTime() >= timelineEndMs) {
      endSimulation('timeline_end');
    }
  }, [simTime, timelineEndMs, simStarted, isRunning, timelineEnded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartSimulation = () => {
    onStartSimulation();
    // 用户点击手势后播放音乐（满足浏览器自动播放策略）
    if (!musicPlaying && musicEnabled) {
      playMusic(currentMusicId);
    } else if (!musicEnabled) {
      playMusic(currentMusicId);
    }
  };

  // 停止音乐并清理 audio
  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setMusicPlaying(false);
  }, []);

  // 到达终点：直接跳到时间线末尾并结束
  const handleSkipToEnd = () => {
    onSkipToEnd?.();
  };

  const handleNewSimulation = () => {
    setAccount(getInitialAccount());
    setPositions([]);
    setHistory([]);
    setCurrentReport(null);
    setReportDialogOpen(false);
    setActiveTab('positions');
    marginCallRef.current = false;
    simStartRef.current = new Date(simTime);
    realStartRef.current = new Date();
    showToast('success', '新一轮模拟已开始');
  };

  const handleReset = () => {
    setAccount(getInitialAccount());
    setPositions([]);
    setHistory([]);
    marginCallRef.current = false;
    setTimelineEnded(false);
    stopMusic();
    simStartRef.current = new Date(simTime);
    realStartRef.current = new Date();
    showToast('success', '账户已重置');
  };

  const profitPct = ((account.equity - account.initialBalance) / account.initialBalance) * 100;
  const isProfit = account.equity >= account.initialBalance;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative space-y-4"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-28 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-500 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="size-4" />
            ) : (
              <AlertTriangle className="size-4" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 时间线氛围提示 */}
      <AnimatePresence>
        {moodToast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-28 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-xl shadow-lg bg-gradient-to-r from-primary/15 via-background to-accent/20 border border-primary/20 backdrop-blur-md max-w-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {moodToast.text}
              </span>
            </div>
            {moodToast.musicName && (
              <div className="text-xs text-muted-foreground pl-6">
                🎵 {moodToast.musicName} · {moodToast.musicStyle}
                {!musicEnabled && '（点击音乐按钮开启沉浸体验）'}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 时间线信息大卡片 + 开始模拟 */}
      <Card className="border-border/40 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className={`px-5 py-4 border-b border-border/30 ${
          timeline.id === 'now' ? 'bg-gradient-to-r from-accent/50 to-background' : 'bg-gradient-to-r from-primary/10 via-primary/5 to-background'
        }`}>
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`size-11 rounded-lg flex items-center justify-center shrink-0 ${
                timeline.id === 'now' ? 'bg-accent text-accent-foreground' : 'bg-primary/20 text-primary'
              }`}>
                {(() => {
                  const Icon = TIMELINE_ICONS[timeline.id] ?? Globe;
                  return <Icon className="size-5" />;
                })()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">{timeline.name}</h3>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {timeline.regime === 'ranging' && '震荡'}
                    {timeline.regime === 'trending' && '趋势'}
                    {timeline.regime === 'volatile' && '高波动'}
                    {timeline.regime === 'crisis' && '危机'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                  {timeline.description}
                </p>
                {isTimeTraveling && !simStarted && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-purple-700 bg-purple-500/10 border border-purple-500/20 rounded-md px-2 py-0.5 w-fit">
                    <Clock className="size-3" />
                    <span>默认起点为该时间线倒数第 7 天</span>
                  </div>
                )}
              </div>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {/* 模拟未开始：展示初始资金设置 + 开始按钮 */}
              {!simStarted ? (
                <>
                  <div className="flex items-center gap-2 bg-background/80 rounded-lg border border-border/40 px-3 py-1.5">
                    <Banknote className="size-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">初始资金</span>
                    <span className="text-xs font-semibold text-foreground">$</span>
                    <Input
                      type="number"
                      value={initialBalance}
                      onChange={(e) => onInitialBalanceChange(parseFloat(e.target.value) || 1000)}
                      className="h-7 w-28 text-xs font-semibold tabular-nums border-0 p-0 focus-visible:ring-0 text-right"
                      min={100}
                      step={1000}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-9 gap-1.5 px-4"
                    onClick={handleStartSimulation}
                  >
                    <PlayCircle className="size-4" />
                    开始模拟
                  </Button>
                </>
              ) : (
                <>
                  {/* 贷款按钮 */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => setShowLoanDialog(true)}
                  >
                    <Landmark className="size-3.5" />
                    虚拟银行贷款
                    {loanSummary.count > 0 && (
                      <Badge variant="secondary" className="h-4 text-[10px] ml-1">
                        {loanSummary.count}笔
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant={isRunning ? 'secondary' : 'default'}
                    size="sm"
                    className="h-8 gap-1"
                    onClick={isRunning ? onPauseSimulation : handleStartSimulation}
                  >
                    {isRunning ? (
                      <><PauseCircle className="size-3.5" /> 暂停</>
                    ) : (
                      <><PlayCircle className="size-3.5" /> 继续</>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 音乐控制 + 操作按钮 */}
        <CardContent className="py-3 px-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Music className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">沉浸音乐</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* 音乐控制：点击展开音乐面板 */}
            <div className="relative">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleMusicToggle}
                  aria-label={musicPlaying ? '暂停音乐' : '播放音乐'}
                  title={musicPlaying ? '暂停音乐' : '播放沉浸音乐'}
                >
                  {musicPlaying ? (
                    <Volume2 className="size-4 text-primary" />
                  ) : (
                    <VolumeX className="size-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  variant={showMusicPanel ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setShowMusicPanel((v) => !v)}
                >
                  <Music className="size-3.5" />
                  <span className="hidden sm:inline max-w-[80px] truncate">
                    {currentTrack.name}
                  </span>
                </Button>
              </div>

              {/* 音乐选择面板 */}
              <AnimatePresence>
                {showMusicPanel && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-9 z-30 w-64 rounded-lg border border-border/40 bg-card shadow-lg p-2"
                  >
                    <div className="text-[11px] font-medium text-muted-foreground px-2 py-1.5 border-b border-border/30 mb-1">
                      选择背景音乐
                    </div>
                    <div className="space-y-0.5 max-h-64 overflow-y-auto">
                      {MUSIC_TRACKS.map((track) => (
                        <button
                          key={track.id}
                          onClick={() => handleMusicChange(track.id)}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors ${
                            currentMusicId === track.id
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted/50 text-foreground'
                          }`}
                        >
                          {currentMusicId === track.id && musicPlaying ? (
                            <div className="flex items-end gap-0.5 h-3">
                              <span className="w-0.5 bg-primary animate-pulse" style={{ height: '40%' }} />
                              <span className="w-0.5 bg-primary animate-pulse" style={{ height: '80%', animationDelay: '0.1s' }} />
                              <span className="w-0.5 bg-primary animate-pulse" style={{ height: '60%', animationDelay: '0.2s' }} />
                            </div>
                          ) : (
                            <Play className="size-3 text-muted-foreground/50" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{track.name}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {track.style}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {/* 音量 */}
                    <div className="border-t border-border/30 mt-2 pt-2 px-2">
                      <div className="flex items-center gap-2">
                        <Volume1 className="size-3 text-muted-foreground" />
                        <Slider
                          value={[volume * 100]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(v) => setVolume(v[0] / 100)}
                        />
                      </div>
                    </div>
                    {!musicEnabled && (
                      <p className="text-[10px] text-muted-foreground text-center px-2 pt-2 pb-1">
                        点击左侧播放按钮开启音乐，获得沉浸体验
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={handleEndSimulation}
              disabled={!simStarted}
              title={simStarted ? '结束模拟并生成结算报告' : '请先点击「开始模拟」'}
            >
              <Trophy className="size-3.5" />
              结束模拟
            </Button>
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
        </CardContent>

        {/* 分隔：交易区开始 */}
        <div className="border-t border-border/30">
          {/* 账户概览 */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-background to-cyan-500/5 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Wallet className="size-4 text-emerald-600" />
                <span className="text-sm font-medium">账户概览</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    isProfit
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                      : 'bg-rose-500/10 text-rose-600 border-rose-200'
                  }`}
                >
                  {isProfit ? '+' : ''}
                  {profitPct.toFixed(2)}%
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                初始资金 ${account.initialBalance.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <AccountStat label="账户净值" value={account.equity} accent large />
              <AccountStat label="可用余额" value={account.balance} />
              <AccountStat label="浮动盈亏" value={account.floatingPnL} isPnL />
              <AccountStat label="已实现盈亏" value={account.realizedPnL} isPnL />
            </div>

            {/* 贷款信息 */}
            {loanSummary.count > 0 && (
              <div className="mt-3 pt-3 border-t border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <Landmark className="size-3.5 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">虚拟银行贷款 · {loanSummary.count} 笔</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <div className="text-[11px] text-muted-foreground">贷款本金</div>
                    <div className="text-sm font-semibold tabular-nums text-amber-700">
                      ${loanSummary.totalPrincipal.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground">应还总额</div>
                    <div className="text-sm font-semibold tabular-nums text-rose-600">
                      ${loanSummary.totalRepay.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground">利率</div>
                    <div className="text-sm font-semibold tabular-nums text-muted-foreground">
                      {(loanRate * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 下单区 + 持仓/历史/报告 tab */}
          <div className="px-5 pb-5 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              {/* 下单面板 */}
              <div className="lg:col-span-2 space-y-3">
                <div className="text-sm font-medium">快速下单</div>

                {/* 货币对选择 + 迷你图 */}
                <div className="rounded-lg border border-border/40 bg-background/60 p-3 space-y-2">
                  <Select
                    value={selectedPairSymbol}
                    onValueChange={setSelectedPairSymbol}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FOREX_PAIRS.map((p) => (
                        <SelectItem key={p.symbol} value={p.symbol}>
                          {p.symbol} · {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold tabular-nums">
                      {currentPrice.toFixed(selectedPair.pip >= 0.01 ? 2 : 4)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      1 {selectedPair.base} ={' '}
                      {currentPrice.toFixed(selectedPair.pip >= 0.01 ? 2 : 4)}{' '}
                      {selectedPair.quote}
                    </div>
                  </div>
                  <MiniTrendChart
                    data={miniChartData}
                    color={isProfit ? '#059669' : '#e11d48'}
                    height={48}
                  />
                </div>

                <form onSubmit={handleSubmitOrder} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDirection('buy')}
                      className={`h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-all ${
                        direction === 'buy'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-muted/40 text-emerald-600 hover:bg-emerald-500/10'
                      }`}
                    >
                      <ArrowUpRight className="size-4" />
                      买入
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection('sell')}
                      className={`h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-all ${
                        direction === 'sell'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-muted/40 text-rose-600 hover:bg-rose-500/10'
                      }`}
                    >
                      <ArrowDownRight className="size-4" />
                      卖出
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">
                        交易金额（{selectedPair.base}）
                      </label>
                      <div className="flex gap-1">
                        {[100, 500, 1000, 5000].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setAmount(String(v))}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 hover:bg-muted text-muted-foreground"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-10 pr-12 font-medium tabular-nums"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {selectedPair.base}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>
                      {direction === 'buy' ? '做多' : '做空'} {amount}{' '}
                      {selectedPair.base}
                    </span>
                    <span className="text-foreground/70">
                      约 ${(parseFloat(amount) || 0).toLocaleString()} 等值
                    </span>
                  </div>

                  {/* 梭哈快捷操作 */}
                  <button
                    type="button"
                    disabled={!simStarted}
                    onClick={() => setShowAllInConfirm(true)}
                    className={`w-full h-9 text-xs font-semibold rounded-lg border transition-all mb-2 ${
                      !simStarted
                        ? 'opacity-50 cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground'
                        : direction === 'buy'
                          ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 hover:bg-emerald-500/10'
                          : 'border-rose-500/30 bg-rose-500/5 text-rose-700 hover:bg-rose-500/10'
                    }`}
                  >
                    {!simStarted
                      ? '请先开始模拟'
                      : direction === 'buy'
                        ? `🔥 梭哈 · 全仓买入（可用 $${account.balance.toFixed(2)}）`
                        : `🔥 梭哈 · 全部平仓（${positions.length} 笔持仓）`}
                  </button>

                  <Button
                    type="submit"
                    disabled={!simStarted}
                    className={`w-full h-11 font-semibold ${
                      direction === 'buy'
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-rose-500 hover:bg-rose-600'
                    }`}
                  >
                    {simStarted
                      ? `${direction === 'buy' ? '买入' : '卖出'} ${selectedPair.base}`
                      : '请先开始模拟'}
                  </Button>
                </form>
              </div>

              {/* 持仓 & 历史 & 报告 */}
              <div className="lg:col-span-3">
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                >
                  <TabsList className="w-full h-9">
                    <TabsTrigger value="positions" className="flex-1 text-xs">
                      <Layers className="size-3.5 mr-1" />
                      持仓 ({positions.length})
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex-1 text-xs">
                      <History className="size-3.5 mr-1" />
                      历史 ({history.length})
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex-1 text-xs">
                      <Trophy className="size-3.5 mr-1" />
                      战报 ({reports.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="positions" className="mt-3 space-y-2">
                    {positions.length === 0 ? (
                      <EmptyState
                        icon={<Layers className="size-8 text-muted-foreground/40" />}
                        title="暂无持仓"
                        desc="选择货币对和方向，开启第一笔模拟交易"
                      />
                    ) : (
                      positions.map((pos) => (
                        <PositionRow
                          key={pos.id}
                          position={pos}
                          onClose={() => handleClosePosition(pos.id)}
                        />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="mt-3 space-y-2">
                    {history.length === 0 ? (
                      <EmptyState
                        icon={<History className="size-8 text-muted-foreground/40" />}
                        title="暂无交易历史"
                        desc="平仓后的交易将显示在这里"
                      />
                    ) : (
                      history.map((trade) => (
                        <HistoryRow key={trade.id} trade={trade} />
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="reports" className="mt-3 space-y-2">
                    {reports.length === 0 ? (
                      <EmptyState
                        icon={<Trophy className="size-8 text-muted-foreground/40" />}
                        title="暂无战报"
                        desc="结束模拟后生成结算报告，记录你的交易成绩"
                      />
                    ) : (
                      reports.map((report) => (
                        <ReportCard
                          key={report.id}
                          report={report}
                          onView={() => {
                            setCurrentReport(report);
                            setReportDialogOpen(true);
                          }}
                        />
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 市场新闻面板 */}
      <Card className="border-border/40 bg-card/80 backdrop-blur-sm shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 flex items-center justify-center">
              <Newspaper className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">市场快讯</CardTitle>
              <p className="text-xs text-muted-foreground">
                随模拟时间推进，大事件实时推送
              </p>
            </div>
          </div>
          {displayedNews.length > 0 && (
            <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-200 bg-amber-50">
              {displayedNews.length} 条快讯
            </Badge>
          )}
        </CardHeader>
        <CardContent className="pt-2">
          {displayedNews.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              {simStarted ? (
                <>
                  <Newspaper className="size-8 mx-auto mb-2 opacity-30" />
                  暂无重大新闻，市场保持平静...
                </>
              ) : (
                <>开始模拟后，大事件将随时间推进陆续推送</>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {displayedNews.map((news, idx) => (
                <motion.div
                  key={news.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-3 rounded-lg border text-xs ${
                    news.impact === 'bullish'
                      ? 'bg-emerald-500/5 border-emerald-200/50'
                      : news.impact === 'bearish'
                        ? 'bg-rose-500/5 border-rose-200/50'
                        : 'bg-muted/30 border-border/40'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`shrink-0 mt-0.5 ${
                      news.impact === 'bullish' ? 'text-emerald-600' :
                      news.impact === 'bearish' ? 'text-rose-600' : 'text-muted-foreground'
                    }`}>
                      {news.impact === 'bullish' && <TrendingUpIcon2 className="size-4" />}
                      {news.impact === 'bearish' && <TrendingDownIcon2 className="size-4" />}
                      {news.impact === 'neutral' && <Zap className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm">
                        {news.headline}
                      </div>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        {news.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="text-amber-600">📡 {news.source}</span>
                        <span>·</span>
                        <span>第 {news.dayOffset} 天</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 风险提示 */}
      <div className="rounded-lg border border-amber-200/60 bg-amber-500/5 px-4 py-3 flex items-start gap-3">
        <div className="size-8 shrink-0 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
          <AlertTriangle className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-amber-800">风险提示</div>
          <p className="text-xs text-amber-700/80 mt-0.5 leading-relaxed">
            此模拟纯属娱乐，不真实不准确，不作为任何投资决策依据。
            外汇交易存在高风险，真实交易请务必谨慎决策、量力而行。
          </p>
        </div>
      </div>

      {/* 梭哈确认弹窗 */}
      <Dialog open={showAllInConfirm} onOpenChange={setShowAllInConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="size-5 text-orange-600" />
              确认梭哈操作
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {direction === 'buy' ? (
              <>
                <p className="text-sm text-foreground">
                  将使用账户<strong>全部可用余额</strong>一次性买入{' '}
                  <span className="font-semibold">{selectedPair.base}/{selectedPair.quote}</span>。
                </p>
                <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">可用余额</span>
                    <span className="font-semibold tabular-nums">${account.balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">当前价格</span>
                    <span className="tabular-nums">
                      {(prices[selectedPair.symbol] ?? selectedPair.basePrice).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-border/40">
                    <span className="text-muted-foreground">预计买入</span>
                    <span className="font-semibold text-emerald-700 tabular-nums">
                      {(account.balance / (prices[selectedPair.symbol] ?? selectedPair.basePrice)).toFixed(2)}{' '}
                      {selectedPair.base}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-destructive flex items-start gap-1.5">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  梭哈有风险，全仓买入后价格波动将直接影响全部资金，请谨慎操作。
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-foreground">
                  将一次性<strong>平掉全部持仓</strong>（{positions.length} 笔），立即结算所有浮动盈亏。
                </p>
                <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">持仓数量</span>
                    <span className="font-semibold tabular-nums">{positions.length} 笔</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-border/40">
                    <span className="text-muted-foreground">预计浮动盈亏</span>
                    <span
                      className={`font-semibold tabular-nums ${
                        account.floatingPnL >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {account.floatingPnL >= 0 ? '+' : ''}${account.floatingPnL.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  平仓后所有持仓将转入历史记录，盈亏计入已实现损益。
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="flex-1">
                取消
              </Button>
            </DialogClose>
            <Button
              className={`flex-1 ${
                direction === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
              }`}
              onClick={direction === 'buy' ? handleAllInBuy : handleAllInSell}
            >
              确认{direction === 'buy' ? '全仓买入' : '全部平仓'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 贷款申请弹窗 */}
      <Dialog open={showLoanDialog} onOpenChange={setShowLoanDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="size-5 text-amber-600" />
              虚拟银行贷款
            </DialogTitle>
            <DialogDescription>
              申请虚拟银行贷款，增加可用交易资金。贷款有利息，到期需归还本金 + 利息。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">贷款金额（美元）</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="pl-7"
                  min={100}
                  max={100000}
                  step={1000}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[1000, 5000, 10000, 25000, 50000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setLoanAmount(String(v))}
                    className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                      loanAmount === String(v)
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'border-border/40 hover:bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    ${v.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-amber-500/5 border border-amber-200/50 p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">贷款本金</span>
                <span className="font-medium tabular-nums">${parseFloat(loanAmount || '0').toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">年利率</span>
                <span className="font-medium tabular-nums">{(loanRate * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between border-t border-amber-200/40 pt-2">
                <span className="text-muted-foreground">应还总额</span>
                <span className="font-semibold text-rose-600 tabular-nums">
                  ${(parseFloat(loanAmount || '0') * (1 + loanRate)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowLoanDialog(false)}>
              取消
            </Button>
            <Button size="sm" onClick={handleApplyLoan}>
              确认申请
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 结算报告弹窗 */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {currentReport && (
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="size-5 text-primary" />
                模拟结算报告
              </DialogTitle>
              <DialogDescription>
                {currentReport.reason === 'margin_call'
                  ? '账户已爆仓，模拟被迫结束'
                  : timelineEnded
                    ? '虚拟时间线已经结束，回到现实 🎬'
                    : '本轮模拟已结束'}
              </DialogDescription>
            </DialogHeader>
          )}
          {currentReport && <ReportDetail report={currentReport} />}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setReportDialogOpen(false)}
              className="flex-1"
            >
              关闭
            </Button>
            <Button onClick={handleNewSimulation} className="flex-1">
              <RotateCcw className="size-4 mr-1.5" />
              新一轮模拟
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}

function AccountStat({
  label,
  value,
  isPnL = false,
  accent = false,
  large = false,
}: {
  label: string;
  value: number;
  isPnL?: boolean;
  accent?: boolean;
  large?: boolean;
}) {
  const positive = value >= 0;
  return (
    <div>
      <div className="text-[11px] text-muted-foreground mb-0.5">{label}</div>
      <div
        className={`font-semibold tabular-nums ${
          large ? 'text-xl' : 'text-base'
        } ${
          isPnL
            ? positive
              ? 'text-emerald-600'
              : 'text-rose-500'
            : accent
              ? 'text-foreground'
              : 'text-foreground'
        }`}
      >
        {isPnL && positive ? '+' : ''}
        <AnimatedNumber value={value} decimals={2} prefix="$" />
      </div>
    </div>
  );
}

function PositionRow({
  position,
  onClose,
}: {
  position: IPosition;
  onClose: () => void;
}) {
  const isProfit = position.floatingPnL >= 0;
  const decimals = position.pair.pip >= 0.01 ? 2 : 4;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-lg border border-border/40 bg-background/60 p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-[10px] ${
              position.direction === 'buy'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                : 'bg-rose-500/10 text-rose-600 border-rose-200'
            }`}
          >
            {position.direction === 'buy' ? (
              <ArrowUpRight className="size-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="size-3 mr-0.5" />
            )}
            {position.direction === 'buy' ? '买入' : '卖出'}
          </Badge>
          <span className="text-sm font-semibold">{position.pair.symbol}</span>
          <span className="text-xs text-muted-foreground">
            {position.amount.toLocaleString()} {position.pair.base}
          </span>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onClose}>
          平仓
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground">开仓价</div>
          <div className="font-medium tabular-nums">
            {position.openPrice.toFixed(decimals)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">现价</div>
          <div className="font-medium tabular-nums">
            {position.currentPrice.toFixed(decimals)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">
            <Clock className="size-3 inline mr-0.5" />
            开仓时间
          </div>
          <div className="font-medium tabular-nums">{position.openTime}</div>
        </div>
        <div className="text-right">
          <div className="text-muted-foreground">浮动盈亏</div>
          <div
            className={`font-semibold tabular-nums ${
              isProfit ? 'text-emerald-600' : 'text-rose-500'
            }`}
          >
            {isProfit ? '+' : ''}${position.floatingPnL.toFixed(2)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HistoryRow({ trade }: { trade: IClosedTrade }) {
  const isProfit = trade.pnl >= 0;
  const decimals = trade.pair.pip >= 0.01 ? 2 : 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border/30 bg-muted/20 p-3"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-[10px] ${
              trade.direction === 'buy'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
                : 'bg-rose-500/10 text-rose-600 border-rose-200'
            }`}
          >
            {trade.direction === 'buy' ? '买入' : '卖出'}
          </Badge>
          <span className="text-sm font-medium">{trade.pair.symbol}</span>
          <span className="text-xs text-muted-foreground">
            {trade.amount.toLocaleString()} {trade.pair.base}
          </span>
        </div>
        <div
          className={`text-sm font-semibold tabular-nums ${
            isProfit ? 'text-emerald-600' : 'text-rose-500'
          }`}
        >
          {isProfit ? '+' : ''}${trade.pnl.toFixed(2)}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div>
          开:{' '}
          <span className="text-foreground font-medium tabular-nums">
            {trade.openPrice.toFixed(decimals)}
          </span>
        </div>
        <div>
          平:{' '}
          <span className="text-foreground font-medium tabular-nums">
            {trade.closePrice.toFixed(decimals)}
          </span>
        </div>
        <div className="text-right">
          <Clock className="size-3 inline mr-0.5" />
          {trade.closeTime}
        </div>
      </div>
    </motion.div>
  );
}

function ReportCard({
  report,
  onView,
}: {
  report: ISimulationReport;
  onView: () => void;
}) {
  const isProfit = report.totalPnL >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border/30 bg-background/60 p-3 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy
            className={`size-4 ${
              isProfit ? 'text-emerald-600' : 'text-rose-500'
            }`}
          />
          <div>
            <div className="text-sm font-medium">{report.timeline}</div>
            <div className="text-[11px] text-muted-foreground">
              {report.simStartTime} ~ {report.simEndTime}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div
              className={`text-sm font-bold tabular-nums ${
                isProfit ? 'text-emerald-600' : 'text-rose-500'
              }`}
            >
              {isProfit ? '+' : ''}
              {report.totalReturn.toFixed(2)}%
            </div>
            <div className="text-[10px] text-muted-foreground">
              {report.totalTrades} 笔交易
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onView}
          >
            详情
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function calcDuration(startStr: string, endStr: string): string {
  const s = new Date(startStr.replace(' ', 'T')).getTime();
  const e = new Date(endStr.replace(' ', 'T')).getTime();
  const diffMin = Math.max(1, Math.round((e - s) / 60000));
  if (diffMin < 60) return `${diffMin} 分钟`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
}

function ReportDetail({ report }: { report: ISimulationReport }) {
  const isProfit = report.totalPnL >= 0;
  return (
    <div className="space-y-4 mt-2">
      {/* 结果摘要 */}
      <div
        className={`rounded-xl p-5 text-center ${
          isProfit
            ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5'
            : 'bg-gradient-to-br from-rose-500/20 to-rose-500/5'
        }`}
      >
        <div className="text-sm text-muted-foreground mb-1">
          {report.reason === 'margin_call' ? '爆仓结束' : '模拟结束'}
        </div>
        <div
          className={`text-4xl font-bold tabular-nums ${
            isProfit ? 'text-emerald-600' : 'text-rose-500'
          }`}
        >
          {isProfit ? '+' : ''}
          {report.totalReturn.toFixed(2)}%
        </div>
        <div className="text-sm mt-1 text-muted-foreground">
          {isProfit ? '盈利' : '亏损'} ${Math.abs(report.totalPnL).toFixed(2)}
        </div>
      </div>

      <Separator />

      {/* 详细数据 */}
      <div className="grid grid-cols-2 gap-3">
        <StatItem
          icon={<Wallet className="size-4" />}
          label="初始资金"
          value={`$${report.initialBalance.toLocaleString()}`}
        />
        <StatItem
          icon={<BarChart3 className="size-4" />}
          label="最终净值"
          value={`$${report.finalEquity.toFixed(2)}`}
        />
        <StatItem
          icon={<Target className="size-4" />}
          label="交易笔数"
          value={`${report.totalTrades} 笔`}
        />
        <StatItem
          icon={<TrendingUp className="size-4 text-emerald-600" />}
          label="胜率"
          value={`${report.winRate.toFixed(1)}%`}
        />
        <StatItem
          icon={<CheckCircle className="size-4 text-emerald-600" />}
          label="盈利 / 亏损"
          value={`${report.winningTrades} / ${report.losingTrades}`}
        />
        <StatItem
          icon={<TrendingDownIcon className="size-4 text-rose-500" />}
          label="最大回撤"
          value={`${report.maxDrawdown.toFixed(2)}%`}
        />
      </div>

      <Separator />

      {/* 真实墙钟时间（单独一行） */}
      <div className="rounded-lg bg-muted/30 p-3">
        <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
          <Clock className="size-4" />
          <span className="text-xs">真实耗时</span>
        </div>
        <div className="text-sm font-medium tabular-nums">
          {report.startTime} → {report.endTime.split(' ')[1]}
          <span className="text-muted-foreground ml-2 font-normal text-xs">
            （共 {calcDuration(report.startTime, report.endTime)}）
          </span>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-muted-foreground">时间线</div>
          <div className="font-medium mt-0.5">{report.timeline}</div>
        </div>
        <div>
          <div className="text-muted-foreground">模拟时长跨度</div>
          <div className="font-medium mt-0.5 tabular-nums">
            {report.simStartTime} ~ {report.simEndTime.split(' ')[1]}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      {icon}
      <div className="text-sm font-medium text-foreground mt-3">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </div>
  );
}
