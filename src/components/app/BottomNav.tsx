import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Home, Utensils, TrendingUp, Sparkles, Grid3X3, X, Trophy, Swords, Dumbbell, Syringe, User, History, Ruler, ScanLine, Users, Salad, Plus, Droplets, UtensilsCrossed, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedIcon from '@/components/app/AnimatedIcon';

interface BottomNavProps {
  active: 'home' | 'meals' | 'progress' | 'ia' | string;
}

const BottomNav = ({ active }: BottomNavProps) => {
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const mainItems = [
    { id: 'home', icon: Home, label: 'Hoje', path: '/dashboard' },
    { id: 'meals', icon: Utensils, label: 'Refeições', path: '/meals' },
  ];

  const rightItems = [
    { id: 'progress', icon: TrendingUp, label: 'Resumo', path: '/progress' },
    { id: 'achievements', icon: Trophy, label: 'Placar', path: '/achievements' },
  ];

  const moreItems = [
    { icon: Dumbbell, label: 'Treinos', path: '/workouts', color: 'text-red-500', bg: 'bg-red-500/15' },
    { icon: Swords, label: 'Desafios', path: '/challenges', color: 'text-violet-500', bg: 'bg-violet-500/15' },
    { icon: Droplets, label: 'Água', path: '/water', color: 'text-blue-500', bg: 'bg-blue-500/15' },
    { icon: Syringe, label: 'Injeção', path: '/injecao', color: 'text-indigo-500', bg: 'bg-indigo-500/15' },
    { icon: History, label: 'Histórico', path: '/historico', color: 'text-teal-500', bg: 'bg-teal-500/15' },
    { icon: User, label: 'Perfil', path: '/profile', color: 'text-slate-500', bg: 'bg-slate-500/15' },
  ];

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.92)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRadius: '24px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
  };

  const NavButton = ({ item }: { item: { id: string; icon: LucideIcon; label: string; path: string } }) => {
    const isActive = active === item.id;
    return (
      <motion.button
        onClick={() => navigate(item.path)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        className="relative flex flex-col items-center justify-center min-w-[48px] py-1.5 px-1.5 rounded-xl transition-all duration-300"
      >
        {isActive && (
          <motion.div
            layoutId="navIndicator"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 rounded-xl"
            style={{
              background: 'linear-gradient(145deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
              boxShadow: '0 4px 16px hsl(var(--primary) / 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          />
        )}
        <AnimatedIcon
          id={item.id}
          icon={item.icon}
          isActive={isActive}
          className={`relative z-10 w-5 h-5 transition-all duration-300 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}
          strokeWidth={isActive ? 2.2 : 1.8}
        />
        <span className={`relative z-10 text-[10px] mt-0.5 font-medium transition-all duration-300 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
          {item.label}
        </span>
      </motion.button>
    );
  };

  return (
    <>
      {/* Register Sheet */}
      <AnimatePresence>
        {showRegister && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setShowRegister(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-3xl border-t border-border/40 shadow-2xl max-w-lg mx-auto"
            >
              <div className="p-5 pb-8">
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
                <h3 className="text-base font-semibold text-foreground text-center mb-4">Registrar</h3>
                <div className="space-y-2.5">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { navigate('/meals'); setShowRegister(false); }}
                    className="w-full bg-primary text-primary-foreground rounded-2xl p-4 flex items-center gap-3 font-semibold"
                  >
                    <UtensilsCrossed className="w-5 h-5" /> Adicionar refeição
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { navigate('/water'); setShowRegister(false); }}
                    className="w-full bg-secondary text-foreground rounded-2xl p-4 flex items-center gap-3 font-semibold"
                  >
                    <Droplets className="w-5 h-5" /> Registrar água
                  </motion.button>
                  <button onClick={() => setShowRegister(false)} className="w-full text-muted-foreground py-3 text-sm">Cancelar</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* More Tools Sheet */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-3xl border-t border-border/40 shadow-2xl max-w-lg mx-auto"
            >
              <div className="p-5 pb-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-foreground">Mais ferramentas</h3>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowMore(false)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </motion.button>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {moreItems.map((item, i) => (
                    <motion.button
                      key={item.path}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { setShowMore(false); navigate(item.path); }}
                      className="flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-secondary/60 hover:bg-secondary px-2 py-4 transition-colors"
                    >
                      <span className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                      </span>
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:pb-6"
      >
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-around py-2.5 px-2" style={glassStyle}>
            {mainItems.map((item) => <NavButton key={item.id} item={item} />)}

            {/* Center FAB */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMore(true)}
              className="relative -mt-7 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(145deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
                boxShadow: '0 4px 20px hsl(var(--primary) / 0.4)',
              }}
            >
              <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
            </motion.button>

            {rightItems.map((item) => <NavButton key={item.id} item={item} />)}
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default BottomNav;
