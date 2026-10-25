import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Gem,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AnimatedNumber from '@/components/AnimatedNumber';
import MiniTrendChart from '@/components/MiniTrendChart';
import { GoldSkeleton } from '@/components/Skeleton';
import {
  generateMockGoldPrices,
  generateMockGoldHistory,
  type IGoldPrice,
} from '@/data/gold';

function GoldCard({ price, index, historyData }: { price: IGoldPrice; index: number; historyData: Array<{ date: string; value: number }> }) {
  const isUp = price.change >= 0;
  const TrendIcon = isUp ? TrendingUp : TrendingDown;
  const trendColor = isUp ? '#e11d48' : '#059669'; // 涨红跌绿

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="rounded-xl border border-border/40 bg-card/80 p-5 hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{price.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{price.unit}</p>
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            isUp
              ? 'bg-rose-500/10 text-rose-600'
              : 'bg-emerald-500/10 text-emerald-600'
          }`}
        >
          <TrendIcon className="size-3" />
          {isUp ? '+' : ''}
          {price.changePercent.toFixed(2)}%
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-baseline gap-1.5">
          <AnimatedNumber
            value={price.price}
            decimals={2}
            className="text-3xl font-bold tracking-tight"
          />
        </div>
        <div
          className={`text-sm mt-1 tabular-nums ${
            isUp ? 'text-rose-600' : 'text-emerald-600'
          }`}
        >
          {isUp ? (
            <ArrowUp className="size-3 inline mr-0.5" />
          ) : (
            <ArrowDown className="size-3 inline mr-0.5" />
          )}
          {isUp ? '+' : ''}
          {price.change.toFixed(2)}
        </div>
      </div>

      {/* 迷你走势图 */}
      <div className="-mx-2 mb-3">
        <MiniTrendChart data={historyData} color={trendColor} height={50} up={isUp} />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/30">
        <div>
          <div className="text-[11px] text-muted-foreground">开盘</div>
          <div className="text-sm font-medium tabular-nums mt-0.5">
            {price.open.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground">最高</div>
          <div className="text-sm font-medium tabular-nums mt-0.5 text-rose-600">
            {price.high.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground">最低</div>
          <div className="text-sm font-medium tabular-nums mt-0.5 text-emerald-600">
            {price.low.toFixed(2)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function GoldSection() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 1000);
    return () => window.clearTimeout(t);
  }, []);

  const goldPrices = useMemo(() => generateMockGoldPrices(refreshKey), [refreshKey]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  const domesticGold = goldPrices.find(
    (p) => p.name === '人民币计价金价',
  ) ?? goldPrices[1];
  const internationalGold = goldPrices[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="border-border/40 bg-card/70 backdrop-blur-sm shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-lg bg-warning/15 text-warning flex items-center justify-center">
              <Gem className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">黄金价格</CardTitle>
              <p className="text-xs text-muted-foreground">多品类金价实时追踪</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} aria-label="刷新金价">
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
                <GoldSkeleton />
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
                {/* 金价走势概览条 */}
                <div className="flex flex-wrap items-center gap-4 rounded-lg bg-gradient-to-r from-warning/10 via-warning/5 to-transparent p-4 border border-warning/10">
                  <div className="flex items-center gap-2">
                    <Gem className="size-5 text-warning" />
                    <span className="text-sm font-medium">黄金市场概览</span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap ml-auto">
                    <div className="flex items-center gap-1.5">
                      <Minus className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">国内金价</span>
                      <span className="text-sm font-semibold tabular-nums">
                        ¥{domesticGold?.price.toFixed(2) ?? '--'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Minus className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">国际金价</span>
                      <span className="text-sm font-semibold tabular-nums">
                        ${internationalGold?.price.toFixed(2) ?? '--'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 金价卡片网格 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {goldPrices.map((price, i) => {
                    const historyRaw = generateMockGoldHistory(i, 30, refreshKey);
                    const historyData = historyRaw.map((p) => ({
                      date: p.date,
                      value: p.price,
                    }));
                    return (
                      <GoldCard
                        key={price.id}
                        price={price}
                        index={i}
                        historyData={historyData}
                      />
                    );
                  })}
                </div>

                <div className="text-xs text-muted-foreground text-right">
                  更新于 {goldPrices[0]?.updateTime ?? '--'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.section>
  );
}
