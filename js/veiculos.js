// ==================================================
// 🚛 GESTÃO DE VEÍCULOS - VERSÃO CORRIGIDA
// ✅ Modal funcionando - sem template strings
// ==================================================

function carregarTabelaVeiculos() {
    try {
        var tabela = document.getElementById('tabelaVeiculos');
        if (!tabela) return;
        
        var busca = (document.getElementById('buscaVeiculos')?.value || '').toLowerCase();
        var filtroCategoria = document.getElementById('filtroVeiculoCategoria')?.value || 'todos';
        var filtroStatus = document.getElementById('filtroVeiculoStatus')?.value || 'todos';
        
        var veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos.slice() : [];
        
        if (busca) {
            veiculos = veiculos.filter(function(v) {
                return (v.placa || '').toLowerCase().indexOf(busca) >= 0 ||
                       (v.modelo || '').toLowerCase().indexOf(busca) >= 0 ||
                       (v.marca || '').toLowerCase().indexOf(busca) >= 0;
            });
        }
        if (filtroCategoria !== 'todos') {
            veiculos = veiculos.filter(function(v) { return v.categoria === filtroCategoria; });
        }
        if (filtroStatus !== 'todos') {
            veiculos = veiculos.filter(function(v) { return v.status === filtroStatus; });
        }
        
        if (veiculos.length === 0) {
            tabela.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#64748b;">Nenhum veiculo cadastrado</td></tr>';
            return;
        }
        
        var statusConfig = { disponivel: 'Disponivel', alocado: 'Alocado', manutencao: 'Manutencao', inativo: 'Inativo' };
        var statusCor = { disponivel: '#10b981', alocado: '#3b82f6', manutencao: '#f59e0b', inativo: '#6b7280' };
        
        var html = '';
        for (var i = 0; i < veiculos.length; i++) {
            var v = veiculos[i];
            var cor = statusCor[v.status] || '#6b7280';
            var status = statusConfig[v.status] || v.status;
            html += '<tr>' +
                '<td><strong>' + (v.placa || '-') + '</strong></td>' +
                '<td>' + (v.categoria || '-') + '</td>' +
                '<td>' + (v.modelo || v.marca || '-') + '</td>' +
                '<td>' + (v.ano || '-') + '</td>' +
                '<td>' + Number(v.km_atual || 0).toLocaleString('pt-BR') + '</td>' +
                '<td>' + (v.obra_atual || '-') + '</td>' +
                '<td><span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;color:white;background:' + cor + ';">' + status + '</span></td>' +
                '<td>' +
                    '<button onclick="abrirModalVeiculo(' + v.id + ')" style="padding:6px 12px;border:none;background:#3b82f6;color:white;border-radius:6px;cursor:pointer;font-size:12px;margin-right:6px;">Editar</button>' +
                    '<button onclick="excluirVeiculo(' + v.id + ')" style="padding:6px 12px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:12px;">Excluir</button>' +
                '</td>' +
                '</tr>';
        }
        tabela.innerHTML = html;
        
    } catch (e) {
        console.error('Erro ao carregar tabela:', e);
    }
}

function abrirModalVeiculo(id) {
    console.log('abrirModalVeiculo chamado, id:', id || 'novo');
    
    // Verifica permissao
    if (typeof ehAdmin === 'function' && !ehAdmin()) {
        alert('Voce nao tem permissao!');
        return;
    }
    
    // Remove modal anterior se existir
    var antigo = document.getElementById('modal-veiculo-final');
    if (antigo) antigo.remove();
    
    // Garante que BD existe
    if (typeof BD === 'undefined') window.BD = { veiculos: [], locais: [], config: {} };
    if (!BD.locais) BD.locais = [];
    if (!BD.config) BD.config = {};
    
    var veiculo = null;
    if (id && BD.veiculos) {
        for (var i = 0; i < BD.veiculos.length; i++) {
            if (BD.veiculos[i].id === id) {
                veiculo = BD.veiculos[i];
                break;
            }
        }
    }
    var isEdit = !!veiculo;
    
    // Categorias
    var categorias = ['Caminhao', 'Carro Passeio', 'Utilitario', 'Maquina', 'Van', 'Onibus', 'Moto', 'Outro'];
    if (typeof CONFIG !== 'undefined' && CONFIG.CATEGORIAS_VEICULOS && CONFIG.CATEGORIAS_VEICULOS.length > 0) {
        categorias = CONFIG.CATEGORIAS_VEICULOS;
    }
    
    // Status
    var statusOptions = { disponivel: 'Disponivel', alocado: 'Alocado', manutencao: 'Manutencao', inativo: 'Inativo' };
    if (BD.config && BD.config.statusVeiculos && Object.keys(BD.config.statusVeiculos).length > 0) {
        statusOptions = BD.config.statusVeiculos;
    }
    
    // Locais
    var locais = BD.locais && BD.locais.length > 0 ? BD.locais : [{ id: 'padrao', nome: 'Patio Principal' }];
    
    // ==========================================
    // CRIA O MODAL (TECNICA QUE FUNCIONA!)
    // ==========================================
    
    // 1. Fundo do modal
    var fundo = document.createElement('div');
    fundo.id = 'modal-veiculo-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    
    // Fecha ao clicar fora
    fundo.addEventListener('click', function(e) {
        if (e.target === fundo) fundo.remove();
    });
    
    // 2. Caixa branca do modal
    var caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:600px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    // 3. Cabecalho
    var cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#1e40af;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    
    var titulo = document.createElement('h3');
    titulo.style.cssText = 'margin:0;font-size:18px;';
    titulo.textContent = isEdit ? 'Editar Veiculo' : 'Novo Veiculo';
    cabecalho.appendChild(titulo);
    
    var btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    // 4. Corpo
    var corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    // 5. Formulario
    var form = document.createElement('form');
    form.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px;';
    form.onsubmit = function(e) {
        e.preventDefault();
        salvarVeiculoForm(id);
    };
    
    // Funcao auxiliar para criar campos
    function criarCampo(label, tipo, id, valor, placeholder, obrigatorio, opcoes) {
        var grupo = document.createElement('div');
        grupo.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        
        var lbl = document.createElement('label');
        lbl.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
        lbl.textContent = label;
        if (obrigatorio) {
            var span = document.createElement('span');
            span.style.cssText = 'color:#dc2626;';
            span.textContent = ' *';
            lbl.appendChild(span);
        }
        grupo.appendChild(lbl);
        
        var input;
        if (opcoes) {
            input = document.createElement('select');
            var optVazia = document.createElement('option');
            optVazia.value = '';
            optVazia.textContent = 'Selecione...';
            input.appendChild(optVazia);
            
            for (var i = 0; i < opcoes.length; i++) {
                var opt = document.createElement('option');
                opt.value = opcoes[i].valor;
                opt.textContent = opcoes[i].texto;
                if (valor && opcoes[i].valor === valor) opt.selected = true;
                input.appendChild(opt);
            }
        } else {
            input = document.createElement('input');
            input.type = tipo;
            input.value = valor || '';
            if (placeholder) input.placeholder = placeholder;
        }
        
        input.id = id;
        if (obrigatorio) input.required = true;
        input.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;background:white;';
        if (id === 'vPlaca') input.style.textTransform = 'uppercase';
        
        grupo.appendChild(input);
        return grupo;
    }
    
    // Prepara opcoes
    var opcoesCategoria = [];
    for (var i = 0; i < categorias.length; i++) {
        opcoesCategoria.push({ valor: categorias[i], texto: categorias[i] });
    }
    
    var opcoesStatus = [];
    for (var chave in statusOptions) {
        if (statusOptions.hasOwnProperty(chave)) {
            opcoesStatus.push({ valor: chave, texto: statusOptions[chave] });
        }
    }
    
    var opcoesLocais = [];
    for (var j = 0; j < locais.length; j++) {
        opcoesLocais.push({ valor: locais[j].nome, texto: locais[j].nome });
    }
    
    // Cria todos os campos
    form.appendChild(criarCampo('Placa', 'text', 'vPlaca', veiculo ? veiculo.placa : '', 'ABC-1234', true));
    form.appendChild(criarCampo('Categoria', 'text', 'vCategoria', veiculo ? veiculo.categoria : '', '', true, opcoesCategoria));
    form.appendChild(criarCampo('Marca', 'text', 'vMarca', veiculo ? veiculo.marca : '', 'Ex: Volvo'));
    form.appendChild(criarCampo('Modelo', 'text', 'vModelo', veiculo ? veiculo.modelo : '', 'Ex: FH 540'));
    form.appendChild(criarCampo('Ano', 'number', 'vAno', veiculo ? veiculo.ano : ''));
    form.appendChild(criarCampo('KM Atual', 'number', 'vKm', veiculo ? veiculo.km_atual : ''));
    form.appendChild(criarCampo('Local/Obra', 'text', 'vObra', veiculo ? veiculo.obra_atual : '', '', false, opcoesLocais));
    form.appendChild(criarCampo('Status', 'text', 'vStatus', veiculo ? veiculo.status : 'disponivel', '', false, opcoesStatus));
    
    // Campo responsavel (ocupa 2 colunas)
    var grupoResp = criarCampo('Responsavel', 'text', 'vResponsavel', veiculo ? veiculo.responsavel : '', 'Nome do motorista');
    grupoResp.style.gridColumn = 'span 2';
    form.appendChild(grupoResp);
    
    // 6. Botoes
    var rodape = document.createElement('div');
    rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;grid-column:span 2;';
    
    var btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;color:#374151;';
    btnCancelar.onclick = function() { fundo.remove(); };
    
    var btnSalvar = document.createElement('button');
    btnSalvar.type = 'submit';
    btnSalvar.textContent = 'Salvar';
    btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#2563eb;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    
    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    form.appendChild(rodape);
    
    // Monta tudo
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
    
    // Adiciona a pagina (MESMA TECNICA DO QUADRADO VERMELHO!)
    document.body.appendChild(fundo);
    
    console.log('Modal de veiculo ABERTO com sucesso!');
}

function salvarVeiculoForm(id) {
    try {
        var placa = document.getElementById('vPlaca')?.value.trim().toUpperCase();
        var categoria = document.getElementById('vCategoria')?.value;
        
        if (!placa || !categoria) {
            alert('Preencha os campos obrigatorios!');
            return;
        }
        
        var dados = {
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
            if (typeof BD === 'undefined') BD = { veiculos: [] };
            if (!BD.veiculos) BD.veiculos = [];
            
            if (id) {
                for (var i = 0; i < BD.veiculos.length; i++) {
                    if (BD.veiculos[i].id === id) {
                        for (var k in dados) {
                            if (dados.hasOwnProperty(k)) {
                                BD.veiculos[i][k] = dados[k];
                            }
                        }
                        break;
                    }
                }
            } else {
                var novoId = 1;
                for (var j = 0; j < BD.veiculos.length; j++) {
                    if (Number(BD.veiculos[j].id) >= novoId) {
                        novoId = Number(BD.veiculos[j].id) + 1;
                    }
                }
                dados.id = novoId;
                dados.data_cadastro = new Date().toISOString().split('T')[0];
                BD.veiculos.push(dados);
            }
            
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        var modal = document.getElementById('modal-veiculo-final');
        if (modal) modal.remove();
        
        carregarTabelaVeiculos();
        
        if (typeof atualizarListaVeiculosNosFiltros === 'function') {
            atualizarListaVeiculosNosFiltros();
        }
        if (typeof atualizarDashboardCompleto === 'function') {
            atualizarDashboardCompleto();
        }
        
        if (typeof mostrarToast === 'function') {
            mostrarToast(id ? 'Veiculo atualizado!' : 'Veiculo cadastrado!', 'sucesso');
        } else {
            alert(id ? 'Veiculo atualizado!' : 'Veiculo cadastrado!');
        }
        
    } catch (e) {
        console.error('Erro ao salvar:', e);
        alert('Erro ao salvar');
    }
}

function excluirVeiculo(id) {
    try {
        if (!confirm('Tem certeza que deseja excluir este veiculo?')) return;
        
        if (typeof ehAdmin === 'function' && !ehAdmin()) {
            alert('Voce nao tem permissao!');
            return;
        }
        
        if (typeof excluirVeiculoBD === 'function') {
            excluirVeiculoBD(id);
        } else if (typeof BD !== 'undefined' && BD.veiculos) {
            BD.veiculos = BD.veiculos.filter(function(v) { return v.id !== id; });
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarTabelaVeiculos();
        
        if (typeof atualizarListaVeiculosNosFiltros === 'function') {
            atualizarListaVeiculosNosFiltros();
        }
        if (typeof atualizarDashboardCompleto === 'function') {
            atualizarDashboardCompleto();
        }
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Veiculo excluido!', 'sucesso');
        } else {
            alert('Veiculo excluido!');
        }
        
    } catch (e) {
        console.error('Erro ao excluir:', e);
    }
}

function fecharModal(modalId) {
    try {
        if (modalId) {
            var m = document.getElementById(modalId);
            if (m) { m.remove(); return; }
        }
        var modais = document.querySelectorAll('[id^="modal-"][id$="-final"]');
        for (var i = 0; i < modais.length; i++) {
            modais[i].remove();
        }
    } catch (e) {
        console.error('Erro ao fechar modal:', e);
    }
}

window.fecharModal = fecharModal;
window.abrirModalVeiculo = abrirModalVeiculo;
window.excluirVeiculo = excluirVeiculo;
window.carregarTabelaVeiculos = carregarTabelaVeiculos;

// Inicializacao
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarVeiculos);
} else {
    inicializarVeiculos();
}

function inicializarVeiculos() {
    try {
        var busca = document.getElementById('buscaVeiculos');
        if (busca) busca.addEventListener('input', carregarTabelaVeiculos);
        
        var filtCat = document.getElementById('filtroVeiculoCategoria');
        if (filtCat) filtCat.addEventListener('change', carregarTabelaVeiculos);
        
        var filtStatus = document.getElementById('filtroVeiculoStatus');
        if (filtStatus) filtStatus.addEventListener('change', carregarTabelaVeiculos);
        
        console.log('veiculos.js inicializado');
    } catch (e) {
        console.error('Erro ao inicializar veiculos:', e);
    }
}