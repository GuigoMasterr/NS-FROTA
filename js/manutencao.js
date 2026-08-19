// ==================================================
// 🔧 CONTROLE DE MANUTENÇÃO - VERSÃO CORRIGIDA
// ==================================================

function carregarTabelaManutencao() {
    try {
        console.log('🔧 Carregando tabela de manutenção...');
        
        const tabela = document.getElementById('tabelaManutencao');
        if (!tabela) {
            console.warn('⚠️ Tabela de manutenção não encontrada');
            return;
        }
        
        const filtroVeiculo = document.getElementById('filtroVeiculoManutencao')?.value || 'todos';
        
        let manutencoes = (typeof BD !== 'undefined' && BD.manutencoes) ? [...BD.manutencoes] : [];
        
        if (filtroVeiculo !== 'todos') {
            manutencoes = manutencoes.filter(m => String(m.veiculoId) === String(filtroVeiculo));
        }
        
        // Ordena por data (mais recentes primeiro)
        manutencoes.sort((a, b) => new Date(b.dataPrevista || b.data || 0) - new Date(a.dataPrevista || a.data || 0));
        
        if (manutencoes.length === 0) {
            tabela.innerHTML = '<tr><td colspan="7" class="estado-vazio">Nenhuma manutenção registrada</td></tr>';
            return;
        }
        
        // Busca dados de veículos para exibir placa
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        const getPlaca = (id) => {
            const v = veiculos.find(v => String(v.id) === String(id));
            return v ? v.placa : 'Veículo não encontrado';
        };
        
        const badgeClass = {
            'Pendente': 'badge-warning',
            'Em Andamento': 'badge-info',
            'Concluída': 'badge-success',
            'Cancelada': 'badge-secondary'
        };
        
        tabela.innerHTML = manutencoes.map(m => `
            <tr>
                <td>${m.dataPrevista || m.data || '-'}</td>
                <td><strong>${getPlaca(m.veiculoId)}</strong></td>
                <td>${m.tipo === 'preventiva' ? '🛡️ Preventiva' : m.tipo === 'corretiva' ? '🔧 Corretiva' : '📋 Revisão'}</td>
                <td>${m.servico || '-'}</td>
                <td>${m.custo ? 'R$ ' + Number(m.custo).toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '-'}</td>
                <td><span class="badge ${badgeClass[m.status] || 'badge-secondary'}">${m.status || 'Pendente'}</span></td>
                <td>
                    <button class="btn-mini" onclick="abrirModalManutencaoEditar(${m.id})" title="Editar">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                    ${m.status !== 'Concluída' ? `
                    <button class="btn-mini" onclick="concluirManutencao(${m.id})" title="Concluir" style="color:#10b981;">
                        <i class="fa-solid fa-check"></i>
                    </button>
                    ` : ''}
                    <button class="btn-mini" onclick="excluirManutencao(${m.id})" title="Excluir" style="color:#dc2626;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log(`✅ ${manutencoes.length} manutenção(ões) carregada(s)`);
        
    } catch (e) {
        console.error('❌ Erro ao carregar manutenções:', e);
        const tabela = document.getElementById('tabelaManutencao');
        if (tabela) tabela.innerHTML = '<tr><td colspan="7" class="estado-vazio" style="color:#dc2626;">Erro ao carregar</td></tr>';
    }
}

function abrirModalManutencao(tipo) {
    console.log('📝 abrirModalManutencao chamado, tipo:', tipo);
    
    // Verifica se há veículos cadastrados
    if (typeof BD === 'undefined' || !BD.veiculos || BD.veiculos.length === 0) {
        alert('⚠️ Cadastre um veículo primeiro!');
        return;
    }
    
    // Remove modal anterior
    const antigo = document.getElementById('modal-manutencao-final');
    if (antigo) antigo.remove();
    
    const titulo = tipo === 'preventiva' ? '🔧 Manutenção Preventiva' : '🔨 Manutenção Corretiva';
    
    // Fundo do modal
    const fundo = document.createElement('div');
    fundo.id = 'modal-manutencao-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
    
    // Caixa
    const caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:550px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    // Cabeçalho
    const cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#f59e0b;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;';
    cabecalho.innerHTML = `<h3 style="margin:0;font-size:18px;">${titulo}</h3>`;
    const btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    // Corpo
    const corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    const form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:14px;';
    form.onsubmit = function(e) { e.preventDefault(); salvarManutencaoForm(tipo); };
    
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
            input.innerHTML = '<option value="">Selecione...</option>' + 
                opcoes.map(o => `<option value="${o.valor}">${o.texto}</option>`).join('');
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
    
    // Veículos
    const veiculosOpts = BD.veiculos.map(v => ({ valor: v.id, texto: `${v.placa} - ${v.modelo || ''}` }));
    
    form.appendChild(addCampo('Veículo', 'text', 'mVeiculo', true, veiculosOpts));
    form.appendChild(addCampo('Descrição', 'text', 'mDescricao', true));
    form.appendChild(addCampo('Data', 'date', 'mData', true));
    
    // Para preventiva: Data da Próxima Revisão é SEMPRE obrigatória
    if (tipo === 'preventiva') {
        form.appendChild(addCampo('📅 Data da Próxima Revisão', 'date', 'mDataProxima', true));
    }
    
    // Container para campos de KM e Horímetro (atualizados dinamicamente)
    const containerMedidores = document.createElement('div');
    containerMedidores.id = 'containerMedidoresManutencao';
    containerMedidores.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px;';
    form.appendChild(containerMedidores);
    
    // Função para atualizar campos de KM/Horímetro baseado no veículo selecionado
    function atualizarCamposMedidores() {
        const veiculoId = document.getElementById('mVeiculo')?.value;
        containerMedidores.innerHTML = '';
        
        if (!veiculoId) return;
        
        const usaKm = typeof veiculoUsaKm === 'function' ? veiculoUsaKm(veiculoId) : true;
        const usaHorimetro = typeof veiculoUsaHorimetro === 'function' ? veiculoUsaHorimetro(veiculoId) : false;
        
        if (tipo === 'preventiva') {
            // ==========================================
            // PREVENTIVA: KM Atual + KM Próxima Revisão
            // ==========================================
            if (usaKm) {
                // KM Atual - obrigatório
                containerMedidores.appendChild(addCampo('🛣️ KM Atual', 'number', 'mKm', true));
                // KM da Próxima Revisão - obrigatório
                containerMedidores.appendChild(addCampo('🛣️ KM da Próxima Revisão', 'number', 'mProximaKm', true));
            } else {
                // KM desabilitado: mostra isento
                const info = document.createElement('div');
                info.style.cssText = 'padding:10px 12px;background:#fef3c7;border:1px dashed #f59e0b;border-radius:8px;font-size:12px;color:#92400e;display:flex;align-items:center;grid-column:span 2;';
                info.innerHTML = '🛣️ <strong style="margin-left:6px;">KM:</strong> Isento para este veículo (não é necessário informar KM Atual nem KM da Próxima Revisão)';
                containerMedidores.appendChild(info);
                const hiddenKm = document.createElement('input');
                hiddenKm.type = 'hidden';
                hiddenKm.id = 'mKm';
                hiddenKm.value = '';
                containerMedidores.appendChild(hiddenKm);
                const hiddenProx = document.createElement('input');
                hiddenProx.type = 'hidden';
                hiddenProx.id = 'mProximaKm';
                hiddenProx.value = '';
                containerMedidores.appendChild(hiddenProx);
            }
            
            // Horímetro - se habilitado
            if (usaHorimetro) {
                containerMedidores.appendChild(addCampo('⏱️ Horímetro Atual', 'number', 'mHorimetro', true));
            }
            
        } else {
            // ==========================================
            // CORRETIVA: Apenas KM Atual / Horímetro
            // ==========================================
            if (usaKm) {
                containerMedidores.appendChild(addCampo('🛣️ KM Atual', 'number', 'mKm'));
            } else {
                const info = document.createElement('div');
                info.style.cssText = 'padding:10px 12px;background:#fef3c7;border:1px dashed #f59e0b;border-radius:8px;font-size:12px;color:#92400e;display:flex;align-items:center;';
                info.innerHTML = '🛣️ <strong style="margin-left:6px;">KM:</strong> Isento para este veículo';
                containerMedidores.appendChild(info);
                const hiddenKm = document.createElement('input');
                hiddenKm.type = 'hidden';
                hiddenKm.id = 'mKm';
                hiddenKm.value = '';
                containerMedidores.appendChild(hiddenKm);
            }
            
            if (usaHorimetro) {
                containerMedidores.appendChild(addCampo('⏱️ Horímetro', 'number', 'mHorimetro', true));
            }
        }
    }
    
    // Listener para quando o veículo mudar
    setTimeout(function() {
        const selectVeiculo = document.getElementById('mVeiculo');
        if (selectVeiculo) {
            selectVeiculo.addEventListener('change', atualizarCamposMedidores);
        }
    }, 100);
    
    form.appendChild(addCampo('Valor (R$)', 'number', 'mValor'));
    
    // Observação
    const grupoObs = document.createElement('div');
    grupoObs.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    const lblObs = document.createElement('label');
    lblObs.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
    lblObs.textContent = 'Observação';
    grupoObs.appendChild(lblObs);
    const txtObs = document.createElement('textarea');
    txtObs.id = 'mObservacao';
    txtObs.rows = 3;
    txtObs.style.cssText = 'padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;box-sizing:border-box;resize:vertical;';
    grupoObs.appendChild(txtObs);
    form.appendChild(grupoObs);
    
    // Botões
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
    btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#f59e0b;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    form.appendChild(rodape);
    
    // Tipo hidden
    const inputTipo = document.createElement('input');
    inputTipo.type = 'hidden';
    inputTipo.id = 'mTipo';
    inputTipo.value = tipo;
    form.appendChild(inputTipo);
    
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    
    // Data padrão = hoje
    document.getElementById('mData').value = new Date().toISOString().split('T')[0];
    
    console.log('✅ Modal de manutenção aberto!');
}

function abrirModalManutencaoEditar(id) {
    try {
        const manutencao = (typeof BD !== 'undefined' && BD.manutencoes) 
            ? BD.manutencoes.find(m => m.id === id) 
            : null;
        
        if (!manutencao) {
            console.warn('⚠️ Manutenção não encontrada:', id);
            return;
        }
        
        const veiculos = (typeof BD !== 'undefined' && BD.veiculos) ? BD.veiculos : [];
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay aberto';
        modal.id = 'modal-manutencao-edit';
        
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 550px;">
                <div class="modal-cabecalho">
                    <h3 class="modal-titulo">✏️ Editar Manutenção</h3>
                    <button type="button" class="modal-fechar" onclick="fecharModal('modal-manutencao-edit')">&times;</button>
                </div>
                <div class="modal-corpo">
                    <form id="formManutencaoEdit" class="form-grid">
                        <div class="form-grupo">
                            <label>Veículo</label>
                            <select id="mVeiculo" disabled>
                                ${veiculos.map(v => `<option value="${v.id}" ${manutencao.veiculoId == v.id ? 'selected' : ''}>${v.placa} - ${v.modelo || ''}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Status</label>
                            <select id="mStatus">
                                <option value="Pendente" ${manutencao.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                                <option value="Em Andamento" ${manutencao.status === 'Em Andamento' ? 'selected' : ''}>Em Andamento</option>
                                <option value="Concluída" ${manutencao.status === 'Concluída' ? 'selected' : ''}>Concluída</option>
                                <option value="Cancelada" ${manutencao.status === 'Cancelada' ? 'selected' : ''}>Cancelada</option>
                            </select>
                        </div>
                        <div class="form-grupo">
                            <label>Data Prevista</label>
                            <input type="date" id="mData" value="${manutencao.dataPrevista || ''}">
                        </div>
                        <div class="form-grupo">
                            <label>Custo Real (R$)</label>
                            <input type="number" id="mCusto" min="0" step="0.01" value="${manutencao.custo || ''}">
                        </div>
                        <div class="form-grupo" style="grid-column: span 2;">
                            <label>Serviço / Descrição</label>
                            <input type="text" id="mServico" value="${manutencao.servico || ''}">
                        </div>
                    </form>
                </div>
                <div class="modal-rodape">
                    <button type="button" class="btn btn-secundario" onclick="fecharModal('modal-manutencao-edit')">Cancelar</button>
                    <button type="button" class="btn btn-primario" id="btnSalvarManutencaoEdit">💾 Salvar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('btnSalvarManutencaoEdit').addEventListener('click', () => {
            try {
                manutencao.status = document.getElementById('mStatus').value;
                manutencao.dataPrevista = document.getElementById('mData').value;
                manutencao.custo = parseFloat(document.getElementById('mCusto').value) || 0;
                manutencao.servico = document.getElementById('mServico').value;
                
                if (typeof salvarDados === 'function') salvarDados();
                window.BD = BD;
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('manutencoes', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar manutencoes do Supabase:', r.erro);
                    });
                }
            }
                
                fecharModal('modal-manutencao-edit');
                carregarTabelaManutencao();
                
                if (typeof mostrarToast === 'function') mostrarToast('Manutenção atualizada!', 'sucesso');
            } catch (e) {
                console.error('❌ Erro ao salvar edição:', e);
            }
        });
        
    } catch (e) {
        console.error('❌ Erro ao abrir edição de manutenção:', e);
    }
}

function salvarManutencaoForm(tipo) {
    try {
        const veiculoId = document.getElementById('mVeiculo')?.value;
        const servico = document.getElementById('mDescricao')?.value.trim() || document.getElementById('mServico')?.value.trim();
        
        if (!veiculoId || !servico) {
            if (typeof mostrarToast === 'function') mostrarToast('Preencha os campos obrigatórios!', 'aviso');
            else alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        // Validação condicional de KM e Horímetro
        const usaKm = typeof veiculoUsaKm === 'function' ? veiculoUsaKm(veiculoId) : true;
        const usaHorimetro = typeof veiculoUsaHorimetro === 'function' ? veiculoUsaHorimetro(veiculoId) : false;
        
        // Para preventiva: valida Data da Próxima Revisão (SEMPRE obrigatória)
        let dataProxima = null;
        if (tipo === 'preventiva') {
            dataProxima = document.getElementById('mDataProxima')?.value;
            if (!dataProxima) {
                if (typeof mostrarToast === 'function') mostrarToast('Data da Próxima Revisão é obrigatória!', 'aviso');
                else alert('⚠️ Data da Próxima Revisão é obrigatória!');
                document.getElementById('mDataProxima')?.focus();
                return;
            }
        }
        
        const kmAtualEl = document.getElementById('mKm');
        const kmProximaEl = document.getElementById('mProximaKm');
        const horimetroEl = document.getElementById('mHorimetro');
        
        // Valida KM Atual
        if (usaKm && kmAtualEl && kmAtualEl.type !== 'hidden') {
            const kmVal = parseFloat(kmAtualEl.value);
            if (isNaN(kmVal) || kmVal <= 0) {
                const msg = 'KM Atual é obrigatório para este veículo!';
                if (typeof mostrarToast === 'function') mostrarToast(msg, 'aviso');
                else alert('⚠️ ' + msg);
                kmAtualEl.focus();
                return;
            }
        }
        
        // Valida KM da Próxima Revisão (apenas preventiva)
        if (tipo === 'preventiva' && usaKm && kmProximaEl && kmProximaEl.type !== 'hidden') {
            const kmProxVal = parseFloat(kmProximaEl.value);
            if (isNaN(kmProxVal) || kmProxVal <= 0) {
                const msg = 'KM da Próxima Revisão é obrigatório!';
                if (typeof mostrarToast === 'function') mostrarToast(msg, 'aviso');
                else alert('⚠️ ' + msg);
                kmProximaEl.focus();
                return;
            }
        }
        
        if (usaHorimetro && horimetroEl) {
            const hrVal = parseFloat(horimetroEl.value);
            if (isNaN(hrVal) || hrVal < 0) {
                if (typeof mostrarToast === 'function') mostrarToast('Horímetro é obrigatório!', 'aviso');
                else alert('⚠️ Horímetro é obrigatório para este veículo!');
                horimetroEl.focus();
                return;
            }
        }
        
        const kmAtual = usaKm && kmAtualEl ? parseFloat(kmAtualEl.value) || null : null;
        const kmPrevisto = tipo === 'preventiva' && usaKm && kmProximaEl ? parseFloat(kmProximaEl.value) || null : null;
        const horimetro = usaHorimetro && horimetroEl ? parseFloat(horimetroEl.value) : null;
        
        const dados = {
            veiculoId: parseInt(veiculoId),
            tipo: tipo,
            dataPrevista: document.getElementById('mData').value,
            dataProximaRevisao: dataProxima,
            servico: servico,
            kmAtual: kmAtual,
            kmPrevisto: kmPrevisto,
            horimetro: horimetro,
            usaKm: usaKm,
            usaHorimetro: usaHorimetro,
            custo: parseFloat(document.getElementById('mValor')?.value) || 0,
            status: 'Pendente',
            criadoPor: window.usuarioAtual?.nome || 'Sistema',
            dataCriacao: new Date().toISOString()
        };
        
        if (typeof salvarManutencao === 'function') {
            salvarManutencao(dados);
        } else if (typeof BD !== 'undefined') {
            if (!BD.manutencoes) BD.manutencoes = [];
            dados.id = BD.manutencoes.length > 0 ? Math.max(...BD.manutencoes.map(m => m.id || 0)) + 1 : 1;
            BD.manutencoes.push(dados);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('manutencoes', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar manutencoes do Supabase:', r.erro);
                    });
                }
            }
        }
        
        fecharModal('modal-manutencao');
        carregarTabelaManutencao();
        
        if (typeof mostrarToast === 'function') mostrarToast('Manutenção registrada!', 'sucesso');
        else alert('✅ Manutenção registrada!');
        
    } catch (e) {
        console.error('❌ Erro ao salvar manutenção:', e);
    }
}

function concluirManutencao(id) {
    try {
        if (!confirm('Marcar esta manutenção como CONCLUÍDA?')) return;
        
        if (typeof BD !== 'undefined' && BD.manutencoes) {
            const m = BD.manutencoes.find(m => m.id === id);
            if (m) {
                m.status = 'Concluída';
                m.dataConclusao = new Date().toISOString().split('T')[0];
                if (typeof salvarDados === 'function') salvarDados();
                window.BD = BD;
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('manutencoes', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar manutencoes do Supabase:', r.erro);
                    });
                }
            }
            }
        }
        
        carregarTabelaManutencao();
        if (typeof mostrarToast === 'function') mostrarToast('Manutenção concluída!', 'sucesso');
        
    } catch (e) {
        console.error('❌ Erro ao concluir manutenção:', e);
    }
}

async function excluirManutencao(id) {
    try {
        if (!confirm('Excluir este registro?')) return;
        
        // 🗑️ PRIMEIRO: Tenta apagar do SUPABASE
        if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
            if (supabasePronto() && id) {
                const resultado = await excluirDoSupabase('manutencoes', id);
                if (!resultado.sucesso) {
                    console.error('❌ Erro ao apagar manutencoes do Supabase:', resultado.erro);
                    alert('❌ Não foi possível apagar do Supabase. Tente novamente.');
                    return; // NÃO apaga do localStorage se falhar!
                }
            }
        }
        
        // 🗑️ DEPOIS: Apaga do localStorage

    try {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        
        if (typeof excluirManutencaoBD === 'function') {
            excluirManutencaoBD(id);
        } else if (typeof BD !== 'undefined' && BD.manutencoes) {
            BD.manutencoes = BD.manutencoes.filter(m => m.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
            
            // 🗑️ Apaga do SUPABASE também!
            const idExcluir = id;
            if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
                if (supabasePronto() && idExcluir) {
                    excluirDoSupabase('manutencoes', idExcluir).then(function(r) {
                        if (!r.sucesso) console.error('❌ Erro ao apagar manutencoes do Supabase:', r.erro);
                    });
                }
            }
        }
        
        carregarTabelaManutencao();
        if (typeof mostrarToast === 'function') mostrarToast('Excluído!', 'sucesso');
        
    } catch (e) {
        console.error('❌ Erro ao excluir:', e);
    }
    } catch (e) { 
        console.error(e); 
        alert('❌ Erro ao excluir: ' + e.message);
    }
}

// Expõe funções globalmente
window.abrirModalManutencao = abrirModalManutencao;
window.abrirModalManutencaoEditar = abrirModalManutencaoEditar;
window.concluirManutencao = concluirManutencao;
window.excluirManutencao = excluirManutencao;
window.carregarTabelaManutencao = carregarTabelaManutencao;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    const filtro = document.getElementById('filtroVeiculoManutencao');
    if (filtro) filtro.addEventListener('change', carregarTabelaManutencao);
    console.log('✅ js/manutencao.js inicializado');
});