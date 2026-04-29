export type TeamMemberRow = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Doctor" | "Receptionist";
  specialty: string | null;
  fee: number | null;
};

export type TeamListResponse = {
  items: TeamMemberRow[];
};
