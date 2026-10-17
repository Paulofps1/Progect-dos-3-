import { motion } from 'framer-motion';
import { ReactNode, forwardRef } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }
  },
  exit: { 
    opacity: 0, 
    y: -8,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] }
  },
};

const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(({ children, className }, ref) => (
  <motion.div
    ref={ref}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className={className}
  >
    {children}
  </motion.div>
));

PageTransition.displayName = 'PageTransition';

export default PageTransition;
