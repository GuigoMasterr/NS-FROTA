// ==================================================
// ⛽ CONTROLE DE GASTOS - VERSÃO CORRIGIDA
// ==================================================

function carregarTabelaGastos() {
    try {
        console.log('💸 Carregando tabela de gastos...');
        
        const tabela = document.getElementById('tabelaGastos');
        if (!tabela) return;
        
        const filtroVeiculo = document.getElementById('filtroGastosVeiculo')?.value || 'todos';
        
        let gastos = (typeof BD !== 'undefined' && BD.gastos) ? [...BD.gastos] : [];
        
        if (filtroVeiculo !== 'todos') {
            gastos = gastos.filter(g => String(g.veiculoId) === String(filtroVeiculo));
        }
        
        // Ordena por data (mais recentes primeiro)
        gastos.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
        
        if (gastos.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6" class="estado-vazio">Nenhum gasto registrado</td></tr>';
            return;
        }
        
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        const getPlaca = (id) => {
            const v = veiculos.find(v => String(v.id) === String(id));
            return v ? v.placa : '-';
        };
        
        tabela.innerHTML = gastos.map(g => `
            <tr>
                <td>${g.data || '-'}</td>
                <td><strong>${getPlaca(g.veiculoId)}</strong></td>
                <td>${g.tipo || '-'}</td>
                <td>${g.observacao || '-'}</td>
                <td><strong style="color:#dc2626;">R$ ${Number(g.valor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong></td>
                <td>
                    <button class="btn-mini" onclick="excluirGasto(${g.id})" title="Excluir" style="color:#dc2626;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log(`✅ ${gastos.length} gasto(s) carregado(s)`);
        
    } catch (e) {
        console.error('❌ Erro ao carregar gastos:', e);
    }
}

function abrirModalGasto() {
    try {
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        
        if (veiculos.length === 0) {
            alert('⚠️ Cadastre um veículo primeiro!');
            return;
        }
        
        const tipos = (typeof CONFIG !== 'undefined' && CONFIG.TIPO_GASTOS) 
            ? CONFIG.TIPO_GASTOS 
            : ['Combustível', 'Peças', 'Serviço', 'IPVA', 'Seguro', 'Licenciamento', 'Multa', 'Outros'];
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay aberto';
        modal.id = 'modal-gasto';
        
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 500px;">
                <div class="modal-cabecalho">
                    <h3 class="modal-titulo">💸 Registrar Gasto</h3>
                    <button type="button" class="modal-fechar" onclick="fecharModal('modal-gasto')">&times;</button>
                </div>
                <div class="modal-corpo">
                    <form id="formGasto" class="form-grid">
                        <div class="form-grupo">
                            <label>Data <span class="obrigatorio">*</span></label>
                            <input type="date" id="gData" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-grupo">
                            <label>Veículo <span class="obrigatorio">*</span></label>
                            <select id="gVeiculo" required>
                                <option value="">Selecione...</option>
                                ${veiculos.map(v => `<option value="${v.id}">${v.placa} - ${v.modelo || ''}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Tipo <span class="obrigatorio">*</span></label>
                            <select id="gTipo" required>
                                <option value="">Selecione...</option>
                                ${tipos.map(t => `<option value="${t}">${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Valor (R$) <span class="obrigatorio">*</span></label>
                            <input type="number" id="gValor" required min="0" step="0.01" placeholder="0,00">
                        </div>
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label>Observação</label>
                            <input type="text" id="gObs" placeholder="Detalhes adicionais...">
                        </div>
                    </form>
                </div>
                <div class="modal-rodape">
                    <button type="button" class="btn btn-secundario" onclick="fecharModal('modal-gasto')">Cancelar</button>
                    <button type="button" class="btn btn-primario" id="btnSalvarGasto">💾 Registrar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('btnSalvarGasto').addEventListener('click', salvarGastoForm);
        document.getElementById('formGasto').addEventListener('submit', (e) => {
            e.preventDefault();
            salvarGastoForm();
        });
        
    } catch (e) {
        console.error('❌ Erro ao abrir modal de gasto:', e);
    }
}

function salvarGastoForm() {
    try {
        const data = document.getElementById('gData')?.value;
        const veiculoId = document.getElementById('gVeiculo')?.value;
        const tipo = document.getElementById('gTipo')?.value;
        const valor = parseFloat(document.getElementById('gValor')?.value);
        
        if (!data || !veiculoId || !tipo || isNaN(valor)) {
            alert('⚠️ Preencha todos os campos obrigatórios!');
            return;
        }
        
        const dados = {
            data: data,
            veiculoId: parseInt(veiculoId),
            tipo: tipo,
            valor: valor,
            observacao: document.getElementById('gObs')?.value.trim() || '',
            lancadoPor: window.usuarioAtual?.nome || 'Sistema'
        };
        
        if (typeof salvarGasto === 'function') {
            salvarGasto(dados);
        } else if (typeof BD !== 'undefined') {
            if (!BD.gastos) BD.gastos = [];
            dados.id = BD.gastos.length > 0 ? Math.max(...BD.gastos.map(g => g.id || 0)) + 1 : 1;
            BD.gastos.push(dados);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        fecharModal('modal-gasto');
        carregarTabelaGastos();
        
        if (typeof mostrarToast === 'function') mostrarToast('Gasto registrado!', 'sucesso');
        else alert('✅ Gasto registrado!');
        
    } catch (e) {
        console.error('❌ Erro ao salvar gasto:', e);
    }
}

function excluirGasto(id) {
    try {
        if (!confirm('Tem certeza que deseja excluir este gasto?')) return;
        
        if (typeof excluirGastoBD === 'function') {
            excluirGastoBD(id);
        } else if (typeof BD !== 'undefined' && BD.gastos) {
            BD.gastos = BD.gastos.filter(g => g.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarTabelaGastos();
        if (typeof mostrarToast === 'function') mostrarToast('Gasto excluído!', 'sucesso');
        
    } catch (e) {
        console.error('❌ Erro ao excluir gasto:', e);
    }
}

// Expõe funções
window.abrirModalGasto = abrirModalGasto;
window.excluirGasto = excluirGasto;
window.carregarTabelaGastos = carregarTabelaGastos;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    const filtro = document.getElementById('filtroGastosVeiculo');
    if (filtro) filtro.addEventListener('change', carregarTabelaGastos);
    console.log('✅ js/gastos.js inicializado');
});