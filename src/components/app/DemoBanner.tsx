import { useState } from 'react';

// Faixa do modo demonstração: avisa que é de mentira e deixa recomeçar do zero.
const DemoBanner = () => {
  const [asking, setAsking] = useState(false);
  const reset = async () => {
    const { resetDemo, reseedLocal } = await import('@/integrations/supabase/demoClient');
    resetDemo();
    try {
      Object.keys(localStorage).filter((k) => k.startsWith('desafio:')).forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignora */
    }
    reseedLocal();
    location.reload();
  };
  return (
    <div className="sticky top-0 z-[90] bg-foreground text-background text-[11px] px-4 py-1.5 flex items-center justify-between gap-2">
      <span>Demonstração · os dados ficam só neste navegador</span>
      {asking ? (
        <span className="flex gap-2">
          <button onClick={reset} className="font-semibold underline">Apagar tudo</button>
          <button onClick={() => setAsking(false)} className="opacity-70">Cancelar</button>
        </span>
      ) : (
        <button onClick={() => setAsking(true)} className="font-semibold underline">Recomeçar</button>
      )}
    </div>
  );
};

export default DemoBanner;
