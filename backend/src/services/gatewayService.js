/**
 * services/gatewayService.js - Serviço de gerência de gateways
 */

const { gerarBoletoAsaas, consultarBoletoAsaas, cancelarBoletoAsaas, baixarPdfBoleto } = require('./integrations/asaasService');
const config = require('../config/config');

/**
 * Obter instância do gateway ativo
 */
function getGateway() {
  return config.asaas.environment;
}

/**
 * Gerar boleto no gateway ativo
 * @param {object} dadosBoleto - Dados do boleto
 */
async function gerarBoletoGateway(dadosBoleto) {
  const gateway = getGateway();

  switch (gateway) {
    case 'ASAAS':
      return await gerarBoletoAsaas(dadosBoleto);
    case 'EFIE':
    case 'GERENCIANET':
    default:
      return await gerarBoletoAsaas(dadosBoleto);
  }
}

/**
 * Consultar status do boleto no gateway ativo
 * @param {string} gatewayId - ID do boleto no gateway
 */
async function consultarBoletoGateway(gatewayId) {
  const gateway = getGateway();

  switch (gateway) {
    case 'ASAAS':
      return await consultarBoletoAsaas(gatewayId);
    case 'EFIE':
    case 'GERENCIANET':
    default:
      return await consultarBoletoAsaas(gatewayId);
  }
}

/**
 * Cancelar boleto no gateway ativo
 * @param {string} gatewayId - ID do boleto no gateway
 */
async function cancelarBoletoGateway(gatewayId) {
  const gateway = getGateway();

  switch (gateway) {
    case 'ASAAS':
      return await cancelarBoletoAsaas(gatewayId);
    case 'EFIE':
    case 'GERENCIANET':
    default:
      return await cancelarBoletoAsaas(gatewayId);
  }
}

/**
 * Baixar PDF do boleto no gateway ativo
 * @param {string} gatewayId - ID do boleto no gateway
 */
async function baixarPdfGateway(gatewayId) {
  const gateway = getGateway();

  switch (gateway) {
    case 'ASAAS':
      return await baixarPdfBoleto(gatewayId);
    case 'EFIE':
    case 'GERENCIANET':
    default:
      return await baixarPdfBoleto(gatewayId);
  }
}

module.exports = {
  gerarBoletoGateway,
  consultarBoletoGateway,
  cancelarBoletoGateway,
  baixarPdfGateway,
  getGateway,
};