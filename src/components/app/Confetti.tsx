import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';

interface ConfettiProps {
  trigger: boolean;
  duration?: number;
  particleCount?: number;
}

const COLORS = ['#4ade80', '#f59e0b', '#f43f5e', '#3b82f6', '#8b5cf6', '#06b6d4'];

const Confetti = ({ trigger, duration = 2500, particleCount = 30 }: ConfettiProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const t = setTimeout(() => setShow(false), duration);
      return () => clearTimeout(t);
    }
  }, [trigger, duration]);

  const particles = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.3,
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 80,
    })), [particleCount]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0, scale: 1 }}
              animate={{
                y: '110vh',
                x: `calc(${p.x}vw + ${p.drift}px)`,
                opacity: [1, 1, 0],
                rotate: p.rotation + 720,
                scale: [1, 1.2, 0.8],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2 + Math.random(), delay: p.delay, ease: 'easeIn' }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size * 0.6,
                backgroundColor: p.color,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

export default Confetti;
