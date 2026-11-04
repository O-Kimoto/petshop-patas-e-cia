// Cria o back/.env a partir do .env.example com uma JWT_SECRET aleatória, se ele ainda não existir - [Otávio Michels]
// Usado no "npm run setup" (Codespaces, Replit ou máquina nova), para ninguém precisar inventar a chave à mão.
// A senha do admin também sai aleatória: a padrão (admin123) está no repositório, e no Codespaces a porta é pública.
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Senha fácil de digitar: sem letras e números que se confundem (0/O, 1/l/I)
function senhaAleatoria(tamanho = 10) {
    const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
    let senha = ''
    for (let i = 0; i < tamanho; i++) senha += letras[crypto.randomInt(letras.length)]
    return senha
}

const destino = path.join(__dirname, '.env')
if (fs.existsSync(destino)) {
    console.log('back/.env já existe, nada a fazer')
} else {
    const exemplo = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf8')
    const segredo = crypto.randomBytes(32).toString('hex')
    const senhaAdmin = senhaAleatoria()
    const conteudo = exemplo
        .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${segredo}`)
        .replace(/^ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD=${senhaAdmin}`)
    fs.writeFileSync(destino, conteudo)
    const usuario = (/^ADMIN_USER=(.*)$/m.exec(exemplo) || [])[1] || 'admin'
    console.log('back/.env criado com uma JWT_SECRET nova')
    console.log(`Login inicial: ${usuario.trim()} / ${senhaAdmin}  (fica guardado em back/.env, em ADMIN_PASSWORD)`)
}
