const { Boleto, Cliente } = require('../models/index');
const { Op } = require('sequelize');
const { obterFinanceiroMensal, obterCrescimentoClientes } = require('../services/dashboardService');

async function dashboardRoutes(fastify) {
  fastify.get('/dashboard/estatisticas', {}, async (request, reply) => {
    try {
      const totalClientes = await Cliente.count();
      const clientesAtivos = await Cliente.count({ where: { status: 'ATIVO' } });
      const clientesInadimplentes = await Cliente.count({ where: { status: 'INADIMPLENTE' } });
      const clientesCancelados = await Cliente.count({ where: { status: 'CANCELADO' } });
      const boletosPendentes = await Boleto.count({ where: { status: 'PENDING' } });
      const boletosPagos = await Boleto.count({ where: { status: 'CONFIRMED' } });
      const receitaPrevistaResult = await Boleto.sum('valor', { where: { status: { [Op.in]: ['PENDING', 'EXPIRED'] } } });
      const receitaRecebidaResult = await Boleto.sum('valor_pago', { where: { status: 'CONFIRMED' } });
      reply.send({
        totalClientes, clientesAtivos, clientesInadimplentes, clientesCancelados,
        boletosPendentes, boletosPagos,
        receitaPrevista: parseFloat(receitaPrevistaResult || 0),
        receitaRecebida: parseFloat(receitaRecebidaResult || 0)
      });
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/dashboard/clientes-por-status', {}, async (request, reply) => {
    try {
      const resultados = await Cliente.findAll({
        attributes: ['status', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total']],
        group: ['status']
      });
      reply.send(resultados.map(r => ({ status: r.status, total: parseInt(r.get('total'), 10) })));
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/dashboard/financeiro-mensal', {}, async (request, reply) => {
    try {
      const { meses = 12 } = request.query;
      const data = await obterFinanceiroMensal(parseInt(meses));
      reply.send(data);
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/dashboard/crescimento-clientes', {}, async (request, reply) => {
    try {
      const { meses = 6 } = request.query;
      const data = await obterCrescimentoClientes(parseInt(meses));
      reply.send(data);
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/dashboard/inadimplencia', {}, async (request, reply) => {
    try {
      const { meses = 6 } = request.query;
      const { fn, col } = require('sequelize');
      const dataInicial = new Date();
      dataInicial.setMonth(dataInicial.getMonth() - parseInt(meses));
      const resultado = await Cliente.findAll({
        attributes: [
          [fn('DATE_TRUNC', 'month', col('criado_em')), 'mes'],
          [fn('COUNT', col('id')), 'total'],
          'status'
        ],
        where: { status: { [Op.in]: ['INADIMPLENTE', 'CANCELADO'] }, criado_em: { [Op.gte]: dataInicial } },
        group: [fn('DATE_TRUNC', 'month', col('criado_em')), 'status'],
        order: [[fn('DATE_TRUNC', 'month', col('criado_em')), 'ASC']]
      });
      const porMes = {};
      resultado.forEach(r => {
        const mes = r.get('mes');
        if (!porMes[mes]) porMes[mes] = { mes, inadimplentes: 0, cancelados: 0 };
        if (r.status === 'INADIMPLENTE') porMes[mes].inadimplentes = parseInt(r.get('total'));
        if (r.status === 'CANCELADO') porMes[mes].cancelados = parseInt(r.get('total'));
      });
      reply.send(Object.values(porMes));
    } catch (error) {
      reply.code(500).send({ error: error.message });
    }
  });
}

module.exports = dashboardRoutes;
