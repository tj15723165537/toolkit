import CryptoJS from 'crypto-js';

// 配置 crypto-js 使用 JavaScript 随机数生成器，而不是 Web Crypto API
// React Native 不支持 Web Crypto API
if (typeof crypto === 'undefined') {
  CryptoJS.lib.WordArray.random = function (nWords: number) {
    const words: number[] = [];
    for (let i = 0; i < nWords; i++) {
      words[i] = Math.random() * 0x100000000 | 0;
    }
    return CryptoJS.lib.WordArray.create(words, nWords);
  };
}

/**
 * 使用主密码生成加密密钥（SHA256 哈希）
 */
export function generateKey(masterPassword: string): string {
  return CryptoJS.SHA256(masterPassword).toString();
}

/**
 * 使用 PBKDF2 生成更安全的密钥
 */
export function deriveKey(masterPassword: string, salt: string): string {
  return CryptoJS.PBKDF2(masterPassword, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  }).toString();
}

/**
 * 加密文本
 */
export function encrypt(text: string, key: string): string {
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
}

/**
 * 解密文本
 */
export function decrypt(encryptedText: string, key: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, key, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decryption failed');
    }
    return decrypted;
  } catch (error) {
    throw new Error('Invalid password or corrupted data');
  }
}

/**
 * 哈希密码（用于验证主密码）
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password + 'SALT_FOR_MASTER_PASSWORD').toString();
}

/**
 * 密码生成选项
 */
export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

/**
 * 生成随机密码
 */
export function generatePassword(options: Partial<PasswordOptions> = {}): string {
  const config: PasswordOptions = {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    ...options,
  };

  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charset = '';
  let password = '';

  if (config.uppercase) {
    charset += uppercase;
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
  }
  if (config.lowercase) {
    charset += lowercase;
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
  }
  if (config.numbers) {
    charset += numbers;
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }
  if (config.symbols) {
    charset += symbols;
    password += symbols[Math.floor(Math.random() * symbols.length)];
  }

  // 如果没有选择任何字符类型，使用小写字母
  if (charset === '') {
    charset = lowercase;
  }

  // 填充剩余长度
  for (let i = password.length; i < config.length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // 打乱密码顺序
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * 评估密码强度
 */
export function assessPasswordStrength(password: string): {
  score: number; // 0-4
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const labels = ['很弱', '弱', '一般', '强', '很强'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    color: colors[Math.min(score, 4)],
  };
}
