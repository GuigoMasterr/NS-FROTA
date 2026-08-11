// ==================================================
// CHECK-LIST DE VEÍCULOS — Inspeção Diária ✅ CORRIGIDO
// ==================================================

// ✅ Itens padrão do check-list
const ITENS_CHECKLIST = [
  { id: 'pneus', label: '🚛 Pneus e Calibragem' },
  { id: 'freios', label: '🛑 Freios' },
  { id: 'oleo', label: '🛢️ Nível de Óleo do Motor' },
  { id: 'agua', label: '💧 Água / Radiador' },
  { id: 'farois', label: '💡 Faróis, Lanternas e Sinais' },
  { id: 'para-brisa', label: '🪟 Para-brisa e Limpadores' },
  { id: 'espelhos', label: '🪞 Espelhos Retrovisores' },
  { id: 'buzina', label: '📢 Buzina' },
  { id: 'extintor', label: '🧯 Extintor de Incêndio' },
  { id: 'triangulo', label: '⚠️ Triângulo e Sinalização' },
  { id: 'ferramentas', label: '🔧 Ferramentas e Macaco' },
  { id: 'documentos', label: '📋 Documentos do Veículo' },
  { id: 'lataria', label: '🚪 Lataria e Pneus Reserva' },
  { id: 'sistema-eletrico', label: '⚡ Sistema Elétrico / Bateria' },
  // ✅ Cintas de Içar Carga — Apenas para: Caminhão Munck, Carreta, Guindaste
  { id: 'cinta-2m', label: '🪢 Cinta de Içar 2m', tipoItem: 'cinta-icarga', precisaCintas: true, quantidadeObrigatoria: 2 },
  { id: 'cinta-3m', label: '🪢 Cinta de Içar 3m', tipoItem: 'cinta-icarga', precisaCintas: true, quantidadeObrigatoria: 2 },
  { id: 'cinta-4m', label: '🪢 Cinta de Içar 4m', tipoItem: 'cinta-icarga', precisaCintas: true, quantidadeObrigatoria: 2 },
  { id: 'cinta-6m', label: '🪢 Cinta de Içar 6m', tipoItem: 'cinta-icarga', precisaCintas: true, quantidadeObrigatoria: 2 },
  // ✅ Cintas de Catraca e Catracas — Para: Caminhão, Caminhão Munck, Carreta, Guindaste
  { id: 'cinta-catraca', label: '🔒 Cinta de Catraca', tipoItem: 'cinta-catraca', precisaCatraca: true, quantidadeObrigatoria: 4 },
  { id: 'catraca', label: '⚙️ Catraca', tipoItem: 'catraca', precisaCatraca: true, quantidadeObrigatoria: 4 }
];

// ✅ Fotos Obrigatórias
const FOTOS_PAINEL = { id: 'foto-painel', label: '📸 Foto do Painel (Km/Horímetro)', obrigatoria: true };
const FOTOS_FRENTE = { id: 'foto-frente', label: '📸 Foto da Frente do Veículo', obrigatoria: true };
const FOTOS_TRASEIRA = { id: 'foto-tras', label: '📸 Foto da Traseira do Veículo', obrigatoria: true };
const FOTOS_CINTAS = { id: 'foto-caixa-cintas', label: '📸 Foto da Caixa de Cintas (comprovar quantidade)', obrigatoria: true };

// ✅ Categorias que precisam de CINTAS DE IÇAR CARGA
const CATEGORIAS_CINTAS_ICAR = ['caminhao-munck', 'carreta', 'guindaste'];
// ✅ Categorias que precisam de CINTAS DE CATRACA E CATRACAS
const CATEGORIAS_CATRACA = ['caminhao', 'caminhao-munck', 'carreta', 'guindaste'];

// ✅ Verifica se precisa de cintas de içar carga
function precisaCintasIcar(categoriaId) {
  const lista = ['caminhao-munck', 'carreta', 'guindaste'];
  const norm = categoriaId.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return lista.some(c => norm.includes(c) || c.includes(norm));
}

// ✅ Verifica se precisa de cintas de catraca e catracas
function precisaCatraca(categoriaId) {
  const lista = ['caminhao', 'caminhao-munck', 'carreta', 'guindaste'];
  const norm = categoriaId.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  return lista.some(c => norm.includes(c) || c.includes(norm));
}

// ✅ Garante que funções auxiliares existam
function veiculosDoUsuario() {
  if (!BD.veiculos) return [];
  if (typeof usuarioAtual === 'undefined' || !usuarioAtual || usuarioAtual.perfil === 'admin') {
    return BD.veiculos;
  }
  const permitidos = usuarioAtual.veiculosPermitidos || [];
  return BD.veiculos.filter(v => permitidos.includes(v.id));
}

// ✅ Abre formulário de check-list
function abrirModalChecklist() {
  const fotosAtuais = {};
  let localizacaoAtual = { lat: 'Obtendo...', lng: 'Obtendo...' };
  const dataHoraRegistro = new Date().toLocaleString('pt-BR');

  // ✅ LOCALIZAÇÃO OBTIDA AUTOMATICAMENTE — NÃO EDITÁVEL
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        localizacaoAtual = {
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6)
        };
        // Atualiza valor no input escondido após receber posição
        const latInput = document.getElementById('clLat');
        const lngInput = document.getElementById('clLng');
        if (latInput) latInput.value = localizacaoAtual.lat;
        if (lngInput) lngInput.value = localizacaoAtual.lng;
      },
      () => {
        localizacaoAtual = { lat: 'Indisponível', lng: 'Indisponível' };
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  } else {
    localizacaoAtual = { lat: 'Não suportado', lng: 'Não suportado' };
  }

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">📋 Novo Check-list de Veículo</h3>
        <button type="button" onclick="fecharModal()"><i class="fa-solid fa-times text-slate-400"></i></button>
      </div>
      <form id="formChecklist" class="space-y-4">
        <!-- ✅ LOCALIZAÇÃO — VISÍVEL E NÃO EDITÁVEL -->
        <div class="bg-slate-50 p-2 rounded-lg border border-slate-200">
          <span class="text-xs font-medium text-slate-500">📍 Localização (obtida automaticamente):</span>
          <p class="text-sm font-mono mt-1">${localizacaoAtual.lat}, ${localizacaoAtual.lng}</p>
          <input type="hidden" id="clLat" value="${localizacaoAtual.lat}">
          <input type="hidden" id="clLng" value="${localizacaoAtual.lng}">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Veículo *</label>
            <select id="clVeiculo" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
              <option value="">Selecione o veículo</option>
              ${veiculosDoUsuario().map(v => {
                const cat = typeof getCategoriaVeiculo === 'function' ? getCategoriaVeiculo(v.categoria) : null;
                return `<option value="${v.id}" data-categoria="${v.categoria || ''}">${cat ? cat.icone + ' ' : ''}${v.placa} — ${v.modelo}</option>`;
              }).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Quilometragem / Horímetro *</label>
            <input type="number" id="clKm" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required placeholder="Km atual">
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Origem *</label>
            <select id="clOrigem" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
              <option value="">Selecione a origem</option>
              ${(BD.origens || []).map(o => `<option value="${o}">${o}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Destino *</label>
            <select id="clDestino" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
              <option value="">Selecione o destino</option>
              ${(BD.destinos || []).map(o => `<option value="${o}">${o}</option>`).join('')}
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Motorista *</label>
          <input type="text" id="clMotorista" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${(typeof usuarioAtual !== 'undefined' && usuarioAtual?.nome) || ''}">
        </div>

        <!-- ✅ ITENS DE VERIFICAÇÃO -->
        <div id="areaItensChecklist" class="space-y-3 border border-slate-200 rounded-lg p-4">
          <h4 class="font-medium text-sm">✅ Itens de Verificação</h4>
          ${ITENS_CHECKLIST.map(item => `
            <div class="grid grid-cols-12 gap-2 items-center ${(item.precisaCintas || item.precisaCatraca) ? 'cinta-item hidden' : ''}" 
                 data-tipo="${item.tipoItem || ''}"
                 data-qtd-obrigatoria="${item.quantidadeObrigatoria || ''}">
              <label class="col-span-4 text-sm font-medium">${item.label}</label>
              ${item.quantidadeObrigatoria ? `
                <input type="number" name="qtd_${item.id}" class="col-span-2 px-2 py-1 border border-slate-200 rounded-lg text-center" min="0" placeholder="Qtd" onchange="verificarQuantidade(this)">
                <span class="col-span-1 text-xs text-slate-500">/ ${item.quantidadeObrigatoria}</span>
                <span class="col-span-2 text-xs status-cinta"></span>
                <input type="text" name="obs_${item.id}" class="col-span-3 px-2 py-1 border border-slate-200 rounded-lg text-sm" placeholder="Obs...">
              ` : `
                <select name="status_${item.id}" class="col-span-3 px-2 py-1 border border-slate-200 rounded-lg text-sm">
                  <option value="ok">✅ OK</option>
                  <option value="regular">⚠️ Irregular</option>
                  <option value="na">➖ N/A</option>
                </select>
                <input type="text" name="obs_${item.id}" class="col-span-5 px-2 py-1 border border-slate-200 rounded-lg text-sm" placeholder="Observação...">
              `}
            </div>
          `).join('')}
        </div>

        <div id="alertaCintas" class="hidden bg-red-50 border-2 border-red-300 text-red-800 p-3 rounded-lg font-medium">
          ⚠️ <strong>ATENÇÃO:</strong> Quantidade insuficiente! Verifique os itens acima.
        </div>

        <!-- ✅ FOTOS OBRIGATÓRIAS CONFORME CATEGORIA -->
        <div id="areaFotos" class="space-y-3 border border-slate-200 rounded-lg p-4 hidden">
          <h4 class="font-medium text-sm">📸 Fotos Obrigatórias</h4>
          <p id="textoTipoVeiculo" class="text-xs text-slate-500 mb-2"></p>
          <div id="listaFotos"></div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Observações Gerais</label>
          <textarea id="clObservacoesGerais" class="w-full px-3 py-2 border border-slate-200 rounded-lg" rows="3" placeholder="Detalhes adicionais..."></textarea>
        </div>

        <button type="submit" class="w-full bg-green-600 text-white py-2 rounded-lg mt-2">✅ Salvar Check-list</button>
      </form>
    </div>
  `;
  document.getElementById('modais').appendChild(modal);

      // ✅ Verifica se é Administrador
function ehAdmin() {
  return typeof usuarioAtual !== 'undefined' && usuarioAtual?.perfil === 'admin';
}

// ✅ Verifica se é Motorista
function ehMotorista() {
  return typeof usuarioAtual !== 'undefined' && usuarioAtual?.perfil === 'motorista';
}

  // ✅ Auto-preenche KM e atualiza itens/fotos conforme veículo
  document.getElementById('clVeiculo').addEventListener('change', function() {
    const veic = veiculosDoUsuario().find(v => String(v.id) === this.value);
    if (veic) document.getElementById('clKm').value = veic.kmAtual || 0;
    atualizarItensPorCategoria();
    atualizarFotosObrigatorias();
  });

  // ✅ Verifica quantidade e exibe status
  window.verificarQuantidade = function(input) {
  const qtd = parseInt(input.value) || 0;
  const elPai = input.closest('[data-qtd-obrigatoria]');
  const obrig = parseInt(elPai?.dataset?.qtdObrigatoria) || 0;
  const statusSpan = elPai?.querySelector('.status-cinta');
  
  if (statusSpan) {
    if (qtd >= obrig) {
      statusSpan.innerHTML = '<span class="text-green-600">✅ OK</span>';
    } else {
      statusSpan.innerHTML = `<span class="text-red-600">⚠️ Faltam ${obrig - qtd} — Salvo com pendência</span>`;
    }
  }
  verificarTodosItens();
};

  function verificarTodosItens() {
  const itens = document.querySelectorAll('.cinta-item:not(.hidden)');
  let temFalta = false;
  itens.forEach(el => {
    const input = el.querySelector('input[type="number"]');
    const obrig = parseInt(el.dataset.qtdObrigatoria) || 0;
    if (input && (parseInt(input.value) || 0) < obrig) temFalta = true;
  });
  
  // ⚠️ Mostra alerta mas NÃO bloqueia nada
  document.getElementById('alertaCintas').classList.toggle('hidden', !temFalta);
  
  // ⚠️ Adiciona aviso claro no alerta
  if (temFalta) {
    document.getElementById('alertaCintas').innerHTML = `
      ⚠️ <strong>ATENÇÃO:</strong> Quantidade abaixo do recomendado! 
      O check-list será salvo com pendência e o gestor será notificado.
    `;
  }
}

  // ✅ Mostra/esconde itens de cintas conforme CATEGORIA
window.atualizarItensPorCategoria = function() {
  const veicId = document.getElementById('clVeiculo').value;
  if (!veicId) {
    document.querySelectorAll('.cinta-item').forEach(el => el.classList.add('hidden'));
    document.getElementById('alertaCintas').classList.add('hidden');
    return;
  }
  
  const veic = veiculosDoUsuario().find(v => String(v.id) === veicId);
  let catId = veic?.categoria || '';
  
  // ✅ NORMALIZA: remove acentos, espaços, deixa tudo minúsculo
  catId = catId.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
               .toLowerCase().trim();
  
  const precisaIcar = precisaCintasIcar(catId);
  const precisaCat = precisaCatraca(catId);

  console.log('✅ Categoria normalizada:', catId);
  console.log('✅ Precisa cintas içar:', precisaIcar);
  console.log('✅ Precisa cintas catraca:', precisaCat);

  document.querySelectorAll('.cinta-item').forEach(el => {
    const tipo = el.dataset.tipo;
    if (tipo === 'cinta-icarga') {
      el.classList.toggle('hidden', !precisaIcar);
    } else if (tipo === 'cinta-catraca' || tipo === 'catraca') {
      el.classList.toggle('hidden', !precisaCat);
    }
  });

  document.getElementById('alertaCintas').classList.toggle('hidden', !(precisaIcar || precisaCat));
};

  // ✅ Atualiza fotos obrigatórias conforme CATEGORIA
  window.atualizarFotosObrigatorias = function() {
    const veicId = document.getElementById('clVeiculo').value;
    if (!veicId) {
      document.getElementById('areaFotos').classList.add('hidden');
      return;
    }
    const veic = veiculosDoUsuario().find(v => String(v.id) === veicId);
    const catId = veic?.categoria || '';
    const cat = typeof getCategoriaVeiculo === 'function' ? getCategoriaVeiculo(catId) : null;
    const precisaFotoCintas = precisaCintasIcar(catId);

    // ✅ FOTOS OBRIGATÓRIAS PARA TODOS: Painel, Frente, Traseira
    const fotos = [FOTOS_PAINEL, FOTOS_FRENTE, FOTOS_TRASEIRA];
    // ✅ Se for categoria com cintas de içar → adiciona foto da caixa de cintas
    if (precisaFotoCintas) fotos.push(FOTOS_CINTAS);

    document.getElementById('areaFotos').classList.remove('hidden');
    document.getElementById('textoTipoVeiculo').textContent =
      `${(cat?.icone || '')} ${(cat?.nome || 'Veículo')} → ${fotos.length} fotos obrigatórias${precisaFotoCintas ? ' (+ foto da caixa de cintas)' : ''}`;

    const localizacaoTexto = `📍 ${localizacaoAtual.lat}, ${localizacaoAtual.lng}`;

    document.getElementById('listaFotos').innerHTML = fotos.map(foto => `
      <div class="border border-slate-200 rounded-lg p-3 mb-2">
        <label class="block text-sm font-medium mb-2">${foto.label} *</label>
        <input type="file" accept="image/*" capture="environment" class="foto-input w-full text-sm mb-2" data-foto-id="${foto.id}">
        <div class="preview-foto mt-2 hidden">
          <img class="max-w-full h-40 object-cover rounded border">
          <p class="text-xs text-slate-500 mt-1 legenda-foto">📅 ${dataHoraRegistro} | ${localizacaoTexto}</p>
        </div>
      </div>
    `).join('');

    // ✅ Processa preview das fotos
    document.querySelectorAll('.foto-input').forEach(input => {
      input.addEventListener('change', function() {
        if (!this.files || !this.files[0]) return;
        const fotoId = this.dataset.fotoId;
        const leitor = new FileReader();
        leitor.onload = e => {
          const preview = this.parentElement.querySelector('.preview-foto');
          preview.querySelector('img').src = e.target.result;
          preview.classList.remove('hidden');
          fotosAtuais[fotoId] = {
            base64: e.target.result,
            legenda: `📅 ${dataHoraRegistro} | ${localizacaoTexto}`
          };
        };
        leitor.readAsDataURL(this.files[0]);
      });
    });
  };

  // ✅ SALVAR CHECK-LIST
  document.getElementById('formChecklist').addEventListener('submit', e => {
    e.preventDefault();

    const veicId = document.getElementById('clVeiculo').value;
    const veiculo = BD.veiculos?.find(v => String(v.id) === veicId);
    const motorista = document.getElementById('clMotorista').value.trim();
    const km = parseFloat(document.getElementById('clKm').value);
    const origem = document.getElementById('clOrigem').value.trim();
    const destino = document.getElementById('clDestino').value.trim();
    const catId = veiculo?.categoria || '';

    // ✅ VALIDAÇÕES
    if (!(typeof Validacoes !== 'undefined' && Validacoes.camposPreenchidos([veicId, motorista, km, origem, destino]))) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    if (!(typeof Validacoes !== 'undefined' && Validacoes.kmValido(km))) {
      alert('❌ Quilometragem inválida!');
      return;
    }

    // ✅ Define fotos obrigatórias e valida envio
    const fotosObrigatorias = [FOTOS_PAINEL.id, FOTOS_FRENTE.id, FOTOS_TRASEIRA.id];
    if (precisaCintasIcar(catId)) fotosObrigatorias.push(FOTOS_CINTAS.id);
    if (!fotosObrigatorias.every(id => fotosAtuais[id])) {
      alert(`⚠️ É obrigatório enviar todas as ${fotosObrigatorias.length} fotos indicadas!`);
      return;
    }

    // ✅ Coleta todos os itens e verifica irregularidades
    const itens = {};
    let temIrregular = false;
    ITENS_CHECKLIST.forEach(item => {
      if (item.quantidadeObrigatoria) {
        const qtd = parseInt(document.querySelector(`input[name="qtd_${item.id}"]`)?.value) || 0;
        const obs = document.querySelector(`input[name="obs_${item.id}"]`)?.value?.trim() || '';
        itens[item.id] = {
          tipo: item.tipoItem,
          quantidade: qtd,
          obrigatoria: item.quantidadeObrigatoria,
          status: qtd >= item.quantidadeObrigatoria ? 'ok' : 'faltando',
          observacao: obs
        };
        if (qtd < item.quantidadeObrigatoria) temIrregular = true;
      } else {
        const status = document.querySelector(`select[name="status_${item.id}"]`)?.value || 'na';
        const obs = document.querySelector(`input[name="obs_${item.id}"]`)?.value?.trim() || '';
        itens[item.id] = { status, observacao: obs };
        if (status === 'regular') temIrregular = true;
      }
    });

    // ✅ Monta registro final
    const dados = {
      veiculoId, // ⚠️ Corrigido: antes usava veiculoId sem declarar
      placaVeiculo: veiculo?.placa || '',
      modeloVeiculo: veiculo?.modelo || '',
      categoriaVeiculo: catId,
      motorista,
      km,
      origem,
      destino,
      data: new Date().toISOString(),
      localizacao: {
        lat: document.getElementById('clLat').value,
        lng: document.getElementById('clLng').value
      },
      itens,
      fotos: fotosAtuais,
      statusGeral: temIrregular ? 'IRREGULAR' : 'OK',
      observacoesGerais: document.getElementById('clObservacoesGerais').value.trim()
    };

    // ✅ Salva no banco
    if (typeof adicionarRegistro === 'function') {
      adicionarRegistro('checklists', dados);
    } else {
      if (!BD.checklists) BD.checklists = [];
      dados.id = typeof Utils?.gerarId === 'function' ? Utils.gerarId() : Date.now();
      BD.checklists.push(dados);
      if (typeof salvarDados === 'function') salvarDados();
    }

    if (typeof Sincronizacao !== 'undefined' && Sincronizacao?.sincronizarRegistro) {
      Sincronizacao.sincronizarRegistro('checklists', dados).catch(() => {});
    }

    fecharModal();
    if (typeof carregarTabelaChecklist === 'function') carregarTabelaChecklist();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
    if (typeof carregarMeusRegistros === 'function') carregarMeusRegistros();
    alert(temIrregular ? '⚠️ Check-list salvo com IRREGULARIDADES!' : '✅ Check-list salvo com SUCESSO!');
  });
}

// ✅ Exibe detalhes completos
function verDetalhesChecklist(id) {
  const cl = (BD.checklists || []).find(c => String(c.id) === String(id));
  if (!cl) return;
  const cat = typeof getCategoriaVeiculo === 'function' ? getCategoriaVeiculo(cl.categoriaVeiculo) : null;

  let html = `📋 CHECK-LIST — ${cl.placaVeiculo} | ${(cat?.icone || '')} ${(cat?.nome || 'Veículo')}\n`;
  html += `📅 ${new Date(cl.data).toLocaleString('pt-BR')}\n`;
  html += `📍 ${cl.localizacao?.lat || ''}, ${cl.localizacao?.lng || ''}\n`;
  html += `🚗 Motorista: ${cl.motorista} | Km: ${(cl.km || 0).toLocaleString('pt-BR')}\n`;
  html += `➡️ Origem: ${cl.origem || '—'} | Destino: ${cl.destino || '—'}\n`;
  html += `Status: ${cl.statusGeral === 'OK' ? '✅ APROVADO' : '⚠️ IRREGULAR'}\n\n`;
  html += `📝 ITENS:\n`;

  ITENS_CHECKLIST.forEach(item => {
    const d = cl.itens?.[item.id];
    if (!d) return;
    if (d.tipo === 'cinta-icarga' || d.tipo === 'cinta-catraca' || d.tipo === 'catraca') {
      html += `${item.label}: ${d.quantidade}/${d.obrigatoria} ${d.status==='ok'?'✅ OK':'❌ FALTANDO!'}`;
    } else {
      const ic = { ok:'✅ OK', regular:'⚠️ Irregular', na:'➖ N/A' }[d.status] || d.status;
      html += `${item.label}: ${ic}`;
    }
    if (d.observacao) html += ` | Obs: ${d.observacao}`;
    html += `\n`;
  });

  html += `\n📸 Fotos: ${cl.fotos ? Object.keys(cl.fotos).length : 0} foto(s)`;
  if (cl.observacoesGerais) html += `\n\n📝 OBSERVAÇÕES GERAIS:\n${cl.observacoesGerais}`;
  alert(html);
}

// ✅ Exclui check-list
function excluirChecklist(id) {
  // 🔒 BLOQUEIA MOTORISTA
    if (!ehAdmin()) {
    alert('❌ Acesso restrito ao Administrador!');
    return;
  }

    if (confirm('⚠️ Excluir este check-list?')) {
  }
  if (confirm('⚠️ Excluir este check-list?')) {
    if (typeof excluirRegistro === 'function') {
      excluirRegistro('checklists', id);
    } else {
      BD.checklists = (BD.checklists || []).filter(c => String(c.id) !== String(id));
      if (typeof salvarDados === 'function') salvarDados();
    }
    if (typeof carregarTabelaChecklist === 'function') carregarTabelaChecklist();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
  }
}

// ✅ Carrega tabela com filtro
function carregarTabelaChecklist(filtroPlaca = 'todos') {
  const corpo = document.getElementById('tabelaChecklist');
  if (!corpo) return;

  let dados = BD.checklists || [];
  if (filtroPlaca !== 'todos') {
    dados = dados.filter(c => c.placaVeiculo === filtroPlaca);
  }

  corpo.innerHTML = dados.length ? dados.map(c => {
    // Na função carregarTabelaChecklist, na linha do status:
const statusClasse = c.statusGeral === 'OK' ? 'text-green-600' : 'text-red-600 font-bold';
    return `<tr>
      <td>${typeof Utils?.formatarData === 'function' ? Utils.formatarData(c.data) : new Date(c.data).toLocaleDateString('pt-BR')}</td>
      <td class="font-mono font-semibold">${c.placaVeiculo}</td>
      <td>${c.motorista}</td>
      <td>${(c.km || 0).toLocaleString('pt-BR')} km</td>
      <td class="${statusClasse}">${c.statusGeral === 'OK' ? '✅ OK' : '⚠️ Irregular'}</td>
      <td class="admin-only">
        <button class="text-blue-600 text-sm mr-1" onclick="verDetalhesChecklist('${c.id}')">👁️ Ver</button>
        <button class="text-red-600 text-sm" onclick="excluirChecklist('${c.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" class="text-center text-slate-400 py-4">${filtroPlaca === 'todos' ? 'Nenhum check-list registrado' : 'Nenhum registro para este veículo'}</td></tr>`;
}

// ✅ ===== CONTROLE DE PERMISSÕES POR PERFIL =====

// Verifica se usuário é Administrador
function ehAdmin() {
  return typeof usuarioAtual !== 'undefined' && usuarioAtual?.perfil === 'admin';
}

// Verifica se usuário é Motorista
function ehMotorista() {
  return typeof usuarioAtual !== 'undefined' && usuarioAtual?.perfil === 'motorista';
}

// Aplica classe do perfil no corpo da página ao carregar
document.addEventListener('DOMContentLoaded', function () {
  if (ehAdmin()) {
    document.body.classList.add('usuario-admin');
    console.log('🔑 Perfil: Administrador — acesso completo');
  } else if (ehMotorista()) {
    document.body.classList.add('usuario-motorista');
    console.log('🔑 Perfil: Motorista — áreas de admin ocultas');
  } else {
    console.log('⚠️ Usuário não identificado');
  }
});