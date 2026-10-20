# Desafio dos 4

App do desafio de emagrecimento entre Paulo, Arthur, Rafaela e Rogério (19/10 a 20/12/2026,
aposta de R$ 400), adaptado a partir do **Nutri AI** (Vite + React + shadcn + Supabase).

## Rodar no PC (Windows)

1. Extraia esta pasta em `C:\- 7\- Paulo\desafio-dos-3`.
2. Coloque o arquivo `.env` (o do zip do Nutri AI, ou o do seu Supabase) dentro dela.
   Ele não vai para o git. Precisa de `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
   e `VITE_SUPABASE_PROJECT_ID`.
3. Dois cliques em `run-dev.cmd`: instala na 1ª vez e abre http://localhost:8080.

Pelo terminal:

```bash
npm install
npm run dev
```

**Demonstração sem banco:** `npm run build:demo` gera `dist-demo/` com um banco falso no
navegador (`src/integrations/supabase/demoClient.ts`), já logado como Paulo e com dados de exemplo.

## Próximos passos

1. **Supabase:** conectar o projeto, desligar "Confirm email" (Auth → Providers → Email) e criar as
   tabelas do que hoje fica só no aparelho (checklist, pesagens, injeções, desafios, fotos), com
   leitura entre os 3 para o Placar e os Desafios.
2. **Vercel:** importar este repositório (Framework: Vite), colocar as variáveis do `.env`,
   adicionar o redirecionamento de rotas para `index.html` e publicar.

## Já adaptado

- Removido tudo que não vamos usar: landing page e seções de venda, Premium/Upgrade, Admin,
  Notificações, Termos/Política/Contato, IA (chat, scanner, análise de foto e histórico de
  análises), Squads, Receitas, Adicionar comida (`/add-food` vira `/meals`), FAQ e Privacidade
  do perfil, telas de treino ativo/gerador, componentes e imagens sem uso, 7 funções do
  Supabase (ficaram `analyze-body` e `analyze-food-photo`) e 31 bibliotecas sem uso.
- `/` leva direto para `/dashboard` (sem login, cai em `/auth`).
- Menu de baixo: Hoje, Refeições, +, Progresso e **Placar** (`/achievements`).
- `/workouts` virou só registro: botão "Treinei hoje", observação opcional e histórico
  (usa a tabela `workout_sessions`).
- Dieta removida (criar dieta com IA e dietas salvas), junto com metas de kcal vindas dela.
- `/water` mantido como está.

- **Desafio no front** (`src/lib/desafio/rules.ts`, `src/hooks/useDesafio.ts`,
  `src/components/desafio/`): dia perfeito, bônus, sequência de 7, coringas, domingo livre,
  pesos iniciais. Água e treino vêm das tabelas que já existem (`water_consumption`,
  `workout_sessions`); o resto do checklist, as pesagens e as fotos das refeições ficam
  **no aparelho** (`src/lib/desafio/localStore.ts`) até o back-end entrar.
- **Hoje:** checklist do desafio no topo (água, treinou, comeu direito, zero doce + extras),
  pontos e atalhos. Saiu o anel de macros (eram estimativas).
- **Refeições — contador:** busca de ~80 alimentos comuns (`src/lib/desafio/foods.ts`, kcal
  aproximadas TACO) e **"Calcular pela foto"**, que chama a função `analyze-food-photo`
  (restaurada; usa a IA do Lovable) e preenche alimentos e kcal para a pessoa conferir.
- **Refeições:** registrar o que comeu com kcal, foto opcional, total do dia e histórico dos
  últimos 14 dias (dá pra registrar num dia passado e "repetir hoje").
- **Resumo** (`/progress`): pontos, sequência, coringas, calendário, checklist do dia
  escolhido, grade de hábitos do mês, gráfico do mês, pesagens e médias de 7 dias.
- **Placar** (`/achievements`): classificação dos 3, semana e regras. Por enquanto só os
  seus números aparecem; os dos outros dependem do banco.

- **Entrada só com o nome**: "Quem é você?" → toca em Paulo, Arthur ou Rafaela e entra. Cada jogador
  tem uma conta fixa por trás (`<nome>@desafiodos3.app`, senha do app em `VITE_DESAFIO_SENHA`; padrão no
  `useAuth`), criada no 1º toque. Escolha do grupo: qualquer um pode entrar como qualquer um.
  No Supabase: desligar "Confirm email" (Auth → Providers → Email), senão a conta criada fica esperando
  confirmação de um e-mail que não existe.
- **Contador de calorias:** escrever o que comeu ("2 ovos, 1 pão francês e café", "200g de arroz")
  vira itens com kcal pela lista local (`parseMealText` em `src/lib/desafio/foods.ts`); a foto vai
  para a IA e analisar de novo substitui o resultado anterior; item sem kcal impede salvar.
- **Meu histórico** (`/historico`, no Perfil e no menu +): dia a dia com status, hábitos, kcal, água,
  treino, injeção e pesagem.
- Removidos: cadastro inicial (calculava meta de calorias), Meus objetivos, Meu corpo, Medidas
  (e a função `analyze-body`), XP/níveis, selo Premium, "Excluir conta" falso.
- Corrigido: Água gravava a data em UTC (depois das 21h caía no dia seguinte); meta de água padrão
  diferente entre telas (agora 3 L em todas); telas que ficavam carregando sem login; `robots.txt`
  liberando indexação.

## Falta (back-end, depois)

- Placar com os dados dos 3 (hoje cada um só vê os próprios).
- Checklist, pesagens e fotos no banco/Storage (hoje ficam no aparelho).
- Login simples por pessoa (PIN) se for trocar o login por e-mail.
