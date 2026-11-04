// Entrada do site na Vercel: as requisições de /api e /api-docs chegam aqui e vão para o Express do back.
// As telas (front/dist) a Vercel serve sozinha, como arquivos estáticos.
const app = require('../back/app')
const { ready } = require('../back/db/database')
const seed = require('../back/db/seed')

// Cria as tabelas e os dados iniciais uma vez por instância, antes da primeira requisição
const pronto = ready.then(seed)
pronto.catch(() => { }) // o erro é tratado na requisição; isto só evita derrubar a função na carga

// Traduz o erro do Turso numa dica do que corrigir nas variáveis da Vercel (sem mostrar nenhum segredo)
function motivo(err) {
    const msg = String((err && err.message) || err)
    if (!String(process.env.TURSO_AUTH_TOKEN || '').trim()) return 'TURSO_AUTH_TOKEN não está cadastrado na Vercel (ou está com outro nome)'
    if (/status 400|InvalidToken|JWT error|malformed/i.test(msg)) return 'o TURSO_AUTH_TOKEN está mal copiado (pedaço faltando ou caractere a mais)'
    if (/status 40[13]|unauthori[sz]ed|expired|revoked/i.test(msg)) return 'o Turso recusou o token: ele foi invalidado ou é de outro banco; gere um novo'
    if (/status (404|502)|ENOTFOUND|URL_INVALID|Invalid URL|getaddrinfo/i.test(msg)) return 'a TURSO_DATABASE_URL está errada (o banco não foi encontrado)'
    return msg.slice(0, 160)
}

module.exports = async (req, res) => {
    try {
        await pronto
    } catch (err) {
        console.error('Erro ao preparar o banco de dados:', err)
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        return res.end(JSON.stringify({
            message: 'Banco de dados indisponível. Confira TURSO_DATABASE_URL e TURSO_AUTH_TOKEN nas variáveis da Vercel.',
            detalhe: motivo(err)
        }))
    }
    return app(req, res)
}
