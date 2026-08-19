-- ==================================================
-- PASSO 1: CRIAR TABELAS NOVAS
-- Copie TODO este arquivo e execute no Supabase
-- ==================================================

-- ==================================================
-- Cria tabela: pontosAbastecimento
-- ==================================================
CREATE TABLE IF NOT EXISTS pontosAbastecimento (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    endereco TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================
-- Insere dados iniciais
-- ==================================================
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
-- Cria tabela: documentosVeiculos
-- ==================================================
CREATE TABLE IF NOT EXISTS documentosVeiculos (
    id BIGSERIAL PRIMARY KEY,
    veiculoId INTEGER,
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
-- Verifica se deu certo
-- ==================================================
SELECT 'Tabelas criadas com sucesso!' AS resultado;
SELECT COUNT(*) AS total_pontos_abastecimento FROM pontosAbastecimento;
