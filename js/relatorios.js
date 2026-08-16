// ==================================================
// 📊 RELATÓRIOS - FUNCIONALIDADE COMPLETA
// ✅ Relatorio de Transferencias por Periodo
// ==================================================

var dadosRelatorioAtual = [];

function trocarAbaRelatorio(aba) {
    try {
        var botoes = document.querySelectorAll('[data-aba-rel]');
        for (var i = 0; i < botoes.length; i++) {
            botoes[i].classList.remove('ativo');
            botoes[i].style.borderBottomColor = 'transparent';
            botoes[i].style.color = '#64748b';
            if (botoes[i].getAttribute('data-aba-rel') === aba) {
                botoes[i].classList.add('ativo');
                botoes[i].style.borderBottomColor = '#2563eb';
                botoes[i].style.color = '#2563eb';
            }
        }
        
        var abas = ['transferencias'];
        for (var j = 0; j < abas.length; j++) {
            var el = document.getElementById('aba-rel-' + abas[j]);
            if (el) el.style.display = 'none';
        }
        
        var abaAtual = document.getElementById('aba-rel-' + aba);
        if (abaAtual) abaAtual.style.display = 'block';
        
    } catch (e) {
        console.error('Erro ao trocar aba relatorio:', e);
    }
}

function atualizarSelectVeiculosRelatorio() {
    try {
        var select = document.getElementById('relVeiculo');
        if (!select || typeof BD === 'undefined' || !BD.veiculos) return;
        
        var valorAtual = select.value;
        select.innerHTML = '<option value="todos">Todos os veiculos</option>';
        
        for (var i = 0; i < BD.veiculos.length; i++) {
            var v = BD.veiculos[i];
            var opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = v.placa + ' - ' + (v.modelo || '');
            select.appendChild(opt);
        }
        
        if (valorAtual && select.querySelector('option[value="' + valorAtual + '"]')) {
            select.value = valorAtual;
        }
    } catch (e) {
        console.error(e);
    }
}

function gerarRelatorioTransferencias() {
    try {
        if (typeof BD === 'undefined' || !BD.historicoCondutores) {
            alert('Nenhum dado de historico disponivel.');
            return;
        }
        
        var dataInicio = document.getElementById('relDataInicio')?.value;
        var dataFim = document.getElementById('relDataFim')?.value;
        var filtroVeiculo = document.getElementById('relVeiculo')?.value || 'todos';
        
        if (!dataInicio || !dataFim) {
            alert('Selecione a data inicial e final!');
            return;
        }
        
        if (new Date(dataInicio) > new Date(dataFim)) {
            alert('Data inicial nao pode ser maior que a data final!');
            return;
        }
        
        var historico = BD.historicoCondutores.filter(function(h) {
            var dataEvento = new Date(h.dataInicio);
            var inicio = new Date(dataInicio);
            var fim = new Date(dataFim);
            fim.setHours(23, 59, 59, 999);
            
            var noPeriodo = dataEvento >= inicio && dataEvento <= fim;
            var veiculoOk = filtroVeiculo === 'todos' || String(h.veiculoId) === String(filtroVeiculo);
            
            return noPeriodo && veiculoOk;
        });
        
        historico.sort(function(a, b) {
            return new Date(a.dataInicio) - new Date(b.dataInicio);
        });
        
        var historicoCompleto = BD.historicoCondutores.slice().sort(function(a, b) {
            return new Date(a.dataInicio) - new Date(b.dataInicio);
        });
        
        var timelinePorVeiculo = {};
        for (var i = 0; i < historicoCompleto.length; i++) {
            var h = historicoCompleto[i];
            if (!timelinePorVeiculo[h.veiculoId]) timelinePorVeiculo[h.veiculoId] = [];
            timelinePorVeiculo[h.veiculoId].push(h);
        }
        
        var transferencias = [];
        for (var t = 0; t < historico.length; t++) {
            var item = historico[t];
            var timeline = timelinePorVeiculo[item.veiculoId] || [];
            var idx = -1;
            for (var ti = 0; ti < timeline.length; ti++) {
                if (timeline[ti].id === item.id) {
                    idx = ti;
                    break;
                }
            }
            
            var motoristaAnterior = '-';
            var diasAnterior = '-';
            
            if (idx > 0) {
                var anterior = timeline[idx - 1];
                motoristaAnterior = anterior.motorista;
                
                if (anterior.dataInicio && item.dataInicio) {
                    var d1 = new Date(anterior.dataInicio);
                    var d2 = new Date(item.dataInicio);
                    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                        diasAnterior = Math.ceil(Math.abs(d2 - d1) / 86400000);
                    }
                }
            }
            
            var veiculo = null;
            if (BD.veiculos) {
                for (var vi = 0; vi < BD.veiculos.length; vi++) {
                    if (BD.veiculos[vi].id === item.veiculoId) {
                        veiculo = BD.veiculos[vi];
                        break;
                    }
                }
            }
            
            var tipoLabel = item.tipo === 'alocacao' ? 'Alocacao' : 'Responsavel';
            var tipoCor = item.tipo === 'alocacao' ? '#f59e0b' : '#3b82f6';
            
            transferencias.push({
                data: item.dataInicio,
                veiculo: veiculo ? veiculo.placa : 'ID: ' + item.veiculoId,
                veiculoId: item.veiculoId,
                motoristaAnterior: motoristaAnterior,
                novoMotorista: item.motorista,
                tipo: tipoLabel,
                tipoCor: tipoCor,
                diasAnterior: diasAnterior,
                observacao: item.observacao || '-'
            });
        }
        
        dadosRelatorioAtual = transferencias;
        renderizarRelatorioTransferencias(transferencias);
        
    } catch (e) {
        console.error('Erro ao gerar relatorio:', e);
        alert('Erro ao gerar relatorio');
    }
}

function renderizarRelatorioTransferencias(dados) {
    try {
        var tbody = document.getElementById('tbodyRelatorioTransferencias');
        if (!tbody) return;
        
        if (dados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#64748b;">Nenhuma transferencia encontrada no periodo selecionado.</td></tr>';
            atualizarResumoRelatorio(0, 0, 0, 0);
            return;
        }
        
        var html = '';
        for (var i = 0; i < dados.length; i++) {
            var d = dados[i];
            html += '<tr>' +
                '<td>' + d.data + '</td>' +
                '<td><strong>' + d.veiculo + '</strong></td>' +
                '<td>' + d.motoristaAnterior + '</td>' +
                '<td><strong>' + d.novoMotorista + '</strong></td>' +
                '<td><span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:500;color:white;background:' + d.tipoCor + ';">' + d.tipo + '</span></td>' +
                '<td>' + (typeof d.diasAnterior === 'number' ? d.diasAnterior + ' dias' : d.diasAnterior) + '</td>' +
                '<td style="max-width:200px;font-size:12px;color:#64748b;">' + d.observacao + '</td>' +
                '</tr>';
        }
        
        tbody.innerHTML = html;
        
        var totalTransferencias = dados.length;
        var veiculosSet = {};
        var motoristasSet = {};
        var somaDias = 0;
        var contagemDias = 0;
        
        for (var j = 0; j < dados.length; j++) {
            veiculosSet[dados[j].veiculoId] = true;
            motoristasSet[dados[j].novoMotorista] = true;
            motoristasSet[dados[j].motoristaAnterior] = true;
            if (typeof dados[j].diasAnterior === 'number') {
                somaDias += dados[j].diasAnterior;
                contagemDias++;
            }
        }
        
        var veiculosEnvolvidos = Object.keys(veiculosSet).length;
        var motoristasEnvolvidos = Object.keys(motoristasSet).length;
        var mediaDias = contagemDias > 0 ? Math.round(somaDias / contagemDias) : 0;
        
        atualizarResumoRelatorio(totalTransferencias, veiculosEnvolvidos, motoristasEnvolvidos, mediaDias);
        
    } catch (e) {
        console.error(e);
    }
}

function atualizarResumoRelatorio(transferencias, veiculos, motoristas, mediaDias) {
    try {
        var container = document.getElementById('relatorioResumo');
        if (!container) return;
        
        container.innerHTML = 
            '<div style="background:white;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #2563eb;">' +
                '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">🔄 Transferencias</div>' +
                '<div style="font-size:28px;font-weight:700;color:#0f172a;">' + transferencias + '</div>' +
            '</div>' +
            '<div style="background:white;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #7c3aed;">' +
                '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">🚛 Veiculos</div>' +
                '<div style="font-size:28px;font-weight:700;color:#0f172a;">' + veiculos + '</div>' +
            '</div>' +
            '<div style="background:white;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #10b981;">' +
                '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">👤 Motoristas</div>' +
                '<div style="font-size:28px;font-weight:700;color:#0f172a;">' + motoristas + '</div>' +
            '</div>' +
            '<div style="background:white;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,0.1);border-left:4px solid #f59e0b;">' +
                '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">📅 Media de dias</div>' +
                '<div style="font-size:28px;font-weight:700;color:#0f172a;">' + mediaDias + ' dias</div>' +
            '</div>';
            
    } catch (e) {
        console.error(e);
    }
}

function exportarRelatorioCSV() {
    try {
        if (dadosRelatorioAtual.length === 0) {
            alert('Gere o relatorio primeiro antes de exportar!');
            return;
        }
        
        var cabecalho = ['Data', 'Veiculo', 'Motorista Anterior', 'Novo Motorista', 'Tipo', 'Dias Anterior', 'Observacao'];
        var linhas = [cabecalho.join(';')];
        
        for (var i = 0; i < dadosRelatorioAtual.length; i++) {
            var d = dadosRelatorioAtual[i];
            var linha = [
                d.data,
                d.veiculo,
                d.motoristaAnterior,
                d.novoMotorista,
                d.tipo,
                typeof d.diasAnterior === 'number' ? d.diasAnterior : '',
                d.observacao
            ];
            linhas.push(linha.join(';'));
        }
        
        var csv = linhas.join('\n');
        var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'relatorio-transferencias-' + new Date().toISOString().split('T')[0] + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Relatorio exportado com sucesso!', 'sucesso');
        } else {
            alert('Relatorio exportado!');
        }
        
    } catch (e) {
        console.error(e);
        alert('Erro ao exportar');
    }
}

function inicializarRelatorios() {
    try {
        var hoje = new Date();
        var trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(hoje.getDate() - 30);
        
        var elInicio = document.getElementById('relDataInicio');
        var elFim = document.getElementById('relDataFim');
        
        if (elInicio) elInicio.value = trintaDiasAtras.toISOString().split('T')[0];
        if (elFim) elFim.value = hoje.toISOString().split('T')[0];
        
        atualizarSelectVeiculosRelatorio();
        
        console.log('relatorios.js inicializado');
    } catch (e) {
        console.error('Erro ao inicializar relatorios:', e);
    }
}

window.trocarAbaRelatorio = trocarAbaRelatorio;
window.gerarRelatorioTransferencias = gerarRelatorioTransferencias;
window.exportarRelatorioCSV = exportarRelatorioCSV;
window.atualizarSelectVeiculosRelatorio = atualizarSelectVeiculosRelatorio;
window.inicializarRelatorios = inicializarRelatorios;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarRelatorios);
} else {
    setTimeout(inicializarRelatorios, 1000);
}
