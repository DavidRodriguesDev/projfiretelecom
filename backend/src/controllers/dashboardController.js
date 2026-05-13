const {
  obterEstatisticasSistema,
  obterClientesPorStatus,
  obterFinanceiroMensal,
  obterCrescimentoClientes,
} = require('../services/dashboardService');

async function getDashboardStats(request, reply) {
  try {
    const stats = await obterEstatisticasSistema();
    reply.send(stats);
  } catch (error) {
    console.error('DASHBOARD ERROR:', error.message);
    reply.code(500).send({ error: error.message });
  }
}

async function getClientesPorStatus(request, reply) {
  try {
    const porStatus = await obterClientesPorStatus();
    reply.send(porStatus);
  } catch (error) {
    reply.code(500).send({ error: error.message });
  }
}

async function getFinanceiroMensal(request, reply) {
  try {
    const { meses = 12 } = request.query;
    const financeiro = await obterFinanceiroMensal(parseInt(meses));
    reply.send(financeiro);
  } catch (error) {
    reply.code(500).send({ error: error.message });
  }
}

async function getCrescimentoClientes(request, reply) {
  try {
    const { meses = 6 } = request.query;
    const crescimento = await obterCrescimentoClientes(parseInt(meses));
    reply.send(crescimento);
  } catch (error) {
    reply.code(500).send({ error: error.message });
  }
}

module.exports = { getDashboardStats, getClientesPorStatus, getFinanceiroMensal, getCrescimentoClientes };
