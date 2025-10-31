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


// ---> FUNÇÕES DO CHAT MOVIDAS PARA FORA DO DOMContentLoaded <---

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
        // Tentar reconectar automaticamente pode causar loops se o servidor cair
        // socket.connect(); // Descomente se quiser tentar reconectar
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

// ---> FIM DAS FUNÇÕES MOVIDAS <---

// --- Funções de Autenticação e Perfil (MANTIDAS GLOBAIS OU COMO ESTAVAM) ---

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

function showTela(page) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa', 'fade-in'));
    const telaNova = document.getElementById('tela-' + page);

    if (telaNova) {
        telaNova.classList.add('ativa', 'fade-in');
    }
    if (page === 'perfil') {
        updateProfileDisplay();
    }
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

// --- Lógica Principal da Página ---

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
    const btnEditar = document.getElementById('btnEditarPerfil');
    if (btnEditar) btnEditar.addEventListener('click', abrirEditarPerfil);

    const btnSalvar = document.getElementById('salvarEdicaoBtn');
     if (btnSalvar) btnSalvar.addEventListener('click', async () => {
        const novoNome = document.getElementById('editNome').value;
        const novoEmail = document.getElementById('editEmail').value;
        const novaSenha = document.getElementById('editSenha').value;
        const novaFotoUrl = document.getElementById('editFotoUrl').value;

        if (!novoNome || !novoEmail) {
            return alert('Nome e E-mail não podem ser vazios.');
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
                alert(data.message);
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
                alert(data.error || 'Erro ao salvar alterações.');
            }
        } catch (error) {
            console.error('Erro ao conectar com a API de edição:', error);
            alert('Erro ao conectar com o servidor.');
        }
    });

    const editFotoUrlInput = document.getElementById('editFotoUrl');
    if (editFotoUrlInput) editFotoUrlInput.addEventListener('input', (e) => {
        const imgPreview = document.getElementById('editFotoPreview');
        imgPreview.src = e.target.value || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    });

    // --- Lógica das Ferramentas Premium (IA) ---

     // Gerar Resumo
    const btnResumo = document.getElementById('gerarResumoBtn');
    if (btnResumo) btnResumo.addEventListener('click', async () => {
        const tema = document.getElementById('resumoInput').value;
        if (!tema) return alert('Por favor, digite um tema.');
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
            // MODIFICADO: Acessar data.conteudo
            if (data.conteudo) {
                 document.getElementById('resumoTitulo').textContent = `Resumo sobre: ${stripMarkdown(data.assunto || tema)}`;
                 document.getElementById('resumoConteudo').innerHTML = stripMarkdown(data.conteudo).replace(/\n/g, '<br>');
                 document.getElementById('resumoOutput').classList.remove('hidden');
            } else if (data.erro) { // Verifica se a API retornou um erro específico
                throw new Error(data.erro);
            } else {
                 throw new Error("Resposta da API de resumo está incompleta.");
            }
        } catch (error) {
            console.error('Erro API de resumo:', error);
            alert(`Erro ao gerar resumo: ${error.message}. Verifique o console.`);
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
        if (!tema || !texto) return alert('Preencha o tema e o texto.');
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
            // MODIFICADO: Acessar data.correcao
            if (data.correcao) {
                document.getElementById('correcaoConteudo').innerHTML = stripMarkdown(data.correcao).replace(/\n/g, '<br>');
                document.getElementById('correcaoOutput').classList.remove('hidden');
            } else if (data.erro) { // Verifica erro específico
                 throw new Error(data.erro);
            } else {
                 throw new Error("Resposta da API de correção está incompleta.");
            }
        } catch (error) {
            console.error('Erro API de correção:', error);
            alert(`Erro ao corrigir texto: ${error.message}.`);
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
        if (!tema) return alert("Digite um tema para os flashcards.");
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
             const data = await response.json(); // Espera um objeto { assunto: ..., contedo: "..."}

            if (!response.ok) {
                 // Se o backend retornou um erro específico no JSON
                 if (data && (data.error || data.erro)) {
                    throw new Error(data.error || data.erro);
                 }
                throw new Error(`Erro HTTP ${response.status}`);
            }

            // ***** INÍCIO DA CORREÇÃO *****
            if (!data.contedo || typeof data.contedo !== 'string') {
                 console.error("Resposta inesperada da API (flashcard), campo 'contedo' ausente ou inválido:", data);
                 throw new Error("A IA retornou um formato inválido para flashcards (contedo ausente/inválido).");
             }

            const flashcardText = data.contedo.trim();
             // Tenta tratar casos onde a IA pode retornar a mensagem de erro direto no contedo
            if (flashcardText.includes("NÃO É POSSIVEL FORMAR UMA RESPOSTA")) {
                 throw new Error("Não é possível gerar flashcards para este tema devido à inadequação do assunto.");
            }

             // Divide o texto em blocos "Pergunta: ... Resposta: ..."
            const flashcardBlocks = flashcardText.split(/Pergunta:/i).filter(block => block.trim() !== '');

            if (flashcardBlocks.length === 0) {
                 alert("Nenhum flashcard gerado para este tema ou formato de resposta inesperado.");
                 console.warn("Conteúdo recebido não continha 'Pergunta:':", flashcardText);
            }

            flashcardBlocks.forEach((block, index) => {
                 const parts = block.split(/Resposta:/i);
                 if (parts.length >= 2) {
                    const pergunta = stripMarkdown(parts[0].trim());
                    const resposta = stripMarkdown(parts[1].trim());

                    if (pergunta && resposta) { // Garante que ambos foram extraídos
                        const div = document.createElement('div');
                        // Ajustando classes para consistência e responsividade
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
             // ***** FIM DA CORREÇÃO *****

        } catch (error) {
            console.error('Erro API de flashcards:', error);
            alert(`Erro ao gerar flashcards: ${error.message}.`);
        } finally {
            btnFlash.disabled = false;
            btnFlash.textContent = "Gerar Flashcards";
        }
    });

    // Gerar Quiz (Premium)
    const btnQuiz = document.getElementById("gerarQuizBtn");
     if(btnQuiz) btnQuiz.addEventListener("click", async () => {
        const tema = document.getElementById('quizInput').value;
        if (!tema) return alert("Digite um tema para o quiz.");
        const payload = { id_aluno: currentUser.id, tema: tema };
        btnQuiz.disabled = true;
        btnQuiz.textContent = "Gerando...";
        const output = document.getElementById("quizOutput");
        const popup = document.getElementById("quizPopup");
        output.innerHTML = "";
        output.classList.add("hidden");
        popup.classList.remove("show"); // Esconde popup de resultados anteriores

        try {
            const response = await fetch(`${API_BASE_URL}/premium/quiz`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                 credentials: 'include'
            });
            const data = await response.json(); // Espera um objeto { assunto: ..., contedo: "..."}

            if (!response.ok) {
                 // Se o backend retornou um erro específico no JSON
                 if (data && (data.error || data.erro)) {
                     throw new Error(data.error || data.erro);
                 }
                throw new Error(`Erro HTTP ${response.status}`);
            }

            // ***** INÍCIO DA CORREÇÃO *****
             if (!data.contedo || typeof data.contedo !== 'string') {
                 console.error("Resposta inesperada da API (quiz), campo 'contedo' ausente ou inválido:", data);
                 throw new Error("A IA retornou um formato inválido para o quiz (contedo ausente/inválido).");
             }

             const quizText = data.contedo.trim();
              // Tenta tratar casos onde a IA pode retornar a mensagem de erro direto no contedo
             if (quizText.includes("NÃO É POSSIVEL FORMAR UMA RESPOSTA")) {
                  throw new Error("Não é possível gerar um quiz para este tema devido à inadequação do assunto.");
             }

             let quizJson = [];
             try {
                 // Limpa possível formatação Markdown antes de parsear
                 let textoLimpo = quizText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
                 // Tenta corrigir aspas inválidas comuns
                 textoLimpo = textoLimpo.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
                 
                 const parsedData = JSON.parse(textoLimpo);

                 // Verifica se o JSON está aninhado (como visto no erro: { "quiz": [...] })
                 if (Array.isArray(parsedData)) {
                     quizJson = parsedData;
                 } else if (parsedData.quiz && Array.isArray(parsedData.quiz)) {
                      console.warn("Quiz estava aninhado dentro de uma chave 'quiz'. Ajustando.");
                     quizJson = parsedData.quiz; // Ajusta para usar o array aninhado
                 } else {
                     throw new Error("O JSON retornado não é um array de questões ou um objeto com a chave 'quiz' contendo um array.");
                 }

             } catch (e) {
                 console.error("Erro ao parsear JSON do quiz:", e);
                 console.error("Texto recebido da IA:", quizText); // Loga o texto problemático
                 throw new Error(`Erro ao interpretar o JSON retornado pela IA: ${e.message}`);
             }
            // ***** FIM DA CORREÇÃO *****


             if (quizJson.length === 0) { alert("Nenhum quiz gerado para este tema ou formato inválido."); return; }

            // Lógica para exibir o quiz (mantida como estava, mas usando quizJson)
            let totalQuestoesValidas = 0; // Contar apenas questões válidas
            let respostasCorretas = 0;
            let respondidas = 0;
            const scoreDisplay = document.getElementById("quizScore");

            quizJson.forEach((questao, index) => {
                 // Validação mais robusta da estrutura da questão
                 if (!questao || typeof questao !== 'object' || !questao.pergunta || !questao.opcoes || !Array.isArray(questao.opcoes) || questao.opcoes.length < 2 || !questao.resposta_correta) {
                     console.warn(`Questão ${index + 1} inválida ou incompleta:`, questao); return; // Pula questão inválida
                 }
                 totalQuestoesValidas++; // Incrementa só se a questão for válida

                const card = document.createElement("div");
                card.className = "mb-6 p-4 bg-white rounded-lg shadow w-full card";
                // Usar totalQuestoesValidas para a numeração
                card.innerHTML = `<p class="quiz-question-number">Pergunta ${totalQuestoesValidas}</p><p class="font-semibold text-lg mb-3">${stripMarkdown(questao.pergunta)}</p>`;

                const opcoesContainer = document.createElement("div");
                opcoesContainer.className = "space-y-2";
                // Garante que a resposta correta seja comparada sem markdown
                const respostaCorretaTexto = stripMarkdown(questao.resposta_correta);

                questao.opcoes.forEach((opcaoTextoOriginal) => {
                     const opcaoTextoLimpo = stripMarkdown(opcaoTextoOriginal); // Limpa markdown da opção também
                    const opcaoBtn = document.createElement("button");
                    opcaoBtn.className = "quiz-option w-full text-left p-3 border rounded-lg hover:bg-gray-100 transition";
                    opcaoBtn.textContent = opcaoTextoLimpo;

                    opcaoBtn.addEventListener("click", () => {
                        if (card.classList.contains("card-respondida")) return;
                        card.classList.add("card-respondida");
                        respondidas++;

                        // Compara textos limpos
                        if (opcaoBtn.textContent === respostaCorretaTexto) {
                            respostasCorretas++;
                            opcaoBtn.classList.add("correct-answer");
                        } else {
                            opcaoBtn.classList.add("wrong-answer");
                            // Encontra o botão correto comparando textos limpos
                            const corretaBtn = Array.from(opcoesContainer.children).find(btn => btn.textContent === respostaCorretaTexto);
                            if(corretaBtn) corretaBtn.classList.add("correct-answer");
                        }
                        opcoesContainer.querySelectorAll("button").forEach(b => b.disabled = true); // Desabilita todos os botões da questão

                        // Mostra explicação se houver
                        const explanationDiv = card.querySelector('.quiz-explanation');
                        if (explanationDiv) explanationDiv.classList.remove('hidden');

                        // Verifica se todas as questões VÁLIDAS foram respondidas
                        if (respondidas === totalQuestoesValidas) {
                             scoreDisplay.textContent = `Você acertou ${respostasCorretas} de ${totalQuestoesValidas} perguntas!`;
                            popup.classList.add("show");
                        }
                    });
                    opcoesContainer.appendChild(opcaoBtn);
                });

                card.appendChild(opcoesContainer);

                // Adiciona explicação (se existir), mas começa escondida
                if(questao.explicacao){
                    const explanationDiv = document.createElement('div');
                    explanationDiv.className = 'quiz-explanation hidden mt-4'; // Adiciona margin top
                    explanationDiv.innerHTML = `<strong>Explicação:</strong> ${stripMarkdown(questao.explicacao)}`;
                    card.appendChild(explanationDiv);
                }
                output.appendChild(card);
            }); // Fim do forEach quizJson

            output.classList.remove("hidden"); // Mostra a área do quiz

             // Alerta se o quiz foi gerado mas nenhuma questão era válida
             if (totalQuestoesValidas === 0 && quizJson.length > 0) {
                 alert("O quiz foi gerado pela IA, mas nenhuma questão estava no formato esperado após a análise.");
             } else if (totalQuestoesValidas === 0) {
                  alert("Não foi possível gerar questões válidas para este tema.");
             }

        } catch (error) {
            console.error("Erro ao gerar/processar quiz:", error);
            alert("Erro ao gerar quiz: " + error.message);
        } finally {
            btnQuiz.disabled = false;
            btnQuiz.textContent = "Gerar Quiz";
        }
    });


    // Botão de reiniciar o quiz no popup
    const restartBtn = document.getElementById("restartQuizBtn");
    if(restartBtn) restartBtn.addEventListener("click", () => {
         const output = document.getElementById("quizOutput");
         const popup = document.getElementById("quizPopup");
        output.innerHTML = ""; // Limpa as questões
        output.classList.add("hidden"); // Esconde a área do quiz
        popup.classList.remove("show"); // Esconde o popup de resultado
        // Opcional: Limpar o input do tema
        // document.getElementById('quizInput').value = '';
    });

    // --- LÓGICA DO CHATBOT ---
    // Event listeners para sendButton e chatInput
     const sendButton = document.getElementById('chat-send-btn');
     const chatInput = document.getElementById('chat-input');

     if (sendButton) sendButton.addEventListener('click', sendMessage); // Chama a função global

     if (chatInput) chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Impede a quebra de linha padrão do Enter no textarea
            sendMessage(); // Chama a função global
        }
    });

    // Ajuste de altura do textarea do chat
     if (chatInput) chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto'; // Reseta a altura para calcular corretamente
        // Define a altura baseada no scrollHeight, limitado a um máximo (e.g., 120px)
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });


}); // Fim do DOMContentLoaded