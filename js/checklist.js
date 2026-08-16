// ==================================================
// ✅ CHECK-LIST DE INSPEÇÃO - VERSÃO CORRIGIDA
// ==================================================

function carregarTabelaChecklist() {
    try {
        console.log('✅ Carregando check-lists...');
        
        const tabela = document.getElementById('tabelaChecklist');
        if (!tabela) return;
        
        const filtroVeiculo = document.getElementById('filtroChecklistVeiculo')?.value || 'todos';
        
        let checklists = (typeof BD !== 'undefined' && BD.checklists) ? [...BD.checklists] : [];
        
        if (filtroVeiculo !== 'todos') {
            checklists = checklists.filter(c => String(c.veiculoId) === String(filtroVeiculo));
        }
        
        checklists.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
        
        if (checklists.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6" class="estado-vazio">Nenhum check-list registrado</td></tr>';
            return;
        }
        
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        const getPlaca = (id) => {
            const v = veiculos.find(v => String(v.id) === String(id));
            return v ? v.placa : '-';
        };
        
        const badgeClass = {
            'Aprovado': 'badge-success',
            'Pendente': 'badge-warning',
            'Reprovado': 'badge-danger'
        };
        
        tabela.innerHTML = checklists.map(c => `
            <tr>
                <td>${c.data ? new Date(c.data).toLocaleDateString('pt-BR') : '-'}</td>
                <td><strong>${getPlaca(c.veiculoId)}</strong></td>
                <td>${c.motorista || '-'}</td>
                <td>${c.km ? Number(c.km).toLocaleString('pt-BR') + ' km' : '-'}</td>
                <td><span class="badge ${badgeClass[c.status] || 'badge-secondary'}">${c.status || 'Pendente'}</span></td>
                <td>
                    <button class="btn-mini" onclick="verDetalhesChecklist(${c.id})" title="Ver detalhes">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn-mini" onclick="excluirChecklist(${c.id})" title="Excluir" style="color:#dc2626;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log(`✅ ${checklists.length} check-list(s) carregado(s)`);
        
    } catch (e) {
        console.error('❌ Erro ao carregar check-lists:', e);
    }
}

function abrirModalChecklist() {
    try {
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        
        if (veiculos.length === 0) {
            alert('⚠️ Cadastre um veículo primeiro!');
            return;
        }
        
        const itensChecklist = [
            'Pneus (calibragem e estado)',
            'Freios',
            'Óleo do motor',
            'Água do radiador',
            'Luzes (faróis, setas, freio)',
            'Limpadores de para-brisa',
            'Bateria',
            'Cintos de segurança',
            'Documentação do veículo',
            'Extintor de incêndio',
            'Triângulo de sinalização',
            'Limpeza geral'
        ];
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay aberto';
        modal.id = 'modal-checklist';
        
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 600px; max-height: 85vh;">
                <div class="modal-cabecalho">
                    <h3 class="modal-titulo">✅ Novo Check-list</h3>
                    <button type="button" class="modal-fechar" onclick="fecharModal('modal-checklist')">&times;</button>
                </div>
                <div class="modal-corpo" style="overflow-y: auto;">
                    <form id="formChecklist">
                        <div class="form-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 1rem;">
                            <div class="form-grupo">
                                <label>Veículo <span class="obrigatorio">*</span></label>
                                <select id="clVeiculo" required>
                                    <option value="">Selecione...</option>
                                    ${veiculos.map(v => `<option value="${v.id}">${v.placa} - ${v.modelo || ''}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-grupo">
                                <label>Motorista</label>
                                <input type="text" id="clMotorista" placeholder="Nome do motorista">
                            </div>
                            <div class="form-grupo">
                                <label>KM Atual</label>
                                <input type="number" id="clKm" min="0" placeholder="Quilometragem">
                            </div>
                            <div class="form-grupo">
                                <label>Data</label>
                                <input type="date" id="clData" value="${new Date().toISOString().split('T')[0]}">
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 1rem;">
                            <strong style="color:#0f172a; display:block; margin-bottom: 0.5rem;">📋 Itens do Check-list</strong>
                            <div style="display: grid; gap: 0.5rem;">
                                ${itensChecklist.map((item, i) => `
                                    <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8fafc; border-radius: 6px; cursor: pointer;">
                                        <input type="checkbox" class="cl-item" data-item="${item}" style="width: 18px; height: 18px; cursor: pointer;">
                                        <span style="font-size: 0.875rem; color: #334155;">${item}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="form-grupo">
                            <label>Observações</label>
                            <textarea id="clObs" rows="2" placeholder="Algum problema encontrado?" style="width:100%;padding:0.55rem 0.75rem;border:1px solid #d1d5db;border-radius:8px;font-family:inherit;"></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-rodape">
                    <button type="button" class="btn btn-secundario" onclick="fecharModal('modal-checklist')">Cancelar</button>
                    <button type="button" class="btn btn-primario" id="btnSalvarChecklist">💾 Salvar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('btnSalvarChecklist').addEventListener('click', salvarChecklistForm);
        
    } catch (e) {
        console.error('❌ Erro ao abrir modal de check-list:', e);
    }
}

function salvarChecklistForm() {
    try {
        const veiculoId = document.getElementById('clVeiculo')?.value;
        
        if (!veiculoId) {
            alert('⚠️ Selecione um veículo!');
            return;
        }
        
        const itensMarcados = Array.from(document.querySelectorAll('.cl-item:checked')).map(cb => cb.dataset.item);
        const totalItens = document.querySelectorAll('.cl-item').length;
        const aprovados = itensMarcados.length;
        
        let status = 'Aprovado';
        if (aprovados < totalItens * 0.5) status = 'Reprovado';
        else if (aprovados < totalItens) status = 'Pendente';
        
        const dados = {
            veiculoId: parseInt(veiculoId),
            motorista: document.getElementById('clMotorista')?.value.trim() || '',
            km: parseFloat(document.getElementById('clKm')?.value) || 0,
            data: document.getElementById('clData')?.value || new Date().toISOString().split('T')[0],
            itens: itensMarcados,
            totalItens: totalItens,
            aprovados: aprovados,
            status: status,
            observacoes: document.getElementById('clObs')?.value.trim() || '',
            criadoPor: window.usuarioAtual?.nome || 'Sistema'
        };
        
        if (typeof salvarChecklist === 'function') {
            salvarChecklist(dados);
        } else if (typeof BD !== 'undefined') {
            if (!BD.checklists) BD.checklists = [];
            dados.id = BD.checklists.length > 0 ? Math.max(...BD.checklists.map(c => c.id || 0)) + 1 : 1;
            BD.checklists.push(dados);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        fecharModal('modal-checklist');
        carregarTabelaChecklist();
        
        const msg = status === 'Aprovado' ? '✅ Check-list Aprovado!' : 
                    status === 'Pendente' ? '⚠️ Check-list com itens pendentes' : 
                    '❌ Check-list Reprovado - Atenção!';
                    
        if (typeof mostrarToast === 'function') {
            mostrarToast(msg, status === 'Aprovado' ? 'sucesso' : status === 'Pendente' ? 'aviso' : 'erro');
        } else {
            alert(msg);
        }
        
    } catch (e) {
        console.error('❌ Erro ao salvar check-list:', e);
    }
}

function verDetalhesChecklist(id) {
    try {
        const cl = (typeof BD !== 'undefined' && BD.checklists) 
            ? BD.checklists.find(c => c.id === id) 
            : null;
        
        if (!cl) return;
        
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        const veiculo = veiculos.find(v => String(v.id) === String(cl.veiculoId));
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay aberto';
        modal.id = 'modal-checklist-detalhes';
        
        const badgeClass = {
            'Aprovado': 'badge-success',
            'Pendente': 'badge-warning',
            'Reprovado': 'badge-danger'
        };
        
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 500px;">
                <div class="modal-cabecalho">
                    <h3 class="modal-titulo">📋 Detalhes do Check-list</h3>
                    <button type="button" class="modal-fechar" onclick="fecharModal('modal-checklist-detalhes')">&times;</button>
                </div>
                <div class="modal-corpo">
                    <div style="display: grid; gap: 0.75rem; margin-bottom: 1rem;">
                        <div><strong>Veículo:</strong> ${veiculo ? veiculo.placa : '-'}</div>
                        <div><strong>Motorista:</strong> ${cl.motorista || '-'}</div>
                        <div><strong>Data:</strong> ${cl.data || '-'}</div>
                        <div><strong>KM:</strong> ${cl.km ? Number(cl.km).toLocaleString('pt-BR') + ' km' : '-'}</div>
                        <div><strong>Status:</strong> <span class="badge ${badgeClass[cl.status] || ''}">${cl.status}</span></div>
                        <div><strong>Aproveitamento:</strong> ${cl.aprovados || 0}/${cl.totalItens || 0} itens</div>
                    </div>
                    ${cl.itens && cl.itens.length > 0 ? `
                    <div style="background: #f0fdf4; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;">
                        <strong style="color:#166534; display:block; margin-bottom: 0.25rem;">✅ Itens verificados:</strong>
                        <ul style="margin: 0; padding-left: 1.25rem; color: #15803d; font-size: 0.875rem;">
                            ${cl.itens.map(i => `<li>${i}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    ${cl.observacoes ? `
                    <div><strong>Observações:</strong><br><span style="color:#64748b;">${cl.observacoes}</span></div>
                    ` : ''}
                </div>
                <div class="modal-rodape">
                    <button type="button" class="btn btn-primario" onclick="fecharModal('modal-checklist-detalhes')">Fechar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (e) {
        console.error('❌ Erro ao ver detalhes:', e);
    }
}

function excluirChecklist(id) {
    try {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        
        if (typeof BD !== 'undefined' && BD.checklists) {
            BD.checklists = BD.checklists.filter(c => c.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarTabelaChecklist();
        if (typeof mostrarToast === 'function') mostrarToast('Excluído!', 'sucesso');
        
    } catch (e) {
        console.error('❌ Erro ao excluir:', e);
    }
}

function verificarAlertasCintas() {
    try {
        // Verifica veículos que precisam de cintas e tem check-list pendente/reprovado
        if (typeof BD === 'undefined' || !BD.veiculos || !BD.checklists) return;
        
        const categoriasEspeciais = ['caminhao-munck', 'guindaste', 'carreta'];
        const veiculosCintas = BD.veiculos.filter(v => 
            categoriasEspeciais.includes(v.categoria) || v.precisaCintas
        );
        
        const painel = document.getElementById('painelAlertas');
        if (!painel) return;
        
        if (veiculosCintas.length === 0) {
            painel.innerHTML = '<div class="alerta alerta-info"><i class="fa-solid fa-circle-check"></i> Nenhum veículo especial requer verificação de cintas.</div>';
            return;
        }
        
        // Verifica o último check-list de cada veículo
        const alertas = [];
        veiculosCintas.forEach(v => {
            const ultimoCL = BD.checklists
                .filter(c => String(c.veiculoId) === String(v.id))
                .sort((a, b) => new Date(b.data) - new Date(a.data))[0];
            
            if (!ultimoCL || ultimoCL.status !== 'Aprovado') {
                alertas.push(`<div class="alerta alerta-aviso">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <strong>${v.placa}</strong> - ${ultimoCL ? 'Último check-list: ' + ultimoCL.status : 'Sem check-list registrado'}
                </div>`);
            }
        });
        
        if (alertas.length === 0) {
            painel.innerHTML = '<div class="alerta alerta-sucesso"><i class="fa-solid fa-circle-check"></i> Todos os veículos especiais estão com check-list em dia.</div>';
        } else {
            painel.innerHTML = alertas.join('');
        }
        
    } catch (e) {
        console.error('❌ Erro ao verificar alertas de cintas:', e);
    }
}

// Expõe funções
window.abrirModalChecklist = abrirModalChecklist;
window.verDetalhesChecklist = verDetalhesChecklist;
window.excluirChecklist = excluirChecklist;
window.carregarTabelaChecklist = carregarTabelaChecklist;
window.verificarAlertasCintas = verificarAlertasCintas;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    const filtro = document.getElementById('filtroChecklistVeiculo');
    if (filtro) filtro.addEventListener('change', carregarTabelaChecklist);
    console.log('✅ js/checklist.js inicializado');
});