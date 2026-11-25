// Resumo do painel inicial: /api/dashboard
const express = require('express')
const db = require('../db/database')

const router = express.Router()

// Produtos com essa quantidade ou menos aparecem no alerta de estoque baixo
const ESTOQUE_BAIXO = 5

// GET /api/dashboard?hoje=AAAA-MM-DD
// O front manda a data de hoje do navegador; sem ela, usa a data do servidor
router.get('/', async (req, res) => {
    const hoje = /^\d{4}-\d{2}-\d{2}$/.test(req.query.hoje || '') ? req.query.hoje : new Date().toISOString().slice(0, 10)
    const mes = hoje.slice(0, 7) // "2026-11"

    // Quantidade de cada cadastro e de agendamentos de hoje
    const totais = await db.get(`
        SELECT
            (SELECT COUNT(*) FROM tutores) AS tutores,
            (SELECT COUNT(*) FROM pets) AS pets,
            (SELECT COUNT(*) FROM servicos) AS servicos,
            (SELECT COUNT(*) FROM produtos) AS produtos,
            (SELECT COUNT(*) FROM agendamentos WHERE substr(data_hora, 1, 10) = ?) AS agendamentos_hoje
    `, [hoje])

    // Os 5 próximos agendamentos que ainda vão acontecer
    const proximos = await db.all(`
        SELECT a.id, a.data_hora, a.status, p.nome AS pet_nome, t.nome AS tutor_nome, s.nome AS servico_nome
        FROM agendamentos a
        JOIN pets p ON p.id = a.pet_id
        JOIN tutores t ON t.id = a.tutor_id
        JOIN servicos s ON s.id = a.servico_id
        WHERE substr(a.data_hora, 1, 10) >= ? AND a.status IN ('Agendado', 'Confirmado')
        ORDER BY a.data_hora
        LIMIT 5
    `, [hoje])

    const estoqueBaixo = await db.all(
        'SELECT id, nome, categoria, estoque FROM produtos WHERE estoque <= ? ORDER BY estoque, nome', [ESTOQUE_BAIXO])

    // Quantos agendamentos há em cada status (para o gráfico)
    const porStatus = await db.all('SELECT status, COUNT(*) AS total FROM agendamentos GROUP BY status')

    // Faturamento do mês: soma o valor dos atendimentos concluídos
    const faturamentoMes = await db.get(`
        SELECT COUNT(*) AS atendimentos, COALESCE(SUM(valor), 0) AS total
        FROM agendamentos
        WHERE status = 'Concluído' AND substr(data_hora, 1, 7) = ?
    `, [mes])

    res.json({ totais, proximos, estoqueBaixo, porStatus, faturamentoMes })
})

module.exports = router
