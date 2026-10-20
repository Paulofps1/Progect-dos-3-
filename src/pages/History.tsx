import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, History as HistoryIcon, Scale, Syringe, Utensils, Moon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/app/AppLayout';
import SectionHeader from '@/components/app/SectionHeader';
import { TONES } from '@/components/desafio/tones';
import { useAuth } from '@/hooks/useAuth';
import { useDesafio } from '@/hooks/useDesafio';
import { supabase } from '@/integrations/supabase/client';
import { CORE, START, dayPercent, dayPoints, fmtHours, habitDone, isPerfect, isSunday, num, parseYmd, ymd, type DayRecord, type HabitKey } from '@/lib/desafio/rules';

// Meu histórico: um dia por linha, do mais novo ao mais antigo. Tocar abre o
// que aconteceu no dia (refeições, água, treino, injeção, pesagem).

type MealRow = { id: string; date: string; name: string; time: string | null };
type Filter = 'todos' | 'perfeitos' | 'abertos';
const SHOWN: HabitKey[] = ['agua', 'treino', 'comida', 'doce', 'cardio', 'passos'];

const History = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const d = useDesafio();
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('todos');

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // dias do mais novo ao mais antigo: desde o início do desafio, ou antes se já houver registro
  const allDays = useMemo(() => {
    const known = [...Object.keys(d.days), ...meals.map((m) => m.date), ...d.weights.map((w) => w.date), ...d.sleep.map((x) => x.date)].filter((x) => x <= d.today).sort();
    const first = known[0] && known[0] < START ? known[0] : START;
    const out: string[] = [];
    const cur = parseYmd(d.today);
    while (ymd(cur) >= first) {
      out.push(ymd(cur));
      cur.setDate(cur.getDate() - 1);
    }
    return out;
  }, [d.days, d.today, d.weights, d.sleep, meals]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('meals')
      .select('id, date, name, time')
      .eq('user_id', user.id)
      .gte('date', format(new Date(Date.now() - 120 * 864e5), 'yyyy-MM-dd'))
      .order('created_at', { ascending: true })
      .then(({ data }) => setMeals((data as MealRow[]) || []));
  }, [user]);

  const mealsByDay = useMemo(() => {
    const m: Record<string, MealRow[]> = {};
    for (const r of meals) (m[r.date] ??= []).push(r);
    return m;
  }, [meals]);
  const weightByDay = new Map(d.weights.map((w) => [w.date, w.kg]));
  const injByDay = new Map(d.injections.map((i) => [i.date, i]));
  const sleepByDay = new Map(d.sleep.filter((x) => !x.nap).map((x) => [x.date, x]));

  const days = allDays.filter((day) => {
    const r = d.record(day);
    if (filter === 'perfeitos') return isPerfect(r);
    if (filter === 'abertos') return !isPerfect(r) && !isSunday(day);
    return true;
  });

  const s = d.myStats;
  const totalTrainings = allDays.filter((x) => d.record(x).treino).length;

  return (
    <AppLayout activeNav="profile">
      <motion.div initial={false} animate={{ opacity: 1 }} className="min-h-screen pb-28 lg:pb-8">
        <SectionHeader title="Meu histórico" subtitle="Tudo o que você registrou, dia a dia" backTo="/profile" icon={<HistoryIcon className="w-5 h-5 text-primary" />} />

        <div className="px-4 sm:px-6 lg:px-8 space-y-4 mt-6 max-w-2xl mx-auto">
          {/* números do período */}
          <div className="grid grid-cols-4 gap-2">
            {[
              [String(allDays.length), 'dias'],
              [s ? String(s.perfect) : '–', 'perfeitos'],
              [String(totalTrainings), 'treinos'],
              [String(d.injections.filter((i) => i.date <= d.today).length), 'injeções'],
            ].map(([v, l]) => (
              <div key={l} className="bg-card rounded-2xl border border-border/30 shadow-sm py-3 text-center">
                <p className="text-xl font-bold text-foreground tabular-nums">{v}</p>
                <p className="text-[10px] text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>

          {/* filtro */}
          <div className="flex gap-2" role="tablist" aria-label="Filtrar dias">
            {(
              [
                ['todos', 'Todos'],
                ['perfeitos', 'Perfeitos'],
                ['abertos', 'Não fechados'],
              ] as [Filter, string][]
            ).map(([k, l]) => (
              <button
                key={k}
                role="tab"
                aria-selected={filter === k}
                onClick={() => setFilter(k)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${filter === k ? 'bg-foreground text-background border-foreground' : 'border-border text-foreground'}`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* dias */}
          <div className="bg-card rounded-3xl border border-border/30 shadow-sm overflow-hidden divide-y divide-border/40">
            {days.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">Nenhum dia nesse filtro ainda.</p>}
            {days.map((day) => {
              const r = d.record(day);
              const dayMeals = mealsByDay[day] || [];
              const slept = sleepByDay.get(day);
              const isOpen = open === day;
              return (
                <div key={day}>
                  <button onClick={() => setOpen(isOpen ? null : day)} aria-expanded={isOpen} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition-colors">
                    <div className="w-11 text-center flex-shrink-0">
                      <p className="text-lg font-bold text-foreground leading-none tabular-nums">{day.slice(8)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{format(parseISO(day), 'MMM', { locale: ptBR }).replace('.', '')}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground first-letter:uppercase truncate">
                          {day === d.today ? 'Hoje' : format(parseISO(day), 'EEEE', { locale: ptBR }).split('-')[0]}
                        </p>
                        <StatusChip r={r} />
                      </div>
                      <div className="flex gap-1 mt-1.5">
                        {SHOWN.map((k) => {
                          const t = TONES[k];
                          const on = habitDone(k, r);
                          return (
                            <span key={k} title={t.label} className={`w-6 h-6 rounded-md flex items-center justify-center ${on ? t.bg : 'bg-secondary/50'}`}>
                              <t.icon className={`w-3.5 h-3.5 ${on ? t.fg : 'text-muted-foreground/30'}`} />
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-foreground tabular-nums">{slept ? `😴 ${fmtHours(slept.hours)}` : '–'}</p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">{num(r.waterMl / 1000, 1)} L</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-2 text-sm">
                          <Detail icon={<Utensils className="w-4 h-4 text-orange-500" />} title="Refeições">
                            {dayMeals.length ? (
                              dayMeals.map((m) => (
                                <span key={m.id} className="flex justify-between gap-3">
                                  <span className="min-w-0 break-words">{m.name}</span>
                                  <span className="tabular-nums text-muted-foreground">{m.time?.slice(0, 5)}</span>
                                </span>
                              ))
                            ) : (
                              <span>Nada registrado</span>
                            )}
                          </Detail>
                          {slept && (
                            <Detail icon={<Moon className="w-4 h-4 text-violet-500" />} title="Sono">
                              {fmtHours(slept.hours)}
                              {slept.bed && slept.wake ? ` · deitou ${slept.bed}, acordou ${slept.wake}` : ''}
                            </Detail>
                          )}
                          <Detail icon={<TONES.agua.icon className="w-4 h-4 text-sky-500" />} title="Água">
                            {num(r.waterMl / 1000, 2)} de {num(r.waterGoalMl / 1000, 2)} L
                          </Detail>
                          {injByDay.has(day) && (
                            <Detail icon={<Syringe className="w-4 h-4 text-indigo-500" />} title="Injeção">
                              {[injByDay.get(day)!.ml ? `${num(injByDay.get(day)!.ml!, 2)} ml` : null, injByDay.get(day)!.site].filter(Boolean).join(' · ') || 'Aplicada'}
                            </Detail>
                          )}
                          {weightByDay.has(day) && (
                            <Detail icon={<Scale className="w-4 h-4 text-violet-500" />} title="Pesagem">
                              {num(weightByDay.get(day)!)} kg
                            </Detail>
                          )}
                          {day === d.today && (
                            <button onClick={() => navigate('/dashboard')} className="text-xs font-semibold text-primary pt-1">
                              Marcar hábitos de hoje →
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
};

function StatusChip({ r }: { r: DayRecord }) {
  const perfect = isPerfect(r);
  const label = isSunday(r.date)
    ? 'Livre'
    : r.date < START
      ? 'Antes do desafio'
      : perfect
        ? r.coringa
          ? 'Coringa'
          : `Perfeito +${num(dayPoints(r))}`
        : `${dayPercent(r) / 25}/${CORE.length}`;
  const counts = perfect && !isSunday(r.date) && r.date >= START;
  return (
    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap ${counts ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
      {label}
    </span>
  );
}

function Detail({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-secondary/50 p-3">
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-muted-foreground">{title}</p>
        <div className="text-foreground text-sm flex flex-col gap-0.5">{children}</div>
      </div>
    </div>
  );
}

export default History;
