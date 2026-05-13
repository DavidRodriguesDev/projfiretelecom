/**
 * routes/planoRoutes.js - Rotas de Planos (versão simplificada)
 */

const { Plano } = require('../models/index');

async function planoRoutes(fastify) {
  // Listar planos
  fastify.get('/planos', {}, async (request, reply) => {
    try {
      const planos = await Plano.findAll();
      reply.send({ planos });
    } catch (error) {
      reply.code(500).send({ error: 'Erro ao listar planos' });
    }
  });

  // Obter plano por ID
  fastify.get('/planos/:id', {}, async (request, reply) => {
    try {
      const { id } = request.params;
      const plano = await Plano.findByPk(id);

      if (!plano) {
        return reply.code(404).send({ error: 'Plano não encontrado' });
      }

      reply.send(plano);
    } catch (error) {
      reply.code(500).send({ error: 'Erro ao buscar plano' });
    }
  });

  // Criar plano
  fastify.post('/planos', {}, async (request, reply) => {
    try {
      const plano = await Plano.create(request.body);
      reply.code(201).send({ id: plano.id, message: 'Plano criado com sucesso' });
    } catch (error) {
      reply.code(500).send({ error: 'Erro ao criar plano', details: error.message });
    }
  });

  // Atualizar plano
  fastify.put('/planos/:id', {}, async (request, reply) => {
    try {
      const { id } = request.params;
      const plano = await Plano.findByPk(id);
      if (!plano) {
        return reply.code(404).send({ error: 'Plano não encontrado' });
      }
      await plano.update(request.body);
      reply.send({ message: 'Plano atualizado com sucesso' });
    } catch (error) {
      reply.code(500).send({ error: 'Erro ao atualizar plano' });
    }
  });

  // Excluir plano
  fastify.delete('/planos/:id', {}, async (request, reply) => {
    try {
      const { id } = request.params;
      const plano = await Plano.findByPk(id);
      if (!plano) {
        return reply.code(404).send({ error: 'Plano não encontrado' });
      }
      await plano.destroy();
      reply.send({ message: 'Plano excluído com sucesso' });
    } catch (error) {
      reply.code(500).send({ error: 'Erro ao excluir plano' });
    }
  });
}

module.exports = planoRoutes;
