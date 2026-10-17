// Banco de mentira para o MODO DEMONSTRAÇÃO (`npm run build:demo`).
// Imita só o pedaço do cliente Supabase que o app usa, guardando tudo no
// localStorage do navegador. Já entra logado como Paulo, com dados de exemplo.
// Nunca é usado no build normal (o vite troca o import só no modo "demo").

type Row = Record<string, unknown>;
type Db = Record<string, Row[]>;

const KEY = 'desafio-demo:db:v1';
const USER_ID = 'demo-paulo';

const pad = (n: number) => String(n).padStart(2, '0');
const day = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function seed(): Db {
  const meal = (offset: number, name: string, meal_type: string, items: [string, number, string][]) => {
    const kcal = items.reduce((s, [, k]) => s + k, 0);
    return {
      id: uid(), user_id: USER_ID, name, meal_type, date: day(offset), time: null, created_at: new Date().toISOString(),
      total_calories: kcal, total_protein: Math.round(kcal * 0.1), total_carbs: Math.round(kcal * 0.4), total_fat: Math.round(kcal * 0.03),
      meal_items: items.map(([food_name, calories, unit]) => ({ food_name, quantity: 1, unit, calories, protein: 0, carbs: 0, fat: 0 })),
    };
  };
  return {
    profiles: [{ id: USER_ID, full_name: 'Paulo (demo)', water_goal_ml: 3000, has_seen_onboarding: true, first_login: false, password_created: true, is_premium: true, current_streak: 0 }],
    meals: [
      meal(0, 'Café da manhã', 'breakfast', [['Ovo mexido', 200, 'ovo (60 g)'], ['Pão de forma integral', 63, 'fatia (25 g)'], ['Café sem açúcar', 5, 'xícara (50 g)']]),
      meal(1, 'Almoço', 'lunch', [['Arroz branco cozido', 115, 'escumadeira (90 g)'], ['Feijão carioca cozido', 65, 'concha (86 g)'], ['Peito de frango grelhado', 159, 'filé (100 g)'], ['Salada de folhas', 8, 'prato de sobremesa (50 g)']]),
      meal(1, 'Jantar', 'dinner', [['Salmão grelhado', 292, 'posta (120 g)'], ['Legumes cozidos', 32, 'colher de servir (80 g)']]),
    ],
    water_consumption: [
      { id: uid(), user_id: USER_ID, date: day(0), amount_ml: 1000 },
      { id: uid(), user_id: USER_ID, date: day(0), amount_ml: 500 },
      { id: uid(), user_id: USER_ID, date: day(1), amount_ml: 3000 },
    ],
    workout_sessions: [{ id: uid(), user_id: USER_ID, date: day(1), modality: 'academia', notes: 'Pernas' }],
    daily_consumption: [
      { id: uid(), user_id: USER_ID, date: day(0), calories: 268, protein: 27, carbs: 107, fat: 8 },
      { id: uid(), user_id: USER_ID, date: day(1), calories: 671, protein: 67, carbs: 268, fat: 20 },
    ],
    diets: [],
    body_measurements: [],
    challenges: [],
    challenge_participants: [],
    user_progress: [],
  };
}

// exemplos do que o app guarda fora do banco (injeção, próxima marcada)
function seedLocal() {
  try {
    localStorage.setItem(`desafio:${USER_ID}:injections`, JSON.stringify([{ date: day(5), ml: 0.5, site: 'Abdômen' }]));
    localStorage.setItem(`desafio:${USER_ID}:next-injection`, JSON.stringify(day(-2)));
    localStorage.setItem(
      `desafio:${USER_ID}:checks`,
      JSON.stringify({ [day(1)]: { comida: true, doce: true, passos: true }, [day(2)]: { comida: true, doce: true }, [day(3)]: { doce: true, cardio: true } }),
    );
    const now = new Date().toISOString();
    localStorage.setItem(
      'desafio:challenges',
      JSON.stringify([
        { id: 'demo-convite', metric: 'agua', days: 7, start: day(-1), createdBy: 'Rafaela', accepted: ['Rafaela', 'Arthur'], createdAt: now },
        { id: 'demo-ativo', metric: 'doce', days: 7, start: day(3), createdBy: 'Arthur', accepted: ['Arthur', 'Paulo', 'Rafaela'], createdAt: now },
      ]),
    );
  } catch {
    /* ignora */
  }
}

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* sem storage: usa só memória */
  }
  const db = seed();
  save(db);
  seedLocal();
  return db;
}
let db: Db = load();
function save(d: Db = db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* ignora */
  }
}

type Filter = (r: Row) => boolean;
type Result = { data: unknown; error: null | { message: string }; count?: number };

class Query implements PromiseLike<Result> {
  private filters: Filter[] = [];
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: Row[] = [];
  private patch: Row = {};
  private sortBy: { col: string; asc: boolean } | null = null;
  private max: number | null = null;
  private one: 'single' | 'maybe' | null = null;
  private wantRows = false;

  constructor(private table: string) {}

  select() {
    if (this.op === 'select') this.op = 'select';
    else this.wantRows = true;
    return this;
  }
  insert(v: Row | Row[]) {
    this.op = 'insert';
    this.payload = Array.isArray(v) ? v : [v];
    return this;
  }
  upsert(v: Row | Row[]) {
    this.op = 'upsert';
    this.payload = Array.isArray(v) ? v : [v];
    return this;
  }
  update(v: Row) {
    this.op = 'update';
    this.patch = v;
    return this;
  }
  delete() {
    this.op = 'delete';
    return this;
  }
  eq(c: string, v: unknown) { this.filters.push((r) => r[c] === v); return this; }
  neq(c: string, v: unknown) { this.filters.push((r) => r[c] !== v); return this; }
  gte(c: string, v: never) { this.filters.push((r) => (r[c] as never) >= v); return this; }
  lte(c: string, v: never) { this.filters.push((r) => (r[c] as never) <= v); return this; }
  gt(c: string, v: never) { this.filters.push((r) => (r[c] as never) > v); return this; }
  lt(c: string, v: never) { this.filters.push((r) => (r[c] as never) < v); return this; }
  in(c: string, vs: unknown[]) { this.filters.push((r) => vs.includes(r[c])); return this; }
  order(col: string, o?: { ascending?: boolean }) { this.sortBy = { col, asc: o?.ascending !== false }; return this; }
  limit(n: number) { this.max = n; return this; }
  single() { this.one = 'single'; return this; }
  maybeSingle() { this.one = 'maybe'; return this; }

  private run(): Result {
    const rows = (db[this.table] ??= []);
    const match = (r: Row) => this.filters.every((f) => f(r));
    let out: Row[] = [];
    if (this.op === 'insert' || this.op === 'upsert') {
      out = this.payload.map((p) => {
        const row = { id: uid(), created_at: new Date().toISOString(), ...p };
        const i = this.op === 'upsert' ? rows.findIndex((r) => r.id === row.id) : -1;
        if (i >= 0) rows[i] = { ...rows[i], ...row };
        else rows.push(row);
        return row;
      });
      save();
    } else if (this.op === 'update') {
      for (const r of rows) {
        if (!match(r)) continue;
        Object.assign(r, this.patch);
        out.push(r);
      }
      save();
    } else if (this.op === 'delete') {
      out = rows.filter(match);
      db[this.table] = rows.filter((r) => !match(r));
      save();
    } else {
      out = rows.filter(match);
      if (this.sortBy) {
        const { col, asc } = this.sortBy;
        out = [...out].sort((a, b) => ((a[col] as never) < (b[col] as never) ? -1 : 1) * (asc ? 1 : -1));
      }
      if (this.max != null) out = out.slice(0, this.max);
    }
    const copy = JSON.parse(JSON.stringify(out)) as Row[];
    if (this.one) {
      if (!copy.length && this.one === 'single') return { data: null, error: { message: 'Nenhuma linha' } };
      return { data: copy[0] ?? null, error: null };
    }
    return { data: this.op === 'select' || this.wantRows ? copy : null, error: null, count: copy.length };
  }

  then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, fail?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return Promise.resolve().then(() => this.run()).then(ok, fail);
  }
}

const user = { id: USER_ID, email: 'paulo@demo', user_metadata: { full_name: 'Paulo (demo)' } };
const session = { user, access_token: 'demo', token_type: 'bearer' };
const noError = { data: { user, session }, error: null };

const channel = { on: () => channel, subscribe: () => channel };

export const supabase = {
  from: (table: string) => new Query(table),
  auth: {
    getSession: async () => ({ data: { session }, error: null }),
    getUser: async () => ({ data: { user }, error: null }),
    onAuthStateChange: (cb: (e: string, s: typeof session) => void) => {
      setTimeout(() => cb('SIGNED_IN', session), 0);
      return { data: { subscription: { unsubscribe() {} } } };
    },
    signInWithPassword: async () => noError,
    signUp: async () => noError,
    signInWithOAuth: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    updateUser: async () => noError,
  },
  functions: {
    invoke: async (name: string) => {
      await new Promise((r) => setTimeout(r, 1200));
      if (name === 'analyze-food-photo')
        return {
          data: {
            foods: [
              { name: 'Arroz branco', quantity: 120, calories: 155 },
              { name: 'Feijão carioca', quantity: 100, calories: 76 },
              { name: 'Bife grelhado', quantity: 120, calories: 290 },
            ],
            meal_description: 'Demonstração: a IA de verdade analisa a sua foto',
          },
          error: null,
        };
      return { data: null, error: { message: 'Indisponível na demonstração' } };
    },
  },
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: { message: 'Indisponível na demonstração' } }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
  channel: () => channel,
  removeChannel: () => undefined,
};

export const resetDemo = () => {
  db = seed();
  save();
};

export const reseedLocal = seedLocal;
