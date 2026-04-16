const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendMail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  });
};

// ─── Shared layout wrapper ────────────────────────────────────
const layout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #f0f4f8; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 36px 40px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 1px; }
    .header p { color: #a0b4cc; font-size: 13px; margin-top: 6px; }
    .body { padding: 40px; color: #2d3748; }
    .body p { font-size: 15px; line-height: 1.7; margin-bottom: 16px; }
    .highlight-box { background: #f7fafc; border-left: 4px solid #0f3460; border-radius: 6px; padding: 20px 24px; margin: 24px 0; }
    .highlight-box p { margin: 6px 0; font-size: 14px; color: #4a5568; }
    .highlight-box strong { color: #1a202c; }
    .otp-box { background: linear-gradient(135deg, #0f3460, #1a1a2e); border-radius: 10px; padding: 28px; text-align: center; margin: 28px 0; }
    .otp-box .otp { font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace; }
    .otp-box .otp-label { color: #a0b4cc; font-size: 13px; margin-top: 10px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #0f3460, #1a1a2e); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 20px 0; }
    .warning { background: #fff5f5; border-left: 4px solid #e53e3e; border-radius: 6px; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #c53030; }
    .success-icon { text-align: center; font-size: 56px; margin-bottom: 16px; }
    .footer { background: #f7fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { font-size: 12px; color: #a0aec0; line-height: 1.6; }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🏢 HR Portal</h1>
      <p>Human Resources Management System</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>This is an automated email from HR Portal. Please do not reply to this email.</p>
      <p style="margin-top:8px;">© ${new Date().getFullYear()} HR Portal. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

// ════════════════════════════════════════════════════════════
// 1. Credentials Email — sent when admin/employee is created
// ════════════════════════════════════════════════════════════
const sendCredentialsMail = async ({ to, name, email, password, role }) => {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const html = layout(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>Welcome to <strong>HR Portal</strong>! Your account has been created as <strong>${roleLabel}</strong>. Here are your login credentials:</p>
    <div class="highlight-box">
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> <span style="font-family:monospace;font-size:15px;color:#0f3460;">${password}</span></p>
      <p><strong>Role:</strong> ${roleLabel}</p>
    </div>
    <div class="warning">
      ⚠️ You will be required to change your password on your first login. Please do not share your credentials with anyone.
    </div>
    <p style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">Login to HR Portal →</a>
    </p>
    <div class="divider"></div>
    <p style="font-size:13px;color:#718096;">If you did not expect this email, please contact your HR administrator immediately.</p>
  `);

  await sendMail({ to, subject: '🎉 Welcome to HR Portal — Your Login Credentials', html });
};

// ════════════════════════════════════════════════════════════
// 2. OTP Email — sent on forgot password request
// ════════════════════════════════════════════════════════════
const sendPasswordResetMail = async ({ to, name, token }) => {
  const html = layout(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>We received a request to reset your HR Portal password. Use the OTP below to proceed:</p>
    <div class="otp-box">
      <div class="otp">${token}</div>
      <div class="otp-label">This OTP is valid for <strong style="color:#fff;">15 minutes</strong> and can only be used once.</div>
    </div>
    <div class="warning">
      ⚠️ Never share this OTP with anyone. HR Portal staff will never ask for your OTP.
    </div>
    <div class="divider"></div>
    <p style="font-size:13px;color:#718096;">If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
  `);

  await sendMail({ to, subject: '🔐 HR Portal — Password Reset OTP', html });
};

// ════════════════════════════════════════════════════════════
// 3. Password Reset Success Email — sent after successful reset
// ════════════════════════════════════════════════════════════
const sendPasswordResetSuccessMail = async ({ to, name }) => {
  const resetTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const html = layout(`
    <div class="success-icon">✅</div>
    <p style="text-align:center;font-size:20px;font-weight:700;color:#1a202c;">Password Reset Successful</p>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your HR Portal password has been successfully reset. You can now log in with your new password.</p>
    <div class="highlight-box">
      <p><strong>Account:</strong> ${to}</p>
      <p><strong>Reset at:</strong> ${resetTime} (IST)</p>
    </div>
    <p style="text-align:center;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">Login to HR Portal →</a>
    </p>
    <div class="warning">
      ⚠️ If you did not reset your password, your account may be compromised. Contact your HR administrator immediately or use <strong>Forgot Password</strong> to secure your account.
    </div>
  `);

  await sendMail({ to, subject: '✅ HR Portal — Password Reset Successful', html });
};

module.exports = { sendCredentialsMail, sendPasswordResetMail, sendPasswordResetSuccessMail };
