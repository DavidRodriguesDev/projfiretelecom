/**
 * jobs/enviarLembretesJob.js - Job para envio de lembretes de vencimento
 */

const { Boleto, Cliente } = require('../models/index');
const { Op } = require('sequelize');
const { enviarBoletoEmail, enviarLembreteVencimento } = require('../services/emailService');
const { enviarLembreteVencimentoWhatsApp, enviarBoletoWhatsApp } = require('../services/whatsappService');
const { LogEnvio, Contato } = require('../models/index');

/**
 * Enviar lembretes 2 dias antes do vencimento
 */
async function enviarLembretes() {
  console.log('[Lembretes] Iniciando envio de lembretes...');

  try {
    // Calcular data: 2 dias antes do vencimento
    const dataLembrete = new Date();
    dataLembrete.setDate(dataLembrete.getDate() + 2);
    const dataHoje = new Date();

    // Buscar boletos que vencem nos próximos 2 dias e estão pendentes
    const boletos = await Boleto.findAll({
      where: {
        status: 'PENDING',
        data_vencimento: {
          [Op.lte]: dataLembrete.toISOString().split('T')[0],
        },
      },
      include: [{ model: Cliente }],
    });

    console.log(`[Lembretes] ${boletos.length} boletos encontrados para lembrar`);

    let totalEmailEnviados = 0;
    let totalWhatsAppEnviados = 0;

    for (const boleto of boletos) {
      const cliente = boleto.Cliente;

      // Obter e-mail principal
      const emailPrincipal = await Contato.findOne({
        where: {
          cliente_id: cliente.id,
          tipo: 'EMAIL',
          principal: true,
        },
      });

      // Obter WhatsApp principal
      const whatsappContato = await Contato.findOne({
        where: {
          cliente_id: cliente.id,
          tipo: 'WHATSAPP',
          principal: true,
        },
      });

      // Limpar linha digitável (apenas para exemplo)
      const linhaDigitavel = boleto.nosso_numero || '033993300000000001640070000000000000000000000000';

      // Enviar e-mail
      if (emailPrincipal && emailPrincipal.valor) {
        try {
          const diasAtraso = Math.floor(
            (dataHoje - new Date(boleto.data_vencimento)) / (1000 * 60 * 60 * 24)
          );

          await enviarLembreteVencimento(
            emailPrincipal.valor,
            cliente.nome_completo,
            diasAtraso < 0 ? 0 : diasAtraso,
            linhaDigitavel,
            boleto.url_pdf || `http://localhost:3000/boletos/${boleto.id}/download`
          );

          // Registrar envio
          await LogEnvio.create({
            tipo_envio: 'EMAIL',
            destino: emailPrincipal.valor,
            assunto_mensagem: `Lembrete: Boleto vencendo em ${boleto.data_vencimento}`,
            mensagem: `Lembrete de pagamento para ${cliente.nome_completo}`,
            status_envio: 'ENVIADO',
            id_interno_referencia: boleto.id,
            tipo_referencia: 'BOLETO',
          });

          totalEmailEnviados++;
          console.log(`[Lembretes] E-mail enviado para ${emailPrincipal.valor}`);
        } catch (emailError) {
          console.error(`[Lembretes] Erro ao enviar e-mail para ${emailPrincipal.valor}:`, emailError);
          await LogEnvio.create({
            tipo_envio: 'EMAIL',
            destino: emailPrincipal.valor,
            mensagem: 'Erro no envio',
            status_envio: 'FALHA',
            erro: emailError.message,
            id_interno_referencia: boleto.id,
            tipo_referencia: 'BOLETO',
          });
        }
      }

      // Enviar WhatsApp
      if (whatsappContato && whatsappContato.valor) {
        try {
          const diasAtraso = Math.floor(
            (dataHoje - new Date(boleto.data_vencimento)) / (1000 * 60 * 60 * 24)
          );

          await enviarLembreteVencimentoWhatsApp(
            whatsappContato.valor,
            cliente.nome_completo,
            diasAtraso < 0 ? 0 : diasAtraso,
            linhaDigitavel,
            boleto.url_pdf || `http://localhost:3000/boletos/${boleto.id}/download`
          );

          totalWhatsAppEnviados++;
          console.log(`[Lembretes] WhatsApp enviado para ${whatsappContato.valor}`);
        } catch (whatsappError) {
          console.error(`[Lembretes] Erro ao enviar WhatsApp para ${whatsappContato.valor}:`, whatsappError);
        }
      }
    }

    console.log(`[Lembretes] Envio concluído!`);
    console.log(`[Lembretes] E-mails enviados: ${totalEmailEnviados}`);
    console.log(`[Lembretes] WhatsApps enviados: ${totalWhatsAppEnviados}`);

    return {
      sucesso: true,
      emailEnviados: totalEmailEnviados,
      WhatsAppEnviados: totalWhatsAppEnviados,
    };
  } catch (error) {
    console.error('[Lembretes] Erro durante o envio:', error);
    throw error;
  }
}

module.exports = {
  enviarLembretes,
};
