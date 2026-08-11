# 🚛 Sistema de Gestão de Frotas

Sistema para controle e gerenciamento de frota de veículos, incluindo cadastro, manutenção, abastecimento, check-list, chamados e alocações.

## 📂 Estrutura
- `assets/` — Imagens, ícones e recursos
- `css/` — Estilos visuais
- `js/core/` — Base do sistema (configuração, banco de dados, autenticação, utilitários, validações)
- `js/modulos/` — Módulos por assunto (veículos, manutenção, gastos, etc.)
- `paginas/` — Páginas internas do sistema

## 🚀 Como usar
1. Abrir `index.html` no navegador
2. Os dados são armazenados localmente no navegador
3. Para o app do motorista, abrir `app-motorista.html` em um servidor local para habilitar o modo instalável

## 📱 App do motorista
- O arquivo `app-motorista.html` foi preparado como PWA para instalação no Android e no iPhone
- O check-list do motorista usa o mesmo fluxo e o mesmo banco local do sistema principal
- O projeto inclui `manifest.webmanifest` e `sw.js` para instalação e cache básico offline

## 📦 Wrapper nativo
O bundle usado pelo Capacitor fica em `app/`.
1. Instalar dependências com `npm install`
2. Adicionar plataformas com `npm run cap:add:android` e `npm run cap:add:ios`
3. Sincronizar com `npm run cap:sync`
4. Abrir no Android Studio ou Xcode com `npm run cap:open:android` e `npm run cap:open:ios`

## 🔄 Sincronização local
- Iniciar o backend com `npm run sync:server`
- O app usa `http://localhost:3000/api` por padrão; ajuste `gf_sync_url` no `localStorage` se o backend estiver em outro host
- As rotas sincronizam `checklists` e `chamados` entre o app do motorista e o painel

## ⚠️ Build Android
- No Windows, o build Android exige um SDK instalado e um caminho sem caracteres não ASCII para evitar problemas com o Gradle
- Se o projeto estiver em um diretório com acento, o Gradle pode exigir `android.overridePathCheck=true`