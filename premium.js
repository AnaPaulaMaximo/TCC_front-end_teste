/**
 * Exibe uma notificação na tela.
 * (A função showNotification permanece a mesma...)
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
const SOCKET_URL = 'http://127.0.0.1:5000';
let socket = null;

// Objeto para guardar informações do usuário logado
let currentUser = {
    id: null,
    nome: 'Visitante',
    plano: 'premium',
    fotoUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
};

// --- Funções de UI (Sidebar, Telas, etc. - Mantidas Globais ou Como Estavam) ---
// (toggleSidebar, moveMenuUnderline, activateMenuLink, activateSidebarLink)
// ... (O código dessas funções permanece o mesmo) ...
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('openSidebarBtn');
    const mainContent = document.getElementById('mainContent');
    const topbar = document.getElementById('topbar');

    if (sidebar.classList.contains('sidebar-visible')) {
        sidebar.classList.remove('sidebar-visible');
        sidebar.classList.add('sidebar-hidden');
        topbar.style.paddingLeft = '0rem';
        mainContent.classList.remove('ml-64');
        setTimeout(() => { openBtn.classList.remove('hidden'); }, 400);
    } else {
        sidebar.classList.remove('sidebar-hidden');
        sidebar.classList.add('sidebar-visible');
        topbar.style.paddingLeft = '16rem';
        mainContent.classList.add('ml-64');
        openBtn.classList.add('hidden');
    }
}

function moveMenuUnderline(target) {
    const underline = document.getElementById('menuUnderline');
    const menuBar = document.getElementById('menuBar');
    if (!underline || !menuBar || !target) {
        if(underline) underline.style.width = `0px`;
        return;
    }
    const menuRect = menuBar.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    underline.style.width = `${targetRect.width}px`;
    underline.style.transform = `translateX(${targetRect.left - menuRect.left}px)`;
}

function activateMenuLink(target) {
    document.querySelectorAll('#menuBar .menu-link').forEach(link => {
        link.classList.remove('active');
    });
    if (target) {
        target.classList.add('active');
        moveMenuUnderline(target);
    } else {
        moveMenuUnderline(null);
    }
}

function activateSidebarLink(target) {
    document.querySelectorAll('#sidebar a[data-sidebar]').forEach(link => {
        link.classList.remove('sidebar-link-active');
    });
    if (target) {
        target.classList.add('sidebar-link-active');
    }
}


// --- Funções Auxiliares ---
function stripMarkdown(text) {
    if (!text) return '';
    // Remove ```json, ```, **, *, #, >, etc.
    let cleaned = text.replace(/```(json)?\s*/g, '').replace(/\s*```$/, '');
    cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2'); // Negrito
    cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');   // Itálico
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');      // Títulos
    cleaned = cleaned.replace(/^>\s+/gm, '');           // Citação
    cleaned = cleaned.replace(/^[-*+]\s+/gm, '');       // Listas
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');      // Código inline
    // Remover quebras de linha extras no início/fim e espaços em branco
    cleaned = cleaned.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n');
    return cleaned.trim();
}


// ---> FUNÇÕES DO CHAT <---
// (convertMarkdownToHtml, addMessage, showTypingIndicator, connectToChat, sendMessage)
// ... (O código dessas funções permanece o mesmo) ...
function convertMarkdownToHtml(markdownText) {
    if (!markdownText) return '';
    let htmlText = markdownText;
    // Negrito
    htmlText = htmlText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
     // Itálico
    htmlText = htmlText.replace(/\*(.*?)\*/g, '<em>$1</em>');
     // Quebra de linha
    htmlText = htmlText.replace(/\n/g, '<br>');
    // Listas (simplificado: substitui marcador por • e <br>)
    htmlText = htmlText.replace(/^[-*+]\s+(.*)$/gm, '<br>• $1');
    // Remove o <br> inicial se for o caso
    htmlText = htmlText.replace(/^<br>/,'');
    return htmlText;
}

function addMessage(sender, text) {
    const chatMessages = document.getElementById('chat-messages'); // Obtém aqui
    if (!chatMessages) return; // Sai se o elemento não existir
    const messageContainer = document.createElement('div');
    const messageBubble = document.createElement('div');

    if (sender === 'user') {
        messageContainer.className = 'flex justify-end mb-4';
        messageBubble.className = 'chat-bubble-user';
    } else {
        messageContainer.className = 'flex justify-start mb-4';
        messageBubble.className = 'chat-bubble-bot';
    }

    messageBubble.innerHTML = convertMarkdownToHtml(text); // Usa a conversão
    messageContainer.appendChild(messageBubble);
    chatMessages.appendChild(messageContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Rola para o final
}

function showTypingIndicator(show) {
    const typingIndicator = document.getElementById('typing-indicator'); // Obtém aqui
    const chatMessages = document.getElementById('chat-messages'); // Obtém aqui também
    if (!typingIndicator || !chatMessages) return; // Verifica se ambos existem
    typingIndicator.classList.toggle('hidden', !show); // Usa a classe hidden do Tailwind
    if (show) {
         // Garante que o indicador seja visível
        setTimeout(() => {
             chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 50);
    }
}


function connectToChat() {
     if (!currentUser.id) {
        console.warn("Tentativa de conectar ao chat sem usuário logado.");
        addMessage('bot', 'Você precisa estar logado para usar o chat.');
        return;
    }

    if (socket && socket.connected) {
         console.log("Já conectado ao chat.");
         return; // Já está conectado
    }
    if (socket) {
        socket.disconnect(); // Garante desconexão anterior
    }

    console.log("Tentando conectar ao servidor de chat...");
    // Conecta ao Socket.IO (que está no mesmo servidor da API)
    socket = io(SOCKET_URL, {
        withCredentials: true // Importante para enviar os cookies da sessão Flask
    });

    socket.on('connect', () => {
        console.log('Conectado ao servidor de chat!');
        if(document.getElementById('chat-input')) document.getElementById('chat-input').disabled = false;
        if(document.getElementById('chat-send-btn')) document.getElementById('chat-send-btn').disabled = false;
        if(document.getElementById('chat-input')) document.getElementById('chat-input').placeholder = "Digite sua mensagem...";
    });

    socket.on('disconnect', (reason) => {
        console.log(`Desconectado do servidor de chat: ${reason}`);
        if(document.getElementById('chat-input')) document.getElementById('chat-input').disabled = true;
        if(document.getElementById('chat-send-btn')) document.getElementById('chat-send-btn').disabled = true;
        if(document.getElementById('chat-input')) document.getElementById('chat-input').placeholder = "Desconectado.";
        showTypingIndicator(false); // Chama a função global
    });

    socket.on('connect_error', (error) => {
        console.error('Erro de conexão com socket:', error);
        showTypingIndicator(false); // Chama a função global
        addMessage('bot', 'Erro ao conectar com o servidor de chat.'); // Chama a função global
        if(document.getElementById('chat-input')) document.getElementById('chat-input').disabled = true;
        if(document.getElementById('chat-send-btn')) document.getElementById('chat-send-btn').disabled = true;
        if(document.getElementById('chat-input')) document.getElementById('chat-input').placeholder = "Erro de conexão.";
    });

    socket.on('nova_mensagem', (data) => {
        showTypingIndicator(false); // Chama a função global
        if (data.texto) {
            addMessage('bot', data.texto); // Chama a função global
        }
    });

    socket.on('erro', (data) => {
        console.error('Erro do servidor de chat:', data);
        showTypingIndicator(false); // Chama a função global
        addMessage('bot', data.erro || 'Desculpe, ocorreu um erro no servidor. Tente novamente.'); // Chama a função global
    });

     socket.on('status_conexao', (data) => { // Opcional: para confirmar a conexão
        console.log("Status do servidor:", data.data);
    });
}

function sendMessage() {
    const chatInput = document.getElementById('chat-input'); // Obtém aqui
    if (!chatInput) return;

    const messageText = chatInput.value.trim();
    if (messageText === '' || !socket || !socket.connected) {
         console.warn("Não conectado ou mensagem vazia. Não enviando.");
        if (!socket || !socket.connected) {
             addMessage('bot', "Não conectado ao chat. Tentando reconectar...");
             connectToChat(); // Tenta reconectar
        }
        return;
    }

    addMessage('user', messageText); // Chama a função global
    socket.emit('enviar_mensagem', { mensagem: messageText });

    chatInput.value = '';
    chatInput.style.height = 'auto'; // Reseta altura
    chatInput.rows = 1; // Reseta linhas se você estiver usando rows
    chatInput.focus();
    showTypingIndicator(true); // Chama a função global
}


// --- Funções de Autenticação e Perfil ---
// (checkLoginStatus, updateAuthButton, handleLogout, updateProfileDisplay, abrir/fecharEditarPerfil)
// ... (O código dessas funções permanece o mesmo) ...
function checkLoginStatus() {
    const storedUser = sessionStorage.getItem('currentUser');
    if (!storedUser) {
        window.location.href = 'login.html';
        return;
    }

    const userData = JSON.parse(storedUser);
    currentUser = {
        id: userData.id_aluno,
        nome: userData.nome,
        email: userData.email,
        plano: userData.plano,
        fotoUrl: userData.url_foto || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
    };

    if (currentUser.plano !== 'premium') {
        // Se por algum motivo um usuário não-premium chegou aqui, redireciona
        console.warn("Usuário não premium acessou página premium. Redirecionando...");
        window.location.href = 'freemium.html';
        return;
    }

    updateAuthButton();
    updateProfileDisplay();
    if(document.getElementById('welcomeName')) document.getElementById('welcomeName').textContent = `Bem-vindo, ${currentUser.nome}!`;
    if(document.getElementById('topbarLogo')) document.getElementById('topbarLogo').src = currentUser.fotoUrl;
}

function updateAuthButton() {
    const authBtn = document.getElementById('authBtn');
    const authIcon = document.getElementById('authIcon');
    const authText = document.getElementById('authText');

    if (authBtn && authIcon && authText) { // Verifica se os elementos existem
        authBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
        authBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        authIcon.textContent = 'logout';
        authText.textContent = 'Sair';
        authBtn.onclick = handleLogout;
    }
}

function handleLogout() {
    sessionStorage.removeItem('currentUser');
    if (socket) {
        console.log("Desconectando socket no logout.");
        socket.disconnect();
        socket = null; // Limpa a variável do socket
    }
    window.location.href = 'login.html';
}

function updateProfileDisplay() {
    if(document.getElementById('profileNome')) document.getElementById('profileNome').textContent = currentUser.nome || 'Seu Nome';
    if(document.getElementById('profileEmail')) document.getElementById('profileEmail').textContent = currentUser.email || 'seuemail@email.com';
    if(document.getElementById('profileFoto')) document.getElementById('profileFoto').src = currentUser.fotoUrl || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
}

window.abrirEditarPerfil = function () {
    if(!document.getElementById('modalEditarPerfil')) return; // Verifica se o modal existe
    document.getElementById('editFotoUrl').value = currentUser.fotoUrl || '';
    document.getElementById('editFotoPreview').src = currentUser.fotoUrl || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    document.getElementById('editNome').value = currentUser.nome;
    document.getElementById('editEmail').value = currentUser.email;
    document.getElementById('editSenha').value = '';
    document.getElementById('modalEditarPerfil').classList.remove('hidden');
}
window.fecharEditarPerfil = function () {
     if(!document.getElementById('modalEditarPerfil')) return;
    document.getElementById('modalEditarPerfil').classList.add('hidden');
}


// ===> INÍCIO DA NOVA FUNÇÃO <===
/**
 * Busca o histórico de atividades do usuário no backend e renderiza na tela.
 */
async function fetchHistorico() {
    const container = document.getElementById('historicoContainer');
    if (!container) {
        console.error("Container do histórico #historicoContainer não encontrado.");
        return;
    }
    container.innerHTML = '<p class="text-white text-center">Carregando histórico...</p>';

    if (!currentUser || !currentUser.id) {
        container.innerHTML = '<p class="text-yellow-300 text-center">Erro: Usuário não logado.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/historico/${currentUser.id}`, {
            credentials: 'include' // Envia cookies da sessão
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Não foi possível carregar o histórico.');
        }

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-white text-center">Nenhuma atividade encontrada no seu histórico.</p>';
            return;
        }

        container.innerHTML = ''; // Limpa o "Carregando..."

        // Mapeia os tipos de atividade para ícones do Material Icons
        const iconMap = {
            'quiz': 'quiz',
            'resumo': 'article',
            'correcao': 'edit_document', // Ícone melhorado
            'flashcard': 'style'
        };
        
        // Mapeia os tipos para nomes mais amigáveis
        const nameMap = {
            'quiz': 'Quiz',
            'resumo': 'Resumo',
            'correcao': 'Correção',
            'flashcard': 'Flashcards'
        };

        data.forEach(item => {
            const card = document.createElement('div');
            // Adiciona um cursor-pointer se quisermos adicionar cliques no futuro
            card.className = 'bg-white/10 p-4 rounded-lg flex items-center justify-between text-white shadow-md border border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer'; 
            
            const tipo = item.tipo_atividade || 'desconhecido';
            const icon = iconMap[tipo] || 'history';
            const nomeAtividade = nameMap[tipo] || 'Atividade';
            
            // Formata o título e os detalhes
            const title = `${nomeAtividade}: ${item.tema || 'Tema não registrado'}`;
            let details = new Date(item.data_criacao).toLocaleDateString('pt-BR');

            // Adiciona detalhes específicos do quiz
            if (tipo === 'quiz') {
                details += ` - <span class="font-semibold text-pink-300">${item.acertos} / ${item.total_perguntas} acertos</span>`;
            }

            card.innerHTML = `
                <div class="flex items-center gap-4">
                    <span class="material-icons text-pink-300 text-2xl">${icon}</span>
                    <div>
                        <p class="font-semibold text-base">${title}</p>
                        <p class="text-sm text-white/80">${details}</p>
                    </div>
                </div>
                <span class="material-icons text-white/70">chevron_right</span>
            `;
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        container.innerHTML = `<p class="text-yellow-300 text-center">Erro ao carregar histórico: ${error.message}</p>`;
        showNotification(`Erro ao carregar histórico: ${error.message}`, 'error');
    }
}
// ===> FIM DA NOVA FUNÇÃO <===


function showTela(page) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa', 'fade-in'));
    const telaNova = document.getElementById('tela-' + page);

    if (telaNova) {
        telaNova.classList.add('ativa', 'fade-in');
    }
    if (page === 'perfil') {
        updateProfileDisplay();
    }
    
    // ===> MODIFICADO <===
    if (page === 'historico') {
        // Chama a função para buscar dados quando a tela de histórico for mostrada
        fetchHistorico(); 
    }
    // ====================

    if (page === 'chat') {
        // Conecta ao chat com um pequeno delay para garantir que a UI está visível
        setTimeout(connectToChat, 100);
    } else {
        // Desconecta do chat se sair da tela de chat para economizar recursos
        if (socket && socket.connected) {
             console.log("Saindo da tela de chat, desconectando socket.");
            socket.disconnect();
        }
    }
}

// =====> FUNÇÃO DE SALVAR QUIZ (DEFINIDA GLOBALMENTE) <=====
async function salvarResultadoQuiz(tema, acertos, totalPerguntas) {
    if (!currentUser || !currentUser.id) {
        console.warn("Não é possível salvar o resultado: usuário não logado.");
        return;
    }
    
    // Trata o tema "Ambos" do freemium
    if (tema === 'ambos') {
        tema = 'Filosofia e Sociologia';
    } else if (tema === 'filosofia') {
        tema = 'Filosofia';
    } else if (tema === 'sociologia') {
        tema = 'Sociologia';
    }
    // Temas customizados (premium) permanecem como estão
    
    const payload = {
        id_aluno: currentUser.id,
        tema: tema,
        acertos: acertos,
        total_perguntas: totalPerguntas
    };

    try {
        const response = await fetch(`${API_BASE_URL}/quiz/salvar_resultado`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
            console.log("Resultado do quiz salvo com sucesso!", data.message);
        } else {
            console.error("Falha ao salvar resultado do quiz:", data.error);
        }
    } catch (error) {
        console.error("Erro de rede ao tentar salvar resultado do quiz:", error);
    }
}
// =======================================================


// --- Lógica Principal da Página (ÚNICO DOMContentLoaded) ---

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus(); // Verifica o login

    // Configurações iniciais de UI
    if(document.getElementById('sidebar')) document.getElementById('sidebar').classList.add('sidebar-visible');
    if(document.getElementById('topbar')) document.getElementById('topbar').classList.add('topbar-visible');
    if(document.getElementById('mainContent')) document.getElementById('mainContent').classList.add('ml-64');

    const initialSidebarLink = document.querySelector('#sidebar a[data-sidebar="inicio"]');
    if (initialSidebarLink) {
        activateSidebarLink(initialSidebarLink);
    }
    showTela('inicio'); // Mostra a tela inicial

    // Navegação da Topbar
    document.querySelectorAll('#menuBar .menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activateMenuLink(link);
            activateSidebarLink(null);
            showTela(link.getAttribute('data-page'));
        });
    });

    // Navegação da Sidebar
    document.querySelectorAll('#sidebar a[data-sidebar]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            activateSidebarLink(this);
            activateMenuLink(null); // Desativa menu da topbar
            showTela(this.getAttribute('data-sidebar'));
        });
    });

    // Ajustar underline ao redimensionar
     window.addEventListener('resize', () => {
        const active = document.querySelector('#menuBar .menu-link.active');
        if (active) moveMenuUnderline(active);
    });

    // --- Lógica de Edição de Perfil ---
    // (O código de Edição de Perfil permanece o mesmo) ...
    const btnEditar = document.getElementById('btnEditarPerfil');
    if (btnEditar) btnEditar.addEventListener('click', abrirEditarPerfil);

    const btnSalvar = document.getElementById('salvarEdicaoBtn');
     if (btnSalvar) btnSalvar.addEventListener('click', async () => {
        const novoNome = document.getElementById('editNome').value;
        const novoEmail = document.getElementById('editEmail').value;
        const novaSenha = document.getElementById('editSenha').value;
        const novaFotoUrl = document.getElementById('editFotoUrl').value;

        if (!novoNome || !novoEmail) {
            // =====> CORREÇÃO 1 <=====
            showNotification('Nome e E-mail não podem ser vazios.', 'error');
            return;
        }

        const updateData = {
            nome: novoNome,
            email: novoEmail,
            url_foto: novaFotoUrl || currentUser.fotoUrl // Envia a URL ou a atual se vazia
        };
        if (novaSenha) {
            updateData.senha = novaSenha; // Inclui senha apenas se preenchida
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/editar_usuario/${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
                 credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                showNotification(data.message); // Sucesso
                currentUser.nome = novoNome;
                currentUser.email = novoEmail;
                currentUser.fotoUrl = updateData.url_foto;

                const sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));
                sessionUser.nome = novoNome;
                sessionUser.email = novoEmail;
                sessionUser.url_foto = updateData.url_foto;
                sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));

                updateProfileDisplay();
                if(document.getElementById('topbarLogo')) document.getElementById('topbarLogo').src = currentUser.fotoUrl;
                fecharEditarPerfil();
            } else {
                // =====> CORREÇÃO 2 <=====
                showNotification(data.error || 'Erro ao salvar alterações.', 'error');
            }
        } catch (error) {
            console.error('Erro ao conectar com a API de edição:', error);
            // =====> CORREÇÃO 3 <=====
            showNotification('Erro ao conectar com o servidor.', 'error');
        }
    });

    const editFotoUrlInput = document.getElementById('editFotoUrl');
    if (editFotoUrlInput) editFotoUrlInput.addEventListener('input', (e) => {
        const imgPreview = document.getElementById('editFotoPreview');
        imgPreview.src = e.target.value || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    });


    // --- Lógica das Ferramentas Premium (IA) ---
    // (O código de Resumo, Correção, Flashcards e Quiz permanece o mesmo,
    // pois a lógica de salvar foi adicionada ao backend, exceto pelo quiz
    // que já chamava salvarResultadoQuiz)
    
     // Gerar Resumo
    const btnResumo = document.getElementById('gerarResumoBtn');
    if (btnResumo) btnResumo.addEventListener('click', async () => {
        const tema = document.getElementById('resumoInput').value;
        if (!tema) {
            // =====> CORREÇÃO 4 <=====
            showNotification('Por favor, digite um tema.', 'error');
            return;
        }
        btnResumo.disabled = true;
        btnResumo.textContent = "Gerando...";
        try {
            const response = await fetch(`${API_BASE_URL}/premium/resumo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tema, id_aluno: currentUser.id }),
                 credentials: 'include'
            });
             const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || data.erro || `Erro ${response.status}`);
            }
            if (data.conteudo) {
                 document.getElementById('resumoTitulo').textContent = `Resumo sobre: ${stripMarkdown(data.assunto || tema)}`;
                 document.getElementById('resumoConteudo').innerHTML = stripMarkdown(data.conteudo).replace(/\n/g, '<br>');
                 document.getElementById('resumoOutput').classList.remove('hidden');
            } else if (data.erro) { 
                throw new Error(data.erro);
            } else {
                 throw new Error("Resposta da API de resumo está incompleta.");
            }
        } catch (error) {
            console.error('Erro API de resumo:', error);
            // =====> CORREÇÃO 5 <=====
            showNotification(`Erro ao gerar resumo: ${error.message}. Verifique o console.`, 'error');
            document.getElementById('resumoOutput').classList.add('hidden');
            document.getElementById('resumoConteudo').innerHTML = '';
            document.getElementById('resumoTitulo').textContent = '';
        } finally {
            btnResumo.disabled = false;
            btnResumo.textContent = "Gerar Resumo";
        }
    });

    // Corrigir Texto
     const btnCorrecao = document.getElementById('corrigirTextoBtn');
     if (btnCorrecao) btnCorrecao.addEventListener('click', async () => {
        const tema = document.getElementById('correcaoTemaInput').value;
        const texto = document.getElementById('correcaoTextoInput').value;
        if (!tema || !texto) {
            // =====> CORREÇÃO 6 <=====
            showNotification('Preencha o tema e o texto.', 'error');
            return;
        }
        btnCorrecao.disabled = true;
        btnCorrecao.textContent = "Corrigindo...";
        try {
            const response = await fetch(`${API_BASE_URL}/premium/correcao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tema, texto, id_aluno: currentUser.id }),
                 credentials: 'include'
            });
             const data = await response.json();
             if (!response.ok) {
                throw new Error(data.error || data.erro || `Erro ${response.status}`);
            }
            if (data.correcao) {
                document.getElementById('correcaoConteudo').innerHTML = stripMarkdown(data.correcao).replace(/\n/g, '<br>');
                document.getElementById('correcaoOutput').classList.remove('hidden');
            } else if (data.erro) { 
                 throw new Error(data.erro);
            } else {
                 throw new Error("Resposta da API de correção está incompleta.");
            }
        } catch (error) {
            console.error('Erro API de correção:', error);
            // =====> CORREÇÃO 7 <=====
            showNotification(`Erro ao corrigir texto: ${error.message}.`, 'error');
             document.getElementById('correcaoOutput').classList.add('hidden');
             document.getElementById('correcaoConteudo').innerHTML = '';
        } finally {
            btnCorrecao.disabled = false;
            btnCorrecao.textContent = "Corrigir Texto";
        }
    });

    // Gerar Flashcards (Premium)
    const btnFlash = document.getElementById('gerarFlashcardsBtn');
    if (btnFlash) btnFlash.addEventListener('click', async () => {
        const tema = document.getElementById('flashcardInput').value;
        if (!tema) {
            // =====> CORREÇÃO 8 <=====
            showNotification("Digite um tema para os flashcards.", 'error');
            return;
        }
        const payload = { id_aluno: currentUser.id, tema: tema };
        btnFlash.disabled = true;
        btnFlash.textContent = "Gerando...";
        const container = document.getElementById('flashcardsContainer');
        container.innerHTML = ''; // Limpa flashcards antigos

        try {
            const response = await fetch(`${API_BASE_URL}/premium/flashcard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                 credentials: 'include'
            });
             const data = await response.json(); 

            if (!response.ok) {
                 if (data && (data.error || data.erro)) {
                    throw new Error(data.error || data.erro);
                 }
                throw new Error(`Erro HTTP ${response.status}`);
            }

            if (!data.contedo || typeof data.contedo !== 'string') {
                 console.error("Resposta inesperada da API (flashcard), campo 'contedo' ausente ou inválido:", data);
                 throw new Error("A IA retornou um formato inválido para flashcards (contedo ausente/inválido).");
             }

            const flashcardText = data.contedo.trim();
            if (flashcardText.includes("NÃO É POSSIVEL FORMAR UMA RESPOSTA")) {
                 throw new Error("Não é possível gerar flashcards para este tema devido à inadequação do assunto.");
            }

            const flashcardBlocks = flashcardText.split(/Pergunta:/i).filter(block => block.trim() !== '');

            if (flashcardBlocks.length === 0) {
                // =====> CORREÇÃO 9 <=====
                showNotification("Nenhum flashcard gerado para este tema ou formato de resposta inesperado.", 'error');
                console.warn("Conteúdo recebido não continha 'Pergunta:':", flashcardText);
            }

            flashcardBlocks.forEach((block, index) => {
                 const parts = block.split(/Resposta:/i);
                 if (parts.length >= 2) {
                    const pergunta = stripMarkdown(parts[0].trim());
                    const resposta = stripMarkdown(parts[1].trim());

                    if (pergunta && resposta) { 
                        const div = document.createElement('div');
                        div.className = 'flashcard w-full sm:w-64 md:w-72 lg:w-80 h-48 bg-white rounded-xl shadow-lg cursor-pointer perspective';
                        div.onclick = () => div.classList.toggle('flipped');
                        div.innerHTML = `
                            <div class="flashcard-inner">
                                <div class="flashcard-front">
                                    <span class="text-purple-800 text-lg font-semibold text-center">${pergunta}</span>
                                </div>
                                <div class="flashcard-back">
                                    <div class="flex flex-col items-center justify-center text-center p-4">
                                        <span class="font-bold text-pink-600">${resposta}</span>
                                        </div>
                                </div>
                            </div>`;
                        container.appendChild(div);
                    } else {
                         console.warn(`Flashcard ${index + 1} inválido (pergunta ou resposta vazia após parse):`, block);
                    }
                 } else {
                    console.warn(`Bloco ${index + 1} não continha 'Resposta:':`, block);
                 }
            });

        } catch (error) {
            console.error('Erro API de flashcards:', error);
            // =====> CORREÇÃO 10 <=====
            showNotification(`Erro ao gerar flashcards: ${error.message}.`, 'error');
        } finally {
            btnFlash.disabled = false;
            btnFlash.textContent = "Gerar Flashcards";
        }
    });

    // Gerar Quiz (Premium)
    const btnQuiz = document.getElementById("gerarQuizBtn");
     if(btnQuiz) btnQuiz.addEventListener("click", async () => {
        const tema = document.getElementById('quizInput').value;
        if (!tema) {
            // =====> CORREÇÃO 11 <=====
            showNotification("Digite um tema para o quiz.", 'error');
            return;
        }
        
        // Salva o tema no botão para usar ao salvar o resultado
        btnQuiz.dataset.tema = tema; 
 
        const payload = { id_aluno: currentUser.id, tema: tema };
        btnQuiz.disabled = true;
        btnQuiz.textContent = "Gerando...";
        const output = document.getElementById("quizOutput");
        const resultDiv = document.getElementById("quizResult");

        output.innerHTML = "";
        output.classList.add("hidden");
        resultDiv.classList.add("hidden"); 

        try {
            const response = await fetch(`${API_BASE_URL}/premium/quiz`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                 credentials: 'include'
            });
            const data = await response.json(); 

            if (!response.ok) {
                 if (data && (data.error || data.erro)) {
                     throw new Error(data.error || data.erro);
                 }
                throw new Error(`Erro HTTP ${response.status}`);
            }

             if (!data.contedo || typeof data.contedo !== 'string') {
                 console.error("Resposta inesperada da API (quiz), campo 'contedo' ausente ou inválido:", data);
                 throw new Error("A IA retornou um formato inválido para o quiz (contedo ausente/inválido).");
             }

             const quizText = data.contedo.trim();
             if (quizText.includes("NÃO É POSSIVEL FORMAR UMA RESPOSTA")) {
                  throw new Error("Não é possível gerar um quiz para este tema devido à inadequação do assunto.");
             }

             let quizJson = [];
             try {
                 let textoLimpo = quizText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
                 textoLimpo = textoLimpo.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
                 const parsedData = JSON.parse(textoLimpo);

                 if (Array.isArray(parsedData)) {
                     quizJson = parsedData;
                 } else if (parsedData.quiz && Array.isArray(parsedData.quiz)) {
                      console.warn("Quiz estava aninhado dentro de uma chave 'quiz'. Ajustando.");
                     quizJson = parsedData.quiz; 
                 } else {
                     throw new Error("O JSON retornado não é um array de questões ou um objeto com a chave 'quiz' contendo um array.");
                 }

             } catch (e) {
                 console.error("Erro ao parsear JSON do quiz:", e);
                 console.error("Texto recebido da IA:", quizText); 
                 throw new Error(`Erro ao interpretar o JSON retornado pela IA: ${e.message}`);
             }

             if (quizJson.length === 0) { 
                // =====> CORREÇÃO 12 <=====
                showNotification("Nenhum quiz gerado para este tema ou formato inválido.", 'error'); 
                return; 
             }

            let totalQuestoesValidas = 0; 
            let respostasCorretas = 0;
            let respondidas = 0;
            const scoreDisplay = document.getElementById("quizScore");

            quizJson.forEach((questao, index) => {
                 if (!questao || typeof questao !== 'object' || !questao.pergunta || !questao.opcoes || !Array.isArray(questao.opcoes) || questao.opcoes.length < 2 || !questao.resposta_correta) {
                     console.warn(`Questão ${index + 1} inválida ou incompleta:`, questao); return; 
                 }
                 totalQuestoesValidas++; 

                const card = document.createElement("div");
                card.className = "mb-6 p-4 bg-white rounded-lg shadow w-full card";
                card.innerHTML = `<p class="quiz-question-number">Pergunta ${totalQuestoesValidas}</p><p class="font-semibold text-lg mb-3">${stripMarkdown(questao.pergunta)}</p>`;

                const opcoesContainer = document.createElement("div");
                opcoesContainer.className = "space-y-2";
                const respostaCorretaTexto = stripMarkdown(questao.resposta_correta);

                questao.opcoes.forEach((opcaoTextoOriginal) => {
                     const opcaoTextoLimpo = stripMarkdown(opcaoTextoOriginal); 
                    const opcaoBtn = document.createElement("button");
                    opcaoBtn.className = "quiz-option w-full text-left p-3 border rounded-lg hover:bg-gray-100 transition";
                    opcaoBtn.textContent = opcaoTextoLimpo;

                    opcaoBtn.addEventListener("click", () => {
                        if (card.classList.contains("card-respondida")) return;
                        card.classList.add("card-respondida");
                        respondidas++;

                        if (opcaoBtn.textContent === respostaCorretaTexto) {
                            respostasCorretas++;
                            opcaoBtn.classList.add("correct-answer");
                        } else {
                            opcaoBtn.classList.add("wrong-answer");
                            const corretaBtn = Array.from(opcoesContainer.children).find(btn => btn.textContent === respostaCorretaTexto);
                            if(corretaBtn) corretaBtn.classList.add("correct-answer");
                        }
                        opcoesContainer.querySelectorAll("button").forEach(b => b.disabled = true); 

                        const explanationDiv = card.querySelector('.quiz-explanation');
                        if (explanationDiv) explanationDiv.classList.remove('hidden');

                        if (respondidas === totalQuestoesValidas) {
                             scoreDisplay.textContent = `Você acertou ${respostasCorretas} de ${totalQuestoesValidas} perguntas!`;
                             resultDiv.classList.remove("hidden");
                             
                             // Pega o tema salvo no botão
                             const temaSalvo = btnQuiz.dataset.tema || "Tema Desconhecido"; 
                             salvarResultadoQuiz(temaSalvo, respostasCorretas, totalQuestoesValidas);
                        }
                    });
                    opcoesContainer.appendChild(opcaoBtn);
                });

                card.appendChild(opcoesContainer);

                if(questao.explicacao){
                    const explanationDiv = document.createElement('div');
                    explanationDiv.className = 'quiz-explanation hidden mt-4'; 
                    explanationDiv.innerHTML = `<strong>Explicação:</strong> ${stripMarkdown(questao.explicacao)}`;
                    card.appendChild(explanationDiv);
                }
                output.appendChild(card);
            }); 

            output.classList.remove("hidden"); 

             if (totalQuestoesValidas === 0 && quizJson.length > 0) {
                // =====> CORREÇÃO 13 <=====
                 showNotification("O quiz foi gerado pela IA, mas nenhuma questão estava no formato esperado após a análise.", 'error');
             } else if (totalQuestoesValidas === 0) {
                // =====> CORREÇÃO 14 <=====
                  showNotification("Não foi possível gerar questões válidas para este tema.", 'error');
             }

        } catch (error) {
            console.error("Erro ao gerar/processar quiz:", error);
            // =====> CORREÇÃO 15 <=====
            showNotification("Erro ao gerar quiz: " + error.message, 'error');
        } finally {
            btnQuiz.disabled = false;
            btnQuiz.textContent = "Gerar Quiz";
        }
    });


    // Botão de reiniciar o quiz no popup
    const restartBtn = document.getElementById("restartQuizBtn");
    if(restartBtn) restartBtn.addEventListener("click", () => {
         const output = document.getElementById("quizOutput");
         const resultDiv = document.getElementById("quizResult");
        
        if(output) {
            output.innerHTML = ""; // Limpa as questões
            output.classList.add("hidden"); // Esconde a área do quiz
        }
        if(resultDiv) {
           resultDiv.classList.add("hidden"); // Esconde o resultado
        }
        
        // Limpa o input do tema
        if(document.getElementById('quizInput')) document.getElementById('quizInput').value = '';
        
        // Rola a tela de volta para o topo da tela-quiz
        const telaQuiz = document.getElementById('tela-quiz');
        if (telaQuiz) {
            telaQuiz.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });


    // --- LÓGICA DO CHATBOT ---
     const sendButton = document.getElementById('chat-send-btn');
     const chatInput = document.getElementById('chat-input');

     if (sendButton) sendButton.addEventListener('click', sendMessage); // Chama a função global

     if (chatInput) chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); 
            sendMessage(); // Chama a função global
        }
    });

     if (chatInput) chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto'; 
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });


}); // Fim do DOMContentLoaded  