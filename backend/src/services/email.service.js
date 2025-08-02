import nodemailer from "nodemailer";

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false, // true pour 465, false pour les autres ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Templates d'emails
const emailTemplates = {
  credentials: (data) => ({
    subject: "Vos identifiants de connexion - BAI Consulting",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #15344B; color: white; padding: 20px; text-align: center;">
          <h1>BAI Consulting</h1>
          <p>Vos identifiants de connexion</p>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2>Bonjour ${data.firstName} ${data.lastName},</h2>
          
          <p>Votre compte a été créé avec succès. Voici vos identifiants de connexion :</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Email :</strong> ${data.email}</p>
            <p><strong>Mot de passe temporaire :</strong> ${data.password}</p>
          </div>
          
          <p style="color: #d32f2f; font-weight: bold;">
            ⚠️ IMPORTANT : Pour des raisons de sécurité, veuillez changer votre mot de passe lors de votre première connexion.
          </p>
          
          <p>Vous pouvez vous connecter à l'adresse suivante :</p>
          <p><a href="${
            process.env.FRONTEND_URL || "http://localhost:3001"
          }/admin/login" style="background-color: #15344B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Se connecter</a></p>
          
          <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
          
          <p>Cordialement,<br>L'équipe BAI Consulting</p>
        </div>
        
        <div style="background-color: #15344B; color: white; padding: 10px; text-align: center; font-size: 12px;">
          © 2024 BAI Consulting. Tous droits réservés.
        </div>
      </div>
    `,
  }),

  passwordReset: (data) => ({
    subject: "Nouveau mot de passe - BAI Consulting",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #15344B; color: white; padding: 20px; text-align: center;">
          <h1>BAI Consulting</h1>
          <p>Nouveau mot de passe</p>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2>Bonjour ${data.firstName} ${data.lastName},</h2>
          
          <p>Votre mot de passe a été réinitialisé. Voici votre nouveau mot de passe :</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Nouveau mot de passe :</strong> ${data.password}</p>
          </div>
          
          <p style="color: #d32f2f; font-weight: bold;">
            ⚠️ IMPORTANT : Pour des raisons de sécurité, veuillez changer ce mot de passe lors de votre prochaine connexion.
          </p>
          
          <p>Vous pouvez vous connecter à l'adresse suivante :</p>
          <p><a href="${
            process.env.FRONTEND_URL || "http://localhost:3001"
          }/admin/login" style="background-color: #15344B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Se connecter</a></p>
          
          <p>Si vous n'avez pas demandé cette réinitialisation, veuillez contacter immédiatement l'administrateur.</p>
          
          <p>Cordialement,<br>L'équipe BAI Consulting</p>
        </div>
        
        <div style="background-color: #15344B; color: white; padding: 10px; text-align: center; font-size: 12px;">
          © 2024 BAI Consulting. Tous droits réservés.
        </div>
      </div>
    `,
  }),

  formationAssigned: (data) => ({
    subject: "Nouvelle formation assignée - BAI Consulting",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #15344B; color: white; padding: 20px; text-align: center;">
          <h1>BAI Consulting</h1>
          <p>Nouvelle formation assignée</p>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2>Bonjour ${data.firstName} ${data.lastName},</h2>
          
          <p>Une nouvelle formation vous a été assignée :</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>${data.formationTitle}</h3>
            <p><strong>Description :</strong> ${data.formationDescription}</p>
            <p><strong>Durée :</strong> ${data.formationDuration} minutes</p>
            <p><strong>Assignée par :</strong> ${data.assignedBy}</p>
            ${
              data.dueDate
                ? `<p><strong>Date limite :</strong> ${new Date(
                    data.dueDate
                  ).toLocaleDateString("fr-FR")}</p>`
                : ""
            }
          </div>
          
          <p>Vous pouvez commencer cette formation dès maintenant :</p>
          <p><a href="${
            process.env.FRONTEND_URL || "http://localhost:3001"
          }/formation/courses/${
      data.formationId
    }" style="background-color: #15344B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Commencer la formation</a></p>
          
          <p>Cordialement,<br>L'équipe BAI Consulting</p>
        </div>
        
        <div style="background-color: #15344B; color: white; padding: 10px; text-align: center; font-size: 12px;">
          © 2024 BAI Consulting. Tous droits réservés.
        </div>
      </div>
    `,
  }),

  formationReminder: (data) => ({
    subject: "Rappel : Formation en attente - BAI Consulting",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #ff9800; color: white; padding: 20px; text-align: center;">
          <h1>BAI Consulting</h1>
          <p>Rappel de formation</p>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2>Bonjour ${data.firstName} ${data.lastName},</h2>
          
          <p>Ceci est un rappel concernant une formation qui vous a été assignée :</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>${data.formationTitle}</h3>
            <p><strong>Description :</strong> ${data.formationDescription}</p>
            <p><strong>Durée :</strong> ${data.formationDuration} minutes</p>
            ${
              data.dueDate
                ? `<p><strong>Date limite :</strong> ${new Date(
                    data.dueDate
                  ).toLocaleDateString("fr-FR")}</p>`
                : ""
            }
          </div>
          
          <p>N'oubliez pas de compléter cette formation :</p>
          <p><a href="${
            process.env.FRONTEND_URL || "http://localhost:3001"
          }/formation/courses/${
      data.formationId
    }" style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Commencer la formation</a></p>
          
          <p>Cordialement,<br>L'équipe BAI Consulting</p>
        </div>
        
        <div style="background-color: #15344B; color: white; padding: 10px; text-align: center; font-size: 12px;">
          © 2024 BAI Consulting. Tous droits réservés.
        </div>
      </div>
    `,
  }),
};

/**
 * Envoie un email
 * @param {object} options - Options d'envoi
 * @param {string} options.to - Destinataire
 * @param {string} options.subject - Sujet (optionnel si template)
 * @param {string} options.html - Contenu HTML (optionnel si template)
 * @param {string} options.template - Nom du template à utiliser
 * @param {object} options.data - Données pour le template
 * @returns {Promise<object>} Résultat de l'envoi
 */
export async function sendEmail(options) {
  try {
    let emailContent;

    if (options.template && emailTemplates[options.template]) {
      emailContent = emailTemplates[options.template](options.data);
    } else {
      emailContent = {
        subject: options.subject,
        html: options.html,
      };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("Email envoyé avec succès:", result.messageId);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error("Erreur envoi email:", error);
    throw new Error("Erreur lors de l'envoi de l'email");
  }
}

/**
 * Envoie un email de test
 * @param {string} to - Destinataire
 * @returns {Promise<object>} Résultat de l'envoi
 */
export async function sendTestEmail(to) {
  return sendEmail({
    to,
    subject: "Test - BAI Consulting",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #15344B; color: white; padding: 20px; text-align: center;">
          <h1>BAI Consulting</h1>
          <p>Test de configuration email</p>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <h2>Test réussi !</h2>
          <p>La configuration email fonctionne correctement.</p>
          <p>Date et heure : ${new Date().toLocaleString("fr-FR")}</p>
        </div>
        
        <div style="background-color: #15344B; color: white; padding: 10px; text-align: center; font-size: 12px;">
          © 2024 BAI Consulting. Tous droits réservés.
        </div>
      </div>
    `,
  });
}
