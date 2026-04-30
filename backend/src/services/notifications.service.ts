import { prisma } from "@/lib/prisma";
import { sendBroadcastEmails } from "@/lib/send-broadcast-emails";

export async function saveBroadcast(input: {
  clinicId:       string;
  userId?:        string;
  audience:       string;
  kind:           string;
  title:          string;
  body:           string;
  recipientCount: number;
  patientIds:     string[];
}) {
  const [clinic, patients] = await Promise.all([
    prisma.clinic.findUnique({ where: { id: input.clinicId }, select: { name: true } }),
    prisma.patient.findMany({
      where: { id: { in: input.patientIds }, clinicId: input.clinicId },
      select: { email: true, name: true },
    }),
  ]);

  const withEmail = patients.filter((p): p is { email: string; name: string } =>
    typeof p.email === "string" && p.email.length > 0,
  );

  const deliveredCount = await sendBroadcastEmails({
    clinicName: clinic?.name ?? "Your clinic",
    title: input.title,
    body: input.body,
    recipients: withEmail,
  });

  const broadcast = await prisma.broadcast.create({
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

  return { broadcast, deliveredCount };
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
