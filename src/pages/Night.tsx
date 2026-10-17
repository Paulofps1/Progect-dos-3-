import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BedDouble, Check, Minus, Moon, Play, Plus, Square, Trash2 } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/app/AppLayout';
import SectionHeader from '@/components/app/SectionHeader';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useDesafio } from '@/hooks/useDesafio';
import { num } from '@/lib/desafio/rules';
import { toast } from 'sonner';

// Noite: opcional, NÃO é regra e não vale ponto (tem quem tenha insônia).
// 1) Rotina para desacelerar: um timer que começa na hora que a pessoa quiser.
// 2) Registro de sono: quanto dormiu, de meia em meia hora, inclusive cochilo.

const ROUTINE_KEY = 'desafio:noite-rotina';
const DURATIONS = [15, 30, 45, 60];
const STEPS = [
  { id: 'tela', label: 'Celular e TV longe' },
  { id: 'luz', label: 'Luz baixa' },
  { id: 'banho', label: 'Banho morno' },
  { id: 'respirar', label: 'Respirar devagar por 2 min' },
  { id: 'ler', label: 'Ler ou ouvir algo calmo' },
];

type Routine = { endsAt: number | null; minutes: number; done: Record<string, string> }; // done: passo → data

function readRoutine(): Routine {
  try {
    return { endsAt: null, minutes: 30, done: {}, ...JSON.parse(localStorage.getItem(ROUTINE_KEY) || '{}') };
  } catch {
    return { endsAt: null, minutes: 30, done: {} };
  }
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const hoursLabel = (h: number) => `${num(h)} h`;
const longDay = (d: string) => format(parseISO(d), "EEE, dd/MM", { locale: ptBR });

const Night = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const d = useDesafio();
  const [routine, setRoutine] = useState<Routine>(readRoutine);
  const [now, setNow] = useState(Date.now());
  const [hours, setHours] = useState(7);
  const [nap, setNap] = useState(false);
  // a noite de ontem para hoje conta como "ontem" se ainda for de manhã
  const [date, setDate] = useState(() => (new Date().getHours() < 14 ? format(subDays(new Date(), 1), 'yyyy-MM-dd') : d.today));

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const save = (r: Routine) => {
    setRoutine(r);
    try {
      localStorage.setItem(ROUTINE_KEY, JSON.stringify(r));
    } catch {
      /* segue só na tela */
    }
  };

  const running = routine.endsAt !== null && routine.endsAt > now;
  useEffect(() => {
    if (routine.endsAt === null) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [routine.endsAt]);
  useEffect(() => {
    if (routine.endsAt !== null && routine.endsAt <= now) {
      save({ ...routine, endsAt: null });
      toast('Rotina concluída. Boa noite 🌙');
      navigator.vibrate?.(200);
    }
  }, [now, routine]);

  const left = routine.endsAt ? routine.endsAt - now : routine.minutes * 60_000;
  const progress = running ? 1 - left / (routine.minutes * 60_000) : 0;
  const tonight = d.today;
  const doneToday = (id: string) => routine.done[id] === tonight;

  const recent = useMemo(() => {
    const since = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const nights = d.sleep.filter((s) => !s.nap && s.date >= since);
    const byDay = new Map<string, number>();
    for (const s of nights) byDay.set(s.date, (byDay.get(s.date) || 0) + s.hours);
    const vals = [...byDay.values()];
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  }, [d.sleep]);

  const addSleep = () => {
    if (date > d.today) return toast.error('Escolha hoje ou um dia que já passou');
    d.addSleep({ date, hours, nap: nap || undefined });
    toast.success(nap ? `Cochilo de ${hoursLabel(hours)} anotado` : `${hoursLabel(hours)} de sono anotadas`);
  };

  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <AppLayout activeNav="home">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen pb-28 lg:pb-8">
        <SectionHeader title="Noite" subtitle="Opcional · só para ajudar no foco" backTo="/dashboard" icon={<Moon className="w-5 h-5 text-violet-500" />} />

        <div className="px-4 sm:px-6 lg:px-8 space-y-5 mt-6 max-w-2xl mx-auto">
          <p className="text-xs text-muted-foreground text-center px-4">
            Não é regra e não vale ponto. Use se ajudar, do jeito que der.
          </p>

          {/* Rotina para dormir */}
          <section className="relative overflow-hidden bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/5 pointer-events-none" />
            <div className="relative">
              <h3 className="text-sm font-semibold text-foreground">Rotina para desacelerar</h3>
              <p className="text-xs text-muted-foreground">Começa na hora que você quiser</p>

              <div className="flex items-center gap-5 mt-4">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r={R} className="stroke-violet-500/15" strokeWidth="10" fill="none" />
                    <circle
                      cx="60"
                      cy="60"
                      r={R}
                      className="stroke-violet-500 transition-[stroke-dashoffset] duration-1000 ease-linear"
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={C}
                      strokeDashoffset={C * (1 - progress)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground tabular-nums">{mmss(left)}</span>
                    <span className="text-[10px] text-muted-foreground">{running ? 'restando' : 'minutos'}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  {!running && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {DURATIONS.map((m) => (
                        <button
                          key={m}
                          onClick={() => save({ ...routine, minutes: m })}
                          className={`h-9 rounded-xl text-sm font-medium transition-colors ${
                            routine.minutes === m ? 'bg-violet-500 text-white' : 'bg-secondary text-foreground'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                  {running ? (
                    <Button variant="secondary" className="w-full h-11 rounded-2xl" onClick={() => save({ ...routine, endsAt: null })}>
                      <Square className="w-4 h-4 mr-2" /> Parar
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-11 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white"
                      onClick={() => {
                        const n = Date.now();
                        setNow(n);
                        save({ ...routine, endsAt: n + routine.minutes * 60_000 });
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" /> Começar
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-1.5">
                {STEPS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      const done = { ...routine.done };
                      if (doneToday(s.id)) delete done[s.id];
                      else done[s.id] = tonight;
                      save({ ...routine, done });
                    }}
                    className="w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 bg-secondary/60 text-left"
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        doneToday(s.id) ? 'bg-violet-500 text-white' : 'border-2 border-border'
                      }`}
                    >
                      {doneToday(s.id) && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span className={`text-sm ${doneToday(s.id) ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Registro de sono */}
          <section className="bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Quanto você dormiu</h3>
                <p className="text-xs text-muted-foreground">De meia em meia hora · cochilo também vale</p>
              </div>
              {recent !== null && (
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground leading-none">{hoursLabel(Math.round(recent * 10) / 10)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">média 7 dias</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-6 mt-5">
              <button
                onClick={() => setHours((h) => Math.max(0.5, h - 0.5))}
                className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
                aria-label="Menos meia hora"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="text-center w-24">
                <span className="text-4xl font-bold text-foreground tabular-nums">{num(hours)}</span>
                <span className="text-sm text-muted-foreground ml-1">h</span>
              </div>
              <button
                onClick={() => setHours((h) => Math.min(16, h + 0.5))}
                className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
                aria-label="Mais meia hora"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-5">
              {[false, true].map((n) => (
                <button
                  key={String(n)}
                  onClick={() => setNap(n)}
                  className={`h-10 rounded-xl text-sm font-medium transition-colors ${nap === n ? 'bg-foreground text-background' : 'bg-secondary text-foreground'}`}
                >
                  {n ? 'Cochilo' : 'Noite'}
                </button>
              ))}
            </div>

            <label className="flex items-center justify-between mt-3 text-sm">
              <span className="text-muted-foreground">Dia</span>
              <input
                type="date"
                value={date}
                max={d.today}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="bg-secondary rounded-xl px-3 h-10 text-foreground"
              />
            </label>

            <Button className="w-full h-12 rounded-2xl font-semibold mt-4" onClick={addSleep}>
              <BedDouble className="w-5 h-5 mr-2" /> Anotar
            </Button>

            {d.sleep.length > 0 && (
              <div className="mt-5 divide-y divide-border">
                {d.sleep.slice(0, 14).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                      {s.nap ? '😴' : '🌙'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground first-letter:uppercase">{longDay(s.date)}</p>
                      <p className="text-xs text-muted-foreground">{s.nap ? 'Cochilo' : 'Noite'}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{hoursLabel(s.hours)}</span>
                    <button onClick={() => d.removeSleep(s.id)} className="text-muted-foreground p-1" aria-label="Apagar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </motion.div>
    </AppLayout>
  );
};

export default Night;
