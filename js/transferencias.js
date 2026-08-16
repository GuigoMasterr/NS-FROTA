// ==================================================
// 🔄 TRANSFERÊNCIAS - ÁREA EXCLUSIVA COMPLETA
// ✅ Formulario, Pendentes, Cards e Historico
// ==================================================

function inicializarTransferencias() {
    try {
        atualizarSelectVeiculosTransf();
        atualizarSelectMotoristasTransf();
        atualizarCardsTransf();
        carregarTabelaPendentes();
        carregarHistoricoTransferencias();
        
        var selVeiculo = document.getElementById('transfVeiculo');
        if (selVeiculo) {
            selVeiculo.addEventListener('change', atualizarInfoResponsavelAtual);
        }
        
        console.log('✅ transferencias.js inicializado');
    } catch (e) {
        console.error('Erro init transferencias:', e);
    }
}

function atualizarSelectVeiculosTransf() {
    try {
        var select = document.getElementById('transfVeiculo');
        if (!select || typeof BD === 'undefined' || !BD.veiculos) return;
        
        select.innerHTML = '<option value="">Selecione o veículo...</option>';
        for (var i = 0; i < BD.veiculos.length; i++) {
            var v = BD.veiculos[i];
            var opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = v.placa + ' - ' + (v.modelo || v.marca || '');
            select.appendChild(opt);
        }
    } catch (e) { console.error(e); }
}

function atualizarSelectMotoristasTransf() {
    try {
        var select = document.getElementById('transfNovoResp');
        if (!select) return;
        
        var motoristas = {};
        if (BD.usuarios) {
            for (var u = 0; u < BD.usuarios.length; u++) {
                var usr = BD.usuarios[u];
                if ((usr.perfil === 'motorista' || usr.perfil === 'operacional') && usr.ativo !== false) {
                    motoristas[usr.nome] = true;
                }
            }
        }
        if (BD.veiculos) {
            for (var v = 0; v < BD.veiculos.length; v++) {
                if (BD.veiculos[v].responsavel) {
                    motoristas[BD.veiculos[v].responsavel] = true;
                }
            }
        }
        
        select.innerHTML = '<option value="">Selecione o motorista...</option>';
        var nomes = Object.keys(motoristas).sort();
        for (var n = 0; n < nomes.length; n++) {
            var opt = document.createElement('option');
            opt.value = nomes[n];
            opt.textContent = nomes[n];
            select.appendChild(opt);
        }
    } catch (e) { console.error(e); }
}

function atualizarInfoResponsavelAtual() {
    try {
        var div = document.getElementById('infoRespAtual');
        var veiculoId = document.getElementById('transfVeiculo')?.value;
        
        if (!div) return;
        
        if (!veiculoId || !BD.veiculos) {
            div.innerHTML = '<label style="font-size:13px;font-weight:500;color:#374151;">Responsável Atual</label><div style="padding:10px 12px;background:#f3f4f6;border-radius:8px;font-size:14px;color:#6b7280;">Selecione um veículo</div>';
            return;
        }
        
        var veiculo = null;
        for (var i = 0; i < BD.veiculos.length; i++) {
            if (String(BD.veiculos[i].id) === String(veiculoId)) {
                veiculo = BD.veiculos[i];
                break;
            }
        }
        
        var resp = veiculo && veiculo.responsavel ? veiculo.responsavel : 'Não definido';
        div.innerHTML = '<label style="font-size:13px;font-weight:500;color:#374151;">Responsável Atual</label><div style="padding:10px 12px;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;font-size:14px;font-weight:500;color:#92400e;">👤 ' + resp + '</div>';
        
        var selDestino = document.getElementById('transfNovoResp');
        if (selDestino && veiculo && veiculo.responsavel) {
            for (var o = 0; o < selDestino.options.length; o++) {
                selDestino.options[o].disabled = (selDestino.options[o].value === veiculo.responsavel);
            }
        }
    } catch (e) { console.error(e); }
}

function solicitarTransferenciaDireta() {
    try {
        var veiculoId = document.getElementById('transfVeiculo')?.value;
        var novoResp = document.getElementById('transfNovoResp')?.value;
        var obs = document.getElementById('transfObsDireta')?.value.trim();
        
        if (!veiculoId) { alert('Selecione o veículo!'); return; }
        if (!novoResp) { alert('Selecione o novo responsável!'); return; }
        
        var veiculo = null;
        for (var i = 0; i < BD.veiculos.length; i++) {
            if (String(BD.veiculos[i].id) === String(veiculoId)) {
                veiculo = BD.veiculos[i];
                break;
            }
        }
        
        if (!veiculo) return;
        
        if (veiculo.responsavel === novoResp) {
            alert('O novo responsável já é o atual!');
            return;
        }
        
        if (!veiculo.responsavel) {
            alert('Este veículo não tem responsável definido. Edite o veículo primeiro.');
            return;
        }
        
        if (BD.solicitacoesTransferencia) {
            for (var s = 0; s < BD.solicitacoesTransferencia.length; s++) {
                if (BD.solicitacoesTransferencia[s].veiculoId == veiculoId && BD.solicitacoesTransferencia[s].status === 'Solicitado') {
                    alert('Já existe uma solicitação pendente para este veículo!');
                    return;
                }
            }
        }
        
        var solicitacao = {
            id: Date.now(),
            veiculoId: Number(veiculoId),
            placa: veiculo.placa,
            modelo: veiculo.modelo || '',
            motoristaOrigem: veiculo.responsavel,
            motoristaDestino: novoResp,
            status: 'Solicitado',
            dataSolicitacao: new Date().toISOString(),
            dataAceite: null,
            checklistId: null,
            observacao: obs || '',
            solicitadoPor: window.usuarioAtual?.nome || 'Sistema'
        };
        
        if (!BD.solicitacoesTransferencia) BD.solicitacoesTransferencia = [];
        BD.solicitacoesTransferencia.unshift(solicitacao);
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        document.getElementById('transfVeiculo').value = '';
        document.getElementById('transfNovoResp').value = '';
        document.getElementById('transfObsDireta').value = '';
        atualizarInfoResponsavelAtual();
        
        atualizarBadgeNotificacoes();
        atualizarCardsTransf();
        carregarTabelaPendentes();
        carregarHistoricoTransferencias();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Solicitação enviada com sucesso!', 'sucesso');
        } else {
            alert('✅ Solicitação enviada!\n\nAdmins e supervisores foram notificados.');
        }
        
    } catch (e) {
        console.error(e);
        alert('Erro ao solicitar transferência');
    }
}

function atualizarCardsTransf() {
    try {
        var container = document.getElementById('cardsTransf');
        if (!container || !BD || !BD.solicitacoesTransferencia) return;
        
        var pendentes = 0, concluidas = 0, rejeitadas = 0;
        var veiculosSet = {};
        
        for (var i = 0; i < BD.solicitacoesTransferencia.length; i++) {
            var s = BD.solicitacoesTransferencia[i];
            if (s.status === 'Solicitado') pendentes++;
            else if (s.status === 'Transferido') {
                concluidas++;
                veiculosSet[s.veiculoId] = true;
            }
            else if (s.status === 'Rejeitado') rejeitadas++;
        }
        
        container.innerHTML = 
            '<div style="background:white;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #f59e0b;">' +
                '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">⏳ Pendentes</div>' +
                '<div style="font-size:28px;font-weight:700;color:#0f172a;">' + pendentes + '</div>' +
            '</div>' +
            '<div style="background:white;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #10b981;">' +
                '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">✅ Concluídas</div>' +
                '<div style="font-size:28px;font-weight:700;color:#0f172a;">' + concluidas + '</div>' +
            '</div>' +
            '<div style="background:white;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #3b82f6;">' +
                '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">🚛 Veículos transferidos</div>' +
                '<div style="font-size:28px;font-weight:700;color:#0f172a;">' + Object.keys(veiculosSet).length + '</div>' +
            '</div>' +
            '<div style="background:white;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #dc2626;">' +
                '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">❌ Rejeitadas</div>' +
                '<div style="font-size:28px;font-weight:700;color:#0f172a;">' + rejeitadas + '</div>' +
            '</div>';
            
    } catch (e) { console.error(e); }
}

function carregarTabelaPendentes() {
    try {
        var tbody = document.getElementById('tabelaPendentes');
        if (!tbody) return;
        
        if (!BD || !BD.solicitacoesTransferencia) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#64748b;">Nenhuma solicitação pendente</td></tr>';
            return;
        }
        
        var perfil = window.usuarioAtual?.perfil || '';
        var nome = window.usuarioAtual?.nome || '';
        var isAdmin = perfil === 'admin' || perfil === 'supervisor';
        
        var pendentes = BD.solicitacoesTransferencia.filter(function(s) {
            return s.status === 'Solicitado';
        });
        
        if (pendentes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#10b981;font-weight:500;">✅ Nenhuma solicitação pendente</td></tr>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < pendentes.length; i++) {
            var s = pendentes[i];
            var data = new Date(s.dataSolicitacao).toLocaleString('pt-BR');
            
            var acoes = '';
            if (isAdmin || s.motoristaDestino === nome) {
                acoes = '<button onclick="abrirModalAceitarTransf(' + s.id + ')" style="padding:6px 12px;border:none;background:#10b981;color:white;border-radius:6px;cursor:pointer;font-size:12px;">✅ Analisar</button>';
            } else {
                acoes = '<span style="font-size:12px;color:#64748b;">Aguardando ' + s.motoristaDestino + '...</span>';
            }
            
            html += '<tr>' +
                '<td>' + data + '</td>' +
                '<td><strong>' + s.placa + '</strong></td>' +
                '<td>' + s.motoristaOrigem + '</td>' +
                '<td><strong>' + s.motoristaDestino + '</strong></td>' +
                '<td>' + s.solicitadoPor + '</td>' +
                '<td><span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;color:white;background:#f59e0b;">Solicitado</span></td>' +
                '<td>' + acoes + '</td>' +
                '</tr>';
        }
        
        tbody.innerHTML = html;
        
    } catch (e) { console.error(e); }
}

function carregarHistoricoTransferencias() {
    try {
        var tbody = document.getElementById('tabelaHistoricoTransf');
        if (!tbody) return;
        
        if (!BD || !BD.solicitacoesTransferencia) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#64748b;">Nenhuma transferência realizada</td></tr>';
            return;
        }
        
        var dataIni = document.getElementById('filtroHistDataIni')?.value;
        var dataFim = document.getElementById('filtroHistDataFim')?.value;
        
        var historico = BD.solicitacoesTransferencia.filter(function(s) {
            return s.status === 'Transferido' || s.status === 'Rejeitado';
        });
        
        if (dataIni) {
            historico = historico.filter(function(s) {
                return new Date(s.dataSolicitacao) >= new Date(dataIni + 'T00:00:00');
            });
        }
        if (dataFim) {
            historico = historico.filter(function(s) {
                return new Date(s.dataSolicitacao) <= new Date(dataFim + 'T23:59:59');
            });
        }
        
        if (historico.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#64748b;">Nenhuma transferência no período</td></tr>';
            return;
        }
        
        historico.sort(function(a, b) {
            return new Date(b.dataSolicitacao) - new Date(a.dataSolicitacao);
        });
        
        var statusCor = { 'Transferido': '#10b981', 'Rejeitado': '#dc2626' };
        var checkCor = { 'Aprovado': '#10b981', 'Pendente': '#f59e0b', 'Reprovado': '#dc2626' };
        
        var html = '';
        for (var i = 0; i < historico.length; i++) {
            var s = historico[i];
            var dataSol = new Date(s.dataSolicitacao).toLocaleDateString('pt-BR');
            var dataConc = s.dataAceite ? new Date(s.dataAceite).toLocaleDateString('pt-BR') : (s.dataRejeicao ? new Date(s.dataRejeicao).toLocaleDateString('pt-BR') : '-');
            var corStatus = statusCor[s.status] || '#6b7280';
            var checkResult = s.resultadoChecklist || '-';
            var corCheck = checkCor[checkResult] || '#6b7280';
            
            html += '<tr>' +
                '<td>' + dataSol + '</td>' +
                '<td>' + dataConc + '</td>' +
                '<td><strong>' + s.placa + '</strong></td>' +
                '<td>' + s.motoristaOrigem + '</td>' +
                '<td><strong>' + s.motoristaDestino + '</strong></td>' +
                '<td>' + (checkResult !== '-' ? '<span style="display:inline-block;padding:3px 8px;border-radius:12px;font-size:11px;font-weight:500;color:white;background:' + corCheck + ';">' + checkResult + '</span>' : '-') + '</td>' +
                '<td><span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;color:white;background:' + corStatus + ';">' + s.status + '</span></td>' +
                '</tr>';
        }
        
        tbody.innerHTML = html;
        
    } catch (e) { console.error(e); }
}

function abrirModalAceitarTransf(solicitacaoId) {
    try {
        var solicitacao = null;
        for (var i = 0; i < BD.solicitacoesTransferencia.length; i++) {
            if (BD.solicitacoesTransferencia[i].id === solicitacaoId) {
                solicitacao = BD.solicitacoesTransferencia[i];
                break;
            }
        }
        if (!solicitacao) return;
        
        var usuarioAtual = window.usuarioAtual?.nome || '';
        var perfilAtual = window.usuarioAtual?.perfil || '';
        var isAdmin = perfilAtual === 'admin';
        
        if (!isAdmin && usuarioAtual !== solicitacao.motoristaDestino) {
            alert('Apenas ' + solicitacao.motoristaDestino + ' pode aceitar!');
            return;
        }
        
        var antigo = document.getElementById('modal-aceitar-transf');
        if (antigo) antigo.remove();
        
        var fundo = document.createElement('div');
        fundo.id = 'modal-aceitar-transf';
        fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
        fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
        
        var caixa = document.createElement('div');
        caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:600px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
        
        var cabecalho = document.createElement('div');
        cabecalho.style.cssText = 'padding:16px 24px;background:#10b981;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
        var titulo = document.createElement('h3');
        titulo.style.cssText = 'margin:0;font-size:18px;';
        titulo.textContent = '✅ Analisar - ' + solicitacao.placa;
        cabecalho.appendChild(titulo);
        var btnFechar = document.createElement('button');
        btnFechar.textContent = '×';
        btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
        btnFechar.onclick = function() { fundo.remove(); };
        cabecalho.appendChild(btnFechar);
        
        var corpo = document.createElement('div');
        corpo.style.cssText = 'padding:24px;';
        
        var infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px;margin-bottom:16px;';
        infoDiv.innerHTML = 
            '<p style="margin:4px 0;font-size:13px;"><strong>Veículo:</strong> ' + solicitacao.placa + ' - ' + (solicitacao.modelo || '') + '</p>' +
            '<p style="margin:4px 0;font-size:13px;"><strong>De:</strong> ' + solicitacao.motoristaOrigem + '</p>' +
            '<p style="margin:4px 0;font-size:13px;"><strong>Para:</strong> ' + solicitacao.motoristaDestino + '</p>' +
            (solicitacao.observacao ? '<p style="margin:4px 0;font-size:13px;"><strong>Motivo:</strong> ' + solicitacao.observacao + '</p>' : '');
        corpo.appendChild(infoDiv);
        
        var aviso = document.createElement('div');
        aviso.style.cssText = 'background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px;font-size:13px;color:#92400e;margin-bottom:16px;';
        aviso.innerHTML = '⚠️ <strong>OBRIGATÓRIO:</strong> Realize um <strong>check-list completo</strong> para aceitar.';
        corpo.appendChild(aviso);
        
        var itensChecklist = ['Pneus','Freios','Óleo','Água','Luzes','Limpadores','Bateria','Cintos','Documentos','Extintor','Triângulo','Limpeza'];
        
        var checkDiv = document.createElement('div');
        checkDiv.id = 'checkItensTransf';
        checkDiv.style.cssText = 'border:1px solid #e5e7eb;border-radius:8px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;';
        
        for (var c = 0; c < itensChecklist.length; c++) {
            var item = itensChecklist[c];
            var idItem = 'checkTransf_' + c;
            var labelItem = document.createElement('label');
            labelItem.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:6px;background:#f9fafb;border-radius:6px;';
            var inputCheck = document.createElement('input');
            inputCheck.type = 'checkbox';
            inputCheck.id = idItem;
            inputCheck.style.cssText = 'width:16px;height:16px;cursor:pointer;';
            var spanItem = document.createElement('span');
            spanItem.textContent = item;
            labelItem.appendChild(inputCheck);
            labelItem.appendChild(spanItem);
            checkDiv.appendChild(labelItem);
        }
        corpo.appendChild(checkDiv);
        
        var rodape = document.createElement('div');
        rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;';
        var btnRejeitar = document.createElement('button');
        btnRejeitar.type = 'button';
        btnRejeitar.textContent = '❌ Rejeitar';
        btnRejeitar.style.cssText = 'padding:10px 20px;border:1px solid #dc2626;background:white;color:#dc2626;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
        btnRejeitar.onclick = function() {
            if (confirm('Rejeitar esta transferência?')) {
                rejeitarTransferencia(solicitacaoId);
                fundo.remove();
            }
        };
        var btnAceitar = document.createElement('button');
        btnAceitar.type = 'button';
        btnAceitar.textContent = '✅ Confirmar';
        btnAceitar.style.cssText = 'padding:10px 20px;border:none;background:#10b981;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
        btnAceitar.onclick = function() {
            confirmarAceiteTransf(solicitacaoId, itensChecklist);
        };
        rodape.appendChild(btnRejeitar);
        rodape.appendChild(btnAceitar);
        corpo.appendChild(rodape);
        
        caixa.appendChild(cabecalho);
        caixa.appendChild(corpo);
        fundo.appendChild(caixa);
        document.body.appendChild(fundo);
        
    } catch (e) {
        console.error(e);
        alert('Erro');
    }
}

function confirmarAceiteTransf(solicitacaoId, itensChecklist) {
    try {
        var itens = {};
        var aprovados = 0;
        for (var c = 0; c < itensChecklist.length; c++) {
            var el = document.getElementById('checkTransf_' + c);
            var ok = el ? el.checked : false;
            itens[itensChecklist[c]] = ok;
            if (ok) aprovados++;
        }
        
        var total = itensChecklist.length;
        var percentual = (aprovados / total) * 100;
        
        if (percentual < 70) {
            if (!confirm('Apenas ' + aprovados + '/' + total + ' itens aprovados. Continuar?')) return;
        }
        
        var resultado = aprovados === total ? 'Aprovado' : (percentual >= 70 ? 'Pendente' : 'Reprovado');
        
        var checklist = {
            id: Date.now(),
            veiculoId: null,
            motorista: null,
            km: 0,
            itens: itens,
            resultado: resultado,
            data: new Date().toISOString().split('T')[0],
            dataHora: new Date().toISOString(),
            realizadoPor: window.usuarioAtual?.nome || 'Sistema',
            origem: 'transferencia'
        };
        
        if (!BD.checklists) BD.checklists = [];
        BD.checklists.unshift(checklist);
        
        for (var i = 0; i < BD.solicitacoesTransferencia.length; i++) {
            if (BD.solicitacoesTransferencia[i].id === solicitacaoId) {
                var sol = BD.solicitacoesTransferencia[i];
                sol.status = 'Transferido';
                sol.dataAceite = new Date().toISOString();
                sol.checklistId = checklist.id;
                sol.resultadoChecklist = resultado;
                
                checklist.veiculoId = sol.veiculoId;
                checklist.motorista = sol.motoristaDestino;
                
                if (BD.veiculos) {
                    for (var v = 0; v < BD.veiculos.length; v++) {
                        if (BD.veiculos[v].id === sol.veiculoId) {
                            BD.veiculos[v].responsavel = sol.motoristaDestino;
                            checklist.km = BD.veiculos[v].km_atual || 0;
                            break;
                        }
                    }
                }
                
                if (typeof registrarHistoricoCondutor === 'function') {
                    registrarHistoricoCondutor(sol.veiculoId, sol.motoristaDestino, 'responsavel', 'Transferência - ' + resultado);
                }
                break;
            }
        }
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        document.getElementById('modal-aceitar-transf')?.remove();
        atualizarBadgeNotificacoes();
        atualizarCardsTransf();
        carregarTabelaPendentes();
        carregarHistoricoTransferencias();
        atualizarSelectVeiculosTransf();
        atualizarInfoResponsavelAtual();
        if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Transferência confirmada!', 'sucesso');
        } else {
            alert('✅ Transferência confirmada!\nCheck-list: ' + resultado);
        }
        
    } catch (e) {
        console.error(e);
        alert('Erro');
    }
}

function rejeitarTransferencia(solicitacaoId) {
    try {
        for (var i = 0; i < BD.solicitacoesTransferencia.length; i++) {
            if (BD.solicitacoesTransferencia[i].id === solicitacaoId) {
                BD.solicitacoesTransferencia[i].status = 'Rejeitado';
                BD.solicitacoesTransferencia[i].dataRejeicao = new Date().toISOString();
                break;
            }
        }
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        atualizarBadgeNotificacoes();
        atualizarCardsTransf();
        carregarTabelaPendentes();
        carregarHistoricoTransferencias();
        
        if (typeof mostrarToast === 'function') mostrarToast('Transferência rejeitada.', 'aviso');
    } catch (e) { console.error(e); }
}

function contarSolicitacoesPendentes() {
    try {
        if (!BD || !BD.solicitacoesTransferencia) return 0;
        var perfil = window.usuarioAtual?.perfil || '';
        var nome = window.usuarioAtual?.nome || '';
        var isAdmin = perfil === 'admin' || perfil === 'supervisor';
        var count = 0;
        for (var i = 0; i < BD.solicitacoesTransferencia.length; i++) {
            var s = BD.solicitacoesTransferencia[i];
            if (s.status !== 'Solicitado') continue;
            if (isAdmin || s.motoristaDestino === nome) count++;
        }
        return count;
    } catch (e) { return 0; }
}

function atualizarBadgeNotificacoes() {
    try {
        var badge = document.getElementById('badgeNotificacoes');
        if (!badge) return;
        var qtd = contarSolicitacoesPendentes();
        if (qtd > 0) {
            badge.textContent = qtd;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch (e) {}
}

// EXPORTAÇÃO GLOBAL
window.solicitarTransferenciaDireta = solicitarTransferenciaDireta;
window.abrirModalAceitarTransf = abrirModalAceitarTransf;
window.rejeitarTransferencia = rejeitarTransferencia;
window.contarSolicitacoesPendentes = contarSolicitacoesPendentes;
window.atualizarBadgeNotificacoes = atualizarBadgeNotificacoes;
window.inicializarTransferencias = inicializarTransferencias;
window.atualizarCardsTransf = atualizarCardsTransf;
window.carregarTabelaPendentes = carregarTabelaPendentes;
window.carregarHistoricoTransferencias = carregarHistoricoTransferencias;

// INICIALIZAÇÃO
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(inicializarTransferencias, 1500);
    });
} else {
    setTimeout(inicializarTransferencias, 1500);
}

// Atualiza quando a página é exibida
try {
    var observerTransf = new MutationObserver(function() {
        var pagina = document.getElementById('pagina-solicitacoes');
        if (pagina && pagina.classList.contains('ativa')) {
            inicializarTransferencias();
        }
    });
    if (document.body) {
        observerTransf.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
} catch(e) {}

// Mantém compatibilidade com funções antigas
window.abrirModalAceitarTransferencia = abrirModalAceitarTransf;
window.abrirModalSolicitarTransferencia = function() {
    mostrarPagina('solicitacoes');
};

console.log('✅ transferencias.js carregado');
