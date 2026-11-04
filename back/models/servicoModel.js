const { run, get, all } = require('../db/database')

// CRUD dos serviços do petshop (banho, tosa, consulta, vacinação...) - [Otávio Michels]
function getServicos() {
    return all('SELECT * FROM servicos ORDER BY nome')
}

function findServicoById(id) {
    return get('SELECT * FROM servicos WHERE id = ?', [id])
}

async function createServico({ nome, descricao, preco }) {
    const { id } = await run('INSERT INTO servicos (nome, descricao, preco) VALUES (?, ?, ?)', [nome, descricao, preco])
    return findServicoById(id)
}

async function updateServico(id, { nome, descricao, preco }) {
    await run('UPDATE servicos SET nome = ?, descricao = ?, preco = ? WHERE id = ?', [nome, descricao, preco, id])
    return findServicoById(id)
}

// Só apaga se o serviço não estiver em nenhum agendamento (conferido no próprio DELETE, vale também no Turso)
async function deleteServico(id) {
    const { changes } = await run(
        'DELETE FROM servicos WHERE id = ? AND NOT EXISTS (SELECT 1 FROM agendamentos WHERE servico_id = ?)',
        [id, id]
    )
    return changes > 0
}

// Multiplica o preço pelo fator (1.10 = +10%) e arredonda em centavos; devolve quantos serviços mudaram
async function reajustarPrecos(fator, ids = null) {
    let sql = 'UPDATE servicos SET preco = ROUND(preco * ?, 2)'
    const params = [fator]
    if (ids && ids.length) {
        sql += ` WHERE id IN (${ids.map(() => '?').join(', ')})`
        params.push(...ids)
    }
    const { changes } = await run(sql, params)
    return changes
}

module.exports = { getServicos, findServicoById, createServico, updateServico, deleteServico, reajustarPrecos }
