// ==================================================
// ⛽ GASTOS - VERSÃO CORRIGIDA
// ✅ Modal funcionando + sem erro de sintaxe
// ==================================================

function carregarTabelaGastos() {
    try {
        const tabela = document.getElementById('tabelaGastos');
        if (!tabela) return;
        
        const filtroVeiculo = document.getElementById('filtroGastosVeiculo')?.value || 'todos';
        const filtroTipo = document.getElementById('filtroGastosTipo')?.value || 'todos';
        
        let gastos = (typeof BD !== 'undefined' && BD.gastos) ? [...BD.gastos] : [];
        
        if (filtroVeiculo !== 'todos') {
            gastos = gastos.filter(g => String(g.veiculoId) === String(filtroVeiculo));
        }
        if (filtroTipo !== 'todos') {
            gastos = gastos.filter(g => g.tipo === filtroTipo);
        }
        
        if (gastos.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#64748b;">Nenhum gasto registrado</td></tr>';
            return;
        }
        
        const total = gastos.reduce((s, g) => s + Number(g.valor || 0), 0);
        
        let html = '';
        html += gastos.map(g => {
            const veiculo = BD.veiculos?.find(v => String(v.id) === String(g.veiculoId));
            return '<tr>' +
                '<td>' + (g.data || '-') + '</td>' +
                '<td><strong>' + (veiculo?.placa || '-') + '</strong></td>' +
                '<td>' + (g.tipo || '-') + '</td>' +
                '<td>' + (g.obra || '-') + '</td>' +
                '<td style="font-weight:600;color:#dc2626;">' + (typeof g.valor === 'number' ? Utils.formatarMoeda(g.valor) : '-') + '</td>' +
                '<td><button onclick="excluirGasto(' + g.id + ')" style="padding:6px 10px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:12px;">🗑️</button></td>' +
                '</tr>';
        }).join('');
        
        html += '<tr style="background:#fef2f2;font-weight:600;">' +
            '<td colspan="4" style="text-align:right;">TOTAL:</td>' +
            '<td style="color:#dc2626;">' + Utils.formatarMoeda(total) + '</td>' +
            '<td></td>' +
            '</tr>';
        
        tabela.innerHTML = html;
        
    } catch (e) { console.error('❌ Erro carregar gastos:', e); }
}

function abrirModalGasto() {
    console.log('📝 abrirModalGasto chamado');
    
    if (typeof BD === 'undefined' || !BD.veiculos || BD.veiculos.length === 0) {
        alert('⚠️ Cadastre um veículo primeiro!');
        return;
    }
    
    const antigo = document.getElementById('modal-gasto-final');
    if (antigo) antigo.remove();
    
    const fundo = document.createElement('div');
    fundo.id = 'modal-gasto-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
    
    const caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:480px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    const cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#ef4444;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    cabecalho.innerHTML = '<h3 style="margin:0;font-size:18px;">💰 Novo Gasto</h3>';
    const btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    const corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    const form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
    form.onsubmit = function(e) { e.preventDefault(); salvarGastoForm(); };
    
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
    
    const tiposGasto = ['Combustível', 'Manutenção', 'Peças', 'Serviços', 'IPVA', 'Seguro', 'Licenciamento', 'Multas', 'Pedágio', 'Outros'];
    const veiculosOpts = BD.veiculos.map(v => ({ valor: v.id, texto: v.placa + ' - ' + (v.modelo || '') }));
    const obras = BD.obras || (BD.locais ? BD.locais.map(l => l.nome) : ['Pátio Principal']);
    
    form.appendChild(addCampo('Veículo', 'text', 'gVeiculo', true, veiculosOpts));
    form.appendChild(addCampo('Tipo de Gasto', 'text', 'gTipo', true, tiposGasto.map(t => ({ valor: t, texto: t }))));
    form.appendChild(addCampo('Data', 'date', 'gData', true));
    form.appendChild(addCampo('Valor (R$)', 'number', 'gValor', true));
    form.appendChild(addCampo('Obra/Local', 'text', 'gObra', false, obras.map(o => ({ valor: o, texto: o }))));
    
    const grupoObs = document.createElement('div');
    grupoObs.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    const lblObs = document.createElement('label');
    lblObs.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
    lblObs.textContent = 'Observação';
    grupoObs.appendChild(lblObs);
    const txtObs = document.createElement('textarea');
    txtObs.id = 'gObservacao';
    txtObs.rows = 2;
    txtObs.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;';
    grupoObs.appendChild(txtObs);
    form.appendChild(grupoObs);
    
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
    btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#ef4444;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    form.appendChild(rodape);
    
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    
    document.getElementById('gData').value = new Date().toISOString().split('T')[0];
    console.log('✅ Modal gasto aberto!');
}

function salvarGastoForm() {
    try {
        const veiculoId = document.getElementById('gVeiculo')?.value;
        const tipo = document.getElementById('gTipo')?.value;
        const valor = parseFloat(document.getElementById('gValor')?.value);
        
        if (!veiculoId || !tipo || !valor) {
            alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        const dados = {
            id: Date.now(),
            veiculoId: Number(veiculoId),
            tipo: tipo,
            data: document.getElementById('gData')?.value || new Date().toISOString().split('T')[0],
            valor: valor,
            obra: document.getElementById('gObra')?.value || '',
            observacao: document.getElementById('gObservacao')?.value.trim() || '',
            lancadoPor: window.usuarioAtual?.nome || 'Sistema'
        };
        
        if (typeof BD === 'undefined') BD = { gastos: [] };
        if (!BD.gastos) BD.gastos = [];
        BD.gastos.unshift(dados);
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        document.getElementById('modal-gasto-final')?.remove();
        carregarTabelaGastos();
        if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
        
        if (typeof mostrarToast === 'function') mostrarToast('Gasto registrado!', 'sucesso');
        else alert('✅ Gasto registrado!');
        
    } catch (e) {
        console.error('❌ Erro:', e);
        alert('❌ Erro ao salvar');
    }
}

function excluirGasto(id) {
    try {
        if (!confirm('Excluir este gasto?')) return;
        if (typeof BD !== 'undefined' && BD.gastos) {
            BD.gastos = BD.gastos.filter(g => g.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        carregarTabelaGastos();
        if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    } catch (e) { console.error(e); }
}

window.carregarTabelaGastos = carregarTabelaGastos;
window.abrirModalGasto = abrirModalGasto;
window.excluirGasto = excluirGasto;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        const filtV = document.getElementById('filtroGastosVeiculo');
        const filtT = document.getElementById('filtroGastosTipo');
        if (filtV) filtV.addEventListener('change', carregarTabelaGastos);
        if (filtT) filtT.addEventListener('change', carregarTabelaGastos);
        console.log('✅ gastos.js inicializado');
    });
}