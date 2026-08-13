// =====================================================
// MODULO: DESPESAS DE VIAGEM - COM SISTEMA DE ADIANTAMENTO
// =====================================================

const STORAGE_KEY = 'frota_despesas_viagem';
let despesas = [];
let comprovantesTemp = [];
let editandoId = null;

// =====================================================
// INICIALIZACAO
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('💰 [DESPESAS] Inicializando modulo...');
    carregarDespesas();
    renderizarTudo();
    vincularEventos();
    console.log('✅ [DESPESAS] Modulo inicializado!');
});

// =====================================================
// ARMAZENAMENTO
// =====================================================
function carregarDespesas() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        despesas = raw ? JSON.parse(raw) : [];
    } catch(e) { despesas = []; }
}

function salvarDespesas() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(despesas));
    // Notifica dashboard
    try { if (window.atualizarDashboard) window.atualizarDashboard(); } catch(e){}
}

// =====================================================
// EVENTOS
// =====================================================
function vincularEventos() {
    // Botao abrir modal
    const btnAbrir = document.getElementById('btnAbrirFormDespesa');
    if (btnAbrir) {
        btnAbrir.addEventListener('click', () => abrirModal());
        console.log('✅ [DESPESAS] Botao "Lancar Despesa" vinculado');
    } else {
        console.warn('⚠️ [DESPESAS] Botao btnAbrirFormDespesa NAO ENCONTRADO no HTML');
    }

    // Fechar modal
    const modal = document.getElementById('modalDespesaViagem');
    const btnFechar = document.getElementById('btnFecharModalDespesa');
    const btnCancelar = document.getElementById('btnCancelarDespesa');

    if (btnFechar) btnFechar.addEventListener('click', fecharModal);
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModal);
    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('ativo')) fecharModal();
        });
    }

    // Submit form
    const form = document.getElementById('formDespesaViagem');
    if (form) {
        form.addEventListener('submit', salvarDespesa);
    }

    // Adicionar item
    const btnAdd = document.getElementById('btnAdicionarItem');
    if (btnAdd) btnAdd.addEventListener('click', adicionarLinhaItem);

    // Upload
    const areaUpload = document.getElementById('areaUpload');
    const inputArquivos = document.getElementById('inputComprovantes');
    if (areaUpload && inputArquivos) {
        areaUpload.addEventListener('click', () => inputArquivos.click());
        areaUpload.addEventListener('dragover', (e) => { e.preventDefault(); areaUpload.classList.add('drag-over'); });
        areaUpload.addEventListener('dragleave', () => areaUpload.classList.remove('drag-over'));
        areaUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            areaUpload.classList.remove('drag-over');
            processarArquivos(e.dataTransfer.files);
        });
        inputArquivos.addEventListener('change', (e) => processarArquivos(e.target.files));
    }

    // Delegacao: remover item / remover comprovante
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remover-item')) {
            const linhas = document.querySelectorAll('.item-linha');
            if (linhas.length > 1) e.target.closest('.item-linha').remove();
            atualizarResumoFinanceiro();
        }
        if (e.target.classList.contains('comprovante-remover')) {
            const idx = parseInt(e.target.dataset.index);
            comprovantesTemp.splice(idx, 1);
            renderizarComprovantesTemp();
        }
    });

    // Input para recalcular
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('item-valor') || e.target.id === 'valorAdiantado') {
            atualizarResumoFinanceiro();
        }
    });

    // Filtros
    ['filtroPeriodoDespesas','filtroStatusDespesas','buscaDespesas'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', renderizarLista);
        if (el) el.addEventListener('input', renderizarLista);
        if (el) el.addEventListener('keyup', renderizarLista);
    });
}

// =====================================================
// MODAL
// =====================================================
function abrirModal(id = null) {
    editandoId = id;
    comprovantesTemp = [];
    const modal = document.getElementById('modalDespesaViagem');
    const form = document.getElementById('formDespesaViagem');
    const titulo = document.getElementById('tituloModalDespesa');

    if (!modal || !form) {
        console.error('❌ [DESPESAS] Modal ou form nao encontrado!');
        alert('Erro: formulário não encontrado. Verifique se o HTML está correto.');
        return;
    }

    // Reseta form
    form.reset();
    document.getElementById('itensContainer').innerHTML = '';
    document.getElementById('listaComprovantesTemp').innerHTML = '';

    // Adiciona primeira linha
    adicionarLinhaItem();

    // Data de hoje
    const inpData = document.getElementById('despesaData');
    if (inpData) inpData.valueAsDate = new Date();

    if (id) {
        const d = despesas.find(x => x.id === id);
        if (d) preencherEdicao(d);
        if (titulo) titulo.textContent = '✏️ Editar Despesa de Viagem';
    } else {
        if (titulo) titulo.textContent = '💰 Lançar Despesa de Viagem';
    }

    atualizarResumoFinanceiro();
    modal.classList.add('ativo');
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    const modal = document.getElementById('modalDespesaViagem');
    if (modal) modal.classList.remove('ativo');
    document.body.style.overflow = '';
    editandoId = null;
    comprovantesTemp = [];
}

function preencherEdicao(d) {
    document.getElementById('despesaMotorista').value = d.motorista || '';
    document.getElementById('despesaVeiculo').value = d.veiculo || '';
    document.getElementById('despesaData').value = d.data || '';
    document.getElementById('despesaTrajeto').value = d.trajeto || '';
    document.getElementById('valorAdiantado').value = d.valorAdiantado || '';
    document.getElementById('despesaObs').value = d.observacoes || '';

    // Itens
    const container = document.getElementById('itensContainer');
    container.innerHTML = '';
    (d.itens || []).forEach(it => {
        adicionarLinhaItem(it.tipo, it.valor);
    });

    // Comprovantes
    comprovantesTemp = [...(d.comprovantes || [])];
    renderizarComprovantesTemp();
}

// =====================================================
// ITENS DINAMICOS
// =====================================================
function adicionarLinhaItem(tipo = '', valor = '') {
    const container = document.getElementById('itensContainer');
    if (!container) return;
    const linha = document.createElement('div');
    linha.className = 'item-linha';
    linha.innerHTML = `
        <select class="item-tipo" required>
            <option value="">Tipo despesa</option>
            <option value="combustivel" ${tipo==='combustivel'?'selected':''}>⛽ Combustível</option>
            <option value="pedagio" ${tipo==='pedagio'?'selected':''}>🛣️ Pedágio</option>
            <option value="refeicao" ${tipo==='refeicao'?'selected':''}>🍽️ Refeição</option>
            <option value="hospedagem" ${tipo==='hospedagem'?'selected':''}>🏨 Hospedagem</option>
            <option value="manutencao" ${tipo==='manutencao'?'selected':''}>🔧 Manutenção</option>
            <option value="estacionamento" ${tipo==='estacionamento'?'selected':''}>🅿️ Estacionamento</option>
            <option value="outros" ${tipo==='outros'?'selected':''}>📋 Outros</option>
        </select>
        <input type="number" class="item-valor" step="0.01" min="0" placeholder="R$ 0,00" value="${valor}" required>
        <button type="button" class="btn-remover-item" title="Remover item">×</button>
    `;
    container.appendChild(linha);
}

// =====================================================
// COMPROVANTES
// =====================================================
function processarArquivos(arquivos) {
    Array.from(arquivos).forEach(arq => {
        if (arq.size > 5 * 1024 * 1024) {
            alert(`⚠️ Arquivo "${arq.name}" excede 5MB e foi ignorado.`);
            return;
        }
        const leitor = new FileReader();
        leitor.onload = (e) => {
            comprovantesTemp.push({
                nome: arq.name,
                tipo: arq.type,
                base64: e.target.result
            });
            renderizarComprovantesTemp();
        };
        leitor.readAsDataURL(arq);
    });
}

function renderizarComprovantesTemp() {
    const lista = document.getElementById('listaComprovantesTemp');
    if (!lista) return;
    lista.innerHTML = comprovantesTemp.map((c, i) => {
        const img = c.tipo?.startsWith('image/')
            ? `<img src="${c.base64}" alt="${c.nome}">`
            : `<div class="comprovante-pdf"><span style="font-size:22px;">📄</span>${(c.nome.split('.').pop()||'').toUpperCase()}</div>`;
        return `<div class="comprovante-item" title="${c.nome}">
            ${img}
            <button type="button" class="comprovante-remover" data-index="${i}">×</button>
        </div>`;
    }).join('');
}

// =====================================================
// RESUMO FINANCEIRO (ADIANTAMENTO)
// =====================================================
function atualizarResumoFinanceiro() {
    let totalGasto = 0;
    document.querySelectorAll('.item-linha').forEach(linha => {
        totalGasto += parseFloat(linha.querySelector('.item-valor')?.value || 0);
    });
    const adiantado = parseFloat(document.getElementById('valorAdiantado')?.value || 0);
    const saldo = +(adiantado - totalGasto).toFixed(2);

    // Atualiza total gasto
    const elTotal = document.getElementById('totalGastoCalc');
    if (elTotal) elTotal.textContent = formatarReal(totalGasto);

    const elAdiantado = document.getElementById('adiantadoCalc');
    if (elAdiantado) elAdiantado.textContent = formatarReal(adiantado);

    const elSaldo = document.getElementById('saldoFinal');
    const elStatus = document.getElementById('statusSaldo');
    const elLinha = document.querySelector('.resumo-linha.destaque');

    let tipo = 'fechado';
    let textoStatus = '✅ Conta Fechada';
    let textoSaldo = formatarReal(0);

    if (Math.abs(saldo) < 0.01) {
        tipo = 'fechado';
        textoStatus = '✅ Conta Fechada';
        textoSaldo = formatarReal(0);
    } else if (saldo > 0) {
        tipo = 'estorno';
        textoStatus = `↩️ Motorista deve ESTORNAR R$ ${saldo.toFixed(2)}`;
        textoSaldo = `- ${formatarReal(saldo)}`;
    } else {
        tipo = 'complementar';
        textoStatus = `➡️ Empresa COMPLEMENTA R$ ${Math.abs(saldo).toFixed(2)}`;
        textoSaldo = `+ ${formatarReal(Math.abs(saldo))}`;
    }

    if (elSaldo) {
        elSaldo.textContent = textoSaldo;
        elSaldo.parentElement?.classList.remove('estorno','complementar','fechado');
        elSaldo.parentElement?.classList.add(tipo);
    }
    if (elStatus) {
        elStatus.textContent = textoStatus;
        elStatus.className = `status-saldo ${tipo}`;
    }
}

function formatarReal(v) {
    return 'R$ ' + (+v||0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// =====================================================
// SALVAR
// =====================================================
function salvarDespesa(e) {
    e.preventDefault();

    // Coleta itens
    const itens = [];
    let totalGasto = 0;
    document.querySelectorAll('.item-linha').forEach(linha => {
        const tipo = linha.querySelector('.item-tipo').value;
        const valor = parseFloat(linha.querySelector('.item-valor').value || 0);
        if (tipo && valor > 0) {
            itens.push({ tipo, valor });
            totalGasto += valor;
        }
    });

    if (itens.length === 0) {
        alert('⚠️ Adicione pelo menos um item de despesa com valor.');
        return;
    }

    const adiantado = parseFloat(document.getElementById('valorAdiantado')?.value || 0);
    const saldo = +(adiantado - totalGasto).toFixed(2);
    let tipoSaldo = 'fechado';
    if (saldo > 0.01) tipoSaldo = 'estorno';
    else if (saldo < -0.01) tipoSaldo = 'complementar';

    const despesa = {
        id: editandoId || Date.now().toString(),
        motorista: document.getElementById('despesaMotorista').value.trim(),
        veiculo: document.getElementById('despesaVeiculo').value.trim().toUpperCase(),
        data: document.getElementById('despesaData').value,
        trajeto: document.getElementById('despesaTrajeto').value.trim(),
        valorAdiantado: adiantado,
        itens,
        valorTotal: +totalGasto.toFixed(2),
        saldo,
        tipoSaldo,
        comprovantes: [...comprovantesTemp],
        observacoes: document.getElementById('despesaObs').value.trim(),
        status: editandoId ? (despesas.find(d=>d.id===editandoId)?.status || 'pendente') : 'pendente',
        criadoEm: editandoId ? (despesas.find(d=>d.id===editandoId)?.criadoEm) : new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
    };

    if (editandoId) {
        const i = despesas.findIndex(d => d.id === editandoId);
        if (i >= 0) despesas[i] = despesa;
    } else {
        despesas.unshift(despesa);
    }

    salvarDespesas();
    fecharModal();
    renderizarTudo();
    alert(`✅ Despesa ${editandoId?'atualizada':'lançada'} com sucesso!\n\nTotal gasto: ${formatarReal(totalGasto)}\nAdiantado: ${formatarReal(adiantado)}\n${despesa.tipoSaldo==='estorno'?`↩️ Estorno: ${formatarReal(saldo)}`:despesa.tipoSaldo==='complementar'?`➡️ Complementar: ${formatarReal(Math.abs(saldo))}`:'✅ Conta fechada'}`);
}

// =====================================================
// RENDERIZACAO
// =====================================================
function renderizarTudo() {
    renderizarCardsResumo();
    renderizarLista();
}

function renderizarCardsResumo() {
    const total = despesas.reduce((s,d) => s + (d.valorTotal||0), 0);
    const pend = despesas.filter(d => d.status === 'pendente').length;
    const aprov = despesas.filter(d => d.status === 'aprovado').length;
    const rej = despesas.filter(d => d.status === 'rejeitado').length;

    setCard('resumoTotal', formatarReal(total), 'Total lançado');
    setCard('resumoPendentes', pend, pend === 1 ? 'pendente' : 'pendentes');
    setCard('resumoAprovadas', aprov, aprov === 1 ? 'aprovada' : 'aprovadas');
    setCard('resumoRejeitadas', rej, rej === 1 ? 'rejeitada' : 'rejeitadas');
}

function setCard(id, valor, sub) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = valor;
    const p = el.parentElement?.querySelector('.label');
    if (p && sub) p.textContent = sub;
}

function renderizarLista() {
    const container = document.getElementById('listaDespesasViagem');
    if (!container) return;

    const filtroPeriodo = document.getElementById('filtroPeriodoDespesas')?.value || 'todos';
    const filtroStatus = document.getElementById('filtroStatusDespesas')?.value || 'todos';
    const busca = (document.getElementById('buscaDespesas')?.value || '').toLowerCase();
    const hoje = new Date();

    let lista = despesas.filter(d => {
        // Status
        if (filtroStatus !== 'todos' && d.status !== filtroStatus) return false;
        // Busca
        if (busca && !(d.motorista||'').toLowerCase().includes(busca) && !(d.veiculo||'').toLowerCase().includes(busca)) return false;
        // Periodo
        const dt = new Date(d.data + 'T00:00:00');
        if (filtroPeriodo === 'mes') {
            if (dt.getMonth() !== hoje.getMonth() || dt.getFullYear() !== hoje.getFullYear()) return false;
        } else if (filtroPeriodo === 'semana') {
            if ((hoje - dt) > 7 * 86400000) return false;
        } else if (filtroPeriodo === 'anterior') {
            const mAnt = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
            const aAnt = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
            if (dt.getMonth() !== mAnt || dt.getFullYear() !== aAnt) return false;
        } else if (filtroPeriodo === 'ano') {
            if (dt.getFullYear() !== hoje.getFullYear()) return false;
        }
        return true;
    });

    if (lista.length === 0) {
        container.innerHTML = `<div class="sem-dados">📭 Nenhuma despesa encontrada.<br><small>Clique em "+ Lançar Despesa" para começar.</small></div>`;
        return;
    }

    const icones = { combustivel:'⛽', pedagio:'🛣️', refeicao:'🍽️', hospedagem:'🏨', manutencao:'🔧', estacionamento:'🅿️', outros:'📋' };

    container.innerHTML = lista.map(d => {
        const dt = new Date(d.data + 'T00:00:00');
        const dtFmt = `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
        const statusBadge = d.status === 'aprovado' ? 'status-aprovado-badge ✅ Aprovado'
            : d.status === 'rejeitado' ? 'status-rejeitado-badge ❌ Rejeitado'
            : 'status-pendente-badge ⏳ Pendente';
        const [clsBadge, txtBadge] = statusBadge.split(' ', 2);
        const saldoTexto = d.tipoSaldo === 'estorno' ? `↩️ Estorno ${formatarReal(d.saldo)}`
            : d.tipoSaldo === 'complementar' ? `➡️ Complementa ${formatarReal(Math.abs(d.saldo||0))}`
            : '✅ Fechado';
        const saldoCls = d.tipoSaldo || 'fechado';
        const itensHtml = (d.itens||[]).map(i =>
            `<span class="item-tag">${icones[i.tipo]||'•'} ${formatarReal(i.valor)}</span>`
        ).join('');

        return `
        <div class="cartao-despesa status-${d.status}">
            <div class="despesa-cabecalho">
                <div class="despesa-motorista-info">
                    <div class="despesa-motorista">👤 ${d.motorista} • 🚛 ${d.veiculo}</div>
                    <div class="despesa-detalhes">
                        <span>📅 ${dtFmt}</span>
                        ${d.trajeto ? `<span>📍 ${d.trajeto}</span>` : ''}
                        <span>💸 Adiantado: ${formatarReal(d.valorAdiantado||0)}</span>
                        <span>📎 ${d.comprovantes?.length||0} comprovante(s)</span>
                    </div>
                </div>
                <div class="despesa-valores">
                    <div class="despesa-valor-total">${formatarReal(d.valorTotal||0)}</div>
                    <span class="despesa-saldo ${saldoCls}">${saldoTexto}</span>
                    <span class="status-badge ${clsBadge}">${txtBadge}</span>
                </div>
            </div>
            ${itensHtml ? `<div class="despesa-itens">${itensHtml}</div>` : ''}
            ${d.observacoes ? `<div style="font-size:12px;color:var(--texto-secundario);margin-top:6px;">📝 ${d.observacoes}</div>` : ''}
            <div class="despesa-acoes">
                ${d.status === 'pendente' ? `<button class="btn-mini sucesso" onclick="aprovarDespesa('${d.id}')">✅ Aprovar</button>` : ''}
                ${d.status === 'pendente' ? `<button class="btn-mini erro" onclick="rejeitarDespesa('${d.id}')">❌ Rejeitar</button>` : ''}
                <button class="btn-mini" onclick="abrirModal('${d.id}')">✏️ Editar</button>
                ${d.comprovantes?.length ? `<button class="btn-mini" onclick="verComprovantes('${d.id}')">📎 Ver comprovantes</button>` : ''}
                <button class="btn-mini erro" onclick="excluirDespesa('${d.id}')">🗑️ Excluir</button>
            </div>
        </div>`;
    }).join('');
}

// =====================================================
// ACOES
// =====================================================
window.aprovarDespesa = function(id) {
    if (!confirm('✅ Confirmar aprovação desta despesa?')) return;
    const d = despesas.find(x => x.id === id);
    if (d) { d.status = 'aprovado'; salvarDespesas(); renderizarTudo(); }
};

window.rejeitarDespesa = function(id) {
    if (!confirm('❌ Confirmar rejeição desta despesa?')) return;
    const d = despesas.find(x => x.id === id);
    if (d) { d.status = 'rejeitado'; salvarDespesas(); renderizarTudo(); }
};

window.excluirDespesa = function(id) {
    if (!confirm('🗑️ Tem certeza que deseja EXCLUIR esta despesa?\nEsta ação não pode ser desfeita.')) return;
    despesas = despesas.filter(d => d.id !== id);
    salvarDespesas();
    renderizarTudo();
};

window.verComprovantes = function(id) {
    const d = despesas.find(x => x.id === id);
    if (!d || !d.comprovantes?.length) return;
    const win = window.open('', '_blank', 'width=900,height=700');
    win.document.write(`
        <html><head><title>Comprovantes - ${d.motorista} - ${d.data}</title>
        <style>body{font-family:Arial,sans-serif;padding:20px;background:#f8fafc;}
        h1{font-size:18px;color:#0f172a;}
        .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin-top:16px;}
        .item{background:white;padding:10px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1);}
        .item img{width:100%;border-radius:4px;max-height:260px;object-fit:cover;}
        .pdf{display:flex;align-items:center;gap:10px;padding:20px;background:#fef2f2;color:#b91c1c;border-radius:6px;font-weight:600;}
        .nome{font-size:12px;color:#64748b;margin-top:6px;word-break:break-all;}
        .resumo{background:#eef2ff;padding:12px;border-radius:8px;margin-bottom:12px;}
        </style></head><body>
        <h1>📎 Comprovantes da Viagem</h1>
        <div class="resumo"><strong>👤 ${d.motorista}</strong> • 🚛 ${d.veiculo} • 📅 ${d.data}<br>
        💸 Adiantado: ${formatarReal(d.valorAdiantado||0)} • 🧾 Gasto: ${formatarReal(d.valorTotal||0)}</div>
        <div class="grid">
        ${d.comprovantes.map(c => c.tipo?.startsWith('image/')
            ? `<div class="item"><img src="${c.base64}"><div class="nome">${c.nome}</div></div>`
            : `<div class="item"><div class="pdf">📄 ${c.nome}</div><a href="${c.base64}" download="${c.nome}" style="display:block;margin-top:8px;font-size:12px;">⬇️ Baixar PDF</a></div>`
        ).join('')}
        </div></body></html>
    `);
    win.document.close();
};

// Formatar real para uso em outras janelas
window.formatarReal = formatarReal;

// Expor para debug
window._despesas = despesas;
