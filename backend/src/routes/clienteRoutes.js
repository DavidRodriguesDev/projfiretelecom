/**
 * routes/clienteRoutes.js - Rotas de Clientes (versão simplificada)
 */

const { Op } = require('sequelize');
const { Cliente, Plano, Contato } = require('../models/index');

async function clienteRoutes(fastify) {
  // Listar clientes
  fastify.get('/clientes', {}, async (request, reply) => {
    try {
      const clientes = await Cliente.findAll({
        limit: 20,
        order: [['criado_em', 'DESC']],
        include: [{ model: Plano, attributes: ['nome', 'valor_mensal'] }],
      });

      reply.send({
        total: await Cliente.count(),
        page: 1,
        limit: 20,
        clientes: clientes.map(c => ({
          id: c.id,
          nome_completo: c.nome_completo,
          cpf_cnpj: c.cpf_cnpj,
          status: c.status,
          plano_nome: c.Plano?.nome,
          valor_mensal: c.Plano?.valor_mensal,
          dia_vencimento: c.dia_vencimento,
          data_inicio: c.data_inicio,
          criado_em: c.criado_em
        }))
      });
    } catch (error) {
      reply.code(500).send({ error: 'Erro ao listar clientes' });
    }
  });

  // Obter cliente por ID
  fastify.get('/clientes/:id', {}, async (request, reply) => {
    try {
      const { id } = request.params;
      const cliente = await Cliente.findByPk(id, {
        include: [{ model: Plano, attributes: ['nome', 'valor_mensal'] }]
      });

      if (!cliente) {
        return reply.code(404).send({ error: 'Cliente não encontrado' });
      }

      reply.send(cliente);
    } catch (error) {
      reply.code(500).send({ error: 'Erro ao buscar cliente' });
    }
  });

  // Criar cliente
  fastify.post('/clientes', {}, async (request, reply) => {
    try {
      const clienteData = request.body;
      const cliente = await Cliente.create(clienteData);
      reply.code(201).send({ id: cliente.id, message: 'Cliente criado com sucesso' });
    } catch (error) {
      reply.code(500).send({ error: 'Erro ao criar cliente', details: error.message });
    }
  });

  // Atualizar cliente
  fastify.put('/clientes/:id', {}, async (request, reply) => {
    try {
      const { id } = request.params;
      const cliente = await Cliente.findByPk(id);
      if (!cliente) {
        return reply.code(404).send({ error: 'Cliente não encontrado' });
      }
      await cliente.update(request.body);
      reply.send({ message: 'Cliente atualizado com sucesso' });
    } catch (error) {
      reply.code(500).send({ error: 'Erro ao atualizar cliente' });
    }
  });

  // Excluir cliente
  fastify.delete('/clientes/:id', {}, async (request, reply) => {
    try {
      const { id } = request.params;
      const cliente = await Cliente.findByPk(id);
      if (!cliente) {
        return reply.code(404).send({ error: 'Cliente não encontrado' });
      }
      await cliente.destroy();
      reply.send({ message: 'Cliente excluído com sucesso' });
    } catch (error) {
      reply.code(500).send({ error: 'Erro ao excluir cliente' });
    }
  });
}

module.exports = clienteRoutes;
