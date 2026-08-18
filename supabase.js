// ============================================================
// 🌐 CONEXÃO COM SUPABASE - CORRIGIDO
// ✅ Sintaxe de script normal (NÃO módulos ES6)
// ✅ Cria window.supabaseReal e window.supabase
// ============================================================
(function() {
    // ⚠️ SUAS CREDENCIAIS DO SUPABASE
    // Para encontrar: Supabase Dashboard → Project Settings → API
    const SUPABASE_URL = 'https://ccacecyqksenigmrvnap.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_aRQgU6fTTModcqdb4hSgHQ_bPKp2R3m';
    
    // Detecta se o SDK do Supabase foi carregado
    function tentarCriarCliente() {
        if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
            try {
                const cliente = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                
                // Cria as variáveis globais que o sistema espera
                window.supabaseReal = cliente;
                window.supabase = cliente;
                window.supabase.temConexaoReal = true;
                
                console.log('✅ Cliente Supabase criado com sucesso!');
                return true;
            } catch (e) {
                console.error('❌ Erro ao criar cliente Supabase:', e.message);
                window.supabaseReal = null;
                window.supabase = { temConexaoReal: false };
                return false;
            }
        }
        return false;
    }
    
    // Tenta criar imediatamente
    if (!tentarCriarCliente()) {
        let tentativas = 0;
        const intervalo = setInterval(() => {
            tentativas++;
            if (tentarCriarCliente() || tentativas > 20) {
                clearInterval(intervalo);
                if (tentativas > 20) {
                    console.warn('⚠️ SDK do Supabase não carregou. Funcionando em modo local.');
                    window.supabaseReal = null;
                    window.supabase = { temConexaoReal: false };
                }
            }
        }, 250);
    }
    
    window.addEventListener('load', () => {
        if (!window.supabaseReal) tentarCriarCliente();
    });
})();
