// ============================================================
// MELHORIAS V2 - CHECK-LIST E FUNCIONALIDADES ADICIONAIS
// ============================================================
// 1. Adicionado campo "Lataria" nos itens de inspeção
// 2. Configuração de KM e Horímetro por veículo (habilitar/desabilitar)
// 3. Cintas não vem preenchidas - motorista deve preencher (obrigatório)
// 4. Check-list diário + primeiro do dia com alocação (origem/destino)
// 5. Sistema de transferência de motorista (solicitação + confirmação)
// ============================================================

// ---------- INICIALIZAÇÃO ----------
(function() {
    if (!BD.transferencias) BD.transferencias = [];
    if (!BD.alertasGestao) BD.alertasGestao = [];
    // Garantir que veículos existentes tenham as configurações padrão
    (BD.veiculos || []).forEach(v => {
        if (v.habilitaKm === undefined) v.habilitaKm = true;
        if (v.habilitaHorimetro === undefined) v.habilitaHorimetro = false;
    });
    salvarDados();
})();

// ---------- FUNÇÕES AUXILIARES ----------
function getConfigVeiculo(placa) {
    const v = BD.veiculos.find(x => x.placa === placa);
    return {
        habilitaKm: v?.habilitaKm !== false,
        habilitaHorimetro: v?.habilitaHorimetro === true
    };
}

function ehMesmoDia(dataISO) {
    const d = new Date(dataISO);
    const hoje = new Date();
    return d.getDate() === hoje.getDate() && 
           d.getMonth() === hoje.getMonth() && 
           d.getFullYear() === hoje.getFullYear();
}

function getUltimoChecklistVeiculo(placa) {
    const cls = BD.checklists.filter(c => c.veiculo === placa);
    if (cls.length === 0) return null;
    return cls.sort((a, b) => new Date(b.data) - new Date(a.data))[0];
}

function getChecklistsHojeVeiculo(placa) {
    return BD.checklists.filter(c => c.veiculo === placa && ehMesmoDia(c.data));
}

function ehPrimeiroChecklistDoDia(placa) {
    return getChecklistsHojeVeiculo(placa).length === 0;
}

// ---------- 1. ATUALIZAR MODAL VEÍCULO - ADICIONAR CONFIGURAÇÕES KM/HORÍMETRO ----------
const _abrirModalVeiculoV2 = abrirModalVeiculo;
abrirModalVeiculo = function(v = null) {
    if (!ehAdmin()) { mostrarToast('Você não tem permissão!', 'erro'); return; }
    const ed = !!v;
    const cats = BD.config.categoriasVeiculos.map(c => `<option value="${c.id}" ${v?.categoria===c.id?'selected':''}>${c.nome}</option>`).join('');
    const sts = Object.entries(BD.config.statusVeiculos).map(([val,nome])=>`<option value="${val}" ${v?.status===val?'selected':''}>${nome}</option>`).join('');
    
    const habKm = v?.habilitaKm !== false ? 'checked' : '';
    const habHor = v?.habilitaHorimetro === true ? 'checked' : '';
    
    const m = document.createElement('div');
    m.className = 'modal-fundo';
    m.onclick = e => { if(e.target===m) fecharModal(); };
    m.innerHTML = `<div class="modal-corpo"><div class="modal-cabecalho"><h3 style="margin:0;">${ed?'Editar':'Cadastrar'} Veículo</h3><button class="btn-fechar" onclick="fecharModal()" title="Fechar">×</button></div><div class="modal-conteudo"><form id="formVeiculo">
        <div class="linha-form"><label>Placa *</label><input type="text" id="vPlaca" style="text-transform:uppercase;" required value="${v?.placa||''}" ${ed?'readonly':''} placeholder="ABC1D23"></div>
        <div class="linha-form"><label>Ano</label><input type="number" id="vAno" value="${v?.ano||''}" min="1990" max="2030"></div>
        <div class="linha-form"><label>Categoria *</label><select id="vCategoria" required><option value="">Selecione</option>${cats}</select></div>
        <div class="linha-form"><label>Marca / Modelo *</label><input type="text" id="vModelo" required value="${v?.modelo||''}"></div>
        <div class="linha-form"><label>Km Atual *</label><input type="number" id="vKm" required value="${v?.km_atual||0}" min="0"></div>
        <div class="linha-form"><label>Status</label><select id="vStatus">${sts}</select></div>
        <div class="linha-form"><label>Obra / Local *</label><input type="text" id="vObra" required value="${v?.obra_atual||''}"></div>
        
        <div class="section-title">Configurações de Medição</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;">
            <div style="display:flex;align-items:center;gap:0.5rem;padding:0.75rem;background:#f8fafc;border-radius:0.5rem;border:1px solid #e2e8f0;">
                <input type="checkbox" id="vHabilitaKm" ${habKm} style="width:auto;min-width:20px;height:20px;">
                <label for="vHabilitaKm" style="margin:0;cursor:pointer;font-weight:500;">Habilitar campo KM</label>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;padding:0.75rem;background:#f8fafc;border-radius:0.5rem;border:1px solid #e2e8f0;">
                <input type="checkbox" id="vHabilitaHorimetro" ${habHor} style="width:auto;min-width:20px;height:20px;">
                <label for="vHabilitaHorimetro" style="margin:0;cursor:pointer;font-weight:500;">Habilitar campo Horímetro</label>
            </div>
        </div>
        <div style="font-size:0.75rem;color:#64748b;margin-bottom:1rem;padding:0.5rem;background:#eef2ff;border-radius:0.375rem;">
            <strong>Observação:</strong> Se desabilitado, os campos não aparecerão nos formulários. Se habilitado, serão de preenchimento OBRIGATÓRIO.
        </div>
        
        <div class="botoes-form"><button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button><button type="submit" class="btn btn-primary">${ed?'Salvar':'Cadastrar'}</button></div>
    </form></div></div>`;
    document.getElementById('modais').appendChild(m);
    
    document.getElementById('formVeiculo').addEventListener('submit', e => {
        e.preventDefault();
        const placa = document.getElementById('vPlaca').value.toUpperCase().trim();
        const categoria = document.getElementById('vCategoria').value;
        const modelo = document.getElementById('vModelo').value.trim();
        const ano = document.getElementById('vAno').value || null;
        const km = parseInt(document.getElementById('vKm').value) || 0;
        const status = document.getElementById('vStatus').value;
        const obra = document.getElementById('vObra').value.trim();
        const habilitaKm = document.getElementById('vHabilitaKm').checked;
        const habilitaHorimetro = document.getElementById('vHabilitaHorimetro').checked;
        
        const placaLimpa = placa.replace(/[^A-Z0-9]/g, '');
        if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placaLimpa) && !/^[A-Z]{3}[0-9]{4}$/.test(placaLimpa)) {
            mostrarToast('Placa inválida! Use: ABC1D23 ou ABC1234', 'erro');
            return;
        }
        if (!categoria || !modelo || !obra) { mostrarToast('Preencha todos os campos obrigatórios!', 'aviso'); return; }
        
        const dados = { 
            placa, categoria, modelo, marca: modelo.split(' ')[0], ano, 
            km_atual: km, km_inicial: ed ? (v?.km_inicial||km) : km, 
            status, obra_atual: obra,
            habilitaKm, habilitaHorimetro
        };
        
        if (ed) {
            const i = BD.veiculos.findIndex(x => String(x.id)===String(v.id));
            if (i!==-1) BD.veiculos[i] = { ...BD.veiculos[i], ...dados };
            registrarLog('edicao', `Editou veículo ${placa} - KM:${habilitaKm?'Habilitado':'Desabilitado'}, Hor:${habilitaHorimetro?'Habilitado':'Desabilitado'}`);
        } else {
            if (BD.veiculos.some(x => x.placa === placa)) { mostrarToast('Já existe veículo com esta placa!', 'erro'); return; }
            dados.id = gerarId(); BD.veiculos.push(dados);
            registrarLog('criacao', `Cadastrou veículo ${placa}`);
        }
        salvarDados(); mostrarToast('Veículo salvo com sucesso!', 'sucesso'); fecharModal();
        carregarTabelaVeiculos(); atualizarDashboard(); atualizarListaVeiculosNosFiltros();
    });
};

// ---------- 2. ATUALIZAR FORMULÁRIO DO CHECK-LIST ----------
const _atualizarFormChecklistV2 = atualizarFormChecklistPorCategoria;
atualizarFormChecklistPorCategoria = function() {
    const sel = document.getElementById('clVeiculo');
    const cat = sel.options[sel.selectedIndex]?.dataset.categoria;
    const placa = sel.value;
    const cont = document.getElementById('clCamposDinamicos');
    if (!cat || !cont) return;
    
    const cc = BD.config.categoriasVeiculos.find(c=>c.id===cat);
    const pc = cc?.precisaCintas;
    const pfb = cc?.precisaFotosBancos;
    const req = BD.config.requisitosCintas;
    const config = getConfigVeiculo(placa);
    const primeiroDoDia = ehPrimeiroChecklistDoDia(placa);
    const ultimoCl = getUltimoChecklistVeiculo(placa);
    
    // Verificar se já tem check-list hoje do mesmo motorista
    const clsHoje = getChecklistsHojeVeiculo(placa);
    const mesmoMotoristaHoje = clsHoje.some(c => c.usuarioId === window.usuarioAtual?.id);
    
    if (mesmoMotoristaHoje && ultimoCl) {
        cont.innerHTML = `<div style="text-align:center;padding:2rem;">
            <div style="font-size:3rem;margin-bottom:1rem;">ℹ️</div>
            <h3 style="color:#4338ca;margin-bottom:0.5rem;">Check-list já realizado hoje</h3>
            <p style="color:#64748b;margin-bottom:1rem;">Você já realizou o check-list deste veículo hoje às <strong>${new Date(ultimoCl.data).toLocaleTimeString('pt-BR')}</strong>.</p>
            <p style="color:#94a3b8;font-size:0.875rem;">O check-list é diário. Caso haja troca de motorista, o novo condutor deverá realizar um novo check-list.</p>
            <button class="btn btn-secondary" style="margin-top:1rem;" onclick="fecharModal()">Fechar</button>
        </div>`;
        return;
    }
    
    let h = '';
    
    // Aviso de troca de motorista
    if (ultimoCl && ultimoCl.usuarioId !== window.usuarioAtual?.id && ehMesmoDia(ultimoCl.data)) {
        h += `<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:1rem;border-radius:0.5rem;margin-bottom:1rem;">
            <div style="display:flex;align-items:center;gap:0.5rem;color:#92400e;font-weight:600;">
                <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                Troca de Motorista detectada!
            </div>
            <p style="color:#78350f;font-size:0.875rem;margin:0.5rem 0 0;">Último check-list realizado por <strong>${ultimoCl.usuarioNome}</strong> em ${new Date(ultimoCl.data).toLocaleString('pt-BR')}.</p>
        </div>`;
    }
    
    // Primeiro check-list do dia - campos de alocação
    if (primeiroDoDia) {
        h += `<div class="section-title">📍 Alocação - Primeiro check-list do dia</div>
            <div style="background:#eef2ff;padding:1rem;border-radius:0.5rem;border:1px solid #c7d2fe;margin-bottom:1rem;">
                <p style="color:#4338ca;font-size:0.875rem;margin-bottom:1rem;font-weight:500;">Por ser o primeiro check-list do dia, informe a alocação:</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                    <div><label>Origem *</label><input type="text" id="clOrigem" required placeholder="Local de origem"></div>
                    <div><label>Destino *</label><input type="text" id="clDestino" required placeholder="Local de destino"></div>
                </div>
            </div>`;
    }
    
    // Campos de KM e Horímetro (se habilitados)
    if (config.habilitaKm || config.habilitaHorimetro) {
        h += `<div class="section-title">📊 Medição</div>
            <div style="display:grid;grid-template-columns:${config.habilitaKm && config.habilitaHorimetro ? '1fr 1fr' : '1fr'};gap:1rem;margin-bottom:1rem;">`;
        if (config.habilitaKm) {
            h += `<div><label>KM Atual *</label><input type="number" id="clKmAtual" required min="0" placeholder="Informe o KM"></div>`;
        }
        if (config.habilitaHorimetro) {
            h += `<div><label>Horímetro *</label><input type="number" id="clHorimetro" required min="0" step="0.1" placeholder="Informe o horímetro"></div>`;
        }
        h += `</div>`;
    }
    
    // Itens de inspeção - ADICIONADO LATARIA
    h += `<div class="section-title">🔍 Itens de Inspeção</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
            <div><label>Óleo</label><select id="clOleo"><option value="ok">OK</option><option value="baixo">Baixo</option><option value="critico">Crítico</option></select></div>
            <div><label>Água</label><select id="clAgua"><option value="ok">OK</option><option value="baixo">Baixo</option><option value="critico">Crítico</option></select></div>
            <div><label>Pneus</label><select id="clPneus"><option value="ok">OK</option><option value="calibrar">Calibrar</option><option value="trocar">Trocar</option></select></div>
            <div><label>Freios</label><select id="clFreios"><option value="ok">OK</option><option value="verificar">Verificar</option><option value="critico">Crítico</option></select></div>
            <div><label>Luzes</label><select id="clLuzes"><option value="ok">OK</option><option value="queimada">Queimada</option></select></div>
            <div><label>Higiene</label><select id="clHigiene"><option value="ok">Limpo</option><option value="sujo">Sujo</option></select></div>
            <div><label>Lataria</label><select id="clLataria"><option value="ok">OK</option><option value="amassada">Amassada</option><option value="riscada">Riscada</option><option value="danificada">Danificada</option></select></div>
            <div><label>Estado Geral</label><select id="clEstadoGeral"><option value="bom">Bom</option><option value="regular">Regular</option><option value="ruim">Ruim</option></select></div>
        </div>
        <div class="linha-form" style="margin-top:1rem;"><label>Observações Gerais</label><textarea id="clObservacoes" rows="2"></textarea></div>`;
    
    // Cintas - NÃO VEM PREENCHIDAS, MOTORISTA DEVE PREENCHER (OBRIGATÓRIO)
    if (pc) {
        h += `<div class="section-title">🔗 Verificação de Cintas - OBRIGATÓRIO</div>
            <div style="background:#fef2f2;padding:1rem;border-radius:0.5rem;border:1px solid #fecaca;margin-bottom:1rem;">
                <p style="color:#991b1b;font-size:0.875rem;margin:0 0 1rem;font-weight:600;">
                    ⚠️ PREENCHA TODOS OS CAMPOS - O sistema compara com o mínimo exigido
                </p>
                <p style="color:#7f1d1d;font-size:0.8rem;margin:0 0 1rem;">
                    <strong>Mínimo exigido:</strong> ${req.cintas2m}x 2m | ${req.cintas3m}x 3m | ${req.cintas4m}x 4m | ${req.cintas6m}x 6m | ${req.cintasCatraca}x Catraca | ${req.catracas}x Catracas
                </p>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;">
                    <div><label>Cintas 2m *</label><input type="number" id="clCintas2m" min="0" required placeholder="0"></div>
                    <div><label>Cintas 3m *</label><input type="number" id="clCintas3m" min="0" required placeholder="0"></div>
                    <div><label>Cintas 4m *</label><input type="number" id="clCintas4m" min="0" required placeholder="0"></div>
                    <div><label>Cintas 6m *</label><input type="number" id="clCintas6m" min="0" required placeholder="0"></div>
                    <div><label>Cintas Catraca *</label><input type="number" id="clCintasCatraca" min="0" required placeholder="0"></div>
                    <div><label>Catracas *</label><input type="number" id="clCatracas" min="0" required placeholder="0"></div>
                </div>
            </div>`;
    }
    
    // Registro Fotográfico
    h += `<div class="section-title">📸 Registro Fotográfico</div>
        <p style="color:#64748b;font-size:0.875rem;margin-bottom:1rem;">Clique para capturar foto no momento.</p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;">
            <div><label style="font-size:0.8125rem;">Painel (km) *</label><div class="foto-container" onclick="capturarFoto('fotoPainel')" id="box-fotoPainel"><div style="font-size:2rem;">📷</div><div style="font-size:0.8125rem;color:#64748b;">Clique para foto</div></div><input type="hidden" id="fotoPainel"><input type="text" id="obsPainel" placeholder="Observação..." style="margin-top:0.5rem;font-size:0.8125rem;"></div>
            <div><label style="font-size:0.8125rem;">Frente *</label><div class="foto-container" onclick="capturarFoto('fotoFrente')" id="box-fotoFrente"><div style="font-size:2rem;">📷</div><div style="font-size:0.8125rem;color:#64748b;">Clique para foto</div></div><input type="hidden" id="fotoFrente"><input type="text" id="obsFrente" placeholder="Observação..." style="margin-top:0.5rem;font-size:0.8125rem;"></div>
            <div><label style="font-size:0.8125rem;">Traseira *</label><div class="foto-container" onclick="capturarFoto('fotoTraseira')" id="box-fotoTraseira"><div style="font-size:2rem;">📷</div><div style="font-size:0.8125rem;color:#64748b;">Clique para foto</div></div><input type="hidden" id="fotoTraseira"><input type="text" id="obsTraseira" placeholder="Observação..." style="margin-top:0.5rem;font-size:0.8125rem;"></div>
        </div>`;
    
    if (pc) {
        h += `<div style="margin-top:1rem;"><label style="font-size:0.8125rem;">Caixa de Cintas *</label><div class="foto-container" onclick="capturarFoto('fotoCintas')" id="box-fotoCintas" style="max-width:33%;"><div style="font-size:2rem;">📷</div><div style="font-size:0.8125rem;color:#64748b;">Foto da caixa</div></div><input type="hidden" id="fotoCintas"><input type="text" id="obsCintas" placeholder="Observação..." style="margin-top:0.5rem;font-size:0.8125rem;max-width:33%;"></div>`;
    }
    
    if (pfb) {
        h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem;">
            <div><label style="font-size:0.8125rem;">Banco Esq. *</label><div class="foto-container" onclick="capturarFoto('fotoBanco1')" id="box-fotoBanco1"><div style="font-size:2rem;">📷</div><div style="font-size:0.8125rem;color:#64748b;">Clique</div></div><input type="hidden" id="fotoBanco1"></div>
            <div><label style="font-size:0.8125rem;">Banco Dir. *</label><div class="foto-container" onclick="capturarFoto('fotoBanco2')" id="box-fotoBanco2"><div style="font-size:2rem;">📷</div><div style="font-size:0.8125rem;color:#64748b;">Clique</div></div><input type="hidden" id="fotoBanco2"></div>
        </div><div class="linha-form" style="margin-top:0.75rem;"><label>Observação dos Bancos</label><textarea id="obsBancos" rows="2"></textarea></div>`;
    }
    
    h += `<div class="section-title">📍 Localização</div>
        <div id="clLocalizacao" style="background:#f0fdf4;padding:1rem;border-radius:0.5rem;border:1px solid #bbf7d0;"><div style="display:flex;align-items:center;gap:0.5rem;color:#166534;"><span>🔄</span><span>Obtendo localização...</span></div></div>
        <input type="hidden" id="clLatitude"><input type="hidden" id="clLongitude">`;
    
    cont.innerHTML = h;
    obterLocalizacao();
};

// ---------- 3. ATUALIZAR SALVAR CHECK-LIST ----------
const _salvarChecklistV2 = salvarChecklist;
salvarChecklist = function() {
    const veiculo = document.getElementById('clVeiculo').value;
    if (!veiculo) { mostrarToast('Selecione um veículo!', 'aviso'); return; }
    
    const sel = document.getElementById('clVeiculo');
    const cat = sel.options[sel.selectedIndex]?.dataset.categoria;
    const cc = BD.config.categoriasVeiculos.find(c=>c.id===cat);
    const config = getConfigVeiculo(veiculo);
    const primeiroDoDia = ehPrimeiroChecklistDoDia(veiculo);
    
    // === VALIDAÇÃO DE ALCAÇÃO (primeiro do dia) ===
    if (primeiroDoDia) {
        const origem = document.getElementById('clOrigem')?.value?.trim();
        const destino = document.getElementById('clDestino')?.value?.trim();
        if (!origem || !destino) {
            mostrarToast('Preencha Origem e Destino (primeiro check-list do dia)!', 'erro');
            return;
        }
    }
    
    // === VALIDAÇÃO DE KM E HORÍMETRO ===
    if (config.habilitaKm) {
        const km = document.getElementById('clKmAtual')?.value;
        if (!km || km === '') {
            mostrarToast('Preencha o KM Atual (obrigatório para este veículo)!', 'erro');
            return;
        }
    }
    if (config.habilitaHorimetro) {
        const hor = document.getElementById('clHorimetro')?.value;
        if (!hor || hor === '') {
            mostrarToast('Preencha o Horímetro (obrigatório para este veículo)!', 'erro');
            return;
        }
    }
    
    // === VALIDAÇÃO DE FOTOS OBRIGATÓRIAS ===
    const fotosObrigatorias = ['Painel', 'Frente', 'Traseira'];
    if (cc?.precisaCintas) fotosObrigatorias.push('Cintas');
    if (cc?.precisaFotosBancos) fotosObrigatorias.push('Banco 1', 'Banco 2');
    
    const fotosFaltando = [];
    if (!document.getElementById('fotoPainel')?.value) fotosFaltando.push('Painel');
    if (!document.getElementById('fotoFrente')?.value) fotosFaltando.push('Frente');
    if (!document.getElementById('fotoTraseira')?.value) fotosFaltando.push('Traseira');
    if (cc?.precisaCintas && !document.getElementById('fotoCintas')?.value) fotosFaltando.push('Cintas');
    if (cc?.precisaFotosBancos) {
        if (!document.getElementById('fotoBanco1')?.value) fotosFaltando.push('Banco 1');
        if (!document.getElementById('fotoBanco2')?.value) fotosFaltando.push('Banco 2');
    }
    
    if (fotosFaltando.length > 0) {
        mostrarToast('Capture as fotos obrigatórias: ' + fotosFaltando.join(', '), 'erro');
        return;
    }
    
    const fotos = {};
    const obsFotos = {};
    ['fotoPainel','fotoFrente','fotoTraseira'].forEach(c => { const el = document.getElementById(c); if (el?.value) fotos[c] = el.value; });
    ['Painel','Frente','Traseira','Cintas','Bancos'].forEach(c => { const el = document.getElementById('obs'+c); if (el?.value) obsFotos[c.toLowerCase()] = el.value; });
    
    if (cc?.precisaCintas) { const fc = document.getElementById('fotoCintas'); if (fc?.value) fotos['fotoCintas'] = fc.value; }
    if (cc?.precisaFotosBancos) { ['fotoBanco1','fotoBanco2'].forEach(c => { const el = document.getElementById(c); if (el?.value) fotos[c] = el.value; }); }
    
    const dados = {
        id: gerarId(), veiculo, categoria: cat,
        data: new Date().toISOString(),
        usuarioId: window.usuarioAtual?.id, usuarioNome: window.usuarioAtual?.nome,
        itens: {
            oleo: document.getElementById('clOleo')?.value,
            agua: document.getElementById('clAgua')?.value,
            pneus: document.getElementById('clPneus')?.value,
            freios: document.getElementById('clFreios')?.value,
            luzes: document.getElementById('clLuzes')?.value,
            higiene: document.getElementById('clHigiene')?.value,
            lataria: document.getElementById('clLataria')?.value,
            estadoGeral: document.getElementById('clEstadoGeral')?.value
        },
        observacoes: document.getElementById('clObservacoes')?.value || '',
        fotos, observacoesFotos: obsFotos,
        latitude: document.getElementById('clLatitude')?.value || null,
        longitude: document.getElementById('clLongitude')?.value || null,
        status: 'concluido',
        primeiroDoDia: primeiroDoDia
    };
    
    // Adicionar dados de alocação se for primeiro do dia
    if (primeiroDoDia) {
        dados.origem = document.getElementById('clOrigem')?.value?.trim();
        dados.destino = document.getElementById('clDestino')?.value?.trim();
    }
    
    // Adicionar KM e Horímetro se habilitados
    if (config.habilitaKm) {
        dados.kmAtual = parseInt(document.getElementById('clKmAtual')?.value) || 0;
    }
    if (config.habilitaHorimetro) {
        dados.horimetro = parseFloat(document.getElementById('clHorimetro')?.value) || 0;
    }
    
    // === VALIDAÇÃO E SALVAMENTO DE CINTAS ===
    if (cc?.precisaCintas) {
        const c2m = document.getElementById('clCintas2m')?.value;
        const c3m = document.getElementById('clCintas3m')?.value;
        const c4m = document.getElementById('clCintas4m')?.value;
        const c6m = document.getElementById('clCintas6m')?.value;
        const ccat = document.getElementById('clCintasCatraca')?.value;
        const catr = document.getElementById('clCatracas')?.value;
        
        if (c2m === '' || c3m === '' || c4m === '' || c6m === '' || ccat === '' || catr === '') {
            mostrarToast('Preencha TODOS os campos de cintas!', 'erro');
            return;
        }
        
        const cintas = {
            cintas2m: parseInt(c2m) || 0,
            cintas3m: parseInt(c3m) || 0,
            cintas4m: parseInt(c4m) || 0,
            cintas6m: parseInt(c6m) || 0,
            cintasCatraca: parseInt(ccat) || 0,
            catracas: parseInt(catr) || 0
        };
        dados.cintas = cintas;
        
        const req = BD.config.requisitosCintas;
        const faltando = [];
        Object.entries(req).forEach(([it, min]) => { if ((cintas[it]||0) < min) faltando.push(`${it}: ${cintas[it]||0}/${min}`); });
        if (faltando.length > 0) {
            dados.alertaGerado = true;
            BD.alertas.push({ id: gerarId(), veiculo, data: new Date().toISOString(), motivo: `Cintas em falta: ${faltando.join(', ')}`, detalhes: faltando, resolvido: false, resolvidoPor: null, resolvidoEm: null, observacaoGestor: null });
        }
    }
    
    BD.checklists.push(dados);
    salvarDados();
    registrarLog('criacao', `Check-list: ${veiculo}${primeiroDoDia?' (1º do dia)':''}${dados.kmAtual?` KM:${dados.kmAtual}`:''}`);
    
    if (dados.alertaGerado) {
        alert('⚠️ Salvo! ATENÇÃO: Alerta de cintas gerado.');
    } else {
        mostrarToast('Check-list salvo com sucesso!', 'sucesso');
    }
    
    fecharModal(); carregarTabelaChecklist(); atualizarDashboard();
};

// ---------- 4. ATUALIZAR TABELA CHECK-LIST PARA MOSTRAR NOVOS CAMPOS ----------
const _carregarTabelaChecklistV2 = carregarTabelaChecklist;
carregarTabelaChecklist = function() {
    _carregarTabelaChecklistV2();
    // A implementação original já carrega a tabela. 
    // Se precisarmos adicionar colunas novas, sobrescreveríamos completamente.
    // Por enquanto mantemos a original funcionando.
};

// ---------- 5. SISTEMA DE TRANSFERÊNCIA DE MOTORISTA ----------
function abrirModalSolicitarTransferencia(placa = null) {
    if (ehVisitante() || ehAdmin() || ehSupervisor()) { 
        mostrarToast('Apenas motoristas podem solicitar transferência!', 'erro'); 
        return; 
    }
    
    const veiculosPermitidos = getVeiculosPermitidos();
    if (veiculosPermitidos.length === 0) {
        mostrarToast('Você não tem veículos vinculados!', 'erro');
        return;
    }
    
    // Motoristas disponíveis (outros usuários operacionais ativos)
    const motoristas = BD.usuarios.filter(u => 
        u.perfil === 'operacional' && 
        u.ativo && 
        String(u.id) !== String(window.usuarioAtual?.id)
    );
    
    if (motoristas.length === 0) {
        mostrarToast('Não há outros motoristas cadastrados!', 'erro');
        return;
    }
    
    const opsVeiculos = veiculosPermitidos.map(v => 
        `<option value="${v.placa}" ${placa===v.placa?'selected':''}>${v.placa} - ${v.modelo}</option>`
    ).join('');
    
    const opsMotoristas = motoristas.map(m => 
        `<option value="${m.id}">${m.nome} (${m.usuario})</option>`
    ).join('');
    
    const m = document.createElement('div');
    m.className = 'modal-fundo';
    m.onclick = e => { if(e.target===m) fecharModal(); };
    m.innerHTML = `<div class="modal-corpo" style="max-width:480px;">
        <div class="modal-cabecalho">
            <h3 style="margin:0;">🔄 Solicitar Transferência de Veículo</h3>
            <button class="btn-fechar" onclick="fecharModal()">×</button>
        </div>
        <div class="modal-conteudo">
            <form id="formTransferencia">
                <div class="linha-form"><label>Veículo *</label><select id="trVeiculo" required>${opsVeiculos}</select></div>
                <div class="linha-form"><label>Transferir para *</label><select id="trMotoristaDestino" required>${opsMotoristas}</select></div>
                <div class="linha-form"><label>Observação / Motivo</label><textarea id="trObservacao" rows="2" placeholder="Informe o motivo da transferência..."></textarea></div>
                <div style="background:#fef3c7;padding:0.75rem;border-radius:0.5rem;border-left:3px solid #f59e0b;margin-bottom:1rem;">
                    <p style="color:#92400e;font-size:0.8rem;margin:0;">
                        ⚠️ O motorista destinatário receberá uma notificação e deverá CONFIRMAR a transferência. 
                        Admins e supervisores serão avisados automaticamente.
                    </p>
                </div>
                <div class="botoes-form">
                    <button type="button" class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">📤 Solicitar Transferência</button>
                </div>
            </form>
        </div>
    </div>`;
    document.getElementById('modais').appendChild(m);
    
    document.getElementById('formTransferencia').addEventListener('submit', e => {
        e.preventDefault();
        const veiculo = document.getElementById('trVeiculo').value;
        const destinoId = document.getElementById('trMotoristaDestino').value;
        const obs = document.getElementById('trObservacao').value.trim();
        
        const destino = BD.usuarios.find(u => String(u.id) === String(destinoId));
        
        const transferencia = {
            id: gerarId(),
            veiculo,
            solicitanteId: window.usuarioAtual?.id,
            solicitanteNome: window.usuarioAtual?.nome,
            destinoId,
            destinoNome: destino?.nome,
            observacao: obs,
            dataSolicitacao: new Date().toISOString(),
            dataConfirmacao: null,
            status: 'pendente'
        };
        
        BD.transferencias.push(transferencia);
        
        // Criar alerta para admins e supervisores
        BD.alertasGestao.push({
            id: gerarId(),
            tipo: 'transferencia_solicitada',
            mensagem: `Transferência solicitada: ${window.usuarioAtual?.nome} → ${destino?.nome} (Veículo: ${veiculo})`,
            transferenciaId: transferencia.id,
            data: new Date().toISOString(),
            lido: false
        });
        
        salvarDados();
        registrarLog('solicitacao', `Solicitou transferência do veículo ${veiculo} para ${destino?.nome}`);
        mostrarToast('Transferência solicitada! Aguardando confirmação.', 'sucesso');
        fecharModal();
    });
}

function abrirModalConfirmarTransferencias() {
    if (ehVisitante()) { mostrarToast('Sem permissão!', 'erro'); return; }
    
    const minhasPendentes = BD.transferencias.filter(t => 
        String(t.destinoId) === String(window.usuarioAtual?.id) && 
        t.status === 'pendente'
    );
    
    const m = document.createElement('div');
    m.className = 'modal-fundo';
    m.onclick = e => { if(e.target===m) fecharModal(); };
    
    let listaHtml = '';
    if (minhasPendentes.length === 0) {
        listaHtml = '<div style="text-align:center;padding:2rem;color:#94a3b8;">Nenhuma transferência pendente de confirmação.</div>';
    } else {
        listaHtml = minhasPendentes.map(t => `
            <div style="border:1px solid #e2e8f0;border-radius:0.75rem;padding:1rem;margin-bottom:0.75rem;border-left:4px solid #4f46e5;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap;">
                    <div style="flex:1;">
                        <div style="font-weight:600;margin-bottom:0.25rem;">
                            🚛 Veículo: <span style="font-family:monospace;">${t.veiculo}</span>
                        </div>
                        <div style="font-size:0.875rem;color:#64748b;margin-bottom:0.25rem;">
                            De: <strong>${t.solicitanteNome}</strong>
                        </div>
                        <div style="font-size:0.8rem;color:#94a3b8;">
                            📅 ${new Date(t.dataSolicitacao).toLocaleString('pt-BR')}
                        </div>
                        ${t.observacao ? `<div style="font-size:0.85rem;color:#475569;margin-top:0.5rem;background:#f8fafc;padding:0.5rem;border-radius:0.375rem;">📝 ${t.observacao}</div>` : ''}
                    </div>
                    <div style="display:flex;gap:0.5rem;">
                        <button class="btn btn-primary" style="padding:0.375rem 0.75rem;font-size:0.8rem;" onclick="confirmarTransferencia('${t.id}')">✓ Confirmar</button>
                        <button class="btn btn-danger" style="padding:0.375rem 0.75rem;font-size:0.8rem;" onclick="rejeitarTransferencia('${t.id}')">✗ Rejeitar</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    m.innerHTML = `<div class="modal-corpo" style="max-width:560px;">
        <div class="modal-cabecalho">
            <h3 style="margin:0;">📥 Transferências Pendentes (${minhasPendentes.length})</h3>
            <button class="btn-fechar" onclick="fecharModal()">×</button>
        </div>
        <div class="modal-conteudo">
            ${listaHtml}
            <div class="botoes-form" style="margin-top:1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="fecharModal()">Fechar</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modais').appendChild(m);
}

function confirmarTransferencia(id) {
    const t = BD.transferencias.find(x => x.id === id);
    if (!t) return;
    
    t.status = 'confirmada';
    t.dataConfirmacao = new Date().toISOString();
    
    // Transferir acesso do veículo
    // Remover do solicitante
    if (BD.acessosVeiculos[t.solicitanteId]) {
        BD.acessosVeiculos[t.solicitanteId] = BD.acessosVeiculos[t.solicitanteId].filter(p => p !== t.veiculo);
    }
    // Adicionar ao destinatário
    if (!BD.acessosVeiculos[t.destinoId]) BD.acessosVeiculos[t.destinoId] = [];
    if (!BD.acessosVeiculos[t.destinoId].includes(t.veiculo)) {
        BD.acessosVeiculos[t.destinoId].push(t.veiculo);
    }
    
    // Alerta para admins/supervisores
    BD.alertasGestao.push({
        id: gerarId(),
        tipo: 'transferencia_confirmada',
        mensagem: `✅ Transferência CONFIRMADA: ${t.solicitanteNome} → ${t.destinoNome} (Veículo: ${t.veiculo})`,
        transferenciaId: id,
        data: new Date().toISOString(),
        lido: false
    });
    
    salvarDados();
    registrarLog('confirmacao', `Confirmou transferência do veículo ${t.veiculo}`);
    mostrarToast('Transferência confirmada! Acesso atualizado.', 'sucesso');
    fecharModal();
    abrirModalConfirmarTransferencias();
}

function rejeitarTransferencia(id) {
    mostrarConfirmacao('Tem certeza que deseja REJEITAR esta transferência?', function() {
        const t = BD.transferencias.find(x => x.id === id);
        if (!t) return;
        
        t.status = 'rejeitada';
        t.dataConfirmacao = new Date().toISOString();
        
        BD.alertasGestao.push({
            id: gerarId(),
            tipo: 'transferencia_rejeitada',
            mensagem: `❌ Transferência REJEITADA: ${t.solicitanteNome} → ${t.destinoNome} (Veículo: ${t.veiculo})`,
            transferenciaId: id,
            data: new Date().toISOString(),
            lido: false
        });
        
        salvarDados();
        registrarLog('rejeicao', `Rejeitou transferência do veículo ${t.veiculo}`);
        mostrarToast('Transferência rejeitada.', 'aviso');
        fecharModal();
        abrirModalConfirmarTransferencias();
    });
}

// ---------- 6. ADICIONAR BOTÕES DE TRANSFERÊNCIA NA INTERFACE ----------
// Sobrescrever a função mostrarSistema para adicionar botões no menu
const _mostrarSistemaV2 = mostrarSistema;
mostrarSistema = function() {
    _mostrarSistemaV2();
    
    // Adicionar botões de transferência após um pequeno delay
    setTimeout(() => {
        // Verificar se já adicionamos os botões
        if (document.getElementById('btn-solicitar-transf')) return;
        
        const nav = document.querySelector('nav');
        if (!nav) return;
        
        // Para motoristas: botão de solicitar e confirmar transferências
        if (ehOperacional()) {
            const pendentes = BD.transferencias.filter(t => 
                String(t.destinoId) === String(window.usuarioAtual?.id) && 
                t.status === 'pendente'
            ).length;
            
            const btnSolicitar = document.createElement('button');
            btnSolicitar.id = 'btn-solicitar-transf';
            btnSolicitar.className = 'sidebar-link';
            btnSolicitar.innerHTML = `<span>🔄</span> Solicitar Transferência`;
            btnSolicitar.onclick = abrirModalSolicitarTransferencia;
            nav.appendChild(btnSolicitar);
            
            const btnConfirmar = document.createElement('button');
            btnConfirmar.id = 'btn-confirmar-transf';
            btnConfirmar.className = 'sidebar-link';
            btnConfirmar.innerHTML = `<span>📥</span> Confirmar Transferências ${pendentes > 0 ? `<span class="badge badge-danger" style="margin-left:auto;">${pendentes}</span>` : ''}`;
            btnConfirmar.onclick = abrirModalConfirmarTransferencias;
            nav.appendChild(btnConfirmar);
        }
        
        // Para admins e supervisores: ver alertas de gestão
        if (ehAdmin() || ehSupervisor()) {
            const alertasNaoLidos = BD.alertasGestao.filter(a => !a.lido).length;
            
            const btnAlertas = document.createElement('button');
            btnAlertas.id = 'btn-alertas-gestao';
            btnAlertas.className = 'sidebar-link';
            btnAlertas.innerHTML = `<span>🔔</span> Alertas de Gestão ${alertasNaoLidos > 0 ? `<span class="badge badge-danger" style="margin-left:auto;">${alertasNaoLidos}</span>` : ''}`;
            btnAlertas.onclick = abrirModalAlertasGestao;
            nav.appendChild(btnAlertas);
        }
    }, 100);
};

function abrirModalAlertasGestao() {
    if (!ehAdmin() && !ehSupervisor()) { mostrarToast('Sem permissão!', 'erro'); return; }
    
    const alertas = [...BD.alertasGestao].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    // Marcar todos como lidos
    BD.alertasGestao.forEach(a => a.lido = true);
    salvarDados();
    
    const m = document.createElement('div');
    m.className = 'modal-fundo';
    m.onclick = e => { if(e.target===m) fecharModal(); };
    
    let listaHtml = '';
    if (alertas.length === 0) {
        listaHtml = '<div style="text-align:center;padding:2rem;color:#94a3b8;">Nenhum alerta de gestão.</div>';
    } else {
        listaHtml = alertas.map(a => {
            const cor = a.tipo.includes('confirmada') ? '#dcfce7' : 
                        a.tipo.includes('rejeitada') ? '#fee2e2' : '#fef3c7';
            const corBorda = a.tipo.includes('confirmada') ? '#16a34a' : 
                            a.tipo.includes('rejeitada') ? '#dc2626' : '#d97706';
            return `
                <div style="background:${cor};border-left:4px solid ${corBorda};padding:1rem;border-radius:0.5rem;margin-bottom:0.75rem;">
                    <div style="font-weight:600;color:#1e293b;">${a.mensagem}</div>
                    <div style="font-size:0.8rem;color:#64748b;margin-top:0.25rem;">📅 ${new Date(a.data).toLocaleString('pt-BR')}</div>
                </div>
            `;
        }).join('');
    }
    
    m.innerHTML = `<div class="modal-corpo" style="max-width:560px;max-height:80vh;display:flex;flex-direction:column;">
        <div class="modal-cabecalho" style="flex-shrink:0;">
            <h3 style="margin:0;">🔔 Alertas de Gestão</h3>
            <button class="btn-fechar" onclick="fecharModal()">×</button>
        </div>
        <div class="modal-conteudo" style="overflow-y:auto;">
            ${listaHtml}
            <div class="botoes-form" style="margin-top:1.5rem;">
                <button type="button" class="btn btn-secondary" onclick="fecharModal()">Fechar</button>
            </div>
        </div>
    </div>`;
    document.getElementById('modais').appendChild(m);
    
    // Atualizar contador no menu
    const btn = document.getElementById('btn-alertas-gestao');
    if (btn) {
        btn.innerHTML = `<span>🔔</span> Alertas de Gestão`;
    }
}

// ---------- 7. ATUALIZAR MODAIS DE GASTOS, MANUTENÇÃO, CHAMADOS, ALOCAÇÕES ----------
// Função auxiliar para adicionar campos de KM/Horímetro em formulários
function adicionarCamposMedicao(placa, containerId) {
    const config = getConfigVeiculo(placa);
    const container = document.getElementById(containerId);
    if (!container) return '';
    
    let html = '';
    if (config.habilitaKm || config.habilitaHorimetro) {
        html += `<div class="section-title">📊 Medição do Veículo</div>
            <div style="display:grid;grid-template-columns:${config.habilitaKm && config.habilitaHorimetro ? '1fr 1fr' : '1fr'};gap:1rem;margin-bottom:1rem;">`;
        if (config.habilitaKm) {
            html += `<div><label>KM Atual *</label><input type="number" id="formKmAtual" required min="0" placeholder="Informe o KM"></div>`;
        }
        if (config.habilitaHorimetro) {
            html += `<div><label>Horímetro *</label><input type="number" id="formHorimetro" required min="0" step="0.1" placeholder="Informe o horímetro"></div>`;
        }
        html += `</div>`;
    }
    return html;
}

// Sobrescrever abrirModalGasto para adicionar campos
const _abrirModalGastoV2 = abrirModalGasto;
abrirModalGasto = function(g = null) {
    _abrirModalGastoV2(g);
    
    setTimeout(() => {
        const form = document.getElementById('formGasto');
        if (!form) return;
        
        // Adicionar listener no select de veículo para atualizar campos
        const selVeiculo = document.getElementById('gVeiculo');
        if (selVeiculo) {
            selVeiculo.addEventListener('change', function() {
                atualizarCamposMedicaoForm(this.value, 'camposMedicaoGasto', 'gasto');
            });
            // Inicializar
            if (selVeiculo.value) {
                atualizarCamposMedicaoForm(selVeiculo.value, 'camposMedicaoGasto', 'gasto');
            }
        }
        
        // Inserir container para campos de medição antes dos botões
        const botoes = form.querySelector('.botoes-form');
        if (botoes && !document.getElementById('camposMedicaoGasto')) {
            const container = document.createElement('div');
            container.id = 'camposMedicaoGasto';
            botoes.parentNode.insertBefore(container, botoes);
        }
    }, 50);
};

function atualizarCamposMedicaoForm(placa, containerId, tipoForm) {
    const config = getConfigVeiculo(placa);
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!config.habilitaKm && !config.habilitaHorimetro) {
        container.innerHTML = '';
        return;
    }
    
    let html = `<div class="section-title">📊 Medição do Veículo</div>
        <div style="display:grid;grid-template-columns:${config.habilitaKm && config.habilitaHorimetro ? '1fr 1fr' : '1fr'};gap:1rem;margin-bottom:1rem;">`;
    if (config.habilitaKm) {
        html += `<div><label>KM Atual *</label><input type="number" id="${tipoForm}KmAtual" required min="0" placeholder="Informe o KM"></div>`;
    }
    if (config.habilitaHorimetro) {
        html += `<div><label>Horímetro *</label><input type="number" id="${tipoForm}Horimetro" required min="0" step="0.1" placeholder="Informe o horímetro"></div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
}

console.log('%c✅ Melhorias V2 carregadas com sucesso!', 'color:green;font-weight:bold;font-size:14px;');
console.log('Funcionalidades:');
console.log('  1. Campo Lataria adicionado na inspeção');
console.log('  2. Configuração KM/Horímetro por veículo');
console.log('  3. Cintas vazias e obrigatórias');
console.log('  4. Check-list diário + primeiro do dia com alocação');
console.log('  5. Sistema de transferência de motorista');
