// Fotos das refeições: cópia no aparelho (IndexedDB, abre na hora) e no banco
// (pasta privada "refeicoes", cada um só acessa a própria). Se a pasta ainda não
// existir ou faltar internet, fica no aparelho e sobe na próxima vez que abrir.

import { supabase } from '@/integrations/supabase/client';
import { mealPhotos } from './localStore';
import { IS_DEMO } from './remote';

const BUCKET = 'refeicoes';
const pendingKey = (userId: string) => `desafio:${userId}:fotos-pendentes`;

function pending(userId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(pendingKey(userId)) || '[]');
  } catch {
    return [];
  }
}
function setPending(userId: string, mealId: string, on: boolean) {
  const next = pending(userId).filter((x) => x !== mealId);
  if (on) next.push(mealId);
  try {
    localStorage.setItem(pendingKey(userId), JSON.stringify(next));
  } catch {
    /* sem espaço: tenta de novo na próxima */
  }
}

async function upload(userId: string, mealId: string, photos: Blob[]) {
  if (IS_DEMO) return true;
  for (let i = 0; i < photos.length; i++) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${userId}/${mealId}/${i}.jpg`, photos[i], { upsert: true, contentType: 'image/jpeg' });
    if (error) return false;
  }
  return true;
}

/** Guarda as fotos de uma refeição (aparelho na hora, banco em seguida). */
export async function saveMealPhotos(userId: string, mealId: string, photos: Blob[]) {
  await mealPhotos.set(mealId, photos).catch(() => undefined);
  if (!photos.length) return;
  setPending(userId, mealId, true);
  if (await upload(userId, mealId, photos)) setPending(userId, mealId, false);
}

/** Fotos de uma refeição: do aparelho; se não tiver (outro celular), baixa do banco. */
export async function getMealPhotos(userId: string, mealId: string): Promise<Blob[]> {
  const local = await mealPhotos.get(mealId).catch(() => [] as Blob[]);
  if (local.length || IS_DEMO) return local;
  const { data } = await supabase.storage.from(BUCKET).list(`${userId}/${mealId}`);
  if (!data?.length) return [];
  const files = [...data].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const blobs: Blob[] = [];
  for (const f of files) {
    const r = await supabase.storage.from(BUCKET).download(`${userId}/${mealId}/${f.name}`);
    if (r.data) blobs.push(r.data);
  }
  if (blobs.length) await mealPhotos.set(mealId, blobs).catch(() => undefined);
  return blobs;
}

export async function removeMealPhotos(userId: string, mealId: string, count = 4) {
  await mealPhotos.remove(mealId);
  setPending(userId, mealId, false);
  if (IS_DEMO) return;
  await supabase.storage.from(BUCKET).remove(Array.from({ length: count }, (_, i) => `${userId}/${mealId}/${i}.jpg`));
}

/** Sobe o que ficou só no aparelho (sem internet ou antes de a pasta existir). */
export async function retryPendingPhotos(userId: string) {
  for (const mealId of pending(userId)) {
    const photos = await mealPhotos.get(mealId).catch(() => [] as Blob[]);
    if (!photos.length || (await upload(userId, mealId, photos))) setPending(userId, mealId, false);
    else break; // pasta ainda não existe ou sem internet: tenta na próxima
  }
}
