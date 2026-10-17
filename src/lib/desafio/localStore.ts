// Cópia NESTE aparelho (por usuário) do checklist, pesagens, injeções e desafios,
// que também vão para o banco (remote.ts). Fotos das refeições ficam só aqui.

import type { CheckKey, Injection, Player, Sleep, Weight } from './rules';
import type { Challenge } from './challenges';

type Checks = Record<string, Partial<Record<CheckKey, boolean>>>; // por data

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
  getDbCache: (userId: string) => read<{ water: Record<string, number>; trained: string[] }>(k(userId, 'cache-banco'), { water: {}, trained: [] }),
  hasDbCache: (userId: string) => localStorage.getItem(k(userId, 'cache-banco')) !== null,
  setDbCache: (userId: string, v: { water: Record<string, number>; trained: string[] }) => write(k(userId, 'cache-banco'), v),
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
export function shrinkPhoto(file: File, max = 1000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('falha ao reduzir'))), 'image/jpeg', 0.75);
    };
    img.onerror = () => reject(new Error('imagem inválida'));
    img.src = url;
  });
}
