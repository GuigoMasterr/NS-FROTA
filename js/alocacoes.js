// ==================================================
// 📍 ALOCAÇÕES - VERSÃO CORRIGIDA
// ✅ Modal funcionando
// ==================================================

function carregarTabelaAlocacoes() {
    try {
        const tabela = document.getElementById('tabelaAlocacoes');
        if (!tabela) return;
        
        const filtroVeiculo = document.getElementById('filtroVeiculoAlocacao')?.value || 'todos';
        const filtroStatus = document.getElementById('filtroStatusAlocacao')?.value || 'todos';
        
        let alocacoes = (typeof BD !== 'undefined' && BD.alocacoes) ? [...BD.alocacoes] : [];
        
        if (filtroVeiculo !== 'todos') {
            alocacoes = alocacoes.filter(a => String(a.veiculoId) === String(filtroVeiculo));
        }
        if (filtroStatus !== 'todos') {
            alocacoes = alocacoes.filter(a => a.status === filtroStatus);
        }
        
        if (alocacoes.length === 0) {
            tabela.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#64748b;">Nenhuma alocação registrada</td></tr>';
            return;
        }
        
        const statusCor = { 'Ativa': '#3b82f6', 'Encerrada': '#6b7280' };
        
        tabela.innerHTML = alocacoes.map(a => {
            const veiculo = BD.veiculos?.find(v => String(v.id) === String(a.veiculoId));
            return '<tr>' +
                '<td>' + (a.dataSaida || '-') + '</td>' +
                '<td><strong>' + (veiculo?.placa || '-') + '</strong></td>' +
                '<td>' + (a.motorista || '-') + '</td>' +
                '<td>' + (a.origem || '-') + '</td>' +
                '<td>' + (a.destino || '-') + '</td>' +
                '<td>' + (a.kmSaida || '-') + '</td>' +
                '<td><span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;color:white;background:' + (statusCor[a.status] || '#6b7280') + '">' + (a.status || '-') + '</span></td>' +
                '<td>' +
                    (a.status === 'Ativa' 
                        ? '<button onclick="encerrarAlocacao(' + a.id + ')" style="padding:6px 10px;border:none;background:#10b981;color:white;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px;">✅ Encerrar</button>' 
                        : '') +
                    '<button onclick="excluirAlocacao(' + a.id + ')" style="padding:6px 10px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:12px;">🗑️</button>' +
                '</td>' +
                '</tr>';
        }).join('');
        
    } catch (e) { console.error('❌ Erro carregar alocacoes:', e); }
}

function abrirModalAlocacao() {
    console.log('📝 abrirModalAlocacao chamado');
    
    if (typeof BD === 'undefined' || !BD.veiculos || BD.veiculos.length === 0) {
        alert('⚠️ Cadastre um veículo primeiro!');
        return;
    }
    
    const veiculosDisponiveis = BD.veiculos.filter(v => v.status === 'disponivel');
    if (veiculosDisponiveis.length === 0) {
        alert('⚠️ Nenhum veículo disponível para alocação!');
        return;
    }
    
    const antigo = document.getElementById('modal-alocacao-final');
    if (antigo) antigo.remove();
    
    const fundo = document.createElement('div');
    fundo.id = 'modal-alocacao-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
    
    const caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:500px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    const cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#2563eb;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    cabecalho.innerHTML = '<h3 style="margin:0;font-size:18px;">📍 Nova Alocação</h3>';
    const btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    const corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    const form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
    form.onsubmit = function(e) { e.preventDefault(); salvarAlocacaoForm(); };
    
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
    
    const veiculosOpts = veiculosDisponiveis.map(v => ({ valor: v.id, texto: v.placa + ' - ' + (v.modelo || '') + ' (KM: ' + (v.km_atual || 0) + ')' }));
    const locais = BD.origens || BD.locais?.map(l => l.nome) || ['Pátio Principal'];
    
    form.appendChild(addCampo('Veículo', 'text', 'alVeiculo', true, veiculosOpts));
    form.appendChild(addCampo('Motorista', 'text', 'alMotorista', true));
    form.appendChild(addCampo('Origem', 'text', 'alOrigem', true, locais.map(l => ({ valor: l, texto: l }))));
    form.appendChild(addCampo('Destino', 'text', 'alDestino', true, locais.map(l => ({ valor: l, texto: l }))));
    form.appendChild(addCampo('Data Saída', 'date', 'alDataSaida', true));
    form.appendChild(addCampo('KM Saída', 'number', 'alKmSaida', true));
    
    const grupoObs = document.createElement('div');
    grupoObs.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    const lblObs = document.createElement('label');
    lblObs.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
    lblObs.textContent = 'Observação';
    grupoObs.appendChild(lblObs);
    const txtObs = document.createElement('textarea');
    txtObs.id = 'alObservacao';
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
    btnSalvar.textContent = '💾 Alocar';
    btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#2563eb;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    form.appendChild(rodape);
    
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    
    document.getElementById('alDataSaida').value = new Date().toISOString().split('T')[0];
    
    // Preenche KM saída automaticamente com o KM atual do veículo
    document.getElementById('alVeiculo').addEventListener('change', function() {
        const v = BD.veiculos.find(x => String(x.id) === String(this.value));
        if (v) document.getElementById('alKmSaida').value = v.km_atual || 0;
    });
    
    console.log('✅ Modal alocação aberto!');
}

function salvarAlocacaoForm() {
    try {
        const veiculoId = document.getElementById('alVeiculo')?.value;
        const motorista = document.getElementById('alMotorista')?.value.trim();
        const origem = document.getElementById('alOrigem')?.value;
        const destino = document.getElementById('alDestino')?.value;
        const kmSaida = parseFloat(document.getElementById('alKmSaida')?.value);
        
        if (!veiculoId || !motorista || !origem || !destino || !kmSaida) {
            alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        const dados = {
            id: Date.now(),
            veiculoId: Number(veiculoId),
            motorista: motorista,
            origem: origem,
            destino: destino,
            dataSaida: document.getElementById('alDataSaida')?.value || new Date().toISOString().split('T')[0],
            kmSaida: kmSaida,
            observacao: document.getElementById('alObservacao')?.value.trim() || '',
            status: 'Ativa',
            criadoPor: window.usuarioAtual?.nome || 'Sistema'
        };
        
        if (typeof BD === 'undefined') BD = { alocacoes: [], veiculos: [] };
        if (!BD.alocacoes) BD.alocacoes = [];
        BD.alocacoes.unshift(dados);
        
        // Atualiza status do veículo
        if (BD.veiculos) {
            const v = BD.veiculos.find(x => String(x.id) === String(veiculoId));
            if (v) v.status = 'alocado';
        }
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        document.getElementById('modal-alocacao-final')?.remove();
        carregarTabelaAlocacoes();
        if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
        if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
        if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
        
        if (typeof mostrarToast === 'function') mostrarToast('Veículo alocado com sucesso!', 'sucesso');
        else alert('✅ Veículo alocado!');
        
    } catch (e) {
        console.error('❌ Erro:', e);
        alert('❌ Erro ao salvar');
    }
}

function encerrarAlocacao(id) {
    try {
        const kmRetorno = prompt('Informe o KM de retorno:');
        if (kmRetorno === null) return;
        
        const km = parseFloat(kmRetorno);
        if (isNaN(km) || km <= 0) {
            alert('⚠️ Informe um KM válido!');
            return;
        }
        
        if (typeof BD !== 'undefined' && BD.alocacoes) {
            const a = BD.alocacoes.find(x => x.id === id);
            if (a) {
                a.status = 'Encerrada';
                a.kmRetorno = km;
                a.dataRetorno = new Date().toISOString().split('T')[0];
                a.kmRodado = km - (a.kmSaida || 0);
                
                // Atualiza status do veículo e KM
                if (BD.veiculos) {
                    const v = BD.veiculos.find(x => String(x.id) === String(a.veiculoId));
                    if (v) {
                        v.status = 'disponivel';
                        v.km_atual = km;
                    }
                }
            }
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarTabelaAlocacoes();
        if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
        if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
        if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
        
        if (typeof mostrarToast === 'function') mostrarToast('Alocação encerrada!', 'sucesso');
        else alert('✅ Alocação encerrada!');
        
    } catch (e) { console.error(e); }
}

function excluirAlocacao(id) {
    try {
        if (!confirm('Excluir esta alocação?')) return;
        if (typeof BD !== 'undefined' && BD.alocacoes) {
            const a = BD.alocacoes.find(x => x.id === id);
            if (a && a.status === 'Ativa' && BD.veiculos) {
                const v = BD.veiculos.find(x => String(x.id) === String(a.veiculoId));
                if (v) v.status = 'disponivel';
            }
            BD.alocacoes = BD.alocacoes.filter(x => x.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        carregarTabelaAlocacoes();
        if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
        if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
    } catch (e) { console.error(e); }
}

window.carregarTabelaAlocacoes = carregarTabelaAlocacoes;
window.abrirModalAlocacao = abrirModalAlocacao;
window.encerrarAlocacao = encerrarAlocacao;
window.excluirAlocacao = excluirAlocacao;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        const filtV = document.getElementById('filtroVeiculoAlocacao');
        const filtS = document.getElementById('filtroStatusAlocacao');
        if (filtV) filtV.addEventListener('change', carregarTabelaAlocacoes);
        if (filtS) filtS.addEventListener('change', carregarTabelaAlocacoes);
        console.log('✅ alocacoes.js inicializado');
    });
}