-- ==================================================
-- 🔄 ATUALIZAÇÃO DO BANCO DE DADOS SUPABASE
-- Execute este SQL no Editor SQL do seu projeto Supabase
-- ==================================================

-- ==================================================
-- 1. ADICIONAR NOVAS COLUNAS NA TABELA usuarios
-- ==================================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numeroCNH TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS registroCNH TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS categoriaCNH TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS dataValidadeCNH DATE;

COMMENT ON COLUMN usuarios.cpf IS 'CPF do usuário (apenas números)';
COMMENT ON COLUMN usuarios.telefone IS 'Telefone com DDD (apenas números)';
COMMENT ON COLUMN usuarios.numeroCNH IS 'Número da CNH';
COMMENT ON COLUMN usuarios.registroCNH IS 'Número de registro da CNH';
COMMENT ON COLUMN usuarios.categoriaCNH IS 'Categoria da CNH (A, B, C, D, E, AB, etc.)';
COMMENT ON COLUMN usuarios.dataValidadeCNH IS 'Data de validade da CNH';

-- ==================================================
-- 2. CRIAR TABELA documentosVeiculos
-- ==================================================
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

-- ==================================================
-- 3. CRIAR TABELA pontosAbastecimento
-- ==================================================
CREATE TABLE IF NOT EXISTS pontosAbastecimento (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    endereco TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dados iniciais para pontos de abastecimento
INSERT INTO pontosAbastecimento (nome, endereco) VALUES 
    ('Posto Shell - Centro', 'Av. Principal, 100'),
    ('Posto Ipiranga - Rodovia', 'BR-101, Km 50'),
    ('Posto Petrobras - Obra', 'Acesso Obra, S/N')
ON CONFLICT DO NOTHING;

-- ==================================================
-- 4. ADICIONAR NOVAS COLUNAS NA TABELA veiculos
-- ==================================================
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS usaKm BOOLEAN DEFAULT true;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS usaHorimetro BOOLEAN DEFAULT false;

COMMENT ON COLUMN veiculos.usaKm IS 'Indica se o veículo usa controle por KM';
COMMENT ON COLUMN veiculos.usaHorimetro IS 'Indica se o veículo usa controle por Horímetro';

-- ==================================================
-- 5. ADICIONAR NOVAS COLUNAS NA TABELA checklists
-- ==================================================
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS usaKm BOOLEAN DEFAULT true;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS usaHorimetro BOOLEAN DEFAULT false;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS horimetro NUMERIC(12,2);

-- ==================================================
-- 6. ADICIONAR NOVAS COLUNAS NA TABELA manutencoes
-- ==================================================
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS kmAtual NUMERIC(12,2);
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS horimetro NUMERIC(12,2);
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS usaKm BOOLEAN DEFAULT true;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS usaHorimetro BOOLEAN DEFAULT false;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS dataProximaRevisao DATE;

-- ==================================================
-- 7. ADICIONAR NOVAS COLUNAS NA TABELA chamados
-- ==================================================
ALTER TABLE chamados ADD COLUMN IF NOT EXISTS usaKm BOOLEAN DEFAULT true;
ALTER TABLE chamados ADD COLUMN IF NOT EXISTS usaHorimetro BOOLEAN DEFAULT false;
ALTER TABLE chamados ADD COLUMN IF NOT EXISTS horimetro NUMERIC(12,2);

-- ==================================================
-- 8. ADICIONAR NOVAS COLUNAS NA TABELA alocacoes
-- ==================================================
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS usaKm BOOLEAN DEFAULT true;
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS usaHorimetro BOOLEAN DEFAULT false;
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS horimetroSaida NUMERIC(12,2);
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS horimetroRetorno NUMERIC(12,2);
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS horimetroRodado NUMERIC(12,2);

-- ==================================================
-- 9. ADICIONAR NOVAS COLUNAS NA TABELA gastos
-- ==================================================
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS km NUMERIC(12,2);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS horimetro NUMERIC(12,2);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS usaKm BOOLEAN DEFAULT true;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS usaHorimetro BOOLEAN DEFAULT false;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS pontoAbastecimento TEXT;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS tipoCombustivel TEXT;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS litros NUMERIC(12,3);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS perfilLancamento TEXT;

-- ==================================================
-- 10. ADICIONAR NOVAS COLUNAS NA TABELA adiantamentos
-- ==================================================
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
-- 11. DESATIVAR RLS PARA TODAS AS TABELAS
-- (Permite que o sistema sincronize sem políticas)
-- ==================================================
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE manutencoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE chamados DISABLE ROW LEVEL SECURITY;
ALTER TABLE alocacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE gastos DISABLE ROW LEVEL SECURITY;
ALTER TABLE adiantamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE locais DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentosVeiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE pontosAbastecimento DISABLE ROW LEVEL SECURITY;

-- Tenta desativar RLS em tabelas que podem existir
ALTER TABLE IF EXISTS solicitacoesTransferencia DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS historico_condutores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gastosViagem DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dados_gerais DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS despesas_gerais DISABLE ROW LEVEL SECURITY;

-- ==================================================
-- ✅ MENSAGEM FINAL
-- ==================================================
DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ BANCO DE DADOS ATUALIZADO COM SUCESSO!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Novas colunas adicionadas em: usuarios, veiculos,';
    RAISE NOTICE 'checklists, manutencoes, chamados, alocacoes,';
    RAISE NOTICE 'gastos, adiantamentos';
    RAISE NOTICE '';
    RAISE NOTICE 'Novas tabelas criadas:';
    RAISE NOTICE '  - documentosVeiculos';
    RAISE NOTICE '  - pontosAbastecimento';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS desativado para sincronização automática.';
    RAISE NOTICE '==================================================';
END $$;