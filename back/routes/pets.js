// Pets (cada pet pertence a um tutor): /api/pets
const express = require('express')
const db = require('../db/database')

const router = express.Router()

// Consulta base: os campos do pet e o nome do tutor dele (JOIN pets.tutor_id -> tutores.id)
const SELECT_PET = 'SELECT p.*, t.nome AS tutor_nome FROM pets p JOIN tutores t ON t.id = p.tutor_id'

// Confere os dados do formulário. Devolve a mensagem de erro, ou null se estiver tudo certo.
async function validar(pet) {
    if (!pet.nome || !pet.especie || !pet.sexo || !pet.tutor_id) return 'Nome, espécie, sexo e tutor são obrigatórios'
    if (!['M', 'F'].includes(String(pet.sexo).toUpperCase())) return 'Sexo deve ser M (macho) ou F (fêmea)'
    if (!(await db.get('SELECT id FROM tutores WHERE id = ?', [pet.tutor_id]))) return 'Tutor informado não existe'
    return null
}

// GET /api/pets: lista todos, ou só os de um tutor com ?tutor_id=1
router.get('/', async (req, res) => {
    let pets
    if (req.query.tutor_id) {
        pets = await db.all(`${SELECT_PET} WHERE p.tutor_id = ? ORDER BY p.nome`, [req.query.tutor_id])
    } else {
        pets = await db.all(`${SELECT_PET} ORDER BY p.nome`)
    }
    res.json({ pets })
})

// GET /api/pets/1: um pet
router.get('/:id', async (req, res) => {
    const pet = await db.get(`${SELECT_PET} WHERE p.id = ?`, [req.params.id])
    if (!pet) {
        return res.status(404).json({ message: 'Pet não encontrado' })
    }
    res.json({ pet })
})

// POST /api/pets: cadastra
router.post('/', async (req, res) => {
    const erro = await validar(req.body)
    if (erro) {
        return res.status(400).json({ message: erro })
    }

    const { nome, especie, raca, sexo, tutor_id } = req.body
    const { id } = await db.run('INSERT INTO pets (nome, especie, raca, sexo, tutor_id) VALUES (?, ?, ?, ?, ?)',
        [nome, especie, raca || null, sexo.toUpperCase(), tutor_id])
    const pet = await db.get(`${SELECT_PET} WHERE p.id = ?`, [id])
    res.status(201).json({ message: 'Pet criado com sucesso', pet })
})

// PUT /api/pets/1: edita
router.put('/:id', async (req, res) => {
    const id = req.params.id
    if (!(await db.get('SELECT id FROM pets WHERE id = ?', [id]))) {
        return res.status(404).json({ message: 'Pet não encontrado' })
    }
    const erro = await validar(req.body)
    if (erro) {
        return res.status(400).json({ message: erro })
    }

    const { nome, especie, raca, sexo, tutor_id } = req.body
    await db.run('UPDATE pets SET nome = ?, especie = ?, raca = ?, sexo = ?, tutor_id = ? WHERE id = ?',
        [nome, especie, raca || null, sexo.toUpperCase(), tutor_id, id])
    const pet = await db.get(`${SELECT_PET} WHERE p.id = ?`, [id])
    res.json({ message: 'Pet atualizado com sucesso', pet })
})

// DELETE /api/pets/1: exclui, se o pet não tiver agendamentos
router.delete('/:id', async (req, res) => {
    const id = req.params.id
    if (!(await db.get('SELECT id FROM pets WHERE id = ?', [id]))) {
        return res.status(404).json({ message: 'Pet não encontrado' })
    }
    if (await db.get('SELECT id FROM agendamentos WHERE pet_id = ?', [id])) {
        return res.status(409).json({ message: 'Este pet tem agendamentos. Exclua os agendamentos antes de excluir o pet.' })
    }

    await db.run('DELETE FROM pets WHERE id = ?', [id])
    res.json({ message: 'Pet excluído com sucesso' })
})

module.exports = router
