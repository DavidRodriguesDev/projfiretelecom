/**
 * routes/boletoRoutes.js - Rotas de Boleto (versão simplificada)
 */

const { Op } = require('sequelize');
const { Boleto, Cliente, Plano } = require('../models/index');

async function boletoRoutes(fastify) {
  // Listar boletos
  fastify.get('/boletos', {}, async (request, reply) => {
    try {
      const boletos = await Boleto.findAll({
        limit: 20,
        order: [['data_vencimento', 'ASC']],
        include: [
          { model: Cliente, attributes: ['id', 'nome_completo'] },
          { model: Plano, attributes: ['id', 'nome'] }
        ]
      });

      reply.send({
        total: await Boleto.count(),
        page: 1,
        limit: 20,
        boletos: boletos.map(b => ({
          id: b.id,
          numero_boleto: b.numero_boleto,
          valor: b.valor,
          data_vencimento: b.data_vencimento,
          status: b.status,
          cliente_nome: b.Cliente?.nome_completo,
          plano_nome: b.Plano?.nome
        }))
      });
    } catch (error) {
      reply.code(500).send({ error: 'Erro ao listar boletos' });
    }
  });

  // Gerar boleto avulso
  fastify.post('/boletos/gerar-avulso', {}, async (request, reply) => {
    try {
      const { cliente_id, valor, mes_referencia, ano_referencia } = request.body;

      const cliente = await Cliente.findByPk(cliente_id);
      if (!cliente) {
        return reply.code(404).send({ error: 'Cliente não encontrado' });
      }

      const boleto = await Boleto.create({
        cliente_id,
        plano_id: cliente.plano_id,
        numero_boleto: `AV-${Date.now()}`,
        valor,
        mes_referencia,
        ano_referencia,
        data_vencimento: new Date(mes_referencia),
        status: 'PENDING'
      });

      reply.code(201).send({
        id: boleto.id,
        message: 'Boleto gerado com sucesso',
        boleto: boleto
      });
    } catch (error) {
      reply.code(500).send({ error: 'Erro ao gerar boleto', details: error.message });
    }
  });

  // Registrar pagamento
  fastify.post('/boletos/:id/registrar-pagamento', {}, async (request, reply) => {
    try {
      const { id } = request.params;
      const { valor_pago, data_pagamento } = request.body;

      const boleto = await Boleto.findByPk(id);
      if (!boleto) {
        return reply.code(404).send({ error: 'Boleto não encontrado' });
      }

      await boleto.update({
        valor_pago,
        data_pagamento,
        status: 'CONFIRMED'
      });

      reply.send({
        message: 'Pagamento registrado com sucesso',
        boleto
      });
    } catch (error) {
      reply.code(500).send({ error: 'Erro ao registrar pagamento' });
    }
  });
}

module.exports = boletoRoutes;
