-- ==================================================
-- 🗄️ SUPABASE - CRIAÇÃO DAS TABELAS
-- Execute este SQL no Editor SQL do seu projeto Supabase
-- ==================================================

-- Habilita extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================================
-- 📍 LOCAIS / OBRAS
-- ==================================================
CREATE TABLE IF NOT EXISTS locais (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    nome TEXT NOT NULL UNIQUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dados iniciais de locais
INSERT INTO locais (id, nome) VALUES 
    ('patio-metalica', 'Pátio Metálica'),
    ('patio-usina-conc', 'Pátio Usina Conc.'),
    ('obra', 'Obra')
ON CONFLICT (nome) DO NOTHING;

-- ==================================================
-- 👤 USUÁRIOS
-- ==================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    usuario TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    perfil TEXT DEFAULT 'operacional',
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usuários padrão
INSERT INTO usuarios (nome, usuario, senha, perfil, ativo) VALUES 
    ('Administrador', 'admin', 'admin123', 'admin', true),
    ('Operador', 'operador', '1234', 'operador', true),
    ('João Silva', 'joao', '123456', 'operacional', true),
    ('Maria Oliveira', 'maria', '123456', 'operacional', true)
ON CONFLICT (usuario) DO NOTHING;

-- ==================================================
-- 🚗 VEÍCULOS
-- ==================================================
CREATE TABLE IF NOT EXISTS veiculos (
    id SERIAL PRIMARY KEY,
    placa TEXT NOT NULL UNIQUE,
    categoria TEXT,
    marca TEXT,
    modelo TEXT,
    ano INTEGER,
    km_atual BIGINT DEFAULT 0,
    km_inicial BIGINT DEFAULT 0,
    proxima_revisao_km BIGINT,
    seguro_vencimento DATE,
    status TEXT DEFAULT 'disponivel',
    obra_atual TEXT,
    responsavel TEXT,
    data_cadastro DATE DEFAULT CURRENT_DATE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dados de demonstração
INSERT INTO veiculos (placa, categoria, marca, modelo, ano, km_atual, km_inicial, proxima_revisao_km, seguro_vencimento, status, obra_atual, responsavel, data_cadastro) VALUES 
    ('ABC-1234', 'caminhao', 'Volvo', 'Volvo FH 540', 2022, 85000, 10000, 100000, '2026-08-20', 'disponivel', 'Pátio Metálica', 'João Silva', '2024-01-15'),
    ('DEF-5678', 'utilitario', 'Ford', 'Ford Ranger', 2023, 42000, 5000, 50000, '2026-12-15', 'disponivel', 'Obra', 'Pedro Santos', '2024-03-20'),
    ('GHI-9012', 'carro', 'Toyota', 'Toyota Hilux', 2021, 122000, 100000, 100000, '2026-08-20', 'manutencao', 'Pátio Usina Conc.', 'Maria Oliveira', '2023-06-10'),
    ('JKL-3456', 'maquina', 'CAT', 'Escavadeira CAT 320', 2020, 8500, 1000, 10000, '2027-03-10', 'alocado', 'Obra', 'Carlos Lima', '2023-02-28')
ON CONFLICT (placa) DO NOTHING;

-- ==================================================
-- ✅ CHECKLISTS
-- ==================================================
CREATE TABLE IF NOT EXISTS checklists (
    id SERIAL PRIMARY KEY,
    veiculoId INTEGER REFERENCES veiculos(id) ON DELETE CASCADE,
    placaVeiculo TEXT,
    motorista TEXT,
    data TIMESTAMP WITH TIME ZONE,
    km BIGINT,
    itens JSONB DEFAULT '{}',
    statusGeral TEXT DEFAULT 'Aprovado',
    observacoes TEXT,
    criadoPor TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 🔧 MANUTENÇÕES
-- ==================================================
CREATE TABLE IF NOT EXISTS manutencoes (
    id SERIAL PRIMARY KEY,
    veiculoId INTEGER REFERENCES veiculos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    servico TEXT,
    dataPrevista DATE,
    kmPrevisto BIGINT,
    intervaloKm BIGINT,
    intervaloDias INTEGER,
    custo DECIMAL(12,2) DEFAULT 0,
    status TEXT DEFAULT 'Pendente',
    criadoPor TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dados de demonstração
INSERT INTO manutencoes (veiculoId, tipo, servico, dataPrevista, kmPrevisto, custo, status, criadoPor) VALUES 
    (3, 'corretiva', 'Troca de pastilhas de freio', '2026-08-01', 120000, 1800.00, 'Concluída', 'Administrador'),
    (1, 'preventiva', 'Revisão geral', '2026-09-15', 100000, 3500.00, 'Pendente', 'Administrador')
ON CONFLICT DO NOTHING;

-- ==================================================
-- 💰 GASTOS
-- ==================================================
CREATE TABLE IF NOT EXISTS gastos (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    veiculoId INTEGER REFERENCES veiculos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    obra TEXT,
    valor DECIMAL(12,2) NOT NULL DEFAULT 0,
    observacao TEXT,
    lancadoPor TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dados de demonstração
INSERT INTO gastos (data, veiculoId, tipo, obra, valor, observacao, lancadoPor) VALUES 
    ('2026-03-15', 1, 'Combustível', 'Pátio Metálica', 2800.00, 'Abastecimento diesel', 'Administrador'),
    ('2026-03-22', 2, 'Manutenção', 'Obra', 1200.00, 'Troca de óleo e filtros', 'Administrador'),
    ('2026-04-10', 1, 'Combustível', 'Pátio Metálica', 3100.00, 'Abastecimento diesel', 'Administrador'),
    ('2026-04-18', 3, 'Pedágio', 'Obra', 350.00, 'Viagem para obra', 'Administrador'),
    ('2026-05-05', 1, 'Combustível', 'Pátio Metálica', 2950.00, 'Abastecimento', 'Administrador'),
    ('2026-05-20', 4, 'Manutenção', 'Obra', 4500.00, 'Revisão hidráulica', 'Administrador'),
    ('2026-06-08', 2, 'Combustível', 'Pátio Usina Conc.', 1800.00, 'Abastecimento', 'Administrador'),
    ('2026-06-25', 1, 'Seguro', 'Pátio Metálica', 8500.00, 'Seguro anual', 'Administrador'),
    ('2026-07-12', 3, 'Combustível', 'Obra', 2200.00, 'Abastecimento', 'Administrador'),
    ('2026-07-28', 2, 'Pneus', 'Pátio Usina Conc.', 3200.00, 'Jogo de pneus novo', 'Administrador'),
    ('2026-08-05', 1, 'Combustível', 'Pátio Metálica', 3050.00, 'Abastecimento', 'Administrador'),
    ('2026-08-10', 4, 'Combustível', 'Obra', 1634.00, 'Diesel', 'Administrador')
ON CONFLICT DO NOTHING;

-- ==================================================
-- 🚨 CHAMADOS
-- ==================================================
CREATE TABLE IF NOT EXISTS chamados (
    id SERIAL PRIMARY KEY,
    veiculoId INTEGER REFERENCES veiculos(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    obra TEXT,
    km BIGINT,
    descricao TEXT,
    status TEXT DEFAULT 'Aberto',
    responsavel TEXT,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dados de demonstração
INSERT INTO chamados (veiculoId, tipo, obra, km, descricao, status, responsavel, data) VALUES 
    (3, 'Problema Mecânico', 'Pátio Usina Conc.', 122000, 'Ruído estranho no freio dianteiro', 'Em Andamento', 'Maria Oliveira', '2026-08-10T10:30:00')
ON CONFLICT DO NOTHING;

-- ==================================================
-- 🚛 ALOCAÇÕES
-- ==================================================
CREATE TABLE IF NOT EXISTS alocacoes (
    id SERIAL PRIMARY KEY,
    veiculoId INTEGER REFERENCES veiculos(id) ON DELETE CASCADE,
    motorista TEXT,
    dataSaida DATE,
    kmSaida BIGINT,
    origem TEXT,
    destino TEXT,
    dataRetorno DATE,
    kmRetorno BIGINT,
    status TEXT DEFAULT 'Em Andamento',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 💰 DESPESAS DE VIAGEM - ADIANTAMENTOS
-- ==================================================
CREATE TABLE IF NOT EXISTS adiantamentos (
    id SERIAL PRIMARY KEY,
    valor DECIMAL(12,2) NOT NULL,
    motorista TEXT,
    veiculo TEXT,
    origem TEXT,
    destino TEXT,
    data DATE,
    observacoes TEXT,
    status TEXT DEFAULT 'liberado',
    totalGasto DECIMAL(12,2) DEFAULT 0,
    saldoRestante DECIMAL(12,2) DEFAULT 0,
    percentualUsado DECIMAL(5,2) DEFAULT 0,
    fechado BOOLEAN DEFAULT false,
    criadoPor TEXT,
    dataCriacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 🧾 DESPESAS DE VIAGEM - GASTOS
-- ==================================================
CREATE TABLE IF NOT EXISTS gastosViagem (
    id SERIAL PRIMARY KEY,
    adiantamentoId INTEGER REFERENCES adiantamentos(id) ON DELETE CASCADE,
    data DATE,
    tipo TEXT,
    valor DECIMAL(12,2) NOT NULL,
    observacoes TEXT,
    comprovantes JSONB DEFAULT '[]',
    criadoPor TEXT,
    dataCriacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- 🔓 RLS (Row Level Security) - POLÍTICAS DE ACESSO
-- ⚠️ IMPORTANTE: Desativa RLS para permitir acesso anônimo
-- Para produção, configure políticas adequadas
-- ==================================================

-- Desativa RLS para todas as tabelas (modo simples - ajuste para produção)
ALTER TABLE locais DISABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE manutencoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE gastos DISABLE ROW LEVEL SECURITY;
ALTER TABLE chamados DISABLE ROW LEVEL SECURITY;
ALTER TABLE alocacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE adiantamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE gastosViagem DISABLE ROW LEVEL SECURITY;

-- ==================================================
-- ✅ MENSAGEM FINAL
-- ==================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Todas as tabelas criadas com sucesso!';
    RAISE NOTICE '📍 Tabelas: locais, usuarios, veiculos, checklists, manutencoes, gastos, chamados, alocacoes, adiantamentos, gastosViagem';
    RAISE NOTICE '🔑 RLS desabilitado para desenvolvimento - configure para produção';
END $$;
