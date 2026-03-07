const nodemailer = require("nodemailer");
const ResourceUsage = require("../models/ResourceUsage");
const logger = require("../config/logger");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const baseHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Niti-Setu Notification</title>
        <style>
          /* RESET STYLES */
          body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
          table { border-collapse: collapse !important; }
          body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
 
          /* MOBILE STYLES */
          @media screen and (max-width: 600px) {
            .mobile-wrapper { width: 100% !important; max-width: 100% !important; padding: 10px !important; }
            .mobile-header { padding: 32px 20px !important; }
            .mobile-body { padding: 32px 20px !important; }
            .mobile-footer { padding: 24px 20px !important; }
            .mobile-grid { display: block !important; width: 100% !important; }
            .mobile-logo { font-size: 24px !important; }
          }
 
          /* INDUSTRY GRADE COMPONENTS */
          .container { max-width: 600px; margin: 0 auto; width: 100%; }
          .main-card { background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #065f46 0%, #166534 100%); padding: 40px; text-align: center; }
          .logo-text { color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin: 0; }
          .body-content { padding: 40px; color: #334155; font-size: 16px; line-height: 1.6; }
          .footer { padding: 32px; background-color: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0; }
          .utility-text { color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; display: block; }
          .system-ref { color: #94a3b8; font-size: 11px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 24px; }
        </style>
      </head>
      <body>
        <center>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
            <tr>
              <td align="center" style="padding: 24px 0;" class="mobile-wrapper">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="container main-card" role="presentation">
                  <!-- HEADER -->
                  <tr>
                    <td align="center" class="header mobile-header">
                      <h1 class="logo-text mobile-logo">Niti-Setu</h1>
                    </td>
                  </tr>
                  <!-- BODY -->
                  <tr>
                    <td align="left" class="body-content mobile-body">
                      <span class="utility-text">Secure Identity Protocol</span>
                      ${options.html}
                      <div class="system-ref">
                        Ref: NS-IDENTITY-SECURE &bull; AI Verification Enabled &bull; ${new Date().toLocaleTimeString()}
                      </div>
                    </td>
                  </tr>
                  <!-- FOOTER -->
                  <tr>
                    <td align="center" class="footer mobile-footer">
                      <p style="margin: 0; color: #475569; font-size: 14px; font-weight: 600;">&copy; ${new Date().getFullYear()} Niti-Setu Systems</p>
                      <p style="margin: 4px 0 0; color: #94a3b8; font-size: 12px;">Engineering Agricultural Equity &bull; Digital India</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </center>
      </body>
    </html>
  `;

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: `[Niti-Setu] ${options.subject}`,
    html: baseHtml,
  };

  const info = await transporter.sendMail(message);
  logger.info(`Email sent: ${info.messageId}`);
  
  // Track email usage (Successfully sent)
  await ResourceUsage.recordUsage('SMTP-Email', 1, 'registered')
  .catch(e => logger.error('Usage track error:', e));
};

module.exports = sendEmail;
