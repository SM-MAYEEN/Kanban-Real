import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// .env load kora ensure kora
dotenv.config();

export const sendInviteEmail = async ({ toEmail, boardTitle, inviteLink, inviterName }) => {
  // Debug check: terminal-e print kore dekho value pacche kina
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('CRITICAL EMAIL ERROR: EMAIL_USER or EMAIL_PASS missing in .env!');
    throw new Error('Missing email credentials in environment variables');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_PASS.trim(),
    },
  });

  const mailOptions = {
    from: `"KanbanFlow Team" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🚀 ${inviterName} invited you to collaborate on "${boardTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #07090e; color: #f1f5f9; padding: 40px; border-radius: 16px; max-width: 600px; margin: auto; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #fbbf24; margin: 0; font-size: 24px;">KanbanFlow Enterprise</h2>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Real-Time Collaborative Workspace</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6; color: #e2e8f0;">
          Hello,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          <strong style="color: #fbbf24;">${inviterName}</strong> has invited you to join and collaborate on the board:
          <br/>
          <strong style="color: #ffffff; font-size: 16px;">"${boardTitle}"</strong>.
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">
          Open the invitation link and sign in with this email address. If you already have an account, use that account. You will join the board only after you select <strong style="color: #fbbf24;">Accept invitation</strong>.
        </p>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${inviteLink}" 
             style="background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #090d16; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
            Review & Accept Invitation
          </a>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
          If the button above does not work, copy and paste this link into your browser:
          <br/>
          <a href="${inviteLink}" style="color: #38bdf8; word-break: break-all;">${inviteLink}</a>
        </p>

        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 30px 0;" />
        <p style="font-size: 11px; text-align: center; color: #475569;">
          © 2026 KanbanFlow. Real-time agile management made simple.
        </p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  const recipientAccepted = info.accepted.some(
    (recipient) => String(recipient).toLowerCase() === toEmail.trim().toLowerCase(),
  );
  if (!recipientAccepted) {
    throw new Error('Email provider did not accept the invitation recipient');
  }
  console.log('✅ Email sent successfully! Message ID:', info.messageId);
  return info;
};

export const sendPasswordResetEmail = async ({ toEmail, resetLink }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service is not configured');
  }
  if (!process.env.CLIENT_URL) {
    throw new Error('CLIENT_URL is not configured');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_PASS.trim(),
    },
  });

  const info = await transporter.sendMail({
    from: `"KanbanFlow Team" <${process.env.EMAIL_USER.trim()}>`,
    to: toEmail,
    subject: 'Reset your KanbanFlow password',
    text: `Use this link to reset your password. It expires in 1 hour: ${resetLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 32px; color: #e2e8f0; background: #07090e; border-radius: 16px;">
        <h2 style="color: #fbbf24;">Reset your password</h2>
        <p>We received a request to reset your KanbanFlow password. This link expires in 1 hour.</p>
        <p><a href="${resetLink}" style="display: inline-block; padding: 12px 20px; color: #090d16; background: #fbbf24; border-radius: 8px; text-decoration: none; font-weight: bold;">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });

  const recipientAccepted = info.accepted.some(
    (recipient) => String(recipient).toLowerCase() === toEmail.trim().toLowerCase(),
  );
  if (!recipientAccepted) {
    throw new Error('Email provider did not accept the password reset recipient');
  }

  console.log('Password reset email sent. Message ID:', info.messageId);
  return info;
};