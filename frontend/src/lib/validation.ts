/** Shared client-side validation helpers. */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/** Accepts 10-digit Indian numbers with optional +91/91 prefix. */
export function isValidIndianPhone(phone: string): boolean {
  const digits = phone.replace(/[\s\-()]/g, "");
  return /^(?:\+91|91)?[6-9]\d{9}$/.test(digits);
}

/** 6-digit Indian pincode. */
export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode.trim());
}

/** GST number: 2-digit state code + 10-char PAN + 1Z + 1 check digit. */
export function isValidGST(gst: string): boolean {
  return /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst.trim().toUpperCase());
}

export function isPositiveNumber(value: string | number): boolean {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return !isNaN(n) && n > 0;
}

export function isNonNegativeInteger(value: string): boolean {
  const n = parseInt(value, 10);
  return !isNaN(n) && n >= 0 && String(n) === value.trim();
}
