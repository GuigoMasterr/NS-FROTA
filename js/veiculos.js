// ==================================================
// 🚗 CADASTRO E GESTÃO DE VEÍCULOS — SUPABASE + LOCAL
// ==================================================

import { obterVeiculos, salvarVeiculo, obterVeiculoPorPlaca } from './banco-dados.js';
import { BD, salvarDados } from './banco-dados.js';
import { CONFIG } from './config.js';

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
window.CONFIG = CONFIG;
window.abrirModalVeiculo = abrirModalVeiculo;
window.carregarTabelaVeiculos = carregarTabelaVeiculos;
window.CATEGORIAS_VEICULOS = CONFIG?.CATEGORIAS_VEICULOS;
window.excluirVeiculo = excluirVeiculo;