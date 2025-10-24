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

// ---> MOVA ESTA FUNÇÃO PARA FORA DO DOMContentLoaded <---
function connectToChat() {
    if (!currentUser.id) {
        console.warn("Tentativa de conectar ao chat sem usuário logado.");
        // Opcional: Adicionar mensagem na UI do chat
        // addMessage('bot', 'Você precisa estar logado para usar o chat.');
        return; // Não conecta se não estiver logado
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
        showTypingIndicator(false); // Esconde indicador de digitação
        // Tentar reconectar automaticamente pode causar loops se o servidor cair
        // socket.connect(); // Descomente se quiser tentar reconectar
    });

    socket.on('connect_error', (error) => {
        console.error('Erro de conexão com socket:', error);
        showTypingIndicator(false);
        addMessage('bot', 'Erro ao conectar com o servidor de chat.');
        if(document.getElementById('chat-input')) document.getElementById('chat-input').disabled = true;
        if(document.getElementById('chat-send-btn')) document.getElementById('chat-send-btn').disabled = true;
        if(document.getElementById('chat-input')) document.getElementById('chat-input').placeholder = "Erro de conexão.";
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
        addMessage('bot', data.erro || 'Desculpe, ocorreu um erro no servidor. Tente novamente.');
    });

     socket.on('status_conexao', (data) => { // Opcional: para confirmar a conexão
        console.log("Status do servidor:", data.data);
    });
}
// ---> FIM DA FUNÇÃO MOVIDA <---

function showTela(page) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa', 'fade-in'));
    const telaNova = document.getElementById('tela-' + page);

    if (telaNova) {
        telaNova.classList.add('ativa', 'fade-in');
    }
    if (page === 'perfil') {
        updateProfileDisplay();
    }
     // ---> CORREÇÃO AQUI: Chama a função global <---
    if (page === 'chat') {
        // Adiciona um pequeno delay para garantir que a UI do chat está visível
        setTimeout(connectToChat, 50);
    } else {
         // Desconecta o socket se sair da tela de chat para economizar recursos
        // if (socket && socket.connected) {
        //    console.log("Saindo da tela de chat, desconectando socket.");
        //    socket.disconnect();
        // }
         // Comentar a linha acima se preferir manter conectado
    }
    // ---> FIM DA CORREÇÃO <---
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

// Funções de Edição de Perfil
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

// --- Funções Auxiliares ---
function stripMarkdown(text) {
    if (!text) return '';
    // Remove ```json, ```, **, *, #, >, etc.
    let cleaned = text.replace(/```(json)?\s*/g, '').replace(/```\s*$/g, '');
    cleaned = cleaned.replace(/(\*\*|__)(.*?)\1/g, '$2'); // Negrito
    cleaned = cleaned.replace(/(\*|_)(.*?)\1/g, '$2');   // Itálico
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');      // Títulos
    cleaned = cleaned.replace(/^>\s+/gm, '');           // Citação
    cleaned = cleaned.replace(/^[-*+]\s+/gm, '');       // Listas
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1');      // Código inline
    return cleaned.trim();
}


// --- Lógica Principal da Página ---

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus(); // Verifica o login assim que a página carrega

    // Configurações iniciais de UI
    if(document.getElementById('sidebar')) document.getElementById('sidebar').classList.add('sidebar-visible');
    if(document.getElementById('topbar')) document.getElementById('topbar').classList.add('topbar-visible');
    if(document.getElementById('mainContent')) document.getElementById('mainContent').classList.add('ml-64');

    const initialSidebarLink = document.querySelector('#sidebar a[data-sidebar="inicio"]');
    if (initialSidebarLink) {
        activateSidebarLink(initialSidebarLink);
    }
     // Não temos link de 'inicio' na topbar premium, então não precisamos ativar
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
             // Chama a rota /auth/editar_usuario (centralizada)
            const response = await fetch(`${API_BASE_URL}/auth/editar_usuario/${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
                 credentials: 'include' // Envia cookies
            });
            const data = await response.json();
            if (response.ok) {
                alert(data.message);
                // Atualiza dados locais e na sessionStorage
                currentUser.nome = novoNome;
                currentUser.email = novoEmail;
                currentUser.fotoUrl = updateData.url_foto; // Usa o valor enviado

                const sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));
                sessionUser.nome = novoNome;
                sessionUser.email = novoEmail;
                sessionUser.url_foto = updateData.url_foto;
                sessionStorage.setItem('currentUser', JSON.stringify(sessionUser));

                updateProfileDisplay();
                 // Atualiza a imagem no topbar também
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

    // Preview da foto no modal de edição
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
            // Chama a rota /premium/resumo
            const response = await fetch(`${API_BASE_URL}/premium/resumo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tema, id_aluno: currentUser.id }),
                 credentials: 'include'
            });

             const data = await response.json();

            // Verifica explicitamente se a resposta foi OK ANTES de ler o JSON
            if (!response.ok) {
                // Tenta ler a mensagem de erro do backend
                throw new Error(data.error || data.erro || `Erro ${response.status}`);
            }

            // Processa a resposta SÓ SE response.ok for true
            if (data.conteudo) { // Verifica se 'conteudo' existe
                 document.getElementById('resumoTitulo').textContent = `Resumo sobre: ${stripMarkdown(data.assunto || tema)}`; // Usa data.assunto se existir
                 document.getElementById('resumoConteudo').innerHTML = stripMarkdown(data.conteudo).replace(/\n/g, '<br>'); // Usa data.conteudo
                 document.getElementById('resumoOutput').classList.remove('hidden');
            } else if (data.contedo) { // Fallback para typo 'contedo'
                 console.warn("Backend retornou 'contedo' em vez de 'conteudo' para resumo.");
                 document.getElementById('resumoTitulo').textContent = `Resumo sobre: ${stripMarkdown(data.assunto || tema)}`;
                 document.getElementById('resumoConteudo').innerHTML = stripMarkdown(data.contedo).replace(/\n/g, '<br>');
                 document.getElementById('resumoOutput').classList.remove('hidden');
            }
             else {
                 throw new Error("Resposta da API de resumo está incompleta.");
            }

        } catch (error) {
            console.error('Erro API de resumo:', error);
            alert(`Erro ao gerar resumo: ${error.message}. Verifique o console.`);
            // Limpa output em caso de erro
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
            // Chama a rota /premium/correcao
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

            if (data.correcao) { // Verifica se 'correcao' existe
                document.getElementById('correcaoConteudo').innerHTML = stripMarkdown(data.correcao).replace(/\n/g, '<br>');
                document.getElementById('correcaoOutput').classList.remove('hidden');
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
        container.innerHTML = ''; // Limpa antes

        try {
            // Chama a rota /premium/flashcard
            const response = await fetch(`${API_BASE_URL}/premium/flashcard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                 credentials: 'include'
            });

             const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.erro || `Erro ${response.status}`);
            }

            // A API premium retorna um objeto com 'contedo' (com typo)
             if (!data.contedo) {
                  throw new Error("Resposta da API de flashcards está incompleta ou vazia.");
             }

            const flashcardRawText = data.contedo;
            // O conteúdo é um texto, precisamos parseá-lo
            // Assume formato "Pergunta: [texto]\nResposta: [texto]" repetido
            const flashcardPairs = flashcardRawText.split(/Pergunta:/).filter(text => text.trim() !== '');

             if (flashcardPairs.length === 0) {
                 throw new Error("Não foi possível encontrar perguntas e respostas no texto retornado pela IA.");
             }

            flashcardPairs.forEach(pairText => {
                const parts = pairText.split(/Resposta:/);
                if (parts.length >= 2) {
                    const pergunta = stripMarkdown(parts[0].trim());
                    const resposta = stripMarkdown(parts[1].trim());

                    if (pergunta && resposta) { // Garante que ambos foram extraídos
                        const div = document.createElement('div');
                        div.className = 'flashcard w-full sm:w-80 h-48'; // Use as classes do style.css
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
                    } else {
                         console.warn("Não foi possível extrair pergunta/resposta válida de:", pairText);
                    }
                } else {
                     console.warn("Formato inválido encontrado no texto do flashcard:", pairText);
                }
            });

             if (container.children.length === 0) {
                 // Se após o loop nenhum flashcard foi adicionado
                 alert("A IA retornou um texto, mas não foi possível formatá-lo como flashcards. Verifique o console.");
             }

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
        popup.classList.remove("show");

        try {
            // Chama a rota /premium/quiz
            const response = await fetch(`${API_BASE_URL}/premium/quiz`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                 credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                 throw new Error(data.error || data.erro || `Erro ${response.status}`);
            }

            // O conteúdo ('contedo' com typo) é uma string JSON que precisa ser parseada
            if (!data.contedo) {
                 throw new Error("Resposta da API de quiz está incompleta ou vazia.");
            }

            let quizJson = [];
            try {
                // Limpa possíveis marcações de código antes de parsear
                let textoLimpo = data.contedo.trim()
                                    .replace(/^```(json)?\s*/i, "") // Início com ou sem 'json'
                                    .replace(/\s*```\s*$/i, "");    // Fim
                quizJson = JSON.parse(textoLimpo);
            } catch (e) {
                console.error("Erro ao parsear JSON da IA para o Quiz:", e, "\nTexto recebido:", data.contedo);
                throw new Error("A IA retornou um formato de quiz inválido. Tente gerar novamente.");
            }

             // Validação básica do JSON parseado
             if (!Array.isArray(quizJson) || quizJson.length === 0) {
                 throw new Error("O formato do quiz recebido não é um array válido ou está vazio.");
             }


            let totalQuestoes = quizJson.length;
            let respostasCorretas = 0;
            let respondidas = 0;
            const scoreDisplay = document.getElementById("quizScore");

            quizJson.forEach((questao, index) => {
                 // Valida se a questão tem os campos mínimos necessários
                 if (!questao.pergunta || !questao.opcoes || !Array.isArray(questao.opcoes) || questao.opcoes.length < 2 || !questao.resposta_correta) {
                     console.warn(`Questão ${index + 1} inválida ou incompleta:`, questao);
                     totalQuestoes--; // Reduz o total de questões válidas
                     return; // Pula esta questão
                 }

                const card = document.createElement("div");
                card.className = "mb-6 p-4 bg-white rounded-lg shadow w-full card";
                card.innerHTML = `<p class="quiz-question-number">Pergunta ${index + 1}</p><p class="font-semibold text-lg mb-3">${stripMarkdown(questao.pergunta)}</p>`; // Limpa markdown da pergunta

                const opcoesContainer = document.createElement("div");
                opcoesContainer.className = "space-y-2";

                const opcoes = questao.opcoes;
                // A resposta correta agora é o TEXTO da opção correta
                const respostaCorretaTexto = questao.resposta_correta;

                opcoes.forEach((opcaoTextoOriginal) => {
                     const opcaoTextoLimpo = stripMarkdown(opcaoTextoOriginal); // Limpa markdown das opções
                    const opcaoBtn = document.createElement("button");
                    opcaoBtn.className = "quiz-option w-full text-left p-3 border rounded-lg hover:bg-gray-100 transition";
                    opcaoBtn.textContent = opcaoTextoLimpo; // Usa texto limpo

                    opcaoBtn.addEventListener("click", () => {
                        if (card.classList.contains("card-respondida")) return;
                        card.classList.add("card-respondida");
                        respondidas++;

                         // Compara o TEXTO do botão com o TEXTO da resposta correta
                        if (opcaoBtn.textContent === stripMarkdown(respostaCorretaTexto)) {
                            respostasCorretas++;
                            opcaoBtn.classList.add("correct-answer");
                        } else {
                            opcaoBtn.classList.add("wrong-answer");
                            // Encontra o botão correto comparando TEXTOS
                            const corretaBtn = Array.from(opcoesContainer.children).find(btn => btn.textContent === stripMarkdown(respostaCorretaTexto));
                            if(corretaBtn) corretaBtn.classList.add("correct-answer");
                        }

                        opcoesContainer.querySelectorAll("button").forEach(b => b.disabled = true);

                        const explanationDiv = card.querySelector('.quiz-explanation');
                        if (explanationDiv) explanationDiv.classList.remove('hidden');

                        if (respondidas === totalQuestoes) { // Usa total de questões válidas
                             scoreDisplay.textContent = `Você acertou ${respostasCorretas} de ${totalQuestoes} perguntas!`;
                            popup.classList.add("show");
                        }
                    });
                    opcoesContainer.appendChild(opcaoBtn);
                });

                card.appendChild(opcoesContainer);

                 // Adiciona explicação se existir
                if(questao.explicacao){
                    const explanationDiv = document.createElement('div');
                    explanationDiv.className = 'quiz-explanation hidden'; // Começa escondida
                    // Limpa markdown da explicação também
                    explanationDiv.innerHTML = `<strong>Explicação:</strong> ${stripMarkdown(questao.explicacao)}`;
                    card.appendChild(explanationDiv);
                }
                output.appendChild(card);
            });
            output.classList.remove("hidden");

             if (totalQuestoes === 0 && quizJson.length > 0) {
                 // Se todas as questões foram inválidas
                 alert("O quiz foi gerado, mas nenhuma questão estava no formato esperado.");
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
        output.innerHTML = "";
        output.classList.add("hidden");
        popup.classList.remove("show");
         // Opcional: Limpar o input do tema
         // document.getElementById('quizInput').value = '';
    });


    // --- LÓGICA DO CHATBOT ---
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('chat-send-btn');
    const typingIndicator = document.getElementById('typing-indicator');

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
        if (!typingIndicator) return;
        typingIndicator.style.display = show ? 'flex' : 'none'; // Usa flex para alinhar pontos
        if (show) {
             // Garante que o indicador seja visível
            setTimeout(() => {
                if(chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 50);
        }
    }


    function sendMessage() {
         if (!chatInput || !sendButton) return; // Verifica se elementos existem

        const messageText = chatInput.value.trim();
         // Verifica se está conectado *antes* de tentar enviar
        if (messageText === '' || !socket || !socket.connected) {
             console.warn("Não conectado ou mensagem vazia. Não enviando.");
            if (!socket || !socket.connected) {
                 addMessage('bot', "Não conectado ao chat. Tentando reconectar...");
                 connectToChat(); // Tenta reconectar
            }
            return;
        }

        addMessage('user', messageText); // Mostra a mensagem do usuário
        socket.emit('enviar_mensagem', { mensagem: messageText }); // Envia para o servidor

        chatInput.value = ''; // Limpa o input
        chatInput.style.height = 'auto'; // Reset altura do textarea
        chatInput.focus(); // Foca no input
        showTypingIndicator(true); // Mostra "digitando"
    }


    // Event listeners do Chat
    if (sendButton) sendButton.addEventListener('click', sendMessage);

    if (chatInput) chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) { // Envia com Enter (sem Shift)
            event.preventDefault(); // Impede nova linha no textarea
            sendMessage();
        }
    });

    // Auto-resize do textarea do chat
     if (chatInput) chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto'; // Reseta altura
        // Define nova altura baseada no scrollHeight, limitado a max-height
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

}); 