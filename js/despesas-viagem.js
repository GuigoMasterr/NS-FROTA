// ==================================================
// 💸 DESPESAS DE VIAGEM - VERSÃO CORRIGIDA
// ✅ Modal funcionando - sem template strings
// ==================================================

function carregarTabelaDespesasViagem() {
    try {
        var container = document.getElementById('listaDespesasViagem');
        if (!container) return;
        
        var despesas = (typeof BD !== 'undefined' && BD.despesasViagem) ? BD.despesasViagem.slice() : [];
        
        if (despesas.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#64748b;">Nenhuma despesa de viagem registrada</div>';
            return;
        }
        
        var statusCor = { Pendente: '#f59e0b', Aprovada: '#10b981', Rejeitada: '#dc2626' };
        var html = '';
        
        for (var d = 0; d < despesas.length; d++) {
            var dv = despesas[d];
            var veiculo = null;
            if (BD.veiculos) {
                for (var v = 0; v < BD.veiculos.length; v++) {
                    if (String(BD.veiculos[v].id) === String(dv.veiculoId)) {
                        veiculo = BD.veiculos[v];
                        break;
                    }
                }
            }
            
            var total = 0;
            var itensHtml = '';
            if (dv.itens && dv.itens.length > 0) {
                for (var it = 0; it < dv.itens.length; it++) {
                    var item = dv.itens[it];
                    var valorItem = Number(item.valor || 0);
                    total += valorItem;
                    itensHtml += 
                        '<div style="padding:6px 0;border-bottom:1px solid #f9fafb;">' + (item.descricao || '-') + '</div>' +
                        '<div style="padding:6px 0;border-bottom:1px solid #f9fafb;">' + (item.quantidade || 1) + '</div>' +
                        '<div style="padding:6px 0;border-bottom:1px solid #f9fafb;text-align:right;font-weight:500;">' + formatarMoedaSimples(valorItem) + '</div>';
                }
            }
            
            var corStatus = statusCor[dv.status] || '#6b7280';
            
            html += 
                '<div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:16px;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.05);">' +
                    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:12px;">' +
                        '<div>' +
                            '<h4 style="margin:0 0 8px 0;font-size:16px;color:#0f172a;">Viagem - ' + (veiculo ? veiculo.placa : 'Veiculo nao encontrado') + '</h4>' +
                            '<p style="margin:4px 0;font-size:13px;color:#64748b;"><strong>Motorista:</strong> ' + (dv.motorista || '-') + '</p>' +
                            '<p style="margin:4px 0;font-size:13px;color:#64748b;"><strong>Data:</strong> ' + (dv.data || '-') + '</p>' +
                            '<p style="margin:4px 0;font-size:13px;color:#64748b;"><strong>Destino:</strong> ' + (dv.destino || '-') + '</p>' +
                        '</div>' +
                        '<div style="text-align:right;">' +
                            '<div style="font-size:22px;font-weight:700;color:#dc2626;margin-bottom:8px;">' + formatarMoedaSimples(total) + '</div>' +
                            '<span style="display:inline-block;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:500;color:white;background:' + corStatus + ';">' + (dv.status || 'Pendente') + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div style="border-top:1px solid #f3f4f6;padding-top:12px;">' +
                        '<h5 style="margin:0 0 10px 0;font-size:13px;color:#374151;">Itens da despesa:</h5>' +
                        '<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;font-size:13px;">' +
                            itensHtml +
                        '</div>' +
                    '</div>' +
                    (dv.status === 'Pendente' ? 
                        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;padding-top:16px;border-top:1px solid #f3f4f6;">' +
                            '<button onclick="rejeitarDespesaViagem(' + dv.id + ')" style="padding:8px 16px;border:none;background:#dc2626;color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">Rejeitar</button>' +
                            '<button onclick="aprovarDespesaViagem(' + dv.id + ')" style="padding:8px 16px;border:none;background:#10b981;color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">Aprovar</button>' +
                        '</div>' : '') +
                '</div>';
        }
        
        container.innerHTML = html;
        
    } catch (e) {
        console.error('Erro carregar despesas viagem:', e);
    }
}

function formatarMoedaSimples(valor) {
    try {
        var n = Number(valor);
        if (isNaN(n)) return 'R$ 0,00';
        return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (e) {
        return 'R$ 0,00';
    }
}

function abrirModalDespesaViagem() {
    console.log('abrirModalDespesaViagem chamado');
    
    if (typeof BD === 'undefined' || !BD.veiculos || BD.veiculos.length === 0) {
        alert('Cadastre um veiculo primeiro!');
        return;
    }
    
    var antigo = document.getElementById('modal-despesa-final');
    if (antigo) antigo.remove();
    
    // ==========================================
    // CRIA O MODAL
    // ==========================================
    
    var fundo = document.createElement('div');
    fundo.id = 'modal-despesa-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    
    fundo.addEventListener('click', function(e) {
        if (e.target === fundo) fundo.remove();
    });
    
    var caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:550px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    // Cabecalho
    var cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#0891b2;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    
    var titulo = document.createElement('h3');
    titulo.style.cssText = 'margin:0;font-size:18px;';
    titulo.textContent = 'Nova Despesa de Viagem';
    cabecalho.appendChild(titulo);
    
    var btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    // Corpo
    var corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    // Formulario
    var form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
    form.onsubmit = function(e) {
        e.preventDefault();
        salvarDespesaViagemForm();
    };
    
    // Funcao auxiliar para criar campos
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
            var optVazia = document.createElement('option');
            optVazia.value = '';
            optVazia.textContent = 'Selecione...';
            input.appendChild(optVazia);
            for (var i = 0; i < opcoes.length; i++) {
                var opt = document.createElement('option');
                opt.value = opcoes[i].valor;
                opt.textContent = opcoes[i].texto;
                input.appendChild(opt);
            }
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
    
    // Prepara opcoes de veiculos
    var veiculosOpts = [];
    for (var v = 0; v < BD.veiculos.length; v++) {
        var veic = BD.veiculos[v];
        veiculosOpts.push({
            valor: veic.id,
            texto: veic.placa + ' - ' + (veic.modelo || '')
        });
    }
    
    // Campos principais
    form.appendChild(addCampo('Veiculo', 'text', 'dvVeiculo', true, veiculosOpts));
    form.appendChild(addCampo('Motorista', 'text', 'dvMotorista', true));
    form.appendChild(addCampo('Destino', 'text', 'dvDestino', true));
    form.appendChild(addCampo('Data', 'date', 'dvData', true));
    
    // Label itens
    var lblItens = document.createElement('label');
    lblItens.style.cssText = 'font-size:14px;font-weight:500;color:#374151;margin-bottom:-6px;';
    lblItens.textContent = 'Itens da Despesa:';
    form.appendChild(lblItens);
    
    // Container de itens
    var containerItens = document.createElement('div');
    containerItens.id = 'dvItensContainer';
    containerItens.style.cssText = 'border:1px solid #e5e7eb;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:10px;';
    
    function adicionarItem() {
        var itemDiv = document.createElement('div');
        itemDiv.style.cssText = 'display:grid;grid-template-columns:2fr 80px 1fr auto;gap:8px;align-items:center;';
        
        var inpDesc = document.createElement('input');
        inpDesc.type = 'text';
        inpDesc.placeholder = 'Descricao';
        inpDesc.className = 'dv-item-desc';
        inpDesc.style.cssText = 'padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;';
        
        var inpQtd = document.createElement('input');
        inpQtd.type = 'number';
        inpQtd.placeholder = 'Qtd';
        inpQtd.value = '1';
        inpQtd.min = '1';
        inpQtd.className = 'dv-item-qtd';
        inpQtd.style.cssText = 'padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;';
        
        var inpValor = document.createElement('input');
        inpValor.type = 'number';
        inpValor.placeholder = 'Valor R$';
        inpValor.step = '0.01';
        inpValor.min = '0';
        inpValor.className = 'dv-item-valor';
        inpValor.style.cssText = 'padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;';
        
        var btnRemover = document.createElement('button');
        btnRemover.type = 'button';
        btnRemover.textContent = '×';
        btnRemover.style.cssText = 'padding:8px 12px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:13px;';
        btnRemover.onclick = function() { itemDiv.remove(); };
        
        itemDiv.appendChild(inpDesc);
        itemDiv.appendChild(inpQtd);
        itemDiv.appendChild(inpValor);
        itemDiv.appendChild(btnRemover);
        containerItens.appendChild(itemDiv);
    }
    
    adicionarItem(); // Primeiro item padrao
    form.appendChild(containerItens);
    
    // Botao adicionar item
    var btnAddItem = document.createElement('button');
    btnAddItem.type = 'button';
    btnAddItem.textContent = '+ Adicionar Item';
    btnAddItem.style.cssText = 'padding:8px 16px;border:1px dashed #0891b2;background:#ecfeff;color:#0891b2;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;';
    btnAddItem.onclick = adicionarItem;
    form.appendChild(btnAddItem);
    
    // Botoes
    var rodape = document.createElement('div');
    rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:10px;';
    
    var btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    btnCancelar.onclick = function() { fundo.remove(); };
    
    var btnSalvar = document.createElement('button');
    btnSalvar.type = 'submit';
    btnSalvar.textContent = 'Salvar';
    btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#0891b2;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    
    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    form.appendChild(rodape);
    
    // Monta tudo
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    
    // Data padrao = hoje
    var dataHoje = new Date().toISOString().split('T')[0];
    document.getElementById('dvData').value = dataHoje;
    
    console.log('Modal despesa viagem ABERTO!');
}

function salvarDespesaViagemForm() {
    try {
        var veiculoId = document.getElementById('dvVeiculo')?.value;
        var motorista = document.getElementById('dvMotorista')?.value.trim();
        var destino = document.getElementById('dvDestino')?.value.trim();
        
        if (!veiculoId || !motorista || !destino) {
            alert('Preencha os campos obrigatorios!');
            return;
        }
        
        // Coleta itens
        var itens = [];
        var itensDivs = document.querySelectorAll('#dvItensContainer > div');
        for (var i = 0; i < itensDivs.length; i++) {
            var div = itensDivs[i];
            var desc = div.querySelector('.dv-item-desc')?.value.trim();
            var qtd = parseFloat(div.querySelector('.dv-item-qtd')?.value) || 1;
            var valor = parseFloat(div.querySelector('.dv-item-valor')?.value) || 0;
            if (desc && valor > 0) {
                itens.push({ descricao: desc, quantidade: qtd, valor: valor });
            }
        }
        
        if (itens.length === 0) {
            alert('Adicione pelo menos um item de despesa!');
            return;
        }
        
        var dados = {
            id: Date.now(),
            veiculoId: Number(veiculoId),
            motorista: motorista,
            destino: destino,
            data: document.getElementById('dvData')?.value || new Date().toISOString().split('T')[0],
            itens: itens,
            status: 'Pendente',
            criadoPor: window.usuarioAtual?.nome || 'Sistema'
        };
        
        if (typeof BD === 'undefined') BD = { despesasViagem: [] };
        if (!BD.despesasViagem) BD.despesasViagem = [];
        BD.despesasViagem.unshift(dados);
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        var modal = document.getElementById('modal-despesa-final');
        if (modal) modal.remove();
        
        carregarTabelaDespesasViagem();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Despesa registrada!', 'sucesso');
        } else {
            alert('Despesa registrada!');
        }
        
    } catch (e) {
        console.error('Erro ao salvar:', e);
        alert('Erro ao salvar');
    }
}

function aprovarDespesaViagem(id) {
    try {
        if (!confirm('Aprovar esta despesa?')) return;
        
        if (typeof BD !== 'undefined' && BD.despesasViagem) {
            for (var i = 0; i < BD.despesasViagem.length; i++) {
                if (BD.despesasViagem[i].id === id) {
                    BD.despesasViagem[i].status = 'Aprovada';
                    BD.despesasViagem[i].aprovadoPor = window.usuarioAtual?.nome || 'Sistema';
                    BD.despesasViagem[i].dataAprovacao = new Date().toISOString().split('T')[0];
                    break;
                }
            }
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarTabelaDespesasViagem();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Despesa aprovada!', 'sucesso');
        } else {
            alert('Despesa aprovada!');
        }
        
    } catch (e) {
        console.error(e);
    }
}

function rejeitarDespesaViagem(id) {
    try {
        if (!confirm('Rejeitar esta despesa?')) return;
        
        if (typeof BD !== 'undefined' && BD.despesasViagem) {
            for (var i = 0; i < BD.despesasViagem.length; i++) {
                if (BD.despesasViagem[i].id === id) {
                    BD.despesasViagem[i].status = 'Rejeitada';
                    BD.despesasViagem[i].rejeitadoPor = window.usuarioAtual?.nome || 'Sistema';
                    BD.despesasViagem[i].dataRejeicao = new Date().toISOString().split('T')[0];
                    break;
                }
            }
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarTabelaDespesasViagem();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Despesa rejeitada!', 'aviso');
        } else {
            alert('Despesa rejeitada!');
        }
        
    } catch (e) {
        console.error(e);
    }
}

window.carregarTabelaDespesasViagem = carregarTabelaDespesasViagem;
window.abrirModalDespesaViagem = abrirModalDespesaViagem;
window.aprovarDespesaViagem = aprovarDespesaViagem;
window.rejeitarDespesaViagem = rejeitarDespesaViagem;

// Inicializacao
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('despesas-viagem.js inicializado');
    });
} else {
    console.log('despesas-viagem.js inicializado');
}

// ==================================================
// 💰 ADIANTAMENTOS - FUNCIONALIDADE COMPLETA
// ✅ Modal funcionando + troca de abas
// ==================================================

function trocarAbaDespesas(aba) {
    try {
        // Atualiza botoes
        var botoes = document.querySelectorAll('.aba-btn');
        for (var i = 0; i < botoes.length; i++) {
            botoes[i].classList.remove('ativo');
            if (botoes[i].getAttribute('data-aba') === aba) {
                botoes[i].classList.add('ativo');
            }
        }
        
        // Mostra aba correta
        var abaAdiantamentos = document.getElementById('aba-adiantamentos');
        var abaGastos = document.getElementById('aba-gastos');
        
        if (abaAdiantamentos) abaAdiantamentos.style.display = 'none';
        if (abaGastos) abaGastos.style.display = 'none';
        
        if (aba === 'adiantamentos') {
            if (abaAdiantamentos) abaAdiantamentos.style.display = 'block';
            carregarAdiantamentos();
        } else {
            if (abaGastos) abaGastos.style.display = 'block';
            carregarTabelaDespesasViagem();
        }
        
    } catch (e) {
        console.error('Erro ao trocar aba:', e);
    }
}

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
            var veiculo = null;
            if (BD.veiculos) {
                for (var v = 0; v < BD.veiculos.length; v++) {
                    if (String(BD.veiculos[v].id) === String(a.veiculoId)) {
                        veiculo = BD.veiculos[v];
                        break;
                    }
                }
            }
            
            var valorLiberado = Number(a.valor || 0);
            var valorPrestado = Number(a.valorPrestado || 0);
            var saldo = valorLiberado - valorPrestado;
            var percentual = valorLiberado > 0 ? Math.min(100, (valorPrestado / valorLiberado) * 100) : 0;
            
            var statusClasse = '';
            var statusTexto = 'Ativo';
            var statusCor = '#2563eb';
            if (a.status === 'Fechado') {
                statusClasse = 'fechado';
                statusTexto = 'Fechado';
                statusCor = '#10b981';
            } else if (valorPrestado > 0) {
                statusClasse = 'parcial';
                statusTexto = 'Prestacao Parcial';
                statusCor = '#f59e0b';
            }
            
            var saldoClasse = saldo === 0 ? 'saldo-zerado' : (saldo > 0 ? 'saldo-positivo' : 'saldo-negativo');
            
            html += 
                '<div class="cartao-adiantamento ' + statusClasse + '" style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:16px;background:white;border-left:4px solid ' + statusCor + ';">' +
                    '<div class="adiantamento-header" style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:12px;">' +
                        '<div>' +
                            '<div class="adiantamento-motorista">' + (a.motorista || '-') + '</div>' +
                            '<div class="adiantamento-info" style="font-size:13px;color:#64748b;margin-top:4px;">' +
                                'Veiculo: ' + (veiculo ? veiculo.placa : '-') + ' | ' +
                                'Data: ' + (a.data || '-') + ' | ' +
                                'Destino: ' + (a.destino || '-') +
                            '</div>' +
                        '</div>' +
                        '<div style="text-align:right;">' +
                            '<div class="adiantamento-valor" style="font-size:22px;font-weight:700;color:#2563eb;">' + formatarMoedaSimples(valorLiberado) + '</div>' +
                            '<span class="status-adiantamento" style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:500;color:white;background:' + statusCor + ';margin-top:8px;">' + statusTexto + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="adiantamento-progresso" style="margin-bottom:16px;">' +
                        '<div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:6px;">' +
                            '<span>Prestado: ' + formatarMoedaSimples(valorPrestado) + '</span>' +
                            '<span>' + percentual.toFixed(0) + '%</span>' +
                        '</div>' +
                        '<div style="height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;">' +
                            '<div style="height:100%;width:' + percentual + '%;background:' + statusCor + ';transition:width 0.3s;"></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="adiantamento-saldos ' + saldoClasse + '" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px;background:#f8fafc;border-radius:8px;margin-bottom:16px;">' +
                        '<div class="adiantamento-item"><div class="label" style="font-size:11px;color:#64748b;">Liberado</div><div class="valor" style="font-weight:600;color:#0f172a;">' + formatarMoedaSimples(valorLiberado) + '</div></div>' +
                        '<div class="adiantamento-item"><div class="label" style="font-size:11px;color:#64748b;">Prestado</div><div class="valor" style="font-weight:600;color:#0f172a;">' + formatarMoedaSimples(valorPrestado) + '</div></div>' +
                        '<div class="adiantamento-item"><div class="label" style="font-size:11px;color:#64748b;">Saldo</div><div class="valor" style="font-weight:600;color:' + (saldo > 0 ? '#059669' : (saldo < 0 ? '#dc2626' : '#64748b')) + ';">' + formatarMoedaSimples(saldo) + '</div></div>' +
                    '</div>' +
                    (a.status !== 'Fechado' ? 
                        '<div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap;">' +
                            '<button onclick="abrirModalPrestacaoContas(' + a.id + ')" style="padding:8px 16px;border:none;background:#2563eb;color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">Prestar Contas</button>' +
                            (saldo <= 0 ? '<button onclick="fecharAdiantamento(' + a.id + ')" style="padding:8px 16px;border:none;background:#10b981;color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">Fechar</button>' : '') +
                            '<button onclick="excluirAdiantamento(' + a.id + ')" style="padding:8px 16px;border:none;background:#ef4444;color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">Excluir</button>' +
                        '</div>' : '') +
                '</div>';
        }
        
        container.innerHTML = html;
        
    } catch (e) {
        console.error('Erro carregar adiantamentos:', e);
    }
}

function abrirModalAdiantamento() {
    console.log('abrirModalAdiantamento chamado');
    
    if (typeof BD === 'undefined' || !BD.veiculos || BD.veiculos.length === 0) {
        alert('Cadastre um veiculo primeiro!');
        return;
    }
    
    var antigo = document.getElementById('modal-adiantamento-final');
    if (antigo) antigo.remove();
    
    var fundo = document.createElement('div');
    fundo.id = 'modal-adiantamento-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    
    fundo.addEventListener('click', function(e) {
        if (e.target === fundo) fundo.remove();
    });
    
    var caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:480px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    // Cabecalho
    var cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#7c3aed;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    
    var titulo = document.createElement('h3');
    titulo.style.cssText = 'margin:0;font-size:18px;';
    titulo.textContent = 'Liberar Adiantamento';
    cabecalho.appendChild(titulo);
    
    var btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    // Corpo
    var corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    var form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
    form.onsubmit = function(e) {
        e.preventDefault();
        salvarAdiantamentoForm();
    };
    
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
            var optVazia = document.createElement('option');
            optVazia.value = '';
            optVazia.textContent = 'Selecione...';
            input.appendChild(optVazia);
            for (var i = 0; i < opcoes.length; i++) {
                var opt = document.createElement('option');
                opt.value = opcoes[i].valor;
                opt.textContent = opcoes[i].texto;
                input.appendChild(opt);
            }
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
    
    var veiculosOpts = [];
    for (var v = 0; v < BD.veiculos.length; v++) {
        var veic = BD.veiculos[v];
        veiculosOpts.push({
            valor: veic.id,
            texto: veic.placa + ' - ' + (veic.modelo || '')
        });
    }
    
    form.appendChild(addCampo('Veiculo', 'text', 'adVeiculo', true, veiculosOpts));
    form.appendChild(addCampo('Motorista', 'text', 'adMotorista', true));
    form.appendChild(addCampo('Destino', 'text', 'adDestino', true));
    form.appendChild(addCampo('Data', 'date', 'adData', true));
    form.appendChild(addCampo('Valor Liberado (R$)', 'number', 'adValor', true));
    
    // Observacao
    var grupoObs = document.createElement('div');
    grupoObs.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    var lblObs = document.createElement('label');
    lblObs.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
    lblObs.textContent = 'Observacao';
    grupoObs.appendChild(lblObs);
    var txtObs = document.createElement('textarea');
    txtObs.id = 'adObservacao';
    txtObs.rows = 2;
    txtObs.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;';
    grupoObs.appendChild(txtObs);
    form.appendChild(grupoObs);
    
    // Botoes
    var rodape = document.createElement('div');
    rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:10px;';
    
    var btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    btnCancelar.onclick = function() { fundo.remove(); };
    
    var btnSalvar = document.createElement('button');
    btnSalvar.type = 'submit';
    btnSalvar.textContent = 'Liberar';
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
        var destino = document.getElementById('adDestino')?.value.trim();
        var valor = parseFloat(document.getElementById('adValor')?.value);
        
        if (!veiculoId || !motorista || !destino || !valor || valor <= 0) {
            alert('Preencha todos os campos obrigatorios com valores validos!');
            return;
        }
        
        var dados = {
            id: Date.now(),
            veiculoId: Number(veiculoId),
            motorista: motorista,
            destino: destino,
            data: document.getElementById('adData')?.value || new Date().toISOString().split('T')[0],
            valor: valor,
            valorPrestado: 0,
            observacao: document.getElementById('adObservacao')?.value.trim() || '',
            status: 'Ativo',
            prestacoes: [],
            liberadoPor: window.usuarioAtual?.nome || 'Sistema'
        };
        
        if (typeof BD === 'undefined') BD = { adiantamentos: [] };
        if (!BD.adiantamentos) BD.adiantamentos = [];
        BD.adiantamentos.unshift(dados);
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        document.getElementById('modal-adiantamento-final')?.remove();
        carregarAdiantamentos();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Adiantamento liberado!', 'sucesso');
        } else {
            alert('Adiantamento liberado!');
        }
        
    } catch (e) {
        console.error('Erro:', e);
        alert('Erro ao salvar');
    }
}

function abrirModalPrestacaoContas(idAdiantamento) {
    try {
        var adiantamento = null;
        if (BD.adiantamentos) {
            for (var i = 0; i < BD.adiantamentos.length; i++) {
                if (BD.adiantamentos[i].id === idAdiantamento) {
                    adiantamento = BD.adiantamentos[i];
                    break;
                }
            }
        }
        if (!adiantamento) return;
        
        var antigo = document.getElementById('modal-prestacao-final');
        if (antigo) antigo.remove();
        
        var fundo = document.createElement('div');
        fundo.id = 'modal-prestacao-final';
        fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
        fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
        
        var caixa = document.createElement('div');
        caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:450px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
        
        var cabecalho = document.createElement('div');
        cabecalho.style.cssText = 'padding:16px 24px;background:#2563eb;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
        var titulo = document.createElement('h3');
        titulo.style.cssText = 'margin:0;font-size:18px;';
        titulo.textContent = 'Prestacao de Contas';
        cabecalho.appendChild(titulo);
        var btnFechar = document.createElement('button');
        btnFechar.textContent = '×';
        btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
        btnFechar.onclick = function() { fundo.remove(); };
        cabecalho.appendChild(btnFechar);
        
        var corpo = document.createElement('div');
        corpo.style.cssText = 'padding:24px;';
        
        // Info do adiantamento
        var saldoRestante = Number(adiantamento.valor || 0) - Number(adiantamento.valorPrestado || 0);
        var infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'background:#eff6ff;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:13px;';
        infoDiv.innerHTML = 
            '<p style="margin:4px 0;"><strong>Motorista:</strong> ' + adiantamento.motorista + '</p>' +
            '<p style="margin:4px 0;"><strong>Valor liberado:</strong> ' + formatarMoedaSimples(adiantamento.valor) + '</p>' +
            '<p style="margin:4px 0;"><strong>Ja prestado:</strong> ' + formatarMoedaSimples(adiantamento.valorPrestado) + '</p>' +
            '<p style="margin:4px 0;font-weight:600;"><strong>Saldo a prestar:</strong> <span style="color:#dc2626;">' + formatarMoedaSimples(saldoRestante) + '</span></p>';
        corpo.appendChild(infoDiv);
        
        var form = document.createElement('form');
        form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
        form.onsubmit = function(e) {
            e.preventDefault();
            salvarPrestacaoContas(idAdiantamento);
        };
        
        function addCampo(label, tipo, id, obrigatorio) {
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
            var input = document.createElement('input');
            input.type = tipo;
            input.id = id;
            if (obrigatorio) input.required = true;
            input.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;background:white;';
            grupo.appendChild(input);
            return grupo;
        }
        
        form.appendChild(addCampo('Descricao', 'text', 'pcDescricao', true));
        form.appendChild(addCampo('Valor (R$)', 'number', 'pcValor', true));
        
        var rodape = document.createElement('div');
        rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:10px;';
        var btnCancelar = document.createElement('button');
        btnCancelar.type = 'button';
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
        btnCancelar.onclick = function() { fundo.remove(); };
        var btnSalvar = document.createElement('button');
        btnSalvar.type = 'submit';
        btnSalvar.textContent = 'Confirmar';
        btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#2563eb;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
        rodape.appendChild(btnCancelar);
        rodape.appendChild(btnSalvar);
        form.appendChild(rodape);
        
        corpo.appendChild(form);
        caixa.appendChild(cabecalho);
        caixa.appendChild(corpo);
        fundo.appendChild(caixa);
        document.body.appendChild(fundo);
        
    } catch (e) {
        console.error(e);
    }
}

function salvarPrestacaoContas(idAdiantamento) {
    try {
        var descricao = document.getElementById('pcDescricao')?.value.trim();
        var valor = parseFloat(document.getElementById('pcValor')?.value);
        
        if (!descricao || !valor || valor <= 0) {
            alert('Preencha os campos corretamente!');
            return;
        }
        
        if (typeof BD === 'undefined' || !BD.adiantamentos) return;
        
        for (var i = 0; i < BD.adiantamentos.length; i++) {
            if (BD.adiantamentos[i].id === idAdiantamento) {
                var ad = BD.adiantamentos[i];
                if (!ad.prestacoes) ad.prestacoes = [];
                
                ad.prestacoes.push({
                    id: Date.now(),
                    descricao: descricao,
                    valor: valor,
                    data: new Date().toISOString().split('T')[0],
                    registradoPor: window.usuarioAtual?.nome || 'Sistema'
                });
                
                ad.valorPrestado = Number(ad.valorPrestado || 0) + valor;
                break;
            }
        }
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        document.getElementById('modal-prestacao-final')?.remove();
        carregarAdiantamentos();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Prestacao registrada!', 'sucesso');
        } else {
            alert('Prestacao registrada!');
        }
        
    } catch (e) {
        console.error(e);
        alert('Erro ao salvar');
    }
}

function fecharAdiantamento(id) {
    try {
        if (!confirm('Fechar este adiantamento? Nao sera possivel adicionar mais prestacoes.')) return;
        
        if (typeof BD !== 'undefined' && BD.adiantamentos) {
            for (var i = 0; i < BD.adiantamentos.length; i++) {
                if (BD.adiantamentos[i].id === id) {
                    BD.adiantamentos[i].status = 'Fechado';
                    BD.adiantamentos[i].dataFechamento = new Date().toISOString().split('T')[0];
                    BD.adiantamentos[i].fechadoPor = window.usuarioAtual?.nome || 'Sistema';
                    break;
                }
            }
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarAdiantamentos();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Adiantamento fechado!', 'sucesso');
        } else {
            alert('Adiantamento fechado!');
        }
        
    } catch (e) {
        console.error(e);
    }
}

function excluirAdiantamento(id) {
    try {
        if (!confirm('Excluir este adiantamento?')) return;
        
        if (typeof BD !== 'undefined' && BD.adiantamentos) {
            BD.adiantamentos = BD.adiantamentos.filter(function(a) { return a.id !== id; });
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarAdiantamentos();
        
    } catch (e) {
        console.error(e);
    }
}

// Expõe funções globalmente
window.trocarAbaDespesas = trocarAbaDespesas;
window.abrirModalAdiantamento = abrirModalAdiantamento;
window.carregarAdiantamentos = carregarAdiantamentos;
window.abrirModalPrestacaoContas = abrirModalPrestacaoContas;
window.fecharAdiantamento = fecharAdiantamento;
window.excluirAdiantamento = excluirAdiantamento;

// Inicializa a aba ativa ao carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            if (typeof trocarAbaDespesas === 'function') {
                trocarAbaDespesas('adiantamentos');
            }
        }, 500);
    });
}