document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/buscarRelatorioCLiente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar relatório do cliente: ${response.status}`);
        }

        const { success, relatorio } = await response.json();

        if (success) {
            mostrarRelatorio(relatorio);
        } else {
            console.error('Erro ao buscar relatório do cliente.');
        }

        // Se chamado pelo botão "Relatório", ative a tab de relatório
        if (chamadoPeloRelatorio) {
            openTab('tab2');
        }

    } catch (error) {
        console.error(error);
    }
});

async function puxarRelatorio() {
    try {
        // Obtenha o número do cartão do input
        const numeroCartao = document.getElementById('numeroCartao').value;

        // Verifique se o número do cartão é válido (adapte conforme necessário)
        if (!numeroCartao || isNaN(numeroCartao)) {
            alert('Por favor, insira um número de cartão válido.');
            return;
        }

        // Faça uma requisição ao servidor para validar o número do cartão
        const isValid = await validarCartaoNoBanco(numeroCartao);

        if (isValid) {
            // Faça uma requisição ao servidor para buscar o relatório do cliente
            const response = await fetch('/buscarRelatorioCLiente', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clienteCartao: numeroCartao,
                }),
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar relatório do cliente: ${response.status}`);
            }

            const { success, relatorio } = await response.json();

            if (success) {
                mostrarRelatorio(relatorio);
                // Se chamado pelo botão "Relatório", ative a tab de relatório
                openTab('tab2');
            } else {
                console.error('Erro ao buscar relatório do cliente.');
            }
        } else {
            alert('Número do cartão inválido. Por favor, insira um número válido.');
        }
    } catch (error) {
        console.error(error);
    }
}

function mostrarRelatorio(relatorio) {
    const relatorioLista = document.getElementById('relatorio-lista');

    relatorio.forEach(item => {
        const divItem = document.createElement('div');
        divItem.classList.add('relatorio-item');

        // Construa a estrutura do item do relatório
        divItem.innerHTML = `
            <p>ID Produto: ${item.id_produto}</p>
            <p>Cliente Cartão: ${item.cliente_cartao}</p>
            <p>Nome Serviço: ${item.nome_servico}</p>
            <p>Produto: ${item.flag === 1 ? 'Disponível' : 'Utilizado'}</p>
            <p>Hora Compra Produto: ${item.hora_compra}</p>
            <p>Hora Uso Produto: ${item.hora_uso}</p>
            <p>ID Recompensa: ${item.id_recompensa}</p>
            <p>Cliente Cartão Recompensa: ${item.cliente_cartao_recompensa}</p>
            <p>Recompensa: ${item.flag_recompensa === 1 ? 'Disponível' : 'Utilizado'}</p>
            <p>Hora Compra Recompensa: ${item.hora_compra_recompensa}</p>
            <p>Hora Uso Recompensa: ${item.hora_uso_recompensa}</p>
            <hr>
        `;

        relatorioLista.appendChild(divItem);
    });
}

async function puxarRelatorioGeral() {
    try {
        const response = await fetch('http://localhost:3000/buscarrelatoriogeral', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar relatório geral: ${response.status}`);
        }

        const { success, relatorioGeral } = await response.json();

        if (success) {
            mostrarRelatorioGeral(relatorioGeral);
        } else {
        }
    } catch (error) {
        console.error(error);
    }
}

function mostrarRelatorioGeral(relatorioGeral) {
    const relatorioListaGeral = document.getElementById('relatorio-lista-geral');

    relatorioGeral.forEach(item => {
        const divItem = document.createElement('div');
        divItem.classList.add('relatorioGeral-item');

        // Construa a estrutura do item do relatório
        divItem.innerHTML = `
            <p>ID Produto: ${item.id_produto}</p>
            <p>Cliente Cartão: ${item.cliente_cartao}</p>
            <p>Nome Serviço: ${item.nome_servico}</p>
            <p>Produto: ${item.flag === 1 ? 'Disponível' : 'Utilizado'}</p>
            <p>Hora Compra Produto: ${item.hora_compra}</p>
            <p>Hora Uso Produto: ${item.hora_uso}</p>
            <p>ID Recompensa: ${item.id_recompensa}</p>
            <p>Cliente Cartão Recompensa: ${item.cliente_cartao_recompensa}</p>
            <p>Recompensa: ${item.flag_recompensa === 1 ? 'Disponível' : 'Utilizado'}</p>
            <p>Hora Compra Recompensa: ${item.hora_compra_recompensa}</p>
            <p>Hora Uso Recompensa: ${item.hora_uso_recompensa}</p>
            <hr>
        `;

        relatorioListaGeral.appendChild(divItem);
    });
}
