/**
 * services/asaasService.js - Serviço de integração com Asaas
 */

const axios = require('axios');
const config = require('../config/config');

/**
 * Criar instância do Axios com configuração do Asaas
 */
function getAsaasClient() {
  const client = axios.create({
    baseURL: config.asaas.urlBase,
    headers: {
      'Access-Token': config.asaas.apiKey,
      'Content-Type': 'application/json',
    },
  });

  return client;
}

/**
 * Gerar boleto no Asaas
 * @param {object} dadosBoleto - Dados do boleto
 */
async function gerarBoleto(dadosBoleto) {
  const client = getAsaasClient();

  try {
    const response = await client.post('/customer', {
      // Mapear dados do nosso sistema para formato do Asaas
      name: dadosBoleto.cliente.nome_completo,
      cpfCnpj: dadosBoleto.cliente.cpf_cnpj,
      email: dadosBoleto.emailCliente,
      phone: dadosBoleto.telefoneCliente,
      address: {
        street: dadosBoleto.enderecoLogradouro,
        number: dadosBoleto.enderecoNumero,
        complement: dadosBoleto.enderecoComplemento,
        city: dadosBoleto.enderecoCidade,
        state: dadosBoleto.enderecoUf,
        zipCode: dadosBoleto.enderecoCep,
      },
    });

    return {
      sucesso: true,
      gatewayId: response.data.id,
      gateway: 'ASAAS',
    };
  } catch (error) {
    console.error('Erro ao gerar boleto no Asaas:', error.response?.data || error.message);
    throw new Error('Falha ao gerar boleto no gateway');
  }
}

/**
 * Consultar status de boleto no Asaas
 * @param {string} gatewayId - ID do boleto no Asaas
 */
async function consultarBoleto(gatewayId) {
  const client = getAsaasClient();

  try {
    const response = await client.get(`/payment/${gatewayId}`);

    return {
      sucesso: true,
      status: response.data.status, // PENDING, CONFIRMED, CANCELED, EXPIRED
      valor: response.data.value,
      valorPago: response.data.customerPayment,
      dataPagamento: response.data.confirmationDate,
      codigoBarras: response.data.barcode,
      vencimento: response.data.dueDate,
    };
  } catch (error) {
    console.error('Erro ao consultar boleto no Asaas:', error.response?.data || error.message);
    throw new Error('Falha ao consultar boleto no gateway');
  }
}

/**
 * Cancelar boleto no Asaas
 * @param {string} gatewayId - ID do boleto no Asaas
 */
async function cancelarBoleto(gatewayId) {
  const client = getAsaasClient();

  try {
    const response = await client.post(`/payment/${gatewayId}/cancel`);

    return {
      sucesso: response.data.status === 'CANCELED',
      mensagem: 'Boleto cancelado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao cancelar boleto no Asaas:', error.response?.data || error.message);
    throw new Error('Falha ao cancelar boleto no gateway');
  }
}

/**
 * Gerar PDF do boleto
 * @param {string} gatewayId - ID do boleto no Asaas
 */
async function gerarPdfBoleto(gatewayId) {
  const client = getAsaasClient();

  try {
    const response = await client.get(`/payment/${gatewayId}/receipt`, {
      responseType: 'arraybuffer',
    });

    return {
      sucesso: true,
      pdfBase64: Buffer.from(response.data).toString('base64'),
    };
  } catch (error) {
    console.error('Erro ao gerar PDF do boleto:', error.response?.data || error.message);
    throw new Error('Falha ao gerar PDF do boleto');
  }
}

/**
 * Calcular linha digitável (algoritmo simplificado)
 * @param {string} codigoBarras - Código de barras do boleto
 */
function calcularLinhaDigitavel(codigoBarras) {
  // O código de barras de boleto tem 44 caracteres
  // Formato: FFFFFFFFYYDDDVCVCVCVCVCVCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
  // F = Banco
  // YYY = Data de validade (dias desde 1997)
  // D = Digito de proteção
  // VVVVV = Valor nominal
  // C... = Código do cliente

  if (codigoBarras.length !== 44) {
    throw new Error('Código de barras inválido');
  }

  // Separar campos
  const campo1 = codigoBarras.substring(0, 9);
  const campo2 = codigoBarras.substring(9, 18);
  const campo3 = codigoBarras.substring(18, 27);
  const campo4 = codigoBarras.substring(27, 36);
  const campo5 = codigoBarras.substring(36);

  // Calcular dígitos verificadores (simplificado)
  function calcularDigito(block) {
    let soma = 0;
    const pesos = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    for (let i = 0; i < 9; i++) {
      const valor = parseInt(block[i]) * pesos[i];
      soma += valor > 9 ? valor - 9 : valor;
    }
    return (10 - (soma % 10)) % 10;
  }

  const dig1 = calcularDigito(campo1);
  const dig2 = calcularDigito(campo2);
  const dig3 = calcularDigito(campo3);
  const dig4 = calcularDigito(campo4);

  return `${campo1}${dig1} ${campo2}${dig2} ${campo3}${dig3} ${campo4}${dig4} ${campo5}`;
}

module.exports = {
  gerarBoleto,
  consultarBoleto,
  cancelarBoleto,
  gerarPdfBoleto,
  calcularLinhaDigitavel,
};
