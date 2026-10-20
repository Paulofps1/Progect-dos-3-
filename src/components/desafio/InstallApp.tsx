import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, PlusSquare, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { canPrompt, isInstalled, isIOS, onInstallChange, promptInstall } from '@/lib/desafio/install';

// "Instalar o app" (Perfil → Configurações): coloca o Desafio na tela de início,
// abrindo em tela cheia como um app nativo. Botão direto no Android, passo a passo no iPhone.

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

export { isInstalled };
