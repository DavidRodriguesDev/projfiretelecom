/**
 * services/emailService.js - Serviço de envio de e-mails
 */

const nodemailer = require('nodemailer');
const config = require('../config/config');

/**
 * Criar transportador de e-mail
 */
function createTransporter() {
  if (config.email.type === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // SMTP padrão
  return nodemailer.createTransport({
    host: config.email.smtp.host,
    port: parseInt(config.email.smtp.port, 10),
    secure: config.email.smtp.secure === 'true',
    auth: {
      user: config.email.smtp.user,
      pass: config.email.smtp.password,
    },
    debug: process.env.NODE_ENV === 'development',
  });
}

/**
 * Enviar e-mail
 * @param {object} options - Opções do e-mail
 * @param {string} options.to - Destinatário
 * @param {string} options.subject - Assunto
 * @param {string} options.html - Corpo HTML
 * @param {Array} options.attachments - Anexos (opcional)
 */
async function sendEmail(options) {
  const { to, subject, html, attachments = [] } = options;

  const transporter = createTransporter();

  const mailOptions = {
    from: `"Fire Telecom" <${config.email.from}>`,
    to,
    subject,
    html,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso:', info.messageId);

    return {
      sucesso: true,
      messageId: info.messageId,
      to,
      subject,
    };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw new Error(`Falha ao enviar e-mail: ${error.message}`);
  }
}

/**
 * Enviar e-mail com boleto em anexo
 * @param {string} destinatario - E-mail do destinatário
 * @param {string} nomeCliente - Nome do cliente
 * @param {string} linhaDigitavel - Linha digitável
 * @param {string} valor - Valor do boleto
 * @param {string} dataVencimento - Data de vencimento
 * @param {string} pdfBase64 - PDF do boleto em base64
 */
async function enviarBoletoEmail(destinatario, nomeCliente, linhaDigitavel, valor, dataVencimento, pdfBase64) {
  const assunto = `Seu boleto Fire Telecom - Vencimento ${dataVencimento}`;

  const mensagemHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Seu Boleto - Fire Telecom</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #2c3e50; margin: 0; }
        .boleto-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e9ecef; }
        .boleto-info h3 { color: #2c3e50; margin-top: 0; }
        .footer { color: #777; font-size: 12px; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Fire Telecom</h1>
          <p style="color: #7f8c8d;">Sua internet, nossa prioridade</p>
        </div>

        <h2 style="color: #2c3e50;">Olá, ${nomeCliente}!</h2>
        <p>Em anexo, enviamos seu boleto bancário para pagamento.</p>

        <div class="boleto-info">
          <h3>Dados do Boleto</h3>
          <p><strong>Linha Digitável:</strong> ${linhaDigitavel}</p>
          <p><strong>Valor:</strong> R$ ${parseFloat(valor).toFixed(2)}</p>
          <p><strong>Data de Vencimento:</strong> ${new Date(dataVencimento).toLocaleDateString('pt-BR')}</p>
        </div>

        <p style="color: #666;">Para efetuar o pagamento, basta salvar ou imprimir o boleto anexo e pagar em qualquer agência bancária ou pela internet.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <div class="footer">
          <p>Se você já realizou o pagamento, por favor descartar este e-mail.<br><br>
          Fire Telecom - Sua internet, nossa prioridade.<br>
          Contato: suporte@firetelecom.com.br</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const attachments = pdfBase64
    ? [
        {
          filename: `boleto-${dataVencimento}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
        },
      ]
    : [];

  return sendEmail({
    to: destinatario,
    subject: assunto,
    html: mensagemHtml,
    attachments,
  });
}

/**
 * Enviar e-mail de lembrete de vencimento
 * @param {string} destinatario - E-mail do destinatário
 * @param {string} nomeCliente - Nome do cliente
 * @param {number} diasAtraso - Dias de atraso
 * @param {string} linhaDigitavel - Linha digitável
 * @param {string} urlPdf - URL para download do PDF
 */
async function enviarLembreteVencimento(destinatario, nomeCliente, diasAtraso, linhaDigitavel, urlPdf) {
  const assunto = `Lembrete: Boleto vencendo em breve - Fire Telecom`;

  const mensagemDestaque = diasAtraso > 0
    ? `
      <div style="background: #fee; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
        <strong style="color: #e74c3c; font-size: 16px;">
          ⚠️ Atenção: Você está ${diasAtraso} dia(s) atrasado. Por favor, regularize sua situação.
        </strong>
      </div>
    `
    : '';

  const mensagemHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Lembrete de Vencimento - Fire Telecom</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 0 auto; }
        .boleto-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e9ecef; }
        .boleto-info h3 { color: #2c3e50; margin-top: 0; }
        .footer { color: #777; font-size: 12px; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="text-align: center; color: #2c3e50;">Fire Telecom</h1>
          <p style="text-align: center; color: #7f8c8d;">Sua internet, nossa prioridade</p>
        </div>

        <h2 style="color: #2c3e50;">Olá, ${nomeCliente}!</h2>
        <p>Gostaríamos de lembrar que o vencimento do seu boleto está se aproximando.</p>
        ${mensagemDestaque}

        <div class="boleto-info">
          <h3>Dados do Boleto</h3>
          <p><strong>Linha Digitável:</strong> ${linhaDigitavel}</p>
          <p><strong>Valor:</strong> R$ ${config.asaas.currency === 'BRL' ? '59,90' : '59.90'}</p>
          <p><strong>Data de Vencimento:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <p style="color: #666;">Para facilitar seu pagamento, você pode baixar o boleto completo no seguinte link:</p>
        <p><a href="${urlPdf}" style="color: #3498db; text-decoration: none; font-weight: bold;">Download do Boleto</a></p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <div class="footer">
          <p>Se você já realizou o pagamento, desconsidere esta mensagem.<br><br>
          Fire Telecom - Sua internet, nossa prioridade.<br>
          Email: suporte@firetelecom.com.br</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: destinatario,
    subject: assunto,
    html: mensagemHtml,
  });
}

/**
 * Enviar e-mail de confirmação de pagamento
 * @param {string} destinatario - E-mail do destinatário
 * @param {string} nomeCliente - Nome do cliente
 * @param {string} valor - Valor pago
 * @param {string} dataPagamento - Data do pagamento
 */
async function enviarConfirmacaoPagamento(destinatario, nomeCliente, valor, dataPagamento) {
  const assunto = `Confirmação de pagamento - Fire Telecom`;

  const mensagemHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Pagamento Confirmado - Fire Telecom</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px; }
        .container { max-width: 600px; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 0 auto; }
        .boleto-info { background-color: #e8f8f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60; }
        .boleto-info h3 { color: #2c3e50; margin-top: 0; }
        .footer { color: #777; font-size: 12px; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="text-align: center; color: #2c3e50;">Fire Telecom</h1>
          <p style="text-align: center; color: #7f8c8d;">Sua internet, nossa prioridade</p>
        </div>

        <h2 style="color: #27ae60;">Pagamento Confirmado! <span style="color: #333;"> </span></h2>
        <p style="color: #2c3e50;">Olá, ${nomeCliente}!</p>

        <p style="color: #27ae60; font-weight: bold; padding: 15px; text-align: center; background: #e8f8f5; border-radius: 5px; margin: 20px 0;">
          Confirmamos o recebimento do seu pagamento!
        </p>

        <div class="boleto-info">
          <h3>Dados do Pagamento</h3>
          <p><strong>Valor Pago:</strong> R$ ${valor}</p>
          <p><strong>Data do Pagamento:</strong> ${new Date(dataPagamento).toLocaleDateString('pt-BR')}</p>
        </div>

        <p style="color: #666;">Obrigado por pagar em dia com a Fire Telecom!</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <div class="footer">
          <p>Se tiver alguma dúvida sobre este pagamento, entre em contato conosco.<br><br>
          Fire Telecom - Sua internet, nossa prioridade.<br>
          Contato: suporte@firetelecom.com.br</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: destinatario,
    subject: assunto,
    html: mensagemHtml,
  });
}

module.exports = {
  sendEmail,
  enviarBoletoEmail,
  enviarLembreteVencimento,
  enviarConfirmacaoPagamento,
};