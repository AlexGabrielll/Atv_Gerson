import crypto from 'node:crypto';

export function createSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  return crypto.createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

export function generateMasterKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function deriveAesKey(masterKey: string, salt: string): Buffer {
  return crypto.pbkdf2Sync(Buffer.from(masterKey, 'hex'), salt, 100000, 32, 'sha256');
}

export function encryptPayload(value: string, masterKey: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const iv = crypto.randomBytes(12);
  const key = deriveAesKey(masterKey, salt);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = {
    salt,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    data: encrypted.toString('base64')
  };

  return JSON.stringify(payload);
}

export function decryptPayload(serialized: string, masterKey: string): string {
  const payload = JSON.parse(serialized) as {
    salt: string;
    iv: string;
    tag: string;
    data: string;
  };

  const key = deriveAesKey(masterKey, payload.salt);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.data, 'base64')),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 11 || /^\d{11}$/.test(digits) === false || /^(\d)\1{10}$/.test(digits)) {
    return false;
  }

  const first = digits.split('').map(Number);
  const sum1 = first.slice(0, 9).reduce((acc, n, index) => acc + n * (10 - index), 0);
  const digit1 = (sum1 * 10) % 11;
  const d1 = digit1 === 10 ? 0 : digit1;
  const sum2 = first.slice(0, 9).reduce((acc, n, index) => acc + n * (11 - index), 0) + d1 * 2;
  const digit2 = (sum2 * 10) % 11;
  const d2 = digit2 === 10 ? 0 : digit2;

  return d1 === first[9] && d2 === first[10];
}

export function isValidCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14 || /^\d{14}$/.test(digits) === false || /^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const numbers = digits.split('').map(Number);

  const digit1 = computeCheckDigit(numbers.slice(0, 12), firstWeights);
  const digit2 = computeCheckDigit(numbers.slice(0, 12).concat(digit1), secondWeights);

  return numbers[12] === digit1 && numbers[13] === digit2;
}

function computeCheckDigit(numbers: number[], weights: number[]): number {
  const sum = numbers.reduce((acc, number, index) => acc + number * weights[index], 0);
  const mod = sum % 11;
  const result = mod < 2 ? 0 : 11 - mod;
  return result;
}
