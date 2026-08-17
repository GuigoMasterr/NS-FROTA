const BD = window.BD;

// ==========================================
//    SALVAR VEÍCULO — com SINCRONIZAÇÃO AUTOMÁTICA
// ==========================================
async function salvarVeiculo(veiculo) {
    const placaOriginal = veiculo.placa || '';
    veiculo.placa = placaOriginal.toUpperCase().trim() || 'SEM PLACA';

    const indice = BD.veiculos.findIndex(v => v.id === veiculo.id);

    if (indice >= 0) {
        BD.veiculos[indice] = veiculo;
    } else {
        veiculo.id = BD.veiculos.length > 0 
            ? Math.max(...BD.veiculos.map(v => v.id)) + 1 
            : 1;
        BD.veiculos.push(veiculo);
    }

    salvarDados();
    fecharModal('modalVeiculo');
    carregarTabelaVeiculos();

    // ✅ SINCRONIZA AUTOMATICAMENTE com o Supabase
    await sincronizarVeiculoNoSupabase(veiculo);
}

// ==========================================
//    EXCLUIR VEÍCULO — com SINCRONIZAÇÃO AUTOMÁTICA
// ==========================================
async function excluirVeiculo(id) {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return;

    BD.veiculos = BD.veiculos.filter(v => v.id !== id);
    salvarDados();
    carregarTabelaVeiculos();

    // ✅ EXCLUI também do Supabase
    await excluirVeiculoDoSupabase(id);
}

// ==========================================
//    FUNÇÃO DE SINCRONIZAÇÃO AUTOMÁTICA
// ==========================================
async function sincronizarVeiculoNoSupabase(veiculo) {
    if (!window.supabaseReal) return;

    try {
        // Normalizar dados
        const placa = veiculo.placa ? veiculo.placa.toUpperCase().trim() : 'SEM PLACA';

        // Extrair ANO (ex: "2022/2023" → 2022)
        let anoNum = null;
        if (veiculo.ano) {
            const m = String(veiculo.ano).match(/\b(19|20)\d{2}\b/);
            if (m) anoNum = parseInt(m[0], 10);
        }

        // Limpar KM
        let kmNum = 0;
        if (veiculo.km_atual) {
            const kmLimpo = String(veiculo.km_atual).replace(/[^0-9]/g, '');
            kmNum = kmLimpo ? parseInt(kmLimpo, 10) : 0;
        }

        const dados = {
            placa: placa,
            categoria: veiculo.categoria || '',
            marca: veiculo.marca || '',
            modelo: veiculo.modelo || '',
            ano: anoNum,
            km_atual: kmNum,
            status: veiculo.status || 'Disponível',
            data_cadastro: veiculo.data_cadastro || new Date().toISOString().split('T')[0]
        };

        // Verificar se já existe pela placa
        const { data: existente } = await window.supabaseReal
            .from('veiculos')
            .select('id, placa')
            .eq('placa', placa)
            .maybeSingle();

        if (existente) {
            // Atualizar existente
            await window.supabaseReal
                .from('veiculos')
                .update(dados)
                .eq('id', existente.id);
            console.log(`🔄 Veículo ${placa} atualizado na nuvem`);
        } else {
            // Inserir novo
            await window.supabaseReal
                .from('veiculos')
                .insert(dados);
            console.log(`✅ Veículo ${placa} cadastrado na nuvem`);
        }
    } catch (e) {
        console.warn('⚠️ Não foi possível sincronizar:', e.message);
    }
}

// ==========================================
//    EXCLUIR VEÍCULO DA NUVEM
// ==========================================
async function excluirVeiculoDoSupabase(idLocal) {
    if (!window.supabaseReal) return;

    try {
        const veiculo = BD.veiculos.find(v => v.id === idLocal);
        if (!veiculo) return;

        const placa = veiculo.placa?.toUpperCase().trim() || 'SEM PLACA';

        await window.supabaseReal
            .from('veiculos')
            .delete()
            .eq('placa', placa);

        console.log(`🗑️ Veículo ${placa} excluído da nuvem`);
    } catch (e) {
        console.warn('⚠️ Não foi possível excluir da nuvem:', e.message);
    }
}

// ==========================================
//    DEMAIS FUNÇÕES (manter originais)
// ==========================================
function carregarTabelaVeiculos() {
    const tabela = document.querySelector('#tabelaVeiculos tbody');
    if (!tabela) return;

    tabela.innerHTML = '';

    BD.veiculos.forEach(veiculo => {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${veiculo.placa || '—'}</td>
            <td>${veiculo.categoria || '—'}</td>
            <td>${veiculo.marca || '—'}</td>
            <td>${veiculo.modelo || '—'}</td>
            <td>${veiculo.ano || '—'}</td>
            <td>${veiculo.km_atual || 0}</td>
            <td>${veiculo.obra_atual || '—'}</td>
            <td>${veiculo.responsavel || '—'}</td>
            <td>
                <span class="tag-status ${veiculo.status === 'Disponível' ? 'disponivel' : 'em-uso'}">
                    ${veiculo.status || 'Disponível'}
                </span>
            </td>
            <td class="acoes">
                <button class="btn-editar" data-id="${veiculo.id}">Editar</button>
                <button class="btn-historico" data-id="${veiculo.id}">Histórico</button>
                <button class="btn-excluir" data-id="${veiculo.id}">Excluir</button>
                <button class="btn-documentos" data-id="${veiculo.id}">📄 Doc</button>
            </td>
        `;
        tabela.appendChild(linha);
    });

    // Vincular eventos
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.onclick = () => editarVeiculo(parseInt(btn.dataset.id));
    });
    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.onclick = () => excluirVeiculo(parseInt(btn.dataset.id));
    });
    document.querySelectorAll('.btn-historico').forEach(btn => {
        btn.onclick = () => abrirHistoricoVeiculo(parseInt(btn.dataset.id));
    });
    document.querySelectorAll('.btn-documentos').forEach(btn => {
        btn.onclick = () => abrirModalDocumentosVeiculo(parseInt(btn.dataset.id));
    });
}

// Abrir modal para novo veículo
function abrirModalVeiculo() {
    document.getElementById('modalTituloVeiculo').textContent = 'Novo Veículo';
    document.getElementById('formVeiculo').reset();
    document.getElementById('veiculoId').value = '';
    abrirModal('modalVeiculo');
}

// Editar veículo
function editarVeiculo(id) {
    const veiculo = BD.veiculos.find(v => v.id === id);
    if (!veiculo) return;

    document.getElementById('modalTituloVeiculo').textContent = 'Editar Veículo';
    document.getElementById('veiculoId').value = veiculo.id;
    document.getElementById('veiculoPlaca').value = veiculo.placa || '';
    document.getElementById('veiculoCategoria').value = veiculo.categoria || '';
    document.getElementById('veiculoMarca').value = veiculo.marca || '';
    document.getElementById('veiculoModelo').value = veiculo.modelo || '';
    document.getElementById('veiculoAno').value = veiculo.ano || '';
    document.getElementById('veiculoKm').value = veiculo.km_atual || '';
    document.getElementById('veiculoStatus').value = veiculo.status || 'Disponível';

    abrirModal('modalVeiculo');
}

// Submissão do formulário
document.addEventListener('submit', async e => {
    if (e.target.id === 'formVeiculo') {
        e.preventDefault();

        const id = document.getElementById('veiculoId').value;
        const veiculo = {
            id: id ? parseInt(id) : null,
            placa: document.getElementById('veiculoPlaca').value.trim(),
            categoria: document.getElementById('veiculoCategoria').value,
            marca: document.getElementById('veiculoMarca').value.trim(),
            modelo: document.getElementById('veiculoModelo').value.trim(),
            ano: document.getElementById('veiculoAno').value.trim(),
            km_atual: document.getElementById('veiculoKm').value.trim(),
            status: document.getElementById('veiculoStatus').value,
            data_cadastro: new Date().toISOString().split('T')[0]
        };

        await salvarVeiculo(veiculo);
    }
});