const cron = require('node-cron');
const { Boleto, Cliente, Contato } = require('../models/index');
const { Op } = require('sequelize');
const { enviarMensagemWhatsApp } = require('./whatsappService');

/**
 * Busca boletos que vencem em X dias e ainda não tiveram lembrete enviado
 */
async function buscarBoletosParaLembrete(diasAntes) {
  const hoje = new Date();
  const dataAlvo = new Date();
  dataAlvo.setDate(hoje.getDate() + diasAntes);
  const dataAlvoStr = dataAlvo.toISOString().split('T')[0];

  return await Boleto.findAll({
    where: {
      status: 'PENDING',
      data_vencimento: dataAlvoStr,
      tentativas_envio_whatsapp: 0,
    },
    include: [{ model: Cliente }],
  });
}

/**
 * Busca boletos que vencem HOJE e ainda não tiveram mensagem enviada
 */
async function buscarBoletosVencendoHoje() {
  const hoje = new Date().toISOString().split('T')[0];

  return await Boleto.findAll({
    where: {
      status: 'PENDING',
      data_vencimento: hoje,
      tentativas_envio_whatsapp: { [Op.lt]: 1 },
    },
    include: [{ model: Cliente }],
  });
}

/**
 * Busca contato WhatsApp do cliente
 */
async function buscarTelefoneCliente(clienteId) {
  const contato = await Contato.findOne({
    where: { cliente_id: clienteId, tipo: 'WHATSAPP' },
  });
  if (contato) return contato.valor;

  const contato2 = await Contato.findOne({
    where: { cliente_id: clienteId, tipo: 'CELULAR' },
  });
  return contato2?.valor || null;
}

/**
 * Envia lembrete 2 dias antes do vencimento
 */
async function enviarLembretes() {
  console.log('[AGENDAMENTO] Verificando boletos para lembrete (2 dias antes)...');
  const boletos = await buscarBoletosParaLembrete(2);
  console.log(`[AGENDAMENTO] ${boletos.length} boleto(s) encontrado(s) para lembrete.`);

  for (const boleto of boletos) {
    try {
      const telefone = await buscarTelefoneCliente(boleto.cliente_id);
      if (!telefone) {
        console.log(`[AGENDAMENTO] Cliente ${boleto.Cliente?.nome_completo} sem telefone cadastrado.`);
        continue;
      }

      const mensagem = [
        `*Fire Telecom*`,
        ``,
        `Olá, ${boleto.Cliente?.nome_completo}!`,
        ``,
        `⚠️ Seu boleto vence em 2 dias!`,
        ``,
        `*Valor:* R$ ${parseFloat(boleto.valor).toFixed(2)}`,
        `*Vencimento:* ${new Date(boleto.data_vencimento).toLocaleDateString('pt-BR')}`,
        boleto.codigo_barras ? `\n*Código de barras:*\n${boleto.codigo_barras}` : '',
        ``,
        `Pague em dia para evitar juros!`,
      ].join('\n');

      await enviarMensagemWhatsApp(telefone, mensagem);

      await boleto.update({
        tentativas_envio_whatsapp: boleto.tentativas_envio_whatsapp + 1,
        ultimo_envio_whatsapp: new Date(),
      });

      console.log(`[AGENDAMENTO] Lembrete enviado para ${boleto.Cliente?.nome_completo} (${telefone})`);
    } catch (error) {
      console.error(`[AGENDAMENTO] Erro ao enviar lembrete para boleto ${boleto.id}:`, error.message);
    }
  }
}

/**
 * Envia mensagem no dia do vencimento
 */
async function enviarMensagensVencimento() {
  console.log('[AGENDAMENTO] Verificando boletos que vencem hoje...');
  const boletos = await buscarBoletosVencendoHoje();
  console.log(`[AGENDAMENTO] ${boletos.length} boleto(s) vencendo hoje.`);

  for (const boleto of boletos) {
    try {
      const telefone = await buscarTelefoneCliente(boleto.cliente_id);
      if (!telefone) {
        console.log(`[AGENDAMENTO] Cliente ${boleto.Cliente?.nome_completo} sem telefone cadastrado.`);
        continue;
      }

      const mensagem = [
        `*Fire Telecom*`,
        ``,
        `Olá, ${boleto.Cliente?.nome_completo}!`,
        ``,
        `📅 Seu boleto vence *HOJE*!`,
        ``,
        `*Valor:* R$ ${parseFloat(boleto.valor).toFixed(2)}`,
        `*Vencimento:* ${new Date(boleto.data_vencimento).toLocaleDateString('pt-BR')}`,
        boleto.codigo_barras ? `\n*Código de barras:*\n${boleto.codigo_barras}` : '',
        boleto.url_pdf ? `\n📄 Baixe seu boleto: ${boleto.url_pdf}` : '',
        ``,
        `Evite juros e multas, pague hoje!`,
      ].join('\n');

      await enviarMensagemWhatsApp(telefone, mensagem);

      await boleto.update({
        tentativas_envio_whatsapp: boleto.tentativas_envio_whatsapp + 1,
        ultimo_envio_whatsapp: new Date(),
      });

      console.log(`[AGENDAMENTO] Mensagem de vencimento enviada para ${boleto.Cliente?.nome_completo} (${telefone})`);
    } catch (error) {
      console.error(`[AGENDAMENTO] Erro ao enviar mensagem de vencimento para boleto ${boleto.id}:`, error.message);
    }
  }
}

/**
 * Verifica boletos não notificados ao iniciar o sistema
 */
async function verificarPendentesNoInicio() {
  console.log('[AGENDAMENTO] Verificando mensagens não enviadas ao iniciar...');

  const hoje = new Date();
  const em2Dias = new Date();
  em2Dias.setDate(hoje.getDate() + 2);

  // Boletos com vencimento hoje ou em 2 dias que não foram notificados
  const boletos = await Boleto.findAll({
    where: {
      status: 'PENDING',
      data_vencimento: {
        [Op.between]: [
          hoje.toISOString().split('T')[0],
          em2Dias.toISOString().split('T')[0],
        ],
      },
      tentativas_envio_whatsapp: 0,
    },
    include: [{ model: Cliente }],
  });

  console.log(`[AGENDAMENTO] ${boletos.length} boleto(s) pendente(s) de notificação.`);

  for (const boleto of boletos) {
    const vencimento = new Date(boleto.data_vencimento);
    const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));

    try {
      const telefone = await buscarTelefoneCliente(boleto.cliente_id);
      if (!telefone) continue;

      let mensagem;
      if (diffDias <= 0) {
        mensagem = [
          `*Fire Telecom*`,
          ``,
          `Olá, ${boleto.Cliente?.nome_completo}!`,
          ``,
          `📅 Seu boleto vence *HOJE*!`,
          ``,
          `*Valor:* R$ ${parseFloat(boleto.valor).toFixed(2)}`,
          boleto.codigo_barras ? `\n*Código de barras:*\n${boleto.codigo_barras}` : '',
          ``,
          `Evite juros e multas, pague hoje!`,
        ].join('\n');
      } else {
        mensagem = [
          `*Fire Telecom*`,
          ``,
          `Olá, ${boleto.Cliente?.nome_completo}!`,
          ``,
          `⚠️ Seu boleto vence em ${diffDias} dia(s)!`,
          ``,
          `*Valor:* R$ ${parseFloat(boleto.valor).toFixed(2)}`,
          `*Vencimento:* ${vencimento.toLocaleDateString('pt-BR')}`,
          boleto.codigo_barras ? `\n*Código de barras:*\n${boleto.codigo_barras}` : '',
          ``,
          `Pague em dia para evitar juros!`,
        ].join('\n');
      }

      await enviarMensagemWhatsApp(telefone, mensagem);
      await boleto.update({
        tentativas_envio_whatsapp: boleto.tentativas_envio_whatsapp + 1,
        ultimo_envio_whatsapp: new Date(),
      });

      console.log(`[AGENDAMENTO] Mensagem enviada para ${boleto.Cliente?.nome_completo} (vence em ${diffDias} dia(s))`);
    } catch (error) {
      console.error(`[AGENDAMENTO] Erro ao enviar mensagem pendente:`, error.message);
    }
  }
}

/**
 * Inicia os cron jobs
 */
function iniciarAgendamentos() {
  console.log('[AGENDAMENTO] Iniciando agendamentos...');

  // Lembrete 2 dias antes - todo dia às 9h
  cron.schedule('0 9 * * *', async () => {
    console.log('[AGENDAMENTO] Executando lembrete de 2 dias...');
    await enviarLembretes();
  }, { timezone: 'America/Sao_Paulo' });

  // Mensagem no dia do vencimento - todo dia às 9h
  cron.schedule('0 9 * * *', async () => {
    console.log('[AGENDAMENTO] Executando mensagem de vencimento...');
    await enviarMensagensVencimento();
  }, { timezone: 'America/Sao_Paulo' });

  // Email - lembrete 2 dias antes
  cron.schedule('0 9 * * *', async () => {
    await enviarLembretesEmail();
    await enviarEmailsVencimento();
  }, { timezone: 'America/Sao_Paulo' });

  // Verificar emails pendentes ao iniciar
  setTimeout(async () => {
    await verificarEmailsPendentesNoInicio();
  }, 8000);

  console.log('[AGENDAMENTO] Cron jobs configurados para 09:00 (horário de Brasília)');

  // Verifica pendentes ao iniciar
  setTimeout(async () => {
    await verificarPendentesNoInicio();
  }, 5000);
}

module.exports = {
  iniciarAgendamentos,
  enviarLembretes,
  enviarMensagensVencimento,
  verificarPendentesNoInicio,
};

// ============ AGENDAMENTO DE EMAILS ============

const { enviarBoletoEmail, enviarLembreteVencimento } = require('./emailService');

async function buscarEmailCliente(clienteId) {
  const contato = await Contato.findOne({
    where: { cliente_id: clienteId, tipo: 'EMAIL' },
  });
  return contato?.valor || null;
}

async function enviarLembretesEmail() {
  console.log('[EMAIL] Verificando boletos para lembrete por email (2 dias antes)...');
  const boletos = await buscarBoletosParaLembrete(2);
  console.log(`[EMAIL] ${boletos.length} boleto(s) encontrado(s).`);

  for (const boleto of boletos) {
    try {
      const email = await buscarEmailCliente(boleto.cliente_id);
      if (!email) {
        console.log(`[EMAIL] Cliente ${boleto.Cliente?.nome_completo} sem email cadastrado.`);
        continue;
      }

      await enviarLembreteVencimento(
        email,
        boleto.Cliente?.nome_completo,
        0,
        boleto.codigo_barras || 'Consulte seu boleto',
        boleto.url_pdf || ''
      );

      await boleto.update({
        tentativas_envio_email: boleto.tentativas_envio_email + 1,
        ultimo_envio_email: new Date(),
      });

      console.log(`[EMAIL] Lembrete enviado para ${boleto.Cliente?.nome_completo} (${email})`);
    } catch (error) {
      console.error(`[EMAIL] Erro ao enviar lembrete:`, error.message);
    }
  }
}

async function enviarEmailsVencimento() {
  console.log('[EMAIL] Verificando boletos que vencem hoje para email...');
  const boletos = await buscarBoletosVencendoHoje();
  console.log(`[EMAIL] ${boletos.length} boleto(s) vencendo hoje.`);

  for (const boleto of boletos) {
    try {
      const email = await buscarEmailCliente(boleto.cliente_id);
      if (!email) {
        console.log(`[EMAIL] Cliente ${boleto.Cliente?.nome_completo} sem email cadastrado.`);
        continue;
      }

      await enviarBoletoEmail(
        email,
        boleto.Cliente?.nome_completo,
        boleto.codigo_barras || 'Consulte seu boleto',
        boleto.valor,
        boleto.data_vencimento,
        null
      );

      await boleto.update({
        tentativas_envio_email: boleto.tentativas_envio_email + 1,
        ultimo_envio_email: new Date(),
      });

      console.log(`[EMAIL] Email de vencimento enviado para ${boleto.Cliente?.nome_completo} (${email})`);
    } catch (error) {
      console.error(`[EMAIL] Erro ao enviar email de vencimento:`, error.message);
    }
  }
}

async function verificarEmailsPendentesNoInicio() {
  console.log('[EMAIL] Verificando emails não enviados ao iniciar...');

  const hoje = new Date();
  const em2Dias = new Date();
  em2Dias.setDate(hoje.getDate() + 2);

  const boletos = await Boleto.findAll({
    where: {
      status: 'PENDING',
      data_vencimento: {
        [Op.between]: [
          hoje.toISOString().split('T')[0],
          em2Dias.toISOString().split('T')[0],
        ],
      },
      tentativas_envio_email: 0,
    },
    include: [{ model: Cliente }],
  });

  console.log(`[EMAIL] ${boletos.length} boleto(s) pendente(s) de notificação por email.`);

  for (const boleto of boletos) {
    try {
      const email = await buscarEmailCliente(boleto.cliente_id);
      if (!email) continue;

      const vencimento = new Date(boleto.data_vencimento);
      const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));

      if (diffDias <= 0) {
        await enviarBoletoEmail(email, boleto.Cliente?.nome_completo, boleto.codigo_barras || '-', boleto.valor, boleto.data_vencimento, null);
      } else {
        await enviarLembreteVencimento(email, boleto.Cliente?.nome_completo, 0, boleto.codigo_barras || '-', boleto.url_pdf || '');
      }

      await boleto.update({
        tentativas_envio_email: boleto.tentativas_envio_email + 1,
        ultimo_envio_email: new Date(),
      });

      console.log(`[EMAIL] Email enviado para ${boleto.Cliente?.nome_completo} (vence em ${diffDias} dia(s))`);
    } catch (error) {
      console.error(`[EMAIL] Erro:`, error.message);
    }
  }
}

module.exports.enviarLembretesEmail = enviarLembretesEmail;
module.exports.enviarEmailsVencimento = enviarEmailsVencimento;
module.exports.verificarEmailsPendentesNoInicio = verificarEmailsPendentesNoInicio;
