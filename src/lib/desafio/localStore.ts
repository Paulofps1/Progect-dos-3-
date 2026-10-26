// Cópia NESTE aparelho (por usuário) do checklist, pesagens, injeções e desafios,
// que também vão para o banco (remote.ts). Fotos das refeições ficam só aqui.

import type { CheckKey, Injection, Player, Sleep, Weight } from './rules';
import type { Challenge } from './challenges';

// por data; prova* = já mandou a foto de prova do treino/cardio
type Checks = Record<string, Partial<Record<CheckKey | 'provaTreino' | 'provaCardio' | 'provaPassos', boolean>>>;

export type ProfileData = { heightCm?: number; goalKg?: number; waterGoalMl?: number; avatar?: string };

const k = (userId: string, what: string) => `desafio:${userId}:${what}`;

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* sem espaço ou bloqueado: segue só na memória da tela */
  }
}

export const localDesafio = {
  getChecks: (userId: string) => read<Checks>(k(userId, 'checks'), {}),
  setChecks: (userId: string, c: Checks) => write(k(userId, 'checks'), c),
  getWeights: (userId: string) => read<Weight[]>(k(userId, 'weights'), []),
  setWeights: (userId: string, w: Weight[]) => write(k(userId, 'weights'), w),
  getInjections: (userId: string) => read<Injection[]>(k(userId, 'injections'), []),
  setInjections: (userId: string, v: Injection[]) => write(k(userId, 'injections'), v),
  /** Próxima aplicação que a própria pessoa marcou (o app não calcula). */
  getNextInjection: (userId: string) => read<string | null>(k(userId, 'next-injection'), null),
  setNextInjection: (userId: string, d: string | null) => write(k(userId, 'next-injection'), d),
  /** Desafios entre os 3 (cópia local; os de verdade estão no banco). */
  getChallenges: () => read<Challenge[]>('desafio:challenges', []),
  setChallenges: (v: Challenge[]) => write('desafio:challenges', v),
  getSleep: (userId: string) => read<Sleep[]>(k(userId, 'sono'), []),
  setSleep: (userId: string, v: Sleep[]) => write(k(userId, 'sono'), v),
  getPlayer: (userId: string) => read<Player | null>(k(userId, 'player'), null),
  setPlayer: (userId: string, p: Player) => write(k(userId, 'player'), p),
  /** Última água/treino lidos do banco, só para a tela abrir já preenchida. */
  getDbCache: (userId: string) =>
    read<{ water: Record<string, number>; trained: string[]; meals?: Record<string, number> }>(k(userId, 'cache-banco'), { water: {}, trained: [] }),
  hasDbCache: (userId: string) => localStorage.getItem(k(userId, 'cache-banco')) !== null,
  setDbCache: (userId: string, v: { water: Record<string, number>; trained: string[]; meals: Record<string, number> }) => write(k(userId, 'cache-banco'), v),
  /** Altura, meta de peso, meta de água e foto do perfil (também no banco, tipo 'profile'). */
  getProfile: (userId: string) => read<ProfileData>(k(userId, 'perfil'), {}),
  setProfile: (userId: string, v: ProfileData) => write(k(userId, 'perfil'), v),
  /** Tipos alterados aqui que ainda não chegaram ao banco (sem internet, por ex.). */
  getPending: (userId: string) => read<string[]>(k(userId, 'pendente'), []),
  setPending: (userId: string, kind: string, pending: boolean) => {
    const cur = read<string[]>(k(userId, 'pendente'), []).filter((x) => x !== kind);
    write(k(userId, 'pendente'), pending ? [...cur, kind] : cur);
  },
};

// ---------- fotos das refeições (IndexedDB, por id da refeição) ----------

function db(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open('desafio-fotos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('fotos');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((res, rej) => {
    const req = fn(d.transaction('fotos', mode).objectStore('fotos'));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export const mealPhotos = {
  get: async (mealId: string) => ((await run<Blob[] | undefined>('readonly', (s) => s.get(mealId))) ?? []),
  set: (mealId: string, photos: Blob[]) =>
    photos.length ? run('readwrite', (s) => s.put(photos, mealId)) : run('readwrite', (s) => s.delete(mealId)),
  remove: (mealId: string) => run('readwrite', (s) => s.delete(mealId)).catch(() => undefined),
};

/** Reduz a foto no aparelho (lado maior até 1000 px, JPEG) antes de guardar. */
/**
 * Reduz a foto para JPEG. No iPhone, abrir várias fotos grandes ao mesmo tempo pode
 * estourar a memória (o toBlob volta vazio): por isso quem chama usa shrinkPhotos,
 * que faz uma por vez. Se a imagem não abrir pelo <img>, tenta createImageBitmap.
 */
export async function shrinkPhoto(file: Blob, max = 1000): Promise<Blob> {
  const draw = (src: CanvasImageSource, w: number, h: number) =>
    new Promise<Blob>((resolve, reject) => {
      const s = Math.min(1, max / Math.max(w, h));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * s));
      c.height = Math.max(1, Math.round(h * s));
      c.getContext('2d')!.drawImage(src, 0, 0, c.width, c.height);
      c.toBlob((b) => {
        c.width = c.height = 0; // devolve a memória já (importante no iPhone)
        if (b) resolve(b);
        else reject(new Error('falha ao reduzir'));
      }, 'image/jpeg', 0.75);
    });
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((ok, fail) => {
      img.onload = () => ok();
      img.onerror = () => fail(new Error('imagem inválida'));
      img.src = url;
    });
    return await draw(img, img.naturalWidth, img.naturalHeight);
  } catch (e) {
    if (typeof createImageBitmap !== 'function') throw e;
    const bmp = await createImageBitmap(file);
    try {
      return await draw(bmp, bmp.width, bmp.height);
    } finally {
      bmp.close();
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Várias fotos, uma de cada vez (ver shrinkPhoto). */
export async function shrinkPhotos(files: Blob[], max?: number): Promise<Blob[]> {
  const out: Blob[] = [];
  for (const f of files) out.push(await shrinkPhoto(f, max));
  return out;
}

/** Texto curto do problema da foto, para o print chegar com o motivo. */
export const photoError = (file: Blob | undefined, e: unknown) =>
  `Não consegui ler essa foto${file?.type ? ` (${file.type})` : ''}: ${e instanceof Error ? e.message : String(e)}`;
