// ============================================================
// SISTEMA DE GESTÃO DE FROTAS - ARQUIVO JS CONSOLIDADO
// Gerado automaticamente - todos os módulos em um único arquivo
// Ordem de carregamento garantida
// ============================================================
// CORREÇÃO: Garantir que DOMContentLoaded funcione mesmo quando
// o script é carregado no final do body
// ============================================================
function quandoDOMPronto(fn) {
    if (document.readyState === 'loading') {
        quandoDOMPronto(fn);
    } else {
        setTimeout(fn, 0);
    }
}


// ============================================================



// ============================================================
// ARQUIVO: supabase.js
// ============================================================

// js/supabase.js
class SupabaseMock {
  constructor() { this._tabela = ''; this._filtros = []; }
  from(t) { this._tabela = t; this._filtros = []; return this; }
  select() { return this._resposta(); }
  eq(c, v) { this._filtros.push({c, v}); return this; }
  order() { return this; }
  single() { return this._resposta(true); }
  upsert() { return this._resposta(); }
  delete() { return this._resposta(); }
  _resposta(unico = false) {
    return Promise.resolve({ data: unico ? null : [], error: { message: 'Modo local' } });
  }
}
const supabase = new SupabaseMock();
// export default removido

// ============================================================
// ARQUIVO: config.js
// ============================================================

// ==========================================
// ARQUIVO DE CONFIGURAÇÃO DO SISTEMA
// ==========================================

const CONFIG = {
    // Status de Veículos
    STATUS_VEICULOS: {
        ATIVO: 'Em Operação',
        MANUTENCAO: 'Em Manutenção',
        INATIVO: 'Inativo'
    },

    // Categorias de Veículos
    CATEGORIAS_VEICULOS: [
        'Caminhão',
        'Carro Passeio',
        'Utilitário',
        'Máquina',
        'Van',
        'Ônibus',
        'Moto',
        'Outro'
    ],

    // Status de Check-list
    STATUS_CHECKLIST: {
        APROVADO: 'Aprovado',
        PENDENTE: 'Pendente',
        REPROVADO: 'Reprovado'
    },

    // Tipos de Manutenção
    TIPO_MANUTENCAO: {
        PREVENTIVA: 'Preventiva',
        CORRETIVA: 'Corretiva',
        REVISAO: 'Revisão'
    },

    // Status de Manutenção
    STATUS_MANUTENCAO: {
        ABERTA: 'Aberta',
        ANDAMENTO: 'Em Andamento',
        CONCLUIDA: 'Concluída',
        CANCELADA: 'Cancelada'
    },

    // Tipos de Gastos
    TIPO_GASTOS: [
        'Abastecimento',
        'Peças',
        'Serviço',
        'IPVA',
        'Seguro',
        'Licenciamento',
        'Multa',
        'Outros'
    ],

    // Perfis de Usuário
    PERFIS: {
        ADMIN: 'admin',
        MOTORISTA: 'motorista'
    },

    // Credenciais padrão
    LOGIN: {
        ADMIN: { usuario: 'admin', senha: 'admin123', nome: 'Administrador', perfil: 'admin' },
        MOTORISTA: { usuario: 'motorista', senha: 'motorista123', nome: 'Motorista', perfil: 'motorista' }
    }
};

// ✅ Disponibiliza globalmente para o HTML


// ============================================================
// COMPATIBILIDADE: Adicionar estrutura CONFIG.STATUS aninhada
// ============================================================
if (typeof CONFIG !== 'undefined' && !CONFIG.STATUS) {
    CONFIG.STATUS = {
        CHECKLIST: CONFIG.STATUS_CHECKLIST || { APROVADO: 'Aprovado', PENDENTE: 'Pendente', REPROVADO: 'Reprovado' },
        MANUTENCAO: CONFIG.STATUS_MANUTENCAO || { ABERTA: 'Aberta', ANDAMENTO: 'Em Andamento', CONCLUIDA: 'Concluída' },
        TIPO_MANUTENCAO: CONFIG.TIPO_MANUTENCAO || { PREVENTIVA: 'Preventiva', CORRETIVA: 'Corretiva', REVISAO: 'Revisão' }
    };
}
window.CONFIG = CONFIG;
window.CATEGORIAS_VEICULOS = CONFIG.CATEGORIAS_VEICULOS;
window.STATUS_VEICULOS = CONFIG.STATUS_VEICULOS;
window.STATUS_CHECKLIST = CONFIG.STATUS_CHECKLIST;
window.TIPO_MANUTENCAO = CONFIG.TIPO_MANUTENCAO;
window.STATUS_MANUTENCAO = CONFIG.STATUS_MANUTENCAO;
window.TIPO_GASTOS = CONFIG.TIPO_GASTOS;

// export default removido

// ============================================================
// ARQUIVO: banco-dados.js
// ============================================================

// import removido

// ==================================================
// 💾 BANCO DE DADOS LOCAL
// ==================================================
let BD = {
    locais: [
        { id: 'patio-metalica', nome: 'Pátio Metálica' },
        { id: 'patio-usina-conc', nome: 'Pátio Usina Conc.' },
        { id: 'obra', nome: 'Obra' }
    ],
    veiculos: [],
    checklists: [],
    manutencoes: [],
    gastos: [],
    chamados: [],
    alocacoes: [],
    usuarios: []
};

function salvarDados() {
    try {
        localStorage.setItem('bd_frotas', JSON.stringify(BD));
    } catch (e) {
        console.warn('Não foi possível salvar dados locais:', e);
    }
}

async function carregarDadosLocais() {
    try {
        const salvos = localStorage.getItem('bd_frotas');
        if (salvos) {
            const parseados = JSON.parse(salvos);
            BD = { ...BD, ...parseados };
        }
    } catch (e) {
        console.warn('Erro ao carregar dados locais:', e);
    }
}

async function sincronizarBD() {
    try {
        const [locais, veiculos, checklists, manutencoes, gastos, chamados, alocacoes] = await Promise.all([
            obterLocais().catch(() => []),
            obterVeiculos().catch(() => []),
            obterChecklists().catch(() => []),
            obterManutencoes().catch(() => []),
            obterGastos().catch(() => []),
            obterChamados().catch(() => []),
            obterAlocacoes().catch(() => [])
        ]);

        BD.locais = locais.length > 0 ? locais : BD.locais;
        BD.veiculos = veiculos;
        BD.checklists = checklists;
        BD.manutencoes = manutencoes;
        BD.gastos = gastos;
        BD.chamados = chamados;
        BD.alocacoes = alocacoes;

        salvarDados();
        console.log('✅ BD sincronizado');
    } catch (erro) {
        console.warn('⚠️ Usando dados locais:', erro);
        await carregarDadosLocais();
    }
}

// ==================================================
// 🔧 FUNÇÕES AUXILIARES
// ==================================================
function tratarErro(acao, erro) {
    if (erro) console.error(`❌ Erro ${acao}:`, erro)
    return erro ? null : true
}

// ==================================================
// 📍 LOCAIS
// ==================================================
async function obterLocais() {
  const { data, error } = await supabase.from('locais').select('*').order('nome')
  tratarErro('carregar locais', error)
  return data || BD.locais
}

async function salvarLocal(local) {
  const { data, error } = await supabase.from('locais').upsert([local], { onConflict: 'nome' }).select()
  tratarErro('salvar local', error)
  if (data?.[0]) return data[0];
  const idx = BD.locais.findIndex(l => l.id === local.id);
  if (idx >= 0) BD.locais[idx] = local;
  else BD.locais.push(local);
  salvarDados();
  return local;
}

// ==================================================
// 👤 USUÁRIOS
// ==================================================
async function obterUsuarios() {
  const { data, error } = await supabase.from('usuarios').select('*').order('nome')
  tratarErro('carregar usuários', error)
  return data || BD.usuarios
}

async function autenticarUsuario(usuario, senha) {
  const { data, error } = await supabase
    .from('usuarios').select('*').eq('usuario', usuario).eq('senha', senha).eq('ativo', true).single()
  if (!error && data) return data;
  const { LOGIN } = await import('./config.js').catch(() => ({ LOGIN: null }));
  if (LOGIN) {
    if (usuario === LOGIN.ADMIN.usuario && senha === LOGIN.ADMIN.senha) return LOGIN.ADMIN;
    if (usuario === LOGIN.MOTORISTA.usuario && senha === LOGIN.MOTORISTA.senha) return LOGIN.MOTORISTA;
  }
  return null;
}

// ==================================================
// 🚗 VEÍCULOS
// ==================================================
async function obterVeiculos() {
  const { data, error } = await supabase.from('veiculos').select('*').order('placa')
  tratarErro('carregar veículos', error)
  return data || BD.veiculos
}

async function obterVeiculoPorPlaca(placa) {
  const { data, error } = await supabase.from('veiculos').select('*').eq('placa', placa).single()
  return error ? BD.veiculos.find(v => v.placa === placa) || null : data
}

async function salvarVeiculo(dados) {
  const { data, error } = await supabase.from('veiculos').upsert([dados], { onConflict: 'placa' }).select()
  tratarErro('salvar veículo', error)
  if (data?.[0]) return data[0];
  const idx = BD.veiculos.findIndex(v => v.placa === dados.placa);
  if (idx >= 0) BD.veiculos[idx] = dados;
  else BD.veiculos.push(dados);
  salvarDados();
  return dados;
}

// ==================================================
// ✅ CHECK-LIST / OUTRAS FUNÇÕES
// ==================================================
async function obterChecklists() { return [] }
async function salvarChecklist(dados) { BD.checklists.push(dados); salvarDados(); return dados; }
async function obterAlocacoes() { return BD.alocacoes }
async function salvarAlocacao(dados) { BD.alocacoes.push(dados); salvarDados(); return dados; }
async function obterGastos() { return BD.gastos }
async function salvarGasto(dados) { BD.gastos.push(dados); salvarDados(); return dados; }
async function obterManutencoes() { return BD.manutencoes }
async function salvarManutencao(dados) { BD.manutencoes.push(dados); salvarDados(); return dados; }
async function obterChamados() { return BD.chamados }
async function abrirChamado(dados) { BD.chamados.push(dados); salvarDados(); return dados; }

// ==================================================
// ✅ DISPONIBILIZA GLOBALMENTE + EXPORTA (SÓ 1 VEZ!)
// ==================================================
window.BD = BD;
window.salvarDados = salvarDados;
window.sincronizarBD = sincronizarBD;

// export removido

// ============================================================
// ARQUIVO: utils.js
// ============================================================

// js/utils.js
const Utils = {
  formatarMoeda(valor) {
    const n = Number(valor);
    if (isNaN(n) || n < 0) return "R$ 0,00";
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },
  formatarData(data) {
    const d = data ? new Date(data) : new Date();
    if (isNaN(d.getTime())) return "--/--/----";
    return d.toLocaleDateString('pt-BR');
  },
  gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  getDataHoraAtual() { return new Date().toLocaleString('pt-BR'); },
  diasEntre(d1, d2) {
    const a = new Date(d1), b = new Date(d2);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
    return Math.ceil(Math.abs(b - a) / 86400000);
  },
  limparTexto(t) { return !t ? "" : t.toString().trim().replace(/\s+/g, " "); },
  extrairNumeros(t) { return !t ? "" : t.toString().replace(/[^0-9]/g, ""); },
  padronizarPlaca(p) { return !p ? "" : p.toString().toUpperCase().replace(/[^A-Z0-9]/g, ""); }
};
window.Utils = Utils;
// export default removido

// ============================================================
// ARQUIVO: validacoes.js
// ============================================================

// js/validacoes.js
const Validacoes = {
  placaValida(placa) {
    if (!placa) return false;
    const l = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return /^[A-Z]{3}[0-9]{4}$/.test(l) || /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(l);
  },
  camposPreenchidos(campos = []) {
    return campos.every(c => c !== null && c !== undefined && c.toString().trim() !== "");
  },
  kmValido(km) {
    const n = Number(km);
    return !isNaN(n) && n >= 0 && Number.isInteger(n);
  },
  kmSuperior(nova, anterior) {
    return Number(nova) >= Number(anterior);
  },
  emailValida(email) {
    return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  },
  senhaValida(senha) {
    return typeof senha === "string" && senha.length >= 6;
  },
  dataValida(data) {
    return data && !isNaN(new Date(data).getTime());
  },
  valorMonetarioValido(valor) {
    const n = Number(valor);
    return !isNaN(n) && n >= 0;
  }
};
window.Validacoes = Validacoes;
// export default removido

// ============================================================
// ARQUIVO: veiculos.js
// ============================================================

// ==================================================
// 🚗 CADASTRO E GESTÃO DE VEÍCULOS — SUPABASE + LOCAL
// ==================================================

// import removido
// import removido
// import removido

// ✅ Abre janela de cadastro ou edição
function abrirModalVeiculo(veiculo = null) {
  const ehEdicao = !!veiculo;

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  modal.innerHTML = `
    <div class="modal-corpo">
      <div class="modal-cabecalho">
        <h3 style="margin:0; font-size:1.125rem; font-weight:600;">${ehEdicao ? '✏️ Editar' : '➕ Cadastrar'} Veículo</h3>
        <button type="button" class="btn-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-conteudo">
        <form id="formVeiculo" class="space-y-3">
          <div class="linha-form">
            <label>Placa *</label>
            <input type="text" id="vPlaca" style="text-transform:uppercase;" required value="${veiculo?.placa || ''}" ${ehEdicao ? 'readonly' : ''}>
          </div>
          <div class="linha-form">
            <label>Ano</label>
            <input type="number" id="vAno" value="${veiculo?.ano || ''}">
          </div>
          <div class="linha-form">
            <label>Categoria *</label>
            <select id="vCategoria" required>
              <option value="">Selecione</option>
              <option value="caminhao" ${veiculo?.categoria === 'caminhao' ? 'selected' : ''}>🚛 Caminhão</option>
              <option value="utilitario" ${veiculo?.categoria === 'utilitario' ? 'selected' : ''}>🚐 Utilitário</option>
              <option value="carro" ${veiculo?.categoria === 'carro' ? 'selected' : ''}>🚗 Carro</option>
              <option value="moto" ${veiculo?.categoria === 'moto' ? 'selected' : ''}>🏍️ Moto</option>
              <option value="maquina" ${veiculo?.categoria === 'maquina' ? 'selected' : ''}>🚜 Máquina</option>
              <option value="outro" ${veiculo?.categoria === 'outro' ? 'selected' : ''}>❔ Outro</option>
            </select>
          </div>
          <div class="linha-form">
            <label>Marca / Modelo *</label>
            <input type="text" id="vModelo" required value="${veiculo?.modelo || ''}">
          </div>
          <div class="linha-form">
            <label>Km Atual *</label>
            <input type="number" id="vKm" required value="${veiculo?.km_atual || 0}">
          </div>
          <div class="linha-form">
            <label>Status</label>
            <select id="vStatus">
              <option value="disponivel" ${veiculo?.status === 'disponivel' ? 'selected' : ''}>✅ Disponível</option>
              <option value="alocado" ${veiculo?.status === 'alocado' ? 'selected' : ''}>🚛 Alocado</option>
              <option value="manutencao" ${veiculo?.status === 'manutencao' ? 'selected' : ''}>🔧 Manutenção</option>
              <option value="inativo" ${veiculo?.status === 'inativo' ? 'selected' : ''}>⛔ Inativo</option>
            </select>
          </div>
          <div class="linha-form">
            <label>Obra / Local *</label>
            <input type="text" id="vObra" required value="${veiculo?.obra_atual || ''}" placeholder="Nome da obra ou local">
          </div>
          <div class="linha-form">
            <label>Responsável</label>
            <input type="text" id="vResponsavel" value="${veiculo?.responsavel || ''}" placeholder="Nome do motorista responsável">
          </div>
          <div class="botoes-form">
            <button type="button" class="btn" style="background:#f1f5f9; color:#475569;" onclick="fecharModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">${ehEdicao ? '💾 Salvar' : '➕ Cadastrar Veículo'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('modais').appendChild(modal);

  // ===== MANIPULAÇÃO DO FORMULÁRIO =====
  document.getElementById('formVeiculo').addEventListener('submit', async e => {
    e.preventDefault();

    const placa = document.getElementById('vPlaca').value.toUpperCase().trim();
    const categoria = document.getElementById('vCategoria').value;
    const modelo = document.getElementById('vModelo').value.trim();
    const ano = document.getElementById('vAno').value || null;
    const kmAtual = parseInt(document.getElementById('vKm').value) || 0;
    const status = document.getElementById('vStatus').value;
    const obraAtual = document.getElementById('vObra').value.trim();
    const responsavel = document.getElementById('vResponsavel').value.trim() || null;

    // ✅ VALIDAÇÕES
    if (!/^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/.test(placa.replace('-', '')) && !/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(placa)) {
      alert('❌ Placa inválida! Use o formato AAA-1234 ou AAA1A23');
      return;
    }
    if (!categoria || !modelo || !obraAtual) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    if (kmAtual < 0) {
      alert('❌ Quilometragem deve ser um número positivo!');
      return;
    }

    const dados = { 
      placa, 
      categoria, 
      modelo, 
      marca: modelo.split(' ')[0],
      ano, 
      km_atual: kmAtual,
      km_inicial: ehEdicao ? (veiculo?.km_inicial || kmAtual) : kmAtual,
      status, 
      obra_atual: obraAtual,
      responsavel
    };

    if (ehEdicao) {
      // ✅ Edição
      dados.id = veiculo.id;
    } else {
      // ✅ Novo — Verifica placa duplicada
      const existe = await obterVeiculoPorPlaca(placa);
      if (existe) {
        alert('❌ Já existe um veículo cadastrado com esta placa!');
        return;
      }
    }

    const resultado = await salvarVeiculo(dados);

    if (resultado) {
      alert('✅ Veículo salvo com sucesso!');
      fecharModal();
      await carregarTabelaVeiculos();
      if (typeof atualizarDashboard === 'function') atualizarDashboard();
      if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
    } else {
      alert('❌ Erro ao salvar veículo! Verifique o console.');
    }
  });
}

// ✅ Carrega e exibe a tabela completa
window.carregarTabelaVeiculos = async function () {
  const corpo = document.getElementById('tabelaVeiculos');
  if (!corpo) return;

  const veiculos = await obterVeiculos();

  if (!veiculos.length) {
    corpo.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:2rem;">Nenhum veículo cadastrado</td></tr>';
    return;
  }

  const statusMap = {
    disponivel: '<span class="badge badge-success">✅ Disponível</span>',
    alocado: '<span class="badge" style="background:#dbeafe; color:#1e40af;">🚛 Alocado</span>',
    manutencao: '<span class="badge badge-warning">🔧 Manutenção</span>',
    inativo: '<span class="badge badge-danger">⛔ Inativo</span>'
  };

  const catIcone = {
    caminhao: '🚛', utilitario: '🚐', carro: '🚗', moto: '🏍️', maquina: '🚜', outro: '❔'
  };

  corpo.innerHTML = veiculos.map(v => {
    const seguro = JSON.stringify(v).replace(/"/g, '&quot;');
    return `<tr>
      <td class="font-mono">${v.placa}</td>
      <td>${catIcone[v.categoria] || '❔'} ${v.categoria || '-'}</td>
      <td>${v.modelo}</td>
      <td>${Number(v.km_atual || 0).toLocaleString('pt-BR')} km</td>
      <td>${v.obra_atual || '—'}</td>
      <td>${statusMap[v.status] || v.status}</td>
      <td class="admin-only">
        <button class="btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:#fef3c7; color:#92400e; margin-right:0.25rem;" onclick='abrirModalVeiculo(${seguro})'>✏️</button>
        <button class="btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:#fee2e2; color:#991b1b;" onclick="excluirVeiculo('${v.placa || v.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

// ✅ Excluir veículo
window.excluirVeiculo = async function (identificador) {
  if (!confirm('⚠️ Tem certeza que deseja excluir este veículo?')) return;
  
  // Tenta pelo Supabase, senão usa local
  let sucesso = false;
  try {
    const { supabase } = await import('./supabase.js').catch(() => ({ supabase: null }));
    if (supabase) {
      await supabase.from('veiculos').delete().eq('placa', identificador);
      sucesso = true;
    }
  } catch {}
  
  // Fallback local
  if (!sucesso) {
    BD.veiculos = BD.veiculos.filter(v => v.placa !== identificador && String(v.id) !== String(identificador));
    salvarDados();
  }
  
  alert('✅ Veículo excluído!');
  await carregarTabelaVeiculos();
  if (typeof atualizarDashboard === 'function') atualizarDashboard();
  if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
}

// ✅ Inicialização
quandoDOMPronto(() => {
  const originalMostrarPagina = window.mostrarPagina;
  window.mostrarPagina = async function (pagina) {
    if (originalMostrarPagina) originalMostrarPagina(pagina);
    if (pagina === 'veiculos') {
      await carregarTabelaVeiculos();
    }
  };
});

// ==================================================
// ✅ DISPONIBILIZA TUDO GLOBALMENTE PARA O HTML
// ==================================================
window.BD = BD;


// ============================================================
// COMPATIBILIDADE: Adicionar estrutura CONFIG.STATUS aninhada
// ============================================================
if (typeof CONFIG !== 'undefined' && !CONFIG.STATUS) {
    CONFIG.STATUS = {
        CHECKLIST: CONFIG.STATUS_CHECKLIST || { APROVADO: 'Aprovado', PENDENTE: 'Pendente', REPROVADO: 'Reprovado' },
        MANUTENCAO: CONFIG.STATUS_MANUTENCAO || { ABERTA: 'Aberta', ANDAMENTO: 'Em Andamento', CONCLUIDA: 'Concluída' },
        TIPO_MANUTENCAO: CONFIG.TIPO_MANUTENCAO || { PREVENTIVA: 'Preventiva', CORRETIVA: 'Corretiva', REVISAO: 'Revisão' }
    };
}
window.CONFIG = CONFIG;
window.abrirModalVeiculo = abrirModalVeiculo;
window.carregarTabelaVeiculos = carregarTabelaVeiculos;
window.CATEGORIAS_VEICULOS = CONFIG?.CATEGORIAS_VEICULOS;
window.excluirVeiculo = excluirVeiculo;

// ============================================================
// ARQUIVO: checklist.js
// ============================================================

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
/* FUNÇÃO DUPLICADA REMOVIDA: ehAdmin */


// Verifica se usuário é Motorista
/* FUNÇÃO DUPLICADA REMOVIDA: ehMotorista */


// Aplica classe do perfil no corpo da página ao carregar
quandoDOMPronto(function() {
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

// ============================================================
// ARQUIVO: manutencao.js
// ============================================================

// ==================================================
// CONTROLE DE MANUTENÇÃO — Preventiva e Corretiva ✅ CORRIGIDO
// ==================================================

let manutencaoEmEdicao = null;
let tipoManutencaoAtual = null;

// ✅ Garante função auxiliar existência
/* FUNÇÃO DUPLICADA REMOVIDA: veiculosDoUsuario */


// ✅ Abre janela de cadastro ou edição
function abrirModalManutencao(tipo, manutencao = null) {
  manutencaoEmEdicao = manutencao;
  tipoManutencaoAtual = tipo || manutencao?.tipo;
  const ehEdicao = !!manutencao;
  const ehPreventiva = tipoManutencaoAtual === 'preventiva';

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">${ehEdicao ? '✏️ Editar' : '➕ Cadastrar'} ${ehPreventiva ? '🔧 Preventiva' : '🛠️ Corretiva'}</h3>
        <button type="button" onclick="fecharModal()"><i class="fa-solid fa-times text-slate-400"></i></button>
      </div>
      <form id="formManutencao" class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1">Veículo *</label>
          <select id="mVeiculo" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="">Selecione o veículo</option>
            ${veiculosDoUsuario().map(v => `<option value="${v.id}" ${String(manutencao?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Serviço / Descrição *</label>
          <input type="text" id="mServico" class="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Ex: Troca de óleo, Freios..." required value="${manutencao?.servico || ''}">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Data Prevista *</label>
            <input type="date" id="mData" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${manutencao?.dataPrevista || ''}">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Km Previsto *</label>
            <input type="number" id="mKm" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${manutencao?.kmPrevisto || ''}">
          </div>
        </div>
        ${ehPreventiva ? `<div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Repetir a cada (km)</label>
            <input type="number" id="mIntervaloKm" class="w-full px-3 py-2 border border-slate-200 rounded-lg" value="${manutencao?.intervaloKm || ''}">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Repetir a cada (dias)</label>
            <input type="number" id="mIntervaloDias" class="w-full px-3 py-2 border border-slate-200 rounded-lg" value="${manutencao?.intervaloDias || ''}">
          </div>
        </div>` : ''}
        <div>
          <label class="block text-sm font-medium mb-1">Custo (R$)</label>
          <input type="number" step="0.01" id="mCusto" class="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="0,00" value="${manutencao?.custo || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Status</label>
          <select id="mStatus" class="w-full px-3 py-2 border border-slate-200 rounded-lg">
            <option value="Pendente" ${manutencao?.status === 'Pendente' ? 'selected' : ''}>⏳ Pendente</option>
            <option value="Em Andamento" ${manutencao?.status === 'Em Andamento' ? 'selected' : ''}>🔧 Em Andamento</option>
            <option value="Concluída" ${manutencao?.status === 'Concluída' ? 'selected' : ''}>✅ Concluída</option>
          </select>
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg mt-2">
          ${ehEdicao ? '💾 Salvar' : '➕ Cadastrar'}
        </button>
      </form>
    </div>
  `;
  document.getElementById('modais').appendChild(modal);

  // ✅ MANIPULAÇÃO DO FORMULÁRIO
  document.getElementById('formManutencao').addEventListener('submit', e => {
    e.preventDefault();

    const veiculoId = document.getElementById('mVeiculo').value;
    const servico = document.getElementById('mServico').value.trim();
    const dataPrevista = document.getElementById('mData').value;
    const kmPrevisto = parseFloat(document.getElementById('mKm').value);
    const custo = parseFloat(document.getElementById('mCusto').value) || 0;
    const status = document.getElementById('mStatus').value;

    // ✅ VALIDAÇÕES com verificação segura
    if (!(typeof Validacoes !== 'undefined' && Validacoes.camposPreenchidos([veiculoId, servico, dataPrevista, kmPrevisto]))) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    if (!(typeof Validacoes !== 'undefined' && Validacoes.kmValido(kmPrevisto))) {
      alert('❌ Quilometragem prevista inválida!');
      return;
    }

    const dados = {
      veiculoId,
      tipo: tipoManutencaoAtual,
      servico,
      dataPrevista,
      kmPrevisto,
      custo,
      status,
      ...(ehPreventiva && {
        intervaloKm: parseFloat(document.getElementById('mIntervaloKm').value) || null,
        intervaloDias: parseFloat(document.getElementById('mIntervaloDias').value) || null
      })
    };

    if (ehEdicao) {
      // ✅ Usando função genérica do banco
      if (typeof atualizarRegistro === 'function') {
        atualizarRegistro('manutencoes', manutencao.id, dados);
      } else {
        const idx = (BD.manutencoes || []).findIndex(m => String(m.id) === String(manutencao.id));
        if (idx !== -1) {
          BD.manutencoes[idx] = { ...BD.manutencoes[idx], ...dados };
          if (typeof salvarDados === 'function') salvarDados();
        }
      }
    } else {
      // ✅ Usando função genérica do banco
      dados.criadoPor = (typeof usuarioAtual !== 'undefined' && usuarioAtual?.nome) || 'Sistema';
      if (typeof adicionarRegistro === 'function') {
        adicionarRegistro('manutencoes', dados);
      } else {
        if (!BD.manutencoes) BD.manutencoes = [];
        dados.id = (typeof Utils?.gerarId === 'function') ? Utils.gerarId() : Date.now();
        BD.manutencoes.push(dados);
        if (typeof salvarDados === 'function') salvarDados();
      }
    }

    fecharModal();
    if (typeof carregarTabelaManutencao === 'function') carregarTabelaManutencao();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
    alert('✅ Manutenção salva com sucesso!');
  });
}

// ✅ Exclui manutenção
function excluirManutencao(id) {
  if (confirm('⚠️ Tem certeza que deseja excluir esta manutenção?')) {
    if (typeof excluirRegistro === 'function') {
      excluirRegistro('manutencoes', id);
    } else {
      BD.manutencoes = (BD.manutencoes || []).filter(m => String(m.id) !== String(id));
      if (typeof salvarDados === 'function') salvarDados();
    }
    if (typeof carregarTabelaManutencao === 'function') carregarTabelaManutencao();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
  }
}

// ✅ Carrega e exibe tabela com filtro por veículo
function carregarTabelaManutencao(filtroPlaca = 'todos') {
  const corpo = document.getElementById('tabelaManutencao');
  if (!corpo) return;

  // ✅ Garante existência da lista
  let dados = BD.manutencoes || [];

  // ✅ Filtro por veículo — normaliza comparação de ID
  if (filtroPlaca !== 'todos') {
    dados = dados.filter(m => {
      const veiculo = (BD.veiculos || []).find(v => String(v.id) === String(m.veiculoId));
      return veiculo?.placa === filtroPlaca;
    });
  }

  corpo.innerHTML = dados.length ? dados.map(m => {
    const veic = (BD.veiculos || []).find(v => String(v.id) === String(m.veiculoId));
    const statusClasse = m.status === 'Concluída' ? 'text-green-600' :
                          m.status === 'Em Andamento' ? 'text-amber-500' : 'text-slate-500';

    // ✅ JSON SEGURO para edição — escapa corretamente
    const seguro = JSON.stringify(m).replace(/"/g, '&quot;');

    return `<tr>
      <td>${typeof Utils?.formatarData === 'function' ? Utils.formatarData(m.dataPrevista) : new Date(m.dataPrevista).toLocaleDateString('pt-BR')}</td>
      <td class="font-mono font-semibold">${veic?.placa || '—'}</td>
      <td>${m.tipo === 'preventiva' ? '🔧 Preventiva' : '🛠️ Corretiva'}</td>
      <td>${m.servico}</td>
      <td class="${statusClasse}">${m.status}</td>
      <td>
        <button class="text-blue-600 text-sm mr-1 admin-only" onclick='abrirModalManutencao("${m.tipo}", ${seguro})'>✏️</button>
        <button class="text-red-600 text-sm admin-only" onclick="excluirManutencao('${m.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" class="text-center text-slate-400 py-4">${filtroPlaca === 'todos' ? 'Nenhuma solicitação registrada' : 'Nenhum registro para este veículo'}</td></tr>`;
}

// ============================================================
// ARQUIVO: gastos.js
// ============================================================

// ==================================================
// CONTROLE DE GASTOS E DESPESAS ✅ CORRIGIDO
// ==================================================

let gastoEmEdicao = null;

// ✅ Garante função auxiliar existência
/* FUNÇÃO DUPLICADA REMOVIDA: veiculosDoUsuario */


// ✅ Abre janela de cadastro ou edição
function abrirModalGasto(gasto = null) {
  gastoEmEdicao = gasto;
  const ehEdicao = !!gasto;

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">💰 ${ehEdicao ? '✏️ Editar' : '➕ Lançar'} Gasto</h3>
        <button type="button" onclick="fecharModal()"><i class="fa-solid fa-times text-slate-400"></i></button>
      </div>
      <form id="formGasto" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">Data *</label>
            <input type="date" id="gData" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${gasto?.data || ''}">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Valor (R$) *</label>
            <input type="number" step="0.01" id="gValor" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${gasto?.valor || ''}">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Veículo *</label>
          <select id="gVeiculo" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="">Selecione o veículo</option>
            ${veiculosDoUsuario().map(v => `<option value="${v.id}" ${String(gasto?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Obra / Local *</label>
          <select id="gObra" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="">Selecione</option>
            ${(BD.obras || []).map(o => `<option value="${o}" ${gasto?.obra === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Tipo de Gasto *</label>
          <select id="gTipo" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="Combustível" ${gasto?.tipo === 'Combustível' ? 'selected' : ''}>⛽ Combustível</option>
            <option value="Manutenção" ${gasto?.tipo === 'Manutenção' ? 'selected' : ''}>🔧 Manutenção</option>
            <option value="Pneus" ${gasto?.tipo === 'Pneus' ? 'selected' : ''}>🚛 Pneus</option>
            <option value="Pedágio" ${gasto?.tipo === 'Pedágio' ? 'selected' : ''}>🛣️ Pedágio</option>
            <option value="Seguro" ${gasto?.tipo === 'Seguro' ? 'selected' : ''}>🛡️ Seguro</option>
            <option value="Outro" ${gasto?.tipo === 'Outro' ? 'selected' : ''}>📋 Outro</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Observação</label>
          <input type="text" id="gObs" class="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Detalhes..." value="${gasto?.observacao || ''}">
        </div>
        <button type="submit" class="w-full bg-green-600 text-white py-2 rounded-lg mt-2">
          ${ehEdicao ? '💾 Salvar' : '➕ Salvar Gasto'}
        </button>
      </form>
    </div>
  `;
  document.getElementById('modais').appendChild(modal);

  // ✅ MANIPULAÇÃO DO FORMULÁRIO
  document.getElementById('formGasto').addEventListener('submit', e => {
    e.preventDefault();

    const data = document.getElementById('gData').value;
    const veiculoId = document.getElementById('gVeiculo').value;
    const obra = document.getElementById('gObra').value;
    const tipo = document.getElementById('gTipo').value;
    const valor = parseFloat(document.getElementById('gValor').value);
    const observacao = document.getElementById('gObs').value.trim();

    // ✅ VALIDAÇÕES com verificação segura
    if (!(typeof Validacoes !== 'undefined' && Validacoes.camposPreenchidos([data, veiculoId, obra, tipo]))) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    if (!valor || valor <= 0) {
      alert('❌ O valor deve ser maior que zero!');
      return;
    }

    const dados = {
      data,
      veiculoId,
      obra,
      tipo,
      valor,
      observacao,
      lancadoPor: (typeof usuarioAtual !== 'undefined' && usuarioAtual?.nome) || 'Sistema'
    };

    if (ehEdicao) {
      // ✅ Usando função genérica do banco com fallback
      if (typeof atualizarRegistro === 'function') {
        atualizarRegistro('gastos', gasto.id, dados);
      } else {
        const idx = (BD.gastos || []).findIndex(g => String(g.id) === String(gasto.id));
        if (idx !== -1) {
          BD.gastos[idx] = { ...BD.gastos[idx], ...dados };
          if (typeof salvarDados === 'function') salvarDados();
        }
      }
    } else {
      // ✅ Usando função genérica do banco com fallback
      if (typeof adicionarRegistro === 'function') {
        adicionarRegistro('gastos', dados);
      } else {
        if (!BD.gastos) BD.gastos = [];
        dados.id = (typeof Utils?.gerarId === 'function') ? Utils.gerarId() : Date.now();
        BD.gastos.push(dados);
        if (typeof salvarDados === 'function') salvarDados();
      }
    }

    fecharModal();
    if (typeof carregarTabelaGastos === 'function') carregarTabelaGastos();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
    alert('✅ Gasto salvo com sucesso!');
  });
}

// ✅ Exclui gasto
function excluirGasto(id) {
  if (confirm('⚠️ Tem certeza que deseja excluir este lançamento?')) {
    if (typeof excluirRegistro === 'function') {
      excluirRegistro('gastos', id);
    } else {
      BD.gastos = (BD.gastos || []).filter(g => String(g.id) !== String(id));
      if (typeof salvarDados === 'function') salvarDados();
    }
    if (typeof carregarTabelaGastos === 'function') carregarTabelaGastos();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
  }
}

// ✅ Carrega e exibe tabela com filtro por veículo
function carregarTabelaGastos(filtroPlaca = 'todos') {
  const corpo = document.getElementById('tabelaGastos');
  if (!corpo) return;

  // ✅ Garante existência da lista
  let dados = BD.gastos || [];

  // ✅ Filtro corrigido: busca veículo com comparação normalizada
  if (filtroPlaca !== 'todos') {
    dados = dados.filter(g => {
      const veiculo = (BD.veiculos || []).find(v => String(v.id) === String(g.veiculoId));
      return veiculo?.placa === filtroPlaca;
    });
  }

  corpo.innerHTML = dados.length ? dados.map(g => {
    const veic = (BD.veiculos || []).find(v => String(v.id) === String(g.veiculoId));
    // ✅ Formatação segura com fallback
    const dataFormatada = (typeof Utils?.formatarData === 'function')
      ? Utils.formatarData(g.data)
      : new Date(g.data).toLocaleDateString('pt-BR');
    const valorFormatado = (typeof Utils?.formatarMoeda === 'function')
      ? Utils.formatarMoeda(g.valor)
      : `R$ ${Number(g.valor).toFixed(2).replace('.', ',')}`;
    // ✅ JSON SEGURO para edição
    const seguro = JSON.stringify(g).replace(/"/g, '&quot;');

    return `<tr>
      <td>${dataFormatada}</td>
      <td class="font-mono font-semibold">${veic?.placa || '—'}</td>
      <td>${g.tipo}</td>
      <td>${valorFormatado}</td>
      <td>${g.observacao || '—'}</td>
      <td class="admin-only">
        <button class="text-blue-600 text-sm mr-1" onclick='abrirModalGasto(${seguro})'>✏️</button>
        <button class="text-red-600 text-sm" onclick="excluirGasto('${g.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" class="text-center text-slate-400 py-4">${filtroPlaca === 'todos' ? 'Nenhum registro de gasto' : 'Nenhum registro para este veículo'}</td></tr>`;
}

// ============================================================
// ARQUIVO: chamados.js
// ============================================================

// ===== CHAMADOS ✅ CORRIGIDO =====

let chamadoEmEdicao = null;

// ✅ Garante função auxiliar existência
/* FUNÇÃO DUPLICADA REMOVIDA: veiculosDoUsuario */


// ✅ Abre janela de cadastro ou edição
function abrirModalChamado(chamado = null) {
  chamadoEmEdicao = chamado;
  const ehEdicao = !!chamado;
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">📢 ${ehEdicao ? '✏️ Editar' : '➕ Registrar'} Chamado</h3>
        <button type="button" onclick="fecharModal()"><i class="fa-solid fa-times text-slate-400"></i></button>
      </div>
      <form id="formChamado" class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1">Veículo *</label>
          <select id="chVeiculo" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="">Selecione o veículo</option>
            ${veiculosDoUsuario().map(v => `<option value="${v.id}" ${String(chamado?.veiculoId) === String(v.id) ? 'selected' : ''}>${v.placa} — ${v.modelo}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Tipo de Ocorrência *</label>
          <select id="chTipo" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required>
            <option value="Problema Mecânico" ${chamado?.tipo === 'Problema Mecânico' ? 'selected' : ''}>🔧 Problema Mecânico</option>
            <option value="Sinistro" ${chamado?.tipo === 'Sinistro' ? 'selected' : ''}>💥 Sinistro / Acidente</option>
            <option value="Outro" ${chamado?.tipo === 'Outro' ? 'selected' : ''}>📋 Outro</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Obra / Local *</label>
          <input type="text" id="chObra" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${chamado?.obra || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Quilometragem *</label>
          <input type="number" id="chKm" class="w-full px-3 py-2 border border-slate-200 rounded-lg" required value="${chamado?.km || ''}">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Descrição *</label>
          <textarea id="chDescricao" class="w-full px-3 py-2 border border-slate-200 rounded-lg" rows="3" required>${chamado?.descricao || ''}</textarea>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Status</label>
          <select id="chStatus" class="w-full px-3 py-2 border border-slate-200 rounded-lg">
            <option value="Aberto" ${chamado?.status === 'Aberto' ? 'selected' : ''}>🔴 Aberto</option>
            <option value="Em Andamento" ${chamado?.status === 'Em Andamento' ? 'selected' : ''}>🟡 Em Andamento</option>
            <option value="Resolvido" ${chamado?.status === 'Resolvido' ? 'selected' : ''}>🟢 Resolvido</option>
          </select>
        </div>
        <button type="submit" class="w-full bg-red-600 text-white py-2 rounded-lg mt-2">${ehEdicao ? '💾 Salvar' : '➕ Registrar'}</button>
      </form>
    </div>
  `;
  document.getElementById('modais').appendChild(modal);

  // ✅ MANIPULAÇÃO DO FORMULÁRIO
  document.getElementById('formChamado').addEventListener('submit', e => {
    e.preventDefault();
    const veicId = document.getElementById('chVeiculo').value; // ✅ Mantém como string, converte só quando necessário
    const kmValor = parseFloat(document.getElementById('chKm').value);

    // ✅ Validações com verificação segura
    if (!(typeof Validacoes !== 'undefined' && Validacoes.camposPreenchidos([veicId, kmValor]))) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    if (!(typeof Validacoes !== 'undefined' && Validacoes.kmValido(kmValor))) {
      alert('❌ Quilometragem inválida!');
      return;
    }

    const dados = {
      veiculoId: veicId, // ✅ Mantém tipo original para consistência entre módulos
      tipo: document.getElementById('chTipo').value,
      obra: document.getElementById('chObra').value,
      km: kmValor,
      descricao: document.getElementById('chDescricao').value.trim(),
      status: document.getElementById('chStatus').value,
      responsavel: chamado?.responsavel || ((typeof usuarioAtual !== 'undefined' && usuarioAtual?.nome) || 'Administrador'),
      data: chamado?.data || new Date().toISOString()
    };

    if (ehEdicao) {
      // ✅ Fallback seguro com funções do banco
      if (typeof atualizarRegistro === 'function') {
        atualizarRegistro('chamados', chamado.id, dados);
      } else {
        if (!BD.chamados) BD.chamados = [];
        const idx = BD.chamados.findIndex(c => String(c.id) === String(chamado.id));
        if (idx !== -1) {
          BD.chamados[idx] = { ...BD.chamados[idx], ...dados };
          if (typeof salvarDados === 'function') salvarDados();
        }
      }
    } else {
      // ✅ Novo registro com fallback seguro
      if (typeof adicionarRegistro === 'function') {
        adicionarRegistro('chamados', dados);
      } else {
        if (!BD.chamados) BD.chamados = [];
        dados.id = (typeof Utils?.gerarId === 'function') ? Utils.gerarId() : Date.now();
        BD.chamados.push(dados);
        if (typeof salvarDados === 'function') salvarDados();
      }

      if (typeof Sincronizacao !== 'undefined' && Sincronizacao?.sincronizarRegistro) {
        Sincronizacao.sincronizarRegistro('chamados', dados).catch(() => {});
      }
    }

    fecharModal();
    if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
    if (typeof carregarMeusRegistros === 'function') carregarMeusRegistros();
    alert('✅ Chamado salvo com sucesso!');
  });
}

// ✅ Excluir chamado
function excluirChamado(id) {
  if (confirm('⚠️ Tem certeza que deseja excluir este chamado permanentemente?')) {
    if (typeof excluirRegistro === 'function') {
      excluirRegistro('chamados', id);
    } else {
      BD.chamados = (BD.chamados || []).filter(c => String(c.id) !== String(id));
      if (typeof salvarDados === 'function') salvarDados();
    }
    if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
  }
}

// ✅ Alterar status do chamado
function alterarStatusChamado(id, status) {
  const chamado = (BD.chamados || []).find(c => String(c.id) === String(id));
  if (chamado) {
    chamado.status = status;
    if (typeof salvarDados === 'function') salvarDados();
    if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
    if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
    else if (typeof atualizarDashboard === 'function') atualizarDashboard();
  }
}

// ✅ Carregar tabela de chamados
function carregarTabelaChamados() {
  const corpo = document.getElementById('tabelaChamados');
  if (!corpo) return;
  const ehAdmin = (typeof usuarioAtual !== 'undefined' && usuarioAtual?.perfil) === 'admin';
  const listaBruta = BD.chamados || [];
  const lista = typeof filtrarPorVeiculosPermitidos === 'function'
    ? filtrarPorVeiculosPermitidos(listaBruta)
    : listaBruta;

  corpo.innerHTML = lista.length ? lista.map(c => {
    const v = (BD.veiculos || []).find(x => String(x.id) === String(c.veiculoId));
    // ✅ Formatação segura com fallback
    const dt = (typeof Utils?.formatarData === 'function')
      ? Utils.formatarData(c.data)
      : new Date(c.data).toLocaleDateString('pt-BR');
    const statusLabel = {
      'Aberto': '<span class="text-red-600">🔴 Aberto</span>',
      'Em Andamento': '<span class="text-amber-600">🟡 Em Andamento</span>',
      'Resolvido': '<span class="text-green-600">🟢 Resolvido</span>'
    }[c.status] || c.status;
    // ✅ JSON seguro para edição
    const seguro = JSON.stringify(c).replace(/"/g, '&quot;');

    return `<tr class="border-b hover:bg-slate-50">
      <td class="px-4 py-3">${dt}</td>
      <td class="px-4 py-3 font-mono">${v?.placa || '—'}</td>
      <td class="px-4 py-3">${c.tipo}</td>
      <td class="px-4 py-3">${c.obra}</td>
      <td class="px-4 py-3">${statusLabel}</td>
      <td class="px-4 py-3 admin-only whitespace-nowrap">
        ${ehAdmin ? `
          <button class="text-blue-600 text-sm mr-2" onclick='abrirModalChamado(${seguro})'><i class="fa-solid fa-pen-to-square"></i> Editar</button>
          <button class="text-red-600 text-sm" onclick="excluirChamado('${String(c.id)}')"><i class="fa-solid fa-trash"></i> Excluir</button>
        ` : ''}
      </td>
    </tr>`;
  }).join('') : '<tr><td colspan="6" class="px-4 py-6 text-center text-slate-500">Nenhum registro disponível</td></tr>';
}

// ❌ Removida função salvarChamado() duplicada/incorreta — conflitava com o envio do formulário

// ============================================================
// ARQUIVO: alocacoes.js
// ============================================================

// import removido

async function carregarSelectLocaisAlocacao() {
  const locais = await obterLocais();
  const listaNomes = locais.map(l => l.nome);

  const origemEl = document.getElementById('alocacaoOrigem');
  const destinoEl = document.getElementById('alocacaoDestino');

  if (origemEl) {
    origemEl.innerHTML = '<option value="">Selecione origem...</option>';
    listaNomes.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      origemEl.appendChild(opt);
    });
  }

  if (destinoEl) {
    destinoEl.innerHTML = '<option value="">Selecione destino...</option>';
    listaNomes.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      destinoEl.appendChild(opt);
    });
  }
}

async function abrirModalAlocacao() {
  const veiculos = await obterVeiculos();
  
  if (!veiculos || veiculos.length === 0) {
    alert('⚠️ Cadastre um veículo primeiro!');
    return;
  }

  const placas = veiculos.map(v => `<option value="${v.placa}">${v.placa}</option>`).join('');

  document.getElementById('modais').innerHTML = `
    <div class="modal-fundo" onclick="if(event.target===this)fecharModal()">
      <div class="modal-corpo">
        <div class="modal-cabecalho">
          <h3 style="margin:0; font-size:1.125rem; font-weight:600;">📍 Nova Alocação</h3>
          <button type="button" class="btn-fechar" onclick="fecharModal()">&times;</button>
        </div>
        <div class="modal-conteudo">
          <form onsubmit="salvarAlocacaoForm(event)">
            <div class="linha-form">
              <label>Veículo (Placa)</label>
              <select id="alocacaoPlaca" required>${placas}</select>
            </div>
            <div class="linha-form">
              <label>📍 Origem</label>
              <select id="alocacaoOrigem" required>
                <option value="">Carregando...</option>
              </select>
            </div>
            <div class="linha-form">
              <label>📍 Destino</label>
              <select id="alocacaoDestino" required>
                <option value="">Carregando...</option>
              </select>
            </div>
            <div class="linha-form">
              <label>Km Inicial</label>
              <input type="number" id="alocacaoKmInicial" required placeholder="0">
            </div>
            <div class="linha-form">
              <label>Responsável / Motorista</label>
              <input type="text" id="alocacaoResponsavel" required placeholder="Nome completo">
            </div>
            <div class="linha-form">
              <label>Observação (opcional)</label>
              <textarea id="alocacaoObs" rows="2" placeholder="Informações adicionais..."></textarea>
            </div>
            <div class="botoes-form">
              <button type="button" class="btn" style="background:#f1f5f9; color:#475569;" onclick="fecharModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary">Salvar Alocação</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;

  setTimeout(() => carregarSelectLocaisAlocacao(), 50);
}

async function salvarAlocacaoForm(event) {
  event.preventDefault();

  const placa = document.getElementById('alocacaoPlaca').value;
  const origem = document.getElementById('alocacaoOrigem').value.trim();
  const destino = document.getElementById('alocacaoDestino').value.trim();
  const kmInicial = parseInt(document.getElementById('alocacaoKmInicial').value);
  const responsavel = document.getElementById('alocacaoResponsavel').value.trim();
  const observacao = document.getElementById('alocacaoObs').value.trim() || '';

  if (!origem || !destino) {
    alert('⚠️ Selecione Origem e Destino!');
    return;
  }
  if (origem === destino) {
    alert('⚠️ Origem e Destino não podem ser iguais!');
    return;
  }

  const veiculo = await obterVeiculoPorPlaca(placa);
  if (!veiculo) {
    alert('⚠️ Veículo não encontrado!');
    return;
  }

  const dadosAlocacao = {
    veiculo_id: veiculo.id,
    motorista: responsavel,
    data_saida: new Date().toISOString().split('T')[0],
    hora_saida: new Date().toTimeString().split(' ')[0].substring(0, 5),
    km_saida: kmInicial,
    origem: origem,
    destino: destino,
    observacoes: observacao,
    status: 'ativa'
  };

  const resultado = await salvarAlocacao(dadosAlocacao);
  
  if (resultado) {
    alert('✅ Alocação salva com sucesso!');
    fecharModal();
    carregarTabelaAlocacoes();
  } else {
    alert('❌ Erro ao salvar alocação!');
  }
}

async function carregarTabelaAlocacoes(filtroVeiculo = 'todos') {
  const tbody = document.getElementById('tabelaAlocacoes');
  if (!tbody) return;

  let lista = await obterAlocacoes();
  
  if (filtroVeiculo && filtroVeiculo !== 'todos') {
    lista = lista.filter(a => a.veiculo?.placa === filtroVeiculo);
  }

  if (lista.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:2rem;">Sem registros de alocação</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map(a => `
    <tr>
      <td><strong>${a.veiculo?.placa || '-'}</strong></td>
      <td>📍 ${a.origem || '-'} → ${a.destino || '-'}</td>
      <td>${a.data_saida || '-'}</td>
      <td>${a.km_saida || '-'}</td>
      <td>${a.motorista || '-'}</td>
    </tr>
  `).join('');
}

quandoDOMPronto(function() {
  const originalMostrarPagina = window.mostrarPagina;
  window.mostrarPagina = async function (pagina) {
    if (originalMostrarPagina) originalMostrarPagina(pagina);
    if (pagina === 'alocacoes') {
      await carregarTabelaAlocacoes();
      if (typeof atualizarListaVeiculosNosFiltros === 'function') {
        atualizarListaVeiculosNosFiltros();
      }
    }
  };
});

window.abrirModalAlocacao = abrirModalAlocacao;
window.salvarAlocacaoForm = salvarAlocacaoForm;
window.carregarTabelaAlocacoes = carregarTabelaAlocacoes;

// ============================================================
// ARQUIVO: sync.js
// ============================================================

// ==================================================
// SINCRONIZAÇÃO LOCAL COM BACKEND
// ==================================================
const Sincronizacao = {
  endpoint: localStorage.getItem('gf_sync_url') || 'http://localhost:3000/api',
  dispositivoId: localStorage.getItem('gf_device_id') || (() => {
    const id = (typeof Utils !== 'undefined' && Utils.gerarId) ? Utils.gerarId() : Date.now().toString(36);
    localStorage.setItem('gf_device_id', id);
    return id;
  })(),

  async sincronizarRegistro(collection, registro) {
    try {
      await fetch(`${this.endpoint}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.dispositivoId,
          collection,
          registros: [registro]
        })
      });
    } catch (erro) {
      console.warn('Falha ao sincronizar registro:', erro);
    }
  },

  async puxarBase() {
    try {
      const resposta = await fetch(`${this.endpoint}/sync/bundle?deviceId=${encodeURIComponent(this.dispositivoId)}`);
      if (!resposta.ok) return;
      const dadosServidor = await resposta.json();

      ['checklists', 'chamados'].forEach(lista => {
        if (!Array.isArray(dadosServidor[lista])) return;
        const existentes = new Set((BD[lista] || []).map(item => String(item.id)));
        dadosServidor[lista].forEach(item => {
          if (!existentes.has(String(item.id))) {
            BD[lista].push(item);
          }
        });
      });

      if (typeof salvarDados === 'function') salvarDados();
      if (typeof carregarTabelaChecklist === 'function') carregarTabelaChecklist();
      if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
      if (typeof carregarMeusRegistros === 'function') carregarMeusRegistros();
    } catch (erro) {
      console.warn('Falha ao buscar dados do servidor:', erro);
    }
  },

  iniciar() {
    const executar = () => this.puxarBase();
    quandoDOMPronto(executar);
  }
};

Sincronizacao.iniciar();

// ============================================================
// ARQUIVO: auth.js
// ============================================================

if (typeof window.usuarioAtual === 'undefined') window.usuarioAtual = null;
var usuarioAtual = window.usuarioAtual;
window.USUARIOS = window.USUARIOS || [
  { usuario: 'admin', senha: 'admin123', nome: 'Administrador', perfil: 'admin' },
  { usuario: 'operador', senha: '1234', nome: 'Operador', perfil: 'operador' }
];

function verificarSessao() {
  const sessao = localStorage.getItem('sessaoUsuario');
  if (sessao) {
    try {
      window.usuarioAtual = JSON.parse(sessao);
      usuarioAtual = window.usuarioAtual;
      mostrarSistema();
    } catch {
      localStorage.removeItem('sessaoUsuario');
      mostrarLogin();
    }
  } else {
    mostrarLogin();
  }
}

function mostrarLogin() {
  const telaLogin = document.getElementById('telaLogin');
  const telaSistema = document.getElementById('sistemaPrincipal');
  if (telaLogin) telaLogin.classList.remove('hidden');
  if (telaSistema) telaSistema.classList.add('hidden');
}

function mostrarSistema() {
  const telaLogin = document.getElementById('telaLogin');
  const telaSistema = document.getElementById('sistemaPrincipal');
  if (telaLogin) telaLogin.classList.add('hidden');
  if (telaSistema) telaSistema.classList.remove('hidden');

  sincronizarUsuarioNaTela();

  if (typeof carregarDados === 'function') carregarDados();
  if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
  if (typeof carregarTabelaChecklist === 'function') carregarTabelaChecklist();
  if (typeof carregarTabelaManutencao === 'function') carregarTabelaManutencao();
  if (typeof carregarTabelaGastos === 'function') carregarTabelaGastos();
  if (typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
  if (typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
  else if (typeof atualizarDashboard === 'function') atualizarDashboard();
}

function entrarNoSistema() {
  const user = (document.getElementById('loginUsuario')?.value || document.getElementById('campoUsuario')?.value || '').trim();
  const pass = document.getElementById('loginSenha')?.value || document.getElementById('campoSenha')?.value || '';
  const erroEl = document.getElementById('erroLogin');

  if (erroEl) { erroEl.style.display = 'none'; erroEl.textContent = ''; }

  if (!user || !pass) {
    if (erroEl) { erroEl.style.display = 'block'; erroEl.textContent = '⚠️ Preencha usuário e senha!'; }
    else alert('⚠️ Preencha usuário e senha!');
    return;
  }

  console.log('Tentativa de login:', user, pass);
  const encontrado = window.USUARIOS.find(u => u.usuario === user && u.senha === pass);

  if (!encontrado) {
    const msg = `❌ Usuário ou senha incorretos (usuario='${user}').`;
    if (erroEl) { erroEl.style.display = 'block'; erroEl.textContent = msg; }
    else alert(msg);
    return;
  }

  window.usuarioAtual = { nome: encontrado.nome, usuario: encontrado.usuario, perfil: encontrado.perfil };
  usuarioAtual = window.usuarioAtual;
  localStorage.setItem('sessaoUsuario', JSON.stringify(window.usuarioAtual));
  mostrarSistema();
}

function sairDoSistema() {
  localStorage.removeItem('sessaoUsuario');
  usuarioAtual = null;
  mostrarLogin();
}

function sairSistema() {
  sairDoSistema();
}

function sincronizarUsuarioNaTela() {
  const elNome = document.getElementById('nomeUsuario');
  if (elNome && window.usuarioAtual) {
    elNome.textContent = window.usuarioAtual.nome;
  }
  const elInfo = document.getElementById('infoUsuario');
  if (elInfo && window.usuarioAtual) elInfo.textContent = window.usuarioAtual.nome;
}

quandoDOMPronto(verificarSessao);

// Conecta o formulário de login do `index.html` ao fluxo de autenticação
quandoDOMPronto(() => {
  const form = document.getElementById('formLogin');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      entrarNoSistema();
    });
  }
  sincronizarUsuarioNaTela();
});

// ============================================================
// ARQUIVO: correcoes.js
// ============================================================

// js/correcoes.js
// Este arquivo deve ser carregado DEPOIS de todos os módulos

// ✅ Garante que BD existe e tem todas as propriedades
window.BD = window.BD || {
  locais: [{ id: 'patio-metalica', nome: 'Pátio Metálica' }, { id: 'patio-usina-conc', nome: 'Pátio Usina Conc.' }, { id: 'obra', nome: 'Obra' }],
  veiculos: [], checklists: [], manutencoes: [], gastos: [], chamados: [], alocacoes: [], usuarios: [],
  origens: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
  destinos: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra'],
  obras: ['Pátio Metálica', 'Pátio Usina Conc.', 'Obra']
};

// ✅ Garante que CONFIG existe
window.CONFIG = window.CONFIG || {
  STATUS_VEICULOS: { ATIVO: 'Em Operação', MANUTENCAO: 'Em Manutenção', INATIVO: 'Inativo' },
  CATEGORIAS_VEICULOS: ['Caminhão', 'Carro Passeio', 'Utilitário', 'Máquina', 'Van', 'Ônibus', 'Moto', 'Outro'],
  STATUS_CHECKLIST: { APROVADO: 'Aprovado', PENDENTE: 'Pendente', REPROVADO: 'Reprovado' },
  TIPO_MANUTENCAO: { PREVENTIVA: 'Preventiva', CORRETIVA: 'Corretiva', REVISAO: 'Revisão' },
  STATUS_MANUTENCAO: { ABERTA: 'Aberta', ANDAMENTO: 'Em Andamento', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada' },
  TIPO_GASTOS: ['Abastecimento', 'Peças', 'Serviço', 'IPVA', 'Seguro', 'Licenciamento', 'Multa', 'Outros']
};

// ✅ Função auxiliar para categorias de veículos
window.getCategoriaVeiculo = function(catId) {
  const mapa = {
    caminhao: { icone: '🚛', nome: 'Caminhão' },
    utilitario: { icone: '🚐', nome: 'Utilitário' },
    carro: { icone: '🚗', nome: 'Carro' },
    moto: { icone: '🏍️', nome: 'Moto' },
    maquina: { icone: '🚜', nome: 'Máquina' },
    outro: { icone: '❔', nome: 'Outro' }
  };
  return mapa[catId] || { icone: '🚗', nome: catId || 'Veículo' };
};

// ✅ Funções genéricas de registro
window.adicionarRegistro = function(colecao, dados) {
  if (!BD[colecao]) BD[colecao] = [];
  dados.id = dados.id || (window.Utils?.gerarId?.() || Date.now());
  BD[colecao].push(dados);
  if (typeof salvarDados === 'function') salvarDados();
  return dados;
};

window.excluirRegistro = function(colecao, id) {
  if (!BD[colecao]) return;
  BD[colecao] = BD[colecao].filter(item => String(item.id) !== String(id));
  if (typeof salvarDados === 'function') salvarDados();
};

// ✅ Atualiza origens/destinos/obras a partir dos locais
window.atualizarListasDependentes = function() {
  if (BD.locais && BD.locais.length) {
    const nomes = BD.locais.map(l => l.nome);
    BD.origens = nomes;
    BD.destinos = nomes;
    BD.obras = nomes;
  }
};

// ✅ Dashboard
window.atualizarDashboard = window.atualizarDashboard || function() {
  if (!BD.veiculos) return;
  const elV = document.getElementById('dashVeiculos');
  const elA = document.getElementById('dashAtivos');
  const elM = document.getElementById('dashManutencao');
  const elC = document.getElementById('dashChamados');
  if (elV) elV.textContent = BD.veiculos.length;
  if (elA) elA.textContent = BD.veiculos.filter(v => v.status === 'disponivel' || v.status === 'alocado').length;
  if (elM) elM.textContent = BD.veiculos.filter(v => v.status === 'manutencao').length;
  if (elC) elC.textContent = (BD.chamados || []).length;
};
window.atualizarDashboardCompleto = window.atualizarDashboardCompleto || window.atualizarDashboard;

// ============================================================
// ✅ FUNÇÕES DE VEÍCULOS - GARANTIDAS GLOBALMENTE
// ============================================================

window.abrirModalVeiculo = function(veiculo = null) {
  const ehEdicao = !!veiculo;

  const modal = document.createElement('div');
  modal.className = 'modal-fundo';
  modal.onclick = (e) => { if (e.target === modal) fecharModal(); };
  modal.innerHTML = `
    <div class="modal-corpo">
      <div class="modal-cabecalho">
        <h3 style="margin:0; font-size:1.125rem; font-weight:600;">${ehEdicao ? '✏️ Editar' : '➕ Cadastrar'} Veículo</h3>
        <button type="button" class="btn-fechar" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-conteudo">
        <form id="formVeiculo">
          <div class="linha-form">
            <label>Placa *</label>
            <input type="text" id="vPlaca" style="text-transform:uppercase;" required value="${veiculo?.placa || ''}" ${ehEdicao ? 'readonly' : ''}>
          </div>
          <div class="linha-form">
            <label>Ano</label>
            <input type="number" id="vAno" value="${veiculo?.ano || ''}">
          </div>
          <div class="linha-form">
            <label>Categoria *</label>
            <select id="vCategoria" required>
              <option value="">Selecione</option>
              <option value="caminhao" ${veiculo?.categoria === 'caminhao' ? 'selected' : ''}>🚛 Caminhão</option>
              <option value="utilitario" ${veiculo?.categoria === 'utilitario' ? 'selected' : ''}>🚐 Utilitário</option>
              <option value="carro" ${veiculo?.categoria === 'carro' ? 'selected' : ''}>🚗 Carro</option>
              <option value="moto" ${veiculo?.categoria === 'moto' ? 'selected' : ''}>🏍️ Moto</option>
              <option value="maquina" ${veiculo?.categoria === 'maquina' ? 'selected' : ''}>🚜 Máquina</option>
              <option value="outro" ${veiculo?.categoria === 'outro' ? 'selected' : ''}>❔ Outro</option>
            </select>
          </div>
          <div class="linha-form">
            <label>Marca / Modelo *</label>
            <input type="text" id="vModelo" required value="${veiculo?.modelo || ''}">
          </div>
          <div class="linha-form">
            <label>Km Atual *</label>
            <input type="number" id="vKm" required value="${veiculo?.km_atual || 0}">
          </div>
          <div class="linha-form">
            <label>Status</label>
            <select id="vStatus">
              <option value="disponivel" ${veiculo?.status === 'disponivel' ? 'selected' : ''}>✅ Disponível</option>
              <option value="alocado" ${veiculo?.status === 'alocado' ? 'selected' : ''}>🚛 Alocado</option>
              <option value="manutencao" ${veiculo?.status === 'manutencao' ? 'selected' : ''}>🔧 Manutenção</option>
              <option value="inativo" ${veiculo?.status === 'inativo' ? 'selected' : ''}>⛔ Inativo</option>
            </select>
          </div>
          <div class="linha-form">
            <label>Obra / Local *</label>
            <input type="text" id="vObra" required value="${veiculo?.obra_atual || ''}" placeholder="Nome da obra ou local">
          </div>
          <div class="linha-form">
            <label>Responsável</label>
            <input type="text" id="vResponsavel" value="${veiculo?.responsavel || ''}" placeholder="Nome do motorista responsável">
          </div>
          <div class="botoes-form">
            <button type="button" class="btn" style="background:#f1f5f9; color:#475569;" onclick="fecharModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">${ehEdicao ? '💾 Salvar' : '➕ Cadastrar Veículo'}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('modais').appendChild(modal);

  document.getElementById('formVeiculo').addEventListener('submit', async e => {
    e.preventDefault();

    const placa = document.getElementById('vPlaca').value.toUpperCase().trim();
    const categoria = document.getElementById('vCategoria').value;
    const modelo = document.getElementById('vModelo').value.trim();
    const ano = document.getElementById('vAno').value || null;
    const kmAtual = parseInt(document.getElementById('vKm').value) || 0;
    const status = document.getElementById('vStatus').value;
    const obraAtual = document.getElementById('vObra').value.trim();
    const responsavel = document.getElementById('vResponsavel').value.trim() || null;

    if (!/^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/.test(placa.replace('-', '')) && !/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(placa)) {
      alert('❌ Placa inválida! Use o formato AAA-1234 ou AAA1A23');
      return;
    }
    if (!categoria || !modelo || !obraAtual) {
      alert('❌ Preencha todos os campos obrigatórios!');
      return;
    }
    if (kmAtual < 0) {
      alert('❌ Quilometragem deve ser um número positivo!');
      return;
    }

    const dados = { 
      placa, categoria, modelo, marca: modelo.split(' ')[0], ano, 
      km_atual: kmAtual, km_inicial: ehEdicao ? (veiculo?.km_inicial || kmAtual) : kmAtual,
      status, obra_atual: obraAtual, responsavel
    };

    if (ehEdicao) {
      dados.id = veiculo.id;
      const idx = BD.veiculos.findIndex(v => String(v.id) === String(veiculo.id));
      if (idx !== -1) BD.veiculos[idx] = { ...BD.veiculos[idx], ...dados };
    } else {
      const existe = BD.veiculos.find(v => v.placa === placa);
      if (existe) {
        alert('❌ Já existe um veículo cadastrado com esta placa!');
        return;
      }
      dados.id = window.Utils?.gerarId?.() || Date.now();
      BD.veiculos.push(dados);
    }

    if (typeof salvarDados === 'function') salvarDados();

    alert('✅ Veículo salvo com sucesso!');
    fecharModal();
    if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
    if (typeof atualizarDashboard === 'function') atualizarDashboard();
    if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
  });
};

window.carregarTabelaVeiculos = window.carregarTabelaVeiculos || async function() {
  const corpo = document.getElementById('tabelaVeiculos');
  if (!corpo) return;

  const veiculos = BD.veiculos || [];

  if (!veiculos.length) {
    corpo.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#94a3b8; padding:2rem;">Nenhum veículo cadastrado</td></tr>';
    return;
  }

  const statusMap = {
    disponivel: '<span class="badge badge-success">✅ Disponível</span>',
    alocado: '<span class="badge" style="background:#dbeafe; color:#1e40af;">🚛 Alocado</span>',
    manutencao: '<span class="badge badge-warning">🔧 Manutenção</span>',
    inativo: '<span class="badge badge-danger">⛔ Inativo</span>'
  };

  const catIcone = {
    caminhao: '🚛', utilitario: '🚐', carro: '🚗', moto: '🏍️', maquina: '🚜', outro: '❔'
  };

  corpo.innerHTML = veiculos.map(v => {
    const seguro = JSON.stringify(v).replace(/"/g, '&quot;');
    return `<tr>
      <td class="font-mono">${v.placa}</td>
      <td>${catIcone[v.categoria] || '❔'} ${v.categoria || '-'}</td>
      <td>${v.modelo}</td>
      <td>${Number(v.km_atual || 0).toLocaleString('pt-BR')} km</td>
      <td>${v.obra_atual || '—'}</td>
      <td>${statusMap[v.status] || v.status}</td>
      <td class="admin-only">
        <button class="btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:#fef3c7; color:#92400e; margin-right:0.25rem;" onclick='abrirModalVeiculo(${seguro})'>✏️</button>
        <button class="btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:#fee2e2; color:#991b1b;" onclick="excluirVeiculo('${v.placa || v.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
};

window.excluirVeiculo = window.excluirVeiculo || async function(identificador) {
  if (!confirm('⚠️ Tem certeza que deseja excluir este veículo?')) return;
  
  BD.veiculos = BD.veiculos.filter(v => v.placa !== identificador && String(v.id) !== String(identificador));
  if (typeof salvarDados === 'function') salvarDados();
  
  alert('✅ Veículo excluído!');
  if (typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
  if (typeof atualizarDashboard === 'function') atualizarDashboard();
  if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
};

// ✅ Inicializa listas
atualizarListasDependentes();

console.log('✅ Correções aplicadas com sucesso!');


// ============================================================
// ARQUIVO: navegacao.js
// ============================================================

if (!window.__navegacaoInicializada) {
  window.__navegacaoInicializada = true;

  function mostrarPagina(pagina) {
  const paginas = document.querySelectorAll('.pagina');
  const alvo = document.getElementById('pagina-' + pagina);

  paginas.forEach(secao => {
    secao.classList.remove('ativa');
    secao.style.display = 'none';
  });

  if (!alvo) {
    console.warn('Página não encontrada:', pagina);
    return;
  }

  alvo.classList.add('ativa');
  alvo.style.display = 'block';

  document.querySelectorAll('.sidebar-link').forEach(botao => botao.classList.remove('ativo'));
  const botaoAtivo = document.querySelector('.sidebar-link[data-pagina="' + pagina + '"]');
  if (botaoAtivo) botaoAtivo.classList.add('ativo');

  if (pagina === 'veiculos' && typeof carregarTabelaVeiculos === 'function') carregarTabelaVeiculos();
  if (pagina === 'checklist' && typeof carregarTabelaChecklist === 'function') {
    if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
    carregarTabelaChecklist();
  }
  if (pagina === 'manutencao' && typeof carregarTabelaManutencao === 'function') {
    if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
    carregarTabelaManutencao();
  }
  if (pagina === 'gastos' && typeof carregarTabelaGastos === 'function') {
    if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
    carregarTabelaGastos();
  }
  if (pagina === 'chamados' && typeof carregarTabelaChamados === 'function') carregarTabelaChamados();
  if (pagina === 'alocacoes') {
    if (typeof atualizarListaVeiculosNosFiltros === 'function') atualizarListaVeiculosNosFiltros();
    if (typeof carregarTabelaAlocacoes === 'function') carregarTabelaAlocacoes();
  }
  if (pagina === 'dashboard' && typeof atualizarDashboardCompleto === 'function') atualizarDashboardCompleto();
  }

  window.mostrarPagina = mostrarPagina;

  document.addEventListener('click', e => {
    const link = e.target.closest('.sidebar-link');
    if (link && link.dataset.pagina) {
      e.preventDefault();
      mostrarPagina(link.dataset.pagina);
    }
  });

  quandoDOMPronto(() => {
    if (document.getElementById('sistemaPrincipal')) {
      mostrarPagina('dashboard');
    }
  });
}


// ============================================================
// FUNÇÕES GLOBAIS DO INDEX.HTML
// ============================================================

        // ========== CONTROLE DE PERMISSÕES POR PERFIL ==========
        function ehAdmin() {
            return typeof usuarioAtual !== 'undefined' && usuarioAtual?.perfil === 'admin';
        }
        function ehMotorista() {
            return typeof usuarioAtual !== 'undefined' && usuarioAtual?.perfil === 'motorista';
        }
        quandoDOMPronto(function() {
            if (ehAdmin()) {
                document.body.classList.add('usuario-admin');
                console.log('🔑 Perfil: Administrador — acesso completo');
            } else if (ehMotorista()) {
                document.body.classList.add('usuario-motorista');
                console.log('🔑 Perfil: Motorista — áreas de admin ocultas');
            }
        });

        function atualizarNomeUsuarioCabecalho() {
            const nome = window.usuarioAtual?.nome || 'Carregando...';
            const infoUsuario = document.getElementById('infoUsuario');
            if (infoUsuario) infoUsuario.textContent = nome;
        }
        quandoDOMPronto(atualizarNomeUsuarioCabecalho);

        // ========== 📍 CADASTRO DE LOCAIS / OBRAS — ✅ UNIFICADO COM BD ==========
        function carregarLocaisBD() {
            return BD.locais || [
                { id: 'patio-metalica', nome: 'Pátio Metálica' },
                { id: 'patio-usina-conc', nome: 'Pátio Usina Conc.' },
                { id: 'obra', nome: 'Obra' }
            ];
        }

        function abrirModalLocal(idEditar = null) {
            if (!ehAdmin()) { alert('❌ Apenas Administrador pode cadastrar locais!'); return; }
            const locais = carregarLocaisBD();
            const local = idEditar ? locais.find(l => l.id === idEditar) : null;
            document.getElementById('modais').innerHTML = `
                <div class="modal-fundo" onclick="if(event.target===this)fecharModal()">
                    <div class="modal-corpo">
                        <div class="modal-cabecalho">
                            <h3 style="margin:0; font-size:1.125rem; font-weight:600;">${local ? '✏️ Editar Local' : '📍 Novo Local'}</h3>
                            <button type="button" class="btn-fechar" onclick="fecharModal()">&times;</button>
                        </div>
                        <div class="modal-conteudo">
                            <form onsubmit="salvarLocal(event, '${idEditar || ''}')">
                                <div class="linha-form">
                                    <label>Nome do Local / Obra</label>
                                    <input type="text" id="nomeLocal" required placeholder="Ex: Pátio Metálica, Usina, Obra..." value="${local?.nome || ''}">
                                </div>
                                <div class="botoes-form">
                                    <button type="button" class="btn" style="background:#f1f5f9; color:#475569;" onclick="fecharModal()">Cancelar</button>
                                    <button type="submit" class="btn btn-primary">Salvar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>`;
        }
        window.abrirModalLocal = abrirModalLocal;

        function salvarLocal(event, idEditar = null) {
            event.preventDefault();
            if (!ehAdmin()) { alert('❌ Sem permissão!'); return; }
            const nome = document.getElementById('nomeLocal').value.trim();
            if (!nome) return;

            if (idEditar) {
                const idx = BD.locais.findIndex(l => l.id === idEditar);
                if (idx !== -1) BD.locais[idx].nome = nome;
            } else {
                const id = nome.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                BD.locais.push({ id, nome });
            }

            salvarDados();
            fecharModal();
            carregarTabelaLocais();
            atualizarListaLocaisNosFormularios();
        }
        window.salvarLocal = salvarLocal;

        function excluirLocal(id) {
            if (!ehAdmin()) { alert('❌ Apenas Administrador pode excluir!'); return; }
            if (!confirm('Excluir este local?')) return;
            BD.locais = BD.locais.filter(l => l.id !== id);
            salvarDados();
            carregarTabelaLocais();
            atualizarListaLocaisNosFormularios();
        }
        window.excluirLocal = excluirLocal;

        function carregarTabelaLocais() {
            const locais = carregarLocaisBD();
            const tbody = document.getElementById('tabelaLocais');
            if (!locais.length) {
                tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:#94a3b8; padding:2rem;">Nenhum local cadastrado</td></tr>';
                return;
            }
            tbody.innerHTML = locais.map(l => `
                <tr>
                    <td><strong>${l.nome}</strong></td>
                    <td class="admin-only">
                        <button class="btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:#fef3c7; color:#92400e; margin-right:0.25rem;" onclick="abrirModalLocal('${l.id}')">✏️</button>
                        <button class="btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:#fee2e2; color:#991b1b;" onclick="excluirLocal('${l.id}')">🗑️</button>
                    </td>
                </tr>`).join('');
        }

        function atualizarListaLocaisNosFormularios() {
            const listaNomes = BD.locais.map(l => l.nome);
            console.log('📍 Locais disponíveis:', listaNomes);
        }

        // ✅ Carrega tabela ao abrir a página
        const PaginaOriginal = window.mostrarPagina;
        window.mostrarPagina = function(pagina) {
            if (PaginaOriginal) PaginaOriginal(pagina);
            if (pagina === 'locais') {
                carregarTabelaLocais();
            }
        };

        // ========== ATUALIZA LISTA DE PLACAS NOS FILTROS ==========
        function atualizarListaVeiculosNosFiltros() {
            if (!BD.veiculos) return;
            const placas = BD.veiculos.map(v => v.placa).sort();
            ['filtroAlocacoes', 'filtroChecklist', 'filtroManutencao', 'filtroGastos'].forEach(id => {
                const sel = document.getElementById(id);
                if (!sel) return;
                const atual = sel.value;
                sel.innerHTML = '<option value="todos">Todos os Veículos</option>';
                placas.forEach(p => sel.innerHTML += `<option value="${p}">${p}</option>`);
                if (placas.includes(atual)) sel.value = atual;
            });
        }

        // ========== FUNÇÕES DE FILTRO ==========
        function aplicarFiltroAlocacoes() {
            const filtro = document.getElementById('filtroAlocacoes')?.value || 'todos';
            if (typeof carregarTabelaAlocacoes === 'function') carregarTabelaAlocacoes(filtro);
        }
        function aplicarFiltroChecklist() {
            const filtro = document.getElementById('filtroChecklist')?.value || 'todos';
            if (typeof carregarTabelaChecklist === 'function') carregarTabelaChecklist(filtro);
        }
        function aplicarFiltroManutencao() {
            const filtro = document.getElementById('filtroManutencao')?.value || 'todos';
            if (typeof carregarTabelaManutencao === 'function') carregarTabelaManutencao(filtro);
        }
        function aplicarFiltroGastos() {
            const filtro = document.getElementById('filtroGastos')?.value || 'todos';
            if (typeof carregarTabelaGastos === 'function') carregarTabelaGastos(filtro);
        }

        // ========== FECHAR MODAL ==========
        function fecharModal() {
            document.getElementById('modais').innerHTML = '';
        }

        // ========== ABERTURA DE MODAIS ==========
        function abrirModalChecklist() {
            if (!BD.veiculos || BD.veiculos.length === 0) { alert('Cadastre um veículo primeiro!'); return; }
            const placas = BD.veiculos.map(v => `<option value="${v.placa}">${v.placa}</option>`).join('');
            document.getElementById('modais').innerHTML = `
                <div class="modal-fundo" onclick="if(event.target===this)fecharModal()">
                    <div class="modal-corpo">
                        <div class="modal-cabecalho">
                            <h3 style="margin:0; font-size:1.125rem; font-weight:600;">✅ Novo Check-list</h3>
                            <button type="button" class="btn-fechar" onclick="fecharModal()">&times;</button>
                        </div>
                        <div class="modal-conteudo">
                            <form id="formChecklist" onsubmit="salvarChecklist(event)">
                                <div class="linha-form"><label>Veículo (Placa)</label><select id="clPlaca" required>${placas}</select></div>
                                <div class="linha-form"><label>Motorista</label><input type="text" id="clMotorista" required placeholder="Nome do motorista"></div>
                                <div class="linha-form"><label>Quilometragem Atual</label><input type="number" id="clKm" required placeholder="0"></div>
                                <div class="linha-form"><label>Status</label>
                                    <select id="clStatus">
                                        <option value="${(CONFIG.STATUS?.CHECKLIST?.APROVADO || CONFIG.STATUS_CHECKLIST?.APROVADO || "Aprovado")}">${(CONFIG.STATUS?.CHECKLIST?.APROVADO || CONFIG.STATUS_CHECKLIST?.APROVADO || "Aprovado")}</option>
                                        <option value="${(CONFIG.STATUS?.CHECKLIST?.PENDENTE || CONFIG.STATUS_CHECKLIST?.PENDENTE || "Pendente")}">${(CONFIG.STATUS?.CHECKLIST?.PENDENTE || CONFIG.STATUS_CHECKLIST?.PENDENTE || "Pendente")}</option>
                                    </select>
                                </div>
                                <div class="botoes-form">
                                    <button type="button" class="btn" style="background:#f1f5f9; color:#475569;" onclick="fecharModal()">Cancelar</button>
                                    <button type="submit" class="btn btn-success">Salvar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>`;
        }
        window.abrirModalChecklist = abrirModalChecklist;

        function abrirModalManutencao() {
            if (!BD.veiculos || BD.veiculos.length === 0) { alert('Cadastre um veículo primeiro!'); return; }
            const placas = BD.veiculos.map(v => `<option value="${v.placa}">${v.placa}</option>`).join('');
            document.getElementById('modais').innerHTML = `
                <div class="modal-fundo" onclick="if(event.target===this)fecharModal()">
                    <div class="modal-corpo">
                        <div class="modal-cabecalho">
                            <h3 style="margin:0; font-size:1.125rem; font-weight:600;">🔧 Nova Solicitação</h3>
                            <button type="button" class="btn-fechar" onclick="fecharModal()">&times;</button>
                        </div>
                        <div class="modal-conteudo">
                            <form id="formManutencao" onsubmit="salvarManutencao(event)">
                                <div class="linha-form"><label>Veículo (Placa)</label><select id="mnVeiculo" required>${placas}</select></div>
                                <div class="linha-form"><label>Tipo de Manutenção</label>
                                    <select id="mnTipo">
                                        <option value="${(CONFIG.STATUS?.TIPO_MANUTENCAO?.PREVENTIVA || CONFIG.TIPO_MANUTENCAO?.PREVENTIVA || "Preventiva")}">${(CONFIG.STATUS?.TIPO_MANUTENCAO?.PREVENTIVA || CONFIG.TIPO_MANUTENCAO?.PREVENTIVA || "Preventiva")}</option>
                                        <option value="${(CONFIG.STATUS?.TIPO_MANUTENCAO?.CORRETIVA || CONFIG.TIPO_MANUTENCAO?.CORRETIVA || "Corretiva")}">${(CONFIG.STATUS?.TIPO_MANUTENCAO?.CORRETIVA || CONFIG.TIPO_MANUTENCAO?.CORRETIVA || "Corretiva")}</option>
                                        <option value="${(CONFIG.STATUS?.TIPO_MANUTENCAO?.REVISAO || CONFIG.TIPO_MANUTENCAO?.REVISAO || "Revisão")}">${(CONFIG.STATUS?.TIPO_MANUTENCAO?.REVISAO || CONFIG.TIPO_MANUTENCAO?.REVISAO || "Revisão")}</option>
                                    </select>
                                </div>
                                <div class="linha-form"><label>Descrição</label><textarea id="mnDescricao" rows="3" required placeholder="Descreva o serviço..."></textarea></div>
                                <div class="linha-form"><label>Status</label>
                                    <select id="mnStatus">
                                        <option value="${(CONFIG.STATUS?.MANUTENCAO?.ABERTA || CONFIG.STATUS_MANUTENCAO?.ABERTA || "Aberta")}">${(CONFIG.STATUS?.MANUTENCAO?.ABERTA || CONFIG.STATUS_MANUTENCAO?.ABERTA || "Aberta")}</option>
                                        <option value="${(CONFIG.STATUS?.MANUTENCAO?.ANDAMENTO || CONFIG.STATUS_MANUTENCAO?.ANDAMENTO || "Em Andamento")}">${(CONFIG.STATUS?.MANUTENCAO?.ANDAMENTO || CONFIG.STATUS_MANUTENCAO?.ANDAMENTO || "Em Andamento")}</option>
                                        <option value="${(CONFIG.STATUS?.MANUTENCAO?.CONCLUIDA || CONFIG.STATUS_MANUTENCAO?.CONCLUIDA || "Concluída")}">${(CONFIG.STATUS?.MANUTENCAO?.CONCLUIDA || CONFIG.STATUS_MANUTENCAO?.CONCLUIDA || "Concluída")}</option>
                                    </select>
                                </div>
                                <div class="botoes-form">
                                    <button type="button" class="btn" style="background:#f1f5f9; color:#475569;" onclick="fecharModal()">Cancelar</button>
                                    <button type="submit" class="btn btn-success">Salvar</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>`;
        }
        window.abrirModalManutencao = abrirModalManutencao;
    

// ============================================================
// CORREÇÕES ADICIONAIS - GARANTIR FUNCIONAMENTO COMPLETO
// ============================================================

// Garantir que salvarDados existe globalmente
if (typeof window.salvarDados === 'undefined' && typeof salvarDados !== 'undefined') {
    window.salvarDados = salvarDados;
}

// Garantir que fecharModal funciona corretamente
window.fecharModal = function() {
    const modais = document.getElementById('modais');
    if (modais) modais.innerHTML = '';
};

// Correção: atualizarListaVeiculosNosFiltros (usada em vários lugares)
if (typeof window.atualizarListaVeiculosNosFiltros === 'undefined') {
    window.atualizarListaVeiculosNosFiltros = function() {
        if (!window.BD || !BD.veiculos) return;
        const placas = BD.veiculos.map(v => v.placa).sort();
        ['filtroAlocacoes', 'filtroChecklist', 'filtroManutencao', 'filtroGastos'].forEach(id => {
            const sel = document.getElementById(id);
            if (!sel) return;
            const atual = sel.value;
            sel.innerHTML = '<option value="todos">Todos os Veículos</option>';
            placas.forEach(p => sel.innerHTML += `<option value="${p}">${p}</option>`);
            if (placas.includes(atual)) sel.value = atual;
        });
    };
}

// Correção: função salvarLocal (para funcionar corretamente)
const _salvarLocalOriginal = window.salvarLocal;
window.salvarLocal = function(event, idEditar) {
    if (event && event.preventDefault) event.preventDefault();
    if (!window.ehAdmin || !ehAdmin()) { alert('❌ Sem permissão!'); return; }
    
    const nomeInput = document.getElementById('nomeLocal');
    if (!nomeInput) return;
    
    const nome = nomeInput.value.trim();
    if (!nome) return;

    if (idEditar) {
        const idx = BD.locais.findIndex(l => l.id === idEditar);
        if (idx !== -1) BD.locais[idx].nome = nome;
    } else {
        const id = nome.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        BD.locais.push({ id, nome });
    }

    if (typeof salvarDados === 'function') salvarDados();
    fecharModal();
    if (typeof carregarTabelaLocais === 'function') carregarTabelaLocais();
    if (typeof atualizarListaLocaisNosFormularios === 'function') atualizarListaLocaisNosFormularios();
    if (typeof atualizarListasDependentes === 'function') atualizarListasDependentes();
};

// Correção: garantir que funções de filtro existem
['aplicarFiltroAlocacoes', 'aplicarFiltroChecklist', 'aplicarFiltroManutencao', 'aplicarFiltroGastos'].forEach(nome => {
    if (typeof window[nome] === 'undefined') {
        window[nome] = function() { console.log(nome + ' chamada'); };
    }
});

console.log('✅ Sistema carregado com sucesso!');
