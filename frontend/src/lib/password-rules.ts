/** Same “strong” bar as signup: length ≥8, upper + lower + digit + special. */

export type PasswordRequirementFlags = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  digit: boolean;
  symbol: boolean;
};

export function analyzePasswordRequirements(pw: string): PasswordRequirementFlags {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
}

export function meetsStrongPassword(pw: string): boolean {
  const f = analyzePasswordRequirements(pw);
  return f.length && f.upper && f.lower && f.digit && f.symbol;
}
