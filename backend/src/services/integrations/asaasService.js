/**
 * services/integrations/asaasService.js - Serviço de integração com Asaas
 */

const axios = require('axios');
const config = require('../../config/config');

/**
 * Criar instância do Axios com configuração do Asaas
 */
function getAsaasClient() {
  if (!config.asaas.apiKey) {
    throw new Error('ASAAS_API_KEY não configurada no .env');
  }

  return axios.create({
    baseURL: config.asaas.urlBase,
    headers: {
      'Access-Token': config.asaas.apiKey,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Criar cliente no Asaas
 * @param {object} dadosCliente - Dados do cliente
 */
async function criarClienteAsaas(dadosCliente) {
  const client = getAsaasClient();

  try {
    const response = await client.post('/customers', {
      name: dadosCliente.nome_completo,
      cpfCnpj: dadosCliente.cpf_cnpj,
      email: dadosCliente.email || '',
      phone: dadosCliente.telefone || '',
      mobilePhone: dadosCliente.whatsapp || '',
      address: {
        street: dadosCliente.endereco_logradouro || '',
        number: dadosCliente.endereco_numero || '',
        complement: dadosCliente.endereco_complemento || '',
        district: dadosCliente.endereco_bairro || '',
        zipCode: dadosCliente.endereco_cep || '',
        city: dadosCliente.endereco_cidade || '',
        state: dadosCliente.endereco_uf || '',
      },
      externalReference: dadosCliente.id,
      disableCampaigns: true,
    });

    return {
      sucesso: true,
      gatewayId: response.data.id,
      gateway: 'ASAAS',
      dados: response.data,
    };
  } catch (error) {
    console.error('Erro ao criar cliente no Asaas:', error.response?.data || error.message);
    throw new Error(`Falha ao criar cliente no gateway: ${error.message}`);
  }
}

/**
 * Gerar boleto no Asaas
 * @param {object} dadosBoleto - Dados do boleto
 */
async function gerarBoletoAsaas(dadosBoleto) {
  const client = getAsaasClient();

  try {
    // Obter ID do cliente no Asaas (ou criar novo)
    let customerExternalReference = dadosBoleto.cliente.gateway_id;
    if (!customerExternalReference) {
      const clienteCadastrado = await criarClienteAsaas(dadosBoleto.cliente);
      customerExternalReference = clienteCadastrado.gatewayId;
    }

    const response = await client.post('/payments', {
      customer: customerExternalReference,
      value: dadosBoleto.valor,
      dueDate: dadosBoleto.data_vencimento,
      totalValue: dadosBoleto.valor,
      scheduleFIXEDDate: dadosBoleto.data_vencimento,
      billingType: 'BOLETO',
      description: `${dadosBoleto.descricao || 'Mensalidade'} - ${dadosBoleto.cliente.nome_completo}`,
      externalReference: dadosBoleto.id,
    });

    return {
      sucesso: true,
      gatewayId: response.data.id,
      gateway: 'ASAAS',
      nossoNumero: response.data.ourNumber,
      linhaDigitavel: response.data.barcode,
      urlPdf: response.data.digitalInvoiceUrl,
      status: response.data.status,
      valor: response.data.value,
      dataVencimento: response.data.dueDate,
      dadosCompletos: response.data,
    };
  } catch (error) {
    console.error('Erro ao gerar boleto no Asaas:', error.response?.data || error.message);
    throw new Error(`Falha ao gerar boleto no gateway: ${error.message}`);
  }
}

/**
 * Consultar status de boleto no Asaas
 * @param {string} gatewayId - ID do boleto no Asaas
 */
async function consultarBoletoAsaas(gatewayId) {
  const client = getAsaasClient();

  try {
    const response = await client.get(`/payments/${gatewayId}`);

    return {
      sucesso: true,
      status: response.data.status,
      valor: response.data.value,
      valorPago: response.data.paidValue,
      dataPagamento: response.data.confirmationDate,
      dataVencimento: response.data.dueDate,
      codigoBarras: response.data.barcode,
      linhaDigitavel: response.data.barcode,
      dadosCompletos: response.data,
    };
  } catch (error) {
    console.error('Erro ao consultar boleto no Asaas:', error.response?.data || error.message);
    throw new Error(`Falha ao consultar boleto: ${error.message}`);
  }
}

/**
 * Cancelar boleto no Asaas
 * @param {string} gatewayId - ID do boleto no Asaas
 */
async function cancelarBoletoAsaas(gatewayId) {
  const client = getAsaasClient();

  try {
    const response = await client.post(`/payments/${gatewayId}/cancel`);

    return {
      sucesso: true,
      status: response.data.status,
      mensagem: 'Boleto cancelado com sucesso',
    };
  } catch (error) {
    console.error('Erro ao cancelar boleto no Asaas:', error.response?.data || error.message);
    throw new Error(`Falha ao cancelar boleto: ${error.message}`);
  }
}

/**
 * Baixar PDF do boleto
 * @param {string} gatewayId - ID do boleto no Asaas
 */
async function baixarPdfBoleto(gatewayId) {
  const client = getAsaasClient();

  try {
    const response = await client.get(`/payments/${gatewayId}/receiptPdf`, {
      responseType: 'arraybuffer',
    });

    return {
      sucesso: true,
      pdfBase64: Buffer.from(response.data).toString('base64'),
      tamanho: response.data.byteLength,
    };
  } catch (error) {
    console.error('Erro ao baixar PDF do boleto:', error.response?.data || error.message);
    throw new Error(`Falha ao baixar PDF: ${error.message}`);
  }
}

/**
 * Gerar linha digitável (algoritmo simplificado para boletos巴西)
 * @param {string} codigoBarras - Código de barras do boleto (44 dígitos)
 */
function calcularLinhaDigitavel(codigoBarras) {
  if (!codigoBarras || codigoBarras.length !== 44) {
    throw new Error('Código de barras inválido. Deve ter 44 dígitos.');
  }

  // Separar os campos
  // FFFFFFFFYYDDDVCVCVCVCVCVCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC
  // F = Banco (3 dígitos)
  // YYDDD = Data de validade
  // D = Dígito de proteção
  // VVVVV = Valor nominal
  // C... = Código do cliente (25 dígitos)

  const campo1 = codigoBarras.substring(0, 9);
  const campo2 = codigoBarras.substring(9, 18);
  const campo3 = codigoBarras.substring(18, 27);
  const campo4 = codigoBarras.substring(27, 36);
  const campo5 = codigoBarras.substring(36);

  // Função para calcular dígito verificador
  function calcularDigito(bloco) {
    const pesos = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let soma = 0;

    for (let i = 0; i < 9; i++) {
      const valor = parseInt(bloco[i]) * pesos[i];
      soma += valor > 9 ? valor - 9 : valor;
    }

    const resto = soma % 10;
    return resto === 0 ? 0 : 10 - resto;
  }

  // Calcular dígitos verificadores para cada campo
  const dig1 = calcularDigito(campo1);
  const dig2 = calcularDigito(campo2);
  const dig3 = calcularDigito(campo3);
  const dig4 = calcularDigito(campo4);

  // Retornar no formato: campo-digito campo-digito campo-digito campo-digito campo
  return `${campo1}-${dig1} ${campo2}-${dig2} ${campo3}-${dig3} ${campo4}-${dig4} ${campo5}`;
}

/**
 * Validar código de barras de boleto
 * @param {string} codigoBarras - Código de barras
 */
function validarCodigoBarras(codigoBarras) {
  const limpo = String(codigoBarras).replace(/[^\d]/g, '');

  // Deve ter 44 dígitos
  if (limpo.length !== 44) {
    return false;
  }

  // Deve ser numérico
  if (!/^\d+$/.test(limpo)) {
    return false;
  }

  return true;
}

/**
 * Criar campo de código de barras para boleto
 * @param {string} banco - Código do banco (ex: '341' para Itaú)
 * @param {string} moeda - Código da moeda (ex: '9' para Real)
 * @param {string} dvDigitado - DígitoVerificador digitado
 * @param {string} fatorVencimento - Fator de vencimento (ex: '3189' para 2023-05-04)
 * @param {string} valor - Valor sem ponto decimal (ex: '00000100' para R$ 1,00)
 * @param {string} nossoNumero - Nosso número (8-11 dígitos)
 * @param {string} carteira - Código da carteira (ex: '18' para Cobrança Simples)
 * @param {string} cedente - Número do cedente (14 dígitos)
 * @param {string}.agencia - Código da agência (4 dígitos)
 * @param {string} dac - Dígito auto-verificador da agência (1 dígito)
 */
function gerarCodigoBarrasBanco({
  banco,
  moeda,
  dvDigitado,
  fatorVencimento,
  valor,
  nossoNumero,
  carteira,
  cedente,
  agencia,
  dac,
}) {
  // Para simplificar, vamos apenas validar que todos os parâmetros estão presentes
  // Na prática, a geração do código de barras requer cálculos mais complexos

  if (!banco || !moeda || !fatorVencimento || !valor) {
    throw new Error('Parâmetros obrigatórios ausentes');
  }

  // O código de barras é formato: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  // onde cada posição tem um significado específico
  // Como a geração completa requer cálculos de dígitos específicos, vamos delegar isso
  // ao Asaas que já faz isso corretamente.

  return null;
}

module.exports = {
  gerarBoletoAsaas,
  consultarBoletoAsaas,
  cancelarBoletoAsaas,
  baixarPdfBoleto,
  calcularLinhaDigitavel,
  validarCodigoBarras,
  criarClienteAsaas,
  getAsaasClient,
};