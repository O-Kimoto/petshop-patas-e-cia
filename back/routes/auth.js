// Login e cadastro de contas: /api/auth/...
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db/database')
const autenticar = require('../middleware/auth')

const router = express.Router()

// O "Criar conta" da tela de login só funciona com CADASTRO_PUBLICO=sim no back/.env (vem desligado)
function cadastroPublicoLigado() {
    return String(process.env.CADASTRO_PUBLICO || '').trim().toLowerCase() === 'sim'
}

// GET /api/auth/config: diz à tela de login se ela deve mostrar o link "Criar conta"
router.get('/config', (req, res) => {
    res.json({ cadastroPublico: cadastroPublicoLigado() })
})

// POST /api/auth/login: confere usuário e senha e devolve o token JWT
router.post('/login', async (req, res) => {
    const { username, password } = req.body
    if (!username || !password) {
        return res.status(400).json({ message: 'Preencha usuário e senha' })
    }

    const user = await db.get('SELECT * FROM users WHERE username = ?', [String(username).trim()])

    // bcrypt.compare compara a senha digitada com o hash guardado no banco.
    // Usuário inexistente e senha errada têm a mesma resposta, para não revelar quais usuários existem.
    if (!user || !(await bcrypt.compare(String(password), user.password))) {
        return res.status(401).json({ message: 'Usuário ou senha inválidos' })
    }

    // O token guarda id, usuário e nome, é assinado com a JWT_SECRET e vence em 1 dia
    const token = jwt.sign(
        { id: user.id, username: user.username, nome: user.nome },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    )

    res.json({ message: 'Login bem-sucedido', token, user: { id: user.id, nome: user.nome, username: user.username } })
})

// POST /api/auth/register: cria uma conta pela tela de login (só com o cadastro público ligado)
router.post('/register', async (req, res) => {
    if (!cadastroPublicoLigado()) {
        return res.status(403).json({ message: 'O cadastro de novas contas está desligado. Peça um acesso ao administrador.' })
    }

    const username = String(req.body.username || '').trim()
    const password = String(req.body.password || '')
    if (!username || !password) {
        return res.status(400).json({ message: 'Preencha usuário e senha' })
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'A senha precisa ter pelo menos 6 caracteres' })
    }
    if (await db.get('SELECT id FROM users WHERE username = ?', [username])) {
        return res.status(409).json({ message: 'Usuário já existe' })
    }

    const hash = await bcrypt.hash(password, 10) // guarda só o hash, nunca a senha
    const { id } = await db.run('INSERT INTO users (nome, username, password) VALUES (?, ?, ?)',
        [req.body.nome || username, username, hash])
    const user = await db.get('SELECT id, nome, username, criado_em FROM users WHERE id = ?', [id])
    res.status(201).json({ message: 'Usuário criado com sucesso', user })
})

// GET /api/auth/me: devolve o dono do token (o "autenticar" guardou os dados dele em req.user)
router.get('/me', autenticar, async (req, res) => {
    const user = await db.get('SELECT id, nome, username, criado_em FROM users WHERE id = ?', [req.user.id])
    if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' })
    }
    res.json({ user })
})

module.exports = router
