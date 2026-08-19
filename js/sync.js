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
    
    // ============================================================
    // 🔄 CONVERSÃO DE CHAVES: camelCase ↔ minúsculas
    // O Postgres converte tudo para minúsculas, então precisamos
    // converter os nomes dos campos ao enviar/receber dados
    // ============================================================
    
    // Mapeamento de campos que precisam de conversão
    const MAPEAMENTO_CAMPOS = {
        // Usuários
        'numeroCNH': 'numerocnh',
        'registroCNH': 'registrocnh',
        'categoriaCNH': 'categoriacnh',
        'dataValidadeCNH': 'datavalidadecnh',
        // Veículos
        'usaKm': 'usakm',
        'usaHorimetro': 'usahorimetro',
        // Manutenções
        'kmAtual': 'kmatual',
        'dataProximaRevisao': 'dataproximarevisao',
        // Alocações
        'horimetroSaida': 'horimetrosaida',
        'horimetroRetorno': 'horimetroretorno',
        'horimetroRodado': 'horimetrorodado',
        // Gastos
        'pontoAbastecimento': 'pontoabastecimento',
        'tipoCombustivel': 'tipocombustivel',
        'perfilLancamento': 'perfillancamento',
        // Adiantamentos
        'valorEstornado': 'valorestornado',
        'liberadoPor': 'liberadopor',
        'dataLiberacao': 'dataliberacao',
        'dataFechamento': 'datafechamento',
        'fechadoPor': 'fechadopor',
        // Documentos
        'veiculoId': 'veiculoid',
        'dataEmissao': 'dataemissao',
        'dataVencimento': 'datavencimento',
        'dataCadastro': 'datacadastro',
        'arquivoNome': 'arquivonome',
        'arquivoTipo': 'arquivotipo',
        'arquivoBase64': 'arquivobase64',
        'arquivoTamanho': 'arquivotamanho',
        'criado_em': 'criado_em'
    };
    
    // Cria mapa reverso (minúsculas → camelCase)
    const MAPEAMENTO_REVERSO = {};
    for (const key in MAPEAMENTO_CAMPOS) {
        MAPEAMENTO_REVERSO[MAPEAMENTO_CAMPOS[key]] = key;
    }
    
    // Converte objeto para enviar ao Postgres (camelCase → minúsculas)
    function converterParaPostgres(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
            return obj.map(converterParaPostgres);
        }
        const resultado = {};
        for (const chave in obj) {
            if (obj.hasOwnProperty(chave)) {
                const chaveConvertida = MAPEAMENTO_CAMPOS[chave] || chave.toLowerCase();
                resultado[chaveConvertida] = obj[chave];
            }
        }
        return resultado;
    }
    
    // Converte objeto recebido do Postgres (minúsculas → camelCase)
    function converterDoPostgres(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) {
            return obj.map(converterDoPostgres);
        }
        const resultado = {};
        for (const chave in obj) {
            if (obj.hasOwnProperty(chave)) {
                const chaveConvertida = MAPEAMENTO_REVERSO[chave] || chave;
                resultado[chaveConvertida] = obj[chave];
            }
        }
        return resultado;
    }

    // Armazena os dados na memória para acesso rápido
    window.dadosSistema = window.dadosSistema || {};

    // ============================================================
    // 🔍 VERIFICA SE O SUPABASE ESTÁ REALMENTE PRONTO
    // ============================================================
    function supabasePronto() {
        const sb = window.supabase;
        return sb && typeof sb.from === 'function' && sb.temConexaoReal === true;
    }

    // ============================================================
    // 🔌 CORRIGIDO: verificação REAL de conectividade
    // Antes, temConexaoReal era setada como true assim que o cliente
    // Supabase era criado (em supabase.js e js/supabase.js), inclusive
    // quando a consulta de teste falhava — ou seja, a flag refletia
    // "o objeto cliente existe", não "o banco está de fato acessível".
    // Isso impedia o sistema de perceber quedas de conexão durante o
    // uso e de reagir quando a conexão voltava. Esta função faz uma
    // consulta leve real e só marca temConexaoReal=true/false conforme
    // o resultado, distinguindo falha de REDE (offline de verdade) de
    // erro de permissão/RLS (que significa que o banco respondeu).
    // ============================================================
    function pareceErroDeRede(erro) {
        const msg = ((erro && erro.message) || String(erro || '')).toLowerCase();
        return msg.includes('failed to fetch') ||
               msg.includes('network') ||
               msg.includes('load failed') ||
               msg.includes('timeout');
    }

    let _verificandoConexao = false;
    let _estavaOffline = false; // rastreia transição offline → online para disparar resync imediato
    async function verificarConexaoReal() {
        const sb = window.supabase;
        if (!sb || typeof sb.from !== 'function') {
            if (sb) sb.temConexaoReal = false;
            return false;
        }
        if (_verificandoConexao) {
            return sb.temConexaoReal === true;
        }
        _verificandoConexao = true;
        try {
            const { error } = await sb.from('locais').select('id', { count: 'exact', head: true });
            // Erro de RLS/permissão ainda significa que o Supabase respondeu:
            // só tratamos como offline erros de rede de verdade.
            const online = !error || !pareceErroDeRede(error);
            sb.temConexaoReal = online;
            return online;
        } catch (erro) {
            const online = !pareceErroDeRede(erro);
            sb.temConexaoReal = online;
            return online;
        } finally {
            _verificandoConexao = false;
        }
    }

    // Espera o Supabase ficar pronto, com timeout (agora com verificação real)
    function esperarSupabasePronto(timeoutMs) {
        return new Promise((resolve) => {
            const inicio = Date.now();
            const verificar = async () => {
                const sb = window.supabase;
                if (sb && typeof sb.from === 'function') {
                    const conectado = await verificarConexaoReal();
                    if (conectado) {
                        resolve(true);
                        return;
                    }
                }
                if (Date.now() - inicio > timeoutMs) {
                    console.warn('⚠️ [sync.js] Timeout esperando Supabase conectar');
                    resolve(false);
                } else {
                    setTimeout(verificar, 500);
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

                // 🔄 Converte minúsculas → camelCase para o JavaScript
                todosDados[tabela] = converterDoPostgres(data || []);
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

            // 🔄 CORRIGIDO: esta função enviava os campos em camelCase direto
            // (ex.: kmAtual, veiculoId), sem converter para o formato que o
            // Postgres realmente usa (kmatual, veiculoid). O envio falhava
            // silenciosamente para qualquer campo com letra maiúscula.
            const dadosConvertidos = converterParaPostgres(dados);

            if (dadosConvertidos.id && dadosConvertidos.id !== null) {
                // 🔄 Atualiza registro existente
                const { data: dataResult, error } = await supabase
                    .from(tabela)
                    .update(dadosConvertidos)
                    .eq('id', dadosConvertidos.id)
                    .select();

                if (error) throw error;
                resultado = dataResult[0];
                console.log(`✅ ${tabela} #${dadosConvertidos.id} atualizado no Supabase`);
            } else {
                // ➕ Insere novo registro
                const { data: dataResult, error } = await supabase
                    .from(tabela)
                    .insert([dadosConvertidos])
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

            // 🔄 CORRIGIDO: se o erro é de rede (não de permissão/validação),
            // marca a conexão como caída imediatamente, sem esperar o próximo
            // ciclo de verificação — assim o monitor de reconexão detecta a
            // volta da conexão mais rápido, pois já sabe que estava offline.
            if (pareceErroDeRede(erro) && window.supabase) {
                window.supabase.temConexaoReal = false;
                _estavaOffline = true;
            }

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
            if (pareceErroDeRede(erro) && window.supabase) {
                window.supabase.temConexaoReal = false;
                _estavaOffline = true;
            }
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
            // 1. PRIMEIRO busca dados do Supabase (FONTE DA VERDADE)
            await buscarDadosSupabase();
            // 2. DEPOIS envia apenas dados novos/alterados do localStorage
            await sincronizarLocalParaSupabase();
            await sincronizarPendentes();
            console.log('✅ [sync.js] Sincronização bidirecional concluída!');
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

    // Função auxiliar para gerar hash de strings
    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash;
    }

    // ============================================================
    // 📤 CORRIGIDO — ACHADO CRÍTICO (19/08/2026):
    // O PostgREST (usado pelo Supabase) exige que TODOS os objetos de
    // um mesmo upsert/insert em lote tenham o MESMO conjunto de colunas.
    // Registros novos criados localmente (ex.: um usuário recém-cadastrado
    // na tela, que ainda não tem "id" porque só o Supabase gera um) eram
    // enviados na MESMA chamada que registros já existentes sendo
    // editados (que já têm "id"). Essa mistura de colunas fazia o
    // Supabase rejeitar o LOTE INTEIRO daquela tabela — inclusive as
    // edições de registros que já tinham id e estavam corretos. Era por
    // isso que uma edição de usuário "sumia": nunca chegava a ser
    // gravada no Supabase, e a próxima busca (a cada 30s, ou ao recarregar
    // a página) trazia de volta o dado antigo, sobrescrevendo a edição
    // feita na tela.
    //
    // Esta função separa os registros de uma tabela em dois lotes
    // homogêneos — um só com "id" (upsert = atualiza) e outro sem "id"
    // (insert = cria) — e envia cada lote em uma chamada própria, para
    // que um problema em um novo cadastro nunca mais bloqueie a edição
    // de um registro já existente, e vice-versa.
    // ============================================================
    async function enviarTabelaParaSupabase(supabase, tabela, dadosLocais) {
        const comId = [];
        const semId = [];

        for (const item of dadosLocais) {
            let copia = converterParaPostgres({ ...item });

            // Trata locais: converte ID de string para número se necessário
            // (regra que só existia em forcarSincronizar(); agora é única
            // e vale também para o ciclo automático de 30s).
            if (tabela === 'locais' && typeof copia.id === 'string') {
                const idsLocais = { 'patio-metalica': 1, 'patio-usina-conc': 2, 'obra': 3 };
                copia.id = idsLocais[copia.id] || Math.abs(hashCode(copia.id));
            }

            if (copia.id !== undefined && copia.id !== null && copia.id !== '') {
                copia.id = Number(copia.id);
                comId.push(copia);
            } else {
                // Remove a chave "id" por completo (não deixa undefined),
                // garantindo que este lote também seja homogêneo entre si.
                delete copia.id;
                semId.push(copia);
            }
        }

        let totalEnviados = 0;
        const erros = [];
        let houveInsercaoNova = false;

        if (comId.length > 0) {
            const { error } = await supabase
                .from(tabela)
                .upsert(comId, { onConflict: 'id', ignoreDuplicates: false })
                .select();
            if (error) {
                erros.push(`atualização: ${error.message}`);
            } else {
                totalEnviados += comId.length;
            }
        }

        if (semId.length > 0) {
            const { error } = await supabase
                .from(tabela)
                .insert(semId)
                .select();
            if (error) {
                erros.push(`inserção: ${error.message}`);
            } else {
                totalEnviados += semId.length;
                houveInsercaoNova = true;
            }
        }

        return { totalEnviados, erros, houveInsercaoNova };
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
        let precisaRebuscar = false;
        
        for (const tabela of TABELAS) {
            try {
                const dadosLocais = window.BD[tabela];
                
                if (!dadosLocais || !Array.isArray(dadosLocais) || dadosLocais.length === 0) {
                    console.log(`ℹ️ ${tabela}: sem dados locais para sincronizar`);
                    continue;
                }

                const resultado = await enviarTabelaParaSupabase(supabase, tabela, dadosLocais);

                if (resultado.erros.length > 0) {
                    console.error(`❌ Erro ao sincronizar ${tabela}:`, resultado.erros.join(' | '));
                    tabelasComErro.push(tabela);
                } else {
                    console.log(`✅ ${tabela}: ${resultado.totalEnviados} registros sincronizados`);
                    totalSincronizados += resultado.totalEnviados;
                    if (resultado.houveInsercaoNova) precisaRebuscar = true;
                }
                
            } catch (erro) {
                console.error(`❌ Erro ao sincronizar ${tabela}:`, erro.message);
                tabelasComErro.push(tabela);
            }
        }
        
        console.log(`\n📊 [sync.js] Sincronização concluída: ${totalSincronizados} registros enviados`);
        if (tabelasComErro.length > 0) {
            console.warn(`⚠️ Tabelas com erro: ${tabelasComErro.join(', ')}`);
        }

        // 🔄 Se algum registro novo (sem id) foi inserido, busca de volta
        // do Supabase para que window.BD passe a ter o id real gerado
        // pelo banco — assim a PRÓXIMA edição desse mesmo registro já
        // encontra o id certo e vai pelo caminho de atualização.
        if (precisaRebuscar) {
            await buscarDadosSupabase();
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
    // Flag para evitar loops de sincronização
    var sincronizacaoEmAndamento = false;
    // Usa variável GLOBAL para compartilhar com banco-dados.js
    window._ultimaSincronizacaoSupabase = 0;
    window._sincronizacaoEmAndamento = false;
    
    // Sobrescreve sincronizarLocalParaSupabase para evitar loops
    const _sincronizarOriginal = sincronizarLocalParaSupabase;
    sincronizarLocalParaSupabase = async function() {
        // Se acabamos de receber dados do Supabase (há menos de 2 segundos), não reenvie
        if (Date.now() - (window._ultimaSincronizacaoSupabase || 0) < 2000) {
            console.log('ℹ️ [sync.js] Pulando envio - dados recentes do Supabase');
            return { sucesso: true, pulado: true };
        }
        if (sincronizacaoEmAndamento || window._sincronizacaoEmAndamento) {
            console.log('ℹ️ [sync.js] Sincronização já em andamento, pulando...');
            return { sucesso: true, ocupado: true };
        }
        window._sincronizacaoEmAndamento = true;
        sincronizacaoEmAndamento = true;
        try {
            return await _sincronizarOriginal();
        } finally {
            sincronizacaoEmAndamento = false;
            window._sincronizacaoEmAndamento = false;
        }
    };
    
    // Também atualiza a flag quando buscarDadosSupabase é chamado
    const _buscarOriginal = buscarDadosSupabase;
    buscarDadosSupabase = async function() {
        sincronizacaoEmAndamento = true;
        try {
            const resultado = await _buscarOriginal();
            window._ultimaSincronizacaoSupabase = Date.now();
            return resultado;
        } finally {
            sincronizacaoEmAndamento = false;
        }
    };
    
    // ============================================================
    // 🔧 FUNÇÃO PARA LIMPAR CACHE E SINCRONIZAR DO ZERO
    // Use no console: limparCacheESincronizar()
    // ============================================================
    window.limparCacheESincronizar = async function() {
        console.log('🔄 ==============================================');
        console.log('🔄 LIMPANDO CACHE E SINCRONIZANDO DO ZERO');
        console.log('🔄 ==============================================');
        
        // 1. Limpa o localStorage
        localStorage.removeItem('bd_frotas');
        localStorage.removeItem('backup_locais');
        localStorage.removeItem('backup_usuarios');
        localStorage.removeItem('backup_veiculos');
        localStorage.removeItem('backup_checklists');
        localStorage.removeItem('backup_manutencoes');
        localStorage.removeItem('backup_gastos');
        localStorage.removeItem('backup_chamados');
        localStorage.removeItem('backup_alocacoes');
        localStorage.removeItem('backup_adiantamentos');
        localStorage.removeItem('backup_gastosViagem');
        localStorage.removeItem('backup_documentosVeiculos');
        localStorage.removeItem('backup_pontosAbastecimento');
        localStorage.removeItem('pendentes');
        
        console.log('✅ localStorage limpo!');
        
        // 2. Limpa o BD em memória
        window.BD = {};
        
        // 3. Busca TUDO do Supabase
        console.log('📥 Buscando dados do Supabase...');
        const resultado = await buscarDadosSupabase();
        
        console.log('✅ Sincronização concluída!');
        console.log('📊 Veículos:', window.BD.veiculos?.length || 0);
        console.log('📊 Usuários:', window.BD.usuarios?.length || 0);
        
        // 4. Atualiza a tela
        if (typeof carregarTabelaUsuarios === 'function') carregarTabelaUsuarios();
        if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
        
        alert('✅ Cache limpo e dados sincronizados do Supabase com sucesso!');
        
        return resultado;
    };
    
    // ============================================================
    // ⚡ FORÇAR SINCRONIZAÇÃO - ignora proteções de tempo
    // Usada quando o usuário salva uma edição
    // ============================================================
    window.forcarSincronizar = async function() {
        if (!supabasePronto()) {
            console.warn('⚠️ [sync.js] Sem conexão com Supabase');
            return { sucesso: false, erro: 'Sem conexão' };
        }
        
        console.log('⚡ [sync.js] ==========================================');
        console.log('⚡ [sync.js] FORÇANDO SINCRONIZAÇÃO LOCAL → SUPABASE');
        console.log('⚡ [sync.js] ==========================================');
        
        const supabase = window.supabase;
        let totalSincronizados = 0;
        let tabelasComErro = [];
        let precisaRebuscar = false;
        
        // Log detalhado dos usuários antes de enviar
        if (window.BD.usuarios && window.BD.usuarios.length > 0) {
            console.log('👤 [sync.js] Usuários que serão enviados:');
            window.BD.usuarios.forEach(function(u, i) {
                console.log('   ', i + 1, '| ID:', u.id, '| Nome:', u.nome, '| CPF:', u.cpf || 'VAZIO', '| Tel:', u.telefone || 'VAZIO');
            });
        }
        
        for (const tabela of TABELAS) {
            try {
                const dadosLocais = window.BD[tabela];
                
                if (!dadosLocais || !Array.isArray(dadosLocais) || dadosLocais.length === 0) {
                    console.log('ℹ️ [sync.js]', tabela, ': sem dados locais, pulando...');
                    continue;
                }
                
                console.log('📤 [sync.js] Enviando', tabela, '→', dadosLocais.length, 'registros...');

                // 🔄 CORRIGIDO: esta função tinha sua PRÓPRIA cópia da lógica de
                // envio, divergente de sincronizarLocalParaSupabase() — por
                // exemplo, faltava aqui a separação entre registros com/sem id
                // que evita que um cadastro novo sem id derrube o lote inteiro
                // da tabela (o bug relatado de edição de usuário não gravar).
                // Agora as duas funções usam a mesma rotina.
                const resultado = await enviarTabelaParaSupabase(supabase, tabela, dadosLocais);

                if (resultado.erros.length > 0) {
                    console.error('❌ [sync.js] ERRO em', tabela, ':', resultado.erros.join(' | '));
                    tabelasComErro.push(tabela);
                } else {
                    console.log('✅ [sync.js]', tabela, ': SINCRONIZADO!', resultado.totalEnviados, 'registros enviados');
                    totalSincronizados += resultado.totalEnviados;
                    if (resultado.houveInsercaoNova) precisaRebuscar = true;
                }
                
            } catch (erro) {
                console.error('❌ [sync.js] ERRO em', tabela, ':', erro.message || erro);
                if (erro.details) console.error('   Detalhes:', erro.details);
                if (erro.hint) console.error('   Dica:', erro.hint);
                tabelasComErro.push(tabela);
            }
        }
        
        // Atualiza flag
        window._ultimaSincronizacaoSupabase = Date.now();

        // 🔄 Mesma correção do ciclo automático: se algum registro novo
        // foi inserido, busca de volta para gravar o id real gerado.
        if (precisaRebuscar) {
            await buscarDadosSupabase();
        }
        
        console.log('⚡ [sync.js] ==========================================');
        console.log('⚡ [sync.js] SINCRONIZAÇÃO CONCLUÍDA:');
        console.log('⚡ [sync.js] Total de registros:', totalSincronizados);
        console.log('⚡ [sync.js] Tabelas com erro:', tabelasComErro);
        console.log('⚡ [sync.js] ==========================================');
        
        return {
            // 🔄 CORRIGIDO: antes retornava sucesso:true sempre, mesmo com
            // tabelasComErro preenchido — inconsistente com o retorno de
            // sincronizarLocalParaSupabase() e enganoso para quem chama.
            sucesso: tabelasComErro.length === 0,
            totalSincronizados,
            tabelasComErro
        };
    };

    // ============================================================
    // 🧪 FUNÇÃO DE TESTE: Atualizar um usuário específico
    // Use no console: testarAtualizarUsuario('joao', { cpf: '12345678909' })
    // ============================================================
    window.testarAtualizarUsuario = async function(usuarioLogin, novosDados) {
        console.log('🧪 ==========================================');
        console.log('🧪 TESTE: Atualizando usuário', usuarioLogin);
        console.log('🧪 Novos dados:', novosDados);
        console.log('🧪 ==========================================');
        
        if (!supabasePronto()) {
            console.error('❌ Supabase não está pronto!');
            return;
        }
        
        // 1. Atualiza no localStorage
        const usuario = window.BD.usuarios.find(u => u.usuario === usuarioLogin);
        if (!usuario) {
            console.error('❌ Usuário não encontrado no localStorage!');
            return;
        }
        
        console.log('👤 Usuário encontrado - ID:', usuario.id, 'Nome:', usuario.nome);
        
        // Aplica novos dados
        Object.assign(usuario, novosDados);
        console.log('👤 Dados atualizados:', JSON.stringify(usuario, null, 2));
        
        // 2. Salva
        salvarDados();
        
        // 3. Tenta atualizar DIRETAMENTE no Supabase
        console.log('📤 Tentando UPSERT DIRETO no Supabase...');
        
        try {
            const { data, error } = await window.supabase
                .from('usuarios')
                .upsert([usuario], { onConflict: 'id', ignoreDuplicates: false })
                .select();
            
            if (error) {
                console.error('❌ ERRO do Supabase:', error);
            } else {
                console.log('✅ SUPABASE RESPOSTA:', data);
                console.log('✅ USUÁRIO ATUALIZADO NO SUPABASE!');
            }
        } catch (e) {
            console.error('❌ EXCEÇÃO:', e);
        }
        
        // 4. Busca do Supabase para confirmar
        console.log('🔍 Buscando dados do Supabase para confirmar...');
        const { data: dadosConfirmacao, error: erroConfirmacao } = await window.supabase
            .from('usuarios')
            .select('*')
            .eq('id', usuario.id);
        
        if (erroConfirmacao) {
            console.error('❌ Erro ao confirmar:', erroConfirmacao);
        } else {
            console.log('✅ DADOS NO SUPABASE:', dadosConfirmacao);
        }
    };

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
            await buscarDadosSupabase();      // Primeiro busca do banco
            await sincronizarLocalParaSupabase(); // Depois envia alterações locais
            await sincronizarPendentes();
        }
    }, 30000); // 30.000ms = 30 segundos

    // ============================================================
    // 🔄 NOVO: MONITOR DE RECONEXÃO
    // Faz uma verificação real e leve de conectividade a cada 10s
    // (independente do ciclo de 30s de dados, que só roda se já
    // estiver "pronto"). Assim que detecta que a conexão com o
    // Supabase voltou depois de ter caído, dispara IMEDIATAMENTE
    // busca + envio + fila de pendentes, sem esperar o próximo tick.
    // ============================================================
    async function monitorarConectividade() {
        const conectadoAgora = await verificarConexaoReal();

        if (conectadoAgora && _estavaOffline) {
            console.log('✅ [sync.js] Conexão com o Supabase reestabelecida! Sincronizando automaticamente...');
            _estavaOffline = false;
            await buscarDadosSupabase();
            await sincronizarLocalParaSupabase();
            await sincronizarPendentes();
            console.log('✅ [sync.js] Sincronização pós-reconexão concluída!');
        } else if (!conectadoAgora) {
            if (!_estavaOffline) {
                console.warn('📴 [sync.js] Conexão com o Supabase caiu. Trabalhando com backup local até reconectar.');
            }
            _estavaOffline = true;
        }
    }

    // Verifica conectividade real a cada 10 segundos
    setInterval(monitorarConectividade, 10000);

    // 🌐 Reage IMEDIATAMENTE quando o navegador recupera a rede
    window.addEventListener('online', () => {
        console.log('🌐 [sync.js] Navegador detectou rede de volta. Verificando Supabase...');
        monitorarConectividade();
    });

    // 📴 Reage IMEDIATAMENTE quando o navegador perde a rede
    window.addEventListener('offline', () => {
        console.warn('📴 [sync.js] Navegador sem rede. Modo offline ativado — dados continuam sendo salvos localmente.');
        _estavaOffline = true;
        if (window.supabase) window.supabase.temConexaoReal = false;
    });

    // Expõe para debug manual no console (F12): verificarConexaoReal()
    window.verificarConexaoReal = verificarConexaoReal;

    console.log("✅ [sync.js] Script carregado e pronto!");

})();
