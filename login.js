// URL da sua API refatorada (porta 5002)
const API_BASE_URL = 'http://127.0.0.1:5002';

// Funções para abrir/fechar modais
window.abrirLogin = function () {
    document.getElementById('modalLogin').classList.remove('hidden');
}
window.fecharLogin = function () {
    document.getElementById('modalLogin').classList.add('hidden');
}
window.abrirCriarConta = function () {
    document.getElementById('modalCriarConta').classList.remove('hidden');
}
window.fecharCriarConta = function () {
    document.getElementById('modalCriarConta').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {

    // Redireciona se já estiver logado
    if (sessionStorage.getItem('currentUser')) {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if (user.plano === 'premium') {
            window.location.href = 'premium.html';
        } else {
            window.location.href = 'freemium.html';
        }
    }

    // Lógica do Botão de Login
    document.getElementById('entrarBtn').addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        const senha = document.getElementById('loginSenha').value;

        if (!email || !senha) {
            return alert('Preencha e-mail e senha.');
        }

        try {
            // Chama a nova rota /auth/login
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, senha }),
                // ---> ADIÇÃO ESSENCIAL AQUI <---
                credentials: 'include' 
                // ---> FIM DA ADIÇÃO <---
            });
            
            // Verifica se a resposta foi realmente OK (status 200-299)
            // antes de tentar parsear o JSON
            if (!response.ok) {
                // Tenta ler a mensagem de erro do backend se houver
                let errorData = { error: `Erro HTTP: ${response.status} ${response.statusText}` };
                try {
                    errorData = await response.json();
                } catch (e) {
                    // Ignora erro ao parsear JSON de erro, usa o status HTTP
                }
                throw new Error(errorData.error || `Erro ${response.status}`);
            }

            const data = await response.json(); // Agora seguro para parsear

            // Armazena os dados do usuário na sessionStorage
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));

            // Redireciona com base no plano recebido
            if (data.user.plano === 'premium') {
                window.location.href = 'premium.html';
            } else {
                window.location.href = 'freemium.html';
            }

        } catch (error) {
            console.error('Erro ao conectar com a API de login:', error);
            // Mostra a mensagem de erro específica capturada
            alert(`Erro ao conectar com o servidor: ${error.message}. Verifique o console para detalhes.`);
        }
    });

    // Lógica do Botão de Criar Conta
    document.getElementById('criarContaBtn').addEventListener('click', async () => {
        const nome = document.getElementById('cadastroNome').value;
        const email = document.getElementById('cadastroEmail').value;
        const senha = document.getElementById('cadastroSenha').value;
        const confirmarSenha = document.getElementById('cadastroConfirmarSenha').value;

        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem!');
            return;
        }

        if (!nome || !email || !senha) {
            alert('Todos os campos são obrigatórios.');
            return;
        }

        try {
            // Chama a nova rota /auth/cadastrar_usuario
            const response = await fetch(`${API_BASE_URL}/auth/cadastrar_usuario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha }),
                 // ---> ADIÇÃO ESSENCIAL AQUI TAMBÉM (Boa prática) <---
                 credentials: 'include' 
            });
            
             if (!response.ok) {
                let errorData = { error: `Erro HTTP: ${response.status} ${response.statusText}` };
                try {
                    errorData = await response.json();
                } catch (e) { /* Ignora */ }
                throw new Error(errorData.error || `Erro ${response.status}`);
            }

            const data = await response.json();
            
            alert(data.message);
            fecharCriarConta();
            abrirLogin(); // Abre o modal de login para o usuário entrar

        } catch (error) {
            console.error('Erro ao conectar com a API de cadastro:', error);
             alert(`Erro ao criar conta: ${error.message}.`);
        }
    });
});