// Produtos à venda, com estoque: /api/produtos
const express = require('express')
const db = require('../db/database')

const router = express.Router()

// Confere os dados do formulário. Devolve a mensagem de erro, ou null se estiver tudo certo.
function validar(produto) {
    if (!produto.nome) return 'Nome é obrigatório'
    if (produto.preco === null || produto.preco === '' || !(Number(produto.preco) >= 0)) {
        return 'Preço deve ser um número maior ou igual a zero'
    }
    const estoque = Number(produto.estoque)
    if (produto.estoque === null || produto.estoque === '' || !Number.isInteger(estoque) || estoque < 0) {
        return 'Estoque deve ser um número inteiro maior ou igual a zero'
    }
    return null
}

// GET /api/produtos: lista todos, ou só uma categoria com ?categoria=Ração
router.get('/', async (req, res) => {
    let produtos
    if (req.query.categoria) {
        produtos = await db.all('SELECT * FROM produtos WHERE categoria = ? ORDER BY nome', [req.query.categoria])
    } else {
        produtos = await db.all('SELECT * FROM produtos ORDER BY nome')
    }
    res.json({ produtos })
})

// GET /api/produtos/1: um produto
router.get('/:id', async (req, res) => {
    const produto = await db.get('SELECT * FROM produtos WHERE id = ?', [req.params.id])
    if (!produto) {
        return res.status(404).json({ message: 'Produto não encontrado' })
    }
    res.json({ produto })
})

// POST /api/produtos: cadastra
router.post('/', async (req, res) => {
    const erro = validar(req.body)
    if (erro) {
        return res.status(400).json({ message: erro })
    }

    const { nome, descricao, categoria, preco, estoque } = req.body
    const { id } = await db.run('INSERT INTO produtos (nome, descricao, categoria, preco, estoque) VALUES (?, ?, ?, ?, ?)',
        [nome, descricao || null, categoria || null, Number(preco), Number(estoque)])
    const produto = await db.get('SELECT * FROM produtos WHERE id = ?', [id])
    res.status(201).json({ message: 'Produto criado com sucesso', produto })
})

// PUT /api/produtos/1: edita
router.put('/:id', async (req, res) => {
    const id = req.params.id
    if (!(await db.get('SELECT id FROM produtos WHERE id = ?', [id]))) {
        return res.status(404).json({ message: 'Produto não encontrado' })
    }
    const erro = validar(req.body)
    if (erro) {
        return res.status(400).json({ message: erro })
    }

    const { nome, descricao, categoria, preco, estoque } = req.body
    await db.run('UPDATE produtos SET nome = ?, descricao = ?, categoria = ?, preco = ?, estoque = ? WHERE id = ?',
        [nome, descricao || null, categoria || null, Number(preco), Number(estoque), id])
    const produto = await db.get('SELECT * FROM produtos WHERE id = ?', [id])
    res.json({ message: 'Produto atualizado com sucesso', produto })
})

// POST /api/produtos/1/estoque: entrada (+) ou saída (-) de estoque. Corpo: { "quantidade": -1 }
router.post('/:id/estoque', async (req, res) => {
    const quantidade = Number(req.body.quantidade)
    if (!Number.isInteger(quantidade) || quantidade === 0) {
        return res.status(400).json({ message: 'Quantidade deve ser um número inteiro diferente de zero' })
    }

    const produto = await db.get('SELECT * FROM produtos WHERE id = ?', [req.params.id])
    if (!produto) {
        return res.status(404).json({ message: 'Produto não encontrado' })
    }
    if (produto.estoque + quantidade < 0) {
        return res.status(400).json({ message: `Estoque insuficiente: ${produto.nome} tem ${produto.estoque} un.` })
    }

    await db.run('UPDATE produtos SET estoque = estoque + ? WHERE id = ?', [quantidade, produto.id])
    const atualizado = await db.get('SELECT * FROM produtos WHERE id = ?', [produto.id])
    const tipo = quantidade > 0 ? 'Entrada' : 'Saída'
    res.json({ message: `${tipo} de ${Math.abs(quantidade)} un. registrada`, produto: atualizado })
})

// DELETE /api/produtos/1: exclui
router.delete('/:id', async (req, res) => {
    const { changes } = await db.run('DELETE FROM produtos WHERE id = ?', [req.params.id])
    if (changes === 0) {
        return res.status(404).json({ message: 'Produto não encontrado' })
    }
    res.json({ message: 'Produto excluído com sucesso' })
})

module.exports = router
