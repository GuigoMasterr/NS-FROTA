// ==================================================
// 💸 DESPESAS DE VIAGEM - VERSÃO CORRIGIDA
// ==================================================

function carregarListaDespesas() {
    try {
        console.log('💸 Carregando despesas de viagem...');
        
        const container = document.getElementById('listaDespesasViagem');
        if (!container) return;
        
        let despesas = (typeof BD !== 'undefined' && BD.despesasViagem) ? [...BD.despesasViagem] : [];
        
        despesas.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
        
        if (despesas.length === 0) {
            container.innerHTML = '<div class="estado-vazio" style="padding: 2rem; text-align: center;">Nenhuma despesa de viagem registrada</div>';
            return;
        }
        
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        const getPlaca = (id) => {
            const v = veiculos.find(v => String(v.id) === String(id));
            return v ? v.placa : '-';
        };
        
        const statusClass = {
            'pendente': 'pendente',
            'aprovado': 'aprovado',
            'rejeitado': 'rejeitado'
        };
        
        container.innerHTML = despesas.map(d => `
            <div class="cartao-despesa ${statusClass[d.status] || 'pendente'}">
                <div class="despesa-cabecalho">
                    <div>
                        <div class="despesa-motorista">${d.motorista || 'Motorista não informado'}</div>
                        <div class="despesa-info">
                            ${getPlaca(d.veiculoId)} • ${d.data || '-'}
                        </div>
                    </div>
                    <div class="despesa-valor-total">
                        R$ ${Number(d.valorTotal || d.valor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </div>
                </div>
                ${d.itens && d.itens.length > 0 ? `
                <div class="despesa-itens">
                    ${d.itens.map((item, i) => `
                        <div class="item-linha" style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.875rem;">
                            <span class="item-tipo" style="color:#475569;">${item.tipo || 'Item ' + (i+1)}</span>
                            <span class="item-valor" style="font-weight: 500;">R$ ${Number(item.valor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
                <div class="despesa-acoes">
                    ${d.status === 'pendente' ? `
                    <button class="btn-mini btn-aprovar" onclick="aprovarDespesa(${d.id})">
                        <i class="fa-solid fa-check"></i> Aprovar
                    </button>
                    <button class="btn-mini btn-rejeitar" onclick="rejeitarDespesa(${d.id})">
                        <i class="fa-solid fa-times"></i> Rejeitar
                    </button>
                    ` : `
                    <span class="status-badge status-${d.status || 'pendente'}">
                        ${d.status === 'aprovado' ? '✅ Aprovado' : d.status === 'rejeitado' ? '❌ Rejeitado' : '⏳ Pendente'}
                    </span>
                    `}
                    <button class="btn-mini" onclick="excluirDespesaViagem(${d.id})" title="Excluir" style="color:#dc2626; margin-left: auto;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        console.log(`✅ ${despesas.length} despesa(s) carregada(s)`);
        
    } catch (e) {
        console.error('❌ Erro ao carregar despesas:', e);
    }
}

function abrirModalDespesa() {
    try {
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        
        if (veiculos.length === 0) {
            alert('⚠️ Cadastre um veículo primeiro!');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay aberto';
        modal.id = 'modal-despesa';
        
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 550px; max-height: 85vh;">
                <div class="modal-cabecalho">
                    <h3 class="modal-titulo">💸 Nova Despesa de Viagem</h3>
                    <button type="button" class="modal-fechar" onclick="fecharModal('modal-despesa')">&times;</button>
                </div>
                <div class="modal-corpo" style="overflow-y: auto;">
                    <form id="formDespesa" class="form-grid">
                        <div class="form-grupo">
                            <label>Veículo <span class="obrigatorio">*</span></label>
                            <select id="dvVeiculo" required>
                                <option value="">Selecione...</option>
                                ${veiculos.map(v => `<option value="${v.id}">${v.placa} - ${v.modelo || ''}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Data <span class="obrigatorio">*</span></label>
                            <input type="date" id="dvData" required value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label>Motorista <span class="obrigatorio">*</span></label>
                            <input type="text" id="dvMotorista" required placeholder="Nome do motorista">
                        </div>
                    </form>
                    
                    <div style="margin-top: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <strong style="color:#0f172a;">📋 Itens da Despesa</strong>
                            <button type="button" class="btn btn-secundario btn-sm" id="btnAddItem" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;">
                                <i class="fa-solid fa-plus"></i> Adicionar Item
                            </button>
                        </div>
                        <div id="itensDespesa" style="display: grid; gap: 0.5rem; margin-bottom: 1rem;">
                            <!-- Itens serão adicionados aqui -->
                        </div>
                    </div>
                </div>
                <div class="modal-rodape">
                    <button type="button" class="btn btn-secundario" onclick="fecharModal('modal-despesa')">Cancelar</button>
                    <button type="button" class="btn btn-primario" id="btnSalvarDespesa">💾 Registrar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Adiciona primeiro item automaticamente
        adicionarItemDespesa();
        
        document.getElementById('btnAddItem').addEventListener('click', adicionarItemDespesa);
        document.getElementById('btnSalvarDespesa').addEventListener('click', salvarDespesaForm);
        
    } catch (e) {
        console.error('❌ Erro ao abrir modal de despesa:', e);
    }
}

function adicionarItemDespesa() {
    try {
        const container = document.getElementById('itensDespesa');
        if (!container) return;
        
        const tiposItens = ['Alimentação', 'Hospedagem', 'Combustível', 'Pedágio', 'Manutenção', 'Outros'];
        
        const div = document.createElement('div');
        div.className = 'item-linha';
        div.style.cssText = 'display: flex; gap: 0.5rem; align-items: center;';
        div.innerHTML = `
            <select class="item-tipo-select" style="flex: 1; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;">
                ${tiposItens.map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
            <input type="number" class="item-valor-input" placeholder="R$ 0,00" min="0" step="0.01" style="width: 140px; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px;">
            <button type="button" class="btn-remover-item" onclick="this.parentElement.remove()" style="background:#fee2e2;color:#dc2626;border:none;border-radius:6px;width:36px;height:36px;cursor:pointer;font-weight:bold;">×</button>
        `;
        
        container.appendChild(div);
        
    } catch (e) {
        console.error('❌ Erro ao adicionar item:', e);
    }
}

function salvarDespesaForm() {
    try {
        const veiculoId = document.getElementById('dvVeiculo')?.value;
        const data = document.getElementById('dvData')?.value;
        const motorista = document.getElementById('dvMotorista')?.value.trim();
        
        if (!veiculoId || !data || !motorista) {
            alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        // Coleta os itens
        const itens = [];
        let valorTotal = 0;
        
        document.querySelectorAll('#itensDespesa .item-linha').forEach(linha => {
            const tipo = linha.querySelector('.item-tipo-select')?.value;
            const valor = parseFloat(linha.querySelector('.item-valor-input')?.value) || 0;
            if (valor > 0) {
                itens.push({ tipo, valor });
                valorTotal += valor;
            }
        });
        
        if (itens.length === 0) {
            alert('⚠️ Adicione pelo menos um item com valor!');
            return;
        }
        
        const dados = {
            veiculoId: parseInt(veiculoId),
            data: data,
            motorista: motorista,
            itens: itens,
            valorTotal: valorTotal,
            status: 'pendente',
            criadoPor: window.usuarioAtual?.nome || 'Sistema'
        };
        
        if (typeof BD !== 'undefined') {
            if (!BD.despesasViagem) BD.despesasViagem = [];
            dados.id = BD.despesasViagem.length > 0 ? Math.max(...BD.despesasViagem.map(d => d.id || 0)) + 1 : 1;
            BD.despesasViagem.push(dados);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        fecharModal('modal-despesa');
        carregarListaDespesas();
        
        if (typeof mostrarToast === 'function') mostrarToast('Despesa registrada!', 'sucesso');
        else alert('✅ Despesa registrada!');
        
    } catch (e) {
        console.error('❌ Erro ao salvar despesa:', e);
    }
}

function aprovarDespesa(id) {
    try {
        if (typeof BD !== 'undefined' && BD.despesasViagem) {
            const d = BD.despesasViagem.find(d => d.id === id);
            if (d) {
                d.status = 'aprovado';
                if (typeof salvarDados === 'function') salvarDados();
                window.BD = BD;
            }
        }
        carregarListaDespesas();
        if (typeof mostrarToast === 'function') mostrarToast('Despesa aprovada!', 'sucesso');
    } catch (e) {
        console.error('❌ Erro ao aprovar:', e);
    }
}

function rejeitarDespesa(id) {
    try {
        if (typeof BD !== 'undefined' && BD.despesasViagem) {
            const d = BD.despesasViagem.find(d => d.id === id);
            if (d) {
                d.status = 'rejeitado';
                if (typeof salvarDados === 'function') salvarDados();
                window.BD = BD;
            }
        }
        carregarListaDespesas();
        if (typeof mostrarToast === 'function') mostrarToast('Despesa rejeitada', 'aviso');
    } catch (e) {
        console.error('❌ Erro ao rejeitar:', e);
    }
}

function excluirDespesaViagem(id) {
    try {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        
        if (typeof BD !== 'undefined' && BD.despesasViagem) {
            BD.despesasViagem = BD.despesasViagem.filter(d => d.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarListaDespesas();
        if (typeof mostrarToast === 'function') mostrarToast('Excluído!', 'sucesso');
    } catch (e) {
        console.error('❌ Erro ao excluir:', e);
    }
}

// Expõe funções
window.abrirModalDespesa = abrirModalDespesa;
window.adicionarItemDespesa = adicionarItemDespesa;
window.aprovarDespesa = aprovarDespesa;
window.rejeitarDespesa = rejeitarDespesa;
window.excluirDespesaViagem = excluirDespesaViagem;
window.carregarListaDespesas = carregarListaDespesas;

console.log('✅ js/despesas-viagem.js inicializado');