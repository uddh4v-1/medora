declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` when cookie / bearer token is valid */
      auth?: {
        userId: string;
        email: string;
        role: "Owner" | "Doctor" | "Receptionist";
      };
    }
  }
}

export {};
