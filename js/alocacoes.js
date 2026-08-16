// ==================================================
// 📍 ALOCAÇÕES - VERSÃO CORRIGIDA
// ✅ Inclui registro automatico no historico de condutores
// ==================================================

function carregarTabelaAlocacoes() {
    try {
        var tabela = document.getElementById('tabelaAlocacoes');
        if (!tabela) return;
        
        var filtroVeiculo = document.getElementById('filtroVeiculoAlocacao')?.value || 'todos';
        var filtroStatus = document.getElementById('filtroStatusAlocacao')?.value || 'todos';
        
        var alocacoes = (typeof BD !== 'undefined' && BD.alocacoes) ? BD.alocacoes.slice() : [];
        
        if (filtroVeiculo !== 'todos') {
            alocacoes = alocacoes.filter(function(a) { return String(a.veiculoId) === String(filtroVeiculo); });
        }
        if (filtroStatus !== 'todos') {
            alocacoes = alocacoes.filter(function(a) { return a.status === filtroStatus; });
        }
        
        if (alocacoes.length === 0) {
            tabela.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#64748b;">Nenhuma alocacao registrada</td></tr>';
            return;
        }
        
        var statusCor = { Ativa: '#3b82f6', Encerrada: '#6b7280' };
        
        var html = '';
        for (var i = 0; i < alocacoes.length; i++) {
            var a = alocacoes[i];
            var veiculo = null;
            if (BD.veiculos) {
                for (var v = 0; v < BD.veiculos.length; v++) {
                    if (String(BD.veiculos[v].id) === String(a.veiculoId)) {
                        veiculo = BD.veiculos[v];
                        break;
                    }
                }
            }
            
            var cor = statusCor[a.status] || '#6b7280';
            
            html += '<tr>' +
                '<td>' + (a.dataSaida || '-') + '</td>' +
                '<td><strong>' + (veiculo ? veiculo.placa : '-') + '</strong></td>' +
                '<td>' + (a.motorista || '-') + '</td>' +
                '<td>' + (a.origem || '-') + '</td>' +
                '<td>' + (a.destino || '-') + '</td>' +
                '<td>' + (a.kmSaida || '-') + '</td>' +
                '<td><span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;color:white;background:' + cor + ';">' + (a.status || '-') + '</span></td>' +
                '<td>' +
                    (a.status === 'Ativa' 
                        ? '<button onclick="encerrarAlocacao(' + a.id + ')" style="padding:6px 10px;border:none;background:#10b981;color:white;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px;">Encerrar</button>' 
                        : '') +
                    '<button onclick="excluirAlocacao(' + a.id + ')" style="padding:6px 10px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:12px;">Excluir</button>' +
                '</td>' +
                '</tr>';
        }
        
        tabela.innerHTML = html;
        
    } catch (e) { console.error('Erro carregar alocacoes:', e); }
}

function abrirModalAlocacao() {
    console.log('abrirModalAlocacao chamado');
    
    if (typeof BD === 'undefined' || !BD.veiculos || BD.veiculos.length === 0) {
        alert('Cadastre um veiculo primeiro!');
        return;
    }
    
    var veiculosDisponiveis = BD.veiculos.filter(function(v) { return v.status === 'disponivel'; });
    if (veiculosDisponiveis.length === 0) {
        alert('Nenhum veiculo disponivel para alocacao!');
        return;
    }
    
    var antigo = document.getElementById('modal-alocacao-final');
    if (antigo) antigo.remove();
    
    var fundo = document.createElement('div');
    fundo.id = 'modal-alocacao-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
    
    var caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:500px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    var cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#2563eb;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    cabecalho.innerHTML = '<h3 style="margin:0;font-size:18px;">Nova Alocacao</h3>';
    var btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    var corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    var form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
    form.onsubmit = function(e) { e.preventDefault(); salvarAlocacaoForm(); };
    
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
    
    var veiculosOpts = veiculosDisponiveis.map(function(v) {
        return { valor: v.id, texto: v.placa + ' - ' + (v.modelo || '') + ' (KM: ' + (v.km_atual || 0) + ')' };
    });
    var locais = BD.origens || (BD.locais ? BD.locais.map(function(l) { return l.nome; }) : ['Patio Principal']);
    
    form.appendChild(addCampo('Veiculo', 'text', 'alVeiculo', true, veiculosOpts));
    form.appendChild(addCampo('Motorista', 'text', 'alMotorista', true));
    form.appendChild(addCampo('Origem', 'text', 'alOrigem', true, locais.map(function(l) { return { valor: l, texto: l }; })));
    form.appendChild(addCampo('Destino', 'text', 'alDestino', true, locais.map(function(l) { return { valor: l, texto: l }; })));
    form.appendChild(addCampo('Data Saida', 'date', 'alDataSaida', true));
    form.appendChild(addCampo('KM Saida', 'number', 'alKmSaida', true));
    
    var grupoObs = document.createElement('div');
    grupoObs.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    var lblObs = document.createElement('label');
    lblObs.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
    lblObs.textContent = 'Observacao';
    grupoObs.appendChild(lblObs);
    var txtObs = document.createElement('textarea');
    txtObs.id = 'alObservacao';
    txtObs.rows = 2;
    txtObs.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;';
    grupoObs.appendChild(txtObs);
    form.appendChild(grupoObs);
    
    var rodape = document.createElement('div');
    rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:10px;';
    var btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    btnCancelar.onclick = function() { fundo.remove(); };
    var btnSalvar = document.createElement('button');
    btnSalvar.type = 'submit';
    btnSalvar.textContent = 'Alocar';
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
    
    document.getElementById('alVeiculo').addEventListener('change', function() {
        var v = BD.veiculos.find(function(x) { return String(x.id) === String(this.value); }.bind(this));
        if (v) document.getElementById('alKmSaida').value = v.km_atual || 0;
    });
    
    console.log('Modal alocacao aberto!');
}

function salvarAlocacaoForm() {
    try {
        var veiculoId = document.getElementById('alVeiculo')?.value;
        var motorista = document.getElementById('alMotorista')?.value.trim();
        var origem = document.getElementById('alOrigem')?.value;
        var destino = document.getElementById('alDestino')?.value;
        var kmSaida = parseFloat(document.getElementById('alKmSaida')?.value);
        
        if (!veiculoId || !motorista || !origem || !destino || !kmSaida) {
            alert('Preencha os campos obrigatorios!');
            return;
        }
        
        var dados = {
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
        
        if (BD.veiculos) {
            var v = BD.veiculos.find(function(x) { return String(x.id) === String(veiculoId); });
            if (v) v.status = 'alocado';
        }
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        // Registra historico de condutor
        if (typeof registrarHistoricoCondutor === 'function') {
            registrarHistoricoCondutor(Number(veiculoId), motorista, 'alocacao', 'Alocacao para ' + destino);
        }
        
        document.getElementById('modal-alocacao-final')?.remove();
        carregarTabelaAlocacoes();
        if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
        if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
        if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Veiculo alocado com sucesso!', 'sucesso');
        } else {
            alert('Veiculo alocado!');
        }
        
    } catch (e) {
        console.error('Erro:', e);
        alert('Erro ao salvar');
    }
}

function encerrarAlocacao(id) {
    try {
        var kmRetorno = prompt('Informe o KM de retorno:');
        if (kmRetorno === null) return;
        
        var km = parseFloat(kmRetorno);
        if (isNaN(km) || km <= 0) {
            alert('Informe um KM valido!');
            return;
        }
        
        if (typeof BD !== 'undefined' && BD.alocacoes) {
            var a = BD.alocacoes.find(function(x) { return x.id === id; });
            if (a) {
                a.status = 'Encerrada';
                a.kmRetorno = km;
                a.dataRetorno = new Date().toISOString().split('T')[0];
                a.kmRodado = km - (a.kmSaida || 0);
                
                // Fecha historico de condutor da alocacao
                if (BD.historicoCondutores) {
                    var hoje = new Date().toISOString().split('T')[0];
                    for (var h = 0; h < BD.historicoCondutores.length; h++) {
                        var hist = BD.historicoCondutores[h];
                        if (hist.veiculoId === a.veiculoId && hist.motorista === a.motorista && hist.tipo === 'alocacao' && !hist.dataFim) {
                            hist.dataFim = hoje;
                            break;
                        }
                    }
                }
                
                if (BD.veiculos) {
                    var v = BD.veiculos.find(function(x) { return String(x.id) === String(a.veiculoId); });
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
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Alocacao encerrada!', 'sucesso');
        } else {
            alert('Alocacao encerrada!');
        }
        
    } catch (e) { console.error(e); }
}

function excluirAlocacao(id) {
    try {
        if (!confirm('Excluir esta alocacao?')) return;
        if (typeof BD !== 'undefined' && BD.alocacoes) {
            var a = BD.alocacoes.find(function(x) { return x.id === id; });
            if (a && a.status === 'Ativa' && BD.veiculos) {
                var v = BD.veiculos.find(function(x) { return String(x.id) === String(a.veiculoId); });
                if (v) v.status = 'disponivel';
            }
            BD.alocacoes = BD.alocacoes.filter(function(x) { return x.id !== id; });
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
        var filtV = document.getElementById('filtroVeiculoAlocacao');
        var filtS = document.getElementById('filtroStatusAlocacao');
        if (filtV) filtV.addEventListener('change', carregarTabelaAlocacoes);
        if (filtS) filtS.addEventListener('change', carregarTabelaAlocacoes);
        console.log('alocacoes.js inicializado');
    });
}