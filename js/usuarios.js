// ==================================================
// 👥 USUÁRIOS - VERSÃO CORRIGIDA
// ✅ Modal funcionando
// ==================================================

function carregarTabelaUsuarios() {
    try {
        const tabela = document.getElementById('tabelaUsuarios');
        if (!tabela) return;
        
        let usuarios = (typeof BD !== 'undefined' && BD.usuarios) ? [...BD.usuarios] : [];
        
        if (usuarios.length === 0) {
            tabela.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:#64748b;">Nenhum usuário cadastrado</td></tr>';
            return;
        }
        
        const perfilCor = { 'admin': '#7c3aed', 'operacional': '#3b82f6', 'motorista': '#10b981', 'visitante': '#6b7280' };
        
        tabela.innerHTML = usuarios.map(u => {
            const isAdminAtual = u.usuario === 'admin';
            return '<tr>' +
                '<td><strong>' + (u.nome || '-') + '</strong></td>' +
                '<td>' + (u.usuario || '-') + '</td>' +
                '<td><span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;color:white;background:' + (perfilCor[u.perfil] || '#6b7280') + '">' + (u.perfil || '-') + '</span></td>' +
                '<td>' + (u.ativo === false ? '❌ Inativo' : '✅ Ativo') + '</td>' +
                '<td>' +
                    (!isAdminAtual ? '<button onclick="abrirModalUsuario(\'' + u.usuario + '\')" style="padding:6px 10px;border:none;background:#3b82f6;color:white;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px;">✏️ Editar</button>' +
                    '<button onclick="excluirUsuario(\'' + u.usuario + '\')" style="padding:6px 10px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:12px;">🗑️</button>' 
                    : '<span style="color:#9ca3af;font-size:12px;">Protegido</span>') +
                '</td>' +
                '</tr>';
        }).join('');
        
    } catch (e) { console.error('❌ Erro carregar usuarios:', e); }
}

function abrirModalUsuario(usuarioEditar) {
    console.log('📝 abrirModalUsuario chamado:', usuarioEditar || 'novo');
    
    if (typeof ehAdmin === 'function' && !ehAdmin()) {
        alert('⚠️ Apenas administradores podem gerenciar usuários!');
        return;
    }
    
    const antigo = document.getElementById('modal-usuario-final');
    if (antigo) antigo.remove();
    
    const usuario = usuarioEditar && BD.usuarios ? BD.usuarios.find(u => u.usuario === usuarioEditar) : null;
    const isEdit = !!usuario;
    
    const fundo = document.createElement('div');
    fundo.id = 'modal-usuario-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
    
    const caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:450px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    const cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#7c3aed;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    cabecalho.innerHTML = '<h3 style="margin:0;font-size:18px;">' + (isEdit ? '✏️ Editar Usuário' : '👤 Novo Usuário') + '</h3>';
    const btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    const corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    const form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
    form.onsubmit = function(e) { e.preventDefault(); salvarUsuarioForm(usuarioEditar); };
    
    function addCampo(label, tipo, id, valor, obrigatorio, opcoes) {
        const grupo = document.createElement('div');
        grupo.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        const lbl = document.createElement('label');
        lbl.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
        lbl.innerHTML = label + (obrigatorio ? ' <span style="color:#dc2626;">*</span>' : '');
        grupo.appendChild(lbl);
        let input;
        if (opcoes) {
            input = document.createElement('select');
            input.innerHTML = '<option value="">Selecione...</option>' + opcoes.map(o => '<option value="' + o.valor + '"' + (o.valor === valor ? ' selected' : '') + '>' + o.texto + '</option>').join('');
        } else {
            input = document.createElement('input');
            input.type = tipo;
            input.value = valor || '';
        }
        input.id = id;
        if (obrigatorio && !isEdit) input.required = true;
        input.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;background:white;';
        grupo.appendChild(input);
        return grupo;
    }
    
    const perfis = [
        { valor: 'admin', texto: '👑 Administrador' },
        { valor: 'operacional', texto: '⚙️ Operacional' },
        { valor: 'motorista', texto: '🚛 Motorista' },
        { valor: 'visitante', texto: '👁️ Visitante' }
    ];
    
    form.appendChild(addCampo('Nome Completo', 'text', 'uNome', usuario?.nome, true));
    
    if (!isEdit) {
        form.appendChild(addCampo('Usuário (login)', 'text', 'uUsuario', usuario?.usuario, true));
        form.appendChild(addCampo('Senha', 'password', 'uSenha', '', true));
    } else {
        form.appendChild(addCampo('Usuário (login)', 'text', 'uUsuario', usuario?.usuario, true));
        const grupoSenha = document.createElement('div');
        grupoSenha.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        const lblSenha = document.createElement('label');
        lblSenha.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
        lblSenha.textContent = 'Nova Senha (deixe em branco para manter)';
        grupoSenha.appendChild(lblSenha);
        const inpSenha = document.createElement('input');
        inpSenha.type = 'password';
        inpSenha.id = 'uSenha';
        inpSenha.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;background:white;';
        grupoSenha.appendChild(inpSenha);
        form.appendChild(grupoSenha);
        
        // Desabilita edição do usuário admin
        if (usuarioEditar === 'admin') {
            document.addEventListener('DOMContentLoaded', function() {
                const el = document.getElementById('uUsuario');
                if (el) el.disabled = true;
            });
        }
    }
    
    form.appendChild(addCampo('Perfil', 'text', 'uPerfil', usuario?.perfil, true, perfis));
    
    // Ativo
    if (isEdit && usuarioEditar !== 'admin') {
        const grupoAtivo = document.createElement('div');
        grupoAtivo.style.cssText = 'display:flex;align-items:center;gap:10px;';
        const checkAtivo = document.createElement('input');
        checkAtivo.type = 'checkbox';
        checkAtivo.id = 'uAtivo';
        checkAtivo.checked = usuario.ativo !== false;
        checkAtivo.style.cssText = 'width:18px;height:18px;cursor:pointer;';
        const lblAtivo = document.createElement('label');
        lblAtivo.style.cssText = 'font-size:14px;color:#374151;cursor:pointer;';
        lblAtivo.textContent = 'Usuário ativo';
        lblAtivo.onclick = function() { checkAtivo.checked = !checkAtivo.checked; };
        grupoAtivo.appendChild(checkAtivo);
        grupoAtivo.appendChild(lblAtivo);
        form.appendChild(grupoAtivo);
    }
    
    const rodape = document.createElement('div');
    rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:10px;';
    const btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    btnCancelar.onclick = function() { fundo.remove(); };
    const btnSalvar = document.createElement('button');
    btnSalvar.type = 'submit';
    btnSalvar.textContent = '💾 Salvar';
    btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#7c3aed;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    form.appendChild(rodape);
    
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    
    // Desabilita usuário admin se for edição
    if (isEdit && usuarioEditar === 'admin') {
        setTimeout(function() {
            const el = document.getElementById('uUsuario');
            if (el) el.disabled = true;
        }, 50);
    }
    
    console.log('✅ Modal usuário aberto!');
}

function salvarUsuarioForm(usuarioEditar) {
    try {
        const nome = document.getElementById('uNome')?.value.trim();
        const usuario = document.getElementById('uUsuario')?.value.trim();
        const senha = document.getElementById('uSenha')?.value;
        const perfil = document.getElementById('uPerfil')?.value;
        
        if (!nome || !usuario || !perfil) {
            alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        if (!usuarioEditar && !senha) {
            alert('⚠️ Informe uma senha!');
            return;
        }
        
        if (typeof BD === 'undefined') BD = { usuarios: [] };
        if (!BD.usuarios) BD.usuarios = [];
        
        if (usuarioEditar) {
            const u = BD.usuarios.find(x => x.usuario === usuarioEditar);
            if (u) {
                u.nome = nome;
                u.usuario = usuario;
                u.perfil = perfil;
                if (senha) u.senha = senha;
                const ativoEl = document.getElementById('uAtivo');
                if (ativoEl && usuarioEditar !== 'admin') u.ativo = ativoEl.checked;
            }
        } else {
            if (BD.usuarios.find(x => x.usuario === usuario)) {
                alert('⚠️ Já existe um usuário com este login!');
                return;
            }
            BD.usuarios.push({
                nome: nome,
                usuario: usuario,
                senha: senha,
                perfil: perfil,
                ativo: true,
                dataCadastro: new Date().toISOString().split('T')[0]
            });
        }
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        document.getElementById('modal-usuario-final')?.remove();
        carregarTabelaUsuarios();
        
        if (typeof mostrarToast === 'function') mostrarToast(usuarioEditar ? 'Usuário atualizado!' : 'Usuário cadastrado!', 'sucesso');
        else alert('✅ ' + (usuarioEditar ? 'Usuário atualizado!' : 'Usuário cadastrado!'));
        
    } catch (e) {
        console.error('❌ Erro:', e);
        alert('❌ Erro ao salvar');
    }
}

function excluirUsuario(usuarioLogin) {
    try {
        if (usuarioLogin === 'admin') {
            alert('⚠️ O usuário admin não pode ser excluído!');
            return;
        }
        if (!confirm('Excluir este usuário?')) return;
        
        if (typeof BD !== 'undefined' && BD.usuarios) {
            BD.usuarios = BD.usuarios.filter(u => u.usuario !== usuarioLogin);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        carregarTabelaUsuarios();
    } catch (e) { console.error(e); }
}

window.carregarTabelaUsuarios = carregarTabelaUsuarios;
window.abrirModalUsuario = abrirModalUsuario;
window.excluirUsuario = excluirUsuario;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ usuarios.js inicializado');
    });
}