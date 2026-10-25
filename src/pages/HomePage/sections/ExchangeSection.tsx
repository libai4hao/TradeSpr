import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowRightLeft,
  Calculator,
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
import AnimatedNumber from '@/components/AnimatedNumber';
import MiniTrendChart from '@/components/MiniTrendChart';
import { ExchangeSkeleton } from '@/components/Skeleton';
import {
  generateMockExchangeRate,
  generateMockRateHistory,
  type IExchangeRate,
} from '@/data/exchange';

const CURRENCIES = [
  { code: 'USD', name: '美元' },
  { code: 'EUR', name: '欧元' },
  { code: 'JPY', name: '日元' },
  { code: 'GBP', name: '英镑' },
  { code: 'HKD', name: '港币' },
  { code: 'CNY', name: '人民币' },
  { code: 'AUD', name: '澳元' },
  { code: 'CAD', name: '加元' },
];

// 常用货币对（用于列表展示）
const POPULAR_PAIRS = [
  { base: 'USD', target: 'CNY' },
  { base: 'EUR', target: 'CNY' },
  { base: 'JPY', target: 'CNY' },
  { base: 'GBP', target: 'CNY' },
  { base: 'HKD', target: 'CNY' },
  { base: 'AUD', target: 'CNY' },
];

export default function ExchangeSection() {
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('CNY');
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('100');
  const [historyDays, setHistoryDays] = useState(7);

  // 初始加载骨架屏
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 900);
    return () => window.clearTimeout(t);
  }, []);

  const customRate = useMemo(
    () => generateMockExchangeRate(baseCurrency, targetCurrency, refreshKey),
    [baseCurrency, targetCurrency, refreshKey],
  );

  const historyData = useMemo(() => {
    const raw = generateMockRateHistory(baseCurrency, targetCurrency, historyDays, refreshKey);
    return raw.map((p) => ({ date: p.date, value: p.rate }));
  }, [baseCurrency, targetCurrency, historyDays, refreshKey]);

  // 常用货币对数据
  const popularRates = useMemo<IExchangeRate[]>(() => {
    return POPULAR_PAIRS.map((p, i) => {
      const r = generateMockExchangeRate(p.base, p.target, refreshKey);
      return { ...r, id: `pop-${i}` };
    });
  }, [refreshKey]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  const handleSwap = () => {
    const temp = baseCurrency;
    setBaseCurrency(targetCurrency);
    setTargetCurrency(temp);
  };

  const numAmount = parseFloat(amount) || 0;
  const convertedAmount = numAmount * customRate.rate;
  const reverseRate = 1 / customRate.rate;
  const reverseAmount = numAmount * reverseRate;

  const isUp = customRate.trend === 'up';
  const trendColor = isUp ? '#e11d48' : '#059669'; // 涨红跌绿

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="border-border/40 bg-card/70 backdrop-blur-sm shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg bg-info/10 text-info flex items-center justify-center">
              <ArrowRightLeft className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">实时汇率</CardTitle>
              <p className="text-xs text-muted-foreground">常用货币对一键查询</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} aria-label="刷新汇率">
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>

        <CardContent className="space-y-5">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ExchangeSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="space-y-5"
              >
                {/* 自定义货币对选择器 */}
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs text-muted-foreground">基础货币</label>
                    <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} · {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSwap}
                    className="mb-0.5 shrink-0"
                    aria-label="交换货币"
                  >
                    <ArrowRightLeft className="size-4" />
                  </Button>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-xs text-muted-foreground">目标货币</label>
                    <Select value={targetCurrency} onValueChange={setTargetCurrency}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.code} · {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 当前汇率大卡 + 走势小图 */}
                <div className="rounded-xl bg-gradient-to-br from-info/10 via-info/5 to-transparent p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {customRate.pair}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isUp
                          ? 'bg-rose-500/15 text-rose-600'
                          : 'bg-emerald-500/15 text-emerald-600'
                      }`}
                    >
                      {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {isUp ? '+' : ''}
                      {customRate.changePercent.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <AnimatedNumber
                      value={customRate.rate}
                      decimals={4}
                      className="text-4xl font-bold tracking-tight"
                    />
                    <span className="text-sm text-muted-foreground">
                      1 {baseCurrency} = {customRate.rate.toFixed(4)} {targetCurrency}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    涨跌额: {isUp ? '+' : ''}
                    {customRate.change.toFixed(4)}
                  </div>

                  {/* 走势小图 */}
                  <div className="mt-3 -mx-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">价格走势</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setHistoryDays(7)}
                          className={`text-[10px] px-2 py-0.5 rounded ${
                            historyDays === 7
                              ? 'bg-info/20 text-info-foreground'
                              : 'text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          7天
                        </button>
                        <button
                          onClick={() => setHistoryDays(30)}
                          className={`text-[10px] px-2 py-0.5 rounded ${
                            historyDays === 30
                              ? 'bg-info/20 text-info-foreground'
                              : 'text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          30天
                        </button>
                      </div>
                    </div>
                    <MiniTrendChart data={historyData} color={trendColor} height={64} up={isUp} />
                  </div>
                </div>

                {/* 汇率换算器 */}
                <div className="rounded-lg border border-border/40 bg-background/60 p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Calculator className="size-4 text-info" />
                    <span className="text-sm font-medium">汇率换算</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">{baseCurrency}</label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-11 pr-12 font-medium tabular-nums"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {baseCurrency}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">{targetCurrency}</label>
                      <div className="relative">
                        <Input
                          type="text"
                          readOnly
                          value={convertedAmount.toLocaleString('zh-CN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 4,
                          })}
                          className="h-11 pr-12 font-medium tabular-nums bg-muted/30"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          {targetCurrency}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    反向: {numAmount.toLocaleString()} {targetCurrency} ={' '}
                    {reverseAmount.toLocaleString('zh-CN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}{' '}
                    {baseCurrency}
                  </div>
                </div>

                {/* 常用货币对列表 */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    常用货币对
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {popularRates.map((rate, i) => {
                      const up = rate.trend === 'up';
                      return (
                        <motion.div
                          key={rate.id}
                          initial={{ opacity: 0, y: 8 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: i * 0.05 }}
                          className="flex items-center justify-between rounded-lg border border-border/40 bg-background/60 p-3 hover:bg-muted/40 transition-colors cursor-pointer"
                          onClick={() => {
                            setBaseCurrency(rate.baseCurrency);
                            setTargetCurrency(rate.targetCurrency);
                          }}
                        >
                          <div>
                            <div className="text-sm font-medium">{rate.pair}</div>
                            <div className="text-xs text-muted-foreground">
                              {rate.baseCurrency}/{rate.targetCurrency}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold tabular-nums">
                              {rate.rate.toFixed(4)}
                            </div>
                            <div
                              className={`text-xs tabular-nums flex items-center justify-end gap-0.5 ${
                                up ? 'text-rose-500' : 'text-emerald-600'
                              }`}
                            >
                              {up ? (
                                <TrendingUp className="size-3" />
                              ) : (
                                <TrendingDown className="size-3" />
                              )}
                              {up ? '+' : ''}
                              {rate.changePercent.toFixed(2)}%
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground text-right">
                  更新于 {customRate.updatedAt}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.section>
  );
}
