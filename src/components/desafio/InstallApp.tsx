import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, PlusSquare, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { canPrompt, isInstalled, isIOS, onInstallChange, promptInstall } from '@/lib/desafio/install';

// "Instalar o app": coloca o Desafio na tela de início, abrindo em tela cheia
// como um app nativo. Card em Hoje (dá para dispensar) e passo a passo do iPhone.

const HIDE_KEY = 'desafio:instalar-dispensado';

function useInstallState() {
  const [, force] = useState(0);
  useEffect(() => onInstallChange(() => force((n) => n + 1)), []);
  return { installed: isInstalled(), prompt: canPrompt(), ios: isIOS() };
}

/** Passo a passo (iPhone) ou botão direto (Android/Chrome). */
export function InstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { prompt, ios } = useInstallState();
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-end justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30 }}
            className="w-full max-w-lg bg-card rounded-t-3xl p-6 pb-10 border-t border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Instalar o app</h3>
              <button onClick={onClose} aria-label="Fechar" className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Fica na tela de início e abre em tela cheia, igual a um app de loja.</p>

            {prompt ? (
              <Button
                className="w-full h-12 rounded-2xl font-semibold mt-5"
                onClick={async () => {
                  if (await promptInstall()) onClose();
                }}
              >
                <Download className="w-5 h-5 mr-2" /> Instalar agora
              </Button>
            ) : (
              <ol className="mt-5 space-y-3">
                {(ios
                  ? [
                      [<Share key="i" className="w-5 h-5 text-sky-500" />, 'Abra este site no Safari e toque em Compartilhar (o quadrado com a seta, embaixo).'],
                      [<PlusSquare key="i" className="w-5 h-5 text-foreground" />, 'Role a lista e toque em "Adicionar à Tela de Início".'],
                      [<span key="i" className="text-sm font-bold">4</span>, 'Toque em "Adicionar". O ícone do Desafio aparece na tela de início.'],
                    ]
                  : [
                      [<span key="i" className="text-lg leading-none">⋮</span>, 'No Chrome, toque nos três pontinhos lá em cima.'],
                      [<Download key="i" className="w-5 h-5 text-foreground" />, 'Toque em "Instalar app" (ou "Adicionar à tela inicial").'],
                      [<span key="i" className="text-sm font-bold">4</span>, 'Confirme. O ícone do Desafio aparece na tela de início.'],
                    ]
                ).map(([icon, text], i) => (
                  <li key={i} className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-3">
                    <span className="w-9 h-9 rounded-xl bg-card flex items-center justify-center flex-shrink-0">{icon}</span>
                    <span className="text-sm text-foreground">{text}</span>
                  </li>
                ))}
              </ol>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Card discreto em Hoje, só para quem ainda usa pelo navegador. */
export function InstallBanner() {
  const { installed } = useInstallState();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return Number(localStorage.getItem(HIDE_KEY) || 0) > Date.now();
    } catch {
      return false;
    }
  });
  if (installed || hidden) return null;
  return (
    <>
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3 flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-primary-foreground" />
        </span>
        <button onClick={() => setOpen(true)} className="flex-1 min-w-0 text-left">
          <span className="block text-sm font-semibold text-foreground">Instale o app</span>
          <span className="block text-xs text-muted-foreground">Abre em tela cheia, direto da tela de início</span>
        </button>
        <button
          onClick={() => {
            try {
              localStorage.setItem(HIDE_KEY, String(Date.now() + 7 * 864e5)); // volta em 7 dias
            } catch {
              /* só some por agora */
            }
            setHidden(true);
          }}
          aria-label="Agora não"
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <InstallSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export { isInstalled };
