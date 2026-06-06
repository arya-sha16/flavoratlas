import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '2525');
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@flavoratlas.com';

let transporter = null;

try {
  // If credential is empty or is default placeholder, skip creating real transport
  const isMock = !EMAIL_USER || EMAIL_USER.includes('your-') || EMAIL_USER.includes('mock-');
  
  if (!isMock) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
    console.log('📬 SMTP Transporter configured.');
  }
} catch (error) {
  console.warn('⚠️ SMTP Configuration failed. Falling back to log-only email service:', error.message);
}

export const emailService = {
  async sendVerificationEmail(email, name, token) {
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
    const subject = 'Verify your FlavorAtlas Account';
    const text = `Hi ${name},\n\nWelcome to FlavorAtlas! Please verify your account by clicking the link below:\n\n${verifyUrl}\n\nHappy Culinary Discoveries!\nFlavorAtlas Team`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e8890c; border-radius: 8px;">
        <h2 style="color: #e8890c; margin-top: 0;">FlavorAtlas Discovery Platform</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Welcome to FlavorAtlas! Please verify your account by clicking the button below:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${verifyUrl}" style="background-color: #e8890c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 12px; color: #666;">Or copy and paste this link in your browser: <br>${verifyUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #888;">FlavorAtlas Team, 2026</p>
      </div>
    `;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: EMAIL_FROM,
          to: email,
          subject,
          text,
          html
        });
        console.log(`📧 Verification email sent to ${email}`);
        return true;
      } catch (err) {
        console.error(`⚠️ SMTP send failed to ${email}:`, err.message);
      }
    }

    // Console Logging Fallback for local dev
    console.log('\n==================================================');
    console.log(`📨 MOCK EMAIL OUTBOX: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Verify Link: ${verifyUrl}`);
    console.log('==================================================\n');
    return true;
  },

  async sendPasswordResetEmail(email, name, token) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    const subject = 'Reset your FlavorAtlas Password';
    const text = `Hi ${name},\n\nYou requested a password reset. Reset your password by clicking the link below:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\nFlavorAtlas Team`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e8890c; border-radius: 8px;">
        <h2 style="color: #e8890c; margin-top: 0;">FlavorAtlas Password Reset</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #c25b3f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #666;">Or copy and paste this link in your browser: <br>${resetUrl}</p>
        <p style="font-size: 12px; color: #888;">If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #888;">FlavorAtlas Team, 2026</p>
      </div>
    `;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: EMAIL_FROM,
          to: email,
          subject,
          text,
          html
        });
        console.log(`📧 Reset password email sent to ${email}`);
        return true;
      } catch (err) {
        console.error(`⚠️ SMTP send failed to ${email}:`, err.message);
      }
    }

    // Console Logging Fallback for local dev
    console.log('\n==================================================');
    console.log(`📨 MOCK EMAIL OUTBOX: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log('==================================================\n');
    return true;
  }
};

export default emailService;
