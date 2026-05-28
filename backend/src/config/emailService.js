/**
 * config/emailService.js - Configuração do serviço de e-mail
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
    port: config.email.smtp.port,
    secure: config.email.smtp.secure,
    auth: {
      user: config.email.smtp.user,
      pass: config.email.smtp.password,
    },
    debug: process.env.NODE_ENV === 'development',
  });
}

/**
 * Enviar e-mail
 */
async function sendEmail(options) {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Boleto Manager" <${config.email.from}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments || [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      sucesso: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw new Error(`Falha ao enviar e-mail: ${error.message}`);
  }
}

/**
 * Gerar template HTML de boleto
 */
function gerarTemplateBoleto(cliente, boleto) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Seu Boleto - Boleto Manager</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin: 0;">Boleto Manager</h1>
          <p style="color: #7f8c8d;">Gestão simples de cobrança</p>
        </div>

        <h2 style="color: #2c3e50;">Olá, ${cliente.nome_completo}!</h2>
        <p>Em anexo, enviamos seu boleto bancário para pagamento.</p>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e9ecef;">
          <h3 style="color: #2c3e50; margin-top: 0;">Dados do Boleto</h3>
          <p><strong>Linha Digitável:</strong> ${boleto.linhaDigitavel}</p>
          <p><strong>Valor:</strong> R$ ${boleto.valor.toFixed(2)}</p>
          <p><strong>Data de Vencimento:</strong> ${new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}</p>
        </div>

        <p style="color: #666;">Para efetuar o pagamento, basta salvar ou imprimir o boleto anexo e pagar em qualquer agência bancária ou pela internet.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="color: #777; font-size: 12px; text-align: center;">
          Se você já realizou o pagamento, por favor descartar este e-mail.<br><br>
          Boleto Manager - Gestão simples de cobrança.<br>
          Contato: suporte@boleto_manager.com
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Gerar template HTML de lembrete
 */
function gerarTemplateLembrete(cliente, boleto, diasAtraso) {
  const mensagemDestaque = diasAtraso > 0
    ? `<p style="color: #e74c3c; font-weight: bold; padding: 15px; background: #fee; border-radius: 5px;">
         ⚠️ ATENÇÃO: Você está ${diasAtraso} dia(s) atrasado. Por favor, regularize sua situação.
       </p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Lembrete de Vencimento - Boleto Manager</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c3e50; margin: 0;">Boleto Manager</h1>
          <p style="color: #7f8c8d;">Gestão simples de cobrança</p>
        </div>

        <h2 style="color: #2c3e50;">Olá, ${cliente.nome_completo}!</h2>
        <p>Gostaríamos de lembrar que o vencimento do seu boleto está se aproximando.</p>
        ${mensagemDestaque}

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e9ecef;">
          <h3 style="color: #2c3e50; margin-top: 0;">Dados do Boleto</h3>
          <p><strong>Linha Digitável:</strong> ${boleto.linhaDigitavel}</p>
          <p><strong>Valor:</strong> R$ ${boleto.valor.toFixed(2)}</p>
          <p><strong>Data de Vencimento:</strong> ${new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}</p>
        </div>

        <p style="color: #666;">Clique no arquivo em anexo para baixar ou imprimir o boleto.</p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <p style="color: #777; font-size: 12px; text-align: center;">
          Se você já realizou o pagamento, por favor descartar este e-mail.<br><br>
          Boleto Manager - Gestão simples de cobrança.<br>
          Contato: suporte@boleto_manager.com
        </p>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  sendEmail,
  gerarTemplateBoleto,
  gerarTemplateLembrete,
};
