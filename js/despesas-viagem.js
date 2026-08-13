/* ============================================================
   MÓDULO: DESPESAS DE VIAGEM
   Funcionalidades: Adiantamento, Prestação de Contas, Comprovantes
   Integração: 100% sincronizada com HTML
   ============================================================ */

const STORAGE_KEY = 'frota_despesas_viagem';
let despesas = [];
let comprovantesTemp = [];
let editandoId = null;

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 [DESPESAS] Inicializando módulo...');
  carregarDespesas();
  renderizarTudo();
  vincularTodosEventos();
  console.log('✅ [DESPESAS] Módulo inicializado!');
});

// ============================================================
// ARMAZENAMENTO
// ============================================================
function carregarDespesas() {
  // Usa o BD global (que integra com Supabase + localStorage)
  if (window.BD && window.BD.despesasViagem) {
    despesas = [...window.BD.despesasViagem];
  } else {
    // Fallback para localStorage antigo
    try {
      const dados = localStorage.getItem(STORAGE_KEY);
      despesas = dados ? JSON.parse(dados) : [];
    } catch (e) {
      despesas = [];
    }
  }
}

function salvarDespesas() {
  // Salva no BD global (que sincroniza com Supabase e localStorage)
  if (window.BD) {
    window.BD.despesasViagem = [...despesas];
    if (typeof salvarDados === 'function') {
      salvarDados();
    }
  }
  // Também mantém no localStorage para compatibilidade
  localStorage.setItem(STORAGE_KEY, JSON.stringify(despesas));
  
  // Atualiza dashboard automaticamente
  if (window.atualizarDashboardCompleto) {
    setTimeout(() => window.atualizarDashboardCompleto(), 100);
  } else if (window.atualizarDashboard) {
    setTimeout(() => window.atualizarDashboard(), 100);
  }
}

// Função global para compatibilidade com auth.js
window.carregarListaDespesas = function() {
  carregarDespesas();
  renderizarLista();
  atualizarResumoDespesas();
};

// ============================================================
// VINCULAR EVENTOS
// ============================================================
function vincularTodosEventos() {
  // Abrir modal
  const btnAbrir = document.getElementById('btnAbrirDespesa');
  if (btnAbrir) btnAbrir.addEventListener('click', abrirModalNovaDespesa);

  // Fechar modal
  const modal = document.getElementById('modalDespesa');
  const btnFechar = document.getElementById('modalFechar');
  const btnCancelar = document.getElementById('btnCancelarDespesa');
  if (btnFechar) btnFechar.addEventListener('click', fecharModal);
  if (btnCancelar) btnCancelar.addEventListener('click', fecharModal);
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) fecharModal(); });

  // Formulário
  const form = document.getElementById('formDespesa');
  if (form) form.addEventListener('submit', salvarDespesa);

  // Adicionar item
  const btnAdd = document.getElementById('btnAdicionarItem');
  if (btnAdd) btnAdd.addEventListener('click', adicionarLinhaItem);

  // Inputs que disparam cálculo
  document.addEventListener('input', e => {
    if (e.target.classList.contains('item-valor') || e.target.id === 'adiantamentoValor') {
      calcularResumo();
    }
  });

  // Remover item (delegado)
  document.addEventListener('click', e => {
    if (e.target.classList.contains('btn-remover-item')) {
      const linhas = document.querySelectorAll('.item-linha');
      if (linhas.length > 1) e.target.closest('.item-linha').remove();
      calcularResumo();
    }
    if (e.target.classList.contains('comprovante-remover')) {
      const idx = parseInt(e.target.dataset.index);
      comprovantesTemp.splice(idx, 1);
      renderizarComprovantesTemp();
    }
  });

  // Upload de comprovantes
  const area = document.getElementById('areaUpload');
  const input = document.getElementById('inputComprovantes');
  if (area) {
    area.addEventListener('click', () => input && input.click());
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over'); });
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
    area.addEventListener('drop', e => {
      e.preventDefault();
      area.classList.remove('drag-over');
      if (e.dataTransfer.files) processarArquivos(e.dataTransfer.files);
    });
  }
  if (input) input.addEventListener('change', e => processarArquivos(e.target.files));

  // Filtros
  const fPeriodo = document.getElementById('filtroPeriodoDespesas');
  const fStatus = document.getElementById('filtroStatusDespesas');
  const fBusca = document.getElementById('buscaDespesas');
  if (fPeriodo) fPeriodo.addEventListener('change', renderizarLista);
  if (fStatus) fStatus.addEventListener('change', renderizarLista);
  if (fBusca) fBusca.addEventListener('input', renderizarLista);

  // Ações nos cartões (delegado)
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;
    const id = btn.dataset.id;
    const acao = btn.dataset.acao;
    if (acao === 'aprovar') aprovarDespesa(id);
    if (acao === 'rejeitar') rejeitarDespesa(id);
    if (acao === 'excluir') excluirDespesa(id);
    if (acao === 'editar') editarDespesa(id);
    if (acao === 'comprovantes') abrirModalComprovantes(id);
  });

  // Modal comprovantes
  const mc = document.getElementById('modalComprovantes');
  const mcf = document.getElementById('modalComprovantesFechar');
  if (mcf) mcf.addEventListener('click', () => mc && mc.classList.remove('ativo'));
  if (mc) mc.addEventListener('click', e => { if (e.target === mc) mc.classList.remove('ativo'); });
}

// ============================================================
// MODAL
// ============================================================
function abrirModalNovaDespesa() {
  editandoId = null;
  resetarFormulario();
  const modal = document.getElementById('modalDespesa');
  if (modal) modal.classList.add('ativo');
  document.getElementById('adiantamentoValor')?.focus();
}

function fecharModal() {
  const modal = document.getElementById('modalDespesa');
  if (modal) modal.classList.remove('ativo');
  resetarFormulario();
}

function resetarFormulario() {
  const form = document.getElementById('formDespesa');
  if (form) form.reset();
  comprovantesTemp = [];
  editandoId = null;
  
  // Reseta itens para 1 linha vazia
  const container = document.getElementById('itensContainer');
  if (container) {
    container.innerHTML = '';
    adicionarLinhaItem();
  }
  
  renderizarComprovantesTemp();
  calcularResumo();
  
  // Data padrão = hoje
  const inpData = document.getElementById('despesaData');
  if (inpData) inpData.value = new Date().toISOString().split('T')[0];
}

// ============================================================
// ITENS DINÂMICOS
// ============================================================
function adicionarLinhaItem(valorInicial = '') {
  const container = document.getElementById('itensContainer');
  if (!container) return;
  
  const linha = document.createElement('div');
  linha.className = 'item-linha';
  linha.innerHTML = `
    <select class="item-tipo" required>
      <option value="">Selecione o tipo</option>
      <option value="Combustível">⛽ Combustível</option>
      <option value="Pedágio">🛣️ Pedágio</option>
      <option value="Refeição">🍽️ Refeição</option>
      <option value="Hospedagem">🏨 Hospedagem</option>
      <option value="Manutenção">🔧 Manutenção</option>
      <option value="Estacionamento">🅿️ Estacionamento</option>
      <option value="Frete">📦 Frete</option>
      <option value="Outros">📋 Outros</option>
    </select>
    <input type="number" class="item-valor" step="0.01" min="0" placeholder="R$ 0,00" value="${valorInicial}" required>
    <button type="button" class="btn-remover-item" title="Remover item">−</button>
  `;
  container.appendChild(linha);
}

// ============================================================
// CÁLCULO DO ADIANTAMENTO (o coração do sistema!)
// ============================================================
function calcularResumo() {
  // 1. Soma todos os itens
  let totalGasto = 0;
  document.querySelectorAll('.item-linha').forEach(linha => {
    const v = parseFloat(linha.querySelector('.item-valor')?.value) || 0;
    totalGasto += v;
  });

  // 2. Pega valor adiantado
  const adiantamento = parseFloat(document.getElementById('adiantamentoValor')?.value) || 0;

  // 3. Calcula saldo
  const saldo = adiantamento - totalGasto;

  // 4. Atualiza total
  const elTotal = document.getElementById('totalDespesas');
  if (elTotal) elTotal.textContent = formatarMoeda(totalGasto);

  // 5. Atualiza resumo do adiantamento
  const elResumo = document.getElementById('resumoAdiantamento');
  if (!elResumo) return;

  let classe = 'saldo-zerado';
  let mensagem = '';
  let valorSaldo = 0;

  if (adiantamento === 0 && totalGasto === 0) {
    elResumo.style.display = 'none';
    return;
  }

  if (adiantamento === 0) {
    classe = 'saldo-negativo';
    mensagem = '➡️ Empresa paga valor integral';
    valorSaldo = totalGasto;
  } else if (saldo > 0.01) {
    // Sobrou dinheiro → motorista estorna
    classe = 'saldo-positivo';
    mensagem = '↩️ Motorista deve ESTORNAR para empresa';
    valorSaldo = saldo;
  } else if (saldo < -0.01) {
    // Gastou mais → empresa complementa
    classe = 'saldo-negativo';
    mensagem = '➡️ Empresa deve COMPLEMENTAR';
    valorSaldo = Math.abs(saldo);
  } else {
    // Fechado
    classe = 'saldo-zerado';
    mensagem = '✅ Conta fechada! Valores coincidem';
    valorSaldo = 0;
  }

  elResumo.style.display = 'grid';
  elResumo.className = `adiantamento-resumo ${classe}`;
  elResumo.innerHTML = `
    <div class="adiantamento-item">
      <span class="label">💸 Adiantado</span>
      <span class="valor">${formatarMoeda(adiantamento)}</span>
    </div>
    <div class="adiantamento-item">
      <span class="label">📝 Total Gasto</span>
      <span class="valor">${formatarMoeda(totalGasto)}</span>
    </div>
    <div class="adiantamento-item">
      <span class="label">💰 Saldo</span>
      <span class="valor saldo-destaque">${formatarMoeda(valorSaldo)}</span>
    </div>
    <div class="adiantamento-item" style="grid-column: 1 / -1; text-align: center; margin-top: 4px;">
      <span class="saldo-destaque">${mensagem}</span>
    </div>
  `;
}

// ============================================================
// UPLOAD DE COMPROVANTES
// ============================================================
function processarArquivos(arquivos) {
  Array.from(arquivos || []).forEach(arq => {
    if (arq.size > 5 * 1024 * 1024) {
      mostrarToast(`Arquivo ${arq.name} muito grande (máx 5MB)`, 'erro');
      return;
    }
    if (!arq.type.startsWith('image/') && arq.type !== 'application/pdf') {
      mostrarToast(`${arq.name}: Apenas imagens ou PDF`, 'atencao');
      return;
    }

    const leitor = new FileReader();
    leitor.onload = e => {
      comprovantesTemp.push({
        nome: arq.name,
        tipo: arq.type,
        tamanho: arq.size,
        base64: e.target.result
      });
      renderizarComprovantesTemp();
    };
    leitor.readAsDataURL(arq);
  });
}

function renderizarComprovantesTemp() {
  const grid = document.getElementById('comprovantesAnexados');
  if (!grid) return;
  
  if (comprovantesTemp.length === 0) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = comprovantesTemp.map((c, i) => `
    <div class="comprovante-miniatura">
      ${c.tipo.startsWith('image/') 
        ? `<img src="${c.base64}" alt="${c.nome}">` 
        : `<div class="pdf-placeholder"><span style="font-size:24px;">📄</span>PDF</div>`}
      <button type="button" class="comprovante-remover" data-index="${i}" title="Remover">×</button>
    </div>
  `).join('');
}

// ============================================================
// SALVAR DESPESA
// ============================================================
function salvarDespesa(e) {
  e.preventDefault();

  // Coleta itens
  const itens = [];
  document.querySelectorAll('.item-linha').forEach(linha => {
    const tipo = linha.querySelector('.item-tipo')?.value;
    const valor = parseFloat(linha.querySelector('.item-valor')?.value) || 0;
    if (tipo && valor > 0) itens.push({ tipo, valor });
  });

  if (itens.length === 0) {
    mostrarToast('Adicione pelo menos um item de despesa', 'erro');
    return;
  }

  const totalGasto = itens.reduce((s, i) => s + i.valor, 0);
  const adiantamento = parseFloat(document.getElementById('adiantamentoValor')?.value) || 0;
  const saldo = adiantamento - totalGasto;

  let situacaoSaldo = 'fechado';
  if (adiantamento === 0) situacaoSaldo = 'empresa_paga_total';
  else if (saldo > 0.01) situacaoSaldo = 'estornar';
  else if (saldo < -0.01) situacaoSaldo = 'complementar';

  const despesa = {
    id: editandoId || Date.now().toString(),
    dataCadastro: new Date().toISOString(),
    data: document.getElementById('despesaData')?.value || new Date().toISOString().split('T')[0],
    motorista: (document.getElementById('despesaMotorista')?.value || '').trim(),
    veiculo: (document.getElementById('despesaVeiculo')?.value || '').trim().toUpperCase(),
    trajeto: (document.getElementById('despesaTrajeto')?.value || '').trim(),
    adiantamento,
    itens,
    valorTotal: totalGasto,
    saldo,
    situacaoSaldo,
    comprovantes: [...comprovantesTemp],
    observacoes: (document.getElementById('despesaObservacoes')?.value || '').trim(),
    status: editandoId ? (despesas.find(d => d.id === editandoId)?.status || 'pendente') : 'pendente'
  };

  if (editandoId) {
    const idx = despesas.findIndex(d => d.id === editandoId);
    if (idx >= 0) despesas[idx] = despesa;
  } else {
    despesas.unshift(despesa);
  }

  salvarDespesas();
  fecharModal();
  renderizarTudo();
  mostrarToast(editandoId ? 'Despesa atualizada!' : 'Despesa lançada com sucesso!', 'sucesso');
}

// ============================================================
// RENDERIZAÇÃO
// ============================================================
function renderizarTudo() {
  renderizarResumos();
  renderizarLista();
}

function renderizarResumos() {
  const total = despesas.reduce((s, d) => s + d.valorTotal, 0);
  const pendentes = despesas.filter(d => d.status === 'pendente').length;
  const aprovadas = despesas.filter(d => d.status === 'aprovado').length;
  const rejeitadas = despesas.filter(d => d.status === 'rejeitado').length;

  definirTexto('resumoTotalDespesas', formatarMoeda(total));
  definirTexto('resumoPendentes', pendentes.toString());
  definirTexto('resumoAprovadas', aprovadas.toString());
  definirTexto('resumoRejeitadas', rejeitadas.toString());
}

function renderizarLista() {
  const container = document.getElementById('listaDespesas');
  if (!container) return;

  const periodo = document.getElementById('filtroPeriodoDespesas')?.value || 'todos';
  const status = document.getElementById('filtroStatusDespesas')?.value || 'todos';
  const busca = (document.getElementById('buscaDespesas')?.value || '').toLowerCase();
  const hoje = new Date();

  let filtradas = [...despesas];

  // Filtro período
  if (periodo === 'mes') {
    filtradas = filtradas.filter(d => {
      const dt = new Date(d.data + 'T00:00:00');
      return dt.getMonth() === hoje.getMonth() && dt.getFullYear() === hoje.getFullYear();
    });
  } else if (periodo === 'anterior') {
    const ultMes = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
    const ano = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
    filtradas = filtradas.filter(d => {
      const dt = new Date(d.data + 'T00:00:00');
      return dt.getMonth() === ultMes && dt.getFullYear() === ano;
    });
  } else if (periodo === 'ano') {
    filtradas = filtradas.filter(d => new Date(d.data + 'T00:00:00').getFullYear() === hoje.getFullYear());
  }

  // Filtro status
  if (status !== 'todos') filtradas = filtradas.filter(d => d.status === status);

  // Filtro busca
  if (busca) {
    filtradas = filtradas.filter(d => 
      d.motorista?.toLowerCase().includes(busca) ||
      d.veiculo?.toLowerCase().includes(busca) ||
      d.trajeto?.toLowerCase().includes(busca)
    );
  }

  if (filtradas.length === 0) {
    container.innerHTML = `
      <div class="estado-vazio">
        <div class="estado-vazio-icone">📭</div>
        <div class="estado-vazio-texto">Nenhuma despesa encontrada</div>
      </div>`;
    return;
  }

  container.innerHTML = filtradas.map(d => {
    const dt = new Date(d.data + 'T00:00:00');
    const dtFormatada = dt.toLocaleDateString('pt-BR');
    const icones = { 'Combustível':'⛽','Pedágio':'🛣️','Refeição':'🍽️','Hospedagem':'🏨','Manutenção':'🔧','Estacionamento':'🅿️','Frete':'📦','Outros':'📋' };
    const itensResumo = d.itens.map(i => `${icones[i.tipo]||'•'} ${formatarMoeda(i.valor)}`).join(' · ');
    
    const saldoInfo = getSaldoFormatado(d);
    const statusTexto = { 'pendente':'⏳ Pendente','aprovado':'✅ Aprovado','rejeitado':'❌ Rejeitado' }[d.status];

    return `
      <div class="cartao-despesa ${d.status}">
        <div class="despesa-cabecalho">
          <div>
            <div class="despesa-motorista">👤 ${d.motorista || 'Sem motorista'} ${d.veiculo ? `— 🚛 ${d.veiculo}` : ''}</div>
            <div class="despesa-info">📅 ${dtFormatada}${d.trajeto ? ` • 🛤️ ${d.trajeto}` : ''}</div>
          </div>
          <div style="text-align: right;">
            <div class="despesa-valor-total">${formatarMoeda(d.valorTotal)}</div>
            <span class="status-badge status-${d.status}">${statusTexto}</span>
          </div>
        </div>
        
        ${d.adiantamento > 0 ? `
        <div class="adiantamento-resumo ${d.situacaoSaldo === 'estornar' ? 'saldo-positivo' : d.situacaoSaldo === 'complementar' ? 'saldo-negativo' : 'saldo-zerado'}">
          <div class="adiantamento-item"><span class="label">💸 Adiantado</span><span class="valor">${formatarMoeda(d.adiantamento)}</span></div>
          <div class="adiantamento-item"><span class="label">📝 Gasto</span><span class="valor">${formatarMoeda(d.valorTotal)}</span></div>
          <div class="adiantamento-item"><span class="label">${saldoInfo.icone} Saldo</span><span class="valor saldo-destaque">${saldoInfo.texto}</span></div>
        </div>` : ''}
        
        <div class="despesa-itens">${itensResumo}</div>
        
        ${d.comprovantes?.length ? `<div style="font-size: 12px; color: var(--texto-secundario); margin-top: 6px;">📎 ${d.comprovantes.length} comprovante(s) anexado(s)</div>` : ''}
        
        <div class="despesa-acoes">
          <button class="btn-mini btn-comprovantes" data-acao="comprovantes" data-id="${d.id}">📎 Comprovantes</button>
          ${d.status === 'pendente' ? `
            <button class="btn-mini btn-aprovar" data-acao="aprovar" data-id="${d.id}">✓ Aprovar</button>
            <button class="btn-mini btn-rejeitar" data-acao="rejeitar" data-id="${d.id}">✗ Rejeitar</button>
          ` : ''}
          <button class="btn-mini" data-acao="editar" data-id="${d.id}">✏️ Editar</button>
          <button class="btn-mini" data-acao="excluir" data-id="${d.id}" style="color: var(--cor-perigo);">🗑️ Excluir</button>
        </div>
      </div>
    `;
  }).join('');
}

function getSaldoFormatado(d) {
  if (d.situacaoSaldo === 'estornar') return { icone: '↩️', texto: `Estornar ${formatarMoeda(d.saldo)}` };
  if (d.situacaoSaldo === 'complementar') return { icone: '➡️', texto: `Complementar ${formatarMoeda(Math.abs(d.saldo))}` };
  if (d.situacaoSaldo === 'empresa_paga_total') return { icone: '💳', texto: `Empresa paga ${formatarMoeda(d.valorTotal)}` };
  return { icone: '✅', texto: 'Fechado' };
}

// ============================================================
// AÇÕES NAS DESPESAS
// ============================================================
function aprovarDespesa(id) {
  if (!confirm('Confirmar aprovação desta despesa?')) return;
  const d = despesas.find(x => x.id === id);
  if (d) { d.status = 'aprovado'; salvarDespesas(); renderizarTudo(); mostrarToast('Despesa aprovada!', 'sucesso'); }
}

function rejeitarDespesa(id) {
  if (!confirm('Confirmar rejeição desta despesa?')) return;
  const d = despesas.find(x => x.id === id);
  if (d) { d.status = 'rejeitado'; salvarDespesas(); renderizarTudo(); mostrarToast('Despesa rejeitada', 'atencao'); }
}

function excluirDespesa(id) {
  if (!confirm('Excluir esta despesa permanentemente?')) return;
  despesas = despesas.filter(d => d.id !== id);
  salvarDespesas();
  renderizarTudo();
  mostrarToast('Despesa excluída', 'info');
}

function editarDespesa(id) {
  const d = despesas.find(x => x.id === id);
  if (!d) return;
  
  editandoId = id;
  resetarFormulario();
  
  definirValor('despesaData', d.data);
  definirValor('despesaMotorista', d.motorista);
  definirValor('despesaVeiculo', d.veiculo);
  definirValor('despesaTrajeto', d.trajeto);
  definirValor('adiantamentoValor', d.adiantamento || '');
  definirValor('despesaObservacoes', d.observacoes);
  
  // Carrega itens
  const container = document.getElementById('itensContainer');
  if (container) {
    container.innerHTML = '';
    d.itens.forEach((item, idx) => {
      adicionarLinhaItem(item.valor);
      const linhas = container.querySelectorAll('.item-linha');
      const ultima = linhas[linhas.length - 1];
      const sel = ultima.querySelector('.item-tipo');
      if (sel) sel.value = item.tipo;
    });
  }
  
  // Carrega comprovantes
  comprovantesTemp = [...(d.comprovantes || [])];
  renderizarComprovantesTemp();
  calcularResumo();
  
  const modal = document.getElementById('modalDespesa');
  const titulo = modal?.querySelector('.modal-titulo');
  if (titulo) titulo.textContent = '✏️ Editar Despesa de Viagem';
  if (modal) modal.classList.add('ativo');
}

// ============================================================
// MODAL DE COMPROVANTES
// ============================================================
function abrirModalComprovantes(id) {
  const d = despesas.find(x => x.id === id);
  const modal = document.getElementById('modalComprovantes');
  const galeria = document.getElementById('galeriaComprovantes');
  if (!modal || !galeria || !d) return;

  if (!d.comprovantes?.length) {
    galeria.innerHTML = `<div class="estado-vazio"><div class="estado-vazio-icone">📎</div><div class="estado-vazio-texto">Sem comprovantes anexados</div></div>`;
  } else {
    galeria.innerHTML = d.comprovantes.map(c => `
      <div class="comprovante-card">
        ${c.tipo.startsWith('image/') 
          ? `<img src="${c.base64}" alt="${c.nome}" onclick="window.open('${c.base64}','_blank')" style="cursor:pointer;">` 
          : `<div class="pdf-card"><div style="font-size:48px;">📄</div><a href="${c.base64}" download="${c.nome}" class="btn btn-primario" style="margin-top:10px; display:inline-flex;">Baixar PDF</a></div>`}
        <div class="comprovante-nome">${c.nome}</div>
      </div>
    `).join('');
  }

  modal.classList.add('ativo');
}

// ============================================================
// UTILITÁRIOS
// ============================================================
function definirTexto(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}
function definirValor(id, valor) {
  const el = document.getElementById(id);
  if (el) el.value = valor || '';
}
function formatarMoeda(v) {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function mostrarToast(mensagem, tipo = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.textContent = mensagem;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'all 0.3s';
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

console.log('📦 [DESPESAS] Script carregado, aguardando DOM...');
