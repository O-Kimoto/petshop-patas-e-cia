const path = require('path')
const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

// Esquemas reaproveitados pelas rotas (via $ref) para não repetir os campos em cada endpoint - [Otávio Michels]
const schemas = {
    Mensagem: {
        type: 'object',
        properties: { message: { type: 'string' } }
    },
    Erro: {
        type: 'object',
        properties: { message: { type: 'string', example: 'Campos obrigatórios não preenchidos: nome' } }
    },
    Credenciais: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
            username: { type: 'string', example: 'admin' },
            password: { type: 'string', example: 'admin123' }
        }
    },
    UsuarioInput: {
        type: 'object',
        required: ['nome', 'username'],
        properties: {
            nome: { type: 'string', example: 'Gabriel França' },
            username: { type: 'string', example: 'gabriel' },
            password: { type: 'string', example: 'senha123', description: 'Obrigatória ao criar; opcional ao editar' }
        }
    },
    Usuario: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            nome: { type: 'string', example: 'Gabriel França' },
            username: { type: 'string', example: 'gabriel' },
            criado_em: { type: 'string', example: '2026-10-29 03:00:00' }
        }
    },
    TutorInput: {
        type: 'object',
        required: ['nome', 'telefone'],
        properties: {
            nome: { type: 'string', example: 'Maria Silva' },
            email: { type: 'string', example: 'maria.silva@email.com' },
            telefone: { type: 'string', example: '(81) 99999-1234' },
            cep: { type: 'string', example: '50030-230' },
            logradouro: { type: 'string', example: 'Rua do Bom Jesus' },
            numero: { type: 'string', example: '125' },
            complemento: { type: 'string', example: 'Apto 201' },
            bairro: { type: 'string', example: 'Recife' },
            cidade: { type: 'string', example: 'Recife' },
            uf: { type: 'string', example: 'PE' }
        }
    },
    Tutor: {
        allOf: [
            { type: 'object', properties: { id: { type: 'integer', example: 1 } } },
            { $ref: '#/components/schemas/TutorInput' },
            { type: 'object', properties: { total_pets: { type: 'integer', example: 2 } } }
        ]
    },
    PetInput: {
        type: 'object',
        required: ['nome', 'especie', 'sexo', 'tutor_id'],
        properties: {
            nome: { type: 'string', example: 'Thor' },
            especie: { type: 'string', example: 'Cachorro' },
            raca: { type: 'string', example: 'Labrador' },
            sexo: { type: 'string', enum: ['M', 'F'], example: 'M' },
            tutor_id: { type: 'integer', example: 1 }
        }
    },
    Pet: {
        allOf: [
            { type: 'object', properties: { id: { type: 'integer', example: 1 } } },
            { $ref: '#/components/schemas/PetInput' },
            { type: 'object', properties: { tutor_nome: { type: 'string', example: 'Maria Silva' } } }
        ]
    },
    ServicoInput: {
        type: 'object',
        required: ['nome', 'preco'],
        properties: {
            nome: { type: 'string', example: 'Banho' },
            descricao: { type: 'string', example: 'Banho com shampoo neutro, secagem e perfume' },
            preco: { type: 'number', example: 50 }
        }
    },
    Servico: {
        allOf: [
            { type: 'object', properties: { id: { type: 'integer', example: 1 } } },
            { $ref: '#/components/schemas/ServicoInput' }
        ]
    },
    ProdutoInput: {
        type: 'object',
        required: ['nome', 'preco', 'estoque'],
        properties: {
            nome: { type: 'string', example: 'Ração Premium Cães Adultos 15 kg' },
            descricao: { type: 'string', example: 'Ração seca sabor frango e arroz' },
            categoria: { type: 'string', example: 'Ração', description: 'Ração, Brinquedos, Medicamentos, Acessórios ou Higiene' },
            preco: { type: 'number', example: 219.9 },
            estoque: { type: 'integer', example: 12 }
        }
    },
    Produto: {
        allOf: [
            { type: 'object', properties: { id: { type: 'integer', example: 1 } } },
            { $ref: '#/components/schemas/ProdutoInput' }
        ]
    },
    AgendamentoInput: {
        type: 'object',
        required: ['tutor_id', 'pet_id', 'servico_id', 'data_hora'],
        properties: {
            tutor_id: { type: 'integer', example: 1 },
            pet_id: { type: 'integer', example: 1 },
            servico_id: { type: 'integer', example: 1 },
            data_hora: { type: 'string', example: '2026-11-05T14:30', description: 'Formato AAAA-MM-DDTHH:MM' },
            status: { type: 'string', enum: ['Agendado', 'Confirmado', 'Concluído', 'Cancelado'], example: 'Agendado' },
            observacoes: { type: 'string', example: 'Pet tem medo de secador' }
        }
    },
    Agendamento: {
        allOf: [
            { type: 'object', properties: { id: { type: 'integer', example: 1 } } },
            { $ref: '#/components/schemas/AgendamentoInput' },
            {
                type: 'object',
                properties: {
                    tutor_nome: { type: 'string', example: 'Maria Silva' },
                    pet_nome: { type: 'string', example: 'Thor' },
                    pet_especie: { type: 'string', example: 'Cachorro' },
                    servico_nome: { type: 'string', example: 'Banho' },
                    servico_preco: { type: 'number', example: 50 }
                }
            }
        ]
    }
}

// Respostas de erro comuns a todas as rotas protegidas - [Otávio Michels]
const responses = {
    NaoAutenticado: {
        description: 'Token ausente, inválido ou expirado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } }
    },
    NaoEncontrado: {
        description: 'Registro não encontrado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } }
    },
    Invalido: {
        description: 'Dados inválidos ou campos obrigatórios faltando',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } }
    },
    EmUso: {
        description: 'Registro ligado a outros e não pode ser excluído',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } }
    }
}

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Petshop',
            version: '1.0.0',
            description:
                'API REST do sistema de petshop: tutores, pets, serviços, produtos, agendamentos e usuários. ' +
                'Faça login em **POST /auth/login**, copie o token e clique em **Authorize** para testar as rotas protegidas.'
        },
        servers: [{ url: '/api', description: 'Este servidor' }],
        // Ordem dos grupos na página do Swagger - [Otávio Michels]
        tags: [
            { name: 'Auth', description: 'Login, cadastro e usuário logado' },
            { name: 'Tutores', description: 'Donos dos pets' },
            { name: 'Pets', description: 'Animais, ligados a um tutor (tutor_id)' },
            { name: 'Serviços', description: 'Banho, tosa, consulta, vacinação...' },
            { name: 'Produtos', description: 'Ração, brinquedos, medicamentos, com estoque' },
            { name: 'Agendamentos', description: 'Tutor + pet + serviço + data/hora + status' },
            { name: 'Usuários', description: 'Quem acessa o sistema' },
            { name: 'Dashboard', description: 'Resumo do painel inicial' }
        ],
        components: {
            securitySchemes: {
                BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
            },
            parameters: {
                IdPath: { in: 'path', name: 'id', required: true, description: 'ID do registro', schema: { type: 'integer' } }
            },
            schemas,
            responses
        },
        security: [{ BearerAuth: [] }]
    },
    // Caminho absoluto (com "/" mesmo no Windows, exigido pelo glob): o servidor pode ser iniciado de qualquer pasta - [Otávio Michels]
    apis: [path.join(__dirname, 'routes', '*.js').replace(/\\/g, '/')]
}

const swaggerSpec = swaggerJSDoc(options)

module.exports = { swaggerUi, swaggerSpec }
