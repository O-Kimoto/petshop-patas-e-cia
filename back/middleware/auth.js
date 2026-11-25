// "Porteiro" das rotas protegidas: só deixa passar quem manda um token JWT válido no header
//   Authorization: Bearer <token>
// O front coloca esse header sozinho em toda chamada (auth.interceptor.ts).
const jwt = require('jsonwebtoken')

function autenticar(req, res, next) {
    const header = req.headers.authorization || '' // ex.: "Bearer eyJhbGciOiJIUzI1NiIs..."
    const token = header.split(' ')[1]             // pega só a parte depois de "Bearer "

    if (!token) {
        return res.status(401).json({ message: 'Token não fornecido. Faça login para continuar.' })
    }

    try {
        // Confere a assinatura com a JWT_SECRET e se o token ainda não venceu.
        // Se estiver tudo certo, guarda quem está logado em req.user ({ id, username, nome }).
        req.user = jwt.verify(token, process.env.JWT_SECRET)
        next() // pode seguir para a rota
    } catch {
        // 401 também para token vencido: o front usa esse status para voltar à tela de login
        res.status(401).json({ message: 'Token inválido ou expirado. Faça login novamente.' })
    }
}

module.exports = autenticar
