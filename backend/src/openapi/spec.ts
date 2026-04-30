import { getEnv } from "@/config/env";

/** OpenAPI 3.0 document for Scalar (`/api/docs`). */
export function getOpenApiSpec(): Record<string, unknown> {
  const env = getEnv();
  const cookieName = env.AUTH_COOKIE_NAME;

  const sessionSecurity = [{ SessionCookie: [] }, { BearerAuth: [] }];

  return {
    openapi: "3.0.3",
    info: {
      title: "Medora API",
      version: "0.1.0",
      description:
        "Clinic API (Express + Prisma). Session JWT is stored in an HttpOnly cookie after login; `/me` also accepts `Authorization: Bearer`. Open docs at the **same host/port** you use for the API (e.g. only `localhost` or only `127.0.0.1`) so Try it requests stay same-origin.",
    },
    /**
     * Relative base URL so Scalar "Try it" hits whichever origin you used to open `/api/docs`
     * (`localhost` vs `127.0.0.1` are different origins — a fixed `http://localhost:PORT` breaks CSP + fetch).
     */
    servers: [{ url: "/", description: "Same origin as this page" }],
    tags: [
      { name: "Meta", description: "API metadata and health" },
      { name: "Auth", description: "Authentication (cookie session)" },
      { name: "Dashboard", description: "Clinic dashboard data and operations" },
      { name: "Patients", description: "Patient management" },
      { name: "Visits", description: "Visit / consultation records" },
      { name: "Appointments", description: "Appointment scheduling" },
      { name: "Prescriptions", description: "Prescription management" },
      { name: "Invoices", description: "Invoice management" },
      { name: "Team", description: "Clinic team members (Owner-managed)" },
      { name: "Clinic", description: "Clinic settings and profile" },
      { name: "Audit", description: "Audit log (SuperAdmin view)" },
      { name: "SuperAdmin", description: "Platform-level admin operations" },
    ],
    paths: {
      // ── Meta ──────────────────────────────────────────────────────────────
      "/health": {
        get: {
          tags: ["Meta"],
          summary: "Liveness",
          description: "Load-balancer probe; does not hit the database.",
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["ok", "service", "ts"],
                    properties: {
                      ok: { type: "boolean" },
                      service: { type: "string", example: "medora-api" },
                      ts: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api": {
        get: {
          tags: ["Meta"],
          summary: "API info",
          responses: {
            "200": {
              description: "Service pointers",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string" },
                      version: { type: "string" },
                      docs: { type: "string" },
                      authBase: { type: "string" },
                      auth: { type: "array", items: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/health": {
        get: {
          tags: ["Meta"],
          summary: "Health (database)",
          responses: {
            "200": {
              description: "DB connectivity status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["ok", "service", "database", "ts"],
                    properties: {
                      ok: { type: "boolean" },
                      service: { type: "string" },
                      database: { type: "string", enum: ["ok", "unavailable"] },
                      ts: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ── Auth ──────────────────────────────────────────────────────────────
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register clinic + owner",
          description:
            "Creates a **Clinic**, an **Owner** user (linked), and sets HttpOnly session cookie (JWT). Token is not returned in JSON.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["clinicName", "phone", "ownerName", "email", "password", "slug", "acceptTerms"],
                  properties: {
                    clinicName: { type: "string", minLength: 2 },
                    phone: { type: "string", description: "Indian mobile; normalized to `91XXXXXXXXXX`" },
                    ownerName: { type: "string", minLength: 2 },
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password", minLength: 8 },
                    slug: {
                      type: "string",
                      pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                      maxLength: 60,
                      description: "URL-safe clinic slug (lowercase)",
                    },
                    acceptTerms: { type: "boolean", enum: [true] },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Created and signed in",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["user", "signedInAt"],
                    properties: {
                      user: { $ref: "#/components/schemas/User" },
                      signedInAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
            "400": { description: "Validation error" },
            "409": { description: "Email or slug already taken" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          description: "Sets HttpOnly session cookie (JWT). Token is not returned in JSON.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" },
                    rememberMe: { type: "boolean" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Signed in",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["user", "signedInAt"],
                    properties: {
                      user: { $ref: "#/components/schemas/User" },
                      signedInAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
            "400": { description: "Validation error" },
            "401": { description: "Invalid credentials" },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout",
          description: "Clears session cookie.",
          responses: { "204": { description: "Cookie cleared" } },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Current user",
          security: sessionSecurity,
          responses: {
            "200": {
              description: "Current user",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["user"],
                    properties: { user: { $ref: "#/components/schemas/User" } },
                  },
                },
              },
            },
            "401": { description: "Not authenticated" },
          },
        },
      },
      "/api/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Refresh session token",
          description: "Issues a fresh JWT cookie from a valid existing cookie.",
          security: sessionSecurity,
          responses: {
            "200": { description: "Token refreshed; new cookie set" },
            "401": { description: "Not authenticated or token expired" },
          },
        },
      },
      "/api/auth/forgot-password": {
        post: {
          tags: ["Auth"],
          summary: "Request password reset email",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: { email: { type: "string", format: "email" } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Email sent (always 200 to avoid enumeration)" },
            "400": { description: "Validation error" },
          },
        },
      },
      "/api/auth/reset-password": {
        post: {
          tags: ["Auth"],
          summary: "Reset password with token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token", "password"],
                  properties: {
                    token: { type: "string" },
                    password: { type: "string", format: "password", minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Password reset; session cookie set" },
            "400": { description: "Validation error or invalid/expired token" },
          },
        },
      },
      "/api/auth/send-verification": {
        post: {
          tags: ["Auth"],
          summary: "Send email verification link",
          security: sessionSecurity,
          responses: {
            "200": { description: "Verification email sent" },
            "401": { description: "Not authenticated" },
          },
        },
      },
      "/api/auth/verify-email": {
        post: {
          tags: ["Auth"],
          summary: "Verify email with token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token"],
                  properties: { token: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Email verified" },
            "400": { description: "Invalid or expired token" },
          },
        },
      },
      "/api/auth/change-password": {
        post: {
          tags: ["Auth"],
          summary: "Change password (authenticated)",
          security: sessionSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["currentPassword", "newPassword"],
                  properties: {
                    currentPassword: { type: "string", format: "password" },
                    newPassword: { type: "string", format: "password", minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Password changed" },
            "400": { description: "Validation error or wrong current password" },
            "401": { description: "Not authenticated" },
          },
        },
      },

      // ── Dashboard ─────────────────────────────────────────────────────────
      "/api/dashboard/overview": {
        get: {
          tags: ["Dashboard"],
          summary: "Dashboard overview",
          security: sessionSecurity,
          responses: {
            "200": { description: "Overview payload" },
            "401": { description: "Not authenticated" },
          },
        },
      },
      "/api/dashboard/patients": {
        get: {
          tags: ["Dashboard"],
          summary: "List/search patients",
          security: sessionSecurity,
          parameters: [
            { name: "search", in: "query", schema: { type: "string", maxLength: 120 } },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          ],
          responses: {
            "200": { description: "Patients list with pagination" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
          },
        },
      },
      "/api/dashboard/queue": {
        get: {
          tags: ["Dashboard"],
          summary: "Get visit queue and counts",
          security: sessionSecurity,
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["waiting", "in-progress", "completed"] },
            },
          ],
          responses: {
            "200": { description: "Queue list and status counts" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
          },
        },
      },
      "/api/dashboard/queue/{visitId}/status": {
        patch: {
          tags: ["Dashboard"],
          summary: "Update queue visit status",
          security: sessionSecurity,
          parameters: [
            { name: "visitId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: { type: "string", enum: ["waiting", "in-progress", "completed"] },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Status updated" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
            "404": { description: "Visit not found" },
          },
        },
      },
      "/api/dashboard/invoices": {
        get: {
          tags: ["Dashboard"],
          summary: "List invoices with filters",
          security: sessionSecurity,
          parameters: [
            { name: "status", in: "query", schema: { type: "string", enum: ["paid", "unpaid"] } },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          ],
          responses: {
            "200": { description: "Invoices list with pagination" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
          },
        },
      },
      "/api/dashboard/revenue/summary": {
        get: {
          tags: ["Dashboard"],
          summary: "Revenue summary for date range",
          security: sessionSecurity,
          parameters: [
            { name: "from", in: "query", required: true, schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" } },
            { name: "to", in: "query", required: true, schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" } },
          ],
          responses: {
            "200": { description: "Revenue summary payload" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
          },
        },
      },

      // ── Patients ──────────────────────────────────────────────────────────
      "/api/patients": {
        post: {
          tags: ["Patients"],
          summary: "Create patient",
          security: sessionSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PatientInput" },
              },
            },
          },
          responses: {
            "201": { description: "Patient created" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
          },
        },
      },
      "/api/patients/{patientId}": {
        get: {
          tags: ["Patients"],
          summary: "Get patient",
          security: sessionSecurity,
          parameters: [
            { name: "patientId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Patient detail" },
            "401": { description: "Not authenticated" },
            "404": { description: "Patient not found" },
          },
        },
        patch: {
          tags: ["Patients"],
          summary: "Update patient",
          security: sessionSecurity,
          parameters: [
            { name: "patientId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PatientInput" },
              },
            },
          },
          responses: {
            "200": { description: "Patient updated" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
            "404": { description: "Patient not found" },
          },
        },
      },

      // ── Visits ────────────────────────────────────────────────────────────
      "/api/visits": {
        post: {
          tags: ["Visits"],
          summary: "Create visit",
          security: sessionSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["patientId"],
                  properties: {
                    patientId: { type: "string" },
                    notes: { type: "string" },
                    chiefComplaint: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Visit created" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
          },
        },
      },

      // ── Appointments ──────────────────────────────────────────────────────
      "/api/appointments": {
        get: {
          tags: ["Appointments"],
          summary: "List appointments",
          security: sessionSecurity,
          parameters: [
            { name: "date", in: "query", schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          ],
          responses: {
            "200": { description: "Appointments list" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
          },
        },
        post: {
          tags: ["Appointments"],
          summary: "Create appointment",
          security: sessionSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["patientId", "scheduledAt"],
                  properties: {
                    patientId: { type: "string" },
                    scheduledAt: { type: "string", format: "date-time" },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Appointment created" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
          },
        },
      },
      "/api/appointments/{appointmentId}/status": {
        patch: {
          tags: ["Appointments"],
          summary: "Update appointment status",
          security: sessionSecurity,
          parameters: [
            { name: "appointmentId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: { status: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Status updated" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
            "404": { description: "Appointment not found" },
          },
        },
      },

      // ── Prescriptions ─────────────────────────────────────────────────────
      "/api/prescriptions": {
        get: {
          tags: ["Prescriptions"],
          summary: "List prescriptions",
          security: sessionSecurity,
          parameters: [
            { name: "patientId", in: "query", schema: { type: "string" } },
            { name: "visitId", in: "query", schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          ],
          responses: {
            "200": { description: "Prescriptions list" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
          },
        },
        post: {
          tags: ["Prescriptions"],
          summary: "Create prescription",
          security: sessionSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["visitId", "items"],
                  properties: {
                    visitId: { type: "string" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["name", "dosage", "frequency"],
                        properties: {
                          name: { type: "string" },
                          dosage: { type: "string" },
                          frequency: { type: "string" },
                          duration: { type: "string" },
                          instructions: { type: "string" },
                        },
                      },
                    },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Prescription created" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
          },
        },
      },
      "/api/prescriptions/{prescriptionId}": {
        get: {
          tags: ["Prescriptions"],
          summary: "Get prescription",
          security: sessionSecurity,
          parameters: [
            { name: "prescriptionId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Prescription detail" },
            "401": { description: "Not authenticated" },
            "404": { description: "Prescription not found" },
          },
        },
      },

      // ── Invoices ──────────────────────────────────────────────────────────
      "/api/invoices": {
        post: {
          tags: ["Invoices"],
          summary: "Create invoice",
          security: sessionSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["patientId", "items"],
                  properties: {
                    patientId: { type: "string" },
                    visitId: { type: "string" },
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["description", "amount"],
                        properties: {
                          description: { type: "string" },
                          amount: { type: "number" },
                        },
                      },
                    },
                    notes: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Invoice created" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
          },
        },
      },
      "/api/invoices/{invoiceId}/status": {
        patch: {
          tags: ["Invoices"],
          summary: "Update invoice payment status",
          security: sessionSecurity,
          parameters: [
            { name: "invoiceId", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: { status: { type: "string", enum: ["paid", "unpaid"] } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Status updated" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
            "404": { description: "Invoice not found" },
          },
        },
      },

      // ── Team ──────────────────────────────────────────────────────────────
      "/api/team": {
        get: {
          tags: ["Team"],
          summary: "List team members",
          security: sessionSecurity,
          responses: {
            "200": { description: "Team members list" },
            "401": { description: "Not authenticated" },
          },
        },
        post: {
          tags: ["Team"],
          summary: "Add team member (Owner only)",
          security: sessionSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "role"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    role: { type: "string", enum: ["Doctor", "Receptionist"] },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Member invited" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
            "403": { description: "Owner role required" },
            "409": { description: "Email already in team" },
          },
        },
      },
      "/api/team/{userId}": {
        delete: {
          tags: ["Team"],
          summary: "Remove team member (Owner only)",
          security: sessionSecurity,
          parameters: [
            { name: "userId", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "204": { description: "Member removed" },
            "401": { description: "Not authenticated" },
            "403": { description: "Owner role required" },
            "404": { description: "User not found" },
          },
        },
      },

      // ── Clinic ────────────────────────────────────────────────────────────
      "/api/clinic": {
        get: {
          tags: ["Clinic"],
          summary: "Get clinic profile",
          security: sessionSecurity,
          responses: {
            "200": { description: "Clinic detail" },
            "401": { description: "Not authenticated" },
          },
        },
        patch: {
          tags: ["Clinic"],
          summary: "Update clinic profile (Owner only)",
          security: sessionSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string", minLength: 2 },
                    phone: { type: "string" },
                    address: { type: "string" },
                    logoUrl: { type: "string", format: "uri" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Clinic updated" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
            "403": { description: "Owner role required" },
          },
        },
      },

      // ── Audit ─────────────────────────────────────────────────────────────
      "/api/audit/event": {
        post: {
          tags: ["Audit"],
          summary: "Post client-side audit event",
          description: "Any authenticated user can post client-side events (page views, clicks).",
          security: sessionSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["event"],
                  properties: {
                    event: { type: "string" },
                    meta: { type: "object", additionalProperties: true },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Event recorded" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
          },
        },
      },
      "/api/audit/logs": {
        get: {
          tags: ["Audit"],
          summary: "List audit logs (SuperAdmin only)",
          security: sessionSecurity,
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
            { name: "userId", in: "query", schema: { type: "string" } },
            { name: "clinicId", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Audit log entries" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
          },
        },
      },
      "/api/audit/stats": {
        get: {
          tags: ["Audit"],
          summary: "Audit stats (SuperAdmin only)",
          security: sessionSecurity,
          responses: {
            "200": { description: "Aggregate audit stats" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
          },
        },
      },

      // ── SuperAdmin ────────────────────────────────────────────────────────
      "/api/superadmin/exit-impersonation": {
        post: {
          tags: ["SuperAdmin"],
          summary: "Exit impersonation session",
          description:
            "Clears the impersonation cookie. Must be called while holding the impersonation cookie (role = Owner); does **not** require the SuperAdmin role.",
          security: [{ ImpersonationCookie: [] }],
          responses: {
            "200": {
              description: "Impersonation cookie cleared",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { ok: { type: "boolean" } } },
                },
              },
            },
            "401": { description: "Not authenticated" },
          },
        },
      },
      "/api/superadmin/clinics": {
        get: {
          tags: ["SuperAdmin"],
          summary: "List all clinics",
          security: sessionSecurity,
          parameters: [
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
          ],
          responses: {
            "200": { description: "Clinics list" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
          },
        },
      },
      "/api/superadmin/clinics/{id}": {
        get: {
          tags: ["SuperAdmin"],
          summary: "Get clinic detail",
          security: sessionSecurity,
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Clinic detail" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
            "404": { description: "Clinic not found" },
          },
        },
        delete: {
          tags: ["SuperAdmin"],
          summary: "Delete clinic",
          security: sessionSecurity,
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "204": { description: "Clinic deleted" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
            "404": { description: "Clinic not found" },
          },
        },
      },
      "/api/superadmin/clinics/{id}/status": {
        patch: {
          tags: ["SuperAdmin"],
          summary: "Set clinic status",
          security: sessionSecurity,
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: { status: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Status updated" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
            "404": { description: "Clinic not found" },
          },
        },
      },
      "/api/superadmin/clinics/{id}/impersonate": {
        post: {
          tags: ["SuperAdmin"],
          summary: "Impersonate clinic (start session)",
          description:
            "Issues a short-lived impersonation JWT cookie. Use **Exit impersonation** to clear it.",
          security: sessionSecurity,
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Impersonation cookie set", content: { "application/json": { schema: { type: "object", properties: { clinicId: { type: "string" }, ownerEmail: { type: "string" } } } } } },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
            "404": { description: "Clinic not found" },
          },
        },
      },
      "/api/superadmin/users": {
        get: {
          tags: ["SuperAdmin"],
          summary: "List all users",
          security: sessionSecurity,
          parameters: [
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "clinicId", in: "query", schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
          ],
          responses: {
            "200": { description: "Users list" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
          },
        },
      },
      "/api/superadmin/users/{id}/status": {
        patch: {
          tags: ["SuperAdmin"],
          summary: "Set user active/inactive status",
          security: sessionSecurity,
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: { status: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Status updated" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
          },
        },
      },
      "/api/superadmin/users/{id}/force-reset": {
        post: {
          tags: ["SuperAdmin"],
          summary: "Force password reset for user",
          security: sessionSecurity,
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Reset email sent" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
            "404": { description: "User not found" },
          },
        },
      },
      "/api/superadmin/users/{id}/verify-email": {
        patch: {
          tags: ["SuperAdmin"],
          summary: "Manually verify user email",
          security: sessionSecurity,
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Email marked verified" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
            "404": { description: "User not found" },
          },
        },
      },
      "/api/superadmin/analytics": {
        get: {
          tags: ["SuperAdmin"],
          summary: "Platform analytics",
          security: sessionSecurity,
          responses: {
            "200": { description: "Aggregate platform analytics" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
          },
        },
      },
      "/api/superadmin/config/flags": {
        get: {
          tags: ["SuperAdmin"],
          summary: "List clinic feature flags",
          security: sessionSecurity,
          parameters: [
            { name: "clinicId", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Feature flags" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
          },
        },
      },
      "/api/superadmin/config/flags/{id}": {
        patch: {
          tags: ["SuperAdmin"],
          summary: "Update clinic feature flags",
          security: sessionSecurity,
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true },
              },
            },
          },
          responses: {
            "200": { description: "Flags updated" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
          },
        },
      },
      "/api/superadmin/config/platform": {
        get: {
          tags: ["SuperAdmin"],
          summary: "Get platform config",
          security: sessionSecurity,
          responses: {
            "200": { description: "Platform config" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
          },
        },
        patch: {
          tags: ["SuperAdmin"],
          summary: "Update platform config",
          security: sessionSecurity,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true },
              },
            },
          },
          responses: {
            "200": { description: "Config updated" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
          },
        },
      },
      "/api/superadmin/billing": {
        get: {
          tags: ["SuperAdmin"],
          summary: "List billing records",
          security: sessionSecurity,
          parameters: [
            { name: "clinicId", in: "query", schema: { type: "string" } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
          ],
          responses: {
            "200": { description: "Billing records" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
          },
        },
      },
      "/api/superadmin/billing/{id}/extend-trial": {
        patch: {
          tags: ["SuperAdmin"],
          summary: "Extend trial for clinic",
          security: sessionSecurity,
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["days"],
                  properties: { days: { type: "integer", minimum: 1 } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Trial extended" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
          },
        },
      },
      "/api/superadmin/billing/{id}/status": {
        patch: {
          tags: ["SuperAdmin"],
          summary: "Set billing status",
          security: sessionSecurity,
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: { status: { type: "string" } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Billing status updated" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
            "403": { description: "SuperAdmin role required" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        SessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: cookieName,
          description: "JWT set by POST /api/auth/register or POST /api/auth/login",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        ImpersonationCookie: {
          type: "apiKey",
          in: "cookie",
          name: "medora_impersonation",
          description: "Short-lived JWT set by POST /api/superadmin/clinics/:id/impersonate",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["id", "email", "name", "role", "clinic"],
          properties: {
            id: { type: "string", description: "cuid" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { type: "string", enum: ["Owner", "Doctor", "Receptionist"] },
            clinic: {
              oneOf: [
                {
                  type: "object",
                  required: ["id", "name", "slug"],
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    slug: { type: "string" },
                  },
                },
                { type: "null", description: "Legacy users without a clinic row" },
              ],
            },
          },
        },
        PatientInput: {
          type: "object",
          required: ["name", "phone"],
          properties: {
            name: { type: "string", minLength: 2 },
            phone: { type: "string" },
            email: { type: "string", format: "email" },
            dateOfBirth: { type: "string", format: "date" },
            gender: { type: "string", enum: ["male", "female", "other"] },
            address: { type: "string" },
            notes: { type: "string" },
          },
        },
      },
    },
  };
}
