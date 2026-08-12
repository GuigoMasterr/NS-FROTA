// ============================================================
// SISTEMA DE GESTÃO DE FROTAS - ARQUIVO JS CONSOLIDADO
// Gerado automaticamente - todos os módulos em um único arquivo
// Ordem de carregamento garantida
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
document.addEventListener('DOMContentLoaded', () => {
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
          <textarea id="clObservacoesGerais" class="w-full px-3 py-2 border border-slate-200 rounded-lg" placeholder="Observações gerais sobre a alocação"></textarea>
        </div>
      </div>
    </div>
  </div>
</div>