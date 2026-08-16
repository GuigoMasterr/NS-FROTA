// ==================================================
// ⚙️ TRANSFERÊNCIAS DE RESPONSABILIDADE
// ✅ Regra de negocio: Solicitacao -> Aceite com Checklist -> Confirmacao
// ==================================================

function abrirModalSolicitarTransferencia(veiculoId) {
    try {
        if (typeof BD === 'undefined' || !BD.veiculos) return;
        
        var veiculo = null;
        for (var i = 0; i < BD.veiculos.length; i++) {
            if (BD.veiculos[i].id === veiculoId) {
                veiculo = BD.veiculos[i];
                break;
            }
        }
        
        if (!veiculo) return;
        
        if (!veiculo.responsavel) {
            alert('Este veiculo nao tem responsavel definido!');
            return;
        }
        
        var antigo = document.getElementById('modal-solic-transf');
        if (antigo) antigo.remove();
        
        var fundo = document.createElement('div');
        fundo.id = 'modal-solic-transf';
        fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
        fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
        
        var caixa = document.createElement('div');
        caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:480px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
        
        var cabecalho = document.createElement('div');
        cabecalho.style.cssText = 'padding:16px 24px;background:#f59e0b;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
        var titulo = document.createElement('h3');
        titulo.style.cssText = 'margin:0;font-size:18px;';
        titulo.textContent = 'Solicitar Transferencia - ' + veiculo.placa;
        cabecalho.appendChild(titulo);
        var btnFechar = document.createElement('button');
        btnFechar.textContent = '×';
        btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
        btnFechar.onclick = function() { fundo.remove(); };
        cabecalho.appendChild(btnFechar);
        
        var corpo = document.createElement('div');
        corpo.style.cssText = 'padding:24px;';
        
        // Info do veiculo e responsavel atual
        var infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px;margin-bottom:16px;';
        infoDiv.innerHTML = 
            '<p style="margin:4px 0;font-size:13px;"><strong>Veiculo:</strong> ' + veiculo.placa + ' - ' + (veiculo.modelo || '') + '</p>' +
            '<p style="margin:4px 0;font-size:13px;"><strong>Responsavel atual:</strong> ' + veiculo.responsavel + '</p>';
        corpo.appendChild(infoDiv);
        
        var form = document.createElement('form');
        form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
        form.onsubmit = function(e) {
            e.preventDefault();
            enviarSolicitacaoTransferencia(veiculoId);
        };
        
        // Motorista destino
        var grupo = document.createElement('div');
        grupo.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        var lbl = document.createElement('label');
        lbl.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
        lbl.innerHTML = 'Novo Responsavel <span style="color:#dc2626;">*</span>';
        grupo.appendChild(lbl);
        
        var select = document.createElement('select');
        select.id = 'transfMotoristaDestino';
        select.required = true;
        select.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;background:white;';
        
        var optVazia = document.createElement('option');
        optVazia.value = '';
        optVazia.textContent = 'Selecione o motorista...';
        select.appendChild(optVazia);
        
        // Busca motoristas (usuarios com perfil motorista + responsaveis existentes)
        var motoristas = {};
        if (BD.usuarios) {
            for (var u = 0; u < BD.usuarios.length; u++) {
                var usr = BD.usuarios[u];
                if ((usr.perfil === 'motorista' || usr.perfil === 'operacional') && usr.ativo !== false && usr.nome !== veiculo.responsavel) {
                    motoristas[usr.nome] = true;
                }
            }
        }
        if (BD.veiculos) {
            for (var v = 0; v < BD.veiculos.length; v++) {
                if (BD.veiculos[v].responsavel && BD.veiculos[v].responsavel !== veiculo.responsavel) {
                    motoristas[BD.veiculos[v].responsavel] = true;
                }
            }
        }
        
        var nomes = Object.keys(motoristas).sort();
        if (nomes.length === 0) {
            var optNenhum = document.createElement('option');
            optNenhum.value = '';
            optNenhum.textContent = 'Nenhum outro motorista cadastrado';
            select.appendChild(optNenhum);
        } else {
            for (var n = 0; n < nomes.length; n++) {
                var opt = document.createElement('option');
                opt.value = nomes[n];
                opt.textContent = nomes[n];
                select.appendChild(opt);
            }
        }
        grupo.appendChild(select);
        form.appendChild(grupo);
        
        // Observacao
        var grupoObs = document.createElement('div');
        grupoObs.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        var lblObs = document.createElement('label');
        lblObs.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
        lblObs.textContent = 'Motivo/Observacao';
        grupoObs.appendChild(lblObs);
        var txtObs = document.createElement('textarea');
        txtObs.id = 'transfObservacao';
        txtObs.rows = 3;
        txtObs.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;';
        grupoObs.appendChild(txtObs);
        form.appendChild(grupoObs);
        
        // Aviso
        var aviso = document.createElement('div');
        aviso.style.cssText = 'background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;font-size:12px;color:#1e40af;';
        aviso.textContent = '⚠️ Ao confirmar, admins e supervisores serao notificados. O novo responsavel devera fazer um check-list para aceitar a transferencia.';
        form.appendChild(aviso);
        
        var rodape = document.createElement('div');
        rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:10px;';
        var btnCancelar = document.createElement('button');
        btnCancelar.type = 'button';
        btnCancelar.textContent = 'Cancelar';
        btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
        btnCancelar.onclick = function() { fundo.remove(); };
        var btnSolicitar = document.createElement('button');
        btnSolicitar.type = 'submit';
        btnSolicitar.textContent = '📤 Solicitar';
        btnSolicitar.style.cssText = 'padding:10px 20px;border:none;background:#f59e0b;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
        rodape.appendChild(btnCancelar);
        rodape.appendChild(btnSolicitar);
        form.appendChild(rodape);
        
        corpo.appendChild(form);
        caixa.appendChild(cabecalho);
        caixa.appendChild(corpo);
        fundo.appendChild(caixa);
        document.body.appendChild(fundo);
        
    } catch (e) {
        console.error(e);
        alert('Erro ao abrir solicitacao');
    }
}

function enviarSolicitacaoTransferencia(veiculoId) {
    try {
        var motoristaDestino = document.getElementById('transfMotoristaDestino')?.value;
        var observacao = document.getElementById('transfObservacao')?.value.trim();
        
        if (!motoristaDestino) {
            alert('Selecione o novo responsavel!');
            return;
        }
        
        var veiculo = null;
        for (var i = 0; i < BD.veiculos.length; i++) {
            if (BD.veiculos[i].id === veiculoId) {
                veiculo = BD.veiculos[i];
                break;
            }
        }
        
        if (!veiculo) return;
        
        var solicitacao = {
            id: Date.now(),
            veiculoId: veiculoId,
            placa: veiculo.placa,
            modelo: veiculo.modelo || '',
            motoristaOrigem: veiculo.responsavel,
            motoristaDestino: motoristaDestino,
            status: 'Solicitado',
            dataSolicitacao: new Date().toISOString(),
            dataAceite: null,
            checklistId: null,
            observacao: observacao || '',
            solicitadoPor: window.usuarioAtual?.nome || 'Sistema'
        };
        
        if (!BD.solicitacoesTransferencia) BD.solicitacoesTransferencia = [];
        BD.solicitacoesTransferencia.unshift(solicitacao);
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        document.getElementById('modal-solic-transf')?.remove();
        
        atualizarBadgeNotificacoes();
        carregarTabelaSolicitacoes();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Solicitacao enviada! Admins e supervisores notificados.', 'sucesso');
        } else {
            alert('✅ Solicitacao enviada!\n\nAdmins e supervisores serao notificados.\nO novo responsavel devera aceitar fazendo um check-list.');
        }
        
    } catch (e) {
        console.error(e);
        alert('Erro ao enviar solicitacao');
    }
}

function abrirModalAceitarTransferencia(solicitacaoId) {
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
            alert('Apenas ' + solicitacao.motoristaDestino + ' pode aceitar esta transferencia!');
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
        titulo.textContent = '✅ Aceitar Transferencia - ' + solicitacao.placa;
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
            '<p style="margin:4px 0;font-size:13px;"><strong>Veiculo:</strong> ' + solicitacao.placa + ' - ' + (solicitacao.modelo || '') + '</p>' +
            '<p style="margin:4px 0;font-size:13px;"><strong>De:</strong> ' + solicitacao.motoristaOrigem + '</p>' +
            '<p style="margin:4px 0;font-size:13px;"><strong>Para:</strong> ' + solicitacao.motoristaDestino + '</p>';
        corpo.appendChild(infoDiv);
        
        var aviso = document.createElement('div');
        aviso.style.cssText = 'background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px;font-size:13px;color:#92400e;margin-bottom:16px;';
        aviso.innerHTML = '⚠️ <strong>OBRIGATORIO:</strong> Para aceitar a transferencia, voce deve realizar um <strong>check-list completo</strong> do veiculo. Marque apenas os itens que estao em boas condicoes.';
        corpo.appendChild(aviso);
        
        var itensChecklist = [
            'Pneus (calibragem e estado)', 'Freios', 'Oleo do motor', 'Agua do radiador',
            'Luzes (farol, seta, freio)', 'Limpadores', 'Bateria', 'Cintos de seguranca',
            'Documentos', 'Extintor', 'Triangulo', 'Limpeza geral'
        ];
        
        var lblCheck = document.createElement('label');
        lblCheck.style.cssText = 'font-size:14px;font-weight:600;color:#374151;margin-bottom:8px;display:block;';
        lblCheck.textContent = '📋 Check-list do Veiculo:';
        corpo.appendChild(lblCheck);
        
        var checkDiv = document.createElement('div');
        checkDiv.id = 'checkItensTransf';
        checkDiv.style.cssText = 'border:1px solid #e5e7eb;border-radius:8px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;';
        
        for (var c = 0; c < itensChecklist.length; c++) {
            var item = itensChecklist[c];
            var idItem = 'checkTransf_' + c;
            var labelItem = document.createElement('label');
            labelItem.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:6px;background:#f9fafb;border-radius:6px;';
            labelItem.innerHTML = '<input type="checkbox" id="' + idItem + '" style="width:16px;height:16px;cursor:pointer;"> <span>' + item + '</span>';
            checkDiv.appendChild(labelItem);
        }
        corpo.appendChild(checkDiv);
        
        var obsDiv = document.createElement('div');
        obsDiv.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-bottom:16px;';
        var lblObs = document.createElement('label');
        lblObs.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
        lblObs.textContent = 'Observacoes do check-list';
        obsDiv.appendChild(lblObs);
        var txtObs = document.createElement('textarea');
        txtObs.id = 'checkObsTransf';
        txtObs.rows = 2;
        txtObs.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;';
        obsDiv.appendChild(txtObs);
        corpo.appendChild(obsDiv);
        
        var rodape = document.createElement('div');
        rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;';
        var btnRejeitar = document.createElement('button');
        btnRejeitar.type = 'button';
        btnRejeitar.textContent = '❌ Rejeitar';
        btnRejeitar.style.cssText = 'padding:10px 20px;border:1px solid #dc2626;background:white;color:#dc2626;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
        btnRejeitar.onclick = function() {
            if (confirm('Rejeitar esta transferencia?')) {
                rejeitarTransferencia(solicitacaoId);
                fundo.remove();
            }
        };
        var btnAceitar = document.createElement('button');
        btnAceitar.type = 'button';
        btnAceitar.textContent = '✅ Confirmar Aceite';
        btnAceitar.style.cssText = 'padding:10px 20px;border:none;background:#10b981;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
        btnAceitar.onclick = function() {
            confirmarAceiteTransferencia(solicitacaoId, itensChecklist);
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

function confirmarAceiteTransferencia(solicitacaoId, itensChecklist) {
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
            if (!confirm('Apenas ' + aprovados + '/' + total + ' itens foram aprovados (' + percentual.toFixed(0) + '%).\n\nDeseja continuar mesmo assim?')) {
                return;
            }
        }
        
        var resultado;
        if (aprovados === total) resultado = 'Aprovado';
        else if (percentual >= 70) resultado = 'Pendente';
        else resultado = 'Reprovado';
        
        var observacao = document.getElementById('checkObsTransf')?.value.trim() || '';
        
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
                    registrarHistoricoCondutor(sol.veiculoId, sol.motoristaDestino, 'responsavel', 'Transferencia aceita - Check-list: ' + resultado);
                }
                
                break;
            }
        }
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        document.getElementById('modal-aceitar-transf')?.remove();
        atualizarBadgeNotificacoes();
        carregarTabelaSolicitacoes();
        if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Transferencia confirmada! Responsavel atualizado.', 'sucesso');
        } else {
            alert('✅ Transferencia confirmada!\n\nCheck-list: ' + resultado + '\nO responsavel do veiculo foi atualizado automaticamente.');
        }
        
    } catch (e) {
        console.error(e);
        alert('Erro ao confirmar');
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
        carregarTabelaSolicitacoes();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Transferencia rejeitada.', 'aviso');
        }
    } catch (e) {
        console.error(e);
    }
}

function contarSolicitacoesPendentes() {
    try {
        if (!BD || !BD.solicitacoesTransferencia) return 0;
        var perfil = window.usuarioAtual?.perfil || '';
        var nome = window.usuarioAtual?.nome || '';
        var isAdmin = perfil === 'admin' || perfil === 'supervisor';
        
        return BD.solicitacoesTransferencia.filter(function(s) {
            if (s.status !== 'Solicitado') return false;
            if (isAdmin) return true;
            return s.motoristaDestino === nome;
        }).length;
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

function carregarTabelaSolicitacoes() {
    try {
        var tabela = document.getElementById('tabelaSolicitacoes');
        if (!tabela) return;
        
        if (!BD || !BD.solicitacoesTransferencia) {
            tabela.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#64748b;">Nenhuma solicitacao encontrada</td></tr>';
            return;
        }
        
        var perfil = window.usuarioAtual?.perfil || '';
        var nome = window.usuarioAtual?.nome || '';
        var isAdmin = perfil === 'admin' || perfil === 'supervisor';
        
        var solicitacoes = BD.solicitacoesTransferencia.filter(function(s) {
            if (isAdmin) return true;
            return s.motoristaOrigem === nome || s.motoristaDestino === nome;
        });
        
        if (solicitacoes.length === 0) {
            tabela.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#64748b;">Nenhuma solicitacao encontrada</td></tr>';
            return;
        }
        
        var statusCor = { 'Solicitado': '#f59e0b', 'Transferido': '#10b981', 'Rejeitado': '#dc2626' };
        
        var html = '';
        for (var i = 0; i < solicitacoes.length; i++) {
            var s = solicitacoes[i];
            var cor = statusCor[s.status] || '#6b7280';
            var data = s.dataSolicitacao ? new Date(s.dataSolicitacao).toLocaleString('pt-BR') : '-';
            
            var acoes = '';
            if (s.status === 'Solicitado') {
                if (isAdmin || s.motoristaDestino === nome) {
                    acoes = '<button onclick="abrirModalAceitarTransferencia(' + s.id + ')" style="padding:6px 12px;border:none;background:#10b981;color:white;border-radius:6px;cursor:pointer;font-size:12px;">✅ Analisar</button>';
                } else {
                    acoes = '<span style="font-size:12px;color:#64748b;">Aguardando...</span>';
                }
            } else if (s.status === 'Transferido') {
                acoes = '<span style="font-size:12px;color:#10b981;font-weight:500;">✓ Concluido</span>';
            } else {
                acoes = '<span style="font-size:12px;color:#dc2626;font-weight:500;">✗ Rejeitado</span>';
            }
            
            html += '<tr>' +
                '<td>' + data + '</td>' +
                '<td><strong>' + s.placa + '</strong></td>' +
                '<td>' + s.motoristaOrigem + '</td>' +
                '<td><strong>' + s.motoristaDestino + '</strong></td>' +
                '<td><span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;color:white;background:' + cor + ';">' + s.status + '</span></td>' +
                '<td style="max-width:150px;font-size:12px;color:#64748b;">' + (s.observacao || '-') + '</td>' +
                '<td>' + acoes + '</td>' +
                '</tr>';
        }
        
        tabela.innerHTML = html;
        
    } catch (e) {
        console.error(e);
    }
}

// Expor funcoes globalmente
window.abrirModalSolicitarTransferencia = abrirModalSolicitarTransferencia;
window.abrirModalAceitarTransferencia = abrirModalAceitarTransferencia;
window.rejeitarTransferencia = rejeitarTransferencia;
window.contarSolicitacoesPendentes = contarSolicitacoesPendentes;
window.atualizarBadgeNotificacoes = atualizarBadgeNotificacoes;
window.carregarTabelaSolicitacoes = carregarTabelaSolicitacoes;

// Inicializar badge quando carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(atualizarBadgeNotificacoes, 1500);
    });
} else {
    setTimeout(atualizarBadgeNotificacoes, 1500);
}

console.log('✅ transferencias.js carregado');