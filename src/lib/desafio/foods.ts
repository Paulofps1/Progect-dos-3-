// Contador de calorias: alimentos comuns com kcal por 100 g (valores aproximados,
// referência tabela TACO / rótulos usuais) e uma porção caseira padrão.
// A pessoa sempre pode corrigir as kcal na hora de registrar.

export type Food = { name: string; kcal100: number; portion: string; grams: number; alias?: string };
export type FoodMatch = { name: string; unit: string; kcal: number; grams?: number; mine?: boolean };

export const FOODS: Food[] = [
  // cereais, pães e massas
  { name: 'Arroz branco cozido', kcal100: 128, portion: 'escumadeira', grams: 90 },
  { name: 'Arroz integral cozido', kcal100: 124, portion: 'escumadeira', grams: 90 },
  { name: 'Macarrão cozido', kcal100: 102, portion: 'prato raso', grams: 200, alias: 'massa espaguete' },
  { name: 'Pão francês', kcal100: 300, portion: 'unidade', grams: 50, alias: 'pão de sal' },
  { name: 'Pão de forma', kcal100: 253, portion: 'fatia', grams: 25 },
  { name: 'Pão de forma integral', kcal100: 253, portion: 'fatia', grams: 25, alias: 'pão integral' },
  { name: 'Pão de queijo', kcal100: 363, portion: 'unidade', grams: 20 },
  { name: 'Tapioca (só a massa)', kcal100: 240, portion: 'unidade média', grams: 60 },
  { name: 'Cuscuz de milho cozido', kcal100: 113, portion: 'fatia', grams: 120 },
  { name: 'Aveia em flocos', kcal100: 394, portion: 'colher de sopa', grams: 15 },
  { name: 'Granola', kcal100: 420, portion: 'colher de sopa', grams: 15 },
  { name: 'Farofa', kcal100: 406, portion: 'colher de sopa', grams: 15 },
  { name: 'Batata inglesa cozida', kcal100: 52, portion: 'unidade média', grams: 130 },
  { name: 'Batata frita', kcal100: 267, portion: 'porção pequena', grams: 100 },
  { name: 'Batata-doce cozida', kcal100: 77, portion: 'unidade média', grams: 150 },
  { name: 'Mandioca cozida', kcal100: 125, portion: 'pedaço', grams: 100, alias: 'aipim macaxeira' },
  { name: 'Purê de batata', kcal100: 90, portion: 'colher de servir', grams: 80 },
  // feijões
  { name: 'Feijão carioca cozido', kcal100: 76, portion: 'concha', grams: 86 },
  { name: 'Feijão preto cozido', kcal100: 77, portion: 'concha', grams: 86 },
  { name: 'Feijoada', kcal100: 117, portion: 'concha', grams: 150 },
  { name: 'Lentilha cozida', kcal100: 93, portion: 'concha', grams: 86 },
  // carnes, ovos e peixes
  { name: 'Peito de frango grelhado', kcal100: 159, portion: 'filé', grams: 100, alias: 'frango' },
  { name: 'Coxa de frango assada', kcal100: 215, portion: 'unidade', grams: 100 },
  { name: 'Frango desfiado', kcal100: 163, portion: 'colher de sopa', grams: 25 },
  { name: 'Patinho grelhado', kcal100: 219, portion: 'bife', grams: 100, alias: 'carne bife' },
  { name: 'Alcatra grelhada', kcal100: 241, portion: 'bife', grams: 100, alias: 'carne bife' },
  { name: 'Carne moída refogada', kcal100: 212, portion: 'colher de sopa', grams: 25 },
  { name: 'Picanha assada', kcal100: 289, portion: 'fatia', grams: 100, alias: 'churrasco' },
  { name: 'Linguiça grelhada', kcal100: 296, portion: 'gomo', grams: 60, alias: 'churrasco' },
  { name: 'Filé de tilápia grelhado', kcal100: 128, portion: 'filé', grams: 120, alias: 'peixe' },
  { name: 'Salmão grelhado', kcal100: 243, portion: 'posta', grams: 120, alias: 'peixe' },
  { name: 'Atum em lata', kcal100: 166, portion: 'lata (drenado)', grams: 120 },
  { name: 'Ovo cozido', kcal100: 146, portion: 'unidade', grams: 50 },
  { name: 'Ovo frito', kcal100: 240, portion: 'unidade', grams: 50 },
  { name: 'Ovo mexido', kcal100: 167, portion: 'ovo', grams: 60, alias: 'omelete' },
  { name: 'Strogonoff de frango', kcal100: 157, portion: 'concha', grams: 130 },
  // verduras e legumes
  { name: 'Salada de folhas', kcal100: 15, portion: 'prato de sobremesa', grams: 50, alias: 'alface rúcula' },
  { name: 'Tomate', kcal100: 15, portion: 'unidade', grams: 100 },
  { name: 'Cenoura crua', kcal100: 34, portion: 'colher de sopa ralada', grams: 15 },
  { name: 'Brócolis cozido', kcal100: 25, portion: 'xícara', grams: 90 },
  { name: 'Legumes cozidos', kcal100: 40, portion: 'colher de servir', grams: 80 },
  // frutas
  { name: 'Banana', kcal100: 98, portion: 'unidade', grams: 70 },
  { name: 'Maçã', kcal100: 56, portion: 'unidade', grams: 130 },
  { name: 'Laranja', kcal100: 37, portion: 'unidade', grams: 180 },
  { name: 'Mamão', kcal100: 40, portion: 'fatia', grams: 170 },
  { name: 'Manga', kcal100: 51, portion: 'unidade pequena', grams: 200 },
  { name: 'Abacate', kcal100: 96, portion: 'colher de sopa', grams: 45 },
  { name: 'Morango', kcal100: 30, portion: 'xícara', grams: 150 },
  { name: 'Uva', kcal100: 53, portion: 'cacho pequeno', grams: 100 },
  { name: 'Melancia', kcal100: 33, portion: 'fatia', grams: 200 },
  { name: 'Açaí (só a polpa)', kcal100: 58, portion: 'tigela 300 ml', grams: 300 },
  // leite e derivados
  { name: 'Leite integral', kcal100: 61, portion: 'copo 200 ml', grams: 200 },
  { name: 'Leite desnatado', kcal100: 35, portion: 'copo 200 ml', grams: 200 },
  { name: 'Iogurte natural', kcal100: 51, portion: 'pote', grams: 170 },
  { name: 'Queijo muçarela', kcal100: 330, portion: 'fatia', grams: 20 },
  { name: 'Queijo minas frescal', kcal100: 264, portion: 'fatia', grams: 30 },
  { name: 'Requeijão', kcal100: 257, portion: 'colher de sopa', grams: 30 },
  { name: 'Manteiga', kcal100: 726, portion: 'ponta de faca', grams: 5 },
  { name: 'Whey protein', kcal100: 400, portion: 'scoop', grams: 30 },
  // gorduras e castanhas
  { name: 'Azeite', kcal100: 884, portion: 'colher de sopa', grams: 12 },
  { name: 'Amendoim torrado', kcal100: 606, portion: 'punhado', grams: 30 },
  { name: 'Castanha-do-pará', kcal100: 643, portion: 'unidade', grams: 4 },
  { name: 'Pasta de amendoim', kcal100: 588, portion: 'colher de sopa', grams: 15 },
  // bebidas
  { name: 'Café sem açúcar', kcal100: 9, portion: 'xícara', grams: 50 },
  { name: 'Açúcar', kcal100: 387, portion: 'colher de chá', grams: 5 },
  { name: 'Suco de laranja natural', kcal100: 33, portion: 'copo 300 ml', grams: 300 },
  { name: 'Refrigerante', kcal100: 42, portion: 'lata 350 ml', grams: 350 },
  { name: 'Cerveja', kcal100: 41, portion: 'lata 350 ml', grams: 350 },
  { name: 'Vinho tinto', kcal100: 85, portion: 'taça 150 ml', grams: 150 },
  // lanches e doces
  { name: 'Pizza (muçarela)', kcal100: 280, portion: 'fatia', grams: 100 },
  { name: 'Hambúrguer (sanduíche)', kcal100: 260, portion: 'unidade', grams: 200, alias: 'lanche' },
  { name: 'Coxinha', kcal100: 283, portion: 'unidade', grams: 80, alias: 'salgado' },
  { name: 'Pastel frito', kcal100: 310, portion: 'unidade', grams: 80, alias: 'salgado' },
  { name: 'Chocolate ao leite', kcal100: 540, portion: 'quadradinho', grams: 5 },
  { name: 'Brigadeiro', kcal100: 435, portion: 'unidade', grams: 20, alias: 'doce' },
  { name: 'Sorvete', kcal100: 200, portion: 'bola', grams: 60, alias: 'doce' },
  { name: 'Bolo simples', kcal100: 320, portion: 'fatia', grams: 60, alias: 'doce' },
];

export const kcalOf = (f: Food) => Math.round((f.kcal100 * f.grams) / 100);

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// ---------- alimentos da própria pessoa (aprende com o que ela digitou) ----------
const MINE_KEY = 'desafio:meus-alimentos';
type Mine = { name: string; unit: string; kcal: number };

function readMine(): Mine[] {
  try {
    return JSON.parse(localStorage.getItem(MINE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function rememberFoods(items: Mine[]) {
  const all = readMine();
  for (const it of items) {
    if (!it.name.trim() || !(it.kcal > 0)) continue;
    const i = all.findIndex((m) => norm(m.name) === norm(it.name));
    if (i >= 0) all.splice(i, 1);
    all.unshift({ name: it.name.trim(), unit: it.unit, kcal: Math.round(it.kcal) });
  }
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify(all.slice(0, 100)));
  } catch {
    /* sem espaço: só não lembra */
  }
}

/** Busca por nome (sem acento), primeiro os seus alimentos, depois a lista. */
export function searchFoods(q: string, limit = 6): FoodMatch[] {
  const t = norm(q);
  if (t.length < 2) return [];
  const words = t.split(/\s+/).map(singular);
  const hit = (text: string) => words.every((w) => text.includes(w));
  const mine = readMine()
    .filter((m) => hit(norm(m.name)))
    .map((m) => ({ name: m.name, unit: m.unit, kcal: m.kcal, mine: true }));
  const list = FOODS.filter((f) => hit(norm(`${f.name} ${f.alias ?? ''}`)))
    .sort((a, b) => Number(!norm(a.name).startsWith(t)) - Number(!norm(b.name).startsWith(t)))
    .map((f) => ({ name: f.name, unit: `${f.portion} (${f.grams} g)`, kcal: kcalOf(f), grams: f.grams }));
  const seen = new Set(mine.map((m) => norm(m.name)));
  return [...mine, ...list.filter((f) => !seen.has(norm(f.name)))].slice(0, limit);
}

// plural simples para a busca achar "ovos" → "ovo", "pães" → "pao", "bananas" → "banana"
const PLURAL: Record<string, string> = { paes: 'pao', feijoes: 'feijao', limoes: 'limao', mamoes: 'mamao' };
function singular(w: string) {
  if (PLURAL[w]) return PLURAL[w];
  return w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w;
}

// ---------- "escrever o que comeu": texto → itens com quantidade ----------
const NUM_WORDS: Record<string, number> = {
  meio: 0.5, meia: 0.5, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
};
// palavras de medida que só atrapalham a busca ("2 fatias de pão" → "pão")
const FILLER = /^(fatias?|colher(es)?( de (sopa|cha))?|copos?|xicaras?|xic|conchas?|escumadeiras?|unidades?|un|porc(ao|oes)|pedacos?|pratos?|latas?|potes?|bolas?|filés?|files?|bifes?|punhados?|taças?|tacas?|scoops?)( de)?\s+/;

export type ParsedItem = { name: string; unit: string; kcal: string; quantity: string; found: boolean };

/**
 * Lê frases como "2 ovos mexidos, 1 pão francês e café" ou "200g de arroz com feijão"
 * e devolve os itens com as kcal da lista. O que não achar volta sem kcal para a pessoa
 * completar. Tudo local, sem IA.
 */
export function parseMealText(text: string): ParsedItem[] {
  const SEP = /\s*(?:,|;|\+|\n|\be\b|\bcom\b)\s*/i;
  const chunks = norm(text).split(SEP).map((c) => c.trim()).filter(Boolean);
  // mesmo corte no texto original, para manter acentos no que não for achado
  const original = text.split(SEP).map((c) => c.trim()).filter(Boolean);
  return chunks.map((chunk, idx) => {
    let rest = chunk;
    let qty = 1;
    let grams: number | null = null;
    const g = rest.match(/^(\d+(?:[.,]\d+)?)\s*(g|gr|gramas?|ml)\b(?:\s+de)?\s*/);
    if (g) {
      grams = parseFloat(g[1].replace(',', '.'));
      rest = rest.slice(g[0].length);
    } else {
      const n = rest.match(/^(\d+(?:[.,]\d+)?|\d+\/\d+)\s*/);
      const w = rest.match(/^(\p{L}+)\s+/u);
      if (n) {
        qty = n[1].includes('/') ? Number(n[1].split('/')[0]) / Number(n[1].split('/')[1]) : parseFloat(n[1].replace(',', '.'));
        rest = rest.slice(n[0].length);
      } else if (w && NUM_WORDS[w[1]] != null) {
        qty = NUM_WORDS[w[1]];
        rest = rest.slice(w[0].length);
      }
      // "um e meio" já foi separado pelo " e "; aqui fica simples
    }
    rest = rest.replace(FILLER, '').replace(/^de\s+/, '').trim();
    const match = searchFoods(rest, 1)[0];
    const pretty = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const typed = original.length === chunks.length ? original[idx].replace(/^\S*\d\S*\s*/, '') : rest;
    if (!match) return { name: pretty(typed || rest || chunk), unit: '', kcal: '', quantity: String(qty).replace('.', ','), found: false };
    if (grams != null && match.grams) {
      const kcal100 = (match.kcal * 100) / match.grams;
      return { name: match.name, unit: `${grams} g`, kcal: String(Math.round((kcal100 * grams) / 100)), quantity: '1', found: true };
    }
    return { name: match.name, unit: match.unit, kcal: String(match.kcal), quantity: String(Math.round(qty * 100) / 100).replace('.', ','), found: true };
  });
}
