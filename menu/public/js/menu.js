var itensSelecionados = [];
let numeroDoCartaoAtual = null;

// No início do seu arquivo menu.js
document.querySelector('.confirm-purchase-button').addEventListener('click', confirmarCompra);


// Função para abrir uma guia específica
function openTab(tabName) {
    var i, tabContent;
    tabContent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabContent.length; i++) {
        tabContent[i].style.display = "none";
    }
    document.getElementById(tabName).style.display = "block";

    // Ocultar abas de prestador de serviço quando uma guia principal é aberta
    var prestadorTabs = document.getElementsByClassName("prestador-tab-content");
    for (var i = 0; i < prestadorTabs.length; i++) {
        prestadorTabs[i].style.display = "none";
    }
}

// Função para alternar a exibição de uma guia
function toggleTab(tabName) {
    var tabContent = document.getElementById(tabName);

    if (tabContent.style.display === "block") {
        tabContent.style.display = "none";
    } else {
        var allTabs = document.getElementsByClassName("tab-content");
        for (var i = 0; i < allTabs.length; i++) {
            allTabs[i].style.display = "none";
        }
        tabContent.style.display = "block";
    }
}

// Função para gerar um número aleatório
function gerarNumeroAleatorio() {
    return Math.floor(Math.random() * (99999 - 10000 + 1)) + 10000;
}

// Função para gerar e copiar o número do cartão
async function gerarecopiar() {
    try {
        const response = await fetch('/gerarCartao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Erro ao gerar cartão: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.numeroCartao) {
            throw new Error('Número de cartão não disponível');
        }

        const numgerado = data.numeroCartao;
        const numeroelement = document.getElementById('numgerado');
        confirmarNumeroCartao
        if (!numeroelement) {
            throw new Error('Elemento HTML não encontrado');
        }

        numeroelement.textContent = `Número Gerado: ${numgerado}`;

        navigator.clipboard.writeText(numgerado.toString())
            .then(() => console.log('Cartão Gerado!'))
            .catch(err => console.error('Erro ao gerar cartão', err));
    } catch (error) {
        console.error(error);
    }
}

async function confirmarNumeroCartao() {
    // Obtenha o número do cartão do input
    const numeroCartao = document.getElementById('numeroCartao').value;

    // Verifique se o número do cartão é válido (adapte conforme necessário)
    if (!numeroCartao || isNaN(numeroCartao)) {
        alert('Por favor, insira um número de cartão válido.');
        return;
    }else{
        alert('Cartâo confirmado com sucesso')
    }

    // Faça uma requisição ao servidor para validar o número do cartão
    const isValid = await validarCartaoNoBanco(numeroCartao);

    if (isValid) {
        // Atualize a variável global com o número do cartão atual
        numeroDoCartaoAtual = numeroCartao;
        console.log('Número do Cartão Confirmado:', numeroDoCartaoAtual);
    } else {
        alert('Número do cartão inválido. Por favor, insira um número válido.');
    }
}

// Função para validar o cartão no banco de dados
async function validarCartaoNoBanco(numeroCartao) {
    try {
        const response = await fetch('/validarCartao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ numeroCartao }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao validar o cartão: ${response.status}`);
        }

        const data = await response.json();

        // 'data.isValid' deve ser true ou false com base na validação do cartão no servidor
        return data.isValid;
    } catch (error) {
        console.error(error);
        return false; // Em caso de erro, considere como cartão inválido
    }
}

const numeroelement = document.getElementById('numgerado');
numeroDoCartaoAtual = numgerado;
numeroelement.textContent = `Número Gerado: ${numgerado}`;

// Remova a duplicação
// Adicione um evento de clique a cada botão de produto
document.querySelectorAll('.product-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const productName = event.target.textContent;
        adicionaProdutoAoCarrinhoLocal(productName);
    });
});

// Adicione no início do seu arquivo menu.js
document.getElementById('confirm-purchase-button').addEventListener('click', confirmarCompra);

function adicionaProdutoAoCarrinhoLocal(productName) {
    console.log('Chamando adicionaProdutoAoCarrinhoLocal para', productName);
    // Adicione o produto à lista local de itens selecionados
    itensSelecionados.push(productName);
    // Adicione o produto à lista visual do carrinho
    adicionaProdutoAoCarrinhoVisual(productName);
    // Atualize a quantidade do carrinho
    updateqtdcarro();
}

// Função para adicionar um produto à lista visual do carrinho
function adicionaProdutoAoCarrinhoVisual(productName) {
    var cartList = document.getElementById('cart-list');
    var listItem = document.createElement('li');
    listItem.textContent = productName;
    cartList.appendChild(listItem);
}

// Função para limpar a lista visual do carrinho
function limparCarrinhoVisual() {
    var cartList = document.getElementById('cart-list');

    // Limpe todos os itens da lista
    cartList.innerHTML = '';

    // Atualize a quantidade do carrinho
    updateqtdcarro();
}

// Função para confirmar a compra
async function confirmarCompra() {
    if (!numeroDoCartaoAtual) {
        alert('Por favor, insira um número de cartão.');
        return;
    }

    for (const productName of itensSelecionados) {
        try {
            // Use a variável global para o número do cartão
            await adicionaProdutoAoCarrinhoBanco(numeroDoCartaoAtual, productName);
        } catch (error) {
            console.error(error);
            return;
        }
    }

    // Limpe a lista local de itens selecionados após a compra
    itensSelecionados.length = 0;

    // Limpe a lista visual do carrinho
    limparCarrinhoVisual();

    // Limpe o campo de entrada após a compra
    document.getElementById('numeroCartao').value = '';
}

// Adicione um evento de clique a cada botão de produto
document.querySelectorAll('.product-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const productName = event.target.textContent;
        adicionaProdutoAoCarrinhoLocal(productName);
    });
});


// Função para adicionar um produto ao carrinho no banco de dados
async function adicionaProdutoAoCarrinhoBanco(clienteCartao, productName) {
    try {
        const response = await fetch('/adicionarProduto', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clienteCartao: clienteCartao || 0, productName }), // Use o número do cartão fornecido ou 0 se for vazio
        });

        const data = await response.json();
        console.log(data); // Exiba a resposta do servidor no console (opcional)
        updateqtdcarro(); // Atualize a quantidade do carrinho após adicionar um produto
    } catch (error) {
        console.error(error);
        throw new Error('Erro ao adicionar produto ao carrinho.');
    }
}

// Função para adicionar um produto ao carrinho
async function adicionacarro(clienteCartao, productName) {
    try {
        const response = await fetch('/adicionarProduto', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clienteCartao: clienteCartao || 0, productName }), // Use o número do cartão fornecido ou 0 se for vazio
        });

        const data = await response.json();
        console.log(data); // Exiba a resposta do servidor no console (opcional)
        updateqtdcarro(); // Atualize a quantidade do carrinho após adicionar um produto
    } catch (error) {
        console.error(error);
    }
}

// Função para atualizar a quantidade de produtos no carrinho
function updateqtdcarro() {
    var cartList = document.getElementById('cart-list');
    var cartQuantity = cartList.children.length;

    var cartIcon = document.getElementById('cart-icon');
    cartIcon.textContent = cartQuantity;
}

// Adicione um ouvinte de evento a cada botão de produto
document.querySelectorAll('.product-button').forEach(button => {
    button.addEventListener('click', (event) => {
        const productName = event.target.textContent;
        adicionaProdutoAoCarrinhoLocal(productName);
    });
});

// Função para esvaziar o carrinho
function esvaziarcarrinho() {
    var cartList = document.getElementById('cart-list');

    if (cartList.children.length === 0) {
        alert('O carrinho já está vazio.');
        return;
    }

    while (cartList.firstChild) {
        cartList.removeChild(cartList.firstChild);
    }

    updateqtdcarro(); // Atualize a quantidade do carrinho após esvaziar
}

// Função para abrir uma aba específica do prestador de serviço
function openPrestadorTab(tabName) {
    // Ocultar todas as abas de prestador de serviço
    var prestadorTabs = document.getElementsByClassName("prestador-tab-content");
    for (var i = 0; i < prestadorTabs.length; i++) {
        prestadorTabs[i].style.display = "none";
    }

    // Exibir a aba específica apenas se ela for clicada
    var tabContent = document.getElementById(tabName);
    if (tabContent) {
        tabContent.style.display = "block";
    }
}
