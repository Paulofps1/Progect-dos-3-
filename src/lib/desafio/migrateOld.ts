// Traz do banco antigo (Lovable) as refeições com fotos e as fotos de evolução do
// corpo de quem está logado. Roda no celular da pessoa: entra na conta antiga com o
// mesmo e-mail e senha internos, baixa e grava no banco novo. Pode rodar de novo:
// refeição já trazida não é duplicada (meal_items guarda o id antigo em "origem").
// Foto que nunca subiu para o banco antigo só existe no celular que tirou, guardada
// pelo endereço antigo (progetodostres): rodando de lá, ela também vem.

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { PLAYER_PASSWORD } from './accounts';
import { saveMealPhotos } from './mealCloud';
import { mealPhotos } from './localStore';

// banco antigo (Lovable Cloud); a chave é a pública do app antigo
const OLD_URL = 'https://vjgzpipbraqvktwyemki.lovable.cloud';
const OLD_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZ3pwaXBicmFxdmt0d3llbWtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NTg0MDYsImV4cCI6MjA4NjUzNDQwNn0.X91e6v2H8jqTrfNPzqljbEHF7HQ3JY8iIDfcTJBXLKU';
const BUCKET = 'refeicoes';

type OldMeal = { id: string; name: string; meal_type: string | null; date: string | null; time: string | null; meal_items: unknown };
export type MigrateResult = { meals: number; photos: number; skipped: number; body: number };

export async function migrateFromOld(email: string, newUserId: string, onStep: (msg: string) => void): Promise<MigrateResult> {
  const old = createClient(OLD_URL, OLD_KEY, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'desafio-banco-antigo' } });
  onStep('Entrando no app antigo…');
  const { data: login, error } = await old.auth.signInWithPassword({ email, password: PLAYER_PASSWORD });
  if (error || !login.user) throw new Error('Não achei sua conta no app antigo');
  const oldId = login.user.id;

  const result: MigrateResult = { meals: 0, photos: 0, skipped: 0, body: 0 };
  try {
    onStep('Buscando suas refeições…');
    const { data: meals, error: mErr } = await old
      .from('meals')
      .select('id, name, meal_type, date, time, meal_items')
      .eq('user_id', oldId)
      .order('date', { ascending: true });
    if (mErr) throw new Error('Não consegui ler as refeições antigas');

    for (const [i, m] of ((meals || []) as OldMeal[]).entries()) {
      onStep(`Refeição ${i + 1} de ${meals!.length}…`);
      const { data: already } = await supabase
        .from('meals')
        .select('id, meal_items')
        .eq('user_id', newUserId)
        .contains('meal_items', [{ origem: m.id }])
        .limit(1);
      const prev = already?.[0];
      const prevPhotos = Array.isArray(prev?.meal_items) ? ((prev.meal_items as { fotos?: number }[])[0]?.fotos ?? 0) : 0;
      if (prev && prevPhotos > 0) {
        result.skipped++;
        continue;
      }
      // fotos da refeição na pasta antiga (<id antigo>/<refeição>/<n>.jpg)…
      const { data: files } = await old.storage.from(BUCKET).list(`${oldId}/${m.id}`);
      let photos: Blob[] = [];
      for (const f of [...(files || [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
        const dl = await old.storage.from(BUCKET).download(`${oldId}/${m.id}/${f.name}`);
        if (dl.data) photos.push(dl.data);
      }
      // …ou, se nunca subiram, as que ficaram neste celular (guardadas pelo id antigo)
      if (!photos.length) photos = await mealPhotos.get(m.id).catch(() => [] as Blob[]);

      if (prev) {
        // já tinha vindo sem foto: só completa as fotos
        if (photos.length) {
          await supabase.from('meals').update({ meal_items: [{ fotos: photos.length, origem: m.id }] }).eq('id', prev.id);
          await saveMealPhotos(newUserId, prev.id, photos);
          result.photos += photos.length;
          result.meals++;
        } else result.skipped++;
        continue;
      }
      const { data: created, error: insErr } = await supabase
        .from('meals')
        .insert({
          user_id: newUserId,
          name: m.name,
          meal_type: m.meal_type,
          date: m.date,
          time: m.time,
          meal_items: [{ fotos: photos.length, origem: m.id }],
        })
        .select('id')
        .single();
      if (insErr || !created) throw new Error('Não consegui gravar uma refeição no app novo');
      if (photos.length) await saveMealPhotos(newUserId, created.id, photos);
      result.meals++;
      result.photos += photos.length;
    }

    // fotos de evolução do corpo (<id antigo>/corpo/<dia>_<n>.jpg)
    onStep('Buscando fotos de evolução…');
    const { data: body } = await old.storage.from(BUCKET).list(`${oldId}/corpo`, { limit: 200 });
    const { data: have } = await supabase.storage.from(BUCKET).list(`${newUserId}/corpo`, { limit: 200 });
    const haveNames = new Set((have || []).map((f) => f.name));
    for (const f of (body || []).filter((x) => x.name.endsWith('.jpg') && !haveNames.has(x.name))) {
      const dl = await old.storage.from(BUCKET).download(`${oldId}/corpo/${f.name}`);
      if (!dl.data) continue;
      const up = await supabase.storage.from(BUCKET).upload(`${newUserId}/corpo/${f.name}`, dl.data, { contentType: 'image/jpeg' });
      if (!up.error) result.body++;
    }
  } finally {
    await old.auth.signOut().catch(() => undefined);
  }
  return result;
}
