-- ==================================================
-- 🧹 LIMPAR DADOS DE DEMONSTRAÇÃO DO SUPABASE
-- Execute este SQL APENAS se quiser apagar TODOS os dados
-- e começar do zero. CUIDADO: ISSO APAGA TUDO!
-- ==================================================

-- Apaga todos os registros (reseta os IDs também)
TRUNCATE TABLE documentosVeiculos RESTART IDENTITY CASCADE;
TRUNCATE TABLE pontosAbastecimento RESTART IDENTITY CASCADE;
TRUNCATE TABLE gastos RESTART IDENTITY CASCADE;
TRUNCATE TABLE manutencoes RESTART IDENTITY CASCADE;
TRUNCATE TABLE checklists RESTART IDENTITY CASCADE;
TRUNCATE TABLE chamados RESTART IDENTITY CASCADE;
TRUNCATE TABLE alocacoes RESTART IDENTITY CASCADE;
TRUNCATE TABLE adiantamentos RESTART IDENTITY CASCADE;
TRUNCATE TABLE solicitacoesTransferencia RESTART IDENTITY CASCADE;
TRUNCATE TABLE historico_condutores RESTART IDENTITY CASCADE;

-- Apaga veículos (exceto se quiser mantê-los)
-- TRUNCATE TABLE veiculos RESTART IDENTITY CASCADE;

-- Apaga usuários exceto admin (se quiser manter o login)
-- DELETE FROM usuarios WHERE usuario != 'admin';
-- ALTER SEQUENCE usuarios_id_seq RESTART WITH 2;

-- ==================================================
-- Após executar este SQL:
-- 1. Abra o sistema no navegador
-- 2. Abra o Console (F12)
-- 3. Digite: limparCacheESincronizar()
-- 4. Pressione Enter
-- ==================================================
SELECT 'Banco limpo! Agora execute limparCacheESincronizar() no console do navegador.' AS instrucao;
