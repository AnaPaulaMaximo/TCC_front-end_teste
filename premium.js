// URL da sua API refatorada (porta 5002)
const API_BASE_URL = 'http://127.0.0.1:5002';
const SOCKET_URL = 'http://127.0.0.1:5002';
let socket = null;

// Objeto para guardar informações do usuário logado
let currentUser = {
    id: null,
    nome: 'Visitante',
    plano: 'premium',
    fotoUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
};

// --- Funções de UI (Sidebar, Telas, etc.) ---

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
        connectToChat(); // Conecta ao chat ao abrir a tela
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

// --- Funções de Autenticação e Perfil ---

function checkLoginStatus() {
    const storedUser = sessionStorage.getItem('currentUser');
    if (!storedUser) {
        // Se não houver usuário na sessão, volta para a tela de login
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

    // Se for freemium, redireciona para a página freemium
    if (currentUser.plano !== 'premium') {
        window.location.href = 'freemium.html';
        return;
    }
    
    // Atualiza a UI para o usuário logado
    updateAuthButton();
    updateProfileDisplay();
    document.getElementById('welcomeName').textContent = `Bem-vindo, ${currentUser.nome}!`;
    document.getElementById('topbarLogo').src = currentUser.fotoUrl;
}

function updateAuthButton() {
    const authBtn = document.getElementById('authBtn');
    const authIcon = document.getElementById('authIcon');
    const authText = document.getElementById('authText');
    
    authBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
    authBtn.classList.add('bg-red-600', 'hover:bg-red-700');
    authIcon.textContent = 'logout';
    authText.textContent = 'Sair';
    authBtn.onclick = handleLogout;
}

function handleLogout() {
    sessionStorage.removeItem('currentUser');
    if (socket) {
        socket.disconnect();
    }
    window.location.href = 'login.html';
}

function updateProfileDisplay() {
    document.getElementById('profileNome').textContent = currentUser.nome || 'Seu Nome';
    document.getElementById('profileEmail').textContent = currentUser.email || 'seuemail@email.com';
    document.getElementById('profileFoto').src = currentUser.fotoUrl || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
}

// Funções de Edição de Perfil
window.abrirEditarPerfil = function () {
    document.getElementById('editFotoUrl').value = currentUser.fotoUrl || '';
    document.getElementById('editFotoPreview').src = currentUser.fotoUrl || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    document.getElementById('editNome').value = currentUser.nome;
    document.getElementById('editEmail').value = currentUser.email;
    document.getElementById('editSenha').value = '';
    document.getElementById('modalEditarPerfil').classList.remove('hidden');
}
window.fecharEditarPerfil = function () {
    document.getElementById('modalEditarPerfil').classList.add('hidden');
}

// --- Funções Auxiliares ---
function stripMarkdown(text) {
    if (!text) return '';
    // Simplificado para o front-end
    return text.replace(/```(json)?/g, '').replace(/[\*\#\`\>]/g, '');
}

// --- Lógica Principal da Página ---

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus(); // Verifica o login assim que a página carrega

    // Configurações iniciais de UI
    document.getElementById('sidebar').classList.add('sidebar-visible');
    document.getElementById('topbar').classList.add('topbar-visible');
    document.getElementById('mainContent').classList.add('ml-64');
    activateSidebarLink(document.querySelector('#sidebar a[data-sidebar="inicio"]'));
    showTela('inicio');

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
            activateMenuLink(null);
            showTela(this.getAttribute('data-sidebar'));
        });
    });
    
    // --- Lógica de Edição de Perfil ---
    document.getElementById('btnEditarPerfil').addEventListener('click', abrirEditarPerfil);
    document.getElementById('salvarEdicaoBtn').addEventListener('click', async () => {
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
            url_foto: novaFotoUrl
        };
        if (novaSenha) {
            updateData.senha = novaSenha;
        }

        try {
            // Chama a rota /auth/editar_usuario
            const response = await fetch(`${API_BASE_URL}/auth/editar_usuario/${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                // Atualiza dados locais e na sessionStorage
                currentUser.nome = novoNome;
                currentUser.email = novoEmail;
                currentUser.fotoUrl = novaFotoUrl;
                
                const sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));
                sessionUser.nome = novoNome;
                sessionUser.email = novoEmail;
                sessionUser.url_foto = novaFotoUrl;
                sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));
                
                updateProfileDisplay();
                fecharEditarPerfil();
            } else {
                alert(data.error || 'Erro ao salvar alterações.');
            }
        } catch (error) {
            console.error('Erro ao conectar com a API de edição:', error);
            alert('Erro ao conectar com o servidor.');
        }
    });

    // Preview da foto no modal de edição
    document.getElementById('editFotoUrl').addEventListener('input', (e) => {
        const imgPreview = document.getElementById('editFotoPreview');
        imgPreview.src = e.target.value || '[https://cdn-icons-png.flaticon.com/512/3135/3135715.png](https://cdn-icons-png.flaticon.com/512/3135/3135715.png)';
    });


    // --- Lógica das Ferramentas Premium (IA) ---

    // Gerar Resumo
    document.getElementById('gerarResumoBtn').addEventListener('click', async () => {
        const tema = document.getElementById('resumoInput').value;
        if (!tema) return alert('Por favor, digite um tema.');
        
        const btn = document.getElementById('gerarResumoBtn');
        btn.disabled = true;
        btn.textContent = "Gerando...";

        try {
            // Chama a rota /premium/resumo
            const response = await fetch(`${API_BASE_URL}/premium/resumo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tema, id_aluno: currentUser.id })
            });
            const data = await response.json();
            if (response.ok) {
                document.getElementById('resumoTitulo').textContent = `Resumo sobre: ${stripMarkdown(data.assunto)}`;
                document.getElementById('resumoConteudo').innerHTML = stripMarkdown(data.conteudo).replace(/\n/g, '<br>');
                document.getElementById('resumoOutput').classList.remove('hidden');
            } else {
                alert(data.error || 'Erro ao gerar resumo.');
            }
        } catch (error) {
            console.error('Erro API de resumo:', error);
            alert('Erro ao conectar com o servidor.');
        } finally {
            btn.disabled = false;
            btn.textContent = "Gerar Resumo";
        }
    });

    // Corrigir Texto
    document.getElementById('corrigirTextoBtn').addEventListener('click', async () => {
        const tema = document.getElementById('correcaoTemaInput').value;
        const texto = document.getElementById('correcaoTextoInput').value;
        if (!tema || !texto) return alert('Preencha o tema e o texto.');
        
        const btn = document.getElementById('corrigirTextoBtn');
        btn.disabled = true;
        btn.textContent = "Corrigindo...";
        try {
            // Chama a rota /premium/correcao
            const response = await fetch(`${API_BASE_URL}/premium/correcao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tema, texto, id_aluno: currentUser.id })
            });
            const data = await response.json();
            if (response.ok) {
                document.getElementById('correcaoConteudo').innerHTML = stripMarkdown(data.correcao).replace(/\n/g, '<br>');
                document.getElementById('correcaoOutput').classList.remove('hidden');
            } else {
                alert(data.error || 'Erro ao corrigir texto.');
            }
        } catch (error) {
            console.error('Erro API de correção:', error);
            alert('Erro ao conectar com o servidor.');
        } finally {
            btn.disabled = false;
            btn.textContent = "Corrigir Texto";
        }
    });

    // Gerar Flashcards (Premium)
    document.getElementById('gerarFlashcardsBtn').addEventListener('click', async () => {
        const tema = document.getElementById('flashcardInput').value;
        if (!tema) return alert("Digite um tema para os flashcards.");

        const payload = { id_aluno: currentUser.id, tema: tema };
        
        const btn = document.getElementById('gerarFlashcardsBtn');
        btn.disabled = true;
        btn.textContent = "Gerando...";
        
        try {
            // Chama a rota /premium/flashcard
            const response = await fetch(`${API_BASE_URL}/premium/flashcard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            const container = document.getElementById('flashcardsContainer');
            container.innerHTML = '';

            if (response.ok) {
                // A API premium retorna um texto, precisamos parseá-lo
                const flashcardTexts = data.contedo.split('Pergunta:').filter(text => text.trim() !== '');
                
                flashcardTexts.forEach(fcText => {
                    const parts = fcText.split('Resposta:');
                    if (parts.length > 1) {
                        const pergunta = stripMarkdown(parts[0].trim());
                        const resposta = stripMarkdown(parts[1].trim());

                        const div = document.createElement('div');
                        div.className = 'flashcard w-full sm:w-80 h-48';
                        div.onclick = () => div.classList.toggle('flipped');
                        div.innerHTML = `
                            <div class="flashcard-inner">
                                <div class="flashcard-front"><span class="font-semibold">${pergunta}</span></div>
                                <div class="flashcard-back">
                                    <div class="flex flex-col items-center text-center p-4">
                                        <span class="font-bold text-pink-600">${resposta}</span>
                                    </div>
                                </div>
                            </div>`;
                        container.appendChild(div);
                    }
                });
            } else {
                alert(data.error || 'Erro ao gerar flashcards.');
            }
        } catch (error) {
            console.error('Erro API de flashcards:', error);
            alert('Erro ao conectar com o servidor.');
        } finally {
            btn.disabled = false;
            btn.textContent = "Gerar Flashcards";
        }
    });

    // Gerar Quiz (Premium)
    document.getElementById("gerarQuizBtn").addEventListener("click", async () => {
        const tema = document.getElementById('quizInput').value;
        if (!tema) return alert("Digite um tema para o quiz.");

        const payload = { id_aluno: currentUser.id, tema: tema };

        const btn = document.getElementById("gerarQuizBtn");
        btn.disabled = true;
        btn.textContent = "Gerando...";

        const output = document.getElementById("quizOutput");
        const popup = document.getElementById("quizPopup");
        output.innerHTML = "";
        output.classList.add("hidden");
        popup.classList.remove("show");

        try {
            // Chama a rota /premium/quiz
            const response = await fetch(`${API_BASE_URL}/premium/quiz`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.error || "Ocorreu um erro no servidor");
            }

            // A API premium /quiz retorna um objeto com 'contedo'
            const data = await response.json();
            
            // O conteúdo é uma string JSON que precisa ser parseada
            let quizJson = [];
            try {
                let textoLimpo = data.contedo.trim()
                                    .replace(/^```(json)?/i, "")
                                    .replace(/```$/, "")
                                    .trim();
                quizJson = JSON.parse(textoLimpo);
            } catch (e) {
                console.error("Erro ao parsear JSON da IA:", e, data.contedo);
                throw new Error("A IA retornou um formato inválido. Tente novamente.");
            }

            let totalQuestoes = quizJson.length;
            let respostasCorretas = 0;
            let respondidas = 0;
            const scoreDisplay = document.getElementById("quizScore");
            
            quizJson.forEach((questao, index) => {
                const card = document.createElement("div");
                card.className = "mb-6 p-4 bg-white rounded-lg shadow w-full card";
                card.innerHTML = `<p class="quiz-question-number">Pergunta ${index + 1}</p><p class="font-semibold text-lg mb-3">${questao.pergunta}</p>`;

                const opcoesContainer = document.createElement("div");
                opcoesContainer.className = "space-y-2";
                
                const opcoes = questao.opcoes;
                const respostaCorreta = questao.resposta_correta;

                opcoes.forEach((opcaoTexto) => {
                    const opcaoBtn = document.createElement("button");
                    opcaoBtn.className = "quiz-option w-full text-left p-3 border rounded-lg hover:bg-gray-100 transition";
                    opcaoBtn.textContent = opcaoTexto;
                    
                    opcaoBtn.addEventListener("click", () => {
                        if (card.classList.contains("card-respondida")) return;
                        card.classList.add("card-respondida");
                        respondidas++;

                        if (opcaoBtn.textContent === respostaCorreta) {
                            respostasCorretas++;
                            opcaoBtn.classList.add("correct-answer");
                        } else {
                            opcaoBtn.classList.add("wrong-answer");
                            const corretaBtn = Array.from(opcoesContainer.children).find(btn => btn.textContent === respostaCorreta);
                            if(corretaBtn) corretaBtn.classList.add("correct-answer");
                        }
                        
                        opcoesContainer.querySelectorAll("button").forEach(b => b.disabled = true);
                        
                        const explanationDiv = card.querySelector('.quiz-explanation');
                        if (explanationDiv) explanationDiv.classList.remove('hidden');
                        
                        if (respondidas === totalQuestoes) {
                            scoreDisplay.textContent = `Você acertou ${respostasCorretas} de ${totalQuestoes} perguntas!`;
                            popup.classList.add("show");
                        }
                    });
                    opcoesContainer.appendChild(opcaoBtn);
                });

                card.appendChild(opcoesContainer);

                if(questao.explicacao){
                    const explanationDiv = document.createElement('div');
                    explanationDiv.className = 'quiz-explanation hidden';
                    explanationDiv.innerHTML = `<strong>Explicação:</strong> ${questao.explicacao}`;
                    card.appendChild(explanationDiv);
                }
                output.appendChild(card);
            });
            output.classList.remove("hidden");
            
        } catch (error) {
            alert("Erro ao gerar quiz: " + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = "Gerar Quiz";
        }
    });
    
    // Botão de reiniciar o quiz no popup
    document.getElementById("restartQuizBtn").addEventListener("click", () => {
        document.getElementById("quizOutput").innerHTML = "";
        document.getElementById("quizOutput").classList.add("hidden");
        document.getElementById("quizPopup").classList.remove("show");
    });

    // --- LÓGICA DO CHATBOT ---
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('chat-send-btn');
    const typingIndicator = document.getElementById('typing-indicator');

    function convertMarkdownToHtml(markdownText) {
        if (!markdownText) return '';
        let htmlText = markdownText;
        htmlText = htmlText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        htmlText = htmlText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        htmlText = htmlText.replace(/\n/g, '<br>');
        return htmlText;
    }

    function addMessage(sender, text) {
        const messageContainer = document.createElement('div');
        const messageBubble = document.createElement('div');

        if (sender === 'user') {
            messageContainer.className = 'flex justify-end mb-4';
            messageBubble.className = 'chat-bubble-user';
        } else {
            messageContainer.className = 'flex justify-start mb-4';
            messageBubble.className = 'chat-bubble-bot';
        }

        messageBubble.innerHTML = convertMarkdownToHtml(text);
        messageContainer.appendChild(messageBubble);
        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator(show) {
        typingIndicator.style.display = show ? 'block' : 'none';
        if (show) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    function sendMessage() {
        const messageText = chatInput.value.trim();
        if (messageText === '' || !socket || !socket.connected) {
            return;
        }

        addMessage('user', messageText);
        socket.emit('enviar_mensagem', { mensagem: messageText });
        
        chatInput.value = '';
        chatInput.style.height = 'auto'; // Reset altura
        chatInput.focus();
        showTypingIndicator(true);
    }

    function connectToChat() {
        if (socket && socket.connected) {
             return; // Já está conectado
        }
        if (socket) {
            socket.disconnect();
        }
        
        // Conecta ao Socket.IO (que está no mesmo servidor da API)
        socket = io(SOCKET_URL, {
            withCredentials: true // Importante para enviar os cookies da sessão
        });

        socket.on('connect', () => {
            console.log('Conectado ao servidor de chat!');
            chatInput.disabled = false;
            sendButton.disabled = false;
            chatInput.placeholder = "Digite sua mensagem...";
        });

        socket.on('disconnect', () => {
            console.log('Desconectado do servidor.');
            showTypingIndicator(false);
        });

        socket.on('connect_error', (error) => {
            console.error('Erro de conexão com socket:', error);
            showTypingIndicator(false);
            addMessage('bot', 'Erro ao conectar com o servidor de chat.');
        });

        socket.on('nova_mensagem', (data) => {
            showTypingIndicator(false);
            if (data.texto) {
                addMessage('bot', data.texto);
            }
        });

        socket.on('erro', (data) => {
            console.error('Erro do servidor de chat:', data);
            showTypingIndicator(false);
            addMessage('bot', 'Desculpe, ocorreu um erro. Tente novamente.');
        });
    }

    // Event listeners do Chat
    sendButton.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize do textarea do chat
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';
    });

});