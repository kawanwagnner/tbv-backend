const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const cors = require("cors");
const SMTP_CONFIG = require("./config/smtp");

const app = express();
const port = 3000;

// Use CORS middleware to allow requests from different origins
app.use(cors());

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Nodemailer transport configuration
const transporter = nodemailer.createTransport({
  host: SMTP_CONFIG.host,
  port: SMTP_CONFIG.port,
  secure: SMTP_CONFIG.port === 465, // Use true for port 465 (secure SMTP)
  auth: {
    user: SMTP_CONFIG.user,
    pass: SMTP_CONFIG.pass,
  },
  tls: {
    rejectUnauthorized: false, // Allow unauthorized connections (useful for testing)
  },
});

// Validation function
function validateEmailInput(input) {
  const { nome, email, zap, destination, quest } = input;

  if (!nome || typeof nome !== "string" || nome.trim() === "") {
    return "Nome é obrigatório e deve ser uma string válida.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return "Email é obrigatório e deve ser um email válido.";
  }

  if (!zap || typeof zap !== "string" || zap.trim() === "") {
    return "WhatsApp é obrigatório e deve ser uma string válida.";
  }

  if (
    !destination ||
    typeof destination !== "string" ||
    destination.trim() === ""
  ) {
    return "Destino desejado é obrigatório e deve ser um texto válido.";
  }

  if (!quest || typeof quest !== "string" || quest.trim() === "") {
    return "Por onde nos encontrou é obrigatório e deve ser um texto válido.";
  }

  return null; // Return null if all validations pass
}

// Test route for POST
app.post("/test", (req, res) => {
  res.status(200).send("Rota POST /test funcionando!");
});

// Route to send email
app.post("/send-email", async (req, res) => {
  // Client input validation
  const validationError = validateEmailInput(req.body);
  if (validationError) {
    return res.status(400).send(validationError); // Return validation error
  }

  const { nome, email, zap, destination, quest } = req.body;
  console.log(req.body);

  try {
    const mailOptions = {
      from: `"${nome}" <${email}>`,
      to: "newsletter.tbv@gmail.com",
      subject: `${nome} se inscreveu para receber descontos!`,
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px; background-color: #f9f9f9;">
              <!-- Logo space -->
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: blue;">
                  <span style="color: #000;">TravelBuena</span>Vista
                </h1>
              </div>
              <h2 style="text-align: center; color: #0056b3;">Informações para Contato</h2>
              <p><strong>Nome:</strong> ${nome}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #0056b3; text-decoration: none;">${email}</a></p>
              <p><strong>WhatsApp:</strong> ${zap}</p>
              <p><strong>Para onde gostaria de ir:</strong> ${destination}</p>
              <p><strong>Por onde nos encontou:</strong> ${quest}</p>
              <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="text-align: center; margin-top: 50px;">
                <a href="https://kawanwagnner.github.io/Portfolio/" style="background-color: #0056b3; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">[Suporte]</a>
              </p>
            </div>
          </body>
        </html>
      `,
    };

    // Send email and capture send info
    const mailSent = await transporter.sendMail(mailOptions);

    // Log detailed send info
    console.log("Email enviado com sucesso:", mailSent);

    if (mailSent.accepted.length > 0) {
      console.log("Destinatários que aceitaram o email:", mailSent.accepted);
    } else {
      console.log("Nenhum destinatário aceitou o email.");
    }

    // Send response to client with send info
    res
      .status(200)
      .send(`Email enviado com sucesso para: ${mailSent.accepted.join(", ")}`);
  } catch (error) {
    console.error("Erro ao enviar o Email:", error);
    res.status(500).send(`Erro ao enviar o Email: ${error.message}`);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
