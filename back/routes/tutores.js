// Tutores (os donos dos pets): /api/tutores
const express = require('express')
const db = require('../db/database')

const router = express.Router()

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

// Confere os dados que vieram do formulário. Devolve a mensagem de erro, ou null se estiver tudo certo.
function validar(tutor) {
    if (!tutor.nome || !tutor.telefone) return 'Nome e telefone são obrigatórios'
    const digitos = String(tutor.telefone).replace(/\D/g, '') // só os números do telefone
    if (digitos.length < 10 || digitos.length > 11) return 'Telefone deve ter DDD e número (10 ou 11 dígitos)'
    if (tutor.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tutor.email)) return 'E-mail inválido'
    if (tutor.uf && !UFS.includes(String(tutor.uf).toUpperCase())) return 'UF inválida'
    if (tutor.cep && String(tutor.cep).replace(/\D/g, '').length !== 8) return 'CEP deve ter 8 dígitos'
    return null
}

// Valores na mesma ordem das colunas do INSERT e do UPDATE (campo vazio vira null)
function valores(tutor) {
    const cep = tutor.cep ? String(tutor.cep).replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2') : null // 01001000 -> 01001-000
    const uf = tutor.uf ? String(tutor.uf).toUpperCase() : null
    return [tutor.nome, tutor.email || null, tutor.telefone, cep, tutor.logradouro || null, tutor.numero || null,
        tutor.complemento || null, tutor.bairro || null, tutor.cidade || null, uf]
}

// GET /api/tutores: lista os tutores com a quantidade de pets de cada um
router.get('/', async (req, res) => {
    const tutores = await db.all(`
        SELECT t.*, COUNT(p.id) AS total_pets
        FROM tutores t
        LEFT JOIN pets p ON p.tutor_id = t.id
        GROUP BY t.id
        ORDER BY t.nome
    `)
    res.json({ tutores })
})

// GET /api/tutores/1: um tutor
router.get('/:id', async (req, res) => {
    const tutor = await db.get('SELECT * FROM tutores WHERE id = ?', [req.params.id])
    if (!tutor) {
        return res.status(404).json({ message: 'Tutor não encontrado' })
    }
    res.json({ tutor })
})

// POST /api/tutores: cadastra
router.post('/', async (req, res) => {
    const erro = validar(req.body)
    if (erro) {
        return res.status(400).json({ message: erro })
    }

    const { id } = await db.run(
        `INSERT INTO tutores (nome, email, telefone, cep, logradouro, numero, complemento, bairro, cidade, uf)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        valores(req.body)
    )
    const tutor = await db.get('SELECT * FROM tutores WHERE id = ?', [id])
    res.status(201).json({ message: 'Tutor criado com sucesso', tutor })
})

// PUT /api/tutores/1: edita
router.put('/:id', async (req, res) => {
    const id = req.params.id
    if (!(await db.get('SELECT id FROM tutores WHERE id = ?', [id]))) {
        return res.status(404).json({ message: 'Tutor não encontrado' })
    }
    const erro = validar(req.body)
    if (erro) {
        return res.status(400).json({ message: erro })
    }

    await db.run(
        `UPDATE tutores SET nome = ?, email = ?, telefone = ?, cep = ?, logradouro = ?, numero = ?,
         complemento = ?, bairro = ?, cidade = ?, uf = ? WHERE id = ?`,
        [...valores(req.body), id]
    )
    const tutor = await db.get('SELECT * FROM tutores WHERE id = ?', [id])
    res.json({ message: 'Tutor atualizado com sucesso', tutor })
})

// DELETE /api/tutores/1: exclui, se o tutor não tiver pets nem agendamentos
router.delete('/:id', async (req, res) => {
    const id = req.params.id
    if (!(await db.get('SELECT id FROM tutores WHERE id = ?', [id]))) {
        return res.status(404).json({ message: 'Tutor não encontrado' })
    }

    const temPet = await db.get('SELECT id FROM pets WHERE tutor_id = ?', [id])
    const temAgendamento = await db.get('SELECT id FROM agendamentos WHERE tutor_id = ?', [id])
    if (temPet || temAgendamento) {
        return res.status(409).json({ message: 'Este tutor tem pets ou agendamentos cadastrados. Exclua-os antes de excluir o tutor.' })
    }

    await db.run('DELETE FROM tutores WHERE id = ?', [id])
    res.json({ message: 'Tutor excluído com sucesso' })
})

module.exports = router
