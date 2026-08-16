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
    if (typeof BD === 'undefined') window.BD = { veiculos: [], locais: [], config: {} };
    if (!BD.locais) BD.locais = [];
    if (!BD.config) BD.config = {};
    
    const veiculo = id && BD.veiculos ? BD.veiculos.find(v => v.id === id) : null;
    
    const categorias = (typeof CONFIG !== 'undefined' && CONFIG.CATEGORIAS_VEICULOS && CONFIG.CATEGORIAS_VEICULOS.length > 0) 
        ? CONFIG.CATEGORIAS_VEICULOS 
        : ['Caminhão', 'Carro Passeio', 'Utilitário', 'Máquina', 'Van', 'Ônibus', 'Moto', 'Outro'];
    
    let statusOptions = BD.config && BD.config.statusVeiculos && Object.keys(BD.config.statusVeiculos).length > 0
        ? BD.config.statusVeiculos
        : { disponivel: 'Disponível', alocado: 'Alocado', manutencao: 'Manutenção', inativo: 'Inativo' };
    
    const locais = BD.locais && BD.locais.length > 0 ? BD.locais : [{ id: 'padrao', nome: 'Pátio Principal' }];
    
    const isEdit = !!veiculo;
    
    // Cria o modal SEM usar classes conflitantes
    const modal = document.createElement('div');
    modal.id = 'modal-veiculo-emergencia';
    
    // 🔥 FORÇA VISIBILIDADE - estilo inline completo, sem dependência de CSS externo
    modal.setAttribute('style', 
        'position: fixed !important;' +
        'top: 0 !important;' +
        'left: 0 !important;' +
        'width: 100vw !important;' +
        'height: 100vh !important;' +
        'background: rgba(0,0,0,0.6) !important;' +
        'z-index: 2147483647 !important;' +
        'display: flex !important;' +
        'align-items: center !important;' +
        'justify-content: center !important;' +
        'padding: 20px !important;' +
        'box-sizing: border-box !important;' +
        'margin: 0 !important;' +
        'opacity: 1 !important;' +
        'visibility: visible !important;'
    );
    
    const statusOptionsHtml = Object.entries(statusOptions).map(([val, label]) => 
        `<option value="${val}" ${veiculo?.status === val ? 'selected' : ''}>${label}</option>`
    ).join('');
    
    const locaisOptionsHtml = locais.map(l => 
        `<option value="${l.nome}" ${veiculo?.obra_atual === l.nome ? 'selected' : ''}>${l.nome}</option>`
    ).join('');
    
    const categoriasOptionsHtml = categorias.map(c => 
        `<option value="${c}" ${veiculo?.categoria === c ? 'selected' : ''}>${c}</option>`
    ).join('');
    
    // Conteúdo do modal com estilos inline
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            box-shadow: 0 25px 80px rgba(0,0,0,0.4);
            width: 100%;
            max-width: 650px;
            max-height: 90vh;
            overflow-y: auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
            <!-- Cabeçalho -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 24px; border-bottom:1px solid #e2e8f0; background:#f8fafc; border-radius:12px 12px 0 0;">
                <h3 style="margin:0; font-size:18px; font-weight:600; color:#0f172a;">${isEdit ? '✏️ Editar Veículo' : '➕ Novo Veículo'}</h3>
                <button id="btnFecharModalX" style="background:#f1f5f9; border:1px solid #e2e8f0; font-size:22px; cursor:pointer; color:#64748b; width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:8px; line-height:1;">&times;</button>
            </div>
            
            <!-- Corpo -->
            <div style="padding:24px;">
                <form id="formVeiculo" style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <label style="font-size:14px; font-weight:500; color:#374151;">Placa <span style="color:#dc2626;">*</span></label>
                        <input type="text" id="vPlaca" required value="${veiculo?.placa || ''}" placeholder="ABC-1234" style="text-transform:uppercase; padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; outline:none;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <label style="font-size:14px; font-weight:500; color:#374151;">Categoria <span style="color:#dc2626;">*</span></label>
                        <select id="vCategoria" required style="padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; background:white; outline:none;">
                            <option value="">Selecione...</option>
                            ${categoriasOptionsHtml}
                        </select>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <label style="font-size:14px; font-weight:500; color:#374151;">Marca</label>
                        <input type="text" id="vMarca" value="${veiculo?.marca || ''}" placeholder="Ex: Volvo" style="padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; outline:none;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <label style="font-size:14px; font-weight:500; color:#374151;">Modelo</label>
                        <input type="text" id="vModelo" value="${veiculo?.modelo || ''}" placeholder="Ex: FH 540" style="padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; outline:none;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <label style="font-size:14px; font-weight:500; color:#374151;">Ano</label>
                        <input type="number" id="vAno" value="${veiculo?.ano || ''}" min="1990" max="2030" style="padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; outline:none;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <label style="font-size:14px; font-weight:500; color:#374151;">KM Atual</label>
                        <input type="number" id="vKm" value="${veiculo?.km_atual || ''}" min="0" style="padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; outline:none;">
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <label style="font-size:14px; font-weight:500; color:#374151;">Local / Obra</label>
                        <select id="vObra" style="padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; background:white; outline:none;">
                            <option value="">Selecione...</option>
                            ${locaisOptionsHtml}
                        </select>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                        <label style="font-size:14px; font-weight:500; color:#374151;">Status</label>
                        <select id="vStatus" style="padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; background:white; outline:none;">
                            ${statusOptionsHtml}
                        </select>
                    </div>
                    <div style="grid-column: span 2; display:flex; flex-direction:column; gap:6px;">
                        <label style="font-size:14px; font-weight:500; color:#374151;">Responsável</label>
                        <input type="text" id="vResponsavel" value="${veiculo?.responsavel || ''}" placeholder="Nome do motorista/responsável" style="padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; font-size:14px; outline:none;">
                    </div>
                </form>
            </div>
            
            <!-- Rodapé -->
            <div style="display:flex; gap:12px; justify-content:flex-end; padding:16px 24px; border-top:1px solid #e2e8f0; background:#f8fafc; border-radius:0 0 12px 12px;">
                <button id="btnCancelarModal" style="padding:10px 20px; border:1px solid #d1d5db; background:white; border-radius:8px; cursor:pointer; font-size:14px; font-weight:500; color:#374151;">Cancelar</button>
                <button id="btnSalvarVeiculo" style="padding:10px 20px; border:none; background:#2563eb; color:white; border-radius:8px; cursor:pointer; font-size:14px; font-weight:500;">💾 Salvar</button>
            </div>
        </div>
    `;
    
    // Adiciona ao body
    document.body.appendChild(modal);
    console.log('✅ Modal adicionado ao body, z-index máximo aplicado');
    
    // 🔥 Garantia extra: força visibilidade após 50ms
    setTimeout(function() {
        modal.style.display = 'flex !important';
        modal.style.visibility = 'visible !important';
        modal.style.opacity = '1 !important';
        console.log('✅ Visibilidade forçada');
    }, 50);
    
    // Conecta botão fechar X
    document.getElementById('btnFecharModalX').addEventListener('click', function() { modal.remove(); });
    
    // Conecta botão cancelar
    document.getElementById('btnCancelarModal').addEventListener('click', function() { modal.remove(); });
    
    // Fecha ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.remove();
    });
    
    // Conecta botão salvar
    document.getElementById('btnSalvarVeiculo').addEventListener('click', function() {
        salvarVeiculoForm(id);
    });
    
    // Conecta submit do formulário
    document.getElementById('formVeiculo').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarVeiculoForm(id);
    });
    
    console.log('✅ Modal de veículo configurado completamente!');
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

function fecharModal(modalId) {
    try {
        // Remove pelo ID se fornecido
        if (modalId) {
            const m = document.getElementById(modalId);
            if (m) { m.remove(); return; }
        }
        // Remove todos os modais conhecidos
        const modais = document.querySelectorAll('.modal-overlay.aberto, .modal-overlay, #modal-veiculo-emergencia');
        modais.forEach(m => m.remove());
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