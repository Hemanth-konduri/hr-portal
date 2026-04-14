const crypto = require('crypto');

// Generate a secure random temporary password
// Meets: uppercase, lowercase, number, special char, min 10 chars
const generateTempPassword = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '@#$!%*?&';
  const all = upper + lower + numbers + special;

  let password =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < 10; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Generate employee ID like EMP001, EMP002
const generateEmployeeId = (count) => {
  return `EMP${String(count + 1).padStart(3, '0')}`;
};

// Generate a 6-digit OTP token for password reset
const generateResetToken = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Hash a token using SHA256 (for storing in DB — never store raw token)
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = { generateTempPassword, generateEmployeeId, generateResetToken, hashToken };
