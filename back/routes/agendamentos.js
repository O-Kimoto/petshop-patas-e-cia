// Agendamentos (tutor + pet + serviço + data e hora): /api/agendamentos
const express = require('express')
const db = require('../db/database')

const router = express.Router()

const STATUS = ['Agendado', 'Confirmado', 'Concluído', 'Cancelado']

// Consulta base: os campos do agendamento e os nomes do tutor, do pet e do serviço (JOIN nas três tabelas)
const SELECT_AGENDAMENTO = `
    SELECT a.*,
           t.nome AS tutor_nome,
           p.nome AS pet_nome,
           p.especie AS pet_especie,
           s.nome AS servico_nome,
           s.preco AS servico_preco
    FROM agendamentos a
    JOIN tutores t ON t.id = a.tutor_id
    JOIN pets p ON p.id = a.pet_id
    JOIN servicos s ON s.id = a.servico_id
`

// Confere os dados do formulário. Devolve a mensagem de erro, ou null se estiver tudo certo.
async function validar(ag) {
    if (!ag.tutor_id || !ag.pet_id || !ag.servico_id || !ag.data_hora) return 'Tutor, pet, serviço e data/hora são obrigatórios'

    const tutor = await db.get('SELECT id FROM tutores WHERE id = ?', [ag.tutor_id])
    if (!tutor) return 'Tutor informado não existe'
    const pet = await db.get('SELECT tutor_id FROM pets WHERE id = ?', [ag.pet_id])
    if (!pet) return 'Pet informado não existe'
    if (pet.tutor_id !== Number(ag.tutor_id)) return 'Esse pet não pertence ao tutor escolhido'
    const servico = await db.get('SELECT id FROM servicos WHERE id = ?', [ag.servico_id])
    if (!servico) return 'Serviço informado não existe'

    // Formato do campo de data e hora do navegador: 2026-11-26T10:00
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(ag.data_hora)) return 'Data/hora inválida. Use o formato AAAA-MM-DDTHH:MM'
    if (ag.status && !STATUS.includes(ag.status)) return `Status deve ser um destes: ${STATUS.join(', ')}`
    return null
}

// Já existe outro agendamento do mesmo pet no mesmo horário? (os cancelados não contam)
async function temConflito(petId, dataHora, ignorarId = 0) {
    const outro = await db.get(
        `SELECT id FROM agendamentos WHERE pet_id = ? AND data_hora = ? AND status <> 'Cancelado' AND id <> ?`,
        [petId, dataHora, ignorarId]
    )
    return Boolean(outro)
}

// GET /api/agendamentos: lista, com filtros opcionais ?status= ?data=AAAA-MM-DD ?pet= ?tutor=
router.get('/', async (req, res) => {
    const { status, data, pet, tutor } = req.query
    const filtros = []
    const valores = []
    if (status) { filtros.push('a.status = ?'); valores.push(status) }
    if (data) { filtros.push('substr(a.data_hora, 1, 10) = ?'); valores.push(data) }
    if (pet) { filtros.push('a.pet_id = ?'); valores.push(pet) }
    if (tutor) { filtros.push('a.tutor_id = ?'); valores.push(tutor) }

    const where = filtros.length > 0 ? 'WHERE ' + filtros.join(' AND ') : ''
    const agendamentos = await db.all(`${SELECT_AGENDAMENTO} ${where} ORDER BY a.data_hora`, valores)
    res.json({ agendamentos })
})

// GET /api/agendamentos/1: um agendamento
router.get('/:id', async (req, res) => {
    const agendamento = await db.get(`${SELECT_AGENDAMENTO} WHERE a.id = ?`, [req.params.id])
    if (!agendamento) {
        return res.status(404).json({ message: 'Agendamento não encontrado' })
    }
    res.json({ agendamento })
})

// POST /api/agendamentos: marca um horário
router.post('/', async (req, res) => {
    const erro = await validar(req.body)
    if (erro) {
        return res.status(400).json({ message: erro })
    }

    const { tutor_id, pet_id, servico_id, observacoes } = req.body
    const dataHora = req.body.data_hora.slice(0, 16) // "2026-11-26T10:00"
    const status = req.body.status || 'Agendado'

    if (status !== 'Cancelado' && await temConflito(pet_id, dataHora)) {
        return res.status(409).json({ message: 'Esse pet já tem um agendamento nesse horário' })
    }

    // O valor é o preço do serviço hoje. Ele fica guardado no agendamento,
    // para um reajuste de preço no futuro não mudar o histórico nem o faturamento.
    const servico = await db.get('SELECT preco FROM servicos WHERE id = ?', [servico_id])
    const { id } = await db.run(
        `INSERT INTO agendamentos (tutor_id, pet_id, servico_id, data_hora, status, observacoes, valor)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [tutor_id, pet_id, servico_id, dataHora, status, observacoes || null, servico.preco]
    )
    const agendamento = await db.get(`${SELECT_AGENDAMENTO} WHERE a.id = ?`, [id])
    res.status(201).json({ message: 'Agendamento criado com sucesso', agendamento })
})

// PUT /api/agendamentos/1: edita (inclusive o status: confirmar, concluir, cancelar)
router.put('/:id', async (req, res) => {
    const atual = await db.get('SELECT * FROM agendamentos WHERE id = ?', [req.params.id])
    if (!atual) {
        return res.status(404).json({ message: 'Agendamento não encontrado' })
    }
    const erro = await validar(req.body)
    if (erro) {
        return res.status(400).json({ message: erro })
    }

    const { tutor_id, pet_id, servico_id, observacoes } = req.body
    const dataHora = req.body.data_hora.slice(0, 16)
    const status = req.body.status || 'Agendado'

    if (status !== 'Cancelado' && await temConflito(pet_id, dataHora, atual.id)) {
        return res.status(409).json({ message: 'Esse pet já tem um agendamento nesse horário' })
    }

    // Mudar status, data ou observação mantém o valor combinado; trocar o serviço pega o preço de hoje
    let valor = atual.valor
    if (Number(servico_id) !== atual.servico_id || valor === null) {
        const servico = await db.get('SELECT preco FROM servicos WHERE id = ?', [servico_id])
        valor = servico.preco
    }

    await db.run(
        `UPDATE agendamentos SET tutor_id = ?, pet_id = ?, servico_id = ?, data_hora = ?, status = ?, observacoes = ?, valor = ?
         WHERE id = ?`,
        [tutor_id, pet_id, servico_id, dataHora, status, observacoes || null, valor, atual.id]
    )
    const agendamento = await db.get(`${SELECT_AGENDAMENTO} WHERE a.id = ?`, [atual.id])
    res.json({ message: 'Agendamento atualizado com sucesso', agendamento })
})

// DELETE /api/agendamentos/1: exclui
router.delete('/:id', async (req, res) => {
    const { changes } = await db.run('DELETE FROM agendamentos WHERE id = ?', [req.params.id])
    if (changes === 0) {
        return res.status(404).json({ message: 'Agendamento não encontrado' })
    }
    res.json({ message: 'Agendamento excluído com sucesso' })
})

module.exports = router
