import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";

export async function sendContactMail({ name, email, message, phone }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Chemins relatifs aux logos (public du frontend)
  const logoTop =
    "https://olivedrab-hornet-656554.hostingersite.com/images/BAI%202-modified.png";
  const logoBottom =
    "https://olivedrab-hornet-656554.hostingersite.com/images/BAI-3.png";

  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: process.env.CONTACT_RECEIVER || "djibrilntamack@yahoo.fr",
    subject:
      "[CONTACT BAI CONSULTING] Nouveau message de contact de votre site BAI Consulting et Formation",
    text: `Nom: ${name}\nEmail: ${email}\nTéléphone: ${
      phone || "Non spécifié"
    }\nMessage: ${message}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #FFF7F2; padding: 0; margin: 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFF7F2; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); overflow: hidden; border: 2px solid #F5D6C6;">
                <tr>
                  <td style="background: #00314B; padding: 32px 0; text-align: center;">
                    <div style="display: inline-block; background: rgba(255,255,255,0.7); border-radius: 18px; padding: 18px 24px 12px 24px;">
                      <img src="${logoTop}" alt="BAI Consulting" style="max-width: 90px; height: auto; display: block; margin: 0 auto;" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 40px 24px 40px; background: #fff;">
                    <h2 style="color: #00314B; font-size: 2rem; margin-bottom: 12px;">Nouveau message de contact</h2>
                    <p style="color: #222; font-size: 1.1rem; margin-bottom: 24px;">
                      Vous avez reçu un nouveau message via le formulaire de contact de votre site <b>BAI Consulting</b>.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td style="color: #00314B; font-weight: bold; padding: 6px 0; width: 120px;">Nom :</td>
                        <td style="color: #222;">${name}</td>
                      </tr>
                      <tr>
                        <td style="color: #00314B; font-weight: bold; padding: 6px 0;">Email :</td>
                        <td><a href="mailto:${email}" style="color: #F5D6C6; text-decoration: underline;">${email}</a></td>
                      </tr>
                      <tr>
                        <td style="color: #00314B; font-weight: bold; padding: 6px 0;">Téléphone :</td>
                        <td style="color: #222;">${phone || "Non spécifié"}</td>
                      </tr>
                    </table>
                    <div style="margin-bottom: 24px;">
                      <span style="color: #00314B; font-weight: bold;">Message :</span>
                      <div style="background: #F5D6C6; border-radius: 8px; padding: 16px; color: #222; margin-top: 8px; white-space: pre-line;">${message}</div>
                    </div>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;"/>
                    <p style="font-size: 0.95em; color: #888; text-align: center;">
                      Ceci est un message automatique, merci de ne pas y répondre directement.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background: #FFF7F2; text-align: center; padding: 24px 0;">
                    <img src="${logoBottom}" alt="BAI Consulting" style="max-width: 80px; height: auto; opacity: 0.8;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
    replyTo: email,
  };

  await transporter.sendMail(mailOptions);

  // Mail automatique à l'utilisateur
  const userMailOptions = {
    from:
      "BAI Consulting <" +
      (process.env.CONTACT_RECEIVER || "djibrilntamack@yahoo.fr") +
      ">",
    to: email,
    subject: "[BAI CONSULTING] Confirmation de réception de votre message",
    text: `Bonjour ${name},\n\nNous avons bien reçu votre message et vous répondrons sous 2 jours ouvrés.\n\nCeci est une confirmation automatique.\n\nL'équipe BAI Consulting.`,
    html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; background: #FFF7F2; padding: 0; margin: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFF7F2; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); overflow: hidden; border: 2px solid #F5D6C6;">
              <tr>
                <td style="background: #00314B; padding: 32px 0; text-align: center;">
                  <div style="display: inline-block; background: rgba(255,255,255,0.7); border-radius: 18px; padding: 18px 24px 12px 24px;">
                    <img src="${logoTop}" alt="BAI Consulting" style="max-width: 90px; height: auto; display: block; margin: 0 auto;" />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px 40px 24px 40px; background: #fff;">
                  <h2 style="color: #00314B; font-size: 2rem; margin-bottom: 12px;">Confirmation de réception</h2>
                  <p style="color: #222; font-size: 1.1rem; margin-bottom: 24px;">
                    Bonjour ${name},<br /><br />
                    Nous avons bien reçu votre message envoyé via le formulaire de contact de notre site <b>BAI Consulting</b>.<br /><br />
                    Nous vous répondrons sous 2 jours ouvrés.<br /><br />
                    Ceci est une confirmation automatique, merci de ne pas y répondre directement.<br /><br />
                    L'équipe BAI Consulting.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background: #FFF7F2; text-align: center; padding: 24px 0;">
                  <img src="${logoBottom}" alt="BAI Consulting" style="max-width: 80px; height: auto; opacity: 0.8;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>`,
  };

  await transporter.sendMail(userMailOptions);
}
