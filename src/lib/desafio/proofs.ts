// Provas (print do Strava / app Saúde da caminhada; antes também treino e cardio).
// Ficam na pasta "provas" do banco, que os participantes podem ver uns dos outros:
// é o que deixa o desafio justo, inclusive para quem não treina junto.
// Cada prova pode ter várias fotos (ida e volta, por exemplo):
// <usuário>/<dia>/<tipo>-<n>.jpg (as antigas, de uma foto só, são <tipo>.jpg).

import { supabase } from '@/integrations/supabase/client';
import { IS_DEMO } from './remote';

const BUCKET = 'provas';
export type ProofKind = 'treino' | 'cardio' | 'passos';

const folder = (userId: string, date: string) => `${userId}/${date}`;
const isOf = (kind: ProofKind) => (name: string) => name === `${kind}.jpg` || name.startsWith(`${kind}-`);

// na demonstração não há banco: guarda as provas na memória da página
const demo = new Map<string, string[]>();
const demoKey = (userId: string, date: string, kind: ProofKind) => `${folder(userId, date)}/${kind}`;

async function names(userId: string, date: string, kind: ProofKind) {
  const { data } = await supabase.storage.from(BUCKET).list(folder(userId, date));
  return (data || []).map((f) => f.name).filter(isOf(kind)).sort();
}

/** Junta as fotos às que já existem naquele dia (não apaga as anteriores). */
export async function uploadProofs(userId: string, date: string, kind: ProofKind, photos: Blob[]) {
  if (IS_DEMO) {
    const k = demoKey(userId, date, kind);
    demo.set(k, [...(demo.get(k) || []), ...photos.map((p) => URL.createObjectURL(p))]);
    return true;
  }
  const stamp = Date.now();
  for (let i = 0; i < photos.length; i++) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(`${folder(userId, date)}/${kind}-${stamp}-${i}.jpg`, photos[i], { upsert: true, contentType: 'image/jpeg' });
    if (error) return false;
  }
  return true;
}

export async function removeProofs(userId: string, date: string, kind: ProofKind) {
  if (IS_DEMO) return void demo.delete(demoKey(userId, date, kind));
  const list = await names(userId, date, kind);
  if (list.length) await supabase.storage.from(BUCKET).remove(list.map((n) => `${folder(userId, date)}/${n}`));
}

/** Fotos de prova de alguém naquele dia: caminho no banco + endereço temporário (1 h). */
export async function proofFiles(userId: string, date: string, kind: ProofKind): Promise<{ path: string; url: string }[]> {
  if (IS_DEMO) return (demo.get(demoKey(userId, date, kind)) ?? []).map((u) => ({ path: u, url: u }));
  const paths = (await names(userId, date, kind)).map((n) => `${folder(userId, date)}/${n}`);
  if (!paths.length) return [];
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  return (data || []).flatMap((d, i) => (d.signedUrl ? [{ path: paths[i], url: d.signedUrl }] : []));
}

export async function proofUrls(userId: string, date: string, kind: ProofKind): Promise<string[]> {
  return (await proofFiles(userId, date, kind)).map((f) => f.url);
}

/** Apaga uma foto só (mandou a errada). */
export async function removeProof(userId: string, date: string, kind: ProofKind, path: string) {
  if (IS_DEMO) {
    const k = demoKey(userId, date, kind);
    demo.set(k, (demo.get(k) || []).filter((u) => u !== path));
    return true;
  }
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return !error;
}
