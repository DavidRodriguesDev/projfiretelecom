/**
 * workers/index.js - Inicialização dos Workers
 */

require('dotenv').config();

const Bull = require('bull');
const { redisQueueClient } = require('../src/config/redis');
const { gerarBoletos } = require('../src/jobs/gerarBoletosJob');
const { enviarLembretes } = require('../src/jobs/enviarLembretesJob');

// Criar filas
const emailQueue = new Bull('email:enviar', redisQueueClient);
const whatsappQueue = new Bull('whatsapp:enviar', redisQueueClient);
const boletoQueue = new Bull('boleto:gerar', redisQueueClient);

// Processar fila de e-mails
emailQueue.process(async (job) => {
  console.log('[Email Queue] Processando job:', job.id);

  const { destinatario, assunto, mensagemHtml, pdfBase64, nomeArquivo } = job.data;

  // AQUI Faria o envio real com Nodemailer
  // Para este exemplo, apenas logamos
  console.log(`[Email Queue] Enviando para: ${destinatario}`);
  console.log(`[Email Queue] Assunto: ${assunto}`);

  return { success: true, messageId: job.id };
});

// Processar fila de WhatsApp
whatsappQueue.process(async (job) => {
  console.log('[WhatsApp Queue] Processando job:', job.id);

  const { telefone, mensagem } = job.data;

  // AQUI Faria o envio real com a API do WhatsApp
  console.log(`[WhatsApp Queue] Enviando para: ${telefone}`);

  return { success: true, messageId: job.id };
});

// Processar geração de boletos
boletoQueue.process(async (job) => {
  console.log('[Boleto Queue] Gerando boleto:', job.id);

  // AQUI Faria a geração real do boleto no gateway
  return { success: true, boletoId: job.id };
});

/**
 * Atividades agendadas
 */
const schedule = require('node-schedule');

// Geração automática de boletos (dia 1 de cada mês às 00:00)
const jobGerarBoletos = schedule.scheduleJob('0 0 1 * *', async () => {
  console.log('=== INICIANDO GERAÇÃO AUTOMÁTICA DE BOLETOS ===');
  try {
    await gerarBoletos();
    console.log('=== GERAÇÃO DE BOLETOS CONCLUÍDA ===');
  } catch (error) {
    console.error('Erro na geração de boletos:', error);
  }
});

// Envio de lembretes (dia 28 de cada mês às 08:00)
const jobLembretes = schedule.scheduleJob('0 8 28 * *', async () => {
  console.log('=== INICIANDO ENVIO DE LEMBRETES ===');
  try {
    await enviarLembretes();
    console.log('=== ENVIO DE LEMBRETES CONCLUÍDO ===');
  } catch (error) {
    console.error('Erro no envio de lembretes:', error);
  }
});

/**
 * Fechar conexões
 */
async function closeQueues() {
  await emailQueue.close();
  await whatsappQueue.close();
  await boletoQueue.close();
}

module.exports = {
  emailQueue,
  whatsappQueue,
  boletoQueue,
  closeQueues,
};
