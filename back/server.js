// Ponto de partida do back: prepara o banco e liga o servidor (npm start)
const app = require('./app')
const { prepararBanco } = require('./db/database')
const criarDadosIniciais = require('./db/seed')

const PORTA = process.env.PORT || 3000

async function iniciar() {
    await prepararBanco()        // cria as tabelas, se ainda não existirem
    await criarDadosIniciais()   // usuário admin e dados de exemplo, se o banco estiver vazio

    app.listen(PORTA, (erro) => {
        if (erro) {
            console.error(`Não foi possível usar a porta ${PORTA}: ${erro.message}`)
            process.exit(1)
        }
        console.log(`API Petshop rodando em http://localhost:${PORTA}`)
        console.log(`Swagger em http://localhost:${PORTA}/api-docs`)
    })
}

iniciar().catch((erro) => {
    console.error('Erro ao preparar o banco de dados:', erro)
    process.exit(1)
})
