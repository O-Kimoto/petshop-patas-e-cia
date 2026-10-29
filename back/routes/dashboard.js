const express = require('express')
const authenticateToken = require('../middleware/auth')
const { asyncHandler } = require('../controllers/helpers')
const { resumo } = require('../controllers/dashboardController')
const router = express.Router()

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Resumo do painel inicial (totais, próximos agendamentos, estoque baixo, agendamentos por status)
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: hoje
 *         required: false
 *         description: Data de hoje no fuso do usuário (AAAA-MM-DD)
 *         schema:
 *           type: string
 *           example: '2026-10-29'
 *     responses:
 *       200:
 *         description: Resumo do petshop
 *       401:
 *         $ref: '#/components/responses/NaoAutenticado'
 */
router.get('/', authenticateToken, asyncHandler(resumo))

module.exports = router
