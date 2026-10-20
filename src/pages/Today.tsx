import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Plus, Flame, MessageCircle, ChevronRight, Utensils, Camera, UtensilsCrossed, TrendingUp, X, Dumbbell, Trophy, BarChart3, Sparkles, ScanLine, BookOpen, Users, Syringe, Swords, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/app/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDesafio } from '@/hooks/useDesafio';
import { PlayerPicker } from '@/components/desafio/DesafioParts';
import { DayChecklist } from '@/components/desafio/DayChecklist';
import { DEFAULT_WATER_GOAL_ML, fmtHours, jokersLeftOf, num } from '@/lib/desafio/rules';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DayData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  waterTarget: number;
}

interface Meal {
  id: string;
  name: string;
  meal_type: string | null;
  total_calories: number | null;
  total_protein: number | null;
  total_carbs: number | null;
  total_fat: number | null;
  time: string | null;
}

let lastDay: { date: string; dayData: DayData; meals: Meal[] } | null = null;

const Today = () => {
  const { user, profile, loading } = useAuth();
  const desafio = useDesafio();
  const navigate = useNavigate();
  const location = useLocation();
  // ao voltar para Hoje, abre com o que já foi carregado (não pisca em zero)
  const cached = lastDay?.date === format(new Date(), 'yyyy-MM-dd') ? lastDay : null;
  const [dayData, setDayData] = useState<DayData>(cached?.dayData ?? {
    calories: 0, protein: 0, carbs: 0, fat: 0, water: 0,
    waterTarget: DEFAULT_WATER_GOAL_ML,
  });
  const [meals, setMeals] = useState<Meal[]>(cached?.meals ?? []);
  const [dataLoaded, setDataLoaded] = useState(!!cached);
  const [showFabSheet, setShowFabSheet] = useState(false);
  

  const today = format(new Date(), 'yyyy-MM-dd');
  const isPremium = profile?.is_premium ?? false;
  const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';
  const currentStreak = desafio.myStats?.run ?? 0;
  const lastNight = desafio.sleep.find((s) => !s.nap && s.date === today);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '☀️';
    if (hour >= 12 && hour < 18) return '🌤️';
    return '🌙';
  };


  const getNextMealSuggestion = () => {
    const hour = new Date().getHours();
    if (hour < 9) return { type: 'Café da manhã', emoji: '☕' };
    if (hour < 12) return { type: 'Lanche da manhã', emoji: '🥤' };
    if (hour < 15) return { type: 'Almoço', emoji: '🍽️' };
    if (hour < 18) return { type: 'Lanche da tarde', emoji: '🍎' };
    if (hour < 21) return { type: 'Jantar', emoji: '🌙' };
    return { type: 'Ceia', emoji: '🌜' };
  };

  const fetchDayData = useCallback(async () => {
    if (!user) return;
    // (calorias saíram do app: a tabela daily_consumption não é mais lida)
    const [waterRes, mealsRes] = await Promise.all([
      supabase.from('water_consumption').select('amount_ml').eq('user_id', user.id).eq('date', today),
      supabase.from('meals').select('*').eq('user_id', user.id).eq('date', today).order('created_at', { ascending: false }),
    ]);

    const water = (waterRes.data || []).reduce((s: number, w: { amount_ml: number | null }) => s + (w.amount_ml || 0), 0);

    const next: DayData = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      water,
      waterTarget: profile?.water_goal_ml || DEFAULT_WATER_GOAL_ML,
    };
    const nextMeals = (mealsRes.data as Meal[]) || [];
    setDayData(next);
    setMeals(nextMeals);
    lastDay = { date: today, dayData: next, meals: nextMeals };
    setDataLoaded(true);
  }, [user, today, profile]);

  useEffect(() => {
    if (!loading && !user) { navigate('/auth'); return; }
    fetchDayData();
  }, [user, loading, fetchDayData, navigate]);

  useEffect(() => { if (dataLoaded) fetchDayData(); }, [location.key]);

  useEffect(() => {
    if (!user) return;
    const channels = [
      supabase.channel('today-water').on('postgres_changes', { event: '*', schema: 'public', table: 'water_consumption', filter: `user_id=eq.${user.id}` }, () => fetchDayData()).subscribe(),
      supabase.channel('today-meals').on('postgres_changes', { event: '*', schema: 'public', table: 'meals', filter: `user_id=eq.${user.id}` }, () => fetchDayData()).subscribe(),
    ];
    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, [user, fetchDayData]);

  const addWater = async (ml: number) => {
    if (!user) return;
    await supabase.from('water_consumption').insert({ user_id: user.id, amount_ml: ml, date: today });
    setDayData(prev => ({ ...prev, water: prev.water + ml }));
    toast.success(`+${ml}ml de água 💧`);
  };

  const nextMeal = getNextMealSuggestion();
  const waterPct = dayData.waterTarget > 0 ? Math.min(100, Math.round((dayData.water / dayData.waterTarget) * 100)) : 0;

  const motivationalMessages = [
    'Cada escolha saudável conta!',
    'Você está no caminho certo.',
    'Consistência é a chave.',
    'Um dia de cada vez.',
    'Seu corpo agradece!',
  ];
  const todayMessage = motivationalMessages[new Date().getDay() % motivationalMessages.length];


  if (loading && !dataLoaded) {
    return (
      <AppLayout activeNav="home">
        <div className="animate-pulse space-y-4 px-5 pt-6">
          <Skeleton className="h-36 w-full rounded-3xl" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeNav="home">
      <motion.div initial={false} animate={{ opacity: 1 }} className="min-h-screen pb-28 lg:pb-8">
        <div className="px-4 sm:px-6 lg:px-8 pt-6 space-y-5 w-full">

          {/* ── Hero Greeting ── */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/15 p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{getGreeting()} {getGreetingEmoji()}</p>
                <h1 className="text-2xl font-bold text-foreground mt-0.5">{firstName}</h1>
                <p className="text-xs text-muted-foreground mt-1 first-letter:uppercase">
                  {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                 {currentStreak > 1 && (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-warning/15 rounded-full">
                    <Flame className="w-3.5 h-3.5 text-warning streak-flame" />
                    <span className="text-[11px] font-bold text-warning">{currentStreak}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">{todayMessage}</p>
          </motion.div>

          {/* ── Desafio do dia ── */}
          {!desafio.player && !desafio.loading && <PlayerPicker onPick={desafio.choosePlayer} />}
          <DayChecklist
            record={desafio.record(today)}
            toggle={desafio.toggle}
            markWithProof={desafio.markWithProof}
            jokersLeft={jokersLeftOf(Object.values(desafio.days).filter((r) => r.coringa).length)}
          />

          {/* ── Metric Cards (3 cols) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sono da última noite */}
            <motion.button
              initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              onClick={() => navigate('/noite')}
              className="rounded-2xl bg-card border border-border p-4 text-left"
            >
              <Moon className="w-4 h-4 text-violet-500 mb-2" />
              <p className="text-lg font-bold text-foreground leading-none">{lastNight ? fmtHours(lastNight.hours) : '–'}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{lastNight ? 'de sono esta noite' : 'anotar o sono'}</p>
            </motion.button>

            {/* Pontos do desafio */}
            <motion.button
              initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              onClick={() => navigate('/achievements')}
              className="rounded-2xl bg-card border border-border p-4 text-left"
            >
              <Trophy className="w-4 h-4 text-warning mb-2" />
              <p className="text-lg font-bold text-foreground leading-none">{desafio.myStats ? num(desafio.myStats.pts) : '–'}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">pontos · 🔥 {desafio.myStats?.run ?? 0} seguidos</p>
            </motion.button>

            {/* Água */}
            <motion.div
              initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-2xl bg-card border border-border p-4"
            >
              <Droplets className="w-4 h-4 text-info mb-2" />
              <p className="text-lg font-bold text-foreground leading-none">{dayData.water}<span className="text-[10px] font-normal">ml</span></p>
              <p className="text-[10px] text-muted-foreground mt-0.5">/ {dayData.waterTarget}ml</p>
              <div className="w-full h-1 bg-secondary rounded-full mt-2 overflow-hidden">
                <motion.div initial={false} animate={{ width: `${waterPct}%` }} transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-info" />
              </div>
            </motion.div>
          </div>

          {/* ── Quick Actions + Features ── */}
          <motion.div
            initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          >
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Utensils, label: 'Refeição', route: '/meals', color: 'text-primary', bg: 'bg-primary/10' },
                { icon: Droplets, label: 'Água', route: '/water', color: 'text-info', bg: 'bg-info/10' },
                { icon: Syringe, label: 'Injeção', route: '/injecao', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                { icon: BarChart3, label: 'Resumo', route: '/progress', color: 'text-info', bg: 'bg-info/10' },
                { icon: Swords, label: 'Desafios', route: '/challenges', color: 'text-violet-500', bg: 'bg-violet-500/10' },
                { icon: Trophy, label: 'Placar', route: '/achievements', color: 'text-warning', bg: 'bg-warning/10' },
                { icon: Dumbbell, label: 'Treinos', route: '/workouts', color: 'text-detail', bg: 'bg-detail/10' },
              ].map(item => (
                <motion.button
                  key={item.route}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(item.route)}
                  className="flex-1 min-w-[72px] rounded-2xl bg-card border border-border p-3 flex flex-col items-center gap-1.5 hover:bg-accent/50 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                  </div>
                  <span className="text-[10px] font-medium text-foreground whitespace-nowrap">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* ── Next Meal ── */}
          <motion.button
            initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/meals')}
            className="w-full rounded-2xl bg-card border border-border p-4 text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{nextMeal.emoji}</span>
              <div>
                <p className="text-xs text-muted-foreground">Próxima refeição</p>
                <p className="text-sm font-semibold text-foreground">{nextMeal.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <span className="text-xs font-medium">Registrar</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </motion.button>

          {/* ── Water Quick Add ── */}
          <motion.div
            initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl bg-card border border-border p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-info" />
                <span className="text-sm font-semibold text-foreground">Água</span>
              </div>
              <span className="text-xs font-bold text-info">{waterPct}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
              <motion.div initial={false} animate={{ width: `${waterPct}%` }} className="h-full rounded-full bg-info" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[200, 300, 500].map(ml => (
                <Button key={ml} variant="outline" size="sm" onClick={() => addWater(ml)}
                  className="rounded-xl text-xs h-10 border-border hover:bg-info/10 hover:text-info hover:border-info/30">
                  +{ml}ml
                </Button>
              ))}
            </div>
          </motion.div>

          {/* ── Today's Meals ── */}
          <motion.div
            initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-2xl bg-card border border-border p-4 motion-card"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">Registros de hoje</p>
              <span className="text-[11px] text-muted-foreground">{meals.length} itens</span>
            </div>

            {meals.length > 0 ? (
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {meals.slice(0, 5).map(meal => (
                  <div key={meal.id} className="rounded-xl p-3 bg-secondary/50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{meal.name}</p>
                      {meal.time && <p className="text-[10px] text-muted-foreground">{meal.time.slice(0, 5)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Utensils className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma refeição registrada</p>
                <p className="text-[11px] text-muted-foreground mt-1">Use o botão + para começar</p>
              </div>
            )}
          </motion.div>

          {/* ── Workout CTA ── */}
          <motion.button
            initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/workouts')}
            className="w-full rounded-2xl bg-detail/10 border border-detail/20 p-4 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-full bg-detail/20 flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-4 h-4 text-detail" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold text-foreground">Treinar hoje</p>
              <p className="text-[11px] text-muted-foreground">Marque se treinou hoje</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>

        </div>

        {/* FAB removed – register actions now in bottom nav */}

      </motion.div>
    </AppLayout>
  );
};

export default Today;
