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

// --- FIM DA VERSÃO MOCK ---
// --- INÍCIO DA VERSÃO REAL ---

const API_BASE_URL = 'http://127.0.0.1:5000'; // URL do backend

let chartPlano = null;
let chartQuizzes = null;

// --- Estado dos Filtros ---
let currentSearch = '';
let currentPlano = '';
let debounceTimer;

// --- Verificação de Sessão (Real) ---
document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession(); // Verifica se o admin logou
    
    document.getElementById('adminLogoutBtn').addEventListener('click', handleLogout);

    setupMenuLinks();
    setupModalButtons();
    setupFilters();
});

async function checkAdminSession() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/check_session`, {
            credentials: 'include' // Essencial para enviar cookies de sessão
        });

        if (!response.ok) {
            // Se não estiver logado, redireciona
            throw new Error('Sessão de admin inválida.');
        }

        const data = await response.json();
        document.getElementById('adminName').textContent = data.admin.nome;
        
        // Se logado, carrega os dados
        loadDashboardData();
        loadAlunosTable();

    } catch (error) {
        showNotification("Você não está logado como admin. Redirecionando...", 'error');
        setTimeout(() => {
            window.location.href = 'login.html'; 
        }, 1500);
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/admin/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
    } finally {
        // Sempre redireciona, mesmo se o backend falhar
        sessionStorage.removeItem('currentAdmin'); // Limpa o storage local (backup)
        window.location.href = 'login.html'; 
    }
}

// --- Navegação das Telas ---
function setupMenuLinks() {
    document.querySelectorAll('.admin-menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1); // Remove o '#'
            
            // Troca de tela
            document.querySelectorAll('.admin-tela').forEach(tela => {
                tela.classList.toggle('hidden', tela.id !== `tela-${targetId}`);
            });

            // Troca de link ativo
            document.querySelectorAll('.admin-menu-link').forEach(l => l.classList.remove('bg-purple-900'));
            link.classList.add('bg-purple-900');
        });
    });
}

// --- Carregamento de Dados (Real) ---
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Falha ao carregar estatísticas.');

        const data = await response.json();

        // Preenche os cards
        document.getElementById('statTotalAlunos').textContent = data.total_alunos;
        document.getElementById('statMediaGeral').textContent = data.media_geral_acertos;
        document.getElementById('statMediaFilosofia').textContent = data.media_filosofia;
        document.getElementById('statMediaSociologia').textContent = data.media_sociologia;

        // Gráfico 1: Alunos por Plano
        const planoLabels = data.alunos_por_plano.map(p => p.plano);
        const planoData = data.alunos_por_plano.map(p => p.count);
        renderChartPlanos(planoLabels, planoData);

        // Gráfico 2: Quizzes por Dia
        renderChartQuizzes(data.quizzes_por_dia.labels, data.quizzes_por_dia.data);

    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadAlunosTable() {
    const tabelaBody = document.getElementById('tabelaAlunosBody');
    tabelaBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-500">Carregando alunos...</td></tr>`;

    // Constrói a URL com os parâmetros de filtro
    const url = new URL(`${API_BASE_URL}/admin/alunos`);
    if (currentSearch) {
        url.searchParams.append('search', currentSearch);
    }
    if (currentPlano) {
        url.searchParams.append('plano', currentPlano);
    }

    try {
        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error('Falha ao carregar lista de alunos.');

        const alunos = await response.json();
        tabelaBody.innerHTML = ''; // Limpa a tabela

        if (alunos.length === 0) {
            tabelaBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-500">Nenhum aluno encontrado.</td></tr>`;
            return;
        }

        alunos.forEach(aluno => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-100';
            
            // Formata as médias
            const mediaFilo = aluno.media_filosofia ? (aluno.media_filosofia * 100).toFixed(0) + '%' : 'N/A';
            const mediaSocio = aluno.media_sociologia ? (aluno.media_sociologia * 100).toFixed(0) + '%' : 'N/A';
            const mediaGeral = aluno.media_geral ? (aluno.media_geral * 100).toFixed(0) + '%' : 'N/A';

            tr.innerHTML = `
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <img src="${aluno.url_foto || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" alt="Foto" class="w-10 h-10 rounded-full object-cover">
                        <div>
                            <p class="font-semibold text-gray-800">${aluno.nome}</p>
                            <span class="text-xs text-gray-500">ID: ${aluno.id_aluno}</span>
                        </div>
                    </div>
                </td>
                <td class="p-4 text-gray-700">${aluno.email}</td>
                <td class="p-4">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${aluno.plano === 'premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}">
                        ${aluno.plano}
                    </span>
                </td>
                <td class="p-4 text-gray-700 font-medium">${mediaFilo}</td>
                <td class="p-4 text-gray-700 font-medium">${mediaSocio}</td>
                <td class="p-4 text-gray-700 font-bold">${mediaGeral}</td>
                
                <td class="p-4 text-gray-700">
                    <button class="text-blue-500 hover:text-blue-700 p-1" data-action="resultados" data-id="${aluno.id_aluno}" data-nome="${aluno.nome}">
                        <span class="material-icons text-lg">bar_chart</span>
                    </button>
                    <button class="text-purple-500 hover:text-purple-700 p-1" data-action="editar" data-id="${aluno.id_aluno}">
                        <span class="material-icons text-lg">edit</span>
                    </button>
                    <button class="text-red-500 hover:text-red-700 p-1" data-action="excluir" data-id="${aluno.id_aluno}">
                        <span class="material-icons text-lg">delete</span>
                    </button>
                </td>
            `;
            // Adiciona listeners para os botões de ação
            tr.querySelector('[data-action="editar"]').addEventListener('click', () => openModalEdit(aluno));
            tr.querySelector('[data-action="excluir"]').addEventListener('click', () => handleExcluirAluno(aluno.id_aluno));
            tr.querySelector('[data-action="resultados"]').addEventListener('click', () => openModalResultados(aluno.id_aluno, aluno.nome));
            
            tabelaBody.appendChild(tr);
        });
    } catch (error) {
        showNotification(error.message, 'error');
        tabelaBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-red-500">Erro ao carregar alunos.</td></tr>`;
    }
}

// --- Lógica dos Filtros ---
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterPlano = document.getElementById('filterPlano');

    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        // Debounce: espera 300ms após o usuário parar de digitar
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            loadAlunosTable();
        }, 300);
    });

    filterPlano.addEventListener('change', (e) => {
        currentPlano = e.target.value;
        loadAlunosTable();
    });
}

// --- Lógica dos Modais (Real) ---

function setupModalButtons() {
    const modal = document.getElementById('modalAluno');
    const btnNovo = document.getElementById('btnNovoAluno');
    const btnFechar = document.getElementById('fecharModalAluno');
    const btnSalvar = document.getElementById('salvarAlunoBtn');

    btnNovo.addEventListener('click', openModalNew);
    btnFechar.addEventListener('click', () => modal.classList.add('hidden'));
    btnSalvar.addEventListener('click', handleSalvarAluno);
    
    // Modal de Resultados
    document.getElementById('fecharModalResultados').addEventListener('click', () => {
        document.getElementById('modalResultados').classList.add('hidden');
    });
}

function openModalNew() {
    document.getElementById('modalAlunoTitulo').textContent = 'Novo Aluno';
    document.getElementById('alunoId').value = '';
    document.getElementById('alunoNome').value = '';
    document.getElementById('alunoEmail').value = '';
    document.getElementById('alunoPlano').value = 'freemium';
    document.getElementById('alunoSenha').value = ''; // Limpa o campo senha
    document.getElementById('alunoSenha').placeholder = 'Senha (obrigatório)';
    document.getElementById('modalAluno').classList.remove('hidden');
}

function openModalEdit(aluno) {
    document.getElementById('modalAlunoTitulo').textContent = 'Editar Aluno';
    document.getElementById('alunoId').value = aluno.id_aluno;
    document.getElementById('alunoNome').value = aluno.nome;
    document.getElementById('alunoEmail').value = aluno.email;
    document.getElementById('alunoPlano').value = aluno.plano;
    document.getElementById('alunoSenha').value = ''; // Limpa o campo senha
    document.getElementById('alunoSenha').placeholder = 'Deixe em branco para não alterar';
    document.getElementById('modalAluno').classList.remove('hidden');
}

async function handleSalvarAluno() {
    const id = document.getElementById('alunoId').value;
    const nome = document.getElementById('alunoNome').value;
    const email = document.getElementById('alunoEmail').value;
    const plano = document.getElementById('alunoPlano').value;
    const senha = document.getElementById('alunoSenha').value;

    const modal = document.getElementById('modalAluno');
    const btnSalvar = document.getElementById('salvarAlunoBtn');
    
    // Define a URL e o método (Criar ou Atualizar)
    const isEditing = !!id;
    const url = isEditing ? `${API_BASE_URL}/admin/alunos/${id}` : `${API_BASE_URL}/admin/alunos`;
    const method = isEditing ? 'PUT' : 'POST';

    // Monta o body
    let body = { nome, email, plano };
    if (senha) { // Só inclui a senha se ela for preenchida
        body.senha = senha;
    }
    if (!isEditing && !senha) {
        showNotification('Senha é obrigatória para criar um novo aluno.', 'error');
        return;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = "Salvando...";

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao salvar aluno.');
        }

        showNotification(data.message, 'success');
        modal.classList.add('hidden');
        loadAlunosTable(); // Recarrega a tabela

    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = "Salvar";
    }
}

async function handleExcluirAluno(id) {
    if (!confirm(`Você tem certeza que deseja excluir o aluno ID ${id}? Esta ação não pode ser desfeita.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/alunos/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao excluir aluno.');
        }
        
        showNotification(data.message, 'success');
        loadAlunosTable(); // Recarrega a tabela

    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function openModalResultados(id, nome) {
    const modal = document.getElementById('modalResultados');
    const titulo = document.getElementById('modalResultadosTitulo');
    const container = document.getElementById('listaResultadosContainer');
    
    titulo.textContent = `Resultados de: ${nome}`;
    container.innerHTML = '<p class="text-gray-500 text-center">Carregando resultados...</p>';
    modal.classList.remove('hidden');

    try {
        const response = await fetch(`${API_BASE_URL}/admin/alunos/${id}/resultados`, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Falha ao carregar resultados.');

        const resultados = await response.json();
        
        if (resultados.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center">Nenhum resultado de quiz encontrado para este aluno.</p>';
            return;
        }

        container.innerHTML = ''; // Limpa o "Carregando..."
        resultados.forEach(res => {
            const dataFormatada = new Date(res.data_criacao).toLocaleString('pt-BR');
            const perc = (res.acertos / res.total_perguntas) * 100;
            
            const div = document.createElement('div');
            div.className = 'p-4 border-b border-gray-200';
            div.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold text-purple-700">${res.tema}</span>
                    <span class="font-bold text-lg ${perc >= 70 ? 'text-green-600' : 'text-red-500'}">
                        ${perc.toFixed(0)}%
                    </span>
                </div>
                <div class="flex justify-between items-center text-sm text-gray-500">
                    <span>${res.acertos} de ${res.total_perguntas} corretas</span>
                    <span>${dataFormatada}</span>
                </div>
            `;
            container.appendChild(div);
        });

    } catch (error) {
        container.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
        showNotification(error.message, 'error');
    }
}


// --- Funções dos Gráficos (Chart.js) ---

function renderChartPlanos(labels, data) {
    const ctx = document.getElementById('chartAlunosPlano').getContext('2d');
    if (chartPlano) {
        chartPlano.destroy(); // Destrói gráfico anterior para recriar
    }
    chartPlano = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Alunos por Plano',
                data: data,
                backgroundColor: [
                    'rgba(234, 179, 8, 0.7)', // Yellow (para premium)
                    'rgba(59, 130, 246, 0.7)', // Blue (para freemium)
                    'rgba(168, 85, 247, 0.7)' // Purple (fallback)
                ],
                borderColor: [
                    'rgba(234, 179, 8, 1)',
                    'rgba(59, 130, 246, 1)',
                    'rgba(168, 85, 247, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'top' } }
        }
    });
}

function renderChartQuizzes(labels, data) {
    const ctx = document.getElementById('chartQuizzesDia').getContext('2d');
     if (chartQuizzes) {
        chartQuizzes.destroy();
    }
    chartQuizzes = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels, // ['Dia 1', 'Dia 2', ...]
            datasets: [{
                label: 'Quizzes Realizados',
                data: data, // [5, 10, 3, ...]
                fill: true,
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: 'rgba(139, 92, 246, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}