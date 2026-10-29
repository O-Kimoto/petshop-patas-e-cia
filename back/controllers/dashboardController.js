const { getResumo } = require('../models/dashboardModel')

// Produtos com essa quantidade ou menos aparecem no alerta de estoque baixo - [Otávio Michels]
const LIMITE_ESTOQUE_BAIXO = 5

// O front manda ?hoje=AAAA-MM-DD no fuso do navegador; sem isso usa a data do servidor - [Otávio Michels]
async function resumo(req, res) {
    const hoje = /^\d{4}-\d{2}-\d{2}$/.test(req.query.hoje || '') ? req.query.hoje : new Date().toISOString().slice(0, 10)
    res.json(await getResumo(hoje, LIMITE_ESTOQUE_BAIXO))
}

module.exports = { resumo }
