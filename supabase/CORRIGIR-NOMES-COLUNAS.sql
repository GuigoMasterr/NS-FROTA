-- ==================================================
-- Cria tabela locais se não existir
-- ==================================================
CREATE TABLE IF NOT EXISTS locais (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insere locais padrão
INSERT INTO locais (nome) 
SELECT 'Pátio Metálica' WHERE NOT EXISTS (SELECT 1 FROM locais WHERE nome = 'Pátio Metálica');
INSERT INTO locais (nome) 
SELECT 'Pátio Usina Conc.' WHERE NOT EXISTS (SELECT 1 FROM locais WHERE nome = 'Pátio Usina Conc.');
INSERT INTO locais (nome) 
SELECT 'Obra' WHERE NOT EXISTS (SELECT 1 FROM locais WHERE nome = 'Obra');

-- ==================================================
-- 🔧 CORRIGIR NOMES DAS COLUNAS NO SUPABASE
-- O Postgres converte tudo para minúsculas por padrão
-- Execute este SQL no Supabase
-- ==================================================

-- Remove colunas antigas se existirem (com nomes incorretos)
ALTER TABLE usuarios DROP COLUMN IF EXISTS "dataValidadeCNH";
ALTER TABLE usuarios DROP COLUMN IF EXISTS "numeroCNH";
ALTER TABLE usuarios DROP COLUMN IF EXISTS "registroCNH";
ALTER TABLE usuarios DROP COLUMN IF EXISTS "categoriaCNH";

-- Cria/garante colunas com nomes em minúsculas (padrão Postgres)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numerocnh TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS registrocnh TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS categoriacnh TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS datavalidadecnh DATE;

-- Tabela veiculos
ALTER TABLE veiculos DROP COLUMN IF EXISTS "usaKm";
ALTER TABLE veiculos DROP COLUMN IF EXISTS "usaHorimetro";
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS usakm BOOLEAN DEFAULT true;
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS usahorimetro BOOLEAN DEFAULT false;

-- Tabela checklists
ALTER TABLE checklists DROP COLUMN IF EXISTS "usaKm";
ALTER TABLE checklists DROP COLUMN IF EXISTS "usaHorimetro";
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS usakm BOOLEAN DEFAULT true;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS usahorimetro BOOLEAN DEFAULT false;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS horimetro NUMERIC(12,2);

-- Tabela manutencoes
ALTER TABLE manutencoes DROP COLUMN IF EXISTS "kmAtual";
ALTER TABLE manutencoes DROP COLUMN IF EXISTS "usaKm";
ALTER TABLE manutencoes DROP COLUMN IF EXISTS "usaHorimetro";
ALTER TABLE manutencoes DROP COLUMN IF EXISTS "dataProximaRevisao";
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS kmatual NUMERIC(12,2);
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS horimetro NUMERIC(12,2);
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS usakm BOOLEAN DEFAULT true;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS usahorimetro BOOLEAN DEFAULT false;
ALTER TABLE manutencoes ADD COLUMN IF NOT EXISTS dataproximarevisao DATE;

-- Tabela chamados
ALTER TABLE chamados DROP COLUMN IF EXISTS "usaKm";
ALTER TABLE chamados DROP COLUMN IF EXISTS "usaHorimetro";
ALTER TABLE chamados ADD COLUMN IF NOT EXISTS usakm BOOLEAN DEFAULT true;
ALTER TABLE chamados ADD COLUMN IF NOT EXISTS usahorimetro BOOLEAN DEFAULT false;
ALTER TABLE chamados ADD COLUMN IF NOT EXISTS horimetro NUMERIC(12,2);

-- Tabela alocacoes
ALTER TABLE alocacoes DROP COLUMN IF EXISTS "usaKm";
ALTER TABLE alocacoes DROP COLUMN IF EXISTS "usaHorimetro";
ALTER TABLE alocacoes DROP COLUMN IF EXISTS "horimetroSaida";
ALTER TABLE alocacoes DROP COLUMN IF EXISTS "horimetroRetorno";
ALTER TABLE alocacoes DROP COLUMN IF EXISTS "horimetroRodado";
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS usakm BOOLEAN DEFAULT true;
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS usahorimetro BOOLEAN DEFAULT false;
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS horimetrosaida NUMERIC(12,2);
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS horimetroretorno NUMERIC(12,2);
ALTER TABLE alocacoes ADD COLUMN IF NOT EXISTS horimetrorodado NUMERIC(12,2);

-- Tabela gastos
ALTER TABLE gastos DROP COLUMN IF EXISTS "usaKm";
ALTER TABLE gastos DROP COLUMN IF EXISTS "usaHorimetro";
ALTER TABLE gastos DROP COLUMN IF EXISTS "pontoAbastecimento";
ALTER TABLE gastos DROP COLUMN IF EXISTS "tipoCombustivel";
ALTER TABLE gastos DROP COLUMN IF EXISTS "perfilLancamento";
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS km NUMERIC(12,2);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS horimetro NUMERIC(12,2);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS usakm BOOLEAN DEFAULT true;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS usahorimetro BOOLEAN DEFAULT false;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS pontoabastecimento TEXT;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS tipocombustivel TEXT;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS litros NUMERIC(12,3);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS perfillancamento TEXT;

-- Tabela adiantamentos
ALTER TABLE adiantamentos DROP COLUMN IF EXISTS "valorEstornado";
ALTER TABLE adiantamentos DROP COLUMN IF EXISTS "liberadoPor";
ALTER TABLE adiantamentos DROP COLUMN IF EXISTS "dataLiberacao";
ALTER TABLE adiantamentos DROP COLUMN IF EXISTS "dataFechamento";
ALTER TABLE adiantamentos DROP COLUMN IF EXISTS "fechadoPor";
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS origem TEXT;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS destino TEXT;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS fechado BOOLEAN DEFAULT false;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS valorestornado NUMERIC(12,2) DEFAULT 0;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS gastos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS estornos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS liberadopor TEXT;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS dataliberacao TIMESTAMP WITH TIME ZONE;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS datafechamento TIMESTAMP WITH TIME ZONE;
ALTER TABLE adiantamentos ADD COLUMN IF NOT EXISTS fechadopor TEXT;

-- ==================================================
-- ✅ Verificar se deu certo
-- ==================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;
