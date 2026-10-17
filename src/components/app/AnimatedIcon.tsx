import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnimatedIconProps {
  id: string;
  icon: LucideIcon;
  isActive: boolean;
  className: string;
  strokeWidth: number;
}

const animationMap: Record<string, import('framer-motion').TargetAndTransition> = {
  home: { y: [0, -5, 0] },
  meals: { rotate: [0, -15, 15, -10, 0] },
  meal: { rotate: [0, 20, -20, 0] },
  diets: { rotate: [0, -8, 8, -4, 0] },
  recipes: { y: [0, -4, 0], rotate: [0, 5, -5, 0] },
  water: { scale: [1, 1.3, 1], y: [0, -3, 0] },
  workouts: { y: [0, -6, 0, -3, 0] },
  progress: { y: [0, -4, 0], x: [0, 2, 0] },
  measurements: { scaleX: [1, 1.15, 1] },
  achievements: { rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] },
  challenges: { rotate: [0, 15, -15, 0] },
  nutrichat: { rotate: [0, 180, 360], scale: [1, 1.2, 1] },
  ia: { rotate: [0, 180, 360], scale: [1, 1.2, 1] },
};

const AnimatedIcon = ({ id, icon: Icon, isActive, className, strokeWidth }: AnimatedIconProps) => {
  const hoverAnim = animationMap[id] || { scale: [1, 1.1, 1] };

  return (
    <motion.div
      whileHover={hoverAnim}
      whileTap={{ scale: 0.85 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="flex items-center justify-center"
    >
      <Icon className={className} strokeWidth={strokeWidth} />
    </motion.div>
  );
};

export default AnimatedIcon;
