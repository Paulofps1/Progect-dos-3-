# Desafio dos 4

App do desafio de emagrecimento entre Paulo, Arthur, Rafaela e Rogério (19/10 a 20/12/2026,
aposta de R$ 400). Vite + React + Tailwind/shadcn, banco **Supabase próprio**, publicado na
**Vercel** (cada push na `main` publica sozinho). Nasceu do Nutri AI (Lovable), mas não depende
mais do Lovable.

## Banco (Supabase)

- `supabase/novo-banco.sql`: monta o banco inteiro num projeto vazio (tabelas, permissões e pastas
  de fotos). Cole no SQL Editor e rode. Em Authentication → Sign In / Providers → Email, deixe
  **Confirm email** desligado.
- `supabase/importar-dias-antigos.sql`: trouxe os dias 17 a 19/10 do banco antigo. Já usado.
- Variáveis (Vercel e `.env` local, que não vai para o git): `VITE_SUPABASE_URL`,
  `VITE_SUPABASE_PUBLISHABLE_KEY` (chave anon) e `VITE_SUPABASE_PROJECT_ID`.

## Rodar no PC

```bash
npm install
npm run dev      # http://localhost:8080 (precisa do .env)
npm run build:demo   # demonstração com banco falso no navegador, em dist-demo/
```

## Onde está cada coisa

- **Regras e pontos:** `src/lib/desafio/rules.ts` (dia perfeito, bônus, sequência, coringas,
  domingo livre, pesos iniciais, regras que valem a partir de 21/10) e `challenges.ts`
  (desafios do grupo, +1 por dia cumprido).
- **Dados do desafio:** `src/hooks/useDesafio.ts` junta água/treino/refeições (tabelas) com o
  checklist, pesagens, injeções, sono e perfil (tabela `desafio_dados`, com cópia no aparelho).
  O resumo dos dias vai para o banco e é o que os outros veem no Placar.
- **Fotos:** pasta `refeicoes` (pratos e evolução do corpo, privadas) e `provas` (print do cardio,
  todos veem).
- **Entrada só com o nome:** cada jogador tem uma conta fixa (`<nome>@desafiodos3.app`, senha
  interna em `src/lib/desafio/accounts.ts`), criada no 1º toque.
- **Telas:** Hoje, Refeições (fotos), Resumo, Placar, Desafios, Água, Treinos, Injeção, Sono,
  Histórico, Perfil (IMC e meta, evolução em fotos, instalar o app).
