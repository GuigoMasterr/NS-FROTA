// ==================================================
// 👥 GESTÃO DE USUÁRIOS - VERSÃO CORRIGIDA
// ==================================================

function carregarTabelaUsuarios() {
    try {
        console.log('👥 Carregando usuários...');
        
        const tabela = document.getElementById('tabelaUsuarios');
        if (!tabela) return;
        
        let usuarios = (typeof BD !== 'undefined' && BD.usuarios) ? [...BD.usuarios] : [];
        
        if (usuarios.length === 0) {
            tabela.innerHTML = '<tr><td colspan="5" class="estado-vazio">Nenhum usuário cadastrado</td></tr>';
            return;
        }
        
        const perfilNome = {
            'admin': 'Administrador',
            'operador': 'Operador',
            'operacional': 'Operacional',
            'motorista': 'Motorista',
            'supervisor': 'Supervisor'
        };
        
        tabela.innerHTML = usuarios.map(u => `
            <tr>
                <td><strong>${u.nome || '-'}</strong></td>
                <td>${u.usuario || '-'}</td>
                <td>${perfilNome[u.perfil] || u.perfil || '-'}</td>
                <td>
                    <span class="badge ${u.ativo !== false ? 'badge-success' : 'badge-secondary'}">
                        ${u.ativo !== false ? '✅ Ativo' : '⏸️ Inativo'}
                    </span>
                </td>
                <td>
                    <button class="btn-mini" onclick="abrirModalUsuarioEditar(${u.id})" title="Editar">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    ${u.usuario !== 'admin' ? `
                    <button class="btn-mini" onclick="excluirUsuario(${u.id})" title="Excluir" style="color:#dc2626;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
        console.log(`✅ ${usuarios.length} usuário(s) carregado(s)`);
        
    } catch (e) {
        console.error('❌ Erro ao carregar usuários:', e);
    }
}

function abrirModalUsuario() {
    try {
        if (typeof ehAdmin === 'function' && !ehAdmin()) {
            if (typeof mostrarToast === 'function') mostrarToast('Sem permissão!', 'erro');
            else alert('❌ Você não tem permissão!');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay aberto';
        modal.id = 'modal-usuario';
        
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 450px;">
                <div class="modal-cabecalho">
                    <h3 class="modal-titulo">➕ Novo Usuário</h3>
                    <button type="button" class="modal-fechar" onclick="fecharModal('modal-usuario')">&times;</button>
                </div>
                <div class="modal-corpo">
                    <form id="formUsuario" class="form-grid">
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label>Nome Completo <span class="obrigatorio">*</span></label>
                            <input type="text" id="uNome" required placeholder="Nome completo">
                        </div>
                        <div class="form-grupo">
                            <label>Usuário <span class="obrigatorio">*</span></label>
                            <input type="text" id="uUsuario" required placeholder="Login">
                        </div>
                        <div class="form-grupo">
                            <label>Senha <span class="obrigatorio">*</span></label>
                            <input type="password" id="uSenha" required minlength="4" placeholder="Mínimo 4 caracteres">
                        </div>
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label>Perfil <span class="obrigatorio">*</span></label>
                            <select id="uPerfil" required>
                                <option value="">Selecione...</option>
                                <option value="admin">👑 Administrador</option>
                                <option value="operacional">👷 Operacional</option>
                                <option value="motorista">🚛 Motorista</option>
                                <option value="operador">🖥️ Operador</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-rodape">
                    <button type="button" class="btn btn-secundario" onclick="fecharModal('modal-usuario')">Cancelar</button>
                    <button type="button" class="btn btn-primario" id="btnSalvarUsuario">💾 Criar Usuário</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('btnSalvarUsuario').addEventListener('click', salvarUsuarioForm);
        document.getElementById('formUsuario').addEventListener('submit', (e) => {
            e.preventDefault();
            salvarUsuarioForm();
        });
        
    } catch (e) {
        console.error('❌ Erro ao abrir modal de usuário:', e);
    }
}

function abrirModalUsuarioEditar(id) {
    try {
        const usuario = (typeof BD !== 'undefined' && BD.usuarios) 
            ? BD.usuarios.find(u => u.id === id) 
            : null;
        
        if (!usuario) return;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay aberto';
        modal.id = 'modal-usuario-edit';
        
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 450px;">
                <div class="modal-cabecalho">
                    <h3 class="modal-titulo">✏️ Editar Usuário</h3>
                    <button type="button" class="modal-fechar" onclick="fecharModal('modal-usuario-edit')">&times;</button>
                </div>
                <div class="modal-corpo">
                    <form id="formUsuarioEdit" class="form-grid">
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label>Nome Completo</label>
                            <input type="text" id="uNome" value="${usuario.nome || ''}">
                        </div>
                        <div class="form-grupo">
                            <label>Usuário (login)</label>
                            <input type="text" id="uUsuario" value="${usuario.usuario || ''}" ${usuario.usuario === 'admin' ? 'disabled' : ''}>
                        </div>
                        <div class="form-grupo">
                            <label>Nova Senha</label>
                            <input type="password" id="uSenha" placeholder="Deixe em branco para manter">
                        </div>
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label>Perfil</label>
                            <select id="uPerfil">
                                <option value="admin" ${usuario.perfil === 'admin' ? 'selected' : ''}>👑 Administrador</option>
                                <option value="operacional" ${usuario.perfil === 'operacional' ? 'selected' : ''}>👷 Operacional</option>
                                <option value="motorista" ${usuario.perfil === 'motorista' ? 'selected' : ''}>🚛 Motorista</option>
                                <option value="operador" ${usuario.perfil === 'operador' ? 'selected' : ''}>🖥️ Operador</option>
                            </select>
                        </div>
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" id="uAtivo" ${usuario.ativo !== false ? 'checked' : ''} style="width:18px;height:18px;">
                                Usuário ativo
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-rodape">
                    <button type="button" class="btn btn-secundario" onclick="fecharModal('modal-usuario-edit')">Cancelar</button>
                    <button type="button" class="btn btn-primario" id="btnSalvarUsuarioEdit">💾 Salvar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('btnSalvarUsuarioEdit').addEventListener('click', () => {
            try {
                usuario.nome = document.getElementById('uNome')?.value.trim() || usuario.nome;
                if (usuario.usuario !== 'admin') {
                    usuario.usuario = document.getElementById('uUsuario')?.value.trim() || usuario.usuario;
                }
                const novaSenha = document.getElementById('uSenha')?.value;
                if (novaSenha && novaSenha.length >= 4) {
                    usuario.senha = novaSenha;
                }
                usuario.perfil = document.getElementById('uPerfil')?.value || usuario.perfil;
                usuario.ativo = document.getElementById('uAtivo')?.checked;
                
                if (typeof salvarDados === 'function') salvarDados();
                window.BD = BD;
                
                fecharModal('modal-usuario-edit');
                carregarTabelaUsuarios();
                
                if (typeof mostrarToast === 'function') mostrarToast('Usuário atualizado!', 'sucesso');
                else alert('✅ Usuário atualizado!');
                
            } catch (e) {
                console.error('❌ Erro ao salvar edição:', e);
            }
        });
        
    } catch (e) {
        console.error('❌ Erro ao abrir edição de usuário:', e);
    }
}

function salvarUsuarioForm() {
    try {
        const nome = document.getElementById('uNome')?.value.trim();
        const usuario = document.getElementById('uUsuario')?.value.trim();
        const senha = document.getElementById('uSenha')?.value;
        const perfil = document.getElementById('uPerfil')?.value;
        
        if (!nome || !usuario || !senha || !perfil) {
            alert('⚠️ Preencha todos os campos obrigatórios!');
            return;
        }
        
        if (senha.length < 4) {
            alert('⚠️ A senha deve ter pelo menos 4 caracteres!');
            return;
        }
        
        const dados = {
            nome: nome,
            usuario: usuario,
            senha: senha,
            perfil: perfil,
            ativo: true
        };
        
        if (typeof salvarUsuario === 'function') {
            salvarUsuario(dados);
        } else if (typeof BD !== 'undefined') {
            if (!BD.usuarios) BD.usuarios = [];
            
            // Verifica se já existe usuário com o mesmo login
            if (BD.usuarios.some(u => u.usuario === usuario)) {
                alert('⚠️ Já existe um usuário com este login!');
                return;
            }
            
            dados.id = BD.usuarios.length > 0 ? Math.max(...BD.usuarios.map(u => u.id || 0)) + 1 : 1;
            BD.usuarios.push(dados);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        fecharModal('modal-usuario');
        carregarTabelaUsuarios();
        
        if (typeof mostrarToast === 'function') mostrarToast('Usuário criado!', 'sucesso');
        else alert('✅ Usuário criado com sucesso!');
        
    } catch (e) {
        console.error('❌ Erro ao salvar usuário:', e);
    }
}

function excluirUsuario(id) {
    try {
        const usuario = BD?.usuarios?.find(u => u.id === id);
        if (!usuario) return;
        
        if (usuario.usuario === 'admin') {
            alert('❌ Não é possível excluir o usuário administrador padrão!');
            return;
        }
        
        if (!confirm(`Tem certeza que deseja excluir o usuário "${usuario.nome}"?`)) return;
        
        if (typeof excluirUsuarioBD === 'function') {
            excluirUsuarioBD(id);
        } else if (typeof BD !== 'undefined' && BD.usuarios) {
            BD.usuarios = BD.usuarios.filter(u => u.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarTabelaUsuarios();
        if (typeof mostrarToast === 'function') mostrarToast('Usuário excluído!', 'sucesso');
        
    } catch (e) {
        console.error('❌ Erro ao excluir usuário:', e);
    }
}

// Expõe funções
window.abrirModalUsuario = abrirModalUsuario;
window.abrirModalUsuarioEditar = abrirModalUsuarioEditar;
window.excluirUsuario = excluirUsuario;
window.carregarTabelaUsuarios = carregarTabelaUsuarios;

console.log('✅ js/usuarios.js inicializado');