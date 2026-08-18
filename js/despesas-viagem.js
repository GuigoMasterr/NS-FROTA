// ==================================================
// 💸 DESPESAS DE VIAGEM - SISTEMA COMPLETO
// ✅ Admin: libera adiantamento (origem, destino, veículo, valor, data, obs)
// ✅ Motorista: lança gastos (tipo, data, valor, foto comprovante, obs)
// ✅ Sistema de abatimento automático + estorno de saldo
// ==================================================

// ==================================================
// 🔧 UTILITÁRIOS
// ==================================================
function formatarMoedaSimples(valor) {
    return 'R$ ' + Number(valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getAdiantamentoById(id) {
    if (!BD.adiantamentos) return null;
    for (var i = 0; i < BD.adiantamentos.length; i++) {
        if (BD.adiantamentos[i].id === id) return BD.adiantamentos[i];
    }
    return null;
}

function calcularSaldosAdiantamento(adiantamento) {
    var liberado = Number(adiantamento.valor || 0);
    var prestado = Number(adiantamento.valorPrestado || 0);
    var estornado = Number(adiantamento.valorEstornado || 0);
    var saldo = liberado - prestado - estornado;
    return { liberado: liberado, prestado: prestado, estornado: estornado, saldo: saldo };
}

// ==================================================
// 📊 CARREGAR TABELA DE DESPESAS
// ==================================================
function carregarTabelaDespesasViagem() {
    try {
        var container = document.getElementById('listaDespesasViagem');
        if (!container) return;
        
        var despesas = (typeof BD !== 'undefined' && BD.gastosViagem) ? BD.gastosViagem.slice() : [];
        
        if (despesas.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#64748b;">Nenhuma despesa de viagem registrada</div>';
            return;
        }
        
        var html = '<div style="display:flex;flex-direction:column;gap:10px;">';
        for (var i = 0; i < despesas.length; i++) {
            var d = despesas[i];
            html += '<div style="padding:14px;background:white;border:1px solid #e5e7eb;border-radius:10px;display:flex;justify-content:space-between;align-items:center;">' +
                '<div>' +
                    '<div style="font-weight:600;color:#1e293b;">' + (d.descricao || d.tipo || 'Despesa') + '</div>' +
                    '<div style="font-size:12px;color:#64748b;margin-top:4px;">' + (d.data || '-') + ' • ' + (d.motorista || '-') + '</div>' +
                '</div>' +
                '<div style="font-weight:700;color:#dc2626;">' + formatarMoedaSimples(d.valor) + '</div>' +
            '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
        
    } catch (e) { console.error('Erro:', e); }
}

// ==================================================
// 💵 MODAL DE ADIANTAMENTO (Admin/Supervisor)
// ==================================================
function abrirModalAdiantamento() {
    console.log('abrirModalAdiantamento chamado');
    
    if (typeof BD === 'undefined' || !BD.veiculos || BD.veiculos.length === 0) {
        alert('Cadastre um veículo primeiro!');
        return;
    }
    
    if (typeof ehAdmin === 'function' && !ehAdmin()) {
        alert('Apenas administradores podem liberar adiantamentos!');
        return;
    }
    
    var antigo = document.getElementById('modal-adiantamento-final');
    if (antigo) antigo.remove();
    
    var fundo = document.createElement('div');
    fundo.id = 'modal-adiantamento-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
    
    var caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:520px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    var cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#7c3aed;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    var titulo = document.createElement('h3');
    titulo.style.cssText = 'margin:0;font-size:18px;';
    titulo.textContent = '💵 Liberar Adiantamento';
    cabecalho.appendChild(titulo);
    var btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    var corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    var form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
    form.onsubmit = function(e) { e.preventDefault(); salvarAdiantamentoForm(); };
    
    function addCampo(label, tipo, id, obrigatorio, opcoes) {
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
            input.innerHTML = '<option value="">Selecione...</option>' + opcoes.map(function(o) { return '<option value="' + o.valor + '">' + o.texto + '</option>'; }).join('');
        } else {
            input = document.createElement('input');
            input.type = tipo;
        }
        input.id = id;
        if (obrigatorio) input.required = true;
        input.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;background:white;';
        grupo.appendChild(input);
        return grupo;
    }
    
    // Opções de veículos
    var veiculosOpts = BD.veiculos.map(function(v) {
        return { valor: v.id, texto: v.placa + ' - ' + (v.modelo || '') };
    });
    
    // Opções de locais
    var locais = BD.origens || (BD.locais ? BD.locais.map(function(l) { return l.nome; }) : ['Pátio Principal', 'Obra', 'Outro']);
    var locaisOpts = locais.map(function(l) { return { valor: l, texto: l }; });
    
    // Opções de motoristas
    var motoristasOpts = [];
    if (BD.usuarios) {
        for (var u = 0; u < BD.usuarios.length; u++) {
            var usr = BD.usuarios[u];
            if (usr.perfil === 'motorista' || usr.perfil === 'operacional') {
                motoristasOpts.push({ valor: usr.nome, texto: usr.nome });
            }
        }
    }
    
    form.appendChild(addCampo('🚗 Veículo', 'text', 'adVeiculo', true, veiculosOpts));
    form.appendChild(addCampo('👤 Motorista', 'text', 'adMotorista', true, motoristasOpts.length > 0 ? motoristasOpts : null));
    form.appendChild(addCampo('📍 Origem', 'text', 'adOrigem', true, locaisOpts));
    form.appendChild(addCampo('🎯 Destino', 'text', 'adDestino', true, locaisOpts));
    form.appendChild(addCampo('📅 Data', 'date', 'adData', true));
    form.appendChild(addCampo('💰 Valor Liberado (R$)', 'number', 'adValor', true));
    
    // Observação
    var grupoObs = document.createElement('div');
    grupoObs.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    var lblObs = document.createElement('label');
    lblObs.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
    lblObs.textContent = '📝 Observação';
    grupoObs.appendChild(lblObs);
    var txtObs = document.createElement('textarea');
    txtObs.id = 'adObservacao';
    txtObs.rows = 2;
    txtObs.placeholder = 'Detalhes adicionais sobre a viagem...';
    txtObs.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;';
    grupoObs.appendChild(txtObs);
    form.appendChild(grupoObs);
    
    // Botões
    var rodape = document.createElement('div');
    rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:10px;';
    var btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;color:#374151;';
    btnCancelar.onclick = function() { fundo.remove(); };
    var btnSalvar = document.createElement('button');
    btnSalvar.type = 'submit';
    btnSalvar.textContent = '💵 Liberar';
    btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#7c3aed;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    form.appendChild(rodape);
    
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    
    document.getElementById('adData').value = new Date().toISOString().split('T')[0];
    console.log('Modal adiantamento ABERTO!');
}

function salvarAdiantamentoForm() {
    try {
        var veiculoId = document.getElementById('adVeiculo')?.value;
        var motorista = document.getElementById('adMotorista')?.value.trim();
        var origem = document.getElementById('adOrigem')?.value;
        var destino = document.getElementById('adDestino')?.value;
        var valor = parseFloat(document.getElementById('adValor')?.value);
        
        if (!veiculoId || !motorista || !origem || !destino || !valor || valor <= 0) {
            alert('⚠️ Preencha todos os campos obrigatórios!');
            return;
        }
        
        var veiculo = null;
        for (var v = 0; v < BD.veiculos.length; v++) {
            if (String(BD.veiculos[v].id) === String(veiculoId)) {
                veiculo = BD.veiculos[v];
                break;
            }
        }
        
        var dados = {
            id: Date.now(),
            veiculoId: Number(veiculoId),
            placa: veiculo ? veiculo.placa : '',
            motorista: motorista,
            origem: origem,
            destino: destino,
            data: document.getElementById('adData')?.value || new Date().toISOString().split('T')[0],
            valor: valor,
            valorPrestado: 0,
            valorEstornado: 0,
            observacao: document.getElementById('adObservacao')?.value.trim() || '',
            status: 'liberado',
            fechado: false,
            gastos: [],
            estornos: [],
            liberadoPor: window.usuarioAtual?.nome || 'Sistema',
            dataLiberacao: new Date().toISOString()
        };
        
        if (typeof BD === 'undefined') BD = { adiantamentos: [] };
        if (!BD.adiantamentos) BD.adiantamentos = [];
        BD.adiantamentos.unshift(dados);
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        document.getElementById('modal-adiantamento-final')?.remove();
        carregarAdiantamentos();
        
        if (typeof mostrarToast === 'function') mostrarToast('Adiantamento liberado!', 'sucesso');
        else alert('✅ Adiantamento liberado!');
        
    } catch (e) {
        console.error('Erro:', e);
        alert('❌ Erro ao salvar');
    }
}

// ==================================================
// 📋 CARREGAR ADIANTAMENTOS (VISUALIZAÇÃO PRINCIPAL)
// ==================================================
function carregarAdiantamentos() {
    try {
        var container = document.getElementById('listaAdiantamentos');
        if (!container) return;
        
        var adiantamentos = (typeof BD !== 'undefined' && BD.adiantamentos) ? BD.adiantamentos.slice() : [];
        
        if (adiantamentos.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#64748b;">Nenhum adiantamento liberado</div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < adiantamentos.length; i++) {
            var a = adiantamentos[i];
            var saldos = calcularSaldosAdiantamento(a);
            
            var statusTexto = a.fechado ? 'Fechado' : (saldos.saldo <= 0 ? 'Prestado' : 'Em Aberto');
            var statusCor = a.fechado ? '#6b7280' : (saldos.saldo <= 0 ? '#10b981' : '#f59e0b');
            var statusClasse = a.fechado ? 'fechado' : (saldos.saldo <= 0 ? 'prestado' : 'em-aberto');
            
            var percentual = saldos.liberado > 0 ? Math.min((saldos.prestado / saldos.liberado) * 100, 100) : 0;
            var saldoClasse = saldos.saldo > 0 ? 'saldo-positivo' : (saldos.saldo < 0 ? 'saldo-negativo' : 'saldo-zero');
            
            html += 
                '<div class="cartao-adiantamento ' + statusClasse + '" style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:16px;background:white;border-left:4px solid ' + statusCor + ';">' +
                    '<div class="adiantamento-header" style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:12px;">' +
                        '<div>' +
                            '<div class="adiantamento-motorista" style="font-weight:600;font-size:16px;color:#1e293b;">👤 ' + (a.motorista || '-') + '</div>' +
                            '<div class="adiantamento-info" style="font-size:13px;color:#64748b;margin-top:4px;">' +
                                '🚗 ' + (a.placa || 'Veículo') + ' • 📍 ' + (a.origem || '-') + ' → ' + (a.destino || '-') +
                            '</div>' +
                            '<div style="font-size:12px;color:#94a3b8;margin-top:2px;">📅 ' + (a.data || '-') + (a.observacao ? ' • 📝 ' + a.observacao : '') + '</div>' +
                        '</div>' +
                        '<div style="text-align:right;">' +
                            '<div class="adiantamento-valor" style="font-size:22px;font-weight:700;color:#7c3aed;">' + formatarMoedaSimples(saldos.liberado) + '</div>' +
                            '<span class="status-adiantamento" style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:500;color:white;background:' + statusCor + ';margin-top:8px;">' + statusTexto + '</span>' +
                        '</div>' +
                    '</div>' +
                    
                    // Barra de progresso
                    '<div class="adiantamento-progresso" style="margin-bottom:16px;">' +
                        '<div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:6px;">' +
                            '<span>Prestado: ' + formatarMoedaSimples(saldos.prestado) + '</span>' +
                            '<span>' + percentual.toFixed(0) + '%</span>' +
                        '</div>' +
                        '<div style="height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;">' +
                            '<div style="height:100%;width:' + percentual + '%;background:' + (percentual >= 100 ? '#10b981' : '#f59e0b') + ';transition:width 0.3s;"></div>' +
                        '</div>' +
                    '</div>' +
                    
                    // Saldos
                    '<div class="adiantamento-saldos ' + saldoClasse + '" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:12px;background:#f8fafc;border-radius:8px;margin-bottom:16px;">' +
                        '<div class="adiantamento-item"><div class="label" style="font-size:11px;color:#64748b;">Liberado</div><div class="valor" style="font-weight:600;color:#7c3aed;">' + formatarMoedaSimples(saldos.liberado) + '</div></div>' +
                        '<div class="adiantamento-item"><div class="label" style="font-size:11px;color:#64748b;">Gasto</div><div class="valor" style="font-weight:600;color:#dc2626;">' + formatarMoedaSimples(saldos.prestado) + '</div></div>' +
                        '<div class="adiantamento-item"><div class="label" style="font-size:11px;color:#64748b;">Estornado</div><div class="valor" style="font-weight:600;color:#059669;">' + formatarMoedaSimples(saldos.estornado) + '</div></div>' +
                        '<div class="adiantamento-item"><div class="label" style="font-size:11px;color:#64748b;">Saldo</div><div class="valor" style="font-weight:600;color:' + (saldos.saldo > 0 ? '#f59e0b' : (saldos.saldo < 0 ? '#dc2626' : '#10b981')) + ';">' + formatarMoedaSimples(saldos.saldo) + '</div></div>' +
                    '</div>' +
                    
                    // Botões de ação
                    '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                        (!a.fechado ? '<button onclick="abrirModalPrestacaoContas(' + a.id + ')" style="padding:8px 16px;border:none;background:#2563eb;color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">📝 Lançar Gasto</button>' : '') +
                        (!a.fechado && saldos.saldo > 0 ? '<button onclick="abrirModalEstorno(' + a.id + ')" style="padding:8px 16px;border:none;background:#059669;color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">↩️ Estornar Saldo</button>' : '') +
                        (!a.fechado && saldos.saldo <= 0 ? '<button onclick="fecharAdiantamento(' + a.id + ')" style="padding:8px 16px;border:none;background:#10b981;color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">✅ Fechar Conta</button>' : '') +
                        (!a.fechado ? '<button onclick="verDetalhesAdiantamento(' + a.id + ')" style="padding:8px 16px;border:1px solid #d1d5db;background:white;color:#374151;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">📋 Ver Gastos</button>' : '') +
                        '<button onclick="excluirAdiantamento(' + a.id + ')" style="padding:8px 16px;border:none;background:#fee2e2;color:#991b1b;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">🗑️ Excluir</button>' +
                    '</div>' +
                '</div>';
        }
        
        container.innerHTML = html;
        
    } catch (e) { console.error('Erro carregar adiantamentos:', e); }
}

// ==================================================
// 📝 MODAL DE PRESTAÇÃO DE CONTAS (Motorista lança gasto)
// ==================================================
function abrirModalPrestacaoContas(idAdiantamento) {
    try {
        var adiantamento = getAdiantamentoById(idAdiantamento);
        if (!adiantamento) return;
        
        var saldos = calcularSaldosAdiantamento(adiantamento);
        
        var antigo = document.getElementById('modal-prestacao-final');
        if (antigo) antigo.remove();
        
        var fundo = document.createElement('div');
        fundo.id = 'modal-prestacao-final';
        fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
        fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
        
        var caixa = document.createElement('div');
        caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:520px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
        
        var cabecalho = document.createElement('div');
        cabecalho.style.cssText = 'padding:16px 24px;background:#2563eb;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
        var titulo = document.createElement('h3');
        titulo.style.cssText = 'margin:0;font-size:18px;';
        titulo.textContent = '📝 Lançar Gasto';
        cabecalho.appendChild(titulo);
        var btnFechar = document.createElement('button');
        btnFechar.textContent = '×';
        btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
        btnFechar.onclick = function() { fundo.remove(); };
        cabecalho.appendChild(btnFechar);
        
        var corpo = document.createElement('div');
        corpo.style.cssText = 'padding:24px;';
        
        // Info do adiantamento
        var infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'background:#eff6ff;padding:14px 16px;border-radius:8px;margin-bottom:16px;font-size:13px;border:1px solid #bfdbfe;';
        infoDiv.innerHTML = 
            '<p style="margin:4px 0;"><strong>👤 Motorista:</strong> ' + adiantamento.motorista + '</p>' +
            '<p style="margin:4px 0;"><strong>🚗 Veículo:</strong> ' + (adiantamento.placa || '-') + '</p>' +
            '<p style="margin:4px 0;"><strong>💰 Valor liberado:</strong> ' + formatarMoedaSimples(saldos.liberado) + '</p>' +
            '<p style="margin:4px 0;"><strong>📊 Já gasto:</strong> ' + formatarMoedaSimples(saldos.prestado) + '</p>' +
            '<p style="margin:4px 0;font-weight:600;"><strong>💵 Saldo disponível:</strong> <span style="color:#f59e0b;">' + formatarMoedaSimples(saldos.saldo) + '</span></p>';
        corpo.appendChild(infoDiv);
        
        var form = document.createElement('form');
        form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
        form.onsubmit = function(e) { e.preventDefault(); salvarPrestacaoContas(idAdiantamento); };
        
        function addCampo(label, tipo, id, obrigatorio, opcoes) {
            var grupo = document.createElement('div');
            grupo.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
            var lbl = document.createElement('label');
            lbl.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
            lbl.innerHTML = label + (obrigatorio ? ' <span style="color:#dc2626;">*</span>' : '');
            grupo.appendChild(lbl);
            var input;
            if (opcoes) {
                input = document.createElement('select');
                input.innerHTML = '<option value="">Selecione o tipo de gasto...</option>' + opcoes.map(function(o) { return '<option value="' + o.valor + '">' + o.icone + ' ' + o.texto + '</option>'; }).join('');
            } else {
                input = document.createElement('input');
                input.type = tipo;
            }
            input.id = id;
            if (obrigatorio) input.required = true;
            input.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;background:white;';
            grupo.appendChild(input);
            return grupo;
        }
        
        // Tipos de gasto
        var tiposGasto = [
            { valor: 'Alimentação', icone: '🍽️', texto: 'Alimentação' },
            { valor: 'Hospedagem', icone: '🏨', texto: 'Hospedagem' },
            { valor: 'Pedágio', icone: '🛣️', texto: 'Pedágio' },
            { valor: 'Combustível', icone: '⛽', texto: 'Combustível' },
            { valor: 'Reparo Veicular', icone: '🔧', texto: 'Reparo Veicular' },
            { valor: 'Manutenção', icone: '🔩', texto: 'Manutenção' },
            { valor: 'Pneus', icone: '🛞', texto: 'Pneus' },
            { valor: 'Transporte', icone: '🚌', texto: 'Transporte' },
            { valor: 'Lavagem', icone: '🧼', texto: 'Lavagem' },
            { valor: 'Estacionamento', icone: '🅿️', texto: 'Estacionamento' },
            { valor: 'Outros', icone: '📦', texto: 'Outros' }
        ];
        
        form.appendChild(addCampo('📂 Tipo de Gasto', 'text', 'pcTipo', true, tiposGasto));
        form.appendChild(addCampo('📅 Data do Gasto', 'date', 'pcData', true));
        form.appendChild(addCampo('💰 Valor (R$)', 'number', 'pcValor', true));
        
        // Upload de comprovante
        var grupoArquivo = document.createElement('div');
        grupoArquivo.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        var lblArquivo = document.createElement('label');
        lblArquivo.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
        lblArquivo.innerHTML = '📷 Comprovante / Cupom';
        grupoArquivo.appendChild(lblArquivo);
        var inputArquivo = document.createElement('input');
        inputArquivo.type = 'file';
        inputArquivo.id = 'pcComprovante';
        inputArquivo.accept = 'image/*,.pdf';
        inputArquivo.capture = 'environment';
        inputArquivo.style.cssText = 'padding:8px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;background:white;';
        grupoArquivo.appendChild(inputArquivo);
        var infoArquivo = document.createElement('div');
        infoArquivo.id = 'pcComprovanteInfo';
        infoArquivo.style.cssText = 'font-size:11px;color:#64748b;margin-top:2px;';
        infoArquivo.textContent = '📸 Tire uma foto do cupom ou anexe um arquivo PDF/imagem (opcional)';
        grupoArquivo.appendChild(infoArquivo);
        form.appendChild(grupoArquivo);
        
        // Observação
        var grupoObs = document.createElement('div');
        grupoObs.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        var lblObs = document.createElement('label');
        lblObs.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
        lblObs.textContent = '📝 Observação';
        grupoObs.appendChild(lblObs);
        var txtObs = document.createElement('textarea');
        txtObs.id = 'pcObservacao';
        txtObs.rows = 2;
        txtObs.placeholder = 'Detalhes adicionais sobre este gasto...';
        txtObs.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;';
        grupoObs.appendChild(txtObs);
        form.appendChild(grupoObs);
        
        // Botões
        var rodape = document.createElement('div');
        rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:10px;';
        var btnCancelar = document.createElement('button');
        btnCancelar.type = 'button';
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;color:#374151;';
        btnCancelar.onclick = function() { fundo.remove(); };
        var btnSalvar = document.createElement('button');
        btnSalvar.type = 'submit';
        btnSalvar.textContent = '💾 Registrar Gasto';
        btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#2563eb;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
        rodape.appendChild(btnCancelar);
        rodape.appendChild(btnSalvar);
        form.appendChild(rodape);
        
        corpo.appendChild(form);
        caixa.appendChild(cabecalho);
        caixa.appendChild(corpo);
        fundo.appendChild(caixa);
        document.body.appendChild(fundo);
        
        document.getElementById('pcData').value = new Date().toISOString().split('T')[0];
        
    } catch (e) { console.error(e); }
}

function salvarPrestacaoContas(idAdiantamento) {
    try {
        var tipo = document.getElementById('pcTipo')?.value;
        var data = document.getElementById('pcData')?.value;
        var valor = parseFloat(document.getElementById('pcValor')?.value);
        
        if (!tipo || !data || !valor || valor <= 0) {
            alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        // Ler arquivo de comprovante
        var comprovanteNome = null;
        var comprovanteTipo = null;
        var comprovanteBase64 = null;
        
        var inputArquivo = document.getElementById('pcComprovante');
        var arquivo = inputArquivo && inputArquivo.files ? inputArquivo.files[0] : null;
        
        function finalizarSalvamento() {
            var adiantamento = getAdiantamentoById(idAdiantamento);
            if (!adiantamento) return;
            
            if (!adiantamento.gastos) adiantamento.gastos = [];
            
            var gasto = {
                id: Date.now(),
                tipo: tipo,
                data: data,
                valor: valor,
                observacao: document.getElementById('pcObservacao')?.value.trim() || '',
                comprovanteNome: comprovanteNome,
                comprovanteTipo: comprovanteTipo,
                comprovanteBase64: comprovanteBase64,
                registradoPor: window.usuarioAtual?.nome || 'Motorista',
                dataRegistro: new Date().toISOString()
            };
            
            adiantamento.gastos.push(gasto);
            adiantamento.valorPrestado = Number(adiantamento.valorPrestado || 0) + valor;
            
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
            
            document.getElementById('modal-prestacao-final')?.remove();
            carregarAdiantamentos();
            
            if (typeof mostrarToast === 'function') mostrarToast('Gasto registrado!', 'sucesso');
            else alert('✅ Gasto registrado!');
        }
        
        if (arquivo) {
            if (arquivo.size > 5 * 1024 * 1024) {
                alert('Arquivo muito grande! Máximo 5MB.');
                return;
            }
            
            var leitor = new FileReader();
            leitor.onload = function(e) {
                var base64Completo = e.target.result;
                var base64Apenas = base64Completo.split(',')[1] || base64Completo;
                comprovanteNome = arquivo.name;
                comprovanteTipo = arquivo.type;
                comprovanteBase64 = base64Apenas;
                finalizarSalvamento();
            };
            leitor.onerror = function() {
                alert('Erro ao ler o arquivo!');
                finalizarSalvamento();
            };
            leitor.readAsDataURL(arquivo);
        } else {
            finalizarSalvamento();
        }
        
    } catch (e) {
        console.error('Erro:', e);
        alert('❌ Erro ao salvar');
    }
}

// ==================================================
// ↩️ MODAL DE ESTORNO (Motorista devolve saldo)
// ==================================================
function abrirModalEstorno(idAdiantamento) {
    try {
        var adiantamento = getAdiantamentoById(idAdiantamento);
        if (!adiantamento) return;
        
        var saldos = calcularSaldosAdiantamento(adiantamento);
        
        if (saldos.saldo <= 0) {
            alert('Não há saldo para estornar!');
            return;
        }
        
        var antigo = document.getElementById('modal-estorno-final');
        if (antigo) antigo.remove();
        
        var fundo = document.createElement('div');
        fundo.id = 'modal-estorno-final';
        fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
        fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
        
        var caixa = document.createElement('div');
        caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:420px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
        
        caixa.innerHTML = 
            '<div style="padding:16px 24px;background:#059669;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;">' +
                '<h3 style="margin:0;font-size:18px;">↩️ Estornar Saldo</h3>' +
                '<button onclick="document.getElementById(\'modal-estorno-final\').remove()" style="background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;">×</button>' +
            '</div>' +
            '<div style="padding:24px;">' +
                '<div style="background:#ecfdf5;padding:14px 16px;border-radius:8px;margin-bottom:16px;border:1px solid #a7f3d0;">' +
                    '<p style="margin:4px 0;"><strong>👤 Motorista:</strong> ' + adiantamento.motorista + '</p>' +
                    '<p style="margin:4px 0;font-weight:600;"><strong>💰 Saldo a estornar:</strong> <span style="color:#059669;font-size:18px;">' + formatarMoedaSimples(saldos.saldo) + '</span></p>' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">' +
                    '<label style="font-size:14px;font-weight:500;color:#374151;">Valor do Estorno <span style="color:#dc2626;">*</span></label>' +
                    '<input type="number" id="estornoValor" value="' + saldos.saldo + '" step="0.01" min="0.01" max="' + saldos.saldo + '" style="padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;">' +
                '</div>' +
                '<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:20px;">' +
                    '<label style="font-size:14px;font-weight:500;color:#374151;">📝 Observação</label>' +
                    '<textarea id="estornoObs" rows="2" placeholder="Motivo do estorno..." style="padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;"></textarea>' +
                '</div>' +
                '<div style="display:flex;gap:12px;justify-content:flex-end;">' +
                    '<button onclick="document.getElementById(\'modal-estorno-final\').remove()" style="padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;color:#374151;">Cancelar</button>' +
                    '<button onclick="confirmarEstorno(' + idAdiantamento + ')" style="padding:10px 20px;border:none;background:#059669;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;">↩️ Confirmar Estorno</button>' +
                '</div>' +
            '</div>';
        
        document.body.appendChild(fundo);
        fundo.appendChild(caixa);
        
    } catch (e) { console.error(e); }
}

function confirmarEstorno(idAdiantamento) {
    try {
        var valor = parseFloat(document.getElementById('estornoValor')?.value);
        if (!valor || valor <= 0) {
            alert('Informe um valor válido!');
            return;
        }
        
        var adiantamento = getAdiantamentoById(idAdiantamento);
        if (!adiantamento) return;
        
        var saldos = calcularSaldosAdiantamento(adiantamento);
        if (valor > saldos.saldo) {
            alert('Valor maior que o saldo disponível!');
            return;
        }
        
        if (!adiantamento.estornos) adiantamento.estornos = [];
        adiantamento.estornos.push({
            id: Date.now(),
            valor: valor,
            observacao: document.getElementById('estornoObs')?.value.trim() || '',
            data: new Date().toISOString().split('T')[0],
            confirmadoPor: window.usuarioAtual?.nome || 'Sistema'
        });
        
        adiantamento.valorEstornado = Number(adiantamento.valorEstornado || 0) + valor;
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        document.getElementById('modal-estorno-final')?.remove();
        carregarAdiantamentos();
        
        if (typeof mostrarToast === 'function') mostrarToast('Estorno confirmado!', 'sucesso');
        else alert('✅ Estorno confirmado!');
        
    } catch (e) { console.error(e); }
}

// ==================================================
// 📋 VER DETALHES DO ADIANTAMENTO (todos os gastos)
// ==================================================
function verDetalhesAdiantamento(idAdiantamento) {
    try {
        var adiantamento = getAdiantamentoById(idAdiantamento);
        if (!adiantamento) return;
        
        var saldos = calcularSaldosAdiantamento(adiantamento);
        
        var antigo = document.getElementById('modal-detalhes-adiantamento');
        if (antigo) antigo.remove();
        
        var fundo = document.createElement('div');
        fundo.id = 'modal-detalhes-adiantamento';
        fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
        fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
        
        var caixa = document.createElement('div');
        caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:650px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
        
        var iconesTipo = {
            'Alimentação': '🍽️', 'Hospedagem': '🏨', 'Pedágio': '🛣️', 'Combustível': '⛽',
            'Reparo Veicular': '🔧', 'Manutenção': '🔩', 'Pneus': '🛞', 'Transporte': '🚌',
            'Lavagem': '🧼', 'Estacionamento': '🅿️', 'Outros': '📦'
        };
        
        var gastosHtml = '';
        if (adiantamento.gastos && adiantamento.gastos.length > 0) {
            for (var g = 0; g < adiantamento.gastos.length; g++) {
                var gasto = adiantamento.gastos[g];
                var icone = iconesTipo[gasto.tipo] || '📦';
                var temComprovante = gasto.comprovanteBase64;
                
                gastosHtml += 
                    '<div style="padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:8px;">' +
                        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">' +
                            '<div style="flex:1;">' +
                                '<div style="font-weight:600;color:#1e293b;font-size:14px;">' + icone + ' ' + gasto.tipo + '</div>' +
                                '<div style="font-size:12px;color:#64748b;margin-top:2px;">📅 ' + gasto.data + ' • 👤 ' + (gasto.registradoPor || '-') + '</div>' +
                                (gasto.observacao ? '<div style="font-size:12px;color:#94a3b8;margin-top:4px;">📝 ' + gasto.observacao + '</div>' : '') +
                            '</div>' +
                            '<div style="text-align:right;flex-shrink:0;">' +
                                '<div style="font-weight:700;color:#dc2626;">' + formatarMoedaSimples(gasto.valor) + '</div>' +
                                (temComprovante ? '<button onclick="verComprovanteGasto(' + idAdiantamento + ', ' + gasto.id + ')" style="margin-top:4px;padding:4px 10px;border:none;background:#0ea5e9;color:white;border-radius:4px;cursor:pointer;font-size:11px;">📷 Ver</button>' : '') +
                            '</div>' +
                        '</div>' +
                    '</div>';
            }
        } else {
            gastosHtml = '<div style="text-align:center;padding:30px;color:#64748b;background:#f8fafc;border-radius:8px;">📭 Nenhum gasto registrado ainda.</div>';
        }
        
        // Estornos
        var estornosHtml = '';
        if (adiantamento.estornos && adiantamento.estornos.length > 0) {
            estornosHtml = '<h4 style="margin:20px 0 10px;font-size:15px;color:#059669;">↩️ Estornos Realizados</h4>';
            for (var e = 0; e < adiantamento.estornos.length; e++) {
                var est = adiantamento.estornos[e];
                estornosHtml += 
                    '<div style="padding:10px 14px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;margin-bottom:6px;display:flex;justify-content:space-between;">' +
                        '<div><span style="font-size:12px;color:#64748b;">📅 ' + est.data + '</span>' + (est.observacao ? ' • 📝 ' + est.observacao : '') + '</div>' +
                        '<div style="font-weight:600;color:#059669;">' + formatarMoedaSimples(est.valor) + '</div>' +
                    '</div>';
            }
        }
        
        caixa.innerHTML = 
            '<div style="padding:16px 24px;background:#7c3aed;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;">' +
                '<h3 style="margin:0;font-size:18px;">📋 Detalhes da Viagem</h3>' +
                '<button onclick="document.getElementById(\'modal-detalhes-adiantamento\').remove()" style="background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;">×</button>' +
            '</div>' +
            '<div style="padding:24px;">' +
                '<div style="background:#f8fafc;padding:14px 16px;border-radius:8px;margin-bottom:16px;border:1px solid #e2e8f0;">' +
                    '<p style="margin:4px 0;"><strong>👤 Motorista:</strong> ' + adiantamento.motorista + '</p>' +
                    '<p style="margin:4px 0;"><strong>🚗 Veículo:</strong> ' + (adiantamento.placa || '-') + '</p>' +
                    '<p style="margin:4px 0;"><strong>📍 Roteiro:</strong> ' + (adiantamento.origem || '-') + ' → ' + (adiantamento.destino || '-') + '</p>' +
                    '<p style="margin:4px 0;"><strong>📅 Data:</strong> ' + (adiantamento.data || '-') + '</p>' +
                    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;">' +
                        '<div><div style="font-size:11px;color:#64748b;">Liberado</div><div style="font-weight:600;color:#7c3aed;">' + formatarMoedaSimples(saldos.liberado) + '</div></div>' +
                        '<div><div style="font-size:11px;color:#64748b;">Gasto</div><div style="font-weight:600;color:#dc2626;">' + formatarMoedaSimples(saldos.prestado) + '</div></div>' +
                        '<div><div style="font-size:11px;color:#64748b;">Saldo</div><div style="font-weight:600;color:' + (saldos.saldo > 0 ? '#f59e0b' : '#10b981') + ';">' + formatarMoedaSimples(saldos.saldo) + '</div></div>' +
                    '</div>' +
                '</div>' +
                '<h4 style="margin:0 0 10px;font-size:15px;color:#1e293b;">💰 Gastos Registrados (' + (adiantamento.gastos ? adiantamento.gastos.length : 0) + ')</h4>' +
                gastosHtml +
                estornosHtml +
            '</div>';
        
        document.body.appendChild(fundo);
        fundo.appendChild(caixa);
        
    } catch (e) { console.error(e); }
}

function verComprovanteGasto(idAdiantamento, gastoId) {
    try {
        var adiantamento = getAdiantamentoById(idAdiantamento);
        if (!adiantamento || !adiantamento.gastos) return;
        
        var gasto = null;
        for (var i = 0; i < adiantamento.gastos.length; i++) {
            if (adiantamento.gastos[i].id === gastoId) {
                gasto = adiantamento.gastos[i];
                break;
            }
        }
        
        if (!gasto || !gasto.comprovanteBase64) return;
        
        var mimeType = gasto.comprovanteTipo || 'application/octet-stream';
        var dataUrl = 'data:' + mimeType + ';base64,' + gasto.comprovanteBase64;
        
        var novaAba = window.open();
        if (novaAba) {
            if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
                novaAba.document.write(
                    '<!DOCTYPE html><html><head><title>' + gasto.comprovanteNome + '</title>' +
                    '<style>body{margin:0;padding:20px;background:#f1f5f9;font-family:Arial,sans-serif;text-align:center;}' +
                    'img,iframe{max-width:100%;max-height:90vh;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);}' +
                    '.header{margin-bottom:20px;}' +
                    '.btn-download{display:inline-block;padding:10px 20px;background:#0ea5e9;color:white;text-decoration:none;border-radius:6px;font-weight:500;}' +
                    '</style></head><body>' +
                    '<div class="header"><h2>📷 Comprovante - ' + gasto.tipo + '</h2>' +
                    '<p><a class="btn-download" href="' + dataUrl + '" download="' + gasto.comprovanteNome + '">⬇️ Baixar</a></p></div>' +
                    (mimeType.startsWith('image/') 
                        ? '<img src="' + dataUrl + '">' 
                        : '<iframe src="' + dataUrl + '" style="width:100%;height:85vh;border:none;"></iframe>') +
                    '</body></html>'
                );
            } else {
                var link = document.createElement('a');
                link.href = dataUrl;
                link.download = gasto.comprovanteNome;
                link.click();
            }
        }
    } catch (e) { console.error(e); }
}

// ==================================================
// ✅ FECHAR ADIANTAMENTO
// ==================================================
function fecharAdiantamento(id) {
    try {
        if (!confirm('Confirmar fechamento desta conta? Após fechado não poderá lançar mais gastos.')) return;
        
        var adiantamento = getAdiantamentoById(id);
        if (!adiantamento) return;
        
        adiantamento.fechado = true;
        adiantamento.status = 'fechado';
        adiantamento.dataFechamento = new Date().toISOString();
        adiantamento.fechadoPor = window.usuarioAtual?.nome || 'Sistema';
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        carregarAdiantamentos();
        
        if (typeof mostrarToast === 'function') mostrarToast('Conta fechada!', 'sucesso');
        else alert('✅ Conta fechada!');
        
    } catch (e) { console.error(e); }
}

// ==================================================
// 🗑️ EXCLUIR ADIANTAMENTO
// ==================================================
function excluirAdiantamento(id) {
    try {
        if (!confirm('Excluir este adiantamento? Todos os gastos serão perdidos!')) return;
        if (typeof BD !== 'undefined' && BD.adiantamentos) {
            BD.adiantamentos = BD.adiantamentos.filter(function(a) { return a.id !== id; });
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        carregarAdiantamentos();
    } catch (e) { console.error(e); }
}

// ==================================================
// 🔄 TROCAR ABA
// ==================================================
function trocarAbaDespesas(aba) {
    try {
        var abaAdiantamentos = document.getElementById('aba-adiantamentos');
        var abaGastos = document.getElementById('aba-gastos');
        
        var botoes = document.querySelectorAll('.aba-btn[data-aba]');
        for (var i = 0; i < botoes.length; i++) {
            botoes[i].classList.remove('ativa');
            if (botoes[i].getAttribute('data-aba') === aba) {
                botoes[i].classList.add('ativa');
            }
        }
        
        if (abaAdiantamentos) abaAdiantamentos.style.display = aba === 'adiantamentos' ? 'block' : 'none';
        if (abaGastos) abaGastos.style.display = aba === 'gastos' ? 'block' : 'none';
        
    } catch (e) { console.error(e); }
}

// ==================================================
// 📤 EXPORTA FUNÇÕES
// ==================================================
window.carregarTabelaDespesasViagem = carregarTabelaDespesasViagem;
window.abrirModalAdiantamento = abrirModalAdiantamento;
window.salvarAdiantamentoForm = salvarAdiantamentoForm;
window.carregarAdiantamentos = carregarAdiantamentos;
window.abrirModalPrestacaoContas = abrirModalPrestacaoContas;
window.salvarPrestacaoContas = salvarPrestacaoContas;
window.abrirModalEstorno = abrirModalEstorno;
window.confirmarEstorno = confirmarEstorno;
window.verDetalhesAdiantamento = verDetalhesAdiantamento;
window.verComprovanteGasto = verComprovanteGasto;
window.fecharAdiantamento = fecharAdiantamento;
window.excluirAdiantamento = excluirAdiantamento;
window.trocarAbaDespesas = trocarAbaDespesas;
window.calcularSaldosAdiantamento = calcularSaldosAdiantamento;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ despesas-viagem.js inicializado');
        carregarAdiantamentos();
    });
} else {
    console.log('✅ despesas-viagem.js inicializado');
}
