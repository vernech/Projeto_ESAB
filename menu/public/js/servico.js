// Adicione no início do arquivo servicos.js
document.getElementById('servicos').classList.add('initially-hidden');

// Atualize a função confirmarNumeroCartao() no arquivo menu.js
async function confirmarNumeroCartao() {
    console.log("funcionando ")
    // Obtenha o número do cartão do input
    const numeroCartao = document.getElementById('numeroCartao').value;

    // Verifique se o número do cartão é válido (adapte conforme necessário)
    if (!numeroCartao || isNaN(numeroCartao)) {
        alert('Por favor, insira um número de cartão válido.');
        return;
    } else {
        alert('Cartão confirmado com sucesso');
    }

    // Oculte a seção de serviços
    document.getElementById('servicos').classList.remove('initially-hidden');

    // Faça uma requisição ao servidor para validar o número do cartão
    const isValid = await validarCartaoNoBanco(numeroCartao);

    if (isValid) {
        // Atualize a variável global com o número do cartão atual
        numeroDoCartaoAtual = numeroCartao;
        console.log('Número do Cartão Confirmado:', numeroDoCartaoAtual);

        // Exiba os botões de check com base nos produtos associados ao cartão
        mostrarBotoesCheck();
        mostrarBotoesRecompensa();
    } else {
        alert('Número do cartão inválido. Por favor, insira um número válido.');
    }
}

// Função para validar o número do cartão no banco
// Função para validar o número do cartão no banco
async function validarCartaoNoBanco(numeroCartao) {
    try {
        const response = await fetch('/validarCartao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                numeroCartao: numeroCartao,
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao validar o número do cartão: ${response.status}`);
        }

        const data = await response.json();
        return data.isValid;
    } catch (error) {
        console.error(error);
        return false; // Retornar false em caso de erro
    }
}

// Função para adicionar um botão de check à lista
function adicionaBotaoCheck(nomeProduto) {
    var checkButtonsContainer = document.getElementById('check-buttons-container');
    var checkButton = document.createElement('button');
    
    // Defina o texto do botão como o nome do produto
    checkButton.textContent = nomeProduto;

    // Adicione um ouvinte de evento ao botão
    checkButton.addEventListener('click', function() {
        // Por exemplo, você pode marcar o produto como selecionado
        console.log('Botão de check clicado para o produto:', nomeProduto);
    });

    // Adicione o botão à lista
    checkButtonsContainer.appendChild(checkButton);
}

// Atualize a função mostrarBotoesCheck no arquivo servico.js
async function mostrarBotoesCheck() {
    try {
        const response = await fetch('/buscarProdutosDoCartao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ numeroCartao: numeroDoCartaoAtual }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar produtos do cartão: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.produtos) {

            limparBotoesCheck();

            const productList = document.getElementById('product-list');

            if (productList) {
                data.produtos.forEach(produto => {
                    const botaoProduto = criarBotaoProduto(produto.id, produto.nome_produto, produto.flag);
                    productList.appendChild(botaoProduto);
                });

                const botaoDesmarcar = document.createElement('button');
                botaoDesmarcar.innerText = 'Confirmar serviços';
                botaoDesmarcar.addEventListener('click', desmarcarProduto);
                productList.appendChild(botaoDesmarcar);
            } else {
                throw new Error('Elemento product-list não encontrado.');
            }
        } else {
            throw new Error('Produtos do cartão não encontrados.');
        }
    } catch (error) {
        console.error(error);
        alert('Erro ao buscar produtos do cartão.');
    }
}

// Função para desativar os botões dos produtos já utilizados
function desativarBotoesProdutosUtilizados(produtosUtilizados) {
    // Desative os botões dos produtos já utilizados
    produtosUtilizados.forEach(produtoUtilizado => {
        const botaoCheck = document.querySelector(`.product-checkbox[data-id="${produtoUtilizado.id}"]`);
        if (botaoCheck) {
            botaoCheck.disabled = true;
        }
    });
}

// Função para limpar os botões de check existentes
function limparBotoesCheck() {
    const productList = document.getElementById('product-list');
    
    // Verifique se o elemento existe antes de tentar acessá-lo
    if (productList) {
        productList.innerHTML = ''; // Limpe todos os itens da lista
    }
}

// Função para criar um botão de check para um produto específico
function criarBotaoProduto(idProduto, nomeProduto, flagProduto) {
    const botaoProduto = document.createElement('li');

    if (flagProduto === 1) {
        botaoProduto.innerHTML = `
            <label>
                <input type="checkbox" class="produto-checkbox" data-id="${idProduto}">
                ${idProduto} ${nomeProduto} ${flagProduto} Ativo
            </label>
        `;
    } else {
        botaoProduto.innerHTML = `
            <label>
                ${idProduto} ${nomeProduto} ${flagProduto} Inativo
            </label>
        `;
    }

    return botaoProduto;
}


// Atualize a função desmarcarProduto no arquivo servico.js
async function desmarcarProduto() {
    try {
        console.log('Desmarcando produtos...');

        // Obtenha todos os checkboxes marcados
        const checkboxes = document.querySelectorAll('.produto-checkbox:checked');
        console.log('Número de checkboxes marcados:', checkboxes.length);

        // Adicione este log para verificar se os elementos existem
        console.log('Elementos com a classe .produto-checkbox:', checkboxes);

        // Obtenha os IDs dos produtos marcados e converta para números inteiros
        const produtosSelecionados = Array.from(checkboxes).map(checkbox => parseInt(checkbox.dataset.id, 10));

        // Faça uma solicitação ao servidor para confirmar os serviços (definir flag para 0)
        const response = await fetch('/confirmarServicos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                produtos: produtosSelecionados,
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao confirmar serviços: ${response.status}`);
        }

        // Atualize os botões de check após confirmar os serviços
        mostrarBotoesCheck();
    } catch (error) {
        console.error(error);
        alert('Erro ao confirmar serviços.');
    }
}


// Adicione no arquivo servicos.js
document.addEventListener('DOMContentLoaded', () => {
    // Adicione um ouvinte de evento ao botão de desmarcar
    const botaoDesmarcar = document.getElementById('botaoDesmarcar');
    if (botaoDesmarcar) {
        botaoDesmarcar.addEventListener('click', desmarcarProduto);
    }
});

// Função para buscar os produtos associados ao número do cartão no banco de dados
async function buscarProdutosDoCartaoNoBanco(numeroCartao) {
    try {
        const response = await fetch('/buscarProdutosDoCartao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ numeroCartao }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar produtos do cartão: ${response.status}`);
        }

        const data = await response.json();

        // 'data.produtos' deve conter a lista de produtos associados ao número do cartão
        console.log('Produtos associados ao número do cartão:', data.produtos);
    } catch (error) {
        console.error(error);
    }
}

// Função para buscar o nome da recompensa no servidor com base no id_servico
async function buscarNomeRecompensa(idServico) {
    try {
        const response = await fetch('/buscarNomeRecompensa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idServico }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar nome da recompensa: ${response.status}`);
        }

        const data = await response.json();

        return data.nomeRecompensa;
    } catch (error) {
        console.error(error);
        throw new Error('Erro ao buscar nome da recompensa.');
    }
}

// Atualize a função mostrarBotoesRecompensa no arquivo servico.js
async function mostrarBotoesRecompensa() {
    try {
        console.log('Mostrando botões de recompensa...');

        // Faça uma solicitação ao servidor para buscar as recompensas associadas ao cartão
        const response = await fetch('/buscarRecompensasDoCliente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clienteCartao: numeroDoCartaoAtual,
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar recompensas do cartão: ${response.status}`);
        }

        const { success, recompensas } = await response.json();

        if (!success) {
            console.error('Erro ao buscar recompensas do cartão.');
            return;
        }

        // Limpe a lista de recompensas antes de adicionar os novos botões
        const listaRecompensas = document.getElementById('recompensa-list');
        listaRecompensas.innerHTML = '';

        // Adicione os botões de recompensa à lista
        recompensas.forEach(recompensa => {
            const botaoRecompensa = criarBotaoRecompensa(recompensa.id, recompensa.nome_servico, recompensa.flag);
            listaRecompensas.appendChild(botaoRecompensa);
        });

        // Adicione o botão de confirmar recompensas
        const botaoConfirmarRecompensas = document.createElement('button');
        botaoConfirmarRecompensas.textContent = 'Confirmar Recompensas';
        botaoConfirmarRecompensas.addEventListener('click', confirmarUsoRecompensas);
        listaRecompensas.appendChild(botaoConfirmarRecompensas);

        console.log('Botões de recompensa adicionados com sucesso.');
    } catch (error) {
        console.error(`Erro ao mostrar botões de recompensa: ${error.message}`);
    }
}



// Função para confirmar o uso das recompensas
async function confirmarUsoRecompensas() {
    try {
        console.log('Confirmando o uso das recompensas...');

        // Obtenha os IDs das recompensas marcadas
        const recompensasSelecionadas = Array.from(document.querySelectorAll('.recompensa-checkbox:checked'))
            .map(checkbox => parseInt(checkbox.dataset.id, 10));

        if (recompensasSelecionadas.length === 0) {
            alert('Selecione pelo menos uma recompensa para confirmar.');
            return;
        }

        // Faça uma solicitação ao servidor para confirmar o uso das recompensas (definir flag para 0)
        const response = await fetch('/confirmarRecompensas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recompensas: recompensasSelecionadas,
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao confirmar recompensas: ${response.status}`);
        }

        // Atualize os botões de recompensa após confirmar o uso das recompensas
        mostrarBotoesRecompensa();
    } catch (error) {
        console.error(error);
        alert('Erro ao confirmar o uso das recompensas.');
    }
}


// Função para marcar uma recompensa
function marcarRecompensa(idRecompensa) {
    const botaoRecompensa = document.querySelector(`.recompensa-button[data-id="${idRecompensa}"]`);
    if (botaoRecompensa) {
        botaoRecompensa.classList.toggle('marcado');
    }
}


// Função para desativar os botões das recompensas já utilizadas
function desativarBotoesRecompensasUtilizadas(recompensasUtilizadas) {
    // Desative os botões das recompensas já utilizadas
    recompensasUtilizadas.forEach(recompensaUtilizada => {
        const botaoCheck = document.querySelector(`.recompensa-checkbox[data-id="${recompensaUtilizada.id}"]`);
        if (botaoCheck) {
            botaoCheck.disabled = true;
        }
    });
}

// Função para limpar os botões de recompensa existentes
function limparBotoesRecompensa() {
    const recompensaList = document.getElementById('recompensa-list');

    // Verifique se o elemento existe antes de tentar acessá-lo
    if (recompensaList) {
        recompensaList.innerHTML = ''; // Limpe todos os itens da lista
    }
}

// Utilize essa função para criar um botão de recompensa
function criarBotaoRecompensa(idRecompensa, nomeRecompensa, flagRecompensa) {
    const botaoRecompensa = document.createElement('li');

    if (flagRecompensa === 1) {
        botaoRecompensa.innerHTML = `
            <label>
                <input type="checkbox" class="recompensa-checkbox" data-id="${idRecompensa}">
                ${idRecompensa} ${nomeRecompensa} ${flagRecompensa}
            </label>
        `;
    } else {
        botaoRecompensa.innerHTML = `
            <label>
                ${idRecompensa} ${nomeRecompensa} ${flagRecompensa} Inativo
            </label>
        `;
    }

    return botaoRecompensa;
}


// Atualize a função desmarcarRecompensa no arquivo recompensas.js
async function desmarcarRecompensa() {
    try {
        console.log('Desmarcando recompensas...'); // Adicione este log

        // Obtenha todas as checkboxes marcadas
        const checkboxes = document.querySelectorAll('.recompensa-checkbox:checked');

        if (checkboxes.length === 0) {
            alert('Selecione pelo menos uma recompensa para confirmar.');
            return;
        }

        // Obtenha os IDs das recompensas marcadas e converta para números inteiros
        const recompensasSelecionadas = Array.from(checkboxes).map(checkbox => parseInt(checkbox.dataset.id, 10));

        // Faça uma solicitação ao servidor para confirmar as recompensas (definir flag para 0)
        const response = await fetch('/confirmarRecompensas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recompensas: recompensasSelecionadas,
            }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao confirmar recompensas: ${response.status}`);
        }

        // Atualize os botões de check após confirmar as recompensas
        mostrarBotoesRecompensa();
    } catch (error) {
        console.error(error);
        alert('Erro ao confirmar recompensas.');
    }
}

// Adicione no arquivo recompensas.js
document.addEventListener('DOMContentLoaded', () => {
    // Adicione um ouvinte de evento ao botão de desmarcar recompensa
    const botaoDesmarcarRecompensa = document.getElementById('botaoDesmarcarRecompensa');
    if (botaoDesmarcarRecompensa) {
        botaoDesmarcarRecompensa.addEventListener('click', desmarcarRecompensa);
    }
});

// Função para buscar as recompensas associadas ao cliente_cartao no banco de dados
async function buscarRecompensasDoClienteNoBanco(clienteCartao) {
    try {
        console.log('Dados do servidor para recompensas:', data);
        const response = await fetch('/buscarRecompensasDoCliente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clienteCartao }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar recompensas do cliente: ${response.status}`);
        }

        const data = await response.json();

        // 'data.recompensas' deve conter a lista de recompensas associadas ao cliente
        console.log('Recompensas associadas ao cliente:', data.recompensas);
    } catch (error) {
        console.error(error);
    }
}