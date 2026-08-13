/* ============================================================
   MÓDULO: DESPESAS DE VIAGEM v3.1
   Gestão de Frotas - Sistema Veicular
   ============================================================ */

const STORAGE_DESPESAS = 'frota_despesas_viagem';
let despesasViagem = [];
let comprovantesAnexados = [];

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    carregarDespesasViagem();
    vincularEventosFormulario();
    renderizarListaDespesasViagem();
});

// ========== ARMAZENAMENTO ==========
function carregarDespesasViagem() {
    try {
        const dados = localStorage.getItem(STORAGE_DESPESAS);
        despesasViagem = dados ? JSON.parse(dados) : [];
    } catch (e) {
        console.error('Erro ao carregar despesas:', e);
        despesasViagem = [];
    }
}

function salvarDespesasViagem() {
    localStorage.setItem(STORAGE_DESPESAS, JSON.stringify(despesasViagem));
}

// ========== MODAL ==========
function abrirModalDespesaViagem() {
    document.getElementById('tituloModalDV').textContent = '🧾 Lançar Despesa de Viagem';
    document.getElementById('formDespesaViagem').reset();
    document.getElementById('dv-id').value = '';
    document.getElementById('dv-data').valueAsDate = new Date();
    comprovantesAnexados = [];
    document.getElementById('dv-comprovantes-preview').innerHTML = '';
    resetarItensLinha();
    atualizarTotalDespesas();
    document.getElementById('modalDespesaViagem').classList.add('ativo');
}

function fecharModalDespesaViagem() {
    document.getElementById('modalDespesaViagem').classList.remove('ativo');
}

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
    const modal = document.getElementById('modalDespesaViagem');
    if (modal && e.target === modal) fecharModalDespesaViagem();
});

// ========== EVENTOS DO FORMULÁRIO ==========
function vincularEventosFormulario() {
    const form = document.getElementById('formDespesaViagem');
    if (form) form.addEventListener('submit', salvarDespesaViagem);
    
    const areaUpload = document.getElementById('dv-area-upload');
    const inputArquivos = document.getElementById('dv-input-arquivos');
    
    if (areaUpload) {
        areaUpload.addEventListener('click', () => inputArquivos.click());
        areaUpload.addEventListener('dragover', (e) => {
            e.preventDefault();
            areaUpload.classList.add('drag-over');
        });
        areaUpload.addEventListener('dragleave', () => areaUpload.classList.remove('drag-over'));
        areaUpload.addEventListener('drop', (e) => {
            e.preventDefault();
            areaUpload.classList.remove('drag-over');
            processarArquivosComprovantes(e.dataTransfer.files);
        });
    }
    
    if (inputArquivos) {
        inputArquivos.addEventListener('change', (e) => processarArquivosComprovantes(e.target.files));
    }
    
    // Cálculo automático
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('item-valor')) atualizarTotalDespesas();
    });
    
    // Remover linha
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remover-linha')) {
            const linhas = document.querySelectorAll('.item-despesa-linha');
            if (linhas.length > 1) e.target.closest('.item-despesa-linha').remove();
            atualizarTotalDespesas();
        }
    });
}

// ========== ITENS DE DESPESA ==========
function adicionarLinhaItemDV() {
    const container = document.getElementById('dv-itens-container');
    if (!container) return;
    
    const linha = document.createElement('div');
    linha.className = 'item-despesa-linha';
    linha.innerHTML = `
        <select class="item-tipo" required>
            <option value="">Selecione...</option>
            <option value="combustivel">⛽ Combustível</option>
            <option value="pedagio">🛣️ Pedágio</option>
            <option value="refeicao">🍽️ Refeição</option>
            <option value="hospedagem">🏨 Hospedagem</option>
            <option value="manutencao">🔧 Manutenção</option>
            <option value="estacionamento">🅿️ Estacionamento</option>
            <option value="outros">📋 Outros</option>
        </select>
        <input type="number" class="item-valor" step="0.01" min="0" placeholder="R$ 0,00" required>
        <button type="button" class="btn-remover-linha" title="Remover item">&minus;</button>
    `;
    container.appendChild(linha);
}

function resetarItensLinha() {
    const container = document.getElementById('dv-itens-container');
    if (!container) return;
    container.innerHTML = '';
    adicionarLinhaItemDV();
}

function atualizarTotalDespesas() {
    let total = 0;
    document.querySelectorAll('.item-despesa-linha').forEach(linha => {
        const valor = parseFloat(linha.querySelector('.item-valor')?.value) || 0;
        total += valor;
    });
    const el = document.getElementById('dv-total-valor');
    if (el) el.textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
}

// ========== UPLOAD DE COMPROVANTES ==========
function processarArquivosComprovantes(arquivos) {
    const lista = document.getElementById('dv-comprovantes-preview');
    if (!lista) return;
    
    Array.from(arquivos).forEach(arq => {
        if (arq.size > 5 * 1024 * 1024) {
            alert(`⚠️ Arquivo "${arq.name}" excede 5MB e não será anexado.`);
            return;
        }
        
        const leitor = new FileReader();
        leitor.onload = (e) => {
            const dados = {
                nome: arq.name,
                tipo: arq.type,
                tamanho: arq.size,
                base64: e.target.result
            };
            comprovantesAnexados.push(dados);
            renderizarComprovantePreview(dados, comprovantesAnexados.length - 1);
        };
        leitor.readAsDataURL(arq);
    });
}

function renderizarComprovantePreview(dados, indice) {
    const lista = document.getElementById('dv-comprovantes-preview');
    if (!lista) return;
    
    const item = document.createElement('div');
    item.className = 'comprovante-item';
    
    if (dados.tipo.startsWith('image/')) {
        item.innerHTML = `
            <img src="${dados.base64}" alt="${dados.nome}" title="${dados.nome}">
            <button type="button" class="remover" onclick="removerComprovante(${indice})" title="Remover">&times;</button>
        `;
    } else {
        const ext = dados.nome.split('.').pop().toUpperCase();
        item.innerHTML = `
            <div class="pdf-icone">
                📄<small>${ext}</small>
            </div>
            <button type="button" class="remover" onclick="removerComprovante(${indice})" title="Remover">&times;</button>
        `;
    }
    
    lista.appendChild(item);
}

function removerComprovante(indice) {
    comprovantesAnexados.splice(indice, 1);
    const lista = document.getElementById('dv-comprovantes-preview');
    if (lista) {
        lista.innerHTML = '';
        comprovantesAnexados.forEach((d, i) => renderizarComprovantePreview(d, i));
    }
}

// ========== SALVAR DESPESA ==========
function salvarDespesaViagem(e) {
    e.preventDefault();
    
    // Coletar itens
    const itens = [];
    let valorTotal = 0;
    document.querySelectorAll('.item-despesa-linha').forEach(linha => {
        const tipo = linha.querySelector('.item-tipo')?.value;
        const valor = parseFloat(linha.querySelector('.item-valor')?.value) || 0;
        if (tipo && valor > 0) {
            itens.push({ tipo, valor });
            valorTotal += valor;
        }
    });
    
    if (itens.length === 0) {
        alert('⚠️ Adicione pelo menos um item de despesa com valor.');
        return;
    }
    
    if (comprovantesAnexados.length === 0) {
        alert('⚠️ Anexe pelo menos um comprovante.');
        return;
    }
    
    const despesa = {
        id: document.getElementById('dv-id').value || Date.now().toString(),
        motorista: document.getElementById('dv-motorista').value.trim(),
        veiculo: document.getElementById('dv-veiculo').value.trim().toUpperCase(),
        data: document.getElementById('dv-data').value,
        trajeto: document.getElementById('dv-trajeto').value.trim(),
        itens,
        valorTotal,
        comprovantes: [...comprovantesAnexados],
        observacoes: document.getElementById('dv-observacoes').value.trim(),
        status: 'pendente',
        dataCadastro: new Date().toISOString()
    };
    
    const idx = despesasViagem.findIndex(d => d.id === despesa.id);
    if (idx >= 0) {
        despesasViagem[idx] = despesa;
    } else {
        despesasViagem.unshift(despesa);
    }
    
    salvarDespesasViagem();
    renderizarListaDespesasViagem();
    fecharModalDespesaViagem();
    
    alert('✅ Despesa lançada com sucesso! Aguardando aprovação.');
}

// ========== RENDERIZAR LISTA ==========
function renderizarListaDespesasViagem() {
    const container = document.getElementById('listaDespesasViagem');
    if (!container) return;
    
    const filtroPeriodo = document.getElementById('filtroDVPeriodo')?.value || 'mes';
    const filtroStatus = document.getElementById('filtroDVStatus')?.value || 'todos';
    const filtroMotorista = (document.getElementById('filtroDVMotorista')?.value || '').toLowerCase();
    
    let filtradas = [...despesasViagem];
    const agora = new Date();
    
    // Filtro período
    if (filtroPeriodo === 'semana') {
        const semana = new Date(Date.now() - 7 * 86400000);
        filtradas = filtradas.filter(d => new Date(d.data) >= semana);
    } else if (filtroPeriodo === 'mes') {
        filtradas = filtradas.filter(d => {
            const dt = new Date(d.data + 'T00:00:00');
            return dt.getMonth() === agora.getMonth() && dt.getFullYear() === agora.getFullYear();
        });
    } else if (filtroPeriodo === 'anterior') {
        const ultMes = agora.getMonth() === 0 ? 11 : agora.getMonth() - 1;
        const ano = agora.getMonth() === 0 ? agora.getFullYear() - 1 : agora.getFullYear();
        filtradas = filtradas.filter(d => {
            const dt = new Date(d.data + 'T00:00:00');
            return dt.getMonth() === ultMes && dt.getFullYear() === ano;
        });
    } else if (filtroPeriodo === 'ano') {
        filtradas = filtradas.filter(d => new Date(d.data + 'T00:00:00').getFullYear() === agora.getFullYear());
    }
    
    // Filtro status
    if (filtroStatus !== 'todos') {
        filtradas = filtradas.filter(d => d.status === filtroStatus);
    }
    
    // Filtro motorista
    if (filtroMotorista) {
        filtradas = filtradas.filter(d => d.motorista.toLowerCase().includes(filtroMotorista));
    }
    
    // Atualizar cards resumo
    atualizarCardsResumo(filtradas);
    
    if (filtradas.length === 0) {
        container.innerHTML = '<p class="sem-dados">📭 Nenhuma despesa encontrada para os filtros selecionados.</p>';
        return;
    }
    
    const iconesTipo = {
        combustivel: '⛽', pedagio: '🛣️', refeicao: '🍽️',
        hospedagem: '🏨', manutencao: '🔧', estacionamento: '🅿️', outros: '📋'
    };
    
    const nomesTipo = {
        combustivel: 'Combustível', pedagio: 'Pedágio', refeicao: 'Refeição',
        hospedagem: 'Hospedagem', manutencao: 'Manutenção', estacionamento: 'Estacionamento', outros: 'Outros'
    };
    
    container.innerHTML = filtradas.map(d => {
        const dt = new Date(d.data + 'T00:00:00');
        const dtFmt = `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
        
        const statusClasse = d.status === 'aprovado' ? 'status-aprovado' : d.status === 'rejeitado' ? 'status-rejeitado' : 'status-pendente';
        const statusTexto = d.status === 'aprovado' ? '✅ Aprovado' : d.status === 'rejeitado' ? '❌ Rejeitado' : '⏳ Pendente';
        
        const itensResumo = d.itens.map(i => `${iconesTipo[i.tipo] || '•'} ${nomesTipo[i.tipo] || i.tipo} — R$ ${i.valor.toFixed(2).replace('.',',')}`).join(' · ');
        
        return `
            <div class="cartao-despesa ${statusClasse}">
                <div class="despesa-cabecalho">
                    <div>
                        <div class="despesa-motorista">${d.motorista} <span style="font-weight:400; color:#64748b;">— ${d.veiculo}</span></div>
                        <div class="despesa-info">📅 ${dtFmt}${d.trajeto ? ' | 🛣️ ' + d.trajeto : ''}</div>
                    </div>
                    <div>
                        <div class="despesa-valor">R$ ${d.valorTotal.toFixed(2).replace('.',',')}</div>
                        <div style="text-align:right;"><span class="despesa-status">${statusTexto}</span></div>
                    </div>
                </div>
                <div class="despesa-itens">${itensResumo}</div>
                ${d.observacoes ? `<div style="font-size:13px; color:#64748b; margin-top:8px;">📝 ${d.observacoes}</div>` : ''}
                <div class="despesa-rodape">
                    <span>📎 ${d.comprovantes.length} comprovante(s)</span>
                    <div class="despesa-acoes">
                        <button class="btn-ver" onclick="verComprovantes('${d.id}')">👁️ Ver</button>
                        ${d.status === 'pendente' ? `
                            <button class="btn-aprovar" onclick="aprovarDespesa('${d.id}')">✓ Aprovar</button>
                            <button class="btn-rejeitar" onclick="rejeitarDespesa('${d.id}')">✗ Rejeitar</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========== CARDS RESUMO ==========
function atualizarCardsResumo(filtradas) {
    const totalLancado = filtradas.reduce((s, d) => s + d.valorTotal, 0);
    const pendentes = filtradas.filter(d => d.status === 'pendente').length;
    const totalAprovado = filtradas.filter(d => d.status === 'aprovado').reduce((s, d) => s + d.valorTotal, 0);
    const rejeitadas = filtradas.filter(d => d.status === 'rejeitado').length;
    
    definirTexto('dv-total-lancado', 'R$ ' + totalLancado.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2 }));
    definirTexto('dv-pendentes', pendentes);
    definirTexto('dv-aprovadas', 'R$ ' + totalAprovado.toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2 }));
    definirTexto('dv-rejeitadas', rejeitadas);
}

// ========== AÇÕES ==========
function aprovarDespesa(id) {
    if (!confirm('✅ Confirmar aprovação desta despesa?')) return;
    const d = despesasViagem.find(x => x.id === id);
    if (d) {
        d.status = 'aprovado';
        salvarDespesasViagem();
        renderizarListaDespesasViagem();
    }
}

function rejeitarDespesa(id) {
    if (!confirm('❌ Confirmar rejeição desta despesa?')) return;
    const d = despesasViagem.find(x => x.id === id);
    if (d) {
        d.status = 'rejeitado';
        salvarDespesasViagem();
        renderizarListaDespesasViagem();
    }
}

function verComprovantes(id) {
    const d = despesasViagem.find(x => x.id === id);
    if (!d || !d.comprovantes.length) return;
    
    let html = `<div style="max-width:600px; max-height:80vh; overflow-y:auto; padding:20px;">
        <h3 style="margin-bottom:16px;">📎 Comprovantes — ${d.motorista} (${d.veiculo})</h3>
        <div style="display:flex; flex-wrap:wrap; gap:12px;">`;
    
    d.comprovantes.forEach(c => {
        if (c.tipo.startsWith('image/')) {
            html += `<div style="width:140px; height:140px; border-radius:8px; overflow:hidden; border:2px solid #e2e8f0;">
                <img src="${c.base64}" style="width:100%; height:100%; object-fit:cover;" onclick="window.open('${c.base64}')" title="Clique para ampliar">
            </div>`;
        } else {
            html += `<a href="${c.base64}" download="${c.nome}" style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:140px; height:140px; background:#fee2e2; border-radius:8px; text-decoration:none; color:#991b1b; font-weight:600;">
                <span style="font-size:40px;">📄</span>
                <span style="font-size:11px; margin-top:6px; text-align:center; word-break:break-all; padding:0 8px;">${c.nome}</span>
            </a>`;
        }
    });
    
    html += '</div></div>';
    
    const modal = window.open('', '_blank', 'width=650,height=700');
    modal.document.write(`<html><head><title>Comprovantes</title></head><body style="font-family:Arial,sans-serif;">${html}</body></html>`);
}

// ========== FUNÇÕES GLOBAIS ==========
window.abrirModalDespesaViagem = abrirModalDespesaViagem;
window.fecharModalDespesaViagem = fecharModalDespesaViagem;
window.adicionarLinhaItemDV = adicionarLinhaItemDV;
window.removerComprovante = removerComprovante;
window.renderizarListaDespesasViagem = renderizarListaDespesasViagem;
window.aprovarDespesa = aprovarDespesa;
window.rejeitarDespesa = rejeitarDespesa;
window.verComprovantes = verComprovantes;
