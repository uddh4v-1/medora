/** Subdomains/paths we reserve so clinics cannot claim them as URL slugs. */
export const RESERVED_CLINIC_SLUGS = new Set([
  "api",
  "admin",
  "www",
  "app",
  "dashboard",
  "login",
  "signup",
  "sign-up",
  "onboarding",
  "health",
  "me",
  "static",
  "assets",
  "public",
]);

export const EXPORT_TYPES = ["patients", "appointments", "prescriptions", "invoices"] as const;

export const CLINIC_SELECT = {
  id: true, name: true, slug: true, phone: true,
  address: true, city: true, state: true, pincode: true,
  specialties: true, description: true, logoUrl: true, brandColor: true, createdAt: true,
} as const;

export const SUB_SELECT = {
  plan: true,
  billingStatus: true,
  trialEndsAt: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
} as const;
