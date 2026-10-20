import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ShieldCheck, Ticket } from 'lucide-react';
import { TONES } from './tones';
import { ProofSheet } from './ProofSheet';
import type { ProofKind } from '@/lib/desafio/proofs';
import {
  BONUS,
  BONUS_ENABLED,
  CORE,
  MIN_MEAL_PHOTOS,
  RULES_V2,
  START,
  dayPoints,
  habitDone,
  isPerfect,
  isSunday,
  needsProof,
  num,
  type DayRecord,
  type HabitKey,
} from '@/lib/desafio/rules';

// Checklist do dia no visual da página de Água: anel de progresso, blocos grandes
// com ícone colorido e marca de feito. É a tela que se usa todo dia.


type Props = {
  record: DayRecord;
  toggle: (date: string, key: HabitKey) => void;
  jokersLeft: number;
  /** Marca treino/cardio com a foto de prova. */
  markWithProof: (date: string, kind: ProofKind, photo: Blob) => Promise<boolean>;
};

export function DayChecklist({ record, toggle, jokersLeft, markWithProof }: Props) {
  const navigate = useNavigate();
  const [proof, setProof] = useState<ProofKind | null>(null);
  const v2 = record.date >= RULES_V2;
  // treino/cardio: para marcar, pede a foto; para desmarcar, só toca
  const tap = (k: HabitKey) => {
    const marked = k === 'treino' ? record.treino : k === 'cardio' ? !!record.cardio : false;
    if (needsProof(k, record.date) && !habitDone(k, record)) {
      if (k === 'treino' && marked && !record.provaTreino) return setProof('treino');
      if (!marked) return setProof(k as ProofKind);
    }
    toggle(record.date, k);
  };
  const perfect = isPerfect(record);
  const done = CORE.filter((k) => habitDone(k, record)).length;
  const pts = dayPoints(record);
  const waterPct = Math.min(100, Math.round((record.waterMl / Math.max(1, record.waterGoalMl)) * 100));

  const R = 26;
  const C = 2 * Math.PI * R;
  const status = isSunday(record.date)
    ? 'Domingo é livre: não conta nem quebra a sequência'
    : record.date < START
      ? 'Antes de 19/10 não conta ponto'
      : perfect
        ? record.coringa
          ? 'Dia salvo pelo coringa'
          : 'Dia perfeito! Mandou bem'
        : done === 3
          ? 'Falta 1 para fechar o dia'
          : `Faltam ${4 - done} para fechar o dia`;

  return (
    <section className="relative overflow-hidden bg-card rounded-3xl border border-border/30 shadow-sm p-4 sm:p-5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-sky-500/5 pointer-events-none" />

      {/* cabeçalho com anel */}
      <div className="relative flex items-center gap-4">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r={R} fill="none" stroke="hsl(var(--secondary))" strokeWidth="7" />
            <motion.circle
              cx="32" cy="32" r={R} fill="none" stroke="hsl(var(--primary))" strokeWidth="7" strokeLinecap="round"
              strokeDasharray={C}
              initial={false}
              animate={{ strokeDashoffset: C * (1 - (perfect ? 4 : done) / 4) }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {perfect ? (
              <Check className="w-6 h-6 text-primary" strokeWidth={3} />
            ) : (
              <span className="text-base font-bold text-foreground tabular-nums">{done}/4</span>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-foreground">Desafio do dia</p>
          <p className="text-xs text-muted-foreground">{status}</p>
        </div>
        {perfect && pts > 0 && (
          <span className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 whitespace-nowrap">
            +{num(pts)} pt{pts === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {/* os 4 que valem o ponto */}
      <div className="relative grid grid-cols-2 gap-2.5 mt-4">
        {CORE.map((k) => {
          const t = TONES[k];
          const on = habitDone(k, record);
          const isWater = k === 'agua';
          const isMeals = k === 'comida' && v2; // automático: conta as refeições com foto
          const hint = isMeals
            ? `${Math.min(record.mealPhotos ?? 0, MIN_MEAL_PHOTOS)} de ${MIN_MEAL_PHOTOS} com foto`
            : k === 'treino' && v2
              ? on ? 'Com prova' : 'Toque e mande a foto'
              : on ? 'Feito' : 'Toque para marcar';
          return (
            <motion.button
              key={k}
              whileTap={{ scale: 0.96 }}
              onClick={() => (isWater ? navigate('/water') : isMeals ? navigate('/meals') : tap(k))}
              aria-pressed={isWater || isMeals ? undefined : on}
              className={`relative rounded-2xl p-3 text-left border transition-colors flex flex-col items-start justify-start ${
                on ? 'bg-primary/15 border-primary/40' : 'bg-secondary/60 border-transparent hover:border-border'
              }`}
            >
              {on && (
                <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                </span>
              )}
              <span className={`w-10 h-10 rounded-xl ${t.bg} flex items-center justify-center`}>
                <t.icon className={`w-5 h-5 ${t.fg}`} />
              </span>
              <span className="block text-sm font-semibold text-foreground mt-2">{t.label}</span>
              {isWater ? (
                <>
                  <span className="block text-[11px] text-muted-foreground tabular-nums">
                    {num(record.waterMl / 1000, 2)} de {num(record.waterGoalMl / 1000, 2)} L
                  </span>
                  <span className="block w-full h-1.5 rounded-full bg-background/70 overflow-hidden mt-1.5">
                    <span className={`block h-full rounded-full ${t.bar}`} style={{ width: `${waterPct}%` }} />
                  </span>
                </>
              ) : (
                <span className="block text-[11px] text-muted-foreground">
                  {k === 'treino' && on && v2 && <ShieldCheck className="inline w-3 h-3 mr-0.5 -mt-0.5 text-primary" />}
                  {hint}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* bônus */}
      <p className="relative text-[11px] font-medium text-muted-foreground mt-4 mb-2">
        {BONUS_ENABLED ? 'Bônus · exercício extra · +0,5 cada em dia perfeito' : 'Extras'}
      </p>
      <div className="relative grid grid-cols-2 gap-2">
        {BONUS.map((k) => {
          const t = TONES[k];
          const on = habitDone(k, record);
          return (
            <motion.button
              key={k}
              whileTap={{ scale: 0.95 }}
              onClick={() => tap(k)}
              aria-pressed={on}
              className={`rounded-2xl py-2.5 px-1 flex flex-col items-center gap-1 border transition-colors ${
                on ? 'bg-primary/15 border-primary/40' : 'bg-secondary/60 border-transparent'
              }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${on ? 'bg-primary' : t.bg}`}>
                {on ? <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} /> : <t.icon className={`w-4 h-4 ${t.fg}`} />}
              </span>
              <span className="text-[11px] font-medium text-foreground">
                {t.label}
                {k === 'cardio' && v2 && <span className="text-muted-foreground"> · {on ? 'com prova' : 'com foto'}</span>}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* coringa (injeção é só registro, fica no menu + e não conta ponto) */}
      <button
        onClick={() => toggle(record.date, 'coringa')}
        disabled={!record.coringa && jokersLeft <= 0}
        aria-pressed={!!record.coringa}
        className={`relative w-full mt-2 rounded-2xl p-2.5 flex items-center gap-2.5 text-left border disabled:opacity-40 ${
          record.coringa ? 'bg-amber-500/15 border-amber-500/40' : 'bg-secondary/60 border-transparent'
        }`}
      >
        <span className={`w-8 h-8 rounded-lg ${TONES.coringa.bg} flex items-center justify-center flex-shrink-0`}>
          <Ticket className={`w-4 h-4 ${TONES.coringa.fg}`} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-foreground">{record.coringa ? 'Coringa usado' : 'Usar coringa'}</span>
          <span className="block text-[10px] text-muted-foreground">Salva o dia · {jokersLeft} de 2 restantes</span>
        </span>
      </button>

      <ProofSheet kind={proof} onClose={() => setProof(null)} onSend={(kind, photo) => markWithProof(record.date, kind, photo)} />
    </section>
  );
}
