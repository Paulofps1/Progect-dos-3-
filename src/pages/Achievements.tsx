import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarCheck, Flame, Plus, Scale, Sun, Swords, Ticket, Trophy } from 'lucide-react';
import { TONES } from '@/components/desafio/tones';
import { format, parseISO, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/app/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useDesafio } from '@/hooks/useDesafio';
import { useEveryone } from '@/hooks/useEveryone';
import { useChallenges } from '@/hooks/useChallenges';
import { challengePoints } from '@/lib/desafio/challenges';
import { ProofThumbs } from '@/components/desafio/ProofThumbs';
import { PlayerPicker } from '@/components/desafio/DesafioParts';
import {
  BONUS,
  BONUS_ENABLED,
  CORE,
  habitDone,
  type DayRecord,
  END,
  INITIAL_WEIGHTS,
  JOKERS,
  PLAYERS,
  PRIZE,
  START,
  daysBetween,
  stats,
  isPerfect,
  isSunday,
  num,
  ymd,
} from '@/lib/desafio/rules';

// Placar do campeonato. Ordem: pontos (dias perfeitos, bônus, sequência e desafios do
// grupo); empate vai para quem perdeu a maior % de peso. Os seus números saem deste
// aparelho; os dos outros, do resumo que cada um manda para o banco. Tocar num nome
// mostra o dia de hoje dele, com as fotos de prova.

const MEDALS = ['🥇', '🥈', '🥉'];

const Achievements = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const d = useDesafio();
  const everyone = useEveryone();
  const ch = useChallenges(d.player);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const started = d.today >= START;
  const left = Math.max(0, daysBetween(d.today, END));
  const statsOf = (p: (typeof PLAYERS)[number]) => {
    if (p === d.player) return stats(d.days, d.today, p, d.weights, challengePoints(ch.list, p, (x) => d.days[x], d.today));
    const o = everyone.data[p];
    return o ? stats(o.days, d.today, p, o.weights, challengePoints(ch.list, p, (x) => o.days[x], d.today)) : null;
  };
  const todayOf = (p: (typeof PLAYERS)[number]) => (p === d.player ? d.record(d.today) : everyone.data[p]?.days[d.today]);
  const userIdOf = (p: (typeof PLAYERS)[number]) => (p === d.player ? user?.id : everyone.data[p]?.userId);
  const rows = PLAYERS.map((p) => ({ p, s: statsOf(p) })).sort(
    (a, b) => (b.s?.pts ?? -1) - (a.s?.pts ?? -1) || (b.s?.pct ?? 0) - (a.s?.pct ?? 0),
  );

  const weekStart = startOfWeek(parseISO(started ? d.today : START));
  const week = Array.from({ length: 7 }, (_, i) => ymd(addDays(weekStart, i)));

  return (
    <AppLayout activeNav="achievements">
      <motion.div initial={false} animate={{ opacity: 1 }} className="min-h-screen pb-28 lg:pb-8">
        <div className="px-4 sm:px-6 pt-6 space-y-4 max-w-2xl mx-auto">
          {/* Cabeçalho */}
          <div className="rounded-3xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent border border-primary/20 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Desafio dos 4</p>
                <h1 className="text-2xl font-bold text-foreground">Placar</h1>
              </div>
              <span className="rounded-full bg-foreground text-background text-xs font-bold px-3 py-1">{PRIZE}</span>
            </div>
            <p className="text-sm text-foreground mt-3">
              {started ? (
                <>
                  Faltam <b>{left}</b> dias · termina em 20/12
                </>
              ) : (
                'Começa em 19/10'
              )}
            </p>
            <div className="h-1.5 rounded-full bg-background/60 overflow-hidden mt-2">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, (daysBetween(START, d.today) / daysBetween(START, END)) * 100))}%` }}
              />
            </div>
          </div>

          {!d.player && !d.loading && <PlayerPicker onPick={d.choosePlayer} />}

          {/* Ranking */}
          <section className="bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-warning" />
              <h3 className="text-sm font-semibold text-foreground">Classificação</h3>
            </div>
            <p className="text-[11px] text-muted-foreground mb-1">Por pontos · empate: quem perdeu mais % de peso</p>
            {rows.map(({ p, s }, i) => (
              <div key={p} className={i ? 'border-t border-border' : ''}>
              <button onClick={() => setOpen(open === p ? null : p)} aria-expanded={open === p} className="w-full flex items-center gap-3 py-3 text-left">
                <span className="text-2xl w-8 text-center">{s ? MEDALS[i] : '·'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    {p}
                    {p === d.player && <span className="text-xs font-normal text-muted-foreground"> · você</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s
                      ? `${num(s.first)} → ${num(s.last)} kg${s.pct > 0 ? ` (−${num(s.pct)}%)` : ''} · 🔥 ${s.run} seguidos${s.challengePts ? ` · ⚔️ +${s.challengePts}` : ''}`
                      : `${num(INITIAL_WEIGHTS[p])} kg no início · ${everyone.ready ? 'ainda não entrou no app' : 'carregando…'}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground leading-none">{s ? num(s.pts) : '–'}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">pontos</p>
                </div>
              </button>
              {open === p && <TodayOf record={todayOf(p)} userId={userIdOf(p)} today={d.today} />}
              </div>
            ))}
          </section>

          {/* Semana */}
          {d.player && (
            <section className="bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground">Sua semana</h3>
              <div className="grid grid-cols-7 gap-1.5 mt-3 text-center">
                {week.map((day) => {
                  const r = d.record(day);
                  const ok = isPerfect(r);
                  const future = day > d.today;
                  return (
                    <div key={day}>
                      <div
                        className={`aspect-square rounded-xl flex items-center justify-center text-sm ${
                          isSunday(day) ? 'bg-secondary/50 text-muted-foreground' : ok ? 'bg-primary text-primary-foreground font-bold' : future ? 'bg-secondary/40' : 'bg-secondary'
                        } ${day === d.today ? 'ring-2 ring-foreground/20' : ''}`}
                      >
                        {isSunday(day) ? '–' : ok ? '✓' : ''}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 first-letter:uppercase">
                        {format(parseISO(day), 'EEEEE', { locale: ptBR })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Regras */}
          <section className="space-y-2.5">
            <h3 className="text-sm font-semibold text-foreground px-1">Regras</h3>

            <RuleTile wide icon={<CalendarCheck className="w-5 h-5 text-primary" />} tint="bg-primary/15" value="1 pt" title="Dia perfeito">
              <span className="block">Fechar os 4 no mesmo dia (pratos = no mínimo 2 refeições com foto):</span>
              <span className="flex flex-wrap gap-1.5 mt-2">
                {CORE.map((k) => {
                  const t = TONES[k];
                  return (
                    <span key={k} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-foreground ${t.bg}`}>
                      <t.icon className={`w-3.5 h-3.5 ${t.fg}`} />
                      {k === 'agua' ? 'Água na meta' : t.label}
                    </span>
                  );
                })}
              </span>
            </RuleTile>

            <div className="grid grid-cols-2 gap-2.5">
              <RuleTile icon={<Plus className="w-5 h-5 text-orange-500" />} tint="bg-orange-500/15" value={BONUS_ENABLED ? '+0,5' : 'Off'} title="Bônus">
                {BONUS_ENABLED ? 'Exercício extra: cardio (com print) ou caminhada de 4 km no dia. Até +1 por dia, só em dia perfeito.' : 'Desligados por enquanto.'}
              </RuleTile>
              <RuleTile icon={<Flame className="w-5 h-5 text-red-500" />} tint="bg-red-500/15" value="+1" title="Sequência">
                A cada 7 dias perfeitos seguidos.
              </RuleTile>
              <RuleTile icon={<Ticket className="w-5 h-5 text-amber-600" />} tint="bg-amber-500/15" value={String(JOKERS)} title="Coringas">
                Por pessoa, no desafio todo. Cada um salva um dia.
              </RuleTile>
              <RuleTile icon={<Sun className="w-5 h-5 text-sky-500" />} tint="bg-sky-500/15" value="Livre" title="Domingo">
                Não conta ponto nem quebra a sequência.
              </RuleTile>
            </div>

            <RuleTile wide icon={<Swords className="w-5 h-5 text-amber-500" />} tint="bg-amber-500/15" value="+1" title="Desafios do grupo">
              Enquanto um desafio está valendo (todos aceitaram), cada dia cumprido vale +1 no placar. Não cumpriu, não ganha.
            </RuleTile>

            <RuleTile wide icon={<Scale className="w-5 h-5 text-violet-500" />} tint="bg-violet-500/15" value="2 sem." title="Pesagem">
              O foco é a disciplina: ganha quem fizer mais pontos. Pesagem em jejum, a cada 2 semanas; se empatar nos pontos, ganha quem perdeu a maior % de peso.
            </RuleTile>

            <p className="text-[11px] text-muted-foreground text-center px-4 pt-1">Injeção é só registro (não vale ponto); dose e intervalo são com o médico.</p>
          </section>
        </div>
      </motion.div>
    </AppLayout>
  );
};

function RuleTile({ icon, tint, value, title, children, wide }: { icon: React.ReactNode; tint: string; value: string; title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`bg-card rounded-3xl border border-border/30 shadow-sm p-4 ${wide ? '' : 'flex flex-col'}`}>
      <div className="flex items-center gap-3">
        <span className={`w-10 h-10 rounded-xl ${tint} flex items-center justify-center flex-shrink-0`}>{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-2.5 leading-relaxed">{children}</div>
    </div>
  );
}

export default Achievements;

/** O dia de hoje de um participante: o que já fechou e as fotos de prova. */
function TodayOf({ record, userId, today }: { record?: DayRecord; userId?: string; today: string }) {
  if (!record) return <p className="text-xs text-muted-foreground pb-3 pl-11">Nada marcado hoje ainda.</p>;
  return (
    <div className="pb-3 pl-11 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {[...CORE, ...BONUS].map((k) => {
          const t = TONES[k];
          const on = habitDone(k, record);
          return (
            <span key={k} className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium ${on ? `${t.bg} text-foreground` : 'bg-secondary/60 text-muted-foreground/60'}`}>
              <t.icon className={`w-3.5 h-3.5 ${on ? t.fg : ''}`} />
              {k === 'comida' ? `${record.mealPhotos ?? 0} pratos` : t.label}
            </span>
          );
        })}
      </div>
      {userId && <ProofThumbs userId={userId} date={today} treino={!!record.provaTreino} cardio={!!record.provaCardio} />}
    </div>
  );
}
