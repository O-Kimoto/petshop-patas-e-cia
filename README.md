# Patas & Cia · Petshop

Sistema fullstack para um petshop: cadastro de tutores, pets, serviços e produtos, agendamentos com
histórico de atendimentos e um painel com o resumo do dia.

- **Front:** Angular 16 + PrimeNG (template Sakai)
- **API:** Node.js + Express, banco SQLite, login com JWT (senhas com bcrypt) e documentação no Swagger

## O que o sistema faz

| Tela | O que tem |
|------|-----------|
| Painel | Agendamentos de hoje, totais, faturamento do mês, próximos agendamentos, gráfico por status e alerta de estoque baixo |
| Agendamentos | Marcar, confirmar, concluir e cancelar; filtro por status e por dia; não deixa o mesmo pet em dois agendamentos no mesmo horário |
| Histórico | Atendimentos de um tutor ou de um pet, com total gasto, último atendimento e próximo agendamento |
| Tutores | Cadastro com telefone validado, endereço pelo CEP (ViaCEP), cidades pelo IBGE e botão do WhatsApp |
| Pets | Cadastro ligado ao tutor, filtro por tutor e atalho para o histórico |
| Serviços | Preços de banho, tosa, consulta etc. e reajuste em % (todos ou só os marcados, com prévia) |
| Produtos | Estoque com botões de entrada e saída, valor total em estoque e filtro por categoria |
| Usuários | Quem acessa o sistema; ninguém consegue excluir o próprio usuário |
| Login | Entrar; o "Criar conta" só aparece com `CADASTRO_PUBLICO=sim` no `back/.env` (vem desligado) |

O valor de cada agendamento é guardado no dia em que ele é marcado, então um reajuste de preço não muda o
histórico nem o faturamento de meses anteriores.

## Como rodar

Precisa do Node.js 18 ou mais novo.

```bash
npm run setup
npm start
```

O `setup` instala as dependências do back e do front, cria o `back/.env` com uma chave JWT e uma senha de
administrador aleatórias e gera o build do front. Depois do `npm start`, tudo fica no mesmo endereço:

- Sistema: http://localhost:3000
- Documentação da API (Swagger): http://localhost:3000/api-docs

Login inicial: o usuário `admin` com a senha que o `setup` mostrou no terminal. Ela fica guardada em
`back/.env` (`ADMIN_PASSWORD`). Esse usuário só é criado quando o banco está vazio; se o banco foi criado
antes, com a senha antiga `admin123`, a API avisa no terminal até ela ser trocada na tela de Usuários.

No GitHub Codespaces o `setup` roda sozinho ao criar o ambiente e o servidor liga sozinho na porta 3000.
Essa porta fica **pública** (qualquer pessoa com o link abre o sistema), por isso o "Criar conta" vem
desligado: novos usuários são criados por quem já está logado, na tela de Usuários.

### Desenvolvimento (com recarga automática)

Em dois terminais:

```bash
npm run dev:back
```

```bash
npm run dev:front
```

O front abre em http://localhost:4200 e conversa com a API na porta 3000.

## Estrutura

```
back/
  bin/www              sobe o servidor depois de preparar o banco e os dados iniciais
  app.js               rotas, CORS, Swagger e tratamento de erros
  db/                  conexão SQLite, criação das tabelas e dados de exemplo (seed)
  routes/              rotas REST (com a documentação do Swagger em comentários)
  controllers/         validações e regras de cada recurso
  models/              consultas SQL
front/src/app/
  layout/              menu, barra superior e tema
  main/                uma pasta por tela (agendamento, historico, tutor, pet, servico, produto, usuario, dashboard)
  main/shared/         CRUD genérico, formatos de data/telefone e consulta de CEP
```

O banco fica em `back/db/petshop.db` e é criado na primeira vez que a API sobe. Para começar do zero, é só
apagar esse arquivo.

## Equipe

Otávio Michels, Gabriel França e Apolo Lins.
