// Monta o servidor Express: libera o acesso do front, lê JSON, liga as rotas e responde os erros
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true }) // lê o back/.env

const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const swaggerUi = require('swagger-ui-express')
const swaggerDoc = require('./swagger.json')
const autenticar = require('./middleware/auth')

// Sem JWT_SECRET no .env o servidor ainda sobe, com uma chave temporária (os logins caem a cada reinício)
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = require('crypto').randomBytes(32).toString('hex')
    console.warn('JWT_SECRET não definido no .env: usando uma chave temporária.')
}

const app = express()

app.use(cors())          // deixa o front, que está em outra porta (4200), chamar a API
app.use(morgan('dev'))   // mostra cada requisição no terminal: "GET /api/tutores 200 1.5 ms"
app.use(express.json())  // transforma o JSON que chega no corpo da requisição em req.body
app.use((req, res, next) => {
    req.body = req.body || {} // requisição sem corpo: req.body vira um objeto vazio
    // Tira os espaços do começo e do fim dos textos digitados (menos da senha)
    for (const campo in req.body) {
        if (typeof req.body[campo] === 'string' && campo !== 'password') req.body[campo] = req.body[campo].trim()
    }
    next()
})

// Documentação da API (Swagger), em /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, { customSiteTitle: 'API Petshop' }))
app.get('/api-docs.json', (req, res) => res.json(swaggerDoc))

// Rota de teste: mostra que a API está no ar e qual banco está em uso
app.get('/api', (req, res) => {
    res.json({ status: 'ok', api: 'Petshop', docs: '/api-docs', banco: process.env.TURSO_DATABASE_URL ? 'turso' : 'arquivo local' })
})

// Rotas da API. Todas, menos as de login, passam antes pelo "autenticar", que exige o token.
app.use('/api/auth', require('./routes/auth'))
app.use('/api/dashboard', autenticar, require('./routes/dashboard'))
app.use('/api/tutores', autenticar, require('./routes/tutores'))
app.use('/api/pets', autenticar, require('./routes/pets'))
app.use('/api/servicos', autenticar, require('./routes/servicos'))
app.use('/api/produtos', autenticar, require('./routes/produtos'))
app.use('/api/agendamentos', autenticar, require('./routes/agendamentos'))
app.use('/api/users', autenticar, require('./routes/users'))

// Qualquer outro endereço começando com /api
app.use('/api', (req, res) => res.status(404).json({ message: 'Rota não encontrada' }))

// Depois do "npm run build" do front, o próprio Express entrega as telas (front e API na mesma porta)
app.use(express.static(path.join(__dirname, '..', 'front', 'dist', 'petshop')))

// Erro inesperado em qualquer rota: responde JSON em vez de derrubar o servidor
app.use((erro, req, res, next) => {
    if (erro.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'JSON inválido no corpo da requisição' })
    }
    console.error(erro)
    res.status(500).json({ message: 'Erro interno no servidor' })
})

module.exports = app
