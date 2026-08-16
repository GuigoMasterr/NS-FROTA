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
    try {
        console.log('📝 Abrindo modal de veículo:', id || 'novo');
        
        if (typeof ehAdmin === 'function' && !ehAdmin()) {
            if (typeof mostrarToast === 'function') mostrarToast('Você não tem permissão!', 'erro');
            else alert('Você não tem permissão!');
            return;
        }
        
        const veiculo = id && typeof BD !== 'undefined' && BD.veiculos 
            ? BD.veiculos.find(v => v.id === id) 
            : null;
        
        const categorias = (typeof CONFIG !== 'undefined' && CONFIG.CATEGORIAS_VEICULOS) 
            ? CONFIG.CATEGORIAS_VEICULOS 
            : ['Caminhão', 'Carro Passeio', 'Utilitário', 'Máquina', 'Van', 'Ônibus', 'Moto', 'Outro'];
        
        const statusOptions = (typeof BD !== 'undefined' && BD.config && BD.config.statusVeiculos)
            ? BD.config.statusVeiculos
            : { disponivel: 'Disponível', alocado: 'Alocado', manutencao: 'Manutenção', inativo: 'Inativo' };
        
        const locais = (typeof BD !== 'undefined' && BD.locais) ? BD.locais : [];
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay aberto';
        modal.id = 'modal-veiculo';
        
        const isEdit = !!veiculo;
        
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 650px;">
                <div class="modal-cabecalho">
                    <h3 class="modal-titulo">${isEdit ? '✏️ Editar Veículo' : '➕ Novo Veículo'}</h3>
                    <button type="button" class="modal-fechar" onclick="fecharModal('modal-veiculo')">&times;</button>
                </div>
                <div class="modal-corpo">
                    <form id="formVeiculo" class="form-grid" style="grid-template-columns: repeat(2, 1fr);">
                        <div class="form-grupo">
                            <label>Placa <span class="obrigatorio">*</span></label>
                            <input type="text" id="vPlaca" required value="${veiculo?.placa || ''}" placeholder="ABC-1234" style="text-transform:uppercase;">
                        </div>
                        <div class="form-grupo">
                            <label>Categoria <span class="obrigatorio">*</span></label>
                            <select id="vCategoria" required>
                                <option value="">Selecione...</option>
                                ${categorias.map(c => `<option value="${c}" ${veiculo?.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Marca</label>
                            <input type="text" id="vMarca" value="${veiculo?.marca || ''}" placeholder="Ex: Volvo">
                        </div>
                        <div class="form-grupo">
                            <label>Modelo</label>
                            <input type="text" id="vModelo" value="${veiculo?.modelo || ''}" placeholder="Ex: FH 540">
                        </div>
                        <div class="form-grupo">
                            <label>Ano</label>
                            <input type="number" id="vAno" value="${veiculo?.ano || ''}" min="1990" max="2030">
                        </div>
                        <div class="form-grupo">
                            <label>KM Atual</label>
                            <input type="number" id="vKm" value="${veiculo?.km_atual || ''}" min="0">
                        </div>
                        <div class="form-grupo">
                            <label>Local / Obra</label>
                            <select id="vObra">
                                <option value="">Selecione...</option>
                                ${locais.map(l => `<option value="${l.nome}" ${veiculo?.obra_atual === l.nome ? 'selected' : ''}>${l.nome}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Status</label>
                            <select id="vStatus">
                                ${Object.entries(statusOptions).map(([val, label]) => 
                                    `<option value="${val}" ${veiculo?.status === val ? 'selected' : ''}>${label}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label>Responsável</label>
                            <input type="text" id="vResponsavel" value="${veiculo?.responsavel || ''}" placeholder="Nome do motorista/responsável">
                        </div>
                    </form>
                </div>
                <div class="modal-rodape">
                    <button type="button" class="btn btn-secundario" onclick="fecharModal('modal-veiculo')">Cancelar</button>
                    <button type="button" class="btn btn-primario" id="btnSalvarVeiculo">💾 Salvar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Listener do botão salvar
        document.getElementById('btnSalvarVeiculo').addEventListener('click', function() {
            salvarVeiculoForm(id);
        });
        
        // Submit com Enter no formulário
        document.getElementById('formVeiculo').addEventListener('submit', function(e) {
            e.preventDefault();
            salvarVeiculoForm(id);
        });
        
    } catch (e) {
        console.error('❌ Erro ao abrir modal de veículo:', e);
        if (typeof mostrarToast === 'function') mostrarToast('Erro ao abrir formulário', 'erro');
        else alert('Erro ao abrir formulário');
    }
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