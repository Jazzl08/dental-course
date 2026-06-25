import { Resend } from 'resend';
import * as db from '../config/db.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const BRAND_NAME  = process.env.BRAND_NAME       || 'Tandvlees Coach';
const CLIENT_URL  = process.env.CLIENT_URL        || 'http://localhost:3000';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL   || process.env.RESEND_FROM_EMAIL;
const FROM        = `${process.env.RESEND_FROM_NAME || BRAND_NAME} <${process.env.RESEND_FROM_EMAIL || 'noreply@example.com'}>`;

const baseLayout = (title, content) => `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f7f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f0f7f4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:580px;">

          <tr>
            <td style="background:linear-gradient(135deg,#071510 0%,#0d2318 100%);border-radius:14px 14px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#3EB489;letter-spacing:-0.3px;">${BRAND_NAME}</p>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.45);letter-spacing:0.08em;text-transform:uppercase;">Gezond tandvlees begint hier</p>
            </td>
          </tr>

          <tr>
            <td style="background:#ffffff;padding:40px 40px 32px;border-left:1px solid #d8f3ea;border-right:1px solid #d8f3ea;">
              <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#061008;letter-spacing:-0.4px;line-height:1.3;">${title}</h1>
              ${content}
            </td>
          </tr>

          <tr>
            <td style="background:#f8fdfb;border:1px solid #d8f3ea;border-top:none;border-radius:0 0 14px 14px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#7AAAA0;">Vragen? Stuur een e-mail naar <a href="mailto:${SUPPORT_EMAIL}" style="color:#3EB489;text-decoration:none;">${SUPPORT_EMAIL}</a></p>
              <p style="margin:0;font-size:11px;color:#b0c9c3;">&copy; ${new Date().getFullYear()} ${BRAND_NAME} &middot; Alle rechten voorbehouden</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const btn = (url, label) =>
  `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
    <tr>
      <td style="background:#3EB489;border-radius:8px;">
        <a href="${url}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">${label}</a>
      </td>
    </tr>
  </table>`;

const p = (text) =>
  `<p style="margin:0 0 16px;font-size:15px;color:#334340;line-height:1.7;">${text}</p>`;

const muted = (text) =>
  `<p style="margin:16px 0 0;font-size:13px;color:#7AAAA0;line-height:1.6;">${text}</p>`;

const divider = () =>
  `<hr style="border:none;border-top:1px solid #d8f3ea;margin:24px 0;"/>`;

const infoRow = (label, value) =>
  `<tr>
    <td style="padding:10px 14px;font-size:13px;color:#7AAAA0;white-space:nowrap;border-bottom:1px solid #f0f7f4;">${label}</td>
    <td style="padding:10px 14px;font-size:13px;color:#334340;font-weight:600;border-bottom:1px solid #f0f7f4;">${value}</td>
  </tr>`;

const infoTable = (rows) =>
  `<table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #d8f3ea;border-radius:8px;overflow:hidden;margin:16px 0 24px;">${rows}</table>`;

const sendEmail = async ({ userId = null, to, subject, html, templateType, metadata = {} }) => {
  let resendId    = null;
  let status      = 'sent';
  let errorMessage = null;

  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html });
    resendId = result?.data?.id ?? null;
  } catch (err) {
    status       = 'failed';
    errorMessage = err.message;
    console.error('[EMAIL] Verzenden mislukt:', err.message);
  }

  try {
    await db.query(
      `INSERT INTO email_logs
         (user_id, to_email, subject, template_type, resend_id, status, error_message, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, to, subject, templateType, resendId, status, errorMessage, JSON.stringify(metadata)]
    );
  } catch (logErr) {
    console.error('[EMAIL] Log opslaan mislukt:', logErr.message);
  }

  return { success: status === 'sent', resendId };
};

const sendRegistrationEmail = ({ userId, to, name }) =>
  sendEmail({
    userId,
    to,
    subject: `Welkom bij ${BRAND_NAME} — bevestig je e-mailadres`,
    html: baseLayout(
      `Hoi ${name}, welkom! 👋`,
      p(`Je hebt je zojuist aangemeld bij <strong>${BRAND_NAME}</strong>. Geweldig dat je de stap zet naar een gezonder tandvlees!`) +
      p(`Bevestig je e-mailadres om je account te activeren en direct aan de slag te gaan.`) +
      muted(`Heb jij je niet aangemeld? Dan kun je deze e-mail negeren.`)
    ),
    templateType: 'registration',
    metadata: { name },
  });

const sendVerificationEmail = ({ userId, to, name, verifyUrl }) =>
  sendEmail({
    userId,
    to,
    subject: `Bevestig je e-mailadres — ${BRAND_NAME}`,
    html: baseLayout(
      'Bevestig je e-mailadres',
      p(`Hoi <strong>${name}</strong>,`) +
      p(`Klik op de knop hieronder om je e-mailadres te bevestigen en toegang te krijgen tot je cursus.`) +
      btn(verifyUrl, 'E-mailadres bevestigen') +
      divider() +
      muted(`Deze link is 24 uur geldig. Werkt de knop niet? Kopieer dan deze link in je browser:`) +
      `<p style="margin:8px 0 0;font-size:12px;color:#7AAAA0;word-break:break-all;">${verifyUrl}</p>` +
      muted(`Heb jij je niet aangemeld? Dan kun je deze e-mail negeren.`)
    ),
    templateType: 'verification',
    metadata: { verifyUrl },
  });

const sendWelcomeEmail = ({ userId, to, name }) =>
  sendEmail({
    userId,
    to,
    subject: `Je account is actief — ${BRAND_NAME}`,
    html: baseLayout(
      `Je bent er klaar voor, ${name}! 🎉`,
      p(`Je e-mailadres is bevestigd en je account is volledig actief.`) +
      p(`Je kunt nu direct beginnen met het programma. Wij wensen je veel succes!`) +
      btn(`${CLIENT_URL}/dashboard`, 'Naar mijn dashboard') +
      divider() +
      muted(`Heb je vragen of hulp nodig? We staan altijd voor je klaar.`)
    ),
    templateType: 'welcome',
    metadata: { name },
  });

const sendLoginAlertEmail = ({ userId, to, name, ip, userAgent }) =>
  sendEmail({
    userId,
    to,
    subject: `Nieuwe inlog op je account — ${BRAND_NAME}`,
    html: baseLayout(
      'Nieuwe inlog gedetecteerd',
      p(`Hoi <strong>${name}</strong>,`) +
      p(`We hebben een nieuwe inlog op je account geregistreerd. Hieronder zie je de details:`) +
      infoTable(
        infoRow('IP-adres', ip || 'Onbekend') +
        infoRow('Apparaat', userAgent ? userAgent.substring(0, 80) : 'Onbekend') +
        infoRow('Tijdstip', new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }))
      ) +
      muted(`Was jij dit niet? Verander dan direct je wachtwoord via je profielpagina.`)
    ),
    templateType: 'login_alert',
    metadata: { ip, userAgent },
  });

const sendPasswordResetEmail = ({ userId, to, name, resetUrl }) =>
  sendEmail({
    userId,
    to,
    subject: `Wachtwoord resetten — ${BRAND_NAME}`,
    html: baseLayout(
      'Wachtwoord resetten',
      p(`Hoi <strong>${name}</strong>,`) +
      p(`We hebben een verzoek ontvangen om je wachtwoord te resetten. Klik op de knop hieronder om een nieuw wachtwoord in te stellen.`) +
      btn(resetUrl, 'Nieuw wachtwoord instellen') +
      divider() +
      muted(`Deze link is 2 uur geldig. Werkt de knop niet? Kopieer dan deze link in je browser:`) +
      `<p style="margin:8px 0 0;font-size:12px;color:#7AAAA0;word-break:break-all;">${resetUrl}</p>` +
      muted(`Heb jij geen wachtwoordreset aangevraagd? Dan hoef je niets te doen. Je wachtwoord blijft ongewijzigd.`)
    ),
    templateType: 'password_reset',
    metadata: { resetUrl },
  });

const sendPurchaseConfirmation = ({ userId, to, name, courseName, amountCents, currency = 'EUR' }) => {
  const amountFormatted = new Intl.NumberFormat('nl-NL', { style: 'currency', currency }).format(amountCents / 100);
  return sendEmail({
    userId,
    to,
    subject: `Betaling bevestigd: ${courseName}`,
    html: baseLayout(
      'Betaling geslaagd! 🙌',
      p(`Hoi <strong>${name}</strong>,`) +
      p(`Je betaling is succesvol ontvangen. Je hebt nu direct toegang tot je cursus.`) +
      infoTable(
        infoRow('Cursus', courseName) +
        infoRow('Bedrag', amountFormatted) +
        infoRow('Status', 'Betaald ✓')
      ) +
      btn(`${CLIENT_URL}/dashboard`, 'Direct beginnen') +
      divider() +
      muted(`Bewaar deze e-mail als bewijs van aankoop. Vragen over je bestelling? Neem contact op via ${SUPPORT_EMAIL}.`)
    ),
    templateType: 'purchase_confirmation',
    metadata: { courseName, amountCents, currency },
  });
};

export {
  sendRegistrationEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendPasswordResetEmail,
  sendPurchaseConfirmation,
};
