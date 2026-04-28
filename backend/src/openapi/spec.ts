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
          summary: "Register",
          description:
            "Creates a new user with role **Receptionist**, sets HttpOnly session cookie (JWT). Token is not returned in JSON.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: {
                      type: "string",
                      format: "password",
                      minLength: 8,
                      description: "At least 8 characters",
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
            "400": { description: "Validation error" },
            "409": { description: "Email already registered" },
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
          required: ["id", "email", "role"],
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            role: {
              type: "string",
              enum: ["Owner", "Doctor", "Receptionist"],
            },
          },
        },
      },
    },
  };
}
