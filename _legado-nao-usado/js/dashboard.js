// ============================================================
// 📊 dashboard.js - Atualização Automática do Painel de Controle
// ============================================================
// Lê os dados carregados pelo sync.js e atualiza os cards
// do Dashboard com os valores corretos.
//
// ATENÇÃO: Este arquivo funciona em conjunto com melhorias-dashboard.js
// Os IDs dos elementos seguem o padrão definido no HTML:
// cardTotalVeiculos, cardEmOperacao, cardEmManutencao
// ============================================================

(function() {
    'use strict';

    console.log("✅ [dashboard.js] Script carregado e pronto!");

    // ============================================================
    // 🎯 FUNÇÃO PRINCIPAL: Atualiza todo o Dashboard
    // ============================================================
    function atualizarDashboard(dados) {
        console.log("\n📊 [dashboard.js] Atualizando Painel de Controle...");

        if (!dados) {
            console.warn("⚠️ Nenhum dado recebido para atualizar o Dashboard");
            return;
        }

        // ==============================
        // 🔢 TOTAL DE VEÍCULOS
        // ==============================
        const totalVeiculos = dados.veiculos?.length || 0;
        atualizarCard('cardTotalVeiculos', totalVeiculos);

        // ==============================
        // 🟢 EM OPERAÇÃO
        // ==============================
        const emOperacao = contarVeiculosPorStatus(dados.veiculos, ['disponivel', 'alocado', 'ativo', 'operacao', 'em operação', 'disponível']);
        atualizarCard('cardEmOperacao', emOperacao);

        // Porcentagem da frota em operação
        const porcentagem = totalVeiculos > 0 ? Math.round((emOperacao / totalVeiculos) * 100) : 0;
        atualizarTexto('cardEmOperacaoPct', `${porcentagem}% da frota`);

        // ==============================
        // 🔧 EM MANUTENÇÃO
        // ==============================
        const emManutencao = contarVeiculosPorStatus(dados.veiculos, ['manutencao', 'manutenção', 'oficina', 'inativo', 'indisponivel', 'indisponível']);
        atualizarCard('cardEmManutencao', emManutencao);

        console.log("✅ [dashboard.js] Painel atualizado com sucesso!");
    }

    // ============================================================
    // 🔍 FUNÇÕES AUXILIARES DE CÁLCULO
    // ============================================================
    function contarVeiculosPorStatus(veiculos, statusPermitidos) {
        if (!veiculos) return 0;

        return veiculos.filter(v => {
            if (!v.status) return false;
            const status = String(v.status).toLowerCase().trim();
            return statusPermitidos.some(s => status.includes(s.toLowerCase()));
        }).length;
    }

    // ============================================================
    // 🎨 FUNÇÕES AUXILIARES DE INTERFACE
    // ============================================================
    function atualizarCard(idElemento, valor) {
        const elemento = document.getElementById(idElemento);

        if (!elemento) {
            console.warn(`⚠️ Elemento não encontrado: #${idElemento}`);
            return;
        }

        // Procura o elemento .stat-valor dentro do card
        const valorEl = elemento.querySelector('.stat-valor');
        const alvo = valorEl || elemento;

        // Atualiza o valor
        alvo.textContent = valor;

        // Efeito visual de atualização
        alvo.style.transition = 'color 0.3s ease';
        alvo.style.color = '#10b981'; // verde

        setTimeout(() => {
            alvo.style.color = '';
        }, 500);
    }

    function atualizarTexto(idElemento, texto) {
        const elemento = document.getElementById(idElemento);
        if (elemento) {
            elemento.textContent = texto;
        }
    }

    // ============================================================
    // 🎬 INICIALIZAÇÃO DO DASHBOARD
    // ============================================================
    function iniciar() {
        console.log("\n🎬 [dashboard.js] Iniciando Dashboard...");

        // Escuta o evento de dados carregados (disparado pelo sync.js)
        document.addEventListener('dadosCarregados', (e) => {
            atualizarDashboard(e.detail);
        });

        // Também tenta atualizar imediatamente se os dados já estiverem prontos
        if (window.BD && window.BD.veiculos && window.BD.veiculos.length > 0) {
            atualizarDashboard({
                veiculos: window.BD.veiculos,
                chamados: window.BD.chamados,
                gastos: window.BD.gastos
            });
        } else if (window.dadosSistema && Object.keys(window.dadosSistema).length > 0) {
            atualizarDashboard(window.dadosSistema);
        }
    }

    // Inicia quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }

})();
