/**
 * services/dashboardService.js - Serviço de dashboard e estatísticas
 */

const { Boleto, Cliente, Plano } = require('../models/index');
const { Op, fn, col } = require('sequelize');

/**
 * Obter estatísticas do sistema
 */
async function obterEstatisticasSistema() {
  // Total de clientes
  const totalClientes = await Cliente.count();
  const clientesAtivos = await Cliente.count({ where: { status: 'ATIVO' } });
  const clientesInadimplentes = await Cliente.count({ where: { status: 'INADIMPLENTE' } });
  const clientesCancelados = await Cliente.count({ where: { status: 'CANCELADO' } });
  const clientesSuspensos = await Cliente.count({ where: { status: 'SUSPENSO' } });

  // Boleto
  const boletosPendentes = await Boleto.count({ where: { status: 'PENDING' } });
  const boletosPagos = await Boleto.count({ where: { status: 'CONFIRMED' } });
  const boletosVencidos = await Boleto.count({ where: { status: 'EXPIRED' } });
  const boletosCancelados = await Boleto.count({ where: { status: 'CANCELED' } });

  // Finanças
  const receitaPrevistaResult = await Boleto.sum('valor', {
    where: { status: { [Op.in]: ['PENDING', 'EXPIRED'] } },
  });
  const receitaPrevista = parseFloat(receitaPrevistaResult || 0);

  const receitaRecebidaResult = await Boleto.sum('valor_pago', {
    where: { status: 'CONFIRMED' },
  });
  const receitaRecebida = parseFloat(receitaRecebidaResult || 0);

  return {
    totalClientes,
    clientesAtivos,
    clientesInadimplentes,
    clientesCancelados,
    clientesSuspensos,
    boletosPendentes,
    boletosPagos,
    boletosVencidos,
    boletosCancelados,
    receitaPrevista,
    receitaRecebida,
  };
}

/**
 * Obter clientes por status
 */
async function obterClientesPorStatus() {
  const resultados = await Cliente.findAll({
    attributes: [
      'status',
      [fn('count', col('id')), 'total'],
    ],
    group: ['status'],
    order: [[fn('count', col('id')), 'DESC']],
  });

  return resultados.map((r) => ({
    status: r.status,
    total: parseInt(r.get('total'), 10),
  }));
}

/**
 * Obter financeiro mensal
 */
async function obterFinanceiroMensal(meses = 12) {
  const dataInicial = new Date();
  dataInicial.setMonth(dataInicial.getMonth() - meses);

  const resultados = await Boleto.findAll({
    attributes: [
      [fn('DATE_TRUNC', 'month', col('data_vencimento')), 'mes'],
      [fn('COUNT', col('id')), 'total_boletos'],
      [fn('SUM', col('valor')), 'valor_total'],
      [fn('SUM', col('valor_pago')), 'valor_pago'],
    ],
    where: {
      data_vencimento: {
        [Op.gte]: dataInicial,
      },
    },
    group: [fn('DATE_TRUNC', 'month', col('data_vencimento'))],
    order: [[fn('DATE_TRUNC', 'month', col('data_vencimento')), 'DESC']],
  });

  return resultados.map((r) => ({
    mes: r.get('mes'),
    totalBoletos: parseInt(r.get('total_boletos'), 10),
    valorTotal: parseFloat(r.get('valor_total') || 0),
    valorPago: parseFloat(r.get('valor_pago') || 0),
  }));
}

/**
 * Obter crescimento de clientes
 */
async function obterCrescimentoClientes(meses = 6) {
  const dataInicial = new Date();
  dataInicial.setMonth(dataInicial.getMonth() - meses);

  const resultados = await Cliente.findAll({
    attributes: [
      [fn('DATE_TRUNC', 'month', col('criado_em')), 'mes'],
      [fn('COUNT', col('id')), 'total'],
    ],
    where: {
      criado_em: {
        [Op.gte]: dataInicial,
      },
    },
    group: [fn('DATE_TRUNC', 'month', col('criado_em'))],
    order: [[fn('DATE_TRUNC', 'month', col('criado_em')), 'ASC']],
  });

  return resultados.map((r) => ({
    mes: r.get('mes'),
    total: parseInt(r.get('total'), 10),
  }));
}

module.exports = {
  obterEstatisticasSistema,
  obterClientesPorStatus,
  obterFinanceiroMensal,
  obterCrescimentoClientes,
};
