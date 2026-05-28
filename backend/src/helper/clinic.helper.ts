import {IClinic} from "@/interface/clinic";

export function formatClinic(c: IClinic) {
  return {
    id: c.id, name: c.name, slug: c.slug, phone: c.phone,
    address: c.address, city: c.city, state: c.state, pincode: c.pincode,
    specialties: c.specialties, description: c.description,
    logoUrl: c.logoUrl, brandColor: c.brandColor,
    createdAt: c.createdAt.toISOString(),
  };
}