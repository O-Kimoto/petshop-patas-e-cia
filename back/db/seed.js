// Dados iniciais: o usuário administrador e alguns cadastros de exemplo.
// Cada parte só é criada quando a tabela dela está vazia.
const bcrypt = require('bcryptjs')
const db = require('./database')

async function criarDadosIniciais() {
    // Usuário admin, com a senha que está no back/.env (ADMIN_PASSWORD)
    const usuarios = await db.get('SELECT COUNT(*) AS total FROM users')
    if (usuarios.total === 0) {
        const username = process.env.ADMIN_USER || 'admin'
        const senha = process.env.ADMIN_PASSWORD || 'admin123'
        const hash = await bcrypt.hash(senha, 10) // a senha nunca é guardada como texto, só o hash
        await db.run('INSERT INTO users (nome, username, password) VALUES (?, ?, ?)', ['Administrador', username, hash])
        console.log(`Usuário inicial criado: ${username}`)
    }

    const servicos = await db.get('SELECT COUNT(*) AS total FROM servicos')
    if (servicos.total === 0) {
        await db.run('INSERT INTO servicos (nome, descricao, preco) VALUES (?, ?, ?)', ['Banho', 'Banho com shampoo neutro, secagem e perfume', 50])
        await db.run('INSERT INTO servicos (nome, descricao, preco) VALUES (?, ?, ?)', ['Tosa', 'Tosa higiênica ou na máquina, conforme a raça', 70])
        await db.run('INSERT INTO servicos (nome, descricao, preco) VALUES (?, ?, ?)', ['Consulta', 'Consulta veterinária de rotina', 150])
        await db.run('INSERT INTO servicos (nome, descricao, preco) VALUES (?, ?, ?)', ['Vacinação', 'Aplicação de vacina (valor da dose incluso)', 120])
    }

    const produtos = await db.get('SELECT COUNT(*) AS total FROM produtos')
    if (produtos.total === 0) {
        const sql = 'INSERT INTO produtos (nome, descricao, categoria, preco, estoque) VALUES (?, ?, ?, ?, ?)'
        await db.run(sql, ['Ração Premium Cães Adultos 15 kg', 'Ração seca sabor frango e arroz', 'Ração', 219.9, 12])
        await db.run(sql, ['Ração Gatos Castrados 10 kg', 'Controle de peso, sabor salmão', 'Ração', 189.9, 3])
        await db.run(sql, ['Bola de Borracha', 'Bola resistente para cães médios', 'Brinquedos', 24.9, 30])
        await db.run(sql, ['Arranhador para Gatos', 'Arranhador de sisal com base de 40 cm', 'Brinquedos', 89.9, 6])
        await db.run(sql, ['Vermífugo 4 comprimidos', 'Para cães de 10 a 20 kg', 'Medicamentos', 39.9, 2])
    }

    // Uma tutora com dois pets e um banho marcado para amanhã às 10h
    const tutores = await db.get('SELECT COUNT(*) AS total FROM tutores')
    if (tutores.total === 0) {
        const tutora = await db.run(
            `INSERT INTO tutores (nome, email, telefone, cep, logradouro, numero, bairro, cidade, uf)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['Maria Silva', 'maria.silva@email.com', '(81) 91239-4567', '50030-230', 'Rua do Bom Jesus', '125', 'Recife', 'Recife', 'PE']
        )
        const thor = await db.run('INSERT INTO pets (nome, especie, raca, sexo, tutor_id) VALUES (?, ?, ?, ?, ?)',
            ['Thor', 'Cachorro', 'Labrador', 'M', tutora.id])
        await db.run('INSERT INTO pets (nome, especie, raca, sexo, tutor_id) VALUES (?, ?, ?, ?, ?)',
            ['Mia', 'Gato', 'Siamês', 'F', tutora.id])

        const banho = await db.get("SELECT id, preco FROM servicos WHERE nome = 'Banho'")
        if (banho) {
            const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            await db.run(
                'INSERT INTO agendamentos (tutor_id, pet_id, servico_id, data_hora, status, valor) VALUES (?, ?, ?, ?, ?, ?)',
                [tutora.id, thor.id, banho.id, amanha + 'T10:00', 'Agendado', banho.preco]
            )
        }
    }
}

module.exports = criarDadosIniciais
