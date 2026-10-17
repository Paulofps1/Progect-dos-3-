import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck, Check, Clock, Hourglass, Plus, Swords, Trophy, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import AppLayout from '@/components/app/AppLayout';
import SectionHeader from '@/components/app/SectionHeader';
import { Button } from '@/components/ui/button';
import { PlayerPicker } from '@/components/desafio/DesafioParts';
import { TONES, type Tone } from '@/components/desafio/tones';
import { useAuth } from '@/hooks/useAuth';
import { useDesafio } from '@/hooks/useDesafio';
import { useEveryone } from '@/hooks/useEveryone';
import { useChallenges } from '@/hooks/useChallenges';
import {
  DURATIONS,
  TEMPLATES,
  dayIndex,
  endOf,
  fakeRecord,
  scores,
  statusOf,
  templateOf,
  type Challenge,
  type Metric,
  type Status,
} from '@/lib/desafio/challenges';
import { PLAYERS, ymd, type Player } from '@/lib/desafio/rules';

// Desafios entre os 3: alguém propõe, os outros dois aceitam, e só então vale.
// O placar sai do que cada um marca no dia a dia (Hoje).

const IS_DEMO = import.meta.env.MODE === 'demo';
const MEDALS = ['🥇', '🥈', '🥉'];
const PLAYER_COLOR: Record<Player, string> = { Paulo: 'bg-emerald-500', Arthur: 'bg-sky-500', Rafaela: 'bg-rose-500' };
const PERFECT_TONE: Tone = { ...TONES.comida, icon: CalendarCheck, label: 'Dias perfeitos', bg: 'bg-primary/15', fg: 'text-primary', bar: 'bg-primary' };
const toneOf = (m: Metric): Tone => (m === 'perfeito' ? PERFECT_TONE : TONES[m]);
const shortDay = (d: string) => format(parseISO(d), 'dd/MM');

const Challenges = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const d = useDesafio();
  const ch = useChallenges(d.player);
  const everyone = useEveryone();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const me = d.player;
  const recordOf = (p: Player, date: string) => {
    if (date > d.today) return undefined;
    if (p === me) return d.record(date);
    if (IS_DEMO) return fakeRecord(p, date);
    const o = everyone.data[p];
    return o ? o.days[date] : null; // null = ainda não entrou no app
  };

  const withStatus = ch.list.map((c) => ({ c, s: statusOf(c, me, d.today) }));
  const group = (...ss: Status[]) => withStatus.filter((x) => ss.includes(x.s));
  const invites = group('convite');
  const running = group('ativo', 'agendado');
  const waiting = group('aguardando');
  const done = group('encerrado');
  const cancelled = group('cancelado');

  return (
    <AppLayout activeNav="home">
      <motion.div initial={false} animate={{ opacity: 1 }} className="min-h-screen pb-28 lg:pb-8">
        <SectionHeader title="Desafios" subtitle="Mini-desafios entre os 3" backTo="/dashboard" icon={<Swords className="w-5 h-5 text-primary" />} />

        <div className="px-4 sm:px-6 lg:px-8 space-y-5 mt-6 max-w-2xl mx-auto">
          {!me && !d.loading && <PlayerPicker onPick={d.choosePlayer} />}

          {/* regra de ouro */}
          <div className="relative overflow-hidden bg-card rounded-3xl p-5 border border-border/30 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-violet-500/5 pointer-events-none" />
            <div className="relative flex items-center gap-4">
              <Avatars players={[...PLAYERS]} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Só vale com os 3</p>
                <p className="text-xs text-muted-foreground">Um propõe, os outros dois aceitam. Se alguém recusar, o desafio é cancelado.</p>
              </div>
            </div>
            <Button onClick={() => setCreating(true)} disabled={!me} className="relative w-full h-12 rounded-2xl font-semibold mt-4">
              <Plus className="w-5 h-5 mr-1" /> Novo desafio
            </Button>
            {!IS_DEMO && !ch.online && (
              <p className="relative text-[11px] text-muted-foreground mt-3">
                Sem conexão com o banco agora: os desafios aparecem para os outros quando voltar.
              </p>
            )}
          </div>

          {invites.length > 0 && (
            <Section title="Convites para você" icon={<Swords className="w-4 h-4 text-muted-foreground" />}>
              {invites.map(({ c }) => (
                <ChallengeCard key={c.id} c={c} status="convite" today={d.today}>
                  <p className="text-sm text-foreground mt-3">
                    <b>{c.createdBy}</b> desafiou vocês. Só começa quando os 3 aceitarem.
                  </p>
                  <AcceptRow c={c} />
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Button variant="outline" onClick={() => ch.decline(c.id)} className="rounded-xl h-11">
                      <X className="w-4 h-4 mr-1" /> Recusar
                    </Button>
                    <Button onClick={() => ch.accept(c.id)} className="rounded-xl h-11 font-semibold">
                      <Check className="w-4 h-4 mr-1" /> Aceitar
                    </Button>
                  </div>
                </ChallengeCard>
              ))}
            </Section>
          )}

          {running.length > 0 && (
            <Section title="Valendo" icon={<Trophy className="w-4 h-4 text-muted-foreground" />}>
              {running.map(({ c, s }) => (
                <ChallengeCard key={c.id} c={c} status={s} today={d.today}>
                  {s === 'agendado' ? (
                    <p className="text-sm text-muted-foreground mt-3">Os 3 aceitaram. Começa em {shortDay(c.start)}.</p>
                  ) : (
                    <Ranking c={c} today={d.today} me={me} recordOf={recordOf} />
                  )}
                </ChallengeCard>
              ))}
            </Section>
          )}

          {waiting.length > 0 && (
            <Section title="Esperando os outros" icon={<Hourglass className="w-4 h-4 text-muted-foreground" />}>
              {waiting.map(({ c }) => (
                <ChallengeCard key={c.id} c={c} status="aguardando" today={d.today}>
                  <AcceptRow c={c} />
                  {c.createdBy === me && (
                    <button onClick={() => ch.remove(c.id)} className="text-xs text-muted-foreground underline mt-3">
                      Desistir deste desafio
                    </button>
                  )}
                </ChallengeCard>
              ))}
            </Section>
          )}

          {done.length > 0 && (
            <Section title="Encerrados" icon={<Clock className="w-4 h-4 text-muted-foreground" />}>
              {done.map(({ c }) => (
                <ChallengeCard key={c.id} c={c} status="encerrado" today={d.today}>
                  <Ranking c={c} today={d.today} me={me} recordOf={recordOf} final />
                </ChallengeCard>
              ))}
            </Section>
          )}

          {cancelled.length > 0 && (
            <Section title="Cancelados" icon={<X className="w-4 h-4 text-muted-foreground" />}>
              {cancelled.map(({ c }) => (
                <div key={c.id} className="flex items-center gap-3 bg-card rounded-2xl border border-border/30 p-3 opacity-70">
                  <span className="flex-1 min-w-0 text-sm text-foreground truncate">
                    {templateOf(c.metric).title}
                    <span className="text-xs text-muted-foreground"> · {c.declinedBy ? `${c.declinedBy} recusou` : 'nem todos aceitaram a tempo'}</span>
                  </span>
                  <button onClick={() => ch.remove(c.id)} aria-label="Tirar da lista" className="text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </Section>
          )}

          {ch.list.length === 0 && (
            <div className="text-center py-8">
              <Swords className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum desafio ainda. Proponha o primeiro!</p>
            </div>
          )}
        </div>

        {/* fora da página (portal) para ficar por cima do menu de baixo */}
        {createPortal(
          <AnimatePresence>{creating && me && <NewChallenge me={me} today={d.today} onClose={() => setCreating(false)} onCreate={ch.create} />}</AnimatePresence>,
          document.body,
        )}
      </motion.div>
    </AppLayout>
  );
};

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Avatars({ players, dim = [] }: { players: Player[]; dim?: Player[] }) {
  return (
    <div className="flex -space-x-2 flex-shrink-0">
      {players.map((p) => (
        <span
          key={p}
          title={p}
          className={`w-9 h-9 rounded-full ${PLAYER_COLOR[p]} text-white text-sm font-bold flex items-center justify-center ring-2 ring-card ${dim.includes(p) ? 'opacity-30' : ''}`}
        >
          {p[0]}
        </span>
      ))}
    </div>
  );
}

function ChallengeCard({ c, status, today, children }: { c: Challenge; status: Status; today: string; children: React.ReactNode }) {
  const t = templateOf(c.metric);
  const tone = toneOf(c.metric);
  const badge: Record<Status, string> = {
    convite: 'Convite',
    aguardando: `${c.accepted.length} de 3 aceitaram`,
    agendado: 'Agendado',
    ativo: `Dia ${dayIndex(c, today)} de ${c.days}`,
    encerrado: 'Encerrado',
    cancelado: 'Cancelado',
  };
  return (
    <div className="bg-card rounded-3xl p-4 border border-border/30 shadow-sm">
      <div className="flex items-center gap-3">
        <span className={`w-11 h-11 rounded-xl ${tone.bg} flex items-center justify-center flex-shrink-0`}>
          <tone.icon className={`w-5 h-5 ${tone.fg}`} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{t.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {t.desc} · {shortDay(c.start)} a {shortDay(endOf(c))}
          </p>
        </div>
        <span className={`text-[10px] font-semibold rounded-full px-2 py-1 whitespace-nowrap ${status === 'ativo' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
          {badge[status]}
        </span>
      </div>
      {children}
    </div>
  );
}

function AcceptRow({ c }: { c: Challenge }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {PLAYERS.map((p) => {
        const ok = c.accepted.includes(p);
        return (
          <span key={p} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${ok ? 'bg-primary/15 text-foreground' : 'bg-secondary text-muted-foreground'}`}>
            {ok ? <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} /> : <Hourglass className="w-3.5 h-3.5" />}
            {p}
          </span>
        );
      })}
    </div>
  );
}

function Ranking({
  c,
  today,
  me,
  recordOf,
  final,
}: {
  c: Challenge;
  today: string;
  me: Player | null;
  recordOf: (p: Player, date: string) => ReturnType<typeof fakeRecord> | null | undefined;
  final?: boolean;
}) {
  const t = templateOf(c.metric);
  const tone = toneOf(c.metric);
  const list = scores(c, today, recordOf);
  const best = list[0]?.value ?? 0;
  const winners = list.filter((s) => s.value != null && s.value === best && best > 0).map((s) => s.player);
  return (
    <div className="mt-3">
      {final && (
        <p className="text-sm font-semibold text-foreground mb-2">
          {winners.length === 0 ? 'Ninguém pontuou' : winners.length === 1 ? `🏆 ${winners[0]} venceu` : `🏆 Empate: ${winners.join(' e ')}`}
        </p>
      )}
      <div className="space-y-2">
        {list.map((s) => (
          <div key={s.player} className="flex items-center gap-3">
            <span className="w-6 text-center text-lg">{s.value == null ? '·' : MEDALS[s.place - 1] ?? ''}</span>
            <span className={`w-7 h-7 rounded-full ${PLAYER_COLOR[s.player]} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>{s.player[0]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-foreground">
                  {s.player}
                  {s.player === me && <span className="text-muted-foreground font-normal"> · você</span>}
                </span>
                <span className="text-muted-foreground tabular-nums">{s.value == null ? 'ainda não entrou' : `${s.value}/${c.days}`}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1">
                <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${s.value == null ? 0 : (s.value / c.days) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">Conta {t.unit}, pelo que cada um marca em Hoje.</p>
    </div>
  );
}

function NewChallenge({ me, today, onClose, onCreate }: { me: Player; today: string; onClose: () => void; onCreate: (m: Metric, days: number, start: string) => void }) {
  const [metric, setMetric] = useState<Metric>('doce');
  const [days, setDays] = useState(7);
  const tomorrow = (() => {
    const x = parseISO(today);
    x.setDate(x.getDate() + 1);
    return ymd(x);
  })();
  const [start, setStart] = useState(tomorrow);
  const others = PLAYERS.filter((p) => p !== me);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-end justify-center" onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30 }}
        className="w-full max-w-lg bg-card rounded-t-3xl p-5 pb-8 border-t border-border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground text-center">Novo desafio</h3>
        <p className="text-xs text-muted-foreground text-center mt-1">Vai como convite para {others.join(' e ')}</p>

        <p className="text-xs font-medium text-muted-foreground mt-5 mb-2">Qual?</p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => {
            const tone = toneOf(t.id);
            const on = metric === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setMetric(t.id)}
                aria-pressed={on}
                className={`rounded-2xl p-3 text-left border transition-colors ${on ? 'bg-primary/15 border-primary/50' : 'bg-secondary/60 border-transparent'}`}
              >
                <span className={`w-9 h-9 rounded-xl ${tone.bg} flex items-center justify-center`}>
                  <tone.icon className={`w-4 h-4 ${tone.fg}`} />
                </span>
                <span className="block text-sm font-semibold text-foreground mt-2">{t.title}</span>
                <span className="block text-[11px] text-muted-foreground leading-snug">{t.desc}</span>
              </button>
            );
          })}
        </div>

        <p className="text-xs font-medium text-muted-foreground mt-5 mb-2">Quantos dias?</p>
        <div className="grid grid-cols-3 gap-2">
          {DURATIONS.map((n) => (
            <button key={n} onClick={() => setDays(n)} aria-pressed={days === n} className={`rounded-xl py-2.5 text-sm font-semibold border ${days === n ? 'bg-foreground text-background border-foreground' : 'border-border text-foreground'}`}>
              {n} dias
            </button>
          ))}
        </div>

        <p className="text-xs font-medium text-muted-foreground mt-5 mb-2">Começa</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            [today, 'Hoje'],
            [tomorrow, 'Amanhã'],
          ].map(([v, l]) => (
            <button key={v} onClick={() => setStart(v)} aria-pressed={start === v} className={`rounded-xl py-2.5 text-sm font-semibold border ${start === v ? 'bg-foreground text-background border-foreground' : 'border-border text-foreground'}`}>
              {l} · {shortDay(v)}
            </button>
          ))}
        </div>

        <Button
          onClick={() => {
            onCreate(metric, days, start);
            onClose();
          }}
          className="w-full h-12 rounded-2xl font-semibold mt-6"
        >
          <Swords className="w-5 h-5 mr-2" /> Desafiar {others.join(' e ')}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center mt-2">Só começa a contar quando os 3 aceitarem.</p>
      </motion.div>
    </motion.div>
  );
}

export default Challenges;
