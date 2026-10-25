import { useEffect, useRef, useState } from 'react';
import { useSpring, useTransform, motion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

/**
 * 数字滚动动效组件
 * value 变化时，数字从旧值平滑滚动到新值
 */
export default function AnimatedNumber({
  value,
  decimals = 0,
  duration = 0.6,
  className,
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const spring = useSpring(value, {
    stiffness: 80,
    damping: 20,
    duration,
  });

  const display = useTransform(spring, (v) => {
    return v.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  });

  const [displayValue, setDisplayValue] = useState(
    value.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  );

  const latestValue = useRef(value);

  useEffect(() => {
    if (value === latestValue.current) return;
    latestValue.current = value;
    spring.set(value);

    const unsubscribe = display.on('change', (v) => {
      setDisplayValue(v);
    });
    return () => unsubscribe();
  }, [value, spring, display, decimals]);

  return (
    <span className={`tabular-nums ${className ?? ''}`}>
      {prefix}
      <motion.span>{displayValue}</motion.span>
      {suffix}
    </span>
  );
}
