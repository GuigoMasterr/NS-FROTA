// ==================================================
// ⛽ GASTOS - VERSÃO COMPLETA
// ✅ Admin: todos os tipos de gasto + cadastrar pontos de abastecimento
// ✅ Motorista: apenas combustível (ponto de abastecimento, tipo, litros, valor)
// ✅ KM e Horímetro condicionais por veículo
// ==================================================

// ==================================================
// 📍 PONTOS DE ABASTECIMENTO
// ==================================================
function inicializarPontosAbastecimento() {
    if (typeof BD === 'undefined') BD = {};
    if (!BD.pontosAbastecimento) {
        BD.pontosAbastecimento = [
            { id: 1, nome: 'Posto Shell - Centro', endereco: 'Av. Principal, 100' },
            { id: 2, nome: 'Posto Ipiranga - Rodovia', endereco: 'BR-101, Km 50' },
            { id: 3, nome: 'Posto Petrobras - Obra', endereco: 'Acesso Obra, S/N' }
        ];
    }
}

function abrirModalPontosAbastecimento() {
    try {
        inicializarPontosAbastecimento();
        
        if (typeof ehAdmin === 'function' && !ehAdmin()) {
            alert('Apenas administradores podem gerenciar pontos de abastecimento!');
            return;
        }
        
        const antigo = document.getElementById('modal-pontos-abastecimento');
        if (antigo) antigo.remove();
        
        const fundo = document.createElement('div');
        fundo.id = 'modal-pontos-abastecimento';
        fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
        fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
        
        const caixa = document.createElement('div');
        caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:550px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
        
        caixa.innerHTML = 
            '<div style="padding:16px 24px;background:#0ea5e9;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;">' +
                '<h3 style="margin:0;font-size:18px;">⛽ Pontos de Abastecimento</h3>' +
                '<button onclick="document.getElementById(\'modal-pontos-abastecimento\').remove()" style="background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;">×</button>' +
            '</div>' +
            '<div style="padding:24px;">' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">' +
                    '<input type="text" id="novoPontoNome" placeholder="Nome do posto *" style="padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">' +
                    '<input type="text" id="novoPontoEndereco" placeholder="Endereço (opcional)" style="padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;">' +
                '</div>' +
                '<div style="text-align:right;margin-bottom:20px;">' +
                    '<button onclick="adicionarPontoAbastecimento()" style="padding:8px 16px;border:none;background:#0ea5e9;color:white;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;">➕ Adicionar Ponto</button>' +
                '</div>' +
                '<div id="listaPontosAbastecimento" style="display:flex;flex-direction:column;gap:8px;"></div>' +
            '</div>';
        
        document.body.appendChild(fundo);
        fundo.appendChild(caixa);
        
        renderizarListaPontos();
        
    } catch (e) {
        console.error('Erro:', e);
    }
}

function adicionarPontoAbastecimento() {
    try {
        const nome = document.getElementById('novoPontoNome')?.value.trim();
        const endereco = document.getElementById('novoPontoEndereco')?.value.trim();
        
        if (!nome) {
            alert('Informe o nome do posto!');
            return;
        }
        
        inicializarPontosAbastecimento();
        BD.pontosAbastecimento.push({
            id: Date.now(),
            nome: nome,
            endereco: endereco || ''
        });
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('pontosAbastecimento', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar pontosAbastecimento do Supabase:', r.erro);
                    });
                }
            }
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('gastos', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar gastos do Supabase:', r.erro);
                    });
                }
            }
        
        document.getElementById('novoPontoNome').value = '';
        document.getElementById('novoPontoEndereco').value = '';
        
        renderizarListaPontos();
        
        if (typeof mostrarToast === 'function') mostrarToast('Ponto adicionado!', 'sucesso');
    } catch (e) { console.error(e); }
}

function excluirPontoAbastecimento(id) {
    if (!confirm('Excluir este ponto de abastecimento?')) return;
    BD.pontosAbastecimento = BD.pontosAbastecimento.filter(p => p.id !== id);
    if (typeof salvarDados === 'function') salvarDados();
    window.BD = BD;
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('pontosAbastecimento', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar pontosAbastecimento do Supabase:', r.erro);
                    });
                }
            }
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('gastos', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar gastos do Supabase:', r.erro);
                    });
                }
            }
    renderizarListaPontos();
}

function renderizarListaPontos() {
    const container = document.getElementById('listaPontosAbastecimento');
    if (!container) return;
    
    inicializarPontosAbastecimento();
    
    if (BD.pontosAbastecimento.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;">Nenhum ponto cadastrado</div>';
        return;
    }
    
    container.innerHTML = BD.pontosAbastecimento.map(p => 
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">' +
            '<div>' +
                '<div style="font-weight:600;color:#1e293b;font-size:14px;">⛽ ' + p.nome + '</div>' +
                (p.endereco ? '<div style="font-size:12px;color:#64748b;">' + p.endereco + '</div>' : '') +
            '</div>' +
            '<button onclick="excluirPontoAbastecimento(' + p.id + ')" style="padding:6px 10px;border:none;background:#fee2e2;color:#991b1b;border-radius:6px;cursor:pointer;font-size:11px;">🗑️</button>' +
        '</div>'
    ).join('');
}

// ==================================================
// 📊 CARREGAR TABELA DE GASTOS
// ==================================================
function carregarTabelaGastos() {
    try {
        const tabela = document.getElementById('tabelaGastos');
        if (!tabela) return;
        
        const filtroVeiculo = document.getElementById('filtroGastosVeiculo')?.value || 'todos';
        const filtroTipo = document.getElementById('filtroGastosTipo')?.value || 'todos';
        
        let gastos = (typeof BD !== 'undefined' && BD.gastos) ? [...BD.gastos] : [];
        
        if (filtroVeiculo !== 'todos') {
            gastos = gastos.filter(g => String(g.veiculoId) === String(filtroVeiculo));
        }
        if (filtroTipo !== 'todos') {
            gastos = gastos.filter(g => g.tipo === filtroTipo);
        }
        
        if (gastos.length === 0) {
            tabela.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#64748b;">Nenhum gasto registrado</td></tr>';
            return;
        }
        
        const total = gastos.reduce((s, g) => s + Number(g.valor || 0), 0);
        
        tabela.innerHTML = gastos.map(g => {
            const veiculo = BD.veiculos?.find(v => String(v.id) === String(g.veiculoId));
            let detalhes = g.tipo || '-';
            if (g.tipo === 'Combustível' && g.tipoCombustivel) {
                detalhes += ' (' + g.tipoCombustivel + ')';
                if (g.litros) detalhes += ' - ' + g.litros + 'L';
            }
            return '<tr>' +
                '<td>' + (g.data || '-') + '</td>' +
                '<td><strong>' + (veiculo?.placa || '-') + '</strong></td>' +
                '<td>' + detalhes + '</td>' +
                '<td>' + (g.km ? Number(g.km).toLocaleString('pt-BR') : (g.usaKm === false ? 'Isento' : '-')) + '</td>' +
                '<td>' + (g.pontoAbastecimento || g.obra || '-') + '</td>' +
                '<td style="font-weight:600;color:#dc2626;">R$ ' + Number(g.valor || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '</td>' +
                '<td><button onclick="excluirGasto(' + g.id + ')" style="padding:6px 10px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:12px;">🗑️</button></td>' +
                '</tr>';
        }).join('') +
        '<tr style="background:#fef2f2;font-weight:600;">' +
            '<td colspan="5" style="text-align:right;">TOTAL:</td>' +
            '<td style="color:#dc2626;">R$ ' + total.toLocaleString('pt-BR', {minimumFractionDigits: 2}) + '</td>' +
            '<td></td>' +
        '</tr>';
        
    } catch (e) { console.error('❌ Erro carregar gastos:', e); }
}

// ==================================================
// 📝 ABRIR MODAL DE GASTO
// ==================================================
function abrirModalGasto() {
    console.log('📝 abrirModalGasto chamado');
    
    if (typeof BD === 'undefined' || !BD.veiculos || BD.veiculos.length === 0) {
        alert('⚠️ Cadastre um veículo primeiro!');
        return;
    }
    
    inicializarPontosAbastecimento();
    
    // Verifica perfil do usuário
    const isAdmin = typeof ehAdmin === 'function' ? ehAdmin() : true;
    const perfilUsuario = window.usuarioAtual?.perfil || '';
    const isMotorista = !isAdmin && (perfilUsuario === 'motorista' || perfilUsuario === 'operacional');
    
    const antigo = document.getElementById('modal-gasto-final');
    if (antigo) antigo.remove();
    
    const fundo = document.createElement('div');
    fundo.id = 'modal-gasto-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
    
    const caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:520px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    const tituloModal = isMotorista ? '⛽ Abastecimento' : '💰 Novo Gasto';
    
    const cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:' + (isMotorista ? '#f59e0b' : '#ef4444') + ';color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    cabecalho.innerHTML = '<h3 style="margin:0;font-size:18px;">' + tituloModal + '</h3>';
    const btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    const corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    const form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
    form.onsubmit = function(e) { e.preventDefault(); salvarGastoForm(isMotorista); };
    
    function addCampo(label, tipo, id, obrigatorio, opcoes) {
        const grupo = document.createElement('div');
        grupo.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
        const lbl = document.createElement('label');
        lbl.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
        lbl.innerHTML = label + (obrigatorio ? ' <span style="color:#dc2626;">*</span>' : '');
        grupo.appendChild(lbl);
        let input;
        if (opcoes) {
            input = document.createElement('select');
            input.innerHTML = '<option value="">Selecione...</option>' + opcoes.map(o => '<option value="' + o.valor + '">' + o.texto + '</option>').join('');
        } else {
            input = document.createElement('input');
            input.type = tipo;
        }
        input.id = id;
        if (obrigatorio) input.required = true;
        input.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;background:white;';
        grupo.appendChild(input);
        return grupo;
    }
    
    const veiculosOpts = BD.veiculos.map(v => ({ valor: v.id, texto: v.placa + ' - ' + (v.modelo || '') }));
    const obras = BD.obras || (BD.locais ? BD.locais.map(l => l.nome) : ['Pátio Principal']);
    
    // ==========================================
    // CAMPOS COMUNS: Veículo
    // ==========================================
    form.appendChild(addCampo('Veículo', 'text', 'gVeiculo', true, veiculosOpts));
    
    // ==========================================
    // Container para KM e Horímetro (dinâmico)
    // ==========================================
    const containerMedidores = document.createElement('div');
    containerMedidores.id = 'containerMedidoresGasto';
    containerMedidores.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px;';
    form.appendChild(containerMedidores);
    
    function atualizarCamposMedidores() {
        const veiculoId = document.getElementById('gVeiculo')?.value;
        containerMedidores.innerHTML = '';
        
        if (!veiculoId) return;
        
        const usaKm = typeof veiculoUsaKm === 'function' ? veiculoUsaKm(veiculoId) : true;
        const usaHorimetro = typeof veiculoUsaHorimetro === 'function' ? veiculoUsaHorimetro(veiculoId) : false;
        
        if (usaKm) {
            containerMedidores.appendChild(addCampo('🛣️ KM Atual', 'number', 'gKm', true));
        } else {
            const info = document.createElement('div');
            info.style.cssText = 'padding:10px 12px;background:#fef3c7;border:1px dashed #f59e0b;border-radius:8px;font-size:12px;color:#92400e;display:flex;align-items:center;';
            info.innerHTML = '🛣️ <strong style="margin-left:6px;">KM:</strong> Isento';
            containerMedidores.appendChild(info);
            const hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.id = 'gKm';
            hidden.value = '';
            containerMedidores.appendChild(hidden);
        }
        
        if (usaHorimetro) {
            containerMedidores.appendChild(addCampo('⏱️ Horímetro', 'number', 'gHorimetro', true));
        }
    }
    
    // Listener veículo
    setTimeout(function() {
        const selVeic = document.getElementById('gVeiculo');
        if (selVeic) {
            selVeic.addEventListener('change', atualizarCamposMedidores);
            if (selVeic.value) atualizarCamposMedidores();
        }
    }, 50);
    
    // ==========================================
    // CAMPOS ESPECÍFICOS POR PERFIL
    // ==========================================
    if (isMotorista) {
        // 🔵 MOTORISTA: APENAS COMBUSTÍVEL
        const aviso = document.createElement('div');
        aviso.style.cssText = 'padding:10px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:12px;color:#92400e;';
        aviso.innerHTML = 'ℹ️ <strong>Motorista:</strong> Você pode registrar apenas abastecimentos.';
        form.appendChild(aviso);
        
        // Tipo fixo: Combustível
        const hiddenTipo = document.createElement('input');
        hiddenTipo.type = 'hidden';
        hiddenTipo.id = 'gTipo';
        hiddenTipo.value = 'Combustível';
        form.appendChild(hiddenTipo);
        
        // Ponto de abastecimento
        const pontosOpts = BD.pontosAbastecimento.map(p => ({ valor: p.nome, texto: '⛽ ' + p.nome }));
        form.appendChild(addCampo('Ponto de Abastecimento', 'text', 'gPonto', true, pontosOpts));
        
        // Tipo de combustível
        const tiposCombustivel = ['Gasolina Comum', 'Gasolina Aditivada', 'Etanol', 'Diesel S10', 'Diesel S500', 'GNV', 'Outro'];
        form.appendChild(addCampo('Tipo de Combustível', 'text', 'gTipoCombustivel', true, tiposCombustivel.map(t => ({ valor: t, texto: t }))));
        
        // Litragem
        form.appendChild(addCampo('Litragem (L)', 'number', 'gLitros', true));
        
        // Data
        form.appendChild(addCampo('Data', 'date', 'gData', true));
        
        // Valor total
        form.appendChild(addCampo('Valor Total (R$)', 'number', 'gValor', true));
        
    } else {
        // 🔴 ADMIN: TODOS OS TIPOS DE GASTO
        const tiposGasto = ['Combustível', 'Manutenção', 'Peças', 'Serviços', 'IPVA', 'Seguro', 'Licenciamento', 'Multas', 'Pedágio', 'Outros'];
        form.appendChild(addCampo('Tipo de Gasto', 'text', 'gTipo', true, tiposGasto.map(t => ({ valor: t, texto: t }))));
        
        // Container para campos específicos de combustível
        const containerCombustivel = document.createElement('div');
        containerCombustivel.id = 'containerCombustivelAdmin';
        containerCombustivel.style.cssText = 'display:none;grid-template-columns:1fr 1fr;gap:16px;padding:14px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;';
        form.appendChild(containerCombustivel);
        
        // Listener para mostrar campos de combustível
        setTimeout(function() {
            const selTipo = document.getElementById('gTipo');
            if (selTipo) {
                selTipo.addEventListener('change', function() {
                    if (this.value === 'Combustível') {
                        containerCombustivel.style.display = 'grid';
                    } else {
                        containerCombustivel.style.display = 'none';
                    }
                });
            }
        }, 50);
        
        // Campos de combustível para admin
        const pontosOpts = BD.pontosAbastecimento.map(p => ({ valor: p.nome, texto: '⛽ ' + p.nome }));
        const tiposCombustivel = ['Gasolina Comum', 'Gasolina Aditivada', 'Etanol', 'Diesel S10', 'Diesel S500', 'GNV', 'Outro'];
        
        // Adiciona campos no container (usando DOM direto)
        const campoPonto = addCampo('Ponto de Abastecimento', 'text', 'gPonto', false, pontosOpts);
        const campoTipoComb = addCampo('Tipo de Combustível', 'text', 'gTipoCombustivel', false, tiposCombustivel.map(t => ({ valor: t, texto: t })));
        const campoLitros = addCampo('Litragem (L)', 'number', 'gLitros', false);
        containerCombustivel.appendChild(campoPonto);
        containerCombustivel.appendChild(campoTipoComb);
        containerCombustivel.appendChild(campoLitros);
        
        // Data
        form.appendChild(addCampo('Data', 'date', 'gData', true));
        
        // Valor
        form.appendChild(addCampo('Valor (R$)', 'number', 'gValor', true));
        
        // Obra/Local
        form.appendChild(addCampo('Obra/Local', 'text', 'gObra', false, obras.map(o => ({ valor: o, texto: o }))));
    }
    
    // ==========================================
    // OBSERVAÇÃO (para todos)
    // ==========================================
    const grupoObs = document.createElement('div');
    grupoObs.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    const lblObs = document.createElement('label');
    lblObs.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
    lblObs.textContent = 'Observação';
    grupoObs.appendChild(lblObs);
    const txtObs = document.createElement('textarea');
    txtObs.id = 'gObservacao';
    txtObs.rows = 2;
    txtObs.placeholder = 'Detalhes adicionais (opcional)...';
    txtObs.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;';
    grupoObs.appendChild(txtObs);
    form.appendChild(grupoObs);
    
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
    btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:' + (isMotorista ? '#f59e0b' : '#ef4444') + ';color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    
    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    form.appendChild(rodape);
    
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    
    document.getElementById('gData').value = new Date().toISOString().split('T')[0];
    console.log('✅ Modal gasto aberto! Perfil:', isMotorista ? 'Motorista' : 'Admin');
}

// ==================================================
// 💾 SALVAR GASTO
// ==================================================
function salvarGastoForm(isMotorista) {
    try {
        const veiculoId = document.getElementById('gVeiculo')?.value;
        const tipo = document.getElementById('gTipo')?.value;
        const valor = parseFloat(document.getElementById('gValor')?.value);
        
        if (!veiculoId || !tipo || !valor || valor <= 0) {
            alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        // Validação condicional de KM e Horímetro
        const usaKm = typeof veiculoUsaKm === 'function' ? veiculoUsaKm(veiculoId) : true;
        const usaHorimetro = typeof veiculoUsaHorimetro === 'function' ? veiculoUsaHorimetro(veiculoId) : false;
        
        const kmEl = document.getElementById('gKm');
        const horimetroEl = document.getElementById('gHorimetro');
        
        let km = null;
        if (usaKm && kmEl && kmEl.type !== 'hidden') {
            km = parseFloat(kmEl.value);
            if (isNaN(km) || km <= 0) {
                alert('⚠️ KM é obrigatório para este veículo!');
                kmEl.focus();
                return;
            }
        }
        
        let horimetro = null;
        if (usaHorimetro && horimetroEl) {
            horimetro = parseFloat(horimetroEl.value);
            if (isNaN(horimetro) || horimetro < 0) {
                alert('⚠️ Horímetro é obrigatório para este veículo!');
                horimetroEl.focus();
                return;
            }
        }
        
        // Validações específicas de combustível
        let litros = null;
        let tipoCombustivel = null;
        let pontoAbastecimento = null;
        
        if (tipo === 'Combustível') {
            pontoAbastecimento = document.getElementById('gPonto')?.value;
            tipoCombustivel = document.getElementById('gTipoCombustivel')?.value;
            const litrosEl = document.getElementById('gLitros');
            litros = litrosEl ? parseFloat(litrosEl.value) : null;
            
            if (isMotorista) {
                if (!pontoAbastecimento) { alert('Selecione o ponto de abastecimento!'); return; }
                if (!tipoCombustivel) { alert('Selecione o tipo de combustível!'); return; }
                if (!litros || litros <= 0) { alert('Informe a litragem!'); return; }
            }
        }
        
        const dados = {
            id: Date.now(),
            veiculoId: Number(veiculoId),
            tipo: tipo,
            data: document.getElementById('gData')?.value || new Date().toISOString().split('T')[0],
            valor: valor,
            km: km,
            horimetro: horimetro,
            usaKm: usaKm,
            usaHorimetro: usaHorimetro,
            pontoAbastecimento: pontoAbastecimento,
            tipoCombustivel: tipoCombustivel,
            litros: litros,
            obra: document.getElementById('gObra')?.value || '',
            observacao: document.getElementById('gObservacao')?.value.trim() || '',
            lancadoPor: window.usuarioAtual?.nome || 'Sistema',
            perfilLancamento: isMotorista ? 'motorista' : 'admin'
        };
        
        if (typeof BD === 'undefined') BD = { gastos: [] };
        if (!BD.gastos) BD.gastos = [];
        BD.gastos.unshift(dados);
        
        // Atualiza KM do veículo se foi informado
        if (usaKm && km && BD.veiculos) {
            const v = BD.veiculos.find(x => String(x.id) === String(veiculoId));
            if (v) v.km_atual = km;
        }
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('pontosAbastecimento', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar pontosAbastecimento do Supabase:', r.erro);
                    });
                }
            }
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('gastos', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar gastos do Supabase:', r.erro);
                    });
                }
            }
        
        document.getElementById('modal-gasto-final')?.remove();
        carregarTabelaGastos();
        if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
        
        if (typeof mostrarToast === 'function') {
            mostrarToast(isMotorista ? 'Abastecimento registrado!' : 'Gasto registrado!', 'sucesso');
        } else {
            alert('✅ ' + (isMotorista ? 'Abastecimento registrado!' : 'Gasto registrado!'));
        }
        
    } catch (e) {
        console.error('❌ Erro:', e);
        alert('❌ Erro ao salvar');
    }
}

// ==================================================
// 🗑️ EXCLUIR GASTO
// ==================================================
async function excluirGasto(id) {
    try {
        if (!confirm('Excluir este registro?')) return;
        
        // 🗑️ PRIMEIRO: Tenta apagar do SUPABASE
        if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
            if (supabasePronto() && id) {
                const resultado = await excluirDoSupabase('gastos', id);
                if (!resultado.sucesso) {
                    console.error('❌ Erro ao apagar gastos do Supabase:', resultado.erro);
                    alert('❌ Não foi possível apagar do Supabase. Tente novamente.');
                    return; // NÃO apaga do localStorage se falhar!
                }
            }
        }
        
        // 🗑️ DEPOIS: Apaga do localStorage

    try {
        if (!confirm('Excluir este gasto?')) return;
        if (typeof BD !== 'undefined' && BD.gastos) {
            BD.gastos = BD.gastos.filter(g => g.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('pontosAbastecimento', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar pontosAbastecimento do Supabase:', r.erro);
                    });
                }
            }
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('gastos', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar gastos do Supabase:', r.erro);
                    });
                }
            }
        }
        carregarTabelaGastos();
        if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    } catch (e) { console.error(e); }
    } catch (e) { 
        console.error(e); 
        alert('❌ Erro ao excluir: ' + e.message);
    }
}

// ==================================================
// 📤 EXPORTA FUNÇÕES
// ==================================================
window.carregarTabelaGastos = carregarTabelaGastos;
window.abrirModalGasto = abrirModalGasto;
window.excluirGasto = excluirGasto;
window.abrirModalPontosAbastecimento = abrirModalPontosAbastecimento;
window.adicionarPontoAbastecimento = adicionarPontoAbastecimento;
window.excluirPontoAbastecimento = excluirPontoAbastecimento;
window.renderizarListaPontos = renderizarListaPontos;
window.inicializarPontosAbastecimento = inicializarPontosAbastecimento;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        inicializarPontosAbastecimento();
        const filtV = document.getElementById('filtroGastosVeiculo');
        const filtT = document.getElementById('filtroGastosTipo');
        if (filtV) filtV.addEventListener('change', carregarTabelaGastos);
        if (filtT) filtT.addEventListener('change', carregarTabelaGastos);
        console.log('✅ gastos.js inicializado');
    });
} else {
    inicializarPontosAbastecimento();
    console.log('✅ gastos.js inicializado');
}
