// ==================================================
// ✅ CHECK-LIST - VERSÃO CORRIGIDA
// ✅ Modal funcionando
// ==================================================

const ITENS_CHECKLIST = [
    'Pneus (calibragem e estado)', 'Freios', 'Óleo do motor', 'Água do radiador',
    'Luzes (farol, seta, freio)', 'Limpadores de para-brisa', 'Bateria', 'Cintos de segurança',
    'Documentos do veículo', 'Extintor de incêndio', 'Triângulo de sinalização', 'Limpeza geral'
];

function carregarTabelaChecklist() {
    try {
        const tabela = document.getElementById('tabelaChecklist');
        if (!tabela) return;
        
        const filtroVeiculo = document.getElementById('filtroChecklistVeiculo')?.value || 'todos';
        const filtroStatus = document.getElementById('filtroChecklistStatus')?.value || 'todos';
        
        let checklists = (typeof BD !== 'undefined' && BD.checklists) ? [...BD.checklists] : [];
        
        if (filtroVeiculo !== 'todos') {
            checklists = checklists.filter(c => String(c.veiculoId) === String(filtroVeiculo));
        }
        if (filtroStatus !== 'todos') {
            checklists = checklists.filter(c => c.resultado === filtroStatus);
        }
        
        if (checklists.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#64748b;">Nenhum check-list realizado</td></tr>';
            return;
        }
        
        const statusCor = { 'Aprovado': '#10b981', 'Pendente': '#f59e0b', 'Reprovado': '#dc2626' };
        
        tabela.innerHTML = checklists.map(c => {
            const veiculo = BD.veiculos?.find(v => String(v.id) === String(c.veiculoId));
            const aprovados = Object.values(c.itens || {}).filter(Boolean).length;
            const total = Object.keys(c.itens || {}).length;
            return '<tr>' +
                '<td>' + (c.data || '-') + '</td>' +
                '<td><strong>' + (veiculo?.placa || '-') + '</strong></td>' +
                '<td>' + aprovados + '/' + total + '</td>' +
                '<td><span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;color:white;background:' + (statusCor[c.resultado] || '#6b7280') + '">' + (c.resultado || '-') + '</span></td>' +
                '<td>' + (c.motorista || '-') + '</td>' +
                '<td>' +
                    '<button onclick="verDetalhesChecklist(' + c.id + ')" style="padding:6px 10px;border:none;background:#3b82f6;color:white;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px;">👁️ Ver</button>' +
                    '<button onclick="excluirChecklist(' + c.id + ')" style="padding:6px 10px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:12px;">🗑️</button>' +
                '</td>' +
                '</tr>';
        }).join('');
        
    } catch (e) { console.error('❌ Erro carregar checklist:', e); }
}

function abrirModalChecklist() {
    console.log('📝 abrirModalChecklist chamado');
    
    if (typeof BD === 'undefined' || !BD.veiculos || BD.veiculos.length === 0) {
        alert('⚠️ Cadastre um veículo primeiro!');
        return;
    }
    
    const antigo = document.getElementById('modal-checklist-final');
    if (antigo) antigo.remove();
    
    const fundo = document.createElement('div');
    fundo.id = 'modal-checklist-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
    
    const caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:600px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    const cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#059669;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    cabecalho.innerHTML = '<h3 style="margin:0;font-size:18px;">✅ Novo Check-list</h3>';
    const btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    const corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    const form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
    form.onsubmit = function(e) { e.preventDefault(); salvarChecklistForm(); };
    
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
    
    form.appendChild(addCampo('Veículo', 'text', 'clVeiculo', true, veiculosOpts));
    form.appendChild(addCampo('Motorista/Responsável', 'text', 'clMotorista', true));
    
    // Container para campos de KM e Horímetro (atualizados dinamicamente)
    const containerMedidores = document.createElement('div');
    containerMedidores.id = 'containerMedidoresChecklist';
    containerMedidores.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px;';
    form.appendChild(containerMedidores);
    
    // Função para atualizar campos de KM/Horímetro baseado no veículo selecionado
    function atualizarCamposMedidores() {
        const veiculoId = document.getElementById('clVeiculo')?.value;
        containerMedidores.innerHTML = '';
        
        if (!veiculoId) return;
        
        const usaKm = typeof veiculoUsaKm === 'function' ? veiculoUsaKm(veiculoId) : true;
        const usaHorimetro = typeof veiculoUsaHorimetro === 'function' ? veiculoUsaHorimetro(veiculoId) : false;
        
        if (usaKm) {
            containerMedidores.appendChild(addCampo('🛣️ KM Atual', 'number', 'clKm', true));
        } else {
            // Campo informativo: isento
            const info = document.createElement('div');
            info.style.cssText = 'padding:10px 12px;background:#fef3c7;border:1px dashed #f59e0b;border-radius:8px;font-size:12px;color:#92400e;display:flex;align-items:center;';
            info.innerHTML = '🛣️ <strong style="margin-left:6px;">KM:</strong> Isento para este veículo';
            containerMedidores.appendChild(info);
            // Cria input hidden para evitar erros
            const hiddenKm = document.createElement('input');
            hiddenKm.type = 'hidden';
            hiddenKm.id = 'clKm';
            hiddenKm.value = '0';
            containerMedidores.appendChild(hiddenKm);
        }
        
        if (usaHorimetro) {
            containerMedidores.appendChild(addCampo('⏱️ Horímetro', 'number', 'clHorimetro', true));
        }
    }
    
    // Listener para quando o veículo mudar
    setTimeout(function() {
        const selectVeiculo = document.getElementById('clVeiculo');
        if (selectVeiculo) {
            selectVeiculo.addEventListener('change', atualizarCamposMedidores);
        }
    }, 100);
    
    // Itens do checklist
    const divItens = document.createElement('div');
    divItens.style.cssText = 'border:1px solid #e5e7eb;border-radius:8px;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;';
    
    ITENS_CHECKLIST.forEach(function(item, idx) {
        const idItem = 'clItem_' + idx;
        const labelItem = document.createElement('label');
        labelItem.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:6px;background:#f9fafb;border-radius:6px;';
        labelItem.innerHTML = '<input type="checkbox" id="' + idItem + '" style="width:16px;height:16px;cursor:pointer;"> <span>' + item + '</span>';
        divItens.appendChild(labelItem);
    });
    
    const lblItens = document.createElement('label');
    lblItens.style.cssText = 'font-size:14px;font-weight:500;color:#374151;margin-bottom:-6px;';
    lblItens.textContent = 'Itens do Check-list (marque os aprovados):';
    form.appendChild(lblItens);
    form.appendChild(divItens);
    
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
    btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#059669;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    form.appendChild(rodape);
    
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    
    console.log('✅ Modal checklist aberto!');
}

function salvarChecklistForm() {
    try {
        const veiculoId = document.getElementById('clVeiculo')?.value;
        const motorista = document.getElementById('clMotorista')?.value.trim();
        
        // Validação condicional de KM e Horímetro
        const usaKm = typeof veiculoUsaKm === 'function' ? veiculoUsaKm(veiculoId) : true;
        const usaHorimetro = typeof veiculoUsaHorimetro === 'function' ? veiculoUsaHorimetro(veiculoId) : false;
        
        const kmEl = document.getElementById('clKm');
        const horimetroEl = document.getElementById('clHorimetro');
        
        const km = usaKm ? parseFloat(kmEl?.value) : 0;
        const horimetro = usaHorimetro ? parseFloat(horimetroEl?.value) : null;
        
        if (!veiculoId || !motorista) {
            alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        if (usaKm && (!kmEl || isNaN(km) || km <= 0)) {
            alert('⚠️ KM é obrigatório para este veículo!');
            kmEl?.focus();
            return;
        }
        
        if (usaHorimetro && (!horimetroEl || isNaN(horimetro) || horimetro < 0)) {
            alert('⚠️ Horímetro é obrigatório para este veículo!');
            horimetroEl?.focus();
            return;
        }
        
        const itens = {};
        ITENS_CHECKLIST.forEach(function(item, idx) {
            const el = document.getElementById('clItem_' + idx);
            itens[item] = el ? el.checked : false;
        });
        
        const totalItens = ITENS_CHECKLIST.length;
        const aprovados = Object.values(itens).filter(Boolean).length;
        let resultado;
        if (aprovados === totalItens) resultado = 'Aprovado';
        else if (aprovados >= totalItens * 0.7) resultado = 'Pendente';
        else resultado = 'Reprovado';
        
        const dados = {
            id: Date.now(),
            veiculoId: Number(veiculoId),
            motorista: motorista,
            km: km,
            horimetro: horimetro,
            usaKm: usaKm,
            usaHorimetro: usaHorimetro,
            itens: itens,
            resultado: resultado,
            data: new Date().toISOString().split('T')[0],
            dataHora: new Date().toISOString(),
            realizadoPor: window.usuarioAtual?.nome || 'Sistema'
        };
        
        if (typeof BD === 'undefined') BD = { checklists: [] };
        if (!BD.checklists) BD.checklists = [];
        BD.checklists.unshift(dados);
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('checklists', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar checklists do Supabase:', r.erro);
                    });
                }
            }
        
        document.getElementById('modal-checklist-final')?.remove();
        carregarTabelaChecklist();
        
        if (typeof mostrarToast === 'function') mostrarToast('Check-list salvo! Resultado: ' + resultado, resultado === 'Aprovado' ? 'sucesso' : resultado === 'Reprovado' ? 'erro' : 'aviso');
        else alert('✅ Check-list salvo! Resultado: ' + resultado);
        
    } catch (e) {
        console.error('❌ Erro:', e);
        alert('❌ Erro ao salvar');
    }
}

function verDetalhesChecklist(id) {
    try {
        const c = BD.checklists?.find(x => x.id === id);
        if (!c) return;
        
        const veiculo = BD.veiculos?.find(v => String(v.id) === String(c.veiculoId));
        
        const antigo = document.getElementById('modal-detalhes-checklist');
        if (antigo) antigo.remove();
        
        const fundo = document.createElement('div');
        fundo.id = 'modal-detalhes-checklist';
        fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
        fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
        
        const caixa = document.createElement('div');
        caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:500px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
        
        const statusCor = { 'Aprovado': '#10b981', 'Pendente': '#f59e0b', 'Reprovado': '#dc2626' };
        
        let itensHtml = '';
        Object.entries(c.itens || {}).forEach(function([item, ok]) {
            itensHtml += '<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:6px;background:' + (ok ? '#f0fdf4' : '#fef2f2') + ';">' +
                '<span style="font-size:16px;">' + (ok ? '✅' : '❌') + '</span>' +
                '<span style="font-size:13px;color:#374151;">' + item + '</span>' +
                '</div>';
        });
        
        caixa.innerHTML = '<div style="padding:16px 24px;background:#059669;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;">' +
            '<h3 style="margin:0;font-size:18px;">📋 Detalhes do Check-list</h3>' +
            '<button onclick="document.getElementById(\'modal-detalhes-checklist\').remove()" style="background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;">×</button>' +
            '</div>' +
            '<div style="padding:24px;">' +
            '<p style="margin:8px 0;"><strong>Veículo:</strong> ' + (veiculo?.placa || '-') + '</p>' +
            '<p style="margin:8px 0;"><strong>Motorista:</strong> ' + (c.motorista || '-') + '</p>' +
            '<p style="margin:8px 0;"><strong>Data:</strong> ' + (c.data || '-') + '</p>' +
            '<p style="margin:8px 0;"><strong>KM:</strong> ' + (c.usaKm === false ? 'Isento' : (c.km || 0)) + '</p>' +
            (c.usaHorimetro ? '<p style="margin:8px 0;"><strong>⏱️ Horímetro:</strong> ' + (c.horimetro || 0) + '</p>' : '') +
            '<p style="margin:8px 0;"><strong>Resultado:</strong> <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:500;color:white;background:' + (statusCor[c.resultado] || '#6b7280') + '">' + (c.resultado || '-') + '</span></p>' +
            '<h4 style="margin:20px 0 10px;font-size:15px;">Itens:</h4>' +
            '<div style="display:flex;flex-direction:column;gap:6px;">' + itensHtml + '</div>' +
            '</div>';
        
        fundo.appendChild(caixa);
        document.body.appendChild(fundo);
        
    } catch (e) { console.error(e); }
}

function excluirChecklist(id) {
    try {
        if (!confirm('Excluir este check-list?')) return;
        if (typeof BD !== 'undefined' && BD.checklists) {
            BD.checklists = BD.checklists.filter(c => c.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('checklists', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar checklists do Supabase:', r.erro);
                    });
                }
            }
        }
        carregarTabelaChecklist();
    } catch (e) { console.error(e); }
}

window.carregarTabelaChecklist = carregarTabelaChecklist;
window.abrirModalChecklist = abrirModalChecklist;
window.verDetalhesChecklist = verDetalhesChecklist;
window.excluirChecklist = excluirChecklist;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        const filtV = document.getElementById('filtroChecklistVeiculo');
        const filtS = document.getElementById('filtroChecklistStatus');
        if (filtV) filtV.addEventListener('change', carregarTabelaChecklist);
        if (filtS) filtS.addEventListener('change', carregarTabelaChecklist);
        console.log('✅ checklist.js inicializado');
    });
}