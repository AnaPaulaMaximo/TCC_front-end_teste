/**
 * Exibe uma notificação na tela.
 * A função cria automaticamente o container de notificações se ele não existir.
 *
 * @param {string} message - A mensagem a ser exibida.
 * @param {string} [type='success'] - O tipo de notificação ('success' ou 'error').
 */
function showNotification(message, type = 'success') {
    // 1. Encontra (ou cria) o container de notificações
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        // Classes Tailwind para o container (fixo no canto superior direito)
        container.className = 'fixed top-8 right-8 z-[9999] flex flex-col gap-3';
        document.body.appendChild(container);
    }

    // 2. Define ícone, cor e título com base no tipo
    const isError = type === 'error';
    const iconName = isError ? 'error' : 'check_circle';
    // Cores alinhadas com seu site: vermelho/pink para erro, roxo para sucesso
    const iconColor = isError ? 'text-red-600' : 'text-purple-600';
    const title = isError ? 'Ocorreu um Erro' : 'Sucesso!';

    // 3. Cria o elemento da notificação (o "toast")
    const toast = document.createElement('div');
    
    // 4. Adiciona as classes do Tailwind (aqui está a estética do seu site)
    // (Fundo branco, bordas arredondadas, sombra, borda leve, etc.)
    toast.className = 'flex items-start gap-3 w-full max-w-sm p-4 bg-white rounded-xl shadow-lg border border-gray-200 notification-toast-enter';
    
    // 5. Define o HTML interno da notificação
    toast.innerHTML = `
        <div class="flex-shrink-0">
            <span class="material-icons ${iconColor}" style="font-size: 24px;">
                ${iconName}
            </span>
        </div>
        <div class="flex-1 mr-4">
            <p class="font-semibold text-gray-900">${title}</p>
            <p class="text-sm text-gray-600">${message}</p>
        </div>
        <div class="flex-shrink-0">
            <button class="text-gray-400 hover:text-gray-600">
                <span class="material-icons" style="font-size: 20px;">close</span>
            </button>
        </div>
    `;

    // 6. Adiciona ao container
    container.appendChild(toast);

    // 7. Define o temporizador para remover automaticamente (3 segundos)
    const timer = setTimeout(() => {
        toast.classList.remove('notification-toast-enter');
        toast.classList.add('notification-toast-exit');
        
        // Remove do DOM após a animação de saída
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000); // 3000ms = 3 segundos

    // 8. Adiciona o evento para o botão de fechar
    toast.querySelector('button').addEventListener('click', () => {
        clearTimeout(timer); // Para o timer se for fechado manualmente
        toast.classList.remove('notification-toast-enter');
        toast.classList.add('notification-toast-exit');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    });
}


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
            // =====> CORREÇÃO 1 <=====
            showNotification('Preencha e-mail e senha.', 'error');
            return;
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
            // =====> CORREÇÃO 2 <=====
            showNotification(`Erro ao fazer login: ${error.message}.`, 'error');
        }
    });

    // Lógica do Botão de Criar Conta (Não muda, pois só cria Alunos)
    document.getElementById('criarContaBtn').addEventListener('click', async () => {
        const nome = document.getElementById('cadastroNome').value;
        const email = document.getElementById('cadastroEmail').value;
        const senha = document.getElementById('cadastroSenha').value;
        const confirmarSenha = document.getElementById('cadastroConfirmarSenha').value;

        if (senha !== confirmarSenha) {
            // =====> CORREÇÃO 3 <=====
            showNotification('As senhas não coincidem!', 'error');
            return;
        }

        if (!nome || !email || !senha) {
            // =====> CORREÇÃO 4 <=====
            showNotification('Todos os campos são obrigatórios.', 'error');
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
            
            showNotification(data.message); // Mensagem de sucesso (sem 'error')
            fecharCriarConta();
            abrirLogin(); // Abre o modal de login para o usuário entrar

        } catch (error) {
            console.error('Erro ao conectar com a API de cadastro:', error);
            // =====> CORREÇÃO 5 <=====
             showNotification(`Erro ao criar conta: ${error.message}.`, 'error');
        }
    });
});