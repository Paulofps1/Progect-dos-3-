import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  end: number;
  duration?: number;
  start?: number;
  decimals?: number;
  enabled?: boolean;
}

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export const useCountUp = ({ end, duration = 800, start = 0, decimals = 0, enabled = true }: UseCountUpOptions) => {
  const [value, setValue] = useState(start);
  const prevEnd = useRef(start);
  const raf = useRef<number>();

  useEffect(() => {
    if (!enabled) { setValue(end); return; }

    const from = prevEnd.current;
    const diff = end - from;
    if (diff === 0) return;

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = from + diff * eased;
      setValue(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.round(current));

      if (progress < 1) {
        raf.current = requestAnimationFrame(tick);
      } else {
        prevEnd.current = end;
      }
    };

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [end, duration, decimals, enabled]);

  return value;
};
