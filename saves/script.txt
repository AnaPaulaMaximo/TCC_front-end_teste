const API_BASE_URL = 'http://127.0.0.1:5000'; // URL base do seu backend Flask

let isLoggedIn = false; // Variável global para o estado de login
let currentUser = { // Dados mockados do usuário
    id: null, // Mudança para null inicialmente
    nome: '',
    email: '',
    senha: '',
    fotoUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' // URL de foto padrão
};

// Função para remover caracteres Markdown
function stripMarkdown(text) {
    if (!text) return '';
    let cleanedText = text;

    // Remover títulos (###, ##, #)
    cleanedText = cleanedText.replace(/^#{1,6}\s*(.*)$/gm, '$1');
    // Remover negrito (**, __)
    cleanedText = cleanedText.replace(/\*\*(.*?)\*\*/g, '$1');
    cleanedText = cleanedText.replace(/__(.*?)__/g, '$1');
    // Remover itálico (*, _)
    cleanedText = cleanedText.replace(/\*(.*?)\*/g, '$1');
    cleanedText = cleanedText.replace(/_(.*?)_/g, '$1');
    // Remover links Markdown ([texto](url)) - mantém apenas o texto
    cleanedText = cleanedText.replace(/\[(.*?)\]\(.*?\)/g, '$1');
    // Remover listas (- , *, +)
    cleanedText = cleanedText.replace(/^[-\*\+]\s*/gm, '');
    // Remover blocos de código (```)
    cleanedText = cleanedText.replace(/```[\s\S]*?```/g, '');
    // Remover blocos de citação (>)
    cleanedText = cleanedText.replace(/^>\s*/gm, '');
    // Substituir quebras de linha múltiplas por uma única
    cleanedText = cleanedText.replace(/\n\s*\n/g, '\n\n');
    // Remover espaços em branco no início/fim de cada linha
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

function moveMenuUnderline(target) {
    const underline = document.getElementById('menuUnderline');
    const menuBar = document.getElementById('menuBar');
    if (!underline || !menuBar || !target) {
        underline.style.width = `0px`; // Esconde o underline
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

function showTela(page) {
    const telaNova = document.getElementById('tela-' + page);
    const telaAtual = document.querySelector('.tela.ativa');

    if (telaAtual === telaNova) return;

    if (telaAtual) {
        telaAtual.classList.remove('fade-in');
        telaAtual.classList.add('fade-out');
        setTimeout(() => {
            telaAtual.classList.remove('ativa', 'fade-out');
            telaAtual.style.display = 'none';
            telaNova.style.display = 'block';
            telaNova.classList.add('fade-in', 'ativa');
        }, 400);
    } else {
        telaNova.style.display = 'block';
        telaNova.classList.add('fade-in', 'ativa');
    }

    // Ao mostrar a tela de perfil, atualiza os dados (já existente)
    if (page === 'perfil') {
        updateProfileDisplay();
    }
}

// Sidebar highlight
function activateSidebarLink(target) {
    document.querySelectorAll('#sidebar a[data-sidebar]').forEach(link => {
        link.classList.remove('sidebar-link-active');
    });
    if (target) {
        target.classList.add('sidebar-link-active');
    }
}

// // Função para atualizar o botão de Login/Sair
// function updateAuthButton() {
//     const authBtn = document.getElementById('authBtn');
//     const authIcon = document.getElementById('authIcon');
//     const authText = document.getElementById('authText');

//     if (isLoggedIn) {
//         authBtn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
//         authBtn.classList.add('bg-red-600', 'hover:bg-red-700');
//         authIcon.textContent = 'logout';
//         authText.textContent = 'Sair';
//         authBtn.onclick = handleLogout;
//     } else {
//         authBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
//         authBtn.classList.add('bg-purple-600', 'hover:bg-purple-700'); // Ou qualquer outra cor para "Login"
//         authIcon.textContent = 'login';
//         authText.textContent = 'Login';
//         authBtn.onclick = abrirLogin;
//     }
// }

// // Função de Logout
// function handleLogout() {
//     isLoggedIn = false;
//     alert('Você foi desconectado!');
//     updateAuthButton();
//     // Volta para a tela de início
//     showTela('inicio');
//     activateSidebarLink(document.querySelector('#sidebar a[data-sidebar="inicio"]'));
//     activateMenuLink(document.querySelector('#menuBar .menu-link[data-page="inicio"]'));
//     // Limpar dados do usuário
//     currentUser = { id: null, nome: '', email: '', senha: '', fotoUrl: '[https://cdn-icons-png.flaticon.com/512/3135/3135715.png](https://cdn-icons-png.flaticon.com/512/3135/3135715.png)' };
//     updateProfileDisplay(); // Reseta a tela de perfil
// }

// Funções para Modais de Login e Criar Conta
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

// Funções para o NOVO Modal de Edição de Perfil
window.abrirEditarPerfil = function () {
    // Pré-preenche o campo de URL da foto e a pré-visualização
    document.getElementById('editFotoUrl').value = currentUser.fotoUrl || '';
    document.getElementById('editFotoPreview').src = currentUser.fotoUrl || '[https://cdn-icons-png.flaticon.com/512/3135/3135715.png](https://cdn-icons-png.flaticon.com/512/3135/3135715.png)';
    // Pré-preenche os outros campos
    document.getElementById('editNome').value = currentUser.nome;
    document.getElementById('editEmail').value = currentUser.email;
    document.getElementById('editSenha').value = ''; // Sempre limpa a senha no input de edição
    document.getElementById('modalEditarPerfil').classList.remove('hidden');
}
window.fecharEditarPerfil = function () {
    document.getElementById('modalEditarPerfil').classList.add('hidden');
}

// Função para atualizar as informações na tela de Perfil (já existia e será mantida)
function updateProfileDisplay() {
    document.getElementById('profileNome').textContent = currentUser.nome || 'Seu Nome';
    document.getElementById('profileEmail').textContent = currentUser.email || 'seuemail@email.com';
    document.getElementById('profileFoto').src = currentUser.fotoUrl || '[https://cdn-icons-png.flaticon.com/512/3135/3135715.png](https://cdn-icons-png.flaticon.com/512/3135/3135715.png)';
}


document.addEventListener('DOMContentLoaded', () => {
    // Inicialização da Sidebar e Topbar
    document.getElementById('sidebar').classList.add('sidebar-visible');
    document.getElementById('topbar').classList.add('topbar-visible');
    document.getElementById('mainContent').classList.add('ml-64');

    // Ativar link "Início" ao carregar a página
    const initialSidebarLink = document.querySelector('#sidebar a[data-sidebar="inicio"]');
    if (initialSidebarLink) {
        activateSidebarLink(initialSidebarLink);
    }
    const initialMenuLink = document.querySelector('#menuBar .menu-link[data-page="inicio"]');
    if (initialMenuLink) {
        activateMenuLink(initialMenuLink);
        showTela('inicio');
    }

    // // Atualiza o botão de autenticação ao carregar a página
    // updateAuthButton();

    // Event listeners para os links da Topbar
    document.querySelectorAll('#menuBar .menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activateMenuLink(link);
            // Desativa qualquer link ativo na sidebar
            activateSidebarLink(null);
            const page = link.getAttribute('data-page');
            showTela(page);
        });
    });

    // Event listeners para os links da Sidebar
    const sidebarLinks = document.querySelectorAll('#sidebar a[data-sidebar]');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault(); // Impede o comportamento padrão de link
            activateSidebarLink(this);
            // Desativa qualquer link ativo na topbar e remove o underline
            activateMenuLink(null);
            const page = this.getAttribute('data-sidebar');
            showTela(page);
        });
    });

    // Ajustar underline ao redimensionar
    window.addEventListener('resize', () => {
        const active = document.querySelector('#menuBar .menu-link.active');
        if (active) moveMenuUnderline(active);
    });

    // // Lógica para os botões de Login e Criar Conta (Modal)
    // document.getElementById('entrarBtn').addEventListener('click', async () => {
    //     const email = document.getElementById('loginEmail').value;
    //     const senha = document.getElementById('loginSenha').value;

    //     try {
    //         const response = await fetch(`${API_BASE_URL}/login`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ email, senha }),
    //         });
    //         const data = await response.json();
    //         if (response.ok) {
    //             alert(data.message);
    //             fecharLogin();
    //             isLoggedIn = true;
    //             updateAuthButton();
    //             // Carrega os dados do usuário após o login
    //             currentUser.id = data.id;
    //             currentUser.nome = data.nome;
    //             currentUser.email = data.email;
    //             currentUser.senha = senha; // Temporário, em produção não armazene a senha no frontend.
    //             currentUser.fotoUrl = data.foto_url || '[https://cdn-icons-png.flaticon.com/512/3135/3135715.png](https://cdn-icons-png.flaticon.com/512/3135/3135715.png)';
    //             updateProfileDisplay(); // Atualiza display de perfil
    //             showTela('inicio'); // Ou redireciona para um dashboard
    //             activateSidebarLink(document.querySelector('#sidebar a[data-sidebar="inicio"]'));
    //             activateMenuLink(document.querySelector('#menuBar .menu-link[data-page="inicio"]'));
    //         } else {
    //             alert(data.error || 'Erro ao fazer login. Verifique suas credenciais.');
    //         }
    //     } catch (error) {
    //         console.error('Erro ao conectar com a API de login:', error);
    //         alert('Erro ao conectar com o servidor. Tente novamente mais tarde.');
    //     }
    // });

    // document.getElementById('criarContaBtn').addEventListener('click', async () => {
    //     const nome = document.getElementById('cadastroNome').value;
    //     const email = document.getElementById('cadastroEmail').value;
    //     const senha = document.getElementById('cadastroSenha').value;
    //     const confirmarSenha = document.getElementById('cadastroConfirmarSenha').value;

    //     if (senha !== confirmarSenha) {
    //         alert('As senhas não coincidem!');
    //         return;
    //     }

    //     try {
    //         const response = await fetch(`${API_BASE_URL}/cadastrar_usuario`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({ nome, email, senha }),
    //         });
    //         const data = await response.json();
    //         if (response.ok) {
    //             alert(data.message);
    //             fecharCriarConta();
    //             abrirLogin(); // Opcional: Abrir modal de login automaticamente
    //         } else {
    //             alert(data.error || 'Erro ao criar conta.');
    //         }
    //     } catch (error) {
    //         console.error('Erro ao conectar com a API de cadastro:', error);
    //         alert('Erro ao conectar com o servidor. Tente novamente mais tarde.');
    //     }
    // });

    // // Lógica para o botão "Editar Perfil" no card de perfil
    // document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    //     abrirEditarPerfil();
    // });

    // // Lógica para o botão "Salvar Alterações" no modal de Editar Perfil
    // document.getElementById('salvarEdicaoBtn').addEventListener('click', async () => {
    //     const novoNome = document.getElementById('editNome').value;
    //     const novoEmail = document.getElementById('editEmail').value;
    //     const novaSenha = document.getElementById('editSenha').value; // Pode estar vazia
    //     const novaFotoUrl = document.getElementById('editFotoUrl').value; // <-- Obtém a nova URL da foto

    //     // Validação básica
    //     if (!novoNome || !novoEmail) {
    //         alert('Nome e E-mail não podem ser vazios.');
    //         return;
    //     }

    //     const updateData = {
    //         nome: novoNome,
    //         email: novoEmail,
    //         foto_url: novaFotoUrl // <-- Inclui a URL da foto no payload
    //     };
    //     if (novaSenha) { // Inclui a senha apenas se não estiver vazia
    //         updateData.senha = novaSenha;
    //     }

    //     try {
    //         if (!isLoggedIn || !currentUser.id) { // Garante que há um usuário logado
    //             alert('Nenhum usuário logado para editar.');
    //             return;
    //         }

    //         const response = await fetch(`${API_BASE_URL}/editar_usuario/${currentUser.id}`, {
    //             method: 'PUT',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(updateData),
    //         });
    //         const data = await response.json();
    //         if (response.ok) {
    //             alert(data.message);
    //             // Atualiza os dados locais do usuário
    //             currentUser.nome = novoNome;
    //             currentUser.email = novoEmail;
    //             currentUser.fotoUrl = novaFotoUrl; // <-- Atualiza a foto localmente
    //             if (novaSenha) {
    //                 currentUser.senha = novaSenha; // Atualiza a senha localmente
    //             }
    //             updateProfileDisplay(); // Atualiza a tela de perfil (se houver, já deve pegar do currentUser)
    //             fecharEditarPerfil();
    //         } else {
    //             alert(data.error || 'Erro ao salvar alterações.');
    //         }
    //     } catch (error) {
    //         console.error('Erro ao conectar com a API de edição:', error);
    //         alert('Erro ao conectar com o servidor para salvar alterações.');
    //     }
    // });

    // // Event listener para pré-visualizar a foto no modal de edição em tempo real
    // document.getElementById('editFotoUrl').addEventListener('input', (e) => {
    //     const imgPreview = document.getElementById('editFotoPreview');
    //     const url = e.target.value;
    //     // Tenta carregar a imagem para pré-visualização, caso contrário usa a padrão
    //     if (url) {
    //         imgPreview.src = url;
    //     } else {
    //         imgPreview.src = '[https://cdn-icons-png.flaticon.com/512/3135/3135715.png](https://cdn-icons-png.flaticon.com/512/3135/3135715.png)'; // Fallback
    //     }
    // });

    // --- Integração com o Backend para Ferramentas de Revisão ---

    // Gerar Resumo
    document.getElementById('gerarResumoBtn').addEventListener('click', async () => {
        const tema = document.getElementById('resumoInput').value;
        if (!tema) {
            alert('Por favor, digite um tema.');
            return;
        }
        // ⛔️ Desativa o botão durante a geração
        gerarResumoBtn.disabled = true;
        gerarResumoBtn.textContent = "Gerando...";

        try {
            const response = await fetch(`${API_BASE_URL}/resumo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tema })
            });
            const data = await response.json();
            if (response.ok) {
                document.getElementById('resumoTitulo').textContent = `Resumo sobre: ${stripMarkdown(data.assunto)}`;
                document.getElementById('resumoConteudo').innerHTML = stripMarkdown(data.contedo).replace(/\n/g, '<br>');
                document.getElementById('resumoOutput').classList.remove('hidden');
            } else {
                alert(data.error || 'Erro ao gerar resumo.');
            }
        } catch (error) {
            console.error('Erro ao conectar com a API de resumo:', error);
            alert('Erro ao conectar com o servidor para gerar resumo.');
        }
        finally {
        // ✅ Reativa o botão após o processo (sucesso ou erro)
        gerarResumoBtn.disabled = false;
        gerarResumoBtn.textContent = "Gerar Resumo";
    }
    });

    // Corrigir Texto
    document.getElementById('corrigirTextoBtn').addEventListener('click', async () => {
        const tema = document.getElementById('correcaoTemaInput').value;
        const texto = document.getElementById('correcaoTextoInput').value;
        if (!tema || !texto) {
            alert('Por favor, preencha o tema e o texto para correção.');
            return;
        }
        // ⛔️ Desativa o botão durante a geração
        corrigirTextoBtn.disabled = true;
        corrigirTextoBtn.textContent = "Gerando...";
        try {
            const response = await fetch(`${API_BASE_URL}/correcao`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tema, texto })
            });
            const data = await response.json();
            if (response.ok) {
                document.getElementById('correcaoConteudo').innerHTML = stripMarkdown(data.contedo).replace(/\n/g, '<br>');
                document.getElementById('correcaoOutput').classList.remove('hidden');
            } else {
                alert(data.error || 'Erro ao corrigir texto.');
            }
        } catch (error) {
            console.error('Erro ao conectar com a API de correção:', error);
            alert('Erro ao conectar com o servidor para correção.');
        }
        finally {
        // ✅ Reativa o botão após o processo (sucesso ou erro)
        corrigirTextoBtn.disabled = false;
        corrigirTextoBtn.textContent = "Gerar Resumo";
    }
    });

    // Gerar Flashcards
    document.getElementById('gerarFlashcardsBtn').addEventListener('click', async () => {
        const tema = document.getElementById('flashcardInput').value;
        if (!tema) {
            alert('Por favor, digite um tema');
            return;
        }
        // ⛔️ Desativa o botão durante a geração
        gerarFlashcardsBtn.disabled = true;
        gerarFlashcardsBtn.textContent = "Gerando...";
        try {
            const response = await fetch(`${API_BASE_URL}/flashcard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tema })
            });
            const data = await response.json();
            if (response.ok) {
                const flashcardsContainer = document.getElementById('flashcardsContainer');
                flashcardsContainer.innerHTML = ''; // Limpa flashcards anteriores

                // A resposta do backend para flashcard é um texto único com a estrutura
                // Pergunta: [pergunta] Resposta: [resposta] Explicação: [explicação]
                const flashcardTexts = data.contedo.split('Pergunta:').filter(text => text.trim() !== '');

                flashcardTexts.forEach(fcText => {
                    const parts = fcText.split('Resposta:');
                    if (parts.length > 1) {
                        const pergunta = stripMarkdown(parts[0].trim()); // Remove Markdown
                        const respostaExp = parts[1].split('Explicação:');
                        const resposta = stripMarkdown(respostaExp[0].trim()); // Remove Markdown
                        const explicacao = respostaExp.length > 1 ? stripMarkdown(respostaExp[1].trim()) : ''; // Remove Markdown

                        const flashcardDiv = document.createElement('div');
                        flashcardDiv.className = 'flashcard bg-white rounded-xl shadow-lg cursor-pointer perspective';
                        // Adiciona evento de click para virar
                        flashcardDiv.addEventListener('click', function () {
                            this.classList.toggle('flipped');
                        });
                        flashcardDiv.innerHTML = `
                            <div class="flashcard-inner">
                                <div class="flashcard-front">
                                    <span class="text-purple-800 text-lg font-semibold">${pergunta}</span>
                                </div>
                                <div class="flashcard-back">
                                    <div class="flex flex-col items-center p-4">
                                        <span class="text-pink-600 font-bold">${resposta}</span>
                                        <span class="text-gray-700 text-sm mt-2">${explicacao}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                        flashcardsContainer.appendChild(flashcardDiv);
                    }
                });
            } else {
                alert(data.error || 'Erro ao gerar flashcards.');
            }
        } catch (error) {
            console.error('Erro ao conectar com a API de flashcards:', error);
            alert('Erro ao conectar com o servidor para gerar flashcards.');
        }
        finally {
        // ✅ Reativa o botão após o processo (sucesso ou erro)
        gerarFlashcardsBtn.disabled = false;
        gerarFlashcardsBtn.textContent = "Gerar Resumo";
    }
    });


    //QUIZ
    let totalQuestoes = 0;
    let respostasCorretas = 0;
    let respondidas = 0;

    document.getElementById("gerarQuizBtn").addEventListener("click", async () => {
        const tema = document.getElementById("quizInput").value.trim();
        const output = document.getElementById("quizOutput");
        const popup = document.getElementById("quizPopup");
        const scoreDisplay = document.getElementById("quizScore");
        const restartBtn = document.getElementById("restartQuizBtn");
        const gerarQuizBtn = document.getElementById("gerarQuizBtn");

        if (!tema) {
            alert("Por favor, digite um tema para gerar o quiz.");
            return;
        }

        // Desativa botão enquanto carrega
        gerarQuizBtn.disabled = true;
        gerarQuizBtn.textContent = "Gerando...";

        output.innerHTML = "";
        output.classList.add("hidden");
        popup.classList.remove("show");
        respostasCorretas = 0;
        respondidas = 0;

        try {
            const response = await fetch("http://localhost:5000/quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tema }),
            });

            const data = await response.json();

            if (data.erro || !data.contedo) {
                throw new Error(data.erro || "Erro ao gerar quiz.");
            }

            let quizJson = [];
            try {
                let textoLimpo = data.contedo.trim();
                textoLimpo = textoLimpo
                    .replace(/^```(?:json)?/i, "")
                    .replace(/```$/, "")
                    .trim();
                textoLimpo = textoLimpo.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
                quizJson = JSON.parse(textoLimpo);
            } catch (e) {
                throw new Error("Erro ao interpretar o JSON gerado pela IA.");
            }

            totalQuestoes = quizJson.length;

            quizJson.forEach((questao, index) => {
                const card = document.createElement("div");
                card.className = "mb-6 p-4 bg-white rounded-lg shadow w-full card";

                const numero = document.createElement("p");
                numero.className = "quiz-question-number";
                numero.textContent = `Pergunta ${index + 1}`;
                card.appendChild(numero);

                const pergunta = document.createElement("p");
                pergunta.className = "font-semibold text-lg mb-3";
                pergunta.textContent = questao.pergunta;
                card.appendChild(pergunta);

                const opcoesContainer = document.createElement("div");
                opcoesContainer.className = "space-y-2";

                const letras = ["a", "b", "c", "d"];
                letras.forEach((letra, i) => {
                    const opcao = document.createElement("button");
                    opcao.className =
                        "quiz-option w-full text-left p-3 border rounded-lg hover:bg-gray-100 transition";
                    opcao.textContent = `(${letra}) ${questao.opcoes[i]}`;
                    opcao.dataset.letra = letra;
                    opcao.dataset.correta = questao.resposta_correta;

                    opcao.addEventListener("click", () => {
                        if (card.classList.contains("card-respondida")) return;

                        const botoes = opcoesContainer.querySelectorAll("button");
                        botoes.forEach((btn) => {
                            if (btn.dataset.letra === btn.dataset.correta) {
                                btn.classList.add("correct-answer");
                            } else {
                                btn.classList.add("wrong-answer");
                            }
                            btn.disabled = true;
                        });

                        card.classList.add("card-respondida");
                        respondidas++;

                        if (opcao.dataset.letra === opcao.dataset.correta) {
                            respostasCorretas++;
                        }

                        if (respondidas === totalQuestoes) {
                            scoreDisplay.textContent = `Você acertou ${respostasCorretas} de ${totalQuestoes} perguntas!`;
                            popup.classList.add("show");
                        }
                    });

                    opcoesContainer.appendChild(opcao);
                });

                card.appendChild(opcoesContainer);
                output.appendChild(card);
            });

            output.classList.remove("hidden");
            output.scrollIntoView({ behavior: "smooth" });

            // Recomeçar
            restartBtn.addEventListener("click", () => {
                document.getElementById("quizInput").value = "";
                output.innerHTML = "";
                output.classList.add("hidden");
                popup.classList.remove("show");
                gerarQuizBtn.disabled = false;
                gerarQuizBtn.textContent = "Gerar Quiz";
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        } catch (error) {
            alert("Erro ao gerar quiz: " + error.message);
            console.error(error);
            gerarQuizBtn.disabled = false;
            gerarQuizBtn.textContent = "Gerar Quiz";
        }
    });


});