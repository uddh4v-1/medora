import { prisma } from "@/lib/prisma";

export async function saveBroadcast(input: {
  clinicId:       string;
  userId?:        string;
  audience:       string;
  kind:           string;
  title:          string;
  body:           string;
  recipientCount: number;
}) {
  return prisma.broadcast.create({
    data: {
      clinicId:       input.clinicId,
      userId:         input.userId ?? null,
      audience:       input.audience,
      kind:           input.kind,
      title:          input.title,
      body:           input.body,
      recipientCount: input.recipientCount,
    },
    select: {
      id: true, audience: true, kind: true,
      title: true, body: true, recipientCount: true, sentAt: true,
    },
  });
}

export async function getBroadcasts(clinicId: string, limit = 50) {
  return prisma.broadcast.findMany({
    where: { clinicId },
    select: {
      id: true, audience: true, kind: true,
      title: true, body: true, recipientCount: true, sentAt: true,
    },
    orderBy: { sentAt: "desc" },
    take: limit,
  });
}
