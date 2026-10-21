import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Coins } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AppLayout from '@/components/app/AppLayout';
import SectionHeader from '@/components/app/SectionHeader';
import { TONES } from '@/components/desafio/tones';
import { ProofThumbs } from '@/components/desafio/ProofThumbs';
import { useAuth } from '@/hooks/useAuth';
import { useDesafio } from '@/hooks/useDesafio';
import { useEveryone } from '@/hooks/useEveryone';
import { useChallenges } from '@/hooks/useChallenges';
import { challengePoints } from '@/lib/desafio/challenges';
import type { ProofKind } from '@/lib/desafio/proofs';
import { CORE, ITEM_PTS, PARTIAL_FROM, PERFECT_EXTRA, PLAYERS, bonusOf, habitDone, ledger, type DayRecord, type LedgerDay, type Player } from '@/lib/desafio/rules';

// Extrato de pontos: de onde veio cada ponto, dia a dia, de você ou de qualquer um dos 4.
// Tocar num dia mostra a conta e as fotos de prova (caminhada) daquele dia.

/** 1,5 · 0,75 · 2 (sem zeros sobrando) */
const fmt = (n: number) => String(+n.toFixed(2)).replace('.', ',');
const pts = (n: number) => `${n > 0 ? '+' : ''}${fmt(n)}`;

const Points = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const d = useDesafio();
  const everyone = useEveryone();
  const ch = useChallenges(d.player);
  const [who, setWho] = useState<Player | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  const p = who ?? d.player;
  const mine = p === d.player;
  const days = mine ? d.days : p ? everyone.data[p]?.days : undefined;
  const userId = mine ? user?.id : p ? everyone.data[p]?.userId : undefined;
  const recordOf = (day: string): DayRecord | undefined => (mine ? d.record(day) : days?.[day]);

  const list = useMemo(() => (days ? ledger(days, d.today) : []), [days, d.today]);
  const extraCh = p && days ? challengePoints(ch.list, p, (x) => days[x], d.today) : 0;
  const sum = (f: (x: LedgerDay) => number) => list.reduce((a, x) => a + f(x), 0);
  const parts: [string, number][] = [
    ['Itens feitos', sum((x) => x.base)],
    ['Fechou os 4', sum((x) => x.extra)],
    ['Caminhada', sum((x) => x.bonus)],
    ['Sequência de 7', sum((x) => x.streak)],
    ['Desafios do grupo', extraCh],
  ];
  const total = parts.reduce((a, [, v]) => a + v, 0);

  return (
    <AppLayout activeNav="profile">
      <motion.div initial={false} animate={{ opacity: 1 }} className="min-h-screen pb-28 lg:pb-8">
        <SectionHeader title="Pontos" subtitle="De onde veio cada ponto, dia a dia" backTo="/profile" icon={<Coins className="w-5 h-5 text-primary" />} />

        <div className="px-4 sm:px-6 lg:px-8 space-y-4 mt-6 max-w-2xl mx-auto">
          {/* de quem */}
          <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Ver pontos de">
            {PLAYERS.map((x) => (
              <button
                key={x}
                role="tab"
                aria-selected={p === x}
                onClick={() => {
                  setWho(x);
                  setOpen(null);
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${p === x ? 'bg-foreground text-background border-foreground' : 'border-border text-foreground'}`}
              >
                {x === d.player ? `${x} (você)` : x}
              </button>
            ))}
          </div>

          {/* total */}
          <section className="rounded-3xl bg-gradient-to-br from-primary/25 via-primary/10 to-transparent border border-primary/20 p-5">
            <p className="text-xs text-muted-foreground">Total{p ? ` de ${p}` : ''}</p>
            <p className="text-4xl font-bold text-foreground tabular-nums">{days ? fmt(total) : '–'}</p>
            {days ? (
              <div className="mt-3 space-y-1">
                {parts.map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{l}</span>
                    <span className={`tabular-nums font-semibold ${v ? 'text-foreground' : 'text-muted-foreground/60'}`}>{fmt(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">{everyone.ready ? 'Ainda não entrou no app.' : 'Carregando…'}</p>
            )}
          </section>

          {/* como conta */}
          <section className="bg-card rounded-3xl border border-border/30 shadow-sm p-4 text-xs text-muted-foreground leading-relaxed space-y-1">
            <p className="text-sm font-semibold text-foreground">Como conta (desde 20/10)</p>
            <p>
              • Cada um dos 4 itens (água, treino, 2 pratos com foto, zero doce) vale <b className="text-foreground">{fmt(ITEM_PTS)}</b>.
            </p>
            <p>
              • Fechou os 4 no mesmo dia: <b className="text-foreground">+{fmt(PERFECT_EXTRA)}</b> (dia perfeito = {fmt(CORE.length * ITEM_PTS + PERFECT_EXTRA)}).
            </p>
            <p>
              • Caminhada 4 km+ com print: <b className="text-foreground">+1</b> em dia perfeito, <b className="text-foreground">+0,5</b> nos outros.
            </p>
            <p>
              • 7 dias perfeitos seguidos: <b className="text-foreground">+1</b>. Domingo é livre. Desafio do grupo: +1 por dia cumprido.
            </p>
            <p>• Dia 19/10 valeu a regra antiga: 1 ponto só no dia perfeito.</p>
          </section>

          {/* dias */}
          {days && (
            <div className="bg-card rounded-3xl border border-border/30 shadow-sm overflow-hidden divide-y divide-border/40">
              {[...list].reverse().map((x) => {
                const r = recordOf(x.date);
                const isOpen = open === x.date;
                const proofs = r ? (['passos', 'cardio'] as ProofKind[]).filter((k) => r[k === 'passos' ? 'provaPassos' : 'provaCardio']) : [];
                return (
                  <div key={x.date}>
                    <button onClick={() => setOpen(isOpen ? null : x.date)} aria-expanded={isOpen} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition-colors">
                      <div className="w-11 text-center flex-shrink-0">
                        <p className="text-lg font-bold text-foreground leading-none tabular-nums">{x.date.slice(8)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{format(parseISO(x.date), 'MMM', { locale: ptBR }).replace('.', '')}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground first-letter:uppercase truncate">
                          {x.date === d.today ? 'Hoje' : format(parseISO(x.date), 'EEEE', { locale: ptBR }).split('-')[0]}
                          {proofs.length > 0 && <span className="text-[10px] text-muted-foreground font-normal"> · 📷 prova</span>}
                        </p>
                        <div className="flex gap-1 mt-1.5">
                          {[...CORE, ...bonusOf(x.date)].map((k) => {
                            const t = TONES[k];
                            const on = !!r && habitDone(k, r);
                            return (
                              <span key={k} title={t.label} className={`w-6 h-6 rounded-md flex items-center justify-center ${on ? t.bg : 'bg-secondary/50'}`}>
                                <t.icon className={`w-3.5 h-3.5 ${on ? t.fg : 'text-muted-foreground/30'}`} />
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold rounded-full px-2.5 py-1 tabular-nums flex-shrink-0 ${
                          x.sunday ? 'bg-secondary text-muted-foreground' : x.perfect ? 'bg-primary text-primary-foreground' : x.total ? 'bg-secondary text-foreground' : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {x.sunday ? 'Livre' : pts(x.total) || '0'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 space-y-3">
                            <DayMath x={x} />
                            {userId && proofs.length > 0 && <ProofThumbs userId={userId} date={x.date} kinds={proofs} />}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {!list.length && <p className="p-8 text-center text-sm text-muted-foreground">O desafio ainda não começou.</p>}
            </div>
          )}
        </div>
      </motion.div>
    </AppLayout>
  );
};

/** A conta de um dia, linha por linha. */
function DayMath({ x }: { x: LedgerDay }) {
  if (x.sunday) return <p className="text-xs text-muted-foreground">Domingo é livre: não conta ponto nem quebra a sequência.</p>;
  const old = x.date < PARTIAL_FROM;
  const lines: [string, number][] = old
    ? [[x.perfect ? 'Dia perfeito (regra antiga)' : `${x.items} de ${CORE.length} itens · regra antiga: só dia perfeito pontua`, x.base]]
    : [[`${x.items} de ${CORE.length} itens × ${fmt(ITEM_PTS)}`, x.base]];
  if (x.extra) lines.push(['Fechou os 4', x.extra]);
  if (x.bonus) lines.push(['Caminhada 4 km+', x.bonus]);
  if (x.streak) lines.push(['7 perfeitos seguidos', x.streak]);
  return (
    <div className="rounded-2xl bg-secondary/50 p-3 text-sm space-y-1">
      {lines.map(([l, v]) => (
        <div key={l} className="flex justify-between gap-3">
          <span className="text-muted-foreground">{l}</span>
          <span className="tabular-nums text-foreground">{fmt(v)}</span>
        </div>
      ))}
      <div className="flex justify-between gap-3 border-t border-border/60 pt-1 font-semibold">
        <span>Total do dia</span>
        <span className="tabular-nums">{fmt(x.total)}</span>
      </div>
      {!x.perfect && !old && <p className="text-[11px] text-muted-foreground pt-1">Se fechasse os 4: +0,5 e a caminhada valeria +1. Sequência só conta em dia perfeito.</p>}
    </div>
  );
}

export default Points;
