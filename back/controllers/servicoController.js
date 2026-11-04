const model = require('../models/servicoModel')
const { HttpError, exigirCampos, idDaRota, numeroNaoNegativo, traduzirEmUso, texto } = require('./helpers')

// Valida nome e preço do serviço - [Otávio Michels]
function dadosDoServico(body) {
    exigirCampos(body, ['nome', 'preco'])
    return { nome: texto(body.nome), descricao: texto(body.descricao), preco: numeroNaoNegativo(body.preco, 'Preço') }
}

async function listar(req, res) {
    res.json({ servicos: await model.getServicos() })
}

async function buscar(req, res) {
    const servico = await model.findServicoById(idDaRota(req))
    if (!servico) throw new HttpError(404, 'Serviço não encontrado')
    res.json({ servico })
}

async function criar(req, res) {
    const servico = await model.createServico(dadosDoServico(req.body))
    res.status(201).json({ message: 'Serviço criado com sucesso', servico })
}

async function atualizar(req, res) {
    const id = idDaRota(req)
    if (!(await model.findServicoById(id))) throw new HttpError(404, 'Serviço não encontrado')
    const servico = await model.updateServico(id, dadosDoServico(req.body))
    res.json({ message: 'Serviço atualizado com sucesso', servico })
}

async function remover(req, res) {
    const id = idDaRota(req)
    const apagou = await model.deleteServico(id).catch((err) =>
        traduzirEmUso(err, 'Este serviço é usado em agendamentos e não pode ser excluído.')
    )
    if (!apagou) {
        // Não apagou: ou não existe, ou está em algum agendamento
        if (await model.findServicoById(id)) {
            throw new HttpError(409, 'Este serviço é usado em agendamentos e não pode ser excluído.')
        }
        throw new HttpError(404, 'Serviço não encontrado')
    }
    res.json({ message: 'Serviço excluído com sucesso' })
}

// Reajuste em lote: percentual positivo aumenta, negativo dá desconto; sem ids vale para todos
async function reajustar(req, res) {
    exigirCampos(req.body, ['percentual'])
    const percentual = Number(req.body.percentual)
    if (!Number.isFinite(percentual) || percentual === 0 || percentual < -90 || percentual > 200) {
        throw new HttpError(400, 'Percentual deve ser um número diferente de zero, entre -90 e 200')
    }

    let ids = null
    if (req.body.ids !== undefined && req.body.ids !== null) {
        if (!Array.isArray(req.body.ids)) throw new HttpError(400, 'ids deve ser uma lista de IDs de serviço')
        ids = req.body.ids.map(Number)
        if (ids.some((id) => !Number.isInteger(id) || id <= 0)) throw new HttpError(400, 'ids contém um ID inválido')
        if (!ids.length) ids = null
    }

    const alterados = await model.reajustarPrecos(1 + percentual / 100, ids)
    if (!alterados) throw new HttpError(404, 'Nenhum serviço encontrado para reajustar')
    const sinal = percentual > 0 ? '+' : ''
    res.json({
        message: `Preço de ${alterados} serviço(s) reajustado em ${sinal}${percentual}%`,
        servicos: await model.getServicos()
    })
}

module.exports = { listar, buscar, criar, atualizar, remover, reajustar }
