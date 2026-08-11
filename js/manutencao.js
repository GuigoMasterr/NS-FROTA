// ==================================================
// CONTROLE DE MANUTENÇÃO — Preventiva e Corretiva ✅ CORRIGIDO
// ==================================================

let manutencaoEmEdicao = null;
let tipoManutencaoAtual = null;

// ✅ Garante função auxiliar existência
function veiculosDoUsuario() {
  return BD.veiculos || [];
}

// ✅ Abre janela de cadastro ou edição
function abrirModalManutencao(tipo, manutencao = null) {
  manutencaoEmEdicao = manutencao;
  tipoManutencaoAtual = tipo || manutencao?.tipo;
  const ehEdicao = !!manutencao;
  const ehPreventiva = tipoManutencaoAtual === 'preventiva';

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">${ehEdicao ? '✏️ Editar' : '➕ Cadastrar'} ${ehPreventiva ? '🔧 Preventiva' : '🛠️ Corretiva'}</h3>
        <button type="button" onclick="fecharModal()"><i class="fa-solid fa-times text-slate-400"></i></button>
      </div>
      <form id="formManutencao" class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1">Veículo *</label>
          <select id="mVeiculo" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="">Selecione o veículo</option>
            ${veiculosDoUsuario().map(v => `<option value="${v.id}" ${String(manutencao?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Serviço / Descrição *</label>
          <input type="text" id="mServico" class="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Ex: Troca de óleo, Freios..." required value="${manutencao?.servico || ''}">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Data Prevista *</label>
            <input type="date" id="mData" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${manutencao?.dataPrevista || ''}">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Km Previsto *</label>
            <input type="number" id="mKm" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${manutencao?.kmPrevisto || ''}">
          </div>
        </div>
        ${ehPreventiva ? `<div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Repetir a cada (km)</label>
            <input type="number" id="mIntervaloKm" class="w-full px-3 py-2 border border-slate-200 rounded-lg" value="${manutencao?.intervaloKm || ''}">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Repetir a cada (dias)</label>
            <input type="number" id="mIntervaloDias" class="w-full px-3 py-2 border border-slate-200 rounded-lg" value="${manutencao?.intervaloDias || ''}">
          </div>
        </div>` : ''}
        <div>
          <label class="block text-sm font-medium mb-1">Custo (R$)</label>
          <input type="number" step="0.01" id="mCusto" class="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="0,00" value="${manutencao?.custo || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Status</label>
          <select id="mStatus" class="w-full px-3 py-2 border border-slate-200 rounded-lg">
            <option value="Pendente" ${manutencao?.status === 'Pendente' ? 'selected' : ''}>⏳ Pendente</option>
            <option value="Em Andamento" ${manutencao?.status === 'Em Andamento' ? 'selected' : ''}>🔧 Em Andamento</option>
            <option value="Concluída" ${manutencao?.status === 'Concluída' ? 'selected' : ''}>✅ Concluída</option>
          </select>
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg mt-2">
          ${ehEdicao ? '💾 Salvar' : '➕ Cadastrar'}
        </button>
      </form>
    </div>
  `;
  document.getElementById('modais').appendChild(modal);

  // ✅ MANIPULAÇÃO DO FORMULÁRIO
  document.getElementById('formManutencao').addEventListener('submit', e => {
    e.preventDefault();

    const veiculoId = document.getElementById('mVeiculo').value;
    const servico = document.getElementById('mServico').value.trim();
    const dataPrevista = document.getElementById('mData').value;
    const kmPrevisto = parseFloat(document.getElementById('mKm').value);
    const custo = parseFloat(document.getElementById('mCusto').value) || 0;
    const status = document.getElementById('mStatus').value;

    // ✅ VALIDAÇÕES com verificação segura
    if (!(typeof Validacoes !== 'undefined' && Validacoes.camposPreenchidos([veiculoId, servico, dataPrevista, kmPrevisto]))) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    if (!(typeof Validacoes !== 'undefined' && Validacoes.kmValido(kmPrevisto))) {
      alert('❌ Quilometragem prevista inválida!');
      return;
    }

    const dados = {
      veiculoId,
      tipo: tipoManutencaoAtual,
      servico,
      dataPrevista,
      kmPrevisto,
      custo,
      status,
      ...(ehPreventiva && {
        intervaloKm: parseFloat(document.getElementById('mIntervaloKm').value) || null,
        intervaloDias: parseFloat(document.getElementById('mIntervaloDias').value) || null
      })
    };

    if (ehEdicao) {
      // ✅ Usando função genérica do banco
      if (typeof atualizarRegistro === 'function') {
        atualizarRegistro('manutencoes', manutencao.id, dados);
      } else {
        const idx = (BD.manutencoes || []).findIndex(m => String(m.id) === String(manutencao.id));
        if (idx !== -1) {
          BD.manutencoes[idx] = { ...BD.manutencoes[idx], ...dados };
          if (typeof salvarDados === 'function') salvarDados();
        }
      }
    } else {
      // ✅ Usando função genérica do banco
      dados.criadoPor = (typeof usuarioAtual !== 'undefined' && usuarioAtual?.nome) || 'Sistema';
      if (typeof adicionarRegistro === 'function') {
        adicionarRegistro('manutencoes', dados);
      } else {
        if (!BD.manutencoes) BD.manutencoes = [];
        dados.id = (typeof Utils?.gerarId === 'function') ? Utils.gerarId() : Date.now();
        BD.manutencoes.push(dados);
        if (typeof salvarDados === 'function') salvarDados();
      }
    }

    fecharModal();
    if (typeof carregarTabelaManutencao === 'function') carregarTabelaManutencao();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
    alert('✅ Manutenção salva com sucesso!');
  });
}

// ✅ Exclui manutenção
function excluirManutencao(id) {
  if (confirm('⚠️ Tem certeza que deseja excluir esta manutenção?')) {
    if (typeof excluirRegistro === 'function') {
      excluirRegistro('manutencoes', id);
    } else {
      BD.manutencoes = (BD.manutencoes || []).filter(m => String(m.id) !== String(id));
      if (typeof salvarDados === 'function') salvarDados();
    }
    if (typeof carregarTabelaManutencao === 'function') carregarTabelaManutencao();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
  }
}

// ✅ Carrega e exibe tabela com filtro por veículo
function carregarTabelaManutencao(filtroPlaca = 'todos') {
  const corpo = document.getElementById('tabelaManutencao');
  if (!corpo) return;

  // ✅ Garante existência da lista
  let dados = BD.manutencoes || [];

  // ✅ Filtro por veículo — normaliza comparação de ID
  if (filtroPlaca !== 'todos') {
    dados = dados.filter(m => {
      const veiculo = (BD.veiculos || []).find(v => String(v.id) === String(m.veiculoId));
      return veiculo?.placa === filtroPlaca;
    });
  }

  corpo.innerHTML = dados.length ? dados.map(m => {
    const veic = (BD.veiculos || []).find(v => String(v.id) === String(m.veiculoId));
    const statusClasse = m.status === 'Concluída' ? 'text-green-600' :
                          m.status === 'Em Andamento' ? 'text-amber-500' : 'text-slate-500';

    // ✅ JSON SEGURO para edição — escapa corretamente
    const seguro = JSON.stringify(m).replace(/"/g, '&quot;');

    return `<tr>
      <td>${typeof Utils?.formatarData === 'function' ? Utils.formatarData(m.dataPrevista) : new Date(m.dataPrevista).toLocaleDateString('pt-BR')}</td>
      <td class="font-mono font-semibold">${veic?.placa || '—'}</td>
      <td>${m.tipo === 'preventiva' ? '🔧 Preventiva' : '🛠️ Corretiva'}</td>
      <td>${m.servico}</td>
      <td class="${statusClasse}">${m.status}</td>
      <td>
        <button class="text-blue-600 text-sm mr-1 admin-only" onclick='abrirModalManutencao("${m.tipo}", ${seguro})'>✏️</button>
        <button class="text-red-600 text-sm admin-only" onclick="excluirManutencao('${m.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" class="text-center text-slate-400 py-4">${filtroPlaca === 'todos' ? 'Nenhuma solicitação registrada' : 'Nenhum registro para este veículo'}</td></tr>`;
}