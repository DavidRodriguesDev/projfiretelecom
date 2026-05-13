const axios = require('axios');
const config = require('../config/config');

const INSTANCE = process.env.WHATSAPP_INSTANCE || 'firetelecom3';
const API_URL = process.env.WHATSAPP_API_URL || 'http://localhost:8080';
const API_KEY = process.env.WHATSAPP_API_TOKEN || 'firetelecom123';

function getClient() {
  return axios.create({
    baseURL: API_URL,
    headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
  });
}

async function enviarMensagemWhatsApp(telefone, mensagem) {
  const client = getClient();
  const numero = telefone.replace(/[^\d]/g, '');
  const response = await client.post(`/message/sendText/${INSTANCE}`, {
    number: numero,
    text: mensagem,
  });
  return { sucesso: true, messageId: response.data.key?.id, to: numero };
}

async function enviarBoletoWhatsApp(telefone, nomeCliente, linhaDigitavel, valor, urlPdf) {
  const mensagem = [
    `*Fire Telecom*`,
    ``,
    `Olá, ${nomeCliente}!`,
    ``,
    `Seu boleto está disponível.`,
    ``,
    `*Linha Digitável:*`,
    `${linhaDigitavel}`,
    ``,
    `*Valor:* R$ ${valor}`,
    urlPdf ? `\nBaixe seu boleto: ${urlPdf}` : ``,
    ``,
    `Obrigado por ser nosso cliente!`,
  ].join('\n');
  return enviarMensagemWhatsApp(telefone, mensagem);
}

async function enviarLembreteVencimentoWhatsApp(telefone, nomeCliente, diasAtraso, linhaDigitavel, urlPdf) {
  const mensagem = [
    `*Fire Telecom*`,
    ``,
    `Olá, ${nomeCliente}!`,
    ``,
    diasAtraso > 0 ? `⚠️ Seu boleto está ${diasAtraso} dia(s) vencido.` : `Seu boleto vence em breve!`,
    ``,
    `*Linha Digitável:*`,
    `${linhaDigitavel}`,
    urlPdf ? `\nBaixe seu boleto: ${urlPdf}` : ``,
    ``,
    `Fique em dia com seus pagamentos!`,
  ].join('\n');
  return enviarMensagemWhatsApp(telefone, mensagem);
}

async function testarConexaoWhatsApp() {
  try {
    const client = getClient();
    const response = await client.get(`/instance/fetchInstances`);
    const instancia = response.data.find(i => i.name === INSTANCE);
    return {
      conectado: instancia?.connectionStatus === 'open',
      status: instancia?.connectionStatus,
      mensagem: instancia?.connectionStatus === 'open' ? 'WhatsApp conectado' : 'WhatsApp desconectado',
    };
  } catch (error) {
    return { conectado: false, erro: error.message };
  }
}

module.exports = {
  enviarMensagemWhatsApp,
  enviarBoletoWhatsApp,
  enviarLembreteVencimentoWhatsApp,
  testarConexaoWhatsApp,
};
