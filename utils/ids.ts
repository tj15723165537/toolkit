export function generatePasswordRecordId(): string {
  const cryptoObj = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  const randomUUID = cryptoObj?.randomUUID;

  if (typeof randomUUID === 'function') {
    return `pwd_${randomUUID()}`;
  }

  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 12);
  return `pwd_${ts}_${rand}`;
}
