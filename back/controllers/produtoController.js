const model = require('../models/produtoModel')
const { HttpError, exigirCampos, idDaRota, numeroNaoNegativo, texto } = require('./helpers')

// Valida nome, preço e estoque (inteiro) do produto - [Otávio Michels]
function dadosDoProduto(body) {
    exigirCampos(body, ['nome', 'preco', 'estoque'])
    return {
        nome: texto(body.nome),
        descricao: texto(body.descricao),
        categoria: texto(body.categoria),
        preco: numeroNaoNegativo(body.preco, 'Preço'),
        estoque: numeroNaoNegativo(body.estoque, 'Estoque', true)
    }
}

// Aceita ?categoria= para filtrar (Ração, Brinquedos, Medicamentos...) - [Otávio Michels]
async function listar(req, res) {
    res.json({ produtos: await model.getProdutos(texto(req.query.categoria)) })
}

async function buscar(req, res) {
    const produto = await model.findProdutoById(idDaRota(req))
    if (!produto) throw new HttpError(404, 'Produto não encontrado')
    res.json({ produto })
}

async function criar(req, res) {
    const produto = await model.createProduto(dadosDoProduto(req.body))
    res.status(201).json({ message: 'Produto criado com sucesso', produto })
}

async function atualizar(req, res) {
    const id = idDaRota(req)
    if (!(await model.findProdutoById(id))) throw new HttpError(404, 'Produto não encontrado')
    const produto = await model.updateProduto(id, dadosDoProduto(req.body))
    res.json({ message: 'Produto atualizado com sucesso', produto })
}

async function remover(req, res) {
    if (!(await model.deleteProduto(idDaRota(req)))) throw new HttpError(404, 'Produto não encontrado')
    res.json({ message: 'Produto excluído com sucesso' })
}

// Entrada (+) ou saída (-) de estoque; recusa saída maior do que o que tem na prateleira
async function movimentarEstoque(req, res) {
    const id = idDaRota(req)
    exigirCampos(req.body, ['quantidade'])
    const quantidade = Number(req.body.quantidade)
    if (!Number.isInteger(quantidade) || quantidade === 0) {
        throw new HttpError(400, 'Quantidade deve ser um número inteiro diferente de zero')
    }

    const produto = await model.findProdutoById(id)
    if (!produto) throw new HttpError(404, 'Produto não encontrado')
    if (!(await model.movimentarEstoque(id, quantidade))) {
        throw new HttpError(400, `Estoque insuficiente: ${produto.nome} tem ${produto.estoque} un.`)
    }

    const atualizado = await model.findProdutoById(id)
    const tipo = quantidade > 0 ? 'Entrada' : 'Saída'
    res.json({ message: `${tipo} de ${Math.abs(quantidade)} un. registrada`, produto: atualizado })
}

module.exports = { listar, buscar, criar, atualizar, remover, movimentarEstoque }
