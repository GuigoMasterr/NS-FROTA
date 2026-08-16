// ==================================================
// 🔧 CONTROLE DE MANUTENÇÃO - VERSÃO CORRIGIDA
// ==================================================

function carregarTabelaManutencao() {
    try {
        console.log('🔧 Carregando tabela de manutenção...');
        
        const tabela = document.getElementById('tabelaManutencao');
        if (!tabela) {
            console.warn('⚠️ Tabela de manutenção não encontrada');
            return;
        }
        
        const filtroVeiculo = document.getElementById('filtroVeiculoManutencao')?.value || 'todos';
        
        let manutencoes = (typeof BD !== 'undefined' && BD.manutencoes) ? [...BD.manutencoes] : [];
        
        if (filtroVeiculo !== 'todos') {
            manutencoes = manutencoes.filter(m => String(m.veiculoId) === String(filtroVeiculo));
        }
        
        // Ordena por data (mais recentes primeiro)
        manutencoes.sort((a, b) => new Date(b.dataPrevista || b.data || 0) - new Date(a.dataPrevista || a.data || 0));
        
        if (manutencoes.length === 0) {
            tabela.innerHTML = '<tr><td colspan="7" class="estado-vazio">Nenhuma manutenção registrada</td></tr>';
            return;
        }
        
        // Busca dados de veículos para exibir placa
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        const getPlaca = (id) => {
            const v = veiculos.find(v => String(v.id) === String(id));
            return v ? v.placa : 'Veículo não encontrado';
        };
        
        const badgeClass = {
            'Pendente': 'badge-warning',
            'Em Andamento': 'badge-info',
            'Concluída': 'badge-success',
            'Cancelada': 'badge-secondary'
        };
        
        tabela.innerHTML = manutencoes.map(m => `
            <tr>
                <td>${m.dataPrevista || m.data || '-'}</td>
                <td><strong>${getPlaca(m.veiculoId)}</strong></td>
                <td>${m.tipo === 'preventiva' ? '🛡️ Preventiva' : m.tipo === 'corretiva' ? '🔧 Corretiva' : '📋 Revisão'}</td>
                <td>${m.servico || '-'}</td>
                <td>${m.custo ? 'R$ ' + Number(m.custo).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '-'}</td>
                <td><span class="badge ${badgeClass[m.status] || 'badge-secondary'}">${m.status || 'Pendente'}</span></td>
                <td>
                    <button class="btn-mini" onclick="abrirModalManutencaoEditar(${m.id})" title="Editar">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    ${m.status !== 'Concluída' ? `
                    <button class="btn-mini" onclick="concluirManutencao(${m.id})" title="Concluir" style="color:#10b981;">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    ` : ''}
                    <button class="btn-mini" onclick="excluirManutencao(${m.id})" title="Excluir" style="color:#dc2626;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log(`✅ ${manutencoes.length} manutenção(ões) carregada(s)`);
        
    } catch (e) {
        console.error('❌ Erro ao carregar manutenções:', e);
        const tabela = document.getElementById('tabelaManutencao');
        if (tabela) tabela.innerHTML = '<tr><td colspan="7" class="estado-vazio" style="color:#dc2626;">Erro ao carregar</td></tr>';
    }
}

function abrirModalManutencao(tipo) {
    try {
        console.log('➕ Abrindo modal de manutenção:', tipo);
        
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        
        if (veiculos.length === 0) {
            if (typeof mostrarToast === 'function') mostrarToast('Cadastre um veículo primeiro!', 'aviso');
            else alert('⚠️ Cadastre um veículo primeiro!');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay aberto';
        modal.id = 'modal-manutencao';
        
        const titulo = tipo === 'preventiva' ? '🛡️ Manutenção Preventiva' : '🔧 Manutenção Corretiva';
        
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 550px;">
                <div class="modal-cabecalho">
                    <h3 class="modal-titulo">${titulo}</h3>
                    <button type="button" class="modal-fechar" onclick="fecharModal('modal-manutencao')">&times;</button>
                </div>
                <div class="modal-corpo">
                    <form id="formManutencao" class="form-grid">
                        <div class="form-grupo">
                            <label>Veículo <span class="obrigatorio">*</span></label>
                            <select id="mVeiculo" required>
                                <option value="">Selecione...</option>
                                ${veiculos.map(v => `<option value="${v.id}">${v.placa} - ${v.modelo || ''}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Data Prevista <span class="obrigatorio">*</span></label>
                            <input type="date" id="mData" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label>Serviço / Descrição <span class="obrigatorio">*</span></label>
                            <input type="text" id="mServico" required placeholder="Descreva o serviço...">
                        </div>
                        <div class="form-grupo">
                            <label>KM Previsto</label>
                            <input type="number" id="mKm" min="0" placeholder="Ex: 100000">
                        </div>
                        <div class="form-grupo">
                            <label>Custo Estimado (R$)</label>
                            <input type="number" id="mCusto" min="0" step="0.01" placeholder="0,00">
                        </div>
                    </form>
                </div>
                <div class="modal-rodape">
                    <button type="button" class="btn btn-secundario" onclick="fecharModal('modal-manutencao')">Cancelar</button>
                    <button type="button" class="btn btn-primario" id="btnSalvarManutencao">💾 Registrar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('btnSalvarManutencao').addEventListener('click', () => salvarManutencaoForm(tipo));
        document.getElementById('formManutencao').addEventListener('submit', (e) => {
            e.preventDefault();
            salvarManutencaoForm(tipo);
        });
        
    } catch (e) {
        console.error('❌ Erro ao abrir modal de manutenção:', e);
    }
}

function abrirModalManutencaoEditar(id) {
    try {
        const manutencao = (typeof BD !== 'undefined' && BD.manutencoes) 
            ? BD.manutencoes.find(m => m.id === id) 
            : null;
        
        if (!manutencao) {
            console.warn('⚠️ Manutenção não encontrada:', id);
            return;
        }
        
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay aberto';
        modal.id = 'modal-manutencao-edit';
        
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 550px;">
                <div class="modal-cabecalho">
                    <h3 class="modal-titulo">✏️ Editar Manutenção</h3>
                    <button type="button" class="modal-fechar" onclick="fecharModal('modal-manutencao-edit')">&times;</button>
                </div>
                <div class="modal-corpo">
                    <form id="formManutencaoEdit" class="form-grid">
                        <div class="form-grupo">
                            <label>Veículo</label>
                            <select id="mVeiculo" disabled>
                                ${veiculos.map(v => `<option value="${v.id}" ${manutencao.veiculoId == v.id ? 'selected' : ''}>${v.placa} - ${v.modelo || ''}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Status</label>
                            <select id="mStatus">
                                <option value="Pendente" ${manutencao.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                                <option value="Em Andamento" ${manutencao.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                                <option value="Concluída" ${manutencao.status === 'Concluída' ? 'selected' : ''}>Concluída</option>
                                <option value="Cancelada" ${manutencao.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Data Prevista</label>
                            <input type="date" id="mData" value="${manutencao.dataPrevista || ''}">
                        </div>
                        <div class="form-grupo">
                            <label>Custo Real (R$)</label>
                            <input type="number" id="mCusto" min="0" step="0.01" value="${manutencao.custo || ''}">
                        </div>
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label>Serviço / Descrição</label>
                            <input type="text" id="mServico" value="${manutencao.servico || ''}">
                        </div>
                    </form>
                </div>
                <div class="modal-rodape">
                    <button type="button" class="btn btn-secundario" onclick="fecharModal('modal-manutencao-edit')">Cancelar</button>
                    <button type="button" class="btn btn-primario" id="btnSalvarManutencaoEdit">💾 Salvar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('btnSalvarManutencaoEdit').addEventListener('click', () => {
            try {
                manutencao.status = document.getElementById('mStatus').value;
                manutencao.dataPrevista = document.getElementById('mData').value;
                manutencao.custo = parseFloat(document.getElementById('mCusto').value) || 0;
                manutencao.servico = document.getElementById('mServico').value;
                
                if (typeof salvarDados === 'function') salvarDados();
                window.BD = BD;
                
                fecharModal('modal-manutencao-edit');
                carregarTabelaManutencao();
                
                if (typeof mostrarToast === 'function') mostrarToast('Manutenção atualizada!', 'sucesso');
            } catch (e) {
                console.error('❌ Erro ao salvar edição:', e);
            }
        });
        
    } catch (e) {
        console.error('❌ Erro ao abrir edição de manutenção:', e);
    }
}

function salvarManutencaoForm(tipo) {
    try {
        const veiculoId = document.getElementById('mVeiculo')?.value;
        const servico = document.getElementById('mServico')?.value.trim();
        
        if (!veiculoId || !servico) {
            if (typeof mostrarToast === 'function') mostrarToast('Preencha os campos obrigatórios!', 'aviso');
            else alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        const dados = {
            veiculoId: parseInt(veiculoId),
            tipo: tipo,
            dataPrevista: document.getElementById('mData').value,
            servico: servico,
            kmPrevisto: parseFloat(document.getElementById('mKm')?.value) || null,
            custo: parseFloat(document.getElementById('mCusto')?.value) || 0,
            status: 'Pendente',
            criadoPor: window.usuarioAtual?.nome || 'Sistema',
            dataCriacao: new Date().toISOString()
        };
        
        if (typeof salvarManutencao === 'function') {
            salvarManutencao(dados);
        } else if (typeof BD !== 'undefined') {
            if (!BD.manutencoes) BD.manutencoes = [];
            dados.id = BD.manutencoes.length > 0 ? Math.max(...BD.manutencoes.map(m => m.id || 0)) + 1 : 1;
            BD.manutencoes.push(dados);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        fecharModal('modal-manutencao');
        carregarTabelaManutencao();
        
        if (typeof mostrarToast === 'function') mostrarToast('Manutenção registrada!', 'sucesso');
        else alert('✅ Manutenção registrada!');
        
    } catch (e) {
        console.error('❌ Erro ao salvar manutenção:', e);
    }
}

function concluirManutencao(id) {
    try {
        if (!confirm('Marcar esta manutenção como CONCLUÍDA?')) return;
        
        if (typeof BD !== 'undefined' && BD.manutencoes) {
            const m = BD.manutencoes.find(m => m.id === id);
            if (m) {
                m.status = 'Concluída';
                m.dataConclusao = new Date().toISOString().split('T')[0];
                if (typeof salvarDados === 'function') salvarDados();
                window.BD = BD;
            }
        }
        
        carregarTabelaManutencao();
        if (typeof mostrarToast === 'function') mostrarToast('Manutenção concluída!', 'sucesso');
        
    } catch (e) {
        console.error('❌ Erro ao concluir manutenção:', e);
    }
}

function excluirManutencao(id) {
    try {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        
        if (typeof excluirManutencaoBD === 'function') {
            excluirManutencaoBD(id);
        } else if (typeof BD !== 'undefined' && BD.manutencoes) {
            BD.manutencoes = BD.manutencoes.filter(m => m.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarTabelaManutencao();
        if (typeof mostrarToast === 'function') mostrarToast('Excluído!', 'sucesso');
        
    } catch (e) {
        console.error('❌ Erro ao excluir:', e);
    }
}

// Expõe funções globalmente
window.abrirModalManutencao = abrirModalManutencao;
window.abrirModalManutencaoEditar = abrirModalManutencaoEditar;
window.concluirManutencao = concluirManutencao;
window.excluirManutencao = excluirManutencao;
window.carregarTabelaManutencao = carregarTabelaManutencao;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    const filtro = document.getElementById('filtroVeiculoManutencao');
    if (filtro) filtro.addEventListener('change', carregarTabelaManutencao);
    console.log('✅ js/manutencao.js inicializado');
});