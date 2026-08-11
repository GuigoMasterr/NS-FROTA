// ==================================================
// CADASTRO E GESTÃO DE USUÁRIOS
// ==================================================

// ✅ Abre janela de cadastro ou edição
function abrirModalUsuario(usuario = null) {
  const ehEdicao = !!usuario;
  const veiculosSelecionados = usuario?.veiculosPermitidos || [];

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">${ehEdicao ? '✏️ Editar' : '➕ Cadastrar'} Usuário</h3>
        <button onclick="fecharModal()"><i class="fa-solid fa-times text-slate-400"></i></button>
      </div>
      <form id="formUsuario" class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1">Usuário (Login) *</label>
          <input type="text" id="uLogin" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${usuario?.usuario || ''}" ${ehEdicao ? 'readonly' : ''}>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Nome Completo *</label>
          <input type="text" id="uNome" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${usuario?.nome || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Senha ${ehEdicao ? '(deixe em branco para não alterar)' : '*'}</label>
          <input type="text" id="uSenha" class="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="${ehEdicao ? '••••••••' : 'Mínimo 6 caracteres'}">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Perfil de Acesso</label>
          <select id="uPerfil" class="w-full px-3 py-2 border border-slate-200 rounded-lg" onchange="toggleListaVeiculos(this.value)">
            <option value="admin" ${usuario?.perfil==='admin'?'selected':''}>🔑 Administrador (Vê tudo)</option>
            <option value="operacional" ${usuario?.perfil==='operacional'?'selected':''}>🚛 Motorista / Operacional</option>
            <option value="visitante" ${usuario?.perfil==='visitante'?'selected':''}>👁️ Visitante</option>
          </select>
        </div>
        <div id="secaoVeiculosPermitidos" class="${usuario?.perfil==='admin'?'hidden':''} border border-slate-200 rounded-lg p-3">
          <label class="block text-sm font-medium mb-2">🚛 Veículos Permitidos</label>
          <p class="text-xs text-slate-500 mb-2">Selecione quais veículos este motorista pode acessar:</p>
          <div class="max-h-48 overflow-y-auto space-y-2">
            ${BD.veiculos.length ? BD.veiculos.map(v => `
              <label class="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50 rounded">
                <input type="checkbox" name="veiculoPermitido" value="${v.id}" ${veiculosSelecionados.includes(v.id) ? 'checked' : ''}>
                ${v.placa} — ${v.modelo}
              </label>
            `).join('') : '<p class="text-sm text-slate-400">Cadastre veículos primeiro</p>'}
          </div>
        </div>
        <div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="uAtivo" ${usuario?.ativo !== false ? 'checked' : ''}> Usuário Ativo
          </label>
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg mt-2">
          ${ehEdicao ? '💾 Salvar' : '➕ Criar Usuário'}
        </button>
      </form>
    </div>
  `;
  document.getElementById('modais').appendChild(modal);

  // ✅ Mostra/esconde lista de veículos conforme perfil
  window.toggleListaVeiculos = function(perfil) {
    const secao = document.getElementById('secaoVeiculosPermitidos');
    if (secao) secao.classList.toggle('hidden', perfil === 'admin');
  };

  // ✅ Manipulação do formulário
  document.getElementById('formUsuario').addEventListener('submit', e => {
    e.preventDefault();

    const login = document.getElementById('uLogin').value.trim();
    const nome = document.getElementById('uNome').value.trim();
    const senha = document.getElementById('uSenha').value;
    const perfil = document.getElementById('uPerfil').value;
    const ativo = document.getElementById('uAtivo').checked;
    const veiculosPermitidos = perfil === 'admin' ? [] :
      Array.from(document.querySelectorAll('input[name="veiculoPermitido"]:checked')).map(cb => cb.value);

    // ✅ VALIDAÇÕES
    if (!Validacoes.camposPreenchidos([login, nome])) {
      alert('❌ Preencha Login e Nome!');
      return;
    }
    if (!ehEdicao && !Validacoes.senhaValida(senha)) {
      alert('❌ A senha deve ter pelo menos 6 caracteres!');
      return;
    }
    // ✅ Verifica se login já existe
    if (!ehEdicao && BD.usuarios.some(u => u.usuario === login)) {
      alert('❌ Este nome de usuário já está cadastrado!');
      return;
    }

    const dados = { usuario: login, nome, perfil, ativo, veiculosPermitidos };

    if (ehEdicao) {
      // ✅ Usando função genérica do banco
      if (senha) dados.senha = senha;
      atualizarRegistro('usuarios', usuario.id, dados);
    } else {
      // ✅ Usando função genérica do banco
      dados.senha = senha;
      adicionarRegistro('usuarios', dados);
    }

    fecharModal();
    carregarTabelaUsuarios();
    alert('✅ Usuário salvo com sucesso!');
  });
}

// ✅ Carrega e exibe tabela de usuários
function carregarTabelaUsuarios() {
  const corpo = document.getElementById('tabelaUsuarios');
  if (!corpo) return;

  corpo.innerHTML = BD.usuarios.map(u => {
    const perfilLabel = {
      admin: '🔑 Administrador',
      operacional: '🚛 Operacional',
      visitante: '👁️ Visitante'
    }[u.perfil] || u.perfil;

    return `<tr class="border-b hover:bg-slate-50">
      <td class="px-4 py-3 font-mono">${u.usuario}</td>
      <td class="px-4 py-3">${u.nome}</td>
      <td class="px-4 py-3 text-sm">${perfilLabel}</td>
      <td class="px-4 py-3">
        ${u.ativo ? '<span class="text-green-600">✅ Ativo</span>' : '<span class="text-red-500">⛔ Inativo</span>'}
      </td>
      <td class="px-4 py-3">
        <button class="text-blue-600 text-sm" onclick='abrirModalUsuario(${JSON.stringify(u).replace(/'/g, "\\'").replace(/"/g, "&quot;")})'>
          <i class="fa-solid fa-pen"></i> Editar
        </button>
      </td>
    </tr>`;
  }).join('');
}

// ==================================================
// CONFIGURAÇÕES — CADASTRO DE OBRAS / LOCAIS
// ==================================================

// ✅ Cadastra nova obra/local
function cadastrarObra() {
  const nome = document.getElementById('novaObra').value.trim();
  if (!nome) return alert('❌ Digite o nome da obra!');

  if (!BD.obras.includes(nome)) {
    BD.obras.push(nome);
    salvarDados();
    carregarConfiguracoes();
    document.getElementById('novaObra').value = '';
  } else {
    alert('⚠️ Esta obra já está cadastrada!');
  }
}

// ✅ Carrega lista de obras na tela
function carregarConfiguracoes() {
  const lista = document.getElementById('listaObrasCadastradas');
  if (!lista) return;

  lista.innerHTML = BD.obras.map(o => `
    <div class="flex justify-between items-center p-2 bg-slate-50 rounded">
      <span>${o}</span>
      ${!['Base Principal'].includes(o) ?
        `<button class="text-red-500 text-sm" onclick="removerObra('${o}')">Excluir</button>` : ''}
    </div>
  `).join('');
}

// ✅ Remove obra/local
function removerObra(nome) {
  if (confirm(`⚠️ Remover a obra "${nome}"? Veículos alocados nela serão desvinculados.`)) {
    BD.obras = BD.obras.filter(o => o !== nome);
    salvarDados();
    carregarConfiguracoes();
  }
}