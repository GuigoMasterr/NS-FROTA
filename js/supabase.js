// ============================================================
// 🌐 CONEXÃO COM SUPABASE - VERSÃO ROBUSTA
// ✅ Testa conectividade REAL antes de marcar como conectado
// ✅ Se URL for inválida → cai automaticamente no modo local
// ============================================================
(function() {
    // ⚠️ SUAS CREDENCIAIS DO SUPABASE
    // Verifique se a URL está correta! Se houver erro de digitação,
    // o sistema funcionará automaticamente em MODO LOCAL.
    const SUPABASE_URL = 'https://ccacecyqksenigmrvnap.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_aRQgU6fTTModcqdb4hSgHQ_bPKp2R3m';
    
    // Inicializa em modo desconhecido
    window.supabaseReal = null;
    window.supabase = { temConexaoReal: false };
    
    async function testarECriarCliente() {
        if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
            console.warn('⚠️ SDK do Supabase não carregado. Modo local ativado.');
            return false;
        }
        
        try {
            // Cria o cliente
            const cliente = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            // 🔍 TESTE REAL DE CONECTIVIDADE
            // Tenta uma requisição simples para verificar se a URL existe
            console.log('🔍 Testando conectividade com Supabase...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            try {
                // Tenta acessar a URL base para verificar DNS
                const resposta = await fetch(SUPABASE_URL, {
                    method: 'HEAD',
                    signal: controller.signal,
                    mode: 'no-cors'
                });
                clearTimeout(timeoutId);
                
                // Se chegou aqui, o DNS resolveu. Marca como conectado.
                window.supabaseReal = cliente;
                window.supabase = cliente;
                window.supabase.temConexaoReal = true;
                console.log('✅ Supabase conectado com sucesso!');
                return true;
                
            } catch (erroRede) {
                clearTimeout(timeoutId);
                
                if (erroRede.name === 'AbortError') {
                    console.warn('⚠️ Timeout na conexão com Supabase.');
                } else {
                    console.warn('⚠️ Supabase inacessível:', erroRede.message);
                }
                
                console.log('🔄 Ativando MODO LOCAL (dados serão salvos apenas no navegador)');
                window.supabaseReal = null;
                window.supabase = { temConexaoReal: false };
                return false;
            }
            
        } catch (e) {
            console.error('❌ Erro ao criar cliente Supabase:', e.message);
            window.supabaseReal = null;
            window.supabase = { temConexaoReal: false };
            return false;
        }
    }
    
    // Inicia o teste quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', testarECriarCliente);
    } else {
        testarECriarCliente();
    }
    
    // Também tenta no window.load como fallback
    window.addEventListener('load', () => {
        if (!window.supabaseReal) testarECriarCliente();
    });
    
    // Expõe a função para teste manual
    window.testarConexaoSupabase = testarECriarCliente;
    
})();
