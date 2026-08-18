# 🐛 Correções do Dashboard - NS Frotas

## Problemas Identificados e Corrigidos

### 1. **`supabase.js` (raiz)** - Sintaxe de módulos ES6 incompatível
- **Problema**: Usava `import` e `export` que só funcionam em módulos, não em scripts `<script src>`
- **Correção**: Reescrito como função auto-executável que cria `window.supabaseReal` e `window.supabase`

### 2. **`window.supabaseReal` nunca era criado**
- **Problema**: Nenhum arquivo criava o cliente do Supabase corretamente
- **Correção**: O novo `supabase.js` detecta o SDK carregado via CDN e cria o cliente

### 3. **Múltiplas chaves no localStorage** (3 chaves diferentes!)
- **Problema**: Arquivos diferentes usavam `bd_frotas`, `NS_FROTA_DADOS`, `bd_frotas_v3`
- **Correção**: Unificado em `bd_frotas` no `banco-dados.js`

### 4. **Múltiplas funções sobrescrevendo umas às outras**
- **Problema**: `inicializarBD()`, `salvarDados()`, `sincronizarBD()` definidas em vários arquivos
- **Correção**: `banco-dados.js` agora é a fonte única, `sync.js` tem a sincronização unificada

### 5. **`js/supabase.js` sobrescrevia `window.BD` como vazio**
- **Problema**: `window.BD = {veiculos: [], gastos: [], ...}` apagava dados carregados
- **Correção**: Agora só cria se não existir: `if (!window.BD) { ... }`

### 6. **Ordem de carregamento incorreta**
- **Problema**: `inicializador.js` não era carregado
- **Correção**: Adicionado como PRIMEIRO script no `index.html`

---

## 📋 Arquivos Modificados

1. **`supabase.js`** (raiz) - Conexão com Supabase
2. **`js/banco-dados.js`** - BD local unificado com dados de demonstração
3. **`js/sync.js`** - Sincronização Supabase ↔ Local
4. **`js/auth.js`** - Autenticação e inicialização do sistema
5. **`js/supabase.js`** - Wrapper de sincronização (não apaga mais o BD)
6. **`index.html`** - Ordem dos scripts corrigida

---

## ⚠️ IMPORTANTE: Configurar a Chave do Supabase

Abra o arquivo **`supabase.js`** na raiz e verifique se a chave está correta:

```javascript
const SUPABASE_URL = 'https://ccacecyqksenigmrvnap.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aRQgU6fTTModcqdb4hSgHQ_bPKp2R3m';
```

### Como obter a chave correta:
1. Acesse o **Supabase Dashboard**
2. Vá em **Project Settings** → **API**
3. Copie a **Project URL** e a **anon public key**
4. Cole no arquivo `supabase.js`

> 💡 A chave `anon` do Supabase é um token JWT longo que começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Se o Supabase não estiver configurado:
O sistema funcionará em **modo local** usando `localStorage` com dados de demonstração.

---

## 🚀 Como Testar

1. **Substitua os arquivos** no seu projeto pelos arquivos corrigidos
2. **Abra o `index.html`** no navegador ou faça deploy no Vercel
3. **Faça login** com: `admin` / `admin123`
4. O dashboard agora deve mostrar:
   - ✅ 4 veículos cadastrados
   - ✅ 2 em operação, 1 em manutenção
   - ✅ Gastos do mês
   - ✅ Gráficos com dados

---

## 📦 Deploy no Vercel

1. Faça commit das alterações no GitHub
2. O Vercel detectará automaticamente e fará o redeploy
3. Ou use `vercel --prod` no terminal

---

## 🆘 Se ainda não carregar dados do Supabase:

Verifique se as **RLS (Row Level Security)** estão configuradas no Supabase:
- Vá em **Authentication** → **Policies**
- Para cada tabela, crie uma política que permita `SELECT` para todos os usuários (ou usuários autenticados)

Exemplo de política para a tabela `veiculos`:
```sql
CREATE POLICY "Permitir leitura pública" ON veiculos
FOR SELECT USING (true);
```
