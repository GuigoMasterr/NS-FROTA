// ==================================================
// 🔔 CHAMADOS E OCORRÊNCIAS - VERSÃO CORRIGIDA
// ==================================================

function carregarTabelaChamados() {
    try {
        console.log('🔔 Carregando chamados...');
        
        const tabela = document.getElementById('tabelaChamados');
        if (!tabela) return;
        
        let chamados = (typeof BD !== 'undefined' && BD.chamados) ? [...BD.chamados] : [];
        
        // Ordena por data (mais recentes primeiro)
        chamados.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
        
        if (chamados.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6" class="estado-vazio">Nenhum chamado registrado</td></tr>';
            return;
        }
        
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        const getPlaca = (id) => {
            const v = veiculos.find(v => String(v.id) === String(id));
            return v ? v.placa : '-';
        };
        
        const badgeClass = {
            'Aberto': 'badge-danger',
            'Em Andamento': 'badge-warning',
            'Resolvido': 'badge-success',
            'Fechado': 'badge-secondary'
        };
        
        tabela.innerHTML = chamados.map(c => `
            <tr>
                <td>${c.data ? new Date(c.data).toLocaleString('pt-BR') : '-'}</td>
                <td><strong>${getPlaca(c.veiculoId)}</strong></td>
                <td>${c.tipo || '-'}</td>
                <td>${c.descricao || '-'}</td>
                <td><span class="badge ${badgeClass[c.status] || 'badge-secondary'}">${c.status || 'Aberto'}</span></td>
                <td>
                    ${c.status !== 'Resolvido' && c.status !== 'Fechado' ? `
                    <button class="btn-mini" onclick="resolverChamado(${c.id})" title="Resolver" style="color:#10b981;">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    ` : ''}
                    <button class="btn-mini" onclick="excluirChamado(${c.id})" title="Excluir" style="color:#dc2626;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log(`✅ ${chamados.length} chamado(s) carregado(s)`);
        
    } catch (e) {
        console.error('❌ Erro ao carregar chamados:', e);
    }
}

function abrirModalChamado() {
    try {
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        
        if (veiculos.length === 0) {
            alert('⚠️ Cadastre um veículo primeiro!');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay aberto';
        modal.id = 'modal-chamado';
        
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 500px;">
                <div class="modal-cabecalho">
                    <h3 class="modal-titulo">🔔 Novo Chamado</h3>
                    <button type="button" class="modal-fechar" onclick="fecharModal('modal-chamado')">&times;</button>
                </div>
                <div class="modal-corpo">
                    <form id="formChamado" class="form-grid">
                        <div class="form-grupo">
                            <label>Veículo <span class="obrigatorio">*</span></label>
                            <select id="cVeiculo" required>
                                <option value="">Selecione...</option>
                                ${veiculos.map(v => `<option value="${v.id}">${v.placa} - ${v.modelo || ''}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Tipo <span class="obrigatorio">*</span></label>
                            <select id="cTipo" required>
                                <option value="">Selecione...</option>
                                <option value="Problema Mecânico">🔧 Problema Mecânico</option>
                                <option value="Acidente">⚠️ Acidente</option>
                                <option value="Multa">📋 Multa</option>
                                <option value="Documentação">📄 Documentação</option>
                                <option value="Outro">❓ Outro</option>
                            </select>
                        </div>
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label>Descrição <span class="obrigatorio">*</span></label>
                            <textarea id="cDesc" required rows="3" placeholder="Descreva o problema..." style="width:100%;padding:0.55rem 0.75rem;border:1px solid #d1d5db;border-radius:8px;font-family:inherit;"></textarea>
                        </div>
                        <div class="form-grupo">
                            <label>KM Atual</label>
                            <input type="number" id="cKm" min="0" placeholder="Opcional">
                        </div>
                        <div class="form-grupo">
                            <label>Responsável</label>
                            <input type="text" id="cResp" placeholder="Quem está reportando?">
                        </div>
                    </form>
                </div>
                <div class="modal-rodape">
                    <button type="button" class="btn btn-secundario" onclick="fecharModal('modal-chamado')">Cancelar</button>
                    <button type="button" class="btn btn-primario" id="btnSalvarChamado">📤 Registrar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('btnSalvarChamado').addEventListener('click', salvarChamadoForm);
        document.getElementById('formChamado').addEventListener('submit', (e) => {
            e.preventDefault();
            salvarChamadoForm();
        });
        
    } catch (e) {
        console.error('❌ Erro ao abrir modal de chamado:', e);
    }
}

function salvarChamadoForm() {
    try {
        const veiculoId = document.getElementById('cVeiculo')?.value;
        const tipo = document.getElementById('cTipo')?.value;
        const descricao = document.getElementById('cDesc')?.value.trim();
        
        if (!veiculoId || !tipo || !descricao) {
            alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        const dados = {
            veiculoId: parseInt(veiculoId),
            tipo: tipo,
            descricao: descricao,
            km: parseFloat(document.getElementById('cKm')?.value) || null,
            responsavel: document.getElementById('cResp')?.value.trim() || window.usuarioAtual?.nome || '',
            status: 'Aberto',
            data: new Date().toISOString()
        };
        
        if (typeof salvarChamado === 'function') {
            salvarChamado(dados);
        } else if (typeof BD !== 'undefined') {
            if (!BD.chamados) BD.chamados = [];
            dados.id = BD.chamados.length > 0 ? Math.max(...BD.chamados.map(c => c.id || 0)) + 1 : 1;
            BD.chamados.push(dados);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        fecharModal('modal-chamado');
        carregarTabelaChamados();
        
        if (typeof mostrarToast === 'function') mostrarToast('Chamado registrado!', 'sucesso');
        else alert('✅ Chamado registrado!');
        
    } catch (e) {
        console.error('❌ Erro ao salvar chamado:', e);
    }
}

function resolverChamado(id) {
    try {
        if (!confirm('Marcar este chamado como RESOLVIDO?')) return;
        
        if (typeof BD !== 'undefined' && BD.chamados) {
            const c = BD.chamados.find(c => c.id === id);
            if (c) {
                c.status = 'Resolvido';
                c.dataResolucao = new Date().toISOString();
                if (typeof salvarDados === 'function') salvarDados();
                window.BD = BD;
            }
        }
        
        carregarTabelaChamados();
        if (typeof mostrarToast === 'function') mostrarToast('Chamado resolvido!', 'sucesso');
        
    } catch (e) {
        console.error('❌ Erro ao resolver chamado:', e);
    }
}

function excluirChamado(id) {
    try {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        
        if (typeof excluirChamadoBD === 'function') {
            excluirChamadoBD(id);
        } else if (typeof BD !== 'undefined' && BD.chamados) {
            BD.chamados = BD.chamados.filter(c => c.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarTabelaChamados();
        if (typeof mostrarToast === 'function') mostrarToast('Excluído!', 'sucesso');
        
    } catch (e) {
        console.error('❌ Erro ao excluir chamado:', e);
    }
}

// Expõe funções
window.abrirModalChamado = abrirModalChamado;
window.resolverChamado = resolverChamado;
window.excluirChamado = excluirChamado;
window.carregarTabelaChamados = carregarTabelaChamados;

console.log('✅ js/chamados.js inicializado');