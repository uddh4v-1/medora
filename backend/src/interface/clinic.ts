export interface IClinic{
  id: string; name: string; slug: string; phone: string;
  address: string | null; city: string | null; state: string | null;
  pincode: string | null; specialties: string[]; description: string | null;
  logoUrl: string | null; brandColor: string | null; createdAt: Date;
}