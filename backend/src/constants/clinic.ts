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
