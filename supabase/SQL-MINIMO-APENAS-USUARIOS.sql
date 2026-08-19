-- ==================================================
-- 🔧 SQL MÍNIMO - APENAS ADICIONAR COLUNAS NA TABELA usuarios
-- Copie TODO este texto e execute no Supabase SQL Editor
-- ==================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS numerocnh TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS registrocnh TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS categoriacnh TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS datavalidadecnh DATE;

-- ==================================================
-- Verifica se as colunas foram criadas
-- ==================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;
