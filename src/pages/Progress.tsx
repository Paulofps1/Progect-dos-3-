import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarCheck, Flame, Scale, Ticket, Trash2, Utensils, Droplets, Dumbbell, Loader2, Moon } from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/app/AppLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useDesafio } from '@/hooks/useDesafio';
import { supabase } from '@/integrations/supabase/client';
import { MonthCalendar, PlayerPicker } from '@/components/desafio/DesafioParts';
import { TONES } from '@/components/desafio/tones';
import { ProofSheet } from '@/components/desafio/ProofSheet';
import type { ProofKind } from '@/lib/desafio/proofs';
import {
  END,
  INITIAL_WEIGHTS,
  JOKERS,
  START,
  dayPercent,
  dayPoints,
  daysBetween,
  fmtDay,
  fmtHours,
  habitDone,
  isPerfect,
  isSunday,
  jokersLeftOf,
  monthDays,
  needsProof,
  RULES_V2,
  num,
  type DayRecord,
  type HabitKey,
} from '@/lib/desafio/rules';
import { toast } from 'sonner';

// Resumo de tudo: pontos e andamento, mês (calendário, dia tocado e gráfico),
// pesagens e médias de sono, água e treinos. Marcar hábitos é em Hoje.

const Progress = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const d = useDesafio();
  const [sel, setSel] = useState(d.today);
  const [month, setMonth] = useState(d.today.slice(0, 7));

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const used = Object.values(d.days).filter((r) => r.coringa).length;
  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd')), []);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const slept7 = d.sleep.filter((s) => !s.nap && last7.includes(s.date)).map((s) => s.hours);
  const avgSleep = slept7.length ? slept7.reduce((a, b) => a + b, 0) / slept7.length : null;
  const avgWater = avg(last7.map((x) => d.record(x).waterMl));
  const workouts7 = last7.filter((x) => d.record(x).treino).length;

  // progresso do mês: só dias do desafio que já passaram, sem domingo
  const mDays = monthDays(month);
  const past = mDays.filter((x) => x >= START && x <= d.today && !isSunday(x));
  const vals = past.map((x) => dayPercent(d.record(x)));
  const monthAvg = avg(vals);
  const monthPerfect = past.filter((x) => isPerfect(d.record(x))).length;
  const X = (i: number) => 36 + (i * 270) / Math.max(1, mDays.length - 1);
  const Y = (v: number) => 100 - v * 0.88;
  const idx = past.map((x) => mDays.indexOf(x));
  const line = vals.map((v, i) => `${X(idx[i])},${Y(v)}`).join(' ');

  const s = d.myStats;
  const total = daysBetween(START, END) + 1;
  const elapsed = d.today < START ? 0 : daysBetween(START, d.today) + 1;

  return (
    <AppLayout activeNav="progress">
      <motion.div initial={false} animate={{ opacity: 1 }} className="min-h-screen pb-28 lg:pb-8">
        <div className="px-4 sm:px-6 pt-6 space-y-4 max-w-2xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Resumo</h1>
            <p className="text-sm text-muted-foreground">Tudo do seu desafio num lugar só</p>
          </div>

          {!d.player && !d.loading && <PlayerPicker onPick={d.choosePlayer} />}

          {/* Destaque: pontos e o andamento do desafio */}
          <section className="relative overflow-hidden bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-sky-500/5 pointer-events-none" />
            <div className="relative flex items-center gap-5">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Seus pontos</p>
                <p className="text-5xl font-bold text-foreground leading-none mt-1 tabular-nums">{s ? num(s.pts) : '–'}</p>
                {s && s.pct !== 0 && (
                  <p className={`text-xs font-semibold mt-2 ${s.pct > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {num(s.pct)}% {s.pct > 0 ? 'de peso perdido' : 'de peso a mais'}
                  </p>
                )}
              </div>
              <div className="flex-1 grid gap-2">
                <MiniPill icon={<Flame className="w-4 h-4 text-orange-500" />} value={s ? String(s.run) : '–'} label="seguidos" />
                <MiniPill icon={<CalendarCheck className="w-4 h-4 text-primary" />} value={s ? String(s.perfect) : '–'} label="dias perfeitos" />
                <MiniPill icon={<Ticket className="w-4 h-4 text-amber-600" />} value={`${jokersLeftOf(used)}/${JOKERS}`} label="coringas" />
              </div>
            </div>
            <div className="relative mt-5">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{elapsed > 0 ? `Dia ${Math.min(elapsed, total)} de ${total}` : 'Começa em 19/10'}</span>
                <span>termina em 20/12</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden mt-1.5">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }} />
              </div>
            </div>
          </section>

          {/* Mês: calendário + o que rolou no dia tocado */}
          <section className="bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
            {d.loading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <MonthCalendar month={month} setMonth={setMonth} selected={sel} onSelect={setSel} today={d.today} record={d.record} />
                <DayDetail record={d.record(sel)} today={d.today} d={d} />
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Média do mês</p>
                    <p className="text-2xl font-bold text-foreground">{monthAvg}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Perfeitos no mês</p>
                    <p className="text-2xl font-bold text-foreground">{monthPerfect}</p>
                  </div>
                </div>
                <svg viewBox="0 0 320 110" width="100%" role="img" aria-label={`Média do mês ${monthAvg}%`} className="mt-2 max-h-40">
                  {[0, 50, 100].map((v) => (
                    <g key={v}>
                      <line x1="30" x2="308" y1={Y(v)} y2={Y(v)} stroke="hsl(var(--border))" strokeDasharray={v ? '3 4' : undefined} />
                      <text x="24" y={Y(v) + 3} textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))">{v}%</text>
                    </g>
                  ))}
                  {vals.length > 1 && <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={line} />}
                  {vals.length > 0 && <circle cx={X(idx[idx.length - 1])} cy={Y(vals[vals.length - 1])} r="3.5" fill="hsl(var(--primary))" />}
                  {vals.length === 0 && (
                    <text x="168" y="60" textAnchor="middle" fontSize="12" fill="hsl(var(--muted-foreground))">
                      Sem dias do desafio neste mês
                    </text>
                  )}
                </svg>
              </>
            )}
          </section>

          <Weights d={d} />

          {/* Últimos 7 dias */}
          <section className="bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-3">Últimos 7 dias</h3>
            <div className="grid grid-cols-3 gap-3">
              <MiniStat icon={<Moon className="w-4 h-4 text-violet-500" />} value={avgSleep ? fmtHours(avgSleep) : '–'} label="de sono/noite" />
              <MiniStat icon={<Droplets className="w-4 h-4 text-info" />} value={num(avgWater / 1000, 1)} label="L de água/dia" />
              <MiniStat icon={<Dumbbell className="w-4 h-4 text-detail" />} value={String(workouts7)} label="treinos" />
            </div>
          </section>
        </div>
      </motion.div>
    </AppLayout>
  );
};

function MiniPill({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2">
      {icon}
      <span className="text-sm font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * O dia tocado no calendário. Dias que já passaram (desde o início) dá para marcar
 * aqui também: serve para quem esqueceu de marcar no dia.
 */
function DayDetail({ record, today, d }: { record: DayRecord; today: string; d: ReturnType<typeof useDesafio> }) {
  const navigate = useNavigate();
  const [proof, setProof] = useState<ProofKind | null>(null);
  const editable = record.date >= START && record.date <= today;
  const tap = (k: HabitKey) => {
    if (!editable) return;
    const on = habitDone(k, record);
    if (k === 'agua') return on ? toast('Água de um dia que passou só dá para completar, não tirar') : d.fillWater(record.date);
    if (k === 'comida' && record.date >= RULES_V2) return navigate('/meals'); // automático: fotos dos pratos
    if (needsProof(k, record.date) && !record.cardio) return setProof(k as ProofKind);
    d.toggle(record.date, k);
  };
  const perfect = isPerfect(record);
  const pts = dayPoints(record);
  const label = record.date === today ? 'Hoje' : format(parseISO(record.date), "EEEE, dd/MM", { locale: ptBR });
  const keys: HabitKey[] = ['agua', 'treino', 'comida', 'doce', 'cardio', 'passos'];
  return (
    <div className="mt-4 rounded-2xl bg-secondary/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground first-letter:uppercase">{label}</p>
        <span className={`text-[11px] font-semibold rounded-full px-2 py-0.5 ${perfect ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}>
          {isSunday(record.date) ? 'Domingo livre' : perfect ? (record.coringa ? 'Coringa' : `Perfeito · +${num(pts)}`) : `${dayPercent(record) / 25} de 4`}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {keys.map((k) => {
          const t = TONES[k];
          const on = habitDone(k, record);
          return (
            <button
              key={k}
              title={t.label}
              onClick={() => tap(k)}
              disabled={!editable}
              aria-pressed={on}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] ${on ? `${t.bg} text-foreground font-medium` : `bg-background/60 text-muted-foreground/60 ${editable ? '' : 'line-through'}`}`}
            >
              <t.icon className={`w-3.5 h-3.5 ${on ? t.fg : ''}`} />
              {t.label}
            </button>
          );
        })}
      </div>
      {editable && record.date !== today && (
        <div className="flex items-center justify-between gap-2 mt-2">
          <p className="text-[10px] text-muted-foreground">Esqueceu de marcar? Toque nos itens deste dia.</p>
          {!isSunday(record.date) && (
            <button onClick={() => d.toggle(record.date, 'coringa')} className="text-[11px] font-semibold text-amber-600 whitespace-nowrap">
              {record.coringa ? 'Tirar coringa' : 'Usar coringa'}
            </button>
          )}
        </div>
      )}
      <ProofSheet kind={proof} onClose={() => setProof(null)} onSend={(kind, photo) => d.markWithProof(record.date, kind, photo)} />
    </div>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      {icon}
      <p className="text-lg font-bold text-foreground mt-1">{value}</p>
      <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

function Weights({ d }: { d: ReturnType<typeof useDesafio> }) {
  const [kg, setKg] = useState('');
  const initial = d.player ? INITIAL_WEIGHTS[d.player] : null;
  const list = [...d.weights].sort((a, b) => (a.date < b.date ? 1 : -1));
  const s = d.myStats;
  return (
    <section className="bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Scale className="w-4 h-4 text-muted-foreground" /> Pesagens
        </h3>
        {s && s.pct !== 0 && (
          <span className={`text-xs font-semibold ${s.pct > 0 ? 'text-primary' : 'text-destructive'}`}>
            <Flame className="inline w-3.5 h-3.5 -mt-0.5" /> {num(s.pct)}% {s.pct > 0 ? 'perdido' : 'a mais'}
          </span>
        )}
      </div>
      <form
        className="flex gap-2 mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          const v = parseFloat(kg.replace(',', '.'));
          if (!(v > 30 && v < 300)) return toast.error('Peso inválido');
          d.saveWeight(Math.round(v * 10) / 10);
          setKg('');
          toast.success('Pesagem registrada');
        }}
      >
        <input
          value={kg}
          onChange={(e) => setKg(e.target.value)}
          inputMode="decimal"
          placeholder="kg em jejum (ex.: 92,8)"
          className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
        />
        <Button type="submit" className="rounded-xl">Registrar</Button>
      </form>
      <div className="divide-y divide-border mt-2">
        {list.map((w) => (
          <div key={w.date} className="flex items-center gap-3 py-2.5">
            <span className="flex-1 text-sm text-foreground">{fmtDay(w.date)}</span>
            <b className="text-sm text-foreground">{num(w.kg)} kg</b>
            <button
              onClick={() => confirm(`Apagar a pesagem de ${fmtDay(w.date)}?`) && d.removeWeight(w.date)}
              aria-label="Apagar pesagem"
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {initial != null && (
          <div className="flex items-center gap-3 py-2.5">
            <span className="flex-1 text-sm text-foreground">
              {fmtDay(START)} <span className="text-muted-foreground">· peso inicial</span>
            </span>
            <b className="text-sm text-foreground">{num(initial)} kg</b>
            <span className="w-8" />
          </div>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">A cada 2 semanas, em jejum. Desempate: maior % perdido.</p>
    </section>
  );
}

export default Progress;
