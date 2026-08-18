-- ==================================================
-- 🔄 ATUALIZAÇÃO COMPLETA DO BANCO DE DADOS
-- ✅ 100% Seguro - pode executar várias vezes
-- ✅ Usa IF NOT EXISTS / IF EXISTS em tudo
-- ==================================================

-- ==================================================
-- PARTE 1: CRIAR TABELAS NOVAS (se não existirem)
-- ==================================================

-- Tabela: documentosVeiculos
CREATE TABLE IF NOT EXISTS documentosVeiculos (
    id BIGSERIAL PRIMARY KEY,
    veiculoId INTEGER REFERENCES veiculos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    numero TEXT,
    dataEmissao DATE,
    dataVencimento DATE,
    valor NUMERIC(12,2) DEFAULT 0,
    observacao TEXT,
    dataCadastro DATE DEFAULT CURRENT_DATE,
    pago BOOLEAN DEFAULT false,
    arquivoNome TEXT,
    arquivoTipo TEXT,
    arquivoBase64 TEXT,
    arquivoTamanho BIGINT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela: pontosAbastecimento
CREATE TABLE IF NOT EXISTS pontosAbastecimento (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    endereco TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dados iniciais para pontos de abastecimento
INSERT INTO pontosAbastecimento (nome, endereco) 
SELECT 'Posto Shell - Centro', 'Av. Principal, 100'
WHERE NOT EXISTS (SELECT 1 FROM pontosAbastecimento WHERE nome = 'Posto Shell - Centro');

INSERT INTO pontosAbastecimento (nome, endereco) 
SELECT 'Posto Ipiranga - Rodovia', 'BR-101, Km 50'
WHERE NOT EXISTS (SELECT 1 FROM pontosAbastecimento WHERE nome = 'Posto Ipiranga - Rodovia');

INSERT INTO pontosAbastecimento (nome, endereco) 
SELECT 'Posto Petrobras - Obra', 'Acesso Obra, S/N'
WHERE NOT EXISTS (SELECT 1 FROM pontosAbastecimento WHERE nome = 'Posto Petrobras - Obra');

-- ==================================================
-- PARTE 2: ADICIONAR COLUNAS NOVAS (se não existirem)
-- ==================================================

-- Tabela: usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numeroCNH TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS registroCNH TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS categoriaCNH TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS dataValidadeCNH DATE;

-- Tabela: veiculos
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS usaKm BOOLEAN DEFAULT true;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS usaHorimetro BOOLEAN DEFAULT false;

-- Tabela: checklists
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS usaKm BOOLEAN DEFAULT true;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS usaHorimetro BOOLEAN DEFAULT false;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS horimetro NUMERIC(12,2);

-- Tabela: manutencoes
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS kmAtual NUMERIC(12,2);
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS horimetro NUMERIC(12,2);
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS usaKm BOOLEAN DEFAULT true;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS usaHorimetro BOOLEAN DEFAULT false;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS dataProximaRevisao DATE;

-- Tabela: chamados
ALTER TABLE chamados ADD COLUMN IF NOT EXISTS usaKm BOOLEAN DEFAULT true;
ALTER TABLE chamados ADD COLUMN IF NOT EXISTS usaHorimetro BOOLEAN DEFAULT false;
ALTER TABLE chamados ADD COLUMN IF NOT EXISTS horimetro NUMERIC(12,2);

-- Tabela: alocacoes
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS usaKm BOOLEAN DEFAULT true;
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS usaHorimetro BOOLEAN DEFAULT false;
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS horimetroSaida NUMERIC(12,2);
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS horimetroRetorno NUMERIC(12,2);
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS horimetroRodado NUMERIC(12,2);

-- Tabela: gastos
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS km NUMERIC(12,2);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS horimetro NUMERIC(12,2);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS usaKm BOOLEAN DEFAULT true;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS usaHorimetro BOOLEAN DEFAULT false;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS pontoAbastecimento TEXT;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS tipoCombustivel TEXT;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS litros NUMERIC(12,3);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS perfilLancamento TEXT;

-- Tabela: adiantamentos
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS origem TEXT;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS destino TEXT;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS fechado BOOLEAN DEFAULT false;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS valorEstornado NUMERIC(12,2) DEFAULT 0;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS gastos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS estornos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS liberadoPor TEXT;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS dataLiberacao TIMESTAMP WITH TIME ZONE;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS dataFechamento TIMESTAMP WITH TIME ZONE;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS fechadoPor TEXT;

-- ==================================================
-- PARTE 3: DESATIVAR RLS (se as tabelas existirem)
-- ==================================================

ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS veiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS manutencoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chamados DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alocacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gastos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS adiantamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS locais DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documentosVeiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pontosAbastecimento DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS solicitacoesTransferencia DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS historico_condutores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gastosViagem DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dados_gerais DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS despesas_gerais DISABLE ROW LEVEL SECURITY;

-- ==================================================
-- ✅ MENSAGEM DE SUCESSO
-- ==================================================
DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ BANCO DE DADOS ATUALIZADO COM SUCESSO!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Tabelas novas criadas: documentosVeiculos, pontosAbastecimento';
    RAISE NOTICE 'Colunas adicionadas em: usuarios, veiculos, checklists,';
    RAISE NOTICE 'manutencoes, chamados, alocacoes, gastos, adiantamentos';
    RAISE NOTICE 'RLS desativado para sincronização automática.';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Agora atualize o sistema e faça Ctrl+F5!';
    RAISE NOTICE '==================================================';
END $$;
