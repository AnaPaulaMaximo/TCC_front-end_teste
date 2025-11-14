document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA ORIGINAL DO CARTÃO (INTACTA) ---
    const cardNumberInput = document.getElementById('cardNumber');
    const cardNameInput = document.getElementById('cardName');
    const cardExpiryInput = document.getElementById('cardExpiry');
    const cardCVCInput = document.getElementById('cardCVC');
    const cardDisplay = document.querySelector('.card-display');

    const displayCardNumber = document.getElementById('display-number');
    const displayCardName = document.getElementById('display-name');
    const displayCardExpiry = document.getElementById('display-expiry');
    const displayCardCVC = document.getElementById('display-cvc');
    const paymentForm = document.getElementById('paymentForm');

    // Função para formatar o número do cartão (grupos de 4)
    cardNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        value = value.match(/.{1,4}/g)?.join(' ') || ''; // Agrupa em 4 e junta com espaço
        e.target.value = value;
        displayCardNumber.textContent = value.padEnd(19, 'X').replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || 'XXXX XXXX XXXX XXXX';
    });

    // Atualiza o nome no cartão
    cardNameInput.addEventListener('input', (e) => {
        let value = e.target.value.toUpperCase();
        displayCardName.textContent = value || 'NOME DO TITULAR';
    });

    // Função para formatar a validade (MM/AA)
    cardExpiryInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
        displayCardExpiry.textContent = value || 'MM/AA';
    });

    // Inverte o cartão para o verso ao focar no CVV
    cardCVCInput.addEventListener('focus', () => {
        cardDisplay.classList.add('flipped');
    });

    // Vira o cartão para a frente ao desfocar do CVV
    cardCVCInput.addEventListener('blur', () => {
        cardDisplay.classList.remove('flipped');
    });

    // Atualiza o CVV no verso do cartão
    cardCVCInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        e.target.value = value;
        displayCardCVC.textContent = value || '***';
    });

    // Simulação de envio do formulário (apenas para demonstração)
    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Pagamento simulado enviado com sucesso! (Funcionalidade de back-end não implementada)');
        // Aqui você integraria com um gateway de pagamento real.
    });
    // --- FIM DA LÓGICA ORIGINAL ---


    // --- NOVA LÓGICA DE SELEÇÃO DE PLANO ---
    
    // 1. Seleciona os elementos
    const radioMensal = document.getElementById('plan-mensal');
    const radioAnual = document.getElementById('plan-anual');
    
    const summaryPlanName = document.getElementById('summary-plan-name');
    const summaryPlanPrice = document.getElementById('summary-plan-price');
    const summaryTotalPrice = document.getElementById('summary-total-price');
    const submitButtonText = document.getElementById('submit-button-text');

    // 2. Define os dados dos planos
    const planos = {
        mensal: {
            nome: 'Plano Mensal Premium',
            preco: 'R$ 34,90',
            total: 'R$ 34,90',
            botao: 'Pagar R$ 34,90'
        },
        anual: {
            nome: 'Plano Anual Premium',
            preco: 'R$ 334.90',
            total: 'R$ 334.90',
            botao: 'Pagar R$ 334.90'
        }
    };

    // 3. Função para atualizar a UI
    function updatePaymentDetails() {
        // Verifica qual radio está selecionado
        const planoSelecionado = radioMensal.checked ? planos.mensal : planos.anual;

        // Atualiza o texto de todos os elementos
        summaryPlanName.textContent = planoSelecionado.nome;
        summaryPlanPrice.textContent = planoSelecionado.preco;
        summaryTotalPrice.textContent = planoSelecionado.total;
        submitButtonText.textContent = planoSelecionado.botao;
    }

    // 4. Adiciona os "escutadores" de eventos
    radioMensal.addEventListener('change', updatePaymentDetails);
    radioAnual.addEventListener('change', updatePaymentDetails);

    // 5. Garante que a página carregue com o valor correto (Anual, que está 'checked' no HTML)
    updatePaymentDetails();

    // --- FIM DA NOVA LÓGICA ---
});