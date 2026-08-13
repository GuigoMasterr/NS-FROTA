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
// export default Validacoes;  // Removido para compatibilidade