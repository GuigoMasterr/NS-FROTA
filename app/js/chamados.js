// ===== CHAMADOS ✅ CORRIGIDO =====

let chamadoEmEdicao = null;

// ✅ Garante função auxiliar existência
function veiculosDoUsuario() {
  return BD.veiculos || [];
}

// ✅ Abre janela de cadastro ou edição
function abrirModalChamado(chamado = null) {
  chamadoEmEdicao = chamado;
  const ehEdicao = !!chamado;
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">📢 ${ehEdicao ? '✏️ Editar' : '➕ Registrar'} Chamado</h3>
        <button type="button" onclick="fecharModal()"><i class="fa-solid fa-times text-slate-400"></i></button>
      </div>
      <form id="formChamado" class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1">Veículo *</label>
          <select id="chVeiculo" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="">Selecione o veículo</option>
            ${veiculosDoUsuario().map(v => `<option value="${v.id}" ${String(chamado?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Tipo de Ocorrência *</label>
          <select id="chTipo" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="Problema Mecânico" ${chamado?.tipo === 'Problema Mecânico' ? 'selected' : ''}>🔧 Problema Mecânico</option>
            <option value="Sinistro" ${chamado?.tipo === 'Sinistro' ? 'selected' : ''}>💥 Sinistro / Acidente</option>
            <option value="Outro" ${chamado?.tipo === 'Outro' ? 'selected' : ''}>📋 Outro</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Obra / Local *</label>
          <input type="text" id="chObra" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${chamado?.obra || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Quilometragem *</label>
          <input type="number" id="chKm" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${chamado?.km || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Descrição *</label>
          <textarea id="chDescricao" class="w-full px-3 py-2 border border-slate-200 rounded-lg" rows="3" required>${chamado?.descricao || ''}</textarea>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Status</label>
          <select id="chStatus" class="w-full px-3 py-2 border border-slate-200 rounded-lg">
            <option value="Aberto" ${chamado?.status === 'Aberto' ? 'selected' : ''}>🔴 Aberto</option>
            <option value="Em Andamento" ${chamado?.status === 'Em Andamento' ? 'selected' : ''}>🟡 Em Andamento</option>
            <option value="Resolvido" ${chamado?.status === 'Resolvido' ? 'selected' : ''}>🟢 Resolvido</option>
          </select>
        </div>
        <button type="submit" class="w-full bg-red-600 text-white py-2 rounded-lg mt-2">${ehEdicao ? '💾 Salvar' : '➕ Registrar'}</button>
      </form>
    </div>
  `;
  document.getElementById('modais').appendChild(modal);

  // ✅ MANIPULAÇÃO DO FORMULÁRIO
  document.getElementById('formChamado').addEventListener('submit', e => {
    e.preventDefault();
    const veicId = document.getElementById('chVeiculo').value; // ✅ Mantém como string, converte só quando necessário
    const kmValor = parseFloat(document.getElementById('chKm').value);

    // ✅ Validações com verificação segura
    if (!(typeof Validacoes !== 'undefined' && Validacoes.camposPreenchidos([veicId, kmValor]))) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    if (!(typeof Validacoes !== 'undefined' && Validacoes.kmValido(kmValor))) {
      alert('❌ Quilometragem inválida!');
      return;
    }

    const dados = {
      veiculoId: veicId, // ✅ Mantém tipo original para consistência entre módulos
      tipo: document.getElementById('chTipo').value,
      obra: document.getElementById('chObra').value,
      km: kmValor,
      descricao: document.getElementById('chDescricao').value.trim(),
      status: document.getElementById('chStatus').value,
      responsavel: chamado?.responsavel || ((typeof usuarioAtual !== 'undefined' && usuarioAtual?.nome) || 'Administrador'),
      data: chamado?.data || new Date().toISOString()
    };

    if (ehEdicao) {
      // ✅ Fallback seguro com funções do banco
      if (typeof atualizarRegistro === 'function') {
        atualizarRegistro('chamados', chamado.id, dados);
      } else {
        if (!BD.chamados) BD.chamados = [];
        const idx = BD.chamados.findIndex(c => String(c.id) === String(chamado.id));
        if (idx !== -1) {
          BD.chamados[idx] = { ...BD.chamados[idx], ...dados };
          if (typeof salvarDados === 'function') salvarDados();
        }
      }
    } else {
      // ✅ Novo registro com fallback seguro
      if (typeof adicionarRegistro === 'function') {
        adicionarRegistro('chamados', dados);
      } else {
        if (!BD.chamados) BD.chamados = [];
        dados.id = (typeof Utils?.gerarId === 'function') ? Utils.gerarId() : Date.now();
        BD.chamados.push(dados);
        if (typeof salvarDados === 'function') salvarDados();
      }

      if (typeof Sincronizacao !== 'undefined' && Sincronizacao?.sincronizarRegistro) {
        Sincronizacao.sincronizarRegistro('chamados', dados).catch(() => {});
      }
    }

    fecharModal();
    if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
    if (typeof carregarMeusRegistros === 'function') carregarMeusRegistros();
    alert('✅ Chamado salvo com sucesso!');
  });
}

// ✅ Excluir chamado
function excluirChamado(id) {
  if (confirm('⚠️ Tem certeza que deseja excluir este chamado permanentemente?')) {
    if (typeof excluirRegistro === 'function') {
      excluirRegistro('chamados', id);
    } else {
      BD.chamados = (BD.chamados || []).filter(c => String(c.id) !== String(id));
      if (typeof salvarDados === 'function') salvarDados();
    }
    if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
  }
}

// ✅ Alterar status do chamado
function alterarStatusChamado(id, status) {
  const chamado = (BD.chamados || []).find(c => String(c.id) === String(id));
  if (chamado) {
    chamado.status = status;
    if (typeof salvarDados === 'function') salvarDados();
    if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
  }
}

// ✅ Carregar tabela de chamados
function carregarTabelaChamados() {
  const corpo = document.getElementById('tabelaChamados');
  if (!corpo) return;
  const ehAdmin = (typeof usuarioAtual !== 'undefined' && usuarioAtual?.perfil) === 'admin';
  const listaBruta = BD.chamados || [];
  const lista = typeof filtrarPorVeiculosPermitidos === 'function'
    ? filtrarPorVeiculosPermitidos(listaBruta)
    : listaBruta;

  corpo.innerHTML = lista.length ? lista.map(c => {
    const v = (BD.veiculos || []).find(x => String(x.id) === String(c.veiculoId));
    // ✅ Formatação segura com fallback
    const dt = (typeof Utils?.formatarData === 'function')
      ? Utils.formatarData(c.data)
      : new Date(c.data).toLocaleDateString('pt-BR');
    const statusLabel = {
      'Aberto': '<span class="text-red-600">🔴 Aberto</span>',
      'Em Andamento': '<span class="text-amber-600">🟡 Em Andamento</span>',
      'Resolvido': '<span class="text-green-600">🟢 Resolvido</span>'
    }[c.status] || c.status;
    // ✅ JSON seguro para edição
    const seguro = JSON.stringify(c).replace(/"/g, '&quot;');

    return `<tr class="border-b hover:bg-slate-50">
      <td class="px-4 py-3">${dt}</td>
      <td class="px-4 py-3 font-mono">${v?.placa || '—'}</td>
      <td class="px-4 py-3">${c.tipo}</td>
      <td class="px-4 py-3">${c.obra}</td>
      <td class="px-4 py-3">${statusLabel}</td>
      <td class="px-4 py-3 admin-only whitespace-nowrap">
        ${ehAdmin ? `
          <button class="text-blue-600 text-sm mr-2" onclick='abrirModalChamado(${seguro})'><i class="fa-solid fa-pen-to-square"></i> Editar</button>
          <button class="text-red-600 text-sm" onclick="excluirChamado('${String(c.id)}')"><i class="fa-solid fa-trash"></i> Excluir</button>
        ` : ''}
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="6" class="px-4 py-6 text-center text-slate-500">Nenhum registro disponível</td></tr>';
}

// ❌ Removida função salvarChamado() duplicada/incorreta — conflitava com o envio do formulário