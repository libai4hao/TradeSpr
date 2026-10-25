import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface MiniTrendChartProps {
  data: Array<{ date: string; value: number }>;
  color: string;
  height?: number;
  up?: boolean;
}

/**
 * 迷你面积趋势图 - 卡片内使用
 * 无坐标轴、无图例，只展示趋势形态
 */
export default function MiniTrendChart({
  data,
  color,
  height = 60,
  up = true,
}: MiniTrendChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const values = data.map((d) => d.value);
    const dates = data.map((d) => d.date);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = (max - min) * 0.2;

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 0,
        textStyle: { color: '#333', fontSize: 12 },
        formatter: (params: unknown) => {
          const arr = Array.isArray(params) ? params : [];
          if (arr.length === 0) return '';
          const p = arr[0] as { name: string; value: number };
          return `${p.name}<br/>${p.value}`;
        },
      },
      grid: {
        left: 0,
        right: 0,
        top: 4,
        bottom: 0,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: dates,
        show: false,
      },
      yAxis: {
        type: 'value',
        show: false,
        min: min - pad,
        max: max + pad,
      },
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color,
            width: 1.5,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${color}30` },
                { offset: 1, color: `${color}05` },
              ],
            },
          },
        },
      ],
    };
  }, [data, color]);

  return (
    <div style={{ height }} className="w-full -mx-1">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
