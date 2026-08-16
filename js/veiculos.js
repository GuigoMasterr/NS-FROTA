// ==================================================
// 🚛 GESTÃO DE VEÍCULOS - VERSÃO CORRIGIDA
// ==================================================

function carregarTabelaVeiculos() {
    try {
        console.log('📋 Carregando tabela de veículos...');
        
        const tabela = document.getElementById('tabelaVeiculos');
        if (!tabela) {
            console.warn('⚠️ Tabela de veículos não encontrada');
            return;
        }
        
        const busca = (document.getElementById('buscaVeiculos')?.value || '').toLowerCase();
        const filtroCategoria = document.getElementById('filtroVeiculoCategoria')?.value || 'todos';
        
        let veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? [...BD.veiculos] : [];
        
        // Filtros
        if (busca) {
            veiculos = veiculos.filter(v => 
                (v.placa || '').toLowerCase().includes(busca) ||
                (v.modelo || '').toLowerCase().includes(busca) ||
                (v.marca || '').toLowerCase().includes(busca) ||
                (v.obra_atual || '').toLowerCase().includes(busca) ||
                (v.responsavel || '').toLowerCase().includes(busca)
            );
        }
        
        if (filtroCategoria !== 'todos') {
            veiculos = veiculos.filter(v => v.categoria === filtroCategoria);
        }
        
        if (veiculos.length === 0) {
            tabela.innerHTML = '<tr><td colspan="9" class="estado-vazio">Nenhum veículo cadastrado</td></tr>';
            return;
        }
        
        const statusConfig = (typeof BD !== 'undefined' && BD.config && BD.config.statusVeiculos) 
            ? BD.config.statusVeiculos 
            : { disponivel: 'Disponível', alocado: 'Alocado', manutencao: 'Manutenção', inativo: 'Inativo' };
        
        const badgeClass = {
            'disponivel': 'badge-success',
            'alocado': 'badge-info',
            'manutencao': 'badge-warning',
            'inativo': 'badge-secondary'
        };
        
        tabela.innerHTML = veiculos.map(v => `
            <tr>
                <td><strong>${v.placa || '-'}</strong></td>
                <td>${v.categoria || '-'}</td>
                <td>${v.modelo || '-'}</td>
                <td>${v.km_atual ? Number(v.km_atual).toLocaleString('pt-BR') + ' km' : '-'}</td>
                <td>${v.obra_atual || '-'}</td>
                <td><span class="badge ${badgeClass[v.status] || 'badge-secondary'}">${statusConfig[v.status] || v.status || '-'}</span></td>
                <td>
                    <button class="btn-mini" onclick="abrirModalVeiculo(${v.id})" title="Editar">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    <button class="btn-mini" onclick="excluirVeiculo(${v.id})" title="Excluir" style="color:#dc2626;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log(`✅ ${veiculos.length} veículo(s) carregado(s)`);
        
    } catch (e) {
        console.error('❌ Erro ao carregar veículos:', e);
        const tabela = document.getElementById('tabelaVeiculos');
        if (tabela) {
            tabela.innerHTML = '<tr><td colspan="9" class="estado-vazio" style="color:#dc2626;">Erro ao carregar veículos</td></tr>';
        }
    }
}

function abrirModalVeiculo(id) {
    console.log('📝 Chamada abrirModalVeiculo, id:', id || 'novo');
    
    // Verificação de permissão
    if (typeof ehAdmin === 'function' && !ehAdmin()) {
        alert('⚠️ Você não tem permissão para cadastrar veículos!');
        return;
    }
    
    // Garante que BD existe
    if (typeof BD === 'undefined') {
        window.BD = { veiculos: [], locais: [], config: {} };
    }
    if (!BD.locais) BD.locais = [];
    if (!BD.config) BD.config = {};
    
    // Busca dados
    const veiculo = id && BD.veiculos ? BD.veiculos.find(v => v.id === id) : null;
    
    // Categorias com fallback garantido
    const categorias = (typeof CONFIG !== 'undefined' && CONFIG.CATEGORIAS_VEICULOS && CONFIG.CATEGORIAS_VEICULOS.length > 0) 
        ? CONFIG.CATEGORIAS_VEICULOS 
        : ['Caminhão', 'Carro Passeio', 'Utilitário', 'Máquina', 'Van', 'Ônibus', 'Moto', 'Outro'];
    
    // Status com fallback que funciona mesmo se BD.config.statusVeiculos for vazio
    let statusOptions = BD.config && BD.config.statusVeiculos && Object.keys(BD.config.statusVeiculos).length > 0
        ? BD.config.statusVeiculos
        : { disponivel: 'Disponível', alocado: 'Alocado', manutencao: 'Manutenção', inativo: 'Inativo' };
    
    const locais = BD.locais && BD.locais.length > 0 ? BD.locais : [
        { id: 'padrao', nome: 'Pátio Principal' }
    ];
    
    // Cria o modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay aberto';
    modal.id = 'modal-veiculo';
    // Força visibilidade com estilo inline (rede de segurança)
    modal.style.cssText = 'display:flex !important; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:99999; align-items:center; justify-content:center; padding:1rem;';
    
    const isEdit = !!veiculo;
    
    // Opções de status
    const statusOptionsHtml = Object.entries(statusOptions).map(([val, label]) => 
        `<option value="${val}" ${veiculo?.status === val ? 'selected' : ''}>${label}</option>`
    ).join('');
    
    // Opções de locais
    const locaisOptionsHtml = locais.map(l => 
        `<option value="${l.nome}" ${veiculo?.obra_atual === l.nome ? 'selected' : ''}>${l.nome}</option>`
    ).join('');
    
    // Opções de categorias
    const categoriasOptionsHtml = categorias.map(c => 
        `<option value="${c}" ${veiculo?.categoria === c ? 'selected' : ''}>${c}</option>`
    ).join('');
    
    modal.innerHTML = `
        <div class="modal-container" style="max-width:650px; width:100%; background:white; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,0.3); max-height:90vh; overflow-y:auto;">
            <div class="modal-cabecalho" style="display:flex; justify-content:space-between; align-items:center; padding:1.25rem 1.5rem; border-bottom:1px solid #e2e8f0;">
                <h3 class="modal-titulo" style="margin:0; font-size:1.25rem; color:#0f172a;">${isEdit ? '✏️ Editar Veículo' : '➕ Novo Veículo'}</h3>
                <button type="button" class="modal-fechar-btn" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:6px;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">&times;</button>
            </div>
            <div class="modal-corpo" style="padding:1.5rem;">
                <form id="formVeiculo" class="form-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:1rem;">
                    <div class="form-grupo" style="display:flex; flex-direction:column; gap:0.25rem;">
                        <label style="font-size:0.875rem; font-weight:500; color:#374151;">Placa <span style="color:#dc2626;">*</span></label>
                        <input type="text" id="vPlaca" required value="${veiculo?.placa || ''}" placeholder="ABC-1234" style="text-transform:uppercase; padding:0.55rem 0.75rem; border:1px solid #d1d5db; border-radius:8px; font-size:0.875rem;">
                    </div>
                    <div class="form-grupo" style="display:flex; flex-direction:column; gap:0.25rem;">
                        <label style="font-size:0.875rem; font-weight:500; color:#374151;">Categoria <span style="color:#dc2626;">*</span></label>
                        <select id="vCategoria" required style="padding:0.55rem 0.75rem; border:1px solid #d1d5db; border-radius:8px; font-size:0.875rem; background:white;">
                            <option value="">Selecione...</option>
                            ${categoriasOptionsHtml}
                        </select>
                    </div>
                    <div class="form-grupo" style="display:flex; flex-direction:column; gap:0.25rem;">
                        <label style="font-size:0.875rem; font-weight:500; color:#374151;">Marca</label>
                        <input type="text" id="vMarca" value="${veiculo?.marca || ''}" placeholder="Ex: Volvo" style="padding:0.55rem 0.75rem; border:1px solid #d1d5db; border-radius:8px; font-size:0.875rem;">
                    </div>
                    <div class="form-grupo" style="display:flex; flex-direction:column; gap:0.25rem;">
                        <label style="font-size:0.875rem; font-weight:500; color:#374151;">Modelo</label>
                        <input type="text" id="vModelo" value="${veiculo?.modelo || ''}" placeholder="Ex: FH 540" style="padding:0.55rem 0.75rem; border:1px solid #d1d5db; border-radius:8px; font-size:0.875rem;">
                    </div>
                    <div class="form-grupo" style="display:flex; flex-direction:column; gap:0.25rem;">
                        <label style="font-size:0.875rem; font-weight:500; color:#374151;">Ano</label>
                        <input type="number" id="vAno" value="${veiculo?.ano || ''}" min="1990" max="2030" style="padding:0.55rem 0.75rem; border:1px solid #d1d5db; border-radius:8px; font-size:0.875rem;">
                    </div>
                    <div class="form-grupo" style="display:flex; flex-direction:column; gap:0.25rem;">
                        <label style="font-size:0.875rem; font-weight:500; color:#374151;">KM Atual</label>
                        <input type="number" id="vKm" value="${veiculo?.km_atual || ''}" min="0" style="padding:0.55rem 0.75rem; border:1px solid #d1d5db; border-radius:8px; font-size:0.875rem;">
                    </div>
                    <div class="form-grupo" style="display:flex; flex-direction:column; gap:0.25rem;">
                        <label style="font-size:0.875rem; font-weight:500; color:#374151;">Local / Obra</label>
                        <select id="vObra" style="padding:0.55rem 0.75rem; border:1px solid #d1d5db; border-radius:8px; font-size:0.875rem; background:white;">
                            <option value="">Selecione...</option>
                            ${locaisOptionsHtml}
                        </select>
                    </div>
                    <div class="form-grupo" style="display:flex; flex-direction:column; gap:0.25rem;">
                        <label style="font-size:0.875rem; font-weight:500; color:#374151;">Status</label>
                        <select id="vStatus" style="padding:0.55rem 0.75rem; border:1px solid #d1d5db; border-radius:8px; font-size:0.875rem; background:white;">
                            ${statusOptionsHtml}
                        </select>
                    </div>
                    <div class="form-grupo" style="grid-column: span 2; display:flex; flex-direction:column; gap:0.25rem;">
                        <label style="font-size:0.875rem; font-weight:500; color:#374151;">Responsável</label>
                        <input type="text" id="vResponsavel" value="${veiculo?.responsavel || ''}" placeholder="Nome do motorista/responsável" style="padding:0.55rem 0.75rem; border:1px solid #d1d5db; border-radius:8px; font-size:0.875rem;">
                    </div>
                </form>
            </div>
            <div class="modal-rodape" style="display:flex; gap:0.75rem; justify-content:flex-end; padding:1rem 1.5rem; border-top:1px solid #e2e8f0; background:#f8fafc; border-radius:0 0 12px 12px;">
                <button type="button" class="btn-cancelar-modal" style="padding:0.55rem 1rem; border:1px solid #d1d5db; background:white; border-radius:8px; cursor:pointer; font-size:0.875rem; font-weight:500; color:#374151;">Cancelar</button>
                <button type="button" class="btn-salvar-modal" id="btnSalvarVeiculo" style="padding:0.55rem 1rem; border:none; background:#2563eb; color:white; border-radius:8px; cursor:pointer; font-size:0.875rem; font-weight:500;">💾 Salvar</button>
            </div>
        </div>
    `;
    
    // Adiciona ao body
    document.body.appendChild(modal);
    console.log('✅ Modal adicionado ao DOM');
    
    // Conecta botão fechar (X)
    const btnFechar = modal.querySelector('.modal-fechar-btn');
    if (btnFechar) {
        btnFechar.addEventListener('click', function() {
            modal.remove();
        });
    }
    
    // Conecta botão cancelar
    const btnCancelar = modal.querySelector('.btn-cancelar-modal');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            modal.remove();
        });
    }
    
    // Fecha ao clicar fora do modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Conecta botão salvar
    const btnSalvar = document.getElementById('btnSalvarVeiculo');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', function() {
            salvarVeiculoForm(id);
        });
    }
    
    // Conecta submit do formulário
    const form = document.getElementById('formVeiculo');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarVeiculoForm(id);
        });
    }
    
    console.log('✅ Modal de veículo aberto com sucesso!');
}

function salvarVeiculoForm(id) {
    try {
        const placa = document.getElementById('vPlaca')?.value.trim().toUpperCase();
        const categoria = document.getElementById('vCategoria')?.value;
        
        if (!placa || !categoria) {
            if (typeof mostrarToast === 'function') mostrarToast('Preencha os campos obrigatórios!', 'aviso');
            else alert('Preencha os campos obrigatórios!');
            return;
        }
        
        const dados = {
            placa: placa,
            categoria: categoria,
            marca: document.getElementById('vMarca')?.value.trim() || '',
            modelo: document.getElementById('vModelo')?.value.trim() || '',
            ano: parseInt(document.getElementById('vAno')?.value) || null,
            km_atual: parseFloat(document.getElementById('vKm')?.value) || 0,
            obra_atual: document.getElementById('vObra')?.value || '',
            status: document.getElementById('vStatus')?.value || 'disponivel',
            responsavel: document.getElementById('vResponsavel')?.value.trim() || ''
        };
        
        if (typeof salvarVeiculo === 'function') {
            if (id) dados.id = id;
            salvarVeiculo(dados);
        } else {
            // Fallback direto no BD
            if (typeof BD === 'undefined') BD = { veiculos: [] };
            if (!BD.veiculos) BD.veiculos = [];
            
            if (id) {
                const idx = BD.veiculos.findIndex(v => v.id === id);
                if (idx >= 0) BD.veiculos[idx] = { ...BD.veiculos[idx], ...dados };
            } else {
                dados.id = BD.veiculos.length > 0 ? Math.max(...BD.veiculos.map(v => v.id || 0)) + 1 : 1;
                dados.data_cadastro = new Date().toISOString().split('T')[0];
                BD.veiculos.push(dados);
            }
            
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        fecharModal('modal-veiculo');
        carregarTabelaVeiculos();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast(id ? 'Veículo atualizado!' : 'Veículo cadastrado!', 'sucesso');
        } else {
            alert(id ? '✅ Veículo atualizado!' : '✅ Veículo cadastrado!');
        }
        
    } catch (e) {
        console.error('❌ Erro ao salvar veículo:', e);
        if (typeof mostrarToast === 'function') mostrarToast('Erro ao salvar', 'erro');
        else alert('❌ Erro ao salvar');
    }
}

function excluirVeiculo(id) {
    try {
        if (!confirm('Tem certeza que deseja excluir este veículo?')) return;
        
        if (typeof excluirVeiculoBD === 'function') {
            excluirVeiculoBD(id);
        } else if (typeof BD !== 'undefined' && BD.veiculos) {
            BD.veiculos = BD.veiculos.filter(v => v.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarTabelaVeiculos();
        
        if (typeof mostrarToast === 'function') mostrarToast('Veículo excluído!', 'sucesso');
        else alert('✅ Veículo excluído!');
        
    } catch (e) {
        console.error('❌ Erro ao excluir veículo:', e);
    }
}

// Função auxiliar para fechar modais
function fecharModal(modalId) {
    try {
        const modal = modalId ? document.getElementById(modalId) : document.querySelector('.modal-overlay.aberto');
        if (modal) modal.remove();
    } catch (e) {
        console.error('❌ Erro ao fechar modal:', e);
    }
}
window.fecharModal = fecharModal;
window.abrirModalVeiculo = abrirModalVeiculo;
window.excluirVeiculo = excluirVeiculo;
window.carregarTabelaVeiculos = carregarTabelaVeiculos;

// Inicialização
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Listener do campo de busca
        const busca = document.getElementById('buscaVeiculos');
        if (busca) {
            busca.addEventListener('input', carregarTabelaVeiculos);
        }
        const filtroCat = document.getElementById('filtroVeiculoCategoria');
        if (filtroCat) {
            filtroCat.addEventListener('change', carregarTabelaVeiculos);
        }
        console.log('✅ js/veiculos.js inicializado');
    });
} else {
    const busca = document.getElementById('buscaVeiculos');
    if (busca) busca.addEventListener('input', carregarTabelaVeiculos);
    const filtroCat = document.getElementById('filtroVeiculoCategoria');
    if (filtroCat) filtroCat.addEventListener('change', carregarTabelaVeiculos);
}