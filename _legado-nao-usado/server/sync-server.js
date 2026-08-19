const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'sync.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function garantirBanco() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({ checklists: [], chamados: [], updatedAt: new Date().toISOString() }, null, 2));
  }
}

function lerBanco() {
  garantirBanco();
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function salvarBanco(dados) {
  const payload = { ...dados, updatedAt: new Date().toISOString() };
  fs.writeFileSync(dataFile, JSON.stringify(payload, null, 2));
  return payload;
}

function mesclarLista(listaAtual, novosItens) {
  const mapa = new Map(listaAtual.map(item => [String(item.id), item]));
  novosItens.forEach(item => {
    if (item && item.id != null) {
      mapa.set(String(item.id), item);
    }
  });
  return Array.from(mapa.values());
}

app.get('/api/health', (_, res) => {
  res.json({ ok: true, status: 'online' });
});

app.get('/api/sync/bundle', (_, res) => {
  res.json(lerBanco());
});

app.post('/api/sync/push', (req, res) => {
  const { collection, registros } = req.body || {};
  if (!collection || !Array.isArray(registros)) {
    return res.status(400).json({ error: 'collection e registros são obrigatórios' });
  }

  const banco = lerBanco();
  const listaAtual = Array.isArray(banco[collection]) ? banco[collection] : [];
  banco[collection] = mesclarLista(listaAtual, registros);
  const salvo = salvarBanco(banco);
  res.json({ ok: true, updatedAt: salvo.updatedAt });
});

app.listen(PORT, () => {
  console.log(`Sincronização rodando em http://localhost:${PORT}`);
});