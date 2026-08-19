// ==================================================
// 👥 USUÁRIOS - VERSÃO COMPLETA
// ✅ CPF, Telefone, Dados da CNH + Alerta de vencimento
// ==================================================

// ==================================================
// 🔧 UTILITÁRIOS - MÁSCARAS E VALIDAÇÕES
// ==================================================
function formatarCPF(cpf) {
    if (!cpf) return '';
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length <= 11) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
}

function formatarTelefone(tel) {
    if (!tel) return '';
    tel = tel.replace(/\D/g, '');
    if (tel.length === 11) {
        return tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (tel.length === 10) {
        return tel.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return tel;
}

function aplicarMascaraCPF(input) {
    input.addEventListener('input', function() {
        var v = this.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        this.value = formatarCPF(v);
    });
}

function aplicarMascaraTelefone(input) {
    input.addEventListener('input', function() {
        var v = this.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        this.value = formatarTelefone(v);
    });
}

function statusCNH(dataValidade) {
    if (!dataValidade) return { texto: 'Não informada', cor: '#6b7280', classe: 'neutra', dias: null, vencida: false };
    
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    var venc = new Date(dataValidade);
    venc.setHours(0, 0, 0, 0);
    
    var diffMs = venc - hoje;
    var diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDias < 0) {
        return { texto: '🔴 VENCIDA', cor: '#dc2626', classe: 'vencida', dias: diffDias, vencida: true };
    } else if (diffDias <= 30) {
        return { texto: '🟡 Vence em ' + diffDias + 'd', cor: '#f59e0b', classe: 'alerta', dias: diffDias, vencida: false };
    }
    return { texto: '🟢 Válida', cor: '#10b981', classe: 'ok', dias: diffDias, vencida: false };
}

function verificarAlertasCNH() {
    try {
        if (!BD.usuarios) return;
        
        var cnhVencidas = [];
        var cnhAlertas = [];
        
        for (var i = 0; i < BD.usuarios.length; i++) {
            var u = BD.usuarios[i];
            if (u.dataValidadeCNH) {
                var status = statusCNH(u.dataValidadeCNH);
                if (status.vencida) {
                    cnhVencidas.push(u.nome + ' (' + u.dataValidadeCNH + ')');
                } else if (status.dias !== null && status.dias <= 30) {
                    cnhAlertas.push(u.nome + ' (vence em ' + status.dias + ' dias)');
                }
            }
        }
        
        if (cnhVencidas.length > 0) {
            console.warn('⚠️ CNH VENCIDAS:', cnhVencidas);
        }
        if (cnhAlertas.length > 0) {
            console.log('ℹ️ CNH a vencer:', cnhAlertas);
        }
        
    } catch (e) { console.error(e); }
}

// ==================================================
// 📊 CARREGAR TABELA DE USUÁRIOS
// ==================================================
function carregarTabelaUsuarios() {
    try {
        const tabela = document.getElementById('tabelaUsuarios');
        if (!tabela) return;
        
        let usuarios = (typeof BD !== 'undefined' && BD.usuarios) ? [...BD.usuarios] : [];
        
        if (usuarios.length === 0) {
            tabela.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#64748b;">Nenhum usuário cadastrado</td></tr>';
            return;
        }
        
        const perfilCor = { 'admin': '#7c3aed', 'operacional': '#3b82f6', 'motorista': '#10b981', 'visitante': '#6b7280' };
        
        tabela.innerHTML = usuarios.map(u => {
            const isAdminAtual = u.usuario === 'admin';
            const statusCnh = statusCNH(u.dataValidadeCNH);
            
            return '<tr>' +
                '<td><strong>' + (u.nome || '-') + '</strong></td>' +
                '<td>' + (u.usuario || '-') + '</td>' +
                '<td><span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;color:white;background:' + (perfilCor[u.perfil] || '#6b7280') + '">' + (u.perfil || '-') + '</span></td>' +
                '<td>' + (u.cpf ? formatarCPF(u.cpf) : '-') + '</td>' +
                '<td>' + (u.telefone ? formatarTelefone(u.telefone) : '-') + '</td>' +
                '<td>' + (u.numeroCNH || '-') + (u.categoriaCNH ? ' <span style="font-size:11px;color:#64748b;">(' + u.categoriaCNH + ')</span>' : '') + '</td>' +
                '<td>' + (u.dataValidadeCNH 
                    ? '<span style="font-weight:600;color:' + statusCnh.cor + ';">' + statusCnh.texto + '</span><br><span style="font-size:11px;color:#64748b;">' + u.dataValidadeCNH + '</span>'
                    : '<span style="color:#9ca3af;">-</span>') + '</td>' +
                '<td>' + (u.ativo === false ? '❌ Inativo' : '✅ Ativo') + '</td>' +
                '<td style="white-space:nowrap;">' +
                    (!isAdminAtual ? '<button onclick="abrirModalUsuario(\'' + u.usuario + '\')" style="padding:6px 10px;border:none;background:#3b82f6;color:white;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px;">✏️ Editar</button>' +
                    '<button onclick="excluirUsuario(\'' + u.usuario + '\')" style="padding:6px 10px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:12px;">🗑️</button>' 
                    : '<span style="color:#9ca3af;font-size:12px;">Protegido</span>') +
                '</td>' +
                '</tr>';
        }).join('');
        
        // Verifica alertas de CNH
        verificarAlertasCNH();
        
    } catch (e) { console.error('❌ Erro carregar usuarios:', e); }
}

// ==================================================
// 📝 MODAL DE USUÁRIO
// ==================================================
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
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:600px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
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
    
    function addCampo(label, tipo, id, valor, obrigatorio, opcoes, placeholder) {
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
            if (placeholder) input.placeholder = placeholder;
        }
        input.id = id;
        if (obrigatorio && !isEdit) input.required = true;
        input.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;background:white;';
        grupo.appendChild(input);
        return { grupo: grupo, input: input };
    }
    
    const perfis = [
        { valor: 'admin', texto: '👑 Administrador' },
        { valor: 'operacional', texto: '⚙️ Operacional' },
        { valor: 'motorista', texto: '🚛 Motorista' },
        { valor: 'visitante', texto: '👁️ Visitante' }
    ];
    
    const categoriasCNH = [
        { valor: 'A', texto: 'A - Motos' },
        { valor: 'B', texto: 'B - Carros leves' },
        { valor: 'C', texto: 'C - Caminhões' },
        { valor: 'D', texto: 'D - Ônibus/Vans' },
        { valor: 'E', texto: 'E - Cargas pesadas' },
        { valor: 'AB', texto: 'AB - A + B' },
        { valor: 'AC', texto: 'AC - A + C' },
        { valor: 'AD', texto: 'AD - A + D' },
        { valor: 'AE', texto: 'AE - A + E' }
    ];
    
    // ==========================================
    // DADOS BÁSICOS
    // ==========================================
    var secaoDados = document.createElement('div');
    secaoDados.style.cssText = 'padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;';
    secaoDados.innerHTML = '<div style="font-weight:600;color:#1e293b;margin-bottom:12px;font-size:14px;">📋 Dados Básicos</div>';
    var gridDados = document.createElement('div');
    gridDados.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:14px;';
    
    var campoNome = addCampo('Nome Completo', 'text', 'uNome', usuario?.nome, true);
    gridDados.appendChild(campoNome.grupo);
    
    var campoUsuario = addCampo('Usuário (login)', 'text', 'uUsuario', usuario?.usuario, true);
    gridDados.appendChild(campoUsuario.grupo);
    
    if (!isEdit) {
        var campoSenha = addCampo('Senha', 'password', 'uSenha', '', true);
        gridDados.appendChild(campoSenha.grupo);
    }
    
    var campoPerfil = addCampo('Perfil', 'text', 'uPerfil', usuario?.perfil, true, perfis);
    gridDados.appendChild(campoPerfil.grupo);
    
    var campoCPF = addCampo('CPF', 'text', 'uCpf', usuario?.cpf ? formatarCPF(usuario.cpf) : '', false, null, '000.000.000-00');
    aplicarMascaraCPF(campoCPF.input);
    gridDados.appendChild(campoCPF.grupo);
    
    var campoTelefone = addCampo('Telefone', 'text', 'uTelefone', usuario?.telefone ? formatarTelefone(usuario.telefone) : '', false, null, '(00) 00000-0000');
    aplicarMascaraTelefone(campoTelefone.input);
    gridDados.appendChild(campoTelefone.grupo);
    
    secaoDados.appendChild(gridDados);
    
    if (isEdit) {
        var grupoSenha = document.createElement('div');
        grupoSenha.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-top:14px;';
        var lblSenha = document.createElement('label');
        lblSenha.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
        lblSenha.textContent = 'Nova Senha (deixe em branco para manter)';
        grupoSenha.appendChild(lblSenha);
        var inpSenha = document.createElement('input');
        inpSenha.type = 'password';
        inpSenha.id = 'uSenha';
        inpSenha.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;background:white;';
        grupoSenha.appendChild(inpSenha);
        secaoDados.appendChild(grupoSenha);
        
        if (usuarioEditar !== 'admin') {
            var grupoAtivo = document.createElement('div');
            grupoAtivo.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:14px;';
            var checkAtivo = document.createElement('input');
            checkAtivo.type = 'checkbox';
            checkAtivo.id = 'uAtivo';
            checkAtivo.checked = usuario.ativo !== false;
            checkAtivo.style.cssText = 'width:18px;height:18px;cursor:pointer;';
            var lblAtivo = document.createElement('label');
            lblAtivo.style.cssText = 'font-size:14px;color:#374151;cursor:pointer;';
            lblAtivo.textContent = '✅ Usuário ativo';
            lblAtivo.onclick = function() { checkAtivo.checked = !checkAtivo.checked; };
            grupoAtivo.appendChild(checkAtivo);
            grupoAtivo.appendChild(lblAtivo);
            secaoDados.appendChild(grupoAtivo);
        }
    }
    
    form.appendChild(secaoDados);
    
    // ==========================================
    // DADOS DA CNH
    // ==========================================
    var secaoCNH = document.createElement('div');
    secaoCNH.style.cssText = 'padding:14px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;margin-top:4px;';
    secaoCNH.innerHTML = '<div style="font-weight:600;color:#1e40af;margin-bottom:12px;font-size:14px;">🚛 Dados da CNH <span style="font-size:11px;font-weight:normal;color:#64748b;">(recomendado para motoristas)</span></div>';
    
    // Alerta de CNH vencida
    var alertaCNH = document.createElement('div');
    alertaCNH.id = 'alertaCNHModal';
    alertaCNH.style.cssText = 'display:none;padding:10px 14px;border-radius:6px;margin-bottom:12px;font-size:13px;font-weight:500;';
    secaoCNH.appendChild(alertaCNH);
    
    var gridCNH = document.createElement('div');
    gridCNH.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:14px;';
    
    var campoNumCNH = addCampo('Número da CNH', 'text', 'uNumeroCNH', usuario?.numeroCNH, false, null, '00000000000');
    gridCNH.appendChild(campoNumCNH.grupo);
    
    var campoRegCNH = addCampo('Nº Registro CNH', 'text', 'uRegistroCNH', usuario?.registroCNH, false, null, 'Número de registro');
    gridCNH.appendChild(campoRegCNH.grupo);
    
    var campoCatCNH = addCampo('Categoria CNH', 'text', 'uCategoriaCNH', usuario?.categoriaCNH, false, categoriasCNH);
    gridCNH.appendChild(campoCatCNH.grupo);
    
    var campoValCNH = addCampo('Validade da CNH', 'date', 'uDataValidadeCNH', usuario?.dataValidadeCNH, false);
    gridCNH.appendChild(campoValCNH.grupo);
    
    // Listener para atualizar alerta de validade
    campoValCNH.input.addEventListener('change', function() {
        atualizarAlertaCNHModal(this.value);
    });
    
    function atualizarAlertaCNHModal(data) {
        if (!data) {
            alertaCNH.style.display = 'none';
            return;
        }
        var status = statusCNH(data);
        if (status.vencida) {
            alertaCNH.style.display = 'block';
            alertaCNH.style.background = '#fee2e2';
            alertaCNH.style.color = '#991b1b';
            alertaCNH.style.border = '1px solid #fecaca';
            alertaCNH.innerHTML = '🔴 <strong>ATENÇÃO:</strong> Esta CNH está VENCIDA desde ' + data + '!';
        } else if (status.dias !== null && status.dias <= 30) {
            alertaCNH.style.display = 'block';
            alertaCNH.style.background = '#fef3c7';
            alertaCNH.style.color = '#92400e';
            alertaCNH.style.border = '1px solid #fde68a';
            alertaCNH.innerHTML = '🟡 <strong>AVISO:</strong> CNH vence em ' + status.dias + ' dias!';
        } else {
            alertaCNH.style.display = 'none';
        }
    }
    
    // Atualiza alerta inicial se for edição
    if (usuario?.dataValidadeCNH) {
        atualizarAlertaCNHModal(usuario.dataValidadeCNH);
    }
    
    secaoCNH.appendChild(gridCNH);
    form.appendChild(secaoCNH);
    
    // ==========================================
    // BOTÕES
    // ==========================================
    const rodape = document.createElement('div');
    rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:10px;';
    const btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;color:#374151;';
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

// ==================================================
// 💾 SALVAR USUÁRIO
// ==================================================
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
        
        // Verifica CNH vencida e avisa
        var dataValCNH = document.getElementById('uDataValidadeCNH')?.value;
        if (dataValCNH) {
            var status = statusCNH(dataValCNH);
            if (status.vencida) {
                if (!confirm('⚠️ ATENÇÃO: A CNH deste usuário está VENCIDA!\n\nDeseja salvar mesmo assim?')) {
                    return;
                }
            } else if (status.dias !== null && status.dias <= 30) {
                if (!confirm('ℹ️ AVISO: A CNH deste usuário vence em ' + status.dias + ' dias.\n\nDeseja salvar mesmo assim?')) {
                    return;
                }
            }
        }
        
        // Limpa máscaras antes de salvar
        var cpfLimpo = document.getElementById('uCpf')?.value.replace(/\D/g, '') || '';
        var telLimpo = document.getElementById('uTelefone')?.value.replace(/\D/g, '') || '';
        
        if (typeof BD === 'undefined') BD = { usuarios: [] };
        if (!BD.usuarios) BD.usuarios = [];
        
        if (usuarioEditar) {
            const u = BD.usuarios.find(x => x.usuario === usuarioEditar);
            if (u) {
                u.nome = nome;
                u.usuario = usuario;
                u.perfil = perfil;
                if (senha) u.senha = senha;
                
                // Novos campos
                u.cpf = cpfLimpo;
                u.telefone = telLimpo;
                u.numeroCNH = document.getElementById('uNumeroCNH')?.value.trim() || '';
                u.registroCNH = document.getElementById('uRegistroCNH')?.value.trim() || '';
                u.categoriaCNH = document.getElementById('uCategoriaCNH')?.value || '';
                u.dataValidadeCNH = dataValCNH || '';
                
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
                cpf: cpfLimpo,
                telefone: telLimpo,
                numeroCNH: document.getElementById('uNumeroCNH')?.value.trim() || '',
                registroCNH: document.getElementById('uRegistroCNH')?.value.trim() || '',
                categoriaCNH: document.getElementById('uCategoriaCNH')?.value || '',
                dataValidadeCNH: dataValCNH || ''
                // 🔄 CORRIGIDO (rodada 5, 19/08/2026): este objeto incluía
                // "dataCadastro", mas a tabela "usuarios" no Supabase NUNCA
                // teve essa coluna (ela existe só na tabela de documentos,
                // criar-tabela-documentos.sql). O Supabase rejeitava o
                // INSERT inteiro com "Could not find the 'datacadastro'
                // column of 'usuarios' in the schema cache" — por isso
                // nenhum usuário novo ia para o banco. O campo nunca era
                // lido/exibido em nenhum lugar do sistema, então foi
                // removido em vez de criar a coluna no banco.
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

// ==================================================
// 🗑️ EXCLUIR USUÁRIO
// ==================================================
async function excluirUsuario(usuarioLogin) {
    try {
        if (usuarioLogin === 'admin') {
            alert('⚠️ O usuário admin não pode ser excluído!');
            return;
        }
        if (!confirm('Excluir este usuário?')) return;
        
        if (typeof BD !== 'undefined' && BD.usuarios) {
            // 🔍 Busca o ID do usuário antes de apagar
            const usuarioParaExcluir = BD.usuarios.find(u => u.usuario === usuarioLogin);
            const usuarioId = usuarioParaExcluir ? usuarioParaExcluir.id : null;
            
            // 🗑️ PRIMEIRO: Tenta apagar do SUPABASE
            let supabaseOk = true;
            if (usuarioId && typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto()) {
                    const resultado = await excluirDoSupabase('usuarios', usuarioId);
                    supabaseOk = resultado.sucesso;
                    if (!supabaseOk) {
                        console.error('❌ Erro ao apagar do Supabase:', resultado.erro);
                        alert('❌ Não foi possível apagar do Supabase. Tente novamente.');
                        return; // NÃO apaga do localStorage se falhar no Supabase!
                    }
                }
            }
            
            // 🗑️ DEPOIS: Apaga do localStorage (só se deu certo no Supabase, ou se está offline)
            BD.usuarios = BD.usuarios.filter(u => u.usuario !== usuarioLogin);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
            
            console.log('✅ Usuário excluído com sucesso!');
        }
        carregarTabelaUsuarios();
    } catch (e) { 
        console.error(e); 
        alert('❌ Erro ao excluir: ' + e.message);
    }
}

// ==================================================
// 📤 EXPORTA FUNÇÕES
// ==================================================
window.carregarTabelaUsuarios = carregarTabelaUsuarios;
window.abrirModalUsuario = abrirModalUsuario;
window.excluirUsuario = excluirUsuario;
window.formatarCPF = formatarCPF;
window.formatarTelefone = formatarTelefone;
window.statusCNH = statusCNH;
window.verificarAlertasCNH = verificarAlertasCNH;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ usuarios.js inicializado');
        setTimeout(verificarAlertasCNH, 1000);
    });
} else {
    console.log('✅ usuarios.js inicializado');
    setTimeout(verificarAlertasCNH, 1000);
}
