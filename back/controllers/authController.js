const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { findUserByUsername, findUserById, createUser } = require('../models/userModel')
const { HttpError, exigirCampos, texto } = require('./helpers')

// Gera o token JWT com id e usuário; a validade vem do .env (padrão 1 dia) - [Otávio Michels]
function gerarToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, nome: user.nome },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    )
}

// Cadastro público de usuário (tela "Criar conta" do login) - [Otávio Michels]
async function register(req, res) {
    exigirCampos(req.body, ['username', 'password'])
    const username = texto(req.body.username)
    if (String(req.body.password).length < 6) {
        throw new HttpError(400, 'A senha precisa ter pelo menos 6 caracteres')
    }

    const existente = await findUserByUsername(username)
    if (existente) {
        throw new HttpError(409, 'Usuário já existe')
    }

    const user = await createUser({ nome: texto(req.body.nome) || username, username, password: req.body.password })
    res.status(201).json({ message: 'Usuário criado com sucesso', user })
}

// Login: confere a senha com bcrypt e devolve o token JWT - [Otávio Michels]
async function login(req, res) {
    exigirCampos(req.body, ['username', 'password'])
    const user = await findUserByUsername(texto(req.body.username))
    // Mesma mensagem para usuário inexistente e senha errada, para não revelar quais usuários existem - [Otávio Michels]
    if (!user || !(await bcrypt.compare(String(req.body.password), user.password))) {
        throw new HttpError(401, 'Usuário ou senha inválidos')
    }

    const token = gerarToken(user)
    res.json({ message: 'Login bem-sucedido', token, user: { id: user.id, nome: user.nome, username: user.username } })
}

// Devolve o usuário dono do token (usado na barra superior do front) - [Otávio Michels]
async function me(req, res) {
    const user = await findUserById(req.user.id)
    if (!user) throw new HttpError(404, 'Usuário não encontrado')
    res.json({ user })
}

module.exports = { register, login, me }
