import { useEffect, useState } from 'react';
// data local (não UTC): depois das 21h o UTC já é o dia seguinte no Brasil
import { DEFAULT_WATER_GOAL_ML, todayStr } from '@/lib/desafio/rules';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDesafio } from '@/hooks/useDesafio';
import { supabase } from '@/integrations/supabase/client';
import SectionHeader from '@/components/app/SectionHeader';
import AppLayout from '@/components/app/AppLayout';
import { Droplets, Plus, Calculator, Activity, User, Ruler, Calendar, Edit3, Check, Sparkles, Clock, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from '@/components/app/Confetti';
import { useCountUp } from '@/hooks/useCountUp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WaterRecord {
  id: string;
  amount_ml: number;
  created_at: string;
}

const waterAmounts = [
  { label: '200ml', value: 200, icon: '🥛' },
  { label: '300ml', value: 300, icon: '🥤' },
  { label: '500ml', value: 500, icon: '💧' },
  { label: '1L', value: 1000, icon: '🫗' },
];

const activityLevels = [
  { value: 'sedentary', label: 'Sedentário', multiplier: 30 },
  { value: 'light', label: 'Leve', multiplier: 35 },
  { value: 'moderate', label: 'Moderado', multiplier: 40 },
  { value: 'active', label: 'Ativo', multiplier: 45 },
  { value: 'very_active', label: 'Muito ativo', multiplier: 50 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

let lastSeen: { date: string; total: number } | null = null;

const Water = () => {
  const { user, profile, loading } = useAuth();
  // meta de água fica no perfil do desafio (banco); a do perfil antigo do app não salvava
  const desafio = useDesafio();
  const navigate = useNavigate();
  // abre com o último total visto hoje (não conta de 0 toda vez que entra na tela)
  const [todayTotal, setTodayTotal] = useState(() => (lastSeen?.date === todayStr() ? lastSeen.total : 0));
  const [waterGoal, setWaterGoal] = useState(DEFAULT_WATER_GOAL_ML);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManualGoal, setShowManualGoal] = useState(false);
  const [manualGoalInput, setManualGoalInput] = useState('');
  const [calculatedGoal, setCalculatedGoal] = useState<number | null>(null);
  const [todayRecords, setTodayRecords] = useState<WaterRecord[]>([]);
  const [lastDeleted, setLastDeleted] = useState<WaterRecord | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  
  const [calcAge, setCalcAge] = useState(profile?.age?.toString() || '');
  const [calcWeight, setCalcWeight] = useState(profile?.weight?.toString() || '');
  const [calcHeight, setCalcHeight] = useState(profile?.height?.toString() || '');
  const [calcActivity, setCalcActivity] = useState(profile?.activity_level || 'moderate');
  const [showConfetti, setShowConfetti] = useState(false);

  const startPct = (t: number) => Math.min(100, Math.round((t / waterGoal) * 100));
  const [firstTotal] = useState(todayTotal);
  const animatedTotal = useCountUp({ end: todayTotal, start: firstTotal, duration: 800 });
  const animatedProgress = useCountUp({ end: startPct(todayTotal), start: startPct(firstTotal), duration: 800 });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTodayWater();
    }
  }, [user, profile]);

  useEffect(() => {
    setWaterGoal(desafio.waterGoalMl);
  }, [desafio.waterGoalMl]);

  const fetchTodayWater = async () => {
    if (!user) return;
    const today = todayStr();
    
    const { data } = await supabase
      .from('water_consumption')
      .select('id, amount_ml, created_at')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: false });
    
    if (data) {
      setTodayRecords(data);
      const total = data.reduce((sum, item) => sum + item.amount_ml, 0);
      setTodayTotal(total);
      lastSeen = { date: today, total };
    }
  };

  const handleAddWater = async (amount: number) => {
    if (!user || amount <= 0) return;
    
    const { data, error } = await supabase
      .from('water_consumption')
      .insert({
        user_id: user.id,
        amount_ml: amount,
        date: todayStr(),
      })
      .select('id, amount_ml, created_at')
      .single();
    
    if (error) {
      toast.error('Erro ao adicionar água');
      return;
    }
    
    if (data) {
      setTodayRecords(prev => [data, ...prev]);
    }
    setTodayTotal(prev => prev + amount);
    setShowAddModal(false);
    setCustomAmount('');
    toast.success(`+${amount}ml adicionado!`);
    
    if (todayTotal + amount >= waterGoal && todayTotal < waterGoal) {
      // reinicia para o confete tocar de novo se a meta for batida outra vez
      setShowConfetti(false);
      setTimeout(() => setShowConfetti(true), 50);
      toast.success('🎉 Meta de água atingida!', { duration: 3000 });
    }
  };

  const handleDeleteRecord = async (record: WaterRecord) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('water_consumption')
      .delete()
      .eq('id', record.id);
    
    if (error) {
      toast.error('Erro ao remover registro');
      return;
    }
    
    setTodayRecords(prev => prev.filter(r => r.id !== record.id));
    setTodayTotal(prev => prev - record.amount_ml);
    setLastDeleted(record);
    toast.success('Registro removido', {
      action: {
        label: 'Desfazer',
        onClick: () => handleUndoDelete(record),
      },
    });
  };

  const handleUndoDelete = async (record: WaterRecord) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('water_consumption')
      .insert({
        user_id: user.id,
        amount_ml: record.amount_ml,
        date: todayStr(),
      })
      .select('id, amount_ml, created_at')
      .single();
    
    if (!error && data) {
      setTodayRecords(prev => [data, ...prev]);
      setTodayTotal(prev => prev + record.amount_ml);
      setLastDeleted(null);
      toast.success('Registro restaurado!');
    }
  };

  const calculateIdealWater = () => {
    const weight = parseFloat(calcWeight);
    const age = parseInt(calcAge);
    const activity = activityLevels.find(a => a.value === calcActivity);
    
    if (!weight || !age || !activity) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    let baseWater = weight * activity.multiplier;
    if (age > 55) baseWater *= 0.9;
    else if (age < 18) baseWater *= 1.1;
    
    const idealWater = Math.round(baseWater / 50) * 50;
    setCalculatedGoal(idealWater);
  };

  const saveCalculatedGoal = async () => {
    if (!calculatedGoal || !user) return;
    
    await supabase
      .from('profiles')
      .update({
        water_goal_ml: calculatedGoal,
        age: parseInt(calcAge) || null,
        weight: parseFloat(calcWeight) || null,
        height: parseFloat(calcHeight) || null,
        activity_level: calcActivity,
      })
      .eq('id', user.id);
    
    desafio.saveProfileData({ waterGoalMl: calculatedGoal });
    setWaterGoal(calculatedGoal);
    toast.success(`Meta definida: ${calculatedGoal}ml/dia`);
    setShowCalculator(false);
    setCalculatedGoal(null);
  };

  const saveManualGoal = async () => {
    const goal = parseInt(manualGoalInput);
    if (!goal || goal < 500 || goal > 5000) {
      toast.error('Digite uma meta entre 500ml e 5000ml');
      return;
    }
    
    if (!user) return;
    
    await supabase
      .from('profiles')
      .update({ water_goal_ml: goal })
      .eq('id', user.id);
    
    desafio.saveProfileData({ waterGoalMl: goal });
    setWaterGoal(goal);
    toast.success(`Meta definida: ${goal}ml/dia`);
    setShowManualGoal(false);
    setManualGoalInput('');
  };

  const progress = Math.min(100, Math.round((todayTotal / waterGoal) * 100));
  const goalReached = todayTotal >= waterGoal;
  const remaining = Math.max(0, waterGoal - todayTotal);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <AppLayout activeNav="water">
        <div className="min-h-screen pb-28 lg:pb-8">
          <SectionHeader title="Hidratação" subtitle="Controle seu consumo de água" />
          <div className="px-4 sm:px-6 mt-6 space-y-4">
            <div className="h-72 bg-card/50 animate-pulse rounded-3xl" />
            <div className="h-16 bg-card/50 animate-pulse rounded-2xl" />
            <div className="h-32 bg-card/50 animate-pulse rounded-2xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeNav="water">
      <Confetti trigger={showConfetti} />
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="min-h-screen pb-28 lg:pb-8"
      >
        <SectionHeader title="Hidratação" subtitle="Controle seu consumo de água" />

        <div className="px-4 sm:px-6 lg:px-8">
          {/* Main Progress Card */}
          <motion.div variants={itemVariants} className="mt-6">
            <div className="relative overflow-hidden bg-card rounded-2xl p-6 sm:p-8 border border-border/30 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 via-transparent to-primary/5 pointer-events-none" />
              
              <div className="relative flex flex-col lg:flex-row lg:items-center lg:gap-10">
                {/* Progress Ring */}
                <div className="flex flex-col items-center lg:items-start">
                  <motion.div 
                    className="relative w-48 h-48 sm:w-56 sm:h-56"
                    initial={false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle 
                        cx="50" cy="50" r="42" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth="6" 
                        fill="none" 
                      />
                      <motion.circle
                        cx="50" cy="50" r="42"
                        stroke={goalReached ? 'hsl(var(--primary))' : 'hsl(199 89% 48%)'}
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        initial={false}
                        animate={{ strokeDasharray: `${progress * 2.64} 264` }}
                        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                        style={{ filter: goalReached ? 'drop-shadow(0 0 12px hsl(var(--primary) / 0.5))' : 'drop-shadow(0 0 12px hsl(199 89% 48% / 0.4))' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.div
                        initial={false}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                      >
                        <Droplets className={`w-8 h-8 mb-1 ${goalReached ? 'text-primary' : 'text-sky-500'}`} />
                      </motion.div>
                      <motion.span 
                        className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight"
                        key={todayTotal}
                        initial={false}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        {animatedTotal}
                      </motion.span>
                      <span className="text-sm text-muted-foreground font-medium">de {waterGoal}ml</span>
                    </div>
                  </motion.div>
                </div>

                {/* Stats & Feedback */}
                <div className="flex-1 mt-6 lg:mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary rounded-2xl p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{progress}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Progresso</p>
                    </div>
                    <div className="bg-secondary rounded-2xl p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{remaining}</p>
                      <p className="text-xs text-muted-foreground mt-1">ml restantes</p>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {goalReached ? (
                      <motion.div
                        key="goal-reached"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-primary">Meta atingida!</p>
                          <p className="text-xs text-primary/80">Parabéns pelo seu progresso</p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="keep-going"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4"
                      >
                        <p className="text-sm text-muted-foreground">
                          {remaining > 1000 
                            ? 'Continue hidratando seu corpo ao longo do dia' 
                            : `Faltam apenas ${remaining}ml para sua meta!`}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Add Buttons */}
          <motion.div variants={itemVariants} className="mt-5">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Adicionar rápido</span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {waterAmounts.map((amount, index) => (
                <motion.button
                  key={amount.value}
                  initial={false}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAddWater(amount.value)}
                  className="bg-card hover:bg-card/80 border border-border/30 hover:border-primary/30 rounded-2xl p-3 sm:p-4 flex flex-col items-center gap-1.5 transition-all shadow-sm"
                >
                  <span className="text-xl sm:text-2xl">{amount.icon}</span>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{amount.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Custom Amount + Main Add Button */}
          <motion.div variants={itemVariants} className="mt-4 flex gap-3">
            <div className="flex-1 flex gap-2">
              <Input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Outro valor (ml)"
                className="flex-1 h-12 rounded-xl bg-card border-border/30"
              />
              <Button
                onClick={() => handleAddWater(parseInt(customAmount) || 0)}
                disabled={!customAmount || parseInt(customAmount) <= 0}
                className="h-12 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* Today's History */}
          <motion.div variants={itemVariants} className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Histórico de hoje</span>
              </div>
              <span className="text-xs text-muted-foreground">{todayRecords.length} registros</span>
            </div>
            
            <div className="bg-card rounded-2xl border border-border/30 shadow-sm overflow-hidden">
              {todayRecords.length === 0 ? (
                <div className="p-8 text-center">
                  <Droplets className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum registro hoje</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Adicione água para começar</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30 max-h-64 overflow-y-auto">
                  <AnimatePresence>
                    {todayRecords.map((record, index) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-sky-500/10 rounded-xl flex items-center justify-center">
                            <Droplets className="w-4 h-4 text-sky-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{record.amount_ml}ml</p>
                            <p className="text-xs text-muted-foreground">{formatTime(record.created_at)}</p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteRecord(record)}
                          className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>

          {/* Goal Settings */}
          <motion.div variants={itemVariants} className="mt-6 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Edit3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Configurar meta</span>
            </div>

            {/* Manual Goal */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => { setShowManualGoal(!showManualGoal); setShowCalculator(false); }}
              className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 border border-border/30 shadow-sm transition-all hover:bg-card/80"
            >
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Meta Manual</p>
                <p className="text-sm text-muted-foreground">Atual: {waterGoal}ml/dia</p>
              </div>
            </motion.button>

            <AnimatePresence>
              {showManualGoal && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-card rounded-2xl p-5 space-y-4 border border-border/30 shadow-sm">
                    <div>
                      <label className="text-sm text-muted-foreground">Meta diária (ml)</label>
                      <Input
                        type="number"
                        value={manualGoalInput}
                        onChange={(e) => setManualGoalInput(e.target.value)}
                        placeholder="Ex: 2500"
                        className="mt-2 h-12 rounded-xl bg-secondary border-border/30"
                      />
                    </div>
                    <Button 
                      onClick={saveManualGoal}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Salvar Meta
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Calculator */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => { setShowCalculator(!showCalculator); setShowManualGoal(false); }}
              className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 border border-border/30 shadow-sm transition-all hover:bg-card/80"
            >
              <div className="w-11 h-11 bg-sky-500/10 rounded-xl flex items-center justify-center">
                <Calculator className="w-5 h-5 text-sky-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground">Calculadora</p>
                <p className="text-sm text-muted-foreground">Descubra sua meta ideal</p>
              </div>
            </motion.button>

            <AnimatePresence>
              {showCalculator && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-card rounded-2xl p-5 space-y-4 border border-border/30 shadow-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> Idade
                        </label>
                        <Input
                          type="number"
                          value={calcAge}
                          onChange={(e) => setCalcAge(e.target.value)}
                          placeholder="25"
                          className="mt-1 h-11 rounded-xl bg-secondary border-border/30"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground flex items-center gap-2">
                          <User className="w-4 h-4" /> Peso (kg)
                        </label>
                        <Input
                          type="number"
                          value={calcWeight}
                          onChange={(e) => setCalcWeight(e.target.value)}
                          placeholder="70"
                          className="mt-1 h-11 rounded-xl bg-secondary border-border/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-muted-foreground flex items-center gap-2">
                          <Ruler className="w-4 h-4" /> Altura (cm)
                        </label>
                        <Input
                          type="number"
                          value={calcHeight}
                          onChange={(e) => setCalcHeight(e.target.value)}
                          placeholder="175"
                          className="mt-1 h-11 rounded-xl bg-secondary border-border/30"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground flex items-center gap-2">
                          <Activity className="w-4 h-4" /> Atividade
                        </label>
                        <Select value={calcActivity} onValueChange={setCalcActivity}>
                          <SelectTrigger className="mt-1 h-11 rounded-xl bg-secondary border-border/30">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {activityLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      onClick={calculateIdealWater}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white rounded-xl h-12"
                    >
                      Calcular Meta Ideal
                    </Button>

                    <AnimatePresence>
                      {calculatedGoal && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-primary/10 border border-primary/20 rounded-xl p-5 text-center"
                        >
                          <p className="text-sm text-muted-foreground">Meta ideal calculada:</p>
                          <p className="text-4xl font-bold text-primary mt-2">{calculatedGoal}ml</p>
                          <p className="text-xs text-muted-foreground mt-1">por dia</p>
                          <Button 
                            onClick={saveCalculatedGoal}
                            className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Usar Esta Meta
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Water;
