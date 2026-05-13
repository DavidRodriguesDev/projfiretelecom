/**
 * jobs/gerarBoletosJob.js - Job para geração automática de boletos
 */

const { Cliente, Plano, Boleto } = require('../models/index');
const { Op } = require('sequelize');
const config = require('../config/config');

/**
 * Calcular data de vencimento baseada no dia do mês
 * @param {number} diaVencimento - Dia do vencimento (1-28)
 * @param {Date} dataReferencia - Data de referência
 * @returns {Date} Data de vencimento
 */
function calcularDataVencimento(diaVencimento, dataReferencia) {
  const diaAtual = new Date(dataReferencia).getDate();

  // Se o dia de vencimento já passou neste mês, vencimento será no próximo mês
  if (diaAtual > diaVencimento) {
    const dataVencimento = new Date(dataReferencia);
    dataVencimento.setMonth(dataVencimento.getMonth() + 1);
    dataVencimento.setDate(diaVencimento);
    return dataVencimento;
  }

  // Se ainda não passou, vencimento é neste mês
  const dataVencimento = new Date(dataReferencia);
  dataVencimento.setDate(diaVencimento);
  return dataVencimento;
}

/**
 * Verificar se cliente tem boletos pendentes
 * @param {string} clienteId - ID do cliente
 * @param {Date} mesReferencia - Mês de referência
 * @returns {boolean} true se já tem boleto
 */
async function clienteTemBoletoPendente(clienteId, mesReferencia) {
  const dataInicio = new Date(mesReferencia);
  dataInicio.setDate(1);

  const dataFim = new Date(dataInicio);
  dataFim.setMonth(dataFim.getMonth() + 1);

  const possuiBoleto = await Boleto.findOne({
    where: {
      cliente_id: clienteId,
      mes_referencia: {
        [Op.gte]: dataInicio,
        [Op.lt]: dataFim,
      },
    },
  });

  return !!possuiBoleto;
}

/**
 * Geração de boletos para todos os clientes ativos
 */
async function gerarBoletos() {
  console.log('[Gerar Boletos] Iniciando geração de boletos...');

  try {
    // Buscar todos os clientes ativos
    const clientes = await Cliente.findAll({
      where: {
        status: 'ATIVO',
      },
      include: [
        { model: Plano, attributes: ['id', 'nome', 'velocidade', 'valor_mensal'] },
      ],
    });

    console.log(`[Gerar Boletos] Encontrados ${clientes.length} clientes ativos`);

    // Obter data atual para referência
    const dataAtual = new Date();
    const mesReferencia = new Date();
    mesReferencia.setDate(1); // Começar do primeiro dia do mês atual

    let totalGerados = 0;
    let totalPulados = 0;

    for (const cliente of clientes) {
      // Verificar se já tem boleto para este mês
      const temBoleto = await clienteTemBoletoPendente(cliente.id, mesReferencia);

      if (temBoleto) {
        totalPulados++;
        console.log(`[Gerar Boletos] Cliente ${cliente.nome_completo} já tem boleto para este mês`);
        continue;
      }

      // Calcular data de vencimento
      const dataVencimento = calcularDataVencimento(
        cliente.dia_vencimento,
        mesReferencia
      );

      // Criar boleto
      const boleto = await Boleto.create({
        cliente_id: cliente.id,
        plano_id: cliente.plano_id,
        numero_boleto: `BT-${Date.now()}-${cliente.id.slice(0, 8)}`,
        nosso_numero: `000000000000000000000000000000000000000000000000`,
        valor: cliente.Plano.valor_mensal,
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        data_criacao: dataAtual.toISOString().split('T')[0],
        data_geracao: dataAtual,
        mes_referencia: mesReferencia.toISOString().split('T')[0],
        ano_referencia: mesReferencia.getFullYear(),
        status: 'PENDING',
        gateway: config.asaas.environment,
      });

      totalGerados++;
      console.log(`[Gerar Boletos] Boleto criado para ${cliente.nome_completo}: ${boleto.id}`);
    }

    console.log(`[Gerar Boletos] Processamento concluído!`);
    console.log(`[Gerar Boletos] Total gerados: ${totalGerados}`);
    console.log(`[Gerar Boletos] Total pulados: ${totalPulados}`);

    return {
      sucesso: true,
      totalGerados,
      totalPulados,
    };
  } catch (error) {
    console.error('[Gerar Boletos] Erro durante a geração:', error);
    throw error;
  }
}

module.exports = {
  gerarBoletos,
  calcularDataVencimento,
  clienteTemBoletoPendente,
};
