const { get, all } = require('../db/database')

// Números do painel inicial: totais, agendamentos do dia, estoque baixo e agendamentos por status - [Otávio Michels]
async function getResumo(hoje, limiteEstoque) {
    const totais = await get(`
        SELECT
            (SELECT COUNT(*) FROM tutores) AS tutores,
            (SELECT COUNT(*) FROM pets) AS pets,
            (SELECT COUNT(*) FROM servicos) AS servicos,
            (SELECT COUNT(*) FROM produtos) AS produtos,
            (SELECT COUNT(*) FROM agendamentos WHERE substr(data_hora, 1, 10) = ?) AS agendamentos_hoje
    `, [hoje])

    const proximos = await all(`
        SELECT a.id, a.data_hora, a.status, p.nome AS pet_nome, t.nome AS tutor_nome, s.nome AS servico_nome
        FROM agendamentos a
        JOIN pets p ON p.id = a.pet_id
        JOIN tutores t ON t.id = a.tutor_id
        JOIN servicos s ON s.id = a.servico_id
        WHERE substr(a.data_hora, 1, 10) >= ? AND a.status IN ('Agendado', 'Confirmado')
        ORDER BY a.data_hora
        LIMIT 5
    `, [hoje])

    const estoqueBaixo = await all(
        'SELECT id, nome, categoria, estoque FROM produtos WHERE estoque <= ? ORDER BY estoque, nome',
        [limiteEstoque]
    )

    const porStatus = await all('SELECT status, COUNT(*) AS total FROM agendamentos GROUP BY status')

    return { totais, proximos, estoqueBaixo, porStatus }
}

module.exports = { getResumo }
