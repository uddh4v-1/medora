/** Normalize Indian mobile input (UI uses +91) to E.164-style `91XXXXXXXXXX`. */
export function normalizeIndianMobile(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return `91${digits}`;
  }
  if (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  return null;
}
