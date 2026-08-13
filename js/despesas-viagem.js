/* ============================================================
   MÓDULO: DESPESAS DE VIAGEM v3.1
   Com sistema completo de ADIANTAMENTO:
   - Empresa adianta valor para o motorista
   - Motorista presta contas com comprovantes
   - Cálculo automático: saldo a estornar ou valor complementar
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
    document.getElementById('dv-adiantamento').value = '';
    comprovantesAnexados = [];
    document.getElementById('dv-comprovantes-preview').innerHTML = '';
    resetarItensLinha();
    atualizarTotalDespesas();
    atualizarResumoAdiantamento();
    document.getElementById('modalDespesaViagem').classList.add('ativo');
}

function fecharModalDespesaViagem() {
    document.getElementById('modalDespesaViagem').classList.remove('ativo');
}

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
    
    // Atualizar total e saldo ao digitar valores
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('item-valor')) {
            atualizarTotalDespesas();
            atualizarResumoAdiantamento();
        }
        if (e.target.id === 'dv-adiantamento') {
            atualizarResumoAdiantamento();
        }
    });
    
    // Remover linha de item
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remover-linha')) {
            const linhas = document.querySelectorAll('.item-despesa-linha');
            if (linhas.length > 1) e.target.closest('.item-despesa-linha').remove();
            atualizarTotalDespesas();
            atualizarResumoAdiantamento();
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

function calcularTotalDespesas() {
    let total = 0;
    document.querySelectorAll('.item-despesa-linha').forEach(linha => {
        const valor = parseFloat(linha.querySelector('.item-valor')?.value) || 0;
        total += valor;
    });
    return total;
}

function atualizarTotalDespesas() {
    const total = calcularTotalDespesas();
    const el = document.getElementById('dv-total-valor');
    if (el) el.textContent = 'R$ ' + total.toFixed(2).replace('.', ',');
}

// ========== CÁLCULO DE ADIANTAMENTO E SALDO ==========
function atualizarResumoAdiantamento() {
    const adiantamento = parseFloat(document.getElementById('dv-adiantamento')?.value) || 0;
    const totalDespesas = calcularTotalDespesas();
    const saldo = adiantamento - totalDespesas;
    
    const elSaldo = document.getElementById('dv-saldo-valor');
    const elTipo = document.getElementById('dv-saldo-tipo');
    const elBadge = document.getElementById('dv-saldo-badge');
    
    if (!elSaldo) return;
    
    if (adiantamento === 0 && totalDespesas === 0) {
        elSaldo.textContent = 'R$ 0,00';
        elSaldo.className = 'valor';
        if (elTipo) elTipo.textContent = 'Saldo';
        if (elBadge) elBadge.style.display = 'none';
        return;
    }
    
    if (elBadge) elBadge.style.display = 'inline-flex';
    
    if (saldo > 0) {
        // Motorista recebeu mais do que gastou → deve estornar para empresa
        elSaldo.textContent = 'R$ ' + saldo.toFixed(2).replace('.', ',');
        elSaldo.className = 'valor positivo';
        if (elTipo) elTipo.textContent = '💰 A Estornar';
        if (elBadge) {
            elBadge.className = 'saldo-badge saldo-estorno';
            elBadge.innerHTML = '↩️ Motorista devolve para empresa';
        }
    } else if (saldo < 0) {
        // Motorista gastou mais do que recebeu → empresa complementa
        elSaldo.textContent = 'R$ ' + Math.abs(saldo).toFixed(2).replace('.', ',');
        elSaldo.className = 'valor negativo';
        if (elTipo) elTipo.textContent = '📌 Complementar';
        if (elBadge) {
            elBadge.className = 'saldo-badge saldo-complementar';
            elBadge.innerHTML = '➡️ Empresa paga diferença';
        }
    } else {
        // Valores exatos → conta fechada
        elSaldo.textContent = 'R$ 0,00';
        elSaldo.className = 'valor';
        if (elTipo) elTipo.textContent = '✅ Conta Fechada';
        if (elBadge) {
            elBadge.className = 'saldo-badge saldo-fechado';
            elBadge.innerHTML = '✓ Valores exatos';
        }
    }
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
        alert('⚠️ Anexe pelo menos um comprovante (cupom fiscal, nota, etc.).');
        return;
    }
    
    const adiantamento = parseFloat(document.getElementById('dv-adiantamento')?.value) || 0;
    const saldo = adiantamento - valorTotal;
    
    let statusConta = 'fechado';
    if (adiantamento > 0) {
        if (saldo > 0.01) statusConta = 'estorno_pendente';
        else if (saldo < -0.01) statusConta = 'complementar_pendente';
        else statusConta = 'fechado';
    }
    
    const despesa = {
        id: document.getElementById('dv-id').value || Date.now().toString(),
        motorista: document.getElementById('dv-motorista').value.trim(),
        veiculo: document.getElementById('dv-veiculo').value.trim().toUpperCase(),
        data: document.getElementById('dv-data').value,
        trajeto: document.getElementById('dv-trajeto').value.trim(),
        adiantamento,
        itens,
        valorTotal,
        saldo,
        statusConta,
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
    
    let msg = '✅ Despesa lançada com sucesso!';
    if (adiantamento > 0) {
        if (saldo > 0.01) msg += `\n\n💰 Saldo a ESTORNAR pelo motorista: R$ ${saldo.toFixed(2).replace('.', ',')}`;
        else if (saldo < -0.01) msg += `\n\n📌 Valor COMPLEMENTAR a pagar pela empresa: R$ ${Math.abs(saldo).toFixed(2).replace('.', ',')}`;
        else msg += '\n\n✅ Conta fechada! Valores exatos.';
    }
    alert(msg);
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
        filtradas = filtradas.filter(d => new Date(d.data + 'T00:00:00') >= semana);
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
        container.innerHTML = '<p class="sem-dados">Nenhuma despesa encontrada.</p>';
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
        
        const statusClasse = d.status === 'aprovado' ? 'status-aprovado' : 
                           d.status === 'rejeitado' ? 'status-rejeitado' : 'status-pendente';
        const statusTexto = d.status === 'aprovado' ? '✅ Aprovado' : 
                          d.status === 'rejeitado' ? '❌ Rejeitado' : '⏳ Pendente';
        
        const itensResumo = d.itens.map(i => 
            `${iconesTipo[i.tipo] || '•'} ${nomesTipo[i.tipo] || i.tipo} — R$ ${i.valor.toFixed(2).replace('.',',')}`
        ).join(' · ');
        
        // Informações de adiantamento e saldo
        let infoAdiantamento = '';
        if (d.adiantamento > 0) {
            const saldo = d.saldo || 0;
            if (saldo > 0.01) {
                infoAdiantamento = `<div class="despesa-saldo" style="background:#ecfdf5; color:#059669;">
                    💰 Adiantado: R$ ${d.adiantamento.toFixed(2).replace('.',',')} · 
                    ↩️ <strong>A estornar: R$ ${saldo.toFixed(2).replace('.',',')}</strong>
                </div>`;
            } else if (saldo < -0.01) {
                infoAdiantamento = `<div class="despesa-saldo" style="background:#fef2f2; color:#b91c1c;">
                    💰 Adiantado: R$ ${d.adiantamento.toFixed(2).replace('.',',')} · 
                    ➡️ <strong>Complementar: R$ ${Math.abs(saldo).toFixed(2).replace('.',',')}</strong>
                </div>`;
            } else {
                infoAdiantamento = `<div class="despesa-saldo" style="background:#eff6ff; color:#1e40af;">
                    💰 Adiantado: R$ ${d.adiantamento.toFixed(2).replace('.',',')} · 
                    ✅ <strong>Conta fechada</strong>
                </div>`;
            }
        }
        
        return `
            <div class="cartao-despesa ${statusClasse}">
                <div class="despesa-cabecalho">
                    <div>
                        <div class="despesa-motorista">${d.motorista} <span style="font-weight:400; color:#64748b;">— ${d.veiculo}</span></div>
                        <div class="despesa-info">
                            <span>📅 ${dtFmt}</span>
                            ${d.trajeto ? `<span>🛣️ ${d.trajeto}</span>` : ''}
                        </div>
                    </div>
                    <div>
                        <div class="despesa-valor">R$ ${d.valorTotal.toFixed(2).replace('.',',')}</div>
                        <div style="text-align:right; margin-top:4px;"><span class="despesa-status">${statusTexto}</span></div>
                    </div>
                </div>
                <div class="despesa-itens">${itensResumo}</div>
                ${infoAdiantamento}
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

function definirTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
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
    
    let html = `<!DOCTYPE html><html><head><title>Comprovantes - ${d.motorista}</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; background: #f8fafc; }
        h2 { color: #0f172a; margin-bottom: 8px; }
        .info { color: #64748b; margin-bottom: 24px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
        .item { background: white; border-radius: 10px; padding: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .item img { width: 100%; height: 160px; object-fit: cover; border-radius: 6px; cursor: pointer; }
        .pdf-link { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 160px; background: #fee2e2; border-radius: 6px; color: #991b1b; text-decoration: none; font-weight: 600; }
        .pdf-link span { font-size: 40px; margin-bottom: 8px; }
        .nome { font-size: 12px; color: #64748b; margin-top: 8px; text-align: center; word-break: break-all; }
        .resumo { background: white; padding: 16px; border-radius: 10px; margin-bottom: 20px; }
        .resumo-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
        .resumo-item:last-child { border-bottom: none; }
    </style></head><body>
    <h2>📎 Comprovantes de Viagem</h2>
    <div class="info"><strong>${d.motorista}</strong> — ${d.veiculo} — ${d.data}</div>`;
    
    if (d.adiantamento > 0) {
        const saldo = d.saldo || 0;
        let textoSaldo = '';
        if (saldo > 0.01) textoSaldo = `<span style="color:#059669;">↩️ A estornar: R$ ${saldo.toFixed(2).replace('.',',')}</span>`;
        else if (saldo < -0.01) textoSaldo = `<span style="color:#b91c1c;">➡️ Complementar: R$ ${Math.abs(saldo).toFixed(2).replace('.',',')}</span>`;
        else textoSaldo = `<span style="color:#1e40af;">✅ Conta fechada</span>`;
        
        html += `<div class="resumo">
            <div class="resumo-item"><span>💰 Adiantamento</span><strong>R$ ${d.adiantamento.toFixed(2).replace('.',',')}</strong></div>
            <div class="resumo-item"><span>📊 Total gasto</span><strong>R$ ${d.valorTotal.toFixed(2).replace('.',',')}</strong></div>
            <div class="resumo-item"><span>Saldo</span><strong>${textoSaldo}</strong></div>
        </div>`;
    }
    
    html += '<div class="grid">';
    
    d.comprovantes.forEach(c => {
        if (c.tipo.startsWith('image/')) {
            html += `<div class="item"><img src="${c.base64}" onclick="window.open('${c.base64}')" title="Clique para ampliar"><div class="nome">${c.nome}</div></div>`;
        } else {
            html += `<div class="item"><a href="${c.base64}" download="${c.nome}" class="pdf-link"><span>📄</span>${c.nome.split('.').pop().toUpperCase()}</a><div class="nome">${c.nome}</div></div>`;
        }
    });
    
    html += '</div></body></html>';
    
    const modal = window.open('', '_blank', 'width=850,height=700');
    modal.document.write(html);
    modal.document.close();
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
