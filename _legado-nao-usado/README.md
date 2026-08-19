# Arquivos não utilizados pelo sistema atual

Nenhum arquivo desta pasta foi apagado. Todos foram movidos para cá porque
uma auditoria do código (19/08/2026) confirmou que nenhuma página HTML do
projeto os carrega — ou seja, são código morto que só aumentava o risco de
confusão em futuras manutenções (por exemplo, editar `js/app.js` esperando
que a alteração tivesse efeito no sistema, quando na verdade esse arquivo
nunca é executado).

## js/

- `app.js`, `correcoes.js`, `correcoes-layout.js`, `despesas-viagem-patch.js`,
  `melhorias-checklist-v2.js`, `melhorias-veiculos.js`,
  `modulos-complementares.js`: versões antigas ou patches pontuais de
  funcionalidades que hoje já existem nos módulos ativos (`js/veiculos.js`,
  `js/despesas-viagem.js`, `js/checklist.js` etc.). Não são referenciados em
  nenhum `<script>` de `index.html`, `app-motorista.html` ou `app/index.html`.
- `supabase-sync.js`: uma implementação alternativa e mais antiga de
  sincronização bidirecional com o Supabase. Nunca foi carregada por
  nenhuma página; o sistema usa exclusivamente `js/sync.js`.
- `dashboard.js`: encontrado ainda duplicado em `js/` na rodada de correções
  de 19/08/2026 (a movimentação anterior havia copiado os oito arquivos
  acima para cá, mas sem remover os originais de `js/`, e este arquivo em
  especial não fazia parte daquela lista). Nenhum `<script>` o carrega; o
  dashboard ativo usa `js/melhorias-dashboard.js`. Nesta rodada as cópias
  duplicadas em `js/` foram removidas — este arquivo só existe aqui agora.

## server/

`sync-server.js` é um servidor Express separado, que grava dados em um
arquivo JSON local (`server/data/sync.json`), sem nenhuma relação com o
Supabase. Nenhuma página do site principal (`index.html`, `app-motorista.html`)
faz requisição para `/api/sync/...`. É consumido apenas por
`app/js/sync.js`, isto é, pelo aplicativo mobile empacotado via Capacitor
(`webDir: "app"` em `capacitor.config.json`), que aponta para
`http://localhost:3000/api` — um endereço que não existe fora do ambiente de
desenvolvimento local. Esse é o achado mais crítico da auditoria: **o
aplicativo instalado no celular do motorista está isolado do Supabase e do
painel administrativo**, e continuará isolado mesmo com as demais correções
de sincronização aplicadas ao restante do sistema.

Antes de decidir remover esta pasta definitivamente, é necessário decidir o
que fazer com o app mobile (ver relatório de auditoria entregue em
19/08/2026, item sobre o `webDir` do Capacitor).
