/* ============================================================
   MÓDULO: DESPESAS DE VIAGEM
   Novo fluxo:
   1. Admin/Supervisor libera ADIANTAMENTO (valor, motorista, veículo, origem/destino, data, obs)
   2. Motorista lança GASTOS que abatem do adiantamento (data, tipo, valor, comprovantes, obs)
   ============================================================ */

// ============================================================
// DADOS E ARMAZENAMENTO
// ============================================================
let adiantamentoSelecionado = null;
let comprovantesTemp = [];

// Garante que a estrutura existe no BD
function garantirEstruturaBD() {
  if (!window.BD) window.BD = {};
  if (!BD.adiantamentos) BD.adiantamentos = [];
  if (!BD.gastosViagem) BD.gastosViagem = [];
  if (!BD.despesasViagem) BD.despesasViagem = [];
}

// Carrega dados do BD global
function carregarDados() {
  garantirEstruturaBD();
}

// Salva no BD global
function salvarDados() {
  if (typeof salvarDados === 'function') {
    window.salvarDados();
  } else {
    localStorage.setItem('bd_frotas', JSON.stringify(BD));
  }
  // Atualiza dashboard
  if (window.atualizarDashboardCompleto) setTimeout(() => window.atualizarDashboardCompleto(), 100);
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================
function formatarMoeda(v) {
  const n = Number(v || 0);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(d) {
  if (!d) return '—';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR'); }
  catch { return d; }
}

function obterUsuarios() {
  return BD.usuarios || [];
}

function obterVeiculos() {
  return BD.veiculos || [];
}

// Calcula o total gasto em um adiantamento
function calcularTotalGasto(adiantamentoId) {
  return (BD.gastosViagem || [])
    .filter(g => String(g.adiantamentoId) === String(adiantamentoId))
    .reduce((s, g) => s + Number(g.valor || 0), 0);
}

// Atualiza status do adiantamento baseado nos gastos
function atualizarStatusAdiantamento(adiantamento) {
  const totalGasto = calcularTotalGasto(adiantamento.id);
  const valorAdto = Number(adiantamento.valor || 0);
  
  if (totalGasto >= valorAdto || totalGasto > 0 && adiantamento.fechado) {
    adiantamento.status = 'fechado';
  } else if (totalGasto > 0) {
    adiantamento.status = 'parcial';
  } else {
    adiantamento.status = 'liberado';
  }
  adiantamento.totalGasto = totalGasto;
  adiantamento.saldoRestante = valorAdto - totalGasto;
  adiantamento.percentualUsado = valorAdto > 0 ? Math.min((totalGasto / valorAdto) * 100, 100) : 0;
  
  return adiantamento;
}

// ============================================================
// NAVEGAÇÃO ENTRE ABAS
// ============================================================
function trocarAbaDespesas(aba) {
  // Atualiza botões
  document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativo'));
  document.querySelector(`.aba-btn[data-aba="${aba}"]`)?.classList.add('ativo');
  
  // Mostra/oculta conteúdo
  document.getElementById('aba-adiantamentos').style.display = aba === 'adiantamentos' ? 'block' : 'none';
  document.getElementById('aba-gastos').style.display = aba === 'gastos' ? 'block' : 'none';
  
  if (aba === 'gastos') {
    atualizarSelectAdiantamentos();
  }
}

// ============================================================
// MODAL: LIBERAR ADIANTAMENTO (Admin)
// ============================================================
function abrirModalAdiantamento(adiantamento = null) {
  const ehEdicao = !!adiantamento;
  const usuarios = obterUsuarios();
  const veiculos = obterVeiculos();
  const locais = BD.locais || [];
  
  const opcoesUsuarios = usuarios.map(u => 
    `<option value="${u.nome}" ${adiantamento?.motorista === u.nome ? 'selected' : ''}>${u.nome} (${u.usuario})</option>`
  ).join('');
  
  const opcoesVeiculos = veiculos.map(v => 
    `<option value="${v.placa}" ${adiantamento?.veiculo === v.placa ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`
  ).join('');
  
  const opcoesLocais = locais.map(l => 
    `<option value="${l.nome}">${l.nome}</option>`
  ).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay aberto';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  
  modal.innerHTML = `
    <div class="modal-container" style="max-width: 600px;">
      <div class="modal-cabecalho">
        <h3 class="modal-titulo">💰 ${ehEdicao ? '✏️ Editar' : 'Liberar'} Adiantamento</h3>
        <button type="button" class="modal-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-corpo">
        <form id="formAdiantamento">
          <div class="form-grid">
            <div class="form-grupo" style="grid-column: 1 / -1;">
              <label>Valor do Adiantamento (R$) <span class="obrigatorio">*</span></label>
              <input type="number" step="0.01" min="0.01" id="adtoValor" required value="${adiantamento?.valor || ''}" placeholder="0,00">
            </div>
            <div class="form-grupo">
              <label>Motorista <span class="obrigatorio">*</span></label>
              <select id="adtoMotorista" required>
                <option value="">Selecione o motorista</option>
                ${opcoesUsuarios}
              </select>
            </div>
            <div class="form-grupo">
              <label>Veículo <span class="obrigatorio">*</span></label>
              <select id="adtoVeiculo" required>
                <option value="">Selecione o veículo</option>
                ${opcoesVeiculos}
              </select>
            </div>
            <div class="form-grupo">
              <label>Origem <span class="obrigatorio">*</span></label>
              <select id="adtoOrigem" required>
                <option value="">Selecione</option>
                ${opcoesLocais}
              </select>
            </div>
            <div class="form-grupo">
              <label>Destino <span class="obrigatorio">*</span></label>
              <select id="adtoDestino" required>
                <option value="">Selecione</option>
                ${opcoesLocais}
              </select>
            </div>
            <div class="form-grupo">
              <label>Data do Adiantamento <span class="obrigatorio">*</span></label>
              <input type="date" id="adtoData" required value="${adiantamento?.data || new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-grupo" style="grid-column: 1 / -1;">
              <label>Observações</label>
              <textarea id="adtoObs" rows="2" placeholder="Observações adicionais...">${adiantamento?.observacoes || ''}</textarea>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="button" class="btn btn-sucesso" id="btnSalvarAdiantamento">💾 Liberar Adiantamento</button>
      </div>
    </div>
  `;
  
  document.getElementById('modais').appendChild(modal);
  
  document.getElementById('btnSalvarAdiantamento').addEventListener('click', () => {
    const valor = parseFloat(document.getElementById('adtoValor').value);
    const motorista = document.getElementById('adtoMotorista').value;
    const veiculo = document.getElementById('adtoVeiculo').value;
    const origem = document.getElementById('adtoOrigem').value;
    const destino = document.getElementById('adtoDestino').value;
    const data = document.getElementById('adtoData').value;
    const observacoes = document.getElementById('adtoObs').value.trim();
    
    if (!valor || valor <= 0) { alert('❌ Valor deve ser maior que zero!'); return; }
    if (!motorista || !veiculo || !origem || !destino || !data) {
      alert('❌ Preencha todos os campos obrigatórios!'); return;
    }
    
    const dados = {
      valor, motorista, veiculo, origem, destino, data, observacoes,
      criadoPor: window.usuarioAtual?.nome || 'Sistema',
      dataCriacao: new Date().toISOString()
    };
    
    if (ehEdicao) {
      const idx = BD.adiantamentos.findIndex(a => String(a.id) === String(adiantamento.id));
      if (idx >= 0) {
        BD.adiantamentos[idx] = { ...BD.adiantamentos[idx], ...dados };
        atualizarStatusAdiantamento(BD.adiantamentos[idx]);
      }
    } else {
      dados.id = BD.adiantamentos.length > 0 ? Math.max(...BD.adiantamentos.map(a => a.id || 0)) + 1 : 1;
      dados.status = 'liberado';
      dados.totalGasto = 0;
      dados.saldoRestante = valor;
      dados.percentualUsado = 0;
      BD.adiantamentos.push(dados);
    }
    
    salvarDados();
    alert('✅ Adiantamento liberado com sucesso!');
    fecharModal();
    renderizarTudo();
  });
}

// ============================================================
// MODAL: LANÇAR GASTO (Motorista)
// ============================================================
function abrirModalGastoViagem(gasto = null) {
  if (!adiantamentoSelecionado) {
    alert('⚠️ Selecione um adiantamento primeiro!');
    return;
  }
  
  const ehEdicao = !!gasto;
  const adiantamento = BD.adiantamentos.find(a => String(a.id) === String(adiantamentoSelecionado));
  if (!adiantamento) return;
  
  comprovantesTemp = gasto?.comprovantes ? [...gasto.comprovantes] : [];
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay aberto';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  
  modal.innerHTML = `
    <div class="modal-container" style="max-width: 550px;">
      <div class="modal-cabecalho">
        <h3 class="modal-titulo">🧾 ${ehEdicao ? '✏️ Editar' : 'Lançar'} Gasto</h3>
        <button type="button" class="modal-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-corpo">
        <div style="padding: 0.75rem; background: #eff6ff; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem;">
          <strong>Adiantamento:</strong> ${adiantamento.motorista} — ${formatarMoeda(adiantamento.valor)}<br>
          <strong>Saldo disponível:</strong> <span style="color: #2563eb; font-weight: 700;">${formatarMoeda(adiantamento.saldoRestante)}</span>
        </div>
        <form id="formGasto">
          <div class="form-grid">
            <div class="form-grupo">
              <label>Data do Gasto <span class="obrigatorio">*</span></label>
              <input type="date" id="gastoData" required value="${gasto?.data || new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-grupo">
              <label>Tipo de Despesa <span class="obrigatorio">*</span></label>
              <select id="gastoTipo" required>
                <option value="">Selecione</option>
                <option value="Combustível" ${gasto?.tipo === 'Combustível' ? 'selected' : ''}>⛽ Combustível</option>
                <option value="Pedágio" ${gasto?.tipo === 'Pedágio' ? 'selected' : ''}>🛣️ Pedágio</option>
                <option value="Refeição" ${gasto?.tipo === 'Refeição' ? 'selected' : ''}>🍽️ Refeição</option>
                <option value="Hospedagem" ${gasto?.tipo === 'Hospedagem' ? 'selected' : ''}>🏨 Hospedagem</option>
                <option value="Manutenção" ${gasto?.tipo === 'Manutenção' ? 'selected' : ''}>🔧 Manutenção</option>
                <option value="Estacionamento" ${gasto?.tipo === 'Estacionamento' ? 'selected' : ''}>🅿️ Estacionamento</option>
                <option value="Frete" ${gasto?.tipo === 'Frete' ? 'selected' : ''}>📦 Frete</option>
                <option value="Outros" ${gasto?.tipo === 'Outros' ? 'selected' : ''}>📋 Outros</option>
              </select>
            </div>
            <div class="form-grupo" style="grid-column: 1 / -1;">
              <label>Valor (R$) <span class="obrigatorio">*</span></label>
              <input type="number" step="0.01" min="0.01" id="gastoValor" required value="${gasto?.valor || ''}" placeholder="0,00">
            </div>
            <div class="form-grupo" style="grid-column: 1 / -1;">
              <label>Observações</label>
              <textarea id="gastoObs" rows="2" placeholder="Detalhes adicionais...">${gasto?.observacoes || ''}</textarea>
            </div>
            <div class="form-grupo" style="grid-column: 1 / -1;">
              <label>📎 Comprovantes / Cupons Fiscais</label>
              <div id="areaUploadGasto" style="border: 2px dashed #cbd5e1; border-radius: 8px; padding: 1.5rem; text-align: center; cursor: pointer; margin-bottom: 0.5rem;">
                <i class="fa-solid fa-cloud-upload-alt" style="font-size: 1.5rem; color: #94a3b8;"></i>
                <p style="color: #64748b; margin: 0.25rem 0 0; font-size: 0.85rem;">Clique para anexar comprovantes</p>
              </div>
              <input type="file" id="inputComprovantesGasto" multiple accept="image/*,.pdf" style="display: none;">
              <div id="comprovantesAnexados"></div>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="button" class="btn btn-primario" id="btnSalvarGasto">💾 Salvar Gasto</button>
      </div>
    </div>
  `;
  
  document.getElementById('modais').appendChild(modal);
  
  // Renderiza comprovantes já anexados
  renderizarComprovantesTemp();
  
  // Upload de comprovantes
  const areaUpload = document.getElementById('areaUploadGasto');
  const inputArquivos = document.getElementById('inputComprovantesGasto');
  areaUpload.addEventListener('click', () => inputArquivos.click());
  inputArquivos.addEventListener('change', (e) => {
    if (e.target.files) processarComprovantes(e.target.files);
  });
  
  document.getElementById('btnSalvarGasto').addEventListener('click', () => {
    const data = document.getElementById('gastoData').value;
    const tipo = document.getElementById('gastoTipo').value;
    const valor = parseFloat(document.getElementById('gastoValor').value);
    const observacoes = document.getElementById('gastoObs').value.trim();
    
    if (!data || !tipo || !valor || valor <= 0) {
      alert('❌ Preencha todos os campos obrigatórios!'); return;
    }
    
    const dados = {
      adiantamentoId: adiantamentoSelecionado,
      data, tipo, valor, observacoes,
      comprovantes: [...comprovantesTemp],
      criadoPor: window.usuarioAtual?.nome || 'Motorista',
      dataCriacao: new Date().toISOString()
    };
    
    if (ehEdicao) {
      const idx = BD.gastosViagem.findIndex(g => String(g.id) === String(gasto.id));
      if (idx >= 0) BD.gastosViagem[idx] = { ...BD.gastosViagem[idx], ...dados };
    } else {
      dados.id = BD.gastosViagem.length > 0 ? Math.max(...BD.gastosViagem.map(g => g.id || 0)) + 1 : 1;
      BD.gastosViagem.push(dados);
    }
    
    // Atualiza status do adiantamento
    const adto = BD.adiantamentos.find(a => String(a.id) === String(adiantamentoSelecionado));
    if (adto) atualizarStatusAdiantamento(adto);
    
    salvarDados();
    alert('✅ Gasto lançado com sucesso!');
    fecharModal();
    renderizarTudo();
    atualizarDetalhesAdiantamento();
  });
}

// ============================================================
// COMPROVANTES
// ============================================================
function processarComprovantes(arquivos) {
  Array.from(arquivos).forEach(arquivo => {
    if (arquivo.size > 5 * 1024 * 1024) {
      alert(`⚠️ Arquivo ${arquivo.name} muito grande (máx 5MB)`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      comprovantesTemp.push({
        nome: arquivo.name,
        tipo: arquivo.type,
        dados: e.target.result
      });
      renderizarComprovantesTemp();
    };
    reader.readAsDataURL(arquivo);
  });
}

function renderizarComprovantesTemp() {
  const container = document.getElementById('comprovantesAnexados');
  if (!container) return;
  
  if (!comprovantesTemp.length) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = comprovantesTemp.map((c, i) => `
    <span class="comprovante-item">
      📎 ${c.nome}
      <span class="comprovante-remover" onclick="removerComprovanteTemp(${i})">×</span>
    </span>
  `).join('');
}

function removerComprovanteTemp(idx) {
  comprovantesTemp.splice(idx, 1);
  renderizarComprovantesTemp();
}

// ============================================================
// RENDERIZAÇÃO: LISTA DE ADIANTAMENTOS
// ============================================================
function renderizarListaAdiantamentos() {
  const container = document.getElementById('listaAdiantamentos');
  if (!container) return;
  
  const filtroStatus = document.getElementById('filtroStatusAdiantamento')?.value || 'todos';
  const busca = (document.getElementById('buscaAdiantamento')?.value || '').toLowerCase();
  
  let lista = [...(BD.adiantamentos || [])];
  
  // Atualiza status de todos
  lista = lista.map(a => atualizarStatusAdiantamento({ ...a }));
  
  // Aplica filtros
  if (filtroStatus !== 'todos') {
    lista = lista.filter(a => a.status === filtroStatus);
  }
  if (busca) {
    lista = lista.filter(a => 
      a.motorista?.toLowerCase().includes(busca) ||
      a.veiculo?.toLowerCase().includes(busca) ||
      a.origem?.toLowerCase().includes(busca) ||
      a.destino?.toLowerCase().includes(busca)
    );
  }
  
  // Ordena por data (mais recente primeiro)
  lista.sort((a, b) => new Date(b.data) - new Date(a.data));
  
  if (!lista.length) {
    container.innerHTML = `
      <div class="estado-vazio">
        <div class="estado-vazio-icone">💰</div>
        <div class="estado-vazio-texto">Nenhum adiantamento liberado ainda.</div>
      </div>`;
    return;
  }
  
  const statusLabel = {
    liberado: '<span class="status-adiantamento status-liberado">💰 Liberado</span>',
    parcial: '<span class="status-adiantamento status-parcial">📝 Parcial</span>',
    fechado: '<span class="status-adiantamento status-fechado">✅ Fechado</span>'
  };
  
  container.innerHTML = lista.map(a => `
    <div class="cartao-adiantamento ${a.status}">
      <div class="adiantamento-header">
        <div>
          <div class="adiantamento-motorista">👤 ${a.motorista}</div>
          <div class="adiantamento-info">
            🚛 ${a.veiculo} • 📍 ${a.origem} → ${a.destino} • 📅 ${formatarData(a.data)}
          </div>
        </div>
        <div style="text-align: right;">
          <div class="adiantamento-valor">${formatarMoeda(a.valor)}</div>
          ${statusLabel[a.status] || a.status}
        </div>
      </div>
      
      <div class="adiantamento-progresso">
        <div class="progresso-barra">
          <div class="progresso-preenchido" style="width: ${a.percentualUsado}%"></div>
        </div>
        <div class="progresso-texto">
          <span>${a.percentualUsado.toFixed(1)}% utilizado</span>
          <span>${formatarMoeda(a.totalGasto)} de ${formatarMoeda(a.valor)}</span>
        </div>
      </div>
      
      <div class="adiantamento-saldos">
        <div class="saldo-item">
          <div class="saldo-label">Adiantado</div>
          <div class="saldo-valor">${formatarMoeda(a.valor)}</div>
        </div>
        <div class="saldo-item">
          <div class="saldo-label">Gasto</div>
          <div class="saldo-valor negativo">${formatarMoeda(a.totalGasto)}</div>
        </div>
        <div class="saldo-item">
          <div class="saldo-label">Saldo</div>
          <div class="saldo-valor ${a.saldoRestante >= 0 ? 'positivo' : 'negativo'}">${formatarMoeda(a.saldoRestante)}</div>
        </div>
      </div>
      
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button class="btn btn-sm btn-secundario" onclick="selecionarAdiantamento(${a.id})">
          <i class="fa-solid fa-receipt"></i> Ver Gastos
        </button>
        <button class="btn btn-sm" style="background:#fef3c7; color:#92400e;" onclick='abrirModalAdiantamento(${JSON.stringify(a).replace(/"/g, '&quot;')})'>
          <i class="fa-solid fa-pen"></i> Editar
        </button>
        <button class="btn btn-sm" style="background:#fee2e2; color:#991b1b;" onclick="excluirAdiantamento(${a.id})">
          <i class="fa-solid fa-trash"></i> Excluir
        </button>
        ${a.status !== 'fechado' ? `
        <button class="btn btn-sm" style="background:#d1fae5; color:#065f46; margin-left: auto;" onclick="fecharAdiantamento(${a.id})">
          <i class="fa-solid fa-check"></i> Fechar
        </button>` : ''}
      </div>
      
      ${a.observacoes ? `<div style="margin-top: 0.75rem; padding: 0.5rem 0.75rem; background: #f8fafc; border-radius: 6px; font-size: 0.85rem; color: #64748b;">
        📝 ${a.observacoes}
      </div>` : ''}
    </div>
  `).join('');
}

// ============================================================
// SELECIONAR ADIANTAMENTO PARA LANÇAR GASTOS
// ============================================================
function selecionarAdiantamento(id) {
  adiantamentoSelecionado = id;
  trocarAbaDespesas('gastos');
  const select = document.getElementById('filtroAdiantamentoGasto');
  if (select) select.value = id;
  atualizarDetalhesAdiantamento();
}

function atualizarSelectAdiantamentos() {
  const select = document.getElementById('filtroAdiantamentoGasto');
  if (!select) return;
  
  const lista = (BD.adiantamentos || [])
    .map(a => atualizarStatusAdiantamento({ ...a }))
    .filter(a => a.status !== 'fechado')
    .sort((a, b) => new Date(b.data) - new Date(a.data));
  
  select.innerHTML = '<option value="">Selecione um adiantamento</option>' +
    lista.map(a => `<option value="${a.id}" ${String(adiantamentoSelecionado) === String(a.id) ? 'selected' : ''}>
      ${a.motorista} — ${a.veiculo} — ${formatarMoeda(a.saldoRestante)} disponível
    </option>`).join('');
  
  if (adiantamentoSelecionado) {
    atualizarDetalhesAdiantamento();
  }
}

function atualizarDetalhesAdiantamento() {
  const container = document.getElementById('detalhesAdiantamento');
  const btnLancar = document.getElementById('btnLancarGasto');
  const select = document.getElementById('filtroAdiantamentoGasto');
  
  if (!select || !select.value) {
    if (container) container.style.display = 'none';
    if (btnLancar) btnLancar.style.display = 'none';
    adiantamentoSelecionado = null;
    renderizarListaGastos();
    return;
  }
  
  adiantamentoSelecionado = select.value;
  const adiantamento = BD.adiantamentos.find(a => String(a.id) === String(adiantamentoSelecionado));
  if (!adiantamento) return;
  
  atualizarStatusAdiantamento(adiantamento);
  
  if (container) {
    container.style.display = 'block';
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <strong style="font-size: 1.1rem;">👤 ${adiantamento.motorista}</strong>
          <div style="font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
            🚛 ${adiantamento.veiculo} • 📍 ${adiantamento.origem} → ${adiantamento.destino} • 📅 ${formatarData(adiantamento.data)}
          </div>
        </div>
        <div style="display: flex; gap: 2rem; text-align: center;">
          <div>
            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Adiantado</div>
            <div style="font-weight: 700; color: #2563eb;">${formatarMoeda(adiantamento.valor)}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Gasto</div>
            <div style="font-weight: 700; color: #dc2626;">${formatarMoeda(adiantamento.totalGasto)}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">Saldo</div>
            <div style="font-weight: 700; color: ${adiantamento.saldoRestante >= 0 ? '#10b981' : '#dc2626'};">${formatarMoeda(adiantamento.saldoRestante)}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  if (btnLancar) btnLancar.style.display = adiantamento.status === 'fechado' ? 'none' : 'inline-block';
  
  renderizarListaGastos();
}

// ============================================================
// RENDERIZAÇÃO: LISTA DE GASTOS
// ============================================================
function renderizarListaGastos() {
  const container = document.getElementById('listaGastos');
  if (!container) return;
  
  if (!adiantamentoSelecionado) {
    container.innerHTML = `
      <div class="estado-vazio">
        <div class="estado-vazio-icone">👆</div>
        <div class="estado-vazio-texto">Selecione um adiantamento acima para ver os gastos.</div>
      </div>`;
    return;
  }
  
  const gastos = (BD.gastosViagem || [])
    .filter(g => String(g.adiantamentoId) === String(adiantamentoSelecionado))
    .sort((a, b) => new Date(b.data) - new Date(a.data));
  
  if (!gastos.length) {
    container.innerHTML = `
      <div class="estado-vazio">
        <div class="estado-vazio-icone">🧾</div>
        <div class="estado-vazio-texto">Nenhum gasto lançado ainda para este adiantamento.</div>
      </div>`;
    return;
  }
  
  const icones = {
    'Combustível': '⛽', 'Pedágio': '🛣️', 'Refeição': '🍽️', 'Hospedagem': '🏨',
    'Manutenção': '🔧', 'Estacionamento': '🅿️', 'Frete': '📦', 'Outros': '📋'
  };
  
  container.innerHTML = gastos.map(g => `
    <div class="cartao-gasto">
      <div class="gasto-info">
        <div class="gasto-tipo">${icones[g.tipo] || '📋'} ${g.tipo}</div>
        <div class="gasto-detalhes">
          📅 ${formatarData(g.data)} • ${g.comprovantes?.length || 0} comprovante(s)
          ${g.observacoes ? ` • 📝 ${g.observacoes}` : ''}
        </div>
      </div>
      <div class="gasto-valor">${formatarMoeda(g.valor)}</div>
      <div style="display: flex; gap: 0.25rem;">
        ${g.comprovantes?.length ? `
        <button class="btn btn-sm btn-secundario" onclick='verComprovantes(${JSON.stringify(g.comprovantes).replace(/"/g, '&quot;')})' title="Ver comprovantes">
          📎
        </button>` : ''}
        <button class="btn btn-sm" style="background:#fef3c7; color:#92400e;" onclick='abrirModalGastoViagem(${JSON.stringify(g).replace(/"/g, '&quot;')})'>
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-sm" style="background:#fee2e2; color:#991b1b;" onclick="excluirGastoViagem(${g.id})">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// ============================================================
// VER COMPROVANTES
// ============================================================
function verComprovantes(comprovantes) {
  if (!comprovantes || !comprovantes.length) return;
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay aberto';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  
  modal.innerHTML = `
    <div class="modal-container" style="max-width: 800px;">
      <div class="modal-cabecalho">
        <h3 class="modal-titulo">📎 Comprovantes</h3>
        <button type="button" class="modal-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-corpo">
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
          ${comprovantes.map(c => c.tipo.startsWith('image/') 
            ? `<div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                 <img src="${c.dados}" style="width: 100%; height: 150px; object-fit: cover;">
                 <div style="padding: 0.5rem; font-size: 0.8rem; text-align: center;">${c.nome}</div>
               </div>`
            : `<div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; text-align: center;">
                 <div style="font-size: 2rem;">📄</div>
                 <div style="font-size: 0.8rem; margin-top: 0.5rem;">${c.nome}</div>
                 <a href="${c.dados}" download="${c.nome}" class="btn btn-sm btn-primario" style="margin-top: 0.5rem; display: inline-block; text-decoration: none;">Baixar</a>
               </div>`
          ).join('')}
        </div>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-primario" onclick="fecharModal()">Fechar</button>
      </div>
    </div>
  `;
  
  document.getElementById('modais').appendChild(modal);
}

// ============================================================
// AÇÕES: EXCLUIR E FECHAR
// ============================================================
function excluirAdiantamento(id) {
  if (!confirm('⚠️ Tem certeza? Isso também excluirá todos os gastos deste adiantamento!')) return;
  
  BD.adiantamentos = BD.adiantamentos.filter(a => String(a.id) !== String(id));
  BD.gastosViagem = (BD.gastosViagem || []).filter(g => String(g.adiantamentoId) !== String(id));
  
  salvarDados();
  alert('✅ Adiantamento excluído!');
  renderizarTudo();
}

function excluirGastoViagem(id) {
  if (!confirm('⚠️ Tem certeza que deseja excluir este gasto?')) return;
  
  BD.gastosViagem = (BD.gastosViagem || []).filter(g => String(g.id) !== String(id));
  
  // Atualiza status do adiantamento
  const adto = BD.adiantamentos.find(a => String(a.id) === String(adiantamentoSelecionado));
  if (adto) atualizarStatusAdiantamento(adto);
  
  salvarDados();
  alert('✅ Gasto excluído!');
  renderizarTudo();
  atualizarDetalhesAdiantamento();
}

function fecharAdiantamento(id) {
  if (!confirm('⚠️ Deseja fechar este adiantamento? Não será possível lançar mais gastos.')) return;
  
  const adto = BD.adiantamentos.find(a => String(a.id) === String(id));
  if (adto) {
    adto.fechado = true;
    adto.status = 'fechado';
    atualizarStatusAdiantamento(adto);
  }
  
  salvarDados();
  alert('✅ Adiantamento fechado!');
  renderizarTudo();
}

// ============================================================
// CARDS RESUMO
// ============================================================
function atualizarCardsResumo() {
  const adiantamentos = (BD.adiantamentos || []).map(a => atualizarStatusAdiantamento({ ...a }));
  
  const totalAdiantado = adiantamentos.reduce((s, a) => s + Number(a.valor || 0), 0);
  const totalGasto = adiantamentos.reduce((s, a) => s + Number(a.totalGasto || 0), 0);
  const emAberto = adiantamentos.filter(a => a.status !== 'fechado').length;
  const fechados = adiantamentos.filter(a => a.status === 'fechado').length;
  
  const el1 = document.getElementById('resumoTotalAdiantado');
  const el2 = document.getElementById('resumoTotalGasto');
  const el3 = document.getElementById('resumoEmAberto');
  const el4 = document.getElementById('resumoFechados');
  
  if (el1) el1.textContent = formatarMoeda(totalAdiantado);
  if (el2) el2.textContent = formatarMoeda(totalGasto);
  if (el3) el3.textContent = emAberto;
  if (el4) el4.textContent = fechados;
}

// ============================================================
// RENDERIZAÇÃO GERAL
// ============================================================
function renderizarTudo() {
  carregarDados();
  atualizarCardsResumo();
  renderizarListaAdiantamentos();
  if (adiantamentoSelecionado) {
    atualizarSelectAdiantamentos();
  }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
window.carregarListaDespesas = function() {
  renderizarTudo();
};

// Evento do select de adiantamentos na aba gastos
document.addEventListener('change', (e) => {
  if (e.target.id === 'filtroAdiantamentoGasto') {
    atualizarDetalhesAdiantamento();
  }
});

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  carregarDados();
  renderizarTudo();
});

// Expor funções globalmente
window.trocarAbaDespesas = trocarAbaDespesas;
window.abrirModalAdiantamento = abrirModalAdiantamento;
window.abrirModalGastoViagem = abrirModalGastoViagem;
window.selecionarAdiantamento = selecionarAdiantamento;
window.excluirAdiantamento = excluirAdiantamento;
window.excluirGastoViagem = excluirGastoViagem;
window.fecharAdiantamento = fecharAdiantamento;
window.verComprovantes = verComprovantes;
window.removerComprovanteTemp = removerComprovanteTemp;
window.renderizarTudoDespesas = renderizarTudo;