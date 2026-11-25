// Usuários que acessam o sistema: /api/users
const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db/database')

const router = express.Router()

// Campos que podem ir para o front: a senha (hash) nunca sai do banco
const CAMPOS = 'id, nome, username, criado_em'

// Confere os dados do formulário (na edição, a senha é opcional). Devolve a mensagem de erro, ou null.
function validar(dados) {
    if (!dados.nome || !dados.username) return 'Nome e usuário são obrigatórios'
    if (dados.password && dados.password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres'
    return null
}

// GET /api/users: lista
router.get('/', async (req, res) => {
    const users = await db.all(`SELECT ${CAMPOS} FROM users ORDER BY nome, username`)
    res.json({ users })
})

// GET /api/users/1: um usuário
router.get('/:id', async (req, res) => {
    const user = await db.get(`SELECT ${CAMPOS} FROM users WHERE id = ?`, [req.params.id])
    if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' })
    }
    res.json({ user })
})

// POST /api/users: cadastra (a senha é obrigatória)
router.post('/', async (req, res) => {
    const nome = req.body.nome
    const username = String(req.body.username || '').trim()
    const password = String(req.body.password || '')

    if (!password) {
        return res.status(400).json({ message: 'A senha é obrigatória' })
    }
    const erro = validar({ nome, username, password })
    if (erro) {
        return res.status(400).json({ message: erro })
    }
    if (await db.get('SELECT id FROM users WHERE username = ?', [username])) {
        return res.status(409).json({ message: 'Já existe um usuário com esse login' })
    }

    const hash = await bcrypt.hash(password, 10) // guarda só o hash, nunca a senha
    const { id } = await db.run('INSERT INTO users (nome, username, password) VALUES (?, ?, ?)', [nome, username, hash])
    const user = await db.get(`SELECT ${CAMPOS} FROM users WHERE id = ?`, [id])
    res.status(201).json({ message: 'Usuário criado com sucesso', user })
})

// PUT /api/users/1: edita (a senha só muda se uma nova for enviada)
router.put('/:id', async (req, res) => {
    const id = Number(req.params.id)
    if (!(await db.get('SELECT id FROM users WHERE id = ?', [id]))) {
        return res.status(404).json({ message: 'Usuário não encontrado' })
    }

    const nome = req.body.nome
    const username = String(req.body.username || '').trim()
    const password = String(req.body.password || '')
    const erro = validar({ nome, username, password })
    if (erro) {
        return res.status(400).json({ message: erro })
    }
    if (await db.get('SELECT id FROM users WHERE username = ? AND id <> ?', [username, id])) {
        return res.status(409).json({ message: 'Já existe um usuário com esse login' })
    }

    if (password) {
        const hash = await bcrypt.hash(password, 10)
        await db.run('UPDATE users SET nome = ?, username = ?, password = ? WHERE id = ?', [nome, username, hash, id])
    } else {
        await db.run('UPDATE users SET nome = ?, username = ? WHERE id = ?', [nome, username, id])
    }
    const user = await db.get(`SELECT ${CAMPOS} FROM users WHERE id = ?`, [id])
    res.json({ message: 'Usuário atualizado com sucesso', user })
})

// DELETE /api/users/1: exclui. Ninguém pode excluir a si mesmo (req.user é quem está logado).
router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id)
    if (id === req.user.id) {
        return res.status(400).json({ message: 'Você não pode excluir o próprio usuário' })
    }

    const { changes } = await db.run('DELETE FROM users WHERE id = ?', [id])
    if (changes === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado' })
    }
    res.json({ message: 'Usuário excluído com sucesso' })
})

module.exports = router
