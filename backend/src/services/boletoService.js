/**
 * services/boletoService.js - Serviço de gerência de boletos
 */

const { gerarPdfBoleto as gerarPdfAsaas } = require('./asaasService');
const { enviarBoletoEmail } = require('./emailService');
const { enviarBoletoWhatsApp } = require('./whatsappService');
const { Boleto, Cliente, Contato } = require('../models/index');

/**
 * Gerar boleto para um cliente
 * @param {object} dados - Dados para geração do boleto
 * @returns {object} Boleto criado
 */
async function gerarBoleto(dados) {
  const { clienteId, valor, dataVencimento, mesReferencia, anoReferencia } = dados;

  // Buscar cliente
  const cliente = await Cliente.findByPk(clienteId);

  if (!cliente) {
    throw new Error('Cliente não encontrado');
  }

  // Buscar plano
  const plano = await cliente.getPlano();

  if (!plano) {
    throw new Error('Plano não encontrado para este cliente');
  }

  // Buscar email do cliente
  const emailContato = await Contato.findOne({
    where: {
      cliente_id: clienteId,
      tipo: 'EMAIL',
      principal: true,
    },
  });

  // Buscar WhatsApp do cliente
  const WhatsAppContato = await Contato.findOne({
    where: {
      cliente_id: clienteId,
      tipo: 'WHATSAPP',
      principal: true,
    },
  });

  // Gerar boleto no Asaas
  const respostaAsaas = await gerarPdfAsaas({
    cliente,
    valor,
    dataVencimento,
    email: emailContato?.valor,
    telefone: WhatsAppContato?.valor,
  });

  // Criar registro no banco
  const boleto = await Boleto.create({
    cliente_id: clienteId,
    plano_id: cliente.plano_id,
    numero_boleto: respostaAsaas.numeroBoleto,
    nosso_numero: respostaAsaas.nossoNumero,
    valor,
    valor_pago: 0,
    data_vencimento: dataVencimento,
    data_criacao: new Date().toISOString().split('T')[0],
    data_geracao: new Date(),
    mes_referencia: mesReferencia,
    ano_referencia: anoReferencia,
    status: 'PENDING',
    gateway_id: respostaAsaas.gatewayId,
    gateway: 'ASAAS',
    url_pdf: respostaAsaas.urlPdf,
  });

  return boleto;
}

/**
 * Enviar boleto por e-mail e WhatsApp
 * @param {string} boletoId - ID do boleto
 */
async function enviarBoleto(boletoId) {
  const boleto = await Boleto.findByPk(boletoId, {
    include: [{ model: Cliente }],
  });

  if (!boleto) {
    throw new Error('Boleto não encontrado');
  }

  const cliente = boleto.Cliente;

  // Enviar e-mail
  const emailContato = await Contato.findOne({
    where: {
      cliente_id: clienteId,
      tipo: 'EMAIL',
      principal: true,
    },
  });

  if (emailContato) {
    await enviarBoletoEmail(
      emailContato.valor,
      cliente.nome_completo,
      boleto.linhaDigitavel,
      boleto.valor,
      boleto.dataVencimento,
      boleto.urlPdf
    );
  }

  // Enviar WhatsApp
  const WhatsAppContato = await Contato.findOne({
    where: {
      cliente_id: clienteId,
      tipo: 'WHATSAPP',
      principal: true,
    },
  });

  if (WhatsAppContato) {
    await enviarBoletoWhatsApp(
      WhatsAppContato.valor,
      cliente.nome_completo,
      boleto.linhaDigitavel,
      boleto.valor,
      boleto.url_pdf
    );
  }

  // Atualizar tentativas de envio
  await boleto.update({
    tentativas_envio_email: boleto.tentativas_envio_email + 1,
    tentativas_envio_whatsapp: boleto.tentativas_envio_whatsapp + 1,
    ultimo_envio_email: new Date(),
    ultimo_envio_whatsapp: new Date(),
  });

  return boleto;
}

/**
 * Registrar pagamento manual de um boleto
 * @param {string} boletoId - ID do boleto
 * @param {object} dadosPagamento - Dados do pagamento
 * @returns {object} Boleto atualizado
 */
async function registrarPagamento(boletoId, dadosPagamento) {
  const { valor_pago, data_pagamento, forma_pagamento, observacao } = dadosPagamento;

  const boleto = await Boleto.findByPk(boletoId);

  if (!boleto) {
    throw new Error('Boleto não encontrado');
  }

  // Atualizar boleto
  await boleto.update({
    valor_pago,
    data_pagamento,
    status: 'CONFIRMED',
  });

  // Criar histórico de pagamento
  await boleto.createHistoricoPagamentoBoleto({
    data_pagamento,
    valor_pago,
    forma_pagamento,
    observacao,
  });

  // Verificar se o cliente tem outros boletos pendentes
  const outrosPendentes = await Boleto.count({
    where: {
      cliente_id: boleto.cliente_id,
      status: { [Op.in]: ['PENDING', 'EXPIRED'] },
    },
  });

  // Se não há mais boletos pendentes, atualizar status do cliente
  if (outrosPendentes === 0) {
    await Cliente.update(
      { status: 'ATIVO' },
      { where: { id: boleto.cliente_id, status: 'INADIMPLENTE' } }
    );
  }

  return boleto;
}

/**
 * Baixar PDF do boleto
 * @param {string} boletoId - ID do boleto
 * @returns {string} URL do PDF
 */
async function baixarPdfBoleto(boletoId) {
  const boleto = await Boleto.findByPk(boletoId);

  if (!boleto) {
    throw new Error('Boleto não encontrado');
  }

  // Se já tem URL, retornar
  if (boleto.url_pdf) {
    return boleto.url_pdf;
  }

  // Gerar novo PDF
  const resposta = await gerarPdfAsaas(boleto.gateway_id);

  // Atualizar boleto
  await boleto.update({
    url_pdf: resposta.url_pdf,
  });

  return resposta.url_pdf;
}

/**
 * Cancelar boleto
 * @param {string} boletoId - ID do boleto
 * @returns {object} Boleto cancelado
 */
async function cancelarBoleto(boletoId) {
  const boleto = await Boleto.findByPk(boletoId);

  if (!boleto) {
    throw new Error('Boleto não encontrado');
  }

  // Cancelar no gateway
  if (boleto.gateway_id) {
    try {
      await cancelarBoletoGateway(boleto.gateway_id, boleto.gateway);
    } catch (error) {
      console.error('Erro ao cancelar no gateway:', error);
    }
  }

  // Atualizar boleto
  await boleto.update({
    status: 'CANCELED',
  });

  return boleto;
}

/**
 * Calcular linha digitável do boleto
 */
function calcularLinhaDigitavel(codigoBarras) {
  // O código de barras de boleto tem 44 caracteres
  if (!codigoBarras || codigoBarras.length !== 44) {
    throw new Error('Código de barras inválido');
  }

  // Calcular dígitos verificadores para cada campo
  function calcularDigito(campo, pesos) {
    let soma = 0;
    for (let i = 0; i < campo.length; i++) {
      soma += parseInt(campo[i]) * pesos[i];
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  const campo1 = codigoBarras.substring(0, 9);
  const campo2 = codigoBarras.substring(9, 18);
  const campo3 = codigoBarras.substring(18, 27);
  const campo4 = codigoBarras.substring(27, 36);
  const campo5 = codigoBarras.substring(36);

  const pesos1 = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const pesos2 = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const pesos3 = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  const pesos4 = [2, 1, 2, 1, 2, 1, 2, 1, 2];

  const dig1 = calcularDigito(campo1, pesos1);
  const dig2 = calcularDigito(campo2, pesos2);
  const dig3 = calcularDigito(campo3, pesos3);
  const dig4 = calcularDigito(campo4, pesos4);

  return `${campo1}${dig1} ${campo2}${dig2} ${campo3}${dig3} ${campo4}${dig4} ${campo5}`;
}

module.exports = {
  gerarBoleto,
  enviarBoleto,
  registrarPagamento,
  baixarPdfBoleto,
  cancelarBoleto,
  calcularLinhaDigitavel,
};
