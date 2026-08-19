// ============================================================
// ✅ CHECK-LIST - VERSÃO COMPLETA COM FOTOS E LOCALIZAÇÃO
// Funcionalidades:
// ✅ Localização automática (GPS)
// ✅ 3 fotos obrigatórias: Painel, Frente, Traseira
// ✅ Foto extra da caixa de cintas (se habilitado)
// ✅ Campo de observações para cada foto
// ✅ Sistema de validação de cintas/acessórios
// ✅ Alertas para Admin/Supervisor se quantidades divergirem
// ✅ Verificação de primeiro checklist do dia
// ============================================================

const ITENS_CHECKLIST = [
    'Pneus (calibragem e estado)', 'Freios', 'Óleo do motor', 'Água do radiador',
    'Luzes (farol, seta, freio)', 'Limpadores de para-brisa', 'Bateria', 'Cintos de segurança',
    'Documentos do veículo', 'Extintor de incêndio', 'Triângulo de sinalização', 'Limpeza geral'
];

// Dados temporários do checklist em andamento
var dadosChecklistTemp = {
    localizacao: null,
    fotos: {},
    observacoesFotos: {},
    cintas: {}
};

function carregarTabelaChecklist() {
    try {
        const tabela = document.getElementById('tabelaChecklist');
        if (!tabela) return;
        
        const filtroVeiculo = document.getElementById('filtroChecklistVeiculo')?.value || 'todos';
        const filtroStatus = document.getElementById('filtroChecklistStatus')?.value || 'todos';
        
        let checklists = (typeof BD !== 'undefined' && BD.checklists) ? [...BD.checklists] : [];
        
        if (filtroVeiculo !== 'todos') {
            checklists = checklists.filter(c => String(c.veiculoId) === String(filtroVeiculo));
        }
        if (filtroStatus !== 'todos') {
            checklists = checklists.filter(c => c.resultado === filtroStatus);
        }
        
        if (checklists.length === 0) {
            tabela.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#64748b;">Nenhum check-list realizado</td></tr>';
            return;
        }
        
        const statusCor = { 'Aprovado': '#10b981', 'Pendente': '#f59e0b', 'Reprovado': '#dc2626' };
        
        tabela.innerHTML = checklists.map(c => {
            const veiculo = BD.veiculos?.find(v => String(v.id) === String(c.veiculoId));
            const aprovados = Object.values(c.itens || {}).filter(Boolean).length;
            const total = Object.keys(c.itens || {}).length;
            const alertaCintas = c.alertaCintas ? ' ⚠️' : '';
            return '<tr>' +
                '<td>' + (c.data || '-') + '</td>' +
                '<td><strong>' + (veiculo?.placa || '-') + '</strong></td>' +
                '<td>' + aprovados + '/' + total + alertaCintas + '</td>' +
                '<td><span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;color:white;background:' + (statusCor[c.resultado] || '#6b7280') + '">' + (c.resultado || '-') + '</span></td>' +
                '<td>' + (c.motorista || '-') + '</td>' +
                '<td>' + (c.localizacao ? '📍' : '-') + '</td>' +
                '<td>' +
                    '<button onclick="verDetalhesChecklist(' + c.id + ')" style="padding:6px 10px;border:none;background:#3b82f6;color:white;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px;">👁️ Ver</button>' +
                    '<button onclick="excluirChecklist(' + c.id + ')" style="padding:6px 10px;border:none;background:#ef4444;color:white;border-radius:6px;cursor:pointer;font-size:12px;">🗑️</button>' +
                '</td>' +
                '</tr>';
        }).join('');
        
    } catch (e) { console.error('❌ Erro carregar checklist:', e); }
}

// ============================================================
// 📍 OBTER LOCALIZAÇÃO AUTOMÁTICA
// ============================================================
function obterLocalizacao(callback) {
    if (!navigator.geolocation) {
        console.warn('⚠️ Geolocalização não suportada');
        if (callback) callback(null);
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        function(posicao) {
            const dados = {
                latitude: posicao.coords.latitude,
                longitude: posicao.coords.longitude,
                precisao: posicao.coords.accuracy,
                dataHora: new Date().toISOString()
            };
            console.log('📍 Localização obtida:', dados);
            if (callback) callback(dados);
        },
        function(erro) {
            console.warn('⚠️ Erro ao obter localização:', erro.message);
            if (callback) callback(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// ============================================================
// 📸 CRIAR COMPONENTE DE FOTO + OBSERVAÇÃO
// ============================================================
function criarComponenteFoto(idFoto, titulo, icone, obrigatorio) {
    const container = document.createElement('div');
    container.id = 'container-foto-' + idFoto;
    container.style.cssText = 'border:2px dashed #cbd5e1;border-radius:10px;padding:16px;background:#f8fafc;';
    
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;';
    header.innerHTML = '<strong style="color:#1e293b;font-size:14px;">' + icone + ' ' + titulo + (obrigatorio ? ' <span style="color:#dc2626;">*</span>' : '') + '</strong>';
    container.appendChild(header);
    
    // Área de preview
    const preview = document.createElement('div');
    preview.id = 'preview-' + idFoto;
    preview.style.cssText = 'width:100%;min-height:150px;border:1px solid #e2e8f0;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px;margin-bottom:10px;overflow:hidden;';
    preview.textContent = '📷 Nenhuma foto';
    container.appendChild(preview);
    
    // Input de arquivo (abre câmera)
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = 'image/*';
    inputFile.capture = 'environment'; // Abre câmera traseira no celular
    inputFile.id = 'foto-' + idFoto;
    inputFile.style.cssText = 'display:none;';
    inputFile.onchange = function(e) {
        const arquivo = e.target.files[0];
        if (arquivo) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const base64 = event.target.result;
                dadosChecklistTemp.fotos[idFoto] = base64;
                
                // Mostrar preview
                const img = document.createElement('img');
                img.src = base64;
                img.style.cssText = 'width:100%;height:auto;max-height:250px;object-fit:cover;';
                preview.innerHTML = '';
                preview.appendChild(img);
                preview.style.background = 'white';
            };
            reader.readAsDataURL(arquivo);
        }
    };
    container.appendChild(inputFile);
    
    // Botão para tirar foto
    const btnFoto = document.createElement('button');
    btnFoto.type = 'button';
    btnFoto.textContent = '📷 Tirar Foto';
    btnFoto.style.cssText = 'width:100%;padding:10px;border:none;background:#2563eb;color:white;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;margin-bottom:10px;';
    btnFoto.onclick = function() { inputFile.click(); };
    container.appendChild(btnFoto);
    
    // Campo de observações
    const lblObs = document.createElement('label');
    lblObs.style.cssText = 'font-size:12px;font-weight:500;color:#475569;margin-bottom:4px;display:block;';
    lblObs.textContent = 'Observações sobre a foto:';
    container.appendChild(lblObs);
    
    const txtObs = document.createElement('textarea');
    txtObs.id = 'obs-' + idFoto;
    txtObs.rows = 2;
    txtObs.placeholder = 'Alguma observação sobre esta foto? (opcional)';
    txtObs.style.cssText = 'width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;resize:vertical;box-sizing:border-box;font-family:Arial,sans-serif;';
    txtObs.oninput = function() {
        dadosChecklistTemp.observacoesFotos[idFoto] = this.value;
    };
    container.appendChild(txtObs);
    
    return container;
}

// ============================================================
// 🔗 CRIAR COMPONENTE DE VALIDAÇÃO DE CINTAS
// ============================================================
function criarComponenteCintas(veiculo) {
    if (!veiculo || !veiculo.usaCintas) return null;
    
    const container = document.createElement('div');
    container.id = 'container-cintas';
    container.style.cssText = 'border:2px solid #fbbf24;border-radius:10px;padding:16px;background:#fffbeb;';
    
    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom:14px;';
    header.innerHTML = '<strong style="color:#92400e;font-size:15px;">🔗 Validação de Cintas e Acessórios</strong>' +
        '<div style="font-size:12px;color:#b45309;margin-top:4px;">Preencha as quantidades reais. O sistema comparará com o mínimo configurado.</div>';
    container.appendChild(header);
    
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px;';
    
    function criarCampoCinta(label, idCampo, qtdMinima, unidade, tamanho) {
        const grupo = document.createElement('div');
        grupo.style.cssText = 'background:white;padding:10px;border-radius:8px;border:1px solid #fde68a;';
        
        var labelText = label;
        if (tamanho) labelText += ' (' + tamanho + ')';
        labelText += ' <span style="color:#dc2626;font-size:11px;">Mín: ' + qtdMinima + ' ' + unidade + '</span>';
        
        grupo.innerHTML = '<label style="font-size:12px;font-weight:600;color:#78350f;display:block;margin-bottom:6px;">' + labelText + '</label>';
        
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.id = 'cinta-' + idCampo;
        inp.min = '0';
        inp.placeholder = 'Qtd real';
        inp.style.cssText = 'width:100%;padding:8px 10px;border:1px solid #fcd34d;border-radius:6px;font-size:14px;box-sizing:border-box;';
        inp.oninput = function() {
            dadosChecklistTemp.cintas[idCampo] = parseInt(this.value) || 0;
            validarCintas(veiculo);
        };
        grupo.appendChild(inp);
        
        const status = document.createElement('div');
        status.id = 'status-cinta-' + idCampo;
        status.style.cssText = 'font-size:11px;margin-top:4px;color:#6b7280;';
        status.textContent = 'Preencha a quantidade';
        grupo.appendChild(status);
        
        return grupo;
    }
    
    if (veiculo.cintasIcarQtd > 0) {
        grid.appendChild(criarCampoCinta(
            'Cintas de Içar Carga',
            'cintasIcar',
            veiculo.cintasIcarQtd,
            'un',
            veiculo.cintasIcarTamanho
        ));
    }
    
    if (veiculo.cintasCatracaQtd > 0) {
        grid.appendChild(criarCampoCinta(
            'Cintas de Catraca',
            'cintasCatraca',
            veiculo.cintasCatracaQtd,
            'un'
        ));
    }
    
    if (veiculo.catracasQtd > 0) {
        grid.appendChild(criarCampoCinta(
            'Catracas',
            'catracas',
            veiculo.catracasQtd,
            'un'
        ));
    }
    
    container.appendChild(grid);
    
    // Alerta geral
    const alertaGeral = document.createElement('div');
    alertaGeral.id = 'alerta-cintas-geral';
    alertaGeral.style.cssText = 'display:none;margin-top:12px;padding:10px;border-radius:6px;font-size:13px;font-weight:500;';
    container.appendChild(alertaGeral);
    
    return container;
}

// ============================================================
// ⚠️ VALIDAR QUANTIDADES DE CINTAS
// ============================================================
function validarCintas(veiculo) {
    if (!veiculo || !veiculo.usaCintas) return { ok: true, divergencias: [] };
    
    const divergencias = [];
    
    function validarItem(campo, qtdMinima, label) {
        const input = document.getElementById('cinta-' + campo);
        const status = document.getElementById('status-cinta-' + campo);
        if (!input || !status) return;
        
        const qtdReal = parseInt(input.value) || 0;
        
        if (qtdReal < qtdMinima) {
            status.textContent = '⚠️ ABAIXO do mínimo! Faltam ' + (qtdMinima - qtdReal) + ' un';
            status.style.color = '#dc2626';
            status.style.fontWeight = '600';
            divergencias.push({ item: label, tipo: 'abaixo', qtdReal: qtdReal, qtdMinima: qtdMinima });
        } else if (qtdReal > qtdMinima) {
            status.textContent = 'ℹ️ ACIMA do mínimo: +' + (qtdReal - qtdMinima) + ' un extra';
            status.style.color = '#d97706';
            status.style.fontWeight = '500';
            divergencias.push({ item: label, tipo: 'acima', qtdReal: qtdReal, qtdMinima: qtdMinima });
        } else {
            status.textContent = '✅ OK - Quantidade correta';
            status.style.color = '#059669';
            status.style.fontWeight = '500';
        }
    }
    
    if (veiculo.cintasIcarQtd > 0) {
        validarItem('cintasIcar', veiculo.cintasIcarQtd, 'Cintas de Içar Carga');
    }
    if (veiculo.cintasCatracaQtd > 0) {
        validarItem('cintasCatraca', veiculo.cintasCatracaQtd, 'Cintas de Catraca');
    }
    if (veiculo.catracasQtd > 0) {
        validarItem('catracas', veiculo.catracasQtd, 'Catracas');
    }
    
    // Atualiza alerta geral
    const alertaGeral = document.getElementById('alerta-cintas-geral');
    if (alertaGeral) {
        if (divergencias.length > 0) {
            const temAbaixo = divergencias.some(d => d.tipo === 'abaixo');
            alertaGeral.style.display = 'block';
            alertaGeral.style.background = temAbaixo ? '#fee2e2' : '#fef3c7';
            alertaGeral.style.color = temAbaixo ? '#991b1b' : '#92400e';
            alertaGeral.style.border = '1px solid ' + (temAbaixo ? '#fca5a5' : '#fcd34d');
            alertaGeral.innerHTML = temAbaixo 
                ? '⚠️ <strong>ATENÇÃO:</strong> Itens abaixo do mínimo serão reportados para Admin e Supervisor!'
                : 'ℹ️ <strong>OBSERVAÇÃO:</strong> Itens acima do mínimo serão reportados para conferência.';
        } else {
            alertaGeral.style.display = 'none';
        }
    }
    
    return { ok: divergencias.length === 0, divergencias: divergencias };
}

// ============================================================
// 📅 VERIFICAR SE É O PRIMEIRO CHECKLIST DO DIA
// ============================================================
function ehPrimeiroChecklistDoDia(veiculoId) {
    const hoje = new Date().toISOString().split('T')[0];
    const checklists = BD.checklists || [];
    const jaFezHoje = checklists.some(c => 
        String(c.veiculoId) === String(veiculoId) && c.data === hoje
    );
    return !jaFezHoje;
}

// ============================================================
// 📝 ABRIR MODAL DE CHECKLIST
// ============================================================
function abrirModalChecklist() {
    console.log('📝 abrirModalChecklist chamado');
    
    if (typeof BD === 'undefined' || !BD.veiculos || BD.veiculos.length === 0) {
        alert('⚠️ Cadastre um veículo primeiro!');
        return;
    }
    
    // Reseta dados temporários
    dadosChecklistTemp = {
        localizacao: null,
        fotos: {},
        observacoesFotos: {},
        cintas: {}
    };
    
    const antigo = document.getElementById('modal-checklist-final');
    if (antigo) antigo.remove();
    
    const fundo = document.createElement('div');
    fundo.id = 'modal-checklist-final';
    fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
    fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
    
    const caixa = document.createElement('div');
    caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:700px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
    
    const cabecalho = document.createElement('div');
    cabecalho.style.cssText = 'padding:16px 24px;background:#059669;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;position:sticky;top:0;z-index:10;';
    cabecalho.innerHTML = '<h3 style="margin:0;font-size:18px;">✅ Novo Check-list</h3>';
    const btnFechar = document.createElement('button');
    btnFechar.textContent = '×';
    btnFechar.style.cssText = 'background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;';
    btnFechar.onclick = function() { fundo.remove(); };
    cabecalho.appendChild(btnFechar);
    
    const corpo = document.createElement('div');
    corpo.style.cssText = 'padding:24px;';
    
    const form = document.createElement('form');
    form.style.cssText = 'display:flex;flex-direction:column;gap:16px;';
    form.onsubmit = function(e) { e.preventDefault(); salvarChecklistForm(); };
    
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
    
    form.appendChild(addCampo('Veículo', 'text', 'clVeiculo', true, veiculosOpts));
    form.appendChild(addCampo('Motorista/Responsável', 'text', 'clMotorista', true));
    
    // ============================================================
    // 📍 LOCALIZAÇÃO AUTOMÁTICA
    // ============================================================
    const containerLocalizacao = document.createElement('div');
    containerLocalizacao.id = 'container-localizacao';
    containerLocalizacao.style.cssText = 'background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;';
    containerLocalizacao.innerHTML = '<div style="display:flex;align-items:center;gap:10px;color:#1e40af;font-size:14px;font-weight:500;">📍 Obtendo localização atual... <span style="font-size:11px;color:#64748b;font-weight:normal;">(aguarde)</span></div>';
    form.appendChild(containerLocalizacao);
    
    // Tenta obter localização imediatamente
    obterLocalizacao(function(dados) {
        dadosChecklistTemp.localizacao = dados;
        const container = document.getElementById('container-localizacao');
        if (container) {
            if (dados) {
                container.style.background = '#f0fdf4';
                container.style.borderColor = '#86efac';
                container.innerHTML = '<div style="color:#166534;font-size:14px;font-weight:500;">✅ Localização obtida com sucesso!</div>' +
                    '<div style="font-size:12px;color:#15803d;margin-top:4px;">Lat: ' + dados.latitude.toFixed(6) + ' | Lng: ' + dados.longitude.toFixed(6) + '</div>';
            } else {
                container.style.background = '#fef3c7';
                container.style.borderColor = '#fcd34d';
                container.innerHTML = '<div style="color:#92400e;font-size:14px;font-weight:500;">⚠️ Não foi possível obter a localização</div>' +
                    '<div style="font-size:12px;color:#b45309;margin-top:4px;">Verifique as permissões do navegador. O check-list continuará sem localização.</div>';
            }
        }
    });
    
    // Container para campos de KM e Horímetro
    const containerMedidores = document.createElement('div');
    containerMedidores.id = 'containerMedidoresChecklist';
    containerMedidores.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px;';
    form.appendChild(containerMedidores);
    
    // Container para fotos
    const containerFotosLabel = document.createElement('label');
    containerFotosLabel.style.cssText = 'font-size:14px;font-weight:600;color:#1e293b;margin-top:8px;';
    containerFotosLabel.textContent = '📸 Fotos Obrigatórias (tire diretamente da câmera):';
    form.appendChild(containerFotosLabel);
    
    const containerFotos = document.createElement('div');
    containerFotos.id = 'container-fotos';
    containerFotos.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:14px;';
    form.appendChild(containerFotos);
    
    // Container para cintas (aparece apenas se veículo tiver sistema habilitado)
    const containerCintasWrapper = document.createElement('div');
    containerCintasWrapper.id = 'container-cintas-wrapper';
    form.appendChild(containerCintasWrapper);
    
    // Função para atualizar tudo quando o veículo mudar
    function atualizarPorVeiculo() {
        const veiculoId = document.getElementById('clVeiculo')?.value;
        containerMedidores.innerHTML = '';
        containerFotos.innerHTML = '';
        containerCintasWrapper.innerHTML = '';
        
        if (!veiculoId) return;
        
        const veiculo = BD.veiculos?.find(v => String(v.id) === String(veiculoId));
        const usaKm = typeof veiculoUsaKm === 'function' ? veiculoUsaKm(veiculoId) : true;
        const usaHorimetro = typeof veiculoUsaHorimetro === 'function' ? veiculoUsaHorimetro(veiculoId) : false;
        
        // Campos de KM/Horímetro
        if (usaKm) {
            containerMedidores.appendChild(addCampo('🛣️ KM Atual', 'number', 'clKm', true));
        } else {
            const info = document.createElement('div');
            info.style.cssText = 'padding:10px 12px;background:#fef3c7;border:1px dashed #f59e0b;border-radius:8px;font-size:12px;color:#92400e;display:flex;align-items:center;';
            info.innerHTML = '🛣️ <strong style="margin-left:6px;">KM:</strong> Isento para este veículo';
            containerMedidores.appendChild(info);
            const hiddenKm = document.createElement('input');
            hiddenKm.type = 'hidden'; hiddenKm.id = 'clKm'; hiddenKm.value = '0';
            containerMedidores.appendChild(hiddenKm);
        }
        
        if (usaHorimetro) {
            containerMedidores.appendChild(addCampo('⏱️ Horímetro', 'number', 'clHorimetro', true));
        }
        
        // Fotos obrigatórias
        containerFotos.appendChild(criarComponenteFoto('painel', 'Painel de Instrumentos', '📊', true));
        containerFotos.appendChild(criarComponenteFoto('frente', 'Frente do Veículo', '🚗', true));
        containerFotos.appendChild(criarComponenteFoto('traseira', 'Traseira do Veículo', '🚙', true));
        
        // Foto extra da caixa de cintas (se habilitado)
        if (veiculo && veiculo.usaCintas && veiculo.usaFotoCintas) {
            containerFotos.appendChild(criarComponenteFoto('caixa-cintas', 'Caixa de Cintas', '📦', true));
        }
        
        // Sistema de cintas (se habilitado)
        if (veiculo && veiculo.usaCintas) {
            const compCintas = criarComponenteCintas(veiculo);
            if (compCintas) containerCintasWrapper.appendChild(compCintas);
        }
    }
    
    // Listener para quando o veículo mudar
    setTimeout(function() {
        const selectVeiculo = document.getElementById('clVeiculo');
        if (selectVeiculo) {
            selectVeiculo.addEventListener('change', atualizarPorVeiculo);
        }
    }, 100);
    
    // Itens do checklist
    const divItens = document.createElement('div');
    divItens.style.cssText = 'border:1px solid #e5e7eb;border-radius:8px;padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;';
    
    ITENS_CHECKLIST.forEach(function(item, idx) {
        const idItem = 'clItem_' + idx;
        const labelItem = document.createElement('label');
        labelItem.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:6px;background:#f9fafb;border-radius:6px;';
        labelItem.innerHTML = '<input type="checkbox" id="' + idItem + '" style="width:16px;height:16px;cursor:pointer;"> <span>' + item + '</span>';
        divItens.appendChild(labelItem);
    });
    
    const lblItens = document.createElement('label');
    lblItens.style.cssText = 'font-size:14px;font-weight:500;color:#374151;margin-bottom:-6px;';
    lblItens.textContent = 'Itens do Check-list (marque os aprovados):';
    form.appendChild(lblItens);
    form.appendChild(divItens);
    
    // Observações gerais
    const lblObsGeral = document.createElement('label');
    lblObsGeral.style.cssText = 'font-size:14px;font-weight:500;color:#374151;';
    lblObsGeral.textContent = 'Observações gerais:';
    form.appendChild(lblObsGeral);
    
    const txtObsGeral = document.createElement('textarea');
    txtObsGeral.id = 'clObservacoes';
    txtObsGeral.rows = 3;
    txtObsGeral.placeholder = 'Alguma observação adicional sobre este check-list?';
    txtObsGeral.style.cssText = 'width:100%;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;resize:vertical;box-sizing:border-box;font-family:Arial,sans-serif;';
    form.appendChild(txtObsGeral);
    
    const rodape = document.createElement('div');
    rodape.style.cssText = 'display:flex;gap:12px;justify-content:flex-end;margin-top:10px;';
    const btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.style.cssText = 'padding:10px 20px;border:1px solid #d1d5db;background:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    btnCancelar.onclick = function() { fundo.remove(); };
    const btnSalvar = document.createElement('button');
    btnSalvar.type = 'submit';
    btnSalvar.textContent = '💾 Salvar Check-list';
    btnSalvar.style.cssText = 'padding:10px 20px;border:none;background:#059669;color:white;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;';
    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    form.appendChild(rodape);
    
    corpo.appendChild(form);
    caixa.appendChild(cabecalho);
    caixa.appendChild(corpo);
    fundo.appendChild(caixa);
    document.body.appendChild(fundo);
    
    console.log('✅ Modal checklist aberto!');
}

// ============================================================
// 💾 SALVAR CHECKLIST
// ============================================================
function salvarChecklistForm() {
    try {
        const veiculoId = document.getElementById('clVeiculo')?.value;
        const motorista = document.getElementById('clMotorista')?.value.trim();
        const veiculo = BD.veiculos?.find(v => String(v.id) === String(veiculoId));
        
        // Validação básica
        if (!veiculoId || !motorista) {
            alert('⚠️ Preencha os campos obrigatórios!');
            return;
        }
        
        // Validação condicional de KM e Horímetro
        const usaKm = typeof veiculoUsaKm === 'function' ? veiculoUsaKm(veiculoId) : true;
        const usaHorimetro = typeof veiculoUsaHorimetro === 'function' ? veiculoUsaHorimetro(veiculoId) : false;
        
        const kmEl = document.getElementById('clKm');
        const horimetroEl = document.getElementById('clHorimetro');
        
        const km = usaKm ? parseFloat(kmEl?.value) : 0;
        const horimetro = usaHorimetro ? parseFloat(horimetroEl?.value) : null;
        
        if (usaKm && (!kmEl || isNaN(km) || km <= 0)) {
            alert('⚠️ KM é obrigatório para este veículo!');
            kmEl?.focus();
            return;
        }
        
        if (usaHorimetro && (!horimetroEl || isNaN(horimetro) || horimetro < 0)) {
            alert('⚠️ Horímetro é obrigatório para este veículo!');
            horimetroEl?.focus();
            return;
        }
        
        // Validação de fotos obrigatórias
        const fotosObrigatorias = ['painel', 'frente', 'traseira'];
        if (veiculo && veiculo.usaCintas && veiculo.usaFotoCintas) {
            fotosObrigatorias.push('caixa-cintas');
        }
        
        for (const idFoto of fotosObrigatorias) {
            if (!dadosChecklistTemp.fotos[idFoto]) {
                const nomes = { 'painel': 'Painel de Instrumentos', 'frente': 'Frente do Veículo', 'traseira': 'Traseira do Veículo', 'caixa-cintas': 'Caixa de Cintas' };
                alert('⚠️ Tire a foto do: ' + nomes[idFoto]);
                return;
            }
        }
        
        // Validação de cintas
        let validacaoCintas = { ok: true, divergencias: [] };
        if (veiculo && veiculo.usaCintas) {
            validacaoCintas = validarCintas(veiculo);
            
            if (validacaoCintas.divergencias.some(d => d.tipo === 'abaixo')) {
                if (!confirm('⚠️ ATENÇÃO: Há itens ABAIXO do mínimo configurado.\n\nDeseja continuar mesmo assim? Um alerta será enviado para Admin e Supervisor.')) {
                    return;
                }
            }
        }
        
        // Itens do checklist
        const itens = {};
        ITENS_CHECKLIST.forEach(function(item, idx) {
            const el = document.getElementById('clItem_' + idx);
            itens[item] = el ? el.checked : false;
        });
        
        const totalItens = ITENS_CHECKLIST.length;
        const aprovados = Object.values(itens).filter(Boolean).length;
        let resultado;
        if (aprovados === totalItens) resultado = 'Aprovado';
        else if (aprovados >= totalItens * 0.7) resultado = 'Pendente';
        else resultado = 'Reprovado';
        
        // Verifica se é o primeiro checklist do dia
        const primeiroDoDia = ehPrimeiroChecklistDoDia(veiculoId);
        
        // Montar dados completos
        const dados = {
            id: Date.now(),
            veiculoId: Number(veiculoId),
            motorista: motorista,
            km: km,
            horimetro: horimetro,
            usaKm: usaKm,
            usaHorimetro: usaHorimetro,
            itens: itens,
            resultado: resultado,
            data: new Date().toISOString().split('T')[0],
            dataHora: new Date().toISOString(),
            realizadoPor: window.usuarioAtual?.nome || 'Sistema',
            observacoes: document.getElementById('clObservacoes')?.value.trim() || '',
            localizacao: dadosChecklistTemp.localizacao,
            fotos: dadosChecklistTemp.fotos,
            observacoesFotos: dadosChecklistTemp.observacoesFotos,
            primeiroDoDia: primeiroDoDia,
            // Dados de cintas
            usaCintas: veiculo?.usaCintas || false,
            cintas: {
                cintasIcarQtdMin: veiculo?.cintasIcarQtd || 0,
                cintasIcarTamanho: veiculo?.cintasIcarTamanho || '',
                cintasCatracaQtdMin: veiculo?.cintasCatracaQtd || 0,
                catracasQtdMin: veiculo?.catracasQtd || 0,
                preenchidas: dadosChecklistTemp.cintas,
                divergencias: validacaoCintas.divergencias
            },
            alertaCintas: validacaoCintas.divergencias.length > 0
        };
        
        if (typeof BD === 'undefined') BD = { checklists: [] };
        if (!BD.checklists) BD.checklists = [];
        BD.checklists.unshift(dados);
        
        if (typeof salvarDados === 'function') salvarDados();
        window.BD = BD;
        
        // Atualiza KM do veículo
        if (usaKm && km > 0 && veiculo) {
            veiculo.km_atual = km;
            if (typeof salvarDados === 'function') salvarDados();
        }
        
        document.getElementById('modal-checklist-final')?.remove();
        carregarTabelaChecklist();
        
        // Mensagem de retorno
        let mensagem = '✅ Check-list salvo!\nResultado: ' + resultado;
        if (primeiroDoDia) {
            mensagem += '\n\n📅 Este é o PRIMEIRO check-list do dia para este veículo.';
            mensagem += '\n👉 Agora você pode realizar a primeira locação do dia.';
        }
        if (validacaoCintas.divergencias.length > 0) {
            mensagem += '\n\n⚠️ ATENÇÃO: Há divergências nas quantidades de cintas.';
            mensagem += '\nUm alerta foi registrado para Admin e Supervisor.';
        }
        
        if (typeof mostrarToast === 'function') {
            mostrarToast('Check-list salvo!', resultado === 'Aprovado' ? 'sucesso' : resultado === 'Reprovado' ? 'erro' : 'aviso');
        } else {
            alert(mensagem);
        }
        
        console.log('✅ Checklist salvo com sucesso! Primeiro do dia:', primeiroDoDia);
        
    } catch (e) {
        console.error('❌ Erro:', e);
        alert('❌ Erro ao salvar: ' + e.message);
    }
}

// ============================================================
// 👁️ VER DETALHES DO CHECKLIST
// ============================================================
function verDetalhesChecklist(id) {
    try {
        const c = BD.checklists?.find(x => x.id === id);
        if (!c) return;
        
        const veiculo = BD.veiculos?.find(v => String(v.id) === String(c.veiculoId));
        
        const antigo = document.getElementById('modal-detalhes-checklist');
        if (antigo) antigo.remove();
        
        const fundo = document.createElement('div');
        fundo.id = 'modal-detalhes-checklist';
        fundo.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;';
        fundo.addEventListener('click', function(e) { if (e.target === fundo) fundo.remove(); });
        
        const caixa = document.createElement('div');
        caixa.style.cssText = 'background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.4);width:100%;max-width:600px;max-height:90vh;overflow-y:auto;font-family:Arial,sans-serif;';
        
        const statusCor = { 'Aprovado': '#10b981', 'Pendente': '#f59e0b', 'Reprovado': '#dc2626' };
        
        // Cabeçalho
        let html = '<div style="padding:16px 24px;background:#059669;color:white;display:flex;justify-content:space-between;align-items:center;border-radius:12px 12px 0 0;position:sticky;top:0;z-index:10;">' +
            '<h3 style="margin:0;font-size:18px;">📋 Detalhes do Check-list</h3>' +
            '<button onclick="document.getElementById(\'modal-detalhes-checklist\').remove()" style="background:transparent;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;padding:0 8px;">×</button>' +
            '</div>';
        
        html += '<div style="padding:24px;">';
        
        // Dados básicos
        html += '<div style="background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:16px;">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">' +
            '<div><strong>Veículo:</strong> ' + (veiculo?.placa || '-') + '</div>' +
            '<div><strong>Motorista:</strong> ' + (c.motorista || '-') + '</div>' +
            '<div><strong>Data:</strong> ' + (c.data || '-') + '</div>' +
            '<div><strong>Resultado:</strong> <span style="color:' + (statusCor[c.resultado] || '#6b7280') + ';font-weight:600;">' + (c.resultado || '-') + '</span></div>' +
            (c.km ? '<div><strong>KM:</strong> ' + c.km + '</div>' : '') +
            (c.horimetro ? '<div><strong>Horímetro:</strong> ' + c.horimetro + '</div>' : '') +
            '</div>';
        
        // Localização
        if (c.localizacao) {
            html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:13px;color:#475569;">📍 Localização: Lat ' + c.localizacao.latitude.toFixed(6) + ', Lng ' + c.localizacao.longitude.toFixed(6) + '</div>';
        }
        
        // Primeiro do dia
        if (c.primeiroDoDia) {
            html += '<div style="margin-top:8px;font-size:13px;color:#059669;font-weight:500;">📅 Primeiro check-list do dia</div>';
        }
        
        html += '</div>';
        
        // Alertas de cintas
        if (c.alertaCintas && c.cintas?.divergencias?.length > 0) {
            html += '<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:14px;margin-bottom:16px;">' +
                '<strong style="color:#92400e;">⚠️ Divergências em Cintas/Acessórios:</strong><ul style="margin:8px 0 0 20px;padding:0;font-size:13px;color:#78350f;">';
            c.cintas.divergencias.forEach(function(d) {
                html += '<li>' + d.item + ': ' + d.qtdReal + ' un (mín: ' + d.qtdMinima + ') - <strong>' + (d.tipo === 'abaixo' ? '⚠️ ABAIXO' : 'ℹ️ ACIMA') + '</strong></li>';
            });
            html += '</ul></div>';
        }
        
        // Itens
        html += '<h4 style="margin:0 0 10px 0;color:#1e293b;">Itens Verificados:</h4>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">';
        Object.entries(c.itens || {}).forEach(function([item, ok]) {
            html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:6px;background:' + (ok ? '#f0fdf4' : '#fef2f2') + ';">' +
                '<span style="font-size:14px;">' + (ok ? '✅' : '❌') + '</span>' +
                '<span style="font-size:12px;color:#374151;">' + item + '</span>' +
                '</div>';
        });
        html += '</div>';
        
        // Fotos
        if (c.fotos && Object.keys(c.fotos).length > 0) {
            html += '<h4 style="margin:16px 0 10px 0;color:#1e293b;">📸 Fotos:</h4>';
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">';
            const nomesFotos = { 'painel': 'Painel', 'frente': 'Frente', 'traseira': 'Traseira', 'caixa-cintas': 'Caixa de Cintas' };
            Object.entries(c.fotos).forEach(function([key, base64]) {
                html += '<div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">' +
                    '<img src="' + base64 + '" style="width:100%;height:150px;object-fit:cover;display:block;">' +
                    '<div style="padding:8px;font-size:12px;background:#f8fafc;">' +
                    '<strong style="color:#374151;">' + (nomesFotos[key] || key) + '</strong>';
                if (c.observacoesFotos && c.observacoesFotos[key]) {
                    html += '<div style="color:#64748b;margin-top:4px;">Obs: ' + c.observacoesFotos[key] + '</div>';
                }
                html += '</div></div>';
            });
            html += '</div>';
        }
        
        // Observações gerais
        if (c.observacoes) {
            html += '<div style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:8px;border-left:4px solid #3b82f6;">' +
                '<strong style="color:#1e40af;font-size:13px;">📝 Observações:</strong>' +
                '<div style="margin-top:6px;font-size:13px;color:#475569;">' + c.observacoes + '</div>' +
                '</div>';
        }
        
        html += '</div>';
        
        caixa.innerHTML = html;
        fundo.appendChild(caixa);
        document.body.appendChild(fundo);
        
    } catch (e) { console.error(e); }
}

// ============================================================
// 🗑️ EXCLUIR CHECKLIST
// ============================================================
async function excluirChecklist(id) {
    try {
        if (!confirm('Excluir este check-list?')) return;
        
        // 🗑️ PRIMEIRO: Tenta apagar do SUPABASE
        if (typeof excluirDoSupabase === 'function' && typeof supabasePronto === 'function') {
            if (supabasePronto() && id) {
                const resultado = await excluirDoSupabase('checklists', id);
                if (!resultado.sucesso) {
                    console.error('❌ Erro ao apagar do Supabase:', resultado.erro);
                    alert('❌ Não foi possível apagar do Supabase. Tente novamente.');
                    return;
                }
            }
        }
        
        // 🗑️ DEPOIS: Apaga do localStorage
        if (typeof BD !== 'undefined' && BD.checklists) {
            BD.checklists = BD.checklists.filter(c => c.id !== id);
            if (typeof salvarDados === 'function') salvarDados();
            window.BD = BD;
        }
        
        carregarTabelaChecklist();
        console.log('✅ Checklist excluído com sucesso!');
        
    } catch (e) { 
        console.error(e); 
        alert('❌ Erro ao excluir: ' + e.message);
    }
}

// ============================================================
// 📢 EXPORTA FUNÇÕES GLOBALMENTE
// ============================================================
window.carregarTabelaChecklist = carregarTabelaChecklist;
window.abrirModalChecklist = abrirModalChecklist;
window.salvarChecklistForm = salvarChecklistForm;
window.verDetalhesChecklist = verDetalhesChecklist;
window.excluirChecklist = excluirChecklist;
window.ehPrimeiroChecklistDoDia = ehPrimeiroChecklistDoDia;

console.log('✅ js/checklist.js carregado - Com fotos, localização e cintas!');
