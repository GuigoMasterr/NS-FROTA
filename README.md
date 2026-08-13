# 🚛 NS-FROTA - Sistema de Gestão de Frotas
## Arquivos Atualizados - Versão Completa

### 📦 O que foi alterado:

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `index.html` | ✅ **Reescrito** | Sistema completo com sidebar, login, 9 páginas |
| `js/supabase.js` | ✅ **Reescrito** | Integração REAL com Supabase (não é mais mock) |
| `js/banco-dados.js` | ✅ **Reescrito** | CRUD completo + dados de demonstração |
| `js/auth.js` | ✅ **Ajustado** | Login funcional com sessão |
| `js/veiculos.js` | ✅ **Reescrito** | Gestão completa de veículos |
| `js/manutencao.js` | ✅ **Reescrito** | Preventiva e corretiva |
| `js/gastos.js` | ✅ **Reescrito** | Controle de despesas |
| `js/chamados.js` | ✅ **Reescrito** | Ocorrências e chamados |
| `js/checklist.js` | ✅ **Reescrito** | Inspeção diária com 15 itens |
| `js/alocacoes.js` | ✅ **Reescrito** | Entrada/saída de veículos |
| `js/usuarios.js` | ✅ **Reescrito** | Gestão de usuários e perfis |
| `js/sync.js` | ✅ **Ajustado** | Não tenta localhost em produção |

### 🗑️ Arquivos para REMOVER (antigos/descontinuados):
- `js/js_despesas-viagem.js`
- `js/js_melhorias-dashboard.js`

---

### 🔑 Credenciais já configuradas no código:
- **URL:** `https://ccacecyqkseniqmrvnap.supabase.co`
- **Key:** `sb_publishable_aRQgU6fTTModcqdb4hSgHQ_bPKp2R3m`

---

### 📋 Como instalar:

1. **Substitua** os arquivos na sua pasta do projeto pelos arquivos deste pacote
2. **Remova** os arquivos descontinuados listados acima
3. **Crie as tabelas** no Supabase (execute o SQL abaixo no SQL Editor)
4. **Faça o deploy** (git add, commit, push)

---

### 🗄️ SQL para criar tabelas no Supabase:

```sql
-- Tabela: locais
CREATE TABLE locais (
  id SERIAL PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: veiculos
CREATE TABLE veiculos (
  id SERIAL PRIMARY KEY,
  placa TEXT UNIQUE NOT NULL,
  categoria TEXT,
  marca TEXT,
  modelo TEXT,
  ano INTEGER,
  km_atual INTEGER DEFAULT 0,
  km_inicial INTEGER DEFAULT 0,
  proxima_revisao_km INTEGER,
  seguro_vencimento DATE,
  status TEXT DEFAULT 'disponivel',
  obra_atual TEXT,
  responsavel TEXT,
  data_cadastro DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: usuarios
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  usuario TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  perfil TEXT DEFAULT 'operacional',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: manutencoes
CREATE TABLE manutencoes (
  id SERIAL PRIMARY KEY,
  veiculoId INTEGER REFERENCES veiculos(id),
  tipo TEXT NOT NULL,
  servico TEXT,
  dataPrevista DATE,
  kmPrevisto INTEGER,
  intervaloKm INTEGER,
  intervaloDias INTEGER,
  custo DECIMAL(10,2),
  status TEXT DEFAULT 'Pendente',
  criadoPor TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: gastos
CREATE TABLE gastos (
  id SERIAL PRIMARY KEY,
  data DATE,
  veiculoId INTEGER REFERENCES veiculos(id),
  tipo TEXT,
  obra TEXT,
  valor DECIMAL(10,2),
  observacao TEXT,
  lancadoPor TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: chamados
CREATE TABLE chamados (
  id SERIAL PRIMARY KEY,
  veiculoId INTEGER REFERENCES veiculos(id),
  tipo TEXT,
  obra TEXT,
  km INTEGER,
  descricao TEXT,
  status TEXT DEFAULT 'Aberto',
  responsavel TEXT,
  data TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: checklists
CREATE TABLE checklists (
  id SERIAL PRIMARY KEY,
  veiculoId INTEGER REFERENCES veiculos(id),
  placaVeiculo TEXT,
  motorista TEXT,
  data TIMESTAMP,
  km INTEGER,
  itens JSONB,
  statusGeral TEXT,
  observacoes TEXT,
  criadoPor TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: alocacoes
CREATE TABLE alocacoes (
  id SERIAL PRIMARY KEY,
  veiculoId INTEGER REFERENCES veiculos(id),
  motorista TEXT,
  dataSaida DATE,
  kmSaida INTEGER,
  origem TEXT,
  destino TEXT,
  dataRetorno DATE,
  kmRetorno INTEGER,
  status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela: despesas_viagem
CREATE TABLE despesas_viagem (
  id SERIAL PRIMARY KEY,
  motorista TEXT,
  veiculo TEXT,
  data DATE,
  trajeto TEXT,
  adiantamento DECIMAL(10,2),
  itens JSONB,
  total DECIMAL(10,2),
  status TEXT DEFAULT 'pendente',
  observacoes TEXT,
  comprovantes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dados padrão
INSERT INTO locais (nome) VALUES 
  ('Pátio Metálica'), 
  ('Pátio Usina Conc.'), 
  ('Obra')
ON CONFLICT DO NOTHING;

INSERT INTO usuarios (nome, usuario, senha, perfil, ativo) VALUES
  ('Administrador', 'admin', 'admin123', 'admin', true),
  ('Operador', 'operador', '1234', 'operador', true)
ON CONFLICT DO NOTHING;
```

---

### 🔐 Credenciais de acesso:
| Usuário | Senha | Perfil |
|---------|-------|--------|
| `admin` | `admin123` | 👑 Administrador |
| `operador` | `1234` | ⚙️ Operador |

---

### ✨ Principais melhorias:
- ✅ Sidebar com navegação entre todas as seções
- ✅ Tela de login moderna e segura
- ✅ Integração REAL com Supabase
- ✅ Dados de demonstração carregados automaticamente
- ✅ Design moderno com Tailwind CSS
- ✅ Totalmente responsivo (mobile + desktop)
- ✅ Notificações visuais (toasts)
- ✅ Modais consistentes em todo o sistema
- ✅ Filtros e buscas nas listagens
- ✅ 9 páginas completas e funcionais