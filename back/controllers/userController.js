const model = require('../models/userModel')
const { HttpError, exigirCampos, idDaRota, texto } = require('./helpers')

// Monta e valida os dados do usuário; na edição a senha é opcional - [Otávio Michels]
async function dadosDoUsuario(body, idAtual) {
    exigirCampos(body, ['nome', 'username'])
    const username = texto(body.username)
    const existente = await model.findUserByUsername(username)
    if (existente && existente.id !== idAtual) {
        throw new HttpError(409, 'Já existe um usuário com esse login')
    }
    if (body.password && String(body.password).length < 6) {
        throw new HttpError(400, 'A senha precisa ter pelo menos 6 caracteres')
    }
    return { nome: texto(body.nome), username, password: body.password || null }
}

async function listar(req, res) {
    res.json({ users: await model.getUsers() })
}

async function buscar(req, res) {
    const user = await model.findUserById(idDaRota(req))
    if (!user) throw new HttpError(404, 'Usuário não encontrado')
    res.json({ user })
}

async function criar(req, res) {
    exigirCampos(req.body, ['password'])
    const user = await model.createUser(await dadosDoUsuario(req.body))
    res.status(201).json({ message: 'Usuário criado com sucesso', user })
}

async function atualizar(req, res) {
    const id = idDaRota(req)
    if (!(await model.findUserById(id))) throw new HttpError(404, 'Usuário não encontrado')
    const user = await model.updateUser(id, await dadosDoUsuario(req.body, id))
    res.json({ message: 'Usuário atualizado com sucesso', user })
}

// Impede que o usuário logado apague a própria conta e fique sem acesso - [Otávio Michels]
async function remover(req, res) {
    const id = idDaRota(req)
    if (id === req.user.id) throw new HttpError(400, 'Você não pode excluir o próprio usuário')
    if (!(await model.deleteUser(id))) throw new HttpError(404, 'Usuário não encontrado')
    res.json({ message: 'Usuário excluído com sucesso' })
}

module.exports = { listar, buscar, criar, atualizar, remover }
