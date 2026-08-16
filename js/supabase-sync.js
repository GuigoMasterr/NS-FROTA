// ==================================================
// 🌐 SUPABASE SYNC - Sincronizacao Bidirecional
// ✅ Salva na nuvem e local, carrega da nuvem ao iniciar
// ==================================================

const SUPABASE_SYNC_CONFIG = {
    tabelas: [
        { local: 'veiculos', nuvem: 'veiculos', chave: 'id' },
        { local: 'manutencoes', nuvem: 'manutencoes', chave: 'id' },
        { local: 'gastos', nuvem: 'gastos', chave: 'id' },
        { local: 'chamados', nuvem: 'chamados', chave: 'id' },
        { local: 'checklists', nuvem: 'checklists', chave: 'id' },
        { local: 'alocacoes', nuvem: 'alocacoes', chave: 'id' },
        { local: 'usuarios', nuvem: 'usuarios', chave: 'id' },
        { local: 'historicoCondutores', nuvem: 'historico_condutores', chave: 'id' },
        { local: 'solicitacoesTransferencia', nuvem: 'solicitacoes_transferencia', chave: 'id' },
        { local: 'adiantamentos', nuvem: 'adiantamentos', chave: 'id' },
        { local: 'despesasViagem', nuvem: 'despesas_viagem', chave: 'id' },
        { local: 'locais', nuvem: 'locais', chave: 'id' }
    ]
};

var _ultimaSincronizacao = null;
var _supabaseConectado = false;

// ==================================================
// 🚀 FUNCAO PRINCIPAL: Carregar dados do Supabase
// ==================================================
async function sincronizarBD() {
    try {
        console.log('🌐 ====== SINCRONIZANDO COM SUPABASE ======');
        
        if (!window.supabaseReal) {
            console.warn('⚠️ Supabase nao disponivel, mantendo dados locais');
            return false;
        }
        
        var cliente = window.supabaseReal;
        
        // Testa conexao
        var teste = await cliente.from('locais').select('id', { count: 'exact', head: true });
        if (teste.error) {
            console.warn('⚠️ Supabase inacessivel:', teste.error.message);
            _supabaseConectado = false;
            return false;
        }
        
        _supabaseConectado = true;
        console.log('✅ Conexao com Supabase confirmada');
        
        // Carrega cada tabela
        for (var t = 0; t < SUPABASE_SYNC_CONFIG.tabelas.length; t++) {
            var cfg = SUPABASE_SYNC_CONFIG.tabelas[t];
            
            try {
                var resultado = await cliente.from(cfg.nuvem).select('*');
                
                if (resultado.error) {
                    console.warn('   ⚠️ Erro em [' + cfg.nuvem + ']:', resultado.error.message);
                    continue;
                }
                
                if (resultado.data && resultado.data.length > 0) {
                    window.BD[cfg.local] = resultado.data;
                    console.log('   ✅ [' + cfg.nuvem + '] ' + resultado.data.length + ' registros carregados');
                } else {
                    console.log('   ℹ️ [' + cfg.nuvem + '] vazia na nuvem');
                    
                    // Se tem dados locais, envia para a nuvem
                    if (window.BD[cfg.local] && window.BD[cfg.local].length > 0) {
                        console.log('      → Enviando dados locais para nuvem...');
                        await enviarTabelaParaNuvem(cfg.local, cfg.nuvem, cfg.chave);
                    }
                }
                
            } catch (erroTabela) {
                console.warn('   ⚠️ Falha em [' + cfg.nuvem + ']:', erroTabela.message);
            }
        }
        
        // Carrega dados gerais
        try {
            var dadosGerais = await cliente.from('dados_gerais').select('*');
            if (dadosGerais.data && dadosGerais.data.length > 0) {
                for (var d = 0; d < dadosGerais.data.length; d++) {
                    var item = dadosGerais.data[d];
                    if (item.chave === 'origens') window.BD.origens = item.valor;
                    else if (item.chave === 'destinos') window.BD.destinos = item.valor;
                    else if (item.chave === 'obras') window.BD.obras = item.valor;
                    else if (item.chave === 'config') window.BD.config = item.valor;
                }
            }
        } catch (e) {
            console.warn('   ⚠️ dados_gerais:', e.message);
        }
        
        _ultimaSincronizacao = new Date();
        
        // Salva os dados carregados no localStorage como backup
        if (typeof _salvarLocalOriginal === 'function') {
            _salvarLocalOriginal();
        } else {
            localStorage.setItem('bd_frotas', JSON.stringify(window.BD));
        }
        
        console.log('🌐 ====== SINCRONIZACAO CONCLUIDA ======');
        return true;
        
    } catch (e) {
        console.error('❌ Erro na sincronizacao:', e);
        _supabaseConectado = false;
        return false;
    }
}

// ==================================================
// 📤 Enviar uma tabela local para a nuvem
// ==================================================
async function enviarTabelaParaNuvem(arrayLocal, tabelaNuvem, chave) {
    try {
        if (!window.supabaseReal || !window.BD[arrayLocal]) return;
        
        var dados = window.BD[arrayLocal];
        if (!dados || dados.length === 0) return;
        
        // Prepara os dados (remove campos que nao existem na tabela)
        var dadosParaEnviar = JSON.parse(JSON.stringify(dados));
        
        var resultado = await window.supabaseReal
            .from(tabelaNuvem)
            .upsert(dadosParaEnviar, { onConflict: chave, ignoreDuplicates: false });
        
        if (resultado.error) {
            console.warn('      ⚠️ Erro ao enviar [' + tabelaNuvem + ']:', resultado.error.message);
            return false;
        }
        
        console.log('      ✅ [' + tabelaNuvem + '] enviado com sucesso');
        return true;
        
    } catch (e) {
        console.warn('      ⚠️ Falha ao enviar [' + tabelaNuvem + ']:', e.message);
        return false;
    }
}

// ==================================================
// 💾 Substitui salvarDados para salvar na nuvem TAMBEM
// ==================================================
var _salvarLocalOriginal = null;

function inicializarSincronizacao() {
    try {
        // Faz backup da funcao original de salvar
        if (typeof window.salvarDados === 'function' && !_salvarLocalOriginal) {
            _salvarLocalOriginal = window.salvarDados;
        }
        
        // Substitui a funcao salvarDados global
        window.salvarDados = async function() {
            try {
                // Primeiro salva localmente (sempre)
                if (_salvarLocalOriginal) {
                    _salvarLocalOriginal();
                } else {
                    localStorage.setItem('bd_frotas', JSON.stringify(window.BD));
                }
                
                // Depois tenta salvar na nuvem (se conectado)
                if (_supabaseConectado && window.supabaseReal) {
                    // Faz um upsert da tabela que foi alterada
                    // Para simplicidade, enviamos as tabelas principais
                    var tabelasParaEnviar = [
                        { local: 'veiculos', nuvem: 'veiculos', chave: 'id' },
                        { local: 'solicitacoesTransferencia', nuvem: 'solicitacoes_transferencia', chave: 'id' },
                        { local: 'historicoCondutores', nuvem: 'historico_condutores', chave: 'id' },
                        { local: 'checklists', nuvem: 'checklists', chave: 'id' },
                        { local: 'usuarios', nuvem: 'usuarios', chave: 'id' },
                        { local: 'alocacoes', nuvem: 'alocacoes', chave: 'id' },
                        { local: 'manutencoes', nuvem: 'manutencoes', chave: 'id' },
                        { local: 'gastos', nuvem: 'gastos', chave: 'id' },
                        { local: 'chamados', nuvem: 'chamados', chave: 'id' },
                        { local: 'adiantamentos', nuvem: 'adiantamentos', chave: 'id' },
                        { local: 'despesasViagem', nuvem: 'despesas_viagem', chave: 'id' }
                    ];
                    
                    // Envia em background, nao bloqueia
                    for (var i = 0; i < tabelasParaEnviar.length; i++) {
                        var cfg = tabelasParaEnviar[i];
                        if (window.BD[cfg.local] && window.BD[cfg.local].length > 0) {
                            try {
                                var dados = JSON.parse(JSON.stringify(window.BD[cfg.local]));
                                window.supabaseReal.from(cfg.nuvem).upsert(dados, { onConflict: cfg.chave });
                            } catch (e) { /* ignora erros de envio em background */ }
                        }
                    }
                }
                
            } catch (e) {
                console.error('❌ Erro ao salvar dados:', e);
            }
        };
        
        console.log('✅ Sistema de sincronizacao inicializado');
        
    } catch (e) {
        console.error('❌ Erro ao inicializar sincronizacao:', e);
    }
}

// ==================================================
// 📤 Funcao para enviar TODOS os dados locais para a nuvem
// ==================================================
async function enviarTodosDadosParaNuvem() {
    try {
        if (!window.supabaseReal) {
            alert('Supabase nao conectado!');
            return false;
        }
        
        console.log('📤 Enviando todos os dados para nuvem...');
        
        var sucesso = true;
        for (var t = 0; t < SUPABASE_SYNC_CONFIG.tabelas.length; t++) {
            var cfg = SUPABASE_SYNC_CONFIG.tabelas[t];
            if (window.BD[cfg.local] && window.BD[cfg.local].length > 0) {
                var ok = await enviarTabelaParaNuvem(cfg.local, cfg.nuvem, cfg.chave);
                if (!ok) sucesso = false;
            }
        }
        
        // Atualiza dados gerais
        try {
            var dadosGerais = [
                { chave: 'origens', valor: window.BD.origens || [] },
                { chave: 'destinos', valor: window.BD.destinos || [] },
                { chave: 'obras', valor: window.BD.obras || [] },
                { chave: 'config', valor: window.BD.config || {} }
            ];
            await window.supabaseReal.from('dados_gerais').upsert(dadosGerais, { onConflict: 'chave' });
        } catch (e) { console.warn('dados_gerais:', e.message); }
        
        if (sucesso) {
            alert('✅ Todos os dados enviados para a nuvem!');
        } else {
            alert('⚠️ Alguns dados nao puderam ser enviados. Verifique o console.');
        }
        
        return sucesso;
        
    } catch (e) {
        console.error(e);
        alert('❌ Erro ao enviar dados');
        return false;
    }
}

// ==================================================
// 📥 Funcao para FORCAR carregamento da nuvem
// ==================================================
async function carregarDadosDaNuvem() {
    try {
        if (!confirm('Isso substituira os dados locais pelos dados da nuvem. Continuar?')) {
            return false;
        }
        
        var ok = await sincronizarBD();
        
        if (ok) {
            alert('✅ Dados carregados da nuvem com sucesso!');
            
            // Atualiza todas as telas
            if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
            if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
            if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
            if (typeof carregarTabelaSolicitacoes === 'function') carregarTabelaSolicitacoes();
            if (typeof inicializarTransferencias === 'function') inicializarTransferencias();
            
            location.reload();
        } else {
            alert('⚠️ Nao foi possivel conectar ao Supabase.');
        }
        
        return ok;
        
    } catch (e) {
        console.error(e);
        return false;
    }
}

// ==================================================
// 🚀 EXPORTA FUNCOES GLOBALMENTE
// ==================================================
window.sincronizarBD = sincronizarBD;
window.enviarTodosDadosParaNuvem = enviarTodosDadosParaNuvem;
window.carregarDadosDaNuvem = carregarDadosDaNuvem;
window.inicializarSincronizacao = inicializarSincronizacao;
window._supabaseConectado = function() { return _supabaseConectado; };

// ==================================================
// ⚡ AUTO-INICIALIZACAO
// ==================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarSincronizacao);
} else {
    inicializarSincronizacao();
}

console.log('✅ js/supabase-sync.js carregado');
