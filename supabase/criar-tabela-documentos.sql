-- ==================================================
-- 📄 CRIAR TABELA DE DOCUMENTOS DE VEÍCULOS
-- Execute este SQL no Editor SQL do seu projeto Supabase
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

-- Desativa RLS para permitir acesso (ajuste para produção se necessário)
ALTER TABLE documentosVeiculos DISABLE ROW LEVEL SECURITY;

-- ==================================================
-- ✅ MENSAGEM DE CONFIRMAÇÃO
-- ==================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Tabela documentosVeiculos criada com sucesso!';
    RAISE NOTICE '📁 Agora você pode anexar arquivos nos documentos dos veículos';
END $$;
