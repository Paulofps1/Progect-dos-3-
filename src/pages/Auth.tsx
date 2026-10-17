import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { PLAYERS, PRIZE, type Player } from '@/lib/desafio/rules';

// Entrada só com o nome: toca em "Sou o Paulo" e entra (conta fixa de cada jogador).
// Escolha do grupo: sem e-mail, sem senha, sem PIN.

const LAST_LOGIN = 'desafio:ultimo-login';

function lastPlayer(): Player | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_LOGIN) || '{}');
    return PLAYERS.includes(v.who) ? v.who : null;
  } catch {
    return null;
  }
}

const Auth = () => {
  const [entering, setEntering] = useState<Player | null>(null);
  const [last] = useState(lastPlayer);
  const { enterAs, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  const enter = async (p: Player) => {
    if (entering) return;
    setEntering(p);
    const { error } = await enterAs(p);
    setEntering(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    try {
      localStorage.setItem(LAST_LOGIN, JSON.stringify({ who: p }));
    } catch {
      /* sem storage: só não lembra */
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden bg-background">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-1/4 -right-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl"
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-sm">
        {/* Apresentação */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mb-6 text-center flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-3xl font-extrabold text-primary-foreground">3</span>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-4">19/10 a 20/12 · 9 semanas</p>
          <h1 className="text-3xl font-bold text-foreground mt-1">Desafio dos 3</h1>
          <p className="text-foreground/80 mt-2 text-sm leading-relaxed max-w-[18rem]">
            Paulo, Arthur e Rafaela. Quem somar mais pontos até 20/12 leva os <b className="text-foreground">{PRIZE}</b>.
          </p>
        </motion.div>

        {/* As regras em três linhas */}
        <motion.ul initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6 grid gap-2">
          {[
            ['1 pt', 'por dia perfeito', 'água na meta, treino, comida certa e zero doce'],
            ['+1', 'a cada 7 seguidos', 'cardio, proteína e passos ainda dão bônus'],
            ['2', 'coringas cada', 'domingo é livre; empate vai para quem perdeu mais %'],
          ].map(([big, title, desc]) => (
            <li key={title} className="flex items-center gap-3 rounded-2xl bg-card/70 border border-border/40 px-3 py-2.5">
              <span className="w-12 flex-shrink-0 text-center text-lg font-extrabold text-primary-foreground bg-primary rounded-xl py-1">{big}</span>
              <span className="min-w-0 text-left">
                <span className="block text-sm font-semibold text-foreground">{title}</span>
                <span className="block text-xs text-muted-foreground">{desc}</span>
              </span>
            </li>
          ))}
        </motion.ul>

        {/* Quem é você */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-3xl p-6 shadow-2xl shadow-foreground/10">
          <h2 className="text-lg font-bold text-foreground">Quem é você?</h2>
          <p className="text-sm text-muted-foreground">Toque no seu nome para entrar.</p>
          <div className="grid gap-2.5 mt-4">
            {PLAYERS.map((p) => (
              <motion.button
                key={p}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => enter(p)}
                disabled={entering !== null}
                className={`h-16 rounded-2xl px-5 flex items-center justify-between border-2 transition-colors disabled:opacity-60 ${
                  p === last ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-foreground hover:border-primary/60'
                }`}
              >
                <span className="text-left">
                  <span className="block text-[11px] font-medium opacity-70">Sou</span>
                  <span className="block text-lg font-bold leading-tight">{p}</span>
                </span>
                {entering === p ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                  />
                ) : (
                  <span className="text-sm font-semibold">{p === last ? 'Entrar de novo →' : 'Entrar →'}</span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <p className="text-center text-[11px] text-muted-foreground mt-5 px-4">O app só registra. Dose, dieta e treino são com seus profissionais.</p>
      </motion.div>
    </div>
  );
};

export default Auth;
