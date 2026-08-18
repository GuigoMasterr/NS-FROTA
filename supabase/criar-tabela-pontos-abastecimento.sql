-- ==================================================
-- ⛽ CRIAR TABELA DE PONTOS DE ABASTECIMENTO
-- Execute este SQL no Editor SQL do seu projeto Supabase
-- ==================================================

CREATE TABLE IF NOT EXISTS pontosAbastecimento (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    endereco TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dados iniciais (opcional)
INSERT INTO pontosAbastecimento (nome, endereco) VALUES 
    ('Posto Shell - Centro', 'Av. Principal, 100'),
    ('Posto Ipiranga - Rodovia', 'BR-101, Km 50'),
    ('Posto Petrobras - Obra', 'Acesso Obra, S/N')
ON CONFLICT DO NOTHING;

-- Desativa RLS para permitir acesso
ALTER TABLE pontosAbastecimento DISABLE ROW LEVEL SECURITY;

-- ==================================================
-- ✅ MENSAGEM DE CONFIRMAÇÃO
-- ==================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Tabela pontosAbastecimento criada com sucesso!';
    RAISE NOTICE '⛽ Agora os pontos de abastecimento serão salvos permanentemente no Supabase';
END $$;
