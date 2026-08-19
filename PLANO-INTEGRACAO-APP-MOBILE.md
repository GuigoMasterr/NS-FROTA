# Plano para integrar o app mobile (Capacitor) ao Supabase

Este documento **não altera nenhum arquivo do app mobile**. É só o
levantamento técnico para quando houver decisão de arquitetura sobre o
assunto — conforme combinado, esta rodada de correções não mexe em `app/`.

## Situação atual (confirmada em auditoria de código)

- `capacitor.config.json` define `webDir: "app"` — ou seja, o aplicativo
  instalado no celular do motorista (Android/iOS, via Capacitor) empacota o
  conteúdo da pasta `app/`, **não** `app-motorista.html` da raiz.
- Dentro de `app/`, o arquivo `app/js/sync.js` fala com um servidor Express
  próprio (`server/sync-server.js`, hoje em `_legado-nao-usado/`) no
  endereço `http://localhost:3000/api`. Esse endereço só existe em ambiente
  de desenvolvimento local — não existe em produção.
- Resultado: **o app instalado no celular do motorista está isolado do
  Supabase e do painel administrativo web**. Ele tem seu próprio
  `app/js/banco-dados.js` e `app/js/config.js`, sem relação com as tabelas
  reais.
- Por outro lado, `app-motorista.html` (na raiz do projeto) **já está
  correto**: carrega o SDK do Supabase, `supabase.js`, `js/supabase.js` e
  `js/sync.js` — o mesmo motor de sincronização usado pelo painel web,
  incluindo a correção de reconexão automática desta rodada.

## Duas opções para quando for decidido avançar

### Opção A — Recomendada: apontar o Capacitor para `app-motorista.html`

Trocar `webDir` em `capacitor.config.json` de `"app"` para a raiz do
projeto (ou copiar `app-motorista.html` + os módulos que ele usa para uma
pasta própria de build), fazendo o app nativo carregar exatamente a mesma
página PWA que já funciona no navegador do celular.

- Vantagens: reaproveita 100% do motor de sincronização já corrigido, zero
  duplicação de lógica, um único lugar para manter.
- Riscos: a pasta `app/` tem uma UI própria (`app/index.html`,
  `app/css/estilos.css`) desenhada especificamente para o app nativo; se ela
  tiver ajustes de layout/UX que `app-motorista.html` não tem, esses ajustes
  precisariam ser portados antes da troca.

### Opção B — Portar `app/js/banco-dados.js`, `app/js/config.js` e
`app/js/sync.js` para falar com o Supabase, mantendo a estrutura de pastas
atual do app nativo.

- Vantagens: preserva a UI própria do app mobile sem mudanças visuais.
- Riscos: cria uma SEGUNDA implementação da lógica de sincronização
  (duplicação que a Regra 5 do processo de correções pede para evitar);
  qualquer correção futura no motor de sync (como a de reconexão desta
  rodada) precisaria ser replicada manualmente nos dois lugares.

## O que falta decidir antes de implementar

1. Qual das duas opções acima (ou uma terceira, se houver motivo técnico).
2. Se a Opção A for escolhida, se a UI de `app/` tem algo que precisa ser
   portado para `app-motorista.html` antes da troca do `webDir`.
3. Se o RLS (Row Level Security) do Supabase será ativado antes de expor o
   app a mais um cliente com a mesma anon key hoje exposta no código —
   ponto de segurança já registrado como pendente em auditorias anteriores,
   independente do app mobile.

Nenhuma dessas decisões foi tomada nesta rodada; este documento existe só
para que a próxima etapa comece com o diagnóstico pronto, sem precisar
reaudita o projeto do zero.
