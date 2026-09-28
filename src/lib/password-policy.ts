// Isomorphic (client + server). bcrypt only uses the first 72 bytes, so we cap there.
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 72;
export const PASSWORD_HINT = "At least 10 characters, with at least one letter and one number.";

export function validatePassword(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (pw.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters.`;
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return "Password must contain at least one letter and one number.";
  return null;
}

/** Cryptographically random, readable (no look-alike characters) password that satisfies the policy. */
export function generatePassword(length = 14): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*?";
  const all = letters + digits + symbols;
  const rand = (max: number) => {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] % max;
  };
  for (let attempt = 0; attempt < 20; attempt++) {
    let out = "";
    for (let i = 0; i < length; i++) out += all[rand(all.length)];
    if (validatePassword(out) === null) return out;
  }
  return "Tmp" + digits[rand(digits.length)] + letters.slice(0, 8) + "9x";
}
