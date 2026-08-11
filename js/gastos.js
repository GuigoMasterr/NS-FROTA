// ==================================================
// CONTROLE DE GASTOS E DESPESAS ✅ CORRIGIDO
// ==================================================

let gastoEmEdicao = null;

// ✅ Garante função auxiliar existência
function veiculosDoUsuario() {
  return BD.veiculos || [];
}

// ✅ Abre janela de cadastro ou edição
function abrirModalGasto(gasto = null) {
  gastoEmEdicao = gasto;
  const ehEdicao = !!gasto;

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">💰 ${ehEdicao ? '✏️ Editar' : '➕ Lançar'} Gasto</h3>
        <button type="button" onclick="fecharModal()"><i class="fa-solid fa-times text-slate-400"></i></button>
      </div>
      <form id="formGasto" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Data *</label>
            <input type="date" id="gData" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${gasto?.data || ''}">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Valor (R$) *</label>
            <input type="number" step="0.01" id="gValor" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${gasto?.valor || ''}">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Veículo *</label>
          <select id="gVeiculo" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="">Selecione o veículo</option>
            ${veiculosDoUsuario().map(v => `<option value="${v.id}" ${String(gasto?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Obra / Local *</label>
          <select id="gObra" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="">Selecione</option>
            ${(BD.obras || []).map(o => `<option value="${o}" ${gasto?.obra === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Tipo de Gasto *</label>
          <select id="gTipo" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="Combustível" ${gasto?.tipo === 'Combustível' ? 'selected' : ''}>⛽ Combustível</option>
            <option value="Manutenção" ${gasto?.tipo === 'Manutenção' ? 'selected' : ''}>🔧 Manutenção</option>
            <option value="Pneus" ${gasto?.tipo === 'Pneus' ? 'selected' : ''}>🚛 Pneus</option>
            <option value="Pedágio" ${gasto?.tipo === 'Pedágio' ? 'selected' : ''}>🛣️ Pedágio</option>
            <option value="Seguro" ${gasto?.tipo === 'Seguro' ? 'selected' : ''}>🛡️ Seguro</option>
            <option value="Outro" ${gasto?.tipo === 'Outro' ? 'selected' : ''}>📋 Outro</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Observação</label>
          <input type="text" id="gObs" class="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Detalhes..." value="${gasto?.observacao || ''}">
        </div>
        <button type="submit" class="w-full bg-green-600 text-white py-2 rounded-lg mt-2">
          ${ehEdicao ? '💾 Salvar' : '➕ Salvar Gasto'}
        </button>
      </form>
    </div>
  `;
  document.getElementById('modais').appendChild(modal);

  // ✅ MANIPULAÇÃO DO FORMULÁRIO
  document.getElementById('formGasto').addEventListener('submit', e => {
    e.preventDefault();

    const data = document.getElementById('gData').value;
    const veiculoId = document.getElementById('gVeiculo').value;
    const obra = document.getElementById('gObra').value;
    const tipo = document.getElementById('gTipo').value;
    const valor = parseFloat(document.getElementById('gValor').value);
    const observacao = document.getElementById('gObs').value.trim();

    // ✅ VALIDAÇÕES com verificação segura
    if (!(typeof Validacoes !== 'undefined' && Validacoes.camposPreenchidos([data, veiculoId, obra, tipo]))) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    if (!valor || valor <= 0) {
      alert('❌ O valor deve ser maior que zero!');
      return;
    }

    const dados = {
      data,
      veiculoId,
      obra,
      tipo,
      valor,
      observacao,
      lancadoPor: (typeof usuarioAtual !== 'undefined' && usuarioAtual?.nome) || 'Sistema'
    };

    if (ehEdicao) {
      // ✅ Usando função genérica do banco com fallback
      if (typeof atualizarRegistro === 'function') {
        atualizarRegistro('gastos', gasto.id, dados);
      } else {
        const idx = (BD.gastos || []).findIndex(g => String(g.id) === String(gasto.id));
        if (idx !== -1) {
          BD.gastos[idx] = { ...BD.gastos[idx], ...dados };
          if (typeof salvarDados === 'function') salvarDados();
        }
      }
    } else {
      // ✅ Usando função genérica do banco com fallback
      if (typeof adicionarRegistro === 'function') {
        adicionarRegistro('gastos', dados);
      } else {
        if (!BD.gastos) BD.gastos = [];
        dados.id = (typeof Utils?.gerarId === 'function') ? Utils.gerarId() : Date.now();
        BD.gastos.push(dados);
        if (typeof salvarDados === 'function') salvarDados();
      }
    }

    fecharModal();
    if (typeof carregarTabelaGastos === 'function') carregarTabelaGastos();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
    alert('✅ Gasto salvo com sucesso!');
  });
}

// ✅ Exclui gasto
function excluirGasto(id) {
  if (confirm('⚠️ Tem certeza que deseja excluir este lançamento?')) {
    if (typeof excluirRegistro === 'function') {
      excluirRegistro('gastos', id);
    } else {
      BD.gastos = (BD.gastos || []).filter(g => String(g.id) !== String(id));
      if (typeof salvarDados === 'function') salvarDados();
    }
    if (typeof carregarTabelaGastos === 'function') carregarTabelaGastos();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
  }
}

// ✅ Carrega e exibe tabela com filtro por veículo
function carregarTabelaGastos(filtroPlaca = 'todos') {
  const corpo = document.getElementById('tabelaGastos');
  if (!corpo) return;

  // ✅ Garante existência da lista
  let dados = BD.gastos || [];

  // ✅ Filtro corrigido: busca veículo com comparação normalizada
  if (filtroPlaca !== 'todos') {
    dados = dados.filter(g => {
      const veiculo = (BD.veiculos || []).find(v => String(v.id) === String(g.veiculoId));
      return veiculo?.placa === filtroPlaca;
    });
  }

  corpo.innerHTML = dados.length ? dados.map(g => {
    const veic = (BD.veiculos || []).find(v => String(v.id) === String(g.veiculoId));
    // ✅ Formatação segura com fallback
    const dataFormatada = (typeof Utils?.formatarData === 'function')
      ? Utils.formatarData(g.data)
      : new Date(g.data).toLocaleDateString('pt-BR');
    const valorFormatado = (typeof Utils?.formatarMoeda === 'function')
      ? Utils.formatarMoeda(g.valor)
      : `R$ ${Number(g.valor).toFixed(2).replace('.', ',')}`;
    // ✅ JSON SEGURO para edição
    const seguro = JSON.stringify(g).replace(/"/g, '&quot;');

    return `<tr>
      <td>${dataFormatada}</td>
      <td class="font-mono font-semibold">${veic?.placa || '—'}</td>
      <td>${g.tipo}</td>
      <td>${valorFormatado}</td>
      <td>${g.observacao || '—'}</td>
      <td class="admin-only">
        <button class="text-blue-600 text-sm mr-1" onclick='abrirModalGasto(${seguro})'>✏️</button>
        <button class="text-red-600 text-sm" onclick="excluirGasto('${g.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" class="text-center text-slate-400 py-4">${filtroPlaca === 'todos' ? 'Nenhum registro de gasto' : 'Nenhum registro para este veículo'}</td></tr>`;
}