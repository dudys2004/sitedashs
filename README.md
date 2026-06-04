# Site-Dashs — Portal de Dashboards por cliente

Portal único de login que entrega, para cada cliente, um **dashboard financeiro
próprio** (aparência + dados de uma planilha Google específica).

- **Front:** Vite + React + TypeScript + Tailwind + Recharts (SPA, deploy na Vercel).
- **Auth + dados:** um único **Google Apps Script** vinculado à planilha central.
  Valida login/senha (hash) e lê a planilha do cliente via `openById`.

## Como funciona

```
Login (/)  ──POST {login,senha}──▶  Apps Script central
                                     ├─ confere SHA-256(salt+senha) na aba "usuarios"
                                     └─ openById(planilha do cliente) → JSON do dashboard
        ◀──────────────────────────  { cliente, dashboard }
Dashboard (/:slug) aplica tema+logo do cliente e renderiza KPIs + gráficos.
```

A senha é validada **no servidor (Apps Script)** — sem credencial válida, nenhum
dado é devolvido. O front nunca guarda senhas.

## Rodar localmente

```bash
npm install
npm run dev
```

Sem `VITE_APPS_SCRIPT_URL` definido, o app roda em **modo mock** com dados de
exemplo. Login de teste: **`mln` / `1234`**.

## Configurar o backend (uma vez)

1. Abra a **planilha central** e vá em `Extensões > Apps Script`.
2. Cole o conteúdo de [`apps-script/Code.gs`](apps-script/Code.gs).
3. No editor, rode `ADMIN_criarAbaUsuarios` (cria a aba `usuarios` com cabeçalho).
4. `Implantar > Nova implantação > App da Web`:
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
   - Copie a URL `.../exec`.
5. Garanta que a conta dona do script tem acesso às planilhas dos clientes
   (necessário para o `openById`).

## Conectar o front ao backend

- **Local:** crie um `.env` com:
  ```
  VITE_APPS_SCRIPT_URL=https://script.google.com/a/macros/berry.com.br/s/AKfycbwnvZKELX4v_a5dnh0W3ejBBUkWj7wNAMyEWz7G_7wqWH52rO2ccwj5E9UC1NGYYkUUaA/exec
  ```
- **Vercel:** em *Project Settings > Environment Variables*, adicione
  `VITE_APPS_SCRIPT_URL` com a mesma URL e refaça o deploy.

## Adicionar um novo cliente

1. **Planilha de dados** do cliente: garanta acesso à conta dona do Apps Script.
2. **Senha:** no editor Apps Script, edite `SENHA` em `ADMIN_gerarCredencial`,
   rode e copie `salt` + `senha_hash` do log.
3. **Aba `usuarios`** (planilha central): adicione uma linha:

   | login | senha_hash | salt | slug | id_planilha | nome | ativo |
   |-------|-----------|------|------|-------------|------|-------|
   | mln   | `<hash>`  | `<salt>` | MLN | `18Mouuf...iQ` | MLN | TRUE |

   - `slug` = a URL do cliente (`/MLN`).
   - `id_planilha` = ID da planilha de dados (parte da URL entre `/d/` e `/edit`).
4. **Visual** (`src/config/clientes.ts`): adicione `TEMAS["<slug>"]` com cores e
   o caminho da logo, e coloque a logo em `public/logos/<SLUG>.png`.
5. Commit + push → a Vercel publica. Nenhuma página nova de código é necessária.

## Estrutura da planilha de dados (extrato financeiro)

O Apps Script localiza as colunas pelo nome do cabeçalho (tolerante a acentos):
`MOVIMENTAÇÃO` (Entrada/Saída), `VALOR` (ou `VALOR DE MOVIMENTO`),
`CLASSIFICAÇÃO`, `UNIDADE`, `MÊS COMP.`, `ANO COMP.`. A partir disso calcula:
KPIs (entradas, saídas, saldo, nº de lançamentos), série mensal, despesas por
classificação e comparativo por unidade.
