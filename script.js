console.log("carregou")

const btn_chat = document.getElementById('btn-chat')

const API_BASE_URL = 'http://127.0.0.1:5002'; // URL base do seu backend Flask
const SOCKET_URL = 'http://127.0.0.1:5002';
let socket = null;

// Objeto para guardar informações do usuário logado
let currentUser = {
    id: null,
    nome: 'Visitante',
    email: 'Faça login para continuar',
    plano: 'freemium', // Plano padrão
    fotoUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
};

// Função para remover caracteres Markdown--------------------------------------------------------------------------------------------------
function stripMarkdown(text) {
    if (!text) return '';
    let cleanedText = text;
    cleanedText = cleanedText.replace(/^#{1,6}\s*(.*)$/gm, '$1');
    cleanedText = cleanedText.replace(/\*\*(.*?)\*\*/g, '$1');
    cleanedText = cleanedText.replace(/__(.*?)__/g, '$1');
    cleanedText = cleanedText.replace(/\*(.*?)\*/g, '$1');
    cleanedText = cleanedText.replace(/_(.*?)_/g, '$1');
    cleanedText = cleanedText.replace(/\[(.*?)\]\(.*?\)/g, '$1');
    cleanedText = cleanedText.replace(/^[-\*\+]\s*/gm, '');
    cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');
    cleanedText = cleanedText.replace(/^>\s*/gm, '');
    cleanedText = cleanedText.replace(/\n\s*\n/g, '\n\n');
    cleanedText = cleanedText.split('\n').map(line => line.trim()).join('\n');
    return cleanedText.trim();
}


function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('openSidebarBtn');
    const mainContent = document.getElementById('mainContent');
    const topbar = document.getElementById('topbar');

    if (sidebar.classList.contains('sidebar-visible')) {
        sidebar.classList.remove('sidebar-visible');
        sidebar.classList.add('sidebar-hidden');
        topbar.style.paddingLeft = '0rem'; // Ajusta o padding da topbar
        mainContent.classList.remove('ml-64');
        setTimeout(() => {
            openBtn.classList.remove('hidden');
        }, 400); // Esconde o botão após a transição da sidebar
    } else {
        sidebar.classList.remove('sidebar-hidden');
        sidebar.classList.add('sidebar-visible');
        topbar.style.paddingLeft = '16rem'; // Ajusta o padding da topbar
        mainContent.classList.add('ml-64');
        openBtn.classList.add('hidden'); // Esconde o botão de abrir imediatamente
    }
}

// Menu superior---------------------------------------------------------------------------------------------------------------------------
function moveMenuUnderline(target) {
    const underline = document.getElementById('menuUnderline');
    const menuBar = document.getElementById('menuBar');
    if (!underline || !menuBar || !target) {
        if(underline) underline.style.width = `0px`; // Esconde o underline
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
        moveMenuUnderline(null); // Remove o underline se nenhum link estiver ativo
    }
}


// Tela-----------------------------------------------------------------------------------------------------------------------------------
function showTela(page) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa', 'fade-in'));
    const telaNova = document.getElementById('tela-' + page);
    
    if (telaNova) {
        telaNova.classList.add('ativa', 'fade-in');
    }

    // Ao mostrar a tela de perfil, atualiza os dados (já existente)
    if (page === 'perfil') {
        updateProfileDisplay();
    }
}

// Menu lateral----------------------------------------------------------------------------------------------------------------------------
function activateSidebarLink(target) {
    document.querySelectorAll('#sidebar a[data-sidebar]').forEach(link => {
        link.classList.remove('sidebar-link-active');
    });
    if (target) {
        target.classList.add('sidebar-link-active');
    }
}

// Função para atualizar a UI com base no plano
function updateUIForPlan() {
    const plan = currentUser.plano;
    const isPremium = plan === 'premium';

    document.querySelectorAll('.premium-feature').forEach(el => {
        el.classList.toggle('hidden', !isPremium);
    });

    document.getElementById('quizSetupFreemium').classList.toggle('hidden', isPremium);
    document.getElementById('quizSetupPremium').classList.toggle('hidden', !isPremium);

    document.getElementById('flashcardSetupFreemium').classList.toggle('hidden', isPremium);
    document.getElementById('flashcardSetupPremium').classList.toggle('hidden', !isPremium);

    updateAuthButton();
    updateProfileDisplay();
}


// Função para atualizar o botão de Login/Sair
function updateAuthButton() {
    const authBtn = document.getElementById('authBtn');
    const authIcon = document.getElementById('authIcon');
    const authText = document.getElementById('authText');
    const welcomeButtons = document.getElementById('welcome-buttons');
    const btnEditarPerfil = document.getElementById('btnEditarPerfil');
    
    const isLoggedIn = !!currentUser.id;

    if (isLoggedIn) {
        authBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
        authBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        authIcon.textContent = 'logout';
        authText.textContent = 'Sair';
        authBtn.onclick = handleLogout;
        if(welcomeButtons) welcomeButtons.classList.add('hidden');
        if(btnEditarPerfil) btnEditarPerfil.classList.remove('hidden');
    } else {
        authBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        authBtn.classList.add('bg-purple-600', 'hover:bg-purple-700');
        authIcon.textContent = 'login';
        authText.textContent = 'Login';
        authBtn.onclick = abrirLogin;
        if(welcomeButtons) welcomeButtons.classList.remove('hidden');
        if(btnEditarPerfil) btnEditarPerfil.classList.add('hidden');
    }
}

// Função de Logout
function handleLogout() {
    sessionStorage.removeItem('currentUser');
    currentUser = { id: null, nome: 'Visitante', email: 'Faça login para continuar', plano: 'freemium', fotoUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' };
    updateUIForPlan();
    showTela('inicio');
    alert('Você foi desconectado!');
}

// Carrega usuário da sessão
function loadUserFromSession() {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        currentUser = {
            id: userData.id_aluno,
            nome: userData.nome,
            email: userData.email,
            plano: userData.plano,
            fotoUrl: userData.url_foto || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        };
    } else {
        currentUser = { id: null, nome: 'Visitante', email: 'Faça login para continuar', plano: 'freemium', fotoUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' };
    }
    updateUIForPlan();
}

// Funções de Login e Criar Conta
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

// Funções para Edição de Perfil
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

// Função para atualizar as informações na tela de Perfil 
function updateProfileDisplay() {
    document.getElementById('profileNome').textContent = currentUser.nome || 'Seu Nome';
    document.getElementById('profileEmail').textContent = currentUser.email || 'seuemail@email.com';
    document.getElementById('profileFoto').src = currentUser.fotoUrl || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
}


document.addEventListener('DOMContentLoaded', () => {
    loadUserFromSession();

    document.getElementById('sidebar').classList.add('sidebar-visible');
    document.getElementById('topbar').classList.add('topbar-visible');
    document.getElementById('mainContent').classList.add('ml-64');

    const initialSidebarLink = document.querySelector('#sidebar a[data-sidebar="inicio"]');
    if (initialSidebarLink) {
        activateSidebarLink(initialSidebarLink);
    }
    const initialMenuLink = document.querySelector('#menuBar .menu-link[data-page="inicio"]');
    if (initialMenuLink) {
        activateMenuLink(initialMenuLink);
        showTela('inicio');
    }

    document.querySelectorAll('#menuBar .menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activateMenuLink(link);
            activateSidebarLink(null);
            const page = link.getAttribute('data-page');
            showTela(page);
        });
    });

    const sidebarLinks = document.querySelectorAll('#sidebar a[data-sidebar]');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            activateSidebarLink(this);
            activateMenuLink(null);
            const page = this.getAttribute('data-sidebar');
            showTela(page);
        });
    });

    window.addEventListener('resize', () => {
        const active = document.querySelector('#menuBar .menu-link.active');
        if (active) moveMenuUnderline(active);
    });


    // Lógica para os botões de Login e Criar Conta (Modal)
    document.getElementById('entrarBtn').addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        const senha = document.getElementById('loginSenha').value;

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, senha }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                // AQUI ESTÁ A CORREÇÃO PRINCIPAL: ACESSAR data.user
                sessionStorage.setItem('currentUser', JSON.stringify(data.user));
                loadUserFromSession(); // Carrega o novo usuário e atualiza a UI
                fecharLogin();
                showTela('inicio');
            } else {
                alert(data.error || 'Erro ao fazer login. Verifique suas credenciais.');
            }
        } catch (error) {
            console.error('Erro ao conectar com a API de login:', error);
            alert('Erro ao conectar com o servidor');
        }
    });

    document.getElementById('criarContaBtn').addEventListener('click', async () => {
        const nome = document.getElementById('cadastroNome').value;
        const email = document.getElementById('cadastroEmail').value;
        const senha = document.getElementById('cadastroSenha').value;
        const confirmarSenha = document.getElementById('cadastroConfirmarSenha').value;

        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem!');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/cadastrar_usuario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                fecharCriarConta();
                abrirLogin();
            } else {
                alert(data.error || 'Erro ao criar conta.');
            }
        } catch (error) {
            console.error('Erro ao conectar com a API de cadastro:', error);
            alert('Erro ao conectar com o servidor');
        }
    });

    // Lógica para o botão "Editar Perfil"
    document.getElementById('btnEditarPerfil').addEventListener('click', () => {
        abrirEditarPerfil();
    });

    document.getElementById('salvarEdicaoBtn').addEventListener('click', async () => {
        const novoNome = document.getElementById('editNome').value;
        const novoEmail = document.getElementById('editEmail').value;
        const novaSenha = document.getElementById('editSenha').value;
        const novaFotoUrl = document.getElementById('editFotoUrl').value;

        if (!novoNome || !novoEmail) {
            alert('Nome e E-mail não podem ser vazios.');
            return;
        }

        const updateData = {
            nome: novoNome,
            email: novoEmail,
            url_foto: novaFotoUrl // CORREÇÃO: Usar url_foto como o backend espera
        };
        if (novaSenha) {
            updateData.senha = novaSenha;
        }

        try {
            if (!currentUser.id) {
                alert('Nenhum usuário logado para editar.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/editar_usuario/${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                currentUser.nome = novoNome;
                currentUser.email = novoEmail;
                currentUser.fotoUrl = novaFotoUrl;
                // Atualiza o sessionStorage para manter os dados
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
            alert('Erro ao conectar com o servidor para salvar alterações.');
        }
    });

    document.getElementById('editFotoUrl').addEventListener('input', (e) => {
        const imgPreview = document.getElementById('editFotoPreview');
        const url = e.target.value;
        if (url) {
            imgPreview.src = url;
        } else {
            imgPreview.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        }
    });

    // --- Integração com o Backend para Ferramentas de Revisão ---

    // Gerar Resumo
    document.getElementById('gerarResumoBtn').addEventListener('click', async () => {
        if (!currentUser.id) return alert("Você precisa estar logado.");
        const tema = document.getElementById('resumoInput').value;
        if (!tema) return alert('Por favor, digite um tema.');
        
        const btn = document.getElementById('gerarResumoBtn');
        btn.disabled = true;
        btn.textContent = "Gerando...";

        try {
            const response = await fetch(`${API_BASE_URL}/resumo`, {
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
        if (!currentUser.id) return alert("Você precisa estar logado.");
        const tema = document.getElementById('correcaoTemaInput').value;
        const texto = document.getElementById('correcaoTextoInput').value;
        if (!tema || !texto) return alert('Preencha o tema e o texto.');
        
        const btn = document.getElementById('corrigirTextoBtn');
        btn.disabled = true;
        btn.textContent = "Corrigindo...";
        try {
            const response = await fetch(`${API_BASE_URL}/correcao`, {
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

    // Gerar Flashcards
    document.getElementById('gerarFlashcardsBtn').addEventListener('click', async () => {
        if (!currentUser.id) return alert("Você precisa estar logado.");
        
        let payload = { id_aluno: currentUser.id };
        if (currentUser.plano === 'premium') {
            const tema = document.getElementById('flashcardInput').value;
            if (!tema) return alert("Digite um tema para os flashcards.");
            payload.tema = tema;
        } else {
            payload.category = document.getElementById('flashcardCategory').value;
        }

        const btn = document.getElementById('gerarFlashcardsBtn');
        btn.disabled = true;
        btn.textContent = "Gerando...";
        try {
            const response = await fetch(`${API_BASE_URL}/flashcard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            const container = document.getElementById('flashcardsContainer');
            container.innerHTML = '';

            if (response.ok) {
                // O backend agora retorna JSON para ambos os planos
                data.forEach(fc => {
                    const div = document.createElement('div');
                    div.className = 'flashcard';
                    div.onclick = () => div.classList.toggle('flipped');
                    div.innerHTML = `
                        <div class="flashcard-inner">
                            <div class="flashcard-front"><span class="font-semibold">${fc.pergunta}</span></div>
                            <div class="flashcard-back">
                                <div class="flex flex-col items-center text-center p-4">
                                    <span class="font-bold text-pink-600">${fc.resposta}</span>
                                    <span class="text-sm mt-2">${fc.explicacao || ''}</span>
                                </div>
                            </div>
                        </div>`;
                    container.appendChild(div);
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

    // Gerar Quiz
    document.getElementById("gerarQuizBtn").addEventListener("click", async () => {
        if (!currentUser.id) return alert("Você precisa estar logado.");

        let payload = { id_aluno: currentUser.id };
        if (currentUser.plano === 'premium') {
            const tema = document.getElementById('quizInput').value;
            if (!tema) return alert("Digite um tema para o quiz.");
            payload.tema = tema;
        } else {
            payload.category = document.getElementById('quizCategory').value;
        }

        const btn = document.getElementById("gerarQuizBtn");
        btn.disabled = true;
        btn.textContent = "Gerando...";

        const output = document.getElementById("quizOutput");
        const popup = document.getElementById("quizPopup");
        output.innerHTML = "";
        output.classList.add("hidden");
        popup.classList.remove("show");

        try {
            const response = await fetch(`${API_BASE_URL}/quiz`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            
            if (!response.ok) {
                 const errData = await response.json();
                 throw new Error(errData.error || "Ocorreu um erro no servidor");
            }

            const quizJson = await response.json();
            
            let totalQuestoes = quizJson.length;
            let respostasCorretas = 0;
            let respondidas = 0;
            const scoreDisplay = document.getElementById("quizScore");
            
            quizJson.forEach((questao, index) => {
                const card = document.createElement("div");
                card.className = "mb-6 p-4 bg-white rounded-lg shadow w-full card";
                card.innerHTML = `<p class="quiz-question-number">Pergunta ${index + 1}</p><p class="font-semibold text-lg mb-3">${questao.question || questao.pergunta}</p>`;

                const opcoesContainer = document.createElement("div");
                opcoesContainer.className = "space-y-2";
                
                const opcoes = questao.options || questao.opcoes;
                const respostaCorreta = questao.correctAnswer || questao.resposta_correta;

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
    
    document.getElementById("restartQuizBtn").addEventListener("click", () => {
        document.getElementById("quizOutput").innerHTML = "";
        document.getElementById("quizOutput").classList.add("hidden");
        document.getElementById("quizPopup").classList.remove("show");
    });

    // ================================================================================================================================
    // LÓGICA DO CHATBOT==============================================================================================================
    // ================================================================================================================================

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

        console.log("clicou aqui")

        addMessage('user', messageText);
        socket.emit('enviar_mensagem', { mensagem: messageText });
        
        chatInput.value = '';
        chatInput.focus();
        showTypingIndicator(true);
    }

    function connectToServer() {
        if (socket && socket.connected) {
             return; // Já está conectado
        }
        if (socket) {
            socket.disconnect();
        }
        
        socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Conectado ao servidor de chat!');
            chatInput.disabled = false;
            sendButton.disabled = false;
            chatInput.placeholder = "Digite sua mensagem...";
        });

        socket.on('disconnect', () => {
            console.log('Desconectado do servidor.');
            chatInput.disabled = true;
            sendButton.disabled = true;
            chatInput.placeholder = "Desconectado. Recarregue a página.";
            showTypingIndicator(false);
        });

        socket.on('connect_error', (error) => {
            console.error('Erro de conexão:', error);
            showTypingIndicator(false);
            addMessage('bot', 'Erro ao conectar com o servidor');
        });

        socket.on('nova_mensagem', (data) => {
            showTypingIndicator(false);
            if (data.texto) {
                addMessage('bot', data.texto);
            }
        });

        socket.on('erro', (data) => {
            console.error('Erro do servidor:', data);
            showTypingIndicator(false);
            addMessage('bot', 'Desculpe, ocorreu um erro. Tente novamente.');
        });
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    const chatForm = document.querySelector('#tela-chat .bg-white\\/20');
    if (chatForm) {
        chatForm.parentElement.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    // Conectar quando acessar a tela de chat
    const chatLink = document.querySelector('[data-page="chat"]');
    if (chatLink) {
        chatLink.addEventListener('click', () => {
            // Um pequeno delay para garantir que a tela de chat já está visível
            setTimeout(connectToServer, 100); 
        });
    }
});