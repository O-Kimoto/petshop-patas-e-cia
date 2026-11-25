// Conexão com o banco de dados (SQLite) e criação das tabelas
const path = require('path')
const { createClient } = require('@libsql/client')

// Onde os dados ficam guardados:
// - no computador: no arquivo back/db/petshop.db
// - na Vercel: no banco online do Turso (variáveis TURSO_DATABASE_URL e TURSO_AUTH_TOKEN)
const limpar = (texto) => String(texto || '').trim().replace(/^["']+|["']+$/g, '') // tira espaços e aspas coladas sem querer
const arquivo = process.env.VERCEL ? '/tmp/petshop.db' : path.join(__dirname, 'petshop.db')

const banco = createClient({
    url: limpar(process.env.TURSO_DATABASE_URL) || 'file:' + arquivo.replace(/\\/g, '/'),
    authToken: limpar(process.env.TURSO_AUTH_TOKEN) || undefined
})

// As rotas usam só estas três funções para falar com o banco.
// Os "?" do SQL são trocados pelos valores da lista, na ordem. Isso evita SQL injection.

// all: devolve todas as linhas encontradas (uma lista)
async function all(sql, valores = []) {
    const resultado = await banco.execute({ sql, args: valores })
    return resultado.rows.map((linha) => ({ ...linha }))
}

// get: devolve só a primeira linha (ou undefined se não achar nada)
async function get(sql, valores = []) {
    const linhas = await all(sql, valores)
    return linhas[0]
}

// run: para INSERT, UPDATE e DELETE; devolve o id criado e quantas linhas mudaram
async function run(sql, valores = []) {
    const resultado = await banco.execute({ sql, args: valores })
    return { id: Number(resultado.lastInsertRowid), changes: resultado.rowsAffected }
}

// As tabelas do petshop. REFERENCES liga uma tabela à outra (ex.: cada pet tem um tutor).
const TABELAS = [
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tutores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT,
        telefone TEXT NOT NULL,
        cep TEXT,
        logradouro TEXT,
        numero TEXT,
        complemento TEXT,
        bairro TEXT,
        cidade TEXT,
        uf TEXT,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS pets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        especie TEXT NOT NULL,
        raca TEXT,
        sexo TEXT NOT NULL CHECK (sexo IN ('M', 'F')),
        tutor_id INTEGER NOT NULL REFERENCES tutores(id),
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS servicos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        preco REAL NOT NULL CHECK (preco >= 0),
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        categoria TEXT,
        preco REAL NOT NULL CHECK (preco >= 0),
        estoque INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS agendamentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tutor_id INTEGER NOT NULL REFERENCES tutores(id),
        pet_id INTEGER NOT NULL REFERENCES pets(id),
        servico_id INTEGER NOT NULL REFERENCES servicos(id),
        data_hora TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Agendado'
            CHECK (status IN ('Agendado', 'Confirmado', 'Concluído', 'Cancelado')),
        observacoes TEXT,
        valor REAL,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    )`
]

// Cria as tabelas que ainda não existem. O servidor chama isto antes de começar a atender.
async function prepararBanco() {
    for (const sql of TABELAS) {
        await run(sql)
    }

    // Bancos criados antes de 04/11/2026 não têm a coluna "valor" nos agendamentos: aqui ela é adicionada
    const colunas = await all('PRAGMA table_info(agendamentos)')
    if (!colunas.some((coluna) => coluna.name === 'valor')) {
        await run('ALTER TABLE agendamentos ADD COLUMN valor REAL')
        await run('UPDATE agendamentos SET valor = (SELECT preco FROM servicos WHERE servicos.id = agendamentos.servico_id)')
    }

    console.log(process.env.TURSO_DATABASE_URL ? 'Banco: Turso (online)' : 'Banco: ' + arquivo)
}

module.exports = { all, get, run, prepararBanco }
