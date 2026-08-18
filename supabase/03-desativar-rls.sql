-- ==================================================
-- PASSO 3: DESATIVAR RLS (Row Level Security)
-- Execute este arquivo POR ÚLTIMO
-- Isso permite que o sistema sincronize os dados automaticamente
-- ==================================================

ALTER TABLE IF EXISTS usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS veiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS manutencoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chamados DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS alocacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gastos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS adiantamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS locais DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documentosVeiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pontosAbastecimento DISABLE ROW LEVEL SECURITY;
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
    RAISE NOTICE '✅ TODOS OS PASSOS CONCLUÍDOS!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Banco de dados atualizado com sucesso.';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Substitua os arquivos JS atualizados';
    RAISE NOTICE '2. Abra o sistema no navegador';
    RAISE NOTICE '3. Pressione Ctrl+F5 para limpar o cache';
    RAISE NOTICE '4. Os dados serão sincronizados automaticamente';
    RAISE NOTICE '==================================================';
END $$;
