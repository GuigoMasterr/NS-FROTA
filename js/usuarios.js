// ==================================================
// 👤 GESTÃO DE USUÁRIOS
// ==================================================

// ✅ Abre modal de cadastro/edição de usuário
function abrirModalUsuario(usuario = null) {
  const ehEdicao = !!usuario;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay aberto';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  
  modal.innerHTML = `
    <div class="modal-container" style="max-width: 500px;">
      <div class="modal-cabecalho">
        <h3 class="modal-titulo">${ehEdicao ? '✏️ Editar' : '➕ Novo'} Usuário</h3>
        <button type="button" class="modal-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-corpo">
        <form id="formUsuario">
          <div class="form-grid">
            <div class="form-grupo">
              <label>Nome Completo <span class="obrigatorio">*</span></label>
              <input type="text" id="uNome" required value="${usuario?.nome || ''}" placeholder="Nome completo">
            </div>
            <div class="form-grupo">
              <label>Usuário <span class="obrigatorio">*</span></label>
              <input type="text" id="uUsuario" required value="${usuario?.usuario || ''}" ${ehEdicao ? 'readonly' : ''} placeholder="Login">
            </div>
            <div class="form-grupo">
              <label>Senha ${ehEdicao ? '(deixe em branco para manter)' : '<span class="obrigatorio">*</span>'}</label>
              <input type="password" id="uSenha" ${ehEdicao ? '' : 'required'} placeholder="Mínimo 6 caracteres">
            </div>
            <div class="form-grupo">
              <label>Perfil <span class="obrigatorio">*</span></label>
              <select id="uPerfil" required>
                <option value="admin" ${usuario?.perfil === 'admin' ? 'selected' : ''}>👑 Administrador</option>
                <option value="operador" ${usuario?.perfil === 'operador' ? 'selected' : ''}>⚙️ Operador</option>
                <option value="operacional" ${usuario?.perfil === 'operacional' ? 'selected' : ''}>🚛 Operacional</option>
                <option value="motorista" ${usuario?.perfil === 'motorista' ? 'selected' : ''}>🧑‍✈️ Motorista</option>
              </select>
            </div>
            <div class="form-grupo">
              <label>Status</label>
              <select id="uAtivo">
                <option value="true" ${usuario?.ativo !== false ? 'selected' : ''}>✅ Ativo</option>
                <option value="false" ${usuario?.ativo === false ? 'selected' : ''}>⛔ Inativo</option>
              </select>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-rodape">
        <button type="button" class="btn btn-secundario" onclick="fecharModal()">Cancelar</button>
        <button type="button" class="btn btn-primario" id="btnSalvarUsuario">💾 Salvar</button>
      </div>
    </div>
  `;
  
  document.getElementById('modais').appendChild(modal);
  
  document.getElementById('btnSalvarUsuario').addEventListener('click', async () => {
    const nome = document.getElementById('uNome').value.trim();
    const usuarioLogin = document.getElementById('uUsuario').value.trim();
    const senha = document.getElementById('uSenha').value;
    const perfil = document.getElementById('uPerfil').value;
    const ativo = document.getElementById('uAtivo').value === 'true';
    
    if (!nome || !usuarioLogin) {
      alert('❌ Preencha nome e usuário!');
      return;
    }
    
    if (!ehEdicao && senha.length < 6) {
      alert('❌ Senha deve ter pelo menos 6 caracteres!');
      return;
    }
    
    if (ehEdicao && senha && senha.length < 6) {
      alert('❌ Senha deve ter pelo menos 6 caracteres!');
      return;
    }
    
    // Verifica usuário duplicado
    if (!ehEdicao) {
      const existe = BD.usuarios?.find(u => u.usuario === usuarioLogin);
      if (existe) {
        alert('❌ Já existe um usuário com este login!');
        return;
      }
    }
    
    const dados = {
      nome,
      usuario: usuarioLogin,
      perfil,
      ativo
    };
    
    if (ehEdicao) {
      dados.id = usuario.id;
      if (senha) dados.senha = senha;
      else dados.senha = usuario.senha; // Mantém senha atual
    } else {
      dados.senha = senha;
    }
    
    const resultado = await salvarUsuario(dados);
    if (resultado) {
      alert('✅ Usuário salvo com sucesso!');
      fecharModal();
      carregarTabelaUsuarios();
    } else {
      alert('❌ Erro ao salvar usuário!');
    }
  });
}

// ✅ Carrega tabela de usuários
function carregarTabelaUsuarios() {
  const corpo = document.getElementById('tabelaUsuarios');
  if (!corpo) return;
  
  const usuarios = BD.usuarios || [];
  
  if (!usuarios.length) {
    corpo.innerHTML = `<tr><td colspan="5" class="estado-vazio">
      <div class="estado-vazio-icone">👥</div>
      <div class="estado-vazio-texto">Nenhum usuário cadastrado</div>
    </td></tr>`;
    return;
  }
  
  const perfilMap = {
    admin: '<span class="badge badge-danger">👑 Admin</span>',
    operador: '<span class="badge badge-info">⚙️ Operador</span>',
    operacional: '<span class="badge badge-warning">🚛 Operacional</span>',
    motorista: '<span class="badge badge-secondary">🧑‍✈️ Motorista</span>'
  };
  
  corpo.innerHTML = usuarios.map(u => {
    return `<tr>
      <td><strong>${u.nome}</strong></td>
      <td class="font-mono">${u.usuario}</td>
      <td>${perfilMap[u.perfil] || u.perfil || '<span class="badge badge-secondary">—</span>'}</td>
      <td>${u.ativo !== false ? '<span class="badge badge-success">✅ Ativo</span>' : '<span class="badge badge-danger">⛔ Inativo</span>'}</td>
      <td>
        <button class="btn btn-sm" style="background:#fef3c7; color:#92400e; margin-right:0.25rem;" onclick='abrirModalUsuario(${JSON.stringify(u).replace(/"/g, '&quot;')})'>
          <i class="fa-solid fa-pen"></i>
        </button>
        ${u.usuario !== 'admin' ? `<button class="btn btn-sm" style="background:#fee2e2; color:#991b1b;" onclick="excluirUsuario('${u.id}')">
          <i class="fa-solid fa-trash"></i>
        </button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

// ✅ Excluir usuário
async function excluirUsuario(id) {
  if (!confirm('⚠️ Tem certeza que deseja excluir este usuário?')) return;
  
  // Remove diretamente do BD (evita conflito de nome com a função do banco-dados)
  BD.usuarios = (BD.usuarios || []).filter(u => String(u.id) !== String(id));
  
  // Salva no armazenamento
  if (typeof salvarDados === 'function') salvarDados();
  else localStorage.setItem('bd_frotas', JSON.stringify(BD));
  
  alert('✅ Usuário excluído!');
  carregarTabelaUsuarios();
}

// ==================================================
// ✅ DISPONIBILIZA GLOBALMENTE
// ==================================================
window.abrirModalUsuario = abrirModalUsuario;
window.carregarTabelaUsuarios = carregarTabelaUsuarios;
window.excluirUsuario = excluirUsuario;