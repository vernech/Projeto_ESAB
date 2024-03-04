const express = require('express');
const bodyParser = require('body-parser');
const conexao = require('./conexao');
const path = require('path');

const app = express();
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    const filePath = path.join(__dirname, "public", "menu.html");
    res.sendFile(filePath);
});

// Gerar um número de cartão aleatório menor que 1000
async function gerarNumeroCartaoAleatorio() {
    let numeroCartao;
    let cartaoExistente;

    do {
        numeroCartao = Math.floor(Math.random() * 1000); // Gera um número aleatório entre 0 e 1000
        [cartaoExistente, _] = await conexao.execute('SELECT * FROM Cartao WHERE id_cartao = ?', [numeroCartao]);
    } while (cartaoExistente.length > 0);

    return numeroCartao;
}

// Rota para gerar um novo cartão aleatório
app.post('/gerarCartao', async (req, res) => {
    try {
        const numeroCartao = await gerarNumeroCartaoAleatorio();
        await conexao.execute('INSERT INTO Cartao (id_cartao) VALUES (?)', [numeroCartao]);
        res.status(200).json({ numeroCartao: numeroCartao });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor ao gerar o cartão.' });
    }
});

app.post('/adicionarProduto', async (req, res) => {
    try {
        const { clienteCartao, productName } = req.body;

        // Verifique se os parâmetros não são indefinidos
        if (clienteCartao === undefined || productName === undefined) {
            console.error('Parâmetros indefinidos encontrados.');
            return res.status(400).json({ success: false, message: 'Parâmetros indefinidos encontrados.' });
        }

        // Verifique se o cartão existe; se não, adicione um novo cartão
        const [cartResult] = await conexao.execute('SELECT * FROM cartao WHERE id_cartao = ?', [clienteCartao]);

        if (cartResult.length === 0) {
            // Se o cartão não existe, adicione um novo
            await conexao.execute('INSERT INTO cartao (id_cartao) VALUES (?)', [clienteCartao]);
        }

        // Obtém o id do serviço a partir do nome do serviço
        const [result] = await conexao.execute('SELECT id_servico FROM servicos WHERE nome_servico = ?', [productName]);

        if (result.length === 0) {
            console.error('Serviço não encontrado.');
            return res.status(400).json({ success: false, message: 'Serviço não encontrado.' });
        }

        const idServico = result[0].id_servico;

        // Adiciona o produto ao carrinho
        await conexao.execute('INSERT INTO produtos (cliente_cartao, id_servico, flag, created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())', [clienteCartao, idServico]);

        res.status(200).json({ success: true, message: 'Produto adicionado ao carrinho com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor ao adicionar o produto ao carrinho.' });
    }
});

app.post('/validarCartao', async (req, res) => {
    try {
        const { numeroCartao } = req.body;

        // Verifique se o cartão existe no banco de dados
        const [cartResult] = await conexao.execute('SELECT * FROM cartao WHERE id_cartao = ?', [numeroCartao]);

        const isValid = cartResult.length > 0;

        res.status(200).json({ isValid });
    } catch (error) {
        console.error(error);
        res.status(500).json({ isValid: false });
    }
});

app.post('/buscarProdutosDoCartao', async (req, res) => {
    try {
        const { numeroCartao } = req.body;

        // Verifique se o cartão existe no banco de dados
        const [cartResult] = await conexao.execute('SELECT * FROM cartao WHERE id_cartao = ?', [numeroCartao]);

        if (cartResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Cartão não encontrado.' });
        }

        // Consulte os produtos associados ao cliente_cartao com os IDs, nomes e flags
        const [produtosResult] = await conexao.execute(
            'SELECT p.id, s.nome_servico, p.flag FROM produtos p JOIN servicos s ON p.id_servico = s.id_servico WHERE p.cliente_cartao = ?',
            [numeroCartao]
        );

        const produtos = produtosResult.map(produto => ({
            id: produto.id,
            nome_produto: produto.nome_servico, // Corrigido para corresponder ao banco de dados
            flag: produto.flag
        }));

        res.status(200).json({ success: true, produtos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor ao buscar produtos do cartão.' });
    }
});



async function confirmarRecompensas(clienteCartao, numProdutosAlterados) {
    try {
        // Defina o id_servico com base no número de produtos alterados
        let id_servico;
        if (numProdutosAlterados === 2) {
            id_servico = 1;
        } else if (numProdutosAlterados === 3) {
            id_servico = 2;
        } else if (numProdutosAlterados >= 4) {
            id_servico = 3;
        }

        console.log('Valores antes de chamar conexao.execute:', clienteCartao, id_servico);

        if (clienteCartao === undefined) {
            console.error('clienteCartao é indefinido. Verifique onde você está chamando esta função.');
            throw new Error('clienteCartao é indefinido.');
        }

        // Insira um novo registro na tabela recompensas
        await conexao.execute(
            'INSERT INTO recompensas (cliente_cartao, id_servico,flag , created_at, updated_at) VALUES (?, ?, 1, NOW(), NOW())',
            [clienteCartao, id_servico]
        );

        console.log('Recompensas confirmadas com sucesso.');
    } catch (error) {
        console.error('Erro ao confirmar recompensas:', error);
        throw error; // Propague o erro para que ele seja tratado no bloco catch onde você chama essa função
    }
}



app.post('/confirmarServicos', async (req, res) => {
    try {
        const { produtos } = req.body;

        // Verifique se há produtos a serem confirmados
        if (!produtos || produtos.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum produto selecionado para confirmar.' });
        }

        // Crie uma string de placeholders para a quantidade de IDs em produtos
        const placeholders = produtos.map(() => '?').join(',');

        // Atualize a flag dos produtos selecionados para 0 com base no ID do produto
        await conexao.execute(
            `UPDATE produtos SET flag = 0, updated_at = NOW() WHERE id IN (${placeholders})`,
            produtos
        );

        // Restante do código...

        console.log('Serviços confirmados com sucesso.');

        res.status(200).json({ success: true, message: 'Serviços confirmados com sucesso.' });
    } catch (error) {
        console.error('Erro ao confirmar serviços:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor ao confirmar serviços.' });
    }
});


// Adicione ao arquivo app.js
app.post('/confirmarRecompensas', async (req, res) => {
    try {
        const { recompensas } = req.body;

        // Verifique se há recompensas a serem confirmadas
        if (!recompensas || recompensas.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhuma recompensa selecionada para confirmar.' });
        }

        // Crie uma string de placeholders para a quantidade de IDs em recompensas
        const placeholders = recompensas.map(() => '?').join(',');

        // Atualize a flag das recompensas selecionadas para 0 com base no ID da recompensa
        await conexao.execute(
            `UPDATE recompensas SET flag = 0, updated_at = NOW() WHERE id IN (${placeholders})`,
            recompensas
        );

        console.log('Recompensas confirmadas com sucesso.');

        res.status(200).json({ success: true, message: 'Recompensas confirmadas com sucesso.' });
    } catch (error) {
        console.error('Erro ao confirmar recompensas:', error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor ao confirmar recompensas.' });
    }
});

// Atualize a rota para buscar recompensas do cliente
app.post('/buscarRecompensasDoCliente', async (req, res) => {
    try {
        const { clienteCartao } = req.body;

        // Verifique se clienteCartao não é undefined
        if (clienteCartao === undefined) {
            return res.status(400).json({ success: false, message: 'Parâmetro clienteCartao não definido.' });
        }

        // Verifique se o cliente_cartao existe no banco de dados
        const [cartResult] = await conexao.execute('SELECT * FROM cartao WHERE id_cartao = ?', [clienteCartao]);

        if (cartResult.length === 0) {
            return res.status(404).json({ success: false, message: 'Cliente não encontrado.' });
        }

        // Consulte as recompensas associadas ao cliente_cartao com os IDs dos serviços, nomes e flags
        const [recompensasResult] = await conexao.execute(
            'SELECT r.id, r.id_servico, s.nome_servico, r.flag FROM recompensas r JOIN servicos s ON r.id_servico = s.id_servico WHERE r.cliente_cartao = ?',
            [clienteCartao]
        );

        const recompensas = recompensasResult.map(recompensa => ({
            id: recompensa.id,
            id_servico: recompensa.id_servico,
            nome_servico: recompensa.nome_servico,
            flag: recompensa.flag
        }));

        res.status(200).json({ success: true, recompensas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor ao buscar recompensas do cliente.' });
    }
});

app.post('/buscarRelatorioCLiente', async (req, res) => {
    try {
        const { clienteCartao } = req.body;

        if (clienteCartao === undefined) {
            return res.status(400).json({ success: false, message: 'Parâmetro clienteCartao não definido.' });
        }

        const [cartaoResult] = await conexao.execute('SELECT * FROM cartao WHERE id_cartao = ?', [clienteCartao]);
        console.log(cartaoResult);
        const [relatorioResult] = await conexao.execute(`       
            SELECT 
                produtos.id AS id_produto,                    
                produtos.cliente_cartao, 
                produtos.id_servico AS id_servico_produto, 
                produtos.flag AS flag_produto, 
                produtos.created_at AS created_at_produto, 
                produtos.updated_at AS updated_at_produto, 
                recompensas.id AS id_recompensa, 
                recompensas.cliente_cartao AS cliente_cartao_recompensa, 
                recompensas.id_servico AS id_servico_recompensa, 
                recompensas.flag AS flag_recompensa, 
                recompensas.created_at AS created_at_recompensa, 
                recompensas.updated_at AS updated_at_recompensa, 
                cartao.id_cartao, 
                servicos.id_servico AS id_servico_comum, 
                servicos.nome_servico 
            FROM produtos 
            LEFT JOIN recompensas ON produtos.cliente_cartao = recompensas.cliente_cartao AND produtos.id_servico = recompensas.id_servico 
            LEFT JOIN cartao ON produtos.cliente_cartao = cartao.id_cartao 
            LEFT JOIN servicos ON produtos.id_servico = servicos.id_servico 
            WHERE produtos.cliente_cartao = ? 
            ORDER BY produtos.id
        `, [clienteCartao]);

        const relatorio = relatorioResult.map(relatorio => ({
            id_produto: relatorio.id_produto,
            cliente_cartao: relatorio.cliente_cartao,
            id_servico: relatorio.id_servico_produto,
            nome_servico: relatorio.nome_servico,
            flag: relatorio.flag_produto,
            hora_compra: relatorio.created_at_produto,
            hora_uso: relatorio.updated_at_produto,
            id_recompensa: relatorio.id_recompensa,
            cliente_cartao_recompensa: relatorio.cliente_cartao_recompensa,
            id_servico_recompensa: relatorio.id_servico_recompensa,
            flag_recompensa: relatorio.flag_recompensa,
            hora_compra_recompensa: relatorio.created_at_recompensa,
            hora_uso_recompensa: relatorio.updated_at_recompensa
        }));

        res.status(200).json({ success: true, relatorio });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
    }
});

app.post('/buscarrelatoriogeral', async (req, res) => {
    try {
        const [relatorioResultGeral] = await conexao.execute(`       
            SELECT 
                produtos.id AS id_produto,                    
                produtos.cliente_cartao, 
                produtos.id_servico AS id_servico_produto, 
                produtos.flag AS flag_produto, 
                produtos.created_at AS created_at_produto, 
                produtos.updated_at AS updated_at_produto, 
                recompensas.id AS id_recompensa, 
                recompensas.cliente_cartao AS cliente_cartao_recompensa, 
                recompensas.id_servico AS id_servico_recompensa, 
                recompensas.flag AS flag_recompensa, 
                recompensas.created_at AS created_at_recompensa, 
                recompensas.updated_at AS updated_at_recompensa, 
                cartao.id_cartao, 
                servicos.id_servico AS id_servico_comum, 
                servicos.nome_servico 
            FROM produtos 
            LEFT JOIN recompensas ON produtos.cliente_cartao = recompensas.cliente_cartao AND produtos.id_servico = recompensas.id_servico 
            LEFT JOIN cartao ON produtos.cliente_cartao = cartao.id_cartao 
            LEFT JOIN servicos ON produtos.id_servico = servicos.id_servico 
            ORDER BY produtos.id
        `);

        const relatorioGeral = relatorioResultGeral.map(relatorioGeral => ({
            id_produto: relatorioGeral.id_produto,
            cliente_cartao: relatorioGeral.cliente_cartao,
            id_servico: relatorioGeral.id_servico_produto,
            nome_servico: relatorioGeral.nome_servico,
            flag: relatorioGeral.flag_produto,
            hora_compra: relatorioGeral.created_at_produto,
            hora_uso: relatorioGeral.updated_at_produto,
            id_recompensa: relatorioGeral.id_recompensa,
            cliente_cartao_recompensa: relatorioGeral.cliente_cartao_recompensa,
            id_servico_recompensa: relatorioGeral.id_servico_recompensa,
            flag_recompensa: relatorioGeral.flag_recompensa,
            hora_compra_recompensa: relatorioGeral.created_at_recompensa,
            hora_uso_recompensa: relatorioGeral.updated_at_recompensa
        }));

        res.status(200).json({ success: true, relatorioGeral });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor está rodando na porta ${PORT}`);
});

