// URL da sua API refatorada (porta 5002)
const API_BASE_URL = 'http://127.0.0.1:5002';

// Objeto para guardar informações do usuário logado
let currentUser = {
    id: null,
    nome: 'Visitante',
    plano: 'freemium',
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

    // Se for premium, redireciona para a página premium
    if (currentUser.plano === 'premium') {
        window.location.href = 'premium.html';
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
        imgPreview.src = e.target.value || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    });

    // --- Lógica de Flashcards (Freemium) ---
    document.getElementById('gerarFlashcardsBtn').addEventListener('click', async () => {
        const payload = {
            id_aluno: currentUser.id,
            category: document.getElementById('flashcardCategory').value
        };
        
        const btn = document.getElementById('gerarFlashcardsBtn');
        btn.disabled = true;
        btn.textContent = "Gerando...";
        
        try {
            // Chama a rota /freemium/flashcard
            const response = await fetch(`${API_BASE_URL}/freemium/flashcard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            const container = document.getElementById('flashcardsContainer');
            container.innerHTML = '';

            if (response.ok) {
                data.forEach(fc => {
                    const div = document.createElement('div');
                    div.className = 'flashcard w-full sm:w-80 h-48'; // Usando classes do style.css
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

    // --- Lógica do Quiz (Freemium) ---
    document.getElementById("gerarQuizBtn").addEventListener("click", async () => {
        const payload = {
            id_aluno: currentUser.id,
            category: document.getElementById('quizCategory').value
        };

        const btn = document.getElementById("gerarQuizBtn");
        btn.disabled = true;
        btn.textContent = "Gerando...";

        const output = document.getElementById("quizOutput");
        const popup = document.getElementById("quizPopup");
        output.innerHTML = "";
        output.classList.add("hidden");
        popup.classList.remove("show");

        try {
            // Chama a rota /freemium/quiz
            const response = await fetch(`${API_BASE_URL}/freemium/quiz`, {
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
    
    // Botão de reiniciar o quiz no popup
    document.getElementById("restartQuizBtn").addEventListener("click", () => {
        document.getElementById("quizOutput").innerHTML = "";
        document.getElementById("quizOutput").classList.add("hidden");
        document.getElementById("quizPopup").classList.remove("show");
    });
});