// ==================================================
// 📍 ALOCAÇÕES DE VEÍCULOS - VERSÃO CORRIGIDA
// ==================================================

function carregarTabelaAlocacoes() {
    try {
        console.log('📍 Carregando alocações...');
        
        const tabela = document.getElementById('tabelaAlocacoes');
        if (!tabela) return;
        
        let alocacoes = (typeof BD !== 'undefined' && BD.alocacoes) ? [...BD.alocacoes] : [];
        
        alocacoes.sort((a, b) => new Date(b.dataSaida || b.dataInicio || 0) - new Date(a.dataSaida || a.dataInicio || 0));
        
        if (alocacoes.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6" class="estado-vazio">Nenhuma alocação registrada</td></tr>';
            return;
        }
        
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        const getPlaca = (id) => {
            const v = veiculos.find(v => String(v.id) === String(id));
            return v ? v.placa : '-';
        };
        
        tabela.innerHTML = alocacoes.map(a => `
            <tr>
                <td><strong>${getPlaca(a.veiculoId)}</strong></td>
                <td>${a.origem || '-'}</td>
                <td>${a.destino || '-'}</td>
                <td>${a.dataInicio || '-'}</td>
                <td>${a.dataFim || a.dataSaida || '<span class="badge badge-info">Em andamento</span>'}</td>
                <td>
                    ${!a.dataFim && !a.dataSaida ? `
                    <button class="btn-mini" onclick="encerrarAlocacao(${a.id})" title="Encerrar" style="color:#10b981;">
                        <i class="fa-solid fa-flag-checkered"></i>
                    </button>
                    ` : ''}
                    <button class="btn-mini" onclick="excluirAlocacao(${a.id})" title="Excluir" style="color:#dc2626;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log(`✅ ${alocacoes.length} alocação(ões) carregada(s)`);
        
    } catch (e) {
        console.error('❌ Erro ao carregar alocações:', e);
    }
}

function abrirModalAlocacao() {
    try {
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) 
            ? BD.veiculos.filter(v => v.status !== 'manutencao' && v.status !== 'inativo') 
            : [];
        
        if (veiculos.length === 0) {
            alert('⚠️ Nenhum veículo disponível para alocação!');
            return;
        }
        
        const locais = (typeof BD !== 'undefined' && BD.locais) ? BD.locais : [];
        const opcoesLocais = locais.length > 0 
            ? locais.map(l => `<option value="${l.nome}">${l.nome}</option>`).join('')
            : '<option value="Pátio Metálica">Pátio Metálica</option><option value="Obra">Obra</option>';
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay aberto';
        modal.id = 'modal-alocacao';
        
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 500px;">
                <div class="modal-cabecalho">
                    <h3 class="modal-titulo">📍 Nova Alocação</h3>
                    <button type="button" class="modal-fechar" onclick="fecharModal('modal-alocacao')">&times;</button>
                </div>
                <div class="modal-corpo">
                    <form id="formAlocacao" class="form-grid">
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label>Veículo <span class="obrigatorio">*</span></label>
                            <select id="alVeiculo" required>
                                <option value="">Selecione...</option>
                                ${veiculos.map(v => `<option value="${v.id}">${v.placa} - ${v.modelo || ''} (${v.status || 'disponivel'})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Origem <span class="obrigatorio">*</span></label>
                            <select id="alOrigem" required>
                                <option value="">Selecione...</option>
                                ${opcoesLocais}
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Destino <span class="obrigatorio">*</span></label>
                            <select id="alDestino" required>
                                <option value="">Selecione...</option>
                                ${opcoesLocais}
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Data Início <span class="obrigatorio">*</span></label>
                            <input type="date" id="alDataInicio" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-grupo">
                            <label>KM Inicial</label>
                            <input type="number" id="alKm" min="0" placeholder="Quilometragem de saída">
                        </div>
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label>Motorista / Responsável</label>
                            <input type="text" id="alMotorista" placeholder="Quem está utilizando?">
                        </div>
                    </form>
                </div>
                <div class="modal-rodape">
                    <button type="button" class="btn btn-secundario" onclick="fecharModal('modal-alocacao')">Cancelar</button>
                    <button type="button" class="btn btn-primario" id="btnSalvarAlocacao">📍 Alocar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('btnSalvarAlocacao').addEventListener('click', salvarAlocacaoForm);
        document.getElementById('formAlocacao').addEventListener('submit', (e) => {
            e.preventDefault();
            salvarAlocacaoForm();
        });
        
    } catch (e) {
        console.error('❌ Erro ao abrir modal de alocação:', e);
    }
}

function salvarAlocacaoForm() {
    try {
        const veiculoId = document.getElementById('alVeiculo')?.value;
        const origem = document.getElementById('alOrigem')?.value;
        const destino = document.getElementById('alDestino')?.value;
        const dataInicio = document.getElementById('alDataInicio')?.value;
        
        if (!veiculoId || !origem || !destino || !dataInicio) {
            alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        const dados = {
            veiculoId: parseInt(veiculoId),
            origem: origem,
            destino: destino,
            dataInicio: dataInicio,
            kmInicial: parseFloat(document.getElementById('alKm')?.value) || 0,
            motorista: document.getElementById('alMotorista')?.value.trim() || '',
            criadoPor: window.usuarioAtual?.nome || 'Sistema'
        };
        
        if (typeof salvarAlocacao === 'function') {
            salvarAlocacao(dados);
        } else if (typeof BD !== 'undefined') {
            if (!BD.alocacoes) BD.alocacoes = [];
            dados.id = BD.alocacoes.length > 0 ? Math.max(...BD.alocacoes.map(a => a.id || 0)) + 1 : 1;
            BD.alocacoes.push(dados);
            
            // Atualiza status do veículo para 'alocado'
            if (BD.veiculos) {
                const v = BD.veiculos.find(v => v.id === dados.veiculoId);
                if (v && v.status === 'disponivel') {
                    v.status = 'alocado';
                    v.obra_atual = destino;
                }
            }
            
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        fecharModal('modal-alocacao');
        carregarTabelaAlocacoes();
        
        if (typeof mostrarToast === 'function') mostrarToast('Veículo alocado!', 'sucesso');
        else alert('✅ Veículo alocado com sucesso!');
        
    } catch (e) {
        console.error('❌ Erro ao salvar alocação:', e);
    }
}

function encerrarAlocacao(id) {
    try {
        if (!confirm('Deseja encerrar esta alocação?')) return;
        
        if (typeof BD !== 'undefined' && BD.alocacoes) {
            const a = BD.alocacoes.find(a => a.id === id);
            if (a) {
                a.dataFim = new Date().toISOString().split('T')[0];
                
                // Atualiza status do veículo de volta para 'disponivel'
                if (BD.veiculos) {
                    const v = BD.veiculos.find(v => v.id === a.veiculoId);
                    if (v && v.status === 'alocado') {
                        v.status = 'disponivel';
                    }
                }
                
                if (typeof salvarDados === 'function') salvarDados();
                window.BD = BD;
            }
        }
        
        carregarTabelaAlocacoes();
        if (typeof mostrarToast === 'function') mostrarToast('Alocação encerrada!', 'sucesso');
        
    } catch (e) {
        console.error('❌ Erro ao encerrar alocação:', e);
    }
}

function excluirAlocacao(id) {
    try {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        
        if (typeof excluirAlocacaoBD === 'function') {
            excluirAlocacaoBD(id);
        } else if (typeof BD !== 'undefined' && BD.alocacoes) {
            BD.alocacoes = BD.alocacoes.filter(a => a.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarTabelaAlocacoes();
        if (typeof mostrarToast === 'function') mostrarToast('Excluído!', 'sucesso');
        
    } catch (e) {
        console.error('❌ Erro ao excluir alocação:', e);
    }
}

// Expõe funções
window.abrirModalAlocacao = abrirModalAlocacao;
window.encerrarAlocacao = encerrarAlocacao;
window.excluirAlocacao = excluirAlocacao;
window.carregarTabelaAlocacoes = carregarTabelaAlocacoes;

console.log('✅ js/alocacoes.js inicializado');