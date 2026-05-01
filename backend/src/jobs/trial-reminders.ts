import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { getEnv } from "@/config/env";
import {
  trialEndingPlainText,
  trialEndingHtml,
  trialExpiredPlainText,
  trialExpiredHtml,
} from "@/lib/email-templates/trial";

// Reminders are sent when daysRemaining falls into these exact windows.
// The cron runs once per day so each window is hit exactly once.
const REMINDER_DAYS = [7, 3, 1] as const;

async function sendTrialReminders(): Promise<void> {
  const env = getEnv();
  const upgradeUrl = `${env.APP_ORIGIN}/dashboard/subscription`;
  const now = new Date();

  const subscriptions = await prisma.clinicSubscription.findMany({
    where: { billingStatus: "trial", trialEndsAt: { not: null } },
    select: {
      clinicId: true,
      trialEndsAt: true,
      clinic: {
        select: {
          name: true,
          users: {
            where: { role: "Owner" },
            select: { email: true, name: true },
            take: 1,
          },
        },
      },
    },
  });

  let sent = 0;
  for (const sub of subscriptions) {
    if (!sub.trialEndsAt) continue;

    const owner = sub.clinic.users[0];
    if (!owner) continue;

    const msLeft = sub.trialEndsAt.getTime() - now.getTime();
    const daysLeft = msLeft / (1000 * 60 * 60 * 24);

    const base = {
      clinicName: sub.clinic.name,
      ownerName: owner.name || owner.email,
      upgradeUrl,
    };

    // Expired: trialEndsAt is in the past but within the last 24 h (first run after expiry)
    if (msLeft <= 0 && msLeft > -24 * 60 * 60 * 1000) {
      await sendMail({
        to: owner.email,
        subject: `Your Medora trial for ${sub.clinic.name} has expired`,
        text: trialExpiredPlainText(base),
        html: trialExpiredHtml(base),
      }).catch((e) => console.error("[trial-reminders] expired email failed", e));
      sent++;
      continue;
    }

    // Ending soon: check each reminder milestone (e.g. 6.0 < daysLeft <= 7.0)
    for (const target of REMINDER_DAYS) {
      if (daysLeft > target - 1 && daysLeft <= target) {
        await sendMail({
          to: owner.email,
          subject: `Your Medora trial ends in ${target} day${target === 1 ? "" : "s"}`,
          text: trialEndingPlainText({ ...base, daysRemaining: target }),
          html: trialEndingHtml({ ...base, daysRemaining: target }),
        }).catch((e) => console.error("[trial-reminders] reminder email failed", e));
        sent++;
        break;
      }
    }
  }

  console.info(`[trial-reminders] Processed ${subscriptions.length} trials, sent ${sent} emails`);
}

export function startTrialReminderJob(): void {
  // Run every day at 9:00 AM server time
  cron.schedule("0 9 * * *", () => {
    console.info("[trial-reminders] Starting daily run");
    sendTrialReminders().catch((e) =>
      console.error("[trial-reminders] Job failed:", e),
    );
  });

  console.info("[trial-reminders] Scheduled — runs daily at 09:00");
}
