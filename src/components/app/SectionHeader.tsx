import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSidebarContext } from '@/contexts/SidebarContext';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  backTo?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

const SectionHeader = ({ title, subtitle, backTo = '/dashboard', children, icon }: SectionHeaderProps) => {
  const navigate = useNavigate();
  const { isMobile } = useSidebarContext();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mx-4 sm:mx-6 lg:mx-8 mt-14 lg:mt-6 mb-4 p-4 bg-card rounded-2xl shadow-sm"
    >
      <div className="flex items-center justify-between">
        {/* Left - Back/Icon and Title */}
        <div className="flex items-center gap-3">
          {isMobile ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(backTo)}
              className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          ) : icon ? (
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
          ) : null}
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        
        {/* Right - Actions */}
        {children && (
          <div className="flex-shrink-0">
            {children}
          </div>
        )}
      </div>
    </motion.header>
  );
};

export default SectionHeader;