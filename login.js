// URL da sua API refatorada (porta 5002)
const API_BASE_URL = 'http://127.0.0.1:5000';

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
    // Redireciona se for um admin já logado
    if (sessionStorage.getItem('currentAdmin')) {
        // =====> ALTERAÇÃO AQUI <=====
        window.location.href = 'admin.html'; // Corrigido o caminho
        // ============================
    }


    // Lógica do Botão de Login
    document.getElementById('entrarBtn').addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        const senha = document.getElementById('loginSenha').value;

        if (!email || !senha) {
            return alert('Preencha e-mail e senha.');
        }

        try {
            // Chama a rota /auth/login (que agora é unificada)
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, senha }),
                credentials: 'include' 
            });
            
            if (!response.ok) {
                let errorData = { error: `Erro HTTP: ${response.status} ${response.statusText}` };
                try {
                    errorData = await response.json();
                } catch (e) {
                    // Ignora erro ao parsear JSON de erro, usa o status HTTP
                }
                throw new Error(errorData.error || `Erro ${response.status}`);
            }

            const data = await response.json(); // Agora seguro para parsear

            // --- INÍCIO DA LÓGICA DE REDIRECIONAMENTO ---
            
            if (data.role === 'admin') {
                // É um admin!
                sessionStorage.setItem('currentAdmin', JSON.stringify(data.user));
                // =====> ALTERAÇÃO AQUI <=====
                window.location.href = 'admin.html'; // Redireciona para o dashboard admin
                // ============================

            } else if (data.role === 'aluno') {
                // É um aluno!
                sessionStorage.setItem('currentUser', JSON.stringify(data.user));
                
                // Redireciona com base no plano do aluno
                if (data.user.plano === 'premium') {
                    window.location.href = 'premium.html';
                } else {
                    window.location.href = 'freemium.html';
                }
            } else {
                // Fallback, caso o backend envie uma 'role' desconhecida
                throw new Error("Tipo de usuário ('role') desconhecido recebido do servidor.");
            }
            // --- FIM DA LÓGICA DE REDIRECIONAMENTO ---

        } catch (error) {
            console.error('Erro ao conectar com a API de login:', error);
            // Mostra a mensagem de erro específica capturada
            alert(`Erro ao fazer login: ${error.message}.`);
        }
    });

    // Lógica do Botão de Criar Conta (Não muda, pois só cria Alunos)
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
            // Chama a rota /auth/cadastrar_usuario (continua a mesma)
            const response = await fetch(`${API_BASE_URL}/auth/cadastrar_usuario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha }),
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