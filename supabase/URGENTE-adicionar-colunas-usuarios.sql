-- ==================================================
-- ADICIONAR COLUNAS NA TABELA usuarios
-- Execute este SQL URGENTEMENTE
-- ==================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numeroCNH TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS registroCNH TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS categoriaCNH TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS dataValidadeCNH DATE;

-- ==================================================
-- Verifica se as colunas foram criadas
-- ==================================================
DO $$
DECLARE
    qtd_colunas INTEGER;
BEGIN
    SELECT COUNT(*) INTO qtd_colunas
    FROM information_schema.columns 
    WHERE table_name = 'usuarios' 
    AND column_name IN ('cpf', 'telefone', 'numerocnh', 'registrocnh', 'categoriacnh', 'datavalidadecnh');
    
    RAISE NOTICE '==================================================';
    IF qtd_colunas >= 6 THEN
        RAISE NOTICE '✅ TODAS AS COLUNAS CRIADAS COM SUCESSO!';
        RAISE NOTICE 'Colunas encontradas na tabela usuarios: %', qtd_colunas;
    ELSE
        RAISE NOTICE '⚠️ ALGUMAS COLUNAS NÃO FORAM CRIADAS';
        RAISE NOTICE 'Colunas encontradas: % de 6', qtd_colunas;
    END IF;
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Agora atualize o sistema e faça Ctrl+F5!';
    RAISE NOTICE '==================================================';
END $$;
