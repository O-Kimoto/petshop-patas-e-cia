const bcrypt = require('bcryptjs')
const { run, get } = require('./database')

// Cria o usuário administrador e alguns dados de exemplo quando o banco está vazio - [Otávio Michels]
async function seed() {
    const totalUsers = await get('SELECT COUNT(*) AS total FROM users')
    if (totalUsers.total === 0) {
        const username = process.env.ADMIN_USER || 'admin'
        const password = process.env.ADMIN_PASSWORD || 'admin123'
        const hash = await bcrypt.hash(password, 10)
        await run('INSERT INTO users (nome, username, password) VALUES (?, ?, ?)', ['Administrador', username, hash])
        console.log(`Usuário inicial criado: ${username}`)
    }

    const totalServicos = await get('SELECT COUNT(*) AS total FROM servicos')
    if (totalServicos.total === 0) {
        const servicos = [
            ['Banho', 'Banho com shampoo neutro, secagem e perfume', 50],
            ['Tosa', 'Tosa higiênica ou na máquina, conforme a raça', 70],
            ['Consulta', 'Consulta veterinária de rotina', 150],
            ['Vacinação', 'Aplicação de vacina (valor da dose incluso)', 120]
        ]
        for (const s of servicos) {
            await run('INSERT INTO servicos (nome, descricao, preco) VALUES (?, ?, ?)', s)
        }
    }

    const totalProdutos = await get('SELECT COUNT(*) AS total FROM produtos')
    if (totalProdutos.total === 0) {
        const produtos = [
            ['Ração Premium Cães Adultos 15 kg', 'Ração seca sabor frango e arroz', 'Ração', 219.9, 12],
            ['Ração Gatos Castrados 10 kg', 'Controle de peso, sabor salmão', 'Ração', 189.9, 3],
            ['Bola de Borracha', 'Bola resistente para cães médios', 'Brinquedos', 24.9, 30],
            ['Arranhador para Gatos', 'Arranhador de sisal com base de 40 cm', 'Brinquedos', 89.9, 6],
            ['Vermífugo 4 comprimidos', 'Para cães de 10 a 20 kg', 'Medicamentos', 39.9, 2]
        ]
        for (const p of produtos) {
            await run('INSERT INTO produtos (nome, descricao, categoria, preco, estoque) VALUES (?, ?, ?, ?, ?)', p)
        }
    }

    const totalTutores = await get('SELECT COUNT(*) AS total FROM tutores')
    if (totalTutores.total === 0) {
        const tutor = await run(
            `INSERT INTO tutores (nome, email, telefone, cep, logradouro, numero, bairro, cidade, uf)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['Maria Silva', 'maria.silva@email.com', '(81) 99999-1234', '50030-230', 'Rua do Bom Jesus', '125', 'Recife', 'Recife', 'PE']
        )
        const pet = await run(
            'INSERT INTO pets (nome, especie, raca, sexo, tutor_id) VALUES (?, ?, ?, ?, ?)',
            ['Thor', 'Cachorro', 'Labrador', 'M', tutor.id]
        )
        await run(
            'INSERT INTO pets (nome, especie, raca, sexo, tutor_id) VALUES (?, ?, ?, ?, ?)',
            ['Mia', 'Gato', 'Siamês', 'F', tutor.id]
        )
        const banho = await get("SELECT id FROM servicos WHERE nome = 'Banho'")
        if (banho) {
            const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000)
            const dataHora = amanha.toISOString().slice(0, 10) + 'T10:00'
            await run(
                'INSERT INTO agendamentos (tutor_id, pet_id, servico_id, data_hora, status) VALUES (?, ?, ?, ?, ?)',
                [tutor.id, pet.id, banho.id, dataHora, 'Agendado']
            )
        }
    }
}

module.exports = seed
