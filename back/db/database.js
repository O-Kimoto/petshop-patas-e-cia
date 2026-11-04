const path = require('path')

// Dois jeitos de guardar os dados, com as mesmas funções run/get/all para os models:
// - TURSO_DATABASE_URL definida (site na Vercel): banco SQLite online no Turso, que não some entre os acessos
// - sem ela (máquina local e Codespaces): arquivo petshop.db, como sempre
const TURSO_URL = process.env.TURSO_DATABASE_URL

let run, get, all

if (TURSO_URL) {
    const { createClient } = require('@libsql/client')
    const client = createClient({ url: TURSO_URL, authToken: process.env.TURSO_AUTH_TOKEN })
    console.log('Banco conectado no Turso')

    // O Turso devolve linhas "array-like"; aqui viram objetos simples { coluna: valor }, iguais aos do sqlite3
    const objetos = (rs) => rs.rows.map((linha) => Object.fromEntries(rs.columns.map((c, i) => [c, linha[i]])))

    // Erros de chave estrangeira do Turso também viram SQLITE_CONSTRAINT, que o resto do código já trata
    const executar = async (sql, params) => {
        try {
            return await client.execute({ sql, args: params })
        } catch (err) {
            if (/constraint/i.test(String(err.message))) err.code = 'SQLITE_CONSTRAINT'
            throw err
        }
    }

    run = async (sql, params = []) => {
        const rs = await executar(sql, params)
        return { id: rs.lastInsertRowid !== undefined ? Number(rs.lastInsertRowid) : undefined, changes: rs.rowsAffected }
    }
    get = async (sql, params = []) => objetos(await executar(sql, params))[0]
    all = async (sql, params = []) => objetos(await executar(sql, params))
} else {
    const sqlite3 = require('sqlite3').verbose()

    // Caminho fixo do banco, para funcionar de qualquer pasta onde o servidor for iniciado - [Otávio Michels]
    // Na Vercel sem Turso só a pasta /tmp aceita escrita, e ela é apagada de tempos em tempos (modo demonstração)
    const DB_PATH = process.env.DB_PATH || (process.env.VERCEL ? '/tmp/petshop.db' : path.join(__dirname, 'petshop.db'))
    if (process.env.VERCEL && !process.env.DB_PATH) {
        console.warn('Sem TURSO_DATABASE_URL: usando /tmp/petshop.db, que é apagado quando a Vercel reinicia a função')
    }

    const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Erro ao conectar ao banco', err.message)
        } else {
            console.log('Banco conectado em', DB_PATH)
        }
    })

    // Versões com Promise do run/get/all do sqlite3, usadas pelos models com async/await - [Otávio Michels]
    run = (sql, params = []) => new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err)
            resolve({ id: this.lastID, changes: this.changes })
        })
    })

    get = (sql, params = []) => new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
    })

    all = (sql, params = []) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
    })
}

// Criação das tabelas do petshop; as chaves estrangeiras impedem apagar um tutor que ainda tem pets - [Otávio Michels]
const SCHEMA = [
    'PRAGMA foreign_keys = ON',
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
        tutor_id INTEGER NOT NULL REFERENCES tutores(id) ON DELETE RESTRICT,
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
        tutor_id INTEGER NOT NULL REFERENCES tutores(id) ON DELETE RESTRICT,
        pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE RESTRICT,
        servico_id INTEGER NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
        data_hora TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Agendado'
            CHECK (status IN ('Agendado', 'Confirmado', 'Concluído', 'Cancelado')),
        observacoes TEXT,
        valor REAL,
        criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    )`
]

// valor = preço do serviço no dia em que foi agendado, para um reajuste não mudar o histórico.
// Bancos criados antes dessa coluna ganham ela aqui, preenchida com o preço atual do serviço.
async function migrarValorDoAgendamento() {
    const colunas = await all('PRAGMA table_info(agendamentos)')
    if (!colunas.some((c) => c.name === 'valor')) {
        await run('ALTER TABLE agendamentos ADD COLUMN valor REAL')
    }
    await run(`UPDATE agendamentos
               SET valor = (SELECT preco FROM servicos WHERE servicos.id = agendamentos.servico_id)
               WHERE valor IS NULL`)
}

// Roda o schema em ordem antes de qualquer consulta; o servidor espera essa Promise para subir - [Otávio Michels]
const ready = (async () => {
    for (const sql of SCHEMA) {
        await run(sql)
    }
    await migrarValorDoAgendamento()
    console.log('Tabelas users, tutores, pets, servicos, produtos e agendamentos prontas')
})()

module.exports = { run, get, all, ready }
