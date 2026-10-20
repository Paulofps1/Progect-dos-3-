// Provas de treino e cardio (foto da academia, Strava, Apple Saúde…). Ficam na pasta
// "provas" do banco, que os participantes podem ver uns dos outros: é o que deixa o
// desafio justo, inclusive para quem não treina junto.

import { supabase } from '@/integrations/supabase/client';
import { IS_DEMO } from './remote';

const BUCKET = 'provas';
export type ProofKind = 'treino' | 'cardio';

const path = (userId: string, date: string, kind: ProofKind) => `${userId}/${date}/${kind}.jpg`;

// na demonstração não há banco: guarda a última prova na memória da página
const demo = new Map<string, string>();

export async function uploadProof(userId: string, date: string, kind: ProofKind, photo: Blob) {
  if (IS_DEMO) {
    demo.set(path(userId, date, kind), URL.createObjectURL(photo));
    return true;
  }
  const { error } = await supabase.storage.from(BUCKET).upload(path(userId, date, kind), photo, { upsert: true, contentType: 'image/jpeg' });
  return !error;
}

export async function removeProof(userId: string, date: string, kind: ProofKind) {
  if (IS_DEMO) return void demo.delete(path(userId, date, kind));
  await supabase.storage.from(BUCKET).remove([path(userId, date, kind)]);
}

/** Endereço temporário (1 h) da foto de prova de alguém. */
export async function proofUrl(userId: string, date: string, kind: ProofKind): Promise<string | null> {
  if (IS_DEMO) return demo.get(path(userId, date, kind)) ?? null;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path(userId, date, kind), 3600);
  return data?.signedUrl ?? null;
}
