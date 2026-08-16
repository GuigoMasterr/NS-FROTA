// ==================================================
// 🔔 CHAMADOS - VERSÃO CORRIGIDA
// ✅ Modal funcionando
// ==================================================

function carregarTabelaChamados() {
    try {
        const tabela = document.getElementById('tabelaChamados');
        if (!tabela) return;
        
        const filtroVeiculo = document.getElementById('filtroVeiculoChamado')?.value || 'todos';
        const filtroStatus = document.getElementById('filtroStatusChamado')?.value || 'todos';
        
        let chamados = (typeof BD !== 'undefined' && BD.chamados) ? [...BD.chamados] : [];
        
        if (filtroVeiculo !== 'todos') {
            chamados = chamados.filter(c => String(c.veiculoId) === String(filtroVeiculo));
        }
        if (filtroStatus !== 'todos') {
            chamados = chamados.filter(c => c.status === filtroStatus);
        }
        
        if (chamados.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#64748b;">Nenhum chamado registrado</td></tr>';
            return;
        }
        
        const statusCor = { 'Aberto': '#ef4444', 'Em Andamento': '#f59e0b', 'Resolvido': '#10b981', 'Fechado': '#6b7280' };
        
        tabela.innerHTML = chamados.map(c => {
            const veiculo = BD.veiculos?.find(v => String(v.id) === String(c.veiculoId));
            return '<tr>' +
                '<td>' + (c.data || '-') + '</td>' +
                '<td><strong>' + (veiculo?.placa || '-') + '</strong></td>' +
                '<td style="max-width:250px;">' + (c.titulo || '-') + '</td>' +
                '<td><span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;color:white;background:' + (statusCor[c.status] || '#6b7280') + '">' + (c.status || '-') + '</span></td>' +
                '<td>' + (c.relator || '-') + '</td>' +
                '<td>' +
                    (c.status !== 'Resolvido' && c.status !== 'Fechado' 
                        ? '<button onclick="resolverChamado(' + c.id + ')" style="padding:6px 10px;border:none;background:#10b981;color:white;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px;">✅ Resolver</button>' 
                        : '') +
                    '<button onclick="excluirChamado(' + c.id + ')" style="padding:6px 10px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:12px;">🗑️</button>' +
                '</td>' +
                '</tr>';
        }).join('');
        
    } catch (e) { console.error('❌ Erro carregar chamados:', e); }
}

function abrirModalChamado() {
    console.log('📝 abrirModalChamado chamado');
    
    if (typeof BD === 'undefined' || !BD.veiculos || BD.veiculos.length === 0) {
        alert('⚠️ Cadastre um veículo primeiro!');
        return;
    }
    
    const antigo = document.getElementById('modal-chamado-final');
    if (antigo) antigo.remove();
    
    const fundo = document.createElement('div');
    fundo.id = 'modal-chamado-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
    
    const caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:500px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    const cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#dc2626;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    cabecalho.innerHTML = '<h3 style="margin:0;font-size:18px;">🔔 Novo Chamado</h3>';
    const btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    const corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    const form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
    form.onsubmit = function(e) { e.preventDefault(); salvarChamadoForm(); };
    
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
    
    const prioridades = [{ valor: 'Baixa', texto: '🟢 Baixa' }, { valor: 'Média', texto: '🟡 Média' }, { valor: 'Alta', texto: '🔴 Alta' }];
    const veiculosOpts = BD.veiculos.map(v => ({ valor: v.id, texto: v.placa + ' - ' + (v.modelo || '') }));
    
    form.appendChild(addCampo('Veículo', 'text', 'cVeiculo', true, veiculosOpts));
    form.appendChild(addCampo('Título/Assunto', 'text', 'cTitulo', true));
    form.appendChild(addCampo('Prioridade', 'text', 'cPrioridade', true, prioridades));
    
    const grupoDesc = document.createElement('div');
    grupoDesc.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    const lblDesc = document.createElement('label');
    lblDesc.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
    lblDesc.innerHTML = 'Descrição <span style="color:#dc2626;">*</span>';
    grupoDesc.appendChild(lblDesc);
    const txtDesc = document.createElement('textarea');
    txtDesc.id = 'cDescricao';
    txtDesc.rows = 4;
    txtDesc.required = true;
    txtDesc.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;';
    grupoDesc.appendChild(txtDesc);
    form.appendChild(grupoDesc);
    
    const rodape = document.createElement('div');
    rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:10px;';
    const btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    btnCancelar.onclick = function() { fundo.remove(); };
    const btnSalvar = document.createElement('button');
    btnSalvar.type = 'submit';
    btnSalvar.textContent = '💾 Registrar';
    btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#dc2626;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    form.appendChild(rodape);
    
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    
    console.log('✅ Modal chamado aberto!');
}

function salvarChamadoForm() {
    try {
        const veiculoId = document.getElementById('cVeiculo')?.value;
        const titulo = document.getElementById('cTitulo')?.value.trim();
        const descricao = document.getElementById('cDescricao')?.value.trim();
        
        if (!veiculoId || !titulo || !descricao) {
            alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        const dados = {
            id: Date.now(),
            veiculoId: Number(veiculoId),
            titulo: titulo,
            descricao: descricao,
            prioridade: document.getElementById('cPrioridade')?.value || 'Média',
            status: 'Aberto',
            data: new Date().toISOString().split('T')[0],
            dataHora: new Date().toISOString(),
            relator: window.usuarioAtual?.nome || 'Sistema'
        };
        
        if (typeof BD === 'undefined') BD = { chamados: [] };
        if (!BD.chamados) BD.chamados = [];
        BD.chamados.unshift(dados);
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        document.getElementById('modal-chamado-final')?.remove();
        carregarTabelaChamados();
        if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
        
        if (typeof mostrarToast === 'function') mostrarToast('Chamado registrado!', 'sucesso');
        else alert('✅ Chamado registrado!');
        
    } catch (e) {
        console.error('❌ Erro:', e);
        alert('❌ Erro ao salvar');
    }
}

function resolverChamado(id) {
    try {
        if (!confirm('Marcar chamado como resolvido?')) return;
        if (typeof BD !== 'undefined' && BD.chamados) {
            const c = BD.chamados.find(x => x.id === id);
            if (c) {
                c.status = 'Resolvido';
                c.dataResolucao = new Date().toISOString().split('T')[0];
                c.resolvidoPor = window.usuarioAtual?.nome || 'Sistema';
            }
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        carregarTabelaChamados();
        if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
        if (typeof mostrarToast === 'function') mostrarToast('Chamado resolvido!', 'sucesso');
    } catch (e) { console.error(e); }
}

function excluirChamado(id) {
    try {
        if (!confirm('Excluir este chamado?')) return;
        if (typeof BD !== 'undefined' && BD.chamados) {
            BD.chamados = BD.chamados.filter(c => c.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        carregarTabelaChamados();
        if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    } catch (e) { console.error(e); }
}

window.carregarTabelaChamados = carregarTabelaChamados;
window.abrirModalChamado = abrirModalChamado;
window.resolverChamado = resolverChamado;
window.excluirChamado = excluirChamado;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        const filtV = document.getElementById('filtroVeiculoChamado');
        const filtS = document.getElementById('filtroStatusChamado');
        if (filtV) filtV.addEventListener('change', carregarTabelaChamados);
        if (filtS) filtS.addEventListener('change', carregarTabelaChamados);
        console.log('✅ chamados.js inicializado');
    });
}