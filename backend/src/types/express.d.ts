declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        email: string;
        role: "Owner" | "Doctor" | "Receptionist" | "SuperAdmin";
        clinicId?: string;
        isImpersonation?: boolean;
        impersonatedBy?: string;
      };
    }
  }
}

export {};