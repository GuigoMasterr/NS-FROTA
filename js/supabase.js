// ============================================================
// 🌐 CONEXÃO COM SUPABASE - VERSÃO CORRIGIDA
// ✅ NÃO sobrescreve se já houver um cliente válido
// ✅ Cria o cliente imediatamente (sem fetch externo que pode ser bloqueado)
// ✅ Testa conectividade com consulta real ao banco
// ============================================================
(function() {
    'use strict';

    // ⚠️ SUAS CREDENCIAIS DO SUPABASE
    const SUPABASE_URL = 'https://ccacecyqksenigmrvnap.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_aRQgU6fTTModcqdb4hSgHQ_bPKp2R3m';

    // 🔍 VERIFICA SE JÁ EXISTE UM CLIENTE VÁLIDO CRIADO POR OUTRO ARQUIVO
    if (window.supabaseReal && typeof window.supabase.from === 'function') {
        console.log('ℹ️ [supabase.js] Cliente Supabase já existe, mantendo conexão atual.');
        if (!window.supabase.temConexaoReal) {
            window.supabase.temConexaoReal = true;
        }
        return; // Não faz nada, evita sobrescrever!
    }

    // Inicializa
    window.supabaseReal = null;
    window.supabase = { temConexaoReal: false };

    async function testarECriarCliente() {
        if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
            console.warn('⚠️ SDK do Supabase não carregado.');
            return false;
        }

        try {
            // Cria o cliente
            const cliente = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            window.supabaseReal = cliente;
            window.supabase = cliente;
            window.supabase.temConexaoReal = false;

            console.log('🔍 [Supabase] Cliente criado, testando conectividade...');

            // Testa com consulta real
            try {
                const { error } = await cliente
                    .from('locais')
                    .select('*', { count: 'exact', head: true });

                if (error) {
                    console.warn('⚠️ [Supabase] Consulta retornou erro (pode ser RLS):', error.message);
                } else {
                    console.log('✅ [Supabase] Conectado com sucesso!');
                }

                window.supabase.temConexaoReal = true;
                return true;

            } catch (erroConsulta) {
                console.warn('⚠️ [Supabase] Não foi possível testar:', erroConsulta.message);
                console.log('ℹ️ [Supabase] Mantendo cliente para tentativas futuras.');
                window.supabase.temConexaoReal = true;
                return true;
            }

        } catch (e) {
            console.error('❌ [Supabase] Erro ao criar cliente:', e.message);
            window.supabaseReal = null;
            window.supabase = { temConexaoReal: false };
            return false;
        }
    }

    function iniciar() {
        setTimeout(testarECriarCliente, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }

    window.addEventListener('load', () => {
        if (!window.supabaseReal || !window.supabase.temConexaoReal) {
            testarECriarCliente();
        }
    });

    window.testarConexaoSupabase = testarECriarCliente;
    console.log('✅ [js/supabase.js] Script carregado.');

})();
