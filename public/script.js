

const URL_LISTA  = '/lista-compras';
const URL_LOGIN  = '/login';
const URL_STATUS = '/login-status';
const URL_LOGOUT = '/logout';

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM montado');

 
  if (document.getElementById('loginForm')) {
    initLogin();
    return;
  }

  checkStatus().then(auth => {
    if (!auth) {
      console.log('Não autenticado, redirecionando ao login');
      window.location.href = 'login.html';
    } else {
      initApp();
    }
  });
});


function initLogin() {
  const form = document.getElementById('loginForm');
  const msg  = document.getElementById('mensagemLogin');

  form.addEventListener('submit', e => {
    e.preventDefault();
    fetch(URL_LOGIN, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        usuario: document.getElementById('uname').value,
        senha:   document.getElementById('psw').value
      })
    })
    .then(r => r.json())
    .then(j => {
      if (j.success) {
        window.location.href = 'index.html';
      } else {
        showMessage(msg, j.message || 'Login inválido', 'erro');
      }
    })
    .catch(() => showMessage(msg, 'Erro de conexão', 'erro'));
  });
}


function checkStatus() {
  return fetch(URL_STATUS)
    .then(r => r.json())
    .then(j => j.authenticated)
    .catch(() => false);
}


function initApp() {
  console.log('Aplicação inicializada');


  document.getElementById('btnLogout')
    .addEventListener('click', () => {
      fetch(URL_LOGOUT, { method: 'POST' })
        .then(() => window.location.href = 'login.html');
    });


  const form = document.getElementById('formItem');
  if (form) {
    setupForm();
  }

  if (document.getElementById('tabelaHistorico')) {
    carregarHistorico();
  }
}


function setupForm() {
  const form    = document.getElementById('formItem');
  const msgForm = document.getElementById('mensagemForm');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const nome       = document.getElementById('nome').value.trim();
    const marca      = document.getElementById('marca').value.trim();
    const quantidade = document.getElementById('quantidade').value;
    const tamanho    = document.getElementById('tamanho').value;

    if (!nome)       return showMessage(msgForm, 'Item obrigatório', 'erro');
    if (!marca)      return showMessage(msgForm, 'Marca obrigatória', 'erro');
    if (!quantidade) return showMessage(msgForm, 'Quantidade inválida', 'erro');
    if (!tamanho)    return showMessage(msgForm, 'Tamanho obrigatório', 'erro');

    fetch(URL_LISTA, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ nome, marca, quantidade: +quantidade, tamanho })
    })
    .then(r => r.json())
    .then(j => {
      if (j.success) {
        showMessage(msgForm, 'Item adicionado!', 'sucesso');
        form.reset();
      } else {
        showMessage(msgForm, j.message || 'Erro ao adicionar', 'erro');
      }
    })
    .catch(() => showMessage(msgForm, 'Erro de rede', 'erro'));
  });
}


function carregarHistorico() {
  console.log('Carregando histórico...');
  fetch(URL_LISTA)
    .then(r => r.json())
    .then(lista => {
      console.log('Dados recebidos:', lista);
      const tbody = document.querySelector('#tabelaHistorico tbody');
      tbody.innerHTML = ''; 

      lista.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.texto}</td>
          <td>${item.marca}</td>
          <td>${item.quantidade}</td>
          <td>${item.tamanho}</td>
          <td><button data-id="${item.id}">✖</button></td>
        `;
        
        tr.querySelector('button').addEventListener('click', () => {
          fetch(`${URL_LISTA}/${item.id}`, { method: 'DELETE' })
            .then(r => r.json())
            .then(j => {
              if (j.success) {
                tr.remove();
                console.log(`Item ${item.id} removido`);
              }
            });
        });
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error('Falha ao carregar histórico', err);
    });
}


function showMessage(container, text, type) {
  container.textContent = text;
  container.classList.add(type);
  container.style.display = 'block';
  setTimeout(() => {
    container.style.display = 'none';
    container.classList.remove(type);
  }, 3000);
}
