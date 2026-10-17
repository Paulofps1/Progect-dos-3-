import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Loader2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

// Ajuste da foto de perfil: arrasta para posicionar e aproxima/afasta com o controle
// (ou com dois dedos). Sai um quadrado de 400 px em JPEG, guardado direto no perfil
// (sem depender de pasta de arquivos no banco).

const BOX = 280; // tamanho do círculo na tela
const OUT = 400; // tamanho final da foto

type Props = { file: File; onCancel: () => void; onSaved: (dataUrl: string) => void };

export function AvatarCropper({ file, onCancel, onSaved }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // escala para a foto cobrir o círculo inteiro com zoom 1
  const base = img ? BOX / Math.min(img.width, img.height) : 1;
  const w = img ? img.width * base * zoom : 0;
  const h = img ? img.height * base * zoom : 0;
  // não deixa sobrar espaço vazio dentro do círculo
  const clamp = (p: { x: number; y: number }, ww = w, hh = h) => ({
    x: Math.min((ww - BOX) / 2, Math.max(-(ww - BOX) / 2, p.x)),
    y: Math.min((hh - BOX) / 2, Math.max(-(hh - BOX) / 2, p.y)),
  });

  const setZoomKeep = (z: number) => {
    const nz = Math.min(4, Math.max(1, z));
    setZoom(nz);
    if (img) setPos((p) => clamp({ x: (p.x * nz) / zoom, y: (p.y * nz) / zoom }, img.width * base * nz, img.height * base * nz));
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
      drag.current = null;
    } else drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      setZoomKeep((pinch.current.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.current.dist);
    } else if (drag.current) {
      setPos(clamp({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y }));
    }
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
    drag.current = null;
  };

  const save = () => {
    if (!img) return;
    setSaving(true);
    const c = document.createElement('canvas');
    c.width = OUT;
    c.height = OUT;
    const ctx = c.getContext('2d')!;
    const k = OUT / BOX;
    ctx.drawImage(img, (BOX / 2 - w / 2 + pos.x) * k, (BOX / 2 - h / 2 + pos.y) * k, w * k, h * k);
    onSaved(c.toDataURL('image/jpeg', 0.85));
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] bg-black/80 flex flex-col items-center justify-center p-6" role="dialog" aria-label="Ajustar foto">
      <p className="text-white font-semibold mb-1">Ajustar foto</p>
      <p className="text-white/60 text-xs mb-5">Arraste para posicionar · aproxime com o controle ou com dois dedos</p>
      <div
        className="relative rounded-full overflow-hidden bg-neutral-800 touch-none select-none cursor-grab active:cursor-grabbing ring-4 ring-white/80"
        style={{ width: BOX, height: BOX }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={(e) => setZoomKeep(zoom - e.deltaY * 0.002)}
      >
        {img ? (
          <img
            src={img.src}
            alt=""
            draggable={false}
            className="absolute max-w-none pointer-events-none"
            style={{ width: w, height: h, left: BOX / 2 - w / 2 + pos.x, top: BOX / 2 - h / 2 + pos.y }}
          />
        ) : (
          <Loader2 className="w-8 h-8 text-white animate-spin absolute inset-0 m-auto" />
        )}
      </div>

      <div className="flex items-center gap-3 w-full max-w-[280px] mt-6">
        <button onClick={() => setZoomKeep(zoom - 0.2)} className="text-white/80" aria-label="Afastar">
          <Minus className="w-5 h-5" />
        </button>
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoomKeep(Number(e.target.value))}
          className="flex-1 accent-primary"
          aria-label="Zoom"
        />
        <button onClick={() => setZoomKeep(zoom + 0.2)} className="text-white/80" aria-label="Aproximar">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <motion.div initial={false} animate={{ opacity: 1, y: 0 }} className="flex gap-3 w-full max-w-[280px] mt-6">
        <Button variant="secondary" className="flex-1 h-12 rounded-2xl" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button className="flex-1 h-12 rounded-2xl font-semibold" onClick={save} disabled={!img || saving}>
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Usar foto'}
        </Button>
      </motion.div>
    </div>,
    document.body,
  );
}

/** Grava a foto (já recortada) no perfil. */
export async function saveAvatar(userId: string, dataUrl: string, fullName?: string | null) {
  const { data, error } = await supabase.from('profiles').update({ avatar_url: dataUrl }).eq('id', userId).select('id');
  if (error) return error;
  if (data?.length) return null;
  // conta sem linha de perfil ainda: cria
  const ins = await supabase.from('profiles').upsert({ id: userId, avatar_url: dataUrl, full_name: fullName ?? null });
  return ins.error;
}
