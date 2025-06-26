const express       = require('express');
const session       = require('express-session');
const fs            = require('fs');
const path          = require('path');

const app     = express();
const PORT    = process.env.PORT || 3000;


const PUBLIC  = path.join(__dirname, 'public');
const DADOS   = path.join(__dirname, 'dados');
const LISTA   = path.join(DADOS, 'lista.json');
const USERS   = path.join(DADOS, 'usuarios.json');


app.use(express.json());                        
app.use(session({                               
  secret: 'troque_essa_chave',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 }
}));
app.use(express.static(PUBLIC));                


app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;
  let users;
  try {
    users = JSON.parse(fs.readFileSync(USERS, 'utf8'));
  } catch {
    return res.status(500).json({ success: false, message: 'Erro ao ler usuários.' });
  }
  const ok = users.find(u => u.usuario === usuario && u.senha === senha);
  if (!ok) return res.json({ success: false, message: 'Credenciais inválidas.' });
  req.session.authenticated = true;
  res.json({ success: true });
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

app.get('/login-status', (req, res) => {
  res.json({ authenticated: !!req.session.authenticated });
});


function requireLogin(req, res, next) {
  if (req.session.authenticated) return next();
  res.status(401).json({ success: false, message: 'Login necessário.' });
}


app.get('/lista-compras', (req, res) => {
  fs.readFile(LISTA, 'utf8', (e, data) => {
    if (e) return res.status(500).json([]);
    try { return res.json(JSON.parse(data||'[]')); }
    catch { return res.status(500).json([]); }
  });
});

app.post('/lista-compras', requireLogin, (req, res) => {
  const { nome, marca, quantidade, tamanho } = req.body;

  if (!nome || !marca || !quantidade || !tamanho) {
    return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
  }
  const novo = {
    id: Date.now(),
    texto: nome,
    marca,
    quantidade: parseInt(quantidade, 10),
    tamanho
  };
  fs.readFile(LISTA, 'utf8', (e, data) => {
    const arr = e ? [] : JSON.parse(data||'[]');
    arr.push(novo);
    fs.writeFile(LISTA, JSON.stringify(arr, null, 2), err => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true, item: novo });
    });
  });
});

app.delete('/lista-compras/:id', requireLogin, (req, res) => {
  const id = parseInt(req.params.id, 10);
  fs.readFile(LISTA, 'utf8', (e, data) => {
    if (e) return res.status(500).json({ success: false });
    const arr = JSON.parse(data||'[]').filter(x => x.id !== id);
    fs.writeFile(LISTA, JSON.stringify(arr, null, 2), err => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    });
  });
});

app.listen(PORT, () => console.log(`Servidor na porta: ${PORT}`));
