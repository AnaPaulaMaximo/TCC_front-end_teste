// ATENÇÃO: Esta é uma versão "Mock" (de fachada) do admin.js
// Ela não se conecta ao backend e usa dados falsos para testes.

let chartPlano = null;
let chartQuizzes = null;

// --- Verificação de Sessão (Falsa) ---
document.addEventListener('DOMContentLoaded', () => {
    checkAdminSession(); // Verifica se o admin "logou"
    
    document.getElementById('adminLogoutBtn').addEventListener('click', handleLogout);

    setupMenuLinks();
    setupModalBottons();
    
    // Carrega dados falsos
    loadDashboardData();
    loadAlunosTable();
});

function checkAdminSession() {
    // Verifica se o 'currentAdmin' (falso) existe no sessionStorage
    const adminData = sessionStorage.getItem('currentAdmin');
    if (!adminData) {
        // Se não houver, chuta para a tela de login
        alert("Você não está logado como admin. Redirecionando...");
        window.location.href = 'login.html'; 
    } else {
        // Se houver, preenche o nome
        const admin = JSON.parse(adminData);
        document.getElementById('adminName').textContent = admin.nome;
    }
}

function handleLogout() {
    // Apenas limpa o sessionStorage e redireciona para o login
    sessionStorage.removeItem('currentAdmin');
    // alert("Logout (teste) realizado com sucesso!"); // <--- ALERTA REMOVIDO
    window.location.href = 'login.html'; 
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

// --- Carregamento de Dados (Falsos) ---
function loadDashboardData() {
    // Preenche os cards com dados falsos
    document.getElementById('statTotalAlunos').textContent = "15";
    document.getElementById('statMediaAcertos').textContent = "82%";

    // Gráfico 1: Alunos por Plano (Falso)
    const planoLabels = ['Premium', 'Freemium'];
    const planoData = [5, 10]; // 5 premium, 10 freemium
    renderChartPlanos(planoLabels, planoData);

    // Gráfico 2: Quizzes por Dia (Falso)
    const quizzesLabels = ['25/10', '26/10', '27/10', '28/10', '29/10', '30/10', '31/10'];
    const quizzesData = [3, 5, 2, 7, 4, 8, 6];
    renderChartQuizzes(quizzesLabels, quizzesData);
}

function loadAlunosTable() {
    // Dados Falsos de Alunos
    const alunos = [
        { id_aluno: 1, nome: "Ana Silva", email: "ana@email.com", plano: "premium", url_foto: null },
        { id_aluno: 2, nome: "Bruno Costa", email: "bruno@email.com", plano: "freemium", url_foto: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' },
        { id_aluno: 3, nome: "Carla Dias", email: "carla@email.com", plano: "premium", url_foto: null }
    ];

    const tabelaBody = document.getElementById('tabelaAlunosBody');
    tabelaBody.innerHTML = ''; // Limpa a tabela

    alunos.forEach(aluno => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-100';
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
}

// --- Lógica dos Modais (Falsa) ---

function setupModalBottons() {
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
    document.getElementById('alunoSenha').placeholder = 'Senha (obrigatório)';
    document.getElementById('modalAluno').classList.remove('hidden');
}

function openModalEdit(aluno) {
    document.getElementById('modalAlunoTitulo').textContent = 'Editar Aluno';
    document.getElementById('alunoId').value = aluno.id_aluno;
    document.getElementById('alunoNome').value = aluno.nome;
    document.getElementById('alunoEmail').value = aluno.email;
    document.getElementById('alunoPlano').value = aluno.plano;
    document.getElementById('alunoSenha').placeholder = 'Deixe em branco para não alterar';
    document.getElementById('modalAluno').classList.remove('hidden');
}

function handleSalvarAluno() {
    // Apenas fecha o modal e dá um alerta
    alert("Modo de Teste: Dados não foram salvos.");
    document.getElementById('modalAluno').classList.add('hidden');
    // Em um app real, aqui chamaria loadAlunosTable() após o fetch
}

function handleExcluirAluno(id) {
    if (confirm(`Modo de teste: Você confirma a exclusão do aluno ${id}?`)) {
        alert("Modo de Teste: Aluno não foi excluído.");
    }
}

function openModalResultados(id, nome) {
    const modal = document.getElementById('modalResultados');
    const titulo = document.getElementById('modalResultadosTitulo');
    const container = document.getElementById('listaResultadosContainer');
    
    titulo.textContent = `Resultados de: ${nome}`;
    
    // Dados Falsos de Resultados
    const resultados = [
        { tema: "Filosofia Grega", acertos: 8, total_perguntas: 10, data_criacao: new Date().toISOString() },
        { tema: "Sociologia Clássica", acertos: 5, total_perguntas: 10, data_criacao: new Date(Date.now() - 86400000).toISOString() } // Ontem
    ];
        
    if (resultados.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center">Nenhum resultado de quiz encontrado para este aluno.</p>';
        modal.classList.remove('hidden');
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

    modal.classList.remove('hidden');
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
                    'rgba(168, 85, 247, 0.7)', // Purple
                    'rgba(234, 179, 8, 0.7)', // Yellow
                    'rgba(59, 130, 246, 0.7)' // Blue
                ],
                borderColor: [
                    'rgba(168, 85, 247, 1)',
                    'rgba(234, 179, 8, 1)',
                    'rgba(59, 130, 246, 1)'
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