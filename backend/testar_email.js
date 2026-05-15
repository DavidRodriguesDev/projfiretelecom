const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'davidestudosdev@gmail.com',
    pass: 'bnqtcomrtdchfwqi',
  },
});

async function testar() {
  try {
    await transporter.sendMail({
      from: '"Fire Telecom" <davidestudosdev@gmail.com>',
      to: 'davidestudosdev@gmail.com',
      subject: '🔥 Fire Telecom - Teste de E-mail',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e85d04;">🔥 Fire Telecom</h2>
          <p>Olá, David!</p>
          <p>⚠️ Seu boleto vence em 2 dias!</p>
          <table style="width:100%; border-collapse:collapse;">
            <tr><td><strong>Valor:</strong></td><td>R$ 129,90</td></tr>
            <tr><td><strong>Vencimento:</strong></td><td>16/05/2026</td></tr>
            <tr><td><strong>Referência:</strong></td><td>Maio/2026</td></tr>
          </table>
          <br>
          <p style="color: #666;">Obrigado por ser nosso cliente!</p>
        </div>
      `,
    });
    console.log('✅ E-mail enviado com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

testar();
