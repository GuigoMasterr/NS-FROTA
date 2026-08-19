// ============================================================
// 🔧 PATCH: Correções para js/despesas-viagem.js
// Problema: A função salvarDados() local conflita com a global
//            do banco-dados.js, causando recursão infinita.
// ============================================================
//
// 📋 INSTRUÇÕES: No arquivo js/despesas-viagem.js, faça estas alterações:
//
// 1. Renomeie a função local `salvarDados()` para `salvarDadosDespesas()`
// 2. Atualize todas as chamadas internas para usar o novo nome
//
// ============================================================

// --- ANTES (linha com problema) ---
// function salvarDados() {
//   if (typeof salvarDados === 'function') {  // ❌ RECURSÃO INFINITA!
//     window.salvarDados();
//   } else {
//     localStorage.setItem('bd_frotas', JSON.stringify(BD));
//   }
//   if (window.atualizarDashboardCompleto) setTimeout(() => window.atualizarDashboardCompleto(), 100);
// }

// --- DEPOIS (corrigido) ---
function salvarDadosDespesas() {
  // ✅ Chama a função GLOBAL do banco-dados.js
  if (typeof window.salvarDados === 'function') {
    window.salvarDados();
  } else {
    localStorage.setItem('bd_frotas', JSON.stringify(BD));
  }
  // Atualiza window.BD após salvar
  if (window.BD) window.BD = BD;
  // Atualiza dashboard
  if (window.atualizarDashboardCompleto) setTimeout(() => window.atualizarDashboardCompleto(), 100);
}

// --- Atualize TODAS as chamadas de salvarDados() no arquivo ---
// Procure por: salvarDados();
// Substitua por: salvarDadosDespesas();

// Exemplos de onde alterar:
//   - No final de abrirModalAdiantamento → salvarDadosDespesas();
//   - No final de abrirModalGastoViagem → salvarDadosDespesas();
//   - Em qualquer outra chamada interna

// ============================================================
// ✅ Função adicional: excluirGastoViagem (se não existir)
// ============================================================
async function excluirGastoViagem(id) {
  if (!confirm('⚠️ Tem certeza que deseja excluir este gasto?')) return;
  
  BD.gastosViagem = (BD.gastosViagem || []).filter(g => String(g.id) !== String(id));
  
  // Atualiza status do adiantamento
  if (adiantamentoSelecionado) {
    const adto = BD.adiantamentos.find(a => String(a.id) === String(adiantamentoSelecionado));
    if (adto) atualizarStatusAdiantamento(adto);
  }
  
  salvarDadosDespesas();
  alert('✅ Gasto excluído!');
  renderizarTudo();
  atualizarDetalhesAdiantamento();
}

// Disponibiliza globalmente
window.salvarDadosDespesas = salvarDadosDespesas;
window.excluirGastoViagem = excluirGastoViagem;

console.log('✅ Patch despesas-viagem aplicado');
