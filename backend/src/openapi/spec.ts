import { getEnv } from "@/config/env";

/** OpenAPI 3.0 document for Scalar (`/api/docs`). */
export function getOpenApiSpec(): Record<string, unknown> {
  const env = getEnv();
  const cookieName = env.AUTH_COOKIE_NAME;

  return {
    openapi: "3.0.3",
    info: {
      title: "Medora API",
      version: "0.1.0",
      description:
        "Clinic API (Express + Prisma). Session JWT is stored in an HttpOnly cookie after login; `/me` also accepts `Authorization: Bearer`. Open docs at the **same host/port** you use for the API (e.g. only `localhost` or only `127.0.0.1`) so Try it requests stay same-origin.",
    },
    /**
     * Relative base URL so Scalar “Try it” hits whichever origin you used to open `/api/docs`
     * (`localhost` vs `127.0.0.1` are different origins — a fixed `http://localhost:PORT` breaks CSP + fetch).
     */
    servers: [{ url: "/", description: "Same origin as this page" }],
    tags: [
      { name: "Meta", description: "API metadata and health" },
      { name: "Auth", description: "Authentication (cookie session)" },
      { name: "Dashboard", description: "Clinic dashboard data and operations" },
    ],
    paths: {
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
                      auth: {
                        type: "array",
                        items: { type: "string" },
                      },
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
                      database: {
                        type: "string",
                        enum: ["ok", "unavailable"],
                      },
                      ts: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register clinic + owner",
          description:
            "Creates a **Clinic**, an **Owner** user (linked), and sets HttpOnly session cookie (JWT). Matches the signup UI (`/signup`). Token is not returned in JSON.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: [
                    "clinicName",
                    "phone",
                    "ownerName",
                    "email",
                    "password",
                    "slug",
                    "acceptTerms",
                  ],
                  properties: {
                    clinicName: {
                      type: "string",
                      minLength: 2,
                      description: "Displayed clinic name",
                    },
                    phone: {
                      type: "string",
                      description:
                        "Indian mobile (UI uses +91); normalized server-side to `91XXXXXXXXXX`.",
                    },
                    ownerName: {
                      type: "string",
                      minLength: 2,
                      description: "Owner / doctor display name",
                    },
                    email: { type: "string", format: "email" },
                    password: {
                      type: "string",
                      format: "password",
                      minLength: 8,
                      description: "At least 8 characters",
                    },
                    slug: {
                      type: "string",
                      pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                      maxLength: 60,
                      description:
                        "URL-safe clinic slug (lowercase); must not be reserved or taken",
                    },
                    acceptTerms: {
                      type: "boolean",
                      enum: [true],
                      description: "Must be true",
                    },
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
            "400": { description: "Validation error (e.g. invalid phone)" },
            "409": {
              description: "Email or slug already taken",
            },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          description:
            "Sets HttpOnly session cookie (JWT). Token is not returned in JSON.",
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
                    rememberMe: {
                      type: "boolean",
                      description:
                        "Longer session (JWT + HttpOnly cookie) when true (see JWT_REMEMBER_ME_EXPIRES_IN on server).",
                    },
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
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Current user",
          security: [{ SessionCookie: [] }, { BearerAuth: [] }],
          responses: {
            "200": {
              description: "Current user",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["user"],
                    properties: {
                      user: { $ref: "#/components/schemas/User" },
                    },
                  },
                },
              },
            },
            "401": { description: "Not authenticated" },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout",
          description: "Clears session cookie.",
          responses: {
            "204": { description: "Cookie cleared" },
          },
        },
      },
      "/api/dashboard/overview": {
        get: {
          tags: ["Dashboard"],
          summary: "Dashboard overview",
          security: [{ SessionCookie: [] }, { BearerAuth: [] }],
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
          security: [{ SessionCookie: [] }, { BearerAuth: [] }],
          parameters: [
            { name: "search", in: "query", schema: { type: "string", maxLength: 120 } },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            },
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
          security: [{ SessionCookie: [] }, { BearerAuth: [] }],
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
          security: [{ SessionCookie: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: "visitId",
              in: "path",
              required: true,
              schema: { type: "string", minLength: 1 },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: {
                      type: "string",
                      enum: ["waiting", "in-progress", "completed"],
                    },
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
          security: [{ SessionCookie: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["paid", "unpaid"] },
            },
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            },
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
          security: [{ SessionCookie: [] }, { BearerAuth: [] }],
          parameters: [
            {
              name: "from",
              in: "query",
              required: true,
              schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            },
            {
              name: "to",
              in: "query",
              required: true,
              schema: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
            },
          ],
          responses: {
            "200": { description: "Revenue summary payload" },
            "400": { description: "Validation error" },
            "401": { description: "Not authenticated" },
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
      },
      schemas: {
        User: {
          type: "object",
          required: ["id", "email", "name", "role", "clinic"],
          properties: {
            id: { type: "string", description: "cuid" },
            email: { type: "string", format: "email" },
            name: { type: "string", description: "Display name" },
            role: {
              type: "string",
              enum: ["Owner", "Doctor", "Receptionist"],
            },
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
      },
    },
  };
}
