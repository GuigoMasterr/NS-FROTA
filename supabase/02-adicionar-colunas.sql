-- ==================================================
-- PASSO 2: ADICIONAR COLUNAS NOVAS NAS TABELAS EXISTENTES
-- Execute este arquivo DEPOIS do PASSO 1
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
-- ✅ MENSAGEM
-- ==================================================
DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ PASSO 2 CONCLUÍDO!';
    RAISE NOTICE 'Colunas novas adicionadas em todas as tabelas.';
    RAISE NOTICE 'Agora execute o PASSO 3.';
    RAISE NOTICE '==================================================';
END $$;
