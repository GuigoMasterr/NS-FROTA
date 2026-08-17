// ==================================================
// 🚛 GESTÃO DE VEÍCULOS + HISTORICO DE CONDUTORES + DOCUMENTOS
// ✅ Versao completa - organizada e com documentos
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
            tabela.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#64748b;">Nenhum veiculo cadastrado</td></tr>';
            return;
        }
        
        var statusConfig = { disponivel: 'Disponivel', alocado: 'Alocado', manutencao: 'Manutencao', inativo: 'Inativo' };
        var statusCor = { disponivel: '#10b981', alocado: '#3b82f6', manutencao: '#f59e0b', inativo: '#6b7280' };
        
        var html = '';
        for (var i = 0; i < veiculos.length; i++) {
            var v = veiculos[i];
            var cor = statusCor[v.status] || '#6b7280';
            var status = statusConfig[v.status] || v.status;
            var responsavel = v.responsavel && v.responsavel.trim() ? v.responsavel : '<span style="color:#94a3b8;">—</span>';
            
            html += '<tr>' +
                '<td><strong>' + (v.placa || '-') + '</strong></td>' +
                '<td>' + (v.categoria || '-') + '</td>' +
                '<td>' + (v.modelo || v.marca || '-') + '</td>' +
                '<td>' + (v.ano || '-') + '</td>' +
                '<td>' + Number(v.km_atual || 0).toLocaleString('pt-BR') + '</td>' +
                '<td>' + (v.obra_atual || '-') + '</td>' +
                '<td>' + responsavel + '</td>' +
                '<td><span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;color:white;background:' + cor + ';">' + status + '</span></td>' +
                '<td>' +
                    '<button onclick="abrirModalVeiculo(' + v.id + ')" style="padding:6px 10px;border:none;background:#3b82f6;color:white;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px;">Editar</button>' +
                    '<button onclick="verHistoricoCondutores(' + v.id + ')" style="padding:6px 10px;border:none;background:#7c3aed;color:white;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px;">Historico</button>' +
                    '<button onclick="abrirModalDocumentos(' + v.id + ')" style="padding:6px 10px;border:none;background:#0ea5e9;color:white;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px;">📄 Doc</button>' +
                    '<button onclick="excluirVeiculo(' + v.id + ')" style="padding:6px 10px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:12px;">Excluir</button>' +
                '</td>' +
                '</tr>';
        }
        tabela.innerHTML = html;
        
    } catch (e) {
        console.error('Erro ao carregar tabela:', e);
    }
}

// ==================================================
// 📄 GESTÃO DE DOCUMENTOS DO VEÍCULO
// ==================================================
function inicializarDocumentos() {
    if (typeof BD === 'undefined') BD = {};
    if (!BD.documentosVeiculos) BD.documentosVeiculos = [];
}

function getStatusVencimento(dataVencimento) {
    if (!dataVencimento) return { texto: 'Sem data', cor: '#6b7280', classe: 'neutral' };
    
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    var venc = new Date(dataVencimento);
    venc.setHours(0, 0, 0, 0);
    
    var diffMs = venc - hoje;
    var diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDias < 0) return { texto: 'Vencido', cor: '#dc2626', classe: 'vencido', dias: diffDias };
    if (diffDias <= 30) return { texto: 'Vencendo (' + diffDias + 'd)', cor: '#f59e0b', classe: 'alerta', dias: diffDias };
    return { texto: 'Em dia', cor: '#10b981', classe: 'ok', dias: diffDias };
}

function abrirModalDocumentos(veiculoId) {
    try {
        inicializarDocumentos();
        
        if (typeof ehAdmin === 'function' && !ehAdmin()) {
            alert('Voce nao tem permissao!');
            return;
        }
        
        var veiculo = null;
        if (BD.veiculos) {
            for (var i = 0; i < BD.veiculos.length; i++) {
                if (BD.veiculos[i].id === veiculoId) {
                    veiculo = BD.veiculos[i];
                    break;
                }
            }
        }
        
        if (!veiculo) {
            alert('Veiculo nao encontrado!');
            return;
        }
        
        var antigo = document.getElementById('modal-documentos-final');
        if (antigo) antigo.remove();
        
        var fundo = document.createElement('div');
        fundo.id = 'modal-documentos-final';
        fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
        fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
        
        var caixa = document.createElement('div');
        caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:800px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
        
        var cabecalho = document.createElement('div');
        cabecalho.style.cssText = 'padding:16px 24px;background:#0ea5e9;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
        var titulo = document.createElement('h3');
        titulo.style.cssText = 'margin:0;font-size:18px;';
        titulo.innerHTML = '📄 Documentos do Veículo - <strong>' + veiculo.placa + '</strong>';
        cabecalho.appendChild(titulo);
        var btnFechar = document.createElement('button');
        btnFechar.textContent = '×';
        btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
        btnFechar.onclick = function() { fundo.remove(); };
        cabecalho.appendChild(btnFechar);
        
        var corpo = document.createElement('div');
        corpo.style.cssText = 'padding:24px;';
        corpo.id = 'corpo-documentos';
        
        // Formulário de adicionar documento
        var formAdd = document.createElement('div');
        formAdd.style.cssText = 'background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:20px;';
        formAdd.innerHTML = 
            '<div style="font-weight:600;color:#1e293b;margin-bottom:12px;font-size:15px;">➕ Adicionar Novo Documento</div>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;">' +
                '<div>' +
                    '<label style="font-size:12px;font-weight:500;color:#374151;display:block;margin-bottom:4px;">Tipo *</label>' +
                    '<select id="docTipo" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;">' +
                        '<option value="Licenciamento">Licenciamento</option>' +
                        '<option value="IPVA">IPVA</option>' +
                        '<option value="Multa">Multa</option>' +
                        '<option value="Seguro">Seguro</option>' +
                        '<option value="DPVAT">DPVAT</option>' +
                        '<option value="CRLV">CRLV</option>' +
                        '<option value="Inspecao">Inspeção Veicular</option>' +
                        '<option value="Outro">Outro</option>' +
                    '</select>' +
                '</div>' +
                '<div>' +
                    '<label style="font-size:12px;font-weight:500;color:#374151;display:block;margin-bottom:4px;">Número/Processo</label>' +
                    '<input type="text" id="docNumero" placeholder="Ex: 123456" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;">' +
                '</div>' +
                '<div>' +
                    '<label style="font-size:12px;font-weight:500;color:#374151;display:block;margin-bottom:4px;">Data Emissão</label>' +
                    '<input type="date" id="docEmissao" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;">' +
                '</div>' +
                '<div>' +
                    '<label style="font-size:12px;font-weight:500;color:#374151;display:block;margin-bottom:4px;">Data Vencimento *</label>' +
                    '<input type="date" id="docVencimento" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;">' +
                '</div>' +
                '<div>' +
                    '<label style="font-size:12px;font-weight:500;color:#374151;display:block;margin-bottom:4px;">Valor (R$)</label>' +
                    '<input type="number" step="0.01" id="docValor" placeholder="0,00" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;">' +
                '</div>' +
                '<div style="grid-column:span 2;">' +
                    '<label style="font-size:12px;font-weight:500;color:#374151;display:block;margin-bottom:4px;">Observação</label>' +
                    '<input type="text" id="docObs" placeholder="Detalhes adicionais..." style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;">' +
                '</div>' +
            '</div>' +
            '<div style="margin-top:12px;text-align:right;">' +
                '<button onclick="adicionarDocumento(' + veiculoId + ')" style="padding:8px 16px;border:none;background:#0ea5e9;color:white;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;">Adicionar Documento</button>' +
            '</div>';
        corpo.appendChild(formAdd);
        
        // Lista de documentos
        var listaContainer = document.createElement('div');
        listaContainer.id = 'lista-documentos-container';
        corpo.appendChild(listaContainer);
        
        renderizarListaDocumentos(veiculoId, listaContainer);
        
        caixa.appendChild(cabecalho);
        caixa.appendChild(corpo);
        fundo.appendChild(caixa);
        document.body.appendChild(fundo);
        
    } catch (e) {
        console.error('Erro ao abrir modal de documentos:', e);
        alert('Erro ao abrir documentos');
    }
}

function adicionarDocumento(veiculoId) {
    try {
        inicializarDocumentos();
        
        var tipo = document.getElementById('docTipo')?.value;
        var vencimento = document.getElementById('docVencimento')?.value;
        
        if (!tipo || !vencimento) {
            alert('Preencha o Tipo e a Data de Vencimento!');
            return;
        }
        
        var novoDoc = {
            id: Date.now(),
            veiculoId: veiculoId,
            tipo: tipo,
            numero: document.getElementById('docNumero')?.value.trim() || '',
            dataEmissao: document.getElementById('docEmissao')?.value || '',
            dataVencimento: vencimento,
            valor: parseFloat(document.getElementById('docValor')?.value) || 0,
            observacao: document.getElementById('docObs')?.value.trim() || '',
            dataCadastro: new Date().toISOString().split('T')[0],
            pago: false
        };
        
        BD.documentosVeiculos.push(novoDoc);
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        // Limpar campos
        document.getElementById('docNumero').value = '';
        document.getElementById('docEmissao').value = '';
        document.getElementById('docVencimento').value = '';
        document.getElementById('docValor').value = '';
        document.getElementById('docObs').value = '';
        
        // Atualizar lista
        var container = document.getElementById('lista-documentos-container');
        if (container) renderizarListaDocumentos(veiculoId, container);
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('✅ Documento adicionado!', 'sucesso');
        }
        
    } catch (e) {
        console.error('Erro ao adicionar documento:', e);
        alert('Erro ao adicionar documento');
    }
}

function excluirDocumento(veiculoId, docId) {
    try {
        if (!confirm('Tem certeza que deseja excluir este documento?')) return;
        
        inicializarDocumentos();
        BD.documentosVeiculos = BD.documentosVeiculos.filter(function(d) { return d.id !== docId; });
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        var container = document.getElementById('lista-documentos-container');
        if (container) renderizarListaDocumentos(veiculoId, container);
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Documento excluído!', 'sucesso');
        }
        
    } catch (e) {
        console.error('Erro ao excluir documento:', e);
    }
}

function togglePagamentoDocumento(veiculoId, docId) {
    try {
        inicializarDocumentos();
        for (var i = 0; i < BD.documentosVeiculos.length; i++) {
            if (BD.documentosVeiculos[i].id === docId) {
                BD.documentosVeiculos[i].pago = !BD.documentosVeiculos[i].pago;
                break;
            }
        }
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        var container = document.getElementById('lista-documentos-container');
        if (container) renderizarListaDocumentos(veiculoId, container);
        
    } catch (e) {
        console.error('Erro:', e);
    }
}

function renderizarListaDocumentos(veiculoId, container) {
    try {
        inicializarDocumentos();
        
        var docs = BD.documentosVeiculos.filter(function(d) { return d.veiculoId === veiculoId; });
        
        // Ordenar por vencimento (mais próximo primeiro)
        docs.sort(function(a, b) {
            if (!a.dataVencimento) return 1;
            if (!b.dataVencimento) return -1;
            return new Date(a.dataVencimento) - new Date(b.dataVencimento);
        });
        
        if (docs.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:30px;color:#64748b;background:#f8fafc;border-radius:8px;">📭 Nenhum documento cadastrado para este veículo.</div>';
            return;
        }
        
        var tipoIcone = {
            'Licenciamento': '📋', 'IPVA': '💰', 'Multa': '⚠️', 'Seguro': '🛡️',
            'DPVAT': '🏥', 'CRLV': '📄', 'Inspecao': '🔍', 'Outro': '📎'
        };
        
        var html = '<div style="font-weight:600;color:#1e293b;margin-bottom:12px;font-size:15px;">📋 Documentos Cadastrados (' + docs.length + ')</div>';
        html += '<div style="display:grid;gap:10px;">';
        
        for (var d = 0; d < docs.length; d++) {
            var doc = docs[d];
            var status = getStatusVencimento(doc.dataVencimento);
            var icone = tipoIcone[doc.tipo] || '📎';
            var valorFormatado = doc.valor > 0 ? 'R$ ' + Number(doc.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '';
            
            html += 
                '<div style="background:white;border:1px solid #e2e8f0;border-radius:10px;padding:14px;display:flex;align-items:center;gap:14px;' + (doc.pago ? 'opacity:0.7;' : '') + '">' +
                    '<div style="font-size:28px;">' + icone + '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">' +
                            '<span style="font-weight:600;color:#1e293b;font-size:14px;">' + doc.tipo + '</span>' +
                            (doc.numero ? '<span style="font-size:12px;color:#64748b;">#' + doc.numero + '</span>' : '') +
                            '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:' + status.cor + '20;color:' + status.cor + ';font-weight:600;">' + status.texto + '</span>' +
                            (doc.pago ? '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#10b98120;color:#10b981;font-weight:600;">✓ Pago</span>' : '') +
                        '</div>' +
                        '<div style="font-size:12px;color:#64748b;display:flex;gap:16px;flex-wrap:wrap;">' +
                            (doc.dataEmissao ? '<span>Emissão: <strong>' + doc.dataEmissao + '</strong></span>' : '') +
                            '<span>Vencimento: <strong style="color:' + status.cor + ';">' + (doc.dataVencimento || '-') + '</strong></span>' +
                            (valorFormatado ? '<span>Valor: <strong>' + valorFormatado + '</strong></span>' : '') +
                        '</div>' +
                        (doc.observacao ? '<div style="font-size:12px;color:#94a3b8;margin-top:4px;">📝 ' + doc.observacao + '</div>' : '') +
                    '</div>' +
                    '<div style="display:flex;gap:6px;flex-shrink:0;">' +
                        '<button onclick="togglePagamentoDocumento(' + veiculoId + ',' + doc.id + ')" style="padding:6px 10px;border:1px solid #d1d5db;background:white;color:#374151;border-radius:6px;cursor:pointer;font-size:11px;" title="Marcar como pago">' + (doc.pago ? '↩️ Desfazer' : '✓ Pago') + '</button>' +
                        '<button onclick="excluirDocumento(' + veiculoId + ',' + doc.id + ')" style="padding:6px 10px;border:none;background:#fee2e2;color:#991b1b;border-radius:6px;cursor:pointer;font-size:11px;">🗑️ Excluir</button>' +
                    '</div>' +
                '</div>';
        }
        
        html += '</div>';
        container.innerHTML = html;
        
    } catch (e) {
        console.error('Erro ao renderizar documentos:', e);
    }
}

// ==================================================
// HISTÓRICO DE CONDUTORES
// ==================================================
function registrarHistoricoCondutor(veiculoId, motorista, tipo, observacao) {
    try {
        if (typeof BD === 'undefined') BD = {};
        if (!BD.historicoCondutores) BD.historicoCondutores = [];
        
        var hoje = new Date().toISOString().split('T')[0];
        for (var i = 0; i < BD.historicoCondutores.length; i++) {
            var h = BD.historicoCondutores[i];
            if (h.veiculoId === veiculoId && h.tipo === tipo && !h.dataFim) {
                h.dataFim = hoje;
            }
        }
        
        if (motorista && motorista.trim()) {
            BD.historicoCondutores.unshift({
                id: Date.now(),
                veiculoId: veiculoId,
                motorista: motorista.trim(),
                tipo: tipo,
                dataInicio: hoje,
                dataFim: null,
                observacao: observacao || '',
                registradoPor: window.usuarioAtual?.nome || 'Sistema'
            });
        }
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
    } catch (e) {
        console.error('Erro ao registrar historico:', e);
    }
}

function abrirModalVeiculo(id) {
    console.log('abrirModalVeiculo chamado, id:', id || 'novo');
    
    if (typeof ehAdmin === 'function' && !ehAdmin()) {
        alert('Voce nao tem permissao!');
        return;
    }
    
    var antigo = document.getElementById('modal-veiculo-final');
    if (antigo) antigo.remove();
    
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
    
    var categorias = ['Caminhao', 'Carro Passeio', 'Utilitario', 'Maquina', 'Van', 'Onibus', 'Moto', 'Outro'];
    if (typeof CONFIG !== 'undefined' && CONFIG.CATEGORIAS_VEICULOS && CONFIG.CATEGORIAS_VEICULOS.length > 0) {
        categorias = CONFIG.CATEGORIAS_VEICULOS;
    }
    
    var statusOptions = { disponivel: 'Disponivel', alocado: 'Alocado', manutencao: 'Manutencao', inativo: 'Inativo' };
    if (BD.config && BD.config.statusVeiculos && Object.keys(BD.config.statusVeiculos).length > 0) {
        statusOptions = BD.config.statusVeiculos;
    }
    
    var locais = BD.locais && BD.locais.length > 0 ? BD.locais : [{ id: 'padrao', nome: 'Patio Principal' }];
    
    var fundo = document.createElement('div');
    fundo.id = 'modal-veiculo-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    
    fundo.addEventListener('click', function(e) {
        if (e.target === fundo) fundo.remove();
    });
    
    var caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:600px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
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
    
    var corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    var form = document.createElement('form');
    form.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px;';
    form.onsubmit = function(e) {
        e.preventDefault();
        salvarVeiculoForm(id);
    };
    
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
    
    form.appendChild(criarCampo('Placa', 'text', 'vPlaca', veiculo ? veiculo.placa : '', 'ABC-1234', true));
    form.appendChild(criarCampo('Categoria', 'text', 'vCategoria', veiculo ? veiculo.categoria : '', '', true, opcoesCategoria));
    form.appendChild(criarCampo('Marca', 'text', 'vMarca', veiculo ? veiculo.marca : '', 'Ex: Volvo'));
    form.appendChild(criarCampo('Modelo', 'text', 'vModelo', veiculo ? veiculo.modelo : '', 'Ex: FH 540'));
    form.appendChild(criarCampo('Ano', 'number', 'vAno', veiculo ? veiculo.ano : ''));
    form.appendChild(criarCampo('KM Atual', 'number', 'vKm', veiculo ? veiculo.km_atual : ''));
    form.appendChild(criarCampo('Local/Obra', 'text', 'vObra', veiculo ? veiculo.obra_atual : '', '', false, opcoesLocais));
    form.appendChild(criarCampo('Status', 'text', 'vStatus', veiculo ? veiculo.status : 'disponivel', '', false, opcoesStatus));
    
    var grupoResp = criarCampo('Responsavel', 'text', 'vResponsavel', veiculo ? veiculo.responsavel : '', 'Nome do motorista/responsavel');
    grupoResp.style.gridColumn = 'span 2';
    form.appendChild(grupoResp);
    
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
    
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
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
        
        var veiculoAntigo = null;
        if (id && BD.veiculos) {
            for (var vi = 0; vi < BD.veiculos.length; vi++) {
                if (BD.veiculos[vi].id === id) {
                    veiculoAntigo = JSON.parse(JSON.stringify(BD.veiculos[vi]));
                    break;
                }
            }
        }
        
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
        
        if (veiculoAntigo && veiculoAntigo.responsavel !== dados.responsavel) {
            registrarHistoricoCondutor(dados.id, dados.responsavel, 'responsavel', 'Alteracao no cadastro');
        } else if (!veiculoAntigo && dados.responsavel) {
            registrarHistoricoCondutor(dados.id, dados.responsavel, 'responsavel', 'Cadastro inicial');
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

function verHistoricoCondutores(veiculoId) {
    try {
        if (typeof BD === 'undefined' || !BD.historicoCondutores) {
            alert('Nenhum historico registrado.');
            return;
        }
        
        var veiculo = null;
        if (BD.veiculos) {
            for (var i = 0; i < BD.veiculos.length; i++) {
                if (BD.veiculos[i].id === veiculoId) {
                    veiculo = BD.veiculos[i];
                    break;
                }
            }
        }
        
        var historico = BD.historicoCondutores.filter(function(h) {
            return h.veiculoId === veiculoId;
        });
        
        var antigo = document.getElementById('modal-historico-final');
        if (antigo) antigo.remove();
        
        var fundo = document.createElement('div');
        fundo.id = 'modal-historico-final';
        fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
        fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
        
        var caixa = document.createElement('div');
        caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:550px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
        
        var cabecalho = document.createElement('div');
        cabecalho.style.cssText = 'padding:16px 24px;background:#7c3aed;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
        var titulo = document.createElement('h3');
        titulo.style.cssText = 'margin:0;font-size:18px;';
        titulo.textContent = 'Historico de Condutores - ' + (veiculo ? veiculo.placa : '');
        cabecalho.appendChild(titulo);
        var btnFechar = document.createElement('button');
        btnFechar.textContent = '×';
        btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
        btnFechar.onclick = function() { fundo.remove(); };
        cabecalho.appendChild(btnFechar);
        
        var corpo = document.createElement('div');
        corpo.style.cssText = 'padding:24px;';
        
        if (historico.length === 0) {
            corpo.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;">Nenhum historico de condutor registrado para este veiculo.</div>';
        } else {
            var tipoCor = { responsavel: '#3b82f6', alocacao: '#f59e0b' };
            var tipoLabel = { responsavel: 'Responsavel', alocacao: 'Alocacao' };
            
            var html = '';
            for (var h = 0; h < historico.length; h++) {
                var item = historico[h];
                var cor = tipoCor[item.tipo] || '#6b7280';
                var label = tipoLabel[item.tipo] || item.tipo;
                
                var dataFim = item.dataFim || 'Atual';
                var dias = '';
                if (item.dataInicio) {
                    var d1 = new Date(item.dataInicio);
                    var d2 = item.dataFim ? new Date(item.dataFim) : new Date();
                    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                        var diff = Math.ceil(Math.abs(d2 - d1) / 86400000);
                        dias = ' (' + diff + ' dia' + (diff !== 1 ? 's' : '') + ')';
                    }
                }
                
                html += 
                    '<div style="display:flex;gap:16px;margin-bottom:20px;position:relative;padding-left:24px;">' +
                        (h < historico.length - 1 ? '<div style="position:absolute;left:7px;top:24px;width:2px;height:calc(100% + 8px);background:#e5e7eb;"></div>' : '') +
                        '<div style="position:absolute;left:0;top:4px;width:16px;height:16px;border-radius:50%;background:' + cor + ';border:3px solid white;box-shadow:0 0 0 2px ' + cor + ';"></div>' +
                        '<div style="flex:1;background:#f9fafb;border-radius:8px;padding:14px;border-left:3px solid ' + cor + ';">' +
                            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                                '<div style="font-weight:600;color:#0f172a;font-size:15px;">' + item.motorista + '</div>' +
                                '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:' + cor + '20;color:' + cor + ';font-weight:500;">' + label + '</span>' +
                            '</div>' +
                            '<div style="font-size:13px;color:#64748b;margin-bottom:4px;">' +
                                '<strong>Periodo:</strong> ' + item.dataInicio + ' ate ' + dataFim + dias +
                            '</div>' +
                            (item.observacao ? '<div style="font-size:12px;color:#94a3b8;"><strong>Obs:</strong> ' + item.observacao + '</div>' : '') +
                        '</div>' +
                    '</div>';
            }
            
            corpo.innerHTML = html;
        }
        
        caixa.appendChild(cabecalho);
        caixa.appendChild(corpo);
        fundo.appendChild(caixa);
        document.body.appendChild(fundo);
        
    } catch (e) {
        console.error(e);
        alert('Erro ao carregar historico');
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
window.verHistoricoCondutores = verHistoricoCondutores;
window.registrarHistoricoCondutor = registrarHistoricoCondutor;
window.abrirModalDocumentos = abrirModalDocumentos;
window.adicionarDocumento = adicionarDocumento;
window.excluirDocumento = excluirDocumento;
window.togglePagamentoDocumento = togglePagamentoDocumento;
window.renderizarListaDocumentos = renderizarListaDocumentos;
window.inicializarDocumentos = inicializarDocumentos;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarVeiculos);
} else {
    inicializarVeiculos();
}

function inicializarVeiculos() {
    try {
        inicializarDocumentos();
        
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
