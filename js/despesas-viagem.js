// ==================================================
// 💸 DESPESAS DE VIAGEM - VERSÃO CORRIGIDA
// ✅ Modal funcionando
// ==================================================

function carregarTabelaDespesasViagem() {
    try {
        const container = document.getElementById('listaDespesasViagem');
        if (!container) return;
        
        let despesas = (typeof BD !== 'undefined' && BD.despesasViagem) ? [...BD.despesasViagem] : [];
        
        if (despesas.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:60px;color:#64748b;">Nenhuma despesa de viagem registrada</div>';
            return;
        }
        
        const statusCor = { 'Pendente': '#f59e0b', 'Aprovada': '#10b981', 'Rejeitada': '#dc2626' };
        
        container.innerHTML = despesas.map(d => {
            const veiculo = BD.veiculos?.find(v => String(v.id) === String(d.veiculoId));
            const total = (d.itens || []).reduce((s, i) => s + Number(i.valor || 0), 0);
            return '<div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:16px;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.05);">' +
                '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:12px;">' +
                    '<div>' +
                        '<h4 style="margin:0 0 8px 0;font-size:16px;color:#0f172a;">🚗 Viagem - ' + (veiculo?.placa || 'Veículo não encontrado') + '</h4>' +
                        '<p style="margin:4px 0;font-size:13px;color:#64748b;"><strong>Motorista:</strong> ' + (d.motorista || '-') + '</p>' +
                        '<p style="margin:4px 0;font-size:13px;color:#64748b;"><strong>Data:</strong> ' + (d.data || '-') + '</p>' +
                        '<p style="margin:4px 0;font-size:13px;color:#64748b;"><strong>Destino:</strong> ' + (d.destino || '-') + '</p>' +
                    '</div>' +
                    '<div style="text-align:right;">' +
                        '<div style="font-size:22px;font-weight:700;color:#dc2626;margin-bottom:8px;">' + Utils.formatarMoeda(total) + '</div>' +
                        '<span style="display:inline-block;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:500;color:white;background:' + (statusCor[d.status] || '#6b7280') + ';">' + (d.status || 'Pendente') + '</span>' +
                    '</div>' +
                '</div>' +
                '<div style="border-top:1px solid #f3f4f6;padding-top:12px;">' +
                    '<h5 style="margin:0 0 10px 0;font-size:13px;color:#374151;">Itens da despesa:</h5>' +
                    '<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;font-size:13px;">' +
                        (d.itens || []).map(i => 
                            '<div style="padding:6px 0;border-bottom:1px solid #f9fafb;">' + (i.descricao || '-') + '</div>' +
                            '<div style="padding:6px 0;border-bottom:1px solid #f9fafb;">' + (i.quantidade || 1) + '</div>' +
                            '<div style="padding:6px 0;border-bottom:1px solid #f9fafb;text-align:right;font-weight:500;">' + Utils.formatarMoeda(i.valor || 0) + '</div>'
                        ).join('') +
                    '</div>' +
                '</div>' +
                (d.status === 'Pendente' ? 
                    '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;padding-top:16px;border-top:1px solid #f3f4f6;">' +
                        '<button onclick="rejeitarDespesaViagem(' + d.id + ')" style="padding:8px 16px;border:none;background:#dc2626;color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">❌ Rejeitar</button>' +
                        '<button onclick="aprovarDespesaViagem(' + d.id + ')" style="padding:8px 16px;border:none;background:#10b981;color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">✅ Aprovar</button>' +
                    '</div>' : '') +
            '</div>';
        }).join('');
        
    } catch (e) { console.error('❌ Erro carregar despesas viagem:', e); }
}

function abrirModalDespesaViagem() {
    console.log('📝 abrirModalDespesaViagem chamado');
    
    if (typeof BD === 'undefined' || !BD.veiculos || BD.veiculos.length === 0) {
        alert('⚠️ Cadastre um veículo primeiro!');
        return;
    }
    
    const antigo = document.getElementById('modal-despesa-final');
    if (antigo) antigo.remove();
    
    const fundo = document.createElement('div');
    fundo.id = 'modal-despesa-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
    
    const caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:550px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    const cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#0891b2;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    cabecalho.innerHTML = '<h3 style="margin:0;font-size:18px;">💸 Nova Despesa de Viagem</h3>';
    const btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    const corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    const form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
    form.onsubmit = function(e) { e.preventDefault(); salvarDespesaViagemForm(); };
    
    function addCampo(label, tipo, id, obrigatorio, opcoes) {
        const grupo = document.createElement('div');
        grupo.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        const lbl = document.createElement('label');
        lbl.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
        lbl.innerHTML = label + (obrigatorio ? ' <span style="color:#dc2626;">*</span>' : '');
        grupo.appendChild(lbl);
        let input;
        if (opcoes) {
            input = document.createElement('select');
            input.innerHTML = '<option value="">Selecione...</option>' + opcoes.map(o => '<option value="' + o.valor + '">' + o.texto + '</option>').join('');
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
    
    const veiculosOpts = BD.veiculos.map(v => ({ valor: v.id, texto: v.placa + ' - ' + (v.modelo || '') }));
    
    form.appendChild(addCampo('Veículo', 'text', 'dvVeiculo', true, veiculosOpts));
    form.appendChild(addCampo('Motorista', 'text', 'dvMotorista', true));
    form.appendChild(addCampo('Destino', 'text', 'dvDestino', true));
    form.appendChild(addCampo('Data', 'date', 'dvData', true));
    
    // Itens dinâmicos
    const divItensLabel = document.createElement('label');
    divItensLabel.style.cssText = 'font-size:14px;font-weight:500;color:#374151;margin-bottom:-6px;';
    divItensLabel.textContent = 'Itens da Despesa:';
    form.appendChild(divItensLabel);
    
    const containerItens = document.createElement('div');
    containerItens.id = 'dvItensContainer';
    containerItens.style.cssText = 'border:1px solid #e5e7eb;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:10px;';
    
    function adicionarItem() {
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = 'display:grid;grid-template-columns:2fr 80px 1fr auto;gap:8px;align-items:center;';
        itemDiv.innerHTML = 
            '<input type="text" placeholder="Descrição" class="dv-item-desc" style="padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;">' +
            '<input type="number" placeholder="Qtd" value="1" min="1" class="dv-item-qtd" style="padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;">' +
            '<input type="number" placeholder="Valor R$" step="0.01" min="0" class="dv-item-valor" style="padding:8px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;">' +
            '<button type="button" class="dv-item-remover" style="padding:8px 12px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:13px;">×</button>';
        itemDiv.querySelector('.dv-item-remover').onclick = function() { itemDiv.remove(); };
        containerItens.appendChild(itemDiv);
    }
    
    adicionarItem(); // Adiciona primeiro item
    form.appendChild(containerItens);
    
    const btnAddItem = document.createElement('button');
    btnAddItem.type = 'button';
    btnAddItem.textContent = '+ Adicionar Item';
    btnAddItem.style.cssText = 'padding:8px 16px;border:1px dashed #0891b2;background:#ecfeff;color:#0891b2;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;';
    btnAddItem.onclick = adicionarItem;
    form.appendChild(btnAddItem);
    
    const rodape = document.createElement('div');
    rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:10px;';
    const btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    btnCancelar.onclick = function() { fundo.remove(); };
    const btnSalvar = document.createElement('button');
    btnSalvar.type = 'submit';
    btnSalvar.textContent = '💾 Salvar';
    btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#0891b2;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    form.appendChild(rodape);
    
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    
    document.getElementById('dvData').value = new Date().toISOString().split('T')[0];
    console.log('✅ Modal despesa viagem aberto!');
}

function salvarDespesaViagemForm() {
    try {
        const veiculoId = document.getElementById('dvVeiculo')?.value;
        const motorista = document.getElementById('dvMotorista')?.value.trim();
        const destino = document.getElementById('dvDestino')?.value.trim();
        
        if (!veiculoId || !motorista || !destino) {
            alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        const itens = [];
        document.querySelectorAll('#dvItensContainer > div').forEach(function(div) {
            const desc = div.querySelector('.dv-item-desc')?.value.trim();
            const qtd = parseFloat(div.querySelector('.dv-item-qtd')?.value) || 1;
            const valor = parseFloat(div.querySelector('.dv-item-valor')?.value) || 0;
            if (desc && valor > 0) {
                itens.push({ descricao: desc, quantidade: qtd, valor: valor });
            }
        });
        
        if (itens.length === 0) {
            alert('⚠️ Adicione pelo menos um item de despesa!');
            return;
        }
        
        const dados = {
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
        
        document.getElementById('modal-despesa-final')?.remove();
        carregarTabelaDespesasViagem();
        
        if (typeof mostrarToast === 'function') mostrarToast('Despesa registrada!', 'sucesso');
        else alert('✅ Despesa registrada!');
        
    } catch (e) {
        console.error('❌ Erro:', e);
        alert('❌ Erro ao salvar');
    }
}

function aprovarDespesaViagem(id) {
    try {
        if (!confirm('Aprovar esta despesa?')) return;
        if (typeof BD !== 'undefined' && BD.despesasViagem) {
            const d = BD.despesasViagem.find(x => x.id === id);
            if (d) {
                d.status = 'Aprovada';
                d.aprovadoPor = window.usuarioAtual?.nome || 'Sistema';
                d.dataAprovacao = new Date().toISOString().split('T')[0];
            }
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        carregarTabelaDespesasViagem();
        if (typeof mostrarToast === 'function') mostrarToast('Despesa aprovada!', 'sucesso');
    } catch (e) { console.error(e); }
}

function rejeitarDespesaViagem(id) {
    try {
        if (!confirm('Rejeitar esta despesa?')) return;
        if (typeof BD !== 'undefined' && BD.despesasViagem) {
            const d = BD.despesasViagem.find(x => x.id === id);
            if (d) {
                d.status = 'Rejeitada';
                d.rejeitadoPor = window.usuarioAtual?.nome || 'Sistema';
                d.dataRejeicao = new Date().toISOString().split('T')[0];
            }
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        carregarTabelaDespesasViagem();
        if (typeof mostrarToast === 'function') mostrarToast('Despesa rejeitada!', 'aviso');
    } catch (e) { console.error(e); }
}

window.carregarTabelaDespesasViagem = carregarTabelaDespesasViagem;
window.abrirModalDespesaViagem = abrirModalDespesaViagem;
window.aprovarDespesaViagem = aprovarDespesaViagem;
window.rejeitarDespesaViagem = rejeitarDespesaViagem;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ despesas-viagem.js inicializado');
    });
}