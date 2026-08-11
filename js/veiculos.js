// ==================================================
// CADASTRO E GESTÃO DE VEÍCULOS — ✅ CORRIGIDO
// ==================================================

// ✅ Abre janela de cadastro ou edição
function abrirModalVeiculo(veiculo = null) {
  const ehEdicao = !!veiculo;

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">${ehEdicao ? '✏️ Editar' : '➕ Cadastrar'} Veículo</h3>
        <button type="button" onclick="fecharModal()"><i class="fa-solid fa-times text-slate-400"></i></button>
      </div>
      <form id="formVeiculo" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Placa *</label>
            <input type="text" id="vPlaca" class="w-full px-3 py-2 border border-slate-200 rounded-lg uppercase" required value="${veiculo?.placa || ''}" ${ehEdicao ? 'readonly' : ''}>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Ano</label>
            <input type="number" id="vAno" class="w-full px-3 py-2 border border-slate-200 rounded-lg" value="${veiculo?.ano || ''}">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Categoria *</label>
          <select id="vCategoria" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="">Selecione</option>
            ${(CONFIG?.CATEGORIAS_VEICULOS || CATEGORIAS_VEICULOS || []).map(c => 
              `<option value="${c.id}" ${veiculo?.categoria === c.id ? 'selected' : ''}>${c.icone} ${c.nome}</option>`
            ).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Modelo / Marca *</label>
          <input type="text" id="vModelo" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${veiculo?.modelo || ''}">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Km Atual *</label>
            <input type="number" id="vKm" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${veiculo?.kmAtual || 0}">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Status</label>
            <select id="vStatus" class="w-full px-3 py-2 border border-slate-200 rounded-lg">
              <option value="ativo" ${veiculo?.status === 'ativo' ? 'selected' : ''}>✅ Ativo</option>
              <option value="manutencao" ${veiculo?.status === 'manutencao' ? 'selected' : ''}>🔧 Manutenção</option>
              <option value="inativo" ${veiculo?.status === 'inativo' ? 'selected' : ''}>⛔ Inativo</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Obra / Local *</label>
          <select id="vObra" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="">Selecione</option>
            ${(BD?.obras || []).map(o => `<option value="${o}" ${veiculo?.obraAtual === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg mt-2">
          ${ehEdicao ? '💾 Salvar' : '➕ Cadastrar Veículo'}
        </button>
      </form>
    </div>
  `;

  document.getElementById('modais').appendChild(modal);

  // ===== MANIPULAÇÃO DO FORMULÁRIO =====
  document.getElementById('formVeiculo').addEventListener('submit', e => {
    e.preventDefault();

    const placa = document.getElementById('vPlaca').value.toUpperCase().trim();
    const categoria = document.getElementById('vCategoria').value;
    const modelo = document.getElementById('vModelo').value.trim();
    const ano = document.getElementById('vAno').value;
    const kmAtual = parseFloat(document.getElementById('vKm').value);
    const status = document.getElementById('vStatus').value;
    const obraAtual = document.getElementById('vObra').value;

    // ✅ VALIDAÇÕES AUTOMÁTICAS
    if (!Validacoes.placaValida(placa)) {
      alert('❌ Placa inválida! Use o formato AAA-1234 ou AAA1A23');
      return;
    }
    if (!Validacoes.camposPreenchidos([categoria, modelo, obraAtual])) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    if (!Validacoes.kmValido(kmAtual)) {
      alert('❌ Quilometragem inválida! Deve ser um número positivo.');
      return;
    }

    // ✅ Verifica se placa já existe (NOVO cadastro)
    if (!ehEdicao && BD.veiculos.some(v => v.placa === placa)) {
      alert('❌ Já existe um veículo cadastrado com esta placa!');
      return;
    }

    const dados = { placa, categoria, modelo, ano, kmAtual, status, obraAtual };

    if (ehEdicao) {
      // ✅ Usando função genérica do banco
      atualizarRegistro('veiculos', veiculo.id, dados);
    } else {
      // ✅ Usando função genérica do banco
      const novoVeiculo = adicionarRegistro('veiculos', dados);

      // ✅ Cria alocação automática
      BD.alocacoes.push({
        id: Utils.gerarId(),
        veiculoId: novoVeiculo.id,
        placa: dados.placa,
        obra: dados.obraAtual,
        dataInicio: new Date().toISOString(),
        kmInicio: dados.kmAtual,
        responsavel: (usuarioAtual?.nome) || 'Administrador'
      });
      salvarDados();
    }

    fecharModal();
    carregarTabelaVeiculos();
    if (typeof atualizarDashboardCompleto === 'function') {
      atualizarDashboardCompleto();
    } else if (typeof atualizarDashboard === 'function') {
      atualizarDashboard();
    }
    alert('✅ Veículo salvo com sucesso!');
  });
}

// ✅ Carrega e exibe a tabela completa
function carregarTabelaVeiculos() {
  const corpo = document.getElementById('tabelaVeiculos');
  if (!corpo) return;

  corpo.innerHTML = BD.veiculos.length ? BD.veiculos.map(v => {
    // Usa CONFIG se disponível
    const cat = typeof getCategoriaVeiculo === 'function' 
      ? getCategoriaVeiculo(v.categoria)
      : ((CONFIG?.CATEGORIAS_VEICULOS || CATEGORIAS_VEICULOS || []).find(c => c.id === v.categoria));

    const status = {
      ativo: '<span class="text-green-600">✅ Ativo</span>',
      manutencao: '<span class="text-amber-500">🔧 Manutenção</span>',
      inativo: '<span class="text-red-500">⛔ Inativo</span>'
    }[v.status] || v.status;

    // ✅ JSON SEGURO — escapa aspas e quebras de linha para não quebrar o onclick
    const seguro = JSON.stringify(v).replace(/"/g, '&quot;');

    return `<tr>
      <td class="font-mono">${v.placa}</td>
      <td>${cat ? cat.icone + ' ' + cat.nome : v.categoria}</td>
      <td>${v.modelo}</td>
      <td>${Number(v.kmAtual || 0).toLocaleString('pt-BR')} km</td>
      <td>${v.obraAtual || '—'}</td>
      <td>${status}</td>
      <td>
        <button class="text-blue-600 text-sm mr-1" onclick='abrirModalVeiculo(${seguro})'>✏️</button>
        <button class="text-red-600 text-sm" onclick="excluirVeiculo(${v.id})">🗑️</button>
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="7" class="text-center text-slate-500 py-4">Nenhum veículo cadastrado</td></tr>';
}

// ✅ Exclui veículo
function excluirVeiculo(id) {
  if (confirm('⚠️ Tem certeza que deseja excluir este veículo?')) {
    excluirRegistro('veiculos', id);
    carregarTabelaVeiculos();
    if (typeof atualizarDashboardCompleto === 'function') {
      atualizarDashboardCompleto();
    } else if (typeof atualizarDashboard === 'function') {
      atualizarDashboard();
    }
  }
}

// ✅ Função auxiliar de categoria (se não existir no config.js)
function getCategoriaVeiculo(id) {
  const lista = CONFIG?.CATEGORIAS_VEICULOS || CATEGORIAS_VEICULOS || [];
  return lista.find(c => c.id === id);
}