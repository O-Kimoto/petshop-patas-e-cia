// Serviços do petshop (banho, tosa, consulta...): /api/servicos
const express = require('express')
const db = require('../db/database')

const router = express.Router()

// Confere os dados do formulário. Devolve a mensagem de erro, ou null se estiver tudo certo.
function validar(servico) {
    if (!servico.nome) return 'Nome é obrigatório'
    // preço vazio ou que não é número (ou é negativo) não serve
    if (servico.preco === null || servico.preco === '' || !(Number(servico.preco) >= 0)) {
        return 'Preço deve ser um número maior ou igual a zero'
    }
    return null
}

// GET /api/servicos: lista
router.get('/', async (req, res) => {
    const servicos = await db.all('SELECT * FROM servicos ORDER BY nome')
    res.json({ servicos })
})

// GET /api/servicos/1: um serviço
router.get('/:id', async (req, res) => {
    const servico = await db.get('SELECT * FROM servicos WHERE id = ?', [req.params.id])
    if (!servico) {
        return res.status(404).json({ message: 'Serviço não encontrado' })
    }
    res.json({ servico })
})

// POST /api/servicos: cadastra
router.post('/', async (req, res) => {
    const erro = validar(req.body)
    if (erro) {
        return res.status(400).json({ message: erro })
    }

    const { nome, descricao, preco } = req.body
    const { id } = await db.run('INSERT INTO servicos (nome, descricao, preco) VALUES (?, ?, ?)',
        [nome, descricao || null, Number(preco)])
    const servico = await db.get('SELECT * FROM servicos WHERE id = ?', [id])
    res.status(201).json({ message: 'Serviço criado com sucesso', servico })
})

// POST /api/servicos/reajuste: muda o preço em % (positivo aumenta, negativo dá desconto)
// Corpo: { "percentual": 10, "ids": [1, 2] }. Sem ids (ou lista vazia), vale para todos os serviços.
router.post('/reajuste', async (req, res) => {
    const percentual = Number(req.body.percentual)
    if (!percentual || percentual < -90 || percentual > 200) {
        return res.status(400).json({ message: 'Percentual deve ser um número diferente de zero, entre -90 e 200' })
    }
    const ids = req.body.ids || []
    if (!Array.isArray(ids) || !ids.every(Number.isInteger)) {
        return res.status(400).json({ message: 'ids deve ser uma lista de IDs de serviço' })
    }

    const fator = 1 + percentual / 100 // +10% => multiplica por 1.10
    let resultado
    if (ids.length > 0) {
        const marcadores = ids.map(() => '?').join(', ') // um "?" para cada id: "?, ?"
        resultado = await db.run(`UPDATE servicos SET preco = ROUND(preco * ?, 2) WHERE id IN (${marcadores})`, [fator, ...ids])
    } else {
        resultado = await db.run('UPDATE servicos SET preco = ROUND(preco * ?, 2)', [fator])
    }

    if (resultado.changes === 0) {
        return res.status(404).json({ message: 'Nenhum serviço encontrado para reajustar' })
    }
    const servicos = await db.all('SELECT * FROM servicos ORDER BY nome')
    const sinal = percentual > 0 ? '+' : ''
    res.json({ message: `Preço de ${resultado.changes} serviço(s) reajustado em ${sinal}${percentual}%`, servicos })
})

// PUT /api/servicos/1: edita
router.put('/:id', async (req, res) => {
    const id = req.params.id
    if (!(await db.get('SELECT id FROM servicos WHERE id = ?', [id]))) {
        return res.status(404).json({ message: 'Serviço não encontrado' })
    }
    const erro = validar(req.body)
    if (erro) {
        return res.status(400).json({ message: erro })
    }

    const { nome, descricao, preco } = req.body
    await db.run('UPDATE servicos SET nome = ?, descricao = ?, preco = ? WHERE id = ?',
        [nome, descricao || null, Number(preco), id])
    const servico = await db.get('SELECT * FROM servicos WHERE id = ?', [id])
    res.json({ message: 'Serviço atualizado com sucesso', servico })
})

// DELETE /api/servicos/1: exclui, se o serviço não estiver em nenhum agendamento
router.delete('/:id', async (req, res) => {
    const id = req.params.id
    if (!(await db.get('SELECT id FROM servicos WHERE id = ?', [id]))) {
        return res.status(404).json({ message: 'Serviço não encontrado' })
    }
    if (await db.get('SELECT id FROM agendamentos WHERE servico_id = ?', [id])) {
        return res.status(409).json({ message: 'Este serviço é usado em agendamentos e não pode ser excluído.' })
    }

    await db.run('DELETE FROM servicos WHERE id = ?', [id])
    res.json({ message: 'Serviço excluído com sucesso' })
})

module.exports = router
