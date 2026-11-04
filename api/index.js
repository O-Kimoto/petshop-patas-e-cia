// Entrada do site na Vercel: as requisições de /api e /api-docs chegam aqui e vão para o Express do back.
// As telas (front/dist) a Vercel serve sozinha, como arquivos estáticos.
const app = require('../back/app')
const { ready } = require('../back/db/database')
const seed = require('../back/db/seed')

// Cria as tabelas e os dados iniciais uma vez por instância, antes da primeira requisição
const pronto = ready.then(seed)
pronto.catch(() => { }) // o erro é tratado na requisição; isto só evita derrubar a função na carga

module.exports = async (req, res) => {
    try {
        await pronto
    } catch (err) {
        console.error('Erro ao preparar o banco de dados:', err)
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        return res.end(JSON.stringify({
            message: 'Banco de dados indisponível. Confira TURSO_DATABASE_URL e TURSO_AUTH_TOKEN nas variáveis da Vercel.'
        }))
    }
    return app(req, res)
}
