// js/utils.js
export const Utils = {
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
export default Utils;