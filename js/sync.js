// ============================================================
// 🔄 sync.js - Sistema de Sincronização Supabase ↔ localStorage
// ============================================================
// Funcionalidades:
// ✅ Buscar dados do Supabase
// ✅ Enviar dados para o Supabase
// ✅ Backup automático no localStorage
// ✅ Atualiza window.BD (usado pelo dashboard)
// ✅ Modo offline (usa dados locais se Supabase cair)
// ✅ Fila de pendentes para sincronizar depois
// ============================================================
// ATENÇÃO: Este arquivo NÃO usa módulos ES (import/export)
// pois é carregado como <script src="js/sync.js"> no HTML
// ============================================================

(function() {
    'use strict';

    const CONFIG = window.CONFIG || {};
    const TABELAS = CONFIG.TABELAS || [
        'locais', 'usuarios', 'veiculos', 'checklists', 'manutencoes',
        'gastos', 'chamados', 'alocacoes', 'adiantamentos', 'gastosViagem',
        'documentosVeiculos'
    ];

    // Armazena os dados na memória para acesso rápido
    window.dadosSistema = window.dadosSistema || {};

    // ============================================================
    // 🔍 VERIFICA SE O SUPABASE ESTÁ REALMENTE PRONTO
    // ============================================================
    function supabasePronto() {
        const sb = window.supabase;
        return sb && typeof sb.from === 'function' && sb.temConexaoReal === true;
    }

    // Espera o Supabase ficar pronto, com timeout
    function esperarSupabasePronto(timeoutMs) {
        return new Promise((resolve) => {
            const inicio = Date.now();
            const verificar = () => {
                if (supabasePronto()) {
                    resolve(true);
                } else if (Date.now() - inicio > timeoutMs) {
                    console.warn('⚠️ [sync.js] Timeout esperando Supabase conectar');
                    resolve(false);
                } else {
                    setTimeout(verificar, 200);
                }
            };
            verificar();
        });
    }

    // ============================================================
    // 📊 Atualiza dashboard usando apenas dados locais existentes
    // ============================================================
    function atualizarDashboardComDadosLocais() {
        if (window.BD) {
            window.dadosSistema = converterBDParaFormatoAntigo(window.BD);
            try {
                document.dispatchEvent(new CustomEvent('dadosCarregados', {
                    detail: window.dadosSistema
                }));
            } catch (e) {}
            
            if (typeof window.atualizarDashboardCompleto === 'function') {
                try {
                    window.atualizarDashboardCompleto();
                } catch (e) {
                    console.error('❌ Erro ao atualizar dashboard:', e.message);
                }
            }
        }
    }

    // ============================================================
    // 📥 FUNÇÃO PRINCIPAL: Buscar todos os dados do Supabase
    // ============================================================
    async function buscarDadosSupabase() {
        console.log("\n🔄 [sync.js] Buscando dados do Supabase...");

        // Primeiro verifica se o Supabase está realmente pronto
        if (!supabasePronto()) {
            console.warn("⚠️ [sync.js] Supabase não conectado. Usando dados locais.");
            atualizarDashboardComDadosLocais();
            return { sucesso: false, dados: window.dadosSistema, usandoBackup: true };
        }

        const supabase = window.supabase;
        const todosDados = {};
        let teveErro = false;

        for (const tabela of TABELAS) {
            try {
                const { data, error } = await supabase
                    .from(tabela)
                    .select('*')
                    .order('id', { ascending: true });

                if (error) throw error;

                todosDados[tabela] = data || [];
                console.log(`✅ ${tabela}: ${data.length} registros baixados`);

                // 💾 Faz backup automático no localStorage
                salvarBackupLocal(tabela, data);

            } catch (erro) {
                teveErro = true;
                console.error(`❌ Erro ao buscar ${tabela}:`, erro.message);

                // 🚨 Se falhar, usa os dados do backup local
                const dadosLocais = carregarBackupLocal(tabela);
                todosDados[tabela] = dadosLocais;

                if (dadosLocais.length > 0) {
                    console.log(`⚠️ Usando backup local para ${tabela}: ${dadosLocais.length} registros`);
                } else {
                    console.log(`ℹ️ Sem dados locais para ${tabela}`);
                }
            }
        }

        // Atualiza a memória global
        window.dadosSistema = todosDados;

        // 🔄 ATUALIZA window.BD (usado pelo dashboard e todo o sistema!)
        atualizarWindowBD(todosDados);

        // 💾 Salva no localStorage a estrutura completa do BD
        salvarBDCompleto();

        // 📢 Dispara evento para notificar o dashboard
        try {
            document.dispatchEvent(new CustomEvent('bdAtualizado', {
                detail: todosDados
            }));
        } catch (e) {
            console.warn('⚠️ Erro ao disparar evento bdAtualizado:', e.message);
        }

        // Dispara evento para componentes antigos
        try {
            document.dispatchEvent(new CustomEvent('dadosCarregados', {
                detail: todosDados
            }));
        } catch (e) {
            console.warn('⚠️ Erro ao disparar evento dadosCarregados:', e.message);
        }

        // 📊 Atualiza o dashboard com os novos dados
        if (typeof window.atualizarDashboardCompleto === 'function') {
            try {
                window.atualizarDashboardCompleto();
            } catch (e) {
                console.error('❌ Erro ao atualizar dashboard:', e.message);
            }
        }

        console.log("\n📊 [sync.js] Resumo dos dados:", resumoDados(todosDados));

        return {
            sucesso: !teveErro,
            dados: todosDados,
            usandoBackup: teveErro
        };
    }

    // ============================================================
    // 🔄 Converte window.BD para o formato antigo (compatibilidade)
    // ============================================================
    function converterBDParaFormatoAntigo(bd) {
        return {
            locais: bd.locais || [],
            usuarios: bd.usuarios || [],
            veiculos: bd.veiculos || [],
            checklists: bd.checklists || [],
            manutencoes: bd.manutencoes || [],
            gastos: bd.gastos || [],
            chamados: bd.chamados || [],
            alocacoes: bd.alocacoes || [],
            adiantamentos: bd.adiantamentos || [],
            gastosViagem: bd.gastosViagem || [],
            documentosVeiculos: bd.documentosVeiculos || [],
            pontosAbastecimento: bd.pontosAbastecimento || []
        };
    }

    // ============================================================
    // 🔄 Atualiza window.BD com dados do Supabase
    // ============================================================
    function atualizarWindowBD(dados) {
        if (!window.BD) {
            window.BD = {};
        }

        // Atualiza cada tabela (só substitui se veio dados do Supabase)
        if (dados.locais) window.BD.locais = dados.locais;
        if (dados.usuarios) window.BD.usuarios = dados.usuarios;
        if (dados.veiculos) window.BD.veiculos = dados.veiculos;
        if (dados.checklists) window.BD.checklists = dados.checklists;
        if (dados.manutencoes) window.BD.manutencoes = dados.manutencoes;
        if (dados.gastos) window.BD.gastos = dados.gastos;
        if (dados.chamados) window.BD.chamados = dados.chamados;
        if (dados.alocacoes) window.BD.alocacoes = dados.alocacoes;
        if (dados.adiantamentos) window.BD.adiantamentos = dados.adiantamentos;
        if (dados.gastosViagem) window.BD.gastosViagem = dados.gastosViagem;
        if (dados.documentosVeiculos && dados.documentosVeiculos.length > 0) window.BD.documentosVeiculos = dados.documentosVeiculos;
        if (dados.pontosAbastecimento && dados.pontosAbastecimento.length > 0) window.BD.pontosAbastecimento = dados.pontosAbastecimento;

        // Mantém campos que não vêm do Supabase
        if (!window.BD.origens) window.BD.origens = ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'];
        if (!window.BD.destinos) window.BD.destinos = ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'];
        if (!window.BD.obras) window.BD.obras = ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'];
        if (!window.BD.config) window.BD.config = {};
        if (!window.BD.log) window.BD.log = [];
        if (!window.BD.despesasViagem) window.BD.despesasViagem = [];
        if (!window.BD.historicoCondutores) window.BD.historicoCondutores = [];
        if (!window.BD.solicitacoesTransferencia) window.BD.solicitacoesTransferencia = [];

        console.log(`✅ [sync.js] window.BD atualizado: ${window.BD.veiculos ? window.BD.veiculos.length : 0} veículos`);
    }

    // ============================================================
    // 💾 Salva BD completo no localStorage
    // ============================================================
    function salvarBDCompleto() {
        try {
            if (window.BD) {
                localStorage.setItem('bd_frotas', JSON.stringify(window.BD));
            }
        } catch (e) {
            console.warn('⚠️ Não foi possível salvar BD completo:', e.message);
        }
    }

    // ============================================================
    // 📤 FUNÇÃO: Inserir ou Atualizar dados no Supabase
    // ============================================================
    async function salvarNoSupabase(tabela, dados) {
        console.log(`📤 [sync.js] Salvando em ${tabela}:`, dados);

        if (!supabasePronto()) {
            console.warn('⚠️ [sync.js] Sem conexão. Salvando apenas localmente.');
            adicionarPendente(tabela, dados);
            return { sucesso: false, erro: 'Sem conexão', salvoLocalmente: true };
        }

        const supabase = window.supabase;

        try {
            let resultado;

            if (dados.id && dados.id !== null) {
                // 🔄 Atualiza registro existente
                const { data: dataResult, error } = await supabase
                    .from(tabela)
                    .update(dados)
                    .eq('id', dados.id)
                    .select();

                if (error) throw error;
                resultado = dataResult[0];
                console.log(`✅ ${tabela} #${dados.id} atualizado no Supabase`);
            } else {
                // ➕ Insere novo registro
                const { data: dataResult, error } = await supabase
                    .from(tabela)
                    .insert([dados])
                    .select();

                if (error) throw error;
                resultado = dataResult[0];
                console.log(`✅ ${tabela} inserido no Supabase, ID: ${resultado?.id}`);
            }

            // 🔄 Atualiza os dados locais e dashboard
            await buscarDadosSupabase();

            return { sucesso: true, dados: resultado };
        } catch (erro) {
            console.error(`❌ Erro ao salvar em ${tabela}:`, erro.message);

            // 🚨 Salva na fila de pendentes para sincronizar depois
            adicionarPendente(tabela, dados);

            return {
                sucesso: false,
                erro: erro.message,
                salvoLocalmente: true
            };
        }
    }

    // ============================================================
    // 🗑️ FUNÇÃO: Excluir registro do Supabase
    // ============================================================
    async function excluirDoSupabase(tabela, id) {
        console.log(`🗑️ [sync.js] Excluindo ${tabela} #${id}`);

        if (!supabasePronto()) {
            console.warn('⚠️ [sync.js] Sem conexão. Não é possível excluir.');
            return { sucesso: false, erro: 'Sem conexão' };
        }

        const supabase = window.supabase;

        try {
            const { error } = await supabase
                .from(tabela)
                .delete()
                .eq('id', id);

            if (error) throw error;

            console.log(`✅ ${tabela} #${id} excluído do Supabase`);

            // 🔄 Atualiza dados locais
            await buscarDadosSupabase();

            return { sucesso: true };
        } catch (erro) {
            console.error(`❌ Erro ao excluir:`, erro.message);
            return { sucesso: false, erro: erro.message };
        }
    }

    // ============================================================
    // 💾 FUNÇÕES: Gerenciamento do Backup Local (localStorage)
    // ============================================================
    function salvarBackupLocal(tabela, dados) {
        try {
            localStorage.setItem(`backup_${tabela}`, JSON.stringify(dados));
            localStorage.setItem(`backup_data_${tabela}`, new Date().toISOString());
        } catch (e) {
            console.warn(`⚠️ Não foi possível salvar backup de ${tabela}:`, e.message);
        }
    }

    function carregarBackupLocal(tabela) {
        try {
            const dados = localStorage.getItem(`backup_${tabela}`);
            return dados ? JSON.parse(dados) : [];
        } catch {
            return [];
        }
    }

    async function atualizarBackupLocal(tabela) {
        try {
            if (supabasePronto()) {
                const { data } = await window.supabase.from(tabela).select('*');
                salvarBackupLocal(tabela, data || []);
            }
        } catch (e) {
            console.warn(`⚠️ Erro ao atualizar backup de ${tabela}:`, e.message);
        }
    }

    function obterDataUltimoBackup(tabela) {
        return localStorage.getItem(`backup_data_${tabela}`) || 'Nunca';
    }

    // ============================================================
    // 📋 FUNÇÕES: Fila de Pendentes (para quando estiver offline)
    // ============================================================
    function adicionarPendente(tabela, dados) {
        try {
            const pendentes = JSON.parse(localStorage.getItem('pendentes') || '[]');
            pendentes.push({
                tabela,
                dados,
                dataHora: new Date().toISOString(),
                tentativas: 0
            });
            localStorage.setItem('pendentes', JSON.stringify(pendentes));
            console.log(`💾 Salvo na fila de pendentes para sincronizar depois`);
        } catch (e) {
            console.error(`❌ Não foi possível salvar pendente:`, e.message);
        }
    }

    function listarPendentes() {
        try {
            return JSON.parse(localStorage.getItem('pendentes') || '[]');
        } catch {
            return [];
        }
    }

    async function sincronizarPendentes() {
        const pendentes = listarPendentes();

        if (pendentes.length === 0) return { sincronizados: 0 };

        console.log(`\n🔄 [sync.js] Sincronizando ${pendentes.length} registros pendentes...`);

        let sincronizados = 0;
        const restantes = [];

        for (const item of pendentes) {
            const resultado = await salvarNoSupabase(item.tabela, item.dados);

            if (resultado.sucesso) {
                sincronizados++;
            } else {
                item.tentativas = (item.tentativas || 0) + 1;
                if (item.tentativas < 5) {
                    restantes.push(item);
                }
            }
        }

        try {
            localStorage.setItem('pendentes', JSON.stringify(restantes));
        } catch (e) {}
        
        console.log(`✅ [sync.js] ${sincronizados} pendentes sincronizados!`);

        return { sincronizados, restantes: restantes.length };
    }

    // ============================================================
    // 🔍 FUNÇÕES AUXILIARES
    // ============================================================
    function resumoDados(dados) {
        const resumo = {};
        for (const tabela of TABELAS) {
            resumo[tabela] = `${dados[tabela]?.length || 0} registros`;
        }
        return resumo;
    }

    function obterDados(tabela) {
        return window.dadosSistema[tabela] || carregarBackupLocal(tabela);
    }

    // ============================================================
    // 🚀 INICIALIZAÇÃO AUTOMÁTICA DO SISTEMA
    // ============================================================
    async function inicializarSistema() {
        console.log("\n🚀 [sync.js] Inicializando sistema de sincronização...");

        // 1. Primeiro carrega os dados locais (rápido, para mostrar algo na tela)
        for (const tabela of TABELAS) {
            const dadosLocais = carregarBackupLocal(tabela);
            if (dadosLocais.length > 0) {
                window.dadosSistema[tabela] = dadosLocais;
            }
        }

        // Se já temos window.BD do banco-dados.js, atualiza dashboard imediatamente
        if (window.BD && window.BD.veiculos && window.BD.veiculos.length > 0) {
            console.log(`ℹ️ [sync.js] Usando window.BD existente: ${window.BD.veiculos.length} veículos`);
            if (typeof window.atualizarDashboardCompleto === 'function') {
                try {
                    window.atualizarDashboardCompleto();
                } catch (e) {
                    console.error('❌ Erro ao atualizar dashboard:', e.message);
                }
            }
        }

        // Dispara evento inicial com dados locais
        try {
            if (Object.keys(window.dadosSistema).length > 0) {
                document.dispatchEvent(new CustomEvent('dadosCarregados', {
                    detail: window.dadosSistema
                }));
            }
        } catch (e) {}

        // 2. Espera o Supabase conectar (até 8 segundos)
        const conectou = await esperarSupabasePronto(8000);
        
        if (conectou) {
            console.log('✅ [sync.js] Supabase confirmado, sincronizando dados...');
            // 1. Primeiro envia dados locais para o Supabase
            await sincronizarLocalParaSupabase();
            // 2. Depois busca dados atualizados do Supabase
            await buscarDadosSupabase();
            await sincronizarPendentes();
        } else {
            console.warn('⚠️ [sync.js] Supabase não conectou no tempo limite. Funcionando com dados locais.');
            atualizarDashboardComDadosLocais();
            
            // Tenta novamente depois
            setTimeout(async () => {
                if (supabasePronto()) {
                    await sincronizarLocalParaSupabase();
                    await buscarDadosSupabase();
                    await sincronizarPendentes();
                }
            }, 5000);
        }
    }

    // ============================================================
    // 📤 SINCRONIZAÇÃO EM MASSA: Local → Supabase
    // Envia todos os dados do localStorage para o Supabase
    // ============================================================
    async function sincronizarLocalParaSupabase() {
        if (!supabasePronto()) {
            console.warn('⚠️ [sync.js] Sem conexão com Supabase. Dados serão sincronizados depois.');
            return { sucesso: false, erro: 'Sem conexão' };
        }
        
        if (!window.BD) {
            console.warn('⚠️ [sync.js] window.BD não existe. Nada para sincronizar.');
            return { sucesso: false, erro: 'Sem dados locais' };
        }
        
        const supabase = window.supabase;
        console.log('\n📤 [sync.js] Sincronizando dados locais → Supabase...');
        
        let totalSincronizados = 0;
        let tabelasComErro = [];
        
        for (const tabela of TABELAS) {
            try {
                const dadosLocais = window.BD[tabela];
                
                if (!dadosLocais || !Array.isArray(dadosLocais) || dadosLocais.length === 0) {
                    console.log(`ℹ️ ${tabela}: sem dados locais para sincronizar`);
                    continue;
                }
                
                // Prepara os dados (remove campos que não devem ir para o banco)
                const dadosParaEnviar = dadosLocais.map(item => {
                    const copia = { ...item };
                    // Garante que o ID seja número ou null
                    if (copia.id !== undefined && copia.id !== null) {
                        copia.id = Number(copia.id);
                    }
                    return copia;
                });
                
                // Faz upsert em massa (insere ou atualiza)
                const { data, error } = await supabase
                    .from(tabela)
                    .upsert(dadosParaEnviar, { onConflict: 'id', ignoreDuplicates: false })
                    .select();
                
                if (error) throw error;
                
                console.log(`✅ ${tabela}: ${dadosParaEnviar.length} registros sincronizados`);
                totalSincronizados += dadosParaEnviar.length;
                
            } catch (erro) {
                console.error(`❌ Erro ao sincronizar ${tabela}:`, erro.message);
                tabelasComErro.push(tabela);
            }
        }
        
        console.log(`\n📊 [sync.js] Sincronização concluída: ${totalSincronizados} registros enviados`);
        if (tabelasComErro.length > 0) {
            console.warn(`⚠️ Tabelas com erro: ${tabelasComErro.join(', ')}`);
        }
        
        return {
            sucesso: tabelasComErro.length === 0,
            totalSincronizados,
            tabelasComErro
        };
    }

    // ============================================================
    // 📢 EXPÕE FUNÇÕES GLOBALMENTE
    // ============================================================
    window.buscarDadosSupabase = buscarDadosSupabase;
    window.salvarNoSupabase = salvarNoSupabase;
    window.excluirDoSupabase = excluirDoSupabase;
    window.inicializarSistema = inicializarSistema;
    window.obterDados = obterDados;
    window.obterDataUltimoBackup = obterDataUltimoBackup;
    window.listarPendentes = listarPendentes;
    window.sincronizarPendentes = sincronizarPendentes;
    window.sincronizarLocalParaSupabase = sincronizarLocalParaSupabase;
    window.supabasePronto = supabasePronto;
    
    // ============================================================
    // 🔍 FUNÇÃO DE DEBUG - Testar sincronização
    // Use no console do navegador (F12): testarSincronizacao()
    // ============================================================
    window.testarSincronizacao = async function() {
        console.log('\n🔍 ==============================================');
        console.log('🔍 TESTANDO SINCRONIZAÇÃO COM SUPABASE');
        console.log('🔍 ==============================================');
        
        console.log('\n1️⃣ Verificando conexão...');
        console.log('   supabasePronto():', supabasePronto());
        console.log('   window.supabase:', typeof window.supabase);
        if (window.supabase) {
            console.log('   temConexaoReal:', window.supabase.temConexaoReal);
            console.log('   typeof from:', typeof window.supabase.from);
        }
        
        console.log('\n2️⃣ Verificando dados locais...');
        if (window.BD) {
            console.log('   usuarios:', window.BD.usuarios ? window.BD.usuarios.length : 0, 'registros');
            console.log('   veiculos:', window.BD.veiculos ? window.BD.veiculos.length : 0, 'registros');
            if (window.BD.usuarios && window.BD.usuarios.length > 0) {
                console.log('   Primeiro usuário:', JSON.stringify(window.BD.usuarios[0], null, 2));
            }
        } else {
            console.log('   ❌ window.BD não existe!');
        }
        
        console.log('\n3️⃣ Tentando sincronizar...');
        if (supabasePronto()) {
            var resultado = await sincronizarLocalParaSupabase();
            console.log('   Resultado:', resultado);
        } else {
            console.log('   ❌ Supabase não está pronto!');
        }
        
        console.log('\n🔍 ==============================================');
        console.log('🔍 FIM DO TESTE');
        console.log('🔍 ==============================================\n');
    };

    // ============================================================
    // 🎬 INICIALIZAÇÃO
    // ============================================================
    function iniciar() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', inicializarSistema);
        } else {
            inicializarSistema();
        }
    }

    // Inicia automaticamente
    iniciar();

    // Atualiza automaticamente a cada 30 segundos
    setInterval(async () => {
        if (supabasePronto()) {
            await sincronizarLocalParaSupabase();
            await buscarDadosSupabase();
            await sincronizarPendentes();
        }
    }, 30000); // 30.000ms = 30 segundos

    console.log("✅ [sync.js] Script carregado e pronto!");

})();
