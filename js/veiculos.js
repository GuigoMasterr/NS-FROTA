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
    console.log('📝 abrirModalVeiculo chamado');
    
    // Remove modal anterior se existir
    const antigo = document.getElementById('modal-veiculo-final');
    if (antigo) antigo.remove();
    
    // Garante dados
    if (typeof BD === 'undefined') window.BD = { veiculos: [], locais: [], config: {} };
    if (!BD.locais) BD.locais = [];
    if (!BD.config) BD.config = {};
    
    const veiculo = id && BD.veiculos ? BD.veiculos.find(v => v.id === id) : null;
    const isEdit = !!veiculo;
    
    const categorias = (typeof CONFIG !== 'undefined' && CONFIG.CATEGORIAS_VEICULOS && CONFIG.CATEGORIAS_VEICULOS.length) 
        ? CONFIG.CATEGORIAS_VEICULOS 
        : ['Caminhão', 'Carro Passeio', 'Utilitário', 'Máquina', 'Van', 'Ônibus', 'Moto', 'Outro'];
    
    let statusOptions = BD.config && BD.config.statusVeiculos && Object.keys(BD.config.statusVeiculos).length
        ? BD.config.statusVeiculos
        : { disponivel: 'Disponível', alocado: 'Alocado', manutencao: 'Manutenção', inativo: 'Inativo' };
    
    const locais = BD.locais && BD.locais.length ? BD.locais : [{ id: 'padrao', nome: 'Pátio Principal' }];
    
    // Cria o fundo do modal (mesma técnica do quadrado vermelho!)
    const fundo = document.createElement('div');
    fundo.id = 'modal-veiculo-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    
    // Fecha ao clicar fora
    fundo.addEventListener('click', function(e) {
        if (e.target === fundo) fundo.remove();
    });
    
    // Cria a caixa branca do modal
    const caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:600px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    // Cabeçalho
    const cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#1e40af;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    cabecalho.innerHTML = `<h3 style="margin:0;font-size:18px;">${isEdit ? '✏️ Editar Veículo' : '➕ Novo Veículo'}</h3>`;
    
    const btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    // Corpo
    const corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    // Formulário
    const form = document.createElement('form');
    form.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px;';
    form.onsubmit = function(e) {
        e.preventDefault();
        salvarVeiculoForm(id);
    };
    
    // Função auxiliar para criar campos
    function criarCampo(label, tipo, id, valor, placeholder, obrigatorio, opcoes) {
        const grupo = document.createElement('div');
        grupo.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        
        const lbl = document.createElement('label');
        lbl.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
        lbl.innerHTML = label + (obrigatorio ? ' <span style="color:#dc2626;">*</span>' : '');
        grupo.appendChild(lbl);
        
        let input;
        if (opcoes) {
            input = document.createElement('select');
            input.innerHTML = '<option value="">Selecione...</option>' + 
                opcoes.map(o => `<option value="${o.valor}" ${o.valor === valor ? 'selected' : ''}>${o.texto}</option>`).join('');
        } else {
            input = document.createElement('input');
            input.type = tipo;
            input.placeholder = placeholder || '';
            input.value = valor || '';
        }
        
        input.id = id;
        if (obrigatorio) input.required = true;
        input.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;background:white;';
        if (id === 'vPlaca') input.style.textTransform = 'uppercase';
        
        grupo.appendChild(input);
        return grupo;
    }
    
    // Cria todos os campos
    form.appendChild(criarCampo('Placa', 'text', 'vPlaca', veiculo?.placa, 'ABC-1234', true));
    form.appendChild(criarCampo('Categoria', 'text', 'vCategoria', veiculo?.categoria, '', true, 
        categorias.map(c => ({ valor: c, texto: c }))
    ));
    form.appendChild(criarCampo('Marca', 'text', 'vMarca', veiculo?.marca, 'Ex: Volvo'));
    form.appendChild(criarCampo('Modelo', 'text', 'vModelo', veiculo?.modelo, 'Ex: FH 540'));
    form.appendChild(criarCampo('Ano', 'number', 'vAno', veiculo?.ano));
    form.appendChild(criarCampo('KM Atual', 'number', 'vKm', veiculo?.km_atual));
    form.appendChild(criarCampo('Local/Obra', 'text', 'vObra', veiculo?.obra_atual, '', false,
        locais.map(l => ({ valor: l.nome, texto: l.nome }))
    ));
    form.appendChild(criarCampo('Status', 'text', 'vStatus', veiculo?.status || 'disponivel', '', false,
        Object.entries(statusOptions).map(([v, t]) => ({ valor: v, texto: t }))
    ));
    
    // Campo responsável (ocupa 2 colunas)
    const grupoResp = criarCampo('Responsável', 'text', 'vResponsavel', veiculo?.responsavel, 'Nome do motorista');
    grupoResp.style.gridColumn = 'span 2';
    form.appendChild(grupoResp);
    
    // Rodapé com botões
    const rodape = document.createElement('div');
    rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;grid-column:span 2;';
    
    const btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;color:#374151;';
    btnCancelar.onclick = function() { fundo.remove(); };
    
    const btnSalvar = document.createElement('button');
    btnSalvar.type = 'submit';
    btnSalvar.textContent = '💾 Salvar';
    btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#2563eb;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    
    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    form.appendChild(rodape);
    
    // Monta tudo
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
    
    // Adiciona à página (mesma técnica do quadrado vermelho!)
    document.body.appendChild(fundo);
    
    console.log('✅ Modal criado com a técnica que funcionou!');
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