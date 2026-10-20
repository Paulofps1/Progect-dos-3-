import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Utensils, TrendingUp, Sparkles, Plus, Minus, Droplets, Salad, UtensilsCrossed, BookOpen, Ruler, Bot, BarChart3, Dumbbell, Trophy, Swords, CookingPot, Syringe, History,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useAuth } from '@/hooks/useAuth';
import { useDesafio } from '@/hooks/useDesafio';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AnimatedIcon from '@/components/app/AnimatedIcon';

const DesktopSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isExpanded, toggleSidebar } = useSidebarContext();
  const { profile } = useAuth();
  const avatar = useDesafio().profileData.avatar || profile?.avatar_url;

  const navSections = [
    {
      label: 'Principal',
      items: [
        { id: 'home', icon: Home, label: 'Hoje', path: '/dashboard' },
      ],
    },
    {
      label: 'Alimentação',
      items: [
        { id: 'meals', icon: Utensils, label: 'Refeições', path: '/meals' },
        { id: 'water', icon: Droplets, label: 'Água', path: '/water' },
        { id: 'injecao', icon: Syringe, label: 'Injeção', path: '/injecao' },
      ],
    },
    {
      label: 'Treino',
      items: [
        { id: 'workouts', icon: Dumbbell, label: 'Treinos', path: '/workouts' },
        { id: 'noite', icon: Moon, label: 'Sono', path: '/noite' },
      ],
    },
    {
      label: 'Acompanhamento',
      items: [
        { id: 'progress', icon: TrendingUp, label: 'Resumo', path: '/progress' },
        { id: 'measurements', icon: History, label: 'Histórico', path: '/historico' },
      ],
    },
    {
      label: 'Conquistas',
      items: [
        { id: 'achievements', icon: Trophy, label: 'Placar', path: '/achievements' },
        { id: 'challenges', icon: Swords, label: 'Desafios', path: '/challenges' },
      ],
    },
  ];

  const navItems = navSections.flatMap(s => s.items);

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const active = isActive(item.path);

    const button = (
      <motion.button
        onClick={() => navigate(item.path)}
        whileTap={{ scale: 0.97 }}
        className={`group relative w-full flex items-center rounded-xl transition-all duration-300 ${
          isExpanded ? 'justify-start gap-4 px-4' : 'justify-center'
        } py-3.5 ${active ? 'bg-[#F1FFD4]' : 'hover:bg-muted/60'}`}
      >
        <AnimatedIcon
          id={item.id}
          icon={item.icon}
          isActive={active}
          className={`w-6 h-6 flex-shrink-0 transition-all duration-300 ${active ? 'text-[#65A30D]' : 'text-muted-foreground group-hover:text-foreground'}`}
          strokeWidth={active ? 2.2 : 1.5}
        />
        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, x: -10, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: -10, width: 0 }}
              className={`text-base font-medium whitespace-nowrap overflow-hidden ${active ? 'text-[#65A30D]' : 'text-muted-foreground group-hover:text-foreground'}`}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );

    if (!isExpanded) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl">{item.label}</TooltipContent>
        </Tooltip>
      );
    }
    return button;
  };

  const getInitials = () => {
    if (profile?.full_name) {
      const names = profile.full_name.split(' ');
      return names.length >= 2 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : names[0][0].toUpperCase();
    }
    return 'U';
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 240 : 72 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky left-0 top-0 h-screen z-40 flex flex-col bg-card border-r border-border/50 flex-shrink-0"
    >
      <div className="p-4 flex justify-center">
        <motion.button
          onClick={toggleSidebar}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isExpanded ? 0 : 360 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 text-foreground"
        >
          {isExpanded ? <Minus className="w-4 h-4" strokeWidth={2.5} /> : <Plus className="w-4 h-4" strokeWidth={2.5} />}
        </motion.button>
      </div>

      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto scrollbar-thin">
        {navSections.map((section, si) => (
          <div key={si}>
            <AnimatePresence mode="wait">
              {isExpanded && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold px-4 pt-3 pb-1">
                  {section.label}
                </motion.p>
              )}
            </AnimatePresence>
            {!isExpanded && si > 0 && <div className="w-6 h-px bg-border/30 mx-auto my-2" />}
            {section.items.map((item) => <NavItem key={item.id} item={item} />)}
          </div>
        ))}
      </nav>

      <div className="mx-3 my-2"><div className="w-full h-px bg-border/40" /></div>

      <div className="p-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <motion.button
              onClick={() => navigate('/profile')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center rounded-xl hover:bg-muted/50 transition-all duration-200 ${isExpanded ? 'justify-start gap-4 px-3' : 'justify-center'} py-3`}
            >
              <div className="flex-shrink-0">
                {avatar ? (
                  <img src={avatar} alt="Perfil" className="w-10 h-10 rounded-full object-cover border-2 border-border/50 shadow-md" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold text-base border border-primary/20 shadow-md">
                    {getInitials()}
                  </div>
                )}
              </div>
              <AnimatePresence mode="wait">
                {isExpanded && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col items-start overflow-hidden">
                    <span className="text-base font-medium text-foreground truncate">{profile?.full_name || 'Usuário'}</span>
                    <span className="text-sm text-muted-foreground">Ver perfil</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </TooltipTrigger>
          {!isExpanded && <TooltipContent side="right" className="bg-card/95 backdrop-blur-xl border-border/50 shadow-xl">Ver perfil</TooltipContent>}
        </Tooltip>
      </div>
    </motion.aside>
  );
};

export default DesktopSidebar;
