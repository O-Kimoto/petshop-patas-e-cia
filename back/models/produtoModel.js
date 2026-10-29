const { run, get, all } = require('../db/database')

// CRUD dos produtos (ração, brinquedos, medicamentos) com controle de estoque - [Otávio Michels]
function getProdutos(categoria) {
    if (categoria) {
        return all('SELECT * FROM produtos WHERE categoria = ? ORDER BY nome', [categoria])
    }
    return all('SELECT * FROM produtos ORDER BY nome')
}

function findProdutoById(id) {
    return get('SELECT * FROM produtos WHERE id = ?', [id])
}

async function createProduto({ nome, descricao, categoria, preco, estoque }) {
    const { id } = await run(
        'INSERT INTO produtos (nome, descricao, categoria, preco, estoque) VALUES (?, ?, ?, ?, ?)',
        [nome, descricao, categoria, preco, estoque]
    )
    return findProdutoById(id)
}

async function updateProduto(id, { nome, descricao, categoria, preco, estoque }) {
    await run(
        'UPDATE produtos SET nome = ?, descricao = ?, categoria = ?, preco = ?, estoque = ? WHERE id = ?',
        [nome, descricao, categoria, preco, estoque, id]
    )
    return findProdutoById(id)
}

async function deleteProduto(id) {
    const { changes } = await run('DELETE FROM produtos WHERE id = ?', [id])
    return changes > 0
}

module.exports = { getProdutos, findProdutoById, createProduto, updateProduto, deleteProduto }
